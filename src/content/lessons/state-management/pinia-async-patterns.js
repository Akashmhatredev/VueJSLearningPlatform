// Lesson: Async actions, loading states & optimistic updates

const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')`

const tasksApi = `// A fake server (simplified): in-memory data, a delay, optional failures.
const db = [
  { id: 1, title: 'Write lesson outline', done: true },
  { id: 2, title: 'Record demo video', done: false },
  { id: 3, title: 'Review pull request', done: false },
]

// Flip these from the toolbar to simulate a flaky network
export const network = { failLoads: false, failSaves: false }

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const copy = (value) => JSON.parse(JSON.stringify(value))

export async function fetchTasks() {
  await delay(300)
  if (network.failLoads) throw new Error('Could not load tasks (simulated network error)')
  return copy(db)
}

export async function updateTask(id, changes) {
  await delay(300)
  if (network.failSaves) throw new Error('Could not save your change (simulated)')
  const task = db.find((t) => t.id === id)
  if (!task) throw new Error('Task not found')
  Object.assign(task, changes)
  return copy(task)
}`

const tasksStore = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api.js'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])
  // One status instead of many booleans: 'idle' | 'loading' | 'success' | 'error'
  const status = ref('idle')
  const loadError = ref(null)
  const saveError = ref(null)

  const remaining = computed(() => tasks.value.filter((t) => !t.done).length)
  const isLoading = computed(() => status.value === 'loading')

  async function fetchTasks() {
    status.value = 'loading'
    loadError.value = null
    try {
      tasks.value = await api.fetchTasks()
      status.value = 'success'
    } catch (error) {
      loadError.value = error.message
      status.value = 'error'
    }
  }

  // Pessimistic: wait for the server, THEN update the UI
  async function toggleTask(id) {
    const task = tasks.value.find((t) => t.id === id)
    if (!task) return
    saveError.value = null
    try {
      const saved = await api.updateTask(id, { done: !task.done })
      task.done = saved.done
    } catch (error) {
      saveError.value = error.message
    }
  }

  return { tasks, status, loadError, saveError, remaining, isLoading, fetchTasks, toggleTask }
})`

const appVue = `<script setup>
import { onMounted } from 'vue'
import Toolbar from './Toolbar.vue'
import TaskList from './TaskList.vue'
import TaskStats from './TaskStats.vue'
import { useTaskStore } from './stores/tasks.js'

const store = useTaskStore()
onMounted(() => store.fetchTasks())
</script>

<template>
  <h2>Team tasks</h2>
  <Toolbar />
  <TaskList />
  <TaskStats />
</template>

<style>
.task.done span { text-decoration: line-through; color: #888; }
.load-error, .save-error { color: #b00020; }
.toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
</style>`

const toolbarVue = `<script setup>
import { useTaskStore } from './stores/tasks.js'
import { network } from './api.js'

const store = useTaskStore()
</script>

<template>
  <div class="toolbar">
    <button class="reload" @click="store.fetchTasks()">Reload</button>
    <label><input type="checkbox" class="fail-loads" @change="network.failLoads = $event.target.checked" /> Fail loads</label>
    <label><input type="checkbox" class="fail-saves" @change="network.failSaves = $event.target.checked" /> Fail saves</label>
  </div>
</template>`

const taskListVue = `<script setup>
import { useTaskStore } from './stores/tasks.js'
const store = useTaskStore()
</script>

<template>
  <p v-if="store.isLoading" class="loading">Loading tasks…</p>
  <div v-else-if="store.status === 'error'" class="load-error" role="alert">
    {{ store.loadError }}
  </div>
  <ul v-else>
    <li v-for="task in store.tasks" :key="task.id" class="task" :class="{ done: task.done }">
      <label>
        <input type="checkbox" class="toggle" :checked="task.done" @change="store.toggleTask(task.id)" />
        <span>{{ task.title }}</span>
      </label>
    </li>
  </ul>
  <p v-if="store.saveError" class="save-error" role="alert">{{ store.saveError }}</p>
</template>`

const statsVue = `<script setup>
import { useTaskStore } from './stores/tasks.js'
const store = useTaskStore()
</script>

<template>
  <p class="remaining">{{ store.remaining }} of {{ store.tasks.length }} left</p>
</template>`

// ---- exercise: profile status machine
const profileApi = `const users = {
  ada: { id: 'ada', name: 'Ada Lovelace', plan: 'Pro' },
  alan: { id: 'alan', name: 'Alan Turing', plan: 'Free' },
}

// Simulated server (simplified)
export function fetchProfile(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (users[id]) resolve({ ...users[id] })
      else reject(new Error('User not found'))
    }, 150)
  })
}`

const profileStoreStarter = `import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProfile } from '../api.js'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)
  // TODO: status ('idle' | 'loading' | 'success' | 'error') and error

  async function load(id) {
    // TODO: handle loading, success and failure
    profile.value = await fetchProfile(id)
  }

  return { profile, load }
})`

const profileStoreSolution = `import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchProfile } from '../api.js'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)
  const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
  const error = ref(null)

  async function load(id) {
    status.value = 'loading'
    error.value = null
    try {
      profile.value = await fetchProfile(id)
      status.value = 'success'
    } catch (e) {
      profile.value = null
      error.value = e.message
      status.value = 'error'
    }
  }

  return { profile, status, error, load }
})`

const profileApp = `<script setup>
import { useProfileStore } from './stores/profile.js'
const store = useProfileStore()
</script>

<template>
  <button class="load-ada" @click="store.load('ada')">Load Ada</button>
  <button class="load-ghost" @click="store.load('ghost')">Load a missing user</button>

  <p v-if="store.status === 'idle' || !store.status" class="idle">Pick a user.</p>
  <p v-else-if="store.status === 'loading'" class="loading">Loading…</p>
  <p v-else-if="store.status === 'error'" class="error" role="alert">{{ store.error }}</p>
  <section v-else-if="store.profile" class="card">
    <h3 class="name">{{ store.profile.name }}</h3>
    <p class="plan">{{ store.profile.plan }} plan</p>
  </section>
</template>`

// ---- exercise: optimistic likes
const likeApi = `export const stats = { likeCalls: 0 }

// Simulated server (simplified): saving a like on post 2 always fails
export function saveLike(postId, liked) {
  stats.likeCalls++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (postId === 2) reject(new Error('Could not save your like. Try again.'))
      else resolve({ postId, liked })
    }, 150)
  })
}`

const postStoreStarter = `import { defineStore } from 'pinia'
import { ref } from 'vue'
import { saveLike } from '../api.js'

export const usePostStore = defineStore('posts', () => {
  const posts = ref([
    { id: 1, title: 'Pinia in 5 minutes', likes: 10, likedByMe: false },
    { id: 2, title: 'Why forms are hard', likes: 4, likedByMe: false },
  ])
  const error = ref(null)

  // Pessimistic version: the heart only changes after the server answers.
  async function toggleLike(id) {
    const post = posts.value.find((p) => p.id === id)
    const next = !post.likedByMe
    try {
      await saveLike(id, next)
      post.likedByMe = next
      post.likes += next ? 1 : -1
    } catch (e) {
      error.value = e.message
    }
  }

  return { posts, error, toggleLike }
})`

const postStoreSolution = `import { defineStore } from 'pinia'
import { ref } from 'vue'
import { saveLike } from '../api.js'

