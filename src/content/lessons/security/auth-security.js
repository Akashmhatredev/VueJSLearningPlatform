// Lesson: Authentication, authorization & token storage (Level 16)

const fakeApi = `// ⚠️ A FAKE server that runs inside the browser so you can experiment.
// In a real app this code lives on the backend, where users cannot edit it
// (and passwords are stored as slow hashes, never as plain text).
const users = [
  { id: 1, name: 'Ada', password: 'ada123', role: 'admin' },
  { id: 2, name: 'Bea', password: 'bea123', role: 'customer' },
]
let invoices = [
  { id: 101, ownerId: 1, total: 120 },
  { id: 102, ownerId: 2, total: 80 },
  { id: 103, ownerId: 2, total: 45 },
]
const sessions = new Map() // token -> user id: the server's memory of who is logged in

const delay = () => new Promise((resolve) => setTimeout(resolve, 100))

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  throw error
}

// Authentication: WHO is making this request?
function authenticate(token) {
  const user = users.find((u) => u.id === sessions.get(token))
  if (!user) fail(401, 'Not logged in')
  return user
}

export async function login(name, password) {
  await delay()
  const user = users.find((u) => u.name === name && u.password === password)
  if (!user) fail(401, 'Wrong name or password')
  const token = 'session-' + Math.random().toString(36).slice(2)
  sessions.set(token, user.id)
  return { token, user: { id: user.id, name: user.name, role: user.role } }
}

export async function logout(token) {
  await delay()
  sessions.delete(token)
}

export async function getMyInvoices(token) {
  await delay()
  const user = authenticate(token)
  // ⚠️ BUG (experiment 2): this returns EVERY customer's invoices.
  return invoices
}

export async function getAllInvoices(token) {
  await delay()
  const user = authenticate(token)
  if (user.role !== 'admin') fail(403, 'Admins only') // Authorization: MAY they do this?
  return invoices
}

export async function deleteInvoice(token, id) {
  await delay()
  const user = authenticate(token)
  if (user.role !== 'admin') fail(403, 'Admins only')
  invoices = invoices.filter((i) => i.id !== id)
}`

const authJs = `import { reactive } from 'vue'
import * as api from './api.js'

// The browser's copy of "who am I". Great for the UI — never proof of anything:
// anyone can change it in devtools.
export const auth = reactive({ user: null, token: null })

export async function login(name, password) {
  const result = await api.login(name, password)
  auth.user = result.user
  auth.token = result.token // kept in memory only: gone after a page reload
}

export async function logout() {
  // ⚠️ Experiment 4: the server never hears about this logout.
  auth.user = null
  auth.token = null
}`

const routerJs = `import { createRouter, createMemoryHistory } from 'vue-router'
import { auth } from './auth.js'
import LoginView from './LoginView.vue'
import InvoicesView from './InvoicesView.vue'
import AdminView from './AdminView.vue'

export const router = createRouter({
  history: createMemoryHistory(), // real apps: createWebHistory()
  routes: [
    { path: '/', redirect: '/invoices' },
    { path: '/login', component: LoginView },
    { path: '/invoices', component: InvoicesView },
    { path: '/admin', component: AdminView, meta: { requiresAuth: true, role: 'admin' } },
  ],
})

// A guard is a polite receptionist, not a lock: it improves the experience,
// while the server decides what data anyone actually gets.
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return { path: '/invoices' }
  }
})`

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'

createApp(App).use(router).mount('#app')`

const appVue = `<script setup>
import { useRouter } from 'vue-router'
import { auth, logout } from './auth.js'

const router = useRouter()

async function onLogout() {
  await logout()
  router.push('/login')
}

// Simulates a curious user editing client-side state in devtools.
function tamper() {
  if (auth.user) auth.user.role = 'admin'
}
</script>

<template>
  <nav>
    <RouterLink to="/invoices">My invoices</RouterLink> ·
    <RouterLink v-if="auth.user?.role === 'admin'" to="/admin" class="admin-link">Admin</RouterLink>
    <span v-if="auth.user" class="who">{{ auth.user.name }} ({{ auth.user.role }})</span>
    <button v-if="auth.user" class="logout" @click="onLogout">Log out</button>
    <RouterLink v-else to="/login">Log in</RouterLink>
  </nav>

  <RouterView />

  <p v-if="auth.user && auth.user.role !== 'admin'" class="devtools">
    <button class="tamper" @click="tamper">🛠 Tamper: make me admin in the browser</button>
  </p>
</template>`

const loginView = `<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from './auth.js'

const route = useRoute()
const router = useRouter()
const name = ref('Bea')
const password = ref('bea123')
const error = ref('')

// Only follow redirects that stay inside this app: "/x", never "//evil.example".
function safeRedirect(target) {
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
    ? target
    : '/invoices'
}

async function submit() {
  error.value = ''
  try {
    await login(name.value, password.value)
    router.push(safeRedirect(route.query.redirect))
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <form class="login" @submit.prevent="submit">
    <h2>Log in</h2>
    <p class="hint">Try Bea / bea123 (customer) or Ada / ada123 (admin).</p>
    <input v-model="name" class="name" placeholder="Name" />
    <input v-model="password" class="password" type="password" placeholder="Password" />
    <button>Log in</button>
    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>`

const invoicesView = `<script setup>
import { ref, computed, onMounted } from 'vue'
import { auth } from './auth.js'
import { getMyInvoices } from './api.js'

const invoices = ref([])
const error = ref('')

onMounted(async () => {
  try {
    const data = await getMyInvoices(auth.token)
    console.log('Raw API response:', data)
    invoices.value = data
  } catch (e) {
    error.value = e.status + ': ' + e.message
  }
})

// Hides other people's invoices on screen… but they were already downloaded.
const mine = computed(() => invoices.value.filter((i) => i.ownerId === auth.user?.id))
</script>

<template>
  <section>
    <h2>My invoices</h2>
    <p v-if="error" class="error">{{ error }}</p>
    <ul v-else class="invoices">
      <li v-for="inv in mine" :key="inv.id" class="invoice">#{{ inv.id }} — €{{ inv.total }}</li>
    </ul>
  </section>
</template>`

const adminView = `<script setup>
import { ref, onMounted } from 'vue'
import { auth } from './auth.js'
import { getAllInvoices, deleteInvoice } from './api.js'

const invoices = ref([])
const error = ref('')

async function load() {
  try {
    invoices.value = await getAllInvoices(auth.token)
  } catch (e) {
    error.value = e.status + ': ' + e.message
  }
}

async function remove(id) {
  try {
    await deleteInvoice(auth.token, id)
    await load()
  } catch (e) {
    error.value = e.status + ': ' + e.message
  }
}

onMounted(load)
</script>

<template>
  <section>
    <h2>Admin: all invoices</h2>
    <p v-if="error" class="error">{{ error }}</p>
    <ul class="all-invoices">
      <li v-for="inv in invoices" :key="inv.id">
        #{{ inv.id }} (owner {{ inv.ownerId }}) — €{{ inv.total }}
        <button class="delete" @click="remove(inv.id)">Delete</button>
      </li>
    </ul>
  </section>
</template>`

// ---------- exercise 1: role-aware guard
const guardRouterStarter = `import { h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { auth } from './auth.js'

const page = (title) => ({ render: () => h('h2', { class: 'page' }, title) })

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: page('Home') },
    { path: '/login', component: page('Log in') },
    { path: '/forbidden', component: page('Forbidden') },
    { path: '/account', component: page('Account'), meta: { requiresAuth: true } },
    { path: '/admin', component: page('Admin'), meta: { requiresAuth: true, roles: ['admin'] } },
  ],
})

// TODO: add router.beforeEach(...) here`

const guardRouterSolution = `import { h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { auth } from './auth.js'

const page = (title) => ({ render: () => h('h2', { class: 'page' }, title) })

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: page('Home') },
    { path: '/login', component: page('Log in') },
    { path: '/forbidden', component: page('Forbidden') },
    { path: '/account', component: page('Account'), meta: { requiresAuth: true } },
    { path: '/admin', component: page('Admin'), meta: { requiresAuth: true, roles: ['admin'] } },
  ],
})

// UX only: the API must still authorize every request on the server.
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return { path: '/forbidden' }
  }
})`

const guardAuth = `import { reactive } from 'vue'

export const auth = reactive({ user: null })

export function setUser(user) {
  auth.user = user
}`

const guardMain = mainJs

