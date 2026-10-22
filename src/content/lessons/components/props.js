// Lesson: Props, validation & one-way data flow

const propsApp = `<script setup>
import { ref } from 'vue'
import ProductCard from './ProductCard.vue'

const mugPrice = ref(12)

function priceDrop() {
  mugPrice.value = mugPrice.value - 2
}
</script>

<template>
  <button class="price-drop" @click="priceDrop">Price drop on the mug!</button>

  <ProductCard name="Ceramic Mug" :price="mugPrice" badge="sale" in-stock />
  <ProductCard name="Notebook" :price="8" :in-stock="false" />
</template>`

const productCard = `<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  inStock: Boolean,
  badge: {
    type: String,
    default: 'none',
    validator: (value) => ['none', 'new', 'sale'].includes(value),
  },
})

const priceLabel = computed(() => '$' + props.price.toFixed(2))
</script>

<template>
  <article class="product-card">
    <h3 class="name">
      {{ name }}
      <span v-if="badge !== 'none'" class="badge">{{ badge }}</span>
    </h3>
    <p class="price">{{ priceLabel }}</p>
    <p class="stock">{{ inStock ? 'In stock' : 'Sold out' }}</p>
  </article>
</template>

<style scoped>
.product-card { border: 2px solid #222; border-radius: 10px; padding: 8px 14px; margin: 10px 0; max-width: 260px; }
.name { margin: 0; font-size: 1rem; }
.badge { font-size: 0.7rem; text-transform: uppercase; background: #ffe14d; padding: 2px 6px; border-radius: 6px; }
.price { margin: 4px 0; font-weight: bold; }
.stock { margin: 0; opacity: 0.7; }
</style>`

const staleBadgeApp = `<script setup>
import { ref } from 'vue'
import UserBadge from './UserBadge.vue'

const first = ref('Ada')
const last = ref('Lovelace')

function rename() {
  first.value = 'Grace'
  last.value = 'Hopper'
}
</script>

<template>
  <UserBadge :first-name="first" :last-name="last" />
  <button class="rename" @click="rename">Switch user</button>
</template>`

