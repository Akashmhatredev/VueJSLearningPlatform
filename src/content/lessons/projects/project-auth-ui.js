// Project 7: Authentication UI — forms, a simulated auth API, auth state, route guards, secure design.

const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router.js'
import './styles.css'

// Pinia first: the router's guard reads the auth store.
createApp(App).use(createPinia()).use(router).mount('#app')
`

const stylesCss = `:root {
  --ink: #1d1d1f;
  --muted: #5f5f6b;
  --line: #e2e2e9;
  --soft: #f6f6f9;
  --accent: #3b5bdb;
  --danger: #c92a2a;
  --ok: #2b8a3e;
}
body { margin: 0; background: var(--soft); }
#app { font-family: system-ui, sans-serif; color: var(--ink); }
#app button,
#app input { font: inherit; }
#app :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.page { max-width: 760px; margin: 0 auto; padding: 24px 20px; }
.auth-card { max-width: 380px; margin: 24px auto; padding: 24px; border: 1px solid var(--line); border-radius: 14px; background: #fff; }
.auth-card h1 { margin: 0 0 16px; font-size: 1.5rem; }
.auth-form { display: grid; gap: 14px; }
.field { display: grid; gap: 4px; }
.field label { font-weight: 600; font-size: 0.9rem; }
.field input { padding: 9px 11px; border: 1px solid var(--line); border-radius: 8px; }
.field input[aria-invalid='true'] { border-color: var(--danger); }
.field-error { margin: 0; color: var(--danger); font-size: 0.85rem; }
.form-error { margin: 0; padding: 10px 12px; border-radius: 8px; background: #fff5f5; color: var(--danger); }
.notice { margin: 0 0 14px; padding: 10px 12px; border-radius: 8px; background: #edf2ff; }
.primary { padding: 10px; border: 0; border-radius: 8px; background: var(--ink); color: #fff; cursor: pointer; }
.primary:disabled { opacity: 0.6; cursor: progress; }
.hint { color: var(--muted); font-size: 0.85rem; margin: 0; }
`

const apiJs = `// A pretend authentication server — SIMPLIFIED for the sandbox.
//
// What a real server does differently:
//  - never stores passwords: only a salted hash from a slow algorithm (Argon2id, bcrypt…)
//  - puts the session id in a cookie marked HttpOnly; Secure; SameSite, which page
//    JavaScript cannot read at all — the browser just sends it with each request
//  - rate-limits by account AND IP over a time window, and logs security events
//
// Here, sessionStorage stands in for the browser's cookie jar so a "reload"
// keeps you signed in. Your app code must never read it — only this file does.

const LATENCY = 150
const COOKIE = 'demo.sessionCookie'
const MAX_FAILURES = 5

export const stats = { login: 0, register: 0 }

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const users = [
  // SIMPLIFIED: a real database would hold a password HASH, never the password.
  { id: 1, name: 'Ada Lovelace', email: 'ada@example.com', password: 'correct horse battery staple' },
]
const failures = new Map() // email -> failed attempts

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email })
const delay = (value, fail) =>
  new Promise((resolve, reject) => setTimeout(() => (fail ? reject(fail) : resolve(value)), LATENCY))

function setSessionCookie(userId) {
  sessionStorage.setItem(COOKIE, String(userId))
}

function currentUser() {
  const id = Number(sessionStorage.getItem(COOKIE))
  return users.find((user) => user.id === id) ?? null
}

// POST /api/login
export function login({ email, password }) {
  stats.login++
  const key = String(email).trim().toLowerCase()
  if ((failures.get(key) ?? 0) >= MAX_FAILURES) {
    return delay(null, new ApiError(429, 'Too many attempts. Please wait a few minutes and try again.'))
  }
  const user = users.find((u) => u.email === key)
  // Same message whether the email exists or not: don't reveal who has an account.
  if (!user || user.password !== password) {
    failures.set(key, (failures.get(key) ?? 0) + 1)
    return delay(null, new ApiError(401, 'Email or password is incorrect.'))
  }
  failures.delete(key)
  setSessionCookie(user.id) // the "Set-Cookie" response header
  return delay({ user: publicUser(user) })
}

// POST /api/register
export function register({ name, email, password }) {
  stats.register++
  const key = String(email).trim().toLowerCase()
  if (users.some((u) => u.email === key)) {
    return delay(null, new ApiError(409, 'An account with this email already exists. Try signing in.'))
  }
  const user = { id: users.length + 1, name: String(name).trim(), email: key, password }
  users.push(user)
  setSessionCookie(user.id)
  return delay({ user: publicUser(user) })
}

// GET /api/me — "who does my session cookie belong to?"
export function me() {
  const user = currentUser()
  return user ? delay(publicUser(user)) : delay(null, new ApiError(401, 'Not signed in.'))
}

// POST /api/logout — the server forgets the session and clears the cookie
export function logout() {
  sessionStorage.removeItem(COOKIE)
  return delay(null)
}

// GET /api/dashboard — protected data
export function getDashboard() {
  const user = currentUser()
  if (!user) return delay(null, new ApiError(401, 'Your session has expired.'))
  return delay({
    projects: [
      { id: 1, name: 'Website redesign', status: 'In review' },
      { id: 2, name: 'Mobile onboarding', status: 'Drafting' },
      { id: 3, name: 'Billing emails', status: 'Shipped' },
    ],
  })
}

// Demo helper: the server ends the session (timeout, revoked device…)
// without the client knowing. The next protected request gets a 401.
export function expireSession() {
  sessionStorage.removeItem(COOKIE)
}
`

const starterSecurityJs = `// Deliberately simple: something@something.something.
// The server does the real check (and confirms ownership by email).
export function isValidEmail(value) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(value).trim())
}

// Where should we send the user after signing in?
// TODO (step 5): this trusts ANY value from the URL — an open redirect.
// Only allow in-app paths, and fall back otherwise.
export function safeRedirect(value, fallback = '/dashboard') {
  return value || fallback
}
`

const securityJs = `// Deliberately simple: something@something.something.
// The server does the real check (and confirms ownership by email).
export function isValidEmail(value) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(value).trim())
}

// Where should we send the user after signing in?
// ?redirect= comes from the URL, so anyone can craft it. Only accept paths
// inside this app; never "https://evil.example", "//evil.example" or "/\\\\evil".
export function safeRedirect(value, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\\\')) return fallback
  if (value.startsWith('/login') || value.startsWith('/register')) return fallback // no loops
  return value
}
`

// ---------------------------------------------------------------- store

const authStoreReturn = `  return { user, status, notice, isAuthenticated, init, login, register, logout, markExpired }
})
`

const starterAuthStoreJs = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api.js'

export const useAuthStore = defineStore('auth', () => {
  // TODO (step 3): don't trust localStorage for "who is signed in" —
  // ask the server (api.me()) instead, once, when the app starts.
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const status = ref('ready') // 'idle' | 'checking' | 'ready'
  const notice = ref('') // '' | 'expired' | 'signed-out'

  const isAuthenticated = computed(() => user.value !== null)

  function init() {
    // TODO (step 3): restore the session from the server; return a promise
    // that every caller (e.g. the router guard) can await.
    return Promise.resolve()
  }

  async function login(credentials) {
    const result = await api.login(credentials)
    user.value = result.user
    localStorage.setItem('user', JSON.stringify(result.user))
  }

  async function register(details) {
    const result = await api.register(details)
    user.value = result.user
  }

  async function logout() {
    // TODO (step 7): tell the server, clear the user, set notice = 'signed-out'
  }

  function markExpired() {
    // TODO (step 7)
  }

${authStoreReturn}`

const authStoreJs = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as api from '../api.js'

// Auth state lives in a store because the router guard, the header and
// several pages all need it. It holds the PUBLIC user only — no password,
// no token: the session cookie is the browser's business.
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const status = ref('idle') // 'idle' | 'checking' | 'ready'
  const notice = ref('') // '' | 'expired' | 'signed-out'
  let initPromise = null

  const isAuthenticated = computed(() => user.value !== null)

  // Ask the server who we are — once. Every caller gets the same promise.
  function init() {
    if (!initPromise) {
      status.value = 'checking'
      initPromise = api
        .me()
        .then((me) => {
          user.value = me
        })
        .catch(() => {
          user.value = null // 401: no valid session
        })
        .finally(() => {
          status.value = 'ready'
        })
    }
    return initPromise
  }

  async function login(credentials) {
    const result = await api.login(credentials) // throws ApiError on failure
    user.value = result.user
    notice.value = ''
  }

  async function register(details) {
    const result = await api.register(details)
    user.value = result.user
    notice.value = ''
  }

  async function logout() {
    try {
      await api.logout() // the server must end the session, not just the UI
    } finally {
      user.value = null
      notice.value = 'signed-out'
    }
  }

  // Called when the server answers 401 to a signed-in request.
  function markExpired() {
    user.value = null
    notice.value = 'expired'
  }

${authStoreReturn}`

// ---------------------------------------------------------------- router

const routerHeader = `import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import DashboardView from './views/DashboardView.vue'
import AccountView from './views/AccountView.vue'
import NotFoundView from './views/NotFoundView.vue'
`

const routesBlock = `export const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
  { path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/account', name: 'account', component: AccountView, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
]