const guardApp = `<script setup>
import { auth } from './auth.js'
</script>

<template>
  <nav>
    <RouterLink to="/">Home</RouterLink> ·
    <RouterLink to="/account">Account</RouterLink> ·
    <RouterLink to="/admin">Admin</RouterLink>
    <span class="who">{{ auth.user ? auth.user.name : 'guest' }}</span>
  </nav>
  <RouterView />
</template>`

// ---------- exercise 2: global 401 handling
const expiryApi = `// A FAKE server for this exercise.
const sessions = new Map()
let nextFailure = null

const delay = () => new Promise((resolve) => setTimeout(resolve, 50))

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  throw error
}

export async function login(name) {
  await delay()
  const token = 'session-' + Math.random().toString(36).slice(2)
  sessions.set(token, { name })
  return { token, user: { name } }
}

export async function getProfile(token) {
  await delay()
  if (nextFailure) {
    const status = nextFailure
    nextFailure = null
    fail(status, 'Server error')
  }
  const session = sessions.get(token)
  if (!session) fail(401, 'Session expired')
  return { name: session.name, plan: 'Pro' }
}

// Helpers to simulate the server: every session expires, or the next call fails.
export function expireAllSessions() {
  sessions.clear()
}

export function failNextWith(status) {
  nextFailure = status
}`

const expiryAuth = `import { reactive } from 'vue'
import * as api from './api.js'

export const auth = reactive({ user: null, token: null })

export async function login(name) {
  const result = await api.login(name)
  auth.user = result.user
  auth.token = result.token
}

export function clearSession() {
  auth.user = null
  auth.token = null
}`

const expiryRouter = `import { h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { auth } from './auth.js'
import AccountView from './AccountView.vue'

const LoginPage = { render: () => h('h2', { class: 'page' }, 'Please log in again') }

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', redirect: '/account' },
    { path: '/login', component: LoginPage },
    { path: '/account', component: AccountView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})`

const expiryMain = `import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'
import { setupHttp } from './http.js'

setupHttp(router) // like configuring axios interceptors once at startup
createApp(App).use(router).mount('#app')`

const expiryApp = `<template>
  <RouterView />
</template>`

const expiryAccount = `<script setup>
import { ref, onMounted } from 'vue'
import { request } from './http.js'
import { getProfile } from './api.js'

const profile = ref(null)
const error = ref('')

async function load() {
  error.value = ''
  try {
    profile.value = await request(getProfile)
  } catch (e) {
    error.value = e.message
  }
}

onMounted(load)
</script>

<template>
  <section>
    <h2>Account</h2>
    <p v-if="profile" class="profile">{{ profile.name }} — {{ profile.plan }} plan</p>
    <p v-if="error" class="error">{{ error }}</p>
    <button class="reload" @click="load">Reload profile</button>
  </section>
</template>`

const httpStarter = `import { auth, clearSession } from './auth.js'

let router = null

// Called once from main.js.
export function setupHttp(appRouter) {
  router = appRouter
}

// Every API call goes through here, e.g. request(api.getProfile)
export async function request(call) {
  return call(auth.token)
}`

const httpSolution = `import { auth, clearSession } from './auth.js'

let router = null

// Called once from main.js.
export function setupHttp(appRouter) {
  router = appRouter
}

// Every API call goes through here, e.g. request(api.getProfile)
export async function request(call) {
  try {
    return await call(auth.token)
  } catch (error) {
    if (error.status === 401) {
      // The server no longer recognises us: drop the stale session…
      clearSession()
      // …and send the user to log in, remembering where they were.
      const here = router ? router.currentRoute.value.fullPath : '/'
      if (router) router.push({ path: '/login', query: { redirect: here } })
    }
    throw error // callers still learn that the request failed
  }
}`

