/**
 * Component for viewing a generated lesson
 */
const LessonViewer = ({ lesson, onBack }) => {
  const [activeSection, setActiveSection] = React.useState('overview');
  
  // Calculate how many sections we have
  const sectionCount = lesson.sections.length;
  const hasPractice = lesson.practice && lesson.practice.length > 0;
  const hasAssessment = lesson.assessment;
  const hasPrerequisites = lesson.prerequisites && lesson.prerequisites.length > 0;
  
  // Handle clicking the tab buttons
  const handleTabClick = (section) => {
    setActiveSection(section);
  };
  
  // Render a tab button
  const renderTabButton = (name, label) => {
    return (
      <button 
        className={`btn ${activeSection === name ? 'btn-primary' : 'btn-outline-secondary'} mr-2 mb-2`}
        onClick={() => handleTabClick(name)}
      >
        {label}
      </button>
    );
  };
  
  // Render the content for the active tab
  const renderTabContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="lesson-overview-section">
            <h3 className="lesson-section-title">Overview</h3>
            <p className="lesson-overview">{lesson.overview}</p>
            
            <div className="lesson-objectives mt-4">
              <h4>Learning Objectives</h4>
              <ul>
                {lesson.objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4">
              {hasPrerequisites && (
                <div className="mt-3">
                  <TopicPrerequisites prerequisites={lesson.prerequisites} />
                </div>
              )}
            </div>
          </div>
        );
        
      case 'content':
        return (
          <div className="lesson-content-section">
            {lesson.sections.map((section, index) => (
              <div key={index} className="lesson-section mt-4">
                <h3 className="lesson-section-title">{section.title}</h3>
                <div>{section.content}</div>
              </div>
            ))}
          </div>
        );
        
      case 'practice':
        return (
          <div className="practice-problems-section">
            <h3 className="lesson-section-title">Practice Problems</h3>
            
            {hasPractice ? (
              <div className="practice-problems">
                {lesson.practice.map((problem, index) => (
                  <div key={index} className="practice-problem">
                    <span className="badge badge-info problem-difficulty">
                      {problem.difficulty}
                    </span>
                    <h5>Question {index + 1}</h5>
                    <p>{problem.question}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No practice problems have been generated for this lesson.</p>
            )}
          </div>
        );
        
      case 'assessment':
        return (
          <div className="assessment-section">
            <h3 className="lesson-section-title">Assessment</h3>
            
            {hasAssessment ? (
              <div className="assessment">
                <p>{lesson.assessment.description}</p>
                <h5 className="mt-4">Questions</h5>
                
                {lesson.assessment.questions.map((question, index) => (
                  <div key={index} className="card mb-3">
                    <div className="card-header d-flex justify-content-between">
                      <span>Question {index + 1}</span>
                      <span className="badge badge-primary">{question.points} points</span>
                    </div>
                    <div className="card-body">
                      <p>{question.text}</p>
                      <small className="text-muted">Type: {question.type}</small>
                    </div>
                  </div>
                ))}
                
                <p className="mt-3">
                  <strong>Passing Score:</strong> {lesson.assessment.passingScore} points
                </p>
              </div>
            ) : (
              <p>No assessment has been generated for this lesson.</p>
            )}
          </div>
        );
        
      case 'principles':
        return (
          <div className="principles-section">
            <h3 className="lesson-section-title">Math Academy Principles</h3>
            <p>
              This lesson is structured according to the following Math Academy principles:
            </p>
            
            {lesson.principles.map((principle, index) => (
              <div key={index} className="principle-item">
                <h5 className="principle-name">{principle.name}</h5>
                <p><strong>Description:</strong> {principle.description}</p>
                <p><strong>Application:</strong> {principle.application}</p>
              </div>
            ))}
          </div>
        );
        
      default:
        return <p>Unknown section selected.</p>;
    }
  };
  
  return (
    <div className="lesson-viewer-container">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h2 className="lesson-title mb-0">{lesson.title}</h2>
          <button className="btn btn-outline-secondary" onClick={onBack}>
            Back to Lessons
          </button>
        </div>
        
        <div className="card-body p-0">
          <div className="lesson-tabs p-3 bg-light border-bottom">
            {renderTabButton('overview', 'Overview')}
            {renderTabButton('content', 'Content')}
            {renderTabButton('practice', 'Practice')}
            {renderTabButton('assessment', 'Assessment')}
            {renderTabButton('principles', 'Math Academy Principles')}
          </div>
          
          <div className="lesson-content p-4">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};
