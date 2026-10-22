// Lesson: ES modules — import & export.

const modMain = `import products from './products.js'          // default import
import { formatPrice } from './format.js'      // named import
import { addToCart, cartTotal } from './cart.js'
import { renderBadge } from './badge.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <header><span class="badge"></span></header>
  <ul class="products"></ul>
  <p class="total"></p>
\`

const list = app.querySelector('.products')
const badge = app.querySelector('.badge')
const total = app.querySelector('.total')

function refresh() {
  renderBadge(badge)
  total.textContent = 'Total: ' + formatPrice(cartTotal())
}

for (const product of products) {
  const li = document.createElement('li')
  li.className = 'product'
  li.textContent = product.name + ' ' + formatPrice(product.price) + ' '

  const button = document.createElement('button')
  button.className = 'add'
  button.textContent = 'Add'
  button.addEventListener('click', () => {
    addToCart(product)
    refresh()
  })

  li.append(button)
  list.append(li)
}

refresh()`

const modCart = `console.log('cart.js evaluated') // runs ONCE, however many files import it

// Module scope: private to this file, but shared by every importer
const items = []

export function addToCart(product) {
  items.push(product)
}

export function cartCount() {
  return items.length
}

export function cartTotal() {
  return items.reduce((sum, item) => sum + item.price, 0)
}`

const modBadge = `import { cartCount } from './cart.js'

export function renderBadge(el) {
  el.textContent = '🛒 ' + cartCount()
}`

const modFormat = `export const CURRENCY = '$'

export function formatPrice(cents) {
  return CURRENCY + (cents / 100).toFixed(2)
}`

const modProducts = `export default [
  { id: 1, name: 'Notebook', price: 600 },
  { id: 2, name: 'Desk Lamp', price: 3900 },
  { id: 3, name: 'Coffee Mug', price: 1200 },
]`

