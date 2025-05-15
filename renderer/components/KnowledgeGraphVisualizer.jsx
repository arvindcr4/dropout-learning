/**
 * Component for visualizing the knowledge graph of topics and their relationships
 */
const KnowledgeGraphVisualizer = ({ graph, onSelectTopic }) => {
  const graphContainerRef = React.useRef(null);
  const [selectedNode, setSelectedNode] = React.useState(null);
  const [visualizer, setVisualizer] = React.useState(null);
  
  // Initialize the graph visualization when the component mounts or graph changes
  React.useEffect(() => {
    if (!graph || !graphContainerRef.current) return;
    
    // Clear previous graph
    graphContainerRef.current.innerHTML = '';
    
    // Initialize graph visualization
    const vis = KnowledgeGraph.visualize(graph, graphContainerRef.current.id, {
      width: graphContainerRef.current.clientWidth,
      height: 500
    });
    
    setVisualizer(vis);
    
    // Add click handlers to nodes
    const svg = d3.select(graphContainerRef.current).select('svg');
    
    svg.selectAll('circle').on('click', (event, d) => {
      // Find the corresponding topic or subtopic
      setSelectedNode(d);
      
      // Highlight the selected node and its connections
      vis.highlight(d.id);
    });
    
    // Cleanup on unmount
    return () => {
      if (graphContainerRef.current) {
        graphContainerRef.current.innerHTML = '';
      }
    };
  }, [graph]);
  
  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      if (visualizer && graphContainerRef.current) {
        // Update width and height
        d3.select(graphContainerRef.current).select('svg')
          .attr('width', graphContainerRef.current.clientWidth)
          .attr('height', 500);
        
        // Restart simulation
        visualizer.update();
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visualizer]);
  
  // Find the selected topic from the selected node
  const getSelectedTopic = () => {
    if (!selectedNode || !graph) return null;
    
    // If this is a topic node, find the corresponding lesson
    const nodeId = selectedNode.id;
    const lesson = window.appState.lessons.find(l => {
      // Compare as strings because they might have different types
      return l.id === `lesson-${nodeId}` || l.id === nodeId;
    });
    
    return lesson;
  };
  
  // Get prerequisites for the selected node
  const getPrerequisites = () => {
    if (!selectedNode || !graph) return [];
    
    return graph.getPrerequisites(selectedNode.id);
  };
  
  // Get topics that depend on the selected node
  const getDependentTopics = () => {
    if (!selectedNode || !graph) return [];
    
    return graph.getDependentTopics(selectedNode.id);
  };
  
  // Handle clicking the "View Lesson" button
  const handleViewLesson = () => {
    const topic = getSelectedTopic();
    if (topic && onSelectTopic) {
      onSelectTopic(topic);
    }
  };
  
  return (
    <div className="knowledge-graph-container">
      <div className="row">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Knowledge Graph</h3>
            </div>
            <div className="card-body p-0">
              <div 
                id="knowledge-graph" 
                className="knowledge-graph" 
                ref={graphContainerRef}>
              </div>
            </div>
            <div className="card-footer">
              <div className="d-flex">
                <div className="mr-3">
                  <span className="badge badge-primary mr-1">&nbsp;</span> Topic
                </div>
                <div className="mr-3">
                  <span className="badge badge-success mr-1">&nbsp;</span> Subtopic
                </div>
                <div className="mr-3">
                  <span className="badge badge-danger mr-1">&nbsp;</span> Prerequisite
                </div>
                <div>
                  <span className="badge badge-secondary mr-1">&nbsp;</span> Connection
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                {selectedNode ? selectedNode.label : 'Topic Information'}
              </h3>
            </div>
            <div className="card-body">
              {selectedNode ? (
                <div>
                  <p><strong>Type:</strong> {selectedNode.type}</p>
                  
                  <div className="mt-3">
                    <h5>Prerequisites:</h5>
                    {getPrerequisites().length > 0 ? (
                      <ul className="list-group">
                        {getPrerequisites().map(prereq => (
                          <li key={prereq.id} className="list-group-item">
                            {prereq.label}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No prerequisites</p>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <h5>Dependent Topics:</h5>
                    {getDependentTopics().length > 0 ? (
                      <ul className="list-group">
                        {getDependentTopics().map(dep => (
                          <li key={dep.id} className="list-group-item">
                            {dep.label}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No dependent topics</p>
                    )}
                  </div>
                  
                  {getSelectedTopic() && (
                    <button 
                      className="btn btn-primary mt-3" 
                      onClick={handleViewLesson}
                    >
                      View Lesson
                    </button>
                  )}
                </div>
              ) : (
                <p>Select a node in the knowledge graph to view details</p>
              )}
            </div>
          </div>
          
          <div className="card mt-3">
            <div className="card-header">
              <h3 className="card-title">Knowledge Graph Info</h3>
            </div>
            <div className="card-body">
              <p>
                The knowledge graph visualizes relationships between topics based on 
                Math Academy principles. Topics that are prerequisites for other topics 
                are connected with arrows.
              </p>
              <p>
                <strong>Tips:</strong>
              </p>
              <ul>
                <li>Click on a node to see its details</li>
                <li>Drag nodes to rearrange the graph</li>
                <li>Use mouse wheel to zoom in/out</li>
                <li>Topic nodes are larger than subtopic nodes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
