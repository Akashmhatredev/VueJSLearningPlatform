// Lesson: Client-side routing basics — createRouter, history modes, RouterLink & RouterView.

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'

createApp(App).use(router).mount('#app')`

const routerJs = `import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from './HomePage.vue'
import MenuPage from './MenuPage.vue'
import AboutPage from './AboutPage.vue'

// The route table: "for this path, show this component".
const routes = [
  { path: '/', component: HomePage },
  { path: '/menu', component: MenuPage },
  { path: '/about', component: AboutPage },
]

const router = createRouter({
  // The sandbox has no real address bar, so the URL lives in memory.
  // A real app would write createWebHistory() here.
  history: createMemoryHistory(),
  routes,
})

export default router`

const appVue = `<script setup>
import { useRoute } from 'vue-router'

// useRoute() gives us the *current* location, and it is reactive.
const route = useRoute()
</script>

<template>
  <header>
    <h1>Crumb &amp; Co. Bakery</h1>
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/menu">Menu</RouterLink>
      <RouterLink to="/about">About</RouterLink>
    </nav>
    <p class="url">Current URL: <code>{{ route.fullPath }}</code></p>
  </header>

  <main>
    <RouterView />
  </main>
</template>

<style>
nav { display: flex; gap: 8px; }
nav a { color: #333; text-decoration: none; padding: 4px 10px; border-radius: 6px; border: 1px solid #ddd; }
nav a.router-link-exact-active { background: #222; color: #fff; border-color: #222; }
.url { font-size: 13px; color: #666; }
main { border-top: 1px dashed #ccc; margin-top: 8px; padding-top: 8px; }
</style>`

const homeVue = `<template>
  <section class="home-page">
    <h2>Fresh bread, every morning</h2>
    <p>Click the links above. The URL changes and the page swaps — but nothing reloads.</p>
  </section>
</template>`

const menuVue = `<script setup>
const items = [
  { name: 'Sourdough loaf', price: 6 },
  { name: 'Cinnamon roll', price: 3 },
  { name: 'Almond croissant', price: 4 },
]
</script>

<template>
  <section class="menu-page">
    <h2>Today's menu</h2>
    <ul>
      <li v-for="item in items" :key="item.name">{{ item.name }} — \${{ item.price }}</li>
    </ul>
  </section>
</template>`

const aboutVue = `<template>
  <section class="about-page">
    <h2>About us</h2>
    <p>Two bakers, one very old oven, zero shortcuts.</p>
  </section>
</template>`

const contactVue = `<template>
  <section class="contact-page">
    <h2>Come say hi</h2>
    <p>12 Flour Street — open 7am to 2pm.</p>
  </section>
</template>`

// ---------- exercise 1: wire up a router
const ex1Pages = {
  'HomePage.vue': `<template>
  <h2 class="page-title">Hello, I build things</h2>
  <p>Welcome to my portfolio.</p>
</template>`,
  'ProjectsPage.vue': `<template>
  <h2 class="page-title">Projects</h2>
  <ul><li>Weather app</li><li>Recipe finder</li></ul>
</template>`,
  'ContactPage.vue': `<template>
  <h2 class="page-title">Contact</h2>
  <p>hello@example.com</p>
</template>`,
}

// ---------- exercise 2: checkout steps driven by the URL
const ex2Steps = {
  'CartStep.vue': `<template><h2 class="title">Your cart</h2></template>`,
  'ShippingStep.vue': `<template><h2 class="title">Shipping address</h2></template>`,
  'PaymentStep.vue': `<template><h2 class="title">Payment</h2></template>`,
}
const ex2Router = `import { createRouter, createMemoryHistory } from 'vue-router'
import CartStep from './CartStep.vue'
import ShippingStep from './ShippingStep.vue'
import PaymentStep from './PaymentStep.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: CartStep },
    { path: '/shipping', component: ShippingStep },
    { path: '/payment', component: PaymentStep },
  ],
})`

// ---------- interview coding question: docs tabs
const tabsPages = {
  'GuidePage.vue': `<template><p class="content">Start here: install, then build your first page.</p></template>`,
  'ApiPage.vue': `<template><p class="content">createRouter(options) — creates a router instance.</p></template>`,
}

export default {
  id: 'router-basics',
  title: 'Client-side routing basics',
  summary: 'Give a single-page app real URLs: map paths to components with Vue Router, link between them with RouterLink, and render the match with RouterView.',
  difficulty: 'beginner',
  minutes: 30,
  prerequisites: ['single-file-components', 'create-app-mount'],
  related: ['dynamic-routes', 'nested-named-routes', 'navigation-guards', 'lazy-routes-scroll', 'rendering-strategies'],
  tags: ['vue router', 'routing', 'spa', 'RouterLink', 'RouterView', 'createRouter', 'history mode', 'createWebHistory', 'hash mode', 'useRoute', 'useRouter'],
  apis: [
    { name: 'createRouter()', summary: 'Creates a router instance from a `history` implementation and a `routes` table.' },
    { name: 'createWebHistory()', summary: 'HTML5 History API mode: clean URLs like `/menu`. The server must fall back to `index.html` for unknown paths.' },
    { name: 'createWebHashHistory()', summary: 'Hash mode: URLs like `/#/menu`. Needs no server configuration; less suited to SEO.' },
    { name: 'createMemoryHistory()', summary: 'Keeps the URL in memory, not in the address bar. Used for SSR, tests and sandboxes.' },
    { name: '<RouterLink>', summary: 'Renders a real `<a href>` but navigates client-side, and marks itself active.' },
    { name: '<RouterView>', summary: 'Placeholder where the component matched by the current URL is rendered.' },
    { name: 'useRoute()', summary: 'The current, reactive route location (`path`, `params`, `query`, …).' },
    { name: 'useRouter()', summary: 'The router instance, for programmatic navigation (`push`, `replace`, `back`).' },
  ],
  docs: [
    { label: 'Vue Router — Getting Started', url: 'https://router.vuejs.org/guide/' },
    { label: 'Vue Router — Installation', url: 'https://router.vuejs.org/installation.html' },
    { label: 'Vue Router — Different History modes', url: 'https://router.vuejs.org/guide/essentials/history-mode.html' },
    { label: 'Vue Guide — Routing', url: 'https://vuejs.org/guide/scaling-up/routing.html' },
  ],

  intro: `
A **single-page app** (*SPA*) is a website that loads one HTML page once and then changes what's on screen with JavaScript. That's fast and smooth — but on its own it has a problem: the address bar never changes. Every "page" lives at the same URL.

**Client-side routing** fixes that. A *router* is a piece of code that connects URLs to screens: when the URL is \`/menu\`, show the menu component; when it's \`/about\`, show the about component — all without asking the server for a new page.

Vue's official router is **Vue Router**. You describe a table of *routes* (path → component), drop a \`<RouterView />\` where the page content should go, and use \`<RouterLink>\` instead of plain links. That's the whole core idea.
`,

  why: `
On a classic **multi-page site** (*MPA*), every click on a link asks the server for a brand-new HTML document. The browser throws away the current page — including everything in JavaScript memory, like a half-filled form or a music player — and draws the new one from scratch.

An SPA avoids that reload, but without a router you lose things users rely on:

- **Shareable URLs.** You can't send a friend a link to "the menu page" if every page is \`/\`.
- **The back button.** Users expect Back to go to the previous *screen*, not leave your site.
- **Refresh.** Reloading should bring you back to the same screen, not the home page.
- **Bookmarks and open-in-new-tab.**

A client-side router gives you both worlds: **real URLs** for every screen, and **no full page reload** when moving between them. The URL becomes part of your app's state — the router keeps it and the screen in sync.
`,

  eli15: `
Think of a shopping mall directory board. Each shop has a code — "B12 → Bakery", "C3 → Cinema". You don't rebuild the mall to visit another shop; you just walk to a different spot.

In a Vue app, the **URL is the shop code** and the **router is the directory board**. You write the board once:

\`\`\`js
{ path: '/menu', component: MenuPage }
\`\`\`

Then \`<RouterLink to="/menu">\` is a sign that says "walk to the menu". When you follow it, the router looks up \`/menu\` on the board and puts \`MenuPage\` into the \`<RouterView />\` — the empty "display window" you left on the page.

The header, footer and everything else stay where they are. Only the display window changes. And because the URL changed too, the browser's Back button and bookmarks just work.
`,

  analogy: {
    title: 'The TV and the remote',
    body: `
A TV has one screen but many channels. Pressing "7" on the remote doesn't buy you a new TV — it just tells the same screen to show something else. The channel number is visible, so you can tell a friend "it's on channel 7".

Vue Router works the same way. Your app is the TV; \`<RouterView />\` is the screen; the URL is the channel number; \`<RouterLink>\` and \`router.push()\` are the remote's buttons. A full page reload would be like unplugging the TV and buying it again every time you change channel — which is what classic multi-page sites do.
`,
    mapping: [
      ['the TV', 'your Vue app (header, nav, footer stay put)'],
      ['the screen', '`<RouterView />` — where the matched page renders'],
      ['the channel number', 'the URL path, e.g. `/menu`'],
      ['the channel list', 'the `routes` array in `createRouter()`'],
      ['the remote buttons', '`<RouterLink>` and `router.push()`'],
    ],
  },

  visual: {
    type: 'router',
    props: { preset: 'basics' },
    title: 'From URL to component',
    caption: 'Pick a URL and follow it through a real in-memory router: the path is matched against the route table and the matching component is rendered into `<RouterView />`.',
    alt: 'An interactive router diagram. A URL bar on the left feeds into a route table listing paths and components. The matching row lights up, and the corresponding component appears in a RouterView box on the right.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Multi-page click vs client-side navigation',
    caption: 'Step through what happens when the same "Menu" link is a plain link on a multi-page site versus a RouterLink in a Vue app.',
    alt: 'Two paths start from a user clicking Menu. The top path, for a plain link, goes to the server, receives a new HTML document and repaints the whole page, losing state. The bottom path, for a RouterLink, is intercepted by Vue Router, updates the URL with the History API, and swaps only the component inside RouterView.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'click', label: 'Click "Menu"', note: 'same link text', tone: 'ink', x: 90, y: 160 },
        { id: 'server', label: 'Ask the server', note: 'GET /menu', x: 290, y: 70 },
        { id: 'html', label: 'New HTML page', note: 'downloaded', x: 480, y: 70 },
        { id: 'reload', label: 'Repaint everything', note: 'JS state lost', tone: 'red', x: 670, y: 70 },
        { id: 'router', label: 'Router intercepts', note: 'preventDefault()', tone: 'acid', x: 290, y: 250 },
        { id: 'url', label: 'URL updated', note: 'History API', tone: 'cobalt', x: 480, y: 250 },
        { id: 'view', label: 'RouterView swaps', note: 'only the page part', tone: 'acid', x: 670, y: 250 },
      ],
      edges: [
        { from: 'click', to: 'server', label: 'plain <a>', dashed: true },
        { from: 'server', to: 'html' },
        { from: 'html', to: 'reload' },
        { from: 'click', to: 'router', label: 'RouterLink' },
        { from: 'router', to: 'url' },
        { from: 'url', to: 'view' },
      ],
      steps: [
        { focus: ['click'], text: 'The user clicks a link labelled **Menu**. What happens next depends on how the link was written.' },
        { focus: ['server', 'html'], edges: ['click->server', 'server->html'], text: 'With a plain `<a href="/menu">` on a **multi-page site**, the browser sends a request to the server and downloads a whole new HTML document.' },
        { focus: ['reload'], edges: ['html->reload'], text: 'The old page is thrown away and the new one is drawn from scratch. Anything held in JavaScript memory — a form draft, a playing video, a store — is gone.' },
        { focus: ['router'], edges: ['click->router'], text: 'With `<RouterLink to="/menu">`, Vue Router catches the click and calls `event.preventDefault()`, so the browser does **not** load a new page.' },
        { focus: ['url'], edges: ['router->url'], text: 'The router matches `/menu` against its route table and updates the address bar with the browser\'s **History API** (`history.pushState`). Back and Forward still work.' },
        { focus: ['view'], edges: ['url->view'], text: 'The current route is reactive, so `<RouterView />` re-renders with `MenuPage`. The header, nav and all other state stay exactly as they were.' },
      ],
    },
  },

  syntax: [
    `
**1. Install it.** In a project created with \`npm create vue@latest\` you can say "yes" to Vue Router and it's set up for you. Otherwise:
`,
    { code: 'npm install vue-router', lang: 'bash', title: 'terminal', static: true },
    `
**2. Create the router** with a *history* implementation and a *routes* table. Each route is an object with at least a \`path\` and a \`component\`:
`,
    {
      code: `// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import MenuPage from '../pages/MenuPage.vue'

const router = createRouter({
  history: createWebHistory(),   // clean URLs: /menu
  routes: [
    { path: '/', component: HomePage },
    { path: '/menu', component: MenuPage },
  ],
})

export default router`,
      lang: 'js',
      title: 'router/index.js (a real app)',
      static: true,
    },
    `
**3. Install it on the app** with \`app.use(router)\` *before* \`mount()\`. This registers \`<RouterLink>\` and \`<RouterView>\` globally, makes \`useRoute()\`/\`useRouter()\` (and \`$route\`/\`$router\` in templates) available, and starts the first navigation.
`,
    { code: mainJs, lang: 'js', title: 'main.js' },
    `
**4. Use the two components** in your root component:

- \`<RouterLink to="/menu">Menu</RouterLink>\` — renders a real \`<a href="/menu">\`, but navigates without a reload.
- \`<RouterView />\` — the spot where the matched page component appears.

**5. Read or change the location from code:**
`,
    {
      code: `import { useRoute, useRouter } from 'vue-router'

const route = useRoute()    // where are we? route.path, route.fullPath, route.query…
const router = useRouter()  // the remote control

function goToMenu() {
  router.push('/menu')      // navigate, like clicking a RouterLink
}`,
      lang: 'js',
      title: 'inside <script setup>',
    },
    `
#### Choosing a history mode

| mode | URL looks like | server setup | typical use |
|---|---|---|---|
| \`createWebHistory()\` | \`example.com/menu\` | must serve \`index.html\` for every unknown path | most production apps |
| \`createWebHashHistory()\` | \`example.com/#/menu\` | none — the server only ever sees \`/\` | static hosting you can't configure, internal tools |
| \`createMemoryHistory()\` | (no address bar) | n/a | server-side rendering, tests, sandboxes like this one |
`,
    {
      callout: 'warn',
      title: 'The refresh-404 gotcha',
      text: 'With `createWebHistory()`, refreshing `/menu` makes the browser ask the *server* for `/menu`. If the server only knows about `index.html`, it answers 404. Configure your server (or host) to fall back to `index.html` for unknown paths, then let the router show its own 404 page — see [dynamic routes & 404s](lesson:dynamic-routes).',
    },
    {
      callout: 'version',
      text: 'Vue Router 4 was the first major version for Vue 3. This platform runs Vue Router 5, which keeps the `createRouter` / `createWebHistory` / `RouterLink` / `RouterView` API taught here. Vue Router 3 is the Vue 2 version and uses `new VueRouter({ mode: "history" })` — you will only see that in legacy code.',
    },
  ],

  walkthrough: {
    title: 'router.js',
    lang: 'js',
    code: routerJs,
    intro: 'The router file is the heart of the app: a table of routes plus a history mode. Step through it.',
    steps: [
      { lines: [1], text: '`createRouter` builds the router; `createMemoryHistory` decides where the URL is stored. Both come from the `vue-router` package, not from Vue core.' },
      { lines: [2, 4], text: 'Page components are ordinary `.vue` components. Nothing about them is special — a route just decides *when* each one is shown.' },
      { lines: [6, 11], text: 'The **routes table**. Each record pairs a `path` with a `component`. The router compares the current URL with these paths to find the match.' },
      { lines: [13, 18], text: '`createRouter()` takes the history implementation and the routes. Memory history keeps the URL in JavaScript because the sandbox has no address bar — in a real browser app you\'d use `createWebHistory()`.' },
      { lines: [20], text: 'We export the router so `main.js` can install it with `app.use(router)` (and so tests can drive it with `router.push()`).' },
    ],
  },

  playground: {
    title: 'A bakery site with three pages',
    objective: 'Click around, then add a page, a button that navigates from code, a custom active class and a Back button.',
    files: {
      'main.js': mainJs,
      'router.js': routerJs,
      'App.vue': appVue,
      'HomePage.vue': homeVue,
      'MenuPage.vue': menuVue,
      'AboutPage.vue': aboutVue,
      'ContactPage.vue': contactVue,
    },
    entry: 'main.js',
    expected: 'A bakery header with three links. Clicking a link swaps the content below the dashed line, updates **Current URL** and highlights the active link — the header never re-renders from scratch. `ContactPage.vue` exists but nothing shows it yet.',
    experiments: [
      {
        id: 'contact-route',
        task: '`ContactPage.vue` is already written, but no route points to it. Add a `/contact` route in `router.js` and a **Contact** `RouterLink` in the nav.',
        hint: 'Import `ContactPage` in `router.js`, add `{ path: \'/contact\', component: ContactPage }` to `routes`, then add `<RouterLink to="/contact">Contact</RouterLink>` to the `<nav>`.',
        tests: [
          {
            name: 'a Contact link shows the contact page',
            code: `const link = findAll('nav a').find((a) => /contact/i.test(a.textContent))
expect(link).toBeTruthy()
await click(link)
expect(text('.url')).toContain('/contact')
expect(exists('main .contact-page')).toBe(true)`,
          },
        ],
        explain: 'A page appears in two places: the route table (so the router knows what to render for a path) and a link (so users can get there). Forget the route and the link leads nowhere; forget the link and the page is only reachable by typing the URL.',
      },
      {
        id: 'order-button',
        task: 'On **HomePage**, add an **Order now** `<button>` that takes the user to `/menu` using `useRouter().push()`.',
        hint: 'In `HomePage.vue` add `<script setup>` with `import { useRouter } from \'vue-router\'`, `const router = useRouter()`, and `@click="router.push(\'/menu\')"` on the button.',
        tests: [
          {
            name: 'clicking Order now navigates to /menu',
            code: `const btn = findAll('main button').find((b) => /order/i.test(b.textContent))
expect(btn).toBeTruthy()
await click(btn)
expect(text('.url')).toContain('/menu')
expect(exists('main .menu-page')).toBe(true)`,
          },
        ],
        explain: '`router.push()` is *programmatic navigation* — the same thing a RouterLink does, triggered from code. Use RouterLink for things that are links (they get an `href`, open in new tabs, are announced as links) and `push()` for navigation that happens after an action, like a button press or a form submit.',
      },
      {
        id: 'active-class',
        task: 'Make the router use the class **`is-active`** (instead of `router-link-exact-active`) for the link of the current page, and update the CSS selector to match.',
        hint: 'Add `linkExactActiveClass: \'is-active\'` next to `history` and `routes` in `createRouter({ … })`. Then change the CSS selector to `nav a.is-active`.',
        tests: [
          {
            name: 'the Menu link gets the is-active class after clicking it',
            code: `const link = findAll('nav a').find((a) => /menu/i.test(a.textContent))
await click(link)
expect(classes(link)).toContain('is-active')`,
          },
        ],
        explain: 'RouterLink adds `router-link-active` when its target is part of the current route, and `router-link-exact-active` when it *is* the current route. You can rename them globally (`linkActiveClass`, `linkExactActiveClass`) or per link (`active-class`, `exact-active-class` props) to match a CSS framework. It also sets `aria-current="page"` on the exact match for screen readers.',
      },
      {
        id: 'back-button',
        task: 'Add a **Back** button to the header in `App.vue` that goes to the previous page in history, like the browser\'s Back button.',
        hint: 'In `App.vue`, get the router with `useRouter()` and call `router.back()` on click.',
        tests: [
          {
            name: 'Back returns to the previous page',
            code: `const router = requireModule('router.js').default
await router.push('/about')
await flush()
const btn = findAll('button').find((b) => /back/i.test(b.textContent))
expect(btn).toBeTruthy()
await click(btn)
await flush()
expect(router.currentRoute.value.fullPath).toBe('/')`,
          },
        ],
        explain: '`router.back()` is `router.go(-1)`: it moves through the history stack the router manages. With web history that is the real browser history; here it is the in-memory stack. Careful in real apps: if the user arrived from another site, "back" leaves your app — wizards usually navigate to an explicit previous route instead.',
      },
    ],
  },

  internals: {
    beginner: `
The router keeps one important piece of state: **the current route**. It's reactive, just like a \`ref\`. When you click a RouterLink, the router stops the browser from loading a new page, finds which route matches the new URL, updates the address bar, and changes the current route. \`<RouterView />\` is reading that current route — so, like any reactive template, it re-renders with the new page.
`,
    technical: [
      `
**RouterLink** renders an \`<a>\` with a real \`href\` (computed with \`router.resolve()\`), so it works with "open in new tab", right-click → copy link and screen readers. Its click handler decides whether to take over:
`,
      {
        code: `// A simplified model of RouterLink's click handler — not Vue Router's source
function onClick(event) {
  // Let the browser handle ctrl/cmd/shift/alt-clicks, non-left clicks
  // and links with target="_blank": those should open a new tab/window.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  if (event.button !== undefined && event.button !== 0) return
  if (linkTarget === '_blank') return

  event.preventDefault()          // no full page load…
  router.push(props.to)           // …client-side navigation instead
}`,
        lang: 'js',
        title: 'what RouterLink does on click (simplified)',
      },
      `
**router.push()** runs a small pipeline. In simplified form:
`,
      {
        code: `// A simplified model of a navigation — not Vue Router's source
async function push(to) {
  const target = matcher.resolve(to)            // compare the path with every route record
  await runNavigationGuards(target, current)    // beforeEach, beforeEnter… (see navigation guards)
  history.push(target.fullPath)                 // web history: window.history.pushState()
  currentRoute.value = target                   // reactive: RouterView re-renders
  runAfterEachHooks(target)
}`,
        lang: 'js',
        title: 'mental model of a navigation',
      },
      `
- The **matcher** turns every route \`path\` into a pattern when the router is created and ranks them, so a specific path like \`/menu\` wins over a catch-all.
- The **history** object is a small adapter. \`createWebHistory()\` uses \`history.pushState()\` and listens to the \`popstate\` event for Back/Forward; \`createWebHashHistory()\` does the same but keeps the path after a \`#\`; \`createMemoryHistory()\` keeps an array in memory.
- \`app.use(router)\` registers the two components, provides the router and the current route to every component (that's what \`useRouter()\`/\`useRoute()\` inject), adds \`$router\`/\`$route\`, and — in the browser — triggers the **initial navigation** to the current URL.
- **RouterView** injects the current route and renders the matched record's component. Navigation is asynchronous: the URL and \`currentRoute\` change only after guards and lazy components have resolved.
`,
    ],
    production: [
      `
- **Server fallback.** With \`createWebHistory()\`, every deep link and refresh hits your server. Configure a fallback to \`index.html\` and add a catch-all route in the app for a friendly 404 (the server can no longer return a real 404 status for unknown pages — another reason SSR exists, see [rendering strategies](lesson:rendering-strategies)).
`,
      {
        code: `# nginx
location / {
  try_files $uri $uri/ /index.html;
}

# Netlify: public/_redirects
/*  /index.html  200`,
        lang: 'bash',
        title: 'typical server fallbacks',
        static: true,
      },
      `
- **Deploying under a sub-path** (\`example.com/shop/\`): pass the base to the history — \`createWebHistory(import.meta.env.BASE_URL)\` — and set Vite's \`base\` option to the same value.
- **Accessibility.** A full page load moves focus to the top and screen readers announce the new page. An SPA navigation does neither by default. Production apps update \`document.title\` and move focus (for example to the main heading) after each navigation — often in a \`router.afterEach()\` hook.
- **Keep the router file boring.** One \`router/index.js\` that exports the router; pages in a \`pages/\` or \`views/\` folder; large pages lazy-loaded (see [lazy-loaded routes](lesson:lazy-routes-scroll)).
- **Use \`createMemoryHistory()\` in unit tests** and \`await router.isReady()\` before asserting on the first render (see [testing async code & routing](lesson:testing-async-routing)).
`,
    ],
  },

  mistakes: [
    {
      title: 'Using a plain `<a href>` for internal links',
      wrong: { code: `<a href="/menu">Menu</a>  <!-- full page reload, app state lost -->`, lang: 'vue' },
      right: { code: `<RouterLink to="/menu">Menu</RouterLink>`, lang: 'vue' },
      explanation: 'A plain link makes the browser request a whole new document from the server: the app restarts, stores reset, and with web history you may even hit a server 404. `RouterLink` renders the same `<a href>` but intercepts the click. Plain `<a>` is correct for *external* sites.',
    },
    {
      title: 'Forgetting `<RouterView />`',
      wrong: { code: `<template>\n  <nav>\n    <RouterLink to="/menu">Menu</RouterLink>\n  </nav>\n  <!-- URL changes, but nothing renders -->\n</template>`, lang: 'vue' },
      right: { code: `<template>\n  <nav>\n    <RouterLink to="/menu">Menu</RouterLink>\n  </nav>\n  <RouterView />\n</template>`, lang: 'vue' },
      explanation: 'The router decides *which* component matches, but it needs a place to put it. Without `<RouterView />` the URL updates and the screen stays the same.',
    },
    {
      title: 'Calling `app.use(router)` after `mount()`',
      wrong: { code: `const app = createApp(App)\napp.mount('#app')\napp.use(router) // too late: App already rendered without a router`, lang: 'js' },
      right: { code: `createApp(App).use(router).mount('#app')`, lang: 'js' },
      explanation: 'Mounting renders `App` immediately. If the router isn\'t installed yet, `<RouterLink>`/`<RouterView>` are unknown components and `useRoute()` has nothing to inject. Install plugins first, mount last.',
    },
    {
      title: 'Destructuring the route object',
      wrong: { code: `const { path } = useRoute()   // a snapshot — never updates`, lang: 'js' },
      right: { code: `const route = useRoute()\nconst path = computed(() => route.path)`, lang: 'js' },
      explanation: '`useRoute()` returns a reactive object whose properties change on every navigation. Destructuring copies today\'s value into a plain variable. Keep the object and read `route.path` where you need it (template, `computed`, `watch`).',
    },
  ],

  debugging: [
    {
      symptom: 'Refreshing or opening a deep link like `/menu` in production shows the server\'s 404 page.',
      cause: '`createWebHistory()` is used, but the server has no fallback, so it looks for a real `/menu` file.',
      fix: 'Configure the server/host to serve `index.html` for unknown paths (nginx `try_files`, Netlify `_redirects`, etc.), or use hash mode if you can\'t configure the server.',
    },
    {
      symptom: '`Failed to resolve component: RouterLink` / `RouterView` warning.',
      cause: 'The router was never installed with `app.use(router)`, or was installed after `mount()`.',
      fix: 'Write `createApp(App).use(router).mount(\'#app\')` in `main.js`.',
    },
    {
      symptom: 'Clicking a nav link reloads the whole page (the console clears, state resets).',
      cause: 'The link is a plain `<a href>` rather than a `<RouterLink>`.',
      fix: 'Replace internal links with `<RouterLink to="…">`.',
    },
    {
      symptom: 'The URL changes but the page content stays the same.',
      cause: 'There is no `<RouterView />`, or the route\'s `component` points to the wrong import.',
      fix: 'Add `<RouterView />` where pages should render and check the route table in the Vue Devtools Routes tab.',
    },
    {
      symptom: 'The deployed app under `/shop/` shows a blank page or the wrong route.',
      cause: 'The history base doesn\'t match where the app is served.',
      fix: 'Use `createWebHistory(import.meta.env.BASE_URL)` and set Vite\'s `base: \'/shop/\'`.',
    },
  ],

  bestPractices: [
    'Use `<RouterLink>` for every internal link and plain `<a>` only for external URLs.',
    'Prefer `createWebHistory()` in production and configure the server fallback once; use hash mode only when you truly can\'t configure the server.',
    'Keep the router in its own module (`router/index.js`) and install it in `main.js` before `mount()`.',
    'Treat the URL as state: anything a user might want to share, bookmark or refresh (the page, a selected tab, a search term) belongs in the URL.',
    'Style active links with the classes RouterLink already adds instead of tracking "current page" yourself.',
    'Use `createMemoryHistory()` for tests and server-side rendering, where there is no real address bar.',
  ],

  useCases: [
    'Any app with more than one screen: a dashboard with Overview / Reports / Settings.',
    'Marketing pages inside an SPA: Home, Pricing, About, Contact.',
    'Shareable views: linking a colleague straight to `/reports/2025`.',
    'Keeping app state (a music player, a chat widget, a cart) alive while users move between pages.',
  ],

  whenToUse: {
    use: [
      'Your SPA has several distinct screens users navigate between.',
      'Users should be able to bookmark, share, refresh or go Back to a specific screen.',
      'You want to load page code on demand (lazy routes) as the app grows.',
    ],
    avoid: [
      'A single small widget embedded in a page — show/hide with `v-if` instead of adding a router.',
      'A content-heavy site where every page is static HTML and SEO is critical — a multi-page site or SSR/SSG (e.g. Nuxt) may suit it better.',
      'Temporary UI like a modal or an accordion that nobody needs to link to — local state is simpler.',
    ],
  },

  comparison: {
    title: 'Multi-page site vs SPA without a router vs SPA with Vue Router',
    headers: ['', 'Multi-page site', 'SPA, no router (`v-if` pages)', 'SPA + Vue Router'],
    rows: [
      ['Page change', 'full reload from the server', 'instant, no reload', 'instant, no reload'],
      ['Each screen has its own URL?', 'yes', '**no** — always `/`', 'yes'],
      ['Back button / bookmarks / refresh', 'work', 'broken', 'work'],
      ['JavaScript state between pages', 'lost on every click', 'kept', 'kept'],
      ['Server setup', 'one file per page or server rendering', 'serve `index.html`', 'serve `index.html` + fallback (web history)'],
    ],
    note: 'Vue Router combines the speed of an SPA with the URLs of a multi-page site. Next: [dynamic params, query strings & 404s](lesson:dynamic-routes).',
  },

  quiz: [
    {
      id: 'router-basics-q1',
      type: 'mcq',
      prompt: 'What does `<RouterView />` do?',
      options: [
        { text: 'It renders the component whose route matches the current URL.' },
        { text: 'It renders a link to another page.', why: 'That\'s `<RouterLink>`.' },
        { text: 'It shows the current URL as text.', why: 'You\'d read `route.fullPath` for that. RouterView renders a component.' },
        { text: 'It creates the router instance.', why: 'The router is created with `createRouter()` in JavaScript.' },
      ],
      answer: 0,
      explanation: '`<RouterView />` is a placeholder: the router looks up the current URL in its route table and renders the matching component there.',
    },
    {
      id: 'router-basics-q2',
      type: 'output',
      prompt: 'The app starts at `/`. The user clicks **Menu**. What is rendered inside `<main>`?',
      code: {
        lang: 'vue',
        code: `// router.js
routes: [
  { path: '/', component: HomePage },   // renders "Welcome"
  { path: '/menu', component: MenuPage }, // renders "Croissants"
]

<!-- App.vue -->
<nav><RouterLink to="/menu">Menu</RouterLink></nav>
<main><RouterView /></main>`,
      },
      options: [
        'Croissants',
        { text: 'Welcome', why: 'The click navigates to `/menu`, so the match changes from HomePage to MenuPage.' },
        { text: 'Welcome Croissants', why: 'One `<RouterView />` shows one matched component at a time.' },
        { text: 'Nothing — the page reloads first', why: 'RouterLink prevents the full reload and navigates client-side.' },
      ],
      answer: 0,
      explanation: 'RouterLink calls `router.push(\'/menu\')`; the router matches `/menu` → `MenuPage`, and `<RouterView />` re-renders with it.',
    },
    {
      id: 'router-basics-q3',
      type: 'bug',
      prompt: 'Clicking **Menu** reloads the whole app and resets the shopping cart. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <a href="/menu">Menu</a>
    <RouterLink to="/about">About</RouterLink>
  </nav>
  <RouterView />
</template>`,
      },
      answerLine: 4,
      explanation: 'A plain `<a href>` makes the browser load a new document from the server, restarting the app. Use `<RouterLink to="/menu">`.',
    },
    {
      id: 'router-basics-q4',
      type: 'fill',
      prompt: 'Fill in the blanks to create a router and install it on the app.',
      code: {
        lang: 'js',
        code: `import { createRouter, createWebHistory } from 'vue-router'

const router = ___({
  history: createWebHistory(),
  ___: [{ path: '/', component: HomePage }],
})

createApp(App).___(router).mount('#app')`,
      },
      answer: [['createRouter'], ['routes'], ['use']],
      explanation: '`createRouter({ history, routes })` builds the router; `app.use(router)` installs it before mounting.',
    },
    {
      id: 'router-basics-q5',
      type: 'mcq',
      prompt: 'Your app uses `createWebHistory()`. Clicking links works, but **refreshing** `/menu` on the live site shows the hosting provider\'s 404 page. Why?',
      options: [
        { text: 'The server is asked for `/menu`, has no such file, and isn\'t configured to fall back to `index.html`.' },
        { text: 'The `/menu` route is missing from the routes table.', why: 'Clicking works, so the route exists. The request never reaches your JavaScript.' },
        { text: 'RouterLink doesn\'t work in production builds.', why: 'It does — the problem only appears on refresh/deep links, which go to the server.' },
        { text: 'Browsers don\'t allow the History API on refresh.', why: 'The History API is fine; on refresh the browser simply asks the server for the URL.' },
      ],
      answer: 0,
      explanation: 'Client-side navigation never contacts the server, but a refresh does. Configure a fallback to `index.html` (or use hash mode, where the server only ever sees `/`).',
    },
    {
      id: 'router-basics-q6',
      type: 'mcq',
      prompt: 'Which history mode should a **unit test** or a **server-side render** use?',
      options: [
        { text: '`createMemoryHistory()`' },
        { text: '`createWebHistory()`', why: 'It needs a real browser address bar and `window.history`, which a server doesn\'t have.' },
        { text: '`createWebHashHistory()`', why: 'Also tied to the browser\'s address bar.' },
        { text: 'No history — omit the option.', why: '`history` is a required option of `createRouter()`.' },
      ],
      answer: 0,
      explanation: 'Memory history keeps the location in a JavaScript array, so it works anywhere — Node, test runners, this sandbox.',
    },
    {
      id: 'router-basics-q7',
      type: 'short',
      prompt: 'In two or three sentences: why use `<RouterLink>` instead of a `<button @click="router.push(...)">` for the main navigation menu?',
      answer: 'RouterLink renders a real `<a href>`, so it behaves like a link: users can open it in a new tab, copy the address, and assistive technology announces it as a link. It also gets active classes and `aria-current` automatically. `router.push()` is for navigation triggered by actions, like after submitting a form.',
    },
  ],

  exercises: [
    {
      id: 'portfolio-router',
      title: 'Wire up a three-page portfolio',
      difficulty: 'beginner',
      prompt: `
The pages are written, but the app has no working navigation. Wire it up.

- In \`router.js\`, add routes: \`/\` → \`HomePage\`, \`/projects\` → \`ProjectsPage\`, \`/contact\` → \`ContactPage\` (keep \`createMemoryHistory()\`).
- In \`App.vue\`, replace the three placeholder \`<span>\`s with \`<RouterLink>\`s, keeping their classes: \`nav-home\`, \`nav-projects\`, \`nav-contact\`.
- Render the matched page inside \`<main>\` with \`<RouterView />\`.
- Each page already has an \`<h2 class="page-title">\`.
`,
      files: {
        'main.js': mainJs,
        'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from './HomePage.vue'
// TODO: import the other pages

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    // TODO: add the three routes
  ],
})`,
        'App.vue': `<template>
  <nav>
    <span class="nav-home">Home</span>
    <span class="nav-projects">Projects</span>
    <span class="nav-contact">Contact</span>
  </nav>
  <main>
    <!-- TODO: render the current page here -->
  </main>
