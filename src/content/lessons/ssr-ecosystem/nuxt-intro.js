// Lesson: Nuxt fundamentals (Level 17)
//
// The sandbox can't run Nuxt, so runnable code is a SIMPLIFIED model built with
// Vue + Vue Router that mimics Nuxt's conventions. Real Nuxt code is shown as
// static code blocks.

const nuxtJs = `// SIMPLIFIED stand-ins for what Nuxt generates at build time.
// Real Nuxt scans your pages/ folder; here we list the "files" by hand.

// 'pages/products/[id].vue'  ->  '/products/:id'
export function fileToRoute(file) {
  let path = file.replace(/^pages/, '').replace(/\\.vue$/, '')
  path = path.replace(/\\/index$/, '') || '/'
  return path.replace(/\\[(\\w+)\\]/g, ':$1')
}

export function createRoutes(pages) {
  return Object.entries(pages).map(([file, page]) => ({
    path: fileToRoute(file),
    component: page.component,
    meta: page.meta ?? {},
  }))
}

// Route middleware: return a path to redirect, or nothing to continue.
export function runMiddleware(names, registry, to, from) {
  for (const name of names) {
    const result = registry[name](to, from)
    if (result) return result
  }
}`

const pagesJs = `import HomePage from './HomePage.vue'
import ProductPage from './ProductPage.vue'
import LoginPage from './LoginPage.vue'
import AdminPage from './AdminPage.vue'
import ContactPage from './ContactPage.vue' // experiment 1: not registered yet

// Our pretend pages/ folder. In real Nuxt each page file declares its own meta
// with definePageMeta({ layout, middleware }) — here it sits next to the file name.
export const pages = {
  'pages/index.vue': { component: HomePage },
  'pages/products/[id].vue': { component: ProductPage },
  'pages/login.vue': { component: LoginPage },
  'pages/admin.vue': { component: AdminPage, meta: {} },
}`

const sessionJs = `import { reactive } from 'vue'

// Fine in the browser. On a real Nuxt server, module-level state would be shared
// by every request — use useState('user') or a Pinia store instead.
export const session = reactive({ user: null })`

const middlewareJs = `import { session } from './session.js'

// In Nuxt: middleware/auth.js
//   export default defineNuxtRouteMiddleware((to) => {
//     if (!user.value) return navigateTo('/login')
//   })
export const middleware = {
  auth(to) {
    if (!session.user) return '/login'
  },
}`

const routerJs = `import { createRouter, createMemoryHistory } from 'vue-router'
import { pages } from './pages.js'
import { createRoutes, runMiddleware } from './nuxt.js'
import { middleware } from './middleware.js'

export const router = createRouter({
  history: createMemoryHistory(),
  routes: createRoutes(pages),
})

// Nuxt runs route middleware before each navigation: on the server for the
// first request, then in the browser for client-side navigations.
router.beforeEach((to, from) => runMiddleware(to.meta.middleware ?? [], middleware, to, from))`

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'

createApp(App).use(router).mount('#app')`

const appVue = `<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from './DefaultLayout.vue'
import AdminLayout from './AdminLayout.vue'

// Like <NuxtLayout>: use the layout the page asked for in its meta.
const layouts = { default: DefaultLayout, admin: AdminLayout }
const route = useRoute()
const layout = computed(() => layouts[route.meta.layout ?? 'default'])
</script>

<template>
  <component :is="layout">
    <RouterView />
  </component>
</template>`

const defaultLayout = `<template>
  <div class="default-layout">
    <nav>
      <RouterLink to="/">Home</RouterLink> ·
      <RouterLink to="/products/1">Product 1</RouterLink> ·
      <RouterLink to="/admin">Admin</RouterLink> ·
      <RouterLink to="/login">Log in</RouterLink>
    </nav>
    <slot />
  </div>
</template>`

const adminLayout = `<template>
  <div class="admin-layout">
    <aside>🛠 Admin menu · <RouterLink to="/">Back to shop</RouterLink></aside>
    <main><slot /></main>
  </div>
</template>`

const homePage = `<template>
  <h2 class="page">Home</h2>
</template>`

const productPage = `<script setup>
import { useRoute } from 'vue-router'

const route = useRoute() // in Nuxt, useRoute() is auto-imported
</script>

<template>
  <h2 class="page">Product #{{ route.params.id }}</h2>
</template>`

const loginPage = `<script setup>
import { useRouter } from 'vue-router'
import { session } from './session.js'

const router = useRouter()

function logIn() {
  session.user = { name: 'Ada' }
  router.push('/admin')
}
</script>

<template>
  <h2 class="page">Log in</h2>
  <button class="login" @click="logIn">Log in as Ada</button>
</template>`

const adminPage = `<template>
  <h2 class="page">Admin dashboard</h2>
</template>`

const contactPage = `<template>
  <h2 class="page">Contact us</h2>
</template>`

// ---------- exercise 1: useAsyncData with a payload
const payloadJs = `// What the server put into the page after SSR: data it already fetched,
// keyed by the key passed to useAsyncData. (Nuxt serialises this for you.)
export const payload = {
  'product-1': { id: 1, name: 'Trail Backpack' },
}`

const productApi = `export let calls = 0

export function fetchProduct(id) {
  calls++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id === 404) reject(new Error('Product not found'))
      else resolve({ id, name: id === 2 ? 'Camp Stove' : 'Product ' + id })
    }, 40)
  })
}`

const asyncDataApp = `<script setup>
import { useAsyncData } from './useAsyncData.js'
import { fetchProduct } from './api.js'

const first = useAsyncData('product-1', () => fetchProduct(1))
const second = useAsyncData('product-2', () => fetchProduct(2))
</script>

<template>
  <p class="first">{{ first.status.value }} · {{ first.data.value?.name }}</p>
  <p class="second">{{ second.status.value }} · {{ second.data.value?.name }}</p>
</template>`

const asyncDataStarter = `import { ref } from 'vue'
import { payload } from './payload.js'

// SIMPLIFIED model of Nuxt's useAsyncData.
// Return { data, status, error, refresh } — all refs except refresh.
export function useAsyncData(key, handler) {
  const data = ref(null)
  const status = ref('idle')
  const error = ref(null)

  async function refresh() {}

  return { data, status, error, refresh }
}`

const asyncDataSolution = `import { ref } from 'vue'
import { payload } from './payload.js'

// Requests in flight, by key. (Real Nuxt keeps this per app instance —
// per request on the server — never in a module like this.)
const inflight = new Map()

export function useAsyncData(key, handler) {
  const data = ref(null)
  const status = ref('idle')
  const error = ref(null)

  async function run() {
    status.value = 'pending'
    error.value = null
    if (!inflight.has(key)) {
      inflight.set(key, Promise.resolve().then(handler).finally(() => inflight.delete(key)))
    }
    try {
      data.value = await inflight.get(key)
      status.value = 'success'
    } catch (e) {
      error.value = e
      status.value = 'error'
    }
  }

  if (key in payload) {
    // The server already fetched this during SSR: reuse it, don't fetch again.
    data.value = payload[key]
    status.value = 'success'
  } else {
    run()
  }

  return { data, status, error, refresh: run }
}`

// ---------- exercise 2: a server route
const nitroJs = `// SIMPLIFIED stand-ins with the same shape as Nuxt's server utilities
// (which come from h3 / Nitro and are auto-imported in server/ files).
export const defineEventHandler = (handler) => handler

export function getQuery(event) {
  return Object.fromEntries(event.url.searchParams)
}

export function createError({ statusCode, statusMessage }) {
  const error = new Error(statusMessage)
  error.statusCode = statusCode
  return error
}`

const dbJs = `// Server-side data. costPrice is internal and must never reach the browser.
export const products = [
  { id: 1, name: 'Trail Backpack', price: 89, costPrice: 41 },
  { id: 2, name: 'Camp Stove', price: 45, costPrice: 19 },
  { id: 3, name: 'Head Lamp', price: 25, costPrice: 8 },
  { id: 4, name: 'Desk Lamp', price: 39, costPrice: 15 },
  { id: 5, name: 'Sleeping Bag', price: 120, costPrice: 60 },
  { id: 6, name: 'Water Bottle', price: 15, costPrice: 4 },
  { id: 7, name: 'Lantern', price: 32, costPrice: 12 },
]`

const serverRoutesJs = `import products from './products.get.js'

// Nuxt maps server/api/products.get.js to GET /api/products automatically.
export const routes = {
  'GET /api/products': products,
}`

const fetchJs = `import { routes } from './server-routes.js'
import { createError } from './nitro.js'

