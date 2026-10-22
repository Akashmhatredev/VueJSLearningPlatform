// Lesson: reactive() and the classic "ref vs reactive" decision.

const orderApp = `<script setup>
import { reactive, computed } from 'vue'

const order = reactive({
  item: 'Coffee beans',
  price: 12,
  quantity: 1,
  giftWrap: false,
})

const total = computed(() =>
  order.price * order.quantity + (order.giftWrap ? 3 : 0)
)

function addOne() {
  order.quantity++
}

function reset() {
  Object.assign(order, { quantity: 1, giftWrap: false })
}
</script>

<template>
  <h2>{{ order.item }}</h2>
  <p class="qty">Quantity: {{ order.quantity }}</p>
  <button class="add" @click="addOne">+1</button>
  <label>
    <input type="checkbox" class="gift" v-model="order.giftWrap" />
    Gift wrap (+€3)
  </label>
  <p class="total">Total: €{{ total }}</p>
  <button class="reset" @click="reset">Reset</button>
</template>`

const orderAppRefs = `<script setup>
import { ref, computed } from 'vue'

// The same order, as four separate refs.
const item = ref('Coffee beans')
const price = ref(12)
const quantity = ref(1)
const giftWrap = ref(false)

const total = computed(() =>
  price.value * quantity.value + (giftWrap.value ? 3 : 0)
)

function addOne() {
  quantity.value++
}

function reset() {
  quantity.value = 1
  giftWrap.value = false
}
</script>

<template>
  <h2>{{ item }}</h2>
  <p class="qty">Quantity: {{ quantity }}</p>
  <button class="add" @click="addOne">+1</button>
  <label>
    <input type="checkbox" class="gift" v-model="giftWrap" />
    Gift wrap (+€3)
  </label>
  <p class="total">Total: €{{ total }}</p>
  <button class="reset" @click="reset">Reset</button>
</template>`

const orderAppRefObject = `<script setup>
import { ref, computed } from 'vue'

const freshOrder = () => ({ item: 'Coffee beans', price: 12, quantity: 1, giftWrap: false })

// One ref holding an object: deep, AND replaceable as a whole.
const order = ref(freshOrder())

const total = computed(() =>
  order.value.price * order.value.quantity + (order.value.giftWrap ? 3 : 0)
)

function addOne() {
  order.value.quantity++
}

function reset() {
  order.value = freshOrder() // replacing the whole object is fine with a ref
}
</script>

<template>
  <h2>{{ order.item }}</h2>
  <p class="qty">Quantity: {{ order.quantity }}</p>
  <button class="add" @click="addOne">+1</button>
  <label>
    <input type="checkbox" class="gift" v-model="order.giftWrap" />
    Gift wrap (+€3)
  </label>
  <p class="total">Total: €{{ total }}</p>
  <button class="reset" @click="reset">Reset</button>
</template>`

