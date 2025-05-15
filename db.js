const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');

// Ensure required directories exist
const DB_DIR = path.join(__dirname, 'databases');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Create a unique filename for each PDF based on its content
function createDbFileNameFromPdf(pdfName, pdfBuffer) {
  const hash = crypto.createHash('md5').update(pdfBuffer).digest('hex').substring(0, 10);
  const sanitizedName = pdfName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${sanitizedName}_${hash}.db`;
}

// Initialize database for a module
function initializeModuleDb(pdfName, pdfBuffer) {
  const dbFileName = createDbFileNameFromPdf(pdfName, pdfBuffer);
  const dbPath = path.join(DB_DIR, dbFileName);
  
  // Open database connection (creates file if it doesn't exist)
  const db = new Database(dbPath);
  
  // Create tables if they don't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS module_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pdf_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      title TEXT,
      description TEXT
    );
    
    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      overview TEXT,
      difficulty_level INTEGER DEFAULT 1,
      estimated_minutes INTEGER DEFAULT 30,
      mastery_required BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (module_id) REFERENCES module_info(id)
    );
    
    CREATE TABLE IF NOT EXISTS knowledge_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      worked_example TEXT,
      visual_aid TEXT,
      sequence_order INTEGER,
      mastery_required BOOLEAN DEFAULT 1,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );
    
    CREATE TABLE IF NOT EXISTS practice_problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      knowledge_point_id INTEGER NOT NULL,
      problem_text TEXT NOT NULL,
      solution TEXT,
      explanation TEXT,
      difficulty INTEGER DEFAULT 1,
      sequence_order INTEGER,
      FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id)
    );
    
    CREATE TABLE IF NOT EXISTS lesson_objectives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      objective TEXT NOT NULL,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );
    
    CREATE TABLE IF NOT EXISTS lesson_prerequisites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      prerequisite_title TEXT NOT NULL,
      prerequisite_description TEXT,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );
    
    CREATE TABLE IF NOT EXISTS lesson_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      sequence_order INTEGER,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );
    
    CREATE TABLE IF NOT EXISTS lesson_principles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      application TEXT,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id)
    );
    
    CREATE TABLE IF NOT EXISTS user_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      knowledge_point_id INTEGER,
      completed BOOLEAN DEFAULT 0,
      mastery_achieved BOOLEAN DEFAULT 0,
      completed_at TIMESTAMP,
      xp_earned INTEGER DEFAULT 0,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id),
      FOREIGN KEY (knowledge_point_id) REFERENCES knowledge_points(id)
    );
    
    CREATE TABLE IF NOT EXISTS daily_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      xp_earned INTEGER DEFAULT 0,
      xp_goal INTEGER DEFAULT 100,
      streak_day INTEGER DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS adaptive_diagnostic (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      knowledge_frontier TEXT,
      identified_gaps TEXT,
      recommended_courses TEXT,
      estimated_completion_days INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS knowledge_graph (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id TEXT NOT NULL,
      topic_name TEXT NOT NULL,
      dependencies TEXT,
      mastery_level INTEGER DEFAULT 0,
      importance_level INTEGER DEFAULT 1
    );
  `);
  
  return {
    db,
    dbPath,
    dbFileName
  };
}

