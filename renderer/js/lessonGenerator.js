// Lesson Generator utility
const LessonGenerator = {
  /**
   * Generate lessons based on analyzed content and knowledge graph
   * @param {Object} analyzedContent - Analyzed content from ContentAnalyzer
   * @param {Object} knowledgeGraph - Knowledge graph from KnowledgeGraph
   * @returns {Array} - Array of lesson objects
   */
  generateLessons: function(analyzedContent, knowledgeGraph) {
    const { topics, concepts, relationships, mathAcademyPrinciples } = analyzedContent;
    const lessons = [];
    
    // Identify Math Academy principles to apply to our lesson structure
    const appliedPrinciples = this.identifyApplicablePrinciples(mathAcademyPrinciples);
    
    // Sort topics based on prerequisite relationships
    const sortedTopics = this.sortTopicsBasedOnPrerequisites(topics, relationships);
    
    // Generate lessons for each topic
    for (const topic of sortedTopics) {
      // Identify prerequisites for this topic
      const prerequisites = relationships
        .filter(rel => rel.target === topic.id && rel.type === 'prerequisite')
        .map(rel => {
          const prereqTopic = topics.find(t => t.id === rel.source);
          return prereqTopic ? {
            id: prereqTopic.id,
            title: prereqTopic.title,
            description: rel.description
          } : null;
        })
        .filter(Boolean);
      
      // Create a lesson for this topic
      const lesson = {
        id: `lesson-${topic.id}`,
        title: topic.title,
        overview: this.generateOverview(topic),
        objectives: this.generateLearningObjectives(topic),
        prerequisites: prerequisites,
        sections: this.generateSections(topic),
        practice: this.generatePracticeProblems(topic),
        assessment: this.generateAssessment(topic),
        furtherResources: this.generateFurtherResources(topic, concepts),
        principles: this.applyMathAcademyPrinciples(topic, appliedPrinciples)
      };
      
      lessons.push(lesson);
      
      // Generate additional lessons for subtopics if they are substantial
      for (const subtopic of topic.subtopics) {
        if (subtopic.content && subtopic.content.length > 200) {
          const subtopicLesson = {
            id: `lesson-${subtopic.id}`,
            parentLessonId: lesson.id,
            title: subtopic.title,
            overview: this.generateOverview(subtopic),
            objectives: this.generateLearningObjectives(subtopic),
            prerequisites: [{
              id: topic.id,
              title: topic.title,
              description: `Understanding of ${topic.title} is required for this lesson`
            }],
            sections: [{
              title: 'Introduction',
              content: subtopic.content
            }],
            practice: this.generatePracticeProblems(subtopic),
            assessment: this.generateAssessment(subtopic),
            furtherResources: this.generateFurtherResources(subtopic, concepts),
            principles: this.applyMathAcademyPrinciples(subtopic, appliedPrinciples)
          };
          
          lessons.push(subtopicLesson);
        }
      }
    }
    
    return lessons;
  },
  
  /**
   * Sort topics based on prerequisite relationships
   * @param {Array} topics - Array of topic objects
   * @param {Array} relationships - Array of relationship objects
   * @returns {Array} - Sorted array of topics
   */
  sortTopicsBasedOnPrerequisites: function(topics, relationships) {
    // Create a directed graph where edges point from a prerequisite to the
    // topic that depends on it. This orientation ensures that a topic appears
    // after all of its prerequisites in the final ordering.
    const graph = {};
    const inDegree = {};

    // Initialize graph and indegree map
    topics.forEach(topic => {
      graph[topic.id] = [];
      inDegree[topic.id] = 0;
    });

    // Populate edges and compute in-degree for targets
    relationships.forEach(rel => {
      if (
        rel.type === 'prerequisite' &&
        graph[rel.source] !== undefined &&
        graph[rel.target] !== undefined
      ) {
        graph[rel.source].push(rel.target);
        inDegree[rel.target]++;

      }
    });

    // Kahn's algorithm for topological sorting
    const queue = Object.keys(inDegree).filter(id => inDegree[id] === 0);
    const result = [];

    const inDegree = {};
    const queue = [];
    
    // Initialize in-degree for all nodes
    Object.keys(graph).forEach(node => {
      inDegree[node] = 0;
    });
    
    // Calculate in-degree for each node based on incoming edges
    Object.keys(graph).forEach(node => {
      graph[node].forEach(dependent => {
        inDegree[dependent] = (inDegree[dependent] || 0) + 1;
      });
    });
    
    // Add nodes with in-degree 0 to the queue
    Object.keys(inDegree).forEach(node => {
      if (inDegree[node] === 0) {
        queue.push(node);
      }
    });
    
    // Process the queue

    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node);

      graph[node].forEach(next => {
        inDegree[next]--;
        if (inDegree[next] === 0) {
          queue.push(next);
        }
      });
    }

    // Map sorted IDs back to topic objects
    return result
      .map(id => topics.find(topic => topic.id.toString() === id.toString()))
      .filter(Boolean);
  },
  
  /**
   * Generate an overview for a topic or subtopic
   * @param {Object} topic - Topic or subtopic object
   * @returns {string} - Generated overview
   */
  generateOverview: function(topic) {
    // Extract the first few sentences from the topic content
    const content = topic.content || '';
    const sentences = content.split(/[.!?][\s\n]+/).filter(s => s.trim().length > 0);
    
    // Use the first 2-3 sentences as an overview, or generate one if not available
    if (sentences.length >= 2) {
      return sentences.slice(0, 3).join('. ') + '.';
    } else {
      return `This lesson covers ${topic.title}, exploring key concepts and applications.`;
    }
  },
  
  /**
   * Generate learning objectives for a topic or subtopic
   * @param {Object} topic - Topic or subtopic object
   * @returns {Array} - Array of learning objective strings
   */
  generateLearningObjectives: function(topic) {
    const objectives = [];
    const content = topic.content || '';
    
    // Look for key terms and concepts
    const terms = this.extractKeyTerms(content);
    
    // Generate objectives based on Bloom's taxonomy verbs
    const bloomsVerbs = {
      remember: ['define', 'describe', 'identify', 'list', 'recognize', 'recall'],
      understand: ['explain', 'interpret', 'classify', 'compare', 'summarize', 'infer'],
      apply: ['apply', 'implement', 'use', 'execute', 'demonstrate', 'solve'],
      analyze: ['analyze', 'differentiate', 'organize', 'attribute', 'compare', 'deconstruct'],
      evaluate: ['evaluate', 'assess', 'critique', 'judge', 'test', 'monitor'],
      create: ['create', 'design', 'formulate', 'develop', 'construct', 'produce']
    };
    
    // Add a basic understanding objective
    const understandVerb = bloomsVerbs.understand[Math.floor(Math.random() * bloomsVerbs.understand.length)];
    objectives.push(`${understandVerb} the concepts of ${topic.title}`);
    
    // Add objectives for key terms
    if (terms.length > 0) {
      const rememberVerb = bloomsVerbs.remember[Math.floor(Math.random() * bloomsVerbs.remember.length)];
      objectives.push(`${rememberVerb} key terms including ${terms.slice(0, 3).join(', ')}`);
    }
    
    // Add an application objective
    const applyVerb = bloomsVerbs.apply[Math.floor(Math.random() * bloomsVerbs.apply.length)];
    objectives.push(`${applyVerb} the principles of ${topic.title} to solve problems`);
    
    // Add an analysis objective if the topic seems advanced enough
    if (topic.level >= 2 || topic.title.includes('Analysis') || topic.title.includes('Evaluation')) {
      const analyzeVerb = bloomsVerbs.analyze[Math.floor(Math.random() * bloomsVerbs.analyze.length)];
      objectives.push(`${analyzeVerb} complex problems related to ${topic.title}`);
    }
    
    return objectives;
  },
  
  /**
   * Extract key terms from content
   * @param {string} content - The content text
   * @returns {Array} - Array of key term strings
   */
  extractKeyTerms: function(content) {
    const terms = [];
    
    // Look for terms that are italicized, bolded, or explicitly stated as key terms
    const boldedTerms = content.match(/\*\*([^*]+)\*\*/g) || [];
    boldedTerms.forEach(term => {
      terms.push(term.replace(/\*\*/g, ''));
    });
    
    const italicizedTerms = content.match(/\*([^*]+)\*/g) || [];
    italicizedTerms.forEach(term => {
      terms.push(term.replace(/\*/g, ''));
    });
    
    // Look for "key term" or "important concept" phrases
    const keyTermPhrases = [
      'key term is',
      'key concept is',
      'important term is',
      'defined as',
      'refers to'
    ];
    
    const lines = content.split('\n');
    for (const line of lines) {
      for (const phrase of keyTermPhrases) {
        if (line.includes(phrase)) {
          const parts = line.split(phrase);
          if (parts.length >= 2) {
            const term = parts[0].trim().split(' ').slice(-2).join(' ');
            if (term.length > 2 && !terms.includes(term)) {
              terms.push(term);
            }
          }
        }
      }
    }
    
    return terms;
  },
  
  /**
   * Generate sections for a lesson
   * @param {Object} topic - Topic object
   * @returns {Array} - Array of section objects
   */
  generateSections: function(topic) {
    const sections = [];
    
    // Always start with an introduction
    sections.push({
      title: 'Introduction',
      content: this.generateOverview(topic)
    });
    
    // If the topic has subtopics, use them as sections
    if (topic.subtopics && topic.subtopics.length > 0) {
      for (const subtopic of topic.subtopics) {
        sections.push({
          title: subtopic.title,
          content: subtopic.content || 'Content for this section will be developed based on the topic.'
        });
      }
    } else {
      // Otherwise, try to divide the content into logical sections
      const content = topic.content || '';
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      
      if (paragraphs.length >= 3) {
        // If we have enough paragraphs, create sections
        sections.push({
          title: 'Key Concepts',
          content: paragraphs.slice(0, Math.ceil(paragraphs.length / 3)).join('\n\n')
        });
        
        sections.push({
          title: 'Detailed Explanation',
          content: paragraphs.slice(Math.ceil(paragraphs.length / 3), Math.ceil(paragraphs.length * 2 / 3)).join('\n\n')
        });
        
        sections.push({
          title: 'Applications',
          content: paragraphs.slice(Math.ceil(paragraphs.length * 2 / 3)).join('\n\n')
        });
      } else {
        // Not enough content to split meaningfully
        sections.push({
          title: 'Content',
          content: content
        });
      }
    }
    
    // Add a summary section
    sections.push({
      title: 'Summary',
      content: `This lesson covered the main concepts of ${topic.title}. We explored key ideas and applications that will be important for future topics.`
    });
    
    return sections;
  },
  
  /**
   * Generate practice problems for a topic
   * @param {Object} topic - Topic object
   * @returns {Array} - Array of practice problem objects
   */
  generatePracticeProblems: function(topic) {
    // In a real implementation, this would generate actual problems
    // Here we'll just create placeholder problems
    return [
      {
        id: `practice-${topic.id}-1`,
        question: `Demonstrate your understanding of ${topic.title} by explaining its key concepts.`,
        type: 'open-ended',
        difficulty: 'medium'
      },
      {
        id: `practice-${topic.id}-2`,
        question: `Apply the principles of ${topic.title} to solve a real-world problem.`,
        type: 'open-ended',
        difficulty: 'hard'
      },
      {
        id: `practice-${topic.id}-3`,
        question: `Explain how ${topic.title} relates to other concepts in this subject.`,
        type: 'open-ended',
        difficulty: 'medium'
      }
    ];
  },
  
  /**
   * Generate an assessment for a topic
   * @param {Object} topic - Topic object
   * @returns {Object} - Assessment object
   */
  generateAssessment: function(topic) {
    // In a real implementation, this would generate actual assessment questions
    // Here we'll just create a placeholder assessment
    return {
      id: `assessment-${topic.id}`,
      title: `${topic.title} Assessment`,
      description: `This assessment covers the key concepts and applications of ${topic.title}.`,
      questions: [
        {
          id: `q-${topic.id}-1`,
          text: `Define and explain the main concepts of ${topic.title}.`,
          type: 'short-answer',
          points: 10
        },
        {
          id: `q-${topic.id}-2`,
          text: `Apply the principles of ${topic.title} to solve the following problem...`,
          type: 'problem-solving',
          points: 15
        },
        {
          id: `q-${topic.id}-3`,
          text: `Analyze how ${topic.title} connects to other topics in this subject.`,
          type: 'essay',
          points: 15
        }
      ],
      passingScore: 25
    };
  },
  
  /**
   * Generate further resources for a topic
   * @param {Object} topic - Topic object
   * @param {Array} concepts - Array of concept objects
   * @returns {Array} - Array of resource objects
   */
  generateFurtherResources: function(topic, concepts) {
    // Filter concepts related to this topic
    const relatedConcepts = concepts.filter(concept => 
      topic.content && topic.content.includes(concept.term)
    );
    
    const resources = [];
    
    // Add concept definitions as resources
    relatedConcepts.forEach(concept => {
      resources.push({
        title: concept.term,
        type: 'definition',
        content: concept.definition
      });
    });
    
    // Add placeholder additional resources
    resources.push({
      title: 'Additional Reading',
      type: 'external',
      content: `Additional resources for ${topic.title} will be provided.`
    });
    
    return resources;
  },
  
  /**
   * Identify which Math Academy principles can be applied to the lessons
   * @param {Array} mathAcademyPrinciples - Array of identified principles
   * @returns {Array} - Array of applicable principles
   */
  identifyApplicablePrinciples: function(mathAcademyPrinciples) {
    const applicablePrinciples = [];
    
    // We'll apply all identified principles
    mathAcademyPrinciples.forEach(principle => {
      applicablePrinciples.push({
        name: principle.name,
        description: principle.context || `Apply the ${principle.name} principle`,
        implementation: this.getPrincipleImplementation(principle.name)
      });
    });
    
    // Ensure we have at least the core principles
    const coreNames = applicablePrinciples.map(p => p.name);
    
    if (!coreNames.includes('Knowledge Graph')) {
      applicablePrinciples.push({
        name: 'Knowledge Graph',
        description: 'Organize topics based on prerequisite relationships',
        implementation: this.getPrincipleImplementation('Knowledge Graph')
      });
    }
    
    if (!coreNames.includes('Scaffolded Mastery Learning')) {
      applicablePrinciples.push({
        name: 'Scaffolded Mastery Learning',
        description: 'Ensure mastery of prerequisites before advancing to new topics',
        implementation: this.getPrincipleImplementation('Scaffolded Mastery Learning')
      });
    }
    
    return applicablePrinciples;
  },
  
  /**
   * Get a description of how to implement a specific principle
   * @param {string} principleName - Name of the principle
   * @returns {string} - Implementation description
   */
  getPrincipleImplementation: function(principleName) {
    const implementations = {
      'Knowledge Graph': 'Visualize topic relationships in a knowledge graph to show prerequisites and connections',
      'Scaffolded Mastery Learning': 'Require mastery of prerequisites before advancing to new topics',
      'Prerequisites': 'Identify and address key prerequisites before introducing new material',
      'Working Memory': 'Break complex concepts into manageable chunks to avoid overloading working memory',
      'Cognitive Learning Strategies': 'Use retrieval practice, spaced repetition, and interleaving to enhance learning',
      'Desirable Difficulty': 'Incorporate challenges that promote deeper processing and better retention',
      'Bloom\'s Two-Sigma Problem': 'Provide personalized instruction and feedback to approach the two-sigma effect'
    };
    
    return implementations[principleName] || 
      `Implement the ${principleName} principle throughout the learning experience`;
  },
  
  /**
   * Apply Math Academy principles to a topic
   * @param {Object} topic - Topic object
   * @param {Array} principles - Array of principle objects
   * @returns {Array} - Array of applied principle objects
   */
  applyMathAcademyPrinciples: function(topic, principles) {
    // For each principle, create a specific application to this topic
    return principles.map(principle => ({
      name: principle.name,
      description: principle.description,
      application: this.generatePrincipleApplication(principle.name, topic)
    }));
  },
  
  /**
   * Generate a specific application of a principle to a topic
   * @param {string} principleName - Name of the principle
   * @param {Object} topic - Topic object
   * @returns {string} - Application description
   */
  generatePrincipleApplication: function(principleName, topic) {
    switch (principleName) {
      case 'Knowledge Graph':
        return `Visualize how ${topic.title} connects to its prerequisites and subsequent topics`;
      
      case 'Scaffolded Mastery Learning':
        return `Ensure mastery of prerequisites before advancing to ${topic.title}`;
      
      case 'Prerequisites':
        return `Identify and address key prerequisites needed for understanding ${topic.title}`;
      
      case 'Working Memory':
        return `Break ${topic.title} into manageable chunks to avoid cognitive overload`;
      
      case 'Cognitive Learning Strategies':
        return `Apply retrieval practice and spaced repetition to reinforce understanding of ${topic.title}`;
      
      case 'Desirable Difficulty':
        return `Incorporate challenging problems related to ${topic.title} to promote deeper learning`;
      
      case 'Bloom\'s Two-Sigma Problem':
        return `Provide personalized feedback on ${topic.title} to approach the two-sigma effect`;
      
      default:
        return `Apply the ${principleName} principle to ${topic.title}`;
    }
  }
};

// Export for Node.js environments while preserving browser usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LessonGenerator;
} else {
  window.LessonGenerator = LessonGenerator;
}
