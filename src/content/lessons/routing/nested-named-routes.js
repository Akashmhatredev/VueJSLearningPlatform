// Lesson: Nested routes, named routes & programmatic navigation.

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'

createApp(App).use(router).mount('#app')`

const routerJs = `import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from './HomePage.vue'
import SettingsLayout from './SettingsLayout.vue'
import ProfileSettings from './ProfileSettings.vue'
import SecuritySettings from './SecuritySettings.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  {
    path: '/settings',
    component: SettingsLayout, // renders its own <RouterView />
    children: [
      // '' is the default child: it renders at /settings
      { path: '', name: 'settings-profile', component: ProfileSettings },
      // a relative path: it renders at /settings/security
      { path: 'security', name: 'settings-security', component: SecuritySettings },
    ],
  },
]

const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

export default router`

const appVue = `<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <nav class="top">
    <RouterLink :to="{ name: 'home' }">Home</RouterLink>
    <RouterLink :to="{ name: 'settings-profile' }">Settings</RouterLink>
  </nav>
  <p class="url">URL: <code>{{ route.fullPath }}</code> · name: <code>{{ route.name }}</code></p>

  <!-- Depth 0: renders HomePage or SettingsLayout -->
  <RouterView />
</template>

<style>
.top { display: flex; gap: 8px; }
.top a { padding: 3px 10px; border: 1px solid #ddd; border-radius: 6px; text-decoration: none; color: #333; }
.top a.router-link-active { background: #222; color: #fff; }
.url { font-size: 12px; color: #555; }
</style>`

const homeVue = `<template>
  <section class="home-page">
    <h2>Welcome back</h2>
    <p>Open <strong>Settings</strong>, type something into the layout's note box, then switch tabs.</p>
  </section>
</template>`

const settingsLayoutVue = `<script setup>
import { ref } from 'vue'

// Local state of the LAYOUT. It survives switching between child tabs,
// because the layout component is not re-created.
const note = ref('')
</script>

<template>
  <section class="settings-layout">
    <aside class="sidebar">
      <h2>Settings</h2>
      <RouterLink :to="{ name: 'settings-profile' }">Profile</RouterLink>
      <RouterLink :to="{ name: 'settings-security' }">Security</RouterLink>
      <input v-model="note" class="layout-note" placeholder="Type, then switch tabs" />
    </aside>

    <div class="panel">
      <!-- Depth 1: child routes render here -->
      <RouterView />
    </div>

    <div class="aside-view">
      <!-- A named view: only filled by routes that provide an "aside" component -->
      <RouterView name="aside" />
    </div>
  </section>
</template>

<style scoped>
.settings-layout { display: grid; grid-template-columns: 150px 1fr 140px; gap: 12px; margin-top: 8px; }
.sidebar { display: flex; flex-direction: column; gap: 6px; }
.sidebar a.router-link-exact-active { font-weight: bold; }
.panel { border-left: 1px dashed #ccc; padding-left: 12px; }
</style>`

const profileVue = `<script setup>
import { ref } from 'vue'
const displayName = ref('Ada')
</script>

<template>
  <div class="profile-settings">
    <h3>Profile</h3>
    <label>Display name <input v-model="displayName" /></label>
  </div>
</template>`

const securityVue = `<script setup>
import { ref } from 'vue'
const twoFactor = ref(false)
</script>

<template>
  <div class="security-settings">
    <h3>Security</h3>
    <label><input v-model="twoFactor" type="checkbox" /> Two-factor authentication</label>
  </div>
</template>`

const notificationsVue = `<script setup>
import { ref } from 'vue'
const weeklyEmail = ref(true)
</script>

<template>
  <div class="notifications-settings">
    <h3>Notifications</h3>
    <label><input v-model="weeklyEmail" type="checkbox" /> Weekly summary email</label>
  </div>
</template>`

const tipsVue = `<template>
  <div class="security-tips">
    <strong>Tip</strong>
    <p>Use a password manager and turn on two-factor authentication.</p>
  </div>
</template>`

// ---------- exercise 1: course pages with nested tabs
const coursePages = {
  'CourseOverview.vue': `<template><p class="overview">What you will learn in this course.</p></template>`,
  'CourseLessons.vue': `<template><ol class="lessons"><li>Intro</li><li>Setup</li></ol></template>`,
  'CourseReviews.vue': `<template><p class="reviews">★★★★☆ — "Clear and practical."</p></template>`,
  'HomePage.vue': `<template>
  <RouterLink class="open-course" to="/courses/vue-101">Open Vue 101</RouterLink>
</template>`,
  'App.vue': `<template>
  <RouterView />
</template>`,
}

// ---------- exercise 2: notes with replace
const notesApi = `// A fake API kept in memory.
const notes = [{ id: 1, title: 'Buy flour' }]
let nextId = 2

export function listNotes() {
  return notes
}

export function getNote(id) {
  return notes.find((n) => n.id === id) ?? null
}

export function createNote(title) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const note = { id: nextId++, title }
      notes.push(note)
      resolve(note)
    }, 120)
  })
}`
const notesRouter = `import { createRouter, createMemoryHistory } from 'vue-router'
import NoteList from './NoteList.vue'
import NewNote from './NewNote.vue'
import NotePage from './NotePage.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'notes', component: NoteList },
    // static segment "new" outranks the :id param below
    { path: '/notes/new', name: 'note-new', component: NewNote },
    {
      path: '/notes/:id(\\\\d+)',
      name: 'note',
      component: NotePage,
      props: (route) => ({ id: Number(route.params.id) }),
    },
  ],
})`
const notesShared = {
  'main.js': mainJs,
  'router.js': notesRouter,
  'api.js': notesApi,
  'App.vue': `<template>
  <RouterView />
</template>`,
  'NoteList.vue': `<script setup>
import { listNotes } from './api.js'
const notes = listNotes()
</script>

<template>
  <h2>Notes</h2>
  <RouterLink class="new-note" :to="{ name: 'note-new' }">+ New note</RouterLink>
  <ul>
    <li v-for="n in notes" :key="n.id">
      <RouterLink :to="{ name: 'note', params: { id: n.id } }">{{ n.title }}</RouterLink>
    </li>
  </ul>
</template>`,
  'NotePage.vue': `<script setup>
import { computed } from 'vue'
import { getNote } from './api.js'

const props = defineProps({ id: { type: Number, required: true } })
const note = computed(() => getNote(props.id))
</script>

<template>
  <article>
    <h2 v-if="note" class="note-title">{{ note.title }}</h2>
    <p v-else>Note not found.</p>
    <RouterLink :to="{ name: 'notes' }">All notes</RouterLink>
  </article>
</template>`,
}

// ---------- interview coding: admin layout
const adminSidebar = `<template>
  <nav class="admin-sidebar">
    <RouterLink to="/admin/users">Users</RouterLink>
    <RouterLink to="/admin/reports">Reports</RouterLink>
  </nav>
</template>`
const adminHome = `<template>
  <RouterLink to="/admin">Admin</RouterLink>
