// Lesson: Router in practice — query-driven filters, navigation failures & errors, testing,
// and a mini app with nested routes, dynamic profiles, query filters and lazy pages.

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'

createApp(App).use(router).mount('#app')`

const usersJs = `// Fake data — the sandbox has no network. A real app would fetch this.
export const users = [
  { id: 1, name: 'Ada Park', role: 'admin', team: 'Platform', joined: 2019 },
  { id: 2, name: 'Grace Kim', role: 'member', team: 'Compilers', joined: 2021 },
  { id: 3, name: 'Alan Ruiz', role: 'member', team: 'Research', joined: 2020 },
  { id: 4, name: 'Katherine Obi', role: 'admin', team: 'Navigation', joined: 2018 },
  { id: 5, name: 'Linus Berg', role: 'member', team: 'Kernel', joined: 2022 },
  { id: 6, name: 'Margaret Sato', role: 'member', team: 'Flight software', joined: 2017 },
]

const activityLog = {
  1: ['Merged "Faster search"', 'Reviewed "Router upgrade"'],
  2: ['Opened "Compiler warnings"', 'Commented on "Release notes"'],
  4: ['Deployed version 2.3'],
}

export function findUser(id) {
  return users.find((u) => u.id === Number(id)) ?? null
}

export function activityFor(id) {
  return activityLog[id] ?? []
}`

const lazyJs = `import { ref } from 'vue'

// Shared navigation status for the loading bar.
export const isNavigating = ref(false)

// SIMULATED lazy loading — the sandbox cannot split code or use import().
// Each page file is already in memory; the loader just waits like a
// download would and records it. A real app writes:
//   component: () => import('./ReportsPage.vue')
export const downloads = ref([])

export function simulateLazy(name, component, ms = 400) {
  return () => {
    downloads.value.push(name)
    return new Promise((resolve) =>
      setTimeout(() => resolve({ default: component }), ms),
    )
  }
}`

const routerJs = `import { createRouter, createMemoryHistory, isNavigationFailure, NavigationFailureType } from 'vue-router'
import { simulateLazy, isNavigating } from './lazy.js'
import HomePage from './HomePage.vue'
import UsersLayout from './UsersLayout.vue'
import UserList from './UserList.vue'
import UserProfile from './UserProfile.vue'
import ProfileOverview from './ProfileOverview.vue'
import ProfileActivity from './ProfileActivity.vue'
import ReportsPage from './ReportsPage.vue'
import NotFound from './NotFound.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    {
      path: '/users',
      component: UsersLayout,
      children: [
        { path: '', name: 'users', component: UserList },
        {
          path: ':id(\\\\d+)',
          component: UserProfile,
          props: true,
          children: [
            { path: '', name: 'user', component: ProfileOverview },
            { path: 'activity', name: 'user-activity', component: ProfileActivity },
          ],
        },
      ],
    },
    // Real app: component: () => import('./ReportsPage.vue')
    { path: '/reports', name: 'reports', component: simulateLazy('reports', ReportsPage) },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
  ],
})

router.beforeEach(() => {
  isNavigating.value = true
})

router.afterEach((to, from, failure) => {
  isNavigating.value = false
  // "duplicated" = clicked the page you are on: not worth reporting
  if (failure && !isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    console.warn('Navigation failed:', failure.message)
  }
})

router.onError((error) => {
  isNavigating.value = false // afterEach is skipped when a navigation throws
  console.error('Navigation error:', error.message)
})

export default router`

const appVue = `<script setup>
import { useRoute, useRouter } from 'vue-router'
import { downloads, isNavigating } from './lazy.js'

const route = useRoute()
const router = useRouter()
</script>

<template>
  <div v-if="isNavigating" class="loading-bar">Loading…</div>

  <header class="bar">
    <button class="back" title="Back" @click="router.back()">←</button>
    <button class="forward" title="Forward" @click="router.forward()">→</button>
    <code class="url">{{ route.fullPath }}</code>
  </header>

  <nav class="nav">
    <RouterLink to="/">Home</RouterLink>
    <RouterLink :to="{ name: 'users' }" class="to-users">People</RouterLink>
    <RouterLink to="/reports" class="to-reports">Reports</RouterLink>
  </nav>

  <main class="page">
    <RouterView />
  </main>

  <footer class="chunks">
    Chunks downloaded: <span class="downloads">{{ downloads.join(', ') || 'none yet' }}</span>
  </footer>
</template>

<style scoped>
.loading-bar { background: #d7ff3a; padding: 2px 8px; font-weight: bold; }
.bar { display: flex; gap: 6px; align-items: center; background: #eee; padding: 6px; border-radius: 6px; }
.url { flex: 1; background: white; padding: 2px 8px; border-radius: 4px; }
.nav { display: flex; gap: 12px; margin: 8px 0; }
.nav a.router-link-active { font-weight: bold; }
.page { border: 2px solid #222; padding: 12px; min-height: 160px; }
.chunks { font-family: monospace; font-size: 12px; margin-top: 6px; }
</style>`

const homeVue = `<template>
  <h2>Welcome</h2>
  <p>Every screen in this app has a URL — even the filters. Try these, then use ← and →:</p>
  <ul>
    <li><RouterLink :to="{ name: 'users', query: { role: 'admin' } }" class="link-admins">All admins</RouterLink></li>
    <li><RouterLink :to="{ name: 'users', query: { q: 'gr' } }">People matching "gr"</RouterLink></li>
    <li><RouterLink :to="{ name: 'user-activity', params: { id: 2 } }">Grace's activity</RouterLink></li>
    <li><RouterLink to="/users/99">A profile that doesn't exist</RouterLink></li>
    <li><RouterLink to="/nope">A page that doesn't exist</RouterLink></li>
  </ul>
</template>`

const usersLayoutVue = `<template>
  <section class="users-layout">
    <h2>People</h2>
    <!-- child routes (the list or one profile) render here -->
    <RouterView />
  </section>
</template>`

const userListVue = `<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { users } from './users.js'

const route = useRoute()
const router = useRouter()

// READ: the URL is the source of truth. Parse it, with safe defaults.
const filters = computed(() => ({
  q: typeof route.query.q === 'string' ? route.query.q : '',
  role: ['admin', 'member'].includes(route.query.role) ? route.query.role : 'all',
}))

const visible = computed(() => {
  const q = filters.value.q.toLowerCase()
  return users.filter((u) =>
    u.name.toLowerCase().includes(q) &&
    (filters.value.role === 'all' || u.role === filters.value.role))
})

// WRITE: a filter change becomes a navigation.
function setFilter(key, value) {
  router.push({ query: { ...route.query, [key]: value } })
}
</script>

<template>
  <div class="filters">
    <input
      class="search"
      placeholder="Search by name"
      :value="filters.q"
      @input="setFilter('q', $event.target.value)"
    />
    <select class="role" :value="filters.role" @change="setFilter('role', $event.target.value)">
      <option value="all">All roles</option>
      <option value="admin">Admins</option>
      <option value="member">Members</option>
    </select>
  </div>

  <p class="count">{{ visible.length }} of {{ users.length }} people</p>
  <ul class="user-list">
    <li v-for="user in visible" :key="user.id" class="user">
      <RouterLink :to="{ name: 'user', params: { id: user.id } }">{{ user.name }}</RouterLink>
      <small> · {{ user.role }} · {{ user.team }}</small>
    </li>
  </ul>
</template>`

const userProfileVue = `<script setup>
import { computed } from 'vue'
import { findUser } from './users.js'

// props: true in the route passes the :id param in as a prop (a string)
const props = defineProps({ id: { type: String, required: true } })
const user = computed(() => findUser(props.id))
</script>

<template>
  <article v-if="user" class="profile">
    <RouterLink :to="{ name: 'users' }" class="back-to-list">← All people</RouterLink>
    <h3 class="profile-name">{{ user.name }}</h3>
    <nav class="tabs">
      <RouterLink :to="{ name: 'user', params: { id } }" class="to-overview">Overview</RouterLink> ·
      <RouterLink :to="{ name: 'user-activity', params: { id } }" class="to-activity">Activity</RouterLink>
    </nav>
    <!-- attributes on RouterView are passed to the child route's component -->
    <RouterView :user="user" />
  </article>
</template>`

const profileOverviewVue = `<script setup>
defineProps({ user: { type: Object, required: true } })
</script>

<template>
  <dl class="overview">
    <dt>Team</dt><dd>{{ user.team }}</dd>
    <dt>Role</dt><dd>{{ user.role }}</dd>
    <dt>Joined</dt><dd>{{ user.joined }}</dd>
  </dl>
</template>`

const profileActivityVue = `<script setup>
import { computed } from 'vue'
import { activityFor } from './users.js'

const props = defineProps({ user: { type: Object, required: true } })
const items = computed(() => activityFor(props.user.id))
</script>

<template>
  <h4>Recent activity</h4>
  <ul v-if="items.length">
    <li v-for="item in items" :key="item" class="activity-item">{{ item }}</li>
  </ul>
  <p v-else class="no-activity">Nothing recent.</p>
</template>`

const reportsVue = `<template>
  <h2>Reports</h2>
  <p>A heavy page (imagine charts) — loaded only when someone opens it.</p>
</template>`

const notFoundVue = `<template>
  <h2 class="not-found-page">Page not found</h2>
  <p>Nothing lives at <code>{{ $route.fullPath }}</code>.</p>
  <RouterLink to="/">Go home</RouterLink>
</template>`

const baseFiles = {
  'main.js': mainJs,
  'router.js': routerJs,
  'lazy.js': lazyJs,
  'users.js': usersJs,
  'App.vue': appVue,
  'HomePage.vue': homeVue,
  'UsersLayout.vue': usersLayoutVue,
  'UserList.vue': userListVue,
  'UserProfile.vue': userProfileVue,
  'ProfileOverview.vue': profileOverviewVue,
  'ProfileActivity.vue': profileActivityVue,
  'ReportsPage.vue': reportsVue,
  'NotFound.vue': notFoundVue,
}

const userListSolved = userListVue.replace(
  `// WRITE: a filter change becomes a navigation.
function setFilter(key, value) {
  router.push({ query: { ...route.query, [key]: value } })
}`,
  `const DEFAULTS = { q: '', role: 'all' }

// WRITE: a filter change becomes a navigation.
// replace: typing should not add a history entry per keystroke.
// undefined: the router drops the key, so defaults stay out of the URL.
function setFilter(key, value) {
  router.replace({
    query: { ...route.query, [key]: value === DEFAULTS[key] ? undefined : value },
  })
}`,
)

const userProfileSolved = userProfileVue.replace(
  `    <RouterView :user="user" />
  </article>`,
  `    <RouterView :user="user" />
  </article>
  <div v-else class="not-found">
    <p>No one with id {{ id }} works here.</p>
    <RouterLink :to="{ name: 'users' }">← All people</RouterLink>
  </div>`,
)

const routerSolved = routerJs.replace(
  "{ path: 'activity', name: 'user-activity', component: ProfileActivity },",
  "{ path: 'activity', name: 'user-activity', component: simulateLazy('activity', ProfileActivity) },",
)

// ---------- exercise 1: URL-driven catalogue filters
const productsJs = `export const products = [
  { id: 1, name: 'Vue in Action', category: 'books', inStock: true },
  { id: 2, name: 'Pixel Quest', category: 'games', inStock: false },
  { id: 3, name: 'Lo-fi Beats Vol. 2', category: 'music', inStock: true },
  { id: 4, name: 'The Router Handbook', category: 'books', inStock: false },
  { id: 5, name: 'Puzzle Garden', category: 'games', inStock: true },
  { id: 6, name: 'Synth Dreams', category: 'music', inStock: false },
  { id: 7, name: 'JavaScript Notes', category: 'books', inStock: true },
  { id: 8, name: 'Kart Racers', category: 'games', inStock: true },
]`

const catalogRouter = `import { createRouter, createMemoryHistory } from 'vue-router'
import CatalogPage from './CatalogPage.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { render: () => 'Home' } },
    { path: '/products', component: CatalogPage },
  ],
})`

const catalogStarter = `<script setup>
import { ref, computed } from 'vue'
import { products } from './products.js'