export default {
  id: 'auth-security',
  title: 'Authentication, authorization & token storage',
  summary: 'Understand who-are-you versus what-may-you-do, where login state can safely live in the browser, and why route guards never replace authorization on the server.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['navigation-guards', 'fetching-data', 'xss-safe-rendering'],
  related: ['project-auth-ui', 'api-production', 'secrets-csp-dependencies', 'router-in-practice', 'error-handling'],
  tags: ['security', 'authentication', 'authorization', 'login', 'jwt', 'cookies', 'httpOnly', 'localStorage', 'csrf', 'samesite', 'route guards', '401', '403'],
  apis: [
    { name: 'router.beforeEach()', summary: 'Global navigation guard — redirect users who should not see a page (a UX feature, not security).' },
    { name: 'route.meta', summary: 'Arbitrary per-route data such as `requiresAuth` or allowed roles.' },
    { name: 'Set-Cookie: HttpOnly; Secure; SameSite', summary: 'Server-set cookie flags: unreadable by JavaScript, HTTPS-only, and limited on cross-site requests.' },
    { name: "fetch(url, { credentials: 'include' })", summary: 'Sends cookies with cross-origin requests (the server must allow it via CORS).' },
  ],
  docs: [
    { label: 'Vue Guide — Security: backend coordination', url: 'https://vuejs.org/guide/best-practices/security.html#backend-coordination' },
    { label: 'Vue Router — Navigation guards', url: 'https://router.vuejs.org/guide/advanced/navigation-guards.html' },
    { label: 'Vue Router — Route meta fields', url: 'https://router.vuejs.org/guide/advanced/meta.html' },
    { label: 'OWASP — Authorization Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html' },
    { label: 'OWASP — CSRF Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html' },
    { label: 'MDN — Using HTTP cookies (security)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies' },
  ],

  intro: `
Two questions sit behind every "log in" button:

- **Authentication** (*authn*): **who are you?** You prove it with a password, a passkey, a login link, or a provider such as Google.
- **Authorization** (*authz*): **what are you allowed to do?** Bea may see *her* invoices; only admins may delete invoices.

In a Vue app you build the *experience* of both — login forms, "please log in" redirects, hiding the admin menu. But the *decisions* must be made by the server on every request, because everything in the browser — your code, your state, your route guards — can be read and changed by the person using it.
`,

  why: `
A single-page app runs on the user's computer. That means the user can:

- open devtools and set \`auth.user.role = 'admin'\`;
- read every line of your bundle, including the admin pages and the API calls they make;
- call your API directly with \`curl\`, skipping your app entirely.

So "the admin button is hidden" or "the route guard redirects non-admins" protects nothing. If \`DELETE /api/invoices/101\` works for a customer, your app is broken — no matter how good the UI looks.

There's a second, subtler question: **where does the proof of login live** between requests? A token in \`localStorage\` can be stolen by any script that runs in your page (see [XSS](lesson:xss-safe-rendering)). A cookie the browser sends automatically opens the door to **CSRF**. Choosing well is a real trade-off — and this lesson gives you the vocabulary to make it.
`,

  eli15: `
Think of a music festival.

At the entrance, staff check your ticket and ID — that's **authentication**: proving who you are. They give you a **wristband**.

Inside, the backstage door has its own guard who looks at your wristband: green means fans, gold means crew. That's **authorization**: deciding what *you* may do.

Now the important part. The festival app on your phone shows a "Backstage" button only to crew. Is that what keeps fans out? No! A fan could edit the app, or just walk up to the door. **The guard at the backstage door** is what keeps fans out.

In web apps, your Vue code is the festival app on the phone (helpful, but anyone can tinker with it), and the **server** is the guard at every door. The wristband is your session cookie or token — and you want it to be hard to steal or copy.
`,

  analogy: {
    title: 'The festival wristband',
    body: `
Getting in is a one-time check; the wristband proves it afterwards. Each door checks the wristband again — every single time — because people try to sneak in.

A wristband locked onto your wrist that you can't take off and hand to someone else is like an **httpOnly cookie**: scripts can't read or copy it. A paper ticket in your pocket is like a **token in localStorage**: convenient, but whoever picks your pocket (an injected script) walks away with it.
`,
    mapping: [
      ['ticket + ID check at the entrance', 'authentication — the login request'],
      ['the wristband', 'a session cookie or an access token'],
      ['wristband colour (fan / crew)', 'the user\'s role or permissions, stored on the server'],
      ['the guard at each door', 'server-side authorization on every API request'],
      ['the "Backstage" button in the phone app', 'hidden menu items and route guards — UX, not security'],
      ['a wristband that can\'t be removed', 'an httpOnly cookie — JavaScript can\'t read it'],
      ['a paper ticket in your pocket', 'a token in localStorage — any script in the page can take it'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'Where the proof of login lives',
    caption: 'Neither option is free. A token in storage is exposed to XSS; a cookie is sent automatically and needs CSRF protection.',
    alt: 'Side-by-side code. Left: after login the client stores a token in localStorage and adds it to an Authorization header on each fetch. Right: the server sets an HttpOnly, Secure, SameSite cookie and the client simply calls fetch with credentials included. Bullet points compare XSS exposure, CSRF exposure and convenience.',
    props: {
      left: {
        label: 'Token in localStorage + Authorization header',
        lang: 'js',
        code: `// after login
localStorage.setItem('token', data.token)

// every request
fetch('/api/invoices', {
  headers: {
    Authorization: 'Bearer ' + localStorage.getItem('token'),
  },
})`,
      },
      right: {
        label: 'httpOnly session cookie set by the server',
        lang: 'js',
        code: `// the server's login response includes:
// Set-Cookie: session=…; HttpOnly; Secure; SameSite=Lax; Path=/

// every request — the browser attaches the cookie itself
fetch('/api/invoices', { credentials: 'include' })

// document.cookie does NOT show the session cookie`,
      },
      points: [
        'localStorage is readable by every script on the page: one XSS bug and the token can be copied and reused elsewhere.',
        'An httpOnly cookie can\'t be read by JavaScript, so injected scripts can\'t steal it — though they can still send requests while the page is open.',
        'Cookies are attached automatically, which is what makes CSRF possible: use SameSite, CSRF tokens or Origin checks on the server.',
        'Authorization headers are never attached automatically, so they are not CSRF-prone — but the token must live somewhere JavaScript can reach.',
        'Either way the server validates the session/token and authorizes every request.',
      ],
    },
  },

  animation: {
    type: 'concept-diagram',
    title: 'Login, requests — and a tampered role',
    caption: 'Step through a normal login, a normal request, and what happens when a user edits their role in the browser.',
    alt: 'A diagram with the Vue app on the left, the route guard below it, the API server in the middle and the database on the right. Steps show login creating a session, requests carrying the cookie, the server checking identity and permission, and a tampered client role passing the route guard but being rejected by the server with 403.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'app', label: 'Vue app', note: 'auth.user (a copy)', tone: 'cobalt', x: 110, y: 90 },
        { id: 'guard', label: 'Route guard', note: 'UX: redirects', tone: 'paper', x: 110, y: 240 },
        { id: 'api', label: 'API server', note: 'authn + authz', tone: 'acid', x: 400, y: 160 },
        { id: 'db', label: 'Sessions & data', note: 'source of truth', tone: 'kraft', x: 660, y: 160 },
      ],
      edges: [
        { from: 'app', to: 'api', label: 'request + cookie/token' },
        { from: 'api', to: 'db', label: 'who? may they?' },
        { from: 'app', to: 'guard', label: 'navigation' },
      ],
      steps: [
        { focus: ['app'], text: 'Bea submits the login form. The Vue app sends her name and password to the server over **HTTPS**.' },
        { focus: ['api', 'db'], edges: ['app->api', 'api->db'], text: '**Authentication.** The server checks the password against a stored hash, creates a session, and replies with a session cookie (`HttpOnly; Secure; SameSite`) or a token.' },
        { focus: ['app'], text: 'The app stores a **copy** of "who am I" (`{ name: "Bea", role: "customer" }`) to drive the UI: show her name, hide the Admin link.' },
        { focus: ['app', 'api'], edges: ['app->api'], text: 'Later Bea opens "My invoices". The request carries the cookie (or token). The server **authenticates** it (whose session is this?) and **authorizes** it (only return invoices owned by Bea).' },
        { focus: ['guard'], edges: ['app->guard'], text: 'Bea opens devtools and sets her role to `admin`. The route guard reads the same client state — so it happily lets her into `/admin`. **Guards are UX.**' },
        { focus: ['api', 'db'], edges: ['app->api', 'api->db'], text: 'The admin page calls `GET /api/admin/invoices`. The server looks up Bea\'s **real** role in its own data: customer. It answers **403 Forbidden**. Nothing leaks — because the server decided.' },
      ],
    },
  },

  syntax: [
    `
#### 1. Route meta + a global guard (UX)

Mark routes with \`meta\` and redirect early, so users never land on a page that will only show errors.
`,
    {
      code: `const routes = [
  { path: '/login', component: LoginView },
  { path: '/account', component: AccountView, meta: { requiresAuth: true } },
  { path: '/admin', component: AdminView, meta: { requiresAuth: true, roles: ['admin'] } },
]

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return { path: '/forbidden' }
  }
})`,
      lang: 'js',
      title: 'router.js',
    },
    {
      callout: 'warn',
      title: 'Frontend checks never replace backend authorization',
      text: 'Guards, `v-if="isAdmin"` and disabled buttons are conveniences. The server must authenticate **and** authorize every request — including "does this invoice belong to this user?" — as if your Vue app didn\'t exist.',
    },
    `
#### 2. What the server must check on every request (pseudo-code)
`,
    {
      code: `// Express-style pseudo-code — the part your Vue app can't do for you
app.get('/api/invoices/:id', async (req, res) => {
  const user = await sessionUser(req)                 // authentication
  if (!user) return res.status(401).end()             // 401: who are you?

  const invoice = await db.invoices.find(req.params.id)
  if (!invoice) return res.status(404).end()
  if (invoice.ownerId !== user.id && user.role !== 'admin') {
    return res.status(403).end()                      // 403: not yours
  }
  res.json(invoice)
})`,
      lang: 'js',
      title: 'server-side authorization (static example)',
      static: true,
    },
    `
- **401 Unauthorized** — "I don't know who you are" (missing, invalid or expired session). The usual client reaction: clear local state and send the user to log in.
- **403 Forbidden** — "I know who you are, and you may not do this." Show a friendly message; logging in again won't help.

#### 3. Storing the proof of login

- **httpOnly cookie** (set by the server with \`Set-Cookie: …; HttpOnly; Secure; SameSite=Lax\`): JavaScript can't read it, so XSS can't steal it. Because the browser attaches it automatically, protect state-changing requests against **CSRF** (SameSite, CSRF tokens, Origin checks). Call the API with \`credentials: 'include'\` when it's on another origin.
- **In memory** (a ref or store): disappears on reload; scripts running in the page can still use it while it exists.
- **localStorage / sessionStorage**: survives reloads (localStorage even across tabs and restarts), but *any* script on the page can read it — an XSS bug becomes token theft.
`,
    {
      code: `// A JWT is three base64url parts: header.payload.signature
const payload = JSON.parse(atob(token.split('.')[1]))
payload.role // readable by anyone — the signature stops forging, not reading`,
      lang: 'js',
      title: 'JWTs are signed, not secret',
    },
    {
      callout: 'note',
      title: 'Third-party login',
      text: 'For "Log in with …" use your provider\'s official SDK or a well-reviewed library implementing OAuth 2.0 / OpenID Connect with the authorization code flow and PKCE — the current recommendation for browser apps. Don\'t hand-roll it.',
    },
  ],

  walkthrough: {
    title: 'router.js',
    lang: 'js',
    code: routerJs,
    intro: 'The router of the playground app. Notice what the guard can and cannot do.',
    steps: [
      { lines: [2], text: 'The guard reads the browser\'s copy of the user. That copy is convenient — and editable by the user, which is the whole point of this lesson.' },
      { lines: [8], text: '`createMemoryHistory()` because the sandbox has no real URL bar. A deployed app uses `createWebHistory()`.' },
      { lines: [12], text: '`/invoices` has **no** `meta.requiresAuth` yet. Logged-out users can open it — and the server answers 401. Experiment 1 adds the guard; notice the data was safe either way.' },
      { lines: [13], text: '`/admin` requires a login **and** the `admin` role. Route meta is just data; the guard below gives it meaning.' },
      { lines: [20, 22], text: 'Not logged in? Redirect to `/login`, remembering the destination in `?redirect=`. The login page only follows redirects that start with a single `/` (an *open redirect* to another site would be a phishing tool).' },
      { lines: [23, 25], text: 'Wrong role? Back to `/invoices`. Press **Tamper** in the app to see this check pass with a fake role — and then watch the server refuse.' },
    ],
  },

  playground: {
    title: 'Invoices with a fake (but honest) server',
    objective: 'Log in as a customer, try to reach admin data, and fix the places where the app trusted the browser instead of the server.',
    files: {
      'main.js': mainJs,
      'App.vue': appVue,
      'router.js': routerJs,
      'auth.js': authJs,
      'api.js': fakeApi,
      'LoginView.vue': loginView,
      'InvoicesView.vue': invoicesView,
      'AdminView.vue': adminView,
    },
    expected: 'The app opens on **My invoices** with a 401 error (you are logged out). Click **Log in** and sign in as Bea: you see invoices #102 and #103 — but the **Console** shows the raw API response, which contains invoice #101 too. Press **Tamper**, open **Admin**: the page renders, and the server answers `403: Admins only`.',
    experiments: [
      {
        id: 'guard-invoices',
        task: 'Logged-out visitors currently land on **My invoices** and see a 401 error. Add `meta: { requiresAuth: true }` to the `/invoices` route so the guard sends them to `/login?redirect=/invoices` first.',
        hint: 'In `router.js`, change the `/invoices` route to `{ path: \'/invoices\', component: InvoicesView, meta: { requiresAuth: true } }`.',
        tests: [
          {
            name: 'logged-out users are redirected to /login with a redirect back',
            code: `const { router } = requireModule('router.js')
await router.push('/invoices')
await flush()
expect(router.currentRoute.value.path).toBe('/login')
expect(router.currentRoute.value.query.redirect).toBe('/invoices')`,
          },
        ],
        explain: 'Better UX — but look back: before this change the invoices were *already* protected, because the server answered 401. The guard only decides which screen you see first.',
      },
      {
        id: 'server-filter',
        task: 'Log in as Bea and open the **Console**: the raw response contains invoice #101, which belongs to Ada. The UI hides it with a `computed`, but the data has leaked. Fix `getMyInvoices` in `api.js` (the "server") so it only returns invoices owned by the authenticated user.',
        hint: '`authenticate(token)` already gives you `user`. Return `invoices.filter((i) => i.ownerId === user.id)`.',
        tests: [
          {
            name: 'the server only returns Bea\'s own invoices',
            code: `const api = requireModule('api.js')
const { token } = await api.login('Bea', 'bea123')
const list = await api.getMyInvoices(token)
expect(list.length).toBe(2)
expect(list.every((i) => i.ownerId === 2)).toBe(true)`,
          },
        ],
        explain: 'Filtering in the client is presentation; filtering on the server is authorization. Anything the server sends, the user can read — in the Network tab, the console, or with `curl`. This bug class (one user can read another user\'s objects) is often called **IDOR** or broken object-level authorization.',
      },
      {
        id: 'tamper',
        task: 'Log in as Bea and press **🛠 Tamper**. The Admin link appears and the route guard lets you in. Now press **Delete** on any invoice. What does the server say, and why?',
        hint: 'Watch the red error line on the admin page.',
        explain: 'The guard and the `v-if` both read client state, which you just edited. The server ignored your claim and looked up your real role from its own session data: `403: Admins only`. That is the only check that counts.',
      },
      {
        id: 'server-logout',
        task: 'Log out currently only clears the browser\'s copy. The old token **still works** on the server — anyone who copied it can keep using it. Make `logout()` in `auth.js` call `api.logout(auth.token)` before clearing local state.',
        hint: '`await api.logout(auth.token)` first, then set `auth.user` and `auth.token` to `null`.',
        tests: [
          {
            name: 'after logout the old token is rejected by the server',
            code: `const api = requireModule('api.js')
const { auth, login, logout } = requireModule('auth.js')
await login('Bea', 'bea123')
const oldToken = auth.token
await logout()
let status = null
try {
  await api.getMyInvoices(oldToken)
} catch (e) {
  status = e.status
}
expect(status).toBe(401)
expect(auth.user).toBeNull()`,
          },
        ],
        explain: 'Logging out is a server-side event: the session (or refresh token) must be revoked. Clearing client state alone is like taking off a wristband that still opens every door.',
      },
    ],
  },

  internals: {
    beginner: `
The server keeps the real list of who is logged in and what each person may do. Your Vue app keeps a *copy* so it can show the right buttons. When the copy and the truth disagree — because a session expired, or because someone edited the copy — the server wins, and your app should react gracefully (redirect to login on 401, show "not allowed" on 403).
`,
    technical: [
      `
**Sessions vs tokens.** With a *session*, the server stores the login state and gives the browser an opaque id in a cookie. With a *self-contained token* such as a JWT, the claims (user id, roles, expiry) travel inside the token, signed by the server so they can't be forged. JWT payloads are only base64url-encoded — **anyone can read them** — and revoking one before it expires needs extra machinery (short lifetimes, deny-lists, or refresh-token rotation).

**Why cookies invite CSRF.** Browsers attach cookies to requests for their site, even when another site triggers the request (a hidden form, an image). The \`SameSite\` attribute limits that: \`Strict\` never sends the cookie on cross-site requests, \`Lax\` sends it only on top-level navigations with safe methods like GET, \`None\` always sends it (and requires \`Secure\`). Some browsers default to \`Lax\` when the attribute is missing; don't rely on it — set it explicitly, and add CSRF tokens or Origin checks for state-changing endpoints.

**Same-site is not same-origin.** \`app.example.com\` and \`api.example.com\` are *cross-origin* (CORS applies) but *same-site* (SameSite cookies flow between them). For cross-origin fetches with cookies, the client uses \`credentials: 'include'\` and the server must reply with \`Access-Control-Allow-Credentials: true\` and an explicit allowed origin (not \`*\`). CORS controls which sites may **read** responses — it is not authentication.
`,
      {
        code: `// Typical SPA plumbing (simplified)
export async function request(call) {
  try {
    return await call()
  } catch (error) {
    if (error.status === 401) {
      clearSession()                                         // drop the stale copy
      router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    }
    throw error                                              // 403 / 500: let the caller decide
  }
}`,
        lang: 'js',
        title: 'one place to react to 401s',
      },
      `
**Refreshing state after reload.** If the session lives in an httpOnly cookie, the app can't "look" at it. Instead, on startup it calls an endpoint like \`GET /api/me\`: 200 → fill \`auth.user\`; 401 → logged out. Await that call (or \`router.isReady()\` plus the request) before the first guarded navigation, so the guard doesn't redirect a logged-in user to the login page.
`,
    ],
    production: `
- **Authorize on the server, per request and per object.** Check identity, role/permission *and* ownership ("is invoice 102 Bea's?"). Deny by default.
- **Prefer httpOnly, Secure, SameSite cookies** for browser sessions when your architecture allows (same-site API or a backend-for-frontend). If you must use bearer tokens in JavaScript, keep access tokens short-lived and in memory, and treat XSS prevention as critical.
- **Protect cookie-authenticated, state-changing endpoints against CSRF**: SameSite, CSRF tokens, Origin/Referer checks. GET requests must never change data.
- **HTTPS everywhere** (and HSTS), so credentials and cookies are never sent in clear text.
- **Revoke on logout and on password change**; rotate refresh tokens; expire sessions.
- **Never trust the client for business rules** either: prices, discounts, quotas and "is this field valid" are re-checked on the server.
- **Rate-limit** login and password-reset endpoints, return generic errors ("wrong name or password"), and log security events — without logging passwords or tokens.
- **Validate redirect targets** after login (internal paths only) to avoid open redirects.
`,
  },

  mistakes: [
    {
      title: 'Treating route guards as security',
      wrong: { code: `// "Admins only — the guard protects it"\nrouter.beforeEach((to) => {\n  if (to.path.startsWith('/admin') && auth.user.role !== 'admin') return '/'\n})\n// …and the API endpoint has no role check`, lang: 'js' },
      right: { code: `// Guard for UX…\nrouter.beforeEach((to) => { /* redirect non-admins */ })\n\n// …and the server for security (pseudo-code):\nif (user.role !== 'admin') return res.status(403).end()`, lang: 'js' },
      explanation: 'The guard runs in the user\'s browser, reading state the user can edit, inside a bundle the user can read. Anyone can call the API directly. Authorization belongs on the server.',
    },
    {
      title: 'Downloading everything and filtering in the client',
      wrong: { code: `const all = await api.get('/invoices')            // everyone's invoices\nconst mine = all.filter((i) => i.ownerId === me.id)`, lang: 'js' },
      right: { code: `const mine = await api.get('/me/invoices')        // the server filters by session`, lang: 'js' },
      explanation: 'Hidden is not protected. Whatever the server sends is visible in the Network tab. Filter (and authorize) on the server.',
    },
    {
      title: 'Trusting the role inside a JWT you decoded in the browser',
      wrong: { code: `const { role } = JSON.parse(atob(token.split('.')[1]))\nif (role === 'admin') await api.deleteUser(id) // assumes the server trusts the client`, lang: 'js' },
      right: { code: `// Decode only for display (name, expiry). The server verifies the\n// token signature and checks the role itself on every request.`, lang: 'js' },
      explanation: 'The client can decode a JWT, but it can\'t verify it without the server\'s key, and a user could swap in any token they like. Use decoded claims for UI only.',
    },
    {
      title: 'Logout that only clears local state',
      wrong: { code: `function logout() {\n  localStorage.removeItem('token')\n}`, lang: 'js' },
      right: { code: `async function logout() {\n  await api.post('/logout')   // server revokes the session / refresh token\n  clearLocalState()\n}`, lang: 'js' },
      explanation: 'If the server still accepts the old session or token, anyone who copied it keeps access. Revoke it on the server.',
    },
    {
      title: 'Following any ?redirect= after login',
      wrong: { code: `window.location.href = route.query.redirect // "https://evil.example/fake-login"`, lang: 'js' },
      right: { code: `const target = safeRedirect(route.query.redirect) // internal paths only\nrouter.push(target)`, lang: 'js' },
      explanation: 'An open redirect lets attackers send links that start on your trusted domain and end on their phishing page. Only allow internal paths.',
    },
  ],

  debugging: [
    {
      symptom: 'After a page reload, logged-in users are bounced to the login page.',
      cause: 'Auth state lives in memory and the guard runs before the app has asked the server who is logged in.',
      fix: 'On startup call `GET /me` (cookie session) and wait for it before the first guarded navigation — e.g. await it in the guard the first time, or before `app.mount()`.',
    },
    {
      symptom: 'Login "works" (200) but the next request is 401 — the cookie never arrives.',
      cause: 'Cross-origin API without `credentials: \'include\'`, missing `Access-Control-Allow-Credentials`, a `Secure` cookie on plain HTTP, or `SameSite` blocking a genuinely cross-site setup.',
      fix: 'Check the Set-Cookie response header and the cookie jar in devtools. Use `credentials: \'include\'`, configure CORS with an explicit origin, serve over HTTPS, and choose SameSite deliberately.',
    },
    {
      symptom: 'An expired session leaves the app half-working: some panels show errors, the header still shows the user\'s name.',
      cause: 'Each component handles 401 on its own (or not at all).',
      fix: 'Handle 401 in one place — an HTTP wrapper or interceptor — that clears the session and redirects to login with `?redirect=`.',
    },
    {
      symptom: 'A customer can see another customer\'s order by changing the id in the URL.',
      cause: 'The API checks authentication but not ownership (broken object-level authorization / IDOR).',
      fix: 'On the server, load the object and check it belongs to the session user (or that the user\'s role permits access) before returning it.',
    },
    {
      symptom: 'Your security scanner flags "token in localStorage".',
      cause: 'Bearer tokens in Web Storage are readable by any script — an XSS bug becomes account takeover.',
      fix: 'Move to an httpOnly cookie session (or a backend-for-frontend), or keep short-lived access tokens in memory and harden against XSS (CSP, no unsafe `v-html`).',
    },
  ],

  bestPractices: [
    'Make every authorization decision on the server; use client checks only to shape the UI.',
    'Check ownership, not just login: "may *this* user read *this* record?".',
    'Prefer server-set `HttpOnly; Secure; SameSite` cookies for browser sessions; pair them with CSRF protection.',
    'If tokens must live in JavaScript, keep them short-lived and in memory, and invest heavily in XSS prevention.',
    'Handle 401 globally (clear session, redirect to login with a safe `redirect`), and show a friendly page for 403.',
    'Revoke sessions on logout and password change; never just delete the client copy.',
    'Never put secrets or authorization decisions in a JWT payload you read on the client — it is readable by anyone.',
    'Use established OAuth/OIDC libraries (authorization code + PKCE) for third-party login.',
  ],

  useCases: [
    'Customer portals where users must only see their own orders, invoices or messages.',
    'Admin dashboards with role-based menus — backed by role checks on every endpoint.',
    'SaaS apps with organisations/teams, where authorization also depends on membership.',
    'Session-expiry UX: redirect to login and return the user to where they were.',
    'Apps calling an API on another subdomain with cookie-based sessions (CORS + credentials + SameSite).',
  ],

  whenToUse: {
    use: [
      'Route guards + `meta` to avoid showing pages the user can\'t use, and to remember where to return after login.',
      '`v-if` on permissions to hide actions a user can\'t perform (cleaner UI).',
      'httpOnly cookie sessions when your API is same-site or behind a backend-for-frontend.',
    ],
    avoid: [
      'Relying on guards, hidden buttons or client-side role checks as the security boundary.',
      'Storing long-lived tokens in localStorage in apps that render user-generated content.',
      'Shipping "all the data" to the client and filtering it there.',
      'Hand-rolled OAuth flows or crypto in the browser.',
    ],
  },

  comparison: {
    title: 'Where to keep the proof of login',
    headers: ['', 'httpOnly cookie', 'In memory (ref / store)', 'sessionStorage', 'localStorage'],
    rows: [
      ['Readable by injected scripts (XSS)?', '**no**', 'reachable while the page runs', 'yes', 'yes'],
      ['Sent automatically (CSRF risk)?', 'yes — needs SameSite / CSRF tokens', 'no', 'no', 'no'],
      ['Survives a reload?', 'yes', 'no', 'yes (same tab)', 'yes (all tabs, restarts)'],
      ['Who sets it?', 'the server (`Set-Cookie`)', 'your JavaScript', 'your JavaScript', 'your JavaScript'],
      ['Typical use', 'browser sessions, refresh tokens', 'short-lived access tokens', 'rarely a good fit for tokens', 'non-sensitive preferences'],
    ],
    note: 'Whatever you choose, the server validates the session/token and authorizes each request. Next: [secrets, CSP & dependency security](lesson:secrets-csp-dependencies).',
  },

  quiz: [
    {
      id: 'auth-security-q1',
      type: 'mcq',
      prompt: 'Bea is logged in as a customer. She opens `/admin` and the API answers **403**. Which step refused her?',
      options: [
        { text: 'Authentication — the server doesn\'t know who she is', why: 'That would be 401. A 403 means the server knows exactly who she is.' },
        { text: 'Authorization — she is known but not allowed' },
        { text: 'The route guard', why: 'A route guard can redirect, but it can\'t produce an HTTP status code — the 403 came from the server.' },
        { text: 'CORS', why: 'CORS failures appear as network/CORS errors in the browser, not as a 403 from your API logic.' },
      ],
      answer: 1,
      explanation: '401 = "who are you?" (authentication failed or missing). 403 = "I know you, and no" (authorization failed).',
    },
    {
      id: 'auth-security-q2',
      type: 'mcq',
      prompt: 'Which statements about route guards are true? (Select all that apply.)',
      options: [
        { text: 'They improve UX by redirecting users before a page loads.' },
        { text: 'A user can bypass them by editing client state or calling the API directly.' },
        { text: 'If every admin route has a guard, the admin API endpoints don\'t need role checks.', why: 'The API is reachable without your app at all (curl, scripts). Every endpoint must authorize on its own.' },
        { text: 'They are a good place to remember where the user wanted to go (`?redirect=`).' },
      ],
      answer: [0, 1, 3],
      explanation: 'Guards shape navigation. Security decisions are made by the server for every request.',
    },
    {
      id: 'auth-security-q3',
      type: 'bug',
      prompt: 'This (Express-style) endpoint lets any logged-in user read **any** invoice by changing the id. Click the line where the missing check should have stopped it.',
      code: {
        lang: 'js',
        code: `app.get('/api/invoices/:id', async (req, res) => {
  const user = await sessionUser(req)
  if (!user) return res.status(401).end()

  const invoice = await db.invoices.find(req.params.id)
  if (!invoice) return res.status(404).end()

  res.json(invoice)
})`,
      },
      answerLine: 8,
      explanation: 'Authentication is checked (line 3), but before sending the invoice on line 8 the server never checks `invoice.ownerId === user.id` (or an admin role). Classic broken object-level authorization (IDOR). Add the ownership check and return 403 (or 404) otherwise.',
    },
    {
      id: 'auth-security-q4',
      type: 'output',
      prompt: 'A JWT\'s middle part is `eyJzdWIiOiI0MiIsIm5hbWUiOiJCZWEiLCJyb2xlIjoiY3VzdG9tZXIifQ`. What does this print in the browser console?',
      code: { lang: 'js', code: `console.log(atob('eyJzdWIiOiI0MiIsIm5hbWUiOiJCZWEiLCJyb2xlIjoiY3VzdG9tZXIifQ'))` },
      options: [
        { text: 'An error — JWT payloads are encrypted', why: 'Standard (signed) JWTs are only base64url-encoded. The signature prevents changes; it doesn\'t hide the content.' },
        { text: '`{"sub":"42","name":"Bea","role":"customer"}`' },
        { text: 'Random-looking bytes — you need the server\'s secret to read it', why: 'The secret is needed to *create or verify* the signature, not to read the payload.' },
        { text: '`true` — the token is valid', why: '`atob` just decodes base64; it knows nothing about validity.' },
      ],
      answer: 1,
      explanation: 'Anyone holding a JWT can read its claims. Never put secrets in it, and never let the client\'s reading of it decide authorization. (Real base64url tokens may need `-`/`_` replaced before `atob`; this one happens not to.)',
    },
    {
      id: 'auth-security-q5',
      type: 'fill',
      prompt: 'Complete the cookie flag that hides the session from JavaScript, and the fetch option that sends cookies to an API on another origin.',
      code: {
        lang: 'js',
        code: `// server response header:
// Set-Cookie: session=abc123; ___; Secure; SameSite=Lax; Path=/

// client:
fetch('https://api.example.com/me', { credentials: '___' })`,
      },
      answer: [['HttpOnly', 'httponly', 'httpOnly'], ['include']],
      explanation: '`HttpOnly` keeps the cookie out of `document.cookie`, so injected scripts can\'t read it. `credentials: \'include\'` sends cookies cross-origin (the server must also allow credentials in its CORS headers).',
    },
    {
      id: 'auth-security-q6',
      type: 'mcq',
      prompt: 'Why is an access token in `localStorage` considered risky?',
      options: [
        { text: 'Any JavaScript running on the page — including injected script from an XSS bug — can read and exfiltrate it.' },
        { text: 'localStorage is sent with every request, enabling CSRF.', why: 'localStorage is never sent automatically; that\'s cookies. Bearer tokens in headers are actually not CSRF-prone.' },
        { text: 'localStorage is cleared whenever the tab closes.', why: 'That\'s sessionStorage. localStorage persists — which makes a stolen token more useful, not less.' },
        { text: 'Browsers encrypt localStorage with the user\'s password.', why: 'They don\'t; it is plain data readable by scripts from the same origin.' },
      ],
      answer: 0,
      explanation: 'The trade-off: localStorage is convenient and not CSRF-prone, but it turns any XSS into token theft. httpOnly cookies flip the trade-off.',
    },
    {
      id: 'auth-security-q7',
      type: 'short',
      prompt: 'In your own words: why can\'t the frontend be responsible for authorization?',
      answer: 'Everything in the frontend runs on the user\'s machine: they can read the bundle, edit state (like their role) in devtools, and call the API directly without the app. So any check in the browser can be bypassed. Only the server, which holds the real session and permission data, can reliably decide what a request may do — the frontend just mirrors those rules for a nicer UI.',
    },
  ],

  exercises: [
    {
      id: 'role-guard',
      title: 'A role-aware navigation guard',
      difficulty: 'intermediate',
      prompt: `
Add a global guard to \`router.js\` (a UX feature — the server would still check every request).

- Logged-out users (\`auth.user === null\`) who open a route with \`meta.requiresAuth\` go to \`/login\` with the original destination in the query: \`/login?redirect=/account\`.
- Logged-in users opening a route with \`meta.roles\` that doesn't include their \`role\` go to \`/forbidden\`.
- Everyone else navigates normally.

Each page renders an \`<h2 class="page">\` with its title. \`auth.js\` exports \`auth\` (reactive, with \`user\`) and \`setUser(user)\`; the tests use \`setUser({ name: 'Bea', role: 'customer' })\` and \`router.push(...)\`.
`,
      files: { 'main.js': guardMain, 'App.vue': guardApp, 'router.js': guardRouterStarter, 'auth.js': guardAuth },
      hints: [
        'Use `router.beforeEach((to) => { … })`. Returning a route location redirects; returning nothing allows the navigation.',
        'First check `to.meta.requiresAuth && !auth.user` and return `{ path: \'/login\', query: { redirect: to.fullPath } }`.',
        'Then check `to.meta.roles && !to.meta.roles.includes(auth.user?.role)` and return `{ path: \'/forbidden\' }`.',
      ],
      solution: {
        explanation: 'The guard reads route `meta` (data you attach to routes) and the client\'s copy of the user. Order matters: "not logged in" is checked before "wrong role", so guests get a login prompt instead of a confusing "forbidden". Remember the comment at the top of the guard: this decides which *screen* appears — the API decides which *data* exists.',
        files: { 'main.js': guardMain, 'App.vue': guardApp, 'router.js': guardRouterSolution, 'auth.js': guardAuth },
      },
      tests: [
        {
          name: 'guests are sent to /login?redirect=/account',
          code: `const { router } = requireModule('router.js')
await router.push('/account')
await flush()
expect(router.currentRoute.value.path).toBe('/login')
expect(router.currentRoute.value.query.redirect).toBe('/account')`,
        },
        {
          name: 'public pages stay public',
          code: `const { router } = requireModule('router.js')
await router.push('/')
await flush()
expect(text('.page')).toBe('Home')`,
        },
        {
          name: 'logged-in customers can open /account',
          code: `const { router } = requireModule('router.js')
requireModule('auth.js').setUser({ name: 'Bea', role: 'customer' })
await router.push('/account')
await flush()
expect(text('.page')).toBe('Account')`,
        },
        {
          name: 'customers are sent to /forbidden from /admin',
          code: `const { router } = requireModule('router.js')
requireModule('auth.js').setUser({ name: 'Bea', role: 'customer' })
await router.push('/admin')
await flush()
expect(router.currentRoute.value.path).toBe('/forbidden')`,
        },
        {
          name: 'admins can open /admin',
          code: `const { router } = requireModule('router.js')
requireModule('auth.js').setUser({ name: 'Ada', role: 'admin' })
await router.push('/admin')
await flush()
expect(router.currentRoute.value.path).toBe('/admin')
expect(text('.page')).toBe('Admin')`,
        },
      ],
    },
    {
      id: 'session-expiry',
      title: 'Handle expired sessions in one place',
      difficulty: 'advanced',
      prompt: `
Sessions expire. When the server answers **401**, the app should stop pretending the user is logged in. Implement \`request(call)\` in \`http.js\`:

- Call \`call(auth.token)\` and return its result.
- If it fails with \`error.status === 401\`: call \`clearSession()\`, navigate to \`/login\` with \`?redirect=\` set to the current route's \`fullPath\` (the router is stored by \`setupHttp\`), then **rethrow** the error.
- Any other error (e.g. 500) is rethrown untouched, and the session is kept.

The account page has a \`<button class="reload">\` that calls \`request(getProfile)\`. The fake \`api.js\` has helpers \`expireAllSessions()\` and \`failNextWith(status)\` that the tests use.
`,
      files: {
        'main.js': expiryMain,
        'App.vue': expiryApp,
        'router.js': expiryRouter,
        'auth.js': expiryAuth,
        'api.js': expiryApi,
        'http.js': httpStarter,
        'AccountView.vue': expiryAccount,
      },
      hints: [
        'Wrap the call in `try { return await call(auth.token) } catch (error) { … }` — the `await` matters, otherwise the rejection escapes the `try`.',
        'Inside `catch`, only act when `error.status === 401`; always finish with `throw error`.',
        'Read `router.currentRoute.value.fullPath` *before* navigating, then `router.push({ path: \'/login\', query: { redirect: here } })`.',
      ],
      solution: {
        explanation: 'Centralising the 401 reaction means every API call in the app behaves the same way: the stale client copy is dropped, the user lands on the login page, and `?redirect=` brings them back after logging in. Rethrowing keeps callers honest — a component that awaited the request still learns it failed. 403 and 500 are not "you are logged out", so they pass through untouched.',
        files: {
          'main.js': expiryMain,
          'App.vue': expiryApp,
          'router.js': expiryRouter,
          'auth.js': expiryAuth,
          'api.js': expiryApi,
          'http.js': httpSolution,
          'AccountView.vue': expiryAccount,
        },
      },
      tests: [
        {
          name: 'successful calls return the data',
          code: `const api = requireModule('api.js')
await requireModule('auth.js').login('Bea')
const profile = await requireModule('http.js').request(api.getProfile)
expect(profile.name).toBe('Bea')`,
        },
        {
          name: 'a 401 clears the session and is rethrown',
          code: `const api = requireModule('api.js')
const { auth, login } = requireModule('auth.js')
await login('Bea')
api.expireAllSessions()
let caught = null
try {
  await requireModule('http.js').request(api.getProfile)
} catch (e) {
  caught = e
}
expect(caught && caught.status).toBe(401)
expect(auth.user).toBeNull()
expect(auth.token).toBeNull()`,
        },
        {
          name: 'a 401 sends the user to /login?redirect=/account',
          code: `const api = requireModule('api.js')
const { router } = requireModule('router.js')
await requireModule('auth.js').login('Bea')
await router.push('/account')
await wait(120)
api.expireAllSessions()
await click('.reload')
await wait(150)
expect(router.currentRoute.value.path).toBe('/login')
expect(router.currentRoute.value.query.redirect).toBe('/account')`,
        },
        {
          name: 'other errors are rethrown and keep the session',
          code: `const api = requireModule('api.js')
const { auth, login } = requireModule('auth.js')
await login('Bea')
api.failNextWith(500)
let caught = null
try {
  await requireModule('http.js').request(api.getProfile)
} catch (e) {
  caught = e
}
expect(caught && caught.status).toBe(500)
expect(auth.user).not.toBeNull()`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'auth-security-authn-vs-authz',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between authentication and authorization? How do they map to HTTP status codes?',
      answer: 'Authentication verifies identity ("who are you?") — login with a password, passkey or provider. Authorization decides permissions for that identity ("may you do this?") — roles, ownership, plans. A missing/invalid/expired session gets **401 Unauthorized** (really "unauthenticated"); a known user without permission gets **403 Forbidden**.',
      explanation: 'Authentication happens once per session and is re-validated on each request; authorization happens on every action, for every resource.',
      whyAsked: 'A vocabulary check — mixing them up leads to bugs like "logged in = allowed to do everything".',
      mistakes: ['Using the terms interchangeably.', 'Returning 401 for "not allowed" (which tells the client to re-login, uselessly).', 'Forgetting object-level authorization (ownership).'],
      followUps: ['How should a Vue app react to 401 vs 403?', 'What is IDOR?'],
      modelAnswer: 'Authentication answers "who are you" — verifying credentials and establishing a session. Authorization answers "what may you do" — checking roles, permissions and ownership for each action. If the session is missing or expired the server returns 401, and the app should clear its state and send the user to log in. If the user is known but not permitted, it returns 403, and the app shows a "not allowed" message. Both checks live on the server; the frontend only mirrors them for UX.',
    },
    {
      id: 'auth-security-guards-enough',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate says: "Our admin pages are protected — every admin route has a `beforeEach` guard checking `user.role === \'admin\'`." Is that enough? What would you say in the review?',
      answer: 'No. The guard runs in the user\'s browser on state they can edit, and the admin bundle is downloadable anyway. Anyone can call the admin API endpoints directly. The guard is fine as UX, but every admin endpoint must authenticate the session and check the role (and object ownership where relevant) on the server, returning 401/403. I\'d ask for server-side checks plus tests that a customer token gets 403 on each admin endpoint.',
      explanation: 'Client-side checks are about what the user *sees*; server-side checks are about what the user *gets*.',
      whyAsked: 'The single most important frontend security principle. Interviewers want to hear it unprompted.',
      mistakes: ['Agreeing that guards are sufficient.', 'Suggesting obfuscation or hiding routes as protection.', 'Only adding more client-side checks.'],
      followUps: ['How would you test it?', 'Should admin code be lazy-loaded? Does that add security?', 'What about hiding admin buttons with v-if?'],
      modelAnswer: 'It isn\'t enough. Guards run in the browser, read state the user controls, and the admin pages ship in the bundle anyway. Anyone can open devtools, change their role, or skip the app and call the API with curl. I\'d keep the guard for UX, but require every admin endpoint to verify the session and the role on the server, and add API tests asserting a customer gets 403. Lazy-loading admin routes is a good performance idea, but it isn\'t a security boundary either.',
    },
    {
      id: 'auth-security-token-storage',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 5,
      question: 'Compare storing an access token in localStorage with using an httpOnly session cookie for a Vue SPA. Which would you choose and why?',
      answer: 'localStorage: easy, survives reloads, works cross-origin with an Authorization header, not CSRF-prone — but any script on the page can read it, so an XSS bug means token theft. httpOnly cookie: JavaScript can\'t read it, so XSS can\'t steal it (it can still act as the user while the page is open); the browser sends it automatically, so you need CSRF protection (SameSite, CSRF tokens, Origin checks), plus HTTPS (`Secure`) and correct CORS/credentials for cross-origin APIs. I generally prefer httpOnly, Secure, SameSite cookies (directly or via a backend-for-frontend); if tokens must be in JS, keep them short-lived and in memory.',
      explanation: 'It\'s a trade-off between XSS exposure and CSRF exposure — and CSRF has well-understood, server-side mitigations.',
      whyAsked: 'Shows whether you can reason about threats instead of repeating "never use localStorage".',
      mistakes: ['Claiming httpOnly cookies make XSS harmless.', 'Forgetting CSRF entirely when choosing cookies.', 'Saying JWT vs cookie — they aren\'t opposites (a JWT can live in a cookie).'],
      followUps: ['What does SameSite=Lax actually block?', 'How do refresh tokens fit in?', 'What changes if the API is on a different domain?'],
      modelAnswer: 'Putting a token in localStorage is convenient and immune to CSRF because nothing is sent automatically, but every script on the page can read it, so a single XSS turns into a stolen, reusable token. An httpOnly cookie can\'t be read by JavaScript, which removes that theft vector, though injected script can still make requests while the page is open. Because cookies are sent automatically, I\'d add SameSite, CSRF tokens or Origin checks, mark it Secure, and configure CORS with credentials if the API is cross-origin. My default is an httpOnly, Secure, SameSite cookie session, possibly through a backend-for-frontend; if I must hold tokens in JavaScript, I keep them short-lived and in memory.',
    },
    {
      id: 'auth-security-csrf',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is CSRF, and why does it only matter when authentication is cookie-based?',
      answer: 'Cross-Site Request Forgery: a malicious site makes the victim\'s browser send a request to your site (an auto-submitting form, an image tag). If your session is a cookie, the browser attaches it automatically, so the request runs as the victim. Bearer tokens in an Authorization header aren\'t attached automatically, so they aren\'t vulnerable in the same way. Mitigations: SameSite cookies, anti-CSRF tokens, checking Origin/Referer, never changing state on GET.',
      explanation: 'The attacker never sees the cookie — they borrow the browser\'s habit of sending it.',
      whyAsked: 'Directly tied to the cookie-vs-token decision; candidates who recommend cookies must know the cost.',
      mistakes: ['Confusing CSRF with XSS.', 'Believing CORS prevents CSRF (it controls reading responses, not sending requests).', 'Forgetting that GET endpoints must be side-effect free.'],
      followUps: ['What does SameSite=Strict break?', 'How does a double-submit cookie work?'],
      modelAnswer: 'CSRF is when another site tricks the user\'s browser into sending a state-changing request to our site. With cookie sessions the browser attaches the cookie automatically, so the request is authenticated as the victim even though the attacker never sees the cookie. Tokens sent in an Authorization header don\'t have that problem because JavaScript must add them explicitly. The defenses are server-side: SameSite cookies, CSRF tokens, Origin checks, and keeping GET requests free of side effects. CORS doesn\'t stop it — CORS limits reading responses, not sending requests.',
    },
    {
      id: 'auth-security-idor-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A bug report: "If I change `/orders/1001` to `/orders/1002` in the address bar, I see a stranger\'s order." The Vue page calls `GET /api/orders/:id`. Where is the bug and how do you fix it?',
      answer: 'In the backend: the endpoint authenticates the user but doesn\'t check that the order belongs to them (broken object-level authorization / IDOR). Fix on the server: load the order and return 403/404 unless `order.userId === session.userId` (or the user\'s role allows it). Adding a frontend check or hiding ids doesn\'t fix it — the API is still callable directly. Add tests for cross-user access.',
      explanation: 'Unguessable ids (UUIDs) make enumeration harder but are not authorization.',
      whyAsked: 'IDOR-style bugs are among the most common real-world API vulnerabilities, and frontend developers often spot them first.',
      mistakes: ['"Add a route guard that compares ids."', '"Use UUIDs so nobody can guess ids" as the whole fix.', 'Blaming the router.'],
      followUps: ['Would you return 403 or 404?', 'How would you prevent this class of bug across all endpoints?'],
      modelAnswer: 'The frontend just reflects it — the bug is the API returning an order without checking ownership. The endpoint verifies the session but not that order 1002 belongs to the session user. I\'d fix it on the server by checking ownership or role before returning the record, responding 404 or 403 otherwise, and add tests that one user can\'t read another\'s orders. UUIDs reduce guessability, but they\'re not a substitute for the check. Longer term I\'d centralise object-level authorization in a shared policy layer.',
    },
    {
      id: 'auth-security-cross-origin-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Your Vue SPA is served from `app.example.com` and the API from `api.example.com`. Design the login/session setup. What do you configure on each side?',
      answer: 'Use a server-set session cookie: `HttpOnly; Secure; SameSite=Lax` (Strict if UX allows), scoped appropriately (e.g. host-only on the API, or `Domain=example.com` if both need it). The two hosts are same-site, so SameSite cookies flow, but cross-origin, so CORS is needed: API responds with `Access-Control-Allow-Origin: https://app.example.com` (not `*`) and `Access-Control-Allow-Credentials: true`; the client uses `fetch(..., { credentials: \'include\' })`. Protect state-changing endpoints with CSRF tokens or Origin checks. On startup the SPA calls `GET /me` to restore state; a central HTTP wrapper handles 401 (redirect to login) and 403. Everything is authorized server-side. Alternative: serve the API under the same origin (`app.example.com/api`) via a reverse proxy or backend-for-frontend to avoid CORS entirely.',
      explanation: 'Know the difference between same-origin and same-site, and which knobs belong to the browser, the server and the client code.',
      whyAsked: 'A realistic senior-level design question combining cookies, CORS, CSRF and SPA state.',
      mistakes: ['`Access-Control-Allow-Origin: *` with credentials (browsers reject it).', 'Assuming SameSite blocks subdomains (they are same-site).', 'Storing the session token in localStorage "because CORS is annoying".'],
      followUps: ['What changes if the API is on a completely different domain?', 'Where would a backend-for-frontend help?', 'How do you handle logout across tabs?'],
      modelAnswer: 'I\'d have the API set an httpOnly, Secure, SameSite=Lax session cookie on login. The app and API are cross-origin but same-site, so the cookie is allowed, and I configure CORS with the exact app origin and allow-credentials, while the client sends requests with credentials included. Because cookies are automatic, state-changing endpoints get CSRF protection via tokens or Origin checks. On boot the SPA calls /me to rebuild its user copy, and one HTTP wrapper handles 401 by redirecting to login and 403 with a message. Every endpoint authorizes on the server. If CORS becomes painful, a reverse proxy serving the API under the app\'s origin removes it entirely.',
    },
    {
      id: 'auth-security-coding-redirect',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'After login the app follows `?redirect=`. Implement `safeRedirect(target, fallback = \'/\')` in `redirect.js` so only **internal** paths are returned; everything else returns the fallback. Remember that `route.query.redirect` may be a string, `null`, an array or missing.',
      starter: {
        files: {
          'redirect.js': `export function safeRedirect(target, fallback = '/') {
  return target || fallback
}`,
          'App.vue': `<script setup>
import { safeRedirect } from './redirect.js'

const samples = ['/orders/42?tab=items', '//evil.example', 'https://evil.example/login']
</script>

<template>
  <ul>
    <li v-for="s in samples" :key="s" class="sample">{{ s }} → {{ safeRedirect(s) }}</li>
  </ul>
</template>`,
        },
      },
      tests: [
        { name: 'keeps internal paths with query and hash', code: `const { safeRedirect } = requireModule('redirect.js')\nexpect(safeRedirect('/orders/42?tab=items#top')).toBe('/orders/42?tab=items#top')` },
        { name: 'rejects absolute URLs to other sites', code: `const { safeRedirect } = requireModule('redirect.js')\nexpect(safeRedirect('https://evil.example/login')).toBe('/')` },
        { name: 'rejects protocol-relative and backslash tricks', code: `const { safeRedirect } = requireModule('redirect.js')\nexpect(safeRedirect('//evil.example')).toBe('/')\nexpect(safeRedirect('/\\\\evil.example')).toBe('/')` },
        { name: 'rejects javascript: URLs', code: `const { safeRedirect } = requireModule('redirect.js')\nexpect(safeRedirect('javascript:alert(1)')).toBe('/')` },
        { name: 'uses the fallback for non-strings', code: `const { safeRedirect } = requireModule('redirect.js')\nexpect(safeRedirect(['/a', '/b'], '/home')).toBe('/home')\nexpect(safeRedirect(undefined, '/home')).toBe('/home')` },
      ],
      hints: [
        'String checks get tricky (`//host`, `/\\host`, tabs…). Let the browser\'s URL parser do the work.',
        'Resolve the target against a fake base: `new URL(target, \'https://app.invalid\')`. If the result\'s `origin` is still `https://app.invalid`, it\'s internal.',
        'Return `url.pathname + url.search + url.hash` for internal targets, and the fallback for non-strings or other origins.',
      ],
      answer: 'Reject non-strings, resolve the string against a fixed dummy origin with `new URL()`, and accept it only if the resulting origin is unchanged — then return the path, query and hash.',
      solution: {
        files: {
          'redirect.js': `const BASE = 'https://app.invalid'

export function safeRedirect(target, fallback = '/') {
  if (typeof target !== 'string') return fallback
  try {
    const url = new URL(target, BASE)
    if (url.origin !== BASE) return fallback // another site, or a javascript:/data: URL
    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}`,
          'App.vue': `<script setup>
import { safeRedirect } from './redirect.js'

const samples = ['/orders/42?tab=items', '//evil.example', 'https://evil.example/login']
</script>

<template>
  <ul>
    <li v-for="s in samples" :key="s" class="sample">{{ s }} → {{ safeRedirect(s) }}</li>
  </ul>
</template>`,
        },
      },
      explanation: 'Resolving against a dummy origin makes the browser\'s own rules decide: protocol-relative URLs (`//evil.example`), backslashes (which browsers treat like slashes in http URLs) and absolute URLs all change the origin, and `javascript:` URLs have an opaque `null` origin. Only genuinely internal paths keep the dummy origin.',
      whyAsked: 'Open redirects are a common finding in login flows; the question checks whether you think about input from the URL as untrusted.',
      mistakes: ['Only checking `startsWith(\'/\')` (allows `//evil.example`).', 'Forgetting that query values can be arrays.', 'Using `window.location.href = redirect` without validation.'],
      followUps: ['Why is an open redirect dangerous if it only redirects?', 'Would you also validate redirects on the server (e.g. OAuth callbacks)?'],
      modelAnswer: 'I treat the query parameter as untrusted input. First I reject anything that isn\'t a string, since Vue Router query values can be arrays or null. Then I resolve it with `new URL(target, someFixedBase)` and only accept it if the origin is still that base — which rules out absolute URLs, protocol-relative and backslash tricks, and `javascript:` URLs. For accepted targets I return path, query and hash. Open redirects matter because they make phishing links look like they belong to our domain.',
    },
  ],

  takeaways: [
    'Authentication = who you are; authorization = what you may do. 401 vs 403.',
    'Route guards, hidden buttons and client-side role checks are UX — the server must authorize every request, including ownership.',
    'Whatever the server sends, the user can read: never ship data and filter it in the client.',
    'Tokens in localStorage are exposed to XSS; httpOnly cookies are not, but need CSRF protection (SameSite, tokens, Origin checks).',
    'JWT payloads are readable by anyone; the signature stops forgery, not reading.',
    'Handle 401 in one place (clear session, safe redirect to login), revoke sessions on logout, and validate `?redirect=` targets.',
  ],
}
