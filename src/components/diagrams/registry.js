import { defineAsyncComponent } from 'vue'

// Lazy component per visualizer type. Each only downloads when a lesson uses it.
const loaders = {
  scoreboard: () => import('./ScoreboardVisualizer.vue'),
  reactivity: () => import('./ReactivityVisualizer.vue'),
  'dependency-tracker': () => import('./DependencyTracker.vue'),
  'component-flow': () => import('./ComponentFlow.vue'),
  lifecycle: () => import('./LifecycleTimeline.vue'),
  router: () => import('./RouterVisualizer.vue'),
  pinia: () => import('./PiniaVisualizer.vue'),
  vdom: () => import('./VirtualDomVisualizer.vue'),
  performance: () => import('./PerformanceVisualizer.vue'),
  'directive-lab': () => import('./DirectiveLab.vue'),
  'concept-diagram': () => import('./ConceptDiagram.vue'),
  comparison: () => import('./ComparisonVisualizer.vue'),
  'event-loop': () => import('./EventLoopVisualizer.vue'),
  'rendering-lab': () => import('./RenderingLab.vue'),
  'dom-tree': () => import('./DomTreeVisualizer.vue'),
}

const cache = {}

export function visualizerComponent(type) {
  if (!loaders[type]) return null
  return (cache[type] ??= defineAsyncComponent({ loader: loaders[type], delay: 120, timeout: 20000 }))
}
