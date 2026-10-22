// Lesson: Single-File Components (.vue files)

const likeButton = `<script setup>
import { ref } from 'vue'

const likes = ref(0)
const liked = ref(false)

function toggle() {
  liked.value = !liked.value
  likes.value += liked.value ? 1 : -1
}
</script>

<template>
  <button class="like" @click="toggle">
    {{ liked ? '♥' : '♡' }} {{ likes }}
  </button>
</template>

<style scoped>
.like {
  border: 2px solid #222;
  border-radius: 999px;
  background: white;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
}
</style>`

const appVue = `<script setup>
import LikeButton from './LikeButton.vue'
</script>

<template>
  <h1>Today's posts</h1>
  <article class="post">
    <p>Just finished my first Vue component!</p>
    <LikeButton />
  </article>
  <article class="post">
    <p>Single-file components keep everything in one place.</p>
    <LikeButton />
  </article>
</template>

<style>
h1 {
  font-size: 1.4rem;
}
.post {
  border-bottom: 1px solid #ddd;
  padding: 0.5rem 0;
}
</style>`

const optionsVersion = `<script>
export default {
  data() {
    return { likes: 0, liked: false }
  },
  methods: {
    toggle() {
      this.liked = !this.liked
      this.likes += this.liked ? 1 : -1
    },
  },
}
</script>

<template>
  <button class="like" @click="toggle">
    {{ liked ? '♥' : '♡' }} {{ likes }}
  </button>
</template>`

const setupVersion = `<script setup>
import { ref } from 'vue'

const likes = ref(0)
const liked = ref(false)

function toggle() {
  liked.value = !liked.value
  likes.value += liked.value ? 1 : -1
}
</script>

<template>
  <button class="like" @click="toggle">
    {{ liked ? '♥' : '♡' }} {{ likes }}
  </button>
</template>`