export const usePostStore = defineStore('posts', () => {
  const posts = ref([
    { id: 1, title: 'Pinia in 5 minutes', likes: 10, likedByMe: false },
    { id: 2, title: 'Why forms are hard', likes: 4, likedByMe: false },
  ])
  const error = ref(null)
  const pending = ref([]) // ids with a request in flight

  async function toggleLike(id) {
    if (pending.value.includes(id)) return // ignore double clicks while saving
    const post = posts.value.find((p) => p.id === id)
    if (!post) return

    // 1. remember the old values for a rollback
    const before = { likedByMe: post.likedByMe, likes: post.likes }

    // 2. update the UI immediately (optimistic)
    post.likedByMe = !before.likedByMe
    post.likes = before.likes + (post.likedByMe ? 1 : -1)
    error.value = null
    pending.value.push(id)

    try {
      // 3. tell the server
      await saveLike(id, post.likedByMe)
    } catch (e) {
      // 4. the server said no: put things back and explain
      post.likedByMe = before.likedByMe
      post.likes = before.likes
      error.value = e.message
    } finally {
      pending.value = pending.value.filter((p) => p !== id)
    }
  }

  return { posts, error, pending, toggleLike }
})`

const postApp = `<script setup>
import { usePostStore } from './stores/posts.js'
const store = usePostStore()
</script>

<template>
  <article v-for="post in store.posts" :key="post.id" class="post" :data-id="post.id">
    <h3>{{ post.title }}</h3>
    <button class="like" :aria-pressed="post.likedByMe" @click="store.toggleLike(post.id)">
      {{ post.likedByMe ? '♥' : '♡' }} <span class="likes">{{ post.likes }}</span>
    </button>
  </article>
  <p v-if="store.error" class="error" role="alert">{{ store.error }}</p>
</template>`

// ---- interview coding: dedupe in-flight requests
const catalogApi = `export const stats = { requests: 0 }

// Simulated server (simplified)
export function fetchCatalog() {
  stats.requests++
  return new Promise((resolve) => {
    setTimeout(() => resolve([
      { id: 1, name: 'Keyboard' },
      { id: 2, name: 'Mouse' },
      { id: 3, name: 'Monitor' },
    ]), 120)
  })
}`

const catalogStoreStarter = `import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCatalog } from '../api.js'

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref([])
  const status = ref('idle')

  // TODO: if a load is already in flight, reuse it instead of starting another
  async function load() {
    status.value = 'loading'
    const data = await fetchCatalog()
    products.value = data
    status.value = 'success'
    return data
  }

  return { products, status, load }
})`

const catalogStoreSolution = `import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchCatalog } from '../api.js'

export const useCatalogStore = defineStore('catalog', () => {
  const products = ref([])
  const status = ref('idle')
  // Not state: a transient handle to the request in flight (never rendered or persisted)
  let inFlight = null

  function load() {
    if (inFlight) return inFlight // dedupe: everyone shares the same promise

    status.value = 'loading'
    inFlight = fetchCatalog()
      .then((data) => {
        products.value = data
        status.value = 'success'
        return data
      })
      .catch((error) => {
        status.value = 'error'
        throw error
      })
      .finally(() => {
        inFlight = null // the next call after this one starts a fresh request
      })
    return inFlight
  }

  return { products, status, load }
})`

const catalogApp = `<script setup>
import { onMounted } from 'vue'
import { useCatalogStore } from './stores/catalog.js'

const catalog = useCatalogStore()
// Two widgets both ask for the catalogue as the page opens
onMounted(() => {
  catalog.load()
  catalog.load()
})
</script>

<template>
  <p class="status">{{ catalog.status }}</p>
  <ul>
    <li v-for="p in catalog.products" :key="p.id" class="product">{{ p.name }}</li>
  </ul>
