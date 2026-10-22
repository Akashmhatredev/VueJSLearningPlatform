// Lesson: Code splitting, lazy loading & tree shaking — Level 12, Performance

const networkJs = `import { reactive } from 'vue'

// Simulated network conditions for this sandbox
export const net = reactive({ offline: false })

export function slowNetwork(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Wraps a loader so it fails while "offline" is checked —
// like a chunk request failing in a real browser
export function maybeOffline(loader) {
  return () =>
    net.offline
      ? Promise.reject(new Error('Failed to fetch dynamically imported module'))
      : loader()
}`

const chartLibJs = `// Pretend this is a large third-party charting library.
// The log line shows WHEN this module is loaded and evaluated.
console.log('[chunk] chartLib.js loaded')

export function toBars(values, max = 100) {
  const top = Math.max(...values)
  return values.map((v) => Math.round((v / top) * max))
}`

const salesChartVue = `<script setup>
import { toBars } from './chartLib.js'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const sales = [120, 340, 200, 410, 280]
const bars = toBars(sales)
</script>

<template>
  <div class="chart">
    <div
      v-for="(height, i) in bars"
      :key="days[i]"
      class="bar"
      :style="{ height: height + 'px' }"
      :title="days[i] + ': ' + sales[i] + ' orders'"
    >{{ days[i] }}</div>
  </div>
</template>

<style scoped>
.chart { display: flex; align-items: flex-end; gap: 6px; height: 110px; margin-top: 12px; }
.bar { width: 40px; background: #4f7cff; color: white; font-size: 12px; text-align: center; }
</style>`

const dashboardApp = `<script setup>
import { ref } from 'vue'
import SalesChart from './SalesChart.vue' // eager: loads with the app, even if never shown
import { net } from './network.js'

const showChart = ref(false)
</script>

<template>
  <h2>Dashboard</h2>
  <p class="summary">Orders today: 42 · Open tickets: 7</p>
  <label><input type="checkbox" class="offline" v-model="net.offline" /> Simulate offline</label>
  <button class="toggle-chart" @click="showChart = !showChart">
    {{ showChart ? 'Hide' : 'Show' }} sales chart
  </button>
  <SalesChart v-if="showChart" />
</template>`

const routerMain = `import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'

createApp(App).use(router).mount('#app')`

const routerApp = `<template>
  <nav>
    <RouterLink to="/" class="to-home">Home</RouterLink> ·
    <RouterLink to="/reports" class="to-reports">Reports</RouterLink> ·
    <RouterLink to="/settings" class="to-settings">Settings</RouterLink>
  </nav>
  <RouterView />
</template>`

const homeView = `<template>
  <section class="home"><h2>Home</h2><p>Welcome back!</p></section>
</template>`

const reportsView = `<script setup>
import { summarize } from '../reportEngine.js'
const summary = summarize([12, 30, 18])
</script>

<template>
  <section class="reports"><h2>Reports</h2><p>Total: {{ summary.total }}</p></section>
</template>`

const settingsView = `<script setup>
import { fields } from '../settingsSchema.js'
</script>

<template>
  <section class="settings">
    <h2>Settings</h2>
    <p v-for="f in fields" :key="f">{{ f }}</p>
  </section>
</template>`

const reportEngine = `// Pretend this is a big reporting library
console.log('[chunk] reportEngine.js loaded')

export function summarize(values) {
  return { total: values.reduce((sum, v) => sum + v, 0) }
}`

const settingsSchema = `// Pretend this is a large form schema
console.log('[chunk] settingsSchema.js loaded')

export const fields = ['Display name', 'Email', 'Language']`

const widgetNetwork = `import { reactive } from 'vue'

export const net = reactive({ slow: false })

// Simulates downloading the widget's chunk:
// 300 ms normally, 1500 ms on a "slow network"
export function loadWidget() {
  return new Promise((resolve) => setTimeout(resolve, net.slow ? 1500 : 300))
    .then(() => import('./MapWidget.vue'))
}`

