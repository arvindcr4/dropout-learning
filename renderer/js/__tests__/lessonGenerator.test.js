const LessonGenerator = require('../lessonGenerator');

// Tests for sortTopicsBasedOnPrerequisites
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

// Tests for generateOverview
describe('generateOverview', () => {
  test('uses first sentences when available', () => {
    const topic = { title: 'Topic', content: 'One. Two. Three. Four.' };
    const overview = LessonGenerator.generateOverview(topic);
    expect(overview).toBe('One. Two. Three.');
  });

  test('falls back to generic overview', () => {
    const topic = { title: 'Topic' };
    const overview = LessonGenerator.generateOverview(topic);
    expect(overview).toContain('This lesson covers Topic');
  });
});

// Tests for generateLearningObjectives
describe('generateLearningObjectives', () => {
  test('creates a set of objectives', () => {
    const topic = { title: 'Algebra', content: '**term** is defined as something', level: 2 };
    const objs = LessonGenerator.generateLearningObjectives(topic);
    expect(Array.isArray(objs)).toBe(true);
    expect(objs.length).toBeGreaterThanOrEqual(3);
  });
});

// Tests for generateSections
describe('generateSections', () => {
  test('creates sections from subtopics with intro and summary', () => {
    const topic = { title: 'Main', content: 'Intro', subtopics: [{ title: 'Sub', content: 'subtext' }] };
    const sections = LessonGenerator.generateSections(topic);
    expect(sections[0].title).toBe('Introduction');
    expect(sections[sections.length - 1].title).toBe('Summary');
  });
});

// Tests for generatePracticeProblems
describe('generatePracticeProblems', () => {
  test('creates placeholder problems', () => {
    const problems = LessonGenerator.generatePracticeProblems({ id: 1, title: 'Calc' });
    expect(problems.length).toBe(3);
    expect(problems[0].question).toContain('Calc');
  });
});

// Tests for generateAssessment
describe('generateAssessment', () => {
  test('creates an assessment structure', () => {
    const assessment = LessonGenerator.generateAssessment({ id: 1, title: 'Topic' });
    expect(assessment.questions.length).toBe(3);
    expect(assessment.passingScore).toBeGreaterThan(0);
  });
});

// Tests for generateFurtherResources
describe('generateFurtherResources', () => {
  test('adds concept definitions and additional reading', () => {
    const topic = { title: 'Topic', content: 'contains concept' };
    const concepts = [{ term: 'concept', definition: 'def' }];
    const resources = LessonGenerator.generateFurtherResources(topic, concepts);
    expect(resources.some(r => r.type === 'definition')).toBe(true);
    expect(resources.some(r => r.title === 'Additional Reading')).toBe(true);
  });
});

// Tests for identifyApplicablePrinciples and related helpers
describe('principles utilities', () => {
  test('identifyApplicablePrinciples adds defaults', () => {
    const principles = [{ name: 'Working Memory' }];
    const result = LessonGenerator.identifyApplicablePrinciples(principles);
    const names = result.map(p => p.name);
    expect(names).toContain('Working Memory');
    expect(names).toContain('Knowledge Graph');
    expect(names).toContain('Scaffolded Mastery Learning');
  });

  test('getPrincipleImplementation returns known text', () => {
    const text = LessonGenerator.getPrincipleImplementation('Working Memory');
    expect(text).toContain('working memory');
  });

  test('applyMathAcademyPrinciples generates applications', () => {
    const topic = { title: 'Topic' };
    const principles = [{ name: 'Working Memory', description: 'd' }];
    const result = LessonGenerator.applyMathAcademyPrinciples(topic, principles);
    expect(result[0].application).toContain('Break Topic');
  });

  test('generatePrincipleApplication handles default', () => {
    const text = LessonGenerator.generatePrincipleApplication('Unknown', { title: 'Topic' });
    expect(text).toContain('Unknown');
  });
});

