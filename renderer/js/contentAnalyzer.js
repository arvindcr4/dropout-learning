// Content analyzer for processing extracted text and identifying concepts
const ContentAnalyzer = {
  /**
   * Analyzes extracted text to identify key concepts, topics, and relationships
   * @param {string} text - The extracted text from the PDF
   * @returns {Object} - Analyzed content with topics and relationships
   */
  analyzeText: function(text) {
    const result = {
      topics: [],
      concepts: [],
      relationships: [],
      mathAcademyPrinciples: []
    };
    
    // Identify Math Academy principles from the text
    result.mathAcademyPrinciples = this.identifyMathAcademyPrinciples(text);
    
    // Extract topics and concepts
    result.topics = this.extractTopics(text);
    result.concepts = this.extractConcepts(text);
    
    // Identify relationships between topics (prerequisites, etc.)
    result.relationships = this.identifyRelationships(text, result.topics);
    
    return result;
  },
  
  /**
   * Extract main topics from the text
   * @param {string} text - The extracted text
   * @returns {Array} - Array of topic objects
   */
  extractTopics: function(text) {
    const topics = [];
    
    // Split text into lines and look for headings that indicate topics
    const lines = text.split('\n');
    
    // Regular expressions for different heading formats
    const chapterRegex = /^(Chapter\s+\d+[\.:]\s*|[IVX]+\.\s+|[\d]+\.\s+)(.+)$/i;
    const sectionRegex = /^(\d+\.\d+[\.:]\s*|[\d]+\.\d+\.\s+)(.+)$/i;
    
    let currentTopic = null;
    let currentSubtopic = null;
    let topicContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for chapter/main topic
      const chapterMatch = line.match(chapterRegex);
      if (chapterMatch) {
        // Save previous topic if exists
        if (currentTopic) {
          currentTopic.content = topicContent.trim();
          topics.push(currentTopic);
        }
        
        // Create new topic
        currentTopic = {
          id: topics.length + 1,
          title: chapterMatch[2].trim(),
          number: chapterMatch[1].trim().replace(/[^0-9]/g, ''),
          level: 1,
          subtopics: [],
          content: ''
        };
        
        topicContent = '';
        currentSubtopic = null;
        continue;
      }
      
      // Check for section/subtopic
      const sectionMatch = line.match(sectionRegex);
      if (sectionMatch && currentTopic) {
        // Save previous subtopic content if exists
        if (currentSubtopic) {
          currentSubtopic.content = topicContent.trim();
          topicContent = '';
        }
        
        // Create new subtopic
        currentSubtopic = {
          id: `${currentTopic.id}.${currentTopic.subtopics.length + 1}`,
          title: sectionMatch[2].trim(),
          number: sectionMatch[1].trim().replace(/[^0-9.]/g, ''),
          level: 2,
          content: ''
        };
        
        currentTopic.subtopics.push(currentSubtopic);
        continue;
      }
      
      // Add content to current subtopic or topic
      topicContent += line + '\n';
    }
    
    // Save the last topic if exists
    if (currentTopic) {
      currentTopic.content = topicContent.trim();
      topics.push(currentTopic);
    }
    
    return topics;
  },
  
  /**
   * Extract key concepts from the text
   * @param {string} text - The extracted text
   * @returns {Array} - Array of concept objects
   */
  extractConcepts: function(text) {
    const concepts = [];
    
    // Look for terms that are frequently mentioned or defined
    // This is a simplified approach - in a real implementation, 
    // you might use NLP techniques or keyword extraction algorithms
    
    // List of common concept indicators
    const conceptIndicators = [
      'is defined as',
      'refers to',
      'is a',
      'means',
      'is called',
      'is known as'
    ];
    
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for concept definitions
      for (const indicator of conceptIndicators) {
        if (line.includes(indicator)) {
          const parts = line.split(indicator);
          if (parts.length >= 2) {
            const term = parts[0].trim().replace(/^[^a-zA-Z]+/, '');
            const definition = parts[1].trim().replace(/[.,:;]$/, '');
            
            // Only add if the term and definition are meaningful
            if (term.length > 1 && definition.length > 5) {
              concepts.push({
                id: concepts.length + 1,
                term: term,
                definition: definition
              });
            }
          }
        }
      }
    }
    
    return concepts;
  },
  
  /**
   * Identify relationships between topics (prerequisites, connections)
   * @param {string} text - The extracted text
   * @param {Array} topics - Array of identified topics
   * @returns {Array} - Array of relationship objects
   */
  identifyRelationships: function(text, topics) {
    const relationships = [];
    
    // Look for phrases indicating prerequisites or connections
    const prerequisiteIndicators = [
      'prerequisite',
      'requires',
      'depends on',
      'based on',
      'builds on',
      'following',
      'before'
    ];
    
    // Check each topic for mentions of other topics
    for (const topic of topics) {
      const allContent = topic.content + ' ' + topic.subtopics.map(st => st.content).join(' ');
      
      // Check for mentions of other topics
      for (const otherTopic of topics) {
        if (topic.id === otherTopic.id) continue;
        
        // Check if this topic mentions the other topic
        if (allContent.includes(otherTopic.title)) {
          // Check if it's mentioned as a prerequisite
          for (const indicator of prerequisiteIndicators) {
            if (allContent.includes(`${indicator} ${otherTopic.title}`) || 
                allContent.includes(`${otherTopic.title} ${indicator}`)) {
              
              relationships.push({
                source: otherTopic.id,
                target: topic.id,
                type: 'prerequisite',
                description: `${otherTopic.title} is a prerequisite for ${topic.title}`
              });
              
              break;
            }
          }
          
          // If not a prerequisite, it's at least a connection
          if (!relationships.some(r => 
              r.source === otherTopic.id && 
              r.target === topic.id && 
              r.type === 'prerequisite')) {
            
            relationships.push({
              source: otherTopic.id,
              target: topic.id,
              type: 'connection',
              description: `${topic.title} is related to ${otherTopic.title}`
            });
          }
        }
      }
    }
    
    return relationships;
  },
  
  /**
   * Identify Math Academy principles from the text
   * @param {string} text - The extracted text
   * @returns {Array} - Array of principle objects
   */
  identifyMathAcademyPrinciples: function(text) {
    const principles = [];
    
    // List of key Math Academy principles to look for
    const principleKeywords = [
      {
        name: "Knowledge Graph",
        keywords: ["knowledge graph", "prerequisite", "linking topics"]
      },
      {
        name: "Scaffolded Mastery Learning",
        keywords: ["scaffolded mastery", "mastery learning"]
      },
      {
        name: "Prerequisites",
        keywords: ["key prerequisites", "targeted remediation"]
      },
      {
        name: "Working Memory",
        keywords: ["working memory", "sensory memory", "long-term memory"]
      },
      {
        name: "Cognitive Learning Strategies",
        keywords: ["cognitive learning", "learning strategy"]
      },
      {
        name: "Desirable Difficulty",
        keywords: ["desirable difficulty", "illusion of comprehension"]
      },
      {
        name: "Bloom's Two-Sigma Problem",
        keywords: ["two-sigma", "bloom's two-sigma"]
      }
    ];
    
    // Check for principles in the text
    for (const principle of principleKeywords) {
      for (const keyword of principle.keywords) {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          // Find the context around the keyword
          const sentences = this.getSentencesContainingKeyword(text, keyword);
          
          principles.push({
            name: principle.name,
            keyword: keyword,
            context: sentences.length > 0 ? sentences[0] : "",
            allContexts: sentences
          });
          
          // We found a match for this principle, no need to check other keywords
          break;
        }
      }
    }
    
    return principles;
  },
  
  /**
   * Get sentences containing a specific keyword
   * @param {string} text - The text to search in
   * @param {string} keyword - The keyword to look for
   * @returns {Array} - Array of sentences containing the keyword
   */
  getSentencesContainingKeyword: function(text, keyword) {
    const sentences = [];
    
    // Split text into sentences (simplified approach)
    const allSentences = text.split(/(?<=[.!?])\s+/);
    
    // Find sentences containing the keyword
    for (const sentence of allSentences) {
      if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
        sentences.push(sentence.trim());
      }
    }
    
    return sentences;
  }
};
