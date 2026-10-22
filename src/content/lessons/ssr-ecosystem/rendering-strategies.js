// Lesson: CSR, SSR & SSG (Level 17 — SSR & the Vue Ecosystem)

const productsJs = `// Our pretend database. Editing it simulates someone updating the catalogue.
export const db = {
  products: [
    { id: 1, name: 'Trail Backpack', price: 89 },
    { id: 2, name: 'Camp Stove', price: 45 },
  ],
}

export function findProduct(id) {
  return db.products.find((p) => p.id === id)
}`

const renderJs = `// SIMPLIFIED stand-in for Vue's renderToString(): build an HTML string for one
// product page, escaping every piece of data that goes into it.
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ENTITIES[ch])
}

export function renderProductPage(product, extraHtml = '') {
  return (
    '<html><head><title>' + escapeHtml(product.name) + ' · Acme</title></head><body>' +
    '<div id="app">' +
    '<h1>' + escapeHtml(product.name) + '</h1>' +
    extraHtml +
    '</div>' +
    '<script type="module" src="/assets/app.js"></script>' +
    '</body></html>'
  )
}

// What a crawler that does NOT run JavaScript can read in the body.
export function visibleText(html) {
  return html
    .replace(/<head>[\\s\\S]*?<\\/head>/g, ' ')
    .replace(/<script[\\s\\S]*?<\\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim()
}`

const serverJs = `// A pretend web server, running in the browser so we can poke at it.
import { db, findProduct } from './products.js'
import { renderProductPage } from './render.js'

const SHELL =
  '<html><head><title>Acme</title></head><body>' +
  '<div id="app"></div>' +
  '<script type="module" src="/assets/app.js"></script>' +
  '</body></html>'

// CSR: every URL gets the same empty shell. The browser renders later.
export function csr(id) {
  return { html: SHELL, renderedAt: 'in the browser, after the JavaScript loads' }
}

// SSR: render on every request, with today's data.
export function ssr(id) {
  return { html: renderProductPage(findProduct(id)), renderedAt: 'on the server, for this request' }
}

// SSG: render every page once, at build time, and serve the saved files.
let staticPages = new Map()

export function build() {
  staticPages = new Map(db.products.map((p) => [p.id, renderProductPage(p)]))
}

export function ssg(id) {
  return { html: staticPages.get(id) ?? '<h1>404</h1>', renderedAt: 'at build time' }
}

build() // "npm run build" happened when we deployed`

const appVue = `<script setup>
import { ref, computed } from 'vue'
import { csr, ssr, ssg } from './server.js'
import { visibleText } from './render.js'
import { db } from './products.js'

const strategy = ref('csr')
const productId = ref(1)
const response = ref(null)

const servers = { csr, ssr, ssg }

function requestPage() {
  response.value = servers[strategy.value](productId.value)
}

function editProduct() {
  db.products[0].name = 'Trail Backpack 2.0' // an editor updates the catalogue
}

const crawlerText = computed(() => (response.value ? visibleText(response.value.html) : ''))
</script>

<template>
  <h2>What does the browser receive?</h2>

  <fieldset>
    <label><input v-model="strategy" class="strategy-csr" type="radio" value="csr" /> CSR</label>
    <label><input v-model="strategy" class="strategy-ssr" type="radio" value="ssr" /> SSR</label>
    <label><input v-model="strategy" class="strategy-ssg" type="radio" value="ssg" /> SSG</label>
  </fieldset>

  <select v-model.number="productId" class="product">
    <option :value="1">Product 1</option>
    <option :value="2">Product 2</option>
  </select>
  <button class="request" @click="requestPage">Request page</button>
  <button class="edit" @click="editProduct">Editor: rename product 1</button>

  <template v-if="response">
    <p class="rendered-at">Rendered {{ response.renderedAt }}</p>
    <pre class="html">{{ response.html }}</pre>
    <p>A crawler that doesn't run JavaScript reads:</p>
    <p class="crawler">{{ crawlerText || '(nothing at all)' }}</p>
  </template>
</template>`

// ---------- exercise 1: a tiny renderToString
const tinyStarter = `// SIMPLIFIED renderToString for a tiny "virtual DOM":
//   a string                      -> a text node
//   { tag, props?, children? }    -> an element
const VOID = ['img', 'br', 'input', 'hr', 'meta', 'link']

export function renderToString(node) {
  return ''
}`

const tinySolution = `const VOID = ['img', 'br', 'input', 'hr', 'meta', 'link']
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escape = (value) => String(value).replace(/[&<>"']/g, (ch) => ENTITIES[ch])

export function renderToString(node) {
  if (typeof node === 'string' || typeof node === 'number') return escape(node)

  const { tag, props = {}, children = [] } = node
  let attrs = ''
  for (const [name, value] of Object.entries(props)) {
    if (value === false || value == null) continue          // skip falsy attributes
    attrs += value === true ? ' ' + name : ' ' + name + '="' + escape(value) + '"'
  }
  if (VOID.includes(tag)) return '<' + tag + attrs + '>'
  return '<' + tag + attrs + '>' + children.map(renderToString).join('') + '</' + tag + '>'
}`

const tinyApp = `<script setup>
import { renderToString } from './renderToString.js'

const tree = {
  tag: 'article',
  props: { class: 'card' },
  children: [
    { tag: 'h2', children: ['Trail <Backpack>'] },
    { tag: 'img', props: { src: '/pack.jpg', alt: 'A "big" pack' } },
    { tag: 'button', props: { disabled: true }, children: ['Sold out'] },
  ],
}

const html = renderToString(tree)
</script>

<template>
  <pre class="output">{{ html }}</pre>
</template>`

// ---------- exercise 2: cross-request state pollution
const pollutionStoreStarter = `import { reactive } from 'vue'

// One cart object for the whole server process…
export const cart = reactive({ owner: '', items: [] })`

const pollutionServerStarter = `import { cart } from './store.js'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function loadCart(user) {
  await wait(user.delay) // pretend database call
  return user.items
}

// Called once per incoming request (simulated).
export async function handleRequest(user) {
  cart.owner = user.name
  cart.items = await loadCart(user)
  return '<h1>' + cart.owner + "'s cart</h1><p>Items: " + cart.items.length + '</p>'
}`

const pollutionStoreSolution = `import { reactive } from 'vue'

// A factory: every request gets its own, fresh state.
export function createStore() {
  return reactive({ owner: '', items: [] })
}`

const pollutionServerSolution = `import { createStore } from './store.js'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function loadCart(user) {
  await wait(user.delay) // pretend database call
  return user.items
}

// Called once per incoming request (simulated).
export async function handleRequest(user) {
  const cart = createStore() // per-request state, never shared
  cart.owner = user.name
  cart.items = await loadCart(user)
  return '<h1>' + cart.owner + "'s cart</h1><p>Items: " + cart.items.length + '</p>'
}`

const pollutionApp = `<script setup>
import { ref } from 'vue'
import { handleRequest } from './server.js'

const results = ref([])

async function simulate() {
  // Two people hit the server at almost the same time.
  results.value = await Promise.all([
    handleRequest({ name: 'Ada', items: ['tent', 'stove', 'lamp'], delay: 120 }),
    handleRequest({ name: 'Bea', items: ['mug'], delay: 20 }),
  ])
}
</script>

<template>
  <button class="simulate" @click="simulate">Simulate two simultaneous requests</button>
  <pre v-for="(html, i) in results" :key="i" class="result">{{ html }}</pre>
</template>`

