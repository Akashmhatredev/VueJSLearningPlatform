// Lesson: Why components? Registration & structure

const shopApp = `<script setup>
import SiteHeader from './SiteHeader.vue'
import ProductCard from './ProductCard.vue'

const products = [
  { id: 1, name: 'Ceramic Mug', price: 12 },
  { id: 2, name: 'Notebook', price: 8 },
  { id: 3, name: 'Desk Plant', price: 20 },
]
</script>

<template>
  <SiteHeader />
  <main class="shelf">
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :name="product.name"
      :price="product.price"
    />
  </main>
</template>

<style>
.shelf { display: flex; gap: 12px; flex-wrap: wrap; padding: 12px 0; }
</style>`

const productCard = `<script setup>
import { ref } from 'vue'

// Data that comes IN from the parent (the props lesson goes deep on this)
defineProps(['name', 'price'])

// State that belongs to THIS card only — every card gets its own
const quantity = ref(0)
</script>

<template>
  <article class="product-card">
    <h3 class="product-name">{{ name }}</h3>
    <p class="price">\${{ price }}</p>
    <div class="qty-row">
      <button class="dec" :disabled="quantity === 0" @click="quantity--">−</button>
      <span class="qty">{{ quantity }}</span>
      <button class="inc" @click="quantity++">+</button>
    </div>
  </article>
</template>

<style scoped>
.product-card { border: 2px solid #222; border-radius: 10px; padding: 10px 14px; min-width: 140px; }
.product-name { margin: 0 0 4px; font-size: 1rem; }
.price { margin: 0 0 8px; opacity: 0.7; }
.qty-row { display: flex; align-items: center; gap: 8px; }
.qty { min-width: 1.5em; text-align: center; font-weight: bold; }
</style>`

const siteHeader = `<template>
  <header class="site-header">
    <strong class="logo">Desk &amp; Co.</strong>
    <nav>Shop · About · Contact</nav>
  </header>
</template>

<style scoped>
.site-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222; padding-bottom: 8px; }
</style>`

const siteFooter = `<template>
  <footer class="site-footer">© Desk &amp; Co. — small things for big ideas</footer>
</template>

<style scoped>
.site-footer { border-top: 1px dashed #999; padding-top: 8px; font-size: 0.85rem; opacity: 0.8; }
</style>`

const sharedQtyCard = `<script>
import { ref } from 'vue'

// This block runs ONCE, when the file is first imported…
const quantity = ref(0)
</script>

<script setup>
defineProps(['name'])

function add() {
  quantity.value++
}
</script>

<template>
  <article class="product-card">
    <h3>{{ name }}</h3>
    <button class="inc" @click="add">+</button>
    <span class="qty">{{ quantity }}</span>
  </article>
</template>`

const sharedQtyApp = `<script setup>
import ProductCard from './ProductCard.vue'
</script>

<template>
  <ProductCard name="Ceramic Mug" />
  <ProductCard name="Notebook" />
  <ProductCard name="Desk Plant" />
</template>`

