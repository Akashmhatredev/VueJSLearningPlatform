// Lesson: Lazy-loaded routes & scroll behavior

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'

createApp(App).use(router).mount('#app')`

const lazyJs = `import { ref } from 'vue'

// SIMULATED lazy loading.
// The sandbox cannot split code into real chunks: every file here is
// already in memory. simulateLazy() wraps a page in a loader that waits
// like a network download would, and records the "download" so you can
// see when it happens. In a real Vite app you would simply write:
//   component: () => import('./GuidePage.vue')
export const downloads = ref([])

export function simulateLazy(name, component, ms = 400) {
  return () => {
    downloads.value.push(name)
    return new Promise((resolve) =>
      setTimeout(() => resolve({ default: component }), ms),
    )
  }
}`

const statusJs = `import { ref } from 'vue'

export const isNavigating = ref(false)

// The last few scroll decisions, newest first.
export const scrollLog = ref([])

export function logScroll(path, position) {
  const entry = path + '  →  ' + JSON.stringify(position)
  scrollLog.value = [entry, ...scrollLog.value].slice(0, 4)
}`

const routerJs = `import { createRouter, createMemoryHistory } from 'vue-router'
import { simulateLazy } from './lazy.js'
import { isNavigating, logScroll } from './status.js'
import HomePage from './HomePage.vue'
import GuidePage from './GuidePage.vue'
import ApiPage from './ApiPage.vue'
import FaqPage from './FaqPage.vue'

// Decide where the page should scroll after a navigation.
function chooseScroll(to, from, savedPosition) {
  return { top: 0 }
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    // The first screen: keep it in the main bundle.
    { path: '/', name: 'home', component: HomePage },
    // Real app: component: () => import('./GuidePage.vue')
    { path: '/guide', name: 'guide', component: simulateLazy('guide', GuidePage) },
    { path: '/api', name: 'api', component: simulateLazy('api', ApiPage) },
    { path: '/faq', name: 'faq', component: FaqPage },
  ],
  scrollBehavior(to, from, savedPosition) {
    const position = chooseScroll(to, from, savedPosition)
    logScroll(to.fullPath, position)
    return position
  },
})

export default router`

const appVue = `<script setup>
import { downloads } from './lazy.js'
import { isNavigating, scrollLog } from './status.js'
</script>

<template>
  <div v-if="isNavigating" class="loading-bar">Loading page…</div>

  <nav class="nav">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/guide" class="to-guide">Guide</RouterLink>
    <RouterLink to="/api" class="to-api">API</RouterLink>
    <RouterLink to="/faq" class="to-faq">FAQ</RouterLink>
    <RouterLink to="/faq#upgrade" class="to-upgrade">FAQ › Upgrading</RouterLink>
  </nav>

  <aside class="panel">
    <p>Chunks downloaded: <strong class="downloads">{{ downloads.length ? downloads.join(', ') : 'none yet' }}</strong></p>
    <p>Scroll decisions (newest first):</p>
    <ol class="scroll-log">
      <li v-for="(line, i) in scrollLog" :key="i">{{ line }}</li>
    </ol>
  </aside>

  <main class="page">
    <RouterView />
  </main>
</template>

<style scoped>
.loading-bar { position: sticky; top: 0; background: #d7ff3a; padding: 4px 8px; font-weight: bold; }
.nav { display: flex; gap: 12px; flex-wrap: wrap; margin: 8px 0; }
.nav a.router-link-exact-active { font-weight: bold; text-decoration: underline; }
.panel { font-family: monospace; font-size: 13px; background: #f4f1e8; padding: 8px; }
.page { border: 2px solid #222; padding: 12px; margin-top: 8px; }
</style>`

const homeVue = `<template>
  <h2>Docs home</h2>
  <p>This page is part of the main bundle — it is the first thing everyone sees.</p>
  <p>Open <strong>Guide</strong> and <strong>API</strong> and watch "Chunks downloaded".</p>
</template>`

const guideVue = `<template>
  <h2>Guide</h2>
  <p>A long tutorial page. In a real app its code arrives in its own chunk.</p>
</template>`

const apiVue = `<template>
  <h2>API reference</h2>
  <p>Big tables of functions — another good candidate for its own chunk.</p>
</template>`

const faqVue = `<template>
  <h2>Frequently asked questions</h2>
  <section id="install" class="faq-section">
    <h3>How do I install it?</h3>
    <p>Run your package manager's install command.</p>
  </section>
  <section id="upgrade" class="faq-section">
    <h3>How do I upgrade?</h3>
    <p>Read the migration notes first, then bump the version.</p>
  </section>
</template>

<style scoped>
.faq-section { min-height: 360px; border-top: 1px dashed #999; }
</style>`

const baseFiles = {
  'main.js': mainJs,
  'router.js': routerJs,
  'lazy.js': lazyJs,
  'status.js': statusJs,
  'App.vue': appVue,
  'HomePage.vue': homeVue,
  'GuidePage.vue': guideVue,
  'ApiPage.vue': apiVue,
  'FaqPage.vue': faqVue,
}

const routerSolved = `import { createRouter, createMemoryHistory } from 'vue-router'
import { simulateLazy } from './lazy.js'
import { isNavigating, logScroll } from './status.js'
import HomePage from './HomePage.vue'
import GuidePage from './GuidePage.vue'
import ApiPage from './ApiPage.vue'
import FaqPage from './FaqPage.vue'

// Decide where the page should scroll after a navigation.
function chooseScroll(to, from, savedPosition) {
  if (savedPosition) return savedPosition                 // Back / Forward
  if (to.hash) return { el: to.hash, behavior: 'smooth' } // #anchor links
  return { top: 0 }                                       // new page
}

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/guide', name: 'guide', component: simulateLazy('guide', GuidePage) },
    { path: '/api', name: 'api', component: simulateLazy('api', ApiPage) },
    { path: '/faq', name: 'faq', component: simulateLazy('faq', FaqPage) },
  ],
  scrollBehavior(to, from, savedPosition) {
    const position = chooseScroll(to, from, savedPosition)
    logScroll(to.fullPath, position)
    return position
  },
})

router.beforeEach(() => {
  isNavigating.value = true
})
router.afterEach(() => {
  isNavigating.value = false
})
// afterEach does not run when a navigation throws (e.g. a chunk fails)
router.onError(() => {
  isNavigating.value = false
})

export default router`

// ---------- exercise 1: lazy admin section
const ex1Status = `import { ref } from 'vue'

export const isNavigating = ref(false)`

const ex1RouterStarter = `import { createRouter, createMemoryHistory } from 'vue-router'
import { simulateLazy } from './lazy.js'
import { isNavigating } from './status.js'
import HomePage from './HomePage.vue'
import ReportsPage from './ReportsPage.vue'
import SettingsPage from './SettingsPage.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/reports', component: ReportsPage },
    { path: '/settings', component: SettingsPage },
    // A page whose chunk always fails to load — leave it as it is.
    { path: '/broken', component: () => Promise.reject(new Error('Chunk failed to load')) },
  ],
})

// TODO: lazy-load /reports and /settings, and drive isNavigating

export default router`

const ex1RouterSolution = `import { createRouter, createMemoryHistory } from 'vue-router'
import { simulateLazy } from './lazy.js'
import { isNavigating } from './status.js'
import HomePage from './HomePage.vue'
import ReportsPage from './ReportsPage.vue'
import SettingsPage from './SettingsPage.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomePage },
    // real app: () => import('./ReportsPage.vue')
    { path: '/reports', component: simulateLazy('reports', ReportsPage) },
    { path: '/settings', component: simulateLazy('settings', SettingsPage) },
    { path: '/broken', component: () => Promise.reject(new Error('Chunk failed to load')) },
  ],
})

