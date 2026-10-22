// Lesson: Dependency tracking deep dive (Level 11 — Advanced Reactivity & Internals)

// A deliberately incomplete mini engine: the playground experiments finish it.
const engineStart = `// reactivity.js — a SIMPLIFIED model of Vue's reactivity core.
// It shows the idea, not Vue's real source. Real Vue also handles arrays,
// Map/Set, refs, computed, batching, effect scopes, readonly, nested objects
// and debugging hooks, with much more efficient bookkeeping.

let activeEffect = null

// target object -> Map(key -> Set of effects that read target[key])
const targetMap = new WeakMap()

export function track(target, key) {
  if (!activeEffect) return // read outside any effect: nobody to subscribe
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

export function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  if (!dep) return
  // copy first: re-running an effect changes the Set while we loop
  for (const eff of [...dep]) {
    if (eff !== activeEffect) eff.run()
  }
}

export function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      return Reflect.get(obj, key, receiver)
    },
    set(obj, key, value, receiver) {
      const old = obj[key] // unused for now (see experiment 1)
      const ok = Reflect.set(obj, key, value, receiver)
      trigger(obj, key)
      return ok
    },
  })
}

export function cleanup(eff) {
  for (const dep of eff.deps) dep.delete(eff)
  eff.deps.length = 0
}

export function effect(fn) {
  const eff = {
    deps: [],
    run() {
      const prev = activeEffect
      activeEffect = eff
      try {
        return fn()
      } finally {
        activeEffect = prev
      }
    },
  }
  eff.run()
  return eff
}

// For the demo panel: how many effects subscribe to each key of a raw object
export function debugDeps(target) {
  const out = {}
  const depsMap = targetMap.get(target)
  if (depsMap) depsMap.forEach((dep, key) => (out[String(key)] = dep.size))
  return out
}`

// The finished engine (all four experiments applied) — used by the exercise.
const engineDone = `// reactivity.js — SIMPLIFIED engine, with the playground experiments applied.
let activeEffect = null
const targetMap = new WeakMap()

export function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

export function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  if (!dep) return
  for (const eff of [...dep]) {
    if (eff !== activeEffect) eff.run()
  }
}

export function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      return Reflect.get(obj, key, receiver)
    },
    has(obj, key) {
      track(obj, key)
      return Reflect.has(obj, key)
    },
    set(obj, key, value, receiver) {
      const old = obj[key]
      const ok = Reflect.set(obj, key, value, receiver)
      if (!Object.is(old, value)) trigger(obj, key)
      return ok
    },
    deleteProperty(obj, key) {
      const had = Object.prototype.hasOwnProperty.call(obj, key)
      const ok = Reflect.deleteProperty(obj, key)
      if (had) trigger(obj, key)
      return ok
    },
  })
}

function cleanup(eff) {
  for (const dep of eff.deps) dep.delete(eff)
  eff.deps.length = 0
}

export function effect(fn) {
  const eff = {
    deps: [],
    run() {
      cleanup(eff)
      const prev = activeEffect
      activeEffect = eff
      try {
        return fn()
      } finally {
        activeEffect = prev
      }
    },
  }
  eff.run()
  return eff
}`

const demoMain = `import { reactive, effect, debugDeps } from './reactivity.js'

const app = document.getElementById('app')
app.innerHTML =
  '<h2>A tiny reactivity engine</h2>' +
  '<p class="total">Total: <b></b></p>' +
  '<p class="label">Item: <b></b></p>' +
  '<div class="buttons">' +
  '<button data-act="qty">qty + 1</button> ' +
  '<button data-act="price">price + 1</button> ' +
  '<button data-act="same">qty = qty</button> ' +
  '<button data-act="toggle">toggle showItem</button> ' +
  '<button data-act="rename">rename item</button>' +
  '</div>' +
  '<h3>Who depends on what (cart)</h3><ul class="deps"></ul>' +
  '<h3>Effect runs</h3><ol class="log"></ol>'

const raw = { item: 'Notebook', price: 4, qty: 1, showItem: true }
const cart = reactive(raw)

function log(message) {
  const li = document.createElement('li')
  li.textContent = message
  app.querySelector('.log').appendChild(li)
}

// Effect 1: always reads price and qty
effect(() => {
  app.querySelector('.total b').textContent = cart.price * cart.qty
  log('total effect ran')
})

// Effect 2: reads item ONLY while showItem is true
effect(() => {
  app.querySelector('.label b').textContent = cart.showItem ? cart.item : '(hidden)'
  log('label effect ran')
})

function showDeps() {
  const deps = debugDeps(raw)
  app.querySelector('.deps').innerHTML = Object.keys(deps)
    .map((key) => '<li><code>' + key + '</code> → ' + deps[key] + ' effect(s)</li>')
    .join('')
}
showDeps()

const actions = {
  qty: () => cart.qty++,
  price: () => cart.price++,
  same: () => (cart.qty = cart.qty),
  toggle: () => (cart.showItem = !cart.showItem),
  rename: () => (cart.item = cart.item === 'Notebook' ? 'Sketchbook' : 'Notebook'),
}

app.querySelector('.buttons').addEventListener('click', (event) => {
  const act = event.target.dataset.act
  if (!act) return
  log('— you clicked "' + event.target.textContent + '"')
  actions[act]()
  showDeps()
})`

const vueVariant = `<script setup>
import { reactive, computed, watchEffect } from 'vue'

// The same cart, built on Vue's real reactivity system.
const cart = reactive({ item: 'Notebook', price: 4, qty: 1, showItem: true })

const total = computed(() => cart.price * cart.qty)
const label = computed(() => (cart.showItem ? cart.item : '(hidden)'))

// Open the console. This effect re-runs only when label's VALUE changes:
// "qty = qty" or renaming while hidden never reaches it.
watchEffect(() => {
  console.log('label is now:', label.value)
})
</script>

<template>
  <h2>The same cart, real Vue</h2>
  <p class="total">Total: <b>{{ total }}</b></p>
  <p class="label">Item: <b>{{ label }}</b></p>
  <button @click="cart.qty++">qty + 1</button>
  <button @click="cart.price++">price + 1</button>
  <button @click="cart.qty = cart.qty">qty = qty</button>
  <button @click="cart.showItem = !cart.showItem">toggle showItem</button>
  <button @click="cart.item = cart.item === 'Notebook' ? 'Sketchbook' : 'Notebook'">rename item</button>
</template>`

