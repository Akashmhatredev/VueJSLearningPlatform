// Lesson: how Vue's reactivity works — proxies, track & trigger, effects and the scheduler.
// Includes a SIMPLIFIED mini reactivity engine for the playground and exercises.

const miniEngine = `// A SIMPLIFIED, teaching-sized reactivity engine — NOT Vue's source code.
// Real Vue adds a scheduler, dependency cleanup, arrays, collections,
// refs, computed caching, readonly/shallow variants and much more.

const targetMap = new WeakMap() // target object -> Map(key -> Set of effects)
let activeEffect = null         // the effect that is running right now

export function track(target, key) {
  if (!activeEffect) return     // reads outside an effect subscribe nobody
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
}

export function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  if (dep) [...dep].forEach((effect) => effect())
}

export function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      return Reflect.get(obj, key, receiver)
    },
    set(obj, key, value, receiver) {
      const result = Reflect.set(obj, key, value, receiver)
      trigger(obj, key)
      return result
    },
  })
}

export function effect(fn) {
  const run = () => {
    const previous = activeEffect
    activeEffect = run
    try {
      fn()
    } finally {
      activeEffect = previous
    }
  }
  run()
  return run
}`

const cartMain = `import { reactive, effect } from './mini-reactivity.js'

const app = document.getElementById('app')
app.innerHTML =
  '<p class="total"></p>' +
  '<p class="coupon"></p>' +
  '<button class="add">Add €10 item</button>' +
  '<button class="apply">Apply SAVE5</button>'

const cart = reactive({ subtotal: 20, coupon: '' })

// Effect 1: the total depends on subtotal AND coupon
effect(() => {
  const discount = cart.coupon === 'SAVE5' ? 5 : 0
  app.querySelector('.total').textContent = 'Total: €' + (cart.subtotal - discount)
  console.log('effect: total rendered')
})

// Effect 2: the coupon line depends on coupon only
effect(() => {
  app.querySelector('.coupon').textContent = cart.coupon ? 'Coupon: ' + cart.coupon : 'No coupon'
  console.log('effect: coupon rendered')
})

app.querySelector('.add').addEventListener('click', () => {
  cart.subtotal += 10
})

app.querySelector('.apply').addEventListener('click', () => {
  cart.coupon = 'SAVE5'
})`

// ---------- exercise 1: implement track() and trigger()
const trackTriggerStarter = `// SIMPLIFIED engine for practice — fill in track() and trigger().

const targetMap = new WeakMap() // target -> Map(key -> Set of effects)
let activeEffect = null

export function track(target, key) {
  // TODO: if an effect is running, remember that it depends on target[key]
}

export function trigger(target, key) {
  // TODO: re-run every effect that depends on target[key]
}

export function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      return Reflect.get(obj, key, receiver)
    },
    set(obj, key, value, receiver) {
      const result = Reflect.set(obj, key, value, receiver)
      trigger(obj, key)
      return result
    },
  })
}

export function effect(fn) {
  const run = () => {
    const previous = activeEffect
    activeEffect = run
    try {
      fn()
    } finally {
      activeEffect = previous
    }
  }
  run()
  return run
}`

const trackTriggerSolution = trackTriggerStarter
  .replace(
    `export function track(target, key) {
  // TODO: if an effect is running, remember that it depends on target[key]
}`,
    `export function track(target, key) {
  if (!activeEffect) return
  let depsMap = targetMap.get(target)
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  dep.add(activeEffect)
}`,
  )
  .replace(
    `export function trigger(target, key) {
  // TODO: re-run every effect that depends on target[key]
}`,
    `export function trigger(target, key) {
  const dep = targetMap.get(target)?.get(key)
  if (!dep) return
  // copy first, so effects that re-subscribe while running can't cause an endless loop
  ;[...dep].forEach((effect) => effect())
}`,
  )

const greetingMain = `import { reactive, effect } from './mini-reactivity.js'

const app = document.getElementById('app')
app.innerHTML = '<p class="greeting"></p><button class="rename">Rename to Grace</button>'

const user = reactive({ name: 'Ada' })

effect(() => {
  app.querySelector('.greeting').textContent = 'Hello, ' + user.name
})

app.querySelector('.rename').addEventListener('click', () => {
  user.name = 'Grace'
})`

// ---------- exercise 2: implement ref() and a lazy, cached computed()
const refComputedStarter = `// SIMPLIFIED engine for practice — implement ref() and computed().
// track, trigger, reactive and effect (with lazy + scheduler options) are done.

const targetMap = new WeakMap()
let activeEffect = null

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
  if (!dep) return
  ;[...dep].forEach((e) => (e.scheduler ? e.scheduler() : e()))
}

export function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      return Reflect.get(obj, key, receiver)
    },
    set(obj, key, value, receiver) {
      const old = obj[key]
      const result = Reflect.set(obj, key, value, receiver)
      if (!Object.is(old, value)) trigger(obj, key)
      return result
    },
  })
}

// effect(fn, { lazy, scheduler }): returns a runner; lazy = don't run now;
// scheduler = called instead of re-running when a dependency changes.
export function effect(fn, options = {}) {
  const run = () => {
    const previous = activeEffect
    activeEffect = run
    try {
      return fn()
    } finally {
      activeEffect = previous
    }
  }
  run.scheduler = options.scheduler
  if (!options.lazy) run()
  return run
}

export function ref(value) {
  // TODO: return an object whose .value getter tracks and whose setter triggers
  // (skip triggering when the new value is the same, using Object.is)
  return { value }
}

export function computed(getter) {
  // TODO: lazy (don't call getter until .value is read), cached (call it again
  // only after a dependency changed), and readers of .value must re-run when
  // a dependency changes. Hint: effect(getter, { lazy: true, scheduler })
  return {
    get value() {
      return getter()
    },
  }
}`

const refComputedSolution = refComputedStarter
  .replace(
    `export function ref(value) {
  // TODO: return an object whose .value getter tracks and whose setter triggers
  // (skip triggering when the new value is the same, using Object.is)
  return { value }
}`,
    `export function ref(value) {
  const r = {
    get value() {
      track(r, 'value')
      return value
    },
    set value(next) {
      if (Object.is(next, value)) return
      value = next
      trigger(r, 'value')
    },
  }
  return r
}`,
  )
  .replace(
    `export function computed(getter) {
  // TODO: lazy (don't call getter until .value is read), cached (call it again
  // only after a dependency changed), and readers of .value must re-run when
  // a dependency changes. Hint: effect(getter, { lazy: true, scheduler })
  return {
    get value() {
      return getter()
    },
  }
}`,
    `export function computed(getter) {
  let cached
  let dirty = true
  const runner = effect(getter, {
    lazy: true,
    scheduler() {
      // a dependency changed: don't recompute now, just mark dirty
      // and tell whoever read this computed
      if (!dirty) {
        dirty = true
        trigger(c, 'value')
      }
    },
  })
  const c = {
    get value() {
      if (dirty) {
        cached = runner() // getter runs as an effect, so its reads are tracked
        dirty = false
      }
      track(c, 'value')   // the effect reading this computed subscribes to it
      return cached
    },
  }
  return c
}`,
  )

const priceMain = `import { ref, computed, effect } from './mini-reactivity.js'

const app = document.getElementById('app')
app.innerHTML = '<p class="summary"></p><button class="more">One more</button>'

const price = ref(4)
const qty = ref(1)
const total = computed(() => price.value * qty.value)

effect(() => {
  app.querySelector('.summary').textContent = qty.value + ' × €' + price.value + ' = €' + total.value
})

app.querySelector('.more').addEventListener('click', () => {
  qty.value++
})`

// ---------- interview coding: make reactive() deep (with a proxy cache)
const deepStarter = `// SIMPLIFIED engine — reactive() is currently SHALLOW.

const targetMap = new WeakMap()
let activeEffect = null

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
  if (dep) [...dep].forEach((e) => e())
}

export function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      return Reflect.get(obj, key, receiver)
    },
    set(obj, key, value, receiver) {
      const old = obj[key]
      const result = Reflect.set(obj, key, value, receiver)
      if (!Object.is(old, value)) trigger(obj, key)
      return result
    },
  })
}

export function effect(fn) {
  const run = () => {
    const previous = activeEffect
    activeEffect = run
    try {
      fn()
    } finally {
      activeEffect = previous
    }
  }
  run()
  return run
}`