router.beforeEach(() => {
  isNavigating.value = true
})
router.afterEach(() => {
  isNavigating.value = false
})
router.onError(() => {
  isNavigating.value = false // afterEach is skipped when a navigation errors
})

export default router`

const ex1Shared = {
  'main.js': mainJs,
  'status.js': ex1Status,
  'lazy.js': lazyJs.replace("('./GuidePage.vue')", "('./ReportsPage.vue')").replace('ms = 400', 'ms = 300'),
  'App.vue': `<script setup>
import { downloads } from './lazy.js'
import { isNavigating } from './status.js'
</script>

<template>
  <nav>
    <RouterLink to="/" class="to-home">Home</RouterLink> ·
    <RouterLink to="/reports" class="to-reports">Reports</RouterLink> ·
    <RouterLink to="/settings" class="to-settings">Settings</RouterLink>
  </nav>
  <p v-if="isNavigating" class="page-loading">Loading…</p>
  <p>Downloaded: <span class="downloads">{{ downloads.join(', ') || 'none' }}</span></p>
  <RouterView />
</template>`,
  'HomePage.vue': `<template><h2>Home</h2></template>`,
  'ReportsPage.vue': `<template><h2>Reports</h2></template>`,
  'SettingsPage.vue': `<template><h2>Settings</h2></template>`,
}

// ---------- exercise 2: scroll rules
const ex2RouterStarter = `import { createRouter, createMemoryHistory } from 'vue-router'

const Page = (label) => ({ render: () => label })

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Page('home') },
    { path: '/products', component: Page('products') },
    { path: '/docs', component: Page('docs') },
  ],
  scrollBehavior(to, from, savedPosition) {
    // TODO: implement the four rules
    return { top: 0 }
  },
})

export default router`

const ex2RouterSolution = `import { createRouter, createMemoryHistory } from 'vue-router'

const Page = (label) => ({ render: () => label })
const HEADER_HEIGHT = 64 // our fixed header covers the top 64px

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Page('home') },
    { path: '/products', component: Page('products') },
    { path: '/docs', component: Page('docs') },
  ],
  scrollBehavior(to, from, savedPosition) {
    // 1. Back/Forward: go back to where the user was
    if (savedPosition) return savedPosition
    // 2. #anchor: scroll to the element, below the fixed header
    if (to.hash) return { el: to.hash, top: HEADER_HEIGHT, behavior: 'smooth' }
    // 3. Same page, only the query changed (filters, pagination): stay put
    if (to.path === from.path) return false
    // 4. A new page: start at the top
    return { top: 0 }
  },
})

export default router`

const ex2Shared = {
  'main.js': mainJs,
  'App.vue': `<template>
  <RouterView />
</template>`,
}

// ---------- interview coding: chunk error banner with retry
const flakyJs = `// Simulates a chunk that fails to download the FIRST time
// (e.g. a flaky network), then works.
let attempts = 0

export function flakyLoader(component) {
  return () =>
    new Promise((resolve, reject) => {
      setTimeout(() => {
        attempts++
        if (attempts === 1) reject(new Error('Failed to fetch dynamically imported module'))
        else resolve({ default: component })
      }, 100)
    })
}`

const codingRouterStarter = `import { createRouter, createMemoryHistory } from 'vue-router'
import { ref } from 'vue'
import { flakyLoader } from './flaky.js'

const Home = { render: () => 'Home page' }
const Reports = { render: () => 'Reports page' }

// TODO: fill this when a navigation fails to load: { message, target }
export const loadError = ref(null)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/reports', component: flakyLoader(Reports) },
  ],
})

export default router`

const codingRouterSolution = `import { createRouter, createMemoryHistory } from 'vue-router'
import { ref } from 'vue'
import { flakyLoader } from './flaky.js'

const Home = { render: () => 'Home page' }
const Reports = { render: () => 'Reports page' }

export const loadError = ref(null)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/reports', component: flakyLoader(Reports) },
  ],
})

// Errors thrown during navigation (including a rejected lazy loader)
// reach onError with the target location.
router.onError((error, to) => {
  loadError.value = { message: error.message, target: to.fullPath }
})

export default router`

const codingAppStarter = `<script setup>
import { useRouter } from 'vue-router'
import { loadError } from './router.js'

const router = useRouter()
</script>

<template>
  <nav>
    <RouterLink to="/" class="to-home">Home</RouterLink> ·
    <RouterLink to="/reports" class="to-reports">Reports</RouterLink>
  </nav>
  <!-- TODO: .route-error banner with a .retry button -->
  <RouterView />
</template>`

const codingAppSolution = `<script setup>
import { useRouter } from 'vue-router'
import { loadError } from './router.js'

const router = useRouter()

function retry() {
  const target = loadError.value.target
  loadError.value = null
  router.push(target) // the loader runs again: failed loads are not cached
}
</script>

<template>
  <nav>
    <RouterLink to="/" class="to-home">Home</RouterLink> ·
    <RouterLink to="/reports" class="to-reports">Reports</RouterLink>
  </nav>
  <div v-if="loadError" class="route-error" role="alert">
    Could not load {{ loadError.target }}.
    <button class="retry" @click="retry">Try again</button>
  </div>
  <RouterView />
</template>`

const codingShared = { 'main.js': mainJs, 'flaky.js': flakyJs }

export default {
  id: 'lazy-routes-scroll',
  title: 'Lazy-loaded routes & scroll behavior',
  summary: 'Download each page\'s code only when someone visits it, show progress while it loads, recover when it fails, and control where the page scrolls after every navigation.',
  difficulty: 'intermediate',
  minutes: 30,
  prerequisites: ['router-basics', 'navigation-guards'],
  related: ['router-in-practice', 'bundle-optimization', 'async-components', 'es-modules', 'error-handling'],
  tags: ['vue router', 'lazy loading', 'code splitting', 'dynamic import', 'chunks', 'scrollBehavior', 'savedPosition', 'loading indicator', 'onError'],
  apis: [
    { name: 'component: () => import(\'./X.vue\')', summary: 'A lazy route component: a function returning a Promise of the component, fetched the first time the route is entered and cached.' },
    { name: 'scrollBehavior(to, from, savedPosition)', summary: 'Router option that returns where to scroll after a navigation: `{ top, left }`, `{ el }`, `savedPosition`, `false`, or a Promise of one.' },
    { name: 'router.onError()', summary: 'Registers a handler for errors thrown during navigation, including failed lazy component loads.' },
    { name: 'import()', summary: 'JavaScript dynamic import: loads a module on demand and returns a Promise of it. Bundlers turn it into a separate chunk.' },
  ],
  docs: [
    { label: 'Vue Router — Lazy Loading Routes', url: 'https://router.vuejs.org/guide/advanced/lazy-loading.html' },
    { label: 'Vue Router — Scroll Behavior', url: 'https://router.vuejs.org/guide/advanced/scroll-behavior.html' },
    { label: 'Vite — Load error handling (vite:preloadError)', url: 'https://vite.dev/guide/build#load-error-handling' },
    { label: 'MDN — import()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import' },
  ],

  intro: `
A *lazy-loaded route* is a page whose code isn't downloaded until someone actually visits it. Instead of giving the router a component, you give it a function that *fetches* the component: \`component: () => import('./AdminPage.vue')\`.