</template>`,
        ...ex1Pages,
      },
      hints: [
        'A route is `{ path: \'/projects\', component: ProjectsPage }`. You need three of them, plus the imports.',
        'Swap each `<span class="nav-…">` for `<RouterLink to="…" class="nav-…">`. The class falls through to the rendered `<a>`.',
        'Put `<RouterView />` inside `<main>`. Without it, the URL changes but nothing renders.',
      ],
      solution: {
        explanation: 'Three pieces always work together: the **route table** (what to show for each path), **links** (how users change the path) and a **RouterView** (where to show it). RouterLink renders real `<a href>` elements, and the router adds `router-link-active` to the link of the current page.',
        files: {
          'main.js': mainJs,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import HomePage from './HomePage.vue'
import ProjectsPage from './ProjectsPage.vue'
import ContactPage from './ContactPage.vue'

export default createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/projects', component: ProjectsPage },
    { path: '/contact', component: ContactPage },
  ],
})`,
          'App.vue': `<template>
  <nav>
    <RouterLink to="/" class="nav-home">Home</RouterLink>
    <RouterLink to="/projects" class="nav-projects">Projects</RouterLink>
    <RouterLink to="/contact" class="nav-contact">Contact</RouterLink>
  </nav>
  <main>
    <RouterView />
  </main>
