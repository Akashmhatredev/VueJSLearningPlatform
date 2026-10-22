// Lesson: setup(), <script setup> & defineExpose

const searchBox = `<script setup>
import { ref, useTemplateRef } from 'vue'

const props = defineProps({
  placeholder: { type: String, default: 'Search…' },
})
const emit = defineEmits(['search'])

const query = ref('')
const inputEl = useTemplateRef('input')

function submit() {
  emit('search', query.value.trim())
}

function focus() {
  inputEl.value.focus()
}

function clear() {
  query.value = ''
}

// Only these two are visible to a parent holding a template ref.
defineExpose({ focus, clear })
</script>

<template>
  <form class="search" @submit.prevent="submit">
    <input ref="input" v-model="query" class="search-input" :placeholder="props.placeholder" />
    <button class="go">Search</button>
  </form>
</template>`

const clickCounter = `<script>
import { ref } from 'vue'

export default {
  props: {
    step: { type: Number, default: 1 },
  },
  emits: ['change'],
  setup(props, { emit, expose }) {
    const count = ref(0)

    function increment() {
      count.value += props.step   // read props through the props object
      emit('change', count.value)
    }

    function reset() {
      count.value = 0
    }

    expose({ reset })             // what a parent's template ref may call

    return { count, increment }   // what this component's template may use
  },
}
</script>

<template>
  <button class="counter-btn" @click="increment">Clicked: {{ count }}</button>
</template>`

const appVue = `<script setup>
import { ref, computed, onMounted, useTemplateRef } from 'vue'
import SearchBox from './SearchBox.vue'
import ClickCounter from './ClickCounter.vue'

const box = useTemplateRef('search-box')
const counter = useTemplateRef('counter')
const lastSearch = ref('(nothing yet)')

// Try to peek at the child's private state.
const peek = computed(() => box.value?.query ?? '(hidden)')

onMounted(() => {
  console.log('Parent can use:', Object.keys(box.value).join(', '))
})
</script>

<template>
  <SearchBox ref="search-box" placeholder="Search snacks…" @search="(q) => (lastSearch = q)" />
  <p class="last">Last search: {{ lastSearch }}</p>
  <button class="focus-btn" @click="box.focus()">Focus box</button>
  <button class="clear-btn" @click="box.clear()">Clear box</button>
  <p class="peek">Parent sees query: {{ peek }}</p>
  <hr />
  <ClickCounter ref="counter" :step="2" />
  <button class="reset-btn" @click="counter.reset()">Reset counter</button>
</template>`

const searchBoxSolved = searchBox
  .replace(`import { ref, useTemplateRef } from 'vue'`, `import { ref, readonly, useTemplateRef } from 'vue'`)
  .replace(
    `function clear() {
  query.value = ''
}`,
    `function clear() {
  query.value = ''
}

function setQuery(text) {
  query.value = text
}`,
  )
  .replace(
    `defineExpose({ focus, clear })`,
    `defineExpose({ focus, clear, setQuery, query: readonly(query) })`,
  )

const appSolved = appVue.replace(
  `<button class="clear-btn" @click="box.clear()">Clear box</button>`,
  `<button class="clear-btn" @click="box.clear()">Clear box</button>
  <button class="preset" @click="box.setQuery('popcorn')">Popcorn</button>`,
)

const clickCounterSolved = clickCounter
  .replace(`import { ref } from 'vue'`, `import { ref, computed } from 'vue'`)
  .replace(
    `    const count = ref(0)
`,
    `    const count = ref(0)
    const double = computed(() => count.value * 2)
`,
  )
  .replace(`return { count, increment }   // what this component's template may use`, `return { count, double, increment }`)
  .replace(
    `<button class="counter-btn" @click="increment">Clicked: {{ count }}</button>`,
    `<button class="counter-btn" @click="increment">Clicked: {{ count }}</button>
  <p class="double">{{ double }}</p>`,
  )

const clickCounterScriptSetup = `<script setup>
import { ref } from 'vue'

const props = defineProps({
  step: { type: Number, default: 1 },
})
const emit = defineEmits(['change'])

const count = ref(0)

function increment() {
  count.value += props.step
  emit('change', count.value)
}

function reset() {
  count.value = 0
}

defineExpose({ reset })
</script>

<template>
  <button class="counter-btn" @click="increment">Clicked: {{ count }}</button>
</template>`