// Memory history because the sandbox has no address bar; real apps use createWebHistory().
const router = createRouter({ history: createMemoryHistory(), routes })
`

const starterRouterJs = `${routerHeader}// TODO (step 4): import { useAuthStore } and { safeRedirect }

${routesBlock}
// TODO (step 4): a beforeEach guard that
//  - waits for auth.init() (the session check) to finish,
//  - sends signed-out users from requiresAuth pages to login?redirect=<where they wanted to go>,
//  - sends signed-in users away from guestOnly pages (login, register).

export default router
`

const routerJs = `${routerHeader}import { useAuthStore } from './stores/auth.js'
import { safeRedirect } from './security.js'

${routesBlock}
// UX, not security: this decides which PAGES the browser shows.
// The server still checks the session on every API request.
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init() // the first navigation waits for the session check

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return safeRedirect(to.query.redirect)
  }
})

export default router
`

// ---------------------------------------------------------------- components

const appVue = `<script setup>
import { RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppHeader from './components/AppHeader.vue'
import { useAuthStore } from './stores/auth.js'

const { status } = storeToRefs(useAuthStore())
</script>

<template>
  <AppHeader />
  <main class="page">
    <p v-if="status === 'checking'" class="checking" role="status">Checking your session…</p>
    <RouterView />
  </main>
</template>`

const headerStyles = `<style scoped>
.app-header { display: flex; align-items: center; gap: 16px; padding: 12px 20px; background: #fff; border-bottom: 1px solid var(--line); }
.brand { font-weight: 800; color: var(--ink); text-decoration: none; }
nav ul { display: flex; gap: 12px; list-style: none; margin: 0; padding: 0; }
nav a { color: var(--muted); text-decoration: none; }
nav a[aria-current='page'] { color: var(--ink); font-weight: 600; }
.session { margin-left: auto; display: flex; align-items: center; gap: 10px; }
.user-name { font-weight: 600; }
.logout { padding: 6px 12px; border: 1px solid var(--ink); border-radius: 8px; background: #fff; cursor: pointer; }
</style>`

const headerTemplate = `<template>
  <header class="app-header">
    <RouterLink to="/" class="brand">Acme</RouterLink>
    <nav aria-label="Main">
      <ul>
        <template v-if="isAuthenticated">
          <li><RouterLink :to="{ name: 'dashboard' }">Dashboard</RouterLink></li>
          <li><RouterLink :to="{ name: 'account' }">Account</RouterLink></li>
        </template>
        <template v-else>
          <li><RouterLink :to="{ name: 'login' }" class="nav-login">Sign in</RouterLink></li>
          <li><RouterLink :to="{ name: 'register' }" class="nav-register">Create account</RouterLink></li>
        </template>
      </ul>
    </nav>
    <div v-if="isAuthenticated" class="session">
      <span class="user-name">{{ user.name }}</span>
      <button type="button" class="logout" @click="signOut">Sign out</button>
    </div>
  </header>
</template>`

const starterHeaderVue = `<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const router = useRouter()
const { user, isAuthenticated } = storeToRefs(auth)

async function signOut() {
  // TODO (step 7): await auth.logout(), then go to the login page
}
</script>

${headerTemplate}

${headerStyles}`

const headerVue = `<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const router = useRouter()
const { user, isAuthenticated } = storeToRefs(auth)

async function signOut() {
  await auth.logout()
  await router.replace({ name: 'login' })
}
</script>

${headerTemplate}

${headerStyles}`

const passwordFieldVue = `<script setup>
import { ref } from 'vue'

// A reusable password input with a show/hide toggle.
// defineModel() (Vue 3.4+) gives it a v-model.
const password = defineModel({ type: String, default: '' })

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, default: 'Password' },
  // 'current-password' on sign-in, 'new-password' on sign-up:
  // password managers use this to fill or generate the right thing.
  autocomplete: { type: String, required: true },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
})

const visible = ref(false)
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <div class="password-row">
      <input
        :id="id"
        v-model="password"
        :type="visible ? 'text' : 'password'"
        :autocomplete="autocomplete"
        :aria-invalid="error ? 'true' : 'false'"
        :aria-describedby="[error ? id + '-error' : '', hint ? id + '-hint' : ''].join(' ').trim() || undefined"
        spellcheck="false"
      />
      <button
        type="button"
        class="toggle-password"
        :aria-pressed="visible ? 'true' : 'false'"
        :aria-controls="id"
        @click="visible = !visible"
      >
        {{ visible ? 'Hide' : 'Show' }}
      </button>
    </div>
    <p v-if="hint" :id="id + '-hint'" class="hint">{{ hint }}</p>
    <p v-if="error" :id="id + '-error'" class="field-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.password-row { display: flex; gap: 6px; }