// Like Nuxt's $fetch. (During SSR, Nuxt calls your own /api routes in-process
// instead of making an HTTP request; in the browser it uses HTTP.)
export async function $fetch(url, { method = 'GET' } = {}) {
  const parsed = new URL(url, 'http://localhost')
  const handler = routes[method + ' ' + parsed.pathname]
  if (!handler) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  return handler({ method, url: parsed })
}`

const productsHandlerStarter = `import { defineEventHandler, getQuery, createError } from './nitro.js'
import { products } from './db.js'

// server/api/products.get.js — runs only on the server.
export default defineEventHandler((event) => {
  return products
})`

const productsHandlerSolution = `import { defineEventHandler, getQuery, createError } from './nitro.js'
import { products } from './db.js'

// server/api/products.get.js — runs only on the server.
export default defineEventHandler((event) => {
  const { q = '', limit = '10' } = getQuery(event)

  const max = Number(limit)
  if (!Number.isInteger(max) || max < 1 || max > 50) {
    throw createError({ statusCode: 400, statusMessage: 'limit must be between 1 and 50' })
  }

  const term = q.trim().toLowerCase()
  const matches = products.filter((p) => p.name.toLowerCase().includes(term))

  return {
    total: matches.length,
    // Shape the response: only public fields leave the server.
    items: matches.slice(0, max).map(({ id, name, price }) => ({ id, name, price })),
  }
})`

const searchApp = `<script setup>
import { ref, watch } from 'vue'
import { $fetch } from './fetch.js'

const q = ref('')
const result = ref(null)
const error = ref('')

watch(q, async (term) => {
  error.value = ''
  try {
    result.value = await $fetch('/api/products?q=' + encodeURIComponent(term))
  } catch (e) {
    error.value = e.message
  }
}, { immediate: true })
</script>

<template>
  <input v-model="q" class="q" placeholder="Search products" />
  <p v-if="error" class="error">{{ error }}</p>
  <ul v-else-if="result" class="results">
    <li v-for="p in result.items" :key="p.id">{{ p.name }} — €{{ p.price }}</li>
  </ul>
</template>`

// ---------- interview coding: fileToRoute
const routeStarter = `// Convert a Nuxt-style page file path into a Vue Router path.
export function fileToRoute(file) {
  return file
}`

const routeSolution = `export function fileToRoute(file) {
  let path = file.replace(/^pages/, '').replace(/\\.vue$/, '')
  path = path.replace(/\\/index$/, '')                       // pages/blog/index.vue -> /blog
  path = path
    .replace(/\\[\\.\\.\\.(\\w+)\\]/g, ':$1(.*)*')                  // [...slug] -> catch-all
    .replace(/\\[\\[(\\w+)\\]\\]/g, ':$1?')                         // [[slug]]  -> optional
    .replace(/\\[(\\w+)\\]/g, ':$1')                              // [id]      -> :id
  return path || '/'
}`

const routeApp = `<script setup>
import { fileToRoute } from './fileToRoute.js'

const files = ['pages/index.vue', 'pages/products/[id].vue', 'pages/[...slug].vue']
</script>

<template>
  <ul>
    <li v-for="f in files" :key="f" class="mapping">{{ f }} → {{ fileToRoute(f) }}</li>
  </ul>
</template>`

export default {
  id: 'nuxt-intro',
  title: 'Nuxt fundamentals',
  summary: 'Meet Nuxt, the full-stack framework built on Vue: file-based routing, SSR-aware data fetching, layouts, route middleware, server routes and flexible deployment.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['rendering-strategies', 'hydration', 'router-basics'],
  related: ['spa-or-nuxt', 'dynamic-routes', 'navigation-guards', 'pinia-basics', 'fetching-data', 'secrets-csp-dependencies'],
  tags: ['nuxt', 'ssr', 'file-based routing', 'pages', 'useFetch', 'useAsyncData', '$fetch', 'layouts', 'middleware', 'server routes', 'nitro', 'runtimeConfig', 'routeRules', 'deployment'],
  apis: [
    { name: 'useFetch()', summary: 'Nuxt composable: SSR-friendly data fetching — fetched on the server, transferred to the client, not refetched during hydration.' },
    { name: 'useAsyncData()', summary: 'Nuxt composable: like useFetch but wraps any async function, identified by a key.' },
    { name: '$fetch', summary: 'Nuxt\'s fetch helper for event handlers and server code (no SSR deduplication on its own).' },
    { name: 'definePageMeta()', summary: 'Compiler macro in Nuxt pages: set layout, middleware and other route meta.' },
    { name: 'defineNuxtRouteMiddleware()', summary: 'Defines route middleware that runs before navigation; return navigateTo() to redirect.' },
    { name: 'defineEventHandler()', summary: 'Defines a server route handler in server/api (Nitro/h3).' },
    { name: 'useRuntimeConfig()', summary: 'Reads runtime config: private keys on the server only, `public` keys everywhere.' },
  ],
  docs: [
    { label: 'Nuxt — Introduction', url: 'https://nuxt.com/docs/getting-started/introduction' },
    { label: 'Nuxt — Routing (pages directory)', url: 'https://nuxt.com/docs/getting-started/routing' },
    { label: 'Nuxt — Data fetching', url: 'https://nuxt.com/docs/getting-started/data-fetching' },
    { label: 'Nuxt — Server directory', url: 'https://nuxt.com/docs/guide/directory-structure/server' },
    { label: 'Nuxt — Deployment', url: 'https://nuxt.com/docs/getting-started/deployment' },
    { label: 'Vue Guide — SSR: higher-level solutions', url: 'https://vuejs.org/guide/scaling-up/ssr.html#higher-level-solutions' },
  ],

  intro: `