export default {
  id: 'bundle-optimization',
  title: 'Code splitting, lazy loading & tree shaking',
  summary: 'Ship less JavaScript up front: split code at dynamic imports, lazy-load routes and heavy components with good loading and error states, let tree shaking drop what you don\'t use, and optimise assets.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['async-components', 'lazy-routes-scroll', 'es-modules'],
  related: ['measuring-performance', 'runtime-performance', 'production-readiness', 'create-vue-project', 'how-vue-updates'],
  tags: ['performance', 'bundle', 'code splitting', 'lazy loading', 'dynamic import', 'defineAsyncComponent', 'lazy routes', 'tree shaking', 'prefetch', 'preload', 'compile-time flags', 'images', 'fonts', 'Vite'],
  apis: [
    { name: 'import()', summary: 'Dynamic import: loads a module on demand and returns a promise. Bundlers turn each one into a split point (a separate chunk).' },
    { name: 'defineAsyncComponent()', summary: 'Wraps a loader into a component that loads on first render, with optional loadingComponent, errorComponent, delay, timeout and onError.' },
    { name: 'component: () => import(...)', summary: 'Vue Router: a lazily loaded route component, fetched on first navigation to the route.' },
    { name: '__VUE_OPTIONS_API__ / __VUE_PROD_DEVTOOLS__ / __VUE_PROD_HYDRATION_MISMATCH_DETAILS__', summary: 'Vue compile-time feature flags for bundler builds; the last one is 3.4+.' },
  ],
  docs: [
    { label: 'Vue Guide — Performance: Page Load Optimizations', url: 'https://vuejs.org/guide/best-practices/performance.html#page-load-optimizations' },
    { label: 'Vue Guide — Async Components', url: 'https://vuejs.org/guide/components/async.html' },
    { label: 'Vue Router — Lazy Loading Routes', url: 'https://router.vuejs.org/guide/advanced/lazy-loading.html' },
    { label: 'API — Compile-Time Flags', url: 'https://vuejs.org/api/compile-time-flags.html' },
    { label: 'Vite — Building for Production', url: 'https://vite.dev/guide/build.html' },
  ],

  intro: `
Before your app can do anything, the browser has to **download, parse and execute** its JavaScript. Every kilobyte in the first bundle delays the first useful screen — especially on slow phones and networks.

The fix isn't "write less code"; it's **send less code up front**. This lesson covers the levers:

- **code splitting** — cut the app into chunks at \`import()\` boundaries;
- **lazy loading** — routes, heavy components and libraries load when needed, with honest loading and error states;
- **prefetching** — start a download *before* it's needed, when you can predict it;
- **tree shaking** — let the bundler drop code you never use;
- **production builds and assets** — Vue's build flags, images and fonts.
`,

  why: `
A single-page app built naively puts every screen in one file: the admin area, the charts, the PDF export, the settings forms. A visitor who only wants the home page downloads all of it.

That cost shows up in the metrics users feel: a later **Largest Contentful Paint** (main content appears late) and a busy main thread that delays responses to taps (**Interaction to Next Paint**) — see [measuring performance](lesson:measuring-performance).

Splitting turns "download everything, then start" into "download what this screen needs, fetch the rest later". The trade-off is that later navigations may wait for a chunk — which is why loading states, error handling and prefetching are part of the job, not extras.
`,

  eli15: `
Imagine moving into a new flat. You *could* wait until every box — winter clothes, camping gear, the old photo albums — is delivered before you sleep there. Or you could have the bed, the kettle and a toothbrush delivered first, and the rest when you actually need it.

Code splitting is ordering your app in boxes. The **first box** (the main chunk) has just what the first screen needs. Other boxes (chunks) are fetched when you open that part of the app — sometimes a little early, if you can guess you'll need them soon (that's prefetching).

**Tree shaking** is the moving company noticing you packed an entire toolbox but only ever use the screwdriver — and leaving the rest behind.
`,

  analogy: {
    title: 'Moving house in boxes',
    body: `
Deliver the essentials first, the rest on demand. Label boxes so the courier can fetch exactly one. Don't ship tools you never use.
`,
    mapping: [
      ['the first delivery', 'the entry chunk: what the first screen needs'],
      ['a labelled box', 'a chunk created at an `import()` split point'],
      ['asking for a box when you need it', 'lazy loading a route, component or library'],
      ['asking for a box early because you know you\'ll need it', 'prefetching on hover or when idle'],
      ['leaving unused tools behind', 'tree shaking unused exports'],
      ['"the box is delayed" note on the door', 'a loading component; "the box got lost" → an error component'],
    ],
  },

  visual: {
    type: 'performance',
    props: { demo: 'lazy-routes' },
    title: 'Lazy routes, measured',
    caption: 'A live demo that navigates between routes and shows, from your own browser, when each route\'s code is loaded and how long it took.',
    alt: 'A measured live demo of lazy-loaded routes. Navigating to a route for the first time triggers loading its code chunk, shown with a timing measured in the learner\'s browser; returning to it later reuses the already-loaded code.',
  },

  syntax: [
    `
#### Dynamic \`import()\` is a split point

A static \`import x from './x.js'\` puts \`x.js\` (and everything it imports) into the importing chunk. A dynamic \`import('./x.js')\` returns a promise — and tells the bundler (Vite, Rollup/Rolldown, webpack…) to put that module in a **separate chunk** that is fetched only when the code runs.
`,
    {
      code: `// Load a heavy library only when the user needs it
async function exportPdf() {
  const { exportToPdf } = await import('./pdfExport.js') // separate chunk
  exportToPdf(report.value)
}`,
      lang: 'js',
      title: 'dynamic import in a handler',
    },
    `
#### Lazy components: \`defineAsyncComponent\`
`,
    {
      code: `import { defineAsyncComponent } from 'vue'
import ChartSkeleton from './ChartSkeleton.vue'
import ChartError from './ChartError.vue'

// simplest form
const SalesChart = defineAsyncComponent(() => import('./SalesChart.vue'))

// with loading and error states
const SalesChartWithStates = defineAsyncComponent({
  loader: () => import('./SalesChart.vue'),
  loadingComponent: ChartSkeleton, // shown while loading…
  delay: 200,                      // …but only after 200 ms (the default) — no flash on fast loads
  errorComponent: ChartError,      // shown if the loader rejects…
  timeout: 10000,                  // …or takes longer than this (default: no timeout)
  onError(error, retry, fail, attempts) {
    attempts <= 3 ? retry() : fail() // optional automatic retries
  },
})`,
      lang: 'js',
      title: 'async components',
    },
    `
The component loads the first time it renders. If loading fails, the error component shows; the next time the component is rendered, Vue calls the loader again. If the chunk arrives *after* a timeout, Vue swaps the error component for the real one.

#### Lazy routes (Vue Router)

Route components are the most natural split points. This is a **Vue Router** feature, not Vue core:
`,
    {
      code: `import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'          // eager: the landing page

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/reports', component: () => import('./views/ReportsView.vue') },  // lazy
    { path: '/settings', component: () => import('./views/SettingsView.vue') }, // lazy
  ],
})`,
      lang: 'js',
      title: 'router.js',
      static: true,
    },
    {
      callout: 'warn',
      title: 'Don\'t wrap route components in defineAsyncComponent',
      text: 'Vue Router handles lazy route components itself (`component: () => import(…)`). Wrapping them in `defineAsyncComponent` is unnecessary — and the Vue Router docs advise against it. Use `defineAsyncComponent` for components *inside* pages.',
    },
    `
#### Prefetching and preloading

- **Preload** = "needed for this page, fetch it now with high priority". Vite generates \`<link rel="modulepreload">\` for the entry's static dependencies, and when a lazy chunk is requested it also fetches that chunk's shared dependencies in parallel instead of one after another.
- **Prefetch** = "probably needed soon". You can start a lazy import early — when a user hovers a link, or when the browser is idle — by calling the same \`import()\`: the module is fetched once and reused.
`,
    {
      code: `// Same import() string as the lazy component → same chunk, fetched once
function prefetchChart() {
  import('./SalesChart.vue')
}
// <button @mouseenter="prefetchChart" @focus="prefetchChart" @click="show = true">`,
      lang: 'js',
      title: 'prefetch on intent',
    },
    `
#### Tree shaking

Bundlers remove exports nobody imports — but only when they can prove it's safe. That requires **ES module syntax** (\`import\`/\`export\`, analysable without running code) and modules **without side effects** at import time.
`,
    {
      code: `// ✅ tree-shakable: named ESM imports from an ESM build
import { debounce } from 'lodash-es'
import { ref, computed } from 'vue'     // Vue's APIs are tree-shakable named exports

// ❌ pulls in the whole library: CommonJS build, default import of everything
import _ from 'lodash'

// Libraries declare "importing me has no side effects" in package.json:
// { "sideEffects": false }  (or a list of files that DO have side effects, e.g. CSS)`,
      lang: 'js',
      title: 'shake-friendly imports',
      static: true,
    },
    `
#### Production builds and Vue's compile-time flags

\`vite build\` produces a production bundle: minified, without Vue's development warnings and checks, with content-hashed file names for long-term caching. **Never ship or measure a development build.** Vue's bundler builds also read compile-time flags:
`,
    {
      code: `// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    __VUE_OPTIONS_API__: 'false',      // drop Options API support (only if NO code or library needs it)
    __VUE_PROD_DEVTOOLS__: 'false',    // devtools support in production (default off)
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false', // 3.4+: detailed SSR mismatch info in prod
  },
})`,
      lang: 'js',
      title: 'compile-time flags',
      static: true,
    },
    {
      callout: 'warn',
      title: 'Careful with __VUE_OPTIONS_API__',
      text: 'Setting it to `false` removes Options API support from the bundle. Any component that uses the Options API — including ones inside third-party libraries — will break. Check your dependencies before turning it off.',
    },
    `
#### Assets: often the biggest bytes

| Asset | Do | Why |
|---|---|---|
| Hero / LCP image | correct size, modern format (AVIF/WebP with fallback), \`fetchpriority="high"\`, **not** lazy | it *is* the main content |
| Other images | \`srcset\`/\`sizes\`, \`loading="lazy"\` below the fold | don't download what isn't visible |
| All images | explicit \`width\`/\`height\` (or \`aspect-ratio\`) | reserves space, prevents layout shift (CLS) |
| Fonts | few weights, subset, \`font-display: swap\`, preload the critical one | text appears sooner |
| Icons | import only the icons you use | icon packs are huge |

Vite hashes asset file names for caching and inlines very small assets into the bundle (configurable with \`build.assetsInlineLimit\`).
`,
    {
      callout: 'note',
      title: 'Bundler details change — check your version\'s docs',
      text: 'How chunks are grouped (and the config options to control it) depends on your bundler and version — recent Vite versions moved to the Rolldown bundler, and chunking options changed along the way. Learn the concepts here, and use the Vite build docs for the exact config of your version. Analyse the output with a bundle visualizer (e.g. rollup-plugin-visualizer, vite-bundle-visualizer, source-map-explorer) instead of guessing.',
    },
  ],

  walkthrough: {
    title: 'App.vue (dashboard — before)',
    lang: 'vue',
    code: dashboardApp,
    intro: 'The playground starts with everything eager. Watch the console: the chart library loads at startup, even if nobody ever opens the chart.',
    steps: [
      { lines: [3], text: 'A static import. `SalesChart.vue` — and `chartLib.js`, which it imports — become part of the code that runs at startup. The console shows `[chunk] chartLib.js loaded` before you click anything.' },
      { lines: [4], text: '`network.js` simulates network conditions (offline, slow) so loading and error states can be tested in a sandbox without a real network.' },
      { lines: [6], text: 'The chart is optional: it only renders when the user asks for it. That makes it a perfect candidate for lazy loading.' },
      { lines: [12], text: 'The "Simulate offline" checkbox flips `net.offline`. Nothing uses it yet — experiment 3 will make chunk loading fail while it\'s checked.' },
      { lines: [16], text: 'Rendered only when `showChart` is true. With an async component, *this* is the moment its code would load.' },
    ],
  },

  playground: {
    title: 'Lazy-load a heavy chart',
    objective: 'Move a heavy chart out of the startup code, give it loading and error states, and prefetch it on hover — proving each step with the console.',
    files: {
      'App.vue': dashboardApp,
      'SalesChart.vue': salesChartVue,
      'chartLib.js': chartLibJs,
      'network.js': networkJs,
      'ChartSkeleton.vue': `<template>
  <div class="skeleton">Loading chart…</div>
</template>`,
      'ChartError.vue': `<template>
  <div class="chart-error">The chart couldn't load. Check your connection and try again.</div>
</template>`,
    },
    expected: `
A small dashboard with a **Show sales chart** button. The console already says \`[chunk] chartLib.js loaded\` — before you asked for the chart. Click the button and a bar chart appears instantly (its code was already loaded).

> **Note:** In this sandbox, \`import()\` resolves asynchronously like a real lazy chunk, but nothing is downloaded over a network. \`network.js\` simulates slow and failing networks so you can see loading and error states.
`,
    experiments: [
      {
        id: 'lazy-chart',
        task: 'Make the chart **lazy**: replace the static import with `const SalesChart = defineAsyncComponent(() => import(\'./SalesChart.vue\'))`. The chart library must not load until the chart is shown.',
        hint: 'Import `defineAsyncComponent` from `\'vue\'` and delete `import SalesChart from \'./SalesChart.vue\'`.',
        tests: [
          {
            name: 'the chart library loads only when the chart is shown',
            code: `expect(logs.some((l) => l.includes('[chunk] chartLib.js'))).toBe(false)
await click('.toggle-chart')
await wait(50)
expect(exists('.chart')).toBe(true)
expect(logs.some((l) => l.includes('[chunk] chartLib.js'))).toBe(true)`,
          },
        ],
        explain: 'The dynamic `import()` is a split point: in a real build, `SalesChart.vue` and `chartLib.js` would become a separate chunk, downloaded on first render. Startup now only pays for what the dashboard shows.',
      },
      {
        id: 'loading-state',
        task: 'Simulate a slow network and show a skeleton: use the options form with `loader: () => slowNetwork(400).then(() => import(\'./SalesChart.vue\'))`, `loadingComponent: ChartSkeleton` and `delay: 100`.',
        hint: 'Import `slowNetwork` from `./network.js` and `ChartSkeleton` from `./ChartSkeleton.vue`, then pass an object to `defineAsyncComponent({ … })`.',
        tests: [
          {
            name: 'a skeleton shows while loading, then the chart',
            code: `await click('.toggle-chart')
await wait(200)
expect(exists('.skeleton')).toBe(true)
expect(exists('.chart')).toBe(false)
await wait(450)
expect(exists('.chart')).toBe(true)
expect(exists('.skeleton')).toBe(false)`,
          },
        ],
        explain: '`delay` avoids flashing a spinner for loads that finish quickly; the skeleton only appears if loading takes longer than 100 ms. Real chunk downloads vary with the network — a good loading state makes the wait honest.',
      },
      {
        id: 'error-state',
        task: 'Handle failure: wrap the loader with `maybeOffline(...)` from network.js and add `errorComponent: ChartError`. With **Simulate offline** checked, showing the chart must display the error message.',
        hint: '`loader: maybeOffline(() => import(\'./SalesChart.vue\'))` (you can keep `slowNetwork` inside). Import `ChartError` and `maybeOffline`.',
        tests: [
          {
            name: 'a failed load shows the error component',
            code: `await check('.offline', true)
await click('.toggle-chart')
await wait(600)
expect(exists('.chart-error')).toBe(true)
expect(exists('.chart')).toBe(false)`,
          },
        ],
        explain: 'Chunk requests fail in real life: flaky mobile networks, or a deploy that deleted the old chunk files. An error component turns a blank hole into a message. Uncheck offline, hide and show the chart: Vue calls the loader again on the next render.',
      },
      {
        id: 'prefetch-hover',
        task: 'After making the chart lazy, **prefetch** it: add a `prefetchChart()` function that calls `import(\'./SalesChart.vue\')` and bind it to the button\'s `@mouseenter`. Hovering should load the chart code before the click.',
        hint: '`function prefetchChart() { import(\'./SalesChart.vue\') }` and `<button … @mouseenter="prefetchChart">`.',
        tests: [
          {
            name: 'hovering loads the chunk; nothing loads at startup',
            code: `expect(logs.some((l) => l.includes('[chunk] chartLib.js'))).toBe(false)
await trigger('.toggle-chart', 'mouseenter')
await wait(30)
expect(logs.some((l) => l.includes('[chunk] chartLib.js'))).toBe(true)
expect(exists('.chart')).toBe(false)`,
          },
        ],
        explain: 'The same `import()` string resolves to the same module, which is loaded once and cached — so the click that follows renders immediately. Hover (and focus, for keyboard users) is a cheap, strong signal of intent.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'From one bundle to chunks',
    caption: 'How dynamic imports split a build, and what the browser downloads when.',
    alt: 'A stepped diagram of a code-split build. The entry chunk contains the app shell, router and home view, with Vue and shared dependencies alongside. Dynamic imports create separate chunks for the Reports view, the Settings view and a chart library. The first visit downloads only the entry and shared code; navigating to Reports fetches its chunk and the chart library; prefetching can start that download on hover; hashed file names let browsers cache chunks.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'entry', label: 'entry chunk', note: 'app shell · router · Home', x: 130, y: 80, tone: 'acid' },
        { id: 'shared', label: 'shared chunk', note: 'vue + shared deps', x: 130, y: 240, tone: 'paper' },
        { id: 'reports', label: 'Reports chunk', note: "import('./ReportsView.vue')", x: 420, y: 60, tone: 'cobalt' },
        { id: 'settings', label: 'Settings chunk', note: "import('./SettingsView.vue')", x: 420, y: 160, tone: 'cobalt' },
        { id: 'chart', label: 'chart library chunk', note: 'only Reports imports it', x: 650, y: 60, tone: 'kraft' },
        { id: 'cache', label: 'browser cache', note: 'hashed file names', x: 560, y: 270, tone: 'ink' },
      ],
      edges: [
        { from: 'entry', to: 'shared', label: 'static import' },
        { id: 'toReports', from: 'entry', to: 'reports', label: 'import()', dashed: true },
        { id: 'toSettings', from: 'entry', to: 'settings', label: 'import()', dashed: true },
        { from: 'reports', to: 'chart', label: 'static import' },
        { id: 'cached', from: 'reports', to: 'cache', label: 'cached after first load', dashed: true },
      ],
      steps: [
        { focus: ['entry', 'shared'], edges: ['entry->shared'], text: 'At build time the bundler follows **static** imports from the entry. Everything reachable that way goes into the entry chunk (plus shared chunks for common dependencies).' },
        { focus: ['reports', 'settings'], edges: ['toReports', 'toSettings'], text: 'Every dynamic `import()` is a **split point**: the imported module and its own static imports become a separate chunk.' },
        { focus: ['chart'], edges: ['reports->chart'], text: 'A library only the Reports page uses ends up with (or next to) the Reports chunk — users who never open Reports never download it.' },
        { focus: ['entry', 'shared'], text: 'First visit: the browser downloads the entry and shared chunks only. The home page renders sooner.' },
        { focus: ['reports', 'chart'], edges: ['toReports', 'reports->chart'], text: 'Navigating to /reports requests the Reports chunk and its dependencies — or they\'re already there because you **prefetched** on hover.' },
        { focus: ['cache'], edges: ['cached'], text: 'Chunk file names include a content hash, so browsers can cache them long-term; a change produces a new file name. (Deleting old chunks on deploy is why "failed to fetch module" errors happen.)' },
      ],
    },
  },

  internals: {
    beginner: `
When you build your app, the bundler starts at your entry file and follows every \`import\` like a map. Static imports are roads that must be travelled before the app starts. A dynamic \`import()\` is a road marked "only when needed": the bundler packs everything behind it into a separate parcel (a chunk) and writes a little piece of code that fetches the parcel when that line runs.
`,
    technical: [
      `
**Chunk graph.** The bundler builds a module graph from the entry. Modules reachable only through a dynamic import are emitted into their own chunk; modules shared by several chunks may be extracted into a common chunk so they're downloaded once. In the browser, \`import()\` becomes a request for the chunk file (plus any dependencies not loaded yet), and the returned promise resolves to the module's exports. Each module is evaluated once and cached, so repeated \`import()\` calls are cheap.

**Async components.** \`defineAsyncComponent\` returns a wrapper component. On its first render the wrapper calls the loader, renders the loading component after \`delay\` (if still pending), switches to the error component if the promise rejects or \`timeout\` passes, and renders the real component once it resolves. The resolved component is remembered, so later instances render it immediately. Inside \`<Suspense>\` (experimental), async components can defer to the Suspense boundary instead (\`suspensible\`).

**Tree shaking.** With ES modules, imports and exports are static, so the bundler can see which exports are used. Unused exports can be dropped if evaluating their module has no observable side effects — which bundlers infer, or trust from the package's \`sideEffects\` field. Vue marks its own pure function calls and internals so unused features (e.g. \`<Transition>\`, \`<KeepAlive>\`, \`v-model\` helpers) aren't included when your templates don't use them.

**Compile-time flags.** Vue's \`esm-bundler\` build contains branches guarded by global constants like \`__VUE_OPTIONS_API__\`. The bundler replaces them with literals (\`define\`), and minification removes dead branches.
`,
      {
        callout: 'note',
        title: 'In this sandbox',
        text: 'The playground has no bundler and no network: `import(\'./X.vue\')` resolves asynchronously from files already in memory, imitating a lazy chunk. That\'s enough to see *when* code is evaluated and to test loading/error states, but chunk sizes, hashing and real download timings only exist in a real `vite build`.',
      },
    ],
    production: `
- **Measure the bundle.** Run a bundle visualizer on \`vite build\` output and look for surprises: a whole icon pack, a date library with every locale, a polyfill nobody needs.
- **Split by route first**, then by heavy, optional features (charts, editors, maps, PDF/CSV export).
- **Don't over-split.** Dozens of tiny chunks mean more requests, waterfalls and spinners. Group features that are always used together; lazy-load things users may *never* need.
- **Design loading and error states** for every lazy boundary, and **prefetch** on intent (hover/focus) or idle time for likely next steps.
- **Handle stale chunks after deploys.** If old chunk files are deleted while users have the old app open, lazy imports fail. Keep old assets for a while, and handle the error (Vite dispatches a \`vite:preloadError\` event on \`window\`; Vue Router has \`router.onError\`), e.g. by reloading the page.
- **Production build only**, with Vue's flags set deliberately; serve with compression (gzip/Brotli) and long-term caching for hashed files.
- **Assets matter as much as JS:** right-sized modern images with dimensions, a prioritised LCP image, lazy offscreen images, few font files.
`,
  },

  mistakes: [
    {
      title: 'A static import that defeats the lazy route',
      wrong: { code: `import ReportsView from './views/ReportsView.vue'\n\nconst routes = [\n  { path: '/reports', component: () => ReportsView }, // still in the main bundle\n]`, lang: 'js' },
      right: { code: `const routes = [\n  { path: '/reports', component: () => import('./views/ReportsView.vue') },\n]`, lang: 'js' },
      explanation: 'Only `import()` creates a split point. Wrapping an already-imported module in an arrow function changes nothing about the bundle.',
    },
    {
      title: 'Lazy loading the hero image or the first screen',
      wrong: { code: `<img src="/hero.avif" loading="lazy" alt="…">  <!-- the LCP image -->`, lang: 'html' },
      right: { code: `<img src="/hero.avif" fetchpriority="high" width="1200" height="600" alt="…">`, lang: 'html' },
      explanation: 'Lazy loading delays exactly what users came to see. Lazy-load below-the-fold content; prioritise the main content.',
    },
    {
      title: 'No loading or error state on an async component',
      wrong: { code: `const Editor = defineAsyncComponent(() => import('./Editor.vue'))\n// slow network: empty space. failed request: empty space forever`, lang: 'js' },
      right: { code: `const Editor = defineAsyncComponent({\n  loader: () => import('./Editor.vue'),\n  loadingComponent: EditorSkeleton,\n  errorComponent: EditorError,\n  timeout: 15000,\n})`, lang: 'js' },
      explanation: 'Every lazy boundary is a network request that can be slow or fail. Users should see what\'s happening.',
    },
    {
      title: 'Importing a whole library for one function',
      wrong: { code: `import _ from 'lodash'\nconst onSearch = _.debounce(search, 300)`, lang: 'js' },
      right: { code: `import { debounce } from 'lodash-es'\nconst onSearch = debounce(search, 300)`, lang: 'js' },
      explanation: 'A default import of a CommonJS build can\'t be tree-shaken. Prefer ESM builds and named imports — or a small local helper (see [runtime performance](lesson:runtime-performance)).',
    },
    {
      title: 'Turning off the Options API flag without checking dependencies',
      wrong: { code: `define: { __VUE_OPTIONS_API__: 'false' } // a UI library's components use the Options API…`, lang: 'js' },
      right: { code: `// only disable it when neither your code nor your dependencies use the Options API`, lang: 'js' },
      explanation: 'The flag removes Options API support entirely; components that rely on it will break at runtime.',
    },
  ],

  debugging: [
    {
      symptom: 'A route you made lazy is still in the main bundle.',
      cause: 'The module is also imported statically somewhere (the router file, a barrel `index.js`, another eager component).',
      fix: 'Search for static imports of it; a bundle visualizer shows which chunk it ended up in and who imports it.',
    },
    {
      symptom: 'Users see "Failed to fetch dynamically imported module" after a deploy.',
      cause: 'Their open tab references chunk files from the previous build that no longer exist on the server.',
      fix: 'Keep old assets available for a while; handle `vite:preloadError` / `router.onError` by reloading; show an error component with a retry.',
    },
    {
      symptom: 'Opening a lazy section shows a spinner every time, even when fast.',
      cause: '`delay: 0`, or a loading component without a delay.',
      fix: 'Keep the default `delay` (200 ms) or similar so fast loads don\'t flash a spinner; use skeletons with stable dimensions.',
    },
    {
      symptom: 'Navigation to a lazy route feels slow on the first click.',
      cause: 'The chunk (and its dependencies) start downloading only on click.',
      fix: 'Prefetch on hover/focus or when idle, and keep heavy dependencies out of route chunks that don\'t need them.',
    },
    {
      symptom: 'The bundle contains a library you thought you removed.',
      cause: 'A side-effectful import, a CommonJS dependency, or one remaining import keeps it alive.',
      fix: 'Analyse the bundle; switch to ESM builds and named imports; remove the last import.',
    },
  ],

  bestPractices: [
    'Analyse the production bundle before and after changes.',
    'Lazy-load routes (Vue Router) and heavy optional components (`defineAsyncComponent`).',
    'Give every lazy boundary a loading state (with a delay) and an error state.',
    'Prefetch likely next chunks on hover/focus or idle time.',
    'Prefer ESM builds and named imports so tree shaking works.',
    'Ship production builds only, with Vue\'s compile-time flags set deliberately.',
    'Optimise images and fonts: right size, modern formats, dimensions, lazy below the fold, prioritised LCP image.',
  ],

  useCases: [
    'Admin and settings areas most visitors never open.',
    'Charts, maps, rich-text editors and code editors inside a page.',
    'PDF/CSV export and other on-demand features.',
    'Locale data and translations loaded per language.',
    'Large marketing pages with many below-the-fold images.',
  ],

  whenToUse: {
    use: [
      'Lazy routes for every route that isn\'t the landing page (and isn\'t tiny).',
      '`defineAsyncComponent` for heavy, optional or below-the-fold components.',
      'Dynamic `import()` in handlers for libraries used only on demand.',
    ],
    avoid: [
      'Lazy-loading the content of the first screen, or the LCP image.',
      'Splitting tiny components into their own chunks.',
      'Disabling `__VUE_OPTIONS_API__` when any dependency needs it.',
    ],
  },

  comparison: {
    title: 'Ways to load code',
    headers: ['', 'Static `import`', 'Lazy route (Vue Router)', '`defineAsyncComponent`', '`import()` in a handler'],
    rows: [
      ['When it downloads', 'with the importing chunk (usually at startup)', 'on first navigation to the route', 'on first render of the component', 'when the handler runs'],
      ['Loading/error UI', 'n/a', 'router hooks + your UI (`router.onError`)', 'built in: `loadingComponent`, `errorComponent`', 'your own state (`loading` ref, try/catch)'],
      ['Typical use', 'small, always-needed code', 'pages', 'heavy widgets inside pages', 'libraries used on demand'],
      ['Prefetch by', 'n/a', 'calling the same `import()` early', 'calling the same `import()` early', 'calling the same `import()` early'],
    ],
    note: 'Basics of async components and lazy routes live in [Async components](lesson:async-components) and [Lazy-loaded routes & scroll behavior](lesson:lazy-routes-scroll).',
  },

  quiz: [
    {
      id: 'bundle-optimization-q1',
      type: 'mcq',
      prompt: 'What does `() => import(\'./ReportsView.vue\')` do in a Vite build?',
      options: [
        { text: 'Creates a split point: the module goes into a separate chunk loaded when the function runs' },
        { text: 'Imports the module twice', why: 'Modules are evaluated once and cached, however many times you import them.' },
        { text: 'Inlines the component into the main bundle', why: 'That is what a static import does.' },
        { text: 'Loads the component from a CDN', why: 'The chunk is part of your own build output.' },
      ],
      answer: 0,
      explanation: 'Dynamic imports are split points. The arrow function delays the import until the router (or your code) calls it.',
    },
    {
      id: 'bundle-optimization-q2',
      type: 'output',
      prompt: 'This async component has `delay: 200`, and its loader resolves after 100 ms. What does the user see?',
      code: {
        lang: 'js',
        code: `const Chart = defineAsyncComponent({
  loader: () => import('./Chart.vue'), // resolves after ~100 ms
  loadingComponent: Spinner,
  delay: 200,
})`,
      },
      options: [
        { text: 'Nothing for ~100 ms, then the chart — the spinner never appears' },
        { text: 'The spinner for 200 ms, then the chart', why: '`delay` is how long to wait *before* showing the spinner, not a minimum display time.' },
        { text: 'The spinner for 100 ms', why: 'The spinner would only appear after 200 ms of loading.' },
        { text: 'An error', why: 'There is no timeout here.' },
      ],
      answer: 0,
      explanation: '`delay` prevents a spinner from flashing on fast loads. It shows only if loading is still pending after the delay.',
    },
    {
      id: 'bundle-optimization-q3',
      type: 'bug',
      prompt: 'The team says Reports is lazy-loaded, but it\'s in the main bundle. Click the line responsible.',
      code: {
        lang: 'js',
        code: `import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ReportsView from './views/ReportsView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/reports', component: () => ReportsView },
  ],
})`,
      },
      answerLine: 3,
      explanation: 'The static import on line 3 puts ReportsView in the main bundle. Remove it and use `component: () => import(\'./views/ReportsView.vue\')`.',
    },
    {
      id: 'bundle-optimization-q4',
      type: 'fill',
      prompt: 'Fill the blanks: lazy-load the chart and avoid flashing the spinner for fast loads.',
      code: {
        lang: 'js',
        code: `const Chart = defineAsyncComponent({
  loader: () => ___('./Chart.vue'),
  loadingComponent: Spinner,
  ___: 200,
})`,
      },
      answer: [['import'], ['delay']],
      explanation: 'A dynamic `import()` in the loader, and `delay` (200 ms is the default) before the loading component appears.',
    },
    {
      id: 'bundle-optimization-q5',
      type: 'mcq',
      prompt: 'What makes tree shaking possible?',
      options: [
        { text: 'ES module `import`/`export` that can be analysed statically, in code without import-time side effects' },
        { text: 'Minification alone', why: 'Minifiers shorten code; deciding which exports are unused needs the module graph.' },
        { text: 'Using `require()` everywhere', why: 'CommonJS is dynamic and generally can\'t be shaken reliably.' },
        { text: 'Gzip compression', why: 'Compression shrinks bytes on the wire; it doesn\'t remove code.' },
      ],
      answer: 0,
      explanation: 'Static ESM syntax lets the bundler see what is used; side-effect-free modules let it safely drop the rest.',
    },
    {
      id: 'bundle-optimization-q6',
      type: 'mcq',
      prompt: 'Which of these should you **not** do to the hero image that is your Largest Contentful Paint element?',
      options: [
        { text: 'Add `loading="lazy"`' },
        { text: 'Add explicit `width` and `height`', why: 'Dimensions reserve space and prevent layout shift — do it.' },
        { text: 'Add `fetchpriority="high"`', why: 'This tells the browser to fetch it early — good for the LCP image.' },
        { text: 'Serve a right-sized modern format via `srcset`', why: 'Smaller bytes, same quality — good.' },
      ],
      answer: 0,
      explanation: 'Lazy loading delays the very element LCP measures. Lazy-load images below the fold instead.',
    },
    {
      id: 'bundle-optimization-q7',
      type: 'short',
      prompt: 'Why can splitting an app into too many small chunks make it slower?',
      answer: 'Each chunk is a separate request with its own overhead, and lazy chunks often depend on other chunks, creating request waterfalls (one finishes before the next starts). Users also see more loading states. Very small chunks compress less efficiently and add runtime bookkeeping. Group code that is used together, split along real boundaries (routes, heavy optional features), and prefetch likely next chunks.',
    },
  ],

  exercises: [
    {
      id: 'lazy-routes',
      title: 'Lazy-load two routes',
      difficulty: 'intermediate',
      prompt: `
All three views are imported statically in **router.js**, so the reports engine and the settings schema load at startup (watch the console).

- Keep **Home** eager.
- Make **Reports** and **Settings** lazy with \`() => import(...)\`.
- Links: \`class="to-reports"\`, \`class="to-settings"\`; views render \`class="home"\`, \`class="reports"\`, \`class="settings"\`.
- Nothing from Reports or Settings may load before you navigate there.
`,
      files: {
        'main.js': routerMain,
        'App.vue': routerApp,
        'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ReportsView from './views/ReportsView.vue'
import SettingsView from './views/SettingsView.vue'

// The sandbox has no real URL bar, so we use memory history.
// Real apps use createWebHistory().
export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/reports', component: ReportsView },
    { path: '/settings', component: SettingsView },
  ],
})`,
        'views/HomeView.vue': homeView,
        'views/ReportsView.vue': reportsView,
        'views/SettingsView.vue': settingsView,
        'reportEngine.js': reportEngine,
        'settingsSchema.js': settingsSchema,
      },
      hints: [
        'Only a dynamic `import()` creates a split point — the static imports at the top have to go.',
        'Vue Router accepts a function returning a promise as `component`.',
        '`{ path: \'/reports\', component: () => import(\'./views/ReportsView.vue\') }` — same for settings.',
      ],
      solution: {
        explanation: 'With the static imports removed, the router only knows how to *fetch* those views. The first navigation to /reports calls the loader, which evaluates ReportsView and the reports engine; later navigations reuse the loaded module. Home stays eager because it\'s the first screen.',
        files: {
          'main.js': routerMain,
          'App.vue': routerApp,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'

// The sandbox has no real URL bar, so we use memory history.
// Real apps use createWebHistory().
export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/reports', component: () => import('./views/ReportsView.vue') },
    { path: '/settings', component: () => import('./views/SettingsView.vue') },
  ],
})`,
          'views/HomeView.vue': homeView,
          'views/ReportsView.vue': reportsView,
          'views/SettingsView.vue': settingsView,
          'reportEngine.js': reportEngine,
          'settingsSchema.js': settingsSchema,
        },
      },
      tests: [
        { name: 'home renders and nothing else loads at startup', code: `await wait(30); expect(exists('.home')).toBe(true); expect(logs.some((l) => l.includes('[chunk]'))).toBe(false)` },
        { name: 'reports loads on navigation', code: `await wait(30); await click('.to-reports'); await wait(50); expect(exists('.reports')).toBe(true); expect(text('.reports')).toContain('Total: 60'); expect(logs.some((l) => l.includes('reportEngine.js'))).toBe(true); expect(logs.some((l) => l.includes('settingsSchema.js'))).toBe(false)` },
        { name: 'settings loads on navigation', code: `await wait(30); await click('.to-settings'); await wait(50); expect(exists('.settings')).toBe(true); expect(logs.some((l) => l.includes('settingsSchema.js'))).toBe(true)` },
      ],
    },
    {
      id: 'import-on-demand',
      title: 'Load the CSV exporter only when needed',
      difficulty: 'intermediate',
      prompt: `
