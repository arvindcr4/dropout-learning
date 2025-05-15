/**
 * Main Dashboard component that acts as the primary container for the application
 */
const Dashboard = () => {
  const [activeTab, setActiveTab] = React.useState('upload');
  const [pdfFile, setPdfFile] = React.useState(null);
  const [processingStatus, setProcessingStatus] = React.useState('');
  const [error, setError] = React.useState(null);
  const [generatedLessons, setGeneratedLessons] = React.useState([]);
  const [currentLesson, setCurrentLesson] = React.useState(null);
  const [knowledgeGraph, setKnowledgeGraph] = React.useState(null);
  const [savedFiles, setSavedFiles] = React.useState([]);
  const [showSavedFilesModal, setShowSavedFilesModal] = React.useState(false);
  
  // Subscribe to application state changes
  React.useEffect(() => {
    const unsubscribe = window.appState.subscribe((state) => {
      setProcessingStatus(state.loadingStatus);
      setError(state.error);
      
      if (state.lessons && state.lessons.length > 0) {
        setGeneratedLessons(state.lessons);
      }
      
      if (state.currentLesson) {
        setCurrentLesson(state.currentLesson);
      }
      
      if (state.knowledgeGraph) {
        setKnowledgeGraph(state.knowledgeGraph);
      }
      
      if (state.savedFiles) {
        setSavedFiles(state.savedFiles);
      }
    });
    
    // Get saved lessons on load
    window.appState.getSavedLessons();
    
    return () => unsubscribe();
  }, []);
  
  // Handle PDF processing
  const handlePDFProcessed = async (file) => {
    setPdfFile({
      name: file.name,
      file: file
    });
    
    try {
      const lessons = await window.appState.processPDF(file);
      if (lessons) {
        setActiveTab('lessons');
      }
    } catch (err) {
      setError(`Error processing PDF: ${err.message}`);
    }
  };
  
  // Handle saving lessons
  const handleSaveLessons = async () => {
    const result = await window.appState.saveLessons();
    if (result) {
      alert('Lessons saved successfully!');
    }
  };
  
  // Handle loading lessons
  const handleLoadLessons = () => {
    setShowSavedFilesModal(true);
    window.appState.getSavedLessons();
  };
  
  // Handle selecting a saved file to load
  const handleSelectSavedFile = async (filename) => {
    const result = await window.appState.loadLessons(filename);
    if (result) {
      setShowSavedFilesModal(false);
      setActiveTab('lessons');
    }
  };
  
  // Handle selecting a lesson
  const handleSelectLesson = (lesson) => {
    window.appState.setCurrentLesson(lesson);
    setActiveTab('lesson-viewer');
  };
  
  // Render error message if present
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="alert alert-danger">
        <strong>Error:</strong> {error}
        <button 
          className="btn btn-sm btn-danger float-right" 
          onClick={() => window.appState.clearError()}>
          Dismiss
        </button>
      </div>
    );
  };
  
  // Render loading state
  const renderLoading = () => {
    if (!processingStatus) return null;
    
    return (
      <div className="alert alert-info">
        <div className="d-flex align-items-center">
          <div className="spinner mr-3" style={{ width: '20px', height: '20px' }}></div>
          <div>{processingStatus}</div>
        </div>
      </div>
    );
  };
  
  // Render saved files modal
  const renderSavedFilesModal = () => {
    if (!showSavedFilesModal) return null;
    
    return (
      <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Load Saved Lessons</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowSavedFilesModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {savedFiles.length > 0 ? (
                <ul className="list-group">
                  {savedFiles.map(file => (
                    <li 
                      key={file.name} 
                      className="list-group-item list-group-item-action"
                      onClick={() => handleSelectSavedFile(file.name)}
                    >
                      {file.name}
                      <small className="text-muted d-block">
                        {new Date(file.created).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No saved lessons found.</p>
              )}
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowSavedFilesModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the current tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <PDFUploader onPDFProcessed={handlePDFProcessed} />
        );
        
      case 'lessons':
        return (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title">Generated Lessons</h3>
              <div>
                <button className="btn btn-sm btn-primary mr-2" onClick={handleSaveLessons}>
                  Save Lessons
                </button>
                <button className="btn btn-sm btn-secondary" onClick={() => setActiveTab('knowledge-graph')}>
                  View Knowledge Graph
                </button>
              </div>
            </div>
            <div className="card-body">
              {generatedLessons.length > 0 ? (
                <div className="list-group">
                  {generatedLessons.map(lesson => (
                    <div 
                      key={lesson.id} 
                      className="list-group-item list-group-item-action cursor-pointer"
                      onClick={() => handleSelectLesson(lesson)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{lesson.title}</h5>
                        {lesson.parentLessonId && (
                          <small className="text-muted">Subtopic</small>
                        )}
                      </div>
                      <p className="mb-1">{lesson.overview.substring(0, 150)}...</p>
                      <small>
                        {lesson.prerequisites && lesson.prerequisites.length > 0 ? (
                          <span>
                            <strong>Prerequisites:</strong> {lesson.prerequisites.map(p => p.title).join(', ')}
                          </span>
                        ) : 'No prerequisites'}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center">
                  <p>No lessons generated yet. Upload a PDF document to get started.</p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
                    Upload PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'lesson-viewer':
        return currentLesson ? (
          <LessonViewer 
            lesson={currentLesson} 
            onBack={() => setActiveTab('lessons')}
          />
        ) : (
          <div className="card">
            <div className="card-body text-center">
              <p>No lesson selected.</p>
              <button className="btn btn-primary" onClick={() => setActiveTab('lessons')}>
                View Lessons
              </button>
            </div>
          </div>
        );
        
      case 'knowledge-graph':
        return (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="card-title">Knowledge Graph</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setActiveTab('lessons')}>
                Back to Lessons
              </button>
            </div>
            <div className="card-body">
              {knowledgeGraph ? (
                <KnowledgeGraphVisualizer graph={knowledgeGraph} onSelectTopic={handleSelectLesson} />
              ) : (
                <div className="text-center">
                  <p>No knowledge graph generated yet.</p>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-center">
            <p>Unknown tab selected.</p>
            <button className="btn btn-primary" onClick={() => setActiveTab('upload')}>
              Go to Upload
            </button>
          </div>
        );
    }
  };
  
  return (
    <div className="dashboard">
      <NavigationBar 
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onSaveLessons={handleSaveLessons}
        onLoadLessons={handleLoadLessons}
        hasLessons={generatedLessons.length > 0}
      />
      
      <div className="container mt-4">
        {renderError()}
        {renderLoading()}
        {renderSavedFilesModal()}
        
        {pdfFile && (
          <div className="mb-4">
            <div className="alert alert-info">
              <strong>Current PDF:</strong> {pdfFile.name}
              {activeTab !== 'upload' && (
                <button 
                  className="btn btn-sm btn-outline-primary float-right"
                  onClick={() => setActiveTab('upload')}
                >
                  Upload Another
                </button>
              )}
            </div>
          </div>
        )}
        
        {renderTabContent()}
      </div>
    </div>
  );
};
