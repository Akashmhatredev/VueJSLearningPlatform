// Lesson: Dynamic params, query strings & 404s.

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'

createApp(App).use(router).mount('#app')`

const apiJs = `// A fake API: it answers after a short delay, like a real server.
export const users = [
  { id: 1, name: 'Priya Shah', role: 'Engineer' },
  { id: 2, name: 'Leo Martins', role: 'Designer' },
  { id: 3, name: 'Mei Chen', role: 'Product manager' },
  { id: 4, name: 'Sam Okafor', role: 'Designer' },
]

export function fetchUser(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Route params are strings, so convert before comparing with numbers.
      resolve(users.find((u) => u.id === Number(id)) ?? null)
    }, 150)
  })
}`

const routerJs = `import { createRouter, createMemoryHistory } from 'vue-router'
import TeamList from './TeamList.vue'
import UserProfile from './UserProfile.vue'
import SearchPage from './SearchPage.vue'

const routes = [
  { path: '/', component: TeamList },
  // ":id" is a dynamic segment: /users/1, /users/2 … all match this one record.
  { path: '/users/:id', component: UserProfile },
  { path: '/search', component: SearchPage },
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
  <nav>
    <RouterLink to="/">Team</RouterLink>
    <RouterLink to="/search">Search</RouterLink>
    <RouterLink to="/search?role=Designer">Designers</RouterLink>
    <RouterLink to="/teams/42/oops">A broken link</RouterLink>
  </nav>
  <p class="url">
    URL: <code>{{ route.fullPath }}</code><br />
    params: <code>{{ route.params }}</code> · query: <code>{{ route.query }}</code>
  </p>
  <main>
    <RouterView />
  </main>
</template>

<style>
nav { display: flex; gap: 8px; flex-wrap: wrap; }
nav a { padding: 3px 8px; border: 1px solid #ddd; border-radius: 6px; text-decoration: none; color: #333; }
nav a.router-link-exact-active { background: #222; color: #fff; }
.url { font-size: 12px; color: #555; }
main { border-top: 1px dashed #ccc; padding-top: 8px; }
</style>`

const teamListVue = `<script setup>
import { users } from './api.js'
</script>

<template>
  <h2>Team</h2>
  <ul>
    <li v-for="u in users" :key="u.id">
      <RouterLink class="user-link" :to="'/users/' + u.id">{{ u.name }}</RouterLink>
    </li>
  </ul>
</template>`

const userProfileVue = `<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchUser } from './api.js'

const route = useRoute()
const user = ref(null)
const loading = ref(false)

async function load(id) {
  loading.value = true
  user.value = await fetchUser(id)
  loading.value = false
}

// Runs once, when this component is created.
// Going from /users/1 to /users/2 REUSES this component, so it never runs again!
onMounted(() => load(route.params.id))
</script>

<template>
  <section class="profile">
    <p v-if="loading" class="loading">Loading…</p>
    <template v-else-if="user">
      <h2 class="name">{{ user.name }}</h2>
      <p class="role">{{ user.role }}</p>
      <RouterLink class="next" :to="'/users/' + ((user.id % 4) + 1)">Next colleague →</RouterLink>
    </template>
    <p v-else class="missing">No user with id "{{ route.params.id }}".</p>
  </section>
</template>`

const searchPageVue = `<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { users } from './api.js'

const route = useRoute()
const router = useRouter()

// The URL is the source of truth. Query values may be a string, null or an
// array, so only accept a plain string.
const term = computed(() => (typeof route.query.q === 'string' ? route.query.q : '').toLowerCase())
const draft = ref(term.value)

const results = computed(() =>
  users.filter((u) => u.name.toLowerCase().includes(term.value))
)

function search() {
  // Write the term into the URL; the results recompute from route.query.
  router.push({ path: '/search', query: draft.value ? { q: draft.value } : {} })
}
</script>

<template>
  <form @submit.prevent="search">
    <input v-model="draft" class="search" placeholder="Search by name" />
    <button>Search</button>
  </form>
  <ul>
    <li v-for="u in results" :key="u.id" class="result">
      <RouterLink :to="'/users/' + u.id">{{ u.name }}</RouterLink> — {{ u.role }}
    </li>
  </ul>
</template>`

const notFoundVue = `<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <section class="not-found">
    <h2>404 — page not found</h2>
    <p>There's nothing at <code>{{ route.fullPath }}</code>.</p>
    <RouterLink to="/">Back to the team</RouterLink>
  </section>
</template>`

const fixedProfile = `<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchUser } from './api.js'

const route = useRoute()
const user = ref(null)
const loading = ref(false)

async function load(id) {
  loading.value = true
  user.value = await fetchUser(id)
  loading.value = false
}

// Re-run whenever the :id param changes — and once right away.
watch(() => route.params.id, load, { immediate: true })
</script>

<template>
  <section class="profile">
    <p v-if="loading">Loading…</p>
    <h2 v-else-if="user">{{ user.name }}</h2>
    <p v-else>No user with id "{{ route.params.id }}".</p>
  </section>
</template>`

// ---------- exercise 1: product pages
const productsJs = `export const products = [
  { slug: 'blue-mug', name: 'Blue mug', price: 12 },
  { slug: 'tea-towel', name: 'Tea towel', price: 8 },
  { slug: 'oak-tray', name: 'Oak tray', price: 30 },
]

export function findProduct(slug) {
  return products.find((p) => p.slug === slug) ?? null
}`
const shopHomeVue = `<script setup>
import { products } from './products.js'
</script>

<template>
  <h2>Shop</h2>
  <ul>
    <li v-for="p in products" :key="p.slug">
      <RouterLink class="product-link" :to="'/products/' + p.slug">{{ p.name }}</RouterLink>
    </li>
  </ul>
</template>`
const shopNotFound = `<template>
  <section class="not-found">
    <h2>404</h2>
    <p>That page doesn't exist. <RouterLink to="/">Back to the shop</RouterLink></p>
  </section>
</template>`
const shopApp = `<template>
  <RouterView />
</template>`

// ---------- exercise 2: recipe filters from the query string
const recipesJs = `export const recipes = [
  { id: 1, name: 'Chickpea curry', diet: 'vegan', minutes: 35 },
  { id: 2, name: 'Avocado toast', diet: 'vegan', minutes: 10 },
  { id: 3, name: 'Mushroom risotto', diet: 'vegetarian', minutes: 45 },
  { id: 4, name: 'Caprese salad', diet: 'vegetarian', minutes: 15 },
  { id: 5, name: 'Chicken tacos', diet: 'meat', minutes: 25 },
  { id: 6, name: 'Beef stew', diet: 'meat', minutes: 120 },
]`
const recipesRouter = `import { createRouter, createMemoryHistory } from 'vue-router'
import RecipeList from './RecipeList.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: RecipeList }],
})`

// ---------- interview coding: numeric article ids
const articleHome = `<template>
  <ul>
    <li><RouterLink to="/articles/1">Article 1</RouterLink></li>
    <li><RouterLink to="/articles/2">Article 2</RouterLink></li>
  </ul>
</template>`
const articleNotFound = `<template>
  <p class="not-found">404 — no such page.</p>
</template>`

export default {
  id: 'dynamic-routes',
  title: 'Dynamic params, query strings & 404s',
  summary: 'Match many URLs with one route using params, read optional state from the query string, and catch everything else with a 404 route.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['router-basics', 'watch'],
  related: ['nested-named-routes', 'navigation-guards', 'router-in-practice', 'props', 'search-pagination', 'cancellation-race-conditions'],
  tags: ['vue router', 'dynamic routes', 'params', 'route params', 'query', 'query string', '404', 'catch-all', 'pathMatch', 'props: true', 'component reuse'],
  apis: [
    { name: 'route.params', summary: 'Values of the dynamic segments (`:id`) in the current path. Always strings (arrays for repeatable params).' },
    { name: 'route.query', summary: 'The parsed query string (`?q=vue&page=2`). Values are strings, `null`, or arrays for repeated keys.' },
    { name: "'/:pathMatch(.*)*'", summary: 'A catch-all route path that matches anything; used for 404 pages.' },
    { name: 'props: true', summary: 'Passes `route.params` to the route component as props, decoupling it from the router.' },
    { name: 'onBeforeRouteUpdate()', summary: 'In-component hook that runs when the route changes but the same component is reused.' },
  ],
  docs: [
    { label: 'Vue Router — Dynamic Route Matching with Params', url: 'https://router.vuejs.org/guide/essentials/dynamic-matching.html' },
    { label: 'Vue Router — Routes\' Matching Syntax', url: 'https://router.vuejs.org/guide/essentials/route-matching-syntax.html' },
    { label: 'Vue Router — Passing Props to Route Components', url: 'https://router.vuejs.org/guide/essentials/passing-props.html' },
  ],

  intro: `
Real apps don't have one route per page — they have one route per *kind* of page. Every user profile looks the same; only the user changes. Writing \`/users/1\`, \`/users/2\`, \`/users/3\`… by hand would be absurd.

A **dynamic segment** — written with a colon, like \`/users/:id\` — matches a whole family of URLs. The part of the URL in that position is handed to your component as a **param** (\`route.params.id\`).

Alongside params there's the **query string** — the \`?q=vue&page=2\` part — for optional extras like search terms, filters and page numbers. And for every URL that matches nothing, a **catch-all route** shows a friendly 404 page.
`,

  why: `
Without dynamic segments, a route table could only describe fixed pages. You'd have no way to say "any product" or "any order".

Params and query strings also make the URL **carry real state**:

- \`/users/42\` — *which* user. Copy the link, send it, refresh: same profile.
- \`/search?q=mug&sort=price\` — *what* you searched and *how* it's sorted. The Back button returns to the previous search.

And because an SPA's server usually answers every path with \`index.html\` (see [router basics](lesson:router-basics)), the server can't tell users a page doesn't exist — **your app** must. The catch-all route is how.
`,

  eli15: `
Think of a hotel. The front desk doesn't have a separate instruction sheet for each room. It has one rule: "Room *number* → walk to that floor and door." The *number* changes; the rule stays the same.

\`/users/:id\` is that rule. \`:id\` is a blank that gets filled by whatever is in the URL. Visit \`/users/42\` and inside the component \`route.params.id\` is \`'42'\` (as text!).

The **query string** is like a note you hand the desk: "room 42, *and* extra towels, *and* late checkout". It's optional and goes after a \`?\`: \`/users/42?tab=posts\`. You read it from \`route.query.tab\`.

And if someone asks for a room that doesn't exist? The catch-all route is the polite receptionist who says "sorry, no such room — here's the lobby".
`,

  analogy: {
    title: 'Mail sorting',
    body: `
A post office doesn't have a rule for each house. It has patterns: "anything for *Baker Street, number N* goes in bag 3". The pattern is the route; the house number is the param.

Notes like "fragile" or "leave with neighbour" are extra instructions that don't change *where* the letter goes — that's the query string. And letters with an address that matches nothing go to the "return to sender" desk — the catch-all 404 route.
`,
    mapping: [
      ['"Baker Street, number N"', 'a dynamic route: `/users/:id`'],
      ['the house number on one letter', 'the param: `route.params.id`'],
      ['"fragile", "leave with neighbour"', 'the query: `?tab=posts` → `route.query.tab`'],
      ['the "return to sender" desk', 'the catch-all route `/:pathMatch(.*)*`'],
    ],
  },

  visual: {
    type: 'router',
    props: { preset: 'dynamic' },
    title: 'One route, many URLs',
    caption: 'Try different URLs against a real router: watch `/users/:id` match `/users/1` and `/users/42`, see the extracted `params` and `query`, and see unmatched paths fall through to the catch-all.',
    alt: 'An interactive router diagram. A URL like /users/42?tab=posts is matched against route patterns. The matching pattern /users/:id is highlighted, the extracted params object shows id: "42", the query object shows tab: "posts", and the UserProfile component renders.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Taking a URL apart',
    caption: 'How the router turns one URL into a matched route, params and query.',
    alt: 'A URL /users/42?tab=posts splits into a path and a query string. The path is compared with route patterns; /users/:id matches and produces params { id: "42" }. The query string is parsed into { tab: "posts" }. Both feed into the UserProfile component.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'url', label: '/users/42?tab=posts', note: 'the full URL', tone: 'ink', x: 110, y: 160 },
        { id: 'path', label: 'path: /users/42', x: 330, y: 80 },
        { id: 'qs', label: 'query string', note: '?tab=posts', x: 330, y: 240 },
        { id: 'match', label: 'matches /users/:id', note: 'route record', tone: 'acid', x: 520, y: 80 },
        { id: 'query', label: "query: { tab: 'posts' }", tone: 'cobalt', x: 520, y: 240 },
        { id: 'comp', label: 'UserProfile', note: "params: { id: '42' }", tone: 'acid', x: 680, y: 160 },
      ],
      edges: [
        { from: 'url', to: 'path' },
        { from: 'url', to: 'qs' },
        { from: 'path', to: 'match', label: 'compare patterns' },
        { from: 'qs', to: 'query', label: 'parse' },
        { from: 'match', to: 'comp' },
        { from: 'query', to: 'comp' },
      ],
      steps: [
        { focus: ['url'], text: 'The router receives a full URL — from a RouterLink, `router.push()`, a refresh or the Back button.' },
        { focus: ['path', 'qs'], edges: ['url->path', 'url->qs'], text: 'It splits the URL: the **path** decides *which route* matches; the **query string** after `?` is optional extra information.' },
        { focus: ['match'], edges: ['path->match'], text: 'The path is compared with every route pattern. `/users/:id` matches, and the text in the `:id` position becomes `params.id = \'42\'` — a **string**, not a number.' },
        { focus: ['query'], edges: ['qs->query'], text: 'The query string is parsed into an object. Values are strings — or `null` for a bare `?flag`, or an array when a key repeats (`?tag=a&tag=b`).' },
        { focus: ['comp'], edges: ['match->comp', 'query->comp'], text: 'The matched component renders and reads both from `useRoute()` — or receives them as props, which keeps it independent of the router.' },
      ],
    },
  },

  syntax: [
    `
**Dynamic segments** start with a colon. The matched text appears in \`route.params\`:
`,
    {
      code: `const routes = [
  { path: '/users/:id', component: UserProfile },                  // /users/42 → { id: '42' }
  { path: '/users/:userId/posts/:postId', component: PostPage },   // two params
]`,
      lang: 'js',
      title: 'params',
      static: true,
    },
    {
      code: `<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <h2>User {{ route.params.id }}</h2>   <!-- or $route.params.id -->
</template>`,
      lang: 'vue',
      title: 'reading a param',
    },
    `
#### Matching syntax

| path | matches | \`params\` |
|---|---|---|
| \`/users/:id\` | \`/users/42\` (not \`/users\`, not \`/users/42/x\`) | \`{ id: '42' }\` |
| \`/users/:id?\` | \`/users\` and \`/users/42\` | \`id\` is missing when absent |
| \`/docs/:chapters+\` | \`/docs/a\`, \`/docs/a/b\` (one or more) | \`{ chapters: ['a', 'b'] }\` |
| \`/files/:parts*\` | \`/files\`, \`/files/x/y\` (zero or more) | \`{ parts: ['x', 'y'] }\` |
| \`/orders/:id(\\d+)\` | \`/orders/7\` but **not** \`/orders/abc\` | \`{ id: '7' }\` |
| \`/:pathMatch(.*)*\` | anything — the catch-all | \`{ pathMatch: ['teams', '42'] }\` |

The custom regex goes in parentheses after the param name. In a JavaScript string the backslash must be escaped: \`'/orders/:id(\\\\d+)'\`.

**The query string** needs no route configuration — any route can have one:
`,
    {
      code: `// URL: /search?q=mug&tag=sale&tag=new&preview
route.query.q        // 'mug'
route.query.tag      // ['sale', 'new']  ← repeated key → array
route.query.preview  // null             ← key with no value
route.query.page     // undefined        ← not in the URL

// Navigate with a query: an object is safer than building strings by hand
router.push({ path: '/search', query: { q: 'blue mug', page: 2 } })
// → /search?q=blue+mug&page=2   (encoded for you)`,
      lang: 'js',
      title: 'query',
    },
    `
**The 404 route** uses a param with a "match anything" regex. Specific routes always win over it, wherever it sits in the array — Vue Router ranks routes by how specific their paths are — but by convention it goes last:
`,
    {
      code: `{ path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound }`,
      lang: 'js',
      title: 'catch-all',
    },
    `
**Params as props.** \`props: true\` hands \`route.params\` to the component as props, so the component no longer needs to know about the router at all:
`,
    {
      code: `{ path: '/users/:id', component: UserProfile, props: true }

// UserProfile.vue
const props = defineProps({ id: String })   // '42' — params are strings`,
      lang: 'js',
      title: 'props: true',
    },
    {
      callout: 'warn',
      title: 'Params and query values are strings',
      text: 'Even `router.push({ params: { id: 42 } })` gives `route.params.id === \'42\'`. Convert with `Number()` before arithmetic or `===` comparisons with numbers — and validate query values, because anyone can type anything into a URL.',
    },
  ],

  walkthrough: {
    title: 'UserProfile.vue (fixed)',
    lang: 'vue',
    code: fixedProfile,
    intro: 'The playground\'s profile has a classic bug. Here is the corrected version — step through it to see how a component reacts to param changes.',
    steps: [
      { lines: [6], text: '`useRoute()` returns the current route as a reactive object. We keep the whole object (no destructuring) so reads stay reactive.' },
      { lines: [7, 8], text: 'Local state for the loaded user and a loading flag. These belong to *this* component instance — which matters, because the instance is reused.' },
      { lines: [10, 14], text: '`load()` fetches by id. `fetchUser` converts the string param to a number internally — params are always strings.' },
      { lines: [16, 17], text: 'The key line. Going from `/users/1` to `/users/2` matches the same route, so Vue Router **reuses** this component instead of recreating it. `onMounted` would not run again — a watcher on `route.params.id` does. `immediate: true` also loads the first user.' },
      { lines: [22, 24], text: 'Three states: loading, found, not found. Showing `route.params.id` in the "not found" message helps users spot a typo in the URL.' },
    ],
  },

  playground: {
    title: 'Team directory',
    objective: 'Explore params and query strings, then fix the "profile doesn\'t update" bug, add a 404 page, validate the id and filter by role from the query.',
    files: {
      'main.js': mainJs,
      'router.js': routerJs,
      'api.js': apiJs,
      'App.vue': appVue,
      'TeamList.vue': teamListVue,
      'UserProfile.vue': userProfileVue,
      'SearchPage.vue': searchPageVue,
      'NotFound.vue': notFoundVue,
    },
    entry: 'main.js',
    expected: 'A team list. Click a name: the URL becomes `/users/1` and the **params** line shows `{ "id": "1" }` — a string. Now click **Next colleague →**: the URL changes but the profile **does not** (that\'s the bug). **Search** writes your term into `?q=`. **A broken link** shows an empty page, because there is no 404 route yet.',
    experiments: [
      {
        id: 'reuse-bug',
        task: 'Fix **UserProfile.vue** so that clicking **Next colleague →** loads the next person. The URL already changes — the profile must follow it.',
        hint: 'Replace `onMounted(() => load(route.params.id))` with `watch(() => route.params.id, load, { immediate: true })` (import `watch` from `vue`).',
        tests: [
          {
            name: 'the profile updates when only the param changes',
            code: `const router = requireModule('router.js').default
await router.push('/users/1')
await wait(250)
expect(text('.name')).toBe('Priya Shah')
await click('.next')
await wait(250)
expect(router.currentRoute.value.params.id).toBe('2')
expect(text('.name')).toBe('Leo Martins')`,
          },
        ],
        explain: 'Both URLs match the same route record, so Vue Router keeps the same component instance and just updates `route.params`. Code that runs once (setup, `onMounted`) never sees the new id. Watching the param — or using `onBeforeRouteUpdate` — reacts to it.',
      },
      {
        id: 'catch-all',
        task: '**A broken link** currently renders nothing. `NotFound.vue` is already written — add a catch-all route in `router.js` that shows it for any unknown path.',
        hint: 'Import `NotFound` and add `{ path: \'/:pathMatch(.*)*\', component: NotFound }` to the routes.',
        tests: [
          {
            name: 'unknown paths render the 404 page with the attempted URL',
            code: `const router = requireModule('router.js').default
await router.push('/teams/42/oops')
await flush()
expect(exists('.not-found')).toBe(true)
expect(text('.not-found')).toContain('/teams/42/oops')`,
          },
        ],
        explain: '`(.*)` lets the param match slashes too, and the trailing `*` makes it repeatable, so `params.pathMatch` becomes an array of segments (`[\'teams\', \'42\', \'oops\']`). Specific routes always outrank it, so it never hides real pages.',
      },
      {
        id: 'numeric-id',
        task: 'Visit `/users/abc` (type it into a link or use the console): it shows "No user…". Restrict `:id` to **digits only** so non-numeric ids fall through to the 404 page from the previous experiment.',
        hint: 'Change the path to `\'/users/:id(\\\\d+)\'` — a custom regex in parentheses. The backslash is doubled because it\'s inside a JavaScript string.',
        tests: [
          {
            name: '/users/abc shows the 404 page',
            code: `const router = requireModule('router.js').default
await router.push('/users/abc')
await flush()
expect(exists('.not-found')).toBe(true)
expect(exists('.profile')).toBe(false)`,
          },
          {
            name: '/users/2 still shows a profile',
            code: `const router = requireModule('router.js').default
await router.push('/users/2')
await wait(250)
expect(exists('.profile')).toBe(true)`,
          },
        ],
        explain: 'A custom regex moves validation into matching itself: `/users/abc` is not a user URL at all, so it gets the 404 page instead of a half-broken profile. You still need the "not found" state for numeric ids that don\'t exist (`/users/999`).',
      },
      {
        id: 'role-filter',
        task: 'The **Designers** link points to `/search?role=Designer`, but `SearchPage.vue` ignores `role`. Make the results also filter by `route.query.role` when it is present.',
        hint: 'Add `const role = computed(() => (typeof route.query.role === \'string\' ? route.query.role : \'\'))` and include `(!role.value || u.role === role.value)` in the filter.',
        tests: [
          {
            name: '?role=Designer shows only the two designers',
            code: `const router = requireModule('router.js').default
await router.push('/search?role=Designer')
await flush()
const rows = findAll('.result')
expect(rows).toHaveLength(2)
expect(rows.every((r) => r.textContent.includes('Designer'))).toBe(true)`,
          },
          {
            name: 'without a role, everyone is listed',
            code: `const router = requireModule('router.js').default
await router.push('/search')
await flush()
expect(findAll('.result')).toHaveLength(4)`,
          },
        ],
        explain: 'Filters in the query string are shareable, survive refresh and work with Back. Reading them through a `computed` means the list updates on *any* navigation that changes the query — links, `router.push()`, or the Back button. More on this in [router in practice](lesson:router-in-practice).',
      },
    ],
  },

  internals: {
    beginner: `
When the router is created, it turns every route path into a pattern it can test URLs against. On each navigation it tests the new path against all patterns, picks the best match, and pulls out the text in each \`:param\` position. The query string is split on \`&\` and \`=\`. Both end up on the reactive current route, which your components read.

If the new URL matches the **same route** as before, the router doesn't throw the page away and build a new one — it reuses the component and only updates \`route.params\`/\`route.query\`. That's efficient, and it's why "run once" code misses param changes.
`,
    technical: [
      `
**Path parsing and ranking.** Each path is tokenised into static parts and params, then compiled to a regular expression. Every route gets a **score** based on its segments — static segments score higher than params, params with custom regexes higher than plain ones, and repeatable/optional params lower. The matcher keeps routes sorted by score, so \`/users/new\` beats \`/users/:id\`, and \`/:pathMatch(.*)*\` loses to everything. That's why route order in the array doesn't decide the match (unlike Vue Router 3, which matched in declaration order).

**Encoding.** When you push \`{ params: { id: 42 } }\` or \`{ query: { q: 'blue mug' } }\`, the router stringifies and URL-encodes values (\`q=blue+mug\`). When it reads a URL, it decodes them back. Params come out as strings (arrays of strings for \`+\`/\`*\`).
`,
      {
        code: `// A simplified model of one route record — not Vue Router's source
const record = { path: '/users/:id(\\\\d+)' }
const re = /^\\/users\\/(\\d+)\\/?$/i          // compiled once
const keys = ['id']

function match(path) {
  const m = re.exec(path)
  if (!m) return null
  return { id: m[1] }                        // always a string
}`,
        lang: 'js',
        title: 'mental model of a dynamic route',
      },
      `
**Component reuse.** \`<RouterView>\` renders \`matched[depth].components.default\`. If the next location matches the same record, the component *type* is unchanged, so Vue's patching keeps the instance — just like re-rendering \`<UserProfile>\` with new data. Your options:

- \`watch(() => route.params.id, …)\` — the most common; works with \`props: true\` too (\`watch(() => props.id, …)\`).
- \`onBeforeRouteUpdate((to) => …)\` — a navigation guard that runs *before* the navigation is confirmed, so you can load data first or cancel. See [navigation guards](lesson:navigation-guards).
- \`<RouterView :key="$route.fullPath" />\` — forces a fresh instance on every change. Simple, but it destroys and recreates the whole page (losing local state and transitions), so use it deliberately.
`,
    ],
    production: [
      `
- **Validate everything that comes from the URL.** Users can edit it. Parse numbers with \`Number()\`, check ranges, whitelist enum values (\`sort\` ∈ \`['price', 'name']\`), and handle arrays (\`?tag=a&tag=b\`). Treat invalid values as "use the default", not as a crash.
- **Avoid stale responses.** When the param changes quickly (\`/users/1\` → \`/users/2\`), an old request may finish after a new one and overwrite it. Compare ids before assigning, or cancel the old request — Vue 3.5+ offers \`onWatcherCleanup()\` for this. See [cancellation & race conditions](lesson:cancellation-race-conditions).
- **A 404 route doesn't produce a real 404 status.** With an SPA fallback the server returns \`200 OK\` + \`index.html\` for every path, so search engines may index your "not found" page (a *soft 404*). If SEO matters, server rendering lets the server answer with a real 404 — see [rendering strategies](lesson:rendering-strategies).
- **Prefer \`props\` for page components.** A component that takes \`id\` as a prop can be reused outside routing (a modal, a preview) and tested without a router.
- **Keep params for identity, query for options.** \`/products/:slug\` identifies the thing; \`?color=blue&page=2\` refines how you view it.
`,
    ],
  },

  mistakes: [
    {
      title: 'Loading data only once and missing param changes',
      wrong: { code: `onMounted(() => load(route.params.id))\n// /users/1 → /users/2: same component, onMounted doesn't run again`, lang: 'js' },
      right: { code: `watch(() => route.params.id, load, { immediate: true })`, lang: 'js' },
      explanation: 'Navigating between URLs of the same route reuses the component. Anything that should follow the URL must *react* to it: a watcher, a `computed`, or `onBeforeRouteUpdate`.',
    },
    {
      title: 'Treating params as numbers',
      wrong: { code: `const nextId = route.params.id + 1   // '7' + 1 → '71'\nusers.find((u) => u.id === route.params.id)  // 7 === '7' → false`, lang: 'js' },
      right: { code: `const id = Number(route.params.id)\nconst nextId = id + 1                 // 8\nusers.find((u) => u.id === id)`, lang: 'js' },
      explanation: 'Params and query values are strings. Convert them once, close to where you read them — or use a `props` function on the route to pass a ready-made number.',
    },
    {
      title: 'Destructuring params at setup time',
      wrong: { code: `const { id } = useRoute().params   // frozen at the first value`, lang: 'js' },
      right: { code: `const route = useRoute()\nconst id = computed(() => route.params.id)`, lang: 'js' },
      explanation: 'Destructuring copies the current value into a plain variable, which never changes when the route does. Keep reading through `route` (or use props).',
    },
    {
      title: 'Building query strings by hand',
      wrong: { code: `router.push('/search?q=' + term)   // breaks on "&", "#", spaces…`, lang: 'js' },
      right: { code: `router.push({ path: '/search', query: { q: term } })`, lang: 'js' },
      explanation: 'A search for `salt & pepper` would split into two keys. The object form encodes values correctly for you.',
    },
  ],

  debugging: [
    {
      symptom: 'The URL changes from `/items/1` to `/items/2`, but the page still shows item 1.',
      cause: 'Same route → the component is reused, and the data was loaded once in `setup`/`onMounted`.',
      fix: 'Watch `route.params.id` (or the prop) with `{ immediate: true }`, or load in `onBeforeRouteUpdate`.',
    },
    {
      symptom: 'An item lookup by id always returns "not found", although the id exists.',
      cause: 'Comparing a number with the string param (`7 === \'7\'` is false).',
      fix: 'Convert with `Number(route.params.id)` or pass a converted prop via `props: (route) => ({ id: Number(route.params.id) })`.',
    },
    {
      symptom: 'Console warning: `No match found for location with path "/something"` and a blank page.',
      cause: 'No route matches and there is no catch-all route.',
      fix: 'Add `{ path: \'/:pathMatch(.*)*\', component: NotFound }`.',
    },
    {
      symptom: 'A filter breaks when the URL is `?tag=a&tag=b` (e.g. `tag.toLowerCase is not a function`).',
      cause: 'Repeated query keys are parsed as arrays.',
      fix: 'Normalise query values: `Array.isArray(v) ? v[0] : v`, or support arrays deliberately.',
    },
    {
      symptom: '`router.push({ name: \'user\' })` throws `Missing required param "id"`.',
      cause: 'A named route with a required param was pushed without that param.',
      fix: 'Pass it: `router.push({ name: \'user\', params: { id } })`, or make the param optional (`:id?`).',
    },
  ],

  bestPractices: [
    'Use params for the identity of a resource (`/orders/:id`) and the query string for optional view settings (filters, sort, page, tabs).',
    'Convert and validate URL values in one place — a `computed`, or a `props` function on the route.',
    'Let page components receive params as props (`props: true` or a function) so they work without the router and are easy to test.',
    'React to param changes with `watch` or `onBeforeRouteUpdate`; reach for `:key="$route.fullPath"` only when a full remount is truly what you want.',
    'Always add a catch-all 404 route that shows the attempted path and a way back.',
    'Push locations as objects (`{ path, query }`) so values are encoded correctly.',
  ],

  useCases: [
    'Detail pages: `/products/:slug`, `/orders/:id`, `/users/:userId/posts/:postId`.',
    'Search and listing pages with shareable state: `/search?q=mug&sort=price&page=2`.',
    'Docs or file browsers with variable depth: `/docs/:chapters+`.',
    'A friendly 404 page for mistyped and outdated links.',
    'Tabs inside a page that should survive refresh: `/settings?tab=billing`.',
  ],

  whenToUse: {
    use: [
      'Many pages share one layout and differ only by an identifier — use a param.',
      'Users should be able to share or bookmark a filtered/sorted view — use the query string.',
      'Any app with a router — add a catch-all route.',
    ],
    avoid: [
      'Secrets or personal data in params/query — URLs end up in history, logs and analytics.',
      'Huge or deeply nested state in the query string — keep it to a few simple values; put the rest in a store.',
      'Purely temporary UI state nobody would link to (an open dropdown) — keep it in component state.',
    ],
  },

  comparison: {
    title: 'Params vs query vs component state',
    headers: ['', 'Route param `/users/:id`', 'Query `?sort=price`', 'Component state (`ref`)'],
    rows: [
      ['Part of the route pattern?', 'yes — required unless `?`', 'no — any route accepts any query', 'no'],
      ['Typical meaning', 'which resource', 'how to view it (filters, sort, page)', 'temporary UI state'],
      ['Shareable / survives refresh?', 'yes', 'yes', 'no'],
      ['Read with', '`route.params.id` or a prop', '`route.query.sort`', 'the ref itself'],
      ['Value type', 'string (array if repeatable)', 'string, `null` or array', 'anything'],
    ],
    note: 'Next: group pages under shared layouts with [nested & named routes](lesson:nested-named-routes).',
  },

  quiz: [
    {
      id: 'dynamic-routes-q1',
      type: 'mcq',
      prompt: 'The route is `/users/:id`. The URL is `/users/42?tab=posts`. What are `route.params` and `route.query`?',
      options: [
        { text: "`params: { id: '42' }`, `query: { tab: 'posts' }`" },
        { text: '`params: { id: 42 }`, `query: { tab: \'posts\' }`', why: 'Params are strings — `\'42\'`, not the number 42.' },
        { text: "`params: { id: '42', tab: 'posts' }`, `query: {}`", why: 'The query string is never merged into params.' },
        { text: "`params: {}`, `query: { id: '42', tab: 'posts' }`", why: 'The `:id` segment comes from the path, so it is a param.' },
      ],
      answer: 0,
      explanation: 'The path fills the params; everything after `?` fills the query. All values are strings.',
    },
    {
      id: 'dynamic-routes-q2',
      type: 'output',
      prompt: 'Route: `/items/:id`. URL: `/items/5`. What does the template render?',
      code: { lang: 'vue', code: `<p>Next item: {{ $route.params.id + 1 }}</p>` },
      options: [
        { text: 'Next item: 51' },
        { text: 'Next item: 6', why: 'That would need `Number($route.params.id) + 1`. The param is the string `\'5\'`.' },
        { text: 'Next item: NaN', why: 'String + number concatenates; it doesn\'t produce NaN.' },
        { text: 'Next item: 5', why: 'The `+ 1` is applied — as string concatenation.' },
      ],
      answer: 0,
      explanation: '`\'5\' + 1` is `\'51\'` in JavaScript. Convert params before doing maths.',
    },
    {
      id: 'dynamic-routes-q3',
      type: 'bug',
      prompt: 'Navigating from `/orders/1` to `/orders/2` updates the URL but the page keeps showing order 1. Click the line responsible.',
      code: {
        lang: 'js',
        code: `const route = useRoute()
const order = ref(null)

async function load(id) {
  order.value = await fetchOrder(id)
}

onMounted(() => load(route.params.id))`,
      },
      answerLine: 8,
      explanation: 'The component is reused between the two URLs, so `onMounted` runs only once. Use `watch(() => route.params.id, load, { immediate: true })`.',
    },
    {
      id: 'dynamic-routes-q4',
      type: 'fill',
      prompt: 'Fill the blanks: reload when the `:id` segment changes, and read the `?q=` search term.',
      code: {
        lang: 'js',
        code: `const route = useRoute()

watch(() => route.___.id, load, { immediate: true })

const term = computed(() => route.___.q ?? '')`,
      },
      answer: [['params'], ['query']],
      explanation: 'Path segments live in `route.params`; the query string lives in `route.query`.',
    },
    {
      id: 'dynamic-routes-q5',
      type: 'mcq',
      prompt: 'A product list can be sorted by price and filtered by colour. Where should `sort` and `color` live?',
      options: [
        { text: 'In the query string: `/products?sort=price&color=blue`' },
        { text: 'As params: `/products/:sort/:color`', why: 'That makes them required and order-dependent; they\'re optional view settings, which is what the query is for.' },
        { text: 'Only in component refs', why: 'Then the view can\'t be shared, bookmarked or restored with Back/refresh.' },
        { text: 'In localStorage', why: 'Not shareable via a link, and every tab would fight over the same value.' },
      ],
      answer: 0,
      explanation: 'Params identify *what*; the query describes *how* to view it. Optional filters belong in the query.',
    },
    {
      id: 'dynamic-routes-q6',
      type: 'mcq',
      prompt: 'The routes array lists `{ path: \'/:pathMatch(.*)*\' }` **first** and `{ path: \'/about\' }` after it. What does `/about` render?',
      options: [
        { text: 'The About page — routes are ranked by specificity, not by order.' },
        { text: 'The 404 page — the first matching route wins.', why: 'That was Vue Router 3\'s behaviour. Since Vue Router 4, routes are ranked, so the static `/about` path wins.' },
        { text: 'Both pages, one after the other.', why: 'A navigation matches one route record (plus its parents for nested routes).' },
        { text: 'An error about conflicting routes.', why: 'Overlapping routes are normal; the ranking resolves them.' },
      ],
      answer: 0,
      explanation: 'The matcher scores every path; static segments beat params, and the catch-all scores lowest.',
    },
    {
      id: 'dynamic-routes-q7',
      type: 'short',
      prompt: 'Why would you set `props: true` on a route instead of calling `useRoute()` inside the page component?',
      answer: 'With `props: true` the router passes the params as props, so the component just declares `defineProps({ id: String })` and has no dependency on the router. It can be reused elsewhere (a modal, a preview) and tested by mounting it with a prop, and the data flow is explicit. `useRoute()` ties the component to being rendered by a route.',
    },
  ],

  exercises: [
    {
      id: 'product-pages',
      title: 'Product pages with params as props',
      difficulty: 'intermediate',
      prompt: `
Turn the shop into a real multi-product site.

- In \`router.js\`, add a route \`/products/:slug\` that renders \`ProductPage\` and passes params as props (\`props: true\`).
- Add a catch-all route that renders \`NotFound\` (it has \`class="not-found"\`).
- In \`ProductPage.vue\`, declare a \`slug\` prop (a String) and look the product up with \`findProduct(slug)\` from \`products.js\`:
  - found → \`<h2 class="product-name">\` with the name and \`<p class="price">\` with the price;
  - not found → \`<p class="missing">\` containing the slug.
- \`ProductPage\` must **not** use \`useRoute()\` — a test mounts it on its own with just a \`slug\` prop.
`,
      files: {
        'main.js': mainJs,
        'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import ShopHome from './ShopHome.vue'
import ProductPage from './ProductPage.vue'
import NotFound from './NotFound.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: ShopHome },
    // TODO: product route (params as props) and a catch-all route
  ],
})`,
        'products.js': productsJs,
        'App.vue': shopApp,
        'ShopHome.vue': shopHomeVue,
        'ProductPage.vue': `<script setup>
