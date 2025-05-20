const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const Database = require('better-sqlite3');
const dbHelper = require('./db');

const app = express();
const port = 5000;
const upload = multer({ dest: 'uploads/' });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// Create saved-lessons directory if it doesn't exist
if (!fs.existsSync('saved-lessons')) {
  fs.mkdirSync('saved-lessons', { recursive: true });
}

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for diagnostic page
app.get('/diagnostic', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'diagnostic.html'));
});

// Route for knowledge point page
app.get('/knowledge-point/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'knowledge-point.html'));
});

// Route for interactive code editor
app.get('/code-editor/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'code-editor.html'));
});

// Route for knowledge graph visualization
app.get('/knowledge-graph', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'knowledge-graph.html'));
});

// Handle PDF upload
app.post('/api/upload-pdf', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  
  try {
    const filePath = req.file.path;
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Initialize database for this PDF
    const { db, dbPath, dbFileName } = dbHelper.initializeModuleDb(
      req.file.originalname, 
      pdfBuffer
    );
    
    return res.json({ 
      success: true, 
      filePath: filePath,
      fileName: req.file.originalname,
      pdfBase64: pdfBase64,
      dbFile: dbFileName
    });
  } catch (error) {
    console.error('Error processing uploaded PDF:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Handle PDF file from assets
app.get('/api/sample-pdf', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'attached_assets', 'the-math-academy-way.pdf');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Sample PDF not found' });
    }
    
    const pdfBuffer = fs.readFileSync(filePath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Initialize database for this PDF
    const { db, dbPath, dbFileName } = dbHelper.initializeModuleDb(
      'the-math-academy-way.pdf', 
      pdfBuffer
    );
    
    return res.json({ 
      success: true, 
      filePath: filePath,
      fileName: 'the-math-academy-way.pdf',
      pdfBase64: pdfBase64,
      dbFile: dbFileName
    });
  } catch (error) {
    console.error('Error processing sample PDF:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Generate and save lessons for a PDF
app.post('/api/generate-lessons', (req, res) => {
  try {
    const { dbFile, lessons } = req.body;
    
    if (!dbFile || !lessons || !Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request: dbFile and lessons array required' 
      });
    }
    
    // Get database connection
    const db = dbHelper.getModuleDb(dbFile);
    
    if (!db) {
      return res.status(404).json({ 
        success: false, 
        message: 'Database file not found' 
      });
    }
    
    // Store lessons in the database
    const { moduleId, lessonIds } = dbHelper.storeLessons(db, 1, lessons);
    
    db.close();
    
    return res.json({ 
      success: true, 
      moduleId,
      lessonIds,
      dbFile
    });
    
  } catch (error) {
    console.error('Error generating lessons:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get available modules
app.get('/api/modules', (req, res) => {
  try {
    const modules = dbHelper.getAllModules();
    
    return res.json({ 
      success: true, 
      modules
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get lessons for a specific module
app.get('/api/modules/:dbFile/lessons', (req, res) => {
  try {
    const { dbFile } = req.params;
    
    // Get database connection
    const db = dbHelper.getModuleDb(dbFile);
    
    if (!db) {
      return res.status(404).json({ 
        success: false, 
        message: 'Module not found' 
      });
    }
    
    // Get lessons from database
    const moduleData = dbHelper.getLessonsFromModule(db);
    
    if (!moduleData) {
      db.close();
      return res.status(404).json({ 
        success: false, 
        message: 'No lessons found for this module' 
      });
    }
    
    // Get progress statistics
    const stats = dbHelper.getUserProgressStats(db);
    
    db.close();
    
    return res.json({ 
      success: true, 
      module: moduleData.module,
      lessons: moduleData.lessons,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update lesson progress / mark as complete
app.post('/api/modules/:dbFile/lessons/:lessonId/complete', (req, res) => {
  try {
    const { dbFile, lessonId } = req.params;
    const { xpEarned } = req.body;
    
    if (!xpEarned || isNaN(parseInt(xpEarned))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid XP amount' 
      });
    }
    
    // Get database connection
    const db = dbHelper.getModuleDb(dbFile);
    
    if (!db) {
      return res.status(404).json({ 
        success: false, 
        message: 'Module not found' 
      });
    }
    
    // Update progress
    dbHelper.updateLessonProgress(db, lessonId, parseInt(xpEarned));
    
    // Get updated progress statistics
    const stats = dbHelper.getUserProgressStats(db);
    
    db.close();
    
    return res.json({ 
      success: true, 
      lessonId,
      stats
    });
    
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get knowledge points for a lesson
app.get('/api/modules/:dbFile/lessons/:lessonId/knowledge-points', (req, res) => {
  try {
    const { dbFile, lessonId } = req.params;
    
    // Get database connection
    const db = dbHelper.getModuleDb(dbFile);
    
    if (!db) {
      return res.status(404).json({ 
        success: false, 
        message: 'Module not found' 
      });
    }
    
    // Query knowledge points
    const knowledgePoints = db.prepare(`
      SELECT * FROM knowledge_points 
      WHERE lesson_id = ? 
      ORDER BY sequence_order
    `).all(lessonId);
    
    // For each knowledge point, get practice problems
    const knowledgePointsWithProblems = knowledgePoints.map(kp => {
      const problems = db.prepare(`
        SELECT * FROM practice_problems 
        WHERE knowledge_point_id = ? 
        ORDER BY sequence_order
      `).all(kp.id);
      
      return {
        ...kp,
        problems
      };
    });
    
    db.close();
    
    return res.json({ 
      success: true, 
      knowledgePoints: knowledgePointsWithProblems
    });
    
  } catch (error) {
    console.error('Error fetching knowledge points:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get a specific knowledge point with practice problems
app.get('/api/knowledge-points/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the database file for this knowledge point
    const dbFiles = fs.readdirSync('databases').filter(file => file.endsWith('.db'));
    
    let knowledgePoint = null;
    let problems = [];
    
    for (const dbFile of dbFiles) {
      const db = dbHelper.getModuleDb(dbFile);
      
      // Check if this knowledge point exists in this database
      const kp = db.prepare(`
        SELECT * FROM knowledge_points WHERE id = ?
      `).get(id);
      
      if (kp) {
        knowledgePoint = kp;
        
        // Get practice problems
        problems = db.prepare(`
          SELECT * FROM practice_problems 
          WHERE knowledge_point_id = ? 
          ORDER BY sequence_order
        `).all(id);
        
        // Get lesson info
        const lesson = db.prepare(`
          SELECT * FROM lessons WHERE id = ?
        `).get(kp.lesson_id);
        
        knowledgePoint.lesson = lesson;
        
        db.close();
        break;
      }
      
      db.close();
    }
    
    if (!knowledgePoint) {
      return res.status(404).json({ 
        success: false, 
        message: 'Knowledge point not found' 
      });
    }
    
    return res.json({ 
      success: true, 
      knowledgePoint,
      problems
    });
    
  } catch (error) {
    console.error('Error fetching knowledge point:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Handle adaptive diagnostic
app.post('/api/diagnostic', (req, res) => {
  try {
    const { responses } = req.body;
    
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid diagnostic responses' 
      });
    }
    
    // Create a new diagnostic record
    const db = new Database(':memory:');
    
    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS adaptive_diagnostic (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        knowledge_frontier TEXT,
        identified_gaps TEXT,
        recommended_courses TEXT,
        estimated_completion_days INTEGER
      );
    `);
    
    // Calculate diagnostic results based on responses
    // In a real implementation, this would use more sophisticated algorithms
    
    // Count correct answers
    let correctCount = 0;
    responses.forEach(response => {
      if (response.selectedAnswer === response.correctAnswer) {
        correctCount++;
      }
    });
    
    // Calculate score as percentage
    const score = Math.round((correctCount / responses.length) * 100);
    
    // Determine knowledge frontier
    let frontier = 'Intermediate';
    let gaps = [];
    let recommendedCourse = 'Intermediate Algebra';
    let estimatedDays = 90;
    
    if (score < 40) {
      frontier = 'Beginner';
      recommendedCourse = 'Algebra Fundamentals';
      estimatedDays = 120;
      gaps = ['Basic Equation Solving', 'Order of Operations', 'Properties of Numbers'];
    } else if (score < 70) {
      frontier = 'Intermediate';
      recommendedCourse = 'Intermediate Algebra';
      estimatedDays = 90;
      gaps = ['Systems of Equations', 'Polynomial Operations'];
    } else {
      frontier = 'Advanced';
      recommendedCourse = 'Pre-Calculus';
      estimatedDays = 60;
      gaps = ['Advanced Function Analysis', 'Trigonometric Identities'];
    }
    
    // Insert diagnostic record
    const insertDiagnostic = db.prepare(`
      INSERT INTO adaptive_diagnostic (
        completed_at,
        knowledge_frontier,
        identified_gaps,
        recommended_courses,
        estimated_completion_days
      )
      VALUES (CURRENT_TIMESTAMP, ?, ?, ?, ?)
    `);
    
    const result = insertDiagnostic.run(
      frontier,
      JSON.stringify(gaps),
      recommendedCourse,
      estimatedDays
    );
    
    // Get created diagnostic
    const diagnostic = db.prepare(`
      SELECT * FROM adaptive_diagnostic WHERE id = ?
    `).get(result.lastInsertRowid);
    
    db.close();
    
    return res.json({ 
      success: true, 
      diagnostic: {
        ...diagnostic,
        score,
        identified_gaps: JSON.parse(diagnostic.identified_gaps),
        daily_xp_options: [
          { xp: 50, days: Math.ceil(estimatedDays * 2) },
          { xp: 100, days: estimatedDays },
          { xp: 150, days: Math.ceil(estimatedDays * 0.67) },
          { xp: 200, days: Math.ceil(estimatedDays * 0.5) }
        ]
      }
    });
    
  } catch (error) {
    console.error('Error processing diagnostic:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update knowledge point progress / mark as mastered
app.post('/api/knowledge-points/:id/mastery', (req, res) => {
  try {
    const { id } = req.params;
    const { xpEarned, correctAnswers, totalProblems } = req.body;
    
    if (!xpEarned || isNaN(parseInt(xpEarned))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid XP amount' 
      });
    }
    
    // Get the database file for this knowledge point
    const dbFiles = fs.readdirSync('databases').filter(file => file.endsWith('.db'));
    
    let dbFile = null;
    let lessonId = null;
    
    for (const file of dbFiles) {
      const db = dbHelper.getModuleDb(file);
      
      // Check if this knowledge point exists in this database
      const kp = db.prepare(`
        SELECT * FROM knowledge_points WHERE id = ?
      `).get(id);
      
      if (kp) {
        dbFile = file;
        lessonId = kp.lesson_id;
        db.close();
        break;
      }
      
      db.close();
    }
    
    if (!dbFile || !lessonId) {
      return res.status(404).json({ 
        success: false, 
        message: 'Knowledge point not found' 
      });
    }
    
    // Now update the progress
    const db = dbHelper.getModuleDb(dbFile);
    
    // Update knowledge point progress
    const masteryCriteria = correctAnswers >= Math.ceil(totalProblems * 0.6); // 60% correct = mastery
    
    const updateProgress = db.prepare(`
      INSERT INTO user_progress (
        lesson_id, 
        knowledge_point_id, 
        completed,
        mastery_achieved,
        completed_at,
        xp_earned
      )
      VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(knowledge_point_id) DO UPDATE SET
        completed = 1,
        mastery_achieved = ?,
        completed_at = CURRENT_TIMESTAMP,
        xp_earned = xp_earned + ?
    `);
    
    updateProgress.run(
      lessonId, 
      id, 
      masteryCriteria ? 1 : 0, 
      xpEarned,
      masteryCriteria ? 1 : 0,
      xpEarned
    );
    
    // Also update daily XP goal
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const updateDailyGoal = db.prepare(`
      INSERT INTO daily_goals (date, xp_earned, xp_goal)
      VALUES (?, ?, 100)
      ON CONFLICT(date) DO UPDATE SET
        xp_earned = xp_earned + ?
    `);
    
    updateDailyGoal.run(date, xpEarned, xpEarned);
    
    // Get updated progress statistics
    const stats = dbHelper.getUserProgressStats(db);
    
    // Check if all knowledge points for this lesson are mastered
    const lessonKnowledgePoints = db.prepare(`
      SELECT COUNT(*) as total FROM knowledge_points WHERE lesson_id = ?
    `).get(lessonId);
    
    const masteredKnowledgePoints = db.prepare(`
      SELECT COUNT(*) as total FROM user_progress 
      WHERE lesson_id = ? AND mastery_achieved = 1
    `).get(lessonId);
    
    const lessonComplete = masteredKnowledgePoints.total === lessonKnowledgePoints.total;
    
    // If all knowledge points are mastered, mark the lesson as complete
    if (lessonComplete) {
      const updateLesson = db.prepare(`
        INSERT INTO user_progress (
          lesson_id, 
          completed,
          completed_at,
          xp_earned
        )
        VALUES (?, 1, CURRENT_TIMESTAMP, 0)
        ON CONFLICT(lesson_id) DO UPDATE SET
          completed = 1,
          completed_at = CURRENT_TIMESTAMP
      `);
      
      updateLesson.run(lessonId);
    }
    
    db.close();
    
    return res.json({ 
      success: true, 
      mastered: masteryCriteria,
      lessonComplete,
      stats
    });
    
  } catch (error) {
    console.error('Error updating knowledge point progress:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Dropout Learning running at http://localhost:${port}`);
});