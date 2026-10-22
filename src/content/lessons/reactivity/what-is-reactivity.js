// Lesson: What reactivity means — the mental model for the whole Reactivity level.

const cartApp = `<script setup>
import { ref, computed } from 'vue'

const cart = ref([])

const total = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price, 0)
)

function add(name, price) {
  cart.value.push({ name, price })
}

function clear() {
  cart.value = []
}
</script>

<template>
  <h2>Cart ({{ cart.length }})</h2>
  <button @click="add('Apple', 2)">Add apple (€2)</button>
  <button @click="add('Bread', 3)">Add bread (€3)</button>

  <p v-if="cart.length === 0" class="empty">Your cart is empty.</p>
  <ul v-else>
    <li v-for="(item, index) in cart" :key="index">{{ item.name }} — €{{ item.price }}</li>
  </ul>

  <p class="total">Total: €{{ total }}</p>
  <button class="checkout" :disabled="cart.length === 0">Checkout</button>
  <button class="clear" @click="clear">Clear</button>
</template>`

const imperativeCart = `// The same cart WITHOUT Vue: every change must redraw the page by hand.
const app = document.getElementById('app')
const cart = []

app.innerHTML =
  '<h2>Cart (0)</h2>' +
  '<button class="add-apple">Add apple (€2)</button>' +
  '<button class="add-bread">Add bread (€3)</button>' +
  '<p class="empty">Your cart is empty.</p>' +
  '<ul></ul>' +
  '<p class="total">Total: €0</p>' +
  '<button class="checkout" disabled>Checkout</button>' +
  '<button class="clear">Clear</button>'

// One function that knows about EVERY place the cart appears.
function render() {
  const total = cart.reduce((sum, item) => sum + item.price, 0)
  app.querySelector('h2').textContent = 'Cart (' + cart.length + ')'
  app.querySelector('.empty').style.display = cart.length ? 'none' : ''
  app.querySelector('ul').innerHTML = cart
    .map((item) => '<li>' + item.name + ' — €' + item.price + '</li>')
    .join('')
  app.querySelector('.total').textContent = 'Total: €' + total
  app.querySelector('.checkout').disabled = cart.length === 0
}

function add(name, price) {
  cart.push({ name, price })
  render() // delete this line and the page silently lies
}

app.querySelector('.add-apple').addEventListener('click', () => add('Apple', 2))
app.querySelector('.add-bread').addEventListener('click', () => add('Bread', 3))
app.querySelector('.clear').addEventListener('click', () => {
  cart.length = 0
  render()
})`

