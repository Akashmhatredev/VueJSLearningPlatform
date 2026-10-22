// Lesson: Loading, error & empty states.
// Runnable code talks to api.js, a pretend server with a "scenario" switch so every
// state can be forced on demand (no real network in the sandbox).

const directoryApi = `// api.js — a pretend server (simplified: in memory, no real network).
// Flip server.scenario to force each state your UI must handle.
const USERS = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral' },
  { id: 3, name: 'Alan Turing', role: 'Researcher' },
  { id: 4, name: 'Katherine Johnson', role: 'Mathematician' },
]

export const server = {
  scenario: 'ok', // 'ok' | 'empty' | 'error' | 'slow'
}

export function getUsers() {
  const scenario = server.scenario
  const delay = scenario === 'slow' ? 600 : 300
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (scenario === 'error') reject(new Error('The server had a problem (500). Please try again.'))
      else if (scenario === 'empty') resolve([])
      else resolve(USERS.map((u) => ({ ...u })))
    }, delay)
  })
}`

const playgroundApp = `<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, server } from './api.js'

const users = ref([])
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    users.value = await getUsers()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function simulate(scenario) {
  server.scenario = scenario
  load()
}

onMounted(load)
</script>

<template>
  <h2>Team directory</h2>

  <div class="dev-tools">
    Simulate:
    <button class="sim-ok" @click="simulate('ok')">Success</button>
    <button class="sim-empty" @click="simulate('empty')">Empty</button>
    <button class="sim-error" @click="simulate('error')">Error</button>
    <button class="sim-slow" @click="simulate('slow')">Slow</button>
  </div>

  <section class="results">
    <p v-if="loading" class="loading">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <ul v-else class="list">
      <li v-for="user in users" :key="user.id" class="user">
        {{ user.name }} — {{ user.role }}
      </li>
    </ul>
  </section>
</template>`

const finishedApp = `<script setup>
import { ref, computed, onMounted } from 'vue'
import { getUsers, server } from './api.js'

const users = ref([])
const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
const error = ref(null)

const isEmpty = computed(() => status.value === 'success' && users.value.length === 0)
const isRefreshing = computed(() => status.value === 'loading' && users.value.length > 0)
const announcement = computed(() => {
  if (status.value === 'loading') return 'Loading team…'
  if (status.value === 'success') return users.value.length + ' teammates loaded'
  return ''
})

async function load() {
  status.value = 'loading'
  error.value = null
  try {
    users.value = await getUsers()
    status.value = 'success'
  } catch (e) {
    error.value = e.message
    status.value = 'error'
  }
}

function simulate(scenario) {
  server.scenario = scenario
  load()
}

onMounted(load)
</script>

<template>
  <h2>Team directory</h2>
  <div class="dev-tools">
    Simulate:
    <button class="sim-ok" @click="simulate('ok')">Success</button>
    <button class="sim-empty" @click="simulate('empty')">Empty</button>
    <button class="sim-error" @click="simulate('error')">Error</button>
    <button class="sim-slow" @click="simulate('slow')">Slow</button>
  </div>

  <!-- Always in the page, so screen readers announce changes to its text -->
  <p class="visually-hidden" role="status">{{ announcement }}</p>

  <section class="results" :aria-busy="status === 'loading'">
    <ul v-if="status === 'loading' && !users.length" class="skeleton" aria-hidden="true">
      <li v-for="n in 3" :key="n" class="bone"></li>
    </ul>
    <div v-else-if="status === 'error'" class="error" role="alert">
      <p>{{ error }}</p>
      <button class="retry" @click="load">Try again</button>
    </div>
    <div v-else-if="isEmpty" class="empty">
      <p>No teammates yet.</p>
      <button class="invite">Invite your first teammate</button>
    </div>
    <template v-else>
      <p v-if="isRefreshing" class="refreshing">Refreshing…</p>
      <ul class="list">
        <li v-for="user in users" :key="user.id" class="user">{{ user.name }} — {{ user.role }}</li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.bone {
  height: 1rem;
  margin: 0.4rem 0;
  border-radius: 4px;
  background: #e6e2d8;
  list-style: none;
}
.error { color: #b3261e; }
.refreshing { font-size: 0.85rem; opacity: 0.7; }
</style>`

const statusStarter = `<script setup>
import { ref, onMounted } from 'vue'
import { getUsers, server } from './api.js'

const users = ref([])
const isLoading = ref(false)
const hasError = ref(false)

async function load() {
  isLoading.value = true
  try {
    users.value = await getUsers()
  } catch (e) {
    hasError.value = true
  }
  isLoading.value = false
}

onMounted(load)
</script>

<template>
  <button class="reload" @click="load">Reload</button>

  <p v-if="isLoading" class="loading">Loading…</p>
  <p v-if="hasError" class="error">Could not load the team.</p>
  <ul v-if="users.length" class="list">
    <li v-for="user in users" :key="user.id" class="user">{{ user.name }}</li>
  </ul>
  <p v-if="!isLoading && !hasError && users.length === 0" class="empty">No teammates yet.</p>
</template>`

const statusSolution = `<script setup>
import { ref, onMounted } from 'vue'
import { getUsers } from './api.js'

const users = ref([])
const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'

async function load() {
  status.value = 'loading'
  try {
    users.value = await getUsers()
    status.value = 'success'
  } catch (e) {
    status.value = 'error'
  }
}

onMounted(load)
</script>

<template>
  <button class="reload" @click="load">Reload</button>

  <p v-if="status === 'loading'" class="loading">Loading…</p>
  <p v-else-if="status === 'error'" class="error">Could not load the team.</p>
  <p v-else-if="status === 'success' && users.length === 0" class="empty">No teammates yet.</p>
  <ul v-else-if="status === 'success'" class="list">
    <li v-for="user in users" :key="user.id" class="user">{{ user.name }}</li>
  </ul>
</template>`

const useAsyncApp = `<script setup>
import { onMounted } from 'vue'
import { useAsync } from './useAsync.js'
import { getUsers } from './api.js'

const { data: users, error, status, run: load } = useAsync(getUsers)

onMounted(load)
</script>

<template>
  <button class="reload" @click="load">Reload</button>
  <p v-if="status === 'loading'" class="loading">Loading…</p>
  <p v-else-if="status === 'error'" class="error">{{ error.message }}</p>
  <ul v-else-if="status === 'success'" class="list">
    <li v-for="user in users" :key="user.id" class="user">{{ user.name }}</li>
  </ul>
</template>`

const useAsyncSolution = `// useAsync.js — wraps any async function in reactive status/data/error.
import { ref } from 'vue'

export function useAsync(fn) {
  const data = ref(null)
  const error = ref(null)
  const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'

  async function run(...args) {
    status.value = 'loading'
    error.value = null
    try {
      const result = await fn(...args)
      data.value = result
      status.value = 'success'
      return result
    } catch (e) {
      error.value = e
      status.value = 'error'
    }
  }

  return { data, error, status, run }
}`

const delayedSpinnerApi = `// api.js — pretend server; server.delay controls how long a request takes.
export const server = { delay: 100 }

export function getUsers() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([{ id: 1, name: 'Ada Lovelace' }, { id: 2, name: 'Alan Turing' }]), server.delay)
  })
}`

