// Interview categories are views over the question bank: a question belongs to
// a category by the level its lesson lives in, by its question type, or both.

export const interviewCategories = [
  { id: 'fundamentals', label: 'Beginner fundamentals', match: (q) => q.difficulty === 'beginner' },
  {
    id: 'intermediate',
    label: 'Intermediate Vue concepts',
    match: (q) => q.difficulty === 'intermediate' && ['fundamentals', 'reactivity', 'components', 'composition', 'forms'].includes(q.level),
  },
  { id: 'reactivity', label: 'Advanced reactivity & internals', match: (q) => ['reactivity', 'advanced-reactivity'].includes(q.level) && q.difficulty !== 'beginner' },
  { id: 'composition', label: 'Composition API', levels: ['composition'] },
  { id: 'components', label: 'Component communication', levels: ['components'] },
  { id: 'router', label: 'Vue Router', levels: ['routing'] },
  { id: 'pinia', label: 'Pinia & state management', levels: ['state-management'] },
  { id: 'api', label: 'API integration', levels: ['api-integration'] },
  { id: 'performance', label: 'Performance optimization', levels: ['performance'] },
  { id: 'testing', label: 'Testing', levels: ['testing'] },
  { id: 'security', label: 'Security', levels: ['security'] },
  { id: 'architecture', label: 'Architecture & design patterns', levels: ['architecture'], types: ['architecture'] },
  { id: 'debugging', label: 'Debugging & problem-solving', types: ['debugging'] },
  { id: 'scenario', label: 'Real-world scenarios', types: ['scenario'] },
  { id: 'coding', label: 'Practical coding challenges', types: ['coding'] },
]

export function inCategory(q, cat) {
  if (cat.match) return cat.match(q)
  return (cat.levels ?? []).includes(q.level) || (cat.types ?? []).includes(q.type)
}

export const QUESTION_TYPES = [
  { id: 'conceptual', label: 'Conceptual' },
  { id: 'output', label: 'Code output' },
  { id: 'debugging', label: 'Debugging' },
  { id: 'coding', label: 'Coding challenge' },
  { id: 'scenario', label: 'Scenario' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'architecture', label: 'Architecture' },
]

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
