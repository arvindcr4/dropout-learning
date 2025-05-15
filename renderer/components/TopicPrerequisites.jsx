/**
 * Component for displaying topic prerequisites
 */
const TopicPrerequisites = ({ prerequisites }) => {
  if (!prerequisites || prerequisites.length === 0) {
    return (
      <div className="prerequisites-container">
        <h4>Prerequisites</h4>
        <p>No prerequisites for this topic.</p>
      </div>
    );
  }
  
  return (
    <div className="prerequisites-container">
      <h4>Prerequisites</h4>
      <p>Before starting this lesson, make sure you understand these topics:</p>
      
      <ul className="prerequisites-list">
        {prerequisites.map((prereq, index) => (
          <li key={index} className="prerequisite-item">
            <span className="prerequisite-title">{prereq.title}</span>
            {prereq.description && <span className="prerequisite-description">{prereq.description}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};
