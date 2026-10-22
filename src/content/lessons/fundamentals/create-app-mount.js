// Lesson: The root app — createApp & mount

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'

// 1. Create the application instance from the root component
const app = createApp(App, { shopName: 'Pixel Shop' })

// 2. Configure it — always BEFORE mounting
app.config.errorHandler = (err) => {
  console.error('Something went wrong:', err.message)
}

// 3. Mount it: render App inside <div id="app">
app.mount('#app')`

const appVue = `<script setup>
import { ref } from 'vue'

// The root component receives the props passed to createApp()
defineProps({
  shopName: String,
})

const cartCount = ref(0)
</script>

<template>
  <h1 class="shop-name">{{ shopName }}</h1>
  <p class="cart">{{ cartCount }} items in your cart</p>
  <button class="add" @click="cartCount++">Add to cart</button>
</template>`

const baseBadge = `<template>
  <span class="badge"><slot /></span>
</template>

<style scoped>
.badge {
  background: #ffe14d;
  border-radius: 999px;
  padding: 0.1rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
}
</style>`

export default {
  id: 'create-app-mount',
  title: 'The root app: createApp & mount',
  summary: 'Every Vue 3 app starts with createApp(), is configured with plugins and global settings, and only comes alive when you mount() it into the page.',
  difficulty: 'beginner',
  minutes: 20,
  prerequisites: ['create-vue-project'],
  related: ['single-file-components', 'plugins-app-config', 'error-handling', 'what-is-vue'],
  tags: ['createApp', 'mount', 'app instance', 'root component', 'app.use', 'app.component', 'errorHandler', 'main.js'],
  apis: [
    { name: 'createApp(rootComponent, rootProps?)', summary: 'Creates an application instance from a root component, optionally with props for it.' },
    { name: 'app.mount(container)', summary: 'Renders the root component into a CSS selector or DOM element and returns the root component instance.' },
    { name: 'app.use(plugin)', summary: 'Installs a plugin such as Vue Router or Pinia into this app.' },
    { name: 'app.component(name, component)', summary: 'Registers a component globally for this app.' },
    { name: 'app.config.errorHandler', summary: 'A function called for uncaught errors from components in this app.' },
    { name: 'app.unmount()', summary: 'Unmounts the app and tears down all of its components.' },
  ],
  docs: [
    { label: 'Vue Guide — Creating a Vue Application', url: 'https://vuejs.org/guide/essentials/application.html' },
    { label: 'API — Application', url: 'https://vuejs.org/api/application.html' },
  ],

  intro: `