**Nuxt** is an open-source framework built on top of Vue. You still write Vue components — with \`ref\`, \`computed\`, props and slots — but Nuxt adds the parts every server-rendered app needs, wired together by **conventions** instead of configuration:

- **File-based routing:** a file in \`pages/\` *is* a route.
- **Rendering of your choice:** server-side rendering by default, static generation, SPA mode, or a mix per route.
- **SSR-aware data fetching** (\`useFetch\`, \`useAsyncData\`) that doesn't fetch twice during hydration.
- **Layouts, route middleware, auto-imports**, SEO helpers and a module ecosystem.
- **Server routes** in \`server/\`: your own API endpoints in the same project, powered by Nuxt's server engine, **Nitro**, which also deploys to many hosts.

Everything in this lesson's runnable code is a **simplified model** built with Vue and Vue Router — the sandbox can't run Nuxt. Real Nuxt code appears in static code blocks.
`,

  why: `
In the [rendering strategies](lesson:rendering-strategies) and [hydration](lesson:hydration) lessons you saw what hand-made SSR involves: two builds (client and server), \`createSSRApp\` + \`renderToString\`, a per-request app/router/store, transferring fetched data into the page, avoiding mismatches, and a Node server to run it all. Then you still need routing, code splitting, meta tags, an API, environment config and a deployment story.

Each piece is doable. Doing all of them well, consistently, across a team, is a project in itself. Nuxt packages those decisions:

| You'd build by hand | Nuxt gives you |
|---|---|
| router config + lazy routes | \`pages/\` file-based routing, code-split per page |
| SSR server, client/server builds | built in (Nitro + Vite) |
| fetch on server, serialise, reuse on client | \`useFetch\` / \`useAsyncData\` |
| layouts, auth redirects | \`layouts/\`, \`middleware/\` |
| a separate API project | \`server/api/\` |
| deployment per host | Nitro presets (Node, static, serverless, edge) |

The trade-off: you adopt Nuxt's conventions, build pipeline and server runtime. Whether that's worth it is the subject of the [next lesson](lesson:spa-or-nuxt).
`,

  eli15: `
Building a website with plain Vue is like building a house with **excellent bricks**. Vue gives you the best bricks in the world (components), but you decide where the plumbing goes, wire the electricity, and design every room's layout yourself.

**Nuxt is a house kit** that comes with a floor plan. Put a file in the \`pages\` room and — ta-da — it becomes a page on your site. Put a file in \`layouts\` and it becomes the frame around your pages. Put a file in \`server/api\` and it becomes a little kitchen where the server cooks data for you. The plumbing (server rendering, sending data to the browser, deployment) is already installed.

You still use the same bricks (Vue components). You just follow the floor plan, and you get a lot of house very quickly.
`,

  analogy: {
    title: 'The house kit with a floor plan',
    body: `
A floor plan is a set of conventions: "the kitchen goes here, the bathroom there". Follow it and the builders (Nuxt) know what to do without asking. Fight it and you'll spend your time drilling through walls.
`,
    mapping: [
      ['the bricks', 'Vue components — the same in Nuxt and plain Vue'],
      ['rooms on the floor plan', 'conventional folders: pages/, layouts/, components/, composables/, middleware/, server/'],
      ['a new room = a new page', 'file-based routing: pages/about.vue → /about'],
      ['the frame around rooms', 'layouts with a <slot /> for the page'],
      ['the door with a doorman', 'route middleware — redirects before entering a page (UX, not security)'],
      ['the kitchen', 'server routes in server/api, run by Nitro'],
      ['pre-installed plumbing', 'SSR, payload transfer, code splitting, deployment presets'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'One Nuxt request, start to finish',
    caption: 'What happens when a visitor opens /products/42 in a server-rendered Nuxt app — and on the next client-side navigation.',
    alt: 'A flow: the browser requests /products/42 from the Nitro server. Route middleware runs, then the page component renders; its useFetch call reaches the server/api route in-process. The server responds with HTML plus a serialized payload. The browser hydrates using the payload without refetching. Later navigations happen in the browser, where useFetch calls the API over HTTP.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'browser', label: 'Browser', note: 'GET /products/42', tone: 'paper', x: 90, y: 160 },
        { id: 'nitro', label: 'Nitro server', note: 'Nuxt\'s server engine', tone: 'cobalt', x: 280, y: 70 },
        { id: 'mw', label: 'Route middleware', note: 'e.g. auth redirect', tone: 'kraft', x: 470, y: 70 },
        { id: 'page', label: 'pages/products/[id].vue', note: 'useFetch(...)', tone: 'acid', x: 660, y: 70 },
        { id: 'api', label: 'server/api/products/[id]', note: 'called in-process', tone: 'kraft', x: 660, y: 250 },
        { id: 'html', label: 'HTML + payload', note: 'hydrate, no refetch', tone: 'acid', x: 280, y: 250 },
      ],
      edges: [
        { from: 'browser', to: 'nitro', label: 'request' },
        { from: 'nitro', to: 'mw' },
        { from: 'mw', to: 'page' },
        { from: 'page', to: 'api', label: 'data' },
        { from: 'api', to: 'html', dashed: true },
        { from: 'html', to: 'browser', label: 'response' },
      ],
      steps: [
        { focus: ['browser', 'nitro'], edges: ['browser->nitro'], text: 'The visitor opens `/products/42`. Nuxt\'s server engine, **Nitro**, receives the request and finds the matching page from the `pages/` folder: `pages/products/[id].vue`.' },
        { focus: ['mw'], edges: ['nitro->mw'], text: '**Route middleware** runs first (for example an auth check that redirects to `/login`). On this first request it runs on the server; later navigations run it in the browser.' },
        { focus: ['page', 'api'], edges: ['mw->page', 'page->api'], text: 'The page renders. Its `useFetch(\'/api/products/42\')` call hits your own **server route**. During SSR Nuxt calls it directly in-process — no extra HTTP round trip.' },
        { focus: ['html'], edges: ['api->html'], text: 'Nuxt renders HTML and **serialises the fetched data** (the payload) into the page, so the browser gets both the markup and the data it was built from.' },
        { focus: ['browser'], edges: ['html->browser'], text: 'The browser shows the HTML and hydrates. `useFetch` finds its data in the payload and **doesn\'t fetch again**, so the first client render matches the server — no mismatch.' },
        { focus: ['browser', 'page'], text: 'Clicking a `<NuxtLink>` to `/products/7` is now a **client-side navigation**: no full page load; middleware runs in the browser and `useFetch` calls the API over HTTP.' },
      ],
    },
  },

  animation: {
    type: 'comparison',
    title: 'The same routes: Vue Router config vs Nuxt pages',
    caption: 'Nuxt generates the router configuration from your folder structure (and still uses Vue Router under the hood).',
    alt: 'Side by side. Left: a hand-written Vue Router config listing routes for home, about, a dynamic product route, a nested account route and a catch-all, with lazy imports. Right: the equivalent Nuxt pages directory tree with index.vue, about.vue, products/[id].vue, account.vue with an account folder, and [...slug].vue.',
    props: {
      left: {
        label: 'Plain Vue: router.js',
        lang: 'js',
        code: `const routes = [
  { path: '/', component: () => import('./pages/Home.vue') },
  { path: '/about', component: () => import('./pages/About.vue') },
  { path: '/products/:id', component: () => import('./pages/Product.vue') },
  {
    path: '/account',
    component: () => import('./pages/Account.vue'),
    children: [
      { path: 'orders', component: () => import('./pages/Orders.vue') },
    ],
  },
  { path: '/:slug(.*)*', component: () => import('./pages/NotFound.vue') },
]`,
      },
      right: {
        label: 'Nuxt: the pages/ folder',
        lang: 'text',
        code: `pages/
├─ index.vue            →  /
├─ about.vue            →  /about
├─ products/
│  └─ [id].vue          →  /products/:id
├─ account.vue          →  /account   (renders <NuxtPage />)
├─ account/
│  └─ orders.vue        →  /account/orders
└─ [...slug].vue        →  catch-all (404 page)`,
      },
      points: [
        'Brackets mark params: [id] is required, [[id]] optional, [...slug] catch-all.',
        'A page file plus a folder of the same name creates nested routes; the parent renders <NuxtPage />.',
        'Each page is code-split automatically — no manual () => import().',
        'Vue Router concepts (params, guards, nested views) still apply; Nuxt writes the config.',
      ],
    },
  },

  syntax: [
    `
#### Project shape (Nuxt 3+)

\`\`\`text
app.vue              ← root component (renders <NuxtLayout> / <NuxtPage />)
pages/               ← file-based routes
layouts/             ← default.vue, admin.vue … wrap pages via <slot />
components/          ← auto-imported components
composables/         ← auto-imported composables
middleware/          ← route middleware (auth.js, *.global.js)
server/api/          ← API endpoints (Nitro)
public/              ← static files
nuxt.config.ts       ← configuration
\`\`\`
`,
    {
      callout: 'version',
      title: 'Check your Nuxt version',
      text: 'The examples follow Nuxt 3+ conventions. Nuxt 4 moves the app folders (pages, layouts, components, composables, middleware, app.vue) into an `app/` directory by default, while `server/` and `public/` stay at the root. APIs evolve between versions — check the Nuxt docs for the version you use.',
    },
    `
#### Pages, params and navigation
`,
    {
      code: `<!-- pages/products/[id].vue -->
<script setup>
const route = useRoute()                  // auto-imported (Vue Router's route)
const { data: product, status, error } = await useFetch(\`/api/products/\${route.params.id}\`)

definePageMeta({ layout: 'shop', middleware: ['auth'] })
</script>

<template>
  <p v-if="status === 'pending'">Loading…</p>
  <p v-else-if="error">Couldn't load this product.</p>
  <article v-else>
    <h1>{{ product.name }}</h1>
    <NuxtLink to="/products">Back to all products</NuxtLink>
  </article>
</template>`,
      lang: 'vue',
      title: 'a Nuxt page (static example)',
      static: true,
    },
    `
- \`useFetch(url)\` fetches during SSR, puts the result in the payload, and reuses it during hydration. It returns refs: \`data\`, \`error\`, \`status\`, plus \`refresh()\`.
- \`useAsyncData(key, () => anyAsyncWork())\` does the same for arbitrary async logic; the **key** identifies the data in the payload and dedupes requests.
- \`$fetch(url)\` is for code that runs in response to user actions (a form submit) — calling it directly in setup would fetch on the server **and again** in the browser.
- \`<NuxtLink>\` does client-side navigation (and prefetching); \`navigateTo('/path')\` navigates from code.

#### Layouts and middleware
`,
    {
      code: `<!-- layouts/default.vue -->
<template>
  <header>…</header>
  <slot />            <!-- the page goes here -->
</template>

<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>`,
      lang: 'vue',
      title: 'layouts (static example)',
      static: true,
    },
    {
      code: `// middleware/auth.js
export default defineNuxtRouteMiddleware((to, from) => {
  const user = useState('user')            // SSR-safe shared state
  if (!user.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})`,
      lang: 'js',
      title: 'route middleware (static example)',
      static: true,
    },
    {
      callout: 'warn',
      title: 'Middleware is not authorization',
      text: 'Route middleware decides which page renders — it\'s a navigation guard. Your `server/api` handlers must still check the session and permissions on every request, exactly like any backend ([auth lesson](lesson:auth-security)).',
    },
    `
#### Server routes and runtime config
`,
    {
      code: `// server/api/products.get.js  →  GET /api/products
export default defineEventHandler(async (event) => {
  const { q } = getQuery(event)
  const config = useRuntimeConfig(event)        // private keys available here
  const items = await searchCatalogue(q, config.catalogueApiKey)
  return items.map(({ id, name, price }) => ({ id, name, price }))
})`,
      lang: 'js',
      title: 'a server route (static example)',
      static: true,
    },
    {
      code: `// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    catalogueApiKey: '',          // server only — set via NUXT_CATALOGUE_API_KEY
    public: {
      apiBase: '/api',            // exposed to the client — NUXT_PUBLIC_API_BASE
    },
  },
  routeRules: {
    '/': { prerender: true },              // static at build time
    '/blog/**': { prerender: true },
    '/admin/**': { ssr: false },           // client-rendered SPA section
  },
})`,
      lang: 'ts',
      title: 'nuxt.config.ts (static example)',
      static: true,
    },
    `
\`runtimeConfig\` keys outside \`public\` exist **only on the server** — the safe home for secrets that \`VITE_\` variables can't be ([secrets lesson](lesson:secrets-csp-dependencies)). \`routeRules\` lets you mix rendering strategies per route (hybrid rendering).

#### Building and deploying

- \`nuxi build\` (or \`nuxt build\`) produces a server build in \`.output/\` that Nitro can run as a Node server or adapt to serverless and edge platforms via **presets**.
- \`nuxi generate\` prerenders routes to static files for any static host.
- \`ssr: false\` in \`nuxt.config\` turns the whole app into a client-rendered SPA (still with Nuxt's conventions).
`,
  ],

  walkthrough: {
    title: 'nuxt.js',
    lang: 'js',
    code: nuxtJs,
    intro: 'The playground\'s tiny model of what Nuxt does at build time: turn file names into routes, and run route middleware before navigation.',
    steps: [
      { lines: [1, 2], text: 'Labelled simplified on purpose. Real Nuxt scans the filesystem, supports many more conventions and generates typed routes.' },
      { lines: [5, 9], text: '`fileToRoute` strips `pages` and `.vue`, turns a trailing `/index` into the folder\'s path (or `/`), and converts `[id]` into the Vue Router param `:id`.' },
      { lines: [11, 17], text: '`createRoutes` builds a normal Vue Router route list. Nuxt really does generate Vue Router routes — your router knowledge still applies.' },
      { lines: [19, 25], text: 'Middleware are functions run in order before a navigation. Returning a path redirects (Nuxt: `return navigateTo(\'/login\')`); returning nothing continues.' },
    ],
  },

  playground: {
    title: 'A Nuxt project in miniature',
    objective: 'Explore a simplified model of Nuxt\'s conventions — pages, layouts and middleware — then add a page, a layout and an auth middleware the "Nuxt way".',
    files: {
      'main.js': mainJs,
      'router.js': routerJs,
      'nuxt.js': nuxtJs,
      'pages.js': pagesJs,
      'middleware.js': middlewareJs,
      'session.js': sessionJs,
      'App.vue': appVue,
      'DefaultLayout.vue': defaultLayout,
      'AdminLayout.vue': adminLayout,
      'HomePage.vue': homePage,
      'ProductPage.vue': productPage,
      'LoginPage.vue': loginPage,
      'AdminPage.vue': adminPage,
      'ContactPage.vue': contactPage,
    },
    expected: 'A navigation bar and the **Home** page. **Product 1** shows "Product #1" — the route `/products/:id` came from the file name `pages/products/[id].vue`. **Admin** opens without logging in and uses the default layout (for now).',
    experiments: [
      {
        id: 'contact-page',
        task: 'Add a page the Nuxt way: register `ContactPage` in `pages.js` under the file name `\'pages/contact.vue\'`. Then visit `/contact`.',
        hint: 'Add `\'pages/contact.vue\': { component: ContactPage },` to the `pages` object.',
        tests: [
          {
            name: '/contact renders the contact page',
            code: `const { router } = requireModule('router.js')
await router.push('/contact')
await flush()
expect(text('.page')).toBe('Contact us')`,
          },
        ],
        explain: 'You never touched the router config — the file name decided the URL. In real Nuxt, creating `pages/contact.vue` is literally all it takes.',
      },
      {
        id: 'admin-layout',
        task: 'Give the admin page its own layout: set `meta: { layout: \'admin\' }` on `\'pages/admin.vue\'` (Nuxt: `definePageMeta({ layout: \'admin\' })` inside the page).',
        hint: 'In `pages.js`: `\'pages/admin.vue\': { component: AdminPage, meta: { layout: \'admin\' } }`.',
        tests: [
          {
            name: '/admin uses the admin layout',
            code: `requireModule('session.js').session.user = { name: 'Ada' }
const { router } = requireModule('router.js')
await router.push('/admin')
await flush()
expect(exists('.admin-layout')).toBe(true)
expect(exists('.default-layout')).toBe(false)`,
          },
        ],
        explain: 'Layouts wrap pages through a `<slot />`; the page only names the layout it wants. `App.vue` plays the role of `<NuxtLayout>`, choosing the layout component from the route meta.',
      },
      {
        id: 'auth-middleware',
        task: 'Protect the admin page\'s *navigation*: add `middleware: [\'auth\']` to its meta, so logged-out visitors are redirected to `/login`.',
        hint: '`meta: { layout: \'admin\', middleware: [\'auth\'] }` — the `auth` function already exists in `middleware.js`.',
        tests: [
          {
            name: 'logged-out visitors are redirected to /login',
            code: `const { router } = requireModule('router.js')
await router.push('/admin')
await flush()
expect(router.currentRoute.value.path).toBe('/login')`,
          },
          {
            name: 'after logging in, /admin opens',
            code: `const { router } = requireModule('router.js')
await router.push('/login')
await flush()
await click('.login')
await flush()
expect(router.currentRoute.value.path).toBe('/admin')
expect(text('.page')).toBe('Admin dashboard')`,
          },
        ],
        explain: 'Middleware gives a good experience. But remember: anyone can still call your `server/api` endpoints directly — each handler must check the session itself.',
      },
      {
        id: 'dynamic-param',
        task: 'Change the "Product 1" link in `DefaultLayout.vue` to `/products/42` and click it. Which file renders it, and where does `42` come from?',
        hint: 'Look at `fileToRoute` in `nuxt.js` and at `route.params.id` in `ProductPage.vue`.',
        explain: 'One file, `pages/products/[id].vue`, serves every product. The bracket name becomes the route param name — exactly like `:id` in a hand-written Vue Router config.',
      },
    ],
  },

  internals: {
    beginner: `
Nuxt is Vue plus a toolbox and a set of folder rules. When you run it, Nuxt looks at your folders, writes the boring setup code for you (the router, the server, the build), and starts a development server. Your components are still plain Vue components.
`,
    technical: [
      `
**Build time.** Nuxt scans conventional directories and generates code: a Vue Router route table from \`pages/\` (with each page code-split), import maps for auto-imported components and composables, layout and middleware registries, and type declarations. Vite builds the client and server bundles; **Nitro** builds the server — including your \`server/\` routes — into \`.output/\`.

**Request time (universal rendering).** For a first visit, Nitro handles the request: it creates a fresh Nuxt app for this request (so state isn't shared between users), runs route middleware, renders the page with Vue's server renderer, and serialises the **payload** — data from \`useFetch\`/\`useAsyncData\`, \`useState\` values, Pinia state — into the HTML. In the browser, the client bundle hydrates using that payload, and from then on navigation is client-side like a normal SPA.

**Why \`useFetch\` instead of \`fetch\` in setup.** Setup runs twice: on the server and during hydration. A plain fetch would request the data twice and, if the answers differ, cause a mismatch. \`useAsyncData\`/\`useFetch\` store the server result under a key; on the client they find it in the payload and skip the request.
`,
      {
        code: `// Roughly what useAsyncData does (simplified)
function useAsyncData(key, handler) {
  const nuxtApp = useNuxtApp()
  const data = ref(nuxtApp.payload.data[key])     // from the server, if present
  if (data.value === undefined) {
    // server: fetch, then store in payload; client navigation: just fetch
    promise = handler().then((result) => {
      data.value = result
      nuxtApp.payload.data[key] = result
    })
  }
  return { data /* , status, error, refresh … */ }
}`,
        lang: 'js',
        title: 'the payload idea (heavily simplified, static example)',
      },
      `
**Server routes.** Files in \`server/api\` and \`server/routes\` become HTTP handlers (built on h3). The suffix selects the method (\`.get\`, \`.post\`), and brackets work like in pages (\`server/api/products/[id].get.js\`). During SSR, \`$fetch('/api/…')\` calls these handlers directly in-process.
`,
    ],
    production: `
- **Choose the rendering mode per route** with \`routeRules\`: prerender marketing and docs, SSR dynamic public pages, \`ssr: false\` for app sections behind login, and caching rules where your host supports them.
- **Deploy with a Nitro preset:** a Node server (\`node .output/server/index.mjs\`), serverless functions, edge runtimes, or fully static output with \`nuxi generate\`. Make sure the preset matches your host.
- **Keep secrets in private \`runtimeConfig\`**, overridden by \`NUXT_*\` environment variables at runtime; only \`runtimeConfig.public\` reaches the browser.
- **Authorize in server routes**, not only in middleware. Validate input in every handler and shape responses so internal fields never leave the server.
- **Use SSR-safe state:** \`useState\` or Pinia (via the Pinia Nuxt module), never module-level reactive objects that would be shared across requests.
- **Watch hydration warnings and payload size:** large payloads slow down pages; only return the fields you need from \`useFetch\` (it supports options such as \`pick\` and \`transform\`).
`,
  },

  mistakes: [
    {
      title: 'Calling $fetch directly in setup',
      wrong: { code: `<script setup>\nconst products = ref(await $fetch('/api/products')) // server AND client fetch\n</script>`, lang: 'vue' },
      right: { code: `<script setup>\nconst { data: products } = await useFetch('/api/products') // reused from payload\n</script>`, lang: 'vue' },
      explanation: 'Setup runs on the server and again during hydration. `$fetch` has no payload transfer, so the data is fetched twice and can differ, causing mismatches. Use `useFetch`/`useAsyncData` for data needed to render; `$fetch` for user actions.',
    },
    {
      title: 'Trusting route middleware for security',
      wrong: { code: `// middleware/admin.js redirects non-admins…\n// server/api/users.delete.js has no permission check`, lang: 'js' },
      right: { code: `// server/api/users/[id].delete.js\nexport default defineEventHandler(async (event) => {\n  const user = await requireAdmin(event)   // check the session server-side\n  …\n})`, lang: 'js' },
      explanation: 'Middleware controls navigation in your app; the API is reachable without it. Every server handler checks authentication and authorization.',
    },
    {
      title: 'Module-level state in a universal app',
      wrong: { code: `// composables/useCart.js\nconst cart = ref([]) // shared by every request on the server!\nexport const useCart = () => cart`, lang: 'js' },
      right: { code: `export const useCart = () => useState('cart', () => [])`, lang: 'js' },
      explanation: '`useState` creates state per request on the server and transfers it to the client. Module-level refs are shared across all users of the server process.',
    },
    {
      title: 'Putting secrets in public runtime config',
      wrong: { code: `runtimeConfig: {\n  public: { paymentSecret: process.env.PAYMENT_SECRET }, // shipped to every browser\n}`, lang: 'ts' },
      right: { code: `runtimeConfig: {\n  paymentSecret: '',      // server only (NUXT_PAYMENT_SECRET)\n  public: { apiBase: '/api' },\n}`, lang: 'ts' },
      explanation: 'Everything under `public` is serialised into the page for the client. Private keys stay on the server and are read in server routes with `useRuntimeConfig(event)`.',
    },
    {
      title: 'Using browser APIs in setup of a server-rendered page',
      wrong: { code: `const width = window.innerWidth // crashes during SSR`, lang: 'js' },
      right: { code: `const width = ref(0)\nonMounted(() => { width.value = window.innerWidth })\n// or wrap the widget in <ClientOnly>`, lang: 'js' },
      explanation: 'Nuxt renders on the server by default. Browser-only code goes in `onMounted`, behind `import.meta.client`, or inside `<ClientOnly>` ([hydration lesson](lesson:hydration)).',
    },
  ],

  debugging: [
    {
      symptom: 'An API endpoint is called twice on page load (once in server logs, once in the browser\'s Network tab).',
      cause: 'Data fetched with `$fetch`/`fetch` in setup instead of `useFetch`/`useAsyncData`, or `useAsyncData` keys that differ between server and client.',
      fix: 'Use `useFetch`/`useAsyncData` with stable keys for render data, so the client reuses the payload.',
    },
    {
      symptom: '`window is not defined` / `document is not defined` during a Nuxt build or request.',
      cause: 'Browser-only code (or a browser-only library) running during server rendering.',
      fix: 'Move it to `onMounted`, guard with `import.meta.client`, wrap components in `<ClientOnly>`, or register the plugin as client-only.',
    },
    {
      symptom: 'A new page file doesn\'t show up as a route.',
      cause: 'It\'s in the wrong folder (e.g. `components/` or, in Nuxt 4, outside `app/pages/`), the name doesn\'t follow the conventions, or `app.vue` doesn\'t render `<NuxtPage />`.',
      fix: 'Check the directory structure for your Nuxt version and that `app.vue` contains `<NuxtPage />` (inside `<NuxtLayout>` if you use layouts).',
    },
    {
      symptom: 'A config value is `undefined` in the browser but fine on the server.',
      cause: 'It\'s a private `runtimeConfig` key — by design not available on the client.',
      fix: 'If it\'s genuinely public, move it under `runtimeConfig.public`; if it\'s secret, keep it server-side and expose only what\'s needed through a server route.',
    },
  ],

  bestPractices: [
    'Follow the conventions (pages, layouts, composables, server) instead of fighting them — that\'s where Nuxt\'s value lives.',
    'Use `useFetch`/`useAsyncData` for data needed to render, `$fetch` for user-triggered actions.',
    'Use `useState` or Pinia for shared state; never module-level reactive objects.',
    'Keep secrets in private `runtimeConfig`; expose only `runtimeConfig.public` values to the client.',
    'Treat middleware as UX and authorize every request in server routes.',
    'Pick rendering per route with `routeRules`, and pick a Nitro preset that matches your host.',
    'Validate input and shape responses in server routes so internal fields never leave the server.',
  ],

  useCases: [
    'Content-heavy sites (marketing, docs, blogs) with SSG/SSR and great SEO.',
    'E-commerce storefronts that need fast first loads, SEO and social previews.',
    'Full-stack apps where a small API lives next to the frontend in `server/api`.',
    'Hybrid products: prerendered landing pages, SSR catalogue, SPA dashboard — one project.',
    'Teams that want strong conventions so every project looks the same.',
  ],

  whenToUse: {
    use: [
      'When pages need SSR/SSG for SEO, previews or first-load performance.',
      'When you want routing, data fetching, layouts and an API wired up by conventions.',
      'When you need flexible deployment (Node, serverless, edge, static) from one codebase.',
    ],
    avoid: [
      'Small, purely client-side widgets embedded in another site.',
      'Apps behind a login with no SEO needs where a plain Vite SPA is simpler to host — see [SPA or Nuxt](lesson:spa-or-nuxt).',
      'When your team can\'t operate a server runtime and static output isn\'t enough.',
    ],
  },

  comparison: {
    title: 'Plain Vue (Vite) vs Nuxt',
    headers: ['', 'Vue + Vite + Vue Router', 'Nuxt'],
    rows: [
      ['Routing', 'write the route config yourself', 'generated from `pages/`'],
      ['Rendering', 'CSR (SSR by hand with core APIs)', 'SSR by default; SSG, SPA, hybrid per route'],
      ['Data fetching', 'your own composables', '`useFetch` / `useAsyncData` with payload transfer'],
      ['Backend', 'separate project', 'optional `server/api` routes (Nitro)'],
      ['Secrets', 'must live in another backend', 'private `runtimeConfig` in server routes'],
      ['Hosting', 'static files', 'Node, serverless, edge or static (presets)'],
      ['Learning curve', 'Vue + Router + your choices', 'Vue + Router + Nuxt conventions'],
    ],
    note: 'Vue core features (components, reactivity, `createSSRApp`) are the same in both. Nuxt adds conventions and infrastructure around them.',
  },

  quiz: [
    {
      id: 'nuxt-intro-q1',
      type: 'output',
      prompt: 'In a Nuxt app, which URL does the file `pages/products/[id].vue` serve?',
      options: [
        { text: '`/products/[id]` literally', why: 'Brackets mark a dynamic parameter; they don\'t appear in the URL.' },
        { text: '`/products/:id` — any product id, available as `route.params.id`' },
        { text: '`/products` only', why: 'That would be `pages/products/index.vue` (or `pages/products.vue`).' },
        { text: 'None until you add it to router.js', why: 'Nuxt generates routes from the pages folder; no manual config needed.' },
      ],
      answer: 1,
      explanation: '`[id]` becomes the route param `:id`. `/products/42` renders this page with `route.params.id === \'42\'`.',
    },
    {
      id: 'nuxt-intro-q2',
      type: 'mcq',
      prompt: 'Why should render data in a Nuxt page use `useFetch` rather than `$fetch` directly in setup?',
      options: [
        { text: '`useFetch` fetches during SSR and reuses the result from the payload during hydration, so it isn\'t fetched twice.' },
        { text: '`$fetch` doesn\'t work on the server', why: '`$fetch` works on both sides — that\'s exactly why calling it in setup fetches twice.' },
        { text: '`useFetch` is the only way to send cookies', why: 'Cookie handling isn\'t the main difference; payload transfer and deduplication are.' },
        { text: '`$fetch` is deprecated', why: 'It isn\'t; it\'s the right tool for user-triggered requests and server code.' },
      ],
      answer: 0,
      explanation: 'Setup runs on the server and in the browser. `useFetch`/`useAsyncData` transfer server results to the client; `$fetch` alone would request again.',
    },
    {
      id: 'nuxt-intro-q3',
      type: 'bug',
      prompt: 'This Nuxt config leaks a secret to every visitor. Click the line.',
      code: {
        lang: 'ts',
        code: `export default defineNuxtConfig({
  runtimeConfig: {
    databaseUrl: '',
    public: {
      apiBase: '/api',
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    },
  },
})`,
      },
      answerLine: 6,
      explanation: 'Keys under `runtimeConfig.public` are sent to the client. The secret key belongs next to `databaseUrl` (server only), read in server routes with `useRuntimeConfig(event)`.',
    },
    {
      id: 'nuxt-intro-q4',
      type: 'fill',
      prompt: 'Complete the route middleware that sends logged-out users to the login page.',
      code: {
        lang: 'js',
        code: `// middleware/auth.js
export default ___((to) => {
  const user = useState('user')
  if (!user.value) return ___('/login')
})`,
      },
      answer: [['defineNuxtRouteMiddleware'], ['navigateTo']],
      explanation: '`defineNuxtRouteMiddleware` defines middleware; returning `navigateTo(…)` redirects. Pages opt in with `definePageMeta({ middleware: [\'auth\'] })`, or name the file `auth.global.js` to run it on every route.',
    },
    {
      id: 'nuxt-intro-q5',
      type: 'mcq',
      prompt: 'Which statements about Nuxt server routes are true? (Select all that apply.)',
      options: [
        { text: '`server/api/products.get.js` handles `GET /api/products`.' },
        { text: 'They run only on the server, so they can use private runtime config.' },
        { text: 'If route middleware protects the page, the server route doesn\'t need its own auth check.', why: 'Anyone can call the endpoint directly. Server routes must authenticate and authorize every request.' },
        { text: 'During SSR, `$fetch(\'/api/products\')` can call the handler directly without an HTTP round trip.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Server routes are your backend: method by suffix, private config available, in-process calls during SSR — and responsible for their own security.',
    },
    {
      id: 'nuxt-intro-q6',
      type: 'mcq',
      prompt: 'You want the marketing pages prerendered, the blog server-rendered, and the dashboard client-only, in one Nuxt app. What do you use?',
      options: [
        { text: 'Three separate Nuxt projects', why: 'Possible, but unnecessary: Nuxt supports per-route rendering.' },
        { text: '`routeRules` in `nuxt.config` (e.g. `prerender: true`, `ssr: false`)' },
        { text: '`definePageMeta({ ssr: false })` is the only option', why: 'Per-route rendering is configured with routeRules in nuxt.config.' },
        { text: 'It\'s impossible — Nuxt is all-SSR or all-SPA', why: 'Hybrid rendering is a core Nuxt feature.' },
      ],
      answer: 1,
      explanation: 'Hybrid rendering: `routeRules` map URL patterns to rendering and caching behaviour.',
    },
    {
      id: 'nuxt-intro-q7',
      type: 'short',
      prompt: 'In one or two sentences: what is the relationship between Vue and Nuxt?',
      answer: 'Nuxt is a framework built on top of Vue (and Vue Router, Vite and its own server engine, Nitro). You still write Vue components; Nuxt adds conventions and infrastructure — file-based routing, SSR/SSG, SSR-aware data fetching, layouts, middleware, server routes and deployment.',
    },
  ],

  exercises: [
    {
      id: 'payload-async-data',
      title: 'A simplified useAsyncData with payload reuse',
      difficulty: 'advanced',
      prompt: `
Build a **simplified model** of Nuxt's \`useAsyncData(key, handler)\` in \`useAsyncData.js\`. It returns \`{ data, status, error, refresh }\` (\`data\`, \`status\`, \`error\` are refs):

- If \`payload[key]\` exists (the server fetched it during SSR — see \`payload.js\`): set \`data\` to it and \`status\` to \`'success'\` **without calling \`handler\`**.
- Otherwise call \`handler()\` immediately: \`status\` is \`'pending'\` while waiting, then \`'success'\` with \`data\` set — or \`'error'\` with \`error\` set to the thrown error.
- Calls with the **same key** made while a request is in flight share it: \`handler\` runs once.
- \`refresh()\` runs \`handler\` again (ignoring the payload) and returns a promise that resolves when done.

\`App.vue\` shows product 1 (from the payload) in \`.first\` and product 2 (fetched) in \`.second\`.
`,
      files: { 'App.vue': asyncDataApp, 'useAsyncData.js': asyncDataStarter, 'payload.js': payloadJs, 'api.js': productApi },
      hints: [
        'Write an async `run()` that sets `status` to `\'pending\'`, awaits the handler, and sets `data`/`status` or `error`/`status`. Use it as `refresh`.',
        'At the end of `useAsyncData`: if `key in payload`, copy the value and mark success; else call `run()` (without awaiting — the refs update later).',
        'For dedupe, keep a module-level `Map` of key → promise; reuse the promise if present and delete it when it settles (`.finally`).',
      ],
      solution: {
        explanation: 'The payload check is the heart of SSR data fetching: data fetched on the server is serialised into the page, and the client reuses it instead of fetching again — which also guarantees the first client render matches the server. Dedupe by key avoids parallel duplicate requests. Real Nuxt keeps this state per app instance (and so per request on the server), plus caching, `transform`, `pick`, `lazy`, `server: false`, `watch` options and more.',
        files: { 'App.vue': asyncDataApp, 'useAsyncData.js': asyncDataSolution, 'payload.js': payloadJs, 'api.js': productApi },
      },
      tests: [
        {
          name: 'payload data is reused without calling the handler',
          code: `const { useAsyncData } = requireModule('useAsyncData.js')
let calls = 0
const r = useAsyncData('product-1', async () => { calls++; return { name: 'fresh' } })
expect(r.status.value).toBe('success')
expect(r.data.value.name).toBe('Trail Backpack')
expect(calls).toBe(0)`,
        },
        {
          name: 'missing data is fetched: pending, then success',
          code: `const { useAsyncData } = requireModule('useAsyncData.js')
const r = useAsyncData('product-7', () => new Promise((res) => setTimeout(() => res({ name: 'Lantern' }), 30)))
expect(r.status.value).toBe('pending')
await wait(60)
expect(r.status.value).toBe('success')
expect(r.data.value.name).toBe('Lantern')`,
        },
        {
          name: 'errors set status and error',
          code: `const { useAsyncData } = requireModule('useAsyncData.js')
const r = useAsyncData('broken', async () => { throw new Error('Product not found') })
await wait(20)
expect(r.status.value).toBe('error')
expect(r.error.value.message).toBe('Product not found')`,
        },
        {
          name: 'concurrent calls with the same key share one request',
          code: `const { useAsyncData } = requireModule('useAsyncData.js')
let calls = 0
const handler = () => new Promise((res) => { calls++; setTimeout(() => res({ n: calls }), 30) })
const a = useAsyncData('shared', handler)
const b = useAsyncData('shared', handler)
await wait(60)
expect(calls).toBe(1)
expect(a.data.value.n).toBe(1)
expect(b.data.value.n).toBe(1)`,
        },
        {
          name: 'refresh() fetches again, even for payload data',
          code: `const { useAsyncData } = requireModule('useAsyncData.js')
let calls = 0
const r = useAsyncData('product-1', async () => { calls++; return { name: 'Updated Backpack' } })
await r.refresh()
expect(calls).toBe(1)
expect(r.data.value.name).toBe('Updated Backpack')`,
        },
        {
          name: 'the page shows payload data at once and fetched data later',
          code: `expect(text('.first')).toBe('success · Trail Backpack')
await wait(80)
expect(text('.second')).toBe('success · Camp Stove')`,
        },
      ],
    },
    {
      id: 'server-route-search',
      title: 'A product search server route',
      difficulty: 'intermediate',
      prompt: `
Implement the handler in \`products.get.js\` — a **simplified model** of a Nuxt server route (\`server/api/products.get.js\` → \`GET /api/products\`). The helpers in \`nitro.js\` have the same shape as Nuxt's \`defineEventHandler\`, \`getQuery\` and \`createError\`.

- \`?q=\` filters products whose name contains the term, case-insensitive (missing or empty → all products).
- \`?limit=\` (default \`10\`) caps the number of items. It must be an integer from 1 to 50, otherwise **throw** \`createError({ statusCode: 400, statusMessage: 'limit must be between 1 and 50' })\`.
- Return \`{ total, items }\`: \`total\` is the number of matches **before** the limit; \`items\` contain only \`{ id, name, price }\` — the internal \`costPrice\` must never leave the server.

Tests call \`$fetch('/api/products?q=lamp&limit=2')\` from \`fetch.js\`.
`,
      files: {
        'App.vue': searchApp,
        'products.get.js': productsHandlerStarter,
        'nitro.js': nitroJs,
        'fetch.js': fetchJs,
        'server-routes.js': serverRoutesJs,
        'db.js': dbJs,
      },
      hints: [
        'Read the query with `const { q = \'\', limit = \'10\' } = getQuery(event)` — query values are strings.',
        'Validate first: `const max = Number(limit)`; throw if `!Number.isInteger(max) || max < 1 || max > 50`.',
        'Filter with `name.toLowerCase().includes(term)`, keep `total = matches.length`, then `matches.slice(0, max).map(({ id, name, price }) => ({ id, name, price }))`.',
      ],
      solution: {
        explanation: 'A server route is your backend: it validates untrusted input (query strings are strings, and anyone can call the URL), applies the business logic, and shapes the response so internal fields like `costPrice` never reach the browser. In real Nuxt the same handler would live in `server/api/products.get.js`, with the helpers auto-imported.',
        files: {
          'App.vue': searchApp,
          'products.get.js': productsHandlerSolution,
          'nitro.js': nitroJs,
          'fetch.js': fetchJs,
          'server-routes.js': serverRoutesJs,
          'db.js': dbJs,
        },
      },
      tests: [
        {
          name: 'filters by name, case-insensitive, and counts matches',
          code: `const { $fetch } = requireModule('fetch.js')
const r = await $fetch('/api/products?q=LAMP')
expect(r.total).toBe(2)
expect(r.items.map((p) => p.name)).toEqual(['Head Lamp', 'Desk Lamp'])`,
        },
        {
          name: 'no query returns all products (up to the default limit)',
          code: `const { $fetch } = requireModule('fetch.js')
const r = await $fetch('/api/products')
expect(r.total).toBe(7)
expect(r.items.length).toBe(7)`,
        },
        {
          name: 'limit caps items but not total',
          code: `const { $fetch } = requireModule('fetch.js')
const r = await $fetch('/api/products?limit=3')
expect(r.total).toBe(7)
expect(r.items.length).toBe(3)`,
        },
        {
          name: 'invalid limits are rejected with 400',
          code: `const { $fetch } = requireModule('fetch.js')
for (const bad of ['0', '51', 'abc', '2.5']) {
  let status = null
  try { await $fetch('/api/products?limit=' + bad) } catch (e) { status = e.statusCode }
  expect(status).toBe(400)
}`,
        },
        {
          name: 'internal fields never leave the server',
          code: `const { $fetch } = requireModule('fetch.js')
const r = await $fetch('/api/products?q=stove')
expect(r.items.length).toBe(1)
expect(Object.keys(r.items[0]).sort()).toEqual(['id', 'name', 'price'])`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'nuxt-intro-what-is-nuxt',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is Nuxt, and what does it add on top of Vue?',
      answer: 'Nuxt is a framework built on Vue, Vue Router, Vite and its server engine Nitro. You still write Vue components, but Nuxt adds conventions and infrastructure: file-based routing, SSR by default with SSG/SPA/hybrid options, SSR-aware data fetching (`useFetch`, `useAsyncData`), layouts, route middleware, auto-imports, SEO helpers, server routes for an API, runtime config for secrets, and deployment presets.',
      explanation: 'Vue is the UI library; Nuxt is the application framework around it.',
      whyAsked: 'Checks that you can separate Vue core from Nuxt features.',
      mistakes: ['Saying Nuxt is "a different version of Vue".', 'Attributing SSR itself to Nuxt (Vue core has SSR APIs).', 'Only mentioning SEO.'],
      followUps: ['When would you not use Nuxt?', 'How does Nuxt avoid double-fetching during hydration?'],
      modelAnswer: 'Nuxt is a full-stack framework on top of Vue. The components are still Vue, but Nuxt brings conventions that wire up everything around them: routes from the pages folder, server-side rendering by default with static or SPA modes per route, data fetching composables that transfer server data to the client, layouts, middleware, auto-imports, and a server directory for API routes, all running on its Nitro engine with presets for different hosts. Vue core provides the SSR primitives; Nuxt packages them into an app framework.',
    },
    {
      id: 'nuxt-intro-fetch-comparison',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `useFetch`, `useAsyncData` and `$fetch` in Nuxt. When do you use each?',
      answer: '`useFetch(url, opts)`: composable for render data from a URL — fetched during SSR, stored in the payload, reused during hydration, deduped by an auto-generated key, returns refs (`data`, `status`, `error`, `refresh`). `useAsyncData(key, fn)`: same mechanics for any async function (several calls, an SDK, a CMS client), with an explicit key. `$fetch`: a plain fetch helper (ofetch) for user-triggered actions (form submit, button click) and in server code; on its own it has no payload transfer, so using it in setup fetches twice.',
      explanation: '`useFetch` ≈ `useAsyncData(key, () => $fetch(url))`.',
      whyAsked: 'The most common Nuxt data-fetching mistake is mixing these up.',
      mistakes: ['Using $fetch in setup for render data.', 'Using useFetch inside event handlers.', 'Reusing the same useAsyncData key for different data.'],
      followUps: ['What are lazy variants for?', 'How would you fetch only on the client?'],
      modelAnswer: 'useFetch is for data a page needs to render from a URL: it runs during SSR, stores the result in the payload, and the client reuses it during hydration, returning refs for data, status, error and a refresh function. useAsyncData is the same mechanism for any async function, keyed explicitly — handy for SDKs or combining calls. $fetch is the plain request helper I use in event handlers and server code; in setup it would fetch on the server and again in the browser. Under the hood useFetch is essentially useAsyncData wrapping $fetch.',
    },
    {
      id: 'nuxt-intro-runtime-config',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you handle secrets and environment-specific settings in Nuxt?',
      answer: 'With `runtimeConfig` in `nuxt.config`: top-level keys are private and available only on the server (`useRuntimeConfig(event)` in server routes); keys under `runtimeConfig.public` are exposed to the client. Values can be overridden at runtime with environment variables following the `NUXT_` convention (e.g. `NUXT_API_SECRET`, `NUXT_PUBLIC_API_BASE`), so one build can run in several environments. Secrets are used in server routes; the client calls those routes.',
      explanation: 'Runtime config gives Nuxt apps a server-side place for secrets that a static SPA doesn\'t have.',
      whyAsked: 'Secret leakage is a common Nuxt/Vite mistake.',
      mistakes: ['Putting secrets under public.', 'Using VITE_ variables for secrets.', 'Reading private config in components and expecting it on the client.'],
      followUps: ['What happens to runtimeConfig.public in the HTML?', 'How is this different from import.meta.env?'],
      modelAnswer: 'I put configuration in runtimeConfig. Private keys at the top level are only available on the server, so secrets live there and are used inside server routes via useRuntimeConfig. Anything under public is serialised to the client, so only safe values go there. Both can be overridden by NUXT_ environment variables at runtime, which lets one build run in staging and production. The browser never gets the secret — it calls my server route, which uses it.',
    },
    {
      id: 'nuxt-intro-middleware-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A teammate protected `/admin` with a global route middleware that checks `user.value.isAdmin`. The admin pages call `server/api/admin/*` endpoints. Is the app secure?',
      answer: 'Not yet. Route middleware only controls navigation within the app (on the server for the first request, in the browser afterwards). The `server/api/admin/*` endpoints can be called directly with any HTTP client. Each handler must read the session server-side (e.g. from a cookie) and verify admin permissions, returning 401/403 otherwise. Keep the middleware for UX.',
      explanation: 'Same principle as Vue Router guards — Nuxt doesn\'t change it.',
      whyAsked: 'Checks that security instincts carry over from SPAs to Nuxt.',
      mistakes: ['"Middleware runs on the server, so it\'s secure."', 'Hiding the endpoints instead of protecting them.'],
      followUps: ['Where would you put a reusable `requireAdmin(event)` helper?', 'How do you read the session in a server route?'],
      modelAnswer: 'Not on its own. Middleware decides which page renders — even when it runs on the server for the first request, it doesn\'t protect the API, which anyone can call directly. Every admin server route should load the session from the request, check the admin permission and return 401 or 403 otherwise; a shared requireAdmin helper in the server utils keeps that consistent. The middleware stays as a nice redirect for users.',
    },
    {
      id: 'nuxt-intro-double-fetch-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'In a Nuxt page, the product list flickers on load and the API is hit twice. The page uses `const products = ref([]); products.value = await $fetch(\'/api/products\')` in `<script setup>`. Explain and fix.',
      answer: 'Setup runs during SSR and again during hydration. `$fetch` has no payload transfer, so the server fetches and renders, then the client fetches again (the second request), and if results differ the DOM changes (flicker) or mismatches. Fix: `const { data: products } = await useFetch(\'/api/products\')` — the server result is serialised and reused during hydration.',
      explanation: 'Render data belongs in useFetch/useAsyncData.',
      whyAsked: 'A frequent real bug in Nuxt codebases.',
      mistakes: ['Wrapping it in onMounted (that loses SSR content).', 'Blaming caching.'],
      followUps: ['When is onMounted + $fetch acceptable?', 'What does the `lazy` option change?'],
      modelAnswer: 'Because script setup runs on the server and again while hydrating, the $fetch call happens twice: once to render the HTML and once in the browser, with no hand-off between them. That\'s the second request, and any difference causes flicker or a mismatch. Switching to useFetch fixes it: the server result goes into the payload and the client reuses it. I\'d keep $fetch for user actions, or for client-only data where SSR content isn\'t needed.',
    },
    {
      id: 'nuxt-intro-deployment',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'What deployment options does a Nuxt app have, and how would you choose for (a) a docs site, (b) a storefront, (c) a SaaS app with a public marketing site and a private dashboard?',
      answer: 'Options: a Node server running the Nitro output; serverless or edge functions via Nitro presets for various hosts; fully static output with `nuxi generate`; and hybrid via `routeRules` (prerender some routes, SSR others, `ssr: false` for SPA sections, caching rules where supported). (a) Static generation on a CDN. (b) SSR (Node/serverless/edge) with caching for public pages, prerendered landing pages. (c) Hybrid: prerender marketing, `ssr: false` (or SSR) for the dashboard behind login, server routes for the API, deployed with a preset matching the host.',
      explanation: 'Nitro decouples the app from the hosting target.',
      whyAsked: 'Senior candidates should reason about hosting cost, performance and operations.',
      mistakes: ['Assuming Nuxt always needs a Node server.', 'SSR for everything.', 'Ignoring where the API and secrets live.'],
      followUps: ['What breaks if you statically generate a page that needs per-user data?', 'How would you cache SSR responses?'],
      modelAnswer: 'Nuxt\'s Nitro engine can target a Node server, serverless or edge platforms through presets, or produce fully static files with generate, and routeRules let one app mix those per route. For a docs site I\'d generate statically and serve from a CDN. For a storefront I\'d server-render with caching for public pages and prerender landing pages. For the SaaS I\'d go hybrid: prerendered marketing, a client-rendered dashboard behind login, and server routes for the API, deployed with the preset for our host.',
    },
    {
      id: 'nuxt-intro-coding-file-routes',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement `fileToRoute(file)` in `fileToRoute.js`, converting Nuxt-style page paths into Vue Router paths: `pages/index.vue` → `/`, `pages/about.vue` → `/about`, `pages/blog/index.vue` → `/blog`, `pages/products/[id].vue` → `/products/:id`, `pages/[[lang]]/about.vue` → `/:lang?/about`, `pages/[...slug].vue` → `/:slug(.*)*`.',
      starter: { files: { 'fileToRoute.js': routeStarter, 'App.vue': routeApp } },
      tests: [
        { name: 'index files map to their folder', code: `const { fileToRoute } = requireModule('fileToRoute.js')\nexpect(fileToRoute('pages/index.vue')).toBe('/')\nexpect(fileToRoute('pages/blog/index.vue')).toBe('/blog')` },
        { name: 'static pages', code: `const { fileToRoute } = requireModule('fileToRoute.js')\nexpect(fileToRoute('pages/about.vue')).toBe('/about')\nexpect(fileToRoute('pages/account/orders.vue')).toBe('/account/orders')` },
        { name: 'dynamic params', code: `const { fileToRoute } = requireModule('fileToRoute.js')\nexpect(fileToRoute('pages/products/[id].vue')).toBe('/products/:id')\nexpect(fileToRoute('pages/users/[userId]/posts/[postId].vue')).toBe('/users/:userId/posts/:postId')` },
        { name: 'optional params', code: `const { fileToRoute } = requireModule('fileToRoute.js')\nexpect(fileToRoute('pages/[[lang]]/about.vue')).toBe('/:lang?/about')` },
        { name: 'catch-all', code: `const { fileToRoute } = requireModule('fileToRoute.js')\nexpect(fileToRoute('pages/[...slug].vue')).toBe('/:slug(.*)*')\nexpect(fileToRoute('pages/docs/[...path].vue')).toBe('/docs/:path(.*)*')` },
      ],
      hints: [
        'Strip the `pages` prefix and `.vue` suffix first, then remove a trailing `/index`.',
        'Handle the most specific bracket forms first: `[...name]`, then `[[name]]`, then `[name]` — otherwise `[name]` would eat parts of the others.',
        'Regexes: `/\\[\\.\\.\\.(\\w+)\\]/g` → `\':$1(.*)*\'`, `/\\[\\[(\\w+)\\]\\]/g` → `\':$1?\'`, `/\\[(\\w+)\\]/g` → `\':$1\'`. Return `\'/\'` if the result is empty.',
      ],
      answer: 'Strip prefix/suffix, drop a trailing /index, replace catch-all, optional and required bracket params in that order, and fall back to "/" for the root.',
      solution: { files: { 'fileToRoute.js': routeSolution, 'App.vue': routeApp } },
      explanation: 'Order matters: the catch-all and optional patterns contain brackets too, so they must be converted before the plain `[name]` rule. This is a simplified model — real Nuxt also handles nested route files, route groups, mixed segments like `[id]-[slug]`, and generates route names and types.',
      whyAsked: 'Tests regex/string handling and understanding of how file-based routing maps onto Vue Router.',
      mistakes: ['Replacing `[name]` first, breaking `[...slug]`.', 'Turning `pages/blog/index.vue` into `/blog/index`.', 'Returning an empty string for the root.'],
      followUps: ['How would you generate route names?', 'How would nested routes (`account.vue` + `account/`) work?'],
      modelAnswer: 'I strip the pages prefix and .vue extension, then remove a trailing /index so index files map to their folder. Next I convert brackets from the most specific to the least: catch-all [...name] to :name(.*)*, optional [[name]] to :name?, and finally [name] to :name — in that order, because the general rule would otherwise match parts of the others. If nothing is left, it\'s the root path. Real Nuxt does more, like nested routes and names, but this is the core mapping.',
    },
  ],

  takeaways: [
    'Nuxt = Vue + conventions + infrastructure: file-based routing, rendering modes, data fetching, layouts, middleware, server routes, deployment.',
    'A file in `pages/` is a route; `[id]`, `[[id]]` and `[...slug]` map to required, optional and catch-all params.',
    '`useFetch`/`useAsyncData` fetch during SSR and reuse the payload during hydration; `$fetch` is for user actions and server code.',
    'Route middleware is navigation UX — server routes must authorize every request.',
    'Secrets go in private `runtimeConfig` and are used in `server/` routes; only `runtimeConfig.public` reaches the browser.',
    'Nitro deploys the same app to Node, serverless, edge or static hosting, and `routeRules` mixes rendering per route.',
  ],
}
