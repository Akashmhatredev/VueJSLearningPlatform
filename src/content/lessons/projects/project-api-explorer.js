// Project 4: API Explorer — requests, loading & error states, pagination, debounced search, cancellation.

const apiJs = `// A pretend REST API:  GET /books?q=<text>&page=<n>&limit=<size>
// SIMPLIFIED: a real server would query a database. Here it is an array and
// setTimeout — but it behaves like the network: it is slow, sometimes fails,
// answers out of order, and honours an AbortSignal like fetch() does.
import { reactive } from 'vue'

// Knobs for the "Simulation controls" panel and for tests.
export const simulate = { latency: 120, failNext: false }
// Reactive only so the demo panel can display the numbers.
export const stats = reactive({ requests: 0, aborted: 0 })

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Sample data: classic novels and the year each was first published.
const BOOKS = [
  { id: 1, title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813 },
  { id: 2, title: 'Sense and Sensibility', author: 'Jane Austen', year: 1811 },
  { id: 3, title: 'Mansfield Park', author: 'Jane Austen', year: 1814 },
  { id: 4, title: 'Emma', author: 'Jane Austen', year: 1815 },
  { id: 5, title: 'Frankenstein', author: 'Mary Shelley', year: 1818 },
  { id: 6, title: 'Moby-Dick', author: 'Herman Melville', year: 1851 },
  { id: 7, title: 'Jane Eyre', author: 'Charlotte Brontë', year: 1847 },
  { id: 8, title: 'Wuthering Heights', author: 'Emily Brontë', year: 1847 },
  { id: 9, title: 'A Christmas Carol', author: 'Charles Dickens', year: 1843 },
  { id: 10, title: 'A Tale of Two Cities', author: 'Charles Dickens', year: 1859 },
  { id: 11, title: 'Great Expectations', author: 'Charles Dickens', year: 1861 },
  { id: 12, title: 'Little Women', author: 'Louisa May Alcott', year: 1868 },
  { id: 13, title: 'The Adventures of Tom Sawyer', author: 'Mark Twain', year: 1876 },
  { id: 14, title: 'Dracula', author: 'Bram Stoker', year: 1897 },
  { id: 15, title: 'The Picture of Dorian Gray', author: 'Oscar Wilde', year: 1890 },
  { id: 16, title: 'Treasure Island', author: 'Robert Louis Stevenson', year: 1883 },
  { id: 17, title: 'Strange Case of Dr Jekyll and Mr Hyde', author: 'Robert Louis Stevenson', year: 1886 },
  { id: 18, title: 'Kidnapped', author: 'Robert Louis Stevenson', year: 1886 },
  { id: 19, title: 'The Time Machine', author: 'H. G. Wells', year: 1895 },
  { id: 20, title: 'The War of the Worlds', author: 'H. G. Wells', year: 1898 },
  { id: 21, title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', year: 1865 },
  { id: 22, title: 'Through the Looking-Glass', author: 'Lewis Carroll', year: 1871 },
  { id: 23, title: 'The Three Musketeers', author: 'Alexandre Dumas', year: 1844 },
  { id: 24, title: 'Les Misérables', author: 'Victor Hugo', year: 1862 },
  { id: 25, title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', year: 1866 },
  { id: 26, title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', year: 1880 },
  { id: 27, title: 'The Jungle Book', author: 'Rudyard Kipling', year: 1894 },
  { id: 28, title: 'Around the World in Eighty Days', author: 'Jules Verne', year: 1872 },
  { id: 29, title: 'Journey to the Centre of the Earth', author: 'Jules Verne', year: 1864 },
  { id: 30, title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', year: 1902 },
  { id: 31, title: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle', year: 1892 },
  { id: 32, title: 'The Call of the Wild', author: 'Jack London', year: 1903 },
  { id: 33, title: 'Peter and Wendy', author: 'J. M. Barrie', year: 1911 },
  { id: 34, title: 'Anne of Green Gables', author: 'L. M. Montgomery', year: 1908 },
  { id: 35, title: 'The Secret Garden', author: 'Frances Hodgson Burnett', year: 1911 },
  { id: 36, title: 'The Wonderful Wizard of Oz', author: 'L. Frank Baum', year: 1900 },
  { id: 37, title: 'Black Beauty', author: 'Anna Sewell', year: 1877 },
  { id: 38, title: 'The Scarlet Letter', author: 'Nathaniel Hawthorne', year: 1850 },
  { id: 39, title: 'Robinson Crusoe', author: 'Daniel Defoe', year: 1719 },
  { id: 40, title: "Gulliver's Travels", author: 'Jonathan Swift', year: 1726 },
].sort((a, b) => a.title.localeCompare(b.title))

// Deterministic "network jitter": some requests are slower than others, so
// you can watch what happens when responses arrive out of order.
function latencyFor(query, page) {
  return simulate.latency + ((page * 3) % 4) * 60 + (query.length % 3) * 40
}

function abortError() {
  return new DOMException('The request was cancelled.', 'AbortError')
}

export function searchBooks({ query = '', page = 1, pageSize = 8, signal } = {}) {
  stats.requests++
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      stats.aborted++
      reject(abortError())
      return
    }

    function onAbort() {
      clearTimeout(timer)
      stats.aborted++
      reject(abortError())
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      if (simulate.failNext) {
        simulate.failNext = false
        reject(new ApiError(500, 'The library server is having trouble (500). Please try again.'))
        return
      }
      const q = query.trim().toLowerCase()
      const matches = q
        ? BOOKS.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
        : BOOKS
      const start = (page - 1) * pageSize
      resolve({
        items: matches.slice(start, start + pageSize).map((book) => ({ ...book })),
        total: matches.length,
        page,
        pageSize,
      })
    }, latencyFor(query, page))

    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
`

const searchBarVue = `<script setup>
// defineModel() (Vue 3.4+) gives this component a two-way v-model binding.
const query = defineModel({ type: String, default: '' })
</script>

<template>
  <div class="search" role="search">
    <label for="book-search" class="search-label">Search by title or author</label>
    <div class="search-row">
      <input
        id="book-search"
        v-model="query"
        class="search-input"
        type="search"
        placeholder="e.g. austen, dracula, wells"
        autocomplete="off"
      />
      <button v-if="query" type="button" class="search-clear" aria-label="Clear search" @click="query = ''">✕</button>
    </div>
  </div>
</template>

<style scoped>
.search-label { display: block; font-weight: 600; margin-bottom: 6px; }
.search-row { display: flex; gap: 6px; }
.search-input { flex: 1; font: inherit; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; }
.search-clear { border: 1px solid var(--line); background: #fff; border-radius: 10px; padding: 0 12px; cursor: pointer; }
</style>`

const bookListVue = `<script setup>
defineProps({
  books: { type: Array, required: true },
})
</script>

<template>
  <!-- class / aria-busy from the parent fall through to this <ul> -->
  <ul class="results">
    <li v-for="book in books" :key="book.id" class="book">
      <h3 class="book-title">{{ book.title }}</h3>
      <p class="book-meta">{{ book.author }} · {{ book.year }}</p>
    </li>
  </ul>
</template>

<style scoped>
.results { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; transition: opacity 0.15s; }
.results.is-stale { opacity: 0.5; }
.book { padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
.book-title { margin: 0; font-size: 1rem; }
.book-meta { margin: 4px 0 0; color: var(--muted); font-size: 0.9rem; }
</style>`

const paginationStyles = `<style scoped>
.pagination { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 14px; }
.pagination button { font: inherit; padding: 8px 14px; border: 1px solid var(--ink); border-radius: 8px; background: #fff; cursor: pointer; }
.pagination button:disabled { opacity: 0.35; cursor: not-allowed; }
.page-info { color: var(--muted); font-variant-numeric: tabular-nums; }
</style>`

