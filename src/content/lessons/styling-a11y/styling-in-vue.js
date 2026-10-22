// Lesson: Styling in Vue — scoped CSS, global CSS, CSS modules, custom properties, v-bind() in <style>.

const mainJs = `import { createApp } from 'vue'
import './styles/global.css'
import App from './App.vue'

createApp(App).mount('#app')`

const globalCss = `/* Global styles: design values + a few base rules for the whole app */
:root {
  --brand: #1d3bf0;
  --ink: #1a1a1a;
  --muted: #5b5b66;
  --radius: 10px;
  --space: 12px;
}

body {
  color: var(--ink);
}

h1 {
  letter-spacing: -0.02em;
}`

const appVue = `<script setup>
import { ref } from 'vue'
import ProductCard from './components/ProductCard.vue'

const accent = ref('#e11d48')

const products = [
  { id: 1, name: 'Trail backpack', price: 79, onSale: true },
  { id: 2, name: 'Water bottle', price: 18, onSale: false },
  { id: 3, name: 'Head torch', price: 32, onSale: false },
]
</script>

<template>
  <header class="top">
    <h1 class="title">Outdoor shop</h1>
    <label class="picker">
      Accent colour
      <input v-model="accent" type="color" class="accent-input" />
    </label>
  </header>

  <div class="grid">
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
      :accent="accent"
    />
  </div>
</template>

<style scoped>
.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space);
}

.title {
  color: var(--brand);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--space);
  margin-top: var(--space);
}
</style>`

const productCardVue = `<script setup>
defineProps({
  product: { type: Object, required: true },
  accent: { type: String, default: '#1d3bf0' },
})
</script>

<template>
  <article class="card">
    <span v-if="product.onSale" class="badge">Sale</span>
    <h2 class="title">{{ product.name }}</h2>
    <p class="price">\${{ product.price }}</p>
    <button class="buy">Add to cart</button>
  </article>
</template>

<style scoped>
.card {
  position: relative;
  padding: var(--space);
  border: 2px solid v-bind(accent);
  border-radius: var(--radius);
}

.title {
  font-size: 1.05rem;
  color: v-bind(accent);
}

.price {
  color: var(--muted);
}

.badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  background: v-bind(accent);
  color: white;
  font-size: 0.75rem;
}
</style>`

// Reads the compiled CSS the sandbox injected, so tests can check what a selector compiled to.
const CSS = `const css = [...document.querySelectorAll('style[data-sandbox-module]')].map((s) => s.textContent).join('\\n')`

