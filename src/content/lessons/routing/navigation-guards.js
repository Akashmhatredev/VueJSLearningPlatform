// Lesson: Navigation guards & route meta

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'

createApp(App).use(router).mount('#app')`

const authJs = `import { ref } from 'vue'

// SIMPLIFIED fake auth: just a ref in memory. A real app asks the server
// who the user is — and the server re-checks permissions on every request.
export const user = ref(null) // null = signed out, otherwise { name, role }

export function login(role) {
  user.value = { name: role === 'admin' ? 'Ada' : 'Sam', role }
}

export function logout() {
  user.value = null
}`

const guardLogJs = `import { ref } from 'vue'

// A tiny shared log so you can SEE the guards run (newest at the bottom).
export const entries = ref([])

export function logGuard(text) {
  entries.value.push(text)
  if (entries.value.length > 8) entries.value.shift()
}`

const routerJs = `import { createRouter, createMemoryHistory } from 'vue-router'
import { user } from './auth.js'
import { logGuard } from './guardLog.js'
import HomePage from './HomePage.vue'
import LoginPage from './LoginPage.vue'
import AccountPage from './AccountPage.vue'
import AdminPage from './AdminPage.vue'
import EditorPage from './EditorPage.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage, meta: { title: 'Home' } },
    { path: '/login', name: 'login', component: LoginPage, meta: { title: 'Sign in' } },
    { path: '/account', name: 'account', component: AccountPage, meta: { title: 'Your account', requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminPage, meta: { title: 'Admin', requiresAuth: true } },
    { path: '/editor', name: 'editor', component: EditorPage, meta: { title: 'Write a post', requiresAuth: true } },
  ],
})

