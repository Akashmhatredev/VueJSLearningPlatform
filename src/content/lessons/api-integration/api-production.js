// Lesson: Env variables, CORS & production errors.
// The sandbox provides import.meta.env.MODE / DEV / PROD / SSR / BASE_URL (no VITE_* values),
// so config.js reads the real built-ins and simulates the .env files for VITE_* values.

const configFile = `// config.js — every environment-specific value in ONE place.
//
// In a real Vite app these values come from .env files, e.g.
//   .env.development   VITE_API_URL=/api
//   .env.staging       VITE_API_URL=https://api.staging.example.com
//   .env.production    VITE_API_URL=https://api.example.com
// and you read them as import.meta.env.VITE_API_URL.
//
// This sandbox only provides import.meta.env.MODE / DEV / PROD / SSR / BASE_URL,
// so the .env files are simulated by the object below (simplified).
const SIMULATED_ENV_FILES = {
  development: { VITE_API_URL: '/api', VITE_APP_NAME: 'Invoices (dev)' },
  staging: { VITE_API_URL: 'https://api.staging.example.com', VITE_APP_NAME: 'Invoices (staging)' },
  production: { VITE_API_URL: 'https://api.example.com', VITE_APP_NAME: 'Invoices' },
}

const MODE = import.meta.env.MODE // 'development' here; \`vite build\` defaults to 'production'
const env = { ...import.meta.env, ...SIMULATED_ENV_FILES[MODE] }

export const config = {
  mode: MODE,
  isDev: env.DEV,
  apiBaseUrl: env.VITE_API_URL,
  appName: env.VITE_APP_NAME,
}`

const sessionFile = `// session.js — the signed-in user's access token, kept in memory.
// (Where to store tokens safely is covered in the authentication lesson.)
export const session = { accessToken: 'token-1' }`

const serverFile = `// api.js — a pretend backend + network (simplified: no real HTTP).
// Same shape as fetch: fakeFetch(url, options) → Promise<Response>.
export const server = {
  nextStatus: null, // force the next response's status, e.g. 500
  offline: false, // simulate no network: fakeFetch rejects like fetch does
  validTokens: new Set(['token-1']),
  refreshValid: true,
}
export const stats = { requests: 0, refreshCalls: 0 }

let tokenCounter = 1

export function expireSession({ refreshToo = false } = {}) {
  server.validTokens.clear() // every access token is now expired
  if (refreshToo) server.refreshValid = false // …and so is the refresh token
}

const INVOICES = [
  { id: 'INV-1001', amount: 120, status: 'paid' },
  { id: 'INV-1002', amount: 75, status: 'open' },
  { id: 'INV-1003', amount: 310, status: 'overdue' },
]

function reply(status, data) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

export async function fakeFetch(url, options = {}) {
  stats.requests++
  const { pathname } = new URL(url, 'http://localhost:5173') // relative URLs resolve against the page
  const headers = new Headers(options.headers)
  console.log('→', options.method || 'GET', url)
  await new Promise((resolve) => setTimeout(resolve, 150))

  if (server.offline) throw new TypeError('Failed to fetch') // what fetch throws without a network
  if (server.nextStatus) {
    const status = server.nextStatus
    server.nextStatus = null
    return reply(status, { message: status >= 500 ? 'NullPointerException at InvoiceService.java:42' : 'Bad request' })
  }
  if (pathname.endsWith('/auth/refresh')) {
    stats.refreshCalls++
    if (!server.refreshValid) return reply(401, { message: 'Refresh token expired' })
    const accessToken = 'token-' + ++tokenCounter
    server.validTokens.add(accessToken)
    return reply(200, { accessToken })
  }
  const token = (headers.get('Authorization') || '').replace('Bearer ', '')
  if (!server.validTokens.has(token)) return reply(401, { message: 'Access token expired' })
  if (pathname.endsWith('/invoices')) return reply(200, INVOICES)
  return reply(404, { message: 'Not found' })
}`

const naiveHttp = `// http.js — the app's single HTTP client.
import { config } from './config.js'
import { fakeFetch } from './api.js' // a real app: the global fetch
import { session } from './session.js'

export async function request(path) {
  const res = await fakeFetch(config.apiBaseUrl + path, {
    headers: { Authorization: 'Bearer ' + session.accessToken },
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
}`

const finishedHttp = `// http.js — one HTTP client: base URL, auth, refresh-once, friendly errors.
import { config } from './config.js'
import { fakeFetch } from './api.js' // a real app: the global fetch
import { session } from './session.js'

const MESSAGES = {
  network: 'You seem to be offline. Check your connection and try again.',
  auth: 'Your session expired. Please sign in again.',
  server: 'Something went wrong on our side. Please try again in a moment.',
  client: 'That request could not be completed.',
}

export class ApiError extends Error {
  constructor(kind, message, status = null) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind // 'network' | 'auth' | 'client' | 'server'
    this.status = status
  }
}

let refreshing = null // shared promise: concurrent 401s trigger ONE refresh

function refreshOnce() {
  if (!refreshing) {
    refreshing = fakeFetch(config.apiBaseUrl + '/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) return false
        session.accessToken = (await res.json()).accessToken
        return true
      })
      .catch(() => false)
      .finally(() => (refreshing = null))
  }
  return refreshing
}

export async function request(path, { retried = false } = {}) {
  let res
  try {
    res = await fakeFetch(config.apiBaseUrl + path, {
      headers: { Authorization: 'Bearer ' + session.accessToken },
    })
  } catch (err) {
    console.error('[network]', err) // details for developers / monitoring
    throw new ApiError('network', MESSAGES.network)
  }

  if (res.status === 401 && !retried && (await refreshOnce())) {
    return request(path, { retried: true }) // try once more with the new token
  }
  if (res.status === 401) throw new ApiError('auth', MESSAGES.auth, 401)
  if (res.status >= 500) {
    console.error('[server]', res.status, await res.text()) // never shown to users
    throw new ApiError('server', MESSAGES.server, res.status)
  }
  if (!res.ok) throw new ApiError('client', MESSAGES.client, res.status)
  return res.json()
}`

const invoicesApp = `<script setup>
import { ref } from 'vue'
import { config } from './config.js'
import { request } from './http.js'
import { server, expireSession } from './api.js'

const invoices = ref([])
const error = ref(null) // the error object, not just a string
const loading = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    invoices.value = await request('/invoices')
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <header>
    <h2>{{ config.appName }}</h2>
    <p class="api-base">API: {{ config.apiBaseUrl }} · mode: {{ config.mode }}</p>
  </header>

  <div class="dev-tools">
    <button class="sim-500" @click="server.nextStatus = 500">Next call → 500</button>
    <button class="sim-offline" @click="server.offline = !server.offline">Toggle offline</button>
    <button class="sim-expire" @click="expireSession()">Expire access token</button>
    <button class="sim-expire-all" @click="expireSession({ refreshToo: true })">Expire whole session</button>
  </div>

  <button class="load" @click="load">Load my invoices</button>

  <p v-if="loading" class="loading">Loading…</p>
  <p v-else-if="error" class="error" role="alert">{{ error.message }}</p>
  <ul v-else class="invoices">
    <li v-for="inv in invoices" :key="inv.id" class="invoice">
      {{ inv.id }} — {{ inv.amount }} € — {{ inv.status }}
    </li>
  </ul>
</template>`

const finishedApp = `<script setup>
import { ref } from 'vue'
import { config } from './config.js'
import { request } from './http.js'
import { server, expireSession } from './api.js'

const invoices = ref([])
const error = ref(null)
const loading = ref(false)

async function load() {
  loading.value = true
  error.value = null
  try {
    invoices.value = await request('/invoices')
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

function signIn() {
  // a real app: router.push({ name: 'login', query: { redirect: route.fullPath } })
  alert('This would open the sign-in page and come back here afterwards.')
}
</script>

<template>
  <header>
    <h2>{{ config.appName }}</h2>
    <p class="api-base">API: {{ config.apiBaseUrl }} · mode: {{ config.mode }}</p>
  </header>

  <div class="dev-tools">
    <button class="sim-500" @click="server.nextStatus = 500">Next call → 500</button>
    <button class="sim-offline" @click="server.offline = !server.offline">Toggle offline</button>
    <button class="sim-expire" @click="expireSession()">Expire access token</button>
    <button class="sim-expire-all" @click="expireSession({ refreshToo: true })">Expire whole session</button>
  </div>

  <button class="load" @click="load">Load my invoices</button>

  <p v-if="loading" class="loading">Loading…</p>
  <div v-else-if="error && error.kind === 'auth'" class="session-expired" role="alert">
    <p>{{ error.message }}</p>
    <button class="sign-in" @click="signIn">Sign in again</button>
  </div>
  <p v-else-if="error" class="error" role="alert">{{ error.message }}</p>
  <ul v-else class="invoices">
    <li v-for="inv in invoices" :key="inv.id" class="invoice">
      {{ inv.id }} — {{ inv.amount }} € — {{ inv.status }}
    </li>
  </ul>
</template>`

