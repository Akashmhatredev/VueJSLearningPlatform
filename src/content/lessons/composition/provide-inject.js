// Lesson: provide() & inject()

const cartJs = `import { provide, inject, ref, computed, readonly } from 'vue'

// A unique key: no other library can accidentally use the same one.
export const CartKey = Symbol('cart')

// Call once, in the component that should OWN the cart.
export function provideCart() {
  const items = ref([])
  const count = computed(() => items.value.length)
  const total = computed(() => items.value.reduce((sum, p) => sum + p.price, 0))

  function add(product) {
    items.value.push(product)
  }

  const cart = { items: readonly(items), count, total, add }
  provide(CartKey, cart)
  return cart
}

// Call in any descendant that needs the cart.
export function useCart() {
  const cart = inject(CartKey, null)
  if (!cart) throw new Error('useCart() needs provideCart() in an ancestor component')
  return cart
}`

const appVue = `<script setup>
import { ref, provide, readonly } from 'vue'
import { provideCart } from './cart.js'
import ShopLayout from './ShopLayout.vue'

// 1. Simplest form: a string key and a ref (+ a function to change it)
const theme = ref('light')
function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
provide('theme', { theme: readonly(theme), toggleTheme })

// 2. Scalable form: a Symbol key hidden behind two small composables
provideCart()
</script>

<template>
  <ShopLayout />
</template>`

const shopLayout = `<script setup>
// This component knows NOTHING about the theme or the cart.
// No props are passed through it.
import ShopHeader from './ShopHeader.vue'
import ProductCard from './ProductCard.vue'

const products = [
  { id: 1, name: 'Sticker pack', price: 4 },
  { id: 2, name: 'Vue mug', price: 12 },
  { id: 3, name: 'Hoodie', price: 35 },
]
</script>

<template>
  <ShopHeader />
  <main class="products">
    <ProductCard v-for="p in products" :key="p.id" :product="p" />
  </main>
</template>

<style>
.products { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-top: 8px; }
</style>`

const shopHeader = `<script setup>
import { inject } from 'vue'
import { useCart } from './cart.js'

const { theme, toggleTheme } = inject('theme')
const { count, total } = useCart()
</script>

<template>
  <header class="header" :class="theme">
    <strong>Vue Shop</strong>
    <span class="cart-count">🛒 {{ count }} items · {{ total }} €</span>
    <button class="theme-btn" @click="toggleTheme">Theme: {{ theme }}</button>
  </header>
</template>

<style>
.header { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 8px; border: 2px solid #222; border-radius: 8px; }
.dark { background: #222; color: #eee; }
</style>`

const productCard = `<script setup>
import { inject } from 'vue'
import { useCart } from './cart.js'

defineProps({ product: { type: Object, required: true } })

const { theme } = inject('theme')
const cart = useCart()
</script>

<template>
  <article class="card" :class="theme">
    <h3>{{ product.name }}</h3>
    <p class="price">{{ product.price }} €</p>
    <button class="add" @click="cart.add(product)">Add to cart</button>
  </article>
</template>

<style>
.card { border: 2px solid #222; border-radius: 8px; padding: 8px; }
.card h3 { margin: 0 0 4px; font-size: 1rem; }
</style>`

const cartSolved = cartJs
  .replace(
    `  function add(product) {
    items.value.push(product)
  }

  const cart = { items: readonly(items), count, total, add }`,
    `  const freeShipping = computed(() => total.value >= 40)

  function add(product) {
    items.value.push(product)
  }

  function clear() {
    items.value = []
  }

  const cart = { items: readonly(items), count, total, freeShipping, add, clear }`,
  )

// (function replacement: a '$' in a replacement string has special meaning)
const appSolved = appVue.replace(
  `provide('theme', { theme: readonly(theme), toggleTheme })`,
  () => `provide('theme', { theme: readonly(theme), toggleTheme })
provide('currency', '$')`,
)

const headerSolved = `<script setup>
import { inject } from 'vue'
import { useCart } from './cart.js'

const { theme, toggleTheme } = inject('theme')
const currency = inject('currency', '€')
const { count, total, freeShipping, clear } = useCart()
</script>

<template>
  <header class="header" :class="theme">
    <strong>Vue Shop</strong>
    <span class="cart-count">🛒 {{ count }} items · {{ total }} {{ currency }}</span>
    <strong v-if="freeShipping" class="free-shipping">Free shipping!</strong>
    <button class="clear-cart" @click="clear">Empty cart</button>
    <button class="theme-btn" @click="toggleTheme">Theme: {{ theme }}</button>
  </header>
</template>

<style>
.header { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; padding: 8px; border: 2px solid #222; border-radius: 8px; }
.dark { background: #222; color: #eee; }
</style>`

const cardSolved = productCard
  .replace(`const { theme } = inject('theme')`, `const { theme } = inject('theme')
const currency = inject('currency', '€')`)
  .replace(`<p class="price">{{ product.price }} €</p>`, `<p class="price">{{ product.price }} {{ currency }}</p>`)