const starterPaginationVue = `<script setup>
defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})
// TODO (step 4): emit 'change' with the new page number,
// and disable each button at its edge (first / last page)
</script>

<template>
  <nav class="pagination" aria-label="Pagination">
    <button type="button" class="prev">← Previous</button>
    <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
    <button type="button" class="next">Next →</button>
  </nav>
</template>

${paginationStyles}`

const paginationVue = `<script setup>
defineProps({
  page: { type: Number, required: true },
  totalPages: { type: Number, required: true },
})
const emit = defineEmits(['change'])
</script>

<template>
  <nav class="pagination" aria-label="Pagination">
    <button type="button" class="prev" :disabled="page <= 1" @click="emit('change', page - 1)">
      ← Previous
    </button>
    <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
    <button type="button" class="next" :disabled="page >= totalPages" @click="emit('change', page + 1)">
      Next →
    </button>
  </nav>
</template>

${paginationStyles}`

const starterComposable = `import { ref, shallowRef, computed, onMounted } from 'vue'
import { searchBooks } from './api.js'

export function useBookSearch({ pageSize = 8, debounceMs = 250 } = {}) {
  const query = ref('') // what the user is typing
  const page = ref(1)
  const searchedQuery = ref('') // the query actually sent to the API
  const items = shallowRef([])
  const total = ref(0)
  const resultPage = ref(1) // the page the items on screen belong to
  const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
  const error = ref(null)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

  const rangeLabel = computed(() => {
    if (total.value === 0) return ''
    const from = (resultPage.value - 1) * pageSize + 1
    const to = Math.min(resultPage.value * pageSize, total.value)
    return 'Showing ' + from + '–' + to + ' of ' + total.value + ' books'
  })

  // TODO (step 3): this loads once, never handles errors, and ignores
  // changes to the query or the page.
  async function load() {
    status.value = 'loading'
    const result = await searchBooks({ query: searchedQuery.value, page: page.value, pageSize })
    items.value = result.items
    total.value = result.total
    resultPage.value = result.page
    status.value = 'success'
  }
  onMounted(load)

  // TODO (step 4): load again whenever the page changes
  // TODO (step 5): debounce typing: copy query -> searchedQuery after a pause, reset page to 1
  // TODO (step 6): cancel the previous request with an AbortController

  function goToPage(n) {
    page.value = n
  }

  function retry() {
    // TODO (step 3)
  }

  return { query, page, searchedQuery, items, total, totalPages, rangeLabel, status, error, goToPage, retry }
}
`

const composableJs = `import { ref, shallowRef, computed, watch } from 'vue'
import { searchBooks } from './api.js'

export function useBookSearch({ pageSize = 8, debounceMs = 250 } = {}) {
  const query = ref('') // what the user is typing
  const page = ref(1)
  const searchedQuery = ref('') // the query actually sent to the API
  const items = shallowRef([]) // replaced wholesale on every response
  const total = ref(0)
  const resultPage = ref(1) // the page the items on screen belong to
  const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
  const error = ref(null)
  const attempt = ref(0) // bump to retry the same request

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

  // Describe what is ON SCREEN (resultPage), not what was requested (page).
  const rangeLabel = computed(() => {
    if (total.value === 0) return ''
    const from = (resultPage.value - 1) * pageSize + 1
    const to = Math.min(resultPage.value * pageSize, total.value)
    return 'Showing ' + from + '–' + to + ' of ' + total.value + ' books'
  })

  // 1. Debounce: only search once the user pauses typing.
  watch(query, (value, oldValue, onCleanup) => {
    const timer = setTimeout(() => {
      searchedQuery.value = value.trim()
      page.value = 1 // a new search starts on page 1
    }, debounceMs)
    // Runs if query changes again before the timer fires (or on unmount).
    onCleanup(() => clearTimeout(timer))
  })

  // 2. Fetch whenever the searched query, the page or the retry counter changes.
  watch(
    [searchedQuery, page, attempt],
    async ([q, p], oldValues, onCleanup) => {
      const controller = new AbortController()
      // Runs right before the next fetch starts, and when the component
      // unmounts: the previous request is cancelled instead of racing.
      onCleanup(() => controller.abort())

      status.value = 'loading'
      error.value = null
      try {
        const result = await searchBooks({ query: q, page: p, pageSize, signal: controller.signal })
        if (controller.signal.aborted) return // belt and braces: never apply a stale response
        items.value = result.items
        total.value = result.total
        resultPage.value = result.page
        status.value = 'success'
      } catch (err) {
        if (err.name === 'AbortError') return // we cancelled it on purpose: not an error
        error.value = err
        status.value = 'error'
      }
    },
    { immediate: true },
  )

  function goToPage(n) {
    page.value = Math.min(Math.max(1, n), totalPages.value)
  }

  function retry() {
    attempt.value++
  }

  return { query, page, searchedQuery, items, total, totalPages, rangeLabel, status, error, goToPage, retry }
}
`

const appStyles = `<style scoped>
.explorer {
  --ink: #1d1d1f;
  --muted: #5f5f6b;
  --line: #e2e2e9;
  --danger: #c92a2a;
  max-width: 760px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
  color: var(--ink);
}
.explorer :deep(:focus-visible) { outline: 3px solid #3b5bdb; outline-offset: 2px; }
.top h1 { margin: 0; font-size: 1.6rem; }
.subtitle { margin: 2px 0 16px; color: var(--muted); }
.status-row { display: flex; justify-content: space-between; align-items: center; min-height: 2em; margin: 10px 0; }
.summary { margin: 0; color: var(--muted); }
.loading { margin: 0; font-weight: 600; }
.error { padding: 14px; border: 1px solid var(--danger); border-radius: 10px; background: #fff5f5; }
.error-message { margin: 0 0 8px; color: var(--danger); }
.retry { font: inherit; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--danger); background: #fff; cursor: pointer; }
.empty { padding: 24px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 10px; }
.simulator { margin-top: 20px; padding: 10px 12px; border: 1px dashed var(--line); border-radius: 10px; color: var(--muted); font-size: 0.9rem; }
.simulator button { font: inherit; margin: 8px 8px 0 0; padding: 4px 10px; border-radius: 6px; border: 1px solid var(--line); background: #fff; cursor: pointer; }
</style>`

const starterAppVue = `<script setup>
import SearchBar from './SearchBar.vue'
import BookList from './BookList.vue'
import Pagination from './Pagination.vue'
import { useBookSearch } from './useBookSearch.js'
import { simulate, stats } from './api.js'

const { query, page, items, totalPages, rangeLabel, status, error, searchedQuery, goToPage, retry } = useBookSearch()
</script>

<template>
  <main class="explorer">
    <header class="top">
      <h1>Book finder</h1>
      <p class="subtitle">Search a (simulated) library API.</p>
    </header>

    <SearchBar v-model="query" />

    <div class="status-row">
      <p class="summary" aria-live="polite">{{ rangeLabel }}</p>
      <!-- TODO (step 7): a .loading indicator while a request is in flight -->
    </div>

    <!-- TODO (step 7): .error panel with the message and a .retry button,
         and an .empty message when a search finds nothing -->
    <BookList :books="items" />

    <!-- TODO (step 4): listen for the change event -->
    <Pagination :page="page" :total-pages="totalPages" />

    <details class="simulator">
      <summary>Simulation controls</summary>
      <button type="button" class="simulate-failure" @click="simulate.failNext = true">Make the next request fail</button>
      <p>Requests sent: {{ stats.requests }} · cancelled: {{ stats.aborted }}</p>
    </details>
  </main>
</template>

${appStyles}`