import { findProduct } from './products.js'
// TODO: receive the slug as a prop and look up the product
</script>

<template>
  <section>
    <p>Product page — coming soon</p>
  </section>
</template>`,
        'NotFound.vue': shopNotFound,
      },
      hints: [
        'The route is `{ path: \'/products/:slug\', component: ProductPage, props: true }`; the catch-all is `{ path: \'/:pathMatch(.*)*\', component: NotFound }`.',
        'In ProductPage: `const props = defineProps({ slug: { type: String, required: true } })`.',
        'Derive the product with `computed(() => findProduct(props.slug))` so it updates when you navigate between products, then use `v-if` / `v-else` for the found / missing states.',
      ],
      solution: {
        explanation: '`props: true` turns `route.params.slug` into a `slug` prop. Because the product is a `computed` of that prop, it updates automatically when the same component is reused for another slug — no watcher needed. And because the component only knows about its prop, it works anywhere, including in a test without a router.',
        files: {
          'main.js': mainJs,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import ShopHome from './ShopHome.vue'
import ProductPage from './ProductPage.vue'
import NotFound from './NotFound.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: ShopHome },
    { path: '/products/:slug', component: ProductPage, props: true },
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
})`,
          'products.js': productsJs,
          'App.vue': shopApp,
          'ShopHome.vue': shopHomeVue,
          'ProductPage.vue': `<script setup>