const deepSolution = deepStarter
  .replace('// SIMPLIFIED engine — reactive() is currently SHALLOW.', '// SIMPLIFIED engine — reactive() is deep, with one proxy per object.')
  .replace(
    `export function reactive(target) {
  return new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      return Reflect.get(obj, key, receiver)
    },`,
    `const proxyMap = new WeakMap() // raw object -> its proxy

export function reactive(target) {
  const existing = proxyMap.get(target)
  if (existing) return existing
  const proxy = new Proxy(target, {
    get(obj, key, receiver) {
      track(obj, key)
      const value = Reflect.get(obj, key, receiver)
      // lazily wrap nested objects, only when they are accessed
      return value !== null && typeof value === 'object' ? reactive(value) : value
    },`,
  )
  .replace(
    `      if (!Object.is(old, value)) trigger(obj, key)
      return result
    },
  })
}`,
    `      if (!Object.is(old, value)) trigger(obj, key)
      return result
    },
  })
  proxyMap.set(target, proxy)
  return proxy
}`,
  )

const profileMain = `import { reactive, effect } from './mini-reactivity.js'

const app = document.getElementById('app')
app.innerHTML = '<p class="city"></p><button class="move">Move to Pune</button>'

const profile = reactive({ name: 'Ada', address: { city: 'London' } })

effect(() => {
  app.querySelector('.city').textContent = profile.name + ' lives in ' + profile.address.city
})

app.querySelector('.move').addEventListener('click', () => {
  profile.address.city = 'Pune'
})`

