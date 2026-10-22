// Lesson: Component v-model & defineModel()

const vmApp = `<script setup>
import { ref } from 'vue'
import QuantityStepper from './QuantityStepper.vue'
import NameInput from './NameInput.vue'

const quantity = ref(1)
const printedName = ref('')
</script>

<template>
  <h3>Custom T-shirt</h3>
  <QuantityStepper v-model="quantity" />
  <NameInput v-model="printedName" />
  <p class="summary">
    {{ quantity }} × shirt printed with “{{ printedName || '…' }}”
  </p>
</template>`

const stepper = `<script setup>
// Vue 3.4+: declares a modelValue prop + an update:modelValue event
// and gives back a ref that reads the prop and emits when written.
const quantity = defineModel({ type: Number, required: true })
</script>

<template>
  <div class="stepper">
    <button class="dec" @click="quantity--">−</button>
    <span class="value">{{ quantity }}</span>
    <button class="inc" @click="quantity++">+</button>
  </div>
</template>

<style scoped>
.stepper { display: inline-flex; align-items: center; gap: 8px; margin: 8px 0; }
.value { min-width: 2em; text-align: center; font-weight: bold; }
</style>`

const nameInput = `<script setup>
// The pre-3.4 way, written by hand: a prop in, an event out.
defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <label class="field">
    Name to print
    <input
      class="name"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
    />
  </label>
</template>

<style scoped>
.field { display: block; margin: 8px 0; }
.name { margin-left: 8px; }
</style>`

const nameInputDefineModel = `<script setup>
const name = defineModel()
</script>

<template>
  <label class="field">
    Name to print
    <input class="name" v-model="name" />
  </label>
</template>`

const rangeApp = `<script setup>
import { ref, computed } from 'vue'
import PriceRange from './PriceRange.vue'

const products = [
  { name: 'Sticker', price: 3 },
  { name: 'Mug', price: 12 },
  { name: 'T-shirt', price: 20 },
  { name: 'Hoodie', price: 45 },
]
const min = ref(0)
const max = ref(100)

const visible = computed(() =>
  products.filter((p) => p.price >= min.value && p.price <= max.value)
)
</script>

<template>
  <PriceRange v-model:min="min" v-model:max="max" />
  <p class="count">{{ visible.length }} products</p>
  <ul>
    <li v-for="p in visible" :key="p.name" class="product">{{ p.name }} — \${{ p.price }}</li>
  </ul>
</template>`