export default {
  id: 'styling-in-vue',
  title: 'Styling in Vue: scoped, modules & CSS variables',
  summary: 'Keep each component\'s CSS to itself with scoped styles or CSS modules, share design values with CSS custom properties, and drive CSS from state with v-bind().',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['single-file-components', 'class-style-bindings'],
  related: ['responsive-dynamic-styles', 'design-systems', 'slots', 'v-html', 'fallthrough-attrs'],
  tags: ['css', 'scoped css', 'css modules', 'css variables', 'custom properties', 'v-bind in css', ':deep', ':slotted', ':global', 'specificity', 'useCssModule'],
  apis: [
    { name: '<style scoped>', summary: 'Limits a component\'s CSS to that component\'s own elements by adding a unique data-v-* attribute.' },
    { name: ':deep()', summary: 'Inside scoped CSS, lets a selector reach elements rendered by child components or v-html.' },
    { name: ':slotted()', summary: 'Inside a child\'s scoped CSS, targets content the parent passed in through a slot.' },
    { name: ':global()', summary: 'Inside scoped CSS, makes one rule apply globally.' },
    { name: '<style module>', summary: 'Compiles the CSS as a CSS module and exposes the hashed class names as $style in the template.' },
    { name: 'useCssModule()', summary: 'Returns the class-name object of a <style module> block inside setup().' },
    { name: 'v-bind() in CSS', summary: 'Links a CSS value to component state through a hashed CSS custom property (Vue 3.2+).' },
  ],
  docs: [
    { label: 'Vue API — SFC CSS Features (scoped, modules, v-bind)', url: 'https://vuejs.org/api/sfc-css-features.html' },
    { label: 'Vue Style Guide — Use component-scoped styling', url: 'https://vuejs.org/style-guide/rules-essential.html#use-component-scoped-styling' },
    { label: 'MDN — Using CSS custom properties', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties' },
    { label: 'MDN — Specificity', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity' },
  ],

  intro: `
CSS has one big superpower and one big problem, and they are the same thing: **every rule is global**. Write \`.title { color: red }\` anywhere and *every* element with \`class="title"\` on the page turns red.

Vue's Single-File Components give you tools to tame that:

- \`<style scoped>\` — this component's CSS only touches this component's elements.
- \`<style module>\` — *CSS modules*: class names are renamed to unique ones and handed to you as an object.
- **CSS custom properties** (often called *CSS variables*, like \`--brand\`) — shared design values that flow down the page.
- \`v-bind()\` inside \`<style>\` — a CSS value that follows your component's state.

Plus a few escape hatches — \`:deep()\`, \`:slotted()\`, \`:global()\` — for the moments a component needs to style something it doesn't own.
`,

  why: `
Picture two teammates. One builds a \`ProductCard\` with \`.title { font-size: 1rem }\`. The other builds the page header with \`.title { font-size: 2.5rem }\`. Whichever file loads last wins — and suddenly product names are huge, or the page heading is tiny. Nobody touched the other person's code, yet both broke.

\`\`\`css
/* header.css */
.title { font-size: 2.5rem; }

/* product-card.css — loaded later, silently wins */
.title { font-size: 1rem; }
\`\`\`

Old fixes were naming conventions (\`.product-card__title\`) and discipline. They work, but they depend on every person on the team getting every name right, forever.

Vue's approach: let the **build tool** guarantee isolation. You keep writing short, readable class names, and the compiler makes sure they can't collide. Then CSS custom properties give you the opposite tool — *intentional* sharing — for things like brand colours and spacing that *should* be the same everywhere.
`,

  eli15: `
Imagine every student in a school wears a name badge, and the teacher shouts instructions like "everyone called **Sam**, stand up!". With three Sams in the school, the wrong kids keep standing up. That's global CSS: \`.title\` means *every* title on the page.

\`<style scoped>\` is like giving each classroom a room number and changing the instruction to "Sam **in room 7B**, stand up". Vue quietly stamps a room number (an attribute like \`data-v-7ba5bd90\`) on every element of your component and adds the same room number to your CSS rules. Now your rules only find *your* elements.

CSS variables are the opposite: an announcement for the whole school. \`--brand: blue\` set at the top of the page is heard in every classroom — so when the school changes its colour, you change it in one place.

And \`v-bind()\` in CSS is a classroom whiteboard your JavaScript can write on: change the value in your component, and the CSS reading it updates instantly.
`,

  analogy: {
    title: 'Apartment building mail',
    body: `
A letter addressed only to "Alex" in a big apartment building could go to any Alex — that's a global class name. Add the flat number — "Alex, flat 7B" — and it reaches exactly one person. Scoped CSS adds the flat number for you.

A notice pinned in the lobby ("water off on Tuesday") is for everyone in the building — that's a CSS custom property on \`:root\`. A note slipped under *one* door overrides it for that flat — a custom property set on one element.

Sometimes the building manager needs to deliver to a flat inside *another* flat's sublet (a child component). That needs a special key — \`:deep()\`.
`,
    mapping: [
      ['a resident\'s name', 'a class name like `.title`'],
      ['the flat number', 'the `data-v-<hash>` attribute scoped CSS adds'],
      ['a lobby notice', 'a custom property on `:root`, e.g. `--brand`'],
      ['a note under one door', 'overriding a custom property on one element'],
      ['the manager\'s master key', '`:deep()` reaching into a child component'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'What `scoped` actually does',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'sfc', label: 'ProductCard.vue', note: '<style scoped>', tone: 'paper', x: 110, y: 165 },
        { id: 'tpl', label: 'Template compiler', note: 'stamps data-v-7ba5bd90', tone: 'cobalt', x: 360, y: 75 },
        { id: 'css', label: 'Style compiler', note: '.title → .title[data-v-7ba5bd90]', tone: 'acid', x: 360, y: 255 },
        { id: 'dom', label: 'Rendered DOM', note: '<h2 data-v-7ba5bd90 class="title">', tone: 'kraft', x: 630, y: 75 },
        { id: 'match', label: 'Browser matching', note: 'only elements with the stamp', tone: 'ink', x: 630, y: 255 },
      ],
      edges: [
        { from: 'sfc', to: 'tpl', label: 'template' },
        { from: 'sfc', to: 'css', label: 'styles' },
        { from: 'tpl', to: 'dom', label: 'render' },
        { from: 'css', to: 'match', label: 'stylesheet' },
        { from: 'dom', to: 'match', label: 'attribute must match', dashed: true },
      ],
      steps: [
        { focus: ['sfc'], text: 'You write ordinary CSS with short class names in a `<style scoped>` block. Nothing special in your syntax.' },
        { focus: ['sfc', 'tpl'], edges: ['sfc->tpl'], text: 'At build time Vue picks a short id for the file (shown here as `7ba5bd90`). The template compiler adds the attribute `data-v-7ba5bd90` to **every element** this component renders.' },
        { focus: ['css'], edges: ['sfc->css'], text: 'The style compiler rewrites each selector so its **last part** also requires the attribute: `.title` becomes `.title[data-v-7ba5bd90]`.' },
        { focus: ['dom'], edges: ['tpl->dom'], text: 'In the real DOM, the card\'s `<h2>` carries the stamp. The page header\'s `<h1 class="title">` carries a *different* stamp (its own component\'s id).' },
        { focus: ['match'], edges: ['css->match', 'dom->match'], text: 'The browser only applies the rule where class **and** attribute match — so the card\'s `.title` rule can never hit the header. No Shadow DOM, no runtime cost: just attributes and selectors.' },
      ],
    },
    caption: 'Scoped CSS is a compile-time trick: matching attributes on elements and selectors.',
    alt: 'Diagram: ProductCard.vue splits into its template and its styles. The template compiler stamps data-v-7ba5bd90 on every element; the style compiler rewrites .title to .title[data-v-7ba5bd90]. In the browser, the rule only matches elements that carry the same attribute.',
  },

  syntax: [
    `
#### 1. Global CSS
Plain \`.css\` files imported once (usually in \`main.js\`) and \`<style>\` blocks *without* \`scoped\` are global. Use them for resets, typography, and design values on \`:root\`.
`,
    { code: `// main.js\nimport './styles/global.css'   // applies to the whole app`, lang: 'js', title: 'main.js' },
    `
#### 2. Scoped CSS
Add \`scoped\` and the rules only match this component's elements — **plus the root element of each child component** (so a parent can position its children).
`,
    {
      code: `<template>
  <article class="card">
    <h2 class="title">Trail backpack</h2>
  </article>
</template>

<style scoped>
.card  { padding: 12px; }
.title { color: crimson; }   /* compiled: .title[data-v-7ba5bd90] */
</style>`,
      lang: 'vue',
      title: 'ProductCard.vue',
    },
    `
#### 3. Escape hatches inside scoped CSS

- \`.list :deep(.item)\` compiles to roughly \`.list[data-v-x] .item\` — for elements rendered by a child component or by \`v-html\`.
- \`:slotted(strong)\` compiles to roughly \`strong[data-v-x-s]\` — for slot content, styled from **inside the child**.
- \`:global(.toast)\` compiles to \`.toast\` — for one global rule inside a scoped block.

The old Vue 2 spellings \`>>>\`, \`/deep/\` and \`::v-deep\` are deprecated — use \`:deep()\`.
`,
    {
      callout: 'warn',
      title: ':global() takes over the whole selector',
      text: 'With the current compiler, `:global(.dark) .card` compiles to just `.dark` — everything outside the parentheses is dropped. Use `:global()` for whole rules only. To style based on an outside ancestor, you don\'t need it at all: in scoped CSS `.dark .card` compiles to `.dark .card[data-v-x]`, because only the **last** part of a selector gets the attribute.',
    },
    `
#### 4. CSS modules
\`<style module>\` renames each class to a unique name and exposes the mapping as \`$style\`. Name the module to get a different object; read it in \`<script setup>\` with \`useCssModule()\`.
`,
    {
      code: `<script setup>
import { useCssModule } from 'vue'
const classes = useCssModule('classes')   // the <style module="classes"> block
</script>

<template>
  <p :class="$style.error">Card declined</p>          <!-- class="_error_1tt0g_2" (example) -->
  <p :class="classes.hint">Try another card</p>
</template>

<style module>
.error { color: crimson; }
</style>

<style module="classes">
.hint { font-size: 0.9rem; }
</style>`,
      lang: 'vue',
      title: 'CSS modules',
    },
    `
#### 5. CSS custom properties and \`v-bind()\`
A custom property (\`--name\`) is a value the browser **inherits** down the tree. Read it with \`var(--name, fallback)\`. \`v-bind()\` connects a CSS value to a variable from \`<script setup>\`; wrap real JavaScript expressions in quotes.
`,
    {
      code: `<script setup>
import { ref } from 'vue'
const accent = ref('#e11d48')
const theme = { border: { width: '2px' } }
</script>

<style scoped>
.card {
  padding: var(--space, 12px);                 /* custom property with a fallback */
  border: v-bind('theme.border.width') solid v-bind(accent);
}
</style>`,
      lang: 'vue',
      title: 'v-bind() in <style>',
    },
    {
      callout: 'version',
      text: '`v-bind()` in `<style>` is available from Vue 3.2. `:deep()`, `:slotted()` and `:global()` are the Vue 3 syntax. All of these are features of Vue\'s SFC compiler (`@vue/compiler-sfc`, used by the official Vite plugin), not of the browser.',
    },
  ],

  walkthrough: {
    title: 'components/ProductCard.vue',
    lang: 'vue',
    code: productCardVue,
    intro: 'The card from the playground. Notice it never worries about clashing with anything else on the page.',
    steps: [
      { lines: [1, 6], text: 'Two props: the product, and an `accent` colour the parent picks. `accent` is just a string — the interesting part is how CSS uses it.' },
      { lines: [8, 15], text: 'Short, generic class names: `card`, `title`, `price`. Because the style block is scoped, the compiler adds a `data-v-…` attribute to every one of these elements.' },
      { lines: [17], text: '`scoped` — the one word that switches on isolation. The App also has a `.title`, and the two never interfere.' },
      { lines: [18, 23], text: '`var(--space)` and `var(--radius)` come from `global.css` on `:root`. Custom properties are inherited, so scoped components can read global design values freely.' },
      { lines: [21], text: '`v-bind(accent)` — the compiler turns this into `var(--<hash>-accent)` and sets that variable as an inline style on the card\'s root element. Change the colour picker and the border follows.' },
      { lines: [25, 28], text: 'Same `v-bind(accent)` reused. Vue sets the variable once on the root element; every rule that reads it updates together.' },
      { lines: [34, 43], text: 'The Sale badge is absolutely positioned inside the card (the card is `position: relative`). Its background is the accent too.' },
    ],
  },

  playground: {
    title: 'Outdoor shop cards',
    objective: 'See scoped styles, global custom properties and v-bind() working together — then reach into a child, add a CSS module and override a variable.',
    files: {
      'main.js': mainJs,
      'styles/global.css': globalCss,
      'App.vue': appVue,
      'components/ProductCard.vue': productCardVue,
    },
    expected: 'A blue **Outdoor shop** heading, a colour picker, and three product cards with a crimson border and title. Both App and ProductCard use a class called `.title`, yet each keeps its own colour. Change the colour picker: borders, titles and the **Sale** badge follow.',
    experiments: [
      {
        id: 'deep-price',
        task: 'From **App.vue only** (don\'t edit ProductCard.vue), make every price bold. First try `.grid .price { font-weight: 700; }` in App\'s scoped style — nothing happens. Then change it to use `:deep()`.',
        hint: 'Write `.grid :deep(.price) { font-weight: 700; }` inside App.vue\'s `<style scoped>`.',
        tests: [
          {
            name: 'App.vue reaches .price through :deep()',
            code: `${CSS}
expect(css).toMatch(/\\.grid\\[data-v-\\w+\\]\\s+\\.price/)`,
          },
        ],
        explain: '`.grid .price` compiled to `.grid .price[data-v-<App id>]` — but the `<p class="price">` belongs to ProductCard and carries ProductCard\'s id, so it never matched. `:deep()` moves the attribute to the part before it: `.grid[data-v-<App id>] .price`. Use this sparingly: the parent now depends on the child\'s internal class names.',
      },
      {
        id: 'module-banner',
        task: 'Add a free-shipping banner styled with a **CSS module**. In App.vue add a `<style module>` block with a `.banner` class (any styles you like), and render `<p data-test="banner" :class="$style.banner">Free shipping over $50</p>` above the grid.',
        hint: '`$style` is created automatically by `<style module>`. Its keys are your class names; its values are the unique generated names.',
        tests: [
          {
            name: 'the banner uses the generated class name from $style',
            code: `expect(exists('[data-test="banner"]')).toBe(true)
expect(vm.$style && vm.$style.banner).toBeTruthy()
expect(classes('[data-test="banner"]')).toContain(vm.$style.banner)
expect(classes('[data-test="banner"]')).not.toContain('banner')`,
          },
        ],
        explain: 'Inspect the banner: its class is something like `_banner_x1y2z_2`, not `banner`. CSS modules isolate by **renaming**, scoped CSS isolates by **adding an attribute**. Modules are handy when JavaScript needs the class name (for example to pass it to a child).',
      },
      {
        id: 'compact-var',
        task: 'Add a **Compact** checkbox with `class="compact"` to App. When it is checked, set the custom property `--space` to `6px` **on the `.grid` element** with a `:style` binding. Watch every card\'s padding shrink too.',
        hint: 'Add `const compact = ref(false)`, a checkbox with `v-model="compact"`, and on the grid: `:style="{ \'--space\': compact ? \'6px\' : null }"`.',
        tests: [
          {
            name: 'checking Compact overrides --space on .grid only while checked',
            code: `expect(exists('.compact')).toBe(true)
await check('.compact', true)
expect(find('.grid').style.getPropertyValue('--space').trim()).toBe('6px')
await check('.compact', false)
expect(find('.grid').style.getPropertyValue('--space').trim()).not.toBe('6px')`,
          },
        ],
        explain: 'Custom properties inherit. Setting `--space` on `.grid` overrides the `:root` value for that element and everything inside it — including the scoped child components — without touching their CSS. This is the foundation of theming in [Design systems](lesson:design-systems).',
      },
      {
        id: 'vbind-button',
        task: 'Make the **Add to cart** button use the accent colour as its background. Add a `.buy` rule in ProductCard.vue that uses `v-bind(accent)`, then change the colour picker. Open your browser DevTools and inspect an `<article>`: find the inline `--…-accent` custom property Vue set on it.',
        hint: '`.buy { background: v-bind(accent); color: white; }`',
        explain: 'One inline custom property on the root element feeds every rule that uses `v-bind(accent)`. The stylesheet itself never changes — only the variable\'s value does, which is cheap for the browser.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'How v-bind() in CSS stays reactive',
    props: {
      layout: 'row',
      nodes: [
        { id: 'state', label: 'accent ref', note: '\'#e11d48\'', tone: 'acid' },
        { id: 'compile', label: 'Compiler', note: 'v-bind(accent) → var(--7ba5bd90-accent)', tone: 'paper' },
        { id: 'root', label: 'Root element', note: 'style="--7ba5bd90-accent: #e11d48"', tone: 'cobalt' },
        { id: 'paint', label: 'Browser', note: 'recomputes var() users', tone: 'ink' },
      ],
      edges: [
        { from: 'state', to: 'compile', label: 'build time', dashed: true },
        { from: 'compile', to: 'root', label: 'useCssVars()' },
        { from: 'root', to: 'paint', label: 'inherit' },
      ],
      steps: [
        { focus: ['compile'], text: 'At **build time**, the compiler replaces `v-bind(accent)` with `var(--7ba5bd90-accent)` in the CSS — so the stylesheet is plain, static CSS.' },
        { focus: ['compile', 'root'], edges: ['compile->root'], text: 'It also injects a small helper (`useCssVars`) into the component\'s setup. After mounting, the helper sets the custom property as an **inline style** on the component\'s root element(s).' },
        { focus: ['state', 'root'], text: 'The helper runs inside a reactive effect that reads `accent`. When `accent.value` changes, Vue re-runs it after the update and writes the new value to the inline style.' },
        { focus: ['root', 'paint'], edges: ['root->paint'], text: 'The browser sees a changed custom property and recomputes every declaration that uses it — border, title and badge update together.' },
      ],
    },
    caption: 'Static CSS + one reactive inline custom property per bound value.',
    alt: 'Four boxes in a row: the accent ref; the compiler rewriting v-bind(accent) into var(--7ba5bd90-accent); the component root element with an inline style setting that custom property; the browser recomputing every declaration that uses it.',
  },

  internals: {
    beginner: `
Scoped CSS is not magic isolation like an iframe. It is two small edits made when your app is built: every element in the component gets an extra attribute (a "stamp"), and every CSS rule in the component is changed to require that stamp. CSS modules use a different edit: they rename your classes to unique names. CSS custom properties are a normal browser feature that Vue simply takes advantage of.
`,
    technical: [
      `
**Scoped styles.** \`@vue/compiler-sfc\` assigns the file a short id. The template compiler emits that id as a *scope id*, and the renderer sets \`data-v-<id>\` on each element the component creates. The style compiler runs a PostCSS plugin that appends \`[data-v-<id>]\` to the **last compound selector** of every rule:
`,
      {
        code: `/* you write */                 /* compiled */
.card .title { }                 .card .title[data-v-7ba5bd90] { }
.card :deep(.price) { }          .card[data-v-7ba5bd90] .price { }
:slotted(strong) { }             strong[data-v-7ba5bd90-s] { }
:global(.toast) { }              .toast { }`,
        lang: 'css',
        title: 'selector rewriting',
      },
      `
**Child roots.** When a component renders a child component, the renderer also applies the **parent's** scope id to the child's *root* element. That's why a parent can write \`.grid > .card\` for layout — and why a parent's \`.title\` rule can unexpectedly hit a child whose root has \`class="title"\`. Elements *inside* the child don't get the parent's id.

**Slots and v-html.** Slot content is compiled by the parent, so it carries the parent's id. When the child's styles use \`:slotted()\`, the compiler also marks slot content with \`data-v-<child id>-s\`. Markup injected with \`v-html\` never passes through the template compiler, so it has no stamp at all — only \`:deep()\`, CSS modules or global rules can reach it.

**CSS modules.** The style block is processed with CSS-modules rules: each class becomes a generated name, and the mapping \`{ banner: '_banner_x1y2z_2' }\` is attached to the component. \`$style\` in templates and \`useCssModule(name)\` in setup both read that mapping.

**v-bind().** The compiler collects every \`v-bind(expr)\`, rewrites it to \`var(--<id>-<name>)\` (a shorter hash in production), and injects a \`useCssVars()\` call that, after mount and after each update, sets those properties as inline styles on the component's root element(s).
`,
    ],
    production: `
- **Default to scoped styles** for component CSS; keep global CSS for resets, typography, \`:root\` tokens and third-party overrides you deliberately centralise.
- **Specificity grows by one attribute.** \`.btn[data-v-x]\` (0,2,0) beats a global \`.btn\` (0,1,0) regardless of load order. When overriding library components, prefer the library's custom properties or documented class hooks over \`:deep()\` chains and \`!important\`.
- **Don't depend on cross-file source order.** Lazily loaded route chunks bring their own CSS when they load, so the order of rules from different files can differ between pages. Rely on scoping and specificity, not on "this file loads later".
- **Prefer classes to element selectors** in scoped CSS: the Vue docs note that a selector like \`p { }\` combined with an attribute is slower for the browser to match than a class, and descendant element selectors also leak into recursive children.
- **\`:deep()\` is a coupling smell.** Every \`:deep(.child-internal)\` means the parent breaks if the child renames a class. Give children props, slots or custom properties as their styling API instead.
- **Keep \`v-bind()\` for a handful of truly dynamic values** (a user-chosen colour, a measured size). For themes, set custom properties high in the tree once rather than per component.
`,
  },

  mistakes: [
    {
      title: 'Styling a child component\'s insides from the parent without :deep()',
      wrong: { code: `<!-- App.vue -->\n<style scoped>\n.grid .price { font-weight: 700; } /* never matches */\n</style>`, lang: 'vue' },
      right: { code: `<!-- App.vue -->\n<style scoped>\n.grid :deep(.price) { font-weight: 700; }\n</style>`, lang: 'vue' },
      explanation: 'Scoped rules require *this* component\'s stamp on the last element in the selector. Elements inside a child carry the child\'s stamp. `:deep()` moves the stamp requirement to the part before it. Better still: give the child a prop or custom property so the parent doesn\'t depend on its internals.',
    },
    {
      title: 'Expecting scoped styles to apply to v-html content',
      wrong: { code: `<div class="article" v-html="html"></div>\n\n<style scoped>\n.article p { line-height: 1.7; }\n</style>`, lang: 'vue' },
      right: { code: `<div class="article" v-html="html"></div>\n\n<style scoped>\n.article :deep(p) { line-height: 1.7; }\n</style>`, lang: 'vue' },
      explanation: 'HTML injected with `v-html` is never processed by the template compiler, so it has no `data-v-…` attribute. Use `:deep()` from a scoped wrapper, or a CSS module/global class. (And only `v-html` content you trust — see [v-html](lesson:v-html).)',
    },
    {
      title: 'Using :global() for "global ancestor + scoped element"',
      wrong: { code: `<style scoped>\n:global(.theme-dark) .card { background: #111; }\n/* compiles to: .theme-dark { background: #111 } — the whole wrapper turns dark */\n</style>`, lang: 'vue' },
      right: { code: `<style scoped>\n.theme-dark .card { background: #111; }\n/* compiles to: .theme-dark .card[data-v-x] */\n</style>`, lang: 'vue' },
      explanation: 'Only the last part of a scoped selector gets the attribute, so an outside ancestor like `.theme-dark` already works. `:global()` is for making a whole rule global — anything outside its parentheses is dropped.',
    },
    {
      title: 'Using the deprecated Vue 2 deep selectors',
      wrong: { code: `.list >>> .item { }\n.list /deep/ .item { }\n.list ::v-deep .item { }`, lang: 'css' },
      right: { code: `.list :deep(.item) { }`, lang: 'css' },
      explanation: 'Vue 3 supports `:deep()` as the pseudo-class form. The combinator forms are deprecated and produce compiler warnings — replace them when you migrate.',
    },
    {
      title: 'Element selectors everywhere in scoped CSS',
      wrong: { code: `<style scoped>\np { margin: 0; }\nli span { color: gray; }\n</style>`, lang: 'vue' },
      right: { code: `<style scoped>\n.intro { margin: 0; }\n.item-meta { color: gray; }\n</style>`, lang: 'vue' },
      explanation: 'Scoping doesn\'t remove the need for classes. Element selectors combined with attributes are more work for the browser, and descendant selectors like `li span` also match inside recursive child components that render the same component.',
    },
  ],

  debugging: [
    {
      symptom: 'A rule in the parent has no effect on an element rendered by a child component.',
      cause: 'The element carries the child\'s `data-v-…` attribute, not the parent\'s, so the parent\'s scoped selector can\'t match it.',
      fix: 'Use `:deep()` from the parent, or better, expose a prop / slot / custom property on the child. Inspect the element in DevTools to see which `data-v-…` attributes it has.',
    },
    {
      symptom: 'A parent\'s style unexpectedly changes a child component\'s outer element.',
      cause: 'A child\'s **root** element receives the parent\'s scope attribute too (by design, for layout). A shared class like `.title` on the child root matches the parent\'s rule.',
      fix: 'Rename the class on one side, or target it more precisely (`.header > .title`). Avoid generic class names on component roots.',
    },
    {
      symptom: 'Your override of a library component\'s style loses (or wins) unpredictably.',
      cause: 'Specificity and load order: scoped selectors gain an attribute (+1 class-level specificity), library CSS may be more specific, and lazy chunks change load order.',
      fix: 'Inspect the element\'s Styles panel to see which rule wins and why. Prefer the library\'s CSS variables or documented classes; use `:deep()` with the minimum specificity needed; avoid `!important`.',
    },
    {
      symptom: '`$style.banner` is `undefined` in the template.',
      cause: 'The class isn\'t defined in a `<style module>` block, there\'s a typo, or the module is named (`<style module="classes">`), which exposes `classes` instead of `$style`.',
      fix: 'Check the class name and the module name; in `<script setup>` log `useCssModule(\'classes\')` to see the mapping.',
    },
    {
      symptom: 'A `v-bind()` value in CSS doesn\'t update when you change the variable.',
      cause: 'The variable isn\'t reactive (a plain `const` or `let`), or you are binding a different name than you change.',
      fix: 'Make it a `ref`/`computed`/prop. In DevTools, the component\'s root element should show an inline `--<hash>-name` property that changes as you interact.',
    },
  ],

  bestPractices: [
    'Make `scoped` the default for component styles; keep a small, deliberate global stylesheet.',
    'Put design values (colours, spacing, radii, fonts) in custom properties on `:root`, and read them everywhere with `var()`.',
    'Prefer a component styling API — props, slots, custom properties — over parents reaching in with `:deep()`.',
    'Use classes, not bare element selectors, in scoped styles.',
    'Avoid generic class names (`.title`, `.wrapper`) on component **root** elements, because the parent\'s scoped CSS can match them.',
    'Reach for CSS modules when JavaScript needs class names, or when you want isolation by renaming.',
    'Keep `v-bind()` for values that genuinely change at runtime; static values belong in plain CSS or tokens.',
  ],

  useCases: [
    'Component libraries and app components that must not leak styles into each other (`scoped`).',
    'Brand colours, spacing and radii shared by every component (`:root` custom properties).',
    'A user-picked accent colour or a progress percentage feeding CSS (`v-bind()` or inline custom properties).',
    'Styling markdown or CMS HTML rendered with `v-html` from a scoped wrapper (`:deep()`).',
    'A card component styling the headings its parent puts in its slot (`:slotted()`).',
    'Passing a generated class name to a third-party component prop (`useCssModule()`).',
  ],

  whenToUse: {
    use: [
      '`scoped` for nearly all component-specific CSS.',
      'Global CSS for resets, base typography, `:root` tokens and intentional app-wide rules.',
      'Custom properties for any value that should be consistent or themeable.',
      '`v-bind()` when a CSS value is derived from component state.',
    ],
    avoid: [
      '`:deep()` as a habit — it couples parents to children\'s internals.',
      '`:global()` inside scoped blocks for big chunks of CSS — use a normal `<style>` block or a global file.',
      '`!important` to win specificity fights — fix the selector or use the component\'s styling hooks.',
      '`v-bind()` for values that never change — it adds a runtime effect for nothing.',
    ],
  },

  comparison: {
    title: 'Ways to style a Vue component',
    headers: ['', 'Global CSS', '`<style scoped>`', '`<style module>`', 'Custom properties'],
    rows: [
      ['Isolation', 'none — every rule is page-wide', 'attribute added to selectors', 'class names renamed', 'none — inherited on purpose'],
      ['How you apply it', '`class="title"`', '`class="title"`', '`:class="$style.title"`', '`var(--name)` in CSS'],
      ['Reaches child internals?', 'yes (everything)', 'only with `:deep()`', 'yes, if you pass the class down', 'yes, by inheritance'],
      ['Changes at runtime?', 'no', 'no (use `v-bind()`)', 'no (swap classes instead)', 'yes — set them via `:style` or `v-bind()`'],
      ['Best for', 'resets, typography, tokens', 'everyday component CSS', 'class names needed in JS', 'theming and shared design values'],
    ],
    note: 'They combine well: scoped component CSS that reads global custom properties is the most common setup. Next: [responsive & dynamic styling](lesson:responsive-dynamic-styles).',
  },

  quiz: [
    {
      id: 'styling-in-vue-q1',
      type: 'mcq',
      prompt: 'What does adding `scoped` to a `<style>` block actually do?',
      options: [
        { text: 'It adds a unique `data-v-…` attribute to the component\'s elements and requires it in each selector.' },
        { text: 'It renders the component inside Shadow DOM.', why: 'Vue doesn\'t use Shadow DOM for scoped styles; the elements stay in the normal DOM. (Custom elements built with `defineCustomElement` are a separate feature.)' },
        { text: 'It renames every class to a random name.', why: 'That is what CSS modules (`<style module>`) do. Scoped CSS keeps your class names.' },
        { text: 'It stops global CSS from affecting the component.', why: 'Global rules still apply to scoped components. Scoping only limits *your* rules, it doesn\'t block others.' },
      ],
      answer: 0,
      explanation: 'Scoped CSS is a compile-time rewrite: elements get `data-v-<id>`, selectors get `[data-v-<id>]` on their last part.',
    },
    {
      id: 'styling-in-vue-q2',
      type: 'output',
      prompt: 'This rule is in a component\'s `<style scoped>` and the component id is `7ba5bd90`. What CSS does the compiler produce?',
      code: { lang: 'css', code: `.list :deep(.item) {\n  padding: 4px;\n}` },
      options: [
        '.list .item[data-v-7ba5bd90] { padding: 4px; }',
        '.list[data-v-7ba5bd90] .item { padding: 4px; }',
        '.list .item { padding: 4px; }',
        '.list[data-v-7ba5bd90] .item[data-v-7ba5bd90] { padding: 4px; }',
      ],
      answer: 1,
      explanation: '`:deep()` moves the attribute to the selector part just before it. `.item` itself no longer needs the stamp, so it matches elements inside child components.',
    },
    {
      id: 'styling-in-vue-q3',
      type: 'bug',
      prompt: 'The welcome paragraph never gets the bigger font. Click the line that causes the problem.',
      code: {
        lang: 'vue',
        code: `<script setup>
const html = '<p class="lead">Welcome back!</p>'
</script>

<template>
  <div class="article" v-html="html"></div>
</template>

<style scoped>
.article .lead {
  font-size: 1.25rem;
}
</style>`,
      },
      answerLine: 10,
      explanation: 'The selector compiles to `.article .lead[data-v-x]`, but `v-html` content is not processed by the template compiler, so `<p class="lead">` has no stamp. Write `.article :deep(.lead)`.',
    },
    {
      id: 'styling-in-vue-q4',
      type: 'fill',
      prompt: 'Fill the blanks: the border should follow the `accent` ref, and the paragraph should use the CSS-module class `error`.',
      code: {
        lang: 'vue',
        code: `<template>
  <p :class="___.error">Payment failed</p>
</template>

<style module>
.error { border: 2px solid ___(accent); }
</style>`,
      },
      answer: [['$style'], ['v-bind']],
      explanation: '`<style module>` exposes `$style` in the template. `v-bind(accent)` links the CSS value to the component variable through a hashed custom property.',
    },
    {
      id: 'styling-in-vue-q5',
      type: 'mcq',
      prompt: 'A parent\'s scoped CSS has `.title { color: red }`. Its child component\'s template is `<h3 class="title">…</h3>` (a single root). Does the child\'s heading turn red?',
      options: [
        { text: 'Yes — a child component\'s root element also receives the parent\'s scope attribute.' },
        { text: 'No — scoped styles never affect child components.', why: 'They don\'t affect elements *inside* a child, but the child\'s root element is deliberately affected so parents can lay out children.' },
        { text: 'Only if the child\'s style is also scoped.', why: 'The child\'s own styles don\'t matter here; the renderer applies the parent\'s scope id to the child root either way.' },
        { text: 'Only with `:deep(.title)`.', why: '`:deep()` is needed for elements *inside* the child, not for its root.' },
      ],
      answer: 0,
      explanation: 'The child\'s root carries both ids. That\'s useful for layout (`.grid > .card`) and a classic source of surprise with generic class names.',
    },
    {
      id: 'styling-in-vue-q6',
      type: 'mcq',
      prompt: 'Select **all** true statements about CSS custom properties (e.g. `--space`).',
      options: [
        { text: 'They are inherited by descendant elements.' },
        { text: 'A value set on one element overrides the `:root` value for that element\'s subtree.' },
        { text: 'They only work inside `<style scoped>`.', why: 'They are a standard browser feature and work in any CSS — global, scoped or modules.' },
        { text: 'Vue\'s `:style` binding can set them, e.g. `:style="{ \'--space\': \'6px\' }"`.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Custom properties are plain CSS: inherited, overridable per subtree, and settable from Vue with `:style` — which is what makes them the backbone of theming.',
    },
    {
      id: 'styling-in-vue-q7',
      type: 'short',
      prompt: 'In two or three sentences: when would you pick `<style module>` instead of `<style scoped>`?',
      answer: 'When JavaScript needs the class names — for example to pass a class to a child or third-party component, or to build class lists in a render function — or when you prefer isolation by renaming classes instead of adding attributes. Scoped CSS stays simpler for everyday templates because you write plain class names.',
    },
  ],

  exercises: [
    {
      id: 'css-var-progress',
      title: 'A progress bar driven by CSS custom properties',
      difficulty: 'intermediate',
      prompt: `
Finish \`ProgressBar.vue\` so its look is controlled by **CSS custom properties** set from props.

- Props: \`value\` (number) and \`color\` (string, default \`'#1d3bf0'\`).
- The root element is \`<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100">\` with \`aria-valuenow\` set to the value.
- **Clamp** the value to the range 0–100 (150 → 100, −5 → 0) everywhere you use it.
- On the root, set two custom properties with a \`:style\` binding: \`--progress\` (e.g. \`'40%'\`) and \`--bar-color\` (the colour).
- Inside, render \`<div class="fill"></div>\`. In a **scoped** style block, give \`.fill\` \`width: var(--progress)\` and \`background: var(--bar-color)\`.

(\`v-bind()\` in CSS would also work in the browser. Here we use inline custom properties on purpose: their names are readable, so other CSS — like a theme — can use or override them.)
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import ProgressBar from './ProgressBar.vue'

const done = ref(40)
</script>

<template>
  <label>
    Upload progress
    <input v-model.number="done" type="range" min="0" max="100" class="slider" />
  </label>
  <ProgressBar :value="done" color="#0f9d58" />
</template>`,
        'ProgressBar.vue': `<script setup>
// TODO: props, clamping and the custom properties
</script>

<template>
  <div class="progress">
    <div class="fill" style="width: 40%"></div>
  </div>
</template>

<style>
.progress { height: 12px; border: 2px solid #1a1a1a; border-radius: 999px; overflow: hidden; }
.fill { height: 100%; background: #1d3bf0; }
</style>`,
      },
      hints: [
        'Declare the props with `defineProps` and create `const clamped = computed(() => Math.min(100, Math.max(0, props.value)))`.',
        'Bind `:style="{ \'--progress\': clamped + \'%\', \'--bar-color\': color }"` on the root and `:aria-valuenow="clamped"`.',
        'Change `<style>` to `<style scoped>` and replace the hard-coded width and background in `.fill` with `var(--progress)` and `var(--bar-color)`. Remove the inline `style` on `.fill`.',
      ],
      solution: {
        explanation: 'The component turns props into two custom properties on its root, and its scoped CSS reads them. JavaScript decides *values*; CSS decides *how they look*. Clamping in one `computed` keeps the width and the ARIA value in agreement.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import ProgressBar from './ProgressBar.vue'

const done = ref(40)
</script>

<template>
  <label>
    Upload progress
    <input v-model.number="done" type="range" min="0" max="100" class="slider" />
  </label>
  <ProgressBar :value="done" color="#0f9d58" />
</template>`,
          'ProgressBar.vue': `<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },
  color: { type: String, default: '#1d3bf0' },
})

const clamped = computed(() => Math.min(100, Math.max(0, props.value)))
</script>

<template>
  <div
    class="progress"
    role="progressbar"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="clamped"
    :style="{ '--progress': clamped + '%', '--bar-color': color }"
  >
    <div class="fill"></div>
  </div>
</template>

<style scoped>
.progress {
  height: 12px;
  border: 2px solid #1a1a1a;
  border-radius: 999px;
  overflow: hidden;
}

.fill {
  height: 100%;
  width: var(--progress);
  background: var(--bar-color);
  transition: width 0.2s ease;
}
</style>`,
        },
      },
      tests: [
        {
          name: 'sets --progress from the value',
          code: `const bar = mountFile('ProgressBar.vue', { value: 40 })
expect(bar.find('.progress').style.getPropertyValue('--progress').trim()).toBe('40%')`,
        },
        {
          name: 'clamps to 0–100 (also in aria-valuenow)',
          code: `const high = mountFile('ProgressBar.vue', { value: 150 })
expect(high.find('.progress').style.getPropertyValue('--progress').trim()).toBe('100%')
expect(high.find('.progress').getAttribute('aria-valuenow')).toBe('100')
const low = mountFile('ProgressBar.vue', { value: -5 })
expect(low.find('.progress').style.getPropertyValue('--progress').trim()).toBe('0%')`,
        },
        {
          name: 'sets --bar-color from the color prop',
          code: `const bar = mountFile('ProgressBar.vue', { value: 10, color: '#e11d48' })
expect(bar.find('.progress').style.getPropertyValue('--bar-color').trim()).toBe('#e11d48')`,
        },
        {
          name: 'has progressbar semantics',
          code: `const bar = mountFile('ProgressBar.vue', { value: 25 })
const el = bar.find('.progress')
expect(el.getAttribute('role')).toBe('progressbar')
expect(el.getAttribute('aria-valuemin')).toBe('0')
expect(el.getAttribute('aria-valuemax')).toBe('100')
expect(el.getAttribute('aria-valuenow')).toBe('25')`,
        },
        {
          name: 'updates when the value changes',
          code: `const bar = mountFile('ProgressBar.vue', { value: 10 })
await bar.setProps({ value: 75 })
expect(bar.find('.progress').style.getPropertyValue('--progress').trim()).toBe('75%')`,
        },
        {
          name: 'the styles are scoped',
          code: `const bar = mountFile('ProgressBar.vue', { value: 10 })
expect(bar.find('.fill').getAttributeNames().some((n) => n.startsWith('data-v-'))).toBe(true)`,
        },
      ],
    },
    {
      id: 'deep-and-slotted',
      title: 'Style content you don\'t render yourself',
      difficulty: 'intermediate',
      prompt: `
Two rules in this project are written correctly as CSS but **never match**. Fix them without removing \`scoped\` from either component.

1. In \`NoticeCard.vue\`, the rule meant for \`<strong>\` elements the **parent passes into the slot** must use \`:slotted()\`.
2. In \`App.vue\`, the rule meant for the \`.lead\` paragraph inside the \`v-html\` content must use \`:deep()\` from the \`.article\` wrapper (\`.article :deep(.lead)\`).

Keep the class names and markup as they are (\`.notice\`, \`.article\`, \`.lead\`, the \`<strong>\` in the slot). The tests read the compiled CSS, so they check what your selectors become.
`,
      files: {
        'App.vue': `<script setup>
import NoticeCard from './NoticeCard.vue'

// Trusted, static HTML (imagine it came from your own CMS)
const html = '<p class="lead">Spring sale starts Monday.</p><p>All tents are 20% off.</p>'
</script>

<template>
  <NoticeCard>
    <strong>Heads up:</strong> delivery takes 3–5 days.
  </NoticeCard>

  <div class="article" v-html="html"></div>
</template>

<style scoped>
.article .lead {
  font-size: 1.25rem;
  font-weight: 700;
}
</style>`,
        'NoticeCard.vue': `<template>
  <section class="notice">
    <slot />
  </section>
</template>

<style scoped>
.notice {
  padding: 12px;
  border-left: 4px solid #f59e0b;
  background: #fffbeb;
}

strong {
  color: #b45309;
}
</style>`,
      },
      hints: [
        'Slot content is compiled by the parent, so it carries the parent\'s scope attribute — the child\'s `strong` rule needs a special form to reach it.',
        'In NoticeCard.vue write `:slotted(strong) { … }`.',
        'In App.vue change the selector to `.article :deep(.lead)`.',
      ],
      solution: {
        explanation: '`:slotted(strong)` compiles to `strong[data-v-<child>-s]`, and the compiler marks slot content with that `-s` attribute. `.article :deep(.lead)` compiles to `.article[data-v-<app>] .lead`, which no longer needs the stamp that `v-html` content lacks.',
        files: {
          'App.vue': `<script setup>
import NoticeCard from './NoticeCard.vue'

// Trusted, static HTML (imagine it came from your own CMS)
const html = '<p class="lead">Spring sale starts Monday.</p><p>All tents are 20% off.</p>'
</script>

<template>
  <NoticeCard>
    <strong>Heads up:</strong> delivery takes 3–5 days.
  </NoticeCard>

  <div class="article" v-html="html"></div>
</template>

<style scoped>
.article :deep(.lead) {
  font-size: 1.25rem;
  font-weight: 700;
}
</style>`,
          'NoticeCard.vue': `<template>
  <section class="notice">
    <slot />
  </section>
</template>

<style scoped>
.notice {
  padding: 12px;
  border-left: 4px solid #f59e0b;
  background: #fffbeb;
}

:slotted(strong) {
  color: #b45309;
}
</style>`,
        },
      },
      tests: [
        {
          name: 'NoticeCard targets slotted <strong> with :slotted()',
          code: `${CSS}
expect(css).toMatch(/strong\\[data-v-\\w+-s\\]/)`,
        },
        {
          name: 'App reaches .lead inside v-html with :deep()',
          code: `${CSS}
expect(css).toMatch(/\\.article\\[data-v-\\w+\\]\\s+\\.lead/)`,
        },
        {
          name: 'the markup is unchanged',
          code: `expect(exists('.notice strong')).toBe(true)
expect(text('.article .lead')).toBe('Spring sale starts Monday.')`,
        },
        {
          name: 'both style blocks are still scoped',
          code: `// .notice is NoticeCard's root: it carries App's scope id AND its own
expect(find('.notice').getAttributeNames().filter((n) => /^data-v-\\w+$/.test(n)).length).toBe(2)
expect(find('.article').getAttributeNames().some((n) => n.startsWith('data-v-'))).toBe(true)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'styling-in-vue-how-scoped-works',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How does `<style scoped>` work in a Vue Single-File Component?',
      answer: 'At build time the SFC compiler gives the component an id. Every element the component renders gets a `data-v-<id>` attribute, and every selector in the scoped block is rewritten so its last part requires that attribute (`.title` → `.title[data-v-<id>]`). It\'s attribute-based scoping in the normal DOM — not Shadow DOM.',
      explanation: 'Two matching edits — one on elements, one on selectors — make the rules unable to match other components\' elements.',
      code: { lang: 'css', code: `/* source */ .card .title { color: red; }\n/* output */ .card .title[data-v-7ba5bd90] { color: red; }` },
      whyAsked: 'It reveals whether you know scoped CSS\'s real limits (child roots, v-html, specificity) instead of treating it as perfect isolation.',
      mistakes: ['Saying Vue uses Shadow DOM.', 'Saying scoped styles rename classes (that\'s CSS modules).', 'Not knowing that child root elements also get the parent\'s attribute.'],
      followUps: ['Why does a parent\'s scoped style affect a child\'s root element?', 'How do you style v-html content from a scoped block?', 'How does scoping change specificity?'],
      modelAnswer: 'Scoped CSS is a compile-time transform. The compiler assigns the component an id, stamps `data-v-<id>` on every element it renders, and appends `[data-v-<id>]` to the last compound selector of each rule. So `.title` only matches titles rendered by that component. Two consequences I keep in mind: a child component\'s root element also gets the parent\'s attribute, which is great for layout but can surprise you with generic class names; and content that never goes through the template compiler, like `v-html`, has no attribute, so I need `:deep()` there. It also adds one attribute selector of specificity.',
    },
    {
      id: 'styling-in-vue-child-root',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'Parent.vue has `<style scoped> .label { font-weight: 700 } </style>` and renders `<Badge />`. Badge.vue\'s template is `<span class="label"><b class="label">New</b></span>`. Which elements become bold through the parent\'s rule?',
      code: { lang: 'vue', code: `<!-- Badge.vue -->\n<template>\n  <span class="label"><b class="label">New</b></span>\n</template>` },
      options: ['Neither', 'Only the outer <span>', 'Only the inner <b>', 'Both'],
      correctOption: 1,
      answer: 'Only the outer `<span>`: it\'s Badge\'s root element, so it carries Parent\'s scope attribute as well as Badge\'s. The inner `<b>` only carries Badge\'s attribute. (The `<b>` element is bold by default anyway — but not because of the parent\'s rule.)',
      explanation: 'Vue intentionally applies the parent scope id to the child\'s root so parents can size and position children.',
      whyAsked: 'Tests precise knowledge of scoping boundaries — a common source of "why is my style leaking?" bugs.',
      mistakes: ['Answering "neither" because "scoped never affects children".', 'Answering "both" because the class names match.'],
      followUps: ['How would you style the inner element from the parent?', 'What changes if Badge has multiple root nodes?'],
      modelAnswer: 'Only the span. A child\'s root element gets both its own scope attribute and the parent\'s, so the parent\'s `.label[data-v-parent]` matches it. Everything deeper only has the child\'s attribute, so I\'d need `:deep(.label)` — or better, a prop on Badge — to reach the inner element.',
    },
    {
      id: 'styling-in-vue-markdown-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A blog page renders sanitized markdown with `<div class="post" v-html="body" />`. The scoped rules `.post h2 { … }` and `.post code { … }` have no effect, but the same rules work when pasted into a global stylesheet. What\'s going on and how do you fix it?',
      answer: 'The scoped rules compile to `.post h2[data-v-x]` and `.post code[data-v-x]`. The markdown HTML is injected at runtime with `v-html`, never compiled as a template, so its elements have no `data-v-x` attribute. Fix with `.post :deep(h2)` and `.post :deep(code)` — keeping `.post` scoped — or style the content with a CSS module class / dedicated global "prose" stylesheet.',
      explanation: 'Global rules have no attribute requirement, which is why they "work". `:deep()` drops the requirement only for the inner part.',
      whyAsked: 'Rendering CMS/markdown content is common, and this bug confuses many developers.',
      mistakes: ['Removing `scoped` from the whole block (leaks every rule globally).', 'Adding `!important` (it doesn\'t help — the selector doesn\'t match at all).', 'Forgetting to sanitize untrusted HTML.'],
      followUps: ['How would you share these "prose" styles across several components?', 'Why must the HTML be sanitized?'],
      modelAnswer: 'The selectors don\'t match: scoped CSS requires the component\'s data attribute on the last element, and `v-html` content never gets it because it bypasses the template compiler. I\'d write `.post :deep(h2)` so only the wrapper needs the attribute. If several pages render markdown, I\'d move those rules into one shared prose stylesheet or CSS-module class. And `v-html` must only receive trusted or sanitized HTML.',
    },
    {
      id: 'styling-in-vue-modules-vs-scoped',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare scoped CSS, CSS modules and global CSS in a Vue app. When do you use each?',
      answer: 'Scoped CSS adds an attribute to elements and selectors; you keep plain class names — the default for component styles. CSS modules rename classes and expose a mapping (`$style`, `useCssModule()`) — useful when JavaScript needs class names, e.g. to pass to children or third-party components. Global CSS has no isolation — for resets, typography, `:root` tokens and deliberate app-wide rules.',
      explanation: 'Attribute isolation vs renaming isolation vs no isolation. Most apps use scoped + global tokens, and modules where class names travel through JS.',
      whyAsked: 'Checks that you can justify styling choices rather than just following one habit.',
      mistakes: ['Claiming CSS modules and scoped CSS are identical.', 'Putting everything in global CSS "because it\'s simpler".', 'Not mentioning custom properties for shared values.'],
      followUps: ['How does each approach affect specificity?', 'How would you theme components built with each approach?'],
      modelAnswer: 'Scoped CSS is my default: plain class names, and the compiler adds a data attribute so rules can\'t leak — with the caveats of child roots and v-html. CSS modules isolate by renaming, which I pick when I need class names in JavaScript, like passing a class prop to a third-party component or building classes in a render function. Global CSS is for resets, typography and design tokens on `:root`. For anything shared or themeable I use custom properties, which cross component boundaries on purpose.',
    },
    {
      id: 'styling-in-vue-override-library',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Your team uses a third-party component library. Designers want the library\'s date picker header to use your brand colour. One developer wrote `.page :deep(.dp__header) { background: blue !important; }` in many components. What would you recommend?',
      answer: 'First check whether the library exposes a theming API — CSS custom properties, props or documented classes — and set the brand value once (often on `:root` or a wrapper). If you must override internals, do it in one place (a single global override stylesheet or one wrapper component), with the minimum specificity needed and no `!important`. Repeated `:deep()` into private class names couples every page to the library\'s internals, breaks on upgrades, and makes specificity fights worse.',
      explanation: 'Centralise and use the supported API; treat internal class names as private.',
      whyAsked: 'Shows judgement about maintainability and upgrade risk, not just CSS syntax.',
      mistakes: ['Approving the `!important` approach because it works today.', 'Forking the library to change one colour.', 'Not considering library upgrades.'],
      followUps: ['How would you detect breakage when the library is upgraded?', 'How do CSS custom properties help library theming?'],
      modelAnswer: 'I\'d look for the library\'s supported styling hooks first — most expose CSS variables or theme options — and set our brand token there once. If an internal override is unavoidable, I\'d wrap the date picker in one `AppDatePicker` component and keep a single, low-specificity `:deep()` override there, with a comment about the library version. Scattering `:deep(.internal-class) !important` across pages creates hidden coupling to private class names; every upgrade becomes a hunt. Visual regression tests or a component story would catch breakage on upgrade.',
    },
    {
      id: 'styling-in-vue-theme-provider',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement `ThemeProvider.vue`: it takes a `theme` prop (an object such as `{ primary: \'#1d3bf0\', surface: \'#ffffff\' }`) and renders `<div class="theme">` with **one CSS custom property per key**, named `--color-<key>`, plus a default slot. App.vue already toggles between a light and dark theme with a `.toggle-theme` button.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import ThemeProvider from './ThemeProvider.vue'

const light = { primary: '#1d3bf0', surface: '#ffffff', text: '#1a1a1a' }
const dark = { primary: '#8ab4ff', surface: '#111318', text: '#f5f5f5' }

const isDark = ref(false)
const theme = computed(() => (isDark.value ? dark : light))
</script>

<template>
  <ThemeProvider :theme="theme">
    <div class="panel">
      <p>Account settings</p>
      <button class="toggle-theme" @click="isDark = !isDark">
        {{ isDark ? 'Light mode' : 'Dark mode' }}
      </button>
    </div>
  </ThemeProvider>
</template>

<style scoped>
.panel {
  padding: 16px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 2px solid var(--color-primary);
}
</style>`,
          'ThemeProvider.vue': `<script setup>
defineProps({
  theme: { type: Object, required: true },
})
</script>

<template>
  <div class="theme">
    <slot />
  </div>
</template>`,
        },
      },
      tests: [
        {
          name: 'sets one --color-* property per theme key',
          code: `const s = find('.theme').style
expect(s.getPropertyValue('--color-primary').trim()).toBe('#1d3bf0')
expect(s.getPropertyValue('--color-surface').trim()).toBe('#ffffff')
expect(s.getPropertyValue('--color-text').trim()).toBe('#1a1a1a')`,
        },
        {
          name: 'switching theme updates the properties',
          code: `await click('.toggle-theme')
expect(find('.theme').style.getPropertyValue('--color-surface').trim()).toBe('#111318')
expect(find('.theme').style.getPropertyValue('--color-primary').trim()).toBe('#8ab4ff')`,
        },
        {
          name: 'works for any key (not hard-coded)',
          code: `const t = mountFile('ThemeProvider.vue', { theme: { accent: '#ff5500' } })
expect(t.find('.theme').style.getPropertyValue('--color-accent').trim()).toBe('#ff5500')`,
        },
        {
          name: 'renders slot content',
          code: `expect(exists('.theme .panel')).toBe(true)`,
        },
      ],
      hints: ['Build the style object in a `computed` from `Object.entries(props.theme)`.', 'Map each `[key, value]` to `[\'--color-\' + key, value]` and turn it back into an object with `Object.fromEntries`.'],
      answer: 'A computed turns the theme object into `{ \'--color-primary\': …, … }` and binds it with `:style` on the wrapper. Descendants read the values with `var(--color-*)` through inheritance.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import ThemeProvider from './ThemeProvider.vue'

const light = { primary: '#1d3bf0', surface: '#ffffff', text: '#1a1a1a' }
const dark = { primary: '#8ab4ff', surface: '#111318', text: '#f5f5f5' }

const isDark = ref(false)
const theme = computed(() => (isDark.value ? dark : light))
</script>

<template>
  <ThemeProvider :theme="theme">
    <div class="panel">
      <p>Account settings</p>
      <button class="toggle-theme" @click="isDark = !isDark">
        {{ isDark ? 'Light mode' : 'Dark mode' }}
      </button>
    </div>
  </ThemeProvider>
</template>

<style scoped>
.panel {
  padding: 16px;
  background: var(--color-surface);
  color: var(--color-text);
  border: 2px solid var(--color-primary);
}
</style>`,
          'ThemeProvider.vue': `<script setup>
import { computed } from 'vue'

const props = defineProps({
  theme: { type: Object, required: true },
})

const cssVars = computed(() =>
  Object.fromEntries(
    Object.entries(props.theme).map(([key, value]) => ['--color-' + key, value]),
  ),
)
</script>

<template>
  <div class="theme" :style="cssVars">
    <slot />
  </div>
</template>`,
        },
      },
      explanation: 'Custom properties are inherited, so one wrapper can theme an entire subtree — including scoped child components — without them knowing anything about the theme object.',
      whyAsked: 'Theming is a real requirement in most products; this checks you understand custom properties and Vue\'s style binding together.',
      mistakes: ['Hard-coding `--color-primary` etc. instead of mapping keys.', 'Using `v-bind()` with fixed names, which can\'t handle arbitrary keys.', 'Setting the theme on `document.documentElement` imperatively without cleaning up.'],
      followUps: ['How would you persist the user\'s theme choice?', 'How would you respect the operating system\'s dark-mode preference?', 'Could two ThemeProviders be nested?'],
      modelAnswer: 'I\'d compute a style object from the theme prop — `Object.entries` mapped to `--color-<key>` — and bind it with `:style` on the wrapper div, then render the slot. Because custom properties inherit, every descendant, scoped or not, can read `var(--color-surface)`. Switching themes only changes a few inline properties; the stylesheets stay static. Nesting providers also works naturally: the inner one overrides values for its own subtree.',
    },
    {
      id: 'styling-in-vue-vbind-mechanics',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does `v-bind()` inside `<style>` work, given that a stylesheet is static text? What are its limits?',
      answer: 'The compiler rewrites `v-bind(expr)` to `var(--<hash>-<name>)`, so the CSS stays static, and injects a `useCssVars()` call into the component. At runtime that helper sets the custom properties as inline styles on the component\'s root element(s) and updates them reactively after renders. Limits: values live on the component\'s root(s), so they flow to descendants via inheritance but are effectively private (hashed names); every bound value is a reactive effect; and it\'s for values that change — static values belong in CSS.',
      explanation: 'It\'s sugar for "set an inline custom property from state and read it with var()".',
      whyAsked: 'Distinguishes people who use features from people who can reason about their runtime cost and behaviour.',
      mistakes: ['Thinking Vue regenerates the stylesheet on each change.', 'Not knowing it requires Vue 3.2+.', 'Using it for constants.'],
      followUps: ['How is this different from binding `:style` directly?', 'What would you use to theme the whole app instead?'],
      modelAnswer: 'The CSS never changes at runtime. The compiler replaces each `v-bind()` with a hashed `var()` reference and adds a `useCssVars` helper to setup. After the component mounts and after each update, that helper writes the current values as inline custom properties on the component\'s root elements, so the browser recomputes only declarations that use them. It\'s Vue 3.2+. I use it for a few truly dynamic values; for app-wide theming I set unhashed custom properties higher in the tree so many components can share them.',
    },
  ],

  takeaways: [
    'Global CSS applies everywhere; use it deliberately for resets, typography and `:root` design values.',
    '`<style scoped>` adds a `data-v-<id>` attribute to elements and selectors — no Shadow DOM, just attributes.',
    'A child component\'s root element also receives the parent\'s scope attribute; elements inside it do not.',
    'Use `:deep()` for child internals and `v-html` content, `:slotted()` for slot content, `:global()` for one global rule — sparingly.',
    '`<style module>` renames classes and exposes them as `$style` / `useCssModule()`.',
    'CSS custom properties inherit and can be overridden per subtree — the foundation of theming; `v-bind()` (3.2+) links CSS values to component state.',
  ],
}
