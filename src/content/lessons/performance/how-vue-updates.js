// Lesson: How Vue updates the DOM (virtual DOM) — Level 12, Performance

const statsJs = `// Plain, NON-reactive counters. Writing reactive state from
// onUpdated would itself cause another update.
export const updates = {}

export function countUpdate(name) {
  updates[name] = (updates[name] || 0) + 1
  console.log(name + ' updated (#' + updates[name] + ')')
}`

const badgeVue = `<script setup>
import { onUpdated } from 'vue'
import { countUpdate } from './stats.js'

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  extra: { type: Object, default: null }, // unused for now (experiment 3)
})

onUpdated(() => countUpdate('Badge ' + props.name))
</script>

<template>
  <span class="badge">{{ label }}</span>
</template>`

const updatesApp = `<script setup>
import { ref, onUpdated } from 'vue'
import Badge from './Badge.vue'
import { countUpdate } from './stats.js'

const likes = ref(0)
const theme = ref('light')

onUpdated(() => countUpdate('App'))
</script>

<template>
  <h2 class="likes">Likes: {{ likes }}</h2>
  <button class="like" @click="likes++">Like</button>
  <button class="theme" @click="theme = theme === 'light' ? 'dark' : 'light'">
    Toggle theme
  </button>
  <div class="badges">
    <Badge name="welcome" label="Welcome!" />
    <Badge name="theme" :label="'Theme: ' + theme" />
  </div>
</template>`

const productsList = `const products = Array.from({ length: 200 }, (_, i) => ({ id: i + 1, name: 'Product ' + (i + 1) }))`

