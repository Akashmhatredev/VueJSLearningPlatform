// Project 6: Admin Dashboard — Vue Router, layouts, URL filters, reusable tables, SVG chart, role-aware navigation.

const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router.js'
import './styles.css'

// Pinia first: the router's guard uses the session store.
createApp(App).use(createPinia()).use(router).mount('#app')
`

const appVue = `<script setup>
// The root component only hosts the router. Layouts live in layouts/,
// pages in views/ — App.vue stays tiny on purpose.
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>`

const stylesCss = `/* Global styles for the admin app */
:root {
  --ink: #1d1d1f;
  --muted: #5f5f6b;
  --line: #e2e2e9;
  --soft: #f6f6f9;
  --accent: #3b5bdb;
  --danger: #c92a2a;
  --ok: #2b8a3e;
  --warn: #a15c00;
}
body { margin: 0; }
#app { font-family: system-ui, sans-serif; color: var(--ink); }
#app button,
#app input,
#app select { font: inherit; }
#app :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
`

const navigationJs = `// One source of truth for who may open what.
// The router (meta.roles), the guard and the sidebar all read this file.

export const ROLES = ['viewer', 'editor', 'admin']

export const NAV = [
  { name: 'overview', label: 'Overview', roles: ['viewer', 'editor', 'admin'] },
  { name: 'users', label: 'Users', roles: ['editor', 'admin'] },
  { name: 'settings', label: 'Settings', roles: ['admin'] },
]

export function rolesFor(name) {
  return NAV.find((item) => item.name === name)?.roles
}

// No roles listed = open to everyone who can use the app.
export function canAccess(role, roles) {
  return !roles || roles.includes(role)
}
`

const sessionStoreJs = `import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ROLES } from '../navigation.js'

// SIMPLIFIED: in a real app the user and their role come from the server
// after login (Project 7). The role switcher in the top bar exists only so
// you can try the role-aware navigation in this demo.
export const useSessionStore = defineStore('session', () => {
  const user = ref({ name: 'Maya Chen', email: 'maya.chen@example.com' })
  const role = ref('admin')

  function setRole(next) {
    if (ROLES.includes(next)) role.value = next
  }

  return { user, role, setRole }
})
`

const dataJs = `// Sample data. A real dashboard would load this from an API,
// ideally with filtering, sorting and pagination done by the server.

export const USERS = [
  { id: 1, name: 'Maya Chen', email: 'maya.chen@example.com', role: 'admin', status: 'active', joined: '2026-01-08' },
  { id: 2, name: 'Leo Martins', email: 'leo.martins@example.com', role: 'editor', status: 'active', joined: '2026-01-21' },
  { id: 3, name: 'Priya Nair', email: 'priya.nair@example.com', role: 'editor', status: 'active', joined: '2026-02-03' },
  { id: 4, name: 'Tom Okafor', email: 'tom.okafor@example.com', role: 'viewer', status: 'active', joined: '2026-02-17' },
  { id: 5, name: 'Sara Lind', email: 'sara.lind@example.com', role: 'viewer', status: 'invited', joined: '2026-03-02' },
  { id: 6, name: 'Kenji Watanabe', email: 'kenji.w@example.com', role: 'editor', status: 'suspended', joined: '2026-03-11' },
  { id: 7, name: 'Amira Haddad', email: 'amira.haddad@example.com', role: 'viewer', status: 'active', joined: '2026-03-25' },
  { id: 8, name: 'Jonas Berg', email: 'jonas.berg@example.com', role: 'viewer', status: 'active', joined: '2026-04-06' },
  { id: 9, name: 'Lucia Romero', email: 'lucia.romero@example.com', role: 'admin', status: 'active', joined: '2026-04-19' },
  { id: 10, name: 'Ethan Walsh', email: 'ethan.walsh@example.com', role: 'viewer', status: 'invited', joined: '2026-05-01' },
  { id: 11, name: 'Nadia Petrova', email: 'nadia.petrova@example.com', role: 'editor', status: 'active', joined: '2026-05-14' },
  { id: 12, name: 'Omar Farouk', email: 'omar.farouk@example.com', role: 'viewer', status: 'suspended', joined: '2026-05-28' },
  { id: 13, name: 'Grace Kim', email: 'grace.kim@example.com', role: 'viewer', status: 'active', joined: '2026-06-09' },
  { id: 14, name: 'Diego Alvarez', email: 'diego.alvarez@example.com', role: 'editor', status: 'invited', joined: '2026-06-22' },
  { id: 15, name: 'Hannah Weber', email: 'hannah.weber@example.com', role: 'viewer', status: 'active', joined: '2026-07-04' },
  { id: 16, name: 'Ravi Shah', email: 'ravi.shah@example.com', role: 'viewer', status: 'active', joined: '2026-07-18' },
  { id: 17, name: 'Chloe Dubois', email: 'chloe.dubois@example.com', role: 'editor', status: 'active', joined: '2026-08-01' },
  { id: 18, name: 'Samuel Osei', email: 'samuel.osei@example.com', role: 'viewer', status: 'invited', joined: '2026-08-15' },
  { id: 19, name: 'Ana Costa', email: 'ana.costa@example.com', role: 'viewer', status: 'active', joined: '2026-09-02' },
  { id: 20, name: 'Felix Novak', email: 'felix.novak@example.com', role: 'viewer', status: 'active', joined: '2026-09-20' },
]

export const STATUSES = ['active', 'invited', 'suspended']

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })

// [{ label: 'Jan', value: 2 }, …] in calendar order
export function signupsByMonth(users) {
  const counts = new Map()
  for (const user of users) {
    const key = user.joined.slice(0, 7)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.keys()].sort().map((key) => {
    const [year, month] = key.split('-').map(Number)
    return { label: monthFormatter.format(new Date(Date.UTC(year, month - 1, 1))), value: counts.get(key) }
  })
}
`

const userFiltersHeader = `import { ROLES } from './navigation.js'
import { STATUSES } from './data.js'

// The filter state of the Users page lives in the URL query string:
//   /users?q=berg&role=viewer&status=active&sort=joined&dir=desc
// These pure helpers convert between the two.

export const DEFAULTS = { q: '', role: 'all', status: 'all', sort: 'name', dir: 'asc' }
export const SORT_KEYS = ['name', 'role', 'status', 'joined']
`

const userFiltersApply = `
export function applyFilters(users, filters) {
  const needle = filters.q.trim().toLowerCase()
  const rows = users.filter(
    (user) =>
      (filters.role === 'all' || user.role === filters.role) &&
      (filters.status === 'all' || user.status === filters.status) &&
      (!needle || user.name.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle)),
  )
  const direction = filters.dir === 'desc' ? -1 : 1
  // filter() returned a new array, so sorting it does not touch the source data
  return rows.sort((a, b) => String(a[filters.sort]).localeCompare(String(b[filters.sort])) * direction || a.id - b.id)
}
`

const starterUserFiltersJs = `${userFiltersHeader}
// URL query -> validated filters. The URL is user input: never trust it.
export function readFilters(query) {
  // TODO (step 6): validate each value and fall back to DEFAULTS
  return { ...DEFAULTS }
}

// Filters -> URL query, leaving out defaults so links stay short.
export function toQuery(filters) {
  // TODO (step 6)
  return {}
}
${userFiltersApply}`

const userFiltersJs = `${userFiltersHeader}
// A query value can be missing, a string, or an array (?role=a&role=b).
function pick(value, allowed, fallback) {
  const first = Array.isArray(value) ? value[0] : value
  return allowed.includes(first) ? first : fallback
}

// URL query -> validated filters. The URL is user input: never trust it.
export function readFilters(query) {
  const rawQ = Array.isArray(query.q) ? query.q[0] : query.q
  return {
    q: typeof rawQ === 'string' ? rawQ.slice(0, 50) : '',
    role: pick(query.role, ['all', ...ROLES], DEFAULTS.role),
    status: pick(query.status, ['all', ...STATUSES], DEFAULTS.status),
    sort: pick(query.sort, SORT_KEYS, DEFAULTS.sort),
    dir: pick(query.dir, ['asc', 'desc'], DEFAULTS.dir),
  }
}

// Filters -> URL query, leaving out defaults so links stay short.
export function toQuery(filters) {
  const query = {}
  for (const key of Object.keys(DEFAULTS)) {
    if (filters[key] !== DEFAULTS[key]) query[key] = filters[key]
  }
  return query
}
${userFiltersApply}`

// ---------------------------------------------------------------- router

const starterRouterJs = `import { createRouter, createMemoryHistory } from 'vue-router'
import AdminLayout from './layouts/AdminLayout.vue'
import OverviewView from './views/OverviewView.vue'
import UsersView from './views/UsersView.vue'
import UserDetailView from './views/UserDetailView.vue'
import SettingsView from './views/SettingsView.vue'
import ForbiddenView from './views/ForbiddenView.vue'
import NotFoundView from './views/NotFoundView.vue'
// TODO (step 3): import { useSessionStore } and { canAccess, rolesFor }

export const routes = [
  {
    path: '/',
    component: AdminLayout, // a layout route: its children render inside it
    children: [
      { path: '', name: 'overview', component: OverviewView, meta: { title: 'Overview' } },
      { path: 'users', name: 'users', component: UsersView, meta: { title: 'Users' } },
      { path: 'users/:id', name: 'user', component: UserDetailView, props: true, meta: { title: 'User' } },
      // TODO (step 2): lazy-load Settings with () => import('./views/SettingsView.vue')
      { path: 'settings', name: 'settings', component: SettingsView, meta: { title: 'Settings' } },
      { path: 'forbidden', name: 'forbidden', component: ForbiddenView, meta: { title: 'No access' } },
    ],
  },
  // TODO (step 2): a catch-all route for unknown URLs (NotFoundView)
]

// The sandbox has no real address bar, so we use memory history.
// A real app would use createWebHistory().
const router = createRouter({ history: createMemoryHistory(), routes })

// TODO (step 3): add meta.roles to the routes above and a global
// beforeEach guard that redirects to 'forbidden' (with ?from=…) when the
// current role may not open the page.

export default router
`

const routerJs = `import { createRouter, createMemoryHistory } from 'vue-router'
import AdminLayout from './layouts/AdminLayout.vue'
import OverviewView from './views/OverviewView.vue'
import UsersView from './views/UsersView.vue'
import UserDetailView from './views/UserDetailView.vue'
import ForbiddenView from './views/ForbiddenView.vue'
import NotFoundView from './views/NotFoundView.vue'
import { useSessionStore } from './stores/session.js'
import { canAccess, rolesFor } from './navigation.js'