export default {
  id: 'dependency-tracking',
  title: 'Dependency tracking deep dive',
  summary: 'See exactly how Vue learns which effects depend on which pieces of state — proxies, track(), trigger() and dependencies that change on every run.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['how-reactivity-works', 'computed', 'watch-effect'],
  related: ['scheduling-flush', 'debugging-reactivity', 'shallow-and-raw', 'arrays-objects-reactivity', 'effect-scope'],
  tags: ['reactivity', 'internals', 'proxy', 'track', 'trigger', 'effect', 'dependencies', 'ref unwrapping', 'collections'],
  apis: [
    { name: 'reactive()', summary: 'Returns a deep reactive Proxy of an object; property reads are tracked and writes trigger effects.' },
    { name: 'toRaw()', summary: 'Returns the original object behind a reactive/readonly proxy. Reads on it are not tracked.' },
    { name: 'markRaw()', summary: 'Marks an object so Vue never converts it into a proxy.' },
    { name: 'isProxy()', summary: 'Checks whether a value is a proxy created by reactive(), readonly(), shallowReactive() or shallowReadonly().' },
    { name: 'Proxy (JavaScript)', summary: 'The built-in JavaScript object Vue 3 uses to intercept property reads and writes.' },
  ],
  docs: [
    { label: 'Vue Guide — Reactivity in Depth', url: 'https://vuejs.org/guide/extras/reactivity-in-depth.html' },
    { label: 'API — Reactivity: Core', url: 'https://vuejs.org/api/reactivity-core.html' },
    { label: 'API — Reactivity: Advanced', url: 'https://vuejs.org/api/reactivity-advanced.html' },
    { label: 'MDN — Proxy', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy' },
  ],

  intro: `
You already know the promise of Vue: change state, and the screen catches up. This lesson opens the hood and looks at the wiring that makes the promise true.

The short version is two verbs. When code that Vue is watching **reads** a piece of reactive state, Vue writes down "this code depends on that value" — that's **tracking**. When someone **writes** that value, Vue looks up everyone who depends on it and re-runs them — that's **triggering**.

The interesting part is the detail: *which* reads count, *when* the list of dependencies changes, what happens with arrays and Maps, and which parts of this machinery are a stable public API versus internals that Vue is free to rewrite.
`,

  why: `
Most "Vue is broken" bug reports are really dependency bugs:

- a computed shows a **stale** value because the thing it read was never tracked;
- a component **re-renders too often** because it read far more state than it needed;
- a \`watchEffect\` **stops reacting** to a filter because the filter was read after an \`await\`.

You can fix these by trial and error, or you can know the rule that explains all of them: **only reads that happen while an effect is running become dependencies, and they are re-collected on every run.** Once that rule is in your head, these bugs become obvious.

It also matters for performance. Vue's tracking is *fine-grained* — per property, per effect — so the less you read, the less you re-run. That is the foundation of the whole [performance level](lesson:how-vue-updates).
`,

  eli15: `
Picture a school with a notice board for every locker. Whenever a student **peeks into** a locker, a teacher quietly writes that student's name on the locker's notice board: "Sam looked in here".

When anyone **changes** what's in the locker, the teacher reads the notice board and taps every student on the shoulder: "Something you looked at changed — go check again."

That's Vue. The lockers are your reactive values. The students are *effects* — bits of code like your component's template or a \`computed\`. Peeking is a **read**, changing is a **write**.

One more twist: every time a student re-checks, the teacher **wipes their name off every board and writes it again** only where they actually looked this time. If Sam stops looking in locker 7, Sam stops being bothered about locker 7.
`,

  analogy: {
    title: 'The newsletter sign-up sheet',
    body: `
Imagine a magazine with a sign-up sheet per topic. Readers don't sign up by filling in a form — they're signed up **automatically** for every topic they *actually read* this month. If they read "sports" and "weather", they get alerts for exactly those.

When an article in "weather" is updated, the magazine checks the weather sheet and alerts those readers — nobody else. And each month the sheets are rebuilt from scratch, so a reader who stopped reading sports stops getting sports alerts.

Vue does the same, with code instead of people.
`,
    mapping: [
      ['a topic', 'a reactive property, e.g. `cart.qty` (or a ref\'s `.value`)'],
      ['a reader', 'an effect: a component render, a `computed`, a `watch`/`watchEffect`'],
      ['reading an article', 'a property read during the effect\'s run → `track()`'],
      ['the sign-up sheets', 'the dependency map: object → key → subscribed effects'],
      ['updating an article', 'a property write → `trigger()`'],
      ['rebuilding the sheets monthly', 'dependencies are re-collected on every run of an effect'],
    ],
  },

  visual: {
    type: 'dependency-tracker',
    props: { preset: 'cart' },
    title: 'A live dependency tracker',
    caption: 'Edit the cart state and watch which computeds and effects re-run. Notice what *doesn\'t* light up: anything that never read the value you changed.',
    alt: 'An interactive mini reactivity engine for a shopping cart. State values such as price and quantity are listed on the left, derived values and effects on the right, with lines showing which state each one depends on. Editing a value highlights only the computeds and effects connected to it and shows them re-running.',
    after: 'The visualizer uses a **simplified** engine built for teaching. The rules it shows — read = subscribe, write = notify, re-collect on every run — are the real rules; the bookkeeping inside Vue is more elaborate.',
  },

  syntax: [
    `
#### Effects: the code that can be "watching"

An **effect** is a function Vue runs while recording what it reads. You never create the raw machinery yourself; you create effects through public APIs:

- every component's **render** runs inside a *render effect* (created for you);
- \`computed(getter)\` — a lazy, cached effect that is also a reactive value;
- \`watch(source, cb)\` and \`watchEffect(fn)\` — effects that run your side effects.

Reads that happen **outside** a running effect — in \`<script setup>\` top-level code, in an event handler, in a \`setTimeout\` — are not tracked by anything. That's not a bug: there's simply no effect to subscribe.
`,
    {
      code: `import { reactive, computed } from 'vue'

const cart = reactive({ price: 4, qty: 2 })

const snapshot = cart.price * cart.qty           // read in setup: NOT tracked, computed once
const total = computed(() => cart.price * cart.qty) // read inside an effect: tracked

cart.qty = 3
console.log(snapshot)    // 8  — a plain number, frozen in time
console.log(total.value) // 12 — re-computed because qty is a dependency`,
      lang: 'js',
      title: 'tracked vs untracked reads',
    },
    `
#### What counts as a read (tracked) and a write (triggers)

Vue 3 wraps objects in a JavaScript **Proxy** — an object that sits in front of another object and gets a callback ("trap") for every operation on it. Different operations hit different traps, so Vue can track them separately:

| You write… | Proxy trap / method | Tracked as |
|---|---|---|
| \`obj.price\` | \`get\` | that key |
| \`'coupon' in obj\` | \`has\` | that key |
| \`Object.keys(obj)\`, \`for…in\`, \`v-for\` over an object | \`ownKeys\` | "the set of keys" (iteration) |
| \`arr[2]\`, \`arr.length\`, \`arr.map(…)\` | \`get\` + instrumented array methods | index / length / iteration |
| \`map.get(k)\`, \`set.has(v)\` | instrumented collection methods | that key |
| \`map.size\`, \`for…of map\` | instrumented collection methods | iteration |
| \`count.value\` (a ref) | the ref's getter | the ref itself |

Writes trigger the matching subscribers: setting a key (only if the value **actually changed**, compared like \`Object.is\`), adding or deleting a key (also triggers iteration), \`push\`/\`splice\` on arrays, \`set\`/\`add\`/\`delete\`/\`clear\` on Maps and Sets.
`,
    {
      callout: 'note',
      title: 'Why Map and Set need special handling',
      text: 'A Proxy can intercept property access, but `Map`/`Set` store their data in hidden internal slots, not properties. So Vue wraps their methods (`get`, `has`, `set`, `add`, `delete`, `clear`, `forEach`, `size`, iterators) to call track/trigger itself. `WeakMap`/`WeakSet` are supported too (without iteration, since they cannot be iterated).',
    },
    `
#### What is NOT tracked

- reads outside a running effect (setup code, event handlers, timers);
- reads that happen **after an \`await\`** inside an async effect — by then the effect has finished its synchronous run;
- plain objects, objects returned by \`toRaw()\`, objects marked with \`markRaw()\`, frozen objects;
- local variables copied out of reactive state (\`const { qty } = cart\` copies a number);
- the inside of values Vue cannot proxy, such as \`Date\` objects, class private fields (\`#secret\`), or DOM nodes.

#### Ref unwrapping rules (where \`.value\` disappears)
`,
    {
      code: `import { reactive, ref, isRef } from 'vue'

const count = ref(1)
const state = reactive({
  count,                         // a ref as an object property
  list: [ref(2)],                // a ref inside an array
  byId: new Map([['a', ref(3)]]),// a ref inside a Map
})

state.count          // 1      → unwrapped (property of a reactive object)
state.count = 5      // writes into the ref: count.value === 5
isRef(state.list[0]) // true   → NOT unwrapped inside arrays
isRef(state.byId.get('a')) // true → NOT unwrapped inside Map/Set`,
      lang: 'js',
      title: 'unwrapping inside reactive objects',
    },
    `
In templates, **top-level** refs of the component's setup are unwrapped. A ref nested in a plain object is not unwrapped inside an expression — \`{{ obj.count + 1 }}\` gives \`[object Object]1\`. There is one convenience exception: if a ref is the *final* value of a \`{{ }}\` interpolation (\`{{ obj.count }}\`), the text interpolation shows its value. \`shallowReactive()\` does not unwrap refs in its properties at all.
`,
    {
      callout: 'warn',
      title: 'Public API vs implementation details',
      text: 'Stable and documented: `ref`, `reactive`, `computed`, `watch`, `watchEffect`, `shallowRef`, `shallowReactive`, `readonly`, `toRaw`, `markRaw`, `isRef`/`isReactive`/`isProxy`, `effectScope`, `onTrack`/`onTrigger`. **Internal and free to change between releases:** the names `ReactiveEffect`, `Dep`, `Link`, `targetMap`, version counters, flag bits and the exact order effects run in. Vue 3.4 and 3.5 both reworked these internals substantially without breaking apps — because apps never depended on them. Yours shouldn\'t either.',
    },
  ],

  walkthrough: {
    title: 'reactivity.js (simplified engine)',
    lang: 'js',
    code: engineStart,
    intro: 'This is the mini engine from the playground — about 70 lines that capture the core idea. It is **simplified**: read it to understand Vue, never ship it.',
    steps: [
      { lines: [6], text: '`activeEffect` remembers which effect is running right now. It is the whole trick: a read can only be recorded if we know *who* is reading.' },
      { lines: [8, 9], text: 'The dependency map. A `WeakMap` from each raw object to a `Map` of keys, each holding a `Set` of effects. `WeakMap` means an object nobody uses anymore can still be garbage-collected.' },
      { lines: [11, 19], text: '`track(target, key)`: if no effect is running, do nothing. Otherwise find (or create) the Set for `target[key]` and add the running effect. The effect also keeps a list of the Sets it joined, so it can leave them later.' },
      { lines: [21, 28], text: '`trigger(target, key)`: find the subscribers of `target[key]` and re-run them. We loop over a **copy** because re-running an effect re-subscribes it, which would modify the Set mid-loop. Real Vue does not run them immediately — it queues them and batches the work (see [scheduling & flush timing](lesson:scheduling-flush)).' },
      { lines: [30, 43], text: '`reactive(target)` returns a Proxy. The `get` trap tracks, the `set` trap triggers. Note what is missing: no `has` trap (`in` is invisible), no `deleteProperty` trap, and `set` triggers even when the value did not change. The experiments fix all three.' },
      { lines: [45, 48], text: '`cleanup(eff)` removes an effect from every Set it joined. Nothing calls it yet — so effects never *forget* an old dependency. Experiment 2 is about that.' },
      { lines: [50, 65], text: '`effect(fn)` wraps your function. `run()` sets `activeEffect`, calls `fn` (whose reads get tracked), then restores the previous effect — the `try/finally` and `prev` make nested effects work, like a computed read inside a render.' },
    ],
  },

  playground: {
    title: 'Build a tiny reactivity engine',
    objective: 'Click the buttons and read the dependency map, then fix the engine\'s four gaps so it behaves like Vue.',
    files: { 'main.js': demoMain, 'reactivity.js': engineStart },
    expected: `
A cart showing **Total: 4** and **Item: Notebook**, five buttons, a live "who depends on what" list and a log of effect runs.

Try this first: click **qty = qty**. The total effect re-runs even though nothing changed. Then click **toggle showItem** (hides the item) and **rename item**: the label effect *still* re-runs, although it no longer reads \`item\`. Both are bugs in this engine — Vue doesn't do either. Switch to the **real Vue** variant to compare.
`,
    experiments: [
      {
        id: 'skip-same-value',
        task: 'Make the `set` trap in **reactivity.js** skip `trigger()` when the new value is the same as the old one (compare with `Object.is`, like Vue). Then click **qty = qty** again.',
        hint: 'You already have `old`. Wrap the call: `if (!Object.is(old, value)) trigger(obj, key)`.',
        tests: [
          {
            name: 'writing the same value does not re-run effects',
            code: `const { reactive, effect } = requireModule('reactivity.js')
const s = reactive({ qty: 1 })
let runs = 0
effect(() => { runs++; s.qty })
s.qty = 1
expect(runs).toBe(1)
s.qty = 2
expect(runs).toBe(2)`,
          },
        ],
        explain: 'Vue compares with `Object.is` semantics before triggering, so assigning the value a property already has is free. That is also why `NaN` → `NaN` does not trigger, while `0` → `-0` does (Object.is treats them as different).',
      },
      {
        id: 'dynamic-deps',
        task: 'Make effects **forget** dependencies they no longer read: call `cleanup(eff)` at the very start of `run()`. Then hide the item and click **rename item** — the label effect should stay quiet, and the map should show `item → 0`.',
        hint: 'Inside `effect()`, the first line of `run()` becomes `cleanup(eff)`. Every run then starts with an empty dependency list and re-collects only what it reads.',
        tests: [
          {
            name: 'an old branch no longer triggers the effect',
            code: `const { reactive, effect } = requireModule('reactivity.js')
const s = reactive({ useNick: true, nick: 'Ada', first: 'Augusta' })
let runs = 0
effect(() => { runs++; s.useNick ? s.nick : s.first })
s.useNick = false
expect(runs).toBe(2)
s.nick = 'A.'
expect(runs).toBe(2)
s.first = 'Lady'
expect(runs).toBe(3)`,
          },
        ],
        explain: 'Dependencies are **dynamic**: each run re-collects exactly what it read. Real Vue does the same — after a run, any dependency the effect did not touch again is dropped. Branches (`v-if`, ternaries, early returns) therefore change what an effect depends on, which is both correct and efficient.',
      },
      {
        id: 'track-has',
        task: 'The `in` operator is invisible to this engine. Add a `has(obj, key)` trap that calls `track(obj, key)` and returns `Reflect.has(obj, key)`, so an effect checking `\'coupon\' in cart` re-runs when a coupon is added.',
        hint: 'Add a third trap next to `get` and `set`. The `set` trap already triggers the key being written — and that is the same key `has` tracked.',
        tests: [
          {
            name: 'adding a key re-runs an effect that used `in`',
            code: `const { reactive, effect } = requireModule('reactivity.js')
const s = reactive({})
const seen = []
effect(() => { seen.push('coupon' in s) })
s.coupon = 'SAVE10'
expect(seen.length).toBe(2)
expect(seen[1]).toBe(true)`,
          },
        ],
        explain: 'Each kind of operation needs its own trap. Real Vue tracks `has` the same way, and also tracks a special "iteration" key for `ownKeys` so `Object.keys()` and `for…in` re-run when keys are added or removed.',
      },
      {
        id: 'delete-trap',
        task: 'Deleting a property should trigger too. Add a `deleteProperty(obj, key)` trap that deletes with `Reflect.deleteProperty` and calls `trigger(obj, key)` if the key existed.',
        hint: 'Check `Object.prototype.hasOwnProperty.call(obj, key)` **before** deleting, then delete, then trigger if it was there. Return the result of `Reflect.deleteProperty`.',
        tests: [
          {
            name: 'delete re-runs effects that read the key',
            code: `const { reactive, effect } = requireModule('reactivity.js')
const s = reactive({ coupon: 'SAVE10' })
const seen = []
effect(() => { seen.push(s.coupon) })
delete s.coupon
expect(seen.length).toBe(2)
expect(seen[1]).toBeUndefined()`,
          },
        ],
        explain: 'This is something Vue 2 could not do: with `Object.defineProperty`, adding or deleting properties was invisible and needed `Vue.set`/`Vue.delete`. Proxies made those helpers unnecessary in Vue 3.',
      },
    ],
    variants: [
      { id: 'real-vue', label: 'The same cart with real Vue', files: { 'App.vue': vueVariant } },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'From a read to a re-render',
    caption: 'Step through one full cycle: a render reads `cart.qty`, a click writes it, and only the effects that read it run again.',
    alt: 'A stepped diagram with six boxes: Render effect, Proxy traps, Dependency map, Click handler, Scheduler queue and DOM. The render effect reads cart.qty through the proxy, which records a subscription in the dependency map. Later the click handler writes cart.qty through the proxy, the dependency map supplies the subscribed effects to the scheduler queue, the render effect re-runs and the DOM is patched.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'handler', label: 'Click handler', note: 'cart.qty++', x: 110, y: 70, tone: 'kraft' },
        { id: 'render', label: 'Render effect', note: 'reads cart.qty', x: 110, y: 240, tone: 'acid' },
        { id: 'proxy', label: 'Proxy traps', note: 'get → track · set → trigger', x: 330, y: 155, tone: 'cobalt' },
        { id: 'deps', label: 'Dependency map', note: 'cart → qty → {render}', x: 560, y: 155, tone: 'ink' },
        { id: 'queue', label: 'Scheduler queue', note: 'batched, deduplicated', x: 650, y: 50, tone: 'paper' },
        { id: 'dom', label: 'DOM', note: 'only changed nodes', x: 650, y: 275, tone: 'paper' },
      ],
      edges: [
        { from: 'render', to: 'proxy', label: 'get' },
        { from: 'proxy', to: 'deps', label: 'track()' },
        { from: 'handler', to: 'proxy', label: 'set' },
        { id: 'trigger', from: 'deps', to: 'queue', label: 'trigger(): subscribers of qty' },
        { id: 'rerun', from: 'queue', to: 'render', label: 're-run (microtask)', dashed: true },
        { from: 'render', to: 'dom', label: 'patch' },
      ],
      steps: [
        { focus: ['render'], text: 'A component\'s render function runs inside a **render effect**. While it runs, Vue knows "the active effect is this component".' },
        { focus: ['render', 'proxy'], edges: ['render->proxy'], text: 'The template reads `cart.qty`. `cart` is a Proxy, so the read goes through its **get trap**.' },
        { focus: ['proxy', 'deps'], edges: ['proxy->deps'], text: 'The trap calls **track**: "the render effect depends on `cart.qty`". That fact is stored in the dependency map: object → key → subscribers.' },
        { focus: ['handler', 'proxy'], edges: ['handler->proxy'], text: 'Later a click runs `cart.qty++`. The **set trap** checks the value really changed (Object.is), stores it, and calls **trigger**.' },
        { focus: ['deps', 'queue'], edges: ['trigger'], text: 'Trigger looks up the subscribers of `cart.qty` — only those — and hands them to the **scheduler**, which queues and de-duplicates them.' },
        { focus: ['queue', 'render', 'dom'], edges: ['rerun', 'render->dom'], text: 'In a microtask the render effect re-runs, **re-collecting its dependencies from scratch**, and Vue patches only the DOM nodes whose output changed.' },
      ],
    },
  },

  internals: {
    beginner: `
Vue can't see you *thinking* about a value — it can only see you *touching* it. So it puts a see-through wrapper (a Proxy) around your objects, and a getter/setter around each ref's \`.value\`.

While a piece of watched code runs, every touch is noted: "this code read that". When a value is written, Vue checks its notes and re-runs only the code that read it. Every re-run starts with a clean sheet of notes, so the notes always describe what the code read *last time*.
`,
    technical: [
      `
**Proxies, created lazily.** \`reactive(obj)\` returns a Proxy and caches it in a WeakMap, so calling \`reactive(obj)\` twice returns the *same* proxy. Nested objects are not converted up front: the \`get\` trap wraps a nested object in \`reactive()\` only when you access it. That's why creating a reactive version of a big object is cheap until you walk all of it — and why *walking* all of it (deep watchers, \`JSON.stringify\` in a render) is not.

**The traps.** \`get\` tracks the key, unwraps refs stored in properties (not in arrays), and returns reactive versions of nested objects. \`set\` reads the old value, writes, and triggers only if the value changed; it also distinguishes *adding* a key from *changing* one, because adding must also notify anything that iterated the object. \`has\`, \`deleteProperty\` and \`ownKeys\` complete the picture. Arrays get instrumented methods so that, for example, \`includes()\`/\`indexOf()\` find an item whether you pass the raw object or its proxy, and so that \`push()\` inside an effect does not make the effect depend on \`length\` and loop forever.

**Effects.** Each subscriber — a component's render effect, a computed, a watcher — is an object Vue can run and notify. A component's render effect does "render + patch"; when notified, its *scheduler* doesn't run it immediately but queues an update job. A computed is both a subscriber (of what its getter reads) and a dependency (of whoever reads it), and it is lazy: notification only marks it dirty; it re-evaluates when someone reads it.
`,
      {
        callout: 'warn',
        title: 'Implementation details (as of Vue 3.5) — may change',
        text: 'Internally, each key\'s subscribers live in a `Dep` object, stored in a `targetMap` (WeakMap → Map → Dep). Since the 3.5 refactor, effects and deps are connected through `Link` nodes in doubly-linked lists, and deps carry **version numbers** so a computed can quickly check "did any of my sources change?" before re-running its getter; deps not touched during a run are unlinked afterwards. Earlier 3.x versions used Sets and different bookkeeping (3.4 also reworked computed). None of these names or structures are public API.',
      },
      `
**Dynamic dependencies.** Because tracking happens during the run, an effect's dependency list is a recording of its **last** run. A \`v-if\` that hides a block also removes everything that block read from the component's dependencies — the hidden block can't cause re-renders. This is the single most useful fact for performance work: *what you don't read can't wake you up.*
`,
    ],
    production: `
- **Read narrowly.** An effect that reads ten properties re-runs when any of them changes. Pass a child the one value it needs, not the whole object, and avoid reading entire objects in render (\`JSON.stringify(state)\`, spreading \`{ ...state }\` into props).
- **Big, replace-only data doesn't need deep tracking.** API payloads you swap wholesale, large lookup tables and third-party instances are better in \`shallowRef()\` or behind \`markRaw()\` — see [shallowRef, triggerRef, markRaw & toRaw](lesson:shallow-and-raw).
- **Compare by id, not identity.** \`reactiveList[0] === rawItem\` is \`false\` (one is a proxy). Comparing ids is robust; \`toRaw()\` is the escape hatch.
- **Never build on internals.** Don't import \`ReactiveEffect\`, read \`__v_raw\` or poke at \`dep\` objects. Use the documented tools: \`toRaw\`, \`isProxy\`, and the dev-only \`onTrack\`/\`onTrigger\` hooks (see [debugging reactivity](lesson:debugging-reactivity)).
- **Async effects:** read every reactive source you depend on **before** the first \`await\`, or use \`watch()\` with explicit sources.
`,
  },

  mistakes: [
    {
      title: 'Expecting a setup-time calculation to stay up to date',
      wrong: { code: `const cart = reactive({ price: 4, qty: 2 })\nconst total = cart.price * cart.qty // computed once, never again`, lang: 'js' },
      right: { code: `const cart = reactive({ price: 4, qty: 2 })\nconst total = computed(() => cart.price * cart.qty)`, lang: 'js' },
      explanation: '`<script setup>` runs once per component instance and is not an effect, so nothing tracks the reads on the first line. Wrapping the calculation in `computed()` runs it inside an effect, where the reads become dependencies.',
    },
    {
      title: 'Reading a dependency after `await` in `watchEffect`',
      wrong: { code: `watchEffect(async () => {\n  const res = await api.search(query.value)\n  results.value = res.filter((r) => r.type === category.value) // not tracked!\n})`, lang: 'js' },
      right: { code: `watchEffect(async () => {\n  const q = query.value\n  const cat = category.value      // read both before the first await\n  const res = await api.search(q)\n  results.value = res.filter((r) => r.type === cat)\n})`, lang: 'js' },
      explanation: 'Tracking only happens during the synchronous part of the effect\'s run. Code after `await` resumes later in a microtask, when the effect is no longer the active one. Changing `category` in the wrong version never re-runs the search.',
    },
    {
      title: 'Comparing a proxy with the raw object',
      wrong: { code: `const items = reactive([])\nconst item = await api.loadItem()\nitems.push(item)\n\nif (items[0] === item) { /* never true: items[0] is a proxy */ }`, lang: 'js' },
      right: { code: `if (items[0].id === item.id) { /* compare stable ids */ }\n// or, rarely: toRaw(items[0]) === item`, lang: 'js' },
      explanation: 'Reading an object out of reactive state gives you a **proxy** of it, which is a different object from the original. Vue patches `includes()`/`indexOf()` on reactive arrays to handle this, but your own `===` checks, plain `Set`s and `Map` keys outside Vue do not.',
    },
    {
      title: 'Relying on internal properties',
      wrong: { code: `const raw = state.__v_raw          // internal flag\nimport { ReactiveEffect } from 'vue' // low-level, undocumented class`, lang: 'js' },
      right: { code: `import { toRaw, isProxy } from 'vue'\nconst raw = toRaw(state)`, lang: 'js' },
      explanation: 'Some internals are reachable, but they are not documented API. Their names and behaviour changed in 3.4 and 3.5 and can change again in a minor release. `toRaw`, `isProxy`, `isReactive` and friends are the supported way to inspect reactive objects.',
    },
  ],

  debugging: [
    {
      symptom: 'A computed shows a stale value after you change a property.',
      cause: 'The getter read a copy (a destructured number, a plain object, a `toRaw()` result) instead of reactive state, so that value was never a dependency.',
      fix: 'Read the property from the reactive object or ref *inside* the getter. Make shared settings objects `reactive()` instead of plain.',
    },
    {
      symptom: '`watchEffect` reacts to the first input but ignores a second one.',
      cause: 'The second value is read after an `await`, outside the tracked synchronous run.',
      fix: 'Read all sources before the first `await`, or switch to `watch([a, b], cb)` with explicit sources.',
    },
    {
      symptom: 'A component re-renders when unrelated state changes.',
      cause: 'Its render reads more than it displays — iterating a whole object, passing a whole store object as a prop, `JSON.stringify` for debugging left in the template.',
      fix: 'Find the trigger with `onRenderTriggered` (dev builds, see [debugging reactivity](lesson:debugging-reactivity)), then read only what you need.',
    },
    {
      symptom: '`indexOf` / `===` / a plain `Set` can\'t find an object you know is there.',
      cause: 'One side is the raw object, the other its reactive proxy.',
      fix: 'Compare by a stable id. If you truly need identity, compare `toRaw(a) === toRaw(b)`.',
    },
  ],

  bestPractices: [
    'Remember the one rule: only reads *during* an effect\'s run are tracked, and they are re-collected on every run.',
    'Read reactive sources at the top of async effects, before any `await`.',
    'Derive values with `computed()` instead of copying state into variables.',
    'Keep effects narrow: read the specific properties you need, not whole objects.',
    'Use `shallowRef`/`markRaw` for large replace-only data and third-party class instances.',
    'Compare objects by id; treat proxy identity as an implementation detail.',
    'Build on documented APIs only — internals like `Dep`, `Link` and `ReactiveEffect` are not a contract.',
  ],

  useCases: [
    'Explaining (and fixing) why a computed or watcher is stale.',
    'Designing components that re-render only for the state they display.',
    'Deciding when large datasets should skip deep reactivity.',
    'Writing async effects and composables that keep tracking correctly.',
    'Answering "how does Vue reactivity work?" in a senior interview with real precision.',
  ],

  whenToUse: {
    use: [
      'Reach for this mental model whenever an update is missing or unexpected.',
      'Use branch-aware reads (`v-if`, early returns) knowing they shrink an effect\'s dependencies.',
      'Use `toRaw()` for one-off, untracked reads of large data — e.g. exporting to JSON.',
    ],
    avoid: [
      'Don\'t write your own tracking with internals; use `computed`, `watch` and `customRef` (see [customRef()](lesson:custom-ref)).',
      'Don\'t use `toRaw()` or `markRaw()` to "speed things up" by default — you silently lose updates. Measure first.',
      'Don\'t make huge, deeply nested data reactive just because it is convenient when you only ever replace it.',
    ],
  },

  comparison: {
    title: 'Three ways to detect changes',
    headers: ['', 'Vue 3 (Proxy)', 'Vue 2 (getters/setters)', 'Manual subscriptions'],
    rows: [
      ['New properties', 'detected (`set`/`has`/`ownKeys` traps)', 'invisible — needed `Vue.set`', 'only if you emit an event'],
      ['`arr[i] = x`, `delete obj.k`', 'detected', 'invisible — needed `splice`/`Vue.delete`', 'only if you emit an event'],
      ['Map / Set', 'supported via wrapped methods', 'not supported', 'manual'],
      ['When objects are converted', 'lazily, on first access', 'eagerly, the whole object at creation', 'n/a'],
      ['Who decides the dependencies', 'automatic, re-collected every run', 'automatic', 'you, by hand'],
      ['Risk', 'proxy identity surprises', 'missing reactivity caveats', 'forgotten subscriptions / leaks'],
    ],
    note: 'Vue 2 reached end of life on 31 Dec 2023; it appears here only to explain why Vue 3 moved to Proxies. For the beginner-level picture, revisit [How reactivity works](lesson:how-reactivity-works).',
  },

  quiz: [
    {
      id: 'dependency-tracking-q1',
      type: 'mcq',
      prompt: 'Which of these reads becomes a **dependency**?',
      options: [
        { text: '`cart.qty` read on the top level of `<script setup>`', why: 'Setup code is not an effect. Nothing is recording at that moment.' },
        { text: '`cart.qty` read inside a `computed()` getter' },
        { text: '`cart.qty` read inside a click handler', why: 'Event handlers run outside any effect, so the read is not tracked (and doesn\'t need to be).' },
        { text: '`cart.qty` read inside `setTimeout` started by a watcher', why: 'The timer callback runs later, after the watcher\'s run has finished, so no effect is active.' },
      ],
      answer: 1,
      explanation: 'Only reads that happen while an effect (render, computed, watcher) is running are tracked.',
    },
    {
      id: 'dependency-tracking-q2',
      type: 'output',
      prompt: 'How many times does the getter run in total? (What does the last line log?)',
      code: {
        lang: 'js',
        code: `const s = reactive({ useNick: false, nick: 'Ada', first: 'Augusta' })
let runs = 0
const name = computed(() => { runs++; return s.useNick ? s.nick : s.first })

name.value
s.nick = 'A.'
name.value
s.useNick = true
name.value
s.first = 'Lady'
name.value
console.log(runs)`,
      },
      options: ['1', '2', '3', '4'],
      answer: 1,
      explanation: 'First read: run 1 (deps: useNick, first). Changing `nick` affects nothing — it wasn\'t read. Flipping `useNick` marks it dirty; the next read is run 2 (deps now: useNick, nick). Changing `first` affects nothing anymore. Total: 2.',
    },
    {
      id: 'dependency-tracking-q3',
      type: 'bug',
      prompt: 'Changing `category` never re-runs this effect. Click the line where the untracked read happens.',
      code: {
        lang: 'js',
        code: `const query = ref('')
const category = ref('all')
const results = ref([])

watchEffect(async () => {
  const q = query.value
  const data = await api.search(q)
  results.value = data.filter((d) => category.value === 'all' || d.type === category.value)
})`,
      },
      answerLine: 8,
      explanation: '`category.value` is read after `await`, when the effect is no longer running. Read it into a variable before the `await` (or use `watch([query, category], …)`).',
    },
    {
      id: 'dependency-tracking-q4',
      type: 'fill',
      prompt: 'Fill in the two calls a reactive Proxy makes: one when a property is read, one when it is written.',
      code: {
        lang: 'js',
        code: `new Proxy(target, {
  get(obj, key, receiver) {
    ___(obj, key)
    return Reflect.get(obj, key, receiver)
  },
  set(obj, key, value, receiver) {
    const old = obj[key]
    const ok = Reflect.set(obj, key, value, receiver)
    if (!Object.is(old, value)) ___(obj, key)
    return ok
  },
})`,
      },
      answer: [['track'], ['trigger']],
      explanation: 'Read → `track()` records the active effect as a subscriber. Write → `trigger()` notifies the subscribers. (These are the names in Vue\'s source and in most explanations; they are internal functions, not imports for app code.)',
    },
    {
      id: 'dependency-tracking-q5',
      type: 'output',
      prompt: 'What does this log?',
      code: {
        lang: 'js',
        code: `const state = reactive({
  count: ref(1),
  list: [ref(2)],
})
console.log(state.count, isRef(state.list[0]))`,
      },
      options: [
        { text: '`1 true`' },
        { text: '`1 false`', why: 'Refs inside reactive **arrays** are not unwrapped — you still need `.value`.' },
        { text: '`RefImpl true`', why: 'A ref stored as a property of a reactive object *is* unwrapped on access.' },
        { text: '`RefImpl false`', why: 'Both halves are wrong: properties unwrap, array elements don\'t.' },
      ],
      answer: 0,
      explanation: 'Refs are unwrapped when they are properties of a reactive object, but not when they are elements of a reactive array or values in a Map/Set.',
    },
    {
      id: 'dependency-tracking-q6',
      type: 'mcq',
      prompt: 'Which of these is a **stable, documented** API you can build on?',
      options: [
        { text: 'The `Dep` and `Link` classes', why: 'Internal bookkeeping introduced/reworked in recent refactors; not part of the public API.' },
        { text: 'The `__v_raw` property on proxies', why: 'An internal flag. Use `toRaw()` instead.' },
        { text: '`toRaw()` and `isProxy()`' },
        { text: 'The order in which triggered effects run', why: 'Scheduling order is an internal detail. Code that depends on it is fragile.' },
      ],
      answer: 2,
      explanation: '`toRaw`, `isProxy`, `isReactive`, `markRaw` are documented in the Reactivity: Advanced/Utilities API. Internal classes, flags and ordering can change between minor versions.',
    },
    {
      id: 'dependency-tracking-q7',
      type: 'short',
      prompt: 'Why does Vue re-collect an effect\'s dependencies on every run instead of recording them once?',
      answer: 'Because what an effect reads can change between runs — branches, `v-if`, early returns and loops over changing data. Re-collecting means an effect depends exactly on what it read last time: it stops being woken by values it no longer uses (fewer wasted runs) and starts tracking values it newly reads (no stale output).',
    },
  ],

  exercises: [
    {
      id: 'mini-ref',
      title: 'Build ref() on top of track and trigger',
      difficulty: 'advanced',
      prompt: `
The finished mini engine is in \`reactivity.js\`. Implement \`ref(initial)\` in **ref.js** using its \`track\` and \`trigger\` exports.

- \`ref(initial)\` returns an object with a \`value\` **getter** that calls \`track(theRef, 'value')\` and returns the current value.
- Its \`value\` **setter** stores the new value and calls \`trigger(theRef, 'value')\` — but only if the value changed (\`Object.is\`).
- Two refs must be tracked independently.
- \`main.js\` already renders a counter (\`class="count"\`) with a button (\`class="inc"\`); it will work once your ref is reactive.
`,
      files: {
        'main.js': `import { effect } from './reactivity.js'
import { ref } from './ref.js'

const app = document.getElementById('app')
app.innerHTML = '<p>Count: <span class="count"></span></p><button class="inc">+1</button>'

const count = ref(0)

effect(() => {
  app.querySelector('.count').textContent = count.value
})

app.querySelector('.inc').addEventListener('click', () => {
  count.value++
})`,
        'ref.js': `import { track, trigger } from './reactivity.js'

export function ref(initial) {
  // TODO: return an object whose .value is tracked on read
  // and triggers (only when it changes) on write.
  return { value: initial }
}`,
        'reactivity.js': engineDone,
      },
      hints: [
        'A ref is just an object with a getter/setter pair called `value`. Keep the real value in a local variable (`let inner = initial`).',
        'Create the object first (`const r = { get value() {…}, set value(next) {…} }`) so the getter can call `track(r, \'value\')` — the ref object itself is the "target".',
        'In the setter: `if (Object.is(next, inner)) return; inner = next; trigger(r, \'value\')`.',
      ],
      solution: {
        explanation: 'A ref is the smallest reactive object there is: one key, `value`. Using the ref object itself as the tracking target gives every ref its own subscriber list, so two refs never wake each other. Vue\'s real `ref()` works on the same principle (plus deep conversion of objects via `reactive()`, a `Dep` per ref, and dev-mode debug info).',
        files: {
          'main.js': `import { effect } from './reactivity.js'
import { ref } from './ref.js'

const app = document.getElementById('app')
app.innerHTML = '<p>Count: <span class="count"></span></p><button class="inc">+1</button>'

const count = ref(0)

effect(() => {
  app.querySelector('.count').textContent = count.value
})

app.querySelector('.inc').addEventListener('click', () => {
  count.value++
})`,
          'ref.js': `import { track, trigger } from './reactivity.js'

export function ref(initial) {
  let inner = initial
  const r = {
    get value() {
      track(r, 'value')
      return inner
    },
    set value(next) {
      if (Object.is(next, inner)) return
      inner = next
      trigger(r, 'value')
    },
  }
  return r
}`,
          'reactivity.js': engineDone,
        },
      },
      tests: [
        {
          name: 'an effect re-runs when .value changes',
          code: `const { ref } = requireModule('ref.js')
const { effect } = requireModule('reactivity.js')
const count = ref(1)
const seen = []
effect(() => { seen.push(count.value) })
count.value = 2
expect(seen).toEqual([1, 2])`,
        },
        {
          name: 'writing the same value does not re-run',
          code: `const { ref } = requireModule('ref.js')
const { effect } = requireModule('reactivity.js')
const count = ref(1)
let runs = 0
effect(() => { runs++; count.value })
count.value = 1
expect(runs).toBe(1)`,
        },
        {
          name: 'two refs are tracked independently',
          code: `const { ref } = requireModule('ref.js')
const { effect } = requireModule('reactivity.js')
const a = ref(1)
const b = ref(1)
let aRuns = 0
effect(() => { aRuns++; a.value })
b.value = 5
expect(aRuns).toBe(1)
a.value = 2
expect(aRuns).toBe(2)`,
        },
        {
          name: 'the demo counter updates on click',
          code: `expect(text('.count')).toBe('0')
await click('.inc')
await click('.inc')
expect(text('.count')).toBe('2')`,
        },
      ],
    },
    {
      id: 'fix-lost-tracking',
      title: 'Find the untracked reads',
      difficulty: 'advanced',
      prompt: `
This real-Vue cart computes a total with tax, but the total goes stale. Fix the **tracking**, not the maths.

- \`.qty\` shows the quantity, \`.total\` shows the total with two decimals.
- **Add one** (\`class="add"\`) increases the quantity; the total must follow.
- **Toggle tax** (\`class="tax"\`) switches the tax rate between 10% and 0%; the total must follow.
- Starting state: price 4, qty 1, tax 10% → total **4.40**.
`,
      files: {
        'App.vue': `<script setup>
import { reactive, computed } from 'vue'

const cart = reactive({ price: 4, qty: 1 })
const settings = { taxRate: 0.1 }
const { qty } = cart

const total = computed(() => {
  return (cart.price * qty * (1 + settings.taxRate)).toFixed(2)
})

function addOne() {
  cart.qty++
}

function toggleTax() {
  settings.taxRate = settings.taxRate ? 0 : 0.1
}
</script>

<template>
  <p class="qty">Qty: {{ cart.qty }}</p>
  <p class="total">{{ total }}</p>
  <button class="add" @click="addOne">Add one</button>
  <button class="tax" @click="toggleTax">Toggle tax</button>
</template>`,
      },
      hints: [
        'Ask of every value the getter uses: "is this read going through a reactive proxy or ref, *inside* the getter?"',
        '`const { qty } = cart` copies the number 1 once. And `settings` is a plain object — Vue has no proxy to track.',
        'Use `cart.qty` inside the getter (delete the destructuring) and wrap settings in `reactive({ taxRate: 0.1 })`.',
      ],
      solution: {
        explanation: 'Two untracked reads: `qty` was a destructured copy (a number has no proxy), and `settings` was a plain object (no proxy to call `track`). Reading `cart.qty` inside the getter and making `settings` reactive puts both reads through traps, so the computed depends on price, qty and taxRate. Note the sneaky part of the original: clicking **Add one** *did* re-render (the template reads `cart.qty`) — but the computed stayed cached because none of its own dependencies had changed.',
        files: {
          'App.vue': `<script setup>
import { reactive, computed } from 'vue'

const cart = reactive({ price: 4, qty: 1 })
const settings = reactive({ taxRate: 0.1 })

const total = computed(() => {
  return (cart.price * cart.qty * (1 + settings.taxRate)).toFixed(2)
})

function addOne() {
  cart.qty++
}

function toggleTax() {
  settings.taxRate = settings.taxRate ? 0 : 0.1
}
</script>

<template>
  <p class="qty">Qty: {{ cart.qty }}</p>
  <p class="total">{{ total }}</p>
  <button class="add" @click="addOne">Add one</button>
  <button class="tax" @click="toggleTax">Toggle tax</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts at 4.40', code: `expect(text('.total')).toBe('4.40')` },
        { name: 'adding one updates the total to 8.80', code: `await click('.add'); expect(text('.qty')).toContain('2'); expect(text('.total')).toBe('8.80')` },
        { name: 'toggling tax updates the total to 4.00', code: `await click('.tax'); expect(text('.total')).toBe('4.00')` },
        { name: 'both together: 8.00', code: `await click('.add'); await click('.tax'); expect(text('.total')).toBe('8.00')` },
      ],
    },
  ],

  interview: [
    {
      id: 'dependency-tracking-what-is-effect',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is an "effect" in Vue\'s reactivity system? Name the kinds of effects a typical app has.',
      answer: 'An effect is a function Vue runs while recording which reactive values it reads, so it can re-run it when one of them changes. Typical apps have three kinds: each component\'s render effect (created automatically), `computed()` getters (lazy, cached effects), and watchers created with `watch()`/`watchEffect()`.',
      explanation: 'Reactive state is only half the system — effects are the other half, the "subscribers". Without a running effect, reading state records nothing.',
      whyAsked: 'Checks that the candidate sees reactivity as state + subscribers, not as magic variables.',
      mistakes: ['Saying "Vue watches all variables".', 'Forgetting that the template itself is an effect.', 'Confusing effects with lifecycle hooks.'],
      followUps: ['Is `<script setup>` an effect?', 'What makes a computed different from a watcher?', 'What happens to a component\'s effects when it unmounts?'],
      modelAnswer: 'An effect is a function Vue runs while tracking what it reads — reads become subscriptions, so when one of those values changes Vue re-runs the function. Every component has a render effect that Vue creates for me; `computed` creates a lazy, cached effect that is also a value; `watch` and `watchEffect` create effects for side effects. Plain setup code and event handlers are not effects, which is why reads there are not tracked. When the component unmounts, its effects are stopped.',
    },
    {
      id: 'dependency-tracking-click-to-dom',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Walk me through what happens between `cart.qty++` in a click handler and the new number appearing on screen.',
      answer: 'During the last render, the template read `cart.qty` through the reactive Proxy\'s get trap, which tracked the component\'s render effect as a subscriber of (cart, "qty"). `cart.qty++` hits the set trap: Vue compares old and new values, stores the new one and triggers the subscribers of that key. The render effect\'s scheduler queues an update job; in a microtask the queue flushes, the component re-renders (re-collecting dependencies), and Vue patches only the DOM nodes whose output changed.',
      explanation: 'Read → track, write → trigger → queue → flush → render → patch. Batching means several writes in the same tick cause one re-render.',
      whyAsked: 'A classic depth probe: it reveals whether the candidate understands proxies, subscriptions, batching and the virtual DOM step.',
      mistakes: ['Skipping the tracking step ("Vue just knows").', 'Saying the update happens synchronously inside the setter.', 'Claiming the whole app re-renders.'],
      followUps: ['Why are updates batched?', 'What if the value was set to the same number?', 'How does `nextTick()` relate to this?'],
      modelAnswer: 'When the component last rendered, its render effect read `cart.qty` through the Proxy\'s get trap, so Vue recorded the render effect as a subscriber of that key. The click runs `cart.qty++`, which hits the set trap; if the value really changed, Vue triggers that key\'s subscribers. The render effect doesn\'t run right away — its scheduler queues a job, so several changes in one tick produce one update. In a microtask the queue flushes, the component renders a new virtual tree, re-tracking its dependencies, and the patch step updates just the text node that changed.',
    },
    {
      id: 'dependency-tracking-dynamic',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'A component renders `<p v-if="showDetails">{{ user.email }}</p>`, and `showDetails` is `false`. You change `user.email`. Does the component re-render?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, reactive } from 'vue'
const showDetails = ref(false)
const user = reactive({ name: 'Ada', email: 'ada@example.com' })
</script>

<template>
  <h2>{{ user.name }}</h2>
  <p v-if="showDetails">{{ user.email }}</p>
</template>`,
      },
      options: ['Yes — `user` is reactive, so any change re-renders', 'No — the last render never read `user.email`', 'Only if `deep: true` is set', 'Yes, but the DOM is not patched'],
      correctOption: 1,
      answer: 'No. Dependencies are re-collected on every render. With `showDetails` false, the last render read `showDetails` and `user.name` but never `user.email`, so the component is not subscribed to it.',
      explanation: 'Tracking is per property and per run. Hidden branches contribute no dependencies — until they are shown again.',
      whyAsked: 'Tests whether the candidate knows dependencies are dynamic, which matters for both correctness and performance reasoning.',
      mistakes: ['Assuming reactivity is per object ("user changed").', 'Thinking dependencies are fixed at mount time.'],
      followUps: ['What happens when `showDetails` becomes true?', 'How would you verify this in a dev build?'],
      modelAnswer: 'No. Vue re-collects dependencies on every run of an effect, and the render that ran last never evaluated the `v-if` branch, so it never read `user.email`. Tracking is per property, not per object, so changing email notifies nobody. When `showDetails` flips to true, the component re-renders, reads email, and from then on it is a dependency. I could confirm it with `onRenderTriggered` in development, which logs the key that caused each re-render.',
    },
    {
      id: 'dependency-tracking-async-read',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This search re-runs when `query` changes but ignores changes to `sort`. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `watchEffect(async () => {
  const items = await api.search(query.value)
  results.value = [...items].sort(sorters[sort.value])
})`,
      },
      answer: '`sort.value` is read after the `await`. Tracking only happens during the effect\'s synchronous run; the code after `await` runs later, with no active effect. Read `sort.value` before the await, or use `watch([query, sort], …)` so the sources are explicit.',
      explanation: 'An async function returns at its first `await`. From Vue\'s perspective, the effect has finished running at that point.',
      whyAsked: 'A very common production bug in data-fetching code that tests real understanding of when tracking happens.',
      mistakes: ['Blaming caching or suggesting `nextTick`.', 'Adding `deep: true`.', 'Not mentioning the option of explicit `watch` sources.'],
      followUps: ['How would you also cancel the stale request when `query` changes quickly?', 'Would `watch` with a getter have the same problem?'],
      modelAnswer: 'Vue tracks reads only while the effect runs synchronously. An async function hands control back at its first `await`, so by the time `sort.value` is read the effect is no longer active and the read isn\'t recorded. The fix is to read every source up front — `const q = query.value; const s = sort.value` — before awaiting, or to use `watch([query, sort], …)` where the sources are explicit. In real code I\'d also guard against stale responses with `onWatcherCleanup` (3.5+) or the `onCleanup` argument.',
    },
    {
      id: 'dependency-tracking-collections',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How can Vue track `Object.keys(obj)`, `\'k\' in obj`, array iteration and `Map`/`Set` operations, when a Proxy only sees property access?',
      answer: 'A Proxy has more traps than get/set: `has` covers `in`, `ownKeys` covers `Object.keys`/`for…in`, `deleteProperty` covers `delete`. For iteration Vue tracks a special "iteration" dependency that is triggered when keys are added or removed. Arrays get instrumented methods (iteration, `includes`/`indexOf` that work with raw and proxied items, mutators that avoid tracking `length`). Map/Set keep data in internal slots a Proxy can\'t see, so Vue wraps their methods (`get`, `has`, `set`, `add`, `delete`, `clear`, `size`, iterators) to call track/trigger itself.',
      explanation: 'Different operations need different hooks; Vue uses every Proxy trap and wraps the methods that traps can\'t reach.',
      whyAsked: 'Separates candidates who know "Proxy get/set" from those who understand the full model — useful for debugging list and collection reactivity.',
      mistakes: ['Saying Map/Set are not reactive in Vue 3 (they are, via `reactive()`/`ref()`).', 'Not knowing about iteration tracking.', 'Presenting internal names as public API.'],
      followUps: ['Why doesn\'t adding a key to a `shallowReactive` object\'s nested object trigger?', 'Why does `push()` inside an effect not cause an infinite loop?'],
      modelAnswer: 'Proxies have traps for more than get and set: `has` for the `in` operator, `ownKeys` for `Object.keys` and `for…in`, and `deleteProperty`. For "the set of keys" Vue tracks a special iteration dependency, triggered whenever a key is added or deleted. Arrays get instrumented methods so iteration is tracked sensibly and `includes` works with raw or proxied items. Maps and Sets store data in internal slots that a Proxy can\'t intercept, so Vue returns wrapped versions of their methods that call track and trigger. The exact keys and data structures are internals — the guarantee is just that these operations are reactive.',
    },
    {
      id: 'dependency-tracking-internals-advice',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'A teammate wants to build a feature on `ReactiveEffect`, a proxy\'s `__v_raw` flag and the order in which triggered effects run. What do you advise?',
      answer: 'Don\'t. Those are implementation details: Vue 3.4 and 3.5 both rewrote the reactivity internals without a breaking change because apps weren\'t supposed to depend on them. Use documented APIs instead — `computed`, `watch`/`watchEffect` (with `flush` options), `effectScope`, `customRef`, `toRaw`/`markRaw`/`isProxy`, and dev-only `onTrack`/`onTrigger` for debugging. If ordering matters, make it explicit in code rather than relying on scheduler order.',
      explanation: 'Public API comes with compatibility promises; internals can change in any minor release.',
      whyAsked: 'Assesses engineering judgement: knowing the internals is valuable, depending on them is a liability.',
      mistakes: ['Approving it because "it works today".', 'Not offering public alternatives.', 'Claiming everything exported from `vue` is stable public API (some low-level exports are undocumented).'],
      followUps: ['Which public API would replace a hand-made effect with cleanup?', 'How would you detect if an upgrade broke such code?'],
      modelAnswer: 'I\'d push back. `ReactiveEffect`, internal flags like `__v_raw` and the run order of triggered effects are implementation details — the 3.4 and 3.5 releases rewrote that machinery, and it can change again in a minor version. Almost every need has a documented equivalent: `watchEffect` or `effectScope` for managed effects, `customRef` for custom tracking, `toRaw` instead of `__v_raw`, and explicit `flush` options or a single orchestrating function instead of relying on order. If we truly need something lower level, we isolate it behind one module with tests that run on every Vue upgrade.',
    },
    {
      id: 'dependency-tracking-coding-reactive',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 12,
      question: 'Implement `reactive(target)` in **reactivity.js** using the provided `track`, `trigger` and `effect`. It must: track reads, trigger writes only when the value changes, make **nested objects** reactive lazily, and return the **same proxy** for the same object.',
      starter: {
        files: {
          'reactivity.js': `let activeEffect = null
const targetMap = new WeakMap()

export function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
}

export function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  if (dep) for (const eff of [...dep]) if (eff !== activeEffect) eff.run()
}

export function effect(fn) {
  const eff = {
    run() {
      const prev = activeEffect
      activeEffect = eff
      try { return fn() } finally { activeEffect = prev }
    },
  }
  eff.run()
  return eff
}

// TODO: return a Proxy that tracks reads and triggers changed writes.
// Nested objects must be reactive too; the same target -> the same proxy.
export function reactive(target) {
  return target
}`,
        },
      },
      tests: [
        {
          name: 'top-level writes re-run effects',
          code: `const { reactive, effect } = requireModule('reactivity.js')
const s = reactive({ qty: 1 })
const seen = []
effect(() => { seen.push(s.qty) })
s.qty = 2
expect(seen).toEqual([1, 2])`,
        },
        {
          name: 'nested objects are reactive',
          code: `const { reactive, effect } = requireModule('reactivity.js')
const s = reactive({ user: { name: 'Ada' } })
const seen = []
effect(() => { seen.push(s.user.name) })
s.user.name = 'Grace'
expect(seen).toEqual(['Ada', 'Grace'])`,
        },
        {
          name: 'the same object always gets the same proxy',
          code: `const { reactive } = requireModule('reactivity.js')
const raw = { user: { name: 'Ada' } }
expect(reactive(raw) === reactive(raw)).toBe(true)
const s = reactive(raw)
expect(s.user === s.user).toBe(true)`,
        },
        {
          name: 'writing the same value does not trigger',
          code: `const { reactive, effect } = requireModule('reactivity.js')
const s = reactive({ qty: 1 })
let runs = 0
effect(() => { runs++; s.qty })
s.qty = 1
expect(runs).toBe(1)`,
        },
      ],
      hints: [
        'Keep a `WeakMap` from raw objects to their proxies. Check it first and store new proxies in it.',
        'In the `get` trap: track, then `Reflect.get`; if the result is a non-null object, return `reactive(result)` (lazy deep conversion).',
        'In the `set` trap, remember the old value, `Reflect.set`, and trigger only if `!Object.is(old, value)`. Return the boolean from `Reflect.set`.',
      ],
      answer: 'Cache proxies in a WeakMap; in `get`, track and lazily wrap nested objects; in `set`, trigger only on real changes.',
      solution: {
        files: {
          'reactivity.js': `let activeEffect = null
const targetMap = new WeakMap()

export function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
}

export function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  if (dep) for (const eff of [...dep]) if (eff !== activeEffect) eff.run()
}

export function effect(fn) {
  const eff = {
    run() {
      const prev = activeEffect
      activeEffect = eff
      try { return fn() } finally { activeEffect = prev }
    },
  }
  eff.run()
  return eff
}

const proxyCache = new WeakMap()

export function reactive(target) {
  const existing = proxyCache.get(target)
  if (existing) return existing

  const proxy = new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      const value = Reflect.get(obj, key, receiver)
      // lazy deep conversion: wrap nested objects only when accessed
      return value !== null && typeof value === 'object' ? reactive(value) : value
    },
    set(obj, key, value, receiver) {
      const old = obj[key]
      const ok = Reflect.set(obj, key, value, receiver)
      if (!Object.is(old, value)) trigger(obj, key)
      return ok
    },
  })

  proxyCache.set(target, proxy)
  return proxy
}`,
        },
      },
      explanation: 'The cache gives proxy identity (`reactive(raw) === reactive(raw)`), and lazy wrapping in `get` makes nesting deep without converting the whole tree up front — the same strategy Vue uses. Simplifications vs. Vue: no `has`/`deleteProperty`/`ownKeys` traps, no array or Map/Set handling, no ref unwrapping, no storing raw values on write, no batching.',
      whyAsked: 'Implementing a reactive proxy is the standard way to prove you understand Vue 3\'s reactivity, beyond the API surface.',
      mistakes: ['Converting the whole object recursively up front.', 'Forgetting the proxy cache, so `s.user !== s.user`.', 'Triggering on every write, even unchanged ones.', 'Not returning `true`/the Reflect result from `set` (a TypeError in strict mode).'],
      followUps: ['How would you support `delete` and `in`?', 'Why does Vue store the raw value, not the proxy, when you assign a reactive object?', 'How would you add batching?'],
      modelAnswer: 'I keep a WeakMap from targets to proxies so the same object always maps to the same proxy. The get trap calls track, reads with `Reflect.get`, and if the value is an object it returns `reactive(value)` — lazy deep conversion, so I never walk the whole tree up front. The set trap stores the value with `Reflect.set` and triggers only if `Object.is` says it changed. To be closer to Vue I\'d add `has`, `ownKeys` and `deleteProperty` traps, iteration tracking, and queue effects instead of running them synchronously.',
    },
  ],

  takeaways: [
    'Read = subscribe (`track`), write = notify (`trigger`) — but only reads made *while an effect is running* count.',
    'Effects are component renders, computeds and watchers; setup code and event handlers are not effects.',
    'Dependencies are re-collected on every run, so branches and `v-if` change what an effect depends on.',
    'Vue uses all Proxy traps (`get`, `set`, `has`, `ownKeys`, `deleteProperty`) plus wrapped array and Map/Set methods.',
    'Refs unwrap as reactive-object properties, not inside arrays or Maps; templates unwrap top-level refs.',
    'Reads after `await`, on plain/raw objects or on copies are not tracked.',
    '`Dep`, `Link`, `ReactiveEffect`, version counters and run order are internals — build only on documented APIs.',
  ],
}
