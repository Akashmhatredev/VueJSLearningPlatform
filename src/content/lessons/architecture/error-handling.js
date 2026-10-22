// Lesson: Error handling patterns (Level 15 — Vue Project Architecture)

// ---------------------------------------------------------------- playground

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// TODO (experiment 3): add app.config.errorHandler here —
// the last line of defence for errors no boundary handled.

app.mount('#app')`

const errorReporterJs = `import { reactive, ref } from 'vue'

// Simplified stand-in for a monitoring service (an error-tracking product,
// or your own logging endpoint). Real code would send these to a server —
// without personal data — instead of keeping them in memory.
export const reports = reactive([])

export function reportError(error, context = {}) {
  reports.push({
    name: (error && error.name) || 'Error',
    message: String((error && error.message) || error),
    ...context,
  })
  console.error('[report]', (error && error.name) + ': ' + (error && error.message), context.info ? '(' + context.info + ')' : '')
}

// A friendly, app-wide message the shell can show (never a stack trace).
export const globalError = ref(null)`

const apiErrorJs = `// One error type for everything that goes wrong talking to the server.
export class ApiError extends Error {
  constructor({ status, code, message, userMessage, cause }) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status // HTTP status, or 0 when there was no response at all
    this.code = code // machine-readable: 'NETWORK', 'HTTP_503', 'MAINTENANCE'…
    this.userMessage = userMessage // safe to show to humans
  }
}

export function userMessageFor(status) {
  if (status === 401) return 'Please sign in again.'
  if (status === 403) return "You don't have permission to see this."
  if (status === 404) return "We couldn't find what you were looking for."
  if (status >= 500) return 'The server is having trouble. Please try again in a moment.'
  return 'Something went wrong. Please try again.'
}`

const apiJs = `import { reactive } from 'vue'
import { ApiError, userMessageFor } from './apiError.js'

// Demo control: 'ok' | 'server-error' | 'offline'
export const fakeNetwork = reactive({ mode: 'ok' })

// Simplified stand-in for fetch(): rejects with a TypeError when "offline",
// resolves with a non-ok response for server errors — just like fetch().
function fakeFetch() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fakeNetwork.mode === 'offline') reject(new TypeError('Failed to fetch'))
      else if (fakeNetwork.mode === 'server-error')
        resolve({ ok: false, status: 503, json: async () => ({ code: 'MAINTENANCE', message: 'db-primary unreachable: connection pool exhausted' }) })
      else resolve({ ok: true, status: 200, json: async () => ({ visitors: 1284, signups: 37 }) })
    }, 100)
  })
}

// Every failure leaves this function as an ApiError.
async function request(url) {
  let res
  try {
    res = await fakeFetch(url)
  } catch (cause) {
    // TODO (experiment 2): no response at all (offline, DNS, CORS…).
    throw cause
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError({
      status: res.status,
      code: body.code || 'HTTP_' + res.status,
      message: body.message || 'Request failed with status ' + res.status, // for logs
      userMessage: userMessageFor(res.status), // for people
    })
  }
  return res.json()
}

export function fetchStats() {
  return request('/api/stats')
}`

const errorBoundaryVue = `<script setup>
import { ref, onErrorCaptured } from 'vue'
import { reportError } from '../services/errorReporter.js'

const props = defineProps({
  name: { type: String, default: 'This section' },
})
const error = ref(null)

// Runs when ANY descendant throws (render, setup, hooks, watchers, handlers).
onErrorCaptured((err, instance, info) => {
  error.value = err
  reportError(err, { info, boundary: props.name })
  // TODO (experiment 1): stop the error from bubbling further
})

function reset() {
  error.value = null // the v-else branch is re-created: a fresh child
}
</script>

<template>
  <slot v-if="error" name="fallback" :error="error" :reset="reset">
    <div class="boundary-fallback" role="alert">
      <p>{{ name }} couldn't be displayed.</p>
      <button class="retry" @click="reset">Try again</button>
    </div>
  </slot>
  <slot v-else />
</template>`

const errorBoundaryFixed = `<script setup>
import { ref, onErrorCaptured } from 'vue'
import { reportError } from '../services/errorReporter.js'

const props = defineProps({
  name: { type: String, default: 'This section' },
})
const error = ref(null)

onErrorCaptured((err, instance, info) => {
  error.value = err
  reportError(err, { info, boundary: props.name })
  return false // handled here: don't bubble to outer boundaries or the app handler
})

function reset() {
  error.value = null
}
</script>

<template>
  <slot v-if="error" name="fallback" :error="error" :reset="reset">
    <div class="boundary-fallback" role="alert">
      <p>{{ name }} couldn't be displayed.</p>
      <button class="retry" @click="reset">Try again</button>
    </div>
  </slot>
  <slot v-else />
</template>`

const weatherWidgetVue = `<script setup>
import { ref } from 'vue'

const forecast = ref({ city: 'Lisbon', today: { temp: 21, sky: 'Sunny' } })

function corrupt() {
  // Simulates a malformed API payload: "today" is suddenly null.
  forecast.value = { city: 'Lisbon', today: null }
}
</script>

<template>
  <section class="widget weather-widget">
    <h2>Weather — {{ forecast.city }}</h2>
    <p class="temp">{{ forecast.today.temp }}°C, {{ forecast.today.sky }}</p>
    <button class="break-weather" @click="corrupt">Simulate a bad payload</button>
  </section>
</template>`

const statsWidgetVue = `<script setup>
import { ref, onMounted } from 'vue'
import { fetchStats } from '../services/api.js'
import { ApiError } from '../services/apiError.js'

const stats = ref(null)
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    stats.value = await fetchStats()
  } catch (e) {
    if (!(e instanceof ApiError)) throw e // unexpected → let a boundary handle it
    error.value = e.userMessage // expected → handle it right here
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="widget widget-stats">
    <h2>Today</h2>
    <p v-if="loading" class="stats-loading">Loading…</p>
    <p v-else-if="error" class="stats-error" role="alert">{{ error }}</p>
    <p v-else-if="stats" class="stats-values">{{ stats.visitors }} visitors · {{ stats.signups }} sign-ups</p>
    <button class="reload-stats" :disabled="loading" @click="load">Reload</button>
  </section>
</template>`

const notesWidgetVue = `<script setup>
import { ref } from 'vue'

const draft = ref('Remember to return false')
const notes = ref(['Wrap each widget in a boundary'])

function save() {
  // A bug on purpose: strings have no trimEverything() method.
  notes.value.push(draft.value.trimEverything())
  draft.value = ''
}
</script>

<template>
  <section class="widget notes-widget">
    <h2>Notes</h2>
    <ul>
      <li v-for="note in notes" :key="note" class="note">{{ note }}</li>
    </ul>
    <input v-model="draft" class="note-input" aria-label="New note" />
    <button class="save-note" @click="save">Save</button>
  </section>
</template>`

const appVue = `<script setup>
import ErrorBoundary from './components/ErrorBoundary.vue'
import WeatherWidget from './components/WeatherWidget.vue'
import StatsWidget from './components/StatsWidget.vue'
import NotesWidget from './components/NotesWidget.vue'
import { reports, globalError } from './services/errorReporter.js'
import { fakeNetwork } from './services/api.js'

function openMenu() {
  // Outside every boundary — only app.config.errorHandler can catch this.
  throw new Error('Header menu config is missing')
}

function dismiss() {
  globalError.value = null
}
</script>

<template>
  <header class="app-header">
    <strong>Dashboard</strong>
    <button class="header-crash" @click="openMenu">Menu</button>
    <label>
      Network (demo):
      <select v-model="fakeNetwork.mode" class="network-mode">
        <option value="ok">ok</option>
        <option value="server-error">server error</option>
        <option value="offline">offline</option>
      </select>
    </label>
  </header>

  <p v-if="globalError" class="global-error" role="alert">
    {{ globalError }} <button @click="dismiss">Dismiss</button>
  </p>

  <ErrorBoundary name="The dashboard">
    <main class="dashboard">
      <ErrorBoundary name="Weather"><WeatherWidget /></ErrorBoundary>
      <ErrorBoundary name="Stats"><StatsWidget /></ErrorBoundary>
      <ErrorBoundary name="Notes"><NotesWidget /></ErrorBoundary>
    </main>
  </ErrorBoundary>

  <footer class="report-count">Errors reported: {{ reports.length }}</footer>
</template>`

const playgroundFiles = {
  'main.js': mainJs,
  'App.vue': appVue,
  'components/ErrorBoundary.vue': errorBoundaryVue,
  'components/WeatherWidget.vue': weatherWidgetVue,
  'components/StatsWidget.vue': statsWidgetVue,
  'components/NotesWidget.vue': notesWidgetVue,
  'services/errorReporter.js': errorReporterJs,
  'services/apiError.js': apiErrorJs,
  'services/api.js': apiJs,
}

// ---------------------------------------------------------------- exercise 1

const boundaryExerciseApp = `<script setup>
import { ref, onErrorCaptured } from 'vue'
import ErrorBoundary from './ErrorBoundary.vue'
import ClickBomb from './ClickBomb.vue'

const leaked = ref(0)
const lastInfo = ref('none')

// Counts errors that ESCAPE the boundary (it should stay at 0).
onErrorCaptured(() => {
  leaked.value++
  return false
})
</script>

<template>
  <ErrorBoundary @error="(err, info) => (lastInfo = info)">
    <ClickBomb />
  </ErrorBoundary>
  <p>Errors that escaped the boundary: <span class="leaked">{{ leaked }}</span></p>
  <p>Last reported source: <span class="last-info">{{ lastInfo }}</span></p>
</template>`

const clickBombVue = `<script setup>
import { ref } from 'vue'

const clicks = ref(0)

function explode() {
  throw new Error('Boom! (a bug in ClickBomb)')
}
</script>

<template>
  <div class="bomb">
    <p>Clicks: <span class="clicks">{{ clicks }}</span></p>
    <button class="count-up" @click="clicks++">+1</button>
    <button class="explode" @click="explode">Explode</button>
  </div>
</template>`

const boundaryStarter = `<script setup>
// TODO: turn this into an error boundary.
//  - catch errors from descendants with onErrorCaptured
//  - emit 'error' with (err, info)
//  - stop propagation
//  - render a fallback with a retry button
</script>

<template>
  <slot />
</template>`

const boundarySolution = `<script setup>
import { ref, onErrorCaptured } from 'vue'

const emit = defineEmits(['error'])
const error = ref(null)

onErrorCaptured((err, instance, info) => {
  error.value = err
  emit('error', err, info)
  return false
})

function reset() {
  error.value = null
}
</script>

<template>
  <slot v-if="error" name="fallback" :error="error" :reset="reset">
    <div class="fallback" role="alert">
      Something went wrong.
      <button class="retry" @click="reset">Try again</button>
    </div>
  </slot>
  <slot v-else />
</template>`

// ---------------------------------------------------------------- exercise 2

const normalizeApp = `<script setup>
import { ref } from 'vue'
import { toApiError } from './apiError.js'

const message = ref('')

const scenarios = {
  offline: () => new TypeError('Failed to fetch'),
  notFound: () => Object.assign(new Error('HTTP 404'), { status: 404, body: { code: 'ORDER_NOT_FOUND' } }),
  crash: () => Object.assign(new Error('HTTP 500'), { status: 500, body: { message: 'NullPointerException at OrderService.java:88' } }),
}

function simulate(name) {
  const apiError = toApiError(scenarios[name]())
  message.value = apiError.userMessage
}
</script>

<template>
  <button class="sim-offline" @click="simulate('offline')">Offline</button>
  <button class="sim-404" @click="simulate('notFound')">404</button>
  <button class="sim-500" @click="simulate('crash')">500</button>
  <p class="message" role="status">{{ message }}</p>
</template>`

const normalizeStarter = `export class ApiError extends Error {
  constructor({ status, code, message, userMessage, cause }) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.userMessage = userMessage
  }
}

