// Lesson: Runtime performance: debounce, shallow state & more — Level 12, Performance

const productsJs = `// Plain, NON-reactive counters: writing reactive state while
// rendering would trigger more renders.
export const stats = { filterRuns: 0, lastMs: 0 }

export function makeProducts(count) {
  const words = ['Lamp', 'Desk', 'Chair', 'Shelf', 'Mug', 'Rug', 'Clock', 'Plant', 'Sofa', 'Stool']
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: words[i % words.length] + ' ' + (i + 1),
    price: ((i * 53) % 500) + 5,
  }))
}

// Measured in YOUR browser: how often it runs and how long the last run took
export function filterProducts(list, query) {
  const t0 = performance.now()
  const q = query.trim().toLowerCase()
  const result = q ? list.filter((p) => p.name.toLowerCase().includes(q)) : list
  stats.filterRuns++
  stats.lastMs = Math.round((performance.now() - t0) * 100) / 100
  return result
}`

const timingJs = `// Small, dependency-free helpers (libraries like lodash-es or VueUse
// offer more complete versions with leading/trailing options).

// Run fn only after \`ms\` of quiet. Each call restarts the wait.
export function debounce(fn, ms) {
  let timer
  function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
  debounced.cancel = () => clearTimeout(timer)
  return debounced
}

// Run fn at most once every \`ms\`: immediately, then once more
// at the end of the window with the latest arguments.
export function throttle(fn, ms) {
  let waiting = false
  let pendingArgs = null
  function throttled(...args) {
    if (waiting) {
      pendingArgs = args
      return
    }
    fn(...args)
    waiting = true
    setTimeout(() => {
      waiting = false
      if (pendingArgs) {
        const next = pendingArgs
        pendingArgs = null
        throttled(...next)
      }
    }, ms)
  }
  return throttled
}`

const shopApp = `<script setup>
import { ref, onMounted, onUpdated } from 'vue'
import { makeProducts, filterProducts, stats } from './products.js'

const products = ref(makeProducts(2000)) // as if loaded from an API
const query = ref('')
const cartCount = ref(0) // unrelated state that also re-renders this component
const statsEl = ref(null)

// A method called from the template: it runs on EVERY render
function visibleProducts() {
  return filterProducts(products.value, query.value)
}

// Show the measurements without reactive state (a ref here would loop)
function showStats() {
  if (statsEl.value) {
    statsEl.value.textContent =
      'Filter runs: ' + stats.filterRuns + ' · last run: ' + stats.lastMs + ' ms'
  }
}
onMounted(showStats)
onUpdated(showStats)
</script>

<template>
  <h2>Shop</h2>
  <input class="search" v-model="query" placeholder="Search products…" />
  <button class="add" @click="cartCount++">Add to cart ({{ cartCount }})</button>
  <p ref="statsEl" class="stats"></p>
  <p class="count">{{ visibleProducts().length }} products</p>
  <ul class="results">
    <li v-for="p in visibleProducts().slice(0, 20)" :key="p.id">{{ p.name }} — €{{ p.price }}</li>
  </ul>
</template>`

const pollerJs = `// Plain counter so tests and you can see how often polling happens
export const pollStats = { count: 0 }`

const stockTabStart = `<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { pollStats } from './poller.js'

const updates = ref(0)
let timer = null

function poll() {
  pollStats.count++ // pretend this is a network request
  updates.value++
}

onMounted(() => {
  timer = setInterval(poll, 100)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <section class="stock">Live prices · updates: <span class="updates">{{ updates }}</span></section>
</template>`

const tabsApp = `<script setup>
import { shallowRef } from 'vue'
import StockTab from './StockTab.vue'
import NewsTab from './NewsTab.vue'

const current = shallowRef(NewsTab)
</script>

<template>
  <button class="tab-news" @click="current = NewsTab">News</button>
  <button class="tab-stock" @click="current = StockTab">Stocks</button>
  <KeepAlive>
    <component :is="current" />
  </KeepAlive>
</template>`