const PAGE_SIZE = 3

// TODO: these three values should live in the URL, not in local refs
const category = ref('all')
const inStock = ref(false)
const page = ref(1)

const filtered = computed(() =>
  products.filter((p) =>
    (category.value === 'all' || p.category === category.value) &&
    (!inStock.value || p.inStock)))
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
</script>

<template>
  <select v-model="category" class="category">
    <option value="all">All categories</option>
    <option value="books">Books</option>
    <option value="games">Games</option>
    <option value="music">Music</option>
  </select>
  <label><input v-model="inStock" type="checkbox" class="in-stock" /> In stock only</label>

  <ul>
    <li v-for="p in visible" :key="p.id" class="product">
      {{ p.name }} <small>{{ p.category }} · {{ p.inStock ? 'in stock' : 'sold out' }}</small>
    </li>
  </ul>

  <button class="prev-page" :disabled="page === 1" @click="page--">Previous</button>
  <span class="page-info">Page {{ page }} of {{ pageCount }}</span>
  <button class="next-page" :disabled="page === pageCount" @click="page++">Next</button>
</template>`

const catalogSolution = `<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { products } from './products.js'

const PAGE_SIZE = 3
const CATEGORIES = ['books', 'games', 'music']

const route = useRoute()
const router = useRouter()

// 1. READ: URL -> state. Validate everything; fall back to defaults.
const category = computed(() =>
  CATEGORIES.includes(route.query.category) ? route.query.category : 'all')
const inStock = computed(() => route.query.stock === '1')

const filtered = computed(() =>
  products.filter((p) =>
    (category.value === 'all' || p.category === category.value) &&
    (!inStock.value || p.inStock)))
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const page = computed(() => {
  const n = Number(route.query.page) // query values are strings
  return Number.isInteger(n) && n >= 1 && n <= pageCount.value ? n : 1
})
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

// 2. WRITE: state -> URL. Defaults are omitted; replace avoids history spam.
function update(changes) {
  const next = { category: category.value, inStock: inStock.value, page: page.value, ...changes }
  router.replace({
    query: {
      category: next.category === 'all' ? undefined : next.category,
      stock: next.inStock ? '1' : undefined,
      page: next.page > 1 ? String(next.page) : undefined,
    },
  })
}
</script>

<template>
  <select class="category" :value="category" @change="update({ category: $event.target.value, page: 1 })">
    <option value="all">All categories</option>
    <option value="books">Books</option>
    <option value="games">Games</option>
    <option value="music">Music</option>
  </select>
  <label>
    <input type="checkbox" class="in-stock" :checked="inStock" @change="update({ inStock: $event.target.checked, page: 1 })" />
    In stock only
  </label>

  <ul>
    <li v-for="p in visible" :key="p.id" class="product">
      {{ p.name }} <small>{{ p.category }} · {{ p.inStock ? 'in stock' : 'sold out' }}</small>
    </li>
  </ul>

  <button class="prev-page" :disabled="page === 1" @click="update({ page: page - 1 })">Previous</button>
  <span class="page-info">Page {{ page }} of {{ pageCount }}</span>
  <button class="next-page" :disabled="page === pageCount" @click="update({ page: page + 1 })">Next</button>
</template>`

const catalogShared = {
  'main.js': mainJs,
  'router.js': catalogRouter,
  'products.js': productsJs,
  'App.vue': `<template>
  <RouterView />
</template>`,
}

// ---------- exercise 2: reporting navigation failures
const lockJs = `import { ref } from 'vue'

export const billingLocked = ref(true)`

const failuresRouter = `import { createRouter, createMemoryHistory } from 'vue-router'
import { billingLocked } from './lock.js'

const Page = (label) => ({ render: () => label })

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Page('Home page') },
    { path: '/settings', component: Page('Settings page') },
    { path: '/billing', component: Page('Billing page') },
  ],
})

// Billing is closed while locked: the guard cancels the navigation.
router.beforeEach((to) => {
  if (to.path === '/billing' && billingLocked.value) return false
})

export default router`

const failuresStarter = `<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { billingLocked } from './lock.js'

const router = useRouter()
const status = ref('')

function toggleLock(event) {
  billingLocked.value = event.target.checked
}

async function go(path) {
  await router.push(path)
  // TODO: this message is a lie when the navigation did not happen
  status.value = 'Moved to ' + path
}
</script>

<template>
  <button class="go-home" @click="go('/')">Home</button>
  <button class="go-settings" @click="go('/settings')">Settings</button>
  <button class="go-billing" @click="go('/billing')">Billing</button>
  <label><input type="checkbox" class="lock" :checked="billingLocked" @change="toggleLock" /> Billing locked</label>
  <p class="nav-status">{{ status }}</p>
  <RouterView />
</template>`

const failuresSolution = `<script setup>
import { ref } from 'vue'
import { useRouter, isNavigationFailure, NavigationFailureType } from 'vue-router'
import { billingLocked } from './lock.js'

const router = useRouter()
const status = ref('')

function toggleLock(event) {
  billingLocked.value = event.target.checked
}

async function go(path) {
  // push() RESOLVES with a failure object when the navigation didn't happen
  // (it only rejects for real errors, e.g. a guard that throws)
  const failure = await router.push(path)

  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    status.value = 'Blocked by a guard'
  } else if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    status.value = 'Already on ' + path
  } else if (failure) {
    status.value = 'Navigation did not finish' // e.g. cancelled by a newer one
  } else {
    status.value = 'Moved to ' + path
  }
}
</script>

<template>
  <button class="go-home" @click="go('/')">Home</button>
  <button class="go-settings" @click="go('/settings')">Settings</button>
  <button class="go-billing" @click="go('/billing')">Billing</button>
  <label><input type="checkbox" class="lock" :checked="billingLocked" @change="toggleLock" /> Billing locked</label>
  <p class="nav-status">{{ status }}</p>
  <RouterView />
</template>`

const failuresShared = { 'main.js': mainJs, 'router.js': failuresRouter, 'lock.js': lockJs }

// ---------- interview coding: debounced search in the URL
const searchRouter = `import { createRouter, createMemoryHistory } from 'vue-router'
import SearchPage from './SearchPage.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { render: () => 'Home' } },
    { path: '/search', component: SearchPage },
  ],
})`

const searchStarter = `<script setup>
import { ref, computed } from 'vue'

const tools = ['Vue Router', 'Pinia', 'Vite', 'Vitest', 'Vue Test Utils', 'Nuxt']

// TODO: the search term should come from (and go to) ?q= in the URL
const term = ref('')
const results = computed(() =>
  tools.filter((t) => t.toLowerCase().includes(term.value.toLowerCase())))
</script>

<template>
  <input v-model="term" class="search" placeholder="Search tools" />
  <ul>
    <li v-for="tool in results" :key="tool" class="result">{{ tool }}</li>
  </ul>
</template>`

const searchSolution = `<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const tools = ['Vue Router', 'Pinia', 'Vite', 'Vitest', 'Vue Test Utils', 'Nuxt']
const route = useRoute()
const router = useRouter()

