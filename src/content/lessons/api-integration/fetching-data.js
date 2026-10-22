// Lesson: Fetching data — fetch, Axios & REST.
// The sandbox has no network, so every runnable example talks to fakeFetch.js:
// a pretend server with the same shape as the real fetch() (url, options) → Promise<Response>.

const usersServer = `// fakeFetch.js — a pretend network + server so this sandbox works offline.
// Same shape as the real thing: fakeFetch(url, options) → Promise<Response>.
// Simplified: an in-memory "database", no real HTTP, resets on every run.

const users = [
  { id: 1, name: 'Grace Hopper', email: 'grace@example.com', city: 'New York' },
  { id: 2, name: 'Alan Turing', email: 'alan@example.com', city: 'Manchester' },
  { id: 3, name: 'Ada Lovelace', email: 'ada@example.com', city: 'London' },
  { id: 4, name: 'Katherine Johnson', email: 'katherine@example.com', city: 'Hampton' },
]
let nextId = 5

function reply(status, data) {
  const body = data === undefined ? null : JSON.stringify(data)
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } })
}

export async function fakeFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers)
  const { pathname, search, searchParams } = new URL(url)
  console.log('→', method, pathname + search)
  await new Promise((resolve) => setTimeout(resolve, 250)) // pretend network delay

  // '/api/users/3' → ['', 'api', 'users', '3']
  const [, , resource, rawId] = pathname.split('/')
  if (resource !== 'users') return reply(404, { message: 'No such endpoint' })
  const id = rawId ? Number(rawId) : null

  if (method === 'GET' && id === null) {
    const list = [...users]
    if (searchParams.get('sort') === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
    return reply(200, list)
  }
  if (method === 'GET') {
    const user = users.find((u) => u.id === id)
    return user ? reply(200, user) : reply(404, { message: 'User ' + id + ' not found' })
  }

  // Everything below changes data, so the server wants to know who you are.
  if (headers.get('Authorization') !== 'Bearer demo-token') {
    return reply(401, { message: 'Missing or invalid token' })
  }
  if (method === 'POST' && id === null) {
    if (!(headers.get('Content-Type') || '').includes('application/json')) {
      return reply(415, { message: 'Send JSON with Content-Type: application/json' })
    }
    let body
    try {
      body = JSON.parse(options.body)
    } catch {
      return reply(400, { message: 'The request body is not valid JSON' })
    }
    if (!body.name || !body.name.trim()) return reply(400, { message: 'Name is required' })
    const user = { id: nextId++, name: body.name.trim(), email: '', city: 'Remote' }
    users.push(user)
    return reply(201, user)
  }
  if (method === 'DELETE' && id !== null) {
    const index = users.findIndex((u) => u.id === id)
    if (index === -1) return reply(404, { message: 'User ' + id + ' not found' })
    users.splice(index, 1)
    return reply(204)
  }
  return reply(405, { message: method + ' is not allowed here' })
}`

const playgroundApi = `// api.js — the only file that knows URLs, headers and JSON.
// Components call these functions; they never call fetch themselves.
import { fakeFetch } from './fakeFetch.js' // a real app would use the global fetch

const BASE_URL = 'https://api.example.com'
const TOKEN = 'demo-token' // a real app gets this from its login flow

async function request(path, options = {}) {
  const res = await fakeFetch(BASE_URL + path, options)
  return res.json()
}

export function getUsers() {
  return request('/api/users')
}

export function getUser(id) {
  return request(\`/api/users/\${id}\`)
}

export function createUser(user) {
  return request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  })
}`

const playgroundApp = `<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, getUser, createUser } from './api.js'

const users = ref([])
const selected = ref(null)
const error = ref('')
const newName = ref('')

async function loadUsers() {
  error.value = ''
  try {
    users.value = await getUsers()
  } catch (e) {
    error.value = e.message
  }
}

async function showUser(id) {
  error.value = ''
  selected.value = null
  try {
    selected.value = await getUser(id)
  } catch (e) {
    error.value = e.message
  }
}

async function addUser() {
  error.value = ''
  try {
    const user = await createUser({ name: newName.value })
    users.value.push(user)
    newName.value = ''
  } catch (e) {
    error.value = e.message
  }
}

onMounted(loadUsers)
</script>

<template>
  <h2>Team directory</h2>
  <ul class="users">
    <li v-for="user in users" :key="user.id" class="user">
      <button class="show" @click="showUser(user.id)">{{ user.name }}</button>
    </li>
  </ul>
  <button class="load-missing" @click="showUser(99)">Load user #99</button>

  <article v-if="selected" class="details">
    <h3>{{ selected.name }}</h3>
    <p>{{ selected.email }} · {{ selected.city }}</p>
  </article>

  <form @submit.prevent="addUser">
    <input v-model="newName" class="new-name" placeholder="New teammate" />
    <button class="add">Add</button>
  </form>
  <p v-if="error" class="error">{{ error }}</p>
</template>`

const finishedApi = `// api.js — every URL, header and JSON detail lives here.
import { fakeFetch } from './fakeFetch.js' // in a real app: the global fetch

const BASE_URL = 'https://api.example.com'
const TOKEN = 'demo-token' // in a real app this comes from your login flow

async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json', Authorization: \`Bearer \${TOKEN}\` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fakeFetch(BASE_URL + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 204) return null // "No Content": nothing to parse
  const data = await res.json()
  if (!res.ok) {
    const error = new Error(data.message || \`HTTP \${res.status}\`)
    error.status = res.status
    throw error
  }
  return data
}

export const getUsers = () => request('/api/users?sort=name')
export const getUser = (id) => request(\`/api/users/\${id}\`)
export const createUser = (user) => request('/api/users', { method: 'POST', body: user })
export const deleteUser = (id) => request(\`/api/users/\${id}\`, { method: 'DELETE' })`

const todosServer = `// fakeFetch.js — a pretend todo API (simplified: in memory, resets every run).
const todos = [
  { id: 1, title: 'Read the fetch docs', done: true },
  { id: 2, title: 'Build the todo list', done: false },
]
let nextId = 3

function reply(status, data) {
  const body = data === undefined ? null : JSON.stringify(data)
  return new Response(body, { status, headers: { 'Content-Type': 'application/json' } })
}

export async function fakeFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers)
  const { pathname } = new URL(url)
  console.log('→', method, pathname)
  await new Promise((resolve) => setTimeout(resolve, 200))

  const [, , resource, rawId] = pathname.split('/')
  if (resource !== 'todos') return reply(404, { message: 'No such endpoint' })
  const id = rawId ? Number(rawId) : null

  if (method === 'GET' && id === null) return reply(200, todos)
  if (method === 'POST' && id === null) {
    if (!(headers.get('Content-Type') || '').includes('application/json')) {
      return reply(415, { message: 'Expected Content-Type: application/json' })
    }
    let body
    try {
      body = JSON.parse(options.body)
    } catch {
      return reply(400, { message: 'The request body is not valid JSON' })
    }
    if (!body.title || !body.title.trim()) return reply(400, { message: 'Title is required' })
    const todo = { id: nextId++, title: body.title.trim(), done: false }
    todos.push(todo)
    return reply(201, todo)
  }
  if (method === 'DELETE' && id !== null) {
    const index = todos.findIndex((t) => t.id === id)
    if (index === -1) return reply(404, { message: 'Todo ' + id + ' not found' })
    todos.splice(index, 1)
    return reply(204)
  }
  return reply(405, { message: method + ' is not allowed here' })
}`