import { computed } from 'vue'
import { findProduct } from './products.js'

const props = defineProps({
  slug: { type: String, required: true },
})

const product = computed(() => findProduct(props.slug))
</script>

<template>
  <section>
    <template v-if="product">
      <h2 class="product-name">{{ product.name }}</h2>
      <p class="price">\${{ product.price }}</p>
    </template>
    <p v-else class="missing">No product called "{{ slug }}".</p>
  </section>
</template>`,
          'NotFound.vue': shopNotFound,
        },
      },
      tests: [
        { name: 'clicking a product opens its page', code: `await click('.product-link'); expect(text('.product-name')).toBe('Blue mug'); expect(text('.price')).toContain('12')` },
        { name: 'a deep link works: /products/tea-towel', code: `const router = requireModule('router.js').default; await router.push('/products/tea-towel'); await flush(); expect(text('.product-name')).toBe('Tea towel')` },
        { name: 'switching products updates the reused page', code: `const router = requireModule('router.js').default; await router.push('/products/blue-mug'); await flush(); await router.push('/products/oak-tray'); await flush(); expect(text('.product-name')).toBe('Oak tray')` },
        { name: 'an unknown slug shows the missing message', code: `const router = requireModule('router.js').default; await router.push('/products/spaceship'); await flush(); expect(text('.missing')).toContain('spaceship')` },
        { name: 'unknown URLs show the 404 page', code: `const router = requireModule('router.js').default; await router.push('/checkout/now'); await flush(); expect(exists('.not-found')).toBe(true)` },
        { name: 'ProductPage works with just a prop (no router)', code: `const w = mountFile('ProductPage.vue', { slug: 'oak-tray' }); expect(w.text()).toContain('Oak tray')` },
      ],
    },
    {
      id: 'recipe-query-filters',
      title: 'Recipe filters in the query string',
      difficulty: 'intermediate',
      prompt: `