export default {
  id: 'rendering-strategies',
  title: 'CSR, SSR & SSG',
  summary: 'Compare the three ways a Vue page can be turned into HTML — in the browser, on the server per request, or ahead of time at build — and learn what each one costs and buys you.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['create-app-mount', 'fetching-data', 'production-readiness'],
  related: ['hydration', 'nuxt-intro', 'spa-or-nuxt', 'measuring-performance', 'xss-safe-rendering', 'bundle-optimization'],
  tags: ['ssr', 'server-side rendering', 'csr', 'client-side rendering', 'ssg', 'static site generation', 'prerendering', 'seo', 'createSSRApp', 'renderToString', 'universal code', 'ttfb'],
  apis: [
    { name: 'createSSRApp()', summary: 'Creates an app instance in SSR mode — used on the server to render, and in the browser to hydrate server HTML.' },
    { name: 'renderToString()', summary: 'From `vue/server-renderer`: renders an app to an HTML string on the server (returns a Promise).' },
    { name: 'onServerPrefetch()', summary: 'Registers an async function that the server awaits before rendering a component (SSR data fetching).' },
  ],
  docs: [
    { label: 'Vue Guide — Server-Side Rendering (SSR)', url: 'https://vuejs.org/guide/scaling-up/ssr.html' },
    { label: 'API — Server-side rendering', url: 'https://vuejs.org/api/ssr.html' },
    { label: 'Vite — Server-side rendering', url: 'https://vite.dev/guide/ssr' },
    { label: 'Nuxt — Rendering modes', url: 'https://nuxt.com/docs/guide/concepts/rendering' },
  ],

  intro: `
Every web page the user sees is HTML in the end. The question is **who turns your Vue components into that HTML, and when**:

- **CSR — client-side rendering.** The server sends an almost empty page plus your JavaScript; the **browser** runs Vue and builds the page. This is what a standard Vite + Vue app does.
- **SSR — server-side rendering.** A **server** runs your Vue app for each request and sends finished HTML. The browser shows it immediately, then loads the JavaScript and makes it interactive (*hydration* — [next lesson](lesson:hydration)).
- **SSG — static site generation** (prerendering). Your app is rendered **at build time** into HTML files, one per page, served from a CDN like any static file.

Same components, three delivery strategies — with different trade-offs for speed, SEO, freshness, cost and complexity.
`,

  why: `
A client-rendered app's first response looks like this:

\`\`\`html
<div id="app"></div>
<script type="module" src="/assets/index-3f2a9c.js"></script>
\`\`\`

Until that script downloads, parses, runs and (usually) fetches data, the user stares at a blank page — longer on a cheap phone or a slow network. And a link-preview bot or crawler that doesn't run JavaScript sees no content at all.

For a logged-in dashboard, that's fine: users come back daily, the JavaScript is cached, and search engines shouldn't index it anyway. For a **news article, product page or documentation site**, content in the very first response matters: people arrive from search and social links, often on mobile, and judge you in seconds.

SSR and SSG put the content into the HTML. But they move work somewhere else — to a server on every request, or to a build step — and that has its own costs. Knowing the trade-offs lets you pick per page instead of by fashion.
`,

  eli15: `
Think about getting a birthday cake.

- **CSR** is a **cake kit** delivered to your door: flour, eggs, instructions. Delivery is quick and cheap, but you have to bake it yourself before you can eat. (The browser gets JavaScript and builds the page.)
- **SSR** is a **bakery that bakes your cake when you order**. It arrives ready to eat, decorated with *your* name — but the bakery needs ovens and staff for every single order. (The server renders each request.)
- **SSG** is a **shop shelf of cakes baked this morning**. Instant, cheap, perfect — unless you wanted a name on it, or the recipe changed at noon. Then you wait for tomorrow's batch. (Pages are built ahead of time.)

All three give you cake. Which one is best depends on how hungry you are, how personal it must be, and how often the recipe changes.
`,

  analogy: {
    title: 'Three ways to get a cake',
    body: `
The ingredients and recipe (your Vue components) are the same in every case. What changes is **where** and **when** the baking happens — in your kitchen, at the bakery per order, or in a batch before the shop opens.
`,
    mapping: [
      ['cake kit + baking at home', 'CSR: JavaScript bundle, rendered in the browser'],
      ['bakery bakes per order', 'SSR: the server renders HTML for each request'],
      ['shelf of pre-baked cakes', 'SSG: HTML files generated at build time'],
      ['your name on the cake', 'personalised content (only CSR or SSR can do it per user)'],
      ['recipe changed at noon', 'content updates — SSG pages are stale until the next build'],
      ['ovens and staff', 'server cost and operational complexity of SSR'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'When does the user see content?',
    caption: 'Three timelines for the same page. Look at the second column: with SSR and SSG the content is already in the HTML.',
    alt: 'A three-row timeline. CSR row: empty shell HTML, download JavaScript, fetch data and render, then content and interactivity. SSR row: server renders HTML per request, content visible, download JavaScript, hydrated and interactive. SSG row: prebuilt HTML from a CDN, content visible, download JavaScript, hydrated.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'c1', label: 'Empty shell', note: 'CSR · blank screen', tone: 'paper', x: 100, y: 60 },
        { id: 'c2', label: 'Download JS', tone: 'paper', x: 280, y: 60 },
        { id: 'c3', label: 'Fetch data + render', tone: 'paper', x: 460, y: 60 },
        { id: 'c4', label: 'Content + interactive', tone: 'acid', x: 650, y: 60 },
        { id: 's1', label: 'Server renders', note: 'SSR · per request', tone: 'cobalt', x: 100, y: 160 },
        { id: 's2', label: 'Content visible', tone: 'acid', x: 280, y: 160 },
        { id: 's3', label: 'Download JS', tone: 'paper', x: 460, y: 160 },
        { id: 's4', label: 'Hydrated', note: 'now interactive', tone: 'acid', x: 650, y: 160 },
        { id: 'g1', label: 'Prebuilt HTML', note: 'SSG · from CDN', tone: 'kraft', x: 100, y: 260 },
        { id: 'g2', label: 'Content visible', tone: 'acid', x: 280, y: 260 },
        { id: 'g3', label: 'Download JS', tone: 'paper', x: 460, y: 260 },
        { id: 'g4', label: 'Hydrated', note: 'now interactive', tone: 'acid', x: 650, y: 260 },
      ],
      edges: [
        { from: 'c1', to: 'c2' }, { from: 'c2', to: 'c3' }, { from: 'c3', to: 'c4' },
        { from: 's1', to: 's2' }, { from: 's2', to: 's3' }, { from: 's3', to: 's4' },
        { from: 'g1', to: 'g2' }, { from: 'g2', to: 'g3' }, { from: 'g3', to: 'g4' },
      ],
      steps: [
        { focus: ['c1', 'c2', 'c3', 'c4'], edges: ['c1->c2', 'c2->c3', 'c3->c4'], text: '**CSR.** The response is a shell. Content appears only after the JavaScript has downloaded and run — and often after a second round-trip for data. Very simple to host (static files only).' },
        { focus: ['s1', 's2'], edges: ['s1->s2'], text: '**SSR.** The server runs your Vue app for this request, fetches data, and sends finished HTML. The user sees content as soon as the HTML arrives — but the server must do this work for every request.' },
        { focus: ['s3', 's4'], edges: ['s2->s3', 's3->s4'], text: 'The page *looks* ready but buttons don\'t work yet. The browser still downloads the JavaScript, then Vue **hydrates**: it attaches to the existing HTML instead of re-creating it.' },
        { focus: ['g1', 'g2', 'g3', 'g4'], edges: ['g1->g2', 'g2->g3', 'g3->g4'], text: '**SSG.** The HTML was rendered during the build and sits on a CDN, so delivery is as fast and cheap as any static file. Hydration works like SSR. The catch: content is as fresh as the last build.' },
        { focus: ['c1', 's2', 'g2'], text: 'Compare the second column: SSR and SSG show content before the JavaScript arrives; CSR doesn\'t. Interactivity still waits for JavaScript in all three — server rendering is not a substitute for a lean bundle.' },
      ],
    },
  },

  animation: {
    type: 'comparison',
    title: 'Vue core SSR in two files',
    caption: 'The server renders with `renderToString`; the browser hydrates with `createSSRApp().mount()`. Frameworks like Nuxt wrap exactly these APIs.',
    alt: 'Side by side code. Left: a Node server imports createSSRApp from vue and renderToString from vue/server-renderer, renders the app to an HTML string and sends a full page. Right: the client entry creates the same app with createSSRApp and mounts it on #app, which hydrates the existing HTML.',
    props: {
      left: {
        label: 'server.js (Node)',
        lang: 'js',
        code: `import express from 'express'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.js'

const server = express()

server.get('/', async (req, res) => {
  const app = createSSRApp(App)       // a fresh app per request
  const html = await renderToString(app)
  res.send(\`<!doctype html>
<html><body>
  <div id="app">\${html}</div>
  <script type="module" src="/client.js"></script>
</body></html>\`)
})

server.listen(3000)`,
      },
      right: {
        label: 'client.js (browser)',
        lang: 'js',
        code: `import { createSSRApp } from 'vue'
import App from './App.js'

// Same component, SSR mode: mount() finds the
// server HTML inside #app and HYDRATES it —
// attaching listeners and state to existing DOM
// instead of rendering from scratch.
createSSRApp(App).mount('#app')`,
      },
      points: [
        '`createSSRApp` and `renderToString` are Vue core APIs — no framework needed (simplified example; a real setup also bundles client and server code with a tool such as Vite).',
        'The server creates a new app per request, so users never share state.',
        'The client must render exactly the same HTML, or Vue reports a hydration mismatch.',
        'Nuxt automates this setup: bundling, routing, data fetching and serialising state to the client.',
      ],
    },
  },

  syntax: [
    `
#### Vue core: the two SSR entry points

SSR in Vue is built from two core APIs. They are separate from Nuxt — Nuxt *uses* them.
`,
    {
      code: `// on the server (Node, Bun, Deno, edge runtimes…)
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

const app = createSSRApp(App)
const html = await renderToString(app)   // '<div><h1>Trail Backpack</h1>…</div>'

// in the browser
import { createSSRApp } from 'vue'
createSSRApp(App).mount('#app')          // hydrates the existing HTML`,
      lang: 'js',
      title: 'Vue core SSR API (static example)',
      static: true,
    },
    `
\`vue/server-renderer\` also offers streaming variants (\`renderToNodeStream\`, \`pipeToNodeWritable\`, \`renderToWebStream\`, …) that send HTML in chunks as it's produced.

#### Universal code: one codebase, two environments

With SSR, your components run **on the server first, then in the browser**. On the server:

- there is **no \`window\`, \`document\` or \`localStorage\`** — touching them at the top of \`setup()\` crashes the render;
- \`onMounted\`, \`onUpdated\` and \`onUnmounted\` **don't run** (nothing is mounted) — they are safe places for browser-only code;
- reactivity is mostly irrelevant: the server renders once and sends a string;
- module-level state is **shared by every request** the server process handles.
`,
    {
      code: `<script setup>
import { ref, onMounted, onServerPrefetch } from 'vue'

const product = ref(null)
const width = ref(0)

// Server: awaited before rendering. Client: skip it if the data came with the HTML.
onServerPrefetch(async () => {
  product.value = await fetchProduct(42)
})

// Browser only — never runs during SSR.
onMounted(() => {
  width.value = window.innerWidth
})
</script>`,
      lang: 'vue',
      title: 'server-safe and browser-only code (static example)',
      static: true,
    },
    {
      callout: 'warn',
      title: 'Cross-request state pollution',
      text: 'A store or `reactive()` object created at module level lives as long as the server process — every user\'s request would read and write the same object. In SSR, create the app, router and store **per request** (a factory function). Pinia and Nuxt are designed for this; hand-written singletons are not.',
    },
    `
#### Choosing per page

- Public, mostly static content (docs, blog, marketing): **SSG** (rebuild on change).
- Public content that changes often or is per-request (search results, prices, stock): **SSR**, with caching where possible.
- Logged-in, highly interactive app (dashboards, editors): **CSR** is usually enough.
- Mixed sites: frameworks such as Nuxt let you choose **per route** (hybrid rendering).
`,
  ],

  walkthrough: {
    title: 'server.js',
    lang: 'js',
    code: serverJs,
    intro: 'A pretend server with all three strategies side by side. It runs in the browser for the playground, but the logic mirrors a real deployment.',
    steps: [
      { lines: [2, 3], text: 'The server can read the database and render pages — two things a browser-only app can\'t do before its JavaScript arrives.' },
      { lines: [5, 9], text: 'The CSR shell: identical for every URL. All the knowledge about the page lives in `/assets/app.js`.' },
      { lines: [12, 14], text: '**CSR**: return the shell. Fast and cacheable, but the content isn\'t in the HTML.' },
      { lines: [17, 19], text: '**SSR**: look up the product and render it *now*, for this request. Always fresh, but it costs server work on every request.' },
      { lines: [21, 26], text: '**SSG**: `build()` renders every page once and keeps the results — like writing HTML files to `dist/` during `npm run build`.' },
      { lines: [28, 30], text: 'Serving a static page is just a lookup. If the catalogue changed after the build, visitors get the old version until you rebuild.' },
      { lines: [32], text: 'The deploy ran the build once. Try renaming the product in the playground and requesting the SSG page.' },
    ],
  },

  playground: {
    title: 'What does the browser receive?',
    objective: 'Request the same product page with CSR, SSR and SSG, compare the HTML and what a crawler can read, then add freshness and personalisation.',
    files: {
      'App.vue': appVue,
      'server.js': serverJs,
      'render.js': renderJs,
      'products.js': productsJs,
    },
    expected: 'Pick a strategy and press **Request page**. CSR returns an empty `<div id="app"></div>` and the crawler line says "(nothing at all)". SSR and SSG return HTML with the product name. Press **Editor: rename product 1**, then compare SSR (new name) with SSG (old name).',
    experiments: [
      {
        id: 'add-price',
        task: 'Product pages should show the price. In `render.js`, add `<p class="price">€89</p>` (using the product\'s real price, escaped) right after the `<h1>`.',
        hint: 'Add `\'<p class="price">€\' + escapeHtml(product.price) + \'</p>\' +` after the `<h1>` line in `renderProductPage`.',
        tests: [
          {
            name: 'rendered pages include the price, visible to crawlers',
            code: `const { renderProductPage, visibleText } = requireModule('render.js')
const html = renderProductPage({ name: 'Enamel Mug', price: 12 })
expect(html).toContain('€12')
expect(visibleText(html)).toContain('€12')`,
          },
        ],
        explain: 'SSR and SSG both use the same render function — change it once, and both strategies deliver the price in the HTML. CSR still shows nothing until JavaScript runs.',
      },
      {
        id: 'crawler',
        task: 'Request product 2 with each strategy and read the **crawler** line. Which strategies would a link-preview bot that doesn\'t execute JavaScript be able to describe?',
        hint: 'Switch the radio buttons and press Request page each time.',
        explain: 'Only SSR and SSG put content in the HTML. Some crawlers do execute JavaScript (Google renders pages, possibly later), but social previews and many bots read only the raw response.',
      },
      {
        id: 'rebuild',
        task: 'SSG pages go stale. Add a **Rebuild site** button with `class="rebuild"` to `App.vue` that calls `build()` from `server.js`, so an edited product shows up in SSG responses.',
        hint: 'Import `build` alongside `csr, ssr, ssg`, then add `<button class="rebuild" @click="build">Rebuild site</button>`.',
        tests: [
          {
            name: 'after an edit and a rebuild, SSG serves the new name',
            code: `await click('.edit')
await click('.rebuild')
await check('.strategy-ssg', true)
await click('.request')
expect(text('.html')).toContain('Trail Backpack 2.0')`,
          },
        ],
        explain: 'Real SSG sites rebuild on content changes (a CMS webhook triggers a deploy) or regenerate pages periodically if the framework and host support it. Freshness becomes a pipeline question instead of a per-request cost.',
      },
      {
        id: 'personalise',
        task: 'SSR can personalise per request. Change `ssr(id, user)` in `server.js` so that when a `user` is passed, the page includes `<p class="greeting">Hi, NAME</p>` — escaped! Hint: `renderProductPage` already accepts extra HTML as a second argument.',
        hint: 'Import `escapeHtml` from `./render.js`, then: `const greeting = user ? \'<p class="greeting">Hi, \' + escapeHtml(user.name) + \'</p>\' : \'\'` and pass it to `renderProductPage(findProduct(id), greeting)`.',
        tests: [
          {
            name: 'logged-in requests get a greeting, anonymous ones don\'t',
            code: `const { ssr } = requireModule('server.js')
expect(ssr(1, { name: 'Bea' }).html).toContain('Hi, Bea')
expect(ssr(1).html).not.toContain('Hi,')`,
          },
          {
            name: 'the user name is escaped',
            code: `const { ssr } = requireModule('server.js')
const html = ssr(1, { name: '<b>Eve</b>' }).html
expect(html).toContain('&lt;b&gt;Eve&lt;/b&gt;')
expect(html).not.toContain('<b>Eve</b>')`,
          },
        ],
        explain: 'Per-user HTML is SSR\'s superpower and its caching headache: a personalised page must never be stored in a shared CDN cache, or the next visitor sees "Hi, Bea". And because SSR builds strings, every value must be escaped — Vue\'s real `renderToString` does that for interpolations automatically.',
      },
    ],
  },

  internals: {
    beginner: `
In CSR, Vue creates real DOM elements in the browser. In SSR, there is no browser and no DOM on the server — so Vue walks the same component tree and **writes text**: \`<h1>\`, the escaped title, \`</h1>\`, and so on. The browser receives that text as a normal HTML page. Then the same components run again in the browser to take over the page.
`,
    technical: [
      `
**Compiled differently for the server.** Vue's template compiler has an SSR mode: instead of producing a render function that builds virtual DOM nodes, it produces code that pushes strings into a buffer (static parts become plain string chunks, which makes server rendering efficient). \`renderToString(app)\` runs \`setup()\` for each component, awaits async work such as \`onServerPrefetch\` and async \`setup\`, and concatenates the output. Interpolations are HTML-escaped; \`v-html\` is inserted raw — the same rules as in the browser.

**Lifecycle on the server.** Only setup (and \`beforeCreate\`/\`created\` in the Options API) and \`serverPrefetch\` run. Mount, update and unmount hooks never run, and reactive effects aren't kept alive after rendering. That's why browser-only code belongs in \`onMounted\`.

**Getting data to the client.** If the server fetched data to render, the client needs the same data to hydrate without fetching again (and without rendering something different). SSR setups serialise state into the page — for example a JSON payload in a script tag — and restore it before mounting. Nuxt's \`useFetch\`/\`useAsyncData\` and Pinia's SSR support do this for you.
`,
      {
        code: `// Simplified: what an SSR setup does around renderToString
const app = createSSRApp(App)
const pinia = createPinia()
app.use(pinia)

const html = await renderToString(app)
const state = JSON.stringify(pinia.state.value)   // must be escaped safely for HTML!

res.send(\`<div id="app">\${html}</div>
<script>window.__STATE__ = \${serializeSafely(state)}</script>\`)`,
        lang: 'js',
        title: 'state serialisation (simplified, static example)',
      },
      `
**Per-request isolation.** A Node server handles many requests in one long-running process. Anything at module scope — a \`reactive()\` store, a cache, a router — is shared across users unless you create it per request. Vue's docs call this *cross-request state pollution* and recommend creating the app, router and stores inside a function called for every request.
`,
    ],
    production: `
- **Pick per page, not per project.** Hybrid rendering (SSG for marketing/docs, SSR for dynamic public pages, CSR for the app behind login) is common and well supported by meta-frameworks.
- **SSR needs a runtime.** Node or an edge/serverless platform, with monitoring, scaling and timeouts. A slow API call now delays the HTML for every visitor — set timeouts and fallbacks, and consider streaming.
- **Cache what you can.** Non-personalised SSR pages can be cached at the CDN for a short time; personalised responses must be marked private. SSG is the ultimate cache.
- **Server rendering doesn't fix a heavy bundle.** Content appears sooner, but the page isn't interactive until JavaScript loads and hydrates — keep code-splitting and bundle size under control ([bundle optimization](lesson:bundle-optimization)).
- **Measure.** Compare real-user metrics (Largest Contentful Paint, Interaction to Next Paint) before and after; don't assume ([measuring performance](lesson:measuring-performance)).
- **Security carries over.** Server-rendered HTML is still built from untrusted data — escaping matters, and serialised state must be escaped safely before being inlined in a script tag ([XSS](lesson:xss-safe-rendering)).
`,
  },

  mistakes: [
    {
      title: 'Touching browser APIs during server rendering',
      wrong: { code: `<script setup>\nconst theme = ref(localStorage.getItem('theme') ?? 'light') // ReferenceError on the server\n</script>`, lang: 'vue' },
      right: { code: `<script setup>\nconst theme = ref('light')\nonMounted(() => {\n  theme.value = localStorage.getItem('theme') ?? 'light'\n})\n</script>`, lang: 'vue' },
      explanation: 'There is no `window`, `document` or `localStorage` on the server. Read browser-only values in `onMounted` (which never runs on the server) — and keep the initial render identical on both sides, as the [hydration lesson](lesson:hydration) explains.',
    },
    {
      title: 'Module-level state on an SSR server',
      wrong: { code: `// store.js\nexport const cart = reactive({ items: [] }) // shared by every request!`, lang: 'js' },
      right: { code: `// store.js\nexport function createCart() {\n  return reactive({ items: [] }) // one per request\n}`, lang: 'js' },
      explanation: 'The server process lives for many requests. A module-level object is shared by all of them, so users can see each other\'s data. Create state per request (Pinia + Nuxt do this for you).',
    },
    {
      title: 'Choosing SSR "for performance" without measuring',
      wrong: { code: `// "SSR is faster" → every page server-rendered, including the logged-in dashboard`, lang: 'js' },
      right: { code: `// Public, SEO-relevant pages: SSG/SSR\n// Dashboard behind login: CSR (cached JS, no SEO needs)\n// Decide with real metrics`, lang: 'js' },
      explanation: 'SSR can show content sooner, but adds server latency, cost and complexity, and doesn\'t make the page interactive sooner. Use it where content-in-HTML matters.',
    },
    {
      title: 'Caching personalised SSR pages publicly',
      wrong: { code: `Cache-Control: public, max-age=300   # on a page that says "Hi, Bea"`, lang: 'text' },
      right: { code: `Cache-Control: private, no-store     # personalised\nCache-Control: public, max-age=60    # same HTML for everyone`, lang: 'text' },
      explanation: 'A shared cache stores one copy for everyone. Personalised or session-dependent HTML must not be stored there.',
    },
  ],

  debugging: [
    {
      symptom: '`ReferenceError: window is not defined` (or `document`, `localStorage`) when the server renders.',
      cause: 'Browser-only code runs during `setup()` or at module level, which also executes on the server.',
      fix: 'Move it into `onMounted`, guard library imports so they only load in the browser, or (in Nuxt) use client-only components.',
    },
    {
      symptom: 'Users occasionally see another user\'s name or cart after moving to SSR.',
      cause: 'Cross-request state pollution: a store, cache or reactive object created at module scope is shared across requests.',
      fix: 'Create app, router and stores per request. Search for module-level `reactive()`, `ref()` and singletons in code that runs on the server.',
    },
    {
      symptom: 'The SSG site shows outdated prices hours after an update.',
      cause: 'Static pages only change when the site is rebuilt.',
      fix: 'Trigger a rebuild from your CMS on content changes, use SSR or periodic regeneration for fast-changing pages, or fetch the volatile part (price, stock) on the client.',
    },
    {
      symptom: 'Time to first byte got worse after switching to SSR.',
      cause: 'The server now waits for data and rendering before sending anything; one slow API call delays the whole page.',
      fix: 'Add timeouts and caching for upstream calls, cache non-personalised HTML, consider streaming, and keep slow, non-critical data client-side.',
    },
  ],

  bestPractices: [
    'Decide per page: SSG for stable public content, SSR for dynamic public content, CSR for authenticated apps.',
    'Write universal code: no browser APIs during setup; browser-only work in `onMounted`.',
    'Create app, router and store instances per request on the server.',
    'Transfer server-fetched state to the client so hydration doesn\'t refetch or render differently.',
    'Cache non-personalised SSR output; never cache personalised HTML in shared caches.',
    'Keep bundles lean anyway: hydration still needs the JavaScript.',
    'Prefer a framework (Nuxt) over hand-rolled SSR unless you have a specific reason.',
  ],

  useCases: [
    'Documentation, blogs and marketing pages: SSG, rebuilt on content changes.',
    'E-commerce product and category pages: SSR (or SSG + client-side price/stock) for SEO and previews.',
    'News sites with breaking updates: SSR with short CDN caching.',
    'Admin dashboards, internal tools, editors behind login: CSR.',
    'Mixed products: hybrid rendering with per-route rules.',
  ],

  whenToUse: {
    use: [
      'SSR/SSG when content must be in the first HTML response: SEO, social previews, fast first content on slow devices.',
      'SSG when pages are the same for everyone and change rarely.',
      'CSR when the app lives behind a login, is highly interactive, and doesn\'t need indexing.',
    ],
    avoid: [
      'SSR just because it sounds faster — it adds servers, latency and universal-code constraints.',
      'SSG for per-user or rapidly changing content.',
      'Pure CSR for pages whose business depends on search traffic and link previews.',
    ],
  },

  comparison: {
    title: 'CSR vs SSR vs SSG',
    headers: ['', 'CSR', 'SSR', 'SSG'],
    rows: [
      ['HTML rendered', 'in the browser', 'on the server, per request', 'at build time'],
      ['First response contains content?', 'no (empty shell)', 'yes', 'yes'],
      ['Personalised per user?', 'yes (after JS + data)', 'yes', 'no (same files for everyone)'],
      ['Freshness', 'live (client fetches)', 'live per request', 'as of the last build'],
      ['Hosting', 'static files / CDN', 'a server or serverless/edge runtime', 'static files / CDN'],
      ['Main costs', 'blank first paint, SEO/preview limits', 'server cost, latency, universal-code rules', 'rebuilds, build time for many pages'],
      ['Typical use', 'dashboards, apps behind login', 'dynamic public pages', 'docs, blogs, marketing'],
    ],
    note: 'Server-rendered pages need one more step in the browser: [hydration](lesson:hydration).',
  },

  quiz: [
    {
      id: 'rendering-strategies-q1',
      type: 'mcq',
      prompt: 'A documentation site changes a few times a week and must rank well in search. Which strategy fits best?',
      options: [
        { text: 'CSR', why: 'The HTML response would be an empty shell; you\'d rely on crawlers executing JavaScript and pay a blank first paint.' },
        { text: 'SSG, rebuilding when docs change' },
        { text: 'SSR on every request', why: 'It works, but you\'d pay server rendering for every visit to pages that are identical for everyone and rarely change.' },
        { text: 'It doesn\'t matter for SEO', why: 'Content in the initial HTML is the most reliable way to be indexed and previewed.' },
      ],
      answer: 1,
      explanation: 'Same content for everyone, infrequent changes, SEO matters: prebuild the pages and serve them from a CDN. Rebuild on change.',
    },
    {
      id: 'rendering-strategies-q2',
      type: 'output',
      prompt: 'This component is rendered on the **server** with `renderToString`. What is in the resulting HTML?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, onMounted } from 'vue'

const status = ref('loading')
onMounted(() => {
  status.value = 'ready'
})
</script>

<template>
  <p>{{ status }}</p>
</template>`,
      },
      options: [
        { text: '`<p>ready</p>`', why: '`onMounted` never runs on the server — nothing is mounted there.' },
        { text: '`<p>loading</p>`' },
        { text: '`<p></p>`', why: 'The initial value of the ref is rendered normally.' },
        { text: 'An error: refs are not allowed in SSR', why: 'Refs work fine during SSR; the server renders their current values once.' },
      ],
      answer: 1,
      explanation: 'The server runs setup and renders once. Mount hooks only run in the browser, after hydration — where `status` will then become `ready`.',
    },
    {
      id: 'rendering-strategies-q3',
      type: 'bug',
      prompt: 'This code runs fine in a CSR app but crashes the SSR server. Click the line that crashes.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, computed, onMounted } from 'vue'

const items = ref([])
const isWide = ref(window.innerWidth > 800)
const count = computed(() => items.value.length)

onMounted(async () => {
  items.value = await fetch('/api/items').then((r) => r.json())
})
</script>`,
      },
      answerLine: 5,
      explanation: 'Line 5 reads `window` during setup, which also runs on the server where `window` doesn\'t exist. Start with a neutral value and read the width in `onMounted` (line 8 is fine — mount hooks only run in the browser).',
    },
    {
      id: 'rendering-strategies-q4',
      type: 'fill',
      prompt: 'Complete the Vue core SSR imports.',
      code: {
        lang: 'js',
        code: `import { ___ } from 'vue'
import { renderToString } from 'vue/___'

const app = createSSRApp(App)
const html = await renderToString(app)`,
      },
      answer: [['createSSRApp'], ['server-renderer']],
      explanation: '`createSSRApp` comes from `vue`; `renderToString` lives in `vue/server-renderer`. Both are Vue core — no framework required.',
    },
    {
      id: 'rendering-strategies-q5',
      type: 'mcq',
      prompt: 'After switching to SSR, users sometimes see someone else\'s cart. The cart lives in `export const cart = reactive({ … })` in `store.js`. Why?',
      options: [
        { text: 'The server process reuses that one module-level object for every request.' },
        { text: 'Hydration copies carts between browsers', why: 'Hydration happens inside one browser; it can\'t move data between users.' },
        { text: 'reactive() doesn\'t work on the server', why: 'It works — that\'s the problem: the same reactive object is shared by all requests.' },
        { text: 'The CDN mixes up cookies', why: 'Possible with bad caching, but the described code has a more direct cause: shared module state.' },
      ],
      answer: 0,
      explanation: 'Cross-request state pollution. Create stores per request (a factory), which is what Pinia + SSR integrations and Nuxt do.',
    },
    {
      id: 'rendering-strategies-q6',
      type: 'mcq',
      prompt: 'Which statement about SSR is true?',
      options: [
        { text: 'The page is interactive as soon as the HTML arrives.', why: 'Event listeners are attached during hydration, after the JavaScript loads.' },
        { text: 'SSR can show content earlier than CSR, but interactivity still depends on loading and running the JavaScript.' },
        { text: 'SSR removes the need for a JavaScript bundle.', why: 'Hydration needs the same components in the browser.' },
        { text: 'SSR always reduces server costs.', why: 'It adds server work per request compared with serving static files.' },
      ],
      answer: 1,
      explanation: 'SSR improves when content appears, not when the page becomes interactive. Bundle size still matters.',
    },
    {
      id: 'rendering-strategies-q7',
      type: 'short',
      prompt: 'Explain in two or three sentences why SSG pages can be stale and how teams deal with it.',
      answer: 'SSG renders pages once at build time, so they show the data as it was during the build until the site is rebuilt. Teams trigger rebuilds when content changes (e.g. a CMS webhook), use periodic regeneration where the framework/host supports it, or fetch the fast-changing parts (prices, stock) on the client — and use SSR for pages that must always be fresh.',
    },
  ],

  exercises: [
    {
      id: 'tiny-render-to-string',
      title: 'Write a tiny renderToString',
      difficulty: 'advanced',
      prompt: `
Build a **simplified** \`renderToString(node)\` in \`renderToString.js\` for a tiny virtual DOM — the core idea behind SSR:

- A **string** (or number) is a text node: return it **HTML-escaped** (\`&\`, \`<\`, \`>\`, \`"\`, \`'\`).
- An **object** \`{ tag, props?, children? }\` is an element: \`<tag attrs>children</tag>\`.
  - Each prop becomes \` name="value"\` with the value escaped.
  - A prop that is \`true\` becomes a bare attribute (\` disabled\`); \`false\`, \`null\` and \`undefined\` props are skipped.
  - Void elements (\`img\`, \`br\`, \`input\`, \`hr\`, \`meta\`, \`link\`) have no closing tag and no children: \`<img src="/a.jpg">\`.
  - Children are rendered recursively and concatenated.

\`App.vue\` shows the output for a sample tree in \`<pre class="output">\`.
`,
      files: { 'App.vue': tinyApp, 'renderToString.js': tinyStarter },
      hints: [
        'Start with the base case: `if (typeof node === \'string\' || typeof node === \'number\') return escape(node)`.',
        'For elements, build an `attrs` string by looping over `Object.entries(props)`, skipping falsy values and treating `true` as a bare attribute.',
        'Return early for void tags; otherwise `\'<\' + tag + attrs + \'>\' + children.map(renderToString).join(\'\') + \'</\' + tag + \'>\'`.',
      ],
      solution: {
        explanation: 'This is SSR in miniature: walk a tree, write strings, escape every piece of data. Vue\'s real server renderer does the same for component trees (plus components, slots, async data and many optimisations) — and, like this function, it escapes interpolated text and attribute values automatically.',
        files: { 'App.vue': tinyApp, 'renderToString.js': tinySolution },
      },
      tests: [
        { name: 'text is escaped', code: `const { renderToString } = requireModule('renderToString.js')\nexpect(renderToString('Tom & <Jerry>')).toBe('Tom &amp; &lt;Jerry&gt;')` },
        { name: 'elements render with children', code: `const { renderToString } = requireModule('renderToString.js')\nexpect(renderToString({ tag: 'p', children: ['Hi ', { tag: 'b', children: ['there'] }] })).toBe('<p>Hi <b>there</b></p>')` },
        { name: 'attribute values are escaped', code: `const { renderToString } = requireModule('renderToString.js')\nexpect(renderToString({ tag: 'img', props: { alt: 'A "big" pack', src: '/p.jpg' } })).toBe('<img alt="A &quot;big&quot; pack" src="/p.jpg">')` },
        { name: 'boolean props: true is bare, false is skipped', code: `const { renderToString } = requireModule('renderToString.js')\nexpect(renderToString({ tag: 'button', props: { disabled: true, hidden: false }, children: ['Go'] })).toBe('<button disabled>Go</button>')` },
        { name: 'elements without props or children work', code: `const { renderToString } = requireModule('renderToString.js')\nexpect(renderToString({ tag: 'div' })).toBe('<div></div>')\nexpect(renderToString({ tag: 'br' })).toBe('<br>')` },
        { name: 'the sample card renders safely', code: `expect(text('.output')).toContain('<h2>Trail &lt;Backpack&gt;</h2>')` },
      ],
    },
    {
      id: 'request-isolation',
      title: 'Stop users seeing each other\'s carts',
      difficulty: 'advanced',
      prompt: `
This simulates an SSR server handling two **overlapping** requests. Because \`store.js\` exports one module-level \`cart\`, Ada's page comes out as "Bea's cart". Fix the cross-request state pollution:

- \`store.js\` must export a factory \`createStore()\` that returns a **new** \`reactive({ owner: '', items: [] })\` on every call.
- \`handleRequest(user)\` in \`server.js\` must create its own store per request and return \`<h1>NAME's cart</h1><p>Items: N</p>\` for **that** user.

Press **Simulate** to see the results in \`<pre class="result">\` elements.
`,
      files: { 'App.vue': pollutionApp, 'store.js': pollutionStoreStarter, 'server.js': pollutionServerStarter },
      hints: [
        'Replace the exported object with `export function createStore() { return reactive({ owner: \'\', items: [] }) }`.',
        'In `server.js`, import `createStore` instead of `cart`.',
        'Call `const cart = createStore()` as the first line of `handleRequest` — everything else can stay the same.',
      ],
      solution: {
        explanation: 'With a factory, each request owns its state, so the `await` in the middle of `handleRequest` can no longer let another request overwrite it. This is exactly why SSR guides tell you to create the app, router and stores inside a per-request function — and why Pinia integrates with SSR by creating a store instance per app.',
        files: { 'App.vue': pollutionApp, 'store.js': pollutionStoreSolution, 'server.js': pollutionServerSolution },
      },
      tests: [
        {
          name: 'createStore() returns a fresh object each time',
          code: `const { createStore } = requireModule('store.js')
expect(typeof createStore).toBe('function')
const a = createStore()
const b = createStore()
expect(a === b).toBe(false)
a.owner = 'Ada'
expect(b.owner).toBe('')`,
        },
        {
          name: 'overlapping requests render their own carts',
          code: `const { handleRequest } = requireModule('server.js')
const [ada, bea] = await Promise.all([
  handleRequest({ name: 'Ada', items: ['tent', 'stove', 'lamp'], delay: 120 }),
  handleRequest({ name: 'Bea', items: ['mug'], delay: 20 }),
])
expect(ada).toBe("<h1>Ada's cart</h1><p>Items: 3</p>")
expect(bea).toBe("<h1>Bea's cart</h1><p>Items: 1</p>")`,
        },
        {
          name: 'the Simulate button shows both correct results',
          code: `await click('.simulate')
await wait(200)
const results = findAll('.result').map((el) => el.textContent)
expect(results[0]).toContain("Ada's cart")
expect(results[1]).toContain("Bea's cart")`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'rendering-strategies-explain',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Explain CSR, SSR and SSG. What does the browser receive first in each case?',
      answer: 'CSR: the browser receives a nearly empty HTML shell plus JavaScript; Vue renders the page in the browser. SSR: a server renders the app per request and sends complete HTML; the browser shows it, then hydrates with the JavaScript. SSG: pages are rendered at build time into static HTML files served from a CDN; they hydrate like SSR pages but are only as fresh as the last build.',
      explanation: 'Same components; the difference is where and when HTML is produced.',
      whyAsked: 'Baseline knowledge for any discussion about SEO, performance or Nuxt.',
      mistakes: ['Saying SSR pages are interactive immediately.', 'Confusing SSG with caching SSR responses.', 'Forgetting hydration.'],
      followUps: ['What is hydration?', 'Which would you use for a dashboard behind login?'],
      modelAnswer: 'They differ in where and when the HTML is produced. With CSR the server sends an empty shell and the JavaScript renders everything in the browser. With SSR a server renders the HTML for each request, so content shows immediately, and then the client hydrates it to make it interactive. With SSG that rendering happens once at build time and the HTML files are served from a CDN, which is very fast and cheap but only as fresh as the last build. Many real sites mix them per route.',
    },
    {
      id: 'rendering-strategies-pick',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'For each, which rendering strategy would you choose and why: (a) a company blog, (b) an e-commerce category page with live stock, (c) an internal analytics dashboard?',
      answer: '(a) SSG — same for everyone, changes rarely, SEO matters; rebuild on publish. (b) SSR (with short CDN caching for non-personalised HTML), or SSG/ISR-style pages with stock and price fetched client-side — SEO matters and data changes often. (c) CSR — behind login, highly interactive, no SEO, users return often with cached assets.',
      explanation: 'Look at three axes: does content need to be in the HTML (SEO/previews), how personal is it, how often does it change.',
      whyAsked: 'Tests judgment rather than definitions.',
      mistakes: ['One strategy for everything.', 'SSR for the internal dashboard "for speed".', 'SSG for live stock without a freshness plan.'],
      followUps: ['How would you handle a "price changed" event on the SSG blog-like pages?', 'How would you cache (b)?'],
      modelAnswer: 'For the blog I\'d use static generation: the same pages for everyone, rarely changing, and search traffic matters, so I rebuild on publish. For the category page, SEO matters but stock changes constantly, so SSR with short CDN caching, or static pages with the volatile stock fetched on the client. The internal dashboard sits behind login, needs no indexing and is very interactive, so plain CSR is simplest. The decision is per page, driven by SEO needs, personalisation and freshness.',
    },
    {
      id: 'rendering-strategies-tradeoffs',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 5,
      question: 'What are the costs of SSR compared with a CSR SPA? When is it not worth it?',
      answer: 'Costs: a server or serverless runtime to operate and scale; per-request render time and upstream data latency in front of the first byte; universal-code constraints (no browser APIs in setup, per-request state, SSR-compatible libraries); hydration cost and mismatch bugs; more complex caching (personalised vs public); harder debugging across two environments. It\'s not worth it for authenticated apps without SEO needs, internal tools, or highly interactive apps where users return with cached assets.',
      explanation: 'SSR trades server complexity for content in the first response.',
      whyAsked: 'Senior engineers must weigh trade-offs instead of following trends.',
      mistakes: ['"SSR is always faster."', 'Ignoring operational cost.', 'Forgetting that interactivity still waits for JavaScript.'],
      followUps: ['How can streaming help?', 'What would you measure to decide?'],
      modelAnswer: 'SSR means running and scaling servers, and every request now pays for data fetching and rendering before the first byte. The code must be universal — no browser APIs during setup, state created per request, libraries that work on the server — and hydration adds its own cost and a class of mismatch bugs. Caching gets harder because personalised HTML can\'t go in shared caches. For apps behind login, internal tools or very interactive products, those costs usually outweigh the benefits; I\'d use it where content in the first response clearly pays off, and measure before and after.',
    },
    {
      id: 'rendering-strategies-pollution-debug',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'After migrating to SSR, support reports that users occasionally see another user\'s name in the header for a split second, or permanently. What do you look for?',
      answer: 'Cross-request state pollution: state created at module scope (a `reactive()` user store, a singleton API client holding a token, a cache keyed without the user) that the long-running server process shares between requests. Also check shared CDN caching of personalised HTML. Fix: create app/router/stores per request, pass request context explicitly, mark personalised responses `private`/`no-store`, and add a test that renders two users concurrently.',
      explanation: 'In the browser one module instance serves one user; on the server it serves everyone.',
      whyAsked: 'A notorious SSR bug that also has security implications.',
      mistakes: ['Blaming hydration.', 'Adding `nextTick` or delays.', 'Not checking caching headers.'],
      followUps: ['How does Pinia avoid this in SSR?', 'How would you write a regression test?'],
      modelAnswer: 'My first suspect is shared module-level state on the server. In the browser a module runs for one user, but a Node server process serves everyone, so a reactive user store or a singleton client holding a token leaks between requests, especially around awaits. I\'d search for module-scope reactive state and singletons in server-executed code, move them into a per-request factory, and pass request context explicitly. I\'d also verify that personalised pages aren\'t being stored in a shared CDN cache, and add a test that renders two users concurrently.',
    },
    {
      id: 'rendering-strategies-core-api',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Without a framework, which Vue APIs do you use for SSR, and where does each run?',
      answer: '`createSSRApp()` (from `vue`) creates the app in SSR mode on both sides. On the server, `renderToString()` (or a streaming variant) from `vue/server-renderer` renders it to HTML. In the browser, `createSSRApp(App).mount(\'#app\')` hydrates the server HTML instead of re-rendering. `onServerPrefetch()` lets components fetch data the server awaits before rendering. You also need a bundler setup for client and server builds (Vite has SSR support) and a way to serialise state — which is what Nuxt provides out of the box.',
      explanation: 'Vue core gives you the primitives; frameworks give you the plumbing.',
      whyAsked: 'Checks that you can separate Vue core from Nuxt and understand what a framework adds.',
      mistakes: ['Attributing SSR itself to Nuxt.', 'Using `createApp` on the client for hydration.', 'Not knowing `renderToString` returns a Promise.'],
      followUps: ['What happens if you use createApp instead of createSSRApp on the client?', 'What does Nuxt add on top?'],
      modelAnswer: 'Vue core has everything needed. createSSRApp from vue creates the app in SSR mode; on the server, renderToString from vue/server-renderer turns it into an HTML string — it\'s async, and there are streaming versions. In the browser I call createSSRApp with the same root component and mount it, which hydrates the existing markup. Components can use onServerPrefetch to load data the server waits for. Beyond that I need client and server builds and state serialisation, which is the plumbing Nuxt handles for me.',
    },
    {
      id: 'rendering-strategies-ttfb-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'A product page moves from CSR (static files on a CDN) to SSR. The server needs to call a product API before it can render. What typically happens to time to first byte (TTFB) and to when content first appears?',
      options: [
        'TTFB improves and content appears later',
        'TTFB can get worse, but content can appear sooner',
        'Both get worse',
        'Nothing changes; only SEO is affected',
      ],
      correctOption: 1,
      answer: 'TTFB can get worse: the server must fetch data and render before sending the first byte, whereas the CDN returned a static shell immediately. But the first response now contains the content, so the user typically sees it sooner than with CSR, which needed the JavaScript and a data request first.',
      explanation: 'SSR moves work before the first byte to save work after it.',
      whyAsked: 'Tests understanding of web performance metrics beyond "SSR = fast".',
      mistakes: ['Claiming SSR always improves every metric.', 'Ignoring upstream API latency.'],
      followUps: ['How could streaming or caching reduce TTFB?', 'Which real-user metric would you watch?'],
      modelAnswer: 'Time to first byte usually gets worse, because the server now waits on the product API and rendering before it can send anything, while the CDN could answer instantly with a shell. But that first response contains the product, so content usually appears sooner overall than CSR, which needed the bundle and a separate data request. I\'d mitigate the TTFB cost with caching, timeouts and possibly streaming, and confirm with real-user metrics like LCP.',
    },
    {
      id: 'rendering-strategies-coding-cache',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Implement `createPageCache(render, { ttl, now })` in `pageCache.js` for an SSR server. It returns `get(url, user)`: anonymous requests are cached per URL for `ttl` ms; requests with a `user` are always rendered fresh and **never** stored. `now` is a function returning the current time (so tests can control the clock).',
      starter: {
        files: {
          'pageCache.js': `export function createPageCache(render, { ttl = 60000, now = () => Date.now() } = {}) {
  return {
    get(url, user) {
      return render(url, user)
    },
  }
}`,
          'App.vue': `<script setup>
import { createPageCache } from './pageCache.js'

let renders = 0
const cache = createPageCache((url) => { renders++; return '<h1>' + url + '</h1>' })

cache.get('/products/1')
cache.get('/products/1')
</script>

<template>
  <p class="renders">Renders: {{ renders }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'anonymous requests are cached within the ttl',
          code: `const { createPageCache } = requireModule('pageCache.js')
let t = 0, calls = 0
const cache = createPageCache((url) => { calls++; return url + '#' + calls }, { ttl: 1000, now: () => t })
expect(cache.get('/a')).toBe('/a#1')
t = 500
expect(cache.get('/a')).toBe('/a#1')
expect(calls).toBe(1)`,
        },
        {
          name: 'entries expire after the ttl',
          code: `const { createPageCache } = requireModule('pageCache.js')
let t = 0, calls = 0
const cache = createPageCache((url) => { calls++; return url + '#' + calls }, { ttl: 1000, now: () => t })
cache.get('/a')
t = 1000
expect(cache.get('/a')).toBe('/a#2')`,
        },
        {
          name: 'different URLs are cached separately',
          code: `const { createPageCache } = requireModule('pageCache.js')
let calls = 0
const cache = createPageCache((url) => { calls++; return url }, { ttl: 1000, now: () => 0 })
cache.get('/a'); cache.get('/b'); cache.get('/a')
expect(calls).toBe(2)`,
        },
        {
          name: 'personalised requests are never cached or served from cache',
          code: `const { createPageCache } = requireModule('pageCache.js')
let calls = 0
const cache = createPageCache((url, user) => { calls++; return user ? 'Hi ' + user.name : 'anon' }, { ttl: 1000, now: () => 0 })
expect(cache.get('/a', { name: 'Bea' })).toBe('Hi Bea')
expect(cache.get('/a')).toBe('anon')
expect(cache.get('/a', { name: 'Ada' })).toBe('Hi Ada')
expect(cache.get('/a')).toBe('anon')
expect(calls).toBe(3)`,
        },
      ],
      hints: [
        'Keep a `Map` from URL to `{ html, expires }`.',
        'If `user` is present, return `render(url, user)` immediately — don\'t read or write the map.',
        'Otherwise, return the cached html when `now() < entry.expires`; else render, store `{ html, expires: now() + ttl }` and return it.',
      ],
      answer: 'Bypass the cache entirely for personalised requests; for anonymous ones keep a Map of url → { html, expires }, serve fresh entries, and re-render (and re-store) expired or missing ones.',
      solution: {
        files: {
          'pageCache.js': `export function createPageCache(render, { ttl = 60000, now = () => Date.now() } = {}) {
  const entries = new Map()

  return {
    get(url, user) {
      if (user) return render(url, user) // personalised: never shared

      const hit = entries.get(url)
      if (hit && now() < hit.expires) return hit.html

      const html = render(url)
      entries.set(url, { html, expires: now() + ttl })
      return html
    },
  }
}`,
          'App.vue': `<script setup>
import { createPageCache } from './pageCache.js'

let renders = 0
const cache = createPageCache((url) => { renders++; return '<h1>' + url + '</h1>' })

cache.get('/products/1')
cache.get('/products/1')
</script>

<template>
  <p class="renders">Renders: {{ renders }}</p>
</template>`,
        },
      },
      explanation: 'Caching rendered HTML is one of the main ways to keep SSR fast and cheap — but only for responses that are identical for everyone. Injecting the clock (`now`) makes time-based logic testable. A production cache would also bound its size, vary on relevant headers, and handle concurrent misses.',
      whyAsked: 'Combines SSR performance thinking with a classic correctness trap (caching personalised pages).',
      mistakes: ['Caching personalised responses.', 'Using `<=` vs `<` inconsistently for expiry.', 'Reading Date.now() directly, making tests impossible.'],
      followUps: ['How would you avoid rendering the same URL many times when it expires under load?', 'Where else could this cache live (CDN)?'],
      modelAnswer: 'I keep a Map from URL to the HTML and an expiry time. Personalised requests skip the cache entirely — they\'re rendered and returned without being stored. For anonymous requests I return a cached entry if it hasn\'t expired, otherwise I render, store the result with now plus ttl, and return it. Taking the clock as a parameter makes the expiry testable. In production I\'d also cap the size and coalesce concurrent misses so an expiring hot page isn\'t rendered many times at once.',
    },
  ],

  takeaways: [
    'CSR renders in the browser, SSR on a server per request, SSG at build time — same components, different delivery.',
    'SSR/SSG put content in the first HTML response (SEO, previews, faster first content); interactivity still waits for JavaScript and hydration.',
    'Vue core provides `createSSRApp` + `renderToString` (vue/server-renderer); Nuxt builds on them.',
    'Universal code: no browser APIs during setup, browser-only work in `onMounted`, per-request app/router/store.',
    'SSR costs servers, latency and complexity; SSG costs freshness. Pick per page and measure.',
    'Never cache personalised SSR output in shared caches, and keep escaping everything you render.',
  ],
}
