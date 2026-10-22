// Lesson: Cancellation, race conditions & stale responses.
// api.js deliberately makes SHORT queries SLOWER, so responses arrive out of order
// on demand. It honours an AbortSignal exactly like fetch does (rejects with AbortError).

const searchApi = `// api.js — a pretend search server (simplified: in memory, no network).
// Short queries are SLOWER here ("a" ≈ 400 ms, "ada" ≈ 200 ms), so typing
// "a" then "ada" makes the answers arrive in the wrong order — on purpose.
const PEOPLE = [
  'Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Adele Goldberg',
  'Katherine Johnson', 'Radia Perlman', 'Barbara Liskov',
]

export const stats = { started: 0, aborted: 0 }

export function searchPeople(q, { signal } = {}) {
  stats.started++
  const delay = Math.max(100, 500 - q.length * 100)
  console.log('→ search "' + q + '" (' + delay + ' ms)')

  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The request was aborted.', 'AbortError')
    if (signal && signal.aborted) return reject(abortError())

    let done = false
    const timer = setTimeout(() => {
      done = true
      const needle = q.toLowerCase()
      console.log('← results for "' + q + '"')
      resolve(PEOPLE.filter((name) => name.toLowerCase().includes(needle)))
    }, delay)

    // Like fetch: aborting rejects the promise with an AbortError
    if (signal) {
      signal.addEventListener('abort', () => {
        if (done) return
        clearTimeout(timer)
        stats.aborted++
        console.log('✕ aborted "' + q + '"')
        reject(abortError())
      }, { once: true })
    }
  })
}`

const naiveApp = `<script setup>
import { ref, watch } from 'vue'
import { searchPeople } from './api.js'

const query = ref('')
const results = ref([])
const shownFor = ref('') // which query the results on screen belong to
const loading = ref(false)
const error = ref('')

watch(query, async (q) => {
  if (!q) {
    results.value = []
    shownFor.value = ''
    return
  }
  loading.value = true
  error.value = ''
  try {
    const people = await searchPeople(q)
    results.value = people
    shownFor.value = q
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <h2>Find a person</h2>
  <input v-model="query" class="search" placeholder='Type "a", then quickly "ada"' />
  <p class="status">{{ loading ? 'Searching…' : '' }}</p>
  <p v-if="shownFor" class="results-for">Results for "{{ shownFor }}"</p>
  <ul>
    <li v-for="name in results" :key="name" class="person">{{ name }}</li>
  </ul>
  <p v-if="error" class="error">{{ error }}</p>
</template>`

const guardApp = `<script setup>
import { ref, watch } from 'vue'
import { searchPeople } from './api.js'

const query = ref('')
const results = ref([])
const shownFor = ref('')
const loading = ref(false)
const error = ref('')

let latestId = 0

watch(query, async (q) => {
  const id = ++latestId // this run's ticket number
  if (!q) {
    results.value = []
    shownFor.value = ''
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const people = await searchPeople(q)
    if (id !== latestId) return // a newer search started: ignore this answer
    results.value = people
    shownFor.value = q
  } catch (e) {
    if (id === latestId) error.value = e.message
  } finally {
    if (id === latestId) loading.value = false
  }
})
</script>

<template>
  <h2>Find a person</h2>
  <input v-model="query" class="search" placeholder='Type "a", then quickly "ada"' />
  <p class="status">{{ loading ? 'Searching…' : '' }}</p>
  <p v-if="shownFor" class="results-for">Results for "{{ shownFor }}"</p>
  <ul>
    <li v-for="name in results" :key="name" class="person">{{ name }}</li>
  </ul>
  <p v-if="error" class="error">{{ error }}</p>
</template>`

const abortApp = `<script setup>
import { ref, watch, onWatcherCleanup } from 'vue'
import { searchPeople } from './api.js'

const query = ref('')
const results = ref([])
const shownFor = ref('')
const loading = ref(false)
const error = ref('')

watch(query, async (q) => {
  if (!q) {
    results.value = []
    shownFor.value = ''
    loading.value = false
    return
  }
  const controller = new AbortController()
  // Vue 3.5+: runs before this watcher's next run, and when it stops (unmount)
  onWatcherCleanup(() => controller.abort())

  loading.value = true
  error.value = ''
  try {
    results.value = await searchPeople(q, { signal: controller.signal })
    shownFor.value = q
  } catch (e) {
    if (e.name === 'AbortError') return // superseded on purpose: not an error
    error.value = e.message
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
})
</script>

<template>
  <h2>Find a person</h2>
  <input v-model="query" class="search" placeholder='Type "a", then quickly "ada"' />
  <p class="status">{{ loading ? 'Searching…' : '' }}</p>
  <p v-if="shownFor" class="results-for">Results for "{{ shownFor }}"</p>
  <ul>
    <li v-for="name in results" :key="name" class="person">{{ name }}</li>
  </ul>
  <p v-if="error" class="error">{{ error }}</p>
</template>`

const profileApi = `// api.js — pretend profile endpoint. Each user takes a different time to load.
const USERS = {
  1: { id: 1, name: 'Ada Lovelace', bio: 'Wrote the first published algorithm.' },
  2: { id: 2, name: 'Grace Hopper', bio: 'Built the first compiler.' },
  3: { id: 3, name: 'Alan Turing', bio: 'Founded theoretical computer science.' },
}
const DELAYS = { 1: 500, 2: 150, 3: 300 }

export const stats = { aborted: 0 }

export function getProfile(id, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The request was aborted.', 'AbortError')
    if (signal && signal.aborted) return reject(abortError())
    let done = false
    const timer = setTimeout(() => {
      done = true
      resolve({ ...USERS[id] })
    }, DELAYS[id])
    if (signal) {
      signal.addEventListener('abort', () => {
        if (done) return
        clearTimeout(timer)
        stats.aborted++
        reject(abortError())
      }, { once: true })
    }
  })
}`

const profileApp = `<script setup>
import { ref } from 'vue'
import ProfileCard from './ProfileCard.vue'

const selectedId = ref(null)
const open = ref(true)
</script>

<template>
  <button class="pick-1" @click="selectedId = 1">Ada</button>
  <button class="pick-2" @click="selectedId = 2">Grace</button>
  <button class="pick-3" @click="selectedId = 3">Alan</button>
  <button class="close" @click="open = false">Close panel</button>

  <ProfileCard v-if="open" :user-id="selectedId" />
</template>`

const profileStarter = `<script setup>
import { ref, watch } from 'vue'
import { getProfile } from './api.js'

const props = defineProps({ userId: Number })

const profile = ref(null)
const error = ref('')

watch(
  () => props.userId,
  async (id) => {
    if (!id) return
    error.value = ''
    try {
      profile.value = await getProfile(id)
    } catch (e) {
      error.value = e.message
    }
  },
  { immediate: true },
)
</script>

<template>
  <article class="card">
    <p v-if="!profile">Pick someone.</p>
    <template v-else>
      <h3 class="profile-name">{{ profile.name }}</h3>
      <p>{{ profile.bio }}</p>
    </template>
    <p v-if="error" class="error">{{ error }}</p>
  </article>
</template>`

const profileSolution = `<script setup>
import { ref, watch, onWatcherCleanup } from 'vue'
import { getProfile } from './api.js'

const props = defineProps({ userId: Number })

const profile = ref(null)
const error = ref('')

watch(
  () => props.userId,
  async (id) => {
    if (!id) return
    const controller = new AbortController()
    onWatcherCleanup(() => controller.abort()) // before the first await!
    error.value = ''
    try {
      profile.value = await getProfile(id, { signal: controller.signal })
    } catch (e) {
      if (e.name !== 'AbortError') error.value = e.message
    }
  },
  { immediate: true },
)
</script>

<template>
  <article class="card">
    <p v-if="!profile">Pick someone.</p>
    <template v-else>
      <h3 class="profile-name">{{ profile.name }}</h3>
      <p>{{ profile.bio }}</p>
    </template>
    <p v-if="error" class="error">{{ error }}</p>
  </article>
</template>`