</template>`,
          ...ex1Pages,
        },
      },
      tests: [
        { name: 'the home page renders at /', code: `expect(text('main .page-title')).toBe('Hello, I build things')` },
        { name: 'nav items are real links with hrefs', code: `expect(find('.nav-projects').tagName).toBe('A'); expect(attr('.nav-projects', 'href')).toBe('/projects'); expect(attr('.nav-contact', 'href')).toBe('/contact')` },
        { name: 'clicking Projects shows the projects page', code: `await click('.nav-projects'); expect(text('main .page-title')).toBe('Projects')` },
        { name: 'Contact, then Home, both work', code: `await click('.nav-contact'); expect(text('main .page-title')).toBe('Contact'); await click('.nav-home'); expect(text('main .page-title')).toBe('Hello, I build things')` },
        { name: 'the current link is marked active', code: `await click('.nav-projects'); expect(classes('.nav-projects')).toContain('router-link-active'); expect(classes('.nav-contact')).not.toContain('router-link-active')` },
      ],
    },
    {
      id: 'url-driven-checkout',
      title: 'Checkout steps that live in the URL',
      difficulty: 'intermediate',
      prompt: `
This checkout keeps the current step in a local \`ref\`, so the URL never changes: refreshing or sharing the link always lands on step 1. Make the **URL the source of truth**.

The router already has three routes: \`/\` (cart), \`/shipping\`, \`/payment\`. In \`App.vue\`:

- Show \`<p class="step">Step N of 3</p>\`, where N is **derived from the current route** (\`useRoute()\`), not from a local counter.
- A \`<button class="next">\` navigates to the next step with \`router.push()\`. On the last step it must be **disabled** (or not rendered).
- A \`<button class="back">\` navigates to the **previous step's path** (not \`router.back()\` — a user who deep-linked to \`/payment\` has no history to go back to). Disable it on step 1.
- Keep \`<RouterView />\` so each step's \`.title\` is rendered.
`,
      files: {
        'main.js': mainJs,
        'router.js': ex2Router,
        'App.vue': `<script setup>
import { ref } from 'vue'

// BUG: the step lives here, not in the URL.
const step = ref(1)
</script>

<template>
  <p class="step">Step {{ step }} of 3</p>
  <RouterView />
  <button class="back" :disabled="step === 1" @click="step--">Back</button>
  <button class="next" :disabled="step === 3" @click="step++">Next</button>
</template>`,
        ...ex2Steps,
      },
      hints: [
        'Keep an ordered list of the step paths: `const steps = [\'/\', \'/shipping\', \'/payment\']`.',
        'Derive the index with `computed(() => steps.indexOf(route.path))`, then show `index + 1`.',
        'Next: `router.push(steps[index.value + 1])`. Back: `router.push(steps[index.value - 1])`. Disable with `index === 0` / `index === steps.length - 1`.',
      ],
      solution: {
        explanation: 'The step number is now a `computed` of `route.path`, so **every** way of reaching a page — buttons, deep links, refresh, browser Back — shows the right step. Navigating to explicit paths (instead of `router.back()`) keeps the wizard predictable for users who arrived via a shared link.',
        files: {
          'main.js': mainJs,
          'router.js': ex2Router,
          'App.vue': `<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const steps = ['/', '/shipping', '/payment']
const index = computed(() => steps.indexOf(route.path))

function next() {
  if (index.value < steps.length - 1) router.push(steps[index.value + 1])
}
function back() {
  if (index.value > 0) router.push(steps[index.value - 1])
}
</script>

<template>
  <p class="step">Step {{ index + 1 }} of {{ steps.length }}</p>
  <RouterView />
  <button class="back" :disabled="index === 0" @click="back">Back</button>
  <button class="next" :disabled="index === steps.length - 1" @click="next">Next</button>
</template>`,
          ...ex2Steps,
        },
      },
      tests: [
        { name: 'starts on step 1 (the cart)', code: `expect(text('.step')).toBe('Step 1 of 3'); expect(text('.title')).toBe('Your cart')` },
        { name: 'Next changes the URL to /shipping', code: `await click('.next'); await flush(); const router = requireModule('router.js').default; expect(router.currentRoute.value.path).toBe('/shipping'); expect(text('.step')).toBe('Step 2 of 3')` },
        { name: 'a deep link to /payment shows step 3', code: `const router = requireModule('router.js').default; await router.push('/payment'); await flush(); expect(text('.step')).toBe('Step 3 of 3'); expect(text('.title')).toBe('Payment')` },
        { name: 'Next is disabled on the last step', code: `const router = requireModule('router.js').default; await router.push('/payment'); await flush(); expect(!exists('.next') || find('.next').disabled).toBe(true)` },
        { name: 'Back goes to the previous step even after a deep link', code: `const router = requireModule('router.js').default; await router.push('/payment'); await flush(); await click('.back'); await flush(); expect(router.currentRoute.value.path).toBe('/shipping'); expect(text('.step')).toBe('Step 2 of 3')` },
      ],
    },
  ],

  interview: [
    {
      id: 'router-basics-why-client-routing',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is client-side routing, and why do single-page apps need it?',
      answer: 'Client-side routing maps URLs to views inside the browser. When the user navigates, a router (like Vue Router) intercepts the link, updates the URL with the History API and swaps the rendered component — no new document is requested from the server. SPAs need it so every screen still has a real URL that supports sharing, bookmarks, refresh and the Back button, while keeping the speed and preserved state of not reloading.',
      explanation: 'Without a router an SPA either has one URL for everything (broken Back/bookmarks) or uses plain links that reload the app. The router gives you both: URLs and no reloads.',
      whyAsked: 'Checks that you understand what problem the router solves, not just its API.',
      mistakes: [
        'Saying it is "for SEO" — client-side routing alone does not help crawlers; that is what SSR/SSG are for.',
        'Not mentioning that the URL and history stay meaningful (Back, refresh, sharing).',
        'Confusing it with server-side routing frameworks.',
      ],
      followUps: ['What happens when the user refreshes a client-routed page?', 'How does the router know when the user presses Back?', 'What are the downsides of an SPA compared with server-rendered pages?'],
      modelAnswer: 'Client-side routing means the browser, not the server, decides what to show for a URL. In Vue, Vue Router keeps a table of paths and components; when you click a RouterLink it prevents the normal page load, pushes the new URL with the History API and re-renders RouterView with the matching component. That gives an SPA real, shareable URLs and a working Back button without throwing away JavaScript state on every click. The trade-off is that the server must serve index.html for deep links, and crawlers or first paint may need SSR if SEO matters.',
    },
    {
      id: 'router-basics-history-modes',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `createWebHistory()` and `createWebHashHistory()`. After deploying with web history, deep links return a 404. Which statement is correct?',
      options: [
        'Hash mode is required in production; web history only works in development.',
        'Web history gives clean URLs but the server must fall back to index.html for unknown paths; hash mode needs no server config because the part after # is never sent to the server.',
        'Both modes send the full path to the server, so both need the same server configuration.',
        'Web history breaks the Back button, which is why hash mode exists.',
      ],
      correctOption: 1,
      answer: 'Web history uses `history.pushState`, producing clean URLs like `/menu`. On a refresh or deep link the browser requests `/menu` from the server, so the server must serve `index.html` for unknown paths. Hash mode puts the route after `#` (`/#/menu`); browsers never send the fragment to the server, so no configuration is needed — at the cost of uglier URLs and being a poorer fit for SEO.',
      explanation: 'The difference is what the server sees. Web history: the full path. Hash: always just `/`.',
      code: {
        lang: 'js',
        code: `createRouter({ history: createWebHistory(), routes })      // example.com/menu
createRouter({ history: createWebHashHistory(), routes })  // example.com/#/menu
createRouter({ history: createMemoryHistory(), routes })   // SSR, tests`,
      },
      whyAsked: 'The "works locally, 404s in production" bug is extremely common; interviewers want to know you can explain and fix it.',
      mistakes: ['Saying hash mode is "deprecated" — it is a supported option.', 'Suggesting to fix the 404 inside the Vue app; the request never reaches the app.', 'Forgetting memory history exists for SSR/tests.'],
      followUps: ['How would you configure nginx for web history?', 'If every path serves index.html, how do you show a 404 page?', 'How do you deploy under a sub-path like /app/?'],
      modelAnswer: 'createWebHistory uses the HTML5 History API, so URLs look normal, like /menu. The catch is that refreshes and deep links go to the server, so the server needs a fallback that returns index.html for any unknown path — try_files in nginx, a rewrite rule on most hosts. createWebHashHistory keeps the route after a hash; the fragment is never sent to the server, so it works on any static host without config, but URLs are less clean and it is a weaker choice for SEO. I default to web history with a server fallback plus a catch-all 404 route in the app, and use memory history for SSR and tests.',
    },
    {
      id: 'router-basics-anchor-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'Users report that their cart empties whenever they click "Pricing" in the nav, but not other links. What\'s wrong?',
      code: {
        lang: 'vue',
        code: `<nav>
  <RouterLink to="/">Home</RouterLink>
  <RouterLink to="/shop">Shop</RouterLink>
  <a href="/pricing">Pricing</a>
</nav>
<RouterView />`,
      },
      answer: 'The Pricing link is a plain `<a href>`, so the browser performs a full page load: the Vue app restarts and in-memory state (the cart) is lost. Replace it with `<RouterLink to="/pricing">`.',
      explanation: 'RouterLink renders the same `<a>` element but intercepts the click and navigates client-side, so the app — and its state — keep running.',
      whyAsked: 'Tests whether you know what RouterLink actually does beyond "it\'s the Vue way".',
      mistakes: ['Blaming the cart store or suggesting localStorage persistence as the fix.', 'Not noticing the one plain anchor.'],
      followUps: ['When *is* a plain `<a>` correct?', 'How does RouterLink still allow "open in new tab"?'],
      modelAnswer: 'The Pricing entry is a plain anchor, so clicking it makes the browser request a new document — the whole SPA reloads and any in-memory state like the cart resets. RouterLink renders the same anchor with a real href but calls preventDefault on normal left-clicks and does router.push instead. So the fix is RouterLink to="/pricing". Plain anchors are still right for external links.',
    },
    {
      id: 'router-basics-what-happens-on-click',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Walk through what happens, step by step, between a user clicking `<RouterLink to="/menu">` and the menu page appearing.',
      answer: 'RouterLink\'s click handler checks for modifier keys, non-left clicks and `target="_blank"` (letting the browser handle those), then calls `preventDefault()` and `router.push(\'/menu\')`. The router resolves the location against its matcher, runs the navigation guards, resolves any lazy-loaded components, then updates the history (`history.pushState` for web history) and sets the reactive `currentRoute`. Because RouterView renders from the injected current route, it re-renders with the matched component; `afterEach` hooks run after the navigation is confirmed.',
      explanation: 'Clicking a link becomes a function call; the screen updates because the current route is reactive state.',
      whyAsked: 'Separates people who use the router from people who understand it — useful when debugging navigation that "does nothing" or guards that never run.',
      mistakes: ['Saying the router "reloads the component from the server".', 'Thinking the URL changes before guards run.', 'Forgetting that RouterLink renders a real href for accessibility and new tabs.'],
      followUps: ['How does Back/Forward reach the router?', 'Why is `router.push()` asynchronous?', 'What happens if a guard returns `false`?'],
      modelAnswer: 'RouterLink renders an anchor with a resolved href. On a plain left-click it calls preventDefault and router.push with its `to`. The router resolves that location against the compiled route records, then runs the guard pipeline — global beforeEach, per-route beforeEnter, in-component guards — and waits for any lazy components. Only once the navigation is confirmed does it write the URL through the history adapter, which is pushState for web history, and update currentRoute, which is reactive. RouterView reads that route, so it re-renders the matched component, and afterEach hooks fire. Back and Forward come in through a popstate listener and go through the same pipeline.',
    },
    {
      id: 'router-basics-subpath-deploy',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Your Vue app must be deployed at `https://example.com/store/` instead of the domain root. Links like `/cart` currently go to `example.com/cart`. What do you change?',
      answer: 'Give the history a base: `createWebHistory(import.meta.env.BASE_URL)` and set Vite\'s `base: \'/store/\'` so assets and `BASE_URL` match. Route paths stay `/cart`; the router prefixes the base when building hrefs and strips it when reading the URL. The server fallback must also serve `/store/index.html` for unknown paths under `/store/`.',
      explanation: 'Routes describe paths *inside* your app; the base describes where the app lives on the server.',
      code: {
        lang: 'js',
        code: `// vite.config.js
export default defineConfig({ base: '/store/' })

// router/index.js
createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })`,
      },
      whyAsked: 'A practical deployment question that reveals whether you understand the history base and asset paths.',
      mistakes: ['Prefixing every route path with `/store`.', 'Changing only Vite\'s base and forgetting the router (or vice versa).'],
      followUps: ['How does hash mode behave under a sub-path?', 'What does `import.meta.env.BASE_URL` contain?'],
      modelAnswer: 'I would not touch the route paths. I would set Vite\'s base to /store/ so built assets load from there, and pass import.meta.env.BASE_URL — which Vite fills with that base — to createWebHistory. The router then generates hrefs like /store/cart and strips the prefix when matching. Finally the server fallback needs to point unknown paths under /store/ to that index.html.',
    },
    {
      id: 'router-basics-coding-tabs',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 8,
      question: 'Build a docs viewer with two tabs. Routes: `/` → `GuidePage`, `/api` → `ApiPage`. Render two `RouterLink`s with `class="tab"` (Guide first, then API). The active tab must get the class `tab--active`. Show the current path in `<p class="crumb">`. Render the page in a `RouterView`.',
      starter: {
        files: {
          'main.js': mainJs,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'

export default createRouter({
  history: createMemoryHistory(),
  routes: [],
})`,
          'App.vue': `<template>
  <p class="crumb">/</p>
  <!-- tabs and page go here -->
</template>`,
          ...tabsPages,
        },
      },
      tests: [
        { name: 'two tab links are rendered', code: `const tabs = findAll('a.tab'); expect(tabs).toHaveLength(2); expect(tabs[1].getAttribute('href')).toBe('/api')` },
        { name: 'the guide is shown first and its tab is active', code: `expect(text('.content')).toContain('Start here'); expect(classes(findAll('a.tab')[0])).toContain('tab--active')` },
        { name: 'clicking API switches page, tab and crumb', code: `const api = findAll('a.tab')[1]; await click(api); expect(text('.content')).toContain('createRouter'); expect(classes(api)).toContain('tab--active'); expect(classes(findAll('a.tab')[0])).not.toContain('tab--active'); expect(text('.crumb')).toBe('/api')` },
      ],
      hints: ['Add two route records and import both page components in `router.js`.', 'Use `exact-active-class="tab--active"` on each RouterLink, or set `linkExactActiveClass` in `createRouter()`.', 'For the crumb, `const route = useRoute()` and `{{ route.path }}` (or `$route.path` in the template).'],
      answer: 'Register both routes, render RouterLinks with `class="tab"` and `exact-active-class="tab--active"`, show `route.path` in the crumb and add a RouterView.',
      solution: {
        files: {
          'main.js': mainJs,
          'router.js': `import { createRouter, createMemoryHistory } from 'vue-router'
import GuidePage from './GuidePage.vue'
import ApiPage from './ApiPage.vue'

export default createRouter({
  history: createMemoryHistory(),
  linkExactActiveClass: 'tab--active',
  routes: [
    { path: '/', component: GuidePage },
    { path: '/api', component: ApiPage },
  ],
})`,
          'App.vue': `<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <p class="crumb">{{ route.path }}</p>
  <nav>
    <RouterLink to="/" class="tab">Guide</RouterLink>
    <RouterLink to="/api" class="tab">API</RouterLink>
  </nav>
  <RouterView />
</template>`,
          ...tabsPages,
        },
      },
      explanation: 'The router already knows which link is current; renaming its exact-active class is cleaner than computing "is this tab active?" yourself, and it also sets `aria-current="page"`.',
      whyAsked: 'A warm-up that shows whether you can set up a router from scratch and rely on its built-in active state.',
      mistakes: ['Tracking the active tab in a separate ref that can drift from the URL.', 'Using buttons with `router.push` instead of links for tabs that should be shareable.'],
      followUps: ['What is the difference between active and exact-active?', 'How would you make these tabs lazy-load their content?'],
      modelAnswer: 'I register two routes, render two RouterLinks with class tab, and either pass exact-active-class="tab--active" to each link or set linkExactActiveClass on the router. The crumb reads route.path from useRoute, and a RouterView renders the page. The router owns the "which tab is active" state, so it can never disagree with the URL.',
    },
  ],

  takeaways: [
    'Client-side routing gives an SPA real URLs — shareable, bookmarkable, refreshable — without full page reloads.',
    'A router is a table of `{ path, component }` records plus a history mode, created with `createRouter()` and installed with `app.use(router)` before `mount()`.',
    '`<RouterLink>` renders a real `<a href>` but navigates client-side; `<RouterView />` renders the matched component.',
    '`createWebHistory()` gives clean URLs but needs a server fallback to `index.html`; hash mode needs no server config; memory history is for SSR, tests and sandboxes.',
    '`useRoute()` reads the reactive current location; `useRouter()` navigates from code (`push`, `replace`, `back`).',
  ],
}