export const routes = [
  {
    path: '/',
    component: AdminLayout, // a layout route: its children render inside it
    children: [
      { path: '', name: 'overview', component: OverviewView, meta: { title: 'Overview', roles: rolesFor('overview') } },
      { path: 'users', name: 'users', component: UsersView, meta: { title: 'Users', roles: rolesFor('users') } },
      { path: 'users/:id', name: 'user', component: UserDetailView, props: true, meta: { title: 'User', roles: rolesFor('users') } },
      {
        path: 'settings',
        name: 'settings',
        // Lazy: this page's code is only loaded when someone is allowed to open it.
        component: () => import('./views/SettingsView.vue'),
        meta: { title: 'Settings', roles: rolesFor('settings') },
      },
      // No roles: everyone can see the "no access" page (otherwise: redirect loop!)
      { path: 'forbidden', name: 'forbidden', component: ForbiddenView, meta: { title: 'No access' } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Not found' } },
]

// The sandbox has no real address bar, so we use memory history.
// A real app would use createWebHistory().
const router = createRouter({ history: createMemoryHistory(), routes })

// UX only: this decides which PAGES are shown. The server must still
// authorize every API request — anyone can call an API without this UI.
router.beforeEach((to) => {
  const session = useSessionStore()
  if (!canAccess(session.role, to.meta.roles)) {
    return { name: 'forbidden', query: { from: to.fullPath } }
  }
})

router.afterEach((to) => {
  document.title = (to.meta.title ? to.meta.title + ' · ' : '') + 'Acme Admin'
})

export default router
`

// ---------------------------------------------------------------- layout

const layoutStyles = `<style scoped>
.admin { display: grid; grid-template-columns: 200px 1fr; min-height: 100vh; }
@media (max-width: 680px) { .admin { grid-template-columns: 1fr; } }
.skip-link { position: absolute; left: -999px; top: 8px; padding: 6px 10px; background: #fff; border: 2px solid var(--accent); z-index: 10; }
.skip-link:focus { left: 8px; }
.sidebar { padding: 16px 12px; background: #15171c; color: #fff; }
.brand { margin: 0 0 16px 8px; font-weight: 800; letter-spacing: 0.02em; }
.sidebar ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.nav-link { display: block; padding: 8px 10px; border-radius: 8px; color: #d0d3db; text-decoration: none; }
.nav-link:hover { background: #262a33; color: #fff; }
.nav-link[aria-current='page'] { background: #fff; color: #15171c; font-weight: 600; }
.content { display: grid; grid-template-rows: auto 1fr; min-width: 0; }
.topbar { display: flex; align-items: center; justify-content: flex-end; gap: 16px; padding: 10px 20px; border-bottom: 1px solid var(--line); }
.who { font-weight: 600; }
.role-label { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 0.9rem; }
.role-switcher { padding: 4px 8px; border: 1px solid var(--line); border-radius: 6px; }
.page { padding: 20px; outline: none; }
</style>`

const layoutTemplate = (navList) => `<template>
  <div class="admin">
    <a href="#main" class="skip-link">Skip to content</a>
    <aside class="sidebar">
      <p class="brand">Acme Admin</p>
      <nav aria-label="Main">
        <ul>
          <li v-for="item in ${navList}" :key="item.name">
            <RouterLink :to="{ name: item.name }" class="nav-link" :class="'nav-' + item.name">{{ item.label }}</RouterLink>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="content">
      <header class="topbar">
        <span class="who">{{ user.name }}</span>
        <label class="role-label">
          Viewing as (demo)
          <select class="role-switcher" :value="role" @change="session.setRole($event.target.value)">
            <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
          </select>
        </label>
      </header>
      <main id="main" ref="mainEl" tabindex="-1" class="page">
        <RouterView />
      </main>
    </div>
  </div>
</template>`

const starterLayoutVue = `<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '../stores/session.js'
import { NAV, ROLES } from '../navigation.js'

const session = useSessionStore()
const { user, role } = storeToRefs(session)
const mainEl = ref(null)

// TODO (step 4): only show the nav items the current role may open
const navItems = NAV

// TODO (step 3): when the role changes, run the guards again for the current page
// TODO (step 4): after navigating to a new page, move focus to <main>
</script>

${layoutTemplate('navItems')}

${layoutStyles}`

const layoutVue = `<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useSessionStore } from '../stores/session.js'
import { NAV, ROLES, canAccess } from '../navigation.js'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const { user, role } = storeToRefs(session)
const mainEl = ref(null)

// The sidebar is derived from the same rules the guard uses.
const navItems = computed(() => NAV.filter((item) => canAccess(role.value, item.roles)))

// Permissions changed: navigate to the SAME place again with force: true,
// so the guard re-checks it (normally a duplicate navigation is skipped).
watch(role, () => {
  router.replace({ path: route.path, query: route.query, hash: route.hash, force: true })
})

// Accessibility: after moving to a new page, put focus at the start of the
// content so keyboard and screen-reader users are not left in the sidebar.
// Only on PATH changes — typing in a filter changes the query, and must not steal focus.
watch(
  () => route.path,
  () => nextTick(() => mainEl.value?.focus()),
)
</script>

${layoutTemplate('navItems')}

${layoutStyles}`

// ---------------------------------------------------------------- shared components

const pageHeaderVue = `<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <header class="page-header">
    <div>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
    </div>
    <div class="page-actions"><slot name="actions" /></div>
  </header>
</template>

<style scoped>
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.page-title { margin: 0; font-size: 1.5rem; }
.page-subtitle { margin: 2px 0 0; color: var(--muted); }
</style>`

const statCardVue = `<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
})
</script>

<template>
  <article class="stat">
    <h2 class="stat-label">{{ label }}</h2>
    <p class="stat-value">{{ value }}</p>
  </article>
</template>

<style scoped>
.stat { padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.stat-label { margin: 0; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.stat-value { margin: 4px 0 0; font-size: 1.7rem; font-weight: 800; font-variant-numeric: tabular-nums; }
</style>`

const barChartVue = `<script setup>
import { computed, useId } from 'vue'

// A vertical bar chart drawn by hand. SVG's y axis points DOWN,
// so a bar of height h starts at y = BASELINE - h.
const props = defineProps({
  title: { type: String, required: true },
  items: { type: Array, required: true }, // [{ label, value }]
})

const SLOT = 48 // horizontal space per bar
const BAR_W = 28
const PLOT_H = 120 // tallest bar
const TOP = 18 // room for value labels
const BASELINE = TOP + PLOT_H
const HEIGHT = BASELINE + 22 // room for the month labels

const width = computed(() => props.items.length * SLOT)
const maxValue = computed(() => Math.max(1, ...props.items.map((item) => item.value)))
const titleId = useId()
const descId = useId()

function barHeight(value) {
  return (value / maxValue.value) * PLOT_H
}

const summary = computed(() => props.items.map((item) => item.label + ': ' + item.value).join(', '))
</script>

<template>
  <figure class="chart">
    <figcaption :id="titleId" class="chart-title">{{ title }}</figcaption>
    <svg
      class="chart-svg"
      :viewBox="'0 0 ' + width + ' ' + HEIGHT"
      role="img"
      :aria-labelledby="titleId"
      :aria-describedby="descId"
    >
      <desc :id="descId">{{ summary }}</desc>
      <line x1="0" :x2="width" :y1="BASELINE" :y2="BASELINE" class="axis" />
      <g v-for="(item, index) in items" :key="item.label" :transform="'translate(' + index * SLOT + ', 0)'">
        <rect
          class="chart-bar"
          :x="(SLOT - BAR_W) / 2"
          :y="BASELINE - barHeight(item.value)"
          :width="BAR_W"
          :height="barHeight(item.value)"
          rx="4"
        />
        <text class="chart-value" :x="SLOT / 2" :y="BASELINE - barHeight(item.value) - 5" text-anchor="middle">{{ item.value }}</text>
        <text class="chart-label" :x="SLOT / 2" :y="BASELINE + 16" text-anchor="middle">{{ item.label }}</text>
      </g>
    </svg>
  </figure>
</template>

<style scoped>
.chart { margin: 0; padding: 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.chart-title { font-weight: 700; margin-bottom: 8px; }
.chart-svg { display: block; width: 100%; max-height: 240px; }
.axis { stroke: var(--line); stroke-width: 1; }
.chart-bar { fill: var(--accent); }
.chart-value { font-size: 11px; fill: var(--muted); }
.chart-label { font-size: 11px; fill: var(--ink); }
</style>`

const tableStyles = `<style scoped>
.table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.data-table { width: 100%; border-collapse: collapse; }
th { text-align: left; padding: 8px 12px; font-size: 0.8rem; color: var(--muted); font-weight: 600; border-bottom: 1px solid var(--line); white-space: nowrap; }
td { padding: 10px 12px; border-bottom: 1px solid var(--line); }
tbody tr:last-child td { border-bottom: 0; }
.sort-btn { border: 0; background: none; padding: 0; color: inherit; font-weight: 600; cursor: pointer; }
.empty-row { padding: 24px; text-align: center; color: var(--muted); }
</style>`

const starterTableVue = `<script setup>
// A reusable, CONTROLLED table: the parent owns rows and sort state.
// Each cell can be customised with a scoped slot named "cell-<key>".
defineProps({
  columns: { type: Array, required: true }, // [{ key, label, sortable? }]
  rows: { type: Array, required: true },
  sortKey: { type: String, default: '' },
  sortDir: { type: String, default: 'asc' },
  rowKey: { type: String, default: 'id' },
  caption: { type: String, default: '' },
})
// TODO (step 5): emit 'sort' with (key, direction) from a button in each
// sortable header, show an arrow, and set aria-sort on the <th>.
</script>

<template>
  <div class="table-wrap">
    <table class="data-table">
      <caption v-if="caption" class="visually-hidden">{{ caption }}</caption>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" scope="col" :class="'col-' + col.key">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row[rowKey]" class="data-row">
          <td v-for="col in columns" :key="col.key" :class="'cell-' + col.key">
            <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">{{ row[col.key] }}</slot>
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" class="empty-row"><slot name="empty">No rows.</slot></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

${tableStyles}`

const tableVue = `<script setup>
// A reusable, CONTROLLED table: the parent owns rows and sort state.
// Each cell can be customised with a scoped slot named "cell-<key>".
const props = defineProps({
  columns: { type: Array, required: true }, // [{ key, label, sortable? }]
  rows: { type: Array, required: true },
  sortKey: { type: String, default: '' },
  sortDir: { type: String, default: 'asc' },
  rowKey: { type: String, default: 'id' },
  caption: { type: String, default: '' },
})
const emit = defineEmits(['sort'])

function nextDirection(col) {
  return props.sortKey === col.key && props.sortDir === 'asc' ? 'desc' : 'asc'
}

function ariaSort(col) {
  if (!col.sortable) return undefined
  if (props.sortKey !== col.key) return 'none'
  return props.sortDir === 'asc' ? 'ascending' : 'descending'
}

function arrow(col) {
  if (props.sortKey !== col.key) return '↕'
  return props.sortDir === 'asc' ? '↑' : '↓'
}
</script>

<template>
  <div class="table-wrap">
    <table class="data-table">
      <caption v-if="caption" class="visually-hidden">{{ caption }}</caption>
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key" scope="col" :class="'col-' + col.key" :aria-sort="ariaSort(col)">
            <button v-if="col.sortable" type="button" class="sort-btn" @click="emit('sort', col.key, nextDirection(col))">
              {{ col.label }} <span aria-hidden="true">{{ arrow(col) }}</span>
            </button>
            <template v-else>{{ col.label }}</template>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row[rowKey]" class="data-row">
          <td v-for="col in columns" :key="col.key" :class="'cell-' + col.key">
            <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">{{ row[col.key] }}</slot>
          </td>
        </tr>
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" class="empty-row"><slot name="empty">No rows.</slot></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

${tableStyles}`

// ---------------------------------------------------------------- views

const overviewVue = `<script setup>
import PageHeader from '../components/PageHeader.vue'
import StatCard from '../components/StatCard.vue'
import BarChart from '../components/BarChart.vue'
import { USERS, signupsByMonth } from '../data.js'

// The sample data never changes, so plain constants are enough here.
// With live data these would be computed() values.
const countBy = (status) => USERS.filter((user) => user.status === status).length
const stats = [
  { key: 'total', label: 'Users', value: String(USERS.length) },
  { key: 'active', label: 'Active', value: String(countBy('active')) },
  { key: 'invited', label: 'Invited', value: String(countBy('invited')) },
  { key: 'suspended', label: 'Suspended', value: String(countBy('suspended')) },
]
const signups = signupsByMonth(USERS)
</script>

<template>
  <section class="overview">
    <PageHeader title="Overview" subtitle="How the team is growing." />
    <div class="stats">
      <StatCard v-for="s in stats" :key="s.key" :class="'stat-' + s.key" :label="s.label" :value="s.value" />
    </div>
    <BarChart title="Sign-ups per month (2026)" :items="signups" />
  </section>
</template>

<style scoped>
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px; }
</style>`

const usersStyles = `<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
.filters label { display: grid; gap: 4px; font-size: 0.85rem; font-weight: 600; }
.filters input,
.filters select { padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
.clear-filters { padding: 6px 12px; border: 1px solid var(--ink); border-radius: 8px; background: #fff; cursor: pointer; }
.clear-filters:disabled { opacity: 0.4; cursor: not-allowed; }
.user-link { color: var(--accent); font-weight: 600; text-decoration: none; }
.user-link:hover { text-decoration: underline; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.8rem; background: var(--soft); }
.badge-admin { background: #e7ecff; }
.badge-editor { background: #e6f4ea; }
.status-suspended { color: var(--danger); }
.status-invited { color: var(--warn); }
</style>`

const usersTemplate = `<template>
  <section class="users">
    <PageHeader title="Users" :subtitle="rows.length + ' of ' + USERS.length + ' users'">
      <template #actions>
        <button type="button" class="clear-filters" :disabled="!hasFilters" @click="clearFilters">Clear filters</button>
      </template>
    </PageHeader>

    <div class="filters" role="search" aria-label="Filter users">
      <label>
        Search
        <input v-model="search" class="filter-q" type="search" placeholder="Name or email" />
      </label>
      <label>
        Role
        <select class="filter-role" :value="filters.role" @change="setFilter({ role: $event.target.value })">
          <option value="all">All roles</option>
          <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
        </select>
      </label>
      <label>
        Status
        <select class="filter-status" :value="filters.status" @change="setFilter({ status: $event.target.value })">
          <option value="all">All statuses</option>
          <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>

    <DataTable
      caption="Users"
      :columns="columns"
      :rows="rows"
      :sort-key="filters.sort"
      :sort-dir="filters.dir"
      @sort="(key, dir) => setFilter({ sort: key, dir })"
    >
      <template #cell-name="{ row }">
        <RouterLink class="user-link" :to="{ name: 'user', params: { id: row.id } }">{{ row.name }}</RouterLink>
      </template>
      <template #cell-role="{ value }">
        <span class="badge" :class="'badge-' + value">{{ value }}</span>
      </template>
      <template #cell-status="{ value }">
        <span :class="'status-' + value">{{ value }}</span>
      </template>
      <template #empty>No users match these filters.</template>
    </DataTable>
  </section>
</template>`

const starterUsersVue = `<script setup>
import { reactive, computed } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import DataTable from '../components/DataTable.vue'
import { USERS, STATUSES } from '../data.js'
import { ROLES } from '../navigation.js'
import { DEFAULTS, applyFilters } from '../userFilters.js'

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'joined', label: 'Joined', sortable: true },
]

// TODO (step 6): these filters live in component memory, so they are lost
// on reload and cannot be shared as a link. Move them into the URL query:
// read them with readFilters(route.query), write them with router.replace().
const filters = reactive({ ...DEFAULTS })
const search = computed({
  get: () => filters.q,
  set: (q) => (filters.q = q),
})

const rows = computed(() => applyFilters(USERS, filters))
const hasFilters = computed(() => filters.q !== '' || filters.role !== 'all' || filters.status !== 'all')

function setFilter(patch) {
  Object.assign(filters, patch)
}

function clearFilters() {
  Object.assign(filters, DEFAULTS)
}
</script>

${usersTemplate}

${usersStyles}`

const usersVue = `<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import DataTable from '../components/DataTable.vue'
import { USERS, STATUSES } from '../data.js'
import { ROLES } from '../navigation.js'
import { readFilters, toQuery, applyFilters } from '../userFilters.js'

const route = useRoute()
const router = useRouter()

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'joined', label: 'Joined', sortable: true },
]

// The URL is the single source of truth for the filters.
const filters = computed(() => readFilters(route.query))
const rows = computed(() => applyFilters(USERS, filters.value))
const hasFilters = computed(() => Object.keys(toQuery({ ...filters.value, sort: 'name', dir: 'asc' })).length > 0)

// replace(), not push(): refining a filter should not add a history entry per keystroke.
function setFilter(patch) {
  router.replace({ query: toQuery({ ...filters.value, ...patch }) })
}

function clearFilters() {
  setFilter({ q: '', role: 'all', status: 'all' })
}

// The search box keeps its own text while typing, and follows the URL when
// it changes from outside (back button, a shared link, "Clear filters").
const search = ref(filters.value.q)
watch(search, (q) => {
  if (q !== filters.value.q) setFilter({ q })
})
watch(
  () => filters.value.q,
  (q) => {
    if (q !== search.value) search.value = q
  },
)
</script>

${usersTemplate}

${usersStyles}`

const userDetailVue = `<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '../components/PageHeader.vue'
import { USERS } from '../data.js'

// props: true in the route turns the :id param into this prop (a string).
const props = defineProps({
  id: { type: String, required: true },
})

const user = computed(() => USERS.find((u) => u.id === Number(props.id)) ?? null)
</script>

<template>
  <section>
    <RouterLink :to="{ name: 'users' }" class="back-link">← All users</RouterLink>
    <template v-if="user">
      <PageHeader :title="user.name" :subtitle="user.email" />
      <dl class="user-detail">
        <div><dt>Email</dt><dd>{{ user.email }}</dd></div>
        <div><dt>Role</dt><dd>{{ user.role }}</dd></div>
        <div><dt>Status</dt><dd>{{ user.status }}</dd></div>
        <div><dt>Joined</dt><dd>{{ user.joined }}</dd></div>
      </dl>
    </template>
    <p v-else class="user-missing">No user with id {{ id }}.</p>
  </section>
</template>

<style scoped>
.back-link { display: inline-block; margin-bottom: 12px; color: var(--accent); text-decoration: none; }
.user-detail { display: grid; gap: 8px; max-width: 420px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; }
.user-detail div { display: flex; justify-content: space-between; gap: 12px; }
.user-detail dt { color: var(--muted); }
.user-detail dd { margin: 0; font-weight: 600; }
.user-missing { color: var(--muted); }
</style>`

const settingsVue = `<script setup>
import { ref } from 'vue'
import PageHeader from '../components/PageHeader.vue'

const orgName = ref('Acme Inc.')
const requireTwoFactor = ref(true)
const saved = ref(false)

function save() {
  // SIMPLIFIED: a real app would send this to the server, which checks
  // that the caller really is an admin before changing anything.
  saved.value = true
}
</script>

<template>
  <section class="settings-view">
    <PageHeader title="Settings" subtitle="Admins only." />
    <form class="settings-form" @submit.prevent="save">
      <label>Organisation name <input v-model="orgName" @input="saved = false" /></label>
      <label class="checkbox"><input v-model="requireTwoFactor" type="checkbox" @change="saved = false" /> Require two-factor sign-in</label>
      <button type="submit">Save</button>
      <p v-if="saved" role="status">Saved.</p>
    </form>
  </section>
</template>

<style scoped>
.settings-form { display: grid; gap: 12px; max-width: 360px; }
.settings-form label { display: grid; gap: 4px; font-weight: 600; }
.settings-form .checkbox { display: flex; align-items: center; gap: 8px; font-weight: 400; }
.settings-form input:not([type='checkbox']) { padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; }
.settings-form button { justify-self: start; padding: 8px 14px; border: 0; border-radius: 8px; background: var(--ink); color: #fff; cursor: pointer; }
</style>`

const forbiddenVue = `<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Only accept in-app paths ("/users"), never "https://…" or "//evil.example".
const from = computed(() => {
  const value = route.query.from
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : ''
})
</script>

<template>
  <section class="forbidden" aria-labelledby="forbidden-title">
    <h1 id="forbidden-title">No access</h1>
    <p>
      Your role can't open <code>{{ from || 'this page' }}</code>. Ask an admin if you need it.
    </p>
    <div class="actions">
      <RouterLink :to="{ name: 'overview' }" class="back-home">Back to overview</RouterLink>
      <button v-if="from" type="button" class="retry-access" @click="router.push(from)">Try again</button>
    </div>
  </section>
</template>

<style scoped>
.forbidden { max-width: 480px; }
.forbidden h1 { margin-top: 0; }
.actions { display: flex; gap: 12px; align-items: center; }
.back-home { color: var(--accent); }
.retry-access { padding: 6px 12px; border: 1px solid var(--ink); border-radius: 8px; background: #fff; cursor: pointer; }
</style>`

const notFoundVue = `<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="not-found">
    <h1>Page not found</h1>
    <p>That address doesn't match any page in this app.</p>
    <RouterLink to="/">Go to the overview</RouterLink>
  </main>
</template>

<style scoped>
.not-found { max-width: 480px; margin: 40px auto; padding: 0 20px; }
</style>`

const sharedFiles = {
  'main.js': mainJs,
  'App.vue': appVue,
  'navigation.js': navigationJs,
  'stores/session.js': sessionStoreJs,
  'data.js': dataJs,
  'components/PageHeader.vue': pageHeaderVue,
  'components/StatCard.vue': statCardVue,
  'components/BarChart.vue': barChartVue,
  'views/OverviewView.vue': overviewVue,
  'views/UserDetailView.vue': userDetailVue,
  'views/SettingsView.vue': settingsVue,
  'views/ForbiddenView.vue': forbiddenVue,
  'views/NotFoundView.vue': notFoundVue,
  'styles.css': stylesCss,
}

// ---------------------------------------------------------------- interview coding question

const permStarter = `// Permission-based access with role inheritance.
// A viewer can view the dashboard; an editor can do everything a viewer can,
// plus manage users; an admin can do everything an editor can, plus settings.

const ROLE_PERMISSIONS = {
  viewer: ['dashboard:view'],
  editor: ['users:view', 'users:edit'],
  admin: ['users:suspend', 'settings:manage'],
}

const INHERITS = { viewer: null, editor: 'viewer', admin: 'editor' }

// All permissions of a role, including inherited ones.
export function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] ?? []
}

export function can(role, permission) {
  return permissionsFor(role).includes(permission)
}
`

const permSolution = `// Permission-based access with role inheritance.
// A viewer can view the dashboard; an editor can do everything a viewer can,
// plus manage users; an admin can do everything an editor can, plus settings.

const ROLE_PERMISSIONS = {
  viewer: ['dashboard:view'],
  editor: ['users:view', 'users:edit'],
  admin: ['users:suspend', 'settings:manage'],
}

const INHERITS = { viewer: null, editor: 'viewer', admin: 'editor' }

// All permissions of a role, including inherited ones.
export function permissionsFor(role) {
  const result = new Set()
  const seen = new Set()
  let current = role
  while (current && Object.hasOwn(ROLE_PERMISSIONS, current) && !seen.has(current)) {
    seen.add(current) // guards against an accidental inheritance cycle
    for (const permission of ROLE_PERMISSIONS[current]) result.add(permission)
    current = INHERITS[current]
  }
  return [...result]
}

export function can(role, permission) {
  return permissionsFor(role).includes(permission)
}
`

const permApp = `<script setup>
import { can } from './permissions.js'
const role = 'editor'
</script>

<template>
  <p>Editor can edit users: {{ can(role, 'users:edit') }}</p>
  <button v-if="can(role, 'settings:manage')">Settings</button>
</template>`

const go = (path) => `await requireModule('router.js').default.push('${path}')
await flush()`

export default {
  id: 'project-admin-dashboard',
  kind: 'project',
  title: 'Project 6: Admin Dashboard',
  summary: 'Build a routed admin app with a shared layout, role-aware navigation and guards, URL-synced table filters, a reusable data table and a hand-drawn chart.',
  difficulty: 'advanced',
  minutes: 150,
  prerequisites: ['router-basics', 'nested-named-routes', 'navigation-guards', 'scoped-slots', 'pinia-basics'],
  related: ['dynamic-routes', 'router-in-practice', 'lazy-routes-scroll', 'accessible-components', 'auth-security', 'project-auth-ui'],
  tags: ['project', 'vue router', 'admin', 'dashboard', 'layouts', 'nested routes', 'navigation guards', 'route meta', 'query params', 'data table', 'roles', 'svg chart'],
  apis: [
    { name: 'createRouter() / createMemoryHistory()', summary: 'Vue Router: creates the router; memory history keeps the URL in memory (the sandbox has no address bar).' },
    { name: 'router.beforeEach()', summary: 'Vue Router: a global guard; return a route location to redirect, or nothing to allow.' },
    { name: 'route.meta', summary: 'Vue Router: custom data on route records (title, roles), merged from parent to child on to.meta.' },
    { name: 'router.replace({ query })', summary: 'Vue Router: changes the URL without adding a history entry — used for filters.' },
    { name: '<RouterView> / <RouterLink>', summary: 'Vue Router: render the matched page; navigate with accessible links (aria-current on the active one).' },
  ],
  docs: [
    { label: 'Vue Router — Nested Routes', url: 'https://router.vuejs.org/guide/essentials/nested-routes.html' },
    { label: 'Vue Router — Navigation Guards', url: 'https://router.vuejs.org/guide/advanced/navigation-guards.html' },
    { label: 'Vue Router — Route Meta Fields', url: 'https://router.vuejs.org/guide/advanced/meta.html' },
    { label: 'Vue Router — Lazy Loading Routes', url: 'https://router.vuejs.org/guide/advanced/lazy-loading.html' },
    { label: 'Vue Router — Different History modes', url: 'https://router.vuejs.org/guide/essentials/history-mode.html' },
    { label: 'Vue Guide — Scoped Slots', url: 'https://vuejs.org/guide/components/slots.html#scoped-slots' },
  ],

  intro: `
*Acme Admin* is the back office of a small SaaS company: an **overview** with stats and a sign-ups chart, a **users** table you can search, filter and sort, a **user detail** page, and an admins-only **settings** page.

It is the first project with several *pages*, so it introduces the tools every real-world Vue app uses:

- **Vue Router** with nested routes, so every page shares one **layout** (sidebar + top bar),
- **route meta + a navigation guard**, so each role only reaches the pages it may open,
- **role-aware navigation** that is derived from the same rules,
- **filters stored in the URL**, so a filtered table can be bookmarked and shared,
- a **reusable data table** with sortable columns and custom cells (scoped slots),
- and a small **SVG bar chart**, this time vertical.

A role switcher in the top bar (labelled *demo*) lets you experience the app as a viewer, an editor or an admin.
`,

  why: `
Dashboards look simple and hide most of the hard parts of frontend architecture:

- **Pages need a shell.** Without a layout route, every page repeats the sidebar, and switching pages re-mounts it (losing scroll and state).
- **Not everyone may see everything.** Rules like "only admins open Settings" must apply to links, to direct URLs, and when someone's role changes mid-session — consistently.
- **Filtered views must be shareable.** "Send me the list of suspended editors" should be a link, which means filter state belongs in the URL, not in component memory.
- **Tables are everywhere.** Writing a new one for every list does not scale; a reusable, controlled table does.

And there is one boundary to keep in mind throughout: **hiding a link or blocking a route is user experience, not security.** The server must authorize every request, because anyone can call your API without your UI.
`,

  eli15: `
Picture an office building with a reception desk.

The building has the same **hallway and signs on every floor** — that's the *layout*. Each room is a *page*. The address on your badge ("floor 2, room Users") is the *URL*.

The receptionist checks your badge before you go anywhere: "you're a visitor, so Settings is off-limits" — that's the *navigation guard*. The signs in the hallway only show rooms you're allowed into — that's *role-aware navigation*. If your badge is downgraded while you're inside, the receptionist walks you out of rooms you no longer may use.

But the receptionist is there to help, not to protect the safe. The **safe** (the server's data) has its own lock, and checks every request itself.

Oh, and the sticky note on the Users room door says "showing: suspended editors, sorted by name". Anyone you send that note to sees the same view — that's *filters in the URL*.
`,

  analogy: {
    title: 'The office building with a front desk',
    body: `
Every floor shares the same corridors and signage, and the rooms change. A receptionist checks badges against a list of who may enter which room — the same list the building uses to decide which signs to show you. The strongroom still has its own lock: the receptionist being polite is not what keeps the money safe.
`,
    mapping: [
      ['shared corridors and signage', '`AdminLayout` with a nested `<RouterView>`'],
      ['the rooms', 'views: Overview, Users, Settings…'],
      ['the badge check at the desk', '`router.beforeEach` reading `to.meta.roles`'],
      ['signs that only show rooms you may enter', 'nav items filtered with `canAccess()`'],
      ['the list of who may enter which room', '`navigation.js` — one source of truth'],
      ['the strongroom\'s own lock', 'server-side authorization of every API request'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'From URL to page, with a badge check',
    caption: 'Every navigation passes the guard. The sidebar is derived from the same rules. Filters live in the URL query, so the page is a function of the address.',
    alt: 'Diagram: a navigation (link click, typed URL or role change) goes to the router, which matches the route and merges its meta. The global beforeEach guard compares to.meta.roles with the role in the session store, either allowing the page or redirecting to the Forbidden page with a from query. Allowed pages render inside AdminLayout, whose sidebar is filtered by the same rules from navigation.js. The Users page reads its filters from the URL query, renders the reusable DataTable, and writes filter changes back with router.replace.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'nav', label: 'Navigation', note: 'link · typed URL · role change', tone: 'paper' },
        { id: 'router', label: 'Router', note: 'match route · merge meta', tone: 'cobalt' },
        { id: 'guard', label: 'beforeEach guard', note: 'canAccess(role, to.meta.roles)', tone: 'red' },
        { id: 'rules', label: 'navigation.js + session store', note: 'roles · current role', tone: 'kraft' },
        { id: 'layout', label: 'AdminLayout', note: 'sidebar (filtered) · <RouterView>', tone: 'acid' },
        { id: 'users', label: 'UsersView', note: 'filters ⇄ URL query · DataTable', tone: 'paper' },
      ],
      edges: [
        { from: 'nav', to: 'router', label: 'push / replace' },
        { from: 'router', to: 'guard', label: 'to' },
        { from: 'rules', to: 'guard', label: 'rules' },
        { from: 'guard', to: 'layout', label: 'allowed' },
        { from: 'rules', to: 'layout', label: 'nav items', dashed: true },
        { from: 'layout', to: 'users', label: 'renders child' },
        { from: 'users', to: 'router', id: 'users-query', label: 'replace({ query })', dashed: true },
      ],
      steps: [
        { focus: ['nav', 'router'], edges: ['nav->router'], text: 'Clicking a link, typing a URL, or changing role all become a navigation. The router matches the path and merges `meta` from parent to child.' },
        { focus: ['router', 'guard', 'rules'], edges: ['router->guard', 'rules->guard'], text: 'The global `beforeEach` guard compares `to.meta.roles` with the current role. Not allowed → redirect to `forbidden?from=…`.' },
        { focus: ['guard', 'layout', 'rules'], edges: ['guard->layout', 'rules->layout'], text: 'Allowed pages render inside `AdminLayout`. Its sidebar is filtered with the same `canAccess()` rules, so links and guards can never disagree.' },
        { focus: ['layout', 'users', 'router'], edges: ['layout->users', 'users-query'], text: 'The Users page reads its filters from `route.query` and writes changes with `router.replace({ query })`. The URL is the state — shareable, bookmarkable, back-button friendly.' },
      ],
    },
  },

  requirements: [
    '`main.js` installs Pinia and the router; `router.js` uses `createMemoryHistory()` and exports the router (default) and the `routes` array. `App.vue` only renders `<RouterView />`.',
    'All app pages are children of a layout route rendering `AdminLayout` (sidebar `.nav-link`s with classes `.nav-overview`, `.nav-users`, `.nav-settings`, a `.role-switcher` select and `<main id="main">` with a nested `<RouterView>`).',
    'Roles: Overview → everyone; Users and user detail → editor and admin; Settings → admin only. Rules live in `navigation.js` and are attached as `meta.roles`.',
    'A global `beforeEach` guard redirects disallowed navigations to the `forbidden` route with `?from=<original path>`; the page (`.forbidden`) explains what happened. Changing role re-checks the current page.',
    'The sidebar shows only the pages the current role may open. After navigating to a new path, focus moves to `<main id="main">`.',
    'Settings is lazy-loaded (`component: () => import(...)`, renders `.settings-view`). Unknown URLs show `.not-found`.',
    'Users page: `.filter-q` (search), `.filter-role`, `.filter-status` and column sorting are stored in the URL query (`q`, `role`, `status`, `sort`, `dir`), defaults omitted, invalid values ignored. Rows are `.data-row`s; names link (`.user-link`) to `/users/:id`, which renders `.user-detail` (or `.user-missing`).',
    '`DataTable` is reusable and controlled: props `columns`, `rows`, `sortKey`, `sortDir`; sortable headers contain a `.sort-btn` that emits `sort(key, direction)`; `<th>` has `aria-sort`; cells are customisable via `cell-<key>` scoped slots.',
    'Overview shows `.stat-total`, `.stat-active`, `.stat-invited`, `.stat-suspended` cards (`.stat-value`) and a bar chart with one `.chart-bar` per month.',
  ],

  objectives: [
    'Structure a multi-page app with nested routes and a layout route, and explain memory vs web history.',
    'Protect pages with route meta and a global guard — and explain why that is UX, not security.',
    'Derive role-aware navigation from the same rules as the guard, and re-check access when roles change.',
    'Store filter and sort state in the URL query with validation, `router.replace()` and clean defaults.',
    'Build a reusable, controlled data table with scoped slots and accessible sorting.',
    'Handle SPA accessibility details: `aria-current`, focus management after navigation, skip links.',
  ],

  playground: {
    title: 'Acme Admin — starter',
    objective: 'The pages, layout, stores and chart exist. Add the 404 and lazy routes, the role guard, role-aware navigation, URL-synced filters and table sorting.',
    files: {
      ...sharedFiles,
      'router.js': starterRouterJs,
      'layouts/AdminLayout.vue': starterLayoutVue,
      'components/DataTable.vue': starterTableVue,
      'views/UsersView.vue': starterUsersVue,
      'userFilters.js': starterUserFiltersJs,
    },
    expected: 'The starter navigates between pages, but every role sees and opens everything, unknown URLs render nothing, filters are forgotten when you leave the page, and the table cannot be sorted. Use the role switcher to see the difference once your guard works.',
    tests: [
      {
        name: 'admins see every page; the overview shows stats and a chart',
        code: `await flush()
expect(findAll('.nav-link').map((a) => a.textContent.trim())).toEqual(['Overview', 'Users', 'Settings'])
expect(text('.stat-total .stat-value')).toBe('20')
expect(text('.stat-active .stat-value')).toBe('14')
expect(findAll('.chart-bar')).toHaveLength(9)`,
      },
      {
        name: 'the sidebar only shows pages the role may open',
        code: `await select('.role-switcher', 'viewer')
await flush()
expect(findAll('.nav-link').map((a) => a.textContent.trim())).toEqual(['Overview'])
await select('.role-switcher', 'editor')
await flush()
expect(findAll('.nav-link').map((a) => a.textContent.trim())).toEqual(['Overview', 'Users'])`,
      },
      {
        name: 'the guard sends a viewer from /users to the forbidden page',
        code: `const router = requireModule('router.js').default
await select('.role-switcher', 'viewer')
await router.push('/users')
await flush()
expect(router.currentRoute.value.name).toBe('forbidden')
expect(router.currentRoute.value.query.from).toBe('/users')
expect(exists('.forbidden')).toBe(true)
expect(exists('.data-table')).toBe(false)`,
      },
      {
        name: 'losing a role on the current page re-runs the guard',
        code: `${go('/users')}
expect(exists('.data-table')).toBe(true)
await select('.role-switcher', 'viewer')
await wait(20)
expect(requireModule('router.js').default.currentRoute.value.name).toBe('forbidden')
expect(exists('.forbidden')).toBe(true)`,
      },
      {
        name: 'editors open Users but not Settings',
        code: `const router = requireModule('router.js').default
await select('.role-switcher', 'editor')
await router.push('/settings')
await flush()
expect(router.currentRoute.value.name).toBe('forbidden')
await router.push('/users')
await flush()
expect(exists('.data-table')).toBe(true)`,
      },
      {
        name: 'Settings is a lazy-loaded route',
        code: `const { routes } = requireModule('router.js')
const settings = routes[0].children.find((r) => r.name === 'settings')
expect(typeof settings.component).toBe('function')
await click('.nav-settings')
await wait(30)
expect(exists('.settings-view')).toBe(true)`,
      },
      {
        name: 'unknown URLs show the 404 page',
        code: `${go('/reports/2019/nope')}
expect(exists('.not-found')).toBe(true)`,
      },
      {
        name: 'filters are read from the URL',
        code: `${go('/users?role=editor&status=active')}
expect(findAll('.data-row')).toHaveLength(4)
expect(find('.filter-role').value).toBe('editor')
expect(find('.filter-status').value).toBe('active')`,
      },
      {
        name: 'changing a filter writes it to the URL',
        code: `const router = requireModule('router.js').default
${go('/users')}
await select('.filter-status', 'invited')
await flush()
expect(router.currentRoute.value.query).toEqual({ status: 'invited' })
expect(findAll('.data-row')).toHaveLength(4)
await click('.clear-filters')
await flush()
expect(router.currentRoute.value.query).toEqual({})
expect(findAll('.data-row')).toHaveLength(20)`,
      },
      {
        name: 'invalid query values are ignored; search goes into the URL',
        code: `const router = requireModule('router.js').default
${go('/users?role=superuser&sort=password')}
expect(findAll('.data-row')).toHaveLength(20)
expect(find('.filter-role').value).toBe('all')
expect(findAll('.data-row')[0].textContent).toContain('Amira Haddad')
await type('.filter-q', 'berg')
await flush()
expect(router.currentRoute.value.query).toEqual({ q: 'berg' })
expect(findAll('.data-row')).toHaveLength(1)`,
      },
      {
        name: 'sortable headers sort via the URL and expose aria-sort',
        code: `const router = requireModule('router.js').default
${go('/users')}
expect(attr('th.col-name', 'aria-sort')).toBe('ascending')
await click('th.col-name .sort-btn')
await flush()
expect(router.currentRoute.value.query).toEqual({ dir: 'desc' })
expect(attr('th.col-name', 'aria-sort')).toBe('descending')
expect(findAll('.data-row')[0].textContent).toContain('Tom Okafor')
await click('th.col-joined .sort-btn')
await flush()
expect(router.currentRoute.value.query).toEqual({ sort: 'joined' })
expect(findAll('.data-row')[0].textContent).toContain('Maya Chen')`,
      },
      {
        name: 'user names link to a detail page',
        code: `${go('/users')}
await click('.user-link')
await flush()
expect(requireModule('router.js').default.currentRoute.value.fullPath).toBe('/users/7')
expect(text('.user-detail')).toContain('amira.haddad@example.com')
${go('/users/999')}
expect(exists('.user-missing')).toBe(true)`,
      },
      {
        name: 'DataTable is controlled: it emits sort requests',
        code: `const table = mountFile('components/DataTable.vue', {
  columns: [{ key: 'city', label: 'City', sortable: true }, { key: 'note', label: 'Note' }],
  rows: [{ id: 1, city: 'Oslo', note: 'HQ' }],
  sortKey: 'city',
  sortDir: 'asc',
})
expect(table.find('th').getAttribute('aria-sort')).toBe('ascending')
expect(table.text()).toContain('Oslo')
await click(table.find('.sort-btn'))
expect(table.emitted('sort')).toEqual([['city', 'desc']])
expect(table.el.querySelectorAll('.sort-btn')).toHaveLength(1)`,
      },
      {
        name: 'focus moves to the main content after navigating',
        code: `await click('.nav-users')
await flush()
expect(document.activeElement && document.activeElement.id).toBe('main')`,
      },
    ],
  },

  steps: [
    {
      title: 'Map pages, layouts and roles before writing code',
      body: [
        `
Write the app down as a table. It becomes your route config:

| Path | Page | Layout | Who may open it |
|---|---|---|---|
| \`/\` | Overview | AdminLayout | viewer, editor, admin |
| \`/users\` | Users (filters in the query) | AdminLayout | editor, admin |
| \`/users/:id\` | User detail | AdminLayout | editor, admin |
| \`/settings\` | Settings (lazy) | AdminLayout | admin |
| \`/forbidden\` | No access | AdminLayout | everyone |
| anything else | Not found | none | everyone |

The "who" column lives in **one file**, \`navigation.js\`, which both the router and the sidebar read. Two lists that must be kept in sync by hand are two lists that will eventually disagree.
`,
        {
          code: `export const NAV = [
  { name: 'overview', label: 'Overview', roles: ['viewer', 'editor', 'admin'] },
  { name: 'users', label: 'Users', roles: ['editor', 'admin'] },
  { name: 'settings', label: 'Settings', roles: ['admin'] },
]

export function canAccess(role, roles) {
  return !roles || roles.includes(role)
}`,
          lang: 'js',
          title: 'navigation.js',
        },
      ],
    },
    {
      title: 'Routes: a layout route, a lazy page and a 404',
      body: [
        `
A *layout route* is a route whose component renders a \`<RouterView>\` for its children ([nested routes](lesson:nested-named-routes)). \`AdminLayout\` contains the sidebar and top bar once; switching pages swaps only the inner \`<RouterView>\`, so the shell is not re-created.
`,
        {
          code: `export const routes = [
  {
    path: '/',
    component: AdminLayout,
    children: [
      { path: '', name: 'overview', component: OverviewView, meta: { title: 'Overview' } },
      { path: 'users', name: 'users', component: UsersView, meta: { title: 'Users' } },
      { path: 'users/:id', name: 'user', component: UserDetailView, props: true, meta: { title: 'User' } },
      { path: 'settings', name: 'settings', component: () => import('./views/SettingsView.vue'), meta: { title: 'Settings' } },
      { path: 'forbidden', name: 'forbidden', component: ForbiddenView, meta: { title: 'No access' } },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Not found' } },
]

const router = createRouter({ history: createMemoryHistory(), routes })`,
          lang: 'js',
          title: 'router.js',
        },
        `
- **\`() => import('./views/SettingsView.vue')\`** makes Settings a *lazy route*: its code is split into a separate chunk and loaded the first time someone navigates there ([lazy routes](lesson:lazy-routes-scroll)). Rarely used pages are good candidates.
- **\`/:pathMatch(.*)*\`** matches anything not matched above — the 404 page ([dynamic routes](lesson:dynamic-routes)).
- **\`props: true\`** passes the \`:id\` param to \`UserDetailView\` as a prop, so the component doesn't depend on \`useRoute()\`.
- **\`App.vue\` only renders \`<RouterView />\`.** The layout is chosen by the routes, not hard-coded in the root.
`,
        {
          callout: 'note',
          title: 'Memory history here, web history in real apps',
          text: 'The sandbox has no address bar, so `createMemoryHistory()` keeps the URL in memory. A real app uses `createWebHistory()` (clean URLs, which needs the server to return index.html for unknown paths) or `createWebHashHistory()` (URLs with `#`, no server config).',
        },
      ],
    },
    {
      title: 'Guard pages with route meta',
      body: [
        `
Attach the roles to each route, then check them in one global guard ([navigation guards](lesson:navigation-guards)). In Vue Router 4+, a guard **returns** its decision: nothing (or \`true\`) to allow, a route location to redirect, \`false\` to cancel.
`,
        {
          code: `{ path: 'users', name: 'users', component: UsersView, meta: { title: 'Users', roles: rolesFor('users') } },

// …

router.beforeEach((to) => {
  const session = useSessionStore()
  if (!canAccess(session.role, to.meta.roles)) {
    return { name: 'forbidden', query: { from: to.fullPath } }
  }
})`,
          lang: 'js',
          title: 'router.js',
        },
        `
\`to.meta\` is the **merge** of the \`meta\` of every matched record, parent first — so you can put shared meta on the layout route and specific meta on children. The \`forbidden\` route has **no** roles on purpose: if it were protected too, a disallowed user would be redirected to it, blocked again, redirected again… an infinite loop.

Because guards run *before* lazy components are resolved, a viewer who types \`/settings\` never even downloads the Settings chunk.

What if the role changes while you are on a page? A navigation to the current location is normally skipped as a duplicate, so the layout re-navigates with \`force: true\` to make the guard run again:
`,
        {
          code: `watch(role, () => {
  router.replace({ path: route.path, query: route.query, hash: route.hash, force: true })
})`,
          lang: 'js',
          title: 'layouts/AdminLayout.vue',
        },
        {
          callout: 'warn',
          title: 'Guards are UX, not security',
          text: 'Everything in the browser can be bypassed: anyone can edit the store in devtools, change the JavaScript, or call your API directly with curl. Route guards and hidden links only decide what the UI shows. The server must authenticate and authorize every request ("is this user allowed to list users?"). See [auth & security](lesson:auth-security).',
        },
      ],
    },
    {
      title: 'Role-aware navigation and focus management',
      body: [
        `
The sidebar is a computed filter over the same \`NAV\` list the guard uses:
`,
        {
          code: `const { user, role } = storeToRefs(session)
const navItems = computed(() => NAV.filter((item) => canAccess(role.value, item.roles)))`,
          lang: 'js',
          title: 'layouts/AdminLayout.vue',
        },
        {
          code: `<nav aria-label="Main">
  <ul>
    <li v-for="item in navItems" :key="item.name">
      <RouterLink :to="{ name: item.name }" class="nav-link" :class="'nav-' + item.name">{{ item.label }}</RouterLink>
    </li>
  </ul>
</nav>`,
          lang: 'vue',
        },
        `
\`<RouterLink>\` renders a real \`<a href>\`, so links work with the keyboard, middle-click and screen readers, and it sets \`aria-current="page"\` on the link to the current page — style the active link with that attribute instead of inventing a class.

**Focus after navigation.** In a classic website every click loads a new document and focus starts at the top. In a single-page app the DOM is patched in place, so a keyboard user who activated "Users" in the sidebar stays in the sidebar, and screen readers may announce nothing. Move focus to the main content after a page change:
`,
        {
          code: `watch(
  () => route.path,
  () => nextTick(() => mainEl.value?.focus()),
)`,
          lang: 'js',
        },
        `
\`<main id="main" ref="mainEl" tabindex="-1">\` can receive focus programmatically (but is not added to the Tab order). Watching \`route.path\` — not \`route.fullPath\` — is deliberate: typing in the search box changes the *query*, and stealing focus on every keystroke would make the search unusable. A "Skip to content" link (\`href="#main"\`) completes the pattern ([accessibility fundamentals](lesson:accessibility-fundamentals)).
`,
      ],
    },
    {
      title: 'A reusable, controlled DataTable',
      body: [
        `
The table does not own data or sorting — the parent passes \`rows\`, \`sortKey\` and \`sortDir\`, and the table *emits* \`sort\` when a header is clicked. That makes it **controlled**: the parent can store the sort wherever it likes (here: the URL).
`,
        {
          code: `const emit = defineEmits(['sort'])

function nextDirection(col) {
  return props.sortKey === col.key && props.sortDir === 'asc' ? 'desc' : 'asc'
}

function ariaSort(col) {
  if (!col.sortable) return undefined
  if (props.sortKey !== col.key) return 'none'
  return props.sortDir === 'asc' ? 'ascending' : 'descending'
}`,
          lang: 'js',
          title: 'components/DataTable.vue',
        },
        {
          code: `<th v-for="col in columns" :key="col.key" scope="col" :class="'col-' + col.key" :aria-sort="ariaSort(col)">
  <button v-if="col.sortable" type="button" class="sort-btn" @click="emit('sort', col.key, nextDirection(col))">
    {{ col.label }} <span aria-hidden="true">{{ arrow(col) }}</span>
  </button>
  <template v-else>{{ col.label }}</template>
</th>

<!-- each cell: a scoped slot with a sensible default -->
<td v-for="col in columns" :key="col.key" :class="'cell-' + col.key">
  <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">{{ row[col.key] }}</slot>
</td>`,
          lang: 'vue',
        },
        `
- **Sort controls are \`<button>\`s** inside the header, so they are focusable and keyboard-operable; \`aria-sort\` on the \`<th>\` tells assistive tech the current order. The arrow is decorative (\`aria-hidden\`).
- **Dynamic scoped slots** (\`:name="'cell-' + col.key"\`) let the parent customise any column — a link for names, a badge for roles — while other columns fall back to plain text ([scoped slots](lesson:scoped-slots)).
`,
        {
          code: `<DataTable :columns="columns" :rows="rows" :sort-key="filters.sort" :sort-dir="filters.dir"
           @sort="(key, dir) => setFilter({ sort: key, dir })">
  <template #cell-name="{ row }">
    <RouterLink class="user-link" :to="{ name: 'user', params: { id: row.id } }">{{ row.name }}</RouterLink>
  </template>
  <template #cell-role="{ value }">
    <span class="badge" :class="'badge-' + value">{{ value }}</span>
  </template>
  <template #empty>No users match these filters.</template>
</DataTable>`,
          lang: 'vue',
          title: 'views/UsersView.vue',
        },
      ],
    },
    {
      title: 'Put the filters in the URL',
      body: [
        `
Filters in component state are lost on reload and cannot be shared. Filters in the **query string** survive reloads, work with the back button and can be sent as a link ([router in practice](lesson:router-in-practice)). The URL becomes the single source of truth; the component just reads it.

Two pure helpers do the conversion. Remember: **the URL is user input.** Someone can type \`?role=superuser\` or \`?sort=password\`; validate everything.
`,
        {
          code: `function pick(value, allowed, fallback) {
  const first = Array.isArray(value) ? value[0] : value // ?role=a&role=b gives an array
  return allowed.includes(first) ? first : fallback
}

export function readFilters(query) {
  const rawQ = Array.isArray(query.q) ? query.q[0] : query.q
  return {
    q: typeof rawQ === 'string' ? rawQ.slice(0, 50) : '',
    role: pick(query.role, ['all', ...ROLES], DEFAULTS.role),
    status: pick(query.status, ['all', ...STATUSES], DEFAULTS.status),
    sort: pick(query.sort, SORT_KEYS, DEFAULTS.sort),
    dir: pick(query.dir, ['asc', 'desc'], DEFAULTS.dir),
  }
}

// Leave out defaults so links stay short: /users?status=invited
export function toQuery(filters) {
  const query = {}
  for (const key of Object.keys(DEFAULTS)) {
    if (filters[key] !== DEFAULTS[key]) query[key] = filters[key]
  }
  return query
}`,
          lang: 'js',
          title: 'userFilters.js',
        },
        `
In the view, filters are *computed from the route*, and changes are written back with \`router.replace\`:
`,
        {
          code: `const filters = computed(() => readFilters(route.query))
const rows = computed(() => applyFilters(USERS, filters.value))

function setFilter(patch) {
  router.replace({ query: toQuery({ ...filters.value, ...patch }) })
}`,
          lang: 'js',
          title: 'views/UsersView.vue',
        },
        `
\`replace\` instead of \`push\`: refining a filter should not add one history entry per keystroke — the back button should leave the page, not undo the letter "g". Spreading \`filters.value\` first keeps the other filters when one changes.

The search box keeps a local \`search\` ref so typing feels instant, with two small watchers: one writes the text to the URL, the other updates the box when the URL changes from outside (back button, a shared link, "Clear filters").
`,
      ],
    },
    {
      title: 'The overview: stat cards and a vertical SVG chart',
      body: [
        `
\`BarChart.vue\` (provided) is the vertical cousin of Project 3's chart. The one new idea: SVG's y axis points **down**, so a bar of height \`h\` that stands on a baseline starts at \`y = BASELINE - h\`:
`,
        {
          code: `const PLOT_H = 120
const TOP = 18
const BASELINE = TOP + PLOT_H

function barHeight(value) {
  return (value / maxValue.value) * PLOT_H
}`,
          lang: 'js',
          title: 'components/BarChart.vue',
        },
        {
          code: `<rect
  class="chart-bar"
  :x="(SLOT - BAR_W) / 2"
  :y="BASELINE - barHeight(item.value)"
  :width="BAR_W"
  :height="barHeight(item.value)"
  rx="4"
/>`,
          lang: 'vue',
        },
        `
As before, the SVG has \`role="img"\`, a visible title referenced by \`aria-labelledby\`, and a \`<desc>\` summarising every value, because \`role="img"\` hides the inner text from assistive technology.

Run the tests. When they pass, switch roles in the top bar while sitting on Users or Settings, share a filtered URL by copying it from \`router.currentRoute.value.fullPath\` in the console, and tab through the app with the keyboard only.
`,
      ],
    },
  ],

  solution: {
    files: {
      ...sharedFiles,
      'router.js': routerJs,
      'layouts/AdminLayout.vue': layoutVue,
      'components/DataTable.vue': tableVue,
      'views/UsersView.vue': usersVue,
      'userFilters.js': userFiltersJs,
    },
    explanation: `
**Routes describe the app.** One layout route hosts every page; Settings is lazy; a catch-all handles unknown URLs; \`App.vue\` only renders \`<RouterView>\`.

**One set of rules, three consumers.** \`navigation.js\` defines who may open what. The router copies those roles into \`meta.roles\`; the global guard enforces them on every navigation; the layout derives the sidebar from them; and a role change re-runs the guard with a forced re-navigation. The forbidden route is deliberately unguarded (no redirect loop) and only accepts in-app \`from\` paths.

**The URL is the state of the Users page.** \`readFilters\` validates the query, \`toQuery\` writes it back without defaults, and \`router.replace\` updates it without polluting history. Reloading, sharing and the back button all just work.

**Reusable, controlled table.** \`DataTable\` renders whatever rows it gets, emits sort requests, exposes \`aria-sort\`, and lets each page customise cells through dynamic scoped slots.

**Accessibility as part of navigation.** Real links with \`aria-current\`, a skip link, focus moved to \`<main>\` on path changes (but not on query changes).

**Simplified:** the data is local and the role switcher is a demo control. In production the session (and role) comes from the server after login (Project 7), the table is paginated and sorted by the API, and — most importantly — every API endpoint checks permissions itself.
`,
  },

  challenges: [
    'Add server-style pagination to the Users table (`?page=2`), keeping it in the URL and resetting it to 1 when a filter changes.',
    'Add a per-column filter dropdown to `DataTable` via a `header-<key>` scoped slot.',
    'Replace role checks with permission checks (`users:edit`, `settings:manage`) — the interview coding question builds the helper — and add a `<Can permission="…">` wrapper component.',
    'Add a second layout (e.g. a full-width "reports" layout) chosen through `meta.layout`.',
    'Persist the sidebar\'s collapsed state in `localStorage` and make it a disclosure button with `aria-expanded`.',
    'Wrap the Overview chart in `defineAsyncComponent` with a loading placeholder, as if it came from a heavy charting library.',
  ],

  mistakes: [
    {
      title: 'Protecting the forbidden page too (redirect loop)',
      wrong: { lang: 'js', code: `{ path: '/', component: AdminLayout, meta: { roles: ['editor', 'admin'] }, children: [\n  // … 'forbidden' inherits roles from the parent → a viewer is redirected to it forever\n] }` },
      right: { lang: 'js', code: `{ path: 'forbidden', name: 'forbidden', component: ForbiddenView, meta: { title: 'No access' } }\n// and no roles on the parent layout route` },
      explanation: '`to.meta` merges parent and child meta. If the redirect target is itself disallowed, the guard redirects to it again and again; Vue Router detects the loop and warns. Keep the redirect target reachable for everyone.',
    },
    {
      title: 'Keeping two separate lists of permissions',
      wrong: { lang: 'js', code: `// router.js\nmeta: { roles: ['admin'] }\n// AdminLayout.vue\nv-if="role === 'admin' || role === 'editor'" // forgot to update one of them` },
      right: { lang: 'js', code: `meta: { roles: rolesFor('settings') }                 // router\nNAV.filter((item) => canAccess(role.value, item.roles)) // sidebar` },
      explanation: 'When links and guards use different rules, users see links that lead to "No access", or cannot find pages they may open. Derive both from one source.',
    },
    {
      title: 'Overwriting other filters when one changes',
      wrong: { lang: 'js', code: `function setFilter(key, value) {\n  router.replace({ query: { [key]: value } }) // drops q, role, sort…\n}` },
      right: { lang: 'js', code: `function setFilter(patch) {\n  router.replace({ query: toQuery({ ...filters.value, ...patch }) })\n}` },
      explanation: 'A new `query` object replaces the whole query string. Start from the current (validated) filters and apply the change.',
    },
    {
      title: 'Trusting query parameters',
      wrong: { lang: 'js', code: `const role = route.query.role // could be 'superuser', an array, or 5,000 characters\nrows = users.filter((u) => u.role === role)` },
      right: { lang: 'js', code: `const filters = computed(() => readFilters(route.query)) // validated, with defaults` },
      explanation: 'The query string is user input. It can be missing, repeated (`?role=a&role=b` gives an array), or malicious. Validate against allowed values and fall back to defaults.',
    },
    {
      title: 'Treating hidden links as security',
      wrong: { lang: 'vue', code: `<RouterLink v-if="role === 'admin'" to="/settings">Settings</RouterLink>\n<!-- "only admins can change settings" -->` },
      right: { lang: 'js', code: `// Server, on every request (pseudocode):\nif (!session.user.permissions.includes('settings:manage')) return 403`, static: true },
      explanation: 'Hiding links and guarding routes is good UX, but anyone can type the URL, edit the store, or call the API directly. Authorization belongs on the server.',
    },
  ],

  debugging: [
    {
      symptom: '"Detected an infinite redirection in a navigation guard" in the console.',
      cause: 'The guard redirects to a route that the same guard rejects (often a protected forbidden or login page).',
      fix: 'Make the redirect target unguarded, or skip the check when `to.name` is the target.',
    },
    {
      symptom: 'Switching role does nothing until you click another link.',
      cause: 'Guards only run on navigation, and navigating to the current location is skipped as a duplicate.',
      fix: 'Re-navigate with `force: true` when the role changes (or redirect explicitly).',
    },
    {
      symptom: 'The search box loses focus after every keystroke.',
      cause: 'Focus management watches `route.fullPath`, which changes when the query changes.',
      fix: 'Watch `route.path` (page changes) for focus management, not the query.',
    },
    {
      symptom: 'The `<select>` shows "All roles" although the URL says `?role=editor`.',
      cause: 'The select uses a local ref initialised once, so it does not follow later URL changes.',
      fix: 'Bind `:value` to the computed filters derived from `route.query` and write changes with `router.replace`.',
    },
  ],

  quiz: [
    {
      id: 'project-admin-dashboard-q1',
      type: 'mcq',
      prompt: 'Why does the Users page keep its filters in the URL query instead of a `ref` in the component?',
      options: [
        { text: 'Refs cannot hold strings', why: 'Refs hold any value. The issue is where the state lives, not its type.' },
        { text: 'So the filtered view survives reloads, works with the back button and can be shared as a link' },
        { text: 'Vue Router requires all state to be in the URL', why: 'The router does not require it; it is a design choice that fits shareable views.' },
        { text: 'It makes filtering faster', why: 'Speed is not the reason; reading the query is not faster than reading a ref.' },
      ],
      answer: 1,
      explanation: 'When the URL is the state, the page is reproducible from its address — bookmarks, reloads, history and shared links all work.',
    },
    {
      id: 'project-admin-dashboard-q2',
      type: 'output',
      prompt: 'The user navigates to `/users`. What does the guard log?',
      code: {
        lang: 'js',
        code: `const routes = [
  {
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [{ path: 'users', component: UsersView, meta: { title: 'Users' } }],
  },
]

router.beforeEach((to) => {
  console.log(JSON.stringify(to.meta))
})`,
      },
      options: ['{"title":"Users"}', '{"requiresAuth":true,"title":"Users"}', '{"requiresAuth":true}', '{}'],
      answer: 1,
      explanation: '`to.meta` is a non-recursive merge of the `meta` of all matched records, from parent to child, so it contains both fields.',
    },
    {
      id: 'project-admin-dashboard-q3',
      type: 'bug',
      prompt: 'After choosing a status, the search text and role filter disappear from the URL. Click the buggy line.',
      code: {
        lang: 'js',
        code: `const route = useRoute()
const router = useRouter()
const filters = computed(() => readFilters(route.query))

function setStatus(status) {
  router.replace({ query: { status } })
}

function setRole(role) {
  router.replace({ query: toQuery({ ...filters.value, role }) })
}`,
      },
      answerLine: 6,
      explanation: '`{ query: { status } }` replaces the whole query string with just `status`. Merge with the current filters first, as `setRole` does.',
    },
    {
      id: 'project-admin-dashboard-q4',
      type: 'fill',
      prompt: 'Complete the sandbox router and the catch-all 404 route.',
      code: { lang: 'js', code: `const router = createRouter({\n  history: ___(),\n  routes: [\n    // …\n    { path: '/:pathMatch(.*)___', name: 'not-found', component: NotFoundView },\n  ],\n})` },
      answer: [['createMemoryHistory'], ['*']],
      explanation: '`createMemoryHistory()` keeps the URL in memory (sandbox, SSR, tests); real apps use `createWebHistory()`. `/:pathMatch(.*)*` matches any path, including slashes, as a repeatable param.',
    },
    {
      id: 'project-admin-dashboard-q5',
      type: 'short',
      prompt: 'A viewer cannot see the Settings link and the guard blocks `/settings`. Is the settings API safe? Explain.',
      answer: 'No — not because of the UI. The link and the guard only control what the browser shows. Anyone can call the settings API directly (curl, devtools, a modified bundle) or change the role in the client store. The API is only safe if the server authenticates the request and checks that the user really has permission to change settings.',
    },
  ],

  interview: [
    {
      id: 'project-admin-dashboard-layout-routes',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How does your dashboard render the same sidebar on every page? What are the alternatives?',
      answer: 'All pages are children of a layout route whose component (`AdminLayout`) contains the sidebar, the top bar and a nested `<RouterView>`. Navigating between children only swaps the inner view, so the shell stays mounted. Alternatives: wrapping every page in a `<Layout>` component (repetitive, re-mounts the shell when the page component changes), or choosing a layout component in `App.vue` from `route.meta.layout` (useful when there are several layouts).',
      explanation: 'Nested routes map naturally to nested UI.',
      whyAsked: 'Layout structure is one of the first architecture decisions in any routed app.',
      mistakes: ['Putting the sidebar in App.vue with `v-if` checks for pages that should not have it.', 'Not knowing that the parent component stays mounted between child navigations.'],
      followUps: ['How would you give the login page a different layout?', 'What happens to the layout\'s state when you switch pages?'],
      modelAnswer: 'I used a layout route: the route for "/" renders AdminLayout, which has the sidebar, the top bar and its own RouterView, and every page is a child route. When you move between children only the inner view changes, so the layout keeps its state and is not re-rendered from scratch. For pages that need a different shell, like a 404 or login page, I put them outside that parent route. If an app had many layouts, I would pick the layout in App.vue from route.meta.layout instead.',
    },
    {
      id: 'project-admin-dashboard-redirect-loop',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A teammate adds `meta: { roles: [\'editor\', \'admin\'] }` to the layout route "so all admin pages are protected". Now viewers get a blank screen and the console warns about an infinite redirect. Why?',
      answer: 'Children inherit parent meta through the merged `to.meta`, so the forbidden page (a child of the layout) now requires editor or admin too. A viewer is redirected to forbidden, the guard rejects it and redirects to forbidden again — a loop that Vue Router aborts. Fix: keep the redirect target unprotected (move it out of the protected parent or override its roles) or skip the check when `to.name === \'forbidden\'`.',
      explanation: 'Every redirect target of a guard must itself pass that guard.',
      whyAsked: 'Classic guard bug; tests understanding of meta merging and guard flow.',
      mistakes: ['Blaming the store.', 'Suggesting `next()` changes as the fix without explaining the loop.'],
      followUps: ['How exactly is `to.meta` merged?', 'Where should the login page live in the route tree?'],
      modelAnswer: 'to.meta merges the meta of every matched record from parent to child, so putting roles on the layout route protects every child, including the forbidden page. A viewer hits a protected page, gets redirected to forbidden, and the guard rejects that too — an infinite redirect, which Vue Router detects and stops. The fix is to make sure the redirect target always passes: keep forbidden and login outside the protected parent, or give them an explicit exemption. I would also add a test that a disallowed role ends up on the forbidden page.',
    },
    {
      id: 'project-admin-dashboard-shareable-filters',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Support asks: "I want to send an engineer a link that opens the Users page showing only suspended editors, sorted by join date." How did you make that possible, and what did you have to be careful about?',
      answer: 'Filters and sort live in the query string (`/users?role=editor&status=suspended&sort=joined`). The page computes its filters from `route.query`, so opening the link reproduces the view. Care points: validate every value (the URL is user input; arrays and unknown values fall back to defaults), omit defaults for clean URLs, use `replace` for filter edits so history is not flooded, keep other filters when one changes, and make sure the recipient\'s role allows the page — otherwise the guard sends them to "No access" with a `from` link.',
      explanation: 'URL as state, with validation.',
      whyAsked: 'Shows product thinking and real-world router usage.',
      mistakes: ['Storing filters in a store and serialising "sometimes".', 'Not validating query values.', 'Using push for every keystroke.'],
      followUps: ['How would you add pagination to this?', 'What if the filter set grows to 15 fields?'],
      modelAnswer: 'I made the URL the source of truth for the Users page. Filters and sorting are read from route.query through a readFilters function that validates each value against an allowed list and falls back to defaults, because a URL can contain anything. Changes go through router.replace with a toQuery helper that merges with the current filters and drops defaults, so the link stays short and the back button is not flooded. Opening the shared link simply reproduces the view. If the engineer\'s role is not allowed, the guard sends them to the no-access page, which keeps the original path so they can retry after getting access.',
    },
    {
      id: 'project-admin-dashboard-rbac',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Describe the full access-control design you would ship for this dashboard, from database to button.',
      answer: 'Server: authenticate every request (session cookie or token), load the user\'s permissions, and authorize each endpoint and each record (e.g. "can list users", "can suspend this user") — this is the only real enforcement. Client: receive the user and their permissions after login, keep them in a session store, derive navigation, route guards (`meta`) and button visibility (`can(\'users:suspend\')`) from one permission map, re-check when permissions change, and handle 401/403 responses gracefully (re-login, "no access"). Prefer permissions over raw role names so roles can change without code changes.',
      explanation: 'Server enforces; client reflects.',
      whyAsked: 'Senior frontend engineers must understand where security lives and keep client checks consistent.',
      mistakes: ['Relying on guards for security.', 'Hard-coding role names in dozens of components.', 'Not handling permissions changing mid-session.'],
      followUps: ['How do you keep client and server permission maps in sync?', 'What do you do when an API returns 403 for something the UI allowed?'],
      modelAnswer: 'Enforcement lives on the server: every endpoint authenticates the request and checks a permission, and record-level rules, like not suspending yourself, are checked there too. The client gets the current user and their permissions after login and stores them in a session store. From that single source I derive the sidebar, route meta checked by a global guard, and button visibility through a can helper — permissions rather than role names, so changing what an editor may do does not require a frontend release. When permissions change I re-run the guards, and any 401 or 403 from the API is handled centrally: re-authenticate or show a no-access message, because the server is always right.',
    },
    {
      id: 'project-admin-dashboard-scale',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'The company grows to 200,000 users and 30 dashboard pages. What changes in this design?',
      answer: 'Data: move filtering, sorting and pagination to the API — the URL query maps directly to API parameters — and render only one page of rows (or virtualize). Code: lazy-load most routes and heavy widgets (charts) so the initial bundle stays small; split stores by feature. UX: debounce search, show loading and error states per page, keep previous results while loading, cache recent queries. Structure: feature folders (users/, billing/) each owning routes, views, stores and API modules.',
      explanation: 'The URL-as-state design scales well because it already describes the query the server needs.',
      whyAsked: 'Tests whether you can evolve a design instead of only building toys.',
      mistakes: ['Downloading all users to filter in the browser.', 'Making every route eager.', 'Quoting made-up performance numbers instead of saying "measure".'],
      followUps: ['How would you measure whether lazy-loading helped?', 'How would you organise route files across features?'],
      modelAnswer: 'The biggest change is data: I would stop shipping all users to the browser and let the API filter, sort and paginate. Because filters already live in the URL, the query maps almost one to one onto API parameters, and each page change becomes a request with loading, error and cancellation handling like in the API explorer. With 30 pages I would lazy-load most routes and heavy widgets, organise code by feature so each area owns its routes, store and API module, and measure bundle size and navigation timings before and after rather than guessing.',
    },
    {
      id: 'project-admin-dashboard-coding-permissions',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Roles inherit permissions: an editor has everything a viewer has, an admin everything an editor has. Fix `permissionsFor(role)` in `permissions.js` so it returns all permissions including inherited ones (no duplicates), and unknown roles get none. `can(role, permission)` should then work for every role.',
      starter: { files: { 'App.vue': permApp, 'permissions.js': permStarter } },
      tests: [
        {
          name: 'roles inherit permissions',
          code: `const { can } = requireModule('permissions.js')
expect(can('viewer', 'dashboard:view')).toBe(true)
expect(can('editor', 'dashboard:view')).toBe(true)
expect(can('admin', 'users:edit')).toBe(true)
expect(can('admin', 'dashboard:view')).toBe(true)`,
        },
        {
          name: 'permissions do not leak downwards',
          code: `const { can } = requireModule('permissions.js')
expect(can('viewer', 'users:edit')).toBe(false)
expect(can('editor', 'settings:manage')).toBe(false)
expect(can('admin', 'billing:refund')).toBe(false)`,
        },
        {
          name: 'unknown roles have no permissions; no duplicates',
          code: `const { permissionsFor } = requireModule('permissions.js')
expect(permissionsFor('superuser')).toEqual([])
const admin = permissionsFor('admin')
expect(admin).toHaveLength(5)
expect(new Set(admin).size).toBe(admin.length)`,
        },
      ],
      hints: [
        'Walk up the chain: admin → editor → viewer → null, using `INHERITS`.',
        'Collect permissions into a `Set` to avoid duplicates, then return `[...set]`.',
        'Stop when the role is unknown (`Object.hasOwn(ROLE_PERMISSIONS, current)` is false); a `seen` set protects against accidental cycles.',
      ],
      answer: 'Loop from the role up through `INHERITS`, adding each role\'s permissions to a Set, stopping at an unknown role or a role already visited, and return the Set as an array.',
      solution: { files: { 'App.vue': permApp, 'permissions.js': permSolution } },
      explanation: 'Describing access as data (permissions per role + an inheritance chain) keeps checks in one place. Components ask `can(role, \'users:edit\')` instead of comparing role names, so changing the policy does not touch the UI code.',
      whyAsked: 'Permission modelling comes up constantly in dashboard work; the cycle guard and dedupe show care for edge cases.',
      mistakes: ['Recursion without a base case for unknown roles.', 'Returning duplicates.', 'Hard-coding `role === \'admin\'` checks in components instead.'],
      followUps: ['How would you support a user with several roles?', 'Where should this map come from in production?'],
      modelAnswer: 'I walk up the inheritance chain starting at the given role, adding each role\'s permissions to a Set so duplicates disappear, and stop when I reach null or an unknown role. A seen set protects against a misconfigured cycle. Unknown roles return an empty list, so can is false by default — fail closed. In production I would receive the user\'s effective permissions from the server rather than compute policy in the client, and use this helper only to reflect them in the UI.',
    },
  ],

  takeaways: [
    'A layout route with a nested `<RouterView>` gives every page the same shell; `App.vue` just hosts the router.',
    'Route `meta` + one global guard decide which pages a role may open — keep the redirect target unguarded, and re-run guards (`force: true`) when roles change.',
    'Derive navigation, guards and buttons from one source of rules — and remember all of it is UX: the server must authorize every request.',
    'Put shareable view state (filters, sort) in the URL query: validate it, omit defaults, and update it with `router.replace`.',
    'Reusable tables are controlled (parent owns rows and sort), customisable with scoped slots, and accessible (`<button>` headers, `aria-sort`).',
  ],
}