export default {
  id: 'why-components',
  title: 'Why components? Registration & structure',
  summary: 'Split an interface into small, reusable, self-contained pieces — and learn how Vue finds them by importing (local) or registering them app-wide (global).',
  difficulty: 'beginner',
  minutes: 25,
  prerequisites: ['first-component', 'single-file-components'],
  related: ['props', 'emits', 'slots', 'component-communication', 'project-structure', 'plugins-app-config'],
  tags: ['components', 'component tree', 'registration', 'local registration', 'global registration', 'app.component', 'parent', 'child', 'reuse', 'naming'],
  apis: [
    { name: 'app.component()', summary: 'Registers a component globally so every template in the app can use it by name.' },
    { name: 'components option', summary: 'Options API: registers components locally for one component (`components: { ProductCard }`).' },
    { name: 'defineOptions({ name })', summary: '3.3+: sets component options such as an explicit `name` from inside `<script setup>`.' },
  ],
  docs: [
    { label: 'Vue Guide — Components Basics', url: 'https://vuejs.org/guide/essentials/component-basics.html' },
    { label: 'Vue Guide — Component Registration', url: 'https://vuejs.org/guide/components/registration.html' },
    { label: 'Vue Style Guide — Multi-word component names', url: 'https://vuejs.org/style-guide/rules-essential.html#use-multi-word-component-names' },
  ],

  intro: `
A **component** is a self-contained, reusable piece of user interface. It bundles three things that belong together: its **structure** (template), its **behaviour** (script) and its **look** (styles). A product card, a search box, a modal, a whole page — each can be a component.

A Vue app is a **tree of components**. One root component (usually \`App.vue\`) uses other components, which use other components, and so on. A component that uses another is its **parent**; the one being used is its **child**.

You already built [your first component](lesson:first-component). This lesson is about the bigger picture: *why* we split interfaces this way, how Vue *finds* a component when you write \`<ProductCard />\`, and how to structure a component tree you won't regret.
`,

  why: `
Imagine building a shop page with no components. Three product cards means three copies of the same markup:

\`\`\`html
<article class="card"><h3>Ceramic Mug</h3><p>$12</p><button>Add</button></article>
<article class="card"><h3>Notebook</h3><p>$8</p><button>Add</button></article>
<article class="card"><h3>Desk Plant</h3><p>$20</p><button>Add</button></article>
\`\`\`

Now the designer wants a "Sale" badge on every card. You edit three places — or thirty, on a real shop. Miss one and the page is inconsistent. Each card also needs its own quantity counter, so you invent \`quantity1\`, \`quantity2\`, \`quantity3\`… and the one file grows until nobody dares touch it.

Components fix this by giving you:

- **Reuse** — write the card once, render it as many times as you like.
- **Encapsulation** — each card keeps its own state and styles; it can't accidentally break its neighbours.
- **One place to change** — the "Sale" badge is a one-line edit in \`ProductCard.vue\`.
- **Readable structure** — \`App.vue\` reads like a table of contents: header, shelf of cards, footer.
- **Teamwork and testing** — people can work on different files, and you can test a card on its own.
`,

  eli15: `
Think of LEGO. You don't carve a spaceship out of one giant block of plastic. You use small bricks — some plain, some special (wheels, windows, a cockpit) — and snap them together.

A component is one of those bricks, but for web pages. You design the "product card" brick **once**. Then you can snap in as many product cards as you need, and each one is its own separate piece: if you add 2 mugs to your cart on one card, the other cards don't change.

Bricks can also contain other bricks: a "page" brick holds a "header" brick, a "shelf" brick, and the shelf holds the "card" bricks. That nesting is the **component tree**.

The last piece of the puzzle: before you use a brick, you have to take it out of the box. In Vue that's \`import ProductCard from './ProductCard.vue'\` — after that you can write \`<ProductCard />\` in your template.
`,

  analogy: {
    title: 'A car factory and its parts catalogue',
    body: `
A car factory doesn't hand-make every wheel from scratch. Engineers draw **one blueprint** for a wheel, and the factory produces as many identical wheels as needed. Each wheel is its own physical object — one can get a flat tyre without affecting the others.

Parts connect through **standard sockets**: the wheel doesn't care which car it's on, as long as the bolt pattern fits. Some parts are ordered specifically for one model; a few (screws, bolts) sit in a shared bin every assembly line can grab from.
`,
    mapping: [
      ['the wheel blueprint', 'the component definition (`ProductCard.vue`)'],
      ['each physical wheel', 'a component instance (`<ProductCard />` on the page)'],
      ['one flat tyre, other wheels fine', 'each instance has its own independent state'],
      ['the bolt pattern / socket', 'the component\'s interface: props in, events out'],
      ['parts ordered for one car model', 'local registration: `import` in the file that uses it'],
      ['the shared bin of screws', 'global registration: `app.component()`'],
      ['the finished car', 'the root component (`App.vue`) and its tree'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'A page as a component tree',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'app', label: 'App.vue', note: 'root component', tone: 'ink', x: 380, y: 45 },
        { id: 'header', label: 'SiteHeader', note: 'logo + nav', x: 130, y: 160 },
        { id: 'list', label: 'ProductList', note: 'loops over products', tone: 'cobalt', x: 380, y: 160 },
        { id: 'footer', label: 'SiteFooter', note: 'links', x: 630, y: 160 },
        { id: 'card1', label: 'ProductCard #1', note: 'quantity: 0', tone: 'acid', x: 210, y: 280 },
        { id: 'card2', label: 'ProductCard #2', note: 'quantity: 2', tone: 'acid', x: 380, y: 280 },
        { id: 'card3', label: 'ProductCard #3', note: 'quantity: 0', tone: 'acid', x: 550, y: 280 },
      ],
      edges: [
        { from: 'app', to: 'header' },
        { from: 'app', to: 'list' },
        { from: 'app', to: 'footer' },
        { from: 'list', to: 'card1', label: 'props ↓' },
        { from: 'list', to: 'card2', label: 'props ↓' },
        { from: 'list', to: 'card3', label: 'props ↓' },
      ],
      steps: [
        { focus: ['app'], text: 'The whole page starts as **one root component**, `App.vue`. Everything else is nested inside it.' },
        { focus: ['header', 'list', 'footer'], edges: ['app->header', 'app->list', 'app->footer'], text: 'Split by **responsibility**: a header, a list of products, a footer. `App` is now their **parent**; they are its **children**.' },
        { focus: ['card1', 'card2', 'card3'], edges: ['list->card1', 'list->card2', 'list->card3'], text: '`ProductList` renders the **same** `ProductCard` definition three times. One blueprint, three **instances**.' },
        { focus: ['card2'], text: 'Card #2 has a quantity of 2, the others 0. Each instance runs its own `<script setup>` and keeps **its own state**. Changing card #2 re-renders only card #2.' },
        { focus: ['list', 'card1'], edges: ['list->card1'], text: 'Children get their data from the parent through **props** (down) and report back through **events** (up). That contract is the subject of the next lessons.' },
      ],
    },
    caption: 'Step through how a page is broken into a tree of parents and children — and why three cards can share one definition but not their state.',
    alt: 'A tree diagram. App.vue at the top has three children: SiteHeader, ProductList and SiteFooter. ProductList has three children, ProductCard #1, #2 and #3, connected by arrows labelled "props". Card #2 shows quantity 2 while the others show 0, illustrating independent state per instance.',
  },

  animation: {
    type: 'component-flow',
    props: { mode: 'props' },
    title: 'Preview: how parents and children talk',
    caption: 'Data flows **down** from parent to child as props; the child reports back **up** with events. Click a component to see its code. You will master both in the [props](lesson:props) and [emits](lesson:emits) lessons.',
    alt: 'An animated parent component box above a child component box. A labelled packet travels down from parent to child representing a prop; an event packet travels back up from child to parent.',
  },

  syntax: [
    `
**1. Define a component** — a \`.vue\` file is a component. Name files in **PascalCase** with **multi-word** names (\`ProductCard.vue\`, not \`Card.vue\`).
`,
    {
      code: `<!-- ProductCard.vue -->
<script setup>
import { ref } from 'vue'
defineProps(['name', 'price'])
const quantity = ref(0)
</script>

<template>
  <article class="product-card">
    <h3>{{ name }}</h3>
    <button @click="quantity++">Add ({{ quantity }})</button>
  </article>
</template>`,
      lang: 'vue',
      title: 'ProductCard.vue',
    },
    `
**2. Use it — local registration.** In \`<script setup>\`, importing a component *is* registering it. The imported variable can be used directly as a tag:
`,
    {
      code: `<!-- App.vue -->
<script setup>
import ProductCard from './ProductCard.vue'
</script>

<template>
  <ProductCard name="Ceramic Mug" :price="12" />
  <ProductCard name="Notebook" :price="8" />
</template>`,
      lang: 'vue',
      title: 'local registration with <script setup>',
    },
    `
With the **Options API** (or a plain \`setup()\` function), you list local components in the \`components\` option:
`,
    {
      code: `import ProductCard from './ProductCard.vue'

export default {
  components: { ProductCard },   // now <ProductCard /> works in this template only
}`,
      lang: 'js',
      title: 'local registration (Options API)',
    },
    `
**3. Global registration** makes a component available in *every* template of the app, without importing. Do it on the app instance before mounting:
`,
    {
      code: `// main.js
import { createApp } from 'vue'
import App from './App.vue'
import BaseButton from './components/BaseButton.vue'
import BaseIcon from './components/BaseIcon.vue'

createApp(App)
  .component('BaseButton', BaseButton)   // .component() is chainable
  .component('BaseIcon', BaseIcon)
  .mount('#app')`,
      lang: 'js',
      title: 'global registration',
    },
    `
**The rules:**

1. Prefer **local** registration. It makes dependencies explicit and lets the bundler drop components nobody imports (*tree-shaking*).
2. Use **PascalCase** in single-file templates (\`<ProductCard />\`). Vue also accepts \`<product-card />\` for a component registered as \`ProductCard\`.
3. **Self-closing** tags (\`<ProductCard />\`) are fine in \`.vue\` files. In templates written directly in an HTML page (*in-DOM templates*) you must use kebab-case and a closing tag: \`<product-card></product-card>\`, because the browser parses that HTML before Vue sees it.
4. Each use of a component creates a **new instance** with its own state.
5. Use **multi-word names** (except the root \`App\`) so components never clash with current or future HTML elements like \`<header>\` or \`<button>\`.
`,
    {
      callout: 'version',
      text: 'In `<script setup>` a component\'s name is inferred from its file name, so you rarely need a `name` option. If you do (for example for DevTools or `<KeepAlive include>`), `defineOptions({ name: \'ProductCard\' })` requires Vue 3.3+.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: shopApp,
    intro: 'The root component of a tiny shop. It owns the product data and composes two child components.',
    steps: [
      { lines: [2, 3], text: 'Two imports. In `<script setup>`, importing a `.vue` file is all the registration you need: `SiteHeader` and `ProductCard` are now usable as tags in this template — and only in this template.' },
      { lines: [5, 9], text: 'The parent owns the data. A plain array is enough here because the list itself never changes; each card will hold its own changing state.' },
      { lines: [13], text: '`<SiteHeader />` renders the header component. App does not need to know what is inside it — that detail is *encapsulated* in `SiteHeader.vue`.' },
      { lines: [15, 20], text: 'One definition, many instances: `v-for` creates a separate `ProductCard` for every product. `:key` helps Vue track which instance belongs to which product.' },
      { lines: [18, 19], text: '`:name` and `:price` pass data down to each child as **props**. Without them every card would look identical.' },
    ],
  },

  playground: {
    title: 'Desk & Co. shop',
    objective: 'See one component definition become many independent instances, then grow the tree by wiring in a new component.',
    files: {
      'App.vue': shopApp,
      'ProductCard.vue': productCard,
      'SiteHeader.vue': siteHeader,
      'SiteFooter.vue': siteFooter,
    },
    expected: 'A header and three product cards. Each card has its own **−/+** counter: clicking + on the mug does not change the notebook. `SiteFooter.vue` exists but is not on the page yet.',
    experiments: [
      {
        id: 'add-product',
        task: 'Add a fourth product — **Desk Lamp** for **30** — to the `products` array in `App.vue`. You should not touch `ProductCard.vue` at all.',
        hint: 'Add `{ id: 4, name: \'Desk Lamp\', price: 30 }` to the array. Keep the `id` unique — it is used as the `:key`.',
        tests: [
          {
            name: 'four product cards are rendered, including the lamp',
            code: `expect(findAll('.product-card')).toHaveLength(4)
expect(text()).toContain('Desk Lamp')`,
          },
        ],
        explain: 'Reuse in action: new data, zero new markup. The card definition is written once; `v-for` stamps out another instance.',
      },
      {
        id: 'use-footer',
        task: '`SiteFooter.vue` is already written but never shown. Make it appear **below** the shelf of cards.',
        hint: 'Two steps: `import SiteFooter from \'./SiteFooter.vue\'` in the script, then `<SiteFooter />` after `</main>` in the template.',
        tests: [
          { name: 'the footer is rendered', code: `expect(exists('.site-footer')).toBe(true)` },
          {
            name: 'the footer comes after the shelf',
            code: `const html = find('.shelf').parentNode.innerHTML
expect(html.indexOf('site-footer')).toBeGreaterThan(html.indexOf('shelf'))`,
          },
        ],
        explain: 'A component that is not imported does not exist as far as this template is concerned. Local registration keeps the dependency visible right at the top of the file that uses it.',
      },
      {
        id: 'reset-button',
        task: 'Give every card a **Reset** button (`class="reset"`) that sets *that card\'s* quantity back to 0.',
        hint: 'Edit `ProductCard.vue`: add `<button class="reset" @click="quantity = 0">Reset</button>` inside the card.',
        tests: [
          {
            name: 'reset only affects its own card',
            code: `const incs = findAll('.inc')
await click(incs[0]); await click(incs[0]); await click(incs[1])
await click(findAll('.reset')[0])
const qty = findAll('.qty').map((el) => el.textContent.trim())
expect(qty[0]).toBe('0')
expect(qty[1]).toBe('1')`,
          },
        ],
        explain: 'You edited **one** file and every card got the button — but each button only resets its own instance, because each instance has its own `quantity` ref.',
      },
      {
        id: 'observe-instances',
        task: 'Click + a different number of times on each card. Then reload the preview (Run). What happens to the numbers?',
        explain: 'Every instance keeps separate state while it is on the page. Re-running mounts fresh instances, so they all start at 0 again — state lives in instances, not in the definition.',
      },
    ],
  },

  internals: {
    beginner: `
A \`.vue\` file is turned into a plain JavaScript **object** — the component *definition*: "here is how to set up and draw a product card". Writing \`<ProductCard />\` asks Vue to create an **instance** from that definition: Vue runs its \`<script setup>\` code (creating fresh refs), draws its template, and remembers it. Three tags, three instances, three separate \`quantity\` refs.
`,
    technical: [
      `
The SFC compiler turns the template into a **render function**. With \`<script setup>\`, imported components are ordinary variables in the same module, so the render function references them directly — no lookup by name at runtime:
`,
      {
        code: `// Simplified idea of what App.vue's template compiles to (not the exact output)
import ProductCard from './ProductCard.vue'

function render() {
  return products.map((p) =>
    h(ProductCard, { key: p.id, name: p.name, price: p.price })
  )
}`,
        lang: 'js',
        title: 'local components are direct references',
      },
      `
A component registered **globally** (or via the Options API \`components\` option) is referenced by **name** instead. The compiled template calls \`resolveComponent('BaseButton')\`, which looks in the current component's \`components\`, then in the app-level registry filled by \`app.component()\`, trying the name as written plus its camelCase and PascalCase forms. If nothing matches you get the warning \`Failed to resolve component: BaseButton\` and Vue renders it as an unknown element.

Each instance gets its **own render effect** — the reactive effect that re-runs its render function. When card #2's \`quantity\` changes, only card #2's effect is triggered. When a parent re-renders, Vue compares each child's new props with the old ones and skips children whose props did not change. That is why the **component is Vue's unit of update**.
`,
    ],
    production: `
- **Default to local registration.** Global components cannot be tree-shaken: they ship in the bundle even if no page uses them, and readers can't tell where a tag comes from.
- Global registration is reasonable for a handful of truly ubiquitous base components (\`BaseButton\`, \`BaseIcon\`) or for a component library installed as a plugin. Some teams use third-party build plugins (for example *unplugin-vue-components*) that auto-import on demand — that is tooling, not Vue core.
- Follow the [Vue style guide](https://vuejs.org/style-guide/) naming conventions: multi-word names, \`Base\`/\`App\` prefixes for base components, and prefix tightly coupled children with the parent's name (\`TodoList\` → \`TodoListItem\`).
- Split a component when it has a **separate responsibility**, is **reused**, has **independent state**, or is getting hard to read. Don't split just to make files tiny — every instance has a small cost and every boundary needs props/events wiring. See [feature-based project structure](lesson:project-structure).
`,
  },

  mistakes: [
    {
      title: 'Using a component without importing it',
      wrong: { code: `<script setup>\n// forgot: import ProductCard from './ProductCard.vue'\n</script>\n\n<template>\n  <ProductCard name="Mug" />\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\nimport ProductCard from './ProductCard.vue'\n</script>\n\n<template>\n  <ProductCard name="Mug" />\n</template>`, lang: 'vue' },
      explanation: 'Vue warns `Failed to resolve component: ProductCard` and renders an unknown `<productcard>` element that shows nothing useful. In `<script setup>` the import *is* the registration.',
    },
    {
      title: 'Putting per-card state at module level',
      wrong: { code: `<script>\nimport { ref } from 'vue'\nconst quantity = ref(0) // runs once for the whole file\n</script>\n\n<script setup>\nconst add = () => quantity.value++\n</script>`, lang: 'vue' },
      right: { code: `<script setup>\nimport { ref } from 'vue'\nconst quantity = ref(0) // runs once per instance\nconst add = () => quantity.value++\n</script>`, lang: 'vue' },
      explanation: 'A normal `<script>` block (or a `.js` module) is evaluated **once**, when the file is first imported, so every card shares the same ref. `<script setup>` runs **per instance**. Module-level state is only right when sharing is the goal.',
    },
    {
      title: 'Registering everything globally "for convenience"',
      wrong: { code: `// main.js\napp.component('ProductCard', ProductCard)\napp.component('CheckoutForm', CheckoutForm)\napp.component('AdminChart', AdminChart)\n// …forty more`, lang: 'js' },
      right: { code: `<!-- import where it is used -->\n<script setup>\nimport CheckoutForm from './CheckoutForm.vue'\n</script>`, lang: 'vue' },
      explanation: 'Global components are always bundled, even on pages that never use them, and nobody can see where `<AdminChart>` comes from. Import components where they are used.',
    },
    {
      title: 'Single-word component names',
      wrong: { code: `<!-- Header.vue, Item.vue, Button.vue -->\n<Header />`, lang: 'vue' },
      right: { code: `<!-- SiteHeader.vue, TodoItem.vue, BaseButton.vue -->\n<SiteHeader />`, lang: 'vue' },
      explanation: 'HTML elements are single words (`header`, `button`). Multi-word names avoid confusion and conflicts, especially in in-DOM templates where HTML is case-insensitive.',
    },
  ],

  debugging: [
    {
      symptom: 'Console: `[Vue warn]: Failed to resolve component: ProductCard`.',
      cause: 'The component is not imported in this file, the import name differs from the tag, or a global registration is missing.',
      fix: 'Import it in the `<script setup>` of the file that uses it, and check the spelling and case of the tag.',
    },
    {
      symptom: 'Clicking one card changes the numbers on every card.',
      cause: 'The state lives at module level (a normal `<script>` block or an imported `.js` file), so all instances share one ref.',
      fix: 'Move the `ref()` into `<script setup>` so each instance creates its own.',
    },
    {
      symptom: 'A component works in `.vue` files but renders nothing inside a template written in `index.html`.',
      cause: 'In-DOM templates are parsed by the browser first: PascalCase tags are lower-cased and self-closing custom tags are not allowed.',
      fix: 'Use kebab-case with explicit closing tags there: `<product-card></product-card>`.',
    },
    {
      symptom: 'A component you deleted from every page still shows up in the bundle size.',
      cause: 'It is registered globally with `app.component()`, so the bundler must keep it.',
      fix: 'Remove the global registration and import it locally where needed.',
    },
  ],

  bestPractices: [
    'One component per file, named in PascalCase with at least two words (`ProductCard.vue`).',
    'Import components where they are used (local registration); keep global registration for a few base components or plugins.',
    'Give each component one clear responsibility — if you need "and" to describe it, consider splitting it.',
    'Keep per-instance state inside `<script setup>`; put shared state in a deliberate place (a parent, a store, a composable).',
    'Let parents own data and pass it down; children should not reach into their parents.',
    'Name tightly coupled children after their parent (`TodoList` → `TodoListItem`) so related files sort together.',
  ],

  useCases: [
    'Repeated UI: product cards, list rows, comment items, avatars.',
    'Layout regions: `SiteHeader`, `SidebarNav`, `SiteFooter`.',
    'Self-contained widgets with their own state: date pickers, accordions, star ratings.',
    'Design-system building blocks: `BaseButton`, `BaseInput`, `BaseModal`.',
    'Whole pages/views that a router swaps in and out.',
  ],

  whenToUse: {
    use: [
      'The same piece of UI appears more than once (or will).',
      'A section has its own state or behaviour that the rest of the page doesn\'t care about.',
      'A file is getting long and mixes unrelated responsibilities.',
      'You want to test or reason about one part in isolation.',
    ],
    avoid: [
      'A tiny bit of markup used once with no logic — a component adds a file and wiring for no gain.',
      'Splitting tightly related markup into many micro-components that must pass ten props back and forth.',
      'Registering components globally just to avoid writing an import.',
    ],
  },

  comparison: {
    title: 'Ways to make a component available',
    headers: ['', 'Local (`import` in `<script setup>`)', 'Local (Options API `components`)', 'Global (`app.component()`)'],
    rows: [
      ['Where usable', 'only in that file\'s template', 'only in that component\'s template', 'every template in the app'],
      ['How the template finds it', 'direct variable reference', 'by name, at render time', 'by name, at render time'],
      ['Tree-shakable?', 'yes', 'yes', '**no** — always bundled'],
      ['Dependencies visible?', 'yes, at the top of the file', 'yes, in the options', 'no — tag could come from anywhere'],
      ['Good for', 'almost everything', 'Options API codebases', 'a few base components, plugins'],
    ],
    note: 'Rule of thumb: import it where you use it. Reach for `app.component()` deliberately, not by default.',
  },

  quiz: [
    {
      id: 'why-components-q1',
      type: 'output',
      prompt: '`Counter.vue` holds `const n = ref(0)` in `<script setup>` and renders `<button @click="n++">{{ n }}</button>`. You click the **first** button twice and the **third** button once. What do the three buttons show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import Counter from './Counter.vue'
</script>

<template>
  <Counter />
  <Counter />
  <Counter />
</template>`,
      },
      options: [
        { text: '2 0 1' },
        { text: '3 3 3', why: 'That would happen only if all instances shared one ref. `<script setup>` runs per instance.' },
        { text: '2 2 2', why: 'Clicks on the first button only change the first instance.' },
        { text: '0 0 0', why: 'Each instance has its own reactive `n`, so its button does update.' },
      ],
      answer: 0,
      explanation: 'Each `<Counter />` is a separate instance that runs its own `<script setup>` and creates its own `n`. One definition, independent state.',
    },
    {
      id: 'why-components-q2',
      type: 'mcq',
      prompt: 'Why does the Vue documentation recommend **local** registration over global registration for most components?',
      options: [
        { text: 'Local components render faster on every update.', why: 'Rendering speed is the same; the difference is in bundling and maintainability.' },
        { text: 'Globally registered components can\'t be tree-shaken, and they hide where a component comes from.' },
        { text: 'Global registration is deprecated in Vue 3.', why: '`app.component()` is a supported Vue 3 API; it is just not the best default.' },
        { text: 'Local components can use props; global ones cannot.', why: 'Both kinds of components accept props in exactly the same way.' },
      ],
      answer: 1,
      explanation: 'Unused global components still end up in the bundle, and large apps become hard to navigate when any tag might be global. Local imports make dependencies explicit.',
    },
    {
      id: 'why-components-q3',
      type: 'bug',
      prompt: 'Every `ProductCard` on the page shows the **same** quantity, no matter which + you click. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script>
import { ref } from 'vue'

const quantity = ref(0)
</script>

<script setup>
defineProps(['name'])
const add = () => quantity.value++
</script>

<template>
  <h3>{{ name }}</h3>
  <button @click="add">{{ quantity }}</button>
</template>`,
      },
      answerLine: 4,
      explanation: 'A normal `<script>` block runs once per module, so `quantity` is created once and shared by every instance. Move it into `<script setup>`, which runs once per instance.',
    },
    {
      id: 'why-components-q4',
      type: 'fill',
      prompt: 'Fill the blanks: register `BaseButton` globally in `main.js`, and register `ProductCard` locally in a `<script setup>` component.',
      code: {
        lang: 'js',
        code: `// main.js
createApp(App).___('BaseButton', BaseButton).mount('#app')

// App.vue, inside <script setup>
___ ProductCard from './ProductCard.vue'`,
      },
      answer: [['component'], ['import']],
      explanation: '`app.component(name, definition)` registers globally. In `<script setup>`, a plain `import` is local registration.',
    },
    {
      id: 'why-components-q5',
      type: 'mcq',
      prompt: 'A teammate writes `<ProductCard />` directly inside `index.html` (an in-DOM template). Nothing renders. What is the fix?',
      options: [
        { text: 'Register the component globally instead of locally.', why: 'Registration may also be needed, but the tag itself is still broken by the browser\'s HTML parser.' },
        { text: 'Write `<product-card></product-card>` — kebab-case with a closing tag.' },
        { text: 'Add `name: \'ProductCard\'` with `defineOptions`.', why: 'The name option does not change how the browser parses the HTML.' },
        { text: 'Wrap it in a `<template>` tag.', why: 'The problem is case-folding and self-closing custom tags in the browser\'s parser.' },
      ],
      answer: 1,
      explanation: 'The browser parses in-DOM templates before Vue: tag names are lower-cased and custom elements cannot self-close. In `.vue` files Vue\'s own compiler parses the template, so PascalCase and `/>` work there.',
    },
    {
      id: 'why-components-q6',
      type: 'short',
      prompt: 'In two or three sentences: what is the difference between a component *definition* and a component *instance*?',
      answer: 'The definition is the blueprint — the `.vue` file compiled into an object describing setup, template and styles. An instance is created each time the component is used in a template; it runs setup, owns its own state and renders its own DOM. One definition can produce many independent instances.',
    },
  ],

  exercises: [
    {
      id: 'team-cards',
      title: 'Extract a reusable team member card',
      difficulty: 'beginner',
      prompt: `
\`App.vue\` repeats the same markup for every team member. Turn it into a reusable component.

- Finish \`TeamMemberCard.vue\`: it receives \`name\` and \`role\` props and renders an \`<article class="member-card">\` containing \`<h3 class="member-name">\` (the name) and \`<p class="member-role">\` (the role).
- Each card also has a \`<button class="follow">\` that shows **Follow** and toggles to **Following** when clicked — independently for each card.
- In \`App.vue\`, remove the repeated markup and render one \`TeamMemberCard\` per entry of the existing \`team\` array.
`,
      files: {
        'App.vue': `<script setup>
// TODO: import TeamMemberCard

const team = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral' },
  { id: 3, name: 'Alan Turing', role: 'Researcher' },
]
</script>

<template>
  <h2>Our team</h2>
  <!-- TODO: replace this copy-pasted markup with TeamMemberCard -->
  <article class="member-card">
    <h3 class="member-name">Ada Lovelace</h3>
    <p class="member-role">Engineer</p>
  </article>
  <article class="member-card">
    <h3 class="member-name">Grace Hopper</h3>
    <p class="member-role">Admiral</p>
  </article>
  <article class="member-card">
    <h3 class="member-name">Alan Turing</h3>
    <p class="member-role">Researcher</p>
  </article>
</template>`,
        'TeamMemberCard.vue': `<script setup>
// TODO: declare the name and role props
// TODO: add the follow state
</script>

<template>
  <article class="member-card">
    <h3 class="member-name">Name</h3>
    <p class="member-role">Role</p>
  </article>
</template>`,
      },
      hints: [
        'In `TeamMemberCard.vue` declare the props with `defineProps([\'name\', \'role\'])` and show them with `{{ name }}` and `{{ role }}`.',
        'Add `const following = ref(false)` (import `ref` from `vue`) and a button whose label is `{{ following ? \'Following\' : \'Follow\' }}`.',
        'In `App.vue`: `import TeamMemberCard from \'./TeamMemberCard.vue\'`, then `<TeamMemberCard v-for="m in team" :key="m.id" :name="m.name" :role="m.role" />`.',
      ],
      solution: {
        explanation: 'The markup lives in one place, the data lives in the parent, and each card owns its own `following` ref — so toggling one card never affects another. Adding a fourth teammate is now a one-line data change.',
        files: {
          'App.vue': `<script setup>
import TeamMemberCard from './TeamMemberCard.vue'

const team = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
  { id: 2, name: 'Grace Hopper', role: 'Admiral' },
  { id: 3, name: 'Alan Turing', role: 'Researcher' },
]
</script>

<template>
  <h2>Our team</h2>
  <TeamMemberCard
    v-for="member in team"
    :key="member.id"
    :name="member.name"
    :role="member.role"
  />
</template>`,
          'TeamMemberCard.vue': `<script setup>
import { ref } from 'vue'

defineProps(['name', 'role'])

const following = ref(false)
</script>

<template>
  <article class="member-card">
    <h3 class="member-name">{{ name }}</h3>
    <p class="member-role">{{ role }}</p>
    <button class="follow" @click="following = !following">
      {{ following ? 'Following' : 'Follow' }}
    </button>
  </article>
</template>`,
        },
      },
      tests: [
        {
          name: 'TeamMemberCard renders its name and role props',
          code: `const card = mountFile('TeamMemberCard.vue', { name: 'Katherine Johnson', role: 'Mathematician' })
expect(card.text()).toContain('Katherine Johnson')
expect(card.text()).toContain('Mathematician')`,
        },
        {
          name: 'App renders one card per team member',
          code: `const names = findAll('.member-name').map((el) => el.textContent.trim())
expect(names).toEqual(['Ada Lovelace', 'Grace Hopper', 'Alan Turing'])`,
        },
        {
          name: 'Follow toggles independently per card',
          code: `const buttons = findAll('.follow')
expect(buttons).toHaveLength(3)
await click(buttons[0])
expect(findAll('.follow')[0].textContent).toContain('Following')
expect(findAll('.follow')[1].textContent.trim()).toBe('Follow')
await click(findAll('.follow')[0])
expect(findAll('.follow')[0].textContent.trim()).toBe('Follow')`,
        },
      ],
    },
    {
      id: 'fix-shared-quantity',
      title: 'Fix the cards that share one counter',
      difficulty: 'beginner',
      prompt: `
The shop shows three \`ProductCard\`s, but clicking **+** on any card changes the number on **all** of them.

Fix \`ProductCard.vue\` so each card keeps its **own** quantity:

- each card has a \`<button class="inc">\` and a \`<span class="qty">\`;
- every card starts at **0**;
- clicking + on one card only changes that card's \`.qty\`.
`,
      files: { 'App.vue': sharedQtyApp, 'ProductCard.vue': sharedQtyCard },
      hints: [
        'Ask yourself: how many times does a normal `<script>` block run, compared to `<script setup>`?',
        'A normal `<script>` runs once for the whole file; `<script setup>` runs once per instance.',
        'Move `import { ref } from \'vue\'` and `const quantity = ref(0)` into `<script setup>` and delete the plain `<script>` block.',
      ],
      solution: {
        explanation: '`<script setup>` is compiled into the component\'s `setup()` function, which Vue calls for every instance. Creating the ref there gives each card its own state. The old code created the ref at module level, which runs only once when the file is first imported.',
        files: {
          'App.vue': sharedQtyApp,
          'ProductCard.vue': `<script setup>
import { ref } from 'vue'

defineProps(['name'])

const quantity = ref(0)

function add() {
  quantity.value++
}
</script>

<template>
  <article class="product-card">
    <h3>{{ name }}</h3>
    <button class="inc" @click="add">+</button>
    <span class="qty">{{ quantity }}</span>
  </article>
</template>`,
        },
      },
      tests: [
        { name: 'every card starts at 0', code: `expect(findAll('.qty').map((el) => el.textContent.trim())).toEqual(['0', '0', '0'])` },
        {
          name: 'clicking + on the first card only changes the first card',
          code: `await click(findAll('.inc')[0])
await click(findAll('.inc')[0])
expect(findAll('.qty').map((el) => el.textContent.trim())).toEqual(['2', '0', '0'])`,
        },
        {
          name: 'cards count independently',
          code: `await click(findAll('.inc')[2])
await click(findAll('.inc')[1])
await click(findAll('.inc')[2])
expect(findAll('.qty').map((el) => el.textContent.trim())).toEqual(['0', '1', '2'])`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'why-components-what-and-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a component in Vue, and why do we build interfaces out of components?',
      answer: 'A component is a self-contained, reusable unit of UI that bundles its template, logic and styles, and exposes a small interface (props in, events out). We use them for reuse, encapsulation of state and styles, readable structure, isolated testing, and to let teams work on separate pieces.',
      explanation: 'A component is a blueprint you can use many times. Each use is an independent instance with its own state.',
      whyAsked: 'An opener that shows whether you think in components and can articulate their benefits beyond "reusability".',
      mistakes: [
        'Only saying "for reusability" — encapsulation and maintainability matter just as much.',
        'Confusing the component definition with an instance.',
        'Forgetting the interface: props down, events up.',
      ],
      followUps: ['What is the difference between a definition and an instance?', 'How do components communicate?', 'When would you not create a component?'],
      modelAnswer: 'A component is a self-contained piece of UI — template, logic and styles in one unit, usually a single-file component. Each time I use it, Vue creates an instance with its own state. Components give me reuse, encapsulation so one piece can\'t break another, a readable tree structure, and units I can test in isolation. They communicate through a narrow interface: props flow down, events flow up. The trade-off is wiring cost, so I split by responsibility and reuse, not just to make files small.',
    },
    {
      id: 'why-components-local-vs-global',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare local and global component registration. Which do you use by default, and why?',
      answer: 'Global registration (`app.component(\'Name\', Comp)`) makes a component available in every template without imports. Local registration (an import in `<script setup>`, or the `components` option) makes it available only where imported. Default to local: it is tree-shakable and makes dependencies explicit. Use global sparingly for a few ubiquitous base components or plugin-provided components.',
      explanation: 'Global = convenient but always bundled and invisible. Local = explicit and bundler-friendly.',
      code: {
        lang: 'js',
        code: `// global
app.component('BaseButton', BaseButton)

// local, <script setup>
import ProductCard from './ProductCard.vue'

// local, Options API
export default { components: { ProductCard } }`,
      },
      whyAsked: 'Tests awareness of bundle size and maintainability at scale, not just syntax.',
      mistakes: ['Saying global registration is deprecated.', 'Claiming global components render slower.', 'Not knowing that `<script setup>` imports are already registration.'],
      followUps: ['How does Vue resolve a globally registered component by name?', 'How do auto-import build plugins change this trade-off?'],
      modelAnswer: 'Global registration with `app.component` makes a component usable everywhere, while local registration — just importing it in `<script setup>` — scopes it to one file. I default to local because unused global components can\'t be tree-shaken and because in a big codebase you can\'t tell where a global tag comes from. Local imports document dependencies at the top of the file. I use global registration only for a handful of base components or when a UI library plugin registers its components.',
    },
    {
      id: 'why-components-shared-state-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A `LikeButton` component is used five times on a page. Liking one post marks all five as liked. The component imports `const liked = ref(false)` from a `likeState.js` file. What is wrong and how do you fix it?',
      answer: 'The ref is created once at module level in `likeState.js`, so every instance imports the same object and shares state. Create the ref inside `<script setup>` (or inside a function/composable that is called per instance) so each instance gets its own.',
      explanation: 'ES modules are evaluated once. Anything created at their top level is a singleton shared by all importers; `<script setup>` runs per instance.',
      code: {
        lang: 'js',
        code: `// likeState.js — shared by everyone who imports it
export const liked = ref(false)

// fix: a function creates fresh state per call
export function useLike() {
  const liked = ref(false)
  return { liked, toggle: () => (liked.value = !liked.value) }
}`,
      },
      whyAsked: 'A very common real-world bug; it checks you understand module scope vs instance scope.',
      mistakes: ['Blaming reactivity or keys.', 'Suggesting `reactive()` instead of `ref()`, which changes nothing.', 'Not realising module-level state is sometimes intentional (shared stores).'],
      followUps: ['When is module-level state the right choice?', 'How does Pinia relate to this?'],
      modelAnswer: 'The ref lives at the top level of a module, and modules are evaluated only once, so all five instances share one ref. Instance state must be created per instance — inside `<script setup>` or inside a composable function that each instance calls. Module-level state is exactly how you build intentionally shared state, like a simple store, so the fix is to choose deliberately which one you want.',
    },
    {
      id: 'why-components-unit-of-update',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'A child component\'s local state changes. Does its parent re-render? And if the parent re-renders, do all of its children re-render too?',
      answer: 'No — each component instance has its own render effect, so a child\'s local state change re-renders only that child. When a parent re-renders, Vue patches each child vnode and checks whether the child\'s props (or dynamic slots) changed; children whose props are unchanged are skipped.',
      explanation: 'Components are Vue\'s unit of update. Splitting a frequently changing piece into its own component can limit how much re-renders.',
      whyAsked: 'Separates people who understand Vue\'s update model from those who assume "everything re-renders".',
      mistakes: ['Saying the whole tree re-renders on any change.', 'Saying children never re-render when the parent does — they do if their props changed.', 'Confusing re-rendering (virtual DOM) with DOM writes.'],
      followUps: ['How could passing a new object literal as a prop on every render affect this?', 'What does `v-memo` or `shallowRef` change here?'],
      modelAnswer: 'Each instance has its own reactive render effect that tracks only what its render reads. So a child\'s local state change triggers only the child. When a parent re-renders, Vue diffs the child vnodes; for each child component it compares old and new props and skips the child if nothing relevant changed. That makes the component the unit of update. A practical consequence: passing a fresh object or inline array as a prop on every parent render makes the child see "new" props each time, so stable props help.',
    },
    {
      id: 'why-components-in-dom',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 2,
      question: 'A legacy page mounts Vue on existing HTML in `index.html` (no build step). `<UserAvatar />` inside that HTML renders nothing, but the same component works in a `.vue` file. Which change fixes it?',
      options: [
        'Register UserAvatar with `defineOptions({ name: \'UserAvatar\' })`',
        'Write `<user-avatar></user-avatar>` in the HTML',
        'Wrap the tag in `<template>`',
        'Rename the file to `useravatar.vue`',
      ],
      correctOption: 1,
      answer: 'Use kebab-case with an explicit closing tag: `<user-avatar></user-avatar>` (and make sure the component is registered on the app).',
      explanation: 'In-DOM templates go through the browser\'s HTML parser first. It lower-cases tag names and does not support self-closing custom elements, so `<UserAvatar />` becomes an unclosed `<useravatar>` that swallows the rest.',
      whyAsked: 'Checks understanding of where templates are parsed — common when progressively enhancing server-rendered pages.',
      mistakes: ['Thinking the component definition is broken.', 'Not knowing that SFC templates are parsed by Vue\'s compiler, not the browser.'],
      followUps: ['What other restrictions do in-DOM templates have (for example inside `<table>`)?'],
      modelAnswer: 'In-DOM templates are parsed by the browser before Vue sees them, so PascalCase is lower-cased and the self-closing custom tag isn\'t closed. I\'d write `<user-avatar></user-avatar>` and ensure it is registered on the app, since there\'s no `<script setup>` import in that HTML. In `.vue` files Vue\'s own compiler parses templates, so PascalCase and `/>` are fine.',
    },
    {
      id: 'why-components-when-to-split',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You inherit a 900-line `CheckoutPage.vue`. How do you decide what to extract into components, and what are the risks of over-splitting?',
      answer: 'Extract along responsibilities and reuse: pieces with their own state or behaviour (address form, payment method picker, order summary), pieces reused elsewhere, and pieces that change often or need isolated tests. Keep data ownership clear: the page (or a store) owns checkout state and passes it down. Over-splitting creates prop drilling, many tiny files, more wiring and indirection, and a small per-instance cost.',
      explanation: 'Split where a boundary is natural — a clear input/output contract — not where a file just feels long.',
      whyAsked: 'Architecture judgment: candidates should balance cohesion, reuse and data flow rather than follow a line-count rule.',
      mistakes: ['Using only a line-count rule.', 'Extracting components that need ten props and five events — a sign the boundary is wrong.', 'Moving state into children so siblings can no longer share it.'],
      followUps: ['Where would you keep the checkout state?', 'How would you avoid prop drilling here?', 'How would you test the extracted pieces?'],
      modelAnswer: 'I\'d first map responsibilities: shipping address, payment, order summary, promo code. Each has its own state and a clear contract, so they become components with props in and events out, while the page or a store owns the checkout data. Reused bits like a price row become small presentational components. I stop when a boundary would need lots of props flowing both ways — that usually means the pieces belong together. Over-splitting costs indirection, prop drilling and harder navigation, so cohesion beats tiny files.',
    },
    {
      id: 'why-components-coding-like',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Finish `LikeButton.vue` so that each of the three buttons in `App.vue` counts its own likes. Each button has `class="like-btn"` and shows `♥ ` followed by its count, starting at 0.',
      starter: {
        files: {
          'App.vue': `<script setup>
import LikeButton from './LikeButton.vue'
</script>

<template>
  <LikeButton />
  <LikeButton />
  <LikeButton />
</template>`,
          'LikeButton.vue': `<script setup>
// TODO: give each button its own count
</script>

<template>
  <button class="like-btn">♥ 0</button>
</template>`,
        },
      },
      tests: [
        { name: 'three buttons start at 0', code: `expect(findAll('.like-btn').map((b) => b.textContent.trim())).toEqual(['♥ 0', '♥ 0', '♥ 0'])` },
        {
          name: 'each button counts independently',
          code: `await click(findAll('.like-btn')[1])
await click(findAll('.like-btn')[1])
await click(findAll('.like-btn')[2])
expect(findAll('.like-btn').map((b) => b.textContent.trim())).toEqual(['♥ 0', '♥ 2', '♥ 1'])`,
        },
      ],
      hints: ['State that belongs to one button goes in its `<script setup>`.', '`const likes = ref(0)` and `@click="likes++"`.'],
      answer: 'Create the count with `ref(0)` inside `<script setup>` so every instance gets its own, and increment it on click.',
      solution: {
        files: {
          'App.vue': `<script setup>
import LikeButton from './LikeButton.vue'
</script>

<template>
  <LikeButton />
  <LikeButton />
  <LikeButton />
</template>`,
          'LikeButton.vue': `<script setup>
import { ref } from 'vue'

const likes = ref(0)
</script>

<template>
  <button class="like-btn" @click="likes++">♥ {{ likes }}</button>
</template>`,
        },
      },
      explanation: '`<script setup>` runs per instance, so each `LikeButton` has its own `likes` ref.',
      whyAsked: 'A warm-up that reveals whether you understand instance state.',
      mistakes: ['Creating the ref in a separate module so all buttons share it.', 'Manipulating the DOM text directly.'],
      followUps: ['How would you let App know the total number of likes?', 'How would you start each button at a different number?'],
      modelAnswer: 'I put `const likes = ref(0)` in the button\'s `<script setup>`, which runs once per instance, and bind `@click="likes++"`. Each of the three buttons then has independent state. If the parent needed the total, I\'d emit an event on each like or lift the counts into the parent and pass them down as props.',
    },
  ],

  takeaways: [
    'A component is a reusable, self-contained piece of UI: template + logic + styles, with a small interface.',
    'An app is a tree: parents use children; data goes down as props, messages come up as events.',
    'One definition, many instances — each instance runs `<script setup>` and owns its own state.',
    'In `<script setup>`, importing a component registers it locally. Prefer local registration; use `app.component()` sparingly.',
    'Use multi-word PascalCase names; in in-DOM templates use kebab-case with closing tags.',
    'Split components by responsibility and reuse, not by line count.',
  ],
}
