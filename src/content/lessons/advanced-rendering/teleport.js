// Lesson: Teleport.

const shopApp = `<script setup>
import { ref } from 'vue'
import ProductCard from './ProductCard.vue'

const cartCount = ref(0)
</script>

<template>
  <header class="top">
    <h2>Outdoor shop</h2>
    <p><span class="cart-count">{{ cartCount }}</span> in cart</p>
  </header>
  <div class="grid">
    <ProductCard name="Trail Backpack" :price="89" />
    <ProductCard name="Camp Stove" :price="45" />
  </div>
</template>

<style>
.grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
</style>`

const productCard = `<script setup>
import { ref } from 'vue'

defineProps({
  name: { type: String, required: true },
  price: { type: Number, required: true },
})
const open = ref(false)
</script>

<template>
  <article class="card">
    <h3>{{ name }}</h3>
    <p>{{ price }} €</p>
    <button class="details" @click="open = true">Details</button>

    <!-- 🐞 trapped inside .card: clipped by overflow, positioned by transform -->
    <div v-if="open" class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" :aria-label="name">
        <h3>{{ name }}</h3>
        <p>Free returns within 30 days.</p>
        <button class="close" @click="open = false">Close</button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  overflow: hidden;         /* clips the rounded product image… */
  transform: translateZ(0); /* …and a hover animation added this */
  border: 2px solid #1a1a1a;
  border-radius: 12px;
  padding: 12px;
  width: 190px;
  height: 160px;
}
.modal-backdrop {
  position: fixed; /* "cover the screen" — unless an ancestor has a transform */
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 100;
}
.modal {
  background: #fff;
  border: 2px solid #1a1a1a;
  padding: 16px;
  width: min(320px, 90vw);
}
</style>`

const productCardSolved = `<script setup>
import { ref } from 'vue'

defineProps({
  name: { type: String, required: true },
  price: { type: Number, required: true },
})
const emit = defineEmits(['add'])
const open = ref(false)

function addToCart() {
  emit('add')
  open.value = false
}
</script>

<template>
  <article class="card">
    <h3>{{ name }}</h3>
    <p>{{ price }} €</p>
    <button class="details" @click="open = true">Details</button>

    <Teleport to="body">
      <div v-if="open" class="modal-backdrop" @click.self="open = false">
        <div class="modal" role="dialog" aria-modal="true" :aria-label="name">
          <h3>{{ name }}</h3>
          <p>Free returns within 30 days.</p>
          <button class="add" @click="addToCart">Add to cart</button>
          <button class="close" @click="open = false">Close</button>
        </div>
      </div>
    </Teleport>
  </article>
</template>`