// Runs before every navigation. Returning nothing lets it continue.
router.beforeEach((to, from) => {
  logGuard(\`beforeEach  \${from.fullPath} → \${to.fullPath}\`)
  if (to.meta.requiresAuth && !user.value) {
    logGuard('  ↳ signed out: redirect to /login')
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

// Runs after every navigation — also failed ones (then failure is set).
router.afterEach((to, from, failure) => {
  if (failure) {
    logGuard(\`afterEach   ✗ \${failure.message}\`)
    return
  }
  logGuard(\`afterEach   arrived at \${to.fullPath}\`)
  document.title = \`\${to.meta.title} · Members\`
})

export default router`

const appVue = `<script setup>
import { useRouter } from 'vue-router'
import { user, logout } from './auth.js'
import { entries } from './guardLog.js'

const router = useRouter()

function signOut() {
  logout()
  router.push('/')
}
</script>

<template>
  <nav class="nav">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/account" class="to-account">Account</RouterLink>
    <RouterLink to="/admin" class="to-admin">Admin</RouterLink>
    <RouterLink to="/editor" class="to-editor">Editor</RouterLink>
  </nav>

  <p class="who">
    <template v-if="user">
      Signed in as <strong>{{ user.name }}</strong> ({{ user.role }})
      <button class="logout" @click="signOut">Log out</button>
    </template>
    <template v-else>Not signed in</template>
  </p>

  <main class="page">
    <RouterView />
  </main>

  <section class="log">
    <h3>Guard log</h3>
    <ol>
      <li v-for="(entry, i) in entries" :key="i">{{ entry }}</li>
    </ol>
  </section>
</template>

<style scoped>
.nav { display: flex; gap: 12px; margin-bottom: 8px; }
.nav a.router-link-exact-active { font-weight: bold; text-decoration: underline; }
.page { border: 2px solid #222; padding: 12px; margin: 8px 0; min-height: 90px; }
.log { font-family: monospace; font-size: 13px; background: #f4f1e8; padding: 8px; }
.log h3 { margin: 0 0 4px; font-size: 14px; }
</style>`

const homeVue = `<template>
  <h2>Home</h2>
  <p>Anyone can see this page. Try <strong>Account</strong> while signed out.</p>
</template>`

const loginVue = `<script setup>
import { useRoute, useRouter } from 'vue-router'
import { login } from './auth.js'

const route = useRoute()
const router = useRouter()

function signIn(role) {
  login(role)
  router.push('/account')
}
</script>

<template>
  <h2>Sign in</h2>
  <p v-if="route.query.redirect" class="notice">
    Please sign in to see <code>{{ route.query.redirect }}</code>.
  </p>
  <button class="login-member" @click="signIn('member')">Sign in as member</button>
  <button class="login-admin" @click="signIn('admin')">Sign in as admin</button>
</template>`

const accountVue = `<script setup>
import { user } from './auth.js'
</script>

<template>
  <h2>Your account</h2>
  <p>Welcome back, {{ user?.name }}.</p>
</template>`

const adminVue = `<template>
  <h2 class="admin-title">Admin panel</h2>
  <p>Only admins should see this page.</p>
</template>`

const editorVue = `<script setup>
import { ref, computed } from 'vue'

const saved = ref('')
const draft = ref('')
const dirty = computed(() => draft.value !== saved.value)

function save() {
  saved.value = draft.value
}
</script>

<template>
  <h2>Write a post</h2>
  <textarea v-model="draft" class="draft" placeholder="Start typing…"></textarea>
  <p class="status">{{ dirty ? 'Unsaved changes' : 'All changes saved' }}</p>
  <button class="save" @click="save">Save</button>
</template>`

const routerSolved = routerJs
  .replace(
    "meta: { title: 'Admin', requiresAuth: true }",
    "meta: { title: 'Admin', requiresAuth: true, roles: ['admin'] }",
  )
  .replace(
    "    return { name: 'login', query: { redirect: to.fullPath } }\n  }\n",
    "    return { name: 'login', query: { redirect: to.fullPath } }\n  }\n  if (to.meta.roles && !to.meta.roles.includes(user.value.role)) {\n    logGuard('  ↳ wrong role: back to home')\n    return { name: 'home' }\n  }\n",
  )

const loginSolved = loginVue.replace(
  "  router.push('/account')",
  "  const target = route.query.redirect\n  // only follow in-app paths like '/admin'\n  const safe = typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')\n  router.replace(safe ? target : '/account')",
)

const editorSolved = `<script setup>
import { ref, computed } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

const saved = ref('')
const draft = ref('')
const dirty = computed(() => draft.value !== saved.value)
const warned = ref(false)

function save() {
  saved.value = draft.value
  warned.value = false
}

onBeforeRouteLeave(() => {
  if (dirty.value) {
    warned.value = true
    return false
  }
})
</script>

<template>
  <h2>Write a post</h2>
  <textarea v-model="draft" class="draft" placeholder="Start typing…"></textarea>
  <p class="status">{{ dirty ? 'Unsaved changes' : 'All changes saved' }}</p>
  <p v-if="warned" class="leave-warning">Save your post before leaving this page.</p>
  <button class="save" @click="save">Save</button>
</template>`

const baseFiles = {
  'main.js': mainJs,
  'router.js': routerJs,
  'auth.js': authJs,
  'guardLog.js': guardLogJs,
  'App.vue': appVue,
  'HomePage.vue': homeVue,
  'LoginPage.vue': loginVue,
  'AccountPage.vue': accountVue,
  'AdminPage.vue': adminVue,
  'EditorPage.vue': editorVue,
}

// ---------- exercise 1: guest-only login + auth guard
const ex1Auth = `import { ref } from 'vue'

// Simplified: a real app would ask the server.
export const isLoggedIn = ref(false)

export function login() {
  isLoggedIn.value = true
}

export function logout() {
  isLoggedIn.value = false
}`

const ex1RouterStarter = `import { createRouter, createMemoryHistory } from 'vue-router'
import { isLoggedIn } from './auth.js'
import HomePage from './HomePage.vue'
import LoginPage from './LoginPage.vue'
import DashboardPage from './DashboardPage.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/dashboard', name: 'dashboard', component: DashboardPage, meta: { requiresAuth: true } },
  ],
})

// TODO: add a router.beforeEach guard

export default router`

const ex1RouterSolution = `import { createRouter, createMemoryHistory } from 'vue-router'
import { isLoggedIn } from './auth.js'
import HomePage from './HomePage.vue'
import LoginPage from './LoginPage.vue'
import DashboardPage from './DashboardPage.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/login', name: 'login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/dashboard', name: 'dashboard', component: DashboardPage, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to) => {
  // signed out + protected page -> login, remembering where they wanted to go
  if (to.meta.requiresAuth && !isLoggedIn.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // signed in + guest-only page -> dashboard
  if (to.meta.guestOnly && isLoggedIn.value) {
    return { name: 'dashboard' }
  }
  // anything else: return nothing = allow
})

export default router`

const ex1LoginStarter = `<script setup>
import { useRoute, useRouter } from 'vue-router'
import { login } from './auth.js'

const route = useRoute()
const router = useRouter()

function signIn() {
  login()
  // TODO: go to route.query.redirect, or /dashboard if there is none
}
</script>

<template>
  <h2>Sign in</h2>
  <button class="login" @click="signIn">Sign in</button>
</template>`

const ex1LoginSolution = `<script setup>
import { useRoute, useRouter } from 'vue-router'
import { login } from './auth.js'

const route = useRoute()
const router = useRouter()

function signIn() {
  login()
  const target = route.query.redirect
  const safe = typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
  router.replace(safe ? target : '/dashboard')
}
</script>

<template>
  <h2>Sign in</h2>
  <button class="login" @click="signIn">Sign in</button>
</template>`

const ex1Shared = {
  'main.js': mainJs,
  'auth.js': ex1Auth,
  'App.vue': `<template>
  <nav>
    <RouterLink to="/">Home</RouterLink> ·
    <RouterLink to="/dashboard" class="to-dashboard">Dashboard</RouterLink> ·
    <RouterLink to="/login" class="to-login">Login</RouterLink>
  </nav>
  <RouterView />
</template>`,
  'HomePage.vue': `<template><h2 class="home">Home</h2></template>`,
  'DashboardPage.vue': `<template><h2 class="dashboard">Dashboard</h2></template>`,
}

// ---------- exercise 2: unsaved changes with a custom banner
const ex2Router = `import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from './HomePage.vue'
import ProfileForm from './ProfileForm.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/profile', component: ProfileForm },
  ],
})`

const ex2Starter = `<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const saved = ref('Ada')
const name = ref('Ada')
const dirty = computed(() => name.value !== saved.value)

function save() {
  saved.value = name.value
}

// TODO: block leaving while dirty and show the banner
</script>

<template>
  <h2>Edit profile</h2>
  <input v-model="name" class="name-input" />
  <button class="save" @click="save">Save</button>
  <p class="state">{{ dirty ? 'Unsaved changes' : 'Saved' }}</p>

  <!-- TODO: <div class="unsaved-banner"> with .stay and .discard buttons -->
</template>`

const ex2Solution = `<script setup>
import { ref, computed } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'

const router = useRouter()
const saved = ref('Ada')
const name = ref('Ada')
const dirty = computed(() => name.value !== saved.value)
const pendingPath = ref(null) // where the user tried to go

function save() {
  saved.value = name.value
}

onBeforeRouteLeave((to) => {
  if (dirty.value) {
    pendingPath.value = to.fullPath
    return false // cancel; the banner asks what to do
  }
})

function stay() {
  pendingPath.value = null
}

function discard() {
  const target = pendingPath.value
  name.value = saved.value // no longer dirty...
  pendingPath.value = null
  router.push(target) // ...so the guard lets this through
}
</script>

<template>
  <h2>Edit profile</h2>
  <input v-model="name" class="name-input" />
  <button class="save" @click="save">Save</button>
  <p class="state">{{ dirty ? 'Unsaved changes' : 'Saved' }}</p>

  <div v-if="pendingPath" class="unsaved-banner" role="alertdialog">
    You have unsaved changes.
    <button class="stay" @click="stay">Keep editing</button>
    <button class="discard" @click="discard">Discard changes</button>
  </div>
</template>`

const ex2Shared = {
  'main.js': mainJs,
  'router.js': ex2Router,
  'App.vue': `<template>
  <nav>
    <RouterLink to="/" class="to-home">Home</RouterLink> ·
    <RouterLink to="/profile" class="to-profile">Profile</RouterLink>
  </nav>
  <RouterView />
</template>`,
  'HomePage.vue': `<template><h2 class="home">Home</h2></template>`,
}

// ---------- interview coding: titles from merged meta
const titleRouterStarter = `import { createRouter, createMemoryHistory } from 'vue-router'

const Page = (label) => ({ render: () => label })

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Page('home'), meta: { title: 'Home' } },
    { path: '/about', component: Page('about') },
    {
      path: '/settings',
      component: { render: () => null },
      meta: { title: 'Settings' },
      children: [
        { path: 'profile', component: Page('profile'), meta: { title: 'Profile' } },
        { path: 'billing', component: Page('billing') },
      ],
    },
  ],
})

// TODO: keep document.title in sync with the route

export default router`

const titleRouterSolution = `import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { h } from 'vue'

const Page = (label) => ({ render: () => label })

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Page('home'), meta: { title: 'Home' } },
    { path: '/about', component: Page('about') },
    {
      path: '/settings',
      component: { render: () => h(RouterView) },
      meta: { title: 'Settings' },
      children: [
        { path: 'profile', component: Page('profile'), meta: { title: 'Profile' } },
        { path: 'billing', component: Page('billing') },
      ],
    },
  ],
})

router.afterEach((to, from, failure) => {
  if (failure) return // the page did not change
  // to.meta is already merged parent -> child, so /settings/billing
  // inherits 'Settings' and /settings/profile overrides it with 'Profile'
  document.title = to.meta.title ? \`\${to.meta.title} · Shop\` : 'Shop'
})

export default router`

const titleShared = {
  'main.js': mainJs,
  'App.vue': `<template>
  <RouterView />
</template>`,
}

export default {
  id: 'navigation-guards',
  title: 'Navigation guards & route meta',
  summary: 'Run checks before, during and after every route change — redirect signed-out users, block unsaved edits, set page titles — and know why none of it is security.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['router-basics', 'dynamic-routes', 'nested-named-routes'],
  related: ['lazy-routes-scroll', 'router-in-practice', 'auth-security', 'project-auth-ui', 'testing-async-routing'],
  tags: ['vue router', 'navigation guards', 'beforeEach', 'beforeEnter', 'afterEach', 'beforeResolve', 'onBeforeRouteLeave', 'onBeforeRouteUpdate', 'route meta', 'authentication', 'redirect'],
  apis: [
    { name: 'router.beforeEach()', summary: 'Registers a global guard that runs before every navigation; return false, a route location, or nothing.' },
    { name: 'router.beforeResolve()', summary: 'Global guard that runs last, after in-component guards and async route components are resolved.' },
    { name: 'router.afterEach()', summary: 'Global hook after a navigation settles; cannot change it, receives a failure as third argument.' },
    { name: 'beforeEnter', summary: 'Per-route guard in the route record; runs only when entering the route from a different route.' },
    { name: 'onBeforeRouteLeave()', summary: 'Composition API guard: runs when the route that rendered this component is about to be left.' },
    { name: 'onBeforeRouteUpdate()', summary: 'Composition API guard: runs when the route changes but this component is reused (e.g. /users/1 → /users/2).' },
    { name: 'route meta', summary: 'Arbitrary data on a route record (`meta: { requiresAuth: true }`); `to.meta` merges matched records parent → child.' },
  ],
  docs: [
    { label: 'Vue Router — Navigation Guards', url: 'https://router.vuejs.org/guide/advanced/navigation-guards.html' },
    { label: 'Vue Router — Route Meta Fields', url: 'https://router.vuejs.org/guide/advanced/meta.html' },
    { label: 'Vue Router — Composition API (onBeforeRouteLeave/Update)', url: 'https://router.vuejs.org/guide/advanced/composition-api.html' },
    { label: 'Vue Router — Waiting for the result of a navigation', url: 'https://router.vuejs.org/guide/advanced/navigation-failures.html' },
  ],

  intro: `
A *navigation guard* is a function Vue Router calls while it is moving from one page to another. It can look at where you are coming **from**, where you are going **to**, and decide: let it through, cancel it, or send you somewhere else.

Guards are how a single-page app says "sign in first", "you have unsaved changes — are you sure?", or "update the tab title". Route **meta** is the label you stick on each route (\`meta: { requiresAuth: true }\`) so a guard knows which rules apply.
`,

  why: `
In [router basics](lesson:router-basics) every click on a \`<RouterLink>\` simply swaps the page. Real apps need rules around that swap:

- A signed-out visitor opens \`/account\` from a bookmark. Showing an empty, broken account page is a bad experience — send them to the login page, then bring them back.
- Someone types half a blog post and clicks a nav link by accident. Losing their work silently is worse.
- The browser tab should say "Your account · Members", not the same title on every page.

You *could* sprinkle \`if (!user) router.push('/login')\` into every page component — but you would forget one, it would flash the protected page first, and the logic would be scattered. Guards put these rules in **one place that runs on every navigation**, *before* the new page is shown.

One thing guards are **not**: security. They run in the visitor's browser, and anyone can change browser code. They exist to give honest users a smooth experience. Your server must still check permissions on every request — more on this below.
`,

  eli15: `
Picture an airport. You walk from the entrance to your plane, and along the way there are **checkpoints**: check-in, security screening, passport control, the gate.

Each checkpoint looks at your ticket and decides: "go ahead", "stop, you can't board", or "go to desk 4 first".

A Vue Router navigation is that walk, and guards are the checkpoints:

- \`beforeEach\` is the check-in desk — *every* traveller passes it.
- \`beforeEnter\` is the gate for one specific flight.
- \`onBeforeRouteLeave\` is the flight attendant on the plane you're getting off, asking "did you forget your bag?".
- \`afterEach\` is the announcement once you've boarded — it can't stop you any more, it just tells everyone where you went.

The ticket is the route's **meta**: little stamps like "business class only" (\`requiresAuth\`) that the checkpoints read.

And the honest truth about the airport analogy: this airport is painted on a screen in *your* house. A determined traveller can repaint it. The real security is at the destination (the server).
`,

  analogy: {
    title: 'Airport checkpoints',
    body: `
A journey from one gate to another passes a fixed series of checkpoints in a fixed order. Each one can wave you through, turn you back, or redirect you to another desk. Once you've boarded, the departure board updates — but it can no longer stop you.

The labels on your boarding pass decide which checks matter. Vue Router works the same way: the router walks every navigation through its guards in a defined order, and the guards read the route's \`meta\` to decide what to do.
`,
    mapping: [
      ['the journey from gate to gate', 'one navigation: `from` → `to`'],
      ['check-in desk everyone passes', '`router.beforeEach()`'],
      ['the gate of one particular flight', 'a route\'s `beforeEnter`'],
      ['"did you forget your bag?" when getting off', '`onBeforeRouteLeave()` in the page you are leaving'],
      ['stamps on the boarding pass', '`meta: { requiresAuth: true, title: … }`'],
      ['"go to desk 4 first"', 'returning a route location, e.g. `{ name: \'login\' }`'],
      ['"you cannot board"', 'returning `false`'],
      ['the departure board update', '`router.afterEach()` — can\'t cancel, only react'],
      ['the painted-on-a-screen airport', 'guards run in the browser: UX, not security'],
    ],
  },

  visual: {
    type: 'router',
    props: { preset: 'guards' },
    title: 'A navigation passing its guards',
    caption: 'Change the URL and watch the router match it, run each guard in turn, and either render the page, cancel, or redirect.',
    alt: 'An interactive router diagram. A URL bar feeds a route-matching step, then a row of guard checkpoints (beforeEach, beforeEnter, beforeResolve). Each guard lights up as it runs and shows its decision: allow, cancel or redirect. If all allow, the matching component renders; a redirect sends the flow back to matching with the new URL.',
  },

  syntax: [
    `
#### Global guards — on the router instance

Register them once, usually in \`router.js\`. Each receives \`to\` and \`from\` (normalized *route locations*: objects with \`path\`, \`fullPath\`, \`params\`, \`query\`, \`name\`, \`meta\`…).
`,
    {
      code: `router.beforeEach((to, from) => {
  // return nothing (or true)      -> continue
  // return false                  -> cancel, stay where you are
  // return '/login' or { name: 'login', query: { … } } -> redirect
  // throw new Error('…')          -> cancel + router.onError() handlers run
})

router.beforeResolve(async (to) => {
  // runs last, after in-component guards and lazy route components resolved
})

router.afterEach((to, from, failure) => {
  // the navigation is over: you cannot cancel it here
  if (!failure) document.title = to.meta.title ?? 'My app'
})`,
      lang: 'js',
      title: 'router.js — global guards',
    },
    `
Each \`beforeEach\`/\`beforeResolve\`/\`afterEach\` call **returns a function that removes that guard** — handy in tests.

#### Per-route guard — \`beforeEnter\` in the route record
`,
    {
      code: `function requireAdmin(to) {
  if (currentUser.value?.role !== 'admin') return { name: 'home' }
}

const routes = [
  { path: '/admin', component: AdminPage, beforeEnter: requireAdmin },
  // an array of reusable guards also works:
  { path: '/admin/billing', component: BillingPage, beforeEnter: [requireAdmin, requireBillingFlag] },
]`,
      lang: 'js',
      title: 'beforeEnter',
    },
    `
\`beforeEnter\` runs **only when you enter the route from a different route**. Going from \`/users/2\` to \`/users/3\` (only params change), or changing just the query or hash, does *not* run it again.

#### In-component guards — Composition API
`,
    {
      code: `<script setup>
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) return false   // stay on this page
})

onBeforeRouteUpdate(async (to, from) => {
  // same component reused: /users/1 -> /users/2
  if (to.params.id !== from.params.id) await loadUser(to.params.id)
})
</script>`,
      lang: 'vue',
      title: 'inside a component rendered by <RouterView>',
    },
    `
These can be used in **any component rendered (directly or deeper) by \`<RouterView>\`** and are removed automatically when the component unmounts. There is no \`onBeforeRouteEnter\`: \`setup()\` only runs *after* the navigation is confirmed, so "before entering" logic belongs in \`beforeEnter\` or a global guard. (The Options API has \`beforeRouteEnter\`, which has no \`this\` for the same reason.)

#### Route meta
`,
    {
      code: `{
  path: '/settings',
  component: SettingsLayout,
  meta: { requiresAuth: true, title: 'Settings' },
  children: [
    { path: 'billing', component: Billing, meta: { title: 'Billing' } },
  ],
}
// at /settings/billing:  to.meta -> { requiresAuth: true, title: 'Billing' }`,
      lang: 'js',
      title: 'meta is merged from parent to child',
    },
    `
\`to.meta\` is a **non-recursive merge** of the \`meta\` of every matched record, parent first — so a child inherits \`requiresAuth\` and can override \`title\`. (\`to.matched\` still holds each record if you need them individually.)
`,
    {
      callout: 'version',
      title: 'next() is legacy',
      text: 'Older code writes guards as `(to, from, next) => { … next() }`. It still works, but in current Vue Router (this platform runs Vue Router 5) the `next` argument is marked deprecated in favour of **returning** a value. Prefer return values in new code. If you maintain `next()` code: it must be called **exactly once** on every path through the guard — forgetting it hangs the navigation, calling it twice is a bug.',
    },
    {
      callout: 'warn',
      title: 'Guards are UX, not security',
      text: 'Guards run in the browser. Anyone can edit or skip browser JavaScript, and they can always call your API directly. Use guards to guide honest users; enforce every permission on the server, on every request. See [auth & token storage](lesson:auth-security).',
    },
  ],

  walkthrough: {
    title: 'router.js',
    lang: 'js',
    code: routerJs,
    intro: 'The router from the playground. Step through it to see how meta, beforeEach and afterEach work together.',
    steps: [
      { lines: [10, 11], text: '`createRouter()` with `createMemoryHistory()` — the sandbox has no real address bar. A real app would use `createWebHistory()`.' },
      { lines: [13, 14], text: 'Public routes carry only a `title` in their `meta`. `meta` can hold anything; the router itself never interprets it — your guards do.' },
      { lines: [15, 17], text: 'Protected routes add `requiresAuth: true`. The rule lives on the route, so adding a new protected page is one word, not a new `if` somewhere.' },
      { lines: [22, 23], text: '`beforeEach` runs before **every** navigation, including the very first one when the app starts. `to` and `from` are full route locations.' },
      { lines: [24, 27], text: 'Signed out and heading somewhere protected? **Return a route location** to redirect. Passing `to.fullPath` as `?redirect=` lets the login page send the user back afterwards. The `/login` route has no `requiresAuth`, so this redirect cannot loop.' },
      { lines: [28], text: 'Falling off the end returns `undefined`, which means "continue". No `next()` needed.' },
      { lines: [31, 35], text: '`afterEach` runs once the navigation has settled. It cannot cancel anything; the third argument is set when the navigation failed (cancelled by a guard, duplicated, …).' },
      { lines: [36, 37], text: 'Only for successful navigations: update the tab title from `meta.title`. Side effects that should happen "after we arrived" belong here.' },
    ],
  },

  playground: {
    title: 'Members area',
    objective: 'Sign in and out, try the protected pages, and use the guard log to see exactly which guard ran and what it decided.',
    files: baseFiles,
    expected: 'A nav bar (Home · Account · Admin · Editor), a "Not signed in" line, the Home page and a **Guard log**. Clicking **Account** while signed out lands on the Sign in page with a notice; the log shows `beforeEach` redirecting to `/login`. Signing in always goes to `/account` — the experiments improve that.',
    experiments: [
      {
        id: 'return-to-redirect',
        task: 'While signed out, click **Admin**: you land on `/login?redirect=/admin`. But signing in always goes to `/account`. Change `LoginPage.vue` so that after signing in the user goes to the `redirect` query instead (fall back to `/account` when there is none).',
        hint: 'Read `route.query.redirect` inside `signIn()`. Use `router.replace(...)` so the login page is not left in the history behind the user.',
        tests: [
          {
            name: 'signing in returns to the page that was requested',
            code: `await click('.to-admin')
expect(vm.$route.fullPath).toBe('/login?redirect=/admin')
await click('.login-admin')
expect(vm.$route.path).toBe('/admin')`,
          },
        ],
        explain: 'The guard stored the original destination in the URL, so it survives even a page refresh. `replace` swaps the login entry out of the history, so the Back button does not bounce the user to a login page they no longer need. Accept only in-app paths (starting with a single `/`) — if you ever hand that value to `window.location`, an unchecked redirect becomes an *open redirect* that attackers can abuse in phishing links.',
      },
      {
        id: 'admin-only',
        task: 'Right now any signed-in member can open **Admin**. Add `roles: [\'admin\']` to the admin route\'s `meta` and extend `beforeEach` so a signed-in user without one of the listed roles is redirected to `home`.',
        hint: 'After the `requiresAuth` check: `if (to.meta.roles && !to.meta.roles.includes(user.value.role)) return { name: \'home\' }`. At that point `user.value` is known to exist.',
        tests: [
          {
            name: 'a member is kept out of /admin',
            code: `requireModule('auth.js').login('member')
const router = requireModule('router.js').default
await router.push('/admin')
await flush()
expect(router.currentRoute.value.path).not.toBe('/admin')
expect(exists('.admin-title')).toBe(false)`,
          },
          {
            name: 'an admin can still open /admin',
            code: `requireModule('auth.js').login('admin')
const router = requireModule('router.js').default
await router.push('/admin')
await flush()
expect(router.currentRoute.value.path).toBe('/admin')`,
          },
        ],
        explain: 'Meta turns access rules into data: the guard stays generic, and each route declares who may enter. Remember this only hides the page — the admin API endpoints must refuse non-admins on the server no matter what the browser shows.',
      },
      {
        id: 'unsaved-changes',
        task: 'Sign in, open **Editor**, type something and click **Account** — your text vanishes. In `EditorPage.vue`, use `onBeforeRouteLeave` to **cancel** leaving while there are unsaved changes, and show `<p class="leave-warning">Save your post before leaving this page.</p>` when that happens.',
        hint: 'Import `onBeforeRouteLeave` from `vue-router`. Inside it, if `dirty.value` is true, set a `warned` ref to true and `return false`. Render the paragraph with `v-if="warned"`.',
        tests: [
          {
            name: 'leaving with unsaved text is blocked and explained',
            code: `requireModule('auth.js').login('member')
const router = requireModule('router.js').default
await router.push('/editor')
await flush()
await type('.draft', 'My first post')
await click('.to-account')
expect(vm.$route.path).toBe('/editor')
expect(exists('.leave-warning')).toBe(true)`,
          },
          {
            name: 'after saving, leaving works',
            code: `requireModule('auth.js').login('member')
const router = requireModule('router.js').default
await router.push('/editor')
await flush()
await type('.draft', 'Saved post')
await click('.save')
await click('.to-account')
expect(vm.$route.path).toBe('/account')`,
          },
        ],
        explain: 'The leave guard belongs to the page that owns the unsaved data — the global router knows nothing about drafts. Returning `false` aborts the navigation; the guard log shows `afterEach` receiving a failure. Real apps often use `window.confirm()` here, or a custom dialog like the one in exercise 2.',
      },
      {
        id: 'read-the-log',
        task: 'Log out, then click **Editor**. Read the guard log from top to bottom: how many times did `beforeEach` run, and why? Then click the **Home** link while already on Home and see what `afterEach` reports.',
        hint: 'A redirect does not "jump" — it starts a brand-new navigation, which runs the guards again.',
        explain: 'A redirect from a guard cancels the current navigation and starts a new one to the redirect target, so `beforeEach` runs twice (once for `/editor`, once for `/login`). Clicking the link to the page you are already on produces a *duplicated* navigation failure — `afterEach` still runs and receives it.',
      },
    ],
    variants: [
      {
        id: 'solved',
        label: 'All experiments solved',
        files: { ...baseFiles, 'router.js': routerSolved, 'LoginPage.vue': loginSolved, 'EditorPage.vue': editorSolved },
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'The full navigation resolution flow',
    caption: 'Every navigation walks these stages in this order. Any guard before "confirmed" can cancel or redirect; after that, it is too late.',
    alt: 'A stepped diagram of eleven stages in order: navigation triggered, beforeRouteLeave in leaving components, global beforeEach, beforeRouteUpdate in reused components, beforeEnter in route records, resolve async route components, beforeRouteEnter in entering components, global beforeResolve, navigation confirmed, global afterEach, DOM updated. A redirect arrow loops from the guards back to the start.',
    props: {
      layout: 'grid',
      cols: 4,
      nodes: [
        { id: 'start', label: 'Navigation triggered', note: 'click / push()', tone: 'acid' },
        { id: 'leave', label: 'beforeRouteLeave', note: 'components being left' },
        { id: 'each', label: 'beforeEach', note: 'global', tone: 'cobalt' },
        { id: 'update', label: 'beforeRouteUpdate', note: 'reused components' },
        { id: 'enter', label: 'beforeEnter', note: 'route records entered' },
        { id: 'lazy', label: 'Resolve async components', note: 'lazy routes load', tone: 'kraft' },
        { id: 'rEnter', label: 'beforeRouteEnter', note: 'Options API only' },
        { id: 'resolve', label: 'beforeResolve', note: 'global, last chance', tone: 'cobalt' },
        { id: 'confirm', label: 'Navigation confirmed', note: 'currentRoute updates', tone: 'acid' },
        { id: 'after', label: 'afterEach', note: 'cannot cancel', tone: 'ink' },
        { id: 'dom', label: 'DOM updated', note: '<RouterView> renders', tone: 'paper' },
      ],
      edges: [
        { from: 'start', to: 'leave' },
        { from: 'leave', to: 'each' },
        { from: 'each', to: 'update' },
        { from: 'update', to: 'enter' },
        { from: 'enter', to: 'lazy' },
        { from: 'lazy', to: 'rEnter' },
        { from: 'rEnter', to: 'resolve' },
        { from: 'resolve', to: 'confirm' },
        { from: 'confirm', to: 'after' },
        { from: 'after', to: 'dom' },
        { id: 'redirect', from: 'each', to: 'start', label: 'redirect = new navigation', dashed: true },
      ],
      steps: [
        { focus: ['start'], text: 'Something asks for a new location: a `<RouterLink>` click, `router.push()`, or the Back button. The router resolves the target into a route location (`to`) and compares it with the current one (`from`).' },
        { focus: ['leave'], edges: ['start->leave'], text: '**Leave guards first.** Components that are about to disappear get a say — this is where `onBeforeRouteLeave` blocks a half-written form.' },
        { focus: ['each'], edges: ['leave->each'], text: '**Global `beforeEach`** runs for every navigation. Auth redirects usually live here, driven by `to.meta`.' },
        { focus: ['each', 'start'], edges: ['redirect'], text: 'A guard that **returns a location** cancels this navigation and starts a *new* one — which runs all guards again. That is why a redirect to a page that itself redirects causes an infinite loop.' },
        { focus: ['update'], edges: ['each->update'], text: '**`beforeRouteUpdate`** runs in components that stay on screen but get new params, e.g. `/users/1` → `/users/2`.' },
        { focus: ['enter'], edges: ['update->enter'], text: '**`beforeEnter`** runs for route records being *entered* — not when only params, query or hash change.' },
        { focus: ['lazy'], edges: ['enter->lazy'], text: 'Lazy route components are downloaded now, only after the earlier guards allowed the navigation. See [lazy routes](lesson:lazy-routes-scroll).' },
        { focus: ['rEnter', 'resolve'], edges: ['lazy->rEnter', 'rEnter->resolve'], text: '`beforeRouteEnter` (Options API only) then **global `beforeResolve`** — the last moment to cancel, with every component already loaded.' },
        { focus: ['confirm'], edges: ['resolve->confirm'], text: '**Confirmed.** `router.currentRoute` now points at the new location. Nothing can cancel the navigation any more.' },
        { focus: ['after', 'dom'], edges: ['confirm->after', 'after->dom'], text: '**`afterEach`** runs (analytics, titles), then `<RouterView>` re-renders with the new page. Failed navigations also reach `afterEach`, with a `failure` argument.' },
      ],
    },
  },

  internals: {
    beginner: `
When you click a link, the router doesn't change the page right away. It first makes a list of every guard that applies to this particular trip — the ones on the page you're leaving, the global ones, the ones on the page you're entering — and calls them **one at a time, in order**, waiting for each to answer.

If every guard says "fine", the router updates the current route and \`<RouterView>\` shows the new page. If any guard says "no" (\`false\`), it stops and nothing changes. If a guard says "go there instead", the router throws away this trip and starts a fresh one to the new place.
`,
    technical: [
      `
**Building the queue.** For a navigation, the router compares the matched route records of \`from\` and \`to\` and splits them into three groups: records being **left**, records being **updated** (present in both, e.g. a layout parent or the same record with new params) and records being **entered**. That split decides which in-component guards run: leave guards for the first group, update guards for the second, \`beforeEnter\` and enter guards for the third.

**Running it.** Every guard is wrapped into a function returning a Promise. Your return value is normalised: \`undefined\`/\`true\` resolves (continue), \`false\` rejects with an *aborted* navigation failure, a route location rejects with an internal redirect signal, and a thrown error rejects with that error. The stages run sequentially — global guards in registration order, then the next stage — so an \`async\` guard pauses everything after it.
`,
      {
        code: `// A simplified model of what the router does — not its real source
async function navigate(to, from) {
  const queues = [leaveGuards(from, to), globalBeforeEach, updateGuards(from, to),
                  beforeEnterGuards(to), loadAsyncComponents(to),
                  enterGuards(to), globalBeforeResolve]
  for (const queue of queues) {
    for (const guard of queue) {
      const result = await guard(to, from)
      if (result === false) return abortedFailure(to, from)
      if (isRouteLocation(result)) return navigate(resolve(result), from) // fresh run
    }
    if (anotherNavigationStarted()) return cancelledFailure(to, from)
  }
  currentRoute.value = to          // "confirmed"
  globalAfterEach.forEach((hook) => hook(to, from))
}`,
        lang: 'js',
        title: 'mental model of a navigation',
      },
      `
**Cancellation.** Between stages the router checks whether a *newer* navigation has started (a second click while an async guard is still waiting). If so, the older one stops with a *cancelled* failure — the last navigation wins.

**Meta.** \`to.meta\` is computed by shallow-merging each matched record's \`meta\` from the root record down to the deepest child, so children inherit and can override keys.

**Injection in guards.** Since Vue 3.3 (with Vue Router 4.2+), \`inject()\` works inside global navigation guards, so values from \`app.provide()\` are reachable there. Pinia stores can be used in guards too — call \`useStore()\` *inside* the guard function, not at the top of \`router.js\`, so the store is used after Pinia is installed.
`,
    ],
    production: `
- **The server is the security boundary.** Guards decide what the UI shows. Every API endpoint must check the session and the role itself. Assume someone can open \`/admin\` with the guard deleted — they should see an empty shell that fails to load any data.
- **Wait for the session on first load.** On a fresh page load, "who is signed in?" is often an async request. If \`beforeEach\` checks \`user.value\` before that request finishes, signed-in users get bounced to the login page on every refresh. Make the guard \`async\` and \`await\` a memoised \`auth.ready\` promise (one request, shared by every navigation).
- **Keep guards fast and predictable.** \`beforeEach\` runs on every navigation; slow work there delays every click. Fetch page data in the page (or in \`beforeResolve\` if you must block), and show progress — see [router in practice](lesson:router-in-practice).
- **Prevent redirect loops by construction.** The redirect target must be reachable under the same rule: never put \`requiresAuth\` on the login page, and guard "guest-only" pages with a different flag.
- **Validate the \`redirect\` query.** Only follow in-app paths (a single leading \`/\`). It's harmless with \`router.push\`, but the same value fed to \`window.location\` is an open redirect.
- **Reusable per-route guards.** Export small guard functions (\`requireRole('admin')\`) and use arrays in \`beforeEnter\`, so they are testable on their own.
- **Test guards** with a real router and \`createMemoryHistory()\`: push a location, await it, assert on \`router.currentRoute.value\`. See [testing async code & routing](lesson:testing-async-routing).
`,
  },

  mistakes: [
    {
      title: 'An auth guard that redirects to a page it also blocks',
      wrong: {
        code: `router.beforeEach((to) => {
  if (!auth.isLoggedIn) return '/login'   // also runs for /login itself…
})`,
        lang: 'js',
      },
      right: {
        code: `router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})`,
        lang: 'js',
      },
      explanation: 'A redirect starts a new navigation that runs `beforeEach` again. If `/login` also fails the check, the router redirects to `/login` forever. In development Vue Router detects a redirect that keeps returning the same location, warns and aborts the navigation; a production build has no such safety net. Opt routes *in* with `meta.requiresAuth`, or explicitly exclude the target.',
    },
    {
      title: 'Treating a guard as the security for private data',
      wrong: {
        code: `// "the guard stops non-admins, so the API doesn't need to check"
app.get('/api/admin/users', (req, res) => res.json(allUsers))`,
        lang: 'js',
      },
      right: {
        code: `// every request is authorised on the server
app.get('/api/admin/users', requireSession, requireRole('admin'), (req, res) =>
  res.json(allUsers))`,
        lang: 'js',
      },
      explanation: 'Anyone can open devtools, change `user.role`, or call the API with `curl`. The frontend guard only decides which screen an honest user sees. The server must check identity and permissions on **every** request.',
    },
    {
      title: 'Expecting beforeEnter to run when only params change',
      wrong: {
        code: `{ path: '/users/:id', component: UserPage,
  beforeEnter: (to) => loadUser(to.params.id) } // /users/1 -> /users/2: not called`,
        lang: 'js',
      },
      right: {
        code: `// inside UserPage.vue — runs whenever the id changes, including the first time
const route = useRoute()
watch(() => route.params.id, (id) => loadUser(id), { immediate: true })`,
        lang: 'js',
      },
      explanation: '`beforeEnter` runs only when the route is *entered* from a different route. The component is reused for `/users/1` → `/users/2`, so react to the param change in the component (`watch` or `onBeforeRouteUpdate`). See [dynamic routes](lesson:dynamic-routes).',
    },
    {
      title: 'Legacy next(): calling it twice or not at all',
      wrong: {
        code: `router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next('/login')
  }
  next() // runs too, after next('/login')!
})`,
        lang: 'js',
      },
      right: {
        code: `router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/login'
})`,
        lang: 'js',
      },
      explanation: 'With the `next` callback, every code path must call it exactly once; forgetting it hangs the navigation and calling it twice is an error Vue Router warns about. Returning a value removes the whole class of bugs — and `next` is marked deprecated in current Vue Router.',
    },
    {
      title: 'Checking auth before the session is known',
      wrong: {
        code: `router.beforeEach((to) => {
  // on a refresh, user is still null while /api/me is loading
  if (to.meta.requiresAuth && !auth.user) return '/login'
})`,
        lang: 'js',
      },
      right: {
        code: `router.beforeEach(async (to) => {
  await auth.ready            // memoised promise of the first /api/me call
  if (to.meta.requiresAuth && !auth.user) return '/login'
})`,
        lang: 'js',
      },
      explanation: 'Guards can be async: the navigation waits for the promise. Make sure the session request is made once and shared, otherwise every navigation re-fetches it.',
    },
  ],

  debugging: [
    {
      symptom: 'Visiting a page shows nothing and the dev console reports an infinite redirect in a navigation guard (in production the navigation just never settles).',
      cause: 'The guard redirects to a route that fails the same check (e.g. the login page also requires auth).',
      fix: 'Make the condition depend on `to.meta.requiresAuth` (opt-in), and make sure the redirect target does not have it.',
    },
    {
      symptom: 'Signed-in users are sent to the login page every time they refresh.',
      cause: 'The guard reads auth state before the async session check has finished.',
      fix: 'Make the guard `async` and `await` a memoised "session ready" promise before checking.',
    },
    {
      symptom: 'A per-route `beforeEnter` does not run when going from `/users/1` to `/users/2`.',
      cause: 'By design: `beforeEnter` only runs when entering the route from another route.',
      fix: 'Use `onBeforeRouteUpdate` or `watch(() => route.params.id, …)` in the component.',
    },
    {
      symptom: 'Navigation never finishes: the new page never shows and there is no error.',
      cause: 'Legacy guard with a `next` parameter that never calls `next()` on some path, or an async guard whose promise never settles.',
      fix: 'Switch to return values (drop the `next` parameter), or make sure every path calls `next()` exactly once; add a timeout/`catch` around awaited requests.',
    },
    {
      symptom: '`onBeforeRouteLeave` never fires.',
      cause: 'It was called outside a component rendered by `<RouterView>` (e.g. in `App.vue`, which is never "left"), or not synchronously during `setup()`.',
      fix: 'Call it at the top level of `setup()` in the page component (or a child of it).',
    },
  ],

  bestPractices: [
    'Return values from guards (`false`, a route location, nothing) instead of the legacy `next()` callback.',
    'Describe access rules in `meta` (`requiresAuth`, `roles`, `guestOnly`) and keep one generic global guard that reads them.',
    'Remember the destination with `query: { redirect: to.fullPath }` and send the user back after login with `router.replace`.',
    'Put "unsaved changes" logic in the page that owns the data, with `onBeforeRouteLeave`.',
    'Use `afterEach` for side effects that should only happen after arriving (titles, analytics) and skip them when `failure` is set.',
    'Treat every guard as user experience. Enforce authorization on the server, every request.',
  ],

  useCases: [
    'Redirecting signed-out users from `/account` to `/login?redirect=/account`.',
    'Keeping signed-in users away from guest-only pages like `/login` and `/register`.',
    'Role-based sections (`meta.roles: [\'admin\']`) that hide admin screens from regular users.',
    'Warning before leaving a form with unsaved changes.',
    'Setting `document.title` and sending page-view analytics in `afterEach`.',
    'Checking a feature flag or browser permission in `beforeResolve` before showing a page that needs it.',
  ],

  whenToUse: {
    use: [
      'A rule applies to many routes (auth, roles, titles) — a global guard plus `meta`.',
      'A rule applies to one route or a family of routes — `beforeEnter`, possibly as an array of reusable guards.',
      'A page owns state that should block leaving — `onBeforeRouteLeave`.',
      'A reused page must react to new params before showing them — `onBeforeRouteUpdate`.',
    ],
    avoid: [
      'Protecting data. That is the server\'s job; guards only shape the UI.',
      'Heavy data fetching in global `beforeEach` that slows down every navigation — load data in the page and show a loading state.',
      'Logic that only needs to react to param changes after rendering — a `watch` on `route.params` is simpler.',
    ],
  },

  comparison: {
    title: 'Which guard?',
    headers: ['', 'Defined in', 'Runs for', 'Can cancel / redirect?', 'Typical use'],
    rows: [
      ['`beforeEach`', 'router instance', 'every navigation', 'yes', 'auth redirects driven by `meta`'],
      ['`beforeEnter`', 'route record', 'entering that route (not param/query/hash changes)', 'yes', 'route-specific checks, reusable guard arrays'],
      ['`onBeforeRouteUpdate`', 'component (setup)', 'route changes while the component is reused', 'yes', 'react to new params, e.g. load another user'],
      ['`onBeforeRouteLeave`', 'component (setup)', 'leaving the route that rendered the component', 'yes', 'unsaved-changes protection'],
      ['`beforeResolve`', 'router instance', 'every navigation, after all of the above + lazy components', 'yes', 'last-moment checks that need loaded components'],
      ['`afterEach`', 'router instance', 'every navigation, including failed ones', '**no**', 'titles, analytics, focus management'],
    ],
    note: 'Order: leave → beforeEach → update → beforeEnter → lazy components → (Options API) beforeRouteEnter → beforeResolve → confirmed → afterEach → DOM.',
  },

  quiz: [
    {
      id: 'navigation-guards-q1',
      type: 'mcq',
      prompt: 'A global `beforeEach` guard **returns `false`**. What happens?',
      options: [
        { text: 'The navigation is cancelled and the user stays on the current page.' },
        { text: 'The navigation continues, but `afterEach` is skipped.', why: '`false` cancels the navigation. `afterEach` still runs and receives a failure.' },
        { text: 'The router redirects to `/`.', why: 'Redirects happen only when you return a route location such as `\'/\'` or `{ name: \'home\' }`.' },
        { text: 'The router throws an error and calls `router.onError()`.', why: 'That happens when the guard *throws*. Returning `false` is a normal, expected cancellation (an "aborted" navigation failure).' },
      ],
      answer: 0,
      explanation: '`false` aborts the navigation. `router.push()` resolves with an *aborted* navigation failure and the current route does not change.',
    },
    {
      id: 'navigation-guards-q2',
      type: 'output',
      prompt: 'The app is on `/` and calls `router.push(\'/admin\')`. Every guard just logs and returns nothing. In what order do the logs appear?',
      code: {
        lang: 'js',
        code: `router.afterEach(() => console.log('A'))
router.beforeResolve(() => console.log('B'))
router.beforeEach(() => console.log('C'))

const routes = [
  { path: '/', component: Home },
  { path: '/admin', component: Admin, beforeEnter: () => console.log('D') },
]`,
      },
      options: ['C D B A', 'A B C D', 'C B D A', 'D C B A'],
      answer: 0,
      explanation: 'Registration order doesn\'t matter across stages: `beforeEach` (C) → `beforeEnter` of the entered route (D) → `beforeResolve` (B) → confirmed → `afterEach` (A).',
    },
    {
      id: 'navigation-guards-q3',
      type: 'bug',
      prompt: 'In development, visiting any page while signed out fails with an "infinite redirect in navigation guard" error. Click the line that has to change.',
      code: {
        lang: 'js',
        code: `router.beforeEach((to) => {
  if (!auth.isLoggedIn) {
    return { name: 'login' }
  }
})

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/login', name: 'login', component: Login },
]`,
      },
      answerLine: 2,
      explanation: 'The condition is true for *every* route, including `/login`, so the redirect to login is itself redirected to login, forever. Make it `if (to.meta.requiresAuth && !auth.isLoggedIn)` (or at least exclude `to.name === \'login\'`).',
    },
    {
      id: 'navigation-guards-q4',
      type: 'fill',
      prompt: 'Complete the page so leaving with unsaved changes is cancelled.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ___ } from 'vue-router'

onBeforeRouteLeave(() => {
  if (dirty.value) return ___
})
</script>`,
      },
      answer: [['onBeforeRouteLeave'], ['false']],
      explanation: 'Import `onBeforeRouteLeave` from `vue-router` and return `false` to abort the navigation.',
    },
    {
      id: 'navigation-guards-q5',
      type: 'mcq',
      prompt: 'Routes: `/settings` has `meta: { requiresAuth: true, title: \'Settings\' }` and its child `billing` has `meta: { title: \'Billing\' }`. What is `to.meta` at `/settings/billing`?',
      options: [
        { text: '`{ requiresAuth: true, title: \'Billing\' }`' },
        { text: '`{ title: \'Billing\' }`', why: 'Meta is merged from all matched records, so the child inherits `requiresAuth`.' },
        { text: '`{ requiresAuth: true, title: \'Settings\' }`', why: 'The merge goes parent → child, so the child\'s `title` overrides the parent\'s.' },
        { text: '`[{ requiresAuth: true, title: \'Settings\' }, { title: \'Billing\' }]`', why: 'That is roughly what you get from `to.matched.map(r => r.meta)`; `to.meta` is a single merged object.' },
      ],
      answer: 0,
      explanation: '`to.meta` is a non-recursive merge of every matched record\'s meta, parent first, so children inherit flags and can override values.',
    },
    {
      id: 'navigation-guards-q6',
      type: 'mcq',
      prompt: 'Your admin pages are protected by a `beforeEach` guard that checks `user.role === \'admin\'`. Which statements are true? (Select all that apply.)',
      options: [
        { text: 'A user can bypass the guard by editing JavaScript in devtools.' },
        { text: 'The admin API endpoints must check the role on the server too.' },
        { text: 'Because the guard exists, the admin API can skip authorization.', why: 'The API is reachable without your frontend at all (curl, scripts). It must authorize every request.' },
        { text: 'The guard is still useful: it keeps honest users from landing on screens they cannot use.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Guards are a UX feature. They run in a browser the user controls. Real protection is server-side authorization on every request.',
    },
    {
      id: 'navigation-guards-q7',
      type: 'short',
      prompt: 'Why is there no `onBeforeRouteEnter()` in the Composition API, and what do you use instead?',
      answer: 'A component\'s `setup()` only runs after the navigation has been confirmed, so a guard registered inside it cannot run "before entering". Put pre-entry logic in the route\'s `beforeEnter` or a global `beforeEach`/`beforeResolve` (often driven by `meta`), or load data inside the page and show a loading state.',
    },
  ],

  exercises: [
    {
      id: 'guest-and-auth-guard',
      title: 'Auth guard with a guest-only login page',
      difficulty: 'intermediate',
      prompt: `
The router has three routes: \`/\` (public), \`/login\` (\`meta.guestOnly\`) and \`/dashboard\` (\`meta.requiresAuth\`). Sign-in state lives in \`auth.js\` as \`isLoggedIn\`.

In \`router.js\`, add **one** \`router.beforeEach\` guard, and finish \`signIn()\` in \`LoginPage.vue\`:

- Signed out + \`requiresAuth\` route → redirect to the \`login\` route with \`query: { redirect: to.fullPath }\` (so \`/dashboard\` becomes \`/login?redirect=/dashboard\`).
- Signed in + \`guestOnly\` route → redirect to \`/dashboard\`.
- Everything else is allowed (signed-out users can open \`/login\` — no loops!).
- Clicking the \`<button class="login">\` signs in and goes to the \`redirect\` query, or \`/dashboard\` if there is none.
`,
      files: { ...ex1Shared, 'router.js': ex1RouterStarter, 'LoginPage.vue': ex1LoginStarter },
      hints: [
        'Use `return` values: return a route location to redirect, return nothing to allow.',
        'Check `to.meta.requiresAuth && !isLoggedIn.value` first, then `to.meta.guestOnly && isLoggedIn.value`.',
        'In `signIn()`: `const target = route.query.redirect` then `router.replace(typeof target === \'string\' && target.startsWith(\'/\') ? target : \'/dashboard\')`.',
      ],
      solution: {
        explanation: 'The guard reads rules from `meta`, so it never needs to know route names except its redirect targets. The two conditions can\'t chase each other: a signed-out user is allowed onto `/login` (it is not `requiresAuth`), and a signed-in user is allowed onto `/dashboard` (it is not `guestOnly`). After login, `replace` returns the user to where they were heading without leaving `/login` in the history.',
        files: { ...ex1Shared, 'router.js': ex1RouterSolution, 'LoginPage.vue': ex1LoginSolution },
      },
      tests: [
        {
          name: 'signed out: /dashboard redirects to /login?redirect=/dashboard',
          code: `const router = requireModule('router.js').default
await router.push('/dashboard')
await flush()
expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/dashboard')
expect(exists('.dashboard')).toBe(false)`,
        },
        {
          name: 'signed out: /login itself is reachable (no loop)',
          code: `const router = requireModule('router.js').default
await router.push('/login')
await flush()
expect(router.currentRoute.value.path).toBe('/login')
expect(exists('.login')).toBe(true)`,
        },
        {
          name: 'signing in returns to the requested page',
          code: `await click('.to-dashboard')
await click('.login')
expect(vm.$route.path).toBe('/dashboard')
expect(exists('.dashboard')).toBe(true)`,
        },
        {
          name: 'signing in without a redirect goes to /dashboard',
          code: `await click('.to-login')
await click('.login')
expect(vm.$route.path).toBe('/dashboard')`,
        },
        {
          name: 'signed in: /login redirects to /dashboard',
          code: `requireModule('auth.js').login()
const router = requireModule('router.js').default
await router.push('/login')
await flush()
expect(router.currentRoute.value.path).toBe('/dashboard')`,
        },
        {
          name: 'home stays public',
          code: `const router = requireModule('router.js').default
await router.push('/')
await flush()
expect(exists('.home')).toBe(true)`,
        },
      ],
    },
    {
      id: 'unsaved-changes-banner',
      title: 'Unsaved changes with a custom banner',
      difficulty: 'intermediate',
      prompt: `
\`ProfileForm.vue\` (route \`/profile\`) edits a name. \`dirty\` is already computed for you. Make leaving safe **without** \`window.confirm\`:

- When the user tries to leave \`/profile\` with unsaved changes, **cancel** the navigation and show a \`<div class="unsaved-banner">\`.
- The banner has a \`<button class="stay">\` that hides the banner and keeps editing.
- …and a \`<button class="discard">\` that throws the changes away and **continues to where the user wanted to go**.
- With no unsaved changes (untouched, or after \`.save\`), leaving works normally.

Links in \`App.vue\`: \`.to-home\` and \`.to-profile\`. The input is \`.name-input\`.
`,
      files: { ...ex2Shared, 'ProfileForm.vue': ex2Starter },
      hints: [
        'Use `onBeforeRouteLeave((to) => { … })` from `vue-router` and `return false` when `dirty.value` is true.',
        'Before returning `false`, remember the destination: `pendingPath.value = to.fullPath`. Show the banner with `v-if="pendingPath"`.',
        'In `discard()`: reset `name.value = saved.value` (no longer dirty), clear `pendingPath`, then `router.push(target)` — the guard now lets it through.',
      ],
      solution: {
        explanation: 'The guard cancels the navigation but remembers where the user was heading. "Discard" first makes the form clean, so when it re-issues the navigation the same guard allows it. This custom-dialog pattern is what you use when `window.confirm()` is too ugly or not allowed — the guard itself stays synchronous and simple.',
        files: { ...ex2Shared, 'ProfileForm.vue': ex2Solution },
      },
      tests: [
        {
          name: 'leaving with unsaved changes is blocked and the banner shows',
          code: `await click('.to-profile')
await type('.name-input', 'Grace')
await click('.to-home')
expect(vm.$route.path).toBe('/profile')
expect(exists('.unsaved-banner')).toBe(true)`,
        },
        {
          name: '"Discard changes" continues to the requested page',
          code: `await click('.to-profile')
await type('.name-input', 'Grace')
await click('.to-home')
await click('.discard')
expect(vm.$route.path).toBe('/')
expect(exists('.home')).toBe(true)`,
        },
        {
          name: '"Keep editing" hides the banner and stays',
          code: `await click('.to-profile')
await type('.name-input', 'Grace')
await click('.to-home')
await click('.stay')
expect(vm.$route.path).toBe('/profile')
expect(exists('.unsaved-banner')).toBe(false)
expect(find('.name-input').value).toBe('Grace')`,
        },
        {
          name: 'after saving, leaving works',
          code: `await click('.to-profile')
await type('.name-input', 'Grace')
await click('.save')
await click('.to-home')
expect(vm.$route.path).toBe('/')`,
        },
        {
          name: 'untouched form: leaving works',
          code: `await click('.to-profile')
await click('.to-home')
expect(vm.$route.path).toBe('/')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'navigation-guards-order',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Walk me through the order in which Vue Router runs navigation guards.',
      answer: 'Navigation triggered → `beforeRouteLeave` in components being left → global `beforeEach` → `beforeRouteUpdate` in reused components → `beforeEnter` in route records being entered → async route components resolved → `beforeRouteEnter` in entering components (Options API) → global `beforeResolve` → navigation confirmed → global `afterEach` → DOM updated (and `beforeRouteEnter`\'s `next(vm => …)` callbacks run).',
      explanation: 'The order goes from "the page you are leaving" to "global" to "the page you are entering", then a final global check. Everything before confirmation can cancel or redirect; `afterEach` can\'t.',
      whyAsked: 'Shows whether you can predict where to put a check (e.g. why lazy components are not downloaded when `beforeEach` redirects) and debug guards that seem to run "in the wrong order".',
      mistakes: [
        'Putting `afterEach` before confirmation or claiming it can cancel.',
        'Thinking `beforeEnter` runs on every param change.',
        'Forgetting that lazy route components are resolved in the middle, after `beforeEnter`.',
      ],
      followUps: [
        'Why is there no Composition API `onBeforeRouteEnter`?',
        'Where would you put a check that needs the lazy component to be loaded?',
        'What happens to the queue when a guard returns a redirect?',
      ],
      modelAnswer: 'A navigation first asks components that are being left, through `beforeRouteLeave`. Then global `beforeEach` runs, then `beforeRouteUpdate` in components that are reused with new params, then `beforeEnter` on route records being entered. Then the router resolves lazy route components, runs `beforeRouteEnter` in the Options API, and finally global `beforeResolve`. After that the navigation is confirmed, `currentRoute` changes, `afterEach` hooks run and `RouterView` re-renders. Any guard before confirmation can return `false` or a redirect; `afterEach` only observes, and receives a failure if the navigation failed.',
    },
    {
      id: 'navigation-guards-security',
      difficulty: 'beginner',
      type: 'scenario',
      minutes: 3,
      question: 'A teammate says: "Our admin routes have `meta.requiresAdmin` and a `beforeEach` guard, so admin data is safe." Do you agree?',
      answer: 'No. Guards run in the user\'s browser and only control which screen is shown. Anyone can modify the JavaScript, change the stored role, or call the API directly. The admin data is safe only if every admin API endpoint verifies the session and the role on the server. The guard is still worth keeping — for user experience.',
      explanation: 'Frontend code is delivered to and executed by the client, so the client can change it. Authorization must happen where the data lives.',
      whyAsked: 'A quick test of security fundamentals — a candidate who trusts frontend checks is a risk on any team.',
      mistakes: [
        'Saying minification or obfuscation makes it safe.',
        'Saying "hide the admin links" is enough.',
        'Dismissing guards entirely instead of explaining their UX role.',
      ],
      followUps: ['Where should the role come from on the server?', 'What should the admin page do if the API returns 403?', 'Is it a problem that the admin page\'s code is downloadable?'],
      modelAnswer: 'I\'d disagree. The guard runs in the browser, so it\'s a user-experience feature: it stops honest users from landing on a page they can\'t use and redirects them nicely. Anyone can bypass it in devtools or just call the API with curl. The real protection is server-side: every admin endpoint checks the session and the role and returns 401 or 403 otherwise. The frontend should then handle those responses gracefully. Shipping admin page code isn\'t a secret leak as long as no secrets or data are in it.',
    },
    {
      id: 'navigation-guards-redirect-loop',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'With this guard, signed-out users hit an error on the login page and unverified users get an "infinite redirect" error in development. What is going on?',
      code: {
        lang: 'js',
        code: `router.beforeEach((to) => {
  if (!session.user && to.path !== '/login') return '/login'
  if (!session.user.verified) return '/verify-email'
})`,
      },
      options: [
        'Signed-out users reach line 3 on /login and crash; and /verify-email redirects to itself for unverified users',
        'Guards cannot return strings',
        'beforeEach must call next()',
        'The router needs a catch-all route',
      ],
      correctOption: 0,
      answer: 'Two problems. On `/login` a signed-out user passes line 2, then line 3 reads `session.user.verified` on `null` and throws. And for a signed-in, unverified user, the redirect to `/verify-email` runs the guard again, which again returns `/verify-email` — an infinite loop. Each redirect target must be excluded from (or not matched by) its own rule.',
      explanation: 'A redirect is a new navigation through the same guards. Write rules that are opt-in via `meta`, or explicitly let the redirect target through.',
      whyAsked: 'Redirect loops are the most common real-world guard bug; this checks you know redirects re-run guards.',
      mistakes: ['Blaming string return values (strings are valid route locations).', 'Thinking a redirect skips the remaining guards for the new location.'],
      followUps: ['How would you restructure this with meta flags?', 'How do you return a user to the original page after verification?'],
      modelAnswer: 'A redirect cancels the current navigation and starts a new one, which runs every guard again. For unverified users, `/verify-email` is redirected to `/verify-email` forever. For signed-out users on `/login` the second line dereferences a null user. I\'d make rules opt-in with meta — `requiresAuth`, `requiresVerified` — and keep the redirect targets free of the flag that sends you there, plus guard against null.',
    },
    {
      id: 'navigation-guards-return-vs-next',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Compare writing a guard with return values versus the `next()` callback.',
      answer: 'Return style: return `false` to cancel, a route location to redirect, nothing/`true` to continue, throw to error. `next` style: call `next()`, `next(false)`, `next(\'/login\')` or `next(error)` — exactly once per path. Return values are the recommended form; `next` is legacy and marked deprecated in current Vue Router.',
      explanation: 'Return values make the outcome explicit and work naturally with `async` functions; the callback relies on discipline.',
      code: {
        lang: 'js',
        code: `// recommended
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.user) return { name: 'login' }
})

// legacy — must call next exactly once on every path
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !auth.user) next({ name: 'login' })
  else next()
})`,
      },
      whyAsked: 'Many codebases still contain `next()` guards; interviewers check you can read them and know the modern style.',
      mistakes: ['Thinking `next()` is required.', 'Not knowing what happens if `next` is called twice or never.'],
      followUps: ['What happens if a `next`-style guard never calls `next`?', 'How do async guards work with the return style?'],
      modelAnswer: 'In modern Vue Router you return the decision: nothing or `true` to continue, `false` to cancel, a route location to redirect, or throw to fail with an error that reaches `router.onError`. The older style takes a third `next` argument you must call exactly once on every code path — forgetting it hangs the navigation and calling it twice is a bug. Returning values is clearer, composes with async/await, and the `next` callback is deprecated in current versions, so I use returns in new code and migrate old guards when I touch them.',
    },
    {
      id: 'navigation-guards-param-change',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A user profile route loads data in `beforeEnter`. Clicking from Ada\'s profile to Grace\'s keeps showing Ada. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `{
  path: '/users/:id',
  component: UserProfile,
  beforeEnter: async (to) => {
    to.meta.user = await api.getUser(to.params.id)
  },
}`,
      },
      answer: '`/users/ada` → `/users/grace` matches the same route record, so the router reuses `UserProfile` and does not run `beforeEnter` again (it only runs when entering from a different route). Handle the change inside the component: `onBeforeRouteUpdate` (to load before the update) or `watch(() => route.params.id, load, { immediate: true })`. Also avoid mutating `to.meta` as a data store.',
      explanation: 'Same record + new params = update, not enter.',
      whyAsked: 'Tests understanding of component reuse and the enter/update distinction — a frequent production bug.',
      mistakes: ['Suggesting `:key="$route.fullPath"` on RouterView as the only fix without mentioning the cost (remounting).', 'Thinking it is a caching problem.'],
      followUps: ['When would remounting with a `key` be acceptable?', 'How would you avoid a race when the user clicks quickly between profiles?'],
      modelAnswer: 'Both URLs match the same record, so Vue Router treats it as an update: the component is reused and `beforeEnter` isn\'t called. I\'d move loading into the component — a `watch` on `route.params.id` with `immediate: true`, or `onBeforeRouteUpdate` if I want to load before showing the new params — and guard against out-of-order responses. Forcing a remount with a key on `RouterView` works too but throws away all component state on every change.',
    },
    {
      id: 'navigation-guards-title-coding',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Keep `document.title` in sync with the route. Use `meta.title`: the title is `"<title> · Shop"`, or just `"Shop"` when no title applies. Child routes inherit their parent\'s title unless they set their own. Don\'t change the title when a navigation fails. (The settings parent route also needs to render its children.)',
      starter: { files: { ...titleShared, 'router.js': titleRouterStarter } },
      tests: [
        { name: 'home: "Home · Shop"', code: `const router = requireModule('router.js').default\nawait router.push('/')\nawait flush()\nexpect(document.title).toBe('Home · Shop')` },
        { name: 'child with its own title: "Profile · Shop"', code: `const router = requireModule('router.js').default\nawait router.push('/settings/profile')\nawait flush()\nexpect(document.title).toBe('Profile · Shop')\nexpect(text()).toContain('profile')` },
        { name: 'child inherits the parent title: "Settings · Shop"', code: `const router = requireModule('router.js').default\nawait router.push('/settings/billing')\nawait flush()\nexpect(document.title).toBe('Settings · Shop')\nexpect(text()).toContain('billing')` },
        { name: 'no title: "Shop"', code: `const router = requireModule('router.js').default\nawait router.push('/about')\nawait flush()\nexpect(document.title).toBe('Shop')` },
      ],
      hints: [
        'Use `router.afterEach((to, from, failure) => { … })` and return early when `failure` is set.',
        '`to.meta` is already merged parent → child — you don\'t need to walk `to.matched`.',
        'The parent `/settings` component must render a nested `<RouterView>`: `{ render: () => h(RouterView) }` with `h` from `vue` and `RouterView` from `vue-router`.',
      ],
      answer: 'An `afterEach` hook that skips failures and sets `document.title = to.meta.title ? `${to.meta.title} · Shop` : \'Shop\'`, relying on the parent → child meta merge.',
      solution: { files: { ...titleShared, 'router.js': titleRouterSolution } },
      explanation: '`afterEach` is the right place: it only runs once the navigation is over, and its `failure` argument tells you when nothing changed. Meta merging gives inheritance for free.',
      whyAsked: 'A small, realistic task that checks whether you pick the right hook and know how meta behaves with nested routes.',
      mistakes: ['Setting the title in `beforeEach` (the navigation might still be cancelled).', 'Walking `to.matched` manually and getting the order wrong.', 'Forgetting the nested `<RouterView>` in the parent.'],
      followUps: ['How would you also announce the new page to screen readers?', 'How would you make titles translatable?'],
      modelAnswer: 'I\'d use `afterEach`, because by then the navigation is confirmed — `beforeEach` might still be cancelled by a later guard. I return early when the `failure` argument is set. Because `to.meta` merges matched records from parent to child, child routes inherit the parent\'s title and can override it, so the hook is one line. For accessibility I\'d also move focus or announce the new title after navigation.',
      challenge: 'Extend it so `meta.title` may also be a function that receives the route and returns a string — handy for user profile pages.',
    },
    {
      id: 'navigation-guards-auth-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design route-level auth for an app with signed-out, member and admin users, where the session is restored with an async `/api/me` call on page load.',
      answer: 'Describe access in `meta` (`requiresAuth`, `roles`, `guestOnly`). One async global `beforeEach` awaits a memoised `auth.ready` promise (a single `/api/me` request shared by all navigations), then: signed out + `requiresAuth` → login with `redirect`; signed in + `guestOnly` → home/dashboard; missing role → a 403 page or home. After login, `router.replace` to the validated `redirect`. On logout, clear state and navigate to a public page. Handle 401/403 API responses globally (session expired → login). The server authorizes every request; the guard is UX.',
      explanation: 'The pieces: declarative rules (meta), one generic guard, a single source of session truth that is awaited, loop-free redirect targets, and server-side enforcement.',
      code: {
        lang: 'js',
        code: `router.beforeEach(async (to) => {
  const auth = useAuthStore()      // inject() works in guards (Vue 3.3+)
  await auth.ready                 // first /api/me call, memoised
  if (to.meta.requiresAuth && !auth.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.guestOnly && auth.user) return { name: 'dashboard' }
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    return { name: 'forbidden' }
  }
})`,
      },
      whyAsked: 'Senior candidates are expected to connect routing, async state, UX and security into one coherent design.',
      mistakes: [
        'Checking auth synchronously before the session is restored.',
        'Calling `/api/me` on every navigation.',
        'Forgetting the server side, or token expiry during a session.',
        'Redirect targets that trigger their own rule.',
      ],
      followUps: ['How do you handle the token expiring while the user is on a page?', 'Where would you store the session token, and why?', 'How do you test this guard?'],
      modelAnswer: 'I\'d put the rules on the routes as meta — requiresAuth, guestOnly, roles — and write one async global guard. It first awaits a memoised session promise so a refresh doesn\'t bounce signed-in users, then redirects signed-out users to login with the original path, keeps signed-in users off guest pages, and sends users without the role to a forbidden page. Login returns to the validated redirect with replace. API 401s trigger a global logout-and-redirect. And I\'d be explicit that all of this is UX: every endpoint authorizes on the server.',
    },
  ],

  takeaways: [
    'Guards run during navigation and decide by return value: nothing/`true` continue, `false` cancel, a route location redirect, a thrown error fail.',
    'Order: leave → `beforeEach` → update → `beforeEnter` → lazy components → `beforeResolve` → confirmed → `afterEach` → DOM.',
    '`beforeEnter` runs only when entering a route, not when only params, query or hash change.',
    '`onBeforeRouteLeave` / `onBeforeRouteUpdate` are the Composition API in-component guards; there is no enter equivalent.',
    '`meta` labels routes for guards; `to.meta` merges matched records parent → child.',
    'A redirect is a new navigation through the same guards — design redirect targets so they cannot loop.',
    'Guards are UX, not security: the server must authorize every request.',
  ],
}
