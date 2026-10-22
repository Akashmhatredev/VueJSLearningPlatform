// Lesson: Plugins & app-level configuration.

const mainFile = `import { createApp } from 'vue'
import App from './App.vue'
import money from './money.js'

const app = createApp(App)

// install the plugin, with options
app.use(money, { currency: 'EUR', locale: 'en-IE' })

app.mount('#app')`

const moneyPlugin = `import { inject } from 'vue'

// An injection key: a Symbol can't collide with anyone else's key
export const moneyKey = Symbol('money')

export default {
  install(app, options = {}) {
    const { currency = 'EUR', locale = 'en-IE' } = options
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency })
    const format = (amount) => formatter.format(amount)

    // 1. for templates (and the Options API): {{ $money(price) }}
    app.config.globalProperties.$money = format

    // 2. for <script setup> and composables: useMoney()
    app.provide(moneyKey, { format, currency })
  },
}

// a tiny composable so components don't need to know the key
export function useMoney() {
  const money = inject(moneyKey)
  if (!money) throw new Error('useMoney() needs the money plugin: app.use(money)')
  return money
}`

const basketApp = `<script setup>
import { computed } from 'vue'
import { useMoney } from './money.js'
import { lastError } from './errors.js'
import ProductRow from './ProductRow.vue'

const products = [
  { id: 1, name: 'Trail Backpack', price: 89 },
  { id: 2, name: 'Camp Stove', price: 45.5 },
]

const { format } = useMoney()
const total = computed(() => format(products.reduce((sum, p) => sum + p.price, 0)))

function checkout() {
  // pretend the payment service is down
  throw new Error('Payment service unavailable')
}
</script>

<template>
  <h2>Basket</h2>
  <ProductRow v-for="p in products" :key="p.id" :product="p" />
  <p class="total">Total: {{ total }}</p>
  <button class="buy" @click="checkout">Buy now</button>
  <p v-if="lastError" class="error-banner">Sorry — {{ lastError }}</p>
</template>`

const productRow = `<script setup>
defineProps({
  product: { type: Object, required: true },
})
</script>

<template>
  <p class="row">
    {{ product.name }} — <span class="price">{{ $money(product.price) }}</span>
  </p>
</template>`

const priceTag = `<script setup>
defineProps({
  amount: { type: Number, required: true },
})
</script>

<template>
  <span class="price-tag">{{ $money(amount) }}</span>
</template>

<style scoped>
.price-tag {
  background: #dcff1e;
  border: 2px solid #1a1a1a;
  padding: 0 6px;
  font-weight: 700;
}
</style>`

const errorsFile = `import { ref } from 'vue'

// the message of the most recent uncaught error, for a friendly banner
export const lastError = ref(null)`