const appVue = `<script setup>
import SearchBar from './SearchBar.vue'
import BookList from './BookList.vue'
import Pagination from './Pagination.vue'
import { useBookSearch } from './useBookSearch.js'
import { simulate, stats } from './api.js'

const { query, page, items, totalPages, rangeLabel, status, error, searchedQuery, goToPage, retry } = useBookSearch()
</script>

<template>
  <main class="explorer">
    <header class="top">
      <h1>Book finder</h1>
      <p class="subtitle">Search a (simulated) library API.</p>
    </header>

    <SearchBar v-model="query" />

    <div class="status-row">
      <p class="summary" aria-live="polite">{{ rangeLabel }}</p>
      <p v-if="status === 'loading'" class="loading" role="status">Loading books…</p>
    </div>

    <div v-if="status === 'error'" class="error" role="alert">
      <p class="error-message">{{ error.message }}</p>
      <button type="button" class="retry" @click="retry">Try again</button>
    </div>
    <p v-else-if="status === 'success' && items.length === 0" class="empty">
      No books match “{{ searchedQuery }}”.
    </p>
    <!-- Keep the previous page visible (dimmed) while the next one loads -->
    <BookList
      v-else-if="items.length"
      :books="items"
      :class="{ 'is-stale': status === 'loading' }"
      :aria-busy="status === 'loading' ? 'true' : 'false'"
    />

    <Pagination :page="page" :total-pages="totalPages" @change="goToPage" />

    <details class="simulator">
      <summary>Simulation controls</summary>
      <button type="button" class="simulate-failure" @click="simulate.failNext = true">Make the next request fail</button>
      <p>Requests sent: {{ stats.requests }} · cancelled: {{ stats.aborted }}</p>
    </details>
  </main>
</template>

${appStyles}`

// ---------------------------------------------------------------- interview coding question

const latestStarter = `import { ref } from 'vue'

// run(...args) calls loader(...args, signal).
// Only the LATEST call may update data / error. Cancel older calls.
export function useLatestRequest(loader) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)

  async function run(...args) {
    loading.value = true
    data.value = await loader(...args, new AbortController().signal)
    loading.value = false
  }

  return { data, error, loading, run }
}
`

const latestSolution = `import { ref } from 'vue'

// run(...args) calls loader(...args, signal).
// Only the LATEST call may update data / error. Cancel older calls.
export function useLatestRequest(loader) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  let controller = null

  async function run(...args) {
    controller?.abort() // cancel the previous call, if any
    const current = new AbortController()
    controller = current

    loading.value = true
    error.value = null
    try {
      const result = await loader(...args, current.signal)
      if (current !== controller) return // a newer call started: ignore this result
      data.value = result
    } catch (err) {
      if (current !== controller || err.name === 'AbortError') return
      error.value = err
    } finally {
      if (current === controller) loading.value = false
    }
  }

  return { data, error, loading, run }
}
`

const latestApp = `<script setup>
import { useLatestRequest } from './useLatestRequest.js'
</script>

<template>
  <p>Implement useLatestRequest.js — the tests call it directly.</p>
</template>`

const latestTestLoader = `const aborted = []
const loader = (value, signal) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => (value === 'boom' ? reject(new Error('boom')) : resolve(value)), value === 'slow' ? 200 : 40)
  signal.addEventListener('abort', () => {
    clearTimeout(timer)
    aborted.push(value)
    reject(new DOMException('Aborted', 'AbortError'))
  })
})
const { useLatestRequest } = requireModule('useLatestRequest.js')`

