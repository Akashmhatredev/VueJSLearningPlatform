// Lesson: Composable recipes — useFetch, useLocalStorage, useDebounce, useWindowSize.

const apiFile = `// A fake book server so the sandbox needs no network.
// fakeFetch(url) resolves to a Response-like object, exactly like fetch() does.
const BOOKS = [
  { id: 1, title: 'Dune', author: 'Frank Herbert' },
  { id: 2, title: 'The Hobbit', author: 'J.R.R. Tolkien' },
  { id: 3, title: 'Neuromancer', author: 'William Gibson' },
  { id: 4, title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin' },
  { id: 5, title: 'Foundation', author: 'Isaac Asimov' },
  { id: 6, title: 'Hyperion', author: 'Dan Simmons' },
  { id: 7, title: 'Kindred', author: 'Octavia E. Butler' },
  { id: 8, title: 'The Dispossessed', author: 'Ursula K. Le Guin' },
]

export const requests = [] // every URL the "server" received
const attempts = {}

export function fakeFetch(url) {
  requests.push(url)
  const q = (new URL(url, 'https://books.example').searchParams.get('q') || '').toLowerCase()
  attempts[q] = (attempts[q] || 0) + 1

  // short (broad) searches are slower — handy for seeing stale responses
  const delay = Math.max(100, 400 - q.length * 50)

  return new Promise((resolve) => {
    setTimeout(() => {
      if (q === 'flaky' && attempts[q] === 1) {
        resolve({ ok: false, status: 503, json: async () => ({ message: 'Try again' }) })
        return
      }
      const found = BOOKS.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
      )
      resolve({ ok: true, status: 200, json: async () => found })
    }, delay)
  })
}`

const useFetchFile = `// SIMPLIFIED educational useFetch — see "production needs" in the lesson.
import { ref, watch, toValue } from 'vue'
import { fakeFetch } from './api.js' // a real app would use window.fetch

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  let latestRequest = 0

  async function load(target) {
    const requestId = ++latestRequest // every call gets a ticket number
    if (!target) {
      data.value = null
      loading.value = false
      return
    }
    loading.value = true
    error.value = null
    try {
      const res = await fakeFetch(target)
      if (!res.ok) throw new Error('Request failed with status ' + res.status)
      const json = await res.json()
      if (requestId === latestRequest) data.value = json // ignore stale answers
    } catch (err) {
      if (requestId === latestRequest) error.value = err
    } finally {
      if (requestId === latestRequest) loading.value = false
    }
  }

  // url may be a plain string, a ref or a getter: toValue() reads all three
  watch(() => toValue(url), load, { immediate: true })

  return { data, error, loading, refetch: () => load(toValue(url)) }
}`

const useDebounceFile = `// SIMPLIFIED educational useDebounce
import { ref, watch, toValue, onScopeDispose } from 'vue'

export function useDebounce(source, delay = 300) {
  const debounced = ref(toValue(source))
  let timer = null

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onScopeDispose(() => clearTimeout(timer))

  return debounced
}`

const useLocalStorageFile = `// SIMPLIFIED educational useLocalStorage
import { ref, watch } from 'vue'

export function useLocalStorage(key, initialValue) {
  // SSR guard: there is no window (and no localStorage) on a server
  const canUseStorage = typeof window !== 'undefined' && !!window.localStorage

  function read() {
    if (!canUseStorage) return initialValue
    const raw = window.localStorage.getItem(key)
    if (raw === null) return initialValue
    try {
      return JSON.parse(raw)
    } catch {
      return initialValue // corrupted or hand-edited value
    }
  }

  const state = ref(read())

  watch(
    state,
    (value) => {
      if (!canUseStorage) return
      try {
        if (value === null || value === undefined) window.localStorage.removeItem(key)
        else window.localStorage.setItem(key, JSON.stringify(value))
      } catch (err) {
        console.warn('Could not save', key, err) // e.g. storage full or blocked
      }
    },
    { deep: true } // also save when an array/object is mutated in place
  )

  return state
}`

const useWindowSizeFile = `// SIMPLIFIED educational useWindowSize
import { ref, onMounted, onUnmounted } from 'vue'

export function useWindowSize() {
  const isBrowser = typeof window !== 'undefined'
  const width = ref(isBrowser ? window.innerWidth : 0)
  const height = ref(isBrowser ? window.innerHeight : 0)

  function update() {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  // onMounted never runs during server rendering, so window is safe here
  onMounted(() => {
    update()
    window.addEventListener('resize', update, { passive: true })
  })
  onUnmounted(() => window.removeEventListener('resize', update))

  return { width, height }
}`

const appFile = `<script setup>
import { ref, computed } from 'vue'
import { useDebounce } from './useDebounce.js'
import { useFetch } from './useFetch.js'
import { useLocalStorage } from './useLocalStorage.js'
import { useWindowSize } from './useWindowSize.js'

const query = ref('')
const debouncedQuery = useDebounce(query, 300)

// null means "nothing to fetch yet"
const url = computed(() => {
  const q = debouncedQuery.value.trim()
  return q ? '/api/books?q=' + encodeURIComponent(q) : null
})
const { data: books, error, loading, refetch } = useFetch(url)

const favorites = useLocalStorage('favorite-books', [])
function toggleFavorite(id) {
  const i = favorites.value.indexOf(id)
  if (i === -1) favorites.value.push(id)
  else favorites.value.splice(i, 1)
}

const { width } = useWindowSize()
const layout = computed(() => (width.value < 600 ? 'compact' : 'wide'))
</script>

<template>
  <h2>Book finder</h2>
  <input class="search" v-model="query" placeholder="Search title or author…" />
  <p class="layout">Layout: {{ layout }} ({{ width }}px)</p>

  <p v-if="loading" class="status">Loading…</p>
  <p v-else-if="error" class="error">Something went wrong: {{ error.message }}</p>
  <ul v-else-if="books" class="results">
    <li v-for="book in books" :key="book.id" class="book">
      {{ book.title }} — {{ book.author }}
      <button class="fav" @click="toggleFavorite(book.id)">
        {{ favorites.includes(book.id) ? '★' : '☆' }}
      </button>
    </li>
    <li v-if="books.length === 0" class="empty">No books found.</li>
  </ul>

  <p class="favorites">Favorites saved: {{ favorites.length }}</p>
</template>`

