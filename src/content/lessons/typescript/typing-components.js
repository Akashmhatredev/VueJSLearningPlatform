// Lesson: Typing props, emits, refs & computed (Level 18 — optional TypeScript track)
//
// Runnable code is JavaScript (runtime declarations — the JS counterpart of
// type-based declarations). TypeScript is shown in static code blocks.

const ratingJs = `<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  max: { type: Number, default: 5 },
  label: { type: String, required: true },
})

const emit = defineEmits({
  // Runs in development and warns when it returns false.
  'update:modelValue': (value) => Number.isInteger(value) && value >= 1,
})

const stars = computed(() => Array.from({ length: props.max }, (_, i) => i + 1))

function choose(n) {
  emit('update:modelValue', n)
}
</script>

<template>
  <div class="rating" role="radiogroup" :aria-label="label">
    <button
      v-for="n in stars"
      :key="n"
      type="button"
      role="radio"
      class="star"
      :class="{ on: n <= modelValue }"
      :aria-checked="n === modelValue"
      @click="choose(n)"
    >★</button>
  </div>
</template>`

const ratingTs = `<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: number
  max?: number
  label: string
}

const props = withDefaults(defineProps<Props>(), { max: 5 })

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const stars = computed(() => Array.from({ length: props.max }, (_, i) => i + 1))
//    ^? ComputedRef<number[]> — inferred

function choose(n: number) {
  emit('update:modelValue', n)
  // emit('update:modelValue', '3')  ❌ string is not assignable to number
}
</script>`

const appVue = `<script setup>
import { ref } from 'vue'
import RatingInput from './RatingInput.vue'

const rating = ref(3)
</script>

<template>
  <h2>Rate the Trail Backpack</h2>
  <RatingInput v-model="rating" label="Your rating" />
  <p class="value">You chose {{ rating }} star(s).</p>
  <textarea class="note" placeholder="Tell us more…"></textarea>
</template>`

// ---------- exercise 1: translate TS declarations to runtime declarations
const todoApp = `<script setup>
import { ref } from 'vue'
import TodoItem from './TodoItem.vue'

const todos = ref([
  { id: 1, title: 'Pack the tent', done: false },
  { id: 2, title: 'Buy a stove', done: true },
])

function toggle(id) {
  const todo = todos.value.find((t) => t.id === id)
  todo.done = !todo.done
}

function rename(id, title) {
  todos.value.find((t) => t.id === id).title = title
}
</script>

<template>
  <ul>
    <TodoItem v-for="t in todos" :key="t.id" :todo="t" @toggle="toggle" @rename="rename" />
  </ul>
</template>`

const todoStarter = `<script setup>
// Translate these TypeScript declarations (static) into runtime declarations:
//
//   interface Todo { id: number; title: string; done: boolean }
//   const props = withDefaults(defineProps<{ todo: Todo; editable?: boolean }>(), {
//     editable: true,
//   })
//   const emit = defineEmits<{
//     toggle: [id: number]
//     rename: [id: number, title: string]
//   }>()
const props = defineProps(['todo', 'editable'])
const emit = defineEmits(['toggle', 'rename'])

function onEnter(event) {
  emit('rename', props.todo.id, event.target.value)
}
</script>

<template>
  <li class="todo">
    <input type="checkbox" class="done" :checked="props.todo.done" @change="emit('toggle', props.todo.id)" />
    <input v-if="props.editable" class="title" :value="props.todo.title" @keyup.enter="onEnter" />
    <span v-else class="title">{{ props.todo.title }}</span>
  </li>
</template>`

const todoSolution = `<script setup>
const props = defineProps({
  todo: {
    type: Object,
    required: true,
    validator: (t) => typeof t.id === 'number' && typeof t.title === 'string' && typeof t.done === 'boolean',
  },
  editable: { type: Boolean, default: true },
})

const emit = defineEmits({
  toggle: (id) => Number.isInteger(id),
  rename: (id, title) => Number.isInteger(id) && typeof title === 'string' && title.trim() !== '',
})

function onEnter(event) {
  const title = event.target.value.trim()
  if (title) emit('rename', props.todo.id, title)
}
</script>

<template>
  <li class="todo">
    <input type="checkbox" class="done" :checked="props.todo.done" @change="emit('toggle', props.todo.id)" />
    <input v-if="props.editable" class="title" :value="props.todo.title" @keyup.enter="onEnter" />
    <span v-else class="title">{{ props.todo.title }}</span>
  </li>
</template>`

// ---------- exercise 2: component template refs + defineExpose
const searchBoxStarter = `<script setup>
import { useTemplateRef } from 'vue'

const input = useTemplateRef('input') // 3.5+

// TODO: expose focus() and clear() to the parent
</script>

<template>
  <input ref="input" class="search" type="search" placeholder="Search products" />
</template>`

const searchBoxSolution = `<script setup>
import { useTemplateRef } from 'vue'

const input = useTemplateRef('input') // 3.5+

function focus() {
  input.value?.focus()
}

function clear() {
  if (input.value) input.value.value = ''
}

// <script setup> components are closed by default: expose a small, deliberate API.
defineExpose({ focus, clear })
</script>

<template>
  <input ref="input" class="search" type="search" placeholder="Search products" />
</template>`

const searchAppStarter = `<script setup>
import SearchBox from './SearchBox.vue'

// TODO: get the SearchBox instance and call its focus() / clear()
</script>

<template>
  <SearchBox />
  <button class="focus-search">Focus search</button>
  <button class="clear-search">Clear</button>
</template>`

const searchAppSolution = `<script setup>
import { useTemplateRef } from 'vue'
import SearchBox from './SearchBox.vue'

// TS: useTemplateRef<InstanceType<typeof SearchBox>>('searchBox')
const searchBox = useTemplateRef('searchBox')
</script>

<template>
  <SearchBox ref="searchBox" />
  <button class="focus-search" @click="searchBox?.focus()">Focus search</button>
  <button class="clear-search" @click="searchBox?.clear()">Clear</button>
</template>`

// ---------- interview coding: what the compiler does with type-based props
const runtimeStarter = `// Simplified model of how Vue's compiler turns type-based props into runtime props.
// shape: { 'title': 'string', 'count?': 'number', 'tags': 'string[]', … }
export function toRuntimeProps(shape) {
  return {}
}`

const runtimeSolution = `const PRIMITIVES = {
  string: String,
  number: Number,
  boolean: Boolean,
  function: Function,
  object: Object,
}

export function toRuntimeProps(shape) {
  const props = {}
  for (const [rawKey, rawType] of Object.entries(shape)) {
    const optional = rawKey.endsWith('?')
    const key = optional ? rawKey.slice(0, -1) : rawKey
    const t = rawType.trim()

    let type
    if (t.endsWith('[]')) type = Array
    else if (t.startsWith("'")) type = String // a union of string literals
    else type = PRIMITIVES[t] ?? null        // unknown: accept any type

    props[key] = { type, required: !optional }
  }
  return props
}`

const runtimeApp = `<script setup>
import { toRuntimeProps } from './toRuntimeProps.js'

const props = toRuntimeProps({ 'title': 'string', 'count?': 'number' })
</script>

<template>
  <pre class="out">{{ Object.keys(props) }}</pre>
</template>`