Make the recipe list filterable **from the URL**, so filtered views can be shared.

In \`RecipeList.vue\`, using \`useRoute()\`:

- \`?diet=vegan\` or \`?diet=vegetarian\` → show only recipes with that \`diet\`. Any other value is ignored.
- \`?max=20\` → show only recipes with \`minutes <= max\`. Only positive whole numbers count; anything else (\`abc\`, \`-5\`, missing) is ignored.
- If a key is repeated (\`?diet=vegan&diet=meat\`), use the **first** value.
- Each visible recipe is an \`<li class="recipe">\`.
- Replace the placeholder spans with RouterLinks: \`.filter-all\` goes to \`/\` (no query); \`.filter-vegan\` sets \`diet=vegan\` while **keeping the other query values** (e.g. \`max\`).
`,
      files: {
        'main.js': mainJs,
        'router.js': recipesRouter,
        'recipes.js': recipesJs,
        'App.vue': `<template>
  <RouterView />
</template>`,
        'RecipeList.vue': `<script setup>
import { recipes } from './recipes.js'
// TODO: read the filters from the URL and filter the list
</script>

<template>
  <nav>
    <span class="filter-all">All</span>
    <span class="filter-vegan">Vegan</span>
  </nav>
  <p class="count">{{ recipes.length }} recipes</p>
  <ul>
    <li v-for="r in recipes" :key="r.id" class="recipe">{{ r.name }} · {{ r.minutes }} min</li>
  </ul>
</template>`,
      },
      hints: [
        'Write a tiny helper: `const first = (v) => (Array.isArray(v) ? v[0] : v)`.',
        'Build two computeds: `diet` (only `\'vegan\'`/`\'vegetarian\'`, else `null`) and `max` (`Number(first(route.query.max))`, kept only if `Number.isInteger(n) && n > 0`). Then a `visible` computed filters `recipes` with both.',
        'For the vegan link: `<RouterLink class="filter-vegan" :to="{ query: { ...route.query, diet: \'vegan\' } }">` — a location with only `query` keeps the current path.',
      ],
      solution: {
        explanation: 'All filter state lives in the URL; the component only *derives* the list from `route.query` with computeds. Validating each value (whitelist for `diet`, positive integer for `max`, first item of arrays) means a hand-edited or malicious URL can never break the page — it just falls back to "no filter".',
        files: {
          'main.js': mainJs,
          'router.js': recipesRouter,
          'recipes.js': recipesJs,
          'App.vue': `<template>
  <RouterView />
</template>`,
          'RecipeList.vue': `<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { recipes } from './recipes.js'

const route = useRoute()

// Query values can be a string, null (?flag) or an array (?a=1&a=2).
const first = (value) => (Array.isArray(value) ? value[0] : value)

const diet = computed(() => {
  const d = first(route.query.diet)
  return d === 'vegan' || d === 'vegetarian' ? d : null
})

const max = computed(() => {
  const n = Number(first(route.query.max))
  return Number.isInteger(n) && n > 0 ? n : null
})

const visible = computed(() =>
  recipes.filter(
    (r) => (!diet.value || r.diet === diet.value) && (!max.value || r.minutes <= max.value),
  ),
)
</script>

<template>
  <nav>
    <RouterLink class="filter-all" to="/">All</RouterLink>
    <RouterLink class="filter-vegan" :to="{ query: { ...route.query, diet: 'vegan' } }">Vegan</RouterLink>
  </nav>
  <p class="count">{{ visible.length }} recipes</p>
  <ul>
    <li v-for="r in visible" :key="r.id" class="recipe">{{ r.name }} · {{ r.minutes }} min</li>
  </ul>
</template>`,
        },
      },
      tests: [
        { name: 'no query shows all 6 recipes', code: `expect(findAll('.recipe')).toHaveLength(6)` },
        { name: '?diet=vegan shows 2', code: `const router = requireModule('router.js').default; await router.push('/?diet=vegan'); await flush(); expect(findAll('.recipe')).toHaveLength(2)` },
        { name: '?max=20 shows the 2 quick recipes', code: `const router = requireModule('router.js').default; await router.push('/?max=20'); await flush(); expect(findAll('.recipe')).toHaveLength(2)` },
        { name: 'invalid values are ignored', code: `const router = requireModule('router.js').default; await router.push('/?max=abc&diet=pizza'); await flush(); expect(findAll('.recipe')).toHaveLength(6); await router.push('/?max=-5'); await flush(); expect(findAll('.recipe')).toHaveLength(6)` },
        { name: 'repeated keys use the first value', code: `const router = requireModule('router.js').default; await router.push('/?diet=vegan&diet=meat'); await flush(); expect(findAll('.recipe')).toHaveLength(2)` },
        { name: 'the Vegan link keeps max', code: `const router = requireModule('router.js').default; await router.push('/?max=30'); await flush(); await click('.filter-vegan'); await flush(); const q = router.currentRoute.value.query; expect(q.diet).toBe('vegan'); expect(q.max).toBe('30'); expect(findAll('.recipe')).toHaveLength(1)` },
      ],
    },
  ],

  interview: [
    {
      id: 'dynamic-routes-params-vs-query',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between route params and query parameters in Vue Router? When do you use each?',
      answer: 'Params are dynamic segments declared in the route path (`/users/:id`) and are part of what makes the route match — a required param must be present. Query parameters are the optional `?key=value` pairs after the path; any route accepts them and they don\'t affect matching. Use params for the identity of a resource (which user, which order) and the query for optional view state like filters, sorting, pagination or search terms.',
      explanation: 'Params answer "which thing?"; the query answers "how do you want to see it?". Both are strings in the route object and both are shareable.',
      code: {
        lang: 'js',
        code: `// route: /users/:id     URL: /users/42?tab=posts&page=2
route.params  // { id: '42' }
route.query   // { tab: 'posts', page: '2' }`,
      },
      whyAsked: 'A classic first routing question — it shows whether you design URLs deliberately.',
      mistakes: ['Saying query values are typed (numbers/booleans) — they are strings, `null` or arrays.', 'Putting optional filters into path params, which makes them required and order-dependent.', 'Forgetting that both end up in browser history and logs, so no secrets.'],
      followUps: ['What happens when a query key appears twice?', 'How would you keep existing query values while changing one?', 'How do you make a param optional?'],
      modelAnswer: 'Params are part of the path pattern, like :id in /users/:id, so they decide whether the route matches and usually identify a resource. Query parameters come after the question mark, don\'t affect matching, and suit optional state — search terms, filters, sort, page. Both come back as strings, so I convert and validate them. A good rule: if removing it would point at a different thing, it\'s a param; if it only changes how you view the same thing, it\'s query.',
    },
    {
      id: 'dynamic-routes-param-reuse',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A profile page loads the user in `onMounted`. Navigating from `/users/1` to `/users/2` via a "next" link updates the URL but not the page. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `const route = useRoute()
const user = ref(null)
onMounted(async () => {
  user.value = await fetchUser(route.params.id)
})`,
      },
      answer: 'Both URLs match the same route record, so Vue Router reuses the existing component instance instead of unmounting and recreating it; only `route.params` changes, and `onMounted` doesn\'t run again. Fix it by reacting to the param: `watch(() => route.params.id, load, { immediate: true })`, or load in `onBeforeRouteUpdate`. Forcing a remount with `<RouterView :key="$route.fullPath" />` also works but throws away all component state on every change.',
      explanation: 'Reuse is an optimisation, and it means "run once" code doesn\'t see later params.',
      whyAsked: 'One of the most common real-world Vue Router bugs.',
      mistakes: ['Blaming caching or suggesting `nextTick`.', 'Reaching straight for `:key` without mentioning its cost.', 'Watching `route` deeply instead of the specific param.'],
      followUps: ['What problem can appear if the user clicks "next" very quickly?', 'How does `props: true` change the fix?', 'When is `onBeforeRouteUpdate` better than a watcher?'],
      modelAnswer: 'Vue Router reuses the component when the new location matches the same route, so setup and onMounted only ran for the first id. The component needs to react to the param: I\'d watch route.params.id with immediate: true and load there, or use onBeforeRouteUpdate if I want to load before the navigation is confirmed. With props: true I\'d watch the prop instead. I\'d also guard against stale responses when ids change quickly — compare the id or cancel the old request. A :key on RouterView works too, but it remounts the whole page every time.',
    },
    {
      id: 'dynamic-routes-spa-404',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your SPA is deployed with web history and a server fallback to `index.html`. Product asks for a proper 404 page. How do you implement it, and what limitation remains?',
      answer: 'Add a catch-all route `{ path: \'/:pathMatch(.*)*\', name: \'not-found\', component: NotFound }`. Vue Router ranks routes by specificity, so it only matches when nothing else does; `params.pathMatch` holds the attempted segments for display. For valid patterns with unknown data (`/products/doesnt-exist`), render a not-found state in the page or redirect to the not-found route. The limitation: the server still answers `200 OK` for every path, so crawlers can see a *soft 404*. If correct status codes matter (SEO), use server rendering or have the server know the valid routes.',
      explanation: 'The client can show a 404 page, but only the server can send a 404 status.',
      whyAsked: 'Tests understanding of how SPA routing interacts with servers and SEO.',
      mistakes: ['Thinking the catch-all must be last to work (ranking handles it).', 'Believing the browser receives a 404 status.', 'Forgetting the "valid route, missing data" case.'],
      followUps: ['How would you keep the attempted URL visible while showing NotFound?', 'How do you redirect old URLs to new ones?'],
      modelAnswer: 'I add a catch-all route with the path /:pathMatch(.*)* rendering a NotFound component that shows the attempted path and a link home. Thanks to route ranking it only wins when nothing else matches. For a pattern that matches but has no data, like a deleted product, the page shows its own not-found state or redirects to the not-found route while preserving the path. The caveat is that with an index.html fallback the server returns 200 for everything, so search engines may treat it as a soft 404 — if that matters, I\'d use SSR so the server can send a real 404.',
    },
    {
      id: 'dynamic-routes-query-array',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'For the URL `/shop?tag=sale&tag=new&preview`, what are `route.query.tag` and `route.query.preview`?',
      options: [
        "`tag: 'new'`, `preview: true`",
        "`tag: ['sale', 'new']`, `preview: null`",
        "`tag: 'sale,new'`, `preview: ''`",
        "`tag: 'sale'`, `preview: undefined`",
      ],
      correctOption: 1,
      answer: '`route.query.tag` is the array `[\'sale\', \'new\']` because the key repeats, and `route.query.preview` is `null` because the key has no value. Missing keys are `undefined`.',
      explanation: 'The query parser keeps every value of a repeated key, and distinguishes "present without value" (`null`) from "absent" (`undefined`).',
      whyAsked: 'Checks whether you write defensive code around URL input instead of assuming strings.',
      mistakes: ['Assuming the last value wins.', 'Assuming query values are booleans or numbers.'],
      followUps: ['How would you normalise these values in a component?', 'How do you produce a repeated key when navigating?'],
      modelAnswer: 'Tag becomes an array of both values because the key repeats, and preview is null since it appears without a value; a key that isn\'t present would be undefined. So I normalise query values before using them — take the first item of an array or support arrays deliberately, convert numbers, whitelist enums. To produce repeated keys I pass an array: query: { tag: [\'sale\', \'new\'] }.',
    },
    {
      id: 'dynamic-routes-props-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'In a large app, should page components call `useRoute()` directly or receive route data as props? Discuss the trade-offs and the props modes Vue Router offers.',
      answer: 'Prefer props for page components that display a resource. With `props: true` params become props; with a function — `props: (route) => ({ id: Number(route.params.id), page: Number(route.query.page) || 1 })` — the route record parses and validates URL data once, so the component receives clean, typed inputs. Such components are reusable (modals, previews), testable without a router and explicit about their inputs. `useRoute()` is fine for components that are inherently about navigation (breadcrumbs, nav bars, components that *write* the query) or when a route-aware composable encapsulates the logic.',
      explanation: 'Treat the router as an adapter at the edge of your page: convert URL → props there, keep the component ignorant of URLs.',
      code: {
        lang: 'js',
        code: `{
  path: '/orders/:id(\\\\d+)',
  component: OrderPage,
  props: (route) => ({
    id: Number(route.params.id),
    tab: ['items', 'history'].includes(route.query.tab) ? route.query.tab : 'items',
  }),
}`,
      },
      whyAsked: 'Probes separation of concerns and testability — signs of experience with larger codebases.',
      mistakes: ['Saying `useRoute()` is wrong everywhere.', 'Forgetting that the props function re-runs on every navigation, so it should be pure and cheap.', 'Not mentioning parsing/validation as a benefit.'],
      followUps: ['What are the three props modes?', 'How would a component update the query if it receives it as a prop?', 'How do you test a component that uses `useRoute()`?'],
      modelAnswer: 'For page components I lean on route props. props: true passes params straight through; the function form lets the route parse and validate — convert the id to a number, default the tab — so the component gets clean inputs. That makes the component reusable outside routing and trivial to test by mounting with props. I still use useRoute and useRouter in components that are about navigation, like breadcrumbs or a filter bar that writes to the query, ideally behind a composable. The props function runs on every navigation, so it should stay pure and cheap.',
    },
    {
      id: 'dynamic-routes-coding-article',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Add an article route. `/articles/:id` must accept **digits only** (anything else falls through to the existing 404 route), and `ArticlePage` must receive `id` as a **Number** prop. It renders `<h2 class="title">Article #{{ id }}</h2>` and `<p class="next-id">Next: #{{ id + 1 }}</p>`.',
      starter: {
        files: {
          'main.js': mainJs,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import Home from './Home.vue'
import ArticlePage from './ArticlePage.vue'
import NotFound from './NotFound.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    // TODO: the article route
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
})`,
          'App.vue': `<template>
  <RouterView />
</template>`,
          'Home.vue': articleHome,
          'ArticlePage.vue': `<script setup>
// TODO: declare the id prop
</script>

<template>
  <h2 class="title">Article</h2>
</template>`,
          'NotFound.vue': articleNotFound,
        },
      },
      tests: [
        { name: '/articles/7 renders article 7 and next 8', code: `const router = requireModule('router.js').default; await router.push('/articles/7'); await flush(); expect(text('.title')).toBe('Article #7'); expect(text('.next-id')).toBe('Next: #8')` },
        { name: '/articles/abc shows the 404 page', code: `const router = requireModule('router.js').default; await router.push('/articles/abc'); await flush(); expect(exists('.not-found')).toBe(true); expect(exists('.title')).toBe(false)` },
        { name: 'ArticlePage works with a numeric prop alone', code: `const w = mountFile('ArticlePage.vue', { id: 41 }); expect(w.text()).toContain('Next: #42')` },
      ],
      hints: ['A custom regex goes in parentheses: `/articles/:id(\\\\d+)` — double the backslash inside the JS string.', 'Use the function form: `props: (route) => ({ id: Number(route.params.id) })`.', 'In the component: `defineProps({ id: { type: Number, required: true } })`.'],
      answer: 'Use `{ path: \'/articles/:id(\\\\d+)\', component: ArticlePage, props: (route) => ({ id: Number(route.params.id) }) }` and declare `id` as a Number prop.',
      solution: {
        files: {
          'main.js': mainJs,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import Home from './Home.vue'
import ArticlePage from './ArticlePage.vue'
import NotFound from './NotFound.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    {
      path: '/articles/:id(\\\\d+)',
      component: ArticlePage,
      props: (route) => ({ id: Number(route.params.id) }),
    },
    { path: '/:pathMatch(.*)*', component: NotFound },
  ],
})`,
          'App.vue': `<template>
  <RouterView />