// Store generated lessons in the database
function storeLessons(db, moduleId, lessons) {
  const insertLesson = db.prepare(`
    INSERT INTO lessons (module_id, title, overview)
    VALUES (?, ?, ?)
  `);
  
  const insertObjective = db.prepare(`
    INSERT INTO lesson_objectives (lesson_id, objective)
    VALUES (?, ?)
  `);
  
  const insertPrerequisite = db.prepare(`
    INSERT INTO lesson_prerequisites (lesson_id, prerequisite_title, prerequisite_description)
    VALUES (?, ?, ?)
  `);
  
  const insertSection = db.prepare(`
    INSERT INTO lesson_sections (lesson_id, title, content, sequence_order)
    VALUES (?, ?, ?, ?)
  `);
  
  const insertPrinciple = db.prepare(`
    INSERT INTO lesson_principles (lesson_id, name, application)
    VALUES (?, ?, ?)
  `);
  
  // Use a transaction to ensure data consistency
  const insertLessonTransaction = db.transaction((lesson) => {
    // Insert lesson and get its ID
    const lessonResult = insertLesson.run(moduleId, lesson.title, lesson.overview);
    const lessonId = lessonResult.lastInsertRowid;
    
    // Insert lesson objectives
    if (lesson.objectives && lesson.objectives.length > 0) {
      lesson.objectives.forEach(objective => {
        insertObjective.run(lessonId, objective);
      });
    }
    
    // Insert prerequisites
    if (lesson.prerequisites && lesson.prerequisites.length > 0) {
      lesson.prerequisites.forEach((prereq, index) => {
        insertPrerequisite.run(lessonId, prereq.title, prereq.description);
      });
    }
    
    // Insert sections
    if (lesson.sections && lesson.sections.length > 0) {
      lesson.sections.forEach((section, index) => {
        insertSection.run(lessonId, section.title, section.content, index);
      });
    }
    
    // Insert principles
    if (lesson.principles && lesson.principles.length > 0) {
      lesson.principles.forEach(principle => {
        insertPrinciple.run(lessonId, principle.name, principle.application);
      });
    }
    
    return lessonId;
  });
  
  // Create module entry first
  const insertModule = db.prepare(`
    INSERT INTO module_info (pdf_name, title, description)
    VALUES (?, ?, ?)
  `);
  
  const moduleResult = insertModule.run(
    lessons[0].pdfName || 'Unknown PDF',
    'Generated from ' + (lessons[0].pdfName || 'PDF'),
    'Lessons generated from PDF content analysis'
  );
  
  moduleId = moduleResult.lastInsertRowid;
  
  // Insert all lessons in the transaction
  const lessonIds = lessons.map(lesson => insertLessonTransaction(lesson));
  
  return {
    moduleId,
    lessonIds
  };
}

// Get all lessons from a module
function getLessonsFromModule(db) {
  const module = db.prepare('SELECT * FROM module_info LIMIT 1').get();
  
  if (!module) {
    return null;
  }
  
  const lessons = db.prepare('SELECT * FROM lessons WHERE module_id = ?').all(module.id);
  
  // For each lesson, get its related data
  const populatedLessons = lessons.map(lesson => {
    const objectives = db.prepare('SELECT objective FROM lesson_objectives WHERE lesson_id = ?').all(lesson.id);
    const prerequisites = db.prepare('SELECT prerequisite_title as title, prerequisite_description as description FROM lesson_prerequisites WHERE lesson_id = ?').all(lesson.id);
    const sections = db.prepare('SELECT title, content FROM lesson_sections WHERE lesson_id = ? ORDER BY sequence_order').all(lesson.id);
    const principles = db.prepare('SELECT name, application FROM lesson_principles WHERE lesson_id = ?').all(lesson.id);
    const progress = db.prepare('SELECT completed, xp_earned FROM user_progress WHERE lesson_id = ?').get(lesson.id);
    
    return {
      id: lesson.id,
      title: lesson.title,
      overview: lesson.overview,
      objectives: objectives.map(obj => obj.objective),
      prerequisites: prerequisites,
      sections: sections,
      principles: principles,
      completed: progress ? progress.completed : false,
      xpEarned: progress ? progress.xp_earned : 0
    };
  });
  
  return {
    module,
    lessons: populatedLessons
  };
}

// Update user progress for a specific lesson
function updateLessonProgress(db, lessonId, xpEarned) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Update or insert user progress
  const upsertProgress = db.prepare(`
    INSERT INTO user_progress (lesson_id, completed, completed_at, xp_earned)
    VALUES (?, 1, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(lesson_id) DO UPDATE SET
      completed = 1,
      completed_at = CURRENT_TIMESTAMP,
      xp_earned = ?
  `);
  
  // Update or insert daily goal progress
  const upsertDailyGoal = db.prepare(`
    INSERT INTO daily_goals (date, xp_earned, xp_goal)
    VALUES (?, ?, 100)
    ON CONFLICT(date) DO UPDATE SET
      xp_earned = xp_earned + ?
  `);
  
  // Start a transaction
  const updateTransaction = db.transaction(() => {
    upsertProgress.run(lessonId, xpEarned, xpEarned);
    upsertDailyGoal.run(date, xpEarned, xpEarned);
  });
  
  updateTransaction();
  
  return true;
}