export default {
  id: 'typing-components',
  title: 'Typing props, emits, refs & computed',
  summary: 'Declare component contracts with TypeScript — type-based props and defaults, typed emits, refs, reactive objects, computed values and template refs — and see how they map to Vue\'s runtime declarations.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['why-typescript', 'props', 'emits'],
  related: ['typing-composables-stores', 'component-v-model', 'template-refs', 'computed', 'compiler-macros', 'dom-access-refs'],
  tags: ['typescript', 'defineProps', 'withDefaults', 'defineEmits', 'defineModel', 'ref', 'reactive', 'computed', 'useTemplateRef', 'PropType', 'InstanceType', 'type inference'],
  apis: [
    { name: 'defineProps<T>()', summary: 'Type-based props declaration; the compiler also generates matching runtime options.' },
    { name: 'withDefaults()', summary: 'Adds default values to type-based props (or use reactive props destructure defaults, 3.5+).' },
    { name: 'defineEmits<T>()', summary: 'Typed events; the named-tuple syntax `{ change: [id: number] }` needs 3.3+.' },
    { name: 'defineModel<T>()', summary: 'Typed two-way binding prop + update event (3.4+).' },
    { name: 'ref<T>() / computed<T>()', summary: 'Explicit generic types when inference isn\'t enough.' },
    { name: 'useTemplateRef<T>()', summary: 'Typed template ref (3.5+).' },
    { name: 'PropType<T>', summary: 'Types a runtime prop declaration: `Object as PropType<Book>`.' },
  ],
  docs: [
    { label: 'Vue Guide — TypeScript with Composition API', url: 'https://vuejs.org/guide/typescript/composition-api.html' },
    { label: 'Vue Guide — Typing component props', url: 'https://vuejs.org/guide/typescript/composition-api.html#typing-component-props' },
    { label: 'Vue Guide — Typing template refs', url: 'https://vuejs.org/guide/typescript/composition-api.html#typing-template-refs' },
    { label: 'API — defineProps() & defineEmits()', url: 'https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits' },
  ],

  intro: `
A component's **props** and **events** are its contract with the outside world: "give me a \`number\` called \`modelValue\`; I'll tell you about changes with an \`update:modelValue\` event carrying a \`number\`."

In JavaScript you write that contract as **runtime declarations** — objects like \`{ type: Number, required: true }\` that Vue checks while the app runs (in development). In TypeScript you can write it as **types** — \`defineProps<{ modelValue: number }>()\` — which your editor and \`vue-tsc\` check before anything runs, everywhere the component is used.

This lesson covers the everyday typing toolkit: props and defaults, emits, \`v-model\`, refs, reactive objects, computed values and template refs. Each TypeScript idea is paired with its runnable JavaScript counterpart.
`,

  why: `
Without types, a component's contract lives in your head (or a comment). Callers find out they passed a string instead of a number when a warning appears in the console — if they open it — or when a customer sees "NaN stars".

With typed props and emits:

- **Every usage is checked**: \`<RatingInput :model-value="'3'" />\` is underlined in the parent's template.
- **Autocomplete** suggests prop names and event payloads.
- **Refactors are safe**: rename \`max\` to \`maxStars\` and every outdated usage turns red.
- **Inside the component**, \`props.max\` is known to be a \`number\` — no defensive \`Number(props.max)\`.

Refs and computed values mostly type themselves through **inference**. You add annotations in the places inference can't see: a ref that starts as \`null\`, an element from a template ref, an event's target.
`,

  eli15: `
Think of a component as a **vending machine**. The slot on the front says "coins only: 10, 20, 50". The display says "will drop one drink".

- **Props** are the slot: what you may put in.
- **Emits** are what comes out: the drink (and a receipt, maybe).

In JavaScript, the machine checks your coin **when you insert it** — if it's a button, it beeps (a console warning). In TypeScript, the shape of the slot is printed on the **blueprint** — your editor spots the button in your hand before you even walk up to the machine.

And **refs** are labelled jars on the machine's shelf: "this jar holds a number", "this jar will hold the screen element once the machine is switched on — empty until then".
`,

  analogy: {
    title: 'The vending machine blueprint',
    body: `
A runtime declaration is the coin checker inside the machine; a type-based declaration is the slot shape on the blueprint. Vue's compiler even builds the coin checker *from* the blueprint: type-based props are turned into runtime options automatically.
`,
    mapping: [
      ['the coin slot', 'props — what the component accepts'],
      ['the drink that drops out', 'emits — the events and their payloads'],
      ['the coin checker inside', 'runtime prop/emit validation (development warnings)'],
      ['the slot shape on the blueprint', 'type-based `defineProps<T>()` / `defineEmits<T>()`'],
      ['a jar labelled "number"', '`ref<number>()` — or inferred from `ref(0)`'],
      ['the jar for the screen, empty until power-on', 'a template ref: `HTMLInputElement | null`'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'One component, two ways to declare its contract',
    caption: 'Left is runnable in the playground. Right is the same contract as types — checked in the editor and at every call site.',
    alt: 'Side by side. Left: RatingInput in JavaScript with runtime props (type Number, required, default 5) and an emits object with a validator. Right: the same component with lang="ts", a Props interface, withDefaults for max, and a typed defineEmits using a named tuple; comments show the inferred computed type and a rejected emit call.',
    props: {
      left: { label: 'JavaScript: runtime declarations', lang: 'vue', code: ratingJs.split('</script>')[0] + '</script>' },
      right: { label: 'TypeScript: type-based declarations', lang: 'vue', code: ratingTs },
      points: [
        '`{ type: Number, required: true }` ↔ `modelValue: number`; `default: 5` ↔ `max?: number` + `withDefaults`.',
        'Emit validators check payloads at runtime (dev only); the typed tuple checks every `emit()` call while you type.',
        'From the type-based version, Vue\'s compiler generates equivalent runtime props, so dev warnings still work.',
        'You use one style per `defineProps` call — not both at once.',
      ],
    },
  },

  animation: {
    type: 'concept-diagram',
    title: 'What happens to defineProps<Props>()',
    caption: 'One type declaration feeds two consumers: the type checker, and the compiler that generates runtime props.',
    alt: 'A diagram: a Props interface in a .vue file flows to the editor and vue-tsc for type checking at every call site, and to Vue\'s SFC compiler, which generates a runtime props object with types and required flags. The runtime object ends up in the JavaScript bundle and produces development warnings.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'type', label: 'defineProps<Props>()', note: 'interface Props { … }', tone: 'cobalt', x: 110, y: 160 },
        { id: 'checker', label: 'Editor + vue-tsc', note: 'checks every <RatingInput …>', tone: 'acid', x: 380, y: 70 },
        { id: 'compiler', label: 'SFC compiler', note: 'reads the type', tone: 'kraft', x: 380, y: 250 },
        { id: 'runtime', label: 'props: { modelValue: { type: Number, required: true } }', note: 'in the JS bundle', tone: 'paper', x: 620, y: 250 },
        { id: 'warn', label: 'Dev warning', note: '"Invalid prop: type check failed"', tone: 'red', x: 640, y: 70 },
      ],
      edges: [
        { from: 'type', to: 'checker', label: 'types' },
        { from: 'type', to: 'compiler', label: 'build' },
        { from: 'compiler', to: 'runtime' },
        { from: 'runtime', to: 'warn', label: 'dev only', dashed: true },
      ],
      steps: [
        { focus: ['type'], text: 'You declare props as a type: `defineProps<{ modelValue: number; max?: number }>()`. No runtime object written by hand.' },
        { focus: ['checker'], edges: ['type->checker'], text: 'The editor and `vue-tsc` use the type to check **callers** (parent templates) and the component\'s own code, before anything runs.' },
        { focus: ['compiler'], edges: ['type->compiler'], text: 'At build time, Vue\'s SFC compiler reads the same type and works out the equivalent runtime options: `number` → `Number`, optional `?` → `required: false`, string-literal unions → `String`, arrays → `Array`.' },
        { focus: ['runtime'], edges: ['compiler->runtime'], text: 'The generated runtime props object is what the browser receives — exactly what you would write by hand in JavaScript. (Types it can\'t map become `type: null`, meaning "any".)' },
        { focus: ['warn'], edges: ['runtime->warn'], text: 'In development builds those runtime options still validate values, so a component used from untyped code still warns. Production builds skip the warnings.' },
      ],
    },
  },

  syntax: [
    `
#### Props
`,
    {
      code: `<script setup lang="ts">
interface Props {
  title: string
  count?: number                 // optional
  size?: 'sm' | 'md' | 'lg'      // union of literals
  tags?: string[]
}

// Defaults (all versions with type-based props):
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  size: 'md',
  tags: () => [],                // mutable defaults: factory function
})

// Or, Vue 3.5+: reactive props destructure with defaults
// const { title, count = 0, size = 'md' } = defineProps<Props>()
</script>`,
      lang: 'vue',
      title: 'type-based props (static example)',
      static: true,
    },
    `
- Since Vue 3.3, the type argument can be an imported type and some complex types; very dynamic types (e.g. conditional types) may not be convertible to runtime props.
- A props object type for runtime declarations: \`defineProps({ book: { type: Object as PropType<Book>, required: true } })\`.

#### Emits and v-model
`,
    {
      code: `<script setup lang="ts">
// Named tuples (3.3+): event name → payload
const emit = defineEmits<{
  change: [id: number]
  rename: [id: number, title: string]
}>()

emit('change', 42)          // ✅
// emit('change', '42')     // ❌ string is not assignable to number
// emit('chnage', 42)       // ❌ unknown event name

// Two-way binding (3.4+): a typed prop + update event in one line
const model = defineModel<number>({ required: true })
model.value++               // emits 'update:modelValue'
</script>`,
      lang: 'vue',
      title: 'typed emits and defineModel (static example)',
      static: true,
    },
    `
#### Refs, reactive and computed
`,
    {
      code: `import { ref, reactive, computed, type Ref } from 'vue'

const count = ref(0)                          // Ref<number> — inferred
const year = ref<string | number>('2026')     // explicit union
const user = ref<User | null>(null)           // starts empty, filled later

interface Book { title: string; year?: number }
const book: Book = reactive({ title: 'Vue 3 Guide' })   // annotate, don't use reactive<Book>()

const double = computed(() => count.value * 2)          // ComputedRef<number>
const label = computed<string>(() => \`\${count.value} items\`)  // explicit (rarely needed)`,
      lang: 'ts',
      title: 'refs, reactive, computed (static example)',
      static: true,
    },
    `
#### Template refs and DOM events
`,
    {
      code: `<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'
import SearchBox from './SearchBox.vue'

const input = useTemplateRef<HTMLInputElement>('input')                    // 3.5+
const search = useTemplateRef<InstanceType<typeof SearchBox>>('search')   // component

onMounted(() => input.value?.focus())        // null before mount → optional chaining

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value   // target is just EventTarget
}
</script>

<template>
  <input ref="input" @input="onInput" />
  <SearchBox ref="search" />
</template>`,
      lang: 'vue',
      title: 'template refs (static example)',
      static: true,
    },
    {
      callout: 'version',
      title: 'Version notes',
      text: 'Type-based `defineProps`/`defineEmits` work with `<script setup lang="ts">`; imported/complex prop types and the named-tuple emits syntax need 3.3+; `defineModel` 3.4+; `useTemplateRef` and reactive props destructure 3.5+. Before 3.5, type template refs as `ref<HTMLInputElement | null>(null)`.',
    },
  ],

  walkthrough: {
    title: 'RatingInput.vue',
    lang: 'vue',
    code: ratingJs,
    intro: 'The playground\'s JavaScript component, read with TypeScript eyes: every runtime option has a type-based twin.',
    steps: [
      { lines: [4, 8], text: 'Runtime props. `{ type: Number, required: true }` is `modelValue: number`; `default: 5` is `max?: number` with `withDefaults(…, { max: 5 })`.' },
      { lines: [10, 13], text: 'An emits object with a validator: `update:modelValue` must carry a positive integer. The TS twin is `defineEmits<{ \'update:modelValue\': [value: number] }>()` — checked at every `emit()` call instead of at runtime.' },
      { lines: [15], text: 'A computed list of star numbers. In TypeScript its type, `ComputedRef<number[]>`, is inferred — no annotation needed.' },
      { lines: [17, 19], text: 'In TS you\'d annotate the parameter: `function choose(n: number)`. Parameters are one of the few places where inference can\'t help.' },
      { lines: [23, 35], text: 'The template uses `modelValue`, `label` and `stars`. With TypeScript, `vue-tsc` checks these expressions too — a typo like `{{ lable }}` would be an error.' },
    ],
  },

  playground: {
    title: 'A star rating with a clear contract',
    objective: 'Extend a component through its contract — props, events, computed values and template refs — the JavaScript way, while comparing with the TypeScript version.',
    files: { 'App.vue': appVue, 'RatingInput.vue': ratingJs },
    expected: 'Five stars with three highlighted, and "You chose 3 star(s)". Clicking a star updates the text through `v-model`.',
    experiments: [
      {
        id: 'ten-stars',
        task: 'Use the `max` prop: make the rating show **10** stars from `App.vue`.',
        hint: '`<RatingInput v-model="rating" :max="10" label="Your rating" />` — note the `:`, so 10 is a number, not the string "10".',
        tests: [{ name: 'ten stars are rendered', code: `expect(findAll('.star').length).toBe(10)` }],
        explain: 'Without the colon, `max="10"` passes a **string** — Vue would warn because the prop is declared as `Number`, and TypeScript would flag it in the template. The colon makes it a JavaScript expression: the number 10.',
      },
      {
        id: 'change-event',
        task: 'Add a second event to `RatingInput.vue`: `change`, emitted together with `update:modelValue`, carrying `{ value, previous }`. Declare it in the emits object with a validator that checks both are numbers.',
        hint: 'Add `change: (payload) => typeof payload.value === \'number\' && typeof payload.previous === \'number\'` to `defineEmits({ … })`, then in `choose(n)`: `emit(\'change\', { value: n, previous: props.modelValue })`.',
        tests: [
          {
            name: 'change is declared and emitted with value and previous',
            code: `const r = mountFile('RatingInput.vue', { modelValue: 2, label: 'Test' })
const stars = r.el.querySelectorAll('.star')
await click(stars[3])
const events = r.emitted('change')
expect(events.length).toBe(1)
expect(events[0][0].value).toBe(4)
expect(events[0][0].previous).toBe(2)`,
          },
        ],
        explain: 'In TypeScript this is one more line in the emits type: `change: [payload: { value: number; previous: number }]`. Every listener (`@change="(p) => …"`) then knows the payload\'s shape, with autocomplete.',
      },
      {
        id: 'summary-computed',
        task: 'Add a computed `summary` in `RatingInput.vue` that reads like "3 of 5 stars", and show it in a `<span class="summary">` after the buttons.',
        hint: '`const summary = computed(() => props.modelValue + \' of \' + props.max + \' stars\')` and `<span class="summary">{{ summary }}</span>` inside the `.rating` div.',
        tests: [
          {
            name: 'the summary reflects the current value',
            code: `expect(text('.summary')).toBe('3 of 5 stars')
await click(findAll('.star')[4])
expect(text('.summary')).toBe('5 of 5 stars')`,
          },
        ],
        explain: 'TypeScript infers `ComputedRef<string>` from the function\'s return value. You\'d only write `computed<string>(…)` if you wanted the compiler to enforce the return type.',
      },
      {
        id: 'focus-note',
        task: 'Add a button `class="focus-note"` in `App.vue` that moves keyboard focus to the textarea, using a template ref: `useTemplateRef(\'note\')` (3.5+) and `ref="note"` on the textarea.',
        hint: 'Script: `import { ref, useTemplateRef } from \'vue\'` and `const note = useTemplateRef(\'note\')`. Template: `<textarea ref="note" …>` and `<button class="focus-note" @click="note?.focus()">Add a note</button>`.',
        tests: [
          {
            name: 'clicking the button focuses the textarea',
            code: `await click('.focus-note')
expect(document.activeElement === find('.note')).toBe(true)`,
          },
        ],
        explain: 'In TypeScript you\'d write `useTemplateRef<HTMLTextAreaElement>(\'note\')`, and `note.value` is `HTMLTextAreaElement | null` — null before mount, hence the `?.`. That nullability is the most common template-ref type error.',
      },
    ],
  },

  internals: {
    beginner: `
Types and runtime declarations describe the same contract in two languages. Types are read by your editor and checker and then thrown away. Runtime declarations travel into the browser, where Vue uses them to warn (in development) and to apply defaults. When you write type-based props, Vue's compiler writes the runtime version for you.
`,
    technical: [
      `
**Macros, not functions.** \`defineProps\`, \`defineEmits\`, \`defineModel\` and \`withDefaults\` are compiler macros: they don't exist at runtime. The SFC compiler reads their arguments — including the **type** argument — and turns them into component options (\`props\`, \`emits\`) in the generated JavaScript.

**Type → runtime inference.** For \`defineProps<Props>()\`, the compiler resolves \`Props\` (local or, since 3.3, imported) and maps each member: \`string\` → \`String\`, \`number\` → \`Number\`, \`boolean\` → \`Boolean\`, functions → \`Function\`, arrays → \`Array\`, string-literal unions → \`String\`, object types → \`Object\`; \`?\` → \`required: false\`. Members it can't resolve get \`type: null\` (any). Boolean props keep their special casting (\`<Comp disabled />\` means \`true\`). Your coding interview question below builds a simplified version of this mapping.
`,
      {
        code: `// You write (TS):
const props = defineProps<{ title: string; count?: number; size?: 'sm' | 'md' }>()

// The compiler emits roughly (JS):
props: {
  title: { type: String, required: true },
  count: { type: Number, required: false },
  size:  { type: String, required: false },
}`,
        lang: 'ts',
        title: 'what the compiler generates (simplified)',
        static: true,
      },
      `
**Why \`reactive<T>()\` is discouraged.** \`reactive()\` returns a type that unwraps nested refs, which can differ from \`T\`. Vue's docs recommend annotating the variable instead: \`const book: Book = reactive({ … })\`. For \`ref\`, the generic form \`ref<T>()\` is fine and common.

**Template refs are nullable** because the element doesn't exist before mount, after unmount, or while a \`v-if\` is false. Typed as \`T | null\`, TypeScript forces you to handle that — usually with \`?.\` or by accessing it in \`onMounted\`.

**Component instance types.** \`InstanceType<typeof Comp>\` gives the public instance type of a component; with \`<script setup>\` only what \`defineExpose\` exposes is accessible, so the type and the runtime agree on a small API.
`,
    ],
    production: `
- **Prefer type-based declarations** in TS projects: one source of truth, checked at call sites, with runtime options generated for dev warnings.
- **Keep prop types simple and exported** (\`export interface ButtonProps\`) so consumers and docs can reuse them; very clever types may not convert to runtime props.
- **Use factory defaults** for arrays/objects with \`withDefaults\` (\`tags: () => []\`) so instances don't share one mutable default.
- **Name payloads in emits tuples** (\`[id: number]\`) — they show up in editor hints for listeners.
- **Avoid \`as\` casts on template refs** (\`input.value!\`); handle \`null\` explicitly — it\'s often a real lifecycle bug.
- **Library components**: \`vue-tsc\` can generate \`.d.ts\` files so consumers get typed props, emits and slots (\`defineSlots\`, 3.3+).
- **JavaScript components** keep full runtime declarations (with validators where useful) — they are the contract, and the only check you get.
`,
  },

  mistakes: [
    {
      title: 'Mixing type-based and runtime declarations in one call',
      wrong: { code: `const props = defineProps<{ title: string }>({ title: String }) // compile error`, lang: 'ts' },
      right: { code: `const props = defineProps<{ title: string }>()\n// or: defineProps({ title: { type: String, required: true } })`, lang: 'ts' },
      explanation: 'Each `defineProps` call uses either a type argument or a runtime object, not both. With a type, the compiler generates the runtime object for you.',
    },
    {
      title: 'Sharing a mutable default',
      wrong: { code: `withDefaults(defineProps<{ tags?: string[] }>(), { tags: [] })`, lang: 'ts' },
      right: { code: `withDefaults(defineProps<{ tags?: string[] }>(), { tags: () => [] })`, lang: 'ts' },
      explanation: 'An array literal would be one object shared by every instance that uses the default. A factory creates a fresh array per instance.',
    },
    {
      title: 'Forgetting that template refs start as null',
      wrong: { code: `const input = useTemplateRef<HTMLInputElement>('input')\ninput.value.focus() // ❌ possibly null — and really null during setup`, lang: 'ts' },
      right: { code: `onMounted(() => input.value?.focus())`, lang: 'ts' },
      explanation: 'The element exists only after mount (and while any `v-if` around it is true). The type says so; respect it instead of silencing it with `!`.',
    },
    {
      title: 'Reading event.target.value without narrowing',
      wrong: { code: `function onInput(e: Event) {\n  query.value = e.target.value // ❌ Property 'value' does not exist on type 'EventTarget'\n}`, lang: 'ts' },
      right: { code: `function onInput(e: Event) {\n  query.value = (e.target as HTMLInputElement).value\n}\n// or simply use v-model`, lang: 'ts' },
      explanation: '`event.target` is typed as the generic `EventTarget` because any element could dispatch the event. Narrow it to the element you attached the listener to — or let `v-model` handle it.',
    },
    {
      title: 'Passing a string where a number prop is expected',
      wrong: { code: `<RatingInput max="10" />   <!-- "10" is a string -->`, lang: 'vue' },
      right: { code: `<RatingInput :max="10" />  <!-- the number 10 -->`, lang: 'vue' },
      explanation: 'Plain attributes are strings. `v-bind` (`:`) evaluates an expression. Vue warns at runtime (declared `Number`); `vue-tsc` flags it in the template.',
    },
  ],

  debugging: [
    {
      symptom: '"Object is possibly \'null\'" on `inputRef.value.focus()`.',
      cause: 'Template refs are `T | null` — the element doesn\'t exist before mount or while hidden by `v-if`.',
      fix: 'Access the ref in `onMounted` or an event handler, and use optional chaining (`?.`). Avoid `!` unless you can guarantee it exists.',
    },
    {
      symptom: '"Property \'value\' does not exist on type \'EventTarget\'" in an input handler.',
      cause: '`event.target` is typed generically.',
      fix: 'Cast to the specific element (`event.target as HTMLInputElement`) or use `v-model`.',
    },
    {
      symptom: 'A compiler error mentioning it cannot resolve a type in `defineProps<…>()`.',
      cause: 'The prop type is too dynamic for the SFC compiler to turn into runtime options (or comes from a source it can\'t resolve).',
      fix: 'Simplify the prop type (plain interfaces, unions, arrays), or use a runtime declaration with `PropType<T>` for that prop.',
    },
    {
      symptom: 'Listeners in the parent receive `any` instead of the payload type.',
      cause: 'The child uses untyped emits (`defineEmits([\'change\'])`).',
      fix: 'Type the emits: `defineEmits<{ change: [payload: Payload] }>()`.',
    },
    {
      symptom: 'Vue warns "Invalid prop: type check failed for prop \'max\'. Expected Number, got String".',
      cause: 'A plain attribute (`max="10"`) passed a string.',
      fix: 'Bind it: `:max="10"`.',
    },
  ],

  bestPractices: [
    'In TypeScript components, declare props and emits with types; let the compiler generate runtime options.',
    'Use `withDefaults` (or 3.5+ destructure defaults) and factory functions for mutable defaults.',
    'Name emit payloads with tuples: `{ change: [id: number] }` (3.3+).',
    'Let inference type refs and computed values; annotate refs that start as `null` and function parameters.',
    'Annotate `reactive()` variables with an interface rather than using `reactive<T>()`.',
    'Treat template refs as nullable; use `useTemplateRef<T>()` (3.5+) and `?.`.',
    'Expose a minimal API from components with `defineExpose`, and type parent refs with `InstanceType<typeof Comp>`.',
    'In JavaScript components, keep full runtime declarations with validators — they are your only check.',
  ],

  useCases: [
    'Design-system components (Button, Input, Modal) with precise, documented props and events.',
    'Form inputs using `defineModel<T>()` for typed two-way binding.',
    'Components that manage focus or measure elements through typed template refs.',
    'Shared domain components (ProductCard, OrderRow) whose props reuse domain interfaces.',
    'Gradually typed codebases where JS components keep runtime declarations and TS components use types.',
  ],

  whenToUse: {
    use: [
      'Type-based `defineProps`/`defineEmits` in every `lang="ts"` component.',
      'Explicit generics for refs whose initial value doesn\'t show the full type (`ref<User | null>(null)`).',
      'Runtime declarations with `PropType<T>` when a prop type is too complex for the compiler.',
    ],
    avoid: [
      'Array-syntax props/emits in components others depend on — they declare names only.',
      'Non-null assertions (`!`) to silence template-ref nullability.',
      'Over-annotating what inference already knows (`const n: Ref<number> = ref<number>(0)`).',
    ],
  },

  comparison: {
    title: 'Runtime vs type-based declarations',
    headers: ['', 'Runtime (JS or TS)', 'Type-based (TS)'],
    rows: [
      ['Props', '`defineProps({ max: { type: Number, default: 5 } })`', '`withDefaults(defineProps<{ max?: number }>(), { max: 5 })`'],
      ['Emits', '`defineEmits({ change: (id) => Number.isInteger(id) })`', '`defineEmits<{ change: [id: number] }>()`'],
      ['When checked', 'at runtime, development builds', 'in the editor / `vue-tsc`, plus generated runtime checks in dev'],
      ['Checks call sites?', 'only when that code runs', 'every usage, before running'],
      ['Custom validators', 'yes (`validator`)', 'no — types only (add runtime checks where needed)'],
      ['Best for', 'JavaScript components, complex runtime rules', 'TypeScript components'],
    ],
    note: 'Next: typing the logic outside components — [composables, generics, API responses and stores](lesson:typing-composables-stores).',
  },

  quiz: [
    {
      id: 'typing-components-q1',
      type: 'mcq',
      prompt: 'Which declaration gives an optional `size` prop that defaults to `\'md\'` in a TypeScript component?',
      options: [
        { text: '`withDefaults(defineProps<{ size?: \'sm\' | \'md\' | \'lg\' }>(), { size: \'md\' })`' },
        { text: '`defineProps<{ size: \'sm\' | \'md\' | \'lg\' = \'md\' }>()`', why: 'Types can\'t contain default values; that\'s not valid TypeScript.' },
        { text: '`defineProps<{ size?: string }>({ size: \'md\' })`', why: 'You can\'t pass a runtime object together with a type argument.' },
        { text: '`defineProps({ size: \'md\' })`', why: 'In runtime syntax, the value describes the type (e.g. `String`), not a default.' },
      ],
      answer: 0,
      explanation: '`withDefaults` adds defaults to type-based props. In 3.5+ you can also destructure with a default: `const { size = \'md\' } = defineProps<…>()`.',
    },
    {
      id: 'typing-components-q2',
      type: 'output',
      prompt: 'What type does TypeScript infer for `total`?',
      code: { lang: 'ts', code: `const items = ref([{ price: 10 }, { price: 5 }])\nconst total = computed(() => items.value.reduce((s, i) => s + i.price, 0))` },
      options: [
        { text: '`ComputedRef<number>`' },
        { text: '`number`', why: '`computed()` returns a ref object; the number lives in `.value`.' },
        { text: '`ComputedRef<any>`', why: 'Everything here is inferable: `items` is `Ref<{ price: number }[]>`, so the sum is a number.' },
        { text: '`Ref<string>`', why: 'Prices are numbers, so `+` is numeric addition.' },
      ],
      answer: 0,
      explanation: 'Inference flows from `ref([...])` (array of `{ price: number }`) through `reduce` (initial value `0`) into `computed`. No annotations needed.',
    },
    {
      id: 'typing-components-q3',
      type: 'bug',
      prompt: 'This compiles in JavaScript but `vue-tsc` reports an error. Click the line.',
      code: {
        lang: 'vue',
        code: `<script setup lang="ts">
import { useTemplateRef, onMounted } from 'vue'

const input = useTemplateRef<HTMLInputElement>('input')

input.value.focus()

onMounted(() => {
  input.value?.select()
})
</script>

<template>
  <input ref="input" />
</template>`,
      },
      answerLine: 6,
      explanation: '`input.value` is `HTMLInputElement | null`, and during setup it really is `null` — the element isn\'t mounted yet. TypeScript flags it ("possibly null"); at runtime it would throw. Line 9 is correct: inside `onMounted`, with `?.`.',
    },
    {
      id: 'typing-components-q4',
      type: 'fill',
      prompt: 'Complete the typed emits so `rename` carries an id and a title.',
      code: {
        lang: 'ts',
        code: `const emit = ___<{
  toggle: [id: number]
  rename: [id: number, title: ___]
}>()`,
      },
      answer: [['defineEmits'], ['string']],
      explanation: 'The 3.3+ named-tuple syntax maps each event name to its argument list. `emit(\'rename\', 1, \'Tent\')` type-checks; `emit(\'rename\', 1)` doesn\'t.',
    },
    {
      id: 'typing-components-q5',
      type: 'mcq',
      prompt: 'What does Vue\'s compiler do with `defineProps<{ count?: number }>()`?',
      options: [
        { text: 'Generates runtime options like `{ count: { type: Number, required: false } }` so development warnings still work' },
        { text: 'Nothing — types are erased, so the component has no props at runtime', why: 'The compiler reads the type at build time and emits runtime props; otherwise Vue wouldn\'t know which attributes are props.' },
        { text: 'Adds runtime checks that throw in production', why: 'Prop validation only warns, and only in development builds.' },
        { text: 'Converts the component to TypeScript at runtime', why: 'The browser only ever runs JavaScript.' },
      ],
      answer: 0,
      explanation: '`defineProps` is a compiler macro. With a type argument, the compiler infers the equivalent runtime declaration.',
    },
    {
      id: 'typing-components-q6',
      type: 'mcq',
      prompt: 'In TypeScript, how should you type a reactive object?',
      options: [
        { text: '`const book: Book = reactive({ title: \'Vue\' })`' },
        { text: '`const book = reactive<Book>({ title: \'Vue\' })`', why: 'It works in simple cases, but Vue\'s docs discourage the generic because reactive()\'s return type (with ref unwrapping) can differ from T.' },
        { text: '`const book = ref<Book>(reactive({ title: \'Vue\' }))`', why: 'Wrapping a reactive object in a ref mixes two styles for no benefit.' },
        { text: 'Reactive objects can\'t be typed', why: 'They can — annotate the variable with an interface.' },
      ],
      answer: 0,
      explanation: 'Annotate the variable with the interface; TypeScript checks the initial object against it.',
    },
    {
      id: 'typing-components-q7',
      type: 'short',
      prompt: 'A JavaScript component declares `defineProps([\'max\'])`. Name two things you lose compared with `defineProps({ max: { type: Number, default: 5 } })` or `withDefaults(defineProps<{ max?: number }>(), { max: 5 })`.',
      answer: 'Array syntax only declares the name. You lose the type check (no warning for a string, no editor error in TS), the default value (max is undefined unless passed), the required/optional information, and documentation/autocomplete for callers.',
    },
  ],

  exercises: [
    {
      id: 'translate-todo-contract',
      title: 'Translate a TypeScript contract into runtime declarations',
      difficulty: 'intermediate',
      prompt: `
\`TodoItem.vue\` lists its intended TypeScript contract in a comment, but uses array syntax. Rewrite it with **runtime declarations** that enforce the same contract:

- \`todo\`: \`Object\`, required, with a \`validator\` that checks \`id\` is a number, \`title\` a string and \`done\` a boolean.
- \`editable\`: \`Boolean\`, **default \`true\`** (the TS version used \`withDefaults\`).
- emits as an **object** with validators: \`toggle(id)\` → \`id\` is an integer; \`rename(id, title)\` → integer id and a non-empty (after trimming) string.
- Pressing Enter in the title input emits \`rename\` with the **trimmed** title — and emits nothing for a blank title.
`,
      files: { 'App.vue': todoApp, 'TodoItem.vue': todoStarter },
      hints: [
        'Props: `defineProps({ todo: { type: Object, required: true, validator: (t) => … }, editable: { type: Boolean, default: true } })`.',
        'Emits: `defineEmits({ toggle: (id) => Number.isInteger(id), rename: (id, title) => … })` — validators receive the same arguments as `emit()`.',
        'In `onEnter`, `const title = event.target.value.trim()` and only call `emit(\'rename\', props.todo.id, title)` when `title` isn\'t empty.',
      ],
      solution: {
        explanation: 'Each runtime option mirrors part of the type: `required` ↔ no `?`, `default: true` ↔ `withDefaults`, emit validators ↔ the emits tuple types. The validators go further than types can (non-empty title) — and the handler itself refuses to emit invalid data, so the validator is a safety net, not the only guard.',
        files: { 'App.vue': todoApp, 'TodoItem.vue': todoSolution },
      },
      tests: [
        {
          name: 'todo is a required Object with a shape validator',
          code: `const { props } = requireModule('TodoItem.vue').default
expect(props.todo.type).toBe(Object)
expect(props.todo.required).toBe(true)
expect(props.todo.validator({ id: 1, title: 'Tent', done: false })).toBe(true)
expect(props.todo.validator({ id: '1', title: 'Tent', done: false })).toBe(false)`,
        },
        {
          name: 'editable is a Boolean that defaults to true',
          code: `const { props } = requireModule('TodoItem.vue').default
expect(props.editable.type).toBe(Boolean)
expect(props.editable.default).toBe(true)
expect(findAll('input.title').length).toBe(2)`,
        },
        {
          name: 'emits are declared with validators',
          code: `const { emits } = requireModule('TodoItem.vue').default
expect(emits.toggle(1)).toBe(true)
expect(emits.toggle('1')).toBe(false)
expect(emits.rename(1, 'Tent')).toBe(true)
expect(emits.rename(1, '   ')).toBe(false)`,
        },
        {
          name: 'Enter emits rename with a trimmed title, and nothing when blank',
          code: `const r = mountFile('TodoItem.vue', { todo: { id: 7, title: 'Old', done: false } })
const input = r.find('input.title')
input.value = '  New title  '
await trigger(input, 'keyup', { key: 'Enter' })
expect(r.emitted('rename')).toEqual([[7, 'New title']])
input.value = '   '
await trigger(input, 'keyup', { key: 'Enter' })
expect(r.emitted('rename').length).toBe(1)`,
        },
        {
          name: 'the checkbox emits toggle with the id',
          code: `const r = mountFile('TodoItem.vue', { todo: { id: 3, title: 'Lamp', done: false } })
await check(r.find('input.done'), true)
expect(r.emitted('toggle')).toEqual([[3]])`,
        },
      ],
    },
    {
      id: 'expose-search-box',
      title: 'Typed component refs with defineExpose',
      difficulty: 'intermediate',
      prompt: `
Let a parent control a child component through a **component template ref**:

- In \`SearchBox.vue\`, expose two methods with \`defineExpose\`: \`focus()\` focuses the input, \`clear()\` empties it.
- In \`App.vue\`, get the SearchBox instance with \`useTemplateRef(\'searchBox\')\` (3.5+) and \`ref="searchBox"\` on the component. The button \`.focus-search\` calls \`focus()\`; the button \`.clear-search\` calls \`clear()\`.

(In TypeScript the parent would write \`useTemplateRef<InstanceType<typeof SearchBox>>(\'searchBox\')\` and get autocomplete for exactly \`focus\` and \`clear\`.)
`,
      files: { 'App.vue': searchAppStarter, 'SearchBox.vue': searchBoxStarter },
      hints: [
        '`<script setup>` components expose nothing by default — call `defineExpose({ focus, clear })` in SearchBox.',
        'Inside SearchBox, `input.value` is the `<input>` element (or `null`): `input.value?.focus()`, `input.value.value = \'\'`.',
        'In App: `const searchBox = useTemplateRef(\'searchBox\')`, `<SearchBox ref="searchBox" />`, and `@click="searchBox?.focus()"` on the button.',
      ],
      solution: {
        explanation: 'The child decides its public API with `defineExpose`; the parent reaches it through a template ref that is `null` until mounted (hence `?.`). TypeScript\'s `InstanceType<typeof SearchBox>` reflects exactly what was exposed — the type and the runtime agree on a small surface instead of the whole component internals.',
        files: { 'App.vue': searchAppSolution, 'SearchBox.vue': searchBoxSolution },
      },
      tests: [
        {
          name: 'the focus button focuses the search input',
          code: `await click('.focus-search')
expect(document.activeElement === find('.search')).toBe(true)`,
        },
        {
          name: 'the clear button empties the search input',
          code: `await type('.search', 'tent')
expect(find('.search').value).toBe('tent')
await click('.clear-search')
expect(find('.search').value).toBe('')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'typing-components-props-styles',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What are the two ways to declare props in `<script setup>`, and how do they relate in a TypeScript project?',
      answer: 'Runtime declaration — `defineProps({ title: { type: String, required: true } })` — which Vue validates at runtime in development; and type-based declaration — `defineProps<{ title: string }>()` — checked by TypeScript in the editor and `vue-tsc`. They can\'t be combined in one call. With the type-based form, the SFC compiler infers equivalent runtime options from the type, so dev warnings still work. Defaults come from `withDefaults` (or 3.5+ destructure defaults).',
      explanation: 'One contract, two notations; in TS projects prefer types and let the compiler generate the runtime side.',
      whyAsked: 'The most common TS + Vue question.',
      mistakes: ['Thinking type-based props disappear at runtime.', 'Trying to pass both a type and an object.', 'Forgetting withDefaults.'],
      followUps: ['What prop types can the compiler not convert?', 'When would you use PropType?'],
      modelAnswer: 'There\'s the runtime form, an object with type, required, default and validators, which Vue checks while running in development; and the type-based form, defineProps with a type argument, which TypeScript checks at every usage before running. You pick one per call. With the type-based form, Vue\'s compiler generates the runtime options from the type, so you keep dev warnings, and defaults come from withDefaults or, since 3.5, destructuring with defaults. In TS projects I use types; PropType helps when a runtime declaration needs a precise object type.',
    },
    {
      id: 'typing-components-defaults-compare',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `withDefaults()` with Vue 3.5 reactive props destructure for default values. Any pitfalls?',
      answer: '`withDefaults(defineProps<Props>(), { tags: () => [] })` works in all versions with type-based props; mutable defaults should be factory functions. In 3.5+, `const { tags = [], size = \'md\' } = defineProps<Props>()` declares defaults inline; the compiler keeps destructured props reactive by rewriting accesses to `props.x`. Pitfalls with destructure: passing a destructured prop into a function (e.g. `watch(size, …)`) passes a plain value — wrap it in a getter (`watch(() => size, …)`); it requires 3.5+.',
      explanation: 'Both produce the same runtime defaults; destructure is more concise but has the getter caveat.',
      whyAsked: 'Tests up-to-date knowledge and awareness of reactivity edge cases.',
      mistakes: ['Thinking destructured props lose reactivity in 3.5 (inside the component they don\'t).', 'Using array literals as withDefaults defaults.'],
      followUps: ['Why does watch(size) not work with a destructured prop?'],
      modelAnswer: 'withDefaults wraps the type-based defineProps call and supplies defaults, with factory functions for arrays and objects so instances don\'t share them; it works everywhere type-based props do. Since 3.5 I can destructure props with defaults instead, and the compiler keeps them reactive by compiling accesses back to props.x. The catch is passing a destructured prop to something like watch or a composable — that passes a plain value, so I wrap it in a getter.',
    },
    {
      id: 'typing-components-emit-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'Given `const emit = defineEmits<{ change: [id: number] }>()`, which call does `vue-tsc` accept?',
      options: [
        "emit('change', '42')",
        "emit('change', 42)",
        "emit('changed', 42)",
        "emit('change')",
      ],
      correctOption: 1,
      answer: '`emit(\'change\', 42)`. A string payload, an unknown event name, or a missing argument are all type errors.',
      explanation: 'The tuple `[id: number]` is the exact argument list after the event name.',
      whyAsked: 'Quick check of typed emits syntax.',
      mistakes: ['Thinking emits are untyped strings.'],
      followUps: ['How do you type an event with no payload?', 'What is the call-signature syntax?'],
      modelAnswer: 'Only emit with change and the number 42. The tuple says the event takes exactly one number, so a string, a typo in the event name or a missing argument are all rejected. An event without payload would be declared with an empty tuple.',
    },
    {
      id: 'typing-components-template-ref-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: '`const modal = ref<HTMLDialogElement>()` and then `modal.value.showModal()` gives "Object is possibly \'undefined\'". A teammate "fixes" it with `modal.value!.showModal()`. Good fix?',
      answer: 'Not by default. The error is real: the ref is `undefined` until the element mounts, and becomes `null` again on unmount or when a `v-if` hides it. The `!` hides the possibility and turns it into a runtime crash if timing changes. Better: call it where the element must exist (event handler after mount, `onMounted`) with `modal.value?.showModal()`, or guard explicitly. In 3.5+, `useTemplateRef<HTMLDialogElement>(\'modal\')` types it as `HTMLDialogElement | null`.',
      explanation: 'Nullability in template refs reflects the component lifecycle.',
      whyAsked: 'Shows whether you treat type errors as information or noise.',
      mistakes: ['Reaching for `!` or `as` first.', 'Not knowing when template refs are populated.'],
      followUps: ['When exactly is a template ref filled?', 'How does v-if affect it?'],
      modelAnswer: 'I wouldn\'t accept the non-null assertion. The type is telling the truth: the element doesn\'t exist until mount and disappears again on unmount or under a v-if, so the bang just postpones the error to runtime. I\'d call it from a handler or onMounted with optional chaining or an explicit guard, and on 3.5 I\'d use useTemplateRef with the element type, which models it as possibly null.',
    },
    {
      id: 'typing-components-event-target-debug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'In `function onInput(e: Event) { search.value = e.target.value }` TypeScript says "Property \'value\' does not exist on type \'EventTarget\'". Why, and what are the fixes?',
      answer: '`Event.target` is typed as the generic `EventTarget` because events can come from any node (and bubble). TypeScript can\'t know it\'s an input. Fix: narrow it — `(e.target as HTMLInputElement).value`, or check `if (e.target instanceof HTMLInputElement)`. Often simplest: use `v-model` and avoid manual handlers.',
      explanation: 'The DOM types are deliberately general; you add the knowledge about your template.',
      whyAsked: 'A very common beginner TS error in Vue codebases.',
      mistakes: ['Typing the parameter as `any`.', 'Using `currentTarget` without understanding the difference.'],
      followUps: ['What\'s the difference between target and currentTarget?'],
      modelAnswer: 'Event.target is typed as a plain EventTarget because any element could have fired the event, so TypeScript can\'t assume it has a value property. I narrow it to what I know from the template — a cast to HTMLInputElement or an instanceof check — or, simpler, I use v-model and drop the handler.',
    },
    {
      id: 'typing-components-reactive-generic',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'Why does Vue\'s documentation recommend `const state: State = reactive({...})` over `reactive<State>({...})`, while `ref<T>()` is fine?',
      answer: '`reactive()` returns a type that deeply unwraps nested refs (`UnwrapNestedRefs<T>`). If `State` contains refs, the returned type differs from `State`, so passing `State` as the generic can produce confusing mismatches. Annotating the variable lets TypeScript check the initial value against the interface while keeping the correct unwrapped type. `ref<T>()` returns `Ref<UnwrapRef<T>>` and is commonly used with explicit generics, e.g. `ref<User | null>(null)`.',
      explanation: 'It\'s about ref unwrapping in reactive objects.',
      whyAsked: 'Probes deeper understanding of Vue\'s reactivity types.',
      mistakes: ['Saying reactive can\'t be typed.', 'Not knowing reactive unwraps nested refs.'],
      followUps: ['What does UnwrapRef do?', 'When would you choose reactive over ref?'],
      modelAnswer: 'reactive unwraps refs nested inside the object, so its return type isn\'t exactly the type you pass in. If the interface contains refs, using it as the generic leads to mismatches, which is why the docs suggest annotating the variable instead — TypeScript still checks the object against the interface. ref with a generic is fine and common, especially for values that start as null, like ref of User or null.',
    },
    {
      id: 'typing-components-coding-runtime-props',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Model what Vue\'s compiler does with type-based props. Implement `toRuntimeProps(shape)` in `toRuntimeProps.js`: keys ending in `?` are optional; `string`/`number`/`boolean`/`function`/`object` map to the matching constructor; `T[]` → `Array`; a union of string literals (`"\'sm\' | \'md\'"`) → `String`; anything else → `null`. Return `{ name: { type, required } }`.',
      starter: { files: { 'toRuntimeProps.js': runtimeStarter, 'App.vue': runtimeApp } },
      tests: [
        {
          name: 'primitives and optional keys',
          code: `const { toRuntimeProps } = requireModule('toRuntimeProps.js')
const p = toRuntimeProps({ 'title': 'string', 'count?': 'number' })
expect(p.title.type).toBe(String)
expect(p.title.required).toBe(true)
expect(p.count.type).toBe(Number)
expect(p.count.required).toBe(false)`,
        },
        {
          name: 'arrays and string-literal unions',
          code: `const { toRuntimeProps } = requireModule('toRuntimeProps.js')
const p = toRuntimeProps({ 'tags': 'string[]', 'size?': "'sm' | 'md' | 'lg'" })
expect(p.tags.type).toBe(Array)
expect(p.size.type).toBe(String)
expect(p.size.required).toBe(false)`,
        },
        {
          name: 'booleans, functions and objects',
          code: `const { toRuntimeProps } = requireModule('toRuntimeProps.js')
const p = toRuntimeProps({ 'open': 'boolean', 'onSave?': 'function', 'meta': 'object' })
expect(p.open.type).toBe(Boolean)
expect(p.onSave.type).toBe(Function)
expect(p.meta.type).toBe(Object)`,
        },
        {
          name: 'unknown types accept anything (null)',
          code: `const { toRuntimeProps } = requireModule('toRuntimeProps.js')
const p = toRuntimeProps({ 'payload': 'unknown' })
expect(p.payload.type).toBeNull()
expect(p.payload.required).toBe(true)`,
        },
      ],
      hints: [
        'Loop over `Object.entries(shape)`; detect `rawKey.endsWith(\'?\')` and strip the `?` for the prop name.',
        'Check arrays first (`endsWith(\'[]\')`), then literal unions (`startsWith("\'")`), then a lookup object for primitives.',
        'Use `?? null` for unknown types and set `required: !optional`.',
      ],
      answer: 'Iterate over the shape, derive optionality from the trailing `?`, map the type string (arrays → Array, literal unions → String, primitives via a lookup, else null), and build `{ type, required }` per prop.',
      solution: { files: { 'toRuntimeProps.js': runtimeSolution, 'App.vue': runtimeApp } },
      explanation: 'This mirrors (in a very simplified way) the SFC compiler\'s type-to-runtime inference: it\'s why type-based props still produce runtime props, boolean casting and dev warnings. The real compiler resolves actual TypeScript types — interfaces, imports, intersections — rather than strings.',
      whyAsked: 'Shows understanding that `defineProps` is a compiler macro and what runtime information types turn into.',
      mistakes: ['Forgetting to strip the `?` from the name.', 'Treating `string[]` as String.', 'Defaulting unknown types to Object instead of null.'],
      followUps: ['Why does the compiler need runtime props at all if types exist?', 'How is Boolean casting affected by type-based props?'],
      modelAnswer: 'I loop over the shape, treat a trailing question mark as optional and strip it for the name, then map the type: array syntax to Array, a union of string literals to String, primitives through a lookup table, and anything unknown to null, meaning any type. Each prop becomes type plus required. That\'s a toy version of what the SFC compiler does, and it explains why typed props still give runtime validation and boolean casting.',
    },
  ],

  takeaways: [
    'Props/emits are a component\'s contract: runtime declarations (checked while running, dev only) or types (checked before running).',
    '`defineProps<T>()` + `withDefaults` (or 3.5+ destructure defaults); the compiler generates matching runtime props.',
    '`defineEmits<{ event: [arg: Type] }>()` (3.3+) types every `emit()` call; `defineModel<T>()` (3.4+) types v-model.',
    'Let inference type `ref` and `computed`; annotate `ref<T | null>(null)`, parameters, and `reactive` variables (not `reactive<T>()`).',
    'Template refs are nullable — `useTemplateRef<T>()` (3.5+), access after mount, use `?.`.',
    'In JavaScript, full runtime declarations with validators are the contract — and the only check you get.',
  ],
}