.password-row input { flex: 1; min-width: 0; }
.toggle-password { padding: 0 12px; border: 1px solid var(--line); border-radius: 8px; background: #fff; cursor: pointer; }
</style>`

// ---------------------------------------------------------------- views

const homeVue = `<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="home">
    <h1>Acme projects</h1>
    <p>Plan and ship your team's work. Sign in to see your dashboard.</p>
    <p class="hint">Demo account: <strong>ada@example.com</strong> / <strong>correct horse battery staple</strong></p>
    <RouterLink :to="{ name: 'dashboard' }">Go to your dashboard →</RouterLink>
  </section>
</template>`

const loginTemplate = `<template>
  <section class="auth-card">
    <h1>Sign in</h1>
    <p v-if="noticeText" class="notice" role="status">{{ noticeText }}</p>

    <form class="auth-form login-form" novalidate :aria-busy="submitting ? 'true' : 'false'" @submit.prevent="submit">
      <div class="field">
        <label for="login-email">Email</label>
        <input
          id="login-email"
          v-model="form.email"
          class="input-email"
          type="email"
          name="email"
          autocomplete="username"
          :aria-invalid="visibleErrors.email ? 'true' : 'false'"
          :aria-describedby="visibleErrors.email ? 'login-email-error' : undefined"
        />
        <p v-if="visibleErrors.email" id="login-email-error" class="field-error">{{ visibleErrors.email }}</p>
      </div>

      <PasswordField
        id="login-password"
        v-model="form.password"
        autocomplete="current-password"
        :error="visibleErrors.password"
      />

      <p v-if="serverError" class="form-error" role="alert">{{ serverError }}</p>
      <button type="submit" class="primary login-submit" :disabled="submitting">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <p class="hint">
      New here?
      <RouterLink :to="{ name: 'register', query: route.query.redirect ? { redirect: route.query.redirect } : {} }">Create an account</RouterLink>
    </p>
  </section>
</template>`

const starterLoginVue = `<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import PasswordField from '../components/PasswordField.vue'
// TODO (step 6): import { isValidEmail, safeRedirect } from '../security.js'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const submitting = ref(false)
const serverError = ref('')
// TODO (step 6): computed errors, shown after the first submit attempt
const visibleErrors = {}
// TODO (step 7): a message for auth.notice ('expired' / 'signed-out')
const noticeText = ''

async function submit() {
  // TODO (step 6): validate first, ignore double submits, show server errors,
  // then go back to the page the user wanted (safely).
  await auth.login({ email: form.email, password: form.password })
  router.push('/dashboard')
}
</script>

${loginTemplate}`

const loginVue = `<script setup>
import { reactive, ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { isValidEmail, safeRedirect } from '../security.js'
import PasswordField from '../components/PasswordField.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ email: '', password: '' })
const attempted = ref(false)
const submitting = ref(false)
const serverError = ref('')

const errors = computed(() => {
  const result = {}
  if (!isValidEmail(form.email)) result.email = 'Enter a valid email address.'
  if (!form.password) result.password = 'Enter your password.'
  return result
})
const visibleErrors = computed(() => (attempted.value ? errors.value : {}))

const NOTICES = {
  expired: 'Your session has expired. Please sign in again.',
  'signed-out': 'You have signed out.',
}
const noticeText = computed(() => NOTICES[auth.notice] ?? '')

async function submit() {
  if (submitting.value) return // ignore double submits (Enter pressed twice…)
  attempted.value = true
  serverError.value = ''
  if (Object.keys(errors.value).length > 0) return

  submitting.value = true
  try {
    await auth.login({ email: form.email.trim(), password: form.password })
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    // 401 and 429 messages are written for users; anything else stays vague.
    serverError.value = error.status === 401 || error.status === 429 ? error.message : 'Something went wrong. Please try again.'
    form.password = '' // never keep a wrong password around
  } finally {
    submitting.value = false
  }
}
</script>

${loginTemplate}`

const registerTemplate = `<template>
  <section class="auth-card">
    <h1>Create your account</h1>

    <form class="auth-form register-form" novalidate :aria-busy="submitting ? 'true' : 'false'" @submit.prevent="submit">
      <div class="field">
        <label for="register-name">Name</label>
        <input
          id="register-name"
          v-model="form.name"
          class="input-name"
          type="text"
          autocomplete="name"
          maxlength="60"
          :aria-invalid="visibleErrors.name ? 'true' : 'false'"
          :aria-describedby="visibleErrors.name ? 'register-name-error' : undefined"
        />
        <p v-if="visibleErrors.name" id="register-name-error" class="field-error">{{ visibleErrors.name }}</p>
      </div>

      <div class="field">
        <label for="register-email">Email</label>
        <input
          id="register-email"
          v-model="form.email"
          class="input-email"
          type="email"
          autocomplete="email"
          :aria-invalid="visibleErrors.email ? 'true' : 'false'"
          :aria-describedby="visibleErrors.email ? 'register-email-error' : undefined"
        />
        <p v-if="visibleErrors.email" id="register-email-error" class="field-error">{{ visibleErrors.email }}</p>
      </div>

      <PasswordField
        id="register-password"
        v-model="form.password"
        autocomplete="new-password"
        hint="At least 12 characters. A few random words make a strong, memorable passphrase."
        :error="visibleErrors.password"
      />

      <p v-if="serverError" class="form-error" role="alert">{{ serverError }}</p>
      <button type="submit" class="primary register-submit" :disabled="submitting">
        {{ submitting ? 'Creating account…' : 'Create account' }}
      </button>
    </form>

    <p class="hint">Already have an account? <RouterLink :to="{ name: 'login' }">Sign in</RouterLink></p>
  </section>
</template>`

const registerScript = (validation) => `<script setup>
import { reactive, ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { isValidEmail, safeRedirect } from '../security.js'
import PasswordField from '../components/PasswordField.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({ name: '', email: '', password: '' })
const attempted = ref(false)
const submitting = ref(false)
const serverError = ref('')

const errors = computed(() => {
  const result = {}
  if (!form.name.trim()) result.name = 'Tell us your name.'
  if (!isValidEmail(form.email)) result.email = 'Enter a valid email address.'
${validation}  return result
})
const visibleErrors = computed(() => (attempted.value ? errors.value : {}))

async function submit() {
  if (submitting.value) return
  attempted.value = true
  serverError.value = ''
  if (Object.keys(errors.value).length > 0) return

  submitting.value = true
  try {
    await auth.register({ name: form.name.trim(), email: form.email.trim(), password: form.password })
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    serverError.value = error.status === 409 ? error.message : 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>`

const starterRegisterVue = `${registerScript(`  // TODO (step 6): the password must be at least 12 characters
  // and must not be the same as the email address.
`)}

${registerTemplate}`

const registerVue = `${registerScript(`  // Length matters more than symbol rules. (A real server would also reject
  // passwords that appear in known data breaches.)
  if (form.password.length < 12) result.password = 'Use at least 12 characters.'
  else if (form.password.trim().toLowerCase() === form.email.trim().toLowerCase()) result.password = 'Don\\'t use your email as your password.'
`)}

${registerTemplate}`

const dashboardVue = `<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth.js'
import * as api from '../api.js'

const auth = useAuthStore()
const { user } = storeToRefs(auth)
const route = useRoute()
const router = useRouter()

const projects = ref([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await api.getDashboard()
    projects.value = data.projects
  } catch (err) {
    if (err.status === 401) {
      // The SERVER says the session is gone: believe it, and send the user
      // to sign in again, coming back here afterwards.
      auth.markExpired()
      await router.replace({ name: 'login', query: { redirect: route.fullPath } })
      return
    }
    error.value = 'Could not load your projects.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="dashboard">
    <h1 class="welcome">Welcome back, {{ user?.name }}</h1>
    <div class="toolbar">
      <button type="button" class="refresh-dashboard" @click="load">Refresh</button>
      <span v-if="loading" role="status">Loading…</span>
    </div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <ul class="projects">
      <li v-for="project in projects" :key="project.id" class="project">
        <strong>{{ project.name }}</strong> <span class="hint">{{ project.status }}</span>
      </li>
    </ul>
    <details class="simulator">
      <summary>Simulation controls</summary>
      <button type="button" class="simulate-expiry" @click="api.expireSession()">End my session on the server</button>
      <p class="hint">Then press Refresh: the next protected request gets a 401.</p>
    </details>
  </section>
</template>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.refresh-dashboard { padding: 6px 12px; border: 1px solid var(--ink); border-radius: 8px; background: #fff; cursor: pointer; }
.projects { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.project { padding: 12px; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
.simulator { margin-top: 20px; color: var(--muted); }
.simulator button { margin-top: 8px; padding: 4px 10px; border: 1px solid var(--line); border-radius: 6px; background: #fff; cursor: pointer; }
</style>`

const accountVue = `<script setup>
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth.js'

const { user } = storeToRefs(useAuthStore())
</script>

<template>
  <section class="account">
    <h1>Your account</h1>
    <dl class="account-details">
      <div><dt>Name</dt><dd>{{ user?.name }}</dd></div>
      <div><dt>Email</dt><dd>{{ user?.email }}</dd></div>
    </dl>
  </section>
</template>

<style scoped>
.account-details { display: grid; gap: 8px; max-width: 360px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.account-details div { display: flex; justify-content: space-between; }
.account-details dt { color: var(--muted); }
.account-details dd { margin: 0; font-weight: 600; }
</style>`

const notFoundVue = `<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found">
    <h1>Page not found</h1>
    <RouterLink to="/">Go home</RouterLink>
  </section>
</template>`

const sharedFiles = {
  'main.js': mainJs,
  'App.vue': appVue,
  'api.js': apiJs,
  'components/PasswordField.vue': passwordFieldVue,
  'views/HomeView.vue': homeVue,
  'views/DashboardView.vue': dashboardVue,
  'views/AccountView.vue': accountVue,
  'views/NotFoundView.vue': notFoundVue,
  'styles.css': stylesCss,
}

// ---------------------------------------------------------------- interview coding question

const redirectStarter = `// Return value if it is a safe in-app path, otherwise fallback.
export function safeRedirect(value, fallback = '/') {
  return value || fallback
}
`

const redirectSolution = `// Return value if it is a safe in-app path, otherwise fallback.
export function safeRedirect(value, fallback = '/') {
  if (typeof value !== 'string' || value.length > 2000) return fallback
  // Must be a path on this site: one leading slash, not two (protocol-relative URL),
  // and not a backslash that some browsers treat like a slash.
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\\\')) return fallback
  // No control characters (e.g. tabs or newlines that browsers may strip).
  for (const char of value) {
    if (char.charCodeAt(0) < 32) return fallback
  }
  return value
}
`

const redirectApp = `<script setup>
import { safeRedirect } from './redirect.js'
const examples = ['/account', 'https://evil.example', '//evil.example']
</script>

<template>
  <ul>
    <li v-for="e in examples" :key="e">{{ e }} → {{ safeRedirect(e) }}</li>
  </ul>
</template>`

const loginAsAda = `const router = requireModule('router.js').default
await router.push('/login')
await flush()
await type('.input-email', 'ada@example.com')
await type('#login-password', 'correct horse battery staple')
await submit('.login-form')
await wait(250)`

export default {
  id: 'project-auth-ui',
  kind: 'project',
  title: 'Project 7: Authentication UI',
  summary: 'Build sign-in, sign-up and protected pages against a simulated auth API — with auth state, route guards, safe redirects, session restore and expiry — and learn exactly what the frontend can and cannot secure.',
  difficulty: 'advanced',
  minutes: 150,
  prerequisites: ['navigation-guards', 'pinia-basics', 'form-validation', 'advanced-forms', 'auth-security'],
  related: ['project-admin-dashboard', 'accessible-reusable-inputs', 'xss-safe-rendering', 'secrets-csp-dependencies', 'pinia-async-patterns', 'error-handling'],
  tags: ['project', 'authentication', 'login', 'register', 'route guards', 'session', 'cookies', 'open redirect', 'security', 'forms', 'pinia'],
  apis: [
    { name: 'router.beforeEach(async (to) => …)', summary: 'Vue Router: a global guard can be async — here it awaits the session check before deciding.' },
    { name: 'meta.requiresAuth / meta.guestOnly', summary: 'Custom route meta flags read by the guard.' },
    { name: 'autocomplete="current-password" / "new-password"', summary: 'HTML: tells password managers to fill or generate the right credential.' },
    { name: 'defineModel()', summary: 'Vue 3.4+: gives the reusable PasswordField a v-model.' },
  ],
  docs: [
    { label: 'Vue Router — Navigation Guards', url: 'https://router.vuejs.org/guide/advanced/navigation-guards.html' },
    { label: 'Vue Router — Route Meta Fields', url: 'https://router.vuejs.org/guide/advanced/meta.html' },
    { label: 'Vue Guide — Security', url: 'https://vuejs.org/guide/best-practices/security.html' },
    { label: 'Pinia — Using a store outside of a component', url: 'https://pinia.vuejs.org/core-concepts/outside-component-usage.html' },
    { label: 'OWASP — Authentication Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html' },
    { label: 'MDN — Using HTTP cookies (HttpOnly, Secure, SameSite)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies' },
  ],

  intro: `
Almost every product needs accounts. In this project you build the whole client side of authentication for *Acme projects*:

- a **sign-in** form and a **sign-up** form with validation, helpful errors and password-manager support,
- an **auth store** that knows who is signed in, restores the session after a reload and handles expiry,
- **route guards** that send signed-out users to sign in — and back to where they were going afterwards,
- **sign-out**, and pages only signed-in users can open.

The server is simulated in \`api.js\`, but it behaves like a well-designed real one: it uses a session **cookie** your JavaScript never touches, returns generic errors, rate-limits repeated failures and can end your session at any time.

The most important lesson is a boundary: **everything in the browser is UX. The server must authenticate and authorize every request.**
`,

  why: `
Authentication UIs are where good intentions create real vulnerabilities:

- "We hide the admin page, so it's protected" — but anyone can call the API without your UI.
- "We keep the token in \`localStorage\`" — then any script injected into your page (XSS) can read it.
- "Wrong password for ada@example.com" — now attackers can test which emails have accounts.
- "After login, go to \`?redirect=\`" — and an attacker sends a link that bounces your users to a phishing site.
- "The user is in the store, so they're signed in" — even though the server ended the session an hour ago.

This project builds the UI the careful way and explains *why* at each step. You will also see the honest limits: the guards you write are about user experience; real protection lives on the server, in HTTP headers, and in keeping your app free of XSS.
`,

  eli15: `
Think of a music festival. At the entrance, you show your ticket once and get a **wristband**. After that, every stage checks your wristband — you don't show your ticket again.

- Signing in = showing your ticket at the entrance.
- The **session cookie** = the wristband. The browser wears it for you and shows it with every request; your JavaScript can't even take it off (that's what *HttpOnly* means), so a pickpocket script can't steal it.
- The **route guard** = a friendly steward who says "the backstage area is that way, but you need a wristband first — come back after the entrance". Helpful, but the steward isn't the real security.
- The **server** = the security guard at each stage who actually checks the wristband every single time.

If your wristband expires, the next stage turns you away, and the app politely sends you back to the entrance — and then right back to the stage you wanted.
`,

  analogy: {
    title: 'The festival wristband',
    body: `
The ticket desk checks who you are once and gives you a wristband. Stages check the wristband, not your ID. Stewards point you in the right direction, but guards at each stage do the real checking. A wristband can be cut off at any moment — then you go back to the desk.
`,
    mapping: [
      ['showing your ticket at the desk', '`api.login()` with email + password'],
      ['the wristband you cannot take off', 'an HttpOnly session cookie set by the server'],
      ['"do I have a wristband?" when you arrive', '`auth.init()` calling `GET /api/me`'],
      ['the friendly steward', 'the router `beforeEach` guard (UX)'],
      ['the guard at every stage', 'server-side checks on every API request (security)'],
      ['a cut-off wristband', 'a 401 from the server → `markExpired()` → sign in again'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Who checks what',
    caption: 'The browser decides what to SHOW; the server decides what is ALLOWED. The session lives in a cookie the app never reads.',
    alt: 'Diagram: the sign-in form sends credentials to the auth store, which calls the fake API. The server checks the password, sets an HttpOnly session cookie and returns the public user. On startup the store calls GET /me to restore the session. The router guard awaits that check, then sends signed-out users from protected pages to login with a redirect query (validated by safeRedirect) and signed-in users away from guest-only pages. Protected pages call the API with the cookie; a 401 response marks the session expired and sends the user back to sign in.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'form', label: 'Sign-in form', note: 'validate · no double submit · generic errors', tone: 'paper' },
        { id: 'store', label: 'auth store', note: 'user · init() via /me · markExpired()', tone: 'acid' },
        { id: 'server', label: 'Server (api.js)', note: 'checks password · HttpOnly cookie · 401/429', tone: 'red' },
        { id: 'guard', label: 'Router guard', note: 'await init · requiresAuth · guestOnly', tone: 'cobalt' },
        { id: 'redirect', label: 'safeRedirect()', note: 'in-app paths only', tone: 'kraft' },
        { id: 'pages', label: 'Protected pages', note: 'API calls carry the cookie', tone: 'paper' },
      ],
      edges: [
        { from: 'form', to: 'store', label: 'login()' },
        { from: 'store', to: 'server', label: 'POST /login · GET /me' },
        { from: 'guard', to: 'store', label: 'await init()' },
        { from: 'guard', to: 'redirect', label: '?redirect=' },
        { from: 'pages', to: 'server', label: 'requests + cookie' },
        { from: 'server', to: 'pages', id: 'server-401', label: '401 → sign in again', dashed: true },
      ],
      steps: [
        { focus: ['form', 'store', 'server'], edges: ['form->store', 'store->server'], text: 'The form validates locally, then the store calls `login()`. The server checks the password, sets a session cookie (HttpOnly: JavaScript cannot read it) and returns only the public user.' },
        { focus: ['guard', 'store'], edges: ['guard->store'], text: 'On every navigation the guard first awaits `auth.init()` — a one-time `GET /me` that restores the session after a reload. Then it applies `requiresAuth` / `guestOnly`.' },
        { focus: ['guard', 'redirect'], edges: ['guard->redirect'], text: 'Signed-out users go to `/login?redirect=/where-they-were`. After sign-in, `safeRedirect()` only accepts in-app paths — never a link to another site.' },
        { focus: ['pages', 'server'], edges: ['pages->server', 'server-401'], text: 'Protected pages call the API; the browser attaches the cookie. The server authorizes every request. A 401 means the session is gone: clear the user and send them to sign in.' },
      ],
    },
  },

  requirements: [
    '`main.js` installs Pinia then the router. Routes: `/` (home), `/login` and `/register` (`meta.guestOnly`), `/dashboard` and `/account` (`meta.requiresAuth`), and a catch-all 404.',
    'A global `beforeEach` guard awaits `auth.init()` (a one-time session check via `api.me()`), redirects signed-out users from protected pages to `login` with `?redirect=<to.fullPath>`, and redirects signed-in users away from guest-only pages.',
    'After signing in or up, go to `safeRedirect(route.query.redirect)` from `security.js`: only in-app paths (one leading `/`, not `//` or `/\\`, not back to `/login` or `/register`); anything else falls back to `/dashboard`.',
    'Sign-in form `.login-form`: `.input-email` (`type="email"`), `#login-password` (`autocomplete="current-password"`). Invalid fields show `.field-error` **without** calling the server. Server errors show in `.form-error` (`role="alert"`) — the same generic message for unknown emails and wrong passwords. While submitting, `.login-submit` is disabled and repeat submits are ignored.',
    'Sign-up form `.register-form`: `.input-name`, `.input-email`, `#register-password` (`autocomplete="new-password"`, at least 12 characters, not the email). Success signs the user in.',
    'The auth store (`stores/auth.js`, `useAuthStore`) keeps only the public user — **no passwords or tokens in `localStorage`**. The session is restored from the server, not from storage.',
    'The header shows `.user-name` and a `.logout` button when signed in. Signing out calls the API, clears the user and shows "You have signed out." in `.notice` on the login page.',
    'When a protected request returns 401 (`.simulate-expiry` then `.refresh-dashboard`), the user is sent to login with `?redirect=` back and `.notice` says the session expired. Repeated failures show the server\'s rate-limit message.',
  ],

  objectives: [
    'Explain the split of responsibilities: the browser shows, the server authenticates and authorizes.',
    'Model auth state in a store, restore sessions by asking the server, and handle expiry (401) centrally.',
    'Write async route guards with `requiresAuth` / `guestOnly` meta and a validated `?redirect=`.',
    'Build accessible, password-manager-friendly forms with validation, double-submit protection and enumeration-safe errors.',
    'Compare token storage options (HttpOnly cookies, memory, localStorage) and their XSS / CSRF trade-offs.',
  ],

  playground: {
    title: 'Acme sign-in — starter',
    objective: 'The fake server, pages and password field exist. Restore sessions from the server, add the guards, validate the forms, make redirects safe and handle sign-out and expiry.',
    files: {
      ...sharedFiles,
      'router.js': starterRouterJs,
      'security.js': starterSecurityJs,
      'stores/auth.js': starterAuthStoreJs,
      'components/AppHeader.vue': starterHeaderVue,
      'views/LoginView.vue': starterLoginVue,
      'views/RegisterView.vue': starterRegisterVue,
    },
    expected: 'In the starter anyone can open the dashboard, the login form calls the server even when empty, any `?redirect=` is followed, the "signed-in user" is read from localStorage, and sign-out does nothing. Demo account: **ada@example.com** / **correct horse battery staple**.',
    tests: [
      {
        name: 'signed-out users are sent to sign in, remembering where they were going',
        code: `const router = requireModule('router.js').default
await router.push('/account')
await flush()
expect(router.currentRoute.value.name).toBe('login')
expect(router.currentRoute.value.query.redirect).toBe('/account')
expect(exists('.login-form')).toBe(true)`,
      },
      {
        name: 'invalid fields are reported without calling the server',
        code: `const api = requireModule('api.js')
await requireModule('router.js').default.push('/login')
await flush()
await type('.input-email', 'not-an-email')
await submit('.login-form')
await wait(50)
expect(findAll('.field-error')).toHaveLength(2)
expect(attr('.input-email', 'aria-invalid')).toBe('true')
expect(api.stats.login).toBe(0)`,
      },
      {
        name: 'wrong password and unknown email get the same generic error',
        code: `await requireModule('router.js').default.push('/login')
await flush()
await type('.input-email', 'ada@example.com')
await type('#login-password', 'wrong password')
await submit('.login-form')
await wait(250)
expect(text('.form-error')).toBe('Email or password is incorrect.')
expect(find('#login-password').value).toBe('')
await type('.input-email', 'nobody@example.com')
await type('#login-password', 'whatever')
await submit('.login-form')
await wait(250)
expect(text('.form-error')).toBe('Email or password is incorrect.')`,
      },
      {
        name: 'the submit button is disabled while signing in; double submits are ignored',
        code: `const api = requireModule('api.js')
await requireModule('router.js').default.push('/login')
await flush()
await type('.input-email', 'ada@example.com')
await type('#login-password', 'correct horse battery staple')
await submit('.login-form')
expect(find('.login-submit').disabled).toBe(true)
expect(text('.login-submit')).toBe('Signing in…')
await submit('.login-form')
await wait(250)
expect(api.stats.login).toBe(1)`,
      },
      {
        name: 'signing in returns you to the page you asked for',
        code: `const router = requireModule('router.js').default
await router.push('/account')
await flush()
await type('.input-email', 'ada@example.com')
await type('#login-password', 'correct horse battery staple')
await submit('.login-form')
await wait(250)
expect(router.currentRoute.value.fullPath).toBe('/account')
expect(text('.user-name')).toBe('Ada Lovelace')
expect(exists('.logout')).toBe(true)`,
      },
      {
        name: 'a redirect to another site is ignored',
        code: `const router = requireModule('router.js').default
await router.push('/login?redirect=https://evil.example/phish')
await flush()
await type('.input-email', 'ada@example.com')
await type('#login-password', 'correct horse battery staple')
await submit('.login-form')
await wait(250)
expect(router.currentRoute.value.fullPath).toBe('/dashboard')`,
      },
      {
        name: 'safeRedirect() only accepts in-app paths',
        code: `const { safeRedirect } = requireModule('security.js')
expect(safeRedirect('/account?tab=billing')).toBe('/account?tab=billing')
expect(safeRedirect('https://evil.example')).toBe('/dashboard')
expect(safeRedirect('//evil.example')).toBe('/dashboard')
expect(safeRedirect('/\\\\evil.example')).toBe('/dashboard')
expect(safeRedirect('/login')).toBe('/dashboard')
expect(safeRedirect(undefined)).toBe('/dashboard')
expect(safeRedirect(['/account'])).toBe('/dashboard')`,
      },
      {
        name: 'signed-in users skip the guest-only pages',
        code: `${loginAsAda}
await router.push('/login')
await flush()
expect(router.currentRoute.value.name).toBe('dashboard')`,
      },
      {
        name: 'signing out ends the session and protects pages again',
        code: `${loginAsAda}
await click('.logout')
await wait(250)
expect(router.currentRoute.value.name).toBe('login')
expect(text('.notice')).toBe('You have signed out.')
expect(exists('.user-name')).toBe(false)
await router.push('/dashboard')
await flush()
expect(router.currentRoute.value.name).toBe('login')`,
      },
      {
        name: 'the session is restored from the server, not from localStorage',
        code: `${loginAsAda}
expect(localStorage.length).toBe(0)
// Simulate a reload: a brand-new Pinia means a brand-new auth store.
const { createPinia, setActivePinia } = requireModule('pinia')
setActivePinia(createPinia())
const auth = requireModule('stores/auth.js').useAuthStore()
expect(auth.user).toBeNull()
await auth.init()
expect(auth.user && auth.user.name).toBe('Ada Lovelace')`,
      },
      {
        name: 'a 401 from the server sends you back to sign in',
        code: `${loginAsAda}
await wait(200)
expect(text('.welcome')).toContain('Ada Lovelace')
await click('.simulate-expiry')
await click('.refresh-dashboard')
await wait(250)
expect(router.currentRoute.value.name).toBe('login')
expect(router.currentRoute.value.query.redirect).toBe('/dashboard')
expect(text('.notice')).toContain('expired')`,
      },
      {
        name: 'repeated failures show the rate-limit message',
        code: `await requireModule('router.js').default.push('/login')
await flush()
for (let i = 0; i < 6; i++) {
  await type('.input-email', 'ada@example.com')
  await type('#login-password', 'guess ' + i)
  await submit('.login-form')
  await wait(180)
}
expect(text('.form-error')).toContain('Too many attempts')`,
      },
      {
        name: 'sign-up validates the password, then signs you in',
        code: `const router = requireModule('router.js').default
await router.push('/register')
await flush()
await type('.input-name', 'Grace Hopper')
await type('.input-email', 'grace@example.com')
await type('#register-password', 'short')
await submit('.register-form')
await wait(50)
expect(text('#register-password-error')).toContain('12 characters')
expect(attr('#register-password', 'aria-invalid')).toBe('true')
expect(requireModule('api.js').stats.register).toBe(0)
expect(attr('#register-password', 'autocomplete')).toBe('new-password')
await type('#register-password', 'compiler debugging moth')
await submit('.register-form')
await wait(250)
expect(router.currentRoute.value.name).toBe('dashboard')
expect(text('.user-name')).toBe('Grace Hopper')`,
      },
    ],
  },

  steps: [
    {
      title: 'Start with the threat model: what can the browser actually protect?',
      body: [
        `
Before writing a form, be clear about who does what. Everything you ship to the browser — HTML, JavaScript, store state, route guards — is **visible and changeable** by the person using it. So:

| Concern | Browser (this project) | Server (always required) |
|---|---|---|
| Who are you? (authentication) | collects credentials, shows state | verifies the password, issues the session |
| May you do this? (authorization) | hides links, guards routes (UX) | checks every request |
| Where is the session kept? | doesn't read it (HttpOnly cookie) | sets and validates it |
| Brute force | shows the message | rate-limits |
| Input | friendly validation | real validation |

A route guard is like a "staff only" sign: it stops honest people from wandering in. It does not stop anyone who ignores signs — they can call your API directly. Keep that table in mind; every step below follows it ([auth & security](lesson:auth-security)).
`,
        {
          callout: 'warn',
          title: 'The rule for this whole project',
          text: 'Frontend checks never replace backend authorization. Guards and hidden buttons are UX. The server must authenticate and authorize every API request.',
        },
      ],
    },
    {
      title: 'Read the fake server — and the real requests it stands for',
      body: [
        `
\`api.js\` exposes \`login\`, \`register\`, \`me\`, \`logout\`, \`getDashboard\` and a demo-only \`expireSession\`. It is **simplified** (it even stores the demo password in plain text, which a real server must never do), but its *behaviour* is what a good auth API does:

- On success it "sets a cookie" and returns only public fields — never the password, never a token for your code to store.
- It returns **the same message** for an unknown email and a wrong password.
- It answers **429** after repeated failures for an account.
- \`me()\` answers "who owns this session?" or **401**.

In a real app the same calls would look like this:
`,
        {
          code: `// The browser stores and sends the session cookie automatically.
// credentials: 'include' is needed when the API is on another origin.
export async function login({ email, password }) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new ApiError(response.status, await readMessage(response))
  return response.json() // { user } — the cookie came in a Set-Cookie header
}

// Server response header (set by the backend, invisible to page JavaScript):
// Set-Cookie: session=…; HttpOnly; Secure; SameSite=Lax; Path=/`,
          lang: 'js',
          title: 'api.js — the real-world version',
          static: true,
        },
        `
**HttpOnly** means page JavaScript cannot read the cookie, so an XSS bug cannot steal the session directly. **Secure** means HTTPS only. **SameSite** limits when the browser sends it with cross-site requests, which helps against CSRF (cross-site request forgery). Cookie-based sessions still need CSRF defences on state-changing requests where SameSite is not enough — that is server work ([secrets, CSP & dependencies](lesson:secrets-csp-dependencies)).
`,
      ],
    },
    {
      title: 'The auth store: ask the server, once',
      body: [
        `
Auth state is needed by the guard, the header and several pages, so it lives in a Pinia store. It holds the **public user** and a status — nothing secret.

The starter "remembers" the user in \`localStorage\`. That is a trap: storage says *someone was signed in on this device*, not that the session is still valid. The server may have expired or revoked it. The source of truth is the server, so restore by asking it:
`,
        {
          code: `const user = ref(null)
const status = ref('idle') // 'idle' | 'checking' | 'ready'
let initPromise = null

function init() {
  if (!initPromise) {
    status.value = 'checking'
    initPromise = api
      .me()
      .then((me) => { user.value = me })
      .catch(() => { user.value = null }) // 401: no valid session
      .finally(() => { status.value = 'ready' })
  }
  return initPromise
}`,
          lang: 'js',
          title: 'stores/auth.js',
        },
        `
\`init()\` caches its promise, so it runs **once** no matter how many navigations call it, and every caller can \`await\` the same result. \`App.vue\` shows "Checking your session…" while \`status === 'checking'\`.

Then \`login\` / \`register\` set \`user\` from the server's answer, and nothing is written to storage.
`,
        {
          callout: 'note',
          title: 'What about JWTs in localStorage?',
          text: 'Some APIs return a token (often a JWT) that the client must send in an Authorization header. If you must, prefer keeping it in memory and using a refresh flow backed by an HttpOnly cookie. Anything in localStorage is readable by any script running on your page, so one XSS bug exposes every user\'s token. Whatever you choose, the server must validate the token on every request.',
        },
      ],
    },
    {
      title: 'Guards with meta: requiresAuth and guestOnly',
      body: [
        `
Mark routes with meta and decide in one global, **async** guard ([navigation guards](lesson:navigation-guards)):
`,
        {
          code: `{ path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
{ path: '/dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init() // the first navigation waits for the session check

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.isAuthenticated) {
    return safeRedirect(to.query.redirect)
  }
})`,
          lang: 'js',
          title: 'router.js',
        },
        `
Three details:

- **\`await auth.init()\`** — without it, the very first navigation after a reload would run before the session check finishes, and a signed-in user would be bounced to the login page.
- **\`redirect: to.fullPath\`** — keep the full path including its query, so \`/account?tab=billing\` comes back intact.
- **Return values, not \`next()\`** — Vue Router 4+ guards return \`undefined\`/\`true\` (allow), a location (redirect) or \`false\` (cancel).

Using the store inside a guard works because Pinia was installed before the router (see \`main.js\`) and the guard runs during navigation, not at import time.
`,
      ],
    },
    {
      title: 'Make the redirect safe',
      body: [
        `
\`?redirect=\` comes from the URL — anyone can craft it. If you follow it blindly, an attacker can send your users a genuine-looking link like \`https://acme.example/login?redirect=https://acme-login.evil.example\`: they sign in on *your* site and are then bounced to a phishing copy. That is an **open redirect**.

Only accept paths inside your app:
`,
        {
          code: `export function safeRedirect(value, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/')) return fallback
  if (value.startsWith('//') || value.startsWith('/\\\\')) return fallback
  if (value.startsWith('/login') || value.startsWith('/register')) return fallback // no loops
  return value
}`,
          lang: 'js',
          title: 'security.js',
        },
        `
- \`https://…\` fails "starts with /".
- \`//evil.example\` is a **protocol-relative URL** — it means "same protocol, *other host*", so it is rejected too.
- \`/\\evil.example\` is rejected because some browsers normalise a backslash to a slash.
- Non-strings (a repeated \`?redirect=a&redirect=b\` gives an array) fall back.

Use it after sign-in (\`router.replace(safeRedirect(route.query.redirect))\`) and in the \`guestOnly\` branch of the guard. \`replace\` keeps the login page out of the history, so Back doesn't return to a form you've already submitted.
`,
      ],
    },
    {
      title: 'A sign-in form people (and password managers) can use',
      body: [
        `
The form validates locally for speed and kindness, guards against double submits, and shows server errors without revealing who has an account ([advanced forms](lesson:advanced-forms)):
`,
        {
          code: `const errors = computed(() => {
  const result = {}
  if (!isValidEmail(form.email)) result.email = 'Enter a valid email address.'
  if (!form.password) result.password = 'Enter your password.'
  return result
})
const visibleErrors = computed(() => (attempted.value ? errors.value : {}))

async function submit() {
  if (submitting.value) return // Enter pressed twice, impatient clicks…
  attempted.value = true
  serverError.value = ''
  if (Object.keys(errors.value).length > 0) return

  submitting.value = true
  try {
    await auth.login({ email: form.email.trim(), password: form.password })
    await router.replace(safeRedirect(route.query.redirect))
  } catch (error) {
    serverError.value = error.status === 401 || error.status === 429 ? error.message : 'Something went wrong. Please try again.'
    form.password = ''
  } finally {
    submitting.value = false
  }
}`,
          lang: 'js',
          title: 'views/LoginView.vue',
        },
        `
In the template:

- \`type="email"\` and \`autocomplete="username"\` on the email field, \`autocomplete="current-password"\` on the password — password managers rely on these hints to fill the right credentials.
- The submit button is \`:disabled="submitting"\` and says "Signing in…"; the form has \`aria-busy\`.
- Field errors are linked with \`aria-describedby\` and flagged with \`aria-invalid\`; the server error uses \`role="alert"\`.

\`PasswordField.vue\` (provided) adds a **Show/Hide** toggle — a real \`<button type="button">\` with \`aria-pressed\` and \`aria-controls\`. Letting people check what they typed reduces mistakes, especially on phones.
`,
        {
          callout: 'tip',
          title: 'Never log credentials',
          text: 'No `console.log(form)`, no sending form contents to analytics or error trackers. Logs are copied, retained and read by many people.',
        },
      ],
    },
    {
      title: 'Sign-up rules, sign-out and session expiry',
      body: [
        `
**Sign-up** uses the same pattern with \`autocomplete="new-password"\` (so password managers offer to generate one). The rules favour length over symbol requirements — current NIST guidance (SP 800-63B) recommends length and checking against known-breached passwords rather than composition rules:
`,
        {
          code: `if (form.password.length < 12) result.password = 'Use at least 12 characters.'
else if (form.password.trim().toLowerCase() === form.email.trim().toLowerCase()) result.password = 'Don\\'t use your email as your password.'`,
          lang: 'js',
          title: 'views/RegisterView.vue',
        },
        `
The 12-character minimum is this demo's choice; the server enforces its own rules either way.

**Sign-out** must end the session *on the server* — clearing local state alone leaves a valid cookie behind:
`,
        {
          code: `async function logout() {
  try {
    await api.logout()
  } finally {
    user.value = null
    notice.value = 'signed-out'
  }
}`,
          lang: 'js',
          title: 'stores/auth.js',
        },
        `
The header's \`signOut()\` awaits \`auth.logout()\` and then \`router.replace({ name: 'login' })\`, where the notice "You have signed out." appears.

**Expiry.** Sessions end for many reasons the client can't see: timeouts, password changes, "sign out everywhere". The first sign is a **401** from a protected request. Believe the server, clear the user and send them to sign in — with a way back:
`,
        {
          code: `} catch (err) {
  if (err.status === 401) {
    auth.markExpired() // user = null, notice = 'expired'
    await router.replace({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  error.value = 'Could not load your projects.'
}`,
          lang: 'js',
          title: 'views/DashboardView.vue',
        },
        `
In a larger app this 401 handling belongs in one place — the API client layer — instead of every page ([error handling](lesson:error-handling)).

Run the tests. Then try the flows by hand: open \`/account\` signed out, sign in, use **End my session on the server** and press Refresh, and type a few wrong passwords to see the rate-limit message.
`,
      ],
    },
  ],

  solution: {
    files: {
      ...sharedFiles,
      'router.js': routerJs,
      'security.js': securityJs,
      'stores/auth.js': authStoreJs,
      'components/AppHeader.vue': headerVue,
      'views/LoginView.vue': loginVue,
      'views/RegisterView.vue': registerVue,
    },
    explanation: `
**The server is the source of truth.** The auth store keeps only the public user. It restores the session by asking \`GET /me\` once (a cached promise every navigation can await), signs out by calling the server, and treats any 401 as "your session is gone".

**Guards are UX.** One async \`beforeEach\` waits for the session check, sends signed-out users to \`/login?redirect=…\` and signed-in users away from guest pages. Hidden links and guards make the app pleasant; the fake server's 401s show where real enforcement lives.

**Redirects are validated.** \`safeRedirect\` only accepts in-app paths, closing the open-redirect hole, and also prevents loops back to the auth pages.

**Forms are careful.** Local validation before any request, generic server errors that don't reveal which emails exist, double-submit protection, wrong passwords cleared, correct \`autocomplete\` hints, a show/hide toggle, and accessible error wiring.

**No secrets in the browser.** No passwords or tokens in \`localStorage\`, nothing sensitive logged; the session lives in a cookie the page cannot read.

**Simplified:** the fake server keeps plain-text passwords and uses \`sessionStorage\` as a stand-in cookie jar — both only to make the demo work. A production backend hashes passwords with a slow algorithm, sets HttpOnly/Secure/SameSite cookies, defends against CSRF, rate-limits per account and IP, and logs security events. Many teams use a proven identity provider (OAuth 2.0 / OpenID Connect) instead of building this themselves.
`,
  },

  challenges: [
    'Move the 401 handling out of `DashboardView` into a small `http.js` wrapper that every API call goes through.',
    'Add a "Forgot password?" flow that always answers "If an account exists, we\'ve emailed a link" (no account enumeration).',
    'Lazy-load the dashboard and account pages, and confirm (in the network log of a real project) that signed-out users never download them.',
    'Add a session-expiry warning: when the server says the session ends soon, show a dialog offering to stay signed in.',
    'Add two-factor sign-in: after the password, a second form asks for a 6-digit code (`autocomplete="one-time-code"`, `inputmode="numeric"`).',
    'Sync sign-out across tabs with `BroadcastChannel` so every open tab returns to the login page.',
  ],

  mistakes: [
    {
      title: 'Treating the route guard as security',
      wrong: { lang: 'js', code: `// "Only signed-in users can see projects" — enforced only here:\nrouter.beforeEach((to) => {\n  if (to.meta.requiresAuth && !auth.user) return '/login'\n})` },
      right: { lang: 'js', code: `// Server (pseudocode): every protected endpoint checks the session\napp.get('/api/projects', requireSession, (req, res) => { … })`, static: true },
      explanation: 'Anyone can skip your UI and call the API directly, or edit the store in devtools. Guards decide what the browser shows; the server must check every request.',
    },
    {
      title: 'Storing tokens (or the "signed-in" flag) in localStorage',
      wrong: { lang: 'js', code: `localStorage.setItem('token', result.token)\nconst user = ref(JSON.parse(localStorage.getItem('user')))`, static: true },
      right: { lang: 'js', code: `// Session in an HttpOnly cookie set by the server; restore by asking it:\nawait auth.init() // GET /api/me`, static: true },
      explanation: 'Any script on the page — including injected XSS — can read localStorage. And a stored user says nothing about whether the session is still valid. Prefer HttpOnly cookies and ask the server.',
    },
    {
      title: 'Following ?redirect= blindly',
      wrong: { lang: 'js', code: `router.push(route.query.redirect || '/dashboard')\n// or worse: window.location.href = route.query.redirect`, static: true },
      right: { lang: 'js', code: `router.replace(safeRedirect(route.query.redirect))` },
      explanation: 'A crafted link can send users who just signed in on your real site to a lookalike phishing site. Accept only in-app paths.',
    },
    {
      title: 'Revealing which accounts exist',
      wrong: { lang: 'js', code: `if (!user) throw new ApiError(404, 'No account for ada@example.com')\nif (wrongPassword) throw new ApiError(401, 'Wrong password')`, static: true },
      right: { lang: 'js', code: `throw new ApiError(401, 'Email or password is incorrect.') // same for both`, static: true },
      explanation: 'Different messages (or noticeably different response times) let attackers build a list of valid accounts to target. Use one generic message.',
    },
    {
      title: 'Not awaiting the session check in the guard',
      wrong: { lang: 'js', code: `router.beforeEach((to) => {\n  auth.init() // not awaited\n  if (to.meta.requiresAuth && !auth.user) return { name: 'login' } // user is still null!\n})` },
      right: { lang: 'js', code: `router.beforeEach(async (to) => {\n  await auth.init()\n  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }\n})` },
      explanation: 'On a reload, the first navigation runs before `/me` answers, so a signed-in user is bounced to the login page. Await the (cached) session check.',
    },
  ],

  debugging: [
    {
      symptom: 'After a reload, signed-in users briefly land on the login page.',
      cause: 'The guard decides before the session check (`/me`) has finished.',
      fix: 'Make the guard async and `await auth.init()`; cache the promise so it only runs once.',
    },
    {
      symptom: 'The header still shows the user after the server session expired.',
      cause: 'Auth state was hydrated from localStorage and 401 responses are ignored.',
      fix: 'Restore from the server, and on any 401 call `markExpired()` and send the user to sign in.',
    },
    {
      symptom: '"Detected an infinite redirection" between /login and /dashboard.',
      cause: 'The guestOnly branch redirects to a protected page while requiresAuth redirects back, usually because auth state is inconsistent (e.g. checked before init).',
      fix: 'Await init before both checks, and make sure `safeRedirect` never returns an auth page.',
    },
    {
      symptom: 'Password managers don\'t offer to save or fill credentials.',
      cause: 'Missing or wrong `autocomplete` tokens, or fields without proper labels/names.',
      fix: 'Use `autocomplete="username"` / `"current-password"` on sign-in and `"new-password"` on sign-up, with real `<label>`s.',
    },
  ],

  quiz: [
    {
      id: 'project-auth-ui-q1',
      type: 'mcq',
      prompt: 'Your router guard blocks signed-out users from `/dashboard`. Where must the check that protects the dashboard **data** happen?',
      options: [
        { text: 'In the router guard — it already runs on every navigation', why: 'Anyone can call the API without navigating at all. The guard only controls what the browser renders.' },
        { text: 'On the server, for every request to the dashboard API' },
        { text: 'In the Pinia store, by checking `isAuthenticated` before fetching', why: 'Store state can be edited in devtools, and the API can be called directly.' },
        { text: 'In the dashboard component with `v-if="user"`', why: 'Hiding markup does not protect the data the API returns.' },
      ],
      answer: 1,
      explanation: 'Frontend checks are UX. Only the server can decide who may read or change data, because it is the only part the user cannot modify.',
    },
    {
      id: 'project-auth-ui-q2',
      type: 'output',
      prompt: 'A signed-out user opens `/account?tab=billing`. With this guard, what is `route.query.redirect` on the login page?',
      code: {
        lang: 'js',
        code: `router.beforeEach(async (to) => {
  await auth.init()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})`,
      },
      options: ['/account', '/account?tab=billing', 'account', 'undefined'],
      answer: 1,
      explanation: '`to.fullPath` includes the query string (and hash), so the user comes back to exactly the view they asked for. `to.path` would drop `?tab=billing`.',
    },
    {
      id: 'project-auth-ui-q3',
      type: 'bug',
      prompt: 'A security review says this allows an open redirect. Click the line with the weakness.',
      code: {
        lang: 'js',
        code: `export function safeRedirect(value, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/')) return fallback
  return value
}

// usage after sign-in
router.replace(safeRedirect(route.query.redirect))`,
      },
      answerLine: 3,
      explanation: '`//evil.example` starts with "/" but is a protocol-relative URL pointing to another host. The check must also reject values starting with `//` (and `/\\`).',
    },
    {
      id: 'project-auth-ui-q4',
      type: 'fill',
      prompt: 'Fill in the autocomplete tokens so password managers fill the sign-in form and generate a password on the sign-up form.',
      code: { lang: 'vue', code: `<!-- sign in -->\n<input id="login-password" type="password" autocomplete="___" />\n\n<!-- sign up -->\n<input id="register-password" type="password" autocomplete="___" />` },
      answer: [['current-password'], ['new-password']],
      explanation: '`current-password` asks for the saved password; `new-password` tells managers this is a new credential (and to offer a generated one).',
    },
    {
      id: 'project-auth-ui-q5',
      type: 'short',
      prompt: 'Why does the sign-in form show "Email or password is incorrect." for both an unknown email and a wrong password?',
      answer: 'Different messages would let anyone discover which email addresses have accounts (account enumeration), which helps attackers target phishing, credential stuffing or password guessing. One generic message (and similar response times on the server) reveals nothing extra. Users only need to know the combination did not work.',
    },
  ],

  interview: [
    {
      id: 'project-auth-ui-guards-vs-backend',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What do route guards protect in your auth UI, and what do they not protect?',
      answer: 'They protect the user experience: signed-out users are sent to sign in instead of seeing a broken page, and come back afterwards; signed-in users skip the login page. They do not protect data or actions — the JavaScript, the store and the API are all reachable without the UI. The server must authenticate and authorize every request; a 401/403 from it is the real answer, and the UI just reacts to it.',
      explanation: 'Guards decide what to render; servers decide what is allowed.',
      whyAsked: 'The single most important security concept for frontend developers.',
      mistakes: ['Calling guards "security".', 'Suggesting obfuscation or hiding routes as protection.'],
      followUps: ['How does your UI react to a 403 from the API?', 'Would lazy-loading protected pages add security?'],
      modelAnswer: 'Route guards are UX. Mine awaits a session check and then sends signed-out users from protected pages to login with a redirect back, and keeps signed-in users away from guest pages. But everything in the browser can be modified or skipped — someone can call the API with curl or flip the store in devtools — so the guard protects nothing on its own. The server authenticates every request through the session cookie and authorizes the action, and the UI reacts to its 401 or 403. Lazy-loading protected pages reduces what is downloaded, but the code is still public, so it is not security either.',
    },
    {
      id: 'project-auth-ui-stale-session-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Users report: "The app says I\'m signed in, but every page shows errors until I sign out and in again." The store is initialised with `JSON.parse(localStorage.getItem(\'user\'))`. Diagnose and fix.',
      answer: 'The client trusts a stale copy of the user from storage, but the server session has expired or been revoked, so every API call returns 401 while the UI believes it is signed in. Fix: restore the session by asking the server (`GET /me`) at startup and await it in the guard; treat any 401 as session expiry (clear the user, redirect to sign in with a return path); stop storing auth state in localStorage.',
      explanation: 'Client state about authentication is a cache of the server\'s truth — and caches go stale.',
      whyAsked: 'A very common production bug that shows whether you understand where auth state lives.',
      mistakes: ['Adding an expiry timestamp to localStorage and calling it fixed.', 'Retrying requests in a loop.'],
      followUps: ['Where would you centralise 401 handling?', 'How would you handle a 401 that happens during a form submit?'],
      modelAnswer: 'The UI and the server disagree. The store was hydrated from localStorage, which only says someone signed in on this device at some point; the server has since ended the session, so every request gets a 401 that the app ignores. I would make the server the source of truth: on startup call /me once and have the guard await it, and handle 401 centrally in the API client by clearing the user and redirecting to login with the current path, so the user returns to where they were. Then I would remove auth data from localStorage entirely.',
    },
    {
      id: 'project-auth-ui-remember-me',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Product wants a "Keep me signed in" checkbox. How would you implement it, and what would you refuse to do?',
      answer: 'It is a server-side session policy: when checked, the server issues a longer-lived session (or a persistent cookie with a later expiry, possibly a rotating refresh token), otherwise a session cookie that ends when the browser closes. The client only sends the boolean. I would refuse to store the password (or a long-lived token) in localStorage. I would add a "signed-in devices" list with revoke, and require re-authentication for sensitive actions like changing the password.',
      explanation: 'Session lifetime is decided and enforced by the server.',
      whyAsked: 'Tests whether you can translate a product request into a secure design.',
      mistakes: ['Saving credentials to auto-login.', 'Implementing it purely with client-side timers.'],
      followUps: ['What is token rotation?', 'How do you sign a user out of all devices?'],
      modelAnswer: 'The checkbox just becomes a flag on the login request. The server then decides the session lifetime: without it, a session cookie that disappears when the browser closes; with it, a persistent cookie with a longer expiry, ideally backed by rotating refresh tokens it can revoke. Nothing secret is stored by my JavaScript, and I would never store the password to "auto-login". I would pair it with a device list where users can revoke sessions, and ask for the password again before sensitive actions.',
    },
    {
      id: 'project-auth-ui-token-storage',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 5,
      question: 'Compare keeping a session in an HttpOnly cookie, an access token in memory, and an access token in localStorage. What are the trade-offs?',
      answer: 'HttpOnly cookie: page JavaScript cannot read it, so XSS cannot exfiltrate it directly; the browser sends it automatically, which brings CSRF risk — mitigated by SameSite and CSRF tokens on state-changing requests; needs server/CORS configuration for cross-origin APIs. Token in memory: not readable from storage and gone on reload, so it usually pairs with a refresh flow (often an HttpOnly refresh cookie); XSS running while the page is open can still use it. localStorage: simplest and survives reloads, but any script on the page can read it, so a single XSS exposes the token until it expires. In every case, XSS is game over for actions in that session — the cookie only limits theft — so XSS prevention and short lifetimes matter regardless.',
      explanation: 'No option survives XSS fully; they differ in what an attacker can take away and what else you must defend (CSRF).',
      whyAsked: 'A classic senior frontend security question with no single "right" answer — interviewers want the trade-offs.',
      mistakes: ['Claiming HttpOnly cookies make XSS harmless.', 'Ignoring CSRF for cookies.', 'Claiming localStorage is "encrypted".'],
      followUps: ['How does SameSite=Lax help against CSRF?', 'What does a Content Security Policy add?'],
      modelAnswer: 'With an HttpOnly cookie the token is invisible to page JavaScript, so an XSS bug cannot copy it to an attacker\'s server, but because the browser attaches it automatically I need CSRF defences — SameSite cookies plus CSRF tokens for state-changing requests. Keeping an access token in memory avoids storage entirely but disappears on reload, so it normally sits behind a refresh endpoint that uses an HttpOnly cookie. localStorage is the simplest and survives reloads, but any script can read it, so one XSS leaks long-lived credentials. None of these makes XSS harmless — injected code can still act as the user while the page is open — so I would combine cookies with short lifetimes, CSP and careful rendering.',
    },
    {
      id: 'project-auth-ui-enumeration',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A security review says your sign-up and forgot-password pages allow account enumeration. What does that mean, and how do you fix it without ruining UX?',
      answer: 'Enumeration means an attacker can learn whether an email has an account — for example "this email is already registered" on sign-up or "no account found" on forgot-password, or different response times. Fixes: forgot-password always says "If an account exists, we\'ve emailed a link"; sign-up can accept the request and email the owner ("someone tried to sign up with your address — sign in instead?"); the server keeps response times similar and rate-limits. Keep messages friendly and point users to the next step.',
      explanation: 'Every distinguishable response is an oracle; make them indistinguishable and move the detail to the inbox the real owner controls.',
      whyAsked: 'Tests practical security judgement balanced with product needs.',
      mistakes: ['Only fixing the login message.', 'Forgetting timing differences.', 'Making errors so vague users are stuck.'],
      followUps: ['Is enumeration via the sign-up form always worth fixing?', 'How would rate limiting interact with this?'],
      modelAnswer: 'Account enumeration is any response that reveals whether an email is registered — different messages, status codes, or even response times. My login already uses one generic message. For forgot-password I would always respond "if an account exists, we have sent a link". Sign-up is harder because users expect feedback; a common approach is to accept the request and send an email to the address instead — either a confirmation link or "you already have an account, sign in here". The server should keep timings similar and rate-limit by account and IP. Some products accept the residual risk on sign-up; that is a conscious product and security decision, not an accident.',
    },
    {
      id: 'project-auth-ui-coding-safe-redirect',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `safeRedirect(value, fallback = \'/\')` in `redirect.js`. Return `value` only if it is a string path inside this app: it starts with exactly one `/` (not `//`), does not start with `/\\`, contains no control characters (code < 32, e.g. tab or newline), and is at most 2000 characters. Otherwise return `fallback`.',
      starter: { files: { 'App.vue': redirectApp, 'redirect.js': redirectStarter } },
      tests: [
        {
          name: 'keeps in-app paths, with query and hash',
          code: `const { safeRedirect } = requireModule('redirect.js')
expect(safeRedirect('/account')).toBe('/account')
expect(safeRedirect('/projects/3?tab=files#top')).toBe('/projects/3?tab=files#top')`,
        },
        {
          name: 'rejects other sites and tricks',
          code: `const { safeRedirect } = requireModule('redirect.js')
expect(safeRedirect('https://evil.example')).toBe('/')
expect(safeRedirect('//evil.example')).toBe('/')
expect(safeRedirect('/\\\\evil.example')).toBe('/')
expect(safeRedirect('/\\t/evil.example')).toBe('/')
expect(safeRedirect('javascript:alert(1)')).toBe('/')`,
        },
        {
          name: 'rejects non-strings and absurd lengths; honours the fallback',
          code: `const { safeRedirect } = requireModule('redirect.js')
expect(safeRedirect(undefined)).toBe('/')
expect(safeRedirect(['/account'])).toBe('/')
expect(safeRedirect('/' + 'a'.repeat(2500))).toBe('/')
expect(safeRedirect('https://evil.example', '/home')).toBe('/home')`,
        },
      ],
      hints: [
        'Check the type first: anything that is not a string returns the fallback.',
        'Then the shape: `startsWith(\'/\')`, but not `startsWith(\'//\')` or `startsWith(\'/\\\\\')`.',
        'Finally loop over the characters and reject any with `charCodeAt(0) < 32`, and check the length.',
      ],
      answer: 'Validate type, length and shape (single leading slash, no backslash trick), then scan for control characters; return the value only if every check passes.',
      solution: { files: { 'App.vue': redirectApp, 'redirect.js': redirectSolution } },
      explanation: 'An allow-list ("must look like an in-app path") is safer than trying to block every bad form. Control characters matter because browsers strip tabs and newlines from URLs, which can turn `/\\t/evil.example` into `//evil.example`.',
      whyAsked: 'Open redirects are a common real-world finding; this checks careful input validation.',
      mistakes: ['Only checking `startsWith(\'/\')`.', 'Using a regex that blocks `https:` but forgets protocol-relative URLs.', 'Navigating with `window.location` instead of the router.'],
      followUps: ['Would `new URL(value, location.origin)` and comparing origins be better?', 'Should the server also validate redirect targets?'],
      modelAnswer: 'I allow-list instead of block-list. Non-strings and overly long values fall back. The value must start with a single slash — two slashes is a protocol-relative URL to another host, and a slash-backslash can be normalised to that too. I also reject control characters because browsers strip tabs and newlines from URLs, which could reassemble a protocol-relative URL. Anything that passes is an in-app path, which I then hand to the router with replace. Parsing with new URL against the current origin and comparing origins is a good complementary check, and if the server performs redirects itself, it needs the same validation.',
    },
  ],

  takeaways: [
    'The browser shows; the server decides. Guards and hidden links are UX — every API request must be authenticated and authorized server-side.',
    'Keep auth state in a store, restore it by asking the server (`/me`, awaited once by the guard), and treat 401 as "session gone".',
    'Use `requiresAuth` / `guestOnly` meta with an async guard, keep `to.fullPath` in `?redirect=`, and validate it with an allow-list before following it.',
    'Prefer HttpOnly cookies over tokens in localStorage, store no passwords or tokens in the client, and never log credentials.',
    'Good auth forms validate locally, block double submits, use generic errors, and give password managers the right `autocomplete` hints.',
  ],
}