const errorsApp = `<script setup>
import { ref } from 'vue'
import { toApiError } from './errors.js'

const shown = ref('')

// Things that can go wrong, in the shapes the HTTP layer produces
const samples = {
  offline: new TypeError('Failed to fetch'),
  expired: { status: 401, body: { message: 'jwt expired' } },
  crash: { status: 500, body: { message: 'NullPointerException' } },
  invalid: { status: 422, body: { message: 'That email is already registered.' } },
}

function simulate(name) {
  shown.value = toApiError(samples[name]).message
}
</script>

<template>
  <button class="offline" @click="simulate('offline')">Offline</button>
  <button class="expired" @click="simulate('expired')">401</button>
  <button class="crash" @click="simulate('crash')">500</button>
  <button class="invalid" @click="simulate('invalid')">422</button>
  <p class="shown">{{ shown }}</p>
</template>`

const errorsStarter = `// errors.js — turn anything that went wrong into ONE error shape the UI understands.
export class ApiError extends Error {
  constructor(kind, message, status = null, details = null) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.details = details // for logs, never for users
  }
}

// \`raw\` is either a thrown error (e.g. TypeError: Failed to fetch, AbortError)
// or an HTTP failure object: { status, body }.
export function toApiError(raw) {
  // TODO: classify raw into the kinds described in the task
  return new ApiError('unknown', String(raw.message || raw.status))
}`

const errorsSolution = `// errors.js — turn anything that went wrong into ONE error shape the UI understands.
export class ApiError extends Error {
  constructor(kind, message, status = null, details = null) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.details = details // for logs, never for users
  }
}

export function toApiError(raw) {
  if (raw instanceof ApiError) return raw
  if (raw && raw.name === 'AbortError') return new ApiError('aborted', '', null, raw)

  const status = raw && typeof raw.status === 'number' ? raw.status : null
  const serverMessage = raw && raw.body && raw.body.message

  if (status === null) {
    return new ApiError('network', 'You seem to be offline. Check your connection and try again.', null, raw)
  }
  if (status === 401) return new ApiError('auth', 'Your session expired. Please sign in again.', 401, raw)
  if (status === 403) return new ApiError('forbidden', "You don't have permission to do that.", 403, raw)
  if (status === 404) return new ApiError('not-found', "We couldn't find what you were looking for.", 404, raw)
  if (status >= 500) {
    return new ApiError('server', 'Something went wrong on our side. Please try again in a moment.', status, raw)
  }
  return new ApiError('client', serverMessage || 'That request could not be completed.', status, raw)
}`

const weatherServer = `// api.js — pretend endpoints (simplified, no network).
export const stats = { thirdPartyCalls: 0, proxyCalls: 0 }

// A third-party weather service that needs a secret key.
export function thirdPartyWeather(city, apiKey) {
  stats.thirdPartyCalls++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!apiKey || !apiKey.startsWith('sk_')) return reject(new Error('401: invalid API key'))
      resolve({ city, tempC: 18 })
    }, 150)
  })
}

// YOUR backend's endpoint, GET /api/weather?city=…
// The secret key lives on the server (in a real server env var), never in the bundle.
const SERVER_SIDE_KEY = 'sk_live_server_only'
export function getWeatherViaProxy(city) {
  stats.proxyCalls++
  return thirdPartyWeather(city, SERVER_SIDE_KEY) // the server makes the call, not the browser
}`

const weatherStarter = `<script setup>
import { ref } from 'vue'
import { config } from './config.js'
import { thirdPartyWeather } from './api.js'

const weather = ref(null)

async function load() {
  weather.value = await thirdPartyWeather('Pune', config.weatherApiKey)
}
</script>

<template>
  <button class="load" @click="load">Show weather</button>
  <p v-if="weather" class="weather">{{ weather.city }}: {{ weather.tempC }} °C</p>
</template>`

const weatherSolution = `<script setup>
import { ref } from 'vue'
import { getWeatherViaProxy } from './api.js'

const weather = ref(null)

async function load() {
  weather.value = await getWeatherViaProxy('Pune') // our server adds the key
}
</script>

<template>
  <button class="load" @click="load">Show weather</button>
  <p v-if="weather" class="weather">{{ weather.city }}: {{ weather.tempC }} °C</p>
</template>`

const refreshApi = `// api.js — pretend refresh endpoint (simplified).
export const server = { refreshValid: true }
export const stats = { refreshCalls: 0 }
let counter = 0

export function postRefresh() {
  stats.refreshCalls++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!server.refreshValid) return reject(new Error('Refresh token expired'))
      counter++
      resolve({ accessToken: 'token-' + counter })
    }, 100)
  })
}`

const refreshApp = `<script setup>
import { ref } from 'vue'
import { refreshOnce } from './auth.js'

const tokens = ref([])

async function burst() {
  // three requests got 401 at the same moment
  tokens.value = await Promise.all([refreshOnce(), refreshOnce(), refreshOnce()])
}
</script>

<template>
  <button class="burst" @click="burst">Three 401s at once</button>
  <p class="tokens">{{ tokens.join(', ') }}</p>
</template>`