// TODO: turn ANY thrown value into an ApiError (see the task for the rules).
export function toApiError(error) {
  return new ApiError({ status: 0, code: 'UNKNOWN', message: String(error), userMessage: String(error), cause: error })
}`

const normalizeSolution = `export class ApiError extends Error {
  constructor({ status, code, message, userMessage, cause }) {
    super(message, { cause })
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.userMessage = userMessage
  }
}

function userMessageFor(status) {
  if (status === 401) return 'Please sign in again.'
  if (status === 403) return "You don't have permission to do that."
  if (status === 404) return "We couldn't find what you were looking for."
  if (status >= 500) return 'The server is having trouble. Please try again in a moment.'
  return 'Something went wrong. Please try again.'
}

export function toApiError(error) {
  if (error instanceof ApiError) return error

  if (error && error.name === 'AbortError') {
    return new ApiError({ status: 0, code: 'ABORTED', message: 'Request aborted', userMessage: 'The request was cancelled.', cause: error })
  }

  if (error instanceof TypeError) {
    // fetch() rejects with a TypeError when there is no response at all
    return new ApiError({ status: 0, code: 'NETWORK', message: error.message, userMessage: 'You seem to be offline. Check your connection and try again.', cause: error })
  }

  if (error && typeof error.status === 'number') {
    const body = error.body || {}
    return new ApiError({
      status: error.status,
      code: body.code || 'HTTP_' + error.status,
      message: body.message || error.message, // technical detail: logs only
      userMessage: userMessageFor(error.status),
      cause: error,
    })
  }

  return new ApiError({ status: 0, code: 'UNKNOWN', message: String((error && error.message) || error), userMessage: 'Something went wrong. Please try again.', cause: error })
}`

// ---------------------------------------------------------------- interview coding

const asyncActionApp = `<script setup>
import { useAsyncAction } from './useAsyncAction.js'
import { saveProfile } from './api.js'

const { run, pending, error } = useAsyncAction(saveProfile)
</script>

<template>
  <button class="save" :disabled="pending" @click="run({ name: 'Ada' })">
    {{ pending ? 'Saving…' : 'Save profile' }}
  </button>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
</template>`

const asyncActionApi = `import { ApiError } from './ApiError.js'

// Fake endpoint: always answers "409 Conflict".
export function saveProfile() {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new ApiError({ status: 409, userMessage: 'Someone else changed this profile. Reload and try again.' })), 100),
  )
}`

const asyncActionApiError = `export class ApiError extends Error {
  constructor({ status, userMessage }) {
    super('ApiError ' + status)
    this.name = 'ApiError'
    this.status = status
    this.userMessage = userMessage
  }
}`

const asyncActionStarter = `import { ref } from 'vue'
import { ApiError } from './ApiError.js'

// TODO: return { run, pending, error }
export function useAsyncAction(action) {
  const pending = ref(false)
  const error = ref(null)

  async function run(...args) {
    return action(...args)
  }

  return { run, pending, error }
}`

const asyncActionSolution = `import { ref } from 'vue'
import { ApiError } from './ApiError.js'

export function useAsyncAction(action) {
  const pending = ref(false)
  const error = ref(null)

  async function run(...args) {
    pending.value = true
    error.value = null
    try {
      return await action(...args)
    } catch (e) {
      if (e instanceof ApiError) {
        error.value = e.userMessage // expected: show it
        return undefined
      }
      throw e // unexpected (a bug): let Vue's error handling see it
    } finally {
      pending.value = false
    }
  }

  return { run, pending, error }
}`

const asyncActionFiles = (composable) => ({
  'App.vue': asyncActionApp,
  'useAsyncAction.js': composable,
  'api.js': asyncActionApi,
  'ApiError.js': asyncActionApiError,
})

export default {
  id: 'error-handling',
  title: 'Error handling patterns',
  summary: 'Catch errors at the right level — in the service layer, in composables, in error boundaries with onErrorCaptured, and in app.config.errorHandler — and show people calm messages while the details go to your logs.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['lifecycle-hooks', 'slots', 'async-ui-states', 'service-layers'],
  related: ['service-layers', 'plugins-app-config', 'api-production', 'production-readiness', 'navigation-guards', 'design-patterns'],
  tags: ['errors', 'error boundary', 'onErrorCaptured', 'app.config.errorHandler', 'ApiError', 'monitoring', 'unhandledrejection', 'router.onError', 'fallback UI', 'retry'],
  apis: [
    { name: 'onErrorCaptured()', summary: 'Registers a hook called with (err, instance, info) when a descendant component throws. Return false to stop propagation.' },
    { name: 'app.config.errorHandler', summary: 'App-wide handler for errors that escape components (render, setup, hooks, watchers, event handlers…).' },
    { name: 'router.onError()', summary: 'Vue Router: registers a handler for unexpected errors during navigation, e.g. a lazy route chunk that fails to load.' },
  ],
  docs: [
    { label: 'Vue API — onErrorCaptured()', url: 'https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured' },
    { label: 'Vue API — app.config.errorHandler', url: 'https://vuejs.org/api/application.html#app-config-errorhandler' },
    { label: 'Vue — Production Error Code Reference', url: 'https://vuejs.org/error-reference/' },
    { label: 'Vue Router — router.onError()', url: 'https://router.vuejs.org/api/interfaces/Router.html#onError' },
    { label: 'MDN — unhandledrejection event', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event' },
  ],

  intro: `
