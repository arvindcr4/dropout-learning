// Knowledge Graph generator
const KnowledgeGraph = {
  /**
   * Generate a knowledge graph from analyzed content
   * @param {Object} analyzedContent - The analyzed content with topics and relationships
   * @returns {Object} - The knowledge graph structure
   */
  generateFromContent: function(analyzedContent) {
    const { topics, relationships } = analyzedContent;
    
    // Create nodes for each topic
    const nodes = topics.map(topic => ({
      id: topic.id,
      label: topic.title,
      level: topic.level,
      type: 'topic'
    }));
    
    // Add subtopics as nodes
    topics.forEach(topic => {
      topic.subtopics.forEach(subtopic => {
        nodes.push({
          id: subtopic.id,
          label: subtopic.title,
          parentId: topic.id,
          level: subtopic.level,
          type: 'subtopic'
        });
        
        // Add implicit relationship between topic and subtopic
        relationships.push({
          source: topic.id,
          target: subtopic.id,
          type: 'contains',
          description: `${topic.title} contains ${subtopic.title}`
        });
      });
    });
    
    // Create edges from relationships
    const edges = relationships.map((rel, index) => ({
      id: `e${index}`,
      source: rel.source,
      target: rel.target,
      type: rel.type,
      label: rel.type === 'prerequisite' ? 'prerequisite for' : 
             rel.type === 'contains' ? 'contains' : 'related to'
    }));
    
    return {
      nodes,
      edges,
      
      // Add methods to the graph
      /**
       * Get prerequisites for a topic
       * @param {string|number} topicId - The ID of the topic
       * @returns {Array} - Array of prerequisite nodes
       */
      getPrerequisites: function(topicId) {
        const prerequisites = [];
        
        // Find all edges where this topic is the target and the relationship is 'prerequisite'
        const prerequisiteEdges = this.edges.filter(edge => 
          edge.target === topicId && edge.type === 'prerequisite'
        );
        
        // Get the source nodes
        for (const edge of prerequisiteEdges) {
          const prerequisiteNode = this.nodes.find(node => node.id === edge.source);
          if (prerequisiteNode) {
            prerequisites.push(prerequisiteNode);
          }
        }
        
        return prerequisites;
      },
      
      /**
       * Get topics that depend on a given topic
       * @param {string|number} topicId - The ID of the topic
       * @returns {Array} - Array of dependent nodes
       */
      getDependentTopics: function(topicId) {
        const dependents = [];
        
        // Find all edges where this topic is the source and the relationship is 'prerequisite'
        const dependentEdges = this.edges.filter(edge => 
          edge.source === topicId && edge.type === 'prerequisite'
        );
        
        // Get the target nodes
        for (const edge of dependentEdges) {
          const dependentNode = this.nodes.find(node => node.id === edge.target);
          if (dependentNode) {
            dependents.push(dependentNode);
          }
        }
        
        return dependents;
      },
      
      /**
       * Get all topics connected to a given topic
       * @param {string|number} topicId - The ID of the topic
       * @returns {Array} - Array of connected nodes
       */
      getConnectedTopics: function(topicId) {
        const connected = [];
        
        // Find all edges connected to this topic
        const connectedEdges = this.edges.filter(edge => 
          edge.source === topicId || edge.target === topicId
        );
        
        // Get the connected nodes
        for (const edge of connectedEdges) {
          const connectedId = edge.source === topicId ? edge.target : edge.source;
          const connectedNode = this.nodes.find(node => node.id === connectedId);
          
          if (connectedNode && !connected.some(node => node.id === connectedNode.id)) {
            connected.push({
              ...connectedNode,
              relationship: edge.source === topicId ? 'depends on' : 'prerequisite for'
            });
          }
        }
        
        return connected;
      },
      
      /**
       * Get a learning path from one topic to another
       * @param {string|number} startId - The ID of the starting topic
       * @param {string|number} endId - The ID of the ending topic
       * @returns {Array} - Array of nodes in the learning path
       */
      getLearningPath: function(startId, endId) {
        // Simple breadth-first search to find a path
        const queue = [{ id: startId, path: [startId] }];
        const visited = new Set([startId]);
        
        while (queue.length > 0) {
          const { id, path } = queue.shift();
          
          // If we reached the end, return the path
          if (id === endId) {
            return path.map(nodeId => this.nodes.find(node => node.id === nodeId));
          }
          
          // Find all connected nodes
          const connectedEdges = this.edges.filter(edge => edge.source === id);
          
          for (const edge of connectedEdges) {
            if (!visited.has(edge.target)) {
              visited.add(edge.target);
              queue.push({
                id: edge.target,
                path: [...path, edge.target]
              });
            }
          }
        }
        
        // No path found
        return [];
      }
    };
  },
  
  /**
   * Visualize the knowledge graph using D3.js
   * @param {Object} graph - The knowledge graph structure
   * @param {string} containerId - The ID of the container element
   * @param {Object} options - Visualization options
   */
  visualize: function(graph, containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear any existing visualization
    container.innerHTML = '';
    
    // Set up default options
    const defaultOptions = {
      width: container.clientWidth,
      height: 500,
      nodeRadius: 10,
      linkDistance: 100,
      colors: {
        topic: '#3498db',
        subtopic: '#2ecc71',
        prerequisite: '#e74c3c',
        connection: '#95a5a6',
        contains: '#f39c12'
      }
    };
    
    const config = { ...defaultOptions, ...options };
    
    // Create SVG element
    const svg = d3.select(`#${containerId}`)
      .append('svg')
      .attr('width', config.width)
      .attr('height', config.height);
    
    // Create arrow marker for directed edges
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('xoverflow', 'visible')
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .style('stroke', 'none');
    
    // Create a force simulation
    const simulation = d3.forceSimulation(graph.nodes)
      .force('link', d3.forceLink(graph.edges).id(d => d.id).distance(config.linkDistance))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(config.width / 2, config.height / 2))
      .force('collision', d3.forceCollide().radius(20));
    
    // Create links
    const link = svg.append('g')
      .selectAll('line')
      .data(graph.edges)
      .enter().append('line')
      .attr('stroke-width', d => d.type === 'prerequisite' ? 2 : 1)
      .attr('stroke', d => config.colors[d.type] || '#999')
      .attr('marker-end', 'url(#arrowhead)');
    
    // Create nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(graph.nodes)
      .enter().append('circle')
      .attr('r', d => d.type === 'topic' ? config.nodeRadius : config.nodeRadius * 0.7)
      .attr('fill', d => config.colors[d.type])
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Add labels to nodes
    const label = svg.append('g')
      .selectAll('text')
      .data(graph.nodes)
      .enter().append('text')
      .text(d => d.label)
      .attr('font-size', 10)
      .attr('dx', 12)
      .attr('dy', 4);
    
    // Add titles for hover effect
    node.append('title')
      .text(d => d.label);
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
    
    // Drag functions
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Add zoom functionality
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        svg.selectAll('g').attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    return {
      simulation,
      update: function() {
        simulation.alpha(0.3).restart();
      },
      highlight: function(nodeId) {
        // Reset all nodes and links
        node.attr('fill', d => config.colors[d.type]);
        link.attr('stroke', d => config.colors[d.type] || '#999');
        
        // Highlight the selected node and its connections
        node
          .filter(d => d.id === nodeId)
          .attr('fill', '#f1c40f');
        
        link
          .filter(d => d.source.id === nodeId || d.target.id === nodeId)
          .attr('stroke', '#f1c40f');
      }
    };
  }
};