const reportApi = `// api.js — a slow "generate report" endpoint that honours an AbortSignal.
export const stats = { aborted: 0 }

export function generateReport({ signal } = {}) {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The request was aborted.', 'AbortError')
    if (signal && signal.aborted) return reject(abortError())
    let done = false
    const timer = setTimeout(() => {
      done = true
      resolve({ name: 'sales-q3.csv', rows: 1280 })
    }, 600)
    if (signal) {
      signal.addEventListener('abort', () => {
        if (done) return
        clearTimeout(timer)
        stats.aborted++
        reject(abortError())
      }, { once: true })
    }
  })
}`

const reportStarter = `<script setup>
import { ref } from 'vue'
import { generateReport } from './api.js'

const status = ref('idle') // 'idle' | 'running' | 'done' | 'cancelled' | 'error'
const report = ref(null)
const error = ref('')

async function generate() {
  status.value = 'running'
  report.value = null
  error.value = ''
  try {
    report.value = await generateReport()
    status.value = 'done'
  } catch (e) {
    error.value = e.message
    status.value = 'error'
  }
}

function cancel() {
  // TODO: abort the running request
}
</script>

<template>
  <button class="generate" :disabled="status === 'running'" @click="generate">Generate report</button>
  <button class="cancel" @click="cancel">Cancel</button>

  <p class="status">{{ status === 'running' ? 'Generating…' : status === 'cancelled' ? 'Cancelled' : '' }}</p>
  <p v-if="report" class="result">Report ready: {{ report.name }} ({{ report.rows }} rows)</p>
  <p v-if="error" class="error">{{ error }}</p>
</template>`

const reportSolution = `<script setup>
import { ref, onUnmounted } from 'vue'
import { generateReport } from './api.js'

const status = ref('idle') // 'idle' | 'running' | 'done' | 'cancelled' | 'error'
const report = ref(null)
const error = ref('')
let controller = null

async function generate() {
  controller = new AbortController() // a fresh controller for every request
  status.value = 'running'
  report.value = null
  error.value = ''
  try {
    report.value = await generateReport({ signal: controller.signal })
    status.value = 'done'
  } catch (e) {
    if (e.name === 'AbortError') {
      status.value = 'cancelled'
    } else {
      error.value = e.message
      status.value = 'error'
    }
  }
}

function cancel() {
  if (controller) controller.abort()
}

onUnmounted(cancel) // leaving the page cancels the work too
</script>

<template>
  <button class="generate" :disabled="status === 'running'" @click="generate">Generate report</button>
  <button v-if="status === 'running'" class="cancel" @click="cancel">Cancel</button>

  <p class="status">{{ status === 'running' ? 'Generating…' : status === 'cancelled' ? 'Cancelled' : '' }}</p>
  <p v-if="report" class="result">Report ready: {{ report.name }} ({{ report.rows }} rows)</p>
  <p v-if="error" class="error">{{ error }}</p>
</template>`

const latestApi = `// api.js — pretend endpoint that honours an AbortSignal (like fetch).
export const stats = { aborted: 0 }

export function lookup(signal, word) {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The request was aborted.', 'AbortError')
    if (signal && signal.aborted) return reject(abortError())
    let done = false
    const timer = setTimeout(() => {
      done = true
      resolve(word.toUpperCase())
    }, 150)
    if (signal) {
      signal.addEventListener('abort', () => {
        if (done) return
        clearTimeout(timer)
        stats.aborted++
        reject(abortError())
      }, { once: true })
    }
  })
}`

const latestApp = `<script setup>
import { ref } from 'vue'
import { takeLatest } from './takeLatest.js'
import { lookup } from './api.js'

const answer = ref('')
const run = takeLatest(lookup)

async function search(word) {
  try {
    answer.value = await run(word)
  } catch (e) {
    if (e.name !== 'AbortError') throw e
  }
}
</script>

<template>
  <button class="one" @click="search('one')">one</button>
  <button class="two" @click="search('two')">two</button>
  <p class="answer">{{ answer }}</p>
</template>`