Things go wrong. The network drops, a server has a bad day, an API sends \`null\` where you expected an object, or a teammate ships a typo. *Error handling* is deciding, ahead of time, **where each kind of failure is caught and what the user sees when it happens**.

Vue gives you two built-in catch points:

- **\`onErrorCaptured()\`** — a lifecycle hook that lets a component catch errors thrown by any component *below* it. A component built around it is called an **error boundary**: it swaps a broken section for a fallback.
- **\`app.config.errorHandler\`** — one app-wide handler for anything nobody else caught: the place to report errors to your logs.

Around those you build a few habits: services turn failures into one predictable error type (\`ApiError\`), composables handle the *expected* errors (offline, 404), and anything *unexpected* travels up to a boundary.
`,

  why: `
Without a plan, errors are handled in one of two bad ways.

**Not at all:** one widget hits \`Cannot read properties of null\`, and the user sees a half-drawn page, a frozen button, or nothing — while you never find out it happened.

**Everywhere, inconsistently:** every component has its own \`try/catch\`, some swallow errors silently (\`catch {}\`), some \`alert(err.message)\` so customers read *"pq: relation "orders" does not exist"*, some show stack traces.

A deliberate strategy fixes both:

- **Expected failures** (offline, 404, validation, "session expired") get handled close to where they happen, with a human message and a way forward.
- **Unexpected failures** (bugs) are contained: only the broken section is replaced, the rest of the page keeps working, and the details are reported so you can fix them.
- **Users never see internals.** Messages are calm and actionable; stack traces and server messages go to logs.
`,

  eli15: `
Picture a big office building with a fire-safety plan.

Every floor has **fire doors**. If a small fire starts in one room, the doors close: that room is sealed off, everyone else keeps working, and an alarm tells the safety team exactly which room it was. That's an **error boundary** — a broken part of the page gets replaced by a "this section couldn't load — try again" box, and the rest of the page is fine.

Some problems aren't fires at all — the coffee machine is empty. You don't evacuate for that; you put up a note: "Out of coffee, back soon." That's an **expected error** like "you're offline" — handled right where it happens, with a friendly message.

And the building has **one control room** that hears every alarm nobody else dealt with. That's **\`app.config.errorHandler\`**: the last line of defence, where every unhandled problem gets written down.

The golden rule: the people in the building get *clear instructions*, never the engineer's technical report.
`,

  analogy: {
    title: 'Fire doors, notices and the control room',
    body: `
A good building doesn't hope fires never happen — it plans for them. Small, expected issues get a note on the door. Real emergencies are contained by fire doors so one room doesn't take the whole building down. Every alarm reaches a central control room that keeps a log, so the cause can be found and fixed. And visitors only ever hear "please use the other staircase", never "the 3B junction box shorted on phase two".
`,
    mapping: [
      ['"out of coffee" note on the door', 'an expected error handled locally: `error.value = e.userMessage`'],
      ['a fire door sealing one room', 'an error boundary (`onErrorCaptured`) showing a fallback for one section'],
      ['the door closing so the alarm doesn\'t spread', '`return false` — stop propagation to outer boundaries'],
      ['the central control room', '`app.config.errorHandler` — last line of defence + reporting'],
      ['the incident log', 'your monitoring/logging service'],
      ['"please use the other staircase"', 'the user-facing message (`userMessage`)'],
      ['the engineer\'s technical report', 'the stack trace and server message — logs only'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Where does a thrown error go?',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'widget', label: 'WeatherWidget', note: 'throws during render', tone: 'red', x: 110, y: 270 },
        { id: 'inner', label: 'ErrorBoundary "Weather"', note: 'onErrorCaptured', tone: 'cobalt', x: 110, y: 160 },
        { id: 'outer', label: 'ErrorBoundary "Dashboard"', note: 'onErrorCaptured', tone: 'cobalt', x: 110, y: 55 },
        { id: 'app', label: 'app.config.errorHandler', note: 'last line of defence', tone: 'ink', x: 420, y: 55 },
        { id: 'console', label: 'Vue logs it', note: 'console.error / dev warning', tone: 'paper', x: 650, y: 55 },
        { id: 'fallback', label: 'Fallback UI', note: '"Weather couldn\'t be displayed"', tone: 'acid', x: 420, y: 200 },
        { id: 'report', label: 'reportError()', note: 'monitoring', tone: 'kraft', x: 650, y: 200 },
      ],
      edges: [
        { from: 'widget', to: 'inner', label: 'nearest ancestor first' },
        { from: 'inner', to: 'fallback', label: 'error.value = err' },
        { from: 'inner', to: 'report' },
        { id: 'bubble', from: 'inner', to: 'outer', label: 'only if not return false', dashed: true },
        { id: 'toapp', from: 'outer', to: 'app', label: 'still not stopped', dashed: true },
        { id: 'tolog', from: 'app', to: 'console', label: 'no handler set', dashed: true },
      ],
      steps: [
        { focus: ['widget'], text: '`WeatherWidget` tries to read `forecast.today.temp` while `today` is `null`. Its render function throws a `TypeError`.' },
        { focus: ['widget', 'inner'], edges: ['widget->inner'], text: 'Vue catches it and walks **up the parent chain**, calling each ancestor\'s `onErrorCaptured(err, instance, info)` — nearest first. The component that threw never gets its *own* hook called.' },
        { focus: ['inner', 'fallback', 'report'], edges: ['inner->fallback', 'inner->report'], text: 'The nearest **boundary** stores the error (its template swaps to the fallback) and reports it. The broken widget is no longer rendered — only this section changes.' },
        { focus: ['inner', 'outer'], edges: ['bubble'], text: 'If the hook **doesn\'t return `false`**, the error keeps bubbling: the outer "Dashboard" boundary catches it too, and replaces the *whole* dashboard. That\'s rarely what you want.' },
        { focus: ['outer', 'app'], edges: ['toapp'], text: 'Still not stopped? It reaches **`app.config.errorHandler`** — one place to report everything no boundary handled.' },
        { focus: ['app', 'console'], edges: ['tolog'], text: 'With no app handler either, Vue logs the error itself (in development with a warning naming the source, e.g. "render function").' },
        { focus: ['inner', 'fallback'], text: 'With `return false` in the inner boundary, the story ends at step 3: one section shows a fallback with **Try again**, everything else keeps working, and the error is reported exactly once.' },
      ],
    },
    caption: 'Errors travel up the component tree until something handles them and says "stop".',
    alt: 'A diagram of error propagation. WeatherWidget throws during render. The error goes up to the nearest ErrorBoundary named Weather, which shows a fallback UI and calls reportError. Dashed arrows show what happens if it does not return false: the error continues to the outer Dashboard boundary, then to app.config.errorHandler, and finally, if no handler is set, Vue logs it to the console.',
  },

  syntax: [
    `
#### onErrorCaptured — catch errors from descendants
`,
    {
      code: `import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  // err:      the thrown value
  // instance: the component instance that threw
  // info:     where it came from, e.g. 'render function', 'mounted hook'
  error.value = err
  return false   // stop here; otherwise it keeps bubbling up
})`,
      lang: 'js',
      title: 'the hook',
    },
    `
It catches errors thrown by **descendants** in: rendering, \`setup()\`, lifecycle hooks, watchers, event handlers, custom directive hooks and transition hooks. For async code it catches **rejected promises that are returned to Vue** — an \`async\` event handler, an \`async\` lifecycle hook or watcher callback.

What it does **not** catch:

- errors in the component that registered the hook (only *descendants*);
- code Vue never sees: \`setTimeout\` callbacks, un-returned promises ("fire and forget"), third-party callbacks, global event listeners you added yourself.

#### An error boundary component
`,
    {
      code: `<!-- ErrorBoundary.vue -->
<script setup>
import { ref, onErrorCaptured } from 'vue'
const error = ref(null)

onErrorCaptured((err, instance, info) => {
  error.value = err
  reportError(err, { info })     // details → logs
  return false                   // contained here
})

const reset = () => (error.value = null)
</script>

<template>
  <!-- in the error state, NEVER render the content that failed -->
  <slot v-if="error" name="fallback" :error="error" :reset="reset">
    <div role="alert">This section couldn't be displayed.
      <button @click="reset">Try again</button>
    </div>
  </slot>
  <slot v-else />
</template>`,
      lang: 'vue',
      title: 'components/ErrorBoundary.vue',
    },
    {
      code: `<ErrorBoundary>
  <OrdersTable />
  <template #fallback="{ reset }">
    <p>Orders are unavailable right now.</p>
    <button @click="reset">Reload orders</button>
  </template>
</ErrorBoundary>`,
      lang: 'vue',
      title: 'using it, with a custom fallback (scoped slot)',
    },
    `
**Why does "Try again" work?** \`reset()\` clears the error, so \`v-else\` renders the default slot again — and \`v-if\` *re-creates* those components from scratch, with fresh state. When you need to reset a subtree *without* going through an error state (say, a "Reset widget" button), bump a \`:key\` on it instead: a new key means a new component instance.

#### app.config.errorHandler — the last line of defence
`,
    {
      code: `// main.js
const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  reportError(err, { info, component: instance?.$options.__name })
  showToast('Something went wrong. Please try again.')  // never err.message
}

app.mount('#app')`,
      lang: 'js',
      title: 'main.js',
    },
    `
#### Normalise API failures in the service layer
`,
    {
      code: `export class ApiError extends Error {
  constructor({ status, code, message, userMessage, cause }) {
    super(message, { cause })   // technical message + original error → logs
    this.name = 'ApiError'
    this.status = status        // 0 when there was no response at all
    this.code = code            // 'NETWORK', 'HTTP_404', 'ORDER_NOT_FOUND'…
    this.userMessage = userMessage  // safe to show
  }
}

// in a composable: handle what you expect, rethrow what you don't
try {
  orders.value = await ordersApi.list()
} catch (e) {
  if (!(e instanceof ApiError)) throw e   // a bug → boundary / app handler
  error.value = e.userMessage             // expected → show it here
}`,
      lang: 'js',
      title: 'ApiError + the expected/unexpected split',
    },
    `
#### Outside Vue: router and window (static examples)
`,
    {
      code: `// Vue Router (not Vue core): unexpected errors during navigation,
// e.g. a guard that throws or a lazy route chunk that fails to load
router.onError((error, to) => {
  reportError(error, { info: 'navigation', to: to.fullPath })
})

// Browser: the very last resort for errors Vue never saw
window.addEventListener('unhandledrejection', (event) => {
  reportError(event.reason, { info: 'unhandledrejection' })
})
window.addEventListener('error', (event) => {
  reportError(event.error ?? event.message, { info: 'window.onerror' })
})`,
      lang: 'js',
      title: 'router.onError + window listeners',
      static: true,
    },
    {
      callout: 'version',
      text: '`onErrorCaptured()` and `app.config.errorHandler` are Vue 3 core APIs. In **production builds** the `info` argument is a **shortened code** instead of the readable string — look codes up in the [Production Error Code Reference](https://vuejs.org/error-reference/). `router.onError()` belongs to **Vue Router**, not Vue core. `Error`\'s `{ cause }` option is standard JavaScript (ES2022).',
    },
  ],

  walkthrough: {
    title: 'components/ErrorBoundary.vue (finished)',
    lang: 'vue',
    code: errorBoundaryFixed,
    intro: 'The boundary from the playground, after experiment 1. Twenty-odd lines that keep one broken widget from taking down the page.',
    steps: [
      { lines: [2, 3], text: 'The only Vue API we need is `onErrorCaptured`. The reporter is our (simplified) monitoring service.' },
      { lines: [5, 7], text: 'A `name` prop lets each boundary describe *what* failed ("Weather couldn\'t be displayed") without revealing *why*.' },
      { lines: [8, 8], text: '`error` is the boundary\'s only state: `null` means "all good, render the children".' },
      { lines: [10, 11], text: 'The hook receives the error, the component instance that threw and an `info` string such as `"render function"` or `"native event handler"`. Storing the error switches the template to the fallback.' },
      { lines: [12, 12], text: 'Details go to the reporter (with `info` and which boundary caught it) — never into the UI.' },
      { lines: [13, 13], text: '`return false` stops propagation: outer boundaries and `app.config.errorHandler` won\'t see this error, so it\'s handled — and reported — exactly once.' },
      { lines: [16, 18], text: '`reset()` clears the error. The `v-else` slot renders again and `v-if` re-creates the children from scratch, so the widget starts with fresh state.' },
      { lines: [21, 27], text: 'In the error state we render the `fallback` slot (with `error` and `reset` as slot props) or a default box with `role="alert"` so screen readers announce it. Crucially, the failing children are **not** rendered — otherwise they\'d throw again in an endless loop.' },
      { lines: [28, 28], text: 'No error: render the normal content.' },
    ],
  },

  playground: {
    title: 'A dashboard that fails gracefully',
    objective: 'Break things on purpose — a bad payload, a buggy button, an offline network, a crash outside every boundary — and build the handling that contains each one.',
    files: playgroundFiles,
    entry: 'main.js',
    expected: 'A dashboard with three widgets: **Weather** (21°C), **Today** stats (after a moment) and **Notes**. Click **Simulate a bad payload** in Weather: right now the *whole* dashboard is replaced by "The dashboard couldn\'t be displayed", and the footer counts **2** reports — the error bubbled through both boundaries. Experiment 1 fixes that. The console shows each report with its `info` source.',
    experiments: [
      {
        id: 'stop-propagation',
        task: 'Make each boundary **contain** its error: in `components/ErrorBoundary.vue`, return `false` from the `onErrorCaptured` hook. Then a broken Weather widget should show **only** its own fallback, the other widgets stay visible, and the error is reported **once**.',
        hint: 'Add `return false` as the last line of the hook, after `reportError(...)`.',
        tests: [
          {
            name: 'only the Weather section falls back, and it is reported once',
            code: `await click('.break-weather')
expect(findAll('.boundary-fallback').length).toBe(1)
expect(text('.boundary-fallback')).toContain('Weather')
expect(exists('.notes-widget')).toBe(true)
expect(requireModule('services/errorReporter.js').reports.length).toBe(1)`,
          },
          {
            name: '"Try again" brings back a fresh Weather widget',
            code: `await click('.break-weather')
await click('.retry')
expect(exists('.weather-widget')).toBe(true)
expect(text('.temp')).toContain('21')`,
          },
        ],
        explain: 'Errors bubble up the parent chain until a hook returns `false`. Without it, every ancestor boundary reacts — the outermost one wins and blanks the whole dashboard. With it, damage is limited to one section, and "Try again" re-creates the widget with its original, healthy state.',
      },
      {
        id: 'offline-message',
        task: 'Set the **Network** select to **offline** and click the stats **Reload**: the whole Stats section falls back, because `fetch` failures arrive as a plain `TypeError`, which `StatsWidget` treats as unexpected. In `services/api.js`, convert that case into an `ApiError` with `status: 0`, `code: \'NETWORK\'` and a `userMessage` containing **offline** (e.g. "You seem to be offline. Check your connection and try again."), keeping the original as `cause`.',
        hint: 'In the `catch (cause)` block: `throw new ApiError({ status: 0, code: \'NETWORK\', message: cause.message, userMessage: \'You seem to be offline. Check your connection and try again.\', cause })`.',
        tests: [
          {
            name: 'offline shows a friendly inline message instead of a fallback',
            code: `await wait(200)
requireModule('services/api.js').fakeNetwork.mode = 'offline'
await click('.reload-stats')
await wait(200)
expect(exists('.stats-error')).toBe(true)
expect(text('.stats-error')).toContain('offline')`,
          },
        ],
        explain: 'Being offline is an **expected** failure, so it shouldn\'t look like a crash. Normalising it into an `ApiError` in the service layer means every component can handle it the same way, with a message that tells people what to do. Try **server error** too: the 503\'s technical message (`db-primary unreachable…`) never reaches the screen.',
      },
      {
        id: 'app-error-handler',
        task: 'Click **Menu** in the header — it throws, and it sits **outside** every boundary. In `main.js`, set `app.config.errorHandler` to call `reportError(err, { info })` and set `globalError.value` to **Something went wrong. Please try again.** (both are exported from `services/errorReporter.js`).',
        hint: '`import { reportError, globalError } from \'./services/errorReporter.js\'` then `app.config.errorHandler = (err, instance, info) => { reportError(err, { info }); globalError.value = \'Something went wrong. Please try again.\' }` before `app.mount`.',
        tests: [
          {
            name: 'an error outside all boundaries is reported and shown calmly',
            code: `await click('.header-crash')
expect(exists('.global-error')).toBe(true)
expect(text('.global-error')).toContain('Something went wrong. Please try again.')
expect(text('.global-error')).not.toContain('Header menu config')
expect(requireModule('services/errorReporter.js').reports.length).toBe(1)`,
          },
        ],
        explain: '`app.config.errorHandler` is the net under the trapeze: anything no boundary stopped lands here. It\'s the natural single place to report errors — and to show a generic message, because at this level you don\'t know enough to say anything more specific.',
      },
      {
        id: 'custom-fallback',
        task: 'Give the **Notes** boundary a custom fallback through its `#fallback` slot: `<p class="notes-fallback">Notes are taking a break.</p>` plus a button `class="reload-notes"` that calls the slot\'s `reset`. Click **Save** in Notes to trigger its bug. (Builds on experiment 1.)',
        hint: '`<ErrorBoundary name="Notes"><NotesWidget /><template #fallback="{ reset }"><p class="notes-fallback">Notes are taking a break.</p><button class="reload-notes" @click="reset">Reload notes</button></template></ErrorBoundary>`',
        tests: [
          {
            name: 'a Notes bug shows the custom fallback, and reset restores Notes',
            code: `await click('.save-note')
expect(exists('.notes-fallback')).toBe(true)
expect(exists('.weather-widget')).toBe(true)
await click('.reload-notes')
expect(exists('.notes-widget')).toBe(true)`,
          },
        ],
        explain: 'The boundary owns the *mechanism* (catch, report, reset); the parent decides the *wording* through a scoped slot. One generic component, many context-specific fallbacks.',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Ad-hoc vs layered error handling',
    props: {
      left: {
        label: 'Ad-hoc: swallow or dump',
        lang: 'js',
        code: `async function loadOrders() {
  try {
    const res = await fetch('/api/orders')
    orders.value = await res.json()   // 500? parsed as data
  } catch (e) {
    alert(e.message)                  // "Unexpected token < in JSON"
  }
}

function exportCsv() {
  try {
    buildCsv(orders.value)
  } catch {}                          // bug silently swallowed
}`,
      },
      right: {
        label: 'Layered: classify, contain, report',
        lang: 'js',
        code: `// service: every failure becomes an ApiError
const orders = await ordersApi.list()

// composable: handle expected, rethrow unexpected
try {
  orders.value = await ordersApi.list()
} catch (e) {
  if (!(e instanceof ApiError)) throw e
  error.value = e.userMessage
}

// template: <ErrorBoundary name="Orders"> … </ErrorBoundary>
// main.js:  app.config.errorHandler = (err, i, info) => report(err, info)`,
      },
      points: [
        'Left: technical messages reach users, HTTP errors aren\'t detected, and a real bug disappears without a trace.',
        'Right: the service decides what failed (status, code), the composable decides what to tell the user, and bugs keep travelling up.',
        'Right: a boundary contains bugs to one section; the app handler reports anything left over.',
        'Rule of thumb: only catch an error where you can do something useful with it.',
      ],
    },
    caption: 'Same feature, two attitudes towards failure.',
    alt: 'Two code panels. Left: a function catches every error and alerts e.message, and another swallows errors with an empty catch block. Right: a service throws ApiError, a composable shows userMessage for ApiErrors and rethrows everything else, an ErrorBoundary wraps the section and app.config.errorHandler reports leftovers.',
  },

  internals: {
    beginner: `
Vue runs your code — render functions, \`setup\`, lifecycle hooks, event handlers, watchers — through small wrapper functions with a \`try/catch\` inside. When something throws, Vue doesn't let it crash everything immediately. Instead it asks, one by one, every parent component "do you want to deal with this?" (that's \`onErrorCaptured\`). If nobody says "stop", it asks the app (\`app.config.errorHandler\`). If there's no app handler, Vue logs the error.

Code that Vue doesn't run for you — a \`setTimeout\` callback, a promise you started and forgot — never passes through those wrappers, so Vue never hears about it.
`,
    technical: [
      `
Internally Vue calls user code through \`callWithErrorHandling\` (sync) and \`callWithAsyncErrorHandling\` (which also attaches a \`.catch\` when the call **returns a promise**). Both funnel failures into \`handleError\`. A simplified model:
`,
      {
        code: `// Simplified model of Vue's handleError — not the real source
function handleError(err, instance, type) {
  const info = isDev ? readableSource(type) : shortCode(type) // 'render function' vs a code
  let cur = instance?.parent            // starts at the PARENT: own hooks are skipped
  while (cur) {
    for (const hook of cur.errorCapturedHooks ?? []) {
      if (hook(err, instance.proxy, info) === false) return   // stop propagation
    }
    cur = cur.parent
  }
  const appHandler = instance?.appContext.config.errorHandler
  if (appHandler) return appHandler(err, instance.proxy, info)
  logError(err, info)                   // dev: warning naming the source + the error
}`,
        lang: 'js',
        title: 'how propagation works',
      },
      `
Consequences worth knowing:

- **Bottom-to-top order.** The nearest ancestor's hook runs first; outer ones only run if no earlier hook returned \`false\`. If a hook *itself* throws, both errors are sent to \`app.config.errorHandler\`.
- **Async only counts if returned.** \`@click="save"\` with an \`async save()\` returns its promise to Vue, so a rejection is caught. \`@click="() => { save() }"\` discards the promise — the rejection becomes an "unhandled promise rejection" that only \`window\`'s \`unhandledrejection\` event sees. Same for \`onMounted(load)\` vs \`onMounted(() => { load() })\`.
- **Render errors.** When a component's render throws and the error is handled, that component renders an empty placeholder (a comment node) for that update. The boundary's state change then re-renders the boundary with its fallback.
- **The infinite-loop trap.** If the boundary's error state still renders the content that failed, the child throws again, the hook sets the error again, a re-render is queued… Always render the fallback *instead of* the failing content.
- **Not every rejection is an error.** Vue Router's \`router.push()\` resolves with a *navigation failure* (e.g. a guard returned \`false\`) rather than throwing; \`router.onError\` is for genuinely unexpected navigation errors.
`,
    ],
    production: `
- **Report everything, once.** Wire \`app.config.errorHandler\`, your boundaries, \`router.onError\` and the \`window\` \`error\`/\`unhandledrejection\` listeners into one \`reportError()\` that sends to your monitoring tool (a hosted error-tracking service or your own endpoint). Include release version, route and the \`info\` source; deduplicate noisy repeats.
- **Scrub personal data** (emails, tokens, form contents) before sending reports. Error payloads often contain more than you think.
- **Never show internals to users.** No stack traces, no raw server messages, no SQL. Show what happened in human terms and what to do next; optionally include a short error ID that support can look up in your logs.
- **Production \`info\` codes.** In production builds the \`info\` argument is a shortened code; map it with the Production Error Code Reference when reading reports. Upload source maps to your monitoring tool so stack traces are readable.
- **Place boundaries by region,** not around every component: one per independent widget/panel, one per route view, and the app handler above them all.
- **Expected errors are UX, not exceptions.** Offline, 401 (sign in again), 403, 404, 409 (conflict) and validation errors each deserve a designed state — see [loading, error & empty states](lesson:async-ui-states).
- **Stale chunks after a deploy.** A lazy route that fails to load (users still running the previous build) surfaces through \`router.onError\`; a common recovery is a one-time full page reload. (Vite also emits a \`vite:preloadError\` window event for failed preloads.)
- **Frontend error handling is not security.** A hidden button or a client-side check never replaces server-side validation and authorization.
- Vue **3.5+** adds \`app.config.throwUnhandledErrorInProduction\` if you prefer unhandled errors to throw in production instead of only being logged.
`,
  },

  mistakes: [
    {
      title: 'Showing raw error messages to users',
      wrong: { code: `catch (e) {
  toast.error(e.message)   // "pq: relation \\"orders\\" does not exist"
}`, lang: 'js' },
      right: { code: `catch (e) {
  reportError(e)                                    // details → logs
  toast.error(e.userMessage ?? 'Something went wrong. Please try again.')
}`, lang: 'js' },
      explanation: 'Technical messages confuse people and can leak implementation details (table names, file paths, versions). Give users a calm, actionable message; send the technical one to your logs.',
    },
    {
      title: 'Swallowing errors silently',
      wrong: { code: `try {
  await saveDraft()
} catch {}   // the user thinks it saved`, lang: 'js' },
      right: { code: `try {
  await saveDraft()
} catch (e) {
  if (!(e instanceof ApiError)) throw e
  error.value = e.userMessage   // the user knows, and can retry
}`, lang: 'js' },
      explanation: 'An empty `catch` turns a failure into a lie: the UI says everything worked. Only catch what you can handle; rethrow the rest so a boundary or the app handler sees it.',
    },
    {
      title: 'A boundary that still renders the failing content',
      wrong: { code: `<template>
  <p v-if="error" class="banner">Something broke.</p>
  <slot />   <!-- still rendered → throws again → loop -->
</template>`, lang: 'vue' },
      right: { code: `<template>
  <slot v-if="error" name="fallback" :reset="reset">…</slot>
  <slot v-else />
</template>`, lang: 'vue' },
      explanation: 'The Vue docs warn about this explicitly: if the error state renders the original content, it throws again and the component is thrown into an infinite render loop. Render the fallback *instead of* the content.',
    },
    {
      title: 'Dropping the promise, so Vue never sees the rejection',
      wrong: { code: `onMounted(() => {
  loadOrders()          // promise discarded
})
// <button @click="() => { save() }">`, lang: 'js' },
      right: { code: `onMounted(loadOrders)   // or: onMounted(async () => { await loadOrders() })
// <button @click="save">`, lang: 'js' },
      explanation: 'Vue can only catch an async error if the promise is returned to it. A discarded promise that rejects becomes an "Uncaught (in promise)" error that skips `onErrorCaptured` and `app.config.errorHandler`.',
    },
    {
      title: 'Catching inside the component that throws, with onErrorCaptured',
      wrong: { code: `<!-- OrdersTable.vue -->
<script setup>
onErrorCaptured(() => { /* expects to catch its own render errors */ })
</script>`, lang: 'vue' },
      right: { code: `<!-- Parent.vue -->
<ErrorBoundary name="Orders">
  <OrdersTable />
</ErrorBoundary>`, lang: 'vue' },
      explanation: '`onErrorCaptured` only sees errors from **descendants**. Put the hook in a component above the one that may fail — that is exactly what a boundary component is for.',
    },
  ],

  debugging: [
    {
      symptom: '"Uncaught (in promise)" in the console, and neither your boundary nor `app.config.errorHandler` ran.',
      cause: 'The rejected promise was never returned to Vue (fire-and-forget call, or code in `setTimeout`/a third-party callback).',
      fix: 'Return or `await` the promise in the hook/handler Vue calls (`onMounted(load)`, `@click="save"`), handle it locally with `try/catch`, or report it via a `window` `unhandledrejection` listener as a last resort.',
    },
    {
      symptom: 'One widget\'s error replaces the entire page section (or the whole app) with the outer fallback.',
      cause: 'The inner boundary\'s hook doesn\'t return `false`, so the error keeps bubbling and outer boundaries react too.',
      fix: 'Return `false` from the boundary that handled the error, and report from that boundary.',
    },
    {
      symptom: 'The browser tab freezes or Vue warns about recursive updates after an error.',
      cause: 'The boundary\'s error state still renders the content that throws, so render → error → state change → render repeats.',
      fix: 'Render the fallback instead of the content (`v-if="error"` / `v-else`).',
    },
    {
      symptom: '`app.config.errorHandler` is never called for some errors.',
      cause: 'A boundary returned `false` (handled), or the error happened outside Vue\'s control (timers, global listeners, discarded promises).',
      fix: 'Report from boundaries too, and add `window` `error`/`unhandledrejection` listeners for code outside Vue.',
    },
    {
      symptom: 'Production error reports show a short code where development showed "render function".',
      cause: 'Production builds replace the readable `info` string with a shortened code to save bytes.',
      fix: 'Look the code up in the Production Error Code Reference (vuejs.org/error-reference).',
    },
  ],

  bestPractices: [
    'Split errors into **expected** (offline, 4xx, validation) handled locally with a designed message, and **unexpected** (bugs) contained by boundaries.',
    'Normalise every API failure into one `ApiError` (status, code, userMessage, cause) in the service layer.',
    'Only catch where you can do something useful; rethrow what you can\'t handle.',
    'Wrap independent regions (widgets, panels, route views) in an error boundary with a retry; return `false` once handled.',
    'Never render the failing content in a boundary\'s error state.',
    'Set `app.config.errorHandler` as the last line of defence, and report from one `reportError()` function.',
    'Return or `await` promises in hooks and handlers so Vue can see async errors.',
    'Show humans calm, actionable messages; send stack traces and server messages to logs — with personal data scrubbed.',
  ],

  useCases: [
    'Dashboards where one failing widget must not blank the other panels.',
    'Data tables and forms that show "You seem to be offline" or "Please sign in again" instead of crashing.',
    'Reporting every unhandled error to a monitoring service with route and release information.',
    'Recovering from lazy-route chunks that fail to load after a new deployment (via `router.onError`).',
    'Turning third-party widget failures (maps, charts, embeds) into a contained fallback.',
  ],

  whenToUse: {
    use: [
      '`onErrorCaptured` boundaries around independent regions whose failure shouldn\'t affect the rest.',
      '`app.config.errorHandler` in every production app, for reporting.',
      'A local `try/catch` when the failure is expected and you can offer a next step.',
      '`window` listeners for code paths outside Vue (timers, third-party scripts).',
    ],
    avoid: [
      'A boundary around every tiny component — fallbacks become noise and hide which region actually failed.',
      '`try/catch` that only logs and continues as if nothing happened.',
      'Using errors for normal control flow (e.g. throwing to "return early" from a validation).',
      'Showing `err.message` or stack traces in the UI.',
    ],
  },

  comparison: {
    title: 'The error-handling toolbox',
    headers: ['Tool', 'Catches', 'Typical job', 'Scope'],
    rows: [
      ['`try/catch` in a composable', 'errors from code you call (incl. awaited promises)', 'expected failures → `error.value = userMessage`', 'one operation'],
      ['`ApiError` in the service layer', '(it\'s a type, not a catcher)', 'make every API failure predictable: status, code, userMessage', 'all requests'],
      ['`onErrorCaptured` (boundary)', 'descendants: render, setup, hooks, watchers, handlers', 'show a fallback for one region, report, stop propagation', 'a subtree'],
      ['`app.config.errorHandler`', 'anything no hook stopped', 'report; generic message', 'the whole app'],
      ['`router.onError` (Vue Router)', 'unexpected navigation errors', 'report; recover from failed lazy chunks', 'navigation'],
      ['`window` `error` / `unhandledrejection`', 'errors Vue never saw', 'last-resort reporting', 'the page'],
    ],
    note: 'Errors start at the top of this table and fall through to the next line only if nobody handled them. Pair this with [service layers](lesson:service-layers) and [app-level configuration](lesson:plugins-app-config).',
  },

  quiz: [
    {
      id: 'error-handling-q1',
      type: 'mcq',
      prompt: 'A parent uses `onErrorCaptured`. Which of these errors thrown in a **child** component will it **not** receive?',
      options: [
        { text: 'An error thrown inside a `setTimeout` callback started in the child\'s `onMounted`' },
        { text: 'An error thrown while rendering the child\'s template', why: 'Render errors are captured — they are one of the main reasons boundaries exist.' },
        { text: 'A rejection from the child\'s `async` click handler bound as `@click="save"`', why: 'The async handler returns its promise to Vue, which attaches a `.catch` and routes the rejection through the error hooks.' },
        { text: 'An error thrown in a `watch` callback in the child', why: 'Watcher callbacks run through Vue\'s error-handling wrappers, so their errors are captured.' },
      ],
      answer: 0,
      explanation: 'Vue only catches errors from code it runs (render, setup, hooks, watchers, handlers) and promises returned to it. A `setTimeout` callback runs later, outside Vue, so its error goes straight to the browser.',
    },
    {
      id: 'error-handling-q2',
      type: 'output',
      prompt: '`Grandchild` throws during render. `Child` and `Parent` both have hooks, and an app handler is set. What is logged, in order?',
      code: {
        lang: 'js',
        code: `// Parent.vue  (renders <Child />)
onErrorCaptured(() => { console.log('parent'); return false })

// Child.vue   (renders <Grandchild />)
onErrorCaptured(() => { console.log('child') })

// main.js
app.config.errorHandler = () => console.log('app')`,
      },
      options: [
        { text: '`child`, `parent`' },
        { text: '`parent`, `child`', why: 'Hooks run bottom-to-top: the nearest ancestor (Child) first.' },
        { text: '`child`, `parent`, `app`', why: 'Parent returns `false`, which stops propagation before the app handler.' },
        { text: '`app`', why: 'The app handler only runs if no `onErrorCaptured` hook returned `false` first.' },
      ],
      answer: 0,
      explanation: 'Vue walks up from the failing component\'s parent: Child logs and returns nothing (keep going), Parent logs and returns `false` (stop). The app handler never runs.',
    },
    {
      id: 'error-handling-q3',
      type: 'bug',
      prompt: 'This boundary sends the app into an endless render loop when a child throws during render. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, onErrorCaptured } from 'vue'
const failed = ref(false)
onErrorCaptured(() => {
  failed.value = true
  return false
})
</script>

<template>
  <p v-if="failed" class="banner" role="alert">This section had a problem.</p>
  <slot />
</template>`,
      },
      answerLine: 12,
      explanation: 'The default slot is rendered even in the error state, so the failing child renders — and throws — again on every update. Use `v-else` on the slot so the fallback replaces the content.',
    },
    {
      id: 'error-handling-q4',
      type: 'fill',
      prompt: 'Complete the boundary hook (stop propagation) and the app-level handler.',
      code: {
        lang: 'js',
        code: `onErrorCaptured((err, instance, info) => {
  error.value = err
  return ___
})

app.config.___ = (err, instance, info) => {
  reportError(err, { info })
}`,
      },
      answer: [['false'], ['errorHandler']],
      explanation: 'Returning `false` stops the error from reaching outer hooks and the app handler; `app.config.errorHandler` catches whatever is left.',
    },
    {
      id: 'error-handling-q5',
      type: 'mcq',
      prompt: 'Your API returns `500` with body `{ "message": "pq: relation \\"orders\\" does not exist" }`. What should the orders page show?',
      options: [
        { text: 'A friendly message such as "The server is having trouble. Please try again in a moment." with a retry button — and the technical message goes to the logs' },
        { text: 'The server message, so users can report it accurately', why: 'Users can\'t act on it, and it leaks implementation details (here, database table names). Log it; give users an error ID if support needs to find it.' },
        { text: 'Nothing — keep the old data on screen silently', why: 'Silently showing stale data hides the failure; people may act on outdated information.' },
        { text: 'The full error object, including the stack trace, in a collapsible panel', why: 'Stack traces belong in logs and monitoring tools, never in the production UI.' },
      ],
      answer: 0,
      explanation: 'Separate the audiences: humans get a calm, actionable message; developers get the details through reporting.',
    },
    {
      id: 'error-handling-q6',
      type: 'short',
      prompt: 'Explain the difference between an **expected** and an **unexpected** error, and where each should be handled.',
      answer: 'Expected errors are failures you can anticipate in normal use — offline, 401/403/404, validation, conflicts. Handle them close to where they happen (service + composable) with a designed message and next step. Unexpected errors are bugs (e.g. reading a property of null). You can\'t fix them at runtime, so let them propagate to an error boundary that contains the damage and to app.config.errorHandler, which reports them.',
    },
  ],

  exercises: [
    {
      id: 'build-error-boundary',
      title: 'Build an error boundary component',
      difficulty: 'intermediate',
      prompt: `
\`ClickBomb.vue\` has a counter and an **Explode** button that throws. Turn \`ErrorBoundary.vue\` into a real boundary:

- With no error, render the **default slot** unchanged.
- When a descendant throws, render the **\`fallback\` slot** (slot props: \`error\`, \`reset\`) or, if none is given, a default \`<div class="fallback" role="alert">\` containing a **\`<button class="retry">\`**.
- In the error state, do **not** render the default slot.
- **Emit \`error\`** with \`(err, info)\`.
- **Stop propagation**: \`App.vue\` counts escaped errors in \`.leaked\` — it must stay \`0\`.
- **Try again** (\`.retry\`) clears the error so the child is re-created with **fresh state** (its \`.clicks\` back to 0).

Don't change \`App.vue\` or \`ClickBomb.vue\`.
`,
      files: {
        'App.vue': boundaryExerciseApp,
        'ClickBomb.vue': clickBombVue,
        'ErrorBoundary.vue': boundaryStarter,
      },
      hints: [
        'Store the error in a `ref(null)` and set it inside `onErrorCaptured((err, instance, info) => { … })`.',
        'In the hook: set the ref, `emit(\'error\', err, info)` (declare it with `defineEmits([\'error\'])`) and `return false`.',
        'Template: `<slot v-if="error" name="fallback" :error="error" :reset="reset"><div class="fallback" role="alert">Something went wrong. <button class="retry" @click="reset">Try again</button></div></slot><slot v-else />` with `reset` setting the ref back to `null`.',
      ],
      solution: {
        explanation: 'The hook turns "a descendant threw" into state (`error`), and the template picks content or fallback from that state. `return false` contains the error; emitting `error` lets the parent decide how to report it. Because the content lives behind `v-else`, clearing the error re-creates `ClickBomb` from scratch — which is why its counter is back to 0 after a retry.',
        files: {
          'App.vue': boundaryExerciseApp,
          'ClickBomb.vue': clickBombVue,
          'ErrorBoundary.vue': boundarySolution,
        },
      },
      tests: [
        {
          name: 'renders the child normally when nothing is wrong',
          code: `expect(exists('.explode')).toBe(true)
expect(exists('.fallback')).toBe(false)
expect(text('.leaked')).toBe('0')`,
        },
        {
          name: 'shows an alert fallback instead of the child after an error',
          code: `await click('.explode')
expect(exists('.fallback')).toBe(true)
expect(attr('.fallback', 'role')).toBe('alert')
expect(exists('.explode')).toBe(false)`,
        },
        {
          name: 'stops propagation and emits error with the info string',
          code: `await click('.explode')
expect(text('.leaked')).toBe('0')
expect(text('.last-info')).toContain('handler')`,
        },
        {
          name: 'Try again re-creates the child with fresh state',
          code: `await click('.count-up')
await click('.count-up')
expect(text('.clicks')).toBe('2')
await click('.explode')
await click('.retry')
expect(exists('.explode')).toBe(true)
expect(text('.clicks')).toBe('0')`,
        },
      ],
    },
    {
      id: 'normalize-api-errors',
      title: 'Normalise every failure into an ApiError',
      difficulty: 'advanced',
      prompt: `
In \`apiError.js\`, implement **\`toApiError(error)\`** so that *any* thrown value becomes an \`ApiError\` (\`status\`, \`code\`, \`message\`, \`userMessage\`, \`cause\`):

- **Already an \`ApiError\`** → return it **unchanged** (the same object).
- **\`error.name === 'AbortError'\`** → \`status: 0\`, \`code: 'ABORTED'\`, userMessage \`The request was cancelled.\`
- **A \`TypeError\`** (fetch's network failure) → \`status: 0\`, \`code: 'NETWORK'\`, userMessage \`You seem to be offline. Check your connection and try again.\`
- **Has a numeric \`status\`** (an HTTP error, optionally with a \`body\`) → that status; \`code\` is \`body.code\`, or \`'HTTP_' + status\`; \`userMessage\` chosen by status (list below).
- **Anything else** → \`status: 0\`, \`code: 'UNKNOWN'\`, userMessage \`Something went wrong. Please try again.\`

User messages for HTTP statuses:

- 401 → \`Please sign in again.\`
- 403 → \`You don't have permission to do that.\`
- 404 → \`We couldn't find what you were looking for.\`
- 500 or above → \`The server is having trouble. Please try again in a moment.\`
- any other status → \`Something went wrong. Please try again.\`

Always keep the original value as \`cause\`. The server's technical \`body.message\` may go into \`message\` (for logs) but **never** into \`userMessage\`.
`,
      files: {
        'App.vue': normalizeApp,
        'apiError.js': normalizeStarter,
      },
      hints: [
        'Check the cases in the order of the list — `ApiError` first, then `AbortError` (some abort errors are not TypeErrors, so check the name), then `TypeError`, then a numeric `status`.',
        'Write a small `userMessageFor(status)` helper with `if` checks for 401, 403, 404 and `>= 500`.',
        'For HTTP errors: `const body = error.body || {}`, `code: body.code || \'HTTP_\' + error.status`, `message: body.message || error.message`, `cause: error`.',
      ],
      solution: {
        explanation: 'One function now decides what every failure *means*. Components only check `instanceof ApiError` and show `userMessage`; monitoring gets `code`, `status`, the technical `message` and the original error via `cause`. Because `toApiError` is pure, it\'s trivial to unit-test every branch.',
        files: {
          'App.vue': normalizeApp,
          'apiError.js': normalizeSolution,
        },
      },
      tests: [
        {
          name: 'network failures become NETWORK errors with an offline message',
          code: `const { toApiError, ApiError } = requireModule('apiError.js')
const original = new TypeError('Failed to fetch')
const e = toApiError(original)
expect(e instanceof ApiError).toBe(true)
expect(e.status).toBe(0)
expect(e.code).toBe('NETWORK')
expect(e.userMessage).toBe('You seem to be offline. Check your connection and try again.')
expect(e.cause).toBe(original)`,
        },
        {
          name: 'HTTP errors keep status and code, with a safe message',
          code: `const { toApiError } = requireModule('apiError.js')
const notFound = toApiError(Object.assign(new Error('HTTP 404'), { status: 404, body: { code: 'ORDER_NOT_FOUND' } }))
expect(notFound.status).toBe(404)
expect(notFound.code).toBe('ORDER_NOT_FOUND')
expect(notFound.userMessage).toBe("We couldn't find what you were looking for.")
const crash = toApiError(Object.assign(new Error('HTTP 503'), { status: 503, body: { message: 'NullPointerException at OrderService.java:88' } }))
expect(crash.code).toBe('HTTP_503')
expect(crash.userMessage).toBe('The server is having trouble. Please try again in a moment.')
expect(crash.userMessage).not.toContain('NullPointer')
expect(toApiError(Object.assign(new Error('x'), { status: 401 })).userMessage).toBe('Please sign in again.')
expect(toApiError(Object.assign(new Error('x'), { status: 403 })).userMessage).toBe("You don't have permission to do that.")
expect(toApiError(Object.assign(new Error('x'), { status: 418 })).userMessage).toBe('Something went wrong. Please try again.')`,
        },
        {
          name: 'aborts, unknown values and existing ApiErrors',
          code: `const { toApiError, ApiError } = requireModule('apiError.js')
const abort = Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' })
expect(toApiError(abort).code).toBe('ABORTED')
expect(toApiError(abort).userMessage).toBe('The request was cancelled.')
const weird = toApiError('kaboom')
expect(weird.code).toBe('UNKNOWN')
expect(weird.userMessage).toBe('Something went wrong. Please try again.')
expect(weird.cause).toBe('kaboom')
const existing = new ApiError({ status: 409, code: 'CONFLICT', message: 'm', userMessage: 'u' })
expect(toApiError(existing)).toBe(existing)`,
        },
        {
          name: 'the demo app shows only safe messages',
          code: `await click('.sim-500')
expect(text('.message')).toBe('The server is having trouble. Please try again in a moment.')
await click('.sim-offline')
expect(text('.message')).toContain('offline')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'error-handling-captured-vs-global',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between `onErrorCaptured` and `app.config.errorHandler`?',
      answer: '`onErrorCaptured` is a lifecycle hook registered in a component; it receives errors thrown by that component\'s descendants and can return `false` to stop propagation — it\'s how you build error boundaries that show a fallback for one region. `app.config.errorHandler` is a single app-wide handler that receives errors no hook stopped; it\'s the place for reporting and a generic message. Both receive `(err, instance, info)`.',
      explanation: 'One is local and can change the UI of a subtree; the other is global and is your last line of defence.',
      whyAsked: 'Basic knowledge of Vue\'s error APIs — and whether you know how they interact.',
      mistakes: [
        'Saying `onErrorCaptured` catches errors in its own component.',
        'Not knowing that returning `false` prevents the app handler from running.',
        'Thinking either one catches errors in `setTimeout` callbacks.',
      ],
      followUps: ['In what order do multiple hooks run?', 'What does the `info` argument contain in production?', 'Which errors do neither of them see?'],
      modelAnswer: '`onErrorCaptured` is a hook a component registers to hear about errors from its descendants — render, setup, lifecycle hooks, watchers, event handlers. I use it to build error boundaries: store the error, render a fallback with a retry, and return `false` so it doesn\'t keep bubbling. `app.config.errorHandler` is the app-wide catch-all for anything no hook stopped, which makes it the natural place to report to monitoring. Both get the error, the instance and an `info` string; in production `info` is a short code. Neither sees errors Vue doesn\'t run, like timers or discarded promises.',
    },
    {
      id: 'error-handling-propagation-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'A deeply nested component throws in a click handler. Its parent\'s `onErrorCaptured` logs "A" and returns nothing; the grandparent\'s logs "B" and throws a new error; `app.config.errorHandler` logs the message of each error it receives. What is logged?',
      options: [
        '"A", "B", then the app handler logs both the new error and the original one',
        '"A", "B", then the app handler logs only the new error',
        '"B", "A", then the app handler logs the original error',
        '"A" only — throwing in a hook stops everything',
      ],
      correctOption: 0,
      answer: 'Hooks run bottom-to-top, so "A" then "B". Because the grandparent\'s hook itself threw, Vue sends **both** the hook\'s error and the original captured error to `app.config.errorHandler`.',
      explanation: 'This behaviour is documented for `onErrorCaptured`: a throwing hook doesn\'t swallow the original error.',
      whyAsked: 'Tests precise understanding of propagation rules rather than vague familiarity.',
      mistakes: ['Reversing the order of hooks.', 'Assuming the original error is lost when a hook throws.'],
      followUps: ['How would you prevent a buggy boundary from hiding the original error?', 'What changes if the parent returns false?'],
      modelAnswer: 'Hooks run from the nearest ancestor upwards, so the parent logs "A" first and, since it doesn\'t return false, the grandparent logs "B". The grandparent\'s hook then throws, and Vue\'s documented behaviour is to send both that new error and the original one to `app.config.errorHandler`. If the parent had returned `false`, only "A" would be logged.',
    },
    {
      id: 'error-handling-timeout',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Errors from this component never reach your error boundary or `app.config.errorHandler` — they only show up as "Uncaught (in promise)" in the console. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `onMounted(() => {
  loadDashboard()               // async function, may reject
  setInterval(async () => {
    await refreshNotifications() // may reject too
  }, 30_000)
})`,
      },
      answer: 'Vue can only catch async errors when the promise is **returned** to it. `loadDashboard()` is called but its promise is discarded, and the interval callback runs outside Vue entirely. Fix: `onMounted(loadDashboard)` (or `await` it inside an `async` hook) so Vue sees the rejection; inside the interval, wrap the call in `try/catch` and report or set error state yourself — and clear the interval in `onUnmounted`. A `window` `unhandledrejection` listener can report anything that still slips through.',
      explanation: 'Vue\'s error handling wraps the functions *it* calls. Timers and floating promises are invisible to it.',
      whyAsked: 'A very common production issue: async errors that silently bypass the error-handling strategy.',
      mistakes: ['Thinking `app.config.errorHandler` catches every error on the page.', 'Wrapping only the outer hook in try/catch (doesn\'t help the interval).', 'Forgetting to clear the interval.'],
      followUps: ['How does `@click="save"` differ from `@click="() => { save() }"` here?', 'Where would you report unhandled rejections globally?'],
      modelAnswer: 'Vue wraps hooks and handlers it calls, and if they return a promise it attaches a catch. Here the hook calls `loadDashboard()` without returning the promise, so the rejection floats away, and the interval callback is invoked by the browser, not Vue. I\'d write `onMounted(loadDashboard)` or `await` it in an async hook, and inside the interval use try/catch to set an error state or report — plus clear the interval on unmount. As a safety net I\'d add a `window` `unhandledrejection` listener that reports to monitoring.',
    },
    {
      id: 'error-handling-raw-errors',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'Support forwards a screenshot: a customer sees "TypeError: Cannot read properties of undefined (reading \'total\')" on the checkout page, and the rest of the page is broken. You have no record of it in your logs. What do you change?',
      answer: 'Short term: find and fix the bug (likely an unexpected API shape — add defensive mapping/validation in the adapter). Structurally: (1) wrap checkout regions in error boundaries so a failure shows a calm fallback with retry and the rest keeps working; (2) set `app.config.errorHandler`, `router.onError` and `window` listeners to report to a monitoring service with route/release info; (3) stop rendering `err.message` anywhere — use `userMessage` from a normalised `ApiError`, and generic text for unexpected errors; (4) consider an error ID shown to users that support can look up.',
      explanation: 'The screenshot reveals three gaps at once: no containment, no reporting, and internals leaking into the UI.',
      whyAsked: 'Shows whether you think in systems (containment, observability, UX) rather than just patching one bug.',
      mistakes: ['Only fixing the one line.', 'Adding try/catch around everything and logging to the console.', 'Ignoring reporting — "we had no record of it" is the real problem.'],
      followUps: ['What would you include in an error report? What would you leave out?', 'Where would you put boundaries on the checkout page?'],
      modelAnswer: 'I\'d fix the immediate bug — probably the API returned a shape we didn\'t expect, so I\'d harden the adapter. But the screenshot shows three systemic gaps. First containment: the checkout should have boundaries around independent regions so one failure shows a fallback with a retry instead of breaking the page. Second observability: we had no record, so I\'d wire `app.config.errorHandler`, boundaries, `router.onError` and `unhandledrejection` into one reporter with route and release info, scrubbing personal data. Third UX: nothing should render raw `err.message`; expected failures use an `ApiError` user message and unexpected ones a generic sentence, optionally with an error ID for support.',
    },
    {
      id: 'error-handling-async-action',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement `useAsyncAction(action)` returning `{ run, pending, error }`. `run(...args)` calls `action(...args)`: `pending` is `true` while it runs and `false` afterwards; each run clears `error` first; on success it returns the result; if the action rejects with an **`ApiError`**, set `error` to its `userMessage` and resolve with `undefined`; any **other** error must be **rethrown** so Vue\'s error handling sees it.',
      starter: { files: asyncActionFiles(asyncActionStarter) },
      tests: [
        {
          name: 'pending is true while running and the result is returned',
          code: `const { useAsyncAction } = requireModule('useAsyncAction.js')
let finish
const s = withSetup(() => useAsyncAction((x) => new Promise((resolve) => { finish = () => resolve(x * 2) })))
const p = s.run(21)
expect(s.pending.value).toBe(true)
finish()
expect(await p).toBe(42)
expect(s.pending.value).toBe(false)
expect(s.error.value).toBeNull()`,
        },
        {
          name: 'an ApiError becomes a user message and run() resolves',
          code: `const { useAsyncAction } = requireModule('useAsyncAction.js')
const { ApiError } = requireModule('ApiError.js')
const s = withSetup(() => useAsyncAction(async () => { throw new ApiError({ status: 409, userMessage: 'Conflict, please reload.' }) }))
const result = await s.run()
expect(result).toBeUndefined()
expect(s.error.value).toBe('Conflict, please reload.')
expect(s.pending.value).toBe(false)`,
        },
        {
          name: 'other errors are rethrown, and the next run clears the old message',
          code: `const { useAsyncAction } = requireModule('useAsyncAction.js')
const { ApiError } = requireModule('ApiError.js')
let mode = 'api'
const s = withSetup(() => useAsyncAction(async () => {
  if (mode === 'api') throw new ApiError({ status: 500, userMessage: 'Server trouble.' })
  if (mode === 'bug') throw new TypeError('x is undefined')
  return 'ok'
}))
await s.run()
expect(s.error.value).toBe('Server trouble.')
mode = 'bug'
let rethrown = null
try { await s.run() } catch (e) { rethrown = e }
expect(rethrown instanceof TypeError).toBe(true)
expect(s.pending.value).toBe(false)
mode = 'ok'
expect(await s.run()).toBe('ok')
expect(s.error.value).toBeNull()`,
        },
      ],
      hints: [
        'Use `try { return await action(...args) } catch (e) { … } finally { pending.value = false }` — the `await` is needed so rejections land in your `catch`.',
        'In `catch`: `if (e instanceof ApiError) { error.value = e.userMessage; return undefined }` then `throw e`.',
      ],
      answer: 'Set `pending` and clear `error`, `await` the action inside `try`, turn `ApiError`s into `error.value = userMessage`, rethrow everything else, and reset `pending` in `finally`.',
      solution: { files: asyncActionFiles(asyncActionSolution) },
      explanation: 'The composable encodes the team rule "handle expected, rethrow unexpected" once. Bound as `@click="run(...)"`, a rethrown bug still returns a rejected promise to Vue, so boundaries and the app handler see it.',
      whyAsked: 'Shows you can turn an error-handling policy into reusable code, and that you understand `return` vs `return await` inside try/catch.',
      mistakes: ['`return action(...args)` without `await` — the rejection escapes the try/catch.', 'Catching everything and setting a generic message, hiding bugs.', 'Forgetting `finally`, leaving `pending` stuck at true.'],
      followUps: ['How would you prevent double submits with this composable?', 'How would you add cancellation with AbortController?'],
      modelAnswer: 'I keep `pending` and `error` as refs. `run` sets pending, clears the previous error and then `await`s the action inside a try — the `await` matters, otherwise the rejection skips my catch. If the error is an `ApiError` I store its user message and resolve with undefined; anything else is a bug, so I rethrow it and let boundaries and the app handler report it. `finally` resets pending on every path.',
    },
    {
      id: 'error-handling-infinite-loop',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A teammate\'s `ErrorBoundary` shows a red banner when `error` is set, and renders `<slot />` underneath "so users can still see the rest". After a render error, the tab freezes or Vue warns about a recursive update. Explain the loop and the fix.',
      answer: 'In the error state the boundary still renders the default slot, so the broken child renders again and throws again; the hook sets `error` again, which schedules another render, and so on. The Vue docs warn about exactly this. Fix: render the fallback *instead of* the failed content (`v-if="error"` fallback, `v-else` slot). If parts should remain visible, put them in separate boundaries.',
      explanation: 'A boundary must remove the thing that failed from the render; otherwise there is nothing to break the cycle.',
      whyAsked: 'Senior-level understanding of how boundaries interact with rendering.',
      mistakes: ['Suggesting a `try/catch` inside the child template (not possible).', 'Fixing it with a counter that gives up after N tries without removing the failing content.'],
      followUps: ['How would you let the user keep seeing other widgets?', 'Why does `v-if` give the child fresh state on retry?'],
      modelAnswer: 'The error state still renders the slot, so the failing child renders again, throws again, the hook sets error again, a re-render is queued — a loop. Vue\'s docs explicitly say the error state must not render the original content. The fix is `v-if` for the fallback and `v-else` for the slot. If the goal is keeping the rest of the page visible, wrap each independent region in its own boundary so only the broken one is swapped out.',
    },
    {
      id: 'error-handling-strategy',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 8,
      question: 'Design the error-handling strategy for a production Vue SPA (Vue Router + Pinia). Cover API errors, component bugs, navigation errors, errors outside Vue, reporting and what users see.',
      answer: 'Layers: (1) HTTP client/service layer normalises everything into `ApiError` (status, code, userMessage, cause); (2) composables/stores handle expected errors (offline, 401 → sign-in flow, 403, 404, 409, validation) with designed UI states and rethrow the rest; (3) error boundaries around independent regions and the route view, returning `false` and reporting; (4) `app.config.errorHandler` as catch-all with a generic toast; (5) `router.onError` for navigation errors (including failed lazy chunks → reload once); (6) `window` `error`/`unhandledrejection` for anything outside Vue. All feed one `reportError()` that adds route, release and the `info` source, scrubs personal data and sends to monitoring. Users see calm, actionable messages and maybe an error ID; never stack traces.',
      explanation: 'Each layer catches what it can handle meaningfully and passes the rest up; reporting is centralised.',
      code: {
        lang: 'js',
        code: `// main.js — wiring the outer layers (simplified)
app.config.errorHandler = (err, instance, info) => {
  reportError(err, { info, component: instance?.$options.__name })
  notify('Something went wrong. Please try again.')
}
router.onError((err, to) => reportError(err, { info: 'navigation', to: to.fullPath }))
window.addEventListener('unhandledrejection', (e) => reportError(e.reason, { info: 'unhandledrejection' }))`,
      },
      whyAsked: 'Reliability and observability are core senior responsibilities; this shows breadth and judgement.',
      mistakes: [
        'Only mentioning try/catch.',
        'No reporting/observability story.',
        'Showing technical messages to users.',
        'Mixing up which features belong to Vue core, Vue Router and the browser.',
      ],
      followUps: ['How do you avoid reporting the same error three times?', 'How would you handle a 401 in the middle of a form?', 'What would you put in an error report and what must stay out?'],
      modelAnswer: 'I design it in layers. The service layer turns every failure into an `ApiError` with status, code and a safe user message. Composables and stores handle expected errors — offline, 401, 404, conflicts, validation — with designed states, and rethrow anything unexpected. Independent regions and the route view sit inside error boundaries that show a fallback with retry, report, and return `false`. Above that, `app.config.errorHandler` catches leftovers, Vue Router\'s `onError` catches navigation errors like failed lazy chunks, and `window` listeners catch code outside Vue. All of them call one reporter that adds route and release, scrubs personal data and sends to monitoring. Users only ever see calm, actionable messages.',
    },
  ],

  takeaways: [
    'Split failures into expected (handle locally with a designed message) and unexpected (contain and report).',
    'Normalise API failures into one `ApiError` in the service layer; components show `userMessage`, logs get the rest.',
    '`onErrorCaptured(err, instance, info)` catches errors from descendants, bottom-to-top; return `false` to stop propagation.',
    'An error boundary renders its fallback *instead of* the failed content, and a retry re-creates the children fresh.',
    '`app.config.errorHandler` is the app-wide last line of defence; `router.onError` (Vue Router) and `window` listeners cover navigation and code outside Vue.',
    'Vue only sees async errors whose promises are returned to it; never show stack traces or raw server messages to users.',
  ],
}