export default {
  id: 'how-vue-updates',
  title: 'How Vue updates the DOM (virtual DOM)',
  summary: 'Follow a state change from your template to the real DOM: render functions, virtual nodes, patching, component boundaries and the compiler hints that make it cheap.',
  difficulty: 'advanced',
  minutes: 40,
  prerequisites: ['dependency-tracking', 'render-functions', 'list-rendering'],
  related: ['render-optimization', 'large-lists', 'scheduling-flush', 'compiler-macros', 'next-tick'],
  tags: ['virtual DOM', 'vdom', 'vnode', 'render function', 'patch', 'diff', 'reconciliation', 'patch flags', 'block tree', 'static hoisting', 'keys', 'performance'],
  apis: [
    { name: 'h()', summary: 'Creates a virtual node (vnode) — what templates compile into.' },
    { name: 'render function', summary: 'A function that returns the vnode tree for a component; templates are compiled into one.' },
    { name: 'key (special attribute)', summary: 'Gives a vnode an identity so Vue can match, move, keep or replace the real element.' },
    { name: 'onUpdated()', summary: 'Lifecycle hook that runs after a component has re-rendered and patched the DOM.' },
  ],
  docs: [
    { label: 'Vue Guide — Rendering Mechanism', url: 'https://vuejs.org/guide/extras/rendering-mechanism.html' },
    { label: 'Vue Guide — Rendering Mechanism: Compiler-Informed Virtual DOM', url: 'https://vuejs.org/guide/extras/rendering-mechanism.html#compiler-informed-virtual-dom' },
    { label: 'Vue Guide — Performance: Update Optimizations', url: 'https://vuejs.org/guide/best-practices/performance.html#update-optimizations' },
    { label: 'Vue SFC Playground (see compiled output)', url: 'https://play.vuejs.org/' },
  ],

  intro: `
When you write \`likes++\`, the heading on screen changes from "Likes: 3" to "Likes: 4". Between those two moments, Vue does something clever: it doesn't rebuild the page, and it doesn't make you write \`element.textContent = …\`. It works out the **smallest** change to the real page and makes only that.

The tool it uses is the **virtual DOM**: a lightweight JavaScript description of what the page should look like. Vue renders a new description, compares it with the previous one, and **patches** the real page where they differ.

Understanding this loop — and which parts of it Vue's compiler makes cheaper — is the foundation of every performance technique in this level.
`,

  why: `
The real page (the **DOM**, the browser's live tree of elements) is the thing users see. Changing it has costs: the browser may need to recalculate styles and layout and repaint. Worse, *throwing elements away and recreating them* loses state the user cares about — what they typed, where the cursor is, scroll position, focus.

You could update the DOM by hand, element by element. That's fast but fragile: every piece of state needs code that remembers to update every element that shows it. Forget one and the page lies.

The virtual DOM lets you describe the **whole UI for the current state** — declaratively, in a template — while Vue figures out the **minimal set of changes**. You get the simplicity of "just re-render everything" with the precision of hand-written updates. Knowing how it works tells you what's cheap, what isn't, and why a misplaced \`key\` can wipe an input.
`,

  eli15: `
Imagine you're redecorating your room using a floor plan on paper.

Instead of carrying all your furniture out and back in every time you change your mind, you draw a **new floor plan**, lay it next to the **old floor plan**, and compare: "the lamp moved from the desk to the shelf; everything else is the same." Then you move **only the lamp**.

The paper floor plans are the **virtual DOM** — cheap to draw and compare. Your actual room is the **real DOM** — heavy to change. Vue draws a new plan whenever your data changes, spots the differences, and moves only what's needed.

Bonus trick: Vue's template compiler is like an assistant who pencils notes on the plan in advance — "this poster never moves", "only the label on this box can change" — so the comparison is even quicker.
`,

  analogy: {
    title: 'Redecorating with floor plans',
    body: `
Drawing a new plan is cheap; moving furniture is expensive. Compare plans, then move only what changed — and label furniture so you can tell "this chair moved" from "a different chair arrived".
`,
    mapping: [
      ['the actual room', 'the real DOM the user sees'],
      ['a paper floor plan', 'the virtual DOM tree (vnodes) from a render'],
      ['drawing a new plan', 're-running the component\'s render function'],
      ['comparing the two plans', 'diffing old vs new vnodes ("patch")'],
      ['moving only the lamp', 'the minimal DOM operations Vue performs'],
      ['labels on furniture', '`key`s — identity for list items and elements'],
      ['the assistant\'s pencil notes', 'compiler hints: patch flags, static caching, blocks'],
    ],
  },

  visual: {
    type: 'vdom',
    props: { preset: 'text' },
    title: 'A text change, two trees, one patch',
    caption: 'The old and new virtual trees differ in one text node, so the patch list has exactly one entry. Every other element is left untouched.',
    alt: 'A conceptual diagram of two virtual DOM trees side by side, the previous render and the next render. Only one text node differs between them; it is highlighted, and the resulting patch list contains a single "set text" operation on the real DOM.',
  },

  syntax: [
    `
#### From template to pixels

1. **Compile** — your template is compiled (at build time with Vite, or in the browser) into a **render function**.
2. **Render** — Vue calls the render function; it returns a tree of **vnodes** (virtual nodes): plain JavaScript objects describing elements, components and text.
3. **Mount** — the first time, Vue creates real DOM elements from the vnodes.
4. **Re-render** — when reactive state the render read changes, Vue runs the render function again and gets a *new* vnode tree.
5. **Patch** — Vue compares the old and new trees and applies only the differences to the real DOM.
`,
    {
      code: `// A vnode is just an object. Roughly:
{
  type: 'h2',                 // a tag name, or a component definition
  props: { class: 'likes' },
  children: 'Likes: 4',       // text, or an array of child vnodes
  key: null,                  // identity for matching across renders
  el: /* the real <h2> after mounting */ null,
}

// What a template compiles into, written by hand with h():
import { h } from 'vue'
const render = () => h('h2', { class: 'likes' }, 'Likes: ' + likes.value)`,
      lang: 'js',
      title: 'vnodes and render functions (simplified)',
    },
    `
#### When does a component re-render?

Every component instance has its own **render effect** (see [dependency tracking](lesson:dependency-tracking)). A component re-renders when:

- reactive state **its own render read** changes;
- its **parent re-renders and passes props that changed** — compared one by one, shallowly (a new object or array counts as changed, even with the same contents — e.g. \`:filters="{ category }"\` or \`:items="list.filter(...)"\` builds a new one on every render);
- its parent passes **slot content that can change** (dynamic slots);
- you call \`$forceUpdate()\` (rarely needed).

A parent re-rendering does **not** automatically re-render its children. If a child's props are the same values as last time, Vue skips it.

#### Compiler hints: a "compiler-informed" virtual DOM

Because Vue controls both the compiler and the runtime, the compiler annotates the render function so the patcher can skip work. Here is real output from Vue 3.5 for a small template (trimmed — exact output changes between versions; try the SFC Playground's JS tab):
`,
    {
      code: `<div>
  <h1>Static title</h1>
  <p :class="cls">{{ msg }}</p>
  <button @click="count++">+</button>
  <Child @select="pick(item)" :item="item" />
</div>`,
      lang: 'vue',
      title: 'template',
    },
    {
      code: `return (_openBlock(), _createElementBlock("div", null, [
  // fully static: created once and cached
  _cache[2] || (_cache[2] = _createElementVNode("h1", null, "Static title", -1 /* CACHED */)),
  // patch flag 3 = TEXT | CLASS: only the text and class can change
  _createElementVNode("p", { class: _normalizeClass(_ctx.cls) }, _toDisplayString(_ctx.msg), 3 /* TEXT, CLASS */),
  // inline handlers are cached: the same function every render
  _createElementVNode("button", { onClick: _cache[0] || (_cache[0] = $event => (_ctx.count++)) }, "+"),
  // PROPS: only "item" is dynamic; the cached handler never looks "new" to Child
  _createVNode(_component_Child, { onSelect: _cache[1] || (_cache[1] = $event => (_ctx.pick(_ctx.item))), item: _ctx.item }, null, 8 /* PROPS */, ["item"])
]))`,
      lang: 'js',
      title: 'compiled render function (Vue 3.5, trimmed)',
    },
    `
- **Patch flags** (\`3 /* TEXT, CLASS */\`, \`8 /* PROPS */\`) tell the patcher which parts of a node can change, so it checks only those.
- **Static caching / hoisting**: content that never changes is created once and reused, and skipped during diffing. (Older 3.x versions hoisted it to module scope; 3.5 caches it per component — an internal detail.)
- **Blocks / tree flattening**: \`openBlock\`/\`createElementBlock\` collect the *dynamic* descendants into a flat list, so an update walks only those instead of the whole tree. \`v-if\` and \`v-for\` start new blocks because they change structure.
- **Cached event handlers** keep inline handlers stable, so child components don't see a "new" prop on every render.
`,
    {
      callout: 'note',
      title: 'Guaranteed vs internal',
      text: 'Guaranteed behaviour: templates render through vnodes and patching; a component re-renders for its own dependencies, changed props or dynamic slots; matching `key`s keep elements and components, changing `key`s replace them. **Internal:** the exact vnode fields, patch flag numbers, the diff algorithm, and whether static content is hoisted or cached. Hand-written render functions (`h()`) work fine but generally don\'t get these compiler hints, so the runtime falls back to full diffing for them.',
    },
  ],

  walkthrough: {
    title: 'App.vue (who updates?)',
    lang: 'vue',
    code: updatesApp,
    intro: 'The playground parent. Each component logs to the console when it re-renders, using a plain counter in `stats.js`.',
    steps: [
      { lines: [6, 7], text: 'Two independent pieces of state. The template reads both — so changing either one re-renders **App**.' },
      { lines: [9], text: '`onUpdated` runs after this component re-rendered and patched the DOM. `countUpdate` logs it and bumps a plain (non-reactive) counter, so counting can\'t cause more renders.' },
      { lines: [13], text: 'Text bound to `likes`. When it changes, the compiler-generated patch flag says "only the text can change", so Vue updates the existing text node — the `<h2>` element itself is kept.' },
      { lines: [19], text: 'A badge with only static props. When App re-renders, Vue compares the old and new props: identical, so this child is **skipped** entirely.' },
      { lines: [20], text: 'This badge\'s `label` depends on `theme`. Toggling the theme changes the prop, so this child re-renders. Liking doesn\'t change it, so it\'s skipped.' },
    ],
  },

  playground: {
    title: 'Who updates?',
    objective: 'Click the buttons, read the update log, then change props and keys and predict exactly which components and elements update.',
    files: { 'App.vue': updatesApp, 'Badge.vue': badgeVue, 'stats.js': statsJs },
    expected: `
**Likes: 0**, two buttons and two badges. Click **Like**: the console logs only \`App updated\` — neither badge re-rendered. Click **Toggle theme**: \`App updated\` *and* \`Badge theme updated\`. The welcome badge never updates.
`,
    experiments: [
      {
        id: 'predict',
        task: 'Before clicking anything, predict which components will log an update for **Like** and for **Toggle theme**. Then check the console.',
        hint: 'A child only re-renders if its own dependencies or its props changed.',
        explain: 'Like: App only. Theme: App and the theme badge. The parent re-rendering is not enough on its own — Vue compares each child\'s props and skips the ones that didn\'t change.',
      },
      {
        id: 'prop-dependency',
        task: 'Make the **welcome** badge show the like count: change its label to `:label="\'Likes so far: \' + likes"`. Click Like and watch the log.',
        hint: 'Add a colon (`:label`) so the value is a JavaScript expression, not a fixed string.',
        tests: [
          {
            name: 'the welcome badge now updates on Like',
            code: `await click('.like')
const { updates } = requireModule('stats.js')
expect(updates['Badge welcome']).toBe(1)
expect(text('.badges')).toContain('Likes so far: 1')`,
          },
        ],
        explain: 'Now the prop value changes on every Like, so the child re-renders. Props are the channel through which a parent\'s updates reach a child.',
      },
      {
        id: 'new-object-prop',
        task: 'Pass `:extra="{ theme: theme }"` to the **theme** badge. The badge doesn\'t even use it, and Like doesn\'t change `theme`. Click **Like** twice and count its updates.',
        hint: 'Add the attribute to the second `<Badge>` in App.vue. `extra` is already declared as a prop in Badge.vue.',
        tests: [
          {
            name: 'a new object prop re-renders the child on every parent render',
            code: `await click('.like')
await click('.like')
const { updates } = requireModule('stats.js')
expect(updates['Badge theme']).toBe(2)`,
          },
        ],
        explain: 'Each App render builds a **new** `{ theme }` object. Props are compared shallowly, and a new object is never identical to the old one — so the badge re-renders although nothing it shows changed. (Fun nuance: a literal with only constants, like `{ size: \'small\' }`, is recognised by the compiler as static, gets no patch flag and does *not* cause this.) Stable props are the subject of [Avoiding unnecessary renders](lesson:render-optimization).',
      },
      {
        id: 'key-recreate',
        task: 'Add `:key="likes"` to the `<h2>`. Now each Like makes Vue **replace** the heading element instead of patching its text.',
        hint: 'Write `<h2 class="likes" :key="likes">`. Then compare: is it still the same element after a click?',
        tests: [
          {
            name: 'the heading element is recreated on each Like',
            code: `const before = find('.likes')
await click('.like')
expect(find('.likes') === before).toBe(false)
expect(text('.likes')).toBe('Likes: 1')`,
          },
        ],
        explain: 'A different key means "this is a different thing", so Vue unmounts the old element and creates a new one. For a heading that\'s merely wasteful; for an input it would throw away what the user typed and their focus. Remove the key again afterwards — and use this power deliberately (see the exercises).',
      },
    ],
  },

  animation: {
    type: 'vdom',
    props: { preset: 'list' },
    title: 'Diffing a list',
    caption: 'Step through an update to a list: the old and new trees are compared, unchanged items are kept, and only the real differences become DOM operations.',
    alt: 'A conceptual old and new virtual tree for a list. Matching items are kept, the changed or added items are highlighted, and the patch list shows only the DOM operations needed to turn the old list into the new one.',
  },

  internals: {
    beginner: `
Each component remembers the vnode tree it produced last time. When it re-renders, it produces a new tree and walks both together, node by node: same kind of element in the same place? Keep the real element and update just the bits that differ. Different kind (or different key)? Remove the old one and create a new one.

Because each component has its own render, Vue only does this walk for components whose data actually changed.
`,
    technical: [
      `
**Patching a node.** If the old and new vnodes have the same \`type\` and \`key\`, Vue reuses the real element (\`vnode.el\`) and patches it: props, then children. Otherwise it unmounts the old subtree and mounts the new one. Patch flags narrow the work: a node flagged \`TEXT\` only has its text compared; \`CLASS\` only its class; \`PROPS\` only the listed dynamic props.

**Patching children.** Within a block, Vue patches the flat list of dynamic descendants collected at render time instead of walking every static element. For \`v-for\` lists, **keyed** children are matched by key, so items can be moved, kept, inserted or removed precisely; **unkeyed** children are patched in place by position. (Vue's keyed algorithm minimises DOM moves — the specific technique is an implementation detail.)

**Patching a component.** For a component vnode, Vue decides whether the child needs to update by comparing the props it received (each value with \`!==\`, so new objects count as changes) and checking for dynamic slots. If nothing changed, the child keeps its previous vnode tree and isn't re-rendered at all. If something did, the child's update runs right away as part of the parent's patch, and its own queued update (if any) is skipped.

**Batching.** Re-renders are queued and flushed together in a microtask, parents before children (see [scheduling & flush timing](lesson:scheduling-flush)), so ten state changes in one tick cost one render per affected component.
`,
      {
        code: `// A SIMPLIFIED model of patching — not Vue's source
function patch(oldVNode, newVNode) {
  if (oldVNode.type !== newVNode.type || oldVNode.key !== newVNode.key) {
    replace(oldVNode, newVNode)          // different thing: unmount + mount
    return
  }
  const el = (newVNode.el = oldVNode.el) // same thing: reuse the real element
  if (newVNode.patchFlag & TEXT) {
    if (oldVNode.children !== newVNode.children) el.textContent = newVNode.children
  } else {
    patchProps(el, oldVNode.props, newVNode.props)
    patchChildren(oldVNode, newVNode)    // keyed or by position
  }
}`,
        lang: 'js',
        title: 'mental model of patch()',
      },
      {
        callout: 'warn',
        title: 'Implementation details — may change',
        text: 'Vnode fields (`el`, `shapeFlag`, `dynamicChildren`…), patch flag values, the block tree, the keyed-diff algorithm and static caching (which replaced module-level hoisting in 3.5) are internals. Vue\'s team has also been developing an opt-in compilation mode, "Vapor Mode", that skips the virtual DOM for components that use it — check the current release notes for its status rather than assuming.',
      },
    ],
    production: `
- **Granularity is per component.** A small component that owns fast-changing state re-renders cheaply; the same state at the top of a big component re-renders the whole template. Split along lines of change.
- **Props are compared by identity.** New objects, arrays and functions created in a parent's render make children re-render. Pass primitives or stable references — covered in [Avoiding unnecessary renders](lesson:render-optimization).
- **Keys are identity.** Stable unique keys in lists keep elements (and their state) attached to the right data; changing a key deliberately is the cleanest way to reset a component. See [Large lists & virtual scrolling](lesson:large-lists).
- **Let Vue own the DOM it renders.** Manual edits to Vue-rendered nodes can be overwritten by the next patch. Use template refs and custom directives for imperative work, or give a library an element whose children Vue doesn't render.
- **Prefer templates for large dynamic UIs.** They get compiler hints; hand-written render functions don't (by default).
- **Measure before optimising** — re-renders are often cheap. Use the tools in [Measuring: devtools, profiling & Web Vitals](lesson:measuring-performance).
`,
  },

  mistakes: [
    {
      title: 'Using `:key` to "force a refresh"',
      wrong: { code: `<div :key="renderKey">\n  <input :value="username" @input="onInput" />\n</div>\n<!-- onInput bumps renderKey "so the error shows" -->`, lang: 'vue' },
      right: { code: `<div>\n  <input :value="username" @input="onInput" />\n  <p>{{ error }}</p>  <!-- reactive data already updates this -->\n</div>`, lang: 'vue' },
      explanation: 'A new key means a brand-new element: the input loses focus and cursor position on every keystroke. Reactive bindings already update the DOM; keys should change only when you *want* a fresh element or component.',
    },
    {
      title: 'Assuming every child re-renders with its parent',
      wrong: { code: `// "App re-renders on every keystroke, so all 50 children must re-render —\n// let's wrap everything in v-memo!"`, lang: 'js' },
      right: { code: `// Children with unchanged props are skipped automatically.\n// Measure first: count updates (onUpdated / onRenderTriggered),\n// then fix the props that really change.`, lang: 'js' },
      explanation: 'Vue compares each child\'s props before re-rendering it. Optimising without checking adds complexity for no gain.',
    },
    {
      title: 'Editing DOM that Vue renders',
      wrong: { code: `onMounted(() => {\n  document.querySelector('.likes').textContent = 'Likes: lots'\n  // the next render patches it straight back\n})`, lang: 'js' },
      right: { code: `const likesLabel = computed(() => likes.value > 999 ? 'Likes: lots' : 'Likes: ' + likes.value)\n// <h2 class="likes">{{ likesLabel }}</h2>`, lang: 'js' },
      explanation: 'The vnode tree is Vue\'s source of truth for the DOM it manages. Manual changes are invisible to it and can be overwritten — or confuse the next patch.',
    },
    {
      title: 'Rewriting templates as render functions "for speed"',
      wrong: { code: `// "render functions are closer to the metal"\nexport default { render: () => h('ul', items.value.map((i) => h('li', i.name))) }`, lang: 'js' },
      right: { code: `<ul>\n  <li v-for="i in items" :key="i.id">{{ i.name }}</li>\n</ul>`, lang: 'vue' },
      explanation: 'Templates get compiler hints (patch flags, static caching, blocks). Hand-written render functions are great for highly dynamic or programmatic UIs, not as a default speed-up. (The `h()` version also forgot keys.)',
    },
  ],

  debugging: [
    {
      symptom: 'An input loses focus or its text after every keystroke.',
      cause: 'The input (or a wrapper) is being re-created: a changing `:key`, a component whose `is` changes, or a `v-if` that flips.',
      fix: 'Keep keys stable. Only change a key when you want a fresh element. Check with a template ref whether the element is the same before and after.',
    },
    {
      symptom: 'Switching between items, a child component keeps the old item\'s local state (a draft, an open panel).',
      cause: 'Same component type in the same place: Vue reuses the instance and only patches its props.',
      fix: 'Add `:key="item.id"` to recreate it per item, or watch the prop and reset the local state yourself.',
    },
    {
      symptom: 'A manual DOM change disappears after the next update.',
      cause: 'Vue patched the element back to match its vnode tree.',
      fix: 'Express the change as state in the template, or do imperative work in an element whose children Vue doesn\'t render.',
    },
    {
      symptom: 'A child re-renders on every parent update even though its display never changes.',
      cause: 'A prop receives a new object, array or function on every parent render.',
      fix: 'Pass stable values: constants, computeds, primitives. See [Avoiding unnecessary renders](lesson:render-optimization).',
    },
  ],

  bestPractices: [
    'Let state drive the template; never patch Vue-rendered DOM by hand.',
    'Remember the re-render rules: own dependencies, changed props, dynamic slots.',
    'Keep fast-changing state in small components close to where it\'s displayed.',
    'Pass primitives or stable references as props.',
    'Use stable unique keys in lists; change keys only to reset deliberately.',
    'Prefer templates over hand-written render functions unless you need programmatic rendering.',
    'Count renders before optimising — many re-renders are cheap and fine.',
  ],

  useCases: [
    'Explaining why a component did (or didn\'t) re-render in a code review.',
    'Resetting a form or editor component when the selected record changes (`:key`).',
    'Splitting a clock, timer or live counter into its own component.',
    'Reading compiled output in the SFC Playground to understand a performance question.',
    'Deciding when a render function is worth writing.',
  ],

  whenToUse: {
    use: [
      'Templates for almost all UI — they come with compiler hints.',
      '`:key` changes when you want a fresh component or element (reset, restart a transition).',
      'Render functions for programmatic structures (renderless components, highly dynamic layouts).',
    ],
    avoid: [
      'Changing keys or toggling `v-if` just to "refresh" something reactive data already updates.',
      'Manual DOM writes inside Vue-rendered elements.',
      'Optimising re-renders you haven\'t measured.',
    ],
  },

  comparison: {
    title: 'Ways to keep the DOM in sync with state',
    headers: ['', 'Manual DOM updates', 'Rebuild with `innerHTML`', 'Virtual DOM (Vue)', 'Compiled direct updates'],
    rows: [
      ['Who works out what changed', 'you, by hand', 'nobody — rebuild it all', 'Vue diffs vnode trees, guided by compiler hints', 'the compiler generates per-binding updates'],
      ['Keeps focus, input text, scroll', 'yes, if careful', 'no — elements are recreated', 'yes — elements are patched in place', 'yes'],
      ['Code style', 'imperative', 'string templates', 'declarative templates', 'declarative templates'],
      ['Extra work per update', 'only your code', 're-create and re-parse everything', 'render + diff the changed components', 'small bookkeeping'],
      ['Typical risk', 'forgetting an update', 'lost state, XSS with untrusted HTML', 'broad dependencies, unstable props', 'depends on the framework'],
    ],
    note: 'Some frameworks compile templates directly to DOM operations without a virtual DOM; Vue\'s experimental Vapor Mode explores the same idea. Which approach is "fastest" depends on the app and how it is measured — measure your own app instead of trusting generic claims.',
  },

  quiz: [
    {
      id: 'how-vue-updates-q1',
      type: 'mcq',
      prompt: 'What is a vnode?',
      options: [
        { text: 'A plain JavaScript object describing an element, component or text node' },
        { text: 'A real DOM element created off-screen', why: 'Vnodes aren\'t DOM elements at all; they are lightweight descriptions that point to the real element after mounting.' },
        { text: 'A compiled CSS rule', why: 'Vnodes describe structure and props, not styles.' },
        { text: 'A browser API for faster rendering', why: 'The virtual DOM is a pattern implemented in JavaScript by Vue, not a browser feature.' },
      ],
      answer: 0,
      explanation: 'Render functions return trees of vnodes. Vue compares old and new trees and applies the differences to the real DOM.',
    },
    {
      id: 'how-vue-updates-q2',
      type: 'output',
      prompt: '`count` changes and App re-renders. Does `Child` re-render?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
import Child from './Child.vue'
const count = ref(0)
const title = 'Dashboard'
</script>

<template>
  <p>{{ count }}</p>
  <button @click="count++">+1</button>
  <Child :title="title" />
</template>`,
      },
      options: [
        { text: 'No — its only prop has the same value as before' },
        { text: 'Yes — children always re-render with their parent', why: 'Vue compares the child\'s props first and skips it when nothing changed.' },
        { text: 'Yes — because `title` is not reactive', why: 'Non-reactive or not, the prop value is identical, so there is no reason to update.' },
        { text: 'Only in development builds', why: 'The props comparison works the same in production.' },
      ],
      answer: 0,
      explanation: 'A parent re-render reaches a child only through changed props or dynamic slots.',
    },
    {
      id: 'how-vue-updates-q3',
      type: 'output',
      prompt: 'Now the parent passes `:options="{ dense: isDense }"` to `Child`, where `isDense` is a ref that does **not** change. `count` changes. Does `Child` re-render?',
      code: {
        lang: 'vue',
        code: `<template>
  <p>{{ count }}</p>
  <Child :options="{ dense: isDense }" />
</template>`,
      },
      options: [
        { text: 'Yes — a new object is built on every parent render' },
        { text: 'No — the object has the same contents', why: 'Props are compared by identity (`!==`), not by contents.' },
        { text: 'No — objects are passed by reference', why: 'They are, but the literal creates a *new* reference each render.' },
        { text: 'Only if Child uses `options.dense`', why: 'The decision is made from the props comparison, before the child renders.' },
      ],
      answer: 0,
      explanation: 'An object literal that contains a variable is rebuilt on every render, so the prop is "new" each time. Use a computed (or pass `:dense="isDense"` as a primitive) to keep it stable. Literals made only of constants are treated as static by the compiler and don\'t have this problem.',
    },
    {
      id: 'how-vue-updates-q4',
      type: 'bug',
      prompt: 'Every time the list updates, every row is destroyed and recreated (inputs inside rows lose their text). Click the line responsible.',
      code: {
        lang: 'vue',
        code: `<template>
  <ul>
    <li
      v-for="todo in todos"
      :key="Math.random()"
    >
      <input v-model="todo.text" />
    </li>
  </ul>
</template>`,
      },
      answerLine: 5,
      explanation: 'A random key is different on every render, so Vue thinks every row is new. Use a stable unique id: `:key="todo.id"`.',
    },
    {
      id: 'how-vue-updates-q5',
      type: 'fill',
      prompt: 'Fill the blanks.',
      code: {
        lang: 'text',
        code: `Vue compiles templates into ___ functions.
They return trees of ___ nodes, which Vue diffs and patches into the real DOM.`,
      },
      answer: [['render'], ['virtual', 'v']],
      explanation: 'Templates → render functions → virtual nodes (vnodes) → patch → DOM.',
    },
    {
      id: 'how-vue-updates-q6',
      type: 'mcq',
      prompt: 'What does a patch flag such as `3 /* TEXT, CLASS */` in compiled output tell the runtime?',
      options: [
        { text: 'Only this node\'s text and class can change, so only those need comparing' },
        { text: 'The node must be re-created three times', why: 'It\'s a bit mask describing which parts are dynamic, not a count.' },
        { text: 'The node is static and never updates', why: 'Static content is marked as cached (-1), not with TEXT/CLASS.' },
        { text: 'The node has three children', why: 'Patch flags describe dynamic bindings, not the number of children.' },
      ],
      answer: 0,
      explanation: 'Patch flags let the patcher skip work on bindings that can\'t change. They are a compiler-to-runtime hint and an internal detail.',
    },
    {
      id: 'how-vue-updates-q7',
      type: 'short',
      prompt: 'Is the virtual DOM "faster than the real DOM"? Give a nuanced answer.',
      answer: 'Not inherently. Rendering vnodes and diffing them is extra work compared with perfectly hand-written DOM updates. Its value is that you write declarative UI for the whole state while Vue computes a small set of DOM changes, which is usually fast enough and much easier to keep correct. Vue reduces the overhead with compiler hints (patch flags, static caching, blocks) and per-component re-rendering. Whether something is fast should be measured, not assumed.',
    },
  ],

  exercises: [
    {
      id: 'stop-recreating',
      title: 'Stop recreating the input',
      difficulty: 'intermediate',
      prompt: `
Someone "fixed" a username field by forcing the form to re-render on every keystroke. Now the input is replaced while you type, so the browser loses focus and cursor position.

- Typing into \`class="username"\` must keep the **same \`<input>\` element**.
- \`class="hint"\` must still update: **Looks good** for 3+ characters of a–z, 0–9 or _, otherwise **At least 3 characters: a–z, 0–9, _**.
- \`class="preview"\` shows **@username**.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

const username = ref('')
const renderKey = ref(0)
const valid = computed(() => /^[a-z0-9_]{3,}$/.test(username.value))

function onInput(event) {
  username.value = event.target.value
  renderKey.value++ // "force the form to refresh so the hint updates"
}
</script>

<template>
  <div class="form" :key="renderKey">
    <input class="username" :value="username" @input="onInput" />
    <p class="hint">{{ valid ? 'Looks good' : 'At least 3 characters: a–z, 0–9, _' }}</p>
    <p class="preview">@{{ username }}</p>
  </div>
</template>`,
      },
      hints: [
        'Why would the hint need "forcing"? It reads `valid`, a computed — reactive already.',
        'A changing `:key` on the wrapper tells Vue to throw away the whole `<div>`, input included, on every keystroke.',
        'Delete `renderKey` and the `:key` binding (and the line that increments it).',
      ],
      solution: {
        explanation: 'Reactive bindings already patch the hint and preview text when `username` changes. The forced key made Vue unmount and remount the whole form on every keystroke — new elements, lost focus. Without it, Vue patches two text nodes and leaves the input alone.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const username = ref('')
const valid = computed(() => /^[a-z0-9_]{3,}$/.test(username.value))

function onInput(event) {
  username.value = event.target.value
}
</script>

<template>
  <div class="form">
    <input class="username" :value="username" @input="onInput" />
    <p class="hint">{{ valid ? 'Looks good' : 'At least 3 characters: a–z, 0–9, _' }}</p>
    <p class="preview">@{{ username }}</p>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'typing keeps the same input element', code: `const before = find('.username'); await type('.username', 'ad'); expect(find('.username') === before).toBe(true)` },
        { name: 'the hint updates', code: `await type('.username', 'ad'); expect(text('.hint')).toContain('At least'); await type('.username', 'ada_99'); expect(text('.hint')).toBe('Looks good')` },
        { name: 'the preview updates', code: `await type('.username', 'grace'); expect(text('.preview')).toBe('@grace')` },
      ],
    },
    {
      id: 'reset-with-key',
      title: 'Reset a child when the record changes',
      difficulty: 'intermediate',
      prompt: `
\`CommentBox\` keeps a local draft. When you switch to another post, the old draft is still there — Vue reused the same component instance and only patched its \`post\` prop.

- Clicking \`class="post-1"\` / \`class="post-2"\` selects a post.
- After switching posts, the textarea \`class="draft"\` must be **empty**.
- \`class="target"\` shows **Commenting on: <title>**.
- Make the change in **App.vue**.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'
import CommentBox from './CommentBox.vue'

const posts = [
  { id: 1, title: 'First post' },
  { id: 2, title: 'Second post' },
]
const selectedId = ref(1)
const selected = computed(() => posts.find((p) => p.id === selectedId.value))
</script>

<template>
  <button class="post-1" @click="selectedId = 1">First post</button>
  <button class="post-2" @click="selectedId = 2">Second post</button>
  <CommentBox :post="selected" />
</template>`,
        'CommentBox.vue': `<script setup>
import { ref } from 'vue'

defineProps({ post: { type: Object, required: true } })
const draft = ref('')
</script>

<template>
  <p class="target">Commenting on: {{ post.title }}</p>
  <textarea class="draft" v-model="draft"></textarea>
</template>`,
      },
      hints: [
        'Same component, same position: Vue keeps the instance and its `draft` ref. What would make Vue treat it as a *different* component?',
        'A `key` gives a vnode identity. If the key changes, Vue unmounts the old instance and mounts a new one.',
        'Write `<CommentBox :key="selected.id" :post="selected" />`.',
      ],
      solution: {
        explanation: 'With `:key="selected.id"`, switching posts changes the key, so Vue unmounts the old CommentBox and mounts a fresh one: `setup()` runs again and `draft` starts empty. The trade-off: everything inside is recreated (cheap here). A more surgical alternative is a `watch(() => props.post.id, () => (draft.value = \'\'))` inside the child, which keeps the instance.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import CommentBox from './CommentBox.vue'

const posts = [
  { id: 1, title: 'First post' },
  { id: 2, title: 'Second post' },
]
const selectedId = ref(1)
const selected = computed(() => posts.find((p) => p.id === selectedId.value))
</script>

<template>
  <button class="post-1" @click="selectedId = 1">First post</button>
  <button class="post-2" @click="selectedId = 2">Second post</button>
  <CommentBox :key="selected.id" :post="selected" />
</template>`,
          'CommentBox.vue': `<script setup>
import { ref } from 'vue'

defineProps({ post: { type: Object, required: true } })
const draft = ref('')
</script>

<template>
  <p class="target">Commenting on: {{ post.title }}</p>
  <textarea class="draft" v-model="draft"></textarea>
</template>`,
        },
      },
      tests: [
        { name: 'shows the selected post', code: `expect(text('.target')).toBe('Commenting on: First post'); await click('.post-2'); expect(text('.target')).toBe('Commenting on: Second post')` },
        { name: 'switching posts clears the draft', code: `await type('.draft', 'Great post!'); await click('.post-2'); expect(find('.draft').value).toBe('')` },
        { name: 'staying on the same post keeps the draft', code: `await type('.draft', 'Hello'); await click('.post-1'); expect(find('.draft').value).toBe('Hello')` },
      ],
    },
  ],

  interview: [
    {
      id: 'how-vue-updates-what-is-vdom',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the virtual DOM, and why does Vue use one?',
      answer: 'The virtual DOM is a tree of plain JavaScript objects (vnodes) describing what the UI should look like. On each update a component re-renders a new tree; Vue diffs it against the previous one and applies only the differences to the real DOM. It lets you write declarative templates for the whole state while Vue works out a small set of DOM changes and preserves element state like focus and input text.',
      explanation: 'Describe everything, change little. Cheap JavaScript comparisons stand in for expensive or state-destroying DOM rebuilds.',
      whyAsked: 'A fundamental question; the depth of the answer reveals how well the candidate understands rendering.',
      mistakes: ['Claiming the virtual DOM is always faster than direct DOM manipulation.', 'Saying Vue re-renders the whole page on every change.', 'Not mentioning patching/diffing.'],
      followUps: ['What does Vue\'s compiler add on top?', 'When does a child component re-render?', 'What role do keys play?'],
      modelAnswer: 'The virtual DOM is an in-memory description of the UI as plain objects called vnodes; templates compile to render functions that return them. When state changes, the affected component renders a new vnode tree, Vue compares it with the previous tree and patches only the differences into the real DOM. The benefit is declarative code — I describe the UI for the current state — without rebuilding elements and losing focus or input state. It isn\'t free: rendering and diffing cost something, which is why Vue\'s compiler adds hints like patch flags and static caching, and why re-renders are scoped per component.',
    },
    {
      id: 'how-vue-updates-child-rerender',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'When does a child component re-render in Vue 3?',
      options: [
        'Whenever its parent re-renders',
        'When its own reactive dependencies change, or the parent passes changed props (shallow comparison) or dynamic slot content',
        'Only when you call $forceUpdate()',
        'On every state change anywhere in the app',
      ],
      correctOption: 1,
      answer: 'A child re-renders when reactive state its own render read changes, or when its parent re-renders and passes props that changed (each compared with `!==`, so new objects count) or slot content that can change. A parent re-render alone doesn\'t re-render children whose props are the same.',
      explanation: 'Re-rendering is per component; props are the bridge.',
      whyAsked: 'Essential for reasoning about performance and unexpected renders.',
      mistakes: ['"Children always re-render with the parent" (React-style mental model).', 'Forgetting that new object/array props count as changes.'],
      followUps: ['How would you verify it?', 'Why does `:filters="{ category }"` cause re-renders but `:filters="{ size: \'s\' }"` doesn\'t?'],
      modelAnswer: 'Each component has its own render effect, so a child re-renders when reactive state read during its render changes. When a parent re-renders, Vue compares the child\'s new props with the old ones, shallowly — if all are identical and there are no dynamic slots, the child is skipped. That\'s why passing an object literal built from variables, or a filtered array, as a prop makes the child re-render every time, even with identical contents — constant-only literals are an exception the compiler treats as static. I\'d verify with onUpdated or onRenderTriggered in development.',
    },
    {
      id: 'how-vue-updates-compiler-informed',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Vue describes its renderer as a "compiler-informed virtual DOM". What does the compiler contribute?',
      answer: 'Because Vue compiles templates, the compiler can annotate the render function: patch flags say which parts of a node are dynamic (text, class, specific props) so only those are compared; static content is created once and reused (hoisted in older versions, cached since 3.5) and skipped during diffing; blocks collect dynamic descendants into a flat array so updates skip static structure, with v-if/v-for starting new blocks; and inline event handlers are cached so children don\'t see new function props. Hand-written render functions generally don\'t get these hints.',
      explanation: 'A plain virtual DOM must assume anything can change; a compiled template knows what can.',
      whyAsked: 'Tests depth on Vue\'s internals and whether the candidate can separate concept from implementation detail.',
      mistakes: ['Inventing benchmark numbers.', 'Treating flag values as public API.', 'Claiming render functions are faster because they skip compilation.'],
      followUps: ['Where can you see compiled output?', 'Why do v-if and v-for start new blocks?'],
      modelAnswer: 'A classic virtual DOM diffs whole trees because it can\'t know what will change. Vue compiles templates, so the compiler tells the runtime. Patch flags mark exactly which bindings are dynamic on each node, static subtrees are created once and skipped, and blocks flatten all dynamic descendants into one array so an update walks only those — structural directives like v-if and v-for start new blocks because they change shape. It also caches inline handlers so child props stay stable. These are internals — 3.5 switched from hoisting to caching static nodes, for example — but the takeaway is that templates get optimisations hand-written render functions don\'t.',
    },
    {
      id: 'how-vue-updates-faster',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'A colleague says "the virtual DOM makes Vue faster than plain JavaScript". How do you respond?',
      answer: 'Not quite. Perfectly hand-written DOM updates do less work than render + diff + patch. The virtual DOM\'s advantage is that declarative code stays correct and reasonably efficient without hand-writing every update; Vue narrows the cost with per-component re-rendering and compiler hints. Some frameworks compile templates to direct DOM updates instead. For real decisions, measure your own app.',
      explanation: 'Correctness and productivity at a usually-acceptable cost, not magic speed.',
      whyAsked: 'Checks for nuanced, non-dogmatic thinking about performance claims.',
      mistakes: ['Agreeing uncritically.', 'Dismissing the virtual DOM as "slow".', 'Quoting made-up numbers.'],
      followUps: ['How would you measure it in your app?', 'When might manual DOM work be justified?'],
      modelAnswer: 'I\'d push back gently. Ideal hand-written DOM code does strictly less work, because the virtual DOM adds a render and a diff. What the virtual DOM buys is that I can describe the UI declaratively for any state and still get a small set of DOM changes, which is much easier to keep correct. Vue reduces the overhead with compiler hints and per-component updates, and some frameworks skip the virtual DOM entirely by compiling to direct DOM updates. If performance matters, I\'d profile the specific screen — and for hot spots like a canvas or huge grid, imperative code inside a component can be justified.',
    },
    {
      id: 'how-vue-updates-key-reset',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A user edits a record in a detail panel, switches to another record, and the panel still shows the previous record\'s unsaved local edits. What\'s happening and what are your options?',
      answer: 'The panel is the same component type in the same place, so Vue reuses the instance and only patches its props; local state (refs created in setup) survives. Options: add `:key="record.id"` so a new instance is created per record (simple, resets everything, costs a remount), or watch the record id inside the panel and reset the local state explicitly (keeps the instance, more control — e.g. to warn about unsaved changes first).',
      explanation: 'Keys define identity; same identity means reuse.',
      whyAsked: 'A very common bug in master/detail UIs; tests understanding of instance reuse.',
      mistakes: ['Suggesting `v-if` toggling with `nextTick` hacks.', 'Not mentioning the remount cost or the unsaved-changes UX.'],
      followUps: ['How would you warn the user about unsaved changes?', 'What gets lost when the key changes?'],
      modelAnswer: 'Vue patches rather than recreates when the component type and key are the same, so the panel instance is reused and its local refs keep the old edits. The quickest fix is keying the panel by record id: switching records then unmounts and mounts a fresh instance, so setup runs again. If I need more control — say, asking about unsaved changes before switching — I\'d keep the instance and watch the id, resetting state explicitly. Either way the bug is about identity, not reactivity.',
    },
    {
      id: 'how-vue-updates-whole-app',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'An app has 30 components. A ref read only by `CartBadge` changes. How many components re-render?',
      options: ['All 30', 'Only CartBadge (plus any children whose props changed)', 'The root and CartBadge', 'None until the page reloads'],
      correctOption: 1,
      answer: 'Only `CartBadge` — the only component whose render read the ref — plus any of its children whose props change as a result. Vue tracks dependencies per component.',
      explanation: 'Fine-grained tracking scopes re-renders to the components that depend on the change.',
      whyAsked: 'A quick check of the per-component update model.',
      mistakes: ['Answering "all of them".', 'Assuming the root always re-renders.'],
      followUps: ['What if CartBadge passes a new object to its children?', 'What if the root also reads that ref?'],
      modelAnswer: 'Just CartBadge. Each component has its own render effect, and only effects that read the ref are notified. Its children would re-render only if the props it passes them change. If the root also read the ref, it would re-render too, but its other children would still be skipped if their props are unchanged.',
    },
    {
      id: 'how-vue-updates-coding-boundary',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Every clock tick re-renders App, including its 200-product list. Move the clock into **Clock.vue** so ticks re-render only the clock. `Clock.vue` must own the seconds and the **Tick** button (`class="tick"`) and show `class="seconds"` as **Ns**. App must render `<Clock />` and the products (`class="product"`).',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, onUpdated } from 'vue'
import Clock from './Clock.vue'
import { countUpdate } from './stats.js'

${productsList}
const seconds = ref(0)

onUpdated(() => countUpdate('App'))
</script>

<template>
  <p class="seconds">{{ seconds }}s</p>
  <button class="tick" @click="seconds++">Tick</button>
  <ul>
    <li v-for="p in products" :key="p.id" class="product">{{ p.name }}</li>
  </ul>
</template>`,
          'Clock.vue': `<script setup>
// TODO: move the clock (state + Tick button) here
</script>

<template>
  <span></span>
</template>`,
          'stats.js': statsJs,
        },
      },
      tests: [
        { name: 'ticking updates the clock', code: `await click('.tick'); await click('.tick'); expect(text('.seconds')).toBe('2s')` },
        { name: 'ticking does not re-render App', code: `await click('.tick'); await click('.tick'); await click('.tick'); const { updates } = requireModule('stats.js'); expect(updates.App || 0).toBe(0)` },
        { name: 'the products still render', code: `expect(findAll('.product')).toHaveLength(200)` },
      ],
      hints: [
        'Whoever reads `seconds` in its render re-renders on each tick. Today that\'s App.',
        'Move the `seconds` ref, the `<p class="seconds">` and the Tick button into Clock.vue.',
        'App\'s template becomes `<Clock />` followed by the list; App no longer needs `ref`.',
      ],
      answer: 'Move the fast-changing state and the markup that reads it into its own component, so only that component depends on it.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { onUpdated } from 'vue'