export default {
  id: 'api-production',
  title: 'Env variables, CORS & production errors',
  summary: 'Configure API URLs per environment without leaking secrets, understand CORS errors, and handle failures — including expired sessions — like a production app.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['fetching-data', 'async-ui-states', 'resilient-requests'],
  related: ['create-vue-project', 'service-layers', 'error-handling', 'auth-security', 'secrets-csp-dependencies', 'production-readiness', 'navigation-guards'],
  tags: ['import.meta.env', 'VITE_', '.env', 'modes', 'CORS', 'preflight', 'proxy', 'secrets', 'error handling', '401', 'refresh token', 'errorHandler', 'monitoring'],
  apis: [
    { name: 'import.meta.env', summary: 'Vite: build-time environment values — MODE, DEV, PROD, SSR, BASE_URL and your VITE_* variables.' },
    { name: 'VITE_ prefix', summary: 'Vite only exposes env variables starting with VITE_ (by default) to client code.' },
    { name: 'server.proxy', summary: 'Vite dev-server option that forwards e.g. /api to your backend during development.' },
    { name: 'Access-Control-Allow-Origin', summary: 'Response header with which a server allows another origin to read its responses.' },
    { name: 'app.config.errorHandler', summary: 'Vue: global handler for uncaught errors from components (render, hooks, watchers, event handlers).' },
  ],
  docs: [
    { label: 'Vite — Env Variables and Modes', url: 'https://vite.dev/guide/env-and-mode' },
    { label: 'Vite — server.proxy', url: 'https://vite.dev/config/server-options#server-proxy' },
    { label: 'API — app.config.errorHandler', url: 'https://vuejs.org/api/application.html#app-config-errorhandler' },
    { label: 'MDN — Cross-Origin Resource Sharing (CORS)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' },
    { label: 'MDN — Window: unhandledrejection event', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/unhandledrejection_event' },
  ],

  intro: `
Your app works on your laptop. Then it goes to **staging** and **production**, and three new kinds of problem appear:

1. **Configuration.** The API lives at \`localhost\` in development and at \`https://api.example.com\` in production. Vite lets you keep such values in **environment variables** (\`import.meta.env\`) that differ per *mode* — and it's crucial to know that every one of them ends up **public** in the JavaScript bundle.
2. **CORS.** When your frontend and API live on different origins, the browser blocks responses unless the server explicitly allows your origin. A "CORS error" is the most confusing message a frontend developer meets in their first deployment.
3. **Real failures.** Users go offline, servers crash, sessions expire. A production app turns all of that into one consistent error shape, shows people something they can act on, and quietly reports the details to developers.
`,

  why: `
These are the problems that never show up in tutorials and always show up on launch day:

- someone puts a payment provider's **secret key** in a \`VITE_\` variable "to keep it out of the code" — and ships it to every visitor;
- the app works locally (thanks to the dev server's proxy) and breaks in production with **"blocked by CORS policy"**;
- a user's token expires during a long session and every button silently fails, or they see **"HTTP 401"** and have no idea what to do;
- a server bug shows customers **"NullPointerException at InvoiceService.java:42"**.

Each has a well-known, boring fix. This lesson collects them: one config module, a clear mental model of CORS, and an HTTP client that normalises errors and refreshes sessions once.
`,

  eli15: `
**Environment variables** are like the settings on a game console: same game, different settings at home and at a tournament. Your app is the same code, but in "development" it talks to a test server and in "production" to the real one. Important: these settings are printed on the **outside of the box** — anyone can read them. So never write a password there.

**CORS** is a bouncer at the API's door. Your app (from \`shop.com\`) asks the API (at \`api.other.com\`) for data. The browser asks the bouncer: "is \`shop.com\` on your list?" If the API's answer doesn't include your name, the browser refuses to hand your app the reply. The bouncer works for the *browser*, protecting users — not for the server.

**Production errors**: when something breaks, tell the user something useful ("You're offline", "Please sign in again") and send the ugly technical details to the developers instead.
`,

  analogy: {
    title: 'A restaurant chain opening a new branch',
    body: `
A restaurant chain uses the **same recipe book** in every branch, but each branch has its own **address card**: which supplier to call, which phone number to print on the menu. That card is your environment configuration. It's printed on the menu that every customer takes home — fine for phone numbers, terrible for the safe's combination (secrets stay in the back office: your server).

When a branch orders from a supplier in another city, the supplier's receptionist checks the **approved customer list** before handing over the goods. That's CORS: the *supplier* decides who may collect deliveries, and the *courier* (the browser) enforces it.

And when the kitchen runs out of something, the waiter doesn't read the stock-control error code to the guest; they say "sorry, we're out of salmon — can I suggest the trout?" and the manager logs the problem.
`,
    mapping: [
      ['the recipe book', 'your app code — the same everywhere'],
      ['each branch\'s address card', '`.env.development`, `.env.production` → `import.meta.env`'],
      ['printed on the take-home menu', 'inlined into the public JavaScript bundle'],
      ['the safe combination in the back office', 'secrets kept on your server'],
      ['the supplier\'s approved customer list', '`Access-Control-Allow-Origin`'],
      ['"we\'re out of salmon — try the trout?"', 'a friendly error message with a next step'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'A cross-origin request with a preflight',
    caption: 'For "non-simple" requests (JSON bodies, an Authorization header, PUT/DELETE…) the browser first asks permission with OPTIONS. Your JavaScript only ever sees the final result.',
    alt: 'A sequence diagram. The Vue app at https://app.example.com calls fetch to https://api.example.com with a JSON body and an Authorization header. The browser first sends an OPTIONS preflight with Origin and Access-Control-Request-Method/Headers. The API answers with Access-Control-Allow-Origin, Allow-Methods and Allow-Headers. If allowed, the browser sends the real request; the response must again include Access-Control-Allow-Origin, and only then does the app receive the data. If any check fails, fetch rejects with a TypeError and the details appear only in the console.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'app', label: 'Vue app', note: 'https://app.example.com', tone: 'acid', x: 90, y: 80 },
        { id: 'browser', label: 'Browser', note: 'enforces CORS', tone: 'ink', x: 300, y: 80 },
        { id: 'preflight', label: 'OPTIONS preflight', note: 'Origin + Access-Control-Request-*', tone: 'kraft', x: 520, y: 60 },
        { id: 'api', label: 'API server', note: 'https://api.example.com', tone: 'cobalt', x: 690, y: 160 },
        { id: 'real', label: 'real request', note: 'POST + JSON + Authorization', tone: 'kraft', x: 520, y: 260 },
        { id: 'blocked', label: 'TypeError: Failed to fetch', note: 'details only in the console', tone: 'red', x: 200, y: 250 },
      ],
      edges: [
        { from: 'app', to: 'browser', label: 'fetch()' },
        { from: 'browser', to: 'preflight' },
        { from: 'preflight', to: 'api', label: 'may I?' },
        { id: 'allow', from: 'api', to: 'browser', label: 'Allow-Origin / Methods / Headers', dashed: true },
        { from: 'browser', to: 'real', label: 'allowed' },
        { from: 'real', to: 'api' },
        { id: 'deny', from: 'browser', to: 'blocked', label: 'not allowed', dashed: true },
      ],
      steps: [
        { focus: ['app', 'browser'], edges: ['app->browser'], text: 'The app (origin `https://app.example.com`) calls an API on a **different origin**. Origin = scheme + host + port; any difference counts.' },
        { focus: ['preflight', 'api'], edges: ['browser->preflight', 'preflight->api'], text: 'Because the request has a JSON body and an `Authorization` header, the browser first sends an **OPTIONS preflight** saying which origin, method and headers it wants to use.' },
        { focus: ['api', 'browser'], edges: ['allow'], text: 'The server answers with `Access-Control-Allow-Origin: https://app.example.com`, `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers`. This is a **server** setting — nothing in your Vue code can change it.' },
        { focus: ['real', 'api'], edges: ['browser->real', 'real->api'], text: 'Permission granted: the real request goes out. Its response must also carry `Access-Control-Allow-Origin`, or the browser still hides it from your code.' },
        { focus: ['blocked'], edges: ['deny'], text: 'If any check fails, `fetch` rejects with a generic `TypeError`. The real reason is only printed in the DevTools console — JavaScript can\'t read it.' },
      ],
    },
  },

  syntax: [
    `
#### Environment variables in Vite

Vite reads \`.env\` files from your project root and exposes values on \`import.meta.env\`. Only variables starting with **\`VITE_\`** reach client code (so server secrets in the same file aren't exposed by accident).
`,
    {
      code: `# .env                 — loaded in every mode
VITE_APP_NAME=Invoices

# .env.development     — \`vite\` (dev server) uses mode "development"
VITE_API_URL=/api

# .env.production      — \`vite build\` uses mode "production"
VITE_API_URL=https://api.example.com

# .env.staging         — \`vite build --mode staging\`
VITE_API_URL=https://api.staging.example.com

# .env.local / .env.[mode].local — your machine only, keep them out of git
DB_PASSWORD=hunter2   # no VITE_ prefix → NOT exposed to the browser`,
      lang: 'bash',
      title: '.env files',
      static: true,
    },
    {
      code: `// read them anywhere in client code
const apiUrl = import.meta.env.VITE_API_URL   // always a string (or undefined)

import.meta.env.MODE      // 'development' | 'production' | 'staging' | …
import.meta.env.DEV       // true when running the dev server
import.meta.env.PROD      // true in a production build
import.meta.env.BASE_URL  // the \`base\` option, e.g. '/'
import.meta.env.SSR       // true when the code runs on the server (SSR)`,
      lang: 'js',
      title: 'import.meta.env',
      static: true,
    },
    `
Rules worth memorising:

- A mode-specific file (\`.env.production\`) beats the generic \`.env\`, and \`.local\` files beat their non-local versions. Variables already set in the shell when Vite starts win over all files.
- Values are **strings**: \`VITE_FEATURE_X=false\` gives \`'false'\`, which is truthy. Convert explicitly.
- Vite **replaces** \`import.meta.env.VITE_…\` with the literal value at build time. Changing a value means rebuilding.
- **Everything in \`import.meta.env\` is public.** It's in the JavaScript any visitor downloads. Never put secrets (private API keys, database passwords, signing keys) in a \`VITE_\` variable. Call a backend endpoint that holds the secret instead — see [Secrets & CSP](lesson:secrets-csp-dependencies).

Read the env in **one** \`config.js\` module and import that everywhere. It gives you one place to validate values, convert types and fail fast when something is missing.

#### CORS in one paragraph

Browsers apply the **same-origin policy**: a page may only read responses from its own origin (scheme + host + port). **CORS** (Cross-Origin Resource Sharing) is how a server opts in to sharing with other origins, via response headers like \`Access-Control-Allow-Origin\`. "Simple" requests are sent directly; others — JSON \`Content-Type\`, an \`Authorization\` header, \`PUT\`/\`PATCH\`/\`DELETE\` — first trigger an \`OPTIONS\` **preflight**. Sending cookies cross-origin needs \`credentials: 'include'\` on the client *and* \`Access-Control-Allow-Credentials: true\` plus a specific (not \`*\`) allowed origin on the server.

CORS is enforced **by browsers** to protect users. It does not protect your server: \`curl\` or another server ignores it completely, so you still need authentication and authorisation.

#### Avoiding CORS in development: the Vite proxy
`,
    {
      code: `// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      // the browser calls http://localhost:5173/api/…, Vite forwards it to the backend
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
})`,
      lang: 'js',
      title: 'dev proxy (development only)',
      static: true,
    },
    `
The proxy exists only in the dev server. In production you need either the **same origin** (serve the app and API behind one domain, e.g. a reverse proxy routing \`/api\`) or correct **CORS headers** on the API.

#### Production error handling

Turn every failure into one shape with a \`kind\` the UI can switch on, a **user-safe message**, and the technical details for logs:
`,
    {
      code: `try {
  invoices.value = await request('/invoices')
} catch (e) {
  // e is always an ApiError: { kind, message, status }
  if (e.kind === 'auth') return showSignInPrompt()
  error.value = e.message          // safe, human, actionable
}`,
      lang: 'js',
      title: 'components see one error shape',
    },
    `
Expired sessions deserve special care. A common pattern: on a **401**, call the refresh endpoint **once** (shared by all requests that failed at the same moment), retry the original request with the new token, and only if refreshing fails, send the user to sign in — remembering where they were.
`,
    {
      code: `// main.js — the last line of defence
app.config.errorHandler = (err, instance, info) => {
  reportToMonitoring(err, { info })         // e.g. an error-tracking service
}

window.addEventListener('unhandledrejection', (event) => {
  reportToMonitoring(event.reason)          // promises nobody awaited or caught
})`,
      lang: 'js',
      title: 'global error reporting',
      static: true,
    },
    {
      callout: 'warn',
      title: 'Never log secrets or personal data',
      text: 'Error reports travel to third-party services and get read by many people. Strip tokens, passwords and personal data (emails, addresses) before logging, and never put access tokens in URLs — URLs end up in logs.',
    },
  ],

  walkthrough: {
    title: 'http.js — the production-ready client',
    lang: 'js',
    code: finishedHttp,
    intro: 'This is where the playground\'s `http.js` is heading: one place that knows the base URL, attaches the token, refreshes it once, and turns every failure into an `ApiError` with a friendly message.',
    steps: [
      { lines: [2, 4], text: 'The client depends on configuration (base URL per environment), the transport (fetch), and the session (current token). Components depend only on `request()`.' },
      { lines: [6, 11], text: 'User-facing messages live in one table: human, specific, and with a next step. Technical details never go here.' },
      { lines: [13, 20], text: 'One error class for the whole app. `kind` is what the UI switches on; `status` helps logging and edge cases.' },
      { lines: [22, 36], text: '`refreshOnce()` stores the refresh **promise**. If five requests get a 401 at the same moment, they all await the same refresh instead of firing five refresh calls (which could also invalidate each other\'s tokens).' },
      { lines: [38, 47], text: 'A network-level failure (offline, DNS, CORS block) makes fetch **reject**. Log the details, throw a friendly `network` error.' },
      { lines: [49, 51], text: 'On a 401, refresh once and retry the original request with the new token. The `retried` flag stops an infinite loop if the server keeps saying 401.' },
      { lines: [52, 56], text: 'Still 401 → the session is really over (`auth`). 5xx → log the server\'s message for developers and show users a generic apology — a stack trace helps nobody and can leak internals.' },
      { lines: [57, 58], text: 'Other 4xx are `client` errors; success parses JSON as usual.' },
    ],
  },

  playground: {
    title: 'My invoices',
    objective: 'Harden a naive HTTP client: friendly errors, an expired-session prompt, refresh-once-then-retry, and per-mode configuration.',
    files: { 'App.vue': invoicesApp, 'http.js': naiveHttp, 'config.js': configFile, 'session.js': sessionFile, 'api.js': serverFile },
    expected: '**Load my invoices** shows three invoices. Then use the dev tools: **Next call → 500** shows "HTTP 500", **Toggle offline** shows "Failed to fetch", **Expire access token** shows "HTTP 401". None of those help a user.',
    experiments: [
      {
        id: 'friendly-errors',
        task: 'Replace raw messages with human ones in `http.js`: for **5xx** responses throw an error whose message contains "Something went wrong **on our side**. Please try again in a moment." and when `fakeFetch` **rejects** (offline) throw one containing "You seem to be **offline**…". Never show the status code or the server\'s stack trace.',
        hint: 'Wrap the `fakeFetch` call in try/catch and throw `new Error(\'You seem to be offline. Check your connection and try again.\')` in the catch. After it: `if (res.status >= 500) throw new Error(\'Something went wrong on our side. Please try again in a moment.\')`.',
        tests: [
          {
            name: 'a 500 and an offline request both show friendly messages',
            code: `const { server } = requireModule('api.js')
server.nextStatus = 500
await click('.load')
await wait(400)
expect(text('.error')).toContain('on our side')
expect(text('.error')).not.toContain('500')
server.offline = true
await click('.load')
await wait(400)
expect(text('.error')).toContain('offline')`,
          },
        ],
        explain: 'Users can act on "you\'re offline" (check Wi-Fi) or "our fault, try again later". They can\'t act on "HTTP 500" or "Failed to fetch". Log the technical details (`console.error` here, a monitoring service in production) so developers still get them.',
      },
      {
        id: 'session-expired',
        task: 'Click **Expire whole session** (access *and* refresh token expired), then load. Show a dedicated prompt instead of a generic error: an element with `class="session-expired"` saying the session expired, with a **Sign in again** button. Make `http.js` mark 401 errors (e.g. `err.kind = \'auth\'`) so the template can tell them apart.',
        hint: 'In `http.js`: `if (res.status === 401) { const err = new Error(\'Your session expired. Please sign in again.\'); err.kind = \'auth\'; throw err }`. In the template, add `<div v-else-if="error && error.kind === \'auth\'" class="session-expired">…</div>` before the generic `.error`.',
        tests: [
          {
            name: 'an expired session shows .session-expired',
            code: `requireModule('api.js').expireSession({ refreshToo: true })
await click('.load')
await wait(600)
expect(exists('.session-expired')).toBe(true)
expect(exists('.invoice')).toBe(false)`,
          },
        ],
        explain: 'A 401 isn\'t a "try again" error — trying again will fail the same way. It needs a different action (sign in), so it gets a different UI. In a routed app you\'d redirect to the login page with `?redirect=` set to the current URL so the user comes back to where they were.',
      },
      {
        id: 'refresh-once',
        task: 'Click **Expire access token** (the refresh token is still valid), then load. Instead of giving up, `http.js` should call `POST /auth/refresh` **once** (via `fakeFetch(config.apiBaseUrl + \'/auth/refresh\', { method: \'POST\' })`), store the new `accessToken` in `session`, and **retry** the original request.',
        hint: 'Add a `retried` parameter: `request(path, { retried = false } = {})`. On `res.status === 401 && !retried`, call the refresh endpoint; if it returns ok, set `session.accessToken = (await r.json()).accessToken` and `return request(path, { retried: true })`.',
        tests: [
          {
            name: 'an expired access token is refreshed once and the invoices load',
            code: `const { expireSession, stats } = requireModule('api.js')
expireSession()
await click('.load')
await wait(700)
expect(findAll('.invoice').length).toBe(3)
expect(stats.refreshCalls).toBe(1)
expect(exists('.error')).toBe(false)`,
          },
        ],
        explain: 'Short-lived access tokens limit the damage if one leaks; refresh tokens let users stay signed in. The `retried` flag guarantees at most one refresh-and-retry per request — without it, a server that keeps answering 401 would cause an infinite loop. With several parallel requests you\'d also share one refresh promise (see the coding interview question).',
      },
      {
        id: 'staging-mode',
        task: 'Pretend you ran `vite build --mode staging`: in `config.js`, replace `import.meta.env.MODE` with the string `\'staging\'`. Watch the header switch API base URL and app name — no other file changes.',
        hint: 'Line `const MODE = import.meta.env.MODE` becomes `const MODE = \'staging\'`. (In a real project you\'d never edit this — the `--mode` flag selects `.env.staging`.)',
        tests: [{ name: 'the app now points at the staging API', code: `expect(text('.api-base')).toContain('staging')` }],
        explain: 'Because every environment-specific value flows through `config.js`, switching environments is a build flag, not a code change. Remember that each mode\'s values are baked into its bundle at build time — and are readable by anyone.',
      },
    ],
    variants: [
      { id: 'finished', label: 'Finished client (friendly errors + refresh once)', files: { 'App.vue': finishedApp, 'http.js': finishedHttp, 'config.js': configFile, 'session.js': sessionFile, 'api.js': serverFile } },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Where does the secret live?',
    caption: 'Anything your frontend can read, your users can read. Secrets belong on a server you control.',
    alt: 'Side-by-side code. Left: the Vue app reads import.meta.env.VITE_WEATHER_KEY and calls a third-party weather API directly; a note says the key is inlined into the bundle. Right: the Vue app calls its own /api/weather endpoint; a small server route reads process.env.WEATHER_KEY and calls the third-party API.',
    props: {
      left: {
        label: 'Secret in the bundle ✗',
        lang: 'js',
        code: `// WeatherWidget.vue
const key = import.meta.env.VITE_WEATHER_KEY // inlined at build time!
const res = await fetch(
  \`https://weather.example.com/v1?city=Pune&key=\${key}\`,
)
// anyone can open DevTools → Sources and copy the key`,
      },
      right: {
        label: 'Secret on your server ✓',
        lang: 'js',
        code: `// WeatherWidget.vue
const res = await fetch('/api/weather?city=Pune')

// server/routes/weather.js (Node, runs on YOUR server)
app.get('/api/weather', async (req, res) => {
  const key = process.env.WEATHER_KEY      // never sent to browsers
  const r = await fetch(\`https://weather.example.com/v1?city=\${req.query.city}&key=\${key}\`)
  res.json(await r.json())
})`,
      },
      points: [
        '`VITE_` variables are replaced with their literal values in the JavaScript you ship.',
        'Minifying or obfuscating doesn\'t help — the browser needs the real value to send it.',
        'A backend route (proxy / "backend for frontend") keeps the key server-side and can add rate limits and caching.',
        'Public, restricted keys (e.g. a maps key locked to your domain) are a deliberate exception — check the provider\'s docs.',
      ],
    },
  },

  internals: {
    beginner: `
\`import.meta.env.VITE_API_URL\` isn't looked up while your app runs. When Vite builds the app, it **replaces** that expression with the text from your \`.env\` file, as if you'd typed the value directly into your code. That's why you must rebuild after changing it — and why everyone who downloads the bundle can see it.

CORS isn't something Vue does either. It's a conversation between the **browser** and the **API server** about whether your page may read a response. Your code only sees the outcome: data, or a vague \`TypeError\`.
`,
    technical: [
      `
**Static replacement.** In development, Vite serves \`import.meta.env\` as an object; in a production build it statically replaces \`import.meta.env.VITE_*\` (and the built-ins) with literals, which also lets minifiers remove dead branches like \`if (import.meta.env.DEV) { … }\`. Dynamic access such as \`import.meta.env[name]\` is not reliably replaced — use the full static expression. For TypeScript autocompletion, declare your variables on the \`ImportMetaEnv\` interface (typically in \`src/vite-env.d.ts\`). Inside \`vite.config.js\` itself, \`import.meta.env\` isn't populated with your files yet; use Vite's \`loadEnv(mode, root)\` there.

**Runtime configuration.** Because values are baked in, one build = one environment. Teams that want "build once, deploy to many environments" fetch a small \`/config.json\` at startup or have the server inject a \`window.__CONFIG__\` script instead. Either way, it's still public.

**CORS mechanics.** A preflight is an \`OPTIONS\` request carrying \`Origin\`, \`Access-Control-Request-Method\` and \`Access-Control-Request-Headers\`. The server must answer with matching \`Access-Control-Allow-Origin\`, \`-Methods\` and \`-Headers\` (optionally \`Access-Control-Max-Age\` so browsers cache the permission). The actual response must also carry \`Access-Control-Allow-Origin\`. With credentials, \`*\` is not allowed — the server must echo a specific origin and send \`Access-Control-Allow-Credentials: true\`. Error responses (4xx/5xx) also need the CORS headers, otherwise your code can't even read the error status. Requests from \`fetch\` with \`mode: 'no-cors'\` don't "fix" anything: they produce an **opaque** response your code can't read.
`,
      {
        code: `// What your code can observe
try {
  await fetch('https://api.other-origin.com/data', { headers: { Authorization: 'Bearer …' } })
} catch (e) {
  e.name    // 'TypeError'
  e.message // e.g. 'Failed to fetch' (wording differs between browsers)
  // CORS failure, DNS failure and "offline" look the same from here:
  // the precise reason is only shown in the DevTools console.
}`,
        lang: 'js',
        title: 'why CORS errors are vague',
      },
      `
**Error normalisation.** Errors reach the client in different shapes: a rejected \`fetch\` (\`TypeError\`), an \`AbortError\`, a \`Response\` with a status and maybe a JSON body, a body that isn't JSON at all (an HTML gateway page), or a bug in your own code. A \`toApiError()\` function at the boundary converts all of them into one type, so components handle *kinds* (network, auth, forbidden, not-found, client/validation, server) instead of raw objects.

**Vue's error hooks.** \`app.config.errorHandler\` receives uncaught errors from component render functions, setup, lifecycle hooks, watchers and event handlers (including rejected promises returned by async handlers and hooks). Errors from your own \`setTimeout\` callbacks or promises nobody awaits bypass Vue — \`window\`'s \`unhandledrejection\` and \`error\` events catch those.
`,
    ],
    production: `
- **Config:** one \`config.js\` that reads, converts and validates env values at startup; fail loudly (in development) when a required value is missing.
- **No secrets in the frontend, ever.** Treat every \`VITE_\` value as public. Proxy third-party calls through your backend; rotate any key that was ever shipped.
- **CORS:** prefer same-origin deployments (app and API behind one domain). Otherwise allow-list exact origins per environment on the API, include CORS headers on error responses too, and avoid \`*\` with credentials.
- **Errors:** one \`ApiError\` shape; human messages mapped by kind; validation messages from the server shown next to fields; generic text for 5xx.
- **Sessions:** refresh once per burst of 401s (shared promise), retry once, then redirect to login with a return URL; clear caches and state on logout; consider syncing logout across tabs.
- **Observability:** \`app.config.errorHandler\` + \`unhandledrejection\` → an error-monitoring service, with release/version tags and scrubbing of tokens and personal data. Don't report \`AbortError\`s or expected 4xx as crashes.
- **Resilience:** timeouts on every request (\`AbortSignal.timeout\`), retries for transient failures ([previous lesson](lesson:resilient-requests)), and an offline hint (\`navigator.onLine === false\` reliably means offline; \`true\` doesn't guarantee internet access).
`,
  },

  mistakes: [
    {
      title: 'Putting a secret in a VITE_ variable',
      wrong: { code: `# .env\nVITE_STRIPE_SECRET_KEY=sk_live_…   # shipped to every visitor`, lang: 'bash' },
      right: { code: `# server-side env (never prefixed with VITE_)\nSTRIPE_SECRET_KEY=sk_live_…\n# the frontend calls YOUR backend: POST /api/checkout`, lang: 'bash' },
      explanation: '`VITE_` means "expose this to the browser". Anything exposed is public. Keep secrets on a server and expose only endpoints that use them on the user\'s behalf.',
    },
    {
      title: 'Treating env values as booleans or numbers',
      wrong: { code: `if (import.meta.env.VITE_ENABLE_BETA) showBeta() // 'false' is a truthy string`, lang: 'js' },
      right: { code: `const enableBeta = import.meta.env.VITE_ENABLE_BETA === 'true'\nif (enableBeta) showBeta()`, lang: 'js' },
      explanation: 'Env values are strings. Convert them once, in your config module.',
    },
    {
      title: 'Trying to fix CORS in the frontend',
      wrong: { code: `fetch(url, {\n  headers: { 'Access-Control-Allow-Origin': '*' }, // a RESPONSE header, sent by the client?\n  mode: 'no-cors',                                // opaque response you can't read\n})`, lang: 'js' },
      right: { code: `// Fix it where it lives:\n// - API: Access-Control-Allow-Origin: https://app.example.com (+ methods/headers)\n// - or serve app and API from the same origin (reverse proxy /api)\n// - in dev: Vite server.proxy`, lang: 'js' },
      explanation: 'CORS permission is granted by the server\'s response headers. Adding them to the request does nothing, and `no-cors` gives you an opaque response with no readable body.',
    },
    {
      title: 'Showing raw server errors to users',
      wrong: { code: `catch (e) {\n  error.value = e.message // "NullPointerException at InvoiceService.java:42"\n}`, lang: 'js' },
      right: { code: `catch (e) {\n  const err = toApiError(e)\n  error.value = err.message      // "Something went wrong on our side…"\n  report(err.details)            // developers get the details\n}`, lang: 'js' },
      explanation: 'Technical messages confuse users and can leak implementation details. Map errors to friendly text and log the specifics.',
    },
    {
      title: 'Refreshing the token once per failed request',
      wrong: { code: `if (res.status === 401) {\n  await refreshToken() // 5 parallel requests → 5 refresh calls\n  return request(path)  // no retry limit → possible infinite loop\n}`, lang: 'js' },
      right: { code: `if (res.status === 401 && !retried && (await refreshOnce())) {\n  return request(path, { retried: true })\n}`, lang: 'js' },
      explanation: 'Share one refresh promise between concurrent requests (some servers rotate refresh tokens, so parallel refreshes can invalidate each other) and retry at most once.',
    },
  ],

  debugging: [
    {
      symptom: '`import.meta.env.VITE_API_URL` is `undefined`.',
      cause: 'Missing `VITE_` prefix, the file is in the wrong folder (it must be in the project root, or your `envDir`), wrong mode, or the dev server wasn\'t restarted after creating the file.',
      fix: 'Check the prefix and location, log `import.meta.env.MODE`, and restart the dev server.',
    },
    {
      symptom: 'Console: "has been blocked by CORS policy: No \'Access-Control-Allow-Origin\' header is present".',
      cause: 'The API doesn\'t allow your origin, or the error response (e.g. a 500) lacks CORS headers.',
      fix: 'Configure the API to allow your exact origin (including on error responses), or serve app and API from the same origin. In development use the Vite proxy.',
    },
    {
      symptom: 'It works locally but every API call fails in production with "Failed to fetch".',
      cause: 'Locally the Vite proxy made requests same-origin; production calls the API cross-origin (or the base URL env var points to localhost).',
      fix: 'Check the built base URL (Network tab), add CORS on the API or a production reverse proxy, and set the right `.env.production` value.',
    },
    {
      symptom: 'After a while, every action fails with 401 until the user reloads.',
      cause: 'The access token expired and nothing refreshes it or sends the user to sign in.',
      fix: 'Handle 401 centrally: refresh once and retry, otherwise redirect to login with a return URL.',
    },
    {
      symptom: 'The refresh endpoint is called many times at once and users get logged out randomly.',
      cause: 'Each failing request triggers its own refresh; with rotating refresh tokens, later refreshes use an already-invalidated token.',
      fix: 'Share a single in-flight refresh promise between all requests.',
    },
  ],

  bestPractices: [
    'Read environment values once in a `config.js`; convert types and validate there.',
    'Treat everything in `import.meta.env` as public; keep secrets on a server.',
    'Commit `.env` / `.env.[mode]` with safe defaults; keep `.env.local` files out of git.',
    'Prefer same-origin deployments; otherwise allow-list exact origins in the API\'s CORS config.',
    'Normalise every failure into one error type with a `kind` and a user-safe message.',
    'Handle 401 centrally: one shared refresh, one retry, then sign-in with a return URL.',
    'Report uncaught errors via `app.config.errorHandler` and `unhandledrejection`, scrubbing tokens and personal data.',
  ],

  useCases: [
    'Pointing dev, staging and production builds at different APIs.',
    'Feature flags that differ per environment (as non-secret strings).',
    'Deploying a Vue SPA on a different domain than its API.',
    'Keeping users signed in across long sessions with token refresh.',
    'Turning crashes and outages into calm, actionable messages and monitoring alerts.',
  ],

  whenToUse: {
    use: [
      '`VITE_` variables for public, environment-specific settings: API base URLs, public keys, feature flags.',
      'A backend proxy whenever a third-party call needs a secret.',
      'The Vite dev proxy to avoid CORS during development.',
      'Central 401 handling in your HTTP client.',
    ],
    avoid: [
      'Secrets of any kind in frontend env variables.',
      '`mode: \'no-cors\'` or client-side "CORS headers" as a fix.',
      'Showing raw status codes, stack traces or server exception text to users.',
      'Refreshing tokens independently in every request.',
    ],
  },

  comparison: {
    title: 'Where should this value live?',
    headers: ['', 'Hard-coded in source', '`VITE_` env variable', 'Runtime config (`/config.json`)', 'Server-side env / secret store'],
    rows: [
      ['Visible to users?', 'yes', 'yes', 'yes', '**no**'],
      ['Differs per environment?', 'no', 'yes (per build)', 'yes (per deployment)', 'yes'],
      ['Change without rebuilding?', 'no', 'no', 'yes', 'yes'],
      ['Good for', 'constants', 'API URLs, public keys, flags', 'one build deployed to many environments', 'API secrets, DB passwords, signing keys'],
    ],
    note: 'Only the last column can hold secrets.',
  },

  quiz: [
    {
      id: 'api-production-q1',
      type: 'mcq',
      prompt: 'You put `VITE_MAPS_SECRET=abc123` in `.env.production` and build. Who can read `abc123`?',
      options: [
        { text: 'Anyone who loads the site — it is inlined into the JavaScript bundle.' },
        { text: 'Only your server, because .env files are never deployed.', why: 'The file isn\'t deployed, but Vite copied the value into the built JavaScript.' },
        { text: 'Nobody, because the build minifies it.', why: 'Minification renames variables; string values stay readable.' },
        { text: 'Only logged-in users.', why: 'The bundle is downloaded before anyone logs in.' },
      ],
      answer: 0,
      explanation: 'Vite replaces `import.meta.env.VITE_*` with literal values at build time. They are public by design — never use them for secrets.',
    },
    {
      id: 'api-production-q2',
      type: 'output',
      prompt: 'Given these files, what is `import.meta.env.VITE_API_URL` after running `vite build` (no `--mode` flag)?',
      code: {
        lang: 'bash',
        code: `# .env
VITE_API_URL=http://localhost:3000

# .env.production
VITE_API_URL=https://api.example.com

# .env.staging
VITE_API_URL=https://api.staging.example.com`,
      },
      options: ['`http://localhost:3000`', '`https://api.example.com`', '`https://api.staging.example.com`', '`undefined`'],
      answer: 1,
      explanation: '`vite build` uses mode `production` by default, and the mode-specific `.env.production` overrides the generic `.env`. `.env.staging` would only load with `--mode staging`.',
    },
    {
      id: 'api-production-q3',
      type: 'bug',
      prompt: 'The beta banner shows up in production even though `.env.production` says `VITE_SHOW_BETA=false`. Click the buggy line.',
      code: {
        lang: 'js',
        code: `// config.js
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  showBeta: import.meta.env.VITE_SHOW_BETA,
  appName: import.meta.env.VITE_APP_NAME ?? 'Invoices',
}`,
      },
      answerLine: 4,
      explanation: 'Env values are strings, and `\'false\'` is truthy. Convert explicitly: `showBeta: import.meta.env.VITE_SHOW_BETA === \'true\'`.',
    },
    {
      id: 'api-production-q4',
      type: 'fill',
      prompt: 'Complete the facts about Vite env variables.',
      code: {
        lang: 'js',
        code: `// Only variables starting with ___ are exposed to client code
const url = import.meta.env.VITE_API_URL

// true when running the dev server
if (import.meta.env.___) console.log('dev mode')`,
      },
      answer: [['VITE_'], ['DEV']],
      explanation: 'The `VITE_` prefix (configurable via `envPrefix`) controls exposure. `DEV` is true in the dev server; `PROD` is true in production builds.',
    },
    {
      id: 'api-production-q5',
      type: 'mcq',
      prompt: 'Your SPA at `https://app.example.com` calls `https://api.example.com` and gets a CORS error. Where is the fix?',
      options: [
        { text: 'On the API (or infrastructure): allow `https://app.example.com` with the right CORS headers, or route both through one origin.' },
        { text: 'Add `Access-Control-Allow-Origin: *` to the request headers in fetch.', why: 'That is a response header the server must send. Adding it to the request doesn\'t grant anything (and may even trigger a preflight).' },
        { text: 'Use `mode: \'no-cors\'` in fetch.', why: 'You\'d get an opaque response with no readable status or body.' },
        { text: 'Install a CORS plugin for Vue.', why: 'CORS is negotiated between browser and server; no frontend plugin can grant permission.' },
      ],
      answer: 0,
      explanation: 'Different subdomains are different origins. The server decides who may read its responses; the browser enforces it.',
    },
    {
      id: 'api-production-q6',
      type: 'mcq',
      prompt: 'Select **all** statements that are true.',
      options: [
        { text: 'CORS stops other websites\' JavaScript from reading your API\'s responses in a user\'s browser.' },
        { text: 'CORS stops attackers using curl from calling your API.', why: 'CORS is enforced by browsers only. Your API still needs authentication and authorisation.' },
        { text: 'A JSON request with an `Authorization` header usually triggers a preflight.' },
        { text: 'The Vite dev proxy also works in the production build.', why: '`server.proxy` only exists in the dev server. Production needs CORS or a same-origin setup.' },
      ],
      answer: [0, 2],
      explanation: 'CORS protects users\' browsers, not servers. Non-safelisted headers (like Authorization) and JSON content types make a request "non-simple", so the browser preflights it.',
    },
    {
      id: 'api-production-q7',
      type: 'short',
      prompt: 'Why should five requests that all receive a 401 at the same moment share **one** token refresh?',
      answer: 'Five independent refreshes waste requests and race each other. Many servers rotate refresh tokens — each refresh invalidates the previous refresh token — so the second to fifth refresh may fail and log the user out. Sharing one in-flight refresh promise means one refresh call, one new token, and all five requests retry with it.',
    },
  ],

  exercises: [
    {
      id: 'normalize-errors',
      title: 'One error shape for the whole app',
      difficulty: 'intermediate',
      prompt: `
Implement \`toApiError(raw)\` in **errors.js**. \`raw\` is either a thrown error (like \`new TypeError('Failed to fetch')\` or an \`AbortError\`) or an HTTP failure object \`{ status, body }\`. Return an \`ApiError\` (class provided) with this \`kind\` and user-facing \`message\`:

| input | kind | message must contain |
|---|---|---|
| \`raw.name === 'AbortError'\` | \`aborted\` | (empty string) |
| no numeric \`status\` (network failure) | \`network\` | "offline" |
| 401 | \`auth\` | "sign in" |
| 403 | \`forbidden\` | "permission" |
| 404 | \`not-found\` | "couldn't find" |
| any other 4xx | \`client\` | the server's \`body.message\` if present |
| 5xx | \`server\` | "on our side" — **never** the server's message |

Also set \`status\` (or \`null\`) and keep the original \`raw\` in \`details\`. An \`ApiError\` passed in is returned unchanged.
`,
      files: { 'App.vue': errorsApp, 'errors.js': errorsStarter },
      hints: [
        'Handle the special cases first: an existing `ApiError`, then `raw.name === \'AbortError\'`.',
        'Read `const status = typeof raw.status === \'number\' ? raw.status : null`. `null` means the request never got an HTTP answer → `network`.',
        'Then check 401, 403, 404, `>= 500`, and finally the remaining 4xx using `raw.body && raw.body.message`.',
      ],
      solution: {
        explanation: 'Classifying once at the boundary means every component handles the same small set of kinds. Users get messages they can act on; the raw error stays in `details` for logging. Note the asymmetry: 4xx validation messages are written for users and can be shown; 5xx messages are internal and must not be.',
        files: { 'App.vue': errorsApp, 'errors.js': errorsSolution },
      },
      tests: [
        {
          name: 'network errors and aborts',
          code: `const { toApiError } = requireModule('errors.js')
const net = toApiError(new TypeError('Failed to fetch'))
expect(net.kind).toBe('network')
expect(net.status).toBeNull()
expect(net.message.toLowerCase()).toContain('offline')
const abort = new DOMException('aborted', 'AbortError')
expect(toApiError(abort).kind).toBe('aborted')
expect(toApiError(abort).message).toBe('')`,
        },
        {
          name: '401, 403 and 404',
          code: `const { toApiError } = requireModule('errors.js')
const auth = toApiError({ status: 401, body: { message: 'jwt expired' } })
expect(auth.kind).toBe('auth')
expect(auth.message.toLowerCase()).toContain('sign in')
expect(toApiError({ status: 403 }).kind).toBe('forbidden')
expect(toApiError({ status: 403 }).message.toLowerCase()).toContain('permission')
expect(toApiError({ status: 404 }).kind).toBe('not-found')
expect(toApiError({ status: 404 }).message.toLowerCase()).toContain("couldn't find")`,
        },
        {
          name: 'other 4xx show the server message; 5xx never do',
          code: `const { toApiError } = requireModule('errors.js')
const invalid = toApiError({ status: 422, body: { message: 'That email is already registered.' } })
expect(invalid.kind).toBe('client')
expect(invalid.message).toBe('That email is already registered.')
const crash = toApiError({ status: 500, body: { message: 'NullPointerException' } })
expect(crash.kind).toBe('server')
expect(crash.status).toBe(500)
expect(crash.message).toContain('on our side')
expect(crash.message).not.toContain('NullPointer')
expect(crash.details.body.message).toBe('NullPointerException')`,
        },
        {
          name: 'an ApiError passes through unchanged',
          code: `const { toApiError, ApiError } = requireModule('errors.js')
const original = new ApiError('auth', 'Please sign in', 401)
expect(toApiError(original)).toBe(original)`,
        },
        {
          name: 'the demo page shows friendly text',
          code: `await click('.crash')
expect(text('.shown')).toContain('on our side')
await click('.invalid')
expect(text('.shown')).toBe('That email is already registered.')`,
        },
      ],
    },
    {
      id: 'no-secrets',
      title: 'Get the secret out of the bundle',
      difficulty: 'beginner',
      prompt: `
A teammate added a weather widget. To call the third-party weather API they put the **secret key** in \`config.js\` (imagine it came from \`import.meta.env.VITE_WEATHER_KEY\`) and call \`thirdPartyWeather(city, key)\` straight from the browser.

Your backend already has a proxy endpoint, \`getWeatherViaProxy(city)\` in **api.js**, which adds the key on the server.

- Remove the secret from **config.js** — no exported value may contain \`sk_\`.
- Make the \`button.load\` call \`getWeatherViaProxy('Pune')\` so \`.weather\` shows the temperature.
- The page must not call \`thirdPartyWeather\` itself any more — only the proxy does, on the server side (the tests check \`stats.proxyCalls\`).
`,
      files: {
        'App.vue': weatherStarter,
        'api.js': weatherServer,
        'config.js': `// config.js
export const config = {
  apiBaseUrl: '/api',
  // came from import.meta.env.VITE_WEATHER_KEY — shipped to every visitor!
  weatherApiKey: 'sk_live_51HxYzSecretWeatherKey',
}`,
      },
      hints: [
        'Delete the `weatherApiKey` line from `config.js`.',
        'In App.vue import `getWeatherViaProxy` instead of `thirdPartyWeather`, and drop the `config` import if unused.',
        '`weather.value = await getWeatherViaProxy(\'Pune\')`.',
      ],
      solution: {
        explanation: 'The browser now asks *your* server for the weather, and the server talks to the third party with a key the browser never sees. In real life you would also rotate the leaked key — anything that was ever shipped must be considered public.',
        files: {
          'App.vue': weatherSolution,
          'api.js': weatherServer,
          'config.js': `// config.js — public, environment-specific settings only
export const config = {
  apiBaseUrl: '/api',
}`,
        },
      },
      tests: [
        { name: 'config.js contains no secret key', code: `expect(JSON.stringify(requireModule('config.js'))).not.toContain('sk_')` },
        {
          name: 'the weather loads through the proxy',
          code: `const { stats } = requireModule('api.js')
await click('.load')
await wait(300)
expect(text('.weather')).toContain('°C')
expect(stats.proxyCalls).toBe(1)
expect(stats.thirdPartyCalls).toBe(1)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'api-production-hide-key',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Can you hide an API key by putting it in a `VITE_` environment variable instead of the source code?',
      answer: 'No. Vite inlines `import.meta.env.VITE_*` values into the JavaScript bundle at build time, so anyone can read them in DevTools. Env variables keep configuration out of your *repository* and vary it per environment — they don\'t make anything secret in a browser app. Secrets must stay on a server; the frontend calls a backend endpoint that uses the secret.',
      explanation: 'The browser needs the real value to send it, so the user can always see it.',
      whyAsked: 'A classic security filter question; a wrong answer here can cost a company real money.',
      mistakes: ['Saying minification or obfuscation hides it.', 'Saying `.env` files aren\'t deployed so it\'s safe.', 'Not offering the backend-proxy alternative.'],
      followUps: ['What about public keys like a maps key?', 'What do you do if a secret was already shipped?', 'How would you build the proxy?'],
      modelAnswer: 'No. `VITE_` variables are replaced with their literal values when Vite builds the app, so they ship inside the JavaScript every visitor downloads. Env files are useful for per-environment configuration and for keeping values out of git, but nothing in a browser bundle is secret. If a call needs a secret, I put a small endpoint on our backend that holds the key in a server-side env var and makes the call for the user. If a secret was already shipped, I\'d rotate it immediately.',
    },
    {
      id: 'api-production-cors',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What is CORS, who enforces it, and what is a preflight request?',
      answer: 'Browsers enforce the same-origin policy: a page can only read responses from its own origin (scheme + host + port). CORS lets a server opt in to sharing with other origins via headers like `Access-Control-Allow-Origin`. For non-simple requests — e.g. JSON bodies, an Authorization header, or PUT/PATCH/DELETE — the browser first sends an OPTIONS preflight with `Origin`, `Access-Control-Request-Method` and `-Headers`; only if the server\'s answer allows them does it send the real request. Browsers enforce it to protect users; it doesn\'t protect the server from non-browser clients.',
      explanation: 'The server grants, the browser enforces, your JavaScript just sees success or a TypeError.',
      whyAsked: 'Every frontend developer hits CORS; explaining it clearly shows real understanding.',
      mistakes: ['Thinking the frontend can fix CORS.', 'Calling CORS a server security feature.', 'Not knowing what triggers a preflight.'],
      followUps: ['How do credentials (cookies) change things?', 'Why doesn\'t `no-cors` help?', 'How does the Vite proxy avoid CORS?'],
      modelAnswer: 'By default a browser won\'t let a page read responses from another origin — that\'s the same-origin policy. CORS is the server\'s way of saying "this other origin may read my responses", using headers like Access-Control-Allow-Origin. For requests that aren\'t "simple" — a JSON content type, an Authorization header, PUT or DELETE — the browser first sends an OPTIONS preflight describing what it wants to do, and only proceeds if the server\'s response allows it. It\'s enforced by browsers to protect users\' data from other sites; tools like curl ignore it, so the API still needs real auth.',
    },
    {
      id: 'api-production-dev-vs-prod-cors',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Everything works with `npm run dev`. After deploying the SPA to `https://app.example.com`, every API call fails with "blocked by CORS policy". What happened and how do you fix it?',
      answer: 'In development, Vite\'s `server.proxy` forwarded `/api` to the backend, so the browser saw same-origin requests and CORS never applied. The production build has no proxy: it calls the API on another origin (or the base URL still points somewhere else), and the API doesn\'t allow `https://app.example.com`. Fix: either serve the API under the same origin (reverse proxy routing `/api` on the app\'s domain) or configure the API to send the right CORS headers for that exact origin, including on preflights and error responses; and verify the production `VITE_API_URL`.',
      explanation: 'The dev proxy hid the cross-origin nature of the setup.',
      whyAsked: 'An extremely common first-deployment incident; tests understanding of dev tooling vs production.',
      mistakes: ['Trying `mode: \'no-cors\'`.', 'Allowing `*` together with credentials.', 'Not checking the actual URL being called in production.'],
      followUps: ['Which option do you prefer and why?', 'What about cookies across subdomains?', 'How do you test this before release?'],
      modelAnswer: 'Locally the Vite dev server proxied `/api` to the backend, so from the browser\'s point of view everything was same-origin and CORS never came up. The production bundle has no dev server, so it calls the API cross-origin, and the API isn\'t configured to allow our app\'s origin. I\'d first check in the Network tab which URL is actually called — maybe the env var is wrong. Then either put the API behind the same domain with a reverse proxy, which I usually prefer, or add CORS headers on the API for our exact origin, making sure preflight and error responses carry them too.',
    },
    {
      id: 'api-production-401-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design app-wide handling of expired sessions in a Vue SPA with short-lived access tokens and a refresh token.',
      answer: 'Centralise it in the HTTP client: attach the access token to every request; on 401, call the refresh endpoint through a single shared in-flight promise (so concurrent 401s trigger one refresh), then retry each original request once with the new token. If refresh fails, clear auth state and caches, and redirect to the login route with the current path as `redirect` so the user returns afterwards. Keep the refresh token in an httpOnly cookie where possible. Optionally refresh proactively before expiry, sync logout across tabs, and never retry more than once to avoid loops. Navigation guards protect routes, but the server authorises every request.',
      explanation: 'One place, one refresh, one retry, then a graceful sign-in.',
      whyAsked: 'Auth flows are cross-cutting and easy to get subtly wrong; this tests architecture and security awareness.',
      mistakes: ['Handling 401 in every component.', 'Refreshing per request (races with rotating tokens).', 'Infinite retry loops.', 'Losing the user\'s place on redirect.'],
      followUps: ['Where would you store the access token?', 'How do you handle a refresh happening while the user submits a form?', 'How do you log out in all tabs?'],
      modelAnswer: 'I\'d handle it entirely in the HTTP client so components never think about tokens. Requests carry the short-lived access token. When one returns 401, the client starts a refresh — or joins the one already in flight, because concurrent refreshes race and rotating refresh tokens would log the user out — and then retries the original request once. If the refresh fails, the session is over: I clear auth state and caches and route to login with `redirect` set to the current path. The refresh token ideally lives in an httpOnly cookie. Route guards improve UX, but the server still authorises every call.',
    },
    {
      id: 'api-production-error-strategy',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You\'re preparing a Vue app for launch. What is your strategy for handling and reporting API and runtime errors in production?',
      answer: 'At the boundary, normalise everything into one `ApiError` with a kind (network, auth, forbidden, not-found, client, server, aborted), status and a user-safe message; keep details for logs. In the UI, show errors where users can act (inline with retry, field-level validation, sign-in prompt for auth), never raw stack traces. Add timeouts and transient retries. Globally, register `app.config.errorHandler` and a `window` `unhandledrejection` listener that report to an error-monitoring service with release tags, scrubbing tokens and personal data, and filtering expected noise (aborts, normal 4xx). Watch the dashboards after release.',
      explanation: 'Users get clarity; developers get signal; nobody gets secrets.',
      whyAsked: 'Production readiness is a core senior responsibility.',
      mistakes: ['Only `console.log`.', 'Reporting every 404 and abort as a crash.', 'Logging access tokens or personal data.'],
      followUps: ['What does `app.config.errorHandler` not catch?', 'How would you add error boundaries for sections of the page?', 'How do you correlate a user report with server logs?'],
      modelAnswer: 'I start with one error type at the HTTP boundary, so every failure has a kind, a status and a friendly message, with the raw details attached for logging. Components show errors where the user can act — retry for network and server errors, messages next to fields for validation, a sign-in prompt for auth — and never stack traces. Requests get timeouts and limited retries. Then global reporting: `app.config.errorHandler` for anything thrown in components and `unhandledrejection` for stray promises, both sending to a monitoring service tagged with the release, with tokens and personal data scrubbed and aborts filtered out. A request id in error messages helps match user reports to server logs.',
    },
    {
      id: 'api-production-refresh-once',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Implement `refreshOnce()` in **auth.js**. It calls `postRefresh()` (from api.js) and resolves to the new access token. If a refresh is already in flight, it returns **the same promise** instead of starting another. After the refresh settles (success or failure), the next call starts a new refresh. Failures reject.',
      starter: {
        files: {
          'App.vue': refreshApp,
          'api.js': refreshApi,
          'auth.js': `// auth.js
import { postRefresh } from './api.js'

export async function refreshOnce() {
  const { accessToken } = await postRefresh()
  return accessToken
}`,
        },
      },
      tests: [
        {
          name: 'three concurrent calls trigger one refresh and get the same token',
          code: `const { refreshOnce } = requireModule('auth.js')
const { stats } = requireModule('api.js')
const tokens = await Promise.all([refreshOnce(), refreshOnce(), refreshOnce()])
expect(stats.refreshCalls).toBe(1)
expect(tokens).toEqual(['token-1', 'token-1', 'token-1'])`,
        },
        {
          name: 'a later call starts a new refresh',
          code: `const { refreshOnce } = requireModule('auth.js')
const { stats } = requireModule('api.js')
await refreshOnce()
const next = await refreshOnce()
expect(stats.refreshCalls).toBe(2)
expect(next).toBe('token-2')`,
        },
        {
          name: 'a failed refresh rejects and is not remembered',
          code: `const { refreshOnce } = requireModule('auth.js')
const { server, stats } = requireModule('api.js')
server.refreshValid = false
let failures = 0
await Promise.all([refreshOnce().catch(() => failures++), refreshOnce().catch(() => failures++)])
expect(failures).toBe(2)
expect(stats.refreshCalls).toBe(1)
server.refreshValid = true
expect(await refreshOnce()).toBe('token-1')`,
        },
        {
          name: 'the page shows one shared token',
          code: `await click('.burst')
await wait(250)
expect(text('.tokens')).toBe('token-1, token-1, token-1')`,
        },
      ],
      hints: ['Keep `let inFlight = null` at module level.', 'If `inFlight` is set, return it. Otherwise assign `inFlight = postRefresh().then((r) => r.accessToken)`.', 'Add `.finally(() => { inFlight = null })` so both success and failure release it.'],
      answer: 'Store the pending refresh promise in a module variable; return it while it exists; clear it in `finally`.',
      solution: {
        files: {
          'App.vue': refreshApp,
          'api.js': refreshApi,
          'auth.js': `// auth.js
import { postRefresh } from './api.js'

let inFlight = null

export function refreshOnce() {
  if (!inFlight) {
    inFlight = postRefresh()
      .then((res) => res.accessToken)
      .finally(() => {
        inFlight = null
      })
  }
  return inFlight
}`,
        },
      },
      explanation: 'The promise itself is the lock: everyone who arrives while it is pending awaits the same result. Clearing it in `finally` ensures a failed refresh doesn\'t poison future attempts — the same dedupe pattern as in [Retries, caching, dedupe & polling](lesson:resilient-requests).',
      whyAsked: 'A real production bug class (refresh storms) solved with a precise understanding of promises.',
      mistakes: ['Using a boolean flag instead of sharing the promise (callers can\'t await the result).', 'Clearing only on success.', 'Making the function `async` and creating a new promise per call around the shared one — fine, but easy to get wrong.'],
      followUps: ['How would the HTTP client use this on a 401?', 'What if the refresh token is rotated on each use?', 'How would you sync the new token across browser tabs?'],
      modelAnswer: 'I keep the in-flight refresh promise in a module-level variable. If it\'s set, I return it, so every caller during the refresh awaits the same token. Otherwise I start `postRefresh()`, map it to the access token, and attach a `finally` that clears the variable whether it succeeded or failed — so a failure is reported to everyone waiting but doesn\'t block the next attempt. The HTTP client calls it on a 401 and retries the original request once with the new token.',
    },
    {
      id: 'api-production-env-priority',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'A project has `.env` with `VITE_TITLE=Shop`, `.env.development` with `VITE_TITLE=Shop (dev)` and a git-ignored `.env.development.local` with `VITE_TITLE=Shop (Ada)`. What does `import.meta.env.VITE_TITLE` show when Ada runs `npm run dev`?',
      options: ['`Shop`', '`Shop (dev)`', '`Shop (Ada)`', '`undefined`'],
      correctOption: 2,
      answer: '`Shop (Ada)`. The dev server uses mode `development`; mode-specific files beat `.env`, and `.local` files beat their non-local versions, so `.env.development.local` wins.',
      explanation: 'Priority (highest first): variables already in the shell, `.env.[mode].local`, `.env.[mode]`, `.env.local`, `.env`.',
      whyAsked: 'Checks practical knowledge of Vite configuration that causes "works on my machine" confusion.',
      mistakes: ['Thinking `.env` always wins.', 'Not knowing `vite` (dev) uses mode development.', 'Committing `.local` files.'],
      followUps: ['What would `vite build` show?', 'How do you add a staging mode?', 'Why are `.local` files git-ignored?'],
      modelAnswer: 'It shows "Shop (Ada)". `npm run dev` runs Vite in development mode, so it loads `.env`, `.env.local`, `.env.development` and `.env.development.local`. Mode-specific files override the generic one, and local files override their committed counterparts, so Ada\'s personal file wins. A production build would ignore the development files and use `.env.production` or fall back to `.env`.',
    },
  ],

  takeaways: [
    'Vite exposes `VITE_`-prefixed variables (plus MODE, DEV, PROD, SSR, BASE_URL) on `import.meta.env`, inlined at build time.',
    'Everything in the frontend bundle is public: no secrets in env variables — use a backend proxy.',
    'Env values are strings; read, convert and validate them once in a `config.js`.',
    'CORS is granted by the server and enforced by the browser; fix it on the API or with a same-origin setup (Vite\'s proxy is dev-only).',
    'Normalise failures into one `ApiError` with a kind and a friendly message; log details, never stack traces to users.',
    'Handle 401 centrally: one shared refresh, one retry, then sign-in with a return URL; report uncaught errors via `app.config.errorHandler` and `unhandledrejection`.',
  ],
}
