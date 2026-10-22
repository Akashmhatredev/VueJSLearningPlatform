// Lesson: Compiler macros & template compilation.

const orderApp = `<script setup>
import { ref } from 'vue'
import QuantityPicker from './QuantityPicker.vue'

const tents = ref(2)
const message = ref('')

function onLimit(side) {
  message.value = 'You reached the ' + side + 'imum.'
}
</script>

<template>
  <h2>Camping order</h2>
  <QuantityPicker v-model="tents" label="Tents" @limit="onLimit" />
  <p class="summary">You are ordering {{ tents }} tent(s).</p>
  <p v-if="message" class="message">{{ message }}</p>
</template>`

const quantityPicker = `<script setup>
// No imports: these are compiler macros, handled at build time.
const { min = 1, label = 'Quantity' } = defineProps({
  min: Number,
  label: String,
})
const quantity = defineModel({ type: Number, default: 1 })
const emit = defineEmits(['limit'])

function decrement() {
  if (quantity.value > min) quantity.value--
  else emit('limit', 'min')
}

function increment() {
  quantity.value++
}
</script>

<template>
  <div class="picker">
    <span class="label">{{ label }}</span>
    <button class="dec" @click="decrement">−</button>
    <span class="qty">{{ quantity }}</span>
    <button class="inc" @click="increment">+</button>
  </div>
</template>`

const cartSource = `<script setup>
import { ref } from 'vue'
const props = defineProps({ title: String })
const emit = defineEmits(['add'])
const model = defineModel({ default: 0 })
defineOptions({ name: 'CartCard', inheritAttrs: false })
const count = ref(0)
defineExpose({ count })
</script>

<template>
  <div class="card">
    <h2>Cart</h2>
    <p>{{ title }}: {{ count }}</p>
    <button @click="count++">Add</button>
  </div>
</template>`

const cartCompiled = `// real @vue/compiler-sfc 3.5 output (production-style, template inlined)
const _hoisted_1 = { class: "card" }

export default Object.assign({ name: 'CartCard', inheritAttrs: false }, {
  __name: 'Cart',
  props: _mergeModels({ title: String }, {
    "modelValue": { default: 0 },
    "modelModifiers": {},
  }),
  emits: _mergeModels(['add'], ["update:modelValue"]),
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props
    const emit = __emit
    const model = _useModel(__props, "modelValue")
    const count = ref(0)
    __expose({ count })

    return (_ctx, _cache) => {
      return (_openBlock(), _createElementBlock("div", _hoisted_1, [
        _cache[1] || (_cache[1] = _createElementVNode("h2", null, "Cart", -1 /* CACHED */)),
        _createElementVNode("p", null,
          _toDisplayString(__props.title) + ": " + _toDisplayString(count.value), 1 /* TEXT */),
        _createElementVNode("button", {
          onClick: _cache[0] || (_cache[0] = $event => (count.value++))
        }, "Add")
      ]))
    }
  }
})`

