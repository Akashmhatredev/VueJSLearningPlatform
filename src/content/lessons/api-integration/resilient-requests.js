// Lesson: Retries, caching, dedupe & polling.
// api.js is a pretend server with a reactive call counter and a switch that makes the
// next N calls fail with 503 — so retries, dedupe and caching are all measurable.

const userApi = `// api.js — a pretend user API (simplified: in memory, no network).
import { reactive } from 'vue'

const USERS = {
  1: { id: 1, name: 'Ada Lovelace', team: 'Platform' },
  2: { id: 2, name: 'Grace Hopper', team: 'Compilers' },
}

export const server = { failTimes: 0, delay: 200 } // failTimes: next N calls answer 503
export const stats = reactive({ calls: 0 })         // reactive so the page can show it

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function getUser(id) {
  stats.calls++
  const fail = server.failTimes > 0
  if (fail) server.failTimes--
  console.log('→ GET /api/users/' + id + (fail ? '  (will answer 503)' : ''))
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) return reject(new HttpError(503, 'Service unavailable, try again'))
      const user = USERS[id]
      if (!user) return reject(new HttpError(404, 'User ' + id + ' not found'))
      resolve({ ...user })
    }, server.delay)
  })
}`

const naiveHttp = `// http.js — the layer between components and the API.
// Right now it adds nothing: every call goes straight to the network.
import { getUser } from './api.js'

export function loadUser(id) {
  return getUser(id)
}`

const finishedHttp = `// http.js — retries, dedupe and a small TTL cache in front of the API.
// Simplified: production code would also cap the cache size and add jitter.
import { getUser } from './api.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Network errors (no status), 5xx and 429 are usually temporary; 4xx are not.
function isTransient(err) {
  return !err.status || err.status >= 500 || err.status === 429
}

export async function withRetry(fn, { retries = 2, baseDelay = 100 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (!isTransient(err) || attempt >= retries) throw err
      await sleep(baseDelay * 2 ** attempt) // 100 ms, 200 ms, …
    }
  }
}

const TTL = 5000
const cache = new Map()    // id → { value, expires }
const inFlight = new Map() // id → Promise

export function loadUser(id) {
  const hit = cache.get(id)
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value)
  if (inFlight.has(id)) return inFlight.get(id) // share the request already running

  const promise = withRetry(() => getUser(id))
    .then((user) => {
      cache.set(id, { value: user, expires: Date.now() + TTL })
      return user
    })
    .finally(() => inFlight.delete(id))

  inFlight.set(id, promise)
  return promise
}

export function invalidateUser(id) {
  cache.delete(id) // call after a mutation so the next read is fresh
}`

const userCard = `<script setup>
import { ref, onMounted } from 'vue'
import { loadUser } from './http.js'

const props = defineProps({ userId: Number, label: String })
const user = ref(null)
const error = ref('')

onMounted(async () => {
  try {
    user.value = await loadUser(props.userId)
  } catch (e) {
    error.value = e.message
  }
})
</script>

<template>
  <article class="card">
    <small>{{ label }}</small>
    <p v-if="user" class="name">{{ user.name }}</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else class="loading">Loading…</p>
  </article>
</template>`

const pageApp = `<script setup>
import { ref } from 'vue'
import UserCard from './UserCard.vue'
import { server, stats } from './api.js'

const shown = ref(false)
const showMissing = ref(false)
const generation = ref(0) // changing the key re-mounts the cards

function loadPage() {
  shown.value = true
  generation.value++
}
</script>

<template>
  <div class="toolbar">
    <button class="load" @click="loadPage">Load page</button>
    <button class="refresh" @click="generation++">Re-mount cards</button>
    <button class="load-missing" @click="showMissing = true">Show user #99</button>
    <button class="flaky" @click="server.failTimes = 2">Make next 2 calls fail</button>
  </div>
  <p class="calls">API calls so far: {{ stats.calls }}</p>

  <div v-if="shown" :key="generation" class="page">
    <UserCard :user-id="1" label="Header avatar" />
    <UserCard :user-id="1" label="Sidebar" />
    <UserCard :user-id="1" label="Comment author" />
  </div>
  <div v-if="showMissing" class="missing">
    <UserCard :user-id="99" label="Unknown user" />
  </div>
</template>`

const retryApi = `// api.js — a flaky stats endpoint: fails the first two calls with 503.
export const stats = { calls: 0 }

export function getStats() {
  stats.calls++
  const attempt = stats.calls
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (attempt <= 2) {
        const err = new Error('Service unavailable')
        err.status = 503
        return reject(err)
      }
      resolve({ visitors: 1342 })
    }, 50)
  })
}`

const retryApp = `<script setup>
import { ref } from 'vue'
import { retry } from './retry.js'
import { getStats } from './api.js'

const result = ref(null)
const error = ref('')

async function load() {
  error.value = ''
  try {
    result.value = await retry(getStats, { retries: 3, baseDelay: 50 })
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <button class="load" @click="load">Load stats</button>
  <p v-if="result" class="result">{{ result.visitors }} visitors</p>
  <p v-if="error" class="error">{{ error }}</p>
</template>`

const retryStarter = `// retry.js
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// TODO: network errors (no status), 5xx and 429 are worth retrying; other 4xx are not
export function isTransient(err) {
  return true
}

// TODO: call fn; on a transient error wait baseDelay * 2^attempt and try again,
// up to \`retries\` extra attempts. Re-throw the last error when giving up.
export async function retry(fn, { retries = 3, baseDelay = 100, shouldRetry = isTransient, sleep = defaultSleep } = {}) {
  return fn()
}`

const retrySolution = `// retry.js
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function isTransient(err) {
  const status = err && err.status
  return !status || status >= 500 || status === 429
}

export async function retry(fn, { retries = 3, baseDelay = 100, shouldRetry = isTransient, sleep = defaultSleep } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= retries || !shouldRetry(err)) throw err
      await sleep(baseDelay * 2 ** attempt) // 100, 200, 400, …
    }
  }
}`

const likeApi = `// api.js — pretend "like" endpoint. Set server.failNext = true to make the next call fail.
export const server = { failNext: false, likes: 12 }

export function setLiked(postId, liked) {
  const fail = server.failNext
  server.failNext = false
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) return reject(new Error('Network error'))
      server.likes += liked ? 1 : -1
      resolve({ liked, likes: server.likes })
    }, 300)
  })
}`

const likeStarter = `<script setup>
import { ref } from 'vue'
import { setLiked } from './api.js'

const liked = ref(false)
const likes = ref(12)
const error = ref('')
const saving = ref(false)

async function toggle() {
  error.value = ''
  saving.value = true
  try {
    const res = await setLiked(42, !liked.value)
    liked.value = res.liked
    likes.value = res.likes
  } catch (e) {
    error.value = "Couldn't save your like."
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <button class="like" :aria-pressed="liked" :disabled="saving" @click="toggle">
    {{ liked ? '♥' : '♡' }} <span class="count">{{ likes }}</span>
  </button>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
</template>`

const likeSolution = `<script setup>
import { ref } from 'vue'
import { setLiked } from './api.js'

const liked = ref(false)
const likes = ref(12)
const error = ref('')

async function toggle() {
  error.value = ''
  // 1. remember the old state, 2. update the UI immediately
  const before = { liked: liked.value, likes: likes.value }
  liked.value = !before.liked
  likes.value = before.likes + (liked.value ? 1 : -1)

  try {
    // 3. tell the server
    await setLiked(42, liked.value)
  } catch (e) {
    // 4. it failed: put things back and say so
    liked.value = before.liked
    likes.value = before.likes
    error.value = "Couldn't save your like."
  }
}
</script>

<template>
  <button class="like" :aria-pressed="liked" @click="toggle">
    {{ liked ? '♥' : '♡' }} <span class="count">{{ likes }}</span>
  </button>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
</template>`

const dedupeApi = `// api.js — pretend endpoint that counts calls.
export const stats = { calls: 0 }

export function getPrice(sku) {
  stats.calls++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (sku === 'broken') return reject(new Error('Unknown product'))
      resolve({ sku, price: 19.99 })
    }, 100)
  })
}`