export default {
  id: 'setup-and-script-setup',
  title: 'setup(), <script setup> & defineExpose',
  summary: 'Where Composition API code runs: the setup() function, the <script setup> shorthand that compiles to it, and how a component chooses what its parent may touch.',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['composition-vs-options', 'props', 'emits', 'template-refs'],
  related: ['options-api', 'compiler-macros', 'component-v-model', 'dom-access-refs', 'suspense', 'reactivity-utilities'],
  tags: ['setup', 'script setup', 'defineExpose', 'expose', 'defineProps', 'defineEmits', 'template ref', 'useTemplateRef', 'compiler macros', 'setup context'],
  apis: [
    { name: 'setup(props, context)', summary: 'Component option that runs once per instance before `beforeCreate`; returns bindings for the template (or a render function).' },
    { name: '<script setup>', summary: 'Compile-time sugar for `setup()`: top-level bindings and imports are usable in the template directly.' },
    { name: 'defineExpose()', summary: 'Compiler macro that chooses which bindings a parent can reach through a template ref of a `<script setup>` component.' },
    { name: 'context.expose()', summary: 'The `setup()`-function equivalent of `defineExpose()`.' },
    { name: 'useTemplateRef()', summary: 'Returns a shallow ref bound to the element or component with a matching `ref` attribute (Vue 3.5+).' },
  ],
  docs: [
    { label: 'API — Composition API: setup()', url: 'https://vuejs.org/api/composition-api-setup.html' },
    { label: 'API — <script setup>', url: 'https://vuejs.org/api/sfc-script-setup.html' },
    { label: 'Vue Guide — Template Refs: ref on component', url: 'https://vuejs.org/guide/essentials/template-refs.html#ref-on-component' },
  ],

  intro: `
Every Composition API component needs a moment where its code runs: where refs are created, computed values defined and lifecycle hooks registered. That moment is **\`setup\`**.

You can write it two ways:

- **\`setup()\`** — a function option on a component object. It receives the props and a *context* object, and returns what the template may use.
- **\`<script setup>\`** — a special \`<script>\` block in a Single-File Component (a \`.vue\` file). The compiler turns it into a \`setup()\` function for you, so you write less and everything top-level is available in the template.

Both have one more job: deciding what a **parent** can reach. \`<script setup>\` components are *closed by default* — a parent with a template ref sees nothing until the child lists it with **\`defineExpose()\`**.
`,

  why: `
Composition API functions such as \`onMounted()\` or \`watch()\` must know *which component instance* they belong to. Vue can only know that while it is creating an instance — so there has to be one well-defined function that runs at that moment. That's \`setup()\`.

Writing \`setup()\` by hand works, but it's repetitive: you declare a variable, then remember to add it to the returned object, then repeat for every function. Forget one, and the template can't see it. \`<script setup>\` removes that ceremony — and because the compiler sees your whole script, it can also generate a leaner render function.

Finally, components need **encapsulation** (keeping internals private). If any parent could poke any internal variable of a child, refactoring the child would break parents silently. So \`<script setup>\` exposes nothing by default, and \`defineExpose()\` lets you publish a deliberate, small public API — like \`focus()\` on an input or \`open()\` on a modal.
`,

  eli15: `
Think of a component as a new employee on their first day.

**\`setup\`** is the induction morning: it happens **once**, at the very start. The employee gets their desk, their tools and their notebook (refs, computed values, functions). Some things they're told to do "when the office opens" (\`onMounted\`).

**\`setup()\`** is the long form: the manager writes a list of everything the employee may use at their desk and hands it over (the returned object).

**\`<script setup>\`** is the short form: "everything on your desk is yours to use." No list needed — the compiler writes it for you.

**\`defineExpose()\`** is the employee's **public phone extension**. Their desk is private. Other teams (parent components) can't rummage through it — they can only call the extension numbers the employee chose to publish: "call me to *focus*", "call me to *clear*".
`,

  analogy: {
    title: 'A shop with a service counter',
    body: `
A bakery has a kitchen and a counter. The kitchen is full of ovens, recipes and half-made dough — that's the component's internal state. Customers never walk into the kitchen.

What customers *can* do is listed at the counter: "order a cake", "cancel an order". That counter is \`defineExpose()\`. The bakery can rebuild its whole kitchen tomorrow and nobody outside notices, as long as the counter still offers the same services.

Opening the shop every morning — firing up the ovens, laying out tools — is \`setup\`. It happens once per shop (component instance), before the doors open (mounting).
`,
    mapping: [
      ['the kitchen', 'refs, computed values and functions inside `<script setup>`'],
      ['the service counter', 'the object passed to `defineExpose()` (or `expose()` in `setup()`)'],
      ['a customer', 'a parent component holding a template ref to the child'],
      ['opening up each morning', '`setup` running once per component instance, before mounting'],
      ['rebuilding the kitchen', 'refactoring internals without breaking parents'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'The same component, both ways',
    caption: 'Left: an explicit `setup()` function. Right: `<script setup>`. Same props, same event, same exposed method.',
    alt: 'Two code panels. Left: a component object with props, emits and a setup(props, { emit, expose }) function that creates a count ref, defines increment and reset, calls expose({ reset }) and returns { count, increment }. Right: the same component written with script setup using defineProps, defineEmits and defineExpose({ reset }), with no return statement.',
    props: {
      left: {
        label: 'setup() function',
        lang: 'js',
        code: `export default {
  props: { step: Number },
  emits: ['change'],
  setup(props, { emit, expose }) {
    const count = ref(0)
    function increment() {
      count.value += props.step
      emit('change', count.value)
    }
    function reset() { count.value = 0 }

    expose({ reset })
    return { count, increment }
  },
}`,
      },
      right: {
        label: '<script setup>',
        lang: 'vue',
        code: `<script setup>
const props = defineProps({ step: Number })
const emit = defineEmits(['change'])

const count = ref(0)
function increment() {
  count.value += props.step
  emit('change', count.value)
}
function reset() { count.value = 0 }

defineExpose({ reset })
</script>`,
      },
      points: [
        '`setup()` receives `props` and a context (`attrs`, `slots`, `emit`, `expose`); `<script setup>` gets the same things through compiler macros.',
        'With `setup()` you must **return** every binding the template uses; in `<script setup>` every top-level binding is available automatically.',
        'Both versions expose only `reset` to a parent template ref.',
        '`<script setup>` needs the SFC compiler (a build step); `setup()` works anywhere, including no-build setups.',
      ],
    },
  },

  animation: {
    type: 'concept-diagram',
    title: 'From <script setup> to a closed component',
    caption: 'Step through what the compiler generates and what a parent can actually reach.',
    alt: 'A diagram flowing left to right: script setup source goes into the SFC compiler, which produces a component with a setup function and a render function. At runtime setup creates a private child instance; only the exposed object (focus, clear) is reachable from the parent template ref.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'src', label: '<script setup>', note: 'top-level code + macros', tone: 'paper', x: 90, y: 80 },
        { id: 'compiler', label: 'SFC compiler', note: '@vue/compiler-sfc', tone: 'ink', x: 270, y: 80 },
        { id: 'setup', label: 'setup(props, ctx)', note: 'runs once per instance', tone: 'cobalt', x: 470, y: 80 },
        { id: 'render', label: 'render function', note: 'compiled template', tone: 'cobalt', x: 470, y: 230 },
        { id: 'instance', label: 'child instance', note: 'query · inputEl · submit (private)', tone: 'kraft', x: 670, y: 80 },
        { id: 'exposed', label: 'exposed object', note: '{ focus, clear }', tone: 'acid', x: 670, y: 230 },
        { id: 'parent', label: 'parent: box.value', note: 'template ref', tone: 'red', x: 270, y: 250 },
      ],
      edges: [
        { from: 'src', to: 'compiler' },
        { from: 'compiler', to: 'setup', label: 'generates' },
        { from: 'compiler', to: 'render', dashed: true },
        { from: 'setup', to: 'instance', label: 'creates state' },
        { from: 'instance', to: 'exposed', label: 'defineExpose' },
        { from: 'parent', to: 'exposed', label: 'can reach' },
      ],
      steps: [
        { focus: ['src'], text: 'You write plain top-level code: refs, functions, imports, plus **macros** like `defineProps()`, `defineEmits()` and `defineExpose()`. Macros are not imported — the compiler recognises them.' },
        { focus: ['compiler', 'setup'], edges: ['src->compiler', 'compiler->setup'], text: 'The compiler wraps your code in a `setup(__props, { expose, emit })` function. `defineProps` becomes the `props` option, `defineEmits` the `emits` option, `defineExpose` an `expose()` call.' },
        { focus: ['render'], edges: ['compiler->render'], text: 'In production builds the template is compiled into a render function placed **inside** `setup`, reading your variables directly. In development, `setup` returns an object with all your bindings instead.' },
        { focus: ['instance'], edges: ['setup->instance'], text: 'At runtime `setup` runs **once** per component instance, creating its private state. Re-renders call the render function again — never `setup`.' },
        { focus: ['exposed'], edges: ['instance->exposed'], text: 'Even with no `defineExpose`, the compiler emits an empty `expose()` call. That is what makes `<script setup>` components **closed by default**.' },
        { focus: ['parent', 'exposed'], edges: ['parent->exposed'], text: 'A parent\'s template ref receives a proxy over the exposed object only. `box.value.focus()` works; `box.value.query` is `undefined` unless it is exposed.' },
      ],
    },
  },

  syntax: [
    `
#### 1. The \`setup()\` function

\`setup\` receives two arguments and returns an object (or a render function):
`,
    {
      code: `import { ref, toRef } from 'vue'

export default {
  props: { title: String },
  emits: ['save'],
  setup(props, context) {
    // props: reactive object — read props.title, don't destructure it
    // context: { attrs, slots, emit, expose } — safe to destructure
    const { emit, expose } = context
    const title = toRef(props, 'title')   // a ref that stays in sync

    const draft = ref('')
    function save() { emit('save', draft.value) }

    expose({ save })                       // public API for parent refs
    return { draft, save, title }          // what the template can use
  },
}`,
      lang: 'js',
      title: 'setup(props, context)',
    },
    `
**Rules for \`setup()\`:**

1. It runs **once per instance**, before \`beforeCreate\`. There is no \`this\` (it's \`undefined\`).
2. \`props\` is reactive. **Destructuring it** (\`const { title } = props\`) copies the current value and loses reactivity — use \`props.title\`, \`toRef(props, 'title')\` or \`toRefs(props)\`.
3. \`context\` is a plain object; destructuring \`{ attrs, slots, emit, expose }\` is fine.
4. Only **returned** bindings are available in the template. Refs you return are unwrapped there.
5. Lifecycle hooks and watchers must be registered **synchronously** inside \`setup()\`.

#### 2. \`<script setup>\`
`,
    {
      code: `<script setup>
import { ref } from 'vue'
import SaveButton from './SaveButton.vue'   // usable as <SaveButton> directly

const props = defineProps({ title: String })  // macro: no import needed
const emit = defineEmits(['save'])

const draft = ref('')
function save() { emit('save', draft.value) }

defineExpose({ save })
</script>

<template>
  <h2>{{ title }}</h2>
  <textarea v-model="draft" />
  <SaveButton @click="save" />
</template>`,
      lang: 'vue',
      title: '<script setup>',
    },
    `
**Rules for \`<script setup>\`:**

1. Its code runs **each time an instance is created** (unlike a normal \`<script>\`, which runs once when the module is first imported).
2. Every top-level binding — variables, functions, **imports** (including components) — is usable in the template.
3. **Compiler macros** are available without importing: \`defineProps\`, \`defineEmits\`, \`defineExpose\`, plus \`defineOptions\` and \`defineSlots\` (3.3+) and \`defineModel\` (3.4+). They must be called at the top level.
4. \`useSlots()\` and \`useAttrs()\` replace \`context.slots\` / \`context.attrs\` (these *do* need importing).
5. You can add a normal \`<script>\` next to it for things that must run once per module or for named exports.

#### 3. Exposing a public API
`,
    {
      code: `<!-- Child: Modal.vue -->
<script setup>
import { ref } from 'vue'
const isOpen = ref(false)
function open() { isOpen.value = true }
function close() { isOpen.value = false }
defineExpose({ open, close })
</script>

<!-- Parent -->
<script setup>
import { useTemplateRef } from 'vue'
import Modal from './Modal.vue'
const modal = useTemplateRef('modal')      // 3.5+
</script>

<template>
  <button @click="modal.open()">Open</button>
  <Modal ref="modal" />
</template>`,
      lang: 'vue',
      title: 'defineExpose + a template ref',
    },
    {
      callout: 'version',
      title: 'Versions',
      text: '`<script setup>` is stable since Vue 3.2. `useTemplateRef()` is Vue 3.5+ (before that: `const modal = ref(null)` with a matching `ref="modal"`). Reactive destructuring of `defineProps()` (`const { title } = defineProps(...)` staying reactive) is Vue 3.5+ and only works in `<script setup>`, because the compiler rewrites it.',
    },
    {
      callout: 'warn',
      title: 'Expose actions, not internals',
      text: 'A template ref is an imperative escape hatch. Prefer props and events for data flow; expose small, stable methods like `focus()`, `open()`, `validate()` — and if you must expose state, expose it `readonly()`.',
    },
  ],

  walkthrough: {
    title: 'SearchBox.vue',
    lang: 'vue',
    code: searchBox,
    intro: 'The child component from the playground. Watch how it declares its inputs, outputs and public API.',
    steps: [
      { lines: [2], text: 'Normal imports. `useTemplateRef` (Vue 3.5+) gives us a ref to a DOM element by name. Macros like `defineProps` need **no** import.' },
      { lines: [4, 7], text: '`defineProps` declares the inputs; `defineEmits` declares the events. The compiler turns these into the `props` and `emits` options.' },
      { lines: [9, 10], text: 'Private state: the text being typed and the `<input>` element (filled in once `ref="input"` is mounted).' },
      { lines: [12, 14], text: 'The normal, *declarative* way to talk to the parent: emit an event with data.' },
      { lines: [16, 22], text: 'Two actions a parent may legitimately want to trigger imperatively: move keyboard focus here, or empty the box.' },
      { lines: [24, 25], text: '`defineExpose` publishes exactly these two functions. `query`, `inputEl` and `submit` stay private — try reading them from the parent.' },
      { lines: [28, 33], text: 'All top-level bindings (`query`, `submit`, `props`) are available in the template. `ref="input"` connects the element to `useTemplateRef(\'input\')`.' },
    ],
  },

  playground: {
    title: 'A search box with a public API',
    objective: 'Find out what a parent can and cannot reach in a child — then deliberately widen the public API.',
    files: {
      'App.vue': appVue,
      'SearchBox.vue': searchBox,
      'ClickCounter.vue': clickCounter,
    },
    entry: 'App.vue',
    expected: 'A search form, "Focus box" and "Clear box" buttons that work through the child\'s exposed methods, and a line reading **Parent sees query: (hidden)** even while you type. Below, a counter that goes up by 2 and a working "Reset counter" button. The console prints `Parent can use: focus, clear`.',
    experiments: [
      {
        id: 'expose-query',
        task: 'Make **Parent sees query** show what you type. Expose the query from `SearchBox.vue` — read-only, so the parent can look but not change it.',
        hint: 'Import `readonly` from `vue` and change the last line to `defineExpose({ focus, clear, query: readonly(query) })`.',
        tests: [
          {
            name: 'the parent can read the typed query',
            code: `await type('.search-input', 'pop')
expect(text('.peek')).toContain('pop')`,
          },
        ],
        explain: 'The parent\'s template ref is a proxy over the exposed object only, and exposed refs are unwrapped. `readonly()` keeps the child in charge of its own state.',
      },
      {
        id: 'preset',
        task: 'Add a `setQuery(text)` method to the child\'s public API, and a parent button `<button class="preset">Popcorn</button>` that fills the box with **popcorn**.',
        hint: 'In SearchBox: `function setQuery(text) { query.value = text }` and add `setQuery` to `defineExpose`. In App: `<button class="preset" @click="box.setQuery(\'popcorn\')">Popcorn</button>`.',
        tests: [
          {
            name: 'the Popcorn button fills the search box',
            code: `const btn = find('.preset')
expect(btn).toBeTruthy()
await click(btn)
expect(find('.search-input').value).toBe('popcorn')`,
          },
        ],
        explain: 'Exposing an *action* (`setQuery`) instead of a writable ref keeps the rules in one place: the child decides what "setting the query" means and could validate it.',
      },
      {
        id: 'double',
        task: 'In **ClickCounter.vue** (the explicit `setup()` version), add a computed `double` and display it in `<p class="double">` under the button.',
        hint: 'Import `computed`, write `const double = computed(() => count.value * 2)` inside `setup()` — and don\'t forget to add `double` to the returned object.',
        tests: [
          {
            name: 'after two clicks (step 2) the double reads 8',
            code: `await click('.counter-btn')
await click('.counter-btn')
expect(text('.counter-btn')).toContain('4')
expect(exists('.double')).toBe(true)
expect(text('.double')).toBe('8')`,
          },
        ],
        explain: 'With a hand-written `setup()`, the template only sees what you **return**. Forgetting the return is the classic `setup()` bug — and the main thing `<script setup>` saves you from.',
      },
      {
        id: 'script-setup-variant',
        task: 'Switch to the **ClickCounter in <script setup>** version and compare the two `ClickCounter.vue` files line by line. What disappeared?',
        hint: 'Look for the `props`/`emits` options, the `setup(props, { emit, expose })` signature and the `return` statement.',
        explain: 'Macros replaced the options and the setup signature, and the return statement vanished because every top-level binding is exposed to the template automatically. The parent\'s `counter.reset()` still works because `defineExpose({ reset })` replaced `expose({ reset })`.',
      },
    ],
    variants: [
      {
        id: 'solved',
        label: 'All experiments solved',
        files: { 'App.vue': appSolved, 'SearchBox.vue': searchBoxSolved, 'ClickCounter.vue': clickCounterSolved },
      },
      {
        id: 'counter-script-setup',
        label: 'ClickCounter in <script setup>',
        files: { 'App.vue': appVue, 'SearchBox.vue': searchBox, 'ClickCounter.vue': clickCounterScriptSetup },
      },
    ],
  },

  internals: {
    beginner: `
\`<script setup>\` is not magic at runtime — it's a **shortcut the compiler expands**. Before your app runs, the compiler rewrites the block into an ordinary component object with a \`setup()\` function. Your variables live inside that function, so each component instance gets its own copies. Whatever you pass to \`defineExpose\` becomes the only door into that private world.
`,
    technical: [
      `
Here is (lightly trimmed) what \`@vue/compiler-sfc\` produces for a small \`<script setup>\` counter **in development mode**:
`,
      {
        code: `import { ref } from 'vue'

export default {
  __name: 'Counter',
  props: { label: String },          // from defineProps
  emits: ['save'],                   // from defineEmits
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props
    const emit = __emit
    const count = ref(0)
    function increment() { count.value++; emit('save', count.value) }

    __expose({ increment })          // from defineExpose

    // every top-level binding is returned for the template
    return { props, emit, count, increment, ref }
  },
}`,
        lang: 'js',
        title: 'compiled <script setup> (dev, simplified)',
      },
      `
In **production** builds (inline template mode) the compiler instead returns the render function from inside \`setup\`, so the template reads \`count.value\` and calls \`increment\` as local variables — no lookup through a proxy:
`,
      {
        code: `setup(__props, { expose: __expose, emit: __emit }) {
  const count = ref(0)
  function increment() { /* … */ }
  __expose({ increment })
  return (_ctx, _cache) =>
    _createElementBlock('button', { onClick: increment },
      _toDisplayString(__props.label) + ': ' + _toDisplayString(count.value), 1)
}`,
        lang: 'js',
        title: 'compiled <script setup> (production, simplified)',
      },
      `
**Closed by default.** If you never call \`defineExpose\`, the compiler still emits \`__expose()\` with no arguments. Calling \`expose()\` sets \`instance.exposed\`; when a parent asks for a template ref, Vue hands out \`instance.exposeProxy\` — a proxy over \`proxyRefs(exposed)\` (refs unwrapped) that also allows a few public instance properties such as \`$el\`. Without any \`expose()\` call (a plain \`setup()\` or Options API component), the parent gets the full public instance instead.

**Why \`setup()\` must be synchronous for hooks.** \`onMounted()\` and friends look up a module-level "current instance" variable that Vue sets only while \`setup\` runs. After an \`await\` in a hand-written \`async setup()\`, that variable is gone. In \`<script setup>\`, top-level \`await\` is compiled with a helper that restores the instance after each \`await\`, so hooks still work — but the component becomes async and must be rendered inside \`<Suspense>\` (an experimental feature).
`,
    ],
    production: `
- **Default to \`<script setup>\`** in SFC projects: less boilerplate, better type inference for props/emits, and leaner production output.
- **Keep the exposed surface tiny** and treat it like a public API: name methods after intents (\`open\`, \`validate\`, \`scrollToTop\`), document them, and avoid exposing writable state. Expose state with \`readonly()\` when a parent genuinely needs to read it.
- **Prefer props/events/v-model** for data flow. Template refs bypass the one-way data flow and make components harder to test and reuse. Good imperative cases: focus management, media playback, scrolling, triggering form validation, third-party widget methods.
- **Component libraries**: when wrapping a third-party widget, expose a small set of methods and keep the widget instance private (use \`shallowRef\`/\`markRaw\` for it).
- **Testing**: Vue Test Utils' \`wrapper.vm\` gives tests access to a \`<script setup>\` component's internal state even when it is closed — convenient, but tests that depend on internals are brittle; prefer asserting on rendered output and emitted events.
- **Top-level \`await\`** turns the component into an async dependency that needs \`<Suspense>\`; most apps prefer fetching in \`onMounted\`/a composable with explicit loading state instead.
`,
  },

  mistakes: [
    {
      title: 'Calling a method on a closed `<script setup>` child',
      wrong: {
        code: `<!-- Modal.vue -->
<script setup>
function open() { /* … */ }
</script>

<!-- Parent -->
<button @click="modal.open()">Open</button>  <!-- TypeError: modal.open is not a function -->`,
        lang: 'vue',
      },
      right: {
        code: `<!-- Modal.vue -->
<script setup>
function open() { /* … */ }
defineExpose({ open })
</script>`,
        lang: 'vue',
      },
      explanation: '`<script setup>` components expose nothing to template refs by default. List the methods the parent is allowed to call with `defineExpose`.',
    },
    {
      title: 'Destructuring props in `setup()`',
      wrong: {
        code: `setup(props) {
  const { title } = props        // a one-time copy
  const heading = computed(() => title.toUpperCase())
  return { heading }             // never updates when the parent changes title
}`,
        lang: 'js',
      },
      right: {
        code: `setup(props) {
  const heading = computed(() => props.title.toUpperCase())
  // or: const { title } = toRefs(props) → title.value
  return { heading }
}`,
        lang: 'js',
      },
      explanation: '`props` is a reactive object; reading `props.title` inside a computed is what gets tracked. Destructuring copies the value once. (In `<script setup>` with Vue 3.5+, destructuring `defineProps()` *is* reactive because the compiler rewrites it to `props.title` — but plain `setup()` gets no such help.)',
    },
    {
      title: 'Forgetting to return bindings from `setup()`',
      wrong: { code: `setup() {\n  const count = ref(0)\n  function inc() { count.value++ }\n  return { count }      // inc is missing\n}`, lang: 'js' },
      right: { code: `setup() {\n  const count = ref(0)\n  function inc() { count.value++ }\n  return { count, inc }\n}`, lang: 'js' },
      explanation: 'With a hand-written `setup()`, the template only sees the returned object. Vue warns "Property \\"inc\\" was accessed during render but is not defined". `<script setup>` avoids this whole class of bug.',
    },
    {
      title: 'Registering hooks after an `await` in `setup()`',
      wrong: {
        code: `async setup() {
  const user = await fetchUser()
  onMounted(() => console.log('mounted'))  // warns: no active component instance
  return { user }
}`,
        lang: 'js',
      },
      right: {
        code: `setup() {
  const user = ref(null)
  onMounted(async () => {
    user.value = await fetchUser()
  })
  return { user }
}`,
        lang: 'js',
      },
      explanation: 'Vue knows the current instance only synchronously during `setup`. Register hooks and watchers before any `await`, and load data inside them. (Top-level `await` in `<script setup>` restores the instance, but makes the component require `<Suspense>`.)',
    },
  ],

  debugging: [
    {
      symptom: '`TypeError: x.value.someMethod is not a function` when a parent calls a child method.',
      cause: 'The child uses `<script setup>` and did not list the method in `defineExpose`, or the ref is read before the child mounted (`null`).',
      fix: 'Add the method to `defineExpose({...})`; access the ref in `onMounted` or in event handlers, and guard with `?.` if the child can be conditionally rendered.',
    },
    {
      symptom: '`[Vue warn]: Property "foo" was accessed during render but is not defined on instance`.',
      cause: 'A hand-written `setup()` did not return `foo`, or the name is misspelled.',
      fix: 'Return it from `setup()`, or switch to `<script setup>`.',
    },
    {
      symptom: 'A value derived from a prop never updates when the parent changes the prop.',
      cause: 'The prop was destructured in `setup()` (or in `<script setup>` before Vue 3.5), freezing the initial value.',
      fix: 'Read `props.x` inside the computed/watch, or use `toRef(props, \'x\')` / `toRefs(props)`.',
    },
    {
      symptom: '`defineProps is not defined` at runtime, or "defineExpose() is a compiler-hint helper that is only usable inside <script setup>".',
      cause: 'A macro was used in a plain `<script>`, inside a function, or in a `.js` file — places the SFC compiler does not transform.',
      fix: 'Call macros at the top level of `<script setup>` only. In `setup()`, use the `props` option and `context.emit` / `context.expose` instead.',
    },
  ],

  bestPractices: [
    'Use `<script setup>` for SFCs; reach for an explicit `setup()` only without a build step or in render-function components.',
    'Never destructure `props` in `setup()`; use `props.x`, `toRef` or `toRefs`.',
    'Expose a minimal, intention-named API (`focus`, `open`, `validate`) and keep state private or `readonly()`.',
    'Prefer props, events and `v-model` for data; use template refs + `defineExpose` for imperative actions only.',
    'Register lifecycle hooks and watchers synchronously at the top of setup, before any `await`.',
    'Use `useTemplateRef()` (3.5+) with a ref name different from other variables to keep template refs obvious.',
  ],

  useCases: [
    'An input component exposing `focus()` and `select()` for keyboard-friendly forms.',
    'A modal or drawer exposing `open()` / `close()` to a page-level toolbar.',
    'A form component exposing `validate()` and `reset()` so a wizard can check each step.',
    'A video/audio player wrapper exposing `play()`, `pause()` and `seek(seconds)`.',
    'A chart wrapper exposing `resize()` or `exportImage()` from a third-party library instance.',
  ],

  whenToUse: {
    use: [
      '`<script setup>`: every SFC in a project with a build step.',
      'Explicit `setup()`: no-build pages (CDN), components written with render functions, or adding composables to a legacy Options API component.',
      '`defineExpose()`: when a parent genuinely needs to trigger an imperative action in a child.',
    ],
    avoid: [
      'Exposing internal state so the parent can read and write it — pass props and emit events instead.',
      'Using template refs to pull data out of children on every render.',
      'Using `async setup()` / top-level `await` without understanding that it requires `<Suspense>` (experimental).',
    ],
  },

  comparison: {
    title: 'setup() vs <script setup>',
    headers: ['', '`setup()` function', '`<script setup>`'],
    rows: [
      ['Where', 'option on any component object', 'block inside a `.vue` file'],
      ['Needs a build step?', 'no', 'yes (SFC compiler)'],
      ['Template access', 'only what you `return`', 'all top-level bindings and imports'],
      ['Props / emits', '`props` / `emits` options + `setup(props, { emit })`', '`defineProps()` / `defineEmits()` macros'],
      ['Public API for parent refs', '`expose()` from context; open (full instance) if never called', '`defineExpose()`; closed by default'],
      ['Destructuring props', 'loses reactivity', 'reactive in Vue 3.5+ (compiler rewrites it)'],
      ['Runs', 'once per instance', 'once per instance'],
    ],
    note: 'Next: read and maintain older components in [The Options API](lesson:options-api).',
  },

  quiz: [
    {
      id: 'setup-and-script-setup-q1',
      type: 'mcq',
      prompt: 'In `<script setup>`, which bindings can the template use?',
      options: [
        { text: 'Only bindings listed in `defineExpose()`.', why: '`defineExpose` controls what a *parent* can reach, not what the template can use.' },
        { text: 'Every top-level binding, including imported components and functions.' },
        { text: 'Only refs and computed values; functions must be returned.', why: 'There is no return in `<script setup>`; functions are available too.' },
        { text: 'Only bindings declared with `const`.', why: '`let` and function declarations are available as well.' },
      ],
      answer: 1,
      explanation: 'The compiler makes all top-level declarations and imports available to the template. `defineExpose` is a separate concept: the public API for parent template refs.',
    },
    {
      id: 'setup-and-script-setup-q2',
      type: 'output',
      prompt: 'The parent logs `child.value.count` after mounting. What is printed?',
      code: {
        lang: 'vue',
        code: `<!-- Child.vue -->
<script setup>
import { ref } from 'vue'
const count = ref(5)
function inc() { count.value++ }
defineExpose({ inc })
</script>

<!-- Parent.vue -->
<script setup>
import { onMounted, useTemplateRef } from 'vue'
import Child from './Child.vue'
const child = useTemplateRef('child')
onMounted(() => console.log(child.value.count))
</script>
<template><Child ref="child" /></template>`,
      },
      options: [
        { text: '5', why: '`count` was not exposed, so the parent cannot see it.' },
        { text: 'undefined' },
        { text: 'A ref object `{ value: 5 }`', why: 'Exposed refs are unwrapped — but `count` is not exposed at all.' },
        { text: 'It throws "child.value is null"', why: 'In `onMounted` the child is already mounted, so the ref is set.' },
      ],
      answer: 1,
      explanation: 'Only `inc` is exposed. Reading anything else through the template ref gives `undefined`. Add `count` to `defineExpose` (ideally as `readonly(count)`) to make it visible.',
    },
    {
      id: 'setup-and-script-setup-q3',
      type: 'bug',
      prompt: 'The heading never changes when the parent passes a new `name`. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `import { computed } from 'vue'

export default {
  props: { name: String },
  setup(props) {
    const { name } = props
    const heading = computed(() => 'Hello, ' + name)
    return { heading }
  },
}`,
      },
      answerLine: 6,
      explanation: 'Destructuring `props` copies the current string. The computed reads a plain variable, so nothing is tracked. Use `props.name` inside the computed, or `toRef(props, \'name\')`.',
    },
    {
      id: 'setup-and-script-setup-q4',
      type: 'fill',
      prompt: 'Complete the `setup()` signature and the call that publishes `reset` to parent template refs.',
      code: {
        lang: 'js',
        code: `export default {
  emits: ['done'],
  setup(props, { ___, expose }) {
    function reset() { /* … */ }
    function finish() { emit('done') }
    ___({ reset })
    return { finish }
  },
}`,
      },
      answer: [['emit'], ['expose']],
      explanation: 'The setup context provides `attrs`, `slots`, `emit` and `expose`. `expose({ reset })` is the `setup()` equivalent of `defineExpose({ reset })`.',
    },
    {
      id: 'setup-and-script-setup-q5',
      type: 'mcq',
      prompt: 'Select **all** functions you can call in `<script setup>` **without importing** them.',
      options: [
        { text: '`defineProps()`' },
        { text: '`defineEmits()`' },
        { text: '`defineExpose()`' },
        { text: '`onMounted()`', why: 'Lifecycle hooks are normal runtime functions — import them from `vue`.' },
        { text: '`useSlots()`', why: '`useSlots` is a runtime helper and must be imported from `vue`.' },
        { text: '`defineModel()` (Vue 3.4+)' },
      ],
      answer: [0, 1, 2, 5],
      explanation: '`define*` functions are **compiler macros**: the compiler removes them and generates options/code, so they are never imported. Runtime functions like `onMounted`, `ref` and `useSlots` must be imported.',
    },
    {
      id: 'setup-and-script-setup-q6',
      type: 'short',
      prompt: 'Why are `<script setup>` components "closed by default", and why is that a good thing?',
      answer: 'The compiler always emits an `expose()` call, so a parent\'s template ref only sees what the child explicitly passes to `defineExpose`. That keeps internals private: the child can refactor its state freely, and parents are pushed towards props and events instead of reaching into children.',
    },
  ],

  exercises: [
    {
      id: 'faq-collapse-all',
      title: 'FAQ with a "Collapse all" button',
      difficulty: 'intermediate',
      prompt: `
\`FaqItem.vue\` toggles its own answer when you click its question. The page needs a **Collapse all** button.

- In \`FaqItem.vue\`, expose a \`close()\` method with \`defineExpose\` (keep \`open\` private).
- In \`App.vue\`, collect the items with a template ref on the \`v-for\` and make \`<button class="collapse-all">\` call \`close()\` on every item.
- Selectors used by the tests: \`.faq-question\` (button that toggles), \`.faq-answer\` (only rendered when open), \`.collapse-all\`.
`,
      files: {
        'FaqItem.vue': `<script setup>
import { ref } from 'vue'

defineProps({ question: String, answer: String })

const open = ref(false)

function toggle() {
  open.value = !open.value
}

// TODO: a close() method, exposed to the parent
</script>

<template>
  <div class="faq">
    <button class="faq-question" @click="toggle">{{ question }}</button>
    <p v-if="open" class="faq-answer">{{ answer }}</p>
  </div>
</template>`,
        'App.vue': `<script setup>
import FaqItem from './FaqItem.vue'

const faqs = [
  { id: 1, q: 'Is Vue free?', a: 'Yes, MIT licensed.' },
  { id: 2, q: 'Do I need a build step?', a: 'Not for the Options API via CDN.' },
  { id: 3, q: 'What is <script setup>?', a: 'Compile-time sugar for setup().' },
]

function collapseAll() {
  // TODO: call close() on every FaqItem
}
</script>

<template>
  <button class="collapse-all" @click="collapseAll">Collapse all</button>
  <FaqItem v-for="f in faqs" :key="f.id" :question="f.q" :answer="f.a" />
</template>`,
      },
      hints: [
        'The child needs `function close() { open.value = false }` and `defineExpose({ close })`.',
        'A template ref on an element with `v-for` gives you an **array** of instances: `const items = useTemplateRef(\'items\')` and `ref="items"` on `<FaqItem>`.',
        'In `collapseAll`, loop: `items.value.forEach((item) => item.close())`.',
      ],
      solution: {
        explanation: 'The item keeps `open` private and publishes one intention-named action. The parent gets an array of exposed proxies from the `v-for` template ref and calls `close()` on each. The parent never needed to know how an item stores its open state.',
        files: {
          'FaqItem.vue': `<script setup>
import { ref } from 'vue'

defineProps({ question: String, answer: String })

const open = ref(false)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

defineExpose({ close })
</script>

<template>
  <div class="faq">
    <button class="faq-question" @click="toggle">{{ question }}</button>
    <p v-if="open" class="faq-answer">{{ answer }}</p>
  </div>
</template>`,
          'App.vue': `<script setup>
import { useTemplateRef } from 'vue'
import FaqItem from './FaqItem.vue'

const faqs = [
  { id: 1, q: 'Is Vue free?', a: 'Yes, MIT licensed.' },
  { id: 2, q: 'Do I need a build step?', a: 'Not for the Options API via CDN.' },
  { id: 3, q: 'What is <script setup>?', a: 'Compile-time sugar for setup().' },
]

const items = useTemplateRef('items')

function collapseAll() {
  items.value.forEach((item) => item.close())
}
</script>

<template>
  <button class="collapse-all" @click="collapseAll">Collapse all</button>
  <FaqItem v-for="f in faqs" ref="items" :key="f.id" :question="f.q" :answer="f.a" />
</template>`,
        },
      },
      tests: [
        { name: 'items toggle on their own', code: `const qs = findAll('.faq-question')\nexpect(qs).toHaveLength(3)\nawait click(qs[0])\nawait click(qs[2])\nexpect(findAll('.faq-answer')).toHaveLength(2)` },
        {
          name: 'Collapse all closes every open item',
          code: `const qs = findAll('.faq-question')
await click(qs[0])
await click(qs[1])
await click(qs[2])
expect(findAll('.faq-answer')).toHaveLength(3)
await click('.collapse-all')
expect(findAll('.faq-answer')).toHaveLength(0)`,
        },
        { name: 'items can be reopened after collapsing', code: `await click(findAll('.faq-question')[1])\nawait click('.collapse-all')\nawait click(findAll('.faq-question')[1])\nexpect(findAll('.faq-answer')).toHaveLength(1)` },
      ],
    },
    {
      id: 'fix-setup-props',
      title: 'Fix a greeting card written with setup()',
      difficulty: 'intermediate',
      prompt: `
\`Greeting.vue\` uses a hand-written \`setup()\` function and has two problems:

1. The greeting in \`<h2 class="greeting">\` never updates when you type a new name in the parent's \`<input class="name-input">\`.
2. The \`<button class="wave">\` should emit a \`wave\` event carrying the current name, but it does nothing yet. The parent already shows the last wave in \`<p class="last-wave">\`.

Fix both **while keeping the explicit \`setup()\` function** (don't convert to \`<script setup>\`).
`,
      files: {
        'Greeting.vue': `<script>
import { computed } from 'vue'

export default {
  props: { name: { type: String, required: true } },
  emits: ['wave'],
  setup(props) {
    const { name } = props
    const greeting = computed(() => 'Hello, ' + name + '!')

    function wave() {
      // TODO: emit 'wave' with the current name
    }

    return { greeting, wave }
  },
}
</script>

<template>
  <h2 class="greeting">{{ greeting }}</h2>
  <button class="wave" @click="wave">👋 Wave</button>
</template>`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import Greeting from './Greeting.vue'

const name = ref('Ada')
const lastWave = ref('nobody yet')
</script>

<template>
  <input v-model="name" class="name-input" />
  <Greeting :name="name" @wave="(who) => (lastWave = who)" />
  <p class="last-wave">Last wave from: {{ lastWave }}</p>
</template>`,
      },
      hints: [
        'Problem 1 is the destructuring on the first line of `setup()`. What does it copy?',
        'Read `props.name` inside the computed (or use `const name = toRef(props, \'name\')` and `name.value`).',
        '`emit` comes from the second argument: `setup(props, { emit })`, then `emit(\'wave\', props.name)`.',
      ],
      solution: {
        explanation: '`props` is reactive only while you read *through* it. Reading `props.name` inside the computed makes it a tracked dependency, so the greeting follows the parent. `emit` lives on the setup context, which is safe to destructure.',
        files: {
          'Greeting.vue': `<script>
import { computed } from 'vue'

export default {
  props: { name: { type: String, required: true } },
  emits: ['wave'],
  setup(props, { emit }) {
    const greeting = computed(() => 'Hello, ' + props.name + '!')

    function wave() {
      emit('wave', props.name)
    }

    return { greeting, wave }
  },
}
</script>

<template>
  <h2 class="greeting">{{ greeting }}</h2>
  <button class="wave" @click="wave">👋 Wave</button>
</template>`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import Greeting from './Greeting.vue'

const name = ref('Ada')
const lastWave = ref('nobody yet')
</script>

<template>
  <input v-model="name" class="name-input" />
  <Greeting :name="name" @wave="(who) => (lastWave = who)" />
  <p class="last-wave">Last wave from: {{ lastWave }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'starts with Hello, Ada!', code: `expect(text('.greeting')).toBe('Hello, Ada!')` },
        { name: 'the greeting follows the parent input', code: `await type('.name-input', 'Grace')\nexpect(text('.greeting')).toBe('Hello, Grace!')` },
        { name: 'waving emits the current name', code: `await type('.name-input', 'Linus')\nawait click('.wave')\nexpect(text('.last-wave')).toBe('Last wave from: Linus')` },
      ],
    },
  ],

  interview: [
    {
      id: 'setup-and-script-setup-difference',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is `<script setup>` and how does it differ from the `setup()` option?',
      answer: '`<script setup>` is compile-time syntax sugar for `setup()` in Single-File Components. Its code runs once per component instance, every top-level binding and import is available in the template without returning it, and compiler macros (`defineProps`, `defineEmits`, `defineExpose`, …) replace the `props`/`emits` options and the setup context. A `setup()` function works without a build step but you must return bindings manually.',
      explanation: 'Same runtime behaviour, less ceremony — the compiler writes the boilerplate.',
      whyAsked: 'Baseline check that a candidate understands what they write every day in Vue 3 SFCs.',
      mistakes: ['Saying `<script setup>` runs once per module like a normal script.', 'Thinking `defineProps` must be imported.', 'Claiming `<script setup>` works without a build step.'],
      followUps: ['What does it compile to?', 'Why are `<script setup>` components closed by default?', 'Can you combine it with a normal `<script>`?'],
      modelAnswer: '`<script setup>` is syntax sugar the SFC compiler expands into a component with a `setup()` function. Its code runs once per instance; all top-level bindings, including imported components, are usable in the template, so there\'s no return object to maintain. Props, emits and the public API are declared with compiler macros like `defineProps` and `defineExpose`. The explicit `setup(props, context)` option does the same job without a compiler, which is useful for no-build setups or render-function components, but I have to return everything the template needs.',
    },
    {
      id: 'setup-and-script-setup-compiles-to',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What does `<script setup>` compile to, and what does that mean for performance and encapsulation?',
      answer: 'A normal component object: macros become `props`/`emits` options and your code goes inside `setup(__props, { expose, emit })`. In development, `setup` returns an object of all bindings; in production (inline template mode), it returns the compiled render function, which reads bindings as local variables. The compiler always emits an `expose()` call — with your `defineExpose` object or empty — so the component is closed to parent template refs by default.',
      explanation: 'Knowing the output demystifies "magic" like macros, auto-exposed bindings and closed components.',
      code: {
        lang: 'js',
        code: `export default {
  props: { label: String },
  emits: ['save'],
  setup(__props, { expose: __expose, emit: __emit }) {
    __expose()                      // closed: nothing exposed
    const count = ref(0)
    return (_ctx, _cache) => /* render using count.value */ null
  },
}`,
      },
      whyAsked: 'Separates people who use the syntax from people who understand the compiler and runtime — useful for debugging and for library work.',
      mistakes: ['Saying it compiles to the Options API (`data`, `methods`).', 'Not knowing about the always-emitted `expose()` call.', 'Inventing specific performance numbers.'],
      followUps: ['Why can local variable access minify better than `this.x`?', 'What happens to `defineProps` destructuring in 3.5+?'],
      modelAnswer: 'The SFC compiler turns it into a regular component object. `defineProps` and `defineEmits` become the `props` and `emits` options, and my code is placed inside `setup(__props, { expose, emit })`. In dev mode `setup` returns all top-level bindings for the template; in production with inline templates it returns the render function itself, so the template reads my variables directly instead of through the instance proxy, which also minifies better. The compiler always calls `expose()` — with my `defineExpose` object or nothing — so a parent\'s template ref only sees what I publish.',
    },
    {
      id: 'setup-and-script-setup-closed-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A parent calls `form.value.validate()` on a child form written with `<script setup>` and gets "validate is not a function", although `validate` is defined in the child. Why?',
      answer: '`<script setup>` components are closed by default: the parent\'s template ref only exposes what the child passes to `defineExpose`. Add `defineExpose({ validate })` in the child. Also make sure the ref is read after mount and that the child isn\'t hidden by `v-if` at that moment.',
      explanation: 'Defined is not the same as exposed. The template ref is a proxy over `instance.exposed`.',
      whyAsked: 'Extremely common real-world bug when migrating from Options API components, which were open by default.',
      mistakes: ['Suggesting `$refs` instead of fixing the exposure.', 'Blaming async timing only.', 'Exposing the entire internal state to "fix" it.'],
      followUps: ['Why might the ref be `null`?', 'Would you expose the form\'s `errors` object too? How?'],
      modelAnswer: 'Because `<script setup>` components are closed by default — the compiler emits an `expose()` call, so a template ref only sees what the child explicitly publishes. Options API components used to give the parent the whole instance, which is why this surprises people during migrations. The fix is `defineExpose({ validate })` in the child. I\'d also check the ref isn\'t read before mount or while the child is unmounted by a `v-if`. If the parent needs errors too, I\'d expose them read-only.',
    },
    {
      id: 'setup-and-script-setup-props-destructure',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'The parent changes `count` from 1 to 2. What does each child render? Child A uses `setup(props) { const { count } = props; return { shown: computed(() => count * 10) } }`. Child B (Vue 3.5, `<script setup>`) uses `const { count } = defineProps([\'count\'])` and `const shown = computed(() => count * 10)`.',
      options: ['A: 10, B: 10', 'A: 20, B: 20', 'A: 10, B: 20', 'A: 20, B: 10'],
      correctOption: 2,
      answer: '**A shows 10, B shows 20.** In a plain `setup()`, destructuring copies the value once. In `<script setup>` on Vue 3.5+, the compiler rewrites destructured prop variables to `__props.count`, so the computed tracks the prop.',
      explanation: 'Same-looking code, different behaviour: the 3.5+ reactive props destructure is a compiler feature, not a runtime one.',
      whyAsked: 'Tests up-to-date Vue knowledge and a clear model of where reactivity is tracked.',
      mistakes: ['Assuming destructuring is reactive everywhere in 3.5+.', 'Assuming destructuring is never reactive (true before 3.5).'],
      followUps: ['How do you watch a destructured prop in 3.5+?', 'What would you use before 3.5?'],
      modelAnswer: 'Child A shows 10 and child B shows 20. In a plain `setup()` the destructuring happens at runtime and copies the number, so the computed depends on nothing reactive. In `<script setup>` from Vue 3.5, destructured `defineProps` variables are rewritten by the compiler into `__props.count` accesses, so the computed tracks the prop. One caveat: to watch such a variable you pass a getter, `watch(() => count, ...)`. Before 3.5, I\'d use `props.count` or `toRefs(props)`.',
    },
    {
      id: 'setup-and-script-setup-expose-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You are building a design-system `<DatePicker>`. Product teams ask for a way to open it from a toolbar button and to read its selected date. How do you design the API?',
      answer: 'Use `v-model` (props + `update:modelValue`, or `defineModel()` in 3.4+) for the selected date — that is data, and it should flow declaratively. For opening, prefer a prop like `v-model:open` if the open state matters to the parent; if it\'s a fire-and-forget action, expose a small imperative API with `defineExpose({ open, close, focus })`. Never expose internal state writable; if teams need to read something else, expose it `readonly()` and document it as public API.',
      explanation: 'Data → props/v-model. Commands → exposed methods. Keep the public surface small because every exposed member becomes a compatibility promise.',
      whyAsked: 'Assesses API design and understanding of one-way data flow vs imperative escape hatches — key for senior and library roles.',
      mistakes: ['Exposing the internal `selectedDate` ref so parents can write it.', 'Using only template refs for everything.', 'Ignoring that exposed members become a semver commitment.'],
      followUps: ['How would you test the exposed methods?', 'How do you type `defineExpose` for consumers in TypeScript?', 'When is `v-model:open` better than `open()`?'],
      modelAnswer: 'I\'d split data from commands. The selected date is data, so it goes through `v-model` — with `defineModel()` on 3.4+ — keeping the one-way flow and making the component easy to test. Opening is a command; if the parent needs to know or control whether it is open, I\'d use `v-model:open`, otherwise I\'d expose a small set of intent-named methods with `defineExpose`, like `open`, `close` and `focus`. Anything else stays private, or read-only if there\'s a real need. Every exposed member becomes public API for other teams, so I\'d document it and treat changes as breaking.',
    },
    {
      id: 'setup-and-script-setup-top-level-await',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What happens if you use top-level `await` in `<script setup>`, and why is a hand-written `async setup()` riskier?',
      answer: 'Top-level `await` makes the component\'s setup async, so it must be rendered inside `<Suspense>` (experimental). The compiler wraps each `await` with a helper that restores the current component instance afterwards, so lifecycle hooks and watchers registered after the `await` still attach correctly. In a hand-written `async setup()`, nothing restores the instance: hooks registered after an `await` warn and are not attached.',
      explanation: 'Vue tracks "the component currently being set up" synchronously; `await` breaks that unless the compiler helps.',
      whyAsked: 'Probes deep understanding of the current-instance mechanism behind composables and lifecycle hooks.',
      mistakes: ['Saying top-level await is just syntax with no consequences.', 'Not knowing `<Suspense>` is required (and experimental).', 'Claiming hooks after await always work.'],
      followUps: ['How would you load data without Suspense?', 'Why must composables be called synchronously?'],
      modelAnswer: 'With top-level `await`, `<script setup>` compiles to an async setup, so the component becomes an async dependency that needs a `<Suspense>` boundary — which is still experimental. Vue finds "the current instance" through a variable that\'s only set synchronously during setup; the compiler preserves it across each top-level `await`, so hooks registered after it still work. A hand-written `async setup()` gets no such help, and `onMounted` after an `await` warns about no active instance. In most apps I avoid this and load data in a composable with explicit loading and error state.',
    },
    {
      id: 'setup-and-script-setup-modal-coding',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: '`Modal.vue` shows its content when open. Expose `open()` and `close()` with `defineExpose`, keep `isOpen` private, and wire the parent: `.open-btn` opens it, the modal\'s own `.close-btn` closes it, and the parent shows `<p class="status">` reading `open` or `closed` from a `change` event the modal emits with a boolean.',
      starter: {
        files: {
          'Modal.vue': `<script setup>
import { ref } from 'vue'

const emit = defineEmits(['change'])
const isOpen = ref(false)

// TODO: open() and close() that update isOpen and emit 'change'
// TODO: expose them
</script>

<template>
  <div v-if="isOpen" class="modal">
    <slot />
    <button class="close-btn">Close</button>
  </div>
</template>`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'

const status = ref('closed')
</script>

<template>
  <button class="open-btn">Open</button>
  <p class="status">{{ status }}</p>
  <Modal>Hello from the modal!</Modal>
</template>`,
        },
      },
      tests: [
        { name: 'starts closed', code: `expect(exists('.modal')).toBe(false)\nexpect(text('.status')).toBe('closed')` },
        { name: 'Open button opens it via the exposed method', code: `await click('.open-btn')\nexpect(exists('.modal')).toBe(true)\nexpect(text('.modal')).toContain('Hello from the modal!')\nexpect(text('.status')).toBe('open')` },
        { name: 'Close button closes it and reports closed', code: `await click('.open-btn')\nawait click('.close-btn')\nexpect(exists('.modal')).toBe(false)\nexpect(text('.status')).toBe('closed')` },
      ],
      hints: [
        '`function open() { isOpen.value = true; emit(\'change\', true) }` and the same for close.',
        '`defineExpose({ open, close })`, `@click="close"` on the close button.',
        'In the parent: `const modal = useTemplateRef(\'modal\')`, `<Modal ref="modal" @change="(o) => (status = o ? \'open\' : \'closed\')">`, and `@click="modal.open()"`.',
      ],
      solution: {
        files: {
          'Modal.vue': `<script setup>
import { ref } from 'vue'

const emit = defineEmits(['change'])
const isOpen = ref(false)

function open() {
  isOpen.value = true
  emit('change', true)
}

function close() {
  isOpen.value = false
  emit('change', false)
}

defineExpose({ open, close })
</script>

<template>
  <div v-if="isOpen" class="modal">
    <slot />
    <button class="close-btn" @click="close">Close</button>
  </div>
</template>`,
          'App.vue': `<script setup>
import { ref, useTemplateRef } from 'vue'
import Modal from './Modal.vue'

const status = ref('closed')
const modal = useTemplateRef('modal')
</script>

<template>
  <button class="open-btn" @click="modal.open()">Open</button>
  <p class="status">{{ status }}</p>
  <Modal ref="modal" @change="(o) => (status = o ? 'open' : 'closed')">Hello from the modal!</Modal>
</template>`,
        },
      },
      answer: 'The modal keeps `isOpen` private, exposes `open`/`close`, and reports changes with an event; the parent triggers actions via a template ref and reacts to the event.',
      explanation: 'Commands go in through the exposed API; information comes out through events. The parent never touches `isOpen`.',
      whyAsked: 'A realistic live-coding task that combines template refs, `defineExpose`, slots and events.',
      mistakes: ['Exposing `isOpen` and toggling it from the parent.', 'Forgetting that the modal must emit when closing itself.', 'Reading the template ref before mount.'],
      followUps: ['How would you do this with `v-model:open` instead?', 'How would you add Escape-to-close and focus trapping?'],
      modelAnswer: 'The modal owns `isOpen`. I write `open` and `close` functions that update it and emit `change` with the new boolean, then publish just those two with `defineExpose`. The close button inside calls `close` directly. The parent holds a template ref, calls `modal.open()` from its button, and listens to `@change` to update its status text. For a design system I\'d probably also offer `v-model:open` so parents can control it declaratively.',
    },
  ],

  takeaways: [
    '`setup` runs once per component instance, before `beforeCreate`, with no `this`; hooks and watchers must be registered synchronously inside it.',
    '`setup(props, { attrs, slots, emit, expose })` must return what the template uses; never destructure `props` there.',
    '`<script setup>` compiles to `setup()`: top-level bindings and imports are template-ready, and macros (`defineProps`, `defineEmits`, `defineExpose`, …) need no import.',
    '`<script setup>` components are closed by default; `defineExpose()` publishes a deliberate public API for parent template refs.',
    'Use props/events/v-model for data and `defineExpose` for imperative actions like `focus()`, `open()` or `validate()`.',
  ],
}