export default {
  id: 'props',
  title: 'Props, validation & one-way data flow',
  summary: 'Pass data from a parent into a child with props, declare and validate them with defineProps, and respect the rule that data flows one way: down.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['why-components'],
  related: ['emits', 'component-v-model', 'fallthrough-attrs', 'computed', 'reactivity-utilities', 'typing-components'],
  tags: ['props', 'defineProps', 'validation', 'default', 'required', 'one-way data flow', 'reactive props destructure', 'boolean props', 'v-bind'],
  apis: [
    { name: 'defineProps()', summary: 'Compiler macro in `<script setup>` that declares the props a component accepts and returns the props object.' },
    { name: 'props option', summary: 'Options API equivalent: `props: { name: String }`, read as `this.name`.' },
    { name: 'withDefaults()', summary: 'Pre-3.5 way to give defaults to type-based (TypeScript) prop declarations.' },
  ],
  docs: [
    { label: 'Vue Guide — Props', url: 'https://vuejs.org/guide/components/props.html' },
    { label: 'Vue Guide — Reactive Props Destructure (3.5+)', url: 'https://vuejs.org/guide/components/props.html#reactive-props-destructure' },
    { label: 'API — defineProps() & defineEmits()', url: 'https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits' },
  ],

  intro: `
**Props** (short for *properties*) are the inputs of a component. The parent writes them as attributes on the child's tag — \`<ProductCard name="Mug" :price="12" />\` — and the child receives them as read-only values it can display and compute with.

A child declares which props it accepts with \`defineProps()\`. That declaration can also say what **type** each prop should be, whether it is **required**, what its **default** is, and a custom **validator**.

And there's one golden rule: **props flow down**. The parent owns the data; the child reads it. When the parent changes the value, the child updates automatically. The child never changes it directly.
`,

  why: `
A reusable component is useless if it can only show one thing. \`ProductCard\` must show *a mug* here and *a notebook* there. Props are how the same blueprint receives different data each time it's used — exactly like arguments to a function:

\`\`\`js
function productCard(name, price) { /* ... */ }   // a function's inputs
\`\`\`
\`\`\`vue
<ProductCard name="Mug" :price="12" />            <!-- a component's inputs -->
\`\`\`

Why declare and validate them? Because a component is a *contract*. When a teammate passes \`price="12"\` (a string!) or forgets \`name\`, a declared, typed prop makes Vue warn immediately in development instead of letting a weird bug show up three screens later.

Why one-way? If any child could change the data it receives, then whenever a value looked wrong you'd have to search every component that *might* have touched it. With one-way flow, the owner is the only one who changes it — you always know where to look.
`,

  eli15: `
Think of a restaurant. The kitchen (the child) gets an order slip from the waiter (the parent): "1 pizza, extra cheese, table 7". The cook reads the slip and makes the pizza.

The order slip is a **prop**. The cook doesn't scribble on it — if the customer changes their mind, the waiter brings a new slip. That's **one-way data flow**: information comes *down* from the parent; the child only reads it.

The kitchen can also have rules: "every slip **must** have a table number" (*required*), "if no size is written, make a medium" (*default*), and "size must be small, medium or large" (*validator*). If a slip breaks a rule, the cook complains loudly (Vue prints a warning) so the mistake gets fixed early.
`,

  analogy: {
    title: 'The order slip',
    body: `
A waiter hands the kitchen an order slip. The cook reads it and cooks; they never edit the slip. If the order changes, the waiter writes a new one and the kitchen adapts.

Every kitchen has a slip format: some boxes must be filled, some have defaults, some only accept certain values.
`,
    mapping: [
      ['the waiter', 'the parent component that owns the data'],
      ['the order slip', 'the props passed to the child'],
      ['the cook', 'the child component reading `props`'],
      ['"never write on the slip"', 'props are read-only in the child'],
      ['a new slip when the order changes', 'the parent updates its state; the child re-renders with new props'],
      ['the slip format (required boxes, defaults, allowed values)', '`defineProps` with `type`, `required`, `default`, `validator`'],
      ['the cook complaining about a bad slip', 'a dev-mode `[Vue warn]` about an invalid prop'],
    ],
  },

  visual: {
    type: 'component-flow',
    props: { mode: 'props' },
    title: 'Props flow down',
    caption: 'The parent owns the state. Change it and watch the new value travel **down** into the child, which re-renders. Click a component to see its code.',
    alt: 'An animated diagram with a parent component above a child component. The parent holds a value; when it changes, a packet labelled with the prop name travels down an arrow into the child, whose displayed value updates.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'One-way data flow, step by step',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'state', label: 'Parent state', note: 'mugPrice = 12', tone: 'acid', x: 150, y: 70 },
        { id: 'render', label: 'Parent render', note: '<ProductCard :price="mugPrice">', x: 420, y: 70 },
        { id: 'props', label: 'Child props', note: 'read-only', tone: 'cobalt', x: 420, y: 220 },
        { id: 'child', label: 'Child render', note: '$12.00', x: 650, y: 220 },
        { id: 'mutate', label: 'props.price = 5', note: 'blocked + warning', tone: 'red', x: 150, y: 220 },
      ],
      edges: [
        { from: 'state', to: 'render', label: 'read' },
        { from: 'render', to: 'props', label: 'pass down' },
        { from: 'props', to: 'child', label: 'display' },
        { from: 'mutate', to: 'props', label: '✗', dashed: true },
      ],
      steps: [
        { focus: ['state'], text: 'The **parent owns** the data: `mugPrice` is a ref in the parent.' },
        { focus: ['render', 'props'], edges: ['state->render', 'render->props'], text: 'While rendering, the parent passes the current value to the child as the `price` prop.' },
        { focus: ['child'], edges: ['props->child'], text: 'The child reads `price` and displays `$12.00`. It never owns this value.' },
        { focus: ['state', 'render', 'props', 'child'], edges: ['state->render', 'render->props', 'props->child'], text: 'The parent sets `mugPrice` to 10. Its render re-runs, the child receives the new prop and re-renders: **data flows down** automatically.' },
        { focus: ['mutate', 'props'], edges: ['mutate->props'], text: 'If the child tries `props.price = 5`, Vue refuses (props are read-only) and warns in development. To request a change, the child **emits an event** and lets the parent decide — see [emits](lesson:emits).' },
      ],
    },
    caption: 'Why a child must never write to its props, and what happens instead.',
    alt: 'A stepped diagram. Parent state flows to the parent render, which passes a prop down to the child props box, which feeds the child render. A red box "props.price = 5" points at the child props with a dashed, crossed-out arrow, showing the mutation is blocked.',
  },

  syntax: [
    `
**Declaring props.** Inside \`<script setup>\`, call the \`defineProps()\` macro. It is a *compiler macro*: you don't import it, and it must be called at the top level of \`<script setup>\`.
`,
    {
      code: `<script setup>
// 1. Array syntax — names only (quick prototypes)
defineProps(['name', 'price'])
</script>`,
      lang: 'vue',
      title: 'array syntax',
    },
    {
      code: `<script setup>
// 2. Object syntax — names + rules (recommended)
const props = defineProps({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  inStock: Boolean,                           // shorthand: just a type
  tags: { type: Array, default: () => [] },   // objects/arrays need a factory
  size: { type: [String, Number], default: 'md' },   // several allowed types
  badge: {
    type: String,
    default: 'none',
    validator: (value) => ['none', 'new', 'sale'].includes(value),
  },
})

console.log(props.price)   // in JavaScript: props.xxx
</script>

<template>
  <h3>{{ name }}</h3>      <!-- in the template: just the name -->
</template>`,
      lang: 'vue',
      title: 'object syntax with validation',
    },
    `
**Passing props from the parent:**

- \`name="Mug"\` passes the literal **string** \`"Mug"\`.
- \`:price="12"\` (short for \`v-bind:price\`) evaluates a JavaScript expression — here the **number** 12. Numbers, booleans, arrays, objects and variables all need \`:\`.
- \`in-stock\` with no value means \`true\` for a \`Boolean\` prop; leaving it out means \`false\`.
- \`v-bind="product"\` passes every property of an object as a separate prop.
- Declare names in **camelCase** (\`inStock\`); in templates you can write them in **kebab-case** (\`in-stock\`) — Vue converts.
`,
    {
      code: `<ProductCard
  name="Ceramic Mug"
  :price="mugPrice"
  :tags="['kitchen', 'gift']"
  in-stock
/>

<!-- equivalent to :name="product.name" :price="product.price" … -->
<ProductCard v-bind="product" />`,
      lang: 'vue',
      title: 'passing props',
    },
    `
**What you get when a prop is missing:** an absent optional prop is \`undefined\`, except \`Boolean\` props, which become \`false\`. A \`default\` is used whenever the value is \`undefined\` — absent *or* explicitly \`undefined\` (but not \`null\`).

**Reactive props destructure (Vue 3.5+).** You can destructure props and give defaults with normal JavaScript syntax. The compiler rewrites every use to \`props.xxx\`, so it stays reactive:
`,
    {
      code: `<script setup>
const { name, price, badge = 'none' } = defineProps({
  name: String,
  price: Number,
  badge: String,
})

// ✅ reactive: compiled to props.price
const priceLabel = computed(() => '$' + price.toFixed(2))

// ⚠️ watch needs a getter, not the variable itself
watch(() => price, (now, before) => console.log(before, '→', now))
</script>`,
      lang: 'vue',
      title: 'reactive props destructure (3.5+)',
    },
    {
      callout: 'version',
      title: 'Version notes',
      text: 'Reactive props destructure requires **Vue 3.5+**. In earlier versions, destructuring `defineProps()` lost reactivity — use `props.xxx` there. With TypeScript you can declare props by type: `defineProps<{ name: string; price?: number }>()`; before 3.5 defaults for that form came from `withDefaults()`.',
    },
    {
      code: `// TypeScript (shown for reference — the playground runs plain JS)
const { name, price = 0 } = defineProps<{
  name: string
  price?: number
}>()`,
      lang: 'ts',
      static: true,
      title: 'type-based declaration',
    },
    `
**One-way data flow — the two legitimate reasons you might want to "change" a prop:**

1. *The prop is a starting value* → copy it into local state: \`const qty = ref(props.initialQty)\`. From then on the child owns \`qty\` (and won't follow later prop changes — that's the point).
2. *You need a transformed version* → derive it: \`const priceLabel = computed(() => ...)\`.

If the parent's data really must change, the child **emits an event** and the parent updates its own state ([emits](lesson:emits), [component v-model](lesson:component-v-model)).
`,
  ],

  walkthrough: {
    title: 'ProductCard.vue',
    lang: 'vue',
    code: productCard,
    intro: 'The child side of the playground: every prop declared with rules, then used in a computed and in the template.',
    steps: [
      { lines: [4], text: '`defineProps()` is a compiler macro — no import needed. It returns the reactive, read-only props object, stored here as `props`.' },
      { lines: [5, 6], text: '`required: true` means the parent must pass these. Forget one and Vue warns `Missing required prop: "name"` in development.' },
      { lines: [7], text: 'Shorthand: just the type. A `Boolean` prop has special casting — `<ProductCard in-stock />` gives `true`, leaving it out gives `false`.' },
      { lines: [8, 12], text: 'A full rule: a type, a `default` used when the parent passes nothing, and a `validator` that returns `true` for allowed values. Validation only produces warnings, in development.' },
      { lines: [15], text: 'In JavaScript, read props through the object: `props.price`. Wrapping it in `computed` keeps the label in sync whenever the parent sends a new price.' },
      { lines: [21, 22], text: 'In the template, props are available by name — `{{ name }}`, `badge` — just like local state, but read-only.' },
      { lines: [24, 25], text: 'Derived output: the computed label and a message based on the boolean prop.' },
    ],
  },

  playground: {
    title: 'Product cards driven by props',
    objective: 'See props flow down from a parent, then add props of your own — with defaults and validation.',
    files: { 'App.vue': propsApp, 'ProductCard.vue': productCard },
    expected: 'Two cards: the mug shows a **SALE** badge, $12.00 and "In stock"; the notebook shows $8.00 and "Sold out". Clicking **Price drop** lowers the mug\'s price — the parent changed its state and the child followed.',
    experiments: [
      {
        id: 'discount',
        task: 'Add a `discount` prop to `ProductCard` (a `Number`, default `0`, meaning a percentage). The price label should show the **discounted** price. Then pass `:discount="25"` to the Notebook, so it shows **$6.00**.',
        hint: 'Declare `discount: { type: Number, default: 0 }` and change the computed to `props.price * (1 - props.discount / 100)` before calling `.toFixed(2)`.',
        tests: [
          {
            name: 'the notebook shows $6.00 and the mug is unchanged',
            code: `const prices = findAll('.price').map((el) => el.textContent.trim())
expect(prices[0]).toBe('$12.00')
expect(prices[1]).toBe('$6.00')`,
          },
          {
            name: 'ProductCard applies any discount it receives',
            code: `const card = mountFile('ProductCard.vue', { name: 'Lamp', price: 40, discount: 50 })
expect(card.find('.price').textContent.trim()).toBe('$20.00')`,
          },
        ],
        explain: 'A new prop extended the contract without touching the parent\'s other cards. The `default: 0` keeps every existing usage working.',
      },
      {
        id: 'initial-qty',
        task: 'Let shoppers pick a quantity. Add an `initialQty` prop (`Number`, default `1`), copy it into a **local** `qty` ref, show it in `<span class="qty">` and add a `<button class="more">` that increases it by one.',
        hint: '`const qty = ref(props.initialQty)` (import `ref`). The button does `qty++` — it changes the *local* copy, never the prop.',
        tests: [
          {
            name: 'qty starts from initialQty and the + button increases it',
            code: `const card = mountFile('ProductCard.vue', { name: 'Mug', price: 12, initialQty: 3 })
expect(card.find('.qty').textContent.trim()).toBe('3')
await click(card.find('.more'))
expect(card.find('.qty').textContent.trim()).toBe('4')
expect(card.props.initialQty).toBe(3)`,
          },
        ],
        explain: 'The prop is only the *starting* value. Once copied into a local ref, the child owns it and can change it freely — the parent\'s value is untouched (the last assertion checks that `initialQty` is still 3).',
      },
      {
        id: 'invalid-badge',
        task: 'Change the Notebook to `badge="hot"` and look at the **console**. Does the badge still render?',
        explain: 'You see `Invalid prop: custom validator check failed for prop "badge"`, yet the card still renders "hot". Validation is a **development-time warning**, not a gate — production builds skip it entirely. Never rely on it for security or data integrity.',
      },
      {
        id: 'currency',
        task: 'Switch to **reactive props destructure** (Vue 3.5+): `const { name, price, inStock, badge = \'none\', currency = \'$\' } = defineProps({ …, currency: String })`. Show the currency before the price, so `currency="€"` gives **€12.00** while cards without it keep **$**.',
        hint: 'Inside the computed, use the destructured variables directly: `currency + price.toFixed(2)`. Delete the `const props =` line once nothing uses it.',
        tests: [
          {
            name: 'the default currency is $',
            code: `const card = mountFile('ProductCard.vue', { name: 'Mug', price: 12 })
expect(card.find('.price').textContent.trim()).toContain('$12.00')`,
          },
          {
            name: 'a currency prop replaces the symbol',
            code: `const card = mountFile('ProductCard.vue', { name: 'Mug', price: 12, currency: '€' })
expect(card.find('.price').textContent.trim()).toContain('€12.00')`,
          },
          {
            name: 'the label stays reactive after destructuring',
            code: `const card = mountFile('ProductCard.vue', { name: 'Mug', price: 12, currency: '€' })
await card.setProps({ price: 9 })
expect(card.find('.price').textContent.trim()).toContain('€9.00')`,
          },
        ],
        explain: 'Destructured props in 3.5+ are compiled back into `props.price`, so the computed still tracks them. In Vue 3.4 and earlier this destructuring would have frozen the values — which is why older code always writes `props.xxx`.',
      },
    ],
  },

  internals: {
    beginner: `
When the parent renders \`<ProductCard :price="mugPrice" />\`, Vue collects the attributes into an object and hands the declared ones to the child as its \`props\`. That object is **reactive**: when the parent's \`mugPrice\` changes, the parent re-renders, Vue updates \`props.price\` in the child, and anything in the child that read \`price\` re-renders too.
`,
    technical: [
      `
Each child vnode carries the raw attributes the parent wrote. When Vue creates or updates the instance it **splits** them: keys declared in \`defineProps\` go into \`instance.props\` (a \`shallowReactive\` object), everything else goes into \`instance.attrs\` — see [fallthrough attributes](lesson:fallthrough-attrs). On a parent re-render, Vue compares old and new values and only sets the props that changed, which triggers the child's render effect.
`,
      {
        code: `// Simplified model of what Vue does with incoming props — not the real source
function resolveProps(declared, rawVNodeProps) {
  const props = {}, attrs = {}
  for (const key in rawVNodeProps) {
    const camel = camelize(key)                 // 'in-stock' -> 'inStock'
    if (camel in declared) props[camel] = rawVNodeProps[key]
    else attrs[key] = rawVNodeProps[key]        // undeclared -> fallthrough
  }
  for (const key in declared) {
    const opt = declared[key]
    if (props[key] === undefined && 'default' in opt) {
      props[key] = typeof opt.default === 'function' && opt.type !== Function
        ? opt.default()                         // factory: fresh object per instance
        : opt.default
    }
    if (opt.type === Boolean && !(key in props)) props[key] = false   // boolean casting
    if (__DEV__) validateProp(key, props[key], opt)   // warnings only, dev only
  }
  return { props, attrs }
}`,
        lang: 'js',
        title: 'mental model of prop resolution',
      },
      `
**Read-only:** in development, \`<script setup>\` receives the props object wrapped in \`shallowReadonly\`, so \`props.price = 5\` logs a warning (in Vue 3.5: \`Set operation on key "price" failed: target is readonly.\`). Assigning through the template proxy is rejected with \`Attempting to mutate prop "price". Props are readonly.\` The protection is **shallow** — \`props.user.name = 'x'\` mutates the parent's object without any warning.

**Reactive destructure (3.5+)** is a compile-time transform. \`const { price = 0 } = defineProps(...)\` becomes a default in the props declaration, and every later \`price\` in the same \`<script setup>\` becomes \`__props.price\`. That's also why \`watch(price, ...)\` is a compile error: the compiler would be passing a plain number — you must pass a getter, \`() => price\`.
`,
    ],
    production: `
- **Validation is development-only.** Production builds skip type checks and validators for speed. Treat \`defineProps\` rules as documentation and early warnings, not as data validation — and never as a security boundary (the backend must validate anything that matters).
- **Mark what's essential as \`required\`** and give everything else a sensible default, so a component works with the minimum props.
- **Object and array props are passed by reference.** Don't mutate them in the child, even though Vue can't stop you: emit an event or use [component v-model](lesson:component-v-model) so the owner makes the change.
- **Too many props** (especially many booleans like \`isLarge\`, \`isPrimary\`, \`isRounded\`) is a design smell. Prefer a single \`variant\`/\`size\` prop with a validator, or [slots](lesson:slots) for content.
- **Stable props help performance**: an inline object literal \`:options="{ a: 1 }"\` is a new object on every parent render, so the child sees a changed prop each time.
- **Deep chains** of components forwarding the same prop ("prop drilling") are a hint to use [provide/inject](lesson:provide-inject) or a [store](lesson:pinia-basics).
- With TypeScript, type-based declarations give editor autocompletion and compile-time checks; see [typing components](lesson:typing-components).
`,
  },

  mistakes: [
    {
      title: 'Writing to a prop in the child',
      wrong: { code: `const props = defineProps({ quantity: Number })\n\nfunction add() {\n  props.quantity++ // ⚠️ readonly — warns, nothing changes\n}`, lang: 'js' },
      right: { code: `const props = defineProps({ quantity: Number })\nconst emit = defineEmits(['update:quantity'])\n\nfunction add() {\n  emit('update:quantity', props.quantity + 1) // ask the owner\n}`, lang: 'js' },
      explanation: 'The parent owns the value. Ask it to change by emitting an event (or use `defineModel()`), or — if the prop is only a starting value — copy it into a local ref.',
    },
    {
      title: 'Forgetting the colon for non-string values',
      wrong: { code: `<ProductCard name="Mug" price="12" in-stock="false" />`, lang: 'vue' },
      right: { code: `<ProductCard name="Mug" :price="12" :in-stock="false" />`, lang: 'vue' },
      explanation: 'Without `:`, the value is always a string: `"12"`, and `"false"` (a non-empty string). Vue warns `Invalid prop: type check failed for prop "price". Expected Number with value 12, got String with value "12".`',
    },
    {
      title: 'A shared object as an object/array default',
      wrong: { code: `defineProps({\n  tags: { type: Array, default: [] },\n})`, lang: 'js' },
      right: { code: `defineProps({\n  tags: { type: Array, default: () => [] },\n})`, lang: 'js' },
      explanation: 'Object and array defaults must come from a **factory function**, so each instance gets its own fresh value. Vue warns if you pass the object directly.',
    },
    {
      title: 'Copying a prop and expecting it to stay in sync',
      wrong: { code: `const props = defineProps({ firstName: String })\nconst name = ref(props.firstName) // snapshot, never updates`, lang: 'js' },
      right: { code: `const props = defineProps({ firstName: String })\nconst name = computed(() => props.firstName.toUpperCase())`, lang: 'js' },
      explanation: '`ref(props.x)` copies the value **once**. That is right for "initial value" props, wrong for values that should follow the parent. For derived values use `computed`.',
    },
    {
      title: 'Passing a destructured prop straight into watch (3.5+)',
      wrong: { code: `const { price } = defineProps({ price: Number })\nwatch(price, (p) => console.log(p)) // compile error`, lang: 'js' },
      right: { code: `const { price } = defineProps({ price: Number })\nwatch(() => price, (p) => console.log(p))`, lang: 'js' },
      explanation: 'A destructured prop is compiled to `props.price` — a plain value at that moment. `watch` needs something reactive to track, so pass a getter. The same applies when passing it into a composable: pass `() => price`.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: Invalid prop: type check failed for prop "price". Expected Number … got String`.',
      cause: 'The parent passed a static attribute (`price="12"`), which is always a string.',
      fix: 'Bind it: `:price="12"` or `:price="item.price"`.',
    },
    {
      symptom: '`[Vue warn]: Missing required prop: "name"`.',
      cause: 'The parent did not pass a prop declared with `required: true` — often a typo or a renamed prop.',
      fix: 'Pass the prop, or give it a default and drop `required` if it is genuinely optional.',
    },
    {
      symptom: '`Set operation on key "x" failed: target is readonly` or `Attempting to mutate prop "x"`.',
      cause: 'The child assigns to a prop.',
      fix: 'Emit an event so the parent updates, use `defineModel()`, or copy into a local ref if it is a starting value.',
    },
    {
      symptom: 'The child keeps showing an old value after the parent changes it.',
      cause: 'The child copied the prop into a `ref()` at setup time, or destructured it in Vue < 3.5.',
      fix: 'Read `props.x` directly or derive with `computed`. On 3.5+, destructuring in `<script setup>` stays reactive.',
    },
    {
      symptom: 'A value you passed shows up as an HTML attribute on the child\'s root element instead of in its props.',
      cause: 'The child does not declare that prop (or the name differs), so Vue treats it as a fallthrough attribute.',
      fix: 'Declare it in `defineProps` with the matching name (camelCase in JS, kebab-case allowed in templates).',
    },
  ],

  bestPractices: [
    'Use the object syntax (or TypeScript types) so every prop has a type; mark essentials `required`.',
    'Give optional props sensible defaults; use factory functions for object and array defaults.',
    'Declare props in camelCase; write them in kebab-case in templates for an HTML-like feel (both work).',
    'Never mutate props — not even nested properties of object props. Emit events instead.',
    'Use `computed` for values derived from props, and a local `ref` only when the prop is an initial value.',
    'Prefer one `variant` prop with a validator over several mutually exclusive booleans.',
    'On Vue 3.5+, reactive props destructure is fine — just pass getters (`() => price`) to `watch` and composables.',
  ],

  useCases: [
    'Displaying data: a `ProductCard` receiving `name`, `price`, `image`.',
    'Configuring behaviour: `size="lg"`, `variant="danger"`, `:disabled="saving"`.',
    'Initial values for internal state: `:initial-page="1"` on a paginator.',
    'Passing lists: `:items="todos"` to a list component.',
    'Feature flags for a reusable widget: `:show-search="true"`, `:max-items="5"`.',
  ],

  whenToUse: {
    use: [
      'A parent needs to give a child data or configuration.',
      'The same component must render differently in different places.',
      'You want a documented, validated contract for a reusable component.',
    ],
    avoid: [
      'Passing the same prop through several layers that don\'t use it — consider provide/inject or a store.',
      'Passing large chunks of markup as strings — use slots.',
      'Using a prop as a two-way channel by mutating it — use events or `v-model`.',
    ],
  },

  comparison: {
    title: 'Props vs local state vs computed',
    headers: ['', 'Prop', 'Local state (`ref`)', '`computed`'],
    rows: [
      ['Who owns it?', 'the parent', 'this component', 'nobody — derived'],
      ['Who may change it?', 'only the parent', 'this component', 'changes when its sources change'],
      ['Updates when the parent changes?', 'yes', 'no (unless you watch)', 'yes, if derived from props'],
      ['Typical use', 'inputs & configuration', 'UI state, initial-value copies', 'formatting, filtering, totals'],
    ],
    note: 'If you are tempted to write to a prop, you probably want local state (it is a starting value) or an event (the parent should change it).',
  },

  quiz: [
    {
      id: 'props-q1',
      type: 'output',
      prompt: 'The child declares `defineProps({ count: Number })` and renders `{{ count + 1 }}`. What appears on screen (ignoring the console warning)?',
      code: { lang: 'vue', code: `<Counter count="5" />` },
      options: [
        { text: '6', why: 'That needs a number. Without `:`, the value is the string "5".' },
        { text: '51' },
        { text: 'NaN', why: 'String + number does not produce NaN in JavaScript — it concatenates.' },
        { text: 'Nothing — Vue refuses to render an invalid prop.', why: 'Type checks only warn in development; the value is still passed.' },
      ],
      answer: 1,
      explanation: 'A static attribute is a string, so `count` is `"5"` and `"5" + 1` is `"51"`. Vue warns about the type mismatch but still renders. Fix: `:count="5"`.',
    },
    {
      id: 'props-q2',
      type: 'mcq',
      prompt: 'A child component runs `props.title = \'New title\'`. What happens?',
      options: [
        { text: 'The parent\'s data changes to "New title".', why: 'Props are a one-way channel; the child cannot change the parent\'s state this way.' },
        { text: 'The assignment is rejected and Vue logs a warning in development; the title stays the same.' },
        { text: 'It works until the next render, then throws an error.', why: 'Vue does not throw here; it refuses the write on the read-only props object.' },
        { text: 'Vue automatically emits `update:title`.', why: 'Only `defineModel()` (or your own `emit`) sends update events.' },
      ],
      answer: 1,
      explanation: 'Props are read-only in the child. To request a change, emit an event and let the parent update its state.',
    },
    {
      id: 'props-q3',
      type: 'bug',
      prompt: 'Every `TagList` instance ends up sharing the same tags array when no `tags` prop is passed. Which line is the problem?',
      code: {
        lang: 'js',
        code: `const props = defineProps({
  title: { type: String, required: true },
  tags: { type: Array, default: [] },
  max: { type: Number, default: 10 },
})`,
      },
      answerLine: 3,
      explanation: 'Object and array defaults must be produced by a factory — `default: () => []` — so each instance gets a fresh array. Vue warns about this.',
    },
    {
      id: 'props-q4',
      type: 'fill',
      prompt: 'Complete the declaration: `status` is a required string, and `items` is an array that defaults to an empty array.',
      code: {
        lang: 'js',
        code: `defineProps({
  status: { type: String, ___: true },
  items: { type: Array, default: ___ },
})`,
      },
      answer: [['required'], ['() => []', '()=>[]', 'function () { return [] }']],
      explanation: '`required: true` makes Vue warn when it is missing; `default: () => []` gives each instance its own array.',
    },
    {
      id: 'props-q5',
      type: 'mcq',
      prompt: 'The child declares `defineProps({ disabled: Boolean })`. Which usage gives `disabled === true`?',
      options: [
        { text: '`<SaveButton />`', why: 'An absent Boolean prop is cast to `false`.' },
        { text: '`<SaveButton disabled />`' },
        { text: '`<SaveButton :disabled="\'false\'" />`', why: 'That passes the string "false" — not a boolean at all.' },
        { text: '`<SaveButton :disabled="undefined" />`', why: '`undefined` means "not provided", so Boolean casting gives `false`.' },
      ],
      answer: 1,
      explanation: 'Boolean props behave like HTML boolean attributes: present with no value → `true`, absent → `false`.',
    },
    {
      id: 'props-q6',
      type: 'mcq',
      prompt: 'Vue 3.5, `<script setup>`: `const { query } = defineProps({ query: String })`. Which line correctly runs a callback whenever `query` changes?',
      options: [
        { text: '`watch(query, fetchResults)`', why: 'The compiler rejects this: `query` would be passed as a plain string value, which `watch` cannot track.' },
        { text: '`watch(() => query, fetchResults)`' },
        { text: '`watch(ref(query), fetchResults)`', why: '`ref(query)` copies the current value once; the new ref never changes.' },
        { text: 'Destructured props can\'t be watched at all.', why: 'They can — through a getter, which the compiler turns into `() => props.query`.' },
      ],
      answer: 1,
      explanation: 'Destructured props compile to `props.query` *where they are accessed*. A getter delays the access until the watcher runs, so it is tracked.',
    },
    {
      id: 'props-q7',
      type: 'short',
      prompt: 'Explain one-way data flow in your own words, and say what a child should do when it needs a prop\'s value to change.',
      answer: 'Data flows from parent to child through props; only the owner (the parent) changes it, and the child re-renders with the new value. This keeps it obvious where state changes happen. If the child needs a change, it emits an event (or uses v-model/defineModel) and the parent updates its own state — or, if the prop was only a starting value, the child copies it into local state.',
    },
  ],

  exercises: [
    {
      id: 'star-rating',
      title: 'A validated StarRating component',
      difficulty: 'intermediate',
      prompt: `
Build \`StarRating.vue\`, a display-only rating component.

- Props: \`rating\` — a **required** \`Number\` with a validator that accepts only values from **0 to 10**; and \`max\` — a \`Number\` that defaults to **5**.
- Render exactly \`max\` elements with \`class="star"\`. The first \`rating\` of them also have the class \`filled\`.
- Render \`<span class="label">\` with the text \`rating / max\`, e.g. **3 / 5**.
- It must update when the parent passes a new \`rating\`.

\`App.vue\` already uses it.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'

const score = ref(3)
</script>

<template>
  <StarRating :rating="score" />
  <button class="up" @click="score++">Better</button>
</template>`,
        'StarRating.vue': `<script setup>
// TODO: declare rating (required Number, validated) and max (Number, default 5)
</script>

<template>
  <div class="stars">
    <!-- TODO: max stars, the first \`rating\` of them filled -->
    <span class="label">? / ?</span>
  </div>
</template>`,
      },
      hints: [
        'Declare `rating: { type: Number, required: true, validator: (v) => v >= 0 && v <= 10 }` and `max: { type: Number, default: 5 }`.',
        '`v-for="n in max"` loops from 1 to `max`. A star is filled when `n <= rating`.',
        '`<span v-for="n in max" :key="n" class="star" :class="{ filled: n <= rating }">★</span>` and `<span class="label">{{ rating }} / {{ max }}</span>`.',
      ],
      solution: {
        explanation: 'The component owns no state at all: everything on screen is derived from its props, so it re-renders whenever the parent changes `rating`. The default makes `max` optional, and the validator documents (and warns about, in development) out-of-range values.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'

const score = ref(3)
</script>

<template>
  <StarRating :rating="score" />
  <button class="up" @click="score++">Better</button>
</template>`,
          'StarRating.vue': `<script setup>
defineProps({
  rating: {
    type: Number,
    required: true,
    validator: (value) => value >= 0 && value <= 10,
  },
  max: { type: Number, default: 5 },
})
</script>

<template>
  <div class="stars">
    <span
      v-for="n in max"
      :key="n"
      class="star"
      :class="{ filled: n <= rating }"
    >★</span>
    <span class="label">{{ rating }} / {{ max }}</span>
  </div>
</template>

<style scoped>
.star { color: #ccc; font-size: 1.4rem; }
.star.filled { color: #f5b301; }
.label { margin-left: 8px; }
</style>`,
        },
      },
      tests: [
        {
          name: 'renders max (default 5) stars with rating of them filled',
          code: `const c = mountFile('StarRating.vue', { rating: 3 })
expect(c.el.querySelectorAll('.star')).toHaveLength(5)
expect(c.el.querySelectorAll('.star.filled')).toHaveLength(3)
expect(c.find('.label').textContent.trim()).toBe('3 / 5')`,
        },
        {
          name: 'respects a custom max',
          code: `const c = mountFile('StarRating.vue', { rating: 7, max: 10 })
expect(c.el.querySelectorAll('.star')).toHaveLength(10)
expect(c.el.querySelectorAll('.star.filled')).toHaveLength(7)
expect(c.find('.label').textContent.trim()).toBe('7 / 10')`,
        },
        {
          name: 'updates when the parent changes the rating',
          code: `await click('.up')
expect(text('.label')).toBe('4 / 5')
expect(findAll('.star.filled')).toHaveLength(4)`,
        },
      ],
    },
    {
      id: 'stale-badge',
      title: 'Fix the badge that never updates',
      difficulty: 'intermediate',
      prompt: `
\`UserBadge.vue\` receives \`firstName\` and \`lastName\` props and shows the full name in \`.full-name\` and the initials in \`.initials\`. But when the parent clicks **Switch user** (\`.rename\`), the badge keeps showing Ada Lovelace.

Fix \`UserBadge.vue\` so that both \`.full-name\` and \`.initials\` always reflect the current props. Don't change \`App.vue\`.

- Ada Lovelace → \`.full-name\` **Ada Lovelace**, \`.initials\` **AL**
- after switching → **Grace Hopper**, **GH**
`,
      files: {
        'App.vue': staleBadgeApp,
        'UserBadge.vue': `<script setup>
import { ref } from 'vue'

const props = defineProps({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
})

// Copied once, when the badge is created…
const fullName = ref(props.firstName + ' ' + props.lastName)
const initials = ref(props.firstName[0] + props.lastName[0])
</script>

<template>
  <div class="badge">
    <span class="initials">{{ initials }}</span>
    <span class="full-name">{{ fullName }}</span>
  </div>
</template>`,
      },
      hints: [
        '`ref(props.firstName + …)` takes a snapshot at setup time. Nothing re-runs that line later.',
        'You want values *derived* from props that recalculate when the props change. Which API does that?',
        'Replace both refs with `computed(() => props.firstName + \' \' + props.lastName)` and `computed(() => props.firstName[0] + props.lastName[0])`.',
      ],
      solution: {
        explanation: '`computed` reads `props.firstName` and `props.lastName` inside its getter, so Vue tracks them and recalculates when the parent passes new values. The original refs copied the values once — correct for "initial value" props, wrong for values that should follow the parent.',
        files: {
          'App.vue': staleBadgeApp,
          'UserBadge.vue': `<script setup>
import { computed } from 'vue'

const props = defineProps({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
})

const fullName = computed(() => props.firstName + ' ' + props.lastName)
const initials = computed(() => props.firstName[0] + props.lastName[0])
</script>

<template>
  <div class="badge">
    <span class="initials">{{ initials }}</span>
    <span class="full-name">{{ fullName }}</span>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'shows the initial user', code: `expect(text('.full-name')).toBe('Ada Lovelace'); expect(text('.initials')).toBe('AL')` },
        { name: 'follows the parent after Switch user', code: `await click('.rename'); expect(text('.full-name')).toBe('Grace Hopper'); expect(text('.initials')).toBe('GH')` },
        {
          name: 'works for any props passed directly',
          code: `const b = mountFile('UserBadge.vue', { firstName: 'Alan', lastName: 'Turing' })
await b.setProps({ firstName: 'Katherine', lastName: 'Johnson' })
expect(b.find('.full-name').textContent.trim()).toBe('Katherine Johnson')
expect(b.find('.initials').textContent.trim()).toBe('KJ')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'props-one-way-flow',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What are props, and what does "one-way data flow" mean in Vue?',
      answer: 'Props are a component\'s declared inputs, passed by the parent as attributes. One-way data flow means data moves from parent to child only: when the parent\'s state changes, the child receives the new props and re-renders, but the child must not modify its props. To request a change it emits an event.',
      explanation: 'The owner of a piece of state is the only one who changes it, which makes data changes easy to trace.',
      whyAsked: 'Fundamental to every Vue codebase; the follow-ups reveal whether you know what to do instead of mutating props.',
      mistakes: ['Saying props are two-way bound.', 'Not mentioning what to do instead (emit / local copy / computed).', 'Thinking nested object mutation is fine because Vue doesn\'t warn.'],
      followUps: ['What happens if a child mutates a prop?', 'How do you implement two-way binding on a component?', 'What if the prop is an object?'],
      modelAnswer: 'Props are the inputs a component declares with `defineProps` and the parent passes as attributes. Vue enforces one-way flow: parent state goes down as props, and when it changes the child re-renders automatically. The child treats props as read-only — Vue warns in development if you assign to one. If the child needs a change, it emits an event and the parent updates its own state; if the prop was just a starting value, the child copies it into a local ref; if it needs a transformed version, it uses a computed.',
    },
    {
      id: 'props-need-to-edit',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A `QuantityPicker` child receives `quantity` as a prop, and its +/− buttons need to change it. A junior dev wrote `props.quantity++`. What are your options and which do you pick?',
      answer: 'Options: (1) emit an event (`update:quantity` or `change`) and let the parent update its state; (2) use component `v-model` via `defineModel()` (3.4+), which wraps that pattern; (3) if the parent only provides a starting value, copy it into a local ref (`initialQuantity` → `ref`). For a controlled picker whose value the parent cares about, `defineModel()` (or the emit pattern) is the right choice.',
      explanation: 'Decide who owns the value. If the parent needs it, the parent owns it and the child requests changes.',
      whyAsked: 'Very common real situation; shows whether you understand ownership rather than memorising "don\'t mutate props".',
      mistakes: ['Suggesting `toRef(props, \'quantity\')` and mutating it — still a prop mutation.', 'Copying into a ref but expecting the parent to see changes.', 'Using a global store for a simple local interaction.'],
      followUps: ['How does `defineModel()` work under the hood?', 'What if the parent sometimes doesn\'t pass the prop?'],
      modelAnswer: 'First I decide who owns the quantity. In a cart, the parent does, so the child should request changes: emit `update:quantity` with the new value, or more simply declare `const quantity = defineModel(\'quantity\')` in Vue 3.4+ and let the parent use `v-model:quantity`. If the parent only supplied a starting number and doesn\'t care afterwards, I\'d rename the prop to `initialQuantity` and copy it into a local ref. Mutating the prop is never the answer.',
    },
    {
      id: 'props-nested-mutation',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A child receives `:user="user"` and runs `props.user.name = nameInput.value` on save. There is no warning, and the parent updates. Why does this "work", and why is it still a problem?',
      code: {
        lang: 'js',
        code: `const props = defineProps({ user: Object })
function save() {
  props.user.name = nameInput.value   // no warning!
}`,
      },
      answer: 'Props are only shallowly read-only: the props object can\'t be reassigned, but the object it points to is the parent\'s reactive object, passed by reference. Mutating it changes the parent\'s state behind its back. It breaks one-way flow: state changes can now come from any descendant, which is hard to trace and test, and the parent can\'t validate or react to the change. Emit an event with the new data (or a copy) and let the parent apply it.',
      explanation: 'The child holds a reference to the parent\'s object. Vue\'s readonly wrapper is shallow, so nested writes aren\'t blocked.',
      whyAsked: 'Tests understanding of reference semantics and the real reason behind one-way flow — a frequent source of mystery bugs.',
      mistakes: ['Saying it\'s fine because Vue didn\'t complain.', 'Fixing it with `JSON.parse(JSON.stringify())` everywhere without understanding ownership.', 'Not knowing the readonly protection is shallow.'],
      followUps: ['How would you edit a copy and emit it on save?', 'What about `defineModel()` with an object value?'],
      modelAnswer: 'It works because objects are passed by reference and Vue\'s props protection is shallow — I can\'t reassign `props.user`, but I can write into the parent\'s reactive object. That silently changes parent state from a child, so data can be modified from anywhere and you lose a single place where changes happen. For an edit form I\'d copy the user into local state, let the user edit the copy, and emit `save` with the updated object; the parent then decides how to apply it.',
    },
    {
      id: 'props-validation-prod',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'A component declares `status: { type: String, validator: v => [\'open\', \'closed\'].includes(v) }`. In a **production build**, a parent passes `status="archived"`. What happens?',
      options: [
        'Vue throws and the component does not render',
        'Vue logs a warning and renders with status = undefined',
        'Nothing is logged; the component renders with status = "archived"',
        'Vue silently replaces it with the first allowed value',
      ],
      correctOption: 2,
      answer: 'Nothing is logged and the component receives `"archived"`. Prop type checks and validators run only in development builds; even there they only warn.',
      explanation: 'Validation is a development aid. It never blocks or changes values, and production builds skip it.',
      whyAsked: 'Checks whether candidates mistakenly rely on prop validation for runtime safety.',
      mistakes: ['Believing validators enforce values.', 'Using prop validation as input sanitisation or security.'],
      followUps: ['How would you handle an unknown status gracefully at runtime?', 'Where must real data validation happen?'],
      modelAnswer: 'In production nothing happens: prop types and validators are development-only, and even in development they only warn. The component renders with "archived". If unknown values are possible at runtime, I handle them explicitly — a computed that maps unknown statuses to a fallback — and real data validation belongs on the server.',
    },
    {
      id: 'props-reactive-destructure',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does reactive props destructure in Vue 3.5 keep destructured props reactive, and what are its pitfalls?',
      answer: 'It is a compile-time transform: in `<script setup>`, `const { count = 0 } = defineProps(...)` moves the default into the props declaration and rewrites every later access to `count` into `__props.count`. Pitfalls: passing a destructured prop to `watch` or a composable passes its current value, so you must wrap it in a getter (`() => count`) — the compiler errors for `watch(count)`; and before 3.5 the same code loses reactivity.',
      explanation: 'The variable looks plain but each use is rewritten into a property access on the reactive props object.',
      code: {
        lang: 'js',
        code: `// you write (3.5+)
const { count = 0 } = defineProps({ count: Number })
const doubled = computed(() => count * 2)
useLogger(() => count)

// roughly what the compiler emits
const __props = defineProps({ count: { type: Number, default: 0 } })
const doubled = computed(() => __props.count * 2)
useLogger(() => __props.count)`,
      },
      whyAsked: 'A recent feature; probes whether you understand compiler macros versus runtime reactivity.',
      mistakes: ['Thinking it works at runtime via proxies.', 'Not knowing the version requirement.', 'Passing the destructured variable into composables directly.'],
      followUps: ['How should a composable accept such a value? (`toValue()`)', 'Why didn\'t destructuring work before 3.5?'],
      modelAnswer: 'It\'s a compiler feature, not runtime magic. Inside `<script setup>`, Vue 3.5 rewrites every access of a destructured prop to `__props.name`, and JS default values become prop defaults. So computeds and templates stay reactive. The catch: at the point you pass it to a function you\'re passing a value, so `watch` needs `() => count` and composables should accept getters and normalise them with `toValue()`. Before 3.5, destructuring copied values and lost reactivity.',
    },
    {
      id: 'props-boolean-explosion',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 3,
      question: 'A `BaseButton` has grown props `primary`, `secondary`, `danger`, `small`, `large`, `outline`. What problems does this cause, and how would you redesign it?',
      answer: 'Mutually exclusive booleans allow impossible combinations (`primary` + `danger`, `small` + `large`) and make the API harder to learn. Replace them with enumerated props validated against a list: `variant: \'primary\' | \'secondary\' | \'danger\'`, `size: \'sm\' | \'md\' | \'lg\'`, and maybe `outline` as a single boolean. Defaults cover the common case.',
      explanation: 'One prop per dimension, with a fixed set of allowed values, models the real choices.',
      code: {
        lang: 'js',
        code: `defineProps({
  variant: { type: String, default: 'primary', validator: (v) => ['primary', 'secondary', 'danger'].includes(v) },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  outline: Boolean,
})`,
      },
      whyAsked: 'Component API design is a key skill for design-system and senior roles.',
      mistakes: ['Adding more booleans.', 'Using free-form strings without validation or documentation.'],
      followUps: ['How would TypeScript help here?', 'When would you use slots instead of props?'],
      modelAnswer: 'Six booleans encode two real choices — variant and size — and allow nonsense like `small` plus `large`. I\'d group them: `variant` with a validator for primary/secondary/danger, `size` for sm/md/lg, both with defaults, plus a single `outline` boolean if it\'s independent. In TypeScript I\'d type them as string unions for autocompletion. The API becomes smaller, self-documenting and impossible to misuse.',
    },
    {
      id: 'props-coding-progress',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `ProgressBar.vue`: props `value` (required `Number`) and `max` (`Number`, default 100). Render `<div class="bar">` whose inline `width` style is the percentage, and `<span class="label">` with the rounded percentage, e.g. `40%`. Clamp the result between 0% and 100%.',
      starter: {
        files: {
          'App.vue': `<script setup>
import ProgressBar from './ProgressBar.vue'
</script>

<template>
  <ProgressBar :value="40" />
</template>`,
          'ProgressBar.vue': `<script setup>
// TODO
</script>

<template>
  <div class="track">
    <div class="bar"></div>
  </div>
  <span class="label"></span>
</template>`,
        },
      },
      tests: [
        {
          name: '40 of 100 → 40%',
          code: `const p = mountFile('ProgressBar.vue', { value: 40 })
expect(p.find('.label').textContent.trim()).toBe('40%')
expect(p.find('.bar').style.width).toBe('40%')`,
        },
        {
          name: 'uses max: 50 of 200 → 25%',
          code: `const p = mountFile('ProgressBar.vue', { value: 50, max: 200 })
expect(p.find('.label').textContent.trim()).toBe('25%')`,
        },
        {
          name: 'clamps to 0–100%',
          code: `const p = mountFile('ProgressBar.vue', { value: 150 })
expect(p.find('.label').textContent.trim()).toBe('100%')
await p.setProps({ value: -10 })
expect(p.find('.label').textContent.trim()).toBe('0%')`,
        },
      ],
      hints: ['Declare both props with `defineProps`, giving `max` a default.', 'A `computed` can calculate `Math.round(Math.min(100, Math.max(0, value / max * 100)))`.', 'Bind the style with `:style="{ width: percent + \'%\' }"`.'],
      answer: 'Declare `value` and `max`, derive a clamped `percent` with `computed`, and bind it to both the inline width and the label.',
      solution: {
        files: {
          'App.vue': `<script setup>
import ProgressBar from './ProgressBar.vue'
</script>

<template>
  <ProgressBar :value="40" />
</template>`,
          'ProgressBar.vue': `<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },
  max: { type: Number, default: 100 },
})

const percent = computed(() => {
  const raw = (props.value / props.max) * 100
  return Math.round(Math.min(100, Math.max(0, raw)))
})
</script>

<template>
  <div class="track">
    <div class="bar" :style="{ width: percent + '%' }"></div>
  </div>
  <span class="label">{{ percent }}%</span>
</template>`,
        },
      },
      explanation: 'All output is derived from props through one computed, so it stays correct whenever the parent changes `value` or `max`.',
      whyAsked: 'Checks prop declaration, defaults, derived state and style binding in one small task.',
      mistakes: ['Storing the percentage in a ref initialised once.', 'Forgetting to clamp.', 'Not giving `max` a default.'],
      followUps: ['How would you make it accessible (`role="progressbar"`, `aria-valuenow`)?', 'How would you validate that `max > 0`?'],
      modelAnswer: 'I declare `value` as a required number and `max` with a default of 100. A computed turns them into a clamped, rounded percentage, and I bind it to the bar\'s inline width and the label. Because it\'s a computed over props, it updates whenever the parent changes either prop. For accessibility I\'d add `role="progressbar"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`.',
    },
  ],

  takeaways: [
    'Props are a component\'s inputs: declared with `defineProps()`, passed by the parent as attributes.',
    'Use `:` for anything that is not a plain string — numbers, booleans, arrays, objects, variables.',
    'Declare `type`, `required`, `default` (factories for objects/arrays) and `validator` — but remember validation only warns, and only in development.',
    'Data flows one way: the parent changes it, the child re-renders. Never write to props (not even nested fields).',
    'Initial value → copy into a local `ref`; derived value → `computed`; parent must change → emit an event.',
    'Vue 3.5+ keeps destructured props reactive; pass getters (`() => prop`) to `watch` and composables.',
  ],
}