</template>`

export default {
  id: 'pinia-async-patterns',
  title: 'Async actions, loading states & optimistic updates',
  summary: 'Write async store actions that tell the truth: loading and error states, retries, race-safe responses, deduplicated requests, optimistic updates with rollback, and an auth store.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['using-stores', 'async-js', 'http-apis-json'],
  related: ['async-ui-states', 'cancellation-race-conditions', 'resilient-requests', 'auth-security', 'pinia-production'],
  tags: ['pinia', 'async actions', 'loading state', 'error state', 'optimistic updates', 'rollback', 'race conditions', 'dedupe', 'auth store', 'status'],
  apis: [
    { name: 'async actions', summary: 'Actions may be `async`; callers can `await` them, and `$onAction` sees their result or rejection.' },
    { name: 'status pattern', summary: 'A single `\'idle\' | \'loading\' | \'success\' | \'error\'` field instead of separate booleans that can contradict each other.' },
    { name: 'optimistic update', summary: 'Update state before the server confirms, keep a snapshot, and roll back if the request fails.' },
    { name: 'request id guard', summary: 'Number each request and ignore responses that are not from the latest one.' },
  ],
  docs: [
    { label: 'Pinia — Actions (async actions)', url: 'https://pinia.vuejs.org/core-concepts/actions.html' },
    { label: 'Pinia — Using a store outside of a component', url: 'https://pinia.vuejs.org/core-concepts/outside-component-usage.html' },
    { label: 'Vue Guide — Composables: async state example', url: 'https://vuejs.org/guide/reusability/composables.html#async-state-example' },
  ],

  intro: `
Most shared state comes from a server: tasks, products, the current user. Fetching it takes time and can fail. An async action has to answer, at every moment, three honest questions for the UI:

- **Is something happening?** (loading)
- **Did it go wrong, and how?** (error)
- **What is the data?** (success)

This lesson turns those questions into patterns you can reuse in any store: a status field, retry, race-safe responses, request deduplication, **optimistic updates** with rollback, and a simplified auth store.
`,

  why: `
A naive async action looks innocent:

\`\`\`js
async function fetchTasks() {
  tasks.value = await api.fetchTasks()
}
\`\`\`

But the UI built on it lies:

- while the request runs, the list is **empty** — users think they have no tasks;
- if it fails, nothing changes and the error disappears into the console;
- if the user clicks Reload twice, the *slower* response may arrive last and overwrite the newer one;
- two components that both "need the tasks" fire two identical requests;
- ticking a checkbox waits for the network before anything moves, so the app feels slow.

Each of these has a well-known fix, and they all live naturally in **store actions** — because the loading flag, the error and the data are shared by every component that shows them.
`,

  eli15: `
Ordering food through a delivery app is a good picture.

- When you press **Order**, the app shows "Preparing…" — that's the **loading** state. It doesn't show an empty plate.
- If the restaurant is closed, it says so and offers **Try again** — that's the **error** state with a retry.
- When the food is on its way, you see the details — **success**.

Now the "like" heart on a photo: the app turns it red **instantly**, even before the server hears about it. That's an **optimistic update** — betting that it will work. If the server says "nope", the app quietly turns it back and shows a small message. That's the **rollback**.
`,

  analogy: {
    title: 'The restaurant order screen',
    body: `
A good restaurant order screen always tells you which of a few situations you are in: not ordered yet, being prepared, ready, or "sorry, we're out of that". It never shows two at once — "ready" *and* "out of stock" would be nonsense.

For tiny, low-risk things, like adding a napkin to the order, the waiter just nods and does it, assuming the kitchen will cope. If the kitchen can't, the waiter comes back and apologises. Nobody waits at the counter for every napkin.
`,
    mapping: [
      ['"not ordered / preparing / ready / sorry"', '`status`: `\'idle\' | \'loading\' | \'success\' | \'error\'`'],
      ['"Try again" on the screen', 'a retry button that calls the action again'],
      ['the waiter nodding for a napkin', 'an optimistic update'],
      ['coming back to apologise', 'rollback + an error message'],
      ['two waiters taking the same order', 'duplicate requests — dedupe them'],
      ['an old order slip arriving after a new one', 'a stale response — ignore it'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The status of an async action',
    caption: 'One field moves through a small set of states. The UI picks what to show from it, so it can never show "loading" and "error" at the same time.',
    alt: 'A state diagram with four states: idle, loading, success and error. An action moves idle to loading. Loading moves to success when the request resolves or to error when it rejects. Retry or reload moves error and success back to loading.',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'idle', label: 'idle', note: 'nothing requested yet', x: 100, y: 150, tone: 'paper' },
        { id: 'loading', label: 'loading', note: 'show a spinner / skeleton', x: 330, y: 150, tone: 'cobalt' },
        { id: 'success', label: 'success', note: 'show the data', x: 600, y: 70, tone: 'acid' },
        { id: 'error', label: 'error', note: 'show message + Retry', x: 600, y: 230, tone: 'red' },
      ],
      edges: [
        { from: 'idle', to: 'loading', label: 'fetchTasks()' },
        { from: 'loading', to: 'success', label: 'resolved' },
        { from: 'loading', to: 'error', label: 'rejected' },
        { id: 'retry', from: 'error', to: 'loading', label: 'Retry', dashed: true },
        { id: 'reload', from: 'success', to: 'loading', label: 'Reload', dashed: true },
      ],
      steps: [
        { focus: ['idle'], text: 'Before anything is requested the status is `idle`. Some UIs show a prompt ("Pick a user"), others start loading on mount.' },
        { focus: ['loading'], edges: ['idle->loading'], text: 'The action sets `status = \'loading\'` and clears the previous error **before** awaiting. Every component reading the store can show a spinner.' },
        { focus: ['success'], edges: ['loading->success'], text: 'When the request resolves, the action stores the data and sets `status = \'success\'`.' },
        { focus: ['error'], edges: ['loading->error'], text: 'If it rejects, the action catches the error, stores a human-readable message and sets `status = \'error\'`. Nothing is swallowed.' },
        { focus: ['loading', 'error', 'success'], edges: ['retry', 'reload'], text: 'Retry and Reload simply call the action again, which moves the status back to `loading`. Because it is one field, contradictory combinations like "loading *and* error" cannot happen.' },
      ],
    },
  },

  animation: {
    type: 'concept-diagram',
    title: 'An optimistic update, step by step',
    caption: 'The UI changes first; the server is told second; a failure puts things back.',
    alt: 'A timeline: the user clicks, the store saves a snapshot and updates state immediately, the UI re-renders, the request is sent, and then either the server confirms and nothing more happens, or it fails and the store restores the snapshot and shows an error.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'click', label: 'Click ♡', tone: 'paper' },
        { id: 'snapshot', label: 'Snapshot', note: 'remember old values', tone: 'kraft' },
        { id: 'apply', label: 'Update state', note: 'UI changes now', tone: 'acid' },
        { id: 'request', label: 'Request', note: 'await the server', tone: 'cobalt' },
        { id: 'outcome', label: 'Keep or roll back', note: 'error → restore', tone: 'red' },
      ],
      edges: [
        { from: 'click', to: 'snapshot' },
        { from: 'snapshot', to: 'apply' },
        { from: 'apply', to: 'request' },
        { from: 'request', to: 'outcome' },
      ],
      steps: [
        { focus: ['click'], text: 'The user clicks the heart. In a pessimistic UI they would now wait for the network.' },
        { focus: ['snapshot'], edges: ['click->snapshot'], text: 'The action first copies the values it is about to change (`likedByMe`, `likes`) so it can undo them.' },
        { focus: ['apply'], edges: ['snapshot->apply'], text: 'It updates state immediately. Vue re-renders on the next tick: the heart turns red and the count goes up before any request is sent.' },
        { focus: ['request'], edges: ['apply->request'], text: 'Now it awaits the server. Meanwhile the button can be marked *pending* so a second click doesn\'t send a contradictory request.' },
        { focus: ['outcome'], edges: ['request->outcome'], text: 'If the server confirms, nothing else happens. If it fails, the action restores the snapshot and sets an error message, so the UI goes back to the truth and explains why.' },
      ],
    },
  },

  syntax: [
    `
#### The loading / error / success action
`,
    {
      code: `async function fetchTasks() {
  status.value = 'loading'
  loadError.value = null             // clear the previous error first
  try {
    tasks.value = await api.fetchTasks()
    status.value = 'success'
  } catch (error) {
    loadError.value = error.message  // something a human can read
    status.value = 'error'
  }
}`,
      lang: 'js',
      title: 'status pattern (setup store)',
    },
    `
With booleans instead, use \`finally\` so the flag is reset on every path:
`,
    {
      code: `async fetchTasks() {          // option store action
  this.loading = true
  this.error = null
  try {
    this.tasks = await api.fetchTasks()
  } catch (error) {
    this.error = error.message
  } finally {
    this.loading = false          // runs after success AND failure
  }
}`,
      lang: 'js',
      title: 'boolean flags + finally',
    },
    `
#### Let callers await the result

An async action returns a promise. Components can \`await\` it to navigate or show a toast, while the store keeps the shared state:
`,
    {
      code: `// store
async function createTask(title) {
  const task = await api.createTask(title) // let errors propagate…
  tasks.value.push(task)
  return task
}

// component
async function onSubmit() {
  try {
    const task = await store.createTask(title.value)
    router.push(\`/tasks/\${task.id}\`)
  } catch (error) {
    formError.value = error.message      // …so the caller can react
  }
}`,
      lang: 'js',
      title: 'returning results',
    },
    `
#### Optimistic update with rollback
`,
    {
      code: `async function toggleTask(id) {
  const task = tasks.value.find((t) => t.id === id)
  const before = task.done             // 1. snapshot
  task.done = !before                  // 2. update the UI now
  try {
    await api.updateTask(id, { done: task.done }) // 3. tell the server
  } catch (error) {
    task.done = before                 // 4. roll back
    saveError.value = error.message    //    and explain
  }
}`,
      lang: 'js',
      title: 'optimistic toggle',
    },
    `
#### Ignore stale responses (race conditions)
`,
    {
      code: `let latestRequest = 0

async function search(query) {
  const requestId = ++latestRequest
  const data = await api.search(query)
  if (requestId !== latestRequest) return // a newer search started — drop this one
  results.value = data
}`,
      lang: 'js',
      title: 'latest request wins',
    },
    `
Real \`fetch\` calls can also be cancelled with an \`AbortController\` — see [cancellation & race conditions](lesson:cancellation-race-conditions).

#### Deduplicate concurrent requests and cache briefly
`,
    {
      code: `let inFlight = null           // a transient handle, not state
const lastLoaded = ref(0)

function loadProducts({ maxAgeMs = 60_000 } = {}) {
  if (inFlight) return inFlight                        // share the running request
  if (Date.now() - lastLoaded.value < maxAgeMs) return Promise.resolve(products.value)
  inFlight = api.fetchProducts()
    .then((data) => { products.value = data; lastLoaded.value = Date.now(); return data })
    .finally(() => { inFlight = null })
  return inFlight
}`,
      lang: 'js',
      title: 'dedupe + simple cache (simplified)',
    },
    `
#### An auth store (simplified)
`,
    {
      code: `export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const status = ref('idle')
  const error = ref(null)
  const isLoggedIn = computed(() => user.value !== null)

  async function login(email, password) {
    status.value = 'loading'
    error.value = null
    try {
      // the server sets an httpOnly session cookie; JS never sees the secret
      user.value = await api.login(email, password)
      status.value = 'success'
    } catch (e) {
      error.value = e.message
      status.value = 'error'
      throw e                     // let the form react too
    }
  }

  async function logout() {
    await api.logout()
    user.value = null
  }

  return { user, status, error, isLoggedIn, login, logout }
})`,
      lang: 'js',
      title: 'stores/auth.js (simplified)',
      static: true,
    },
    `
**The rules:**

1. Set \`loading\` and clear the old error **before** the first \`await\`.
2. Every path out of the action must leave a truthful state — use \`try/catch\` and \`finally\` (or a status field set in both branches).
3. Store **human-readable** error messages for the UI; log the technical detail.
4. Decide per action whether to **swallow** errors into state (lists, background loads) or **re-throw** them so the caller can react (forms, navigation) — or both.
5. Optimistic updates need a **snapshot** and a **rollback**, and work best for small, likely-to-succeed changes.
6. When several requests can overlap, decide which response wins; don't let the slowest one win by accident.
7. The auth store only drives the UI. The **server must authorise every request**; never put secrets or permission decisions only in the browser.
`,
    {
      callout: 'tip',
      title: 'Server-state libraries',
      text: 'Caching, deduplication, refetch-on-focus and retries are a lot to hand-write. Libraries such as TanStack Query (Vue Query) and Pinia Colada specialise in server state. The patterns here are what those libraries automate — knowing them helps you use either approach well.',
    },
  ],

  walkthrough: {
    title: 'stores/tasks.js',
    lang: 'js',
    code: tasksStore,
    intro: 'The playground\'s task store. Read how each action keeps the UI honest — and spot the one that will feel slow.',
    steps: [
      { lines: [3], text: 'The store talks to the server through `api.js`, never with raw `fetch` scattered across components. Swapping the fake API for a real one changes one file.' },
      { lines: [6, 10], text: 'Shared async state: the data, **one** `status` field, and separate messages for load and save failures (a failed save shouldn\'t hide the list).' },
      { lines: [12, 13], text: 'Derived values. `isLoading` is computed from `status`, so it can never disagree with it.' },
      { lines: [15, 17], text: 'Before awaiting, the action announces `loading` and clears the old error. Every component shows the spinner immediately.' },
      { lines: [18, 25], text: 'Success and failure each leave a complete, truthful state. The error is stored for the UI instead of vanishing into the console.' },
      { lines: [27, 38], text: 'The toggle is **pessimistic**: the checkbox\'s `done` state only changes after the server answers. It is safe but feels sluggish — you will make it optimistic in the playground.' },
      { lines: [40], text: 'Everything the UI needs is returned: state, getters and actions.' },
    ],
  },

  playground: {
    title: 'Team tasks with a flaky server',
    objective: 'Make a store-backed task list handle failures gracefully, show honest loading states, and feel instant with optimistic updates.',
    files: {
      'main.js': mainJs,
      'api.js': tasksApi,
      'stores/tasks.js': tasksStore,
      'App.vue': appVue,
      'Toolbar.vue': toolbarVue,
      'TaskList.vue': taskListVue,
      'TaskStats.vue': statsVue,
    },
    expected: '"Loading tasks…" for a moment, then three tasks and "2 of 3 left". Tick **Fail loads** and press **Reload** to see the error state (with no way to recover yet). Tick a task: it only crosses out after the fake server answers.',
    experiments: [
      {
        id: 'retry',
        task: 'When loading fails, the user is stuck. Add a **Retry** button with `class="retry"` inside the `.load-error` box that calls `fetchTasks()` again.',
        hint: 'In `TaskList.vue`, inside the error `div`: `<button class="retry" @click="store.fetchTasks()">Retry</button>`.',
        tests: [
          {
            name: 'retry recovers after a failed load',
            code: `const api = requireModule('api.js')
api.network.failLoads = true
await click('.reload')
await wait(450)
expect(exists('.load-error')).toBe(true)
api.network.failLoads = false
expect(exists('.retry')).toBe(true)
await click('.retry')
expect(exists('.loading')).toBe(true)
await wait(450)
expect(exists('.load-error')).toBe(false)
expect(findAll('.task')).toHaveLength(3)`,
          },
        ],
        explain: 'An error state without a way out is a dead end. Because the action resets `status` and `loadError` before awaiting, calling it again is all a retry needs.',
      },
      {
        id: 'busy-reload',
        task: 'While tasks are loading, **disable** the Reload button (and, if you like, change its label to "Loading…"). It must be enabled again when loading finishes.',
        hint: 'In `Toolbar.vue`: `:disabled="store.isLoading"`.',
        tests: [
          {
            name: 'Reload is disabled only while loading',
            code: `await wait(450)
expect(find('.reload').disabled).toBe(false)
await click('.reload')
expect(find('.reload').disabled).toBe(true)
await wait(450)
expect(find('.reload').disabled).toBe(false)`,
          },
        ],
        explain: 'The toolbar and the list are different components, but both read `isLoading` from the store, so they always agree about whether a load is running. Disabling the button also prevents piling up overlapping requests.',
      },
      {
        id: 'optimistic-toggle',
        task: 'Make `toggleTask` **optimistic**: flip `task.done` immediately, then call the server; if it fails, flip it back and set `saveError`. Test it with **Fail saves** ticked.',
        hint: 'Save `const before = task.done`, set `task.done = !before` *before* the `await`, and in `catch` restore `task.done = before`.',
        tests: [
          {
            name: 'the task crosses out immediately',
            code: `await wait(450)
await check(findAll('.task .toggle')[1], true)
expect(classes(findAll('.task')[1])).toContain('done')
await wait(450)
expect(classes(findAll('.task')[1])).toContain('done')
expect(text('.remaining')).toBe('1 of 3 left')`,
          },
          {
            name: 'a failed save rolls back and explains',
            code: `await wait(450)
requireModule('api.js').network.failSaves = true
await check(findAll('.task .toggle')[1], true)
expect(classes(findAll('.task')[1])).toContain('done')
await wait(450)
expect(classes(findAll('.task')[1])).not.toContain('done')
expect(exists('.save-error')).toBe(true)`,
          },
        ],
        explain: 'The UI now responds at the speed of a click, and the rollback keeps it honest when the server disagrees. Optimistic updates suit small, likely-to-succeed changes; for payments or irreversible actions, keep them pessimistic.',
      },
      {
        id: 'race',
        task: 'Think it through: press **Reload** twice quickly. Both requests run and the last one to *finish* sets `tasks`. With a real network, an older, slower response could overwrite a newer one. Add a request counter to `fetchTasks` so only the latest response is applied.',
        hint: '`let latestRequest = 0` above the action; `const id = ++latestRequest` at the start; after the `await`, `if (id !== latestRequest) return`.',
        explain: 'Requests don\'t finish in the order they start. "Latest request wins" is one of the simplest fixes; aborting the older request with `AbortController` is another, and it also saves bandwidth.',
      },
    ],
  },

  internals: {
    beginner: `
An \`async\` action is a normal function that pauses at each \`await\` and lets the rest of the app keep running. Everything you change **before** the first \`await\` shows up on screen almost immediately (on the next render). Everything **after** it happens later, when the server answers.

That is why loading flags are set *before* awaiting, and why optimistic updates change state *before* awaiting: Vue gets to draw those changes while the request is still travelling.
`,
    technical: [
      `
**Timing.** Calling an async action runs synchronously up to the first \`await\`, then returns a pending promise. State changes made in that synchronous part are batched with any other changes in the same tick and rendered on the next flush. After the promise resolves, the code after \`await\` runs in a later microtask, and its changes trigger another render.

**Pinia and promises.** Pinia wraps actions; when an action returns a promise, \`$onAction\`'s \`after\` waits for it to resolve (receiving the value) and \`onError\` receives the rejection. The caller gets the same promise back, so \`await store.action()\` works and errors can propagate.

**Shared async state.** Because \`status\` and \`error\` are store state, every component that reads them re-renders together. Two widgets can't disagree about whether a load is happening — a common bug when each component tracks its own \`loading\` ref.
`,
      {
        code: `store.fetchTasks()          // runs until the first await
// status is already 'loading' here (the DOM updates on the next tick)
await nextTick()            // spinner rendered
// …300 ms later the promise resolves:
// tasks = data, status = 'success' → another render`,
        lang: 'js',
        title: 'what happens when',
      },
      `
**Races.** Responses resolve in network order, not call order. A "latest request id" guard compares a counter captured when the request started with the current counter when it ends. An \`AbortController\` goes further and cancels the older request; \`fetch\` then rejects with an \`AbortError\`, which you should ignore rather than show.

**Deduplication.** Storing the in-flight promise lets every caller \`await\` the same request. Keep it in a plain variable inside the setup function (or module) — it is a transient handle, not state to render, persist or serialise for SSR.
`,
    ],
    production: `
- **Classify errors.** Network errors, 4xx validation errors and 5xx server errors need different UI. Map them to messages in one place (the API layer or the store), and send technical details to logging, not to users.
- **Don't leak loading state.** Every \`return\` and every \`throw\` path must reset loading. A status field set in every branch — or \`finally\` — makes this structural instead of something to remember.
- **Optimistic updates need a server source of truth.** After a rollback (or periodically), refetch to resync. Watch for conflicting edits from other users.
- **Prevent duplicate writes.** Disable the button while pending, ignore re-entrant calls, and — for anything that must not happen twice, like payments — use an idempotency key the server understands. See [duplicate submits in forms](lesson:advanced-forms).
- **Auth state is UX, not security.** A store holding \`user.role\` decides what the UI shows; the backend authorises every request. Prefer httpOnly, server-set cookies for session tokens: JavaScript can't read them, whereas anything in \`localStorage\` is readable by any script that manages to run on your page. See [auth security](lesson:auth-security).
- **Consider a server-state layer** (TanStack Query, Pinia Colada) when many stores reimplement caching, polling and retries. Keep Pinia for client state such as the cart, preferences and UI-wide flags.
`,
  },

  mistakes: [
    {
      title: 'Leaving the spinner on after an error',
      wrong: { code: `async function load() {
  loading.value = true
  items.value = await api.fetchItems() // throws → the next line never runs
  loading.value = false
}`, lang: 'js' },
      right: { code: `async function load() {
  loading.value = true
  error.value = null
  try {
    items.value = await api.fetchItems()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}`, lang: 'js' },
      explanation: 'If the request rejects, everything after the `await` is skipped, including `loading = false`. `finally` runs on both paths.',
    },
    {
      title: 'Booleans that can contradict each other',
      wrong: { code: `const isLoading = ref(false)
const hasError = ref(false)
const isLoaded = ref(false)
// isLoading && hasError && isLoaded can all be true after a retry bug`, lang: 'js' },
      right: { code: `const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
const isLoading = computed(() => status.value === 'loading')`, lang: 'js' },
      explanation: 'Three booleans allow eight combinations, most of them nonsense. One status field allows exactly the four that make sense.',
    },
    {
      title: 'Optimistic update without a rollback',
      wrong: { code: `async function toggleLike(post) {
  post.likedByMe = !post.likedByMe
  post.likes += post.likedByMe ? 1 : -1
  await api.saveLike(post.id, post.likedByMe) // fails → the UI keeps lying
}`, lang: 'js' },
      right: { code: `async function toggleLike(post) {
  const before = { ...post }
  post.likedByMe = !post.likedByMe
  post.likes += post.likedByMe ? 1 : -1
  try {
    await api.saveLike(post.id, post.likedByMe)
  } catch (e) {
    Object.assign(post, before)
    error.value = 'Could not save your like.'
  }
}`, lang: 'js' },
      explanation: 'Optimism is a bet. Without a snapshot and a rollback, a failed request leaves the UI showing something the server never accepted.',
    },
    {
      title: 'Swallowing errors the caller needs',
      wrong: { code: `async function createTask(title) {
  try {
    tasks.value.push(await api.createTask(title))
  } catch {}                          // the form thinks it worked
}

// component
await store.createTask(title.value)
router.push('/tasks')                 // navigates even on failure`, lang: 'js' },
      right: { code: `async function createTask(title) {
  const task = await api.createTask(title) // errors propagate
  tasks.value.push(task)
  return task
}`, lang: 'js' },
      explanation: 'An empty `catch` hides failures from everyone. Either store the error for the UI, re-throw it so the caller can react, or both — never neither.',
    },
  ],

  debugging: [
    {
      symptom: 'The spinner never goes away after a failed request.',
      cause: 'The loading flag is reset after the `await`, which is skipped when the promise rejects.',
      fix: 'Reset it in `finally`, or set a status field in both the `try` and the `catch`.',
    },
    {
      symptom: 'Search results sometimes show results for an older query.',
      cause: 'Responses arrive out of order and the slower, older one is applied last.',
      fix: 'Guard with a request id ("latest wins") or abort the previous request with `AbortController`.',
    },
    {
      symptom: 'The network tab shows the same request twice on page load.',
      cause: 'Two components each call the load action in `onMounted`.',
      fix: 'Dedupe in the store by reusing the in-flight promise, and/or skip loading when fresh data is already present.',
    },
    {
      symptom: 'Unhandled promise rejection warnings after clicking a button.',
      cause: 'An action re-throws, and the component calls it without `await`/`try` or `.catch()`.',
      fix: 'Handle the error where the action is called, or decide the store should swallow it into error state.',
    },
    {
      symptom: 'A liked post flickers back and forth after double-clicking.',
      cause: 'Overlapping optimistic requests for the same item.',
      fix: 'Track pending ids and ignore clicks while a request for that item is in flight (and disable the button).',
    },
  ],

  bestPractices: [
    'Model async state as one status field plus data and a human-readable error.',
    'Set loading and clear errors before the first `await`; reset on every exit path.',
    'Keep API calls in an API/service module; stores orchestrate, components display.',
    'Decide per action whether errors become state, propagate to the caller, or both.',
    'Use optimistic updates for small, reversible, likely-to-succeed actions — always with a snapshot and rollback.',
    'Guard against stale responses and duplicate in-flight requests.',
    'Never treat the auth store as security: the server authorises every request.',
  ],

  useCases: [
    'Loading a task list with spinner, error message and Retry.',
    'Likes, stars, checkboxes and reordering that should feel instant (optimistic).',
    'Search-as-you-type where only the latest response may be shown.',
    'A product catalogue several widgets request at once (deduplicated).',
    'Login/logout and the current user shared by navbar, guards and settings.',
  ],

  whenToUse: {
    use: [
      'Several components display the same async data or its loading/error state — keep it in a store action.',
      'Optimistic updates for cheap, reversible changes where waiting feels slow.',
      'A request id guard or abort whenever the same request can overlap.',
      'In-flight dedupe for data many components request on mount.',
    ],
    avoid: [
      'Optimistic updates for payments, deletions without undo, or anything irreversible.',
      'Putting one-off, single-component fetches in a global store — a composable or local state is enough.',
      'Hand-building a full caching layer when a server-state library would fit better.',
      'Trusting auth store flags for anything the server doesn\'t also check.',
    ],
  },

  comparison: {
    title: 'Pessimistic vs optimistic updates',
    headers: ['', 'Pessimistic', 'Optimistic'],
    rows: [
      ['When the UI changes', 'after the server confirms', 'immediately, before the request'],
      ['Feels', 'slower, but never wrong', 'instant, occasionally corrected'],
      ['On failure', 'show an error; nothing to undo', 'roll back to the snapshot and show an error'],
      ['Extra code', 'a pending/loading indicator', 'snapshot, rollback, pending guard'],
      ['Good for', 'payments, deletes, irreversible or conflict-prone actions', 'likes, toggles, reordering, renaming'],
    ],
    note: 'Next: [persistence, testing and choosing Pinia](lesson:pinia-production).',
  },

  quiz: [
    {
      id: 'pinia-async-patterns-q1',
      type: 'mcq',
      prompt: 'Why put `loading.value = false` in a `finally` block?',
      options: [
        { text: 'It runs whether the request succeeded or failed, so loading is always reset' },
        { text: 'It runs before the `try` block', why: '`finally` runs after `try`/`catch`, not before.' },
        { text: 'It makes the request faster', why: 'It has no effect on the request itself.' },
        { text: 'Vue requires it for async actions', why: 'Vue and Pinia don\'t require it; it\'s about correctness on every path.' },
      ],
      answer: 0,
      explanation: 'If the awaited promise rejects, code after the `await` in `try` is skipped. `finally` always runs.',
    },
    {
      id: 'pinia-async-patterns-q2',
      type: 'output',
      prompt: 'Post 2 starts with `likes: 4`. The user clicks like; the server rejects. What does `post.likes` end up as, and what was it right after the click?',
      code: {
        lang: 'js',
        code: `async function toggleLike(post) {
  const before = post.likes
  post.likes++                       // optimistic
  try {
    await api.saveLike(post.id)      // rejects
  } catch {
    post.likes = before
  }
}`,
      },
      options: [
        { text: 'Right after the click: 5. At the end: 4.' },
        { text: 'Right after the click: 4. At the end: 4.', why: 'The increment happens before the `await`, so the UI shows 5 immediately.' },
        { text: 'Right after the click: 5. At the end: 5.', why: 'The `catch` restores the snapshot.' },
        { text: 'Right after the click: 5. At the end: 3.', why: 'The rollback restores `before` (4); it doesn\'t subtract.' },
      ],
      answer: 0,
      explanation: 'The optimistic increment runs synchronously (5 on screen), then the rejection triggers the rollback to the saved value (4).',
    },
    {
      id: 'pinia-async-patterns-q3',
      type: 'bug',
      prompt: 'After a failed request the spinner spins forever. Click the line responsible.',
      code: {
        lang: 'js',
        code: `async function fetchOrders() {
  this.loading = true
  this.error = null
  try {
    this.orders = await api.fetchOrders()
    this.loading = false
  } catch (e) {
    this.error = e.message
  }
}`,
      },
      answerLine: 6,
      explanation: '`loading = false` only runs on success. Move it into a `finally` block (or also set it in `catch`).',
    },
    {
      id: 'pinia-async-patterns-q4',
      type: 'fill',
      prompt: 'Complete the action so the spinner is always cleared and the data is awaited.',
      code: {
        lang: 'js',
        code: `async function load() {
  loading.value = true
  try {
    items.value = ___ api.fetchItems()
  } catch (e) {
    error.value = e.message
  } ___ {
    loading.value = false
  }
}`,
      },
      answer: [['await'], ['finally']],
      explanation: '`await` waits for the data; `finally` resets loading on both paths.',
    },
    {
      id: 'pinia-async-patterns-q5',
      type: 'mcq',
      prompt: 'Which action is the **worst** candidate for an optimistic update?',
      options: [
        { text: 'Submitting a payment' },
        { text: 'Starring a repository', why: 'Cheap, reversible and likely to succeed — a classic optimistic case.' },
        { text: 'Marking a todo as done', why: 'Easy to roll back if it fails.' },
        { text: 'Reordering items in a list', why: 'Common optimistic case with a rollback to the old order.' },
      ],
      answer: 0,
      explanation: 'Payments are irreversible and failure-prone; pretending they succeeded and then "rolling back" would mislead users. Keep them pessimistic.',
    },
    {
      id: 'pinia-async-patterns-q6',
      type: 'mcq',
      prompt: 'Select **all** that belong in a frontend auth store.',
      options: [
        { text: 'The current user\'s public profile (name, avatar)' },
        { text: 'An `isLoggedIn` getter' },
        { text: '`login()` and `logout()` actions' },
        { text: 'The user\'s password, kept for re-login', why: 'Never keep passwords in client state; the server issues a session instead.' },
        { text: 'The only check deciding whether an API request is allowed', why: 'Authorisation must happen on the server. Client checks are UX only.' },
      ],
      answer: [0, 1, 2],
      explanation: 'The auth store drives the UI: who is logged in and how to log in/out. Secrets and real permission decisions belong on the server.',
    },
    {
      id: 'pinia-async-patterns-q7',
      type: 'short',
      prompt: 'Two components both call `catalog.load()` when the page opens, and you see two identical requests. Describe a fix inside the store.',
      answer: 'Keep the in-flight promise in a variable inside the store. When load() is called while a request is running, return that same promise instead of starting a new one; clear it in finally so the next call after completion starts fresh. Optionally skip loading entirely when fresh data is already cached.',
    },
  ],

  exercises: [
    {
      id: 'profile-status',
      title: 'A profile store that never lies',
      difficulty: 'intermediate',
      prompt: `
Finish \`stores/profile.js\` so the UI can show every async state. The template in \`App.vue\` is done.

- Add state \`status\` (\`'idle'\` → \`'loading'\` → \`'success'\` or \`'error'\`) and \`error\` (a message or \`null\`), and return them.
- \`load(id)\` sets \`status\` to \`'loading'\` and clears \`error\` **before** awaiting.
- On success it stores the profile and sets \`'success'\`.
- On failure it sets \`profile\` to \`null\`, stores the error's \`message\` and sets \`'error'\` — **without** throwing.

The UI shows \`.idle\`, \`.loading\`, \`.error\` or \`.name\`. \`.load-ada\` loads a real user; \`.load-ghost\` loads one that doesn't exist (the fake server rejects with "User not found").
`,
      files: {
        'main.js': mainJs,
        'api.js': profileApi,
        'stores/profile.js': profileStoreStarter,
        'App.vue': profileApp,
      },
      hints: [
        'Add `const status = ref(\'idle\')` and `const error = ref(null)` and include both in the returned object.',
        'Wrap the `await` in `try { … } catch (e) { … }` and set `status` in both branches.',
        'Set `status.value = \'loading\'` and `error.value = null` on the first lines of `load`, before the `await`.',
      ],
      solution: {
        explanation: 'Each moment of the request maps to exactly one status, set in one place. Clearing the error before awaiting means a retry never shows a stale message next to a spinner, and catching the rejection turns it into state the UI can render.',
        files: {
          'main.js': mainJs,
          'api.js': profileApi,
          'stores/profile.js': profileStoreSolution,
          'App.vue': profileApp,
        },
      },
      tests: [
        { name: 'starts idle', code: `expect(exists('.idle')).toBe(true)` },
        {
          name: 'shows loading while fetching',
          code: `await click('.load-ada')
expect(exists('.loading')).toBe(true)`,
        },
        {
          name: 'shows the profile on success',
          code: `await click('.load-ada')
await wait(250)
expect(exists('.loading')).toBe(false)
expect(text('.name')).toBe('Ada Lovelace')
const { useProfileStore } = requireModule('stores/profile.js')
expect(useProfileStore().status).toBe('success')`,
        },
        {
          name: 'shows the error on failure',
          code: `await click('.load-ghost')
await wait(250)
expect(text('.error')).toContain('User not found')
expect(exists('.name')).toBe(false)
const { useProfileStore } = requireModule('stores/profile.js')
expect(useProfileStore().status).toBe('error')`,
        },
        {
          name: 'a retry clears the old error immediately',
          code: `await click('.load-ghost')
await wait(250)
await click('.load-ada')
expect(exists('.error')).toBe(false)
expect(exists('.loading')).toBe(true)
await wait(250)
expect(text('.name')).toBe('Ada Lovelace')`,
        },
      ],
    },
    {
      id: 'optimistic-likes',
      title: 'Optimistic likes with rollback',
      difficulty: 'advanced',
      prompt: `
The like button waits for the server before anything changes. Rewrite \`toggleLike(id)\` in \`stores/posts.js\` to be **optimistic**:

- flip \`likedByMe\` and adjust \`likes\` by ±1 **immediately**;
- then call \`saveLike(id, liked)\`;
- if it fails, restore both values and set \`error\` to the error's message (clear \`error\` when a new like starts);
- while a request for a post is in flight, **ignore further clicks on that post** (track pending ids in state).

The fake server always rejects likes on post 2. Each post renders \`<article class="post" data-id="…">\` with a \`.like\` button (with \`aria-pressed\`) containing \`.likes\`; errors appear in \`.error\`.
`,
      files: {
        'main.js': mainJs,
        'api.js': likeApi,
        'stores/posts.js': postStoreStarter,
        'App.vue': postApp,
      },
      hints: [
        'Before touching anything, save a snapshot: `const before = { likedByMe: post.likedByMe, likes: post.likes }`.',
        'Change the post *before* `await saveLike(...)`, and restore from the snapshot in `catch`.',
        'Add `const pending = ref([])`: return early if the id is in it, push it before awaiting, remove it in `finally`. Return `pending` too.',
      ],
      solution: {
        explanation: 'The state changes before the first `await`, so Vue renders the new heart on the next tick. The snapshot makes the rollback exact, and the pending list stops a quick second click from sending a contradictory request that could finish in the wrong order.',
        files: {
          'main.js': mainJs,
          'api.js': likeApi,
          'stores/posts.js': postStoreSolution,
          'App.vue': postApp,
        },
      },
      tests: [
        {
          name: 'the like shows immediately',
          code: `await click('[data-id="1"] .like')
expect(text('[data-id="1"] .likes')).toBe('11')
expect(attr('[data-id="1"] .like', 'aria-pressed')).toBe('true')`,
        },
        {
          name: 'it stays liked after the server confirms',
          code: `await click('[data-id="1"] .like')
await wait(250)
expect(text('[data-id="1"] .likes')).toBe('11')
expect(exists('.error')).toBe(false)`,
        },
        {
          name: 'a rejected like rolls back with a message',
          code: `await click('[data-id="2"] .like')
expect(text('[data-id="2"] .likes')).toBe('5')
await wait(250)
expect(text('[data-id="2"] .likes')).toBe('4')
expect(attr('[data-id="2"] .like', 'aria-pressed')).toBe('false')
expect(text('.error')).toContain('Could not save your like')`,
        },
        {
          name: 'clicks are ignored while a like is pending',
          code: `await click('[data-id="1"] .like')
await click('[data-id="1"] .like')
await wait(250)
expect(text('[data-id="1"] .likes')).toBe('11')
expect(requireModule('api.js').stats.likeCalls).toBe(1)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'pinia-async-patterns-status-field',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why do many teams model async state as a single `status` field instead of `isLoading`, `hasError` and `isLoaded` booleans?',
      answer: 'Independent booleans can represent impossible combinations (loading and error at once, loaded and errored). A single status with values like `idle | loading | success | error` can only be in one valid state, so the UI logic becomes a simple switch and bugs from forgetting to reset a flag disappear. Booleans like `isLoading` can still be exposed as computed values derived from status.',
      explanation: 'Make impossible states unrepresentable.',
      whyAsked: 'Shows you think about UI correctness, not just happy paths.',
      mistakes: ['Saying booleans are "fine" without addressing impossible states.', 'Adding a status field but still also storing the booleans separately.'],
      followUps: ['Where do you store the error message?', 'Would you keep stale data visible during a reload?'],
      modelAnswer: 'With three booleans you get eight combinations and only four make sense, so a missed reset can show a spinner and an error at the same time. A single status field — idle, loading, success, error — can only ever be one thing, and the template becomes a straightforward if/else chain. I still expose `isLoading` as a computed for convenience, but it\'s derived from status, so it can\'t drift.',
    },
    {
      id: 'pinia-async-patterns-where-fetch',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'Where should data fetching live: in components, in composables, or in Pinia actions?',
      answer: 'Raw HTTP calls belong in an API/service module. Data that several components share — or that must survive navigation — is fetched in store actions, which own its loading/error state. Data used by a single component or page can be fetched in that component or in a composable with local state. Components should mostly display state and call actions.',
      explanation: 'Put state where its readers are, and keep transport details in one layer.',
      whyAsked: 'A core architecture question for any Vue team.',
      mistakes: ['"Always in the store" or "always in components".', 'Calling `fetch` directly from many components with duplicated error handling.'],
      followUps: ['How do you test an action that fetches?', 'When would you use a server-state library instead?'],
      modelAnswer: 'I separate three layers. An API module wraps HTTP — URLs, headers, error mapping. Store actions fetch data that is shared or long-lived, like the current user or the cart, and own the status and error so every component sees the same thing. One-off data for a single page can live in that page or a composable. Components then mostly render state and call actions. If many stores start reimplementing caching and retries, I would evaluate a server-state library.',
    },
    {
      id: 'pinia-async-patterns-await-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does the component log?',
      code: {
        lang: 'js',
        code: `// store (setup)
async function save() {
  status.value = 'saving'
  await api.save()          // takes 200 ms
  status.value = 'saved'
}

// component
store.save()
console.log(store.status)`,
      },
      options: ['undefined', '\'saving\'', '\'saved\'', 'A pending Promise'],
      correctOption: 1,
      answer: '`\'saving\'`. The action runs synchronously until the first `await`, so `status` is already `\'saving\'` when `save()` returns its pending promise. `\'saved\'` is set 200 ms later.',
      explanation: 'Async functions run synchronously up to the first `await`.',
      whyAsked: 'Tests precise understanding of async timing, which explains why loading flags appear immediately.',
      mistakes: ['Answering `saved` because "the action ran".', 'Thinking nothing runs until the event loop is free.'],
      followUps: ['How would you log `saved`?', 'When does the DOM show "saving"?'],
      modelAnswer: 'It logs `saving`. Calling an async function executes its body synchronously until the first `await`, then returns a pending promise — so the status was set before control came back. `saved` is assigned after the API resolves. To log it I would `await store.save()` first. The DOM shows "saving" on the next render tick.',
    },
    {
      id: 'pinia-async-patterns-race',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A search store sometimes shows results for "vu" while the input says "vue". The action is below. What is happening and how do you fix it?',
      code: {
        lang: 'js',
        code: `async function search(query) {
  status.value = 'loading'
  results.value = await api.search(query)
  status.value = 'success'
}`,
      },
      answer: 'A race condition: the request for "vu" started first but finished last, overwriting the results for "vue". Fix it by ignoring stale responses — capture a request id (`const id = ++latest`) and only apply results if `id === latest` — and/or cancel the previous request with `AbortController`. Debouncing reduces how often it happens but doesn\'t remove the race.',
      explanation: 'Network responses don\'t arrive in call order.',
      whyAsked: 'Classic real-world async bug; tests whether you know the standard fixes and their trade-offs.',
      mistakes: ['Saying debounce alone fixes it.', 'Blaming Vue reactivity.', 'Showing an AbortError to the user.'],
      followUps: ['How do you avoid showing an error for aborted requests?', 'Where would you put the AbortController in a store?'],
      modelAnswer: 'It is a race: two requests are in flight and the older one resolved last, overwriting newer results. I would number each request and only commit results from the latest one, which is cheap and reliable. Where the API supports it I also abort the previous request with an AbortController, which saves bandwidth — and I would ignore the resulting AbortError instead of showing it. Debouncing helps load but doesn\'t remove the race on its own.',
    },
    {
      id: 'pinia-async-patterns-optimistic',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Product asks for the "mark as done" checkbox to feel instant even on slow connections. How do you implement it safely?',
      answer: 'Use an optimistic update in the store action: snapshot the current value, update state immediately, send the request, and on failure restore the snapshot and show an error. Guard against double-clicks with a pending state, and consider refetching after failures to resync with the server.',
      explanation: 'Instant feedback with a safety net.',
      whyAsked: 'Optimistic UI is common in product work; interviewers want to see the rollback and edge cases, not just "update first".',
      mistakes: ['Forgetting the rollback.', 'Not handling double clicks or overlapping requests.', 'Applying it to irreversible actions.'],
      followUps: ['What if two users edit the same task?', 'Would you do this for deletions?'],
      modelAnswer: 'I would make the toggle optimistic in the store: save the old value, flip it immediately so Vue renders it on the next tick, then call the API. If the request fails I restore the snapshot and show a short error. I would mark the item as pending to ignore extra clicks while the request is in flight, and after a failure possibly refetch to resync. I wouldn\'t do this for irreversible actions like payments.',
    },
    {
      id: 'pinia-async-patterns-auth',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design an auth store for a Vue SPA. What state, getters and actions does it have, where is the session token kept, and what does the store *not* do?',
      answer: 'State: `user` (public profile, or null), `status`, `error`. Getters: `isLoggedIn`, maybe `hasRole(role)` for UI decisions. Actions: `login`, `logout`, `fetchCurrentUser` (to restore the session on app start). The session should preferably live in an httpOnly, server-set cookie that JavaScript can\'t read; if a token must be handled in JS, keep it in memory and be aware that anything in localStorage is readable by injected scripts. The store does not secure anything: route guards and role checks are UX, and the backend authorises every request. On logout, reset other user-specific stores too.',
      explanation: 'The store reflects the session; the server enforces it.',
      code: {
        lang: 'js',
        code: `router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.status === 'idle') await auth.fetchCurrentUser() // restore session once
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})`,
      },
      whyAsked: 'Combines Pinia, routing and security judgement — a favourite senior question.',
      mistakes: ['Storing passwords or treating guards as security.', 'Putting long-lived tokens in localStorage without discussing XSS.', 'Forgetting to restore the session on reload.'],
      followUps: ['How do you handle an expired session mid-use?', 'What else must happen on logout?'],
      modelAnswer: 'The auth store holds the current user\'s public profile, a status and an error, with an `isLoggedIn` getter and `login`, `logout` and `fetchCurrentUser` actions. On app start a guard calls `fetchCurrentUser` once to restore the session. I prefer the server to keep the session in an httpOnly cookie so JavaScript never touches the secret; tokens in localStorage are exposed to any XSS. Crucially, the store and guards only shape the UI — the backend authorises every request. On logout I also reset user-specific stores like the cart.',
    },
    {
      id: 'pinia-async-patterns-coding-dedupe',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Two widgets call `catalog.load()` as the page opens, causing two identical requests. Change `load()` so that calls made while a request is in flight **reuse the same promise** (one network request), and a call made after it finishes starts a new request. `load()` must still resolve with the products.',
      starter: {
        files: {
          'main.js': mainJs,
          'api.js': catalogApi,
          'stores/catalog.js': catalogStoreStarter,
          'App.vue': catalogApp,
        },
      },
      tests: [
        {
          name: 'the page makes one request and shows the products',
          code: `await wait(250)
expect(findAll('.product')).toHaveLength(3)
expect(text('.status')).toBe('success')
expect(requireModule('api.js').stats.requests).toBe(1)`,
        },
        {
          name: 'concurrent calls share one promise and its result',
          code: `await wait(250)
const { useCatalogStore } = requireModule('stores/catalog.js')
const api = requireModule('api.js')
const store = useCatalogStore()
const before = api.stats.requests
const [a, b] = await Promise.all([store.load(), store.load()])
expect(api.stats.requests - before).toBe(1)
expect(a).toHaveLength(3)
expect(b).toHaveLength(3)`,
        },
        {
          name: 'a later call starts a fresh request',
          code: `await wait(250)
const { useCatalogStore } = requireModule('stores/catalog.js')
const api = requireModule('api.js')
const store = useCatalogStore()
await store.load()
await store.load()
expect(api.stats.requests).toBe(3)`,
        },
      ],
      hints: [
        'Keep the running promise in a plain variable inside the setup function: `let inFlight = null`.',
        'If `inFlight` is set, return it. Otherwise assign the request chain to it and clear it in `.finally()`.',
      ],
      answer: 'Store the in-flight promise; return it while it exists; clear it in `finally` so the next call starts fresh.',
      solution: {
        files: {
          'main.js': mainJs,
          'api.js': catalogApi,
          'stores/catalog.js': catalogStoreSolution,
          'App.vue': catalogApp,
        },
      },
      explanation: 'Every caller awaits the same promise, so there is one request and one result. Clearing the handle in `finally` (on success or failure) ensures later calls aren\'t stuck with an old result or error. The handle is a plain variable, not state — it is never rendered or persisted.',
      whyAsked: 'Request deduplication is a common performance and correctness problem; it tests promise fluency.',
      mistakes: ['Using a boolean flag and returning `undefined` to the second caller.', 'Never clearing the cached promise, so errors stick forever.', 'Making the promise a ref and returning it as state.'],
      followUps: ['How would you add a time-based cache on top?', 'What should happen if the shared request fails?'],
      modelAnswer: 'I keep a reference to the running promise in a local variable inside the store. If `load()` is called while it is set, I return the same promise, so every caller gets the same result from one request. The chain sets the products and status, and a `finally` clears the reference so the next call after completion — success or failure — makes a fresh request. It is deliberately not a ref, because it is not state anyone renders.',
    },
  ],

  takeaways: [
    'Async actions own shared loading, error and data state; components display it.',
    'Prefer one `status` field; set loading and clear errors before the first `await`, and reset on every path.',
    'Decide whether each action stores errors, re-throws them, or both — never swallow silently.',
    'Optimistic updates = snapshot, update now, request, roll back on failure — for small, reversible changes.',
    'Guard against stale responses (latest request wins / abort) and dedupe in-flight requests.',
    'An auth store drives the UI; the server must authorise every request.',
  ],
}
