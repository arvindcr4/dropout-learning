// Main application entry point for the renderer process

// Initialize the app after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Render the main React component
  const container = document.getElementById('app');
  const root = ReactDOM.createRoot(container);
  root.render(<Dashboard />);
});

// API services for web application
const ApiService = {
  // Upload a PDF file
  uploadPDF: async (file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    
    const response = await fetch('/api/upload-pdf', {
      method: 'POST',
      body: formData
    });
    
    return response.json();
  },
  
  // Save lessons to server
  saveLessons: async (lessons) => {
    const response = await fetch('/api/save-lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lessons })
    });
    
    return response.json();
  },
  
  // Get list of saved lesson files
  getSavedLessons: async () => {
    const response = await fetch('/api/saved-lessons');
    return response.json();
  },
  
  // Load lessons from a saved file
  loadLessons: async (filename) => {
    const response = await fetch(`/api/load-lessons/${filename}`);
    return response.json();
  }
};

// Global application state management
class AppState {
  constructor() {
    this.pdfData = null;
    this.extractedText = '';
    this.knowledgeGraph = null;
    this.lessons = [];
    this.currentLesson = null;
    this.currentTopic = null;
    this.loadingStatus = '';
    this.error = null;
    this.listeners = [];
    this.savedFiles = [];
  }

  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners of state change
  notifyChange() {
    this.listeners.forEach(listener => listener(this));
  }

  // Update state and notify listeners
  update(changes) {
    Object.assign(this, changes);
    this.notifyChange();
  }

  // Set loading status
  setLoading(status) {
    this.update({ loadingStatus: status });
  }

  // Set error state
  setError(error) {
    this.update({ error, loadingStatus: '' });
  }

  // Reset error state
  clearError() {
    this.update({ error: null });
  }

  // Process PDF and generate lessons
  async processPDF(file) {
    try {
      this.setLoading('Uploading PDF...');
      
      let pdfBase64;
      
      // Check if we've been given a file object with a 'data' property (this is the sample PDF)
      if (file.data) {
        pdfBase64 = file.data;
      } else {
        // Upload the PDF to the server
        const uploadResult = await ApiService.uploadPDF(file);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.message || 'Failed to upload PDF');
        }
        
        pdfBase64 = uploadResult.pdfBase64;
      }
      
      this.setLoading('Processing PDF...');
      this.update({ pdfData: pdfBase64 });
      
      // Extract text from PDF
      this.setLoading('Extracting text...');
      const extractedText = await PDFProcessor.extractText(pdfBase64);
      this.update({ extractedText });
      
      // Analyze content
      this.setLoading('Analyzing content...');
      const analyzedContent = ContentAnalyzer.analyzeText(extractedText);
      
      // Generate knowledge graph
      this.setLoading('Generating knowledge graph...');
      const knowledgeGraph = KnowledgeGraph.generateFromContent(analyzedContent);
      this.update({ knowledgeGraph });
      
      // Generate lessons
      this.setLoading('Generating lessons...');
      const lessons = LessonGenerator.generateLessons(analyzedContent, knowledgeGraph);
      this.update({ 
        lessons,
        currentLesson: lessons.length > 0 ? lessons[0] : null,
        loadingStatus: '' 
      });
      
      return lessons;
    } catch (error) {
      console.error('Error processing PDF:', error);
      this.setError(`Failed to process PDF: ${error.message}`);
      return null;
    }
  }

  // Save current lessons to file
  async saveLessons() {
    try {
      if (!this.lessons || this.lessons.length === 0) {
        this.setError('No lessons to save');
        return false;
      }
      
      this.setLoading('Saving lessons...');
      const result = await ApiService.saveLessons(this.lessons);
      
      if (result.success) {
        this.setLoading('');
        // Refresh the list of saved files
        this.getSavedLessons();
        return true;
      } else {
        this.setError(`Failed to save lessons: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error saving lessons:', error);
      this.setError(`Failed to save lessons: ${error.message}`);
      return false;
    }
  }

  // Get list of saved lesson files
  async getSavedLessons() {
    try {
      const result = await ApiService.getSavedLessons();
      
      if (result.success) {
        this.update({ savedFiles: result.files });
        return result.files;
      } else {
        console.error('Error getting saved lessons:', result.message);
        return [];
      }
    } catch (error) {
      console.error('Error getting saved lessons:', error);
      return [];
    }
  }

  // Load lessons from file
  async loadLessons(filename) {
    try {
      this.setLoading('Loading lessons...');
      const result = await ApiService.loadLessons(filename);
      
      if (result.success) {
        this.update({
          lessons: result.lessons,
          currentLesson: result.lessons.length > 0 ? result.lessons[0] : null,
          loadingStatus: ''
        });
        return true;
      } else {
        this.setError(`Failed to load lessons: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
      this.setError(`Failed to load lessons: ${error.message}`);
      return false;
    }
  }

  // Set current lesson
  setCurrentLesson(lesson) {
    this.update({ currentLesson: lesson });
  }

  // Set current topic
  setCurrentTopic(topic) {
    this.update({ currentTopic: topic });
  }
}

// Create a global application state
window.appState = new AppState();