export default {
  id: 'provide-inject',
  title: 'provide() & inject()',
  summary: 'Hand data and services to any descendant component without threading props through every layer in between.',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['props', 'setup-and-script-setup', 'ref', 'reactivity-utilities'],
  related: ['component-communication', 'composables-intro', 'composable-design', 'why-state-management', 'plugins-app-config', 'testing-logic'],
  tags: ['provide', 'inject', 'dependency injection', 'prop drilling', 'InjectionKey', 'Symbol', 'context', 'app.provide', 'readonly'],
  apis: [
    { name: 'provide(key, value)', summary: 'Makes a value available to all descendants of the current component.' },
    { name: 'inject(key, defaultValue?)', summary: 'Reads the value provided by the nearest ancestor (or the app); returns the default or `undefined` if none.' },
    { name: 'app.provide(key, value)', summary: 'Provides a value to every component in the app — the mechanism plugins use.' },
    { name: 'hasInjectionContext()', summary: 'Returns true when `inject()` can be called here (Vue 3.3+), useful in libraries.' },
  ],
  docs: [
    { label: 'Vue Guide — Provide / Inject', url: 'https://vuejs.org/guide/components/provide-inject.html' },
    { label: 'API — provide() / inject()', url: 'https://vuejs.org/api/composition-api-dependency-injection.html' },
    { label: 'API — app.provide()', url: 'https://vuejs.org/api/application.html#app-provide' },
  ],

  intro: `
Normally a parent passes data to a child with **props**. That works beautifully for one level. But what if a component five levels down needs the current theme, the logged-in user or the shopping cart?

**\`provide()\`** lets an ancestor component announce: "here is a value for anyone below me." **\`inject()\`** lets any descendant — child, grandchild, great-great-grandchild — pick it up by name. The components in between don't need to know it exists.

This is Vue's built-in **dependency injection** (DI): instead of a component creating or importing the things it depends on, they are *handed* to it by something above.
`,

  why: `
Without provide/inject you get **prop drilling**: passing a prop through components that don't use it, only so their children can pass it on.

\`\`\`text
App (has cart)
 └─ ShopLayout   :cart="cart"   ← doesn't use it
     └─ ProductGrid  :cart="cart"   ← doesn't use it
         └─ ProductCard   uses cart.add()
\`\`\`

Every middle component gains a prop it doesn't care about. Rename the prop and you edit four files. Add a new deep consumer and you thread a new prop through every layer.

Provide/inject removes the middlemen. It's ideal for **context** that belongs to a whole subtree: a theme, a locale, a form that its nested fields register with, a tabs component and its tab panels, or a service like an API client. It's also how libraries plug into your app — Vue Router and Pinia make the router and stores available to every component through the app's provides.
`,

  eli15: `
Imagine a big family dinner where the salt is at one end of a long table.

**Props** are passing the salt hand to hand: "pass it to your neighbour, who passes it to theirs…" Everyone in between has to hold it for a moment, even if they don't want salt.

**provide/inject** is putting the salt on a lazy Susan in the middle of the table: Grandma *provides* it once, and anyone who wants it just *reaches* for it (\`inject\`). Nobody in between is bothered.

One more rule: if your aunt puts her **own** salt shaker closer to your end of the table, you grab hers — the **nearest** one wins.
`,

  analogy: {
    title: 'A building\'s Wi-Fi',
    body: `
An office building provides Wi-Fi. Any room on any floor can connect by knowing the network name — nobody runs a cable from the router through every room in between.

\`provide('wifi', network)\` is installing the router. \`inject('wifi')\` is a laptop on the 5th floor joining by name. If a floor installs its own stronger router with the same name, laptops on that floor connect to the nearer one. And if a laptop is in a building with no router at all, it gets nothing — unless it brought a hotspot (a default value).
`,
    mapping: [
      ['the router', '`provide(key, value)` in an ancestor component'],
      ['the network name', 'the injection key (a string or, better, a `Symbol`)'],
      ['a laptop joining', '`inject(key)` in any descendant'],
      ['a closer router with the same name', 'a nearer ancestor providing the same key — it wins'],
      ['a personal hotspot', 'the default value: `inject(key, fallback)`'],
      ['the building\'s main supply', '`app.provide()` — available to every component'],
    ],
  },

  visual: {
    type: 'component-flow',
    props: { mode: 'provide-inject' },
    title: 'Skipping the middlemen',
    caption: 'An ancestor provides a value; a deep descendant injects it directly. Click the components to see their code — the middle ones never mention the value.',
    alt: 'An animated component tree. The top component provides a value. The value travels directly to a deeply nested component that injects it, bypassing the intermediate components, which are shown without any props for it.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Prop drilling vs provide/inject',
    caption: 'Step through the same component tree twice: first passing props down every level, then providing once and injecting where needed.',
    alt: 'A component tree: App at the top, ShopLayout below it, then ShopHeader and ProductGrid, with ProductCard under ProductGrid. Steps first show a cart prop passed through every level, then App providing the cart and ShopHeader and ProductCard injecting it directly, and finally a nearer provider overriding a key for one subtree.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'app', label: 'App', note: 'owns the cart', tone: 'acid', x: 380, y: 40 },
        { id: 'layout', label: 'ShopLayout', note: 'doesn\'t use cart', tone: 'paper', x: 380, y: 125 },
        { id: 'header', label: 'ShopHeader', note: 'shows count', tone: 'cobalt', x: 200, y: 210 },
        { id: 'grid', label: 'ProductGrid', note: 'doesn\'t use cart', tone: 'paper', x: 560, y: 210 },
        { id: 'card', label: 'ProductCard', note: 'calls cart.add()', tone: 'cobalt', x: 560, y: 290 },
      ],
      edges: [
        { from: 'app', to: 'layout', label: ':cart' },
        { from: 'layout', to: 'header', label: ':cart' },
        { from: 'layout', to: 'grid', label: ':cart' },
        { from: 'grid', to: 'card', label: ':cart' },
        { id: 'inject-header', from: 'app', to: 'header', label: 'inject', dashed: true },
        { id: 'inject-card', from: 'app', to: 'card', label: 'inject', dashed: true },
      ],
      steps: [
        { focus: ['app', 'header', 'card'], text: 'Two components deep in the tree need the cart: the header (to show the count) and each product card (to add items). The cart lives in `App`.' },
        { focus: ['layout', 'grid'], edges: ['app->layout', 'layout->header', 'layout->grid', 'grid->card'], text: '**Prop drilling:** `ShopLayout` and `ProductGrid` must accept a `cart` prop and pass it on, although they never use it. Four files change if the prop is renamed.' },
        { focus: ['app'], text: '**With provide:** `App` calls `provide(CartKey, cart)` once. The value is now available to its whole subtree.' },
        { focus: ['header', 'card'], edges: ['inject-header', 'inject-card'], text: '`ShopHeader` and `ProductCard` call `inject(CartKey)` and receive the very same object. The middle components have no `cart` prop at all.' },
        { focus: ['grid', 'card'], text: 'If `ProductGrid` also provided `CartKey`, `ProductCard` would get **that** value instead: injection always uses the **nearest** ancestor that provides the key.' },
        { focus: ['app', 'card'], text: 'Because the provided object contains **refs** and **functions**, the card can call `cart.add()` and the header\'s count updates. Mutations stay inside the provider\'s code.' },
      ],
    },
  },

  syntax: [
    `
#### Providing and injecting
`,
    {
      code: `<!-- Ancestor -->
<script setup>
import { ref, provide } from 'vue'

const locale = ref('en')
provide('locale', locale)            // provide the REF, not locale.value
</script>

<!-- Any descendant, however deep -->
<script setup>
import { inject } from 'vue'

const locale = inject('locale')      // the same ref → stays reactive
const theme = inject('theme', 'light')   // with a default value
</script>`,
      lang: 'vue',
      title: 'provide / inject in <script setup>',
    },
    `
**The rules:**

1. \`provide(key, value)\` and \`inject(key)\` must be called **synchronously during setup** (top level of \`<script setup>\` or \`setup()\`).
2. Injection looks up the **nearest ancestor** that provided the key; if none did, it checks \`app.provide()\`; if still nothing, it returns the default — or \`undefined\` with a dev warning.
3. A component can't inject a value it provides itself — \`inject()\` always looks *above* the current component.
4. **Reactivity is not automatic.** Provide a \`ref\`, \`reactive\` object or \`computed\` to keep consumers in sync. Providing \`count.value\` hands out a frozen snapshot.
5. Keep **mutations in the provider**: provide state wrapped in \`readonly()\` plus functions that change it.

#### Keys: strings vs Symbols
`,
    {
      code: `// keys.js
export const ThemeKey = Symbol('theme')   // unique: can never collide

// provider
provide(ThemeKey, { theme: readonly(theme), toggleTheme })

// consumer
const { theme, toggleTheme } = inject(ThemeKey)`,
      lang: 'js',
      title: 'Symbol keys',
    },
    `
String keys are fine in small apps. In larger apps and libraries, export **Symbol** keys from one file so two features (or two libraries) can't clash on a name like \`'config'\`.

#### Default values
`,
    {
      code: `const size = inject('size', 'medium')                       // a plain default
const logger = inject('logger', () => createConsoleLogger(), true) // factory: 3rd arg true`,
      lang: 'js',
      title: 'defaults',
    },
    `
Pass \`true\` as the third argument when the default is expensive to create (or is itself a function you don't want called): Vue then calls the factory only if nothing was provided.

#### App-level provide (how plugins work)
`,
    {
      code: `// main.js
const app = createApp(App)
app.provide('apiBaseUrl', 'https://api.example.com')
app.mount('#app')

// any component
const baseUrl = inject('apiBaseUrl')`,
      lang: 'js',
      title: 'app.provide',
    },
    {
      code: `import type { InjectionKey, Ref } from 'vue'

interface ThemeContext { theme: Readonly<Ref<'light' | 'dark'>>; toggleTheme: () => void }
export const ThemeKey: InjectionKey<ThemeContext> = Symbol('theme')

const ctx = inject(ThemeKey)   // typed as ThemeContext | undefined`,
      lang: 'ts',
      title: 'TypeScript: InjectionKey',
      static: true,
    },
    {
      callout: 'note',
      title: 'Options API',
      text: 'Components using options write `provide() { return { key: value } }` (a function so it can use `this`) and `inject: [\'key\']` or `inject: { key: { from: \'key\', default: … } }`. To keep a provided value reactive there, provide a `computed(() => this.message)`.',
    },
    {
      callout: 'version',
      title: 'Versions',
      text: '`provide`/`inject` exist in all Vue 3 versions. `hasInjectionContext()` was added in Vue 3.3 for libraries that need to know whether `inject()` can be called. `app.runWithContext(fn)` (3.3+) lets code outside components call `inject()` against the app\'s provides.',
    },
  ],

  walkthrough: {
    title: 'cart.js',
    lang: 'js',
    code: cartJs,
    intro: 'The heart of the playground: a provider/consumer pair of composables around a Symbol key. This is the pattern you will use most in real apps.',
    steps: [
      { lines: [1], text: 'Everything comes from `vue`: the DI functions plus normal reactivity helpers.' },
      { lines: [3, 4], text: 'A `Symbol` key. Two Symbols are never equal, so no other code can provide or inject this cart by accident. Only code that imports `CartKey` can reach it.' },
      { lines: [6, 10], text: '`provideCart()` creates the cart state **inside** the function, so each provider gets its own cart (two separate shops on a page would not share).' },
      { lines: [12, 14], text: 'The only way to change the cart. All mutations live here, next to the state — easy to find, log or validate.' },
      { lines: [16, 18], text: 'The provided object: `items` wrapped in `readonly()` so consumers can\'t `push` into it directly, computed `count`/`total`, and the `add` action. `provide()` publishes it to every descendant.' },
      { lines: [21, 26], text: '`useCart()` hides the key and fails **loudly** with a helpful message if no ancestor called `provideCart()` — much better than a mysterious `undefined` three files later.' },
    ],
  },

  playground: {
    title: 'A shop without prop drilling',
    objective: 'Extend a provided cart and theme without adding a single prop to the components in between.',
    files: {
      'App.vue': appVue,
      'cart.js': cartJs,
      'ShopLayout.vue': shopLayout,
      'ShopHeader.vue': shopHeader,
      'ProductCard.vue': productCard,
    },
    entry: 'App.vue',
    expected: 'A header with the cart count and total, a theme button, and three product cards. "Add to cart" updates the header immediately, and the theme button switches the header **and** the cards to dark — even though `ShopLayout.vue` passes no props for either.',
    experiments: [
      {
        id: 'free-shipping',
        task: 'Show `<strong class="free-shipping">Free shipping!</strong>` in the header once the cart total reaches **40 €**. Don\'t touch `App.vue` or `ShopLayout.vue`.',
        hint: 'Add `const freeShipping = computed(() => total.value >= 40)` in `provideCart()`, include it in the provided object, then destructure it in `ShopHeader.vue` and render the badge with `v-if`.',
        tests: [
          {
            name: 'the badge appears at 40 € or more',
            code: `expect(exists('.free-shipping')).toBe(false)
const adds = findAll('.add')
await click(adds[1])
expect(exists('.free-shipping')).toBe(false)
await click(adds[2])
expect(text('.cart-count')).toContain('47')
expect(exists('.free-shipping')).toBe(true)`,
          },
        ],
        explain: 'Derived state belongs with the provider, so every consumer computes "free shipping" the same way. The middle components never changed.',
      },
      {
        id: 'clear-cart',
        task: 'Add a `clear()` action to the cart and a `<button class="clear-cart">Empty cart</button>` in the header that uses it.',
        hint: 'In `provideCart()`: `function clear() { items.value = [] }` and add `clear` to the provided object. In the header: destructure `clear` from `useCart()`.',
        tests: [
          {
            name: 'Empty cart resets the count',
            code: `const adds = findAll('.add')
await click(adds[0])
await click(adds[1])
expect(text('.cart-count')).toContain('2 items')
const btn = find('.clear-cart')
expect(btn).toBeTruthy()
await click(btn)
expect(text('.cart-count')).toContain('0 items')`,
          },
        ],
        explain: 'Consumers can only change the cart through the functions the provider chose to share. `items` is readonly, so there is exactly one place where the cart can change.',
      },
      {
        id: 'currency',
        task: 'Provide a currency symbol `\'$\'` from `App.vue` and inject it (with `\'€\'` as the default) in `ShopHeader.vue` and `ProductCard.vue`, replacing the hard-coded €.',
        hint: '`provide(\'currency\', \'$\')` in App; `const currency = inject(\'currency\', \'€\')` in both consumers; then `{{ product.price }} {{ currency }}`.',
        tests: [
          {
            name: 'prices and the total use the provided currency',
            code: `expect(text('.products')).toContain('12 $')
expect(text('.products')).not.toContain('€')
expect(text('.cart-count')).toContain('$')
expect(text('.cart-count')).not.toContain('€')`,
          },
        ],
        explain: 'Provided values don\'t have to be reactive — a constant configuration value is a perfectly good use. The default keeps both components working if they are ever rendered under a provider that doesn\'t set a currency.',
      },
      {
        id: 'readonly-guard',
        task: 'In `ProductCard.vue`, change the button to `@click="cart.items.push(product)"` and click it. Watch the console, then undo the change.',
        hint: 'The provided `items` is wrapped in `readonly()`.',
        explain: 'Vue warns that the set operation failed because the target is readonly, and the cart doesn\'t change. Readonly state + exposed actions is how you stop twenty deep components from mutating shared state in twenty different ways.',
      },
    ],
    variants: [
      {
        id: 'solved',
        label: 'All experiments solved',
        files: { 'App.vue': appSolved, 'cart.js': cartSolved, 'ShopLayout.vue': shopLayout, 'ShopHeader.vue': headerSolved, 'ProductCard.vue': cardSolved },
      },
    ],
  },

  internals: {
    beginner: `
Every component has a hidden **provides** object. When a component calls \`provide()\`, Vue gives it its own provides object that is *linked* to its parent's. When a component calls \`inject('theme')\`, Vue looks in the parent's provides; if the key isn't there, it follows the link up to the grandparent, and so on, up to the app. The first match wins. Nothing is copied — consumers receive the exact same object or ref that was provided.
`,
    technical: [
      `
Vue implements the chain with **JavaScript prototypes**. Each instance starts with \`instance.provides = parent.provides\` (shared, no allocation). The first time a component calls \`provide()\`, Vue creates \`Object.create(parentProvides)\` — a new object whose prototype is the parent's — and stores the key there. Lookups (\`key in provides\`) then walk the prototype chain natively.
`,
      {
        code: `// Simplified — not Vue's real source
function provide(key, value) {
  const instance = currentInstance
  const parentProvides = instance.parent ? instance.parent.provides : instance.appContext.provides
  if (instance.provides === parentProvides) {
    instance.provides = Object.create(parentProvides)   // own layer, linked upward
  }
  instance.provides[key] = value
}

function inject(key, defaultValue, treatDefaultAsFactory = false) {
  const instance = currentInstance
  // look ABOVE the current component: parent (or app for the root)
  const provides = instance.parent ? instance.parent.provides : instance.appContext.provides
  if (key in provides) return provides[key]       // walks the prototype chain
  if (arguments.length > 1) {
    return treatDefaultAsFactory ? defaultValue.call(instance.proxy) : defaultValue
  }
  warn('injection "' + String(key) + '" not found.')
}`,
        lang: 'js',
        title: 'mental model of provide / inject',
      },
      `
Two consequences fall out of this design:

- **Nearest wins** — a closer provider's key shadows the same key further up, exactly like prototype property shadowing.
- **No self-injection** — \`inject()\` reads from the *parent's* provides, so a component never sees its own \`provide()\` calls.

**Reactivity** is not part of provide/inject at all: Vue passes the value by reference. If it's a ref, the consumer holds the same ref, so reading \`.value\` in a template or computed is tracked normally. If it's a plain number, it's just a number.

**Timing:** \`currentInstance\` is only set while \`setup()\` runs, which is why both must be called synchronously during setup. \`app.provide()\` writes to \`appContext.provides\`, the root of every chain — this is where \`app.use(router)\` and \`app.use(pinia)\` register what \`useRouter()\` and \`useStore()\` later inject.
`,
    ],
    production: `
- **Wrap DI in composables:** \`provideX()\` / \`useX()\` pairs hide the key, give one place for types and docs, and let \`useX()\` throw a helpful error when the provider is missing.
- **Export Symbol keys** (typed with \`InjectionKey<T>\` in TypeScript) from a single module per feature.
- **Provide readonly state + actions.** If many components mutate an injected reactive object directly, bugs become very hard to trace.
- **Testing:** components that inject need their dependencies at mount time. Vue Test Utils accepts \`global: { provide: { [CartKey]: fakeCart } }\`, which also makes DI great for swapping real services (API clients, analytics, feature flags) with fakes in tests.
- **Know when to stop:** provide/inject is scoped to a subtree and invisible in props, which makes data flow less explicit. For app-wide state used by unrelated parts of the UI, with devtools support, SSR-safe per-request instances and plugins, reach for [Pinia](lesson:why-state-management). For one or two levels, props are clearer.
- **SSR:** module-level singletons are shared across requests on a server; values provided per app instance (\`app.provide\`) or per component are not — another reason DI is preferred for request-specific services.
`,
  },

  mistakes: [
    {
      title: 'Providing `.value` instead of the ref',
      wrong: { code: `const user = ref(null)\nprovide('user', user.value)   // provides null, forever`, lang: 'js' },
      right: { code: `const user = ref(null)\nprovide('user', readonly(user))   // consumers see every change`, lang: 'js' },
      explanation: '`user.value` is a plain value at the moment `provide` runs. Provide the ref itself (or a `computed`/`reactive`) so consumers stay connected.',
    },
    {
      title: 'Letting consumers mutate shared state directly',
      wrong: { code: `// provider\nprovide('cart', cart)        // a writable reactive object\n\n// somewhere deep\ncart.items.splice(0)         // who emptied the cart?!`, lang: 'js' },
      right: { code: `// provider\nprovide('cart', {\n  items: readonly(items),\n  add,\n  clear,\n})`, lang: 'js' },
      explanation: 'With writable injected state, any component can change it in any way, and tracking down a bad change means searching the whole subtree. Expose readonly state and named actions.',
    },
    {
      title: 'Calling `inject()` outside setup',
      wrong: { code: `function onClick() {\n  const cart = inject(CartKey)   // warns, returns undefined\n  cart.add(product)\n}`, lang: 'js' },
      right: { code: `const cart = inject(CartKey)     // top level of <script setup>\n\nfunction onClick() {\n  cart.add(product)\n}`, lang: 'js' },
      explanation: '`inject()` needs to know the current component, which is only set during setup. Inject at the top level and use the result later.',
    },
    {
      title: 'Using provide/inject for one level of data',
      wrong: { code: `// Parent\nprovide('title', title)\n\n// Direct child\nconst title = inject('title')`, lang: 'js' },
      right: { code: `<!-- Parent -->\n<Child :title="title" />\n\n<!-- Child -->\nconst props = defineProps(['title'])`, lang: 'vue' },
      explanation: 'For a direct child, props are explicit, validated, visible in the template and easy to test. Use provide/inject when the data must cross several layers or belongs to a whole subtree.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: injection "theme" not found.`',
      cause: 'No ancestor provides that key: wrong key (typo, or a different Symbol instance), the provider isn\'t actually an ancestor (e.g. a sibling), or the component is rendered in isolation (tests, Storybook).',
      fix: 'Import Symbol keys from one module; make sure the provider wraps the consumer in the tree; in tests pass `global.provide`; add a sensible default if the dependency is optional.',
    },
    {
      symptom: 'Injected value shows the initial data and never updates.',
      cause: 'A plain value (`ref.value`, a destructured property of a reactive object) was provided.',
      fix: 'Provide the ref, `reactive` object, or `computed(() => …)` instead.',
    },
    {
      symptom: '`[Vue warn]: inject() can only be used inside setup() or functional components.`',
      cause: '`inject()` was called in an event handler, a `setTimeout`, after an `await`, or in a plain module.',
      fix: 'Call it synchronously at the top of setup and keep the result in a variable.',
    },
    {
      symptom: '`Set operation on key "0" failed: target is readonly.`',
      cause: 'A consumer tried to mutate state the provider deliberately wrapped in `readonly()`.',
      fix: 'Call one of the provider\'s actions instead, or add a new action to the provider.',
    },
    {
      symptom: 'A component gets a different value than the one provided by `App`.',
      cause: 'A nearer ancestor provides the same key and shadows it.',
      fix: 'Inspect the component tree in Vue Devtools (it shows provided/injected values), and prefer Symbol keys to avoid accidental shadowing.',
    },
  ],

  bestPractices: [
    'Provide refs/reactive/computed values, never `.value` snapshots, when consumers should react to changes.',
    'Wrap provided state in `readonly()` and expose functions for changes; keep mutations in the provider.',
    'Use exported `Symbol` keys (typed with `InjectionKey`) for anything beyond a tiny app.',
    'Pair `provideX()` / `useX()` composables, and make `useX()` throw a clear error if the provider is missing.',
    'Use defaults only for genuinely optional dependencies; required ones should fail loudly.',
    'Keep props for direct parent → child data; use provide/inject for subtree-wide context and services.',
    'In tests, supply dependencies with `global.provide` instead of mocking modules.',
  ],

  useCases: [
    'Theme, locale/i18n, or design-system configuration (size, density) for a subtree.',
    'Compound components: `<Tabs>` with `<Tab>` children, `<Form>` with nested `<Field>`s that register themselves, `<Accordion>` with items.',
    'Feature-scoped state: a cart, a wizard\'s collected answers, a document editor\'s selection.',
    'Injectable services: an API client, logger, analytics or feature-flag client, swappable in tests.',
    'Libraries and plugins exposing their instance app-wide (Vue Router, Pinia, i18n libraries) via `app.provide`.',
  ],

  whenToUse: {
    use: [
      'Data or services are needed by components several levels down, and the middle layers don\'t care about them.',
      'A parent component and its slotted/nested children form one widget (tabs, forms, menus).',
      'You want to inject replaceable dependencies (and fake them in tests).',
    ],
    avoid: [
      'Passing data to a direct child — use props.',
      'Global app state used by unrelated parts of the UI, needing devtools and plugins — use Pinia.',
      'Sending events up the tree — use emits, or provide a function explicitly designed for it.',
    ],
  },

  comparison: {
    title: 'Props vs provide/inject vs Pinia',
    headers: ['', 'Props', 'provide / inject', 'Pinia store'],
    rows: [
      ['Scope', 'parent → direct child', 'ancestor → any descendant in its subtree', 'whole app (any component)'],
      ['Explicitness', 'visible in templates, validated', 'implicit — look for the key', 'explicit import of the store'],
      ['Reactivity', 'automatic', 'only if you provide refs/reactive/computed', 'automatic'],
      ['Multiple independent instances', 'yes, per parent', 'yes, per provider subtree', 'one per store id (per app)'],
      ['Devtools', 'component props panel', 'shown in component inspector', 'dedicated store panel, time-travel'],
      ['Typical use', 'component inputs', 'theme, form context, services, compound components', 'cart, auth session, cached server data'],
    ],
    note: 'Pinia itself uses `app.provide` under the hood to make the active store instance available. See [Component communication patterns](lesson:component-communication) for the full map.',
  },

  quiz: [
    {
      id: 'provide-inject-q1',
      type: 'mcq',
      prompt: 'A component calls `inject(\'config\')` but no ancestor (and not the app) provides `\'config\'`, and no default is given. What happens?',
      options: [
        { text: 'It throws an error and the component fails to render.', why: 'Vue does not throw; it warns.' },
        { text: 'It returns `undefined` and Vue logs a dev warning.' },
        { text: 'It returns an empty object.', why: 'There is no automatic placeholder.' },
        { text: 'It waits until something provides the key.', why: 'Injection is resolved once, synchronously, during setup.' },
      ],
      answer: 1,
      explanation: 'Missing injections resolve to `undefined` with an "injection not found" warning in development. Pass a default if the dependency is optional, or throw your own error in a `useX()` wrapper if it is required.',
    },
    {
      id: 'provide-inject-q2',
      type: 'output',
      prompt: '`App` renders `Middle`, which renders `Leaf`. What does `Leaf` display?',
      code: {
        lang: 'vue',
        code: `<!-- App.vue -->
<script setup>
import { provide } from 'vue'
provide('color', 'red')
</script>

<!-- Middle.vue -->
<script setup>
import { provide } from 'vue'
provide('color', 'blue')
</script>

<!-- Leaf.vue -->
<script setup>
import { inject } from 'vue'
const color = inject('color', 'green')
</script>
<template>{{ color }}</template>`,
      },
      options: [
        { text: 'red', why: '`Middle` is nearer to `Leaf` and provides the same key.' },
        { text: 'blue' },
        { text: 'green', why: 'The default is used only if no ancestor provides the key.' },
        { text: 'red blue', why: 'Injection returns a single value, not a list.' },
      ],
      answer: 1,
      explanation: 'Injection uses the nearest ancestor that provides the key. `Middle` shadows `App`\'s value for its whole subtree.',
    },
    {
      id: 'provide-inject-q3',
      type: 'bug',
      prompt: 'Clicking "Log in" updates the parent, but the deeply nested avatar keeps saying "Guest". Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, provide } from 'vue'
import Page from './Page.vue'

const userName = ref('Guest')
provide('userName', userName.value)

function login() {
  userName.value = 'Ada'
}
</script>

<template>
  <button @click="login">Log in</button>
  <Page />
</template>`,
      },
      answerLine: 6,
      explanation: '`userName.value` is the string "Guest" at the time `provide` runs, so the descendants received a plain string. Provide the ref itself — ideally `readonly(userName)`.',
    },
    {
      id: 'provide-inject-q4',
      type: 'fill',
      prompt: 'Complete the collision-proof key and the injection with a default of `\'light\'`.',
      code: {
        lang: 'js',
        code: `// keys.js
export const ThemeKey = ___('theme')

// SomeDeepComponent.vue
const theme = ___(ThemeKey, 'light')`,
      },
      answer: [['Symbol'], ['inject']],
      explanation: '`Symbol(\'theme\')` creates a unique key; only code that imports `ThemeKey` can provide or inject it. `inject(key, default)` returns the default if no ancestor provides it.',
    },
    {
      id: 'provide-inject-q5',
      type: 'mcq',
      prompt: 'Select **all** good uses of provide/inject.',
      options: [
        { text: 'A `<Form>` component sharing its validation context with nested `<Field>` components.' },
        { text: 'Passing a `title` from a parent to its direct child.', why: 'One level of data is clearer with a prop.' },
        { text: 'Making an API client available to a feature\'s components, swappable for a fake in tests.' },
        { text: 'A theme that applies to a whole page section.' },
        { text: 'Sending a "saved" event from a child up to its parent.', why: 'Child → parent communication is what `emit` is for.' },
      ],
      answer: [0, 2, 3],
      explanation: 'Provide/inject shines for subtree-wide context (form, theme) and injectable services. Direct parent/child data uses props; upward events use emits.',
    },
    {
      id: 'provide-inject-q6',
      type: 'mcq',
      prompt: 'A component calls `provide(\'step\', 1)` and, on the next line, `inject(\'step\', 0)`. Its parent provides nothing. What does `inject` return?',
      options: [
        { text: '`1`', why: '`inject()` looks at the ancestors\' provides, never the current component\'s.' },
        { text: '`0`' },
        { text: '`undefined`', why: 'A default was given, so the default is used.' },
        { text: 'It throws "circular injection".', why: 'There is no such error; it simply doesn\'t see its own provide.' },
      ],
      answer: 1,
      explanation: 'Injection always starts from the parent. A component cannot inject what it provides itself, so the default `0` is returned.',
    },
    {
      id: 'provide-inject-q7',
      type: 'short',
      prompt: 'Why is it a good idea to provide `readonly(state)` together with functions, instead of the writable state itself?',
      answer: 'It keeps all changes to the shared state inside the provider, where they are easy to find, validate and debug. Consumers can read reactive data and call named actions, but cannot mutate the state in arbitrary ways from anywhere in the subtree.',
    },
  ],

  exercises: [
    {
      id: 'toast-notifications',
      title: 'Toast notifications through DI',
      difficulty: 'intermediate',
      prompt: `
Build a small notification system in \`notify.js\` and use it from a deeply nested button.

- Export \`provideNotifications()\`: it creates a list of toasts, provides \`{ toasts, notify, dismiss }\` under a **Symbol** key, and returns the same object. \`toasts\` must be readonly. \`notify(message)\` adds \`{ id, message }\`; \`dismiss(id)\` removes it.
- Export \`useNotify()\`: it injects the object and **throws an Error** if there is no provider.
- \`App.vue\` calls \`provideNotifications()\` and renders each toast as \`<div class="toast">\` with the message and a \`<button class="dismiss">\`.
- \`SaveButton.vue\` (nested inside \`SettingsPanel.vue\`) calls \`notify('Settings saved')\` when \`.save\` is clicked. \`SettingsPanel.vue\` must not get any new props.
`,
      files: {
        'notify.js': `import { ref, readonly, provide, inject } from 'vue'

// TODO: a Symbol key

export function provideNotifications() {
  // TODO
}

export function useNotify() {
  // TODO
}`,
        'App.vue': `<script setup>
import SettingsPanel from './SettingsPanel.vue'
// TODO: provide notifications and render the toasts
</script>

<template>
  <SettingsPanel />
</template>`,
        'SettingsPanel.vue': `<script setup>
import SaveButton from './SaveButton.vue'
</script>

<template>
  <section class="panel">
    <h3>Settings</h3>
    <label><input type="checkbox" /> Email me updates</label>
    <SaveButton />
  </section>
</template>`,
        'SaveButton.vue': `<script setup>
// TODO: use the notifications
</script>

<template>
  <button class="save">Save</button>
</template>`,
      },
      hints: [
        'Key: `const NotifyKey = Symbol(\'notify\')`. State: `const toasts = ref([])` with an incrementing id counter.',
        '`provide(NotifyKey, api)` where `api = { toasts: readonly(toasts), notify, dismiss }`; `useNotify()` does `const api = inject(NotifyKey, null)` and throws if it is `null`.',
        'In App: `const { toasts, dismiss } = provideNotifications()` and `v-for="t in toasts"`. In SaveButton: `const { notify } = useNotify()` and `@click="notify(\'Settings saved\')"`.',
      ],
      solution: {
        explanation: 'The provider owns the list and the only two ways to change it. The deep button reaches `notify` without the panel in between knowing anything. `useNotify()` failing loudly turns a confusing `undefined` into a clear message — and it fails even when called outside a component, because `inject()` then has no context and returns `undefined`.',
        files: {
          'notify.js': `import { ref, readonly, provide, inject } from 'vue'

const NotifyKey = Symbol('notify')

export function provideNotifications() {
  const toasts = ref([])
  let nextId = 1

  function notify(message) {
    toasts.value.push({ id: nextId++, message })
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const api = { toasts: readonly(toasts), notify, dismiss }
  provide(NotifyKey, api)
  return api
}

export function useNotify() {
  const api = inject(NotifyKey, null)
  if (!api) throw new Error('useNotify() must be used under provideNotifications()')
  return api
}`,
          'App.vue': `<script setup>
import SettingsPanel from './SettingsPanel.vue'
import { provideNotifications } from './notify.js'

const { toasts, dismiss } = provideNotifications()
</script>

<template>
  <SettingsPanel />
  <div v-for="t in toasts" :key="t.id" class="toast">
    {{ t.message }}
    <button class="dismiss" @click="dismiss(t.id)">✕</button>
  </div>
</template>`,
          'SettingsPanel.vue': `<script setup>
import SaveButton from './SaveButton.vue'
</script>

<template>
  <section class="panel">
    <h3>Settings</h3>
    <label><input type="checkbox" /> Email me updates</label>
    <SaveButton />
  </section>
</template>`,
          'SaveButton.vue': `<script setup>
import { useNotify } from './notify.js'

const { notify } = useNotify()
</script>

<template>
  <button class="save" @click="notify('Settings saved')">Save</button>
</template>`,
        },
      },
      tests: [
        { name: 'clicking Save shows a toast', code: `expect(findAll('.toast')).toHaveLength(0)\nawait click('.save')\nexpect(findAll('.toast')).toHaveLength(1)\nexpect(text('.toast')).toContain('Settings saved')` },
        { name: 'toasts can be dismissed', code: `await click('.save')\nawait click('.save')\nexpect(findAll('.toast')).toHaveLength(2)\nawait click('.toast .dismiss')\nexpect(findAll('.toast')).toHaveLength(1)` },
        { name: 'useNotify() throws without a provider', code: `const { useNotify } = requireModule('notify.js')\nexpect(() => useNotify()).toThrow()` },
        { name: 'provideNotifications is exported', code: `const mod = requireModule('notify.js')\nexpect(typeof mod.provideNotifications).toBe('function')` },
      ],
    },
    {
      id: 'stale-user',
      title: 'Fix a stale injected user',
      difficulty: 'intermediate',
      prompt: `
\`App.vue\` provides the current user to a deeply nested \`UserBadge.vue\`, but the badge never updates after logging in. The badge should also have its own **Log out** button.

- Fix the provider so \`<span class="badge-name">\` shows **Guest** at first and **Ada** after clicking \`.login\` in \`App.vue\`.
- Provide a \`logout()\` function as well; \`<button class="logout">\` in \`UserBadge.vue\` must call it, switching the badge back to **Guest**.
- Keep the user read-only for consumers.
`,
      files: {
        'App.vue': `<script setup>
import { ref, provide } from 'vue'
import PageLayout from './PageLayout.vue'

const userName = ref('Guest')

function login() {
  userName.value = 'Ada'
}

provide('auth', { userName: userName.value })
</script>

<template>
  <button class="login" @click="login">Log in</button>
  <PageLayout />
</template>`,
        'PageLayout.vue': `<script setup>
import UserBadge from './UserBadge.vue'
</script>

<template>
  <header class="top"><UserBadge /></header>
</template>`,
        'UserBadge.vue': `<script setup>
import { inject } from 'vue'

const auth = inject('auth')
</script>

<template>
  <span class="badge-name">{{ auth.userName }}</span>
  <button class="logout">Log out</button>
</template>`,
      },
      hints: [
        'What exactly does `userName.value` hand to `provide()` — a ref or a string?',
        'Provide `{ userName: readonly(userName), logout }` and add a `logout()` function that sets the name back to Guest.',
        'In the badge, destructure what you need: `const { userName, logout } = inject(\'auth\')`, then use `{{ userName }}` and `@click="logout"`.',
      ],
      solution: {
        explanation: 'Providing `userName.value` provided a string snapshot. Providing the (readonly) ref keeps the badge connected. Destructuring makes `userName` and `logout` top-level bindings in the badge. (`{{ auth.userName }}` would also display correctly, because a ref that is the final value of a text interpolation is unwrapped — but in an expression like `auth.userName + \'!\'` it would not be, so top-level bindings are the safer habit.)',
        files: {
          'App.vue': `<script setup>
import { ref, provide, readonly } from 'vue'
import PageLayout from './PageLayout.vue'

const userName = ref('Guest')

function login() {
  userName.value = 'Ada'
}

function logout() {
  userName.value = 'Guest'
}

provide('auth', { userName: readonly(userName), logout })
</script>

<template>
  <button class="login" @click="login">Log in</button>
  <PageLayout />
</template>`,
          'PageLayout.vue': `<script setup>
import UserBadge from './UserBadge.vue'
</script>

<template>
  <header class="top"><UserBadge /></header>
</template>`,
          'UserBadge.vue': `<script setup>
import { inject } from 'vue'

const { userName, logout } = inject('auth')
</script>

<template>
  <span class="badge-name">{{ userName }}</span>
  <button class="logout" @click="logout">Log out</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts as Guest', code: `expect(text('.badge-name')).toBe('Guest')` },
        { name: 'logging in updates the badge', code: `await click('.login')\nexpect(text('.badge-name')).toBe('Ada')` },
        { name: 'the badge can log out through the injected function', code: `await click('.login')\nawait click('.logout')\nexpect(text('.badge-name')).toBe('Guest')` },
      ],
    },
  ],

  interview: [
    {
      id: 'provide-inject-what-problem',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What problem do `provide` and `inject` solve in Vue?',
      answer: 'Prop drilling: passing data through intermediate components that don\'t need it. An ancestor calls `provide(key, value)` and any descendant, at any depth, calls `inject(key)` to receive it — the components in between are untouched. It\'s Vue\'s built-in dependency injection.',
      explanation: 'Provide once at the top of a subtree, inject wherever needed below.',
      whyAsked: 'A standard question about component communication options beyond props and events.',
      mistakes: ['Saying it makes data global (it is scoped to the provider\'s subtree, unless provided at app level).', 'Claiming injected values are always reactive.'],
      followUps: ['How do you keep injected values reactive?', 'What happens if two ancestors provide the same key?'],
      modelAnswer: 'They solve prop drilling. When a deeply nested component needs something like the theme, the current user or a form context, I can provide it once from an ancestor and inject it wherever it\'s needed, without adding props to every component in between. It\'s scoped to the provider\'s subtree, the nearest provider wins, and app-level provide makes something available everywhere — that\'s how plugins like Vue Router work. Reactivity isn\'t automatic: I provide refs or computed values, usually read-only, together with functions to change them.',
    },
    {
      id: 'provide-inject-vs-props',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'When would you use props, when provide/inject, and when a Pinia store?',
      answer: 'Props for direct parent→child inputs: explicit, validated, visible in templates. Provide/inject for context that a whole subtree needs or for compound components and injectable services, when the middle layers shouldn\'t care. Pinia for application-wide state shared by unrelated parts of the UI, where you want devtools, plugins and a single, explicit source of truth.',
      explanation: 'Scope decides: one level → props; a subtree → provide/inject; the whole app → a store.',
      whyAsked: 'The classic "component communication" question; reveals architectural judgement.',
      mistakes: [
        'Using provide/inject everywhere to "avoid props".',
        'Saying provide/inject replaces Pinia entirely.',
        'Forgetting that provide/inject allows multiple independent instances per subtree, unlike a single store.',
      ],
      followUps: ['What are the downsides of provide/inject for readability?', 'How would two independent carts on one page work with each approach?'],
      modelAnswer: 'I choose by scope. For a direct child I use props — they\'re explicit, validated and easy to test. When a value belongs to a subtree — a theme for a section, a form that its fields register with, tabs and their panels, or a service I want to swap in tests — provide/inject avoids drilling through components that don\'t care, and I can have several independent providers. For state the whole app shares, like the auth session or a cart used on many pages, I\'d use Pinia: it\'s explicit to import, has devtools, plugins and SSR support. The cost of provide/inject is that dependencies are implicit, so I wrap them in composables with clear names and errors.',
    },
    {
      id: 'provide-inject-stale-value',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A parent does `provide(\'count\', count.value)` and later increments `count`. Children that inject `count` never update. Why, and how do you fix it while preventing children from changing it?',
      answer: '`count.value` is a plain number at provide time, so children received a snapshot. Provide the ref instead, wrapped in `readonly()` to block writes: `provide(\'count\', readonly(count))`. If children need to change it, provide an `increment()` function too.',
      explanation: 'provide/inject passes values by reference; it doesn\'t add reactivity. Refs carry reactivity with them.',
      whyAsked: 'The most common provide/inject bug; checks understanding of how reactivity travels.',
      mistakes: ['Suggesting a watcher in the child to "refresh" the value.', 'Providing the writable ref and letting every child mutate it.'],
      followUps: ['What if the provided value is a property of a reactive object?', 'How does the Options API keep a provided value reactive?'],
      modelAnswer: 'Because `count.value` is just a number when `provide` runs, the children got a frozen copy. Provide/inject passes values by reference and doesn\'t add reactivity, so I provide the ref itself — or a computed — and wrap it in `readonly()` so children can read but not write. If they need to change it, I also provide an `increment` function, which keeps all mutations in the parent. For a property of a reactive object I\'d provide `toRef(state, \'count\')` or a computed.',
    },
    {
      id: 'provide-inject-resolution',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: '`App` provides `locale: \'en\'`. `Settings` (child of App) provides `locale: \'fr\'` and then, in the same setup, calls `inject(\'locale\')`. `LanguagePicker` (child of Settings) also injects `locale`. What do `Settings` and `LanguagePicker` receive?',
      options: ['Settings: fr, Picker: fr', 'Settings: en, Picker: fr', 'Settings: en, Picker: en', 'Settings: fr, Picker: en'],
      correctOption: 1,
      answer: '**Settings gets `en`, LanguagePicker gets `fr`.** `inject()` always looks at the parent\'s provides, so a component never sees its own provide; descendants of `Settings` see its closer value.',
      explanation: 'Provides form a prototype chain: each provider adds a layer for its subtree, and lookups start one level up.',
      whyAsked: 'Tests a precise mental model of resolution, which matters when building compound components and plugins.',
      mistakes: ['Assuming self-injection returns the component\'s own value.', 'Assuming the top-most provider always wins.'],
      followUps: ['How is this implemented?', 'How would a nested `<Form>` inside another `<Form>` behave?'],
      modelAnswer: 'Settings gets "en" and the picker gets "fr". Injection starts at the parent\'s provides and walks up, so Settings can\'t see its own provide and finds App\'s value. Once Settings provides, Vue gives it its own provides object whose prototype is App\'s, so its descendants find "fr" first — the nearest provider wins. That\'s exactly what you want for nested forms: an inner form shadows the outer one for its own fields.',
    },
    {
      id: 'provide-inject-di-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design how components in a large app get an HTTP API client so that it is easy to configure per environment and to replace with a fake in tests.',
      answer: 'Create the client in `main.js` from configuration and register it with `app.provide(ApiKey, client)` (or a small plugin), where `ApiKey` is an exported, typed `InjectionKey`. Expose `useApi()` that injects it and throws if missing. Components and composables call `useApi()` instead of importing a singleton. Tests mount with `global: { provide: { [ApiKey]: fakeApi } }`; Storybook or feature sandboxes can provide alternatives too. Sub-trees can even provide a differently-configured client (e.g. an admin API).',
      explanation: 'DI inverts the dependency: components ask for "an API client" instead of importing a specific one, so the composition root decides which one they get.',
      code: {
        lang: 'js',
        code: `// api.js
export const ApiKey = Symbol('api')
export function useApi() {
  const api = inject(ApiKey, null)
  if (!api) throw new Error('No API client provided')
  return api
}

// main.js
app.provide(ApiKey, createApiClient({ baseUrl: import.meta.env.VITE_API_URL }))

// in a test
mount(UserList, { global: { provide: { [ApiKey]: fakeApi } } })`,
      },
      whyAsked: 'Assesses senior-level architecture: testability, configuration, and separation of concerns.',
      mistakes: ['Importing a module-level singleton everywhere and mocking modules in every test.', 'Using string keys that can collide.', 'Forgetting SSR: module singletons leak between requests.'],
      followUps: ['How does Pinia use the same mechanism?', 'What changes for SSR?', 'How would you type it in TypeScript?'],
      modelAnswer: 'I\'d treat `main.js` as the composition root: build the client from environment config and `app.provide` it under an exported Symbol key typed with `InjectionKey`. A `useApi()` composable injects it and throws a clear error if it\'s missing, so components never import the concrete client. In tests I mount with `global.provide` and a fake — no module mocking. Because it\'s DI, a subtree such as an admin area could provide a differently-configured client. It\'s also SSR-friendly: each request creates its own app and its own client, instead of sharing a module singleton across users.',
    },
    {
      id: 'provide-inject-ownership',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A dashboard provides a big reactive `filters` object. Over time, a dozen nested widgets started mutating it directly, and now filters change unexpectedly. How do you fix the design?',
      answer: 'Make the provider the single owner: provide `readonly(filters)` plus explicit actions (`setDateRange`, `toggleCategory`, `reset`). Readonly turns accidental writes into warnings, and all changes become searchable, loggable and validatable in one place. If the state is needed beyond the dashboard subtree or needs devtools history, move it into a Pinia store with actions.',
      explanation: 'Shared mutable state + many writers = untraceable bugs. Narrow the write surface.',
      whyAsked: 'Probes experience with real-world state ownership problems.',
      mistakes: ['Adding watchers to "detect" bad changes.', 'Deep-cloning the object for every widget.'],
      followUps: ['How would you migrate gradually without breaking all widgets at once?', 'When would you switch to Pinia?'],
      modelAnswer: 'I\'d make ownership explicit. The dashboard keeps the writable state private and provides `readonly(filters)` together with named actions like `setDateRange` and `toggleCategory`. Any widget that still writes directly now gets a readonly warning in development, which gives me a to-do list for migrating them one by one. All changes then go through a few functions where I can validate, log or sync to the URL. If the filters turned out to be needed outside the dashboard or we wanted devtools time-travel, I\'d move them into a Pinia store with the same actions.',
    },
    {
      id: 'provide-inject-coding-locale',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Make the language switch work without adding props to `Page.vue`. `App.vue` owns the locale (`\'en\'` or `\'fr\'`); `.toggle-locale` switches it. The deeply nested `Greeting.vue` must show **Hello!** or **Bonjour !** in `<p class="greeting">`, and be safe to render without a provider (default to English).',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import Page from './Page.vue'

const locale = ref('en')
</script>

<template>
  <button class="toggle-locale">EN / FR</button>
  <Page />
</template>`,
          'Page.vue': `<script setup>
import Greeting from './Greeting.vue'
</script>

<template>
  <main><Greeting /></main>
</template>`,
          'Greeting.vue': `<script setup>
import { computed } from 'vue'

const messages = { en: 'Hello!', fr: 'Bonjour !' }
const text = computed(() => messages.en)
</script>

<template>
  <p class="greeting">{{ text }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'starts in English', code: `expect(text('.greeting')).toBe('Hello!')` },
        { name: 'the toggle switches to French and back', code: `await click('.toggle-locale')\nexpect(text('.greeting')).toBe('Bonjour !')\nawait click('.toggle-locale')\nexpect(text('.greeting')).toBe('Hello!')` },
        { name: 'Greeting works without a provider', code: `const g = mountFile('Greeting.vue')\nexpect(g.text()).toBe('Hello!')` },
      ],
      hints: ['Provide the ref: `provide(\'locale\', readonly(locale))`, and toggle it in App.', 'In Greeting: `const locale = inject(\'locale\', ref(\'en\'))` — a ref default keeps `.value` working without a provider.'],
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, provide, readonly } from 'vue'
import Page from './Page.vue'

const locale = ref('en')
provide('locale', readonly(locale))

function toggle() {
  locale.value = locale.value === 'en' ? 'fr' : 'en'
}
</script>

<template>
  <button class="toggle-locale" @click="toggle">EN / FR</button>
  <Page />
</template>`,
          'Page.vue': `<script setup>
import Greeting from './Greeting.vue'
</script>

<template>
  <main><Greeting /></main>
</template>`,
          'Greeting.vue': `<script setup>
import { computed, inject, ref } from 'vue'

const messages = { en: 'Hello!', fr: 'Bonjour !' }
const locale = inject('locale', ref('en'))
const text = computed(() => messages[locale.value] ?? messages.en)
</script>

<template>
  <p class="greeting">{{ text }}</p>
</template>`,
        },
      },
      answer: 'App provides the readonly locale ref and toggles it; Greeting injects it with a ref default and derives the text with a computed.',
      explanation: 'The default is a ref so the computed can read `.value` in both cases. `Page.vue` never changed.',
      whyAsked: 'A compact live-coding task covering reactive provide, defaults and isolation for tests.',
      mistakes: ['Providing `locale.value`.', 'Using a string default and then reading `.value` on it.', 'Adding a `locale` prop to `Page.vue`.'],
      followUps: ['How would you expose `setLocale` to deep components?', 'How would a real i18n library structure this?'],
      modelAnswer: 'App owns the locale ref and provides it read-only; its button toggles the value. Greeting injects it with a default of `ref(\'en\')` so the same `.value`-based computed works with or without a provider, and the computed picks the message. Page doesn\'t change at all. In a real app I\'d wrap this in `provideLocale` / `useLocale` composables with a Symbol key, and also provide a `setLocale` action.',
    },
  ],

  takeaways: [
    '`provide(key, value)` in an ancestor + `inject(key, default?)` in any descendant removes prop drilling.',
    'The nearest provider wins; a component never injects its own provide; missing keys give the default or `undefined` with a warning.',
    'Reactivity is not automatic: provide refs/reactive/computed — ideally `readonly()` — plus functions that change them.',
    'Use exported Symbol keys and `provideX()`/`useX()` composable pairs that fail loudly when the provider is missing.',
    'Props for direct children, provide/inject for subtree context and services, Pinia for app-wide shared state.',
  ],
}