const todoApp = `<script setup>
import { ref, onMounted } from 'vue'
import { getTodos, createTodo } from './api.js'

const todos = ref([])
const title = ref('')
const error = ref('')

onMounted(async () => {
  todos.value = await getTodos()
})

async function add() {
  error.value = ''
  try {
    const todo = await createTodo(title.value)
    todos.value.push(todo)
    title.value = ''
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <form @submit.prevent="add">
    <input v-model="title" class="new-todo" placeholder="What needs doing?" />
    <button class="add">Add</button>
  </form>
  <ul>
    <li v-for="todo in todos" :key="todo.id" class="todo">{{ todo.title }}</li>
  </ul>
  <p v-if="error" class="error">{{ error }}</p>
</template>`

const deleteApp = `<script setup>
import { ref, onMounted } from 'vue'
import { getTodos, deleteTodo } from './api.js'

const todos = ref([])
const error = ref('')

onMounted(async () => {
  todos.value = await getTodos()
})

async function remove(id) {
  error.value = ''
  try {
    await deleteTodo(id)
    todos.value = todos.value.filter((t) => t.id !== id)
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id" class="todo">
      {{ todo.title }}
      <button class="remove" @click="remove(todo.id)">Delete</button>
    </li>
  </ul>
  <p v-if="error" class="error">{{ error }}</p>
</template>`

const buildUrlApp = `<script setup>
import { ref, computed } from 'vue'
import { buildUrl } from './api.js'

const q = ref('ada lovelace')
const page = ref(2)
const url = computed(() => buildUrl('/api/users', { q: q.value, page: page.value }))
</script>

<template>
  <input v-model="q" class="q" />
  <input v-model.number="page" class="page" type="number" />
  <p class="url">{{ url }}</p>
</template>`

