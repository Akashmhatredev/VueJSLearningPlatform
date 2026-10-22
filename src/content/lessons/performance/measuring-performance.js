// Lesson: Measuring: devtools, profiling & Web Vitals — Level 12, Performance

const perfJs = `import { ref, nextTick } from 'vue'

let nextId = 1

// Measures "handler + Vue DOM update" for an interaction, in YOUR browser.
// Simplified: real INP also includes input delay and the time until
// the browser actually paints the next frame.
export function useInteractionTimer() {
  const entries = ref([])

  async function measure(name, work) {
    const start = performance.now()
    if (performance.mark) performance.mark(name + ':start')

    work()
    await nextTick() // Vue has patched the DOM

    const ms = Math.round((performance.now() - start) * 10) / 10
    if (performance.mark && performance.measure) {
      performance.mark(name + ':end')
      performance.measure(name, name + ':start', name + ':end') // shows in DevTools "Timings"
    }
    entries.value = [{ id: nextId++, name, ms }, ...entries.value].slice(0, 6)
    return ms
  }

  return { entries, measure }
}`

const productsJs = `const words = ['Lamp', 'Desk', 'Chair', 'Shelf', 'Mug', 'Rug', 'Clock', 'Plant', 'Sofa', 'Stool']

export function makeProducts(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: words[(i * 7) % words.length] + ' ' + ((i * 7919) % count),
    price: ((i * 7919) % 997) + 3,
  }))
}`

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')`

const measureApp = `<script setup>
import { shallowRef, computed } from 'vue'
import { useInteractionTimer } from './perf.js'
import { makeProducts } from './products.js'

const products = shallowRef(makeProducts(5000))
const top = computed(() => products.value.slice(0, 50))
const { entries, measure } = useInteractionTimer()

function sortByPrice() {
  measure('sort by price', () => {
    products.value = [...products.value].sort((a, b) => a.price - b.price)
  })
}

function sortByName() {
  measure('sort by name', () => {
    products.value = [...products.value].sort((a, b) => a.name.localeCompare(b.name))
  })
}

function reverse() {
  // not measured yet (experiment 2)
  products.value = [...products.value].reverse()
}
</script>

<template>
  <h2>Measure an interaction</h2>
  <button class="sort-price" @click="sortByPrice">Sort by price</button>
  <button class="sort-name" @click="sortByName">Sort by name</button>
  <button class="reverse" @click="reverse">Reverse</button>

  <h3>Last measurements (handler + Vue update)</h3>
  <ol class="entries">
    <li v-for="e in entries" :key="e.id" :class="{ long: e.ms > 50 }">{{ e.name }}: {{ e.ms }} ms</li>
  </ol>

  <ul class="products">
    <li v-for="p in top" :key="p.id">{{ p.name }} — €{{ p.price }}</li>
  </ul>
</template>`