export default {
  id: 'cancellation-race-conditions',
  title: 'Cancellation, race conditions & stale responses',
  summary: 'Stop an older, slower response from overwriting a newer one — by ignoring it, or by cancelling it with AbortController and Vue\'s watcher cleanup.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['search-pagination', 'watch', 'async-js'],
  related: ['async-ui-states', 'resilient-requests', 'lifecycle-hooks', 'watch-effect', 'effect-scope', 'composable-design'],
  tags: ['race condition', 'stale response', 'AbortController', 'AbortSignal', 'AbortError', 'onWatcherCleanup', 'onCleanup', 'cancellation', 'timeout'],
  apis: [
    { name: 'AbortController', summary: 'Browser API: `controller.abort()` signals cancellation to whatever received `controller.signal`.' },
    { name: 'AbortSignal', summary: 'Passed as `{ signal }` to fetch (or your own async code); fires an `abort` event when cancelled.' },
    { name: 'onWatcherCleanup()', summary: 'Vue 3.5+: register a cleanup that runs before the watcher\'s next run and when it stops.' },
    { name: 'onCleanup (watch callback 3rd argument)', summary: 'Vue 3.0+: the same idea as onWatcherCleanup, passed to watch/watchEffect callbacks.' },
    { name: 'AbortSignal.timeout(ms)', summary: 'A signal that aborts itself after `ms` with a `TimeoutError`.' },
  ],
  docs: [
    { label: 'Vue Guide — Watchers: side effect cleanup', url: 'https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup' },
    { label: 'API — onWatcherCleanup()', url: 'https://vuejs.org/api/reactivity-core.html#onwatchercleanup' },
    { label: 'MDN — AbortController', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortController' },
    { label: 'MDN — AbortSignal.timeout()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static' },
  ],

  intro: `
Requests don't come back in the order you sent them. A search for "a" might take 400 ms while the search for "ada" you typed a moment later takes 200 ms. If your code simply shows *whatever arrives*, the slower, older answer lands last — and the screen shows results for "a" while the box says "ada".

That's a **race condition**: the result depends on which of two things finishes first, and you didn't decide which should win. The older answer is a **stale response**.

There are two fixes, often used together: **ignore** answers that are no longer wanted, or **cancel** the old request with an \`AbortController\`. Vue gives you a neat place to do the cancelling: the **watcher cleanup** hook.
`,

  why: `
Every feature that fires requests in response to changing input has this bug waiting to happen: search boxes, filter panels, tabbed profiles, "next/previous" buttons, autocomplete. It's easy to miss in development because your local server answers instantly and in order. On a phone on a train, it happens all the time.

The symptoms are confusing for users — results that don't match the search, a profile that switches to the wrong person, a spinner that stops while data is still loading — and hard to reproduce for developers.

Cancellation also saves work: the browser stops downloading a response nobody will look at, and requests started by a component stop when the user navigates away. Debouncing ([previous lesson](lesson:search-pagination)) reduces how many requests you send, but it **doesn't** fix ordering: two requests are enough to race.
`,

  eli15: `
You text two friends: "Want pizza?" and, a minute later, "Actually, want tacos?"

The pizza friend has slow internet. The taco answer comes back first: "Yes to tacos!" Then the pizza answer arrives: "Yes to pizza!" If you act on whatever arrived **last**, you go for pizza — even though your latest question was about tacos.

Two smart fixes:

1. **Ignore old answers.** Number your questions. When an answer comes in, check: is it for my *latest* question? If not, ignore it.
2. **Take the old question back.** Before asking about tacos, send "never mind about pizza". That's **cancelling** — in JavaScript, \`controller.abort()\`.
`,

  analogy: {
    title: 'The deli counter ticket',
    body: `
At a busy deli you take a numbered ticket. The display says "Now serving 42". If someone waves ticket 39 — an old order that was replaced — the server doesn't hand them the food; only the current number counts. That's the **request-id guard**: every request gets a number, and only the latest number may update the screen.

Cancelling is going one step further: when you change your order, you tell the kitchen to **stop cooking** the old one, so nobody wastes time on food that will be thrown away. That's \`AbortController\`.
`,
    mapping: [
      ['taking a numbered ticket', '`const id = ++latestId`'],
      ['"Now serving 42"', '`if (id !== latestId) return` — only the latest may update state'],
      ['"stop cooking my old order"', '`controller.abort()`'],
      ['the kitchen stops and bins the order', 'fetch rejects with an `AbortError`'],
      ['leaving the deli', 'the component unmounts → cleanup aborts its requests'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Two requests, wrong order',
    caption: 'The newer request finishes first; the older one finishes last and overwrites it. Each fix breaks one specific arrow.',
    alt: 'A timeline diagram with two lanes. In lane one, the user types "a" and request A starts; it is slow. In lane two, the user types "ada" and request B starts; it is fast. Response B arrives first and the screen shows results for ada. Then response A arrives and overwrites the screen with results for a — a stale response. The fix steps show the guard ignoring response A, and abort cancelling request A so it never arrives.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'typeA', label: 'type "a"', note: 't = 0 ms', tone: 'paper', x: 90, y: 80 },
        { id: 'reqA', label: 'request A', note: 'slow · 400 ms', tone: 'cobalt', x: 290, y: 80 },
        { id: 'typeB', label: 'type "ada"', note: 't = 50 ms', tone: 'paper', x: 90, y: 230 },
        { id: 'reqB', label: 'request B', note: 'fast · 200 ms', tone: 'cobalt', x: 290, y: 230 },
        { id: 'showB', label: 'screen: "ada"', note: 't ≈ 250 ms ✓', tone: 'acid', x: 520, y: 230 },
        { id: 'showA', label: 'screen: "a"', note: 't ≈ 400 ms ✗ stale', tone: 'red', x: 520, y: 80 },
        { id: 'fix', label: 'guard / abort', note: 'A never reaches the screen', tone: 'ink', x: 690, y: 155 },
      ],
      edges: [
        { from: 'typeA', to: 'reqA' },
        { from: 'typeB', to: 'reqB' },
        { from: 'reqB', to: 'showB', label: 'arrives 1st' },
        { from: 'reqA', to: 'showA', label: 'arrives 2nd' },
        { from: 'showB', to: 'showA', label: 'overwritten!', dashed: true },
        { from: 'reqA', to: 'fix', label: 'ignored or cancelled', dashed: true },
      ],
      steps: [
        { focus: ['typeA', 'reqA'], edges: ['typeA->reqA'], text: 'The user types "a". A request starts. This one happens to be slow.' },
        { focus: ['typeB', 'reqB'], edges: ['typeB->reqB'], text: 'A moment later the input says "ada" and a second request starts. Nothing stopped the first one.' },
        { focus: ['showB'], edges: ['reqB->showB'], text: 'The newer request finishes first. The screen correctly shows results for "ada".' },
        { focus: ['showA', 'showB'], edges: ['reqA->showA', 'showB->showA'], text: 'Then the old response arrives and the code assigns it too. The screen now shows results for "a" while the box says "ada" — a **stale response**.' },
        { focus: ['fix', 'reqA'], edges: ['reqA->fix'], text: '**Guard:** request A sees it\'s no longer the latest and drops its result. **Abort:** request A was cancelled when B started, so it never resolves at all.' },
      ],
    },
  },

  syntax: [
    `
#### Fix 1 — the "latest request wins" guard

Give every request a ticket number. When the answer comes back, only apply it if it's still the latest ticket. Works with **any** promise, even ones you can't cancel.
`,
    {
      code: `let latestId = 0

async function search(q) {
  const id = ++latestId
  const people = await searchPeople(q)
  if (id !== latestId) return   // a newer search started — drop this answer
  results.value = people
}`,
      lang: 'js',
      title: 'request-id guard',
    },
    `
#### Fix 2 — cancel with AbortController

An \`AbortController\` is a remote control for cancellation. You hand its \`signal\` to the request; calling \`abort()\` makes the request stop and its promise **reject with an \`AbortError\`**. Cancelling is intentional, so don't show that as an error.
`,
    {
      code: `const controller = new AbortController()

try {
  const res = await fetch('/api/users?q=ada', { signal: controller.signal })
  // …
} catch (e) {
  if (e.name === 'AbortError') return  // we cancelled it on purpose
  throw e
}

// somewhere else, e.g. when a newer search starts:
controller.abort()`,
      lang: 'js',
      title: 'AbortController + fetch',
    },
    `
A controller is single-use: once aborted, its signal stays aborted forever. Create a **new controller for every request**.

#### Fix 3 — let Vue tell you when to cancel

Watchers know exactly when a run becomes outdated: just before they run again, and when they're stopped (for example because the component unmounted). Register a cleanup and Vue calls it at those moments:
`,
    {
      code: `import { watch, onWatcherCleanup } from 'vue'

watch(query, async (q) => {
  const controller = new AbortController()
  onWatcherCleanup(() => controller.abort())   // register BEFORE the first await

  try {
    results.value = await searchPeople(q, { signal: controller.signal })
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e.message
  }
})`,
      lang: 'js',
      title: 'onWatcherCleanup (Vue 3.5+)',
    },
    {
      callout: 'version',
      text: '`onWatcherCleanup()` was added in **Vue 3.5**. It must be called synchronously while the watcher callback runs — before any `await`. On older versions (and still fine today) use the third argument of the callback: `watch(src, async (value, oldValue, onCleanup) => { onCleanup(() => controller.abort()) })`. `watchEffect` receives `onCleanup` as its first argument.',
    },
    `
#### Cancel when the component goes away

Requests started in \`onMounted\` or in event handlers aren't tied to a watcher. Abort them yourself on unmount:
`,
    {
      code: `let controller = null

async function load() {
  controller?.abort()                  // a newer load supersedes the old one
  controller = new AbortController()
  data.value = await getReport({ signal: controller.signal })
}

onMounted(load)
onUnmounted(() => controller?.abort())`,
      lang: 'js',
      title: 'cancel on unmount',
    },
    `
#### Timeouts are cancellation too
`,
    {
      code: `// Gives up after 8 s; fetch rejects with a DOMException named 'TimeoutError'
const res = await fetch('/api/report', { signal: AbortSignal.timeout(8000) })

// Axios (static example): it accepts the same signal (v0.22+)
// await axios.get('/api/report', { signal: controller.signal })
// cancelled requests reject with an error for which axios.isCancel(err) is true`,
      lang: 'js',
      title: 'timeouts',
      static: true,
    },
    `
\`AbortSignal.timeout()\` is supported in current major browsers. To combine "user cancelled" with "timed out", newer browsers offer \`AbortSignal.any([a, b])\` — check your browser support targets before relying on it.
`,
  ],

  walkthrough: {
    title: 'App.vue — cancel-on-change search',
    lang: 'vue',
    code: abortApp,
    intro: 'The finished search: every new query cancels the previous request through Vue\'s watcher cleanup. (It\'s also available as a variant in the playground.)',
    steps: [
      { lines: [2, 2], text: '`onWatcherCleanup` is imported from `\'vue\'` (Vue 3.5+). On older versions use the watch callback\'s third argument instead.' },
      { lines: [11, 17], text: 'Clearing the box shows nothing. Even this early `return` counts as a new watcher run, so the previous run\'s cleanup has *already* aborted any request still in flight.' },
      { lines: [18, 20], text: 'A fresh controller per run, and a cleanup that aborts it. Vue calls the cleanup right before the next run **and** when the watcher stops — which happens automatically when the component unmounts.' },
      { lines: [22, 23], text: 'Start of a new attempt: spinner on, old error cleared.' },
      { lines: [24, 26], text: 'The signal is passed to the request. If this run is superseded, the promise rejects instead of resolving — so stale results can never be assigned.' },
      { lines: [27, 29], text: 'An `AbortError` means "we cancelled this on purpose". Return quietly; only real failures become an error message.' },
      { lines: [30, 32], text: 'A subtle one: when a run is aborted, a *newer* run owns the spinner. Only a run that wasn\'t aborted may switch `loading` off.' },
    ],
  },

  playground: {
    title: 'Find a person',
    objective: 'Reproduce the race, then fix it three ways: ignore stale answers, cancel old requests, and let Vue\'s watcher cleanup do the cancelling.',
    files: { 'App.vue': naiveApp, 'api.js': searchApi },
    expected: 'Type **a** and then quickly **da** (so the box says "ada"). Watch the **Console**: "ada" comes back first, then the old "a" results arrive and overwrite them. The heading ends up saying *Results for "a"*.',
    experiments: [
      {
        id: 'latest-wins',
        task: 'Make sure only the **latest** search can update the screen. Add a request counter: each watcher run takes `const id = ++latestId`, and after the `await` it returns early if `id !== latestId`.',
        hint: 'Declare `let latestId = 0` above the watcher. Put the check right after `const people = await searchPeople(q)`. Guard the `catch` and `finally` the same way.',
        tests: [
          {
            name: 'typing "a" then "ada" ends with the results for "ada"',
            code: `await type('.search', 'a')
await type('.search', 'ada')
await wait(600)
expect(text('.results-for')).toContain('"ada"')
expect(findAll('.person').map((li) => li.textContent.trim())).toEqual(['Ada Lovelace'])`,
          },
        ],
        explain: 'The old request still runs to completion — you just refuse to use its answer. This works with any promise, but the browser still downloads a response nobody needs.',
      },
      {
        id: 'abort',
        task: 'Now actually **cancel** the previous request. Keep a `controller` variable outside the watcher; at the start of each run call `controller?.abort()`, create a new `AbortController`, and pass `{ signal: controller.signal }` as the second argument to `searchPeople`.',
        hint: '`let controller = null` above the watcher. Inside: `controller?.abort(); controller = new AbortController(); const people = await searchPeople(q, { signal: controller.signal })`. The console will print "✕ aborted".',
        tests: [
          {
            name: 'the older request is aborted and "ada" wins',
            code: `await type('.search', 'a')
await type('.search', 'ada')
await wait(600)
expect(requireModule('api.js').stats.aborted).toBeGreaterThanOrEqual(1)
expect(text('.results-for')).toContain('"ada"')`,
          },
        ],
        explain: 'Aborting makes the old promise reject instead of resolve, so its result can\'t be applied — and the (pretend) network work stops. Notice anything new on screen? That\'s the next experiment.',
      },
      {
        id: 'ignore-abort',
        task: 'With aborting in place, the red `.error` shows "The request was aborted." — but nothing went wrong; *you* cancelled it. In the `catch`, ignore errors whose `name` is `\'AbortError\'`, so no `.error` appears after a fast "a" → "ada".',
        hint: '`catch (e) { if (e.name === \'AbortError\') return; error.value = e.message }`. Also make sure the aborted run doesn\'t switch the spinner off for the newer one.',
        tests: [
          {
            name: 'an aborted request is not shown as an error',
            code: `await type('.search', 'a')
await type('.search', 'ada')
await wait(600)
expect(requireModule('api.js').stats.aborted).toBeGreaterThanOrEqual(1)
expect(exists('.error')).toBe(false)
expect(text('.results-for')).toContain('"ada"')`,
          },
        ],
        explain: 'Cancellation is a normal part of the flow, not a failure. Treating `AbortError` as an error is one of the most common mistakes after adding `AbortController`.',
      },
      {
        id: 'watcher-cleanup',
        task: 'Type **a** and immediately clear the box. The "a" results still pop up a moment later! Replace your manual `controller` variable with Vue\'s cleanup hook: create the controller **inside** the watcher and register `onWatcherCleanup(() => controller.abort())` before the `await` (import it from `\'vue\'`, Vue 3.5+).',
        hint: 'Vue runs the cleanup before *every* next run — including the early `return` for an empty box — and when the watcher stops. Compare with the **Cancel via watcher cleanup** variant.',
        tests: [
          {
            name: 'clearing the box cancels the pending search',
            code: `await type('.search', 'a')
await type('.search', '')
await wait(600)
expect(requireModule('api.js').stats.aborted).toBe(1)
expect(findAll('.person').length).toBe(0)
expect(exists('.results-for')).toBe(false)`,
          },
        ],
        explain: 'A manual controller only aborts when *you* remember to (at the start of the next search). The watcher cleanup runs whenever the run becomes outdated for any reason — a new value, an early return, or the component unmounting — so there\'s nothing to forget.',
      },
    ],
    variants: [
      { id: 'guard', label: 'Fix: request-id guard', files: { 'App.vue': guardApp, 'api.js': searchApi } },
      { id: 'abort', label: 'Fix: cancel via watcher cleanup (3.5+)', files: { 'App.vue': abortApp, 'api.js': searchApi } },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Ignore vs cancel',
    caption: 'Both stop stale results reaching the screen. Only one stops the work.',
    alt: 'Side-by-side code. Left: a request-id guard that increments latestId and drops results whose id is outdated. Right: a watcher that creates an AbortController, registers onWatcherCleanup to abort it, and ignores AbortError.',
    props: {
      left: {
        label: 'Ignore stale answers (guard)',
        lang: 'js',
        code: `let latestId = 0

watch(query, async (q) => {
  const id = ++latestId
  const people = await searchPeople(q)
  if (id !== latestId) return
  results.value = people
})`,
      },
      right: {
        label: 'Cancel old requests (abort)',
        lang: 'js',
        code: `watch(query, async (q) => {
  const controller = new AbortController()
  onWatcherCleanup(() => controller.abort())
  try {
    results.value = await searchPeople(q, { signal: controller.signal })
  } catch (e) {
    if (e.name !== 'AbortError') throw e
  }
})`,
      },
      points: [
        'The guard works with any promise — even APIs that don\'t accept a signal.',
        'Aborting stops the browser downloading responses nobody will use.',
        'With abort, stale results can\'t be assigned because the promise rejects instead.',
        'Abort needs `AbortError` handling; the guard needs every branch (catch, finally) to check the id.',
        'Watcher cleanup also cancels when the component unmounts — no extra code.',
      ],
    },
  },

  internals: {
    beginner: `
A promise can't be "un-started". Once you call \`searchPeople('a')\`, that answer *will* come back eventually, unless whatever is doing the work supports cancellation. The guard doesn't stop anything — it just labels each request so you know whether its answer is still wanted. \`AbortController\` is the browser's standard way to say "stop": the work listens to a signal and gives up when it fires.
`,
    technical: [
      `
**How abort travels.** \`controller.abort(reason?)\` sets \`signal.aborted = true\`, stores \`signal.reason\` (a \`DOMException\` named \`AbortError\` by default) and dispatches an \`abort\` event on the signal. \`fetch\` listens for it: it stops the request and rejects with the reason. Your own async functions can do the same — listen for \`abort\`, clean up timers, and reject. That's exactly what the pretend \`api.js\` does.

**When Vue runs watcher cleanups.** Each run of a watcher callback can register cleanups (\`onWatcherCleanup\` or the \`onCleanup\` argument). Vue stores them for that watcher and calls them **right before the callback runs again**, and **when the watcher is stopped** — calling the stop handle, or the owning component unmounting.
`,
      {
        code: `// Simplified model of the watcher job (not Vue's real source)
function runWatcherCallback(newValue) {
  runAndClear(cleanupsFor(watcher))   // previous run is now outdated
  activeWatcher = watcher             // onWatcherCleanup() attaches to this
  try {
    callback(newValue, oldValue, onCleanup)  // sync part runs here…
  } finally {
    activeWatcher = previous          // …so after the first await there's no active watcher
  }
}
watcher.onStop = () => runAndClear(cleanupsFor(watcher))`,
        lang: 'js',
        title: 'why onWatcherCleanup must come before await',
      },
      `
That's why \`onWatcherCleanup()\` must be called before the first \`await\`: after an \`await\`, the rest of your callback runs later, when Vue is no longer "inside" that watcher, and the call is ignored with a warning. The \`onCleanup\` argument is bound to its watcher, so it works anywhere — but registering after an \`await\` would be too late to cancel the thing you were awaiting.

**The loading flag race.** Even with correct results, \`finally { loading.value = false }\` in an *outdated* run can switch the spinner off while a newer run is still pending. Guard it (\`if (id === latestId)\` or \`if (!controller.signal.aborted)\`).
`,
    ],
    production: `
- **Use both techniques where it matters.** Abort to save bandwidth and server work; keep a guard (or abort-before-assign) as defence in depth, because not every async source supports signals.
- **Put cancellation in the composable.** A \`useSearch()\` / \`useFetch()\` that takes a reactive input and aborts on change and on unmount means every screen gets it for free.
- **Abort is not undo.** Aborting a \`POST\` stops the browser waiting; the server may already have created the order. Don't use abort to "cancel" mutations — design an explicit cancel endpoint, and prevent duplicate submits instead.
- **Give every request a timeout** (\`AbortSignal.timeout\` or a timer + controller), so a hung connection can't leave the UI waiting forever.
- **Don't report \`AbortError\` to monitoring** — filter it out, or your error dashboards fill with noise from every keystroke and navigation.
- **Libraries.** Data-fetching libraries such as TanStack Query (Vue Query) can pass an \`AbortSignal\` to your query function and drop outdated results for you; Axios accepts \`signal\` since v0.22 (its older \`CancelToken\` API is deprecated).
`,
  },

  mistakes: [
    {
      title: 'Believing debounce fixes the race',
      wrong: { code: `watch(debouncedQuery, async (q) => {\n  results.value = await search(q) // two requests can still finish out of order\n})`, lang: 'js' },
      right: { code: `watch(debouncedQuery, async (q) => {\n  const controller = new AbortController()\n  onWatcherCleanup(() => controller.abort())\n  results.value = await search(q, { signal: controller.signal })\n})`, lang: 'js' },
      explanation: 'Debouncing reduces the number of requests, but any two of them can still overlap. Ordering needs a guard or cancellation.',
    },
    {
      title: 'Showing AbortError as a failure',
      wrong: { code: `catch (e) {\n  error.value = e.message // "The user aborted a request."\n}`, lang: 'js' },
      right: { code: `catch (e) {\n  if (e.name === 'AbortError') return\n  error.value = e.message\n}`, lang: 'js' },
      explanation: 'You cancelled on purpose. An abort is a normal outcome, not something to show to the user or send to error monitoring.',
    },
    {
      title: 'Calling onWatcherCleanup after an await',
      wrong: { code: `watch(id, async (value) => {\n  const controller = new AbortController()\n  const user = await getUser(value, { signal: controller.signal })\n  onWatcherCleanup(() => controller.abort()) // too late — and warns\n})`, lang: 'js' },
      right: { code: `watch(id, async (value) => {\n  const controller = new AbortController()\n  onWatcherCleanup(() => controller.abort())\n  const user = await getUser(value, { signal: controller.signal })\n})`, lang: 'js' },
      explanation: 'Vue only knows which watcher is active during the synchronous part of the callback. Register cleanup first, then await.',
    },
    {
      title: 'Reusing one AbortController for every request',
      wrong: { code: `const controller = new AbortController()\nfunction load() {\n  controller.abort()\n  return fetch(url, { signal: controller.signal }) // already aborted → fails instantly\n}`, lang: 'js' },
      right: { code: `let controller = null\nfunction load() {\n  controller?.abort()\n  controller = new AbortController()\n  return fetch(url, { signal: controller.signal })\n}`, lang: 'js' },
      explanation: 'An aborted signal stays aborted. Every request needs its own controller.',
    },
    {
      title: 'Creating a controller but not passing its signal',
      wrong: { code: `const controller = new AbortController()\nonWatcherCleanup(() => controller.abort())\nresults.value = await fetch(url).then((r) => r.json()) // nothing listens to the signal`, lang: 'js' },
      right: { code: `results.value = await fetch(url, { signal: controller.signal }).then((r) => r.json())`, lang: 'js' },
      explanation: 'Aborting a controller only affects code that received its `signal`. Without it, the request carries on and its stale result is still assigned.',
    },
  ],

  debugging: [
    {
      symptom: 'Results sometimes don\'t match the search box — usually on slow networks.',
      cause: 'Out-of-order responses: an older, slower request is applied after a newer one.',
      fix: 'Reproduce with DevTools network throttling, then add a request-id guard or abort previous requests in the watcher cleanup.',
    },
    {
      symptom: '"AbortError: The user aborted a request" appears in the UI or in error monitoring.',
      cause: 'Intentional cancellations are treated as failures.',
      fix: 'Check `e.name === \'AbortError\'` in the `catch` and return quietly; filter it from error reporting.',
    },
    {
      symptom: 'Every request fails immediately with AbortError.',
      cause: 'A single controller is reused after it was aborted, or the signal was aborted before the request started.',
      fix: 'Create a new `AbortController` for each request.',
    },
    {
      symptom: 'Console warning: "onWatcherCleanup() was called when there was no active watcher to associate with."',
      cause: 'It was called after an `await`, or outside a watcher callback.',
      fix: 'Call it synchronously at the start of the callback, or use the `onCleanup` argument.',
    },
    {
      symptom: 'The spinner disappears while results are still loading.',
      cause: 'An outdated (or aborted) run\'s `finally` turned `loading` off.',
      fix: 'Only the latest run may update `loading`: check the request id or `controller.signal.aborted` in `finally`.',
    },
  ],

  bestPractices: [
    'Assume responses can arrive in any order whenever input can change while a request is in flight.',
    'Cancel outdated requests with a new `AbortController` per request; pass its `signal` all the way down.',
    'In watchers, register `onWatcherCleanup()` (3.5+) or `onCleanup` before the first `await`.',
    'Abort requests started in `onMounted`/handlers in `onUnmounted`.',
    'Treat `AbortError` as a normal outcome: no error message, no error report.',
    'Guard `loading` and error updates so only the latest request touches them.',
    'Don\'t use abort to undo a mutation — the server may already have done it.',
  ],

  useCases: [
    'Search-as-you-type and autocomplete inputs.',
    'Profile or detail panels where users click through items quickly.',
    'Filters and tabs that refetch on every change.',
    'Long exports or reports with a Cancel button.',
    'Leaving a page while its data is still loading.',
  ],

  whenToUse: {
    use: [
      'A guard whenever a later request should always win, especially if the API can\'t be cancelled.',
      'AbortController for fetch/Axios requests that can become irrelevant (input changes, navigation, user cancel).',
      'Watcher cleanup when the request is triggered by a watcher.',
      'Timeouts on every request that could hang.',
    ],
    avoid: [
      'Aborting mutations (POST/PUT/DELETE) as a way to undo them.',
      'Showing or logging `AbortError` as a failure.',
      'Relying on debounce alone to keep results in order.',
    ],
  },

  comparison: {
    title: 'Ways to deal with stale responses',
    headers: ['', 'Request-id guard', 'AbortController', 'Watcher cleanup + abort', 'Data library'],
    rows: [
      ['Stale result reaches the screen?', 'no (dropped)', 'no (promise rejects)', 'no', 'no'],
      ['Stops the network transfer?', 'no', 'yes', 'yes', 'typically, if you pass the signal through'],
      ['Needs the API to accept a signal?', 'no', 'yes', 'yes', 'yes (for cancellation)'],
      ['Cancels on unmount automatically?', 'no', 'only if you add it', 'yes', 'yes'],
      ['Version / dependency', 'none', 'browser API', '`onWatcherCleanup` 3.5+ (`onCleanup` 3.0+)', 'third-party'],
    ],
    note: 'In practice: abort in the watcher cleanup, and keep the guard in mind for anything that can\'t be cancelled.',
  },

  quiz: [
    {
      id: 'cancellation-race-conditions-q1',
      type: 'mcq',
      prompt: 'What is a "stale response" in a search UI?',
      options: [
        { text: 'A response that arrives after a newer request was sent, and would overwrite more recent results.' },
        { text: 'A response that was cached by the browser.', why: 'Caching is a different topic; a stale response here is about *ordering*.' },
        { text: 'A response with status 304 Not Modified.', why: '304 is a caching status code, unrelated to request ordering.' },
        { text: 'Any response that took longer than one second.', why: 'Slowness alone isn\'t the problem — it\'s being outdated when it arrives.' },
      ],
      answer: 0,
      explanation: 'A response is stale when the request it answers is no longer the latest one. Applying it shows data for a question the user is no longer asking.',
    },
    {
      id: 'cancellation-race-conditions-q2',
      type: 'output',
      prompt: '`search(\'a\')` takes 400 ms and `search(\'ada\')` takes 200 ms. Both are called back-to-back. What does `shown` end up as?',
      code: {
        lang: 'js',
        code: `let shown = ''

async function run(q) {
  const result = await search(q)
  shown = result
}

run('a')
run('ada')`,
      },
      options: ['results for "ada"', 'results for "a"', 'an empty string', 'it alternates randomly'],
      answer: 1,
      explanation: '"ada" resolves first (200 ms) and is assigned; then "a" resolves (400 ms) and overwrites it. Without a guard or cancellation, the *slowest* response wins, not the latest request.',
    },
    {
      id: 'cancellation-race-conditions-q3',
      type: 'bug',
      prompt: 'Switching profiles quickly still shows the wrong person, and the console warns "onWatcherCleanup() was called when there was no active watcher". Click the line in the wrong place.',
      code: {
        lang: 'js',
        code: `watch(userId, async (id) => {
  const controller = new AbortController()
  try {
    profile.value = await getProfile(id, { signal: controller.signal })
    onWatcherCleanup(() => controller.abort())
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e.message
  }
})`,
      },
      answerLine: 5,
      explanation: 'The cleanup is registered only after the request finished, which is too late to cancel it — and after an `await` Vue no longer knows which watcher is active. Move it right after creating the controller, before the `await`.',
    },
    {
      id: 'cancellation-race-conditions-q4',
      type: 'fill',
      prompt: 'Complete the cancellation code.',
      code: {
        lang: 'js',
        code: `const controller = new ___()
const res = await fetch('/api/users', { signal: controller.___ })

// later…
controller.abort()   // fetch rejects with an error named '___'`,
      },
      answer: [['AbortController'], ['signal'], ['AbortError']],
      explanation: 'You give fetch the controller\'s `signal`; `abort()` makes fetch reject with a `DOMException` whose `name` is `AbortError` (unless you pass a custom reason).',
    },
    {
      id: 'cancellation-race-conditions-q5',
      type: 'mcq',
      prompt: 'Select **all** statements that are true.',
      options: [
        { text: 'Debouncing a search box guarantees results are applied in order.', why: 'It reduces the number of requests; two overlapping ones can still finish out of order.' },
        { text: 'Vue runs watcher cleanups when the component that owns the watcher unmounts.' },
        { text: 'An AbortController can be reused for the next request after `abort()`.', why: 'Its signal stays aborted forever; new requests would fail immediately.' },
        { text: 'A request-id guard works even when the API doesn\'t support AbortSignal.' },
      ],
      answer: [1, 3],
      explanation: 'Watchers created in setup are stopped on unmount, which runs their cleanups. The guard doesn\'t need any API support — it only decides whether to use the result.',
    },
    {
      id: 'cancellation-race-conditions-q6',
      type: 'short',
      prompt: 'A user clicks **Place order**, then immediately navigates away, and your code aborts the POST in `onUnmounted`. Was the order placed? What does that teach you about aborting?',
      answer: 'Maybe. Aborting only stops the browser from waiting for (and reading) the response; the request may already have reached the server and been processed. So abort is fine for reads you no longer need, but it is not a way to undo a mutation — prevent duplicates, confirm the result on return, or provide an explicit cancel action on the server.',
    },
  ],

  exercises: [
    {
      id: 'stale-profile',
      title: 'Stop the wrong profile from winning',
      difficulty: 'intermediate',
      prompt: `
\`ProfileCard.vue\` watches its \`userId\` prop and loads that person's profile. Ada's profile (id 1) is slow, Grace's (id 2) is fast. Click **Ada** then **Grace** quickly: Grace appears… and is then replaced by Ada. Also, closing the panel doesn't cancel the request that's still running.

Fix **ProfileCard.vue** so that:

- each watcher run creates an \`AbortController\` and passes \`{ signal }\` to \`getProfile(id, { signal })\`;
- the previous run's request is **aborted** when \`userId\` changes **and** when the card unmounts (use \`onWatcherCleanup\` from \`'vue'\`, or the watcher's \`onCleanup\` argument);
- an \`AbortError\` is **not** shown in \`.error\`.

Tests click \`.pick-1\`, \`.pick-2\` and \`.close\`, read \`.profile-name\`, and check \`stats.aborted\` in api.js.
`,
      files: { 'App.vue': profileApp, 'ProfileCard.vue': profileStarter, 'api.js': profileApi },
      hints: [
        'Inside the watcher callback, right after the `if (!id) return`: `const controller = new AbortController()`.',
        'Register `onWatcherCleanup(() => controller.abort())` **before** the `await`, and pass `{ signal: controller.signal }` to `getProfile`.',
        'In the `catch`, only set `error.value` when `e.name !== \'AbortError\'`. Unmount cancellation comes for free: the watcher stops when the component unmounts, which runs the cleanup.',
      ],
      solution: {
        explanation: 'The watcher cleanup ties each request\'s lifetime to the run that started it. When `userId` changes, Vue cleans up the previous run (aborting Ada\'s request) before starting Grace\'s; when the card unmounts, the watcher stops and the same cleanup runs. Aborted promises reject, so a stale profile can never be assigned.',
        files: { 'App.vue': profileApp, 'ProfileCard.vue': profileSolution, 'api.js': profileApi },
      },
      tests: [
        {
          name: 'clicking Ada then Grace ends on Grace, with Ada\'s request aborted',
          code: `await click('.pick-1')
await click('.pick-2')
await wait(650)
expect(text('.profile-name')).toBe('Grace Hopper')
expect(requireModule('api.js').stats.aborted).toBe(1)
expect(exists('.error')).toBe(false)`,
        },
        {
          name: 'closing the panel aborts the pending request',
          code: `await click('.pick-1')
await click('.close')
await wait(650)
expect(requireModule('api.js').stats.aborted).toBe(1)`,
        },
        {
          name: 'a normal selection still loads the profile',
          code: `await click('.pick-3')
await wait(450)
expect(text('.profile-name')).toBe('Alan Turing')`,
        },
      ],
    },
    {
      id: 'cancel-button',
      title: 'A real Cancel button',
      difficulty: 'intermediate',
      prompt: `
Generating a report takes a while. The **Cancel** button exists but does nothing.

Make it work with an \`AbortController\`:

- \`button.generate\` starts the request and passes \`{ signal }\` to \`generateReport({ signal })\`;
- \`button.cancel\` is rendered **only while** the report is generating, and clicking it aborts the request;
- after cancelling, \`.status\` reads **Cancelled**, there is no \`.result\` and **no** \`.error\`;
- a report that completes shows \`.result\` ("Report ready: …").

Use a **new** controller for every generation, and cancel on unmount too.
`,
      files: { 'App.vue': reportStarter, 'api.js': reportApi },
      hints: [
        'Keep `let controller = null` in the script. In `generate()`, create `controller = new AbortController()` first and pass `{ signal: controller.signal }`.',
        '`cancel()` calls `controller?.abort()`. In the `catch`, check `e.name === \'AbortError\'` and set `status.value = \'cancelled\'` instead of an error.',
        'Add `v-if="status === \'running\'"` to the Cancel button and `onUnmounted(cancel)`.',
      ],
      solution: {
        explanation: 'The controller is the remote control for one request. Cancelling is a user choice, so it gets its own state (`cancelled`) rather than being reported as an error. A fresh controller per run matters: an aborted signal stays aborted, so reusing it would make the next generation fail instantly.',
        files: { 'App.vue': reportSolution, 'api.js': reportApi },
      },
      tests: [
        {
          name: 'a report that completes shows the result',
          code: `await click('.generate')
await wait(700)
expect(text('.result')).toContain('Report ready')`,
        },
        {
          name: 'cancelling shows "Cancelled" and no error',
          code: `await click('.generate')
await wait(100)
await click('.cancel')
await wait(700)
expect(text('.status')).toBe('Cancelled')
expect(exists('.result')).toBe(false)
expect(exists('.error')).toBe(false)
expect(requireModule('api.js').stats.aborted).toBe(1)`,
        },
        {
          name: 'the Cancel button only exists while generating',
          code: `expect(exists('.cancel')).toBe(false)
await click('.generate')
expect(exists('.cancel')).toBe(true)
await wait(700)
expect(exists('.cancel')).toBe(false)`,
        },
        {
          name: 'you can generate again after cancelling',
          code: `await click('.generate')
await wait(100)
await click('.cancel')
await wait(50)
await click('.generate')
await wait(700)
expect(text('.result')).toContain('Report ready')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'cancellation-race-conditions-stale-search',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Users of your search page sometimes see results that don\'t match what they typed. How do you diagnose and prevent stale responses in Vue?',
      answer: 'Reproduce with network throttling: an older, slower request resolves after a newer one and overwrites it. Prevent it by tying each request to the run that started it: in the watcher, create an `AbortController`, register `onWatcherCleanup(() => controller.abort())` (Vue 3.5+, or `onCleanup` before 3.5) before awaiting, pass the signal to fetch, and ignore `AbortError`. Where cancellation isn\'t possible, use a request-id guard so only the latest request may assign results. Debouncing helps volume but not ordering.',
      explanation: 'Fix the ordering at the point where results are assigned, not by hoping responses come back in order.',
      whyAsked: 'The classic async bug in frontend interviews; it tests understanding of promises, watchers and cancellation together.',
      mistakes: ['Answering "debounce it" and stopping there.', 'Forgetting to handle AbortError.', 'Not mentioning how to reproduce (throttling).'],
      followUps: ['What happens to the loading spinner in your solution?', 'How would you build this into a composable?', 'What if the API doesn\'t support AbortSignal?'],
      modelAnswer: 'That\'s almost always a race: two requests overlap, and the older one resolves last and overwrites the newer results. I\'d confirm it with network throttling in DevTools. The fix is to make each request\'s result conditional on still being current. In the watcher I create an AbortController, register a cleanup with onWatcherCleanup before the await, and pass the signal to fetch — Vue aborts the previous run whenever the query changes or the component unmounts. I ignore AbortError in the catch and guard the loading flag. If the API can\'t be cancelled, a request counter that drops outdated results does the same job for correctness.',
    },
    {
      id: 'cancellation-race-conditions-abort-server',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What actually happens when you call `controller.abort()` on a fetch? Does the server stop processing the request?',
      answer: 'The browser stops the request on its side: if the response hasn\'t finished, it stops waiting and reading it, and the fetch promise (or a pending `res.json()`) rejects with an `AbortError` (or the reason you passed). The server may or may not notice the connection closing, and it may already have finished the work. So abort reliably saves the client work and bandwidth, but it is not a guarantee that the server didn\'t act — never treat it as an undo for mutations.',
      explanation: 'Cancellation is a client-side signal; server behaviour depends on timing and implementation.',
      whyAsked: 'Separates people who use AbortController mechanically from those who understand its guarantees.',
      mistakes: ['Claiming abort rolls back a POST.', 'Thinking an aborted request never reached the server.', 'Not knowing the rejection is an AbortError.'],
      followUps: ['How would you safely cancel an order?', 'What does AbortSignal.timeout() reject with?', 'Can you abort during `res.json()`?'],
      modelAnswer: 'Abort is a client-side signal. The browser stops the request — if headers haven\'t arrived the fetch rejects; if the body is still streaming, reading it rejects — with an AbortError. Whether the server notices depends on timing and its implementation; it may already have processed the request. So I use abort for reads that became irrelevant and for timeouts, but for mutations I prevent double submits and provide explicit server-side cancellation rather than pretending abort undoes anything.',
    },
    {
      id: 'cancellation-race-conditions-guard-vs-abort',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare a request-id ("latest wins") guard with AbortController. When would you use each?',
      answer: 'A guard numbers each request and only applies the result if it\'s still the latest; it works with any promise but doesn\'t stop the work. AbortController cancels the request, so the stale promise rejects and the browser stops downloading; it needs the API (fetch, Axios, your own code) to accept a signal and requires AbortError handling. Use abort when you can, a guard when you can\'t, and both for defence in depth.',
      explanation: 'One protects correctness; the other protects correctness *and* resources.',
      whyAsked: 'Checks trade-off reasoning rather than a single memorised pattern.',
      mistakes: ['Thinking the guard cancels anything.', 'Forgetting that the guard must also protect catch/finally.', 'Ignoring that third-party SDKs may not accept a signal.'],
      followUps: ['How do you guard the loading flag?', 'How does watcher cleanup relate to both?', 'What does TanStack Query do here?'],
      modelAnswer: 'The guard is pure bookkeeping: each request gets an id, and after awaiting I only assign the result if the id is still the latest. It works with any promise, even SDKs that can\'t be cancelled, but the old request still runs. AbortController actually cancels — the stale promise rejects, the browser stops the transfer, and requests can also be cancelled on unmount or timeout. It needs signal support and AbortError handling. In Vue I default to abort inside watcher cleanup and fall back to a guard for anything that can\'t take a signal.',
    },
    {
      id: 'cancellation-race-conditions-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Requests for id 1 take 300 ms, id 2 take 100 ms. The watcher runs for 1, then for 2 immediately after. What does `name.value` show at 500 ms?',
      code: {
        lang: 'js',
        code: `let latest = 0

watch(id, async (value) => {
  const ticket = ++latest
  const user = await getUser(value)
  if (ticket === latest) name.value = user.name
})`,
      },
      options: ['user 1\'s name', 'user 2\'s name', 'an empty string', 'it depends on the browser'],
      correctOption: 1,
      answer: 'User 2\'s name. The run for 2 takes ticket 2 and resolves first, assigning user 2. When user 1\'s response arrives, its ticket (1) is no longer the latest, so it is dropped.',
      explanation: 'The guard compares the run\'s ticket with the latest ticket at the moment the response arrives.',
      whyAsked: 'Tests whether you can trace async ordering precisely.',
      mistakes: ['Assuming the last response to arrive wins.', 'Thinking `latest` is captured per run (it\'s shared; `ticket` is per run).'],
      followUps: ['What would it show without the `if`?', 'Rewrite it with AbortController.'],
      modelAnswer: 'It shows user 2. The first run takes ticket 1, the second ticket 2, so `latest` is 2. User 2 resolves at 100 ms and passes the check; user 1 resolves at 300 ms but ticket 1 no longer equals `latest`, so it\'s ignored. Without the check, user 1 would overwrite it.',
    },
    {
      id: 'cancellation-race-conditions-watcher-cleanup',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Explain `onWatcherCleanup()` vs the `onCleanup` argument of watch callbacks. When do cleanups run, and why must `onWatcherCleanup` be called before the first `await`?',
      answer: '`onCleanup` (third argument of `watch` callbacks, first of `watchEffect`, Vue 3.0+) and `onWatcherCleanup()` (imported from vue, 3.5+) both register cleanup for the current run. Vue runs a run\'s cleanups right before the callback runs again and when the watcher is stopped (including component unmount). `onWatcherCleanup` finds the watcher through an "active watcher" that is only set during the synchronous part of the callback; after an `await` the callback resumes outside that context, so the call has no watcher to attach to (Vue warns). `onCleanup` is bound to its watcher, but registering after the await is too late to cancel the awaited work anyway.',
      explanation: 'Async functions run synchronously until the first await; Vue\'s "current watcher" only exists in that window.',
      whyAsked: 'Advanced Vue knowledge that directly affects correctness in async watchers and composables.',
      mistakes: ['Saying cleanups only run on unmount.', 'Not knowing the version requirement.', 'Calling it after await.'],
      followUps: ['How would you use it in a composable?', 'What about `onScopeDispose`?', 'How do you test that cleanup ran?'],
      modelAnswer: 'Both register a cleanup for the current run of a watcher. `onCleanup` has been the callback argument since Vue 3.0; `onWatcherCleanup` is a 3.5 import that does the same thing without threading the argument through. Vue calls the previous run\'s cleanups right before running the callback again, and when the watcher stops — which happens automatically on unmount for watchers created in setup. `onWatcherCleanup` relies on Vue knowing which watcher is currently executing, and that\'s only true during the synchronous part of the callback; after an await, Vue has moved on. So I always create the controller and register the cleanup first, then await.',
    },
    {
      id: 'cancellation-race-conditions-take-latest',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement `takeLatest(fn)` in **takeLatest.js**. It returns `run(...args)`, which aborts the previous call (if still pending), creates a new `AbortController`, and calls `fn(signal, ...args)`, returning its promise. `run.cancel()` aborts the current call. `fn` honours the signal (the provided `lookup` in api.js rejects with an `AbortError`).',
      starter: {
        files: {
          'App.vue': latestApp,
          'api.js': latestApi,
          'takeLatest.js': `// takeLatest.js
export function takeLatest(fn) {
  function run(...args) {
    return fn(undefined, ...args)
  }
  run.cancel = () => {}
  return run
}`,
        },
      },
      tests: [
        {
          name: 'a second call aborts the first',
          code: `const { takeLatest } = requireModule('takeLatest.js')
const { lookup, stats } = requireModule('api.js')
const run = takeLatest(lookup)
const first = run('one').then(() => 'resolved', (e) => e.name)
const second = run('two')
expect(await first).toBe('AbortError')
expect(await second).toBe('TWO')
expect(stats.aborted).toBe(1)`,
        },
        {
          name: 'cancel() aborts the pending call',
          code: `const { takeLatest } = requireModule('takeLatest.js')
const { lookup } = requireModule('api.js')
const run = takeLatest(lookup)
const p = run('one').then(() => 'resolved', (e) => e.name)
run.cancel()
expect(await p).toBe('AbortError')`,
        },
        {
          name: 'sequential calls both succeed',
          code: `const { takeLatest } = requireModule('takeLatest.js')
const { lookup, stats } = requireModule('api.js')
const run = takeLatest(lookup)
expect(await run('one')).toBe('ONE')
expect(await run('two')).toBe('TWO')
expect(stats.aborted).toBe(0)`,
        },
        {
          name: 'clicking quickly in the app shows the latest answer',
          code: `await click('.one')
await click('.two')
await wait(300)
expect(text('.answer')).toBe('TWO')`,
        },
      ],
      hints: ['Keep `let controller = null` in the closure.', 'In `run`: `controller?.abort()`, then `controller = new AbortController()`, then `return fn(controller.signal, ...args)`.', '`run.cancel = () => controller?.abort()`. Aborting a controller whose request already finished is harmless.'],
      answer: 'Keep the current controller in a closure; each call aborts it, creates a new one and passes its signal to `fn`. `cancel` aborts the current one.',
      solution: {
        files: {
          'App.vue': latestApp,
          'api.js': latestApi,
          'takeLatest.js': `// takeLatest.js
export function takeLatest(fn) {
  let controller = null

  function run(...args) {
    if (controller) controller.abort() // supersede the previous call
    controller = new AbortController()
    return fn(controller.signal, ...args)
  }

  run.cancel = () => {
    if (controller) controller.abort()
  }

  return run
}`,
        },
      },
      explanation: 'The closure remembers the in-flight controller. Because each call gets a fresh controller, aborting the old one never affects the new request, and aborting a finished request is a no-op.',
      whyAsked: 'A compact way to check closures, AbortController and API design for cancellation.',
      mistakes: ['Reusing one controller for all calls.', 'Swallowing the AbortError inside `run` so callers can\'t tell what happened.', 'Not passing the signal to `fn`.'],
      followUps: ['How would you make it ignore results without a signal-aware fn?', 'How would you use it from a Vue component and clean up on unmount?', 'How does this relate to RxJS switchMap?'],
      modelAnswer: 'I keep the current controller in a closure. Each call aborts the previous controller, creates a new one and passes its signal into `fn`, returning `fn`\'s promise so callers can await it and see an AbortError if they were superseded. `cancel` simply aborts the current controller, which I\'d call from `onUnmounted`. It\'s the same idea as RxJS\'s switchMap: only the latest call stays alive.',
    },
    {
      id: 'cancellation-race-conditions-spinner',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'After adding AbortController to a search, results are correct but the "Searching…" spinner sometimes disappears while a request is still running. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `watch(query, async (q, _, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())
  loading.value = true
  try {
    results.value = await search(q, { signal: controller.signal })
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e.message
  } finally {
    loading.value = false
  }
})`,
      },
      answer: 'When the query changes, the old run is aborted; its promise rejects and its `finally` runs — setting `loading = false` even though the new run is still pending. Only the current run should touch shared flags: `finally { if (!controller.signal.aborted) loading.value = false }` (or compare a request id).',
      explanation: 'Cancellation fixed the data race but not the race on the loading flag.',
      whyAsked: 'A realistic second-order bug that shows whether you reason about every shared write, not just the data.',
      mistakes: ['Removing `finally` and forgetting to reset on errors.', 'Setting loading true again with a timeout hack.', 'Not realising aborted runs still execute catch/finally.'],
      followUps: ['Would the same bug exist with a request-id guard?', 'How would a `status` enum change this?', 'How would you test it?'],
      modelAnswer: 'Aborting doesn\'t stop the old async function from finishing — it makes its await reject, so its catch and finally still run. The old run\'s finally sets loading to false while the new request is in flight. The fix is to let only the current run update shared state: check `controller.signal.aborted` in finally, or compare a request id. The same applies to error messages. A composable that owns status per request avoids repeating this everywhere.',
    },
  ],

  takeaways: [
    'Responses can arrive in any order; applying whatever arrives last shows stale data.',
    'A request-id guard drops outdated results and works with any promise.',
    '`AbortController` cancels: pass `signal`, call `abort()`, and the promise rejects with `AbortError` — which is not a real error.',
    'Use a new controller per request; abort on input change, on unmount and on timeout (`AbortSignal.timeout`).',
    'In watchers, register `onWatcherCleanup()` (3.5+) or `onCleanup` before the first `await`; Vue runs it before the next run and when the watcher stops.',
    'Guard shared flags (loading, error) too, and never treat abort as an undo for mutations.',
  ],
}