export default {
  id: 'fetching-data',
  title: 'Fetching data: fetch, Axios & REST',
  summary: 'Ask a server for data with fetch() (or Axios), send JSON and headers the REST way, and put the answer into reactive state.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['http-apis-json', 'async-js', 'lifecycle-hooks'],
  related: ['async-ui-states', 'composable-recipes', 'service-layers', 'pinia-async-patterns', 'auth-security', 'api-production'],
  tags: ['fetch', 'axios', 'rest', 'http', 'json', 'headers', 'authorization', 'api service', 'onMounted', 'status codes'],
  apis: [
    { name: 'fetch(url, options)', summary: 'Browser API that sends an HTTP request and resolves to a Response once the headers arrive.' },
    { name: 'Response.ok / status', summary: '`ok` is true for status 200–299; fetch does not reject on 4xx/5xx, so you check it yourself.' },
    { name: 'Response.json()', summary: 'Reads the body stream to the end and parses it as JSON (returns a promise).' },
    { name: 'Headers', summary: 'Case-insensitive map of HTTP headers, e.g. Content-Type, Accept, Authorization.' },
    { name: 'axios.create()', summary: 'Axios (a third-party library) instance with a baseURL, defaults and interceptors.' },
  ],
  docs: [
    { label: 'Vue Guide — Composables: async state example', url: 'https://vuejs.org/guide/reusability/composables.html#async-state-example' },
    { label: 'Vue Guide — Lifecycle Hooks', url: 'https://vuejs.org/guide/essentials/lifecycle.html' },
    { label: 'MDN — Using the Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
    { label: 'MDN — HTTP request methods', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods' },
    { label: 'Axios documentation', url: 'https://axios-http.com/docs/intro' },
  ],

  intro: `
Most real apps don't own their data. The list of products, your messages, the weather — it all lives on a **server**, a computer somewhere else. Your Vue app has to *ask* for it, wait, and then show it.

The browser's built-in tool for asking is \`fetch()\`. You give it an address (a *URL*), it sends an **HTTP request** over the network, and later it hands you back an **HTTP response**: a status number like \`200\` or \`404\`, some headers, and a body — usually **JSON**, a text format for data.

Vue doesn't do networking itself. Your job is to glue the two together: call \`fetch\`, turn the answer into data, and drop that data into a \`ref\`. [Reactivity](lesson:ref) takes it from there.
`,

  why: `
A page that only shows data baked into its code can't show *your* inbox, *today's* prices or the comment someone posted a second ago. Data that changes or belongs to a user has to come from a server.

That conversation has rules. Servers speak **HTTP**, and most web APIs follow a convention called **REST**: data is organised into *resources* with URLs (\`/api/users\`, \`/api/users/3\`) and you say what you want with a *verb* (\`GET\` to read, \`POST\` to create, \`DELETE\` to remove…). Get the rules wrong and you hit classic bugs:

- the server says "404 Not Found" but your code happily shows the error message as if it were a user;
- you send an object and the server receives the text \`"[object Object]"\`;
- you forget the token and every save fails with "401 Unauthorized".

This lesson teaches the rules once, and shows the habit that keeps them in one place: an **API service module** your components call, so no component ever touches URLs or headers.
`,

  eli15: `
Think of the server as a restaurant kitchen and \`fetch\` as a waiter.

You (the Vue component) tell the waiter what you want: "**GET** me the list of users." The waiter walks to the kitchen — that's the network, and it takes time. While you wait, you can keep talking to your friends; the page doesn't freeze.

The waiter comes back with a tray. On the tray is a **status slip** ("200: here you go" or "404: we don't have that") and the food, wrapped up (the body). You have to *check the slip* and *unwrap the food* (\`res.json()\`) before you can eat it.

Then you put the food on the table — \`users.value = data\` — and everyone at the table sees it. That's Vue updating the screen.
`,

  analogy: {
    title: 'Ordering by mail',
    body: `
Imagine ordering from a catalogue by post. You fill in an **order form** (the request): which department it goes to (the URL), what you want done (the verb: *send me*, *add*, *cancel*), notes for the clerk (headers like "my membership number is…") and sometimes a filled-in form inside the envelope (the JSON body).

A while later a parcel arrives (the response) with a **delivery note** stapled on top: "200 — delivered", "404 — item not found", "401 — we don't know who you are". A careful customer reads the delivery note *before* unpacking the parcel. A careless one unpacks a "sorry, out of stock" letter and tries to wear it.
`,
    mapping: [
      ['the department address', 'the URL, e.g. `/api/users/3`'],
      ['"send me" / "add" / "cancel"', 'HTTP verbs: `GET`, `POST`, `DELETE`'],
      ['notes for the clerk', 'headers: `Content-Type`, `Authorization`'],
      ['the form inside the envelope', 'the request body, `JSON.stringify(data)`'],
      ['the delivery note', '`res.status` and `res.ok`'],
      ['unpacking the parcel', '`await res.json()`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The life of one request',
    caption: 'Step through a GET request from a click to the re-render. Notice the two waits: one for the response headers, one for the body.',
    alt: 'A loop of seven boxes. Component calls the api.js service, which calls fetch, which sends GET /api/users to the Server. The Server returns a Response with status, headers and a body stream. The service checks res.ok and calls res.json(). The parsed data is assigned to users.value, and Vue re-renders the component.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'comp', label: 'Component', note: 'onMounted → loadUsers()', tone: 'acid', x: 100, y: 70 },
        { id: 'service', label: 'api.js service', note: 'getUsers()', x: 300, y: 70 },
        { id: 'fetch', label: 'fetch()', note: 'GET /api/users', tone: 'cobalt', x: 500, y: 70 },
        { id: 'server', label: 'Server', note: 'reads the database', tone: 'kraft', x: 670, y: 160 },
        { id: 'response', label: 'Response', note: 'status · headers · body stream', tone: 'cobalt', x: 500, y: 250 },
        { id: 'parse', label: 'check res.ok → res.json()', note: 'throw on 4xx / 5xx', x: 300, y: 250 },
        { id: 'state', label: 'users.value = data', note: 'reactive state', tone: 'acid', x: 100, y: 250 },
      ],
      edges: [
        { from: 'comp', to: 'service', label: 'call' },
        { from: 'service', to: 'fetch', label: 'URL + options' },
        { from: 'fetch', to: 'server', label: 'HTTP request' },
        { from: 'server', to: 'response', label: '200 + JSON' },
        { from: 'response', to: 'parse', label: 'await' },
        { from: 'parse', to: 'state', label: 'data' },
        { from: 'state', to: 'comp', label: 'Vue re-renders', dashed: true },
      ],
      steps: [
        { focus: ['comp'], text: 'The component mounts and calls `loadUsers()`. It doesn\'t know any URLs — it just asks the service.' },
        { focus: ['service', 'fetch'], edges: ['comp->service', 'service->fetch'], text: 'The service builds the full URL, the method and the headers, and calls `fetch()`. `fetch` returns a **promise** immediately; the browser keeps running other code.' },
        { focus: ['server'], edges: ['fetch->server'], text: 'The request travels over the network. The server looks up the data and decides on a status code.' },
        { focus: ['response'], edges: ['server->response'], text: 'The first `await` finishes as soon as the **status and headers** arrive. The body may still be streaming in.' },
        { focus: ['parse'], edges: ['response->parse'], text: 'The service checks `res.ok` (status 200–299). If it\'s an error it throws; otherwise `await res.json()` reads the rest of the body and parses it.' },
        { focus: ['state', 'comp'], edges: ['parse->state', 'state->comp'], text: 'The component assigns the data to a ref. That write is a normal reactive change, so Vue re-renders the list.' },
      ],
    },
  },

  syntax: [
    `
#### Reading data with GET

\`fetch()\` takes a URL and returns a promise for a **Response**. Reading the body is a *second* async step.
`,
    {
      code: `const res = await fetch('https://api.example.com/api/users') // 1. wait for status + headers

if (!res.ok) {                        // 2. fetch does NOT throw on 404 or 500
  throw new Error(\`HTTP \${res.status}\`)
}

const users = await res.json()        // 3. wait for the body and parse it as JSON`,
      lang: 'js',
      title: 'GET with fetch',
    },
    `
#### Sending data: method, headers, body

To create or change something you pass an **options object**: the HTTP \`method\`, \`headers\` (extra labels on the request) and a \`body\`. The body must be a string (or another body type like \`FormData\`), so objects go through \`JSON.stringify\` — and you tell the server it's JSON with a \`Content-Type\` header.
`,
    {
      code: `const res = await fetch('https://api.example.com/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',        // "the body is JSON"
    Authorization: \`Bearer \${token}\`,          // "this is who I am"
  },
  body: JSON.stringify({ name: 'Ada Lovelace' }), // object → JSON text
})
const created = await res.json() // usually the new record, with its id`,
      lang: 'js',
      title: 'POST JSON with fetch',
    },
    `
#### The REST vocabulary

- **GET** \`/api/users\` — read a list; \`GET /api/users/3\` — read one. Never changes data ("safe").
- **POST** \`/api/users\` — create a new user. Not idempotent: sending it twice may create two users.
- **PUT** \`/api/users/3\` — replace user 3 entirely. Idempotent: sending it twice leaves the same result.
- **PATCH** \`/api/users/3\` — change some fields of user 3.
- **DELETE** \`/api/users/3\` — remove it. Often answers **204 No Content** (no body at all).

*Idempotent* means "doing it twice has the same effect as doing it once". It matters for retries — see [Retries, caching, dedupe & polling](lesson:resilient-requests).

Status codes come in families: **2xx** success (\`200 OK\`, \`201 Created\`, \`204 No Content\`), **3xx** redirects, **4xx** the request was wrong (\`400\` bad data, \`401\` not signed in, \`403\` not allowed, \`404\` not found, \`422\` validation failed), **5xx** the server failed.

#### Where the call goes in a component

Load data when the component appears — in \`onMounted\` (or directly in \`setup\`) — and store the result in refs:
`,
    {
      code: `<script setup>
import { ref, onMounted } from 'vue'
import { getUsers } from './api.js'

const users = ref([])        // same shape as the data you expect: an array
const error = ref(null)

onMounted(async () => {
  try {
    users.value = await getUsers()
  } catch (e) {
    error.value = e.message
  }
})
</script>`,
      lang: 'vue',
      title: 'loading on mount',
    },
    {
      callout: 'warn',
      title: 'Top-level await makes an async component',
      text: 'Writing `const users = await getUsers()` directly at the top level of `<script setup>` turns the component into an *async component* that only renders inside `<Suspense>`, which is still marked experimental. For ordinary components, call async functions from `onMounted` or a `watch` and store results in refs.',
    },
    `
#### The same thing with Axios

**Axios** is a popular third-party library (not part of Vue or the browser) that wraps HTTP requests. It parses JSON for you, **rejects on non-2xx statuses by default**, and has *interceptors* — hooks that run on every request or response. The sandbox can't import it, so here it is as static code:
`,
    {
      code: `import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10_000, // ms; the default is 0 = no timeout
})

api.interceptors.request.use((config) => {
  config.headers.Authorization = \`Bearer \${getToken()}\`
  return config
})

const { data: users } = await api.get('/api/users', { params: { sort: 'name' } })
const { data: created } = await api.post('/api/users', { name: 'Ada' }) // JSON + header for you

try {
  await api.get('/api/users/99')
} catch (err) {
  console.log(err.response?.status) // 404 — Axios threw because the status was not 2xx
}`,
      lang: 'js',
      title: 'Axios (static example)',
      static: true,
    },
  ],

  walkthrough: {
    title: 'api.js — a finished request helper',
    lang: 'js',
    code: finishedApi,
    intro: 'This is where the playground\'s `api.js` is heading. One small `request()` function handles every rule; the exported functions are one-liners.',
    steps: [
      { lines: [1, 2], text: 'One module owns networking. Here it imports `fakeFetch` because the sandbox is offline; in a real app you would just use the global `fetch`.' },
      { lines: [4, 5], text: 'Configuration lives in one place. In production the base URL comes from an environment variable — see [Env variables, CORS & production errors](lesson:api-production). The token comes from your login flow, never from source code.' },
      { lines: [7, 9], text: '`request()` builds the headers every call needs. `Accept` says "please answer in JSON"; `Authorization: Bearer …` identifies the user. `Content-Type` is only added when there is a body.' },
      { lines: [11, 15], text: 'The actual call. Objects are turned into JSON text with `JSON.stringify` — `fetch` won\'t do it for you, and passing an object would send the string `"[object Object]"`.' },
      { lines: [17, 17], text: '`204 No Content` means success *with no body*. Calling `res.json()` on it would throw "Unexpected end of JSON input", so we return `null` early.' },
      { lines: [18, 23], text: 'Parse the body, then check `res.ok`. On 4xx/5xx we throw an `Error` carrying the server\'s message and the status code, so callers can `catch` it and decide what to show.' },
      { lines: [27, 30], text: 'The public API of the module: named, readable functions. Components say `getUser(3)`, not `fetch(\'https://…/api/users/3\', {…})`.' },
    ],
  },

  playground: {
    title: 'Team directory',
    objective: 'Talk to a pretend REST server: add a query parameter, handle an error status and send an auth header.',
    files: { 'App.vue': playgroundApp, 'api.js': playgroundApi, 'fakeFetch.js': usersServer },
    expected: 'After a short delay a list of four people appears. Clicking a name loads that user\'s details with a second request. Open the **Console** tab: every request is logged by the fake server (`→ GET /api/users`). Two things are broken on purpose — **Load user #99** shows an empty card, and **Add** silently adds a blank row.',
    experiments: [
      {
        id: 'sort',
        task: 'Ask the **server** to sort the list by name by adding the query parameter `?sort=name` to the URL in `getUsers()`. **Ada Lovelace** should come first.',
        hint: 'Query parameters go after a `?` in the path: `\'/api/users?sort=name\'`. The fake server already understands it — look for `searchParams.get(\'sort\')` in fakeFetch.js.',
        tests: [{ name: 'Ada Lovelace is listed first', code: `await wait(400)\nexpect(text('.user')).toBe('Ada Lovelace')` }],
        explain: 'Query parameters are how a GET request describes *which* data it wants (sorting, filtering, paging) without a body. The server did the sorting, so the browser received an already-ordered list.',
      },
      {
        id: 'check-ok',
        task: 'Click **Load user #99**. The server answers **404** with `{ "message": "User 99 not found" }`, but `request()` returns that error body as if it were a user. Make `request()` **throw** when `res.ok` is false, using the server\'s `message`, so the red `.error` paragraph shows it and no details card appears.',
        hint: 'In `request()`: `const data = await res.json()`, then `if (!res.ok) throw new Error(data.message)`, then `return data`.',
        tests: [
          {
            name: 'a 404 shows the server message instead of an empty card',
            code: `await wait(400)
await click('.load-missing')
await wait(400)
expect(exists('.details')).toBe(false)
expect(exists('.error')).toBe(true)
expect(text('.error')).toContain('not found')`,
          },
        ],
        explain: '`fetch` only rejects when the request could not be made at all (network down, blocked by CORS, aborted). A 404 or 500 is still a *successful conversation* with the server, so the promise resolves. Checking `res.ok` turns HTTP errors into JavaScript errors your `try/catch` can handle.',
      },
      {
        id: 'auth',
        task: 'Type a name such as **Margaret Hamilton** and press **Add**. The server rejects it with **401** because the request has no token. Send the header `Authorization: Bearer demo-token` (the `TOKEN` constant) with the POST so the new teammate appears in the list.',
        hint: 'Add `Authorization: \'Bearer \' + TOKEN` next to `\'Content-Type\'` in the headers of `createUser()`. Better still, add it inside `request()` so every call gets it.',
        tests: [
          {
            name: 'adding a teammate succeeds and shows them in the list',
            code: `await wait(400)
await type('.new-name', 'Margaret Hamilton')
await submit()
await wait(400)
const names = findAll('.user').map((li) => li.textContent.trim())
expect(names).toContain('Margaret Hamilton')`,
          },
        ],
        explain: 'Headers are labels on the request. `Authorization` tells the server who is asking, and the server decides whether that user may create data. Putting it in `request()` means no future call can forget it. (The frontend only *sends* the token — the server must still check permissions on every request.)',
      },
      {
        id: 'watch-the-wire',
        task: 'Open the **Console** tab and click a few names. Then change the delay in `fakeFetch.js` from `250` to `2000` and run again. What does the user see during those two seconds?',
        hint: 'Look at the empty list before the data arrives, and at the details card while it loads.',
        explain: 'Every request takes time, and right now the UI shows nothing at all while it waits — it looks broken. Telling the user what is happening (loading, error, empty) is the whole next lesson: [Loading, error & empty states](lesson:async-ui-states).',
      },
    ],
  },

  animation: {
    type: 'event-loop',
    props: { preset: 'async-await' },
    title: 'Why the page doesn\'t freeze while it waits',
    caption: 'Every `await` pauses only the async function it\'s in. The rest of the page — clicks, rendering, other code — keeps running until the promise settles.',
    alt: 'An event loop stepper showing an async function hitting await: the function is suspended, the call stack empties so other tasks run, and when the promise resolves the rest of the function is queued as a microtask and resumes.',
  },

  internals: {
    beginner: `
\`fetch\` hands the job to the browser's networking code and immediately gives you a **promise** — an IOU for a future value. Your \`async\` function pauses at \`await\`, but the browser does not: it keeps handling clicks and drawing the page. When the server answers, the promise is fulfilled and your function continues on the next line. Assigning the data to a ref is then just a normal reactive change.
`,
    technical: [
      `
**Two phases.** The promise from \`fetch()\` fulfils as soon as the response **status line and headers** arrive. At that point \`res.status\`, \`res.ok\` and \`res.headers\` are available, but the body is a *stream* that may still be downloading. \`res.json()\` (or \`.text()\`, \`.blob()\`) reads the stream to the end and parses it — which is why it's a second \`await\`. A body can be read **once**; a second \`res.json()\` throws because \`res.bodyUsed\` is true (use \`res.clone()\` if you really need two reads).

**What rejects.** \`fetch\` rejects with a \`TypeError\` when no HTTP response could be obtained: offline, DNS failure, connection refused, or a cross-origin response blocked by CORS. It rejects with an \`AbortError\` when you cancel via an \`AbortController\` ([next lessons](lesson:cancellation-race-conditions)). Every real HTTP response — including 404 and 500 — *fulfils* the promise.

**Default headers.** If \`body\` is a string, \`fetch\` sends \`Content-Type: text/plain;charset=UTF-8\` unless you set one. That's why JSON APIs need the explicit \`application/json\` header. For \`FormData\` bodies, *don't* set \`Content-Type\` yourself — the browser must add the multipart boundary.
`,
      {
        code: `const res = await fetch(url)   // fulfils when headers arrive
res.status        // 200
res.ok            // true for 200–299
res.headers.get('content-type') // 'application/json; charset=utf-8'
res.bodyUsed      // false
const data = await res.json()   // drains + parses the body stream
res.bodyUsed      // true — reading again would throw`,
        lang: 'js',
        title: 'what you have, and when',
      },
      `
**Back in Vue.** After the \`await\`, \`users.value = data\` triggers the component's render effect. Vue batches the update to the next microtask, exactly like a click handler would. Vue doesn't know or care that the data came from the network — which is why the [loading and error states](lesson:async-ui-states) are *your* responsibility.
`,
    ],
    production: `
- **One HTTP client module.** Wrap \`fetch\` (or create one Axios instance) in a single \`request()\` function: base URL, auth header, JSON handling, error shape. Feature services (\`usersApi\`, \`ordersApi\`) build on it. See [Service layers](lesson:service-layers).
- **Normalise errors.** Throw one error type with \`status\`, a user-safe \`message\` and the raw details, so every screen can handle errors the same way ([production errors](lesson:api-production)).
- **Don't trust the body's format.** A proxy or gateway in front of your API can answer a 502 with an HTML page; \`res.json()\` would then throw a confusing \`SyntaxError\`. Check \`res.headers.get('content-type')\` or fall back to \`res.text()\` for error bodies.
- **Validate what you receive.** The server's JSON is outside your control. Teams commonly validate responses at the boundary (TypeScript types alone don't check anything at runtime).
- **Time out.** \`fetch\` has no built-in timeout; a hung connection can leave a spinner forever. Use an \`AbortController\` with a timer (or \`AbortSignal.timeout()\` in modern browsers).
- **Never put secrets in the frontend.** Anything in your JavaScript bundle can be read by users; tokens belong to the logged-in user, and API keys for third-party services belong on your server.
`,
  },

  mistakes: [
    {
      title: 'Assuming fetch throws on HTTP errors',
      wrong: { code: `try {\n  const res = await fetch('/api/users/99')\n  user.value = await res.json() // { message: 'Not found' } becomes the "user"\n} catch (e) {\n  error.value = 'Could not load' // never runs for a 404\n}`, lang: 'js' },
      right: { code: `const res = await fetch('/api/users/99')\nconst data = await res.json()\nif (!res.ok) throw new Error(data.message || \`HTTP \${res.status}\`)\nuser.value = data`, lang: 'js' },
      explanation: '`fetch` resolves for every HTTP response. Only network-level failures reject. Always check `res.ok` (or `res.status`) before treating the body as success data. Axios is different: it rejects on non-2xx by default.',
    },
    {
      title: 'Sending an object as the body',
      wrong: { code: `fetch('/api/users', {\n  method: 'POST',\n  body: { name: 'Ada' }, // sent as the text "[object Object]"\n})`, lang: 'js' },
      right: { code: `fetch('/api/users', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ name: 'Ada' }),\n})`, lang: 'js' },
      explanation: '`fetch` converts a plain object to a string with `String(obj)`, which is `"[object Object]"`, and labels it `text/plain`. Stringify it yourself and set the `Content-Type` so the server parses it as JSON.',
    },
    {
      title: 'Calling res.json() on a 204 response',
      wrong: { code: `const res = await fetch('/api/users/3', { method: 'DELETE' })\nreturn res.json() // SyntaxError: Unexpected end of JSON input`, lang: 'js' },
      right: { code: `const res = await fetch('/api/users/3', { method: 'DELETE' })\nif (res.status === 204) return null\nreturn res.json()`, lang: 'js' },
      explanation: '`204 No Content` is a success with an empty body. Parsing nothing as JSON fails. Handle it before parsing.',
    },
    {
      title: 'Fetching inside a component template or computed',
      wrong: { code: `const user = computed(async () => {\n  return (await fetch('/api/me')).json() // computed now holds a Promise\n})`, lang: 'js' },
      right: { code: `const user = ref(null)\nonMounted(async () => {\n  user.value = await getMe()\n})`, lang: 'js' },
      explanation: '`computed` must be synchronous and free of side effects; an async getter just returns a promise, and it could re-run whenever dependencies change. Fetch from lifecycle hooks, watchers or event handlers and store results in refs.',
    },
    {
      title: 'Scattering fetch calls and URLs through components',
      wrong: { code: `// UserList.vue\nfetch('https://api.example.com/api/users', { headers: { Authorization: 'Bearer ' + t } })\n// UserCard.vue\nfetch('https://api.example.com/api/users/' + id) // forgot the token`, lang: 'js' },
      right: { code: `// api.js\nexport const getUsers = () => request('/api/users')\nexport const getUser = (id) => request(\`/api/users/\${id}\`)`, lang: 'js' },
      explanation: 'When URLs, headers and error handling are copy-pasted, each copy drifts. A single service module makes the rules impossible to forget and gives tests one thing to mock.',
    },
  ],

  debugging: [
    {
      symptom: 'The list stays empty and the console shows no error.',
      cause: 'The promise was never awaited (`users.value = getUsers()` stores a Promise), or the load function is never called.',
      fix: 'Write `users.value = await getUsers()` inside an `async` function and make sure that function actually runs — pass it to the hook itself: `onMounted(loadUsers)`.',
    },
    {
      symptom: 'An error message like "User not found" is shown as a name, or an empty card appears.',
      cause: 'The code treats every response as success data; HTTP errors don\'t make `fetch` reject.',
      fix: 'Check `res.ok` and throw for non-2xx statuses before using the body.',
    },
    {
      symptom: 'The server replies 400 or 415 to a POST you are sure is correct.',
      cause: 'The body is an object instead of a JSON string, or the `Content-Type: application/json` header is missing.',
      fix: 'Open the browser DevTools **Network** tab, click the request and inspect *Headers* and *Payload*. Use `JSON.stringify` and set the header.',
    },
    {
      symptom: '`SyntaxError: Unexpected token < in JSON` (or "Unexpected end of JSON input").',
      cause: 'The response isn\'t JSON: an HTML error page (wrong URL, proxy error, SPA fallback page) or an empty 204 body.',
      fix: 'Inspect the response in the Network tab. Fix the URL, handle 204 separately, and read error bodies with `res.text()` when their content type isn\'t JSON.',
    },
    {
      symptom: 'Every write fails with 401 Unauthorized, but reads work.',
      cause: 'The `Authorization` header isn\'t sent (or is mis-formatted, e.g. missing the `Bearer ` prefix).',
      fix: 'Add the header in your central `request()` helper and check it in the Network tab. If the token expired, see the session handling in [production errors](lesson:api-production).',
    },
  ],

  bestPractices: [
    'Keep all networking in one API module; components call named functions like `getUser(id)`.',
    'Always check `res.ok` with fetch; with Axios remember it throws on non-2xx and the response is in `err.response`.',
    'Send JSON with `JSON.stringify` and `Content-Type: application/json`; handle `204 No Content` without parsing.',
    'Initialise refs with the shape you expect (`ref([])` for lists, `ref(null)` for "not loaded yet").',
    'Use the right verb: GET never changes data; PUT/DELETE are idempotent, POST usually is not.',
    'Put query options (sort, filter, page) in query parameters, built with `URLSearchParams` so values are encoded.',
    'Treat the frontend as untrusted: the server must authorise every request no matter what the UI hides.',
  ],

  useCases: [
    'Loading a list of products, posts or users when a page opens.',
    'Submitting a sign-up or checkout form with a POST.',
    'Saving a profile edit with PATCH and showing the server\'s updated record.',
    'Deleting an item and removing it from the UI after a 204.',
    'Attaching the signed-in user\'s token to every request from one place.',
  ],

  whenToUse: {
    use: [
      '`fetch` when you want zero dependencies and are happy writing a small wrapper (most apps write one anyway).',
      'Axios when your team wants interceptors, automatic JSON, request timeouts and non-2xx rejection out of the box.',
      'An API service module in every app that talks to a server — even a tiny one.',
    ],
    avoid: [
      'Calling `fetch` directly from many components — centralise it.',
      'Top-level `await` in `<script setup>` unless you deliberately use `<Suspense>` (experimental).',
      'Fetching inside `computed` — it must be synchronous and side-effect free.',
      'Hard-coding secret API keys to call third-party APIs from the browser — proxy through your own server.',
    ],
  },

  comparison: {
    title: 'fetch vs Axios',
    headers: ['', '`fetch()`', 'Axios'],
    rows: [
      ['Where it comes from', 'built into browsers (and Node 18+)', 'third-party npm package'],
      ['Rejects on 404 / 500?', 'no — check `res.ok`', 'yes by default (`validateStatus`)'],
      ['JSON request body', '`JSON.stringify` + `Content-Type` yourself', 'pass an object; it serialises and sets the header'],
      ['JSON response', '`await res.json()`', 'already parsed in `response.data`'],
      ['Query params', 'build with `URLSearchParams`', '`params: { … }` option'],
      ['Timeout', 'none built in — use `AbortController` / `AbortSignal.timeout()`', '`timeout` option (default 0 = none)'],
      ['Cancellation', '`AbortController` signal', '`AbortController` signal (v0.22+)'],
      ['Interceptors', 'write your own wrapper', 'built in (request & response)'],
    ],
    note: 'Both are fine choices. What matters more is wrapping whichever you pick in one module, so the choice can change later.',
  },

  quiz: [
    {
      id: 'fetching-data-q1',
      type: 'mcq',
      prompt: 'The server answers `GET /api/users/99` with status **404** and a JSON body. What does `await fetch(\'/api/users/99\')` do?',
      options: [
        { text: 'It throws a `TypeError`, so the `catch` block runs.', why: '`fetch` only rejects when no response could be obtained (network failure, CORS block, abort). A 404 is a real response.' },
        { text: 'It resolves to a Response with `ok === false` and `status === 404`.' },
        { text: 'It resolves to `undefined`.', why: 'It always resolves to a Response object when the server answers.' },
        { text: 'It retries automatically until it gets a 200.', why: '`fetch` never retries on its own.' },
      ],
      answer: 1,
      explanation: 'HTTP error statuses still fulfil the promise. Check `res.ok` (true only for 200–299) and throw yourself if you want `catch` to handle it.',
    },
    {
      id: 'fetching-data-q2',
      type: 'output',
      prompt: 'In what order are the three lines logged?',
      code: {
        lang: 'js',
        code: `async function load() {
  console.log('A: sending')
  const res = await fetch('/api/users')
  console.log('C: got', res.status)
}

load()
console.log('B: still running')`,
      },
      options: ['A, C, B', 'A, B, C', 'B, A, C', 'C, A, B'],
      answer: 1,
      explanation: '`load()` runs synchronously until its first `await`, logging A. The `await` pauses only `load`, so the next line of the outer code logs B. When the response arrives, `load` resumes and logs C.',
    },
    {
      id: 'fetching-data-q3',
      type: 'bug',
      prompt: 'The server keeps answering **415 Unsupported Media Type**. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `export async function createUser(user) {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: JSON.stringify(user),
  })
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
  return res.json()
}`,
      },
      answerLine: 4,
      explanation: 'The body is valid JSON text, but without `Content-Type: application/json` fetch labels a string body as `text/plain`, and a strict JSON API refuses it. `Accept` describes the *response* you want, not the body you send.',
    },
    {
      id: 'fetching-data-q4',
      type: 'fill',
      prompt: 'Complete the helper so HTTP errors throw and successful bodies are parsed.',
      code: {
        lang: 'js',
        code: `async function getJSON(url) {
  const res = await fetch(url)
  if (!res.___) {
    throw new Error('HTTP ' + res.status)
  }
  return res.___()
}`,
      },
      answer: [['ok'], ['json']],
      explanation: '`res.ok` is true for statuses 200–299. `res.json()` reads the body and parses it, returning a promise (which the async function returns for you).',
    },
    {
      id: 'fetching-data-q5',
      type: 'mcq',
      prompt: 'A user edits only their **city** in a profile form. Which request best matches REST conventions?',
      options: [
        { text: '`GET /api/users/3?city=Pune`', why: 'GET must never change data; caches and prefetchers assume it is safe to repeat.' },
        { text: '`POST /api/users` with `{ city: "Pune" }`', why: 'POST to the collection usually means "create a new user".' },
        { text: '`PATCH /api/users/3` with `{ city: "Pune" }`' },
        { text: '`DELETE /api/users/3` then `POST` a new user', why: 'That throws away the id and history of the record — and is two requests that can fail halfway.' },
      ],
      answer: 2,
      explanation: 'PATCH updates part of an existing resource. PUT would also work if you send the *whole* user, since PUT means "replace".',
    },
    {
      id: 'fetching-data-q6',
      type: 'mcq',
      prompt: 'Select **all** statements that are true.',
      options: [
        { text: 'Axios rejects the promise for a 500 response by default.' },
        { text: '`res.json()` can be called twice on the same Response.', why: 'The body is a stream that can be read once; the second read throws. Use `res.clone()` if you need two reads.' },
        { text: '`fetch` rejects when the network is down.' },
        { text: '`fetch` has a default timeout of 30 seconds.', why: '`fetch` has no built-in timeout. You add one with an `AbortController` or `AbortSignal.timeout()`.' },
      ],
      answer: [0, 2],
      explanation: 'Axios treats non-2xx as errors (configurable with `validateStatus`). `fetch` rejects only when no response arrives — network down, CORS block or abort.',
    },
    {
      id: 'fetching-data-q7',
      type: 'short',
      prompt: 'Why is it a good idea to put every `fetch` call behind an API service module instead of calling `fetch` in components?',
      answer: 'It keeps URLs, headers, auth tokens, JSON handling and error checks in one place, so no component can forget a rule and changes (new base URL, switching to Axios, a new auth header) happen once. Components stay focused on UI, and tests can mock one module instead of the network.',
    },
  ],

  exercises: [
    {
      id: 'post-json',
      title: 'Create a todo with a JSON POST',
      difficulty: 'intermediate',
      prompt: `
The todo app loads its list fine, but adding a todo fails with an error from the server.

Fix \`createTodo(title)\` in **api.js** so it sends a proper JSON request:

- method \`POST\` to \`/api/todos\` (already there);
- the body must be **JSON text** containing \`{ title }\`;
- the request must say it's JSON with the header \`Content-Type: application/json\`.

The app (already written) pushes the todo **the server returns** into the list and clears the input. The tests type into \`.new-todo\`, submit the form and expect a new \`li.todo\` and no \`.error\`.
`,
      files: {
        'App.vue': todoApp,
        'api.js': `// api.js
import { fakeFetch } from './fakeFetch.js'

const BASE_URL = 'https://api.example.com'

async function request(path, options = {}) {
  const res = await fakeFetch(BASE_URL + path, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || \`HTTP \${res.status}\`)
  return data
}

export function getTodos() {
  return request('/api/todos')
}

// TODO: send the new todo as JSON
export function createTodo(title) {
  return request('/api/todos', {
    method: 'POST',
    body: { title },
  })
}`,
        'fakeFetch.js': todosServer,
      },
      hints: [
        'Run it and read the red error: the server tells you exactly what it expected.',
        '`fetch` needs a string body. Turn the object into JSON text with `JSON.stringify({ title })`.',
        'Add `headers: { \'Content-Type\': \'application/json\' }` next to `method` and `body`.',
      ],
      solution: {
        explanation: 'A JSON request needs two things: a body that is JSON *text* and a `Content-Type` header that says so. Because the app uses the todo returned by the server (with its new `id`), the list now matches what the server stored.',
        files: {
          'App.vue': todoApp,
          'api.js': `// api.js
import { fakeFetch } from './fakeFetch.js'

const BASE_URL = 'https://api.example.com'

async function request(path, options = {}) {
  const res = await fakeFetch(BASE_URL + path, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || \`HTTP \${res.status}\`)
  return data
}

export function getTodos() {
  return request('/api/todos')
}

export function createTodo(title) {
  return request('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
}`,
          'fakeFetch.js': todosServer,
        },
      },
      tests: [
        {
          name: 'submitting adds the new todo to the list without an error',
          code: `await wait(300)
await type('.new-todo', 'Buy milk')
await submit()
await wait(400)
expect(exists('.error')).toBe(false)
expect(findAll('.todo').map((li) => li.textContent.trim())).toContain('Buy milk')`,
        },
        {
          name: 'the todo was really stored on the server',
          code: `await wait(300)
await type('.new-todo', 'Walk the dog')
await submit()
await wait(400)
const fresh = await requireModule('api.js').getTodos()
expect(fresh.map((t) => t.title)).toContain('Walk the dog')`,
        },
        {
          name: 'the input is cleared after a successful save',
          code: `await wait(300)
await type('.new-todo', 'Water plants')
await submit()
await wait(400)
expect(find('.new-todo').value).toBe('')`,
        },
      ],
    },
    {
      id: 'delete-204',
      title: 'Handle 204 No Content on delete',
      difficulty: 'intermediate',
      prompt: `
Clicking **Delete** removes the todo on the server, but the app shows an error ("Unexpected end of JSON input") and the row stays on screen.

The server answers a successful \`DELETE\` with **204 No Content** — success with an empty body. Fix \`request()\` in **api.js** so that:

- a \`204\` response returns \`null\` without trying to parse JSON;
- other responses behave as before (parse JSON, throw the server's \`message\` when \`res.ok\` is false).

Tests click the first \`.remove\` button and expect one fewer \`li.todo\` and no \`.error\`. They also check that deleting a missing todo still rejects with the server's "not found" message.
`,
      files: {
        'App.vue': deleteApp,
        'api.js': `// api.js
import { fakeFetch } from './fakeFetch.js'

const BASE_URL = 'https://api.example.com'

async function request(path, options = {}) {
  const res = await fakeFetch(BASE_URL + path, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || \`HTTP \${res.status}\`)
  return data
}

export function getTodos() {
  return request('/api/todos')
}

export function deleteTodo(id) {
  return request(\`/api/todos/\${id}\`, { method: 'DELETE' })
}`,
        'fakeFetch.js': todosServer,
      },
      hints: [
        'Which line throws? `res.json()` on an empty body can\'t produce a value.',
        'Check `res.status` *before* calling `res.json()`.',
        'Add `if (res.status === 204) return null` right after the `fakeFetch` call.',
      ],
      solution: {
        explanation: '204 is a success status (`res.ok` is true) that by definition has no body, so there is nothing to parse. Returning early keeps every other path unchanged — including error responses, which still have JSON bodies with a `message`.',
        files: {
          'App.vue': deleteApp,
          'api.js': `// api.js
import { fakeFetch } from './fakeFetch.js'

const BASE_URL = 'https://api.example.com'

async function request(path, options = {}) {
  const res = await fakeFetch(BASE_URL + path, options)
  if (res.status === 204) return null // success, nothing to parse
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || \`HTTP \${res.status}\`)
  return data
}

export function getTodos() {
  return request('/api/todos')
}

export function deleteTodo(id) {
  return request(\`/api/todos/\${id}\`, { method: 'DELETE' })
}`,
          'fakeFetch.js': todosServer,
        },
      },
      tests: [
        {
          name: 'deleting removes the row and shows no error',
          code: `await wait(300)
const before = findAll('.todo').length
expect(before).toBe(2)
await click('.remove')
await wait(400)
expect(exists('.error')).toBe(false)
expect(findAll('.todo').length).toBe(before - 1)`,
        },
        {
          name: 'deleteTodo() resolves to null for 204',
          code: `const result = await requireModule('api.js').deleteTodo(1)
expect(result).toBeNull()`,
        },
        {
          name: 'deleting a missing todo still rejects with the server message',
          code: `let caught = null
try {
  await requireModule('api.js').deleteTodo(999)
} catch (e) {
  caught = e
}
expect(caught).toBeTruthy()
expect(caught.message).toContain('not found')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'fetching-data-fetch-404',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'The server answers this request with **500** and the JSON body `{ "message": "Database down" }`. What ends up in `users.value`?',
      code: {
        lang: 'js',
        code: `try {
  const res = await fetch('/api/users')
  users.value = await res.json()
} catch (e) {
  users.value = []
  error.value = 'Could not load users'
}`,
      },
      options: ['`[]`, and the error message is shown', '`{ message: "Database down" }`', '`undefined`', 'The code throws an unhandled rejection'],
      correctOption: 1,
      answer: '`users.value` becomes `{ message: "Database down" }`. `fetch` resolved because the server did answer; nothing threw, so the `catch` never ran and the error body was treated as data.',
      explanation: '`fetch` rejects only for network-level failures. HTTP error statuses must be checked with `res.ok` / `res.status`.',
      whyAsked: 'It\'s the single most common fetch bug in real code and separates people who have debugged API calls from people who have only read about them.',
      mistakes: ['Saying the catch runs because "500 is an error".', 'Not knowing what `res.ok` means (200–299).', 'Assuming Axios and fetch behave the same.'],
      followUps: ['How would you fix it?', 'What *does* make fetch reject?', 'What does Axios do here?'],
      modelAnswer: 'The `users` ref ends up holding the error body, `{ message: "Database down" }`. `fetch` only rejects when it can\'t get a response at all — offline, DNS failure, CORS block or an abort. A 500 is a real response, so the promise resolves and `res.json()` happily parses the error JSON. The fix is to check `res.ok` and throw for non-2xx statuses, ideally in one shared `request()` helper. Axios would have rejected here by default, which is one reason people like it.',
    },
    {
      id: 'fetching-data-fetch-vs-axios',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Would you use `fetch` or Axios in a new Vue project? What are the real differences?',
      answer: '`fetch` is built into the platform: no dependency, but you write a small wrapper for JSON bodies, `res.ok` checks, timeouts and auth headers. Axios is a library that gives you those out of the box: automatic JSON, rejection on non-2xx, a `timeout` option, `params`, and request/response interceptors. Either is fine if it\'s wrapped in one API module.',
      explanation: 'The interesting part isn\'t the library — it\'s that both need a single, central wrapper so the rest of the app doesn\'t care which one you chose.',
      whyAsked: 'Shows whether you understand the trade-off (dependency vs. convenience) rather than having a tribal preference.',
      mistakes: ['Claiming fetch can\'t cancel requests (it can, with AbortController).', 'Claiming Axios is required for Vue (Vue has no HTTP client opinion).', 'Ignoring the "wrap it in one module" point.'],
      followUps: ['How would you add a timeout to fetch?', 'What would an Axios response interceptor be good for?', 'How do you cancel a request in each?'],
      modelAnswer: 'Vue doesn\'t prescribe an HTTP client, so it\'s a team choice. `fetch` is built in and has no bundle cost, but it doesn\'t reject on HTTP errors, doesn\'t serialise JSON for you and has no timeout option — so I\'d write a small `request()` wrapper. Axios gives those features plus interceptors, at the cost of a dependency. Both support `AbortController` for cancellation. Whichever I pick, I hide it behind one API module so components only call functions like `getUser(id)` and the choice can change later.',
    },
    {
      id: 'fetching-data-put-patch',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Explain the difference between POST, PUT and PATCH. What does "idempotent" mean and why should a frontend developer care?',
      answer: 'POST to a collection creates a new resource (not idempotent: sending it twice can create two). PUT replaces a resource at a known URL with the full representation you send (idempotent). PATCH applies a partial update. Idempotent means repeating the request has the same effect as sending it once, which decides whether it\'s safe to retry automatically or after a double-click.',
      explanation: 'GET, PUT and DELETE are defined as idempotent by HTTP; POST is not, and PATCH is not guaranteed to be.',
      whyAsked: 'REST vocabulary is daily work, and idempotency matters for retries, double-submits and offline queues.',
      mistakes: ['Saying PUT and PATCH are interchangeable.', 'Saying DELETE is not idempotent because the second call returns 404 (the *state* is the same; the response can differ).', 'Not connecting idempotency to retries.'],
      followUps: ['How would you make a POST safe to retry? (idempotency keys)', 'Which methods are "safe"?', 'What status code fits a successful DELETE?'],
      modelAnswer: 'POST usually creates something new under a collection, so sending it twice can create duplicates — it\'s not idempotent. PUT replaces the resource at a specific URL with exactly what I send, so repeating it ends in the same state — idempotent. PATCH changes just some fields; it may or may not be idempotent depending on the operation. Idempotency matters on the frontend because it tells me what I can retry safely after a timeout: a PUT, yes; a POST, only if the server supports something like an idempotency key. It\'s also why I disable submit buttons while a POST is in flight.',
    },
    {
      id: 'fetching-data-where-to-fetch',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'In a growing Vue app, where should code that calls the API live: in components, composables, a service module or a Pinia store?',
      answer: 'Layer it. An HTTP client module wraps fetch/Axios (base URL, headers, errors). Feature service modules expose functions like `getUsers()`. Composables (e.g. `useUsers()`) add reactive state — loading, error, data — for one component tree. A Pinia store is used when the data must be shared across distant parts of the app or cached globally. Components call composables or stores, never `fetch` directly.',
      explanation: 'Each layer has one job: transport, endpoints, reactive state, shared state, UI.',
      whyAsked: 'Architecture questions reveal whether you\'ve felt the pain of copy-pasted fetch calls and inconsistent error handling.',
      mistakes: ['Putting everything in components.', 'Putting everything in Pinia, even data used by one screen.', 'Mixing UI concerns (toasts, router redirects) deep inside the HTTP client without a plan.'],
      followUps: ['Where would you handle a 401?', 'How would you test a component that loads data?', 'When would you add a caching library like TanStack Query?'],
      modelAnswer: 'I separate transport from state from UI. At the bottom is one HTTP client that knows the base URL, auth header and error format. On top of it, feature services export plain async functions like `getUsers(params)` — no Vue in there, so they\'re trivial to test or reuse. A composable such as `useUsers()` turns those calls into refs for loading, error and data. If several distant screens need the same data or a cache, that moves into a Pinia store. Components just render and call those functions, which makes them easy to test by mocking the service.',
    },
    {
      id: 'fetching-data-415-debug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate says "the server is broken: my POST arrives empty". Their code is below. What do you check and how do you fix it?',
      code: {
        lang: 'js',
        code: `await fetch('/api/orders', {
  method: 'POST',
  body: { productId: 7, quantity: 2 },
})`,
      },
      answer: 'The body is a plain object, so fetch converts it to the string "[object Object]" and labels it text/plain. The server can\'t parse it. Fix: `body: JSON.stringify({...})` and `headers: { \'Content-Type\': \'application/json\' }`. Confirm in the DevTools Network tab (Headers + Payload).',
      explanation: 'fetch doesn\'t serialise objects for you (Axios does).',
      whyAsked: 'Tests practical debugging: do you reach for the Network tab and know fetch\'s body rules?',
      mistakes: ['Blaming the server without inspecting the request.', 'Adding only the header or only `JSON.stringify` — you need both.', 'Setting `Content-Type` manually when sending `FormData` (that breaks the multipart boundary).'],
      followUps: ['How would this differ with Axios?', 'How do you send a file upload?', 'What status code would a well-behaved server return here?'],
      modelAnswer: 'First I\'d open the Network tab and look at the request payload — it will literally say "[object Object]". `fetch` only accepts certain body types, and a plain object gets stringified with `String()`, labelled as text. The fix is `JSON.stringify` on the body plus a `Content-Type: application/json` header. I\'d also move that into our shared request helper so nobody hits it again. A good server would answer 400 or 415 here, which our helper should surface as an error.',
    },
    {
      id: 'fetching-data-build-url',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `buildUrl(path, params)` in **api.js**. It appends query parameters to `path`, **skipping** values that are `undefined`, `null` or an empty string, and encoding values correctly (spaces, `&`, etc.). With no remaining params it returns `path` unchanged.',
      starter: {
        files: {
          'App.vue': buildUrlApp,
          'api.js': `// api.js
// buildUrl('/api/users', { q: 'ada lovelace', page: 2 })
//   → '/api/users?q=ada+lovelace&page=2'
export function buildUrl(path, params = {}) {
  return path + '?' + Object.entries(params).map(([k, v]) => k + '=' + v).join('&')
}`,
        },
      },
      tests: [
        { name: 'encodes values and joins with &', code: `const { buildUrl } = requireModule('api.js')\nexpect(buildUrl('/api/users', { q: 'ada lovelace', page: 2 })).toBe('/api/users?q=ada+lovelace&page=2')` },
        { name: 'skips empty, null and undefined values', code: `const { buildUrl } = requireModule('api.js')\nexpect(buildUrl('/api/users', { q: '', role: null, page: undefined, sort: 'name' })).toBe('/api/users?sort=name')` },
        { name: 'returns the bare path when nothing is left', code: `const { buildUrl } = requireModule('api.js')\nexpect(buildUrl('/api/users', { q: '' })).toBe('/api/users')\nexpect(buildUrl('/api/users')).toBe('/api/users')` },
        { name: 'escapes special characters like &', code: `const { buildUrl } = requireModule('api.js')\nexpect(buildUrl('/api/teams', { q: 'R&D' })).toBe('/api/teams?q=R%26D')` },
      ],
      hints: ['`URLSearchParams` builds and encodes query strings for you.', 'Loop over `Object.entries(params)` and only `append` the keys whose value is not `undefined`, `null` or `\'\'`.', 'Call `.toString()` on the params; if it is empty, return the path alone.'],
      answer: 'Filter out empty values, feed the rest into `URLSearchParams`, and only add the `?` when the resulting string is non-empty.',
      solution: {
        files: {
          'App.vue': buildUrlApp,
          'api.js': `// api.js
export function buildUrl(path, params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.append(key, String(value))
  }
  const query = search.toString()
  return query ? \`\${path}?\${query}\` : path
}`,
        },
      },
      explanation: '`URLSearchParams` uses the `application/x-www-form-urlencoded` rules: spaces become `+`, and reserved characters like `&` and `=` are percent-encoded so they can\'t break the query string.',
      whyAsked: 'Search and filter UIs build URLs constantly; hand-concatenation causes encoding bugs and even parameter injection (`q=a&admin=true`).',
      mistakes: ['Concatenating strings without encoding.', 'Sending `q=` or `role=null` for empty filters.', 'Forgetting the "no params" case and returning a trailing `?`.'],
      followUps: ['How would you support array values like `tags=a&tags=b`?', 'Would you keep `0` or `false`? Why?', 'How does Axios\'s `params` option relate to this?'],
      modelAnswer: 'I\'d use `URLSearchParams` rather than string concatenation, because it handles encoding: spaces, ampersands and equals signs in user input would otherwise corrupt the query or inject extra parameters. I loop over the entries, skip `undefined`, `null` and empty strings so empty filters don\'t pollute the URL, append the rest, and only add the question mark if the result isn\'t empty. Note that `0` and `false` are real values and are kept.',
    },
    {
      id: 'fetching-data-token-header',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'Your app must send the signed-in user\'s access token with every API call. A colleague proposes adding `?token=...` to every URL because "it\'s easier". What do you recommend instead, and why?',
      answer: 'Send it in the `Authorization: Bearer <token>` header, added in one place (the shared request helper or an Axios request interceptor). URLs end up in server and proxy logs, browser history and potentially `Referer` headers, so tokens in query strings leak. Centralising the header also means no call can forget it. And the server must still authorise every request — the header proves identity, it doesn\'t grant permissions by itself.',
      explanation: 'Headers are the standard place for credentials; query strings are visible in far more places.',
      whyAsked: 'Probes security awareness and whether you centralise cross-cutting concerns.',
      mistakes: ['Agreeing because it works.', 'Copy-pasting the header into every call instead of centralising it.', 'Thinking hiding UI elements is enough authorisation.'],
      followUps: ['Where would you store the token? (see the auth lesson)', 'What happens when it expires mid-session?', 'How would cookies change this design?'],
      modelAnswer: 'I\'d put the token in the `Authorization` header with the Bearer scheme and add it in exactly one place — our request wrapper or an Axios interceptor. Query strings are a bad place for secrets: full URLs get written to server and proxy logs, saved in browser history and can leak to other sites via the Referer header. Centralising also makes token refresh and logout handling simple later. And I\'d remind the team that the server still has to check permissions on every request; the frontend only proves who the user is.',
    },
  ],

  takeaways: [
    '`fetch(url, options)` resolves to a Response when headers arrive; `await res.json()` reads and parses the body.',
    '`fetch` does not reject on 404/500 — check `res.ok`. Axios rejects on non-2xx by default.',
    'Send JSON with `JSON.stringify(body)` and `Content-Type: application/json`; handle `204 No Content` without parsing.',
    'REST: GET reads, POST creates, PUT replaces, PATCH updates part, DELETE removes; query params describe *which* data.',
    'Fetch from `onMounted`, watchers or handlers and store results in refs — not in `computed` or top-level `await` (which needs experimental `<Suspense>`).',
    'Put every request behind one API module so URLs, headers, tokens and errors are handled once.',
  ],
}