export default {
  id: 'composable-recipes',
  title: 'Composable recipes: fetch, storage, debounce, window size',
  summary: 'Build four everyday composables by hand — useFetch, useLocalStorage, useDebounce and useWindowSize — and learn what production versions add.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['composables-intro', 'watch', 'async-js'],
  related: ['composable-design', 'cancellation-race-conditions', 'async-ui-states', 'runtime-performance', 'rendering-strategies', 'effect-scope'],
  tags: ['composables', 'useFetch', 'useLocalStorage', 'useDebounce', 'useWindowSize', 'race conditions', 'AbortController', 'SSR', 'debounce', 'toValue'],
  apis: [
    { name: 'toValue()', summary: 'Normalises a plain value, a ref or a getter into a plain value (Vue 3.3+). Ideal for composable inputs.' },
    { name: 'onWatcherCleanup()', summary: 'Registers cleanup for the current watcher run — e.g. aborting a fetch before the next run (Vue 3.5+).' },
    { name: 'onScopeDispose()', summary: 'Registers cleanup when the current effect scope (a component or effectScope) is stopped.' },
    { name: 'AbortController', summary: 'Browser API whose signal can cancel an in-flight fetch().' },
  ],
  docs: [
    { label: 'Vue Guide — Composables (async state example)', url: 'https://vuejs.org/guide/reusability/composables.html#async-state-example' },
    { label: 'Vue Guide — Watchers: side effect cleanup', url: 'https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup' },
    { label: 'API — toValue()', url: 'https://vuejs.org/api/reactivity-utilities.html#tovalue' },
    { label: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' },
  ],

  intro: `
Some logic shows up in almost every app: *load data from an API*, *remember a setting between visits*, *wait until the user stops typing*, *react to the window size*. Each one mixes reactive state with a browser side effect and needs cleanup — exactly what composables are for.

In this lesson you build all four by hand: \`useFetch\`, \`useLocalStorage\`, \`useDebounce\` and \`useWindowSize\`, then wire them into one small *book finder*.

Every implementation here is **simplified for learning** — short enough to read in one go, correct for the cases it handles. After each recipe you get an honest list of what a production version adds.
`,

  why: `
You *could* write this logic directly in each component. Here is what that looks like for "search as you type":

\`\`\`js
let timer
watch(query, (q) => {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    loading.value = true
    const res = await fetch('/api/books?q=' + q)
    books.value = await res.json()   // …even if a newer search already finished
    loading.value = false            // …and never reset if fetch throws
  }, 300)
})
// …forgot to clear the timer on unmount
\`\`\`

Three bugs in twelve lines, and they'd be copy-pasted into every search box. Recipes turn each concern into a small, named, tested building block:

\`\`\`js
const debounced = useDebounce(query, 300)
const { data, error, loading } = useFetch(() => '/api/books?q=' + debounced.value)
\`\`\`

Fix a bug once, every search box gets the fix.
`,

  eli15: `
Imagine a kitchen with four handy gadgets.

- **useFetch** is a waiter: you hand over an order (a URL), it comes back with the dish (data), says "still cooking" (loading) or "the kitchen burnt it" (error). If you change your order, it ignores the plate for your *old* order.
- **useLocalStorage** is a fridge: whatever you put in is still there tomorrow.
- **useDebounce** is a patient friend: while you're still talking it waits; only when you pause for a moment does it pass your message on.
- **useWindowSize** is a ruler stuck to the window: whenever the window changes size, it tells you the new measurements.

You build each gadget once, then any component can grab it from the drawer.
`,

  analogy: {
    title: 'A drawer of kitchen gadgets',
    body: `
Nobody builds a new can opener every time they open a can. You buy (or make) one good gadget and keep it in a drawer.

Recipes are those gadgets. Each one does one job, has a clear handle (its arguments) and a clear result (its returned refs). A good gadget also cleans up after itself — the can opener doesn't leave sharp lids on the counter, and a good composable doesn't leave timers and listeners running after the component is gone.
`,
    mapping: [
      ['the waiter', '`useFetch(url)` → `{ data, error, loading }`'],
      ['ignoring the plate for an old order', 'the stale-response guard (latest request wins)'],
      ['the fridge', '`useLocalStorage(key, initial)` — survives reloads'],
      ['the patient friend', '`useDebounce(source, delay)` — updates after a pause'],
      ['the ruler on the window', '`useWindowSize()` → `{ width, height }`'],
      ['cleaning the counter', 'removing listeners / clearing timers on unmount'],
    ],
  },

  visual: {
    type: 'performance',
    props: { demo: 'debounce' },
    title: 'What debouncing saves',
    caption: 'Type into the demo: every keystroke is counted, but the debounced handler only runs once you pause. The counts are measured live in your browser.',
    alt: 'A live demo with a text input and two counters: raw input events, which increase on every keystroke, and debounced handler calls, which increase only after typing pauses.',
  },

  syntax: [
    `
All four recipes follow the same skeleton from [the composables intro](lesson:composables-intro): create refs → start a side effect → keep the refs updated → clean up → return refs.

Two newer Vue helpers make recipes much nicer:

- **\`toValue(x)\`** (Vue 3.3+) returns \`x.value\` for a ref, calls \`x()\` for a getter, and returns anything else unchanged. Accepting "a value, a ref or a getter" and reading it with \`toValue()\` makes a composable flexible *and* reactive.
- **\`onWatcherCleanup(fn)\`** (Vue 3.5+) registers cleanup for the *current* watcher run — perfect for aborting a request before the next one starts. On older 3.x versions use the \`onCleanup\` argument the watch callback receives.
`,
    `
#### Recipe 1 — useFetch
`,
    { code: useFetchFile, lang: 'js', title: 'useFetch.js (simplified)' },
    {
      callout: 'warn',
      title: 'Simplified — what production needs',
      text: 'Cancel in-flight requests with `AbortController` (not just ignore them), timeouts, retries with backoff for transient errors, caching and de-duplication of identical requests, consistent error objects (status, body), and SSR-aware fetching so data loads on the server and hydrates without a second request. Data-fetching libraries — e.g. TanStack Query for Vue or Pinia Colada (third-party), or Nuxt\'s own `useFetch` (Nuxt, not Vue core) — provide these.',
    },
    `
#### Recipe 2 — useLocalStorage
`,
    { code: useLocalStorageFile, lang: 'js', title: 'useLocalStorage.js (simplified)' },
    {
      callout: 'warn',
      title: 'Simplified — what production needs',
      text: 'Listen to the window `storage` event so other tabs stay in sync (and remove that listener on cleanup); custom serializers for Dates, Maps and Sets; versioned keys so old data shapes don\'t crash new code; and a hydration plan for SSR — the server renders `initialValue`, so read storage in `onMounted` to avoid a mismatch. Never store secrets or auth tokens you cannot afford to leak: any script on the page (including injected ones) can read localStorage.',
    },
    `
#### Recipe 3 — useDebounce
`,
    { code: useDebounceFile, lang: 'js', title: 'useDebounce.js (simplified)' },
    {
      callout: 'warn',
      title: 'Simplified — what production needs',
      text: 'Options for `maxWait` (fire at least every N ms during continuous typing) and leading/trailing edges, a way to flush or cancel manually, and often a debounced *function* variant (`useDebounceFn`) for handlers rather than values.',
    },
    `
#### Recipe 4 — useWindowSize
`,
    { code: useWindowSizeFile, lang: 'js', title: 'useWindowSize.js (simplified)' },
    {
      callout: 'warn',
      title: 'Simplified — what production needs',
      text: 'Throttle updates (e.g. with `requestAnimationFrame`) so heavy layouts don\'t recompute on every resize event; share one listener between many components; and a sensible server value. For breakpoints, `window.matchMedia()` is usually a better fit than raw widths — and for purely visual changes, CSS media queries beat JavaScript entirely.',
    },
    {
      callout: 'note',
      title: 'Not reinventing the wheel',
      text: 'The community library VueUse (third-party, not part of Vue) ships tested versions of all four recipes and many more. Building them yourself first means you can read, debug and choose between such libraries confidently.',
    },
  ],

  walkthrough: {
    title: 'useFetch.js',
    lang: 'js',
    code: useFetchFile,
    intro: 'The most subtle recipe. Step through how it stays correct when the URL changes faster than the server answers.',
    steps: [
      { lines: [2, 3], text: '`toValue` comes from Vue (3.3+). `fakeFetch` stands in for the browser\'s `fetch()` because the sandbox has no network — it returns the same kind of Response-like object.' },
      { lines: [6, 8], text: 'Three refs describe any request honestly: the result, the failure, and whether we\'re waiting. Templates can render all three states.' },
      { lines: [9], text: '`latestRequest` is a plain counter, not a ref — the UI never shows it. It is the heart of the stale-response guard.' },
      { lines: [11, 12], text: 'Every load takes a ticket number. If a newer load starts while this one is still waiting, the newer one gets a bigger number.' },
      { lines: [13, 17], text: 'A falsy URL means "nothing to fetch" (e.g. an empty search box). Taking a ticket first means any older request still in flight becomes stale.' },
      { lines: [21, 22], text: '`fetch()` only rejects on network failure — a 404 or 503 still resolves. Checking `res.ok` turns HTTP errors into real errors.' },
      { lines: [24], text: 'Only the newest request may write `data`. A slow, outdated answer arriving late is ignored instead of overwriting fresher results.' },
      { lines: [25, 29], text: '`catch` and `finally` use the same guard, so an old request can neither show an error nor switch off the spinner of a newer one.' },
      { lines: [32, 33], text: 'Watching a getter that calls `toValue(url)` makes the composable accept a string, a ref or a getter — and refetch automatically whenever it changes. `immediate: true` loads once right away.' },
      { lines: [35], text: 'Return refs plus a `refetch()` for retry buttons.' },
    ],
  },

  playground: {
    title: 'Book finder',
    objective: 'See four recipes cooperate, then extend them: smarter searching, a retry button, persistence and a breakpoint.',
    files: {
      'App.vue': appFile,
      'useFetch.js': useFetchFile,
      'useDebounce.js': useDebounceFile,
      'useLocalStorage.js': useLocalStorageFile,
      'useWindowSize.js': useWindowSizeFile,
      'api.js': apiFile,
    },
    expected: 'A search box. Type **le guin**: nothing happens while you type, then after a 300 ms pause *Loading…* appears and two books show up. Star a book — the *Favorites saved* count changes and survives a re-run while the preview stays open. The layout line reports your preview width.',
    experiments: [
      {
        id: 'min-length',
        task: 'One-letter searches waste requests. Change `App.vue` so a search only runs when the trimmed query has **at least 2 characters**.',
        hint: 'Only the `url` computed needs to change: return `null` unless `q.length >= 2`.',
        tests: [
          {
            name: 'no request for one character, a request for two',
            code: `const { requests } = requireModule('api.js')
await type('.search', 'd')
await wait(450)
expect(requests.length).toBe(0)
expect(exists('.book')).toBe(false)
await type('.search', 'du')
await wait(750)
expect(requests.length).toBe(1)
expect(findAll('.book').length).toBeGreaterThan(0)`,
          },
        ],
        explain: 'Because `useFetch` watches whatever the URL getter returns, the decision "should we fetch at all?" lives entirely in the caller. Returning `null` means "nothing to fetch" — the composable didn\'t need to change.',
      },
      {
        id: 'retry',
        task: 'The fake server fails the **first** request for the query `flaky`. Add a **Retry** button with `class="retry"` next to the error message that calls `refetch()`.',
        hint: 'Inside the `<p v-else-if="error" class="error">…</p>`, add `<button class="retry" @click="refetch">Retry</button>`. `refetch` is already destructured.',
        tests: [
          {
            name: 'Retry recovers from a failed request',
            code: `await type('.search', 'flaky')
await wait(600)
expect(exists('.error')).toBe(true)
const btn = find('.retry')
expect(btn).toBeTruthy()
await click(btn)
await wait(350)
expect(exists('.error')).toBe(false)
expect(exists('.results')).toBe(true)`,
          },
        ],
        explain: 'Exposing `refetch()` from the composable gives callers control without leaking internals. The `error` ref turned an HTTP 503 into UI the user can act on — the "error state" production code must always render.',
      },
      {
        id: 'persist-query',
        task: 'Make the search box **remember the last query** across reloads: replace `const query = ref(\'\')` with `useLocalStorage(\'last-query\', \'\')`.',
        hint: '`useLocalStorage` already returns a ref, so `v-model="query"` and `useDebounce(query, 300)` keep working unchanged.',
        tests: [
          {
            name: 'typing saves the query to localStorage',
            code: `try {
  await type('.search', 'dune')
  expect(JSON.parse(localStorage.getItem('last-query'))).toBe('dune')
} finally {
  localStorage.removeItem('last-query')
}`,
          },
        ],
        explain: 'Recipes compose because they all speak the same language: refs. A ref from `useLocalStorage` can feed `useDebounce`, whose ref feeds a computed URL, which feeds `useFetch`. Each piece only knows its own job.',
      },
      {
        id: 'breakpoint',
        task: 'Designers moved the breakpoint: the layout should be **compact below 700px**. Update the `layout` computed.',
        hint: 'Change `600` to `700` in the `layout` computed.',
        tests: [
          {
            name: 'compact at 650px, wide at 800px',
            code: `const original = window.innerWidth
try {
  window.innerWidth = 650
  window.dispatchEvent(new Event('resize'))
  await flush()
  expect(text('.layout')).toContain('compact')
  window.innerWidth = 800
  window.dispatchEvent(new Event('resize'))
  await flush()
  expect(text('.layout')).toContain('wide')
} finally {
  window.innerWidth = original
  window.dispatchEvent(new Event('resize'))
}`,
          },
        ],
        explain: '`width` is a ref updated by a `resize` listener, so the computed re-evaluates on every resize. Reserve this for *logic* that depends on size (e.g. rendering a different component). If only styles change, a CSS media query does the job with no JavaScript at all.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'The search pipeline, ref by ref',
    props: {
      nodes: [
        { id: 'input', label: 'query ref', note: 'v-model on the input', tone: 'paper' },
        { id: 'debounce', label: 'useDebounce', note: 'waits 300 ms', tone: 'acid' },
        { id: 'url', label: 'url computed', note: '/api/books?q=…', tone: 'paper' },
        { id: 'fetch', label: 'useFetch', note: 'data · error · loading', tone: 'cobalt' },
        { id: 'ui', label: 'template', note: 'list / spinner / error', tone: 'ink' },
      ],
      edges: [
        { from: 'input', to: 'debounce', label: 'every keystroke' },
        { from: 'debounce', to: 'url', label: 'after a pause' },
        { from: 'url', to: 'fetch', label: 'watch(toValue)' },
        { from: 'fetch', to: 'ui', label: 'refs' },
      ],
      layout: 'row',
      steps: [
        { focus: ['input'], text: 'The user types **l-e- -g-u-i-n**. Each keystroke updates the `query` ref through `v-model`.' },
        { focus: ['debounce'], edges: ['input->debounce'], text: '`useDebounce` restarts a 300 ms timer on every change. While typing continues, nothing passes through.' },
        { focus: ['url'], edges: ['debounce->url'], text: 'The user pauses. The debounced ref finally updates once, and the `url` computed produces `/api/books?q=le%20guin`.' },
        { focus: ['fetch'], edges: ['url->fetch'], text: '`useFetch` is watching `toValue(url)`. A new URL means a new request with a new ticket number; `loading` becomes `true`.' },
        { focus: ['fetch'], text: 'If an older, slower request answers *after* this one, its ticket number is out of date and its result is thrown away. Latest request wins.' },
        { focus: ['ui'], edges: ['fetch->ui'], text: 'The template reads `loading`, `error` and `data` and shows the right state. No component code mentioned timers, tickets or listeners.' },
      ],
    },
    caption: 'Small recipes connected by refs: each step only knows its own job.',
    alt: 'A row of five boxes connected by arrows: query ref, useDebounce, url computed, useFetch, template. Steps explain how keystrokes are debounced, become a URL, trigger a fetch guarded against stale responses, and finally render.',
  },

  internals: {
    beginner: `
Every recipe is the same trick: a ref the component can read, plus some browser machinery (a timer, a request, an event listener) that keeps the ref up to date. The component only sees the ref. When the component goes away, the composable switches the machinery off so nothing keeps running in the background.
`,
    technical: [
      `
**Race conditions in useFetch.** Requests don't finish in the order they start. Type "d", pause, then type "dune": the broad "d" search might answer *after* "dune". Without a guard, the old answer overwrites the new one and the screen shows results for a query the user no longer has. The simplified recipe *ignores* stale answers with a ticket counter. A production version also *cancels* them, freeing the network:
`,
      {
        code: `import { ref, watch, toValue, onWatcherCleanup } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  watch(() => toValue(url), async (target) => {
    if (!target) return
    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort()) // Vue 3.5+: before the next run or on stop
    loading.value = true
    error.value = null
    try {
      const res = await fetch(target, { signal: controller.signal })
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
      data.value = await res.json()
    } catch (err) {
      if (err.name !== 'AbortError') error.value = err
    } finally {
      if (!controller.signal.aborted) loading.value = false
    }
  }, { immediate: true })

  return { data, error, loading }
}`,
        lang: 'js',
        title: 'cancellation with AbortController (still a sketch)',
        static: true,
      },
      `
\`onWatcherCleanup()\` must be called synchronously — *before* the first \`await\` — because Vue only knows which watcher is running during the synchronous part. On Vue versions before 3.5, use the third argument of the watch callback: \`watch(src, async (value, old, onCleanup) => { onCleanup(() => controller.abort()) })\`. Read more in [Cancellation & race conditions](lesson:cancellation-race-conditions).

**Why \`{ deep: true }\` in useLocalStorage.** \`watch(ref)\` on its own only fires when \`.value\` is *replaced*. \`favorites.value.push(3)\` mutates the array in place, so without \`deep\` nothing would be saved.

**Cleanup choices.** \`useDebounce\` uses \`onScopeDispose()\`, which runs when *any* effect scope stops — a component unmounting, or a manual [\`effectScope()\`](lesson:effect-scope). \`useWindowSize\` uses \`onMounted\`/\`onUnmounted\` because it *wants* to wait for the browser: \`onMounted\` never runs during server-side rendering.

**SSR guards.** During SSR your component's \`setup\` runs on the server, where \`window\`, \`document\` and \`localStorage\` don't exist. Touching them at setup time throws \`ReferenceError\`. Either check \`typeof window !== 'undefined'\` or move browser access into \`onMounted\`. See [CSR, SSR & SSG](lesson:rendering-strategies).
`,
    ],
    production: `
- **Fetching:** cancellation, retries with backoff, request de-duplication, caching with invalidation, pagination, optimistic updates and SSR hydration add up to a lot. Many teams adopt a data-fetching library (TanStack Query for Vue, Pinia Colada — both third-party; Nuxt users have Nuxt's \`useFetch\`). Know the recipe; choose a library deliberately.
- **Storage:** treat stored data as untrusted input (users edit it, old versions wrote different shapes). Validate after \`JSON.parse\`, version your keys (\`settings:v2\`), and remember quota errors and private-mode restrictions.
- **Debounce vs throttle:** debounce waits for a pause (search boxes, autosave). Throttle fires at most once per interval (scroll and resize handlers, analytics). Pick by the experience you want.
- **Window size:** prefer CSS for layout. When JavaScript truly needs it, share one throttled listener and expose \`matchMedia\`-based booleans (\`isMobile\`) rather than raw pixel widths sprinkled through components.
- **Test them:** recipes are perfect unit-test targets — see [Designing & testing composables](lesson:composable-design).
`,
  },

  mistakes: [
    {
      title: 'Letting a slow, stale response overwrite fresh data',
      wrong: { code: `watch(query, async (q) => {
  const res = await fetch('/api/books?q=' + q)
  books.value = await res.json()   // whichever answer arrives LAST wins
})`, lang: 'js' },
      right: { code: `let latest = 0
watch(query, async (q) => {
  const id = ++latest
  const res = await fetch('/api/books?q=' + q)
  const json = await res.json()
  if (id === latest) books.value = json   // only the newest request writes
})`, lang: 'js' },
      explanation: 'Network order is not request order. Guard writes with a request id (or cancel the previous request with `AbortController`) so the UI always matches the latest input.',
    },
    {
      title: 'Treating every resolved fetch as a success',
      wrong: { code: `const res = await fetch(url)
data.value = await res.json()   // a 404 page or error JSON lands in data`, lang: 'js' },
      right: { code: `const res = await fetch(url)
if (!res.ok) throw new Error('Request failed with status ' + res.status)
data.value = await res.json()`, lang: 'js' },
      explanation: '`fetch()` only rejects when the network fails. HTTP errors (404, 500, 503) resolve normally with `res.ok === false`. Check it, or your "data" may be an error payload.',
    },
    {
      title: 'Touching `window` or `localStorage` at setup time in an SSR app',
      wrong: { code: `export function useTheme() {
  const theme = ref(localStorage.getItem('theme') || 'light')  // ReferenceError on the server
  return { theme }
}`, lang: 'js' },
      right: { code: `export function useTheme() {
  const theme = ref('light')
  onMounted(() => {                   // browser only
    theme.value = localStorage.getItem('theme') || 'light'
  })
  return { theme }
}`, lang: 'js' },
      explanation: 'Server rendering runs setup in Node, where there is no `window`. Guard with `typeof window !== \'undefined\'` or read browser APIs in `onMounted` — the latter also avoids hydration mismatches.',
    },
    {
      title: 'Forgetting `deep: true` when persisting arrays or objects',
      wrong: { code: `watch(favorites, (v) => localStorage.setItem(key, JSON.stringify(v)))
favorites.value.push(42)   // not saved`, lang: 'js' },
      right: { code: `watch(favorites, (v) => localStorage.setItem(key, JSON.stringify(v)), { deep: true })
favorites.value.push(42)   // saved`, lang: 'js' },
      explanation: 'Watching a ref directly reacts to `.value` being replaced. In-place mutations need a deep watcher.',
    },
  ],

  debugging: [
    {
      symptom: 'Search results sometimes show the previous query\'s results.',
      cause: 'A slower, older request resolved after the newer one and overwrote `data`.',
      fix: 'Guard writes with a request id, or abort the previous request (`AbortController` + `onWatcherCleanup` in 3.5+).',
    },
    {
      symptom: 'The spinner never disappears after an error.',
      cause: '`loading.value = false` sits after the `await` that threw, so it never runs.',
      fix: 'Reset loading in a `finally` block (guarded so stale requests don\'t switch off a newer spinner).',
    },
    {
      symptom: '`ReferenceError: window is not defined` (or `localStorage is not defined`) when rendering on the server.',
      cause: 'Browser APIs are accessed during setup, which also runs on the server in SSR.',
      fix: 'Add a `typeof window !== \'undefined\'` guard or move the code into `onMounted`.',
    },
    {
      symptom: 'Hydration mismatch warning for a value read from localStorage.',
      cause: 'The server rendered the default value, the client rendered the stored value during hydration.',
      fix: 'Render the default first and read storage in `onMounted`, accepting a brief update after load.',
    },
    {
      symptom: 'A debounced value updates after the component is already gone (or errors appear after navigation).',
      cause: 'The pending `setTimeout` is not cleared on unmount.',
      fix: 'Clear the timer in `onScopeDispose()` / `onUnmounted()`.',
    },
  ],

  bestPractices: [
    'Expose request state honestly: always return `data`, `error` and `loading` and render all three.',
    'Make the latest request win — guard writes, and cancel in-flight requests in production code.',
    'Accept a value, ref or getter and read it with `toValue()` (3.3+), so callers can pass reactive inputs.',
    'Guard every browser API (`window`, `document`, `localStorage`) for SSR, or touch it only in `onMounted`.',
    'Clean up timers and listeners in `onScopeDispose()` / `onUnmounted()`, using the same function reference you added.',
    'Label hand-rolled recipes as simplified and graduate to a well-tested library when requirements grow.',
    'Prefer CSS media queries over `useWindowSize` when only the styling changes.',
  ],

  useCases: [
    '`useFetch`: a product page loading details by id, a dashboard widget, an autocomplete.',
    '`useLocalStorage`: theme preference, dismissed banners, draft text, "recently viewed" lists.',
    '`useDebounce`: search-as-you-type, autosave, validating a username while typing.',
    '`useWindowSize`: choosing between a table and a card list, sizing a canvas or chart.',
  ],

  whenToUse: {
    use: [
      'The same side-effect logic (fetching, persisting, timing, listening) appears in more than one component.',
      'The logic has subtle edge cases (races, cleanup, SSR) that you want solved once and tested.',
      'You want to compose behaviours — debounce → fetch → persist — through refs.',
    ],
    avoid: [
      'Your app already uses a data-fetching library or VueUse that covers the case — don\'t maintain a second, weaker version.',
      'Styling-only responsiveness — CSS media/container queries are simpler and faster.',
      'Sensitive data (tokens, personal data) — don\'t persist it in localStorage just because a recipe makes it easy.',
    ],
  },

  comparison: {
    title: 'The four recipes at a glance',
    headers: ['', 'useFetch', 'useLocalStorage', 'useDebounce', 'useWindowSize'],
    rows: [
      ['Returns', '`{ data, error, loading, refetch }`', 'a ref', 'a ref', '`{ width, height }`'],
      ['Side effect', 'network request', 'storage writes', 'timer', 'resize listener'],
      ['Cleanup needed', 'ignore/abort stale requests', 'none (+ `storage` listener in prod)', 'clear the timer', 'remove the listener'],
      ['SSR concern', 'fetch on server and hydrate', 'no storage on server', 'none', 'no window on server'],
      ['Main production gap', 'cancellation, retries, caching', 'cross-tab sync, validation', 'maxWait, cancel/flush', 'throttling, shared listener'],
    ],
    note: 'Every recipe above is a simplified teaching version. Compare with the VueUse implementations (third-party) once you are comfortable.',
  },

  quiz: [
    {
      id: 'composable-recipes-q1',
      type: 'mcq',
      prompt: 'Why does the simplified `useFetch` give every request a number (`requestId`) and compare it with `latestRequest`?',
      options: [
        { text: 'So a slower, older response cannot overwrite the result of a newer request.' },
        { text: 'So the server can cache responses by id.', why: 'The id never leaves the browser; the server never sees it.' },
        { text: 'Because `fetch()` requires a unique id per call.', why: '`fetch()` has no such requirement.' },
        { text: 'To count how many requests were made for analytics.', why: 'It is a correctness guard, not a statistic.' },
      ],
      answer: 0,
      explanation: 'Responses can arrive out of order. Only the request with the latest id may write `data`, `error` or `loading`.',
    },
    {
      id: 'composable-recipes-q2',
      type: 'output',
      prompt: '`const debounced = useDebounce(query, 300)`. The user types `v`, `vu`, `vue` — 100 ms apart — then stops. How does `debounced` change?',
      options: [
        { text: 'It changes three times: v, vu, vue', why: 'Each new keystroke clears the pending timer, so the earlier values never get through.' },
        { text: 'It changes once, to "vue", about 300 ms after the last keystroke' },
        { text: 'It changes once, to "v"', why: 'The first value\'s timer is cleared by the second keystroke.' },
        { text: 'It never changes', why: 'After the last keystroke nothing clears the timer, so it fires.' },
      ],
      answer: 1,
      explanation: 'Every change restarts the 300 ms timer. Only after a 300 ms pause does the latest value pass through.',
    },
    {
      id: 'composable-recipes-q3',
      type: 'bug',
      prompt: '`favorites.value.push(42)` updates the screen but is gone after a reload. Click the line that causes the bug.',
      code: {
        lang: 'js',
        code: `export function useLocalStorage(key, initial) {
  const stored = localStorage.getItem(key)
  const state = ref(stored ? JSON.parse(stored) : initial)
  watch(state, (value) => {
    localStorage.setItem(key, JSON.stringify(value))
  })
  return state
}`,
      },
      answerLine: 4,
      explanation: 'Watching a ref directly only fires when `.value` is replaced. `push()` mutates in place, so the watcher never runs. Add `{ deep: true }` as the third argument of `watch`.',
    },
    {
      id: 'composable-recipes-q4',
      type: 'fill',
      prompt: 'Complete `useDebounce` so it accepts a value, ref or getter, and clears its timer when the component (or scope) goes away.',
      code: {
        lang: 'js',
        code: `export function useDebounce(source, delay = 300) {
  const debounced = ref(___(source))
  let timer
  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => (debounced.value = value), delay)
  })
  ___(() => clearTimeout(timer))
  return debounced
}`,
      },
      answer: [['toValue'], ['onScopeDispose', 'onUnmounted', 'onBeforeUnmount']],
      explanation: '`toValue()` (3.3+) reads refs, getters and plain values. `onScopeDispose()` runs on unmount and when a manual effect scope stops; `onUnmounted()` also works inside components.',
    },
    {
      id: 'composable-recipes-q5',
      type: 'mcq',
      prompt: 'Select **all** the things a production `useFetch` typically adds to the simplified version in this lesson.',
      options: [
        { text: 'Cancelling in-flight requests with `AbortController`' },
        { text: 'Caching and de-duplicating identical requests' },
        { text: 'Retries with backoff for transient failures' },
        { text: 'Turning non-2xx responses into errors', why: 'The simplified version already does this with `if (!res.ok) throw …`.' },
        { text: 'Storing every response on `window` so other components can read it', why: 'Global mutable state is a bug factory; caching belongs in a dedicated cache layer or store.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Cancellation, caching/dedupe and retries are the usual production additions (alongside timeouts and SSR support). The simplified version already checks `res.ok`.',
    },
    {
      id: 'composable-recipes-q6',
      type: 'mcq',
      prompt: 'Why does `useWindowSize` add its `resize` listener inside `onMounted()` rather than directly in the function body?',
      options: [
        { text: '`onMounted` only runs in the browser, never during server-side rendering, so `window` is guaranteed to exist.' },
        { text: '`window` does not exist until Vue mounts the first component.', why: 'In a browser `window` exists before any script runs. The problem is the server, where it never exists.' },
        { text: 'Listeners added during setup are ignored by the browser.', why: 'The browser accepts listeners at any time; the concern is SSR and pairing with cleanup.' },
        { text: 'It makes resize events fire faster.', why: 'Where you register a listener has no effect on how often the browser fires the event.' },
      ],
      answer: 0,
      explanation: 'Server rendering runs `setup` but never mounts, so mount-time code is a natural SSR guard — and pairs neatly with `onUnmounted` for removal.',
    },
    {
      id: 'composable-recipes-q7',
      type: 'short',
      prompt: 'In two or three sentences: why debounce a search-as-you-type box, and what could go wrong even with debouncing?',
      answer: 'Without debouncing, every keystroke sends a request, wasting bandwidth and server work and making results flicker. Debouncing waits for a pause so typically one request is sent per "thought". Even so, requests can still finish out of order (a pause, more typing, another pause), so you still need a stale-response guard or cancellation.',
    },
  ],

  exercises: [
    {
      id: 'build-use-local-storage',
      title: 'Build useLocalStorage()',
      difficulty: 'intermediate',
      prompt: `
Implement \`useLocalStorage(key, initialValue)\` in \`useLocalStorage.js\`. It returns **a ref** that:

1. starts with the parsed JSON stored under \`key\`, or \`initialValue\` when nothing is stored;
2. falls back to \`initialValue\` (without throwing) when the stored text is **not valid JSON**;
3. saves \`JSON.stringify(value)\` to \`localStorage\` whenever the value changes — **including in-place changes** like \`list.value.push(x)\`;
4. **removes** the key when the value is set to \`null\`;
5. guards for SSR: if \`typeof window === 'undefined'\`, never touch \`localStorage\`.

\`App.vue\` uses it for a theme toggle (\`button.theme\`, text in \`.current\`) and a draft note (\`textarea.note\`). The tests mostly call your composable directly.
`,
      files: {
        'useLocalStorage.js': `import { ref, watch } from 'vue'

export function useLocalStorage(key, initialValue) {
  // TODO: read the stored value, keep storage in sync, guard for SSR
  return ref(initialValue)
}`,
        'App.vue': `<script setup>
import { useLocalStorage } from './useLocalStorage.js'

const theme = useLocalStorage('demo-theme', 'light')
const note = useLocalStorage('demo-note', '')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <button class="theme" @click="toggleTheme">Toggle theme</button>
  <p class="current">Theme: {{ theme }}</p>
  <textarea class="note" v-model="note" placeholder="Draft…"></textarea>
</template>`,
      },
      hints: [
        'Write a small `read()` helper: `getItem(key)` → `null` means "use initialValue"; otherwise `JSON.parse` inside `try/catch`.',
        'Create `const state = ref(read())` and `watch(state, (value) => { … }, { deep: true })`. Inside, call `removeItem` for `null`/`undefined`, otherwise `setItem(key, JSON.stringify(value))`.',
        'Compute `const canUseStorage = typeof window !== \'undefined\' && !!window.localStorage` once, and return early from `read()` and the watcher when it is false.',
      ],
      solution: {
        explanation: 'Reading happens once, writing happens in a deep watcher, so replacing *and* mutating the value both persist. Parsing is wrapped in `try/catch` because storage is user-editable input, and the SSR guard keeps the composable safe to import anywhere. This is still a simplified version: no cross-tab sync via the `storage` event and no schema validation.',
        files: {
          'useLocalStorage.js': `import { ref, watch } from 'vue'

export function useLocalStorage(key, initialValue) {
  const canUseStorage = typeof window !== 'undefined' && !!window.localStorage

  function read() {
    if (!canUseStorage) return initialValue
    const raw = window.localStorage.getItem(key)
    if (raw === null) return initialValue
    try {
      return JSON.parse(raw)
    } catch {
      return initialValue
    }
  }

  const state = ref(read())

  watch(
    state,
    (value) => {
      if (!canUseStorage) return
      if (value === null || value === undefined) window.localStorage.removeItem(key)
      else window.localStorage.setItem(key, JSON.stringify(value))
    },
    { deep: true }
  )

  return state
}`,
          'App.vue': `<script setup>
import { useLocalStorage } from './useLocalStorage.js'

const theme = useLocalStorage('demo-theme', 'light')
const note = useLocalStorage('demo-note', '')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <button class="theme" @click="toggleTheme">Toggle theme</button>
  <p class="current">Theme: {{ theme }}</p>
  <textarea class="note" v-model="note" placeholder="Draft…"></textarea>
</template>`,
        },
      },
      tests: [
        {
          name: 'uses initialValue when nothing is stored',
          code: `localStorage.removeItem('ex-missing')
const { useLocalStorage } = requireModule('useLocalStorage.js')
const s = withSetup(() => useLocalStorage('ex-missing', 5))
expect(s.value).toBe(5)`,
        },
        {
          name: 'reads an existing JSON value',
          code: `try {
  localStorage.setItem('ex-read', JSON.stringify({ theme: 'dark' }))
  const { useLocalStorage } = requireModule('useLocalStorage.js')
  const s = withSetup(() => useLocalStorage('ex-read', { theme: 'light' }))
  expect(s.value.theme).toBe('dark')
} finally {
  localStorage.removeItem('ex-read')
}`,
        },
        {
          name: 'falls back to initialValue on invalid JSON',
          code: `try {
  localStorage.setItem('ex-bad', '{oops')
  const { useLocalStorage } = requireModule('useLocalStorage.js')
  const s = withSetup(() => useLocalStorage('ex-bad', 'fallback'))
  expect(s.value).toBe('fallback')
} finally {
  localStorage.removeItem('ex-bad')
}`,
        },
        {
          name: 'saves replaced values',
          code: `try {
  const { useLocalStorage } = requireModule('useLocalStorage.js')
  const s = withSetup(() => useLocalStorage('ex-write', 'a'))
  s.value = 'b'
  await nextTick()
  expect(localStorage.getItem('ex-write')).toBe('"b"')
} finally {
  localStorage.removeItem('ex-write')
}`,
        },
        {
          name: 'saves in-place mutations (deep)',
          code: `try {
  const { useLocalStorage } = requireModule('useLocalStorage.js')
  const s = withSetup(() => useLocalStorage('ex-deep', []))
  s.value.push('dune')
  await nextTick()
  expect(JSON.parse(localStorage.getItem('ex-deep'))).toEqual(['dune'])
} finally {
  localStorage.removeItem('ex-deep')
}`,
        },
        {
          name: 'removes the key when set to null',
          code: `try {
  localStorage.setItem('ex-null', '"x"')
  const { useLocalStorage } = requireModule('useLocalStorage.js')
  const s = withSetup(() => useLocalStorage('ex-null', 'x'))
  s.value = null
  await nextTick()
  expect(localStorage.getItem('ex-null')).toBeNull()
} finally {
  localStorage.removeItem('ex-null')
}`,
        },
        {
          name: 'the theme toggle persists',
          code: `try {
  await click('.theme')
  expect(text('.current')).toContain('dark')
  expect(localStorage.getItem('demo-theme')).toBe('"dark"')
} finally {
  localStorage.removeItem('demo-theme')
}`,
        },
      ],
    },
    {
      id: 'fix-use-fetch',
      title: 'Make useFetch honest: errors and stale responses',
      difficulty: 'intermediate',
      prompt: `
\`useFetch.js\` contains a naive fetch composable. Click **Ada** then quickly **Grace** in the preview: Ada's slow answer arrives last and wins. Click **Missing**: the error is never shown and the spinner logic is fragile.

Fix \`useFetch(url)\` (url may be a string, ref or getter) so that it returns \`{ data, error, loading, refetch }\` and:

1. sets \`loading\` to \`true\` while a request is in flight and back to \`false\` when it finishes — **also after errors**;
2. when \`res.ok\` is \`false\`, sets \`error\` to an \`Error\` whose message contains the status code (e.g. \`404\`) and sets \`data\` to \`null\`;
3. clears \`error\` when a new request starts;
4. **ignores stale responses**: only the most recently started request may change \`data\`, \`error\` or \`loading\`;
5. \`refetch()\` re-runs the request for the current URL.

\`api.js\` simulates the server: \`/users/1\` (Ada) answers after 300 ms, \`/users/2\` (Grace) after 50 ms, \`/users/404\` responds with status 404 after 50 ms. The app shows \`.name\`, \`.error\` and \`.loading\`, with buttons \`.user-1\`, \`.user-2\` and \`.missing\`.
`,
      files: {
        'api.js': `const USERS = { 1: { id: 1, name: 'Ada Lovelace' }, 2: { id: 2, name: 'Grace Hopper' } }
const DELAYS = { '/users/1': 300, '/users/2': 50 }

export const requests = []

export function fakeFetch(url) {
  requests.push(url)
  const id = url.split('/').pop()
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = USERS[id]
      if (!user) resolve({ ok: false, status: 404, json: async () => ({ message: 'Not found' }) })
      else resolve({ ok: true, status: 200, json: async () => user })
    }, DELAYS[url] ?? 50)
  })
}`,
        'useFetch.js': `import { ref, watch, toValue } from 'vue'
import { fakeFetch } from './api.js'

// Naive version: no error handling, no stale-response guard
export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  async function load() {
    loading.value = true
    const res = await fakeFetch(toValue(url))
    data.value = await res.json()
    loading.value = false
  }

  watch(() => toValue(url), load, { immediate: true })

  return { data, error, loading, refetch: load }
}`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import { useFetch } from './useFetch.js'

const userUrl = ref('/users/1')
const { data: user, error, loading } = useFetch(userUrl)
</script>

<template>
  <button class="user-1" @click="userUrl = '/users/1'">Ada</button>
  <button class="user-2" @click="userUrl = '/users/2'">Grace</button>
  <button class="missing" @click="userUrl = '/users/404'">Missing</button>

  <p v-if="loading" class="loading">Loading…</p>
  <p v-if="error" class="error">{{ error.message }}</p>
  <p v-else-if="user" class="name">{{ user.name }}</p>
</template>`,
      },
      hints: [
        'Keep a plain counter outside `load` (`let latest = 0`) and take a ticket at the start of every call: `const id = ++latest`.',
        'Wrap the request in `try { … } catch (err) { … } finally { … }`. After `await fakeFetch(…)`, `if (!res.ok) throw new Error(\'Request failed: \' + res.status)`.',
        'Before every write after an `await` (in `try`, `catch` and `finally`), check `if (id === latest)`. Set `error.value = null` before the request and `data.value = null` in `catch`.',
      ],
      solution: {
        explanation: 'Every call takes a ticket; only the newest ticket may touch the refs, so out-of-order answers are harmless. `try/catch/finally` guarantees errors become state and `loading` always resets. A production version would additionally abort the stale request with an `AbortController` instead of merely ignoring it.',
        files: {
          'api.js': `const USERS = { 1: { id: 1, name: 'Ada Lovelace' }, 2: { id: 2, name: 'Grace Hopper' } }
const DELAYS = { '/users/1': 300, '/users/2': 50 }

export const requests = []

export function fakeFetch(url) {
  requests.push(url)
  const id = url.split('/').pop()
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = USERS[id]
      if (!user) resolve({ ok: false, status: 404, json: async () => ({ message: 'Not found' }) })
      else resolve({ ok: true, status: 200, json: async () => user })
    }, DELAYS[url] ?? 50)
  })
}`,
          'useFetch.js': `import { ref, watch, toValue } from 'vue'
import { fakeFetch } from './api.js'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  let latest = 0

  async function load() {
    const id = ++latest
    loading.value = true
    error.value = null
    try {
      const res = await fakeFetch(toValue(url))
      if (!res.ok) throw new Error('Request failed with status ' + res.status)
      const json = await res.json()
      if (id === latest) data.value = json
    } catch (err) {
      if (id === latest) {
        error.value = err
        data.value = null
      }
    } finally {
      if (id === latest) loading.value = false
    }
  }

  watch(() => toValue(url), load, { immediate: true })

  return { data, error, loading, refetch: load }
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { useFetch } from './useFetch.js'

const userUrl = ref('/users/1')
const { data: user, error, loading } = useFetch(userUrl)
</script>

<template>
  <button class="user-1" @click="userUrl = '/users/1'">Ada</button>
  <button class="user-2" @click="userUrl = '/users/2'">Grace</button>
  <button class="missing" @click="userUrl = '/users/404'">Missing</button>

  <p v-if="loading" class="loading">Loading…</p>
  <p v-if="error" class="error">{{ error.message }}</p>
  <p v-else-if="user" class="name">{{ user.name }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'loads data and toggles loading',
          code: `const { ref } = requireModule('vue')
const { useFetch } = requireModule('useFetch.js')
const url = ref('/users/2')
const r = withSetup(() => useFetch(url))
expect(r.loading.value).toBe(true)
await wait(150)
expect(r.loading.value).toBe(false)
expect(r.data.value.name).toBe('Grace Hopper')`,
        },
        {
          name: 'HTTP errors become an error state and loading resets',
          code: `const { useFetch } = requireModule('useFetch.js')
const r = withSetup(() => useFetch('/users/404'))
await wait(150)
expect(r.error.value).toBeTruthy()
expect(String(r.error.value.message)).toContain('404')
expect(r.data.value).toBeNull()
expect(r.loading.value).toBe(false)`,
        },
        {
          name: 'a stale slow response does not overwrite a newer one',
          code: `const { ref } = requireModule('vue')
const { useFetch } = requireModule('useFetch.js')
const url = ref('/users/1')
const r = withSetup(() => useFetch(url))
await nextTick()
url.value = '/users/2'
await wait(450)
expect(r.data.value.name).toBe('Grace Hopper')
expect(r.loading.value).toBe(false)`,
        },
        {
          name: 'error clears on the next successful request',
          code: `const { ref } = requireModule('vue')
const { useFetch } = requireModule('useFetch.js')
const url = ref('/users/404')
const r = withSetup(() => useFetch(url))
await wait(150)
expect(r.error.value).toBeTruthy()
url.value = '/users/2'
await wait(150)
expect(r.error.value).toBeNull()
expect(r.data.value.name).toBe('Grace Hopper')`,
        },
        {
          name: 'refetch() requests the current URL again',
          code: `const { requests } = requireModule('api.js')
const { useFetch } = requireModule('useFetch.js')
const r = withSetup(() => useFetch('/users/2'))
await wait(120)
const before = requests.length
r.refetch()
await wait(120)
expect(requests.length).toBe(before + 1)`,
        },
        {
          name: 'clicking Ada then Grace quickly shows Grace',
          code: `await wait(400)
await click('.user-2')
await wait(120)
await click('.user-1')
await click('.user-2')
await wait(450)
expect(text('.name')).toBe('Grace Hopper')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'composable-recipes-fetch-race',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Users of a search page sometimes see results for what they typed *before* their final query. The search uses this composable. What is the bug, and how do you fix it?',
      code: {
        lang: 'js',
        code: `export function useSearch(query) {
  const results = ref([])
  watch(query, async (q) => {
    const res = await fetch('/api/search?q=' + encodeURIComponent(q))
    results.value = await res.json()
  })
  return { results }
}`,
      },
      answer: 'A race condition: requests can finish out of order, and whichever finishes last writes `results`, even if it belongs to an older query. Fix by letting only the latest request write (a request-id guard) and, better, cancelling the previous request with an `AbortController` registered via `onWatcherCleanup()` (3.5+) or the watch callback\'s `onCleanup` argument. Also check `res.ok` and debounce the input.',
      explanation: 'Network latency varies per request. "Last started" and "last finished" are different things.',
      whyAsked: 'Async race conditions are one of the most common real-world frontend bugs; interviewers want to see you recognise them and know the standard fixes.',
      mistakes: ['Suggesting debounce alone — it reduces the chance but doesn\'t eliminate races.', 'Using a global "isLoading" flag to block new searches, which hurts UX.', 'Forgetting that `fetch` doesn\'t reject on 404/500.'],
      followUps: ['Why must `onWatcherCleanup` be called before the first `await`?', 'What does aborting add over ignoring stale responses?', 'How would you test this?'],
      modelAnswer: 'This is a race condition. Each keystroke starts a request, but responses arrive in whatever order the network delivers them, so an older, slower response can overwrite newer results. The minimal fix is a request counter: each run takes an id and only the latest id may write. The better fix also cancels the previous request: create an `AbortController` per run, pass its signal to `fetch`, and abort it in `onWatcherCleanup` — which Vue calls before the next run and when the watcher stops. I\'d also debounce the input and check `res.ok` so HTTP errors surface as errors.',
    },
    {
      id: 'composable-recipes-production-fetch',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Your team wants a shared `useFetch` composable for the whole app. Beyond `data`, `error` and `loading`, what would a production-grade version need, and would you build or adopt one?',
      answer: 'Cancellation of superseded or unmounted requests, a stale-response guard, `res.ok` handling with typed errors, timeouts, retries with backoff for transient failures, caching and de-duplication (with invalidation after mutations), refetch on demand/focus/reconnect, SSR support (fetch on the server, hydrate without refetching), and testability (injectable fetcher). Because that list is long and subtle, most teams adopt a data-fetching library and wrap it in thin, app-specific composables.',
      explanation: 'The hard parts are not the request itself but its lifecycle: concurrency, caching and server rendering.',
      whyAsked: 'Separates people who have only written the happy path from those who have shipped data-heavy apps.',
      mistakes: ['Listing only loading/error.', 'Re-implementing caching per component.', 'Ignoring SSR and hydration double-fetching.'],
      followUps: ['How would you invalidate cached data after a POST?', 'Where would auth headers and 401 handling live?', 'How does this relate to a Pinia store holding server data?'],
      modelAnswer: 'The request is the easy part; the lifecycle is hard. I\'d need cancellation through `AbortController`, latest-request-wins semantics, `res.ok` checks with structured errors, timeouts, and retries with backoff for transient failures. Then caching and de-duplication so two widgets asking for the same resource share one request, plus invalidation after mutations. In SSR the data should be fetched on the server and hydrated, not fetched twice. Given that scope, I\'d adopt an established library — TanStack Query for Vue or Pinia Colada, or Nuxt\'s `useFetch` in a Nuxt app — and expose thin composables like `useProduct(id)` on top, so the rest of the app stays independent of the library.',
    },
    {
      id: 'composable-recipes-debounce-throttle',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'For a scroll-position indicator that should update smoothly while the user scrolls, which technique fits best?',
      options: ['Debounce — run once after scrolling stops', 'Throttle — run at most once per interval while scrolling', 'Neither — run the handler on every event', 'Use `setInterval` to poll scrollY'],
      correctOption: 1,
      answer: 'Throttle. Debounce waits for a pause, so the indicator would freeze during scrolling and jump at the end. Throttle limits the rate (e.g. once per animation frame) while still updating continuously.',
      explanation: 'Debounce = "after they stop". Throttle = "at most every N ms while it continues".',
      whyAsked: 'A quick check that you choose rate-limiting by the user experience, not by habit.',
      mistakes: ['Using debounce everywhere.', 'Not mentioning `requestAnimationFrame` as a natural throttle for visual updates.'],
      followUps: ['Which would you use for autosave?', 'What does a `maxWait` option add to debounce?'],
      modelAnswer: 'Throttle. Debouncing waits until events stop, which suits search boxes and autosave, but a scroll indicator would sit still and then jump. Throttling caps how often the handler runs while events keep coming — for visual updates, once per animation frame with `requestAnimationFrame` is a good choice. Debounce with a `maxWait` is a middle ground when you want both.',
    },
    {
      id: 'composable-recipes-storage-ssr',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'After moving to SSR, a page using `useLocalStorage(\'theme\', \'light\')` crashes on the server with `localStorage is not defined`. After a quick guard fix, it now logs a hydration mismatch in the browser for users who chose "dark". Explain both problems and the proper fix.',
      answer: 'Setup runs on the server, where `window`/`localStorage` don\'t exist, causing the crash. The guard makes the server render `light`, but the browser reads `dark` during hydration, so the first client render differs from the server HTML — a mismatch. Fix: render the default during hydration and read storage in `onMounted` (accepting a brief switch), or store the preference somewhere the server can read (e.g. a cookie) so both sides render the same value.',
      explanation: 'SSR means two environments must agree on the first render. Browser-only data can\'t be known by the server unless you send it (cookie, header).',
      whyAsked: 'Probes real SSR experience: environment guards and hydration consistency.',
      mistakes: ['Only adding a `typeof window` check and calling it done.', 'Suppressing the warning instead of fixing the mismatch.', 'Storing the theme in a module-level ref on the server.'],
      followUps: ['Why is a cookie visible to the server but localStorage isn\'t?', 'How do you avoid a flash of the wrong theme?'],
      modelAnswer: 'There are two separate issues. First, setup runs on the server, where `localStorage` doesn\'t exist, so reading it at setup time throws. Second, once guarded, the server renders the default `light` but the browser reads `dark` during hydration, so the initial client render doesn\'t match the server HTML. The clean fix is to keep the first client render identical to the server — use the default and read storage in `onMounted` — or move the preference into a cookie so the server can render the right theme from the start, which also avoids a flash of the wrong theme.',
    },
    {
      id: 'composable-recipes-online-coding',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `useOnlineStatus()` in `useOnlineStatus.js`. It returns `{ isOnline }` — a ref starting at `navigator.onLine` (or `true` when there is no `window`). Listen to the window `online` and `offline` events to update it. Add the listeners right away (guarded for SSR) and remove them with `onScopeDispose()` so cleanup works for components and manual effect scopes. `App.vue` shows "Online"/"Offline" in `.status`.',
      starter: {
        files: {
          'useOnlineStatus.js': `import { ref, onScopeDispose } from 'vue'

export function useOnlineStatus() {
  // TODO
  const isOnline = ref(true)
  return { isOnline }
}`,
          'App.vue': `<script setup>
import { useOnlineStatus } from './useOnlineStatus.js'
const { isOnline } = useOnlineStatus()
</script>

<template>
  <p class="status">{{ isOnline ? 'Online' : 'Offline' }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'goes offline and back online',
          code: `window.dispatchEvent(new Event('offline'))
await flush()
expect(text('.status')).toBe('Offline')
window.dispatchEvent(new Event('online'))
await flush()
expect(text('.status')).toBe('Online')`,
        },
        {
          name: 'works when called directly',
          code: `const { useOnlineStatus } = requireModule('useOnlineStatus.js')
const { isOnline } = withSetup(() => useOnlineStatus())
expect(typeof isOnline.value).toBe('boolean')
window.dispatchEvent(new Event('offline'))
expect(isOnline.value).toBe(false)
window.dispatchEvent(new Event('online'))
expect(isOnline.value).toBe(true)`,
        },
        {
          name: 'stops listening when its scope is disposed',
          code: `const { effectScope } = requireModule('vue')
const { useOnlineStatus } = requireModule('useOnlineStatus.js')
const scope = effectScope()
const { isOnline } = scope.run(() => useOnlineStatus())
window.dispatchEvent(new Event('online'))
expect(isOnline.value).toBe(true)
scope.stop()
window.dispatchEvent(new Event('offline'))
expect(isOnline.value).toBe(true)
window.dispatchEvent(new Event('online'))`,
        },
      ],
      hints: ['Create two named handlers, `goOnline` and `goOffline`, so the same references can be removed later.', 'Guard with `if (typeof window !== \'undefined\') { window.addEventListener(…) }` and start the ref at `typeof navigator !== \'undefined\' ? navigator.onLine : true`.', '`onScopeDispose(() => { window.removeEventListener(\'online\', goOnline); window.removeEventListener(\'offline\', goOffline) })`.'],
      answer: 'A ref initialised from `navigator.onLine`, two named handlers registered on `window` behind an SSR guard, and `onScopeDispose` removing the same handlers.',
      solution: {
        files: {
          'useOnlineStatus.js': `import { ref, onScopeDispose } from 'vue'

export function useOnlineStatus() {
  const isBrowser = typeof window !== 'undefined'
  const isOnline = ref(isBrowser && typeof navigator !== 'undefined' ? navigator.onLine : true)

  const goOnline = () => (isOnline.value = true)
  const goOffline = () => (isOnline.value = false)

  if (isBrowser) {
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
  }

  onScopeDispose(() => {
    if (!isBrowser) return
    window.removeEventListener('online', goOnline)
    window.removeEventListener('offline', goOffline)
  })

  return { isOnline }
}`,
          'App.vue': `<script setup>
import { useOnlineStatus } from './useOnlineStatus.js'
const { isOnline } = useOnlineStatus()
</script>

<template>
  <p class="status">{{ isOnline ? 'Online' : 'Offline' }}</p>
</template>`,
        },
      },
      explanation: 'Named handlers make removal possible; `onScopeDispose` ties the listener lifetime to whatever scope runs the composable; the SSR guard keeps it importable on the server. Note `navigator.onLine` only tells you the device has *a* network connection, not that your API is reachable.',
      whyAsked: 'A compact test of composable fundamentals: state, browser events, SSR guards and cleanup.',
      mistakes: ['Anonymous handlers that can never be removed.', 'Registering in `onMounted` but cleaning up with `onScopeDispose` (or vice versa) without thinking about where it runs.', 'Reading `navigator` unguarded on the server.'],
      followUps: ['Why does `navigator.onLine === true` not guarantee your API is reachable?', 'How would you share one listener across many components?'],
      modelAnswer: 'I\'d start a ref from `navigator.onLine`, defaulting to true when there\'s no window, define named `goOnline`/`goOffline` handlers and register them on `window` behind a `typeof window` guard. Cleanup goes in `onScopeDispose`, which runs when the component unmounts and also when a manual effect scope stops, removing the exact same handler references. I\'d mention that `onLine` only reflects connectivity to *a* network, so a real app might also track failed requests to detect when the API itself is unreachable.',
    },
    {
      id: 'composable-recipes-window-css',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'A teammate uses `useWindowSize()` and `v-if="width < 768"` to hide the sidebar on phones. Is that a good use of the composable? When *is* a JavaScript window-size composable the right tool?',
      answer: 'For a purely visual change, CSS media (or container) queries are simpler, work before JavaScript runs, avoid SSR mismatches (the server doesn\'t know the width) and don\'t cause re-renders. A JS composable is right when *logic* depends on size: rendering a different component tree, choosing how many items to load, sizing a canvas or chart, or enabling a gesture.',
      explanation: 'Use the least powerful tool that solves the problem. CSS knows the viewport natively.',
      whyAsked: 'Checks judgement — knowing when not to reach for a composable is as important as writing one.',
      mistakes: ['Putting all responsive logic in JavaScript.', 'Forgetting that the server renders with no width, causing hydration mismatches with `v-if`.'],
      followUps: ['How would you expose breakpoints with `matchMedia` instead of raw widths?', 'What are container queries?'],
      modelAnswer: 'For hiding a sidebar I\'d use a CSS media query: it applies before any JavaScript, has no hydration issues because the server doesn\'t need to know the width, and doesn\'t trigger re-renders on every resize. I reach for a window-size composable when behaviour, not just styling, depends on size — for example rendering a mobile component instead of a data table, deciding page size for an API call, or sizing a chart canvas. Even then I\'d prefer `matchMedia`-based booleans like `isMobile`, and throttle any raw resize handling.',
    },
  ],

  takeaways: [
    'Recipes wrap a browser side effect in refs: create state, start the effect, keep refs updated, clean up, return refs.',
    '`useFetch` must expose data, error and loading, check `res.ok`, and let only the latest request win (cancel in production).',
    '`useLocalStorage` needs a deep watcher, safe JSON parsing and an SSR guard; never store secrets there.',
    '`useDebounce` restarts a timer on each change and must clear it on dispose; `useWindowSize` must remove its listener.',
    '`toValue()` (3.3+) lets composables accept values, refs or getters; `onWatcherCleanup()` (3.5+) cleans up per watcher run.',
    'These are simplified teaching versions — adopt or build fuller implementations (cancellation, caching, sync, throttling) for production.',
  ],
}
