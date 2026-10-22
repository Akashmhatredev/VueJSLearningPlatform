// Lesson: Service layers, boundaries & configuration (Level 15 — Vue Project Architecture)

// ---------------------------------------------------------------- playground

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import { config } from './config.js'
import { createHttpClient } from './services/http.js'
import { createBooksApi } from './services/booksApi.js'
import { BooksApiKey } from './services/keys.js'

// Wire the layers together ONCE, at the edge of the app.
const http = createHttpClient({ baseUrl: config.apiBaseUrl })
const booksApi = createBooksApi(http, { pageSize: config.pageSize })

createApp(App)
  .provide(BooksApiKey, booksApi) // any component below can inject() it
  .mount('#app')`

const configJs = `// All configuration in ONE module.
// In a real Vite app you read build-time env vars here, e.g.
//   apiBaseUrl: import.meta.env.VITE_API_BASE_URL
// (this sandbox has no import.meta.env, so the values are written inline)
export const config = Object.freeze({
  apiBaseUrl: '/api',
  pageSize: 3,
})`

const fakeServerJs = `// A pretend backend so the sandbox needs no network.
// It answers like many real JSON APIs: snake_case fields wrapped in { data }.
export const server = {
  failuresLeft: 0, // set to 1 to make the next request fail with a 503
}

const books = [
  { book_id: 'b1', title: 'The Quiet Compiler', author_name: 'Mira Okafor', published_at: '2019-04-02', page_count: 310 },
  { book_id: 'b2', title: 'Signals at Dawn', author_name: 'Tomas Lind', published_at: '2021-11-15', page_count: 254 },
  { book_id: 'b3', title: 'A Map of Small Things', author_name: 'Priya Nair', published_at: '2016-06-30', page_count: 198 },
  { book_id: 'b4', title: 'Notes on Patience', author_name: 'Jun Watanabe', published_at: '2023-01-09', page_count: 142 },
]

function jsonResponse(status, body) {
  const copy = JSON.parse(JSON.stringify(body))
  return { ok: status >= 200 && status < 300, status, json: async () => copy }
}

// Simplified stand-in for window.fetch(): resolves with a Response-like object.
export function fakeFetch(url) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (server.failuresLeft > 0) {
        server.failuresLeft--
        resolve(jsonResponse(503, { error: 'Service Unavailable' }))
        return
      }
      const { pathname, searchParams } = new URL(url, 'https://fake.local')
      if (pathname === '/api/books') {
        const limit = Number(searchParams.get('limit') || books.length)
        resolve(jsonResponse(200, { data: books.slice(0, limit), total: books.length }))
      } else {
        resolve(jsonResponse(404, { error: 'Not Found' }))
      }
    }, 120)
  })
}`

const httpJs = `import { fakeFetch } from './fakeServer.js'

export class HttpError extends Error {
  constructor(status, url) {
    super('Request failed with status ' + status)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}

// The ONE place that knows how to speak HTTP.
export function createHttpClient({ baseUrl, fetchImpl = fakeFetch }) {
  async function request(method, path, { query, body } = {}) {
    const search = query ? '?' + new URLSearchParams(query) : ''
    const url = baseUrl + path + search
    const res = await fetchImpl(url, {
      method,
      headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
    // fetch() only rejects on network failure: a 404 or 500 still resolves!
    if (!res.ok) throw new HttpError(res.status, url)
    return res.json()
  }

  return {
    get: (path, options) => request('GET', path, options),
    post: (path, body) => request('POST', path, { body }),
  }
}`

const booksApiJs = `// Endpoint module: one function per backend endpoint for "books".
// Components never see URLs or the server's JSON shape.

// Adapter: server shape (DTO) -> app shape. The ONLY place that knows snake_case.
export function toBook(dto) {
  return {
    id: dto.book_id,
    title: dto.title,
    author: dto.author_name,
    publishedYear: Number(dto.published_at.slice(0, 4)),
  }
}

export function createBooksApi(http, { pageSize }) {
  return {
    async list() {
      const body = await http.get('/books', { query: { limit: pageSize } })
      return body.data.map(toBook)
    },
  }
}`

const keysJs = `// Injection keys. A Symbol can never collide with another library's key.
export const BooksApiKey = Symbol('BooksApi')`

const useBooksJs = `import { ref, inject } from 'vue'
import { BooksApiKey } from '../../services/keys.js'

// The composable owns UI-facing state: data, loading, error.
// It doesn't know URLs or JSON shapes — that's the service's job.
export function useBooks() {
  const api = inject(BooksApiKey)
  const books = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function load() {
    loading.value = true
    try {
      books.value = await api.list()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return { books, loading, error, load }
}`

const bookListVue = `<script setup>
// Presentational: receives app-shaped books, renders them. No fetching here.
defineProps({
  books: { type: Array, required: true },
})
</script>

<template>
  <ul class="books">
    <li v-for="book in books" :key="book.id" class="book">
      <strong>{{ book.title }}</strong> — {{ book.author }} ({{ book.publishedYear }})
      · <span class="pages">{{ book.pageCount }} pages</span>
    </li>
  </ul>
</template>`

const appVue = `<script setup>
import { onMounted } from 'vue'
import { useBooks } from './features/books/useBooks.js'
import BookList from './features/books/BookList.vue'

const { books, loading, error, load } = useBooks()
onMounted(load)
</script>

<template>
  <h1>Library</h1>
  <button class="reload" :disabled="loading" @click="load">Reload</button>
  <p v-if="loading" class="loading">Loading…</p>
  <p v-if="error" class="error" role="alert">Couldn't load books ({{ error.message }}).</p>
  <BookList :books="books" />
</template>`

const playgroundFiles = {
  'main.js': mainJs,
  'App.vue': appVue,
  'config.js': configJs,
  'services/http.js': httpJs,
  'services/booksApi.js': booksApiJs,
  'services/keys.js': keysJs,
  'services/fakeServer.js': fakeServerJs,
  'features/books/useBooks.js': useBooksJs,
  'features/books/BookList.vue': bookListVue,
}

// ---------------------------------------------------------------- exercise 1

const usersFakeHttp = `// Simplified fake HTTP client for this exercise (no network).
const users = [
  { id: 1, first_name: 'Grace', last_name: 'Hopper', email_address: 'grace@example.com', is_active: true, signup_ts: '2024-01-15T09:30:00Z' },
  { id: 2, first_name: 'Linus', last_name: null, email_address: 'linus@example.com', is_active: false, signup_ts: '2023-07-04T18:00:00Z' },
]

export const http = {
  get(path) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (path === '/users') resolve({ results: JSON.parse(JSON.stringify(users)), count: users.length })
        else reject(new Error('404 ' + path))
      }, 100)
    })
  },
}`

const usersApp = `<script setup>
import { ref, onMounted } from 'vue'
import { http } from './services/http.js'
import { createUsersApi } from './services/usersApi.js'

const api = createUsersApi(http)
const users = ref([])

onMounted(async () => {
  users.value = await api.list()
})
</script>

<template>
  <h1>Team</h1>
  <ul>
    <li v-for="user in users" :key="user.id" class="user">
      <span class="name">{{ user.fullName }}</span>
      <span class="email">{{ user.email }}</span>
      <span class="status">{{ user.active ? 'active' : 'inactive' }}</span>
    </li>
  </ul>
</template>`

const usersApiStarter = `// TODO 1: map the server's user (DTO) into the app's shape:
//   { id, fullName, email, active, signedUpAt }
export function toUser(dto) {
  return dto
}

// TODO 2: list() should call http.get('/users') and map body.results with toUser.
export function createUsersApi(http) {
  return {
    async list() {
      return []
    },
  }
}`

const usersApiSolution = `// Adapter: the only code that knows the server's field names.
export function toUser(dto) {
  return {
    id: dto.id,
    fullName: [dto.first_name, dto.last_name].filter(Boolean).join(' '),
    email: dto.email_address,
    active: Boolean(dto.is_active),
    signedUpAt: new Date(dto.signup_ts),
  }
}

// Endpoint module: hides the URL and the response envelope ({ results }).
export function createUsersApi(http) {
  return {
    async list() {
      const body = await http.get('/users')
      return body.results.map(toUser)
    },
  }
}`

// ---------------------------------------------------------------- exercise 2

const useUsersMain = `import { createApp } from 'vue'
import App from './App.vue'
import { usersApi } from './services/usersApi.js'
import { UsersApiKey } from './services/keys.js'

createApp(App).provide(UsersApiKey, usersApi).mount('#app')`

const useUsersApi = `// A finished endpoint module with a built-in fake backend (no network).
const rows = [
  { id: 1, fullName: 'Grace Hopper' },
  { id: 2, fullName: 'Katherine Johnson' },
]