// What the URL says — the source of truth for the results
const query = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
// What the user is typing right now (can be ahead of the URL)
const term = ref(query.value)

// URL -> input (Back/Forward, links, shared URLs)
watch(query, (q) => {
  term.value = q
})

// input -> URL, 300 ms after the last keystroke
let timer = null
function onInput(event) {
  term.value = event.target.value
  clearTimeout(timer)
  timer = setTimeout(() => {
    router.replace({ query: { ...route.query, q: term.value || undefined } })
  }, 300)
}
onBeforeUnmount(() => clearTimeout(timer))

const results = computed(() =>
  tools.filter((t) => t.toLowerCase().includes(query.value.toLowerCase())))
</script>

<template>
  <input :value="term" class="search" placeholder="Search tools" @input="onInput" />
  <ul>
    <li v-for="tool in results" :key="tool" class="result">{{ tool }}</li>
  </ul>
</template>`

const searchShared = {
  'main.js': mainJs,
  'router.js': searchRouter,
  'App.vue': `<template>
  <RouterView />
</template>`,
}

export default {
  id: 'router-in-practice',
  title: 'Router in practice: filters, errors & tests',
  summary: 'Put filters in the URL, tell navigation failures from errors, test routes with a real in-memory router, and combine it all in a mini app with nested routes, profiles and lazy pages.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['dynamic-routes', 'nested-named-routes', 'navigation-guards', 'lazy-routes-scroll'],
  related: ['search-pagination', 'cancellation-race-conditions', 'testing-async-routing', 'error-handling', 'router-basics', 'project-admin-dashboard'],
  tags: ['vue router', 'query string', 'filters', 'URL state', 'router.replace', 'navigation failure', 'isNavigationFailure', 'NavigationFailureType', 'onError', 'testing', 'createMemoryHistory', 'isReady'],
  apis: [
    { name: 'route.query', summary: 'The parsed query string: values are strings, `null` (key without value) or arrays of those.' },
    { name: 'router.replace()', summary: 'Navigates like push() but replaces the current history entry — ideal for filter changes.' },
    { name: 'isNavigationFailure(failure, type?)', summary: 'Checks whether a value returned by push()/replace() (or given to afterEach) is a navigation failure, optionally of a given type.' },
    { name: 'NavigationFailureType', summary: '`aborted` (a guard returned false), `cancelled` (a newer navigation started), `duplicated` (already at that location).' },
    { name: 'router.isReady()', summary: 'Promise that resolves once the router has completed its initial navigation — await it in tests and SSR before mounting/asserting.' },
  ],
  docs: [
    { label: 'Vue Router — Waiting for the result of a Navigation', url: 'https://router.vuejs.org/guide/advanced/navigation-failures.html' },
    { label: 'Vue Router — Programmatic Navigation (push / replace)', url: 'https://router.vuejs.org/guide/essentials/navigation.html' },
    { label: 'Vue Router — Passing Props to Route Components', url: 'https://router.vuejs.org/guide/essentials/passing-props.html' },
    { label: 'Vue Test Utils — Testing Vue Router', url: 'https://test-utils.vuejs.org/guide/advanced/vue-router' },
  ],

  intro: `
You know the pieces of Vue Router: [routes and links](lesson:router-basics), [params and query strings](lesson:dynamic-routes), [nested routes](lesson:nested-named-routes), [guards](lesson:navigation-guards) and [lazy pages](lesson:lazy-routes-scroll). This lesson is about using them together the way production apps do.

Three habits separate a "works on my machine" router from a solid one:

1. **The URL holds the state people care about** — search terms, filters, the current page — so links can be shared, refreshed and navigated with Back.
2. **You know when a navigation didn't happen**, and whether that was expected (a *navigation failure*) or a real problem (an *error*).
3. **Routing behaviour is tested** with a real router, not just clicked through by hand.

You'll finish with a mini team-directory app that combines nested routes, dynamic user profiles, query filters and lazy-loaded pages.
`,

  why: `