</template>`

export default {
  id: 'nested-named-routes',
  title: 'Nested routes, named routes & programmatic navigation',
  summary: 'Build layouts with child routes and nested RouterViews, navigate by route name instead of hard-coded paths, and move users around from code with push and replace.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['router-basics', 'dynamic-routes'],
  related: ['navigation-guards', 'lazy-routes-scroll', 'router-in-practice', 'props', 'slots'],
  tags: ['vue router', 'nested routes', 'children', 'named routes', 'named views', 'router.push', 'router.replace', 'redirect', 'alias', 'route props', 'layouts'],
  apis: [
    { name: 'children', summary: 'Route records nested inside a parent record; they render in the parent component\'s `<RouterView />`.' },
    { name: 'name', summary: 'A unique name for a route record, used to navigate without hard-coding paths.' },
    { name: 'router.push()', summary: 'Navigates to a location and adds a history entry. Returns a Promise.' },
    { name: 'router.replace()', summary: 'Navigates without adding a history entry — it replaces the current one.' },
    { name: 'router.go(n) / back() / forward()', summary: 'Moves through the history stack.' },
    { name: 'redirect', summary: 'Sends a matched path somewhere else; the URL changes to the target.' },
    { name: 'alias', summary: 'An extra path that renders the same route; the URL keeps the alias.' },
    { name: 'components (named views)', summary: 'Several components for one route, rendered into `<RouterView name="…" />` outlets.' },
  ],
  docs: [
    { label: 'Vue Router — Nested Routes', url: 'https://router.vuejs.org/guide/essentials/nested-routes.html' },
    { label: 'Vue Router — Named Routes', url: 'https://router.vuejs.org/guide/essentials/named-routes.html' },
    { label: 'Vue Router — Programmatic Navigation', url: 'https://router.vuejs.org/guide/essentials/navigation.html' },
    { label: 'Vue Router — Named Views', url: 'https://router.vuejs.org/guide/essentials/named-views.html' },
    { label: 'Vue Router — Redirect and Alias', url: 'https://router.vuejs.org/guide/essentials/redirect-and-alias.html' },
    { label: 'Vue Router — Passing Props to Route Components', url: 'https://router.vuejs.org/guide/essentials/passing-props.html' },
  ],

  intro: `
Most apps have pages *inside* pages. A **Settings** screen has a sidebar that stays put while its content switches between Profile, Security and Notifications. A course page keeps its title and tabs while you move between Overview, Lessons and Reviews.