export default {
  id: 'async-ui-states',
  title: 'Loading, error & empty states',
  summary: 'Model every request as a small state machine — loading, success, empty, error — so the screen never lies about what is happening.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['fetching-data', 'conditional-rendering', 'computed'],
  related: ['search-pagination', 'cancellation-race-conditions', 'composables-intro', 'composable-recipes', 'suspense', 'accessibility-fundamentals', 'error-handling'],
  tags: ['loading state', 'error state', 'empty state', 'skeleton', 'spinner', 'retry', 'status', 'aria-busy', 'aria-live', 'useAsync'],
  apis: [
    { name: 'status ref', summary: 'One ref holding `\'idle\' | \'loading\' | \'success\' | \'error\'` instead of several booleans.' },
    { name: 'try / catch / finally', summary: '`finally` runs whether the request succeeded or failed — the place to stop a spinner.' },
    { name: 'aria-busy', summary: 'ARIA attribute telling assistive tech that a region is being updated.' },
    { name: 'role="status" / role="alert"', summary: 'Live regions: polite announcements for progress, assertive ones for errors.' },
    { name: 'onErrorCaptured()', summary: 'Lifecycle hook that catches errors thrown by descendant components — useful for error boundaries.' },
  ],
  docs: [
    { label: 'Vue Guide — Composables: async state example', url: 'https://vuejs.org/guide/reusability/composables.html#async-state-example' },
    { label: 'Vue Guide — Conditional rendering', url: 'https://vuejs.org/guide/essentials/conditional.html' },
    { label: 'Vue Guide — Suspense (experimental)', url: 'https://vuejs.org/guide/built-ins/suspense.html' },
    { label: 'API — onErrorCaptured()', url: 'https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured' },
    { label: 'MDN — ARIA live regions', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions' },
  ],

  intro: `
Every request has a *before*, a *during* and an *after* — and the after can go three ways: you got data, you got **no** data, or something went wrong.

An **async UI state** is simply which of those moments the screen is in. Good apps show each one on purpose: a **loading** state while waiting, the **data** when it arrives, a friendly **empty** state when there's nothing to show, and an **error** state with a way out ("Try again") when it fails.

In Vue this is ordinary reactive state — a ref or two and a \`v-if\` chain. The skill is modelling it so the states can't contradict each other.
`,

  why: `
If you only handle the happy path, users see a blank page while data loads, think it's broken, and leave. If the request fails, the page stays blank forever. If the list is legitimately empty, it looks identical to "still loading" or "failed".

All three are the screen **lying** about what is happening.

There's also a classic code smell: tracking each moment with its own boolean — \`isLoading\`, \`hasError\`, \`isEmpty\` — and forgetting to reset one. Suddenly the page shows an error *and* the data, or a spinner that never stops. Those combinations are called **impossible states**: they should never exist, but your data structure allows them.

This lesson gives you one model that rules them out, the matching template pattern, and the small accessibility touches that let screen-reader users know what's going on too.
`,

  eli15: `
Picture ordering food at a counter with a screen that shows your order number.

- While they cook, the screen says **"Preparing #42"** — that's the *loading* state.
- When it's ready: **"#42 ready!"** — the *success* state.
- If they've run out: **"Sorry, #42 — we're out of falafel. Pick something else?"** — the *error* state, with a way forward.
- And if you ordered nothing at all, the screen shouldn't flash "Preparing" forever — it should say **"No orders yet"**. That's the *empty* state.

The screen only ever shows **one** of those messages at a time. That's the trick: keep one variable that says which moment you're in, and let the screen follow it.
`,

  analogy: {
    title: 'The airport departures board',
    body: `
A departures board never shows a flight as both "Boarding" and "Cancelled". Each flight has exactly **one status** at a time — *Scheduled → Boarding → Departed*, or *Delayed*, or *Cancelled* — and the board just displays it.

When a flight is cancelled, the board doesn't go blank: it says what happened and tells you where to go next (rebooking desk). When there are no more flights tonight, it says so, instead of showing an empty board that looks broken.

Your component should be that board: one status per request, a clear message for each, and a next step when things go wrong.
`,
    mapping: [
      ['one status per flight', 'one `status` ref per request'],
      ['Scheduled / Boarding / Departed', '`idle` / `loading` / `success`'],
      ['Cancelled — go to the rebooking desk', '`error` state with a **Try again** button'],
      ['"No more departures tonight"', 'the empty state'],
      ['the board redraws itself', 'Vue re-renders when `status` changes'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'A request is a tiny state machine',
    caption: 'Every arrow is one line of code in your `load()` function. If a state has no arrow out of it (like an error with no retry), the user is stuck.',
    alt: 'A state machine. Idle goes to Loading when load() is called. Loading goes to Success when data arrives with items, to Empty when data arrives with zero items, and to Error when the request throws. Error goes back to Loading via Try again. Success goes to Refreshing (loading while old data stays visible) via reload, and Refreshing returns to Success.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'idle', label: 'idle', note: 'nothing asked yet', tone: 'paper', x: 80, y: 160 },
        { id: 'loading', label: 'loading', note: 'spinner / skeleton', tone: 'cobalt', x: 260, y: 160 },
        { id: 'success', label: 'success', note: 'show the list', tone: 'acid', x: 500, y: 60 },
        { id: 'empty', label: 'success, but empty', note: '"No teammates yet"', tone: 'kraft', x: 500, y: 160 },
        { id: 'error', label: 'error', note: 'message + Try again', tone: 'red', x: 500, y: 260 },
        { id: 'refreshing', label: 'refreshing', note: 'old data + small hint', tone: 'cobalt', x: 690, y: 60 },
      ],
      edges: [
        { from: 'idle', to: 'loading', label: 'load()' },
        { from: 'loading', to: 'success', label: 'items' },
        { from: 'loading', to: 'empty', label: '[]' },
        { from: 'loading', to: 'error', label: 'throws' },
        { id: 'retry', from: 'error', to: 'loading', label: 'Try again', dashed: true },
        { from: 'success', to: 'refreshing', label: 'reload' },
        { id: 'back', from: 'refreshing', to: 'success', label: 'fresh data', dashed: true },
      ],
      steps: [
        { focus: ['idle'], text: 'Before anything happens the request is **idle**. Many components skip straight to loading because they fetch on mount.' },
        { focus: ['loading'], edges: ['idle->loading'], text: '`load()` sets `status = \'loading\'`. The UI shows a spinner or a skeleton and marks the region `aria-busy="true"`.' },
        { focus: ['success', 'empty'], edges: ['loading->success', 'loading->empty'], text: 'Data arrived. **Empty is not an error** — it\'s a successful answer with zero items, and it deserves its own helpful message.' },
        { focus: ['error'], edges: ['loading->error'], text: 'The request threw. Show a human message — not a stack trace — and keep the user moving.' },
        { focus: ['error', 'loading'], edges: ['retry'], text: 'An error state without a way out is a dead end. A **Try again** button sends the machine back to loading.' },
        { focus: ['success', 'refreshing'], edges: ['success->refreshing', 'back'], text: 'Reloading data you already have? Keep the old list visible with a small "Refreshing…" hint instead of blanking the screen.' },
      ],
    },
  },

  syntax: [
    `
#### One status instead of many booleans

Store *which moment you're in* as a single value, and derive everything else with \`computed\`:
`,
    {
      code: `import { ref, computed } from 'vue'

const users = ref([])
const error = ref(null)
const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'

const isEmpty = computed(() => status.value === 'success' && users.value.length === 0)

async function load() {
  status.value = 'loading'
  error.value = null                 // a new attempt starts clean
  try {
    users.value = await getUsers()
    status.value = 'success'
  } catch (e) {
    error.value = e.message
    status.value = 'error'
  }
}`,
      lang: 'js',
      title: 'status-driven loading',
    },
    `
Because \`status\` can only hold one value, "loading *and* error" simply can't happen.

If you prefer booleans, that works too — but then **reset them in \`finally\`**, which runs whether the \`try\` succeeded or threw:
`,
    {
      code: `loading.value = true
try {
  users.value = await getUsers()
} catch (e) {
  error.value = e.message
} finally {
  loading.value = false   // runs on success AND on failure
}`,
      lang: 'js',
      title: 'boolean flags: always finally',
    },
    `
#### One v-if chain in the template

A \`v-if / v-else-if / v-else\` chain renders **exactly one** branch, which mirrors "exactly one state":
`,
    {
      code: `<section :aria-busy="status === 'loading'">
  <p v-if="status === 'loading'" class="loading">Loading…</p>

  <div v-else-if="status === 'error'" role="alert">
    <p>{{ error }}</p>
    <button @click="load">Try again</button>
  </div>

  <p v-else-if="isEmpty" class="empty">No teammates yet.</p>

  <ul v-else-if="status === 'success'">
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</section>`,
      lang: 'vue',
      title: 'one branch per state',
    },
    `
#### Accessibility in three attributes

- \`aria-busy="true"\` on the region being updated tells assistive technology "this is changing, wait".
- \`role="status"\` creates a **polite live region**: screen readers announce text changes inside it when they get a moment ("4 teammates loaded").
- \`role="alert"\` is an **assertive** live region for errors — announced right away.

Screen readers are most reliable at announcing changes to a live region that is **already in the page**. So prefer a permanent element whose *text* changes over inserting a brand-new \`role="status"\` element with \`v-if\`. See [Accessibility fundamentals](lesson:accessibility-fundamentals).
`,
    {
      callout: 'tip',
      title: 'Spinner or skeleton?',
      text: 'A *skeleton* is a grey placeholder shaped like the content that is coming. It avoids a layout jump when data arrives and feels faster for lists and cards. A spinner is fine for small actions (a button that is saving). For very fast responses, consider waiting a short moment before showing either — a spinner that flashes for a split second is just noise.',
    },
    {
      callout: 'version',
      text: '`<Suspense>` can show a fallback while async components resolve, but it is still **experimental** in Vue 3. The explicit status pattern here works everywhere and is what most production code uses.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: playgroundApp,
    intro: 'This is the playground\'s starting point: a decent loading/error setup with a few gaps you will close in the experiments.',
    steps: [
      { lines: [5, 7], text: 'Three pieces of state. `users` starts as an **empty array** — the same shape as the real data — so the template can safely read `users.length` before anything loads.' },
      { lines: [9, 11], text: 'A new attempt begins: switch the spinner on and **clear any old error**. Forgetting this reset is how "error and data at the same time" bugs are born.' },
      { lines: [12, 15], text: 'The request itself. On failure we keep a human-readable message. (Real code would map technical errors to friendly text — see [production errors](lesson:api-production).)' },
      { lines: [16, 18], text: '`finally` runs after **either** branch. If `loading.value = false` sat at the end of the `try`, any error would leave the spinner spinning forever.' },
      { lines: [21, 24], text: 'A developer toolbar: it flips the fake server\'s scenario and reloads, so you can see every state on demand. Real teams do the same with mock servers or Storybook.' },
      { lines: [26, 26], text: 'Load as soon as the component is on the page.' },
      { lines: [40, 48], text: 'A `v-if` chain shows exactly one branch. Notice what\'s missing: there is no empty state (an empty `<ul>` renders nothing), no retry, and every reload blanks the list.' },
    ],
  },

  playground: {
    title: 'Team directory: every state',
    objective: 'Use the Simulate buttons to force each state, then fill the gaps: empty state, retry, aria-busy, and keeping data visible while refreshing.',
    files: { 'App.vue': playgroundApp, 'api.js': directoryApi },
    expected: 'After a short **Loading…** the team list appears. **Empty** shows… nothing at all (that\'s the first gap). **Error** shows a message but no way out. **Slow** blanks the list for a while even though you already had data.',
    experiments: [
      {
        id: 'empty-state',
        task: 'Click **Empty**: the page goes blank, which looks broken. Add an empty state — an element with `class="empty"` saying something helpful like "No teammates yet." — that only shows when loading finished successfully with zero users.',
        hint: 'Add a branch before the `v-else` list: `<p v-else-if="users.length === 0" class="empty">No teammates yet.</p>`.',
        tests: [
          {
            name: 'an empty response shows the .empty message',
            code: `await wait(400)
await click('.sim-empty')
await wait(400)
expect(exists('.loading')).toBe(false)
expect(exists('.empty')).toBe(true)`,
          },
        ],
        explain: 'Empty is a **successful** answer — the server worked, there\'s just nothing to show. Saying so (and ideally offering a next step, like "Invite someone") turns a confusing blank into guidance.',
      },
      {
        id: 'retry',
        task: 'Click **Error**. Add a **Try again** button with `class="retry"` inside the error state that calls `load()` again.',
        hint: 'Wrap the error in a `<div v-else-if="error" class="error">` containing the message and `<button class="retry" @click="load">Try again</button>`.',
        tests: [
          {
            name: 'Try again recovers after the server comes back',
            code: `await wait(400)
await click('.sim-error')
await wait(400)
expect(exists('.error')).toBe(true)
requireModule('api.js').server.scenario = 'ok'
await click('.retry')
await wait(400)
expect(exists('.error')).toBe(false)
expect(findAll('.user').length).toBe(4)`,
          },
        ],
        explain: 'Most failures are temporary — a flaky connection, a server restart. A retry button turns a dead end into a one-click recovery. Because `load()` clears `error` at the start, the old message disappears as soon as the new attempt begins.',
      },
      {
        id: 'aria-busy',
        task: 'Tell assistive technology when the results are updating: bind `aria-busy` on the `<section class="results">` so it is `"true"` while loading.',
        hint: '`<section class="results" :aria-busy="loading">`. Vue renders `aria-busy="true"` / `aria-busy="false"`.',
        tests: [
          {
            name: 'aria-busy is "true" while loading and not afterwards',
            code: `await wait(400)
await click('.sim-slow')
expect(attr('.results', 'aria-busy')).toBe('true')
await wait(700)
expect(attr('.results', 'aria-busy')).not.toBe('true')`,
          },
        ],
        explain: 'Sighted users see the spinner; `aria-busy` gives screen readers the same information. Pair it with a `role="status"` region that announces "Loading…" and "4 teammates loaded" for a complete experience.',
      },
      {
        id: 'keep-data',
        task: 'Click **Slow** after the list has loaded: the list vanishes behind "Loading…" even though you already had data. Keep the existing list visible while reloading, and show a small hint with `class="refreshing"` instead. The big `.loading` message should only appear when there is no data yet.',
        hint: 'Show `.loading` only when `loading && users.length === 0`. In the list branch, add `<p v-if="loading" class="refreshing">Refreshing…</p>` above the `<ul>` (wrap both in a `<template v-else>`).',
        tests: [
          {
            name: 'old data stays visible with a .refreshing hint during a reload',
            code: `await wait(400)
await click('.sim-slow')
expect(findAll('.user').length).toBe(4)
expect(exists('.refreshing')).toBe(true)
await wait(700)
expect(exists('.refreshing')).toBe(false)
expect(findAll('.user').length).toBe(4)`,
          },
        ],
        explain: '"Loading for the first time" and "refreshing what I already have" are different states. Blanking the screen on every refresh makes the page flicker and loses the user\'s place; stale-but-visible data plus a subtle hint feels much calmer.',
      },
    ],
    variants: [
      {
        id: 'finished',
        label: 'Finished version (status + skeleton + live region)',
        files: { 'App.vue': finishedApp, 'api.js': directoryApi },
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Boolean soup vs one status',
    caption: 'Both versions work on the happy path. Only one makes contradictory states impossible.',
    alt: 'Side-by-side code. Left: three booleans isLoading, hasError and isEmpty, each set in different places, with a note that eight combinations exist and most are invalid. Right: a single status ref with four allowed values and a computed isEmpty.',
    props: {
      left: {
        label: 'Separate booleans',
        lang: 'js',
        code: `const isLoading = ref(false)
const hasError = ref(false)
const isEmpty = ref(false)

async function load() {
  isLoading.value = true
  try {
    users.value = await getUsers()
    isEmpty.value = users.value.length === 0
  } catch {
    hasError.value = true   // never reset!
  }
  isLoading.value = false   // skipped if an error is re-thrown
}`,
      },
      right: {
        label: 'One status',
        lang: 'js',
        code: `const status = ref('idle') // idle | loading | success | error
const isEmpty = computed(() =>
  status.value === 'success' && users.value.length === 0)

async function load() {
  status.value = 'loading'
  try {
    users.value = await getUsers()
    status.value = 'success'
  } catch {
    status.value = 'error'
  }
}`,
      },
      points: [
        'Three booleans allow 2 × 2 × 2 = 8 combinations; only a handful are meaningful.',
        'With booleans, every path must remember to reset every flag — the left version never clears `hasError`.',
        'A single `status` can hold only one value, so "loading and error" cannot exist.',
        'Derived facts like "empty" belong in `computed`, not in another flag you must keep in sync.',
      ],
    },
  },

  internals: {
    beginner: `
Vue doesn't know a request is happening — it only sees refs change. When you set \`status.value = 'loading'\`, the template re-renders and the \`v-if\` chain picks the loading branch. When the promise settles and you set \`'success'\` or \`'error'\`, it re-renders again and picks a different branch. The "state machine" is just you being disciplined about *which* values a ref may hold and *when* it changes.
`,
    technical: [
      `
**Why \`finally\` matters.** An \`await\` that rejects jumps straight to \`catch\`; any line after it in the \`try\` is skipped. Code placed after the whole \`try/catch\` is also skipped if the \`catch\` re-throws. \`finally\` is the only block guaranteed to run.

**Batching.** Setting \`status\` and \`error\` together in the same tick produces **one** re-render, because Vue queues component updates and flushes them in a microtask. You never see a half-updated screen between the two assignments.

**v-if chains.** The compiler turns a \`v-if / v-else-if / v-else\` chain into a single conditional expression in the render function, so exactly one branch's virtual nodes exist. Switching branches *unmounts* the old branch and mounts the new one (with \`v-show\` both would stay in the DOM).
`,
      {
        code: `// Roughly what the compiler generates for the chain (simplified)
return status === 'loading'
  ? h('p', { class: 'loading' }, 'Loading…')
  : status === 'error'
    ? h('div', { role: 'alert' }, [/* … */])
    : isEmpty
      ? h('p', { class: 'empty' }, 'No teammates yet.')
      : h('ul', users.map((u) => h('li', { key: u.id }, u.name)))`,
        lang: 'js',
        title: 'one expression, one branch',
      },
      `
**A reusable composable.** The pattern packs neatly into a composable — \`useAsync(fn)\` returning \`{ data, error, status, run }\`. Accepting refs or getters as inputs via \`toValue()\` (Vue 3.3+) lets it re-run when an id changes; the [Vue guide's useFetch example](https://vuejs.org/guide/reusability/composables.html#async-state-example) shows that idea. When inputs change quickly, an older request can finish *after* a newer one — that's the race condition handled in [Cancellation & race conditions](lesson:cancellation-race-conditions).
`,
    ],
    production: `
- **Standardise the shape.** Pick one representation (a \`status\` enum, or a library's \`isPending / isError / data\`) and use it everywhere so screens behave consistently.
- **Friendly, specific errors.** Map statuses and error kinds to messages users understand ("You're offline", "That page no longer exists") and log the technical details separately ([production errors](lesson:api-production)).
- **Keep stale data on refresh** and on refetch errors where it is still useful — show a banner rather than wiping the screen.
- **Avoid layout shift.** Skeletons sized like real content stop the page from jumping when data arrives.
- **Design the empty state.** It is often the first thing a new user sees: explain what will appear here and offer the action that fills it.
- **Error boundaries.** \`onErrorCaptured()\` in a parent can catch errors thrown in descendants (render, lifecycle hooks, watchers) and show a fallback for that part of the page; \`app.config.errorHandler\` is the last resort for logging.
- **Libraries.** Data-fetching libraries such as TanStack Query (Vue Query) provide these states, caching and retries out of the box — worth it once many screens fetch data. They are third-party, not part of Vue.
`,
  },

  mistakes: [
    {
      title: 'Turning the spinner off after the await instead of in finally',
      wrong: { code: `loading.value = true\ntry {\n  users.value = await getUsers()\n  loading.value = false      // skipped when getUsers() rejects\n} catch (e) {\n  error.value = e.message\n}`, lang: 'js' },
      right: { code: `loading.value = true\ntry {\n  users.value = await getUsers()\n} catch (e) {\n  error.value = e.message\n} finally {\n  loading.value = false\n}`, lang: 'js' },
      explanation: 'A rejected `await` jumps straight to `catch`, so the line after it never runs and the spinner spins forever. `finally` runs in every case.',
    },
    {
      title: 'Not clearing the old error on a new attempt',
      wrong: { code: `async function load() {\n  status.value = 'loading'\n  try {\n    users.value = await getUsers()\n    status.value = 'success'\n  } catch (e) {\n    error.value = e.message\n    status.value = 'error'\n  }\n}\n// template: <p v-if="error">…</p> <ul v-if="users.length">…</ul>`, lang: 'js' },
      right: { code: `async function load() {\n  status.value = 'loading'\n  error.value = null\n  // …\n}\n// template: one v-if / v-else-if chain driven by status`, lang: 'js' },
      explanation: 'If the template checks `error` independently, a stale message survives a successful retry and appears next to fresh data. Reset per attempt and drive the template from one status.',
    },
    {
      title: 'Treating "empty" like "loading" or like an error',
      wrong: { code: `<p v-if="!users.length">Loading…</p>\n<ul v-else>…</ul>`, lang: 'vue' },
      right: { code: `<p v-if="status === 'loading'">Loading…</p>\n<p v-else-if="isEmpty">No teammates yet.</p>\n<ul v-else>…</ul>`, lang: 'vue' },
      explanation: 'Using "no items" as the loading signal means an empty result spins forever. Loading is about *time*; empty is about *data*. Model them separately.',
    },
    {
      title: 'Starting with null and reading properties in the template',
      wrong: { code: `const users = ref(null)\n// <p>{{ users.length }} teammates</p> → TypeError on first render`, lang: 'vue' },
      right: { code: `const users = ref([])\n// or guard: <p v-if="users">{{ users.length }} teammates</p>`, lang: 'vue' },
      explanation: 'The template renders immediately, before the data arrives. Initialise with the shape you expect, or guard with `v-if`.',
    },
    {
      title: 'Swallowing errors silently',
      wrong: { code: `try {\n  users.value = await getUsers()\n} catch {\n  // ignore\n}`, lang: 'js' },
      right: { code: `try {\n  users.value = await getUsers()\n} catch (e) {\n  error.value = 'Could not load the team.'\n  console.error(e) // or report to your monitoring tool\n}`, lang: 'js' },
      explanation: 'An empty `catch` makes failures indistinguishable from "no data". Users get a blank screen and developers get no clue. Show something and log something.',
    },
  ],

  debugging: [
    {
      symptom: 'The spinner never disappears after a failed request.',
      cause: 'The flag is reset inside `try` after the `await`, which is skipped when the promise rejects.',
      fix: 'Reset it in `finally`, or switch to a single `status` that the `catch` sets to `\'error\'`.',
    },
    {
      symptom: 'An error message and the data are visible at the same time.',
      cause: 'Independent booleans/refs are checked by independent `v-if`s and one wasn\'t reset.',
      fix: 'Clear `error` at the start of each attempt and use one `v-if / v-else-if` chain driven by a status.',
    },
    {
      symptom: '`TypeError: Cannot read properties of null (reading \'length\')` on first render.',
      cause: 'The data ref starts as `null` and the template reads a property before the response arrives.',
      fix: 'Start with `ref([])` (or `ref({…})` with default fields), or guard the markup with `v-if`.',
    },
    {
      symptom: 'Empty results show "Loading…" forever.',
      cause: 'The template uses "no items" as the loading signal.',
      fix: 'Track loading separately from the data, then add a dedicated empty branch.',
    },
    {
      symptom: 'Screen-reader users hear nothing when data finishes loading.',
      cause: 'There is no live region, or a `role="status"` element is inserted at the same moment as its text.',
      fix: 'Keep a `role="status"` element in the page permanently and update its text; use `role="alert"` for errors.',
    },
  ],

  bestPractices: [
    'Model each request with one `status` value; derive `isEmpty`, `isRefreshing` and friends with `computed`.',
    'Reset per-attempt state (error, partial data) at the start of `load()`; stop spinners in `finally` if you use booleans.',
    'Render states with one `v-if / v-else-if / v-else` chain so only one can show.',
    'Give the error state a way out (Try again, Go back) and the empty state a next step.',
    'Keep old data visible while refreshing; reserve full-page loaders for the first load.',
    'Use `aria-busy` on updating regions, a persistent `role="status"` for progress and `role="alert"` for errors.',
    'Show human messages to users and log technical details for developers.',
  ],

  useCases: [
    'A search results page: loading skeleton, "no results for …", error with retry.',
    'A dashboard widget that refreshes every minute without blanking.',
    'A profile page that shows "This user doesn\'t exist" for a 404 instead of an endless spinner.',
    'A save button that shows "Saving…", then "Saved", or an inline error.',
    'An inbox whose empty state says "You\'re all caught up".',
  ],

  whenToUse: {
    use: [
      'Any time UI depends on something asynchronous — requests, file reads, timers.',
      'A `status` enum when a request has more than two outcomes (it almost always does).',
      'A `useAsync`-style composable once two or more components repeat the same pattern.',
    ],
    avoid: [
      'A full-page spinner for small background refreshes — use a subtle indicator.',
      'A separate boolean per state — it allows impossible combinations.',
      'Showing raw `error.message` from the network layer directly to users in production.',
      'Relying on `<Suspense>` alone for production loading states while it is experimental.',
    ],
  },

  comparison: {
    title: 'Ways to model async state',
    headers: ['', 'Separate booleans', 'One `status` ref', '`useAsync` composable', 'Data library (e.g. TanStack Query)'],
    rows: [
      ['Impossible states', 'possible', 'ruled out', 'ruled out', 'ruled out'],
      ['Boilerplate per screen', 'high', 'medium', 'low', 'low'],
      ['Caching / dedupe / retries', 'manual', 'manual', 'manual (you can add them)', 'built in'],
      ['Extra dependency', 'no', 'no', 'no', 'yes (third-party)'],
      ['Good for', 'tiny demos', 'a few screens', 'apps with many similar requests', 'data-heavy apps'],
    ],
    note: 'Start with a `status` ref; extract a composable when you repeat it. Caching and retries are covered in [Retries, caching, dedupe & polling](lesson:resilient-requests).',
  },

  quiz: [
    {
      id: 'async-ui-states-q1',
      type: 'mcq',
      prompt: 'Why is a single `status` ref (`\'idle\' | \'loading\' | \'success\' | \'error\'`) usually better than `isLoading` + `hasError` booleans?',
      options: [
        { text: 'It makes contradictory combinations like "loading and error" impossible.' },
        { text: 'Vue re-renders faster when there are fewer refs.', why: 'The difference in render cost is negligible; the benefit is correctness.' },
        { text: 'Booleans can\'t be used in `v-if`.', why: 'They can — the problem is keeping several of them consistent.' },
        { text: 'Strings are reactive and booleans are not.', why: 'Any value inside a ref is reactive.' },
      ],
      answer: 0,
      explanation: 'One value can only be in one state. With several booleans, every code path has to remember to reset every flag, and forgetting one produces impossible screens.',
    },
    {
      id: 'async-ui-states-q2',
      type: 'output',
      prompt: '`getUsers()` **rejects**. What is the value of `loading.value` afterwards?',
      code: {
        lang: 'js',
        code: `const loading = ref(false)

async function load() {
  loading.value = true
  try {
    users.value = await getUsers()
    loading.value = false
  } catch (e) {
    error.value = e.message
  }
}
await load()`,
      },
      options: ['`false`', '`true`', '`undefined`', 'It throws before `load()` returns'],
      answer: 1,
      explanation: 'The rejected `await` jumps to `catch`, skipping `loading.value = false`. The spinner stays on forever. Moving the reset into `finally` fixes it.',
    },
    {
      id: 'async-ui-states-q3',
      type: 'bug',
      prompt: 'After an error, clicking **Retry** loads the users — but the old error message is still shown above the list. Click the line that should change to fix it.',
      code: {
        lang: 'js',
        code: `async function load() {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}`,
      },
      answerLine: 2,
      explanation: 'A new attempt should start clean: add `error.value = null` next to `loading.value = true` (line 2). Even better, drive the template with one `v-if` chain so an error and the list can never render together.',
    },
    {
      id: 'async-ui-states-q4',
      type: 'fill',
      prompt: 'Complete the derived empty state and the polite live region.',
      code: {
        lang: 'vue',
        code: `const isEmpty = ___(() => status.value === 'success' && users.value.length === 0)

<!-- template -->
<p role="___">{{ announcement }}</p>`,
      },
      answer: [['computed'], ['status']],
      explanation: '"Empty" is derived from other state, so it\'s a `computed`. `role="status"` is a polite live region: screen readers announce changes to its text without interrupting.',
    },
    {
      id: 'async-ui-states-q5',
      type: 'mcq',
      prompt: 'A user filters a list and the server correctly returns `[]`. What should the UI show?',
      options: [
        { text: 'The loading spinner until data arrives.', why: 'Data *has* arrived — it\'s just empty. The spinner would never stop.' },
        { text: 'An error: "Something went wrong".', why: 'Nothing went wrong. Calling it an error sends users hunting for a problem that doesn\'t exist.' },
        { text: 'An empty state such as "No users match \'zz\'" with a way to clear the filter.' },
        { text: 'Nothing — an empty list is self-explanatory.', why: 'A blank area looks identical to "broken" or "still loading".' },
      ],
      answer: 2,
      explanation: 'Empty is a successful outcome that deserves its own message, ideally explaining why and offering the next action.',
    },
    {
      id: 'async-ui-states-q6',
      type: 'short',
      prompt: 'Your dashboard reloads its data every minute. Explain why blanking the widget with a big spinner on each reload is a poor experience, and what you would do instead.',
      answer: 'Blanking the widget makes it flicker, hides information the user was reading and shifts the layout every minute. "Refreshing data I already have" is a different state from "loading for the first time": keep the old data on screen, show a small refreshing indicator, and swap in the new data when it arrives (showing a non-blocking banner if the refresh fails).',
    },
  ],

  exercises: [
    {
      id: 'status-enum',
      title: 'Replace boolean soup with one status',
      difficulty: 'intermediate',
      prompt: `
This component tracks its request with \`isLoading\` and \`hasError\`. Try it: make the server fail, then reload again after it recovers — the error message never goes away, and it sits next to the list.

Refactor it to a single ref named **\`status\`** with the values \`'idle'\`, \`'loading'\`, \`'success'\` and \`'error'\`, so exactly one of these is rendered at a time:

- \`.loading\` while loading,
- \`.error\` when the last attempt failed,
- \`.empty\` when it succeeded with zero users,
- \`ul.list\` with one \`li.user\` per user when it succeeded with data.

Keep the \`button.reload\` that calls \`load()\`. The tests read \`state.status\` and flip \`server.scenario\` in **api.js** (\`'ok'\`, \`'empty'\`, \`'error'\`).
`,
      files: { 'App.vue': statusStarter, 'api.js': directoryApi },
      hints: [
        'Delete `isLoading` and `hasError`; add `const status = ref(\'idle\')`.',
        'In `load()`: set `\'loading\'` first, `\'success\'` after the await, `\'error\'` in the catch.',
        'In the template use one chain: `v-if="status === \'loading\'"`, `v-else-if="status === \'error\'"`, `v-else-if="status === \'success\' && users.length === 0"`, `v-else-if="status === \'success\'"`.',
      ],
      solution: {
        explanation: 'With one `status`, every attempt moves through exactly one path, and the `v-if` chain renders exactly one branch. The stale-error bug disappears without any extra "reset" code because there is nothing separate to reset.',
        files: { 'App.vue': statusSolution, 'api.js': directoryApi },
      },
      tests: [
        {
          name: 'shows only .loading first, then the list',
          code: `expect(state.status).toBe('loading')
expect(exists('.loading')).toBe(true)
expect(exists('.list')).toBe(false)
await wait(400)
expect(state.status).toBe('success')
expect(exists('.loading')).toBe(false)
expect(findAll('.user').length).toBe(4)`,
        },
        {
          name: 'an error replaces the list',
          code: `await wait(400)
requireModule('api.js').server.scenario = 'error'
await click('.reload')
await wait(400)
expect(state.status).toBe('error')
expect(exists('.error')).toBe(true)
expect(exists('.list')).toBe(false)`,
        },
        {
          name: 'a successful reload after an error clears the error',
          code: `const { server } = requireModule('api.js')
await wait(400)
server.scenario = 'error'
await click('.reload')
await wait(400)
server.scenario = 'ok'
await click('.reload')
await wait(400)
expect(exists('.error')).toBe(false)
expect(findAll('.user').length).toBe(4)`,
        },
        {
          name: 'an empty response shows only .empty',
          code: `await wait(400)
requireModule('api.js').server.scenario = 'empty'
await click('.reload')
await wait(400)
expect(exists('.empty')).toBe(true)
expect(exists('.list')).toBe(false)
expect(exists('.error')).toBe(false)`,
        },
      ],
    },
    {
      id: 'use-async',
      title: 'Extract a useAsync composable',
      difficulty: 'intermediate',
      prompt: `
Turn the pattern into a reusable **composable** in \`useAsync.js\`:

\`useAsync(fn)\` returns \`{ data, error, status, run }\` where \`data\`, \`error\` and \`status\` are refs:

- initially \`data = null\`, \`error = null\`, \`status = 'idle'\`;
- \`run(...args)\` sets \`status\` to \`'loading'\` and clears \`error\` **synchronously** (before awaiting), then calls \`fn(...args)\`;
- on success: \`data\` = the result, \`status = 'success'\`, and \`run\` resolves to the result;
- on failure: \`error\` = the thrown error object, \`status = 'error'\`, \`data\` keeps its previous value, and \`run\` **does not throw**.

\`App.vue\` already uses it (\`.loading\`, \`.error\`, \`li.user\`). Tests call the composable directly with \`withSetup()\` and also check the app.
`,
      files: {
        'App.vue': useAsyncApp,
        'api.js': directoryApi,
        'useAsync.js': `// useAsync.js
import { ref } from 'vue'

// TODO: return { data, error, status, run }
export function useAsync(fn) {
  const data = ref(null)

  return { data }
}`,
      },
      hints: [
        'Create three refs: `data`, `error` and `status` (starting at `\'idle\'`).',
        'Write `async function run(...args)` that sets `status.value = \'loading\'` and `error.value = null` **before** the `await`.',
        'Wrap `await fn(...args)` in try/catch: success sets `data` + `\'success\'` and returns the result; the catch stores the error and sets `\'error\'` without re-throwing.',
      ],
      solution: {
        explanation: 'The composable owns the state machine, so every component that loads something gets the same, correct behaviour. Setting `loading` before the first `await` matters: callers (and tests) can observe the loading state immediately after calling `run()`.',
        files: { 'App.vue': useAsyncApp, 'api.js': directoryApi, 'useAsync.js': useAsyncSolution },
      },
      tests: [
        {
          name: 'starts idle',
          code: `const { useAsync } = requireModule('useAsync.js')
const a = withSetup(() => useAsync(() => Promise.resolve(1)))
expect(a.status.value).toBe('idle')
expect(a.data.value).toBeNull()
expect(a.error.value).toBeNull()`,
        },
        {
          name: 'run() goes loading → success and resolves to the result',
          code: `const { useAsync } = requireModule('useAsync.js')
const a = withSetup(() => useAsync((n) => Promise.resolve(n * 2)))
const p = a.run(21)
expect(a.status.value).toBe('loading')
const result = await p
expect(result).toBe(42)
expect(a.status.value).toBe('success')
expect(a.data.value).toBe(42)`,
        },
        {
          name: 'a failure sets error, keeps old data and does not throw',
          code: `const { useAsync } = requireModule('useAsync.js')
let fail = false
const a = withSetup(() => useAsync(() => (fail ? Promise.reject(new Error('boom')) : Promise.resolve('first'))))
await a.run()
fail = true
let threw = false
try { await a.run() } catch (e) { threw = true }
expect(threw).toBe(false)
expect(a.status.value).toBe('error')
expect(a.error.value.message).toBe('boom')
expect(a.data.value).toBe('first')`,
        },
        {
          name: 'the app uses it to show the users',
          code: `await wait(400)
expect(findAll('.user').length).toBe(4)
requireModule('api.js').server.scenario = 'error'
await click('.reload')
await wait(400)
expect(exists('.error')).toBe(true)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'async-ui-states-handle-states',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you handle loading, error and empty states when a Vue component fetches data?',
      answer: 'Track the request\'s state explicitly — ideally one `status` ref (`idle/loading/success/error`) plus `data` and `error` refs — set it in a `try/catch` around the request, and render one branch per state with a `v-if / v-else-if` chain: a spinner or skeleton, an error message with a retry, an empty state when the data is an empty list, and the data otherwise.',
      explanation: 'Vue doesn\'t know a request is in flight; the component has to model it and the template follows.',
      code: {
        lang: 'vue',
        code: `<p v-if="status === 'loading'">Loading…</p>
<div v-else-if="status === 'error'" role="alert">
  {{ error }} <button @click="load">Try again</button>
</div>
<p v-else-if="users.length === 0">No users yet.</p>
<UserList v-else :users="users" />`,
      },
      whyAsked: 'It\'s the most common thing a frontend developer builds. Interviewers want to hear all the states, not just the happy path.',
      mistakes: ['Only mentioning a loading boolean.', 'Forgetting the empty state or the retry.', 'Resetting loading outside `finally`.'],
      followUps: ['How would you avoid impossible states?', 'What changes when the user refreshes data they already have?', 'How would you make this accessible?'],
      modelAnswer: 'I model the request explicitly. Usually that\'s a `status` ref with idle, loading, success and error, plus refs for the data and the error. `load()` sets loading, awaits the service call inside try/catch, and sets success or error. The template uses one v-if chain: a skeleton while loading, a friendly message with a Try again button on error, an empty state when the list is empty, and the list otherwise. Once two or three components repeat it, I extract a `useAsync` composable or use a data library.',
    },
    {
      id: 'async-ui-states-booleans-vs-status',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'A teammate tracks requests with `isLoading`, `isError` and `isSuccess` booleans. What would you suggest, and why?',
      answer: 'Replace them with a single status value. Three booleans allow eight combinations, most of them meaningless ("loading and error"), and every code path has to reset every flag. A single enum makes invalid combinations unrepresentable and simplifies the template to one chain. Derived conditions like "empty" become `computed`.',
      explanation: '"Make impossible states impossible" — design the data so bugs can\'t be expressed.',
      whyAsked: 'Tests state-modelling skill, which matters far beyond fetching.',
      mistakes: ['Saying booleans are "less performant".', 'Adding a fourth boolean to fix a bug caused by the first three.', 'Not mentioning derived state.'],
      followUps: ['How would you add a "refreshing" state?', 'How do libraries like TanStack Query expose this?', 'Would you use TypeScript to help here?'],
      modelAnswer: 'I\'d move to one `status` value. With independent booleans you can represent states that should never exist — loading and error at once — and every branch must remember to reset every flag, which is exactly where stale-error bugs come from. A single enum can only be one thing, so the template becomes one v-if chain. Anything derived, like "empty" or "refreshing", I\'d compute from status and data instead of storing. With TypeScript, a union type for status makes the compiler enforce it too.',
    },
    {
      id: 'async-ui-states-spinner-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'Users report the spinner sometimes never goes away. Here is the code. What\'s wrong?',
      code: {
        lang: 'js',
        code: `async function save() {
  saving.value = true
  await api.saveProfile(form)
  saving.value = false
  toast('Saved!')
}`,
      },
      answer: 'When `api.saveProfile` rejects, the function stops at the `await` and throws; `saving.value = false` never runs, so the spinner stays forever (and the error is unhandled). Wrap it in `try/catch/finally`: reset `saving` in `finally`, show an error in `catch`.',
      explanation: 'A rejected `await` throws at that line; nothing after it in the same block runs.',
      whyAsked: 'Very common production bug; checks understanding of async control flow.',
      mistakes: ['Suggesting `nextTick` or a timeout.', 'Fixing the spinner but still swallowing the error.', 'Not noticing the unhandled rejection.'],
      followUps: ['Where would you show the error?', 'How do you prevent a double submit while saving?', 'How would you test this?'],
      modelAnswer: 'If the save request fails, the await throws and the function exits before `saving.value = false`, so the spinner sticks and the rejection is unhandled. I\'d wrap the call in try/catch/finally: the catch sets an error message the user can act on, and finally resets `saving` no matter what. While saving is true I\'d also disable the button to prevent double submits.',
    },
    {
      id: 'async-ui-states-refresh-ux',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A product list paginates and refreshes in the background. Designers complain the page "flashes" and jumps on every page change. How do you fix the experience?',
      answer: 'Distinguish the first load from subsequent loads. Use a skeleton sized like the real rows for the first load (no layout shift). On page changes and refreshes, keep the current rows visible (optionally dimmed) with a small progress indicator, then swap in the new rows. Optionally only show the indicator if the request takes longer than a short threshold, so fast responses don\'t flash. If a refresh fails, keep the old data and show a non-blocking error.',
      explanation: 'Loading-for-the-first-time and refreshing are different states and deserve different UI.',
      whyAsked: 'Shows product sense and attention to perceived performance, not just correctness.',
      mistakes: ['Replacing the whole list with a spinner on every change.', 'Ignoring layout shift.', 'Discarding data on refresh errors.'],
      followUps: ['How would you implement "only show the spinner after 200 ms"?', 'What about when the user goes to a page that\'s much shorter?', 'How do race conditions affect fast pagination?'],
      modelAnswer: 'I\'d split the loading state in two. On first load, a skeleton with the same dimensions as real rows, so nothing jumps when data arrives. On pagination or refresh, the existing rows stay on screen, maybe dimmed, with a small indicator; when the new page arrives we swap it in. For very fast responses I\'d delay the indicator slightly so it doesn\'t flash. And if a refresh fails, I keep the stale rows and show a banner rather than wiping the page. Fast pagination also needs protection against out-of-order responses.',
    },
    {
      id: 'async-ui-states-error-placement',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How would you decide where errors are shown in a large app — inline in the component, as a toast, or by a global handler? How does Vue help?',
      answer: 'Show errors where the user can act on them. Errors tied to a specific piece of UI (a list that failed to load, a form field the server rejected) belong inline with a retry or correction. Errors from background actions the user triggered elsewhere (a save that failed after navigating) suit a toast. Unexpected errors should be caught by a boundary and logged: `onErrorCaptured()` in a layout/section component can render a fallback for that subtree, and `app.config.errorHandler` reports anything uncaught to monitoring. Auth errors (401) are usually handled centrally by redirecting to login.',
      explanation: 'Locality: the closer the message to the cause, the easier it is to act on.',
      whyAsked: 'Assesses systems thinking about UX and error flows across an application.',
      mistakes: ['Toasting every error, including page-level failures that leave the page blank.', 'Not logging errors anywhere.', 'Claiming Vue has built-in error boundary components (it has the `onErrorCaptured` hook; you build the boundary).'],
      followUps: ['What does returning `false` from `onErrorCaptured` do?', 'How do you avoid showing the same error twice?', 'What should never appear in a user-facing error?'],
      modelAnswer: 'My rule is to show an error where the user can do something about it. If a list fails, the list area shows the error and a retry. If the server rejects a form field, that message goes next to the field. For background or fire-and-forget actions, a toast is fine. For unexpected errors I build boundaries: a section component uses `onErrorCaptured` to render a fallback for its subtree instead of breaking the whole page, and `app.config.errorHandler` sends everything uncaught to our monitoring. 401s are handled centrally in the HTTP layer. Users get friendly text; stack traces and request ids go to logs.',
    },
    {
      id: 'async-ui-states-delayed-spinner',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement a **delayed spinner**: the `.loading` element must only appear if the request is still pending **200 ms** after it started. Fast responses should never flash a spinner. The list (`li.user`) appears when the data arrives. Remember to clear the timer.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, onMounted } from 'vue'
import { getUsers } from './api.js'

const users = ref([])
const showSpinner = ref(false)

async function load() {
  showSpinner.value = true
  try {
    users.value = await getUsers()
  } finally {
    showSpinner.value = false
  }
}

onMounted(load)
</script>

<template>
  <p v-if="showSpinner" class="loading">Loading…</p>
  <ul>
    <li v-for="user in users" :key="user.id" class="user">{{ user.name }}</li>
  </ul>
</template>`,
          'api.js': delayedSpinnerApi,
        },
      },
      tests: [
        {
          name: 'a fast response (100 ms) never shows the spinner',
          code: `expect(exists('.loading')).toBe(false)
await wait(60)
expect(exists('.loading')).toBe(false)
await wait(200)
expect(exists('.loading')).toBe(false)
expect(findAll('.user').length).toBe(2)`,
        },
        {
          name: 'a slow response shows the spinner after ~200 ms, then the data',
          code: `await wait(200)
requireModule('api.js').server.delay = 600
await click('.reload')
expect(exists('.loading')).toBe(false)
await wait(350)
expect(exists('.loading')).toBe(true)
await wait(450)
expect(exists('.loading')).toBe(false)
expect(findAll('.user').length).toBe(2)`,
        },
      ],
      hints: [
        'Start a `setTimeout` for 200 ms that sets `showSpinner.value = true`, instead of setting it immediately.',
        'In `finally`, call `clearTimeout(timer)` *and* set `showSpinner.value = false`.',
        'The second test clicks a `button.reload` that calls `load()` — add one to the template.',
      ],
      answer: 'Schedule the spinner with a timer when the request starts; when the request settles, clear the timer and hide the spinner. If the response beats the timer, the spinner never appears.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getUsers } from './api.js'

const users = ref([])
const showSpinner = ref(false)
let timer = null

async function load() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    showSpinner.value = true
  }, 200)
  try {
    users.value = await getUsers()
  } finally {
    clearTimeout(timer)
    showSpinner.value = false
  }
}

onMounted(load)
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <button class="reload" @click="load">Reload</button>
  <p v-if="showSpinner" class="loading">Loading…</p>
  <ul>
    <li v-for="user in users" :key="user.id" class="user">{{ user.name }}</li>
  </ul>
</template>`,
          'api.js': delayedSpinnerApi,
        },
      },
      explanation: 'The timer turns "show a spinner" into "show a spinner *if this is taking a while*". Clearing it in `finally` (and on unmount) guarantees a late timer can\'t switch the spinner on after the data has already arrived.',
      whyAsked: 'Combines async control flow, timers, cleanup and UX judgement in a small task.',
      mistakes: ['Forgetting to clear the timer, so the spinner appears *after* the data.', 'Not clearing on unmount.', 'Using a fixed minimum spinner duration that slows down fast responses.'],
      followUps: ['Some teams also enforce a minimum spinner duration once shown — why?', 'How would you turn this into a composable?', 'How would you test it without real waiting? (fake timers)'],
      modelAnswer: 'When `load()` starts, I schedule a 200 ms timer that switches the spinner on, rather than switching it on immediately. In `finally` I clear that timer and hide the spinner, so a fast response cancels the spinner before it ever appears. I also clear the timer on unmount so it can\'t fire on a dead component. In a real codebase I\'d put this in a composable and test it with fake timers.',
    },
    {
      id: 'async-ui-states-a11y',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'An accessibility audit says screen-reader users don\'t know when search results finish loading or when loading fails. What changes do you make?',
      answer: 'Mark the results region with `aria-busy="true"` while loading. Add a live region that stays in the DOM — e.g. a visually hidden `<p role="status">` — and update its text: "Searching…", then "12 results" or "No results for \'zz\'". Render errors in a `role="alert"` element (assertive). Make sure the retry button is reachable by keyboard, and avoid moving focus unexpectedly; if focus must move (e.g. to an error summary), do it deliberately.',
      explanation: 'Visual spinners are invisible to screen readers; live regions are how dynamic changes are announced.',
      whyAsked: 'Accessibility is increasingly a hard requirement; async UI is where it\'s most often missed.',
      mistakes: ['Adding `aria-live` to a node inserted at the same moment as its content (often not announced).', 'Announcing every keystroke.', 'Making every update assertive.'],
      followUps: ['What\'s the difference between polite and assertive?', 'How would you avoid announcement spam while typing?', 'How would you test this automatically?'],
      modelAnswer: 'First, the results container gets `aria-busy` while a request is in flight. Then I add a persistent, visually hidden live region with `role="status"` and change its text as the state changes — "Searching…", "12 results", "No results for zz". Because the element already exists, screen readers reliably announce the change. Errors go into a `role="alert"` region so they\'re announced immediately, with a keyboard-reachable retry. I\'d debounce announcements so typing doesn\'t produce a flood, and verify with a real screen reader as well as automated checks.',
    },
  ],

  takeaways: [
    'Every request has states: idle, loading, success (with data or empty) and error — design each one.',
    'Prefer one `status` ref over several booleans; derive `isEmpty`/`isRefreshing` with `computed`.',
    'Reset per-attempt state at the start; if you use booleans, stop spinners in `finally`.',
    'Render with one `v-if / v-else-if` chain; give errors a retry and empty states a next step.',
    'Keep stale data visible while refreshing; use skeletons to avoid layout shift.',
    'Use `aria-busy`, a persistent `role="status"` live region and `role="alert"` so everyone knows what\'s happening.',
  ],
}