Imagine a support agent filters the team list to "admins named Gr…", clicks into a profile, presses Back — and the filters are gone. Or they copy the URL to send a colleague, and it just says \`/users\`. That happens when filter state lives only in component refs: it dies when the component unmounts and is invisible to the address bar.

Put the same state in the query string — \`/users?role=admin&q=gr\` — and you get, for free: refresh-safe state, shareable links, bookmarks, working Back/Forward, and analytics that can see which filters people use.

The other half is honesty. \`router.push()\` doesn't always move the user: a guard may cancel it, the user may already be there, or a faster click may supersede it. Code that assumes "push finished, so we're on the new page" shows wrong messages and fires wrong analytics. And without tests, a renamed route or a reordered guard can quietly break login redirects in a way nobody notices until users complain.
`,

  eli15: `
Think of the URL as a **saved game code**. In some games you can write down a code that, when you type it back in, puts you in exactly the same level, with the same items. A good web app's URL works the same: \`/users?role=admin&q=gr\` is a code for "the People page, showing admins whose name contains gr".

If the app keeps that information only in its head (in a ref), there's no code to write down — refresh the page and you're back at the start.

A **navigation failure** is when you press "go to level 5" and the game says "you're already on level 5" or "that door is locked". Nothing broke; you just didn't move. An **error** is when the game crashes while loading level 5. You handle those two very differently.

**Testing** routes is like having a robot play the game every night: it types the codes, presses the buttons, and checks it ends up where it should.
`,

  analogy: {
    title: 'The saved-game code',
    body: `
A save code captures everything needed to restore a moment in the game. You can write it on paper, give it to a friend, or type it again tomorrow. The game never has to "remember" anything else — it reads the code and rebuilds the screen.

In a router-driven app the URL is that code. Components *read* the code (\`route.query\`) to decide what to show, and *write* a new code (\`router.replace({ query })\`) when the player changes something. As long as every bit of state you care about is in the code, refreshing, sharing and Back all just work.
`,
    mapping: [
      ['the save code', 'the URL: path + query string'],
      ['typing the code in', 'opening a link / refreshing: components read `route.query`'],
      ['changing your loadout', 'changing a filter: `router.replace({ query })`'],
      ['a code with a typo', 'an invalid query value → fall back to a default'],
      ['"you are already here" / "door locked"', 'navigation failures: duplicated / aborted'],
      ['the game crashing while loading', 'a navigation error → `router.onError()`'],
      ['the robot that plays every night', 'automated route tests with `createMemoryHistory()`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The URL ⇄ state loop',
    caption: 'Data flows in one circle: URL → route.query → parsed filters → rendered list → user input → router.replace → URL. Nothing else stores the filters.',
    alt: 'A loop of six boxes. The URL with a query string feeds route.query, which feeds a computed "filters" box with parsing and defaults, which feeds the rendered list. The user changes an input, which calls router.replace with a new query, which updates the URL, closing the loop. Back, Forward, refresh and shared links all enter the loop at the URL box.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'url', label: 'URL', note: '/users?role=admin&q=gr', tone: 'acid' },
        { id: 'query', label: 'route.query', note: '{ role: \'admin\', q: \'gr\' }', tone: 'cobalt' },
        { id: 'filters', label: 'computed filters', note: 'parse · validate · defaults' },
        { id: 'replace', label: 'router.replace({ query })', note: 'defaults → undefined', tone: 'kraft' },
        { id: 'input', label: 'User changes a filter', note: 'select / input', tone: 'red' },
        { id: 'list', label: 'Rendered list', note: '2 of 6 people', tone: 'paper' },
      ],
      edges: [
        { from: 'url', to: 'query', label: 'router parses' },
        { from: 'query', to: 'filters' },
        { from: 'filters', to: 'list', label: 'computed' },
        { from: 'list', to: 'input', dashed: true },
        { from: 'input', to: 'replace' },
        { from: 'replace', to: 'url', label: 'new navigation' },
      ],
      steps: [
        { focus: ['url'], text: 'Everything starts at the URL. A shared link, a refresh, a bookmark, or Back/Forward all land here.' },
        { focus: ['query'], edges: ['url->query'], text: 'The router parses the query string into `route.query`. It is reactive: when the URL changes, components that read it update.' },
        { focus: ['filters'], edges: ['query->filters'], text: 'A `computed` turns raw query values into trusted filters: strings only, allowed values only, defaults for anything missing or invalid. **Never trust the URL** — anyone can type anything into it.' },
        { focus: ['list'], edges: ['filters->list'], text: 'The list is derived from the filters. No `watch`, no copies, no local refs to keep in sync.' },
        { focus: ['input'], edges: ['list->input'], text: 'The user picks "Admins" or types a name. The input shows the current filter value but does not own it.' },
        { focus: ['replace'], edges: ['input->replace'], text: '`router.replace({ query })` writes the change. Defaults become `undefined` so they disappear from the URL; `replace` avoids one history entry per keystroke.' },
        { focus: ['url', 'query', 'filters', 'list'], edges: ['replace->url', 'url->query', 'query->filters', 'filters->list'], text: 'The new URL flows around the same loop. One path for every way state can change — that is why Back, refresh and shared links can\'t get out of sync.' },
      ],
    },
  },

  syntax: [
    `
#### Query-driven filters: read from the URL, write to the URL
`,
    {
      code: `const route = useRoute()
const router = useRouter()

// READ — parse and validate; the URL is user input
const role = computed(() =>
  ['admin', 'member'].includes(route.query.role) ? route.query.role : 'all')
const page = computed(() => {
  const n = Number(route.query.page)          // query values are STRINGS
  return Number.isInteger(n) && n > 0 ? n : 1
})

// WRITE — keep other keys, drop defaults, don't spam history
function setRole(value) {
  router.replace({
    query: { ...route.query, role: value === 'all' ? undefined : value, page: undefined },
  })
}`,
      lang: 'js',
      title: 'the core pattern',
    },
    `
Rules of thumb:

- **Derive, don't copy.** Use \`computed(() => route.query.x)\`, not \`ref(route.query.x)\` — a copy is taken once and ignores Back/Forward and links.
- **Query values are strings** (\`'2'\`, not \`2\`), \`null\` for a key without a value (\`?draft\`), or an **array** when the key repeats (\`?tag=a&tag=b\` → \`['a', 'b']\`). Parse and validate.
- **\`undefined\` removes a key.** \`{ q: undefined }\` disappears from the URL; \`null\` gives \`?q\`; \`''\` gives \`?q=\`.
- \`router.replace()\` for filter tweaks (one history entry for "this search"), \`router.push()\` for real page changes. Many apps push for deliberate changes (a new page of results) and replace for typing — pick a policy and apply it consistently.
- **Reset dependent state.** Changing a filter usually resets \`page\`.
- **Debounce text inputs** before writing them to the URL so each keystroke doesn't trigger a navigation (and maybe a request).
- If filters drive an API request, \`watch\` the parsed filters (or specific query keys) and fetch — and handle out-of-order responses ([cancellation & race conditions](lesson:cancellation-race-conditions)).

#### Navigation failures vs errors
`,
    {
      code: `import { isNavigationFailure, NavigationFailureType } from 'vue-router'

const failure = await router.push('/billing')   // resolves either way

if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
  // a guard returned false
} else if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
  // we were already there
} else if (isNavigationFailure(failure, NavigationFailureType.cancelled)) {
  // a newer navigation started before this one finished
} else {
  // success: the route changed
}

router.afterEach((to, from, failure) => { /* same failure object, or undefined */ })

router.onError((error, to, from) => {
  // real errors: a guard threw, a lazy chunk failed to load…
  // router.push() REJECTS with these
})`,
      lang: 'js',
      title: 'failures resolve, errors reject',
    },
    `
A *navigation failure* is an expected "didn't move" outcome; \`push()\` resolves with a failure object (\`failure.to\`, \`failure.from\`, \`failure.type\`). An *error* is unexpected — something threw — and \`push()\` rejects while \`router.onError\` handlers run. \`<RouterLink>\` catches rejections for you, so for clicks, \`onError\` is where errors surface.

#### Testing routes (Vitest + Vue Test Utils, static example)
`,
    {
      code: `import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { test, expect } from 'vitest'
import App from '@/App.vue'
import { routes, installGuards } from '@/router'

// A FRESH router per test — routers hold state (current route, history)
async function renderAt(path) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  installGuards(router)
  router.push(path)
  await router.isReady()                    // initial navigation finished
  const wrapper = mount(App, { global: { plugins: [router] } })
  return { wrapper, router }
}

test('filters are restored from the URL', async () => {
  const { wrapper } = await renderAt('/users?role=admin')
  expect(wrapper.findAll('.user')).toHaveLength(2)
  expect(wrapper.find('select.role').element.value).toBe('admin')
})

test('changing a filter updates the query', async () => {
  const { wrapper, router } = await renderAt('/users')
  await wrapper.find('select.role').setValue('member')
  await flushPromises()                     // let the navigation settle
  expect(router.currentRoute.value.query.role).toBe('member')
})

test('signed-out users are sent to login', async () => {
  const { router } = await renderAt('/account')
  expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/account')
})`,
      lang: 'js',
      title: 'router.test.js — a real project (not runnable here)',
      static: true,
    },
    {
      callout: 'tip',
      title: 'Structure for testability',
      text: 'Export `routes` (and a function that installs your guards) separately from the app\'s router instance, so tests can build fresh routers with `createMemoryHistory()`. For a unit test of a single component you can also mock `useRoute()`/`useRouter()`, but a real router exercises far more of the actual behaviour. More in [testing async code & routing](lesson:testing-async-routing).',
    },
  ],

  walkthrough: {
    title: 'UserList.vue',
    lang: 'vue',
    code: userListVue,
    intro: 'The heart of the mini app: a list whose filters live in the URL. Step through it, then fix its two production problems in the experiments.',
    steps: [
      { lines: [6, 7], text: '`useRoute()` gives the reactive current location (`route.query`, `route.params`…); `useRouter()` gives the router instance for navigating.' },
      { lines: [9, 13], text: '**Read** the filters from `route.query` in a `computed`. Every value is checked: only strings for `q`, only known roles for `role`. Anything else falls back to a default, because a URL is user input.' },
      { lines: [15, 20], text: 'The visible list is derived from the filters. There is no local copy of the state to keep in sync — Back/Forward and shared links "just work".' },
      { lines: [22, 25], text: '**Write** a change by navigating. Spreading `route.query` keeps the other filter. Two problems: `push` adds a history entry per keystroke, and defaults like `role=all` and `q=` stay in the URL. Experiments 1 and 2 fix them.' },
      { lines: [30, 35], text: 'The input *displays* the filter (`:value`) and *reports* changes (`@input`), but the URL owns the value. No `v-model` on local state.' },
      { lines: [36, 40], text: 'Same for the select. Open `/users?role=member` directly and the select is already on "Members".' },
      { lines: [45, 48], text: 'Each row links to a **named, dynamic** route: `{ name: \'user\', params: { id } }` builds `/users/2` — no string concatenation.' },
    ],
  },

  playground: {
    title: 'Team directory',
    objective: 'Explore an app that combines nested routes, dynamic profiles, query filters and lazy pages — then fix the problems a real user would hit.',
    files: baseFiles,
    expected: 'A fake address bar showing the current URL, ← → buttons, and nav links. **People** shows six people with a search box and a role filter; every change appears in the URL. Click a name for a nested profile with **Overview** / **Activity** tabs. **Reports** loads after a short simulated download (watch "Chunks downloaded"). `/nope` shows the 404 page, but `/users/99` currently shows an empty profile area.',
    experiments: [
      {
        id: 'omit-defaults',
        task: 'On **People**, choose **Admins** and then **All roles** again: the URL says `?role=all`. Type a letter and delete it: `?q=` sticks around. Change `setFilter` in `UserList.vue` so default values (`\'\'` for `q`, `\'all\'` for `role`) are **removed** from the URL.',
        hint: 'The router drops query keys whose value is `undefined`. Map defaults to `undefined`: `[key]: value === \'\' || value === \'all\' ? undefined : value` (or keep a `DEFAULTS` object).',
        tests: [
          {
            name: 'choosing "All roles" removes role from the URL',
            code: `const router = requireModule('router.js').default
await router.push('/users')
await flush()
await select('.role', 'admin')
expect(router.currentRoute.value.fullPath).toBe('/users?role=admin')
await select('.role', 'all')
expect(router.currentRoute.value.fullPath).toBe('/users')`,
          },
          {
            name: 'clearing the search removes q from the URL',
            code: `const router = requireModule('router.js').default
await router.push('/users')
await flush()
await type('.search', 'ad')
await type('.search', '')
expect(router.currentRoute.value.fullPath).toBe('/users')`,
          },
        ],
        explain: 'Clean URLs are easier to read, share and compare — `/users` and `/users?role=all&q=` mean the same thing, so they should look the same. Because the read side already falls back to defaults, dropping them from the URL loses nothing.',
      },
      {
        id: 'replace-history',
        task: 'Type `ada` into the search, then press **←**. You step back through `ad`, then `a`… Users expect Back to leave the page. Switch the filter navigation to `router.replace` so filter changes don\'t pile up history entries.',
        hint: 'Change `router.push(` to `router.replace(` inside `setFilter`. The arguments stay the same.',
        tests: [
          {
            name: 'Back leaves the list instead of undoing keystrokes',
            code: `const router = requireModule('router.js').default
await router.push('/users')
await flush()
await type('.search', 'a')
await type('.search', 'ad')
expect(router.currentRoute.value.query.q).toBe('ad')
router.back()
await wait(50)
expect(router.currentRoute.value.path).toBe('/')`,
          },
        ],
        explain: '`replace` swaps the current history entry instead of adding one, so the whole search session is a single entry. A common policy: `replace` while the user is tweaking (typing, toggling), `push` when they deliberately move somewhere new.',
      },
      {
        id: 'missing-profile',
        task: 'Open `/users/99` (the Home page links to it): the URL is valid for the route pattern, but no such person exists, so nothing renders. In `UserProfile.vue`, add a `v-else` block with `class="not-found"` that says **No one with id 99 works here.** (use the real id) and links back to the list.',
        hint: 'Right after the `<article v-if="user">…</article>`, add `<div v-else class="not-found">No one with id {{ id }} works here. …</div>`.',
        tests: [
          {
            name: 'an unknown profile id shows a helpful message',
            code: `const router = requireModule('router.js').default
await router.push('/users/99')
await flush()
expect(exists('.not-found')).toBe(true)
expect(text('.not-found')).toContain('99')`,
          },
        ],
        explain: 'The catch-all route handles URLs that match **no route** (`/nope`, or `/users/abc` thanks to the `(\\d+)` param pattern). A URL that matches a route but points at **missing data** (`/users/99`) must be handled by the page itself — often by rendering a not-found state, or redirecting to the 404 route while keeping the original URL in a param or query.',
      },
      {
        id: 'lazy-activity',
        task: 'The Activity tab is a nested child route that most people never open. Make it lazy with the helper: `simulateLazy(\'activity\', ProfileActivity)` (in a real app: `() => import(\'./ProfileActivity.vue\')`).',
        hint: 'In `router.js`, change the `component` of the `user-activity` child route.',
        tests: [
          {
            name: 'the activity chunk downloads when the tab is first opened',
            code: `const router = requireModule('router.js').default
await router.push('/users/1')
await flush()
expect(text('.downloads')).not.toContain('activity')
await click('.to-activity')
await wait(500)
expect(text('.downloads')).toContain('activity')
expect(exists('.activity-item')).toBe(true)`,
          },
        ],
        explain: 'Child routes can be lazy just like top-level ones; the parent (`UserProfile`) stays loaded and only the tab content is fetched. The loading bar from `router.js` shows while it loads, because `beforeEach`/`afterEach` bracket every navigation — including ones between nested children.',
      },
    ],
    variants: [
      {
        id: 'solved',
        label: 'All experiments solved',
        files: { ...baseFiles, 'UserList.vue': userListSolved, 'UserProfile.vue': userProfileSolved, 'router.js': routerSolved },
      },
    ],
  },

  animation: {
    type: 'router',
    props: { preset: 'nested' },
    title: 'Nested routes rendering into nested views',
    caption: 'Pick a URL like `/users/2/activity` and see which records match — layout, profile, tab — and which `<RouterView>` each one renders into.',
    alt: 'An interactive router diagram with nested routes. Entering a URL highlights the matched records from parent to child; each record renders its component into the RouterView of its parent, producing nested boxes: the app shell, the users layout, the profile, and the active tab.',
  },

  internals: {
    beginner: `
When the URL changes, the router turns it into a plain object — path, params, query — and swaps that object into \`route\`. Anything on screen that read \`route.query\` re-renders, just like with any other reactive state.

When you call \`router.replace({ query })\`, the router builds a new URL from your object, runs the guards, and — if nobody objects — updates the history entry and \`route\`. The list updates because it is computed from \`route.query\`. There is only one direction of truth: URL → state → screen.
`,
    technical: [
      `
**Parsing and stringifying.** The router parses the query string with its \`parseQuery\` and writes it with \`stringifyQuery\`: repeated keys become arrays, a key without \`=\` becomes \`null\`, and keys whose value is \`undefined\` are omitted. Values are encoded for you (\`{ q: 'a b' }\` → \`?q=a+b\`), so never build query strings by hand.

**Relative locations.** \`router.push({ query })\` without a \`path\` or \`name\` resolves against the current location, so the path and params stay and only the query changes. Each navigation produces a **new** \`route.query\` object, so a \`watch(() => route.query.q, …)\` fires when that key changes.

**What push() returns.** \`router.push()\`/\`replace()\` return a Promise:

- resolves with \`undefined\` → the navigation succeeded;
- resolves with a **navigation failure** (an \`Error\` with \`type\`, \`from\`, \`to\`) → it didn't happen, for an expected reason: *aborted* (a guard returned \`false\`), *cancelled* (a newer navigation started while this one was pending), *duplicated* (already at that exact location);
- **rejects** → something threw (a guard, a lazy loader). \`router.onError\` handlers run first.

\`afterEach\` receives the same failure as its third argument but isn't called for thrown errors.
`,
      {
        code: `// A simplified model of push() — not the real source
async function push(raw) {
  const to = resolve(raw)                    // relative to the current location
  if (isSameLocation(to, current)) return failure('duplicated')
  pending = to
  try {
    const result = await runGuardsAndLoadComponents(to, current)
    if (result === false) return failure('aborted')
    if (pending !== to) return failure('cancelled') // someone navigated meanwhile
    history.push(to.fullPath)                // or .replace for router.replace()
    current = to                             // route.query etc. update reactively
    afterEachHooks.forEach((hook) => hook(to, from))
  } catch (error) {
    errorHandlers.forEach((handler) => handler(error, to, from))
    throw error
  }
}`,
        lang: 'js',
        title: 'mental model of push() and its outcomes',
      },
      `
**isReady().** \`router.isReady()\` returns a Promise that resolves when the router has finished its *initial* navigation (and rejects if that navigation errored). Tests and SSR await it so they don't assert against \`START_LOCATION\`. In a browser app you rarely need it because \`<RouterView>\` renders nothing until a route is matched.

**Props from params.** With \`props: true\`, the router passes \`route.params\` as props, so \`UserProfile\` receives \`id\` (a string) and doesn't need \`useRoute()\` — which also makes the component easier to test in isolation.
`,
    ],
    production: `
- **Decide what belongs in the URL.** Anything a user would want to share, bookmark or get back to with Back: search terms, filters, sort, page, selected tab. Not: transient UI state (an open dropdown), secrets or personal data (URLs end up in logs, history and analytics).
- **Treat the URL as untrusted input.** Validate every value, cap numbers, ignore unknown keys. Never render query values as HTML.
- **Keep URLs stable.** Renaming a query key breaks bookmarks and shared links. If you must, accept the old key and redirect.
- **One source of truth.** If filters live in the URL, don't also keep them in a store — derive. A store is fine for *results* or caching, keyed by the filters.
- **Debounce and cancel.** Debounce text input before writing it to the URL; when the query drives requests, cancel or ignore stale responses ([cancellation & race conditions](lesson:cancellation-race-conditions)).
- **Report real errors, ignore expected failures.** Log \`router.onError\` errors (chunk loads, thrown guards) to monitoring. Duplicated failures are noise; aborted ones are usually intended by your own guards.
- **Test the routing contract:** URL → rendered state, interaction → URL, guards → redirects, unknown URLs → 404. Build a fresh router per test with \`createMemoryHistory()\`, \`await router.isReady()\` before asserting, and \`await flushPromises()\` (or \`await router.push()\`) after interactions.
`,
  },

  mistakes: [
    {
      title: 'Copying the query into a ref once',
      wrong: {
        code: `const route = useRoute()
const role = ref(route.query.role ?? 'all') // read once at setup
watch(role, (r) => router.replace({ query: { role: r } }))`,
        lang: 'js',
      },
      right: {
        code: `const route = useRoute()
const role = computed(() => route.query.role ?? 'all') // always current
function setRole(r) {
  router.replace({ query: { ...route.query, role: r === 'all' ? undefined : r } })
}`,
        lang: 'js',
      },
      explanation: 'The ref is a snapshot. When Back/Forward or a link changes the query while the component stays mounted, the ref keeps the old value and the UI lies. Derive state from `route.query` with `computed` and write changes through the router.',
    },
    {
      title: 'Doing math on query values',
      wrong: {
        code: `const next = route.query.page + 1   // '2' + 1 === '21'`,
        lang: 'js',
      },
      right: {
        code: `const page = computed(() => {
  const n = Number(route.query.page)
  return Number.isInteger(n) && n > 0 ? n : 1
})
const next = page.value + 1`,
        lang: 'js',
      },
      explanation: 'Query values are always strings (or `null`, or arrays). Parse them into the type you need and validate the result.',
    },
    {
      title: 'Using try/catch to detect a blocked navigation',
      wrong: {
        code: `try {
  await router.push('/billing')
  toast('Opened billing')          // also runs when a guard blocked it!
} catch {
  toast('Billing is locked')       // never runs for a guard returning false
}`,
        lang: 'js',
      },
      right: {
        code: `const failure = await router.push('/billing')
if (isNavigationFailure(failure, NavigationFailureType.aborted)) toast('Billing is locked')
else if (!failure) toast('Opened billing')`,
        lang: 'js',
      },
      explanation: 'Navigation failures **resolve**; only real errors reject. Check the resolved value with `isNavigationFailure()`.',
    },
    {
      title: 'Pushing a history entry on every keystroke',
      wrong: {
        code: `<input :value="q" @input="router.push({ query: { q: $event.target.value } })" />`,
        lang: 'vue',
      },
      right: {
        code: `<input :value="q" @input="onSearchInput" />
<!-- onSearchInput: debounce, then router.replace({ query: { ...route.query, q } }) -->`,
        lang: 'vue',
      },
      explanation: '`push` per keystroke makes the Back button replay the typing letter by letter, and fires a navigation (and maybe a request) for every key. Debounce, and use `replace` for in-place refinements.',
    },
    {
      title: 'Sharing one router between tests',
      wrong: {
        code: `import router from '@/router'        // the app's singleton
test('a', async () => { await router.push('/users?role=admin') /* … */ })
test('b', async () => { /* starts wherever test "a" left the router */ })`,
        lang: 'js',
      },
      right: {
        code: `import { routes } from '@/router'
const makeRouter = () => createRouter({ history: createMemoryHistory(), routes })
test('a', async () => { const router = makeRouter(); router.push('/users?role=admin'); await router.isReady() /* … */ })`,
        lang: 'js',
      },
      explanation: 'A router keeps its current location and history. Reusing it makes tests depend on their order. Create a fresh router (with memory history) per test.',
    },
  ],

  debugging: [
    {
      symptom: 'After pressing Back, the URL shows the old filters but the list still shows the new ones.',
      cause: 'The component copied `route.query` into refs once instead of deriving from it.',
      fix: 'Replace the refs with `computed(() => …route.query…)` and write changes via `router.replace`.',
    },
    {
      symptom: 'Users have to press Back many times to leave a search page.',
      cause: 'Every keystroke or toggle calls `router.push`, creating a history entry each time.',
      fix: 'Use `router.replace` for filter refinements (and debounce text input).',
    },
    {
      symptom: 'Page 2 → "Next" goes to page 21.',
      cause: 'String concatenation: `route.query.page` is the string `\'2\'`.',
      fix: 'Parse with `Number()` and validate (integer, ≥ 1, ≤ page count) before using it.',
    },
    {
      symptom: 'A "Saved, opening settings…" message appears even when a guard blocked the navigation.',
      cause: 'The code awaited `router.push()` and assumed success; blocked navigations resolve with a failure instead of rejecting.',
      fix: 'Check the result with `isNavigationFailure(result, NavigationFailureType.aborted)`.',
    },
    {
      symptom: 'Route tests pass alone but fail when run together, or assertions see the start location.',
      cause: 'A shared router instance between tests, or asserting before the initial navigation finished.',
      fix: 'Create a new router with `createMemoryHistory()` per test and `await router.isReady()` before mounting/asserting.',
    },
    {
      symptom: 'The list does not refetch when the query changes, only on first load.',
      cause: 'Data is loaded in `onMounted`; changing only the query reuses the same component, so it never mounts again.',
      fix: '`watch` the parsed filters (or specific query keys) with `immediate: true` and load there, ignoring stale responses.',
    },
  ],

  bestPractices: [
    'Keep shareable state (search, filters, sort, page, tab) in the query string; derive component state from `route.query` with `computed`.',
    'Validate every query value and fall back to defaults — the URL is user input.',
    'Omit defaults from the URL by setting them to `undefined`; reset `page` when filters change.',
    'Use `router.replace` for refinements and debounce text inputs; use `push` for deliberate moves.',
    'Check `await router.push()` results with `isNavigationFailure()`; report real errors from `router.onError`.',
    'Pass params as props (`props: true`) so page components are easy to reuse and test.',
    'Test routes with a fresh `createMemoryHistory()` router per test and `await router.isReady()`.',
  ],

  useCases: [
    'Product catalogues: `/products?category=books&stock=1&page=2` that survives refresh and can be shared.',
    'Admin tables with search, sort and pagination in the URL so support staff can send each other exact views.',
    'Team directories and CRMs with nested profile pages and tabs (`/users/2/activity`).',
    'Showing "You\'re already on this page" or "That section is locked" instead of a misleading success message.',
    'CI tests that verify login redirects, 404 handling and filter URLs on every change.',
  ],

  whenToUse: {
    use: [
      'State a user might share, bookmark, refresh or reach with Back — put it in the URL.',
      '`isNavigationFailure()` whenever code after `router.push()` assumes the navigation happened.',
      'Route-level tests for anything business-critical: auth redirects, permissions UX, deep links.',
    ],
    avoid: [
      'Putting secrets or personal data in the query string — URLs are logged, stored in history and sent in Referer headers.',
      'Putting transient UI state (hover, open menus) in the URL.',
      'Mirroring the same filters in the URL *and* a store or local refs.',
      'Mocking the whole router in tests when a real memory-history router would test the actual behaviour.',
    ],
  },

  comparison: {
    title: 'Where should this state live?',
    headers: ['', 'URL (params / query)', 'Component ref', 'Pinia store'],
    rows: [
      ['Survives refresh', 'yes', 'no', 'no (unless persisted)'],
      ['Shareable / bookmarkable', 'yes', 'no', 'no'],
      ['Back / Forward restores it', 'yes', 'no', 'no'],
      ['Shared across components', 'yes (every component can read `route`)', 'no — props/emits', 'yes'],
      ['Types', 'strings — parse & validate', 'any', 'any'],
      ['Good for', 'search, filters, sort, page, tab, ids', 'local UI state (open/closed, input drafts)', 'app-wide data, caches, session'],
    ],
    note: 'They combine well: filters in the URL, fetched results cached in a store keyed by those filters, transient UI in refs.',
  },

  quiz: [
    {
      id: 'router-in-practice-q1',
      type: 'mcq',
      prompt: 'A user types into a search box that writes `?q=` to the URL on each input event. Which method should the handler call so the Back button leaves the page instead of undoing letters?',
      options: [
        { text: '`router.replace({ query: { ...route.query, q } })`' },
        { text: '`router.push({ query: { ...route.query, q } })`', why: '`push` adds a history entry for every keystroke, so Back replays the typing.' },
        { text: '`window.location.search = \'?q=\' + q`', why: 'That triggers a full page reload and bypasses the router.' },
        { text: '`route.query.q = q`', why: '`route` is read-only; you change it by navigating.' },
      ],
      answer: 0,
      explanation: '`replace` updates the current history entry instead of adding a new one. (In real apps you would also debounce the input.)',
    },
    {
      id: 'router-in-practice-q2',
      type: 'output',
      prompt: 'The URL is `/products?page=2`. What does this log?',
      code: { lang: 'js', code: `const route = useRoute()\nconst next = route.query.page + 1\nconsole.log(next)` },
      answer: '21',
      accept: ['"21"', "'21'"],
      explanation: '`route.query.page` is the **string** `\'2\'`, so `+ 1` concatenates: `\'21\'`. Parse with `Number()` and validate first.',
    },
    {
      id: 'router-in-practice-q3',
      type: 'bug',
      prompt: 'Open `/products?category=games` and the list is correct. But clicking a link to `/products?category=books` (same page) leaves the list on games. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { products } from './products.js'

const route = useRoute()
const category = ref(route.query.category ?? 'all')
const visible = computed(() =>
  products.filter((p) => category.value === 'all' || p.category === category.value))
</script>`,
      },
      answerLine: 7,
      explanation: '`ref(route.query.category)` copies the value once during setup. The component is reused for a query-only change, so setup doesn\'t run again. Use `computed(() => route.query.category ?? \'all\')`.',
    },
    {
      id: 'router-in-practice-q4',
      type: 'fill',
      prompt: 'Complete the code so it detects that a guard blocked the navigation.',
      code: {
        lang: 'js',
        code: `const failure = ___ router.push('/billing')
if (isNavigationFailure(failure, NavigationFailureType.___)) {
  showMessage('Billing is locked')
}`,
      },
      answer: [['await'], ['aborted']],
      explanation: '`push()` returns a Promise; await it to get the failure. A guard returning `false` produces an *aborted* failure.',
    },
    {
      id: 'router-in-practice-q5',
      type: 'mcq',
      prompt: 'Which outcomes make `await router.push(…)` **resolve with a navigation failure** rather than reject? (Select all that apply.)',
      options: [
        { text: 'A `beforeEach` guard returns `false`.' },
        { text: 'The target is exactly the current location.' },
        { text: 'Another navigation starts before this one finishes.' },
        { text: 'A lazy route component fails to download.', why: 'That is an error: `router.onError` runs and `push()` rejects.' },
        { text: 'A guard throws `new Error(\'boom\')`.', why: 'Thrown errors reject the Promise and reach `router.onError`.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Aborted, duplicated and cancelled navigations are expected *failures* (resolved values). Thrown errors and failed loads are *errors* (rejections).',
    },
    {
      id: 'router-in-practice-q6',
      type: 'mcq',
      prompt: 'Why should route tests create a new router with `createMemoryHistory()` for every test?',
      options: [
        { text: 'A router keeps its current location and history, so sharing one makes tests depend on each other; memory history needs no real browser URL.' },
        { text: 'Because `createWebHistory()` is deprecated.', why: 'It isn\'t; it is what browser apps use. Memory history just avoids touching a real URL in tests.' },
        { text: 'Because routers can only navigate once.', why: 'Routers navigate many times; the problem is leftover state between tests.' },
        { text: 'Because Vue Test Utils cannot mount components that use a router.', why: 'It can: pass the router in `global.plugins`.' },
      ],
      answer: 0,
      explanation: 'Fresh, isolated routers make tests order-independent; memory history keeps location in memory, perfect for Node test runners.',
    },
    {
      id: 'router-in-practice-q7',
      type: 'short',
      prompt: 'Give three concrete benefits of storing list filters in the query string instead of in component refs.',
      answer: 'The view survives a refresh; the exact view can be shared or bookmarked as a link; Back/Forward restore previous filter states. Bonus: one source of truth (no syncing refs), and analytics/logs can see which filters were used.',
    },
  ],

  exercises: [
    {
      id: 'url-driven-catalogue',
      title: 'A catalogue whose filters live in the URL',
      difficulty: 'advanced',
      prompt: `
\`CatalogPage.vue\` (route \`/products\`) works, but its filters live in local refs: refresh, Back or a shared link loses them. Move all three into the query string.

- **Category** — \`<select class="category">\` with \`all\`, \`books\`, \`games\`, \`music\`. Query key \`category\`; omitted when \`all\`.
- **In stock only** — \`<input type="checkbox" class="in-stock">\`. Query \`stock=1\` when checked; omitted otherwise.
- **Page** — \`.prev-page\` / \`.next-page\` buttons and \`<span class="page-info">Page X of Y</span>\` (3 products per page). Query key \`page\`; omitted when 1.
- **Read** everything from \`route.query\`, validating: unknown categories → \`all\`; non-numeric or out-of-range pages → 1. Opening a URL directly must set the controls (e.g. the select shows \`books\`).
- **Write** with \`router.replace\`. Changing the category or the in-stock box resets the page to 1.
- Products render as \`<li class="product">\`, including the text \`in stock\` or \`sold out\`.
`,
      files: { ...catalogShared, 'CatalogPage.vue': catalogStarter },
      hints: [
        'Turn each ref into a `computed` that reads `route.query` (with `useRoute()`), e.g. `const inStock = computed(() => route.query.stock === \'1\')`.',
        'Write one `update(changes)` function: merge `{ category, inStock, page }` with `changes`, map defaults to `undefined`, and call `router.replace({ query: { … } })`. Pass `page: 1` along with category/stock changes.',
        'Swap `v-model` for `:value` + `@change` (select), `:checked` + `@change` (checkbox) and `@click="update({ page: page + 1 })"` (buttons). Compute `page` after `pageCount` so you can clamp it.',
      ],
      solution: {
        explanation: 'State is read from the URL through validated `computed`s and written back with one `update()` function, so there is exactly one path for every change: refresh, links, Back/Forward and clicks all go through the URL. Defaults are omitted to keep URLs short and canonical, and `replace` keeps the history clean while the user refines the view.',
        files: { ...catalogShared, 'CatalogPage.vue': catalogSolution },
      },
      tests: [
        {
          name: '?category=books shows only books and sets the select',
          code: `const router = requireModule('router.js').default
await router.push('/products?category=books')
await flush()
const items = findAll('.product')
expect(items.length).toBe(3)
expect(items.every((li) => li.textContent.includes('books'))).toBe(true)
expect(find('.category').value).toBe('books')`,
        },
        {
          name: 'an invalid category falls back to all',
          code: `const router = requireModule('router.js').default
await router.push('/products?category=zzz')
await flush()
expect(find('.category').value).toBe('all')
expect(text('.page-info')).toBe('Page 1 of 3')`,
        },
        {
          name: 'choosing a category writes it; "all" removes it',
          code: `const router = requireModule('router.js').default
await router.push('/products')
await flush()
await select('.category', 'games')
expect(router.currentRoute.value.fullPath).toBe('/products?category=games')
await select('.category', 'all')
expect(router.currentRoute.value.fullPath).toBe('/products')`,
        },
        {
          name: 'the in-stock box writes stock=1 and filters',
          code: `const router = requireModule('router.js').default
await router.push('/products')
await flush()
await check('.in-stock', true)
expect(router.currentRoute.value.query.stock).toBe('1')
expect(findAll('.product').every((li) => li.textContent.includes('in stock'))).toBe(true)`,
        },
        {
          name: 'paging writes page=2, and a filter change resets it',
          code: `const router = requireModule('router.js').default
await router.push('/products')
await flush()
await click('.next-page')
expect(router.currentRoute.value.query.page).toBe('2')
expect(text('.page-info')).toBe('Page 2 of 3')
await select('.category', 'music')
expect(router.currentRoute.value.query.page).toBeUndefined()`,
        },
        {
          name: '?page=2 is restored from the URL; ?page=abc falls back to 1',
          code: `const router = requireModule('router.js').default
await router.push('/products?page=2')
await flush()
expect(text('.page-info')).toBe('Page 2 of 3')
await router.push('/products?page=abc')
await flush()
expect(text('.page-info')).toBe('Page 1 of 3')`,
        },
        {
          name: 'filter changes use replace (Back leaves the page)',
          code: `const router = requireModule('router.js').default
await router.push('/products')
await flush()
await click('.next-page')
await select('.category', 'games')
router.back()
await wait(50)
expect(router.currentRoute.value.path).toBe('/')`,
        },
      ],
    },
    {
      id: 'report-navigation-failures',
      title: 'Tell the truth about navigations',
      difficulty: 'intermediate',
      prompt: `
Three buttons navigate with \`router.push\` and then claim **"Moved to …"** — even when nothing moved. A guard in \`router.js\` blocks \`/billing\` while the \`.lock\` checkbox is checked (it starts checked).

Fix \`go(path)\` in \`App.vue\` so \`<p class="nav-status">\` says:

- \`Moved to /settings\` (etc.) when the navigation succeeded;
- something containing \`Blocked\` when a guard cancelled it;
- something containing \`Already on\` (e.g. \`Already on /\`) when you were already there.

Use \`isNavigationFailure\` and \`NavigationFailureType\` from \`vue-router\`. Buttons: \`.go-home\`, \`.go-settings\`, \`.go-billing\`.
`,
      files: { ...failuresShared, 'App.vue': failuresStarter },
      hints: [
        'Keep the result: `const failure = await router.push(path)`. On success it is `undefined`.',
        '`isNavigationFailure(failure, NavigationFailureType.aborted)` → a guard returned `false`; `...duplicated` → already there.',
        'Check aborted, then duplicated, then any other failure, and only then report success.',
      ],
      solution: {
        explanation: '`router.push()` resolves in all three cases, so the only way to know what happened is to inspect the resolved value. A guard returning `false` gives an *aborted* failure, clicking the current page gives *duplicated*, and a navigation interrupted by a newer one gives *cancelled* (covered by the generic branch).',
        files: { ...failuresShared, 'App.vue': failuresSolution },
      },
      tests: [
        {
          name: 'a successful navigation reports "Moved to /settings"',
          code: `await click('.go-settings')
expect(text('.nav-status')).toBe('Moved to /settings')
expect(text()).toContain('Settings page')`,
        },
        {
          name: 'a guard-blocked navigation reports Blocked and stays',
          code: `await click('.go-billing')
expect(text('.nav-status')).toContain('Blocked')
expect(vm.$route.path).toBe('/')`,
        },
        {
          name: 'clicking the current page reports Already on',
          code: `await click('.go-home')
expect(text('.nav-status')).toContain('Already on')`,
        },
        {
          name: 'unlocked, billing opens',
          code: `await check('.lock', false)
await click('.go-billing')
expect(text('.nav-status')).toBe('Moved to /billing')
expect(text()).toContain('Billing page')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'router-in-practice-url-filters',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'A product list has search, category, sort and pagination. Product managers want filtered views to be shareable links. How would you build it?',
      answer: 'Make the query string the single source of truth. Read: `computed` values parsed from `route.query`, validated with defaults (unknown category → all, bad page → 1). Write: one update function that merges changes, drops defaults (`undefined`), resets `page` when filters change, and calls `router.replace` (debounced for the search box). Fetch results by watching the parsed filters, cancelling or ignoring stale responses. Cache results by filter key if needed. Test URL → UI and UI → URL.',
      explanation: 'The URL becomes a serialised view state; components only derive from it and write to it.',
      whyAsked: 'A very common real-world feature; it reveals whether you think about one source of truth, validation, history and async races.',
      mistakes: [
        'Keeping filters in refs and syncing them to the URL with watchers in both directions (loops, drift).',
        'Not validating query values.',
        '`push` on every keystroke.',
        'Forgetting to reset pagination when filters change.',
      ],
      followUps: ['How do you avoid race conditions when the user changes filters quickly?', 'What would you keep out of the URL?', 'How do you handle renamed query keys in old shared links?'],
      modelAnswer: 'I\'d treat the URL as the source of truth. Each filter is a computed that parses `route.query` and validates it against allowed values with sensible defaults, because the URL is user input. Changes go through one function that builds the next query, removes defaults so URLs stay canonical, resets the page when a filter changes, and calls `router.replace` — debounced for the text search. A watcher on the parsed filters triggers the fetch and ignores stale responses. That gives shareable links, refresh safety and working Back for free, and I\'d cover it with tests from both directions.',
    },
    {
      id: 'router-in-practice-navigation-failure',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a navigation failure in Vue Router, and how is it different from a navigation error?',
      answer: 'A navigation failure is an expected outcome where the navigation didn\'t happen: aborted (a guard returned `false`), cancelled (a newer navigation started first) or duplicated (already at that location). `router.push()` resolves with a failure object, detectable with `isNavigationFailure(result, NavigationFailureType.x)`, and `afterEach` receives it as the third argument. An error is unexpected — a guard threw or a lazy component failed to load — `push()` rejects and `router.onError` handlers run.',
      explanation: 'Failures resolve, errors reject. Both mean "the URL did not change", but only errors indicate something is broken.',
      code: {
        lang: 'js',
        code: `const result = await router.push('/admin')
if (isNavigationFailure(result, NavigationFailureType.aborted)) { /* blocked */ }
router.onError((error) => report(error)) // thrown guards, failed chunk loads`,
      },
      whyAsked: 'Shows depth beyond basic routing: correct user feedback and error reporting depend on it.',
      mistakes: ['Thinking a blocked navigation throws.', 'Treating duplicated navigations as errors worth reporting.', 'Not knowing `afterEach` gets the failure.'],
      followUps: ['When would you see a cancelled navigation?', 'Why does RouterLink not crash your app when a lazy chunk fails?'],
      modelAnswer: 'A navigation failure means the router intentionally didn\'t move: a guard returned false, the user was already there, or a newer navigation superseded this one. `push` resolves with a failure object whose type I can check with `isNavigationFailure` and `NavigationFailureType`, and `afterEach` gets it too. An error is something actually breaking — a guard throws or a chunk fails to download — so `push` rejects and `router.onError` runs. I use failures for user feedback and errors for monitoring.',
    },
    {
      id: 'router-in-practice-testing',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How do you test routing behaviour in a Vue app?',
      answer: 'Export `routes` (and guard installation) separately from the app router. In each test create a fresh router with `createMemoryHistory()`, push the starting URL, `await router.isReady()`, and mount with Vue Test Utils: `mount(App, { global: { plugins: [router] } })`. Assert on rendered output and `router.currentRoute.value`. After interactions, `await flushPromises()` (or await the push). Cover: URL → rendered state (filters, params, 404), interaction → URL, guard redirects, failures. Mock `useRoute`/`useRouter` only for isolated unit tests; use E2E tests for the real browser URL and history.',
      explanation: 'A real in-memory router tests the actual route table, guards and lazy loading — with nothing faked except the URL bar.',
      code: {
        lang: 'js',
        code: `async function renderAt(path) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  installGuards(router)
  router.push(path)
  await router.isReady()
  return { router, wrapper: mount(App, { global: { plugins: [router] } }) }
}

test('signed-out users are redirected to login', async () => {
  const { router } = await renderAt('/account')
  expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/account')
})`,
      },
      whyAsked: 'Senior roles are expected to keep routing — auth redirects, deep links — from regressing silently.',
      mistakes: ['Reusing the app\'s singleton router across tests.', 'Asserting before `isReady()`.', 'Mocking everything, so the real route table is never tested.', 'Using `createWebHistory()` in a Node test environment.'],
      followUps: ['When would you mock `useRoute` instead?', 'How do you test a lazy route?', 'What do E2E tests add on top?'],
      modelAnswer: 'I keep the routes array and guard setup exportable, then each test builds a fresh router with memory history, pushes the start URL and awaits `isReady` before mounting the app with the router as a plugin. Then I assert on what renders and on `currentRoute` — filters restored from a URL, a click updating the query, a signed-out user redirected with the right `redirect` param, unknown URLs hitting the 404. After interactions I flush promises. I only mock `useRoute` for small isolated components, and leave real browser history to a few E2E tests.',
    },
    {
      id: 'router-in-practice-push-vs-replace',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: '`router.push()` vs `router.replace()` — what\'s the difference and when do you use each?',
      answer: 'Both navigate and run guards. `push` adds a new history entry (Back returns to the previous location); `replace` overwrites the current entry (Back skips it). Use `push` for deliberate moves to a new page; use `replace` for refinements of the same view (typing a search, toggling filters), redirects such as returning from login, and correcting an invalid URL.',
      explanation: 'It\'s a question of what the Back button should do.',
      options: [
        'push adds a history entry; replace overwrites the current one',
        'replace skips navigation guards; push runs them',
        'push reloads the page; replace does not',
        'There is no difference except the name',
      ],
      correctOption: 0,
      whyAsked: 'A basic check that you think about history UX.',
      mistakes: ['Thinking `replace` skips guards.', 'Using `push` for every keystroke in a search box.'],
      followUps: ['Which would you use after a successful login, and why?', 'What does `<RouterLink replace>` do?'],
      modelAnswer: 'Both trigger a normal navigation with guards. `push` adds a history entry, so Back goes to where you were; `replace` swaps the current entry. I push when the user deliberately goes somewhere new, and replace for refinements like filters or search typing, for redirects such as login → original page so Back doesn\'t return to the login form, and when normalising an invalid URL. `RouterLink` has a `replace` prop for the same behaviour.',
    },
    {
      id: 'router-in-practice-query-types',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'For the URL `/posts?page=2&tag=vue&tag=pinia&draft`, what is `route.query`?',
      options: [
        '{ page: \'2\', tag: [\'vue\', \'pinia\'], draft: null }',
        '{ page: 2, tag: \'pinia\', draft: true }',
        '{ page: \'2\', tag: \'vue,pinia\', draft: \'\' }',
        '{ page: 2, tag: [\'vue\', \'pinia\'], draft: undefined }',
      ],
      correctOption: 0,
      answer: '`{ page: \'2\', tag: [\'vue\', \'pinia\'], draft: null }` — values are strings, repeated keys become arrays, and a key without a value is `null`.',
      explanation: 'The router never converts types for you. Code that reads query values must handle strings, arrays and null.',
      whyAsked: 'Type confusion with query values causes real bugs (`page + 1 === \'21\'`, `.includes` on arrays vs strings).',
      mistakes: ['Expecting numbers or booleans.', 'Forgetting a repeated key becomes an array.'],
      followUps: ['How would you write a helper that always returns an array of tags?', 'How do you write `?draft` back into the URL?'],
      modelAnswer: 'Page is the string \'2\', tag is the array [\'vue\', \'pinia\'] because the key repeats, and draft is null because it has no value. Vue Router doesn\'t coerce types, so I parse and validate in computed properties — Number for page with a fallback, a helper that normalises tag to an array, and an explicit check for draft.',
    },
    {
      id: 'router-in-practice-stale-list',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'This orders page loads data on mount. Changing the status filter link from `?status=open` to `?status=closed` updates the URL but not the list. Why, and how do you fix it robustly?',
      code: {
        lang: 'js',
        code: `const route = useRoute()
const orders = ref([])

onMounted(async () => {
  orders.value = await api.getOrders({ status: route.query.status })
})`,
      },
      answer: 'A query-only change matches the same route, so the component is reused and `onMounted` doesn\'t run again. Watch the parsed filter instead: `watch(() => route.query.status, load, { immediate: true })`. Make `load` robust against races (a slow "open" response must not overwrite a fast "closed" one): track a request id or use `AbortController`/`onWatcherCleanup` (Vue 3.5+) to cancel the previous request. Optionally show loading and error states.',
      explanation: 'Component reuse + one-time loading = stale data. Data must follow the URL, and only the latest request may win.',
      whyAsked: 'Combines routing lifecycle knowledge with async correctness — a classic production bug.',
      mistakes: ['Forcing a remount with `:key="route.fullPath"` without mentioning the cost.', 'Watching without `immediate`, so the first load is missing.', 'Ignoring out-of-order responses.'],
      followUps: ['How does `onWatcherCleanup` help here?', 'Would `onBeforeRouteUpdate` also work? What\'s the difference?'],
      modelAnswer: 'The route record doesn\'t change when only the query changes, so Vue reuses the component and onMounted never runs again. I\'d replace it with a watcher on the specific query value with `immediate: true`. Because users can switch quickly, I\'d cancel or ignore the previous request — an AbortController registered with `onWatcherCleanup` in Vue 3.5, or a request counter — so only the latest response is applied. Remounting with a key works but throws away component state and is heavier.',
    },
    {
      id: 'router-in-practice-debounced-search',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 12,
      question: 'Make `/search` keep its search term in `?q=`. The input shows the URL\'s value on load; results are filtered by the URL\'s value; typing writes `q` with `router.replace` **300 ms after the last keystroke** (empty → remove `q`); and when the URL changes from outside (Back, a link), the input follows.',
      starter: { files: { ...searchShared, 'SearchPage.vue': searchStarter } },
      tests: [
        {
          name: '?q=router fills the input and filters the results',
          code: `const router = requireModule('router.js').default
await router.push('/search?q=router')
await flush()
expect(find('.search').value).toBe('router')
expect(findAll('.result').length).toBe(1)
expect(text('.result')).toBe('Vue Router')`,
        },
        {
          name: 'typing updates ?q= only after the debounce',
          code: `const router = requireModule('router.js').default
await router.push('/search')
await flush()
await type('.search', 'pin')
expect(router.currentRoute.value.query.q).toBeUndefined()
await wait(400)
expect(router.currentRoute.value.query.q).toBe('pin')
expect(findAll('.result').length).toBe(1)
expect(text('.result')).toBe('Pinia')`,
        },
        {
          name: 'clearing the input removes q',
          code: `const router = requireModule('router.js').default
await router.push('/search?q=vue')
await flush()
await type('.search', '')
await wait(400)
expect(router.currentRoute.value.fullPath).toBe('/search')`,
        },
        {
          name: 'the input follows URL changes from outside',
          code: `const router = requireModule('router.js').default
await router.push('/search?q=pinia')
await flush()
await router.push('/search?q=vite')
await flush()
expect(find('.search').value).toBe('vite')`,
        },
      ],
      hints: [
        'Make `const query = computed(() => typeof route.query.q === \'string\' ? route.query.q : \'\')` the source for the results.',
        'Keep a `term` ref for what is typed (initialised from `query.value`) and `watch(query, q => { term.value = q })` so outside changes flow in.',
        'On `@input`: update `term`, `clearTimeout(timer)`, then `timer = setTimeout(() => router.replace({ query: { ...route.query, q: term.value || undefined } }), 300)`. Clear the timer in `onBeforeUnmount`.',
      ],
      answer: 'Derive `query` from `route.query.q`, keep a separate `term` for the input that syncs from `query` via `watch`, debounce input changes into `router.replace` (empty → `undefined`), filter results by `query`, and clear the timer on unmount.',
      solution: { files: { ...searchShared, 'SearchPage.vue': searchSolution } },
      explanation: 'Two values with clear roles: the URL is the committed state (results follow it), `term` is the in-progress text. The debounce turns many keystrokes into one navigation; the watcher keeps the input honest when history or links change the URL.',
      whyAsked: 'Tests URL-as-state, debouncing, two-way sync without loops, and cleanup — all in one small, realistic component.',
      mistakes: ['Binding `v-model` directly to `route.query.q` (it is read-only).', 'Filtering by the raw input, so the results disagree with the URL.', 'Forgetting to clear the timer on unmount.', 'Two watchers syncing each other in a loop.'],
      followUps: ['How would you also cancel the search request when the term changes again?', 'Would you push or replace when the user presses Enter?'],
      modelAnswer: 'I treat the URL as the committed state: a computed reads `route.query.q` as a string and the results filter by it. A separate `term` ref holds what\'s being typed, initialised from the URL and updated by a watcher when the URL changes from outside. On input I update `term` and debounce a `router.replace` that keeps other query keys and drops `q` when empty. I clear the timer on unmount so a pending navigation doesn\'t fire after the user left.',
    },
  ],

  takeaways: [
    'Put shareable view state in the URL and derive component state from `route.query` with `computed` — never copy it into refs.',
    'Query values are strings, `null` or arrays: parse, validate and default every one; `undefined` removes a key.',
    'Use `router.replace` (and debouncing) for refinements, `push` for deliberate navigation; reset the page when filters change.',
    'Navigation failures (aborted, cancelled, duplicated) resolve `push()`; errors reject it and reach `router.onError`.',
    'A URL can match a route but point at missing data — handle that in the page, separately from the catch-all 404.',
    'Test routing with a fresh `createMemoryHistory()` router per test, `await router.isReady()`, and assertions on both the DOM and `currentRoute`.',
  ],
}