**Nested routes** model exactly that. A parent route renders a *layout* component, and that layout contains its own \`<RouterView />\` where **child routes** appear. The URL nests the same way: \`/settings\` → \`/settings/security\`.

Two more tools make routing manageable as an app grows. **Named routes** let you link to \`{ name: 'settings-security' }\` instead of typing paths everywhere. And **programmatic navigation** — \`router.push()\`, \`router.replace()\`, \`router.back()\` — lets your code move the user, for example after saving a form.
`,

  why: `
Without nesting you'd copy the sidebar into every settings page. Worse, switching tabs would destroy and recreate the sidebar each time — losing its scroll position, any input in it, and re-running any data loading it does.

Hard-coded paths have their own cost. If \`/settings/security\` becomes \`/account/security\`, every \`to="/settings/security"\` and \`push('/settings/security')\` in the codebase must change. With named routes you change **one line** in the route table.

And many navigations aren't link clicks at all: "after login, go to the dashboard", "after creating a note, open it", "cancel → back to the list". That's what \`push\` and \`replace\` are for — and choosing the right one decides what the **Back** button does.
`,

  eli15: `
Picture a set of Russian dolls — or a picture frame with a smaller frame inside it.

The big frame is your app: logo and top menu. Inside it, a medium frame: the Settings page with its sidebar. Inside *that*, a small frame showing whichever tab you picked. Each frame is a \`<RouterView />\`, and each level of the URL fills one frame: \`/settings\` fills the medium one, \`/security\` fills the small one.

When you switch tabs, only the small frame's picture changes. The bigger frames don't move — so whatever you typed in the sidebar is still there.

**Named routes** are like saving contacts by name instead of memorising phone numbers. If someone's number changes, you update the contact once; you still just tap "Mum".

**push vs replace**: \`push\` adds a new page to your browser's history stack (Back returns to where you were). \`replace\` swaps the current page out (Back skips it) — perfect for "you just logged in, don't send me back to the login form".
`,

  analogy: {
    title: 'A building directory',
    body: `
A big office building has floors, and each floor has rooms. The lobby (your app) is always there. Take the lift to the 3rd floor (the Settings layout): the corridor and its signs stay the same as you walk between rooms 301 and 302 (child routes).

The address "3rd floor, room 302" is the nested URL \`/settings/security\`. The receptionist's phone list ("Security team → ext. 302") is a named route — if Security moves to room 405, the receptionist updates one entry and everyone keeps asking for "Security". And when the receptionist escorts you somewhere, they can either let you retrace your steps later (\`push\`) or quietly not count the detour (\`replace\`).
`,
    mapping: [
      ['the lobby', 'App.vue and its top-level `<RouterView />`'],
      ['a floor with a corridor', 'a parent route with a layout component'],
      ['the rooms on that floor', 'child routes rendered in the layout\'s `<RouterView />`'],
      ['"Security team" on the phone list', 'a named route: `{ name: \'settings-security\' }`'],
      ['being escorted', '`router.push()` / `router.replace()`'],
    ],
  },

  visual: {
    type: 'router',
    props: { preset: 'nested' },
    title: 'Nested matching, level by level',
    caption: 'Navigate a real router with a parent layout and child routes: see which records match, and which `<RouterView />` renders which component at each depth.',
    alt: 'An interactive router diagram. The URL /settings/security matches two records: a parent /settings with a layout component and a child security record. The outer RouterView renders the layout; the layout\'s inner RouterView renders the security page.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'One URL, two RouterViews',
    caption: 'How `/settings/security` fills the outer and inner `<RouterView />` — plus a named view.',
    alt: 'The URL /settings/security produces a matched array with two records. Record 0, the /settings parent, is rendered by App.vue\'s RouterView at depth 0 as SettingsLayout. Record 1, the security child, is rendered by the layout\'s RouterView at depth 1 as SecuritySettings, and its aside component fills the named RouterView.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'url', label: '/settings/security', note: 'the URL', tone: 'ink', x: 100, y: 160 },
        { id: 'parent', label: 'matched[0]', note: "path '/settings'", x: 300, y: 80 },
        { id: 'child', label: 'matched[1]', note: "path 'security'", x: 300, y: 240 },
        { id: 'outer', label: 'App <RouterView>', note: 'depth 0 → SettingsLayout', tone: 'acid', x: 530, y: 80 },
        { id: 'inner', label: 'Layout <RouterView>', note: 'depth 1 → SecuritySettings', tone: 'acid', x: 530, y: 240 },
        { id: 'named', label: '<RouterView name="aside">', note: 'SecurityTips', tone: 'cobalt', x: 680, y: 160 },
      ],
      edges: [
        { from: 'url', to: 'parent' },
        { from: 'url', to: 'child' },
        { from: 'parent', to: 'outer' },
        { from: 'child', to: 'inner' },
        { from: 'child', to: 'named', dashed: true },
      ],
      steps: [
        { focus: ['url'], text: 'The router matches `/settings/security`. A nested match is not one record but a **chain**: the parent and the child.' },
        { focus: ['parent', 'child'], edges: ['url->parent', 'url->child'], text: '`route.matched` is an array: `[settingsRecord, securityRecord]`. Index = nesting depth.' },
        { focus: ['outer'], edges: ['parent->outer'], text: 'The `<RouterView />` in **App.vue** is at depth 0, so it renders `matched[0]` — the SettingsLayout.' },
        { focus: ['inner'], edges: ['child->inner'], text: 'SettingsLayout contains another `<RouterView />`, at depth 1. It renders `matched[1]` — SecuritySettings. Switching to Profile only changes this level; the layout stays mounted.' },
        { focus: ['named'], edges: ['child->named'], text: 'A route can provide several components (`components: { default, aside }`). Each one goes to the `<RouterView>` with the matching `name` at that depth — these are **named views**.' },
      ],
    },
  },

  syntax: [
    `
#### Nested routes

Put child records in \`children\`. The parent's component must render a \`<RouterView />\` for them:
`,
    {
      code: `{
  path: '/settings',
  component: SettingsLayout,          // must contain <RouterView />
  children: [
    { path: '', name: 'settings-profile', component: ProfileSettings },   // /settings
    { path: 'security', name: 'settings-security', component: SecuritySettings }, // /settings/security
  ],
}`,
      lang: 'js',
      title: 'children',
      static: true,
    },
    `
- A child path **without** a leading slash is relative: \`'security'\` → \`/settings/security\`.
- A child path **with** a leading slash is absolute: \`'/security'\` → \`/security\` — still rendered inside the layout, but the URL is no longer nested. Usually a mistake.
- An **empty path** \`''\` is the default child, shown at the parent's own URL. Give the **child** the name, not the parent: navigating to a named parent renders the layout *without* its empty-path child (Vue Router warns about this in development).

#### Named routes

Add a \`name\` to a record, then navigate with an object. Params are filled into the path for you:
`,
    {
      code: `{ path: '/users/:id', name: 'user', component: UserProfile }

<RouterLink :to="{ name: 'user', params: { id: 7 } }">Ada</RouterLink>   <!-- href="/users/7" -->

router.push({ name: 'user', params: { id: 7 }, query: { tab: 'posts' } })`,
      lang: 'js',
      title: 'named routes',
    },
    `
If you navigate to a named route and leave out a param it needs, Vue Router reuses the current location's param with the same name — handy for tabs: from \`/courses/vue-101\`, \`{ name: 'course-lessons' }\` resolves to \`/courses/vue-101/lessons\`.

#### Programmatic navigation
`,
    {
      code: `const router = useRouter()

router.push('/settings')                                   // a path string
router.push({ path: '/search', query: { q: 'vue' } })      // path + query
router.push({ name: 'user', params: { id: 7 }, hash: '#posts' })

router.replace({ name: 'home' })     // like push, but replaces the current history entry
router.push({ name: 'home', replace: true })  // same thing

router.back()      // = router.go(-1)
router.forward()   // = router.go(1)
router.go(-2)      // two steps back

await router.push('/settings')   // push returns a Promise that settles when navigation finishes`,
      lang: 'js',
      title: 'push, replace, go',
    },
    `
\`<RouterLink to="…" replace>\` is the link version of \`replace\`. \`path\` and \`params\` don't mix: in \`{ path: '/users', params: { id: 7 } }\` the params are **ignored** — use \`name\` with \`params\`, or build the full path.

#### Redirect and alias
`,
    {
      code: `{ path: '/account', redirect: '/settings' }                       // URL becomes /settings
{ path: '/account', redirect: { name: 'settings-profile' } }
{ path: '/u/:id', redirect: (to) => ({ name: 'user', params: { id: to.params.id } }) }

{ path: '/settings', component: SettingsLayout, alias: '/preferences', children: [/* … */] }
// /preferences renders the same thing, and the URL stays /preferences`,
      lang: 'js',
      title: 'redirect & alias',
    },
    `
#### Named views

One route can fill several outlets. Use \`components\` (plural) and give the extra \`<RouterView>\`s a \`name\`; the unnamed one is \`default\`:
`,
    {
      code: `{
  path: 'security',
  components: { default: SecuritySettings, aside: SecurityTips },
}

<!-- in the layout -->
<RouterView />              <!-- default -->
<RouterView name="aside" /> <!-- aside: empty for routes that don't provide one -->`,
      lang: 'js',
      title: 'named views',
    },
    `
#### Route props: three modes
`,
    {
      code: `{ path: '/users/:id', component: User, props: true }                    // params → props
{ path: '/promo', component: Banner, props: { variant: 'spring' } }      // a static object
{ path: '/search', component: Search, props: (route) => ({ q: route.query.q ?? '' }) } // a function

// with named views, set props per view:
{ path: '/users/:id', components: { default: User, aside: UserTips }, props: { default: true, aside: false } }`,
      lang: 'js',
      title: 'props: boolean, object, function',
    },
  ],

  walkthrough: {
    title: 'router.js',
    lang: 'js',
    code: routerJs,
    intro: 'The playground\'s route table has one top-level page and one parent with two children. Step through it.',
    steps: [
      { lines: [8], text: 'A plain top-level route with a **name**. Links can now say `{ name: \'home\' }` instead of `\'/\'`.' },
      { lines: [9, 11], text: 'The **parent** record. Its component is a layout — SettingsLayout — which contains its own `<RouterView />`. Note the parent has no name: its default child does.' },
      { lines: [12, 17], text: '`children` are ordinary route records, rendered inside the parent\'s `<RouterView />`. Their paths are joined to the parent\'s path.' },
      { lines: [13, 14], text: 'The **empty path** child renders at `/settings` itself — the default tab. It carries the name, so `{ name: \'settings-profile\' }` renders layout *and* tab.' },
      { lines: [15, 16], text: 'No leading slash means *relative*: `\'security\'` becomes `/settings/security`. Switching between these children only swaps the inner view.' },
      { lines: [21, 24], text: 'Creating the router is unchanged: nesting is purely a property of the route records.' },
    ],
  },

  playground: {
    title: 'Settings with a persistent layout',
    objective: 'See a layout survive tab switches, then add a child route, navigate by name from code, add a redirect and fill a named view.',
    files: {
      'main.js': mainJs,
      'router.js': routerJs,
      'App.vue': appVue,
      'HomePage.vue': homeVue,
      'SettingsLayout.vue': settingsLayoutVue,
      'ProfileSettings.vue': profileVue,
      'SecuritySettings.vue': securityVue,
      'NotificationsSettings.vue': notificationsVue,
      'SecurityTips.vue': tipsVue,
    },
    entry: 'main.js',
    expected: 'Open **Settings**: a sidebar, a Profile panel and an empty right column. Type into the sidebar\'s note box, then switch between Profile and Security — the note **stays**, because only the inner `<RouterView />` changes. The top **Settings** link stays highlighted on both tabs. `NotificationsSettings.vue` and `SecurityTips.vue` exist but no route uses them yet.',
    experiments: [
      {
        id: 'add-child',
        task: 'Add a **Notifications** tab: a child route `notifications` named `settings-notifications` that renders `NotificationsSettings`, plus a sidebar link to it by name.',
        hint: 'In `router.js` import the component and add `{ path: \'notifications\', name: \'settings-notifications\', component: NotificationsSettings }` to `children`. In `SettingsLayout.vue` add `<RouterLink :to="{ name: \'settings-notifications\' }">Notifications</RouterLink>`.',
        tests: [
          {
            name: 'the notifications tab renders inside the layout at /settings/notifications',
            code: `const router = requireModule('router.js').default
await router.push({ name: 'settings-notifications' })
await flush()
expect(router.currentRoute.value.fullPath).toBe('/settings/notifications')
expect(exists('.settings-layout .notifications-settings')).toBe(true)
const link = findAll('.sidebar a').find((a) => /notification/i.test(a.textContent))
expect(link).toBeTruthy()
expect(link.getAttribute('href')).toBe('/settings/notifications')`,
          },
        ],
        explain: 'A child is just another record in `children`; its relative path is joined to the parent\'s. The link didn\'t need a path at all — the router built `href="/settings/notifications"` from the name.',
      },
      {
        id: 'jump-select',
        task: 'On **HomePage**, add a `<select class="jump">` with options whose values are route names (`settings-profile`, `settings-security`). Choosing one navigates there with `router.push({ name })`.',
        hint: 'In `HomePage.vue`: `const router = useRouter()`, then `<select class="jump" @change="router.push({ name: $event.target.value })">` with `<option value="settings-security">Security</option>` etc. Add a first placeholder option with an empty value.',
        tests: [
          {
            name: 'choosing Security navigates to /settings/security',
            code: `expect(exists('select.jump')).toBe(true)
await select('select.jump', 'settings-security')
await flush()
const router = requireModule('router.js').default
expect(router.currentRoute.value.fullPath).toBe('/settings/security')
expect(exists('.security-settings')).toBe(true)`,
          },
        ],
        explain: 'Programmatic navigation is for navigation that isn\'t a plain link — here, reacting to a `<select>`. Pushing a **name** means this code keeps working if the settings URLs are ever renamed.',
      },
      {
        id: 'redirect',
        task: 'Old emails link to `/account`. Add a route that **redirects** `/account` to the profile settings tab.',
        hint: 'Add `{ path: \'/account\', redirect: { name: \'settings-profile\' } }` to the top-level routes.',
        tests: [
          {
            name: '/account ends up at /settings (profile)',
            code: `const router = requireModule('router.js').default
await router.push('/account')
await flush()
expect(router.currentRoute.value.fullPath).toBe('/settings')
expect(router.currentRoute.value.name).toBe('settings-profile')
expect(exists('.profile-settings')).toBe(true)`,
          },
        ],
        explain: 'A redirect is resolved during matching: the navigation never "lands" on `/account`, and the URL shows the target. An `alias` would instead keep `/account` in the address bar while rendering the same page. Redirects are the standard tool for keeping old links alive after a URL change.',
      },
      {
        id: 'named-view',
        task: 'Show `SecurityTips` in the layout\'s **aside** column — but only on the Security tab. The layout already has `<RouterView name="aside" />`.',
        hint: 'On the security child, replace `component: SecuritySettings` with `components: { default: SecuritySettings, aside: SecurityTips }` (and import `SecurityTips`).',
        tests: [
          {
            name: 'tips appear on Security and disappear on Profile',
            code: `const router = requireModule('router.js').default
await router.push('/settings/security')
await flush()
expect(exists('.aside-view .security-tips')).toBe(true)
expect(exists('.panel .security-settings')).toBe(true)
await router.push('/settings')
await flush()
expect(exists('.security-tips')).toBe(false)`,
          },
        ],
        explain: 'With `components` (plural), one route fills several outlets at the same depth. Routes that don\'t provide an `aside` component leave that `<RouterView name="aside" />` empty. Named views shine for layouts where a side panel or toolbar depends on the page.',
      },
    ],
  },

  internals: {
    beginner: `
When a URL matches a nested route, the router doesn't find *one* record — it finds a chain: the parent and the child. It keeps that chain in \`route.matched\`. Each \`<RouterView />\` knows how deep it sits: the one in App.vue shows the first item of the chain, the one inside the layout shows the second. When you switch tabs, the first item stays the same, so Vue leaves the layout alone and only swaps the inner page.
`,
    technical: [
      `
**Depth.** Every \`<RouterView>\` injects a *depth* from its parent RouterView and provides depth + 1 to its children. It renders \`route.matched[depth].components[name ?? 'default']\`. Because the parent record (and so the layout component) is identical across sibling children, Vue's patching keeps the layout instance; only the inner view gets a new component.
`,
      {
        code: `// A simplified model of RouterView — not Vue Router's source
const RouterView = {
  props: { name: { default: 'default' } },
  setup(props) {
    const route = inject(routeKey)
    const depth = inject(depthKey, 0)
    provide(depthKey, depth + 1)
    return () => {
      const record = route.matched[depth]
      const Component = record?.components?.[props.name]
      return Component ? h(Component, propsFor(record, route, props.name)) : null
    }
  },
}`,
        lang: 'js',
        title: 'mental model of RouterView',
      },
      `
**Names.** \`createRouter()\` keeps a map of name → record. Resolving \`{ name, params }\` looks up the record, fills missing params from the current location when their names match, then **builds the path** from the record's pattern (\`/users/:id\` + \`{ id: 7 }\` → \`/users/7\`). That's why renaming a path doesn't break named links. Names must be unique; adding a route with an existing name replaces the old one.

**push vs replace.** Both run the same pipeline (resolve → guards → confirm). At the end, \`push\` calls \`history.pushState()\` (a new entry) and \`replace\` calls \`history.replaceState()\` (overwrite the current entry). The returned Promise resolves when the navigation is finished — with \`undefined\` on success, or a *navigation failure* object if it was prevented (for example by a guard). Real errors reject the Promise. See [router in practice](lesson:router-in-practice) for handling failures.

**Redirects** are applied while resolving the navigation, before the URL is written. Navigation guards don't run on the redirecting record itself — only on the final target.
`,
    ],
    production: `
- **Name every route that you navigate to**, with a consistent scheme (\`settings-security\`, \`course-lessons\`). Links, guards and tests then refer to names, and URL changes become a one-line edit plus a redirect for old links.
- **Layouts as parent routes.** A common structure: a public layout (marketing pages), an app layout (sidebar + header) and an auth layout (login, signup), each a parent record with children. Guards and \`meta\` on the parent apply to every child — see [navigation guards & route meta](lesson:navigation-guards).
- **Pick push vs replace deliberately.** \`replace\` after login, after creating a resource ("don't go back to the empty form"), when normalising URLs (adding default query values) and when syncing filters on every keystroke (otherwise each letter becomes a Back step). \`push\` for ordinary moves the user may want to undo.
- **Don't nest just because the URL nests.** Nest when the *UI* nests (a shared, persistent layout). \`/products/:id\` and \`/products/:id/reviews\` can be siblings if they share nothing on screen.
- **Lazy-load layouts' children** in large apps — each tab can be its own chunk (see [lazy-loaded routes](lesson:lazy-routes-scroll)).
`,
  },

  mistakes: [
    {
      title: 'Forgetting the `<RouterView />` in the parent component',
      wrong: { code: `<!-- SettingsLayout.vue -->\n<aside>…sidebar…</aside>\n<!-- children have nowhere to render -->`, lang: 'vue' },
      right: { code: `<!-- SettingsLayout.vue -->\n<aside>…sidebar…</aside>\n<RouterView />`, lang: 'vue' },
      explanation: 'Child routes render in their parent\'s `<RouterView />`. Without it the URL changes, `route.matched` is correct, and nothing appears.',
    },
    {
      title: 'A leading slash in a child path',
      wrong: { code: `children: [\n  { path: '/security', component: SecuritySettings }, // URL: /security\n]`, lang: 'js' },
      right: { code: `children: [\n  { path: 'security', component: SecuritySettings }, // URL: /settings/security\n]`, lang: 'js' },
      explanation: 'A leading slash makes the child path absolute. The page still renders inside the layout, but links to `/settings/security` don\'t match it.',
    },
    {
      title: 'Naming the parent instead of the empty-path child',
      wrong: { code: `{ path: '/settings', name: 'settings', component: SettingsLayout, children: [\n  { path: '', component: ProfileSettings },\n] }\n// push({ name: 'settings' }) → layout WITHOUT the profile tab`, lang: 'js' },
      right: { code: `{ path: '/settings', component: SettingsLayout, children: [\n  { path: '', name: 'settings', component: ProfileSettings },\n] }`, lang: 'js' },
      explanation: 'A name points at one record. Naming the parent targets the parent alone, so the empty-path child isn\'t rendered. Put the name on the default child (Vue Router warns about this in development).',
    },
    {
      title: 'Mixing `path` with `params`',
      wrong: { code: `router.push({ path: '/users', params: { id: 7 } }) // params ignored → /users`, lang: 'js' },
      right: { code: `router.push({ name: 'user', params: { id: 7 } })\n// or\nrouter.push(\`/users/\${id}\`)`, lang: 'js' },
      explanation: 'When `path` is given, Vue Router uses it as-is and ignores `params` (with a development warning). Params are only filled in for named routes.',
    },
    {
      title: 'Using `push` where Back should skip the step',
      wrong: { code: `await login(form)\nrouter.push({ name: 'dashboard' }) // Back → login form again`, lang: 'js' },
      right: { code: `await login(form)\nrouter.replace({ name: 'dashboard' })`, lang: 'js' },
      explanation: 'After login, a completed form, or an automatic redirect, users shouldn\'t be sent back to a step that no longer makes sense. `replace` overwrites the current history entry.',
    },
  ],

  debugging: [
    {
      symptom: 'The URL shows `/settings/security`, but only the layout renders — the inner area is empty.',
      cause: 'The layout component has no `<RouterView />`, or the child record is missing/misspelled.',
      fix: 'Add `<RouterView />` to the layout; check `route.matched` (or the Devtools Routes tab) for the child record.',
    },
    {
      symptom: 'Navigating to `{ name: \'settings\' }` shows the sidebar but no default tab, and a warning mentions an empty-path child.',
      cause: 'The name is on the parent record instead of the empty-path child.',
      fix: 'Move `name` onto the `path: \'\'` child.',
    },
    {
      symptom: '`Error: No match for {"name":"setings-profile"...}` when clicking a link.',
      cause: 'A typo in a route name — named navigation throws for unknown names.',
      fix: 'Fix the name. Keeping names in one module (or using typed routes in TypeScript) prevents this.',
    },
    {
      symptom: 'Warning: `Path "/users" was passed with params but they will be ignored`.',
      cause: '`path` and `params` used together.',
      fix: 'Use `{ name, params }`, or put the values into the path string.',
    },
    {
      symptom: 'After submitting a form, pressing Back shows the empty form again.',
      cause: 'The post-submit navigation used `push`.',
      fix: 'Use `router.replace()` for navigations that should not create a Back step.',
    },
  ],

  bestPractices: [
    'Nest routes when the UI nests: a parent record per persistent layout, children for what changes inside it.',
    'Name the routes you navigate to, and link with `{ name, params }` rather than hand-built paths.',
    'Put the name on the empty-path (default) child, not on its parent.',
    'Use `replace` for navigations that shouldn\'t create a Back step (after login, after create, URL normalisation, live filter syncing).',
    'Keep old URLs working with `redirect` when you rename paths.',
    'Pass route data to page components with the props modes instead of reading the router inside them.',
  ],

  useCases: [
    'Settings or account areas with a sidebar of sections.',
    'Detail pages with tabs: `/projects/:id` → overview, issues, members.',
    'App shells: an authenticated layout (header + sidebar) wrapping every app page.',
    'Post-action navigation: after saving, `router.replace({ name: \'note\', params: { id } })`.',
    'Dashboards where a side panel or toolbar depends on the page (named views).',
  ],

  whenToUse: {
    use: [
      'Several pages share a layout that should stay mounted while its content changes.',
      'Links or pushes appear in many places — use names so paths can change safely.',
      'Navigation must happen after an action (save, login, cancel) — use `push`/`replace`.',
    ],
    avoid: [
      'Nesting purely to mirror URL structure when nothing on screen is shared — sibling routes are simpler.',
      'Named views for something a slot or a regular child component would handle — they add routing complexity.',
      '`router.back()` as the only way out of a page users can deep-link to — there may be no previous entry in your app.',
    ],
  },

  comparison: {
    title: 'Ways to move the user',
    headers: ['', '`<RouterLink>`', '`router.push()`', '`router.replace()`', '`router.back()`'],
    rows: [
      ['Triggered by', 'a click on a link', 'your code', 'your code', 'your code'],
      ['New history entry?', 'yes (or not, with `replace` prop)', 'yes', 'no — overwrites current', 'no — moves within history'],
      ['Renders an `href`?', 'yes', 'no', 'no', 'no'],
      ['Typical use', 'menus, lists, tabs', 'after an action the user may undo', 'after login/create, URL normalisation', 'a "back" button inside a flow'],
    ],
    note: 'All four go through the same navigation pipeline, so guards apply to each. Guards are next: [navigation guards & route meta](lesson:navigation-guards).',
  },

  quiz: [
    {
      id: 'nested-named-routes-q1',
      type: 'mcq',
      prompt: 'A parent route has `path: \'/projects/:id\'` and a child with `path: \'issues\'`. What URL renders the child?',
      options: [
        { text: '`/projects/42/issues`' },
        { text: '`/issues`', why: 'That would be a child path with a leading slash (`\'/issues\'`).' },
        { text: '`/projects/issues`', why: 'The parent\'s `:id` segment is still part of the path.' },
        { text: '`/projects/42?issues`', why: 'Child paths are path segments, not query parameters.' },
      ],
      answer: 0,
      explanation: 'Relative child paths are appended to the parent\'s path, params included.',
    },
    {
      id: 'nested-named-routes-q2',
      type: 'output',
      prompt: 'The user visits `/settings`. What is rendered?',
      code: {
        lang: 'js',
        code: `{
  path: '/settings',
  component: SettingsLayout,     // renders "[Layout]" + <RouterView />
  children: [
    { path: '', component: ProfileTab },        // renders "Profile"
    { path: 'security', component: SecurityTab }, // renders "Security"
  ],
}`,
      },
      options: [
        { text: '[Layout] Profile' },
        { text: '[Layout] only', why: 'The empty-path child matches `/settings` itself, so it fills the inner RouterView.' },
        { text: 'Profile only', why: 'The parent\'s component (the layout) is always rendered for its children.' },
        { text: '[Layout] Profile Security', why: 'Only one child matches a given URL.' },
      ],
      answer: 0,
      explanation: 'The matched chain is `[settings, empty-path child]`: the layout renders at depth 0 and ProfileTab inside it at depth 1.',
    },
    {
      id: 'nested-named-routes-q3',
      type: 'bug',
      prompt: '`/settings/security` shows the sidebar, but never the security panel. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<!-- SettingsLayout.vue -->
<template>
  <section class="settings">
    <aside>
      <RouterLink :to="{ name: 'settings-profile' }">Profile</RouterLink>
      <RouterLink :to="{ name: 'settings-security' }">Security</RouterLink>
    </aside>
    <div class="panel"></div>
  </section>
</template>`,
      },
      answerLine: 8,
      explanation: 'The panel is empty: child routes need a `<RouterView />` inside the parent component. It should be `<div class="panel"><RouterView /></div>`.',
    },
    {
      id: 'nested-named-routes-q4',
      type: 'fill',
      prompt: 'After creating a note, open it **without** leaving the empty form in the history. Fill the blanks.',
      code: {
        lang: 'js',
        code: `const note = await createNote(title.value)
router.___({ ___: 'note', params: { id: note.id } })`,
      },
      answer: [['replace'], ['name']],
      explanation: '`replace` overwrites the current history entry; `name` + `params` builds the path from the named route.',
    },
    {
      id: 'nested-named-routes-q5',
      type: 'mcq',
      prompt: 'What is the main benefit of `<RouterLink :to="{ name: \'user\', params: { id } }">` over `` :to="`/users/${id}`" ``?',
      options: [
        { text: 'If the route\'s path changes, links by name keep working — only the route table changes.' },
        { text: 'Named links are faster to render.', why: 'There is no meaningful performance difference; the benefit is maintainability.' },
        { text: 'Named links skip navigation guards.', why: 'Every navigation runs the guards, however the location is written.' },
        { text: 'Only named links get an `href`.', why: 'RouterLink renders an `href` for both forms.' },
      ],
      answer: 0,
      explanation: 'The router builds the path from the record\'s pattern, so the path is defined in exactly one place.',
    },
    {
      id: 'nested-named-routes-q6',
      type: 'mcq',
      prompt: 'Which statement about `redirect` and `alias` is correct?',
      options: [
        { text: 'A redirect changes the URL to the target; an alias keeps its own URL while rendering the same route.' },
        { text: 'Both change the URL to the original path.', why: 'An alias deliberately keeps the alias URL in the address bar.' },
        { text: 'An alias runs a separate set of guards.', why: 'An alias is the same route record reached via another path; it uses the same guards.' },
        { text: 'A redirect renders both the old and the new component.', why: 'The redirecting record is never rendered.' },
      ],
      answer: 0,
      explanation: 'Redirect: "you asked for A, go to B" (URL becomes B). Alias: "B is another name for A" (URL stays B, content of A).',
    },
    {
      id: 'nested-named-routes-q7',
      type: 'short',
      prompt: 'Why does local state in a layout component (e.g. a search box in a sidebar) survive switching between its child routes?',
      answer: 'Both child URLs match the same parent record, so the outer RouterView keeps rendering the same layout component and Vue patches it instead of recreating it. Only the inner RouterView, at the next depth, swaps its component. The layout instance — and its refs — stay alive.',
    },
  ],

  exercises: [
    {
      id: 'course-tabs',
      title: 'Course pages with nested tabs',
      difficulty: 'intermediate',
      prompt: `
Turn the flat course route into a layout with tabs.

- \`/courses/:courseId\` renders \`CourseLayout\` with three **children**:
  - \`''\` → \`CourseOverview\`, named \`course-overview\`
  - \`'lessons'\` → \`CourseLessons\`, named \`course-lessons\`
  - \`'reviews'\` → \`CourseReviews\`, named \`course-reviews\`
- \`CourseLayout\` shows \`<h2 class="course-title">\` containing the \`courseId\`, three tab links and a \`<RouterView />\` for the tabs.
- The tabs are RouterLinks **by name** with classes \`tab-overview\`, \`tab-lessons\`, \`tab-reviews\`.
`,
      files: {
        'main.js': mainJs,
        'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from './HomePage.vue'
import CourseLayout from './CourseLayout.vue'
import CourseOverview from './CourseOverview.vue'
import CourseLessons from './CourseLessons.vue'
import CourseReviews from './CourseReviews.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomePage },
    // TODO: make the tabs children of this route
    { path: '/courses/:courseId', component: CourseLayout },
  ],
})`,
        'CourseLayout.vue': `<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <h2 class="course-title">Course: {{ route.params.courseId }}</h2>
  <nav>
    <span class="tab-overview">Overview</span>
    <span class="tab-lessons">Lessons</span>
    <span class="tab-reviews">Reviews</span>
  </nav>
  <!-- TODO: the current tab goes here -->