const dedupeApp = `<script setup>
import { ref, onMounted } from 'vue'
import { dedupe } from './dedupe.js'
import { getPrice } from './api.js'

const getPriceOnce = dedupe(getPrice)
const prices = ref([])

onMounted(async () => {
  // three widgets asking for the same price at the same time
  prices.value = await Promise.all([getPriceOnce('tee'), getPriceOnce('tee'), getPriceOnce('tee')])
})
</script>

<template>
  <p v-for="(p, i) in prices" :key="i" class="price">{{ p.sku }}: {{ p.price }}</p>
</template>`

export default {
  id: 'resilient-requests',
  title: 'Retries, caching, dedupe & polling',
  summary: 'Make requests survive flaky networks and avoid wasted work: retry the right failures with backoff, share and cache results, update optimistically and poll politely.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['cancellation-race-conditions', 'async-ui-states', 'fetching-data'],
  related: ['realtime-websockets', 'pinia-async-patterns', 'service-layers', 'api-production', 'composable-recipes', 'runtime-performance'],
  tags: ['retry', 'exponential backoff', 'jitter', 'idempotency', 'cache', 'ttl', 'stale-while-revalidate', 'dedupe', 'optimistic update', 'polling'],
  apis: [
    { name: 'withRetry(fn, { retries, baseDelay })', summary: 'Pattern: re-run a request on transient failures, waiting longer each time.' },
    { name: 'in-flight Map', summary: 'Pattern: share one pending promise between callers asking for the same thing.' },
    { name: 'TTL cache', summary: 'Pattern: reuse a stored result until it is older than a time-to-live.' },
    { name: 'Retry-After', summary: 'HTTP response header (seconds or a date) telling clients when to try again, often sent with 429 or 503.' },
    { name: 'document.visibilityState', summary: 'Browser API: `\'hidden\'` when the tab is in the background — a good time to pause polling.' },
  ],
  docs: [
    { label: 'Vue Guide — Composables', url: 'https://vuejs.org/guide/reusability/composables.html' },
    { label: 'Pinia — Actions (async)', url: 'https://pinia.vuejs.org/core-concepts/actions.html' },
    { label: 'MDN — HTTP caching', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching' },
    { label: 'MDN — Retry-After header', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Retry-After' },
    { label: 'MDN — Page Visibility API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API' },
  ],

  intro: `
Real networks are messy. Requests fail for a second and then work again. The same data gets requested by five components at once. Users click "like" and expect the heart to turn red *now*, not in 400 ms. Dashboards need fresh numbers every minute.

This lesson is a toolkit of small, well-known patterns that sit between your components and your API:

- **retry** temporary failures, waiting a bit longer each time (**backoff**);
- **dedupe** identical requests that are already running;
- **cache** results for a while instead of asking again;
- update the UI **optimistically** and roll back if the server says no;
- **poll** for changes without hammering the server.

Each one is a few lines of plain JavaScript. The hard part is knowing *when* to use them — and when not to.
`,

  why: `
Without these patterns, apps feel fragile and wasteful:

- one dropped packet shows a scary error, though trying again a moment later would have worked;
- a page with an avatar in the header, the sidebar and three comments fires **five identical requests** for the same user;
- going back to a page you just left shows a spinner again for data you already had;
- a like button that waits for the server feels sluggish;
- a poller started with \`setInterval\` keeps running after you leave the page, stacking requests on a slow connection.

But resilience can also hurt. Retrying a **payment** blindly can charge someone twice. Retrying a \`400 Bad Request\` just repeats the same mistake. A thousand clients retrying at exactly the same moment can knock a recovering server over again. So each pattern comes with rules.
`,

  eli15: `
Imagine phoning a pizza place.

- **Retry with backoff:** the line is busy. You don't redial 100 times a second — you wait 1 second, then 2, then 4. If they say "we don't deliver to your street", you stop: calling again won't change the answer.
- **Dedupe:** your three roommates all want to ask what pizzas are available. One person calls and tells everyone.
- **Cache:** you wrote the menu on the fridge. For the rest of the evening you read the fridge instead of calling again — but tomorrow the menu might have changed, so it "expires".
- **Optimistic update:** you tell your roommates "pizza's ordered!" while still on the phone, because it almost always works. If the order fails, you correct yourself.
- **Polling:** every 10 minutes you check the delivery tracker — not every second.
`,

  analogy: {
    title: 'The office assistant',
    body: `
A good assistant shields their boss from chaos. When a supplier's phone is busy, they try again later, waiting longer each time. When three people ask for the same report, they request it once and hand out copies. They keep recent answers in a notebook and only re-check when the note is old. They pencil a meeting into the diary immediately and rub it out if it's declined. And they check the inbox on a sensible schedule, not every ten seconds.

Your \`http.js\` layer is that assistant. Components ask simple questions ("give me user 1"); the assistant decides whether to use the notebook, join a request already in progress, or call — and how to retry.
`,
    mapping: [
      ['trying again later, waiting longer each time', 'retry with exponential backoff'],
      ['"we don\'t deliver there" — stop calling', 'don\'t retry 4xx errors'],
      ['one request, copies for everyone', 'dedupe in-flight requests'],
      ['the notebook with dated notes', 'a cache with a TTL'],
      ['pencilling it in, rubbing it out if declined', 'optimistic update with rollback'],
      ['checking the inbox on a schedule', 'polling with a setTimeout chain'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'What happens when a component asks for user 1',
    caption: 'Every request goes through the same checks, cheapest first: memory, then an in-flight request, then the network — with retries only for failures that might go away.',
    alt: 'A flow diagram. loadUser(1) first checks the cache: if a fresh entry exists it returns immediately. Otherwise it checks the in-flight map: if a request is already running it shares that promise. Otherwise it calls the network. If the call fails with a transient error (network, 5xx, 429) it waits with exponential backoff and retries; a 4xx error fails immediately. A successful response is stored in the cache with an expiry time.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'call', label: 'loadUser(1)', note: 'from any component', tone: 'paper', x: 80, y: 160 },
        { id: 'cache', label: 'fresh in cache?', note: 'age < TTL', tone: 'kraft', x: 240, y: 70 },
        { id: 'inflight', label: 'already in flight?', note: 'share the promise', tone: 'kraft', x: 240, y: 250 },
        { id: 'network', label: 'network', note: 'GET /api/users/1', tone: 'cobalt', x: 450, y: 250 },
        { id: 'retry', label: 'transient? → wait & retry', note: '100 ms, 200 ms, 400 ms…', tone: 'red', x: 650, y: 250 },
        { id: 'store', label: 'store in cache', note: 'expires = now + TTL', tone: 'acid', x: 450, y: 70 },
        { id: 'done', label: 'user', note: 'resolved', tone: 'acid', x: 650, y: 70 },
      ],
      edges: [
        { from: 'call', to: 'cache' },
        { id: 'hit', from: 'cache', to: 'done', label: 'hit: no request' },
        { from: 'cache', to: 'inflight', label: 'miss' },
        { id: 'share', from: 'inflight', to: 'done', label: 'yes: same promise', dashed: true },
        { from: 'inflight', to: 'network', label: 'no' },
        { from: 'network', to: 'retry', label: 'error' },
        { id: 'again', from: 'retry', to: 'network', label: 'after backoff', dashed: true },
        { from: 'network', to: 'store', label: '200' },
        { from: 'store', to: 'done' },
      ],
      steps: [
        { focus: ['call', 'cache'], edges: ['call->cache'], text: 'First, the cheapest possible answer: is there a cached copy that hasn\'t expired?' },
        { focus: ['cache', 'done'], edges: ['hit'], text: 'Cache hit: return immediately. No spinner, no request.' },
        { focus: ['inflight'], edges: ['cache->inflight', 'share'], text: 'Cache miss — but maybe another component asked a moment ago and the request is still running. If so, return **the same promise**: one request, many listeners.' },
        { focus: ['network'], edges: ['inflight->network'], text: 'Nobody has it: go to the network, and remember the promise in the in-flight map until it settles.' },
        { focus: ['retry', 'network'], edges: ['network->retry', 'again'], text: 'A network error, 5xx or 429 may be temporary: wait (longer each time) and retry, up to a limit. A 4xx like 404 is final — fail immediately.' },
        { focus: ['store', 'done'], edges: ['network->store', 'store->done'], text: 'Success: store the value with an expiry time so the next caller can reuse it, then resolve.' },
      ],
    },
  },

  syntax: [
    `
#### 1. Retry only what might succeed next time

- **Retry:** network errors (no response at all), \`502\`, \`503\`, \`504\`, \`429 Too Many Requests\` — usually temporary.
- **Don't retry:** \`400\`, \`401\`, \`403\`, \`404\`, \`422\` — the request itself is wrong; repeating it gives the same answer. (A \`401\` may need a token refresh instead — see [production errors](lesson:api-production).)
- **Be careful with non-idempotent requests** like \`POST /payments\` — see below.

Wait longer after each failure (**exponential backoff**), give up after a few attempts, and add some randomness (**jitter**) so thousands of clients don't retry at the same instant. If the server sends a \`Retry-After\` header, respect it.
`,
    {
      code: `const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function isTransient(err) {
  return !err.status || err.status >= 500 || err.status === 429
}

export async function withRetry(fn, { retries = 3, baseDelay = 200 } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (!isTransient(err) || attempt >= retries) throw err
      const backoff = baseDelay * 2 ** attempt          // 200, 400, 800…
      const jitter = Math.random() * backoff * 0.5      // spread clients out
      await sleep(backoff + jitter)
    }
  }
}`,
      lang: 'js',
      title: 'retry with exponential backoff + jitter',
    },
    `
#### 2. Idempotency: is it safe to send twice?

GET, PUT and DELETE are idempotent by definition, so retrying them is safe. POST usually isn't: if the first attempt reached the server but the response was lost, a retry can create a **second** order. APIs that need safe retries for POST commonly accept an **idempotency key** — a unique id the client generates once per user action and sends with every attempt, so the server can recognise duplicates. (Several payment APIs use an \`Idempotency-Key\` header; an IETF draft is standardising it.)
`,
    {
      code: `const key = crypto.randomUUID()   // once per user action, NOT per attempt

await withRetry(() =>
  fetch('/api/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ amount: 1999 }),
  }),
)`,
      lang: 'js',
      title: 'idempotency key (only if your API supports it)',
      static: true,
    },
    `
#### 3. Dedupe: share the request that's already running
`,
    {
      code: `const inFlight = new Map()

export function loadUser(id) {
  if (inFlight.has(id)) return inFlight.get(id)
  const promise = getUser(id).finally(() => inFlight.delete(id))
  inFlight.set(id, promise)
  return promise
}`,
      lang: 'js',
      title: 'in-flight dedupe',
    },
    `
\`finally\` removes the entry whether the request succeeded or failed — otherwise a failed request would be "remembered" forever.

#### 4. Cache with a time-to-live

A **cache** stores results so you don't ask again. A **TTL** (time-to-live) says how long a stored result counts as fresh. **Invalidate** (delete) entries when you change the data, so you never show your own stale write.
`,
    {
      code: `const cache = new Map() // id → { value, expires }

export async function loadUserCached(id, ttl = 30_000) {
  const hit = cache.get(id)
  if (hit && hit.expires > Date.now()) return hit.value
  const value = await loadUser(id)                  // deduped + retried underneath
  cache.set(id, { value, expires: Date.now() + ttl })
  return value
}

export async function renameUser(id, name) {
  await patchUser(id, { name })
  cache.delete(id) // invalidate after a mutation
}`,
      lang: 'js',
      title: 'TTL cache + invalidation',
    },
    `
**Stale-while-revalidate** is a popular variation: show the cached value instantly (even if old), fetch a fresh one in the background, and swap it in when it arrives. Users see *something* immediately and fresh data a moment later.

#### 5. Optimistic updates

For actions that almost always succeed (likes, toggles, reordering), update the UI **first**, then tell the server; if it fails, **roll back** and say so. See also [async actions in Pinia](lesson:pinia-async-patterns).
`,
    {
      code: `async function toggleLike() {
  const before = { liked: liked.value, likes: likes.value }
  liked.value = !before.liked                         // 1. update immediately
  likes.value += liked.value ? 1 : -1
  try {
    await api.setLiked(postId, liked.value)           // 2. confirm with the server
  } catch {
    liked.value = before.liked                        // 3. roll back on failure
    likes.value = before.likes
    error.value = "Couldn't save your like."
  }
}`,
      lang: 'js',
      title: 'optimistic update with rollback',
    },
    `
#### 6. Polling politely

**Polling** means asking the server "anything new?" on a schedule. Use a \`setTimeout\` **chain** — schedule the next poll only after the current one finishes — so slow responses never overlap. Stop on unmount, back off after errors, and consider pausing while the tab is hidden.
`,
    {
      code: `let timer = null
let stopped = false

async function poll() {
  try {
    orders.value = await getOrders()
  } catch {
    // keep the old data; maybe show a small "couldn't refresh" hint
  }
  if (!stopped) timer = setTimeout(poll, 10_000) // next poll only after this one finished
}

onMounted(poll)
onUnmounted(() => {
  stopped = true
  clearTimeout(timer)
})

// Optional: skip work while the tab is in the background
// if (document.visibilityState === 'hidden') { … } and listen for 'visibilitychange'`,
      lang: 'js',
      title: 'a setTimeout polling loop',
    },
    {
      callout: 'note',
      title: 'Libraries do this for you',
      text: 'Data-fetching libraries such as TanStack Query (Vue Query) or SWRV bundle caching, dedupe, retries, background refetching and polling behind one API. They are third-party packages, not part of Vue. Knowing the patterns underneath helps you configure them well — and debug them.',
    },
  ],

  walkthrough: {
    title: 'http.js — the finished resilience layer',
    lang: 'js',
    code: finishedHttp,
    intro: 'This is the playground\'s `http.js` after all four experiments. Components keep calling `loadUser(id)`; everything clever happens here.',
    steps: [
      { lines: [1, 3], text: 'One module sits between components and the API. It\'s labelled simplified: production code would also cap the cache size and add jitter to the backoff.' },
      { lines: [7, 10], text: '`isTransient` decides what\'s worth retrying: no status means the request never got an answer (network error); 5xx means the server failed; 429 means "slow down". A 404 is final.' },
      { lines: [12, 21], text: 'The retry loop. Each failure waits `baseDelay * 2 ** attempt` — 100 ms, then 200 ms — before trying again. After `retries` extra attempts, or for a non-transient error, the error is re-thrown to the caller.' },
      { lines: [23, 25], text: 'Two Maps: one for finished results with an expiry time, one for promises that are still running.' },
      { lines: [27, 30], text: 'Cheapest answer first: a fresh cache entry returns immediately; a request already in flight is shared instead of repeated.' },
      { lines: [32, 37], text: 'Otherwise: start a retried request, cache the result on success, and **always** remove the in-flight entry in `finally` — even on failure, so the next caller can try again.' },
      { lines: [39, 40], text: 'Remember the promise *before* returning, so a caller arriving one millisecond later finds it.' },
      { lines: [43, 45], text: 'Invalidation: after changing a user, delete their cache entry so the next read fetches the truth.' },
    ],
  },

  playground: {
    title: 'Profile cards',
    objective: 'Add dedupe, retries (but not for 404s) and a TTL cache to `http.js`, watching the API call counter as you go.',
    files: { 'App.vue': pageApp, 'UserCard.vue': userCard, 'http.js': naiveHttp, 'api.js': userApi },
    expected: 'Click **Load page**: three cards for the same user appear and the counter says **3 API calls**. **Make next 2 calls fail**, then load again: errors. **Re-mount cards** fires three more calls for data you already have.',
    experiments: [
      {
        id: 'dedupe',
        task: 'Three cards ask for user 1 at the same moment, so three identical requests go out. In `http.js`, share the in-flight promise: if a request for that id is already running, return the same promise. The counter should show **1** call.',
        hint: '`const inFlight = new Map()`. In `loadUser`: if `inFlight.has(id)` return `inFlight.get(id)`; otherwise create `getUser(id).finally(() => inFlight.delete(id))`, store it, return it.',
        tests: [
          {
            name: 'three cards, one API call',
            code: `await click('.load')
await wait(400)
expect(requireModule('api.js').stats.calls).toBe(1)
expect(findAll('.name').length).toBe(3)`,
          },
        ],
        explain: 'Promises can have any number of listeners. Every card awaits the same promise and receives the same user. `finally` clears the entry so a later request — or a retry after a failure — goes to the network again.',
      },
      {
        id: 'retry',
        task: 'Click **Make next 2 calls fail**, then **Load page**: the server answers 503 twice and the cards show errors. Add a retry with exponential backoff (e.g. up to 2 retries, waiting 100 ms then 200 ms) so the cards recover on their own.',
        hint: 'Write `async function withRetry(fn, { retries = 2, baseDelay = 100 })` with a `for` loop around `try { return await fn() } catch (err) { if (attempt >= retries) throw err; await sleep(baseDelay * 2 ** attempt) }`, and use `withRetry(() => getUser(id))`.',
        tests: [
          {
            name: 'two 503s are retried and the cards load',
            code: `requireModule('api.js').server.failTimes = 2
await click('.load')
await wait(1300)
expect(exists('.error')).toBe(false)
expect(findAll('.name').length).toBe(3)`,
          },
        ],
        explain: 'A 503 says "not right now". Waiting and trying again turns a temporary hiccup into a slightly slower success. Doubling the wait each time gives a struggling server more room to recover.',
      },
      {
        id: 'no-retry-404',
        task: 'Click **Show user #99**. If your retry retries *everything*, the 404 is requested three times for nothing. Only retry **transient** errors — no status (network error), 5xx or 429 — so the 404 fails after **one** call while 503s are still retried.',
        hint: '`const isTransient = (err) => !err.status || err.status >= 500 || err.status === 429`, and in the catch: `if (!isTransient(err) || attempt >= retries) throw err`.',
        tests: [
          {
            name: '503 is retried, 404 is not',
            code: `const { server, stats } = requireModule('api.js')
server.failTimes = 1
await click('.load')
await wait(900)
expect(exists('.page .error')).toBe(false)
expect(findAll('.name').length).toBe(3)
const before = stats.calls
await click('.load-missing')
await wait(900)
expect(stats.calls - before).toBe(1)
expect(exists('.missing .error')).toBe(true)`,
          },
        ],
        explain: '"User 99 doesn\'t exist" will be just as true in 100 ms. Retrying non-transient errors wastes requests, delays the error message and, at scale, adds load for nothing.',
      },
      {
        id: 'cache',
        task: '**Re-mount cards** throws the cards away and creates new ones, which fetch user 1 again. Add a small cache with a TTL (say 5 seconds): a fresh cached user is returned without calling the API.',
        hint: '`const cache = new Map()` of `id → { value, expires }`. At the top of `loadUser`: `const hit = cache.get(id); if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value)`. When a request succeeds, `cache.set(id, { value: user, expires: Date.now() + 5000 })`.',
        tests: [
          {
            name: 're-mounting within the TTL makes no new calls',
            code: `const { stats } = requireModule('api.js')
await click('.load')
await wait(400)
const before = stats.calls
await click('.refresh')
await wait(400)
expect(stats.calls).toBe(before)
expect(findAll('.name').length).toBe(3)`,
          },
        ],
        explain: 'Dedupe only helps while a request is running; a cache helps *after* it finished. The TTL is the trade-off knob: longer means fewer requests but older data. Mutations should delete the affected entries.',
      },
    ],
    variants: [
      { id: 'finished', label: 'Finished http.js (retry + dedupe + cache)', files: { 'App.vue': pageApp, 'UserCard.vue': userCard, 'http.js': finishedHttp, 'api.js': userApi } },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Naive vs resilient data layer',
    caption: 'Same component code on top; very different behaviour on a busy page and a flaky network.',
    alt: 'Side-by-side code. Left: loadUser simply calls getUser every time. Right: loadUser checks a TTL cache, then an in-flight map, then calls getUser wrapped in a retry that only retries transient errors, and caches the result.',
    props: {
      left: {
        label: 'Naive',
        lang: 'js',
        code: `export function loadUser(id) {
  return getUser(id)
}

// 3 cards     → 3 requests
// re-mount    → 3 more requests
// one 503     → error on screen
// 404         → error on screen (good)`,
      },
      right: {
        label: 'Resilient',
        lang: 'js',
        code: `export function loadUser(id) {
  const hit = cache.get(id)
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value)
  if (inFlight.has(id)) return inFlight.get(id)
  const p = withRetry(() => getUser(id))   // transient errors only
    .then((u) => (cache.set(id, { value: u, expires: Date.now() + TTL }), u))
    .finally(() => inFlight.delete(id))
  inFlight.set(id, p)
  return p
}
// 3 cards → 1 request · re-mount → 0 · 503 → retried · 404 → fails fast`,
      },
      points: [
        'Components don\'t change at all — resilience lives in one layer.',
        'Dedupe merges simultaneous requests; the cache serves later ones.',
        'Retries are limited to errors that might go away.',
        'Clearing the in-flight entry in `finally` means failures are not remembered.',
      ],
    },
  },

  internals: {
    beginner: `
All of these patterns rely on one fact: a **promise is a value you can keep and share**. Dedupe keeps the promise of a running request in a Map and hands it to every caller. A cache keeps the *result* with a timestamp. A retry is just a loop that calls the function again after a pause. None of this involves Vue — which is why it belongs in a plain JavaScript module that components (or a Pinia store) call.
`,
    technical: [
      `
**Exponential backoff maths.** With \`baseDelay = 100\` the waits are 100, 200, 400, 800 ms… The total worst-case wait before giving up is the sum of those, so a high \`retries\` count can leave users staring at a spinner for a long time — keep it small for interactive requests and show progress.

**Why jitter.** If a server goes down and comes back, every client that failed at the same moment retries at the same moments (100 ms, 200 ms…), producing synchronized spikes — the "thundering herd". Adding a random component spreads the retries out. Common variants are "full jitter" (\`random(0, backoff)\`) and "equal jitter" (\`backoff/2 + random(0, backoff/2)\`).

**Retry-After.** For 429 and 503, servers may send \`Retry-After\` as a number of seconds or an HTTP date. Prefer it over your own backoff when present.

**Cache keys.** Key by everything that changes the answer — the URL *and* relevant parameters, and the user if responses are per-user. A cache must be cleared on logout, or the next user of a shared computer may see someone else's data.

**HTTP caching is a separate layer.** Browsers cache responses according to headers like \`Cache-Control\` and \`ETag\`. Your in-memory cache sits above that and is about avoiding work in *this page session*. They can complement each other.

**Optimistic updates and ordering.** If the user toggles "like" three times quickly, three requests are in flight; a rollback for the second could overwrite the third. Production code either serialises requests per item, ignores outdated responses (as in [race conditions](lesson:cancellation-race-conditions)) or reconciles with the server's final state.
`,
      {
        code: `// Polling with setInterval can overlap: if a request takes longer than the interval,
// the next one starts before the previous finished.
setInterval(load, 1000)          // t=0 start A, t=1000 start B (A still running!)

// A setTimeout chain can't overlap: the next poll is scheduled after this one ends.
async function loop() {
  await load()
  timer = setTimeout(loop, 1000)
}`,
        lang: 'js',
        title: 'why a setTimeout chain for polling',
      },
    ],
    production: `
- **Retry budget:** few attempts with backoff + jitter for interactive requests; respect \`Retry-After\`; never retry non-idempotent requests unless the API supports idempotency keys.
- **Combine with timeouts and cancellation** — a retry loop must stop when the component unmounts or the user navigates away ([cancellation](lesson:cancellation-race-conditions)).
- **Bound your caches** (size limit or LRU) and key them carefully; clear per-user caches on logout.
- **Invalidate on writes.** After a mutation, delete or update affected entries (or refetch) — the most common caching bug is showing your own stale data.
- **Optimistic updates** for low-risk, high-frequency actions (likes, toggles, reordering); pessimistic ("wait for the server") for money, permissions and anything hard to undo.
- **Polling:** pick intervals based on how fresh the data must be, pause when the tab is hidden, back off on errors, and consider push ([WebSockets](lesson:realtime-websockets)) when you need updates within seconds.
- **Observe it:** log retries and give-ups so you notice when a dependency becomes flaky, instead of silently retrying forever.
`,
  },

  mistakes: [
    {
      title: 'Retrying every error',
      wrong: { code: `catch (err) {\n  if (attempt < 3) return retry() // also retries 400, 401, 404…\n}`, lang: 'js' },
      right: { code: `catch (err) {\n  const transient = !err.status || err.status >= 500 || err.status === 429\n  if (transient && attempt < 3) return retry()\n  throw err\n}`, lang: 'js' },
      explanation: 'Client errors won\'t change on retry. Retrying them delays the error message and wastes requests.',
    },
    {
      title: 'Retrying immediately in a tight loop',
      wrong: { code: `for (let i = 0; i < 5; i++) {\n  try { return await fn() } catch {}\n}`, lang: 'js' },
      right: { code: `for (let attempt = 0; ; attempt++) {\n  try { return await fn() } catch (err) {\n    if (attempt >= 4) throw err\n    await sleep(200 * 2 ** attempt + Math.random() * 100)\n  }\n}`, lang: 'js' },
      explanation: 'Instant retries hit a struggling server five times in a row and usually fail for the same reason. Back off, add jitter, and re-throw the final error instead of swallowing it.',
    },
    {
      title: 'Dedupe map that never forgets failures',
      wrong: { code: `const p = getUser(id).then((u) => {\n  inFlight.delete(id)\n  return u\n})\ninFlight.set(id, p) // a rejected p stays in the map forever`, lang: 'js' },
      right: { code: `const p = getUser(id).finally(() => inFlight.delete(id))\ninFlight.set(id, p)`, lang: 'js' },
      explanation: 'If cleanup only runs on success, one failure poisons the key: every future call gets the same rejected promise. Clean up in `finally`.',
    },
    {
      title: 'Caching without invalidation',
      wrong: { code: `await patchUser(1, { name: 'Ada L.' })\n// later\nconst user = await loadUserCached(1) // still the old name for 30 s`, lang: 'js' },
      right: { code: `await patchUser(1, { name: 'Ada L.' })\ncache.delete(1) // or cache.set(1, { value: updated, expires: … })`, lang: 'js' },
      explanation: 'A cache is a promise that the stored value is still good enough. After you change the data yourself, that promise is broken — update or delete the entry.',
    },
    {
      title: 'Polling with setInterval and no cleanup',
      wrong: { code: `onMounted(() => {\n  setInterval(load, 5000)\n})`, lang: 'js' },
      right: { code: `let timer\nlet stopped = false\nasync function loop() {\n  await load()\n  if (!stopped) timer = setTimeout(loop, 5000)\n}\nonMounted(loop)\nonUnmounted(() => { stopped = true; clearTimeout(timer) })`, lang: 'js' },
      explanation: 'An uncleared interval keeps polling after the component is gone (and every remount adds another). `setInterval` can also overlap slow requests; a timeout chain cannot.',
    },
  ],

  debugging: [
    {
      symptom: 'The Network tab shows the same request several times at once.',
      cause: 'Several components request the same resource simultaneously with no dedupe.',
      fix: 'Share in-flight promises in your data layer, or lift the request into a parent / store.',
    },
    {
      symptom: 'After one failure, a resource never loads again until a full page reload.',
      cause: 'A rejected promise was cached (dedupe or cache entry not removed on failure).',
      fix: 'Remove in-flight entries in `finally` and only cache successful results.',
    },
    {
      symptom: 'Users see their old data right after saving a change.',
      cause: 'The cache wasn\'t invalidated after the mutation.',
      fix: 'Delete or update the cache entry after a successful write (or refetch).',
    },
    {
      symptom: 'Requests keep firing after leaving the page; they multiply with each visit.',
      cause: 'A polling interval or retry loop isn\'t stopped on unmount.',
      fix: 'Clear timers in `onUnmounted`, use a stop flag for timeout chains, and abort pending requests.',
    },
    {
      symptom: 'A customer was charged twice after a timeout.',
      cause: 'A non-idempotent POST was retried after the first attempt actually succeeded.',
      fix: 'Don\'t auto-retry POSTs unless the API supports idempotency keys; send one key per user action.',
    },
  ],

  bestPractices: [
    'Retry only transient failures (network, 5xx, 429), with exponential backoff, jitter and a small limit.',
    'Respect `Retry-After` when the server sends it.',
    'Never blindly retry non-idempotent requests; use idempotency keys if the API offers them.',
    'Dedupe identical in-flight requests and clean up in `finally`.',
    'Cache with a TTL, key by everything that affects the answer, invalidate after writes and on logout.',
    'Use optimistic updates for low-risk actions, always with rollback and a visible error.',
    'Poll with a `setTimeout` chain, stop on unmount, back off on errors and pause in background tabs.',
  ],

  useCases: [
    'A dashboard that survives a flaky office Wi-Fi without flashing errors.',
    'An avatar/user-info component used dozens of times on one page.',
    'Back/forward navigation that shows recently loaded pages instantly.',
    'Like, star, follow and checkbox toggles that feel instant.',
    'A job-status page that polls until the export is ready.',
  ],

  whenToUse: {
    use: [
      'Retries for idempotent reads and for writes protected by idempotency keys.',
      'Dedupe whenever multiple components can ask for the same resource at once.',
      'A TTL cache for data that changes rarely relative to how often it is viewed (profiles, settings, reference lists).',
      'Optimistic updates for frequent, low-risk, easily reversible actions.',
      'Polling when updates every few seconds or minutes are good enough and the server has no push channel.',
    ],
    avoid: [
      'Retrying 4xx errors or payments without idempotency keys.',
      'Long retry chains on interactive requests without feedback.',
      'Caching sensitive, per-user data across logins.',
      'Optimistic updates for irreversible or high-stakes actions (payments, deletions without undo).',
      'Polling every second for data that must be real-time — use [WebSockets](lesson:realtime-websockets).',
    ],
  },

  comparison: {
    title: 'Which pattern solves which problem?',
    headers: ['', 'Retry + backoff', 'Dedupe', 'TTL cache', 'Optimistic update', 'Polling'],
    rows: [
      ['Problem', 'temporary failures', 'simultaneous duplicate requests', 'repeated requests over time', 'UI waiting on the server', 'data changing on the server'],
      ['Saves requests?', 'no (adds some)', 'yes', 'yes', 'no', 'no (adds them)'],
      ['Main risk', 'duplicates for non-idempotent calls', 'caching a failure', 'stale data', 'showing something that failed', 'overload, leaks'],
      ['Key rule', 'transient errors only', 'clean up in finally', 'invalidate on write', 'always roll back', 'stop on unmount'],
    ],
    note: 'They stack: a cached, deduped, retried request is normal. Libraries like TanStack Query package all five.',
  },

  quiz: [
    {
      id: 'resilient-requests-q1',
      type: 'mcq',
      prompt: 'Which response is the best candidate for an automatic retry?',
      options: [
        { text: '`503 Service Unavailable`' },
        { text: '`400 Bad Request`', why: 'The request itself is malformed; sending it again gives the same answer.' },
        { text: '`404 Not Found`', why: 'The resource doesn\'t exist; retrying won\'t create it.' },
        { text: '`403 Forbidden`', why: 'The user isn\'t allowed; retrying won\'t change their permissions.' },
      ],
      answer: 0,
      explanation: '503 means the server is temporarily unable to handle the request — exactly the kind of failure that may succeed a moment later.',
    },
    {
      id: 'resilient-requests-q2',
      type: 'output',
      prompt: 'With `baseDelay = 200` and `retries = 3`, the request fails every time. What waits happen before the final error is thrown? (Ignore jitter.)',
      code: {
        lang: 'js',
        code: `for (let attempt = 0; ; attempt++) {
  try {
    return await fn()
  } catch (err) {
    if (attempt >= 3) throw err
    await sleep(200 * 2 ** attempt)
  }
}`,
      },
      options: ['200, 200, 200', '200, 400, 800', '200, 400, 800, 1600', '0, 200, 400'],
      answer: 1,
      explanation: 'Attempts 0, 1 and 2 fail and wait 200·2⁰, 200·2¹, 200·2² = 200, 400, 800 ms. Attempt 3 fails and throws (no wait). Four calls in total.',
    },
    {
      id: 'resilient-requests-q3',
      type: 'bug',
      prompt: 'After a single network error, user 7 can never be loaded again — every call rejects instantly. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `const inFlight = new Map()

export function loadUser(id) {
  if (inFlight.has(id)) return inFlight.get(id)
  const promise = getUser(id).then((user) => {
    inFlight.delete(id)
    return user
  })
  inFlight.set(id, promise)
  return promise
}`,
      },
      answerLine: 5,
      explanation: 'The entry is only removed in `.then`, which doesn\'t run on rejection. The rejected promise stays in the map and is returned forever. Use `.finally(() => inFlight.delete(id))`.',
    },
    {
      id: 'resilient-requests-q4',
      type: 'fill',
      prompt: 'Complete the dedupe helper.',
      code: {
        lang: 'js',
        code: `if (inFlight.has(key)) return inFlight.___(key)
const promise = fn().___(() => inFlight.delete(key))
inFlight.set(key, promise)
return promise`,
      },
      answer: [['get'], ['finally']],
      explanation: 'Return the existing promise with `get`; clean up in `finally` so both success and failure release the key.',
    },
    {
      id: 'resilient-requests-q5',
      type: 'mcq',
      prompt: 'A dashboard polls `/api/stats` with `setInterval(load, 2000)`. On a slow connection each request takes 5 seconds. What happens?',
      options: [
        { text: 'Requests overlap and pile up; responses can also arrive out of order.' },
        { text: 'The browser waits for each request before starting the next.', why: '`setInterval` fires on schedule regardless of whether `load` finished.' },
        { text: 'Vue cancels the previous request automatically.', why: 'Vue knows nothing about your requests or timers.' },
        { text: 'Nothing unusual: the interval stretches to 5 seconds.', why: 'Intervals don\'t adapt to how long your callback\'s async work takes.' },
      ],
      answer: 0,
      explanation: 'A new request starts every 2 s while each takes 5 s, so two or three are always in flight. A `setTimeout` chain schedules the next poll only after the current one completes.',
    },
    {
      id: 'resilient-requests-q6',
      type: 'mcq',
      prompt: 'Select **all** good candidates for an optimistic update.',
      options: [
        { text: 'Starring a repository' },
        { text: 'Transferring money between bank accounts', why: 'High stakes and hard to undo: wait for the server\'s confirmation.' },
        { text: 'Ticking a todo item as done' },
        { text: 'Deleting an account permanently', why: 'Irreversible. Show progress and confirm after the server succeeds.' },
      ],
      answer: [0, 2],
      explanation: 'Optimistic UI fits frequent, low-risk, easily reversible actions that almost always succeed.',
    },
    {
      id: 'resilient-requests-q7',
      type: 'short',
      prompt: 'Why is it dangerous to automatically retry a `POST /orders` request after a timeout, and what makes it safe?',
      answer: 'A timeout doesn\'t tell you whether the server processed the request — the response may simply have been lost. POST isn\'t idempotent, so a retry can create a second order. It becomes safe when the API supports an idempotency key: the client generates one key per user action and sends it with every attempt, and the server returns the original result for repeats instead of creating a duplicate.',
    },
  ],

  exercises: [
    {
      id: 'retry-backoff',
      title: 'Retry with exponential backoff',
      difficulty: 'intermediate',
      prompt: `
Implement two functions in **retry.js**:

**\`isTransient(err)\`** returns \`true\` for errors worth retrying: no \`status\` at all (a network error), any status **≥ 500**, or **429**. Other statuses (400, 401, 404…) return \`false\`.

**\`retry(fn, options)\`** calls \`fn()\` and returns its result. When it throws:

- if the error is retryable (\`options.shouldRetry(err)\`, default \`isTransient\`) and fewer than \`retries\` retries were made, wait \`baseDelay * 2 ** attempt\` (100, 200, 400… with the defaults) using \`options.sleep(ms)\`, then call \`fn()\` again;
- otherwise re-throw the error.

Defaults: \`retries = 3\`, \`baseDelay = 100\`, \`shouldRetry = isTransient\`, \`sleep\` = a real timer. The tests pass a fake \`sleep\` that records the delays, so they run instantly — that's **dependency injection** making time testable. The app's **Load stats** button should also succeed (the server fails twice first).
`,
      files: { 'App.vue': retryApp, 'api.js': retryApi, 'retry.js': retryStarter },
      hints: [
        '`isTransient`: `const status = err && err.status; return !status || status >= 500 || status === 429`.',
        'Use `for (let attempt = 0; ; attempt++) { try { return await fn() } catch (err) { … } }`.',
        'In the catch: `if (attempt >= retries || !shouldRetry(err)) throw err`, then `await sleep(baseDelay * 2 ** attempt)`.',
      ],
      solution: {
        explanation: 'The loop counts attempts; the catch decides between "throw" and "wait, then loop". Taking `sleep` as an option costs nothing in production (it defaults to a real timer) and lets tests verify the exact backoff schedule without waiting.',
        files: { 'App.vue': retryApp, 'api.js': retryApi, 'retry.js': retrySolution },
      },
      tests: [
        {
          name: 'isTransient classifies errors',
          code: `const { isTransient } = requireModule('retry.js')
expect(isTransient(new TypeError('Failed to fetch'))).toBe(true)
expect(isTransient({ status: 503 })).toBe(true)
expect(isTransient({ status: 429 })).toBe(true)
expect(isTransient({ status: 404 })).toBe(false)
expect(isTransient({ status: 400 })).toBe(false)`,
        },
        {
          name: 'recovers after two failures with 100 ms and 200 ms waits',
          code: `const { retry } = requireModule('retry.js')
const delays = []
const sleep = (ms) => { delays.push(ms); return Promise.resolve() }
let calls = 0
const fn = () => { calls++; return calls < 3 ? Promise.reject({ status: 503 }) : Promise.resolve('ok') }
expect(await retry(fn, { sleep })).toBe('ok')
expect(calls).toBe(3)
expect(delays).toEqual([100, 200])`,
        },
        {
          name: 'gives up after the configured retries and re-throws',
          code: `const { retry } = requireModule('retry.js')
const delays = []
const sleep = (ms) => { delays.push(ms); return Promise.resolve() }
let calls = 0
const fn = () => { calls++; return Promise.reject({ status: 500, message: 'down' }) }
let caught = null
try { await retry(fn, { retries: 3, sleep }) } catch (e) { caught = e }
expect(caught.message).toBe('down')
expect(calls).toBe(4)
expect(delays).toEqual([100, 200, 400])`,
        },
        {
          name: 'does not retry a 404',
          code: `const { retry } = requireModule('retry.js')
let calls = 0
const fn = () => { calls++; return Promise.reject({ status: 404 }) }
let caught = null
try { await retry(fn, { sleep: () => Promise.resolve() }) } catch (e) { caught = e }
expect(caught.status).toBe(404)
expect(calls).toBe(1)`,
        },
        {
          name: 'the app recovers from the flaky endpoint',
          code: `await click('.load')
await wait(500)
expect(text('.result')).toBe('1342 visitors')
expect(exists('.error')).toBe(false)`,
        },
      ],
    },
    {
      id: 'optimistic-like',
      title: 'An optimistic like button with rollback',
      difficulty: 'intermediate',
      prompt: `
The like button waits for the server before changing — it feels slow. Make it **optimistic**:

- clicking \`button.like\` updates \`.count\` and \`aria-pressed\` **immediately** (before the server answers);
- then it calls \`setLiked(42, liked)\`;
- if the call **fails**, roll back to the previous \`liked\`/count and show \`.error\` (a \`role="alert"\` message is already in the template);
- if it succeeds, keep the new state and show no error.

Tests make the next call fail with \`server.failNext = true\` in **api.js**.
`,
      files: { 'App.vue': likeStarter, 'api.js': likeApi },
      hints: [
        'Save the old state first: `const before = { liked: liked.value, likes: likes.value }`.',
        'Flip `liked` and adjust `likes` **before** `await setLiked(42, liked.value)`.',
        'In the `catch`, restore both values from `before` and set the error message. You no longer need to wait for the response to update the UI.',
      ],
      solution: {
        explanation: 'The UI assumes success, because likes almost always succeed — so the button feels instant. Keeping a snapshot of the previous state makes the rollback trivial and exact. The error message matters: silently reverting would look like a glitch.',
        files: { 'App.vue': likeSolution, 'api.js': likeApi },
      },
      tests: [
        {
          name: 'the count and aria-pressed change immediately',
          code: `await click('.like')
expect(text('.count')).toBe('13')
expect(attr('.like', 'aria-pressed')).toBe('true')`,
        },
        {
          name: 'a successful save keeps the new state',
          code: `await click('.like')
await wait(400)
expect(text('.count')).toBe('13')
expect(exists('.error')).toBe(false)`,
        },
        {
          name: 'a failed save rolls back and shows an error',
          code: `requireModule('api.js').server.failNext = true
await click('.like')
expect(text('.count')).toBe('13')
await wait(400)
expect(text('.count')).toBe('12')
expect(attr('.like', 'aria-pressed')).toBe('false')
expect(exists('.error')).toBe(true)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'resilient-requests-what-to-retry',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Your API client should retry failed requests. Which failures would you retry, how, and which would you never retry?',
      answer: 'Retry transient failures: network errors with no response, 502/503/504 and 429 — with exponential backoff, jitter, a small maximum number of attempts, and respecting `Retry-After`. Don\'t retry 4xx client errors (400, 401, 403, 404, 422) — they won\'t change; a 401 may trigger a token refresh flow instead. Only retry non-idempotent requests (POST) when the API supports idempotency keys. Stop retrying when the user navigates away.',
      explanation: 'A retry is a bet that the next attempt will behave differently. Only make that bet when it might.',
      whyAsked: 'Shows judgement about reliability without causing duplicate side effects or extra load.',
      mistakes: ['"Retry everything three times."', 'No backoff.', 'Forgetting idempotency.'],
      followUps: ['Why add jitter?', 'How would you surface retries in the UI?', 'How do retries interact with timeouts?'],
      modelAnswer: 'I only retry failures that might go away: network errors, 5xx gateway or availability errors, and 429. I use exponential backoff with jitter and a small cap, and honour Retry-After if the server sends it. Client errors like 400, 403, 404 or 422 are final, so I surface them immediately; 401 goes to the auth refresh flow. For POSTs I don\'t auto-retry unless the API supports idempotency keys, because a lost response doesn\'t mean the request failed. And the loop must stop on unmount or cancellation.',
    },
    {
      id: 'resilient-requests-idempotency',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A checkout request (`POST /orders`) sometimes times out on mobile networks. Product wants it retried automatically. What do you propose?',
      answer: 'First, explain the risk: a timeout doesn\'t mean the order failed, so a blind retry can create duplicate orders. Propose idempotency keys: the client generates a unique key when the user presses "Place order" (not per attempt), sends it with every attempt, and the server stores the result per key, returning the original order for repeats. Then retries with backoff are safe. In the UI, disable the button while submitting, show progress, and after a final failure tell the user the order *may* have gone through and check status before offering a retry.',
      explanation: 'The server, not the client, must be able to recognise "the same action again".',
      whyAsked: 'Distinguishes engineers who understand distributed-systems pitfalls from those who just add retries.',
      mistakes: ['Retrying POST without any protection.', 'Generating a new key per attempt (defeats the purpose).', 'Relying on a disabled button as the only protection.'],
      followUps: ['Where does the key come from?', 'What should happen if the server is still processing the first attempt?', 'How long should the server remember keys?'],
      modelAnswer: 'A timeout is ambiguous — the order may have been created and only the response lost — so retrying a plain POST risks double orders. I\'d ask the backend to support idempotency keys. When the user clicks Place order, the client generates one key, sends it in a header on every attempt, and the server returns the stored result if it has seen that key. With that in place, retrying with backoff is safe. On the client I\'d also disable the button during submission and, if everything fails, check order status before inviting the user to try again.',
    },
    {
      id: 'resilient-requests-jitter',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'Why use exponential backoff rather than retrying at a fixed interval, and why add jitter?',
      answer: 'Exponential backoff waits longer after each failure (e.g. 200, 400, 800 ms), quickly reducing load on a struggling server while still recovering fast from brief blips. Jitter adds randomness to each wait so that many clients that failed at the same moment don\'t all retry at the same moments, which would create synchronized load spikes (a "thundering herd") that can knock a recovering service over again.',
      explanation: 'Backoff reduces load over time; jitter spreads it out across clients.',
      whyAsked: 'Probes understanding of system-level effects of client behaviour.',
      mistakes: ['Thinking jitter is about making a single client faster.', 'Unbounded backoff with no maximum.', 'Not mentioning Retry-After.'],
      followUps: ['What\'s "full jitter"?', 'Would you cap the maximum delay?', 'How does this apply to WebSocket reconnects?'],
      modelAnswer: 'Fixed-interval retries keep hammering a server at the same rate even when it\'s clearly struggling. Exponential backoff doubles the wait each time, so the load from each client drops off fast, but a short blip is still recovered within a few hundred milliseconds. The catch is that if thousands of clients failed together, they\'d also retry together at 200, 400, 800 ms — synchronized spikes. Jitter randomises each delay so retries spread out. I\'d also cap the maximum delay and prefer Retry-After when the server provides it. The same logic applies to reconnecting WebSockets.',
    },
    {
      id: 'resilient-requests-cache-invalidation',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design client-side caching for a Vue app with user profiles, a product catalogue and an "orders" list the user edits. How do you decide TTLs and handle invalidation?',
      answer: 'Choose freshness per resource: the catalogue changes rarely → longer TTL with stale-while-revalidate; profiles → moderate TTL, invalidated when the user edits; orders the user edits → short TTL or always revalidate, and invalidate/update the cache immediately after mutations (or update it with the server response). Key entries by URL + params (+ user). Dedupe in-flight requests. Clear all per-user caches on logout. Put this in one data layer (service + store, or a library like TanStack Query) so components never manage caching themselves.',
      explanation: 'TTL is a product decision about acceptable staleness; invalidation is about consistency after your own writes.',
      whyAsked: 'Architecture-level thinking about consistency, performance and security.',
      mistakes: ['One global TTL for everything.', 'Forgetting to invalidate after writes.', 'Leaking cached data between users.'],
      followUps: ['How does stale-while-revalidate feel to users?', 'What changes with real-time updates?', 'When would you adopt TanStack Query instead of building this?'],
      modelAnswer: 'I\'d treat staleness as a per-resource product decision. The catalogue can be cached for a while and shown instantly with background revalidation. Profiles get a moderate TTL and are invalidated when the user saves. The orders list the user edits is revalidated often, and after each mutation I update or delete the affected entries so the user never sees their own stale write. Keys include params and the user, dedupe sits under the cache, and logout clears everything user-specific. All of this lives in one data layer; as the app grows, a library like TanStack Query gives me these semantics without maintaining them.',
    },
    {
      id: 'resilient-requests-dedupe-code',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `dedupe(fn)` in **dedupe.js**. It returns a function that, while a call with the same arguments is still pending, returns the **same promise** instead of calling `fn` again. Once that promise settles (success *or* failure), the next call goes to `fn` again. Key calls by `JSON.stringify(args)`.',
      starter: {
        files: {
          'App.vue': dedupeApp,
          'api.js': dedupeApi,
          'dedupe.js': `// dedupe.js
export function dedupe(fn) {
  return (...args) => fn(...args)
}`,
        },
      },
      tests: [
        {
          name: 'concurrent identical calls share one request',
          code: `const { dedupe } = requireModule('dedupe.js')
const { getPrice, stats } = requireModule('api.js')
const before = stats.calls
const get = dedupe(getPrice)
const [a, b] = await Promise.all([get('mug'), get('mug')])
expect(stats.calls - before).toBe(1)
expect(a.price).toBe(19.99)
expect(b.price).toBe(19.99)`,
        },
        {
          name: 'different arguments are not merged',
          code: `const { dedupe } = requireModule('dedupe.js')
const { getPrice, stats } = requireModule('api.js')
const before = stats.calls
const get = dedupe(getPrice)
await Promise.all([get('mug'), get('cap')])
expect(stats.calls - before).toBe(2)`,
        },
        {
          name: 'after settling, a new call hits fn again — even after a failure',
          code: `const { dedupe } = requireModule('dedupe.js')
const { getPrice, stats } = requireModule('api.js')
const get = dedupe(getPrice)
await get('mug')
const before = stats.calls
await get('mug')
expect(stats.calls - before).toBe(1)
let failures = 0
await get('broken').catch(() => failures++)
await get('broken').catch(() => failures++)
expect(failures).toBe(2)
expect(stats.calls - before).toBe(3)`,
        },
        {
          name: 'the page makes one call for three widgets',
          code: `await wait(250)
expect(findAll('.price').length).toBe(3)
expect(requireModule('api.js').stats.calls).toBe(1)`,
        },
      ],
      hints: ['Keep a `Map` from key to promise in the closure.', 'If the map has the key, return that promise; otherwise call `fn(...args)`.', 'Attach `.finally(() => pending.delete(key))` before storing it, so failures are released too.'],
      answer: 'A Map from `JSON.stringify(args)` to the pending promise; return it if present, otherwise call `fn`, store the promise with a `finally` that deletes the key, and return it.',
      solution: {
        files: {
          'App.vue': dedupeApp,
          'api.js': dedupeApi,
          'dedupe.js': `// dedupe.js
export function dedupe(fn) {
  const pending = new Map()

  return (...args) => {
    const key = JSON.stringify(args)
    if (pending.has(key)) return pending.get(key)

    const promise = Promise.resolve()
      .then(() => fn(...args))
      .finally(() => pending.delete(key))

    pending.set(key, promise)
    return promise
  }
}`,
        },
      },
      explanation: 'Every caller awaits the same promise, so they all get the same result (or the same error). `finally` releases the key on both outcomes. Wrapping the call in `Promise.resolve().then(...)` also turns a synchronous throw from `fn` into a rejection.',
      whyAsked: 'Tests promise fundamentals (sharing, settling, cleanup) in a pattern used in real data layers.',
      mistakes: ['Cleaning up only on success.', 'Caching results forever (that\'s a cache without TTL, not dedupe).', 'Keying by the first argument only.'],
      followUps: ['How would you add a TTL cache on top?', 'What are the limits of `JSON.stringify` as a key?', 'How would cancellation interact with shared promises?'],
      modelAnswer: 'I keep a Map in the closure from a key — here `JSON.stringify(args)` — to the pending promise. If a call arrives while the key is pending, I return the same promise, so one underlying request serves everyone. Otherwise I call `fn`, attach `finally` to delete the key whether it succeeds or fails, store it and return it. That way failures aren\'t remembered and later calls go to the network again. One subtlety: if callers can cancel, one caller aborting a shared request would affect the others, so shared requests usually aren\'t cancelled by individual callers.',
    },
    {
      id: 'resilient-requests-polling-leak',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'After navigating between pages a few times, the Network tab shows `/api/notifications` firing every few hundred milliseconds. Here\'s the component. What\'s wrong and how do you fix it?',
      code: {
        lang: 'js',
        code: `onMounted(() => {
  setInterval(async () => {
    notifications.value = await getNotifications()
  }, 5000)
})`,
      },
      answer: 'The interval is never cleared, so it survives unmount; every visit starts another one, and they add up. `setInterval` can also overlap slow requests. Fix: keep the timer id and clear it in `onUnmounted` — better, use a `setTimeout` chain with a stop flag so the next poll only starts after the previous one finishes; optionally abort the pending request on unmount and pause while the tab is hidden.',
      explanation: 'Timers belong to the page, not the component; Vue won\'t clear them for you.',
      whyAsked: 'Memory/request leaks from forgotten timers are among the most common production bugs in SPAs.',
      mistakes: ['Saying Vue clears intervals on unmount.', 'Clearing the interval but leaving overlapping requests.', 'Fixing it with a global flag shared by all instances.'],
      followUps: ['How would you write a reusable `usePolling` composable?', 'How would you pause polling in background tabs?', 'When would you switch to WebSockets?'],
      modelAnswer: 'Each mount starts an interval and nothing ever stops it, so after a few navigations several intervals are polling in parallel — and with slow responses, `setInterval` overlaps requests too. I\'d replace it with a setTimeout chain: poll, await the result, then schedule the next poll unless a `stopped` flag is set. On unmount I set the flag, clear the timeout and abort any pending request. I\'d package that as a `usePolling` composable with pause-on-hidden-tab and error backoff, so nobody writes raw intervals again.',
    },
    {
      id: 'resilient-requests-optimistic-vs-pessimistic',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare optimistic and pessimistic UI updates. How do you decide which to use for a given action?',
      answer: 'Pessimistic: wait for the server, then update — always truthful, but slower to feel. Optimistic: update immediately, then confirm; roll back and show an error on failure — feels instant but briefly shows a state that might not be real. Use optimistic for frequent, low-risk, reversible actions that almost always succeed (likes, toggles, reordering); pessimistic for high-stakes or irreversible actions (payments, permission changes, deletions without undo) and when the server computes important parts of the result.',
      explanation: 'It\'s a trade-off between perceived speed and the cost of being briefly wrong.',
      whyAsked: 'Tests UX judgement combined with error-handling discipline.',
      mistakes: ['Optimistic updates without rollback.', 'Using optimistic UI for payments.', 'Ignoring concurrent toggles and out-of-order responses.'],
      followUps: ['How do you handle three quick toggles?', 'How would you do this in a Pinia action?', 'What if the server returns a different final value?'],
      modelAnswer: 'Pessimistic updates wait for the server, so the UI is never wrong but feels slower. Optimistic updates change the UI first and reconcile afterwards, which feels instant but means you must roll back and explain if the server rejects it. My rule is: optimistic for cheap, reversible, high-frequency actions like likes or checkboxes; pessimistic for money, permissions or anything irreversible, or when the server computes the result. With optimistic updates I snapshot the previous state, roll back on error, and guard against out-of-order responses from rapid repeats.',
    },
  ],

  takeaways: [
    'Retry only transient failures (network, 5xx, 429) with exponential backoff, jitter and a small limit; respect `Retry-After`.',
    'Never blindly retry non-idempotent requests — use idempotency keys when the API supports them.',
    'Dedupe simultaneous identical requests by sharing the in-flight promise; clean up in `finally`.',
    'Cache with a TTL, key carefully, invalidate after writes and clear per-user data on logout.',
    'Optimistic updates make low-risk actions feel instant — always snapshot and roll back on failure.',
    'Poll with a `setTimeout` chain, stop on unmount and back off on errors; consider push for real-time needs.',
  ],
}