export default {
  id: 'plugins-app-config',
  title: 'Plugins & app-level configuration',
  summary: 'Bundle app-wide features — global components, directives, injected services and $helpers — into installable plugins, and configure the app instance, including error handling, in one place.',
  difficulty: 'intermediate',
  minutes: 36,
  prerequisites: ['create-app-mount', 'provide-inject'],
  related: ['custom-directives', 'error-handling', 'pinia-basics', 'composables-intro', 'router-basics'],
  tags: ['plugin', 'app.use', 'install', 'globalProperties', 'app.provide', 'app.component', 'app.directive', 'app.config', 'errorHandler', 'warnHandler', 'runWithContext'],
  apis: [
    { name: 'app.use(plugin, options?)', summary: 'Installs a plugin: calls `plugin.install(app, options)` (or `plugin(app, options)` if it is a function). Installing the same plugin twice is ignored.' },
    { name: 'app.config.globalProperties', summary: 'Properties available on every component instance — in templates and the Options API `this` (e.g. `$money`).' },
    { name: 'app.provide(key, value)', summary: 'Provides a value to every component in the app, readable with `inject(key)`.' },
    { name: 'app.component(name, comp) / app.directive(name, dir)', summary: 'Registers a component or directive globally.' },
    { name: 'app.config.errorHandler', summary: '`(err, instance, info) => …` — receives uncaught errors from renders, setup, lifecycle hooks, watchers, event handlers and more.' },
    { name: 'app.config.warnHandler', summary: 'Receives Vue runtime warnings — development builds only.' },
    { name: 'app.runWithContext(fn)', summary: 'Vue 3.3+: runs `fn` with the app as the injection context, so `inject()` works outside components.' },
  ],
  docs: [
    { label: 'Vue Guide — Plugins', url: 'https://vuejs.org/guide/reusability/plugins.html' },
    { label: 'API — Application (app.use, app.provide, app.config…)', url: 'https://vuejs.org/api/application.html' },
    { label: 'API — app.config.errorHandler', url: 'https://vuejs.org/api/application.html#app-config-errorhandler' },
    { label: 'API — app.config.globalProperties', url: 'https://vuejs.org/api/application.html#app-config-globalproperties' },
  ],

  intro: `
Some features belong to the **whole app**, not to one component: formatting money in the user's currency, translations, a toast system, analytics, a design system's components. A **plugin** is how you package such a feature so it can be switched on with one line:

\`\`\`js
app.use(money, { currency: 'EUR' })
\`\`\`

A plugin is just an object with an \`install(app, options)\` method (or a plain function). Inside, it uses the **app instance** you created with \`createApp()\` to register things app-wide: global components and directives, values every component can \`inject\`, and \`$helper\` properties for templates.

The same app instance also has \`app.config\` — the place for app-level settings such as a global **error handler**. You've already used plugins: [Pinia](lesson:pinia-basics) and [Vue Router](lesson:router-basics) are both installed with \`app.use()\` (they're separate libraries, not part of Vue core).
`,

  why: `
Without plugins, an app-wide feature gets wired up by hand in many places: every component imports the formatter, every page registers the same components, each team member configures the library slightly differently.

A plugin gives you:

- **one switch** — install, configure and (if needed) remove the feature in \`main.js\`;
- **options** — the same plugin works for EUR in one app and USD in another;
- **a stable public API** — components use \`useMoney()\` or \`$money()\` without knowing how it's built;
- **shareability** — publish it as a package (that's exactly what Vue Router, Pinia and UI libraries are).

App-level configuration solves a related problem: some decisions — what happens when *any* component throws, which warnings to filter, what prefix generated IDs use — only make sense once, for the whole app.
`,

  eli15: `
Think of a new phone. Out of the box it does the basics. Then you **install apps** — a translator, a calculator, a camera filter — and suddenly every part of the phone can use them: you can translate a message, a web page or a note.

A Vue plugin is an app for your Vue app. When you write \`app.use(money)\`, the plugin's \`install\` function runs once and adds things that **every component** can use — like a \`$money()\` helper that turns \`89\` into \`€89.00\`.

And the phone's **Settings** screen is \`app.config\`: one place to decide things for the whole phone, like "if any app crashes, show me a friendly message instead of a blank screen" — that's \`app.config.errorHandler\`.
`,

  analogy: {
    title: 'Installing apps on a phone',
    body: `
An app installer runs once, asks for a few preferences (language, region), and then adds icons, share-menu entries and services the rest of the phone can use. The phone's Settings screen holds the global behaviour.

\`app.use(plugin, options)\` is the installer, \`install(app, options)\` is the setup wizard, and what it registers — components, directives, provided services, global properties — are the icons and services. \`app.config\` is Settings.
`,
    mapping: [
      ['tapping "install"', '`app.use(plugin, options)` in `main.js`'],
      ['the setup wizard', 'the plugin\'s `install(app, options)` function'],
      ['the preferences you choose', 'the `options` object (currency, locale, duration…)'],
      ['new icons on the home screen', 'global components and directives (`app.component`, `app.directive`)'],
      ['a service every app can call', '`app.provide(key, value)` + `inject(key)` / a `useX()` composable'],
      ['the phone\'s Settings screen', '`app.config` — `errorHandler`, `warnHandler`, `globalProperties`…'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'What a plugin does at install time',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'create', label: 'createApp(App)', note: 'the app instance', tone: 'paper', x: 100, y: 60 },
        { id: 'use', label: 'app.use(money, options)', note: 'in main.js', tone: 'cobalt', x: 330, y: 60 },
        { id: 'install', label: 'install(app, options)', note: 'runs once', tone: 'cobalt', x: 580, y: 60 },
        { id: 'globals', label: 'globalProperties.$money', note: 'templates / this', tone: 'acid', x: 160, y: 200 },
        { id: 'provide', label: 'app.provide(moneyKey)', note: 'inject / useMoney()', tone: 'acid', x: 400, y: 200 },
        { id: 'register', label: 'app.component / directive', note: 'global registration', tone: 'acid', x: 630, y: 200 },
        { id: 'mount', label: 'app.mount(\'#app\')', note: 'every component can use them', tone: 'kraft', x: 400, y: 290 },
      ],
      edges: [
        { from: 'create', to: 'use' },
        { from: 'use', to: 'install', label: 'calls' },
        { from: 'install', to: 'globals' },
        { from: 'install', to: 'provide' },
        { from: 'install', to: 'register' },
        { from: 'provide', to: 'mount' },
      ],
      steps: [
        { focus: ['create'], text: '`createApp(App)` creates an **app instance** — a container for app-wide settings and registrations. Nothing is rendered yet.' },
        { focus: ['use', 'install'], edges: ['create->use', 'use->install'], text: '`app.use(money, { currency: \'EUR\' })` calls the plugin\'s `install(app, options)` once. Installing the same plugin again is ignored (with a development warning).' },
        { focus: ['globals', 'provide', 'register'], edges: ['install->globals', 'install->provide', 'install->register'], text: 'Inside `install`, the plugin uses the app instance: adds global properties for templates, provides services for `inject()`, and registers global components or directives.' },
        { focus: ['mount'], edges: ['provide->mount'], text: 'Then `app.mount()` renders the app. Every component in this app — and only this app — can now use what the plugin registered. That\'s why plugins are installed **before** mounting.' },
      ],
    },
    caption: 'A plugin is a function that receives the app instance and registers app-wide features before the app mounts.',
    alt: 'A flow diagram: createApp(App) leads to app.use(money, options), which calls install(app, options). install branches into three registrations: globalProperties.$money, app.provide(moneyKey) and app.component/directive. Then app.mount renders the app, where every component can use them.',
  },

  animation: {
    type: 'component-flow',
    props: { mode: 'provide-inject' },
    title: 'App-level provide, component-level inject',
    caption: 'A plugin\'s `app.provide()` sits at the very top of this picture — above the root component — so every component in the tree can `inject()` it, however deep, without props being passed down.',
    alt: 'An animated component tree: a value provided at the top flows directly to deeply nested components that inject it, skipping the components in between.',
  },

  syntax: [
    `
#### Writing a plugin
`,
    {
      code: `// i18n.js
import { inject } from 'vue'

export const i18nKey = Symbol('i18n')

export default {
  install(app, options) {
    const t = (key) => options.messages[key] ?? key

    app.provide(i18nKey, { t })               // for inject() / composables
    app.config.globalProperties.$t = t        // for templates: {{ $t('hello') }}
    app.component('LangSwitch', LangSwitch)   // a global component
    app.directive('t', (el, binding) => {     // a global directive: v-t="'hello'"
      el.textContent = t(binding.value)
    })
  },
}

export const useI18n = () => inject(i18nKey)`,
      lang: 'js',
      title: 'an object plugin with install()',
      static: true,
    },
    {
      code: `// main.js
import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n.js'

createApp(App)
  .use(i18n, { messages: { hello: 'Hola' } })  // app.use returns the app: chainable
  .mount('#app')`,
      lang: 'js',
      title: 'installing it',
    },
    `
A plugin can also be a plain function: \`function analytics(app, options) { … }\` — \`app.use(analytics, options)\` calls it directly.

#### \`globalProperties\` vs \`provide\`

| | \`app.config.globalProperties.$money\` | \`app.provide(moneyKey, …)\` + \`useMoney()\` |
|---|---|---|
| in templates | \`{{ $money(price) }}\` | via a variable from \`useMoney()\` |
| Options API | \`this.$money(…)\` | \`inject: { money: { from: moneyKey } }\` |
| \`<script setup>\` JS | **not directly available** (no \`this\`) | \`const { format } = useMoney()\` |
| name clashes | a component's own property wins silently | Symbol keys can't clash |

Most modern plugins offer a composable (\`useI18n()\`, \`useRouter()\`, \`useStore()\`) and treat \`$\` properties as a template convenience. Use global properties sparingly — the Vue docs warn they get confusing when many plugins add them.
`,
    `
#### App-level configuration
`,
    {
      code: `const app = createApp(App)

// any uncaught error from components: renders, setup, lifecycle hooks,
// watchers, event handlers, directive hooks, transition hooks…
app.config.errorHandler = (err, instance, info) => {
  // info: e.g. "mounted hook" in development; a short code in production
  reportToMonitoring(err, info)
}

// Vue warnings — development builds only
app.config.warnHandler = (msg, instance, trace) => {
  if (!msg.includes('Extraneous non-props attributes')) console.warn(msg, trace)
}

app.config.idPrefix = 'shop-'   // Vue 3.5+: prefix for ids from useId()

app.mount('#app')`,
      lang: 'js',
      title: 'app.config essentials',
      static: true,
    },
    {
      callout: 'version',
      title: 'Newer app APIs',
      text: '`app.runWithContext()` (run code with the app as injection context, e.g. in router guards) needs Vue 3.3+. `app.config.idPrefix` and `app.onUnmount()` (register cleanup for when the app unmounts — handy inside plugins) need Vue 3.5+.',
    },
    `
**The rules:**

1. Call \`app.use()\` (and set \`app.config\`) **before** \`app.mount()\`.
2. Everything a plugin registers belongs to **that app instance** — a second \`createApp()\` doesn't see it.
3. Create a plugin's state **inside** \`install\`, not at module level, so each app (and each server-side request) gets its own.
4. Prefer \`app.provide\` + a composable with a \`Symbol\` key; add \`$\` global properties only for template convenience.
`,
  ],

  walkthrough: {
    title: 'money.js — a small plugin',
    lang: 'js',
    code: moneyPlugin,
    intro: 'The plugin used by the playground. It offers the same formatter two ways: a `$money` global property for templates, and a `useMoney()` composable backed by `app.provide`.',
    steps: [
      { lines: [3, 4], text: 'A `Symbol` as the injection key. Unlike a string such as `\'money\'`, no other plugin or component can accidentally use the same key.' },
      { lines: [6, 7], text: 'The plugin is an object with `install(app, options)`. `app.use(money, { … })` calls it once, passing the app instance and the options.' },
      { lines: [8, 10], text: 'Options with defaults configure the feature. The formatter is created **inside** `install`, so two apps with different options each get their own.' },
      { lines: [12, 13], text: '`globalProperties.$money` makes `{{ $money(price) }}` work in every component\'s template (and `this.$money` in the Options API).' },
      { lines: [15, 16], text: '`app.provide` makes the same service available to `inject()` anywhere in this app — which is what `<script setup>` code needs, since it has no `this`.' },
      { lines: [20, 25], text: 'A composable wraps `inject` so components never touch the key, and gives a clear error if someone forgot `app.use(money)`.' },
    ],
  },

  playground: {
    title: 'Basket with a money plugin',
    objective: 'Configure a plugin through options, provide an app-wide value, register a global component from a plugin, and catch errors with app.config.errorHandler.',
    entry: 'main.js',
    files: {
      'main.js': mainFile,
      'money.js': moneyPlugin,
      'App.vue': basketApp,
      'ProductRow.vue': productRow,
      'PriceTag.vue': priceTag,
      'errors.js': errorsFile,
    },
    expected: 'A basket with two products priced in euros (formatted by the plugin), a total, and **Buy now**. Clicking Buy now throws an error: right now it only shows up in the console — no banner appears. `PriceTag.vue` exists but isn\'t used yet.',
    experiments: [
      {
        id: 'options',
        task: 'Switch the shop to US dollars: change only the plugin **options** in `main.js` to `{ currency: \'USD\', locale: \'en-US\' }`.',
        hint: 'One line in `main.js`. No component changes — they all go through the plugin.',
        tests: [
          {
            name: 'prices and total are in dollars',
            code: `expect(text('.price')).toContain('$89.00')
expect(text('.total')).toContain('$134.50')`,
          },
        ],
        explain: 'Options are how one plugin serves many apps. Every component got the new behaviour because none of them hard-coded the currency — they all asked the plugin.',
      },
      {
        id: 'app-provide',
        task: 'Provide the shop name **app-wide** from `main.js` with `app.provide(\'shopName\', \'Trailhead Outfitters\')`, then `inject` it in App.vue and show it in `<p class="shop-name">`.',
        hint: 'In App: `import { inject } from \'vue\'` (add it to the existing import), `const shopName = inject(\'shopName\')`, and render `<p class="shop-name">{{ shopName }}</p>`.',
        tests: [
          {
            name: 'App shows the provided shop name',
            code: `expect(text('.shop-name')).toBe('Trailhead Outfitters')`,
          },
        ],
        explain: '`app.provide` is `provide()` at the very top of the tree — above the root component — so any component can inject it. For anything bigger than a string, prefer a `Symbol` key exported from one module, like `moneyKey`.',
      },
      {
        id: 'global-component',
        task: 'Make the plugin register `PriceTag.vue` as a **global component** called `PriceTag`, then use `<PriceTag :amount="product.price" />` in ProductRow.vue **without importing it there**.',
        hint: 'In money.js: `import PriceTag from \'./PriceTag.vue\'` at the top and `app.component(\'PriceTag\', PriceTag)` inside `install`. In ProductRow, replace the `<span class="price">…</span>` with `<PriceTag :amount="product.price" />`.',
        tests: [
          {
            name: 'every row renders a PriceTag',
            code: `const tags = findAll('.price-tag')
expect(tags).toHaveLength(2)
expect(tags[0].textContent).toContain('89')`,
          },
        ],
        explain: 'Global registration makes a component usable in any template of this app. It\'s convenient for a design system\'s basics, but global components can\'t be tree-shaken and hide where things come from — register only what is used everywhere.',
      },
      {
        id: 'error-handler',
        task: 'Catch the **Buy now** error app-wide: in `main.js`, set `app.config.errorHandler` so that it stores the error\'s message in `lastError` (from `errors.js`). App already shows a banner when `lastError` has a value.',
        hint: '`import { lastError } from \'./errors.js\'`, then before `app.mount`: `app.config.errorHandler = (err, instance, info) => { lastError.value = err.message; console.error(err, info) }`.',
        tests: [
          {
            name: 'the error becomes a friendly banner',
            code: `expect(exists('.error-banner')).toBe(false)
await click('.buy')
expect(text('.error-banner')).toContain('Payment service unavailable')`,
          },
        ],
        explain: 'The handler receives errors from event handlers, lifecycle hooks, watchers, renders and more, with an `info` string saying where it happened ("native event handler" here, in development). In real apps it reports to a monitoring service — and the server must still log and enforce everything on its side.',
      },
    ],
  },

  internals: {
    beginner: `
\`createApp()\` gives you an object that remembers app-wide things: registered components, directives, provided values, settings. \`app.use(plugin)\` simply calls the plugin's \`install\` function with that object, so the plugin can add its things. When the app mounts, every component looks things up in that shared app object.
`,
    technical: [
      `
Each app instance owns an **app context**: \`{ config, components, directives, provides, mixins, … }\`. Every component instance created under that app points to it (\`instance.appContext\`). That's how global registrations and app-level provides reach every component without being passed down.
`,
      {
        code: `// A simplified model of app.use() — not Vue's real source
function use(plugin, ...options) {
  if (installedPlugins.has(plugin)) {
    warn('Plugin has already been applied to target app.')
  } else if (typeof plugin?.install === 'function') {
    installedPlugins.add(plugin)
    plugin.install(app, ...options)
  } else if (typeof plugin === 'function') {
    installedPlugins.add(plugin)
    plugin(app, ...options)
  }
  return app // chainable
}`,
        lang: 'js',
        title: 'mental model of app.use()',
      },
      `
- **\`app.provide(key, value)\`** writes into \`appContext.provides\`. A component's \`inject()\` walks up its parents' provides and ends at the app's — which is why it works at any depth.
- **\`globalProperties\`** are consulted by the component's public instance proxy *last*: setup bindings, data, props and other own properties come first. So a component's own \`format\` silently wins over a global \`format\`.
- **\`errorHandler\`**: when Vue calls your code (setup, hooks, handlers, watchers, render), it wraps the call; on an error (including a rejected promise returned from a handler or hook) it walks up the component chain calling \`errorCaptured\` hooks, and if none stops propagation, calls \`app.config.errorHandler(err, instance, info)\`. In production builds, \`info\` is a short code that maps to the Vue error reference.
- **What it can't see:** errors in code Vue doesn't call — a \`setTimeout\` callback, a third-party library's callback, a promise you didn't return. For those, also listen to the browser's \`error\` and \`unhandledrejection\` events.
`,
    ],
    production: `
- **Per-app state.** Build state inside \`install\` (or via \`app.provide\`), never as module-level singletons. With server-side rendering, a module-level object would be shared between users' requests.
- **Typing \`$\` helpers.** In TypeScript, augment \`ComponentCustomProperties\` from \`'vue'\` so \`$money\` is typed in templates; type provided values with \`InjectionKey<T>\` (static code in a TS project).
- **Error monitoring.** Send \`errorHandler\` reports to a monitoring service with release and route info; also capture \`window\` \`error\`/\`unhandledrejection\`. Show users a friendly fallback, not a stack trace — and remember frontend reporting never replaces server-side logging or authorization. See [Error handling patterns](lesson:error-handling).
- **Don't over-globalize.** Global components and \`$\` properties are invisible dependencies. Prefer explicit imports and composables; reserve global registration for truly ubiquitous pieces.
- **Cleanup.** If a plugin starts timers, sockets or listeners, stop them when the app unmounts (\`app.onUnmount\`, Vue 3.5+) — important for tests and micro-frontends that mount and unmount apps.
- **Order matters.** Install plugins before \`mount()\`; some plugins (like a router) also rely on other plugins being installed first.
`,
  },

  mistakes: [
    {
      title: 'Installing a plugin after mounting',
      wrong: { code: `const app = createApp(App)\napp.mount('#app')\napp.use(money) // components already rendered without it`, lang: 'js' },
      right: { code: `const app = createApp(App)\napp.use(money)\napp.mount('#app')`, lang: 'js' },
      explanation: 'Components that rendered before the plugin was installed couldn\'t resolve its components, globals or injections. Register everything first, then mount.',
    },
    {
      title: 'Using `$helpers` in `<script setup>` code',
      wrong: { code: `<script setup>\nconst label = $money(89)   // ReferenceError: $money is not defined\n</script>`, lang: 'vue' },
      right: { code: `<script setup>\nimport { useMoney } from './money.js'\nconst { format } = useMoney()\nconst label = format(89)\n</script>`, lang: 'vue' },
      explanation: 'Global properties live on the component instance proxy (templates, `this` in the Options API). `<script setup>` has no `this`; expose a composable built on `app.provide`.',
    },
    {
      title: 'Module-level plugin state',
      wrong: { code: `const toasts = reactive([]) // shared by every app — and every SSR request\nexport default {\n  install(app) { app.provide(toastKey, toasts) },\n}`, lang: 'js' },
      right: { code: `export default {\n  install(app) {\n    const toasts = reactive([]) // one list per app\n    app.provide(toastKey, toasts)\n  },\n}`, lang: 'js' },
      explanation: 'Module scope is shared by everything that imports the module. Create state inside `install` so each app instance — and each server request — gets its own.',
    },
    {
      title: 'String injection keys that can collide',
      wrong: { code: `app.provide('config', myPluginConfig) // another library may also use 'config'`, lang: 'js' },
      right: { code: `export const myPluginKey = Symbol('my-plugin')\napp.provide(myPluginKey, myPluginConfig)`, lang: 'js' },
      explanation: 'Strings are global names; two plugins can overwrite each other. A `Symbol` exported from your module is unique.',
    },
    {
      title: 'An errorHandler that hides errors',
      wrong: { code: `app.config.errorHandler = () => {} // swallow everything`, lang: 'js' },
      right: { code: `app.config.errorHandler = (err, instance, info) => {\n  reportToMonitoring(err, { info })\n  showFriendlyMessage()\n  console.error(err)\n}`, lang: 'js' },
      explanation: 'Setting a handler replaces Vue\'s default logging. If you don\'t report or log, bugs disappear silently. Report, log, and show something helpful.',
    },
  ],

  debugging: [
    {
      symptom: '`Failed to resolve component: PriceTag` (or a directive) in some components.',
      cause: 'The plugin wasn\'t installed, was installed after `mount()`, or the component lives in a different app instance.',
      fix: 'Install plugins in `main.js` before `app.mount()`, on the same app that renders the component.',
    },
    {
      symptom: '`inject()` returns `undefined` for a plugin\'s key.',
      cause: 'The plugin isn\'t installed, a different key (string vs Symbol, or a different Symbol) is used, or `inject()` is called outside `setup` (e.g. in an event handler or a plain module).',
      fix: 'Import the key from the plugin module, call `inject` during setup (or through a composable called in setup), or use `app.runWithContext()` outside components.',
    },
    {
      symptom: '`[Vue warn]: Plugin has already been applied to target app.`',
      cause: '`app.use()` was called twice with the same plugin (often once in `main.js` and again inside another plugin).',
      fix: 'Remove the duplicate. The second install was ignored, so its options never applied.',
    },
    {
      symptom: 'A global property shows the wrong value in one component.',
      cause: 'The component has its own property with the same name, which takes priority over global properties.',
      fix: 'Rename one of them — or switch to a composable with an explicit import.',
    },
    {
      symptom: 'Some errors never reach `app.config.errorHandler`.',
      cause: 'They happen in code Vue doesn\'t call: timers, third-party callbacks, promises that aren\'t returned from hooks or handlers.',
      fix: 'Return/await promises from handlers and hooks, wrap callbacks, and add `window` `error` / `unhandledrejection` listeners for the rest.',
    },
  ],

  bestPractices: [
    'Package app-wide features as plugins with `install(app, options)` and sensible defaults.',
    'Expose plugin APIs through `app.provide` with a `Symbol` key and a `useX()` composable; add `$` globals only for templates.',
    'Create plugin state inside `install` so each app (and SSR request) is isolated.',
    'Install plugins and set `app.config` before `app.mount()`.',
    'Register globally only what is used almost everywhere; import everything else explicitly.',
    'Use `app.config.errorHandler` to report errors and show a friendly fallback — never to silently swallow them.',
    'Clean up timers, sockets and listeners your plugin starts when the app unmounts.',
  ],

  useCases: [
    'Internationalization: `$t()` in templates, `useI18n()` in scripts, a language switcher component.',
    'Formatting services (money, dates, units) configured per app.',
    'A toast/notification system with a global container component.',
    'Design systems: registering base components and directives app-wide.',
    'Analytics or feature-flag clients created once with credentials/options.',
    'Global error reporting through `app.config.errorHandler`.',
  ],

  whenToUse: {
    use: [
      'A feature must be available to (almost) every component in the app.',
      'The feature needs one-time setup or configuration with options.',
      'You want to share the feature across apps or publish it as a package.',
      'Behaviour must apply app-wide — error handling, warning filters, ID prefixes.',
    ],
    avoid: [
      'Logic only a few components need — a normal composable or module import is simpler.',
      'Shared reactive data with actions and devtools support — use a [Pinia store](lesson:pinia-basics).',
      'Adding many `$` globals for convenience — they become invisible dependencies.',
    ],
  },

  comparison: {
    title: 'Ways to share app-wide functionality',
    headers: ['', 'plugin + `app.provide`', '`globalProperties`', 'global `app.component`', 'plain module import', 'Pinia store'],
    rows: [
      ['Configured per app?', 'yes (options)', 'yes (set in install)', 'n/a', 'no — one module for all', 'yes (store per pinia)'],
      ['Usable in `<script setup>`?', 'yes (`inject` / composable)', 'no (templates / `this`)', 'yes (in templates)', 'yes', 'yes'],
      ['Explicit dependency?', 'via import of the composable', 'no — invisible', 'no — invisible', 'yes', 'yes'],
      ['SSR-safe state?', 'yes, if created in install', 'yes, if created in install', 'n/a', '**risky** for mutable state', 'yes'],
      ['Best for', 'services and libraries', 'template helpers', 'ubiquitous base components', 'pure utilities', 'shared reactive state'],
    ],
    note: 'Real plugins often combine several columns — Vue Router provides `useRouter()`, adds `$router`, and registers `RouterLink`/`RouterView` globally.',
  },

  quiz: [
    {
      id: 'plugins-app-config-q1',
      type: 'mcq',
      prompt: 'What does `app.use(myPlugin, { theme: \'dark\' })` do when `myPlugin` is an object?',
      options: [
        { text: 'Calls `myPlugin.install(app, { theme: \'dark\' })` once' },
        { text: 'Merges `myPlugin` into every component as a mixin', why: 'That would be `app.mixin`; plugins decide themselves what to register.' },
        { text: 'Mounts `myPlugin` as a second root component', why: 'Plugins are not components; nothing is mounted.' },
        { text: 'Calls `myPlugin.install()` every time a component is created', why: '`install` runs once per app, at `app.use()` time.' },
      ],
      answer: 0,
      explanation: '`app.use` calls `install(app, ...options)` (or the plugin itself if it is a function). Installing the same plugin twice is ignored.',
    },
    {
      id: 'plugins-app-config-q2',
      type: 'output',
      prompt: 'What does the console show?',
      code: {
        lang: 'js',
        code: `const logger = {
  install(app, options) {
    console.log('install', options.level)
  },
}

const app = createApp(App)
app.use(logger, { level: 'info' })
app.use(logger, { level: 'debug' })`,
      },
      options: [
        { text: '`install info`, then `install debug`', why: 'Vue remembers installed plugins and skips repeats.' },
        { text: '`install info` only (plus a development warning)' },
        { text: '`install debug` only — the last call wins', why: 'The first install happens; the second is skipped.' },
        { text: 'An error is thrown', why: 'It\'s a warning in development, not an error.' },
      ],
      answer: 1,
      explanation: 'The second `app.use` with the same plugin is ignored and Vue warns "Plugin has already been applied to target app." — so the `debug` option never applies.',
    },
    {
      id: 'plugins-app-config-q3',
      type: 'bug',
      prompt: 'Components can\'t use `$t` or `<LangSwitch>` from the i18n plugin. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `import { createApp } from 'vue'
import App from './App.vue'
import i18n from './i18n.js'

const app = createApp(App)
app.mount('#app')
app.use(i18n, { locale: 'fr' })`,
      },
      answerLine: [6, 7],
      explanation: 'The app is mounted before the plugin is installed, so the first render happens without it. Swap the two lines: `app.use(...)` first, then `app.mount(...)`.',
    },
    {
      id: 'plugins-app-config-q4',
      type: 'fill',
      prompt: 'Fill the blanks inside `install(app, options)`: a template helper and an injectable service.',
      code: {
        lang: 'js',
        code: `install(app, options) {
  const t = (key) => options.messages[key] ?? key
  app.config.___.$t = t
  app.___(i18nKey, { t })
}`,
      },
      answer: [['globalProperties'], ['provide']],
      explanation: '`app.config.globalProperties` adds `$t` to every component instance; `app.provide` makes `{ t }` injectable everywhere in the app.',
    },
    {
      id: 'plugins-app-config-q5',
      type: 'mcq',
      prompt: 'Inside `<script setup>`, how should a component use a plugin\'s money formatter?',
      options: [
        { text: '`this.$money(89)`', why: '`<script setup>` has no `this`.' },
        { text: 'Call a composable such as `useMoney()` that `inject`s what the plugin provided' },
        { text: '`import { $money } from \'vue\'`', why: 'Vue doesn\'t export plugin helpers.' },
        { text: '`window.$money(89)`', why: 'Plugins should not put things on `window`; that bypasses the app instance entirely.' },
      ],
      answer: 1,
      explanation: 'Global properties are for templates and the Options API. In `<script setup>`, use `inject()` — ideally through a composable the plugin exports.',
    },
    {
      id: 'plugins-app-config-q6',
      type: 'mcq',
      prompt: 'Which errors reach `app.config.errorHandler`? **Select all that apply.**',
      options: [
        { text: 'An error thrown in a `@click` handler' },
        { text: 'An error thrown in `onMounted`' },
        { text: 'An error thrown in a `watch` callback' },
        { text: 'An error thrown inside a `setTimeout` callback started from a click handler', why: 'Vue didn\'t call that callback, so it can\'t catch it — use `window` error events for those.' },
        { text: 'A rejected promise returned by an `async` event handler' },
      ],
      answer: [0, 1, 2, 4],
      explanation: 'Vue catches errors in code it calls — handlers (including returned promises), hooks, watchers, renders — but not in callbacks it never saw, like timers.',
    },
    {
      id: 'plugins-app-config-q7',
      type: 'short',
      prompt: 'Why do most modern Vue plugins offer a composable (like `useI18n()`) instead of — or in addition to — global `$` properties?',
      answer: 'Composables work in <script setup> and other composables (global properties need `this` or a template), they are explicit imports so dependencies are visible and type-safe, and they are backed by provide/inject with Symbol keys, which avoids name clashes and lets each app or SSR request have its own instance. Global $ properties remain a template convenience but become confusing when many plugins add them.',
    },
  ],

  exercises: [
    {
      id: 'toast-plugin',
      title: 'A toast plugin',
      difficulty: 'intermediate',
      prompt: `
Implement the plugin in **toast.js**. Everything else is written.

\`install(app, options)\` must:

- create a **reactive** list of toasts (inside \`install\`) and functions \`show(message)\` and \`dismiss(id)\`;
- \`show\` adds \`{ id, message }\` and removes it automatically after \`options.duration\` ms (default **3000**);
- \`app.provide(toastKey, { toasts, show, dismiss })\` — the key and the \`useToast()\` composable are in \`useToast.js\`;
- register \`ToastContainer.vue\` as a **global component** named \`ToastContainer\`.

\`main.js\` installs it with \`{ duration: 300 }\`. App has \`.save\` / \`.delete\` buttons; the container renders \`ul.toasts > li.toast\` items with a \`.dismiss\` button.
`,
      files: {
        'main.js': `import { createApp } from 'vue'
import App from './App.vue'
import toastPlugin from './toast.js'

createApp(App).use(toastPlugin, { duration: 300 }).mount('#app')`,
        'toast.js': `import { reactive } from 'vue'
import { toastKey } from './useToast.js'
import ToastContainer from './ToastContainer.vue'

export default {
  install(app, options = {}) {
    // TODO: state, show(), dismiss(), app.provide(...), app.component(...)
  },
}`,
        'useToast.js': `import { inject } from 'vue'

export const toastKey = Symbol('toast')

export function useToast() {
  const toast = inject(toastKey)
  if (!toast) throw new Error('useToast() requires app.use(toastPlugin)')
  return toast
}`,
        'ToastContainer.vue': `<script setup>
import { useToast } from './useToast.js'

const { toasts, dismiss } = useToast()
</script>

<template>
  <ul class="toasts">
    <li v-for="t in toasts" :key="t.id" class="toast">
      {{ t.message }}
      <button class="dismiss" @click="dismiss(t.id)">×</button>
    </li>
  </ul>
</template>`,
        'App.vue': `<script setup>
import { useToast } from './useToast.js'

const toast = useToast()
</script>

<template>
  <button class="save" @click="toast.show('Saved!')">Save</button>
  <button class="delete" @click="toast.show('Deleted')">Delete</button>
  <ToastContainer />
</template>`,
      },
      hints: [
        'Inside `install`: `const duration = options.duration ?? 3000`, `const toasts = reactive([])` and a `let nextId = 1` counter.',
        '`dismiss(id)` finds the index and `splice`s it out (mutate the reactive array — consumers destructured it, so don\'t reassign). `show(message)` pushes `{ id, message }` and schedules `setTimeout(() => dismiss(id), duration)`.',
        'Finish with `app.provide(toastKey, { toasts, show, dismiss })` and `app.component(\'ToastContainer\', ToastContainer)`.',
      ],
      solution: {
        explanation: 'All state lives inside `install`, so each app gets its own toast list. `provide` hands one object to every component through `useToast()`, and global registration lets any template drop in `<ToastContainer />`. Because `ToastContainer` destructures `toasts`, the array must be mutated in place (`push`/`splice`) rather than replaced.',
        files: {
          'main.js': `import { createApp } from 'vue'
import App from './App.vue'
import toastPlugin from './toast.js'

createApp(App).use(toastPlugin, { duration: 300 }).mount('#app')`,
          'toast.js': `import { reactive } from 'vue'
import { toastKey } from './useToast.js'
import ToastContainer from './ToastContainer.vue'

export default {
  install(app, options = {}) {
    const duration = options.duration ?? 3000
    const toasts = reactive([])
    let nextId = 1

    function dismiss(id) {
      const index = toasts.findIndex((t) => t.id === id)
      if (index !== -1) toasts.splice(index, 1)
    }

    function show(message) {
      const id = nextId++
      toasts.push({ id, message })
      setTimeout(() => dismiss(id), duration)
      return id
    }

    app.provide(toastKey, { toasts, show, dismiss })
    app.component('ToastContainer', ToastContainer)
  },
}`,
          'useToast.js': `import { inject } from 'vue'

export const toastKey = Symbol('toast')

export function useToast() {
  const toast = inject(toastKey)
  if (!toast) throw new Error('useToast() requires app.use(toastPlugin)')
  return toast
}`,
          'ToastContainer.vue': `<script setup>
import { useToast } from './useToast.js'

const { toasts, dismiss } = useToast()
</script>

<template>
  <ul class="toasts">
    <li v-for="t in toasts" :key="t.id" class="toast">
      {{ t.message }}
      <button class="dismiss" @click="dismiss(t.id)">×</button>
    </li>
  </ul>
</template>`,
          'App.vue': `<script setup>
import { useToast } from './useToast.js'

const toast = useToast()
</script>

<template>
  <button class="save" @click="toast.show('Saved!')">Save</button>
  <button class="delete" @click="toast.show('Deleted')">Delete</button>
  <ToastContainer />
</template>`,
        },
      },
      tests: [
        { name: 'ToastContainer is registered globally', code: `expect(exists('ul.toasts')).toBe(true)` },
        {
          name: 'show() adds a toast',
          code: `await click('.save')
expect(findAll('.toast')).toHaveLength(1)
expect(text('.toast')).toContain('Saved!')`,
        },
        {
          name: 'dismiss removes the right toast',
          code: `await click('.save')
await click('.delete')
await click(findAll('.dismiss')[0])
expect(findAll('.toast')).toHaveLength(1)
expect(text('.toast')).toContain('Deleted')`,
        },
        {
          name: 'toasts disappear after the configured duration',
          code: `await click('.save')
await wait(150)
expect(findAll('.toast')).toHaveLength(1)
await wait(350)
expect(findAll('.toast')).toHaveLength(0)`,
        },
      ],
    },
    {
      id: 'error-reporter',
      title: 'An error-reporting plugin',
      difficulty: 'intermediate',
      prompt: `
Implement **errorReporter.js**, a plugin that turns uncaught errors into data the UI can show.

\`install(app, options)\` must:

- create a **reactive** array \`errors\` and \`app.provide(errorsKey, errors)\` (key and \`useErrors()\` are in \`useErrors.js\`);
- set \`app.config.errorHandler\` so that each error pushes \`{ message: err.message, info }\` into \`errors\`;
- also call \`options.report(err, info)\` if it was provided.

\`main.js\` passes a \`report\` function that logs \`[report] <message> (<info>)\`. App shows \`.error-count\`, \`.last-error\`, a \`.boom\` button that throws, a \`.show-widget\` button that mounts a component which throws in \`onMounted\`, and a \`.counter\` that must keep working after errors.
`,
      files: {
        'main.js': `import { createApp } from 'vue'
import App from './App.vue'
import errorReporter from './errorReporter.js'

createApp(App)
  .use(errorReporter, {
    report: (err, info) => console.log('[report] ' + err.message + ' (' + info + ')'),
  })
  .mount('#app')`,
        'errorReporter.js': `import { reactive } from 'vue'
import { errorsKey } from './useErrors.js'

export default {
  install(app, options = {}) {
    // TODO: reactive errors list, app.provide, app.config.errorHandler
  },
}`,
        'useErrors.js': `import { inject } from 'vue'

export const errorsKey = Symbol('errors')

export function useErrors() {
  const errors = inject(errorsKey)
  if (!errors) throw new Error('useErrors() requires app.use(errorReporter)')
  return errors
}`,
        'BrokenWidget.vue': `<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  throw new Error('Widget failed to mount')
})
</script>

<template>
  <p class="widget">Weather widget</p>
</template>`,
        'App.vue': `<script setup>
import { ref, computed } from 'vue'
import { useErrors } from './useErrors.js'
import BrokenWidget from './BrokenWidget.vue'

const errors = useErrors()
const last = computed(() => errors[errors.length - 1])
const showWidget = ref(false)
const count = ref(0)

function explode() {
  throw new Error('Kaboom')
}
</script>

<template>
  <p>Errors: <span class="error-count">{{ errors.length }}</span></p>
  <p v-if="last" class="last-error">{{ last.message }}</p>

  <button class="boom" @click="explode">Throw</button>
  <button class="show-widget" @click="showWidget = true">Show widget</button>
  <button class="counter" @click="count++">Clicked {{ count }}</button>

  <BrokenWidget v-if="showWidget" />
</template>`,
      },
      hints: [
        'Inside `install`: `const errors = reactive([])` and `app.provide(errorsKey, errors)`.',
        '`app.config.errorHandler = (err, instance, info) => { … }` receives every uncaught component error.',
        'In the handler: `errors.push({ message: err.message, info })` and `options.report?.(err, info)`.',
      ],
      solution: {
        explanation: 'The plugin owns the handler and the data, so the whole app gets consistent error handling from one `app.use()`. Errors from the click handler ("native event handler") and from `onMounted` ("mounted hook") both arrive with an `info` string. The app keeps working because Vue caught the errors instead of letting them crash the page; in production `info` would be a short code.',
        files: {
          'main.js': `import { createApp } from 'vue'
import App from './App.vue'
import errorReporter from './errorReporter.js'

createApp(App)
  .use(errorReporter, {
    report: (err, info) => console.log('[report] ' + err.message + ' (' + info + ')'),
  })
  .mount('#app')`,
          'errorReporter.js': `import { reactive } from 'vue'
import { errorsKey } from './useErrors.js'

export default {
  install(app, options = {}) {
    const errors = reactive([])
    app.provide(errorsKey, errors)

    app.config.errorHandler = (err, instance, info) => {
      errors.push({ message: err.message, info })
      options.report?.(err, info)
    }
  },
}`,
          'useErrors.js': `import { inject } from 'vue'

export const errorsKey = Symbol('errors')

export function useErrors() {
  const errors = inject(errorsKey)
  if (!errors) throw new Error('useErrors() requires app.use(errorReporter)')
  return errors
}`,
          'BrokenWidget.vue': `<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  throw new Error('Widget failed to mount')
})
</script>

<template>
  <p class="widget">Weather widget</p>
</template>`,
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import { useErrors } from './useErrors.js'
import BrokenWidget from './BrokenWidget.vue'

const errors = useErrors()
const last = computed(() => errors[errors.length - 1])
const showWidget = ref(false)
const count = ref(0)

function explode() {
  throw new Error('Kaboom')
}
</script>

<template>
  <p>Errors: <span class="error-count">{{ errors.length }}</span></p>
  <p v-if="last" class="last-error">{{ last.message }}</p>

  <button class="boom" @click="explode">Throw</button>
  <button class="show-widget" @click="showWidget = true">Show widget</button>
  <button class="counter" @click="count++">Clicked {{ count }}</button>

  <BrokenWidget v-if="showWidget" />
</template>`,
        },
      },
      tests: [
        { name: 'starts with no errors', code: `expect(text('.error-count')).toBe('0')` },
        {
          name: 'an event handler error is recorded and reported',
          code: `await click('.boom')
expect(text('.error-count')).toBe('1')
expect(text('.last-error')).toBe('Kaboom')
expect(logs.some((l) => l.startsWith('[report] Kaboom'))).toBe(true)`,
        },
        {
          name: 'a lifecycle hook error is recorded with its info',
          code: `await click('.show-widget')
expect(text('.last-error')).toBe('Widget failed to mount')
expect(logs.some((l) => l.includes('Widget failed to mount') && l.includes('mounted'))).toBe(true)`,
        },
        {
          name: 'the app keeps working after errors',
          code: `await click('.boom')
await click('.counter')
await click('.counter')
expect(text('.counter')).toBe('Clicked 2')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'plugins-app-config-what',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a Vue plugin, and what does one typically do?',
      answer: 'A plugin is an object with an `install(app, options)` method, or a function with that signature, installed with `app.use(plugin, options)` before mounting. Inside `install` it uses the app instance to add app-level features: register global components (`app.component`) and directives (`app.directive`), provide services with `app.provide`, add `app.config.globalProperties`, or configure `app.config`. Vue Router and Pinia are examples.',
      explanation: 'A plugin is a one-time setup function for app-wide features.',
      whyAsked: 'Basic Vue architecture knowledge, and a gateway to discussing provide/inject and app configuration.',
      mistakes: ['Confusing plugins with components or mixins.', 'Saying plugins are Vue 2\'s `Vue.prototype` only.', 'Forgetting that `app.use` must come before `mount`.'],
      followUps: ['How would a component in `<script setup>` use a plugin\'s API?', 'What happens if you install a plugin twice?'],
      modelAnswer: 'A plugin is just `install(app, options)` — an object with that method or a function — that I install with `app.use` before mounting. It gets the app instance and adds app-wide things: global components and directives, provided services, global properties, or config like an error handler. Vue Router and Pinia are plugins. For the API, I prefer providing a service with a Symbol key and exposing a composable, with `$` helpers only as a template convenience.',
    },
    {
      id: 'plugins-app-config-globals-vs-provide',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare exposing a plugin API through `app.config.globalProperties` versus `app.provide` + a composable.',
      answer: 'Global properties (`$t`, `$money`) are available in every template and in the Options API via `this`, with no imports — convenient but implicit; they aren\'t available in `<script setup>` JS, a component\'s own property with the same name silently wins, and typing needs `ComponentCustomProperties` augmentation. `app.provide` with a Symbol key plus a `useX()` composable works in `<script setup>` and other composables, is an explicit, typed import (`InjectionKey<T>`), can\'t collide, and keeps state per app. Many plugins offer both.',
      explanation: 'Globals optimise for template brevity; provide/inject for explicitness and the Composition API.',
      whyAsked: 'Shows whether you design plugin APIs that fit modern `<script setup>` code.',
      mistakes: ['Saying globalProperties work everywhere.', 'Using string keys for provide.', 'Not knowing the precedence rule for name clashes.'],
      followUps: ['How do you type a global property in TypeScript?', 'Why does SSR care where plugin state is created?'],
      modelAnswer: 'Global properties are great in templates — `{{ $t(\'hello\') }}` with no imports — and in the Options API through `this`. But `<script setup>` has no `this`, so they\'re unreachable in script code, a component property with the same name silently shadows them, and they\'re an invisible dependency. Provide/inject with a Symbol key behind a `useI18n()` composable is explicit, typed, collision-free, and works in composables. I\'d build the composable as the core API and add a `$` helper only for templates.',
    },
    {
      id: 'plugins-app-config-error-handler',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You\'re asked to "catch every frontend error and send it to our monitoring service". How would you use `app.config.errorHandler`, and what would it miss?',
      answer: 'Set `app.config.errorHandler = (err, instance, info) => …` before mounting (often inside a monitoring plugin): report the error with `info`, the component name, route and release; log it; and show a friendly fallback. It catches errors from component renders, setup, lifecycle hooks, watchers, event handlers (including rejected promises they return), directive and transition hooks. It misses errors in code Vue didn\'t call — timers, third-party callbacks, promises not returned to Vue — so add `window` `error` and `unhandledrejection` listeners. In production `info` is a short code. And frontend reporting complements, never replaces, server logging.',
      explanation: 'Vue can only catch errors in code it invokes; the browser\'s global events cover the rest.',
      whyAsked: 'Production readiness: error observability is essential and has well-known gaps.',
      mistakes: ['Swallowing errors without logging.', 'Assuming it catches every async error.', 'Not using `errorCaptured` for local fallbacks where appropriate.'],
      followUps: ['How does `onErrorCaptured` interact with the global handler?', 'How would you avoid reporting the same error many times?'],
      modelAnswer: 'I\'d set the app\'s `errorHandler` in a small monitoring plugin, installed before mount. It reports the error with the `info` string, component and route, logs it, and triggers a friendly message. It catches anything Vue calls: renders, setup, hooks, watchers, event handlers including returned promises. It won\'t see errors in timers or library callbacks Vue never invoked, so I\'d add `window` `error` and `unhandledrejection` listeners too. Local `onErrorCaptured` boundaries can handle errors closer to the UI and stop propagation.',
    },
    {
      id: 'plugins-app-config-inject-undefined',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: '`useToast()` works in components, but calling it inside a Vue Router `beforeEach` guard returns `undefined`. Why, and how can you fix it?',
      answer: '`inject()` only works where there is an injection context — during a component\'s `setup` (or functional render). A router guard runs outside any component, so there\'s no context and `inject` finds nothing. Options: call `app.runWithContext(() => useToast())` (Vue 3.3+), pass the service to the code that creates the guard, or have the plugin also export a way to reach the instance it created for that app.',
      explanation: 'Provide/inject is scoped to the component tree; outside it you must supply the app context explicitly.',
      whyAsked: 'A real-world issue when sharing services between components and non-component code.',
      mistakes: ['Making the service a module-level singleton (breaks multi-app/SSR isolation).', 'Calling `inject` in event handlers and expecting it to work.'],
      followUps: ['Why not just export a singleton?', 'Where else is there no injection context?'],
      modelAnswer: '`inject` needs an injection context, which exists while a component\'s setup runs. A router guard is plain code outside the component tree, so there\'s nothing to inject from. In Vue 3.3+ I can wrap it: `app.runWithContext(() => useToast())`, which uses the app\'s provides. Alternatively I pass the toast service into whatever sets up the guard. I\'d avoid a module-level singleton because it breaks isolation between apps and SSR requests.',
    },
    {
      id: 'plugins-app-config-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design an analytics plugin for a Vue app that may later use SSR. What would its API and internals look like?',
      answer: 'Options: `{ siteId, enabled, transport }`. In `install`, create a per-app client (no module-level state), `app.provide(analyticsKey, client)` with an exported `InjectionKey`, and export `useAnalytics()`. Optionally register a `v-track` directive for click tracking and a `$track` template helper. Guard browser-only work (`typeof window`, or only send in `onMounted`/after hydration) so SSR doesn\'t try to send events from the server. Queue events until consent is given. Clean up listeners/timers with `app.onUnmount` (3.5+). Make it testable by injecting a fake transport. Document that analytics data from the client is untrusted.',
      explanation: 'A good plugin is configurable, per-app, explicit, SSR-aware, testable and cleans up after itself.',
      whyAsked: 'Senior architecture: API design, isolation, SSR, privacy and testability in one question.',
      mistakes: ['A global singleton client.', 'Calling browser APIs during SSR.', 'Only exposing `$track`, unusable in `<script setup>`.', 'No consent or cleanup story.'],
      followUps: ['How would you test components that call `useAnalytics()`?', 'How would you track route changes?'],
      modelAnswer: 'The plugin takes options like site ID, an enabled flag and a transport. `install` creates a client per app — no module-level state, so SSR requests stay isolated — and provides it under an exported Symbol key with a `useAnalytics()` composable. For convenience I\'d add a `v-track` directive and maybe a `$track` helper. Sending only happens in the browser, after consent, with events queued until then. Timers and listeners are cleaned up in `app.onUnmount`, and the transport is injectable, so tests use a fake.',
    },
    {
      id: 'plugins-app-config-precedence',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'A plugin sets `app.config.globalProperties.format = () => \'global\'`. A component\'s `<script setup>` declares `const format = () => \'own\'` and its template renders `{{ format() }}`. What is displayed?',
      options: ['own', 'global', 'Both, concatenated', 'An error: duplicate name'],
      correctOption: 0,
      answer: '`own`. A component\'s own properties (setup bindings, data, props, methods) take priority over global properties, silently.',
      explanation: 'Global properties are the last fallback on the instance proxy — which is also why naming clashes can hide bugs.',
      whyAsked: 'Tests precise knowledge of how the instance proxy resolves names, and awareness of a silent failure mode.',
      mistakes: ['Assuming globals override local names.', 'Expecting Vue to warn.'],
      followUps: ['How would you prevent such clashes?'],
      modelAnswer: 'It shows "own". The template looks up names on the component first — setup bindings, props, data — and only falls back to global properties at the end. Vue doesn\'t warn about the clash, so I\'d prefix globals with `$` and prefer explicit composables to avoid it.',
    },
    {
      id: 'plugins-app-config-coding-flags',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Write a **feature-flags plugin** in `flags.js`: `install(app, { flags })` provides the flags (key `flagsKey` from `useFlag.js`) and adds a `$flag(name)` global helper that returns `true` only for enabled flags. `useFlag(name)` (already written) returns a boolean. App shows `.beta-banner` when `newCheckout` is on and `.old-checkout` otherwise.',
      starter: {
        files: {
          'main.js': `import { createApp } from 'vue'
import App from './App.vue'
import flagsPlugin from './flags.js'

createApp(App)
  .use(flagsPlugin, { flags: { newCheckout: true, darkMode: false } })
  .mount('#app')`,
          'flags.js': `import { flagsKey } from './useFlag.js'

export default {
  install(app, options = {}) {
    // TODO: app.provide(flagsKey, …) and app.config.globalProperties.$flag
  },
}`,
          'useFlag.js': `import { inject } from 'vue'

export const flagsKey = Symbol('flags')

export function useFlag(name) {
  const flags = inject(flagsKey, {})
  return flags[name] === true
}`,
          'App.vue': `<script setup>
import { useFlag } from './useFlag.js'

const newCheckout = useFlag('newCheckout')
</script>

<template>
  <p v-if="newCheckout" class="beta-banner">Try our new checkout!</p>
  <p v-else class="old-checkout">Classic checkout</p>
  <p class="dark">Dark mode: {{ $flag('darkMode') ? 'on' : 'off' }}</p>
  <p class="unknown">Unknown flag: {{ $flag('doesNotExist') ? 'on' : 'off' }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'useFlag reads provided flags', code: `expect(exists('.beta-banner')).toBe(true); expect(exists('.old-checkout')).toBe(false)` },
        { name: '$flag works in templates', code: `expect(text('.dark')).toBe('Dark mode: off')` },
        { name: 'unknown flags are off', code: `expect(text('.unknown')).toBe('Unknown flag: off')` },
        { name: '$flag is a global property', code: `expect(typeof vm.$flag).toBe('function'); expect(vm.$flag('newCheckout')).toBe(true)` },
      ],
      hints: [
        'Copy the flags so callers can\'t mutate your options: `const flags = { ...(options.flags ?? {}) }`.',
        '`app.provide(flagsKey, flags)` makes `useFlag()` work.',
        '`app.config.globalProperties.$flag = (name) => flags[name] === true`.',
      ],
      answer: 'Provide a copy of the flags under `flagsKey` and add a `$flag` global that checks `flags[name] === true`.',
      solution: {
        files: {
          'main.js': `import { createApp } from 'vue'
import App from './App.vue'
import flagsPlugin from './flags.js'

createApp(App)
  .use(flagsPlugin, { flags: { newCheckout: true, darkMode: false } })
  .mount('#app')`,
          'flags.js': `import { flagsKey } from './useFlag.js'

export default {
  install(app, options = {}) {
    const flags = { ...(options.flags ?? {}) }

    app.provide(flagsKey, flags)
    app.config.globalProperties.$flag = (name) => flags[name] === true
  },
}`,
          'useFlag.js': `import { inject } from 'vue'

export const flagsKey = Symbol('flags')

export function useFlag(name) {
  const flags = inject(flagsKey, {})
  return flags[name] === true
}`,
          'App.vue': `<script setup>
import { useFlag } from './useFlag.js'

const newCheckout = useFlag('newCheckout')
</script>

<template>
  <p v-if="newCheckout" class="beta-banner">Try our new checkout!</p>
  <p v-else class="old-checkout">Classic checkout</p>
  <p class="dark">Dark mode: {{ $flag('darkMode') ? 'on' : 'off' }}</p>
  <p class="unknown">Unknown flag: {{ $flag('doesNotExist') ? 'on' : 'off' }}</p>
</template>`,
        },
      },
      explanation: 'The plugin offers the same data two ways: injectable for script code, and a `$flag` helper for templates. Flags only change what the UI *shows* — anything sensitive must still be enforced by the server.',
      whyAsked: 'A compact plugin-authoring task covering options, provide and global properties.',
      mistakes: ['Storing flags at module level.', 'Returning truthy non-boolean values (e.g. `\'false\'` strings).', 'Treating client-side flags as access control.'],
      followUps: ['How would you load flags from an API before mounting?', 'How would you make flags reactive so they can change at runtime?'],
      modelAnswer: 'In `install` I copy the flags from the options, provide them under the shared Symbol key so `useFlag` can inject them, and add `$flag` to `globalProperties` for templates. Both check strictly for `true`, so unknown flags are off. I\'d point out that flags only hide or show UI — the server must still authorize anything that matters.',
    },
  ],

  takeaways: [
    'A plugin is `install(app, options)` (or a function); `app.use(plugin, options)` runs it once, before `app.mount()`.',
    'Plugins register app-wide features: `app.component`, `app.directive`, `app.provide`, `app.config.globalProperties`.',
    'Prefer `app.provide` with a Symbol key behind a `useX()` composable; `$` globals are a template convenience (not usable in `<script setup>` JS).',
    'Create plugin state inside `install` so every app — and every SSR request — gets its own.',
    '`app.config.errorHandler` receives errors from renders, setup, hooks, watchers and handlers (with an `info` string); it can\'t see timer or third-party callback errors.',
    'Other app settings — `warnHandler` (dev only), `idPrefix` (3.5+), `runWithContext()` (3.3+), `onUnmount()` (3.5+) — configure behaviour for the whole app.',
  ],
}