</template>`,
        ...coursePages,
      },
      hints: [
        'Move the three pages into a `children: [...]` array on the course route, each with a `path` (`\'\'`, `\'lessons\'`, `\'reviews\'`) and a `name`.',
        'Replace the spans with `<RouterLink class="tab-lessons" :to="{ name: \'course-lessons\' }">`. The current `courseId` param is reused automatically — or pass `params: { courseId: route.params.courseId }` explicitly.',
        'Add `<RouterView />` below the nav — children render in their parent\'s RouterView.',
      ],
      solution: {
        explanation: 'The course route is now a parent: its layout (title + tabs) stays mounted while the inner `<RouterView />` swaps tabs. The name lives on the empty-path child so `{ name: \'course-overview\' }` renders layout *and* overview. Tab links by name need no hand-built paths; the router fills `courseId` from the current location.',
        files: {
          'main.js': mainJs,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from './HomePage.vue'
import CourseLayout from './CourseLayout.vue'
import CourseOverview from './CourseOverview.vue'
import CourseLessons from './CourseLessons.vue'
import CourseReviews from './CourseReviews.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomePage },
    {
      path: '/courses/:courseId',
      component: CourseLayout,
      children: [
        { path: '', name: 'course-overview', component: CourseOverview },
        { path: 'lessons', name: 'course-lessons', component: CourseLessons },
        { path: 'reviews', name: 'course-reviews', component: CourseReviews },
      ],
    },
  ],
})`,
          'CourseLayout.vue': `<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <h2 class="course-title">Course: {{ route.params.courseId }}</h2>
  <nav>
    <RouterLink class="tab-overview" :to="{ name: 'course-overview' }">Overview</RouterLink>
    <RouterLink class="tab-lessons" :to="{ name: 'course-lessons' }">Lessons</RouterLink>
    <RouterLink class="tab-reviews" :to="{ name: 'course-reviews' }">Reviews</RouterLink>
  </nav>
  <RouterView />