export const usersApi = {
  list() {
    return new Promise((resolve) => setTimeout(() => resolve(rows.map((r) => ({ ...r }))), 100))
  },
}`

const useUsersApp = `<script setup>
import { onMounted } from 'vue'
import { useUsers } from './features/users/useUsers.js'

const { users, loading, error, load } = useUsers()
onMounted(load)
</script>

<template>
  <h1>Team</h1>
  <p v-if="loading" class="loading">Loading…</p>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <ul>
    <li v-for="user in users" :key="user.id" class="user">{{ user.fullName }}</li>
  </ul>
  <button class="reload" :disabled="loading" @click="load">Reload</button>
</template>`

const useUsersStarter = `import { ref, inject } from 'vue'
import { UsersApiKey } from '../../services/keys.js'

// TODO: own the UI state for loading users.
//  - api defaults to inject(UsersApiKey) but can be passed in (tests do that)
//  - return { users, loading, error, load }
export function useUsers(api = inject(UsersApiKey)) {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function load() {
    // TODO
  }

  return { users, loading, error, load }
}`

const useUsersSolution = `import { ref, inject } from 'vue'
import { UsersApiKey } from '../../services/keys.js'

export function useUsers(api = inject(UsersApiKey)) {
  const users = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function load() {
    loading.value = true
    error.value = null // a new attempt starts with a clean slate
    try {
      users.value = await api.list()
    } catch (e) {
      console.error('[useUsers] load failed:', e) // technical detail → logs
      error.value = 'Could not load users. Please try again.' // human message → UI
    } finally {
      loading.value = false
    }
  }

  return { users, loading, error, load }
}`

const useUsersFiles = (composable) => ({
  'main.js': useUsersMain,
  'App.vue': useUsersApp,
  'services/keys.js': `export const UsersApiKey = Symbol('UsersApi')`,
  'services/usersApi.js': useUsersApi,
  'features/users/useUsers.js': composable,
})

// ---------------------------------------------------------------- interview coding

const httpCodingApp = `<script setup>
import { ref, onMounted } from 'vue'
import { createHttpClient } from './http.js'

// A fake fetch so the demo works without a network.
const fakeFetch = async (url) => ({ ok: true, status: 200, json: async () => ({ youRequested: url }) })
const http = createHttpClient({ baseUrl: 'https://api.example.test', fetchImpl: fakeFetch })
const result = ref('…')

onMounted(async () => {
  try {
    const data = await http.get('/books', { query: { limit: 2 } })
    result.value = JSON.stringify(data)
  } catch (e) {
    result.value = 'Error: ' + e.message
  }
})
</script>

<template>
  <p class="result">{{ result }}</p>
