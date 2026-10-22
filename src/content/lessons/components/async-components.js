// Lesson: Async components with defineAsyncComponent

const networkJs = `// A simplified stand-in for a real network. It wraps a dynamic import()
// with latency and optional failures so you can SEE loading and error states.
// Real apps simply call import('./SalesChart.vue').
export const network = {
  latency: 400, // ms per request
  failNext: 0,  // how many upcoming requests should fail
}

export function overNetwork(load) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (network.failNext > 0) {
        network.failNext--
        reject(new Error('Failed to fetch dynamically imported module'))
      } else {
        resolve(load())
      }
    }, network.latency)
  })
}`

const asyncApp = `<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { network, overNetwork } from './network.js'
import ChartSkeleton from './ChartSkeleton.vue'

const SalesChart = defineAsyncComponent({
  loader: () => overNetwork(() => import('./SalesChart.vue')),
  loadingComponent: ChartSkeleton,
  delay: 200,
})

const showChart = ref(false)
</script>

<template>
  <h3>Weekly dashboard</h3>
  <p class="kpi">Revenue this week: $4,210</p>

  <label class="network">
    <input type="checkbox" class="flaky" @change="network.failNext = $event.target.checked ? 2 : 0" />
    Flaky network (next 2 requests fail)
  </label>

  <button class="toggle" @click="showChart = !showChart">
    {{ showChart ? 'Hide' : 'Show' }} sales chart
  </button>

  <SalesChart v-if="showChart" :sales="[3, 5, 2, 8, 6, 9, 4]" />
</template>`

const salesChart = `<script>
// A normal <script> block runs once, when this module is first loaded.
// With an async component, that is the first time the chart is shown.
console.log('SalesChart module loaded')
</script>

<script setup>
import { computed } from 'vue'

const props = defineProps({ sales: { type: Array, required: true } })
const max = computed(() => Math.max(...props.sales))
</script>

<template>
  <figure class="chart">
    <div class="bars">
      <div
        v-for="(value, i) in sales"
        :key="i"
        class="bar"
        :style="{ height: (value / max) * 80 + 'px' }"
        :title="String(value)"
      ></div>
    </div>
    <figcaption>Sales per day</figcaption>
  </figure>
</template>

<style scoped>
.bars { display: flex; align-items: flex-end; gap: 6px; height: 84px; }
.bar { width: 18px; background: #222; border-radius: 4px 4px 0 0; }
</style>`

const chartSkeleton = `<template>
  <div class="loading" aria-busy="true">Loading chart…</div>
</template>

<style scoped>
.loading { height: 84px; width: 180px; display: grid; place-items: center; background: #eee; border-radius: 8px; }
</style>`

const loadError = `<script setup>
// The errorComponent receives the error as a prop named "error".
defineProps(['error'])
</script>

<template>
  <p class="load-error" role="alert">
    Couldn't load the chart: {{ error && error.message }}
  </p>
</template>`

const editorFiles = {
  'RichEditor.vue': `<script>
console.log('RichEditor module loaded')
</script>

<script setup>
defineProps({ text: String })
</script>

<template>
  <div class="editor">
    <div class="toolbar"><b>B</b> <i>I</i> <u>U</u></div>
    <textarea class="editor-input" :value="text"></textarea>
  </div>
</template>`,
  'EditorSkeleton.vue': `<template>
  <div class="skeleton" aria-busy="true">Preparing the editor…</div>
</template>`,
}

const reportFiles = {
  'network.js': `// Simplified fake network: the first \`failures\` requests fail.
export const config = { latency: 150, failures: 2 }
let requests = 0

export function overNetwork(load) {
  requests++
  console.log('request ' + requests)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (config.failures > 0) {
        config.failures--
        reject(new Error('Network error'))
      } else {
        resolve(load())
      }
    }, config.latency)
  })
}`,
  'ReportChart.vue': `<template>
  <div class="report">📈 Quarterly report</div>
</template>`,
  'ReportLoading.vue': `<template>
  <p class="report-loading">Loading report…</p>
</template>`,
  'ReportError.vue': `<script setup>
defineProps(['error'])
</script>

<template>
  <p class="report-error">Report unavailable: {{ error && error.message }}</p>
</template>`,
}

const helpFiles = {
  'HelpPanel.vue': `<script>
console.log('HelpPanel module loaded')
</script>

<template>
  <aside class="help-panel">
    <h4>Keyboard shortcuts</h4>
    <p>Press ? to open this panel.</p>
  </aside>
</template>`,
}

