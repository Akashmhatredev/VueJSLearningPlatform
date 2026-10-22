// Lesson: opting out of deep reactivity — shallowRef, triggerRef, shallowReactive,
// shallowReadonly, markRaw and toRaw.

const catalogApp = `<script setup>
import { shallowRef, triggerRef, computed } from 'vue'

const products = shallowRef([
  { id: 1, name: 'Keyboard', price: 49, inStock: true },
  { id: 2, name: 'Mouse', price: 19, inStock: false },
  { id: 3, name: 'Monitor', price: 179, inStock: true },
])

const inStockCount = computed(
  () => products.value.filter((p) => p.inStock).length
)

// Mutates the object in place: a shallowRef does NOT notice.
function restockInPlace(product) {
  product.inStock = true
}

// Replaces .value with a new array: a shallowRef DOES notice.
function restockByReplacing(product) {
  products.value = products.value.map((p) =>
    p.id === product.id ? { ...p, inStock: true } : p
  )
}
</script>

<template>
  <p class="summary">{{ inStockCount }} of {{ products.length }} in stock</p>
  <ul>
    <li v-for="product in products" :key="product.id" class="product">
      <strong>{{ product.name }}</strong>
      <span class="status">{{ product.inStock ? 'In stock' : 'Sold out' }}</span>
      <button class="in-place" @click="restockInPlace(product)">Restock (in place)</button>
      <button class="replace" @click="restockByReplacing(product)">Restock (replace)</button>
    </li>
  </ul>
</template>`

const priceFormatter = `// Pretend this class comes from a third-party library.
// It keeps its settings in a JavaScript private field (#symbol).
export class PriceFormatter {
  #symbol

  constructor(symbol) {
    this.#symbol = symbol
  }

  format(amount) {
    return this.#symbol + amount.toFixed(2)
  }
}`

const miniChart = `// Pretend this class comes from a third-party charting library.
export class MiniChart {
  #points = []

  add(value) {
    this.#points.push(value)
  }

  get count() {
    return this.#points.length
  }

  get total() {
    return this.#points.reduce((sum, n) => sum + n, 0)
  }
}`