</template>`,
          ...coursePages,
        },
      },
      tests: [
        { name: '/courses/vue-101 shows the title and the overview tab', code: `const router = requireModule('router.js').default; await router.push('/courses/vue-101'); await flush(); expect(text('.course-title')).toContain('vue-101'); expect(exists('.overview')).toBe(true)` },
        { name: 'tab links are real links built from names', code: `const router = requireModule('router.js').default; await router.push('/courses/vue-101'); await flush(); expect(find('.tab-reviews').tagName).toBe('A'); expect(attr('.tab-reviews', 'href')).toBe('/courses/vue-101/reviews')` },
        { name: 'clicking Lessons keeps the layout and shows the lessons', code: `const router = requireModule('router.js').default; await router.push('/courses/vue-101'); await flush(); const title = find('.course-title'); await click('.tab-lessons'); expect(router.currentRoute.value.fullPath).toBe('/courses/vue-101/lessons'); expect(exists('.lessons')).toBe(true); expect(find('.course-title')).toBe(title)` },
        { name: 'named navigation with params works', code: `const router = requireModule('router.js').default; await router.push({ name: 'course-reviews', params: { courseId: 'css-201' } }); await flush(); expect(router.currentRoute.value.fullPath).toBe('/courses/css-201/reviews'); expect(text('.course-title')).toContain('css-201'); expect(exists('.reviews')).toBe(true)` },
      ],
    },
    {
      id: 'notes-replace',
      title: 'Save, then replace',
      difficulty: 'intermediate',
      prompt: `