export default {
  id: 'reactive',
  title: 'reactive() and ref vs reactive',
  summary: 'Make a whole object reactive so you can read and write its properties directly — and learn exactly when to choose reactive() or ref().',
  difficulty: 'beginner',
  minutes: 28,
  prerequisites: ['ref'],
  related: ['ref', 'reactivity-utilities', 'arrays-objects-reactivity', 'computed', 'how-reactivity-works'],
  tags: ['reactivity', 'reactive', 'proxy', 'ref vs reactive', 'deep reactivity', 'destructuring', 'ref unwrapping', 'Object.assign'],
  apis: [
    { name: 'reactive()', summary: 'Returns a deeply reactive Proxy of an object, array, Map or Set.' },
    { name: 'isReactive()', summary: 'Checks whether a value is a proxy created by `reactive()` or `shallowReactive()`.' },
    { name: 'toRefs()', summary: 'Turns each property of a reactive object into a linked ref — the fix for destructuring.' },
  ],
  docs: [
    { label: 'Vue Guide — Reactivity Fundamentals: reactive()', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html#reactive' },
    { label: 'Vue Guide — Limitations of reactive()', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive' },
    { label: 'Vue Guide — Additional ref unwrapping details', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html#additional-ref-unwrapping-details' },
    { label: 'API — reactive()', url: 'https://vuejs.org/api/reactivity-core.html#reactive' },
  ],

  intro: `
\`reactive()\` makes a whole **object** reactive in one go. You pass it a plain object, and it hands back a look-alike that Vue watches: read and write its properties normally — \`order.quantity++\` — and every part of the screen that shows them updates. No \`.value\` anywhere.

The look-alike is a JavaScript **Proxy**: a stand-in object that behaves exactly like the original but lets Vue notice every read and every write.

Because Vue offers two ways to hold state, "**ref or reactive?**" is one of the most common Vue questions — in code reviews and in interviews. By the end of this lesson you'll have built the *same* app both ways and know the trade-offs precisely.
`,

  why: [
    `
Real state often comes in groups: the fields of a form, a set of filters, the settings of a game. With [ref()](lesson:ref) you could keep each field in its own ref, or one ref holding an object — and write \`.value\` every time you touch it:
`,
    {
      code: `const form = ref({ email: '', password: '', remember: false })

form.value.email = 'ada@example.com'
if (form.value.remember) { /* ... */ }`,
      lang: 'js',
      title: 'grouped state with ref(): .value everywhere',
    },
    `
\`reactive()\` exists so grouped state can feel like a normal JavaScript object:
`,
    {
      code: `const form = reactive({ email: '', password: '', remember: false })

form.email = 'ada@example.com'
if (form.remember) { /* ... */ }`,
      lang: 'js',
      title: 'the same state with reactive()',
    },
    `
That convenience has a price: \`reactive()\` only works with objects, you can't swap the whole object for a new one, and pulling properties out of it (destructuring) silently disconnects them. Those limits are why the official Vue docs recommend **\`ref()\` as the primary API** — and why you need to understand both.
`,
  ],

  eli15: `
Imagine two ways to keep track of your stuff.

A **ref** is a single labelled box with a sensor on the lid. To use what's inside, you open the lid: \`.value\`. One box, one thing.

A **reactive** object is a whole *house* wired with sensors in every room. You walk straight into a room — \`house.kitchen\` — and the sensors notice you, no lid to open. Great when you have lots of related stuff.

But a house has two quirks:

1. **If you carry a chair out of the house, it has no sensor any more.** Writing \`const { quantity } = order\` copies the number out — Vue stops noticing changes to it.
2. **If you build a brand-new house next door**, the alarm company still watches the *old* address. Writing \`order = reactive({...})\` leaves the screen watching the old object.

So: use the house for related things you'll keep in one place, and use boxes when you need to replace or hand out things.
`,

  analogy: {
    title: 'A house wired with sensors',
    body: `
A security company wires every room of a house. Whenever someone enters or changes a room, the control centre knows which room, and only alerts the people who care about that room.

\`reactive()\` wires your object the same way: each property is a room, and Vue's Proxy is the wiring. It works on every floor (nested objects are wired too), and you never think about the wiring while you live in the house.

The wiring belongs to the *house*, though — not to the things in it. Carry a value out (destructure it) and it's just a plain value. Move to a new house (reassign the variable) and the control centre still monitors the old one.
`,
    mapping: [
      ['the house', 'the reactive proxy returned by `reactive()`'],
      ['each room', 'a property: `order.quantity`'],
      ['the sensors and wiring', 'the Proxy\'s get/set traps (track and trigger)'],
      ['upstairs rooms being wired too', 'deep reactivity: nested objects become reactive on access'],
      ['carrying a chair out of the house', 'destructuring `const { quantity } = order` — a disconnected copy'],
      ['building a new house next door', '`order = reactive({...})` — the template still watches the old object'],
    ],
  },

  visual: {
    type: 'reactivity',
    props: { preset: 'compare' },
    title: 'ref vs reactive (vs computed vs watch) on one cart',
    caption: 'The same cart, four reactive tools. Compare how `ref` (a box with `.value`) and `reactive` (a proxy around the object) each track reads and trigger updates — and where `computed` and `watch` plug into the same loop.',
    alt: 'A comparison stepper showing one shopping cart implemented with ref, reactive, computed and watch. For each, the steps show state, dependency tracking, the change, the triggered effects and the DOM update. The ref column tracks reads of .value; the reactive column tracks property reads through a Proxy; computed recalculates the total; watch runs a side effect.',
  },

  syntax: [
    `
**Creating reactive state.** Import \`reactive\` and pass it an object (or an array, \`Map\` or \`Set\`):
`,
    {
      code: `import { reactive } from 'vue'

const order = reactive({
  item: 'Coffee beans',
  quantity: 1,
  shipping: { city: 'Pune', express: false }, // nested: reactive too
  notes: [],                                  // arrays: reactive too
})

order.quantity++                 // write a property — Vue triggers updates
order.shipping.express = true    // deep: nested writes are tracked
order.notes.push('Leave at door') // array methods are tracked
order.coupon = 'SAVE5'           // adding a NEW property is tracked (Vue 3)`,
      lang: 'js',
      title: 'reactive() basics',
    },
    `
**The rules:**

1. **Objects only.** \`reactive()\` works on object types (plain objects, arrays, \`Map\`, \`Set\`, \`WeakMap\`, \`WeakSet\`). \`reactive(0)\` or \`reactive('hi')\` does nothing useful — Vue warns in development and returns the value unchanged.
2. **Read and write properties directly** — no \`.value\`, in script or template.
3. **It's deep.** Nested objects and arrays become reactive when you access them.
4. **Use the proxy, not the original.** \`reactive(raw)\` returns a *new* proxy object: \`reactive(raw) !== raw\`, and changing \`raw\` directly does **not** trigger updates. Calling \`reactive(raw)\` again returns the *same* proxy, and \`reactive(proxy)\` returns the proxy itself.
5. **Never replace the whole object.** Keep it in a \`const\` and change its properties. To reset many fields, use \`Object.assign(order, freshValues)\`.
6. **Don't destructure it** (or pass a single primitive property somewhere that expects reactivity). Use the object, \`toRefs()\`, or a getter instead — see [toRefs](lesson:reactivity-utilities).
`,
    {
      callout: 'note',
      title: 'Refs inside reactive objects are unwrapped',
      text: 'If a property of a reactive object holds a ref, reading the property gives you the ref\'s value and writing it sets the ref\'s value: `const count = ref(0); const s = reactive({ count }); s.count++` makes `count.value === 1`. This unwrapping does **not** happen for refs stored inside reactive **arrays** or collections like `Map` — there you still need `.value`.',
    },
    `
#### The same app, two ways

Here is one small order form written with \`reactive()\` and with \`ref()\`. Read them side by side — the playground has both as variants.
`,
    {
      code: `// reactive(): one object, no .value
const order = reactive({ quantity: 1, giftWrap: false })

const total = computed(() => 12 * order.quantity + (order.giftWrap ? 3 : 0))
function addOne() { order.quantity++ }
function reset() { Object.assign(order, { quantity: 1, giftWrap: false }) }

// template: {{ order.quantity }}  v-model="order.giftWrap"`,
      lang: 'js',
      title: 'with reactive()',
    },
    {
      code: `// ref(): one box per value, .value in script
const quantity = ref(1)
const giftWrap = ref(false)

const total = computed(() => 12 * quantity.value + (giftWrap.value ? 3 : 0))
function addOne() { quantity.value++ }
function reset() { quantity.value = 1; giftWrap.value = false }

// template: {{ quantity }}  v-model="giftWrap"`,
      lang: 'js',
      title: 'with ref()',
    },
    `
Same behaviour, same reactivity. The differences show up at the edges: replacing everything (\`ref\` can, \`reactive\` can't), handing values to other functions (refs travel safely, reactive properties don't), and how much \`.value\` you type.
`,
    {
      callout: 'version',
      text: '`reactive()` is Vue 3 core API and uses JavaScript Proxies, so adding/deleting properties and setting array indexes are all tracked — things Vue 2 could not detect. The Vue docs recommend `ref()` as the primary API for declaring reactive state because of `reactive()`\'s limitations.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: orderApp,
    intro: 'An order form built on one reactive object. Step through it, then compare it with the ref-based variant in the playground.',
    steps: [
      { lines: [2], text: 'We import `reactive` (and `computed` for the total). No `ref` needed here.' },
      { lines: [4, 9], text: '`reactive({...})` returns a **proxy** of this object. We keep it in a `const`: we will change its properties, never the variable.' },
      { lines: [11, 13], text: 'The total reads `order.price`, `order.quantity` and `order.giftWrap` directly — no `.value`. Each read is tracked, so the total recalculates when any of them changes.' },
      { lines: [15, 17], text: '`order.quantity++` is an ordinary property write. The proxy intercepts it and notifies everything that read `quantity`.' },
      { lines: [19, 21], text: 'Resetting: `Object.assign` writes new values *into* the existing proxy. Assigning a brand-new object to `order` would disconnect the template.' },
      { lines: [25, 26], text: 'In the template you write `order.item` and `order.quantity` — the same paths as in script code.' },
      { lines: [29], text: '`v-model="order.giftWrap"` binds the checkbox straight to a property of the reactive object. Ticking it writes through the proxy, which updates the total.' },
      { lines: [32], text: '`total` is a computed ref; top-level refs are unwrapped in templates, so it is just `{{ total }}`.' },
    ],
  },

  playground: {
    title: 'Order form with reactive()',
    objective: 'Extend a reactive object, then reproduce (and fix) the two classic reactive() traps.',
    files: { 'App.vue': orderApp },
    expected: 'A heading **Coffee beans**, **Quantity: 1**, a +1 button, a gift-wrap checkbox and **Total: €12**. +1 adds €12; gift wrap adds €3; Reset restores quantity 1 without gift wrap. Try the **ref() version** and **ref(object) version** variants: same behaviour, different code.',
    experiments: [
      {
        id: 'remove-one',
        task: 'Add a button with `class="remove"` that lowers the quantity by one — but never below **1**.',
        hint: 'Write `removeOne()` with `if (order.quantity > 1) order.quantity--`, and add `<button class="remove" @click="removeOne">−1</button>`.',
        tests: [
          {
            name: 'removes one, never below 1',
            code: `expect(exists('.remove')).toBe(true)
await click('.add')
await click('.add')
await click('.remove')
expect(text('.qty')).toBe('Quantity: 2')
for (let i = 0; i < 5; i++) await click('.remove')
expect(text('.qty')).toBe('Quantity: 1')
expect(text('.total')).toBe('Total: €12')`,
          },
        ],
        explain: 'Writing `order.quantity--` through the proxy is all it takes — the quantity text and the computed total both follow.',
      },
      {
        id: 'coupon',
        task: 'Add a `coupon` property (starting as `\'\'`) to the order and an `<input class="coupon">` bound to it with `v-model`. When the coupon is exactly **SAVE5**, take €5 off the total.',
        hint: 'Add `coupon: \'\'` inside `reactive({...})`, bind `v-model="order.coupon"`, and subtract `(order.coupon === \'SAVE5\' ? 5 : 0)` in the computed total.',
        tests: [
          {
            name: 'SAVE5 takes €5 off, other codes do not',
            code: `expect(exists('.coupon')).toBe(true)
await type('.coupon', 'SAVE5')
expect(text('.total')).toBe('Total: €7')
await type('.coupon', 'NOPE')
expect(text('.total')).toBe('Total: €12')`,
          },
        ],
        explain: '`v-model` on a property of a reactive object writes through the proxy on every keystroke, and the computed total re-runs because it read `order.coupon`.',
      },
      {
        id: 'destructure',
        task: 'Reproduce the destructuring trap. Add `const { quantity } = order` and `<p class="copy">Copy: {{ quantity }}</p>`. Click +1: the copy is stuck at 1. Now fix it so the copy follows the quantity — **without** removing the destructuring.',
        hint: 'Destructure from `toRefs(order)` instead of `order` (import `toRefs` from \'vue\'). Each property becomes a ref linked to the original object.',
        tests: [
          {
            name: 'the destructured copy follows the quantity',
            code: `expect(exists('.copy')).toBe(true)
await click('.add')
expect(text('.copy')).toBe('Copy: 2')
await click('.add')
expect(text('.copy')).toBe('Copy: 3')`,
          },
        ],
        explain: '`const { quantity } = order` reads the property once and stores the **number** 1 in a plain variable — no proxy, no tracking. `toRefs(order)` instead gives you a ref whose `.value` reads and writes `order.quantity`, so the link survives. More in [toRefs and friends](lesson:reactivity-utilities).',
      },
      {
        id: 'replace',
        task: 'Reproduce the replacement trap: change `const order` to `let order`, and make `reset()` do `order = reactive({ item: \'Coffee beans\', price: 12, quantity: 1, giftWrap: false })`. Add a few items, press Reset and watch the screen. Then undo it.',
        hint: 'The variable now points to a new proxy, but the template was rendered from the old one.',
        explain: 'The template and the computed total are subscribed to the *original* proxy. Pointing the variable at a new object doesn\'t move those subscriptions, so the screen keeps showing the old order. Write into the existing object with `Object.assign`, or use `ref({...})` if you genuinely need to replace the whole thing (see the **ref(object) version** variant).',
      },
    ],
    variants: [
      { id: 'refs', label: 'ref() version (one ref per field)', files: { 'App.vue': orderAppRefs } },
      { id: 'ref-object', label: 'ref(object) version (replaceable)', files: { 'App.vue': orderAppRefObject } },
    ],
  },

  animation: {
    type: 'reactivity',
    props: { preset: 'reactive' },
    title: 'Inside a reactive() update',
    caption: 'Follow a property write through the proxy: the template read `order.quantity` during render (tracked), `order.quantity++` hits the proxy\'s set trap (trigger), the render effect is queued and the DOM is patched.',
    alt: 'A step-by-step diagram for reactive(): the template reads order.quantity through the Proxy get trap, and Vue records the dependency for that object and key; order.quantity++ goes through the set trap; Vue triggers the effects that depend on order.quantity; the component re-renders and the quantity text node is patched.',
  },

  internals: {
    beginner: `
\`reactive()\` doesn't change your object. It builds a **proxy** — a see-through wrapper that stands in front of the object. Every time code reads a property *through the wrapper*, Vue notes who read it; every time code writes a property through the wrapper, Vue tells those readers to update.

That's why the rules exist: if you go around the wrapper (use the original object), take a value out of it (destructure), or swap the wrapper for a new one (reassign), Vue can't see what you're doing.
`,
    technical: [
      `
A JavaScript **Proxy** wraps a target object and lets you intercept operations on it with *traps*. Vue's \`reactive()\` uses:

- **get** → \`track(target, key)\`: record the currently running effect as depending on this property. If the value is an object, return *its* reactive proxy (created lazily, on first access) — that's how deep reactivity works without walking the whole tree up front. If the value is a ref (and the target isn't an array), return \`ref.value\` — that's ref unwrapping.
- **set** → compare the old and new value; if it changed (or the key is new), \`trigger(target, key)\`.
- **has**, **deleteProperty**, **ownKeys** → track \`key in obj\`, trigger on \`delete obj.key\`, and track iteration (\`for…in\`, \`Object.keys\`), so adding a property re-runs code that loops over the object.

Vue keeps a \`WeakMap\` from each raw object to its proxy, which is why calling \`reactive(raw)\` twice returns the same proxy. Arrays get extra handling for mutation methods like \`push\`, and \`Map\`/\`Set\` use instrumented methods (\`get\`, \`set\`, \`add\`, \`has\`, \`size\`, iteration) because their data isn't stored in ordinary properties.
`,
      {
        code: `// A SIMPLIFIED model of reactive() — Vue's real code handles many more cases.
function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)                       // who is reading?
      const value = Reflect.get(obj, key, receiver)
      return isObject(value) ? reactive(value) : value  // deep, lazily
    },
    set(obj, key, value, receiver) {
      const old = obj[key]
      const ok = Reflect.set(obj, key, value, receiver)
      if (!Object.is(old, value)) trigger(obj, key)     // notify readers
      return ok
    },
  })
}`,
        lang: 'js',
        title: 'mental model of reactive() (simplified)',
      },
      `
**Why destructuring breaks.** \`const { quantity } = order\` runs the get trap *once*, right now, and stores the returned number in a plain local variable. Later writes go to \`order.quantity\` through the proxy; the local variable is just a number nobody updates. Destructuring an *object-valued* property (\`const { shipping } = order\`) does give you a reactive proxy of that nested object — but it goes stale if \`order.shipping\` is later replaced.

**\`ref()\` and \`reactive()\` are connected:** when you pass an object to \`ref()\`, its \`.value\` is made reactive with \`reactive()\` internally. The full tracking machinery is dissected in [How reactivity works](lesson:how-reactivity-works).
`,
    ],
    production: `
- **Team convention matters more than the choice.** Many codebases follow the Vue docs and use \`ref()\` by default, reserving \`reactive()\` for cohesive groups of fields that are never replaced (form models, filter panels). Mixing styles randomly makes code harder to read.
- **Resetting:** keep a factory (\`const initial = () => ({ ... })\`) and call \`Object.assign(form, initial())\`. Beware: \`Object.assign\` doesn't remove keys that were added later, and nested objects are replaced, not merged.
- **API data you replace wholesale** belongs in \`ref()\` (or \`shallowRef()\` for large payloads), not in \`reactive()\`.
- **Identity:** the proxy and the raw object are different objects. Comparing them with \`===\`, or using them as keys in a \`Set\`/\`Map\`, can surprise you. Always work with the proxy; use \`toRaw()\` only deliberately ([shallow & raw](lesson:shallow-and-raw)).
- **Passing to composables:** pass the whole reactive object, a getter (\`() => form.email\`), or \`toRef(form, 'email')\` — never \`form.email\`, which is just a string.
- **Pinia:** a store instance is itself wrapped in \`reactive()\`, which is why destructuring a store needs Pinia's \`storeToRefs()\` — see [using stores](lesson:using-stores).
`,
  },

  mistakes: [
    {
      title: 'Replacing the whole reactive object',
      wrong: { code: `let filters = reactive({ search: '', inStock: false })\n\nfunction reset() {\n  filters = reactive({ search: '', inStock: false }) // template keeps the old one\n}`, lang: 'js' },
      right: { code: `const filters = reactive({ search: '', inStock: false })\n\nfunction reset() {\n  Object.assign(filters, { search: '', inStock: false })\n}`, lang: 'js' },
      explanation: 'The template subscribed to the first proxy. Reassigning the variable creates a second object nobody is subscribed to. Mutate the existing object — or use `ref()` if you need to replace it as a whole.',
    },
    {
      title: 'Destructuring properties out of a reactive object',
      wrong: { code: `const order = reactive({ quantity: 1 })\nconst { quantity } = order   // plain number 1\n\norder.quantity++             // template showing {{ quantity }} stays 1`, lang: 'js' },
      right: { code: `const order = reactive({ quantity: 1 })\nconst { quantity } = toRefs(order) // quantity is a linked ref\n\norder.quantity++                    // quantity.value === 2`, lang: 'js' },
      explanation: 'Destructuring copies primitive values out of the proxy. Either keep accessing `order.quantity`, or convert with `toRefs()` / `toRef()` first.',
    },
    {
      title: 'Passing a primitive property to code that expects reactivity',
      wrong: { code: `const form = reactive({ email: '' })\nuseEmailValidation(form.email)   // passes '' — a plain string`, lang: 'js' },
      right: { code: `useEmailValidation(() => form.email)      // a getter\n// or\nuseEmailValidation(toRef(form, 'email'))  // a linked ref`, lang: 'js' },
      explanation: '`form.email` is evaluated immediately and only the current string is passed. The function can\'t know when it changes. Pass something it can re-read: a getter or a ref.',
    },
    {
      title: 'Calling reactive() with a primitive',
      wrong: { code: `const count = reactive(0) // dev warning; returns plain 0\ncount++                   // TypeError with const — and never reactive anyway`, lang: 'js' },
      right: { code: `const count = ref(0)\ncount.value++`, lang: 'js' },
      explanation: 'A Proxy can only wrap an object. For numbers, strings and booleans, use `ref()`.',
    },
    {
      title: 'Mutating the original object instead of the proxy',
      wrong: { code: `const raw = { likes: 0 }\nconst post = reactive(raw)\n\nraw.likes++   // no update: Vue never saw this write`, lang: 'js' },
      right: { code: `const post = reactive({ likes: 0 }) // don't keep the raw object around\n\npost.likes++`, lang: 'js' },
      explanation: 'Only operations that go *through* the proxy are tracked. Create the reactive object inline and use only the proxy.',
    },
  ],

  debugging: [
    {
      symptom: 'After a "reset" or after loading data, the screen still shows the old values.',
      cause: 'The variable holding the reactive object was reassigned to a new object.',
      fix: 'Use `Object.assign(state, newValues)` (or set properties individually), or switch to `ref()` and assign `state.value = newObject`.',
    },
    {
      symptom: 'A value pulled out with `const { x } = state` never updates.',
      cause: 'Destructuring copied the primitive value out of the proxy.',
      fix: 'Access `state.x` directly, or destructure from `toRefs(state)`.',
    },
    {
      symptom: 'Console warning: "value cannot be made reactive".',
      cause: '`reactive()` was called with a primitive (number, string, boolean, null).',
      fix: 'Use `ref()` for primitives, or wrap the value in an object.',
    },
    {
      symptom: '`set.has(item)` or `list.includes(obj)` returns false even though the object is "in there".',
      cause: 'Comparing a proxy with the raw object (or vice versa) — they are different objects.',
      fix: 'Use the reactive proxy consistently, or compare by an id instead of by object identity.',
    },
    {
      symptom: 'A ref stored inside a reactive array shows as an object in the template.',
      cause: 'Refs are unwrapped as properties of reactive objects, but not inside arrays, Maps or Sets.',
      fix: 'Use `list[0].value`, or store plain values in the array instead of refs.',
    },
  ],

  bestPractices: [
    'Default to `ref()`; choose `reactive()` for a cohesive group of fields you will mutate but never replace.',
    'Declare reactive objects with `const` and reset them with `Object.assign(obj, initial())`.',
    'Never destructure a reactive object directly — use `toRefs()` or keep the dot access.',
    'Pass getters or refs (not primitive property values) into composables and watchers.',
    'Create the reactive object inline (`reactive({ ... })`) so nobody can accidentally mutate the raw original.',
    'Pick one convention per codebase (or per kind of state) and stick to it.',
  ],

  useCases: [
    'Form models: `reactive({ name: \'\', email: \'\', terms: false })` bound with `v-model="form.email"`.',
    'Filter panels: search text, category, price range and toggles that are always used together.',
    'Game or editor state with several related fields mutated in place (player position, score, level).',
    'Local UI state for a complex widget (open sections, selected tab, scroll anchors).',
    'Under the hood: Pinia stores and `ref()`\'s object values are made reactive with the same machinery.',
  ],

  whenToUse: {
    use: [
      'You have several related fields that belong together and will be mutated in place.',
      'You want to write `form.email` instead of `form.value.email` and will never replace the object.',
      'You use `v-model` on many fields of one form.',
    ],
    avoid: [
      'Primitive values (numbers, strings, booleans) — use `ref()`.',
      'Data you will replace as a whole (API responses, a selected item) — use `ref()` / `shallowRef()`.',
      'State you return from a composable for callers to destructure — return refs (or `toRefs(state)`).',
      'Huge, deeply nested data you never mutate — deep proxies cost something; consider `shallowRef()`.',
    ],
  },

  comparison: {
    title: 'ref() vs reactive()',
    headers: ['', '`ref()`', '`reactive()`'],
    rows: [
      ['Can hold', 'any value: primitives, objects, arrays…', 'object types only (objects, arrays, Map, Set…)'],
      ['Access in script', '`count.value`, `form.value.email`', '`form.email` — no `.value`'],
      ['Access in template', '`{{ count }}` (top-level refs unwrapped)', '`{{ form.email }}`'],
      ['Replace the whole value', 'yes: `form.value = newForm`', 'no — reassigning disconnects; use `Object.assign`'],
      ['Destructuring / passing around', 'the ref itself travels safely', 'loses reactivity — use `toRefs()` / `toRef()`'],
      ['Deep reactivity', 'yes (objects go through `reactive()`)', 'yes'],
      ['Returned from composables', 'the usual choice', 'wrap with `toRefs()` before returning'],
      ['Vue docs recommendation', 'primary API for reactive state', 'useful for grouped state, with known limitations'],
    ],
    note: 'In short: `ref()` works everywhere and can be replaced; `reactive()` reads more naturally for grouped fields, as long as you never replace or destructure it. Next: [computed()](lesson:computed).',
  },

  quiz: [
    {
      id: 'reactive-q1',
      type: 'mcq',
      prompt: 'Which of these calls create **useful** reactive state with `reactive()`? (Select all that apply.)',
      options: [
        { text: '`reactive(42)`', why: 'A Proxy can only wrap objects. Vue warns in development and returns the plain number.' },
        { text: '`reactive({ count: 0 })`' },
        { text: '`reactive([1, 2, 3])`' },
        { text: '`reactive(new Map())`' },
        { text: '`reactive(\'hello\')`', why: 'Strings are primitives. Use `ref(\'hello\')`.' },
      ],
      answer: [1, 2, 3],
      explanation: '`reactive()` works on object types: plain objects, arrays and collections like `Map` and `Set`. Primitives need `ref()`.',
    },
    {
      id: 'reactive-q2',
      type: 'output',
      prompt: 'What does this log?',
      code: {
        lang: 'js',
        code: `import { reactive } from 'vue'

const raw = { count: 0 }
const a = reactive(raw)
const b = reactive(raw)

console.log(a === raw, a === b, reactive(a) === a)`,
      },
      options: [
        { text: '`true true true`', why: '`reactive()` returns a Proxy — a different object from the raw one.' },
        { text: '`false true true`' },
        { text: '`false false true`', why: 'Vue caches one proxy per raw object, so both calls return the same proxy.' },
        { text: '`false false false`', why: 'Calling `reactive()` on a proxy returns that same proxy, and the raw → proxy mapping is cached.' },
      ],
      answer: 1,
      explanation: 'The proxy is not the raw object (`false`). Vue caches proxies per raw object, so `a === b` (`true`). And `reactive()` on an existing reactive proxy returns it unchanged (`true`).',
    },
    {
      id: 'reactive-q3',
      type: 'bug',
      prompt: 'Clicking **Reset** clears nothing on screen. Click the line that causes the bug.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { reactive } from 'vue'

let filters = reactive({ search: '', onlyInStock: false })

function resetFilters() {
  filters = reactive({ search: '', onlyInStock: false })
}
</script>

<template>
  <input v-model="filters.search" />
  <input type="checkbox" v-model="filters.onlyInStock" />
  <button @click="resetFilters">Reset</button>
</template>`,
      },
      answerLine: 7,
      explanation: 'Line 7 replaces the variable with a brand-new reactive object. The template is still bound to the original one, which never changed. Use `Object.assign(filters, { search: \'\', onlyInStock: false })` and declare `filters` with `const`.',
    },
    {
      id: 'reactive-q4',
      type: 'fill',
      prompt: 'Fill the blanks so `email` stays linked to `form.email` after destructuring.',
      code: {
        lang: 'js',
        code: `import { reactive, ___ } from 'vue'

const form = reactive({ email: '', password: '' })
const { email, password } = ___(form)

email.___ = 'ada@example.com' // form.email changes too`,
      },
      answer: [['toRefs'], ['toRefs'], ['value']],
      explanation: '`toRefs()` converts each property into a ref linked to the reactive object. You then read and write it through `.value`.',
    },
    {
      id: 'reactive-q5',
      type: 'output',
      prompt: 'The button is clicked once. What does the paragraph show afterwards?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { reactive } from 'vue'

const user = reactive({ name: 'Ada' })

function addAge() {
  user.age = 36 // a property that did not exist before
}
</script>

<template>
  <p>{{ user.name }} is {{ user.age ?? 'unknown' }}</p>
  <button @click="addAge">Add age</button>
</template>`,
      },
      options: [
        { text: 'Ada is unknown', why: 'That was true in Vue 2, which could not detect new properties. Vue 3\'s Proxy intercepts the write.' },
        { text: 'Ada is 36' },
        { text: 'It throws: you cannot add properties to a reactive object', why: 'Reactive objects accept new properties like any object.' },
        { text: 'Ada is undefined', why: 'The `??` fallback only applies before the property exists; after the click it is 36.' },
      ],
      answer: 1,
      explanation: 'Vue 3 uses a Proxy, so adding a new property goes through the `set` trap and triggers updates. The render had tracked `user.age` (even while it was missing), so it re-runs. In Vue 2 this needed `Vue.set`.',
    },
    {
      id: 'reactive-q6',
      type: 'mcq',
      prompt: 'Your page shows the profile of the selected user. When another user is selected, you fetch their profile and want to **swap the whole object**. Which is the best fit?',
      options: [
        { text: '`const profile = reactive({})` and `profile = await fetchProfile(id)`', why: 'Reassigning a reactive variable disconnects the template (and fails with `const`).' },
        { text: '`const profile = ref(null)` and `profile.value = await fetchProfile(id)`' },
        { text: '`let profile = {}` and `profile = await fetchProfile(id)`', why: 'A plain object is not reactive at all.' },
        { text: '`const profile = reactive(await fetchProfile(id))` inside the click handler', why: 'This creates a new proxy every time, but the template is still bound to whatever it rendered first.' },
      ],
      answer: 1,
      explanation: 'Replacing a whole value is exactly what `ref()` is good at: assign a new object to `.value` and every reader updates. `ref(null)` also clearly signals "not loaded yet".',
    },
    {
      id: 'reactive-q7',
      type: 'short',
      prompt: 'In two or three sentences: why does `const { quantity } = order` (where `order` is reactive) stop updating, and how do you keep the link?',
      answer: 'Destructuring reads `order.quantity` once and stores the current number in a plain variable; later writes go to the proxy, and nothing updates the copy. Keep using `order.quantity`, or destructure from `toRefs(order)` so each variable is a ref linked to the property.',
    },
  ],

  exercises: [
    {
      id: 'signup-form',
      title: 'A sign-up form that resets properly',
      difficulty: 'beginner',
      prompt: `
The form state lives in one reactive object, but two things are broken: the submit button is never disabled, and **Reset** doesn't clear anything. Fix both.

- Inputs: \`<input class="name">\`, \`<input class="email">\`, checkbox \`<input class="terms" type="checkbox">\` — all bound to the reactive \`form\` object.
- \`<p class="preview">\` shows **Hello, {name}!** when a name is typed, and **Hello, stranger!** when the name is empty.
- \`<button class="submit">\` is **disabled** unless the name is not empty, the email contains an \`@\`, and terms are checked.
- \`<button class="reset">\` clears every field (empty name and email, terms unchecked).

Keep the form in a single \`reactive()\` object.
`,
      files: {
        'App.vue': `<script setup>
import { reactive } from 'vue'

let form = reactive({ name: '', email: '', terms: false })

function reset() {
  form = reactive({ name: '', email: '', terms: false })
}
</script>

<template>
  <input class="name" v-model="form.name" placeholder="Name" />
  <input class="email" v-model="form.email" placeholder="Email" />
  <label><input class="terms" type="checkbox" v-model="form.terms" /> I accept the terms</label>
  <p class="preview">Hello, {{ form.name }}!</p>
  <button class="submit">Create account</button>
  <button class="reset" @click="reset">Reset</button>
</template>`,
      },
      hints: [
        'Reset must change the *existing* object. Declare `form` with `const` and write the empty values into it.',
        '`Object.assign(form, { name: \'\', email: \'\', terms: false })` updates all three properties through the proxy. A small `initial()` factory avoids repeating the values.',
        'Add `const canSubmit = computed(() => form.name.trim() !== \'\' && form.email.includes(\'@\') && form.terms)` and bind `:disabled="!canSubmit"`. For the preview: `{{ form.name || \'stranger\' }}`.',
      ],
      solution: {
        explanation: 'The form stays one reactive object for its whole life. Reset writes into it with `Object.assign`, so every `v-model` binding and the computed `canSubmit` see the change. Reassigning the variable (the original bug) created a new object that nothing on screen was subscribed to.',
        files: {
          'App.vue': `<script setup>
import { reactive, computed } from 'vue'

const initial = () => ({ name: '', email: '', terms: false })

const form = reactive(initial())

const canSubmit = computed(() =>
  form.name.trim() !== '' && form.email.includes('@') && form.terms
)

function reset() {
  Object.assign(form, initial())
}
</script>

<template>
  <input class="name" v-model="form.name" placeholder="Name" />
  <input class="email" v-model="form.email" placeholder="Email" />
  <label><input class="terms" type="checkbox" v-model="form.terms" /> I accept the terms</label>
  <p class="preview">Hello, {{ form.name || 'stranger' }}!</p>
  <button class="submit" :disabled="!canSubmit">Create account</button>
  <button class="reset" @click="reset">Reset</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts with a disabled submit and a stranger greeting', code: `expect(find('.submit').disabled).toBe(true); expect(text('.preview')).toBe('Hello, stranger!')` },
        { name: 'the preview follows the name', code: `await type('.name', 'Ada'); expect(text('.preview')).toBe('Hello, Ada!')` },
        {
          name: 'submit is enabled only when all fields are valid',
          code: `await type('.name', 'Ada')
await type('.email', 'ada-at-example.com')
await check('.terms', true)
expect(find('.submit').disabled).toBe(true)
await type('.email', 'ada@example.com')
expect(find('.submit').disabled).toBe(false)`,
        },
        {
          name: 'reset clears every field',
          code: `await type('.name', 'Ada')
await type('.email', 'ada@example.com')
await check('.terms', true)
await click('.reset')
expect(find('.name').value).toBe('')
expect(find('.email').value).toBe('')
expect(find('.terms').checked).toBe(false)
expect(text('.preview')).toBe('Hello, stranger!')
expect(find('.submit').disabled).toBe(true)`,
        },
      ],
    },
    {
      id: 'tag-editor',
      title: 'Deep reactivity: a profile with tags',
      difficulty: 'beginner',
      prompt: `
Build a small profile editor on **one** reactive object:

\`\`\`js
const profile = reactive({ name: 'Ada', address: { city: 'London' }, tags: ['math'] })
\`\`\`

- \`<input class="city">\` is bound to the **nested** \`profile.address.city\`.
- \`<p class="city-label">\` shows the city in UPPERCASE (e.g. \`LONDON\`).
- \`<input class="tag-input">\` + \`<button class="add-tag">\` add the typed tag to \`profile.tags\` (ignore empty input, then clear the input).
- Each tag is rendered as \`<li class="tag">\`.
- \`<button class="clear-tags">\` removes all tags.
`,
      files: {
        'App.vue': `<script setup>
import { reactive, ref } from 'vue'

const profile = reactive({ name: 'Ada', address: { city: 'London' }, tags: ['math'] })
const newTag = ref('')

// TODO: addTag() and clearTags()
</script>

<template>
  <h2>{{ profile.name }}</h2>
  <input class="city" />
  <p class="city-label">LONDON</p>

  <input class="tag-input" v-model="newTag" />
  <button class="add-tag">Add tag</button>
  <ul>
    <li class="tag">math</li>
  </ul>
  <button class="clear-tags">Clear tags</button>
</template>`,
      },
      hints: [
        '`v-model="profile.address.city"` works on nested paths, because nested objects of a reactive object are reactive too.',
        'In `addTag()`, read `newTag.value.trim()`, push it into `profile.tags` if it is not empty, then set `newTag.value = \'\'`.',
        'To clear, mutate the existing array: `profile.tags.splice(0)` (or `profile.tags.length = 0`). Render tags with `v-for="tag in profile.tags"`.',
      ],
      solution: {
        explanation: 'Every level of the object is reactive: the nested `address.city` binding and the `tags` array mutations are both tracked through proxies created on access. Note the mix: the form-like profile is one reactive object, while the input\'s temporary text is a simple ref.',
        files: {
          'App.vue': `<script setup>
import { reactive, ref } from 'vue'

const profile = reactive({ name: 'Ada', address: { city: 'London' }, tags: ['math'] })
const newTag = ref('')

function addTag() {
  const tag = newTag.value.trim()
  if (!tag) return
  profile.tags.push(tag)
  newTag.value = ''
}

function clearTags() {
  profile.tags.splice(0)
}
</script>

<template>
  <h2>{{ profile.name }}</h2>
  <input class="city" v-model="profile.address.city" />
  <p class="city-label">{{ profile.address.city.toUpperCase() }}</p>

  <input class="tag-input" v-model="newTag" />
  <button class="add-tag" @click="addTag">Add tag</button>
  <ul>
    <li v-for="tag in profile.tags" :key="tag" class="tag">{{ tag }}</li>
  </ul>
  <button class="clear-tags" @click="clearTags">Clear tags</button>
</template>`,
        },
      },
      tests: [
        { name: 'the nested city input drives the label', code: `await type('.city', 'Pune'); expect(text('.city-label')).toBe('PUNE')` },
        {
          name: 'adds a tag and clears the input',
          code: `await type('.tag-input', 'poetry')
await click('.add-tag')
expect(findAll('.tag').map((li) => li.textContent.trim())).toEqual(['math', 'poetry'])
expect(find('.tag-input').value).toBe('')`,
        },
        { name: 'ignores empty tags', code: `await type('.tag-input', '   '); await click('.add-tag'); expect(findAll('.tag')).toHaveLength(1)` },
        { name: 'clears all tags', code: `await click('.clear-tags'); expect(findAll('.tag')).toHaveLength(0)` },
      ],
    },
  ],

  interview: [
    {
      id: 'reactive-vs-ref',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'What is the difference between `ref()` and `reactive()`, and when would you use each?',
      answer: '`ref()` wraps any value (including primitives) in an object with a reactive `.value`; it can be replaced wholesale and passed around or destructured from composables without losing reactivity. `reactive()` returns a deep Proxy of an object type, so you access properties directly without `.value`, but it cannot hold primitives, cannot be reassigned, and loses reactivity when destructured. The Vue docs recommend `ref()` as the primary API; `reactive()` suits a cohesive group of fields you mutate in place.',
      explanation: 'Both are deeply reactive and use the same tracking system. The difference is the container: a ref is a box you open with `.value`; reactive is a proxy you use like the object itself.',
      code: {
        lang: 'js',
        code: `const count = ref(0)             // any type
count.value++
user.value = await fetchUser()   // replace freely

const form = reactive({ email: '', terms: false })
form.email = 'a@b.co'            // no .value
// form = reactive({...})        // ❌ disconnects
// const { email } = form        // ❌ loses reactivity
Object.assign(form, { email: '' }) // ✅ reset in place`,
      },
      whyAsked: 'The single most common Vue reactivity interview question. It reveals whether you know the limitations, not just the syntax.',
      mistakes: [
        'Saying `reactive()` is "deep" and `ref()` is not — both are deep (ref passes objects through `reactive()`).',
        'Not knowing `reactive()` cannot hold primitives or be reassigned.',
        'Forgetting the destructuring caveat and how `toRefs()` fixes it.',
        'Claiming one is faster without evidence.',
      ],
      followUps: [
        'Why does destructuring a reactive object lose reactivity?',
        'What happens when you put a ref inside a reactive object? Inside a reactive array?',
        'Which would you return from a composable, and why?',
      ],
      modelAnswer: 'Both make state reactive with the same tracking system, but the container differs. `ref()` holds any value behind `.value`; because the ref object itself is what you pass around, you can replace the value wholesale and return refs from composables for callers to destructure. `reactive()` returns a deep Proxy of an object, so you write `form.email` with no `.value` — but it only works with objects, reassigning the variable disconnects the UI, and destructuring copies values out. I default to `ref()`, as the Vue docs recommend, and use `reactive()` for cohesive grouped state like a form model that I mutate in place and reset with `Object.assign`.',
    },
    {
      id: 'reactive-proxy-identity',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: '`reactive(obj)` returns a different object from `obj`. Why, and what practical problems can that cause?',
      answer: 'It returns a Proxy wrapping the original, because only operations that go through the proxy can be tracked and triggered. The raw object still exists, so mutating it directly bypasses reactivity, and identity checks between raw and proxy fail — `===`, `Set.has`, `Map.get`, or a library that compares objects. Use the proxy consistently; `toRaw()` exists for the rare cases that need the original.',
      explanation: 'Two objects now represent "the same" data: the raw target and its proxy. Mixing them is where bugs come from.',
      whyAsked: 'Probes whether you understand that reactivity is built on proxies, which explains a whole family of subtle bugs.',
      mistakes: ['Thinking `reactive()` mutates the original object in place to make it reactive.', 'Not knowing that `reactive(raw)` is cached, so repeated calls return the same proxy.'],
      followUps: ['What does `toRaw()` return and when is it appropriate?', 'What does `markRaw()` do?', 'How did Vue 2 make objects reactive instead?'],
      modelAnswer: 'Vue 3 implements `reactive()` with a JavaScript Proxy: a new object that forwards to the original but intercepts reads and writes, so Vue can track and trigger. That means two objects exist. If code mutates the raw object, nothing updates, and identity checks between raw and proxy — `===`, `Set.has`, `Map` keys, `indexOf` — can give surprising results. Vue caches one proxy per raw object, so calling `reactive()` again returns the same proxy. My rule is to create reactive state inline so only the proxy is ever referenced, and to use `toRaw()` only deliberately, for example when handing data to a library.',
    },
    {
      id: 'reactive-reset-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'After the API call resolves, the page still shows the empty initial state. What is wrong and how do you fix it?',
      code: {
        lang: 'js',
        code: `let settings = reactive({ theme: 'light', notifications: true })

async function load() {
  const data = await api.getSettings()
  settings = reactive(data)
}`,
      },
      answer: '`settings = reactive(data)` points the variable at a new proxy; the template and any computeds are subscribed to the original object, which never changed. Either write into the existing object (`Object.assign(settings, data)`, with `const settings`), or use `const settings = ref(...)` and assign `settings.value = data`.',
      explanation: 'Subscriptions belong to the object, not to the variable name. Replacing the object leaves the subscribers behind.',
      whyAsked: 'A very common real bug when people first move from refs to reactive objects.',
      mistakes: ['Blaming async timing and suggesting `nextTick()`.', 'Suggesting `$forceUpdate()`.'],
      followUps: ['What are the downsides of `Object.assign` for resetting (removed keys, nested objects)?', 'Why does `ref()` not have this problem?'],
      modelAnswer: 'The function replaces the variable with a new reactive object, but the template is still bound to the first one, so nothing re-renders. Reactivity follows the object, not the variable. I would either keep the reactive object and copy the data into it with `Object.assign(settings, data)` — declaring it `const` so reassignment is impossible — or, since this is server data I replace wholesale, use a ref and assign `settings.value = data`.',
    },
    {
      id: 'reactive-ref-unwrapping',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'What is logged?',
      code: {
        lang: 'js',
        code: `import { ref, reactive } from 'vue'

const count = ref(0)
const state = reactive({ count })

state.count = 5
console.log(count.value)        // A

const other = ref(100)
state.count = other
other.value++
console.log(count.value, state.count)  // B

const list = reactive([ref(1)])
console.log(typeof list[0])     // C`,
      },
      options: ['A: 5 · B: 5 101 · C: object', 'A: 0 · B: 0 100 · C: number', 'A: 5 · B: 101 101 · C: number', 'A: 5 · B: 5 100 · C: object'],
      correctOption: 0,
      answer: 'A logs `5`: assigning a plain value to a property that holds a ref sets that ref\'s `.value`. B logs `5 101`: assigning a *ref* replaces the old ref, so `count` is disconnected and `state.count` now unwraps `other` (101 after the increment). C logs `object`: refs inside reactive arrays are **not** unwrapped.',
      explanation: 'Reactive objects unwrap refs stored as properties, both when reading and (for non-ref values) when writing. Writing a new ref swaps the ref itself. Arrays and collections never unwrap.',
      whyAsked: 'Senior-level detail that shows you understand how refs and proxies interact — useful when composing state from several sources.',
      mistakes: ['Assuming refs are unwrapped inside arrays too.', 'Thinking `state.count = other` copies the value into `count`.'],
      followUps: ['How do you read the ref inside the array?', 'Does `shallowReactive()` unwrap refs?'],
      modelAnswer: 'A is 5, because writing a non-ref value to a property that holds a ref sets the ref\'s value — the reactive object is linked to `count`. B is "5 101": writing a ref replaces the stored ref, so `count` keeps 5 while `state.count` now unwraps `other`, which became 101. C is "object", because Vue doesn\'t unwrap refs inside reactive arrays or Map/Set — you\'d write `list[0].value`. (A `shallowReactive()` object doesn\'t unwrap refs at all.)',
    },
    {
      id: 'reactive-filters-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You are building a product filter panel with search text, category, min/max price and an "in stock" toggle. Would you use `ref()` or `reactive()`? How do you reset it, and how do you hand it to a `useProducts()` composable that refetches when filters change?',
      answer: 'A single `reactive()` object (or one `ref({...})`) fits: the fields belong together, are bound with `v-model` and are mutated in place. Reset with `Object.assign(filters, initialFilters())`. Pass the whole reactive object (or a getter) to the composable, which can `watch(filters, refetch)` — watching a reactive object is implicitly deep — or `watch(() => ({ ...filters }), …)`. Never pass `filters.search` alone: that is just a string.',
      explanation: 'Grouped, mutate-in-place state is reactive()\'s sweet spot. The risks are the usual ones: reassigning on reset and passing primitives instead of reactive sources.',
      code: {
        lang: 'js',
        code: `const initialFilters = () => ({ search: '', category: 'all', min: 0, max: 500, inStock: false })
const filters = reactive(initialFilters())

const { products, loading } = useProducts(filters) // pass the object, not filters.search

function reset() {
  Object.assign(filters, initialFilters())
}`,
      },
      whyAsked: 'Tests practical judgement: choosing a container, resetting it correctly and keeping reactivity intact across a composable boundary.',
      mistakes: ['Resetting with `filters = reactive(...)`.', 'Passing `filters.search` into the composable.', 'Refetching on every keystroke without debouncing.'],
      followUps: ['How would you sync these filters to the URL query string?', 'How would you debounce the search field but not the toggles?'],
      modelAnswer: 'These fields are one cohesive thing that I mutate in place, so a single reactive object works well — a `ref({...})` would also be fine if the team prefers refs. I keep an `initialFilters()` factory and reset with `Object.assign`. I pass the reactive object itself into `useProducts`, which watches it — watching a reactive object is deep by default — and refetches, ideally debounced for the search text. The key is never to pass `filters.search` alone, because that is just the current string.',
    },
    {
      id: 'reactive-coding-scoreboard',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 7,
      question: 'Build a match scoreboard using **one** `reactive()` object. Show the scores in `.home-score` and `.away-score` (both start at 0). `.home-goal` and `.away-goal` buttons add a goal. `.leader` shows **Home leads**, **Away leads** or **Draw**. `.reset` sets both scores back to 0.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { reactive } from 'vue'

</script>

<template>
  <p>Home <span class="home-score">0</span> – <span class="away-score">0</span> Away</p>
  <p class="leader">Draw</p>
  <button class="home-goal">Home goal</button>
  <button class="away-goal">Away goal</button>
  <button class="reset">Reset</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts 0–0, Draw', code: `expect(text('.home-score')).toBe('0'); expect(text('.away-score')).toBe('0'); expect(text('.leader')).toBe('Draw')` },
        { name: 'goals update scores and leader', code: `await click('.home-goal'); expect(text('.home-score')).toBe('1'); expect(text('.leader')).toBe('Home leads'); await click('.away-goal'); await click('.away-goal'); expect(text('.away-score')).toBe('2'); expect(text('.leader')).toBe('Away leads')` },
        { name: 'reset returns to 0–0', code: `await click('.home-goal'); await click('.away-goal'); await click('.away-goal'); await click('.reset'); expect(text('.home-score')).toBe('0'); expect(text('.away-score')).toBe('0'); expect(text('.leader')).toBe('Draw')` },
      ],
      hints: [
        'One object: `const score = reactive({ home: 0, away: 0 })`.',
        'Derive the leader with `computed()` comparing `score.home` and `score.away`.',
        'Reset in place: `Object.assign(score, { home: 0, away: 0 })`.',
      ],
      answer: 'Keep both scores in one reactive object, derive the leader with computed, and reset with Object.assign so the template stays connected.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { reactive, computed } from 'vue'

const score = reactive({ home: 0, away: 0 })

const leader = computed(() => {
  if (score.home > score.away) return 'Home leads'
  if (score.away > score.home) return 'Away leads'
  return 'Draw'
})

function reset() {
  Object.assign(score, { home: 0, away: 0 })
}
</script>

<template>
  <p>Home <span class="home-score">{{ score.home }}</span> – <span class="away-score">{{ score.away }}</span> Away</p>
  <p class="leader">{{ leader }}</p>
  <button class="home-goal" @click="score.home++">Home goal</button>
  <button class="away-goal" @click="score.away++">Away goal</button>
  <button class="reset" @click="reset">Reset</button>
</template>`,
        },
      },
      explanation: 'The two scores are related state that is always mutated in place — a natural fit for `reactive()`. The leader is derived, and reset writes into the same proxy rather than replacing it.',
      whyAsked: 'Checks that you can use `reactive()` correctly under time pressure, especially the reset.',
      mistakes: ['Resetting with `score = reactive({ home: 0, away: 0 })`.', 'Storing `leader` as separate state and updating it in each click handler.'],
      followUps: ['How would this look with two refs instead?', 'How would you add an undo for the last goal?'],
      modelAnswer: 'I keep `score` as one reactive object with `home` and `away`, increment them directly in the click handlers, derive the leader text with a computed, and reset with `Object.assign` so the template stays bound to the same proxy. With refs it would be two refs and `.value` in script — equally valid, slightly noisier.',
    },
  ],

  takeaways: [
    '`reactive(obj)` returns a deep Proxy: read and write properties directly, no `.value`.',
    'It only works with object types (objects, arrays, Map, Set) — use `ref()` for primitives.',
    'Never reassign a reactive object; mutate it or reset with `Object.assign`. Use `ref()` when you need to replace the whole value.',
    'Destructuring (or passing `state.prop`) copies values out of the proxy; use `toRefs()`, `toRef()` or getters.',
    'Refs inside reactive objects are unwrapped; refs inside reactive arrays and Maps are not.',
    'Vue recommends `ref()` as the primary API; `reactive()` shines for grouped state you mutate in place.',
  ],
}