export default {
  id: 'project-api-explorer',
  kind: 'project',
  title: 'Project 4: API Explorer',
  summary: 'Build a book search that talks to a simulated API: loading, errors, empty results, pagination, debounced typing and cancellation of stale requests.',
  difficulty: 'intermediate',
  minutes: 120,
  prerequisites: ['async-js', 'http-apis-json', 'fetching-data', 'async-ui-states', 'watch'],
  related: ['search-pagination', 'cancellation-race-conditions', 'composables-intro', 'composable-recipes', 'resilient-requests', 'component-v-model'],
  tags: ['project', 'api', 'fetch', 'loading state', 'error state', 'pagination', 'debounce', 'AbortController', 'race condition', 'composable'],
  apis: [
    { name: 'AbortController', summary: 'Browser API that cancels a request: pass its signal to fetch(), call abort() to cancel.' },
    { name: 'watch(sources, cb) + onCleanup', summary: 'Re-runs the fetch when query/page change; the cleanup callback aborts the previous request.' },
    { name: 'shallowRef()', summary: 'Holds API results that are replaced wholesale, without making every item deeply reactive.' },
    { name: 'defineModel()', summary: 'Vue 3.4+: gives the SearchBar component a two-way v-model.' },
  ],
  docs: [
    { label: 'Vue Guide — Watchers (side effect cleanup)', url: 'https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup' },
    { label: 'Vue Guide — Composables (async state example)', url: 'https://vuejs.org/guide/reusability/composables.html#async-state-example' },
    { label: 'Vue Guide — Component v-model (defineModel)', url: 'https://vuejs.org/guide/components/v-model.html' },
    { label: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' },
    { label: 'MDN — Using the Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
  ],

  intro: `
Most real apps spend their life waiting for servers. In this project you will build **Book finder**, a search screen for a library API, and handle every awkward thing a network does:

- it is **slow** — so the UI needs a loading state that does not flash or freeze,
- it **fails** — so the UI needs a clear error and a way to retry,
- it returns **nothing** — so the UI needs an empty state,
- it returns **too much** — so results come in **pages**,
- and it answers **out of order** — so old responses must never overwrite new ones.

There is no real network in this sandbox, so \`api.js\` is a pretend server built from \`setTimeout\` and Promises. It is deliberately annoying: requests take different amounts of time, you can make the next one fail, and it honours an \`AbortSignal\` exactly like \`fetch()\` does.
`,

  why: `
"Fetch data and show it" is one line in a tutorial and a whole category of bugs in production:

- A user types "dra", then "dracula". The "dra" request is slower and arrives **last** — now the screen shows results for the wrong query. This is a *race condition*.
- A request fails and the UI shows an endless spinner, or a blank page, or \`undefined\`.
- Every keystroke fires a request, hammering the server.
- The user leaves the page while a request is in flight, and it still runs and updates state nobody sees.

None of these are exotic. They happen every day in apps built without a plan. This project gives you the plan: an explicit **request status**, a **debounce** for typing, and **cancellation** with \`AbortController\` — wrapped in a reusable composable.
`,

  eli15: `
Imagine ordering food by phone. You call and order a pizza. Two minutes later you change your mind and call again: "Actually, a burger." If the restaurant makes **both** and whichever arrives last is what you eat, you might end up with the pizza you no longer want.

The smart move is to say, on the second call, "**cancel the pizza**, I want a burger instead." That is what \`AbortController\` does for web requests.

Also: you don't call the restaurant after every word while you're still deciding ("pi…", "piz…", "pizz…"). You wait until you've finished deciding. That is a **debounce**.

And while you wait, a good restaurant tells you "your order is being prepared" (loading), "sorry, we're out of burgers" (error), or "we don't have that on the menu" (empty).
`,

  analogy: {
    title: 'The librarian at the desk',
    body: `
You ask a librarian for books by "Austen". While they walk to the shelves you say, "sorry, I meant Dickens". A good librarian **stops** fetching Austen books and goes to the D shelf — they don't come back with both piles.

While they are away, a sign on the desk says "Looking for your books…". If the archive is closed, they tell you so and offer to try again. If there are no books by that author, they say that clearly instead of handing you an empty trolley. And they bring books eight at a time, with "page 2" on request.
`,
    mapping: [
      ['asking for books', 'calling `searchBooks()`'],
      ['"sorry, I meant Dickens" — they stop', '`controller.abort()` in the watcher cleanup'],
      ['waiting until you finish your sentence', 'the debounce on typing'],
      ['"Looking for your books…" sign', '`status === \'loading\'`'],
      ['"the archive is closed, try again?"', 'the error panel with a Retry button'],
      ['eight books per trolley', 'pagination (`page`, `pageSize`, `total`)'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'From keystroke to results (and what gets cancelled)',
    caption: 'Typing is debounced; every new search or page aborts the request before it. Only the latest response reaches the screen.',
    alt: 'Diagram of the data flow: SearchBar updates query through v-model. A debounce watcher copies query to searchedQuery after a pause. A fetch watcher watches searchedQuery, page and a retry counter; for each change it aborts the previous AbortController and calls searchBooks in api.js. The response updates items, total and status, which App renders as a loading indicator, an error panel with retry, an empty state, the BookList and Pagination. Pagination emits change back to page.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'search', label: 'SearchBar', note: 'v-model → query', tone: 'paper' },
        { id: 'debounce', label: 'Debounce watcher', note: 'query → searchedQuery (after a pause)', tone: 'kraft' },
        { id: 'fetch', label: 'Fetch watcher', note: '[searchedQuery, page, attempt]', tone: 'cobalt' },
        { id: 'pager', label: 'Pagination', note: 'emits change(page)', tone: 'paper' },
        { id: 'api', label: 'api.js (fake server)', note: 'slow · flaky · honours signal', tone: 'ink' },
        { id: 'ui', label: 'App template', note: 'loading · error · empty · results', tone: 'acid' },
      ],
      edges: [
        { from: 'search', to: 'debounce', label: 'query' },
        { from: 'debounce', to: 'fetch', label: 'searchedQuery' },
        { from: 'pager', to: 'fetch', label: 'page' },
        { from: 'fetch', to: 'api', label: 'searchBooks({ signal })' },
        { from: 'api', to: 'ui', label: 'items · total · status' },
      ],
      steps: [
        { focus: ['search', 'debounce'], edges: ['search->debounce'], text: 'Each keystroke updates `query`, but the debounce watcher waits for a pause before copying it to `searchedQuery` — one request per pause, not per key.' },
        { focus: ['debounce', 'pager', 'fetch'], edges: ['debounce->fetch', 'pager->fetch'], text: 'The fetch watcher depends on `searchedQuery`, `page` and a retry counter. Any change starts a new request.' },
        { focus: ['fetch', 'api'], edges: ['fetch->api'], text: 'Before the new request starts, Vue runs the previous run\'s **cleanup**, which calls `controller.abort()`. The old request rejects with an `AbortError`, which we ignore on purpose.' },
        { focus: ['api', 'ui'], edges: ['api->ui'], text: 'Only the latest response updates `items`, `total` and `status`. The template turns `status` into a loading line, an error panel with Retry, an empty message or the results.' },
      ],
    },
  },

  requirements: [
    'On start, show a `.loading` indicator (with `role="status"`), then the first **8** books as `.book` items (title in `.book-title`).',
    '`.summary` describes what is on screen: **"Showing 1–8 of 40 books"**. `.page-info` shows **"Page 1 of 5"**.',
    '`Pagination` has `.prev` and `.next` buttons, disabled on the first / last page, and emits `change` with the new page.',
    'Typing in `.search-input` searches by title or author **after a 250 ms pause** (debounce): several quick keystrokes cause **one** request. A new search starts on page 1.',
    'A search with no matches shows `.empty` containing the query.',
    'A failed request shows `.error` (with `role="alert"`) containing the server\'s message, and a `.retry` button that repeats the same request. The `.simulate-failure` button makes the next request fail.',
    'Starting a new request **cancels** the previous one with `AbortController` (`stats.aborted` in `api.js` counts cancellations), and a slow, stale response must **never** replace newer results.',
    'Cancelled requests are not errors: they never show the error panel.',
  ],

  objectives: [
    'Model a request with an explicit status (`idle` / `loading` / `success` / `error`) instead of loose booleans.',
    'Fetch data reactively with `watch()` on several sources, and keep that logic in a reusable composable.',
    'Debounce user input and paginate results without firing unnecessary requests.',
    'Cancel stale requests with `AbortController` and a watcher\'s cleanup callback — and explain the race condition it prevents.',
    'Build accessible loading, error and empty states (`role="status"`, `role="alert"`, `aria-busy`, a live summary).',
  ],

  playground: {
    title: 'Book finder — starter',
    objective: 'The fake API, search bar and book list are ready. Make the composable load reactively, handle errors, paginate, debounce and cancel — then finish the UI states.',
    files: {
      'App.vue': starterAppVue,
      'useBookSearch.js': starterComposable,
      'Pagination.vue': starterPaginationVue,
      'SearchBar.vue': searchBarVue,
      'BookList.vue': bookListVue,
      'api.js': apiJs,
    },
    expected: 'The starter loads the first page once, but paging, searching, errors and cancellation do nothing yet. Open **Simulation controls** to watch the request counters. Requests take roughly 120–380 ms here, depending on the page and query.',
    tests: [
      {
        name: 'shows a loading state, then the first page',
        code: `expect(exists('.loading')).toBe(true)
await wait(400)
expect(exists('.loading')).toBe(false)
expect(findAll('.book')).toHaveLength(8)
expect(text('.summary')).toBe('Showing 1–8 of 40 books')
expect(text('.page-info')).toBe('Page 1 of 5')`,
      },
      {
        name: 'Next and Previous change the page',
        code: `await wait(400)
expect(find('.prev').disabled).toBe(true)
const firstOnPage1 = text('.book-title')
await click('.next')
await wait(350)
expect(text('.page-info')).toBe('Page 2 of 5')
expect(text('.summary')).toBe('Showing 9–16 of 40 books')
expect(text('.book-title')).not.toBe(firstOnPage1)
await click('.prev')
await wait(400)
expect(text('.book-title')).toBe(firstOnPage1)`,
      },
      {
        name: 'rapid clicks cancel stale requests; Next is disabled on the last page',
        code: `const api = requireModule('api.js')
await wait(400)
for (let i = 0; i < 4; i++) await click('.next')
await wait(400)
expect(text('.page-info')).toBe('Page 5 of 5')
expect(text('.summary')).toBe('Showing 33–40 of 40 books')
expect(find('.next').disabled).toBe(true)
expect(api.stats.aborted).toBeGreaterThanOrEqual(3)`,
      },
      {
        name: 'a slow stale response never overwrites newer results',
        code: `const api = requireModule('api.js')
await wait(400)
// In this fake API, page 2 is slower than page 3: without cancellation,
// page 2 would arrive last and replace page 3 on screen.
await click('.next')
await click('.next')
await wait(450)
const expected = await api.searchBooks({ query: '', page: 3, pageSize: 8 })
expect(text('.page-info')).toBe('Page 3 of 5')
expect(text('.book-title')).toBe(expected.items[0].title)
expect(findAll('.book')[7].textContent).toContain(expected.items[7].title)`,
      },
      {
        name: 'typing is debounced: quick keystrokes send one request',
        code: `const api = requireModule('api.js')
await wait(400)
const before = api.stats.requests
await type('.search-input', 'd')
await type('.search-input', 'di')
await type('.search-input', 'dic')
await wait(100)
expect(api.stats.requests).toBe(before)
await wait(600)
expect(api.stats.requests).toBe(before + 1)`,
      },
      {
        name: 'a search shows matching books and starts on page 1',
        code: `await wait(400)
await click('.next')
await wait(350)
await type('.search-input', 'dickens')
await wait(700)
expect(findAll('.book')).toHaveLength(3)
expect(text('.page-info')).toBe('Page 1 of 1')
expect(text('.summary')).toBe('Showing 1–3 of 3 books')
expect(text('.results')).toContain('Great Expectations')`,
      },
      {
        name: 'no matches shows an empty state',
        code: `await wait(400)
await type('.search-input', 'zzzz')
await wait(700)
expect(exists('.book')).toBe(false)
expect(exists('.empty')).toBe(true)
expect(text('.empty')).toContain('zzzz')`,
      },
      {
        name: 'a failed request shows an error, and Retry recovers',
        code: `await wait(400)
await click('.simulate-failure')
await click('.next')
await wait(350)
expect(exists('.error')).toBe(true)
expect(text('.error')).toContain('Please try again')
expect(attr('.error', 'role')).toBe('alert')
await click('.retry')
await wait(350)
expect(exists('.error')).toBe(false)
expect(text('.summary')).toBe('Showing 9–16 of 40 books')`,
      },
      {
        name: 'api.js honours an AbortSignal like fetch()',
        code: `const { searchBooks } = requireModule('api.js')
const controller = new AbortController()
const request = searchBooks({ query: '', page: 1, pageSize: 8, signal: controller.signal })
controller.abort()
let caught = null
try { await request } catch (err) { caught = err }
expect(caught && caught.name).toBe('AbortError')`,
      },
    ],
  },

  steps: [
    {
      title: 'Meet the fake API — and the real fetch() it imitates',
      body: [
        `
\`api.js\` exports \`searchBooks({ query, page, pageSize, signal })\`, which returns a Promise of:

\`\`\`js
{ items: [/* up to pageSize books */], total: 40, page: 1, pageSize: 8 }
\`\`\`

That is a very common REST pagination shape: the items for *this* page plus the **total**, so the client can work out how many pages exist. In a real app the same function would wrap \`fetch()\`:
`,
        {
          code: `export async function searchBooks({ query = '', page = 1, pageSize = 8, signal } = {}) {
  const params = new URLSearchParams({ q: query, page: String(page), limit: String(pageSize) })
  const response = await fetch('/api/books?' + params, { signal })

  // fetch() only rejects on network failure or abort — NOT on 404 or 500.
  if (!response.ok) {
    throw new ApiError(response.status, 'The library server is having trouble (' + response.status + '). Please try again.')
  }
  return response.json()
}`,
          lang: 'js',
          title: 'api.js — the real-world version',
          static: true,
        },
        `
Two details matter for this project:

- **\`fetch()\` does not throw on HTTP errors.** A 500 response *resolves*; you must check \`response.ok\` yourself ([HTTP, APIs & JSON](lesson:http-apis-json)).
- **Passing \`{ signal }\` makes the request cancellable.** When the signal's controller calls \`abort()\`, \`fetch()\` rejects with a \`DOMException\` named \`AbortError\`.

The fake mimics both: \`simulate.failNext\` makes it reject with an \`ApiError\`, and it listens to the signal's \`abort\` event to cancel its timer and reject with an \`AbortError\`. It also has deterministic "jitter" — some pages answer more slowly than others — so you can actually *see* a race condition.
`,
        {
          callout: 'note',
          title: 'Keep API code out of components',
          text: 'Components should not build URLs or parse responses. A small service module (`api.js`) is easy to replace with a fake — exactly what this sandbox does — and easy to test. See [service layers](lesson:service-layers).',
        },
      ],
    },
    {
      title: 'Model the request state in a composable',
      body: [
        `
A *composable* is a function that uses Vue's reactivity and returns state you can reuse ([composables](lesson:composables-intro)). \`useBookSearch()\` will own everything about searching; \`App.vue\` will only render it.

Notice \`status\` is **one string**, not \`isLoading\` + \`hasError\` booleans. With two booleans, "loading *and* errored" is a representable — but meaningless — state. One status with four values makes impossible states impossible:
`,
        {
          code: `const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
const error = ref(null)
const items = shallowRef([]) // replaced wholesale on every response
const total = ref(0)
const resultPage = ref(1)    // the page the items ON SCREEN belong to`,
          lang: 'js',
          title: 'useBookSearch.js',
        },
        `
\`shallowRef\` is a small optimisation that fits API data: we always *replace* the array with a new response and never mutate items in place, so there is no need for Vue to make every book deeply reactive ([shallowRef](lesson:shallow-and-raw)).

\`resultPage\` vs \`page\`: \`page\` is what the user *asked for*; \`resultPage\` is what is *currently displayed*. While page 3 is loading, the summary should still say "Showing 9–16" because page 2 is what the user is looking at.
`,
      ],
    },
    {
      title: 'Load with proper error handling',
      body: [
        `
Replace the one-shot \`load()\` with a watcher. A watcher with \`immediate: true\` runs once at start and again whenever its sources change ([watch](lesson:watch)). Wrap the request in \`try/catch\` and move through the statuses:
`,
        {
          code: `const attempt = ref(0) // bump to retry

watch(
  [searchedQuery, page, attempt],
  async ([q, p]) => {
    status.value = 'loading'
    error.value = null
    try {
      const result = await searchBooks({ query: q, page: p, pageSize })
      items.value = result.items
      total.value = result.total
      resultPage.value = result.page
      status.value = 'success'
    } catch (err) {
      error.value = err
      status.value = 'error'
    }
  },
  { immediate: true },
)

function retry() {
  attempt.value++ // same query and page, new request
}`,
          lang: 'js',
          title: 'useBookSearch.js — first version',
        },
        `
\`attempt\` is a neat trick: the watcher depends on it, so incrementing it re-runs exactly the same request. We will add cancellation to this watcher in step 6.
`,
      ],
    },
    {
      title: 'Pagination: derive the page count, clamp the page',
      body: [
        `
The number of pages is derived from \`total\` — never stored:
`,
        {
          code: `const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function goToPage(n) {
  page.value = Math.min(Math.max(1, n), totalPages.value)
}`,
          lang: 'js',
          title: 'useBookSearch.js',
        },
        `
\`Pagination.vue\` is a presentational component: it shows \`page\` and \`totalPages\`, disables each button at its edge, and emits \`change\`:
`,
        {
          code: `<nav class="pagination" aria-label="Pagination">
  <button type="button" class="prev" :disabled="page <= 1" @click="emit('change', page - 1)">← Previous</button>
  <span class="page-info">Page {{ page }} of {{ totalPages }}</span>
  <button type="button" class="next" :disabled="page >= totalPages" @click="emit('change', page + 1)">Next →</button>
</nav>`,
          lang: 'vue',
          title: 'Pagination.vue',
        },
        `
In \`App.vue\`: \`<Pagination :page="page" :total-pages="totalPages" @change="goToPage" />\`. Because the fetch watcher depends on \`page\`, changing it is all it takes to load the new page. See [search & pagination](lesson:search-pagination) for page-number lists and syncing the page to the URL.
`,
      ],
    },
    {
      title: 'Debounce typing',
      body: [
        `
Searching on every keystroke would send "d", "di", "dic", "dick"… to the server. A *debounce* waits until the user pauses. Here it is built from a watcher and its **cleanup** callback:
`,
        {
          code: `watch(query, (value, oldValue, onCleanup) => {
  const timer = setTimeout(() => {
    searchedQuery.value = value.trim()
    page.value = 1 // a new search starts on page 1
  }, debounceMs)
  onCleanup(() => clearTimeout(timer))
})`,
          lang: 'js',
          title: 'useBookSearch.js',
        },
        `
The third argument of a watch callback, \`onCleanup\`, registers a function Vue calls **before the callback runs again** and **when the watcher stops** (for example when the component unmounts). So each keystroke cancels the previous timer, and only the last one survives the pause.

Setting \`searchedQuery\` and \`page\` in the same tick triggers the fetch watcher **once** — Vue batches watcher runs.
`,
        {
          callout: 'version',
          text: 'Vue 3.5 also offers `onWatcherCleanup()`, which you can call inside a watcher callback instead of using the `onCleanup` argument. The argument form shown here works across Vue 3 versions.',
        },
      ],
    },
    {
      title: 'Cancel stale requests with AbortController',
      body: [
        `
Now the race condition. The fake API answers page 2 more slowly than page 3. Click Next twice quickly and, without cancellation, this happens:

1. Request for page 2 starts (slow).
2. Request for page 3 starts (fast).
3. Page 3 arrives → screen shows page 3.
4. Page 2 arrives **later** → screen shows page 2, while the pager says "Page 3". Wrong.

The fix: every run of the fetch watcher creates an \`AbortController\` and registers \`abort()\` as its cleanup. When the sources change, Vue runs the cleanup of the previous run *before* starting the next one:
`,
        {
          code: `watch(
  [searchedQuery, page, attempt],
  async ([q, p], oldValues, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())

    status.value = 'loading'
    error.value = null
    try {
      const result = await searchBooks({ query: q, page: p, pageSize, signal: controller.signal })
      if (controller.signal.aborted) return // never apply a stale response
      items.value = result.items
      total.value = result.total
      resultPage.value = result.page
      status.value = 'success'
    } catch (err) {
      if (err.name === 'AbortError') return // cancelled on purpose: not an error
      error.value = err
      status.value = 'error'
    }
  },
  { immediate: true },
)`,
          lang: 'js',
          title: 'useBookSearch.js — final fetch watcher',
        },
        `
Three things to notice:

- **AbortError is not an error.** We cancelled it ourselves, so we return quietly — otherwise fast typists would see a red "request was cancelled" banner.
- **The \`signal.aborted\` check** after \`await\` is a second line of defence: some APIs or libraries resolve anyway after an abort. Checking guarantees a stale result can never be applied.
- **Unmounting cancels too.** When the component unmounts, its watchers stop and their cleanups run — so an in-flight request is aborted instead of updating state nobody can see.

More patterns (request ids, dedupe, retries with backoff) are in [cancellation & race conditions](lesson:cancellation-race-conditions) and [resilient requests](lesson:resilient-requests).
`,
      ],
    },
    {
      title: 'Render every state, accessibly',
      body: [
        `
With a single \`status\`, the template becomes a clear decision list:
`,
        {
          code: `<div class="status-row">
  <p class="summary" aria-live="polite">{{ rangeLabel }}</p>
  <p v-if="status === 'loading'" class="loading" role="status">Loading books…</p>
</div>

<div v-if="status === 'error'" class="error" role="alert">
  <p class="error-message">{{ error.message }}</p>
  <button type="button" class="retry" @click="retry">Try again</button>
</div>
<p v-else-if="status === 'success' && items.length === 0" class="empty">
  No books match “{{ searchedQuery }}”.
</p>
<BookList
  v-else-if="items.length"
  :books="items"
  :class="{ 'is-stale': status === 'loading' }"
  :aria-busy="status === 'loading' ? 'true' : 'false'"
/>`,
          lang: 'vue',
          title: 'App.vue',
        },
        `
Design choices worth copying ([async UI states](lesson:async-ui-states)):

- **Keep previous results visible** (dimmed, \`aria-busy="true"\`) while the next page loads, instead of flashing an empty screen.
- **\`role="status"\`** announces "Loading books…" politely; **\`role="alert"\`** announces errors immediately.
- **The summary is \`aria-live\`**, so screen-reader users hear "Showing 9–16 of 40 books" when new results land.
- **The error message tells people what to do** and offers Retry.

Run the tests, open the Simulation controls, and try to break it: type fast, click fast, make requests fail.
`,
      ],
    },
  ],

  solution: {
    entry: 'App.vue',
    files: {
      'App.vue': appVue,
      'useBookSearch.js': composableJs,
      'Pagination.vue': paginationVue,
      'SearchBar.vue': searchBarVue,
      'BookList.vue': bookListVue,
      'api.js': apiJs,
    },
    explanation: `
**All request logic lives in \`useBookSearch()\`.** It exposes inputs (\`query\`, \`page\`), outputs (\`items\`, \`total\`, \`status\`, \`error\`), derived values (\`totalPages\`, \`rangeLabel\`) and actions (\`goToPage\`, \`retry\`). \`App.vue\` just renders them, so the same composable could power a different screen.

**Two watchers, each with a cleanup.** The debounce watcher turns keystrokes into one \`searchedQuery\` per pause and clears its timer on cleanup. The fetch watcher depends on \`[searchedQuery, page, attempt]\`, creates an \`AbortController\` per run and aborts it on cleanup — so a new search, a new page, a retry or unmounting all cancel the previous request.

**Stale responses cannot win.** Aborted requests reject with \`AbortError\` (ignored on purpose), and a \`signal.aborted\` check after \`await\` guarantees a late response is never applied, even from APIs that ignore the signal.

**Honest UI.** One \`status\` drives loading, error, empty and results. The summary describes the data on screen (\`resultPage\`), previous results stay visible while the next page loads, and every state is announced appropriately to assistive technology.

**Simplified:** a production version would add caching (so going back to page 1 is instant), retries with backoff for transient failures, and sync \`query\`/\`page\` to the URL so results can be shared and survive a reload.
`,
  },

  challenges: [
    'Sync `query` and `page` to the URL query string with Vue Router (`?q=austen&page=2`) so results can be shared — see [router in practice](lesson:router-in-practice).',
    'Add a tiny cache: a `Map` from `"query|page"` to responses, so revisiting a page is instant (and think about when the cache should expire).',
    'Add a book details panel: clicking a book loads `GET /books/:id` — and cancels the previous details request if the user clicks quickly.',
    'Retry automatically once with a short delay for 5xx errors, but never for 4xx errors.',
    'Show skeleton cards on the very first load instead of the "Loading" text.',
    'Replace the `attempt` counter with an explicit `refresh()` that bypasses the cache.',
  ],

  mistakes: [
    {
      title: 'Treating an aborted request as an error',
      wrong: { lang: 'js', code: `} catch (err) {\n  error.value = err\n  status.value = 'error' // flashes "request was cancelled" while typing\n}` },
      right: { lang: 'js', code: `} catch (err) {\n  if (err.name === 'AbortError') return\n  error.value = err\n  status.value = 'error'\n}` },
      explanation: 'Cancelling is something *you* chose to do. Ignore `AbortError` and let the newer request own the UI.',
    },
    {
      title: 'Letting the last response win instead of the latest request',
      wrong: { lang: 'js', code: `watch(page, async (p) => {\n  items.value = (await searchBooks({ page: p })).items // slow page 2 overwrites page 3\n})` },
      right: { lang: 'js', code: `watch(page, async (p, old, onCleanup) => {\n  const controller = new AbortController()\n  onCleanup(() => controller.abort())\n  const result = await searchBooks({ page: p, signal: controller.signal })\n  if (!controller.signal.aborted) items.value = result.items\n})` },
      explanation: 'Responses do not arrive in the order requests were sent. Cancel the previous request and/or ignore results that belong to an outdated run.',
    },
    {
      title: 'Assuming fetch() throws on HTTP errors',
      wrong: { lang: 'js', code: `const data = await fetch(url).then((r) => r.json())\n// a 500 page parses (or fails to parse) as if it were data`, static: true },
      right: { lang: 'js', code: `const response = await fetch(url, { signal })\nif (!response.ok) throw new ApiError(response.status, '…')\nconst data = await response.json()`, static: true },
      explanation: '`fetch()` resolves for any HTTP response, including 404 and 500. Check `response.ok` (or `response.status`) and turn failures into errors your UI understands.',
    },
    {
      title: 'Juggling several booleans for one request',
      wrong: { lang: 'js', code: `const isLoading = ref(false)\nconst hasError = ref(false)\nconst isEmpty = ref(false)\n// which combination means what? "loading and error" is possible…` },
      right: { lang: 'js', code: `const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'\nconst isEmpty = computed(() => status.value === 'success' && items.value.length === 0)` },
      explanation: 'Independent booleans allow contradictory combinations and must be reset in every branch. One status value (plus derived flags) cannot contradict itself.',
    },
    {
      title: 'Requesting on every keystroke',
      wrong: { lang: 'vue', code: `<input v-model="query" @input="search" />` },
      right: { lang: 'js', code: `watch(query, (value, old, onCleanup) => {\n  const timer = setTimeout(() => (searchedQuery.value = value.trim()), 250)\n  onCleanup(() => clearTimeout(timer))\n})` },
      explanation: 'Fast typists send many requests that are all immediately obsolete. Debounce the input; cancellation then handles whatever still overlaps.',
    },
  ],

  debugging: [
    {
      symptom: 'Results sometimes belong to an older search or page.',
      cause: 'A slower, earlier response arrived after a newer one and overwrote it.',
      fix: 'Abort the previous request in the watcher cleanup and check `signal.aborted` before applying results.',
    },
    {
      symptom: 'A red "request was cancelled" error flashes while typing.',
      cause: 'The catch block treats `AbortError` like a real failure.',
      fix: 'Return early when `err.name === \'AbortError\'`.',
    },
    {
      symptom: 'The spinner never stops after an error.',
      cause: 'The status is only updated on success (no catch), or the error branch forgets to set it.',
      fix: 'Use one `status` ref and set it in both the success and error branches.',
    },
    {
      symptom: 'Typing in the search box starts on page 3 of the new results (or shows "Page 3 of 1").',
      cause: 'The page is not reset when the query changes.',
      fix: 'Set `page.value = 1` together with the new searched query.',
    },
  ],

  quiz: [
    {
      id: 'project-api-explorer-q1',
      type: 'mcq',
      prompt: 'Why does `useBookSearch` use one `status` ref instead of `isLoading` and `hasError` booleans?',
      options: [
        { text: 'Strings are faster than booleans in Vue', why: 'Performance is not the reason; both are trivial.' },
        { text: 'One status value cannot express contradictory combinations like "loading and failed"' },
        { text: 'Vue cannot watch booleans', why: 'Vue tracks booleans like any other value.' },
        { text: 'Templates can only `v-if` on strings', why: '`v-if` works with any truthy/falsy expression.' },
      ],
      answer: 1,
      explanation: 'With separate booleans you must remember to reset each one in every branch, and meaningless combinations become possible. A single status (plus computed flags) is always consistent.',
    },
    {
      id: 'project-api-explorer-q2',
      type: 'output',
      prompt: 'The server responds to `/api/missing` with **404 Not Found**. What is logged?',
      code: { lang: 'js', code: `fetch('/api/missing')\n  .then((response) => console.log('resolved', response.status))\n  .catch(() => console.log('rejected'))` },
      options: ['rejected', 'resolved 404', 'resolved 200', 'Nothing — fetch hangs'],
      answer: 1,
      explanation: '`fetch()` only rejects for network failures or aborts. Any HTTP response — including 404 or 500 — resolves, so you must check `response.ok`.',
    },
    {
      id: 'project-api-explorer-q3',
      type: 'bug',
      prompt: 'Users report a red "The request was cancelled" banner whenever they type quickly. Click the line that should change.',
      code: {
        lang: 'js',
        code: `watch(searchedQuery, async (q, old, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  status.value = 'loading'
  try {
    const result = await searchBooks({ query: q, signal: controller.signal })
    items.value = result.items
    status.value = 'success'
  } catch (err) {
    error.value = err
    status.value = 'error'
  }
})`,
      },
      answerLine: 10,
      explanation: 'Aborted requests reject with an `AbortError`. The catch block must return early for it (`if (err.name === \'AbortError\') return`) before treating anything as a real error.',
    },
    {
      id: 'project-api-explorer-q4',
      type: 'fill',
      prompt: 'Complete the watcher so the previous request is cancelled when a new one starts.',
      code: { lang: 'js', code: `watch(page, async (p, old, onCleanup) => {\n  const controller = new ___()\n  onCleanup(() => controller.___())\n  const result = await searchBooks({ page: p, signal: controller.signal })\n})` },
      answer: [['AbortController'], ['abort']],
      explanation: 'Each run creates an `AbortController` and registers `abort()` as cleanup; Vue calls it before the next run and when the watcher stops.',
    },
    {
      id: 'project-api-explorer-q5',
      type: 'short',
      prompt: 'The app both debounces typing **and** cancels requests. Why isn\'t one of them enough?',
      answer: 'Debouncing reduces how many requests start, but requests can still overlap — the user can pause, then type again while the previous request is in flight, or click pages quickly. Cancellation makes sure overlapping requests can never show stale results. Debounce saves server work; cancellation guarantees correctness.',
    },
  ],

  interview: [
    {
      id: 'project-api-explorer-race-condition',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What race condition can happen in a search-as-you-type UI, and how did you prevent it in your API explorer?',
      answer: 'Requests can resolve out of order: a slow response for an old query arrives after a fast response for the new one and overwrites it. I prevent it by creating an AbortController per watcher run and aborting it in the watcher\'s cleanup, ignoring AbortError, and checking `signal.aborted` before applying any result. Debouncing reduces how often it can happen; cancellation makes it impossible.',
      explanation: '"Last response wins" is wrong; "latest request wins" is right.',
      whyAsked: 'Async correctness is one of the most common sources of real UI bugs; interviewers want concrete mechanics, not just "use a library".',
      mistakes: ['Saying debounce alone fixes it.', 'Only disabling the input while loading (hurts UX, does not cover pagination).', 'Forgetting to ignore AbortError.'],
      followUps: ['How would you do this without AbortController?', 'What happens to the request when the component unmounts?'],
      modelAnswer: 'The network does not preserve order, so an older, slower response can land after a newer one and overwrite it. In my composable the fetch runs inside a watcher; each run creates an AbortController and registers abort as the cleanup, so Vue cancels the previous request right before starting the next and when the component unmounts. Aborted requests reject with AbortError, which I ignore, and I also check signal.aborted after the await so a late result can never be applied. Without AbortController I would use an incrementing request id and drop responses whose id is not the latest.',
    },
    {
      id: 'project-api-explorer-fetch-ok',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate\'s list shows "undefined" items when the server is down, and the error state never appears. Why?',
      code: {
        lang: 'js',
        code: `try {
  const response = await fetch('/api/books?page=1')
  const data = await response.json()
  items.value = data.items
  status.value = 'success'
} catch (err) {
  status.value = 'error'
}`,
      },
      answer: 'A 5xx response does not make `fetch()` reject, so the catch never runs. The error body is parsed (or fails to parse) and `data.items` is undefined. Check `response.ok` and throw for non-2xx responses so the catch path handles them.',
      explanation: 'Network failure → reject. HTTP error → resolve with `ok: false`.',
      whyAsked: 'Extremely common bug; checks you know fetch semantics precisely.',
      mistakes: ['Blaming JSON parsing only.', 'Saying fetch throws on 500.'],
      followUps: ['What does Axios do differently?', 'How would you surface the server\'s error message?'],
      modelAnswer: 'fetch only rejects when the request itself fails — network down, CORS failure, or abort. A 500 is still a response, so the promise resolves, the code parses the error body, and items becomes undefined while status says success. I would check response.ok right after the fetch and throw an ApiError with the status and a user-facing message. Axios, by default, rejects for non-2xx statuses, which is one reason people like it, but with fetch you do it yourself.',
    },
    {
      id: 'project-api-explorer-rate-limit',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'The real books API starts returning **429 Too Many Requests** when users type quickly. What do you change in the client?',
      answer: 'Reduce and space out requests: keep (or lengthen) the debounce, set a minimum query length, cache responses so repeated queries are free, and cancel obsolete requests. Handle 429 explicitly: read the `Retry-After` header if present, show a calm message, and retry with backoff rather than immediately. And talk to the backend team — the client cannot be the only protection; the server must enforce limits.',
      explanation: 'Fewer requests, smarter retries, honest messaging.',
      whyAsked: 'Tests practical API judgement beyond the happy path.',
      mistakes: ['Retrying instantly in a loop.', 'Hiding the error.', 'Assuming client-side throttling protects the server.'],
      followUps: ['Does aborting a request reduce load on the server?', 'Where would you implement backoff?'],
      modelAnswer: 'First I would make the client cheaper: a debounce that suits real typing, a minimum query length, a small response cache keyed by query and page, and cancellation of obsolete requests. Then I would treat 429 as its own error type: show a friendly "too many searches, retrying shortly" message and retry with backoff, honouring Retry-After if the server sends it. I would also mention that aborting only stops the client waiting — the server may still do the work — so real protection belongs on the server.',
    },
    {
      id: 'project-api-explorer-layers',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'Your explorer has `api.js`, `useBookSearch.js` and components. What belongs in each layer, and why split them?',
      answer: '`api.js` knows HTTP: URLs, query params, headers, status checks, mapping failures to typed errors. `useBookSearch` knows the UI workflow: reactive inputs, debounce, cancellation, status, pagination — but not URLs. Components only render state and emit user intent. The split makes each part replaceable and testable: the API can be faked (as in this sandbox), the composable tested with a fake API, the components tested with plain props.',
      explanation: 'Transport → workflow → presentation.',
      whyAsked: 'Shows whether you can structure async code so it scales beyond one screen.',
      mistakes: ['Calling fetch directly in components.', 'Letting the composable build URLs.', 'Putting UI strings in the API layer without thought.'],
      followUps: ['Where would caching go?', 'Would you put this in Pinia instead?'],
      modelAnswer: 'I keep three layers. The api module owns transport: building the URL, sending the request with the signal, checking response.ok and turning failures into an ApiError. The composable owns the workflow: query, page, debounce, cancellation and the status machine, and it depends on the api function, not on fetch. Components render state and emit intent. That made this project possible in a sandbox with no network — I swapped the transport for a fake — and the same split lets me unit-test the composable with a fake API. Caching would go in the api layer or a dedicated query cache; Pinia only if the results must be shared across screens.',
    },
    {
      id: 'project-api-explorer-caching',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 5,
      question: 'Users go back and forth between pages and see a loading state every time. Compare options for fixing it: a hand-written cache, a Pinia store, or a data-fetching library such as TanStack Query (Vue Query).',
      answer: 'A small `Map` cache keyed by `query|page` is quick and transparent but you must handle expiry, invalidation and memory yourself. A Pinia store helps share results across components but is not a cache by itself — you would still write the caching rules. A data-fetching library provides caching, deduplication, background refetch ("stale-while-revalidate"), retries and cancellation out of the box, at the cost of a dependency and its concepts. Choose based on how many screens fetch data and how fresh it must be.',
      explanation: 'Caching is a policy problem (freshness, invalidation), not just storage.',
      whyAsked: 'Senior candidates are expected to weigh build-vs-buy and understand what libraries actually solve.',
      mistakes: ['Saying Pinia caches requests automatically.', 'Caching forever without invalidation.', 'Attributing these libraries to Vue core.'],
      followUps: ['How would you invalidate after a user edits a book?', 'What is stale-while-revalidate?'],
      modelAnswer: 'For one screen, a Map cache keyed by query and page with a short time-to-live gives instant back-navigation, and I can show cached data immediately while refetching in the background. Pinia is great for sharing state, but it does not cache requests by itself — I would still write the expiry and invalidation rules. Once several screens fetch overlapping data, a library like TanStack Query for Vue earns its place: caching, deduplication, background refetch, retries and cancellation are built in. That is an ecosystem library, not part of Vue, so it is a dependency decision. Either way, the hard part is invalidation — for example, clearing cached pages after the user edits a book.',
    },
    {
      id: 'project-api-explorer-coding-latest',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 12,
      question: 'Implement `useLatestRequest(loader)` in `useLatestRequest.js`. It returns `{ data, error, loading, run }`. `run(...args)` calls `loader(...args, signal)` with a fresh `AbortController` signal, **aborting the previous call**. Only the latest call may update `data` or `error`; `AbortError`s are ignored; `loading` is true while the latest call is pending. `run` must never reject.',
      starter: { files: { 'App.vue': latestApp, 'useLatestRequest.js': latestStarter } },
      tests: [
        {
          name: 'the latest call wins and the older one is aborted',
          code: `${latestTestLoader}
const req = withSetup(() => useLatestRequest(loader))
req.run('slow').catch(() => {})
req.run('fast').catch(() => {})
expect(req.loading.value).toBe(true)
await wait(300)
expect(req.data.value).toBe('fast')
expect(aborted).toContain('slow')
expect(req.loading.value).toBe(false)
expect(req.error.value).toBeNull()`,
        },
        {
          name: 'a stale result is ignored even if the loader ignores the signal',
          code: `const stubborn = (value) => new Promise((resolve) => setTimeout(() => resolve(value), value === 'slow' ? 200 : 40))
const { useLatestRequest } = requireModule('useLatestRequest.js')
const req = withSetup(() => useLatestRequest(stubborn))
req.run('slow').catch(() => {})
req.run('fast').catch(() => {})
await wait(300)
expect(req.data.value).toBe('fast')`,
        },
        {
          name: 'real errors are exposed, run() does not reject',
          code: `${latestTestLoader}
const req = withSetup(() => useLatestRequest(loader))
let rejected = false
await req.run('boom').catch(() => { rejected = true })
expect(rejected).toBe(false)
expect(req.error.value && req.error.value.message).toBe('boom')
expect(req.data.value).toBeNull()
expect(req.loading.value).toBe(false)`,
        },
      ],
      hints: [
        'Keep the current controller in a variable outside `run` (it does not need to be reactive).',
        'At the start of `run`, abort the previous controller, create a new one and remember it as the current one.',
        'After `await`, compare: if this call\'s controller is no longer the current one, return without touching state. Do the same in `catch` and `finally`.',
      ],
      answer: 'Store the latest AbortController in a closure variable. Each `run` aborts the previous one, creates its own, and after awaiting only updates state if it is still the latest. AbortErrors and errors from outdated calls are ignored; a try/catch/finally keeps `run` from rejecting.',
      solution: { files: { 'App.vue': latestApp, 'useLatestRequest.js': latestSolution } },
      explanation: 'Identity comparison (`current !== controller`) handles both cases: loaders that honour the signal (they reject with AbortError) and loaders that ignore it (their late result is dropped).',
      whyAsked: 'Implementing "latest wins" from scratch shows real understanding of async ordering and cancellation, beyond copying a pattern.',
      mistakes: ['Only ignoring AbortError but still applying stale results from loaders that ignore the signal.', 'Setting `loading = false` when an outdated call finishes.', 'Letting errors escape from `run`.'],
      followUps: ['How would you add a timeout?', 'How would you dedupe identical concurrent calls instead of cancelling?'],
      modelAnswer: 'I keep the latest AbortController in a closure. Each run aborts the previous controller, creates a new one, stores it, and calls the loader with its signal. After the await I check that my controller is still the current one; if not, I return without touching state. In catch, I ignore AbortErrors and errors from outdated calls; otherwise I set error. In finally, only the latest call clears loading. Because everything is caught, run never rejects. A timeout would be another abort trigger via setTimeout, or AbortSignal.timeout where supported.',
    },
  ],

  takeaways: [
    'Model every request with one `status` (`idle` / `loading` / `success` / `error`) and render each state deliberately.',
    '`fetch()` resolves on HTTP errors — check `response.ok`; it rejects with `AbortError` when cancelled, which is not a real error.',
    'Fetch inside a watcher with an `AbortController` per run and `abort()` in the cleanup: new inputs and unmounting cancel stale requests.',
    'Debounce typing to send fewer requests; cancellation is still needed for correctness.',
    'Keep transport (`api.js`), workflow (a composable) and presentation (components) separate — it is what made faking the API possible.',
  ],
}
