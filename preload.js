const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // PDF handling
    selectPDF: () => ipcRenderer.invoke('select-pdf'),
    readPDF: (filePath) => ipcRenderer.invoke('read-pdf', filePath),
    
    // Lesson management
    saveLessons: (lessons) => ipcRenderer.invoke('save-lessons', lessons),
    loadLessons: () => ipcRenderer.invoke('load-lessons')
  }
);