In this notes app, saving a new note currently uses \`router.push('/notes/' + id)\`. Pressing **Back** afterwards returns to the empty "new note" form — annoying. Fix \`NewNote.vue\`:

- After \`createNote()\` resolves, navigate with **\`router.replace\`** to the **named route** \`note\` (\`params: { id }\`), so Back goes to the list instead of the form.
- While saving, the \`<button class="save">\` must be **disabled**.
- Add a \`<button type="button" class="cancel">\` that navigates to the named route \`notes\` (the list).
`,
      files: {
        ...notesShared,
        'NewNote.vue': `<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createNote } from './api.js'

const router = useRouter()
const title = ref('')

async function save() {
  const note = await createNote(title.value)
  // TODO: Back should not return to this form after saving
  router.push('/notes/' + note.id)
}
</script>

<template>
  <form @submit.prevent="save">
    <input v-model="title" class="title-input" placeholder="Title" />
    <button class="save">Save</button>
  </form>
</template>`,
      },
      hints: [
        'Swap `router.push(\'/notes/\' + note.id)` for `router.replace({ name: \'note\', params: { id: note.id } })`.',
        'Add a `saving` ref: set it to `true` before `await createNote(...)` and bind `:disabled="saving"` on the save button. Reset it in a `finally` block.',
        'The cancel button: `<button type="button" class="cancel" @click="router.push({ name: \'notes\' })">Cancel</button>`. `type="button"` stops it from submitting the form.',
      ],
      solution: {
        explanation: '`replace` overwrites the `/notes/new` history entry with the new note, so the stack goes from `[list, form]` to `[list, note]` and Back lands on the list. Navigating by name means the form doesn\'t need to know the URL format of a note. The `saving` flag prevents double submits while the request is in flight; `finally` resets it even if saving fails.',
        files: {
          ...notesShared,
          'NewNote.vue': `<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createNote } from './api.js'

const router = useRouter()
const title = ref('')
const saving = ref(false)

async function save() {
  saving.value = true
  try {
    const note = await createNote(title.value)
    // replace: the empty form should not stay in the history
    await router.replace({ name: 'note', params: { id: note.id } })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form @submit.prevent="save">
    <input v-model="title" class="title-input" placeholder="Title" />
    <button class="save" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
    <button type="button" class="cancel" @click="router.push({ name: 'notes' })">Cancel</button>
  </form>
</template>`,
        },
      },
      tests: [
        { name: 'the New note link opens the form', code: `await click('.new-note'); const router = requireModule('router.js').default; expect(router.currentRoute.value.fullPath).toBe('/notes/new'); expect(exists('.title-input')).toBe(true)` },
        { name: 'saving opens the new note', code: `await click('.new-note'); await type('.title-input', 'Call mum'); await submit('form'); await wait(250); const router = requireModule('router.js').default; expect(router.currentRoute.value.fullPath).toBe('/notes/2'); expect(text('.note-title')).toBe('Call mum')` },
        { name: 'Back after saving returns to the list, not the form', code: `await click('.new-note'); await type('.title-input', 'Call mum'); await submit('form'); await wait(250); const router = requireModule('router.js').default; router.back(); await flush(); await flush(); expect(router.currentRoute.value.fullPath).toBe('/')` },
        { name: 'the save button is disabled while saving', code: `await click('.new-note'); await type('.title-input', 'Water plants'); await submit('form'); expect(find('.save').disabled).toBe(true); await wait(250)` },
        { name: 'Cancel goes back to the list', code: `await click('.new-note'); expect(exists('.cancel')).toBe(true); await click('.cancel'); await flush(); const router = requireModule('router.js').default; expect(router.currentRoute.value.name).toBe('notes')` },
      ],
    },
  ],

  interview: [
    {
      id: 'nested-named-routes-push-vs-replace',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between `router.push()` and `router.replace()`, and when do you use each?',
      answer: '`push` adds a new entry to the history stack, so Back returns to the previous page. `replace` overwrites the current entry, so the page you were on disappears from history. Use `push` for normal moves the user may want to undo; use `replace` after login, after creating a resource (so Back doesn\'t show an empty form), for redirects and URL normalisation, and when syncing fast-changing state like a search box into the query.',
      explanation: 'Same navigation pipeline; the only difference is `pushState` vs `replaceState` at the end — which changes what Back does.',
      code: {
        lang: 'js',
        code: `router.push({ name: 'cart' })        // history: [..., current, cart]
router.replace({ name: 'dashboard' }) // history: [..., dashboard]   (current is gone)
// <RouterLink :to="…" replace> is the link form`,
      },
      whyAsked: 'A practical classic: choosing wrongly produces annoying Back-button behaviour that users notice immediately.',
      mistakes: ['Saying `replace` doesn\'t run guards — it does.', 'Not giving a concrete use case for `replace`.', 'Confusing it with `router.go()`.'],
      followUps: ['What does `router.push()` return?', 'How would you sync a search input to the URL without flooding history?'],
      modelAnswer: 'Both navigate through the same pipeline with guards. push adds a history entry, so Back returns to where you were; replace overwrites the current entry, so it vanishes from history. I use push for ordinary navigation and replace when going back would make no sense: after logging in, after saving a new item, for redirects, or when I update the query on every keystroke of a search box. RouterLink has a replace prop for the link version.',
    },
    {
      id: 'nested-named-routes-nested-vs-conditional',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'A profile page has tabs (Posts, Followers, Settings). Would you implement them as nested routes or as a `v-if`/dynamic component inside the page? Explain the trade-offs.',
      answer: 'If users should be able to link to, bookmark, refresh or go Back to a tab, use nested routes: `/users/:id` with children `\'\'`, `followers`, `settings`, the page as layout and a `<RouterView />` for the tab. You get URLs, per-tab lazy loading and per-tab guards/meta. If the tabs are transient UI nobody links to (a small widget), local state with `v-if` or `<component :is>` is simpler and keeps the router table small. A middle ground is a query parameter (`?tab=followers`) when it is one component with a mode rather than separate pages.',
      explanation: 'Nested routes put the tab in the URL; local state keeps it in memory. Decide by whether the tab is "a place" or "a view mode".',
      whyAsked: 'Shows whether you can make design decisions rather than only reciting APIs.',
      mistakes: ['Always nesting (over-engineering) or never nesting (no shareable tabs).', 'Forgetting the query-string option.', 'Not mentioning that the layout stays mounted with nested routes.'],
      followUps: ['How would you keep the selected tab when the user refreshes, using each approach?', 'How would you lazy-load each tab?'],
      modelAnswer: 'My question is whether a tab is a place users can share or come back to. If yes, nested routes: the profile is the parent with a layout and RouterView, each tab is a child, so tabs get real URLs, Back works, each tab can be lazy-loaded and guarded, and the layout stays mounted while switching. If it\'s transient UI, a ref with v-if or a dynamic component is simpler. When it\'s really one component with a mode, a ?tab= query parameter is a nice middle ground.',
    },
    {
      id: 'nested-named-routes-leading-slash',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'The sidebar link to `/settings/security` shows only the layout, but typing `/security` shows the security panel inside the layout. What\'s wrong?',
      code: {
        lang: 'js',
        code: `{
  path: '/settings',
  component: SettingsLayout,
  children: [
    { path: '', name: 'settings-profile', component: ProfileSettings },
    { path: '/security', name: 'settings-security', component: SecuritySettings },
  ],
}`,
      },
      answer: 'The child path starts with a slash, which makes it absolute: it matches `/security`, not `/settings/security`. It still renders inside the layout because it\'s nested in the route table. Remove the slash: `path: \'security\'`. Linking by name (`{ name: \'settings-security\' }`) would have avoided the mismatch, because the href is generated from the record.',
      explanation: 'Leading slash = absolute path, even for children.',
      whyAsked: 'A subtle, common configuration bug; also a chance to argue for named routes.',
      mistakes: ['Blaming the layout\'s RouterView.', 'Not knowing that absolute child paths are allowed and still nest components.'],
      followUps: ['When would you deliberately use an absolute child path?', 'How do you inspect which records matched?'],
      modelAnswer: 'The child\'s path has a leading slash, so it\'s treated as absolute — it matches /security, while /settings/security matches only the parent. Nesting in the route table still decides component nesting, which is why /security renders inside the layout. Dropping the slash fixes it. I\'d also link by route name so hrefs always come from the actual record.',
    },
    {
      id: 'nested-named-routes-url-change',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Marketing wants `/user/:id` renamed to `/people/:id`. The old path appears in about 40 places in the code and in emails already sent. How do you make this change safely?',
      answer: 'Give the route a name (if it doesn\'t have one) and replace hard-coded paths with `{ name: \'person\', params: { id } }` — after that, the path lives in one place. Change the record\'s path to `/people/:id` and add `{ path: \'/user/:id\', redirect: (to) => ({ name: \'person\', params: { id: to.params.id } }) }` so old links and emails keep working. An `alias` would also work but leaves two canonical URLs, which is worse for analytics and SEO.',
      explanation: 'Names decouple code from URLs; redirects protect the outside world.',
      whyAsked: 'Evaluates maintainability thinking: refactor-safe navigation and backwards compatibility.',
      mistakes: ['Search-and-replace of strings only (misses dynamic paths, breaks external links).', 'Using alias without considering duplicate URLs.'],
      followUps: ['How could TypeScript help catch broken route names?', 'Would you redirect on the server as well?'],
      modelAnswer: 'First I make every link and push use a route name instead of a path, so the path is defined only in the route table. Then I change the record\'s path to /people/:id and add a redirect from /user/:id to the named route, passing the id through, so bookmarks and old emails still land on the right profile. I prefer a redirect over an alias so there\'s one canonical URL. With TypeScript, typed routes would flag broken names at build time.',
    },
    {
      id: 'nested-named-routes-named-views',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'In a dashboard, the right-hand panel shows different content depending on the page (filters on Reports, help on Settings, nothing on Home). Compare named views, nested routes and slots for this.',
      answer: 'Named views fit when the panel content is decided by the route: each route record lists `components: { default, panel }`, and the layout renders `<RouterView />` plus `<RouterView name="panel" />`; routes without a panel leave it empty. Nested routes are for content *inside* another page\'s area, not for parallel outlets. Slots (a layout component with a `#panel` slot used by each page) keep the decision in the page component and avoid router config, but every page must remember to use the layout. Choose named views when the panel is part of the page\'s identity and should be lazy-loaded/guarded with it; slots when it\'s presentational and owned by the page.',
      explanation: 'Named views = several components per route, side by side. Nested routes = components inside components. Slots = composition without the router.',
      code: {
        lang: 'js',
        code: `{
  path: '/reports',
  components: { default: ReportsPage, panel: ReportFilters },
  props: { default: true, panel: (route) => ({ range: route.query.range ?? '7d' }) },
}`,
      },
      whyAsked: 'Probes depth with the router and judgement about where layout decisions should live.',
      mistakes: ['Not knowing named views exist.', 'Using nested routes for parallel areas.', 'Ignoring the slot-based alternative.'],
      followUps: ['How do you pass props to a named view?', 'How do named views interact with nested children?'],
      modelAnswer: 'If the panel depends on the route, named views are the natural fit: the layout renders a default RouterView and a RouterView named panel, and each route record provides components with a default and a panel entry — routes without one just leave it empty, and props can be configured per view. Nested routes solve a different problem, content inside another component\'s outlet. The alternative is a layout component with a panel slot that each page fills; that keeps the router simple but relies on every page using the layout. I\'d pick named views when the panel belongs with the route — lazy-loaded and guarded together — and slots when it\'s presentational.',
    },
    {
      id: 'nested-named-routes-coding-admin',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Refactor the admin area. Today each admin page includes `<AdminSidebar />` itself, so the sidebar is destroyed and recreated on every navigation. Make `/admin` a parent route rendering `AdminLayout` (sidebar once + `<RouterView />`) with children `users` → `UsersPage` and `reports` → `ReportsPage`. Remove the sidebar from the pages. Visiting `/admin` must redirect to `/admin/users`.',
      starter: {
        files: {
          'main.js': mainJs,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import Home from './Home.vue'
import AdminLayout from './AdminLayout.vue'
import UsersPage from './UsersPage.vue'
import ReportsPage from './ReportsPage.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/admin/users', component: UsersPage },
    { path: '/admin/reports', component: ReportsPage },
  ],
})`,
          'App.vue': `<template>
  <RouterView />
