// Lesson: Frontend architecture interviews.

const fsdApi = `// SERVICE LAYER: the only module that talks to the "server".
// The fake server is slow for one-letter queries and fast for longer ones,
// so responses can arrive out of order — just like real networks.
const PRODUCTS = [
  { id: 1, name: 'Desk Lamp', price: 39 },
  { id: 2, name: 'Notebook', price: 6 },
  { id: 3, name: 'Headphones', price: 89 },
  { id: 4, name: 'Coffee Mug', price: 12 },
  { id: 5, name: 'USB Cable', price: 9 },
  { id: 6, name: 'Pencil Case', price: 7 },
]

export const stats = { calls: 0 } // how many requests reached the "server"

function fakeServerSearch(query) {
  stats.calls++
  const delay = query.length === 1 ? 400 : 100
  return new Promise((resolve) => {
    setTimeout(() => {
      const q = query.toLowerCase()
      resolve(PRODUCTS.filter((p) => p.name.toLowerCase().includes(q)))
    }, delay)
  })
}

export function searchProducts(query) {
  return fakeServerSearch(query.trim())
}`

const fsdComposable = `// STATE + BEHAVIOUR for one search screen. Components stay simple.
import { ref, watch } from 'vue'
import { searchProducts } from './api.js'

export function useProductSearch() {
  const query = ref('')
  const results = ref([])
  const loading = ref(false)
  const error = ref(null)

  watch(
    query,
    async (q) => {
      loading.value = true
      error.value = null
      try {
        results.value = await searchProducts(q)
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    },
    { immediate: true },
  )

  return { query, results, loading, error }
}`

const fsdSearchBox = `<script setup>
// PRESENTATIONAL: knows nothing about APIs. defineModel() needs Vue 3.4+.
const query = defineModel({ type: String, default: '' })
</script>

<template>
  <input class="search" v-model="query" placeholder="Search products" aria-label="Search products" />
</template>`

const fsdList = `<script setup>
// PRESENTATIONAL: renders whatever it is given.
defineProps({
  items: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})
</script>

<template>
  <p v-if="loading" class="loading">Loading…</p>
  <ul class="products">
    <li v-for="item in items" :key="item.id" class="product">{{ item.name }} — \${{ item.price }}</li>
  </ul>
</template>`

const fsdApp = `<script setup>
// CONTAINER / PAGE: wires state to presentational components.
import SearchBox from './SearchBox.vue'
import ProductList from './ProductList.vue'
import { useProductSearch } from './useProductSearch.js'

const { query, results, loading, error } = useProductSearch()
</script>

<template>
  <h3>Shop</h3>
  <SearchBox v-model="query" />
  <p v-if="error" class="error">{{ error }}</p>
  <ProductList :items="results" :loading="loading" />
</template>`