export default {
  id: 'shallow-and-raw',
  title: 'shallowRef, triggerRef, markRaw & toRaw',
  summary: 'Turn Vue\'s deep reactivity down (or off) for large data and third-party objects — shallow refs and objects, manual triggering, raw markers and the escape hatch back to the original.',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['ref', 'reactive'],
  related: ['reactivity-utilities', 'how-reactivity-works', 'runtime-performance', 'large-lists', 'custom-ref'],
  tags: ['shallowRef', 'triggerRef', 'shallowReactive', 'shallowReadonly', 'markRaw', 'toRaw', 'performance', 'deep reactivity', 'third-party libraries', 'immutable data'],
  apis: [
    { name: 'shallowRef()', summary: 'A ref whose `.value` assignment is tracked, but whose inner value is stored as-is (not made deeply reactive).' },
    { name: 'triggerRef()', summary: 'Forces effects that depend on a shallow ref to run, after you mutated its inner value.' },
    { name: 'shallowReactive()', summary: 'A reactive object where only root-level properties are reactive; nested values and refs are left as-is.' },
    { name: 'shallowReadonly()', summary: 'A readonly object where only root-level properties are readonly.' },
    { name: 'markRaw()', summary: 'Marks an object so Vue never converts it to a proxy. Returns the object itself.' },
    { name: 'toRaw()', summary: 'Returns the original object behind a reactive/readonly proxy.' },
  ],
  docs: [
    { label: 'API — Reactivity: Advanced (shallowRef, triggerRef, markRaw, toRaw…)', url: 'https://vuejs.org/api/reactivity-advanced.html' },
    { label: 'Vue Guide — Performance: reduce reactivity overhead for large immutable structures', url: 'https://vuejs.org/guide/best-practices/performance.html#reduce-reactivity-overhead-for-large-immutable-structures' },
    { label: 'Vue Guide — Reactivity in Depth: integration with external state systems', url: 'https://vuejs.org/guide/extras/reactivity-in-depth.html#integration-with-external-state-systems' },
  ],

  intro: `
By default Vue's reactivity is **deep**: put an object into \`ref()\` or \`reactive()\` and every nested object, array and property inside it becomes reactive too. That's what makes \`order.shipping.city = 'Pune'\` "just work".

Most of the time deep is exactly right. This lesson is about the times it isn't — and the six tools Vue gives you to turn reactivity **down** (\`shallowRef\`, \`shallowReactive\`, \`shallowReadonly\`), **nudge** it manually (\`triggerRef\`), switch it **off** for one object (\`markRaw\`) and **step around** it (\`toRaw\`).

They're power tools. You won't need them every day, but when you do, nothing else fits.
`,

  why: [
    `
Deep reactivity has a cost, and occasionally it gets in the way:

- **Big data you only ever replace.** A report screen loads a large table from the server, shows it, and replaces the *whole* table when filters change. Nobody edits a single cell. Making every row and cell reactive is work with no benefit.
- **Objects owned by someone else.** A map widget, a chart instance, a rich-text editor — these libraries manage their own internal state. Wrapping them in proxies can make Vue track thousands of internal reads, and some objects simply break inside a proxy.
- **Exporting data out of Vue.** Some browser APIs refuse proxies outright:
`,
    {
      code: `const settings = reactive({ theme: 'dark', fontSize: 16 })

structuredClone(settings)        // ❌ DataCloneError: a Proxy can't be cloned
structuredClone(toRaw(settings)) // ✅ clone the original object behind it`,
      lang: 'js',
      title: 'proxies and the structured clone algorithm',
    },
    `
Shallow and raw APIs exist so you can keep Vue's reactivity where it helps and switch it off where it costs or breaks — **after you've seen a real problem**, not by default.
`,
  ],

  eli15: `
Imagine a delivery desk in a big office.

**Deep reactivity** is a super-careful receptionist who opens *every* parcel, catalogues *every* item inside, and rings the right people whenever any item is moved. Brilliant — but slow when a lorry delivers a thousand boxes nobody will ever open.

**\`shallowRef\`** is a receptionist who only notices when a **new parcel** arrives. If you open the parcel and rearrange things inside, they don't notice. Swap in a new parcel and they ring everyone.

**\`triggerRef\`** is you walking up to that receptionist and saying "I changed what's inside — please ring everyone anyway."

**\`markRaw\`** is a "DO NOT OPEN" sticker. Some parcels — like a delicate machine from another company — should never be unpacked by the receptionist.

**\`toRaw\`** is reaching past the receptionist to grab the actual parcel directly — handy when you need to post it somewhere else, but anything you change that way goes unnoticed.
`,

  analogy: {
    title: 'The delivery desk',
    body: `
A deep receptionist catalogues everything; a shallow one only watches the door. Neither is "better" — a hospital pharmacy wants the careful one, a warehouse receiving sealed pallets wants the fast one.

Vue lets you hire the right receptionist per piece of state. The important part is knowing what each one *won't* notice, so you change data in a way they will.
`,
    mapping: [
      ['the careful receptionist who opens every parcel', '`ref()` / `reactive()` — deep reactivity'],
      ['a receptionist who only notices new parcels', '`shallowRef()` — only `.value` assignment is tracked'],
      ['watching only the ground-floor rooms', '`shallowReactive()` — only root-level properties are tracked'],
      ['"I changed the contents — ring everyone"', '`triggerRef(ref)`'],
      ['a "DO NOT OPEN" sticker', '`markRaw(obj)` — never turned into a proxy'],
      ['reaching past the desk for the actual parcel', '`toRaw(proxy)` — the original object, untracked'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Deep vs shallow: what gets tracked',
    caption: 'Step through the same data held in `ref()` and in `shallowRef()`. Highlighted boxes are the levels Vue tracks.',
    alt: 'Two rows of three boxes. Top row, deep: ref(products) → .value (array, reactive) → products[1].inStock (tracked). Bottom row, shallow: shallowRef(products) → .value (tracked only on assignment) → products[1].inStock (not tracked). Steps show that a nested write triggers updates only in the deep row, that replacing .value or calling triggerRef updates the shallow row, and that markRaw stops an object from being proxied at all.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'deep', label: 'ref(products)', note: 'deep', x: 120, y: 80, tone: 'acid' },
        { id: 'deep-arr', label: '.value → array', note: 'reactive proxy', x: 380, y: 80, tone: 'acid' },
        { id: 'deep-leaf', label: 'products[1].inStock', note: 'tracked', x: 640, y: 80, tone: 'acid' },
        { id: 'shallow', label: 'shallowRef(products)', note: 'shallow', x: 120, y: 240, tone: 'cobalt' },
        { id: 'shallow-arr', label: '.value → array', note: 'plain array', x: 380, y: 240, tone: 'paper' },
        { id: 'shallow-leaf', label: 'products[1].inStock', note: 'NOT tracked', x: 640, y: 240, tone: 'red' },
      ],
      edges: [
        { from: 'deep', to: 'deep-arr', label: 'tracked' },
        { from: 'deep-arr', to: 'deep-leaf', label: 'tracked' },
        { from: 'shallow', to: 'shallow-arr', label: 'tracked (.value)' },
        { from: 'shallow-arr', to: 'shallow-leaf', label: 'not tracked', dashed: true },
      ],
      steps: [
        { focus: ['deep', 'deep-arr', 'deep-leaf'], edges: ['deep->deep-arr', 'deep-arr->deep-leaf'], text: '**Deep (`ref`).** The array inside `.value` is converted with `reactive()`, and each product object becomes a proxy the moment you access it. `products.value[1].inStock = true` triggers updates.' },
        { focus: ['shallow', 'shallow-arr'], edges: ['shallow->shallow-arr'], text: '**Shallow (`shallowRef`).** Vue tracks reading and assigning `.value` — and nothing below it. The array and its objects are stored exactly as you gave them: plain, unproxied.' },
        { focus: ['shallow-leaf'], edges: ['shallow-arr->shallow-leaf'], text: '**A nested write is invisible.** `products.value[1].inStock = true` changes the object, but no effect is triggered. The screen keeps showing the old value until something else re-renders it.' },
        { focus: ['shallow', 'shallow-arr'], text: '**Two ways to update a shallowRef:** assign a *new* value (`products.value = products.value.map(...)`) — the immutable style — or mutate and then call `triggerRef(products)`.' },
        { focus: ['deep-arr', 'shallow-arr'], text: '**`markRaw(obj)`** goes one step further for a single object: even inside deep state, Vue will never wrap it in a proxy. **`toRaw(proxy)`** walks the other way — from a proxy back to the original object.' },
      ],
    },
  },

  syntax: [
    `
#### shallowRef() and triggerRef()
`,
    {
      code: `import { shallowRef, triggerRef } from 'vue'

const rows = shallowRef([])          // inner array stays a plain array

rows.value = await fetchRows()       // ✅ assignment is tracked → updates
rows.value[0].name = 'Ada'           // ❌ nested change: not tracked
rows.value.push(newRow)              // ❌ mutation inside: not tracked
rows.value = rows.value              // ❌ same object (Object.is) → no trigger

rows.value = [...rows.value, newRow] // ✅ new array → updates
rows.value.push(newRow)
triggerRef(rows)                     // ✅ "I mutated it — run the effects anyway"`,
      lang: 'js',
      title: 'shallowRef: only .value assignment counts',
    },
    `
#### shallowReactive() and shallowReadonly()
`,
    {
      code: `import { shallowReactive, shallowReadonly, ref } from 'vue'

const state = shallowReactive({
  page: 1,                     // root property: reactive
  filters: { search: '' },     // nested object: stored as-is, NOT reactive
  total: ref(0),               // refs are NOT unwrapped: use state.total.value
})

state.page++                   // ✅ triggers
state.filters.search = 'vue'   // ❌ not tracked
state.filters = { search: 'vue' } // ✅ replacing a root property triggers

const config = shallowReadonly({ theme: 'dark', colors: { primary: '#41b883' } })
config.theme = 'light'         // ❌ blocked (warning in dev)
config.colors.primary = 'red'  // ⚠️ allowed: only the root level is readonly`,
      lang: 'js',
      title: 'only the root level',
    },
    `
#### markRaw() and toRaw()
`,
    {
      code: `import { reactive, markRaw, toRaw, isReactive } from 'vue'

const editor = markRaw(new RichTextEditor('#editor')) // returns the same object
const state = reactive({ editor, wordCount: 0 })

isReactive(state.editor)   // false — never proxied
state.editor === editor    // true  — identity preserved

const form = reactive({ name: 'Ada', tags: ['math'] })
const original = toRaw(form)          // the plain object behind the proxy
structuredClone(original)             // ✅ works (proxies can't be cloned)
original.name = 'Grace'               // ⚠️ changes data but triggers NOTHING`,
      lang: 'js',
      title: 'opting out, and stepping around',
    },
    `
**The rules:**

1. With \`shallowRef\`, change data by **assigning a new value** to \`.value\`. If you must mutate in place, call \`triggerRef()\` afterwards.
2. Assigning the **same object** back to a shallow ref does nothing — Vue compares with \`Object.is\`.
3. \`shallowReactive\` / \`shallowReadonly\` only affect **root-level** properties, and they **don't unwrap refs**. The Vue docs advise using them only for root-level state, not nested inside deep reactive objects.
4. \`markRaw\` affects only the object you mark. Nested objects inside it aren't marked — if one of them is later put into reactive state on its own, it gets proxied.
5. \`toRaw\` is an **escape hatch** for short, deliberate uses (cloning, handing data to a library, a bulk read without tracking). Don't keep raw objects around as your working state.
`,
    {
      callout: 'version',
      text: 'These are part of Vue 3\'s **advanced** reactivity API, imported from `\'vue\'`. Treat them as optimisations and integration tools: reach for them when you have a measured performance problem or an object that must not be proxied.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: catalogApp,
    intro: 'A product list held in a shallowRef, with two "restock" buttons per product: one that mutates in place and one that replaces the array. Predict which one works before you run it.',
    steps: [
      { lines: [2], text: 'We import `shallowRef`, plus `triggerRef` (used in the first experiment) and `computed`.' },
      { lines: [4, 8], text: '`shallowRef([...])` stores the array **as-is**. Vue tracks `products.value` itself, but the array and the product objects inside it are plain JavaScript — no proxies.' },
      { lines: [10, 12], text: 'The computed reads `products.value` (tracked) and then `p.inStock` on plain objects (not tracked). It will only recalculate when `.value` is assigned a new array.' },
      { lines: [15, 17], text: '`product.inStock = true` changes a plain object. No proxy sees the write, so nothing re-renders. The data is changed; the screen is not.' },
      { lines: [20, 24], text: 'The immutable style: build a **new** array with a **new** object for the changed product, then assign it to `.value`. That assignment is tracked, so the list and the computed update.' },
      { lines: [28], text: 'The summary reads the computed and `products.length` through `.value` (unwrapped in the template).' },
      { lines: [30, 35], text: 'Each product gets both buttons. Try "in place" on the Mouse first — nothing happens. Then press "replace" on *any* product and watch the Mouse change too: the re-render reads the object you silently mutated earlier.' },
    ],
  },

  playground: {
    title: 'A shallow product catalogue',
    objective: 'Feel exactly what a shallowRef notices, then fix updates with triggerRef and immutable replacement, and protect a third-party object with markRaw.',
    files: { 'App.vue': catalogApp, 'PriceFormatter.js': priceFormatter },
    expected: '**2 of 3 in stock** and three products. "Restock (replace)" on the Mouse updates it to *In stock* and the summary to 3 of 3. "Restock (in place)" appears to do nothing — until another change re-renders the list and the hidden mutation suddenly shows up.',
    experiments: [
      {
        id: 'trigger-ref',
        task: 'Make **Restock (in place)** work *without* switching to the immutable style: keep the mutation, and tell Vue about it.',
        hint: 'After `product.inStock = true`, call `triggerRef(products)` — it is already imported.',
        tests: [
          {
            name: 'restocking the Mouse in place updates the screen',
            code: `await click(findAll('.in-place')[1])
expect(findAll('.status')[1].textContent.trim()).toBe('In stock')
expect(text('.summary')).toBe('3 of 3 in stock')`,
          },
        ],
        explain: '`triggerRef()` runs every effect that depends on the shallow ref — the component render and the `inStockCount` computed — as if `.value` had been replaced. Useful when copying a large structure on every change would be wasteful.',
      },
      {
        id: 'add-product',
        task: 'Add a `<button class="add">` that adds **Webcam** (id 4, price 59, in stock) to the list. Try `products.value.push(...)` first and see what happens, then fix it.',
        hint: 'Replace the array: `products.value = [...products.value, { id: 4, name: \'Webcam\', price: 59, inStock: true }]`.',
        tests: [
          {
            name: 'Add puts a fourth product on screen and updates the summary',
            code: `expect(exists('.add')).toBe(true)
await click('.add')
expect(findAll('.product')).toHaveLength(4)
expect(text('.summary')).toBe('3 of 4 in stock')`,
          },
        ],
        explain: '`push` mutates the array in place, which a shallowRef can\'t see. Spreading into a new array and assigning it to `.value` is the change a shallowRef is built to notice.',
      },
      {
        id: 'mark-raw',
        task: '`PriceFormatter.js` is a "third-party" class with a private field. Show each product\'s price in a `<span class="price">` formatted with a formatter kept in reactive settings: `const settings = reactive({ formatter: new PriceFormatter(\'€\') })` and `settings.formatter.format(product.price)`. Run it, read the console error, then fix it.',
        hint: 'Wrap the instance: `reactive({ formatter: markRaw(new PriceFormatter(\'€\')) })` — import `reactive` and `markRaw` from \'vue\' and `PriceFormatter` from \'./PriceFormatter.js\'.',
        tests: [
          {
            name: 'prices are formatted by the third-party formatter',
            code: `expect(findAll('.price').map((el) => el.textContent.trim())).toEqual(['€49.00', '€19.00', '€179.00'])`,
          },
        ],
        explain: 'Inside `reactive()`, the instance is wrapped in a proxy, so `format()` runs with `this` set to the proxy — and JavaScript forbids reading `#symbol` through a proxy ("Cannot read private member"). `markRaw` keeps the original object. (Simply keeping the formatter in a plain `const`, outside reactive state, is an equally good fix.)',
      },
      {
        id: 'go-deep',
        task: 'For comparison, change `shallowRef` to `ref` (and import `ref`). Click "Restock (in place)" again. Then add `console.log(isReactive(products.value))` with each version and compare.',
        hint: 'Import `isReactive` from \'vue\'. Check the Console tab after each run.',
        explain: 'With `ref()` the array is converted with `reactive()`, so in-place mutations are tracked and `isReactive(products.value)` is `true`. With `shallowRef()` it is `false`: the data is plain. Deep is the convenient default; shallow trades convenience for less tracking work.',
      },
    ],
  },

  animation: {
    type: 'performance',
    props: { demo: 'shallow' },
    title: 'Deep vs shallow, measured in your browser',
    caption: 'A live demo that compares holding the same data in deep and shallow state, using real counts and timings from your own browser. Results vary by device — the point is the *kind* of work each approach does.',
    alt: 'A performance demo comparing deep reactive state with shallowRef for the same dataset, showing measured timings and counts gathered live in the learner\'s browser.',
  },

  internals: {
    beginner: `
With deep reactivity, Vue wraps each nested object in a proxy the first time you touch it, and records every property your components read. That bookkeeping is what lets *any* change anywhere update the screen.

Shallow APIs stop the bookkeeping at the first level. \`markRaw\` puts a "skip me" mark on one object. \`toRaw\` lets you grab the real object behind the proxy. Less bookkeeping means less work — and also fewer changes Vue will notice for you.
`,
    technical: [
      `
- **\`shallowRef(value)\`** is a ref that stores \`value\` as-is instead of passing objects through \`reactive()\`. Reading \`.value\` tracks; assigning \`.value\` triggers only if \`Object.is(old, new)\` is false. That's why mutating and re-assigning the *same* object does nothing.
- **\`triggerRef(ref)\`** directly triggers the effects subscribed to that ref — the same notification a real assignment would send.
- **\`shallowReactive(obj)\`** is a Proxy whose \`get\` trap tracks root properties but returns nested values untouched (no lazy wrapping) and doesn't unwrap refs. **\`shallowReadonly(obj)\`** blocks writes to root properties only.
- **\`markRaw(obj)\`** sets a hidden flag on the object (an implementation detail) that makes \`reactive()\` return it unchanged. Vue also currently leaves non-extensible objects (for example, ones passed to \`Object.freeze\`) unproxied — but \`markRaw\` is the explicit, documented way to opt out.
- **\`toRaw(proxy)\`** follows the proxy back to its target (recursively, for proxies of proxies). Nested values inside the raw object are usually raw too, because reactive \`set\` stores the raw version of values you assign.
`,
      {
        code: `// A SIMPLIFIED model of shallowRef + triggerRef — not Vue's real source.
function shallowRef(initial) {
  let inner = initial            // stored as-is: no reactive() conversion
  const dep = new Set()
  const r = {
    get value() {
      track(dep)                 // reading .value subscribes
      return inner
    },
    set value(next) {
      if (Object.is(next, inner)) return   // same object → nothing happens
      inner = next
      trigger(dep)               // a NEW value notifies subscribers
    },
    dep,
  }
  return r
}

function triggerRef(r) {
  trigger(r.dep)                 // notify without a new value
}`,
        lang: 'js',
        title: 'what "shallow" means (simplified)',
      },
      `
**Why some objects break inside a proxy.** JavaScript private fields (\`#symbol\`) are attached to the *original* object. When a method runs through a proxy, \`this\` is the proxy, and the private-field lookup throws a \`TypeError\`. Built-in objects with internal slots behave similarly. Vue's own \`Map\`/\`Set\` support exists precisely because collections needed special handling. \`markRaw\` (or keeping the object out of reactive state) avoids the problem entirely.
`,
    ],
    production: `
- **Measure first.** Deep reactivity is fast enough for typical app state. Use the [performance tools](lesson:measuring-performance) to find a real cost before switching to shallow state — and remember that rendering a huge list is often the bigger cost ([large lists](lesson:large-lists)).
- **Large, replace-only data → \`shallowRef\` + immutable updates.** API payloads, report tables, chart series, search results. The Vue performance guide recommends exactly this for large immutable structures.
- **Third-party instances → \`markRaw\` or outside reactive state.** Map, chart, editor, video-player and SDK client instances should never be deeply proxied. Keep the instance raw, and mirror only the few values your UI shows into small refs.
- **External state systems** (immutable-data libraries, state machines, observables) integrate best through a \`shallowRef\` that you replace whenever the external state emits a new snapshot — the approach the Vue docs describe.
- **\`toRaw\` for the boundary:** \`structuredClone\`, \`postMessage\` to a worker and IndexedDB all use the structured clone algorithm, which rejects proxies. Pass \`toRaw(state)\` (for plain data). Don't write through raw objects to "skip" updates — that's how stale UIs are born.
- **Avoid mixing raw and proxied versions** of the same object in one structure. Identity checks (\`===\`, \`includes\`, \`Map\` keys) start giving different answers depending on which version you hold.
`,
  },

  mistakes: [
    {
      title: 'Mutating inside a shallowRef and expecting an update',
      wrong: { code: `const todos = shallowRef([])\n\nfunction add(todo) {\n  todos.value.push(todo)        // nothing re-renders\n}`, lang: 'js' },
      right: { code: `const todos = shallowRef([])\n\nfunction add(todo) {\n  todos.value = [...todos.value, todo]   // new array → tracked\n}`, lang: 'js' },
      explanation: 'A shallowRef only notices assignments to `.value`. Replace the value (or mutate and call `triggerRef(todos)`).',
    },
    {
      title: 'Re-assigning the same mutated object',
      wrong: { code: `rows.value[0].done = true\nrows.value = rows.value   // same object → Object.is says "unchanged"`, lang: 'js' },
      right: { code: `rows.value[0].done = true\ntriggerRef(rows)          // explicit "I changed it"`, lang: 'js' },
      explanation: 'Vue skips a trigger when the new value is identical to the old one. Assign a genuinely new object, or use `triggerRef`.',
    },
    {
      title: 'Putting a third-party instance into deep reactive state',
      wrong: { code: `const state = reactive({ map: null })\nonMounted(() => {\n  state.map = new MapWidget('#map') // proxied: slow, and may throw on private fields\n})`, lang: 'js' },
      right: { code: `const state = reactive({ map: null })\nonMounted(() => {\n  state.map = markRaw(new MapWidget('#map'))\n})\n// or simply: let map = null (outside reactive state)`, lang: 'js' },
      explanation: 'Library objects manage their own state. Proxying them is wasted tracking at best and a `TypeError` at worst. Mark them raw, or keep them in a plain variable.',
    },
    {
      title: 'Keeping a toRaw() copy as working state',
      wrong: { code: `const cart = reactive({ items: [] })\nconst rawCart = toRaw(cart)\n\nrawCart.items.push(item)   // data changes, screen doesn't`, lang: 'js' },
      right: { code: `cart.items.push(item)                          // through the proxy\nsendToWorker(structuredClone(toRaw(cart)))     // raw only at the boundary`, lang: 'js' },
      explanation: 'Writes through the raw object bypass tracking entirely. Use `toRaw` briefly, at boundaries — never as the object you work with.',
    },
    {
      title: 'Assuming markRaw protects nested objects',
      wrong: { code: `const raw = markRaw({ nested: { count: 0 } })\nconst state = reactive({ nested: raw.nested })\n\nstate.nested === raw.nested   // false — the nested object WAS proxied`, lang: 'js' },
      right: { code: `const nested = markRaw({ count: 0 })\nconst state = reactive({ nested })\n\nstate.nested === nested       // true`, lang: 'js' },
      explanation: '`markRaw` marks only the object you pass it. Mark exactly the object that must stay raw.',
    },
  ],

  debugging: [
    {
      symptom: 'Data in a shallowRef changes (console shows it) but the screen does not.',
      cause: 'The inner value was mutated in place; only `.value` assignments are tracked.',
      fix: 'Assign a new value (`x.value = [...x.value, item]`) or call `triggerRef(x)` after the mutation.',
    },
    {
      symptom: 'A hidden change suddenly appears on screen after an unrelated update.',
      cause: 'An untracked mutation (shallow state or a raw object) was picked up when something else re-rendered the component.',
      fix: 'Make every change through a tracked path, so updates happen when the data changes — not by accident later.',
    },
    {
      symptom: '`TypeError: Cannot read private member … from an object whose class did not declare it`.',
      cause: 'A class instance with private fields was wrapped in a reactive proxy (e.g. stored in `ref()`/`reactive()`).',
      fix: 'Wrap it with `markRaw()`, store it in a `shallowRef`, or keep it outside reactive state.',
    },
    {
      symptom: '`DataCloneError` from `structuredClone`, `postMessage` or IndexedDB.',
      cause: 'A reactive proxy was passed to an API that uses the structured clone algorithm.',
      fix: 'Pass `toRaw(state)` (for plain data), or a JSON copy if the data is JSON-safe.',
    },
    {
      symptom: 'A nested property of a `shallowReactive` object shows a stale value until another root property changes.',
      cause: 'Only root-level properties are reactive in a shallowReactive object.',
      fix: 'Replace the nested object (`state.user = { ...state.user, name }`), or use `reactive()` if you need deep tracking.',
    },
  ],

  bestPractices: [
    'Start with `ref()`/`reactive()`; switch to shallow APIs only for a measured cost or an object that must not be proxied.',
    'With `shallowRef`, use immutable updates (new arrays/objects); reserve `triggerRef` for cases where copying would be wasteful.',
    'Keep third-party instances raw (`markRaw` or plain variables) and mirror only the values the UI shows into small refs.',
    'Use `toRaw` only at boundaries (cloning, workers, storage, libraries) — never as working state.',
    'Use `shallowReactive`/`shallowReadonly` only for root-level state, not nested inside deep reactive trees.',
    'Leave a short comment explaining *why* a value is shallow or raw — the next reader will thank you.',
  ],

  useCases: [
    'Large API payloads (report tables, analytics series) replaced wholesale when filters change: `shallowRef`.',
    'Map, chart, editor or video-player instances held by a component: `markRaw` or a plain variable.',
    'Integrating immutable-data libraries or state machines by replacing a `shallowRef` with each new snapshot.',
    'Saving undo snapshots or sending state to a Web Worker: `structuredClone(toRaw(state))`.',
    'Exposing configuration that should not be reassigned at the top level: `shallowReadonly`.',
  ],

  whenToUse: {
    use: [
      'Data you only ever replace as a whole, especially when it is large.',
      'Objects owned by a library, or class instances with private fields.',
      'Passing reactive data to APIs that reject proxies (structured clone, some libraries).',
      'Mutating a big structure in place in a hot path, then notifying once with `triggerRef`.',
    ],
    avoid: [
      'Ordinary component state — deep reactivity is simpler and fast enough.',
      'Data the user edits field by field in place (forms, editable tables) — deep tracking is what you want.',
      'As a "make it faster" switch without measuring — you trade away correctness by default for a possible gain.',
      'Holding `toRaw()` results as long-lived state.',
    ],
  },

  comparison: {
    title: 'Deep vs shallow containers',
    headers: ['', '`ref()`', '`shallowRef()`', '`reactive()`', '`shallowReactive()`'],
    rows: [
      ['What is tracked', '`.value` and everything nested', 'only `.value` (read/assign)', 'every property, at every depth', 'root-level properties only'],
      ['Nested objects', 'converted to reactive proxies', 'stored as-is (plain)', 'proxied lazily on access', 'stored as-is (plain)'],
      ['Refs stored inside', 'unwrapped inside reactive objects', 'left as-is', 'unwrapped (not in arrays/Maps)', '**not** unwrapped'],
      ['After a nested mutation', 'updates automatically', 'replace `.value` or `triggerRef()`', 'updates automatically', 'replace the root property'],
      ['Typical use', 'default state', 'large/immutable data, external state', 'grouped state mutated in place', 'rare: large root-level objects'],
    ],
    note: '`markRaw()` opts a single object out of all of these; `toRaw()` returns the original behind a proxy. For how proxies and tracking work underneath, see [How reactivity works](lesson:how-reactivity-works).',
  },

  quiz: [
    {
      id: 'shallow-and-raw-q1',
      type: 'mcq',
      prompt: 'Given `const stats = shallowRef({ visits: 0 })`, which of these update a template that shows `{{ stats.visits }}`? (Select all that apply.)',
      options: [
        { text: '`stats.value.visits++`', why: 'A nested mutation — a shallowRef only tracks `.value` itself.' },
        { text: '`stats.value = { visits: 1 }`' },
        { text: '`stats.value.visits++` followed by `stats.value = stats.value`', why: 'Assigning the same object is skipped: `Object.is(old, new)` is true.' },
        { text: '`stats.value.visits++` followed by `triggerRef(stats)`' },
      ],
      answer: [1, 3],
      explanation: 'A shallowRef reacts to assigning a *different* value to `.value`, or to an explicit `triggerRef()`. In-place mutations and same-object reassignments are invisible.',
    },
    {
      id: 'shallow-and-raw-q2',
      type: 'output',
      prompt: 'What is logged, in order? (`watchEffect` runs once immediately, then again whenever something it read changes.)',
      code: {
        lang: 'js',
        code: `import { shallowReactive, watchEffect } from 'vue'

const state = shallowReactive({ count: 0, user: { name: 'Ada' } })

watchEffect(() => console.log(state.user.name))

state.user.name = 'Grace'          // A
state.user = { name: 'Linus' }     // B`,
      },
      options: [
        { text: 'Ada, Grace, Linus', why: 'Line A mutates a nested object, which a shallowReactive object doesn\'t track.' },
        { text: 'Ada, Linus' },
        { text: 'Ada', why: 'Line B replaces a root-level property, which *is* tracked.' },
        { text: 'Ada, Grace', why: 'Line A is not tracked; line B is.' },
      ],
      answer: 1,
      explanation: 'The effect logs "Ada" immediately. Line A changes a nested object — untracked. Line B replaces the root property `user` — tracked, so the effect re-runs and logs "Linus".',
    },
    {
      id: 'shallow-and-raw-q3',
      type: 'bug',
      prompt: 'Zooming throws `TypeError: Cannot read private member` from inside the map library. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { reactive, onMounted } from 'vue'
import { MapWidget } from './MapWidget.js'

const state = reactive({ zoom: 10, map: null })

onMounted(() => {
  state.map = new MapWidget('#map')
})

function zoomIn() {
  state.zoom++
  state.map.setZoom(state.zoom)
}
</script>`,
      },
      answerLine: 8,
      explanation: 'Line 8 stores the library instance in deep reactive state, so `state.map` returns a proxy. When `setZoom` runs, `this` is the proxy and the private-field access throws. Use `state.map = markRaw(new MapWidget(\'#map\'))`, or keep the instance in a plain variable.',
    },
    {
      id: 'shallow-and-raw-q4',
      type: 'fill',
      prompt: 'Fill the blanks: mutate the large array in place, then notify Vue once.',
      code: {
        lang: 'js',
        code: `import { shallowRef, ___ } from 'vue'

const points = shallowRef([])

function addPoints(batch) {
  for (const p of batch) points.value.push(p)
  ___(points)
}`,
      },
      answer: [['triggerRef'], ['triggerRef']],
      explanation: '`triggerRef()` runs the effects that depend on a shallow ref, after in-place changes it could not see.',
    },
    {
      id: 'shallow-and-raw-q5',
      type: 'mcq',
      prompt: 'Which is a **good** use of `toRaw()`?',
      options: [
        { text: 'Saving an undo snapshot with `structuredClone(toRaw(settings))`.' },
        { text: 'Storing `toRaw(cart)` in a variable and pushing items into it, so updates are faster.', why: 'Writes through the raw object are invisible to Vue — the UI goes stale.' },
        { text: 'Making a reactive object readonly.', why: 'That is `readonly()`. `toRaw()` returns the original, fully mutable object.' },
        { text: 'Turning a plain object into a reactive one.', why: 'That is `reactive()` — `toRaw()` goes the opposite way.' },
      ],
      answer: 0,
      explanation: '`toRaw()` is for brief, deliberate trips outside reactivity: cloning, serialising, passing data to libraries or workers.',
    },
    {
      id: 'shallow-and-raw-q6',
      type: 'mcq',
      prompt: 'Which statement about `markRaw()` is true?',
      options: [
        { text: 'It returns the same object, marked so that `reactive()`/`ref()` will never wrap it in a proxy.' },
        { text: 'It returns a deep copy of the object without proxies.', why: 'No copy is made — the very same object is returned.' },
        { text: 'It also marks every nested object inside.', why: 'Only the object you pass is marked; nested objects can still be proxied if placed in reactive state on their own.' },
        { text: 'It makes the object readonly.', why: 'A raw object is fully mutable — Vue simply ignores it.' },
      ],
      answer: 0,
      explanation: '`markRaw(obj)` flags `obj` itself and returns it. Inside reactive state it stays the original object, so identity is preserved and nothing in it is tracked.',
    },
    {
      id: 'shallow-and-raw-q7',
      type: 'short',
      prompt: 'In two or three sentences: when would you choose `shallowRef()` over `ref()`, and what do you give up?',
      answer: 'For large or externally owned data that you replace as a whole — big API payloads, immutable snapshots, external state systems — because Vue then skips converting and tracking everything inside. You give up automatic updates for nested changes: you must assign a new value to `.value` (or call `triggerRef()`) every time.',
    },
  ],

  exercises: [
    {
      id: 'raw-chart',
      title: 'Keep a chart library instance raw',
      difficulty: 'intermediate',
      prompt: `
\`MiniChart.js\` stands in for a third-party charting library (its data lives in a private field). The component crashes as soon as you add a point. Fix it.

- \`<button class="add-5">\` adds the value 5 to the chart, \`<button class="add-10">\` adds 10.
- \`<p class="count">\` shows **\`<n> points\`** (e.g. \`2 points\`) and \`<p class="total">\` shows **\`Total: <sum>\`** — both read from the chart instance after each add.
- Keep using \`MiniChart\` (don't rewrite it), and keep the displayed numbers in reactive refs.

Check the Console tab first: the error message tells you what went wrong.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import { MiniChart } from './MiniChart.js'

const chart = ref(new MiniChart())
const count = ref(0)
const total = ref(0)

function addPoint(value) {
  chart.value.add(value)
  count.value = chart.value.count
  total.value = chart.value.total
}
</script>

<template>
  <p class="count">{{ count }} points</p>
  <p class="total">Total: {{ total }}</p>
  <button class="add-5" @click="addPoint(5)">Add 5</button>
  <button class="add-10" @click="addPoint(10)">Add 10</button>
</template>`,
        'MiniChart.js': miniChart,
      },
      hints: [
        '`ref(new MiniChart())` makes the instance deeply reactive, so `chart.value` is a proxy. Private fields can\'t be read through a proxy.',
        'Stop Vue from proxying the instance: `markRaw(new MiniChart())`.',
        'Either `const chart = markRaw(new MiniChart())` and call `chart.add(value)` directly, or keep the ref but store `markRaw(new MiniChart())` / use `shallowRef`.',
      ],
      solution: {
        explanation: 'The chart instance is owned by the library, so Vue should not wrap it. `markRaw` keeps the original object, and the private field works again. The UI only needs two small numbers, which we copy into refs after each change — Vue tracks those, not the library\'s internals.',
        files: {
          'App.vue': `<script setup>
import { ref, markRaw } from 'vue'
import { MiniChart } from './MiniChart.js'

// The library owns this object: never proxy it.
const chart = markRaw(new MiniChart())
const count = ref(0)
const total = ref(0)

function addPoint(value) {
  chart.add(value)
  count.value = chart.count
  total.value = chart.total
}
</script>

<template>
  <p class="count">{{ count }} points</p>
  <p class="total">Total: {{ total }}</p>
  <button class="add-5" @click="addPoint(5)">Add 5</button>
  <button class="add-10" @click="addPoint(10)">Add 10</button>
</template>`,
          'MiniChart.js': miniChart,
        },
      },
      tests: [
        { name: 'starts empty', code: `expect(text('.count')).toBe('0 points'); expect(text('.total')).toBe('Total: 0')` },
        { name: 'adding points updates count and total', code: `await click('.add-5'); await click('.add-10'); expect(text('.count')).toBe('2 points'); expect(text('.total')).toBe('Total: 15')` },
        { name: 'keeps working after many adds', code: `for (let i = 0; i < 4; i++) await click('.add-10'); expect(text('.count')).toBe('4 points'); expect(text('.total')).toBe('Total: 40')` },
      ],
    },
    {
      id: 'snapshot-undo',
      title: 'Undo snapshots with toRaw()',
      difficulty: 'intermediate',
      prompt: `
A settings editor can save snapshots and undo to the last one. Saving currently crashes (see the Console). Make it work.

- \`.theme\`, \`.font-size\` and \`.tag-count\` show \`settings.theme\`, \`settings.fontSize\` and \`settings.tags.length\`.
- \`.toggle-theme\`, \`.bigger\` (+2) and \`.add-tag\` change the settings (already wired).
- \`<button class="save">\` stores a **deep copy** of the current settings in \`history\`; \`<p class="history-count">\` shows **\`<n> saved\`**.
- \`<button class="undo">\` restores the most recent snapshot into \`settings\` and removes it from \`history\`. With an empty history it does nothing.

Snapshots must not change when the settings change later — including the \`tags\` array.
`,
      files: {
        'App.vue': `<script setup>
import { reactive, ref, toRaw } from 'vue'

const settings = reactive({ theme: 'light', fontSize: 16, tags: ['default'] })
const history = ref([])

function save() {
  history.value.push(structuredClone(settings))
}

function undo() {
  // TODO: restore the most recent snapshot
}
</script>

<template>
  <p>Theme: <span class="theme">{{ settings.theme }}</span></p>
  <p>Font size: <span class="font-size">{{ settings.fontSize }}</span></p>
  <p>Tags: <span class="tag-count">{{ settings.tags.length }}</span></p>
  <button class="toggle-theme" @click="settings.theme = settings.theme === 'light' ? 'dark' : 'light'">Toggle theme</button>
  <button class="bigger" @click="settings.fontSize += 2">Bigger</button>
  <button class="add-tag" @click="settings.tags.push('new')">Add tag</button>
  <button class="save" @click="save">Save snapshot</button>
  <button class="undo" @click="undo">Undo</button>
  <p class="history-count">{{ history.length }} saved</p>
</template>`,
      },
      hints: [
        'The console says `DataCloneError`: `structuredClone` cannot clone a Proxy, and `settings` is one.',
        'Clone the original object behind the proxy: `structuredClone(toRaw(settings))`.',
        'For undo: `const last = history.value.pop()`, and if it exists, `Object.assign(settings, last)` — write into the existing reactive object instead of replacing it.',
      ],
      solution: {
        explanation: '`toRaw(settings)` returns the plain object behind the proxy, which `structuredClone` can deep-copy — including the nested `tags` array, so later pushes don\'t leak into old snapshots. Undo writes the snapshot back through the proxy with `Object.assign`, so the template updates. (A JSON round-trip would also work for this JSON-safe data, but loses things like `Date` and `Map`.)',
        files: {
          'App.vue': `<script setup>
import { reactive, ref, toRaw } from 'vue'

const settings = reactive({ theme: 'light', fontSize: 16, tags: ['default'] })
const history = ref([])

function save() {
  // Proxies can't be structured-cloned: clone the raw object behind it.
  history.value.push(structuredClone(toRaw(settings)))
}

function undo() {
  const last = history.value.pop()
  if (last) Object.assign(settings, last)
}
</script>

<template>
  <p>Theme: <span class="theme">{{ settings.theme }}</span></p>
  <p>Font size: <span class="font-size">{{ settings.fontSize }}</span></p>
  <p>Tags: <span class="tag-count">{{ settings.tags.length }}</span></p>
  <button class="toggle-theme" @click="settings.theme = settings.theme === 'light' ? 'dark' : 'light'">Toggle theme</button>
  <button class="bigger" @click="settings.fontSize += 2">Bigger</button>
  <button class="add-tag" @click="settings.tags.push('new')">Add tag</button>
  <button class="save" @click="save">Save snapshot</button>
  <button class="undo" @click="undo">Undo</button>
  <p class="history-count">{{ history.length }} saved</p>
</template>`,
        },
      },
      tests: [
        { name: 'saving records a snapshot', code: `await click('.save'); expect(text('.history-count')).toBe('1 saved')` },
        {
          name: 'undo restores the saved values and pops the history',
          code: `await click('.save')
await click('.bigger')
await click('.bigger')
await click('.toggle-theme')
expect(text('.font-size')).toBe('20')
await click('.undo')
expect(text('.font-size')).toBe('16')
expect(text('.theme')).toBe('light')
expect(text('.history-count')).toBe('0 saved')`,
        },
        {
          name: 'snapshots are deep copies (tags too)',
          code: `await click('.save')
await click('.add-tag')
expect(text('.tag-count')).toBe('2')
await click('.undo')
expect(text('.tag-count')).toBe('1')`,
        },
        { name: 'undo with no history does nothing', code: `await click('.bigger'); await click('.undo'); expect(text('.font-size')).toBe('18')` },
      ],
    },
  ],

  interview: [
    {
      id: 'shallow-and-raw-large-payload',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A reporting page loads a large table from the API and replaces the whole table every time the filters change. Nobody edits cells. How would you store it, and what trade-offs come with that choice?',
      answer: 'Store it in a `shallowRef` and replace `.value` with each new response. Vue then tracks only the assignment instead of converting and tracking every row and cell. The trade-off: in-place changes are not reactive, so any later edit must be an immutable replacement or followed by `triggerRef()`. Measure first, and consider list virtualisation, since rendering many rows is often the bigger cost.',
      explanation: 'Deep reactivity pays for flexibility the page never uses. Shallow state matches the data\'s life cycle: it arrives, is shown, is replaced.',
      code: {
        lang: 'js',
        code: `const rows = shallowRef([])

watch(filters, async () => {
  rows.value = await api.getReport(toRaw(filters)) // replace, never mutate
}, { immediate: true })`,
      },
      whyAsked: 'Checks whether you can match reactivity to how data is actually used, and whether you know the cost model.',
      mistakes: ['Saying "shallowRef is always faster" without mentioning what you lose.', 'Mutating rows in place later and wondering why the table doesn\'t update.', 'Ignoring rendering cost and virtualisation.'],
      followUps: ['What would change if users could edit cells inline?', 'How would you combine this with a virtual list?', 'How do you know it was worth it?'],
      modelAnswer: 'Because the table is replace-only, I would put it in a `shallowRef` and assign each new response to `.value`. Vue tracks that one assignment instead of proxying and tracking every row. The cost is that nested mutations aren\'t reactive, so the team must treat the data as immutable or call `triggerRef`. I would back it with a measurement, and for really long tables virtualise the list, because DOM rendering usually dominates.',
    },
    {
      id: 'shallow-and-raw-markraw-instances',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your component wraps a third-party map (or chart, or editor) library. How should the library instance be stored, and why? How does the UI still react to things happening in the map?',
      answer: 'Keep the instance out of deep reactivity: `markRaw(instance)`, a `shallowRef`, or a plain variable. Proxying it makes Vue track the library\'s internal reads (wasted work), can break objects that use private fields or internal slots, and changes identity, which libraries may rely on. Mirror only what the UI needs — zoom level, selected marker, loading state — into small refs updated from the library\'s events, and push Vue state into the library with watchers.',
      explanation: 'Two worlds, one bridge: the library owns its object; Vue owns a few refs; events and watchers connect them.',
      code: {
        lang: 'js',
        code: `const mapEl = useTemplateRef('map')   // Vue 3.5+
let map = null                        // plain variable, never proxied
const zoom = ref(10)                  // only what the UI shows

onMounted(() => {
  map = new MapWidget(mapEl.value, { zoom: zoom.value })
  map.on('zoom', (z) => (zoom.value = z))   // library → Vue
})
watch(zoom, (z) => map?.setZoom(z))         // Vue → library
onUnmounted(() => map?.destroy())`,
      },
      whyAsked: 'Integration with non-Vue code is common in real products; this reveals whether you understand proxies, ownership and lifecycle cleanup.',
      mistakes: [
        'Storing the instance in `reactive()`/`ref()` "so the template can use it".',
        'Forgetting to destroy the instance or remove listeners on unmount.',
        'Trying to make the library\'s internal state reactive instead of mirroring a few values.',
      ],
      followUps: ['What breaks when a class with `#private` fields is proxied?', 'Would you wrap this in a composable? What would it return?'],
      modelAnswer: 'I keep the library instance raw — `markRaw`, a `shallowRef`, or just a plain variable — because the library owns its internal state. Proxying it means Vue tracks reads it doesn\'t care about, it can throw on private fields, and identity changes can confuse the library. The UI reacts through a small bridge: the library\'s events update a few refs like zoom or selection, and watchers push Vue state back into the library. I create the instance in `onMounted` with a template ref, destroy it in `onUnmounted`, and usually wrap all of this in a composable.',
    },
    {
      id: 'shallow-and-raw-triggerref-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this log, and when?',
      code: {
        lang: 'js',
        code: `import { shallowRef, triggerRef, watchEffect } from 'vue'

const list = shallowRef([1, 2])
watchEffect(() => console.log('length', list.value.length))

list.value.push(3)        // 1
list.value = list.value   // 2
triggerRef(list)          // 3`,
      },
      options: [
        '"length 2", then "length 3" once (after line 3)',
        '"length 2", then "length 3" three times',
        '"length 2" only',
        '"length 2", "length 3", "length 3"',
      ],
      correctOption: 0,
      answer: '"length 2" immediately, then "length 3" once. Line 1 mutates in place (untracked). Line 2 assigns the same array, which `Object.is` treats as unchanged, so it doesn\'t trigger. Line 3 triggers explicitly; the effect re-runs once (watcher runs are queued) and reads the length, now 3.',
      explanation: 'Shallow refs react to a *different* value or to `triggerRef`. Everything else is invisible.',
      whyAsked: 'Tests precise knowledge of shallow semantics, including the same-object pitfall that trips people up in real code.',
      mistakes: ['Believing line 2 triggers because "it\'s an assignment".', 'Expecting one log per line.'],
      followUps: ['How would you write line 1 immutably?', 'Would the answer change with `ref()` instead of `shallowRef()`?'],
      modelAnswer: 'It logs "length 2" right away, then "length 3" once. The push is a nested mutation a shallowRef can\'t see; reassigning the same array is skipped because Vue compares with `Object.is`; only `triggerRef` notifies the effect, which re-runs once and reads the new length. With a normal `ref`, the push alone would have triggered it.',
    },
    {
      id: 'shallow-and-raw-toraw',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does `toRaw()` return, when is it appropriate to use, and what is the danger?',
      answer: 'It returns the original object behind a reactive or readonly proxy. Use it briefly at boundaries: cloning (`structuredClone`), sending data to a worker or IndexedDB, handing data to a library that shouldn\'t trigger or track, or reading in bulk without tracking. The danger is keeping or writing through the raw object: writes don\'t trigger updates, so the UI goes stale, and mixing raw and proxy versions breaks identity checks.',
      explanation: 'toRaw is a door out of the reactive world. Use it to pass things through, not to live outside.',
      whyAsked: 'Shows whether you treat escape hatches with care.',
      mistakes: ['Thinking `toRaw` makes a copy.', 'Using it to "speed up" writes.', 'Confusing it with `markRaw` (which prevents proxying in the first place).'],
      followUps: ['What is the difference between `toRaw` and `markRaw`?', 'Why does `structuredClone` fail on reactive objects?'],
      modelAnswer: '`toRaw` returns the actual object a proxy wraps — no copy. I use it at boundaries: `structuredClone(toRaw(state))` for snapshots, because the structured clone algorithm rejects proxies, or when passing data to a worker, IndexedDB or a library. The danger is treating the raw object as state: writes through it bypass tracking, so the screen goes stale, and having two versions of one object makes identity checks unreliable. `markRaw` is the opposite tool: it stops an object from ever being proxied.',
    },
    {
      id: 'shallow-and-raw-shallowreactive-bug',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A teammate switched a store-like object to `shallowReactive` "for performance". Now the user\'s name only updates on screen when the counter is also clicked. Explain.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { shallowReactive } from 'vue'

const state = shallowReactive({ count: 0, user: { name: 'Ada' } })

function rename() { state.user.name = 'Grace' }
function inc() { state.count++ }
</script>

<template>
  <p>{{ state.user.name }} — {{ state.count }}</p>
  <button @click="rename">Rename</button>
  <button @click="inc">+1</button>
</template>`,
      },
      answer: 'Only root-level properties of a shallowReactive object are reactive. `state.user.name = \'Grace\'` mutates a plain nested object, so nothing re-renders. Clicking +1 changes a root property (`count`), the component re-renders, and the render happens to read the already-changed name. Fix: replace the root property (`state.user = { ...state.user, name: \'Grace\' }`) or go back to `reactive()`.',
      explanation: 'An untracked change "appears" whenever something tracked re-renders the same component. That makes the bug look random.',
      whyAsked: 'A realistic consequence of premature optimisation; also tests the "works by accident" pattern.',
      mistakes: ['Blaming batching or `nextTick`.', 'Saying shallowReactive is "broken".', 'Not explaining why the name eventually shows up.'],
      followUps: ['When is `shallowReactive` actually a good choice?', 'How would you have caught this before it shipped?'],
      modelAnswer: '`shallowReactive` tracks root properties only, so changing `state.user.name` mutates a plain object nobody watches. When the counter changes, a tracked root property triggers a re-render, and that render reads the name that had already changed — which is why it looks like the name "waits" for the counter. I would replace the root property immutably or revert to `reactive()`, and ask for a measurement before using shallow state as an optimisation.',
    },
    {
      id: 'shallow-and-raw-coding-todos',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'This todo list keeps its todos in a `shallowRef`. Adding a todo *looks* like it works, but the "left" counter is wrong, and toggling never updates it. Fix it **without** switching to `ref()`. Selectors: `.new-todo` (input), `.add` (button), `.todo` (each item), `.toggle` (checkbox in each item), `.remaining` (shows "N left").',
      starter: {
        files: {
          'App.vue': `<script setup>
import { shallowRef, ref, computed } from 'vue'

const todos = shallowRef([{ id: 1, text: 'Buy milk', done: false }])
const draft = ref('')
let nextId = 2

const remaining = computed(() => todos.value.filter((t) => !t.done).length)

function addTodo() {
  const text = draft.value.trim()
  if (!text) return
  todos.value.push({ id: nextId++, text, done: false })
  draft.value = ''
}

function toggle(todo) {
  todo.done = !todo.done
}
</script>

<template>
  <input class="new-todo" v-model="draft" />
  <button class="add" @click="addTodo">Add</button>
  <ul>
    <li v-for="todo in todos" :key="todo.id" class="todo">
      <input type="checkbox" class="toggle" :checked="todo.done" @change="toggle(todo)" />
      {{ todo.text }}
    </li>
  </ul>
  <p class="remaining">{{ remaining }} left</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'adding a todo updates the list and the counter',
          code: `await type('.new-todo', 'Walk the dog')
await click('.add')
expect(findAll('.todo')).toHaveLength(2)
expect(text('.remaining')).toBe('2 left')`,
        },
        { name: 'toggling a todo updates the counter', code: `await check('.toggle', true); expect(text('.remaining')).toBe('0 left')` },
        { name: 'toggling back restores it', code: `await check('.toggle', true); await check('.toggle', false); expect(text('.remaining')).toBe('1 left')` },
      ],
      hints: [
        'A shallowRef only notices assignments to `.value`. `push` and `todo.done = …` are invisible.',
        'The list only *seemed* to update because clearing `draft` re-rendered the component. The computed was never told to recalculate.',
        'Use immutable updates: `todos.value = [...todos.value, newTodo]` and `todos.value = todos.value.map((t) => t.id === todo.id ? { ...t, done: !t.done } : t)`.',
      ],
      answer: 'Replace `.value` with a new array on every change (or call `triggerRef(todos)` after mutating).',
      solution: {
        files: {
          'App.vue': `<script setup>
import { shallowRef, ref, computed } from 'vue'

const todos = shallowRef([{ id: 1, text: 'Buy milk', done: false }])
const draft = ref('')
let nextId = 2

const remaining = computed(() => todos.value.filter((t) => !t.done).length)

function addTodo() {
  const text = draft.value.trim()
  if (!text) return
  todos.value = [...todos.value, { id: nextId++, text, done: false }]
  draft.value = ''
}

function toggle(todo) {
  todos.value = todos.value.map((t) =>
    t.id === todo.id ? { ...t, done: !t.done } : t
  )
}
</script>

<template>
  <input class="new-todo" v-model="draft" />
  <button class="add" @click="addTodo">Add</button>
  <ul>
    <li v-for="todo in todos" :key="todo.id" class="todo">
      <input type="checkbox" class="toggle" :checked="todo.done" @change="toggle(todo)" />
      {{ todo.text }}
    </li>
  </ul>
  <p class="remaining">{{ remaining }} left</p>
</template>`,
        },
      },
      explanation: 'Every change now assigns a new array to `.value`, which the shallowRef tracks — so both the render and the `remaining` computed re-run. In the starter, the list only looked right because `draft.value = \'\'` happened to re-render the component; the computed stayed cached at its old value.',
      whyAsked: 'Combines shallow semantics, computed caching and the "updates by accident" trap in one small, realistic task.',
      mistakes: ['Switching to `ref()` (not allowed here, and it hides the lesson).', 'Fixing only `addTodo` and missing `toggle`.', 'Reassigning the same array after `push`.'],
      followUps: ['When would `triggerRef` be a better fit than copying?', 'Why did the list appear to update in the starter but the counter didn\'t?'],
      modelAnswer: 'A shallowRef only reacts to `.value` assignments, so I switch both mutations to immutable updates: spread into a new array when adding and map to a new object when toggling. The starter was misleading because clearing the draft re-rendered the component, so the list looked right, but the computed was never invalidated. For a very large list where copying is too costly, I could mutate and call `triggerRef` instead.',
    },
  ],

  takeaways: [
    'Vue is deep by default; shallow and raw APIs let you turn tracking down or off where it costs or breaks.',
    '`shallowRef` tracks only `.value` assignments — update it with new values, or mutate and call `triggerRef()`.',
    'Assigning the same object back to a shallow ref does nothing (`Object.is`).',
    '`shallowReactive`/`shallowReadonly` affect only root-level properties and don\'t unwrap refs.',
    '`markRaw` keeps library instances and other special objects out of proxies; `toRaw` is a brief escape hatch for boundaries like `structuredClone`.',
    'Measure before optimising — and keep untracked changes from "appearing by accident" later.',
  ],
}