export default {
  id: 'async-components',
  title: 'Async components with defineAsyncComponent',
  summary: 'Load a component\'s code only when it is first needed with defineAsyncComponent and dynamic import(), and handle the loading, error and timeout states that come with it.',
  difficulty: 'intermediate',
  minutes: 30,
  prerequisites: ['dynamic-components', 'async-js'],
  related: ['bundle-optimization', 'lazy-routes-scroll', 'suspense', 'dynamic-components', 'error-handling', 'es-modules'],
  tags: ['async components', 'defineAsyncComponent', 'lazy loading', 'code splitting', 'dynamic import', 'loadingComponent', 'errorComponent', 'timeout', 'retry'],
  apis: [
    { name: 'defineAsyncComponent()', summary: 'Wraps a loader function returning a Promise of a component; the wrapper loads it the first time it renders.' },
    { name: 'import()', summary: 'Dynamic import — returns a Promise for a module; bundlers split it into a separate chunk.' },
    { name: 'loadingComponent / errorComponent', summary: 'Components shown while loading (after `delay`) or when loading fails or times out.' },
    { name: 'onError(error, retry, fail, attempts)', summary: 'Hook to decide whether to retry a failed load.' },
  ],
  docs: [
    { label: 'Vue Guide — Async Components', url: 'https://vuejs.org/guide/components/async.html' },
    { label: 'API — defineAsyncComponent()', url: 'https://vuejs.org/api/general.html#defineasynccomponent' },
    { label: 'Vue Router — Lazy Loading Routes', url: 'https://router.vuejs.org/guide/advanced/lazy-loading.html' },
  ],

  intro: `
Every component you \`import\` at the top of a file becomes part of the JavaScript the browser must download **before** your page can start. A heavy chart library or a rich-text editor that only 5% of visitors open still slows down everyone.

An **async component** is loaded **on demand**. You give \`defineAsyncComponent()\` a *loader* — a function that returns a Promise for the component, usually \`() => import('./SalesChart.vue')\`. The result is a wrapper component you use like any other. The first time it renders, it calls the loader, waits, and then shows the real component.

Because waiting can be slow — or fail — \`defineAsyncComponent\` also lets you show a **loading** component, an **error** component, and set a **timeout**.
`,

  why: `
Bundlers like Vite turn a static \`import Chart from './Chart.vue'\` into "include this in the same file". A **dynamic** \`import('./Chart.vue')\` instead becomes a separate file (a *chunk*) that is downloaded only when that line runs. This is **code splitting**.

The payoff: a smaller initial download and a faster first screen, while rarely used or heavy parts — admin panels, maps, editors, charts, big modals — arrive only for users who need them.

The cost: those parts now take time to appear, and the network can fail. Async components give you a standard way to deal with that: a loading placeholder that doesn't flash for fast connections, an error state instead of a blank hole, a timeout, and retries.
`,

  eli15: `
Imagine a restaurant menu. The kitchen doesn't cook every dish the moment the restaurant opens — that would be wasteful and slow. It cooks a dish **when someone orders it**.

An async component is a dish cooked on order. Your page opens quickly with only the basics ready. When the user clicks "Show chart", Vue "orders" the chart — downloads its code — and shows it when it's ready.

While waiting, a good waiter tells you "your food is coming" (a **loading** component). If the kitchen runs out of an ingredient, they come back and say so (an **error** component) instead of leaving you staring at an empty table forever. And once a dish is known, the next order is instant — the recipe is already in the kitchen (Vue caches the loaded component).
`,

  analogy: {
    title: 'Cooked to order',
    body: `
A restaurant prepares only a few staples before opening. Everything else is cooked when ordered. Waiters keep guests informed while they wait, apologise if a dish can't be made, and don't let guests wait forever. A dish that has been made once can be served again quickly.
`,
    mapping: [
      ['dishes ready at opening', 'components imported statically (in the main bundle)'],
      ['a dish cooked when ordered', 'an async component loaded the first time it renders'],
      ['placing the order', 'the loader: `() => import(\'./SalesChart.vue\')`'],
      ['"your food is coming"', '`loadingComponent` (shown after `delay`)'],
      ['"sorry, we\'re out of that"', '`errorComponent` (failed load or `timeout`)'],
      ['asking the kitchen to try again', '`onError(error, retry, fail, attempts)`'],
      ['second order served quickly', 'the resolved component is cached for later renders'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'Eager import vs async component',
    props: {
      left: {
        label: 'Eager: part of the main bundle',
        lang: 'vue',
        code: `<script setup>
import SalesChart from './SalesChart.vue'
// downloaded and evaluated before the page starts,
// even if nobody ever opens the chart
</script>

<template>
  <SalesChart v-if="showChart" />
</template>`,
      },
      right: {
        label: 'Lazy: its own chunk, loaded on first render',
        lang: 'vue',
        code: `<script setup>
import { defineAsyncComponent } from 'vue'
const SalesChart = defineAsyncComponent(
  () => import('./SalesChart.vue')
)
</script>

<template>
  <SalesChart v-if="showChart" />  <!-- same usage -->
</template>`,
      },
      points: [
        'The template is identical — the wrapper behaves like a normal component and passes props, slots and listeners through.',
        'A dynamic `import()` tells the bundler to put the file (and anything only it uses) into a separate chunk.',
        'Nothing is downloaded until the wrapper renders for the first time; after that the component is cached.',
        'The lazy version now has a loading phase and can fail — plan for both.',
      ],
    },
    caption: 'Same template, very different download behaviour.',
    alt: 'Side-by-side code. Left: SalesChart imported statically at the top of the file, so it is in the main bundle. Right: SalesChart wrapped in defineAsyncComponent with a dynamic import, so it becomes a separate chunk loaded on first render. The templates are identical.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'The life of an async component',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'render', label: 'first render', note: '<SalesChart v-if="show">', tone: 'acid', x: 110, y: 70 },
        { id: 'loader', label: 'loader()', note: 'import(\'./SalesChart.vue\')', tone: 'kraft', x: 330, y: 70 },
        { id: 'delay', label: 'after `delay` ms', note: 'default 200', x: 330, y: 220 },
        { id: 'loading', label: 'loadingComponent', note: 'skeleton / spinner', tone: 'cobalt', x: 110, y: 220 },
        { id: 'ok', label: 'resolved', note: 'render SalesChart, cache it', tone: 'acid', x: 590, y: 70 },
        { id: 'fail', label: 'rejected / timeout', note: 'errorComponent (or onError → retry)', tone: 'red', x: 590, y: 220 },
      ],
      edges: [
        { from: 'render', to: 'loader', label: 'calls once' },
        { from: 'loader', to: 'delay', label: 'still pending?' },
        { from: 'delay', to: 'loading', label: 'show' },
        { from: 'loader', to: 'ok', label: 'Promise resolves' },
        { from: 'loader', to: 'fail', label: 'rejects / too slow' },
      ],
      steps: [
        { focus: ['render'], text: 'The wrapper renders for the first time (here when `show` becomes true). Until then, nothing was downloaded.' },
        { focus: ['loader'], edges: ['render->loader'], text: 'It calls the **loader** — usually a dynamic `import()`. All instances share the same pending request, so the code is fetched only once.' },
        { focus: ['delay', 'loading'], edges: ['loader->delay', 'delay->loading'], text: 'If the Promise is still pending after `delay` (200 ms by default), the **loadingComponent** appears. Fast loads never flash a spinner.' },
        { focus: ['ok'], edges: ['loader->ok'], text: 'When the Promise resolves, the real component renders with the props and slots given to the wrapper. It\'s cached: later renders are instant.' },
        { focus: ['fail'], edges: ['loader->fail'], text: 'If it rejects — or takes longer than `timeout` — the **errorComponent** renders with an `error` prop. `onError` can retry first. A later render after a failure calls the loader again.' },
      ],
    },
    caption: 'Step through the loading, success and failure paths.',
    alt: 'A stepped diagram: the first render calls the loader; if the loader is still pending after the delay, the loading component shows; when the promise resolves, the real component renders and is cached; if it rejects or times out, the error component shows (or onError retries).',
  },

  syntax: [
    `
**Simplest form** — pass a loader that returns a Promise of a component. A dynamic \`import()\` returns a Promise of the module, and Vue uses its \`default\` export:
`,
    {
      code: `<script setup>
import { defineAsyncComponent } from 'vue'

const SalesChart = defineAsyncComponent(() => import('./SalesChart.vue'))
</script>

<template>
  <!-- use it like any component: props, events and slots pass through -->
  <SalesChart v-if="showChart" :sales="sales" @select="onSelect" />
</template>`,
      lang: 'vue',
      title: 'defineAsyncComponent with import()',
    },
    `
**Options form** — handle loading, errors and slow networks:
`,
    {
      code: `const SalesChart = defineAsyncComponent({
  loader: () => import('./SalesChart.vue'),

  loadingComponent: ChartSkeleton, // shown while loading…
  delay: 200,                      // …but only after 200 ms (the default)

  errorComponent: LoadError,       // shown if the loader rejects or times out
  timeout: 3000,                   // ms; the default is Infinity (never times out)

  // optional: decide whether to retry
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) retry()
    else fail()
  },
})`,
      lang: 'js',
      title: 'all the options',
    },
    `
- The \`errorComponent\` receives the error as a prop called \`error\`.
- \`loadingComponent\` and \`errorComponent\` are plain components — import them **statically** so they're ready instantly.
- A loader can return any Promise of a component, not only \`import()\` — handy for tests or custom loading logic.

**Global registration** works too:
`,
    {
      code: `app.component('SalesChart', defineAsyncComponent(() => import('./SalesChart.vue')))`,
      lang: 'js',
      title: 'globally registered async component',
    },
    `
**Routes are different.** With Vue Router, give the route a function returning \`import()\` directly — the router handles lazy loading itself, and its docs advise against wrapping route components in \`defineAsyncComponent\`:
`,
    {
      code: `const routes = [
  { path: '/reports', component: () => import('./views/ReportsView.vue') },
]`,
      lang: 'js',
      title: 'lazy route (Vue Router, not defineAsyncComponent)',
    },
    {
      callout: 'note',
      title: 'Suspense and SSR',
      text: 'Async components are *suspensible* by default: inside a `<Suspense>` boundary, Suspense controls the loading state and the component\'s own `loadingComponent`/`delay`/`errorComponent` options are ignored; set `suspensible: false` to opt out. `<Suspense>` is still **experimental**. For server-side rendering, Vue **3.5+** adds lazy hydration strategies such as `hydrate: hydrateOnVisible()`.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: asyncApp,
    intro: 'A dashboard whose heavy chart is only fetched when the user asks for it. `network.js` adds fake latency so you can see what happens.',
    steps: [
      { lines: [2], text: '`defineAsyncComponent` is a regular import from `vue` (not a compiler macro).' },
      { lines: [4], text: 'The **skeleton** is imported statically: it must be ready instantly, while the real chart is still on its way.' },
      { lines: [6, 10], text: 'The async wrapper. `loader` returns a Promise — here a dynamic `import()` wrapped in our fake network. `delay: 200` means the skeleton appears only if loading takes longer than 200 ms.' },
      { lines: [12], text: 'The chart isn\'t rendered until `showChart` is true, so nothing is loaded at startup.' },
      { lines: [28], text: 'Used exactly like a normal component, including props. The first time this renders, the loader runs; afterwards the cached component is used.' },
    ],
  },

  playground: {
    title: 'A lazily loaded dashboard chart',
    objective: 'Watch a component load on demand, then add an error state, retries and a no-delay skeleton.',
    files: {
      'App.vue': asyncApp,
      'network.js': networkJs,
      'SalesChart.vue': salesChart,
      'ChartSkeleton.vue': chartSkeleton,
      'LoadError.vue': loadError,
    },
    expected: 'A dashboard with a button. Clicking **Show sales chart** shows "Loading chart…" briefly, then a bar chart. The console prints **SalesChart module loaded** only at that moment — and only once, however often you hide and show it.',
    experiments: [
      {
        id: 'no-delay',
        task: 'Make the skeleton appear **immediately** when the chart is requested, instead of after 200 ms.',
        hint: 'Set `delay: 0` in the options.',
        tests: [
          {
            name: 'the skeleton shows right away, then the chart',
            code: `await click('.toggle')
expect(exists('.loading')).toBe(true)
await wait(550)
expect(exists('.chart')).toBe(true)
expect(exists('.loading')).toBe(false)`,
          },
        ],
        explain: 'The default `delay` of 200 ms exists to avoid a flash of spinner on fast connections — a skeleton that appears for 30 ms feels like a glitch. Use `0` when you know loading is usually slow, or when a skeleton keeps the layout from jumping.',
      },
      {
        id: 'error-state',
        task: 'Handle failure: add `errorComponent: LoadError` (import it) and `timeout: 3000`. Tick **Flaky network** and show the chart — you should see the error message instead of an empty space.',
        hint: '`import LoadError from \'./LoadError.vue\'`, then add the two options next to `loadingComponent`.',
        tests: [
          {
            name: 'a failed load shows the error component',
            code: `await check('.flaky', true)
await click('.toggle')
await wait(550)
expect(exists('.load-error')).toBe(true)
expect(text('.load-error')).toContain('Failed to fetch')`,
          },
        ],
        explain: 'Without an `errorComponent`, a failed load renders nothing and only logs an error. Try **Hide** then **Show** again: Vue calls the loader again on the next render, so a second attempt can succeed (the flaky network fails only twice).',
      },
      {
        id: 'retry',
        task: 'Networks hiccup. Add `onError(error, retry, fail, attempts)` that **retries up to 3 times** and then gives up. With **Flaky network** ticked, the chart should now appear on the first click.',
        hint: '`onError(error, retry, fail, attempts) { if (attempts <= 3) retry(); else fail() }`.',
        tests: [
          {
            name: 'the chart appears after automatic retries',
            code: `await check('.flaky', true)
await click('.toggle')
await wait(1500)
expect(exists('.chart')).toBe(true)`,
          },
        ],
        explain: '`retry()` calls the loader again; `fail()` lets the error through to the `errorComponent`. `attempts` counts how many times loading has failed so far. In production, add a growing pause between attempts rather than retrying instantly forever.',
      },
      {
        id: 'loaded-once',
        task: 'Clear the console, then click **Show**, **Hide**, **Show**, **Hide**. Count how many times **SalesChart module loaded** appears.',
        explain: 'Once. The loader runs on first render, and the resolved component is cached by the wrapper (and the module by the module system). Later renders are instant — exactly like a real lazy chunk that has already been downloaded.',
      },
    ],
  },

  internals: {
    beginner: `
\`defineAsyncComponent\` builds a small **wrapper component**. The first time the wrapper renders, it calls your loader and shows nothing (or the loading component) while it waits. When the Promise resolves, the wrapper renders the real component and remembers it, so every later render is instant. If the Promise fails, it shows the error component.
`,
    technical: [
      {
        code: `// Simplified model of defineAsyncComponent — not Vue's real source
function defineAsyncComponent({ loader, loadingComponent, errorComponent, delay = 200, timeout }) {
  let resolved = null
  let pending = null
  const load = () =>
    pending ||= loader()
      .then((mod) => (resolved = mod.default ?? mod))   // unwrap ES module default
      .catch((err) => { pending = null; throw err })      // next render may try again

  return defineComponent({
    name: 'AsyncComponentWrapper',
    setup(_, { attrs, slots }) {
      if (resolved) return () => h(resolved, attrs, slots)   // cached: render at once

      const loaded = ref(false), error = ref(null), delayed = ref(delay > 0)
      if (delay > 0) setTimeout(() => (delayed.value = false), delay)
      if (timeout != null) setTimeout(() => {
        if (!loaded.value && !error.value) error.value = new Error(\`timed out after \${timeout}ms\`)
      }, timeout)

      load().then(() => (loaded.value = true), (e) => (error.value = e))

      return () => {
        if (loaded.value && resolved) return h(resolved, attrs, slots)   // props/slots pass through
        if (error.value && errorComponent) return h(errorComponent, { error: error.value })
        if (loadingComponent && !delayed.value) return h(loadingComponent)
      }
    },
  })
}`,
        lang: 'js',
        title: 'mental model of defineAsyncComponent',
      },
      `
Key details:

- **One request for all instances.** The pending Promise is shared, so ten charts on a page trigger one download.
- **Caching.** Once resolved, new instances render the real component immediately with no loading phase.
- **Pass-through.** The wrapper forwards attributes, props, listeners and slots to the inner component, so it is a drop-in replacement.
- **Retry.** The real implementation calls \`onError\` with \`retry\`/\`fail\` callbacks and an attempt counter before giving up.
- **Code splitting is the bundler's job.** Vue only calls your loader; it's Vite/Rollup (or webpack) that turns \`import('./SalesChart.vue')\` into a separate chunk and loads it over the network.
`,
    ],
    production: `
- **Lazy-load what is heavy or rarely used**: charts, maps, editors, video players, admin-only panels, big dialogs. Don't split every tiny component — many small chunks mean more requests and possible *waterfalls* (chunk A loads, then discovers it needs chunk B).
- **Make sure the module isn't also imported statically elsewhere** — then it ends up in the main bundle anyway. Check with your bundler's analysis tools ([bundle optimisation](lesson:bundle-optimization)).
- **Prefetch on intent**: calling the same loader on \`mouseenter\`/\`focus\` of the button starts the download a moment before the click.
- **Plan for chunk errors after deployments.** Users with an old tab open may request chunk files your new release deleted, causing "Failed to fetch dynamically imported module" errors. Show an error component that offers a reload. (Vite also emits a \`vite:preloadError\` event on \`window\` for failed preloads.)
- **Retry with care**: a few attempts with increasing delays; never infinite retries.
- **Reserve space** with a skeleton of similar size so the layout doesn't jump when the real component arrives.
- For routes, use the router's lazy loading instead ([lazy routes](lesson:lazy-routes-scroll)); for coordinated loading of several async parts, see the experimental [Suspense](lesson:suspense).
`,
  },

  mistakes: [
    {
      title: 'Defining the async component inside reactive code',
      wrong: { code: `// a new component type every time this re-evaluates
const Widget = computed(() =>
  defineAsyncComponent(() => import('./Widget.vue'))
)`, lang: 'js' },
      right: { code: `// define once, at the top of <script setup> or a module
const Widget = defineAsyncComponent(() => import('./Widget.vue'))`, lang: 'js' },
      explanation: 'Each call creates a brand-new wrapper type. If it\'s recreated during renders, Vue sees a different component every time, unmounts the old one and starts loading again.',
    },
    {
      title: 'Wrapping route components in defineAsyncComponent',
      wrong: { code: `{ path: '/reports', component: defineAsyncComponent(() => import('./ReportsView.vue')) }`, lang: 'js' },
      right: { code: `{ path: '/reports', component: () => import('./ReportsView.vue') }`, lang: 'js' },
      explanation: 'Vue Router has its own lazy loading (and waits for it during navigation). Give it the loader function directly.',
    },
    {
      title: 'Importing the "lazy" file statically somewhere else',
      wrong: { code: `// Dashboard.vue
const Chart = defineAsyncComponent(() => import('./SalesChart.vue'))

// Sidebar.vue
import SalesChart from './SalesChart.vue' // pulls it into the main bundle`, lang: 'js' },
      right: { code: `// share one async definition
// lazyComponents.js
export const SalesChart = defineAsyncComponent(() => import('./SalesChart.vue'))`, lang: 'js' },
      explanation: 'A single static import anywhere puts the module back into an eagerly loaded chunk, silently undoing the split.',
    },
    {
      title: 'No error handling',
      wrong: { code: `const Map = defineAsyncComponent(() => import('./MapView.vue'))\n// offline? → an empty hole and a console error`, lang: 'js' },
      right: { code: `const Map = defineAsyncComponent({\n  loader: () => import('./MapView.vue'),\n  loadingComponent: MapSkeleton,\n  errorComponent: MapUnavailable,\n  timeout: 10000,\n})`, lang: 'js' },
      explanation: 'Every network request can fail or hang. Give users a visible state and, ideally, a way to try again.',
    },
    {
      title: 'Building import paths from variables',
      wrong: { code: `const load = (name) => import('./widgets/' + name + '.vue')`, lang: 'js' },
      right: { code: `const loaders = {\n  chart: () => import('./widgets/ChartWidget.vue'),\n  map: () => import('./widgets/MapWidget.vue'),\n}\nconst Widget = defineAsyncComponent(loaders[type])`, lang: 'js' },
      explanation: 'Bundlers need to know at build time which files can be loaded. A map of explicit loaders is clear, analysable and doubles as a whitelist. (This sandbox only accepts plain string paths in `import()`.)',
    },
  ],

  debugging: [
    {
      symptom: 'The component never appears and the console shows an error "in async component loader".',
      cause: 'The loader rejected (network error, wrong path, or an error thrown while evaluating the module).',
      fix: 'Check the path and the module for errors; add an `errorComponent` and possibly `onError` retries.',
    },
    {
      symptom: 'A spinner flashes for a split second on every load.',
      cause: '`delay: 0` with a fast connection.',
      fix: 'Keep the default `delay` (200 ms), or use a same-size skeleton so the swap isn\'t jarring.',
    },
    {
      symptom: 'After a new release, some users get "Failed to fetch dynamically imported module".',
      cause: 'Their open tab references chunk files that the new deployment removed.',
      fix: 'Show an error component that offers a page reload; consider keeping old chunks available for a while after deploying.',
    },
    {
      symptom: 'The lazy component\'s code is still in the main bundle.',
      cause: 'The same module is imported statically somewhere else.',
      fix: 'Search for static imports of the file and share one async definition instead.',
    },
    {
      symptom: '`loadingComponent` and `errorComponent` are ignored.',
      cause: 'The component is inside a `<Suspense>` boundary, which takes over (async components are suspensible by default).',
      fix: 'Handle loading/error at the `<Suspense>` level, or set `suspensible: false`.',
    },
  ],

  bestPractices: [
    'Lazy-load heavy, rarely used or below-the-fold components; keep the critical path eager.',
    'Define async components once (module/setup top level), never inside computed values or render code.',
    'Import loading and error components statically; give skeletons the size of the real content.',
    'Add `errorComponent`, a sensible `timeout`, and limited retries for anything users depend on.',
    'Use a map of explicit loaders for dynamic choices — it is bundler-friendly and acts as a whitelist.',
    'Use the router\'s own lazy loading for route components.',
  ],

  useCases: [
    'Charts, maps and data-visualisation libraries on dashboards.',
    'Rich-text, code or image editors opened on demand.',
    'Large modals and wizards (checkout, onboarding) that most visitors never open.',
    'Admin-only or feature-flagged panels.',
    'CMS blocks or dashboard widgets loaded by type from a registry of loaders.',
  ],

  whenToUse: {
    use: [
      'The component (or the libraries it imports) is large and not needed for the first screen.',
      'Only some users or some interactions need it.',
      'You render components by type from data and don\'t want to ship all of them up front.',
    ],
    avoid: [
      'Small, always-visible components — the extra request costs more than it saves.',
      'Route components — use the router\'s `() => import()` directly.',
      'Content that must appear instantly with no loading state (critical above-the-fold UI).',
    ],
  },

  comparison: {
    title: 'Loading strategies',
    headers: ['', 'Static `import`', '`defineAsyncComponent`', 'Lazy route `() => import()`'],
    rows: [
      ['When the code downloads', 'before the app starts', 'first time the component renders', 'first navigation to the route'],
      ['Separate chunk?', 'no', 'yes', 'yes'],
      ['Loading / error UI', 'not needed', '`loadingComponent`, `errorComponent`, `timeout`', 'handled by router navigation (+ your own UI)'],
      ['Good for', 'small, essential components', 'heavy widgets within a page', 'whole pages'],
    ],
    note: 'All three can be combined: a lazy route can itself contain async components for its heaviest parts.',
  },

  quiz: [
    {
      id: 'async-components-q1',
      type: 'mcq',
      prompt: 'What does `defineAsyncComponent(() => import(\'./SalesChart.vue\'))` return?',
      options: [
        { text: 'A Promise that resolves to the component.', why: 'The loader returns a Promise; `defineAsyncComponent` returns a component you can render immediately.' },
        { text: 'A wrapper component that loads the real component the first time it renders.' },
        { text: 'The SalesChart component, already loaded.', why: 'Nothing is loaded until the wrapper renders.' },
        { text: 'A route record for Vue Router.', why: 'It\'s a Vue core API unrelated to routing.' },
      ],
      answer: 1,
      explanation: 'The wrapper is a normal component. It calls the loader on first render, shows loading/error states as configured, and then renders the real component.',
    },
    {
      id: 'async-components-q2',
      type: 'output',
      prompt: 'The loader below resolves after **120 ms**. What does the user see?',
      code: {
        lang: 'js',
        code: `const Chart = defineAsyncComponent({
  loader: () => slowImport(120),  // resolves after 120 ms
  loadingComponent: Spinner,
  delay: 200,
})`,
      },
      options: [
        { text: 'The spinner for 120 ms, then the chart', why: 'The spinner only appears if loading is still pending after `delay` (200 ms).' },
        { text: 'Nothing for 120 ms, then the chart — the spinner never appears' },
        { text: 'The spinner for 200 ms, then the chart', why: '`delay` is a threshold, not a minimum display time.' },
        { text: 'The error component, because 120 < 200', why: 'Errors only come from rejections or `timeout`.' },
      ],
      answer: 1,
      explanation: '`delay` prevents a flash of loading UI on fast loads: the loading component is shown only if the Promise is still pending once the delay has passed.',
    },
    {
      id: 'async-components-q3',
      type: 'bug',
      prompt: 'Every time `widgetType` changes — and sometimes on unrelated re-renders — the widget shows its loading state again. Which line causes the problem?',
      code: {
        lang: 'js',
        code: `import { computed, defineAsyncComponent } from 'vue'

const loaders = {
  chart: () => import('./ChartWidget.vue'),
  map: () => import('./MapWidget.vue'),
}

const Widget = computed(() => defineAsyncComponent(loaders[props.widgetType]))`,
      },
      answerLine: 8,
      explanation: 'Calling `defineAsyncComponent` inside a computed creates a brand-new wrapper type whenever it re-evaluates, so Vue remounts and reloads. Define one async component per loader up front (e.g. a map of async components) and pick from it.',
    },
    {
      id: 'async-components-q4',
      type: 'fill',
      prompt: 'Complete the definition: load the editor lazily and show a skeleton while it loads.',
      code: {
        lang: 'js',
        code: `const RichEditor = defineAsyncComponent({
  loader: () => ___('./RichEditor.vue'),
  ___: EditorSkeleton,
})`,
      },
      answer: [['import'], ['loadingComponent']],
      explanation: 'A dynamic `import()` returns a Promise of the module; `loadingComponent` is shown while it\'s pending (after `delay`).',
    },
    {
      id: 'async-components-q5',
      type: 'mcq',
      prompt: 'When is the `errorComponent` rendered? Select **all** that apply.',
      options: [
        { text: 'The loader\'s Promise rejects (and `onError` doesn\'t retry).' },
        { text: 'Loading takes longer than `timeout`.' },
        { text: 'Loading takes longer than `delay`.', why: '`delay` controls when the *loading* component appears.' },
        { text: 'The loaded component later throws during a click handler.', why: 'Runtime errors after loading are handled by normal error handling (`onErrorCaptured`, `app.config.errorHandler`).' },
      ],
      answer: [0, 1],
      explanation: 'The error component covers *loading* failures: rejection or timeout. It receives the error as its `error` prop.',
    },
    {
      id: 'async-components-q6',
      type: 'mcq',
      prompt: 'How should a route component be lazy-loaded with Vue Router?',
      options: [
        { text: '`component: defineAsyncComponent(() => import(\'./Reports.vue\'))`', why: 'The router docs advise against wrapping route components in async components.' },
        { text: '`component: () => import(\'./Reports.vue\')`' },
        { text: '`component: import(\'./Reports.vue\')`', why: 'That starts loading immediately at startup and passes a Promise, not a loader function.' },
        { text: '`component: \'./Reports.vue\'`', why: 'The router needs a component or a function returning a Promise of one.' },
      ],
      answer: 1,
      explanation: 'Vue Router accepts a function returning a Promise of the component and loads it during navigation.',
    },
    {
      id: 'async-components-q7',
      type: 'short',
      prompt: 'Why might lazy-loading *every* component be a bad idea?',
      answer: 'Each lazy component becomes its own request with its own loading state. Splitting small or always-visible components adds network round trips, loading flicker and possible waterfalls (one chunk discovering it needs another), which can make the app slower, not faster. Lazy-load what is heavy or rarely needed; keep the critical path eager.',
    },
  ],

  exercises: [
    {
      id: 'lazy-editor',
      title: 'Load the editor only when editing',
      difficulty: 'intermediate',
      prompt: `
\`App.vue\` imports \`RichEditor.vue\` statically, so its module is loaded at startup (see the console). Make it **lazy**:

- Use \`defineAsyncComponent\` with a dynamic \`import(\'./RichEditor.vue\')\`.
- Show \`EditorSkeleton\` **immediately** while it loads (no delay).
- Nothing about the template usage needs to change: clicking \`.edit\` still shows the editor with the note text.

The console message **RichEditor module loaded** must not appear until \`.edit\` is clicked.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import RichEditor from './RichEditor.vue'

const editing = ref(false)
const note = ref('Remember the milk')
</script>

<template>
  <p class="note">{{ note }}</p>
  <button class="edit" @click="editing = true">Edit</button>
  <RichEditor v-if="editing" :text="note" />
</template>`,
        ...editorFiles,
      },
      hints: [
        'Replace the static import with `const RichEditor = defineAsyncComponent(...)` (import `defineAsyncComponent` from `vue`).',
        'Use the options form: `{ loader: () => import(\'./RichEditor.vue\'), loadingComponent: EditorSkeleton, delay: 0 }`.',
        'Import `EditorSkeleton` statically — it must be ready while the editor loads.',
      ],
      solution: {
        explanation: 'The static import forced the editor module to load with the app. The dynamic `import()` inside the loader defers it until the wrapper first renders (when `editing` becomes true). `delay: 0` shows the skeleton straight away; props pass through the wrapper unchanged.',
        files: {
          'App.vue': `<script setup>
import { ref, defineAsyncComponent } from 'vue'
import EditorSkeleton from './EditorSkeleton.vue'

const RichEditor = defineAsyncComponent({
  loader: () => import('./RichEditor.vue'),
  loadingComponent: EditorSkeleton,
  delay: 0,
})

const editing = ref(false)
const note = ref('Remember the milk')
</script>

<template>
  <p class="note">{{ note }}</p>
  <button class="edit" @click="editing = true">Edit</button>
  <RichEditor v-if="editing" :text="note" />
</template>`,
          ...editorFiles,
        },
      },
      tests: [
        { name: 'the editor module is not loaded at startup', code: `expect(logs).not.toContain('RichEditor module loaded')` },
        {
          name: 'clicking Edit shows the skeleton immediately, then the editor',
          code: `await click('.edit')
expect(exists('.skeleton')).toBe(true)
await wait(50)
expect(exists('.editor')).toBe(true)
expect(logs).toContain('RichEditor module loaded')`,
        },
        {
          name: 'props still reach the editor',
          code: `await click('.edit')
await wait(50)
expect(find('.editor-input').value).toBe('Remember the milk')`,
        },
      ],
    },
    {
      id: 'flaky-report',
      title: 'Retries and an error state for a flaky chunk',
      difficulty: 'intermediate',
      prompt: `
The report chart is loaded through a fake flaky network (\`network.js\`): by default its first **2** requests fail.

Define \`ReportChart\` in \`App.vue\` with \`defineAsyncComponent\` so that:

- the loader is \`() => overNetwork(() => import(\'./ReportChart.vue\'))\`;
- \`ReportLoading\` is shown immediately while loading;
- failed loads are **retried up to 3 times** (then give up);
- after giving up, \`ReportError\` is shown.

Clicking \`.load\` renders the chart.
`,
      files: {
        'App.vue': `<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { overNetwork } from './network.js'
import ReportLoading from './ReportLoading.vue'
import ReportError from './ReportError.vue'

// TODO: improve this definition
const ReportChart = defineAsyncComponent(() => overNetwork(() => import('./ReportChart.vue')))

const show = ref(false)
</script>

<template>
  <button class="load" @click="show = true">Load report</button>
  <ReportChart v-if="show" />
</template>`,
        ...reportFiles,
      },
      hints: [
        'Switch to the options form: `defineAsyncComponent({ loader: …, loadingComponent: …, errorComponent: …, delay: 0 })`.',
        'Add `onError(error, retry, fail, attempts) { … }`.',
        'Inside it: `if (attempts <= 3) retry(); else fail()`.',
      ],
      solution: {
        explanation: '`onError` is called for each failed attempt with a running count. Retrying while `attempts <= 3` allows up to four requests in total; after that `fail()` hands the error to `errorComponent`. With two transient failures, the third request succeeds and the chart renders.',
        files: {
          'App.vue': `<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { overNetwork } from './network.js'
import ReportLoading from './ReportLoading.vue'
import ReportError from './ReportError.vue'

const ReportChart = defineAsyncComponent({
  loader: () => overNetwork(() => import('./ReportChart.vue')),
  loadingComponent: ReportLoading,
  errorComponent: ReportError,
  delay: 0,
  onError(error, retry, fail, attempts) {
    if (attempts <= 3) retry()
    else fail()
  },
})

const show = ref(false)
</script>

<template>
  <button class="load" @click="show = true">Load report</button>
  <ReportChart v-if="show" />
</template>`,
          ...reportFiles,
        },
      },
      tests: [
        { name: 'shows the loading component right away', code: `await click('.load'); expect(exists('.report-loading')).toBe(true)` },
        {
          name: 'retries until the chart loads',
          code: `await click('.load')
await wait(700)
expect(exists('.report')).toBe(true)
expect(logs).toContain('request 3')`,
        },
        {
          name: 'gives up after 3 retries and shows the error',
          code: `requireModule('network.js').config.failures = 10
await click('.load')
await wait(900)
expect(exists('.report-error')).toBe(true)
expect(text('.report-error')).toContain('Network error')
expect(logs).toContain('request 4')
expect(logs).not.toContain('request 5')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'async-components-what-why',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is an async component in Vue 3, and why would you use one?',
      answer: 'A component whose code is loaded on demand. `defineAsyncComponent(loader)` returns a wrapper that calls the loader (usually `() => import(\'./X.vue\')`) the first time it renders, then renders the real component and caches it. Combined with the bundler\'s code splitting, it keeps heavy or rarely used components out of the initial bundle, improving startup time.',
      explanation: 'Lazy loading at component granularity.',
      whyAsked: 'Performance and bundle-size awareness are common interview themes.',
      mistakes: ['Thinking Vue itself splits the code (it\'s the bundler).', 'Not mentioning loading/error handling.', 'Suggesting it for every component.'],
      followUps: ['What options does it take?', 'How is this different from lazy routes?', 'What can go wrong in production?'],
      modelAnswer: 'An async component is loaded only when it\'s first needed. I wrap a loader — normally a dynamic `import()` — in `defineAsyncComponent`, and use the result like any component; props and slots pass through. The bundler turns the dynamic import into its own chunk, so the main bundle shrinks. Because loading takes time and can fail, I configure a loading component, an error component and a timeout. I use it for heavy, rarely needed parts like charts, editors or admin panels — not for everything.',
    },
    {
      id: 'async-components-options',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Your map widget is lazy-loaded. Users on fast connections complain about a spinner flicker; users on slow mobile connections sometimes wait forever with a blank box. How do you configure the async component?',
      answer: 'Keep (or tune) `delay` so the loading component only appears if loading takes longer than ~200 ms (no flicker on fast loads), use a skeleton of the same size to avoid layout jumps, set a `timeout` so slow loads end in the `errorComponent` instead of waiting forever, add a few `onError` retries for transient failures, and give the error component a "Try again" path.',
      explanation: 'delay → no flicker; timeout + errorComponent → no infinite wait.',
      code: {
        lang: 'js',
        code: `defineAsyncComponent({
  loader: () => import('./MapWidget.vue'),
  loadingComponent: MapSkeleton,
  delay: 200,
  errorComponent: MapUnavailable,
  timeout: 10000,
  onError: (err, retry, fail, attempts) => (attempts <= 2 ? retry() : fail()),
})`,
      },
      whyAsked: 'Tests practical knowledge of the options and UX thinking.',
      mistakes: ['Setting `delay: 0` everywhere.', 'Leaving `timeout` at its default of Infinity for critical UI.', 'Unlimited retries.'],
      followUps: ['How would you implement a "Try again" button?', 'How would you measure whether lazy loading helped?'],
      modelAnswer: 'The flicker comes from showing the loading UI too early, so I keep the default 200 ms `delay` and use a same-size skeleton. The infinite wait is because `timeout` defaults to Infinity, so I set one, plus an `errorComponent` with a clear message. A couple of `onError` retries handle transient failures. The result: fast users see the map directly, slow users see a skeleton, and failures end in a recoverable error state.',
    },
    {
      id: 'async-components-vs-routes',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 2,
      question: 'Compare `defineAsyncComponent` with lazy-loaded routes in Vue Router.',
      answer: 'Both rely on dynamic `import()` and code splitting. Lazy routes use `component: () => import(\'./View.vue\')` and load during navigation, integrated with guards and navigation timing; the router docs advise not to wrap them in `defineAsyncComponent`. `defineAsyncComponent` lazy-loads pieces *within* a page, with built-in loading/error/timeout handling. They\'re complementary: a lazy route can contain async components.',
      explanation: 'Routes → router\'s loader function; widgets inside a page → defineAsyncComponent.',
      whyAsked: 'Checks that you know which tool fits which level, and a commonly cited pitfall.',
      mistakes: ['Wrapping route components in defineAsyncComponent.', 'Thinking lazy routes give you loading/error components automatically.'],
      followUps: ['How would you show a loading bar during lazy route navigation?'],
      modelAnswer: 'They\'re the same underlying idea — dynamic import plus code splitting — at different levels. For pages, I give the route a `() => import()` function and the router loads it during navigation, which plays well with guards. For heavy parts inside a page, like a chart or editor, I use `defineAsyncComponent` because it gives me loading, error and timeout states. The router docs specifically say not to wrap route components in async components.',
    },
    {
      id: 'async-components-deploy-errors',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'After each production deploy, error monitoring shows a spike of "Failed to fetch dynamically imported module" for a few hours. What\'s happening and how do you mitigate it?',
      answer: 'Users with the old version still open request lazy chunks by their old hashed filenames; the new deploy removed those files, so the dynamic import fails. Mitigations: keep previous build assets available for a while after deploying; handle chunk-load failures with an error component (or router error handler) that offers or performs a reload; optionally listen for Vite\'s `vite:preloadError` event; avoid caching `index.html` aggressively so new visits get the new manifest.',
      explanation: 'Hashed chunk names change between builds; old tabs point at files that no longer exist.',
      whyAsked: 'A real production issue that separates people who have shipped code-split apps.',
      mistakes: ['Blaming the user\'s network.', 'Retrying the same missing file forever.', 'Disabling code splitting entirely.'],
      followUps: ['How would you avoid reload loops?', 'How does this interact with service workers?'],
      modelAnswer: 'Code-split chunks have content hashes in their names. A user who loaded the old version keeps references to old chunk names; after we deploy, those files are gone, so lazy imports 404. I\'d keep old assets around for a grace period, make sure `index.html` isn\'t cached long, and handle chunk failures in the UI — an error component or router error hook that reloads the page once, guarded so it can\'t loop. Vite also exposes a `vite:preloadError` event I can hook into.',
    },
    {
      id: 'async-components-what-to-split',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'How do you decide which components to lazy-load in a large dashboard app?',
      answer: 'Measure first (bundle analyser, performance profiling). Lazy-load by route first; then within pages, split components that are heavy (big dependencies like chart/map/editor libraries), not visible on first paint, or used by a minority (admin, settings, modals). Avoid splitting small or always-visible components, avoid waterfalls (prefetch dependent chunks, group related components), make sure no static import undoes the split, and prefetch on user intent (hover/focus) for snappy interactions.',
      explanation: 'Split along cost and likelihood of use, guided by measurement.',
      whyAsked: 'Architecture-level performance judgment.',
      mistakes: ['Lazy-loading everything.', 'Not measuring.', 'Ignoring loading UX and failures.'],
      followUps: ['How would you prefetch a chunk?', 'What metrics would you track?'],
      modelAnswer: 'I start by measuring the bundle to see what\'s actually large. Routes are the first split. Inside pages, I lazy-load components that pull in heavy libraries, sit below the fold, or are used rarely — charts, maps, editors, admin panels, big dialogs. I don\'t split small always-visible pieces, because extra requests and loading states cost more than they save. I check nothing imports the lazy file statically, prefetch on hover or focus, and design loading skeletons and error states as part of the feature.',
    },
    {
      id: 'async-components-suspense',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'How do async components interact with `<Suspense>`?',
      answer: 'Async components are suspensible by default: if there\'s a `<Suspense>` ancestor, the async component registers as a pending dependency and Suspense shows its `#fallback` until all pending dependencies resolve. In that case the component\'s own `loadingComponent`, `errorComponent`, `delay` and `timeout` options are ignored. Setting `suspensible: false` makes it manage its own loading state. `<Suspense>` is still experimental, so its API may change.',
      explanation: 'Suspense coordinates loading for a whole subtree; options on the async component apply only when it isn\'t controlled by Suspense.',
      whyAsked: 'Probes depth on Vue\'s async rendering model.',
      mistakes: ['Not knowing Suspense is experimental.', 'Expecting both Suspense fallback and loadingComponent to show.'],
      followUps: ['How do components with async setup relate to this?', 'How would you handle errors under Suspense?'],
      modelAnswer: 'By default an async component is suspensible: under a `<Suspense>` boundary it becomes one of the boundary\'s pending dependencies, Suspense shows its fallback slot until everything resolves, and the component\'s own loading/error/timeout options are ignored. If I want the component to handle its own states, I set `suspensible: false`. I\'d also mention Suspense is still experimental, and errors under it are typically caught with `onErrorCaptured` in a parent.',
    },
    {
      id: 'async-components-coding-help',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Make `HelpPanel` lazy: its module must load only when the panel is first opened, and only once no matter how many times it is toggled. Keep the `.toggle-help` button and the `<HelpPanel v-if>` usage.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import HelpPanel from './HelpPanel.vue'

const open = ref(false)
</script>

<template>
  <button class="toggle-help" @click="open = !open">Help</button>
  <HelpPanel v-if="open" />
</template>`,
          ...helpFiles,
        },
      },
      tests: [
        { name: 'not loaded at startup', code: `expect(logs).not.toContain('HelpPanel module loaded')` },
        {
          name: 'loads when opened',
          code: `await click('.toggle-help')
await wait(30)
expect(exists('.help-panel')).toBe(true)
expect(logs).toContain('HelpPanel module loaded')`,
        },
        {
          name: 'loads only once across toggles',
          code: `for (let i = 0; i < 3; i++) { await click('.toggle-help'); await wait(30); await click('.toggle-help') }
expect(logs.filter((l) => l === 'HelpPanel module loaded')).toHaveLength(1)`,
        },
      ],
      hints: ['Replace the static import with `defineAsyncComponent`.', '`const HelpPanel = defineAsyncComponent(() => import(\'./HelpPanel.vue\'))`.'],
      answer: 'Define `HelpPanel` with `defineAsyncComponent(() => import(\'./HelpPanel.vue\'))`; the wrapper loads the module on first render and caches it.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, defineAsyncComponent } from 'vue'

const HelpPanel = defineAsyncComponent(() => import('./HelpPanel.vue'))

const open = ref(false)
</script>

<template>
  <button class="toggle-help" @click="open = !open">Help</button>
  <HelpPanel v-if="open" />
</template>`,
          ...helpFiles,
        },
      },
      explanation: 'The wrapper calls the loader once and reuses the resolved component; the module system also evaluates a module only once.',
      whyAsked: 'Quick hands-on check of the basic API and its caching behaviour.',
      mistakes: ['Keeping the static import alongside the async one.', 'Calling `defineAsyncComponent` inside the click handler.'],
      followUps: ['How would you prefetch it when the user hovers the button?', 'What would you show if loading fails?'],
      modelAnswer: 'I remove the static import and define `HelpPanel` with `defineAsyncComponent(() => import(\'./HelpPanel.vue\'))` at the top of the script. The first time `open` becomes true the wrapper calls the loader; afterwards it renders the cached component instantly, so the module loads once. To make it snappier I could call the same `import()` on `mouseenter` to prefetch.',
    },
  ],

  takeaways: [
    '`defineAsyncComponent(loader)` returns a wrapper that loads the real component the first time it renders.',
    'Use a dynamic `import()` in the loader so the bundler creates a separate chunk.',
    '`loadingComponent` appears after `delay` (200 ms default); `errorComponent` covers rejections and `timeout` (default Infinity).',
    '`onError(error, retry, fail, attempts)` enables limited retries; the resolved component is cached.',
    'Define async components once; never inside computed values or render code; and don\'t import the same file statically elsewhere.',
    'Use `() => import()` directly for routes; lazy-load what is heavy or rarely used, not everything.',
  ],
}