</template>`,
          'Home.vue': articleHome,
          'ArticlePage.vue': `<script setup>
defineProps({
  id: { type: Number, required: true },
})
</script>

<template>
  <h2 class="title">Article #{{ id }}</h2>
  <p class="next-id">Next: #{{ id + 1 }}</p>
</template>`,
          'NotFound.vue': articleNotFound,
        },
      },
      explanation: 'The regex makes invalid ids a non-match (so the 404 route handles them), and the props function converts the string param once, at the edge — the component simply receives a number.',
      whyAsked: 'Shows you know the matching syntax, that params are strings, and how to decouple components with props.',
      mistakes: ['Using `props: true` and getting `\'7\' + 1 === \'71\'`.', 'Validating inside the component instead of at matching time.', 'Writing `\\d` with a single backslash inside a JS string.'],
      followUps: ['How would you also pass a `?highlight=` query value as a prop?', 'What happens to the props when navigating from article 7 to 8?'],
      modelAnswer: 'I give the route a custom regex, /articles/:id(\\d+), so non-numeric ids never match and fall through to the catch-all. Then I use the props function form to convert the string param with Number, so ArticlePage declares a Number prop and does plain arithmetic. Validation happens at matching, conversion at the route record, and the component has no router dependency.',
    },
  ],

  takeaways: [
    'A dynamic segment like `/users/:id` matches a family of URLs; the value arrives in `route.params.id` — always as a string.',
    'Optional (`?`), repeatable (`+`, `*`) and regex-restricted (`(\\d+)`) params let the path itself validate input.',
    'The query string (`route.query`) holds optional, shareable view state; values are strings, `null` or arrays — validate them.',
    'Same route, new params → the component is reused; react with `watch`, a `computed` or `onBeforeRouteUpdate`.',
    'A catch-all route `/:pathMatch(.*)*` renders your 404 page; `props: true` or a props function decouples page components from the router.',
  ],
}