\`csvExport.js\` is only needed when someone clicks **Export CSV**, but it is imported at startup.

- Load \`csvExport.js\` with a dynamic \`import()\` inside the click handler (\`class="export"\`).
- Show **Preparing export…** in \`class="status"\` while loading and **Done** afterwards.
- Put the CSV text in \`<pre class="output">\`.
- The module must load **once**, however many times you export.
`,
      files: {
        'csvExport.js': `// Pretend this is a big CSV/spreadsheet library
console.log('[chunk] csvExport.js loaded')

export function toCsv(rows) {
  const header = Object.keys(rows[0]).join(',')
  return [header, ...rows.map((r) => Object.values(r).join(','))].join('\\n')
}`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import { toCsv } from './csvExport.js'

const orders = [
  { id: 1, customer: 'Ada', total: 30 },
  { id: 2, customer: 'Grace', total: 45 },
]
const status = ref('')
const output = ref('')

function exportCsv() {
  output.value = toCsv(orders)
  status.value = 'Done'
}
</script>

<template>
  <button class="export" @click="exportCsv">Export CSV</button>
  <p class="status">{{ status }}</p>
  <pre class="output">{{ output }}</pre>
</template>`,
      },
      hints: [
        'Remove the static import and make `exportCsv` an `async` function.',
        'Inside it: set the status, then `const { toCsv } = await import(\'./csvExport.js\')`.',
        'After the import resolves, set `output` and change the status to `Done`.',
      ],
      solution: {
        explanation: 'The exporter is now behind a split point: it is fetched the first time someone clicks, and the module cache makes later clicks instant (the log line appears once). In production, wrap it in try/catch and show an error status if the chunk fails to load.',
        files: {
          'csvExport.js': `// Pretend this is a big CSV/spreadsheet library
console.log('[chunk] csvExport.js loaded')

export function toCsv(rows) {
  const header = Object.keys(rows[0]).join(',')
  return [header, ...rows.map((r) => Object.values(r).join(','))].join('\\n')
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'

const orders = [
  { id: 1, customer: 'Ada', total: 30 },
  { id: 2, customer: 'Grace', total: 45 },
]
const status = ref('')
const output = ref('')

async function exportCsv() {
  status.value = 'Preparing export…'
  const { toCsv } = await import('./csvExport.js') // loaded on first click only
  output.value = toCsv(orders)
  status.value = 'Done'
}
</script>

<template>
  <button class="export" @click="exportCsv">Export CSV</button>
  <p class="status">{{ status }}</p>
  <pre class="output">{{ output }}</pre>
</template>`,
        },
      },
      tests: [
        { name: 'nothing loads at startup', code: `expect(logs.some((l) => l.includes('csvExport.js'))).toBe(false)` },
        { name: 'clicking shows a status, then the CSV', code: `const btn = find('.export'); btn.click(); await nextTick(); expect(text('.status')).toBe('Preparing export…'); await wait(30); expect(text('.status')).toBe('Done'); expect(text('.output')).toContain('id,customer,total')` },
        { name: 'the module loads only once', code: `await click('.export'); await wait(30); await click('.export'); await wait(30); expect(logs.filter((l) => l.includes('csvExport.js loaded')).length).toBe(1)` },
      ],
    },
  ],

  interview: [
    {
      id: 'bundle-optimization-reduce-initial-js',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'A large Vue SPA has a slow first load. How would you reduce the JavaScript users download up front?',
      answer: 'Measure first (production build, bundle visualizer, Lighthouse/field data). Then: lazy-load routes with Vue Router; lazy-load heavy optional components (`defineAsyncComponent`) and on-demand libraries (`import()` in handlers); fix imports that defeat tree shaking (CommonJS, whole-library imports, barrel files with side effects); remove or replace heavy dependencies; set Vue\'s compile-time flags; and make sure only the production build is served, compressed and cached. Add loading/error states and prefetch likely next chunks. Re-measure.',
      explanation: 'Find the bytes, then defer or delete them — and keep the UX honest at each lazy boundary.',
      whyAsked: 'A core performance question for any sizeable frontend.',
      mistakes: ['Listing techniques without measuring.', 'Lazy-loading the first screen.', 'Ignoring images and fonts.'],
      followUps: ['How do you decide what goes in the entry chunk?', 'What could go wrong after a deploy?', 'How would you prevent regressions?'],
      modelAnswer: 'I\'d start by measuring a production build: a bundle visualizer shows what\'s in the entry chunk, and Lighthouse plus field data show the impact. Then I\'d make every non-landing route lazy with Vue Router, put heavy optional widgets like charts or editors behind defineAsyncComponent, and load on-demand libraries such as exporters with import() in the handler. I\'d hunt for imports that defeat tree shaking and for heavy dependencies with lighter alternatives. Each lazy boundary gets loading and error states, and I prefetch likely next steps on hover. Finally I\'d add a bundle-size budget in CI so it doesn\'t creep back.',
    },
    {
      id: 'bundle-optimization-code-splitting',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is code splitting, and how do you create a split point in a Vue + Vite app?',
      answer: 'Code splitting means building the app into several files (chunks) instead of one, so the browser downloads only what the current screen needs. A dynamic `import(\'./X.vue\')` creates a split point: the bundler puts that module and its dependencies into a separate chunk that is fetched when the import runs — used by Vue Router lazy routes and `defineAsyncComponent`.',
      explanation: 'Static imports join chunks; dynamic imports separate them.',
      whyAsked: 'A foundational check before deeper performance questions.',
      mistakes: ['Confusing code splitting with minification.', 'Thinking an arrow function around a static import creates a chunk.'],
      followUps: ['What happens if the chunk fails to load?', 'How would you prefetch a chunk?'],
      modelAnswer: 'Code splitting breaks the build into chunks so users don\'t download the whole app up front. In Vite, any dynamic import() is a split point — the imported module and everything it statically imports go into a separate chunk that\'s requested when that line runs. In Vue I use it through lazy routes, component: () => import(...), and defineAsyncComponent for heavy widgets. The cost is a network request later, so I add loading and error states and prefetch when I can predict the next step.',
    },
    {
      id: 'bundle-optimization-tree-shaking',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'You import one helper from a utility library, yet the bundle visualizer shows the entire library in your entry chunk. What are likely causes and fixes?',
      answer: 'Likely causes: the library is CommonJS (not statically analysable), you used a default/namespace import of the whole thing, the package isn\'t marked side-effect free so the bundler keeps everything, or a barrel file re-exports modules with side effects. Fixes: use the library\'s ESM build (e.g. `lodash-es`) with named imports or per-function paths, check `sideEffects`, avoid side-effectful barrels, or replace the helper with a few lines of your own. Verify in the visualizer.',
      explanation: 'Tree shaking needs static ESM and confidence that dropping code is safe.',
      whyAsked: 'Tests practical knowledge of how bundlers decide what to keep.',
      mistakes: ['Blaming minification.', 'Not knowing what `sideEffects` means.', 'Not verifying with a bundle analysis.'],
      followUps: ['What does "side effects" mean for a module?', 'Why can CSS imports be side effects?'],
      modelAnswer: 'Usually one of four things: the package ships CommonJS, which bundlers can\'t shake reliably; I imported the default export or a namespace, so everything is used; the package isn\'t declared side-effect free, so the bundler keeps modules just in case; or a barrel index file pulls in modules that do something on import. I\'d switch to the ESM build with named imports, check the sideEffects field, avoid side-effectful barrels, or write the helper myself if it\'s tiny — then confirm in the visualizer.',
    },
    {
      id: 'bundle-optimization-over-splitting',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'A teammate wants to make every component an async component "for performance". How do you respond?',
      answer: 'Splitting has costs: each chunk is a request (with latency), nested lazy components create waterfalls, every boundary needs loading/error UI, and tiny chunks compress worse. Split along real boundaries — routes and heavy, optional features users may never use — and keep small, always-used components in the chunk that needs them. Decide with a bundle analysis and real-device measurements, and prefetch predictable next steps.',
      explanation: 'The goal is less work on the critical path, not the maximum number of files.',
      whyAsked: 'Probes judgement: over-applied optimisations are a common mistake.',
      mistakes: ['Agreeing because "lazy is always better".', 'Ignoring waterfalls and UX of many spinners.'],
      followUps: ['How would you spot a waterfall?', 'Where would you draw the boundaries in a dashboard app?'],
      modelAnswer: 'I\'d push back. Every async component is a separate request and a new loading state, and when lazy components contain other lazy components you get waterfalls where each request waits for the previous one. Tiny chunks also compress less well. I\'d split at routes and at genuinely heavy optional features — charts, editors, export tools — and keep small, always-needed components with the code that uses them. Then I\'d check the result in a bundle visualizer and the network waterfall on a throttled device.',
    },
    {
      id: 'bundle-optimization-stale-chunks',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'Right after each deploy, some users get "Failed to fetch dynamically imported module" when opening a lazy page. What is happening, and how do you handle it?',
      answer: 'Their tab is still running the previous build, which references hashed chunk files from that build. If the deploy removed the old files, the lazy import 404s. Mitigations: keep previous assets available for a while (immutable, hashed files can coexist); catch the failure — Vite dispatches a `vite:preloadError` event on `window`, Vue Router exposes `router.onError` — and reload to get the new build; give async components an error state (with retry via `onError`).',
      explanation: 'Lazy loading couples a running app to files on the server; deploys must respect that.',
      whyAsked: 'A real production issue that shows whether the candidate has shipped code-split apps.',
      mistakes: ['Blaming the CDN without understanding hashing.', 'Disabling code splitting as the "fix".'],
      followUps: ['How long would you keep old assets?', 'How would you avoid an infinite reload loop?'],
      modelAnswer: 'The user\'s open tab runs the old build, and its lazy imports point to the old chunk file names. If the deploy deleted those files, the request fails. I\'d keep previous builds\' assets on the server or CDN for a while, since hashed files don\'t collide. In the app I\'d handle the failure: listen for Vite\'s vite:preloadError event or use router.onError, and reload once to pick up the new build — with a guard so it can\'t loop. Async components get an error state with a retry.',
    },
    {
      id: 'bundle-optimization-flags',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between Vue\'s development and production builds, and what do compile-time flags like `__VUE_OPTIONS_API__` change?',
      options: [
        'Nothing — they are identical',
        'Production builds drop development warnings/checks and are minified; flags remove optional features (Options API, prod devtools, detailed hydration mismatch info) from bundler builds',
        'Production builds disable reactivity',
        'Flags only affect TypeScript types',
      ],
      correctOption: 1,
      answer: 'The development build includes warnings, extra checks and debugging hooks (like `onRenderTriggered`); the production build strips them and is minified, so it is smaller and faster. In bundler (esm-bundler) builds, compile-time flags let the bundler remove optional code: `__VUE_OPTIONS_API__: false` drops Options API support, `__VUE_PROD_DEVTOOLS__` controls devtools in production, and `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__` (3.4+) controls detailed mismatch messages.',
      explanation: 'Measure and ship production builds; use flags deliberately.',
      whyAsked: 'Checks understanding of what actually ships and why dev-build measurements mislead.',
      mistakes: ['Benchmarking the dev server.', 'Disabling the Options API flag while a dependency uses it.'],
      followUps: ['Why are dev-mode measurements misleading?', 'How are flags applied in Vite?'],
      modelAnswer: 'The dev build carries warnings, extra checks and debug hooks, which is great for development but slower and bigger; vite build produces the production build without them, minified. Compile-time flags are globals the bundler replaces at build time so dead branches disappear: turning off __VUE_OPTIONS_API__ removes Options API support if nothing needs it, __VUE_PROD_DEVTOOLS__ controls devtools in production, and since 3.4 there\'s one for detailed hydration mismatch info. That\'s also why I never measure performance on the dev server.',
    },
    {
      id: 'bundle-optimization-coding-async',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Make `MapWidget` an async component that shows `WidgetLoading` **immediately** while loading and `WidgetError` if loading takes longer than **800 ms**. The loader is `loadWidget()` from network.js (300 ms normally, 1500 ms with **Slow network**, `class="slow"`, checked). **Open map** is `class="open"`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { loadWidget, net } from './network.js'
import WidgetLoading from './WidgetLoading.vue'
import WidgetError from './WidgetError.vue'

// TODO: loading state immediately, error state after 800 ms
const MapWidget = defineAsyncComponent(loadWidget)
const show = ref(false)
</script>

<template>
  <label><input type="checkbox" class="slow" v-model="net.slow" /> Slow network</label>
  <button class="open" @click="show = true">Open map</button>
  <MapWidget v-if="show" />
</template>`,
          'network.js': widgetNetwork,
          'MapWidget.vue': `<template>
  <div class="map-widget">🗺️ Interactive map</div>
</template>`,
          'WidgetLoading.vue': `<template>
  <div class="widget-loading">Loading map…</div>
</template>`,
          'WidgetError.vue': `<template>
  <div class="widget-error">The map took too long to load.</div>
</template>`,
        },
      },
      tests: [
        { name: 'shows the loading state right away', code: `await click('.open'); expect(exists('.widget-loading')).toBe(true)` },
        { name: 'shows the widget once loaded', code: `await click('.open'); await wait(450); expect(exists('.map-widget')).toBe(true); expect(exists('.widget-loading')).toBe(false)` },
        { name: 'shows the error after 800 ms on a slow network', code: `await check('.slow', true); await click('.open'); await wait(1000); expect(exists('.widget-error')).toBe(true); expect(exists('.map-widget')).toBe(false)` },
      ],
      hints: [
        '`defineAsyncComponent` also accepts an options object.',
        'Options you need: `loader`, `loadingComponent`, `errorComponent`, `delay`, `timeout`.',
        '`defineAsyncComponent({ loader: loadWidget, loadingComponent: WidgetLoading, errorComponent: WidgetError, delay: 0, timeout: 800 })`.',
      ],
      answer: 'Use the options form of defineAsyncComponent with `delay: 0` and `timeout: 800`.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { loadWidget, net } from './network.js'
import WidgetLoading from './WidgetLoading.vue'
import WidgetError from './WidgetError.vue'

const MapWidget = defineAsyncComponent({
  loader: loadWidget,
  loadingComponent: WidgetLoading,
  errorComponent: WidgetError,
  delay: 0,      // show the loading state immediately
  timeout: 800,  // give up (show the error) after 800 ms
})
const show = ref(false)
</script>

<template>
  <label><input type="checkbox" class="slow" v-model="net.slow" /> Slow network</label>
  <button class="open" @click="show = true">Open map</button>
  <MapWidget v-if="show" />
</template>`,
          'network.js': widgetNetwork,
          'MapWidget.vue': `<template>
  <div class="map-widget">🗺️ Interactive map</div>
</template>`,
          'WidgetLoading.vue': `<template>
  <div class="widget-loading">Loading map…</div>
</template>`,
          'WidgetError.vue': `<template>
  <div class="widget-error">The map took too long to load.</div>
</template>`,
        },
      },
      explanation: '`delay: 0` shows the loading component on the first render; `timeout: 800` switches to the error component when the loader hasn\'t resolved in time. If the chunk arrives later anyway, Vue replaces the error with the real component. For a real app, `onError(err, retry, fail, attempts)` can add retries.',
      whyAsked: 'Checks hands-on knowledge of async component options and UX around lazy loading.',
      mistakes: ['Using `delay` as a minimum display time.', 'Forgetting the error component, so timeouts show nothing.', 'Wrapping route components in defineAsyncComponent.'],
      followUps: ['When would you keep the default 200 ms delay?', 'How would you add retries?'],
      modelAnswer: 'I\'d switch to the options form: loader is loadWidget, loadingComponent and errorComponent are the two state components, delay zero so the loading state shows at once, and timeout 800 so a slow load turns into an error after 800 milliseconds. Normally I\'d keep a small delay to avoid flashing a spinner on fast loads, but here the requirement is immediate. In production I\'d add onError with a couple of retries and make the error component offer a retry button.',
    },
  ],

  takeaways: [
    'Every dynamic `import()` is a split point; static imports pull code into the importing chunk.',
    'Lazy-load routes with Vue Router and heavy optional components with `defineAsyncComponent` (loading, error, delay, timeout).',
    'Prefetch likely next chunks by calling the same `import()` early (hover, focus, idle).',
    'Tree shaking needs static ESM imports and side-effect-free modules; prefer named imports from ESM builds.',
    'Ship and measure production builds; set Vue\'s compile-time flags deliberately.',
    'Images and fonts are often the biggest bytes — size, format, dimensions, lazy below the fold, prioritise the LCP image.',
    'Don\'t over-split: requests, waterfalls and spinners cost too. Measure with a bundle visualizer.',
  ],
}