*Scroll behavior* is the other half of "feeling like a real website": when you open a new page you expect to start at the top, when you press Back you expect to land where you were, and when you click a \`#section\` link you expect to jump to that section. Single-page apps have to do that on purpose — this lesson shows how.
`,

  why: `
Without lazy loading, a bundler puts **every page of your app into one JavaScript file**. A visitor who only wants your home page still downloads the admin dashboard, the settings screens, the charts library used on one report… and the browser has to parse all of it before your app starts.

Lazy routes let the bundler cut the app into *chunks* — roughly one per lazy page — so the first visit downloads only what the first screen needs. Other chunks arrive the first time they're needed.

Scrolling has a similar "it just works in normal websites" problem. In a classic multi-page site the browser handles scroll position for you. In a single-page app the router swaps components inside the same document, so without help you can end up halfway down a brand-new page, or at the top of a long list after pressing Back. \`scrollBehavior\` gives you one function that decides the scroll position for every navigation.
`,

  eli15: `
Imagine a huge restaurant menu with 200 dishes. A smart restaurant doesn't cook all 200 dishes when you walk in, just in case you order one. It cooks your dish **when you order it**.

A lazy route is that: the page's code is "cooked" (downloaded) only when someone asks for that page. The first dish takes a moment; after that it's ready to serve instantly, because the router keeps it.

While it's cooking, a good waiter says "coming right up" — that's your **loading indicator**. And if the kitchen burns the dish, the waiter tells you and offers to try again — that's **error handling** with \`router.onError()\`.

Scroll behavior is the bookmark in a book: open a new chapter and you start at the top; go back to the previous chapter and your bookmark takes you to the exact line you left.
`,

  analogy: {
    title: 'Cooked to order',
    body: `
A restaurant keeps a few popular dishes ready for everyone who walks in (your home page in the main bundle). Everything else is made to order: the first person who orders the curry waits a little while it's prepared, and after that the kitchen keeps a pot warm so the next order is instant.

The waiter tells you when food is on its way, and comes back honestly if the kitchen runs out. And when you come back to your table after a phone call, your plate and your napkin are exactly where you left them — that's \`savedPosition\`.
`,
    mapping: [
      ['the dishes kept ready for everyone', 'the main bundle (eagerly imported routes like Home)'],
      ['a dish cooked to order', 'a lazy route: `() => import(\'./CurryPage.vue\')`'],
      ['the warm pot after the first order', 'the router caching the resolved component'],
      ['"coming right up!"', 'a loading indicator driven by `beforeEach` / `afterEach`'],
      ['"sorry, the kitchen burned it — try again?"', '`router.onError()` + a retry'],
      ['your table exactly as you left it', '`savedPosition` on Back / Forward'],
    ],
  },

  visual: {
    type: 'router',
    props: { preset: 'lazy' },
    title: 'A lazy route being fetched',
    caption: 'Navigate to a lazy page: the guards run first, then the page\'s code is fetched, then it renders. Visit it again and the fetch step is skipped — the component is cached.',
    alt: 'An interactive router diagram. Choosing a URL for a lazy route shows route matching, the guards, then a "fetch component" step with a progress state, then rendering. A second visit to the same route skips the fetch step and renders immediately.',
  },

  syntax: [
    `
#### Lazy route components

Replace the static import with a function that returns \`import()\`:
`,
    {
      code: `// eager: AdminPage is in the main bundle
import AdminPage from './views/AdminPage.vue'
const routes = [{ path: '/admin', component: AdminPage }]

// lazy: AdminPage gets its own chunk, fetched on first visit
const routes = [
  { path: '/admin', component: () => import('./views/AdminPage.vue') },
]`,
      lang: 'js',
      title: 'router.js — real app (static example)',
      static: true,
    },
    `
- \`import()\` (with parentheses) is JavaScript's **dynamic import**: it returns a Promise that resolves to the module. Bundlers such as Vite see it and put that module — plus anything only it imports — into a separate file (a *chunk*).
- The router calls your function **the first time the route is entered**, after the earlier guards allowed the navigation, waits for the Promise, then **caches** the result. Later visits don't call it again.
- \`components\` (named views) accepts lazy functions too, and you can lazy-load child routes the same way.
- **Don't** wrap route components in \`defineAsyncComponent()\`. Route components are plain lazy functions; \`defineAsyncComponent\` is for lazy components *inside* templates. See [async components](lesson:async-components).
`,
    {
      callout: 'note',
      title: 'In this sandbox, lazy loading is simulated',
      text: 'The playground can\'t split code into real chunks, and `() => import()` isn\'t available here. The examples use `simulateLazy(name, Component)`, which returns a loader like `() => new Promise(resolve => setTimeout(() => resolve({ default: Component }), 400))` — the same shape `import()` produces, with an artificial delay so you can see the "download".',
    },
    `
#### Grouping pages into one chunk

Sometimes several small routes belong together (e.g. all user-settings pages). How you name or group chunks is **bundler-specific**: webpack uses "magic comments" like \`/* webpackChunkName: "settings" */\`; Vite exposes its bundler's chunking options in the build config (check the docs for your Vite version). Router code doesn't change either way.

#### A loading indicator

The router has no built-in spinner. Drive your own from global hooks — and remember that \`afterEach\` is **not** called when a navigation *throws* (for example a failed chunk), so reset it in \`onError\` too:
`,
    {
      code: `const isNavigating = ref(false)

router.beforeEach(() => { isNavigating.value = true })
router.afterEach(() => { isNavigating.value = false })   // success or failure
router.onError(() => { isNavigating.value = false })     // thrown errors`,
      lang: 'js',
      title: 'loading state from guards',
    },
    `
#### Scroll behavior

Pass a \`scrollBehavior\` function to \`createRouter\`. It runs after each navigation and returns where to scroll:
`,
    {
      code: `const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition          // Back/Forward: restore
    if (to.hash) return { el: to.hash, top: 64, behavior: 'smooth' } // #anchor, 64px below a fixed header
    return { top: 0 }                                // new page: top
  },
})`,
      lang: 'js',
      title: 'the common recipe',
    },
    `
Return values:

- \`{ top, left }\` — scroll to coordinates.
- \`{ el: '#id' }\` (a CSS selector or an element) — scroll to an element; \`top\`/\`left\` then act as an **offset** (\`top: 64\` stops 64px above the element, handy for fixed headers). Add \`behavior: 'smooth'\` for smooth scrolling where the browser supports it.
- \`savedPosition\` — only set on **Back/Forward** (popstate) navigations; \`null\` otherwise.
- \`false\` or \`{}\` — don't scroll at all.
- A **Promise** of any of these — scroll later, e.g. after a page transition finishes.
`,
    {
      callout: 'version',
      title: 'scrollBehavior and newer Vue Router releases',
      text: '`scrollBehavior` is the long-standing, documented option and still works in Vue Router 5.4, the version this platform runs. In that release its TypeScript type is marked deprecated in favour of an **experimental** `ScrollRestoration` / `useScrollRestoration()` API in `vue-router/experimental`. Because the replacement is experimental, this lesson teaches `scrollBehavior`; check the [Router docs](https://router.vuejs.org/guide/advanced/scroll-behavior.html) for the current recommendation before migrating.',
    },
  ],

  walkthrough: {
    title: 'router.js',
    lang: 'js',
    code: routerJs,
    intro: 'The playground\'s router. Notice which routes are eager, which are (simulated) lazy, and where scroll decisions are made.',
    steps: [
      { lines: [2, 3], text: '`simulateLazy` stands in for `() => import(...)` (not available in the sandbox). `isNavigating` is a ref the experiments will use for a loading bar.' },
      { lines: [4, 7], text: 'All four pages are imported up front **because this is a sandbox**. In a real app, the lazy pages would *not* be imported at the top — `import()` inside the route would fetch them.' },
      { lines: [9, 12], text: '`chooseScroll()` is where you decide the scroll position. Right now every navigation scrolls to the top — even Back and `#anchor` links. The experiments fix that.' },
      { lines: [17, 18], text: 'Home stays **eager**: it is the first screen, so lazy-loading it would only add a round trip before anything appears.' },
      { lines: [19, 21], text: 'Guide and API are lazy: their loader runs only when the route is first entered, and the result is cached. Watch "Chunks downloaded" in the preview.' },
      { lines: [22], text: 'FAQ is still eager. Experiment 1 makes it lazy too.' },
      { lines: [24, 28], text: '`scrollBehavior` runs after every navigation. It logs the decision so you can see it, then returns it to the router, which performs the scroll.' },
    ],
  },

  playground: {
    title: 'Docs site with lazy pages',
    objective: 'Watch chunks "download" on first visit only, add a loading bar, make the FAQ lazy, and teach the router where to scroll.',
    files: baseFiles,
    expected: 'A nav bar and a panel showing **Chunks downloaded: none yet**. Clicking **Guide** waits a moment (simulated download), then shows the page; the panel now lists `guide`. Click Guide again later: no new download. The scroll log shows `{"top":0}` for every navigation — even for **FAQ › Upgrading**, which should jump to its section.',
    experiments: [
      {
        id: 'lazy-faq',
        task: 'The FAQ page is still in the "main bundle". Make it lazy the same way as Guide and API, with the chunk name `faq`.',
        hint: 'In `router.js`, replace `component: FaqPage` with `component: simulateLazy(\'faq\', FaqPage)`. In a real app this would be `() => import(\'./FaqPage.vue\')`.',
        tests: [
          {
            name: 'the FAQ chunk is downloaded on first visit',
            code: `expect(text('.downloads')).not.toContain('faq')
await click('.to-faq')
await wait(500)
expect(text('.downloads')).toContain('faq')
expect(text()).toContain('Frequently asked questions')`,
          },
        ],
        explain: 'Nothing about the page changed — only *when* its code arrives. That is the beauty of route-level splitting: it is a one-line change per route and invisible to the page component.',
      },
      {
        id: 'loading-bar',
        task: 'Clicking a lazy page that hasn\'t loaded yet feels frozen for a moment. Use `router.beforeEach` and `router.afterEach` to set `isNavigating` (imported from `status.js`) so the **Loading page…** bar shows while a navigation is pending.',
        hint: 'After creating the router: `router.beforeEach(() => { isNavigating.value = true })` and `router.afterEach(() => { isNavigating.value = false })`. Bonus: also reset it in `router.onError(...)`.',
        tests: [
          {
            name: 'the loading bar shows during a slow navigation and hides afterwards',
            code: `await click('.to-guide')
expect(exists('.loading-bar')).toBe(true)
await wait(500)
expect(exists('.loading-bar')).toBe(false)
expect(text()).toContain('Guide')`,
          },
        ],
        explain: '`beforeEach` runs at the start of every navigation and `afterEach` at the end — success or failure — so together they bracket the download. One gap: when a navigation *throws* (a chunk fails to load), `afterEach` is skipped, so production code also resets the flag in `router.onError()`.',
      },
      {
        id: 'hash-scroll',
        task: 'Click **FAQ › Upgrading** (`/faq#upgrade`): the log shows `{"top":0}`, so the page starts at the top instead of the Upgrading section. Change `chooseScroll()` so that when the target has a hash it returns `{ el: to.hash, behavior: \'smooth\' }`.',
        hint: '`to.hash` is `\'#upgrade\'` for that link (an empty string when there is none). Put the check before `return { top: 0 }`.',
        tests: [
          {
            name: 'a #hash target scrolls to that element',
            code: `const router = requireModule('router.js').default
const position = router.options.scrollBehavior(router.resolve('/faq#upgrade'), router.currentRoute.value, null)
expect(position.el).toBe('#upgrade')`,
          },
          {
            name: 'a normal page still scrolls to the top',
            code: `const router = requireModule('router.js').default
const position = router.options.scrollBehavior(router.resolve('/guide'), router.currentRoute.value, null)
expect(position.top).toBe(0)`,
          },
        ],
        explain: 'The router looks up the element with `document.querySelector(to.hash)` and scrolls to it. If the element isn\'t in the DOM yet (say, the page loads its content asynchronously), you would return a Promise that resolves once the content is there.',
      },
      {
        id: 'saved-position',
        task: 'Make Back and Forward restore the previous scroll position: if `savedPosition` is set, return it before any other rule.',
        hint: 'First line of `chooseScroll()`: `if (savedPosition) return savedPosition`. The sandbox uses memory history, so to try it the test calls `scrollBehavior` directly with a fake saved position.',
        tests: [
          {
            name: 'a saved position is restored',
            code: `const router = requireModule('router.js').default
const saved = { left: 0, top: 640 }
const position = router.options.scrollBehavior(router.resolve('/guide'), router.currentRoute.value, saved)
expect(position.top).toBe(640)
expect(position.left).toBe(0)`,
          },
        ],
        explain: 'The browser only provides `savedPosition` for popstate navigations (Back/Forward) with web or hash history; for normal `push` navigations it is `null`. Checking it first gives users the "it remembered where I was" behaviour of a classic website.',
      },
    ],
    variants: [
      { id: 'solved', label: 'All experiments solved', files: { ...baseFiles, 'router.js': routerSolved } },
    ],
  },

  animation: {
    type: 'performance',
    props: { demo: 'lazy-routes' },
    title: 'Eager vs lazy routes, measured',
    caption: 'A live demo in your own browser: compare what has to load up front when every page is eager with what loads when pages are split and fetched on demand.',
    alt: 'A measured demo comparing an app whose routes are all eagerly bundled with one whose routes are lazy-loaded. It shows which page chunks load at startup versus on first navigation, with timings measured live in the learner\'s browser.',
  },

  internals: {
    beginner: `
When you write \`() => import('./AdminPage.vue')\`, the bundler notices the \`import()\` and puts \`AdminPage.vue\` in its own file. Your main file now contains just a tiny function that knows how to fetch that file.

When someone navigates to \`/admin\`, the router sees that the route's component is a function, not a component, calls it, waits for the download, and then shows the page. It writes the downloaded component back into the route, so the next visit is instant.
`,
    technical: [
      `
**Where loading happens in the navigation.** Lazy components are resolved in the middle of the guard pipeline: after \`beforeRouteLeave\`, \`beforeEach\`, \`beforeRouteUpdate\` and \`beforeEnter\`, but before \`beforeRouteEnter\` and \`beforeResolve\`. Two consequences:

- if \`beforeEach\` redirects a signed-out user, the admin chunk is **never downloaded**;
- \`beforeResolve\` is the earliest global guard that sees fully loaded components.
`,
      {
        code: `// A simplified model of what the router does with lazy components
async function resolveLazyComponents(to) {
  for (const record of to.matched) {
    for (const [name, comp] of Object.entries(record.components)) {
      if (typeof comp === 'function' && !isComponent(comp)) {
        const mod = await comp()                 // e.g. import('./AdminPage.vue')
        record.components[name] = mod.default ?? mod // cache: next visit skips this
      }
    }
  }
}`,
        lang: 'js',
        title: 'mental model — not the real source',
      },
      `
**Caching & failures.** Only a *successful* load is written back. If the Promise rejects, the router aborts the navigation with that error: \`router.onError\` handlers run, \`router.push()\` rejects, and \`afterEach\` is **not** called. The next attempt calls your loader again — whether the browser then re-fetches the file can depend on the browser and the cause of the failure.

**Bundler side.** \`import()\` is standard JavaScript; the splitting is done by the bundler. In production builds Vite also preloads a chunk's own dependencies when the chunk is requested, so they download in parallel instead of one after another.

**Scrolling.** After a navigation is confirmed and the DOM has updated (the router waits a tick), it calls \`scrollBehavior(to, from, savedPosition)\`. For \`el\`, it finds the element and computes its position minus your \`top\`/\`left\` offset; then it calls \`window.scrollTo()\`. With \`createWebHistory()\` the router stores scroll positions per history entry so it can hand you \`savedPosition\` on Back/Forward. When \`scrollBehavior\` is set, the router also switches the browser's own \`history.scrollRestoration\` to \`'manual'\` so the two don't fight.
`,
    ],
    production: `
- **Lazy-load by default for secondary pages**, keep the first screen (home, login, landing) eager. Lazy-loading a page everyone sees first just adds a request before anything renders.
- **Measure, don't guess.** Use your bundler's build output or a bundle visualizer to see what each chunk contains; see [code splitting & tree shaking](lesson:bundle-optimization).
- **Plan for chunk-load failures.** After a new deploy, users with an old tab open may request chunk files that no longer exist on the server. Handle it in \`router.onError\` (and/or Vite's \`vite:preloadError\` window event): show a friendly message, or reload the page to fetch the new build — guard against reload loops, e.g. by remembering in \`sessionStorage\` that you already tried. Keeping old chunk files available for a while after deploying also helps.
- **Show progress without flicker.** A loading bar driven by \`beforeEach\`/\`afterEach\`/\`onError\` is enough; many apps only show it if the navigation takes longer than a short delay.
- **Prefetch likely next pages** if it matters: calling the same loader early (e.g. on link hover) starts the download, and the module system returns the same module when the router asks later.
- **Scroll + async content:** if a page renders its content after data arrives, scrolling to \`#anchor\` immediately can miss. Return a Promise from \`scrollBehavior\` that resolves after the content (or a transition) is ready, or scroll from the page once data loads.
- **Accessibility:** after a navigation, also move focus (e.g. to the page heading) so keyboard and screen-reader users know the page changed — scrolling alone doesn't do that.
`,
  },

  mistakes: [
    {
      title: 'Wrapping a route component in defineAsyncComponent',
      wrong: {
        code: `import { defineAsyncComponent } from 'vue'
const routes = [
  { path: '/admin', component: defineAsyncComponent(() => import('./AdminPage.vue')) },
]`,
        lang: 'js',
      },
      right: {
        code: `const routes = [
  { path: '/admin', component: () => import('./AdminPage.vue') },
]`,
        lang: 'js',
      },
      explanation: 'The router has its own lazy-loading built in: it waits for the Promise *during* the navigation (so guards and loading state line up) and caches the result. `defineAsyncComponent` is for lazy components inside templates; the Router docs explicitly say not to use async components as route components.',
    },
    {
      title: 'Importing the page at the top of the file anyway',
      wrong: {
        code: `import AdminPage from './views/AdminPage.vue'   // static import…
const routes = [
  { path: '/admin', component: () => import('./views/AdminPage.vue') },
]`,
        lang: 'js',
      },
      right: {
        code: `const routes = [
  { path: '/admin', component: () => import('./views/AdminPage.vue') },
]`,
        lang: 'js',
      },
      explanation: 'If any eagerly loaded module statically imports the page, it is already in the main bundle and the dynamic import can\'t split it out (Vite warns about this case). Only the route\'s `import()` should reference the page.',
    },
    {
      title: 'A loading indicator that gets stuck after an error',
      wrong: {
        code: `router.beforeEach(() => { loading.value = true })
router.afterEach(() => { loading.value = false })`,
        lang: 'js',
      },
      right: {
        code: `router.beforeEach(() => { loading.value = true })
router.afterEach(() => { loading.value = false })
router.onError(() => { loading.value = false })`,
        lang: 'js',
      },
      explanation: '`afterEach` runs for successful *and failed* navigations (cancelled, duplicated…), but not when a navigation throws — e.g. a chunk that fails to download. Reset the state in `onError` too.',
    },
    {
      title: 'Ignoring savedPosition',
      wrong: {
        code: `scrollBehavior() {
  return { top: 0 }   // Back button also jumps to the top of the list
}`,
        lang: 'js',
      },
      right: {
        code: `scrollBehavior(to, from, savedPosition) {
  return savedPosition ?? { top: 0 }
}`,
        lang: 'js',
      },
      explanation: 'Users expect Back to return them to where they were on a long list. `savedPosition` carries that position for Back/Forward navigations; return it first.',
    },
  ],

  debugging: [
    {
      symptom: 'After a deploy, some users get "Failed to fetch dynamically imported module" (wording varies by browser) when they navigate.',
      cause: 'Their tab still runs the old build, which asks for chunk files that the new deploy replaced.',
      fix: 'Handle it in `router.onError` / `vite:preloadError`: reload once to pick up the new build (protect against reload loops), or show a "new version available" message. Keeping previous chunks on the server for a while reduces how often it happens.',
    },
    {
      symptom: 'The page "freezes" for a moment after clicking a link, then the new page appears.',
      cause: 'A lazy route is downloading its chunk and the UI shows no progress.',
      fix: 'Show a loading indicator driven by `beforeEach` / `afterEach` / `onError`.',
    },
    {
      symptom: 'The build output shows the page you lazy-loaded inside the main chunk.',
      cause: 'Something that is loaded eagerly also imports that page statically (often a barrel `index.js` that re-exports every view).',
      fix: 'Remove the static import path; reference the page only through `() => import()` in the route.',
    },
    {
      symptom: '`#anchor` links land at the top or in the wrong place.',
      cause: '`scrollBehavior` ignores `to.hash`, the element isn\'t rendered yet when scrolling happens, or a fixed header covers it.',
      fix: 'Return `{ el: to.hash, top: <header height> }`, and if content renders later, return a Promise that resolves once it is in the DOM.',
    },
    {
      symptom: '`scrollBehavior` returns a position but nothing scrolls.',
      cause: 'Your app scrolls inside a container element (e.g. `<main style="overflow:auto">`), but the router scrolls the window.',
      fix: 'Scroll the container yourself (in `afterEach` or the page), or let the document scroll instead of an inner container.',
    },
  ],

  bestPractices: [
    'Use `() => import(\'./views/Page.vue\')` for every route except the first screen(s).',
    'Never statically import a page you also lazy-load.',
    'Drive a loading indicator from `beforeEach`, `afterEach` and `onError` — all three.',
    'Handle chunk-load errors explicitly; plan what happens to users on an old build after a deploy.',
    'In `scrollBehavior`, check `savedPosition` first, then `to.hash`, then default to `{ top: 0 }`.',
    'Offset anchor scrolling by the height of any fixed header.',
    'Move focus to the new page\'s heading after navigation for keyboard and screen-reader users.',
  ],

  useCases: [
    'An admin section most visitors never open: lazy-load all of it.',
    'A reports page that pulls in a heavy charting library: the library ends up in that page\'s chunk.',
    'A docs site where `#section` links jump to headings below a fixed nav bar.',
    'A long product list where Back from a product returns to the same spot in the list.',
    'Filter or pagination changes on the same page that should *not* scroll to the top.',
  ],

  whenToUse: {
    use: [
      'Any route that isn\'t part of the first screen, especially big or rarely visited ones.',
      'Pages that pull in large dependencies only they use.',
      '`scrollBehavior` in every app with pages longer than the screen.',
    ],
    avoid: [
      'Lazy-loading the landing page or other first-screen routes — it delays the first render.',
      'Splitting tiny pages into many separate chunks just because you can; each one is another request.',
      '`defineAsyncComponent` for route components.',
      'Assuming `savedPosition` exists on normal link clicks — it is only for Back/Forward.',
    ],
  },

  comparison: {
    title: 'Ways to load a component later',
    headers: ['', 'Lazy route `() => import()`', '`defineAsyncComponent()`', 'Static `import`'],
    rows: [
      ['Used for', 'route components', 'components used inside templates', 'anything needed up front'],
      ['Code split into its own chunk?', 'yes (by the bundler)', 'yes (by the bundler)', 'no — main bundle'],
      ['When it downloads', 'first navigation to the route, after earlier guards', 'first time it renders', 'at app start'],
      ['Loading / error UI', 'your router hooks (`beforeEach`/`afterEach`/`onError`)', 'built-in `loadingComponent` / `errorComponent` options', 'n/a'],
      ['Cached after load?', 'yes, by the router', 'yes', 'n/a'],
    ],
    note: 'Rule of thumb: pages → lazy routes; heavy widgets inside a page → `defineAsyncComponent`. See [async components](lesson:async-components).',
  },

  quiz: [
    {
      id: 'lazy-routes-scroll-q1',
      type: 'mcq',
      prompt: 'What does `{ path: \'/admin\', component: () => import(\'./AdminPage.vue\') }` do?',
      options: [
        { text: 'The bundler puts AdminPage in a separate chunk; the router fetches it the first time `/admin` is entered and caches it.' },
        { text: 'It downloads AdminPage in the background as soon as the app starts.', why: 'Nothing is fetched until the route is entered (unless you prefetch it yourself).' },
        { text: 'It re-downloads AdminPage every time you visit `/admin`.', why: 'After a successful load the router caches the component.' },
        { text: 'It only works if AdminPage is also imported at the top of the file.', why: 'The opposite: a static import elsewhere puts it back into the main bundle.' },
      ],
      answer: 0,
      explanation: 'A function returning a Promise of a component is a lazy route component. The bundler splits the module out; the router loads it on first entry and keeps the result.',
    },
    {
      id: 'lazy-routes-scroll-q2',
      type: 'output',
      prompt: '`/guide` and `/api` are lazy routes whose loaders push their name into `downloads`. Starting on `/`, the user visits **Guide → Home → Guide → API → Guide**. What is `downloads` at the end?',
      code: {
        lang: 'js',
        code: `const lazy = (name, comp) => () => {
  downloads.push(name)
  return Promise.resolve({ default: comp })
}
routes: [
  { path: '/', component: Home },
  { path: '/guide', component: lazy('guide', Guide) },
  { path: '/api', component: lazy('api', Api) },
]`,
      },
      options: ['["guide", "api"]', '["guide", "guide", "api", "guide"]', '[]', '["guide", "api", "guide"]'],
      answer: 0,
      explanation: 'Each loader runs once — the first time its route is entered. After that the router uses the cached component, so repeated visits don\'t call the loader again.',
    },
    {
      id: 'lazy-routes-scroll-q3',
      type: 'bug',
      prompt: 'Users report the "Loading…" bar sometimes never disappears. It always happens right after a page fails to load. What is the bug?',
      code: {
        lang: 'js',
        code: `const loading = ref(false)

router.beforeEach(() => { loading.value = true })
router.afterEach(() => { loading.value = false })
router.onError((error) => {
  reportToMonitoring(error)
})`,
      },
      options: [
        { text: 'A navigation that throws skips `afterEach`, and `onError` never resets `loading`.' },
        { text: '`beforeEach` must return `true` or the loading bar breaks.', why: 'Returning nothing continues the navigation; that is fine.' },
        { text: '`loading` must be `reactive()`, not `ref()`.', why: 'A ref is perfectly reactive here.' },
        { text: '`afterEach` runs before the component is downloaded.', why: '`afterEach` runs after the navigation is confirmed, i.e. after lazy components resolved.' },
      ],
      answer: 0,
      explanation: 'When a lazy loader rejects, the router calls `onError` handlers and rejects `push()`, but does not call `afterEach`. Add `loading.value = false` inside `onError`.',
    },
    {
      id: 'lazy-routes-scroll-q4',
      type: 'fill',
      prompt: 'Complete the recipe: restore the position on Back/Forward, scroll to anchors, otherwise go to the top.',
      code: {
        lang: 'js',
        code: `scrollBehavior(to, from, savedPosition) {
  if (___) return savedPosition
  if (to.hash) return { ___: to.hash }
  return { top: 0 }
}`,
      },
      answer: [['savedPosition'], ['el']],
      explanation: '`savedPosition` is only set on Back/Forward navigations. `{ el: \'#id\' }` scrolls to the matching element.',
    },
    {
      id: 'lazy-routes-scroll-q5',
      type: 'mcq',
      prompt: 'Which routes are good candidates for lazy loading? (Select all that apply.)',
      options: [
        { text: 'An admin dashboard most visitors never open.' },
        { text: 'A reports page that uses a large charting library.' },
        { text: 'The home page every visitor lands on first.', why: 'It is needed immediately; lazy-loading it just adds a request before the first render.' },
        { text: 'A settings section with several sub-pages.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Lazy-load what isn\'t needed for the first screen — especially big or rarely visited pages. Keep the first screen eager.',
    },
    {
      id: 'lazy-routes-scroll-q6',
      type: 'short',
      prompt: 'When is `savedPosition` not `null`, and why should `scrollBehavior` check it first?',
      answer: '`savedPosition` is only provided for popstate navigations — the browser\'s Back and Forward buttons (or `router.back()`/`go()`) with web or hash history. Checking it first restores the exact position the user left, which is what people expect from Back on a long page; other rules (anchors, top of page) are for new navigations.',
    },
  ],

  exercises: [
    {
      id: 'lazy-admin-section',
      title: 'Lazy admin section with a loading indicator',
      difficulty: 'intermediate',
      prompt: `
The admin app has three pages. Make the secondary ones load on demand and show progress.

In \`router.js\`:

- Keep \`/\` eager.
- Make \`/reports\` and \`/settings\` lazy using the provided helper: \`simulateLazy('reports', ReportsPage)\` and \`simulateLazy('settings', SettingsPage)\` (the sandbox's stand-in for \`() => import('./ReportsPage.vue')\`).
- Drive the \`isNavigating\` ref from \`status.js\` so \`App.vue\`'s \`<p class="page-loading">\` shows while a navigation is pending and hides when it ends — **including** when a page fails to load (try \`/broken\`).

The downloaded chunks are listed in \`<span class="downloads">\`. Links: \`.to-home\`, \`.to-reports\`, \`.to-settings\`.
`,
      files: { ...ex1Shared, 'router.js': ex1RouterStarter },
      hints: [
        'A lazy route is just `component: simulateLazy(\'reports\', ReportsPage)` instead of `component: ReportsPage`.',
        'Bracket every navigation: `router.beforeEach(() => { isNavigating.value = true })` and `router.afterEach(() => { isNavigating.value = false })`.',
        'A failing loader skips `afterEach`. Add `router.onError(() => { isNavigating.value = false })`.',
      ],
      solution: {
        explanation: 'The two lazy routes now fetch their component on first entry, and the router caches it, so the second visit downloads nothing. The loading state is set at the start of every navigation and cleared at the end — by `afterEach` for normal endings (including cancelled navigations) and by `onError` when the navigation throws.',
        files: { ...ex1Shared, 'router.js': ex1RouterSolution },
      },
      tests: [
        {
          name: 'Reports is downloaded on first visit (and Settings is not)',
          code: `expect(text('.downloads')).toBe('none')
await click('.to-reports')
await wait(450)
expect(text('.downloads')).toContain('reports')
expect(text('.downloads')).not.toContain('settings')
expect(text()).toContain('Reports')`,
        },
        {
          name: 'the loading indicator shows while Settings loads',
          code: `await click('.to-settings')
expect(exists('.page-loading')).toBe(true)
await wait(450)
expect(exists('.page-loading')).toBe(false)
expect(text()).toContain('Settings')`,
        },
        {
          name: 'a second visit does not download again',
          code: `await click('.to-reports')
await wait(450)
await click('.to-home')
await click('.to-reports')
await wait(450)
expect(text('.downloads')).toBe('reports')`,
        },
        {
          name: 'the indicator is cleared when a page fails to load',
          code: `const router = requireModule('router.js').default
await router.push('/broken').catch(() => {})
await flush()
expect(exists('.page-loading')).toBe(false)`,
        },
      ],
    },
    {
      id: 'scroll-rules',
      title: 'A scrollBehavior with four rules',
      difficulty: 'intermediate',
      prompt: `
Implement \`scrollBehavior\` in \`router.js\` with these rules, **in this order**:

1. If \`savedPosition\` is set (Back/Forward), return it.
2. If the target has a hash, return \`{ el: to.hash, top: 64, behavior: 'smooth' }\` (the site has a 64px fixed header).
3. If only the query changed — same \`path\` as before, e.g. \`/products?page=2\` → \`/products?page=3\` — return \`false\` (don't scroll).
4. Otherwise return \`{ top: 0 }\`.

The tests call \`router.options.scrollBehavior(to, from, savedPosition)\` directly with resolved locations, because the sandbox has no real scrolling history.
`,
      files: { ...ex2Shared, 'router.js': ex2RouterStarter },
      hints: [
        'Each rule is one `if` with an early `return`. Order matters: a Back navigation to `/docs#install` should restore the saved position, not jump to the anchor.',
        '`to.hash` is an empty string when there is no hash, so `if (to.hash)` works.',
        'Rule 3: `if (to.path === from.path) return false` — `path` excludes the query and hash.',
      ],
      solution: {
        explanation: 'Early returns in priority order keep the function readable: restore history first, then honour explicit anchors, then avoid jumping when the user is just changing filters or pages, and otherwise start fresh at the top. The `top: 64` offset keeps anchored headings from hiding under the fixed header.',
        files: { ...ex2Shared, 'router.js': ex2RouterSolution },
      },
      tests: [
        {
          name: 'Back/Forward restores the saved position',
          code: `const router = requireModule('router.js').default
const p = router.options.scrollBehavior(router.resolve('/products'), router.resolve('/docs'), { left: 0, top: 300 })
expect(p.top).toBe(300)`,
        },
        {
          name: 'the saved position wins over a hash',
          code: `const router = requireModule('router.js').default
const p = router.options.scrollBehavior(router.resolve('/docs#install'), router.resolve('/'), { left: 0, top: 120 })
expect(p.top).toBe(120)
expect(p.el).toBeUndefined()`,
        },
        {
          name: 'a hash scrolls to the element with a 64px offset, smoothly',
          code: `const router = requireModule('router.js').default
const p = router.options.scrollBehavior(router.resolve('/docs#install'), router.resolve('/'), null)
expect(p.el).toBe('#install')
expect(p.top).toBe(64)
expect(p.behavior).toBe('smooth')`,
        },
        {
          name: 'a query-only change does not scroll',
          code: `const router = requireModule('router.js').default
const p = router.options.scrollBehavior(router.resolve('/products?page=3'), router.resolve('/products?page=2'), null)
expect(p).toBe(false)`,
        },
        {
          name: 'a new page scrolls to the top',
          code: `const router = requireModule('router.js').default
const p = router.options.scrollBehavior(router.resolve('/docs'), router.resolve('/products'), null)
expect(p.top).toBe(0)
expect(p.el).toBeUndefined()`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'lazy-routes-scroll-how-it-works',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How does lazy loading a route work in Vue Router, from the code you write to what the browser downloads?',
      answer: 'You set the route\'s `component` to a function returning `import(\'./Page.vue\')`. `import()` is standard dynamic import; the bundler sees it and emits the page (and dependencies only it uses) as a separate chunk. At runtime the router calls the function the first time the route is entered — after `beforeEach`/`beforeEnter` allowed the navigation — waits for the Promise, renders the component and caches it on the route record for later visits.',
      explanation: 'Three cooperating parts: a language feature (`import()`), the bundler (splitting), and the router (calling the loader at the right time and caching).',
      whyAsked: 'Checks that you understand route-level code splitting end to end, not just the one-line syntax.',
      mistakes: [
        'Thinking Vue itself splits the code (it\'s the bundler).',
        'Thinking the chunk downloads at app start.',
        'Using `defineAsyncComponent` for routes.',
      ],
      followUps: [
        'At which point in the guard pipeline is the component loaded?',
        'What happens if the download fails?',
        'How would you prefetch a page the user is likely to open next?',
      ],
      modelAnswer: 'Instead of importing the page component, I give the route a function that returns `import()` of it. Dynamic import is standard JavaScript and returns a Promise of the module; the bundler turns each dynamic import into its own chunk. Vue Router calls the function the first time the route is entered, after the early guards pass — so a redirected user never downloads it — waits for it, then caches the component. The result is a smaller initial bundle; the trade-off is a short wait on first visit, which I cover with a loading indicator and error handling.',
    },
    {
      id: 'lazy-routes-scroll-what-to-split',
      difficulty: 'beginner',
      type: 'scenario',
      minutes: 3,
      question: 'You\'re asked to "make the app load faster" and someone suggests lazy-loading every route. What would you do?',
      answer: 'Lazy-load secondary and heavy routes (admin, settings, reports with chart libraries), but keep the first screen(s) — landing, home, login — eager, because lazy-loading them only adds a request before the first render. Measure with the build output or a bundle analyzer before and after, add a loading indicator and chunk-error handling, and consider grouping tiny related pages into one chunk.',
      explanation: 'Lazy loading is a trade: smaller first download vs. a wait on first visit to each page. Apply it where the trade pays off and measure.',
      whyAsked: 'Separates candidates who apply techniques blindly from those who reason about trade-offs and measure.',
      mistakes: ['Lazy-loading the landing page.', 'No plan for loading/error states.', 'Claiming a speed-up without measuring.'],
      followUps: ['How would you verify the improvement?', 'What else besides routes could you split?'],
      modelAnswer: 'I\'d first look at the bundle to see what\'s actually in it. Then I\'d lazy-load routes that aren\'t on the first screen, especially big or rarely used ones like admin or reports, and keep the landing and login pages eager since everyone needs them immediately. I\'d add a loading indicator and handle chunk-load failures, then compare the build output and real loading metrics before and after rather than assuming it\'s faster.',
    },
    {
      id: 'lazy-routes-scroll-chunk-error',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'After each deploy, monitoring shows errors like "Failed to fetch dynamically imported module" from users clicking links. What\'s happening and how do you handle it?',
      answer: 'Users with a tab open from the previous build still have the old main bundle, which references the old chunk filenames (they contain content hashes). The deploy replaced those files, so the lazy import 404s. Handle it in `router.onError` (and/or Vite\'s `vite:preloadError` event): detect the chunk-load error and reload the page once to get the new build — protect against reload loops, e.g. with a flag in `sessionStorage` — or show a "new version available, refresh" message. Keeping the previous build\'s assets on the server for a while after deploying reduces the problem.',
      explanation: 'Content-hashed filenames are great for caching, but old HTML/JS points at files that no longer exist after a deploy.',
      code: {
        lang: 'js',
        code: `router.onError((error, to) => {
  const chunkFailed = /dynamically imported module|Importing a module script failed/i.test(error.message)
  if (chunkFailed && !sessionStorage.getItem('reloaded-for-chunk')) {
    sessionStorage.setItem('reloaded-for-chunk', '1')
    window.location.assign(to.fullPath)   // full load of the new build
  }
})`,
      },
      whyAsked: 'A real production issue in every SPA with code splitting; shows operational maturity.',
      mistakes: ['Blaming the CDN without understanding hashed filenames.', 'Reloading unconditionally (infinite reload loop if the server is really down).', 'Catching the error and doing nothing — the click silently fails.'],
      followUps: ['Why do chunk filenames contain hashes?', 'How could the deployment process itself reduce these errors?'],
      modelAnswer: 'It\'s version skew: the open tab runs the old build, whose chunk names are content-hashed, and the deploy removed those files, so the lazy import fails. I\'d catch it in `router.onError` or Vite\'s `vite:preloadError` event, recognise chunk-load errors, and do a one-time full reload to the target URL, with a sessionStorage flag so a genuinely broken server doesn\'t cause a reload loop. On the deployment side I\'d keep the previous build\'s assets around for a while. And I\'d keep reporting these errors so we can see whether the mitigation works.',
    },
    {
      id: 'lazy-routes-scroll-saved-position',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'With `createWebHistory()` and this `scrollBehavior`, the user scrolls down a long `/products` list, clicks a product (`/products/42`), then presses the browser\'s Back button. Where do they land?',
      code: {
        lang: 'js',
        code: `scrollBehavior(to, from, savedPosition) {
  if (to.hash) return { el: to.hash }
  return { top: 0 }
}`,
      },
      options: [
        'At the top of /products — savedPosition is ignored',
        'Exactly where they were on /products',
        'At the bottom of /products',
        'On /products/42 — Back is blocked',
      ],
      correctOption: 0,
      answer: 'At the top of `/products`. The router does pass a `savedPosition` for the Back navigation, but this function never returns it — it returns `{ top: 0 }`. Add `if (savedPosition) return savedPosition` first.',
      explanation: 'Once you provide `scrollBehavior`, you are responsible for every case, including restoring positions.',
      whyAsked: 'Checks practical knowledge of SPA scroll restoration — a very visible UX detail.',
      mistakes: ['Assuming the browser restores the position anyway (with a scrollBehavior the router takes over).', 'Thinking savedPosition is available for normal link clicks.'],
      followUps: ['What if the list is loaded asynchronously and is empty when scrollBehavior runs?', 'How would you keep the position when only a filter query changes?'],
      modelAnswer: 'At the top. The router hands `savedPosition` to the function on Back/Forward, but this implementation ignores it and returns `{ top: 0 }`. I\'d return `savedPosition` first, then handle hashes, then default to the top. If the list loads asynchronously, I\'d also need to wait for the data — for example return a Promise or restore the position from the page once the items render.',
    },
    {
      id: 'lazy-routes-scroll-vs-async-component',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare a lazy route component (`() => import()`) with `defineAsyncComponent()`. When do you use each?',
      answer: 'Both split code into chunks loaded on demand. Lazy route components are for the components a route renders: the router loads them during navigation (after early guards), integrates with guards and `onError`, and caches them. `defineAsyncComponent` is for components used inside templates — a heavy chart, editor or modal — and offers built-in `loadingComponent`, `errorComponent`, `delay` and `timeout` options. Don\'t use `defineAsyncComponent` as a route component.',
      explanation: 'Pages → router lazy loading; widgets inside pages → async components.',
      whyAsked: 'Tests whether you know the router has its own mechanism and why mixing them is discouraged.',
      mistakes: ['Saying they are interchangeable.', 'Not knowing `defineAsyncComponent` has loading/error options.'],
      followUps: ['How would you show a skeleton for a heavy chart on an already-loaded page?', 'Where does `<Suspense>` fit in, and what is its status?'],
      modelAnswer: 'They use the same underlying idea — a dynamic import becomes a separate chunk — but at different levels. For pages I give the route a function returning `import()`; the router loads it as part of the navigation, so guards run first and failures go to `router.onError`, and it caches the result. Inside a page, for a heavy widget like a chart or rich-text editor, I use `defineAsyncComponent`, which has built-in loading and error components and a timeout. The Router docs say not to use async components as route components, so I keep the two separate.',
    },
    {
      id: 'lazy-routes-scroll-retry-coding',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'The `/reports` page\'s chunk fails to load the first time (simulated flaky network) and works on the second try. Show a `<div class="route-error">` when a navigation fails to load, with a `<button class="retry">` that hides the banner and retries navigating to the same target.',
      starter: { files: { ...codingShared, 'router.js': codingRouterStarter, 'App.vue': codingAppStarter } },
      tests: [
        {
          name: 'a failed load shows the error banner and stays on the current page',
          code: `await click('.to-reports')
await wait(200)
expect(exists('.route-error')).toBe(true)
expect(vm.$route.path).toBe('/')`,
        },
        {
          name: 'Retry hides the banner and opens the page',
          code: `await click('.to-reports')
await wait(200)
await click('.retry')
await wait(200)
expect(exists('.route-error')).toBe(false)
expect(vm.$route.path).toBe('/reports')
expect(text()).toContain('Reports page')`,
        },
      ],
      hints: [
        'Register `router.onError((error, to) => { … })` in `router.js` — it receives the target location as its second argument.',
        'Store `{ message: error.message, target: to.fullPath }` in the exported `loadError` ref and render the banner with `v-if="loadError"`.',
        'In `retry()`: copy the target, set `loadError.value = null`, then `router.push(target)`. The router did not cache the failed load, so the loader runs again.',
      ],
      answer: 'Register `router.onError((error, to) => loadError.value = { message: error.message, target: to.fullPath })`; render a banner while `loadError` is set; on retry clear it and `router.push(target)`.',
      solution: { files: { ...codingShared, 'router.js': codingRouterSolution, 'App.vue': codingAppSolution } },
      explanation: 'Errors thrown during navigation — including rejected lazy loaders — go to `router.onError` along with the target, and the navigation is aborted, so the user stays where they were. Failed loads aren\'t cached, so pushing the same target again calls the loader again.',
      whyAsked: 'A realistic resilience task: it checks you know where navigation errors surface and how the router caches lazy components.',
      mistakes: ['Wrapping `RouterLink` clicks in try/catch (RouterLink swallows the rejection).', 'Expecting `afterEach` to report the error.', 'Retrying automatically in a loop without limits.'],
      followUps: ['How would you distinguish a flaky network from a new deploy?', 'How would you limit automatic retries?'],
      modelAnswer: 'I register a `router.onError` handler; it receives the error and the target location for errors thrown during navigation, including a rejected lazy loader. I store the message and `to.fullPath` in a ref and show an alert banner. Retry clears the error and pushes the same target; since the router only caches successful loads, the loader runs again. In production I\'d also detect deploy-related chunk errors and do a guarded full reload instead.',
    },
  ],

  takeaways: [
    'A lazy route is `component: () => import(\'./Page.vue\')`: the bundler splits it out, the router loads it on first entry and caches it.',
    'Lazy components load mid-navigation — after `beforeEach`/`beforeEnter` — so redirected users never download them.',
    'Keep the first screen eager; lazy-load secondary and heavy pages; never statically import a lazy page elsewhere.',
    'Build loading UI from `beforeEach` + `afterEach` + `onError`; `afterEach` is skipped when a navigation throws.',
    'Plan for chunk-load failures after deploys (guarded reload or a "new version" message).',
    '`scrollBehavior`: `savedPosition` first (Back/Forward only), then `{ el: to.hash, top: offset }`, then `{ top: 0 }`; `false` means don\'t scroll.',
    'Don\'t use `defineAsyncComponent` for route components.',
  ],
}