export default {
  id: 'teleport',
  title: 'Teleport',
  summary: 'Render part of a component somewhere else in the DOM — a modal on <body>, a toast in a corner — while it stays a normal child in your component tree.',
  difficulty: 'intermediate',
  minutes: 30,
  prerequisites: ['emits', 'slots'],
  related: ['transitions', 'accessible-components', 'dom-access-refs', 'provide-inject', 'hydration'],
  tags: ['teleport', 'portal', 'modal', 'toast', 'overlay', 'overflow hidden', 'z-index', 'stacking context', 'disabled', 'defer'],
  apis: [
    { name: '<Teleport to="…">', summary: 'Built-in component that renders its slot content into another DOM element, given as a CSS selector or an element.' },
    { name: 'disabled', summary: 'Teleport prop: when `true`, the content renders in place instead. Toggling it moves the existing DOM nodes.' },
    { name: 'defer', summary: 'Vue 3.5+ Teleport prop: resolve the target after the current mount/update, so it can point at an element rendered later by the same app.' },
  ],
  docs: [
    { label: 'Vue Guide — Teleport', url: 'https://vuejs.org/guide/built-ins/teleport.html' },
    { label: 'API — <Teleport>', url: 'https://vuejs.org/api/built-in-components.html#teleport' },
    { label: 'Vue Guide — SSR: Teleports', url: 'https://vuejs.org/guide/scaling-up/ssr.html#teleports' },
  ],

  intro: `
\`<Teleport>\` is a built-in component that takes whatever is inside it and renders it **somewhere else in the page** — usually at the end of \`<body>\`.

The surprising part is what *doesn't* move: in your component tree, the teleported content is still a child of the component that wrote it. It still reads that component's props and state, still emits events to it, still receives \`provide\`d values. Only the **real DOM nodes** live elsewhere.

It is the standard tool for modals, dialogs, toasts, tooltips and dropdown menus — UI that belongs to a component logically but must *visually* sit above everything else.
`,

  why: `
Picture a product card with a **Details** button that opens a full-screen modal. Logically, the modal belongs inside the card: it needs the product's name and price, and its "Add to cart" button should talk to the card.

But if you render it inside the card, CSS can trap it:

- \`overflow: hidden\` on an ancestor **clips** it;
- \`transform\`, \`perspective\` or \`filter\` on an ancestor make \`position: fixed\` relative to *that ancestor* instead of the screen;
- a parent's **stacking context** caps its \`z-index\` — a sibling section with a higher \`z-index\` covers your "top-most" modal.

None of those are bugs in your modal — they're how CSS works, and the card's styles may be owned by someone else. Before Teleport, people moved the modal to the root component and passed data through layers of props and events, or used global event buses.

\`<Teleport to="body">\` solves it in one line: the modal's DOM goes to \`<body>\`, outside every trap, while the code stays where it logically belongs.
`,

  eli15: `
Imagine a puppet show. The puppeteer stands behind a small booth, but some puppets need to fly over the audience. So the puppeteer uses long strings: the puppet flies around the whole theatre, but **the same puppeteer** still controls it from the same spot.

\`<Teleport>\` is those long strings. Your component (the puppeteer) keeps controlling the modal (the puppet) — it decides when it opens, what it says, and hears when someone clicks it. But the modal itself appears in a different place on the page, where nothing can hide it.

The booth's walls (\`overflow: hidden\`) can't cover a puppet that's flying above the audience.
`,

  analogy: {
    title: 'A puppet on long strings',
    body: `
The puppeteer stays in the booth — that's the component in your component tree. The puppet flies over the audience — that's the teleported DOM. The strings carry every instruction both ways: props down, events up.

The booth's walls and curtains are the CSS of the surrounding layout. A puppet still inside the booth gets hidden by them; a puppet on strings floats free.
`,
    mapping: [
      ['the puppeteer in the booth', 'the component that contains `<Teleport>`'],
      ['the puppet over the audience', 'the teleported DOM nodes, e.g. at the end of `<body>`'],
      ['the strings', 'props, emits, slots and provide/inject — all unchanged'],
      ['the booth\'s walls and curtains', 'ancestor CSS: `overflow: hidden`, `transform`, stacking contexts'],
      ['pulling the puppet back into the booth', '`:disabled="true"` — render in place again'],
    ],
  },

  visual: {
    type: 'rendering-lab',
    props: { mode: 'teleport' },
    title: 'Teleport, live',
    caption: 'Open the overlay with and without Teleport and compare where the element lands in the real DOM — and whether the surrounding box clips it.',
    alt: 'An interactive demo: a box with overflow hidden contains a button that opens an overlay. Without Teleport the overlay is clipped inside the box; with Teleport the overlay element is moved to the end of body and covers the page, while the DOM inspector shows only placeholder comments left in the box.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Two trees: components vs. DOM',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'app', label: 'App', note: 'component', tone: 'cobalt', x: 130, y: 50 },
        { id: 'card', label: 'ProductCard', note: 'component', tone: 'cobalt', x: 130, y: 160 },
        { id: 'modal', label: 'modal content', note: 'inside <Teleport>', tone: 'acid', x: 130, y: 270 },
        { id: 'body', label: '<body>', note: 'DOM', tone: 'paper', x: 560, y: 40 },
        { id: 'root', label: 'div#app', note: 'DOM', tone: 'paper', x: 450, y: 130 },
        { id: 'article', label: 'article.card', note: 'overflow: hidden', tone: 'kraft', x: 450, y: 230 },
        { id: 'backdrop', label: 'div.modal-backdrop', note: 'last child of body', tone: 'acid', x: 670, y: 150 },
      ],
      edges: [
        { from: 'app', to: 'card', label: 'parent of' },
        { from: 'card', to: 'modal', label: 'parent of' },
        { from: 'body', to: 'root' },
        { from: 'root', to: 'article' },
        { from: 'body', to: 'backdrop' },
        { from: 'modal', to: 'backdrop', label: 'DOM rendered into', dashed: true },
      ],
      steps: [
        { focus: ['app', 'card', 'modal'], edges: ['app->card', 'card->modal'], text: '**The component tree.** The modal content is written inside ProductCard, so it is ProductCard\'s child: it reads its props, emits to it, and can `inject` what it provides. Devtools shows it here too.' },
        { focus: ['body', 'root', 'article'], edges: ['body->root', 'root->article'], text: '**The DOM tree.** Normally a component\'s elements nest inside its parent\'s elements — so the modal would sit inside `article.card` and inherit its clipping and transform.' },
        { focus: ['modal', 'backdrop'], edges: ['modal->backdrop', 'body->backdrop'], text: '**Teleport** renders the modal\'s elements at the end of `<body>` instead. The component relationships on the left do not change at all.' },
        { focus: ['article', 'backdrop'], text: 'Inside the card only placeholder comments remain (`<!--teleport start-->` / `<!--teleport end-->`). The card\'s `overflow` and `transform` no longer affect the modal. One consequence: native DOM events from the modal bubble up through `<body>`, **not** through `article.card`.' },
      ],
    },
    caption: 'Teleport changes where the DOM lives — never who the component\'s parent is.',
    alt: 'Two trees side by side. On the left, the component tree: App, then ProductCard, then the modal content. On the right, the DOM tree: body contains div#app, which contains article.card; body also directly contains div.modal-backdrop. A dashed arrow shows the modal content being rendered into the backdrop element under body.',
  },

  syntax: [
    `
#### The basics
`,
    {
      code: `<template>
  <button @click="open = true">Open</button>

  <Teleport to="body">
    <div v-if="open" class="modal">
      <p>I'm rendered at the end of &lt;body&gt;.</p>
      <button @click="open = false">Close</button>
    </div>
  </Teleport>
</template>`,
      lang: 'vue',
      title: 'teleport a modal to <body>',
    },
    `
- \`to\` is **required**: a CSS selector (\`"body"\`, \`"#modals"\`, \`".sidebar"\`) or an actual DOM element.
- Put \`v-if\` **inside** the Teleport: the Teleport stays mounted, the content comes and goes.
- Several Teleports can target the same element; their content is **appended in mount order**, so a modal opened later lands after (on top of) an earlier one.
`,
    `
#### \`disabled\`: render in place
`,
    {
      code: `<Teleport to="body" :disabled="isMobile">
  <SidePanel />
</Teleport>`,
      lang: 'vue',
      title: 'overlay on desktop, inline on mobile',
    },
    `
When \`disabled\` is \`true\`, the content renders where the Teleport is written. Changing it later **moves** the existing DOM nodes — child components are not re-created, so their state survives.
`,
    `
#### \`defer\`: target something your app renders (Vue 3.5+)
`,
    {
      code: `<template>
  <main>
    <Teleport defer to="#toasts">
      <p class="toast">Saved!</p>
    </Teleport>
  </main>

  <!-- rendered later in the same template -->
  <div id="toasts"></div>
</template>`,
      lang: 'vue',
      title: 'defer resolves the target after mounting',
    },
    {
      callout: 'version',
      title: '`defer` needs Vue 3.5+',
      text: 'Without `defer`, the target must already exist in the DOM when the Teleport mounts — ideally an element outside the whole Vue app (for example `<div id="modals"></div>` in `index.html`). With `defer`, the target can be rendered by your app, as long as it is mounted in the **same** mount/update tick.',
    },
    `
**What does *not* change when you teleport:**

1. Props, emits, slots and \`provide\`/\`inject\` work exactly as if the content stayed in place.
2. Scoped styles still apply to the teleported elements (they keep their \`data-v-…\` attributes) — but selectors that depend on **DOM ancestors**, like \`.card .modal\`, stop matching.
3. Native DOM events bubble through the **real DOM**: a click inside a teleported modal does not bubble to the parent's wrapper element.
`,
  ],

  walkthrough: {
    title: 'ProductCard.vue (fixed)',
    lang: 'vue',
    code: productCardSolved,
    intro: 'This is the product card after the fix — the version you will build in the playground. Step through to see what Teleport changes, and what it leaves alone.',
    steps: [
      { lines: [8, 14], text: 'The card declares an `add` event. Nothing about emitting changes because of Teleport — the modal will call `addToCart()` and the event goes to the card\'s parent as usual.' },
      { lines: [21], text: 'The trigger button lives inside the card, like any other button.' },
      { lines: [23], text: '`<Teleport to="body">` — everything inside will be rendered as the last children of `<body>`, outside the card\'s `overflow: hidden` and `transform`.' },
      { lines: [24], text: '`v-if` sits **inside** the Teleport, so the Teleport stays mounted while the modal comes and goes. `@click.self` closes the modal only when the click lands on the backdrop itself, not on the dialog.' },
      { lines: [25, 27], text: 'The modal still reads the card\'s props (`name`). Logically it is still part of ProductCard; only its DOM moved. `role="dialog"` and `aria-modal` tell assistive technology what this is.' },
      { lines: [28, 29], text: 'Buttons in the teleported DOM call the card\'s functions. `addToCart()` emits `add` to the card\'s parent — even though, in the DOM, the button is nowhere near the card.' },
      { lines: [32, 33], text: 'The card ends here. In the real DOM, `article.card` now contains only two placeholder comments where the modal used to be.' },
    ],
  },

  playground: {
    title: 'Trapped modal',
    objective: 'Free a modal from its card with Teleport, prove that events still reach the parent, then try `disabled` and `defer`.',
    files: { 'App.vue': shopApp, 'ProductCard.vue': productCard },
    expected: 'Two product cards. Click **Details**: the "full-screen" modal appears squashed **inside** the card and clipped at its edges, because the card has `overflow: hidden` and a `transform`. Your first job is to free it.',
    experiments: [
      {
        id: 'to-body',
        task: 'In ProductCard.vue, wrap the whole `.modal-backdrop` block in `<Teleport to="body">`. Open Details again.',
        hint: 'Keep the `v-if` on the backdrop — put the Teleport **around** it: `<Teleport to="body"><div v-if="open" class="modal-backdrop">…</div></Teleport>`.',
        tests: [
          {
            name: 'the modal is rendered in <body>, outside the app',
            code: `await click('.details')
expect(exists('.modal-backdrop')).toBe(false)
const modal = document.querySelector('body > .modal-backdrop .modal')
expect(modal).toBeTruthy()
expect(modal.textContent).toContain('Trail Backpack')
await click(modal.querySelector('.close'))
expect(document.querySelector('.modal-backdrop')).toBeNull()`,
          },
        ],
        explain: 'The backdrop now covers the whole screen: its DOM is a direct child of `<body>`, so no ancestor clips it or changes what `position: fixed` is relative to. Notice the scoped styles still apply — the elements kept their `data-v-…` attributes.',
      },
      {
        id: 'emit-through',
        task: 'Add an **Add to cart** button (`class="add"`) inside the modal. Clicking it should increase the cart count in **App.vue**.',
        hint: 'In ProductCard: `const emit = defineEmits([\'add\'])` and `<button class="add" @click="emit(\'add\')">`. In App: `<ProductCard … @add="cartCount++" />` on each card.',
        tests: [
          {
            name: 'clicking Add to cart updates App',
            code: `await click('.details')
const add = document.querySelector('.modal .add')
expect(add).toBeTruthy()
await click(add)
expect(text('.cart-count')).toBe('1')`,
          },
        ],
        explain: 'The button\'s DOM may be in `<body>`, but component events follow the **component tree**, not the DOM. Teleport never changes who a component\'s parent is.',
      },
      {
        id: 'inline-mode',
        task: 'Add a checkbox `class="inline-toggle"` to App, bound to an `inline` ref, and pass it to each card as a prop. In ProductCard, use it as `:disabled` on the Teleport so the modal renders **in place** when checked.',
        hint: 'App: `<input type="checkbox" class="inline-toggle" v-model="inline">` and `<ProductCard :inline="inline" …>`. ProductCard: add `inline: Boolean` to `defineProps`, then `<Teleport to="body" :disabled="inline">`.',
        tests: [
          {
            name: 'with inline checked, the modal stays inside the card',
            code: `await check('.inline-toggle', true)
await click('.details')
expect(exists('.card .modal')).toBe(true)
expect(document.querySelector('body > .modal-backdrop')).toBeNull()`,
          },
        ],
        explain: '`disabled` is how one component can be an overlay on desktop and an inline panel on mobile. Toggling it moves the existing DOM nodes; nothing is re-created. (A real inline layout would also switch to different styles.)',
      },
      {
        id: 'defer-container',
        task: 'Instead of `body`, teleport into a dedicated `<div id="modals"></div>` that App.vue renders **after** the grid. You\'ll see a warning in the console at first — fix it with one extra attribute.',
        hint: 'Change to `<Teleport defer to="#modals">`. Without `defer`, the target must already exist when the Teleport mounts — and `#modals` is rendered after the cards.',
        tests: [
          {
            name: 'the modal lands inside #modals',
            code: `await click('.details')
expect(exists('#modals .modal')).toBe(true)`,
          },
        ],
        explain: '`defer` (Vue 3.5+) resolves the target after the current mount, like code in `onMounted`. A dedicated container keeps all overlays together, which also makes stacking order and server-side rendering easier to manage.',
      },
    ],
  },

  internals: {
    beginner: `
Teleport is a special kind of component. When Vue mounts it, it looks up the target element (\`document.querySelector(to)\`), and creates its children **there** instead of in the current spot. In the current spot it leaves two invisible bookmark comments, so it remembers where it "really" belongs. When the content updates, Vue patches it in the target as usual. When the Teleport unmounts, Vue removes the content from the target.
`,
    technical: [
      `
In the renderer, \`Teleport\` is not a normal component with an instance — it is a built-in with its own \`process\` logic that the patch algorithm calls directly. Its vnode keeps \`children\` like any element, but mounts them into the resolved target container:
`,
      {
        code: `// A simplified model of what Teleport does on mount — not Vue's real source
function mountTeleport(vnode, container, anchor) {
  insert(createComment('teleport start'), container, anchor)
  insert(createComment('teleport end'), container, anchor)

  const target = typeof vnode.props.to === 'string'
    ? document.querySelector(vnode.props.to)
    : vnode.props.to

  const where = vnode.props.disabled ? container : target
  mountChildren(vnode.children, where)   // same parent component, different DOM spot
}`,
        lang: 'js',
        title: 'mental model of Teleport',
      },
      `
Key consequences:

- **Logical parent unchanged.** The children are mounted with the *same parent component instance*, so props, emits, \`provide\`/\`inject\` and error propagation (\`onErrorCaptured\`) follow the component tree.
- **Moving, not re-creating.** When \`to\` or \`disabled\` changes, Vue moves the existing child DOM nodes between containers; component instances (and their state) survive.
- **Target timing.** Without \`defer\`, the target is resolved at the moment the Teleport mounts. If it doesn't exist yet, Vue warns "Failed to locate Teleport target" and the content isn't rendered. With \`defer\` (3.5+), resolution is queued to run after the current render, like a \`mounted\` hook.
- **Fallthrough attributes.** A component whose root node is a Teleport can't receive fallthrough attributes automatically (Vue warns about "teleport root nodes"). Bind \`v-bind="$attrs"\` on the element you want, with \`inheritAttrs: false\`.
`,
    ],
    production: `
- **Use a dedicated container** such as \`<div id="modals"></div>\` next to \`#app\` in \`index.html\`, instead of \`body\`. It keeps overlays together and is what Vue's SSR guide recommends.
- **Server-side rendering:** teleported content is rendered separately from the main HTML and must be injected into the right place in the page; avoid targeting \`body\` with SSR because the server-rendered body contains other content, which makes hydration ambiguous. Frameworks like Nuxt provide a teleport container for you. See [Hydration](lesson:hydration).
- **Accessibility is your job.** Teleport only moves DOM. A real modal also needs focus moved into it and restored afterwards, a focus trap, Escape to close, \`role="dialog"\`/\`aria-modal\`, a label, and the background made inert. See [Accessible components](lesson:accessible-components). The native \`<dialog>\` element with \`showModal()\` provides some of this out of the box.
- **Click-outside logic must know about teleported parts.** A dropdown whose menu is teleported is no longer DOM-inside its trigger, so \`wrapper.contains(event.target)\` is false for clicks in the menu. Check against both elements.
- **Stacking:** multiple teleports append in order. For a stack of modals, later ones naturally render later in the container; keep z-index rules on the container, not scattered across components.
`,
  },

  mistakes: [
    {
      title: 'Targeting an element that is rendered after the Teleport',
      wrong: { code: `<template>\n  <Teleport to="#modals">\n    <Modal v-if="open" />\n  </Teleport>\n  <div id="modals"></div> <!-- rendered AFTER the Teleport -->\n</template>`, lang: 'vue' },
      right: { code: `<!-- index.html: <div id="app"></div><div id="modals"></div> -->\n<Teleport to="#modals">\n  <Modal v-if="open" />\n</Teleport>\n\n<!-- or, Vue 3.5+: -->\n<Teleport defer to="#modals">…</Teleport>`, lang: 'vue' },
      explanation: 'Without `defer`, the target must already be in the DOM when the Teleport mounts. Put the container outside the Vue app, or use `defer` when your app renders it in the same tick.',
    },
    {
      title: 'Styling teleported content through its old ancestors',
      wrong: { code: `<style scoped>\n.card .modal { width: 320px; } /* .modal is no longer inside .card */\n</style>`, lang: 'vue' },
      right: { code: `<style scoped>\n.modal { width: 320px; } /* scoped attributes still apply */\n</style>`, lang: 'vue' },
      explanation: 'Scoped styles still reach teleported elements, but descendant selectors based on the *old* DOM position no longer match.',
    },
    {
      title: 'Relying on DOM event bubbling to the parent',
      wrong: { code: `<div class="card" @click="trackClick">\n  <Teleport to="body">\n    <button @click="buy">Buy</button> <!-- trackClick never fires -->\n  </Teleport>\n</div>`, lang: 'vue' },
      right: { code: `<Teleport to="body">\n  <button @click="buy(); trackClick()">Buy</button>\n</Teleport>`, lang: 'vue' },
      explanation: 'Native events bubble through the real DOM, which now goes button → body → html. Component events (`emit`) are unaffected, but delegated DOM listeners on ancestors no longer see these clicks.',
    },
    {
      title: 'Making a Teleport the root and expecting attrs to fall through',
      wrong: { code: `<!-- Modal.vue -->\n<template>\n  <Teleport to="body"><div class="modal"><slot /></div></Teleport>\n</template>\n<!-- parent: <Modal class="wide" /> → warning, class ignored -->`, lang: 'vue' },
      right: { code: `<script setup>\ndefineOptions({ inheritAttrs: false })\n</script>\n<template>\n  <Teleport to="body"><div class="modal" v-bind="$attrs"><slot /></div></Teleport>\n</template>`, lang: 'vue' },
      explanation: 'Vue can\'t pick an element to receive fallthrough attributes when the root is a Teleport. Opt out with `inheritAttrs: false` and bind `$attrs` explicitly. See [Fallthrough attributes](lesson:fallthrough-attrs).',
    },
    {
      title: 'Thinking Teleport makes a modal accessible',
      wrong: { code: `<Teleport to="body">\n  <div v-if="open" class="modal">…</div>\n</Teleport>`, lang: 'vue' },
      right: { code: `<Teleport to="body">\n  <div v-if="open" class="modal" role="dialog" aria-modal="true"\n       aria-labelledby="modal-title" @keydown.esc="close">\n    <h2 id="modal-title">…</h2>\n    <!-- + move focus in on open, trap it, restore it on close -->\n  </div>\n</Teleport>`, lang: 'vue' },
      explanation: 'Teleport fixes *visual* problems only. Keyboard and screen-reader users need focus management, a dialog role, a label and an Escape key.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: Failed to locate Teleport target with selector "#modals"` and nothing appears.',
      cause: 'The target doesn\'t exist when the Teleport mounts — it\'s rendered later by Vue, it\'s under a `v-if`, or the selector is misspelled.',
      fix: 'Move the container into `index.html` (outside `#app`), or add `defer` (Vue 3.5+) if the same render creates it. Check the selector.',
    },
    {
      symptom: 'Tests or `querySelector` inside the component can\'t find the modal.',
      cause: 'The modal\'s DOM is no longer inside the component\'s root element or the app\'s mount element.',
      fix: 'Query the target (`document.querySelector(\'body > .modal\')`). In component tests, stub Teleport or attach the target to `document.body`.',
    },
    {
      symptom: 'A dropdown closes immediately when you click an item in its teleported menu.',
      cause: 'Click-outside logic checks `root.contains(event.target)`, and the teleported menu isn\'t inside `root` in the DOM.',
      fix: 'Keep template refs to both the trigger and the menu, and treat a click inside either as "inside".',
    },
    {
      symptom: '"Extraneous non-props attributes … could not be automatically inherited because component renders … teleport root nodes".',
      cause: 'The component\'s root is a `<Teleport>`, so Vue doesn\'t know where to put `class`, `id` and other attributes.',
      fix: 'Set `inheritAttrs: false` (e.g. `defineOptions({ inheritAttrs: false })`) and bind `v-bind="$attrs"` on the intended element.',
    },
    {
      symptom: 'The modal is still covered by the site header.',
      cause: 'Even at the end of `<body>`, z-index rules apply: the header has a higher `z-index` in the same stacking context.',
      fix: 'Give the overlay container a z-index above your layout layers, defined once (for example on `#modals`).',
    },
  ],

  bestPractices: [
    'Teleport overlays (modals, toasts, popovers, menus) to a dedicated container like `#modals` defined in `index.html`.',
    'Keep `v-if` inside the Teleport so the Teleport itself stays mounted.',
    'Use `defer` (3.5+) only when the target is rendered by your app in the same tick; otherwise prefer an external container.',
    'Use `disabled` for responsive "overlay vs inline" behaviour — it moves DOM without losing component state.',
    'Remember DOM events bubble through the real DOM: update click-outside and delegated listeners accordingly.',
    'Wrap Teleport in one reusable `BaseModal` that also handles focus, Escape, ARIA and scroll locking.',
  ],

  useCases: [
    'Modals and confirmation dialogs opened from deep inside cards, tables or sidebars.',
    'Toast notifications triggered anywhere but displayed in one corner container.',
    'Tooltips, popovers and dropdown menus that must escape `overflow: hidden` scroll areas.',
    'A full-screen mode for a media player or chart (`:disabled="!fullscreen"`).',
    'Rendering into a slot of the page layout, like a page-specific toolbar in a global header.',
  ],

  whenToUse: {
    use: [
      'UI that logically belongs to a component but must visually escape its container (overflow, transform, z-index).',
      'Overlays that should share one place in the DOM for consistent stacking.',
      'Content that needs to switch between overlay and inline rendering without losing state.',
    ],
    avoid: [
      'Ordinary content that isn\'t trapped by CSS — teleporting adds indirection and test friction.',
      'Moving content between unrelated pages or features — that\'s shared state (a store), not Teleport.',
      'Expecting Teleport to handle accessibility, focus or scroll locking for you.',
    ],
  },

  comparison: {
    title: 'Ways to show an overlay',
    headers: ['', '`<Teleport>`', 'rendered in place', 'separate `createApp()`', 'native `<dialog>` + `showModal()`'],
    rows: [
      ['Escapes overflow / transform / z-index traps?', 'yes — DOM moved', '**no**', 'yes', 'yes — shown in the browser\'s top layer'],
      ['Props, emits, provide/inject?', 'all work', 'all work', '**no** — a separate app and context', 'all work (it is still in your template)'],
      ['Where the DOM lives', 'the `to` target', 'inside the parent', 'its own mount element', 'in place, displayed in the top layer'],
      ['Extra code needed', 'one wrapper', 'none', 'manual mount/unmount', 'call `showModal()`/`close()` via a template ref'],
      ['Good for', 'modals, toasts, menus', 'inline panels', 'widgets embedded in non-Vue pages', 'modal dialogs with built-in Escape & focus behaviour'],
    ],
    note: 'Teleport and `<dialog>` can be combined. Either way, add the accessibility pieces covered in [Accessible components](lesson:accessible-components).',
  },

  quiz: [
    {
      id: 'teleport-q1',
      type: 'mcq',
      prompt: 'What does `<Teleport to="body">` change about the content inside it?',
      options: [
        { text: 'Its parent component becomes the root `App`', why: 'The component hierarchy is untouched — only the DOM location changes.' },
        { text: 'Where its DOM nodes are inserted — nothing about its component relationships' },
        { text: 'It stops receiving props from the component that wrote it', why: 'Props, emits, slots and inject work exactly as before.' },
        { text: 'It becomes a separate Vue app', why: 'It stays in the same app and component tree; a separate app would be `createApp()`.' },
      ],
      answer: 1,
      explanation: 'Teleport only alters the rendered DOM structure. Logically the content is still a child of the component containing the Teleport.',
    },
    {
      id: 'teleport-q2',
      type: 'output',
      prompt: 'Both Teleports target `#modals` (which exists in `index.html`). In what order do their paragraphs appear inside `#modals`?',
      code: {
        lang: 'vue',
        code: `<template>
  <Teleport to="#modals"><p>Cookie banner</p></Teleport>
  <Teleport to="#modals"><p>Welcome dialog</p></Teleport>
</template>`,
      },
      options: [
        'Cookie banner, then Welcome dialog',
        { text: 'Welcome dialog, then Cookie banner', why: 'Teleported content is appended, not prepended.' },
        { text: 'Only Welcome dialog — the second replaces the first', why: 'Teleports to the same target accumulate; nothing is replaced.' },
        { text: 'Only Cookie banner — a target accepts one Teleport', why: 'Any number of Teleports may share a target.' },
      ],
      answer: 0,
      explanation: 'Multiple Teleports to the same target append their content in mount order — later ones come after earlier ones.',
    },
    {
      id: 'teleport-q3',
      type: 'bug',
      prompt: 'This component logs "Failed to locate Teleport target". Click the line that should change (Vue 3.5).',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const open = ref(false)
</script>

<template>
  <button @click="open = true">Help</button>
  <Teleport to="#help-root">
    <div v-if="open" class="help">Need a hand?</div>
  </Teleport>
  <div id="help-root"></div>
</template>`,
      },
      answerLine: 8,
      explanation: '`#help-root` is rendered by the same template *after* the Teleport, so it doesn\'t exist when the Teleport mounts. Use `<Teleport defer to="#help-root">` (3.5+), or move the container into `index.html`.',
    },
    {
      id: 'teleport-q4',
      type: 'fill',
      prompt: 'Fill the blanks: teleport the side panel to `body`, but render it in place on mobile.',
      code: {
        lang: 'vue',
        code: `<Teleport ___="body" :___="isMobile">
  <SidePanel />
</Teleport>`,
      },
      answer: [['to'], ['disabled']],
      explanation: '`to` names the target; `disabled` renders the content in place when true.',
    },
    {
      id: 'teleport-q5',
      type: 'mcq',
      prompt: 'A parent has `<div class="card" @click="count++">` wrapping a `<Teleport to="body">` that contains a button. The user clicks that button. What happens to `count`?',
      options: [
        { text: 'It increases — events follow the component tree', why: 'Only *component* events (`emit`) follow the component tree. Native DOM events bubble through the real DOM.' },
        { text: 'It stays the same — the click bubbles to `<body>`, not through `.card`' },
        { text: 'It increases twice', why: 'The `.card` listener never sees this click at all.' },
        { text: 'Vue throws an error', why: 'Nothing is wrong; it is just a DOM fact you must design around.' },
      ],
      answer: 1,
      explanation: 'The button\'s real DOM parent is `<body>`, so its native click bubbles button → body → html. The `.card` element is not on that path.',
    },
    {
      id: 'teleport-q6',
      type: 'mcq',
      prompt: 'A `ConfirmDialog` component is rendered inside a Teleport. Which of these still work? **Select all that apply.**',
      options: [
        { text: 'Props passed from the component that contains the Teleport' },
        { text: '`emit(\'confirm\')` reaching that component' },
        { text: '`inject()` of a value provided by an ancestor component' },
        { text: 'A scoped CSS rule `.page .dialog` from the parent page', why: 'The dialog is no longer a DOM descendant of `.page`, so the descendant selector can\'t match.' },
        { text: 'A delegated DOM click listener on the parent\'s root element', why: 'Native events bubble through the real DOM, which no longer passes through the parent\'s root.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Everything that follows the component tree keeps working; everything that depends on DOM ancestry (descendant selectors, DOM bubbling) changes.',
    },
    {
      id: 'teleport-q7',
      type: 'short',
      prompt: 'Explain in two or three sentences why a modal with `position: fixed` can end up clipped inside a card, and how Teleport fixes it.',
      answer: 'If an ancestor has a transform, perspective or filter, it becomes the containing block for fixed-position descendants, so the modal is positioned relative to the card; and overflow: hidden on that ancestor then clips it (z-index is also capped by the ancestor\'s stacking context). Teleport renders the modal\'s DOM at the end of body (or another container), outside those ancestors, while it remains the card\'s child in the component tree.',
    },
  ],

  exercises: [
    {
      id: 'toast-stack',
      title: 'Toasts that escape a clipped panel',
      difficulty: 'intermediate',
      prompt: `
A settings panel (\`class="panel"\`, with \`overflow: hidden\`) contains a \`ToastStack\` component. Toasts currently render inside the panel and get clipped. Fix **ToastStack.vue**:

- Teleport the list into \`<div id="toasts">\`, which App.vue renders **after** the panel (so you'll need \`defer\`).
- Render \`<ul class="toast-list">\` **only** when there is at least one toast.
- Each toast is \`<li class="toast">\` with its message and a \`<button class="dismiss">\` that emits \`dismiss\` with the toast's \`id\`. (SettingsPanel already forwards that event to App, which removes the toast.)
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import SettingsPanel from './SettingsPanel.vue'

const toasts = ref([])
let nextId = 1

function notify() {
  const id = nextId++
  toasts.value.push({ id, message: 'Settings saved (#' + id + ')' })
}
function dismiss(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}
</script>

<template>
  <SettingsPanel :toasts="toasts" @save="notify" @dismiss="dismiss" />
  <div id="toasts"></div>
</template>`,
        'SettingsPanel.vue': `<script setup>
import ToastStack from './ToastStack.vue'

defineProps({ toasts: { type: Array, required: true } })
const emit = defineEmits(['save', 'dismiss'])
</script>

<template>
  <section class="panel">
    <h3>Settings</h3>
    <button class="save" @click="emit('save')">Save</button>
    <ToastStack :toasts="toasts" @dismiss="(id) => emit('dismiss', id)" />
  </section>
</template>

<style scoped>
.panel {
  height: 110px;
  overflow: hidden;
  border: 2px solid #1a1a1a;
  padding: 8px;
}
</style>`,
        'ToastStack.vue': `<script setup>
defineProps({ toasts: { type: Array, required: true } })
</script>

<template>
  <!-- TODO: teleport into #toasts, hide when empty, wire up dismiss -->
  <ul class="toast-list">
    <li v-for="t in toasts" :key="t.id" class="toast">
      {{ t.message }}
      <button class="dismiss">×</button>
    </li>
  </ul>
</template>`,
      },
      hints: [
        'Wrap the list in `<Teleport to="#toasts">`. Run it: the console warning tells you the target doesn\'t exist yet — that\'s what `defer` is for.',
        'Put `v-if="toasts.length"` on the `<ul>` (inside the Teleport).',
        'Declare `const emit = defineEmits([\'dismiss\'])` and use `@click="emit(\'dismiss\', t.id)"` on the button.',
      ],
      solution: {
        explanation: '`defer` lets the Teleport target `#toasts`, which the same render creates after the panel. The toasts now live outside the clipped panel in the DOM, yet the `dismiss` event still travels ToastStack → SettingsPanel → App, because Teleport never changes the component tree.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import SettingsPanel from './SettingsPanel.vue'

const toasts = ref([])
let nextId = 1

function notify() {
  const id = nextId++
  toasts.value.push({ id, message: 'Settings saved (#' + id + ')' })
}
function dismiss(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}
</script>

<template>
  <SettingsPanel :toasts="toasts" @save="notify" @dismiss="dismiss" />
  <div id="toasts"></div>
</template>`,
          'SettingsPanel.vue': `<script setup>
import ToastStack from './ToastStack.vue'

defineProps({ toasts: { type: Array, required: true } })
const emit = defineEmits(['save', 'dismiss'])
</script>

<template>
  <section class="panel">
    <h3>Settings</h3>
    <button class="save" @click="emit('save')">Save</button>
    <ToastStack :toasts="toasts" @dismiss="(id) => emit('dismiss', id)" />
  </section>
</template>

<style scoped>
.panel {
  height: 110px;
  overflow: hidden;
  border: 2px solid #1a1a1a;
  padding: 8px;
}
</style>`,
          'ToastStack.vue': `<script setup>
defineProps({ toasts: { type: Array, required: true } })
const emit = defineEmits(['dismiss'])
</script>

<template>
  <Teleport defer to="#toasts">
    <ul v-if="toasts.length" class="toast-list">
      <li v-for="t in toasts" :key="t.id" class="toast">
        {{ t.message }}
        <button class="dismiss" @click="emit('dismiss', t.id)">×</button>
      </li>
    </ul>
  </Teleport>
</template>`,
        },
      },
      tests: [
        { name: 'no empty list at first', code: `expect(exists('.toast-list')).toBe(false)` },
        {
          name: 'toasts render inside #toasts, not inside the panel',
          code: `await click('.save')
await click('.save')
expect(findAll('#toasts .toast')).toHaveLength(2)
expect(findAll('.panel .toast')).toHaveLength(0)`,
        },
        {
          name: 'dismiss removes the right toast',
          code: `await click('.save')
await click('.save')
await click(findAll('#toasts .dismiss')[0])
expect(findAll('#toasts .toast')).toHaveLength(1)
expect(text('#toasts')).toContain('#2')
expect(text('#toasts')).not.toContain('#1')`,
        },
        {
          name: 'the list disappears when the last toast is dismissed',
          code: `await click('.save')
await click('#toasts .dismiss')
expect(exists('.toast-list')).toBe(false)`,
        },
      ],
    },
    {
      id: 'base-modal',
      title: 'A reusable BaseModal',
      difficulty: 'intermediate',
      prompt: `
Finish **BaseModal.vue**. App.vue is complete and already uses it.

- Props: \`open\` (Boolean), \`title\` (String), \`inline\` (Boolean, default \`false\`). Emits: \`close\`.
- When \`open\`, render \`<div class="modal-backdrop">\` containing \`<div class="modal" role="dialog" aria-modal="true">\` with \`<h2 class="modal-title">\`, the **default slot**, and \`<button class="modal-close">Close</button>\` (the starter already has this markup).
- **Teleport** it to \`body\`, unless \`inline\` is true — then render it in place.
- Emit \`close\` when: the Close button is clicked; the **backdrop itself** is clicked (clicks inside \`.modal\` must not close it); or **Escape** is pressed inside the modal.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'

const showTerms = ref(false)
const inline = ref(false)
</script>

<template>
  <label><input v-model="inline" type="checkbox" class="inline" /> Inline (mobile layout)</label>
  <button class="open-modal" @click="showTerms = true">Read terms</button>

  <BaseModal :open="showTerms" title="Terms of service" :inline="inline" @close="showTerms = false">
    <p class="terms">Be kind. Never share your password.</p>
  </BaseModal>
</template>`,
        'BaseModal.vue': `<script setup>
defineProps({
  open: Boolean,
  title: String,
  inline: Boolean,
})
defineEmits(['close'])
</script>

<template>
  <div v-if="open" class="modal-backdrop">
    <div class="modal" role="dialog" aria-modal="true">
      <h2 class="modal-title">{{ title }}</h2>
      <slot />
      <button class="modal-close">Close</button>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
}
.modal {
  background: #fff;
  border: 2px solid #1a1a1a;
  padding: 16px;
  width: min(360px, 90vw);
}
</style>`,
      },
      hints: [
        'Wrap the backdrop in `<Teleport to="body" :disabled="inline">`.',
        'Use `const emit = defineEmits([\'close\'])`. The `.self` modifier — `@click.self="emit(\'close\')"` on the backdrop — ignores clicks that started inside `.modal`.',
        'Keydown events bubble: `@keydown.esc="emit(\'close\')"` on the backdrop catches Escape pressed anywhere inside the modal. Add `@click="emit(\'close\')"` to the Close button.',
      ],
      solution: {
        explanation: 'The Teleport moves the overlay out of any trapping layout, `disabled` keeps the inline option, and the slot keeps the modal reusable. All three close paths emit the same event, so the parent stays the single owner of `open` — the modal never mutates its own prop.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import BaseModal from './BaseModal.vue'

const showTerms = ref(false)
const inline = ref(false)
</script>

<template>
  <label><input v-model="inline" type="checkbox" class="inline" /> Inline (mobile layout)</label>
  <button class="open-modal" @click="showTerms = true">Read terms</button>

  <BaseModal :open="showTerms" title="Terms of service" :inline="inline" @close="showTerms = false">
    <p class="terms">Be kind. Never share your password.</p>
  </BaseModal>
</template>`,
          'BaseModal.vue': `<script setup>
defineProps({
  open: Boolean,
  title: String,
  inline: Boolean,
})
const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body" :disabled="inline">
    <div
      v-if="open"
      class="modal-backdrop"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div class="modal" role="dialog" aria-modal="true">
        <h2 class="modal-title">{{ title }}</h2>
        <slot />
        <button class="modal-close" @click="emit('close')">Close</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
}
.modal {
  background: #fff;
  border: 2px solid #1a1a1a;
  padding: 16px;
  width: min(360px, 90vw);
}
</style>`,
        },
      },
      tests: [
        {
          name: 'opens in <body> with the title and slot content',
          code: `await click('.open-modal')
expect(exists('.modal-backdrop')).toBe(false)
const modal = document.querySelector('body > .modal-backdrop .modal')
expect(modal).toBeTruthy()
expect(modal.querySelector('.modal-title').textContent).toBe('Terms of service')
expect(modal.querySelector('.terms')).toBeTruthy()`,
        },
        {
          name: 'the Close button closes it',
          code: `await click('.open-modal')
await click(document.querySelector('.modal-close'))
expect(document.querySelector('.modal-backdrop')).toBeNull()`,
        },
        {
          name: 'backdrop click closes, a click inside does not',
          code: `await click('.open-modal')
await click(document.querySelector('.modal .terms'))
expect(document.querySelector('.modal-backdrop')).toBeTruthy()
await click(document.querySelector('.modal-backdrop'))
expect(document.querySelector('.modal-backdrop')).toBeNull()`,
        },
        {
          name: 'Escape inside the modal closes it',
          code: `await click('.open-modal')
await trigger(document.querySelector('.modal-close'), 'keydown', { key: 'Escape' })
expect(document.querySelector('.modal-backdrop')).toBeNull()`,
        },
        {
          name: 'inline mode renders in place',
          code: `await check('.inline', true)
await click('.open-modal')
expect(exists('.modal-backdrop .modal-title')).toBe(true)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'teleport-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What problem does `<Teleport>` solve, and what stays the same when you use it?',
      answer: 'It renders part of a component\'s template into another DOM location (like the end of `<body>`), so overlays escape ancestor CSS that would clip or mis-position them — `overflow: hidden`, `transform` creating a containing block for `position: fixed`, and stacking contexts limiting `z-index`. What stays the same is the component tree: props, emits, slots and provide/inject work as if the content never moved.',
      explanation: 'Logical location (who owns the UI) and visual location (where the DOM sits) are separated.',
      whyAsked: 'Modals and popovers are in every app; this checks you know the idiomatic Vue solution and why it\'s needed.',
      mistakes: ['Saying it creates a separate app or component tree.', 'Only mentioning z-index and not the transform/overflow traps.', 'Claiming it handles accessibility.'],
      followUps: ['What happens to DOM event bubbling?', 'What does the `disabled` prop do?', 'What changes with SSR?'],
      modelAnswer: 'Teleport lets a component render some of its DOM elsewhere — typically `body` or a `#modals` container. That matters for overlays because ancestor CSS can trap them: `overflow: hidden` clips, a `transform` makes `position: fixed` relative to that ancestor, and stacking contexts cap `z-index`. With Teleport the DOM escapes, but the component relationship doesn\'t change — the modal still gets props, emits to its parent and can inject values. I\'d use it for modals, toasts and menus, plus proper focus handling for accessibility.',
    },
    {
      id: 'teleport-click-outside',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A dropdown closes itself on "click outside" using `if (!root.value.contains(event.target)) close()`. After the menu was moved into a `<Teleport to="body">`, clicking any menu item closes the menu before the item\'s handler can do its job. Why, and how do you fix it?',
      answer: 'The menu\'s DOM is no longer inside `root` — it\'s under `<body>` — so `root.contains(target)` is false for clicks in the menu and they count as "outside". Keep a template ref to the teleported menu too, and treat clicks inside either the trigger root or the menu as inside.',
      explanation: 'Teleport keeps the component tree but changes DOM ancestry. Any logic based on DOM containment or bubbling must account for the moved part.',
      code: {
        lang: 'js',
        code: `const root = useTemplateRef('root')
const menu = useTemplateRef('menu')   // ref="menu" on the teleported list

function onDocumentClick(event) {
  const inside = root.value?.contains(event.target) || menu.value?.contains(event.target)
  if (!inside) close()
}`,
      },
      whyAsked: 'A very common production bug with teleported popovers. It tests whether you truly understand that the DOM moved.',
      mistakes: ['Removing the Teleport and reintroducing the clipping bug.', 'Using `event.stopPropagation()` everywhere.', 'Adding delays with `setTimeout`.'],
      followUps: ['Where should the document listener be added and removed?', 'Would `@click.stop` on the menu work, and what are its downsides?'],
      modelAnswer: 'Teleport moved the menu\'s DOM to `body`, so it\'s no longer a descendant of the dropdown\'s root element. The click-outside check uses DOM containment, so every click in the menu looks like an outside click and closes it. I\'d hold refs to both the trigger root and the teleported menu and only close when the target is outside both. The listener is added on mount and removed on unmount so it doesn\'t leak.',
    },
    {
      id: 'teleport-target-timing',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Vue warns "Failed to locate Teleport target with selector `#sidebar-actions`". The `<div id="sidebar-actions">` is rendered by the layout component. What are the possible causes and fixes?',
      answer: 'Without `defer`, the target must exist in the DOM when the Teleport mounts. Causes: the layout renders the target later in the same render than the Teleport, the target is behind a `v-if` that\'s false, it belongs to a different route\'s layout, or the selector is wrong. Fixes: add `defer` (Vue 3.5+) if the target is mounted in the same tick; move a static container into `index.html`; make sure the target is rendered unconditionally; or pass content through a slot or store instead.',
      explanation: 'Teleport resolves its target once, at mount time (or right after it with `defer`). It does not wait for a target to appear later.',
      whyAsked: 'Tests understanding of mount order and of what `defer` actually guarantees.',
      mistakes: ['Thinking `defer` waits indefinitely for the target to appear.', 'Wrapping the Teleport in `setTimeout` or `nextTick` hacks.', 'Not checking whether the target is conditionally rendered.'],
      followUps: ['What exactly does `defer` change?', 'When would a slot be a better tool than Teleport here?'],
      modelAnswer: 'Teleport looks up its target when it mounts. If the layout renders the target later in the same render pass, or behind a `v-if`, it isn\'t there yet. In Vue 3.5 I can add `defer`, which resolves the target after the current mount — like `onMounted` — but the target still has to be mounted in that same tick. If the target is static, I\'d put it in `index.html`. If it appears much later or only on some routes, Teleport is probably the wrong tool and a slot or shared state fits better.',
    },
    {
      id: 'teleport-disabled-state',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'A `<VideoPlayer>` with an internal `currentTime` ref is wrapped in `<Teleport to="body" :disabled="!fullscreen">`. The user watches to 1:30, toggles fullscreen on, then off. What is `currentTime` afterwards?',
      options: [
        '1:30 — toggling `disabled` moves the existing DOM, the instance survives',
        '0:00 — the player is re-created each time it moves',
        '0:00 after turning fullscreen on, 1:30 after turning it off',
        'It depends on whether the component uses `<KeepAlive>`',
      ],
      correctOption: 0,
      answer: 'Still 1:30. Changing `disabled` (or `to`) moves the already-rendered nodes between containers; the component instance isn\'t unmounted, so its state is preserved.',
      explanation: 'Teleport moves DOM; it doesn\'t remount components. A `v-if`/`v-else` pair rendering two separate players *would* lose the state.',
      whyAsked: 'Distinguishes knowing the API from knowing its runtime behaviour, which matters for media, maps and forms.',
      mistakes: ['Assuming any DOM move recreates the component.', 'Implementing fullscreen with two `v-if` copies of the component.', 'Reaching for KeepAlive unnecessarily.'],
      followUps: ['Would a native `<video>` element keep playing during the move?', 'How would you test this?'],
      modelAnswer: 'It stays at 1:30. When `disabled` or `to` changes, Vue moves the existing DOM nodes into the new container — it doesn\'t unmount and remount the children, so component state like `currentTime` survives. That\'s exactly why `disabled` is good for overlay-vs-inline switching. If I instead rendered two separate players with `v-if`/`v-else`, each switch would create a fresh instance and lose the state.',
    },
    {
      id: 'teleport-modal-system',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design the modal system for a large Vue app: many features open dialogs, dialogs can stack (a confirm on top of an edit form), and the app may later move to SSR.',
      answer: 'Provide one `BaseModal` component that teleports into a dedicated `#modals` container defined in `index.html` (not `body`, which is awkward with SSR). It owns the cross-cutting concerns: ARIA (`role="dialog"`, `aria-modal`, label), focus move/trap/restore, Escape closes only the top-most dialog, background scroll lock and inert content. Stacking falls out of Teleport\'s append order; track open dialogs in a small shared stack so Escape and focus apply to the top one. Feature components keep their dialog state locally (or via a composable) and pass content through slots. For SSR, use the framework\'s teleport container (e.g. in Nuxt) and keep dialogs closed on the initial render.',
      explanation: 'Teleport solves placement; everything else a modal needs belongs in one shared component so features don\'t re-implement it inconsistently.',
      whyAsked: 'A senior-level design question that tests composition, accessibility, global coordination and SSR awareness — not just the Teleport API.',
      mistakes: ['Every feature rolling its own modal markup and focus logic.', 'Putting all modal state in a global store by default.', 'Ignoring the "which modal does Escape close?" problem.', 'Targeting `body` and planning SSR later.'],
      followUps: ['Where would you store the stack of open modals?', 'How would you make background content inert?', 'How would you test focus restoration?'],
      modelAnswer: 'I\'d build one `BaseModal` that teleports to a `#modals` container in `index.html`, because a dedicated container keeps overlays together and works better with SSR than `body`. BaseModal handles accessibility in one place — dialog role and label, moving focus in, trapping it and restoring it on close, Escape, scroll lock. Teleport appends in mount order, so stacked dialogs layer naturally; a tiny shared stack tells us which dialog is on top for Escape and focus. Features keep their own `open` state and pass content through slots, so they stay decoupled. With SSR I\'d rely on the framework\'s teleport handling and render dialogs closed initially.',
    },
    {
      id: 'teleport-coding-fullscreen',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'A `MiniPlayer` component sits inside `.card`. Add a fullscreen mode: when `.toggle-fs` is clicked, the player must render in `<body>`; clicking again brings it back into `.card`. The player\'s internal state (its seconds counter) must survive both moves.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import MiniPlayer from './MiniPlayer.vue'

const fullscreen = ref(false)
</script>

<template>
  <button class="toggle-fs" @click="fullscreen = !fullscreen">Toggle fullscreen</button>
  <section class="card">
    <!-- TODO: render in <body> while fullscreen, without losing state -->
    <MiniPlayer />
  </section>
</template>`,
          'MiniPlayer.vue': `<script setup>
import { ref } from 'vue'

// stands in for a real player's playback position
const seconds = ref(0)
</script>

<template>
  <div class="player">
    <span class="time">{{ seconds }}</span>s
    <button class="tick" @click="seconds++">+1s</button>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'inline by default', code: `expect(exists('.card .player')).toBe(true)` },
        {
          name: 'fullscreen moves the player to <body>',
          code: `await click('.tick')
await click('.tick')
await click('.toggle-fs')
expect(exists('.card .player')).toBe(false)
const player = document.querySelector('body > .player')
expect(player).toBeTruthy()
expect(player.querySelector('.time').textContent).toBe('2')`,
        },
        {
          name: 'state survives the round trip',
          code: `await click('.tick')
await click('.toggle-fs')
await click(document.querySelector('body > .player .tick'))
await click('.toggle-fs')
expect(text('.card .time')).toBe('2')`,
        },
      ],
      hints: [
        'You don\'t need two copies of the player — one Teleport can switch between "here" and "there".',
        'Wrap `<MiniPlayer />` in `<Teleport to="body" :disabled="!fullscreen">`.',
      ],
      answer: 'Wrap the player in `<Teleport to="body" :disabled="!fullscreen">`. Toggling `disabled` moves the same DOM and component instance, so the counter is preserved.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import MiniPlayer from './MiniPlayer.vue'

const fullscreen = ref(false)
</script>

<template>
  <button class="toggle-fs" @click="fullscreen = !fullscreen">Toggle fullscreen</button>
  <section class="card">
    <Teleport to="body" :disabled="!fullscreen">
      <MiniPlayer />
    </Teleport>
  </section>
</template>`,
          'MiniPlayer.vue': `<script setup>
import { ref } from 'vue'

// stands in for a real player's playback position
const seconds = ref(0)
</script>

<template>
  <div class="player">
    <span class="time">{{ seconds }}</span>s
    <button class="tick" @click="seconds++">+1s</button>
  </div>
</template>`,
        },
      },
      explanation: 'A `v-if`/`v-else` pair with two `MiniPlayer`s would pass the first two tests but fail the last one: each switch creates a new instance. `disabled` moves the existing instance\'s DOM instead.',
      whyAsked: 'Short, but it reveals whether the candidate knows that Teleport moves rather than remounts — a detail that matters for media and maps.',
      mistakes: ['Rendering two players with `v-if`/`v-else`.', 'Using `document.body.appendChild` manually.', 'Lifting the player state into the parent just to survive remounts.'],
      followUps: ['How would you also lock page scroll while fullscreen?', 'How would you add an Escape shortcut to exit?'],
      modelAnswer: 'I wrap the single `MiniPlayer` in `<Teleport to="body" :disabled="!fullscreen">`. When fullscreen is off, Teleport is disabled and the player renders in the card; turning it on moves the same DOM nodes into `body`. Because nothing is unmounted, the component\'s state — here the seconds counter, in real life the playback position — survives both moves.',
    },
  ],

  takeaways: [
    '`<Teleport to="…">` renders its content into another DOM element while keeping it in the same place in the component tree.',
    'Use it for overlays trapped by ancestor CSS: `overflow: hidden`, `transform`/`filter` (which re-anchor `position: fixed`) and stacking contexts.',
    'Props, emits, slots and provide/inject are unaffected; DOM ancestry is not — descendant selectors and native event bubbling follow the real DOM.',
    'The target must exist when the Teleport mounts; `defer` (Vue 3.5+) allows targets rendered by your app in the same tick.',
    '`disabled` renders in place, and toggling it moves the DOM without losing component state.',
    'Teleport doesn\'t make a modal accessible — focus management, ARIA and Escape are still your job.',
  ],
}