export default {
  id: 'what-is-reactivity',
  title: 'What reactivity means',
  summary: 'Why a user interface must stay in sync with its data, and how Vue keeps it in sync for you by remembering what each part of the screen depends on.',
  difficulty: 'beginner',
  minutes: 22,
  prerequisites: ['template-syntax', 'dom-and-events'],
  related: ['ref', 'reactive', 'computed', 'next-tick', 'how-reactivity-works'],
  tags: ['reactivity', 'declarative rendering', 'state', 'dependency tracking', 'effects', 'imperative vs declarative', 'single source of truth'],
  apis: [
    { name: 'ref()', summary: 'Creates a reactive value. Covered in depth in the next lesson.' },
    { name: 'computed()', summary: 'Creates a value derived from other reactive values, recalculated when they change.' },
  ],
  docs: [
    { label: 'Vue Guide — Introduction: Declarative Rendering', url: 'https://vuejs.org/guide/introduction.html#declarative-rendering' },
    { label: 'Vue Guide — Reactivity Fundamentals', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html' },
    { label: 'Vue Guide — Reactivity in Depth', url: 'https://vuejs.org/guide/extras/reactivity-in-depth.html' },
  ],

  intro: `
Every app has two halves: the **data** it remembers (how many items are in your cart, what you typed, whether a menu is open) and the **screen** that shows that data. Programmers call the remembered data **state**, and the screen the **UI** (user interface).

**Reactivity** means the screen *automatically follows the state*. You change the data; every part of the page that shows that data updates itself. You never write "find the badge and change its number" again.

This lesson is the map for the whole level. You'll see *what* problem reactivity solves, the five-step loop Vue runs every time something changes, and a working cart where four different parts of the page follow one array.
`,

  why: [
    `
Imagine a shopping cart page. When the shopper adds an item, **four things** on the page must change: the count in the heading, the list of items, the total, and whether the Checkout button is enabled. Here's how that looks without a framework:
`,
    {
      code: `function addItem(item) {
  cart.push(item)
  document.querySelector('h2').textContent = 'Cart (' + cart.length + ')'
  document.querySelector('ul').innerHTML += '<li>' + item.name + '</li>'
  document.querySelector('.total').textContent = 'Total: €' + getTotal()
  // ...and the Checkout button? Forgot it. Now it stays disabled.
}

function removeItem(index) {
  cart.splice(index, 1)
  // Have to repeat ALL of the above here, and in clearCart(), and in applyCoupon()...
}`,
      lang: 'js',
      title: 'imperative UI: you update every spot by hand',
    },
    `
This style is called **imperative**: you give the browser step-by-step commands ("set this text, add that element"). It works for tiny pages, but it doesn't scale:

- Every function that changes the data must know about **every place** the data appears.
- Add a new place (say, a cart badge in the header) and you must hunt down every function and update it.
- Forget one spot once, and the page shows something that is no longer true. Nothing warns you.

Reactivity flips the job around. You write the UI **once**, as a description of what the screen should look like *for any state* — this is called **declarative** rendering. Then you only ever change the state. Vue works out which parts of the page are now out of date and fixes exactly those.
`,
    {
      callout: 'tip',
      title: 'The one-line summary',
      text: 'Imperative: "when X happens, change these five elements." Declarative + reactive: "the heading shows the cart size" — and Vue keeps that sentence true forever.',
    },
  ],

  eli15: `
Think of a **spreadsheet**. In cell C1 you type the formula \`= A1 + B1\`. Now whenever you change A1 or B1, C1 updates by itself. You never press a "recalculate C1" button, and you never tell A1 "please go and update C1 when you change".

How does the spreadsheet know? When you typed the formula, it **remembered** that C1 depends on A1 and B1. Later, when A1 changes, it looks up its notes, sees "C1 uses A1", and recalculates C1 — and *only* C1, not the whole sheet.

Vue does exactly this for web pages:

- your **data** (made with \`ref()\` or \`reactive()\`) is like the input cells A1 and B1;
- your **template** (\`<h2>Cart ({{ cart.length }})</h2>\`) is like the formula;
- the **page** you see is like the numbers shown in the cells.

Change the data, and Vue redraws only the parts of the page whose "formula" used it. That's reactivity: **change the data, the screen catches up.**
`,

  analogy: {
    title: 'The spreadsheet that recalculates itself',
    body: `
A spreadsheet has input cells you type into, formula cells that are calculated from other cells, and a grid that shows the results. When you change an input, the spreadsheet recalculates just the formulas that used it — because it kept a list of who depends on what.

Vue's reactivity system is that list-keeping machinery for your app. Reactive state is the input cells, templates and \`computed()\` values are the formulas, and the DOM (the page the browser draws) is the grid.

Where the analogy stops: a spreadsheet recalculates instantly, cell by cell. Vue **batches** changes — if you change three values in one click, it updates the page once, right after your code finishes. You'll meet that in [nextTick()](lesson:next-tick).
`,
    mapping: [
      ['input cells (A1, B1)', 'reactive state: `ref()` / `reactive()`'],
      ['a formula cell (`= A1 + B1`)', 'a template expression or a `computed()` value'],
      ['the sheet remembering which cells a formula reads', 'dependency tracking'],
      ['recalculating a formula after an input changes', 'an effect being triggered and re-run'],
      ['the numbers you see in the grid', 'the rendered DOM'],
      ['a chart that redraws when the data changes', 'a side effect: a `watch()` callback'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The reactivity loop',
    caption: 'Step through the five stages Vue runs for every change. Every lesson in this level zooms into one part of this loop.',
    alt: 'A five-stage flow diagram in a row: Reactive State, Dependency Tracking, State Change, Effect Triggered, DOM Updated. Each step highlights one stage: the cart ref is created; the template reads it during rendering so Vue records the dependency; a click pushes an item; Vue looks up the render effect that depends on the cart and queues it; the effect re-runs and only the changed DOM nodes are patched.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'state', label: 'Reactive State', note: 'const cart = ref([])', tone: 'acid' },
        { id: 'track', label: 'Dependency Tracking', note: 'render reads cart', tone: 'cobalt' },
        { id: 'change', label: 'State Change', note: 'cart.value.push(…)', tone: 'red' },
        { id: 'trigger', label: 'Effect Triggered', note: 'render effect queued', tone: 'kraft' },
        { id: 'dom', label: 'DOM Updated', note: 'only changed nodes', tone: 'ink' },
      ],
      edges: [
        { from: 'state', to: 'track', label: 'read during render' },
        { from: 'track', to: 'change', label: 'later, a click…' },
        { from: 'change', to: 'trigger', label: 'Vue looks up readers' },
        { from: 'trigger', to: 'dom', label: 're-render + patch' },
      ],
      steps: [
        { focus: ['state'], text: '**Reactive state.** `const cart = ref([])` creates a value Vue can observe. A plain `let cart = []` would be invisible to Vue.' },
        { focus: ['track'], edges: ['state->track'], text: '**Dependency tracking.** The component renders. While it does, its template reads `cart.length` and `total`. Vue writes down: "this component\'s render depends on `cart`". Reading = subscribing.' },
        { focus: ['change'], edges: ['track->change'], text: '**State change.** The shopper clicks *Add apple*. `cart.value.push(...)` changes the data. Your code does not touch the DOM at all.' },
        { focus: ['trigger'], edges: ['change->trigger'], text: '**Effect triggered.** Vue checks its notes: who read `cart`? The component\'s render effect (and the `total` computed it uses). That effect is put in a queue to run once, right after your click handler finishes.' },
        { focus: ['dom'], edges: ['trigger->dom'], text: '**DOM updated.** The render effect runs again, producing a fresh description of the page. Vue compares it with the previous one and patches only what changed: the heading text, one new `<li>`, the total, the button\'s `disabled`.' },
        { focus: ['state', 'track', 'change', 'trigger', 'dom'], text: 'The new render **re-tracks** what it read, so the loop is ready for the next change. The rest of this level opens each box: [ref](lesson:ref) and [reactive](lesson:reactive) (state), [computed](lesson:computed) (derived values), [watch](lesson:watch) (side effects), [nextTick](lesson:next-tick) (the queue) and [how reactivity works](lesson:how-reactivity-works) (tracking and triggering).' },
      ],
    },
  },

  animation: {
    type: 'scoreboard',
    props: { label: 'cartCount', start: 0 },
    title: 'One value, one change, the screen follows',
    caption: 'Press the button: the value inside the ref changes, Vue notices, and only the number on screen is redrawn. No line of your code touches the DOM.',
    alt: 'An interactive scoreboard. A box labelled cartCount.value holds a number. Pressing +1 increases it; an arrow labelled "Vue notices the change" points from the box to the rendered heading, which then shows the new number.',
  },

  syntax: [
    `
You'll learn each API properly in its own lesson. For now, recognise the **four kinds of code** that make up every reactive Vue component — they map directly onto the spreadsheet:
`,
    {
      code: `<script setup>
import { ref, computed, watch } from 'vue'

// 1. STATE — the input cells. Vue tracks reads and writes.
const cart = ref([])

// 2. DERIVED STATE — formula cells. Recalculated when cart changes.
const total = computed(() => cart.value.reduce((sum, i) => sum + i.price, 0))

// 3. SIDE EFFECTS — things that must happen *because* data changed
//    (saving, logging, calling an API). Not for computing values.
watch(cart, (items) => localStorage.setItem('cart', JSON.stringify(items)), { deep: true })

// 4. EVENTS — the only place you *change* state.
function add(name, price) {
  cart.value.push({ name, price })
}
</script>

<template>
  <!-- The template DESCRIBES the screen for any state. -->
  <h2>Cart ({{ cart.length }}) — €{{ total }}</h2>
  <button @click="add('Apple', 2)">Add apple</button>
</template>`,
      lang: 'vue',
      title: 'the four kinds of reactive code',
    },
    `
**The rules that make reactivity work:**

1. **State must be created with a reactive API** — \`ref()\` or \`reactive()\`. Vue cannot see plain variables change.
2. **Change the state, never the DOM.** In a Vue component you don't write \`querySelector(...).textContent = ...\`; Vue would overwrite it on the next render anyway.
3. **Templates and \`computed()\` describe; they don't do.** They should only *read* state and return a result — no saving, no fetching, no changing other state.
4. **Side effects go in event handlers or watchers.** "When the cart changes, save it" is a \`watch()\`; "when the button is clicked, add an item" is an event handler.
5. **Store the minimum, derive the rest.** Keep \`cart\` as state; the count, total and "is empty" are all *derived* from it.
`,
    {
      callout: 'version',
      text: 'Everything in this level is Vue 3\'s core reactivity API, imported from `\'vue\'`. Vue 3 builds reactivity on JavaScript **Proxies**; Vue 2 used a different technique with known gaps (see [How reactivity works](lesson:how-reactivity-works)).',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: cartApp,
    intro: 'One array of state, four parts of the page that follow it. Step through it — notice that no line ever touches the DOM.',
    steps: [
      { lines: [2], text: 'We import two reactive tools: `ref` for state and `computed` for values derived from state. Both get their own lessons next.' },
      { lines: [4], text: '`cart` is the **single source of truth**: one reactive array. Everything the page shows about the cart comes from here.' },
      { lines: [6, 8], text: '`total` is **derived state** — a spreadsheet formula. Vue remembers it reads `cart`, and recalculates it only when `cart` changes.' },
      { lines: [10, 12], text: '`add()` only changes data. It does not know the heading, list, total or button exist. That ignorance is the whole point.' },
      { lines: [14, 16], text: '`clear()` replaces the array with a new empty one. Same story: change the state, let Vue update the page.' },
      { lines: [20], text: 'The heading reads `cart.length`. During rendering, Vue records that this component depends on `cart`.' },
      { lines: [24, 27], text: '`v-if` / `v-else` choose between the empty message and the list based on the same state. The list re-renders whenever items are added or removed.' },
      { lines: [29, 30], text: 'The total and the Checkout button\'s `disabled` attribute are two more readers of the same data. Four places, zero manual updates.' },
    ],
  },

  playground: {
    title: 'A cart that keeps itself in sync',
    objective: 'Change the data in different ways and notice that you never have to update the page yourself.',
    files: { 'App.vue': cartApp },
    expected: 'A heading **Cart (0)**, two add buttons, an empty-cart message, **Total: €0** and a disabled Checkout button. Each add updates the heading, the list, the total and the button together. Switch to the **Plain JavaScript** variant to see how much code the same page needs without reactivity.',
    experiments: [
      {
        id: 'third-product',
        task: 'Add a third button, **Add milk (€1)**, that puts milk in the cart.',
        hint: 'Copy one of the existing buttons on lines 21–22 and change the arguments: `add(\'Milk\', 1)`.',
        tests: [
          {
            name: 'a Milk button adds a €1 item',
            code: `const milk = findAll('button').find((b) => /milk/i.test(b.textContent))
expect(milk).toBeTruthy()
await click(milk)
expect(text('h2')).toBe('Cart (1)')
expect(text('.total')).toBe('Total: €1')`,
          },
        ],
        explain: 'You added a new way to change the data, and the heading, list, total and button all followed — without touching any of them. In the imperative version you would have had to call `render()` (or update four elements) yourself.',
      },
      {
        id: 'remove-last',
        task: 'Add a button with `class="remove-last"` that removes the **last** item from the cart.',
        hint: 'Write a `removeLast()` function that calls `cart.value.pop()`, then `<button class="remove-last" @click="removeLast">Remove last</button>`.',
        tests: [
          {
            name: 'Remove last drops the newest item and the total follows',
            code: `const buttons = findAll('button')
await click(buttons.find((b) => /apple/i.test(b.textContent)))
await click(buttons.find((b) => /bread/i.test(b.textContent)))
expect(exists('.remove-last')).toBe(true)
await click('.remove-last')
expect(text('h2')).toBe('Cart (1)')
expect(text('.total')).toBe('Total: €2')`,
          },
        ],
        explain: 'Removing is just another state change. Vue noticed the array shrank and re-rendered every reader — including `total`, which recalculated because it depends on `cart`.',
      },
      {
        id: 'free-shipping',
        task: 'Under the total, add a `<p class="shipping">`. When the total is **under €10** it says *Add €X more for free shipping* (X = what is missing). From **€10** it says *Free shipping!*',
        hint: 'You can write it in the template with `v-if="total < 10"` / `v-else`, using `{{ 10 - total }}` for the missing amount. Or make a second `computed()`.',
        tests: [
          {
            name: 'shows how much is missing, then free shipping from €10',
            code: `expect(exists('.shipping')).toBe(true)
expect(text('.shipping')).toMatch(/more/i)
expect(text('.shipping')).toContain('10')
const bread = findAll('button').find((b) => /bread/i.test(b.textContent))
await click(bread)
expect(text('.shipping')).toContain('7')
for (let i = 0; i < 3; i++) await click(bread)
expect(text('.shipping')).toMatch(/free shipping/i)
expect(text('.shipping')).not.toMatch(/more/i)`,
          },
        ],
        explain: 'The shipping message is *derived* from the total, which is derived from the cart: a chain of formulas, like spreadsheet cells referencing other formula cells. You only ever change `cart`.',
      },
      {
        id: 'break-it',
        task: 'Break it on purpose: change line 4 to `const cart = []` and update `add()`/`clear()` to use `cart.push(...)` and `cart.length = 0`. Click the buttons. Then undo your change.',
        hint: 'Watch the console and the screen. The array really does grow — Vue just never hears about it.',
        explain: 'A plain array is invisible to Vue: reading it records nothing, and pushing into it notifies no one. The data changes, the screen doesn\'t. Reactivity only works for state Vue created (`ref`, `reactive`, `computed`…).',
      },
    ],
    variants: [
      { id: 'plain-js', label: 'Plain JavaScript (manual DOM)', files: { 'main.js': imperativeCart } },
    ],
  },

  internals: {
    beginner: `
While Vue draws your component, it keeps a notebook. Every time the template reads a reactive value, Vue writes: "this component used \`cart\`". Later, when you change \`cart\`, Vue opens the notebook, finds every reader, and redraws them — once, right after your code finishes.

Nobody polls or checks every value over and over. **Reading subscribes; writing notifies.** That's why plain variables don't work: Vue never saw them being read or written.
`,
    technical: [
      `
In Vue's vocabulary:

- An **effect** is a function Vue can re-run. Each component's render function runs inside a *render effect*; \`computed()\` and \`watch()\` are effects too.
- **Track:** while an effect runs, every read of reactive state records "this effect depends on this piece of state".
- **Trigger:** every write looks up the effects that depend on that piece of state and schedules them.
- **Scheduler:** triggered component updates go into a queue that is flushed asynchronously (in a microtask), so several changes in one event handler cause one re-render. See [nextTick()](lesson:next-tick).
- **Patch:** a re-run render produces a new *virtual DOM* (a lightweight JavaScript description of the page). Vue diffs it against the previous one and applies only the differences to the real DOM.

How can Vue notice a *read*? \`ref()\` stores the value behind a getter/setter on \`.value\`, and \`reactive()\` wraps objects in a JavaScript **Proxy** that intercepts property reads and writes.
`,
      {
        code: `// A SIMPLIFIED model of the idea — not Vue's real source code.
let activeEffect = null

function effect(fn) {
  activeEffect = fn
  fn()                 // while fn runs, every read registers it
  activeEffect = null
}

function signal(initial) {
  let value = initial
  const readers = new Set()
  return {
    get value() {
      if (activeEffect) readers.add(activeEffect) // track
      return value
    },
    set value(next) {
      value = next
      readers.forEach((fn) => fn())               // trigger
    },
  }
}

const count = signal(0)
effect(() => console.log('count is', count.value)) // logs "count is 0"
count.value = 1                                     // logs "count is 1"`,
        lang: 'js',
        title: 'the core idea in 20 lines (simplified)',
      },
      `
Real Vue adds a lot on top of this toy: it skips writes that don't change the value, batches and de-duplicates re-runs in a scheduler, cleans up dependencies that are no longer read, caches computed values, and handles objects, arrays, Maps and Sets. You'll build up that picture across this level and dissect it in [How reactivity works](lesson:how-reactivity-works).
`,
    ],
    production: `
- **Minimal state, maximal derivation.** Every extra piece of state you store is a piece you must keep in sync. Derive counts, totals, filtered lists and flags with \`computed()\`.
- **Know your non-reactive sources.** \`Date.now()\`, \`localStorage\`, \`window.innerWidth\`, values inside third-party libraries — Vue can't track them. Copy them into a ref and update that ref when they change (often inside a composable).
- **Don't fight the renderer.** Direct DOM edits inside Vue-managed elements get overwritten on the next render. When you truly need the DOM (focus, measuring, a chart library), use [template refs](lesson:template-refs) and the right timing ([nextTick](lesson:next-tick), \`onMounted\`).
- **Reactivity is not free.** Vue tracks every reactive read. For huge datasets you replace wholesale, opt out of deep tracking with [shallowRef or markRaw](lesson:shallow-and-raw) — after measuring.
- **Updates are asynchronous.** State changes immediately, the DOM a moment later. Code that reads the DOM right after a change sees the old page until the next tick.
`,
  },

  mistakes: [
    {
      title: 'Changing the DOM directly inside a Vue component',
      wrong: { code: `function add(item) {\n  cart.value.push(item)\n  document.querySelector('.total').textContent = 'Total: €' + getTotal()\n}`, lang: 'js' },
      right: { code: `const total = computed(() => cart.value.reduce((s, i) => s + i.price, 0))\n// template: <p class="total">Total: €{{ total }}</p>`, lang: 'js' },
      explanation: 'Vue owns the DOM it renders. Your manual edit works until the next re-render, which writes Vue\'s version back. Describe the value in the template instead and let reactivity keep it current.',
    },
    {
      title: 'Storing a derived value as separate state',
      wrong: { code: `const cart = ref([])\nconst total = ref(0)\n\nfunction add(item) {\n  cart.value.push(item)\n  total.value += item.price   // and in remove()? clear()? coupon()?\n}`, lang: 'js' },
      right: { code: `const cart = ref([])\nconst total = computed(() =>\n  cart.value.reduce((sum, item) => sum + item.price, 0)\n)`, lang: 'js' },
      explanation: 'Two pieces of state that must agree will eventually disagree — this is the imperative problem sneaking back in. If a value can be calculated from other state, calculate it.',
    },
    {
      title: 'Expecting a non-reactive source to update the screen',
      wrong: { code: `<p>Now: {{ new Date().toLocaleTimeString() }}</p>\n<p>Theme: {{ localStorage.getItem('theme') }}</p>`, lang: 'vue' },
      right: { code: `const now = ref(new Date())\nconst timer = setInterval(() => (now.value = new Date()), 1000)\nonUnmounted(() => clearInterval(timer))`, lang: 'js' },
      explanation: 'The clock only changes when *something else* makes the component re-render. Time and `localStorage` aren\'t reactive. Put the value in a ref and update the ref when the outside world changes. (Templates can only reach a limited set of globals, which is another reason to read browser APIs in script code.)',
    },
    {
      title: 'Using a plain variable for state',
      wrong: { code: `let isOpen = false\nfunction toggle() { isOpen = !isOpen }`, lang: 'js' },
      right: { code: `const isOpen = ref(false)\nfunction toggle() { isOpen.value = !isOpen.value }`, lang: 'js' },
      explanation: 'Vue can only track values it controls. A plain variable changes in memory, but no render effect is told about it.',
    },
  ],

  debugging: [
    {
      symptom: 'The value changes (console.log proves it) but the page does not update.',
      cause: 'The value is a plain variable or a plain object, not reactive state.',
      fix: 'Create it with `ref()` or `reactive()` and change it through the reactive object (`x.value = …`, `state.prop = …`).',
    },
    {
      symptom: 'Something updates only *sometimes* — e.g. when another value also changes.',
      cause: 'A non-reactive value is being read during render. It "works" only when an unrelated reactive change happens to re-render the component.',
      fix: 'Make the value itself reactive. Never rely on a re-render caused by something else.',
    },
    {
      symptom: 'A text you set with `querySelector` keeps snapping back to an old value.',
      cause: 'Vue re-rendered the component and replaced your manual DOM edit with what the template describes.',
      fix: 'Put the value in state and bind it in the template; use template refs only for things templates cannot express (focus, measuring, third-party widgets).',
    },
    {
      symptom: 'Right after changing state, code that reads the DOM sees the old content.',
      cause: 'DOM updates are batched and applied asynchronously.',
      fix: 'Read the state instead of the DOM, or `await nextTick()` before reading the DOM — see [nextTick()](lesson:next-tick).',
    },
  ],

  bestPractices: [
    'Keep one source of truth per fact (one `cart` array), and derive everything else from it.',
    'Change state only in event handlers, actions or watchers — never inside templates or computed getters.',
    'Write templates as descriptions ("the heading shows the count"), not as step-by-step updates.',
    'Wrap non-reactive sources (time, storage, window size, library state) in refs that you update deliberately.',
    'Name state after what it means (`cart`, `isMenuOpen`), not how it is stored.',
  ],

  useCases: [
    'Shopping carts where counts, totals, badges and buttons all follow one list.',
    'Forms where validation messages, character counters and the submit button follow the typed values.',
    'Dashboards where filters change and every chart, table and summary updates together.',
    'Toggles and menus: one `isOpen` flag drives the icon, the panel and the `aria-expanded` attribute.',
    'Live search: the query drives the filtered results and the "N results" label.',
  ],

  whenToUse: {
    use: [
      'Any value the UI shows that can change while the page is open.',
      'Values that other values are calculated from (the cart, the query, the selected tab).',
      'Values that should cause something to happen when they change (save, fetch, log) — via `watch()`.',
    ],
    avoid: [
      'Constants that never change — a plain `const` is clearer and cheaper.',
      'Values the UI never displays and nothing reacts to, such as a timer id — plain variables are fine.',
      'Large objects owned by another library (a map, a chart instance) — keep them out of deep reactivity (`markRaw`/`shallowRef`).',
    ],
  },

  comparison: {
    title: 'Imperative DOM updates vs Vue reactivity',
    headers: ['', 'Imperative (manual DOM)', 'Declarative + reactive (Vue)'],
    rows: [
      ['Who updates the page?', 'You, in every function that changes data', 'Vue, after any change to reactive state'],
      ['Where does display logic live?', 'Scattered across event handlers', 'In one place: the template (+ computed values)'],
      ['Adding a new place that shows the value', 'Edit every function that changes it', 'Add one binding in the template'],
      ['Risk of a stale, lying UI', 'High — one forgotten update is enough', 'Low — the template is re-evaluated when its data changes'],
      ['How much is redrawn?', 'Whatever you remember to touch', 'Only components that read the changed state; only changed DOM nodes are patched'],
    ],
    note: 'Next: create your first reactive value with [ref()](lesson:ref).',
  },

  quiz: [
    {
      id: 'what-is-reactivity-q1',
      type: 'mcq',
      prompt: 'What does it mean for a user interface to be **reactive**?',
      options: [
        { text: 'The page reloads from the server whenever data changes.', why: 'No reload happens. Vue patches the existing page in the browser.' },
        { text: 'The screen automatically updates to match the data whenever the data changes.' },
        { text: 'The page responds quickly to clicks.', why: 'Responsiveness is about speed. Reactivity is about the UI following the state.' },
        { text: 'Every element re-renders on a timer, several times per second.', why: 'Vue does not poll. It updates only when tracked state actually changes.' },
      ],
      answer: 1,
      explanation: 'Reactivity = the UI follows the state. You change data; Vue updates the parts of the DOM that depend on it.',
    },
    {
      id: 'what-is-reactivity-q2',
      type: 'output',
      prompt: 'The button is clicked **three** times. What does the paragraph show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'

const count = ref(0)
const doubled = count.value * 2

function add() { count.value++ }
</script>

<template>
  <p>{{ count }} / {{ doubled }}</p>
  <button @click="add">+1</button>
</template>`,
      },
      options: [
        { text: '3 / 6', why: '`doubled` is not a formula. It was calculated once, when `count` was 0, and stored as a plain number.' },
        { text: '3 / 0' },
        { text: '0 / 0', why: '`count` is a ref and the template reads it, so the first number does update.' },
        { text: '1 / 2', why: 'Each click increments `count`. Nothing resets it.' },
      ],
      answer: 1,
      explanation: '`<script setup>` runs once. `const doubled = count.value * 2` takes a snapshot (0). The template re-renders when `count` changes, but `doubled` is a plain number, so it stays 0. Use `computed(() => count.value * 2)` for a live formula.',
    },
    {
      id: 'what-is-reactivity-q3',
      type: 'bug',
      prompt: 'This cart list *seems* to work. Then a teammate deletes the `cartCount` line in `add()` and the list stops updating. Click the line that is the real bug.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'

const cartCount = ref(0)
const items = []

function add(name) {
  items.push(name)
  cartCount.value++
}
</script>

<template>
  <h2>Cart ({{ cartCount }})</h2>
  <ul><li v-for="item in items" :key="item">{{ item }}</li></ul>
</template>`,
      },
      answerLine: 5,
      explanation: '`items` is a plain array, so Vue never tracks it. The list only appeared to work because changing `cartCount` re-rendered the component, and that re-render happened to read the mutated array. Make it `const items = ref([])` (and `items.value.push(name)`) — then `cartCount` can even become `computed(() => items.value.length)`.',
    },
    {
      id: 'what-is-reactivity-q4',
      type: 'fill',
      prompt: 'Complete the reactivity loop in the right order.',
      code: { lang: 'text', code: `Reactive state → ___ tracking → state change → effect ___ → DOM updated` },
      answer: [['dependency', 'Dependency'], ['triggered', 'trigger', 'Triggered']],
      explanation: 'During render, Vue tracks which state each effect reads (dependency tracking). When state changes, the effects that depend on it are triggered, re-run, and the DOM is patched.',
    },
    {
      id: 'what-is-reactivity-q5',
      type: 'mcq',
      prompt: 'Which of these changes will update the screen **automatically**? (Select all that apply.)',
      options: [
        { text: 'Setting `count.value = 5` where `count = ref(0)`' },
        { text: 'Calling `todos.value.push(todo)` where `todos = ref([])`' },
        { text: 'Running `score++` where `let score = 0`', why: 'A plain variable is invisible to Vue — nothing is tracked or triggered.' },
        { text: 'Setting `form.email = \'a@b.co\'` where `form = reactive({ email: \'\' })`' },
        { text: 'Calling `localStorage.setItem(\'theme\', \'dark\')`', why: '`localStorage` is not reactive. Vue has no idea it changed.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Only changes made through reactive state (refs, reactive objects and the arrays/objects inside them) trigger updates.',
    },
    {
      id: 'what-is-reactivity-q6',
      type: 'mcq',
      prompt: 'A click handler changes **three** different refs that the same component displays. How many times does that component re-render?',
      options: [
        { text: 'Three times — once per change.', why: 'Vue queues the component\'s update and de-duplicates it, so the three changes share one re-render.' },
        { text: 'Once, shortly after the handler finishes.' },
        { text: 'Zero — you must call a render function yourself.', why: 'Reactive changes trigger renders automatically.' },
        { text: 'It depends on how many elements show the values.', why: 'Re-rendering happens per component, not per element.' },
      ],
      answer: 1,
      explanation: 'Vue batches updates: triggered component updates go into a queue that is flushed asynchronously, so a component updates once per "tick" no matter how many of its dependencies changed. More in [nextTick()](lesson:next-tick).',
    },
    {
      id: 'what-is-reactivity-q7',
      type: 'short',
      prompt: 'In two or three sentences: what is the difference between imperative and declarative UI code, and why does reactivity make declarative code possible?',
      answer: 'Imperative code tells the browser step by step how to change the page every time data changes, so every change site must know every place the data appears. Declarative code describes what the page should look like for any state, once. Reactivity makes that possible because Vue tracks which state each part of the template reads and automatically re-renders those parts when the state changes.',
    },
  ],

  exercises: [
    {
      id: 'thermostat',
      title: 'Make a frozen thermostat reactive',
      difficulty: 'beginner',
      prompt: `
This thermostat changes its temperature in memory, but the screen never moves. Fix it so the whole display follows **one** piece of state.

- \`<span class="celsius">\` shows the temperature in °C, starting at **20**.
- \`<span class="fahrenheit">\` shows the same temperature in °F (\`°F = °C × 9 / 5 + 32\`).
- \`<p class="status">\` shows **Freezing** at 0 °C or below, **Hot** at 30 °C or above, otherwise **Mild**.
- \`<button class="warmer">\` adds 5 °C, \`<button class="colder">\` subtracts 5 °C.

Store only the Celsius value. Fahrenheit and status must be *derived* from it.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

// This number changes in memory, but the screen never updates.
let celsius = 20

function warmer() {
  celsius += 5
}

function colder() {
  celsius -= 5
}
</script>

<template>
  <p><span class="celsius">{{ celsius }}</span> °C</p>
  <p><span class="fahrenheit">68</span> °F</p>
  <p class="status">Mild</p>
  <button class="colder" @click="colder">Colder</button>
  <button class="warmer" @click="warmer">Warmer</button>
</template>`,
      },
      hints: [
        'The only state is the Celsius temperature. Make it reactive with `ref(20)` and change it through `.value`.',
        'Fahrenheit and status are formulas: `computed(() => celsius.value * 9 / 5 + 32)`. Remember to import `computed`.',
        'For the status: `computed(() => celsius.value <= 0 ? \'Freezing\' : celsius.value >= 30 ? \'Hot\' : \'Mild\')`, then show `{{ fahrenheit }}` and `{{ status }}` in the template.',
      ],
      solution: {
        explanation: 'One ref holds the only real fact (the Celsius temperature). Fahrenheit and status are computed from it, so they can never disagree with it — and the buttons only change one number.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const celsius = ref(20)

const fahrenheit = computed(() => celsius.value * 9 / 5 + 32)

const status = computed(() => {
  if (celsius.value <= 0) return 'Freezing'
  if (celsius.value >= 30) return 'Hot'
  return 'Mild'
})

function warmer() {
  celsius.value += 5
}

function colder() {
  celsius.value -= 5
}
</script>

<template>
  <p><span class="celsius">{{ celsius }}</span> °C</p>
  <p><span class="fahrenheit">{{ fahrenheit }}</span> °F</p>
  <p class="status">{{ status }}</p>
  <button class="colder" @click="colder">Colder</button>
  <button class="warmer" @click="warmer">Warmer</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts at 20 °C / 68 °F, Mild', code: `expect(text('.celsius')).toBe('20'); expect(text('.fahrenheit')).toBe('68'); expect(text('.status')).toBe('Mild')` },
        { name: 'Warmer adds 5 °C and Fahrenheit follows', code: `await click('.warmer'); expect(text('.celsius')).toBe('25'); expect(text('.fahrenheit')).toBe('77')` },
        { name: 'Hot at 30 °C', code: `await click('.warmer'); await click('.warmer'); expect(text('.celsius')).toBe('30'); expect(text('.status')).toBe('Hot')` },
        {
          name: 'Freezing at or below 0 °C',
          code: `for (let i = 0; i < 5; i++) await click('.colder')
expect(text('.celsius')).toBe('-5')
expect(text('.fahrenheit')).toBe('23')
expect(text('.status')).toBe('Freezing')`,
        },
      ],
    },
    {
      id: 'message-box',
      title: 'A message box with a live character limit',
      difficulty: 'beginner',
      prompt: `
Build a short-message box where several parts of the UI follow what the user types.

- A \`<textarea class="message">\` bound to the message (starts empty).
- \`<span class="count">\` shows **\`<length> / 50\`**, e.g. \`0 / 50\`, \`5 / 50\`.
- \`<p class="warning">\` saying *Too long!* is shown **only** when the message is longer than 50 characters.
- \`<button class="send">\` is **disabled** when the message is empty or longer than 50 characters.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const message = ref('')
</script>

<template>
  <textarea class="message"></textarea>
  <span class="count">0 / 50</span>
  <p class="warning">Too long!</p>
  <button class="send">Send</button>
</template>`,
      },
      hints: [
        'Bind the textarea with `v-model="message"` so typing updates the ref.',
        'Show `{{ message.length }} / 50`, and use `v-if="message.length > 50"` on the warning.',
        'A computed like `const tooLong = computed(() => message.value.length > 50)` keeps the template readable: `:disabled="message.length === 0 || tooLong"`.',
      ],
      solution: {
        explanation: 'The message is the single source of truth. The counter, the warning and the button\'s disabled state are all derived from it, so typing one character updates all three consistently.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const LIMIT = 50
const message = ref('')

const tooLong = computed(() => message.value.length > LIMIT)
const canSend = computed(() => message.value.length > 0 && !tooLong.value)
</script>

<template>
  <textarea class="message" v-model="message"></textarea>
  <span class="count">{{ message.length }} / {{ LIMIT }}</span>
  <p v-if="tooLong" class="warning">Too long!</p>
  <button class="send" :disabled="!canSend">Send</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts at 0 / 50 with Send disabled and no warning', code: `expect(text('.count')).toBe('0 / 50'); expect(find('.send').disabled).toBe(true); expect(exists('.warning') && isVisible('.warning')).toBe(false)` },
        { name: 'typing updates the counter and enables Send', code: `await type('.message', 'Hello'); expect(text('.count')).toBe('5 / 50'); expect(find('.send').disabled).toBe(false)` },
        {
          name: 'over 50 characters shows the warning and disables Send',
          code: `await type('.message', 'x'.repeat(51))
expect(text('.count')).toBe('51 / 50')
expect(isVisible('.warning')).toBe(true)
expect(find('.send').disabled).toBe(true)`,
        },
        { name: 'exactly 50 characters is allowed', code: `await type('.message', 'y'.repeat(50)); expect(exists('.warning') && isVisible('.warning')).toBe(false); expect(find('.send').disabled).toBe(false)` },
      ],
    },
  ],

  interview: [
    {
      id: 'what-is-reactivity-definition',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is reactivity in Vue, and what problem does it solve?',
      answer: 'Reactivity is Vue\'s system for keeping the UI in sync with state automatically. Vue tracks which reactive state each component (and each computed or watcher) reads, and when that state changes it re-runs exactly those effects and patches the DOM. It removes the need to manually update every place a piece of data is displayed.',
      explanation: 'Without it, every function that changes data must also update every DOM element that shows that data — easy to forget, hard to maintain. With it, you describe the UI once and only change data.',
      whyAsked: 'It is the foundation of everything else in Vue. Interviewers want to hear "state → tracked dependencies → automatic update", not just "the page updates".',
      mistakes: [
        'Describing it as "Vue watches all variables" — plain variables are not tracked.',
        'Saying the whole page re-renders on every change.',
        'Not mentioning *why* it matters (stale UI bugs, scattered update code).',
      ],
      followUps: [
        'How does Vue know which components depend on a value?',
        'What kinds of values are not reactive?',
        'Are updates applied synchronously?',
      ],
      modelAnswer: 'Reactivity means the UI is a function of state and Vue keeps it that way automatically. When a component renders, Vue records which reactive values it read; when one of those values changes, Vue re-runs just the effects that depend on it and patches the DOM. That replaces imperative code where every change site has to update every element by hand, which is where stale-UI bugs come from. The trade-off is that state has to be created through Vue\'s APIs — ref, reactive, computed — because plain variables are invisible to it.',
    },
    {
      id: 'what-is-reactivity-declarative',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between imperative and declarative UI code? Give a small example of each.',
      answer: 'Imperative code describes *how* to change the page step by step (`el.textContent = …` in every handler). Declarative code describes *what* the page should look like for any state (`<h2>Cart ({{ cart.length }})</h2>`), and the framework works out the DOM changes.',
      explanation: 'Imperative: you are the one keeping DOM and data in sync. Declarative: you only maintain data; the template is a standing description.',
      code: {
        lang: 'js',
        code: `// Imperative
function add(item) {
  cart.push(item)
  badge.textContent = cart.length
  totalEl.textContent = sum(cart)
}

// Declarative (Vue)
// <span class="badge">{{ cart.length }}</span>
// <p>{{ total }}</p>
function add(item) {
  cart.value.push(item)
}`,
      },
      whyAsked: 'Checks whether you understand what a framework like Vue actually buys you, beyond syntax.',
      mistakes: ['Equating declarative with "uses HTML".', 'Not explaining that the declarative version needs a reactivity system (or re-rendering) underneath.'],
      followUps: ['Where does imperative code still belong in a Vue app?', 'What happens if you mix direct DOM edits with Vue rendering?'],
      modelAnswer: 'Imperative UI code tells the browser how to change the page: in every handler you find elements and update them. Declarative code states what the page should look like for a given state, like `{{ cart.length }}` in a template, and the framework derives the DOM operations. Vue makes the declarative version work through reactivity: it knows which state the template uses and re-renders when it changes. Imperative code still has a place — focusing an input, integrating a chart library — but through template refs, not by editing Vue-managed DOM.',
    },
    {
      id: 'what-is-reactivity-whole-page',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'When one piece of state changes, does Vue re-render the whole page?',
      options: [
        'Yes — every component re-renders on any change',
        'No — only effects that read the changed state re-run, and only the changed DOM nodes are patched',
        'No — Vue never re-renders; it edits the DOM directly from the setter',
        'Yes, but only once per second',
      ],
      correctOption: 1,
      answer: 'No. Vue tracks dependencies per effect. Only the components (and computeds/watchers) that read the changed state are re-run. Inside a re-rendered component, Vue diffs the new virtual DOM against the old one and patches only what changed. Child components re-render only if their props or their own dependencies changed.',
      explanation: 'Granularity is the component: a component\'s render effect re-runs as a whole, but unrelated components are untouched, and the real DOM receives only the minimal patch.',
      whyAsked: 'Separates people who think "framework = re-render everything" from people who understand dependency tracking — important for reasoning about performance.',
      mistakes: [
        'Claiming Vue updates individual DOM nodes without re-running render functions.',
        'Forgetting that a parent re-render can update children when the props it passes change.',
        'Thinking that more elements showing a value means more re-renders.',
      ],
      followUps: ['What happens if a parent passes a new object literal as a prop on every render?', 'How would you find out which components re-render?', 'How does the virtual DOM fit in?'],
      modelAnswer: 'No. During rendering Vue records which reactive values each component reads. A change triggers only the effects subscribed to that value — usually one or a few components. The triggered component re-runs its render function, Vue diffs the new virtual DOM against the old, and applies only the differences to the real DOM. Children are re-rendered only when their props or their own reactive dependencies change, which is why keeping props stable matters for performance.',
    },
    {
      id: 'what-is-reactivity-clock-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A header shows the current time with `{{ new Date().toLocaleTimeString() }}`. It updates only when the user does something else on the page. Why, and how do you fix it?',
      code: {
        lang: 'vue',
        code: `<template>
  <header>
    <span>{{ new Date().toLocaleTimeString() }}</span>
    <button @click="count++">Clicked {{ count }} times</button>
  </header>
</template>`,
      },
      answer: 'Time is not reactive state, so nothing triggers a re-render as time passes. The clock only refreshes when an unrelated reactive change (the click counter) re-renders the component. Fix: keep the time in a ref, update it with `setInterval`, and clear the interval in `onUnmounted`.',
      explanation: 'Vue re-renders when tracked state changes, not when the world changes. Anything outside Vue — time, storage, window size — has to be copied into reactive state.',
      whyAsked: 'A realistic bug that reveals whether you understand *what* triggers renders.',
      mistakes: ['Suggesting `$forceUpdate()` on a timer instead of modelling the time as state.', 'Forgetting to clear the interval when the component unmounts.'],
      followUps: ['How would you package this as a reusable composable?', 'How would you do the same for window width?'],
      modelAnswer: 'The expression reads `Date`, which Vue can\'t track, so the component has no dependency that changes over time. It only refreshes when something reactive — the click counter — re-renders it. I would store `now` in a ref, update it every second with `setInterval`, and clear the interval in `onUnmounted`, ideally inside a `useNow()` composable. The general rule: external sources must be copied into reactive state.',
    },
    {
      id: 'what-is-reactivity-state-design',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A product page shows price, quantity, subtotal, tax, a "free shipping" badge and a Checkout button that is disabled when quantity is 0. Which of these would you store as state, and why?',
      answer: 'Store only the independent facts: the product price (usually from the API) and the selected quantity (plus the tax rate / shipping threshold as config). Subtotal, tax, the badge and the disabled flag are derived with `computed()`. Storing them separately would require keeping them in sync by hand.',
      explanation: 'Minimal state + derived values = one source of truth. Every stored copy is a chance for the UI to disagree with itself.',
      whyAsked: 'Tests state-modelling judgement, which matters more in real projects than API trivia.',
      mistakes: ['Storing subtotal and tax as refs and updating them in watchers.', 'Putting the business rules directly in the template in five places.'],
      followUps: ['When *would* you store a derived value?', 'Where would the tax rate come from in a real app, and is the client-side total trustworthy?'],
      modelAnswer: 'I would keep state minimal: price and quantity, plus configuration like the tax rate and shipping threshold. Subtotal, tax, total, the free-shipping badge and whether checkout is disabled are all computed from those, so they can never drift apart and they are cached. Syncing copies with watchers is the imperative problem coming back. One more point: the client total is only for display — the server must recalculate prices and totals at checkout.',
    },
    {
      id: 'what-is-reactivity-models',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 5,
      question: 'Compare Vue\'s approach to keeping the UI in sync with two other well-known approaches: dirty checking (AngularJS 1.x) and re-running component functions on state updates (React).',
      answer: 'AngularJS 1.x ran a digest cycle that re-evaluated watched expressions and compared them with their previous values (dirty checking). React re-runs a component function (and, by default, its descendants) when its state is set, then diffs the output. Vue tracks dependencies at runtime: reading reactive state subscribes the running effect, writing notifies only those subscribers, and a triggered component re-renders and is diffed with a virtual DOM.',
      explanation: 'Vue knows *who* depends on *what*, so a change re-runs only the effects that read it, without the developer declaring dependencies. The cost is that state must go through Vue\'s reactive wrappers (refs/proxies), with caveats such as losing reactivity when destructuring.',
      whyAsked: 'Senior candidates are expected to place Vue in the wider landscape and understand trade-offs, not just usage.',
      mistakes: [
        'Saying Vue uses dirty checking.',
        'Claiming one approach is simply "faster" without saying what work each one does.',
        'Ignoring the developer-experience trade-offs (explicit dependency arrays and memoisation vs reactive wrappers).',
      ],
      followUps: ['What are the downsides of runtime dependency tracking?', 'How do signals in other frameworks relate to Vue refs?'],
      modelAnswer: 'Dirty checking re-evaluates watched expressions after events and compares old and new values, so cost grows with the number of watchers. React re-runs component functions when state is set and relies on diffing and memoisation to limit work. Vue does runtime dependency tracking: an effect such as a component render subscribes to exactly the reactive values it reads, and a write notifies only those subscribers, which then re-render and are diffed with a virtual DOM. You get precise updates without declaring dependencies, at the cost of working through refs and proxies and knowing their caveats — destructuring, non-reactive sources and so on.',
    },
    {
      id: 'what-is-reactivity-coding-filter',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 7,
      question: 'Build a live fruit filter. An `<input class="search">` filters a list of fruits (each in an `<li class="fruit">`, case-insensitive "contains" match). A `<p class="result-count">` shows **Showing N of 5**. When nothing matches, show `<p class="empty">No fruit found</p>` instead of the list.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const fruits = ['Apple', 'Banana', 'Cherry', 'Mango', 'Orange']
</script>

<template>
  <input class="search" placeholder="Search fruit" />
  <p class="result-count">Showing 5 of 5</p>
  <ul>
    <li v-for="fruit in fruits" :key="fruit" class="fruit">{{ fruit }}</li>
  </ul>
</template>`,
        },
      },
      tests: [
        { name: 'shows all 5 fruits at first', code: `expect(findAll('.fruit')).toHaveLength(5); expect(text('.result-count')).toBe('Showing 5 of 5')` },
        { name: 'typing filters the list and the count (case-insensitive)', code: `await type('.search', 'AN'); expect(findAll('.fruit').map((li) => li.textContent.trim())).toEqual(['Banana', 'Mango', 'Orange']); expect(text('.result-count')).toBe('Showing 3 of 5')` },
        { name: 'no match shows the empty message', code: `await type('.search', 'kiwi'); expect(findAll('.fruit')).toHaveLength(0); expect(text('.empty')).toBe('No fruit found')` },
      ],
      hints: [
        'Keep the typed text in a ref bound with `v-model`.',
        'Derive the visible list with `computed(() => fruits.filter((f) => f.toLowerCase().includes(query.value.toLowerCase())))`.',
        'Loop over the computed list, and use `v-if="visible.length === 0"` for the empty message.',
      ],
      answer: 'Store only the query; derive the filtered list (and its length) with computed, and let the template render from it.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const fruits = ['Apple', 'Banana', 'Cherry', 'Mango', 'Orange']
const query = ref('')

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return fruits.filter((fruit) => fruit.toLowerCase().includes(q))
})
</script>

<template>
  <input class="search" v-model="query" placeholder="Search fruit" />
  <p class="result-count">Showing {{ visible.length }} of {{ fruits.length }}</p>
  <p v-if="visible.length === 0" class="empty">No fruit found</p>
  <ul v-else>
    <li v-for="fruit in visible" :key="fruit" class="fruit">{{ fruit }}</li>
  </ul>
</template>`,
        },
      },
      explanation: 'The only state is what the user typed. The list, the count and the empty message are all derived from it, so they update together on every keystroke. `fruits` never changes, so it can stay a plain constant.',
      whyAsked: 'A classic warm-up: do you reach for state + derived values, or do you write input handlers that manually rebuild the list?',
      mistakes: ['Keeping a second `filtered` ref and updating it in an `@input` handler.', 'Mutating the original `fruits` array when filtering.'],
      followUps: ['How would you debounce the search for a server-side query?', 'Why is it fine for `fruits` to be a plain array here?'],
      modelAnswer: 'I keep one ref for the query, bound with v-model, and compute the filtered list from it. The count and the empty state read the computed list, so everything stays consistent and the filter only re-runs when the query changes. The fruit list itself never changes, so it can be a plain constant. For a server-side search I would watch the query with a debounce instead of filtering locally.',
    },
  ],

  takeaways: [
    'Reactivity means the UI automatically follows the state: change data, and Vue updates the page.',
    'Imperative code updates the DOM by hand in every handler; declarative templates describe the page once.',
    'The loop: reactive state → dependency tracking (reads subscribe) → state change → effect triggered → DOM patched.',
    'Only state created with Vue\'s reactive APIs is tracked — plain variables, time and storage are invisible.',
    'Store the minimum and derive the rest; updates are batched and applied right after your code finishes.',
  ],
}
