// Lesson: Custom events with emits

const emitsApp = `<script setup>
import { ref } from 'vue'
import ProductCard from './ProductCard.vue'

const products = [
  { id: 'mug', name: 'Ceramic Mug', price: 12 },
  { id: 'pad', name: 'Notebook', price: 8 },
]
const cart = ref([])

function addToCart(productId) {
  cart.value.push(productId)
}
</script>

<template>
  <p class="cart">Cart: {{ cart.length }} item(s)</p>
  <ProductCard
    v-for="p in products"
    :key="p.id"
    :product-id="p.id"
    :name="p.name"
    :price="p.price"
    @add-to-cart="addToCart"
  />
</template>`

const emitsCard = `<script setup>
import { ref } from 'vue'

const props = defineProps({
  productId: { type: String, required: true },
  name: String,
  price: Number,
})

const emit = defineEmits(['add-to-cart'])

const qty = ref(1)

function add() {
  emit('add-to-cart', props.productId)
}
</script>

<template>
  <article class="product-card">
    <h3>{{ name }}</h3>
    <p>\${{ price }}</p>
    <div class="row">
      <span class="qty">{{ qty }}</span>
      <button class="more" @click="qty++">+</button>
      <button class="add" @click="add">Add to cart</button>
    </div>
  </article>
</template>

<style scoped>
.product-card { border: 2px solid #222; border-radius: 10px; padding: 8px 14px; margin: 10px 0; max-width: 280px; }
.row { display: flex; gap: 8px; align-items: center; }
.qty { min-width: 1.5em; text-align: center; font-weight: bold; }
</style>`

const todoApp = `<script setup>
import { ref } from 'vue'
import TodoItem from './TodoItem.vue'

const todos = ref([
  { id: 1, text: 'Buy milk', done: false },
  { id: 2, text: 'Write the report', done: false },
  { id: 3, text: 'Call grandma', done: true },
])

function toggleTodo(id) {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) todo.done = !todo.done
}

function removeTodo(id) {
  todos.value = todos.value.filter((t) => t.id !== id)
}
</script>

<template>
  <ul class="todos">
    <TodoItem
      v-for="todo in todos"
      :key="todo.id"
      :todo="todo"
      @toggle="toggleTodo"
      @remove="removeTodo"
    />
  </ul>
  <p class="left">{{ todos.filter((t) => !t.done).length }} left</p>
</template>`