export default {
  id: 'how-reactivity-works',
  title: 'How reactivity works: proxies, track & trigger',
  summary: 'Open the hood: how Proxies and getter/setters let Vue record which effects read which state, trigger exactly those effects on writes, and batch the resulting updates — plus the bugs and performance traps that follow from it.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['reactive', 'computed', 'watch-effect'],
  related: ['dependency-tracking', 'scheduling-flush', 'effect-scope', 'custom-ref', 'debugging-reactivity', 'shallow-and-raw', 'next-tick'],
  tags: ['reactivity', 'internals', 'Proxy', 'Reflect', 'track', 'trigger', 'effect', 'dependency tracking', 'scheduler', 'Object.defineProperty', 'Vue 2 vs Vue 3', 'performance', 'common bugs'],
  apis: [
    { name: 'Proxy / Reflect (JavaScript)', summary: 'The language features `reactive()` is built on: intercept property reads and writes on an object.' },
    { name: 'onRenderTracked() / onRenderTriggered()', summary: 'Development-only hooks that report which reactive dependencies a component\'s render tracked, and which one triggered a re-render.' },
    { name: 'onTrack / onTrigger (computed & watch options)', summary: 'Development-only debugger options that report dependency tracking and triggering for a computed or watcher.' },
  ],
  docs: [
    { label: 'Vue Guide — Reactivity in Depth', url: 'https://vuejs.org/guide/extras/reactivity-in-depth.html' },
    { label: 'Vue Guide — How reactivity works in Vue', url: 'https://vuejs.org/guide/extras/reactivity-in-depth.html#how-reactivity-works-in-vue' },
    { label: 'Vue Guide — Reactivity debugging', url: 'https://vuejs.org/guide/extras/reactivity-in-depth.html#reactivity-debugging' },
    { label: 'MDN — Proxy', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy' },
  ],

  intro: `
Everything in this level rests on **one mechanism**, which fits in a sentence:

> **Reading reactive state while an effect runs subscribes that effect; writing reactive state notifies its subscribers.**

An **effect** is a function Vue can re-run: a component's render, a \`computed()\` getter, a \`watch()\` source, a \`watchEffect()\`. **Tracking** is recording "this effect read this piece of state". **Triggering** is finding those effects when the state changes and scheduling them to run again.

This lesson opens the hood: how JavaScript **Proxies** and **getter/setters** make reads and writes visible, where Vue stores "who depends on what", how computed values and the scheduler fit in, and why every rule you've learned — \`.value\`, no destructuring, no replacing reactive objects — follows from it. We'll build a small engine yourself, in plain JavaScript.
`,

  why: [
    `
You can use Vue for years without reading its source. But a mental model of the machinery pays off every week:

- **"Why didn't it update?"** — Was the value read *inside an effect*, *through a proxy*, *before an \`await\`*? Each rule maps to a step of the mechanism.
- **"Why does this re-render so often?"** — Which state did the render read? Tracking is per property, so reading more than you need subscribes to more than you need.
- **Performance decisions** — deep vs shallow state, computed stability, how many effects exist and when they run.
- **Interviews** — "How does Vue's reactivity work?" is one of the most common senior Vue questions.

And it demystifies the rules. Two facts explain almost all of them:
`,
    {
      code: `let count = 0
count++            // JavaScript gives NO hook for reading or writing a plain variable

const state = new Proxy({ count: 0 }, {
  get(t, k) { console.log('read', k); return t[k] },        // hook for reads
  set(t, k, v) { console.log('write', k, v); t[k] = v; return true }, // hook for writes
})
state.count++      // logs: read count, write count 1`,
      lang: 'js',
      title: 'fact 1: only object property access can be intercepted',
    },
    `
**Fact 2:** a read is only recorded if an effect is running at that moment. That's why state read in a click handler, in a \`setTimeout\`, or after an \`await\` inside \`watchEffect\` creates no dependency.
`,
  ],

  eli15: `
Imagine a library where every book has a **sign-up sheet** taped inside the cover.

Readers come in to do tasks: "make the cart total", "draw the header". While someone is doing a task, they wear a badge that says **"I'm working on: cart total"**. Every time they open a book, the librarian writes the name on the badge onto that book's sheet. That's **tracking**.

When a book gets a new edition — someone *changes* a value — the librarian looks at its sheet and calls everyone listed: "the book you used changed, please redo your task". That's **triggering**.

Two smart habits make it fast:

- The librarian doesn't make the calls the instant a book changes. They jot the calls down and make them all after the rush, calling each person **once** even if several of their books changed. That's the **scheduler** (and why the screen updates a moment later).
- Each time a reader redoes a task, their old sign-ups are wiped and rewritten, because this time they might open different books. That's **dependency cleanup**.

Vue's reactivity is this librarian — for your data.
`,

  analogy: {
    title: 'The librarian\'s sign-up sheets',
    body: `
A sign-up sheet per book means the librarian never calls the whole town — only the readers of the book that changed. And because readers sign up automatically just by opening books while working, nobody has to declare in advance which books a task needs.

That's exactly the trade Vue makes: precise updates with no dependency lists to write by hand, in exchange for reading state through objects Vue controls (proxies and refs).
`,
    mapping: [
      ['a book', 'one property of a reactive object (target + key), or a ref\'s `.value`'],
      ['the sign-up sheet inside the cover', 'the *dep*: the set of effects subscribed to that property'],
      ['the catalogue of all sheets', 'Vue\'s dependency map (conceptually `WeakMap<object, Map<key, dep>>`)'],
      ['a reader doing a task', 'an effect: render, computed getter, watcher'],
      ['the "I\'m working on…" badge', 'the currently active effect'],
      ['writing the name on the sheet', '`track()`'],
      ['calling everyone on the sheet', '`trigger()`'],
      ['the call list made after the rush', 'the scheduler queue, flushed in a microtask'],
      ['rewriting your sign-ups each time you redo a task', 'dependencies re-collected on every run'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The full loop, with the dependency map',
    caption: 'Reactive State → Dependency Tracking → State Change → Effect Triggered → DOM Updated, with every box opened up.',
    alt: 'A diagram of Vue\'s reactivity loop. Top row: Reactive state (a cart proxy) → Proxy get trap → track(target, key) → dependency map (WeakMap of objects to Maps of keys to sets of effects). Middle row: State change via the set trap → trigger(target, key), which looks up subscribers in the dependency map. Bottom row: Scheduler queue → render effect re-runs → DOM patched; the re-run reads state again, re-tracking its dependencies.',
    props: {
      width: 760,
      height: 340,
      nodes: [
        { id: 'state', label: 'Reactive State', note: 'cart = reactive({…})', x: 90, y: 60, tone: 'acid' },
        { id: 'get', label: 'Proxy get trap', note: 'render reads cart.coupon', x: 270, y: 60, tone: 'cobalt' },
        { id: 'track', label: 'track(cart, "coupon")', note: 'active effect = App render', x: 460, y: 60, tone: 'cobalt' },
        { id: 'map', label: 'Dependency map', note: 'cart → coupon → {App render}', x: 660, y: 60, tone: 'kraft' },
        { id: 'set', label: 'State Change', note: "set trap: cart.coupon = 'SAVE5'", x: 90, y: 185, tone: 'red' },
        { id: 'trigger', label: 'trigger(cart, "coupon")', note: 'who subscribed?', x: 460, y: 185, tone: 'red' },
        { id: 'queue', label: 'Scheduler queue', note: 'de-duplicated jobs', x: 270, y: 300, tone: 'kraft' },
        { id: 'effect', label: 'Effect re-runs', note: 'App render (re-tracks)', x: 470, y: 300, tone: 'ink' },
        { id: 'dom', label: 'DOM Updated', note: 'patch only changes', x: 670, y: 300, tone: 'ink' },
      ],
      edges: [
        { from: 'state', to: 'get', label: 'read' },
        { from: 'get', to: 'track', label: 'record' },
        { from: 'track', to: 'map', label: 'add effect' },
        { from: 'set', to: 'trigger', label: 'value changed' },
        { from: 'map', to: 'trigger', label: 'look up', dashed: true },
        { from: 'trigger', to: 'queue', label: 'schedule' },
        { from: 'queue', to: 'effect', label: 'flush (microtask)' },
        { from: 'effect', to: 'dom', label: 'patch' },
      ],
      steps: [
        { focus: ['state'], text: '**Reactive state.** `reactive({...})` returns a Proxy around your object; `ref()` returns an object with a getter/setter on `.value`. Both exist so reads and writes can be intercepted.' },
        { focus: ['get', 'track'], edges: ['state->get', 'get->track'], text: '**Dependency tracking.** The App component renders inside its *render effect*. Reading `cart.coupon` hits the Proxy\'s `get` trap, which calls `track(cart, \'coupon\')` with the App render as the active effect.' },
        { focus: ['map'], edges: ['track->map'], text: 'Vue records the subscription in its dependency map — conceptually `WeakMap(target → Map(key → set of effects))`. The `WeakMap` lets unused objects be garbage-collected. (In Vue 3.5 the internal structures changed — see the callout — but the idea is the same.)' },
        { focus: ['set'], text: '**State change.** A click runs `cart.coupon = \'SAVE5\'`. The `set` trap stores the value and, because it differs from the old one (`Object.is`), calls `trigger(cart, \'coupon\')`.' },
        { focus: ['trigger'], edges: ['set->trigger', 'map->trigger'], text: '**Effect triggered.** `trigger` looks up the subscribers of `cart.coupon` — only effects that *read that key*. Computeds are marked dirty; component updates and watchers are handed to the scheduler.' },
        { focus: ['queue', 'effect'], edges: ['trigger->queue', 'queue->effect'], text: 'The scheduler de-duplicates jobs and flushes them in a microtask after your code finishes. The App render effect re-runs, **re-collecting** its dependencies as it reads state again.' },
        { focus: ['dom'], edges: ['effect->dom'], text: '**DOM updated.** The new render produces a virtual DOM tree; Vue diffs it with the previous one and patches only what changed. The loop is ready for the next change.' },
      ],
    },
  },

  syntax: [
    `
The JavaScript building blocks first. A **Proxy** wraps an object and lets *traps* intercept operations; **Reflect** performs the default behaviour, so traps can add work and still behave like a normal object:
`,
    {
      code: `const target = { count: 0 }

const proxy = new Proxy(target, {
  get(obj, key, receiver) {
    console.log('read', key)
    return Reflect.get(obj, key, receiver)        // default read
  },
  set(obj, key, value, receiver) {
    console.log('write', key, value)
    return Reflect.set(obj, key, value, receiver) // default write
  },
  deleteProperty(obj, key) {
    console.log('delete', key)
    return Reflect.deleteProperty(obj, key)
  },
  // also: has (for "key in obj"), ownKeys (for Object.keys / for…in)
})

proxy.count++        // read count, write count 1
delete proxy.count   // delete count
target === proxy     // false — the proxy is a separate object`,
      lang: 'js',
      title: 'Proxy + Reflect',
    },
    `
Refs can hold primitives, which a Proxy can't wrap, so they use a plain **getter/setter** on \`.value\` instead:
`,
    {
      code: `// The model the Vue docs use for refs (simplified)
function ref(value) {
  const refObject = {
    get value() {
      track(refObject, 'value')
      return value
    },
    set value(newValue) {
      value = newValue
      trigger(refObject, 'value')
    },
  }
  return refObject
}`,
      lang: 'js',
      title: 'refs: getter/setter (simplified)',
    },
    `
**The rules of the mechanism** (stable, documented behaviour):

1. **Tracking only happens while an effect runs** — a component render, a computed getter, a watcher source, a \`watchEffect\` (synchronously, before the first \`await\`).
2. **Tracking is per property.** Reading \`cart.coupon\` subscribes to \`coupon\` only; changing \`cart.items\` won't re-run that effect.
3. **Writes trigger only real changes**: a different value (\`Object.is\`), an added or deleted key, an array length change.
4. **Triggered work is scheduled**: component updates and default watchers are batched and flushed asynchronously ([nextTick](lesson:next-tick)); computeds are marked dirty and recompute lazily when read.
5. **Dependencies are re-collected on every run**, so conditional reads change what an effect depends on.

**Four kinds of effect**, all built on the same mechanism:

- **Render effect** — one per component instance; re-runs the render function and patches the DOM.
- **Computed** — a lazy effect with a cached value ([computed](lesson:computed)).
- **\`watch()\`** — an effect that runs your *source* getter, compares results, and calls your callback ([watch](lesson:watch)).
- **\`watchEffect()\`** — an effect that runs your function directly ([watchEffect](lesson:watch-effect)).
`,
    {
      callout: 'warn',
      title: 'Public API vs implementation details',
      text: 'Stable, documented API: `ref`, `reactive`, `computed`, `watch`, `watchEffect`, `readonly`, the shallow variants, `toRaw`, `markRaw`, `triggerRef`, `customRef`, `effectScope`, `nextTick`, and the dev-only debugging hooks (`onRenderTracked`, `onRenderTriggered`, `onTrack`, `onTrigger`). **Implementation details** that have changed before and may change again: names such as `targetMap`, `Dep`, `ReactiveEffect`, `track`, `trigger`, `activeEffect`, and data structures. Vue 3.5 refactored the internals (version counting and linked-list based dependency tracking) without changing public behaviour. Build mental models on this lesson; build apps on the public API.',
    },
  ],

  walkthrough: {
    title: 'mini-reactivity.js (simplified engine)',
    lang: 'js',
    code: miniEngine,
    intro: 'The engine the playground runs on — about 45 lines. It is deliberately simplified (no scheduler, no cleanup, no arrays), but track, trigger, the dependency map, the active effect and Proxy traps work just like the real idea.',
    steps: [
      { lines: [5], text: '`targetMap` is the dependency map: each reactive object → a `Map` of its keys → a `Set` of the effects that read that key. A `WeakMap` means an object nobody references can still be garbage-collected.' },
      { lines: [6], text: '`activeEffect` is the "badge": the effect that is running right now, or `null`.' },
      { lines: [8, 15], text: '**`track()`** — if an effect is running, find (or create) the set for `target[key]` and add the effect to it. Reads outside any effect return early: nobody subscribes.' },
      { lines: [17, 20], text: '**`trigger()`** — look up the set for `target[key]` and re-run each effect. We copy the set first (`[...dep]`) so effects that re-subscribe while running can\'t extend the loop. Real Vue *schedules* instead of running immediately.' },
      { lines: [22, 34], text: '**`reactive()`** — a Proxy whose `get` trap tracks and whose `set` trap triggers. `Reflect` does the actual read and write. (Real Vue also skips unchanged values, wraps nested objects lazily, unwraps refs, and adds `has`/`deleteProperty`/`ownKeys` traps.)' },
      { lines: [36, 48], text: '**`effect()`** — wraps `fn` in a runner that sets itself as the active effect while `fn` runs, then **restores the previous one** (so nested effects, like a computed read inside a render, don\'t break tracking for the outer effect). It runs once immediately to collect its first dependencies.' },
    ],
  },

  playground: {
    title: 'Build-your-own reactivity: a mini engine',
    objective: 'Drive a cart with a 45-line reactivity engine, then improve the engine the way Vue does: skip unchanged writes, track deletions, and observe per-property tracking.',
    files: { 'main.js': cartMain, 'mini-reactivity.js': miniEngine },
    entry: 'main.js',
    expected: 'No Vue here — just our engine and DOM APIs. **Total: €20**, **No coupon**, and two buttons. "Add €10 item" re-runs only the total effect; "Apply SAVE5" re-runs both effects (check the Console). Clicking "Apply SAVE5" a second time re-runs them *again*, even though nothing changed — your first fix.',
    experiments: [
      {
        id: 'skip-unchanged',
        task: 'Click **Apply SAVE5** twice: the second click re-runs both effects although the coupon didn\'t change. In `mini-reactivity.js`, make the `set` trap **skip `trigger()` when the value is unchanged** (compare with `Object.is`, like Vue).',
        hint: 'Read the old value before `Reflect.set`: `const old = obj[key]`, then `if (!Object.is(old, value)) trigger(obj, key)`.',
        tests: [
          {
            name: 'writing the same value triggers nothing',
            code: `await click('.apply')
const before = logs.length
await click('.apply')
expect(logs.length).toBe(before)
const { reactive, effect } = requireModule('mini-reactivity.js')
const s = reactive({ n: 1 })
let runs = 0
effect(() => { s.n; runs++ })
s.n = 1
expect(runs).toBe(1)
s.n = 2
expect(runs).toBe(2)`,
          },
        ],
        explain: 'Vue\'s setters and set traps compare old and new values with `Object.is` and only trigger on a real change. That one line prevents a whole class of wasted renders. (`Object.is` rather than `===` so that `NaN` equals `NaN`.)',
      },
      {
        id: 'delete-trap',
        task: 'Right now `delete cart.coupon` changes the object but notifies nobody. Add a **`deleteProperty` trap** to `reactive()` that deletes the key and triggers its subscribers.',
        hint: '`deleteProperty(obj, key) { const had = key in obj; const ok = Reflect.deleteProperty(obj, key); if (had) trigger(obj, key); return ok }`',
        tests: [
          {
            name: 'deleting a property re-runs effects that read it',
            code: `const { reactive, effect } = requireModule('mini-reactivity.js')
const s = reactive({ coupon: 'SAVE5' })
const seen = []
effect(() => { seen.push(s.coupon) })
delete s.coupon
expect(seen).toEqual(['SAVE5', undefined])`,
          },
        ],
        explain: 'This is one of the reasons Vue 3 moved to Proxies: a `deleteProperty` trap sees deletions, which Vue 2\'s `Object.defineProperty` approach could not (hence `Vue.delete`). Vue also has `has` and `ownKeys` traps so `key in obj` and `Object.keys(obj)` are tracked.',
      },
      {
        id: 'per-key',
        task: 'In `main.js`, add a third effect that reads **only** `cart.subtotal` and logs exactly `effect: subtotal only`. Predict which buttons re-run it, then check.',
        hint: 'Copy one of the existing `effect(() => { ... })` blocks; read `cart.subtotal` (e.g. in a `console.log`), and log `\'effect: subtotal only\'`.',
        tests: [
          {
            name: 'the effect re-runs for subtotal changes only',
            code: `const runs = () => logs.filter((line) => line === 'effect: subtotal only').length
expect(runs()).toBe(1)
await click('.apply')
expect(runs()).toBe(1)
await click('.add')
expect(runs()).toBe(2)`,
          },
        ],
        explain: 'Tracking is per (object, key). Applying the coupon triggers only effects in the `coupon` set; this effect is only in the `subtotal` set. Vue components benefit from the same precision — a component re-renders only for the properties its render actually read.',
      },
      {
        id: 'stale-deps',
        task: 'Change effect 1 so that **when a coupon is applied** it shows `Total: coupon applied` *without reading* `cart.subtotal`. Apply the coupon, then click "Add €10 item" a few times and watch the Console.',
        hint: 'Something like `if (cart.coupon) { el.textContent = \'Total: coupon applied\' } else { el.textContent = \'Total: €\' + cart.subtotal }`.',
        explain: 'Effect 1 keeps re-running on subtotal changes even though its latest run no longer read `subtotal`: our engine never removes old subscriptions. Real Vue re-collects dependencies on every run and drops the ones that weren\'t read again (Vue 3.5 does this efficiently with version counters), so stale dependencies don\'t cause wasted work.',
      },
    ],
  },

  animation: {
    type: 'dependency-tracker',
    props: { preset: 'chain' },
    title: 'A live engine with a computed chain',
    caption: 'Edit the state and watch exactly which computeds and effects re-run. The chain preset shows lazy computeds: a computed that depends on another computed is only recalculated when something actually reads it.',
    alt: 'A live mini reactivity engine. Editable state values feed a chain of computed values, which feed effects. Changing a value highlights the computeds that become dirty and the effects that re-run; computeds recalculate lazily, only when read.',
  },

  internals: {
    beginner: `
Two ideas carry everything:

1. **Vue can only notice what goes through objects it controls.** Proxies (for \`reactive()\`) and getter/setters (for \`ref()\`) are those objects. Plain variables, copies and the raw object behind a proxy are invisible.
2. **Vue only records reads that happen while it's running one of *its* functions** — a render, a computed, a watcher. That's how it knows *who* to notify later.

Everything else — batching, caching, cleanup — is Vue being efficient about calling people back.
`,
    technical: [
      `
**reactive() in more detail.** Vue keeps a cache from raw objects to proxies (so \`reactive(obj)\` always returns the same proxy) and uses different handler sets for mutable, readonly and shallow variants. The \`get\` trap tracks the key, unwraps refs stored as properties (not inside arrays), and returns a reactive proxy for nested objects *lazily* — nothing is converted until you access it. The \`set\` trap distinguishes "add" from "set" so that adding a key can also notify code that iterated the object. Arrays and \`Map\`/\`Set\` need extra instrumentation (length, mutation methods, collection methods).

**Effects and the active effect.** When an effect runs, Vue makes it the active subscriber, runs your function, and restores the previous one afterwards — so a computed read inside a render doesn't steal the render's tracking. Each run re-collects dependencies; links that weren't used this time are removed. Vue 3.5 implements this with **version counters** on dependencies and a **doubly linked list** between subscribers and dependencies, instead of clearing and rebuilding sets on every run.

**Computed.** A computed is both a *subscriber* (it reads other state) and a *dependency* (others read it). When one of its sources changes, it doesn't recompute right away — it's marked dirty and notifies its own readers. On the next \`.value\` read it recomputes, and since Vue 3.4 its readers are only re-run if the new value actually differs. That's what makes long computed chains lazy and cheap.

**Scheduler.** Component render effects don't run synchronously on trigger: Vue queues the component's update job (de-duplicated), and flushes the queue in a microtask — pre-flush watchers, then component updates parent-before-child, then post-flush callbacks. A re-run render returns a new virtual DOM tree; the renderer diffs and patches the real DOM ([how Vue updates the DOM](lesson:how-vue-updates)).
`,
      {
        code: `// The shape of the idea, as the Vue docs present it (pseudo-code).
let activeEffect

function track(target, key) {
  if (activeEffect) {
    const effects = getSubscribersForProperty(target, key)
    effects.add(activeEffect)
  }
}

function trigger(target, key) {
  const effects = getSubscribersForProperty(target, key)
  effects.forEach((effect) => effect())   // real Vue: scheduled, not immediate
}

function whenDepsChange(update) {
  const effect = () => {
    activeEffect = effect
    update()
    activeEffect = null                   // real Vue restores the PREVIOUS effect
  }
  effect()
}`,
        lang: 'js',
        title: 'track / trigger, as in "Reactivity in Depth" (pseudo-code)',
      },
      `
**Vue 2 for comparison (legacy).** Vue 2 walked your \`data()\` object at creation time and redefined every existing property as a getter/setter with \`Object.defineProperty\`, recursively. That made conversion eager, mutated your original objects, and missed anything that wasn't a property yet: added/deleted keys, array index writes and \`length\` — hence \`Vue.set\`/\`Vue.delete\`. A Proxy intercepts operations on the whole object, for any key, lazily. The cost: the proxy is a different object from the original (identity), and Proxies can't be polyfilled, which is one reason Vue 3 doesn't support IE11.
`,
    ],
    production: [
      `
**Common reactivity bugs — and the step of the mechanism each one breaks:**

- *Plain variables or plain objects as state* → nothing intercepts reads/writes. Use \`ref\`/\`reactive\` ([what is reactivity](lesson:what-is-reactivity)).
- *Destructuring, spreading, passing \`state.x\`* → the copy isn't a proxy ([arrays, objects & destructuring](lesson:arrays-objects-reactivity)).
- *Replacing a reactive object* → subscribers belong to the old proxy ([reactive](lesson:reactive)).
- *Mutating the raw object (\`toRaw\`, or the original you passed to \`reactive()\`)* → bypasses the traps ([shallow & raw](lesson:shallow-and-raw)).
- *Non-reactive sources (\`Date.now()\`, \`localStorage\`, \`window.innerWidth\`) inside computed/templates* → nothing to track ([computed](lesson:computed)).
- *Reads after \`await\` in \`watchEffect\`* → no active effect at that moment ([watchEffect](lesson:watch-effect)).
- *Mutating state inside a computed getter* → triggers while tracking; at best confusing, at worst loops ([computed](lesson:computed)).
- *Reading the DOM right after a change* → the scheduler hasn't flushed yet ([nextTick](lesson:next-tick)).
`,
      `
**Performance considerations (measure first):**

- **Deep reactivity has a per-access cost** — proxies for nested objects and a tracking entry for every property an effect reads. For large data you replace wholesale, use \`shallowRef\`; keep library instances raw with \`markRaw\` ([shallow & raw](lesson:shallow-and-raw)).
- **Read only what you need during render.** \`JSON.stringify(state)\` or \`Object.keys(state)\` in a template subscribes the component to *every* key.
- **Keep computeds stable.** Since 3.4 a computed only notifies readers when its value changes — but a getter that returns a *new object or array* every time always "changes". Return primitives or reuse previous values where it matters.
- **Watchers:** \`deep: true\` on big structures traverses everything on every trigger; watch specific getters instead, or use \`deep\` as a depth number (3.5+).
- **Effects you create, you own.** Watchers created outside component setup (or asynchronously) must be stopped; group them with [effectScope](lesson:effect-scope).
- **Render cost often dominates.** Fewer DOM nodes beat clever reactivity — see [render optimization](lesson:render-optimization) and [runtime performance](lesson:runtime-performance).
`,
      {
        callout: 'tip',
        title: 'Watch the mechanism live',
        text: 'In development, `onRenderTracked(e => …)` and `onRenderTriggered(e => …)` report each dependency a component\'s render tracked and the exact change that triggered a re-render; `computed(fn, { onTrack, onTrigger })` and `watch(src, cb, { onTrack, onTrigger })` do the same for computeds and watchers. They only work in development builds. Vue DevTools shows component state and updates too. More in [debugging reactivity](lesson:debugging-reactivity).',
      },
    ],
  },

  mistakes: [
    {
      title: 'Treating destructured values as reactive',
      wrong: { code: `const { total } = cart        // one get-trap call, a plain number\nwatch(total, log)             // not a reactive source`, lang: 'js' },
      right: { code: `const { total } = toRefs(cart)\nwatch(total, log)             // or: watch(() => cart.total, log)`, lang: 'js' },
      explanation: 'Destructuring runs the `get` trap once and stores the result. Tracking needs a read *during an effect*, through a proxy or ref, every time.',
    },
    {
      title: 'Expecting reads outside an effect to create dependencies',
      wrong: { code: `function onClick() {\n  console.log(cart.total) // read in an event handler: tracks nothing\n}`, lang: 'js' },
      right: { code: `watchEffect(() => {\n  console.log(cart.total) // read inside an effect: tracked\n})`, lang: 'js' },
      explanation: 'Only reads made while Vue is running an effect (render, computed, watcher) are recorded. Event handlers, timers and code after `await` have no active effect.',
    },
    {
      title: 'Subscribing a render to everything by accident',
      wrong: { code: `<pre>{{ JSON.stringify(settings) }}</pre>  <!-- reads every key -->`, lang: 'vue' },
      right: { code: `<p>{{ settings.theme }}</p>  <!-- reads only what is shown -->`, lang: 'vue' },
      explanation: 'Serialising or iterating an object during render reads all of its keys, so the component re-renders when *any* of them changes. Fine for a debug panel, wasteful in a hot component.',
    },
    {
      title: 'Writing to state inside a computed getter',
      wrong: { code: `const total = computed(() => {\n  stats.recalculations++   // a write while tracking\n  return items.value.reduce((s, i) => s + i.price, 0)\n})`, lang: 'js' },
      right: { code: `const total = computed(() =>\n  items.value.reduce((s, i) => s + i.price, 0)\n)\n// side effects belong in watchers or event handlers`, lang: 'js' },
      explanation: 'A computed is an effect that should only *read*. Writing inside it triggers other effects in the middle of tracking, which makes update order hard to reason about and can create loops.',
    },
    {
      title: 'Relying on internal APIs',
      wrong: { code: `// reaching into private internals\nconst subs = instance.subTree /* ... */\nimport { targetMap } from '@vue/reactivity' // not exported anyway`, lang: 'js' },
      right: { code: `// use the documented debugging hooks\nonRenderTriggered((e) => console.log(e.key, e.type))`, lang: 'js' },
      explanation: 'Internal data structures changed substantially in Vue 3.5 and may change again. Documented APIs (including the dev-only debug hooks) are what you can depend on.',
    },
  ],

  debugging: [
    {
      symptom: 'An effect (render, computed, watchEffect) doesn\'t re-run when a value changes.',
      cause: 'The value was not read during the effect\'s last run — or it was read from a copy, a raw object, or after an `await`.',
      fix: 'Use `onRenderTracked` / `onTrack` in development to list what was actually tracked, then read the value through the proxy/ref inside the effect.',
    },
    {
      symptom: 'A component re-renders when unrelated state changes.',
      cause: 'Its render reads more than it displays (iterating or serialising an object, a computed that reads broad state, an inline object prop created every render).',
      fix: 'Use `onRenderTriggered` to see which key triggered the update, then narrow what the render reads.',
    },
    {
      symptom: 'Updates "appear" late, only when something else changes.',
      cause: 'An untracked change (shallow state, raw object, plain variable) is picked up by a re-render caused by something else.',
      fix: 'Make the change through tracked state (or call `triggerRef` for shallow refs).',
    },
    {
      symptom: '"Maximum recursive updates exceeded" warning.',
      cause: 'An effect writes to state it also reads (e.g. a watcher or `onUpdated` hook that changes its own source), so it keeps re-triggering itself.',
      fix: 'Derive the value with `computed`, guard the write with a condition, or restructure so the effect doesn\'t write its own dependencies.',
    },
  ],

  bestPractices: [
    'Think "reads subscribe, writes notify" when debugging: find the read, find the effect, find the write.',
    'Read state through proxies/refs inside effects; never rely on copies or raw objects for reactivity.',
    'Keep render functions and computed getters pure — read only, no writes.',
    'Read only what a component needs during render; avoid serialising or iterating big objects there.',
    'Use the dev-only hooks (`onRenderTracked`, `onRenderTriggered`, `onTrack`, `onTrigger`) instead of guessing.',
    'Depend on the documented public API; treat internal names and structures as subject to change.',
  ],

  useCases: [
    'Debugging "why didn\'t it update?" by locating the missing read, effect or tracked write.',
    'Explaining and fixing excessive re-renders with `onRenderTriggered`.',
    'Choosing deep vs shallow state for large datasets based on what tracking costs.',
    'Integrating external stores or libraries with `shallowRef`, `markRaw` and `customRef`.',
    'Answering senior-level interview questions about Vue\'s reactivity system.',
  ],

  whenToUse: {
    use: [
      'Reach for this mental model whenever reactivity surprises you — it explains every rule in this level.',
      'Use the dev-only tracking hooks when a component updates too often or not at all.',
      'Build a tiny engine like this one when you need to explain reactivity to a team or in an interview.',
    ],
    avoid: [
      'Re-implementing reactivity in app code — use Vue\'s public APIs (`customRef`, `effectScope`, `shallowRef`) for advanced needs.',
      'Depending on internal names or data structures; they change between versions.',
      'Premature optimisation based on internals — measure with DevTools and the browser profiler first.',
    ],
  },

  comparison: {
    title: 'Vue 2 (Object.defineProperty) vs Vue 3 (Proxy)',
    headers: ['', 'Vue 2: `Object.defineProperty` (legacy)', 'Vue 3: `Proxy`'],
    rows: [
      ['What is intercepted', 'each existing property, one by one', 'operations on the whole object, for any key'],
      ['When conversion happens', 'eagerly, by walking all of `data()` recursively', 'lazily, when a nested object is accessed'],
      ['Added / deleted keys', 'not detected (`Vue.set` / `Vue.delete`)', 'detected (`set` / `deleteProperty` traps)'],
      ['Array index writes, `length`', 'not detected (use `splice`)', 'detected'],
      ['`Map` / `Set`', 'not supported', 'supported via instrumented methods'],
      ['Object identity', 'your original object is modified in place', 'a separate proxy object; the raw object stays untouched'],
      ['Primitives', 'only as properties of `data()`', '`ref()` (getter/setter object)'],
    ],
    note: 'Both share the core idea — getters track, setters trigger. Proxies remove the "property must already exist" limitation. Continue with [dependency tracking in depth](lesson:dependency-tracking) and [scheduling & flush timing](lesson:scheduling-flush).',
  },

  quiz: [
    {
      id: 'how-reactivity-works-q1',
      type: 'mcq',
      prompt: 'A component\'s render reads `state.count`. What does that read do?',
      options: [
        { text: 'It records the component\'s render effect as a subscriber of `state`\'s `count` property.' },
        { text: 'It starts polling `state.count` for changes.', why: 'Vue never polls. It records the reader and waits for a write.' },
        { text: 'It copies `count` into the component so it can be compared later.', why: 'No copy is involved; the subscription is stored in Vue\'s dependency map.' },
        { text: 'Nothing — only writes matter to Vue.', why: 'Reads are half of the mechanism: without them Vue wouldn\'t know whom to notify.' },
      ],
      answer: 0,
      explanation: 'The Proxy\'s `get` trap calls `track(state, \'count\')` while the render effect is active, adding it to that property\'s subscribers.',
    },
    {
      id: 'how-reactivity-works-q2',
      type: 'output',
      prompt: 'What is logged, in order? (Watcher re-runs are flushed after the synchronous code.)',
      code: {
        lang: 'js',
        code: `import { reactive, watchEffect } from 'vue'

const state = reactive({ a: 1, b: 2 })

watchEffect(() => console.log('A', state.a))
watchEffect(() => console.log('B', state.b))

state.a++`,
      },
      options: [
        { text: '`A 1`, `B 2`, `A 2`' },
        { text: '`A 1`, `B 2`, `A 2`, `B 2`', why: 'The second effect only read `state.b`, so changing `a` doesn\'t trigger it.' },
        { text: '`A 2`, `B 2`', why: '`watchEffect` runs immediately when created, logging the initial values first.' },
        { text: '`A 1`, `B 2`', why: '`state.a++` writes a tracked key, so the first effect re-runs.' },
      ],
      answer: 0,
      explanation: 'Both effects run immediately (A 1, B 2). Tracking is per key: only the first effect is subscribed to `a`, so only it re-runs (A 2).',
    },
    {
      id: 'how-reactivity-works-q3',
      type: 'bug',
      prompt: 'In this mini engine, a render effect that reads a computed (which is itself an effect) stops tracking everything it reads **after** the computed. Click the buggy line.',
      code: {
        lang: 'js',
        code: `let activeEffect = null

function effect(fn) {
  const run = () => {
    activeEffect = run
    fn()
    activeEffect = null
  }
  run()
}`,
      },
      answerLine: 7,
      explanation: 'When the inner (computed) effect finishes, line 7 sets `activeEffect` to `null` instead of restoring the outer effect, so later reads in the outer effect are not tracked. Save `const previous = activeEffect` before running and restore it afterwards (ideally in a `finally`).',
    },
    {
      id: 'how-reactivity-works-q4',
      type: 'fill',
      prompt: 'Fill the trap names so reads are tracked and writes are triggered.',
      code: {
        lang: 'js',
        code: `const proxy = new Proxy(target, {
  ___(obj, key, receiver) {
    track(obj, key)
    return Reflect.get(obj, key, receiver)
  },
  ___(obj, key, value, receiver) {
    const ok = Reflect.set(obj, key, value, receiver)
    trigger(obj, key)
    return ok
  },
})`,
      },
      answer: [['get'], ['set']],
      explanation: 'The `get` trap intercepts property reads (track); the `set` trap intercepts writes (trigger). `Reflect` performs the default operation.',
    },
    {
      id: 'how-reactivity-works-q5',
      type: 'mcq',
      prompt: 'Which change could Vue 2 **not** detect, but Vue 3 can thanks to Proxies?',
      options: [
        { text: 'Adding a brand-new property: `user.age = 36`' },
        { text: 'Changing an existing property: `user.name = \'Grace\'`', why: 'Existing properties had getters/setters in Vue 2, so this was detected.' },
        { text: 'Calling `items.push(x)` on an array', why: 'Vue 2 patched array mutation methods, so `push` worked.' },
        { text: 'Replacing a whole `data` property with a new object', why: 'That is a write to an existing property — detected in both versions.' },
      ],
      answer: 0,
      explanation: '`Object.defineProperty` only works for properties that exist when the object is converted. A Proxy\'s `set` trap sees writes to any key, including new ones.',
    },
    {
      id: 'how-reactivity-works-q6',
      type: 'mcq',
      prompt: 'Which of these are **implementation details** that may change between Vue versions? (Select all that apply.)',
      options: [
        { text: 'The name and shape of the internal dependency map (e.g. `targetMap`)' },
        { text: 'Reading reactive state inside an effect makes that effect depend on it', why: 'That is the documented contract the whole reactivity system is built on.' },
        { text: 'DOM updates are batched and applied asynchronously', why: 'Documented behaviour — it is why `nextTick()` exists as public API.' },
        { text: 'Using version counters and linked lists to track dependencies' },
      ],
      answer: [0, 3],
      explanation: 'Behaviour (tracking on read, triggering on write, batching) is the stable contract. Internal names and data structures changed in Vue 3.5 and may change again.',
    },
    {
      id: 'how-reactivity-works-q7',
      type: 'short',
      prompt: 'In two or three sentences: explain `track` and `trigger` to a teammate.',
      answer: 'While Vue runs an effect — a component render, a computed or a watcher — every read of reactive state calls track, which records that this effect depends on that property. When the property is written with a new value, trigger looks up all effects that depend on it and re-runs or schedules them. That is how Vue updates exactly the parts that used the changed data.',
    },
  ],

  exercises: [
    {
      id: 'track-trigger',
      title: 'Implement track() and trigger()',
      difficulty: 'intermediate',
      prompt: `
\`mini-reactivity.js\` has a working \`reactive()\` and \`effect()\`, but \`track()\` and \`trigger()\` are empty, so nothing ever updates. Implement them.

- \`track(target, key)\`: if an effect is running (\`activeEffect\`), record that it depends on \`target[key]\`. Use \`targetMap\`: target → \`Map\` of key → \`Set\` of effects.
- \`trigger(target, key)\`: re-run every effect that depends on \`target[key]\`.
- Effects must re-run only for the keys they read, and different objects with the same key must not interfere.

\`main.js\` renders \`<p class="greeting">\` (**Hello, Ada**) and a \`<button class="rename">\` that sets the name to Grace — it will work once your engine does. Tests also call your functions directly via the module.
`,
      files: { 'main.js': greetingMain, 'mini-reactivity.js': trackTriggerStarter },
      hints: [
        'In `track`, return early when `activeEffect` is null. Otherwise get (or create) `targetMap.get(target)`, then get (or create) the `Set` for `key`, and add `activeEffect`.',
        'In `trigger`, look up `targetMap.get(target)?.get(key)`; if it exists, call each effect.',
        'Iterate over a copy (`[...dep].forEach(...)`) so effects that subscribe again while running don\'t extend the loop you are iterating.',
      ],
      solution: {
        explanation: '`track` builds the dependency map lazily — one `Map` per object, one `Set` per key — and only when an effect is active. `trigger` looks up exactly the effects for that object and key. That precision is why changing `age` doesn\'t re-run an effect that only read `name`.',
        files: { 'main.js': greetingMain, 'mini-reactivity.js': trackTriggerSolution },
      },
      tests: [
        { name: 'the demo updates: Hello, Grace', code: `expect(text('.greeting')).toBe('Hello, Ada'); await click('.rename'); expect(text('.greeting')).toBe('Hello, Grace')` },
        {
          name: 'an effect re-runs when a property it read changes',
          code: `const { reactive, effect } = requireModule('mini-reactivity.js')
const user = reactive({ name: 'Ada' })
const seen = []
effect(() => { seen.push(user.name) })
user.name = 'Grace'
expect(seen).toEqual(['Ada', 'Grace'])`,
        },
        {
          name: 'unrelated keys and other objects do not re-run it',
          code: `const { reactive, effect } = requireModule('mini-reactivity.js')
const a = reactive({ name: 'Ada', age: 36 })
const b = reactive({ name: 'Bob' })
let runs = 0
effect(() => { a.name; runs++ })
a.age = 37
b.name = 'Bea'
expect(runs).toBe(1)
a.name = 'Grace'
expect(runs).toBe(2)`,
        },
        {
          name: 'every subscriber of a key re-runs',
          code: `const { reactive, effect } = requireModule('mini-reactivity.js')
const s = reactive({ n: 1 })
const log = []
effect(() => { log.push('first ' + s.n) })
effect(() => { log.push('second ' + s.n) })
s.n = 2
expect(log).toEqual(['first 1', 'second 1', 'first 2', 'second 2'])`,
        },
      ],
    },
    {
      id: 'ref-and-computed',
      title: 'Build ref() and a lazy, cached computed()',
      difficulty: 'advanced',
      prompt: `
The engine now has \`track\`, \`trigger\`, \`reactive\` and an \`effect(fn, { lazy, scheduler })\`. Implement:

- **\`ref(value)\`**: an object whose \`.value\` getter tracks and whose setter triggers — but **not** when the new value is the same (\`Object.is\`).
- **\`computed(getter)\`**, read through \`.value\`:
  - **lazy**: the getter isn't called until \`.value\` is first read;
  - **cached**: reading \`.value\` again doesn't call the getter, until a dependency changes;
  - after a dependency changes, the getter is still not called until the next read;
  - an effect that reads \`.value\` re-runs when the computed's dependencies change.

\`main.js\` renders \`<p class="summary">\` (\`1 × €4 = €4\`) and a \`<button class="more">\` that increments the quantity.
`,
      files: { 'main.js': priceMain, 'mini-reactivity.js': refComputedStarter },
      hints: [
        '`ref`: keep the value in a closure variable; the object\'s `get value()` calls `track(r, \'value\')`, `set value(v)` returns early if `Object.is(v, value)`, otherwise stores and calls `trigger(r, \'value\')`.',
        '`computed`: keep `cached` and `dirty = true`. Create `runner = effect(getter, { lazy: true, scheduler })`. In `get value()`: if dirty, `cached = runner()` and `dirty = false`; then `track(c, \'value\')` and return `cached`.',
        'The scheduler runs when a dependency of the getter changes: if not already dirty, set `dirty = true` and `trigger(c, \'value\')` so effects that read the computed re-run (and read the fresh value).',
      ],
      solution: {
        explanation: 'The ref is a getter/setter pair — the same shape the Vue docs use. The computed wraps its getter in a **lazy effect**: running it inside `get value()` tracks the getter\'s dependencies against the runner. When one changes, the scheduler doesn\'t recompute; it marks the cache dirty and triggers the computed\'s own readers. The next read recomputes once. This is a simplified version of how Vue\'s computed worked before 3.5 (3.5 uses version counters, and since 3.4 readers only re-run when the value actually changed).',
        files: { 'main.js': priceMain, 'mini-reactivity.js': refComputedSolution },
      },
      tests: [
        { name: 'the demo updates', code: `expect(text('.summary')).toBe('1 × €4 = €4'); await click('.more'); expect(text('.summary')).toBe('2 × €4 = €8')` },
        {
          name: 'ref tracks, triggers, and skips unchanged values',
          code: `const { ref, effect } = requireModule('mini-reactivity.js')
const count = ref(1)
const seen = []
effect(() => { seen.push(count.value) })
count.value = 2
count.value = 2
expect(seen).toEqual([1, 2])`,
        },
        {
          name: 'computed is lazy and cached',
          code: `const { reactive, computed } = requireModule('mini-reactivity.js')
const cart = reactive({ price: 10, qty: 2 })
let calls = 0
const total = computed(() => { calls++; return cart.price * cart.qty })
expect(calls).toBe(0)
expect(total.value).toBe(20)
expect(total.value).toBe(20)
expect(calls).toBe(1)
cart.qty = 3
expect(calls).toBe(1)
expect(total.value).toBe(30)
expect(calls).toBe(2)`,
        },
        {
          name: 'effects reading a computed re-run when its dependencies change',
          code: `const { reactive, computed, effect } = requireModule('mini-reactivity.js')
const cart = reactive({ price: 10, qty: 2 })
const total = computed(() => cart.price * cart.qty)
const seen = []
effect(() => { seen.push(total.value) })
cart.price = 5
expect(seen).toEqual([20, 10])`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'how-reactivity-works-under-the-hood',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 5,
      question: 'How does Vue 3\'s reactivity system work under the hood?',
      answer: '`reactive()` wraps objects in a Proxy and `ref()` uses a getter/setter on `.value`, so Vue can intercept reads and writes. Code that should react — component renders, computeds, watchers — runs inside *effects*. While an effect runs, each reactive read calls `track`, recording the effect as a subscriber of that object\'s property. A write with a changed value calls `trigger`, which finds those subscribers: computeds are marked dirty, and component updates/watchers are queued in a scheduler that de-duplicates them and flushes in a microtask. The re-run render produces a new virtual DOM, which is diffed and patched into the real DOM.',
      explanation: 'Read = subscribe, write = notify, with batching in between. Dependencies are re-collected on every run.',
      whyAsked: 'The single most common senior Vue question. It reveals whether you can reason about updates instead of memorising rules.',
      mistakes: [
        'Saying Vue uses dirty checking or polling.',
        'Mentioning only Proxies and forgetting effects, tracking and the scheduler.',
        'Claiming updates are synchronous.',
        'Presenting internal names (targetMap, ReactiveEffect) as public API.',
      ],
      followUps: [
        'Why do refs need `.value`?',
        'How is computed caching implemented?',
        'What changed in Vue 3.5\'s reactivity internals?',
        'How is this different from Vue 2?',
      ],
      modelAnswer: 'Vue makes state observable through Proxies for `reactive()` objects and getter/setters for refs. Anything that should react — a component render, a computed, a watcher — runs as an effect. While an effect runs, every reactive read is tracked: Vue records that this effect depends on this object\'s property. When a property is written with a new value, Vue triggers its subscribers: computeds are marked dirty and recompute lazily, while component updates and watchers go into a scheduler queue that is de-duplicated and flushed in a microtask, so one tick means one render per component. The render produces a virtual DOM that is diffed and patched. Dependencies are re-collected every run, so conditional logic is handled. The internals changed in 3.5, but this contract hasn\'t.',
    },
    {
      id: 'how-reactivity-works-proxy-vs-defineproperty',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Why did Vue 3 switch from `Object.defineProperty` to Proxies? What are the trade-offs?',
      answer: 'defineProperty only intercepts properties that exist when the object is converted, and conversion had to walk and redefine every property eagerly. So Vue 2 missed added/deleted keys and array index/length writes, and couldn\'t support Map/Set. A Proxy intercepts operations on the whole object — any key, plus `in`, `delete` and key enumeration — and nested objects can be wrapped lazily on access. Trade-offs: the proxy is a different object from the raw one (identity issues, `toRaw`), some objects don\'t work well behind a proxy (private class fields), and Proxies can\'t be polyfilled, so Vue 3 dropped IE11.',
      explanation: 'Per-property interception vs per-object interception. The new model removes caveats but introduces proxy identity as a concept.',
      whyAsked: 'Common in migration-heavy teams and a good test of understanding beyond API usage.',
      mistakes: ['Saying Vue 2 couldn\'t detect `push`.', 'Forgetting the identity trade-off.', 'Claiming Proxies are simply "faster" without saying what work changed.'],
      followUps: ['What problems can proxy identity cause?', 'Why can\'t refs be implemented with a Proxy for primitives?'],
      modelAnswer: 'Vue 2 redefined each existing property as a getter/setter. That only covers properties present at conversion time, so new or deleted keys and array index writes went unnoticed — hence `Vue.set` — and it required eagerly walking all data. A Proxy wraps the whole object and intercepts any key, deletions, `in` checks and enumeration, so those caveats disappear, Map and Set become possible, and nested objects are converted lazily. The costs: the proxy is a separate object from the original, so identity comparisons and libraries can trip over it; some objects, like classes with private fields, break when proxied; and Proxies can\'t be polyfilled, which is part of why Vue 3 dropped IE11.',
    },
    {
      id: 'how-reactivity-works-overrender',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A dashboard widget shows only `settings.theme`, but it re-renders whenever *any* setting changes. The template contains a small debug line. Explain, in terms of tracking, what is happening and how you would confirm it.',
      code: {
        lang: 'vue',
        code: `<template>
  <div :class="settings.theme">
    <h3>Theme preview</h3>
    <small v-if="debug">{{ JSON.stringify(settings) }}</small>
  </div>
</template>`,
      },
      answer: 'When `debug` is true, `JSON.stringify(settings)` reads every key of the reactive object during render, so the render effect subscribes to all of them; any change triggers a re-render. Confirm with `onRenderTriggered((e) => console.log(e.key))` (dev only) or Vue DevTools. Fix: remove the debug serialisation from hot components, or move it to a separate small component, so the widget\'s render only reads `settings.theme`.',
      explanation: 'Tracking is per key — but reading many keys subscribes to many keys. Serialising, iterating or spreading an object in a render are the usual culprits.',
      whyAsked: 'Shows whether you can connect a performance symptom to the tracking mechanism and use the right tools to prove it.',
      mistakes: ['Blaming the virtual DOM.', 'Reaching for `v-memo` or `shallowRef` before finding what was tracked.', 'Not knowing the dev-only debug hooks.'],
      followUps: ['What would `onRenderTracked` show here?', 'Would `v-memo` help? What would it cost?'],
      modelAnswer: 'A render tracks every reactive property it reads. With `debug` on, `JSON.stringify(settings)` touches every key, so the widget subscribes to all settings, and any change re-renders it. I would confirm with `onRenderTriggered` in development, which logs the exact key that caused each re-render, or with DevTools. The fix is to keep the render narrow: drop the serialisation or move it into its own component, so this one only depends on `settings.theme`.',
    },
    {
      id: 'how-reactivity-works-dynamic-deps',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 4,
      question: 'How many times in total does the effect run (including its first run)?',
      code: {
        lang: 'js',
        code: `const state = reactive({ showDetails: false, name: 'Ada', details: 'Mathematician' })
let runs = 0

watchEffect(() => {
  runs++
  state.showDetails ? state.details : state.name
})

state.details = 'Poet'      // A
await nextTick()
state.showDetails = true    // B
await nextTick()
state.name = 'Grace'        // C
await nextTick()

console.log(runs)`,
      },
      options: ['2', '4', '3', '1'],
      correctOption: 0,
      answer: '2. The first run reads `showDetails` and `name` (not `details`), so A triggers nothing. B changes `showDetails`, a dependency: run #2, which now reads `showDetails` and `details`. Dependencies are re-collected on every run, so `name` is no longer tracked and C triggers nothing.',
      explanation: 'An effect depends on what it read in its most recent run, not on everything it could read.',
      whyAsked: 'Tests whether you understand dynamic dependency collection — the reason conditional logic in computeds and renders "just works".',
      mistakes: ['Assuming all properties in the function body are tracked.', 'Forgetting that dependencies are re-collected (answering 3).'],
      followUps: ['What would a naive engine without dependency cleanup do at step C?', 'How does Vue 3.5 implement the cleanup efficiently?'],
      modelAnswer: 'Two. Tracking is dynamic: the first run reads `showDetails` and `name`, so changing `details` does nothing. Flipping `showDetails` triggers a second run that reads `details` instead of `name`. Because Vue re-collects dependencies on every run, `name` is dropped, so changing it afterwards doesn\'t re-run the effect. A naive engine without cleanup would run a third time at C.',
    },
    {
      id: 'how-reactivity-works-large-data',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'A dashboard keeps tens of thousands of rows from an API in `reactive()` state and filters them in a computed as the user types. Typing feels sluggish. How do you reason about the cost, and what would you change?',
      answer: 'Measure first (DevTools, browser profiler). Then reason about the work per keystroke: the filter computed reads fields on every row through proxies (proxy creation on first access and a tracking entry per row and field read), the render creates and patches many nodes, and every keystroke triggers all of it. Changes: hold replace-only API data in `shallowRef` (or `markRaw` the rows) so filtering reads plain objects; debounce the query; keep the computed\'s inputs narrow; render only visible rows with a virtual list; paginate or filter server-side for very large sets.',
      explanation: 'Deep reactivity buys automatic tracking of nested changes. Data nobody edits in place doesn\'t need it, and rendering is often the bigger cost.',
      code: {
        lang: 'js',
        code: `const rows = shallowRef([])                       // plain row objects
const query = ref('')
const debouncedQuery = useDebounced(query, 200)   // your own composable

const visible = computed(() => {
  const q = debouncedQuery.value.toLowerCase()
  return rows.value.filter((r) => r.name.toLowerCase().includes(q))
})

async function load() {
  rows.value = await api.getRows()                // replace, never mutate
}`,
      },
      whyAsked: 'Senior candidates must connect the reactivity mechanism to real performance work and choose tools deliberately.',
      mistakes: ['Jumping to `shallowRef` without measuring.', 'Ignoring rendering cost and virtualisation.', 'Debouncing without fixing the expensive render.', 'Forgetting that shallow data must then be updated immutably.'],
      followUps: ['What breaks if someone later edits a row in place?', 'When would you move filtering to the server or a Web Worker?'],
      modelAnswer: 'I would profile first. Conceptually, each keystroke re-runs a computed that reads fields on every row through deep proxies, which costs proxy creation and a tracking entry per read, and then renders and patches a huge list. Since the data is replace-only, I would put it in a `shallowRef` so filtering reads plain objects, debounce the query, and virtualise the list so only visible rows render. For really large datasets I would paginate or filter on the server. The trade-off is that the shallow data must be updated immutably, so I would document that in the code.',
    },
    {
      id: 'how-reactivity-works-computed-internals',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How does `computed()` achieve caching and laziness under the hood? What changed in Vue 3.4 and 3.5?',
      answer: 'A computed is an effect around your getter that is also a dependency for whoever reads it. Reading `.value` runs the getter (tracking its sources) only if the computed is dirty, then caches the result and tracks the reader. When a source changes, the computed doesn\'t recompute immediately: it\'s marked dirty and notifies its readers, and recomputes on the next read. Since 3.4, readers are only re-run if the recomputed value actually changed. In 3.5 the internals were refactored to use version counters and linked lists for dependency tracking — public behaviour stayed the same.',
      explanation: 'Dirty flag + lazy recompute + "notify my readers". Value comparison since 3.4 stops unnecessary downstream work.',
      whyAsked: 'Probes depth: can you explain *why* computeds are cheap and when they aren\'t?',
      mistakes: ['Saying computeds recompute eagerly on every change.', 'Saying computeds are "memoised by arguments" (they take no arguments).', 'Stating internal details as guaranteed API.'],
      followUps: ['Why can a computed that returns a new array every time still cause downstream work?', 'What is the difference between a computed and a method call in a template?'],
      modelAnswer: 'A computed wraps the getter in a lazy effect. The first `.value` read runs the getter, which tracks its sources, caches the result, and the reader subscribes to the computed. When a source changes, the computed is just marked dirty and notifies its readers; nothing recomputes until someone reads it, so unread computeds cost nothing. Since 3.4, readers are only re-triggered if the new value differs from the old one, which is why returning a fresh object every time defeats that optimisation. Vue 3.5 reimplemented the bookkeeping with version counters, but those are internal details — the guarantees are lazy, cached and dependency-driven.',
    },
    {
      id: 'how-reactivity-works-coding-deep',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'This simplified engine\'s `reactive()` is shallow: nested writes like `profile.address.city = \'Pune\'` don\'t trigger effects. Make it **deep, lazily** (wrap nested objects when they are accessed), and make sure the same object always yields the **same proxy** (`reactive(raw) === reactive(raw)` and `state.nested === state.nested`).',
      starter: { files: { 'main.js': profileMain, 'mini-reactivity.js': deepStarter } },
      tests: [
        { name: 'the demo updates on a nested write', code: `expect(text('.city')).toBe('Ada lives in London'); await click('.move'); expect(text('.city')).toBe('Ada lives in Pune')` },
        {
          name: 'nested writes trigger effects',
          code: `const { reactive, effect } = requireModule('mini-reactivity.js')
const s = reactive({ user: { name: 'Ada' } })
const seen = []
effect(() => { seen.push(s.user.name) })
s.user.name = 'Grace'
expect(seen).toEqual(['Ada', 'Grace'])`,
        },
        {
          name: 'one proxy per object',
          code: `const { reactive } = requireModule('mini-reactivity.js')
const raw = { nested: { a: 1 } }
const s = reactive(raw)
expect(reactive(raw)).toBe(s)
expect(s.nested).toBe(s.nested)
expect(s.nested.a).toBe(1)`,
        },
        { name: 'primitives and null are returned as-is', code: `const { reactive } = requireModule('mini-reactivity.js'); const s = reactive({ n: 1, empty: null }); expect(s.n).toBe(1); expect(s.empty).toBeNull()` },
      ],
      hints: [
        'In the `get` trap, if the value is an object (and not `null`), return `reactive(value)` instead of the raw value.',
        'Without a cache, every access creates a brand-new Proxy, so `s.nested !== s.nested`. Keep a `WeakMap` from raw objects to their proxies.',
        'At the top of `reactive(target)`: return the cached proxy if there is one; otherwise create it, store it in the map, and return it.',
      ],
      answer: 'Wrap nested objects in the get trap via reactive(), and cache proxies in a WeakMap keyed by the raw object.',
      solution: { files: { 'main.js': profileMain, 'mini-reactivity.js': deepSolution } },
      explanation: 'Lazy wrapping means only objects you actually touch get proxies — this is how Vue avoids walking big objects up front. The WeakMap cache gives stable identity (the same raw object always maps to the same proxy) without preventing garbage collection. Vue keeps a similar raw → proxy map for each kind of proxy (reactive, readonly, shallow…).',
      whyAsked: 'Implementing a slice of the engine shows real understanding of lazy deep conversion and proxy identity.',
      mistakes: ['Wrapping eagerly by walking the whole object at creation.', 'Forgetting the cache, so identity checks fail and effects subscribe to throwaway proxies.', 'Treating `null` as an object (`typeof null === \'object\'`).'],
      followUps: ['How would you add a readonly variant?', 'What should happen if someone passes an already-reactive proxy to `reactive()`?'],
      modelAnswer: 'In the `get` trap I return `reactive(value)` for non-null objects, so nesting is converted lazily, only on access. Then I add a `WeakMap` from raw objects to proxies and check it at the start of `reactive()`, so each object has exactly one proxy — that keeps identity stable and avoids creating a new proxy on every read. Vue does the same, with separate caches for reactive, readonly and shallow proxies, and it also detects when it is handed a proxy that is already reactive.',
    },
  ],

  takeaways: [
    'Reading reactive state inside an effect subscribes the effect (track); writing a changed value notifies subscribers (trigger).',
    '`reactive()` uses Proxies (any key, lazily deep); `ref()` uses a getter/setter on `.value` because primitives can\'t be proxied.',
    'Effects — renders, computeds, watchers — re-collect their dependencies on every run; tracking is per property.',
    'Computeds are lazy and cached; component updates are queued, de-duplicated and flushed in a microtask.',
    'Every reactivity rule (no destructuring, no replacing, no plain variables, nextTick) follows from this mechanism.',
    'Build on the documented public API; internal names and structures (changed in 3.5) are implementation details.',
  ],
}