export default {
  id: 'es-modules',
  title: 'ES modules: import & export',
  summary: 'Split code into files that share exactly what they choose to — the system every `.vue` file, composable and store is built on.',
  difficulty: 'beginner',
  minutes: 30,
  prerequisites: ['js-essentials'],
  related: ['modern-js-syntax', 'single-file-components', 'create-vue-project', 'composables-intro', 'lazy-routes-scroll', 'bundle-optimization'],
  tags: ['javascript', 'modules', 'esm', 'import', 'export', 'default export', 'named export', 'vite', 'bundler', 'code splitting', 'dynamic import', 'singleton'],
  apis: [
    { name: 'export / export default', summary: 'Make a value available to other modules — by name, or as the module\'s single main value.' },
    { name: 'import { x } from \'./file.js\'', summary: 'Bring in a named export (braces, exact name; rename with `as`).' },
    { name: 'import X from \'./File.vue\'', summary: 'Bring in a default export under any name you choose.' },
    { name: 'import * as ns from \'./file.js\'', summary: 'Bring in every named export as properties of one object.' },
    { name: 'import()', summary: 'Dynamic import: loads a module on demand and returns a Promise — the basis of lazy routes and code splitting.' },
  ],
  docs: [
    { label: 'MDN — JavaScript modules', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules' },
    { label: 'MDN — import', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import' },
    { label: 'MDN — export', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export' },
    { label: 'Vue Guide — Single-File Components', url: 'https://vuejs.org/guide/scaling-up/sfc.html' },
    { label: 'Vue Guide — SSR: cross-request state pollution', url: 'https://vuejs.org/guide/scaling-up/ssr.html#cross-request-state-pollution' },
  ],

  intro: `
A **module** is just a JavaScript file that keeps its variables to itself and shares only what it **exports**. Other files **import** what they need.

\`\`\`js
// format.js
export function formatPrice(cents) { return '$' + (cents / 100).toFixed(2) }

// main.js
import { formatPrice } from './format.js'
\`\`\`

That's the whole idea — and it's everywhere in Vue. Every \`.vue\` file is a module whose default export is a component. You \`import { ref } from 'vue'\`. Composables live in \`useSomething.js\` modules; Pinia stores in \`stores/cart.js\`; routes import page components. Understanding modules means understanding how a Vue project is wired together.
`,

  why: `
Before modules, every script shared one global scope. Two files that both declared \`let count\` would clash; you had to load \`<script>\` tags in exactly the right order, and nothing told you which file depended on which.

Modules fix that:

- **Privacy by default** — top-level variables stay inside the file unless exported.
- **Explicit dependencies** — the \`import\` lines at the top say exactly what a file needs and where it comes from. Tools can follow them.
- **Loaded once** — however many files import \`cart.js\`, it runs once, so its state is shared. That is a powerful tool for shared state… and a classic source of "why do all my components share this?" bugs.
- **Optimisable** — because imports are static, bundlers like Vite can drop code you never import (*tree shaking*) and split rarely used code into separate files loaded on demand.
`,

  eli15: `
Think of a big school project split between classmates. Each person works in their own notebook — that's a **module**. What's in your notebook is private: scribbles, half-finished ideas.

When you finish something others need, you put it on the shared table with a label: "Ada's chart — *export*". Anyone who needs it walks over and takes a copy of the label: "I'll use Ada's chart — *import*".

Some notebooks have one big main thing (a poster) — that's the **default export**; you can call it whatever you like when you take it. Others offer several small labelled things — **named exports**; you ask for them by their exact name.

And there's only **one** of each notebook. If two classmates both "import" Ada's tally sheet and one adds a mark, the other sees it too — it's the same sheet.
`,

  analogy: {
    title: 'A shop with a stockroom',
    body: `
A shop has a stockroom full of things customers never see, and a counter where specific items are put out for sale. Customers can only buy what's on the counter, they ask for items by name, and some shops have one "signature product" they push at the door.

A module is the shop: the file's private code is the stockroom, exports are the counter, a default export is the signature product, and \`import\` is a customer asking for specific items.
`,
    mapping: [
      ['the stockroom', 'top-level variables that are not exported (module scope)'],
      ['items on the counter', 'named exports'],
      ['the signature product', 'the default export (one per module)'],
      ['a customer\'s order', 'an `import` statement listing what it needs'],
      ['there is only one shop', 'a module is evaluated once and shared by every importer'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The module graph of the playground',
    caption: 'Step through how the browser (or Vite) loads the playground: follow the imports, evaluate dependencies first, and evaluate each module only once.',
    alt: 'A dependency graph. main.js at the top imports products.js, format.js, cart.js and badge.js. badge.js also imports cart.js. Steps show the graph being discovered from the entry, modules evaluated dependencies-first, cart.js evaluated only once, and both main.js and badge.js sharing its items array.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'main', label: 'main.js', note: 'entry', tone: 'ink', x: 380, y: 50 },
        { id: 'products', label: 'products.js', note: 'export default [...]', tone: 'paper', x: 100, y: 180 },
        { id: 'format', label: 'format.js', note: 'export formatPrice', tone: 'paper', x: 280, y: 180 },
        { id: 'cart', label: 'cart.js', note: 'const items = []', tone: 'kraft', x: 480, y: 270 },
        { id: 'badge', label: 'badge.js', note: 'export renderBadge', tone: 'paper', x: 660, y: 180 },
      ],
      edges: [
        { from: 'main', to: 'products', label: 'import' },
        { from: 'main', to: 'format', label: 'import' },
        { from: 'main', to: 'cart', label: 'import' },
        { from: 'main', to: 'badge', label: 'import' },
        { from: 'badge', to: 'cart', label: 'import' },
      ],
      steps: [
        { focus: ['main'], text: 'Everything starts at the **entry** module. In a Vue project that\'s `src/main.js`, loaded by `<script type="module">` in `index.html`.' },
        { focus: ['products', 'format', 'cart', 'badge'], edges: ['main->products', 'main->format', 'main->cart', 'main->badge', 'badge->cart'], text: 'Before running any code, the `import` statements are read to discover the whole **graph** of files. Because imports are static, tools can do this without executing anything.' },
        { focus: ['products', 'format', 'cart'], text: 'Modules are evaluated **dependencies first**, in import order: `products.js`, `format.js`, then `cart.js` — which logs "cart.js evaluated" and creates its `items` array.' },
        { focus: ['badge', 'cart'], edges: ['badge->cart'], text: '`badge.js` also imports `cart.js`, but it has already run, so the existing instance is reused. No second log, no second `items` array.' },
        { focus: ['main', 'cart', 'badge'], edges: ['main->cart', 'badge->cart'], text: 'Finally `main.js` runs. When it calls `addToCart`, the badge sees the change through `cartCount()` — both talk to the **same** module-level `items`. That\'s module-level shared state.' },
      ],
    },
  },

  syntax: [
    `
#### Exporting
`,
    {
      code: `// named exports — as many as you like
export const TAX_RATE = 0.2
export function formatPrice(cents) { /* … */ }

const secret = 42                  // not exported: private to this file
function helper() { /* … */ }
export { helper as formatHelper }  // export an existing name (optionally renamed)

// one default export per module
export default function useCart() { /* … */ }`,
      lang: 'js',
      title: 'format.js',
    },
    `
#### Importing
`,
    {
      code: `import useCart from './useCart.js'                 // default: any name, no braces
import { formatPrice, TAX_RATE } from './format.js' // named: exact names, braces
import { formatPrice as money } from './format.js'  // rename on import
import * as format from './format.js'              // namespace: format.formatPrice(…)
import useCart2, { TAX_RATE as rate } from './x.js' // default + named together
import './styles.css'                              // side effects only (bundlers support CSS)

import { ref, computed } from 'vue'                 // bare specifier → a package`,
      lang: 'js',
      title: 'import forms',
    },
    `
- **Relative paths need \`./\` or \`../\`.** \`'format.js'\` without \`./\` is a *bare specifier*, which means "a package named format.js".
- **Bare specifiers** like \`'vue'\` are resolved by your build tool from \`node_modules\`. (Browsers alone need an *import map* to understand them.)
- In Vite, write the extension for \`.vue\` files: \`import TodoItem from './TodoItem.vue'\`. Vite doesn't try \`.vue\` by default.
- Imports are **read-only bindings**: \`formatPrice = …\` in the importing file is an error.

#### Re-exporting (barrel files)
`,
    {
      code: `// components/index.js
export { default as BaseButton } from './BaseButton.vue'
export { default as BaseInput } from './BaseInput.vue'
export * from './icons.js'

// elsewhere
import { BaseButton, BaseInput } from './components/index.js'`,
      lang: 'js',
      title: 're-exports',
    },
    `
#### Dynamic \`import()\`: load later
`,
    {
      code: `// returns a Promise for the module's exports
button.addEventListener('click', async () => {
  const { openEditor } = await import('./heavy-editor.js')
  openEditor()
})

// Vue Router: each page becomes its own file, loaded on first visit
const routes = [{ path: '/reports', component: () => import('./views/Reports.vue') }]`,
      lang: 'js',
      title: 'code splitting',
      static: true,
    },
    `
#### In a Vue project
`,
    {
      code: `<script setup>
import { ref } from 'vue'                       // named import from a package
import TodoItem from './TodoItem.vue'           // default import: the component
import { useTodos } from '@/composables/useTodos.js' // '@' is an alias set up in Vite config
const { todos, add } = useTodos()
</script>`,
      lang: 'vue',
      title: 'App.vue',
    },
    {
      callout: 'note',
      title: 'About this sandbox',
      text: 'The playgrounds here run modules through a small built-in loader. It supports `import`/`export` between project files, `vue`, `pinia` and `vue-router`, and `import(\'./File.vue\')` with a plain string path — but not top-level `await` or "live" updates of exported `let` variables, so the examples avoid those two. Real browsers and Vite support both.',
    },
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: modMain,
    intro: 'Five small files, one page. Watch which file owns what, and how `cart.js`\'s private array ends up shared.',
    steps: [
      { lines: [1], text: 'A **default import**: `products.js` says `export default [...]`, so we pick any name — `products` — and use no braces.' },
      { lines: [2, 4], text: '**Named imports**: braces and exact names. `addToCart` and `cartTotal` come from `cart.js`; `renderBadge` from `badge.js` (which itself imports `cart.js`).' },
      { lines: [17, 20], text: '`refresh()` asks other modules for data. `main.js` has no idea how the cart stores items — it can only use the functions `cart.js` chose to export.' },
      { lines: [22, 37], text: 'For each product, a row with an Add button. Clicking calls `addToCart(product)` — which pushes into the `items` array that lives inside `cart.js`.' },
      { lines: [39], text: 'Initial render. Open the console: **cart.js evaluated** appears once, even though two files import it. Open `badge.js`: it reads the same cart through `cartCount()`.' },
    ],
  },

  playground: {
    title: 'A cart split into modules',
    objective: 'Add exports, imports and a default export to a five-file project, and watch module-level state being shared.',
    files: { 'main.js': modMain, 'cart.js': modCart, 'badge.js': modBadge, 'format.js': modFormat, 'products.js': modProducts },
    expected: 'A badge **🛒 0**, three products with **Add** buttons and **Total: $0.00**. Each click updates the badge and the total. The console logs **cart.js evaluated** exactly once.',
    experiments: [
      {
        id: 'clear-cart',
        task: 'Export a new function `clearCart()` from `cart.js` that empties the cart. In `main.js`, import it and add a `<button class="clear">` that calls it and refreshes the page.',
        hint: 'Empty the array in place with `items.length = 0` (it\'s a `const`, so you can\'t reassign it). Add the button to the HTML string, then `app.querySelector(\'.clear\').addEventListener(\'click\', () => { clearCart(); refresh() })`.',
        tests: [
          { name: 'Clear empties the cart', code: `await click('.add')\nawait click('.add')\nawait click('.clear')\nexpect(text('.badge')).toContain('0')\nexpect(text('.total')).toBe('Total: $0.00')` },
        ],
        explain: 'Other modules can only change the cart through functions `cart.js` exports — the array itself stays private. That\'s the same idea as a Pinia store\'s actions.',
      },
      {
        id: 'format-count',
        task: 'Add a named export `formatCount(n)` to `format.js` that returns **1 item** for 1 and **N items** otherwise. Import it in `badge.js` so the badge reads **🛒 2 items**.',
        hint: '`export function formatCount(n) { return n + (n === 1 ? \' item\' : \' items\') }`, then in `badge.js`: `import { formatCount } from \'./format.js\'`.',
        tests: [
          { name: 'formatCount is exported and correct', code: `const { formatCount } = requireModule('format.js')\nexpect(formatCount(1)).toBe('1 item')\nexpect(formatCount(3)).toBe('3 items')` },
          { name: 'the badge uses it', code: `await click('.add')\nawait click('.add')\nexpect(text('.badge')).toBe('🛒 2 items')` },
        ],
        explain: 'A module can import from any other module — `badge.js` now depends on both `cart.js` and `format.js`. The import lines at the top document those dependencies.',
      },
      {
        id: 'default-badge',
        task: 'Make `renderBadge` the **default export** of `badge.js`, and change `main.js` to import it without braces (you may give it any name).',
        hint: 'In `badge.js`: `export default function renderBadge(el) { … }`. In `main.js`: `import renderBadge from \'./badge.js\'`.',
        tests: [
          { name: 'badge.js has a default export function', code: `expect(typeof requireModule('badge.js').default).toBe('function')` },
          { name: 'the page still works', code: `await click('.add')\nexpect(text('.badge')).toContain('1')` },
        ],
        explain: 'Default exports suit modules with one main thing (like a component). The importer picks the name, which is flexible — and why many teams prefer named exports for utilities: one name everywhere, easier search and refactoring.',
      },
      {
        id: 'evaluated-once',
        task: 'Open the console and count the **cart.js evaluated** messages. Then add `console.log(\'badge.js evaluated\')` to the top of `badge.js` and predict the order of the two messages before running.',
        hint: 'Dependencies are evaluated before the modules that import them, in import order.',
        explain: '`cart.js evaluated` comes first (main.js imports it before badge.js), then `badge.js evaluated`, and cart.js never runs again. One evaluation per module per page load — so module-level variables are effectively app-wide singletons.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'From your modules to the browser',
    caption: 'How the same `import` statements are served during development and after `vite build` (simplified).',
    alt: 'A diagram showing source modules (main.js, App.vue, useCart.js, vue package) feeding into Vite. In development, Vite serves each module separately and transforms .vue files on request. In production, the build bundles modules into a main chunk, plus a separate lazy chunk for a dynamically imported page, and removes unused exports.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'src', label: 'Your modules', note: 'main.js, App.vue, useCart.js', tone: 'paper' },
        { id: 'vite', label: 'Vite', note: 'reads the import graph', tone: 'ink' },
        { id: 'dev', label: 'Dev server', note: 'one module per request', tone: 'acid' },
        { id: 'pkg', label: 'Packages', note: "import { ref } from 'vue'", tone: 'paper' },
        { id: 'bundle', label: 'Production bundle', note: 'index-[hash].js', tone: 'cobalt' },
        { id: 'lazy', label: 'Lazy chunk', note: 'Reports-[hash].js', tone: 'kraft' },
      ],
      edges: [
        { from: 'src', to: 'vite' },
        { from: 'pkg', to: 'vite' },
        { from: 'vite', to: 'dev', label: 'npm run dev' },
        { from: 'vite', to: 'bundle', label: 'vite build' },
        { from: 'vite', to: 'lazy', label: 'import()', dashed: true },
      ],
      steps: [
        { focus: ['src', 'pkg'], text: 'Your code is many small modules, plus packages from `node_modules` imported with bare specifiers like `\'vue\'`.' },
        { focus: ['vite'], edges: ['src->vite', 'pkg->vite'], text: 'Vite starts from `index.html` → `src/main.js` and follows every `import` to build the module graph. It knows how to turn `.vue` files into JavaScript and CSS.' },
        { focus: ['dev'], edges: ['vite->dev'], text: '**Development:** the browser loads native ES modules; Vite transforms each file when it is requested (and pre-bundles dependencies), so startup and hot updates stay fast.' },
        { focus: ['bundle'], edges: ['vite->bundle'], text: '**Production:** modules are bundled into a few optimised files with content hashes in their names. Exports nobody imports can be dropped (tree shaking), because static imports show exactly what is used.' },
        { focus: ['lazy'], edges: ['vite->lazy'], text: 'Each dynamic `import()` — for example a lazily loaded route — becomes a separate chunk, downloaded only when that code is first needed. See [Code splitting](lesson:bundle-optimization).' },
      ],
    },
  },

  internals: {
    beginner: `
When a page loads a module, the browser (or Vite) reads its \`import\` lines first, fetches those files, reads *their* imports, and so on. Only when the whole tree is known does it run the code — dependencies first. Each file runs exactly once; everyone who imports it gets the same exports.
`,
    technical: [
      `
Loading an ES module graph has three phases:

1. **Construction** — parse each file, find its \`import\`/\`export\` statements, fetch dependencies. Every module is recorded in a *module map* keyed by its resolved URL, which is why it is never loaded twice.
2. **Linking** — connect each import to the matching export. An import is a **live, read-only binding** to the exporter's variable, not a copy: if a module exports \`let count\` and later changes it, importers see the new value. Importing a name that isn't exported fails here, before any code runs.
3. **Evaluation** — run each module's top-level code once, dependencies before dependents (depth-first, in import order).
`,
      {
        code: `// counter.js
export let count = 0
export function increment() { count++ }

// main.js
import { count, increment } from './counter.js'
increment()
console.log(count) // 1 — a live binding (in real ESM; not in this site's sandbox)
count = 5          // TypeError: Assignment to constant variable — imports are read-only`,
        lang: 'js',
        title: 'live, read-only bindings',
        static: true,
      },
      `
**Other properties of modules:**

- Module code is always in **strict mode**; top-level \`this\` is \`undefined\`.
- Top-level variables are **module-scoped**, never globals.
- \`<script type="module">\` is deferred by default and can use **top-level \`await\`** (ES2022). In a Vue \`<script setup>\`, top-level \`await\` turns the component\'s setup async, which needs \`<Suspense>\` — still experimental.
- **Circular imports** are allowed but risky: a module may run before a dependency it needs has finished evaluating, producing \`ReferenceError: Cannot access 'x' before initialization\`.

**CommonJS** (\`require()\` / \`module.exports\`) is Node's older module system. It loads synchronously at runtime and exports copies of values, which makes static analysis and tree shaking much harder. Modern frontend code — including Vue, Vite and Pinia — is written as ES modules.
`,
    ],
    production: `
- **Module-level state is a singleton.** A \`ref\` declared outside a composable's function is shared by every component — great for deliberate global state, wrong when each component should have its own. With server-side rendering it is worse: one module instance serves many users' requests, so state can leak between them (the Vue SSR guide calls this *cross-request state pollution*). Use Pinia or create state per app/request.
- **Prefer named exports for utilities and composables** — consistent names across the codebase, better auto-imports and refactoring. Default exports are the convention for \`.vue\` components.
- **Barrel files** (\`index.js\` re-exporting everything) are convenient but can make bundlers and dev servers process more modules than needed; use them deliberately.
- **Keep modules side-effect-free where possible.** A module that does work on import (adds listeners, starts timers) runs that work as soon as anything imports it, and makes tree shaking harder.
- Use **dynamic \`import()\`** for routes and heavy, rarely used features, so the first page loads less JavaScript — see [Lazy-loaded routes](lesson:lazy-routes-scroll).
`,
  },

  mistakes: [
    {
      title: 'Forgetting `./` on a relative import',
      wrong: { code: `import { formatPrice } from 'format.js'  // looked up as a package!`, lang: 'js' },
      right: { code: `import { formatPrice } from './format.js'`, lang: 'js' },
      explanation: 'Without `./` or `../`, the specifier is "bare" and treated as a package name. Relative files always start with `./` or `../`.',
    },
    {
      title: 'Mixing up default and named imports',
      wrong: { code: `// format.js: export function formatPrice() {…}\nimport formatPrice from './format.js'   // undefined: there is no default export`, lang: 'js' },
      right: { code: `import { formatPrice } from './format.js'`, lang: 'js' },
      explanation: 'Braces = named export with that exact name. No braces = the default export. Check how the other file exports. (Real ES modules and Vite report a missing export as an error.)',
    },
    {
      title: 'Leaving off `.vue` in Vite',
      wrong: { code: `import TodoItem from './TodoItem'   // Failed to resolve import`, lang: 'js' },
      right: { code: `import TodoItem from './TodoItem.vue'`, lang: 'js' },
      explanation: 'Vite only tries a short list of extensions (like `.js`, `.ts`, `.json`) by default, and its docs recommend always writing custom ones such as `.vue`.',
    },
    {
      title: 'Accidentally sharing state through module scope',
      wrong: { code: `// useCounter.js\nconst count = ref(0)            // ONE ref for the whole app\nexport function useCounter() {\n  return { count, inc: () => count.value++ }\n}`, lang: 'js' },
      right: { code: `// useCounter.js\nexport function useCounter() {\n  const count = ref(0)          // a new ref per call\n  return { count, inc: () => count.value++ }\n}`, lang: 'js' },
      explanation: 'The module runs once, so a ref at the top level is created once and shared. Create state inside the function when every caller should have its own.',
    },
  ],

  debugging: [
    {
      symptom: '`Failed to resolve import "./components/TodoItem" from "src/App.vue". Does the file exist?` (Vite).',
      cause: 'Wrong path, wrong letter case (Linux servers are case-sensitive), or a missing `.vue` extension.',
      fix: 'Check the exact file name and case, and include the extension: `./components/TodoItem.vue`.',
    },
    {
      symptom: '`SyntaxError: The requested module \'./format.js\' does not provide an export named \'formatprice\'`.',
      cause: 'The imported name doesn\'t match an export (typo, wrong case, or it is a default export).',
      fix: 'Open the exporting file; match the name exactly, or switch between `{ named }` and default import.',
    },
    {
      symptom: '`Cannot use import statement outside a module`.',
      cause: 'The file is loaded as a classic script (missing `type="module"`), or Node treats it as CommonJS.',
      fix: 'Use `<script type="module">`; in Node, set `"type": "module"` in `package.json` or use the `.mjs` extension.',
    },
    {
      symptom: 'Every component shows the same counter / filter / form state.',
      cause: 'The state is declared at module level, so all importers share one instance.',
      fix: 'Move the `ref`/`reactive` inside the exported function — or keep it shared on purpose and document it (or use Pinia).',
    },
    {
      symptom: '`ReferenceError: Cannot access \'x\' before initialization` on startup.',
      cause: 'A circular import: two modules import each other and one runs before the other has finished.',
      fix: 'Move the shared piece into a third module both can import, or delay the access into a function.',
    },
  ],

  bestPractices: [
    'One responsibility per module; export only what other files need.',
    'Use default exports for components, named exports for utilities, composables and constants.',
    'Always write relative paths with `./` and include extensions for `.vue` files.',
    'Keep module top-level code free of side effects; do work inside exported functions.',
    'Decide deliberately whether state lives in module scope (shared) or inside a function (per caller).',
    'Use dynamic `import()` for routes and heavy, rarely used features.',
  ],

  useCases: [
    'Every `.vue` file: a module whose default export is the component.',
    'Composables (`useCart.js`) and Pinia stores (`stores/cart.js`) exported as named functions.',
    'Utility modules: formatting, validation, API clients.',
    'Barrel files for a design-system folder of base components.',
    'Lazy routes and async components via dynamic `import()`.',
    'Module-level singletons for deliberate app-wide state (a toast queue, a feature-flag cache).',
  ],

  whenToUse: {
    use: [
      'Modules for all code — every file in a Vue/Vite project is one.',
      'Module-level state only when every importer should share it.',
      'Dynamic `import()` for code that most users never need on first load.',
    ],
    avoid: [
      'Global variables (`window.myThing`) to share data between files.',
      'Module-level reactive state in apps that render on the server, unless you understand cross-request pollution.',
      'Default-exporting many unrelated things as one object — export them by name.',
      'Circular imports between modules.',
    ],
  },

  comparison: {
    title: 'Named vs default exports (and CommonJS)',
    headers: ['', 'Named export', 'Default export', 'CommonJS (Node legacy)'],
    rows: [
      ['Export', '`export function f() {}`', '`export default function () {}`', '`module.exports = { f }`'],
      ['Import', '`import { f } from \'./m.js\'`', '`import anyName from \'./m.js\'`', '`const { f } = require(\'./m\')`'],
      ['How many per file', 'any number', 'one', 'one `module.exports` object'],
      ['Name at import site', 'fixed (rename with `as`)', 'chosen by importer', 'chosen by importer'],
      ['Static / tree-shakable', 'yes', 'yes', 'hard — resolved at runtime'],
      ['Typical Vue use', 'composables, stores, utils', '`.vue` components', 'old Node tooling/config only'],
    ],
    note: 'Next: [Async JavaScript](lesson:async-js) — and you\'ll meet modules again in [Single-File Components](lesson:single-file-components).',
  },

  quiz: [
    {
      id: 'es-modules-q1',
      type: 'mcq',
      prompt: '`TodoItem.vue` has a default export (the component). Which import is correct?',
      options: [
        { text: '`import { TodoItem } from \'./TodoItem.vue\'`', why: 'Braces ask for a *named* export called `TodoItem`; a component is the default export.' },
        { text: '`import TodoItem from \'./TodoItem.vue\'`' },
        { text: '`import TodoItem from \'TodoItem.vue\'`', why: 'Without `./`, it is a bare specifier — looked up as a package.' },
        { text: '`const TodoItem = require(\'./TodoItem.vue\')`', why: 'That\'s CommonJS. Vue + Vite projects use ES module `import`.' },
      ],
      answer: 1,
      explanation: 'Default exports are imported without braces, under any name. Relative paths start with `./`.',
    },
    {
      id: 'es-modules-q2',
      type: 'output',
      prompt: '`main.js` imports `a.js` and `b.js`. Both of them import `logger.js`, whose first line is `console.log(\'logger loaded\')`. How many times is **logger loaded** printed?',
      code: { lang: 'js', code: `// main.js\nimport './a.js'\nimport './b.js'\n\n// a.js and b.js both start with:\nimport { log } from './logger.js'` },
      options: [
        { text: '0', why: 'The module is imported, so its top-level code runs.' },
        { text: '1' },
        { text: '2', why: 'Modules are cached: the second import reuses the already-evaluated module.' },
        { text: '3', why: 'Only modules that import `logger.js` matter, and it runs once regardless.' },
      ],
      answer: 1,
      explanation: 'Each module is evaluated once per page load. Later imports get the same, already-initialised module.',
    },
    {
      id: 'es-modules-q3',
      type: 'bug',
      prompt: 'The build fails to find one of these imports. Click the buggy line.',
      code: { lang: 'js', code: `import { ref } from 'vue'\nimport { formatPrice } from 'format.js'\nimport TodoItem from './TodoItem.vue'\n\nconst total = ref(0)` },
      answerLine: 2,
      explanation: '`\'format.js\'` has no `./`, so it is treated as a package name. Use `\'./format.js\'`. (`\'vue\'` is a real package, so it\'s fine.)',
    },
    {
      id: 'es-modules-q4',
      type: 'fill',
      prompt: 'Fill the blanks: share `formatPrice` from one file and use it in another.',
      code: { lang: 'js', code: `// format.js\n___ function formatPrice(cents) {\n  return '$' + (cents / 100).toFixed(2)\n}\n\n// main.js\nimport { formatPrice } ___ './format.js'` },
      answer: [['export'], ['from']],
      explanation: '`export` makes the function available; `import { name } from \'./path\'` brings it in.',
    },
    {
      id: 'es-modules-q5',
      type: 'mcq',
      prompt: 'A module declares `let visits = 0` at its top level and does not export it. Which is true?',
      options: [
        { text: 'It becomes a global variable on `window`', why: 'Module top-level variables are scoped to the module, never globals.' },
        { text: 'Other modules can read it with `import { visits }`', why: 'Only exported names can be imported.' },
        { text: 'It is private to that module, and there is only one `visits` no matter how many files import the module' },
        { text: 'Each importing file gets its own copy', why: 'The module is evaluated once, so there is exactly one variable.' },
      ],
      answer: 2,
      explanation: 'Module scope is private, and modules are singletons — one evaluation, one set of top-level variables.',
    },
    {
      id: 'es-modules-q6',
      type: 'mcq',
      prompt: 'Why can bundlers remove unused exports from ES modules ("tree shaking") but struggle with CommonJS?',
      options: [
        { text: 'ES `import`/`export` statements are static, so the bundler knows what is used without running the code' },
        { text: 'ES modules are smaller files', why: 'File size has nothing to do with it.' },
        { text: 'CommonJS can\'t export functions', why: 'It can — but `require()` is a runtime function call that can be dynamic.' },
        { text: 'Browsers do the tree shaking for ES modules', why: 'Tree shaking happens at build time, in the bundler.' },
      ],
      answer: 0,
      explanation: 'Static structure makes the dependency graph analysable at build time. `require()` can be called conditionally with computed paths, so a bundler can\'t be sure what is used.',
    },
    {
      id: 'es-modules-q7',
      type: 'short',
      prompt: 'A composable file declares `const items = ref([])` above `export function useCart()`. Two components call `useCart()`. Do they share the cart? Why?',
      answer: 'Yes. The module is evaluated only once, so the top-level `items` ref is created once and every call to `useCart()` returns the same ref. To give each component its own cart, create the ref inside the function; keeping it at module level is a (deliberate) way to make global shared state — though a Pinia store is usually clearer, especially with SSR.',
    },
  ],

  exercises: [
    {
      id: 'split-modules',
      title: 'Split one file into modules',
      difficulty: 'beginner',
      prompt: `
Everything currently lives in \`main.js\`. Reorganise it:

- Move \`formatPrice\` into \`format.js\` as a **named export**.
- Move the \`products\` array into \`products.js\` as the **default export**.
- In \`main.js\`, delete the local copies and **import** both.

The page must still render each product in an \`<li class="product">\` with its formatted price.
`,
      files: {
        'main.js': `function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2)
}

const products = [
  { name: 'Notebook', price: 600 },
  { name: 'Desk Lamp', price: 3900 },
  { name: 'Coffee Mug', price: 1200 },
]

const app = document.getElementById('app')
const list = document.createElement('ul')
for (const p of products) {
  const li = document.createElement('li')
  li.className = 'product'
  li.textContent = p.name + ' — ' + formatPrice(p.price)
  list.append(li)
}
app.append(list)`,
        'format.js': `// TODO: export formatPrice from this file
`,
        'products.js': `// TODO: export the products array as the default export
`,
      },
      hints: [
        'Cut the function into `format.js` and put `export` in front of it.',
        'In `products.js`: `export default [ … ]`.',
        'At the top of `main.js`: `import { formatPrice } from \'./format.js\'` and `import products from \'./products.js\'`.',
      ],
      solution: {
        explanation: 'Each file now has one job and states its dependencies at the top. `formatPrice` is a named export because a utility module may grow more helpers; the product list is the module\'s one main value, so a default export fits.',
        files: {
          'main.js': `import { formatPrice } from './format.js'
import products from './products.js'

const app = document.getElementById('app')
const list = document.createElement('ul')
for (const p of products) {
  const li = document.createElement('li')
  li.className = 'product'
  li.textContent = p.name + ' — ' + formatPrice(p.price)
  list.append(li)
}
app.append(list)`,
          'format.js': `export function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2)
}
`,
          'products.js': `export default [
  { name: 'Notebook', price: 600 },
  { name: 'Desk Lamp', price: 3900 },
  { name: 'Coffee Mug', price: 1200 },
]
`,
        },
      },
      tests: [
        { name: 'format.js exports formatPrice', code: `const { formatPrice } = requireModule('format.js')\nexpect(typeof formatPrice).toBe('function')\nexpect(formatPrice(1234)).toBe('$12.34')` },
        { name: 'products.js default-exports three products', code: `const products = requireModule('products.js').default\nexpect(products).toHaveLength(3)\nexpect(products[1].name).toBe('Desk Lamp')` },
        { name: 'the page still renders formatted products', code: `expect(findAll('.product')).toHaveLength(3)\nexpect(text('.product')).toBe('Notebook — $6.00')` },
      ],
    },
    {
      id: 'singleton-vs-factory',
      title: 'Shared on purpose, private on purpose',
      difficulty: 'intermediate',
      prompt: `
\`counterStore.js\` exports \`createCounter()\` (should make an **independent** counter each call) and \`sharedCounter\` (**one** counter shared by everyone). The page has two "shared" widgets (A and B) and two "own" widgets (C and D).

Right now, clicking **C** also changes **D** and the shared widgets — every counter secretly uses the same module-level variable.

Fix \`counterStore.js\` so that:

- A and B (both using \`sharedCounter\`) always show the same number;
- C and D each have their own count, independent of each other and of the shared one.

Each counter has \`increment()\` and \`value()\`. The values are shown in \`.shared-a-value\`, \`.shared-b-value\`, \`.own-c-value\` and \`.own-d-value\`.
`,
      files: {
        'counterStore.js': `let count = 0

export function createCounter() {
  return {
    increment() {
      count++
    },
    value() {
      return count
    },
  }
}

export const sharedCounter = createCounter()`,
        'main.js': `import { sharedCounter, createCounter } from './counterStore.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <h4>Shared</h4>
  <button class="shared-a">A +1</button> <span class="shared-a-value"></span>
  <button class="shared-b">B +1</button> <span class="shared-b-value"></span>
  <h4>Own</h4>
  <button class="own-c">C +1</button> <span class="own-c-value"></span>
  <button class="own-d">D +1</button> <span class="own-d-value"></span>
\`

const own = { c: createCounter(), d: createCounter() }

function render() {
  app.querySelector('.shared-a-value').textContent = sharedCounter.value()
  app.querySelector('.shared-b-value').textContent = sharedCounter.value()
  app.querySelector('.own-c-value').textContent = own.c.value()
  app.querySelector('.own-d-value').textContent = own.d.value()
}

const on = (sel, fn) => app.querySelector(sel).addEventListener('click', () => { fn(); render() })
on('.shared-a', () => sharedCounter.increment())
on('.shared-b', () => sharedCounter.increment())
on('.own-c', () => own.c.increment())
on('.own-d', () => own.d.increment())
render()`,
      },
      hints: [
        'Where does `count` live? It\'s declared once, at module level, so every counter object reads and writes the same variable.',
        'Move `let count = 0` **inside** `createCounter`, so each call gets a fresh one (a closure).',
        '`sharedCounter` stays a single object created once at module level — that\'s what makes it shared.',
      ],
      solution: {
        explanation: 'Moving `count` into the function gives each `createCounter()` call its own closure. `sharedCounter` is still shared because the module runs once and creates exactly one instance that every importer receives. That\'s the same choice you make in a composable: state inside the function = per component; state at module level = global.',
        files: {
          'counterStore.js': `export function createCounter() {
  let count = 0
  return {
    increment() {
      count++
    },
    value() {
      return count
    },
  }
}

export const sharedCounter = createCounter()`,
          'main.js': `import { sharedCounter, createCounter } from './counterStore.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <h4>Shared</h4>
  <button class="shared-a">A +1</button> <span class="shared-a-value"></span>
  <button class="shared-b">B +1</button> <span class="shared-b-value"></span>
  <h4>Own</h4>
  <button class="own-c">C +1</button> <span class="own-c-value"></span>
  <button class="own-d">D +1</button> <span class="own-d-value"></span>
\`

const own = { c: createCounter(), d: createCounter() }

function render() {
  app.querySelector('.shared-a-value').textContent = sharedCounter.value()
  app.querySelector('.shared-b-value').textContent = sharedCounter.value()
  app.querySelector('.own-c-value').textContent = own.c.value()
  app.querySelector('.own-d-value').textContent = own.d.value()
}

const on = (sel, fn) => app.querySelector(sel).addEventListener('click', () => { fn(); render() })
on('.shared-a', () => sharedCounter.increment())
on('.shared-b', () => sharedCounter.increment())
on('.own-c', () => own.c.increment())
on('.own-d', () => own.d.increment())
render()`,
        },
      },
      tests: [
        { name: 'A and B share one count', code: `await click('.shared-a')\nawait click('.shared-b')\nexpect(text('.shared-a-value')).toBe('2')\nexpect(text('.shared-b-value')).toBe('2')` },
        { name: 'C does not affect D', code: `await click('.own-c')\nexpect(text('.own-c-value')).toBe('1')\nexpect(text('.own-d-value')).toBe('0')` },
        { name: 'own counters are independent of the shared one', code: `await click('.shared-a')\nexpect(text('.own-c-value')).toBe('0')\nawait click('.own-d')\nexpect(text('.shared-b-value')).toBe('1')` },
        { name: 'createCounter() returns independent counters', code: `const { createCounter } = requireModule('counterStore.js')\nconst x = createCounter()\nconst y = createCounter()\nx.increment()\nexpect(x.value()).toBe(1)\nexpect(y.value()).toBe(0)` },
      ],
    },
  ],

  interview: [
    {
      id: 'es-modules-named-vs-default',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'What is the difference between named and default exports, and which do you prefer?',
      answer: 'A module can have many named exports, imported with braces and the exact name (renamable with `as`), and at most one default export, imported without braces under any name. Default exports are the convention for Vue single-file components. For utilities, composables and stores many teams prefer named exports: one consistent name across the codebase, better editor auto-imports, easier refactoring and searching.',
      explanation: 'Named = labelled items on a shelf; default = the one main product.',
      whyAsked: 'Basic module fluency plus a taste of code-style reasoning.',
      mistakes: ['Saying a module can have several default exports.', 'Claiming default exports can\'t be tree-shaken.', 'Having no opinion or reason for a convention.'],
      followUps: ['How do you re-export a default export as a named one?', 'What does `import * as x` give you?'],
      modelAnswer: 'Named exports are imported with braces and the exact name, and a module can have any number. A default export is the module\'s single main value, imported without braces under whatever name the importer picks. In Vue projects components are default exports by convention. For composables and utilities I prefer named exports, because the name stays consistent everywhere, which helps search, auto-imports and refactors. To re-export a component by name I write `export { default as BaseButton } from \'./BaseButton.vue\'`.',
    },
    {
      id: 'es-modules-shared-state',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate wrote `const filters = ref({})` at the top of `useFilters.js`, above `export function useFilters()`. Now two unrelated tables share their filters. Explain, fix it, and say when the original might be what you want.',
      answer: 'ES modules are evaluated once, so the top-level ref is created once and every caller of `useFilters()` gets the same object — module-level state is a singleton. Fix: create the ref inside `useFilters()` so each call (each table) gets its own. Keeping it at module level is a valid pattern for deliberately global client-side state, but for anything significant a Pinia store is clearer and integrates with devtools; with SSR, module-level state is shared across requests and users (cross-request state pollution), so avoid it there.',
      explanation: 'Where you declare state decides who shares it: inside the function = per call; module level = everyone.',
      whyAsked: 'A very common composable bug that shows whether you understand module evaluation and state ownership.',
      mistakes: ['Blaming Vue reactivity.', 'Not knowing about SSR cross-request pollution.', 'Thinking module-level state is always wrong.'],
      followUps: ['How would you share state between exactly two sibling components?', 'How does Pinia avoid the SSR problem?'],
      modelAnswer: 'The module runs once, so `filters` is created once and returned to every caller — both tables hold the same ref. Moving the ref inside `useFilters` gives each table its own state. Sometimes the singleton is the goal, like one global notification queue in a client-only app, and that\'s a legitimate lightweight pattern. But for real shared state I\'d use Pinia for devtools support and structure, and with SSR I\'d never keep request-specific data at module level, because the server process serves many users and state would leak between requests.',
    },
    {
      id: 'es-modules-evaluation-order',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Each file logs its name as its first statement after its imports. In what order do the logs appear?',
      code: {
        lang: 'js',
        code: `// main.js
import './a.js'
import './b.js'
console.log('main')

// a.js
import './shared.js'
console.log('a')

// b.js
import './shared.js'
console.log('b')

// shared.js
console.log('shared')`,
      },
      options: ['main, a, shared, b, shared', 'shared, a, shared, b, main', 'shared, a, b, main', 'main, a, b, shared'],
      correctOption: 2,
      answer: '`shared, a, b, main`. Dependencies are evaluated before the modules that import them, depth-first in import order, and each module only once. So `shared` (needed by `a`) runs first, then `a`, then `b` (its `shared` is already done), then `main`.',
      explanation: 'Imports are hoisted: all of a module\'s dependencies run before its own body, regardless of where the import line appears.',
      whyAsked: 'Tests the mental model of module evaluation — useful for debugging initialisation order and side effects.',
      mistakes: ['Assuming the importing file runs first.', 'Running `shared` twice.', 'Thinking import order is random.'],
      followUps: ['What happens with a circular import between a and b?', 'Why should modules avoid side effects at the top level?'],
      modelAnswer: 'It logs shared, a, b, main. The module graph is evaluated depth-first: before `main` runs its body, its imports run in order. `a` first needs `shared`, so `shared` logs, then `a`. `b` also imports `shared`, but it\'s cached and doesn\'t run again, so `b` logs next, and finally `main`. That\'s also why side effects at module top level run as soon as anything imports the file.',
    },
    {
      id: 'es-modules-esm-vs-cjs',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare ES modules with CommonJS. Why does the frontend ecosystem use ES modules?',
      answer: 'ES modules use static `import`/`export` declarations, are analysed before execution, provide live read-only bindings, run in strict mode, can load asynchronously and are native to browsers. CommonJS uses `require()` and `module.exports`, which are ordinary runtime calls: synchronous, dynamic, exporting values rather than live bindings. Static structure lets bundlers build the dependency graph, tree-shake unused exports and split code; browsers can load ESM directly. Node supports both today.',
      explanation: 'Static vs dynamic is the key difference; most other benefits follow from it.',
      whyAsked: 'Checks understanding of tooling foundations — why Vite can be fast and why tree shaking works.',
      mistakes: ['Saying CommonJS is "for old browsers" (it never ran natively in browsers).', 'Not mentioning static analysis/tree shaking.', 'Claiming you can\'t mix them at all in Node.'],
      followUps: ['What is tree shaking?', 'What does a "dual package" ship?'],
      modelAnswer: 'ES modules are declarative: imports and exports are static, so the whole graph is known before any code runs, exports are live read-only bindings, and browsers load them natively. CommonJS is Node\'s original system: `require` is a synchronous function call that can be conditional or computed, and it exports a plain value. Because ESM is static, bundlers can drop unused exports and split code into chunks, and dev servers like Vite can serve modules directly to the browser. That\'s why Vue, Pinia and Vite are ESM-first.',
    },
    {
      id: 'es-modules-dynamic-import',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'How does dynamic `import()` help a Vue app\'s performance, and what are the trade-offs?',
      answer: '`import()` loads a module on demand and returns a promise. Bundlers turn each dynamic import into a separate chunk, so code for a route (`component: () => import(\'./views/Reports.vue\')`) or a heavy feature (charts, editors) is only downloaded when needed — the initial bundle shrinks and the first page becomes interactive sooner. Trade-offs: a delay the first time the code is needed (show a loading state, or prefetch likely routes), more network requests, the need to handle load failures (e.g. after a deploy removes old chunks), and over-splitting tiny pieces adds overhead.',
      explanation: 'Load less up front, pay a small cost later — at a moment you choose.',
      code: {
        lang: 'js',
        code: `import { defineAsyncComponent } from 'vue'

const routes = [
  { path: '/', component: Home },                              // in the main bundle
  { path: '/reports', component: () => import('./views/Reports.vue') }, // own chunk
]

const ChartPanel = defineAsyncComponent(() => import('./ChartPanel.vue'))`,
      },
      whyAsked: 'Code splitting is one of the highest-impact performance tools in SPAs; architects are expected to know when and how to apply it.',
      mistakes: ['Lazy-loading everything, including tiny or always-needed components.', 'Ignoring loading and error states.', 'Not knowing chunk-load failures can happen after deployments.'],
      followUps: ['How would you handle a chunk that fails to load after a new deploy?', 'What is prefetching?', 'How do you check what ends up in each chunk?'],
      modelAnswer: 'Dynamic import loads a module at runtime and returns a promise, and bundlers emit a separate chunk for it. In Vue that\'s the basis of lazy routes and `defineAsyncComponent`, so rarely visited pages or heavy widgets aren\'t in the initial download. The cost is latency on first use, so I add loading states or prefetch routes the user is likely to visit next, and I handle load errors — for example a chunk that no longer exists after a deploy. I split along routes and genuinely heavy features, and I verify the result with a bundle analyser rather than splitting everything.',
    },
    {
      id: 'es-modules-resolve-error',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'Vite shows `Failed to resolve import "./components/todoItem" from "src/App.vue". Does the file exist?` The file is `src/components/TodoItem.vue`. What are the two problems?',
      answer: 'The case is wrong (`todoItem` vs `TodoItem`) and the `.vue` extension is missing. Vite doesn\'t try `.vue` by default, and case mismatches may work on case-insensitive file systems (common on macOS and Windows) but fail on Linux CI servers. Use `import TodoItem from \'./components/TodoItem.vue\'`.',
      explanation: 'Match the file name exactly, including case and extension.',
      whyAsked: 'A practical, very common error; the case-sensitivity part shows real-world experience with "works on my machine" builds.',
      mistakes: ['Only fixing one of the two problems.', 'Not knowing why it might work locally but fail in CI.'],
      followUps: ['How can a lint rule or editor setting catch this earlier?', 'What is the `@` alias in a Vite Vue project?'],
      modelAnswer: 'Two things: the import uses lowercase `todoItem` while the file is `TodoItem`, and the `.vue` extension is missing — Vite\'s default extension list doesn\'t include `.vue`. The case issue is nasty because macOS and Windows file systems are usually case-insensitive, so it can work locally and fail on a Linux build server. The fix is to import `./components/TodoItem.vue` with exact casing.',
    },
    {
      id: 'es-modules-barrel',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Create a barrel file `utils/index.js` that re-exports `formatPrice` from `utils/price.js` and `formatPercent` from `utils/percent.js` as named exports, and also default-exports an object containing both functions.',
      starter: {
        files: {
          'utils/price.js': `export function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2)
}`,
          'utils/percent.js': `export function formatPercent(ratio) {
  return Math.round(ratio * 100) + '%'
}`,
          'utils/index.js': `// TODO: re-export both helpers, and default-export { formatPrice, formatPercent }
`,
          'main.js': `import format, { formatPrice, formatPercent } from './utils/index.js'

const app = document.getElementById('app')
app.innerHTML = '<p class="price"></p><p class="discount"></p>'
app.querySelector('.price').textContent = formatPrice(1999)
app.querySelector('.discount').textContent = format.formatPercent(0.25) + ' off'`,
        },
      },
      tests: [
        { name: 'named re-exports work', code: `const u = requireModule('utils/index.js')\nexpect(u.formatPrice(500)).toBe('$5.00')\nexpect(u.formatPercent(0.125)).toBe('13%')` },
        { name: 'the default export bundles both', code: `const u = requireModule('utils/index.js')\nexpect(u.default.formatPrice).toBe(u.formatPrice)\nexpect(u.default.formatPercent).toBe(u.formatPercent)` },
        { name: 'the page renders', code: `expect(text('.price')).toBe('$19.99')\nexpect(text('.discount')).toBe('25% off')` },
      ],
      hints: ['`export { formatPrice } from \'./price.js\'` re-exports without creating a local variable.', 'For the default export you need local names: `import { formatPrice } from \'./price.js\'` then `export default { formatPrice, formatPercent }`.'],
      answer: 'Import both helpers, re-export them by name, and default-export an object literal containing them.',
      solution: {
        files: {
          'utils/price.js': `export function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2)
}`,
          'utils/percent.js': `export function formatPercent(ratio) {
  return Math.round(ratio * 100) + '%'
}`,
          'utils/index.js': `import { formatPrice } from './price.js'
import { formatPercent } from './percent.js'

export { formatPrice, formatPercent }
export default { formatPrice, formatPercent }
`,
          'main.js': `import format, { formatPrice, formatPercent } from './utils/index.js'

const app = document.getElementById('app')
app.innerHTML = '<p class="price"></p><p class="discount"></p>'
app.querySelector('.price').textContent = formatPrice(1999)
app.querySelector('.discount').textContent = format.formatPercent(0.25) + ' off'`,
        },
      },
      explanation: 'Re-exporting lets callers import from one place; the default object is a convenience. Because the same function objects are exported both ways, `u.default.formatPrice === u.formatPrice`.',
      whyAsked: 'Checks precise knowledge of export syntax, which comes up when organising component libraries and utility folders.',
      mistakes: ['Writing `export default formatPrice, formatPercent` (only one value can be default).', 'Trying to use names re-exported with `export { x } from` locally (they aren\'t local bindings).', 'Wrapping the functions so identities differ.'],
      followUps: ['What are the downsides of barrel files in big projects?', 'How would you re-export a `.vue` component\'s default export by name?'],
      modelAnswer: 'I import both helpers into the index so they\'re local bindings, re-export them with `export { formatPrice, formatPercent }`, and add `export default { formatPrice, formatPercent }`. Callers can now import from one path either way. I\'d keep barrels small, because huge barrels can make dev servers and bundlers process far more modules than a page needs.',
    },
  ],

  takeaways: [
    'A module is a file with private scope; it shares values with `export` and receives them with `import`.',
    'Named exports: braces and exact names, many per file. Default export: no braces, any name, one per file (Vue components).',
    'Relative imports need `./`; bare specifiers like `\'vue\'` are packages. In Vite, write `.vue` extensions.',
    'Each module is evaluated once, dependencies first — module-level state is a shared singleton.',
    'Create state inside a function for per-caller state; at module level only when sharing is the goal (and beware SSR).',
    'Static imports enable tree shaking; dynamic `import()` enables code splitting for lazy routes and heavy features.',
  ],
}