export default {
  id: 'compiler-macros',
  title: 'Compiler macros & template compilation',
  summary: 'See what defineProps, defineEmits, defineModel, defineExpose, defineOptions, defineSlots and withDefaults really are — compile-time instructions — and how templates become optimised render functions.',
  difficulty: 'advanced',
  minutes: 44,
  prerequisites: ['setup-and-script-setup', 'props', 'emits', 'component-v-model'],
  related: ['render-functions', 'how-vue-updates', 'typing-components', 'dom-access-refs', 'render-optimization'],
  tags: ['compiler macros', 'defineProps', 'defineEmits', 'defineModel', 'defineExpose', 'defineOptions', 'defineSlots', 'withDefaults', 'props destructure', 'script setup', 'template compilation', 'patch flags', 'static hoisting', 'block tree'],
  apis: [
    { name: 'defineProps()', summary: 'Declares props (runtime object/array, or TypeScript type) and returns the reactive props object. Destructuring it is reactive in Vue 3.5+.' },
    { name: 'defineEmits()', summary: 'Declares emitted events and returns an `emit` function.' },
    { name: 'defineModel()', summary: 'Vue 3.4+: declares a `modelValue` (or named) prop plus its `update:` event and returns a ref that reads the prop and emits on write.' },
    { name: 'defineExpose()', summary: 'Chooses what a `<script setup>` component exposes through template refs (closed by default).' },
    { name: 'defineOptions()', summary: 'Vue 3.3+: declares component options such as `name` or `inheritAttrs` inside `<script setup>`.' },
    { name: 'defineSlots()', summary: 'Vue 3.3+: type-only declaration of slot names and slot props (TypeScript); returns the slots object.' },
    { name: 'withDefaults()', summary: 'Provides default values for type-based `defineProps<T>()` declarations (TypeScript).' },
  ],
  docs: [
    { label: 'API — <script setup> (all macros)', url: 'https://vuejs.org/api/sfc-script-setup.html' },
    { label: 'Vue Guide — Props: reactive props destructure', url: 'https://vuejs.org/guide/components/props.html#reactive-props-destructure' },
    { label: 'Vue Guide — Component v-model (defineModel)', url: 'https://vuejs.org/guide/components/v-model.html' },
    { label: 'Vue Guide — Rendering Mechanism (compiler-informed virtual DOM)', url: 'https://vuejs.org/guide/extras/rendering-mechanism.html' },
    { label: 'Vue SFC Playground (see compiled output)', url: 'https://play.vuejs.org/' },
  ],

  intro: `
\`defineProps\`, \`defineEmits\`, \`defineModel\`, \`defineExpose\`, \`defineOptions\`, \`defineSlots\` and \`withDefaults\` look like functions — but you never import them, and they don't exist at runtime. They are **compiler macros**: instructions to the Single-File Component compiler, which **rewrites** them into ordinary component code before your app ever runs.

This lesson shows each macro, its rules (some of which only make sense once you know it is compiled), and then lifts the lid on the second half of SFC compilation: how your **template** becomes a render function full of hints — cached static nodes, patch flags, blocks — that make Vue's updates fast.
`,

  why: `
Before \`<script setup>\`, a component declared its interface in an options object and its logic in \`setup()\`:

\`\`\`js
export default {
  props: { title: String },
  emits: ['add'],
  setup(props, { emit, expose }) {
    const count = ref(0)
    expose({ count })
    return { count } // and remember to return everything the template uses
  },
}
\`\`\`

\`<script setup>\` removes that ceremony. But a few things still have to be **known before the component runs** — which props and events exist (so Vue can tell props from attributes and validate them), the component's name, its \`v-model\` contract. Macros are how you state those facts *inside* \`<script setup>\`, and the compiler moves them to where they belong.

Understanding compilation also explains things that otherwise feel arbitrary: why a macro can't use a local \`let\` variable, why destructured props are reactive, why \`watch(destructuredProp)\` is a compile error, and why templates usually out-perform hand-written render functions.
`,

  eli15: `
Imagine writing a recipe for a cooking show. Some lines are for the cook ("stir for two minutes"). But some are notes **for the editor** who prepares the episode before it airs: "show the ingredient list here", "title card: *Grandma's Soup*". Those notes never appear on screen — the editor turns them into graphics and then removes them.

Compiler macros are notes for the editor. \`defineProps({ title: String })\` says "this component accepts a \`title\`". Before the app runs, the compiler (the editor) reads the note, turns it into the right setup code, and deletes the note itself. That's why you don't import them — they're not real functions you call; they're instructions the compiler follows.

The compiler does the same with your **template**: it turns the HTML-like markup into JavaScript, and marks which parts can ever change, so Vue doesn't waste time re-checking the parts that can't.
`,

  analogy: {
    title: 'Editor\'s notes in a script',
    body: `
A screenplay contains dialogue (performed) and stage directions or editor's notes (instructions, never spoken). The production team reads the notes, sets things up accordingly, and the audience never sees them.

\`<script setup>\` is the screenplay; macros are the notes; the SFC compiler is the production team. Like real notes, they have rules: they're read **before** the performance, so they can't depend on things that only exist **during** it — that's why a macro can't reference a \`let\` variable from your setup code.
`,
    mapping: [
      ['dialogue', 'normal `<script setup>` code that runs for each component instance'],
      ['editor\'s notes', 'compiler macros (`defineProps`, `defineEmits`, …)'],
      ['the production team', 'the SFC compiler (`@vue/compiler-sfc`, via the Vite plugin)'],
      ['the notes never airing', 'macros are compiled away — no imports, nothing at runtime'],
      ['"can\'t depend on things during the show"', 'macro arguments are hoisted out of `setup`, so they can\'t use local variables'],
      ['marking which scenery moves', 'template compilation adding patch flags and caching static nodes'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'What happens to a .vue file',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'sfc', label: 'QuantityPicker.vue', note: 'script setup + template + style', tone: 'paper', x: 100, y: 160 },
        { id: 'parse', label: 'parse', note: 'split into blocks', tone: 'kraft', x: 280, y: 160 },
        { id: 'script', label: 'compileScript', note: 'macros → props, emits, expose…', tone: 'cobalt', x: 470, y: 60 },
        { id: 'template', label: 'compileTemplate', note: 'render fn + patch flags', tone: 'cobalt', x: 470, y: 160 },
        { id: 'style', label: 'compileStyle', note: 'scoped CSS', tone: 'cobalt', x: 470, y: 260 },
        { id: 'module', label: 'plain JS module', note: 'no macros left', tone: 'acid', x: 680, y: 160 },
      ],
      edges: [
        { from: 'sfc', to: 'parse' },
        { from: 'parse', to: 'script' },
        { from: 'parse', to: 'template' },
        { from: 'parse', to: 'style' },
        { from: 'script', to: 'module' },
        { from: 'template', to: 'module' },
        { from: 'style', to: 'module' },
      ],
      steps: [
        { focus: ['sfc', 'parse'], edges: ['sfc->parse'], text: 'At build time (Vite + `@vitejs/plugin-vue`), the SFC compiler parses the `.vue` file into its blocks: `<script setup>`, `<template>`, `<style>`.' },
        { focus: ['script'], edges: ['parse->script'], text: '`compileScript` handles `<script setup>`: each macro is rewritten — `defineProps` becomes the `props` option, `defineEmits` the `emits` option, `defineModel` a prop + event + `useModel()` call, `defineExpose` an `expose()` call, `defineOptions` is merged into the component object.' },
        { focus: ['template'], edges: ['parse->template'], text: '`compileTemplate` turns the template into a **render function**. It analyses which nodes are static and which bindings are dynamic, and encodes that as cached nodes, patch flags and blocks.' },
        { focus: ['style'], edges: ['parse->style'], text: '`compileStyle` processes `<style>` — for `scoped` styles, adding the `data-v-…` attribute selectors.' },
        { focus: ['module'], edges: ['script->module', 'template->module', 'style->module'], text: 'The result is a plain JavaScript module exporting a component object. No macros remain: the browser only ever sees normal Vue API calls.' },
      ],
    },
    caption: 'Macros and templates are both compile-time inputs; the runtime only sees ordinary JavaScript.',
    alt: 'A pipeline: a .vue file is parsed into blocks; compileScript turns macros into component options; compileTemplate produces a render function with patch flags; compileStyle handles scoped CSS; all three produce one plain JavaScript module.',
  },

  animation: {
    type: 'comparison',
    title: 'Before and after compilation',
    props: {
      left: { label: 'What you write (Cart.vue)', lang: 'vue', code: cartSource },
      right: { label: 'What the compiler produces (trimmed)', lang: 'js', code: cartCompiled },
      points: [
        '`defineProps` / `defineEmits` became the `props` / `emits` options; `defineModel` added `modelValue`, `modelModifiers` and `update:modelValue`.',
        '`defineOptions` was merged into the component object with `Object.assign`; `defineExpose` became `__expose()`.',
        'The static `<h2>` is created once and cached (`-1 /* CACHED */`); the static `{ class: "card" }` props object is hoisted.',
        'The `<p>` carries patch flag `1 /* TEXT */`: on updates, Vue only needs to compare its text. The click handler is cached too.',
      ],
    },
    caption: 'Real output from Vue 3.5\'s compiler (import lines trimmed). Exact output varies by version and build mode.',
    alt: 'Side by side: on the left a Cart.vue component using defineProps, defineEmits, defineModel, defineOptions and defineExpose; on the right the compiled JavaScript with props, emits, mergeModels, useModel, __expose, Object.assign for the options, and a render function with cached static nodes and patch flags.',
  },

  syntax: [
    `
#### The macros at a glance

| macro | you write | version |
|---|---|---|
| \`defineProps\` | \`const props = defineProps({ title: String })\` | 3.0+ (destructure reactive: 3.5+) |
| \`defineEmits\` | \`const emit = defineEmits(['add'])\` | 3.0+ |
| \`defineExpose\` | \`defineExpose({ reset })\` | 3.0+ |
| \`defineModel\` | \`const model = defineModel()\` | **3.4+** |
| \`defineOptions\` | \`defineOptions({ name: 'X', inheritAttrs: false })\` | **3.3+** |
| \`defineSlots\` | \`const slots = defineSlots<…>()\` (TS) | **3.3+** |
| \`withDefaults\` | \`withDefaults(defineProps<Props>(), { … })\` (TS) | 3.0+ |

#### Props: runtime declaration, destructure and defaults
`,
    {
      code: `<script setup>
// Vue 3.5+: destructured props stay reactive; "= value" sets the default
const { size = 'md', items = () => [] } = defineProps({
  size: String,
  items: Array,
})

// in the same <script setup>, size compiles to __props.size — so this is reactive:
const sizeClass = computed(() => 'btn-' + size)

// passing to watch() or a composable needs a getter:
watch(() => size, (next) => console.log('size is now', next))
// watch(size, …)   ❌ compile error: pass a getter instead
</script>`,
      lang: 'vue',
      title: 'reactive props destructure (3.5+)',
    },
    {
      code: `// TypeScript (static example): type-based declaration
interface Props {
  title: string
  labels?: string[]
}

// 3.5+: destructure defaults
const { title, labels = () => ['new'] } = defineProps<Props>()

// any version: withDefaults
const props = withDefaults(defineProps<Props>(), {
  labels: () => ['new'],
})

const emit = defineEmits<{ add: [id: number]; remove: [id: number] }>()

const slots = defineSlots<{
  default(props: { item: string }): any
}>()`,
      lang: 'ts',
      title: 'type-based macros (TypeScript)',
      static: true,
    },
    `
#### \`defineModel\` (3.4+)
`,
    {
      code: `<script setup>
// default v-model: prop "modelValue" + event "update:modelValue"
const count = defineModel({ type: Number, default: 0 })

// named v-model: <TitleInput v-model:title="heading" />
const title = defineModel('title', { required: true })

// modifiers: <TitleInput v-model:title.capitalize="heading" />
const [name, modifiers] = defineModel('name', {
  set(value) {
    return modifiers.capitalize ? value.charAt(0).toUpperCase() + value.slice(1) : value
  },
})

count.value++ // emits update:modelValue with 1 — the parent updates its ref
</script>`,
      lang: 'vue',
      title: 'defineModel',
    },
    {
      callout: 'warn',
      title: 'defineModel defaults can desynchronise',
      text: 'If the parent doesn\'t bind `v-model`, the returned ref works as a local ref inside the child. If you give it a `default` and the parent *does* bind a value that is `undefined`, the child shows the default while the parent still holds `undefined`. Prefer making the parent pass a real initial value.',
    },
    `
#### \`defineOptions\` and \`defineExpose\`
`,
    {
      code: `<script setup>
defineOptions({
  name: 'QtyPicker',     // devtools, KeepAlive include/exclude, recursion
  inheritAttrs: false,   // don't put fallthrough attrs on the root
})

const quantity = defineModel({ default: 1 })
function reset() { quantity.value = 1 }

defineExpose({ reset })  // must come before any await
</script>

<template>
  <div class="picker">
    <input v-bind="$attrs" v-model.number="quantity" />
  </div>
</template>`,
      lang: 'vue',
      title: 'options and exposed API',
    },
    `
**The rules (they follow from compilation):**

1. Macros are only valid in \`<script setup>\`, at the top level, and are **not imported**.
2. Their **arguments are hoisted** out of \`setup()\` into module scope. They can use imports and literal constants, but **not** local \`let\` variables, refs or functions declared in setup — that is a compile error.
3. Each macro may be called **once** per component.
4. \`defineOptions\` can't declare \`props\`, \`emits\`, \`expose\` or \`slots\` — use their dedicated macros.
5. \`defineExpose\` (and hook registrations) belong **before** the first \`await\`.
6. Destructured props are reactive only because the compiler rewrites \`size\` to \`__props.size\`; pass a getter (\`() => size\`) when handing one to \`watch\` or a composable.
`,
  ],

  walkthrough: {
    title: 'QuantityPicker.vue',
    lang: 'vue',
    code: quantityPicker,
    intro: 'A small quantity picker that uses three macros. For each one, think about what the compiler turns it into.',
    steps: [
      { lines: [2], text: 'No `import` for `defineProps`, `defineModel` or `defineEmits`. They are instructions to the compiler and won\'t exist at runtime.' },
      { lines: [3, 6], text: '`defineProps` with **reactive destructure** (3.5+): `min` and `label` get defaults right in the pattern. The compiler emits a `props` option (with the defaults merged in) and rewrites every later use of `min` to `__props.min`, keeping it reactive.' },
      { lines: [7], text: '`defineModel` (3.4+) declares a `modelValue` prop and an `update:modelValue` event, and returns a ref. Reading it reads the prop; writing it emits the event so the parent\'s `v-model` updates.' },
      { lines: [8], text: '`defineEmits([\'limit\'])` becomes the `emits` option and returns the `emit` function.' },
      { lines: [10, 13], text: '`min` reads the current prop (it compiles to `__props.min`). At the minimum we emit `limit` instead of going lower.' },
      { lines: [15, 17], text: '`quantity.value++` writes the model ref, which emits `update:modelValue` — the parent\'s `tents` changes, flows back down as the new `modelValue`, and the template updates.' },
      { lines: [24], text: 'In the template, the model ref is unwrapped like any ref: `{{ quantity }}`.' },
    ],
  },

  playground: {
    title: 'Camping order',
    objective: 'Extend a component built with macros: add a destructured prop with a default, expose a method, name the component, and run into the hoisting rule.',
    files: { 'App.vue': orderApp, 'QuantityPicker.vue': quantityPicker },
    expected: 'A "Tents" picker starting at **2**. Clicking − goes down to 1, then shows "You reached the minimum." Clicking + goes up forever — there is no maximum yet.',
    experiments: [
      {
        id: 'max-prop',
        task: 'Add a `max` prop with a default of **5** using the destructure syntax. At the maximum, `increment` should emit `limit` with `\'max\'` instead of going higher.',
        hint: 'Add `max = 5` to the destructure and `max: Number` to the props object. In `increment`: `if (quantity.value < max) quantity.value++` `else emit(\'limit\', \'max\')`.',
        tests: [
          {
            name: 'stops at 5 and reports the maximum',
            code: `for (let i = 0; i < 5; i++) await click('.inc')
expect(text('.summary')).toBe('You are ordering 5 tent(s).')
expect(text('.message')).toContain('maximum')`,
          },
        ],
        explain: 'The default lives in the destructure pattern; the compiler turns it into the prop\'s `default` and rewrites `max` to `__props.max`. If App later passes `:max="10"`, the component follows — destructured props are reactive.',
      },
      {
        id: 'expose-reset',
        task: 'Expose a `reset()` method from QuantityPicker that sets the quantity back to `min`. In App, add `ref="picker"` and a **Reset** button (`class="reset"`) that calls it.',
        hint: 'Child: `function reset() { quantity.value = min }` and `defineExpose({ reset })`. App: `import { ref, useTemplateRef } from \'vue\'`, `const picker = useTemplateRef(\'picker\')`, `<button class="reset" @click="picker.reset()">Reset</button>`.',
        tests: [
          {
            name: 'Reset sets the order back to the minimum',
            code: `await click('.inc')
await click('.inc')
await click('.reset')
expect(text('.summary')).toBe('You are ordering 1 tent(s).')`,
          },
        ],
        explain: '`defineExpose` compiles to a call to the `expose` function from the setup context. Without it, the `<script setup>` component is closed and `picker.reset` would be `undefined`. Note that resetting writes the model, so the parent\'s `tents` updates too.',
      },
      {
        id: 'name-option',
        task: 'Give the component the explicit name **`QtyPicker`** with `defineOptions`.',
        hint: 'Inside `<script setup>`: `defineOptions({ name: \'QtyPicker\' })`. No import.',
        tests: [
          {
            name: 'the compiled component is named QtyPicker',
            code: `expect(requireModule('QuantityPicker.vue').default.name).toBe('QtyPicker')`,
          },
        ],
        explain: 'The compiler merges `defineOptions` into the exported component object (`Object.assign({ name: \'QtyPicker\' }, {…})`). Without it, the name is inferred from the file name (`QuantityPicker`). The name shows in devtools and is what KeepAlive\'s `include` matches.',
      },
      {
        id: 'hoisting-rule',
        task: 'Add `let startingMax = 5` at the top of `<script setup>` and use it as the prop default: `max: { type: Number, default: startingMax }`. Read the compile error. Then change `let` to `const` and run again.',
        hint: 'With `let`, the compiler refuses: the props object is moved out of `setup()`, where `startingMax` doesn\'t exist. A `const` with a literal value can be hoisted along with it.',
        explain: 'Macro arguments are evaluated once, at module level, not per component instance. Literal constants and imports are fine; anything that could change per instance is not. That rule only makes sense once you know macros are compiled.',
      },
    ],
  },

  internals: {
    beginner: `
Your browser can't run a \`.vue\` file. A build tool first translates it into plain JavaScript. During that translation, the compiler finds the macros in \`<script setup>\` and replaces them with the normal component options they stand for, and it turns your template into a JavaScript function that builds the page — marking which bits can change so Vue can skip the rest during updates.
`,
    technical: [
      `
**Script compilation (\`compileScript\`).** For the Cart example shown in "Watch it work":

- \`defineProps({ title: String })\` → \`props: { title: String }\`; \`const props = defineProps(…)\` → \`const props = __props\`.
- With destructure, \`const { size = 'md' } = defineProps({ size: String })\` → \`props: mergeDefaults({ size: String }, { size: 'md' })\`, and every later \`size\` becomes \`__props.size\`.
- \`defineEmits(['add'])\` → \`emits: ['add']\` and \`const emit = __emit\` (from the setup context).
- \`defineModel()\` → adds \`modelValue\` and \`modelModifiers\` props and an \`update:modelValue\` emit (combined with yours via \`mergeModels\`), plus \`useModel(__props, "modelValue")\` — a ref that reads the prop and emits on write (and keeps a local value if the parent doesn't pass one).
- \`defineExpose({ count })\` → \`__expose({ count })\`. A \`<script setup>\` component always calls \`expose\`, which is why it is closed by default.
- \`defineOptions({ … })\` → merged into the exported object with \`Object.assign\`.
- \`defineSlots()\` → \`useSlots()\`; with TypeScript, type-only declarations (\`defineProps<T>()\`, \`defineEmits<…>()\`) are converted into runtime declarations from the types.
- Top-level \`await\` makes \`setup\` async and is wrapped so the current instance is restored after each await.

Because the options are moved to module scope, the compiler checks that they don't reference setup-local bindings — hence the "cannot reference locally declared variables" error.

**Template compilation (\`compileTemplate\`).** The template becomes a render function. Vue's compiler-informed virtual DOM adds:

- **Static caching/hoisting** — nodes that can never change are created once. In Vue 3.5 they're cached in the render function's \`_cache\` array and marked \`-1 /* CACHED */\`; static props objects are hoisted to module constants (\`_hoisted_1\`). Large static chunks may be turned into a single static vnode.
- **Patch flags** — a number on each dynamic element saying *what* can change: \`1\` TEXT, \`2\` CLASS, \`4\` STYLE, \`8\` PROPS (with the list of prop names), \`16\` FULL_PROPS, \`128\` KEYED_FRAGMENT (keyed \`v-for\`), and more. Flags combine as bits: \`3 /* TEXT, CLASS */\`.
- **Blocks** — \`openBlock()\`/\`createElementBlock()\` collect the dynamic descendants of a structurally stable subtree into a flat array, so updates walk just those nodes instead of the whole tree. \`v-if\` and \`v-for\` start new blocks because they change structure.
- **Cached event handlers** — inline handlers like \`@click="count++"\` are cached (\`_cache[0] || (_cache[0] = …)\`) so children don't see a "new" function every render.
`,
      {
        code: `// <ul><li v-for="i in items" :key="i.id">{{ i.name }}</li></ul>
// <p v-if="ok">yes</p>   — real Vue 3.5 output (module mode, trimmed)
return (_openBlock(), _createElementBlock(_Fragment, null, [
  _createElementVNode("ul", null, [
    (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(_ctx.items, (i) => {
      return (_openBlock(), _createElementBlock("li", { key: i.id },
        _toDisplayString(i.name), 1 /* TEXT */))
    }), 128 /* KEYED_FRAGMENT */))
  ]),
  (_ctx.ok)
    ? (_openBlock(), _createElementBlock("p", _hoisted_1, "yes"))
    : _createCommentVNode("v-if", true)
], 64 /* STABLE_FRAGMENT */))`,
        lang: 'js',
        title: 'v-for and v-if compiled',
      },
      `
Hand-written render functions (see [Render functions, h() & JSX](lesson:render-functions)) don't carry these hints, so the runtime must diff them fully. That's a large part of why templates are the recommended default. The runtime side of the story is in [How Vue updates the DOM](lesson:how-vue-updates).
`,
    ],
    production: `
- **Macros need the SFC compiler.** They only work in \`.vue\` files processed by \`@vitejs/plugin-vue\` (or an equivalent). In a plain \`.js\` file, \`defineProps\` is just an undefined function.
- **Precompile templates.** With a build step, templates are compiled ahead of time and you ship Vue's smaller runtime-only build. Compiling templates in the browser needs the full build, costs bundle size and startup time, and relies on \`new Function\`, which a strict Content Security Policy forbids. \`app.config.compilerOptions\` only applies to that runtime compiler.
- **Look at the output.** The [Vue SFC Playground](https://play.vuejs.org/) shows compiled JS for any component — the fastest way to understand a surprising behaviour.
- **Editor support:** the official Vue language tools (the "Vue - Official" extension, based on Volar) understand macros, type-check templates and provide auto-completion for props and emits.
- **Prefer type-based declarations in TypeScript projects** (\`defineProps<Props>()\`, \`defineEmits<…>()\`, \`defineSlots<…>()\`) — see [Typing props, emits, refs & computed](lesson:typing-components).
- **Avoid the defineModel default pitfall** — have parents pass a real initial value, or don't set a default.
`,
  },

  mistakes: [
    {
      title: 'Importing macros',
      wrong: { code: `import { defineProps, defineEmits } from 'vue'`, lang: 'js' },
      right: { code: `// nothing to import inside <script setup>\nconst props = defineProps({ title: String })`, lang: 'js' },
      explanation: 'Macros are compiled away. Importing them is unnecessary, and recent versions warn that they are compiler macros and no longer need importing.',
    },
    {
      title: 'Referencing local state in a macro',
      wrong: { code: `<script setup>\nlet defaultMax = 10\ndefineProps({ max: { type: Number, default: defaultMax } }) // compile error\n</script>`, lang: 'vue' },
      right: { code: `<script setup>\nimport { DEFAULT_MAX } from './config.js' // imports are fine\ndefineProps({ max: { type: Number, default: DEFAULT_MAX } })\n</script>`, lang: 'vue' },
      explanation: 'Macro arguments are hoisted to module scope, outside `setup()`. Use imports or literal constants; per-instance values can\'t be prop declarations anyway.',
    },
    {
      title: 'Watching a destructured prop directly',
      wrong: { code: `const { query } = defineProps(['query'])\nwatch(query, search) // compile error in Vue 3.5`, lang: 'js' },
      right: { code: `const { query } = defineProps(['query'])\nwatch(() => query, search)`, lang: 'js' },
      explanation: '`query` compiles to `__props.query`, a plain value at that moment — `watch` needs a reactive source. A getter re-reads `__props.query` each time. The Vue 3.5 compiler reports this as an error.',
    },
    {
      title: 'Mutating a prop instead of using a model',
      wrong: { code: `const props = defineProps(['modelValue'])\nfunction inc() { props.modelValue++ } // readonly prop: warning, no effect`, lang: 'js' },
      right: { code: `const model = defineModel()\nfunction inc() { model.value++ } // emits update:modelValue`, lang: 'js' },
      explanation: 'Props are read-only in the child. `defineModel` gives you a ref whose writes become events the parent applies — one-way data flow, without the boilerplate.',
    },
    {
      title: 'Declaring props through defineOptions',
      wrong: { code: `defineOptions({ name: 'Picker', props: ['min'] }) // compile error`, lang: 'js' },
      right: { code: `defineOptions({ name: 'Picker' })\ndefineProps(['min'])`, lang: 'js' },
      explanation: '`defineOptions` is for the remaining options (`name`, `inheritAttrs`, …). Props, emits, expose and slots have their own macros so the compiler can analyse them.',
    },
  ],

  debugging: [
    {
      symptom: '`defineProps() in <script setup> cannot reference locally declared variables…`',
      cause: 'A macro argument uses a variable declared in `<script setup>` (other than a literal `const`).',
      fix: 'Move the value to an imported module or a literal constant, or declare options in a separate normal `<script>` block.',
    },
    {
      symptom: '`"x" is a destructured prop and should not be passed directly to watch()`',
      cause: 'A destructured prop compiles to a plain value read; `watch` needs a reactive source.',
      fix: 'Use `watch(() => x, …)`, and pass `() => x` (or `toRef(props, \'x\')`) to composables.',
    },
    {
      symptom: '`ReferenceError: defineProps is not defined` at runtime.',
      cause: 'The macro is used outside `<script setup>` — in a plain `.js` file, a normal `<script>` block, or a file not processed by the SFC compiler.',
      fix: 'Use macros only in `<script setup>` of `.vue` files; elsewhere use the `props`/`emits` options.',
    },
    {
      symptom: 'A child using `defineModel` changes, but the parent\'s value doesn\'t.',
      cause: 'The parent didn\'t bind `v-model` (the ref acts locally), bound it to a non-ref value, or used the wrong name (`v-model:title` vs `defineModel()`).',
      fix: 'Bind `v-model` (or `v-model:name`) to a ref in the parent, matching the model name in the child.',
    },
    {
      symptom: 'You can\'t tell why a component re-renders or what a template compiles to.',
      cause: 'Compile-time transformations are invisible in your source.',
      fix: 'Paste the component into the Vue SFC Playground and read the JS tab; check patch flags and which nodes are cached.',
    },
  ],

  bestPractices: [
    'Use macros at the top of `<script setup>`, in a consistent order: options, props, emits, model, then logic, with `defineExpose` before any `await`.',
    'Prefer `defineModel` (3.4+) over hand-written `modelValue` + `update:modelValue` pairs.',
    'Use destructure defaults (3.5+) or `withDefaults` (TypeScript) — and pass getters when handing destructured props to `watch` or composables.',
    'Keep macro arguments static: literals, imported constants and types.',
    'Use `defineOptions` for `name` and `inheritAttrs` instead of a second `<script>` block (3.3+).',
    'Ship precompiled templates (runtime-only build); avoid in-browser template compilation in production.',
    'When something feels magical, read the compiled output in the SFC Playground.',
  ],

  useCases: [
    'Declaring a component\'s public contract (props, events, model, exposed methods) concisely.',
    'Building form controls with `defineModel`, including named models and custom modifiers.',
    'Naming components for devtools, recursion and KeepAlive with `defineOptions`.',
    'Typed component APIs in TypeScript with type-based `defineProps`/`defineEmits`/`defineSlots`.',
    'Understanding performance: reading patch flags and static caching to see what Vue will re-check.',
  ],

  whenToUse: {
    use: [
      'Any `<script setup>` component that receives props, emits events, supports `v-model` or exposes methods.',
      'You need component options like `name` or `inheritAttrs` without a second script block.',
      'You want to reason about update cost — read the compiled template.',
    ],
    avoid: [
      'Plain `.js` components or the Options API — use the `props`/`emits` options there.',
      'Computing macro arguments from runtime state — it can\'t work by design.',
      'Relying on in-browser template compilation in production apps.',
    ],
  },

  comparison: {
    title: 'What each macro compiles into',
    headers: ['macro', 'becomes', 'since', 'notes'],
    rows: [
      ['`defineProps`', '`props` option; `__props` in setup', '3.0 (reactive destructure 3.5)', 'runtime object/array or TS type'],
      ['`defineEmits`', '`emits` option; `emit` from setup context', '3.0', 'runtime array/object or TS type'],
      ['`defineModel`', 'prop + `update:` emit + `useModel()` ref', '3.4', 'named models, modifiers, `get`/`set` transforms'],
      ['`defineExpose`', '`expose()` call', '3.0', 'components are closed without it'],
      ['`defineOptions`', 'merged into the component object', '3.3', 'not for props/emits/expose/slots'],
      ['`defineSlots`', '`useSlots()`', '3.3', 'type-only (TS) slot declarations'],
      ['`withDefaults`', 'defaults merged into `props`', '3.0', 'for type-based `defineProps<T>()`'],
    ],
    note: 'Not macros, but related helpers you *do* import: `useSlots()`, `useAttrs()`, `useTemplateRef()` (3.5+), `useId()` (3.5+).',
  },

  quiz: [
    {
      id: 'compiler-macros-q1',
      type: 'mcq',
      prompt: 'Why don\'t you import `defineProps` in `<script setup>`?',
      options: [
        { text: 'Vue puts it on `window` globally', why: 'Nothing is global; it doesn\'t exist at runtime at all.' },
        { text: 'It is a compiler macro: the SFC compiler replaces it with the `props` option before the code runs' },
        { text: 'It is auto-imported by Vite from `vue`', why: 'No import happens; the call is removed during compilation.' },
        { text: 'It is a method on the component instance', why: 'There is no instance yet when props are declared — they\'re part of the component definition.' },
      ],
      answer: 1,
      explanation: 'Macros are instructions to the compiler. They are rewritten into normal component options and disappear from the output.',
    },
    {
      id: 'compiler-macros-q2',
      type: 'output',
      prompt: 'The parent first renders `<SizeLabel />`, then later `<SizeLabel size="lg" />` (Vue 3.5). What does the paragraph show, in order?',
      code: {
        lang: 'vue',
        code: `<!-- SizeLabel.vue -->
<script setup>
const { size = 'md' } = defineProps({ size: String })
</script>

<template>
  <p>{{ size }}</p>
</template>`,
      },
      options: [
        '`md`, then `lg`',
        { text: '`md`, then still `md`', why: 'Destructured props are reactive in Vue 3.5: the compiler rewrites `size` to `__props.size`.' },
        { text: '`undefined`, then `lg`', why: 'The destructure default supplies `md` when the prop is absent.' },
        { text: 'A compile error: props can\'t be destructured', why: 'Reactive destructure is supported since Vue 3.5.' },
      ],
      answer: 0,
      explanation: 'The default applies while `size` isn\'t passed; when the parent passes `lg`, the template (reading `__props.size`) updates.',
    },
    {
      id: 'compiler-macros-q3',
      type: 'bug',
      prompt: 'This component fails to compile. Click the line the compiler complains about.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
let defaultMax = 10
const props = defineProps({
  max: { type: Number, default: defaultMax },
})
const count = ref(0)
</script>

<template>
  <button @click="count++">{{ count }} / {{ max }}</button>
</template>`,
      },
      answerLine: [3, 5],
      explanation: '`defineProps` arguments are hoisted out of `setup()`, where the local `let defaultMax` doesn\'t exist. Use a literal, an imported constant, or a `const` with a literal value.',
    },
    {
      id: 'compiler-macros-q4',
      type: 'fill',
      prompt: 'Fill the blanks: a two-way bound value, and a public `reset()` method.',
      code: {
        lang: 'js',
        code: `// <script setup> of Counter.vue (used as <Counter v-model="n" ref="c" />)
const count = ___({ default: 0 })

function reset() {
  count.value = 0
}

___({ reset })`,
      },
      answer: [['defineModel'], ['defineExpose']],
      explanation: '`defineModel` (3.4+) returns a ref bound to the parent\'s `v-model`; `defineExpose` publishes `reset` for template refs.',
    },
    {
      id: 'compiler-macros-q5',
      type: 'mcq',
      prompt: 'What does `const title = defineModel(\'title\')` declare on the component?',
      options: [
        { text: 'A local ref called `title`, nothing else', why: 'It also declares a prop and an event so the parent can bind `v-model:title`.' },
        { text: 'A `title` prop, a `titleModifiers` prop and an `update:title` event — and returns a ref linked to them' },
        { text: 'A `modelValue` prop and `update:modelValue` event', why: 'Those are for the default (unnamed) model; a named model uses its own name.' },
        { text: 'A global `title` variable shared by all instances', why: 'Each instance gets its own ref tied to its own props.' },
      ],
      answer: 1,
      explanation: 'Named models follow the `v-model:title` contract: a `title` prop (plus `titleModifiers`) and an `update:title` event. The returned ref reads the prop and emits on write.',
    },
    {
      id: 'compiler-macros-q6',
      type: 'output',
      prompt: 'Part of a compiled render function. According to the patch flag, what can change on this `<p>` during updates?',
      code: {
        lang: 'js',
        code: `_createElementVNode("p", {
  class: _normalizeClass({ empty: !_ctx.count })
}, _toDisplayString(_ctx.count) + " items", 3 /* TEXT, CLASS */)`,
      },
      options: [
        'Its text and its class',
        { text: 'Only its text', why: 'Flag 3 is TEXT (1) + CLASS (2).' },
        { text: 'All of its props and children', why: 'That would be FULL_PROPS / no optimisation; flag 3 is precise.' },
        { text: 'Nothing — it is static', why: 'Static nodes are cached with `-1 /* CACHED */`, not flag 3.' },
      ],
      answer: 0,
      explanation: 'Patch flags are bit flags: TEXT = 1, CLASS = 2, so 3 means "compare the text and the class, skip everything else".',
    },
    {
      id: 'compiler-macros-q7',
      type: 'short',
      prompt: 'What do static caching and patch flags buy you at runtime, and why don\'t hand-written render functions get them?',
      answer: 'Static nodes are created once and skipped during updates, and patch flags (plus block trees) tell the renderer exactly which parts of each dynamic element can change, so it compares only those instead of diffing every prop and child. These hints come from the template compiler analysing the template ahead of time; a hand-written render function is arbitrary JavaScript, so the compiler can\'t know what is static, and the runtime has to diff its vnodes fully.',
    },
  ],

  exercises: [
    {
      id: 'star-rating',
      title: 'A StarRating built with macros',
      difficulty: 'intermediate',
      prompt: `
Build **StarRating.vue** using macros only (no Options API):

- \`defineModel\` for the rating: a Number, default \`0\`.
- Props via **destructure with defaults**: \`max\` (default \`5\`) and \`readonly\` (Boolean, default \`false\`).
- \`defineEmits(['change'])\`.
- Render \`max\` buttons \`<button class="star">\`; a star gets class \`on\` when its number (1…max) is ≤ the rating.
- Clicking star *n* sets the rating to *n* and emits \`change\` with *n*. Clicking the star equal to the current rating clears it to \`0\` (and emits \`change\` with \`0\`).
- When \`readonly\`, clicks do nothing.

App.vue (complete) uses \`<StarRating v-model="rating" />\` and shows \`.rating\`.
`,
      files: {
        'StarRating.vue': `<script setup>
// TODO: defineModel, defineProps (destructure: max, readonly), defineEmits
</script>

<template>
  <div class="stars">
    <!-- TODO: one .star button per value -->
  </div>
</template>`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'

const rating = ref(0)
</script>

<template>
  <h2>Rate this campsite</h2>
  <StarRating v-model="rating" />
  <p>Your rating: <span class="rating">{{ rating }}</span></p>
</template>`,
      },
      hints: [
        'Start with `const rating = defineModel({ type: Number, default: 0 })`, `const { max = 5, readonly = false } = defineProps({ max: Number, readonly: Boolean })` and `const emit = defineEmits([\'change\'])`.',
        'Render with `v-for="n in max"` (numbers 1…max) and `:class="[\'star\', { on: n <= rating }]"`.',
        'In `rate(n)`: return early if `readonly`; compute `const next = n === rating.value ? 0 : n`; set `rating.value = next` and `emit(\'change\', next)`.',
      ],
      solution: {
        explanation: '`defineModel` gives a ref that reads the parent\'s value and emits `update:modelValue` on write, so App\'s `rating` stays the source of truth. Destructured props with defaults are reactive (they compile to `__props.max` / `__props.readonly`). The emitted `change` event is separate from the model update — useful for analytics or saving.',
        files: {
          'StarRating.vue': `<script setup>
const rating = defineModel({ type: Number, default: 0 })
const { max = 5, readonly = false } = defineProps({
  max: Number,
  readonly: Boolean,
})
const emit = defineEmits(['change'])

function rate(n) {
  if (readonly) return
  const next = n === rating.value ? 0 : n
  rating.value = next
  emit('change', next)
}
</script>

<template>
  <div class="stars">
    <button
      v-for="n in max"
      :key="n"
      :class="['star', { on: n <= rating }]"
      :aria-label="'Rate ' + n"
      :aria-pressed="n <= rating"
      @click="rate(n)"
    >
      ★
    </button>
  </div>
</template>`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'

const rating = ref(0)
</script>

<template>
  <h2>Rate this campsite</h2>
  <StarRating v-model="rating" />
  <p>Your rating: <span class="rating">{{ rating }}</span></p>
</template>`,
        },
      },
      tests: [
        { name: 'renders five stars by default', code: `expect(findAll('.star')).toHaveLength(5); expect(findAll('.star.on')).toHaveLength(0)` },
        {
          name: 'clicking a star updates the parent via v-model',
          code: `await click(findAll('.star')[2])
expect(text('.rating')).toBe('3')
expect(findAll('.star.on')).toHaveLength(3)`,
        },
        {
          name: 'clicking the current rating clears it',
          code: `await click(findAll('.star')[2])
await click(findAll('.star')[2])
expect(text('.rating')).toBe('0')`,
        },
        {
          name: 'max prop and change event',
          code: `const w = mountFile('StarRating.vue', { modelValue: 2, max: 4 })
const stars = w.el.querySelectorAll('.star')
expect(stars.length).toBe(4)
expect(w.el.querySelectorAll('.star.on').length).toBe(2)
await click(stars[3])
expect(w.emitted('update:modelValue')[0][0]).toBe(4)
expect(w.emitted('change')[0][0]).toBe(4)`,
        },
        {
          name: 'readonly ignores clicks',
          code: `const w = mountFile('StarRating.vue', { modelValue: 2, readonly: true })
await click(w.find('.star'))
expect(w.emitted('update:modelValue')).toHaveLength(0)
expect(w.emitted('change')).toHaveLength(0)`,
        },
      ],
    },
    {
      id: 'capitalize-modifier',
      title: 'A named model with a custom modifier',
      difficulty: 'advanced',
      prompt: `
Finish **TitleInput.vue**. It must support a **named** model, \`v-model:title\`, and a custom **\`capitalize\`** modifier:

- Use \`defineModel('title', …)\` and destructure \`[title, modifiers]\`.
- When the parent writes \`v-model:title.capitalize\`, values typed by the user are stored with their **first letter upper-cased**. Without the modifier, values pass through unchanged.
- The component renders \`<input class="title-input">\` bound to the model.

App.vue (complete) renders two instances: one with \`.capitalize\` (wrapped in \`.with-mod\`, value shown in \`.heading\`) and one without (\`.without-mod\`, value in \`.plain\`).
`,
      files: {
        'TitleInput.vue': `<script setup>
// TODO: support the "capitalize" modifier
const title = defineModel('title')
</script>

<template>
  <input v-model="title" class="title-input" placeholder="Trip title" />
</template>`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import TitleInput from './TitleInput.vue'

const heading = ref('')
const plain = ref('')
</script>

<template>
  <div class="with-mod">
    <TitleInput v-model:title.capitalize="heading" />
    <p class="heading">{{ heading }}</p>
  </div>
  <div class="without-mod">
    <TitleInput v-model:title="plain" />
    <p class="plain">{{ plain }}</p>
  </div>
</template>`,
      },
      hints: [
        '`defineModel` returns `[ref, modifiers]` when destructured as an array: `const [title, modifiers] = defineModel(\'title\', { … })`.',
        'Pass a `set(value)` option: whatever it returns is what gets emitted to the parent.',
        '`set(value) { return modifiers.capitalize ? value.charAt(0).toUpperCase() + value.slice(1) : value }`.',
      ],
      solution: {
        explanation: 'For `v-model:title`, the compiler declares a `title` prop, a `titleModifiers` prop and an `update:title` event. The modifiers object arrives as `{ capitalize: true }` from the parent\'s `.capitalize`. The `set` transform runs whenever the ref is written, so the parent only ever receives the transformed value — no watcher or extra event needed.',
        files: {
          'TitleInput.vue': `<script setup>
const [title, modifiers] = defineModel('title', {
  set(value) {
    if (modifiers.capitalize && value) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    return value
  },
})
</script>

<template>
  <input v-model="title" class="title-input" placeholder="Trip title" />
</template>`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import TitleInput from './TitleInput.vue'

const heading = ref('')
const plain = ref('')
</script>

<template>
  <div class="with-mod">
    <TitleInput v-model:title.capitalize="heading" />
    <p class="heading">{{ heading }}</p>
  </div>
  <div class="without-mod">
    <TitleInput v-model:title="plain" />
    <p class="plain">{{ plain }}</p>
  </div>
</template>`,
        },
      },
      tests: [
        {
          name: 'the capitalize modifier transforms the value',
          code: `await type('.with-mod .title-input', 'summer trip')
expect(text('.heading')).toBe('Summer trip')`,
        },
        {
          name: 'without the modifier the value is unchanged',
          code: `await type('.without-mod .title-input', 'summer trip')
expect(text('.plain')).toBe('summer trip')`,
        },
        {
          name: 'declares the named model\'s props and event',
          code: `const C = requireModule('TitleInput.vue').default
const props = Array.isArray(C.props) ? C.props : Object.keys(C.props)
expect(props).toContain('title')
expect(props).toContain('titleModifiers')
expect(C.emits).toContain('update:title')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'compiler-macros-what',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a compiler macro in Vue, and which ones do you know?',
      answer: 'A function-like call that only exists for the SFC compiler: it\'s valid only in `<script setup>`, isn\'t imported, and is rewritten into normal component code at build time. The macros are `defineProps`, `defineEmits`, `defineModel` (3.4+), `defineExpose`, `defineOptions` (3.3+), `defineSlots` (3.3+) and `withDefaults`.',
      explanation: 'They let `<script setup>` declare things that must be known before the component runs — its props, events, model, name.',
      whyAsked: 'Checks familiarity with modern `<script setup>` and an understanding that it\'s compiled, not magic.',
      mistakes: ['Saying they\'re imported from `vue`.', 'Thinking they run at runtime.', 'Not knowing `defineModel` or `defineOptions`.'],
      followUps: ['Why can\'t a macro reference a local `let`?', 'What does `defineModel` compile to?'],
      modelAnswer: 'Compiler macros are calls like `defineProps` that only the SFC compiler understands. They\'re only allowed in `<script setup>`, aren\'t imported, and get replaced at build time — `defineProps` becomes the `props` option, `defineEmits` the `emits` option, `defineExpose` an `expose` call, and so on. The set is `defineProps`, `defineEmits`, `defineModel` from 3.4, `defineExpose`, `defineOptions` and `defineSlots` from 3.3, plus `withDefaults` for typed props.',
    },
    {
      id: 'compiler-macros-hoisting-error',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate gets "defineProps() in <script setup> cannot reference locally declared variables". Their code builds the props\' default from a `let` declared above. Explain the error and the options.',
      answer: 'Macro arguments are hoisted out of `setup()` into module scope, because props/emits/options are part of the component *definition*, evaluated once — not per instance. A `let` (or ref, or function) declared in `<script setup>` only exists inside `setup()`, so the compiler refuses. Fixes: use a literal or a literal `const` (which can be hoisted), import the value from a module, or declare options in a separate normal `<script>` block.',
      explanation: 'Definition-time code can\'t depend on instance-time variables.',
      whyAsked: 'Distinguishes people who understand compilation from those who memorised syntax.',
      mistakes: ['Suggesting `ref()` for the default.', 'Thinking it\'s a TypeScript issue.', 'Not knowing that imports are allowed.'],
      followUps: ['Why is `const LIMIT = 10` accepted but `let limit = 10` rejected?', 'Where else does hoisting apply?'],
      modelAnswer: 'The compiler moves macro arguments out of `setup()` to module level, because props and emits belong to the component definition, which exists once. A `let` declared in `<script setup>` only exists inside `setup`, so it can\'t be referenced there and the compiler errors. I\'d import the value from a config module or use a literal; a `const` with a literal value is fine because it can be hoisted with it. If it really must be computed, a separate plain `<script>` block can export options.',
    },
    {
      id: 'compiler-macros-definemodel',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does `defineModel()` do under the hood, and what are its caveats?',
      answer: 'It declares a `modelValue` prop (plus `modelModifiers`) and an `update:modelValue` event — or `<name>`, `<name>Modifiers` and `update:<name>` for named models — and returns a ref via `useModel()`. Reading the ref reads the prop; writing it emits the update event, so the parent\'s `v-model` changes. If the parent doesn\'t bind `v-model`, the ref works as a local ref. Caveats: requires Vue 3.4+; a `default` can desynchronise from a parent that binds `undefined`; modifiers are handled with `get`/`set` transforms.',
      explanation: 'It\'s the old prop + emit + computed getter/setter pattern, generated for you.',
      options: [
        'It declares a prop and an update event, and returns a ref that reads the prop and emits on write',
        'It creates a two-way reactive binding that mutates the parent\'s ref directly',
        'It is an alias of ref() that also syncs with localStorage',
        'It only works with the Options API',
      ],
      correctOption: 0,
      whyAsked: 'Shows whether you understand one-way data flow is preserved even with "two-way" syntax.',
      mistakes: ['Saying the child mutates the parent\'s state directly.', 'Not knowing named models or modifiers.', 'Ignoring the default-value desync.'],
      followUps: ['How would you implement a `.trim` modifier?', 'How did you write this before 3.4?'],
      modelAnswer: '`defineModel` generates the standard v-model contract: a `modelValue` prop with `modelModifiers`, and an `update:modelValue` event — or named variants. It returns a ref: reads come from the prop, writes emit the event, and the parent applies it, so data flow is still one-way. Without a parent v-model it behaves like a local ref. I watch out for defaults, which can diverge from a parent that passes `undefined`, and I implement modifiers with the `set` option.',
    },
    {
      id: 'compiler-macros-destructure-watch',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'In Vue 3.5, `const { userId } = defineProps([\'userId\'])` followed by `watch(userId, load)` fails to compile, and `useUser(userId)` never refetches when the prop changes. Explain both.',
      answer: 'Reactive props destructure is a compiler transform: every access to `userId` in the same `<script setup>` becomes `__props.userId`. At the `watch(userId, …)` call, that is just the current value, not a reactive source — Vue 3.5\'s compiler detects this and errors, telling you to pass a getter: `watch(() => userId, load)`. `useUser(userId)` receives the current value once; nothing inside can track changes. Pass `() => userId` (and use `toValue()` inside the composable) or `toRef(props, \'userId\')`.',
      explanation: 'Destructured props are reactive only where the compiler can rewrite the access — passing them elsewhere passes a snapshot.',
      code: {
        lang: 'js',
        code: `const { userId } = defineProps(['userId'])

watch(() => userId, load)     // ✅ getter re-reads __props.userId
const user = useUser(() => userId)

// useUser.js
export function useUser(id) {
  const user = ref(null)
  watchEffect(async () => { user.value = await fetchUser(toValue(id)) })
  return user
}`,
      },
      whyAsked: 'A modern-Vue (3.5) gotcha that reveals whether you understand compile-time vs runtime reactivity.',
      mistakes: ['Wrapping the value in `ref(userId)` (copies once).', 'Thinking destructuring is never reactive.', 'Not knowing `toValue()` for composables.'],
      followUps: ['How did people solve this before 3.5?', 'When is `toRef(props, \'x\')` the better choice?'],
      modelAnswer: 'Destructured props are reactive because the compiler rewrites each `userId` into `__props.userId`. But when I pass `userId` to `watch` or a composable, I\'m passing the value at that instant, not a source — so Vue 3.5\'s compiler rejects `watch(userId, …)` and suggests a getter, and the composable just never sees updates. The fix is a getter: `watch(() => userId, load)` and `useUser(() => userId)`, with the composable reading it through `toValue()`.',
    },
    {
      id: 'compiler-macros-patch-flags',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 5,
      question: 'Explain how Vue\'s template compiler makes updates cheaper. What are static caching, patch flags and block trees?',
      answer: 'The compiler analyses the template ahead of time. **Static caching/hoisting:** nodes that can never change are created once (Vue 3.5 caches them in `_cache` with the `-1 CACHED` flag; static props objects are hoisted) and skipped during updates. **Patch flags:** each dynamic element gets a bit flag describing exactly what can change — `1` text, `2` class, `4` style, `8` specific props (with their names) — so the renderer only compares those. **Block trees:** a block collects all dynamic descendants of a structurally stable subtree into a flat array, so updates iterate just those nodes, skipping static structure; `v-if`/`v-for` open new blocks because they change structure. Inline event handlers are cached too.',
      explanation: 'The compiler turns "diff everything" into "check these few things".',
      whyAsked: 'Senior candidates are expected to understand why templates perform well and how Vue\'s virtual DOM differs from a naive one.',
      mistakes: ['Saying Vue has no virtual DOM.', 'Thinking hand-written render functions get the same optimisations.', 'Confusing patch flags with reactivity tracking.'],
      followUps: ['Why does `v-for` start a new block?', 'What does flag 128 (KEYED_FRAGMENT) mean?'],
      modelAnswer: 'Because templates are analysable, Vue\'s compiler leaves hints for the runtime. Static content is created once and cached, so it\'s never diffed again. Dynamic elements carry patch flags — bits like TEXT or CLASS — telling the renderer exactly which aspects to compare. And blocks gather the dynamic descendants of a stable subtree into a flat list, so an update walks just those instead of the whole tree; `v-if` and `v-for` open new blocks since they change structure. Hand-written render functions don\'t get these hints, which is one reason templates are the default.',
    },
    {
      id: 'compiler-macros-runtime-compiler',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between Vue\'s runtime-only build and the full build with the template compiler? When would you need the latter?',
      answer: 'With a build step (Vite + `@vitejs/plugin-vue`), templates are compiled ahead of time and you ship the smaller runtime-only build. The full build includes the template compiler so templates can be compiled in the browser — needed for in-DOM templates or `template:` strings in components without a build step. It costs bundle size and startup time, runtime compilation evaluates generated code with `new Function` (blocked by a strict CSP without `unsafe-eval`), and `app.config.compilerOptions` only matters there.',
      explanation: 'Compile at build time whenever you can.',
      whyAsked: 'Practical knowledge for performance, CSP and legacy/no-build setups.',
      mistakes: ['Thinking SFCs need the full build.', 'Not knowing the CSP implication.', 'Confusing it with SSR.'],
      followUps: ['How do you embed Vue in a server-rendered page without a build step?'],
      modelAnswer: 'Normally Vite\'s Vue plugin compiles templates at build time, so the app ships the runtime-only build, which is smaller and starts faster. The full build adds the template compiler for templates written in the HTML page or as strings, typical of no-build setups. The trade-offs are bundle size, compile work in the browser, and a CSP issue because it uses `new Function`. `compilerOptions` in `app.config` only apply to that runtime compiler.',
    },
    {
      id: 'compiler-macros-coding-user-badge',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 9,
      question: 'Write `UserBadge.vue` with macros: props via destructure — `name` (required String), `role` (default `\'member\'`), `size` (default `\'md\'`); `defineEmits([\'select\'])` emitting the name when the inner button is clicked; and `defineOptions({ name: \'UserBadge\', inheritAttrs: false })` so fallthrough attributes land on the inner `<button>`, not the root `<div class="badge badge-{size}">`. Show the name in `.name` and role in `.role`.',
      starter: {
        files: {
          'UserBadge.vue': `<script setup>
// TODO: defineOptions, defineProps (destructure + defaults), defineEmits
</script>

<template>
  <div class="badge">
    <button class="select">
      <span class="name"></span>
      <span class="role"></span>
    </button>
  </div>
</template>`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import UserBadge from './UserBadge.vue'

const selected = ref('')
</script>

<template>
  <UserBadge name="Ada" role="admin" size="lg" data-test="ada-badge" @select="(n) => (selected = n)" />
  <UserBadge name="Grace" />
  <p class="selected">{{ selected }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'defaults apply',
          code: `const w = mountFile('UserBadge.vue', { name: 'Grace' })
expect(w.find('.role').textContent).toBe('member')
expect(w.find('.badge').classList.contains('badge-md')).toBe(true)`,
        },
        {
          name: 'clicking emits select with the name',
          code: `await click(findAll('.select')[0])
expect(text('.selected')).toBe('Ada')`,
        },
        {
          name: 'attrs go to the button, not the root',
          code: `const first = findAll('.badge')[0]
expect(first.getAttribute('data-test')).toBeNull()
expect(first.querySelector('button').getAttribute('data-test')).toBe('ada-badge')
expect(first.classList.contains('badge-lg')).toBe(true)`,
        },
        {
          name: 'the component is named UserBadge',
          code: `const C = requireModule('UserBadge.vue').default
expect(C.name).toBe('UserBadge')
expect(C.inheritAttrs).toBe(false)`,
        },
      ],
      hints: [
        '`defineOptions({ name: \'UserBadge\', inheritAttrs: false })` — then bind `v-bind="$attrs"` on the button.',
        '`const { name, role = \'member\', size = \'md\' } = defineProps({ name: { type: String, required: true }, role: String, size: String })`.',
        '`const emit = defineEmits([\'select\'])` and `@click="emit(\'select\', name)"`; the root gets `:class="[\'badge\', \'badge-\' + size]"`.',
      ],
      answer: 'Use `defineOptions` for the name and `inheritAttrs: false`, destructure props with defaults, declare the emit, bind `$attrs` to the inner button and emit the name on click.',
      solution: {
        files: {
          'UserBadge.vue': `<script setup>
defineOptions({ name: 'UserBadge', inheritAttrs: false })

const { name, role = 'member', size = 'md' } = defineProps({
  name: { type: String, required: true },
  role: String,
  size: String,
})
const emit = defineEmits(['select'])
</script>

<template>
  <div :class="['badge', 'badge-' + size]">
    <button class="select" v-bind="$attrs" @click="emit('select', name)">
      <span class="name">{{ name }}</span>
      <span class="role">{{ role }}</span>
    </button>
  </div>
</template>`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import UserBadge from './UserBadge.vue'

const selected = ref('')
</script>

<template>
  <UserBadge name="Ada" role="admin" size="lg" data-test="ada-badge" @select="(n) => (selected = n)" />
  <UserBadge name="Grace" />
  <p class="selected">{{ selected }}</p>
</template>`,
        },
      },
      explanation: 'Each macro maps to one part of the component contract: options, props (with reactive defaults), events. `inheritAttrs: false` plus `v-bind="$attrs"` moves fallthrough attributes (like `data-test`) from the root to the element that should receive them; declared `onSelect` isn\'t part of `$attrs` because `select` is in `emits`.',
      whyAsked: 'A compact check of the everyday macros and attribute fallthrough control.',
      mistakes: ['Putting `props` inside `defineOptions`.', 'Forgetting that declared emits are excluded from `$attrs`.', 'Using `props.size` after destructuring (works, but mixes styles).'],
      followUps: ['How would you type this component with TypeScript macros?', 'What would change with `withDefaults`?'],
      modelAnswer: 'I start with `defineOptions` for the name and `inheritAttrs: false`, then destructure the props with defaults for `role` and `size`, and declare `select` with `defineEmits`. The root div builds its class from `size`; the button gets `v-bind="$attrs"`, so things like `data-test` land there instead of on the root, and it emits the name on click. Because `select` is declared, its listener isn\'t treated as a fallthrough attribute.',
    },
  ],

  takeaways: [
    'Compiler macros (`defineProps`, `defineEmits`, `defineModel`, `defineExpose`, `defineOptions`, `defineSlots`, `withDefaults`) are compile-time instructions: no imports, nothing at runtime.',
    'Macro arguments are hoisted to module scope — use literals, literal consts and imports, never setup-local `let`s or refs.',
    '`defineModel` (3.4+) generates the prop + `update:` event contract and returns a ref; named models and modifiers (`get`/`set`) are supported.',
    'Destructured props (3.5+) stay reactive because the compiler rewrites them to `__props.x`; pass getters to `watch` and composables.',
    'Templates compile to render functions with cached static nodes, patch flags and blocks, so updates only check what can change.',
    'Ship precompiled templates, and read compiled output in the SFC Playground when something feels magical.',
  ],
}