</template>`,
          'Home.vue': adminHome,
          'AdminSidebar.vue': adminSidebar,
          'AdminLayout.vue': `<template>
  <div class="admin">
    <!-- TODO: the sidebar and the current admin page -->
  </div>
</template>`,
          'UsersPage.vue': `<script setup>
import AdminSidebar from './AdminSidebar.vue'
</script>

<template>
  <AdminSidebar />
  <h2 class="page">Users</h2>
</template>`,
          'ReportsPage.vue': `<script setup>
import AdminSidebar from './AdminSidebar.vue'
</script>

<template>
  <AdminSidebar />
  <h2 class="page">Reports</h2>
</template>`,
        },
      },
      tests: [
        { name: '/admin redirects to /admin/users', code: `const router = requireModule('router.js').default; await router.push('/admin'); await flush(); expect(router.currentRoute.value.fullPath).toBe('/admin/users'); expect(text('.page')).toBe('Users')` },
        { name: 'exactly one sidebar is rendered', code: `const router = requireModule('router.js').default; await router.push('/admin/reports'); await flush(); expect(findAll('.admin-sidebar')).toHaveLength(1); expect(text('.page')).toBe('Reports')` },
        { name: 'the sidebar is NOT recreated when switching pages', code: `const router = requireModule('router.js').default; await router.push('/admin/users'); await flush(); const sidebar = find('.admin-sidebar'); expect(sidebar).toBeTruthy(); await router.push('/admin/reports'); await flush(); expect(find('.admin-sidebar')).toBe(sidebar); expect(text('.page')).toBe('Reports')` },
      ],
      hints: ['AdminLayout renders `<AdminSidebar />` and `<RouterView />`.', 'The parent record: `{ path: \'/admin\', component: AdminLayout, redirect: \'/admin/users\', children: [...] }` with relative child paths `\'users\'` and `\'reports\'`.', 'Delete the `<AdminSidebar />` (and its import) from both pages.'],
      answer: 'Nest the pages under an `/admin` parent whose layout renders the sidebar and a `<RouterView />`, add `redirect: \'/admin/users\'` to the parent, and remove the sidebar from the pages.',
      solution: {
        files: {
          'main.js': mainJs,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import Home from './Home.vue'
import AdminLayout from './AdminLayout.vue'
import UsersPage from './UsersPage.vue'
import ReportsPage from './ReportsPage.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    {
      path: '/admin',
      component: AdminLayout,
      redirect: '/admin/users',
      children: [
        { path: 'users', component: UsersPage },
        { path: 'reports', component: ReportsPage },
      ],
    },
  ],
})`,
          'App.vue': `<template>
  <RouterView />
