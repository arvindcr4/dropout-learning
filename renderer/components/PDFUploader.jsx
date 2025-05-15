/**
 * Component for uploading and processing PDF files
 */
const PDFUploader = ({ onPDFProcessed }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const fileInputRef = React.useRef(null);
  
  // Handle file selection through file input
  const handleFileChange = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };
  
  // Handle click on the uploader to open file dialog
  const handleUploaderClick = () => {
    fileInputRef.current.click();
  };
  
  // Process the selected PDF file
  const processPDF = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    
    try {
      // Call the parent's callback with the file
      await onPDFProcessed(selectedFile);
    } catch (error) {
      console.error('Error processing PDF:', error);
      alert(`Error processing PDF: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Upload Study Material</h3>
      </div>
      <div className="card-body">
        {/* PDF uploader */}
        <div 
          className={`pdf-uploader ${isDragging ? 'active' : ''}`}
          onClick={handleUploaderClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="pdf-uploader-icon">
            📄
          </div>
          <h4 className="pdf-uploader-text">
            {selectedFile ? selectedFile.name : 'Drag & Drop your PDF here or click to browse'}
          </h4>
          <p className="text-muted">
            {selectedFile 
              ? 'Click "Process PDF" to generate lessons' 
              : 'Supported format: PDF'}
          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".pdf"
          />
          
          {selectedFile && (
            <button 
              className="btn btn-primary mt-3"
              onClick={processPDF}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process PDF'}
            </button>
          )}
        </div>
        
        <div className="mt-4">
          <h4>Instructions</h4>
          <ol>
            <li>Upload a PDF document containing study material</li>
            <li>The application will extract text and analyze content</li>
            <li>Based on Math Academy principles, it will generate structured lessons</li>
            <li>A knowledge graph will be created to show relationships between topics</li>
            <li>Explore lessons, prerequisites, and how topics connect to each other</li>
          </ol>
          
          <div className="alert alert-info mt-3">
            <h5>Math Academy Principles Applied:</h5>
            <ul>
              <li><strong>Knowledge Graph:</strong> Visualizing prerequisites and topic relationships</li>
              <li><strong>Scaffolded Mastery Learning:</strong> Ensuring prerequisites are mastered first</li>
              <li><strong>Cognitive Learning Strategies:</strong> Structuring content for optimal learning</li>
              <li><strong>Working Memory:</strong> Breaking complex topics into manageable chunks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