export default {
  id: 'component-v-model',
  title: 'Component v-model & defineModel()',
  summary: 'Give your own components two-way binding with v-model — the defineModel() macro (3.4+), the props + emit pattern behind it, named models and modifiers.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['emits', 'v-model-forms'],
  related: ['props', 'emits', 'fallthrough-attrs', 'accessible-reusable-inputs', 'computed'],
  tags: ['v-model', 'defineModel', 'modelValue', 'update:modelValue', 'two-way binding', 'named v-model', 'modifiers', 'form components', '.sync'],
  apis: [
    { name: 'defineModel()', summary: '3.4+ macro: declares a model prop and its update event, and returns a ref that reads the prop and emits on write.' },
    { name: 'modelValue / update:modelValue', summary: 'The default prop and event names that `v-model` on a component expands to.' },
    { name: 'v-model:name', summary: 'Named model: binds the `name` prop and `update:name` event, so one component can have several models.' },
  ],
  docs: [
    { label: 'Vue Guide — Component v-model', url: 'https://vuejs.org/guide/components/v-model.html' },
    { label: 'API — defineModel()', url: 'https://vuejs.org/api/sfc-script-setup.html#definemodel' },
  ],

  intro: `
You already know \`v-model\` on native inputs: \`<input v-model="name">\` keeps the input and the \`name\` ref in sync both ways ([form bindings](lesson:v-model-forms)).

The same directive works on **your own components**: \`<QuantityStepper v-model="quantity" />\`. The parent's \`quantity\` and the stepper stay in sync — the parent can set it, and clicking **+** inside the stepper updates the parent.

This is not magic two-way data flow. It's a **shorthand for one prop down and one event up**. Since Vue 3.4, the \`defineModel()\` macro writes both halves for you.
`,

  why: `
Without component \`v-model\`, every input-like component needs the same boilerplate in the parent:

\`\`\`vue
<QuantityStepper
  :model-value="quantity"
  @update:model-value="(value) => (quantity = value)"
/>
\`\`\`

…and the child needs a prop, an emit declaration and an event call. Multiply that by every text field, toggle, date picker and select in a big form.

\`v-model\` gives reusable form components the same one-word ergonomics as native inputs, while **keeping one-way data flow intact**: the parent still owns the value, the child still only *requests* changes by emitting. You get convenience without losing the "one owner" rule from the [props](lesson:props) lesson.
`,

  eli15: `
Think of a thermostat on the wall and the boiler in the basement.

The boiler (the parent) actually holds the temperature setting. The thermostat (the child) **shows** the current setting, and when you press **▲**, it doesn't heat anything itself — it **sends a message** to the boiler: "please make it 22°". The boiler updates its setting, and the thermostat's display shows 22.

From the outside it looks like the thermostat and the boiler are magically linked both ways. That's \`v-model\`: a value goes **down** (what the display shows) and a message comes **up** (please change it). \`defineModel()\` is the pre-wired thermostat kit — it does both jobs for you.
`,

  analogy: {
    title: 'The thermostat and the boiler',
    body: `
The thermostat on the wall displays a temperature and has ▲/▼ buttons. Pressing ▲ sends a request to the boiler, which stores the real setting and reports it back to the display.

You never set the display directly — it always shows what the boiler reports. And a thermostat can control several things: heating *and* hot water, each with its own display.
`,
    mapping: [
      ['the boiler\'s stored setting', 'the parent\'s ref (`quantity`)'],
      ['the thermostat display', 'the `modelValue` prop the child receives'],
      ['pressing ▲ sends "please set 22°"', 'the child emits `update:modelValue` with 22'],
      ['the boiler updates and the display follows', 'the parent\'s ref changes and the new prop flows down'],
      ['the pre-wired thermostat kit', '`defineModel()` — reads the prop, emits on write'],
      ['separate heating and hot-water controls', 'named models: `v-model:heating`, `v-model:water`'],
    ],
  },

  visual: {
    type: 'component-flow',
    props: { mode: 'v-model' },
    title: 'v-model = prop down + event up',
    caption: 'Watch the value travel **down** as `modelValue`, then the child emit `update:modelValue` **up** and the parent update its ref — which flows down again. Click a component to see its code.',
    alt: 'An animated parent and child. The parent ref value travels down as a modelValue prop. When the child is interacted with, an update:modelValue event carrying the new value travels up; the parent ref changes and the new prop travels back down.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'What v-model compiles to',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'tpl', label: 'v-model="quantity"', note: 'what you write', tone: 'acid', x: 140, y: 60 },
        { id: 'prop', label: ':modelValue="quantity"', note: 'prop down', tone: 'cobalt', x: 400, y: 60 },
        { id: 'event', label: '@update:modelValue', note: 'v => quantity = v', tone: 'cobalt', x: 400, y: 260 },
        { id: 'model', label: 'defineModel()', note: 'ref in the child', x: 650, y: 160 },
        { id: 'state', label: 'quantity (parent ref)', note: 'single source of truth', x: 140, y: 260 },
      ],
      edges: [
        { from: 'tpl', to: 'prop', label: 'expands to' },
        { from: 'prop', to: 'model', label: 'read model.value' },
        { from: 'model', to: 'event', label: 'model.value = 3 → emit' },
        { from: 'event', to: 'state', label: 'assign' },
        { from: 'state', to: 'prop', label: 're-render', dashed: true },
      ],
      steps: [
        { focus: ['tpl'], text: 'You write `<QuantityStepper v-model="quantity" />`. The compiler expands it into two things.' },
        { focus: ['prop'], edges: ['tpl->prop'], text: 'A **prop** called `modelValue` carrying the current value of `quantity`.' },
        { focus: ['model'], edges: ['prop->model'], text: 'In the child, `defineModel()` returns a ref. **Reading** `quantity.value` reads the `modelValue` prop.' },
        { focus: ['event'], edges: ['model->event'], text: '**Writing** `quantity.value = 3` does *not* change the prop — it emits `update:modelValue` with `3`.' },
        { focus: ['state'], edges: ['event->state'], text: 'The listener the compiler generated assigns `3` to the parent\'s ref. The parent is still the owner.' },
        { focus: ['state', 'prop', 'model'], edges: ['state->prop', 'prop->model'], text: 'The parent re-renders, passes `modelValue: 3` down, and the child\'s ref now reads 3. One-way data flow, two-way feel.' },
      ],
    },
    caption: 'Step through the expansion of `v-model` and the round trip a value makes.',
    alt: 'A stepped diagram. "v-model=quantity" expands to ":modelValue=quantity" (a prop going to defineModel in the child) and "@update:modelValue" (an event). Writing to the model ref emits the event, which assigns to the parent ref, which re-renders and sends the new prop down.',
  },

  syntax: [
    `
**What \`v-model\` on a component means.** These two lines are equivalent:
`,
    {
      code: `<QuantityStepper v-model="quantity" />

<QuantityStepper
  :modelValue="quantity"
  @update:modelValue="(value) => (quantity = value)"
/>`,
      lang: 'vue',
      title: 'the expansion',
    },
    `
**The child, with \`defineModel()\` (Vue 3.4+).** It declares the \`modelValue\` prop and the \`update:modelValue\` event, and returns a ref. Read it like a prop; write it and it emits:
`,
    {
      code: `<script setup>
const quantity = defineModel()                       // simplest
// const quantity = defineModel({ type: Number, required: true })   // with prop options
</script>

<template>
  <button @click="quantity--">−</button>
  <span>{{ quantity }}</span>
  <button @click="quantity++">+</button>

  <!-- you can also hand it straight to a native input -->
  <input type="number" v-model.number="quantity" />
</template>`,
      lang: 'vue',
      title: 'QuantityStepper.vue (3.4+)',
    },
    `
**The child, the pre-3.4 way** (still valid, and what \`defineModel\` generates for you). Note you must **not** write \`v-model="modelValue"\` on the inner input — that would mutate a prop:
`,
    {
      code: `<script setup>
defineProps(['modelValue'])
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <input
    :value="modelValue"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>`,
      lang: 'vue',
      title: 'props + emit (works in every Vue 3 version)',
    },
    `
**Named models** — a component can have several. \`v-model:title\` binds the \`title\` prop and the \`update:title\` event:
`,
    {
      code: `<!-- parent -->
<BookForm v-model:title="bookTitle" v-model:author="bookAuthor" />

<!-- BookForm.vue -->
<script setup>
const title = defineModel('title')
const author = defineModel('author', { default: 'Anonymous' })
</script>

<template>
  <input v-model="title" />
  <input v-model="author" />
</template>`,
      lang: 'vue',
      title: 'multiple named models',
    },
    `
**Modifiers.** \`.trim\` and \`.number\` also work on components: Vue applies them to the value the child emits. **Custom** modifiers arrive as an object; with \`defineModel\` you destructure them and transform the value in a \`set\` option:
`,
    {
      code: `<!-- parent -->
<NameInput v-model.capitalize="printedName" />

<!-- NameInput.vue -->
<script setup>
const [name, modifiers] = defineModel({
  set(value) {
    return modifiers.capitalize
      ? value.charAt(0).toUpperCase() + value.slice(1)
      : value
  },
})
// modifiers → { capitalize: true }
</script>

<template>
  <input v-model="name" />
</template>`,
      lang: 'vue',
      title: 'custom modifier with defineModel',
    },
    `
Before 3.4, modifiers arrive as a prop: \`modelModifiers\` for the default model, \`titleModifiers\` for \`v-model:title\`, and you apply them yourself before emitting.

**Default values need care.** If the child declares \`defineModel({ default: 1 })\` but the parent's ref is \`undefined\`, the child shows 1 while the parent still holds \`undefined\` — they are out of sync until the child emits. Prefer giving the parent's ref a real starting value, or mark the model \`required\`.
`,
    {
      callout: 'version',
      title: 'Version notes',
      text: '`defineModel()` is stable since **Vue 3.4** (it was experimental and opt-in in 3.3). The props + emit pattern works in every Vue 3 version. Coming from Vue 2: `value`/`input` became `modelValue`/`update:modelValue`, and `v-model:title` replaces the old `.sync` modifier.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: vmApp,
    intro: 'The parent owns both values and binds them with plain `v-model` — it doesn\'t care how each child implements it.',
    steps: [
      { lines: [3, 4], text: 'Two children. `QuantityStepper` uses `defineModel()`; `NameInput` uses the hand-written props + emit pattern. From the parent\'s side they look identical.' },
      { lines: [6, 7], text: 'The parent owns the state. These refs are the single source of truth — the children never hold their own copy.' },
      { lines: [12], text: '`v-model="quantity"` expands to `:modelValue="quantity"` plus `@update:modelValue="v => quantity = v"`.' },
      { lines: [13], text: 'Same contract, different child implementation. That is the beauty of an interface: the parent depends on the contract, not the internals.' },
      { lines: [14, 16], text: 'Both refs are used elsewhere in the parent. Click + or type a name and this summary updates — proof the parent\'s state changed.' },
    ],
  },

  playground: {
    title: 'Custom T-shirt order',
    objective: 'Use component v-model both ways — with defineModel() and by hand — then add limits, a custom modifier and a named model.',
    files: { 'App.vue': vmApp, 'QuantityStepper.vue': stepper, 'NameInput.vue': nameInput },
    expected: 'A − / + stepper starting at **1**, a text field, and a summary line. Changing either control updates the summary in the parent. Notice the stepper happily goes below 1 — that is your first experiment.',
    experiments: [
      {
        id: 'limits',
        task: 'Keep the quantity between **1** and a new `max` prop (`Number`, default `10`). The stepper must never emit a value below 1 or above `max`.',
        hint: 'Add `const props = defineProps({ max: { type: Number, default: 10 } })` next to `defineModel` (both can live together). Then use functions: `if (quantity.value < props.max) quantity.value++`. Disabling the buttons with `:disabled` is a nice extra.',
        tests: [
          {
            name: 'never goes below 1',
            code: `const s = mountFile('QuantityStepper.vue', { modelValue: 1 })
const dec = s.find('.dec')
dec.disabled = false
await click(dec)
expect(s.find('.value').textContent.trim()).toBe('1')`,
          },
          {
            name: 'stops at max',
            code: `const s = mountFile('QuantityStepper.vue', { modelValue: 4, max: 5 })
const inc = s.find('.inc')
inc.disabled = false
await click(inc)
inc.disabled = false
await click(inc)
expect(s.find('.value').textContent.trim()).toBe('5')`,
          },
        ],
        explain: 'Because writing to the model emits an event, the guard decides *whether a request is sent at all*. The parent still owns the value — and could add its own rules on top.',
      },
      {
        id: 'rewrite-define-model',
        task: 'Rewrite `NameInput.vue` with `defineModel()`: replace the `defineProps`/`defineEmits` lines with `const name = defineModel()` and use `v-model="name"` on the `<input>`. Everything should behave exactly the same.',
        hint: 'You can switch to the **defineModel** variant above the editor to compare.',
        explain: '`defineModel()` generates the same `modelValue` prop and `update:modelValue` event you wrote by hand. And because it returns a *ref*, putting `v-model` on the inner input is allowed — something you must never do with a raw prop.',
      },
      {
        id: 'uppercase-modifier',
        task: 'T-shirt prints are always upper case. In `App.vue` write `v-model.uppercase="printedName"`, and make `NameInput` honour the custom `uppercase` modifier so typing **ada** stores **ADA** in the parent.',
        hint: 'With defineModel: `const [name, modifiers] = defineModel({ set: (v) => (modifiers.uppercase ? v.toUpperCase() : v) })`. With the manual pattern: declare a `modelModifiers` prop and transform before emitting.',
        tests: [
          {
            name: 'typing ada stores ADA in the parent',
            code: `await type('.name', 'ada')
expect(text('.summary')).toContain('ADA')`,
          },
        ],
        explain: 'Modifiers on a component are just data passed down (`{ uppercase: true }`). The child decides what they mean — here, transforming the value *before* it is emitted to the parent.',
      },
      {
        id: 'named-color',
        task: 'Add a colour choice as a **named model**. Give `NameInput` a second model, `color`, bound to `<select class="color">` with the options **black**, **white** and **red**. In `App.vue` add `const color = ref(\'black\')`, bind `v-model:color="color"` and show the colour in `.summary`.',
        hint: 'In the child: `const color = defineModel(\'color\')` and `<select class="color" v-model="color">…</select>`. Both models can live in one component.',
        tests: [
          {
            name: 'choosing red updates the parent',
            code: `await select('.color', 'red')
expect(text('.summary')).toContain('red')`,
          },
          {
            name: 'the child emits update:color',
            code: `const c = mountFile('NameInput.vue', { modelValue: '', color: 'black' })
const sel = c.find('.color')
sel.value = 'white'
sel.dispatchEvent(new Event('change', { bubbles: true }))
await flush()
expect(c.emitted('update:color')).toEqual([['white']])`,
          },
        ],
        explain: 'Each named model is an independent prop + event pair (`color` / `update:color`). This is the Vue 3 replacement for Vue 2\'s `.sync` modifier.',
      },
    ],
    variants: [
      {
        id: 'define-model',
        label: 'NameInput with defineModel()',
        files: { 'App.vue': vmApp, 'QuantityStepper.vue': stepper, 'NameInput.vue': nameInputDefineModel },
      },
    ],
  },

  internals: {
    beginner: `
\`v-model\` on a component is shorthand. The parent passes the value down as a prop called \`modelValue\` and listens for an event called \`update:modelValue\`. \`defineModel()\` gives the child a ref that *reads* the prop and, when you assign to it, *emits* the event. The parent assigns the new value to its own ref, and the new prop flows back down.
`,
    technical: [
      `
**Parent side.** The compiler turns \`v-model\` on a component into props (plus a modifiers object if you used modifiers):
`,
      {
        code: `// <QuantityStepper v-model.number="quantity" />  compiles to roughly:
h(QuantityStepper, {
  modelValue: quantity.value,
  'onUpdate:modelValue': ($event) => (quantity.value = $event),
  modelModifiers: { number: true },
})`,
        lang: 'js',
        title: 'parent compile output (simplified)',
      },
      `
**Child side.** \`defineModel()\` expands at compile time into a prop declaration, an emit declaration and a call to the runtime helper \`useModel()\`:
`,
      {
        code: `// const quantity = defineModel({ type: Number })  becomes roughly:
const props = defineProps({ modelValue: { type: Number }, modelModifiers: {} })
const emit = defineEmits(['update:modelValue'])
const quantity = useModel(props, 'modelValue')

// Simplified model of useModel() — not the real source
function useModel(props, name) {
  let local = props[name]
  return customRef((track, trigger) => ({
    get() {
      track()
      return parentIsBinding(name) ? props[name] : local
    },
    set(value) {
      if (!parentIsBinding(name)) {   // no v-model on the parent:
        local = value                 // behave like a local ref
        trigger()
      }
      emit('update:' + name, value)   // always notify the parent
    },
  }))
}`,
        lang: 'js',
        title: 'child compile output and useModel (simplified)',
      },
      `
Two details fall out of this:

- When the parent *does* bind \`v-model\`, writing to the ref does **not** change anything locally. The displayed value only changes when the parent re-renders and passes the new prop — so the parent can reject or transform the request.
- When the parent *doesn't* bind it, the model works like a plain local ref, so the component is usable standalone.

\`.trim\` and \`.number\` work because Vue's \`emit\` checks the \`modelModifiers\` (or \`titleModifiers\`) prop on \`update:\` events and trims/converts the emitted value before calling the listener.
`,
    ],
    production: `
- **Use \`defineModel()\` for new code** on Vue 3.4+. It removes boilerplate and the classic "forgot to declare the emit" bugs. Keep the manual pattern in mind for older codebases and for libraries supporting older Vue versions.
- **Object models are references.** \`model.value.street = 'Main St'\` mutates the parent's object without emitting anything — a hidden prop mutation. Emit a new object instead: \`model.value = { ...model.value, street: 'Main St' }\`.
- **Avoid default desync**: give the parent's state a real initial value or use \`required: true\` instead of relying on a model \`default\`.
- **Reusable inputs** usually combine \`defineModel()\` with [\`$attrs\`](lesson:fallthrough-attrs) on the inner \`<input>\` and a generated id (\`useId()\`, 3.5+) for the \`<label>\`. See [accessible, reusable inputs](lesson:accessible-reusable-inputs).
- **v-model is for values**, not actions. A "save" or "close" request is an event, not a model.
- Validation rules belong in the parent or a form layer, not only in the input: a child guard prevents bad requests, but the owner should still validate — and the server must validate again.
`,
  },

  mistakes: [
    {
      title: 'Putting v-model on a prop inside the child',
      wrong: { code: `<script setup>\ndefineProps(['modelValue'])\n</script>\n<template>\n  <input v-model="modelValue" />  <!-- compile error -->\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\nconst model = defineModel()\n</script>\n<template>\n  <input v-model="model" />\n</template>`, lang: 'vue' },
      explanation: 'A prop is read-only, so `v-model` on it would mutate the parent\'s data. The compiler refuses: `v-model cannot be used on a prop, because local prop bindings are not writable`. Use `defineModel()` (its ref emits on write) or `:value` + `@input` with an emit.',
    },
    {
      title: 'Mutating a property of an object model',
      wrong: { code: `const address = defineModel()\n\nfunction setCity(city) {\n  address.value.city = city // mutates parent's object, emits nothing\n}`, lang: 'js' },
      right: { code: `const address = defineModel()\n\nfunction setCity(city) {\n  address.value = { ...address.value, city } // emits update:modelValue\n}`, lang: 'js' },
      explanation: 'Only assigning to `.value` triggers the update event. A nested write silently changes the parent\'s object — exactly the hidden mutation one-way flow is meant to prevent.',
    },
    {
      title: 'Using Vue 2 names: value/input or .sync',
      wrong: { code: `<!-- child -->\ndefineProps(['value'])\nemit('input', newValue)\n\n<!-- parent -->\n<BookForm :title.sync="bookTitle" />`, lang: 'vue' },
      right: { code: `<!-- child -->\nconst model = defineModel()        // modelValue / update:modelValue\n\n<!-- parent -->\n<BookForm v-model:title="bookTitle" />`, lang: 'vue' },
      explanation: 'Vue 3 uses `modelValue` / `update:modelValue` for the default model and replaces `.sync` with named `v-model:prop`.',
    },
    {
      title: 'A model default the parent doesn\'t know about',
      wrong: { code: `// child\nconst count = defineModel({ default: 1 })\n\n// parent\nconst count = ref()          // undefined\n// <Counter v-model="count" /> → child shows 1, parent has undefined`, lang: 'js' },
      right: { code: `// parent owns the real starting value\nconst count = ref(1)\n\n// child\nconst count = defineModel({ type: Number, required: true })`, lang: 'js' },
      explanation: 'The default only lives in the child, so the two sides disagree until the child emits. Let the owner hold the initial value.',
    },
  ],

  debugging: [
    {
      symptom: 'Typing in the child does nothing to the parent\'s value.',
      cause: 'The child emits the wrong event (`input`, `update:value`), forgot to emit, or the parent used `:model-value` without a listener.',
      fix: 'Use `defineModel()`, or emit exactly `update:modelValue` (or `update:<name>` for named models), and bind with `v-model` in the parent.',
    },
    {
      symptom: 'Compile error: `v-model cannot be used on a prop, because local prop bindings are not writable`.',
      cause: '`v-model` was placed on a prop inside the child.',
      fix: 'Switch to `defineModel()` or split into `:value` + `@input` that emits.',
    },
    {
      symptom: 'The child shows a value, but the parent\'s ref is `undefined`.',
      cause: 'The model has a `default` and the parent passed `undefined`.',
      fix: 'Initialise the parent\'s ref, or make the model `required`.',
    },
    {
      symptom: 'A custom modifier has no effect.',
      cause: 'The child never reads the modifiers, or reads `modelModifiers` for a named model (it\'s `titleModifiers` for `v-model:title`).',
      fix: 'Destructure `[model, modifiers] = defineModel(...)` and transform in `set`, or read the correctly named `xxxModifiers` prop.',
    },
    {
      symptom: 'The parent\'s object changes but watchers on it don\'t fire as expected / changes appear from nowhere.',
      cause: 'The child mutates nested properties of an object model.',
      fix: 'Assign a new object to `model.value` so an update event is emitted.',
    },
  ],

  bestPractices: [
    'Use `defineModel()` on Vue 3.4+; know the `modelValue` + `update:modelValue` pattern underneath.',
    'Let the parent own the initial value; prefer `required: true` over model defaults.',
    'Give models types (`defineModel({ type: Number })`) for dev-time warnings.',
    'Use named models (`v-model:title`) for components that edit several values.',
    'Replace object models wholesale (`model.value = { ...model.value, x }`) rather than mutating them.',
    'Apply input rules in the child (clamping, formatting) but keep authoritative validation with the owner and the server.',
  ],

  useCases: [
    'Reusable form controls: `BaseInput`, `BaseSelect`, `ToggleSwitch`, `QuantityStepper`.',
    'Composite inputs: a date-range picker with `v-model:start` and `v-model:end`.',
    'Open/closed state controlled by the parent: `<Modal v-model="isOpen" />` (or `v-model:open`).',
    'Editors: `<RichTextEditor v-model="body" />`, `<ColorPicker v-model="color" />`.',
    'Pagination: `<Paginator v-model:page="page" :total="pages" />`.',
  ],

  whenToUse: {
    use: [
      'The component edits a value the parent owns — like a native input would.',
      'You want parent code to read like `<Thing v-model="value" />`.',
      'A component edits several related values (named models).',
    ],
    avoid: [
      'The component only displays data — use props.',
      'The child reports an action (save, delete, close request) — emit a named event.',
      'The value is shared across distant components — use a store instead of chaining models through layers.',
    ],
  },

  comparison: {
    title: 'Three ways to build a v-model-able component',
    headers: ['', '`defineModel()`', '`modelValue` prop + `emit`', 'writable `computed` get/set'],
    rows: [
      ['Vue version', '3.4+', 'all Vue 3', 'all Vue 3'],
      ['Boilerplate', 'one line', 'prop + emit declarations + handler', 'prop + emit + computed'],
      ['v-model on the inner input', 'yes (it\'s a ref)', 'no — use `:value` + `@input`', 'yes (the computed)'],
      ['Works standalone (no v-model in parent)', 'yes, acts as a local ref', 'no — nothing changes', 'no — nothing changes'],
      ['Custom modifiers', 'destructure `[model, modifiers]` + `set`', 'read `modelModifiers` prop', 'read `modelModifiers` prop'],
    ],
    note: 'The writable-computed version is `computed({ get: () => props.modelValue, set: (v) => emit(\'update:modelValue\', v) })` — essentially what `defineModel` automates.',
  },

  quiz: [
    {
      id: 'component-v-model-q1',
      type: 'mcq',
      prompt: 'What does `<SearchBox v-model="query" />` expand to?',
      options: [
        { text: '`:value="query" @input="query = $event.target.value"`', why: 'That is how v-model works on a native `<input>`, and the Vue 2 component convention.' },
        { text: '`:modelValue="query" @update:modelValue="v => query = v"`' },
        { text: '`:query="query" @update:query="v => query = v"`', why: 'That is `v-model:query` — a named model.' },
        { text: 'A shared reactive reference that both components mutate.', why: 'There is no shared reference: a prop goes down, an event comes up.' },
      ],
      answer: 1,
      explanation: 'On components, the default model uses the `modelValue` prop and the `update:modelValue` event.',
    },
    {
      id: 'component-v-model-q2',
      type: 'output',
      prompt: 'The child emits `update:modelValue` with `"  Ada  "` (spaces included). What does the parent render?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
import NameInput from './NameInput.vue'
const name = ref('')
</script>

<template>
  <NameInput v-model.trim="name" />
  <p>[{{ name }}]</p>
</template>`,
      },
      options: [
        { text: '[  Ada  ]', why: '`.trim` on a component is applied by Vue to the emitted value.' },
        { text: '[Ada]' },
        { text: '[]', why: 'The update is delivered; it is just trimmed first.' },
        { text: 'An error — built-in modifiers only work on native inputs.', why: 'Vue applies `.trim` and `.number` to component `update:` events too.' },
      ],
      answer: 1,
      explanation: 'Vue passes `modelModifiers: { trim: true }` to the child and, when the child emits `update:modelValue`, trims string arguments before calling the parent\'s listener.',
    },
    {
      id: 'component-v-model-q3',
      type: 'bug',
      prompt: 'This pre-3.4 input component fails to compile. Which line is the problem?',
      code: {
        lang: 'vue',
        code: `<script setup>
defineProps(['modelValue'])
defineEmits(['update:modelValue'])
</script>

<template>
  <label>
    Email
    <input v-model="modelValue" type="email" />
  </label>
</template>`,
      },
      answerLine: 9,
      explanation: '`modelValue` is a prop, and `v-model` would assign to it. Use `:value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"`, or switch to `defineModel()`.',
    },
    {
      id: 'component-v-model-q4',
      type: 'fill',
      prompt: 'Bind the parent\'s `bookTitle` to the child\'s `title` model, and declare that model in the child.',
      code: {
        lang: 'vue',
        code: `<!-- parent -->
<BookForm v-model___="bookTitle" />

<!-- BookForm.vue -->
<script setup>
const title = ___('title')
</script>`,
      },
      answer: [[':title'], ['defineModel']],
      explanation: '`v-model:title` binds the `title` prop and the `update:title` event; `defineModel(\'title\')` declares both in the child.',
    },
    {
      id: 'component-v-model-q5',
      type: 'mcq',
      prompt: 'Inside a child, `const qty = defineModel()` and the parent uses `v-model="cartQty"`. What does `qty.value = 5` do?',
      options: [
        { text: 'Sets the `modelValue` prop to 5 directly.', why: 'Props are read-only; `defineModel` never writes the prop.' },
        { text: 'Emits `update:modelValue` with 5; the child sees 5 once the parent updates `cartQty` and re-renders.' },
        { text: 'Changes a local copy only; the parent never knows.', why: 'That only happens when the parent does *not* bind v-model.' },
        { text: 'Throws, because the model is read-only.', why: 'Writing to a model ref is exactly how you request a change.' },
      ],
      answer: 1,
      explanation: 'The model ref is a request channel: writes emit, reads reflect the prop. One-way data flow is preserved.',
    },
    {
      id: 'component-v-model-q6',
      type: 'mcq',
      prompt: 'You are migrating Vue 2 code: `<DateRange :start.sync="from" :end.sync="to" />`. What is the Vue 3 equivalent?',
      options: [
        { text: '`<DateRange v-model="from" v-model="to" />`', why: 'Two unnamed models would both target `modelValue`.' },
        { text: '`<DateRange v-model:start="from" v-model:end="to" />`' },
        { text: '`<DateRange :start="from" :end="to" sync />`', why: '`sync` is not an attribute; `.sync` was removed.' },
        { text: '`.sync` still works in Vue 3.', why: '`.sync` was removed in Vue 3 in favour of named `v-model`.' },
      ],
      answer: 1,
      explanation: 'Named models replace `.sync`: each one is a `prop` + `update:prop` pair.',
    },
    {
      id: 'component-v-model-q7',
      type: 'short',
      prompt: 'If `defineModel()` lets the child assign to a value, why doesn\'t that break one-way data flow?',
      answer: 'Because assigning doesn\'t change the prop — it emits `update:modelValue` to the parent. The parent, which owns the state, updates its ref, and the new value flows back down as a prop. The child only requests changes; the owner still makes them.',
    },
  ],

  exercises: [
    {
      id: 'toggle-switch',
      title: 'An accessible ToggleSwitch with v-model',
      difficulty: 'intermediate',
      prompt: `
Build \`ToggleSwitch.vue\` so the parent can write \`<ToggleSwitch v-model="notifications" />\`.

- Use \`defineModel()\` for a boolean value.
- Render \`<button class="switch" role="switch">\` whose \`aria-checked\` attribute is \`"true"\` or \`"false"\` to match the value, and whose text is **On** or **Off**.
- Clicking the button flips the value.

\`App.vue\` is done: it shows \`<p class="status">Notifications: on</p>\` (or **off**).
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import ToggleSwitch from './ToggleSwitch.vue'

const notifications = ref(false)
</script>

<template>
  <ToggleSwitch v-model="notifications" />
  <p class="status">Notifications: {{ notifications ? 'on' : 'off' }}</p>
</template>`,
        'ToggleSwitch.vue': `<script setup>
// TODO: a boolean model
</script>

<template>
  <button class="switch" role="switch" aria-checked="false">Off</button>
</template>`,
      },
      hints: [
        '`const on = defineModel({ type: Boolean, default: false })` — or without a default, since the parent always passes one.',
        'Flip it on click: `@click="on = !on"`.',
        'Bind the attribute as a string: `:aria-checked="on ? \'true\' : \'false\'"` (or `String(on)`), and the label with `{{ on ? \'On\' : \'Off\' }}`.',
      ],
      solution: {
        explanation: 'The switch never owns the setting: reading `on` reads the parent\'s value, and assigning to it emits `update:modelValue`. `role="switch"` plus `aria-checked` tells assistive technology what the button is and whether it\'s on.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import ToggleSwitch from './ToggleSwitch.vue'

const notifications = ref(false)
</script>

<template>
  <ToggleSwitch v-model="notifications" />
  <p class="status">Notifications: {{ notifications ? 'on' : 'off' }}</p>
</template>`,
          'ToggleSwitch.vue': `<script setup>
const on = defineModel({ type: Boolean })
</script>

<template>
  <button
    class="switch"
    role="switch"
    :aria-checked="on ? 'true' : 'false'"
    @click="on = !on"
  >
    {{ on ? 'On' : 'Off' }}
  </button>
</template>`,
        },
      },
      tests: [
        {
          name: 'emits update:modelValue with the flipped value',
          code: `const s = mountFile('ToggleSwitch.vue', { modelValue: false })
await click(s.find('.switch'))
expect(s.emitted('update:modelValue')).toEqual([[true]])`,
        },
        {
          name: 'aria-checked and label follow the value',
          code: `const s = mountFile('ToggleSwitch.vue', { modelValue: true })
expect(s.find('.switch').getAttribute('aria-checked')).toBe('true')
expect(s.find('.switch').textContent.trim()).toBe('On')`,
        },
        {
          name: 'the parent stays in sync',
          code: `expect(text('.status')).toBe('Notifications: off')
await click('.switch')
expect(text('.status')).toBe('Notifications: on')
expect(attr('.switch', 'aria-checked')).toBe('true')
await click('.switch')
expect(text('.status')).toBe('Notifications: off')`,
        },
      ],
    },
    {
      id: 'price-range',
      title: 'A price filter with two named models',
      difficulty: 'intermediate',
      prompt: `
\`App.vue\` filters products with \`<PriceRange v-model:min="min" v-model:max="max" />\`. Finish \`PriceRange.vue\`:

- Declare two **named** models, \`min\` and \`max\`.
- Bind them to \`<input class="min" type="number">\` and \`<input class="max" type="number">\`.
- The values sent to the parent must be **numbers**, not strings.
`,
      files: {
        'App.vue': rangeApp,
        'PriceRange.vue': `<script setup>
// TODO: two named models
</script>

<template>
  <div class="range">
    <input class="min" type="number" />
    <span>to</span>
    <input class="max" type="number" />
  </div>
</template>`,
      },
      hints: [
        '`const min = defineModel(\'min\')` and `const max = defineModel(\'max\')`.',
        'Bind with `v-model` on each input — the model refs are writable.',
        'Add the `.number` modifier on the inner inputs (`v-model.number="min"`) so a number is emitted.',
      ],
      solution: {
        explanation: 'Each named model is its own prop/event pair (`min`/`update:min`, `max`/`update:max`). The `.number` modifier on the inner inputs converts the text to a number before the model ref emits it.',
        files: {
          'App.vue': rangeApp,
          'PriceRange.vue': `<script setup>
const min = defineModel('min', { type: Number })
const max = defineModel('max', { type: Number })
</script>

<template>
  <div class="range">
    <input class="min" type="number" v-model.number="min" />
    <span>to</span>
    <input class="max" type="number" v-model.number="max" />
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'shows all products at first', code: `expect(text('.count')).toBe('4 products')` },
        {
          name: 'typing a minimum filters the list',
          code: `await type('.min', '10')
expect(text('.count')).toBe('3 products')
await type('.max', '30')
expect(text('.count')).toBe('2 products')`,
        },
        {
          name: 'emits numbers on update:min / update:max',
          code: `const r = mountFile('PriceRange.vue', { min: 0, max: 100 })
await type(r.find('.min'), '15')
await type(r.find('.max'), '40')
expect(r.emitted('update:min')).toEqual([[15]])
expect(r.emitted('update:max')).toEqual([[40]])`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'component-v-model-how-it-works',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How does `v-model` work on a custom component in Vue 3?',
      answer: 'It is syntactic sugar for a prop plus an event: `v-model="x"` becomes `:modelValue="x"` and `@update:modelValue="v => x = v"`. The child reads `modelValue` and emits `update:modelValue` to request a change. Since 3.4, `defineModel()` declares both and returns a ref that reads the prop and emits on write. Named models (`v-model:title`) use `title`/`update:title`.',
      explanation: 'Two-way binding implemented with one-way data flow.',
      whyAsked: 'Core knowledge for building any reusable form component.',
      mistakes: ['Using Vue 2 names (`value`/`input`).', 'Saying the child mutates the parent\'s state directly.', 'Not knowing named models.'],
      followUps: ['What does `defineModel()` compile to?', 'How do modifiers work on components?', 'How would you support multiple values?'],
      modelAnswer: 'On a component, `v-model` expands to a `modelValue` prop and an `update:modelValue` listener that assigns the new value. The child displays the prop and emits the event when the user changes something, so the parent remains the owner. In Vue 3.4+ I use `defineModel()`, which declares that prop and emit and gives me a ref — reads come from the prop, writes emit. For several values I use named models like `v-model:start` and `v-model:end`.',
    },
    {
      id: 'component-v-model-compare',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `defineModel()` with the manual `modelValue` prop + `update:modelValue` emit pattern.',
      answer: '`defineModel()` (3.4+) is a compiler macro that generates the prop, the emit declaration and a ref via `useModel`. It\'s shorter, lets you put `v-model` on inner inputs, supports custom modifiers via destructuring, and falls back to local state if the parent doesn\'t bind it. The manual pattern works in all Vue 3 versions, is more explicit, and is what you\'ll find in older code and libraries.',
      explanation: 'Same contract, different amount of code.',
      whyAsked: 'Checks familiarity with modern Vue and the ability to work in older codebases.',
      mistakes: ['Thinking `defineModel` creates shared state.', 'Not knowing it requires 3.4+.'],
      followUps: ['What happens when the parent doesn\'t pass v-model?', 'How would you do the same with a writable computed?'],
      modelAnswer: 'Both implement the same `modelValue` / `update:modelValue` contract. The manual way declares the prop and the emit and wires `:value` and `@input` myself — it works everywhere in Vue 3. `defineModel` is a 3.4+ macro that generates all that and returns a ref: reading gives the prop, writing emits. It also lets me use `v-model` on an inner input, read custom modifiers, and it behaves like a local ref when the parent doesn\'t bind it. For new code I use `defineModel`; I still need to recognise the manual pattern.',
    },
    {
      id: 'component-v-model-object-mutation',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'An `AddressForm` uses `const address = defineModel()` and binds inputs to `address.street`, `address.city`. The parent\'s address changes as you type, but a watcher on the parent\'s `update:modelValue`-driven save logic never runs. Why?',
      code: {
        lang: 'vue',
        code: `<script setup>
const address = defineModel()
</script>
<template>
  <input v-model="address.street" />
  <input v-model="address.city" />
</template>`,
      },
      answer: '`v-model="address.street"` writes into the nested object, which is the parent\'s object passed by reference. The model ref\'s `.value` is never assigned, so no `update:modelValue` is emitted — the parent\'s data changes silently. Fix: emit a new object on each change (`address.value = { ...address.value, street }`), or use separate named models (`v-model:street`, `v-model:city`) for each field, or edit a local copy and emit on submit.',
      explanation: 'Only assignments to `.value` go through the setter that emits.',
      whyAsked: 'A subtle real-world bug that tests understanding of references and how `defineModel` works.',
      mistakes: ['Blaming deep watchers.', 'Thinking defineModel deep-watches the object.'],
      followUps: ['Which fix would you choose for a large form?', 'How would you make the parent\'s copy immutable?'],
      modelAnswer: 'The inputs write `address.street` directly, which mutates the parent\'s object because objects are passed by reference. The `defineModel` ref only emits when its `.value` is assigned, so no update event is ever sent — the parent changes silently and anything relying on the event doesn\'t run. I\'d either assign a new object on each change, split into named models per field, or edit a local copy and emit the whole address on submit, which also gives a natural cancel button.',
    },
    {
      id: 'component-v-model-default-desync',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'Child: `const count = defineModel({ default: 1 })`, rendered as `{{ count }}`. Parent: `const count = ref()` and `<Counter v-model="count" /> <p>{{ count }}</p>`. What does the page show before any interaction?',
      options: ['1 and 1', '1 and an empty paragraph', 'nothing and nothing', 'an error'],
      correctOption: 1,
      answer: 'The child shows **1** (its default, because the parent passed `undefined`), while the parent\'s paragraph is empty because its ref is still `undefined`. They disagree until the child emits.',
      explanation: 'The default exists only on the child\'s side of the contract; it is never sent to the parent.',
      whyAsked: 'Tests precise understanding of prop defaults combined with v-model — a documented pitfall.',
      mistakes: ['Assuming the default is pushed to the parent.', 'Not knowing `undefined` triggers the prop default.'],
      followUps: ['How do you prevent this?', 'Why does `null` behave differently from `undefined` here?'],
      modelAnswer: 'The child shows 1 and the parent shows nothing. Passing `undefined` makes the child fall back to its prop default, but that default is never emitted to the parent, so the parent\'s ref stays undefined. The fix is to let the owner hold the starting value — `ref(1)` in the parent — and declare the model as required instead of defaulted.',
    },
    {
      id: 'component-v-model-dialog',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'You\'re building a `ConfirmDialog`. Should its open/closed state use `v-model`, and how should the "Confirm" button communicate?',
      answer: 'Open/closed is a value the parent owns and the dialog can change (closing on Escape or backdrop click), so `v-model` (or `v-model:open`) fits well. "Confirm" is an action, not a value: emit a `confirm` event (and close via the model). Mixing them — e.g., a model whose value means "confirmed" — makes the API confusing.',
      explanation: 'Models for values, events for actions.',
      code: {
        lang: 'vue',
        code: `<ConfirmDialog v-model:open="showDialog" @confirm="deleteProject" />

<!-- ConfirmDialog.vue -->
<script setup>
const open = defineModel('open', { type: Boolean })
const emit = defineEmits(['confirm'])
function confirm() { emit('confirm'); open.value = false }
</script>`,
      },
      whyAsked: 'Component API design: knowing when v-model is the right tool.',
      mistakes: ['Using a model for actions.', 'Letting the dialog own its open state so the parent can\'t open it.'],
      followUps: ['How would you handle async confirmation (wait for delete to finish)?', 'Where would you use `<Teleport>` here?'],
      modelAnswer: 'Visibility is a value: the parent opens the dialog, the dialog can close itself, so `v-model:open` with `defineModel(\'open\')` is a natural fit. Confirming is an action, so it\'s a `confirm` event the parent handles — then the dialog closes by setting `open` to false. Keeping values in models and actions in events keeps the API obvious. If confirmation is async, I\'d pass a `loading` prop down so the dialog can show progress.',
    },
    {
      id: 'component-v-model-coding-search',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `SearchBox.vue` for `<SearchBox v-model="query" />`: an `<input class="search">` bound to the model, and a `<button class="clear">` that empties it. Pressing **Escape** in the input also clears it.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import SearchBox from './SearchBox.vue'

const query = ref('vue')
</script>

<template>
  <SearchBox v-model="query" />
  <p class="query">Searching for: {{ query }}</p>
</template>`,
          'SearchBox.vue': `<script setup>
// TODO
</script>

<template>
  <div class="search-box">
    <input class="search" />
    <button class="clear">✕</button>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'shows the parent value', code: `expect(find('.search').value).toBe('vue')` },
        { name: 'typing updates the parent', code: `await type('.search', 'pinia'); expect(text('.query')).toBe('Searching for: pinia')` },
        { name: 'clear button empties it', code: `await click('.clear'); expect(text('.query')).toBe('Searching for:'); expect(find('.search').value).toBe('')` },
        {
          name: 'Escape clears it',
          code: `await type('.search', 'router')
await trigger('.search', 'keyup', { key: 'Escape' })
expect(text('.query')).toBe('Searching for:')`,
        },
      ],
      hints: ['`const query = defineModel()` gives you a writable ref.', 'Bind it with `v-model` on the input; clear with `query = \'\'`.', 'Use `@keyup.esc` (or `@keyup.escape`) on the input.'],
      answer: 'Declare a model with `defineModel()`, bind it to the input, and assign an empty string from both the button and the Escape key handler.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import SearchBox from './SearchBox.vue'

const query = ref('vue')
</script>

<template>
  <SearchBox v-model="query" />
  <p class="query">Searching for: {{ query }}</p>
</template>`,
          'SearchBox.vue': `<script setup>
const query = defineModel({ type: String, default: '' })

function clear() {
  query.value = ''
}
</script>

<template>
  <div class="search-box">
    <input class="search" v-model="query" @keyup.esc="clear" />
    <button class="clear" type="button" aria-label="Clear search" @click="clear">✕</button>
  </div>
</template>`,
        },
      },
      explanation: 'Every write to the model ref emits `update:modelValue`, so the input, the button and the Escape key all funnel through the same channel to the parent.',
      whyAsked: 'A realistic small component combining defineModel, key modifiers and accessibility details.',
      mistakes: ['Keeping a separate local copy of the query that drifts from the parent.', 'Forgetting `type="button"` inside forms.', 'Missing an accessible label on an icon-only button.'],
      followUps: ['How would you debounce the updates to the parent?', 'How would you forward `placeholder` and other attributes to the input?'],
      modelAnswer: 'I declare `const query = defineModel()` and bind it to the input with `v-model`. A `clear` function assigns an empty string, which emits `update:modelValue`; the button and `@keyup.esc` both call it. I add `type="button"` and an `aria-label` because it\'s icon-only. To forward attributes like `placeholder`, I\'d set `inheritAttrs: false` and bind `$attrs` to the input.',
    },
  ],

  takeaways: [
    '`v-model` on a component = `:modelValue` prop down + `@update:modelValue` event up.',
    '`defineModel()` (3.4+) declares both and returns a ref: reads come from the prop, writes emit.',
    'The manual props + emit pattern works in every Vue 3 version — never put `v-model` on a raw prop.',
    'Named models (`v-model:title` ↔ `defineModel(\'title\')`) allow several bindings and replace Vue 2\'s `.sync`.',
    '`.trim`/`.number` work on components; custom modifiers come as an object you interpret in the child.',
    'Replace object models wholesale and let the parent own initial values to avoid hidden mutations and desync.',
  ],
}