</template>`,
          'Home.vue': adminHome,
          'AdminSidebar.vue': adminSidebar,
          'AdminLayout.vue': `<script setup>
import AdminSidebar from './AdminSidebar.vue'
</script>

<template>
  <div class="admin">
    <AdminSidebar />
    <RouterView />
  </div>
</template>`,
          'UsersPage.vue': `<template>
  <h2 class="page">Users</h2>
</template>`,
          'ReportsPage.vue': `<template>
  <h2 class="page">Reports</h2>
</template>`,
        },
      },
      explanation: 'The layout is the component of the parent record, so it stays mounted while children swap in its `<RouterView />` — the test proves it by checking the sidebar is the very same DOM element. A redirect on a parent only applies when the parent itself is the final match (`/admin`), not for `/admin/users`.',
      whyAsked: 'Nested layouts are everywhere in real apps; this checks you can restructure a route table and understand why it matters.',
      mistakes: ['Keeping the sidebar in the pages as well (two sidebars).', 'Absolute child paths (`/users`).', 'Forgetting that a parent with a redirect and children still needs a component.'],
      followUps: ['How would you require admin rights for every child at once?', 'How would you lazy-load the admin area?'],
      modelAnswer: 'I make /admin a parent record whose component is AdminLayout — the sidebar plus a RouterView — and move users and reports into its children with relative paths. The pages lose their own sidebar. I add redirect: \'/admin/users\' on the parent, which only fires when /admin itself is the match. Now switching pages only swaps the inner view, so the sidebar keeps its state, and a meta flag or guard on the parent covers every admin page.',
    },
  ],

  takeaways: [
    'Nested routes = `children` in the route table + a `<RouterView />` in the parent\'s component; each RouterView renders one level of `route.matched`.',
    'Layouts in parent routes stay mounted while children change, so their state survives tab switches.',
    'Relative child paths join the parent\'s path; an empty path is the default child — name the child, not the parent.',
    'Named routes (`{ name, params }`) keep paths in one place; `path` + `params` don\'t mix.',
    '`push` adds a history entry, `replace` overwrites it; both return a Promise. Use `redirect` to keep old URLs alive and named views for parallel outlets.',
  ],
}