export default {
  id: 'emits',
  title: 'Custom events with emits',
  summary: 'Let a child tell its parent that something happened — with defineEmits, payloads and listeners — and learn how component events differ from native DOM events.',
  difficulty: 'intermediate',
  minutes: 30,
  prerequisites: ['props'],
  related: ['component-v-model', 'v-on-events', 'fallthrough-attrs', 'component-communication', 'provide-inject'],
  tags: ['emits', 'defineEmits', '$emit', 'custom events', 'payload', 'events up', 'event validation', 'native events', 'bubbling'],
  apis: [
    { name: 'defineEmits()', summary: 'Compiler macro in `<script setup>` that declares the events a component can emit and returns the `emit` function.' },
    { name: '$emit()', summary: 'Emits a component event directly from the template: `$emit(\'close\')`.' },
    { name: 'emits option', summary: 'Options API equivalent of `defineEmits`: `emits: [\'close\']`, then `this.$emit(\'close\')`.' },
  ],
  docs: [
    { label: 'Vue Guide — Component Events', url: 'https://vuejs.org/guide/components/events.html' },
    { label: 'API — defineProps() & defineEmits()', url: 'https://vuejs.org/api/sfc-script-setup.html#defineprops-defineemits' },
    { label: 'API — emits option', url: 'https://vuejs.org/api/options-state.html#emits' },
  ],

  intro: `
Props carry data **down** from parent to child. But a child often needs to say something back **up**: "the user clicked *Add to cart*", "this todo was ticked", "please close me".

That's what **custom events** are for. The child **emits** an event with a name and, optionally, a **payload** (extra data). The parent **listens** with \`@event-name\` — exactly like listening to a button's \`@click\` — and decides what to do.

Together they form Vue's core communication contract: **props down, events up**.
`,

  why: `
In the [props](lesson:props) lesson you learned that a child must never change the data it receives. So how does a product card add something to a cart the parent owns?

It doesn't — it **asks**. The card announces "\`add-to-cart\`, product \`mug\`" and the parent, the owner of the cart, updates its own state. Then the new data flows back down as props.

This keeps every component honest:

- The **card** doesn't know (or care) where the cart lives — it works in a shop page, a wishlist page or a test.
- The **parent** stays the single place where the cart changes, so bugs are easy to trace.
- The card's **public API** is visible at a glance: these props in, these events out.
`,

  eli15: `
Imagine a classroom. The teacher (the parent) hands out worksheets (props). A student (the child) can't walk up and change the grade book — that belongs to the teacher.

Instead, the student **raises a hand** and says "I'm finished, here's my answer: 42". That raised hand is an **event**, and "42" is the **payload**. The teacher hears it and decides what to do with it — maybe writes it in the grade book.

Two important details:

- The student only talks to **their own teacher**. The principal down the hall doesn't hear the raised hand (component events don't "bubble" up to grandparents).
- The teacher can decide to ignore raised hands entirely by not listening — the student still raised their hand; nothing breaks.
`,

  analogy: {
    title: 'The raised hand in class',
    body: `
A student finishes a task and raises their hand with an answer. The teacher, who owns the grade book, listens and records it. The student never touches the grade book themselves.

The class has a rule sheet listing which kinds of hand-raises are allowed — "finished", "question", "need help" — so everyone knows what to expect.
`,
    mapping: [
      ['the student', 'the child component'],
      ['raising a hand', '`emit(\'finished\')`'],
      ['the answer they call out', 'the event payload: `emit(\'finished\', 42)`'],
      ['the teacher listening', 'the parent\'s `@finished="record"` listener'],
      ['the grade book', 'state owned by the parent'],
      ['the rule sheet of allowed hand-raises', '`defineEmits([\'finished\', \'question\'])`'],
      ['the principal down the hall can\'t hear', 'component events don\'t bubble past the direct parent'],
    ],
  },

  visual: {
    type: 'component-flow',
    props: { mode: 'emits' },
    title: 'Events flow up',
    caption: 'The child emits an event with a payload; it travels **up** to the parent\'s listener, the parent updates its own state, and the new value flows back **down** as a prop. Click a component to see its code.',
    alt: 'An animated diagram: a child component sends an event packet with a payload up an arrow to its parent. The parent updates its state, and a prop packet travels back down to the child, closing the loop.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Component events vs native DOM events',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'grand', label: 'ShopPage', note: 'grandparent', x: 190, y: 50 },
        { id: 'parent', label: 'ProductList', note: 'parent', x: 190, y: 160 },
        { id: 'child', label: 'ProductCard', note: 'emit(\'add-to-cart\')', tone: 'acid', x: 190, y: 270 },
        { id: 'dgrand', label: '<main>', note: 'DOM ancestor', x: 570, y: 50 },
        { id: 'dparent', label: '<section>', note: 'DOM parent', x: 570, y: 160 },
        { id: 'dchild', label: '<button>', note: 'native click', tone: 'cobalt', x: 570, y: 270 },
      ],
      edges: [
        { from: 'child', to: 'parent', label: 'heard by @add-to-cart' },
        { from: 'parent', to: 'grand', label: 'only if re-emitted', dashed: true },
        { from: 'dchild', to: 'dparent', label: 'bubbles' },
        { from: 'dparent', to: 'dgrand', label: 'bubbles' },
      ],
      steps: [
        { focus: ['child'], text: 'The card calls `emit(\'add-to-cart\', \'mug\')`. This is **not** a DOM event — it is a direct call to a listener function the parent handed over.' },
        { focus: ['child', 'parent'], edges: ['child->parent'], text: 'Only the **direct parent** that wrote `@add-to-cart` on `<ProductCard>` hears it. The listener runs **synchronously**, before `emit()` returns.' },
        { focus: ['grand'], edges: ['parent->grand'], text: 'The grandparent hears **nothing** unless `ProductList` listens and emits again. Component events **do not bubble**.' },
        { focus: ['dchild', 'dparent', 'dgrand'], edges: ['dchild->dparent', 'dparent->dgrand'], text: 'Native DOM events are different: a real `click` on a `<button>` **bubbles** up through every ancestor element, and any of them can listen.' },
        { focus: ['parent', 'grand'], text: 'Need to reach a distant ancestor or a sibling? Re-emit at each level for one or two hops; beyond that use [provide/inject](lesson:provide-inject) or a [store](lesson:pinia-basics).' },
      ],
    },
    caption: 'Why a grandparent never hears a grandchild\'s custom event — and how native DOM events behave differently.',
    alt: 'Two columns. Left: a component chain ShopPage, ProductList, ProductCard; an arrow from ProductCard to ProductList is labelled "heard by @add-to-cart", and a dashed arrow up to ShopPage says "only if re-emitted". Right: a DOM chain main, section, button; solid arrows labelled "bubbles" go all the way up.',
  },

  syntax: [
    `
**1. Declare** the events with the \`defineEmits()\` macro (no import, top level of \`<script setup>\`). It returns the \`emit\` function:
`,
    {
      code: `<script setup>
const props = defineProps({ productId: String })
const emit = defineEmits(['add-to-cart', 'remove'])

function add(qty) {
  emit('add-to-cart', props.productId, qty)   // name, then any payload arguments
}
</script>

<template>
  <button @click="add(1)">Add</button>
  <!-- in the template you can also use $emit directly -->
  <button @click="$emit('remove', productId)">Remove</button>
</template>`,
      lang: 'vue',
      title: 'ProductCard.vue — emitting',
    },
    `
**2. Listen** in the parent with \`v-on\` / \`@\`. The payload arrives as the handler's arguments:
`,
    {
      code: `<!-- method reference: receives every payload argument, addToCart(productId, qty) -->
<!-- inline arrow: name the arguments yourself -->
<ProductCard
  product-id="mug"
  @add-to-cart="addToCart"
  @remove="(id) => cart.delete(id)"
/>

<!-- inline statement: $event is the FIRST payload argument -->
<ProductCard product-id="mug" @remove="lastRemoved = $event" />

<!-- .once: the listener runs at most once -->
<NewsletterBox @subscribe.once="thankUser" />`,
      lang: 'vue',
      title: 'Parent — listening',
    },
    `
**3. Validate** payloads (optional) with the object syntax. Each validator receives the payload and returns \`true\`/\`false\`; a \`false\` only logs a warning in development:
`,
    {
      code: `const emit = defineEmits({
  // no validation
  remove: null,
  // validate the payload
  'add-to-cart': (productId, qty) => typeof productId === 'string' && qty > 0,
})`,
      lang: 'js',
      title: 'object syntax with validation',
    },
    `
**The rules:**

1. **Always declare** the events a component emits. It documents the API, keeps those listeners out of [\`$attrs\`](lesson:fallthrough-attrs), and enables dev warnings.
2. Event names are case-converted like props: emit \`'addToCart'\` or \`'add-to-cart'\`, listen with \`@add-to-cart\` (kebab-case is the convention in templates).
3. Component events **don't bubble**. Only the direct parent's listener is called.
4. \`emit()\` is **synchronous** and returns nothing useful — the parent's handler runs immediately, but its return value is ignored.
5. \`defineEmits\` must be called at the top level of \`<script setup>\` — not inside a function or an \`if\`.
`,
    {
      code: `// Options API / setup() function
export default {
  emits: ['add-to-cart'],
  setup(props, { emit }) {
    const add = () => emit('add-to-cart', props.productId)
    return { add }
  },
  // or, in methods: this.$emit('add-to-cart', this.productId)
}`,
      lang: 'js',
      title: 'without <script setup>',
    },
    {
      code: `// TypeScript (reference only — the playground runs plain JS)
const emit = defineEmits<{
  'add-to-cart': [productId: string, qty: number]   // 3.3+ named-tuple syntax
  remove: [productId: string]
}>()`,
      lang: 'ts',
      static: true,
      title: 'type-based declaration',
    },
  ],

  walkthrough: {
    title: 'ProductCard.vue',
    lang: 'vue',
    code: emitsCard,
    intro: 'The child side of the playground. Notice it never touches the cart — it only announces what happened.',
    steps: [
      { lines: [4, 8], text: 'Props in: which product this card represents. The card receives data, it doesn\'t own the cart.' },
      { lines: [10], text: '`defineEmits([\'add-to-cart\'])` declares the event and returns `emit`. Anyone reading the file now knows this card can announce `add-to-cart`.' },
      { lines: [12], text: 'Local state the card owns: how many the shopper wants. (Right now it is never sent — experiment 1 fixes that.)' },
      { lines: [14, 16], text: '`emit(\'add-to-cart\', props.productId)` calls the parent\'s listener synchronously with the product id as the payload.' },
      { lines: [26], text: 'The button just calls `add()`. The click is a native DOM event; `add()` turns it into a meaningful *component* event with data.' },
    ],
  },

  playground: {
    title: 'Add to cart, the Vue way',
    objective: 'Send events with payloads from a child to its parent, and see how native clicks differ from component events.',
    files: { 'App.vue': emitsApp, 'ProductCard.vue': emitsCard },
    expected: 'A cart counter and two product cards. **Add to cart** increases the counter by one. The **+** button changes the quantity shown on the card, but the cart ignores it — for now.',
    experiments: [
      {
        id: 'qty-payload',
        task: 'Make the quantity count. Emit `qty` as a **second payload argument**, and change `addToCart(productId, qty)` in `App.vue` to add that many items. Setting the mug to 3 and clicking **Add to cart** should show **Cart: 3 item(s)**.',
        hint: 'Child: `emit(\'add-to-cart\', props.productId, qty.value)`. Parent: `for (let i = 0; i < qty; i++) cart.value.push(productId)`.',
        tests: [
          {
            name: 'the card emits the product id and quantity',
            code: `const card = mountFile('ProductCard.vue', { productId: 'lamp', name: 'Lamp', price: 30 })
await click(card.find('.more'))
await click(card.find('.add'))
expect(card.emitted('add-to-cart')[0]).toEqual(['lamp', 2])`,
          },
          {
            name: 'the parent adds that many items',
            code: `await click(findAll('.more')[0])
await click(findAll('.more')[0])
await click(findAll('.add')[0])
expect(text('.cart')).toBe('Cart: 3 item(s)')`,
          },
        ],
        explain: 'A handler receives every payload argument in order. `@add-to-cart="addToCart"` passes them all through; the card decides *what* to report, the parent decides *what to do* with it.',
      },
      {
        id: 'remove-event',
        task: 'Add a second event. Give the card a `<button class="remove">Remove</button>` that emits `remove-from-cart` with the product id, **declare** it in `defineEmits`, and in `App.vue` listen with `@remove-from-cart` to remove **one** matching item from the cart.',
        hint: 'Parent: `const i = cart.value.indexOf(productId); if (i !== -1) cart.value.splice(i, 1)`.',
        tests: [
          {
            name: 'the card declares and emits remove-from-cart',
            code: `const card = mountFile('ProductCard.vue', { productId: 'lamp', name: 'Lamp', price: 30 })
await click(card.find('.remove'))
expect(card.emitted('remove-from-cart')).toEqual([['lamp']])`,
          },
          {
            name: 'the parent removes one item',
            code: `await click(findAll('.add')[0])
await click(findAll('.add')[1])
const before = text('.cart')
await click(findAll('.remove')[0])
expect(text('.cart')).not.toBe(before)
expect(text('.cart')).toMatch(/Cart: \\d+ item/)`,
          },
        ],
        explain: 'The test helper only records **declared** events — just like real tooling relies on declarations. Each new event becomes part of the card\'s documented public API.',
      },
      {
        id: 'validate-payload',
        task: 'Switch `defineEmits` to the **object syntax** with a validator: `\'add-to-cart\': (id, qty) => qty > 0`. Then change the card\'s `qty` to start at `0`, click **Add to cart** and read the console.',
        hint: 'Keep `remove-from-cart: null` (no validation) if you did the previous experiment.',
        explain: 'You get `Invalid event arguments: event validation failed for event "add-to-cart"` — but the event is still delivered. Like prop validation, emit validation is a development-time warning, not a guard. Put real rules in code (for example, disable the button when `qty === 0`).',
      },
      {
        id: 'native-click',
        task: 'Track which card was viewed: in `App.vue` add `const lastViewed = ref(\'\')`, put `@click="lastViewed = p.name"` on `<ProductCard>`, and show `<p class="viewed">Last viewed: {{ lastViewed }}</p>`. Click a card\'s **title** (not a button).',
        hint: '`ProductCard` does not declare a `click` event, so this listener falls through to its root `<article>` as a native DOM listener.',
        tests: [
          {
            name: 'clicking anywhere in a card records it',
            code: `await click(findAll('.product-card h3')[1])
expect(text('.viewed')).toContain('Notebook')`,
          },
        ],
        explain: 'Because `click` is not in `defineEmits`, Vue treats `@click` as a [fallthrough attribute](lesson:fallthrough-attrs) and attaches a **native** listener to the card\'s root element. Native events bubble, so a click on the `<h3>` reaches the `<article>`. Had the card declared `click` in `defineEmits`, this listener would only respond to `emit(\'click\')`.',
      },
    ],
  },

  internals: {
    beginner: `
When the parent writes \`@add-to-cart="addToCart"\`, Vue quietly hands the child an extra prop named \`onAddToCart\` holding the parent's function. Calling \`emit('add-to-cart', 'mug')\` simply looks up that function and calls it with \`'mug'\`. No DOM, no bubbling — it's a function call.
`,
    technical: [
      `
Listeners on a component tag compile to \`on\`-prefixed vnode props. \`emit\` normalises the event name and calls the matching handler synchronously:
`,
      {
        code: `// Parent template compiles to something like:
h(ProductCard, { productId: 'mug', onAddToCart: addToCart })

// Simplified model of emit() — not the real source
function emit(instance, event, ...args) {
  const props = instance.vnode.props || {}
  if (__DEV__) validateEmit(instance, event, args)       // warnings only

  const handler =
    props[toHandlerKey(event)] ||                         // 'onAdd-to-cart'
    props[toHandlerKey(camelize(event))]                  // 'onAddToCart'
  if (handler) callWithAsyncErrorHandling(handler, instance, args)

  const onceHandler = props[toHandlerKey(camelize(event)) + 'Once']   // @add-to-cart.once
  if (onceHandler && !instance.emitted?.[event]) {
    (instance.emitted ||= {})[event] = true
    callWithAsyncErrorHandling(onceHandler, instance, args)
  }
}`,
        lang: 'js',
        title: 'mental model of emit()',
      },
      `
Consequences of this design:

- **No bubbling**: only the vnode that carries \`onAddToCart\` — the direct parent's usage — can be found.
- **Synchronous**: the handler runs before \`emit()\` returns. Errors in the handler are routed to Vue's error handling (and async handlers' rejected promises too), but the return value is discarded.
- **Declared emits are excluded from \`$attrs\`.** Undeclared \`onXxx\` listeners are treated as fallthrough attributes and attached to the child's root element as **native** listeners. That is why an undeclared \`click\` you also \`emit\` fires the parent's handler twice: once from the native click, once from \`emit\`.
- In development, emitting an event that is neither declared nor present as an \`onX\` prop logs \`Component emitted event "x" but it is neither declared in the emits option nor as an "onX" prop\`.
`,
    ],
    production: `
- **Declare every event**, ideally with TypeScript payload types — it is the component's documented output API and powers editor autocompletion.
- **Emit data, not DOM events.** \`emit('select', user.id)\` keeps the parent independent of your markup; passing the raw \`MouseEvent\` leaks implementation details.
- **Name events after what happened or what is requested**: \`select\`, \`close\`, \`submit\`, \`update:modelValue\`. Avoid vague names like \`action\` or \`change2\`.
- For multi-field payloads, emit **one object** (\`emit('submit', { email, plan })\`) so adding a field later doesn't break argument order.
- \`emit\` doesn't wait. If a child needs to show "saving…" until the parent finishes, have the parent pass a \`saving\`/\`loading\` prop back down, or accept a function prop that returns a promise.
- Events reach only the direct parent. Re-emitting through one or two levels is fine; deeper chains are a signal to use [provide/inject](lesson:provide-inject) or a [Pinia store](lesson:pinia-basics). Vue 3 removed the instance event-bus methods (\`$on\`/\`$off\`/\`$once\`); if you truly need a bus, it's an external library (for example *mitt*), and usually a store is clearer.
`,
  },

  mistakes: [
    {
      title: 'Calling the handler with parentheses and losing the payload',
      wrong: { code: `<ProductCard @add-to-cart="addToCart()" />\n<!-- addToCart receives no arguments -->`, lang: 'vue' },
      right: { code: `<ProductCard @add-to-cart="addToCart" />\n<!-- or explicitly -->\n<ProductCard @add-to-cart="(id, qty) => addToCart(id, qty)" />`, lang: 'vue' },
      explanation: 'With parentheses the template treats it as an inline statement: it calls `addToCart()` with nothing. Pass the method reference, use `$event` for the first argument, or write an arrow function for several.',
    },
    {
      title: 'Not declaring an event that shares a native name',
      wrong: { code: `<!-- FancyButton.vue -->\n<script setup>\nconst emit = defineEmits([]) // 'click' not declared\n</script>\n<template>\n  <button @click="emit('click')">Go</button>\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\nconst emit = defineEmits(['click'])\n</script>\n<template>\n  <button @click="emit('click')">Go</button>\n</template>`, lang: 'vue' },
      explanation: 'Undeclared, the parent\'s `@click` falls through to the root `<button>` as a native listener *and* is called by `emit` — the handler runs twice. Declaring `click` makes the listener respond only to the component event.',
    },
    {
      title: 'Expecting a grandparent to hear the event',
      wrong: { code: `<!-- ShopPage.vue -->\n<ProductList @add-to-cart="addToCart" />\n<!-- but only ProductCard (a child of ProductList) emits it -->`, lang: 'vue' },
      right: { code: `<!-- ProductList.vue: re-emit -->\n<ProductCard @add-to-cart="(id) => emit('add-to-cart', id)" />`, lang: 'vue' },
      explanation: 'Component events stop at the direct parent. Re-emit for a level or two; for deeper trees, use provide/inject or a store.',
    },
    {
      title: 'Emitting the raw DOM event instead of data',
      wrong: { code: `<input @input="emit('search', $event)" />`, lang: 'vue' },
      right: { code: `<input @input="emit('search', $event.target.value)" />`, lang: 'vue' },
      explanation: 'The parent shouldn\'t have to know your markup to dig out `event.target.value`. Emit the meaningful value.',
    },
  ],

  debugging: [
    {
      symptom: 'The parent\'s handler never runs.',
      cause: 'Name mismatch between `emit(\'add-item\')` and `@add-to-cart`, or the listener is on a grandparent instead of the direct parent.',
      fix: 'Check spelling (case conversion only maps camelCase ↔ kebab-case of the *same* words) and put the listener on the component that emits.',
    },
    {
      symptom: 'The handler runs twice per click.',
      cause: 'The event shares a native name (`click`, `input`) and isn\'t declared, so it is both a native fallthrough listener and an emitted event.',
      fix: 'Declare it in `defineEmits`, or rename it to something non-native like `select`.',
    },
    {
      symptom: 'The handler receives `undefined` instead of the payload.',
      cause: 'The listener was written as `@x="handler()"`, or the child forgot to pass the payload to `emit`.',
      fix: 'Use `@x="handler"` or `@x="handler($event)"`, and check the `emit(...)` call includes the data.',
    },
    {
      symptom: 'Console: `Component emitted event "x" but it is neither declared in the emits option nor as an "onX" prop`.',
      cause: 'The component emits an event it never declared.',
      fix: 'Add it to `defineEmits`.',
    },
    {
      symptom: 'Console: `Invalid event arguments: event validation failed for event "x"`.',
      cause: 'An object-syntax validator returned `false` for the payload.',
      fix: 'Fix the payload at the emit site, or adjust the validator if the rule was wrong. (The event is still delivered.)',
    },
  ],

  bestPractices: [
    'Declare every emitted event with `defineEmits` (with TypeScript payload types where available).',
    'Emit meaningful data (ids, values, objects), not raw DOM events.',
    'Use kebab-case for listeners in templates and clear, intention-revealing event names.',
    'Prefer a single object payload when you have more than two pieces of data.',
    'Keep state changes in the owner: children emit, parents mutate.',
    'Don\'t re-emit through many layers — switch to provide/inject or a store.',
  ],

  useCases: [
    'Buttons and cards reporting user intent: `add-to-cart`, `select`, `delete`.',
    'Form components announcing `submit` with the collected data.',
    'Dialogs and drawers requesting `close`.',
    'List items reporting `toggle` / `remove` with their id.',
    'The `update:xxx` events behind component `v-model`.',
  ],

  whenToUse: {
    use: [
      'A child needs to tell its direct parent that something happened.',
      'The parent owns the state that should change in response.',
      'You want a reusable component that doesn\'t know where its data lives.',
    ],
    avoid: [
      'Communicating between siblings or distant components — lift state up, use provide/inject, or a store.',
      'Needing a return value from the parent — pass a function prop or a status prop instead.',
      'Mirroring a prop two ways by hand — use `defineModel()` for v-model.',
    ],
  },

  comparison: {
    title: 'Component events vs native DOM events',
    headers: ['', 'Component event (`emit`)', 'Native DOM event (`click`, `input`…)'],
    rows: [
      ['Created by', 'your code calling `emit()`', 'the browser'],
      ['Bubbles up?', '**no** — direct parent only', 'yes, through ancestor elements'],
      ['Timing', 'synchronous function call', 'dispatched by the browser\'s event system'],
      ['Payload', 'any arguments you pass', 'an `Event` object'],
      ['`.prevent` / `.stop` meaningful?', 'no — there is no DOM event to stop', 'yes'],
      ['Declared with', '`defineEmits`', 'nothing — always available on elements'],
    ],
    note: 'Listening with `@x` looks identical for both. What matters is whether the component declares `x` in `defineEmits`.',
  },

  quiz: [
    {
      id: 'emits-q1',
      type: 'mcq',
      prompt: '`CommentItem` (inside `CommentList`, inside `ArticlePage`) emits `like`. `ArticlePage` writes `<CommentList @like="onLike" />`. Does `onLike` run?',
      options: [
        { text: 'Yes — component events bubble like DOM events.', why: 'Component events are direct calls to the parent\'s listener. They never bubble.' },
        { text: 'No — only `CommentList`, the direct parent, could listen. It would have to re-emit `like`.' },
        { text: 'Yes, but only if `like` is declared in `defineEmits`.', why: 'Declaring the event doesn\'t make it bubble.' },
        { text: 'Only with the `.capture` modifier.', why: 'Capture is a DOM concept; component events have no capture or bubbling phase.' },
      ],
      answer: 1,
      explanation: 'An emitted event looks for an `onLike` handler on the emitting component\'s own vnode — written by its direct parent. Re-emit, or use provide/inject or a store for distant components.',
    },
    {
      id: 'emits-q2',
      type: 'output',
      prompt: 'The child runs `emit(\'select\', 42)`. What does the parent log?',
      code: {
        lang: 'vue',
        code: `<script setup>
function onSelect(id) {
  console.log('selected', id)
}
</script>

<template>
  <UserRow @select="onSelect()" />
</template>`,
      },
      options: [
        { text: 'selected 42', why: 'The parentheses turn it into an inline statement that calls `onSelect` with no arguments.' },
        { text: 'selected undefined' },
        { text: 'Nothing — the handler is never called.', why: 'It is called; just without the payload.' },
        { text: 'selected [object Event]', why: 'There is no DOM event here; and the payload isn\'t forwarded anyway.' },
      ],
      answer: 1,
      explanation: '`@select="onSelect()"` compiles to roughly `($event) => onSelect()`. Use `@select="onSelect"` or `@select="onSelect($event)"`.',
    },
    {
      id: 'emits-q3',
      type: 'bug',
      prompt: 'The parent listens with `@toggle="toggleTodo"` where `toggleTodo(id)` flips the matching todo. Clicking a checkbox does nothing. Which line is wrong?',
      code: {
        lang: 'vue',
        code: `<script setup>
const props = defineProps({ todo: Object })
const emit = defineEmits(['toggle'])
</script>

<template>
  <li>
    <input type="checkbox" :checked="todo.done" @change="emit('toggle')" />
    {{ todo.text }}
  </li>
</template>`,
      },
      answerLine: 8,
      explanation: 'The event is emitted without a payload, so `toggleTodo` receives `undefined` and finds nothing. It should be `emit(\'toggle\', todo.id)`.',
    },
    {
      id: 'emits-q4',
      type: 'fill',
      prompt: 'Declare a `select` event and emit it with the item\'s id from the template.',
      code: {
        lang: 'vue',
        code: `<script setup>
defineProps({ item: Object })
const emit = ___(['select'])
</script>

<template>
  <button @click="___('select', item.id)">{{ item.name }}</button>
</template>`,
      },
      answer: [['defineEmits'], ['emit', '$emit']],
      explanation: '`defineEmits` declares the event and returns `emit`. In the template both `emit(...)` and `$emit(...)` work.',
    },
    {
      id: 'emits-q5',
      type: 'mcq',
      prompt: 'Select **all** genuine benefits of declaring events with `defineEmits`.',
      options: [
        { text: 'Documents the component\'s output API.' },
        { text: 'Declared listeners are excluded from `$attrs`, so they aren\'t attached to the root element as native listeners.' },
        { text: 'Enables payload validation warnings in development.' },
        { text: 'Makes the event bubble to all ancestors.', why: 'Component events never bubble, declared or not.' },
        { text: 'Makes `emit()` return the parent handler\'s result.', why: '`emit` never returns the handler\'s return value.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Declarations document intent, separate component events from native fallthrough listeners, and allow dev-mode validation. They don\'t change delivery.',
    },
    {
      id: 'emits-q6',
      type: 'mcq',
      prompt: 'A child calls `emit(\'addToCart\', id)`. Which parent listener(s) receive it?',
      options: [
        { text: 'Only `@addToCart`', why: 'Vue maps between camelCase and kebab-case event names.' },
        { text: 'Only `@add-to-cart`', why: 'camelCase listeners work too.' },
        { text: 'Both `@add-to-cart` and `@addToCart`' },
        { text: 'Neither — event names must be lowercase', why: 'Vue normalises case for component events.' },
      ],
      answer: 2,
      explanation: 'Component event names get the same automatic case conversion as props. In templates, kebab-case listeners are the common convention.',
    },
    {
      id: 'emits-q7',
      type: 'short',
      prompt: 'What is the difference between props and emits? Answer in two or three sentences.',
      answer: 'Props carry data down from parent to child; they are read-only inputs the child displays or computes with. Emits send messages up from child to parent — the child announces that something happened (with an optional payload) and the parent decides how to update its own state. Together they form the "props down, events up" contract.',
    },
  ],

  exercises: [
    {
      id: 'star-picker',
      title: 'A clickable star picker',
      difficulty: 'intermediate',
      prompt: `
Make \`StarPicker.vue\` report which star was clicked.

- It renders five \`<button class="star">\` elements (already there).
- Clicking the *n*-th star emits a **declared** \`rate\` event with the number *n* (1–5) as the payload.
- In \`App.vue\`, listen for \`rate\`, store the value and show it in \`<p class="result">\` as **You rated: 4** (initially **You rated: –**).
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import StarPicker from './StarPicker.vue'

const rating = ref(null)
</script>

<template>
  <StarPicker />
  <p class="result">You rated: –</p>
</template>`,
        'StarPicker.vue': `<script setup>
// TODO: declare the rate event
</script>

<template>
  <div class="picker">
    <button v-for="n in 5" :key="n" class="star">★</button>
  </div>
</template>`,
      },
      hints: [
        'In `StarPicker.vue`: `const emit = defineEmits([\'rate\'])`.',
        'Each button can call `@click="emit(\'rate\', n)"` — `n` is the loop variable.',
        'In `App.vue`: `<StarPicker @rate="(value) => (rating = value)" />` and `{{ rating ?? \'–\' }}`.',
      ],
      solution: {
        explanation: 'The picker owns no rating state; it only reports clicks with the star number. The parent owns `rating` and decides what to do with it — it could just as easily save it to a server.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import StarPicker from './StarPicker.vue'

const rating = ref(null)

function onRate(value) {
  rating.value = value
}
</script>

<template>
  <StarPicker @rate="onRate" />
  <p class="result">You rated: {{ rating ?? '–' }}</p>
</template>`,
          'StarPicker.vue': `<script setup>
const emit = defineEmits(['rate'])
</script>

<template>
  <div class="picker">
    <button
      v-for="n in 5"
      :key="n"
      class="star"
      @click="emit('rate', n)"
    >★</button>
  </div>
</template>`,
        },
      },
      tests: [
        {
          name: 'clicking the 4th star emits rate with 4',
          code: `const p = mountFile('StarPicker.vue')
await click(p.el.querySelectorAll('.star')[3])
expect(p.emitted('rate')).toEqual([[4]])`,
        },
        { name: 'the parent starts with a dash', code: `expect(text('.result')).toBe('You rated: –')` },
        {
          name: 'the parent shows the chosen rating',
          code: `await click(findAll('.star')[1])
expect(text('.result')).toBe('You rated: 2')
await click(findAll('.star')[4])
expect(text('.result')).toBe('You rated: 5')`,
        },
      ],
    },
    {
      id: 'todo-events',
      title: 'Todo items that report toggle and remove',
      difficulty: 'intermediate',
      prompt: `
\`App.vue\` owns the todo list and already has \`toggleTodo(id)\` and \`removeTodo(id)\`. Finish \`TodoItem.vue\`:

- Declare two events: \`toggle\` and \`remove\`, each with the todo's **id** as payload.
- The \`<input type="checkbox" class="check">\` emits \`toggle\` when it changes.
- The \`<button class="remove">\` emits \`remove\`.
- The \`<li class="todo">\` gets the class \`done\` when the todo is done.

Do not mutate the \`todo\` prop inside \`TodoItem\`.
`,
      files: {
        'App.vue': todoApp,
        'TodoItem.vue': `<script setup>
const props = defineProps({ todo: { type: Object, required: true } })
// TODO: declare and emit toggle / remove
</script>

<template>
  <li class="todo">
    <input type="checkbox" class="check" :checked="todo.done" />
    <span>{{ todo.text }}</span>
    <button class="remove">✕</button>
  </li>
</template>`,
      },
      hints: [
        '`const emit = defineEmits([\'toggle\', \'remove\'])`.',
        'On the checkbox: `@change="emit(\'toggle\', todo.id)"`; on the button: `@click="emit(\'remove\', todo.id)"`.',
        'For the class: `:class="{ done: todo.done }"` on the `<li>`.',
      ],
      solution: {
        explanation: 'The item stays a "dumb" view: it renders the todo it is given and reports intent with an id. Only the parent changes the list, so there is exactly one place where todos are modified.',
        files: {
          'App.vue': todoApp,
          'TodoItem.vue': `<script setup>
const props = defineProps({ todo: { type: Object, required: true } })
const emit = defineEmits(['toggle', 'remove'])
</script>

<template>
  <li class="todo" :class="{ done: todo.done }">
    <input
      type="checkbox"
      class="check"
      :checked="todo.done"
      @change="emit('toggle', todo.id)"
    />
    <span>{{ todo.text }}</span>
    <button class="remove" @click="emit('remove', todo.id)">✕</button>
  </li>
</template>

<style scoped>
.done span { text-decoration: line-through; opacity: 0.6; }
</style>`,
        },
      },
      tests: [
        {
          name: 'TodoItem emits toggle and remove with the id',
          code: `const item = mountFile('TodoItem.vue', { todo: { id: 7, text: 'Test', done: false } })
await check(item.find('.check'), true)
await click(item.find('.remove'))
expect(item.emitted('toggle')).toEqual([[7]])
expect(item.emitted('remove')).toEqual([[7]])`,
        },
        {
          name: 'ticking a todo marks it done in the parent',
          code: `expect(text('.left')).toBe('2 left')
await check(findAll('.check')[0], true)
expect(classes(findAll('.todo')[0])).toContain('done')
expect(text('.left')).toBe('1 left')`,
        },
        {
          name: 'remove deletes the todo',
          code: `await click(findAll('.remove')[1])
expect(findAll('.todo')).toHaveLength(2)
expect(text('.todos')).not.toContain('Write the report')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'emits-props-vs-emits',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between props and emits in Vue? When do you use each?',
      answer: 'Props pass data from parent to child; they are read-only inputs. Emits send events from child to parent, optionally with a payload, to notify it that something happened or to request a change. Use props for what a child needs to render; use emits whenever the child needs the parent to react or change state the parent owns.',
      explanation: '"Props down, events up": data descends as props, intentions ascend as events, and only the owner of the state mutates it.',
      code: {
        lang: 'vue',
        code: `<!-- parent -->
<TodoItem :todo="todo" @toggle="toggleTodo" />

<!-- TodoItem.vue -->
<script setup>
defineProps({ todo: Object })
const emit = defineEmits(['toggle'])
</script>
<template>
  <input type="checkbox" :checked="todo.done" @change="emit('toggle', todo.id)" />
</template>`,
      },
      whyAsked: 'The most common Vue interview question about component communication.',
      mistakes: ['Saying props can be modified by the child.', 'Thinking events bubble to any ancestor.', 'Not mentioning ownership of state.'],
      followUps: ['How do you implement v-model on a custom component?', 'What would you use for siblings?', 'Why should you declare emits?'],
      modelAnswer: 'Props and emits are the two halves of a component\'s interface. Props carry data down: the parent passes values, the child treats them as read-only and re-renders when they change. Emits carry messages up: the child calls `emit(\'toggle\', id)` and the parent\'s listener decides what to do. So a todo item receives its todo as a prop and emits `toggle`; the parent, which owns the list, flips the flag. That keeps state changes in one place and makes the child reusable.',
    },
    {
      id: 'emits-why-declare',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Vue lets you call `emit()` without declaring the event. Why should you declare emits anyway?',
      answer: 'Declaring documents the component\'s output API, enables dev-time payload validation and TypeScript types, and — importantly — excludes those listeners from `$attrs`. Undeclared listeners fall through to the root element as native DOM listeners, which can cause double firing for events with native names like `click`.',
      explanation: 'The declaration tells Vue "this listener is for a component event, not a DOM event".',
      whyAsked: 'Probes knowledge of the fallthrough mechanism, a common source of subtle bugs.',
      mistakes: ['Saying it is purely documentation.', 'Not knowing about the double-fire behaviour.'],
      followUps: ['What ends up in `$attrs`?', 'What happens if you declare `click` in emits?'],
      modelAnswer: 'Three reasons. It documents the API for readers and tooling, including TypeScript payload types. It allows validation warnings in development. And it changes behaviour: declared listeners are removed from `$attrs`, so they aren\'t attached to the root element as native listeners. Without the declaration, a component that emits `click` while its parent listens with `@click` triggers the handler twice — once natively, once via emit.',
    },
    {
      id: 'emits-double-fire',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Clicking this button logs "saved" twice. Why, and how do you fix it?',
      code: {
        lang: 'vue',
        code: `<!-- SaveButton.vue -->
<script setup>
const emit = defineEmits([])
</script>
<template>
  <button class="save" @click="emit('click')">Save</button>
</template>

<!-- Parent -->
<SaveButton @click="console.log('saved')" />`,
      },
      answer: '`click` is not declared, so the parent\'s `@click` is a fallthrough attribute attached natively to the root `<button>` — and the component also emits `click`, which calls the same handler. Fix: declare `click` in `defineEmits([\'click\'])` (or rename the event, e.g. `save`, and drop the native listener fallthrough).',
      explanation: 'One native call plus one emitted call equals two.',
      whyAsked: 'A classic Vue 3 gotcha, especially in codebases migrated from Vue 2.',
      mistakes: ['Suggesting `.stop` or `.once` as the fix.', 'Blaming event bubbling.'],
      followUps: ['What would happen with `inheritAttrs: false`?', 'Why is naming the event `save` arguably better?'],
      modelAnswer: 'Because `click` isn\'t declared in emits, Vue treats the parent\'s listener as a fallthrough attribute and binds it natively on the root button. Then the button\'s own handler emits `click`, which calls the same listener again. Declaring `click` in `defineEmits` makes Vue treat it purely as a component event, so it runs once. Naming it `save` would make the intent clearer still.',
    },
    {
      id: 'emits-deep-tree',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A `DeleteButton` sits four levels below the `ProjectPage` that owns the project list. How should the delete action reach `ProjectPage`?',
      answer: 'Component events don\'t bubble, so options are: re-emit at each level (fine for one or two levels, noisy for four), provide a function from `ProjectPage` with `provide(\'deleteProject\', fn)` and `inject` it in `DeleteButton`, or move the project list into a Pinia store whose action the button calls. For four levels I\'d pick provide/inject for a feature-local concern, or a store if other parts of the app also need the list.',
      explanation: 'Choose based on how widely the state is shared: local tree → provide/inject; app-wide → store.',
      whyAsked: 'Checks that you know the limits of emits and can choose an appropriate alternative.',
      mistakes: ['Saying the event will bubble up.', 'Recommending a global event bus as the default.', 'Reaching for `$parent`.'],
      followUps: ['What are the downsides of provide/inject?', 'When is re-emitting acceptable?'],
      modelAnswer: 'Emits only reach the direct parent, so with four levels I\'d either re-emit through every layer — noisy and fragile — or change the mechanism. If the list is local to this page, `ProjectPage` can `provide` a `deleteProject` function and `DeleteButton` can `inject` it: no intermediate components involved. If other pages or widgets care about projects, I\'d put the list and the delete action in a Pinia store. I\'d avoid an event bus or `$parent`, which hide the data flow.',
    },
    {
      id: 'emits-await-parent',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A `CommentForm` emits `submit` with the text. The parent saves it to the server. The form should show a spinner and clear the textarea only if saving succeeded. Why is `await emit(\'submit\', text)` not enough, and what would you do?',
      answer: '`emit` is synchronous and ignores the handler\'s return value, so you can\'t await the parent\'s async work through it. Options: (1) the parent passes a `saving`/`error` prop back down and the form reacts to it (watch `saving` to clear on success); (2) the parent passes an async function prop like `:on-submit="saveComment"` and the child awaits it; (3) the parent resets the form via a key or exposed method. Option 1 keeps a clean props-down/events-up flow; option 2 is pragmatic when the child must know the result.',
      explanation: 'Events are notifications, not requests with responses.',
      code: {
        lang: 'vue',
        code: `<!-- Option 2: function prop the child can await -->
<CommentForm :submit="saveComment" />

<!-- CommentForm.vue -->
<script setup>
const props = defineProps({ submit: Function })
async function send() {
  saving.value = true
  try { await props.submit(text.value); text.value = '' }
  finally { saving.value = false }
}
</script>`,
      },
      whyAsked: 'Shows depth: understanding emit semantics and designing async component APIs.',
      mistakes: ['Assuming `emit` returns a promise.', 'Letting the child call the API directly, coupling it to the server.'],
      followUps: ['What are the trade-offs between a status prop and a function prop?', 'How would you test each approach?'],
      modelAnswer: '`emit` is just a synchronous call to the listener; whatever the parent\'s handler returns, including a promise, is thrown away. So the child can\'t know when saving finishes. I\'d either keep events and have the parent pass `saving` and `error` props down — the form shows a spinner and clears when `saving` goes false without an error — or accept an async function prop and await it inside the form. The first is purer data flow; the second is simpler when the child genuinely needs the outcome.',
    },
    {
      id: 'emits-internals',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'How does `emit()` actually reach the parent\'s handler under the hood?',
      answer: 'The parent\'s `@add-to-cart="fn"` compiles to a vnode prop `onAddToCart: fn` on the child. `emit(\'add-to-cart\', ...args)` normalises the name to handler keys (`onAdd-to-cart`, then camelized `onAddToCart`), looks them up in the child\'s vnode props and calls the handler synchronously with the args (through Vue\'s error handling). `.once` uses an `onAddToCartOnce` key and a per-instance flag.',
      explanation: 'An event listener on a component is just a function passed as a specially named prop.',
      whyAsked: 'Distinguishes deep understanding: explains no bubbling, synchronous delivery and why undeclared listeners end up in `$attrs`.',
      mistakes: ['Saying Vue dispatches a DOM CustomEvent.', 'Thinking there is a global event bus behind emits.'],
      followUps: ['Why can a parent pass `:onAddToCart="fn"` instead of `@add-to-cart`?', 'How does this relate to `$attrs`?'],
      modelAnswer: 'There\'s no DOM involved. A listener on a component tag compiles into a prop named `on` plus the capitalised, camelized event name — `onAddToCart`. When the child calls `emit`, Vue converts the event name to those handler keys, finds the function in the child\'s vnode props and calls it synchronously with the payload, routing errors through the app\'s error handler. That explains why events don\'t bubble, why they\'re synchronous, and why undeclared `onX` listeners fall through as attributes.',
    },
    {
      id: 'emits-coding-tag-input',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Finish `TagInput.vue`: when the user presses **Enter** in the `<input class="tag-input">`, emit a declared `add` event with the **trimmed** text and clear the input. Ignore empty or whitespace-only input.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import TagInput from './TagInput.vue'

const tags = ref([])
</script>

<template>
  <TagInput @add="(tag) => tags.push(tag)" />
  <p class="tags">{{ tags.join(', ') }}</p>
</template>`,
          'TagInput.vue': `<script setup>
import { ref } from 'vue'

const text = ref('')
</script>

<template>
  <input class="tag-input" v-model="text" placeholder="Add a tag…" />
</template>`,
        },
      },
      tests: [
        {
          name: 'Enter emits the trimmed text and clears the input',
          code: `const t = mountFile('TagInput.vue')
const input = t.find('.tag-input')
await type(input, '  vue  ')
await trigger(input, 'keyup', { key: 'Enter' })
expect(t.emitted('add')).toEqual([['vue']])
expect(input.value).toBe('')`,
        },
        {
          name: 'blank input emits nothing',
          code: `const t = mountFile('TagInput.vue')
const input = t.find('.tag-input')
await type(input, '   ')
await trigger(input, 'keyup', { key: 'Enter' })
expect(t.emitted('add')).toEqual([])`,
        },
        {
          name: 'the parent collects the tags',
          code: `await type('.tag-input', 'pinia')
await trigger('.tag-input', 'keyup', { key: 'Enter' })
await type('.tag-input', 'router')
await trigger('.tag-input', 'keyup', { key: 'Enter' })
expect(text('.tags')).toBe('pinia, router')`,
        },
      ],
      hints: ['Declare the event: `const emit = defineEmits([\'add\'])`.', 'Listen with `@keyup.enter="submit"`.', 'In `submit`: trim, return early if empty, otherwise `emit(\'add\', value)` and reset `text.value = \'\'`.'],
      answer: 'Declare `add`, handle `@keyup.enter`, trim the text, emit only when non-empty, then clear the local state.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import TagInput from './TagInput.vue'

const tags = ref([])
</script>

<template>
  <TagInput @add="(tag) => tags.push(tag)" />
  <p class="tags">{{ tags.join(', ') }}</p>
</template>`,
          'TagInput.vue': `<script setup>
import { ref } from 'vue'

const emit = defineEmits(['add'])
const text = ref('')

function submit() {
  const value = text.value.trim()
  if (!value) return
  emit('add', value)
  text.value = ''
}
</script>

<template>
  <input
    class="tag-input"
    v-model="text"
    placeholder="Add a tag…"
    @keyup.enter="submit"
  />
</template>`,
        },
      },
      explanation: 'The input text is local state the component owns; the list of tags belongs to the parent. The component only reports a clean, meaningful value.',
      whyAsked: 'Combines local state, key modifiers, validation and emitting a clean payload.',
      mistakes: ['Emitting the raw keyboard event.', 'Pushing into a prop array instead of emitting.', 'Forgetting to clear the input.'],
      followUps: ['How would you prevent duplicate tags — child or parent?', 'How would you support a comma as a separator too?'],
      modelAnswer: 'The text being typed is local state, so it\'s a ref inside TagInput. On `@keyup.enter` I trim it, bail out if it\'s empty, emit `add` with the clean value and reset the ref. The parent owns the tag list and pushes the payload. Duplicate prevention belongs with the owner of the list — the parent — or I\'d pass the existing tags down as a prop so the input can show an error.',
    },
  ],

  takeaways: [
    'Children talk to parents by emitting events: `emit(\'name\', ...payload)`; parents listen with `@name`.',
    'Declare events with `defineEmits` — it documents the API, keeps them out of `$attrs` and enables dev validation.',
    'Component events don\'t bubble and are delivered synchronously; native DOM events do bubble.',
    'Pass the handler (`@x="fn"`) or use `$event`/arrows — `@x="fn()"` drops the payload.',
    'Emit meaningful data, keep mutations in the state owner, and switch to provide/inject or a store for distant components.',
  ],
}
