// Catalog of visual-learning components lessons can embed by `type`.
// Pure data, shared by the content validator, the visualizer gallery and the
// lazy component registry (components/diagrams/registry.js).

export const visualizers = {
  scoreboard: {
    title: 'Scoreboard: a ref in action',
    blurb: 'Click to change a ref and watch Vue notice the change and update the screen.',
    props: { label: 'string', start: 'number' },
  },
  reactivity: {
    title: 'Reactivity visualizer',
    blurb: 'State → dependency tracking → change → effects → DOM, one step at a time.',
    props: { preset: ['compare', 'ref', 'reactive', 'computed', 'watch'] },
  },
  'dependency-tracker': {
    title: 'Dependency tracker',
    blurb: 'A live mini reactivity engine: see exactly which computeds and effects re-run.',
    props: { preset: ['cart', 'chain'] },
  },
  'component-flow': {
    title: 'Component communication',
    blurb: 'Props down, events up, v-model, slots, provide/inject and shared stores.',
    props: { mode: ['props', 'emits', 'v-model', 'slots', 'scoped-slots', 'provide-inject', 'pinia'] },
  },
  lifecycle: {
    title: 'Lifecycle timeline',
    blurb: 'Mount, update and unmount real components and see their hooks fire in order.',
    props: { withChild: 'boolean' },
  },
  router: {
    title: 'Vue Router visualizer',
    blurb: 'URL change → route matching → guards → component rendering, using a real router.',
    props: { preset: ['basics', 'dynamic', 'nested', 'guards', 'lazy'] },
  },
  pinia: {
    title: 'Pinia store visualizer',
    blurb: 'Several components share one real store; see who re-renders when actions run.',
    props: { preset: ['cart', 'local-vs-shared'] },
  },
  vdom: {
    title: 'Virtual DOM diff (conceptual)',
    blurb: 'Previous and next virtual trees, the changed nodes and the DOM patches.',
    props: { preset: ['list', 'keys', 'text'] },
  },
  performance: {
    title: 'Performance lab',
    blurb: 'Measured demos: wasted renders, computed caching, debouncing, virtual lists and more.',
    props: { demo: ['updates', 'computed-cache', 'debounce', 'lazy-routes', 'virtual-list', 'shallow'] },
  },
  'directive-lab': {
    title: 'Directive lab',
    blurb: 'Toggle a directive and inspect the real DOM it produces.',
    props: { directive: ['interpolation', 'v-bind', 'v-on', 'v-if', 'v-show', 'v-for', 'v-model', 'class', 'style'] },
  },
  'concept-diagram': {
    title: 'Concept diagram',
    blurb: 'A stepped, annotated diagram defined by the lesson.',
    props: { nodes: 'array', edges: 'array', steps: 'array' },
  },
  comparison: {
    title: 'Side-by-side comparison',
    blurb: 'Two approaches to the same problem with their differences called out.',
    props: { left: 'object', right: 'object', points: 'array' },
  },
  'event-loop': {
    title: 'Event loop stepper',
    blurb: 'Call stack, microtasks and tasks — why async code runs in the order it does.',
    props: { preset: ['promises', 'timers', 'async-await', 'nexttick'] },
  },
  'rendering-lab': {
    title: 'Rendering lab',
    blurb: 'Live demos of Teleport, KeepAlive, Transition and dynamic components.',
    props: { mode: ['teleport', 'keep-alive', 'transition', 'dynamic'] },
  },
  'dom-tree': {
    title: 'HTML → DOM tree',
    blurb: 'Type HTML and see the tree the browser builds from it.',
    props: { html: 'string' },
  },
}

export const visualizerTypes = Object.keys(visualizers)