import Clock from './Clock.vue'
import { countUpdate } from './stats.js'

${productsList}

onUpdated(() => countUpdate('App'))
</script>

<template>
  <Clock />
  <ul>
    <li v-for="p in products" :key="p.id" class="product">{{ p.name }}</li>
  </ul>
</template>`,
          'Clock.vue': `<script setup>
import { ref } from 'vue'

const seconds = ref(0)
</script>

<template>
  <p class="seconds">{{ seconds }}s</p>
  <button class="tick" @click="seconds++">Tick</button>
</template>`,
          'stats.js': statsJs,
        },
      },
      explanation: 'Re-rendering is scoped per component. Once `seconds` is read only by Clock, a tick re-renders the clock\'s two nodes and App\'s list is never even rendered again, let alone diffed.',
      whyAsked: 'Component boundaries are the first and cheapest performance tool in Vue; this checks that the candidate reaches for them.',
      mistakes: ['Keeping `seconds` in App and passing it as a prop (App still re-renders).', 'Reaching for v-memo or v-once on the list first.', 'Moving the list instead of the clock without considering what changes.'],
      followUps: ['What if the parent also needs to know the seconds?', 'How would you measure the difference in a real browser?'],
      modelAnswer: 'The component that reads fast-changing state is the one that re-renders, so I move the seconds ref and the markup that shows it — plus the Tick button — into Clock.vue. App then just renders <Clock /> and the list, and a tick only re-renders Clock. If App needed the value too, I\'d think again: maybe a store read only where it\'s displayed. I\'d confirm with an update counter or onRenderTriggered, and on a real page with the Performance panel.',
    },
  ],

  takeaways: [
    'Templates compile to render functions that return vnodes; Vue diffs new vs old trees and patches only the differences.',
    'Each component re-renders on its own: for its own dependencies, changed props (shallow, by identity) or dynamic slots.',
    'A parent re-render skips children whose props didn\'t change — new objects/arrays/functions do count as changes.',
    'Same type + same key → patch in place (state kept); different key → replace (state lost).',
    'The compiler adds hints — patch flags, static caching, blocks, cached handlers — that hand-written render functions don\'t get.',
    'The virtual DOM trades a little work for declarative correctness; measure before optimising.',
  ],
}
