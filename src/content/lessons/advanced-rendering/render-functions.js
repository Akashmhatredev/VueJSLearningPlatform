// Lesson: Render functions, h() & JSX.

const productApp = `<script setup>
import Breadcrumbs from './Breadcrumbs.js'
import Heading from './Heading.js'
</script>

<template>
  <Breadcrumbs>
    <a href="#home">Home</a>
    <a href="#gear">Gear</a>
    <span>Backpacks</span>
  </Breadcrumbs>

  <Heading :level="2" text="Trail Backpack" />
  <p>Light, tough and ready for the weekend.</p>
</template>

<style>
.breadcrumbs ol {
  display: flex;
  gap: 6px;
  list-style: none;
  padding: 0;
}
.sep {
  margin-left: 6px;
  color: #888;
}
.anchor {
  margin-left: 8px;
  color: #aaa;
  text-decoration: none;
}
.badge {
  background: #dcff1e;
  border: 2px solid #1a1a1a;
  padding: 0 6px;
  font-weight: 700;
}
</style>`

const breadcrumbsFile = `import { h, Comment } from 'vue'

export default {
  name: 'Breadcrumbs',
  props: {
    separator: { type: String, default: '›' },
  },
  setup(props, { slots }) {
    // setup runs once; the function it returns runs on every render
    return () => {
      // the slot's vnodes, minus placeholders such as a false v-if
      const items = (slots.default?.() ?? []).filter((vnode) => vnode.type !== Comment)

      return h('nav', { class: 'breadcrumbs', 'aria-label': 'Breadcrumb' }, [
        h(
          'ol',
          items.map((child, i) =>
            h('li', { key: i, class: 'crumb' }, [
              child,
              i < items.length - 1
                ? h('span', { class: 'sep', 'aria-hidden': 'true' }, props.separator)
                : null,
            ])
          )
        ),
      ])
    }
  },
}`

const headingFile = `import { h } from 'vue'

// A heading whose tag (h1–h6) comes from a prop, plus a "#" link to itself.
export default {
  name: 'Heading',
  props: {
    level: { type: Number, default: 2 },
    text: { type: String, required: true },
  },
  setup(props) {
    return () => {
      const slug = props.text.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      return h('h' + props.level, { id: slug, class: 'heading' }, [
        props.text,
        h('a', { href: '#' + slug, class: 'anchor', 'aria-label': 'Link to this section' }, '#'),
      ])
    }
  },
}`

const badgeStub = `import { h } from 'vue'

// TODO: a functional component — (props, { slots }) => vnode
// Render <span class="badge badge-{tone}"> containing the default slot.
export default function Badge() {
  return null
}`