export default {
  id: 'frontend-system-design',
  title: 'Frontend architecture interviews',
  summary: 'Design Vue applications out loud: clarify requirements, sketch the architecture, decide where state lives, define the API contract, and defend your trade-offs.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['answering-framework', 'composables-intro', 'pinia-basics', 'router-basics'],
  related: ['project-structure', 'service-layers', 'design-patterns', 'why-state-management', 'cancellation-race-conditions', 'resilient-requests', 'rendering-strategies', 'spa-or-nuxt', 'large-lists'],
  tags: ['interview', 'system design', 'frontend architecture', 'state management', 'pinia', 'composables', 'api design', 'performance', 'caching', 'race conditions', 'RADIO'],
  apis: [
    { name: 'Requirements → Architecture → Data → Interface → Optimisations', summary: 'A structure for frontend design rounds (often remembered as RADIO).' },
    { name: 'defineModel()', summary: 'Vue 3.4+: declares a two-way bound prop in a child component, used here by `SearchBox.vue`.' },
    { name: 'onWatcherCleanup()', summary: 'Vue 3.5+: registers cleanup for the current watcher run — useful to ignore stale async results.' },
  ],
  docs: [
    { label: 'Vue Guide — State Management', url: 'https://vuejs.org/guide/scaling-up/state-management.html' },
    { label: 'Vue Guide — Composables', url: 'https://vuejs.org/guide/reusability/composables.html' },
    { label: 'Vue Guide — Performance', url: 'https://vuejs.org/guide/best-practices/performance.html' },
    { label: 'Vue Guide — Watchers: side effect cleanup', url: 'https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup' },
    { label: 'Pinia — Introduction', url: 'https://pinia.vuejs.org/introduction.html' },
    { label: 'Vue Router — Lazy loading routes', url: 'https://router.vuejs.org/guide/advanced/lazy-loading.html' },
  ],

  intro: `
In a frontend architecture interview (often called *frontend system design*) you get an open-ended prompt — "Design a product search page", "Design a real-time dashboard", "Design a chat widget" — and a whiteboard or doc. There's no single right answer. You're evaluated on **how you decompose the problem and justify decisions**.

For Vue roles, the conversation usually covers:

- **Requirements** — what must it do, for whom, at what scale, on which devices?
- **Architecture** — rendering strategy, routes, the component tree, layers.
- **Data and state** — what state exists, and where each piece lives (component, composable, Pinia, URL, server cache).
- **Interface** — the API contract: endpoints, pagination, real-time updates, errors.
- **Optimisations and cross-cutting concerns** — performance, accessibility, security, i18n, testing, observability.

The playground is a miniature version of a design answer: a search page split into layers, with three architectural flaws to fix — missing empty state, stale responses and no caching.
`,

  why: `
Small apps forgive almost any structure. Real products don't: they grow to dozens of screens and several developers, talk to flaky networks, and must stay fast and accessible. Architecture interviews test whether you can anticipate those forces *before* writing code.

Interviewers use the open format deliberately. They want to see whether you:

- ask about requirements instead of assuming them;
- separate concerns (views vs state vs data access) so code stays testable and changeable;
- put state in the right place instead of making everything global;
- think about failure modes — slow networks, out-of-order responses, errors, empty data;
- know the cost of each tool and can say "we don't need that yet".

These are senior-level signals, and they come up even in mid-level interviews as "how would you structure this?" follow-ups.
`,

  eli15: `
Imagine you're asked to design a school cafeteria — not build it, just plan it.

A weak plan: "We'll have tables and food." A strong plan starts with questions: *How many students? Any allergies? Is breakfast served too? Does it double as an exam hall?*

Then you sketch the big parts: kitchen, serving line, seating, storage. You decide where things are kept — the shared salt shaker on each table, the special-diet meals locked in the kitchen, the menu on a board everyone can see. You plan the "deliveries" — how food arrives and what happens if a delivery is late. Finally you think about rush hour: two serving lines? A grab-and-go fridge?

A frontend design interview is the same: questions first, then the big parts (components), where things are kept (state), deliveries (APIs), and rush hour (performance and failures).
`,

  analogy: {
    title: 'Planning a restaurant',
    body: `
Before opening, a restaurant owner decides the menu and the expected crowd (requirements), the floor plan — dining room, kitchen, pass (architecture), what is kept at each station versus in the central store room (state), how orders flow between waiters and kitchen and what happens when a dish is unavailable (interface), and how to survive Friday night: prep in advance, a second line, a waiting list (optimisations).
`,
    mapping: [
      ['menu and expected crowd', 'functional and non-functional requirements'],
      ['floor plan and stations', 'routes, component tree and layers'],
      ['station supplies vs central store room', 'local component state vs shared Pinia store'],
      ['order tickets between waiters and kitchen', 'the API contract and service layer'],
      ['"we\'re out of that dish"', 'error, empty and loading states'],
      ['prepping for Friday night', 'caching, lazy loading, virtualisation, debouncing'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The layers of a well-structured Vue app',
    caption: 'Step through each layer and what belongs in it. In an interview, sketching this early gives you and the interviewer a shared map for the rest of the discussion.',
    alt: 'A column of layers from top to bottom: Router and pages, presentational components, composables and Pinia stores, services and API client, and the backend. Steps explain the responsibilities of each layer and how data flows down and events flow up.',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'router', label: 'Router + pages', note: 'URL → page component', tone: 'ink', x: 380, y: 40 },
        { id: 'components', label: 'Presentational components', note: 'props in, events out', tone: 'acid', x: 380, y: 110 },
        { id: 'state', label: 'Composables & Pinia stores', note: 'state + behaviour', tone: 'cobalt', x: 380, y: 180 },
        { id: 'services', label: 'Services / API client', note: 'HTTP, auth, errors', tone: 'kraft', x: 380, y: 250 },
        { id: 'backend', label: 'Backend APIs', note: 'validates + authorizes', tone: 'red', x: 380, y: 315 },
        { id: 'cross', label: 'Cross-cutting', note: 'a11y · i18n · logging · tests', tone: 'paper', x: 650, y: 180 },
      ],
      edges: [
        { from: 'router', to: 'components', label: 'renders' },
        { from: 'components', to: 'state', label: 'uses' },
        { from: 'state', to: 'services', label: 'calls' },
        { from: 'services', to: 'backend', label: 'HTTP' },
        { from: 'cross', to: 'state', dashed: true },
      ],
      steps: [
        { focus: ['router'], text: '**Router + pages.** Each route maps to a page component that composes the screen. Route params and query strings hold shareable state (filters, page number). Pages are good candidates for lazy loading.' },
        { focus: ['components'], edges: ['router->components'], text: '**Presentational components** receive data through props and report user intent through events (or `v-model`). They don\'t fetch data, so they\'re easy to reuse and test.' },
        { focus: ['state'], edges: ['components->state'], text: '**Composables and stores** hold state and behaviour: loading/error/data, derived values, race handling. Composables give per-screen state; Pinia stores hold truly shared state (current user, cart).' },
        { focus: ['services'], edges: ['state->services'], text: '**Services** are the only code that knows URLs and HTTP details: base URL, auth headers, JSON parsing, error normalisation, maybe caching. Swap or mock this layer in tests.' },
        { focus: ['backend'], edges: ['services->backend'], text: '**The backend** owns the truth and enforces security. The frontend can hide buttons, but every permission check must also happen here.' },
        { focus: ['cross'], edges: ['cross->state'], text: '**Cross-cutting concerns** — accessibility, internationalisation, error reporting, analytics, testing — touch every layer. Mention them explicitly; interviewers notice when they\'re missing.' },
      ],
    },
  },

  syntax: [
    `
#### A structure for the conversation

| Phase | Questions to answer | Typical artefacts |
|---|---|---|
| **R**equirements | Core features? Users and devices? Data size? Real-time? SEO? Offline? Accessibility and i18n needs? | a short feature list and non-functional list |
| **A**rchitecture | SPA, SSR or SSG? Routes? Component tree? Layers? | route map, component boxes |
| **D**ata model | Entities and fields? Where does each piece of state live? Normalised? | state table, entity shapes |
| **I**nterface | Endpoints? Pagination (offset vs cursor)? Real-time (polling, SSE, WebSocket)? Error contract? | API sketch |
| **O**ptimisations | Lazy loading, caching, debouncing, virtual lists, images, accessibility, security, monitoring, tests | a prioritised list with trade-offs |

The initials spell **RADIO**, a mnemonic many candidates use. The exact framework matters less than visibly moving from requirements to trade-offs.

#### Where should this state live?

| State | Good home | Why |
|---|---|---|
| Whether a dropdown is open | the component (\`ref\`) | nobody else cares |
| Form draft before saving | the form component or a composable | local until submitted |
| Current search filters, page number | the **URL** (route query) | shareable, survives refresh, back button works |
| Current user, cart, feature flags | a **Pinia** store | used across many routes |
| Server data (product list) | a composable/store with caching, or a data-fetching library | it is a *cache* of the server, with staleness and refetching |
| Theme for one subtree | \`provide/inject\` | avoids prop drilling without global state |
| Derived values (totals, filtered lists) | \`computed\` next to its sources | never store what you can derive |

#### A folder structure you can describe
`,
    {
      code: `src/
  app/                 main.js, router, global plugins, error handler
  features/
    catalog/
      pages/           CatalogPage.vue (lazy-loaded route)
      components/      ProductCard.vue, FilterPanel.vue
      composables/     useProductSearch.js
      api.js           searchProducts(), getProduct()
    cart/
      stores/cart.js   Pinia store (shared across features)
      components/      CartDrawer.vue
  shared/
    ui/                BaseButton.vue, BaseModal.vue (design system)
    lib/http.js        fetch wrapper: base URL, auth, errors
    composables/       useDebouncedRef.js`,
      lang: 'text',
      title: 'feature-based structure',
    },
    `
See [Feature-based project structure](lesson:project-structure) and [Service layers](lesson:service-layers) for the details.

#### Handling async correctly (always mention this)
`,
    {
      code: `import { watch, onWatcherCleanup } from 'vue' // onWatcherCleanup: Vue 3.5+

watch(query, async (q) => {
  let stale = false
  onWatcherCleanup(() => { stale = true })   // runs when query changes again
  loading.value = true
  try {
    const data = await searchProducts(q)
    if (!stale) results.value = data          // ignore out-of-order responses
  } finally {
    if (!stale) loading.value = false
  }
})`,
      lang: 'js',
      title: 'ignore stale responses',
    },
    {
      callout: 'version',
      title: 'Version notes',
      text: '`defineModel()` requires Vue **3.4+**; `onWatcherCleanup()` requires Vue **3.5+** (earlier versions get the same ability from the `onCleanup` third argument of the watch callback). Pinia and Vue Router are separate official libraries, not part of Vue core.',
    },
  ],

  walkthrough: {
    title: 'useProductSearch.js',
    lang: 'js',
    code: fsdComposable,
    intro: 'The heart of the playground\'s architecture: a composable that owns the screen\'s state and talks to the service layer. Components never fetch.',
    steps: [
      { lines: [1, 3], text: 'The composable depends only on Vue and the **service layer** (`api.js`). It doesn\'t know URLs, HTTP or how results are rendered.' },
      { lines: [5, 9], text: 'All screen state in one place: the input (`query`), server data (`results`) and request status (`loading`, `error`). Each component that calls `useProductSearch()` gets its own copy.' },
      { lines: [11, 13], text: 'A watcher reacts to query changes — a side effect, so `watch`, not `computed`. `immediate: true` loads the initial list.' },
      { lines: [14, 22], text: 'Loading/error handling with `try/catch/finally`. **Flaw:** if an older, slower request finishes after a newer one, it overwrites the newer results — and turns `loading` off too early.' },
      { lines: [27, 28], text: 'It returns refs, so the page can destructure them and stay reactive. `App.vue` passes them to presentational components as props and `v-model`.' },
    ],
  },

  playground: {
    title: 'A layered search page',
    objective: 'Improve a small layered architecture the way you would discuss it in an interview: add an empty state, guard against stale responses, and cache in the service layer.',
    files: { 'App.vue': fsdApp, 'useProductSearch.js': fsdComposable, 'api.js': fsdApi, 'SearchBox.vue': fsdSearchBox, 'ProductList.vue': fsdList },
    entry: 'App.vue',
    expected: 'A search box and six products. Typing filters them via the fake API (fast for longer queries, slow for one letter). Typing **l** then quickly **lamp** ends up showing three products instead of one — a stale response.',
    experiments: [
      {
        id: 'empty-state',
        task: 'In `ProductList.vue`, show `<p class="empty">No products match</p>` when it is **not** loading and there are no items.',
        hint: '`<p v-if="!loading && items.length === 0" class="empty">No products match</p>` — keep it inside the presentational component, which already receives both props.',
        tests: [
          { name: 'shows the empty state only when nothing matches', code: `await wait(150)\nawait type('.search', 'zzz')\nawait wait(250)\nexpect(exists('.empty')).toBe(true)\nawait type('.search', 'mug')\nawait wait(250)\nexpect(exists('.empty')).toBe(false)\nexpect(findAll('.product')).toHaveLength(1)` },
        ],
        explain: 'Loading, error, empty and success are four distinct UI states; designs (and interview answers) that only cover success feel unfinished. The presentational component can decide *how* to show emptiness without knowing *why* the list is empty.',
      },
      {
        id: 'stale-guard',
        task: 'Fix the race: typing **l** and then quickly **lamp** must end with only **Desk Lamp** shown. Ignore results from requests that are no longer the latest.',
        hint: 'In the watcher, before the first `await`: `let stale = false; onWatcherCleanup(() => { stale = true })` (import it from `vue`, 3.5+). Only assign `results`/`loading` if `!stale`. A request counter works too.',
        tests: [
          { name: 'the latest query wins', code: `await wait(150)\nawait type('.search', 'l')\nawait type('.search', 'lamp')\nawait wait(550)\nexpect(findAll('.product')).toHaveLength(1)\nexpect(text('.products')).toContain('Desk Lamp')` },
        ],
        explain: 'Vue runs a watcher\'s cleanup right before the next run, so each run can mark the previous one as stale. In production you\'d often also abort the request with an `AbortController` to save bandwidth. See [Cancellation & race conditions](lesson:cancellation-race-conditions).',
      },
      {
        id: 'cache',
        task: 'Add a cache to the **service layer** (`api.js`): repeating a query that was already fetched should not reach the fake server again. Searching `mug`, then clearing, then `mug` again should cause **2** server calls in total, not 4.',
        hint: 'Keep `const cache = new Map()` in `api.js`. In `searchProducts`, normalise the key (`query.trim().toLowerCase()`), and store the **promise** from `fakeServerSearch` the first time; return the cached promise afterwards.',
        tests: [
          { name: 'repeated queries are served from the cache', code: `await wait(150)\nawait type('.search', 'mug')\nawait wait(200)\nawait type('.search', '')\nawait wait(200)\nawait type('.search', 'mug')\nawait wait(200)\nexpect(requireModule('api.js').stats.calls).toBe(2)\nexpect(findAll('.product')).toHaveLength(1)` },
        ],
        explain: 'Caching the promise (not just the result) also de-duplicates concurrent requests for the same key. In an interview, follow up with the hard part: **invalidation** — when does cached data become stale (time-based expiry, after mutations, on focus)? Also make sure failed requests are not cached.',
      },
      {
        id: 'failure-mode',
        task: 'Simulate an outage: make `searchProducts` reject with `new Error(\'Search is unavailable\')` when the query is `error`. Type `error` and look at the UI.',
        hint: 'At the top of `searchProducts`: `if (query.trim() === \'error\') return Promise.reject(new Error(\'Search is unavailable\'))`.',
        explain: 'The composable already turns the rejection into an `error` ref, and the page shows it — because error handling lives in one layer, every screen using the composable gets it. In a real design you\'d also discuss retries, offline detection and reporting errors to monitoring.',
      },
    ],
  },

  animation: {
    type: 'pinia',
    props: { preset: 'local-vs-shared' },
    title: 'Local state vs a shared store',
    caption: 'Compare state kept inside individual components with state shared through a Pinia store, and see which components update after an action. "Where does this state live?" is the most important question in any Vue design discussion.',
    alt: 'An interactive demo with several components. In local mode each keeps its own state and changes stay inside it; in shared mode components read one Pinia store and all of them update when an action runs.',
  },

  internals: {
    beginner: `
Architecture is mostly about **where things go**. Screens are split into small components; data and the logic that changes it live in composables or stores; talking to the server lives in one service module. When each part has one job, you can change one without breaking the others — and you can explain the design in a few boxes and arrows.
`,
    technical: [
      `
**How a strong design answer usually flows** (adapt timing to the interview length):

1. **Clarify requirements** and write them down — functional (search, filter, paginate) and non-functional (fast first load, accessible, works on mobile, SEO for product pages?).
2. **Sketch the high level**: rendering strategy, routes, the main components, the layers.
3. **Deep-dive on state and data**: entity shapes, where each piece of state lives, how server data is fetched, cached and invalidated.
4. **Define the API contract**: endpoints, query parameters, pagination style, error format, real-time mechanism.
5. **Cover failure modes and optimisations**: loading/empty/error states, races, retries, code splitting, virtualisation, image strategy, accessibility, security, monitoring, testing.
6. **Summarise trade-offs** and what you\'d do next with more time.

**Pagination trade-off:** offset pagination (\`?page=3\`) is simple and allows jumping to a page, but items shift when data changes; cursor pagination (\`?after=abc\`) is stable for infinite scroll and live data, but you can\'t jump to page 37.

**Real-time trade-off:** polling is simple and works everywhere but wastes requests and adds latency; Server-Sent Events give one-way server → client streams over HTTP; WebSockets give two-way, low-latency communication but need connection management and reconnection logic. See [Real-time UIs with WebSockets](lesson:realtime-websockets).
`,
      `
**State categories worth naming in an interview:**

- **UI state** (open/closed, selected tab) — local.
- **Form state** (draft values, touched, errors) — local or a composable until submitted.
- **URL state** (filters, sort, page, selected id) — route query/params; makes views shareable and back-button friendly.
- **Shared client state** (auth user, cart, preferences) — Pinia.
- **Server cache** (lists, entities) — fetched data with loading/error/staleness; a composable/store with caching or a dedicated data-fetching library.

Mixing these up — e.g. copying server data into a global store and mutating it everywhere — is the root of many "the screen shows stale data" bugs.
`,
    ],
    production: `
- **Start simple and say so.** "For the first version I\'d keep search state in a composable and filters in the URL; if other pages need the results, I\'d promote it to a store." Interviewers reward proportionate design.
- **Measure before optimising.** Mention profiling (Vue DevTools, browser Performance panel, Web Vitals) before reaching for virtualisation or memoisation — see [Measuring performance](lesson:measuring-performance).
- **Security:** escape user content (no \`v-html\` with untrusted data), keep tokens out of places scripts can easily read where possible, enforce authorization on the server, and set a Content Security Policy — see [Authentication & authorization](lesson:auth-security).
- **Accessibility and i18n** are architecture concerns: focus management on route changes, accessible base components in the design system, translatable strings from day one.
- **Observability:** a global error handler (\`app.config.errorHandler\`), error reporting, and meaningful logs for failed requests.
- **Testing strategy:** unit-test composables and stores, component-test presentational components, a few end-to-end tests for critical flows — see [Testing fundamentals](lesson:testing-fundamentals).
`,
  },

  mistakes: [
    {
      title: 'Designing before clarifying',
      wrong: { code: `"I'd use Nuxt, Pinia, TanStack Query and a micro-frontend architecture…"\n(before knowing what the product does)`, lang: 'text' },
      right: { code: `"Who uses this, on which devices? How many products? Do product pages need SEO?\nIs real-time stock important?" — then choose tools that fit the answers.`, lang: 'text' },
      explanation: 'Tools are answers to requirements. Naming tools first suggests pattern-matching rather than design.',
    },
    {
      title: 'Making everything global',
      wrong: { code: `// stores/ui.js\nstate: { isDropdownOpen, searchDraft, hoveredRow, modalStep, … }`, lang: 'js' },
      right: { code: `// local refs in the components that own them;\n// a store only for state shared across routes (user, cart)`, lang: 'js' },
      explanation: 'Global state is harder to reason about and test. Keep state as local as possible and promote it only when sharing is needed.',
    },
    {
      title: 'Fetching in presentational components',
      wrong: { code: `<!-- ProductCard.vue -->\n<script setup>\nconst res = await fetch('/api/products/' + props.id) // every card fetches itself\n</script>`, lang: 'vue' },
      right: { code: `<!-- the page/composable fetches the list once and passes items down -->\n<ProductCard v-for="p in products" :key="p.id" :product="p" />`, lang: 'vue' },
      explanation: 'Per-card fetching causes request waterfalls, duplicated loading logic and components you can\'t reuse or test without a server.',
    },
    {
      title: 'Ignoring failure modes',
      wrong: { code: `"…and then the results show up."`, lang: 'text' },
      right: { code: `"While loading we show a skeleton; on error, a retry button; on no results,\nsuggestions; and we drop responses for outdated queries."`, lang: 'text' },
      explanation: 'Real networks are slow, flaky and out of order. Covering loading, empty, error and race conditions is a strong senior signal.',
    },
  ],

  debugging: [
    {
      symptom: 'Search results sometimes don\'t match the query.',
      cause: 'Out-of-order responses: an older request finished after a newer one.',
      fix: 'Ignore stale responses (watcher cleanup flag, request id) and/or abort previous requests with an `AbortController`.',
    },
    {
      symptom: 'The same data is requested many times when a page loads.',
      cause: 'Several components fetch independently, or a component fetches on every mount.',
      fix: 'Fetch once in the page/composable/store and pass data down; add caching/de-duplication in the service layer.',
    },
    {
      symptom: 'After editing an item, other screens still show the old value.',
      cause: 'Server data was copied into several places that are updated independently.',
      fix: 'Keep one source of truth per entity (a store or cache) and invalidate/refetch after mutations.',
    },
    {
      symptom: 'Refreshing the page or sharing a link loses the user\'s filters.',
      cause: 'Filter state lives only in component or store memory.',
      fix: 'Store filters, sort and pagination in the route query (`router.replace({ query })`) and read them on load.',
    },
  ],

  bestPractices: [
    'Clarify functional and non-functional requirements before naming any tool.',
    'Sketch layers: pages → presentational components → composables/stores → services → backend.',
    'Keep state as local as possible; put shareable view state in the URL; use Pinia for truly shared client state.',
    'Never store what you can derive — use `computed`.',
    'Design all four UI states: loading, empty, error, success — and handle races.',
    'Centralise HTTP in a service layer with error normalisation; enforce security on the server.',
    'Treat performance, accessibility, i18n, observability and testing as first-class topics.',
    'Close with trade-offs and how the design would evolve.',
  ],

  useCases: [
    'Design rounds: product listing/search, dashboards, chat, file uploader, form wizard, news feed with infinite scroll.',
    'Take-home reviews: explaining the structure of a project you submitted.',
    'On the job: writing a design doc for a new feature or a refactor.',
    'Code review: spotting misplaced state or components that fetch their own data.',
  ],

  whenToUse: {
    use: [
      'Composables for screen-level state and reusable behaviour.',
      'Pinia when several unrelated components or routes share state that must stay consistent.',
      'The URL for filters, sorting, pagination and selected items.',
      'A service layer for all network access.',
      'SSR/SSG (e.g. Nuxt) when SEO or first-paint performance on content pages matters.',
    ],
    avoid: [
      'A global store for state used by one component.',
      'Micro-frontends, complex caching layers or SSR "just in case" — justify each by a requirement.',
      'Copying server data into many places that drift apart.',
      'Relying on hidden UI elements for authorization.',
    ],
  },

  comparison: {
    title: 'Tools for sharing state in Vue',
    headers: ['Tool', 'Scope', 'Good for', 'Watch out for'],
    rows: [
      ['props / emits / `v-model`', 'parent ↔ child', 'explicit, local data flow', 'prop drilling through many levels'],
      ['`provide` / `inject`', 'a component subtree', 'themes, form context, design-system internals', 'implicit dependencies, harder to trace'],
      ['composable with local state', 'per calling component', 'screen logic, reusable behaviour', 'accidental sharing if state is declared at module level'],
      ['Pinia store', 'whole app', 'auth user, cart, cross-route state', 'over-using it for local UI state'],
      ['route query / params', 'the URL', 'filters, sort, page, selected id', 'only strings; needs parsing and validation'],
    ],
    note: 'Deep dives: [Why shared state?](lesson:why-state-management), [provide/inject](lesson:provide-inject), [Component communication patterns](lesson:component-communication).',
  },

  quiz: [
    {
      id: 'frontend-system-design-q1',
      type: 'mcq',
      prompt: 'You\'re asked to "design a product search page". What should you do first?',
      options: [
        { text: 'Choose between Pinia and Vuex', why: 'Tool choices depend on requirements you don\'t know yet.' },
        { text: 'Ask about requirements: features, data size, SEO needs, devices, real-time updates' },
        { text: 'Draw the component tree in detail', why: 'Useful soon — but without requirements you may design the wrong tree.' },
        { text: 'Discuss micro-frontends', why: 'A large-scale organisational tool; rarely relevant before knowing the scope.' },
      ],
      answer: 1,
      explanation: 'Requirements drive every later decision — rendering strategy, state placement, API design and optimisations.',
    },
    {
      id: 'frontend-system-design-q2',
      type: 'mcq',
      prompt: 'Where should the current search filters and page number of a product listing usually live?',
      options: [
        { text: 'A local ref in the filter component', why: 'Other components (the list, pagination) need it, and it would be lost on refresh.' },
        { text: 'The route query string (synced with the UI)' },
        { text: 'A global Pinia store only', why: 'Works for sharing, but filters wouldn\'t survive refresh or be shareable as a link without extra work.' },
        { text: 'localStorage', why: 'Persists for one user on one device, but links can\'t be shared and the back button won\'t restore previous filters.' },
      ],
      answer: 1,
      explanation: 'URL state makes views shareable, bookmarkable and back-button friendly. Components read from and write to the route query.',
    },
    {
      id: 'frontend-system-design-q3',
      type: 'output',
      prompt: 'Typing triggers searches. Query **"l"** takes 400 ms; **"lamp"** takes 100 ms. The user types "l", then "lamp" quickly. With this watcher, what does the list show at the end?',
      code: {
        lang: 'js',
        code: `watch(query, async (q) => {
  results.value = await searchProducts(q)
})`,
      },
      options: [
        { text: 'Results for "lamp"', why: '"lamp" finishes first, but then the slower "l" request finishes and overwrites it.' },
        { text: 'Results for "l"' },
        { text: 'Nothing — Vue cancels the first request', why: 'Vue doesn\'t cancel your async work; you have to handle it.' },
        { text: 'Both result sets merged', why: 'Each assignment replaces `results` entirely.' },
      ],
      answer: 1,
      explanation: 'The last response to *arrive* wins, not the last request *sent*. Guard with a stale flag in watcher cleanup or a request id.',
    },
    {
      id: 'frontend-system-design-q4',
      type: 'bug',
      prompt: 'This composable is meant to give every component its **own** search state, but all search boxes on the page mirror each other. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `import { ref } from 'vue'
import { searchProducts } from './api.js'

const query = ref('')

export function useProductSearch() {
  const results = ref([])
  // …watch query, load results…
  return { query, results }
}`,
      },
      answerLine: 4,
      explanation: '`query` is created once at module level, so every caller shares it. Move it inside `useProductSearch()` to get per-component state (or keep it outside deliberately for shared state).',
    },
    {
      id: 'frontend-system-design-q5',
      type: 'fill',
      prompt: 'Complete the RADIO structure for a design round.',
      code: { lang: 'text', code: `R — Requirements\nA — ___\nD — Data model\nI — ___ (API contract)\nO — Optimisations` },
      answer: [['Architecture', 'architecture'], ['Interface', 'interface']],
      explanation: 'Requirements, Architecture, Data model, Interface, Optimisations.',
    },
    {
      id: 'frontend-system-design-q6',
      type: 'mcq',
      prompt: 'Select **all** the concerns you should mention in a design for a public e-commerce product page.',
      options: [
        { text: 'SEO and first-load performance (rendering strategy)' },
        { text: 'Loading, empty and error states' },
        { text: 'Accessibility (keyboard, screen readers, focus)' },
        { text: 'Server-side authorization for admin actions' },
        { text: 'Choosing the exact CSS colour palette', why: 'Visual design matters, but it isn\'t an architectural decision in this kind of interview.' },
      ],
      answer: [0, 1, 2, 3],
      explanation: 'Rendering strategy, UI states, accessibility and security are architectural concerns; colours are design details.',
    },
    {
      id: 'frontend-system-design-q7',
      type: 'short',
      prompt: 'In two or three sentences: why keep HTTP calls in a service layer instead of calling `fetch` directly in components?',
      answer: 'A service layer centralises base URLs, headers, authentication, JSON handling and error normalisation, so every caller behaves consistently and changes happen in one place. Components and composables then depend on simple functions like `searchProducts(q)`, which are easy to mock in tests and to add caching or retries to later.',
    },
  ],

  exercises: [
    {
      id: 'notifications-store',
      title: 'Design shared state: a notifications store',
      difficulty: 'intermediate',
      prompt: `
A header bell (\`NotificationBell.vue\`) and the page (\`App.vue\`) both need the same notifications, so they belong in a **Pinia** setup store. Complete \`stores/notifications.js\`:

- \`items\`: an array of \`{ id, text, read }\` (already there).
- \`unreadCount\`: a **computed** number of unread items.
- \`add(text)\`: adds an unread notification with a unique id.
- \`markAllRead()\`: marks every item as read.
- \`dismiss(id)\`: removes that notification.

The UI already exists: \`.add\` simulates a message, \`.mark-all\` marks all read, each \`li.notification\` has a \`.dismiss\` button, and the bell shows \`.unread-count\`.
`,
      files: {
        'main.js': `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')`,
        'stores/notifications.js': `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([]) // { id, text, read }

  // TODO: unreadCount, add(text), markAllRead(), dismiss(id)

  return { items }
})`,
        'NotificationBell.vue': `<script setup>
import { useNotificationsStore } from './stores/notifications.js'
const store = useNotificationsStore()
</script>

<template>
  <p class="bell">🔔 <span class="unread-count">{{ store.unreadCount }}</span></p>
</template>`,
        'App.vue': `<script setup>
import NotificationBell from './NotificationBell.vue'
import { useNotificationsStore } from './stores/notifications.js'

const store = useNotificationsStore()
let n = 1
function simulate() {
  store.add('New message ' + n++)
}
</script>

<template>
  <NotificationBell />
  <button class="add" @click="simulate">Simulate message</button>
  <button class="mark-all" @click="store.markAllRead()">Mark all read</button>
  <ul>
    <li v-for="item in store.items" :key="item.id" class="notification" :class="{ unread: !item.read }">
      {{ item.text }}
      <button class="dismiss" @click="store.dismiss(item.id)">×</button>
    </li>
  </ul>
</template>`,
      },
      hints: [
        '`const unreadCount = computed(() => items.value.filter((i) => !i.read).length)`.',
        'Keep a `let nextId = 1` inside the store function; `add` pushes `{ id: nextId++, text, read: false }`.',
        '`markAllRead`: `items.value.forEach((i) => { i.read = true })`. `dismiss`: `items.value = items.value.filter((i) => i.id !== id)`. Return everything from the setup function.',
      ],
      solution: {
        explanation: 'State that two unrelated components need lives in one store, with a computed for derived data and actions as the only way to change it. The bell and the list can never disagree because they read the same source of truth.',
        files: {
          'main.js': `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')`,
          'stores/notifications.js': `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([]) // { id, text, read }
  let nextId = 1

  const unreadCount = computed(() => items.value.filter((item) => !item.read).length)

  function add(text) {
    items.value.push({ id: nextId++, text, read: false })
  }

  function markAllRead() {
    items.value.forEach((item) => {
      item.read = true
    })
  }

  function dismiss(id) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  return { items, unreadCount, add, markAllRead, dismiss }
})`,
          'NotificationBell.vue': `<script setup>
import { useNotificationsStore } from './stores/notifications.js'
const store = useNotificationsStore()
</script>

<template>
  <p class="bell">🔔 <span class="unread-count">{{ store.unreadCount }}</span></p>
</template>`,
          'App.vue': `<script setup>
import NotificationBell from './NotificationBell.vue'
import { useNotificationsStore } from './stores/notifications.js'

const store = useNotificationsStore()
let n = 1
function simulate() {
  store.add('New message ' + n++)
}
</script>

<template>
  <NotificationBell />
  <button class="add" @click="simulate">Simulate message</button>
  <button class="mark-all" @click="store.markAllRead()">Mark all read</button>
  <ul>
    <li v-for="item in store.items" :key="item.id" class="notification" :class="{ unread: !item.read }">
      {{ item.text }}
      <button class="dismiss" @click="store.dismiss(item.id)">×</button>
    </li>
  </ul>
</template>`,
        },
      },
      tests: [
        { name: 'starts with zero unread', code: `expect(text('.unread-count')).toBe('0')` },
        { name: 'adding messages updates the bell and the list', code: `await click('.add')\nawait click('.add')\nexpect(text('.unread-count')).toBe('2')\nexpect(findAll('.notification')).toHaveLength(2)\nexpect(findAll('.notification.unread')).toHaveLength(2)` },
        { name: 'mark all read keeps items but clears the count', code: `await click('.add')\nawait click('.add')\nawait click('.mark-all')\nexpect(text('.unread-count')).toBe('0')\nexpect(findAll('.notification')).toHaveLength(2)\nexpect(findAll('.notification.unread')).toHaveLength(0)` },
        { name: 'dismiss removes one notification', code: `await click('.add')\nawait click('.add')\nawait click('.dismiss')\nexpect(findAll('.notification')).toHaveLength(1)\nexpect(text('.unread-count')).toBe('1')` },
      ],
    },
    {
      id: 'use-pagination',
      title: 'A reusable pagination composable',
      difficulty: 'advanced',
      prompt: `
Implement \`usePagination(items, pageSize)\` in \`usePagination.js\`. \`items\` is a **ref** holding an array. Return:

- \`page\` — a ref, starting at **1**;
- \`totalPages\` — a computed, at least **1** (an empty list has one empty page);
- \`pageItems\` — a computed slice of the current page;
- \`next()\` / \`prev()\` — move one page, never beyond the first or last page.

If \`items\` shrinks so the current page no longer exists, \`page\` must move to the new last page.

\`App.vue\` uses it to show 10 tasks, 3 per page: \`.page-info\` shows **Page X of Y**, rows are \`li.row\`, buttons are \`.prev\` and \`.next\`.
`,
      files: {
        'usePagination.js': `import { ref, computed } from 'vue'

export function usePagination(items, pageSize) {
  const page = ref(1)
  // TODO: totalPages, pageItems, next(), prev(), clamp when items shrink
  return { page }
}`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import { usePagination } from './usePagination.js'

const tasks = ref(Array.from({ length: 10 }, (_, i) => 'Task ' + (i + 1)))
const { page, totalPages, pageItems, next, prev } = usePagination(tasks, 3)
</script>

<template>
  <p class="page-info">Page {{ page }} of {{ totalPages }}</p>
  <ul>
    <li v-for="task in pageItems" :key="task" class="row">{{ task }}</li>
  </ul>
  <button class="prev" @click="prev">Previous</button>
  <button class="next" @click="next">Next</button>
</template>`,
      },
      hints: [
        '`totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))`.',
        '`pageItems = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize))`. `next`/`prev` change `page.value` only when within bounds.',
        'For shrinking: `watch(totalPages, (total) => { if (page.value > total) page.value = total })`.',
      ],
      solution: {
        explanation: 'The composable owns paging state and exposes derived values as computeds, so any list component can reuse it. It accepts a ref (so it reacts to new data) and uses a watcher to keep `page` valid when the data shrinks — the kind of edge case interviewers like to probe.',
        files: {
          'usePagination.js': `import { ref, computed, watch } from 'vue'

