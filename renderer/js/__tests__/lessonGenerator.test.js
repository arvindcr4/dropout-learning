const LessonGenerator = require('../lessonGenerator');

describe('sortTopicsBasedOnPrerequisites', () => {
  test('orders topics based on prerequisite relationships', () => {
    const topics = [
      { id: 1, title: 'A', subtopics: [] },
      { id: 2, title: 'B', subtopics: [] },
      { id: 3, title: 'C', subtopics: [] }
    ];

    const relationships = [
      { source: 1, target: 2, type: 'prerequisite' },
      { source: 2, target: 3, type: 'prerequisite' }
    ];

    const result = LessonGenerator.sortTopicsBasedOnPrerequisites(topics, relationships);
    const resultIds = result.map(t => t.id);
    expect(resultIds).toEqual([1, 2, 3]);
  });
});