export default {
  id: 'measuring-performance',
  title: 'Measuring: devtools, profiling & Web Vitals',
  summary: 'Measure before you optimise: profile production builds, read the Performance panel and Vue Devtools, understand Core Web Vitals (LCP, INP, CLS), and turn measurements into budgets and tests.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['how-vue-updates', 'render-optimization', 'bundle-optimization'],
  related: ['runtime-performance', 'large-lists', 'debugging-reactivity', 'production-readiness', 'e2e-and-quality'],
  tags: ['performance', 'profiling', 'Core Web Vitals', 'LCP', 'INP', 'CLS', 'Lighthouse', 'Performance panel', 'Vue Devtools', 'performance.now', 'performance.mark', 'RUM', 'budgets', 'app.config.performance'],
  apis: [
    { name: 'performance.now()', summary: 'High-resolution timestamp for measuring durations in the browser.' },
    { name: 'performance.mark() / performance.measure()', summary: 'User Timing marks and measures; they appear in the DevTools Performance panel.' },
    { name: 'PerformanceObserver', summary: 'Observes performance entries such as long tasks, LCP candidates, layout shifts and event timings.' },
    { name: 'app.config.performance', summary: 'Dev-only: adds component init/compile/render/patch timing marks to the browser\'s performance timeline.' },
    { name: 'web-vitals (library)', summary: 'A small library from Google (onLCP, onINP, onCLS…) for collecting Core Web Vitals from real users.' },
  ],
  docs: [
    { label: 'Vue Guide — Performance: Profiling Options', url: 'https://vuejs.org/guide/best-practices/performance.html#profiling-options' },
    { label: 'API — app.config.performance', url: 'https://vuejs.org/api/application.html#app-config-performance' },
    { label: 'web.dev — Web Vitals', url: 'https://web.dev/articles/vitals' },
    { label: 'web.dev — Interaction to Next Paint (INP)', url: 'https://web.dev/articles/inp' },
    { label: 'Chrome DevTools — Analyze runtime performance', url: 'https://developer.chrome.com/docs/devtools/performance' },
    { label: 'Vue Devtools', url: 'https://devtools.vuejs.org/' },
  ],

  intro: `
Every lesson in this level ended with the same advice: **measure first**. This one teaches how.

Measuring well means answering three questions honestly:

1. **What do real users experience?** Field data and the Core Web Vitals — LCP, INP and CLS.
2. **Where does the time go?** Profiling in the browser's Performance panel, Vue Devtools and your own timing marks.
3. **Did my change help — and will it stay fixed?** Before/after measurements, performance budgets and tests.

You'll time interactions in a live playground (in your own browser, with real numbers you produce yourself), turn on Vue's performance marks, and build the small utilities teams use to collect and judge metrics.
`,

  why: `
Performance intuition is unreliable. The component you were sure was slow renders in a blink; the real cost hides in a forgotten deep watcher, a 2 MB image, or a synchronous sort in a click handler. Optimising without measuring wastes time — and often makes code more complex without making it faster.

Measurement also keeps you honest about *who* you're optimising for. Your laptop on office Wi-Fi isn't your users' mid-range phone on a train. Field metrics tell you what users actually feel; lab tools tell you why. Teams that measure can set budgets ("the main bundle stays under X", "INP stays good") and catch regressions in CI instead of in support tickets.
`,

  eli15: `
Imagine your bike feels slow. You could start replacing parts at random — new tyres, new chain, new seat. Or you could do it like a mechanic:

1. **Time a lap** on the usual route, the way you actually ride (that's your *baseline*).
2. **Look closely** at what's happening — the brake is rubbing! (that's *profiling*).
3. **Fix one thing**, then **time the lap again**. Faster? Keep it. Not faster? Undo it.

Web performance works the same way. Google even gave us three official "lap times" for websites, the **Core Web Vitals**: how fast the main content shows up (**LCP**), how quickly the page responds when you tap (**INP**), and how much stuff jumps around while loading (**CLS**).
`,

  analogy: {
    title: 'The bike mechanic',
    body: `
Measure a lap, find the rubbing brake, fix one thing, measure again. Time the route your riders actually ride, on the bikes they actually own.
`,
    mapping: [
      ['timing a lap on the usual route', 'a baseline measurement on a production build'],
      ['the riders\' real bikes and routes', 'field data: real users, devices and networks'],
      ['testing on a smooth indoor track', 'lab data: Lighthouse, DevTools on your machine'],
      ['finding the rubbing brake', 'profiling: Performance panel, Vue Devtools, timing marks'],
      ['changing one part at a time', 'one change per measurement, so you know what helped'],
      ['"the lap must stay under 10 minutes"', 'a performance budget checked in CI'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The measurement loop',
    caption: 'Optimisation is a loop, not a checklist. Every change is justified by a measurement before and after.',
    alt: 'A circular diagram with six steps: measure a baseline on a production build and realistic device; profile to find the bottleneck; form a hypothesis; make one change; re-measure under the same conditions; then keep or revert the change and protect it with a budget, returning to the start.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'baseline', label: 'Baseline', note: 'production build, realistic device', x: 380, y: 45, tone: 'acid' },
        { id: 'profile', label: 'Profile', note: 'where does the time go?', x: 610, y: 120, tone: 'cobalt' },
        { id: 'hypothesis', label: 'Hypothesis', note: '"the sort blocks the click"', x: 610, y: 240, tone: 'paper' },
        { id: 'change', label: 'One change', note: 'smallest fix that tests it', x: 380, y: 290, tone: 'kraft' },
        { id: 'remeasure', label: 'Re-measure', note: 'same conditions', x: 150, y: 240, tone: 'cobalt' },
        { id: 'keep', label: 'Keep or revert', note: '+ add a budget/test', x: 150, y: 120, tone: 'ink' },
      ],
      edges: [
        { from: 'baseline', to: 'profile' },
        { from: 'profile', to: 'hypothesis' },
        { from: 'hypothesis', to: 'change' },
        { from: 'change', to: 'remeasure' },
        { from: 'remeasure', to: 'keep' },
        { from: 'keep', to: 'baseline', dashed: true },
      ],
      steps: [
        { focus: ['baseline'], text: '**Baseline.** Measure the thing users feel — a Core Web Vital, an interaction time — on a **production build**, with CPU/network throttling or a real mid-range device, and realistic data.' },
        { focus: ['profile'], edges: ['baseline->profile'], text: '**Profile.** Record in the Performance panel; look for long tasks, expensive functions, layout work, big network requests. Use Vue Devtools to see which components update.' },
        { focus: ['hypothesis'], edges: ['profile->hypothesis'], text: '**Hypothesis.** Name a specific cause: "sorting 5,000 items runs synchronously in the click handler", "the hero image is lazy-loaded".' },
        { focus: ['change'], edges: ['hypothesis->change'], text: '**One change.** Make the smallest change that tests the hypothesis. Several changes at once means you won\'t know which one helped (or hurt).' },
        { focus: ['remeasure'], edges: ['change->remeasure'], text: '**Re-measure** under the same conditions, several runs — single measurements are noisy.' },
        { focus: ['keep'], edges: ['remeasure->keep', 'keep->baseline'], text: '**Keep or revert.** If it helped, keep it and protect it with a budget or test; if not, revert — complexity without benefit is a cost. Then go round again.' },
      ],
    },
  },

  syntax: [
    `
#### Rule 1: measure the right build

Vue's development build includes warnings, extra checks and debugging hooks — it is meant to be helpful, not fast. Profile what users get:
`,
    {
      code: `npm run build      # vite build: production bundle
npm run preview    # vite preview: serve it locally`,
      lang: 'bash',
      title: 'profile a production build',
      static: true,
    },
    `
Then emulate real conditions: in Chrome DevTools, enable **CPU throttling** and **network throttling** in the Performance panel, or test on a real mid-range phone. Use realistic data volumes.

#### Core Web Vitals (from web.dev)

| Metric | Measures | Good | Poor | Common causes in a Vue SPA |
|---|---|---|---|---|
| **LCP** — Largest Contentful Paint | loading: when the largest image or text block in the viewport is rendered | ≤ 2.5 s | > 4 s | big JS bundle before anything renders, data fetched only after JS runs, unoptimised or lazy-loaded hero image |
| **INP** — Interaction to Next Paint | responsiveness: delay from a user interaction to the next frame painted, across the visit | ≤ 200 ms | > 500 ms | long tasks in handlers, large re-renders, heavy watchers, synchronous loops |
| **CLS** — Cumulative Layout Shift | visual stability: how much visible content shifts unexpectedly | ≤ 0.1 | > 0.25 | images without dimensions, async content/skeletons of a different size, injected banners, late web fonts |

Google assesses each metric at the **75th percentile** of page loads (separately for mobile and desktop): a page "passes" when at least 75% of visits are in the good range. **INP replaced First Input Delay (FID)** as a Core Web Vital in March 2024 — it considers all interactions, not just the delay before the first one.
`,
    {
      callout: 'note',
      title: 'SPAs and soft navigations',
      text: 'Core Web Vitals are reported per page load. In a single-page app, route changes after the first load ("soft navigations") are not separate page loads for these metrics; LCP describes the initial load, while INP and CLS accumulate across the whole visit. Measure important in-app navigations yourself with timing marks.',
    },
    `
#### Lab vs field

- **Lab data** — Lighthouse, the DevTools Performance panel, WebPageTest: controlled and repeatable, great for debugging and CI. A page-load Lighthouse run can't measure INP (nobody interacts); it reports **Total Blocking Time** as a lab proxy for responsiveness.
- **Field data** (real-user monitoring, RUM) — what actual users experience on their devices: the Chrome UX Report (CrUX) for public sites, or your own collection with the \`web-vitals\` library. This is the ground truth; lab data explains it.
`,
    {
      code: `import { onLCP, onINP, onCLS } from 'web-vitals'

function sendToAnalytics(metric) {
  const body = JSON.stringify({ name: metric.name, value: metric.value, id: metric.id })
  // sendBeacon survives page unloads; fall back to fetch with keepalive
  ;(navigator.sendBeacon && navigator.sendBeacon('/analytics', body)) ||
    fetch('/analytics', { body, method: 'POST', keepalive: true })
}

onLCP(sendToAnalytics)
onINP(sendToAnalytics)
onCLS(sendToAnalytics)`,
      lang: 'js',
      title: 'collecting field metrics (web-vitals library)',
      static: true,
    },
    `
#### Profiling tools

**The Performance panel** (Chrome DevTools; Firefox and Safari have equivalents): record while you interact, then read the **Main** track flame chart — wide blocks are expensive functions, tasks over 50 ms are flagged as **long tasks** (the threshold defined by the Long Tasks API). The **Interactions** track shows each interaction's duration, and layout shifts are marked too. Recent Chrome versions also show live LCP, CLS and INP values for the page you're on.

**Vue Devtools** (browser extension, also available as a Vite plugin): inspect the component tree, state, props and computed values, and follow events on its timeline.

**Vue's performance marks** (development only):
`,
    {
      code: `const app = createApp(App)
app.config.performance = true // dev builds only: component init/compile/render/patch marks
app.mount('#app')`,
      lang: 'js',
      title: 'app.config.performance',
    },
    `
With it on, the Performance panel's **Timings** track shows marks such as \`<ProductList> render\` and \`<ProductList> patch\` for each component — useful to see *which* components are expensive. It only works in development builds (and browsers with the User Timing API), so treat the numbers as relative.

**Your own marks**:
`,
    {
      code: `performance.mark('filter:start')
const result = heavyFilter(items, query)
performance.mark('filter:end')
performance.measure('filter', 'filter:start', 'filter:end') // appears under "Timings"

// or simply:
const t0 = performance.now()
heavyFilter(items, query)
console.log('filter took', performance.now() - t0, 'ms')`,
      lang: 'js',
      title: 'User Timing',
    },
    `
#### Budgets and performance tests

- **Budgets**: limits the team agrees on — main bundle size, LCP/INP targets, number of requests. Check them in CI (e.g. Lighthouse CI, bundle-size checks) so regressions fail the build.
- **Unit tests**: assert *counts*, which are deterministic — "selecting a row re-renders 2 rows", "the filter runs once per search". Avoid asserting absolute milliseconds in unit tests: timing on CI machines is noisy.
- **E2E/lab tests**: record traces (e.g. with Playwright) or run Lighthouse against a production build, with tolerances, and track trends rather than single runs.
`,
    {
      callout: 'warn',
      title: 'Numbers you produce vs numbers you read',
      text: 'The thresholds above are the official Core Web Vitals definitions from web.dev. Everything else — how fast *your* app is, how much a change helps — must come from your own measurements. Be suspicious of generic "X is 30% faster" claims; measure your app, on your users\' devices.',
    },
  ],

  walkthrough: {
    title: 'perf.js (interaction timer)',
    lang: 'js',
    code: perfJs,
    intro: 'The playground\'s measuring tool: a composable that times "handler + Vue update" and records the last few results. Simplified on purpose — see step 5.',
    steps: [
      { lines: [8, 9], text: 'A composable returning reactive `entries`, so the template can list measurements. Writing them happens in the handler flow, not during rendering, so measuring can\'t trigger render loops.' },
      { lines: [11, 13], text: '`performance.now()` is a high-resolution clock. The `performance.mark` call is guarded so the code also works where the User Timing API isn\'t available.' },
      { lines: [15, 16], text: 'Run the work (which changes reactive state), then `await nextTick()` — it resolves after Vue has patched the DOM. So we measure the handler **plus** Vue\'s re-render.' },
      { lines: [18, 23], text: 'Round the duration and record a User Timing measure. In a real browser, open DevTools → Performance, record, click a button, and find the measure in the **Timings** track.' },
      { lines: [5, 7], text: 'What this does **not** include: the input delay before the handler starts, and the time from "DOM updated" to "pixels painted" (style, layout, paint). Real INP includes both, which is why field data and the Performance panel remain the source of truth.' },
    ],
  },

  playground: {
    title: 'Measure an interaction',
    objective: 'Time real interactions in your browser, add measurement where it\'s missing, set a budget, and turn on Vue\'s own performance marks.',
    files: { 'main.js': mainJs, 'App.vue': measureApp, 'perf.js': perfJs, 'products.js': productsJs },
    expected: `
Three buttons and a list of 50 products (out of 5,000). Click **Sort by price** and **Sort by name**: each adds a line like \`sort by name: … ms\` — the time measured in your browser. Entries over 50 ms get the \`long\` class. **Reverse** works but isn't measured yet.
`,
    experiments: [
      {
        id: 'baseline',
        task: 'Click each sort button three times and note the numbers. If your browser has DevTools, enable **CPU throttling** (Performance panel → settings) and repeat. Which sort is slower, and how noisy are single runs?',
        hint: 'Name sorting uses `localeCompare` for every comparison; price sorting compares numbers.',
        explain: 'You just produced real measurements on your device. Notice the variation between runs — that\'s why you take several samples and compare medians or percentiles, and why throttled or real low-end devices matter: many users have much slower CPUs than a developer laptop.',
      },
      {
        id: 'measure-reverse',
        task: 'Wrap the **Reverse** action in `measure(\'reverse\', () => { … })` so it appears in the measurements.',
        hint: 'Copy the pattern of `sortByPrice`: put the existing line inside `measure(\'reverse\', () => { … })`.',
        tests: [
          {
            name: 'reversing is measured',
            code: `await click('.reverse')
expect(text('.entries')).toContain('reverse:')
expect(text('.entries')).toMatch(/reverse: [\\d.]+ ms/)`,
          },
        ],
        explain: 'Instrumenting an interaction is cheap once you have a helper. In real apps, wrap the interactions that matter (search, sort, open dialog, route change) and send the timings to your monitoring, alongside Web Vitals.',
      },
      {
        id: 'budget',
        task: 'Add a budget: `const budgetMs = ref(50)`, a computed `overBudget` counting entries with `ms > budgetMs.value`, and `<p v-if="overBudget" class="budget-warning">Over budget: {{ overBudget }} interaction(s)</p>`. Use `budgetMs` for the `long` class too.',
        hint: 'Import `ref` (and you already have `computed`). `const overBudget = computed(() => entries.value.filter((e) => e.ms > budgetMs.value).length)`.',
        tests: [
          {
            name: 'interactions over the budget are counted',
            code: `state.budgetMs = -1
await click('.sort-price')
await click('.sort-name')
expect(text('.budget-warning')).toBe('Over budget: 2 interaction(s)')
expect(findAll('.entries li.long')).toHaveLength(2)`,
          },
          {
            name: 'no warning when everything is within budget',
            code: `state.budgetMs = 100000
await click('.sort-price')
expect(exists('.budget-warning')).toBe(false)`,
          },
        ],
        explain: 'A budget turns "it feels slow" into a rule everyone can check. The 50 ms default echoes the long-task threshold; for whole interactions, INP\'s "good" threshold is 200 ms. Real budgets live in CI (Lighthouse CI, bundle-size checks) and monitoring alerts.',
      },
      {
        id: 'vue-perf-marks',
        task: 'Turn on Vue\'s own performance marks: in **main.js**, set `app.config.performance = true` before mounting. If you have DevTools, record a sort and look for `<App> render` / `<App> patch` in the Timings track.',
        hint: 'Add `app.config.performance = true` between `createApp(App)` and `app.mount(\'#app\')`.',
        tests: [
          {
            name: 'performance tracing is enabled',
            code: `expect(vm.$.appContext.config.performance).toBe(true)
await click('.sort-price')
expect(text('.entries')).toContain('sort by price')`,
          },
        ],
        explain: 'Vue now adds User Timing marks for component init, render and patch — a quick way to see which components are expensive. Development builds only: in production builds the flag does nothing, so profile production with the Performance panel and your own marks.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'Where LCP, CLS and INP happen',
    caption: 'A page load and one interaction, annotated with the moments each Core Web Vital measures.',
    alt: 'A timeline diagram. During page load: the server responds (TTFB), the first content paints (FCP), and the largest content element paints (LCP); layout shifts during and after loading add up to CLS. Later, a user interaction goes through input delay, event handler processing (including Vue re-rendering) and presentation delay until the next paint; the slowest interactions determine INP.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'ttfb', label: 'TTFB', note: 'server responds', x: 80, y: 80, tone: 'paper' },
        { id: 'fcp', label: 'FCP', note: 'first content painted', x: 230, y: 80, tone: 'paper' },
        { id: 'lcp', label: 'LCP', note: 'largest element painted', x: 380, y: 80, tone: 'acid' },
        { id: 'cls', label: 'CLS', note: 'unexpected layout shifts add up', x: 600, y: 80, tone: 'red' },
        { id: 'input', label: 'Input delay', note: 'main thread busy?', x: 120, y: 240, tone: 'kraft' },
        { id: 'process', label: 'Processing', note: 'handlers + Vue re-render', x: 330, y: 240, tone: 'cobalt' },
        { id: 'present', label: 'Presentation', note: 'style, layout, paint', x: 540, y: 240, tone: 'cobalt' },
        { id: 'inp', label: 'INP', note: 'slowest interactions of the visit', x: 690, y: 240, tone: 'acid' },
      ],
      edges: [
        { from: 'ttfb', to: 'fcp' },
        { from: 'fcp', to: 'lcp' },
        { from: 'lcp', to: 'cls', dashed: true, label: 'during and after load' },
        { from: 'input', to: 'process' },
        { from: 'process', to: 'present' },
        { from: 'present', to: 'inp', label: 'next paint' },
      ],
      steps: [
        { focus: ['ttfb', 'fcp'], edges: ['ttfb->fcp'], text: 'The page starts loading. **TTFB** (time to first byte) and **FCP** (first contentful paint) are supporting metrics — useful for diagnosis, not Core Web Vitals themselves.' },
        { focus: ['lcp'], edges: ['fcp->lcp'], text: '**LCP** marks when the largest image or text block in the viewport is rendered. In a client-rendered SPA it waits for the JS bundle to download and run and, often, for data to arrive. Good: ≤ 2.5 s.' },
        { focus: ['cls'], edges: ['lcp->cls'], text: '**CLS** sums up unexpected layout shifts — an image without dimensions pushing text down, an async component replacing a smaller skeleton. Good: ≤ 0.1.' },
        { focus: ['input'], text: 'Later, the user taps a button. If the main thread is busy with another task, the event waits — **input delay**.' },
        { focus: ['process'], edges: ['input->process'], text: '**Processing**: your event handlers run, reactive state changes, and Vue re-renders and patches affected components (as part of the same work before the next frame).' },
        { focus: ['present', 'inp'], edges: ['process->present', 'present->inp'], text: '**Presentation**: the browser recalculates styles and layout and paints the next frame. Input delay + processing + presentation is the interaction\'s latency; **INP** reports (roughly) the slowest interactions of the visit. Good: ≤ 200 ms.' },
      ],
    },
  },

  internals: {
    beginner: `
Browsers keep a detailed diary of what they do: when the page started loading, when things were painted, which tasks ran and for how long. Performance tools read that diary. Vue can add its own entries (render and patch marks) in development, and you can add yours with \`performance.mark\`. Field monitoring collects diary summaries from real users so you can see what they experience.
`,
    technical: [
      `
**Where metrics come from.** Browsers expose performance entries through the Performance Timeline: \`largest-contentful-paint\` candidates, \`layout-shift\` entries (with whether they followed recent input), \`event\` timing entries for interactions, \`longtask\` entries, navigation and resource timings, and your own \`mark\`/\`measure\` entries. \`PerformanceObserver\` subscribes to them; the \`web-vitals\` library combines them into LCP, INP and CLS with the official rules (for example, which layout shifts count and how INP picks a representative interaction).

**Where Vue fits in an interaction.** A click runs your handler; state changes queue component updates; Vue flushes them in a microtask *before* the browser can paint; then the browser does style, layout and paint. So a large re-render shows up in the interaction's *processing* time — the "Main" track shows your handler, then Vue's flush (scheduler, component render functions, patch), then rendering work.

**\`app.config.performance\`.** In development builds, Vue wraps component init, template compile, render and patch in \`performance.mark\`/\`measure\` calls named after the component. The development build itself is slower than production (extra checks and warnings), so use these marks to compare components relative to each other, not as absolute production timings.

**Why single measurements lie.** Timers have limited precision, CPUs change frequency, garbage collection kicks in, caches warm up. Take several samples, look at medians and high percentiles (p75, p95), and compare like with like.
`,
      {
        callout: 'note',
        title: 'Stable definitions vs evolving tools',
        text: 'The Core Web Vitals definitions and thresholds are published by web.dev and change rarely (and with notice, as when INP replaced FID in March 2024). Browser DevTools UIs, Vue Devtools features and library APIs evolve faster — check current docs for exact panels and options.',
      },
    ],
    production: `
- **Collect field data** (web-vitals → your analytics, or a RUM product) segmented by device type, page and release, so you can see regressions after deploys.
- **Debug with lab tools** on production builds with throttling; reproduce slow field sessions (device, data size, route).
- **Instrument key interactions** with marks and send their durations along with INP attribution data (which element, which event).
- **Set budgets** (bundle size, LCP/INP targets) and enforce them in CI; review bundle analysis on dependency updates.
- **Test counts, trend timings**: deterministic render/run counts in unit tests; timing trends from lab runs and field data, never single-run absolute assertions.
- **Fix the biggest measured problem first.** A 3-second hero image beats a 2 ms component render every time.
`,
  },

  mistakes: [
    {
      title: 'Profiling the dev server',
      wrong: { code: `npm run dev   # then "Vue is slow!"`, lang: 'bash' },
      right: { code: `npm run build && npm run preview   # profile what users get`, lang: 'bash' },
      explanation: 'The development build includes warnings, checks and debugging hooks, and Vite\'s dev server serves unbundled modules. Its timings don\'t represent production.',
    },
    {
      title: 'Optimising without a baseline',
      wrong: { code: `// "This feels slow" → rewrite the list with v-memo, virtual scroll and a worker`, lang: 'js' },
      right: { code: `// 1. measure (Performance panel / timing marks)  2. find the bottleneck\n// 3. change ONE thing  4. measure again under the same conditions`, lang: 'js' },
      explanation: 'Without before/after numbers you can\'t tell whether a change helped, hurt or did nothing — and complexity is a cost.',
    },
    {
      title: 'Trusting one measurement on a fast laptop',
      wrong: { code: `// one run, no throttling: "sort takes 4 ms, ship it"`, lang: 'js' },
      right: { code: `// several runs, CPU throttling or a mid-range phone, realistic data size;\n// compare medians/percentiles, and check field data after release`, lang: 'js' },
      explanation: 'Your machine is probably much faster than your users\' devices, and single runs are noisy.',
    },
    {
      title: 'Asserting absolute milliseconds in unit tests',
      wrong: { code: `expect(durationOfSort).toBeLessThan(10) // flaky on CI machines`, lang: 'js' },
      right: { code: `expect(rowUpdatesAfterSelect).toBe(2)   // deterministic count\n// track timings in lab/field monitoring with tolerances`, lang: 'js' },
      explanation: 'Timing depends on the machine and its load. Counts (renders, filter runs, requests) are stable and catch most regressions.',
    },
    {
      title: 'Leaving `app.config.performance` on as a "production metric"',
      wrong: { code: `app.config.performance = true // "now we have production render timings"`, lang: 'js' },
      right: { code: `// dev-only profiling aid; for production use web-vitals + your own marks`, lang: 'js' },
      explanation: 'The flag only works in development builds. Production measurement needs field data and your own User Timing marks.',
    },
  ],

  debugging: [
    {
      symptom: 'Lighthouse score is fine, but field INP is poor.',
      cause: 'A page-load Lighthouse run doesn\'t interact with the page; real users trigger slow handlers on slow devices.',
      fix: 'Record the slow interactions in the Performance panel with CPU throttling; use INP attribution from field data to find which element/event is slow.',
    },
    {
      symptom: 'LCP is slow on a client-rendered SPA.',
      cause: 'Content can\'t render until the JS bundle downloads and runs and the data request (started from JS) returns; the hero image may be lazy-loaded or unprioritised.',
      fix: 'Split the bundle, start data fetching earlier, prioritise the LCP image, or consider SSR/SSG (see [rendering strategies](lesson:rendering-strategies)).',
    },
    {
      symptom: 'CLS is high after adding async components.',
      cause: 'Loading placeholders are smaller than the final content, or images have no dimensions, so content jumps when it arrives.',
      fix: 'Reserve space: skeletons with the final size, `width`/`height` or `aspect-ratio` on media, no content injected above what the user is reading.',
    },
    {
      symptom: 'Measurements vary wildly between runs.',
      cause: 'Noise: background tabs, CPU frequency, garbage collection, cold vs warm caches.',
      fix: 'Close other work, run several times, compare medians/percentiles, and keep conditions identical between before and after.',
    },
    {
      symptom: 'You can\'t tell which component is expensive in a flame chart.',
      cause: 'Production bundles are minified and component boundaries aren\'t labelled.',
      fix: 'In development, enable `app.config.performance` for per-component marks and use Vue Devtools; in production, add your own marks around key interactions.',
    },
  ],

  bestPractices: [
    'Measure before and after every optimisation, under the same conditions.',
    'Profile production builds with CPU/network throttling or real mid-range devices.',
    'Know the Core Web Vitals and their good thresholds: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (at p75).',
    'Combine lab tools (debugging) with field data (truth).',
    'Instrument key interactions with User Timing marks.',
    'Use `app.config.performance` and Vue Devtools in development to find expensive components.',
    'Protect wins with budgets in CI and deterministic count-based tests.',
  ],

  useCases: [
    'Diagnosing a slow search or sort interaction (INP).',
    'Proving that lazy loading improved initial load (LCP, bundle size).',
    'Finding layout shifts introduced by async content (CLS).',
    'Setting up real-user monitoring for a production app.',
    'Adding bundle-size and Lighthouse budgets to CI.',
  ],

  whenToUse: {
    use: [
      'The Performance panel when something feels slow — to find where time goes.',
      'Field data (web-vitals, CrUX) to know what users actually experience.',
      'Count-based tests to lock in rendering and data-flow optimisations.',
    ],
    avoid: [
      'Drawing conclusions from the dev server or a single run.',
      'Micro-benchmarks of isolated functions when the real problem is in the page.',
      'Absolute-millisecond assertions in unit tests.',
    ],
  },

  comparison: {
    title: 'Measurement tools at a glance',
    headers: ['', 'Performance panel', 'Lighthouse', 'Vue Devtools + `app.config.performance`', 'web-vitals / RUM'],
    rows: [
      ['Type', 'lab, manual', 'lab, automated', 'development-time inspection', 'field (real users)'],
      ['Answers', 'where does time go in this recording?', 'how does this page load score in a controlled run?', 'which components render, with what state, how long (dev)?', 'what do users actually experience?'],
      ['Measures INP?', 'shows interaction timings while you record', 'no (page-load run; reports TBT instead)', 'no', 'yes'],
      ['Production build?', 'yes — use it', 'yes — use it', 'development only', 'yes'],
      ['Best for', 'debugging a specific slowdown', 'CI budgets, regressions', 'finding expensive components', 'priorities and regression alerts'],
    ],
  },

  quiz: [
    {
      id: 'measuring-performance-q1',
      type: 'mcq',
      prompt: 'Which metric replaced First Input Delay (FID) as a Core Web Vital in March 2024?',
      options: [
        { text: 'Interaction to Next Paint (INP)' },
        { text: 'Total Blocking Time (TBT)', why: 'TBT is a lab metric (e.g. in Lighthouse) used as a proxy for responsiveness; it isn\'t a Core Web Vital.' },
        { text: 'Time to First Byte (TTFB)', why: 'TTFB is a useful supporting metric for server response, not the FID replacement.' },
        { text: 'First Contentful Paint (FCP)', why: 'FCP is a loading metric and not a Core Web Vital.' },
      ],
      answer: 0,
      explanation: 'INP measures the latency of interactions across the whole visit (input delay + processing + presentation), not just the delay before the first input.',
    },
    {
      id: 'measuring-performance-q2',
      type: 'output',
      prompt: 'Using the nearest-rank method (sort ascending, take the value at position ceil(0.75 × n)), what is the 75th percentile of these INP samples (ms)?',
      code: {
        lang: 'js',
        code: `const inp = [120, 80, 350, 150, 90, 400, 110, 180]`,
      },
      options: [
        { text: '180' },
        { text: '150', why: 'Sorted: 80, 90, 110, 120, 150, 180, 350, 400. ceil(0.75 × 8) = 6 → the 6th value.' },
        { text: '185', why: 'That is the average, not a percentile.' },
        { text: '350', why: 'That would be the 7th value (p87.5).' },
      ],
      answer: 0,
      explanation: 'Sorted: 80, 90, 110, 120, 150, **180**, 350, 400. The 6th of 8 values is 180 ms — within the "good" INP threshold of 200 ms. Core Web Vitals are assessed at p75 because averages hide the slow experiences.',
    },
    {
      id: 'measuring-performance-q3',
      type: 'bug',
      prompt: 'This measurement claims the sort takes almost no time, even though the UI visibly freezes. Click the line that makes the measurement wrong.',
      code: {
        lang: 'js',
        code: `async function sortByName() {
  const start = performance.now()
  const sorted = [...products.value]
  console.log('took', performance.now() - start, 'ms')
  sorted.sort((a, b) => a.name.localeCompare(b.name))
  products.value = sorted
  await nextTick()
}`,
      },
      answerLine: 4,
      explanation: 'The duration is logged before the sort and the Vue update even happen. Measure after `await nextTick()` to include the sort and the re-render.',
    },
    {
      id: 'measuring-performance-q4',
      type: 'fill',
      prompt: 'Fill the blanks: create a User Timing measure that shows up in the Performance panel.',
      code: {
        lang: 'js',
        code: `performance.___('search:start')
runSearch(query)
performance.mark('search:end')
performance.___('search', 'search:start', 'search:end')`,
      },
      answer: [['mark'], ['measure']],
      explanation: '`performance.mark()` records named timestamps; `performance.measure()` creates a named duration between them, visible in the DevTools Timings track.',
    },
    {
      id: 'measuring-performance-q5',
      type: 'mcq',
      prompt: 'A teammate profiles the app with `npm run dev` and concludes "Vue rendering is our bottleneck". What\'s the problem with that conclusion?',
      options: [
        { text: 'The development build adds warnings, checks and debug hooks, and the dev server serves unbundled modules — timings don\'t represent production' },
        { text: 'Nothing — dev and production builds perform the same', why: 'The development build deliberately does extra work to help you debug.' },
        { text: 'Vue can only be profiled with Vue Devtools', why: 'The browser\'s Performance panel works for any page, and is the main tool for production builds.' },
        { text: 'Performance can only be measured in CI', why: 'Local profiling of a production build is a normal, useful step.' },
      ],
      answer: 0,
      explanation: 'Build with `vite build`, serve with `vite preview`, throttle the CPU — then profile.',
    },
    {
      id: 'measuring-performance-q6',
      type: 'mcq',
      prompt: 'Which change most directly improves **CLS** on a page whose product images load late?',
      options: [
        { text: 'Give the images explicit `width`/`height` (or an `aspect-ratio`) so space is reserved' },
        { text: 'Debounce the search input', why: 'That helps responsiveness (INP), not layout stability.' },
        { text: 'Lazy-load the route', why: 'That changes bundle size and loading, not whether content shifts.' },
        { text: 'Use `v-memo` on the list', why: 'v-memo skips re-renders; it doesn\'t reserve space for late images.' },
      ],
      answer: 0,
      explanation: 'Layout shifts happen when content appears without reserved space. Dimensions or aspect-ratio boxes keep the layout stable while images load.',
    },
    {
      id: 'measuring-performance-q7',
      type: 'short',
      prompt: 'Explain the difference between lab and field performance data, and why you need both.',
      answer: 'Lab data comes from controlled runs (Lighthouse, DevTools, WebPageTest): repeatable and detailed, so it\'s ideal for debugging and CI budgets — but it reflects one device and network you chose, and page-load runs can\'t measure interactions (INP). Field data comes from real users (CrUX, web-vitals RUM): it reflects actual devices, networks and behaviour and is what Core Web Vitals assessments use, but it\'s aggregated and harder to debug. Use field data to decide what matters and confirm improvements; use lab tools to find out why and to test fixes.',
    },
  ],

  exercises: [
    {
      id: 'measure-async',
      title: 'Time an async operation',
      difficulty: 'intermediate',
      prompt: `
Implement \`measureAsync(label, fn)\` in **timing.js**:

- It calls \`fn()\` (which returns a promise) and resolves with the **same value**.
- It records \`{ label, ms }\` in the exported reactive \`timings\` array, with \`ms\` rounded to a whole number, measured with \`performance.now()\`.
- If \`fn\` rejects, it still records the entry with \`failed: true\` and **rethrows** the error.

The app\'s **Load orders** button (\`class="load"\`) shows \`class="orders"\` (**N orders**) and the last timing in \`class="timing"\` (**loadOrders: N ms**).
`,
      files: {
        'timing.js': `import { reactive } from 'vue'

export const timings = reactive([])

// TODO: time fn(), record { label, ms } (or { label, ms, failed: true }), return its value
export async function measureAsync(label, fn) {
  return fn()
}`,
        'api.js': `// Simulated API: answers after ~150 ms
export function fetchOrders() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([{ id: 1 }, { id: 2 }, { id: 3 }]), 150)
  })
}`,
        'App.vue': `<script setup>
import { ref, computed } from 'vue'
import { measureAsync, timings } from './timing.js'
import { fetchOrders } from './api.js'

const orders = ref([])
const last = computed(() => timings[timings.length - 1])

async function load() {
  orders.value = await measureAsync('loadOrders', fetchOrders)
}
</script>

<template>
  <button class="load" @click="load">Load orders</button>
  <p class="orders">{{ orders.length }} orders</p>
  <p class="timing">{{ last ? last.label + ': ' + last.ms + ' ms' : 'not measured yet' }}</p>
</template>`,
      },
      hints: [
        'Take `const start = performance.now()` before calling `fn()`, and compute `Math.round(performance.now() - start)` after it settles.',
        'Use `try { const value = await fn(); …; return value } catch (error) { …; throw error }`.',
        'Push `{ label, ms }` on success and `{ label, ms, failed: true }` on failure — before rethrowing.',
      ],
      solution: {
        explanation: 'Timing around the awaited promise measures the whole asynchronous operation (here: the simulated network wait). Recording failures matters: slow *and* failing requests are exactly what you want to see in monitoring. In production you would also add a `performance.mark`/`measure` pair and send the entry to your analytics.',
        files: {
          'timing.js': `import { reactive } from 'vue'

export const timings = reactive([])

export async function measureAsync(label, fn) {
  const start = performance.now()
  try {
    const value = await fn()
    timings.push({ label, ms: Math.round(performance.now() - start) })
    return value
  } catch (error) {
    timings.push({ label, ms: Math.round(performance.now() - start), failed: true })
    throw error
  }
}`,
          'api.js': `// Simulated API: answers after ~150 ms
export function fetchOrders() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([{ id: 1 }, { id: 2 }, { id: 3 }]), 150)
  })
}`,
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import { measureAsync, timings } from './timing.js'
import { fetchOrders } from './api.js'

const orders = ref([])
const last = computed(() => timings[timings.length - 1])

async function load() {
  orders.value = await measureAsync('loadOrders', fetchOrders)
}
</script>

<template>
  <button class="load" @click="load">Load orders</button>
  <p class="orders">{{ orders.length }} orders</p>
  <p class="timing">{{ last ? last.label + ': ' + last.ms + ' ms' : 'not measured yet' }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'returns the result of fn', code: `const { measureAsync } = requireModule('timing.js'); const v = await measureAsync('answer', async () => 42); expect(v).toBe(42)` },
        { name: 'records a realistic duration', code: `const { measureAsync, timings } = requireModule('timing.js'); await measureAsync('slow', () => new Promise((r) => setTimeout(() => r('ok'), 120))); const entry = timings.find((e) => e.label === 'slow'); expect(entry).toBeTruthy(); expect(entry.ms).toBeGreaterThanOrEqual(100); expect(Number.isInteger(entry.ms)).toBe(true)` },
        { name: 'records failures and rethrows', code: `const { measureAsync, timings } = requireModule('timing.js'); let message = ''; try { await measureAsync('bad', async () => { throw new Error('boom') }) } catch (e) { message = e.message } expect(message).toBe('boom'); expect(timings.find((e) => e.label === 'bad').failed).toBe(true)` },
        { name: 'the app shows orders and the timing', code: `await click('.load'); await wait(250); expect(text('.orders')).toBe('3 orders'); expect(text('.timing')).toMatch(/^loadOrders: \\d+ ms$/)` },
      ],
    },
    {
      id: 'metrics-reporter',
      title: 'Batch metrics for real-user monitoring',
      difficulty: 'advanced',
      prompt: `
Sending every metric in its own request is wasteful. Implement \`createReporter(send, batchSize = 5)\` in **reporter.js**:

- \`report(metric)\` queues the metric.
- When the queue reaches \`batchSize\`, it calls \`send(batch)\` with **all** queued metrics (an array) and empties the queue.
- \`flush()\` sends whatever is queued (if anything) and empties the queue. Flushing an empty queue must **not** call \`send\`.

The app reports fake metrics (\`class="report-lcp"\`, \`class="report-inp"\`), flushes with \`class="flush"\`, and shows \`class="sent"\` (**Batches sent: N**).
`,
      files: {
        'reporter.js': `// TODO: queue metrics and send them in batches
export function createReporter(send, batchSize = 5) {
  return {
    report(metric) {
      send([metric]) // sends every metric on its own
    },
    flush() {},
  }
}`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import { createReporter } from './reporter.js'

const batches = ref([])
const reporter = createReporter((batch) => {
  // in a real app: navigator.sendBeacon('/analytics', JSON.stringify(batch))
  batches.value = [...batches.value, batch]
})
</script>

<template>
  <button class="report-lcp" @click="reporter.report({ name: 'LCP', value: 1800 })">Report LCP</button>
  <button class="report-inp" @click="reporter.report({ name: 'INP', value: 120 })">Report INP</button>
  <button class="flush" @click="reporter.flush()">Flush (e.g. page hidden)</button>
  <p class="sent">Batches sent: {{ batches.length }}</p>
</template>`,
      },
      hints: [
        'Keep a `queue` array in the closure.',
        'Write a `flush()` that returns early when the queue is empty; otherwise copy the queue, clear it, and call `send(copy)`.',
        '`report()` pushes and calls `flush()` when `queue.length >= batchSize`.',
      ],
      solution: {
        explanation: 'Batching cuts the number of requests while `flush()` gives you a hook to send leftovers — typically on `visibilitychange` when the page becomes hidden, using `navigator.sendBeacon` so the request survives the page closing. Copying the queue before clearing it means `send` receives a stable array even if new metrics arrive meanwhile.',
        files: {
          'reporter.js': `export function createReporter(send, batchSize = 5) {
  let queue = []

  function flush() {
    if (queue.length === 0) return
    const batch = queue
    queue = []
    send(batch)
  }

  function report(metric) {
    queue.push(metric)
    if (queue.length >= batchSize) flush()
  }

  return { report, flush }
}

// In a real app:
// import { onLCP, onINP, onCLS } from 'web-vitals'
// const reporter = createReporter((batch) => navigator.sendBeacon('/analytics', JSON.stringify(batch)))
// onLCP(reporter.report); onINP(reporter.report); onCLS(reporter.report)
// document.addEventListener('visibilitychange', () => {
//   if (document.visibilityState === 'hidden') reporter.flush()
// })`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { createReporter } from './reporter.js'

const batches = ref([])
const reporter = createReporter((batch) => {
  // in a real app: navigator.sendBeacon('/analytics', JSON.stringify(batch))
  batches.value = [...batches.value, batch]
})
</script>

<template>
  <button class="report-lcp" @click="reporter.report({ name: 'LCP', value: 1800 })">Report LCP</button>
  <button class="report-inp" @click="reporter.report({ name: 'INP', value: 120 })">Report INP</button>
  <button class="flush" @click="reporter.flush()">Flush (e.g. page hidden)</button>
  <p class="sent">Batches sent: {{ batches.length }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'does not send before the batch is full', code: `const { createReporter } = requireModule('reporter.js'); const sent = []; const r = createReporter((b) => sent.push(b)); r.report({ name: 'LCP', value: 1 }); r.report({ name: 'CLS', value: 0.01 }); r.report({ name: 'INP', value: 90 }); expect(sent).toHaveLength(0)` },
        { name: 'sends a full batch automatically', code: `const { createReporter } = requireModule('reporter.js'); const sent = []; const r = createReporter((b) => sent.push(b), 3); r.report({ name: 'A', value: 1 }); r.report({ name: 'B', value: 2 }); r.report({ name: 'C', value: 3 }); expect(sent).toHaveLength(1); expect(sent[0].map((m) => m.name)).toEqual(['A', 'B', 'C'])` },
        { name: 'flush sends leftovers once; empty flush sends nothing', code: `const { createReporter } = requireModule('reporter.js'); const sent = []; const r = createReporter((b) => sent.push(b)); r.report({ name: 'LCP', value: 1 }); r.report({ name: 'INP', value: 2 }); r.flush(); r.flush(); expect(sent).toHaveLength(1); expect(sent[0]).toHaveLength(2)` },
        { name: 'the app sends on flush', code: `await click('.report-lcp'); await click('.report-inp'); expect(text('.sent')).toBe('Batches sent: 0'); await click('.flush'); expect(text('.sent')).toBe('Batches sent: 1')` },
      ],
    },
  ],

  interview: [
    {
      id: 'measuring-performance-optimise-large-app',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'How would you optimise a large, slow Vue application?',
      answer: 'Start by measuring, not guessing: field data (Core Web Vitals by page and device) to see what users feel, then lab profiling of a production build with throttling to find causes. Then work through the biggest measured problems: **loading** (bundle analysis, lazy routes and components, tree shaking, images/fonts, earlier data fetching or SSR/SSG), **rendering** (re-render counts, stable props, component boundaries, computed instead of methods/watchers, virtualization for big lists, v-memo where justified), **data/reactivity** (shallowRef/markRaw for big or foreign data, narrow watchers), and **runtime work** (debounce/throttle, chunking long tasks, workers, KeepAlive limits, cleanup). Change one thing at a time, re-measure, and protect the wins with budgets in CI and monitoring.',
      explanation: 'Measure → find the biggest bottleneck → targeted fix → re-measure → guard against regressions.',
      whyAsked: 'A classic senior question: it tests process and breadth, not one trick.',
      mistakes: ['Listing techniques without mentioning measurement.', 'Jumping to micro-optimisations (v-memo everywhere) first.', 'Profiling the dev build.', 'Ignoring network, images and the backend.'],
      followUps: ['What would you look at first in a bundle analysis?', 'How would you prevent regressions?', 'When would SSR be the answer?'],
      modelAnswer: 'I\'d start with data: Core Web Vitals from real users to see which pages and metrics are bad, then profile a production build with CPU throttling to find out why. If loading is the problem, I\'d analyse the bundle, lazy-load routes and heavy components, fix tree shaking, optimise images and fonts, start data fetching earlier, and consider SSR or SSG for content pages. If interactions are slow, I\'d count re-renders, stabilise props, split components, replace template methods with computeds, virtualize big lists, and break up long tasks. For data, shallowRef or markRaw for large or third-party objects. I change one thing at a time, re-measure, and lock in improvements with bundle and Lighthouse budgets in CI plus monitoring alerts.',
    },
    {
      id: 'measuring-performance-core-web-vitals',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What are the Core Web Vitals, and what are their "good" thresholds?',
      answer: 'Three user-centric metrics defined by Google (web.dev): **LCP** (Largest Contentful Paint, loading) — good ≤ 2.5 s; **INP** (Interaction to Next Paint, responsiveness) — good ≤ 200 ms; **CLS** (Cumulative Layout Shift, visual stability) — good ≤ 0.1. Each is assessed at the 75th percentile of page loads. INP replaced First Input Delay as a Core Web Vital in March 2024.',
      explanation: 'Loading, responsiveness and stability — measured from real users.',
      whyAsked: 'Basic literacy for any frontend role that cares about performance.',
      mistakes: ['Still naming FID as current.', 'Confusing Lighthouse\'s score with Core Web Vitals.', 'Not knowing they are evaluated at p75.'],
      followUps: ['Why the 75th percentile?', 'Which of them can Lighthouse measure on page load?'],
      modelAnswer: 'They\'re Google\'s three key user-experience metrics. LCP measures loading — when the largest image or text block is rendered — and good is 2.5 seconds or less. INP measures responsiveness across the visit, the latency from an interaction to the next paint; good is 200 milliseconds or less, and it replaced FID in March 2024. CLS measures unexpected layout shifts; good is 0.1 or less. They\'re assessed at the 75th percentile of real page loads, so most users, not just the average, need a good experience.',
    },
    {
      id: 'measuring-performance-inp-vue',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Field data shows poor INP on your product listing page, mostly from clicks on filter checkboxes. How do you investigate and what are likely Vue-side causes?',
      answer: 'Reproduce on a production build with CPU throttling, record the interaction in the Performance panel and inspect the Interactions track and the long task behind it: how much is input delay (main thread already busy), processing (handlers, watchers, Vue\'s re-render) and presentation (layout/paint). Likely Vue causes: synchronous filtering/sorting of a large list in the handler or in a template method; many components re-rendering due to unstable props; deep watchers on large state; rendering thousands of rows. Fixes: computed caching, stable props/boundaries, virtualization, shallow data, chunking or workers for heavy work, then confirm with field data.',
      explanation: 'Break the interaction into its three phases and attack the biggest one.',
      whyAsked: 'INP is the newest Core Web Vital; this checks practical debugging skill.',
      mistakes: ['Only running Lighthouse (it doesn\'t measure INP on load).', 'Guessing without recording.', 'Ignoring input delay caused by other work.'],
      followUps: ['How can field data tell you which element is slow?', 'What if the long task is third-party script?'],
      modelAnswer: 'First I\'d reproduce it: production build, CPU throttling, record clicking the filters in the Performance panel. The Interactions track shows the interaction\'s duration, and I\'d split it into input delay, processing and presentation. On the Vue side, the usual suspects are a big synchronous filter or sort in the handler or a template method, lots of components re-rendering because of unstable props, deep watchers, or simply rendering thousands of rows. I\'d fix the largest part — computeds, stable props, virtualization, chunking or a worker — and then check that field INP improves after release.',
    },
    {
      id: 'measuring-performance-lab-vs-field',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Your Lighthouse performance score is high, but CrUX says the page fails Core Web Vitals. How can both be true?',
      options: [
        'Lighthouse is always wrong',
        'Lab runs use one controlled device/network and a page load without interactions, while field data reflects real users\' devices, networks, caches and interactions at p75',
        'CrUX only measures desktop users',
        'Core Web Vitals are calculated from the Lighthouse score',
      ],
      correctOption: 1,
      answer: 'Lighthouse is a lab test: one configured device and network, a cold page load, no real interactions (so no INP; it reports TBT instead). Field data aggregates real users at the 75th percentile — slower devices, worse networks, different content, logged-in states, and real interactions. Use field data to know there\'s a problem and lab tools to reproduce and fix it.',
      explanation: 'Different questions, different data. Field is truth; lab is a microscope.',
      whyAsked: 'Distinguishes candidates who understand measurement from those who chase a score.',
      mistakes: ['Optimising only for the Lighthouse score.', 'Dismissing field data as noise.'],
      followUps: ['How would you reproduce the field conditions in the lab?', 'Which field metric would you look at first?'],
      modelAnswer: 'They measure different things. Lighthouse is one controlled run — a configured device and network, a fresh load, no real interactions, so it can\'t measure INP and reports TBT as a proxy. CrUX reflects real users at the 75th percentile, on slower phones and networks, with real content and interactions. So a good lab score doesn\'t guarantee good field metrics. I\'d look at which field metric fails, segment by device and page, then reproduce those conditions in the lab with throttling and realistic data to find the cause.',
    },
    {
      id: 'measuring-performance-dev-build',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A colleague turns on `app.config.performance = true`, deploys, and expects to see component render timings from production users. Will it work?',
      answer: 'No. `app.config.performance` only works in development builds (in browsers that support the User Timing API); production builds ignore it. For production, collect Web Vitals with a RUM setup (e.g. the web-vitals library) and add your own `performance.mark`/`measure` around key interactions.',
      explanation: 'Dev-time profiling aid vs production measurement.',
      whyAsked: 'Checks understanding of dev-only tooling, a common confusion.',
      mistakes: ['Assuming dev tooling is available in production.', 'Profiling the dev server and treating numbers as production numbers.'],
      followUps: ['How would you measure a specific interaction in production?', 'Why is the development build slower?'],
      modelAnswer: 'No — that flag is a development-only profiling aid; in production builds it does nothing. It\'s great locally: the Performance panel then shows render and patch marks per component. For production I\'d send Core Web Vitals from real users with the web-vitals library and add User Timing marks around the interactions we care about, reporting those durations to our monitoring.',
    },
    {
      id: 'measuring-performance-cls-spa',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'After introducing async components with loading skeletons and a cookie banner, CLS went from good to poor. How do you find and fix the shifts?',
      answer: 'Find them: the Performance panel marks layout shifts (and shows which elements moved); field CLS attribution (web-vitals attribution build) names the largest shifting element. Typical causes: skeletons smaller than the loaded content, images without dimensions inside lazy components, the banner inserted at the top pushing content down, web fonts changing text size. Fixes: size skeletons like the final content (or reserve min-height), set width/height/aspect-ratio on media, overlay the banner (fixed position) or reserve its space, use font-display and matched fallback metrics. Re-measure.',
      explanation: 'Reserve space for everything that arrives late.',
      whyAsked: 'CLS regressions are common with lazy loading; this checks practical diagnosis.',
      mistakes: ['Removing lazy loading entirely.', 'Not knowing shifts after recent user input don\'t count.', 'Guessing instead of using attribution.'],
      followUps: ['Why don\'t shifts right after a click count towards CLS?', 'How would you test for CLS regressions in CI?'],
      modelAnswer: 'I\'d first find the shifting elements: the Performance panel highlights layout shifts, and field data with web-vitals attribution tells me which element shifts most. With async components the usual cause is a skeleton that\'s smaller than the real content, or images inside without dimensions; the cookie banner probably pushes the page down when it\'s inserted. I\'d size skeletons to match, add width, height or aspect-ratio to media, make the banner an overlay or reserve its space, and tune font loading. Then I\'d re-measure locally and watch field CLS after release.',
    },
    {
      id: 'measuring-performance-coding-p75',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Implement `p75(values)` and `rate(metric, value)` in **vitals.js**. `p75` uses the nearest-rank method: sort ascending (don\'t mutate the input) and return the value at position `ceil(0.75 × n)` (1-based); return `null` for an empty array. `rate` returns `\'good\'`, `\'needs-improvement\'` or `\'poor\'` using web.dev thresholds: LCP good ≤ 2500, poor > 4000 (ms); INP good ≤ 200, poor > 500 (ms); CLS good ≤ 0.1, poor > 0.25. The app shows each metric\'s p75 and rating in `class="row-LCP"`, `class="row-INP"`, `class="row-CLS"`.',
      starter: {
        files: {
          'vitals.js': `// TODO: nearest-rank 75th percentile
export function p75(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length // that's the average!
}

// TODO: 'good' | 'needs-improvement' | 'poor'
export function rate(metric, value) {
  return 'good'
}`,
          'App.vue': `<script setup>
import { p75, rate } from './vitals.js'

// Pretend these came from real users via the web-vitals library
const samples = {
  LCP: [1800, 2100, 2600, 3900, 2300, 4200, 2000, 2450],
  INP: [90, 140, 260, 180, 120, 610, 150, 170],
  CLS: [0.02, 0.05, 0.3, 0.08, 0.01, 0.12, 0.04, 0.06],
}
const rows = Object.entries(samples).map(([name, values]) => {
  const value = p75(values)
  return { name, value, rating: rate(name, value) }
})
</script>

<template>
  <table>
    <tr v-for="row in rows" :key="row.name" :class="'row-' + row.name">
      <td>{{ row.name }}</td> <td>{{ row.value }}</td> <td>{{ row.rating }}</td>
    </tr>
  </table>
</template>`,
        },
      },
      tests: [
        { name: 'p75 uses the nearest-rank method', code: `const { p75 } = requireModule('vitals.js'); expect(p75([120, 80, 350, 150, 90, 400, 110, 180])).toBe(180); expect(p75([5])).toBe(5); expect(p75([4, 1, 3, 2])).toBe(3)` },
        { name: 'p75 handles empty input and does not mutate', code: `const { p75 } = requireModule('vitals.js'); expect(p75([])).toBeNull(); const input = [3, 1, 2]; p75(input); expect(input).toEqual([3, 1, 2])` },
        { name: 'rates with the web.dev thresholds', code: `const { rate } = requireModule('vitals.js'); expect(rate('LCP', 2500)).toBe('good'); expect(rate('LCP', 2501)).toBe('needs-improvement'); expect(rate('LCP', 4001)).toBe('poor'); expect(rate('INP', 200)).toBe('good'); expect(rate('INP', 500)).toBe('needs-improvement'); expect(rate('INP', 501)).toBe('poor'); expect(rate('CLS', 0.1)).toBe('good'); expect(rate('CLS', 0.2)).toBe('needs-improvement'); expect(rate('CLS', 0.26)).toBe('poor')` },
        { name: 'the dashboard shows p75 ratings', code: `expect(text('.row-LCP')).toBe('LCP 2600 needs-improvement'); expect(text('.row-INP')).toBe('INP 180 good'); expect(text('.row-CLS')).toBe('CLS 0.08 good')` },
      ],
      hints: [
        'Copy before sorting: `[...values].sort((a, b) => a - b)` — the default sort compares strings.',
        'The 1-based position is `Math.ceil(0.75 * n)`, so the array index is that minus 1.',
        'Keep thresholds in an object: `{ LCP: [2500, 4000], INP: [200, 500], CLS: [0.1, 0.25] }` and compare `value <= good`, `value <= poor`.',
      ],
      answer: 'Sort a copy numerically, pick index ceil(0.75n) − 1; compare against [good, poor] thresholds per metric.',
      solution: {
        files: {
          'vitals.js': `const THRESHOLDS = {
  LCP: [2500, 4000], // ms
  INP: [200, 500],   // ms
  CLS: [0.1, 0.25],  // unitless
}

export function p75(values) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.ceil(0.75 * sorted.length) - 1]
}

export function rate(metric, value) {
  const [good, poor] = THRESHOLDS[metric]
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}`,
          'App.vue': `<script setup>
import { p75, rate } from './vitals.js'

// Pretend these came from real users via the web-vitals library
const samples = {
  LCP: [1800, 2100, 2600, 3900, 2300, 4200, 2000, 2450],
  INP: [90, 140, 260, 180, 120, 610, 150, 170],
  CLS: [0.02, 0.05, 0.3, 0.08, 0.01, 0.12, 0.04, 0.06],
}
const rows = Object.entries(samples).map(([name, values]) => {
  const value = p75(values)
  return { name, value, rating: rate(name, value) }
})
</script>

<template>
  <table>
    <tr v-for="row in rows" :key="row.name" :class="'row-' + row.name">
      <td>{{ row.name }}</td> <td>{{ row.value }}</td> <td>{{ row.rating }}</td>
    </tr>
  </table>
</template>`,
        },
      },
      explanation: 'Percentiles describe the experience of most users, where averages hide the slow tail. The sample data shows it: LCP\'s average looks fine-ish, but its p75 (2600 ms) needs improvement. Thresholds are the official web.dev values; production tools also segment by device type and page.',
      whyAsked: 'Shows understanding of how Core Web Vitals are assessed, plus careful implementation (numeric sort, no mutation, edge cases).',
      mistakes: ['Using the default `.sort()` (string order).', 'Sorting the input in place.', 'Using the average instead of a percentile.', 'Off-by-one errors in the index.'],
      followUps: ['Why p75 rather than the median?', 'How would you compute this per device type and page?'],
      modelAnswer: 'For p75 I copy the array, sort it numerically — the default sort compares strings — and take the value at position ceil(0.75 times n), which is index minus one; empty input returns null. For ratings I keep each metric\'s good and poor thresholds from web.dev in a table: at or below good is good, at or below poor needs improvement, above that is poor. Core Web Vitals use the 75th percentile so that most users, not the average, get a good experience — the averages in this sample would hide the slow LCP tail.',
    },
  ],

  takeaways: [
    'Measure before and after every optimisation — on a production build, realistic device and data.',
    'Core Web Vitals: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, assessed at the 75th percentile; INP replaced FID in March 2024.',
    'Field data (web-vitals, CrUX) says what users feel; lab tools (Performance panel, Lighthouse) explain why.',
    'An interaction = input delay + processing (handlers + Vue re-render) + presentation; attack the biggest part.',
    'Use `performance.now()`/`mark`/`measure` for your own timings; `app.config.performance` and Vue Devtools in development.',
    'Protect wins with budgets in CI and count-based tests; avoid absolute-millisecond unit tests.',
  ],
}