export function usePagination(items, pageSize) {
  const page = ref(1)

  const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))

  const pageItems = computed(() => {
    const start = (page.value - 1) * pageSize
    return items.value.slice(start, start + pageSize)
  })

  function next() {
    if (page.value < totalPages.value) page.value++
  }

  function prev() {
    if (page.value > 1) page.value--
  }

  watch(totalPages, (total) => {
    if (page.value > total) page.value = total
  })

  return { page, totalPages, pageItems, next, prev }
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { usePagination } from './usePagination.js'

const tasks = ref(Array.from({ length: 10 }, (_, i) => 'Task ' + (i + 1)))
const { page, totalPages, pageItems, next, prev } = usePagination(tasks, 3)
</script>

<template>
  <p class="page-info">Page {{ page }} of {{ totalPages }}</p>
  <ul>
    <li v-for="task in pageItems" :key="task" class="row">{{ task }}</li>
  </ul>
  <button class="prev" @click="prev">Previous</button>
  <button class="next" @click="next">Next</button>
</template>`,
        },
      },
      tests: [
        { name: 'computes pages and slices', code: `const { ref } = requireModule('vue')\nconst { usePagination } = requireModule('usePagination.js')\nconst p = withSetup(() => usePagination(ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 3))\nexpect(p.totalPages.value).toBe(4)\nexpect(p.pageItems.value).toEqual([1, 2, 3])\np.next(); p.next(); p.next(); p.next()\nexpect(p.page.value).toBe(4)\nexpect(p.pageItems.value).toEqual([10])\np.prev()\nexpect(p.pageItems.value).toEqual([7, 8, 9])` },
        { name: 'never goes below page 1; empty list has one page', code: `const { ref } = requireModule('vue')\nconst { usePagination } = requireModule('usePagination.js')\nconst p = withSetup(() => usePagination(ref([]), 3))\np.prev()\nexpect(p.page.value).toBe(1)\nexpect(p.totalPages.value).toBe(1)\nexpect(p.pageItems.value).toEqual([])` },
        { name: 'clamps the page when items shrink', code: `const { ref } = requireModule('vue')\nconst { usePagination } = requireModule('usePagination.js')\nconst items = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])\nconst p = withSetup(() => usePagination(items, 3))\np.next(); p.next(); p.next()\nitems.value = [1, 2, 3, 4]\nawait nextTick()\nexpect(p.page.value).toBe(2)\nexpect(p.pageItems.value).toEqual([4])` },
        { name: 'the page shows and navigates', code: `expect(text('.page-info')).toBe('Page 1 of 4')\nawait click('.next')\nexpect(text('.page-info')).toBe('Page 2 of 4')\nexpect(text('.row')).toBe('Task 4')` },
      ],
    },
  ],

  interview: [
    {
      id: 'frontend-system-design-product-listing',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 10,
      question: 'Design the frontend for an e-commerce product listing page with search, filters, sorting and pagination.',
      answer: 'Requirements: search by text, filter by category/price, sort, paginate; fast first load and SEO for category pages; mobile-friendly and accessible. Architecture: SSR or pre-rendering for category pages if SEO matters (e.g. Nuxt), otherwise an SPA route; a `CatalogPage` composing `SearchBox`, `FilterPanel`, `SortSelect`, `ProductGrid` and `Pagination`. State: filters, sort and page in the **route query** (shareable, back button works); results in a `useProductSearch` composable with loading/error/empty states and stale-response handling; cart in a Pinia store. Interface: `GET /api/products?q=&category=&minPrice=&sort=&page=` returning `{ items, total, page }`; cursor pagination if it becomes infinite scroll. Optimisations: debounce text search, cache responses per query, lazy-load images with fixed dimensions to avoid layout shift, code-split the route, virtualise only if lists get very long, prefetch the next page. Cross-cutting: accessible filter controls and focus management, i18n of prices, error reporting, tests for the composable and critical flows.',
      explanation: 'The URL as the source of truth for view state, a composable for server data, and presentational components are the backbone of this design.',
      whyAsked: 'The most common frontend design prompt; it touches state placement, API design, performance and SEO.',
      mistakes: ['Keeping filters only in component state (not shareable).', 'No loading/empty/error states.', 'Ignoring races between filter changes.', 'Jumping to virtualisation without a data-size requirement.'],
      followUps: ['How do you keep the URL and the filter UI in sync?', 'Offset or cursor pagination?', 'How would you cache and invalidate results?'],
      modelAnswer: 'I\'d first confirm scope: which filters, how many products, whether category pages need SEO, and mobile usage. If SEO matters I\'d server-render the listing; otherwise an SPA route is fine. The page composes a search box, filter panel, sort select, grid and pagination as presentational components. Filters, sort and page live in the route query so links are shareable and the back button works, and a `useProductSearch` composable watches the query, calls the service layer, and owns loading, error and empty states while dropping stale responses. The API would be a GET with those parameters returning items and a total. For performance: debounce the text input, cache per query, size images to avoid layout shift, and lazy-load the route. I\'d close with trade-offs — offset pagination is simpler, cursor pagination is better if we move to infinite scroll.',
    },
    {
      id: 'frontend-system-design-realtime-dashboard',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 8,
      question: 'Design a real-time operations dashboard showing live metrics and an alerts feed for many widgets.',
      answer: 'Requirements: how fresh must data be, how many widgets and data points, how many concurrent users, must alerts be acknowledged? Transport: WebSocket (or SSE if updates are one-way) with reconnection and backoff, falling back to polling; an initial REST snapshot then incremental updates. State: a connection composable/service; a Pinia store keyed by metric id holding the latest values, with large or high-frequency series in `shallowRef` and replaced immutably; widgets subscribe only to what they display. Performance: batch or throttle updates (e.g. apply at most once per animation frame), cap buffered history, lazy-load heavy chart widgets, virtualise long alert lists, pause updates for hidden tabs. Resilience: show connection status, stale-data indicators and retry. Security: authenticated socket, server-side authorization per stream.',
      explanation: 'The key insights are separating transport from state, and protecting rendering from update floods.',
      whyAsked: 'Tests real-time trade-offs and performance thinking beyond CRUD screens.',
      mistakes: ['Pushing every message straight into deep reactive state, causing excessive renders.', 'No reconnection or stale-data UX.', 'Choosing WebSockets without asking whether updates are one-way.'],
      followUps: ['WebSocket vs SSE vs polling?', 'How would you test reconnection?', 'How do you avoid memory growth over a long session?'],
      modelAnswer: 'I\'d clarify freshness, volume and whether clients send data back. For one-way updates SSE may be enough; otherwise WebSockets, always with reconnection, backoff and a REST snapshot on reconnect. A connection service feeds a store keyed by metric, and fast-changing series sit in shallowRefs that I replace rather than mutate, so Vue doesn\'t deeply track thousands of points. I\'d batch incoming messages and apply them at most once per frame, cap history, lazy-load chart libraries and virtualise the alert list. The UI shows connection state and marks stale widgets. Authorization is enforced per stream on the server.',
    },
    {
      id: 'frontend-system-design-state-placement',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'How do you decide where a piece of state lives in a Vue application?',
      answer: 'Ask who needs it and how long it must live. If only one component uses it, keep a local `ref`. If a parent and child share it, lift it to the parent and pass it down (props/events/`v-model`). If a whole subtree needs it, consider `provide/inject`. If it should be shareable or survive refresh (filters, page, selected id), put it in the URL. If unrelated parts of the app need it (user, cart), use a Pinia store. Server data is a cache with its own lifecycle — manage it in composables/stores with loading, error and invalidation. And never store derived values; compute them.',
      explanation: 'State should live at the lowest level that serves every component needing it — plus the URL for shareable view state.',
      whyAsked: 'State placement determines how maintainable an app is; it\'s the core skill behind most architecture questions.',
      mistakes: ['Making everything global.', 'Duplicating server data in several stores.', 'Forgetting the URL as a state location.', 'Storing derived values.'],
      followUps: ['When would you promote local state to a store?', 'How is server state different from client state?'],
      modelAnswer: 'I ask two questions: who needs this state, and how long should it live. One component — local ref. Parent and child — lift it up and use props, events or v-model. A deep subtree — provide/inject. Shareable or refresh-proof view state like filters — the route query. App-wide client state like the logged-in user or cart — a Pinia store. Server data I treat as a cache, with loading, error and invalidation, in a composable or store rather than scattered copies. And anything derivable is a computed, not more state. I start local and promote only when sharing actually appears.',
    },
    {
      id: 'frontend-system-design-growing-app',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A Vue app has grown to many screens and several teams. The initial bundle is large, changes in one area break others, and nobody knows where code belongs. What do you propose?',
      answer: 'Diagnose first: analyse the bundle, look at dependency graphs and where bugs come from. Then: (1) feature-based folders with clear public entry points and a shared layer for design-system components and utilities; (2) lazy-load routes and heavy features so each area ships its own chunk; (3) a service layer per feature with a shared HTTP client; (4) explicit state boundaries — feature-local composables/stores, a small set of truly global stores; (5) guardrails: lint rules for import boundaries, TypeScript, component and composable tests, CI checks, code owners; (6) incremental migration rather than a rewrite. Micro-frontends only if teams genuinely need independent deployments, given their complexity cost.',
      explanation: 'Structure, boundaries and guardrails solve most scaling pain; heavier architecture should be justified by organisational needs.',
      whyAsked: 'Senior candidates are expected to improve existing systems pragmatically, not only design greenfield ones.',
      mistakes: ['Proposing a rewrite.', 'Jumping to micro-frontends.', 'Ignoring measurement and incremental rollout.'],
      followUps: ['How would you enforce import boundaries?', 'How do you migrate incrementally without freezing feature work?'],
      modelAnswer: 'I\'d start by measuring: a bundle analysis, which modules depend on which, and where regressions come from. Then I\'d move towards feature folders with clear public APIs and a shared layer for UI components and utilities, lazy-load routes and heavy features, and give each feature its own service module on a shared HTTP client. State would be feature-local by default with only a few global stores. To keep it that way: lint rules for import boundaries, TypeScript, tests on composables and stores, and code owners. All incremental, area by area. I\'d only consider micro-frontends if teams truly need independent deployment, because they add real complexity.',
    },
    {
      id: 'frontend-system-design-spa-or-ssr',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'For a product with a public marketing site, public product pages and a logged-in admin area, would you build a plain Vue SPA or use SSR/SSG (e.g. Nuxt)?',
      answer: 'It depends on each area\'s needs. The marketing site and product pages benefit from fast first paint and reliable SEO, so SSG (static pages) or SSR suits them. The admin area is behind a login, doesn\'t need SEO and is highly interactive, so an SPA is a good fit. Options: Nuxt with per-route rendering rules (pre-render marketing, SSR products, client-only admin), or separate apps (a static site plus a Vue SPA). Trade-offs: SSR adds server infrastructure, hydration concerns and care with browser-only APIs and shared state; a pure SPA is simpler to host but weaker for first paint and SEO.',
      explanation: 'Rendering strategy is a per-page decision driven by SEO, performance and interactivity needs.',
      whyAsked: 'Checks whether you understand rendering strategies as trade-offs, not fashion.',
      mistakes: ['One answer for the whole product.', 'Claiming SPAs can\'t be indexed at all.', 'Ignoring SSR\'s operational and hydration costs.'],
      followUps: ['What is hydration, and what causes mismatches?', 'What is cross-request state pollution?'],
      modelAnswer: 'I\'d split it by area. Marketing pages rarely change, so static generation gives the fastest load and simplest hosting. Product pages need SEO and fresh data, so SSR or regenerated static pages. The admin area is behind authentication and very interactive, so a client-rendered SPA is ideal. Nuxt can do all three with route rules, or I could keep a static site and a separate SPA. The cost of SSR is a server to run, hydration mismatches to avoid, and care with module-level state and browser-only APIs — so I\'d only use it where it pays off.',
    },
    {
      id: 'frontend-system-design-permissions',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Admins can delete products; regular users cannot. How do you design permissions in the Vue frontend?',
      answer: 'The backend enforces the rule on every delete request — the frontend can never be the security boundary. In the frontend, load the user\'s roles/permissions after login into an auth store; expose helpers like `can(\'product:delete\')`; use them to hide or disable actions in components, and in route guards (`meta: { requires: \'admin\' }`) to redirect users away from pages they can\'t use. Handle 403 responses gracefully in the service layer, since permissions can change while the app is open. Keep permission checks centralised rather than scattered role-name comparisons.',
      explanation: 'Frontend permission checks are UX; server checks are security.',
      whyAsked: 'A common requirement and a security-awareness check.',
      mistakes: ['Relying on hidden buttons or route guards for security.', 'Hard-coding role names in many components.', 'Not handling 403 responses.'],
      followUps: ['How do route guards and meta fields work?', 'What if permissions change during a session?'],
      modelAnswer: 'Security lives on the server: every delete request is authorized there regardless of the UI. In Vue I\'d store the user\'s permissions in an auth store after login and expose a `can(permission)` helper. Components use it to hide or disable actions, and route guards with meta fields keep users out of pages they can\'t use. The service layer treats 403 as a normal case and shows a clear message, because permissions can change mid-session. Centralising the checks avoids role-string comparisons sprinkled across the codebase.',
    },
    {
      id: 'frontend-system-design-request-cache',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Implement `createCachedFetcher(fetcher)` in `cache.js`. It returns `get(key)`: the first call for a key calls `fetcher(key)` (which returns a promise) and caches the **promise**; concurrent and later calls for the same key share it. If the fetch **fails**, remove it from the cache so the next call retries.',
      starter: {
        files: {
          'cache.js': `export function createCachedFetcher(fetcher) {
  // TODO: cache promises by key, share concurrent calls, don't cache failures
  return (key) => fetcher(key)
}`,
          'main.js': `import { createCachedFetcher } from './cache.js'

let serverCalls = 0
const getUser = createCachedFetcher((id) => {
  serverCalls++
  return new Promise((resolve) => setTimeout(() => resolve({ id, name: 'User ' + id }), 50))
})

const app = document.getElementById('app')
app.innerHTML = '<button class="load">Load user 1 three times</button><p class="out"></p>'
app.querySelector('.load').addEventListener('click', async () => {
  const users = await Promise.all([getUser(1), getUser(1), getUser(1)])
  app.querySelector('.out').textContent = users[0].name + ' — server calls: ' + serverCalls
})`,
        },
      },
      tests: [
        { name: 'shares concurrent and later calls', code: `const { createCachedFetcher } = requireModule('cache.js')\nlet calls = 0\nconst get = createCachedFetcher(async (key) => { calls++; return key.toUpperCase() })\nconst [a, b] = await Promise.all([get('x'), get('x')])\nexpect(a).toBe('X')\nexpect(b).toBe('X')\nexpect(await get('x')).toBe('X')\nexpect(calls).toBe(1)\nexpect(await get('y')).toBe('Y')\nexpect(calls).toBe(2)` },
        { name: 'does not cache failures', code: `const { createCachedFetcher } = requireModule('cache.js')\nlet n = 0\nconst get = createCachedFetcher(async () => { n++; if (n === 1) throw new Error('down'); return 'ok' })\nlet message = ''\ntry { await get('k') } catch (e) { message = e.message }\nexpect(message).toBe('down')\nexpect(await get('k')).toBe('ok')\nexpect(n).toBe(2)` },
        { name: 'the demo makes one server call', code: `await click('.load')\nawait wait(100)\nexpect(text('.out')).toBe('User 1 — server calls: 1')` },
      ],
      hints: ['Use a `Map` from key to promise. If the key is missing, create the promise and store it before returning.', 'Attach `.catch((error) => { cache.delete(key); throw error })` to the stored promise so failures are evicted but still reported to the caller.'],
      answer: 'Keep a Map of key → promise; on a miss, store `fetcher(key)` with a `.catch` that deletes the entry and rethrows; always return the stored promise.',
      solution: {
        files: {
          'cache.js': `export function createCachedFetcher(fetcher) {
  const cache = new Map()

  return function get(key) {
    if (!cache.has(key)) {
      const promise = fetcher(key).catch((error) => {
        cache.delete(key)
        throw error
      })
      cache.set(key, promise)
    }
    return cache.get(key)
  }
}`,
          'main.js': `import { createCachedFetcher } from './cache.js'

let serverCalls = 0
const getUser = createCachedFetcher((id) => {
  serverCalls++
  return new Promise((resolve) => setTimeout(() => resolve({ id, name: 'User ' + id }), 50))
})

const app = document.getElementById('app')
app.innerHTML = '<button class="load">Load user 1 three times</button><p class="out"></p>'
app.querySelector('.load').addEventListener('click', async () => {
  const users = await Promise.all([getUser(1), getUser(1), getUser(1)])
  app.querySelector('.out').textContent = users[0].name + ' — server calls: ' + serverCalls
})`,
        },
      },
      explanation: 'Caching the promise rather than the resolved value de-duplicates in-flight requests for free. Evicting on failure prevents one outage from poisoning the cache.',
      whyAsked: 'Caching and de-duplication are core frontend architecture topics; the implementation reveals understanding of promises and failure modes.',
      mistakes: ['Caching only resolved values, so concurrent calls all hit the server.', 'Caching rejected promises forever.', 'Swallowing the error instead of rethrowing it to the caller.'],
      followUps: ['How would you add time-based expiry?', 'How would you invalidate after a mutation?', 'Where in a Vue app would this live?'],
      modelAnswer: 'I keep a Map from key to promise. On a miss I call the fetcher, attach a catch that deletes the key and rethrows, store that promise, and return it; on a hit I return the stored promise. Because the promise is cached immediately, concurrent callers share one request. Evicting on failure means a transient error doesn\'t stick. In a real app this sits in the service layer, and I\'d add expiry and explicit invalidation after mutations — invalidation is the hard part of caching.',
    },
  ],

  takeaways: [
    'Design rounds reward process: requirements → architecture → data/state → interface → optimisations → trade-offs (RADIO).',
    'Layer the app: pages, presentational components, composables/stores, services, backend — plus cross-cutting concerns.',
    'Put state where it belongs: local first, URL for shareable view state, Pinia for app-wide client state, server data as a cache.',
    'Always design loading, empty, error and success states, and handle out-of-order responses.',
    'Centralise HTTP in a service layer; the server enforces security.',
    'Justify every tool by a requirement, measure before optimising, and close with trade-offs.',
  ],
}