export default {
  id: 'render-functions',
  title: 'Render functions, h() & JSX',
  summary: 'Describe UI directly in JavaScript with h() — the thing templates compile to — for the rare cases where a template is too rigid, plus functional components and optional JSX.',
  difficulty: 'advanced',
  minutes: 42,
  prerequisites: ['slots', 'single-file-components', 'props'],
  related: ['compiler-macros', 'how-vue-updates', 'scoped-slots', 'recursive-components', 'custom-directives'],
  tags: ['render function', 'h()', 'vnode', 'virtual DOM', 'JSX', 'TSX', 'functional component', 'slots', 'resolveComponent', 'withModifiers', 'withDirectives'],
  apis: [
    { name: 'h(type, props?, children?)', summary: 'Creates a vnode: `type` is a tag name or a component; `props` holds attributes, DOM props and `onXxx` listeners; `children` is a string, an array, or (for components) an object of slot functions.' },
    { name: 'setup() → () => vnode', summary: 'Returning a function from `setup` makes it the component\'s render function. It re-runs on every update; `setup` itself runs once.' },
    { name: 'functional component', summary: 'A plain function `(props, { slots, emit, attrs }) => vnode` with no instance, state or lifecycle hooks.' },
    { name: 'resolveComponent(name)', summary: 'Looks up a globally registered component by name inside `setup` or a render function.' },
    { name: 'withModifiers(fn, mods)', summary: 'Wraps an event handler with template-style modifiers like `self` or `prevent`.' },
    { name: 'withDirectives(vnode, dirs)', summary: 'Applies custom directives to a vnode in a render function.' },
  ],
  docs: [
    { label: 'Vue Guide — Render Functions & JSX', url: 'https://vuejs.org/guide/extras/render-function.html' },
    { label: 'API — Render Function APIs (h, …)', url: 'https://vuejs.org/api/render-function.html' },
    { label: 'Vue Guide — Rendering Mechanism', url: 'https://vuejs.org/guide/extras/rendering-mechanism.html' },
    { label: 'Vue JSX Babel plugin', url: 'https://github.com/vuejs/babel-plugin-jsx' },
  ],

  intro: `
Every Vue template is turned into a JavaScript function — a **render function** — that returns a description of the UI. Usually the compiler writes that function for you. This lesson is about writing it **yourself**, with Vue's \`h()\` helper.

\`h('p', { class: 'note' }, 'Hello')\` doesn't create a paragraph. It creates a **vnode** (virtual node): a small JavaScript object that *describes* a paragraph. Your render function returns a tree of these, and Vue turns it into real DOM — exactly as it does for templates.

Templates remain the right choice for almost all UI. Render functions are the escape hatch for the cases where you need the full power of JavaScript to decide what to render — and they're how many component libraries are built. You'll also meet **functional components** and, briefly, **JSX**.
`,

  why: `
Templates are deliberately limited: they describe structure declaratively, which makes them easy to read and lets Vue's compiler optimise them. But a few problems don't fit that shape:

- **Inspecting or wrapping slot children.** A \`<Breadcrumbs>\` component that puts a separator *between* whatever links you pass in needs to loop over the slot's children — a template can only render a slot as one block.
- **Highly dynamic structure.** A tag name, a component, or a whole subtree chosen by logic that's awkward to express with \`v-if\` chains.
- **Library and design-system code** that must handle many variations, or wrap and re-emit other components' vnodes.
- **Programmatic generation** of UI from configuration (form builders, table renderers).

In those cases JavaScript's \`map\`, \`filter\`, ternaries and functions are simply better tools than directives. Render functions give you that, while keeping Vue's reactivity and efficient updates.
`,

  eli15: `
A template is like a **form** you fill in to order a custom pizza: tick "extra cheese", write the size in the box. It's quick and clear, but you can only order what the form has boxes for.

A render function is like **writing your own instructions** to the chef: "for each topping in my list, put it on the left half, unless it's olives". More work to write, but you can describe anything.

Either way, the chef (Vue) gets the same kind of order — a **list of instructions describing the pizza**, called a *virtual DOM*. \`h()\` is how you write one instruction: \`h('p', 'Hi')\` means "a paragraph that says Hi". The chef then makes the real pizza (the actual page), and when your instructions change, the chef only fixes the parts that are different.
`,

  analogy: {
    title: 'An order form vs. writing to the chef',
    body: `
Most customers use the order form — fast, readable, hard to get wrong, and the kitchen has optimised its workflow around it. Occasionally a customer needs something the form can't express, so they write the instructions out longhand.

Templates are the order form: the compiler knows exactly which boxes can change and prepares accordingly. Render functions are longhand instructions: total flexibility, but the kitchen can't pre-plan as much, and every reader has to work harder to understand the order.
`,
    mapping: [
      ['the order form', 'a template'],
      ['longhand instructions', 'a hand-written render function using `h()`'],
      ['one line of instruction', 'a vnode created by `h(type, props, children)`'],
      ['the kitchen pre-planning for the form', 'compiler optimisations (static caching, patch flags) templates get for free'],
      ['the chef only fixing what changed', 'Vue diffing the new vnode tree against the old one and patching the DOM'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Two roads to the same vnode tree',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'tpl', label: '<template>', note: 'what you usually write', tone: 'paper', x: 100, y: 70 },
        { id: 'compiler', label: 'template compiler', note: 'build step', tone: 'kraft', x: 300, y: 70 },
        { id: 'hand', label: 'your h() calls', note: 'render function you write', tone: 'cobalt', x: 200, y: 230 },
        { id: 'render', label: 'render function', note: 'runs on every update', tone: 'acid', x: 480, y: 150 },
        { id: 'vnodes', label: 'vnode tree', note: '{ type, props, children }', tone: 'acid', x: 640, y: 70 },
        { id: 'dom', label: 'real DOM', note: 'patched by diff', tone: 'ink', x: 660, y: 230 },
      ],
      edges: [
        { from: 'tpl', to: 'compiler' },
        { from: 'compiler', to: 'render', label: 'generates' },
        { from: 'hand', to: 'render', label: 'you write' },
        { from: 'render', to: 'vnodes', label: 'returns' },
        { from: 'vnodes', to: 'dom', label: 'mount / patch' },
      ],
      steps: [
        { focus: ['tpl', 'compiler'], edges: ['tpl->compiler'], text: 'Normally you write a template. At build time, the compiler reads it — and because it can see which parts are static and which are dynamic, it can generate optimised code.' },
        { focus: ['render'], edges: ['compiler->render'], text: 'The output is a **render function**: JavaScript that returns vnodes. Every component has one, whether you wrote a template or not.' },
        { focus: ['hand'], edges: ['hand->render'], text: 'You can also write that function yourself, calling `h()` to create vnodes. Now you have all of JavaScript — `map`, `filter`, ternaries, helper functions — to decide what to render.' },
        { focus: ['vnodes'], edges: ['render->vnodes'], text: 'Either way, calling the render function produces a **vnode tree**: plain objects describing elements, components and text.' },
        { focus: ['dom'], edges: ['vnodes->dom'], text: 'Vue mounts the tree as real DOM. On updates it calls the render function again, compares the new tree with the old one, and patches only the differences.' },
      ],
    },
    caption: 'Templates and hand-written `h()` calls both end as render functions returning vnodes.',
    alt: 'A diagram: a template goes through the template compiler to a render function; alternatively, hand-written h() calls go directly to the render function. The render function returns a vnode tree, which Vue mounts and patches into the real DOM.',
  },

  animation: {
    type: 'vdom',
    props: { preset: 'list' },
    title: 'What happens with the vnodes you return',
    caption: 'Your render function returns a new vnode tree on every update. Step through how Vue compares it with the previous tree and turns the differences into a short list of DOM patches — keys tell it which list items are the same.',
    alt: 'A conceptual virtual DOM diff: an old vnode tree and a new vnode tree for a list side by side, with changed nodes highlighted and the resulting list of DOM operations.',
  },

  syntax: [
    `
#### \`h()\` — creating vnodes
`,
    {
      code: `import { h } from 'vue'

h('div')                                    // <div></div>
h('p', 'Hello')                             // children as text
h('p', { class: 'note', id: 'tip' }, 'Hi')  // props + text
h('ul', [h('li', 'One'), h('li', 'Two')])   // children as an array
h('div', { class: ['card', { active: isActive }], style: { color: 'red' } })
h('button', { onClick: save, disabled: busy }, 'Save')   // listeners are onXxx
h(UserCard, { user, onSelect: pick })                     // a component + its props/events`,
      lang: 'js',
      title: 'the shapes of h()',
    },
    `
#### A component with a render function

Return a **function** from \`setup\`. \`setup\` runs once; the returned function runs on every render, so it always reads current props and state:
`,
    {
      code: `// Counter.js
import { h, ref } from 'vue'

export default {
  props: { step: { type: Number, default: 1 } },
  emits: ['change'],
  setup(props, { emit, slots }) {
    const count = ref(0)
    const add = () => {
      count.value += props.step
      emit('change', count.value)
    }
    return () =>
      h('div', { class: 'counter' }, [
        h('span', count.value),
        h('button', { onClick: add }, slots.default?.() ?? '+'),
      ])
  },
}`,
      lang: 'js',
      title: 'Counter.js',
    },
    `
#### Template features → JavaScript

| template | render function |
|---|---|
| \`v-if\` / \`v-else\` | a ternary or \`if\` |
| \`v-for\` with \`:key\` | \`array.map((item) => h('li', { key: item.id }, …))\` |
| \`@click\` | \`onClick\` (\`.capture\`/\`.once\`/\`.passive\` → \`onClickCapture\`, \`onClickOnce\`…) |
| \`@click.self\` and other modifiers | \`onClick: withModifiers(handler, ['self'])\` |
| \`v-model\` on a component | \`modelValue\` + \`'onUpdate:modelValue'\` props |
| rendering a slot | \`slots.default?.()\`, \`slots.footer?.({ text })\` |
| passing slots to a child | \`h(Card, null, { default: () => …, header: () => … })\` |
| a custom directive | \`withDirectives(h('input'), [[vFocus]])\` |
| a globally registered component | \`h(resolveComponent('AppButton'))\` |
`,
    {
      code: `// <Card v-model="title"><template #header="{ size }">Hi {{ size }}</template></Card>
h(Card, {
  modelValue: title.value,
  'onUpdate:modelValue': (value) => (title.value = value),
}, {
  header: ({ size }) => h('span', 'Hi ' + size),   // slots are FUNCTIONS
})`,
      lang: 'js',
      title: 'v-model and scoped slots in h()',
    },
    `
#### Functional components

When a component needs no state, it can be a plain function: props in, vnodes out. There's no instance, no \`this\`, no lifecycle hooks.
`,
    {
      code: `import { h } from 'vue'

function Badge(props, { slots, emit, attrs }) {
  return h('span', { class: ['badge', 'badge-' + props.tone] }, slots.default?.())
}
Badge.props = ['tone']
Badge.emits = []

export default Badge`,
      lang: 'js',
      title: 'Badge.js — a functional component',
    },
    `
**The rules:**

1. Return a **function** from \`setup\`, not a vnode — and read props *inside* it, so each render sees fresh values.
2. **Vnodes must be unique** in a tree. Need the same element twice? Call a factory function twice instead of reusing one vnode.
3. Slots are **functions**: call them to get vnodes. When passing slots to a component, put \`null\` (or a props object) as the second argument so the slot object isn't mistaken for props.
4. List items need **keys**, exactly as with \`v-for\`.
5. Built-in components (\`Transition\`, \`KeepAlive\`, \`Teleport\`…) must be **imported** to be used in \`h()\`.
`,
    `
#### JSX (optional)

JSX is an XML-like syntax that compiles to \`h()\`-style calls. It needs a build plugin — for Vite, \`@vitejs/plugin-vue-jsx\` (based on Vue's JSX Babel plugin) — so it **can't run in this sandbox**:
`,
    {
      code: `// Greeting.jsx — needs @vitejs/plugin-vue-jsx in your build
import { defineComponent, ref } from 'vue'

export default defineComponent({
  props: { name: String },
  setup(props) {
    const shown = ref(true)
    return () => (
      <div class="greeting">            {/* class, not className */}
        {shown.value && <p>Hello, {props.name}!</p>}
        <button onClick={() => (shown.value = !shown.value)}>Toggle</button>
      </div>
    )
  },
})`,
      lang: 'jsx',
      title: 'Vue JSX (static example)',
      static: true,
    },
    {
      callout: 'note',
      title: 'Vue JSX is not React JSX',
      text: 'It compiles to Vue vnodes, accepts normal HTML attribute names like `class` and `for`, and passes slots as objects of functions. Vue\'s JSX plugin also understands some directive syntax (such as `v-show` and `v-model`). Check the plugin docs for the exact features of the version you install.',
    },
  ],

  walkthrough: {
    title: 'Breadcrumbs.js',
    lang: 'js',
    code: breadcrumbsFile,
    intro: 'A component a template can\'t easily express: it takes whatever links you put in its slot and places a separator **between** them. Step through it.',
    steps: [
      { lines: [1], text: '`h` creates vnodes. `Comment` is the vnode type Vue uses for placeholders — for example where a `v-if` is currently false.' },
      { lines: [3, 7], text: 'A normal component definition in a `.js` file: a name and a `separator` prop with a default. No template — so we must provide a render function.' },
      { lines: [8, 10], text: '`setup` receives props and the context (`slots`, `emit`, `attrs`). It runs **once**. Returning a **function** makes that function the render function, which runs on every update.' },
      { lines: [11, 12], text: '`slots.default?.()` calls the default slot and returns an array of vnodes — the `<a>` and `<span>` elements App passed in. We drop `Comment` placeholders so a hidden crumb doesn\'t get a separator.' },
      { lines: [14, 16], text: 'The outer structure: `h(\'nav\', props, children)` containing an `<ol>`. Attributes such as `aria-label` go in the props object, just like in a template.' },
      { lines: [17, 19], text: 'The `v-for` equivalent: `items.map(…)` wraps each slot child in its own `<li>` with a `key`. This is the part templates can\'t do: they can render a slot, but not loop over its children.' },
      { lines: [20, 22], text: 'The `v-if` equivalent: a ternary adds a separator after every crumb except the last. `null` children render nothing.' },
    ],
  },

  playground: {
    title: 'Product page parts',
    objective: 'Read and change real render functions: add attributes conditionally, clamp a dynamic tag, emit an event, and write a functional component.',
    files: { 'App.vue': productApp, 'Breadcrumbs.js': breadcrumbsFile, 'Heading.js': headingFile, 'Badge.js': badgeStub },
    expected: 'Breadcrumbs **Home › Gear › Backpacks**, an `<h2>` "Trail Backpack" with a faint **#** link, and a line of text. Inspect the DOM: the breadcrumbs are a `nav > ol > li` list built entirely by `Breadcrumbs.js`. `Badge.js` is an empty stub for now.',
    experiments: [
      {
        id: 'aria-current',
        task: 'Accessibility: give the **last** crumb `aria-current="page"` (and no `aria-current` on the others).',
        hint: 'In the `h(\'li\', …)` props object, add `\'aria-current\': i === items.length - 1 ? \'page\' : undefined`. Props whose value is `undefined` are simply not rendered.',
        tests: [
          {
            name: 'only the last crumb is the current page',
            code: `const crumbs = findAll('.crumb')
expect(crumbs).toHaveLength(3)
expect(crumbs[2].getAttribute('aria-current')).toBe('page')
expect(crumbs[0].getAttribute('aria-current')).toBeNull()
expect(crumbs[1].getAttribute('aria-current')).toBeNull()`,
          },
        ],
        explain: 'A render function\'s props object is the equivalent of all the attribute bindings in a template — computed with plain JavaScript. `undefined` (or `null`) removes an attribute, like a falsy `:aria-current` binding would.',
      },
      {
        id: 'clamp-level',
        task: 'HTML only has `<h1>`–`<h6>`. Make Heading **clamp** its `level` prop so `level: 9` renders an `<h6>` and `level: 0` an `<h1>`.',
        hint: 'Compute `const level = Math.min(6, Math.max(1, props.level))` inside the render function, then use `h(\'h\' + level, …)`.',
        tests: [
          {
            name: 'level 9 renders h6, level 0 renders h1',
            code: `const deep = mountFile('Heading.js', { level: 9, text: 'Deep section' })
expect(deep.find('h6')).toBeTruthy()
const top = mountFile('Heading.js', { level: 0, text: 'Top' })
expect(top.find('h1')).toBeTruthy()`,
          },
        ],
        explain: 'The tag name is just a string you compute — no `v-if` chain of six headings. Doing the computation inside the returned function keeps it reactive: change the prop and the tag changes.',
      },
      {
        id: 'emit-copy',
        task: 'Make Heading emit a **`copy`** event with the slug when the **#** link is clicked (so a parent could copy the section link).',
        hint: 'Declare `emits: [\'copy\']`, take `emit` from `setup(props, { emit })`, and add `onClick: () => emit(\'copy\', slug)` to the anchor\'s props.',
        tests: [
          {
            name: 'clicking # emits copy with the slug',
            code: `const w = mountFile('Heading.js', { level: 2, text: 'Trail Backpack' })
await click(w.find('.anchor'))
expect(w.emitted('copy')).toHaveLength(1)
expect(w.emitted('copy')[0][0]).toBe('trail-backpack')`,
          },
        ],
        explain: '`@click` becomes an `onClick` prop, and `emit` comes from the setup context. Declaring `emits` works exactly as in an SFC — it documents the component and keeps `onCopy` out of fallthrough attributes.',
      },
      {
        id: 'functional-badge',
        task: 'Implement `Badge.js` as a **functional component**: render `<span class="badge badge-{tone}">` containing the default slot, declare a `tone` prop, and show `<Badge tone="sale">-20%</Badge>` under the heading in App.',
        hint: '`export default function Badge(props, { slots }) { return h(\'span\', { class: [\'badge\', \'badge-\' + props.tone] }, slots.default?.()) }`, then `Badge.props = [\'tone\']` (before the export, or by naming the function first). Import it in App.',
        tests: [
          {
            name: 'App shows a sale badge rendered by a functional component',
            code: `expect(exists('.badge.badge-sale')).toBe(true)
expect(text('.badge')).toBe('-20%')
expect(typeof requireModule('Badge.js').default).toBe('function')`,
          },
        ],
        explain: 'A functional component is just a function: Vue calls it with props and a context object, and uses the returned vnode. No instance is created, so it can\'t hold state or use lifecycle hooks — perfect for small presentational pieces.',
      },
    ],
  },

  internals: {
    beginner: `
Every component, in the end, is a function that says "here's what I look like right now" as a tree of little JavaScript objects (vnodes). When state changes, Vue calls that function again, gets a new tree, compares it with the previous one, and changes only the parts of the real page that differ. A template is just a nicer way of writing that function — the compiler converts it for you.
`,
    technical: [
      `
A **vnode** is a plain object. Simplified, it looks like \`{ type, props, children, key, el, shapeFlag, patchFlag }\` — \`type\` is a tag string, a component, or a special symbol (\`Fragment\`, \`Text\`, \`Comment\`); \`el\` is filled in with the real DOM node once mounted.

\`h()\` is a convenience wrapper: it figures out which arguments you passed (props? children? slots?) and calls Vue's internal \`createVNode()\`.
`,
      {
        code: `// A simplified model of h() — not Vue's real source
function h(type, propsOrChildren, children) {
  const isProps = propsOrChildren && typeof propsOrChildren === 'object'
    && !Array.isArray(propsOrChildren) && !isVNode(propsOrChildren)
  return isProps
    ? createVNode(type, propsOrChildren, children)
    : createVNode(type, null, propsOrChildren)
}`,
        lang: 'js',
        title: 'mental model of h()',
      },
      `
**How it becomes reactive:** the component's render function runs inside a reactive *effect*. Every reactive value it reads (props, refs, slots' content) is tracked; when one changes, the effect re-runs the render function and Vue patches the difference. That's why props must be read **inside** the returned function — reading them once in \`setup\` captures a snapshot.

**What templates give you that \`h()\` doesn't:** the template compiler emits extra hints. For this template:
`,
      {
        code: `// <div class="card"><h2>Cart</h2><p :class="{ empty: !count }">{{ count }} items</p></div>
// compiles (Vue 3.5) to roughly:
const _hoisted_1 = { class: "card" }
function render(_ctx, _cache) {
  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _cache[0] || (_cache[0] = _createElementVNode("h2", null, "Cart", -1 /* CACHED */)),
    _createElementVNode("p", { class: _normalizeClass({ empty: !_ctx.count }) },
      _toDisplayString(_ctx.count) + " items", 3 /* TEXT, CLASS */)
  ]))
}`,
        lang: 'js',
        title: 'real compiler output (Vue 3.5)',
      },
      `
The static \`<h2>\` is created once and cached; the \`<p>\` carries a **patch flag** (\`3\` = text and class may change), and blocks track which children are dynamic. Hand-written \`h()\` calls carry none of these hints, so the renderer must compare everything in those vnodes on each update. It's still fast for most components, but it's one reason the Vue docs recommend templates by default. More in [Compiler macros & template compilation](lesson:compiler-macros) and [How Vue updates the DOM](lesson:how-vue-updates).

**Functional components** skip the component instance entirely: Vue calls the function during rendering and uses its return value. With no instance there's no state to keep between renders and no lifecycle.
`,
    ],
    production: `
- **Default to templates.** Use render functions for components that genuinely need programmatic rendering (slot manipulation, generated structure, library internals) — and keep them small and well-tested.
- **Never create component definitions inside a render function.** \`h({ setup() {…} })\` with a fresh object on each render gives Vue a new component *type* every time, so it unmounts and remounts on every update, losing state. Define components once, at module level.
- **Slot content can be messy.** It may contain \`Comment\` placeholders (false \`v-if\`), \`Fragment\`s (from \`v-for\` or \`<template>\`), and text. Libraries that inspect slots filter and flatten them carefully.
- **TypeScript:** wrap components in \`defineComponent()\` for prop and slot type inference; TSX gets type checking of props through the JSX plugin.
- **JSX is a build-time choice.** It needs \`@vitejs/plugin-vue-jsx\` (or the Babel plugin); decide team-wide, since mixing styles hurts readability.
- **Keep render functions pure:** no side effects (API calls, state mutations) inside them — they can run many times.
`,
  },

  mistakes: [
    {
      title: 'Returning a vnode from setup instead of a function',
      wrong: { code: `setup(props) {\n  return h('p', props.message) // not a render function\n}`, lang: 'js' },
      right: { code: `setup(props) {\n  return () => h('p', props.message)\n}`, lang: 'js' },
      explanation: '`setup` runs once. Vue treats a returned function as the render function and calls it on every update; returning a vnode object isn\'t a render function at all, so the component can\'t render or update correctly.',
    },
    {
      title: 'Reading props outside the render function',
      wrong: { code: `setup(props) {\n  const label = props.label.toUpperCase() // snapshot, never updates\n  return () => h('button', label)\n}`, lang: 'js' },
      right: { code: `setup(props) {\n  return () => h('button', props.label.toUpperCase())\n}\n// or: const label = computed(() => props.label.toUpperCase())`, lang: 'js' },
      explanation: 'Only reads that happen while the render function runs are tracked. Derive values inside it, or with `computed()`.',
    },
    {
      title: 'Reusing the same vnode twice',
      wrong: { code: `const sep = h('span', { class: 'sep' }, '›')\nreturn h('p', ['Home', sep, 'Gear', sep, 'Bags'])`, lang: 'js' },
      right: { code: `const sep = () => h('span', { class: 'sep' }, '›')\nreturn h('p', ['Home', sep(), 'Gear', sep(), 'Bags'])`, lang: 'js' },
      explanation: 'The Vue docs require every vnode in a tree to be unique — a vnode remembers its own DOM element. Use a factory function to create fresh copies.',
    },
    {
      title: 'Passing slots as the second argument',
      wrong: { code: `h(Card, { header: () => h('h3', 'Title') }) // treated as a prop named "header"`, lang: 'js' },
      right: { code: `h(Card, null, { header: () => h('h3', 'Title') })`, lang: 'js' },
      explanation: 'For components, the third argument holds slots. If there are no props, pass `null` so Vue doesn\'t read your slot object as props.',
    },
    {
      title: 'Using a render function where a template is clearer',
      wrong: { code: `return () => h('div', { class: 'card' }, [\n  h('h2', props.title),\n  props.subtitle ? h('p', props.subtitle) : null,\n])`, lang: 'js' },
      right: { code: `<div class="card">\n  <h2>{{ title }}</h2>\n  <p v-if="subtitle">{{ subtitle }}</p>\n</div>`, lang: 'vue' },
      explanation: 'Nothing here needs JavaScript\'s power. The template is easier to read, review and style — and gets compiler optimisations.',
    },
  ],

  debugging: [
    {
      symptom: 'The component renders once but never updates when props change.',
      cause: 'Props were read in `setup` (outside the returned function), or a vnode was returned instead of a function.',
      fix: 'Return `() => h(...)` and read props inside it, or derive values with `computed()`.',
    },
    {
      symptom: '`[Vue warn]: Component is missing template or render function`.',
      cause: 'A `.js` component has neither a `render` option nor a function returned from `setup`.',
      fix: 'Return a render function from `setup`, or add `render() { return h(...) }`.',
    },
    {
      symptom: 'A named slot shows up as a weird attribute, or isn\'t rendered.',
      cause: 'Slots were passed in the props position, or the child calls a slot that wasn\'t provided.',
      fix: 'Pass slots as the third argument (`h(Comp, null, { name: () => … })`) and call them defensively (`slots.name?.()`).',
    },
    {
      symptom: 'A component inside a render function loses its state on every update.',
      cause: 'Its definition object is created inside the render function, so it\'s a new component type each render.',
      fix: 'Move the component definition to module level (or import it).',
    },
    {
      symptom: 'Wrapping slot children produces an empty item or a separator in the wrong place.',
      cause: 'The slot array contains `Comment` placeholders (false `v-if`) or `Fragment`s.',
      fix: 'Filter out `Comment` vnodes and flatten `Fragment` children before wrapping.',
    },
  ],

  bestPractices: [
    'Reach for templates first; use render functions when the structure truly needs JavaScript logic.',
    'Always return a render **function** from `setup`, and read reactive values inside it.',
    'Give list vnodes stable `key`s and never reuse a vnode object — use factories.',
    'Call slots defensively (`slots.default?.()`), and filter `Comment` placeholders when inspecting slot children.',
    'Declare `props` and `emits` on render-function and functional components, just like SFCs.',
    'Keep render functions pure and define child components at module level.',
    'If your team uses JSX, set it up via the official Vite plugin and use it consistently.',
  ],

  useCases: [
    'Components that wrap or separate their slot children: breadcrumbs, button groups, steppers, layout stacks.',
    'Dynamic tags or components chosen by props (a heading level, a polymorphic `as` prop).',
    'Config-driven UIs: form builders and table renderers generating fields and cells from schemas.',
    'Component libraries and design systems with many variants.',
    'Tiny stateless presentational pieces as functional components.',
  ],

  whenToUse: {
    use: [
      'You need to loop over, wrap, reorder or filter slot children.',
      'The rendered structure is computed from data or configuration in ways templates express awkwardly.',
      'You\'re building a library component that must stay flexible.',
    ],
    avoid: [
      'Ordinary application UI — templates are clearer and better optimised.',
      'Teams unfamiliar with vnodes, when a template + `<component :is>` would do.',
      'Anything where designers or less experienced developers need to edit markup often.',
    ],
  },

  comparison: {
    title: 'Ways to describe a component\'s output',
    headers: ['', 'template', 'render function (`h`)', 'JSX / TSX', 'functional component'],
    rows: [
      ['Syntax', 'HTML-like + directives', 'plain JavaScript calls', 'XML-like inside JS', 'a function returning vnodes'],
      ['Build setup', 'Vue SFC compiler (standard)', 'none beyond Vue', '**needs** a JSX plugin', 'none beyond Vue'],
      ['Compiler optimisations', 'yes (caching, patch flags, blocks)', 'no', 'limited (depends on the plugin)', 'no'],
      ['Full JS power', 'expressions only', 'yes', 'yes', 'yes'],
      ['State & lifecycle', 'yes', 'yes (via `setup`)', 'yes (via `setup`)', '**no** — stateless'],
      ['Best for', 'almost all UI', 'slot manipulation, dynamic structure, libraries', 'teams preferring JSX, TSX typing', 'small stateless pieces'],
    ],
    note: 'All four produce the same thing at runtime: vnodes. You can mix them in one app.',
  },

  quiz: [
    {
      id: 'render-functions-q1',
      type: 'mcq',
      prompt: 'What does `h(\'p\', { class: \'note\' }, \'Hi\')` return?',
      options: [
        { text: 'An `HTMLParagraphElement` added to the page', why: '`h()` never touches the DOM; Vue creates DOM later from the description.' },
        { text: 'A vnode: a plain object describing a paragraph' },
        { text: 'An HTML string `<p class="note">Hi</p>`', why: 'Vue doesn\'t work with HTML strings; vnodes are objects.' },
        { text: 'A component instance', why: 'Instances are created for component vnodes when they mount — `h(\'p\')` describes a plain element.' },
      ],
      answer: 1,
      explanation: '`h()` creates a virtual node — a lightweight description. The renderer later turns vnode trees into real DOM and patches it on updates.',
    },
    {
      id: 'render-functions-q2',
      type: 'output',
      prompt: 'What HTML does this render?',
      code: {
        lang: 'js',
        code: `h('p', { class: ['tag', { sale: true, old: false }] }, [
  'Only ',
  h('strong', '19 €'),
])`,
      },
      options: [
        '<p class="tag sale">Only <strong>19 €</strong></p>',
        { text: '<p class="tag sale old">Only <strong>19 €</strong></p>', why: 'Object syntax only adds classes whose value is truthy — `old: false` is dropped.' },
        { text: '<p class="[object Object]">Only 19 €</p>', why: '`class` in `h()` supports the same array/object syntax as `:class` in templates.' },
        { text: '<p>Only <strong>19 €</strong></p>', why: 'The `class` prop is applied.' },
      ],
      answer: 0,
      explanation: '`class` accepts strings, arrays and objects exactly like template bindings. Children arrays can mix strings and vnodes.',
    },
    {
      id: 'render-functions-q3',
      type: 'bug',
      prompt: 'The button label never updates when the parent changes `label`. Click the line causing it.',
      code: {
        lang: 'js',
        code: `import { h } from 'vue'

export default {
  props: { label: String },
  setup(props) {
    const text = props.label.toUpperCase()
    return () => h('button', { class: 'cta' }, text)
  },
}`,
      },
      answerLine: 6,
      explanation: '`setup` runs once, so `text` is a snapshot of the first `label`. Compute it inside the render function (`h(\'button\', …, props.label.toUpperCase())`) or with `computed()`.',
    },
    {
      id: 'render-functions-q4',
      type: 'fill',
      prompt: 'Translate `<Child v-model="title">` and render this component\'s own default slot.',
      code: {
        lang: 'js',
        code: `return () => h('div', [
  h(Child, {
    modelValue: title.value,
    '___': (value) => (title.value = value),
  }),
  slots.___?.(),
])`,
      },
      answer: [['onUpdate:modelValue'], ['default']],
      explanation: 'Component `v-model` is a `modelValue` prop plus an `onUpdate:modelValue` listener. The default slot is `slots.default`, called as a function.',
    },
    {
      id: 'render-functions-q5',
      type: 'mcq',
      prompt: 'How do you pass a **named slot** called `header` to a `Card` component in a render function?',
      options: [
        { text: '`h(Card, { header: h(\'h3\', \'Title\') })`', why: 'The second argument is props — this passes a prop named `header`, and a vnode instead of a function.' },
        { text: '`h(Card, null, { header: () => h(\'h3\', \'Title\') })`' },
        { text: '`h(Card, null, [h(\'template\', { slot: \'header\' }, \'Title\')])`', why: 'That is not how Vue 3 slots work in render functions.' },
        { text: '`h(Card, { \'#header\': \'Title\' })`', why: '`#header` is template shorthand; render functions use slot functions.' },
      ],
      answer: 1,
      explanation: 'Slots go in the third argument as an object of functions. `null` as the second argument keeps Vue from treating the object as props.',
    },
    {
      id: 'render-functions-q6',
      type: 'mcq',
      prompt: 'Which statements about **functional components** are true? **Select all that apply.**',
      options: [
        { text: 'They are plain functions called with `(props, { slots, emit, attrs })`.' },
        { text: 'No component instance is created for them.' },
        { text: 'They can keep a `ref()` that persists between renders.', why: 'There is no instance to hold state; the function runs fresh each render.' },
        { text: 'They can declare props with `MyComp.props = [...]`.' },
        { text: 'They can use `onMounted`.', why: 'Without an instance there are no lifecycle hooks.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Functional components are stateless functions: props in, vnodes out, with optional `props`/`emits` declarations and no instance or lifecycle.',
    },
    {
      id: 'render-functions-q7',
      type: 'short',
      prompt: 'Name two situations where you would choose a render function over a template, and one reason to prefer templates otherwise.',
      answer: 'When you need to inspect, wrap or reorder slot children (e.g. breadcrumbs that insert separators between links), and when the structure is generated from data or chosen dynamically in ways templates express awkwardly (form builders, library components). Templates are otherwise preferable because they are easier to read and the compiler can optimise them with static caching and patch flags.',
    },
  ],

  exercises: [
    {
      id: 'data-table',
      title: 'A config-driven table with cell slots',
      difficulty: 'advanced',
      prompt: `
Write **DataTable.js**, a render-function component (App.vue is complete).

- Props: \`columns\` — an array of \`{ key, label }\`; \`rows\` — an array of objects, each with an \`id\`.
- Render \`<table class="data-table">\` with a \`<thead>\` row of \`<th>\` labels and a \`<tbody>\` with one \`<tr>\` per row (keyed by \`id\`) and one \`<td>\` per column.
- **Scoped cell slots:** if the parent provides a slot named \`cell-<key>\`, call it with \`{ row, value }\` for that column's cells; otherwise render the value as text.
- When \`rows\` is empty, render \`<p class="empty">No products</p>\` **instead of** the table.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import DataTable from './DataTable.js'

const columns = [
  { key: 'name', label: 'Product' },
  { key: 'price', label: 'Price' },
  { key: 'stock', label: 'In stock' },
]
const rows = ref([
  { id: 1, name: 'Trail Backpack', price: 89, stock: 12 },
  { id: 2, name: 'Camp Stove', price: 45, stock: 0 },
])
</script>

<template>
  <DataTable :columns="columns" :rows="rows">
    <template #cell-price="{ value }">{{ value }} €</template>
    <template #cell-stock="{ row }">
      <span :class="row.stock ? 'ok' : 'out'">{{ row.stock || 'Sold out' }}</span>
    </template>
  </DataTable>
  <button class="clear" @click="rows = []">Clear</button>
</template>`,
        'DataTable.js': `import { h } from 'vue'

export default {
  name: 'DataTable',
  props: {
    columns: { type: Array, required: true },
    rows: { type: Array, required: true },
  },
  setup(props, { slots }) {
    // TODO: render the table (or the empty message)
    return () => h('p', 'TODO')
  },
}`,
      },
      hints: [
        'Start with the empty case: `if (!props.rows.length) return h(\'p\', { class: \'empty\' }, \'No products\')` — inside the returned function.',
        'Headers: `h(\'thead\', [h(\'tr\', props.columns.map((col) => h(\'th\', { key: col.key }, col.label)))])`. Rows are the same idea with `props.rows.map(...)` and a `key: row.id`.',
        'For each cell: `const slot = slots[\'cell-\' + col.key]` and `h(\'td\', { key: col.key }, slot ? slot({ row, value: row[col.key] }) : String(row[col.key]))`.',
      ],
      solution: {
        explanation: 'Everything a template would do with `v-if`, `v-for` and `<slot :name>` becomes plain JavaScript: an early return, `map` with keys, and a lookup in `slots` by a computed name. Scoped slots are just functions you call with an object — exactly what `#cell-price="{ value }"` destructures on the parent side. Because all reads happen inside the returned function, clearing `rows` re-renders to the empty state.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import DataTable from './DataTable.js'

const columns = [
  { key: 'name', label: 'Product' },
  { key: 'price', label: 'Price' },
  { key: 'stock', label: 'In stock' },
]
const rows = ref([
  { id: 1, name: 'Trail Backpack', price: 89, stock: 12 },
  { id: 2, name: 'Camp Stove', price: 45, stock: 0 },
])
</script>

<template>
  <DataTable :columns="columns" :rows="rows">
    <template #cell-price="{ value }">{{ value }} €</template>
    <template #cell-stock="{ row }">
      <span :class="row.stock ? 'ok' : 'out'">{{ row.stock || 'Sold out' }}</span>
    </template>
  </DataTable>
  <button class="clear" @click="rows = []">Clear</button>
</template>`,
          'DataTable.js': `import { h } from 'vue'

export default {
  name: 'DataTable',
  props: {
    columns: { type: Array, required: true },
    rows: { type: Array, required: true },
  },
  setup(props, { slots }) {
    function renderCell(row, col) {
      const slot = slots['cell-' + col.key]
      const value = row[col.key]
      return h('td', { key: col.key }, slot ? slot({ row, value }) : String(value))
    }

    return () => {
      if (!props.rows.length) {
        return h('p', { class: 'empty' }, 'No products')
      }
      return h('table', { class: 'data-table' }, [
        h('thead', [
          h('tr', props.columns.map((col) => h('th', { key: col.key }, col.label))),
        ]),
        h(
          'tbody',
          props.rows.map((row) =>
            h('tr', { key: row.id }, props.columns.map((col) => renderCell(row, col)))
          )
        ),
      ])
    }
  },
}`,
        },
      },
      tests: [
        {
          name: 'renders the header labels',
          code: `expect(findAll('.data-table th').map((th) => th.textContent)).toEqual(['Product', 'Price', 'In stock'])`,
        },
        {
          name: 'one row per item, plain cells as text',
          code: `const rows = findAll('.data-table tbody tr')
expect(rows).toHaveLength(2)
expect(rows[0].querySelector('td').textContent).toBe('Trail Backpack')`,
        },
        {
          name: 'scoped cell slots receive value and row',
          code: `const cells = findAll('.data-table tbody tr')[1].querySelectorAll('td')
expect(cells[1].textContent.trim()).toBe('45 €')
expect(cells[2].querySelector('.out').textContent).toBe('Sold out')`,
        },
        {
          name: 'shows the empty message when rows are cleared',
          code: `await click('.clear')
expect(exists('.data-table')).toBe(false)
expect(text('.empty')).toBe('No products')`,
        },
      ],
    },
    {
      id: 'functional-price',
      title: 'A functional Price component',
      difficulty: 'intermediate',
      prompt: `
Write **Price.js** as a **functional component** (a plain function, not an object):

- Props: \`amount\` (Number) and \`discount\` (Number, percent, optional). Declare them with \`Price.props\`.
- Without a discount: render \`<span class="price">89.00 €</span>\` (two decimals, a space, then €).
- With a discount: render \`<span class="price">\` containing \`<s class="old">100.00 €</s>\`, then \`<strong class="now">80.00 €</strong>\`, then \`<span class="save">-20%</span>\`.
`,
      files: {
        'Price.js': `import { h } from 'vue'

// TODO: a functional component (props) => vnode
export default function Price() {
  return h('span', { class: 'price' }, 'TODO')
}`,
        'App.vue': `<script setup>
import Price from './Price.js'
</script>

<template>
  <p>Trail Backpack: <Price :amount="89" /></p>
  <p>Camp Stove: <Price :amount="100" :discount="20" /></p>
</template>`,
      },
      hints: [
        'A helper keeps formatting in one place: `const fmt = (n) => n.toFixed(2) + \' €\'`.',
        'If there\'s no discount, return `h(\'span\', { class: \'price\' }, fmt(props.amount))`. Otherwise compute `props.amount * (1 - props.discount / 100)`.',
        'Return `h(\'span\', { class: \'price\' }, [h(\'s\', { class: \'old\' }, …), \' \', h(\'strong\', { class: \'now\' }, …), \' \', h(\'span\', { class: \'save\' }, \'-\' + props.discount + \'%\')])`, and set `Price.props = [\'amount\', \'discount\']`.',
      ],
      solution: {
        explanation: 'A functional component is the lightest kind of component: Vue calls the function with props each render and uses the vnode it returns. Declaring `props` tells Vue which attributes are props (the rest fall through as attrs). There is no state here, so nothing is lost by not having an instance.',
        files: {
          'Price.js': `import { h } from 'vue'

const fmt = (n) => n.toFixed(2) + ' €'

function Price(props) {
  if (!props.discount) {
    return h('span', { class: 'price' }, fmt(props.amount))
  }
  const now = props.amount * (1 - props.discount / 100)
  return h('span', { class: 'price' }, [
    h('s', { class: 'old' }, fmt(props.amount)),
    ' ',
    h('strong', { class: 'now' }, fmt(now)),
    ' ',
    h('span', { class: 'save' }, '-' + props.discount + '%'),
  ])
}

Price.props = {
  amount: { type: Number, required: true },
  discount: Number,
}

export default Price`,
          'App.vue': `<script setup>
import Price from './Price.js'
</script>

<template>
  <p>Trail Backpack: <Price :amount="89" /></p>
  <p>Camp Stove: <Price :amount="100" :discount="20" /></p>
</template>`,
        },
      },
      tests: [
        {
          name: 'formats a plain price',
          code: `const w = mountFile('Price.js', { amount: 89 })
expect(w.text()).toBe('89.00 €')
expect(w.find('.old')).toBeNull()`,
        },
        {
          name: 'shows old price, new price and saving with a discount',
          code: `const w = mountFile('Price.js', { amount: 100, discount: 20 })
expect(w.find('.old').textContent).toBe('100.00 €')
expect(w.find('.now').textContent).toBe('80.00 €')
expect(w.find('.save').textContent).toBe('-20%')`,
        },
        {
          name: 'is a functional component with declared props',
          code: `const Price = requireModule('Price.js').default
expect(typeof Price).toBe('function')
const declared = Array.isArray(Price.props) ? Price.props : Object.keys(Price.props || {})
expect(declared).toContain('amount')
expect(declared).toContain('discount')`,
        },
        {
          name: 'App renders both prices',
          code: `expect(findAll('.price')).toHaveLength(2)
expect(text()).toContain('80.00 €')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'render-functions-what',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a render function in Vue, and how does it relate to templates?',
      answer: 'A render function returns a tree of vnodes describing what a component should render. Templates are compiled into render functions at build time, so every component has one. You can write it yourself with `h()` — in `setup` by returning a function, or with the `render` option — when you need the full power of JavaScript.',
      explanation: 'Templates are a friendlier, optimisable syntax for writing render functions.',
      whyAsked: 'Probes whether you understand what Vue actually executes under the hood.',
      mistakes: ['Saying render functions produce real DOM directly.', 'Thinking templates are interpreted at runtime in normal builds.', 'Not mentioning vnodes.'],
      followUps: ['What does `h()` return?', 'Why might a template be faster than an equivalent hand-written render function?'],
      modelAnswer: 'A render function is a function that returns vnodes — plain objects describing elements, components and text. Vue calls it whenever the component needs to render, then diffs the new tree against the old one and patches the DOM. Templates compile into render functions, usually at build time, so they\'re two ways of writing the same thing. I write one by hand with `h()` when I need JavaScript logic templates can\'t express well, like looping over slot children.',
    },
    {
      id: 'render-functions-vs-templates',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'When would you choose a render function (or JSX) over a template, and what do you give up?',
      answer: 'Choose render functions for slot manipulation (wrapping/separating children), highly dynamic or generated structure (form/table builders, polymorphic components) and library internals. You give up readability for most developers and the template compiler\'s optimisations — static content caching, patch flags and block trees that let Vue skip static parts on updates. JSX adds a build plugin dependency.',
      explanation: 'Flexibility versus clarity and compile-time optimisation.',
      whyAsked: 'Tests judgment: knowing the tool exists matters less than knowing when not to use it.',
      mistakes: ['Claiming render functions are always faster.', 'Using them for ordinary UI.', 'Not knowing what compiler optimisations templates get.'],
      followUps: ['What is a patch flag?', 'Could `<component :is>` replace your render function?'],
      modelAnswer: 'I default to templates. I switch to a render function when I need JavaScript-level control: wrapping or separating slot children, generating structure from configuration, or library components with lots of variants. The cost is readability and optimisation — the template compiler marks static content to cache and adds patch flags so Vue only checks the dynamic bits on updates, which hand-written `h()` calls don\'t get. JSX gives a nicer syntax for the same thing but needs a build plugin.',
    },
    {
      id: 'render-functions-stale-props',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This render-function component shows the right title initially, but never updates when the parent changes `title`. Why?',
      code: {
        lang: 'js',
        code: `export default {
  props: { title: String },
  setup(props) {
    const heading = h('h2', { class: 'title' }, props.title)
    return () => h('header', [heading])
  },
}`,
      },
      answer: 'The `h2` vnode is created once in `setup`, reading `props.title` at that moment. The render function re-runs on updates but keeps returning that same old vnode, and the `props.title` read happened outside the render effect, so it isn\'t even tracked. Create the vnode inside the returned function: `return () => h(\'header\', [h(\'h2\', { class: \'title\' }, props.title)])`.',
      explanation: 'Reactivity tracks reads made while the render function runs; `setup` runs only once.',
      whyAsked: 'The most common render-function bug; it reveals understanding of `setup` vs render timing and dependency tracking.',
      mistakes: ['Suggesting `watch` + `forceUpdate`.', 'Saying props aren\'t reactive in render functions.', 'Not noticing the vnode is also reused across renders.'],
      followUps: ['How would `computed` help here?', 'Why must vnodes be unique?'],
      modelAnswer: 'The heading vnode is built once in `setup`, so it captured the first title, and that read happened outside the render effect, so it isn\'t tracked. Every re-render returns the same stale vnode. Moving the `h(\'h2\', …)` call into the returned function makes it read `props.title` during render, which is tracked, and creates a fresh vnode each time. If the value were expensive to derive, I\'d use a `computed`.',
    },
    {
      id: 'render-functions-translate',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 4,
      question: 'Which `h()` call is equivalent to `<SearchBox v-model="query" @submit="run"><template #hint>Press Enter</template></SearchBox>`?',
      options: [
        "h(SearchBox, { modelValue: query.value, 'onUpdate:modelValue': (v) => (query.value = v), onSubmit: run }, { hint: () => 'Press Enter' })",
        "h(SearchBox, { 'v-model': query, '@submit': run, hint: 'Press Enter' })",
        "h(SearchBox, { modelValue: query, onSubmit: run }, ['Press Enter'])",
        "h(SearchBox, null, { modelValue: query.value, submit: run, hint: 'Press Enter' })",
      ],
      correctOption: 0,
      answer: '`v-model` on a component becomes `modelValue` plus an `onUpdate:modelValue` listener, `@submit` becomes `onSubmit`, and the named slot is a function in the third argument\'s object.',
      explanation: 'Directives and slot syntax are template sugar; in `h()` everything is explicit props, listeners and slot functions.',
      whyAsked: 'Checks that you understand what template syntax compiles down to.',
      mistakes: ['Passing directive names as props.', 'Passing slots as an array of strings to a component that expects a named slot.', 'Forgetting `.value` when reading a ref in JavaScript.'],
      followUps: ['How would `v-model:title` translate?', 'How do you add the `.trim` modifier?'],
      modelAnswer: 'The first one. Component `v-model` is shorthand for a `modelValue` prop and an `update:modelValue` event, so in `h()` I pass `modelValue` and an `onUpdate:modelValue` listener. Event listeners are `onXxx` props, so `@submit` is `onSubmit`. Named slots go in the third argument as functions, so `#hint` becomes `{ hint: () => \'Press Enter\' }`.',
    },
    {
      id: 'render-functions-functional',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What are functional components in Vue 3, and when would you use one?',
      answer: 'Plain functions `(props, { slots, emit, attrs }) => vnodes` that Vue calls during rendering without creating a component instance. They have no reactive state of their own, no `this` and no lifecycle hooks; props can be declared via `fn.props` and events via `fn.emits`. Use them for small stateless presentational pieces (badges, icons, formatted values) where an instance adds nothing. In Vue 3 the performance gain over a normal stateful component is small, so readability should drive the choice.',
      explanation: 'Props in, vnodes out — a component reduced to a pure function.',
      whyAsked: 'Distinguishes Vue 2-era knowledge (where functional components were a performance tool) from Vue 3 understanding.',
      mistakes: ['Claiming they are much faster in Vue 3.', 'Trying to use `ref()` state or `onMounted` inside them.', 'Thinking the `functional` template attribute from Vue 2 still applies.'],
      followUps: ['How do attributes fall through on a functional component?', 'Would you write one as an SFC?'],
      modelAnswer: 'A functional component is just a function: Vue passes props and a context with slots, emit and attrs, and renders what it returns. There\'s no instance, so no state, no `this` and no lifecycle hooks. I use them for tiny stateless pieces like a badge or a formatted price. In Vue 3, normal components are already cheap, so I don\'t pick functional components for speed — only when the function form is simply clearer.',
    },
    {
      id: 'render-functions-jsx',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'A team wants to write all components in TSX instead of SFC templates. What do you need to set up, and what trade-offs would you raise?',
      answer: 'Setup: the Vue JSX transform — `@vitejs/plugin-vue-jsx` for Vite — plus TypeScript config for TSX, and components defined with `defineComponent` for typing. Trade-offs: full JS/TS power and strong type checking of props in TSX, but you lose template compiler optimisations (static caching, patch flags — the JSX plugin can do only limited optimisation), SFC conveniences like scoped styles alongside markup and template-specific tooling, and most Vue docs/examples use templates. Vue JSX also differs from React JSX (`class`, slots as objects, directive support), which trips up React developers. A mixed approach — templates by default, TSX for specific dynamic components — is common.',
      explanation: 'It\'s a team-wide tooling and readability decision, not just syntax.',
      whyAsked: 'Senior-level: tooling, typing, performance characteristics and team conventions.',
      mistakes: ['Assuming React JSX knowledge transfers fully.', 'Ignoring the build plugin requirement.', 'Claiming TSX is always faster or always slower.'],
      followUps: ['How do you pass slots in Vue JSX?', 'How would you migrate gradually?'],
      modelAnswer: 'We\'d add `@vitejs/plugin-vue-jsx`, configure TypeScript for TSX and use `defineComponent` everywhere for inference. The upside is full TypeScript power and type-checked props in markup. The downside is losing what the template compiler gives us — cached static content and patch flags — plus SFC conveniences, and Vue\'s ecosystem examples are mostly templates. Vue JSX also isn\'t React JSX: `class` instead of `className`, slots passed as objects. I\'d suggest templates by default and TSX where components are genuinely dynamic, and agree on it team-wide.',
    },
    {
      id: 'render-functions-coding-todo-list',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement **TodoList.js** with a render function. Props: `todos` (array of `{ id, text, done }`). Render `<ul class="todos">` with one `<li class="todo">` per todo (keyed by id, plus class `done` when done) containing a checkbox (`input.toggle`, checked when done) and the text. Checking a box emits `toggle` with the todo\'s id. With no todos, render `<p class="empty">All clear!</p>`.',
      starter: {
        files: {
          'TodoList.js': `import { h } from 'vue'

export default {
  name: 'TodoList',
  props: {
    todos: { type: Array, required: true },
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    // TODO
    return () => h('p', 'TODO')
  },
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import TodoList from './TodoList.js'

const todos = ref([
  { id: 1, text: 'Pack the tent', done: false },
  { id: 2, text: 'Charge the torch', done: true },
])

function toggle(id) {
  const todo = todos.value.find((t) => t.id === id)
  todo.done = !todo.done
}
</script>

<template>
  <TodoList :todos="todos" @toggle="toggle" />
</template>`,
        },
      },
      tests: [
        {
          name: 'renders a keyed item per todo with the done class',
          code: `const items = findAll('.todos .todo')
expect(items).toHaveLength(2)
expect(items[0].textContent).toContain('Pack the tent')
expect(items[1].classList.contains('done')).toBe(true)
expect(items[1].querySelector('.toggle').checked).toBe(true)`,
        },
        {
          name: 'checking a box emits toggle with the id',
          code: `const w = mountFile('TodoList.js', { todos: [{ id: 7, text: 'Buy matches', done: false }] })
await check(w.find('.toggle'), true)
expect(w.emitted('toggle')).toHaveLength(1)
expect(w.emitted('toggle')[0][0]).toBe(7)`,
        },
        {
          name: 'App updates when a todo is toggled',
          code: `await check(findAll('.toggle')[0], true)
expect(findAll('.todo')[0].classList.contains('done')).toBe(true)`,
        },
        {
          name: 'shows the empty message without todos',
          code: `const w = mountFile('TodoList.js', { todos: [] })
expect(w.find('.empty').textContent).toBe('All clear!')
expect(w.find('.todos')).toBeNull()`,
        },
      ],
      hints: [
        'Empty case first: `if (!props.todos.length) return h(\'p\', { class: \'empty\' }, \'All clear!\')`.',
        'Items: `props.todos.map((todo) => h(\'li\', { key: todo.id, class: [\'todo\', { done: todo.done }] }, [...]))`.',
        'Checkbox: `h(\'input\', { type: \'checkbox\', class: \'toggle\', checked: todo.done, onChange: () => emit(\'toggle\', todo.id) })`.',
      ],
      answer: 'Return a render function that returns the empty message or a `ul` built with `map`, using class arrays/objects for `done` and an `onChange` listener that emits the id.',
      solution: {
        files: {
          'TodoList.js': `import { h } from 'vue'

export default {
  name: 'TodoList',
  props: {
    todos: { type: Array, required: true },
  },
  emits: ['toggle'],
  setup(props, { emit }) {
    return () => {
      if (!props.todos.length) {
        return h('p', { class: 'empty' }, 'All clear!')
      }
      return h(
        'ul',
        { class: 'todos' },
        props.todos.map((todo) =>
          h('li', { key: todo.id, class: ['todo', { done: todo.done }] }, [
            h('input', {
              type: 'checkbox',
              class: 'toggle',
              checked: todo.done,
              onChange: () => emit('toggle', todo.id),
            }),
            ' ' + todo.text,
          ])
        )
      )
    }
  },
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import TodoList from './TodoList.js'

const todos = ref([
  { id: 1, text: 'Pack the tent', done: false },
  { id: 2, text: 'Charge the torch', done: true },
])

function toggle(id) {
  const todo = todos.value.find((t) => t.id === id)
  todo.done = !todo.done
}
</script>

<template>
  <TodoList :todos="todos" @toggle="toggle" />
</template>`,
        },
      },
      explanation: '`v-if` → early return, `v-for` → `map` with `key`, `:class` → the same array/object syntax, `:checked` → a DOM prop, `@change` → `onChange`. The component stays "props down, events up": it never mutates the todos itself.',
      whyAsked: 'A compact live-coding task that tests fluency with `h()` and the template-to-JS mapping.',
      mistakes: ['Mutating `todo.done` inside the child instead of emitting.', 'Forgetting keys.', 'Building the list outside the render function.'],
      followUps: ['How would you add a scoped slot so the parent can customise each item?', 'How would this look as a template — which would you ship?'],
      modelAnswer: 'Inside the returned render function I handle the empty case with an early return, otherwise map the todos to keyed `li` vnodes with a class array that adds `done`. Each item has a checkbox whose `checked` prop mirrors the todo and whose `onChange` emits `toggle` with the id — the parent owns the data. Honestly, for production I\'d write this one as a template; it\'s a good exercise in the mapping, though.',
    },
  ],

  takeaways: [
    'Templates compile to render functions; `h(type, props, children)` lets you write them yourself and returns vnodes, not DOM.',
    'Return a **function** from `setup` and read props/state inside it — `setup` runs once, the render function on every update.',
    'Template features map to JS: `v-if` → ternary, `v-for` → `map` + `key`, `@click` → `onClick`, `v-model` → `modelValue` + `onUpdate:modelValue`, slots → functions.',
    'Vnodes must be unique; slots are passed as the third argument (`h(Comp, null, { … })`) and may contain `Comment` placeholders.',
    'Functional components are stateless functions with no instance or lifecycle — good for tiny presentational pieces.',
    'JSX needs a build plugin; prefer templates by default, since they\'re clearer and get compiler optimisations.',
  ],
}