export default {
  id: 'runtime-performance',
  title: 'Runtime performance: debounce, shallow state & more',
  summary: 'Keep a running app responsive: debounce and throttle bursts of events, cache expensive work, keep big data out of deep reactivity, mind KeepAlive\'s costs and break up long tasks.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['render-optimization', 'shallow-and-raw', 'computed'],
  related: ['custom-ref', 'large-lists', 'keep-alive', 'measuring-performance', 'composable-recipes'],
  tags: ['performance', 'debounce', 'throttle', 'computed', 'shallowRef', 'markRaw', 'Object.freeze', 'KeepAlive', 'long tasks', 'INP', 'web worker', 'abstraction'],
  apis: [
    { name: 'computed()', summary: 'Caches derived values until their dependencies change — unlike a method called in the template.' },
    { name: 'shallowRef() / triggerRef()', summary: 'Track only .value replacement for large data; trigger manually after an in-place mutation.' },
    { name: 'markRaw()', summary: 'Keeps third-party instances (charts, maps, editors) out of reactivity.' },
    { name: '<KeepAlive> (include / exclude / max)', summary: 'Caches component instances when switching; max limits how many are kept.' },
    { name: 'onActivated() / onDeactivated()', summary: 'Hooks for KeepAlive-cached components: resume and pause work.' },
  ],
  docs: [
    { label: 'Vue Guide — Performance: Update Optimizations', url: 'https://vuejs.org/guide/best-practices/performance.html#update-optimizations' },
    { label: 'Vue Guide — Performance: Avoid Unnecessary Component Abstractions', url: 'https://vuejs.org/guide/best-practices/performance.html#avoid-unnecessary-component-abstractions' },
    { label: 'Vue Guide — KeepAlive', url: 'https://vuejs.org/guide/built-ins/keep-alive.html' },
    { label: 'API — shallowRef() / markRaw()', url: 'https://vuejs.org/api/reactivity-advanced.html#shallowref' },
    { label: 'web.dev — Optimize long tasks', url: 'https://web.dev/articles/optimize-long-tasks' },
  ],

  intro: `
Your app has loaded. Now the user types, scrolls, drags and switches tabs — and every one of those can make the page feel sluggish if each event triggers too much work.

Runtime performance is about keeping the **main thread** — the single thread where the browser runs your JavaScript, calculates layout and paints — free enough to respond quickly. The most common culprits in Vue apps, and their fixes:

- bursts of events → **debounce** or **throttle**;
- expensive work repeated on every render → **computed** (cache) and moving work out of templates;
- big data made deeply reactive → **shallowRef**, **markRaw**, **Object.freeze**;
- forgotten work in cached views → **KeepAlive** with \`onDeactivated\`;
- one huge synchronous job → **break it up** or move it to a **Web Worker**;
- and a quieter one: **too many components** for things that could be plain elements.
`,

  why: `
Users judge an app by how it *responds*: does the letter appear when I type, does the menu open when I tap? Google's **Interaction to Next Paint (INP)** metric measures exactly this, and anything that keeps the main thread busy — a filter running on every keystroke, a 200 ms calculation, a hidden tab still polling — makes it worse. (More in [measuring performance](lesson:measuring-performance).)

These problems rarely show up on a fast developer laptop with ten test records. They show up on a mid-range phone with real data. So this lesson keeps measuring: every playground shows how many times work ran and how long it took — in your browser.
`,

  eli15: `
Imagine a lift (elevator) in a busy office.

If the lift left the moment *anyone* pressed the button, it would make a hundred trips with one person each. Instead it waits a few seconds after the last button press, then goes — that's **debouncing**: wait for the burst to end, then act once.

A security guard who lets one group through the barrier every ten seconds, however many people arrive — that's **throttling**: act at a steady maximum rate.

A receptionist who writes the answer to a common question on a sticky note instead of looking it up every time — that's a **computed** value: remember the answer until something changes.

And someone who keeps a meeting room booked "just in case" they come back — that's **KeepAlive**: handy, but the room (memory) isn't free, and if they left the projector running (polling), it's still running.
`,

  analogy: {
    title: 'The office lift, the guard and the sticky note',
    body: `
Waiting for the burst to end, letting people through at a steady rate, and remembering answers instead of recomputing them are the three most common ways to stop doing work nobody needs.
`,
    mapping: [
      ['the lift waiting for button presses to stop', 'debounce — run once after a pause (search, autosave)'],
      ['the guard letting a group through every ten seconds', 'throttle — run at most every N ms (scroll, drag, resize)'],
      ['the sticky note with the answer', 'computed — cached until its inputs change'],
      ['looking it up every single time', 'a method called in the template — runs every render'],
      ['a room kept booked "just in case"', '`<KeepAlive>` — cached component instances use memory'],
      ['the projector left running in that room', 'timers/watchers that keep running in deactivated components'],
    ],
  },

  visual: {
    type: 'performance',
    props: { demo: 'debounce' },
    title: 'Every keystroke vs debounced, measured',
    caption: 'Type into both boxes. The counters show how many times each handler actually ran — measured live in your browser.',
    alt: 'A measured live demo with two inputs: one runs its handler on every keystroke, the other is debounced. Counters display how many times each handler ran while typing.',
  },

  syntax: [
    `
#### Debounce vs throttle
`,
    {
      code: `import { debounce, throttle } from './timing.js'

// Debounce: run once, after the user STOPS for 300 ms (search box, autosave, resize end)
const search = debounce((q) => runSearch(q), 300)

// Throttle: run at most every 100 ms WHILE events keep coming (scroll, drag, pointermove)
const onScroll = throttle(() => updateScrollPosition(), 100)

// Clean up pending timers when the component goes away
onUnmounted(() => search.cancel())`,
      lang: 'js',
      title: 'rate-limiting events',
    },
    `
| | Debounce | Throttle |
|---|---|---|
| Runs | once, after a quiet period | regularly, at most every N ms |
| Feels like | "wait until I've finished" | "keep up, but not on every pixel" |
| Typical use | search-as-you-type, autosave, validation, window resize end | scroll position, drag, pointer move, live resize |
| Risk | feels laggy if the delay is too long | misses intermediate values (usually fine) |

A debounced **ref** with \`customRef\` is covered in [customRef()](lesson:custom-ref). Libraries such as lodash-es and VueUse ship well-tested versions with leading/trailing options.

#### Expensive work: compute once, not every render
`,
    {
      code: `<!-- ❌ a method in the template: runs on EVERY render, for ANY reason -->
<p>{{ filteredProducts().length }} results</p>

<!-- ✅ computed: cached until products or query change -->
<script setup>
const filtered = computed(() => products.value.filter((p) => matches(p, query.value)))
</script>
<p>{{ filtered.length }} results</p>`,
      lang: 'vue',
      title: 'computed vs method',
    },
    `
Other ways to keep heavy work off the render path: precompute when data arrives (e.g. a lowercase search key per item), memoize by input, paginate or virtualize what you show ([large lists](lesson:large-lists)), and move truly CPU-heavy work (parsing, image processing, big sorts) into a **Web Worker** — a background thread that can't touch the DOM but doesn't block it.

#### Big data: skip deep reactivity
`,
    {
      code: `import { shallowRef, triggerRef, markRaw } from 'vue'

// Large, replace-only data: track only .value
const rows = shallowRef(await api.loadRows())
rows.value = [...rows.value, newRow]        // replacement → update
rows.value[0].name = 'x'; triggerRef(rows)  // in-place → notify manually

// Third-party instances: never proxy them
const chart = markRaw(new ChartLibrary(canvasEl.value, options))

// Read-only data: frozen objects are never proxied
const countries = ref(Object.freeze(await api.countries()))`,
      lang: 'js',
      title: 'shallow, raw and frozen',
    },
    `
#### KeepAlive: cached views aren't free
`,
    {
      code: `<KeepAlive :max="5" :include="['InboxView', 'SearchView']">
  <component :is="currentView" />
</KeepAlive>

<script setup>
// inside a cached component: pause expensive work while hidden
onActivated(() => startPolling())     // also runs on the first mount
onDeactivated(() => stopPolling())
</script>`,
      lang: 'vue',
      title: 'KeepAlive with limits and pausing',
    },
    `
\`<KeepAlive>\` keeps switched-out component instances in memory, so coming back is instant and state (scroll position, form input) survives. The costs: memory for every cached instance (use \`max\` to cap it — least recently used instances are dropped first), and **cached components stay alive**. In current Vue 3 versions (verified on 3.5), a deactivated component's watchers keep running and it still re-renders when its reactive dependencies change; timers and sockets obviously keep going too. Pause that work in \`onDeactivated\` and resume it in \`onActivated\`. (Basics: [KeepAlive & activation hooks](lesson:keep-alive).)

#### Long tasks: give the browser a chance to respond

A task that runs for a long time without yielding blocks every click and keystroke until it finishes. (The browser's Long Tasks API calls anything over 50 ms a "long task".) Split big loops into chunks and yield between them:
`,
    {
      code: `async function processInChunks(items, chunkSize, handle) {
  for (let i = 0; i < items.length; i += chunkSize) {
    items.slice(i, i + chunkSize).forEach(handle)
    // yield to the event loop so input and rendering can happen
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}`,
      lang: 'js',
      title: 'chunking work',
    },
    `
Newer Chromium-based browsers also offer \`scheduler.yield()\` for this; feature-detect it and fall back to \`setTimeout\`. For work that can't be chunked, use a Web Worker.

#### Don't over-abstract

The Vue docs point out that component instances are much more expensive than plain DOM nodes. A component per table **cell**, or layers of wrapper components that only pass props through, multiply that cost by the number of rows. Use components where they buy you reuse or clarity; render simple repeated markup as plain elements (or a single component per row). And as always — measure before restructuring.
`,
  ],

  walkthrough: {
    title: 'App.vue (shop)',
    lang: 'vue',
    code: shopApp,
    intro: 'The playground parent. `filterProducts` counts its runs and times itself with `performance.now()`, and the result is written straight into the DOM so measuring can\'t cause extra renders.',
    steps: [
      { lines: [5], text: '2,000 products in a `ref`, as if loaded from an API. `ref` makes the array deeply reactive — each product read through it becomes a proxy. Experiment 4 revisits this.' },
      { lines: [7], text: '`cartCount` has nothing to do with filtering, but it is displayed, so clicking **Add to cart** re-renders this component.' },
      { lines: [10, 13], text: 'A method used in the template. Methods have no cache: every render calls it again — and the template calls it **twice**.' },
      { lines: [15, 23], text: '`showStats` writes measurements with `textContent` after each render. Writing a ref here would itself trigger another render.' },
      { lines: [28], text: '`v-model="query"`: every keystroke changes `query`, re-rendering the list and re-running the filter.' },
      { lines: [31, 33], text: 'Two calls to `visibleProducts()` per render. Click **Add to cart** and watch "Filter runs" go up by two for a change that has nothing to do with filtering.' },
    ],
  },

  playground: {
    title: 'A shop that does too much work',
    objective: 'Measure how often an expensive filter runs, then cut it down with computed, debouncing and shallow data — proving each step with the counter.',
    files: { 'App.vue': shopApp, 'products.js': productsJs, 'timing.js': timingJs },
    expected: `
A search box, an **Add to cart** button, a stats line like **Filter runs: 2 · last run: … ms**, a product count and the first 20 products. Click **Add to cart**: runs go up by 2. Type "lamp": runs go up by 2 per keystroke. The "last run" time is measured in your browser and varies by device.
`,
    experiments: [
      {
        id: 'measure',
        task: 'Click **Add to cart** a few times and type a word. How many filter runs does each action cost? How many *should* it cost?',
        hint: 'Adding to the cart doesn\'t change the query or the products at all.',
        explain: 'Adding to the cart should cost **0** filter runs, and a search should cost **1**. The difference is work a method-in-template forces on every render.',
      },
      {
        id: 'computed-filter',
        task: 'Replace the method with a computed: `const visible = computed(() => filterProducts(products.value, query.value))`, and use `visible.length` and `visible.slice(0, 20)` in the template.',
        hint: 'Import `computed` from `\'vue\'` and delete `visibleProducts()`. In the template, a computed is used without `()`.',
        tests: [
          {
            name: 'the filter runs once at start and not for unrelated renders',
            code: `const { stats } = requireModule('products.js')
expect(stats.filterRuns).toBe(1)
await click('.add')
await click('.add')
await click('.add')
expect(stats.filterRuns).toBe(1)
expect(text('.count')).toBe('2000 products')`,
          },
        ],
        explain: 'The computed caches its result and only re-runs when `products` or `query` change. Both template reads share one evaluation, and cart clicks no longer touch the filter.',
      },
      {
        id: 'debounce-search',
        task: 'Keep your computed. Now debounce the search: bind the input to a new `draft` ref, and use `debounce` from **timing.js** to copy `draft` into `query` 250 ms after typing stops. Typing "lamp" quickly should run the filter **once**.',
        hint: '`const draft = ref(\'\')`, `const applyQuery = debounce((v) => (query.value = v), 250)`, `watch(draft, applyQuery)`, and `v-model="draft"` on the input.',
        tests: [
          {
            name: 'fast typing filters once, after a pause',
            code: `const { stats } = requireModule('products.js')
await type('.search', 'l')
await type('.search', 'la')
await type('.search', 'lam')
await type('.search', 'lamp')
expect(stats.filterRuns).toBe(1)
await wait(350)
expect(stats.filterRuns).toBe(2)
expect(text('.count')).toBe('200 products')`,
          },
        ],
        explain: 'Each keystroke restarts the timer; only the pause after the last one updates `query`, so the computed re-runs once. The input stays responsive because typing only updates `draft`. In a real component, also call `applyQuery.cancel()` in `onUnmounted`.',
      },
      {
        id: 'shallow-products',
        task: 'The products are read-only, so they don\'t need deep reactivity. Switch `ref(makeProducts(2000))` to `shallowRef(...)` and compare the "last run" time after a search.',
        hint: 'Import `shallowRef` and use it for `products`. Nothing else changes — you never mutate a product.',
        tests: [
          {
            name: 'products are plain objects and searching still works',
            code: `const { isReactive } = requireModule('vue')
expect(isReactive(state.products[0])).toBe(false)
await type('.search', 'desk')
await wait(350)
expect(text('.count')).toBe('200 products')`,
          },
        ],
        explain: 'With `ref`, filtering reads each product through a reactive proxy: proxies are created and every property read is tracked. With `shallowRef`, the filter reads plain objects. How much that saves depends on your device and data — read the "last run" numbers rather than trusting a rule of thumb.',
      },
    ],
  },

  animation: {
    type: 'performance',
    props: { demo: 'shallow' },
    title: 'Deep vs shallow reactivity, measured',
    caption: 'Load the same large dataset into a deep `ref` and a `shallowRef` and compare the measured costs in your browser.',
    alt: 'A measured live demo that loads the same large dataset into a deeply reactive ref and into a shallowRef, then reports timing measurements from the learner\'s browser for creating and reading each.',
  },

  internals: {
    beginner: `
Your JavaScript, Vue's rendering and the browser's layout and painting all share one worker: the main thread. While it's busy, it can't react to a tap or a key. Every technique here either does less work (computed, shallow data, fewer components), does it less often (debounce, throttle, pausing hidden tabs) or does it in smaller pieces or elsewhere (chunking, Web Workers).
`,
    technical: [
      `
**Methods vs computed.** A method referenced in the template is just a function call inside the render function: it runs every time the component renders, for whatever reason. A computed is a cached reactive effect: it re-evaluates only when read *after* one of its dependencies changed, and (3.4+) it only notifies readers when its value changes.

**Debounce/throttle and reactivity.** Debouncing at the *input* (copying \`draft\` to \`query\` later) means the expensive computed's dependency changes once per pause. Debouncing a *watcher callback* still lets every keystroke invalidate computeds that read the raw value — put the rate limit before the expensive part of the dependency graph.

**Deep reactivity cost.** \`ref(array)\` converts lazily: each object becomes a proxy the first time it's read through the reactive array, and each property read inside an effect is tracked. For 2,000 rows read by a filter, that's 2,000 proxies (cached afterwards) and thousands of tracked reads per run. \`shallowRef\`, frozen objects and \`markRaw\` skip all of that.

**KeepAlive.** A cached instance is moved into an off-DOM container when deactivated; it is not unmounted. Its effects remain active, so changes to state it reads will still re-render it (into the hidden container) and its watchers still fire. \`max\` evicts the least recently used instance by unmounting it.

**Long tasks.** The browser can only handle input between tasks. Splitting work into chunks with \`await\` on a macrotask (e.g. \`setTimeout\`) lets input and rendering run in between. Awaiting a microtask (\`await Promise.resolve()\`) does **not** yield to rendering or input.
`,
      {
        callout: 'note',
        title: 'Verified behaviour, not a promise',
        text: 'That deactivated KeepAlive components keep reacting was verified against Vue 3.5 for this lesson. Since 3.5, effect scopes can be paused, so future versions *could* choose to pause cached components — design your components so they pause their own expensive work in `onDeactivated` either way.',
      },
    ],
    production: `
- **Profile real interactions** (Performance panel, INP in field data) on mid-range devices with realistic data volumes before and after changes.
- **Rate-limit at the source:** debounce search inputs and autosave; throttle scroll/pointer handlers; consider passive event listeners for scroll and touch.
- **No heavy methods in templates.** Use computeds, precomputed fields and memoization.
- **Shallow by default for big data** you replace (API payloads, tables), \`markRaw\` for SDK instances, frozen objects for read-only reference data.
- **Cap and pause caches:** \`<KeepAlive :max>\`, and stop polling, sockets and animations in \`onDeactivated\`.
- **Break up long tasks** or move them to a Web Worker; show progress for long jobs.
- **Clean up** listeners, timers and subscriptions on unmount (or scope dispose) — leaks are a runtime performance bug that grows over time.
- **Keep component trees shallow where it counts**: rows and cells repeated thousands of times should be cheap.
`,
  },

  mistakes: [
    {
      title: 'A heavy method in the template',
      wrong: { code: `<li v-for="p in sortedAndFiltered()" :key="p.id">{{ p.name }}</li>`, lang: 'vue' },
      right: { code: `<script setup>\nconst visible = computed(() => sortAndFilter(products.value, query.value))\n</script>\n<li v-for="p in visible" :key="p.id">{{ p.name }}</li>`, lang: 'vue' },
      explanation: 'Methods run on every render of the component, triggered by anything. A computed runs only when its inputs change.',
    },
    {
      title: 'Debouncing in the wrong place',
      wrong: { code: `const results = computed(() => heavyFilter(items.value, query.value)) // reads raw query\nwatch(query, debounce(logSearch, 300)) // only the log is debounced`, lang: 'js' },
      right: { code: `const draft = ref('')               // bound to the input\nconst query = ref('')               // updated after a pause\nwatch(draft, debounce((v) => (query.value = v), 300))\nconst results = computed(() => heavyFilter(items.value, query.value))`, lang: 'js' },
      explanation: 'The expensive computed must depend on the debounced value; otherwise it still re-runs on every keystroke.',
    },
    {
      title: 'Forgetting that cached views keep working',
      wrong: { code: `<KeepAlive><component :is="tab" /></KeepAlive>\n<!-- StockTab polls every second... even while you read the News tab -->`, lang: 'vue' },
      right: { code: `// StockTab.vue\nonActivated(startPolling)\nonDeactivated(stopPolling)`, lang: 'js' },
      explanation: 'KeepAlive keeps instances alive. Pause timers, sockets and heavy watchers while they\'re hidden, and cap the cache with `max`.',
    },
    {
      title: '"Yielding" with a microtask',
      wrong: { code: `for (const chunk of chunks) {\n  process(chunk)\n  await Promise.resolve() // input and rendering still can't run\n}`, lang: 'js' },
      right: { code: `for (const chunk of chunks) {\n  process(chunk)\n  await new Promise((r) => setTimeout(r, 0)) // a new task: the browser can respond\n}`, lang: 'js' },
      explanation: 'Microtasks run before the browser gets a chance to handle input or paint. Yield with a macrotask (or `scheduler.yield()` where supported).',
    },
    {
      title: 'A component for every cell',
      wrong: { code: `<tr v-for="row in rows" :key="row.id">\n  <TableCell v-for="col in cols" :key="col" :value="row[col]" />  <!-- rows × cols instances -->\n</tr>`, lang: 'vue' },
      right: { code: `<tr v-for="row in rows" :key="row.id">\n  <td v-for="col in cols" :key="col">{{ format(row[col]) }}</td>\n</tr>`, lang: 'vue' },
      explanation: 'Component instances cost far more than elements. Keep repeated leaf markup as plain elements unless the component earns its cost — and measure.',
    },
  ],

  debugging: [
    {
      symptom: 'Typing in a search box lags on large data.',
      cause: 'The filter runs on every keystroke (and maybe twice per render, as a method).',
      fix: 'Use a computed, debounce the query that feeds it, and precompute search keys. Profile the interaction to confirm.',
    },
    {
      symptom: 'Scrolling or dragging feels janky.',
      cause: 'A handler does layout reads/writes or state updates on every event.',
      fix: 'Throttle the handler (or batch updates with `requestAnimationFrame`), use passive listeners, and avoid reading layout right after writing it.',
    },
    {
      symptom: 'Memory or network activity keeps growing while switching tabs.',
      cause: 'KeepAlive caches every tab and each keeps polling or watching while hidden.',
      fix: 'Set `max`, use `include`, and pause work in `onDeactivated`.',
    },
    {
      symptom: 'The page freezes while processing a big import or report.',
      cause: 'One long synchronous task blocks the main thread.',
      fix: 'Process in chunks and yield between them, show progress, or move the work into a Web Worker.',
    },
    {
      symptom: 'A chart/map library becomes slow or throws inside reactive state.',
      cause: 'Its instance was made deeply reactive (huge object graph, private fields).',
      fix: 'Wrap it with `markRaw()` or keep it in a `shallowRef`; see [debugging reactivity](lesson:debugging-reactivity).',
    },
  ],

  bestPractices: [
    'Measure interactions on realistic devices and data before and after changes.',
    'Debounce bursty inputs (search, autosave); throttle continuous ones (scroll, drag).',
    'Never call expensive methods from templates — use computed.',
    'Keep big replace-only data in `shallowRef`, SDK objects in `markRaw`, reference data frozen.',
    'Cap `<KeepAlive>` with `max` and pause work in `onDeactivated`.',
    'Break long tasks into chunks (yield with a macrotask) or use a Web Worker.',
    'Clean up timers, listeners and subscriptions; avoid needless component layers in repeated markup.',
  ],

  useCases: [
    'Search-as-you-type over thousands of records.',
    'Scroll-linked UI: progress bars, sticky headers, infinite-scroll sentinels.',
    'Tabbed dashboards with live widgets.',
    'Importing or exporting large CSV files in the browser.',
    'Integrating charting, mapping or editor libraries.',
  ],

  whenToUse: {
    use: [
      'Debounce when only the final value matters; throttle when intermediate values matter at a limited rate.',
      '`shallowRef`/`markRaw`/`Object.freeze` for large or foreign data.',
      'Chunking or Web Workers for CPU-heavy jobs that would block input.',
    ],
    avoid: [
      'Debouncing things users expect to be instant (button clicks, toggles).',
      'Shallow state for small objects you mutate in place — it adds `triggerRef` bookkeeping for no gain.',
      'KeepAlive without limits on views with heavy state or background work.',
    ],
  },

  comparison: {
    title: 'Picking a runtime technique',
    headers: ['', 'Problem it solves', 'Main risk', 'Reach for it when'],
    rows: [
      ['debounce', 'bursts of events trigger repeated work', 'feels laggy if the delay is long', 'search, autosave, validation'],
      ['throttle', 'continuous events at high frequency', 'skips intermediate values', 'scroll, drag, pointer, resize'],
      ['computed', 'same derivation repeated every render', 'side effects in getters', 'any derived data shown in templates'],
      ['shallowRef / markRaw / freeze', 'proxy and tracking overhead on big data', 'in-place changes are invisible', 'API payloads, SDK instances, reference data'],
      ['KeepAlive `max` + `onDeactivated`', 're-mount cost vs memory and background work', 'stale or growing caches', 'tabs and views users switch between'],
      ['chunking / Web Worker', 'long tasks block input', 'complexity, data transfer to workers', 'imports, parsing, heavy calculations'],
    ],
  },

  quiz: [
    {
      id: 'runtime-performance-q1',
      type: 'mcq',
      prompt: 'Which pairing is right?',
      options: [
        { text: 'Search-as-you-type → debounce; scroll-position indicator → throttle' },
        { text: 'Search-as-you-type → throttle; scroll-position indicator → debounce', why: 'A debounced scroll indicator would only update after scrolling stops.' },
        { text: 'Both → debounce', why: 'Scroll indicators need regular updates while scrolling — that\'s throttling.' },
        { text: 'Neither — computed handles events', why: 'Computed caches derived values; it doesn\'t rate-limit events.' },
      ],
      answer: 0,
      explanation: 'Debounce when only the final value matters; throttle when you need regular updates during a stream of events.',
    },
    {
      id: 'runtime-performance-q2',
      type: 'output',
      prompt: '`filtered()` is a **method** and the template calls it twice. The user clicks a button that only changes `cartCount` (also displayed) three times. How many times does `filtered()` run during those clicks?',
      code: {
        lang: 'vue',
        code: `<p>{{ filtered().length }} results</p>
<li v-for="p in filtered().slice(0, 20)" :key="p.id">{{ p.name }}</li>
<button @click="cartCount++">Cart ({{ cartCount }})</button>`,
      },
      options: [
        { text: '6' },
        { text: '0', why: 'That would be true for a computed. A method runs on every render.' },
        { text: '3', why: 'Each render calls the method twice — once per template use.' },
        { text: '1', why: 'Methods aren\'t cached at all.' },
      ],
      answer: 0,
      explanation: 'Three re-renders × two calls per render = 6. With a computed it would be 0: neither products nor the query changed.',
    },
    {
      id: 'runtime-performance-q3',
      type: 'bug',
      prompt: 'The chunked import is meant to keep the page responsive, but the UI still freezes until it finishes. Click the line that defeats the purpose.',
      code: {
        lang: 'js',
        code: `async function importRows(rows) {
  for (let i = 0; i < rows.length; i += 500) {
    rows.slice(i, i + 500).forEach(saveRow)
    progress.value = i / rows.length
    await Promise.resolve()
  }
}`,
      },
      answerLine: 5,
      explanation: 'A resolved promise only queues a microtask, which runs before the browser handles input or paints. Yield with `await new Promise((r) => setTimeout(r, 0))` (or `scheduler.yield()` where supported).',
    },
    {
      id: 'runtime-performance-q4',
      type: 'fill',
      prompt: 'Fill the blanks: keep a large, replace-only list shallow, and keep a chart instance out of reactivity.',
      code: {
        lang: 'js',
        code: `const rows = ___(await api.loadRows())
const chart = ___(new ChartLibrary(canvas, options))`,
      },
      answer: [['shallowRef'], ['markRaw']],
      explanation: '`shallowRef` tracks only `.value` replacement; `markRaw` makes Vue never proxy the object.',
    },
    {
      id: 'runtime-performance-q5',
      type: 'mcq',
      prompt: 'A `StockTab` inside `<KeepAlive>` polls the server every second with `setInterval` started in `onMounted`. The user switches to another tab. What happens?',
      options: [
        { text: 'The interval keeps running; the component is cached, not unmounted' },
        { text: 'The interval stops because the tab is hidden', why: 'Nothing stops it: `onUnmounted` doesn\'t run for a deactivated cached component.' },
        { text: 'Vue pauses all timers in cached components', why: 'Vue doesn\'t control your timers. Use onDeactivated / onActivated.' },
        { text: 'The component is destroyed and recreated on return', why: 'That\'s what happens *without* KeepAlive.' },
      ],
      answer: 0,
      explanation: 'Cached components stay alive. Start work in `onActivated` (it also runs on first mount) and stop it in `onDeactivated`.',
    },
    {
      id: 'runtime-performance-q6',
      type: 'output',
      prompt: 'With this throttle (leading call + one trailing call), what does `calls` contain after 300 ms?',
      code: {
        lang: 'js',
        code: `const calls = []
const log = throttle((n) => calls.push(n), 100)

log(1)
log(2)
log(3)
// ...wait 300 ms`,
      },
      options: [
        { text: '[1, 3]' },
        { text: '[1, 2, 3]', why: 'Calls during the wait are collapsed; only the latest is kept for the trailing call.' },
        { text: '[3]', why: 'This throttle runs the first call immediately (leading edge).' },
        { text: '[1]', why: 'The trailing call with the latest arguments runs when the window ends.' },
      ],
      answer: 0,
      explanation: 'The first call runs immediately; 2 and 3 arrive during the 100 ms window, and only the latest (3) runs at the end.',
    },
    {
      id: 'runtime-performance-q7',
      type: 'short',
      prompt: 'Why is `<KeepAlive>` a trade-off rather than a free optimisation?',
      answer: 'It avoids re-creating components (faster switching, preserved state), but every cached instance stays in memory, and cached components remain alive: their watchers, timers and subscriptions keep running and they can still re-render while hidden. Without `max`/`include` and pausing work in `onDeactivated`, memory and background work grow with every view the user visits.',
    },
  ],

  exercises: [
    {
      id: 'throttle-scroll',
      title: 'Throttle a scroll handler',
      difficulty: 'intermediate',
      prompt: `
The reading-progress bar recalculates on **every** scroll event. Implement \`throttle(fn, ms)\` in **timing.js**:

- The **first** call runs immediately.
- Calls during the next \`ms\` milliseconds are collapsed into **one trailing call** with the **latest** arguments when the window ends.
- After a quiet period, the next call runs immediately again.

The app shows \`class="events"\` (scroll events received) and \`class="handled"\` (handler runs).
`,
      files: {
        'timing.js': `// TODO: run fn at most once every ms (leading call + one trailing call)
export function throttle(fn, ms) {
  return fn
}`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import { throttle } from './timing.js'

const events = ref(0)
const handled = ref(0)
const progress = ref(0)

const updateProgress = throttle((el) => {
  handled.value++
  progress.value = el.scrollTop
}, 300)

function onScroll(event) {
  events.value++
  updateProgress(event.target)
}
</script>

<template>
  <div class="article" style="height: 150px; overflow-y: auto" @scroll="onScroll">
    <p v-for="n in 40" :key="n">Paragraph {{ n }} of a long article.</p>
  </div>
  <p class="events">Scroll events: {{ events }}</p>
  <p class="handled">Handled: {{ handled }}</p>
</template>`,
      },
      hints: [
        'Keep a `waiting` flag and the `pendingArgs` of the latest call made during the window.',
        'If not waiting: call `fn` now, set `waiting = true`, and `setTimeout` to end the window after `ms`.',
        'When the window ends: set `waiting = false`; if there are pending args, clear them and call the throttled function again with them (that starts a new window).',
      ],
      solution: {
        explanation: 'The flag drops calls while a window is open but remembers the latest arguments, so the final state is never lost. Calling the throttled function (not `fn`) for the trailing call starts a new window, so continuous scrolling produces a steady rate of updates.',
        files: {
          'timing.js': `export function throttle(fn, ms) {
  let waiting = false
  let pendingArgs = null

  function throttled(...args) {
    if (waiting) {
      pendingArgs = args // remember only the latest call
      return
    }
    fn(...args)
    waiting = true
    setTimeout(() => {
      waiting = false
      if (pendingArgs) {
        const next = pendingArgs
        pendingArgs = null
        throttled(...next) // trailing call, starts a new window
      }
    }, ms)
  }

  return throttled
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { throttle } from './timing.js'

const events = ref(0)
const handled = ref(0)
const progress = ref(0)

const updateProgress = throttle((el) => {
  handled.value++
  progress.value = el.scrollTop
}, 300)

function onScroll(event) {
  events.value++
  updateProgress(event.target)
}
</script>

<template>
  <div class="article" style="height: 150px; overflow-y: auto" @scroll="onScroll">
    <p v-for="n in 40" :key="n">Paragraph {{ n }} of a long article.</p>
  </div>
  <p class="events">Scroll events: {{ events }}</p>
  <p class="handled">Handled: {{ handled }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'leading call, then one trailing call with the latest args',
          code: `const { throttle } = requireModule('timing.js')
const calls = []
const t = throttle((n) => calls.push(n), 100)
t(1); t(2); t(3)
expect(calls).toEqual([1])
await wait(150)
expect(calls).toEqual([1, 3])`,
        },
        {
          name: 'after a quiet period the next call is immediate',
          code: `const { throttle } = requireModule('timing.js')
const calls = []
const t = throttle((n) => calls.push(n), 50)
t('a')
await wait(150)
t('b')
expect(calls).toEqual(['a', 'b'])`,
        },
        {
          name: 'a burst of scroll events is handled at most twice',
          code: `for (let i = 0; i < 20; i++) await trigger('.article', 'scroll')
expect(text('.events')).toBe('Scroll events: 20')
const handled = Number(text('.handled').replace(/\\D/g, ''))
expect(handled).toBeLessThanOrEqual(2)
expect(handled).toBeGreaterThanOrEqual(1)`,
        },
      ],
    },
    {
      id: 'keepalive-pause',
      title: 'Pause polling in a cached tab',
      difficulty: 'advanced',
      prompt: `
The tabs are wrapped in \`<KeepAlive>\`, so **StockTab** keeps its state — but it also keeps **polling** while you're on the News tab.

- While **Stocks** is visible, it polls (every 100 ms).
- While it's hidden (\`class="tab-news"\`), polling must **stop**.
- Coming back (\`class="tab-stock"\`) must **resume** polling and keep the previous \`class="updates"\` count (no reset).
- Change **StockTab.vue** only. \`poller.js\` counts polls.
`,
      files: {
        'App.vue': tabsApp,
        'StockTab.vue': stockTabStart,
        'NewsTab.vue': `<template>
  <section class="news">Today's headlines…</section>
</template>`,
        'poller.js': pollerJs,
      },
      hints: [
        'A cached component isn\'t unmounted when hidden — `onUnmounted` doesn\'t run. Which hooks run when it is hidden and shown?',
        '`onActivated` runs on the first mount and every time it comes back from the cache; `onDeactivated` runs when it is hidden.',
        'Start the interval in `onActivated`, clear it in `onDeactivated` — and keep `onUnmounted` clearing it for when the cache evicts the component.',
      ],
      solution: {
        explanation: 'KeepAlive preserves the instance (so `updates` survives) but you decide what runs while it\'s hidden. `onActivated`/`onDeactivated` bracket the visible periods; `onUnmounted` still matters if the cache drops the instance (for example because of `max`).',
        files: {
          'App.vue': tabsApp,
          'StockTab.vue': `<script setup>
import { ref, onActivated, onDeactivated, onUnmounted } from 'vue'
import { pollStats } from './poller.js'

const updates = ref(0)
let timer = null

function poll() {
  pollStats.count++ // pretend this is a network request
  updates.value++
}

function start() {
  if (!timer) timer = setInterval(poll, 100)
}
function stop() {
  clearInterval(timer)
  timer = null
}

onActivated(start)     // first mount + every return from the cache
onDeactivated(stop)    // hidden, but kept alive
onUnmounted(stop)      // evicted from the cache
</script>

<template>
  <section class="stock">Live prices · updates: <span class="updates">{{ updates }}</span></section>
</template>`,
          'NewsTab.vue': `<template>
  <section class="news">Today's headlines…</section>
</template>`,
          'poller.js': pollerJs,
        },
      },
      tests: [
        { name: 'polls while visible', code: `const { pollStats } = requireModule('poller.js'); await click('.tab-stock'); await wait(350); expect(pollStats.count).toBeGreaterThanOrEqual(2)` },
        { name: 'stops polling while hidden', code: `const { pollStats } = requireModule('poller.js'); await click('.tab-stock'); await wait(150); await click('.tab-news'); const before = pollStats.count; await wait(350); expect(pollStats.count).toBe(before)` },
        { name: 'resumes and keeps its state', code: `const { pollStats } = requireModule('poller.js'); await click('.tab-stock'); await wait(250); await click('.tab-news'); await click('.tab-stock'); const shown = Number(text('.updates')); expect(shown).toBeGreaterThanOrEqual(2); const before = pollStats.count; await wait(250); expect(pollStats.count).toBeGreaterThan(before)` },
      ],
    },
  ],

  interview: [
    {
      id: 'runtime-performance-debounce-vs-throttle',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'What is the difference between debouncing and throttling? Give a use case for each.',
      answer: 'Debouncing delays running a function until events have stopped for a given time — each new event restarts the timer — so it runs once per burst (search-as-you-type, autosave). Throttling runs a function at most once per interval while events keep coming, so it runs at a steady rate (scroll position, drag, pointer move).',
      explanation: 'Debounce = after the burst; throttle = during the stream, rate-limited.',
      whyAsked: 'A very common frontend interview question that also tests practical judgement.',
      mistakes: ['Mixing them up.', 'Not mentioning cleanup of pending timers.', 'Debouncing clicks users expect to be instant.'],
      followUps: ['What are leading and trailing calls?', 'Where would you put the debounce in a Vue search component?'],
      modelAnswer: 'Both limit how often a function runs during a burst of events. Debounce waits until the events stop for some time — every new event resets the timer — so a search box only searches once the user pauses. Throttle lets the function run at most once per interval while events keep coming, which suits scroll or drag handlers that need regular updates. In Vue I debounce the value that feeds an expensive computed or fetch, and I cancel pending timers on unmount.',
    },
    {
      id: 'runtime-performance-method-vs-computed',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'A template calls `{{ total() }}` (a method that sums 5,000 items) in two places. An unrelated counter on the same component changes 10 times. How many times does the summing loop run?',
      options: ['0', '10', '20', '2'],
      correctOption: 2,
      answer: '20 — each of the 10 re-renders calls the method twice. As a `computed`, it would run 0 times for those changes, because its dependencies didn\'t change.',
      explanation: 'Methods in templates run on every render; computeds are cached.',
      whyAsked: 'Checks understanding of caching and render triggers — a frequent source of wasted work.',
      mistakes: ['Answering 10 (forgetting the second call).', 'Thinking Vue caches method results.'],
      followUps: ['When would a method be acceptable in a template?', 'How would you measure it?'],
      modelAnswer: 'Twenty. A method is just a function call in the render function, so each of the ten re-renders runs it, and the template calls it twice. If I make it a computed, it\'s evaluated once and cached until the items change, so unrelated renders cost nothing. Cheap formatting methods are fine in templates; anything that loops over data belongs in a computed.',
    },
    {
      id: 'runtime-performance-keepalive',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A dashboard wraps its tabs in `<KeepAlive>` to make switching instant. Over a long session, memory and network usage keep climbing. What is going on and what would you change?',
      answer: 'Every visited tab stays cached in memory, and cached components stay alive: their timers, sockets and watchers keep running while hidden (and they can still re-render when their reactive data changes). Fixes: cap the cache with `max` (LRU eviction) and/or `include` only tabs worth caching; pause polling, sockets and heavy watchers in `onDeactivated` and resume in `onActivated`; keep heavy data in a store rather than in each tab; and measure memory with heap snapshots.',
      explanation: 'KeepAlive trades memory and background work for instant switching — manage both.',
      whyAsked: 'Probes understanding of component lifecycle under caching and real-world memory issues.',
      mistakes: ['Assuming hidden components are paused automatically.', 'Removing KeepAlive entirely without considering UX.', 'Not knowing about `max`.'],
      followUps: ['What does onActivated do on first mount?', 'How would you verify the memory issue?'],
      modelAnswer: 'KeepAlive doesn\'t unmount tabs, so every tab the user opens stays in memory, and it stays active — timers, sockets and watchers keep running, and it can even re-render when its data changes. I\'d cap the cache with max and include only the tabs where preserved state really matters. Inside cached tabs I\'d start polling in onActivated and stop it in onDeactivated. Then I\'d confirm with heap snapshots and the network panel over a long session.',
    },
    {
      id: 'runtime-performance-markraw-chart',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After moving a chart library instance into `reactive()` state, the page got slower and some chart methods throw errors. Why, and what\'s the fix?',
      answer: 'Reactive state wraps the instance (and, lazily, everything reachable from it) in proxies, adding overhead to every property access and tracking inside effects; internal objects or private class fields can break when accessed through a proxy. Keep the instance raw with `markRaw()` (or a `shallowRef`), and expose only the values the UI needs as refs.',
      explanation: 'Third-party instances are not UI state; keep them out of deep reactivity.',
      whyAsked: 'A common integration mistake with real performance and correctness impact.',
      mistakes: ['Suggesting `toRaw` at every call site.', 'Wrapping the library in a deep watcher.'],
      followUps: ['How do you keep the chart in sync with data changes?', 'What is the difference between markRaw and shallowRef here?'],
      modelAnswer: 'Putting the instance in reactive state makes Vue proxy it and lazily everything inside it, so every access goes through a proxy and reads inside effects are tracked — overhead the chart never needed. Some libraries also break through proxies, for example with private fields. I\'d create the instance with markRaw, or hold it in a shallowRef, and drive it from a watcher on the data I pass in. The UI then only reacts to the few values that matter.',
    },
    {
      id: 'runtime-performance-long-task',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Users import CSV files with 100,000 rows in the browser; the UI freezes for seconds and INP is poor. How would you redesign it?',
      answer: 'Get the work off the critical path: parse in a Web Worker (or stream-parse in chunks, yielding with a macrotask between chunks) and report progress; keep the parsed data in a `shallowRef` (or outside Vue) instead of deep reactive state; render results with pagination or virtual scrolling; debounce any filtering over the data; validate incrementally; and measure with the Performance panel (long tasks) and INP in field data.',
      explanation: 'Long tasks block input; split them, move them, and render only what is visible.',
      whyAsked: 'Combines several runtime techniques in a realistic design question.',
      mistakes: ['Wrapping the result in `reactive()`.', 'Rendering all rows.', 'Using microtasks to "yield".'],
      followUps: ['What data would you send back from the worker?', 'How would you show progress accessibly?'],
      modelAnswer: 'The freeze is one long task on the main thread, so I\'d move parsing into a Web Worker, or at least chunk it and yield with setTimeout between chunks, posting progress to a progress bar. The parsed rows would go into a shallowRef — or stay outside Vue entirely — rather than deep reactive state. For display I\'d paginate or virtualize, and debounce any filters. I\'d verify with the Performance panel that no long tasks remain during the import, and watch INP in production.',
    },
    {
      id: 'runtime-performance-abstraction',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'A data grid renders a `<Cell>` component for each of 50 columns × 1,000 rows. Is that a problem? How would you think about it?',
      answer: 'Potentially: that is 50,000 component instances, each with setup, reactive effects and vnode overhead — component instances cost much more than plain elements. If `<Cell>` only formats a value, render plain `<td>`s with a formatting function, keep one component per row at most, and virtualize rows. Keep components where they add real behaviour (editing, popovers) and measure before and after.',
      explanation: 'Abstractions are multiplied by the number of times they repeat.',
      whyAsked: 'Tests awareness that components have a cost and the judgement not to over-optimise.',
      mistakes: ['Saying components are free.', 'Removing all components everywhere.', 'Not mentioning virtualization.'],
      followUps: ['When is a per-cell component justified?', 'How would you measure the difference?'],
      modelAnswer: 'It can be. Fifty thousand component instances means fifty thousand setups, reactive effects and vnode trees, and component instances are much more expensive than plain DOM nodes. If Cell just formats and displays a value, I\'d render plain td elements with a formatting function and keep components for cells with real behaviour, like inline editing. With that many rows I\'d also virtualize. I\'d measure mount time and update time before and after so the change is justified.',
    },
    {
      id: 'runtime-performance-coding-chunks',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Implement `processInChunks(items, chunkSize, handle)` in **chunks.js**: call `handle(item)` for every item, `chunkSize` items at a time, **yielding to the event loop** (a macrotask) between chunks, and resolve when done. The app processes 10,000 items and shows `class="progress"` as **Processed N / 10000**.',
      starter: {
        files: {
          'chunks.js': `// TODO: process items in chunks, yielding to the event loop between chunks
export async function processInChunks(items, chunkSize, handle) {
  items.forEach(handle) // one long task: blocks input until it's done
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { processInChunks } from './chunks.js'

const items = Array.from({ length: 10000 }, (_, i) => i)
const processed = ref(0)
const done = ref(false)

async function run() {
  processed.value = 0
  done.value = false
  await processInChunks(items, 1000, () => {
    processed.value++
  })
  done.value = true
}
</script>

<template>
  <button class="run" @click="run">Process 10,000 items</button>
  <p class="progress">Processed {{ processed }} / {{ items.length }}</p>
  <p v-if="done" class="done">Done!</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'handles every item, in order',
          code: `const { processInChunks } = requireModule('chunks.js')
const seen = []
await processInChunks([0, 1, 2, 3, 4, 5, 6], 3, (x) => seen.push(x))
expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6])`,
        },
        {
          name: 'yields to the event loop before finishing',
          code: `const { processInChunks } = requireModule('chunks.js')
let timerRan = false
setTimeout(() => { timerRan = true }, 0)
let ranBeforeLast = false
await processInChunks([...Array(10).keys()], 3, (x) => { if (x === 9) ranBeforeLast = timerRan })
expect(ranBeforeLast).toBe(true)`,
        },
        { name: 'the app finishes all 10,000', code: `await click('.run'); await wait(200); expect(text('.progress')).toBe('Processed 10000 / 10000'); expect(exists('.done')).toBe(true)` },
      ],
      hints: [
        'Loop with `for (let i = 0; i < items.length; i += chunkSize)` and handle `items.slice(i, i + chunkSize)`.',
        'Between chunks, wait for a **macrotask**: `await new Promise((resolve) => setTimeout(resolve, 0))`. `await Promise.resolve()` is not enough.',
        'Skip the wait after the last chunk if you like — but the function must still return a promise that resolves after all items are handled.',
      ],
      answer: 'Loop over slices of `chunkSize`, and await a setTimeout-based promise between slices so the browser can handle input and paint.',
      solution: {
        files: {
          'chunks.js': `const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0))

export async function processInChunks(items, chunkSize, handle) {
  for (let i = 0; i < items.length; i += chunkSize) {
    items.slice(i, i + chunkSize).forEach(handle)
    if (i + chunkSize < items.length) await yieldToBrowser()
  }
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { processInChunks } from './chunks.js'

const items = Array.from({ length: 10000 }, (_, i) => i)
const processed = ref(0)
const done = ref(false)

async function run() {
  processed.value = 0
  done.value = false
  await processInChunks(items, 1000, () => {
    processed.value++
  })
  done.value = true
}
</script>

<template>
  <button class="run" @click="run">Process 10,000 items</button>
  <p class="progress">Processed {{ processed }} / {{ items.length }}</p>
  <p v-if="done" class="done">Done!</p>
</template>`,
        },
      },
      explanation: 'Each chunk is a short task; the `setTimeout` between chunks lets the browser handle input and repaint the progress text. (Vue batches the 1,000 `processed++` writes of a chunk into one render.) For work that can\'t be split, a Web Worker is the next step; where supported, `scheduler.yield()` is a purpose-built way to yield.',
      whyAsked: 'Shows the candidate understands the event loop, long tasks and INP — beyond framework APIs.',
      mistakes: ['Yielding with a microtask (`await Promise.resolve()`).', 'Processing everything in one loop.', 'Forgetting to resolve after the last chunk.'],
      followUps: ['How would you support cancellation?', 'When would you choose a Web Worker instead?'],
      modelAnswer: 'I loop over the items in slices of chunkSize and, between slices, await a promise that resolves in a setTimeout — a macrotask — so the browser can process input and paint. A resolved promise wouldn\'t work, because microtasks run before the browser gets control back. Vue batches the progress updates within a chunk, so the bar updates once per chunk. For cancellation I\'d pass an AbortSignal and check it between chunks, and if the per-item work is heavy, I\'d move it into a Web Worker.',
    },
  ],

  takeaways: [
    'Keep the main thread free: do less, do it less often, or do it in smaller pieces elsewhere.',
    'Debounce bursts (search, autosave); throttle streams (scroll, drag).',
    'Templates should read computeds, not call expensive methods — methods run every render.',
    'Big replace-only data → `shallowRef`; SDK instances → `markRaw`; reference data → `Object.freeze`.',
    '`<KeepAlive>` keeps instances alive: cap it with `max` and pause work in `onDeactivated`.',
    'Break long tasks into chunks with macrotask yields, or move them to a Web Worker.',
    'Component instances cost more than elements — avoid needless layers in repeated markup, and measure.',
  ],
}