export default {
  id: 'single-file-components',
  title: 'Single-File Components (.vue files)',
  summary: 'A .vue file bundles one component\'s template, logic and styles together, and the compiler turns it into fast JavaScript and safely scoped CSS.',
  difficulty: 'beginner',
  minutes: 22,
  prerequisites: ['create-vue-project', 'create-app-mount'],
  related: ['template-syntax', 'first-component', 'setup-and-script-setup', 'styling-in-vue', 'compiler-macros'],
  tags: ['sfc', '.vue', 'script setup', 'template', 'scoped css', 'style scoped', 'component file', 'options api'],
  apis: [
    { name: '<template>', summary: 'The component\'s markup, compiled into a render function.' },
    { name: '<script setup>', summary: 'Component logic; top-level bindings and imports are usable in the template.' },
    { name: '<style scoped>', summary: 'CSS that applies only to this component\'s elements.' },
    { name: ':deep()', summary: 'Inside scoped CSS, targets elements rendered by child components.' },
  ],
  docs: [
    { label: 'Vue Guide — Single-File Components', url: 'https://vuejs.org/guide/scaling-up/sfc.html' },
    { label: 'API — SFC Syntax Specification', url: 'https://vuejs.org/api/sfc-spec.html' },
    { label: 'API — <script setup>', url: 'https://vuejs.org/api/sfc-script-setup.html' },
    { label: 'API — SFC CSS Features', url: 'https://vuejs.org/api/sfc-css-features.html' },
  ],

  intro: `
A **component** is a reusable piece of interface — a button, a card, a whole page — with its own markup, behaviour and look. A **Single-File Component** (SFC) is a \`.vue\` file that holds all three for one component:

- \`<template>\` — the HTML it shows,
- \`<script setup>\` — the JavaScript that powers it,
- \`<style>\` — the CSS that styles it.

Almost every Vue project is built from SFCs. You have already met one: \`App.vue\`.
`,

  why: `
Traditionally a web page is split **by file type**: all HTML here, all JavaScript there, all CSS in a stylesheet. That works for documents, but an app is made of *features*. To change a "like button" you would edit three files in three folders and hope your CSS selector does not accidentally restyle something else on the page.

SFCs split **by feature** instead: everything about the like button lives in \`LikeButton.vue\`. Open one file, understand one thing.

They also unlock things plain files can't do:

- **Scoped CSS** — styles that only affect this component, so \`.title\` in one file never clashes with \`.title\` in another.
- **Compile-time help** — the template is compiled ahead of time into optimised JavaScript, and \`<script setup>\` removes boilerplate.
- **Great tooling** — syntax highlighting, autocompletion and type checking across template and script (the official *Vue - Official* editor extension).
`,

  eli15: `
Think of a recipe card. One card has **a photo** of the finished dish, **the ingredients and steps**, and **plating notes** ("sprinkle parsley on top").

A \`.vue\` file is a recipe card for one piece of your app:

- the photo is the \`<template>\` — what it looks like,
- the ingredients and steps are the \`<script>\` — the data and what happens when you click,
- the plating notes are the \`<style>\` — colours, borders, spacing.

And \`scoped\` means "these plating notes are for *this* dish only" — your parsley rule won't end up on the dessert.
`,

  analogy: {
    title: 'One recipe card per dish',
    body: `
A restaurant could keep all photos in one binder, all ingredient lists in another and all plating notes on a wall chart. Changing one dish would mean hunting through all three — and a plating note like "make it red" might accidentally apply to everything.

Instead, each dish gets its own card with everything on it. Cards can be copied (reused), and a note on one card never affects another. That is what SFCs do for components.
`,
    mapping: [
      ['the dish', 'one component, e.g. `LikeButton`'],
      ['the photo', '`<template>` — the markup'],
      ['ingredients and method', '`<script setup>` — state and functions'],
      ['plating notes for this dish only', '`<style scoped>` — CSS that cannot leak'],
      ['the kitchen turning cards into food', 'the SFC compiler turning `.vue` into JS + CSS'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'What happens to a .vue file',
    props: {
      nodes: [
        { id: 'sfc', label: 'LikeButton.vue', note: 'template + script + style', tone: 'acid' },
        { id: 'compiler', label: 'SFC compiler', note: '@vue/compiler-sfc via Vite', tone: 'ink' },
        { id: 'render', label: 'render function', note: 'from <template>', tone: 'cobalt' },
        { id: 'setup', label: 'setup()', note: 'from <script setup>', tone: 'cobalt' },
        { id: 'css', label: 'scoped CSS', note: '.like[data-v-1a2b3c]', tone: 'kraft' },
        { id: 'module', label: 'JS module', note: 'export default component', tone: 'paper' },
      ],
      edges: [
        { from: 'sfc', to: 'compiler', label: 'parse' },
        { from: 'compiler', to: 'render', label: 'compile template' },
        { from: 'compiler', to: 'setup', label: 'compile script' },
        { from: 'compiler', to: 'css', label: 'compile style' },
        { from: 'render', to: 'module' },
        { from: 'setup', to: 'module' },
      ],
      layout: 'grid',
      cols: 3,
      steps: [
        { focus: ['sfc'], text: 'You write one `.vue` file with three blocks. The browser cannot read this format.' },
        { focus: ['compiler'], edges: ['sfc->compiler'], text: 'Vite hands the file to the **SFC compiler**, which first splits it into its blocks.' },
        { focus: ['render'], edges: ['compiler->render'], text: 'The `<template>` becomes a **render function**: JavaScript that describes the elements to create. Static parts are marked so updates can skip them.' },
        { focus: ['setup'], edges: ['compiler->setup'], text: '`<script setup>` becomes the component\'s `setup()` function. Every top-level variable, function and import is made available to the template.' },
        { focus: ['css'], edges: ['compiler->css'], text: '`<style scoped>` is rewritten: `.like` becomes `.like[data-v-1a2b3c]`, and the same `data-v-1a2b3c` attribute is added to this component\'s elements. Other components never match.' },
        { focus: ['module'], edges: ['render->module', 'setup->module'], text: 'The result is a normal JavaScript module that exports the component object — exactly what `import LikeButton from \'./LikeButton.vue\'` receives.' },
      ],
    },
    caption: 'An SFC is a convenient authoring format. What runs in the browser is plain JavaScript and CSS.',
    alt: 'A diagram: LikeButton.vue goes into the SFC compiler, which produces three outputs — a render function from the template, a setup function from script setup, and scoped CSS where .like becomes .like with a data-v attribute selector. The render function and setup combine into a JavaScript module.',
  },

  syntax: [
    `
#### Anatomy of a .vue file
`,
    {
      code: `<script setup>
import { ref } from 'vue'
import UserAvatar from './UserAvatar.vue'   // components are just imports

const name = ref('Ada Lovelace')            // state
function greet() {                          // a function
  alert('Hello, ' + name.value)
}
</script>

<template>
  <div class="card">
    <UserAvatar />                           <!-- use the imported component -->
    <h2 class="name">{{ name }}</h2>          <!-- use the state -->
    <button @click="greet">Say hi</button>   <!-- use the function -->
  </div>
</template>

<style scoped>
.card {
  border: 2px solid #222;
  padding: 1rem;
}
.name {
  margin: 0;
}
</style>`,
      lang: 'vue',
      title: 'ProfileCard.vue',
    },
    `
**The rules:**

1. **\`<template>\`** — at most one per file. In Vue 3 it may have **several root elements** (Vue 2 required exactly one).
2. **\`<script setup>\`** — every top-level binding (variables, functions, imports) can be used in the template. Imported components can be used as tags immediately — no registration step. The code runs **once each time a component instance is created**, not on every re-render.
3. **\`<style>\`** — any number of style blocks. Add \`scoped\` to limit the CSS to this component. Without \`scoped\`, the CSS is **global** and affects the whole app.
4. **Block order** doesn't matter to the compiler. A common convention is script → template → style.
5. **Name files in PascalCase** (\`ProfileCard.vue\`) and use the same name as the tag: \`<ProfileCard />\`.

#### The Options API form

\`<script setup>\` is the modern default, but SFCs also accept a normal \`<script>\` that exports a component options object. You will see this style in many existing codebases:
`,
    {
      code: `<script>
export default {
  data() {
    return { name: 'Ada Lovelace' }
  },
  methods: {
    greet() {
      alert('Hello, ' + this.name)
    },
  },
}
</script>`,
      lang: 'vue',
      title: 'same logic, Options API',
      static: true,
    },
    `
Both compile to a component; they are two ways of writing the script block. Compare them in depth in [Composition API vs Options API](lesson:composition-vs-options).

#### Scoped styles in practice
`,
    {
      code: `<style scoped>
.title { color: crimson; }          /* only this component's .title */

.wrapper :deep(.child-title) {      /* reach into a child component */
  font-weight: 700;
}
</style>

<style>
/* a second, unscoped block = global CSS (use sparingly) */
body { margin: 0; }
</style>`,
      lang: 'vue',
      title: 'scoped, :deep() and global styles',
      static: true,
    },
    `
- A child component's **root element** receives the parent's scope attribute too, so a parent can position or space a child from its own scoped CSS.
- Elements *inside* a child component are not matched by the parent's scoped CSS — use \`:deep()\` when you really need to.
- \`<style module>\` (CSS Modules) is another option: class names are made unique and exposed as \`$style\`. See [Styling in Vue](lesson:styling-in-vue).

#### Other languages
`,
    {
      code: `<script setup lang="ts">
const count: number = 0
</script>

<style scoped lang="scss">
.card { .title { color: crimson; } }
</style>`,
      lang: 'vue',
      title: 'lang attributes (need build support — not available in this sandbox)',
      static: true,
    },
    {
      callout: 'version',
      text: 'Multiple root nodes, `<script setup>` and `:deep()` are Vue 3 features. `<script setup>` became stable in Vue 3.2. `defineOptions()` (3.3+) lets you set options such as `name` from inside `<script setup>`.',
    },
  ],

  walkthrough: {
    title: 'LikeButton.vue',
    lang: 'vue',
    code: likeButton,
    intro: 'One complete SFC. Notice how each block has exactly one job.',
    steps: [
      { lines: [1, 2], text: '`<script setup>` opens the logic block. Imports at the top are available to the template — here we only need `ref` from Vue.' },
      { lines: [4, 5], text: 'Two pieces of state. Each `<LikeButton />` on the page gets **its own** `likes` and `liked`, because this code runs once per component instance.' },
      { lines: [7, 10], text: 'A function that flips `liked` and adjusts the count. Top-level functions are callable from the template without any extra registration.' },
      { lines: [13, 17], text: '`<template>` holds the markup. It reads `liked` and `likes` and calls `toggle` — straight from the script block above.' },
      { lines: [19, 27], text: '`<style scoped>` styles the button. The compiler turns `.like` into something like `.like[data-v-1a2b3c]` and stamps that attribute on this component\'s elements, so no other `.like` on the page is affected.' },
    ],
  },

  playground: {
    title: 'Posts with like buttons',
    objective: 'See how one .vue file becomes many independent instances, and how scoped and global styles behave.',
    files: { 'App.vue': appVue, 'LikeButton.vue': likeButton },
    expected: 'Two posts, each with its own ♡ button. Liking one does **not** affect the other — same file, separate instances. Open `LikeButton.vue` to see all three blocks.',
    experiments: [
      {
        id: 'third-post',
        task: 'Add a **third post** to `App.vue` (any text) with its own `<LikeButton />`.',
        hint: 'Copy one `<article class="post">…</article>` block and change the text.',
        tests: [{ name: 'three like buttons', code: `expect(findAll('.post').length).toBe(3); expect(findAll('.like').length).toBe(3)` }],
        explain: 'You reused the component without touching `LikeButton.vue`. Each tag creates a new instance with fresh state.',
      },
      {
        id: 'start-ten',
        task: 'Every post is popular. Make **every** like button start at **10**.',
        hint: 'Change the starting value in `LikeButton.vue` — one edit updates all instances.',
        tests: [
          {
            name: 'all buttons start at 10',
            code: `const labels = findAll('.like').map((b) => b.textContent)
expect(labels.length).toBeGreaterThan(0)
expect(labels.every((t) => t.includes('10'))).toBe(true)`,
          },
        ],
        explain: 'The `.vue` file is the *blueprint*; instances are built from it. Change the blueprint and every instance changes.',
      },
      {
        id: 'scope-app',
        task: '`App.vue`\'s styles are **global** right now — its `h1` rule would restyle every `<h1>` in the whole app. Make them scoped.',
        hint: 'Change `<style>` to `<style scoped>` in `App.vue`.',
        tests: [
          {
            name: 'App\'s elements carry a scope attribute',
            code: `const attrs = find('h1').getAttributeNames()
expect(attrs.some((n) => n.startsWith('data-v-'))).toBe(true)`,
          },
        ],
        explain: 'With `scoped`, the compiler adds a `data-v-…` attribute to App\'s elements and rewrites the selectors to require it. Bonus fact: each LikeButton\'s root `<button>` now carries **two** scope attributes — its own and App\'s — which is why a parent can still position a child\'s root element.',
      },
      {
        id: 'inspect',
        task: 'Open your browser\'s developer tools, inspect a like button and look at its attributes and at the CSS rule applied to it.',
        hint: 'Right-click the button → Inspect.',
        explain: 'You will see an attribute like `data-v-1a2b3c` on the element and a rule like `.like[data-v-1a2b3c]` in the styles panel. That is all scoped CSS is: an attribute plus an attribute selector — no Shadow DOM involved.',
      },
    ],
    variants: [{ id: 'options-api', label: 'LikeButton in Options API style', files: { 'App.vue': appVue, 'LikeButton.vue': optionsVersion } }],
  },

  animation: {
    type: 'comparison',
    title: 'The same component, two script styles',
    props: {
      left: { label: 'Options API (<script>)', lang: 'vue', code: optionsVersion },
      right: { label: '<script setup> (Composition API)', lang: 'vue', code: setupVersion },
      points: [
        'Both are valid SFCs and render the same button — only the script block differs.',
        'Options API groups code by option type (`data`, `methods`) and uses `this`.',
        '`<script setup>` uses plain variables and functions; everything top-level is available to the template.',
        '`<script setup>` is less code and is the recommended default for new Vue 3 projects.',
      ],
    },
    caption: 'The template is identical. Learn to read both — existing codebases use plenty of Options API.',
    alt: 'Two code panels. Left: a LikeButton written with export default, data() and methods using this. Right: the same LikeButton with script setup, two refs and a plain toggle function. The templates underneath are identical.',
  },

  internals: {
    beginner: `
A \`.vue\` file is a format for humans. Before it reaches the browser, a compiler splits it apart: the template becomes a JavaScript function that builds the elements, the script becomes the component's setup code, and the style becomes ordinary CSS with an extra attribute selector so it only matches this component.
`,
    technical: [
      `
\`@vue/compiler-sfc\` (used by \`@vitejs/plugin-vue\`) processes an SFC in stages:

1. **parse** → a *descriptor* with \`template\`, \`script\`, \`scriptSetup\` and \`styles\` blocks;
2. **compileScript** → turns \`<script setup>\` into a component with a \`setup()\` function. It records *binding metadata* (which names are refs, constants, imports…) and expands compiler macros like \`defineProps()\` — they are not real functions you import;
3. **compileTemplate** → turns the template into a render function. Using the binding metadata, it can access setup bindings directly instead of through a generic proxy, and it marks static nodes so updates skip them;
4. **compileStyle** → rewrites scoped selectors with PostCSS (\`.like\` → \`.like[data-v-1a2b3c]\`). The component gets a matching \`__scopeId\`, and the renderer stamps \`data-v-1a2b3c\` on every element the component renders.
`,
      {
        code: `// Roughly what LikeButton.vue becomes (simplified, production-style)
import { ref, openBlock, createElementBlock, toDisplayString } from 'vue'

export default {
  __scopeId: 'data-v-1a2b3c',
  setup() {
    const likes = ref(0)
    const liked = ref(false)
    function toggle() { /* … */ }

    // in production the render function is inlined here and reads the
    // bindings as plain closure variables
    return () => (openBlock(), createElementBlock('button', {
      class: 'like',
      onClick: toggle,
    }, toDisplayString(liked.value ? '♥' : '♡') + ' ' + toDisplayString(likes.value)))
  },
}
/* + CSS: .like[data-v-1a2b3c] { border: 2px solid #222; … } */`,
        lang: 'js',
        title: 'compiled output (simplified)',
      },
      `
Because the template can only reach what \`setup\` exposes, a \`<script setup>\` component is **closed by default**: a parent holding a template ref to it cannot read its internals unless the child calls \`defineExpose()\`. See [setup(), <script setup> & defineExpose](lesson:setup-and-script-setup) and [Compiler macros](lesson:compiler-macros).
`,
    ],
    production: `
- **One component per file**, PascalCase names, multi-word names (\`TodoItem\`, not \`Item\`) to avoid clashing with current or future HTML elements.
- **Keep files focused.** When an SFC passes a few hundred lines, extract child components (template) and composables (logic) — see [Composables](lesson:composables-intro).
- **Scoped CSS is not isolation.** Global styles still cascade in, and a child's root element is styled by both parent and child. For design systems, combine scoped styles with design tokens (CSS variables) — see [Styling in Vue](lesson:styling-in-vue).
- **TypeScript:** \`<script setup lang="ts">\` is transpiled by Vite, but Vite does **not** type-check. Run \`vue-tsc\` in CI for real type errors.
- **Tooling:** use the *Vue - Official* VS Code extension (formerly Volar) for template-aware autocompletion and errors.
`,
  },

  mistakes: [
    {
      title: 'Exporting from <script setup>',
      wrong: { code: `<script setup>\nimport { ref } from 'vue'\nconst title = ref('Inbox')\n\nexport default { name: 'MailHeader' } // compile error\n</script>`, lang: 'vue' },
      right: { code: `<script setup>\nimport { ref } from 'vue'\ndefineOptions({ name: 'MailHeader' }) // Vue 3.3+\nconst title = ref('Inbox')\n</script>`, lang: 'vue' },
      explanation: '`<script setup>` is compiled *into* the component, so it cannot contain `export` statements. Use `defineOptions()` (3.3+) for options like `name`, or add a separate normal `<script>` block.',
    },
    {
      title: 'Forgetting `scoped` and restyling the whole app',
      wrong: { code: `<!-- ProductCard.vue -->\n<style>\nh2 { color: crimson; }  /* every h2 in the app turns red */\n</style>`, lang: 'vue' },
      right: { code: `<style scoped>\nh2 { color: crimson; }  /* only ProductCard's h2 */\n</style>`, lang: 'vue' },
      explanation: 'A `<style>` block without `scoped` (or `module`) is plain global CSS. It is bundled into the page and applies everywhere.',
    },
    {
      title: 'Using a component without importing it',
      wrong: { code: `<script setup>\n// import is missing\n</script>\n\n<template>\n  <UserAvatar />\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\nimport UserAvatar from './UserAvatar.vue'\n</script>\n\n<template>\n  <UserAvatar />\n</template>`, lang: 'vue' },
      explanation: 'With `<script setup>`, the import *is* the registration. Without it, Vue warns `Failed to resolve component: UserAvatar` and renders an unknown `<useravatar>` element.',
    },
    {
      title: 'Expecting scoped parent styles to reach inside a child',
      wrong: { code: `<!-- Parent.vue -->\n<style scoped>\n.child-title { color: crimson; } /* no effect on elements inside <Child> */\n</style>`, lang: 'vue' },
      right: { code: `<style scoped>\n.wrapper :deep(.child-title) { color: crimson; }\n</style>`, lang: 'vue' },
      explanation: 'Scoped selectors require the parent\'s `data-v` attribute, which only the parent\'s own elements (and a child\'s root element) carry. `:deep()` deliberately opts out for the inner part of the selector — use it sparingly, since it couples the parent to the child\'s internals.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: Failed to resolve component: ProfileCard`.',
      cause: 'The component is not imported in this file\'s `<script setup>`, or the tag name does not match the import name.',
      fix: 'Add `import ProfileCard from \'./ProfileCard.vue\'` and use `<ProfileCard />` (or `<profile-card />`).',
    },
    {
      symptom: '`<script setup> cannot contain ES module exports`.',
      cause: 'An `export default {…}` or `export const` inside `<script setup>`.',
      fix: 'Remove the export. Use `defineOptions()` (3.3+) or a separate normal `<script>` block for options.',
    },
    {
      symptom: 'Changing styles in one component unexpectedly changes another.',
      cause: 'One of them uses an unscoped `<style>` block with a broad selector (`h2`, `.title`, `button`).',
      fix: 'Add `scoped` (or use `<style module>`), and keep truly global styles in one deliberate global stylesheet.',
    },
    {
      symptom: '`[Vue warn]: Component is missing template or render function`.',
      cause: 'The `.vue` file has no `<template>` block (or it is misspelled), or the import points at the wrong file.',
      fix: 'Check the file has a `<template>` block and the import path is correct.',
    },
    {
      symptom: '`Extraneous non-props attributes (class) were passed to component but could not be automatically inherited…`',
      cause: 'The component has several root elements, so Vue does not know which one should receive a `class` passed by the parent.',
      fix: 'Bind `v-bind="$attrs"` on the intended element, or wrap the roots in one element. See [Fallthrough attributes](lesson:fallthrough-attrs).',
    },
  ],

  bestPractices: [
    'One component per `.vue` file, named in PascalCase with at least two words (`TodoItem.vue`).',
    'Default to `<script setup>` for new components; read Options API fluently for older code.',
    'Default to `<style scoped>`; keep global CSS in a single, intentional stylesheet.',
    'Use `:deep()` rarely — styling a child\'s internals couples two components together.',
    'Split large SFCs: extract child components for template chunks and composables for logic.',
  ],

  useCases: [
    'Every component in a Vite/Vue project: buttons, cards, forms, pages, layouts.',
    'Design-system components whose styles must not leak (`BaseButton.vue` with scoped styles).',
    'Page-level components used by Vue Router (`ProductPage.vue`).',
    'Gradually rewriting Options API components to `<script setup>` one file at a time.',
  ],

  whenToUse: {
    use: [
      'You have a build step (Vite) — SFCs are the standard way to write Vue components.',
      'A piece of UI has its own markup, behaviour or styles worth naming.',
      'You want scoped CSS and full editor support.',
    ],
    avoid: [
      'No build step is possible (e.g. a CMS that only allows a script tag) — use plain JS component objects or in-DOM templates with the CDN build.',
      'A tiny piece of markup used once that has no behaviour — it can stay inline in its parent until it grows.',
    ],
  },

  comparison: {
    title: 'Ways to author a Vue component',
    headers: ['', 'SFC (.vue)', 'JS object + template string', 'Render function / JSX', 'In-DOM template (CDN)'],
    rows: [
      ['Build step', 'required', 'not required (needs the build with the compiler)', '`h()` none; JSX needs a build', 'not required'],
      ['Template compiled', 'at build time', 'in the browser', 'no template — you write render code', 'in the browser'],
      ['Scoped CSS', 'yes', 'no', 'no', 'no'],
      ['Editor support', 'excellent', 'weak (it\'s a string)', 'good (plain JS/TS)', 'limited'],
      ['Typical use', 'almost every app', 'quick prototypes', 'libraries, very dynamic output', 'enhancing server-rendered pages'],
    ],
    note: 'See [Render functions, h() & JSX](lesson:render-functions) for the third column.',
  },

  quiz: [
    {
      id: 'single-file-components-q1',
      type: 'mcq',
      prompt: 'Which three top-level blocks can a `.vue` file contain?',
      options: [
        { text: '`<template>`, `<script>` (or `<script setup>`), `<style>`' },
        { text: '`<html>`, `<head>`, `<body>`', why: 'Those belong to a whole HTML document (`index.html`), not a component.' },
        { text: '`<view>`, `<model>`, `<controller>`', why: 'Vue does not use MVC block names.' },
        { text: '`<markup>`, `<logic>`, `<css>`', why: 'Close in spirit, but the actual block names are template, script and style.' },
      ],
      answer: 0,
      explanation: 'Template for markup, script for logic, style for CSS. Only the template or a script is needed — style blocks are optional.',
    },
    {
      id: 'single-file-components-q2',
      type: 'output',
      prompt: 'In Vue 3, what does this component render?',
      code: {
        lang: 'vue',
        code: `<template>
  <h1>Inbox</h1>
  <p>3 unread messages</p>
</template>`,
      },
      options: [
        { text: 'Both the `<h1>` and the `<p>`.' },
        { text: 'A compile error: a template must have exactly one root element.', why: 'That was a Vue 2 rule. Vue 3 supports multiple root nodes (fragments).' },
        { text: 'Only the `<h1>`.', why: 'Vue 3 renders every root node.' },
        { text: 'Nothing until you wrap them in a `<div>`.', why: 'No wrapper is required in Vue 3.' },
      ],
      answer: 0,
      explanation: 'Vue 3 components can have several root nodes. The trade-off: attributes like `class` passed from a parent are no longer applied automatically.',
    },
    {
      id: 'single-file-components-q3',
      type: 'bug',
      prompt: 'This SFC fails to compile. Click the line that causes the error.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'

const title = ref('Inbox')

export default {
  name: 'MailHeader',
}
</script>

<template>
  <h1>{{ title }}</h1>
</template>`,
      },
      answerLine: 6,
      explanation: '`<script setup>` cannot contain ES module exports — the compiler generates the component for you. Use `defineOptions({ name: \'MailHeader\' })` (3.3+) instead.',
    },
    {
      id: 'single-file-components-q4',
      type: 'fill',
      prompt: 'Fill the blanks: import a child component and keep this file\'s CSS from leaking.',
      code: { lang: 'vue', code: `<script setup>\nimport ProductCard from './ProductCard.___'\n</script>\n\n<template>\n  <ProductCard />\n</template>\n\n<style ___>\n.grid { display: grid; }\n</style>` },
      answer: [['vue'], ['scoped']],
      explanation: 'Components are imported from `.vue` files, and `<style scoped>` keeps the CSS local to this component.',
    },
    {
      id: 'single-file-components-q5',
      type: 'mcq',
      prompt: 'How does Vue implement `<style scoped>`?',
      options: [
        { text: 'It adds a unique `data-v-…` attribute to the component\'s elements and rewrites selectors to require it.' },
        { text: 'It renders each component inside a Shadow DOM.', why: 'Scoped styles do not use Shadow DOM; they are ordinary CSS with attribute selectors.' },
        { text: 'It converts every rule into inline `style` attributes.', why: 'The CSS stays in a stylesheet; only the selectors change.' },
        { text: 'It renames every class to a random string.', why: 'That is closer to CSS Modules (`<style module>`), a different feature.' },
      ],
      answer: 0,
      explanation: '`.like` becomes `.like[data-v-1a2b3c]`, and only this component\'s elements (plus child root elements) carry `data-v-1a2b3c`.',
    },
    {
      id: 'single-file-components-q6',
      type: 'mcq',
      prompt: 'Select **all** statements that are true about `<script setup>`.',
      options: [
        { text: 'Top-level variables and functions can be used directly in the template.' },
        { text: 'An imported component can be used as a tag without registering it.' },
        { text: 'Its code re-runs every time the component re-renders.', why: 'It runs once per component instance. Re-renders only re-run the render function.' },
        { text: 'You must `return` an object of everything the template uses.', why: 'That is the plain `setup()` function. `<script setup>` exposes top-level bindings automatically.' },
      ],
      answer: [0, 1],
      explanation: 'The compiler exposes every top-level binding to the template and treats imported components as registered. The setup code itself runs once per instance.',
    },
    {
      id: 'single-file-components-q7',
      type: 'short',
      prompt: 'Someone says "SFCs break separation of concerns because HTML, JS and CSS are in one file." How would you respond?',
      answer: 'Separation of concerns is not the same as separation of file types. In a component-based UI the concern is the component — its markup, logic and styles are tightly coupled and change together. Keeping them in one file makes each component cohesive and easier to change, while scoped CSS prevents its styles from leaking into other concerns.',
    },
  ],

  exercises: [
    {
      id: 'quantity-picker',
      title: 'Build a QuantityPicker SFC',
      difficulty: 'beginner',
      prompt: `
\`App.vue\` already uses \`<QuantityPicker />\` twice, but \`QuantityPicker.vue\` is empty. Build it as a complete SFC:

- Root element: \`<div class="qty">\`.
- Inside: a \`<button class="minus">\`, a \`<span class="value">\` showing the quantity, and a \`<button class="plus">\`.
- The quantity starts at **1** and never goes below **1**.
- Add a \`<style scoped>\` block with at least one rule for \`.qty\`.
- Each picker must keep its **own** quantity.
`,
      files: {
        'App.vue': `<script setup>
import QuantityPicker from './QuantityPicker.vue'
</script>

<template>
  <section class="product">
    <h2>Retro console</h2>
    <QuantityPicker />
  </section>
  <section class="product">
    <h2>Spare controller</h2>
    <QuantityPicker />
  </section>
</template>`,
        'QuantityPicker.vue': `<script setup>
// TODO: state and functions
</script>

<template>
  <!-- TODO: <div class="qty"> with .minus, .value and .plus -->
</template>

<!-- TODO: a <style scoped> block -->`,
      },
      hints: [
        'State: `const quantity = ref(1)` (remember to import `ref`).',
        'Two functions: `increase()` does `quantity.value++`; `decrease()` only subtracts when `quantity.value > 1`.',
        'Template: `<div class="qty"><button class="minus" @click="decrease">−</button><span class="value">{{ quantity }}</span><button class="plus" @click="increase">+</button></div>`, then `<style scoped> .qty { display: inline-flex; gap: 0.5rem; } </style>`.',
      ],
      solution: {
        explanation: 'All three blocks work together in one file: state and rules in the script, markup in the template, scoped look in the style. Because `<script setup>` runs once per instance, each picker has its own `quantity`.',
        files: {
          'App.vue': `<script setup>
import QuantityPicker from './QuantityPicker.vue'
</script>

<template>
  <section class="product">
    <h2>Retro console</h2>
    <QuantityPicker />
  </section>
  <section class="product">
    <h2>Spare controller</h2>
    <QuantityPicker />
  </section>
</template>`,
          'QuantityPicker.vue': `<script setup>
import { ref } from 'vue'

const quantity = ref(1)

function increase() {
  quantity.value++
}

function decrease() {
  if (quantity.value > 1) quantity.value--
}
</script>

<template>
  <div class="qty">
    <button class="minus" @click="decrease">−</button>
    <span class="value">{{ quantity }}</span>
    <button class="plus" @click="increase">+</button>
  </div>
</template>

<style scoped>
.qty {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
</style>`,
        },
      },
      tests: [
        { name: 'two pickers render, both at 1', code: `const values = findAll('.qty .value').map((v) => v.textContent.trim()); expect(values).toEqual(['1', '1'])` },
        {
          name: 'each picker keeps its own quantity',
          code: `const plus = findAll('.qty .plus')
await click(plus[0])
await click(plus[0])
expect(findAll('.qty .value').map((v) => v.textContent.trim())).toEqual(['3', '1'])`,
        },
        {
          name: 'never goes below 1',
          code: `const minus = findAll('.qty .minus')[0]
await click(minus)
await click(minus)
expect(findAll('.qty .value')[0].textContent.trim()).toBe('1')`,
        },
        {
          name: 'the component uses scoped styles',
          code: `expect(find('.qty').getAttributeNames().some((n) => n.startsWith('data-v-'))).toBe(true)`,
        },
      ],
    },
    {
      id: 'options-to-setup',
      title: 'Rewrite an Options API SFC with <script setup>',
      difficulty: 'beginner',
      prompt: `
\`App.vue\` works, but it is written with the Options API. Rewrite **only the script block** using \`<script setup>\`:

- Use a ref called \`count\` (starts at 0) and a plain constant \`step\` (5).
- Keep the functions \`add\` (adds \`step\`) and \`reset\` (back to 0).
- The template and its classes (\`.total\`, \`.add\`, \`.reset\`) must keep working.
`,
      files: {
        'App.vue': `<script>
export default {
  data() {
    return { count: 0, step: 5 }
  },
  methods: {
    add() {
      this.count += this.step
    },
    reset() {
      this.count = 0
    },
  },
}
</script>

<template>
  <p class="total">{{ count }}</p>
  <button class="add" @click="add">+{{ step }}</button>
  <button class="reset" @click="reset">Reset</button>
</template>`,
      },
      hints: [
        'Replace the whole `<script>` block with `<script setup>` and `import { ref } from \'vue\'`.',
        '`data()` becomes `const count = ref(0)` and `const step = 5`. `this.count` becomes `count.value`.',
        'Methods become plain functions: `function add() { count.value += step }` and `function reset() { count.value = 0 }`.',
      ],
      solution: {
        explanation: 'Each Options API piece has a direct `<script setup>` equivalent: `data` → refs (or constants for values that never change), `methods` → functions, `this.x` → `x.value`. The template did not change at all.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const count = ref(0)
const step = 5

function add() {
  count.value += step
}

function reset() {
  count.value = 0
}
</script>

<template>
  <p class="total">{{ count }}</p>
  <button class="add" @click="add">+{{ step }}</button>
  <button class="reset" @click="reset">Reset</button>
</template>`,
        },
      },
      tests: [
        { name: 'adds 5 per click', code: `await click('.add'); await click('.add'); expect(text('.total')).toBe('10')` },
        { name: 'reset goes back to 0', code: `await click('.add'); await click('.reset'); expect(text('.total')).toBe('0')` },
        { name: 'uses <script setup> with a count ref', code: `expect(state.count).toBe(0); await click('.add'); expect(state.count).toBe(5)` },
      ],
    },
  ],

  interview: [
    {
      id: 'single-file-components-what',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a Single-File Component, and why does Vue use them?',
      answer: 'An SFC is a `.vue` file that contains one component\'s template, script and styles. It co-locates everything about a component, enables scoped CSS and ahead-of-time template compilation, and gets first-class editor support. A build tool compiles it into a JavaScript module plus CSS.',
      explanation: 'One file per component: cohesive, reusable, and compiled into efficient code.',
      whyAsked: 'Basic vocabulary check for any Vue role.',
      mistakes: ['Saying the browser runs `.vue` files directly.', 'Not mentioning scoped styles or compilation.'],
      followUps: ['What does the compiler produce?', 'Can you use Vue without SFCs?'],
      modelAnswer: "A single-file component is a .vue file that holds one component's template, script and styles together. The idea is to organise by feature rather than by file type, since a component's markup, logic and CSS change together. It also enables things plain files can't: scoped CSS, templates compiled ahead of time into optimised render functions, and script setup. The browser never sees the .vue file — Vite's Vue plugin compiles it into a JavaScript module and CSS.",
    },
    {
      id: 'single-file-components-scoped',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How do scoped styles work under the hood, and how do you style an element inside a child component?',
      answer: 'The compiler gives each component a unique id, adds a `data-v-<id>` attribute to every element the component renders, and rewrites scoped selectors to require it (`.title` → `.title[data-v-<id>]`). A child\'s root element gets both the parent\'s and its own attribute, so the parent can style the child\'s root, but not its inner elements. To reach inside, use `:deep()`: `.card :deep(.title) { … }`.',
      explanation: 'Scoping is just an attribute plus attribute selectors — not Shadow DOM.',
      code: {
        lang: 'css',
        code: `/* you write */
.card :deep(.title) { color: crimson; }

/* compiler output (roughly) */
.card[data-v-1a2b3c] .title { color: crimson; }`,
      },
      whyAsked: 'Styling bugs are common; understanding the mechanism lets you debug them instead of adding !important.',
      mistakes: ['Saying Vue uses Shadow DOM.', 'Not knowing child root elements get the parent\'s attribute.', 'Overusing `:deep()` and coupling components.'],
      followUps: ['What are `:slotted()` and `:global()` for?', 'How do CSS Modules differ?'],
      modelAnswer: "When a style block is scoped, the compiler generates an id for the component, stamps a data-v attribute with that id on every element the component renders, and rewrites each selector to include an attribute selector for it. So a dot-title rule only matches this component's elements. A child component's root element carries both ids, which lets a parent handle layout of its children. To style deeper elements inside a child, I use :deep(), which moves the attribute selector to the part before it. I use it sparingly because it couples the parent to the child's internal markup.",
    },
    {
      id: 'single-file-components-compile',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What does the compiler do with `<script setup>`, and why is a `<script setup>` component "closed by default"?',
      answer: 'The compiler turns `<script setup>` into the component\'s `setup()` function, expands macros like `defineProps`/`defineEmits`, and records binding metadata. In production it inlines the compiled template as a render function inside `setup`, so the template reads bindings as local closure variables. Since nothing is returned as a public object, the instance exposes nothing to parents via template refs unless `defineExpose()` is used.',
      explanation: 'Bindings live in a closure, not on a public `this`, which is both faster and more encapsulated.',
      whyAsked: 'Separates people who use `<script setup>` from people who understand what it compiles to — useful for debugging and library work.',
      mistakes: ['Thinking `defineProps` is a runtime function you import.', 'Expecting `parentRef.value.someInternalFn()` to work without `defineExpose`.'],
      followUps: ['What is binding metadata used for?', 'When would you still use a normal `<script>` block?'],
      modelAnswer: "script setup is compiled into the component's setup function. Macros like defineProps and defineEmits aren't real imports — the compiler replaces them with the props and emits options. It also records binding metadata, so the template compiler knows which names are refs, constants or imports. In production the template is compiled into a render function inlined inside setup, so the template accesses those bindings directly as closure variables instead of through a proxy. Because nothing is returned as a public object, a parent with a template ref to the component can't see its internals — it's closed by default — unless the component opts in with defineExpose.",
    },
    {
      id: 'single-file-components-attrs-warning',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A parent writes `<StatusBanner class="sticky" />`. The class never appears and the console warns about "extraneous non-props attributes". The component\'s template has an `<h2>` and a `<p>` at the top level. What is going on?',
      answer: 'Vue 3 allows multiple root nodes, but then it cannot know which root should receive fallthrough attributes like `class`, so it applies them to none and warns. Fix it by binding `v-bind="$attrs"` on the intended root element, or by wrapping the template in a single root element.',
      explanation: 'Single-root components inherit attributes automatically; multi-root components must choose explicitly.',
      code: {
        lang: 'vue',
        code: `<template>
  <h2 v-bind="$attrs">System status</h2>
  <p>All services operational</p>
</template>`,
      },
      whyAsked: 'Multi-root templates are a Vue 3 feature with a real caveat that shows up in component libraries.',
      mistakes: ['Wrapping everything in divs "just because" without understanding the cause.', 'Not knowing what `$attrs` contains.'],
      followUps: ['What is `inheritAttrs: false` for?', 'Which attributes count as fallthrough attributes?'],
      modelAnswer: "The component has two root nodes, which Vue 3 allows as a fragment. Attributes the parent passes that aren't declared props — like class here — normally fall through to the root element. With several roots Vue can't guess which one should get them, so it applies them to none and warns. I'd either wrap the template in one root element, or explicitly bind v-bind equals $attrs on the element that should receive them.",
    },
    {
      id: 'single-file-components-no-build',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A client\'s CMS only lets you add a `<script>` tag — no build step. Can you still use Vue? What do you lose compared with SFCs?',
      answer: 'Yes: load the global build from a CDN and define components as JavaScript objects with a `template` string, or write the template directly in the page (in-DOM template). You lose scoped CSS, ahead-of-time compilation (the template compiler ships to the browser, adding weight), editor support for templates in strings, and you must follow in-DOM parsing rules: kebab-case component tags, closing tags instead of self-closing components, and `is="vue:my-row"` inside elements like `<table>` that restrict their children.',
      explanation: 'Vue works without a build, but SFCs are where most of the developer experience lives.',
      code: {
        lang: 'html',
        code: `<div id="app">
  <todo-item v-for="t in todos" :key="t.id" :text="t.text"></todo-item>
</div>
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script>
  const TodoItem = { props: ['text'], template: '<li>{{ text }}</li>' }
  Vue.createApp({ data: () => ({ todos: [{ id: 1, text: 'Ship it' }] }) })
    .component('TodoItem', TodoItem)
    .mount('#app')
</script>`,
      },
      whyAsked: 'Shows flexibility and knowledge of what the build step actually gives you.',
      mistakes: ['Answering "no, Vue requires a build".', 'Not knowing the in-DOM template caveats.'],
      followUps: ['Why must component tags be kebab-case in in-DOM templates?', 'What is petite-vue-style progressive enhancement good for?'],
      modelAnswer: "Yes. I'd load Vue's global build from a CDN and define components as plain objects with template strings, or write the root template directly in the page's HTML. What I lose is everything the SFC compiler provides: scoped CSS, ahead-of-time template compilation — so the compiler ships to the browser — and good editor support for templates. In-DOM templates also go through the browser's HTML parser first, so component tags must be kebab-case with explicit closing tags, and inside elements like table I need is equals vue colon component-name. For a small widget that's acceptable; for anything bigger I'd push for a build step.",
    },
    {
      id: 'single-file-components-growth',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'You inherit a 900-line `CheckoutPage.vue`. How do you decide what to split out, and into what?',
      answer: 'Split along responsibilities. Template regions with their own purpose (address form, order summary, payment) become child components with props/emits. Reusable or complex stateful logic (form validation, price calculation, API calls) moves into composables or a store. Pure helpers and constants move into plain `.js` modules. Global state that other pages need goes to Pinia. Do it incrementally behind tests, one extraction at a time.',
      explanation: 'Components split the template; composables split the logic; modules split pure code.',
      whyAsked: 'Real codebases have giant components. This tests judgement, not syntax.',
      mistakes: ['Splitting by line count alone into components with no clear responsibility.', 'Moving everything into a global store.', 'Big-bang rewrites without tests.'],
      followUps: ['How do you avoid prop drilling after splitting?', 'When is a composable better than a child component?'],
      modelAnswer: "I'd look for responsibilities rather than line counts. Visual regions with their own purpose — the address form, the order summary, the payment step — become child components that communicate through props and emits. Logic that's complex or reusable, like validation, totals or API calls, moves into composables so it can be tested without the UI. Pure helpers and constants go into plain modules, and only state that other pages truly share goes into Pinia. I'd add a few tests around the current behaviour first and then extract one piece at a time so every step is safe to ship.",
    },
    {
      id: 'single-file-components-coding-dot',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Complete `OnlineDot.vue`: a `<button class="dot">` that shows **Online** and toggles to **Offline** (and back) when clicked. Give it scoped styles, and render it in `App.vue`.',
      starter: {
        files: {
          'App.vue': `<script setup>
</script>

<template>
  <h1>Ada Lovelace</h1>
</template>`,
          'OnlineDot.vue': `<script setup>
</script>

<template>
  <button class="dot">Online</button>
</template>`,
        },
      },
      tests: [
        {
          name: 'OnlineDot toggles its label',
          code: `const dot = mountFile('OnlineDot.vue')
expect(dot.find('.dot').textContent.trim()).toBe('Online')
await click(dot.find('.dot'))
expect(dot.find('.dot').textContent.trim()).toBe('Offline')
await click(dot.find('.dot'))
expect(dot.find('.dot').textContent.trim()).toBe('Online')`,
        },
        { name: 'OnlineDot uses scoped styles', code: `const dot = mountFile('OnlineDot.vue'); expect(dot.find('.dot').getAttributeNames().some((n) => n.startsWith('data-v-'))).toBe(true)` },
        { name: 'App renders it', code: `expect(exists('.dot')).toBe(true)` },
      ],
      hints: ['A boolean ref `online` plus a toggle function in OnlineDot\'s `<script setup>`.', 'Add `<style scoped>` with a `.dot` rule, then import OnlineDot in App.vue and add `<OnlineDot />`.'],
      answer: 'One boolean ref drives the label; a scoped style block styles it; the parent imports and renders it.',
      solution: {
        files: {
          'App.vue': `<script setup>
import OnlineDot from './OnlineDot.vue'
</script>

<template>
  <h1>Ada Lovelace</h1>
  <OnlineDot />
</template>`,
          'OnlineDot.vue': `<script setup>
import { ref } from 'vue'

const online = ref(true)
</script>

<template>
  <button class="dot" @click="online = !online">{{ online ? 'Online' : 'Offline' }}</button>
</template>

<style scoped>
.dot {
  border-radius: 999px;
  border: 2px solid #222;
  padding: 0.2rem 0.8rem;
}
</style>`,
        },
      },
      explanation: 'The SFC owns its state, markup and styles. The parent only needs to import it and place the tag.',
      whyAsked: 'Checks the full SFC workflow in a few minutes.',
      mistakes: ['Putting the style in App.vue unscoped.', 'Forgetting to import the component in the parent.'],
      followUps: ['How would the parent control the initial status?', 'How would you add `aria-pressed` for accessibility?'],
      modelAnswer: "In OnlineDot I'd keep one boolean ref, flip it on click, and derive the label in the template, with a scoped style block for the look. Then App imports it in script setup and renders the tag. If the parent needed to control the status I'd turn it into a prop with an emit, and I'd add aria-pressed bound to the boolean so assistive technology knows the state.",
    },
  ],

  takeaways: [
    'A `.vue` file is one component: `<template>` (markup), `<script setup>` (logic), `<style>` (CSS).',
    'Top-level bindings in `<script setup>` are usable in the template; importing a component registers it.',
    '`<script setup>` runs once per component instance — every `<LikeButton />` has its own state.',
    '`<style scoped>` = a `data-v-…` attribute + attribute selectors; use `:deep()` to reach inside children.',
    'Vue 3 templates can have multiple root nodes; the compiler turns the SFC into a JS module plus CSS.',
  ],
}
