# Dropout Learning

A sophisticated learning platform that applies advanced educational principles to create personalized, mastery-based learning experiences from uploaded PDF study materials, with a focus on data science and related technical fields.

## Features

- **Knowledge Graph Architecture**: Maps relationships between topics, showing prerequisites and connections that support structured learning
- **Adaptive Diagnostic Assessment**: Identifies each learner's knowledge frontier and gaps to create personalized learning paths
- **Mastery-Based Progression**: Students aren't pushed forward until they've demonstrated mastery of prerequisite skills
- **Granular Knowledge Points**: Lessons are scaffolded into small, digestible segments with worked examples and practice problems
- **Immediate Feedback System**: Provides explanatory feedback within minutes of starting a new lesson
- **Daily XP Goal System**: Gamifies the learning experience with progress tracking and streak mechanisms
- **Module-Based Content Organization**: Each uploaded PDF creates its own SQLite database to store module-specific content
- **Interactive Code Editor**: Built-in Python and R code editor with execution capabilities for data science exercises
- **Data Visualization Tools**: Create and interact with data visualizations based on your analyses
- **Accessibility Features**: High-contrast mode, dyslexia-friendly fonts, and adjustable text sizes
- **Spaced Repetition**: Automatic scheduling of review materials at optimal intervals for long-term retention

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: SQLite (one database per PDF module)
- **PDF Processing**: pdf-lib for extracting content from uploaded PDFs
- **Frontend**: Pure JavaScript, HTML, and CSS with Bootstrap for styling

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/arvindcr4/dropout-learning.git
   cd dropout-learning
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   node server.js
   ```

4. Access the application at `http://localhost:5000`

## Usage

1. **Upload Study Material**: Upload a PDF document containing study material
2. **Take the Adaptive Diagnostic**: Complete the diagnostic assessment to identify your knowledge frontier
3. **Follow Your Custom Course**: Based on the diagnostic results, a personalized learning path is created
4. **Master Knowledge Points**: Work through each knowledge point with worked examples and practice problems
5. **Complete Coding Exercises**: Practice data science skills with interactive coding challenges
6. **Explore the Knowledge Graph**: Visualize your progress and plan your learning journey
7. **Track Progress**: Monitor your daily XP goals and learning streaks

## Project Structure

- `server.js`: Main Express application and API endpoints
- `db.js`: Database utilities for managing SQLite databases
- `public/`: Frontend assets and HTML pages
  - `index.html`: Main application interface
  - `diagnostic.html`: Adaptive diagnostic experience
  - `knowledge-point.html`: Knowledge point lesson interface
  - `code-editor.html`: Interactive coding environment for data science exercises
  - `knowledge-graph.html`: Interactive visualization of learning pathways
- `databases/`: Generated SQLite databases (one per PDF)
- `uploads/`: Temporary storage for uploaded PDFs

## Implementation Details

### Knowledge Points Structure

Each lesson is broken down into knowledge points following this sequence:
1. Worked example with subgoal labeling
2. Up to 5 practice problems similar to the worked example
3. Mastery assessment before unlocking the next knowledge point

### Interactive Code Environment

- Supports Python and R for data science exercises
- Real-time code execution and feedback
- Test case validation for automatic assessment
- Visualization capabilities for data outputs
- Scaffolded hints to guide learning

### Knowledge Graph Visualization

- D3.js-powered interactive graph
- Visual representation of topic relationships
- Color-coded by subject category and mastery level
- Zoom and pan capabilities for exploration
- Recommended personalized learning paths

### XP (eXperience Points) System

- XP rewards correct answers and good learning habits
- Each XP is roughly equivalent to 1 minute of focused effort
- Daily XP goals are adjustable to suit individual learning pace
- Streak tracking for consistent engagement

### Mastery Requirements

- Mastery is achieved by correctly solving a minimum threshold of practice problems
- Prerequisites must be mastered before advancing to more complex topics
- The system creates personalized learning paths based on demonstrated mastery
- Adaptive difficulty based on performance

### Spaced Repetition

- Automatic scheduling of review materials
- Optimal intervals for long-term retention
- Interleaving of topics to enhance learning

## License

This project is licensed under the MIT License - see the LICENSE file for details.