</template>`

const httpCodingStarter = `export class HttpError extends Error {
  constructor(status, url) {
    super('Request failed with status ' + status)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}

// TODO: return { get(path, { query } = {}) } that
//  - builds baseUrl + path (+ '?' + query string when query is given)
//  - calls fetchImpl(url, { method: 'GET', headers: { Accept: 'application/json' } })
//  - throws HttpError(status, url) when the response is not ok
//  - otherwise returns the parsed JSON body
export function createHttpClient({ baseUrl, fetchImpl }) {
  return {
    async get(path) {
      const res = await fetchImpl(baseUrl + path)
      return res.json()
    },
  }
}`

const httpCodingSolution = `export class HttpError extends Error {
  constructor(status, url) {
    super('Request failed with status ' + status)
    this.name = 'HttpError'
    this.status = status
    this.url = url
  }
}

export function createHttpClient({ baseUrl, fetchImpl }) {
  return {
    async get(path, { query } = {}) {
      const search = query ? '?' + new URLSearchParams(query).toString() : ''
      const url = baseUrl + path + search
      const res = await fetchImpl(url, { method: 'GET', headers: { Accept: 'application/json' } })
      if (!res.ok) throw new HttpError(res.status, url)
      return res.json()
    },
  }
}`

export default {
  id: 'service-layers',
  title: 'Service layers, boundaries & configuration',
  summary: 'Keep HTTP details, data mapping and configuration out of your components by giving every layer one job: component → composable/store → service → HTTP client.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['fetching-data', 'provide-inject', 'composables-intro', 'project-structure'],
  related: ['error-handling', 'api-production', 'pinia-async-patterns', 'resilient-requests', 'design-patterns', 'composable-design'],
  tags: ['architecture', 'service layer', 'api client', 'adapter', 'dto', 'dependency injection', 'provide inject', 'environment variables', 'import.meta.env', 'configuration'],
  apis: [
    { name: 'app.provide()', summary: 'Provides a value (such as a service) to every component in the app; read it with inject().' },
    { name: 'inject()', summary: 'Reads a value provided by an ancestor or the app. Must be called during setup (or inside app.runWithContext(), 3.3+).' },
    { name: 'import.meta.env', summary: 'Vite\'s build-time environment object. Only variables prefixed with VITE_ (by default) are exposed to client code.' },
  ],
  docs: [
    { label: 'Vue Guide — Provide / Inject', url: 'https://vuejs.org/guide/components/provide-inject.html' },
    { label: 'Vue API — app.provide()', url: 'https://vuejs.org/api/application.html#app-provide' },
    { label: 'Vue Guide — Composables', url: 'https://vuejs.org/guide/reusability/composables.html' },
    { label: 'Vite — Env Variables and Modes', url: 'https://vite.dev/guide/env-and-mode.html' },
    { label: 'Pinia — Setup stores', url: 'https://pinia.vuejs.org/core-concepts/#setup-stores' },
    { label: 'MDN — Using the Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
  ],

  intro: `
A **service layer** is the part of your app that talks to the outside world — usually a backend API — so that the rest of your code doesn't have to.

It's normally two small pieces:

- an **HTTP client** (\`services/http.js\`): the *one* place that knows the base URL, headers, JSON parsing and how failed responses become errors;
- **endpoint modules** (\`booksApi.js\`, \`usersApi.js\`): one function per backend endpoint, which also translate the server's data into the shape your app wants. That translation step is called an **adapter**.

Above them, **composables** or **stores** own the UI-facing state (data, loading, error), and **components** just render it. Add one module that holds the app's **configuration** (API URL, page size, feature flags) and you have the backbone of a maintainable Vue app.
`,

  why: `
Here's how API code usually starts — inside a component:

\`\`\`js
const res = await fetch('https://api.example.com/v2/books?limit=3', {
  headers: { Authorization: 'Bearer ' + localStorage.token },
})
const json = await res.json()
books.value = json.data.map((b) => ({ title: b.title, author: b.author_name }))
\`\`\`

Now copy that into twenty components. Then:

- the API moves from \`/v2\` to \`/v3\` → twenty edits;
- the backend renames \`author_name\` to \`author\` → twenty edits, and you'll miss one;
- you need to add a request ID header, or handle "session expired" everywhere → twenty edits;
- you want a test that doesn't hit the real server → impossible without mocking \`fetch\` globally.

The service layer exists to give each of those changes **exactly one home**. URLs live in endpoint modules, field names live in adapters, headers and error rules live in the HTTP client, and configuration lives in one config module. Components get boring — which is precisely what you want.
`,

  eli15: `
Think about ordering food at a restaurant.

You (the **component**) tell the **waiter** what you want: "the pasta, please". The waiter (the **composable** or **store**) keeps track of your order — is it coming, is it late, did the kitchen run out?

The waiter passes the order to the **kitchen** (the **service**), which knows the recipes: "pasta means *these* ingredients from *that* supplier". The kitchen orders from **suppliers** through one delivery company (the **HTTP client**), which handles addresses, paperwork and returns.

When the food arrives, the kitchen **plates it** (the **adapter**) — you never get a raw box of ingredients with the supplier's labels on it.

Nobody does someone else's job. If the supplier changes their packaging, only the kitchen notices. You still just say "the pasta, please".
`,

  analogy: {
    title: 'The restaurant chain of command',
    body: `
A restaurant runs smoothly because every role has one job and talks only to its neighbours. Guests don't walk into the kitchen; chefs don't phone guests; the delivery company doesn't decide the menu. A change in one place — a new supplier, a new recipe — doesn't ripple through the whole building.
`,
    mapping: [
      ['the guest', 'a component — asks for data, renders it'],
      ['the waiter tracking the order', 'a composable or store — owns `loading`, `error`, data'],
      ['the kitchen and its recipes', 'endpoint modules (`booksApi.js`) — know which URLs to call'],
      ['plating the food', 'the adapter — turns server JSON into app-shaped objects'],
      ['the delivery company', 'the HTTP client — base URL, headers, errors'],
      ['the restaurant\'s rule book', 'the config module — API URL, limits, feature flags'],
      ['hiring a stand-in kitchen for a rehearsal', 'injecting a fake service in tests'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'One request through the layers',
    props: {
      width: 820,
      height: 320,
      nodes: [
        { id: 'ui', label: 'Component', note: 'renders state', tone: 'acid', x: 90, y: 160 },
        { id: 'comp', label: 'Composable / store', note: 'data · loading · error', tone: 'cobalt', x: 260, y: 160 },
        { id: 'service', label: 'booksApi.list()', note: 'endpoint module', tone: 'paper', x: 440, y: 70 },
        { id: 'adapter', label: 'toBook()', note: 'adapter: DTO → model', tone: 'kraft', x: 440, y: 250 },
        { id: 'http', label: 'HTTP client', note: 'base URL · headers · errors', tone: 'ink', x: 600, y: 160 },
        { id: 'server', label: 'Server', note: 'snake_case JSON', tone: 'paper', x: 740, y: 160 },
      ],
      edges: [
        { from: 'ui', to: 'comp', label: 'load()' },
        { from: 'comp', to: 'service', label: 'api.list()' },
        { from: 'service', to: 'http', label: "get('/books')" },
        { from: 'http', to: 'server', label: 'fetch' },
        { from: 'http', to: 'adapter', label: 'raw DTOs' },
        { from: 'adapter', to: 'comp', label: 'Book[]' },
        { id: 'err', from: 'http', to: 'comp', label: 'HttpError', dashed: true },
      ],
      steps: [
        { focus: ['ui'], text: 'The **component** asks for data by calling `load()`. It has no idea which URL is involved or what the JSON looks like.' },
        { focus: ['comp'], edges: ['ui->comp'], text: 'The **composable** (or a Pinia store) sets `loading = true` and calls the injected service. It owns the UI-facing state: data, loading, error.' },
        { focus: ['service'], edges: ['comp->service'], text: 'The **endpoint module** knows the backend: "listing books means `GET /books?limit=3`". Change the URL here and nowhere else.' },
        { focus: ['http'], edges: ['service->http'], text: 'The **HTTP client** adds the base URL from config, sets headers, sends the request and checks `res.ok` — because `fetch()` does *not* reject on 404 or 500.' },
        { focus: ['server'], edges: ['http->server'], text: 'The **server** answers in its own dialect: `{ data: [{ book_id, author_name, published_at }] }`.' },
        { focus: ['adapter'], edges: ['http->adapter'], text: 'The **adapter** translates each DTO (*data transfer object*: the raw server shape) into the app\'s model: `{ id, author, publishedYear }`. Snake_case never leaves this function.' },
        { focus: ['comp', 'ui'], edges: ['adapter->comp'], text: 'The composable stores the clean `Book[]`, sets `loading = false`, and Vue re-renders the component.' },
        { focus: ['http', 'comp', 'ui'], edges: ['err'], text: 'If the response is not ok, the HTTP client throws an `HttpError`. The composable catches it and sets `error`; the component shows a friendly message. More in [error handling](lesson:error-handling).' },
      ],
    },
    caption: 'Requests flow right, clean data flows back. Every layer has one job.',
    alt: 'A flow diagram. A Component calls load() on a Composable or store, which calls booksApi.list(), an endpoint module. That calls the HTTP client with get /books, which fetches from the Server. The raw DTOs go from the HTTP client to toBook(), the adapter, which returns Book objects to the composable. A dashed arrow labelled HttpError goes from the HTTP client back to the composable for failures.',
  },

  syntax: [
    `
#### 1. The HTTP client — one per app
`,
    {
      code: `// services/http.js
export function createHttpClient({ baseUrl, fetchImpl = (...args) => fetch(...args), getToken }) {
  async function request(method, path, { query, body } = {}) {
    const url = baseUrl + path + (query ? '?' + new URLSearchParams(query) : '')
    const token = getToken?.()
    const res = await fetchImpl(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new HttpError(res.status, url)   // fetch won't do this for you
    return res.status === 204 ? null : res.json()
  }
  return {
    get: (path, opts) => request('GET', path, opts),
    post: (path, body) => request('POST', path, { body }),
    put: (path, body) => request('PUT', path, { body }),
    delete: (path) => request('DELETE', path),
  }
}`,
      lang: 'js',
      title: 'a thin wrapper over fetch()',
    },
    `
Passing \`fetchImpl\` in (instead of calling the global \`fetch\` directly) is a small trick with a big payoff: tests can hand in a fake. If you use a library such as Axios, the same idea applies — wrap it in *your* module so the rest of the app never imports the library directly.

#### 2. Endpoint modules + adapters — one per resource
`,
    {
      code: `// services/booksApi.js
export function toBook(dto) {               // adapter: server shape → app shape
  return { id: dto.book_id, title: dto.title, author: dto.author_name }
}

export function createBooksApi(http) {
  return {
    async list({ limit = 20 } = {}) {
      const body = await http.get('/books', { query: { limit } })
      return body.data.map(toBook)
    },
    async getById(id) {
      return toBook(await http.get('/books/' + encodeURIComponent(id)))
    },
  }
}`,
      lang: 'js',
      title: 'endpoints + adapter',
    },
    `
#### 3. Composables / stores own UI state — and get the service injected
`,
    {
      code: `// main.js — wire once
const http = createHttpClient({ baseUrl: config.apiBaseUrl })
app.provide(BooksApiKey, createBooksApi(http))

// features/books/useBooks.js — consume
export function useBooks() {
  const api = inject(BooksApiKey)
  const books = ref([]), loading = ref(false), error = ref(null)
  async function load() {
    loading.value = true
    error.value = null
    try { books.value = await api.list() }
    catch (e) { error.value = e }
    finally { loading.value = false }
  }
  return { books, loading, error, load }
}`,
      lang: 'js',
      title: 'provide at the app, inject where needed',
    },
    `
Shared across many components, or needs devtools and caching? Put the same logic in a **Pinia store** instead (Pinia is a separate library, not part of Vue core). The store's actions call the service; components call the store:
`,
    {
      code: `// features/books/stores/booksStore.js  (Pinia setup store)
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { booksApi } from '@/services/booksApi.js'   // a ready-made instance

export const useBooksStore = defineStore('books', () => {
  const books = ref([])
  const loading = ref(false)
  async function fetchBooks() {
    loading.value = true
    try { books.value = await booksApi.list() } finally { loading.value = false }
  }
  return { books, loading, fetchBooks }
})`,
      lang: 'js',
      title: 'the same layer, as a store',
      static: true,
    },
    `
#### 4. Configuration — read the environment in one place
`,
    {
      code: `# .env                      (committed: safe, public defaults)
VITE_API_BASE_URL=/api
VITE_ENABLE_NEW_CHECKOUT=false

# .env.production           (used by \`vite build\`, i.e. mode "production")
VITE_API_BASE_URL=https://api.example.com

# .env.local                (git-ignored: your machine only)
VITE_API_BASE_URL=http://localhost:8080/api`,
      lang: 'bash',
      title: '.env files',
    },
    {
      code: `// config/env.js — the ONLY file that touches import.meta.env
function required(name) {
  const value = import.meta.env[name]
  if (!value) throw new Error('Missing env variable ' + name)
  return value
}

export const config = Object.freeze({
  apiBaseUrl: required('VITE_API_BASE_URL'),
  enableNewCheckout: import.meta.env.VITE_ENABLE_NEW_CHECKOUT === 'true', // .env values are strings
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
})`,
      lang: 'js',
      title: 'config/env.js',
      static: true,
    },
    {
      callout: 'warn',
      title: 'Frontend env variables are public',
      text: 'Vite **replaces `import.meta.env.VITE_*` with the literal values at build time** — they end up inside the JavaScript every visitor downloads. Only the `VITE_` prefix (by default) is exposed, precisely to stop you leaking other variables by accident. Never put API secrets, database passwords or private keys in a `VITE_` variable; keep them on a server. And frontend checks never replace backend authorization.',
    },
    {
      callout: 'version',
      text: '`provide`/`inject` and `app.provide()` are core Vue 3 APIs. `app.runWithContext()` (run code with access to app-level `inject()` outside a component) needs **Vue 3.3+**. `import.meta.env` and `.env` files are **Vite** features, not Vue.',
    },
  ],

  walkthrough: {
    title: 'services/http.js',
    lang: 'js',
    code: httpJs,
    intro: 'This is the HTTP client from the playground. Small, but every line is a decision the rest of the app no longer has to make.',
    steps: [
      { lines: [1, 1], text: 'In this sandbox the "network" is a fake server. In a real app the default would be the browser\'s `fetch`. Either way, nothing else in the app imports it.' },
      { lines: [3, 10], text: 'A custom error class. Carrying `status` and `url` lets callers decide what to do (401 → log in again, 404 → "not found" page, 5xx → "try again") without parsing strings.' },
      { lines: [13, 13], text: '`createHttpClient` is a *factory*: it takes configuration (`baseUrl`) and dependencies (`fetchImpl`) and returns a client. Tests can create one with a fake `fetchImpl` — no global mocking.' },
      { lines: [15, 16], text: 'Build the URL in one place: base URL from config, the endpoint path, and an encoded query string via `URLSearchParams`.' },
      { lines: [17, 21], text: 'Every request gets consistent headers and JSON encoding. Adding an auth or request-ID header later is a one-line change here.' },
      { lines: [22, 23], text: 'The most important two lines: `fetch()` only rejects on **network** failure. A 404 or 500 resolves normally, so you must check `res.ok` and throw yourself.' },
      { lines: [24, 24], text: 'Successful responses are parsed once, here. Callers receive plain data.' },
      { lines: [27, 30], text: 'The public surface is tiny: `get` and `post`. Endpoint modules build on these and never deal with headers or status codes.' },
    ],
  },

  playground: {
    title: 'A library app with a real service layer',
    objective: 'Follow a request through config → HTTP client → endpoint module → adapter → composable → component, then change each layer once and see how little else has to move.',
    files: playgroundFiles,
    entry: 'main.js',
    expected: 'A **Library** heading, a Reload button, "Loading…" for a moment, then **three** books with title, author and year. Each line ends with an empty "· pages" — the UI expects a page count the adapter doesn\'t provide yet. Click through the file tabs in the order `main.js` → `config.js` → `services/` → `features/books/`.',
    experiments: [
      {
        id: 'config-page-size',
        task: 'Show **2** books per page instead of 3 — by changing **configuration only** (no component or service code).',
        hint: 'Look at `config.js`. `main.js` passes `config.pageSize` into `createBooksApi`, which sends it as `?limit=`.',
        tests: [
          {
            name: 'the list shows two books',
            code: `await wait(250)
expect(findAll('.book').length).toBe(2)`,
          },
        ],
        explain: 'Configuration lives in one module, read once at startup. In a real Vite app that module reads `import.meta.env.VITE_PAGE_SIZE`, so different environments can use different values without code changes.',
      },
      {
        id: 'adapter-page-count',
        task: '`BookList.vue` shows `book.pageCount`, but the server sends `page_count`. Fix it **in the adapter** (`toBook` in `services/booksApi.js`) so the first book reads **310 pages**. Don\'t touch the component.',
        hint: 'Add `pageCount: dto.page_count` to the object `toBook()` returns.',
        tests: [
          {
            name: 'the first book shows its page count',
            code: `await wait(250)
expect(text('.book .pages')).toBe('310 pages')`,
          },
        ],
        explain: 'The adapter is the border crossing between the server\'s vocabulary and yours. If the backend renames `page_count` next year, you change one line here — every component keeps working with `pageCount`.',
      },
      {
        id: 'reset-error',
        task: 'Simulate an outage: in `services/fakeServer.js` set `failuresLeft: 1`, run, click **Reload** — an error appears. Click **Reload** again: the books load but the error **stays on screen**. Fix `useBooks.js` so a new attempt clears the old error. (Set `failuresLeft` back to `0` afterwards — the test simulates the outage itself.)',
        hint: 'In `load()`, reset `error.value = null` at the start, next to `loading.value = true`.',
        tests: [
          {
            name: 'a successful retry clears the previous error',
            code: `await wait(250)
requireModule('services/fakeServer.js').server.failuresLeft = 1
await click('.reload')
await wait(250)
expect(exists('.error')).toBe(true)
await click('.reload')
await wait(250)
expect(exists('.error')).toBe(false)
expect(findAll('.book').length).toBeGreaterThan(0)`,
          },
        ],
        explain: 'Loading and error state are UI concerns, so they belong to the composable (or store) — not the service, not the component. Owning them in one place means the "start of a request" rule (`loading = true`, `error = null`) is written exactly once.',
      },
      {
        id: 'inject-fake',
        task: 'Without editing any component, composable or service, make the app show a **single** book titled **Testing Vue** by providing a **fake** books API in `main.js`.',
        hint: 'Replace `.provide(BooksApiKey, booksApi)` with `.provide(BooksApiKey, { list: async () => [{ id: \'t1\', title: \'Testing Vue\', author: \'A. Tester\', publishedYear: 2024, pageCount: 1 }] })`.',
        tests: [
          {
            name: 'the app renders the fake API\'s single book',
            code: `await wait(250)
expect(findAll('.book').length).toBe(1)
expect(text('.book')).toContain('Testing Vue')`,
          },
        ],
        explain: 'Because `useBooks()` *injects* its service instead of importing a concrete one, anything with a `list()` method can stand in: a fake for tests, a mock server for demos, a different backend for another customer. That is dependency injection — Vue\'s `provide`/`inject` gives it to you for free.',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'fetch() in the component vs a service layer',
    props: {
      left: {
        label: 'Everything in the component',
        lang: 'vue',
        code: `<script setup>
import { ref, onMounted } from 'vue'

const books = ref([])
const loading = ref(true)

onMounted(async () => {
  const res = await fetch(
    'https://api.example.com/v2/books?limit=3',
    { headers: { Authorization: 'Bearer ' + localStorage.token } },
  )
  const json = await res.json()   // 500? still parsed as success
  books.value = json.data.map((b) => ({
    id: b.book_id,
    author: b.author_name,
  }))
  loading.value = false
})
</script>`,
      },
      right: {
        label: 'Component + composable + service',
        lang: 'vue',
        code: `<script setup>
import { onMounted } from 'vue'
import { useBooks } from '@/features/books'

const { books, loading, error, load } = useBooks()
onMounted(load)
</script>

<!-- useBooks()     → owns loading / error / data
     booksApi.list() → knows GET /books?limit=…
     toBook()        → maps book_id, author_name
     http.get()      → base URL, auth, res.ok    -->`,
      },
      points: [
        'Left: the URL, API version, auth header, response envelope and field names are all hard-coded in a component — and repeated in every other component that needs books.',
        'Left: no res.ok check, so a 500 response is treated as data; no error state for the UI.',
        'Right: the component only renders state. Each concern has one home and can change independently.',
        'Right: tests can provide a fake booksApi and never touch the network.',
        'The right side is more files — worth it once more than one or two components talk to the API.',
      ],
    },
    caption: 'The same feature twice. The right side moves every "how" into a layer with one job.',
    alt: 'Two code panels. Left: a component calls fetch with a hard-coded URL and auth header, parses JSON without checking the status, and maps snake_case fields inline. Right: the component calls useBooks() and renders books, loading and error; a comment lists which layer owns each concern — useBooks for state, booksApi for the URL, toBook for field mapping, http.get for base URL, auth and status checks.',
  },

  internals: {
    beginner: `
None of this is magic: a service is just a JavaScript module with functions that return Promises. The "layer" is an agreement about **who is allowed to know what**:

- components know about **state** (books, loading, error);
- composables/stores know about **services**;
- services know about **URLs and data shapes**;
- the HTTP client knows about **HTTP**.

Each layer only talks to the one directly below it. That's why a change usually stays inside one file.
`,
    technical: [
      `
**Dependency direction.** Imports point one way: \`components → composables/stores → services → http client → config\`. A service never imports a store or a component; the HTTP client never knows about books. If a lower layer needs to tell a higher one something (e.g. "session expired"), it throws an error or calls a callback that was passed *in* (like \`getToken\` or an \`onUnauthorized\` option) — it doesn't import upward.

**provide / inject under the hood.** \`app.provide(key, value)\` stores the value on the app context. Each component instance has a \`provides\` object that inherits (via the prototype chain) from its parent's, so \`inject(key)\` walks up the chain until it finds the key. That lookup happens when \`inject()\` is called, which is why it must run synchronously during \`setup()\` (or inside \`app.runWithContext()\`, 3.3+) — after an \`await\` there is no current instance.
`,
      {
        code: `// What inject() needs: a current component (or app) context
export function useBooks() {
  const api = inject(BooksApiKey)        // ✅ during setup
  async function load() {
    // inject(BooksApiKey)                // ❌ would warn here: no active instance
    return api.list()
  }
  return { load }
}`,
        lang: 'js',
        title: 'inject() is a setup-time lookup',
      },
      `
**Symbols as keys.** \`Symbol('BooksApi')\` is unique, so two libraries can't accidentally overwrite each other's provided values. In TypeScript you type it as \`InjectionKey<BooksApi>\` so \`inject()\` returns the right type.

**Adapters at the edge.** The adapter runs once per response, at the boundary. Everything inside the app works with one consistent model (\`camelCase\`, real \`Date\` objects, booleans instead of \`'Y'/'N'\`). Some teams also **validate** the response shape here (with a schema library) so a backend change fails loudly in one place instead of rendering \`undefined\` deep in a component.

**Env variables are build-time constants.** In \`vite build\`, every \`import.meta.env.VITE_X\` is replaced by its string value. Changing \`.env\` after the build changes nothing in the deployed bundle. Mode-specific files win over generic ones (\`.env.production\` over \`.env\`), \`.local\` files win over non-local ones, and variables already set in the shell environment win over all files.
`,
    ],
    production: `
- **One HTTP client, many endpoint modules.** Cross-cutting behaviour — auth headers, request IDs, timeouts (\`AbortSignal.timeout()\` in modern browsers), "401 → redirect to login" — goes in the client, once.
- **Normalise errors in the service layer** (an \`ApiError\` with \`status\`, \`code\`, a user-safe message). Components should never parse server error bodies. See [error handling](lesson:error-handling).
- **Decide who owns server data.** Per-component data → a composable. Shared, cached, or mutated from many places → a store (or a dedicated server-state library). Don't keep the same list in both.
- **Retries, caching, deduplication and polling** live around the service call, not inside components. See [resilient requests](lesson:resilient-requests) and [cancellation](lesson:cancellation-race-conditions).
- **Generate or type the client** when the backend publishes an OpenAPI/JSON schema — the adapter layer stays, but the DTO types come for free.
- **Secrets never ship to the browser.** If an API needs a secret key, put a small backend (or "backend for frontend") in between. Treat every \`VITE_\` value as public.
- **Validate config at startup** (\`required('VITE_API_BASE_URL')\`) so a missing variable breaks the build or the first page load loudly — not a random request later.
- **Inject for testability.** In component tests with Vue Test Utils, \`mount(Comp, { global: { provide: { [BooksApiKey]: fakeApi } } })\` swaps the real service for a fake. See [testing async code](lesson:testing-async-routing).
`,
  },

  mistakes: [
    {
      title: 'Treating every resolved fetch() as success',
      wrong: { code: `const res = await fetch(url)
return res.json() // a 500 error page is now "data"`, lang: 'js' },
      right: { code: `const res = await fetch(url)
if (!res.ok) throw new HttpError(res.status, url)
return res.json()`, lang: 'js' },
      explanation: '`fetch()` only rejects when the request can\'t be made at all (offline, DNS, CORS). HTTP errors like 404 and 500 resolve normally. The HTTP client is the one place to check `res.ok` and throw.',
    },
    {
      title: 'Letting raw server shapes leak into components',
      wrong: { code: `<li v-for="b in books">{{ b.author_name }} ({{ b.published_at.slice(0, 4) }})</li>`, lang: 'vue' },
      right: { code: `<!-- the adapter already mapped it -->
<li v-for="book in books">{{ book.author }} ({{ book.publishedYear }})</li>`, lang: 'vue' },
      explanation: 'If components read the server\'s field names, every backend change is a hunt through templates. Map once in the adapter; the rest of the app speaks your model.',
    },
    {
      title: 'Putting secrets in VITE_ variables',
      wrong: { code: `# .env
VITE_PAYMENT_SECRET_KEY=sk_live_…`, lang: 'bash' },
      right: { code: `# frontend .env — public values only
VITE_PAYMENT_PUBLISHABLE_KEY=pk_live_…
# the secret key lives only on the server`, lang: 'bash' },
      explanation: 'Every `VITE_` value is pasted into the JavaScript bundle at build time and can be read by anyone who opens devtools. Secrets belong on a server that the frontend calls.',
    },
    {
      title: 'Reading import.meta.env all over the app',
      wrong: { code: `// in 30 different files
fetch(import.meta.env.VITE_API_URL + '/books')`, lang: 'js' },
      right: { code: `// config/env.js — once, validated
export const config = { apiBaseUrl: required('VITE_API_BASE_URL') }
// everywhere else
import { config } from '@/config/env.js'`, lang: 'js' },
      explanation: 'Scattered env reads mean a typo or missing variable fails silently in one corner of the app. One config module validates at startup and gives everything a single, documented source of truth.',
    },
    {
      title: 'Services that reach up into the UI',
      wrong: { code: `// services/booksApi.js
import { useToast } from '@/shared/composables/useToast.js'
import { useBooksStore } from '@/features/books/stores/booksStore.js'

export async function listBooks() {
  try { useBooksStore().books = await http.get('/books') }
  catch { useToast().show('Failed!') }
}`, lang: 'js' },
      right: { code: `// services/booksApi.js — just data in, data out (or an error)
export async function listBooks() {
  const body = await http.get('/books')
  return body.data.map(toBook)
}
// the store/composable decides what to store and what to show`, lang: 'js' },
      explanation: 'A service that writes to stores or shows toasts can\'t be reused or tested alone, and creates upward imports (and possibly cycles). Services return data or throw; callers decide what that means for the UI.',
    },
  ],

  debugging: [
    {
      symptom: '`import.meta.env.API_URL` is `undefined` in the browser.',
      cause: 'Vite only exposes variables with the `VITE_` prefix (configurable via `envPrefix`) to client code.',
      fix: 'Rename it to `VITE_API_URL` — and double-check it isn\'t a secret before you do. Restart the dev server after editing `.env` files.',
    },
    {
      symptom: 'You changed `.env.production` on the server, but the deployed app still uses the old API URL.',
      cause: 'Env values are replaced at **build** time; the bundle contains the old literal string.',
      fix: 'Rebuild and redeploy. For values that must change without a rebuild, load a runtime config file (e.g. `/config.json`) at startup instead.',
    },
    {
      symptom: 'An error page from the server shows up as broken data (`Cannot read properties of undefined (reading \'map\')`).',
      cause: 'The client parsed a 4xx/5xx response as if it were success because nobody checked `res.ok`.',
      fix: 'Check `res.ok` in the HTTP client and throw an error with the status; let the composable/store set `error`.',
    },
    {
      symptom: '`[Vue warn]: injection "Symbol(BooksApi)" not found.`',
      cause: 'Nothing provided that key — the service wasn\'t provided in `main.js`, or a test mounted the component without providing it.',
      fix: 'Call `app.provide(BooksApiKey, booksApi)` before mounting; in tests pass it through `global.provide`. Consider a default: `inject(BooksApiKey, defaultApi)`.',
    },
    {
      symptom: 'A component shows blank fields after a backend release.',
      cause: 'The backend renamed or restructured a field, and the adapter (or worse, the template) still reads the old name.',
      fix: 'Update the adapter only. Consider validating responses in the adapter so the mismatch throws a clear error instead of rendering blanks.',
    },
  ],

  bestPractices: [
    'One HTTP client module owns base URL, headers, JSON and `res.ok` checks; nothing else calls `fetch` directly.',
    'One endpoint module per backend resource; it hides URLs and response envelopes.',
    'Map server DTOs to your app model in adapters at the edge — components never see snake_case or raw envelopes.',
    'Composables (per-component) or stores (shared) own loading, error and data; services just return data or throw.',
    'Provide services at the app level with Symbol keys and `inject()` them, so tests and demos can swap in fakes.',
    'Read `import.meta.env` in exactly one config module, validate it at startup, and treat every `VITE_` value as public.',
    'Keep dependencies pointing down: components → composables/stores → services → http → config.',
  ],

  useCases: [
    'Any app that talks to a REST or JSON API from more than one or two components.',
    'Apps whose backend is evolving — adapters absorb renamed or restructured fields.',
    'Switching environments (local, staging, production) with different API URLs via `.env.[mode]` files.',
    'Running the UI against a fake or mock API for tests, demos or Storybook-style component previews.',
    'Adding cross-cutting behaviour (auth header, request IDs, "session expired" handling) in one place.',
  ],

  whenToUse: {
    use: [
      'More than one component needs data from the same backend.',
      'The server\'s data shape doesn\'t match what your UI wants.',
      'You want unit tests that never touch the network.',
      'The app runs in several environments with different configuration.',
    ],
    avoid: [
      'A one-off prototype with a single fetch — a composable calling `fetch` directly is fine.',
      'Adding a "repository", "gateway" and "service" for every endpoint — two thin layers (client + endpoint modules) are usually enough.',
      'Wrapping things that don\'t talk to the outside world; pure helpers belong in `shared/utils`.',
    ],
  },

  comparison: {
    title: 'Who knows what?',
    headers: ['Concern', 'Component', 'Composable / store', 'Endpoint module + adapter', 'HTTP client'],
    rows: [
      ['URLs & query params', '—', '—', '✅ `GET /books?limit=…`', 'builds the full URL'],
      ['Server field names (DTOs)', '—', '—', '✅ adapter maps them', '—'],
      ['Base URL, headers, auth token', '—', '—', '—', '✅'],
      ['Turning 4xx/5xx into errors', '—', '—', 'may refine (`NotFoundError`)', '✅ checks `res.ok`'],
      ['loading / error / data state', 'renders it', '✅ owns it', '—', '—'],
      ['User-facing messages', '✅ shows them', 'chooses them', '—', '—'],
    ],
    note: 'A dash means "should not know about this". The project folders that hold each layer are covered in [project structure](lesson:project-structure).',
  },

  quiz: [
    {
      id: 'service-layers-q1',
      type: 'mcq',
      prompt: 'The backend returns `{ author_name: "Mira Okafor" }` but your components want `book.author`. Where should the renaming happen?',
      options: [
        { text: 'In an adapter function inside the endpoint module (e.g. `toBook(dto)`)' },
        { text: 'In each component\'s template: `{{ book.author_name }}`', why: 'Then every component depends on the server\'s vocabulary, and a backend rename means editing many templates.' },
        { text: 'In the HTTP client, for every response', why: 'The HTTP client is generic — it shouldn\'t know what a book is. Resource-specific mapping belongs in that resource\'s endpoint module.' },
        { text: 'In a global `watch` that rewrites the data after it arrives', why: 'That adds a second, delayed copy of the data and spreads the mapping logic across time. Map once, at the boundary, before anyone sees it.' },
      ],
      answer: 0,
      explanation: 'Adapters live at the edge, next to the endpoint call, so the server\'s shape never leaks into the app.',
    },
    {
      id: 'service-layers-q2',
      type: 'output',
      prompt: 'A Vite project has this `.env` file. What does the code log in the browser?',
      code: {
        lang: 'js',
        code: `// .env
// API_URL=https://internal.example.com
// VITE_API_URL=https://api.example.com

console.log(import.meta.env.API_URL, import.meta.env.VITE_API_URL)`,
      },
      options: [
        { text: '`undefined https://api.example.com`' },
        { text: '`https://internal.example.com https://api.example.com`', why: 'Vite deliberately exposes only `VITE_`-prefixed variables to client code, so `API_URL` isn\'t available.' },
        { text: '`undefined undefined`', why: '`VITE_API_URL` has the right prefix, so Vite exposes it.' },
        { text: 'It throws: `import.meta` is not allowed', why: '`import.meta` is valid in ES modules, and Vite populates `import.meta.env`.' },
      ],
      answer: 0,
      explanation: 'Only variables with the `VITE_` prefix (by default) are embedded into the client bundle. That protects other variables from leaking by accident.',
    },
    {
      id: 'service-layers-q3',
      type: 'bug',
      prompt: 'This HTTP client treats a "500 Internal Server Error" as a successful response. Click the line where the missing check should go.',
      code: {
        lang: 'js',
        code: `export function createHttpClient({ baseUrl }) {
  return {
    async get(path) {
      const url = baseUrl + path
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      return res.json()
    },
  }
}`,
      },
      answerLine: 6,
      explanation: '`fetch()` resolves for any HTTP response, including 500. Before `return res.json()` the client must check `if (!res.ok) throw new HttpError(res.status, url)`.',
    },
    {
      id: 'service-layers-q4',
      type: 'fill',
      prompt: 'Complete the wiring so components can receive the service without importing it.',
      code: {
        lang: 'js',
        code: `// main.js
createApp(App).___(BooksApiKey, booksApi).mount('#app')

// features/books/useBooks.js
const api = ___(BooksApiKey)`,
      },
      answer: [['provide'], ['inject']],
      explanation: '`app.provide()` makes the value available to every component; `inject()` reads it during setup.',
    },
    {
      id: 'service-layers-q5',
      type: 'mcq',
      prompt: 'Which values are safe to put in a frontend `VITE_` environment variable? (Select all that apply.)',
      options: [
        { text: '`VITE_API_BASE_URL=https://api.example.com`' },
        { text: '`VITE_DB_PASSWORD=hunter2`', why: 'Everything in a `VITE_` variable ends up in the downloaded JavaScript. A database password must never reach the browser.' },
        { text: '`VITE_ENABLE_NEW_CHECKOUT=true` (a feature flag)' },
        { text: '`VITE_PAYMENT_SECRET_KEY=sk_live_…`', why: 'A secret key in the bundle is a leaked secret. Secret keys stay on the server; only publishable keys belong in the frontend.' },
      ],
      answer: [0, 2],
      explanation: 'Treat `VITE_` variables as public configuration: URLs, feature flags, publishable keys. Secrets stay on a server.',
    },
    {
      id: 'service-layers-q6',
      type: 'short',
      prompt: 'Why might you `inject()` a service in a composable instead of importing the service module directly?',
      answer: 'Injection decouples the composable from a concrete implementation: the app decides which service to provide. Tests (or demos) can provide a fake with the same methods, so the composable runs without a network and without global mocks. It also lets different apps or environments plug in different implementations.',
    },
  ],

  exercises: [
    {
      id: 'users-adapter',
      title: 'Write an endpoint module with an adapter',
      difficulty: 'intermediate',
      prompt: `
The fake backend in \`services/http.js\` answers \`GET /users\` with \`{ results: [...], count }\`, where each user looks like:

\`\`\`json
{ "id": 1, "first_name": "Grace", "last_name": "Hopper", "email_address": "grace@example.com", "is_active": true, "signup_ts": "2024-01-15T09:30:00Z" }
\`\`\`

In \`services/usersApi.js\`:

1. **\`toUser(dto)\`** returns exactly \`{ id, fullName, email, active, signedUpAt }\`:
   - \`fullName\` is first and last name joined by a space — if \`last_name\` is missing or \`null\`, just the first name (no trailing space);
   - \`active\` is a boolean; \`signedUpAt\` is a real \`Date\`;
   - no snake_case keys survive.
2. **\`createUsersApi(http)\`** returns \`{ list() }\`; \`list()\` calls \`http.get('/users')\` and returns \`results\` mapped through \`toUser\`.

\`App.vue\` already renders \`.user\` items with \`.name\`, \`.email\` and \`.status\`.
`,
      files: {
        'App.vue': usersApp,
        'services/http.js': usersFakeHttp,
        'services/usersApi.js': usersApiStarter,
      },
      hints: [
        'Start with `toUser`: return a brand-new object literal with the five app-side keys, reading from the snake_case ones.',
        'For the name: `[dto.first_name, dto.last_name].filter(Boolean).join(\' \')` drops a missing last name. For the date: `new Date(dto.signup_ts)`.',
        '`list()` is two lines: `const body = await http.get(\'/users\')` then `return body.results.map(toUser)`.',
      ],
      solution: {
        explanation: '`toUser` is the only code in the app that knows the server says `email_address` and `signup_ts`. Because `createUsersApi` receives `http` as a parameter, the tests can pass a fake client and check exactly which path was requested — no network, no global mocks.',
        files: {
          'App.vue': usersApp,
          'services/http.js': usersFakeHttp,
          'services/usersApi.js': usersApiSolution,
        },
      },
      tests: [
        {
          name: 'toUser maps every field into the app shape',
          code: `const { toUser } = requireModule('services/usersApi.js')
const u = toUser({ id: 7, first_name: 'Ada', last_name: 'Lovelace', email_address: 'ada@example.com', is_active: true, signup_ts: '2024-03-01T10:00:00Z' })
expect(u.id).toBe(7)
expect(u.fullName).toBe('Ada Lovelace')
expect(u.email).toBe('ada@example.com')
expect(u.active).toBe(true)
expect(u.signedUpAt instanceof Date).toBe(true)
expect(u.signedUpAt.toISOString()).toBe('2024-03-01T10:00:00.000Z')
expect(Object.keys(u).sort()).toEqual(['active', 'email', 'fullName', 'id', 'signedUpAt'])`,
        },
        {
          name: 'a missing last name gives just the first name',
          code: `const { toUser } = requireModule('services/usersApi.js')
const u = toUser({ id: 2, first_name: 'Linus', last_name: null, email_address: 'l@example.com', is_active: false, signup_ts: '2023-07-04T18:00:00Z' })
expect(u.fullName).toBe('Linus')
expect(u.active).toBe(false)`,
        },
        {
          name: 'list() calls GET /users and maps the results',
          code: `const { createUsersApi } = requireModule('services/usersApi.js')
const calls = []
const fakeHttp = {
  get: async (path) => {
    calls.push(path)
    return { results: [{ id: 9, first_name: 'Mae', last_name: 'Jemison', email_address: 'mae@example.com', is_active: true, signup_ts: '2022-02-02T00:00:00Z' }], count: 1 }
  },
}
const users = await createUsersApi(fakeHttp).list()
expect(calls).toEqual(['/users'])
expect(users.length).toBe(1)
expect(users[0].fullName).toBe('Mae Jemison')`,
        },
        {
          name: 'the app renders mapped users',
          code: `await wait(200)
expect(findAll('.user').length).toBe(2)
expect(text('.user .name')).toBe('Grace Hopper')
expect(text('.user .email')).toBe('grace@example.com')`,
        },
      ],
    },
    {
      id: 'use-users-state',
      title: 'A composable that owns loading and error state',
      difficulty: 'advanced',
      prompt: `
Finish \`features/users/useUsers.js\`. \`useUsers(api = inject(UsersApiKey))\` must return \`{ users, loading, error, load }\` where:

- \`users\` starts as \`[]\`, \`loading\` as \`false\`, \`error\` as \`null\`;
- \`load()\` returns a Promise; while it runs \`loading\` is \`true\`;
- every call to \`load()\` **clears** any previous \`error\` first;
- on success \`users\` holds what \`api.list()\` resolved with;
- on failure \`error\` becomes the user-facing message **\`Could not load users. Please try again.\`** (log the technical error with \`console.error\`), \`users\` stays as it was;
- \`loading\` is \`false\` again afterwards, whatever happened.

The tests call \`useUsers(fakeApi)\` directly with fakes; the app provides the real service through \`main.js\`.
`,
      files: useUsersFiles(useUsersStarter),
      hints: [
        'Set `loading.value = true` and `error.value = null` at the very start of `load()`.',
        'Wrap `users.value = await api.list()` in `try`, set the message in `catch`, and reset `loading` in `finally` so it runs on both paths.',
        'Inside `catch (e)`: `console.error(\'[useUsers] load failed:\', e)` then `error.value = \'Could not load users. Please try again.\'`.',
      ],
      solution: {
        explanation: 'The composable is the single owner of "what the UI should show about this request". `finally` guarantees `loading` goes back to `false`. The technical error goes to the console (or a monitoring tool), while the UI gets a calm, human sentence. Accepting `api` as a parameter with an injected default keeps it easy to test and easy to use.',
        files: useUsersFiles(useUsersSolution),
      },
      tests: [
        {
          name: 'starts empty and idle',
          code: `const { useUsers } = requireModule('features/users/useUsers.js')
const s = withSetup(() => useUsers({ list: async () => [] }))
expect(s.users.value).toEqual([])
expect(s.loading.value).toBe(false)
expect(s.error.value).toBeNull()`,
        },
        {
          name: 'loading is true while the request runs, then data arrives',
          code: `const { useUsers } = requireModule('features/users/useUsers.js')
let finish
const fakeApi = { list: () => new Promise((resolve) => { finish = resolve }) }
const s = withSetup(() => useUsers(fakeApi))
const p = s.load()
expect(s.loading.value).toBe(true)
finish([{ id: 1, fullName: 'Ada Lovelace' }])
await p
expect(s.loading.value).toBe(false)
expect(s.users.value.length).toBe(1)
expect(s.error.value).toBeNull()`,
        },
        {
          name: 'a failure sets the friendly message and stops loading',
          code: `const { useUsers } = requireModule('features/users/useUsers.js')
const s = withSetup(() => useUsers({ list: async () => { throw new Error('503 Service Unavailable') } }))
await s.load()
expect(s.error.value).toBe('Could not load users. Please try again.')
expect(s.loading.value).toBe(false)
expect(s.users.value).toEqual([])`,
        },
        {
          name: 'a later successful load clears the old error',
          code: `const { useUsers } = requireModule('features/users/useUsers.js')
let fail = true
const s = withSetup(() => useUsers({ list: async () => { if (fail) throw new Error('boom'); return [{ id: 1, fullName: 'Ada' }] } }))
await s.load()
expect(s.error.value).toBeTruthy()
fail = false
await s.load()
expect(s.error.value).toBeNull()
expect(s.users.value.length).toBe(1)`,
        },
        {
          name: 'the app loads users through the injected service',
          code: `await wait(250)
expect(findAll('.user').length).toBe(2)
expect(exists('.loading')).toBe(false)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'service-layers-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is an API service layer in a Vue app, and why not just call `fetch` inside components?',
      answer: 'It\'s a set of plain JavaScript modules between components and the network: an HTTP client (base URL, headers, error checks) and endpoint modules (one function per endpoint, with adapters mapping server data into the app\'s shape). Components and composables call those functions instead of `fetch`. This gives URLs, data mapping and HTTP rules one home each, avoids duplication, and makes the code testable with fakes.',
      explanation: 'Calling `fetch` everywhere scatters URLs, auth headers and field names across the UI; every backend change becomes a search-and-replace.',
      whyAsked: 'A baseline architecture question: does the candidate separate UI from data access?',
      mistakes: [
        'Saying "because it\'s best practice" without naming the concrete benefits.',
        'Describing a service that also stores UI state or shows toasts.',
        'Forgetting that `fetch` doesn\'t reject on HTTP errors.',
      ],
      followUps: ['Where would you put loading and error state?', 'How would you test a component that loads data?', 'Would you wrap Axios the same way?'],
      modelAnswer: 'A service layer is the code that talks to the backend so components don\'t have to. I usually have one HTTP client that knows the base URL, headers and turns non-2xx responses into errors, and an endpoint module per resource — `booksApi.list()` — that hides the URL and maps the server\'s JSON into our model. Composables or stores call those and own loading and error state; components just render. The benefit is that a URL change, a renamed field, or a new auth header is one edit instead of twenty, and tests can inject a fake service instead of mocking `fetch` globally.',
    },
    {
      id: 'service-layers-env-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'A project has `.env` with `VITE_API_URL=/api` and `.env.production` with `VITE_API_URL=https://api.example.com`. After `vite build` (default mode), what does `import.meta.env.VITE_API_URL` contain in the built JavaScript — and what happens if you edit `.env.production` on the server afterwards?',
      options: [
        '"https://api.example.com"; editing the file afterwards changes nothing until you rebuild',
        '"/api"; .env always wins',
        '"https://api.example.com"; editing the file afterwards takes effect on the next page load',
        'undefined; env files are only read by the dev server',
      ],
      correctOption: 0,
      answer: '`vite build` runs in `production` mode, so `.env.production` overrides `.env`, giving `"https://api.example.com"`. The value is inlined into the bundle at build time, so changing the file later has no effect until the next build.',
      explanation: 'Mode-specific files take priority over the generic `.env`. Env values are static replacements, not runtime lookups.',
      whyAsked: 'Env handling causes real deployment bugs; this checks whether you understand build-time vs runtime configuration.',
      mistakes: ['Thinking env files are read at runtime by the browser.', 'Not knowing `vite build` defaults to production mode.', 'Forgetting the `VITE_` prefix rule.'],
      followUps: ['How would you support changing the API URL without rebuilding?', 'What does `--mode staging` do?', 'Which file would you git-ignore?'],
      modelAnswer: 'The build runs in production mode, so `.env.production` overrides `.env` and the bundle contains the literal string `https://api.example.com`. Vite replaces `import.meta.env.VITE_API_URL` at build time, so editing the file on the server does nothing until you rebuild. If ops need to change the URL per deployment without a rebuild, I\'d load a small runtime `config.json` at startup instead.',
    },
    {
      id: 'service-layers-rename',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'The backend team announces that next sprint `GET /orders` will return `{ items: [...] }` instead of `{ data: [...] }`, and `created` becomes `created_at` (ISO string instead of a Unix timestamp). Thirty components show orders. How does your architecture handle it?',
      answer: 'Only the orders endpoint module and its adapter change: `list()` reads `body.items` instead of `body.data`, and `toOrder()` maps `created_at` with `new Date(iso)` instead of `new Date(seconds * 1000)`. Components already use the app model (`order.createdAt` as a Date), so none of them change. During the transition the adapter can accept both shapes, and a test with a fake HTTP client covers each.',
      explanation: 'This is the payoff of adapters at the edge: backend vocabulary changes are absorbed in one place.',
      whyAsked: 'Tests whether you design for change, and whether you can coordinate a backend migration safely.',
      mistakes: ['Planning to update all thirty components.', 'Not considering a transition period where both shapes exist.', 'Mapping in the HTTP client, which then knows about orders.'],
      followUps: ['How would you detect an unannounced shape change in production?', 'Would you version the API instead?'],
      modelAnswer: 'Components never see the server shape — they use our `Order` model — so this is a change to one endpoint module. `ordersApi.list()` reads `items` instead of `data`, and the `toOrder` adapter maps `created_at` with `new Date(iso)`. If both versions will be live for a while, the adapter can handle either shape. I\'d add a unit test with a fake HTTP client for both payloads, and possibly schema validation in the adapter so an unexpected change fails loudly instead of rendering blanks.',
    },
    {
      id: 'service-layers-inject-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'This composable logs `[Vue warn]: inject() can only be used inside setup() or functional components` and `api` is undefined when `refresh()` runs. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `export function useOrders() {
  const orders = ref([])

  async function refresh() {
    const api = inject(OrdersApiKey)
    orders.value = await api.list()
  }

  onMounted(refresh)
  return { orders, refresh }
}`,
      },
      answer: '`inject()` looks up the *current component instance*, which only exists synchronously during `setup()`. `refresh()` runs later (on mount, on click), when there is no current instance. Call `inject(OrdersApiKey)` at the top of `useOrders()`, store it in a variable, and use that variable inside `refresh()`.',
      explanation: 'Composables run during setup, but functions they return run later. Capture injected values at setup time.',
      whyAsked: 'A very common bug when people first use provide/inject with composables.',
      mistakes: ['Wrapping it in `nextTick` or `onMounted` (still not setup).', 'Switching to a global import without understanding the cause.', 'Not knowing about `app.runWithContext()` for non-component code (3.3+).'],
      followUps: ['How can code outside components (e.g. a router guard) use app-level injections?', 'How would you give `inject` a default value?'],
      modelAnswer: '`inject()` needs an active component instance, and that only exists while `setup()` is running. `refresh` is called later — on mount or on a click — so there\'s no instance and the lookup fails. The fix is to call `inject` once at the top of the composable, during setup, and close over the result in `refresh`. For code that runs outside components entirely, Vue 3.3+ has `app.runWithContext()`.',
    },
    {
      id: 'service-layers-http-client',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement `createHttpClient({ baseUrl, fetchImpl })` in `http.js`. It returns `{ get(path, { query } = {}) }`, which builds `baseUrl + path` plus `?` and an encoded query string when `query` is given, calls `fetchImpl(url, { method: \'GET\', headers: { Accept: \'application/json\' } })`, throws the provided `HttpError(status, url)` when the response is not ok, and otherwise returns the parsed JSON.',
      starter: {
        files: {
          'App.vue': httpCodingApp,
          'http.js': httpCodingStarter,
        },
      },
      tests: [
        {
          name: 'builds the URL with an encoded query and sends GET',
          code: `const { createHttpClient } = requireModule('http.js')
const calls = []
const fetchImpl = async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => ({ hello: 'world' }) } }
const http = createHttpClient({ baseUrl: 'https://api.test', fetchImpl })
const data = await http.get('/books', { query: { limit: 2, q: 'vue router' } })
expect(data).toEqual({ hello: 'world' })
expect(calls[0].url).toBe('https://api.test/books?limit=2&q=vue+router')
expect(calls[0].init.method).toBe('GET')
expect(calls[0].init.headers.Accept).toBe('application/json')`,
        },
        {
          name: 'no query means no "?" in the URL',
          code: `const { createHttpClient } = requireModule('http.js')
const calls = []
const http = createHttpClient({ baseUrl: 'https://api.test', fetchImpl: async (url) => { calls.push(url); return { ok: true, status: 200, json: async () => [] } } })
await http.get('/books')
expect(calls[0]).toBe('https://api.test/books')`,
        },
        {
          name: 'non-ok responses throw HttpError with the status',
          code: `const { createHttpClient, HttpError } = requireModule('http.js')
const http = createHttpClient({ baseUrl: '', fetchImpl: async () => ({ ok: false, status: 404, json: async () => ({ error: 'nope' }) }) })
let caught = null
try { await http.get('/missing') } catch (e) { caught = e }
expect(caught instanceof HttpError).toBe(true)
expect(caught.status).toBe(404)
expect(caught.url).toBe('/missing')`,
        },
      ],
      hints: [
        '`new URLSearchParams({ limit: 2, q: \'vue router\' }).toString()` gives `limit=2&q=vue+router`.',
        'Check `res.ok` before `res.json()`; throw `new HttpError(res.status, url)` when it is false.',
      ],
      answer: 'Build the URL from base, path and `URLSearchParams`, call the injected `fetchImpl` with the method and headers, throw `HttpError` on `!res.ok`, otherwise return `res.json()`.',
      solution: { files: { 'App.vue': httpCodingApp, 'http.js': httpCodingSolution } },
      explanation: 'Because `fetchImpl` is a parameter, the client is fully testable without a network — the tests above are exactly how you would unit-test it in a real project.',
      whyAsked: 'Shows you know fetch\'s error semantics, URL encoding and how to design for testability.',
      mistakes: ['Concatenating query strings by hand without encoding.', 'Calling `res.json()` before checking `res.ok`.', 'Calling the global `fetch` so tests must mock globals.'],
      followUps: ['How would you add a timeout?', 'Where would you attach an auth token?', 'How would you handle a 204 No Content response?'],
      modelAnswer: 'I build the URL from the base URL, the path and `URLSearchParams` so values are encoded. I call the injected `fetchImpl` with the method and an `Accept` header. Since `fetch` resolves even on 404 or 500, I check `res.ok` and throw an `HttpError` carrying the status and URL; otherwise I return the parsed JSON. Injecting `fetchImpl` means the client can be unit-tested with plain fake objects.',
    },
    {
      id: 'service-layers-store-vs-composable',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 5,
      question: 'For server data such as "the current user\'s orders", when would you keep loading/error/data in a composable, and when in a Pinia store?',
      answer: 'A composable creates fresh state per call: good when one component (or one page) needs the data and it can be refetched when the component mounts. A store holds one shared instance: good when several distinct components read or mutate the same data, when you want devtools inspection, caching between route changes, or optimistic updates coordinated in one place. In both cases the service layer is the same — only the owner of the state changes. Avoid holding the same server data in both.',
      explanation: 'The question is about ownership and lifetime of state, not about which API is "better".',
      whyAsked: 'Distinguishes candidates who default to "put everything in the store" from those who reason about state lifetime.',
      mistakes: ['Putting all server data in a global store by default.', 'Duplicating the same list in a store and a component.', 'Forgetting that module-level state in a composable is also global (and not SSR-safe).'],
      followUps: ['How would you avoid refetching when navigating back to a page?', 'What about a dedicated server-state library?', 'How does SSR change the answer?'],
      modelAnswer: 'I decide by lifetime and sharing. If only one page needs the orders and it\'s fine to fetch them on mount, a composable is simplest: state lives and dies with the component. If the header badge, the orders page and the checkout all read and change the same data, or I want it cached across navigation and visible in devtools, I put it in a Pinia store. Either way both call the same `ordersApi` service, and I make sure the data has exactly one owner. For heavy caching needs I\'d also consider a dedicated server-state library.',
    },
    {
      id: 'service-layers-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 8,
      question: 'Design the data layer for a medium-sized Vue app that talks to two backends (a REST API and a separate search service), needs an auth token on most requests, must handle "session expired" globally, and must be testable without a network.',
      answer: 'One `createHttpClient` factory, instantiated twice (API and search base URLs from the config module), with an injected `getToken` and an `onUnauthorized` callback. Endpoint modules per resource built on the right client, each with adapters. Instances are created in `main.js` and provided with Symbol keys; composables/stores inject them and own UI state. The 401 handling lives in the client (callback set up in `main.js` that clears the session store and redirects via the router), so no lower layer imports the store or router. Tests provide fakes through `global.provide` or pass fake clients to factories.',
      explanation: 'Good answers keep dependency direction clean: lower layers receive callbacks instead of importing higher layers.',
      code: {
        lang: 'js',
        code: `// main.js — composition root
const session = useSessionStore(pinia)
const onUnauthorized = () => { session.clear(); router.push({ name: 'login' }) }

const apiHttp = createHttpClient({ baseUrl: config.apiBaseUrl, getToken: () => session.token, onUnauthorized })
const searchHttp = createHttpClient({ baseUrl: config.searchBaseUrl, getToken: () => session.token, onUnauthorized })

app.provide(OrdersApiKey, createOrdersApi(apiHttp))
app.provide(SearchApiKey, createSearchApi(searchHttp))`,
      },
      whyAsked: 'Senior candidates are expected to design boundaries that survive several backends, cross-cutting concerns and testing needs.',
      mistakes: [
        'Having the HTTP client import the Pinia store or router directly (upward dependency, cycles).',
        'One giant `api.js` with every endpoint for both services.',
        'Handling 401 in every component.',
        'No answer for testing.',
      ],
      followUps: ['Where would retries and request deduplication go?', 'How would you refresh an expired token transparently?', 'How would you share this layer with a Nuxt app?'],
      modelAnswer: 'I\'d have a single HTTP client factory and create two instances in `main.js`, one per backend, with base URLs from a validated config module. Cross-cutting concerns are options: `getToken` to read the session token, `onUnauthorized` to handle 401s. Those callbacks are defined in `main.js`, where the store and router exist, so the client never imports upward. On top sit endpoint modules per resource with adapters, provided with Symbol keys. Composables or stores inject them and own loading and error state. For tests I pass fake clients to the endpoint factories, or provide fake services when mounting components.',
    },
  ],

  takeaways: [
    'A service layer = one HTTP client (base URL, headers, `res.ok` → errors) + endpoint modules per resource.',
    'Adapters map server DTOs into your app model at the edge, so backend changes stay in one file.',
    'Composables (per component) or stores (shared) own loading, error and data; services return data or throw.',
    'Provide services once in `main.js` and `inject()` them during setup — tests and demos can swap in fakes.',
    'Read `import.meta.env` in one validated config module; only `VITE_` variables reach the client and they are public, build-time constants.',
    'Dependencies point down: components → composables/stores → services → HTTP client → config.',
  ],
}
