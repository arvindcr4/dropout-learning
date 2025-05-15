const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window being closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, recreate window when dock icon is clicked and no other windows are open
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle PDF file selection dialog
ipcMain.handle('select-pdf', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
  });
  
  if (canceled) {
    return null;
  }
  
  return filePaths[0];
});

// Read PDF file
ipcMain.handle('read-pdf', async (event, filePath) => {
  try {
    const pdfBuffer = fs.readFileSync(filePath);
    return pdfBuffer.toString('base64');
  } catch (error) {
    console.error('Error reading PDF file:', error);
    throw error;
  }
});

// Save generated lessons
ipcMain.handle('save-lessons', async (event, lessons) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Generated Lessons',
      defaultPath: path.join(app.getPath('documents'), 'math-academy-lessons.json'),
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2));
      return { success: true, filePath };
    }
    
    return { success: false, message: 'Save operation canceled' };
  } catch (error) {
    console.error('Error saving lessons:', error);
    return { success: false, message: error.message };
  }
});

// Load saved lessons
ipcMain.handle('load-lessons', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Load Saved Lessons',
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    
    if (canceled) {
      return { success: false, message: 'Load operation canceled' };
    }
    
    const data = fs.readFileSync(filePaths[0], 'utf8');
    const lessons = JSON.parse(data);
    
    return { success: true, lessons };
  } catch (error) {
    console.error('Error loading lessons:', error);
    return { success: false, message: error.message };
  }
});
