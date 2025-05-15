const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const app = express();
const port = 5000;
const upload = multer({ dest: 'uploads/' });

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    
    return res.json({ 
      success: true, 
      filePath: filePath,
      fileName: req.file.originalname,
      pdfBase64: pdfBase64
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
    
    return res.json({ 
      success: true, 
      filePath: filePath,
      fileName: 'the-math-academy-way.pdf',
      pdfBase64: pdfBase64
    });
  } catch (error) {
    console.error('Error processing sample PDF:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Math Academy Lesson Generator running at http://localhost:${port}`);
});