Every Vue 3 application begins with the same two calls in \`main.js\`:

\`\`\`js
createApp(App).mount('#app')
\`\`\`

\`createApp(App)\` builds an **application instance** — an object that represents your whole app and holds its settings. \`App\` is the **root component**: the top of the tree that every other component lives inside. \`.mount('#app')\` tells Vue *where* on the page to render it, and that is the moment your app actually appears.

Between those two steps is where you configure the app: install plugins (Vue Router, Pinia), register global components and set up error handling.
`,

  why: `
A Vue app needs one place that answers three questions:

1. **What** is the app? → the root component.
2. **How** is it configured? → plugins, global components, error handling, app-wide values.
3. **Where** does it live on the page? → the mount container.

\`createApp()\` + \`mount()\` answer them in that order.

Vue 2 did this differently: you changed one shared global \`Vue\` object (\`Vue.use(...)\`, \`Vue.component(...)\`) and then called \`new Vue()\`. Every app on the page — and every test — inherited those global changes, so a plugin installed for one app leaked into all others. Vue 3's \`createApp()\` gives each app its **own** isolated configuration, which makes multiple apps on one page, testing and server rendering much cleaner.
`,

  eli15: `
Think of putting on a school play.

\`createApp(App)\` is forming the drama club around a script — \`App\` is the script that contains every scene.

Before opening night you prepare: hire a lighting crew (\`app.use(router)\`), hand out props everyone can use in any scene (\`app.component(...)\`), and agree on a plan if something goes wrong on stage (\`app.config.errorHandler\`).

\`.mount('#app')\` is opening night **on a specific stage**: the curtain rises on the empty \`<div id="app">\` and the play begins. You don't hire the lighting crew halfway through the first scene — preparation happens *before* the curtain goes up.
`,

  analogy: {
    title: 'Fitting out a shop, then opening the doors',
    body: `
You sign the lease and get an empty shop (\`createApp\`). Before customers arrive you install the till, the alarm and the shelves (\`use\`, \`component\`, \`config\`). Then you unlock the doors at a specific address (\`mount('#app')\`). From that moment customers (users) are inside, and everything you installed is already working.

You could install the alarm after opening — but anything that happened before it was installed went unnoticed. Configure first, open second.
`,
    mapping: [
      ['getting the empty shop', '`createApp(App)` creates the app instance'],
      ['installing till, alarm, shelves', '`app.use()`, `app.component()`, `app.config` — configuration'],
      ['the shop address', 'the mount container, e.g. `#app`'],
      ['unlocking the doors', '`app.mount()` — the first render happens'],
      ['closing down', '`app.unmount()`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'From createApp() to pixels on screen',
    props: {
      nodes: [
        { id: 'create', label: 'createApp(App)', note: 'root component + root props', tone: 'acid' },
        { id: 'app', label: 'app instance', note: 'config · components · plugins', tone: 'cobalt' },
        { id: 'config', label: 'configure', note: 'use() · component() · config', tone: 'kraft' },
        { id: 'mount', label: "mount('#app')", note: 'find container, clear it', tone: 'ink' },
        { id: 'dom', label: '<div id="app">', note: 'App rendered inside', tone: 'paper' },
      ],
      edges: [
        { from: 'create', to: 'app', label: 'returns' },
        { from: 'app', to: 'config', label: 'chainable' },
        { from: 'config', to: 'mount', label: 'then' },
        { from: 'mount', to: 'dom', label: 'renders into' },
      ],
      layout: 'row',
      steps: [
        { focus: ['create'], text: '`createApp(App, { shopName: \'Pixel Shop\' })` takes the **root component** and, optionally, props for it. Nothing is rendered yet.' },
        { focus: ['app'], edges: ['create->app'], text: 'It returns an **app instance** — an object holding this app\'s own configuration, global components, directives and plugins. Other apps on the page are unaffected.' },
        { focus: ['config'], edges: ['app->config'], text: '**Configure** it: `app.use(router)`, `app.component(\'BaseBadge\', BaseBadge)`, `app.config.errorHandler = …`. These methods return the app, so you can chain them.' },
        { focus: ['mount'], edges: ['config->mount'], text: '`app.mount(\'#app\')` finds the container (a selector or an element) and clears whatever was inside it.' },
        { focus: ['dom'], edges: ['mount->dom'], text: 'Vue renders the root component into the container. `mount()` returns the **root component instance** — not the app — so it must come last in a chain.' },
      ],
    },
    caption: 'Create → configure → mount. Configuration that happens after mount() misses the first render.',
    alt: 'A left-to-right flow: createApp(App) returns an app instance; the app is configured with use, component and config calls; mount("#app") finds and clears the container; the root component is rendered inside the div with id app.',
  },

  syntax: [
    `
#### The minimum
`,
    {
      code: `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)   // create
app.mount('#app')            // mount`,
      lang: 'js',
      title: 'main.js',
    },
    `
- \`createApp(rootComponent, rootProps?)\` — the second argument is an optional object of **props** (inputs) for the root component.
- \`app.mount(container)\` accepts a CSS selector string (\`'#app'\`) **or** an actual DOM element (\`document.getElementById('app')\`).
- Whatever was inside the container is **replaced** when the app mounts.
- Each app instance can be mounted **once**. To show it again after \`app.unmount()\`, create a new app.

#### Configuring before mounting
`,
    {
      code: `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import BaseButton from './components/BaseButton.vue'

const app = createApp(App)

app.use(createPinia())                       // install a plugin (Pinia)
app.use(router)                              // install a plugin (Vue Router)
app.component('BaseButton', BaseButton)      // register a global component
app.provide('currency', 'EUR')               // an app-wide value any component can inject
app.config.errorHandler = (err, instance, info) => {
  // report uncaught component errors (e.g. to a monitoring service)
  console.error(err, info)
}

app.mount('#app')                            // always last`,
      lang: 'js',
      title: 'main.js in a real project',
      static: true,
    },
    `
\`use()\`, \`component()\`, \`provide()\` and \`directive()\` return the app, so you can chain them:
`,
    {
      code: `createApp(App)
  .use(createPinia())
  .use(router)
  .mount('#app') // mount returns the root component instance, so it goes LAST`,
      lang: 'js',
      title: 'chaining',
      static: true,
    },
    {
      callout: 'warn',
      title: 'mount() ends the chain',
      text: '`mount()` returns the **root component instance**, not the app. `createApp(App).mount(\'#app\').use(router)` throws `TypeError: ….use is not a function`.',
    },
    `
#### Several apps on one page

\`createApp()\` can be called as many times as you like. Each app controls only its own container — useful when you add Vue widgets to an existing server-rendered page:
`,
    {
      code: `createApp(SearchBox).mount('#search')
createApp(CartWidget).use(createPinia()).mount('#cart')`,
      lang: 'js',
      title: 'two independent apps',
      static: true,
    },
    `
Learn more about plugins in [Plugins & app-level configuration](lesson:plugins-app-config), about \`provide\` in [provide() & inject()](lesson:provide-inject), and about the global component registry in [Why components?](lesson:why-components).
`,
    {
      callout: 'version',
      title: 'Vue 2 → Vue 3',
      text: 'Vue 2 used `new Vue({ render: h => h(App) }).$mount(\'#app\')` plus global calls like `Vue.use()` and `Vue.component()`. In Vue 3 these became methods on the app instance: `createApp(App)`, `app.use()`, `app.component()`, and `Vue.prototype.$x` became `app.config.globalProperties.$x`.',
    },
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: mainJs,
    intro: 'This is the entry point of the playground app. Follow the three stages: create, configure, mount.',
    steps: [
      { lines: [1, 2], text: '`createApp` comes from Vue; `App` is the root component, imported from its `.vue` file.' },
      { lines: [5], text: '`createApp(App, { shopName: \'Pixel Shop\' })` creates the app instance. The second argument is a props object for the root component — App receives `shopName` through `defineProps`.' },
      { lines: [8, 10], text: 'Configuration happens **before** mounting. `app.config.errorHandler` receives uncaught errors from any component in this app — a natural place to log or report them.' },
      { lines: [13], text: '`app.mount(\'#app\')` renders App into the element with id `app`, replacing anything that was inside it. From now on, Vue owns that part of the page.' },
    ],
  },

  playground: {
    title: 'Booting the shop app',
    objective: 'Change how the app is created, configured and mounted — and watch the effect on the page.',
    files: { 'main.js': mainJs, 'App.vue': appVue, 'components/BaseBadge.vue': baseBadge },
    entry: 'main.js',
    expected: 'The heading **Pixel Shop** comes from the root prop passed to `createApp()`. The cart counter works. `components/BaseBadge.vue` exists but is not registered yet.',
    experiments: [
      {
        id: 'root-prop',
        task: 'Rename the shop to **Retro Corner** — without touching `App.vue`.',
        hint: 'The name is a root prop: the second argument to `createApp()` on line 5 of `main.js`.',
        tests: [{ name: 'the heading says Retro Corner', code: `expect(text('.shop-name')).toBe('Retro Corner')` }],
        explain: 'Root props are how the outside world (for example data rendered by a server into the page) can configure the root component.',
      },
      {
        id: 'global-component',
        task: 'Register `BaseBadge` **globally** in `main.js` as `\'BaseBadge\'`, then use it in `App.vue`: put `<BaseBadge>New</BaseBadge>` next to the heading.',
        hint: "In main.js: `import BaseBadge from './components/BaseBadge.vue'` and `app.component('BaseBadge', BaseBadge)` — before `app.mount()`. App.vue needs no import.",
        tests: [{ name: 'a badge renders', code: `expect(exists('.badge')).toBe(true); expect(text('.badge')).toBe('New')` }],
        explain: 'A globally registered component can be used in every template of this app without importing it. Convenient for a handful of base components — but explicit local imports keep dependencies clearer, so use global registration sparingly.',
      },
      {
        id: 'error-handler',
        task: 'Test the error handler. In `App.vue`, add a `checkout()` function that does `throw new Error(\'Payment service is down\')` and a **Checkout** button that calls it. Click it and look at the console.',
        hint: '`function checkout() { throw new Error(\'Payment service is down\') }` and `<button @click="checkout">Checkout</button>`.',
        tests: [
          {
            name: 'the app-level error handler reports the error',
            code: `const btn = findAll('button').find((b) => /checkout/i.test(b.textContent))
expect(btn).toBeTruthy()
await click(btn)
expect(logs.some((l) => l.includes('Something went wrong') && l.includes('Payment service is down'))).toBe(true)`,
          },
        ],
        explain: 'Errors thrown in event handlers, lifecycle hooks, watchers and rendering inside this app all funnel into `app.config.errorHandler`. In production you would send them to an error-monitoring service.',
      },
      {
        id: 'container-replaced',
        task: 'In `main.js`, just before `app.mount(...)`, add `document.getElementById(\'app\').innerHTML = \'<p>Loading…</p>\'`. Run it. Where did "Loading…" go?',
        hint: 'Mounting clears the container before rendering.',
        explain: 'Anything inside the mount container is replaced by the rendered app. (Vue also adds a `data-v-app` attribute to the container.) To *reuse* server-rendered HTML instead of replacing it, Vue offers `createSSRApp()` + hydration — see [Hydration](lesson:hydration).',
      },
    ],
  },

  animation: {
    type: 'dom-tree',
    title: 'The page after mount()',
    props: {
      html: `<body>
  <div id="app" data-v-app="">
    <h1 class="shop-name">Pixel Shop</h1>
    <p class="cart">0 items in your cart</p>
    <button class="add">Add to cart</button>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>`,
    },
    caption: 'Before mount, `#app` is empty. After mount, it contains the root component\'s rendered elements and a `data-v-app` marker. Everything outside `#app` is untouched by Vue. Edit the HTML to explore the tree.',
    alt: 'An editable HTML snippet and the DOM tree built from it: body contains the div with id app (marked data-v-app) holding an h1, a paragraph and a button rendered by the root component, followed by the module script tag.',
  },

  internals: {
    beginner: `
\`createApp\` builds a container object for your app's settings. \`mount\` finds the element you named, empties it, asks the root component to render, and puts the resulting elements inside. From then on, Vue updates that element whenever your data changes — and leaves the rest of the page alone.
`,
    technical: [
      `
\`createApp(root, rootProps)\` creates an **app context**: an object holding \`config\`, the global \`components\` and \`directives\` registries, \`provides\`, and installed plugins. Every component instance created inside this app keeps a reference to that context, which is how a template can resolve a globally registered \`<BaseButton>\` or \`inject()\` an app-level value.

\`app.mount(container)\`:

1. **normalises the container** — a string goes through \`document.querySelector\`; if nothing matches, Vue warns and does not mount;
2. **clears** the container's existing content;
3. creates a **virtual node** for the root component with the root props, and renders it into the container;
4. marks the container with \`data-v-app\` and returns the root component's public instance.
`,
      {
        code: `// A simplified model of what createApp/mount do — not Vue's real source
function createApp(rootComponent, rootProps = null) {
  const context = { config: {}, components: {}, provides: {}, plugins: new Set() }
  let isMounted = false

  const app = {
    use(plugin, ...options) { plugin.install(app, ...options); return app },
    component(name, comp) { context.components[name] = comp; return app },
    provide(key, value) { context.provides[key] = value; return app },
    config: context.config,
    mount(selectorOrEl) {
      if (isMounted) return warn('App has already been mounted.')
      const container = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl
      if (!container) return warn('Failed to mount app: mount target selector returned null.')
      container.textContent = ''                      // existing content is replaced
      const vnode = createVNode(rootComponent, rootProps)
      vnode.appContext = context                      // every component can reach app config
      render(vnode, container)
      isMounted = true
      return vnode.component.proxy                    // the ROOT COMPONENT instance
    },
  }
  return app
}`,
        lang: 'js',
        title: 'mental model (simplified)',
      },
    ],
    production: `
- **\`main.js\` is your composition root**: the one place that wires plugins (router, Pinia, i18n), error reporting and global configuration. Keep it short and declarative.
- **Error reporting:** set \`app.config.errorHandler\` to forward errors (with \`info\` and the component name) to your monitoring tool. It catches errors from rendering, lifecycle hooks, watchers, setup and event handlers — but not from, say, a \`setTimeout\` callback Vue does not manage, so also listen for \`window\` \`error\` / \`unhandledrejection\`. See [Error handling patterns](lesson:error-handling).
- **App factories for tests and SSR:** export a function that creates and configures a fresh app (\`export function createShopApp() { … return app }\`) so tests and server rendering never share state between instances.
- **Global registration is a trade-off:** globally registered components cannot be tree-shaken away and hide where a component comes from. Reserve it for a few truly universal base components.
- **Server-rendered pages:** \`createApp().mount()\` replaces the container's HTML. To take over HTML that the server already rendered with Vue, use \`createSSRApp()\` and hydration ([Hydration](lesson:hydration)). Nuxt does this for you.
`,
  },

  mistakes: [
    {
      title: 'Chaining after mount()',
      wrong: { code: `createApp(App).mount('#app').use(router)\n// TypeError: ….use is not a function`, lang: 'js' },
      right: { code: `createApp(App).use(router).mount('#app')`, lang: 'js' },
      explanation: '`mount()` returns the root component instance, which has no `use()` method. Configure first, mount last.',
    },
    {
      title: 'Registering things after the app has mounted',
      wrong: { code: `const app = createApp(App)\napp.mount('#app')\napp.component('BaseButton', BaseButton) // too late for the first render`, lang: 'js' },
      right: { code: `const app = createApp(App)\napp.component('BaseButton', BaseButton)\napp.mount('#app')`, lang: 'js' },
      explanation: 'The first render happens inside `mount()`. Components rendered then cannot resolve a global component or plugin that does not exist yet — you get "Failed to resolve component" warnings.',
    },
    {
      title: 'A selector that does not match the HTML',
      wrong: { code: `<!-- index.html -->\n<div id="root"></div>\n\n// main.js\ncreateApp(App).mount('#app')`, lang: 'js' },
      right: { code: `<!-- index.html -->\n<div id="app"></div>\n\n// main.js\ncreateApp(App).mount('#app')`, lang: 'js' },
      explanation: 'Vue warns `Failed to mount app: mount target selector "#app" returned null` and the page stays blank. The id in `index.html` and the selector in `main.js` must match.',
    },
    {
      title: 'Expecting the container\'s existing content to survive',
      wrong: { code: `<div id="app">\n  <h1>Server-rendered title</h1>  <!-- disappears on mount -->\n</div>`, lang: 'html' },
      explanation: 'Mounting replaces the container\'s content with the root component\'s output. If the server already rendered the HTML with Vue, use `createSSRApp()` + hydration; otherwise mount into an empty container.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: Failed to mount app: mount target selector "#app" returned null.`',
      cause: 'No element matches the selector — a typo, a different id in `index.html`, or the script ran before the element existed.',
      fix: 'Match the id exactly. With Vite, the module script at the end of `<body>` runs after the element exists.',
    },
    {
      symptom: '`TypeError: createApp(...).mount(...).use is not a function`.',
      cause: '`mount()` was called before `use()` in a chain.',
      fix: 'Move `.mount(\'#app\')` to the end.',
    },
    {
      symptom: '`[Vue warn]: Failed to resolve component: BaseButton`.',
      cause: 'The component was never registered, was registered after `mount()`, or (with `<script setup>`) was not imported in this file.',
      fix: 'Register it before `mount()` with `app.component()`, or import it locally in the component that uses it.',
    },
    {
      symptom: '`[Vue warn]: App has already been mounted.`',
      cause: '`mount()` was called twice on the same app instance (often in tests or hot-reload code).',
      fix: 'Create a new app per mount — wrap creation in a factory function.',
    },
    {
      symptom: 'With the CDN build, users briefly see raw `{{ }}` text before the app appears.',
      cause: 'The in-DOM template is visible before Vue compiles and mounts it.',
      fix: 'Add `v-cloak` to the container and the CSS rule `[v-cloak] { display: none }`. Vue removes the attribute on mount. (With Vite and `.vue` files this does not happen.)',
    },
  ],

  bestPractices: [
    'Follow the order create → configure → mount, and keep `mount()` as the last call.',
    'Keep `main.js` small: it wires plugins and app-level settings; features live in components and stores.',
    'Set `app.config.errorHandler` early so no uncaught component error goes unreported.',
    'Prefer local component imports; register globally only a few base components used everywhere.',
    'Wrap app creation in a factory function when you need fresh instances (tests, SSR, remounting).',
  ],

  useCases: [
    'Installing Vue Router and Pinia for a single-page app.',
    'Mounting independent widgets (search, cart, chat) onto a server-rendered page, each as its own app.',
    'Passing server-provided configuration into the root component through root props.',
    'Centralising error reporting with `app.config.errorHandler`.',
    'Registering a small design-system base layer (`BaseButton`, `BaseIcon`) globally.',
  ],

  whenToUse: {
    use: [
      'Every Vue 3 app needs exactly this: one `createApp()` per independent app, mounted once.',
      'Multiple `createApp()` calls when separate parts of a page should be independent apps with their own configuration.',
      'Root props when data comes from outside the Vue app (e.g. server-rendered data attributes).',
    ],
    avoid: [
      'Creating several apps when the pieces need tight shared state and coordination — one app (possibly with `<Teleport>`) is simpler.',
      'Registering every component globally "for convenience" — it hides dependencies and blocks tree-shaking.',
      'Using `app.config.globalProperties` as a dumping ground — prefer imports, composables or `provide`/`inject`.',
    ],
  },

  comparison: {
    title: 'Vue 2 global API vs Vue 3 application API',
    headers: ['', 'Vue 2 (global `Vue`)', 'Vue 3 (app instance)'],
    rows: [
      ['Create', '`new Vue({ render: h => h(App) })`', '`createApp(App)`'],
      ['Mount', '`.$mount(\'#app\')` or the `el` option', '`.mount(\'#app\')`'],
      ['Plugins', '`Vue.use(VueRouter)` — affects every instance', '`app.use(router)` — this app only'],
      ['Global components', '`Vue.component(\'X\', X)`', '`app.component(\'X\', X)`'],
      ['Global properties', '`Vue.prototype.$api = api`', '`app.config.globalProperties.$api = api`'],
      ['Several apps with different config', 'awkward — configuration is shared', 'natural — each app is isolated'],
    ],
    note: 'If you maintain Vue 2 code, this table is most of what changes in `main.js` during a migration. See [Refactoring & migrating legacy Vue code](lesson:legacy-migration).',
  },

  quiz: [
    {
      id: 'create-app-mount-q1',
      type: 'mcq',
      prompt: 'What does `app.mount(\'#app\')` return?',
      options: [
        { text: 'The root component instance.' },
        { text: 'The app instance, so you can keep chaining `.use()`.', why: 'That is what `use()`, `component()` and `provide()` return — `mount()` is different.' },
        { text: 'A Promise that resolves when rendering finishes.', why: 'Mounting a normal app is synchronous; it returns an object, not a Promise.' },
        { text: 'Nothing (`undefined`) — it only renders.', why: 'It returns the root component instance (it returns nothing only when mounting fails or the app is already mounted).' },
      ],
      answer: 0,
      explanation: '`mount()` returns the root component\'s public instance. That is why it must be the last call in a chain.',
    },
    {
      id: 'create-app-mount-q2',
      type: 'output',
      prompt: 'What happens when this code runs?',
      code: {
        lang: 'js',
        code: `const app = createApp(App)
app.mount('#app')
app.mount('#app')`,
      },
      options: [
        { text: 'App renders once; the second call only logs a warning that the app is already mounted.' },
        { text: 'App renders twice, one copy after the other.', why: 'An app instance can only be mounted once.' },
        { text: 'The second call unmounts and remounts the app.', why: 'Vue does not remount automatically; you would need `unmount()` and a new app.' },
        { text: 'It throws an error and the page goes blank.', why: 'The first mount succeeded; the second call is ignored with a warning.' },
      ],
      answer: 0,
      explanation: 'In development Vue warns "App has already been mounted" and ignores the second call. To mount again, create a new app instance.',
    },
    {
      id: 'create-app-mount-q3',
      type: 'bug',
      prompt: 'This `main.js` throws `TypeError: … .use is not a function`. Click the line that is in the wrong place.',
      code: {
        lang: 'js',
        code: `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App)
  .mount('#app')
  .use(createPinia())`,
      },
      answerLine: 6,
      explanation: '`mount()` returns the root component instance, which has no `use()` method. Move `.mount(\'#app\')` after `.use(createPinia())`.',
    },
    {
      id: 'create-app-mount-q4',
      type: 'fill',
      prompt: 'Install the router plugin and register `BaseButton` globally, then mount.',
      code: { lang: 'js', code: `const app = createApp(App)\napp.___(router)\napp.___('BaseButton', BaseButton)\napp.mount('#app')` },
      answer: [['use'], ['component']],
      explanation: '`app.use()` installs plugins; `app.component(name, definition)` registers a global component. Both happen before `mount()`.',
    },
    {
      id: 'create-app-mount-q5',
      type: 'mcq',
      prompt: '`index.html` contains `<div id="app"><p>Loading…</p></div>`. What happens to the paragraph when `createApp(App).mount(\'#app\')` runs?',
      options: [
        { text: 'It is removed — the container\'s content is replaced by App\'s output.' },
        { text: 'It stays, and App renders after it.', why: 'Mounting clears the container first.' },
        { text: 'It stays, and App renders before it.', why: 'Mounting clears the container first.' },
        { text: 'Vue refuses to mount into a non-empty element.', why: 'Vue mounts fine; it simply replaces the existing content.' },
      ],
      answer: 0,
      explanation: 'That makes a "Loading…" placeholder inside `#app` a handy trick: it shows until the app mounts, then disappears automatically.',
    },
    {
      id: 'create-app-mount-q6',
      type: 'mcq',
      prompt: 'Select **all** the things you should normally do *before* calling `app.mount()`.',
      options: [
        { text: '`app.use(router)`' },
        { text: '`app.component(\'BaseIcon\', BaseIcon)`' },
        { text: 'Setting `app.config.errorHandler`' },
        { text: '`app.unmount()`', why: '`unmount()` tears a mounted app down — it only makes sense after mounting.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Plugins, global components and error handling must be in place before the first render, which happens inside `mount()`.',
    },
    {
      id: 'create-app-mount-q7',
      type: 'short',
      prompt: 'Why did Vue 3 replace `new Vue()` and the global `Vue.use()` with `createApp()` and `app.use()`?',
      answer: 'In Vue 2, plugins, global components and mixins were registered on the single global `Vue` object, so they leaked into every app on the page and into tests. `createApp()` returns an isolated app instance with its own configuration, so several apps can coexist with different settings and tests can create clean apps.',
    },
  ],

  exercises: [
    {
      id: 'boot-the-app',
      title: 'Boot the app yourself',
      difficulty: 'beginner',
      prompt: `
\`main.js\` imports everything but never starts the app. Finish it:

- Create the app from \`App\` and pass the root prop \`title: 'Night Market'\`.
- Register \`AppIcon\` **globally** under the name \`'AppIcon'\` (\`App.vue\` uses \`<AppIcon />\` without importing it).
- Mount the app on \`#app\`.

When it works, the \`<h1>\` shows **Night Market** and an element with \`class="app-icon"\` appears.
`,
      files: {
        'main.js': `import { createApp } from 'vue'
import App from './App.vue'
import AppIcon from './components/AppIcon.vue'

// TODO 1: create the app with the root prop title: 'Night Market'
// TODO 2: register AppIcon globally
// TODO 3: mount it on #app
`,
        'App.vue': `<script setup>
defineProps({ title: String })
</script>

<template>
  <header>
    <AppIcon />
    <h1>{{ title }}</h1>
  </header>
</template>`,
        'components/AppIcon.vue': `<template>
  <span class="app-icon" aria-hidden="true">🏮</span>
</template>`,
      },
      hints: [
        "Start with `const app = createApp(App, { title: 'Night Market' })`.",
        "Global registration: `app.component('AppIcon', AppIcon)`.",
        "Finish with `app.mount('#app')` — after the registration.",
      ],
      solution: {
        explanation: 'Create, configure, mount — in that order. The root prop flows into `App` through `defineProps`, and the global registration lets every template in this app use `<AppIcon />` without an import.',
        files: {
          'main.js': `import { createApp } from 'vue'
import App from './App.vue'
import AppIcon from './components/AppIcon.vue'

const app = createApp(App, { title: 'Night Market' })
app.component('AppIcon', AppIcon)
app.mount('#app')`,
          'App.vue': `<script setup>
defineProps({ title: String })
</script>

<template>
  <header>
    <AppIcon />
    <h1>{{ title }}</h1>
  </header>
</template>`,
          'components/AppIcon.vue': `<template>
  <span class="app-icon" aria-hidden="true">🏮</span>
</template>`,
        },
      },
      tests: [
        { name: 'the app mounts and shows the root prop', code: `expect(text('h1')).toBe('Night Market')` },
        { name: 'AppIcon is registered globally and renders', code: `expect(exists('.app-icon')).toBe(true)` },
        { name: 'the container is marked as a Vue app', code: `expect(document.getElementById('app').hasAttribute('data-v-app')).toBe(true)` },
      ],
    },
    {
      id: 'two-widgets',
      title: 'Two widgets, two apps',
      difficulty: 'beginner',
      prompt: `
You are adding Vue to an existing page that has two separate slots. \`main.js\` already creates them inside \`#app\`:
\`<div id="cart-widget"></div>\` and \`<div id="chat-widget"></div>\`.

- Mount \`CartWidget.vue\` as its **own app** in \`#cart-widget\`.
- Mount \`ChatWidget.vue\` as **another app** in \`#chat-widget\`.
- Each widget keeps its own state: adding to the cart must not change the chat.
`,
      files: {
        'main.js': `import { createApp } from 'vue'
import CartWidget from './CartWidget.vue'
import ChatWidget from './ChatWidget.vue'

// Simulates a server-rendered page with two empty slots for widgets.
document.getElementById('app').innerHTML =
  '<div id="cart-widget"></div><div id="chat-widget"></div>'

// TODO: mount CartWidget in #cart-widget and ChatWidget in #chat-widget
`,
        'CartWidget.vue': `<script setup>
import { ref } from 'vue'
const items = ref(0)
</script>

<template>
  <section class="cart">
    🛒 <span class="cart-count">{{ items }}</span> items
    <button class="add" @click="items++">Add</button>
  </section>
</template>`,
        'ChatWidget.vue': `<script setup>
import { ref } from 'vue'
const unread = ref(2)
</script>

<template>
  <section class="chat">
    💬 <span class="unread">{{ unread }}</span> unread
    <button class="read" @click="unread = 0">Mark read</button>
  </section>
</template>`,
      },
      hints: [
        'You need two `createApp()` calls — one per widget.',
        "`createApp(CartWidget).mount('#cart-widget')` — the selector points at the slot.",
        "Add `createApp(ChatWidget).mount('#chat-widget')` on the next line.",
      ],
      solution: {
        explanation: 'Each `createApp()` call creates an independent application with its own component tree, state and configuration. This is how Vue is progressively added to existing pages: one small app per interactive island.',
        files: {
          'main.js': `import { createApp } from 'vue'
import CartWidget from './CartWidget.vue'
import ChatWidget from './ChatWidget.vue'

// Simulates a server-rendered page with two empty slots for widgets.
document.getElementById('app').innerHTML =
  '<div id="cart-widget"></div><div id="chat-widget"></div>'

createApp(CartWidget).mount('#cart-widget')
createApp(ChatWidget).mount('#chat-widget')`,
          'CartWidget.vue': `<script setup>
import { ref } from 'vue'
const items = ref(0)
</script>

<template>
  <section class="cart">
    🛒 <span class="cart-count">{{ items }}</span> items
    <button class="add" @click="items++">Add</button>
  </section>
</template>`,
          'ChatWidget.vue': `<script setup>
import { ref } from 'vue'
const unread = ref(2)
</script>

<template>
  <section class="chat">
    💬 <span class="unread">{{ unread }}</span> unread
    <button class="read" @click="unread = 0">Mark read</button>
  </section>
</template>`,
        },
      },
      tests: [
        { name: 'the cart widget is mounted in its slot', code: `expect(exists('#cart-widget .cart')).toBe(true)` },
        { name: 'the chat widget is mounted in its slot', code: `expect(exists('#chat-widget .chat')).toBe(true)` },
        {
          name: 'the widgets keep separate state',
          code: `await click('#cart-widget .add')
await click('#cart-widget .add')
expect(text('.cart-count')).toBe('2')
expect(text('.unread')).toBe('2')
await click('#chat-widget .read')
expect(text('.unread')).toBe('0')
expect(text('.cart-count')).toBe('2')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'create-app-mount-returns',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What do `createApp()` and `app.mount()` each return, and why does that matter?',
      answer: '`createApp()` returns the application instance; its configuration methods (`use`, `component`, `directive`, `provide`, `mixin`) also return the app, so they can be chained. `mount()` returns the root component instance instead, so it must be the final call — chaining `.use()` after it fails.',
      explanation: 'Two different objects: the app (configuration) and the root component instance (the running UI).',
      whyAsked: 'A quick check that you have actually written `main.js` and understand the app lifecycle.',
      mistakes: ['Saying both return the app.', 'Not knowing why `createApp(App).mount(\'#app\').use(router)` breaks.'],
      followUps: ['What is the root component instance useful for?', 'What happens if you call mount twice?'],
      modelAnswer: "createApp returns the application instance — the object that holds this app's configuration. Its configuration methods like use, component, directive and provide return the same app, which is why we can chain them. mount is different: it renders the root component into the container and returns the root component instance. So mount has to be the last call in the chain; putting use after it throws because a component instance has no use method.",
    },
    {
      id: 'create-app-mount-vs-new-vue',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Why did Vue 3 move from `new Vue()` and global APIs like `Vue.use()` to `createApp()`?',
      answer: 'In Vue 2, plugins, global components, directives, mixins and prototype properties were registered on the single global `Vue` constructor, so every app — and every test — inherited them. That made multiple differently configured apps on one page awkward and caused test pollution. `createApp()` returns an isolated app instance whose `use`, `component` and `config` affect only that app.',
      explanation: 'Global mutable state is the problem; app-scoped configuration is the fix.',
      code: {
        lang: 'js',
        code: `// Vue 2 — leaks into every app and test
Vue.use(VueRouter)
Vue.component('BaseButton', BaseButton)

// Vue 3 — scoped to this app
const app = createApp(App)
app.use(router)
app.component('BaseButton', BaseButton)`,
      },
      whyAsked: 'Common in teams that migrated from Vue 2; also tests understanding of global state problems in general.',
      mistakes: ['Saying it was "just renamed".', 'Not mentioning testing or multiple apps.'],
      followUps: ['What replaced `Vue.prototype`?', 'How would you create a fresh app per test?'],
      modelAnswer: "In Vue 2, configuration lived on the global Vue constructor: Vue.use, Vue.component, Vue.mixin and Vue.prototype all mutated shared state. Every Vue instance inherited it, so two apps on the same page couldn't have different plugins, and tests leaked configuration into each other. Vue 3's createApp returns an app instance with its own context, and use, component, directive and config only affect that app. Vue.prototype became app.config.globalProperties. The result is cleaner testing, SSR and multi-app pages.",
    },
    {
      id: 'create-app-mount-late-plugin',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After a refactor, the app shows `Failed to resolve component: RouterView` and the page is blank where routes should render. What would you check first?',
      answer: 'Check that `app.use(router)` runs before `app.mount()`. Vue Router registers `RouterView` and `RouterLink` globally when installed; if the app mounts first, the initial render cannot resolve them. Also check the chain order (`.use()` after `.mount()` throws) and that the router module is actually imported.',
      explanation: 'Plugins register global components and provide values. They must be installed before the first render.',
      code: {
        lang: 'js',
        code: `// ❌ refactored version
const app = createApp(App)
app.mount('#app')
app.use(router)

// ✅
const app = createApp(App)
app.use(router)
app.mount('#app')`,
      },
      whyAsked: 'Ordering bugs in `main.js` are common after refactors; it shows you know what plugins actually do.',
      mistakes: ['Reinstalling vue-router.', 'Importing RouterView manually in every component instead of fixing the order.'],
      followUps: ['What does a plugin\'s install function typically do?', 'How does `inject()` relate to `app.provide()`?'],
      modelAnswer: "That warning means the RouterView component isn't registered at the time a template tries to use it. Vue Router registers RouterView and RouterLink globally in its install function, so my first check is main.js: app.use(router) must happen before app.mount, because the first render happens inside mount. If someone moved mount above use, or chained use after mount, that's the bug. I'd also confirm the router file is imported and exports the router instance.",
    },
    {
      id: 'create-app-mount-container-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'Given `<div id="app"><p>Loading…</p></div>` and `createApp(App).mount(\'#app\')` where App renders `<h1>Hi</h1>`, what is inside `#app` after mounting?',
      options: ['<p>Loading…</p><h1>Hi</h1>', '<h1>Hi</h1>', '<h1>Hi</h1><p>Loading…</p>', 'Nothing — Vue refuses non-empty containers'],
      correctOption: 1,
      answer: 'Only `<h1>Hi</h1>`. Mounting clears the container and renders the root component inside it (Vue also adds a `data-v-app` attribute to the container).',
      explanation: 'The container\'s previous content is replaced, which is why a loading placeholder inside `#app` disappears automatically.',
      whyAsked: 'Checks understanding of what Vue owns on the page — relevant for server-rendered pages and loading states.',
      mistakes: ['Thinking Vue appends to existing content.', 'Confusing a normal mount with SSR hydration.'],
      followUps: ['How would you reuse server-rendered markup instead of replacing it?', 'What is `v-cloak` for?'],
      modelAnswer: "Just the h1. When an app mounts, Vue clears the container and renders the root component into it, so the Loading paragraph is gone — which is actually a neat way to show a placeholder until the app is ready. If I needed to keep and take over server-rendered HTML, I'd use createSSRApp with hydration instead of a plain mount.",
    },
    {
      id: 'create-app-mount-widgets',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A CMS page needs three Vue widgets in different places: a search box, a cart and a newsletter form. The cart and search must share the logged-in user. How would you structure it?',
      answer: 'Either mount three small apps (one `createApp()` per container) or one app that renders into the other places with `<Teleport>`. Separate apps are fully isolated, so shared data must live outside them — for example a module that exports a `reactive()` object both apps import, since Vue reactivity works across app instances. If the widgets coordinate heavily, a single app with Teleport keeps one component tree, one store and one set of plugins.',
      explanation: 'Isolation is a feature of multiple apps, and also their cost: you have to share state deliberately.',
      code: {
        lang: 'js',
        code: `// session.js — shared reactive state, independent of any app
import { reactive } from 'vue'
export const session = reactive({ user: null })

// main.js
createApp(SearchBox).mount('#search')
createApp(CartWidget).mount('#cart')
createApp(NewsletterForm).mount('#newsletter')`,
      },
      whyAsked: 'Progressive enhancement of existing sites is extremely common. This shows you can reason about app boundaries.',
      mistakes: ['Assuming separate apps automatically share global components or provides.', 'Letting non-Vue scripts modify the widgets\' DOM.'],
      followUps: ['What would change if all three needed the same Pinia store?', 'How does Teleport help here?'],
      modelAnswer: "I'd first decide whether these are really independent. If they are, three createApp calls, each mounted on its own container, keeps them isolated and simple. Because separate apps don't share provides or global components, shared data like the user has to live outside them — a small module exporting a reactive object works, because reactivity isn't tied to an app instance. If the widgets coordinate a lot, I'd prefer one app that renders the other pieces into their slots with Teleport, so there's one component tree, one store and one configuration.",
    },
    {
      id: 'create-app-mount-error-reporting',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How would you set up global error reporting for a production Vue app? What does `app.config.errorHandler` catch, and what does it miss?',
      answer: '`app.config.errorHandler(err, instance, info)` receives uncaught errors from component rendering, `setup()`, lifecycle hooks, watchers, event handlers (including rejected promises they return), custom directive hooks and transition hooks within that app. It does not see errors from code Vue does not run — e.g. a bare `setTimeout` callback or a promise rejection nobody returns to Vue — so add `window` `error` and `unhandledrejection` listeners as well. Forward everything to a monitoring service with context (component name, `info`, route), and use `onErrorCaptured` for local error boundaries.',
      explanation: 'Vue can only report errors that pass through code it calls. Everything else needs browser-level listeners.',
      code: {
        lang: 'js',
        code: `app.config.errorHandler = (err, instance, info) => {
  reportError(err, {
    component: instance?.$options.name ?? instance?.$options.__name,
    info, // e.g. "component event handler", "render function"
  })
}
window.addEventListener('unhandledrejection', (e) => reportError(e.reason))`,
      },
      whyAsked: 'Production readiness: seniors are expected to know where errors go and where gaps are.',
      mistakes: ['Assuming errorHandler catches every error on the page.', 'Swallowing errors without logging them in development.', 'Not including context, which makes reports useless.'],
      followUps: ['How does `onErrorCaptured` differ from the app-level handler?', 'How would you avoid reporting the same error twice?'],
      modelAnswer: "I'd set app.config.errorHandler in main.js before mounting. It receives uncaught errors from anything Vue executes in that app: render functions, setup, lifecycle hooks, watchers, event handlers — including promises those handlers return — and directive and transition hooks. It also gets the component instance and an info string, which I'd forward to the monitoring service along with the current route. It can't see errors from code Vue doesn't call, like a plain setTimeout callback or an unreturned promise, so I'd add window error and unhandledrejection listeners too. For local fallbacks, like a widget that shows 'something went wrong', I'd use onErrorCaptured as an error boundary.",
    },
    {
      id: 'create-app-mount-coding-handler',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 5,
      question: 'Configure the app so that every uncaught component error is logged with `console.error(\'[app error] \' + err.message)`. Then mount it on `#app`. Clicking the **Pay** button (`class="pay"`) should produce `[app error] Card declined` in the console.',
      starter: {
        files: {
          'main.js': `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
// TODO: add an app-level error handler
app.mount('#app')`,
          'App.vue': `<script setup>
function pay() {
  throw new Error('Card declined')
}
</script>

<template>
  <button class="pay" @click="pay">Pay</button>
</template>`,
        },
      },
      tests: [
        {
          name: 'the error handler logs a prefixed message',
          code: `await click('.pay')
expect(logs.some((l) => l.includes('[app error] Card declined'))).toBe(true)`,
        },
        { name: 'the app is still mounted', code: `expect(exists('.pay')).toBe(true)` },
      ],
      hints: ['The property is `app.config.errorHandler`.', 'It receives `(err, instance, info)`; you only need `err.message`. Assign it before `app.mount()`.'],
      answer: 'Assign a function to `app.config.errorHandler` before mounting.',
      solution: {
        files: {
          'main.js': `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.config.errorHandler = (err) => {
  console.error('[app error] ' + err.message)
}
app.mount('#app')`,
          'App.vue': `<script setup>
function pay() {
  throw new Error('Card declined')
}
</script>

<template>
  <button class="pay" @click="pay">Pay</button>
</template>`,
        },
      },
      explanation: 'Vue wraps event handlers and routes their uncaught errors to the app-level handler. Real apps forward these to an error-monitoring service.',
      whyAsked: 'Shows familiarity with app-level configuration and production error handling basics.',
      mistakes: ['Wrapping every handler in try/catch manually.', 'Setting the handler after mount and missing errors during the first render.'],
      followUps: ['What extra context does the `info` argument give you?', 'Which errors would this handler not see?'],
      modelAnswer: "I'd assign a function to app.config.errorHandler before calling mount. Vue calls it with the error, the component instance and an info string for any uncaught error in code it runs — here the click handler — so I log the prefixed message. In production that function would forward the error and context to our monitoring tool instead of just the console.",
    },
  ],

  takeaways: [
    '`createApp(App, rootProps?)` creates an isolated app instance around the root component.',
    'Configure before mounting: `app.use()`, `app.component()`, `app.provide()`, `app.config.errorHandler`.',
    '`app.mount(selectorOrElement)` renders into the container, replacing its content, and returns the root component instance — so it goes last.',
    'An app mounts once; several apps can live on one page, each with its own configuration.',
    'Vue 3\'s app API replaces Vue 2\'s global `new Vue()`, `Vue.use()` and `Vue.prototype`.',
  ],
}