// Get user progress statistics
function getUserProgressStats(db) {
  // Get total XP earned
  const totalXp = db.prepare(`
    SELECT SUM(xp_earned) as total_xp FROM user_progress
  `).get();
  
  // Get today's XP and goal
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dailyProgress = db.prepare(`
    SELECT xp_earned, xp_goal FROM daily_goals WHERE date = ?
  `).get(today) || { xp_earned: 0, xp_goal: 100 };
  
  // Get streak data (last 7 days)
  const days = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const day = {
      date: dateStr,
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
      xp_earned: 0,
      xp_goal: 100,
      completed: false,
      partial: false
    };
    
    // Get XP data for this day if it exists
    const dayData = db.prepare('SELECT xp_earned, xp_goal FROM daily_goals WHERE date = ?').get(dateStr);
    
    if (dayData) {
      day.xp_earned = dayData.xp_earned;
      day.xp_goal = dayData.xp_goal;
      day.completed = dayData.xp_earned >= dayData.xp_goal;
      day.partial = dayData.xp_earned > 0 && dayData.xp_earned < dayData.xp_goal;
    }
    
    days.push(day);
  }
  
  // Get completed lessons count
  const completedLessons = db.prepare(`
    SELECT COUNT(*) as count FROM user_progress WHERE completed = 1
  `).get();
  
  // Get total lessons count
  const totalLessons = db.prepare(`
    SELECT COUNT(*) as count FROM lessons
  `).get();
  
  return {
    totalXp: totalXp.total_xp || 0,
    dailyXp: dailyProgress.xp_earned,
    dailyGoal: dailyProgress.xp_goal,
    streak: days,
    completedLessons: completedLessons.count || 0,
    totalLessons: totalLessons.count || 0,
    progress: totalLessons.count > 0 ? 
      Math.round((completedLessons.count / totalLessons.count) * 100) : 0
  };
}

// Get all available module databases
function getAllModules() {
  // Read all database files
  const dbFiles = fs.readdirSync(DB_DIR).filter(file => file.endsWith('.db'));
  
  return dbFiles.map(dbFile => {
    const dbPath = path.join(DB_DIR, dbFile);
    const db = new Database(dbPath);
    
    // Get module info
    const moduleInfo = db.prepare('SELECT * FROM module_info LIMIT 1').get();
    
    // Get counts
    const lessonCount = db.prepare('SELECT COUNT(*) as count FROM lessons').get();
    const completedCount = db.prepare('SELECT COUNT(*) as count FROM user_progress WHERE completed = 1').get();
    
    db.close();
    
    return {
      dbFile,
      dbPath,
      title: moduleInfo ? moduleInfo.title : 'Unknown Module',
      pdfName: moduleInfo ? moduleInfo.pdf_name : 'Unknown PDF',
      createdAt: moduleInfo ? moduleInfo.created_at : null,
      lessonCount: lessonCount ? lessonCount.count : 0,
      completedCount: completedCount ? completedCount.count : 0,
      progress: lessonCount && lessonCount.count > 0 ? 
        Math.round((completedCount.count / lessonCount.count) * 100) : 0
    };
  });
}

// Get a database connection for a specific module
function getModuleDb(dbFile) {
  const dbPath = path.join(DB_DIR, dbFile);
  
  if (!fs.existsSync(dbPath)) {
    return null;
  }
  
  return new Database(dbPath);
}

module.exports = {
  initializeModuleDb,
  storeLessons,
  getLessonsFromModule,
  updateLessonProgress,
  getUserProgressStats,
  getAllModules,
  getModuleDb
};