// Lesson: effectScope() & onScopeDispose() (Level 11 — Advanced Reactivity & Internals)

const timersJs = `import { reactive } from 'vue'

// Counts live intervals so leaks become visible.
export const timerStats = reactive({ active: 0 })

export function startInterval(fn, ms) {
  const id = setInterval(fn, ms)
  timerStats.active++
  let cleared = false
  return function stop() {
    if (cleared) return
    cleared = true
    clearInterval(id)
    timerStats.active--
  }
}`

const tickerJs = `import { ref, onUnmounted } from 'vue'
import { startInterval } from './timers.js'

// A fake live price that wobbles every 300 ms
export function useTicker(symbol) {
  const price = ref(100)
  let tick = 0
  const stop = startInterval(() => {
    tick++
    price.value = Math.round((100 + Math.sin(tick) * 3) * 100) / 100
  }, 300)

  // BUG: onUnmounted only works inside a component's setup().
  // Inside effectScope().run() there is no component, so this never runs.
  onUnmounted(stop)

  return { symbol, price }
}`

const tickerApp = `<script setup>
import { ref, computed, watch, effectScope } from 'vue'
import { useTicker } from './useTicker.js'
import { timerStats } from './timers.js'

const running = ref(false)
const price = ref(null)
const previous = ref(null)
let scope = null

const trend = computed(() => {
  if (previous.value === null || price.value === null) return '·'
  return price.value >= previous.value ? '▲' : '▼'
})

function start() {
  scope = effectScope()
  scope.run(() => {
    const ticker = useTicker('VUE')
    // This watcher belongs to the scope: scope.stop() stops it too
    watch(ticker.price, (now, before) => {
      previous.value = before ?? null
      price.value = now
    }, { immediate: true })
  })
  running.value = true
}

function stop() {
  scope.stop()
  scope = null
  running.value = false
}
</script>

<template>
  <h2>Live ticker</h2>
  <p class="status">{{ running ? 'Running' : 'Stopped' }}</p>
  <p class="price">VUE: {{ price ?? '—' }} {{ trend }}</p>
  <p class="timers">Active intervals: {{ timerStats.active }}</p>
  <button class="start" :disabled="running" @click="start">Start</button>
  <button class="stop" :disabled="!running" @click="stop">Stop</button>
</template>`

export default {
  id: 'effect-scope',
  title: 'effectScope() & onScopeDispose()',
  summary: 'Group watchers, computeds and cleanups into a scope you can stop in one call — the tool behind leak-free composables, shared state and libraries.',
  difficulty: 'advanced',
  minutes: 35,
  prerequisites: ['composables-intro', 'watch', 'lifecycle-hooks'],
  related: ['dependency-tracking', 'scheduling-flush', 'custom-ref', 'composable-design', 'pinia-basics'],
  tags: ['effectScope', 'onScopeDispose', 'getCurrentScope', 'cleanup', 'memory leaks', 'composables', 'detached scope', 'pause', 'resume'],
  apis: [
    { name: 'effectScope(detached?)', summary: 'Creates a scope that collects effects (computed, watch, watchEffect) created inside scope.run(), so they can be stopped together.' },
    { name: 'scope.run(fn)', summary: 'Runs fn with this scope active and returns fn\'s return value. Effects created synchronously inside are collected.' },
    { name: 'scope.stop()', summary: 'Stops every collected effect, runs onScopeDispose callbacks and stops nested (non-detached) scopes.' },
    { name: 'scope.pause() / scope.resume()', summary: '3.5+: pause all effects in the scope; effects triggered while paused run once on resume.' },
    { name: 'getCurrentScope()', summary: 'Returns the active effect scope, if any (inside setup() it is the component\'s scope).' },
    { name: 'onScopeDispose(fn, failSilently?)', summary: 'Registers a cleanup on the active scope; runs when it stops. Works in components and standalone scopes. failSilently is 3.5+.' },
  ],
  docs: [
    { label: 'API — Reactivity: Advanced — effectScope()', url: 'https://vuejs.org/api/reactivity-advanced.html#effectscope' },
    { label: 'API — onScopeDispose()', url: 'https://vuejs.org/api/reactivity-advanced.html#onscopedispose' },
    { label: 'Vue Guide — Watchers: Stopping a Watcher', url: 'https://vuejs.org/guide/essentials/watchers.html#stopping-a-watcher' },
    { label: 'Vue Guide — Composables', url: 'https://vuejs.org/guide/reusability/composables.html' },
  ],

  intro: `
Every \`watch\`, \`watchEffect\` and \`computed\` you create is a small machine that keeps running until somebody stops it. Inside a component you rarely think about this, because Vue stops them for you when the component unmounts.

But reactive code doesn't only live inside components. Stores, shared composables, plugins, background features and tests all create effects — and nobody is there to clean up after them.

\`effectScope()\` is the answer: a container that **collects** every effect created inside it, so you can stop them all with one \`scope.stop()\`. Its partner \`onScopeDispose()\` registers cleanup code (clear a timer, close a socket) that runs when the scope stops — whether that scope belongs to a component or not.
`,

  why: `
Effects that are never stopped are **leaks**: they keep memory alive and keep doing work — re-running callbacks, re-fetching, updating state nobody displays.

\`\`\`js
// a plain module — no component owns these
const settings = reactive({ theme: 'light' })
watch(() => settings.theme, saveToServer)   // who stops this?
const timer = setInterval(poll, 1000)       // and this?
\`\`\`

Before effect scopes, you had to collect every \`stop\` handle by hand. Forget one and it lives forever. Effect scopes make cleanup **structural**: create things inside a scope, stop the scope, done. That's why Vue uses the same mechanism internally for components, and why libraries build on it.
`,

  eli15: `
Imagine a birthday party at a rented hall. Guests bring balloons, music speakers, a projector. When the party's over, the cleaning crew doesn't search the whole city for your stuff — they clear **everything inside this hall**.

An effect scope is that hall. You run code "inside the hall" (\`scope.run(...)\`), and every watcher or computed created there is recorded as belonging to it. When you call \`scope.stop()\`, all of it is switched off at once.

\`onScopeDispose()\` is a note on the door: "when the party ends, also unplug the projector and return the speakers" — cleanup that isn't a watcher, like a timer or a network connection.

Every Vue component already rents its own hall. That's why things you create in \`setup()\` disappear automatically when the component unmounts.
`,

  analogy: {
    title: 'The rented party hall',
    body: `
A hall collects everything brought into it during the party. Closing the hall clears it all; notes on the door list extra chores. A smaller room inside the hall closes along with it — unless it was booked separately.
`,
    mapping: [
      ['the hall', 'an effect scope'],
      ['bringing things in during the party', 'creating effects inside `scope.run(fn)`'],
      ['closing the hall', '`scope.stop()` — stops every collected effect'],
      ['a chore note on the door', '`onScopeDispose(fn)` — e.g. clear a timer'],
      ['a room inside the hall', 'a nested scope, stopped with its parent'],
      ['a room booked separately', '`effectScope(true)` — a detached scope you stop yourself'],
      ['every component\'s own hall', 'the scope Vue creates for each component\'s setup()'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Scopes form a tree',
    caption: 'Step through what gets collected — and what escapes. Stopping a scope cascades down the tree.',
    alt: 'A tree diagram. A component scope collects a watcher and a computed created in setup, a nested effect scope, and an onScopeDispose cleanup. A detached scope and a watcher created later inside setTimeout sit outside the tree. When the component unmounts, the stop cascades through everything in the tree, but the detached scope and the late watcher keep running.',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'comp', label: 'Component scope', note: 'created by Vue for setup()', x: 380, y: 50, tone: 'acid' },
        { id: 'effects', label: 'watch / computed', note: 'created in setup', x: 120, y: 165, tone: 'paper' },
        { id: 'nested', label: 'effectScope()', note: 'nested scope', x: 300, y: 165, tone: 'cobalt' },
        { id: 'dispose', label: 'onScopeDispose(fn)', note: 'clear timers, close sockets', x: 480, y: 165, tone: 'kraft' },
        { id: 'nestedFx', label: 'its own effects', note: 'collected by the nested scope', x: 300, y: 280, tone: 'paper' },
        { id: 'detached', label: 'effectScope(true)', note: 'detached: you stop it', x: 660, y: 165, tone: 'red' },
        { id: 'late', label: 'watch() in setTimeout', note: 'no active scope: leaks', x: 640, y: 280, tone: 'red' },
      ],
      edges: [
        { from: 'comp', to: 'effects', label: 'collects' },
        { from: 'comp', to: 'nested', label: 'collects' },
        { from: 'comp', to: 'dispose', label: 'registers' },
        { from: 'nested', to: 'nestedFx', label: 'collects' },
        { id: 'escape', from: 'comp', to: 'detached', label: 'not collected', dashed: true },
      ],
      steps: [
        { focus: ['comp'], text: 'When Vue runs a component\'s `setup()`, it makes the component\'s **scope** the active one. `getCurrentScope()` returns it.' },
        { focus: ['comp', 'effects'], edges: ['comp->effects'], text: 'Every `watch`, `watchEffect` and `computed` created **synchronously** during setup is collected by that scope.' },
        { focus: ['nested', 'nestedFx'], edges: ['comp->nested', 'nested->nestedFx'], text: 'An `effectScope()` created while another scope is active becomes its **child**, and collects its own effects.' },
        { focus: ['dispose'], edges: ['comp->dispose'], text: '`onScopeDispose(fn)` attaches cleanup to the active scope. Composables use it instead of `onUnmounted` so they work in any scope.' },
        { focus: ['detached', 'late'], edges: ['escape'], text: 'Two things escape: a **detached** scope (`effectScope(true)`), and effects created later — in a `setTimeout`, a promise callback or an event handler — when no scope is active.' },
        { focus: ['comp', 'effects', 'nested', 'nestedFx', 'dispose'], text: 'On unmount, Vue calls `stop()` on the component scope: effects stop, cleanups run, child scopes stop. The detached scope and the late watcher **keep running** until you stop them.' },
      ],
    },
  },

  syntax: [
    `
#### Create, run, stop
`,
    {
      code: `import { ref, computed, watch, effectScope, onScopeDispose } from 'vue'

const scope = effectScope()

const api = scope.run(() => {
  const count = ref(0)
  const doubled = computed(() => count.value * 2)
  watch(count, (n) => console.log('count is', n))

  const id = setInterval(() => count.value++, 1000)
  onScopeDispose(() => clearInterval(id)) // cleanup that isn't an effect

  return { count, doubled }               // run() returns this
})

// later — one call stops the watcher and computed and clears the interval
scope.stop()`,
      lang: 'js',
      title: 'effectScope basics',
    },
    `
**The rules:**

1. Only effects created **synchronously** inside \`run()\` are collected. Something created later — after an \`await\`, in a \`setTimeout\` — happens when the scope is no longer active.
2. \`run()\` returns whatever your function returns. A stopped scope can't be run again (Vue warns, and \`run\` returns \`undefined\`) — create a new scope instead.
3. A scope created while another scope is active is **nested**: stopping the parent stops it. \`effectScope(true)\` creates a **detached** scope that no parent collects.
4. \`getCurrentScope()\` returns the active scope or \`undefined\`.
5. \`onScopeDispose(fn)\` registers \`fn\` on the active scope. With no active scope Vue warns in development; pass \`true\` as the second argument (\`failSilently\`, 3.5+) to opt out of the warning.
`,
    `
#### Components already have a scope

Vue runs every component's \`setup()\` inside a scope it creates for that instance, and stops it on unmount. That's the documented reason "watchers created synchronously in setup are stopped automatically" — and why \`onScopeDispose()\` works inside components as well as in standalone scopes.
`,
    {
      code: `// in a component's <script setup>
watch(source, cb)                 // collected: stopped on unmount

setTimeout(() => {
  const stop = watch(source, cb)  // NOT collected: no active scope here
  onUnmounted(stop)               // …and this warns: no active component either
}, 100)

// fix: create it synchronously, or keep the handle and stop it yourself
let stopLate
setTimeout(() => { stopLate = watch(source, cb) }, 100)
onUnmounted(() => stopLate?.())`,
      lang: 'js',
      title: 'what a component collects',
    },
    `
#### Composables: prefer \`onScopeDispose\` for cleanup

\`onUnmounted\` only works during a component's \`setup()\`. \`onScopeDispose\` works in a component *and* inside any \`effectScope().run()\` — so a composable that cleans up with \`onScopeDispose\` can be used in components, stores, tests and shared scopes alike.
`,
    {
      code: `export function useInterval(fn, ms) {
  const id = setInterval(fn, ms)
  onScopeDispose(() => clearInterval(id))   // works wherever there is a scope
}`,
      lang: 'js',
      title: 'scope-friendly cleanup',
    },
    {
      callout: 'version',
      title: 'Version notes',
      text: '`effectScope`, `getCurrentScope` and `onScopeDispose` have been public since **Vue 3.2**. `scope.pause()` / `scope.resume()` and the `failSilently` argument of `onScopeDispose` are **3.5+**. Pausing affects reactive effects only — a paused scope does **not** pause your timers or sockets.',
    },
    {
      callout: 'warn',
      title: 'Public API vs internals',
      text: 'Public: `effectScope()`, `run`, `stop`, `active`, `pause`/`resume` (3.5+), `getCurrentScope`, `onScopeDispose`. Internal: the `EffectScope` class fields (`effects`, `cleanups`, `scopes`, `on()`/`off()`), how a component stores its scope, and how libraries like Pinia use scopes inside. Don\'t reach into those.',
    },
  ],

  walkthrough: {
    title: 'App.vue (live ticker)',
    lang: 'vue',
    code: tickerApp,
    intro: 'The playground\'s main component. `useTicker.js` starts an interval; `timers.js` counts live intervals so leaks show up on screen.',
    steps: [
      { lines: [6, 9], text: 'Display state lives in the component. `scope` is a plain variable: it holds the effect scope of the *current* run of the ticker, or `null` when stopped.' },
      { lines: [11, 14], text: 'A computed created synchronously in setup — collected by the **component\'s** scope, so it stops when the component unmounts.' },
      { lines: [16, 17], text: '`start()` runs in a click handler, where no scope is active, so this new scope is standalone: nothing will stop it except us.' },
      { lines: [18, 25], text: 'Inside `scope.run()`, both the composable\'s internals and this `watch` are collected by the new scope. `immediate: true` copies the first price straight away.' },
      { lines: [29, 33], text: '`stop()` stops the scope: the watcher stops and every `onScopeDispose` callback runs. A stopped scope can\'t be reused, so we drop it and create a fresh one on the next start.' },
      { lines: [39, 41], text: '"Active intervals" reads a reactive counter from `timers.js`. After Stop it should drop back to 0 — on the original code it doesn\'t. That\'s experiment 1.' },
    ],
  },

  playground: {
    title: 'Live ticker with an effect scope',
    objective: 'Start and stop a ticker that lives in its own effect scope, find the leak, then add unmount cleanup and pause/resume.',
    files: { 'App.vue': tickerApp, 'useTicker.js': tickerJs, 'timers.js': timersJs },
    expected: `
**Stopped**, a dash for the price, **Active intervals: 0**. Click **Start**: the price wobbles every 300 ms with a ▲/▼ trend and intervals go to 1. Click **Stop**: the price freezes — but **Active intervals stays at 1**, and the console shows a Vue warning that \`onUnmounted\` was called with no active component. The interval leaked. Each Start/Stop leaks one more.
`,
    experiments: [
      {
        id: 'scope-dispose',
        task: 'Fix the leak in **useTicker.js**: replace `onUnmounted(stop)` with `onScopeDispose(stop)`. After Start → Stop, **Active intervals** must be back to 0.',
        hint: 'Change the import too: `import { ref, onScopeDispose } from \'vue\'`.',
        tests: [
          {
            name: 'stopping the scope clears the interval',
            code: `const { timerStats } = requireModule('timers.js')
await click('.start')
expect(timerStats.active).toBe(1)
await click('.stop')
expect(timerStats.active).toBe(0)
expect(text('.timers')).toBe('Active intervals: 0')`,
          },
        ],
        explain: '`onScopeDispose` registers the cleanup on whatever scope is active — here the one created in `start()`. `scope.stop()` runs it. The same composable still works inside components, because a component\'s setup also runs in a scope.',
      },
      {
        id: 'unmount-cleanup',
        task: 'If the component unmounts **while the ticker is running**, the standalone scope survives. Make sure it is stopped on unmount. (Do experiment 1 first.)',
        hint: 'Register `onUnmounted(() => scope && scope.stop())` — or `onScopeDispose(...)` — at the top level of `<script setup>`.',
        tests: [
          {
            name: 'unmounting while running clears everything',
            code: `const { timerStats } = requireModule('timers.js')
await click('.start')
expect(timerStats.active).toBe(1)
vm.$.appContext.app.unmount()
expect(timerStats.active).toBe(0)`,
          },
        ],
        explain: 'The scope was created in an event handler, where no scope is active, so the component\'s scope never collected it. Tying it to the component\'s lifetime is your job. An alternative is to make `start()` create the new scope *inside* `componentScope.run()`, where `componentScope = getCurrentScope()` was captured during setup — then the component collects it.',
      },
      {
        id: 'pause-resume',
        task: 'Add **Pause** (`class="pause"`) and **Resume** (`class="resume"`) buttons that call `scope.pause()` and `scope.resume()` (Vue 3.5+). While paused the displayed price must not change; on resume it catches up.',
        hint: 'Two small functions: `function pause() { scope?.pause() }` and `function resume() { scope?.resume() }`, plus two buttons. Leave the interval alone.',
        tests: [
          {
            name: 'the display freezes while paused and catches up on resume',
            code: `await click('.start')
await click('.pause')
const before = text('.price')
await wait(700)
expect(text('.price')).toBe(before)
await click('.resume')
expect(text('.price')).not.toBe(before)`,
          },
        ],
        explain: 'Pausing a scope pauses its **effects** — here the watcher that copies the price. The interval kept running (check **Active intervals**): `pause()` never touches timers. Effects triggered during the pause run **once** on resume, with the latest value. Useful for off-screen widgets or background tabs.',
      },
      {
        id: 'current-scope',
        task: 'Add `console.log(\'setup:\', !!getCurrentScope())` in `<script setup>` and `console.log(\'click:\', !!getCurrentScope())` at the start of `start()`. Predict both, then check the console.',
        hint: 'Import `getCurrentScope` from `\'vue\'`.',
        explain: '`setup: true` — setup runs inside the component\'s scope. `click: false` — event handlers run later, outside any scope. That one fact explains why effects created in handlers, timers and promise callbacks aren\'t cleaned up automatically.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'A shared composable with reference counting',
    caption: 'Many components, one detached scope. The scope starts with the first user and stops with the last.',
    alt: 'A stepped diagram of a shared composable. Component A mounts and creates a detached scope holding the shared state; component B mounts and reuses it, raising the subscriber count to two. When A unmounts the count drops to one and the scope stays alive; when B unmounts the count reaches zero and the scope is stopped.',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'a', label: 'Component A', note: 'uses useSharedClock()', x: 120, y: 80, tone: 'acid' },
        { id: 'b', label: 'Component B', note: 'uses useSharedClock()', x: 120, y: 230, tone: 'acid' },
        { id: 'counter', label: 'subscribers', note: '0 → 1 → 2 → 1 → 0', x: 380, y: 155, tone: 'kraft' },
        { id: 'scope', label: 'effectScope(true)', note: 'shared state + interval', x: 630, y: 155, tone: 'cobalt' },
      ],
      edges: [
        { from: 'a', to: 'counter', label: '+1 / −1 on dispose' },
        { from: 'b', to: 'counter', label: '+1 / −1 on dispose' },
        { from: 'counter', to: 'scope', label: 'first: create · last: stop()' },
      ],
      steps: [
        { focus: ['a', 'counter', 'scope'], edges: ['a->counter', 'counter->scope'], text: 'A mounts. Subscribers 0 → 1, so the composable runs inside a new **detached** scope (detached, so A\'s own scope doesn\'t own it).' },
        { focus: ['b', 'counter'], edges: ['b->counter'], text: 'B mounts. Subscribers 1 → 2. The existing state is returned: one interval, one source of truth.' },
        { focus: ['a', 'counter'], edges: ['a->counter'], text: 'A unmounts. Its `onScopeDispose` callback lowers the count to 1. The shared scope keeps running for B.' },
        { focus: ['b', 'counter', 'scope'], edges: ['b->counter', 'counter->scope'], text: 'B unmounts. The count reaches 0, so the shared scope is **stopped**: effects stop, the interval is cleared. The next user starts fresh.' },
      ],
    },
  },

  internals: {
    beginner: `
A scope is basically a list. While it is "active", every new watcher or computed adds itself to the list, and every \`onScopeDispose\` adds a cleanup function. \`stop()\` walks the list: switch off each effect, call each cleanup, then tell any child scopes to do the same.

There's only ever one active scope at a time, and Vue remembers the previous one so it can switch back afterwards — like a stack of trays.
`,
    technical: [
      `
**Collection.** Creating a reactive effect (watcher, render effect) registers it with the active scope. \`scope.run(fn)\` makes the scope active, calls \`fn\`, and restores the previous scope in a \`finally\` — so it works when nested, and an exception doesn't leave the wrong scope active. A non-detached scope created while another is active registers itself as a child; \`effectScope(true)\` skips that step.

**Stopping.** \`stop()\` stops each effect (unsubscribing it from every dependency, so it can never be triggered again), runs the cleanups in registration order, stops child scopes, and removes itself from its parent. After that \`scope.active\` is \`false\`.

**Components.** Each component instance has a scope. Vue activates it around \`setup()\` (and around the render effect's creation), and stops it during unmount — which is how "stopped automatically on unmount" is implemented. Because \`<script setup>\` top-level \`await\` is compiled to restore the instance context after each await, effects created after a top-level await in \`<script setup>\` are still collected; callbacks you schedule yourself (\`setTimeout\`, \`.then()\`) are not.

**Pause (3.5+).** \`pause()\` flags every effect in the scope (and child scopes) as paused. Triggering a paused effect only records that it needs to run; \`resume()\` runs each recorded effect once.
`,
      {
        code: `// A SIMPLIFIED model of an effect scope — not Vue's source
let activeScope

class Scope {
  effects = []
  cleanups = []
  children = []
  constructor(detached = false) {
    if (!detached && activeScope) activeScope.children.push(this)
  }
  run(fn) {
    const prev = activeScope
    activeScope = this
    try { return fn() } finally { activeScope = prev }
  }
  stop() {
    this.effects.forEach((e) => e.stop())
    this.cleanups.forEach((fn) => fn())
    this.children.forEach((s) => s.stop())
  }
}

function onScopeDispose(fn) {
  if (activeScope) activeScope.cleanups.push(fn)
}`,
        lang: 'js',
        title: 'mental model of a scope',
      },
      {
        callout: 'warn',
        title: 'Implementation detail',
        text: 'Vue\'s real `EffectScope` class has internal fields (`effects`, `cleanups`, `scopes`, an index for O(1) removal from the parent, `on()`/`off()` used by the runtime) that are marked `@internal` in its source and change between releases. Only the documented methods are API.',
      },
    ],
    production: `
- **Composables clean up with \`onScopeDispose\`**, not \`onUnmounted\`, so they work in components, stores, tests and shared scopes.
- **Anything created in a callback needs an owner.** Keep the stop handle (or a scope) and stop it on unmount. Code review checklist: every \`setInterval\`, \`addEventListener\` and late \`watch\` has a matching cleanup.
- **Shared composables:** a detached scope plus reference counting gives "one instance while anyone uses it" (VueUse's \`createSharedComposable\` implements this pattern). Make sure the count can't go negative and that stopping resets the state.
- **Stores and plugins** that create effects at module level should expose a \`dispose()\` backed by a scope — and tests should call it, or they leak watchers between test cases.
- **Libraries already do this.** Pinia, for example, runs each store inside an effect scope — that\'s Pinia\'s implementation detail, but it\'s why \`store.$dispose()\` can stop a store\'s effects.
- **Paused ≠ stopped.** Use \`pause()\` (3.5+) for temporarily hidden UI; it keeps state and subscriptions. Use \`stop()\` when you are done for good.
`,
  },

  mistakes: [
    {
      title: 'Cleaning up a composable with `onUnmounted`',
      wrong: { code: `export function useTicker() {\n  const id = setInterval(tick, 1000)\n  onUnmounted(() => clearInterval(id)) // silently skipped outside components\n}`, lang: 'js' },
      right: { code: `export function useTicker() {\n  const id = setInterval(tick, 1000)\n  onScopeDispose(() => clearInterval(id))\n}`, lang: 'js' },
      explanation: 'Lifecycle hooks need an active component instance. Inside `effectScope().run()` (stores, shared composables, tests) there is none, so Vue only warns and the cleanup never runs. `onScopeDispose` works in both places.',
    },
    {
      title: 'Creating a watcher in a callback and forgetting it',
      wrong: { code: `onMounted(() => {\n  api.loadUser().then((user) => {\n    watch(() => user.prefs, savePrefs, { deep: true }) // never stopped\n  })\n})`, lang: 'js' },
      right: { code: `let stopPrefs\nonMounted(async () => {\n  const user = await api.loadUser()\n  stopPrefs = watch(() => user.prefs, savePrefs, { deep: true })\n})\nonUnmounted(() => stopPrefs?.())`, lang: 'js' },
      explanation: 'When the promise resolves, no scope is active, so the watcher has no owner and outlives the component. Keep the stop handle and call it on unmount (or create the watcher synchronously in setup with a getter that handles "not loaded yet").',
    },
    {
      title: 'Re-running a stopped scope',
      wrong: { code: `const scope = effectScope()\nfunction start() { scope.run(setup) }\nfunction stop() { scope.stop() }\n// start → stop → start: the second run() does nothing (and warns)`, lang: 'js' },
      right: { code: `let scope\nfunction start() { scope = effectScope(); scope.run(setup) }\nfunction stop() { scope?.stop(); scope = undefined }`, lang: 'js' },
      explanation: 'Stopping is final. Create a fresh scope for each start.',
    },
    {
      title: 'Expecting `pause()` to pause timers',
      wrong: { code: `scope.pause() // "the interval is paused now" — no, it is not`, lang: 'js' },
      right: { code: `scope.pause()            // effects (watchers, renders) pause\nclearInterval(id)         // timers and sockets are yours to pause`, lang: 'js' },
      explanation: '`pause()` (3.5+) only affects reactive effects collected by the scope. Non-reactive resources keep running until you stop them yourself.',
    },
  ],

  debugging: [
    {
      symptom: 'Dev console: "onUnmounted is called when there is no active component instance…".',
      cause: 'A lifecycle hook was called outside a component\'s setup — often in a composable used inside `effectScope().run()` or after an `await`.',
      fix: 'Use `onScopeDispose` for cleanup in composables, and register hooks synchronously in setup.',
    },
    {
      symptom: 'A watcher keeps firing (or a timer keeps ticking) after its component is gone.',
      cause: 'It was created in a callback, a promise `.then`, or a detached/standalone scope that nobody stops.',
      fix: 'Keep the stop handle or the scope and stop it on unmount. Count live timers/listeners in development to catch leaks early.',
    },
    {
      symptom: 'Dev console: "cannot run an inactive effect scope".',
      cause: '`run()` was called on a scope that has already been stopped.',
      fix: 'Create a new scope with `effectScope()` for each new lifetime.',
    },
    {
      symptom: 'A shared composable stops working for remaining users when one component unmounts.',
      cause: 'The shared scope is stopped by the first unmount (no reference counting), or it is not detached and got collected by the first component\'s scope.',
      fix: 'Create it with `effectScope(true)` and stop it only when the subscriber count reaches zero.',
    },
  ],

  bestPractices: [
    'In composables, register cleanup with `onScopeDispose`, not `onUnmounted`.',
    'Create watchers synchronously in setup; anything created later needs an explicit owner.',
    'Wrap module-level reactive code (stores, services) in a scope and expose `dispose()`.',
    'Use `effectScope(true)` only when something must outlive its creator, and document who stops it.',
    'Create a new scope for each start/stop cycle — stopped scopes cannot be reused.',
    'Use `pause()`/`resume()` (3.5+) for temporarily hidden UI; remember it doesn\'t pause timers.',
    'Treat `EffectScope` fields and component scope internals as private.',
  ],

  useCases: [
    'Shared composables (one WebSocket, one geolocation watcher) with reference counting.',
    'A "live mode" feature that starts several watchers and timers and stops them together.',
    'Hand-written stores and services that need a `dispose()` method.',
    'Running composables in unit tests and cleaning them up after each test.',
    'Pausing reactive work for off-screen panels or inactive tabs (3.5+).',
  ],

  whenToUse: {
    use: [
      'Reactive code that runs outside components (stores, plugins, services, tests).',
      'Groups of effects whose lifetime differs from any single component.',
      'Composable cleanup — `onScopeDispose` everywhere.',
    ],
    avoid: [
      'Ordinary component code — the component\'s scope already handles it.',
      'Wrapping every composable in its own scope "just in case" — it adds indirection without benefit.',
      'Detached scopes without a clear owner responsible for stopping them.',
    ],
  },

  comparison: {
    title: 'Cleanup tools compared',
    headers: ['', '`onUnmounted`', '`onScopeDispose`', 'stop handle (`const stop = watch()`)', '`effectScope()`'],
    rows: [
      ['Works in a component setup', 'yes', 'yes', 'yes', 'yes'],
      ['Works in a standalone scope', 'no (warns)', 'yes', 'yes', 'yes'],
      ['Stops many effects at once', 'only what you write in it', 'only what you write in it', 'no — one watcher', 'yes — everything collected'],
      ['Cleans non-reactive resources', 'yes (your code)', 'yes (your code)', 'no', 'via `onScopeDispose` inside it'],
      ['Best for', 'component-only code', 'composables', 'one late watcher', 'groups with their own lifetime'],
    ],
    note: 'Lifecycle hooks in general are covered in [Lifecycle hooks & ordering](lesson:lifecycle-hooks); composable design in [Designing & testing composables](lesson:composable-design).',
  },

  quiz: [
    {
      id: 'effect-scope-q1',
      type: 'mcq',
      prompt: 'What does `scope.stop()` do?',
      options: [
        { text: 'Stops collected effects, runs `onScopeDispose` callbacks and stops nested non-detached scopes' },
        { text: 'Deletes every ref created in the scope', why: 'Refs are just objects; they stay usable. What stops are the effects (watchers, computeds) and cleanups run.' },
        { text: 'Pauses the effects until `scope.run()` is called again', why: 'That describes `pause()`/`resume()` (3.5+). A stopped scope cannot be run again.' },
        { text: 'Stops every effect in the app', why: 'Only the effects this scope (and its child scopes) collected.' },
      ],
      answer: 0,
      explanation: 'Stopping is a cascade over what the scope collected: effects, cleanup callbacks and child scopes. Detached scopes are not children, so they keep running.',
    },
    {
      id: 'effect-scope-q2',
      type: 'output',
      prompt: 'The component below unmounts after 1 second. Then `count` changes. Is "changed" logged?',
      code: {
        lang: 'js',
        code: `// inside <script setup>
const count = ref(0)

setTimeout(() => {
  watch(count, () => console.log('changed'))
}, 0)

// …component unmounts, then elsewhere: count.value++`,
      },
      options: [
        { text: 'Yes — the watcher was never stopped' },
        { text: 'No — all watchers stop on unmount', why: 'Only those created synchronously during setup are collected by the component\'s scope.' },
        { text: 'No — watch() throws inside setTimeout', why: 'It works fine; it just has no owner.' },
        { text: 'Only in production builds', why: 'Ownership works the same in development and production.' },
      ],
      answer: 0,
      explanation: 'When the timeout callback runs, no scope is active, so the watcher isn\'t collected. It survives the unmount — a leak.',
    },
    {
      id: 'effect-scope-q3',
      type: 'bug',
      prompt: 'This composable is used by a store via `effectScope().run(() => useClock())`. When the store is disposed, the interval keeps ticking. Click the faulty line.',
      code: {
        lang: 'js',
        code: `import { ref, onUnmounted } from 'vue'

export function useClock() {
  const now = ref(Date.now())
  const id = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  onUnmounted(() => clearInterval(id))
  return { now }
}`,
      },
      answerLine: 8,
      explanation: '`onUnmounted` needs an active component. Inside a standalone scope it only warns, so the cleanup is never registered. Use `onScopeDispose(() => clearInterval(id))`.',
    },
    {
      id: 'effect-scope-q4',
      type: 'fill',
      prompt: 'Fill the blanks to collect a watcher into a scope and stop it later.',
      code: {
        lang: 'js',
        code: `const scope = ___()

scope.___(() => {
  watch(query, search)
})

scope.stop()`,
      },
      answer: [['effectScope'], ['run']],
      explanation: '`effectScope()` creates the scope; effects created synchronously inside `scope.run(fn)` are collected; `scope.stop()` stops them.',
    },
    {
      id: 'effect-scope-q5',
      type: 'mcq',
      prompt: 'Inside `outer.run(…)` you create `const inner = effectScope(true)`. Then you call `outer.stop()`. What happens to `inner`?',
      options: [
        { text: 'It is stopped too', why: 'That is what happens to a normal nested scope — `true` makes it detached.' },
        { text: 'It keeps running; you must stop it yourself' },
        { text: 'It throws an error', why: 'Detached scopes are a supported feature.' },
        { text: 'It is paused until outer runs again', why: 'Stopped scopes never run again, and a detached scope is not affected by its creator anyway.' },
      ],
      answer: 1,
      explanation: 'A detached scope isn\'t registered as a child of the active scope, so it has its own lifetime.',
    },
    {
      id: 'effect-scope-q6',
      type: 'output',
      prompt: 'What do the two logs print?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { getCurrentScope } from 'vue'

console.log('setup:', !!getCurrentScope())

function onClick() {
  console.log('click:', !!getCurrentScope())
}
</script>

<template><button @click="onClick">Go</button></template>`,
      },
      options: [
        { text: 'setup: true · click: false' },
        { text: 'setup: false · click: false', why: 'Vue runs setup() inside the component\'s scope.' },
        { text: 'setup: true · click: true', why: 'Event handlers run later, when no scope is active.' },
        { text: 'setup: false · click: true', why: 'It is the other way round.' },
      ],
      answer: 0,
      explanation: 'Only code running synchronously during setup (or inside `scope.run`) has an active scope.',
    },
    {
      id: 'effect-scope-q7',
      type: 'short',
      prompt: 'Why should composables register cleanup with `onScopeDispose` rather than `onUnmounted`?',
      answer: '`onUnmounted` only works while a component\'s setup is running. `onScopeDispose` attaches cleanup to whatever scope is active — the component\'s own scope inside setup, or a standalone `effectScope()` in a store, shared composable or test. So the composable cleans up correctly wherever it is used.',
    },
  ],

  exercises: [
    {
      id: 'shared-composable',
      title: 'One clock for many widgets',
      difficulty: 'advanced',
      prompt: `
\`useClock()\` starts an interval. Every widget that calls it currently starts **its own** interval. Implement \`createShared(composable)\` in **shared.js** so all widgets share **one** instance while at least one of them is mounted.

- The first caller runs the composable inside a **detached** effect scope and keeps the result.
- Later callers get the same result; count the subscribers.
- When a caller's scope is disposed (\`onScopeDispose\`), decrement; at **zero**, stop the shared scope and forget the state so the next caller starts fresh.
- The app toggles widgets with \`class="toggle-a"\` and \`class="toggle-b"\`; \`class="timers"\` shows **Active intervals: N**.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import Widget from './Widget.vue'
import { timerStats } from './timers.js'

const showA = ref(false)
const showB = ref(false)
</script>

<template>
  <button class="toggle-a" @click="showA = !showA">Toggle A</button>
  <button class="toggle-b" @click="showB = !showB">Toggle B</button>
  <p class="timers">Active intervals: {{ timerStats.active }}</p>
  <Widget v-if="showA" name="A" />
  <Widget v-if="showB" name="B" />
</template>`,
        'Widget.vue': `<script setup>
import { useSharedClock } from './shared.js'

defineProps({ name: String })
const { ticks } = useSharedClock()
</script>

<template>
  <p class="widget">{{ name }}: {{ ticks }} ticks</p>
</template>`,
        'shared.js': `import { effectScope, onScopeDispose } from 'vue'
import { useClock } from './useClock.js'

// TODO: share one instance of the composable between all callers
export function createShared(composable) {
  return (...args) => composable(...args)
}

export const useSharedClock = createShared(useClock)`,
        'useClock.js': `import { ref, onScopeDispose } from 'vue'
import { startInterval } from './timers.js'

export function useClock() {
  const ticks = ref(0)
  const stop = startInterval(() => ticks.value++, 200)
  onScopeDispose(stop)
  return { ticks }
}`,
        'timers.js': timersJs,
      },
      hints: [
        'Keep three variables in the closure: `subscribers`, `state` and `scope`.',
        'On each call: `subscribers++`; if there is no state yet, `scope = effectScope(true)` and `state = scope.run(() => composable(...args))`. Then register `onScopeDispose(release)` in the **caller\'s** scope and return `state`.',
        '`release()` does `subscribers--` and, when it reaches 0, `scope.stop()` and resets `state` and `scope` to `undefined`.',
      ],
      solution: {
        explanation: 'The shared scope is **detached**, so it isn\'t collected by whichever component happened to call first. Each caller registers `release` with its own scope through `onScopeDispose`, so unmounting a widget lowers the count; the last one out stops the shared scope, which runs `useClock`\'s own `onScopeDispose` and clears the interval. This is the pattern behind VueUse\'s `createSharedComposable`.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import Widget from './Widget.vue'
import { timerStats } from './timers.js'

const showA = ref(false)
const showB = ref(false)
</script>

<template>
  <button class="toggle-a" @click="showA = !showA">Toggle A</button>
  <button class="toggle-b" @click="showB = !showB">Toggle B</button>
  <p class="timers">Active intervals: {{ timerStats.active }}</p>
  <Widget v-if="showA" name="A" />
  <Widget v-if="showB" name="B" />
</template>`,
          'Widget.vue': `<script setup>
import { useSharedClock } from './shared.js'

defineProps({ name: String })
const { ticks } = useSharedClock()
</script>

<template>
  <p class="widget">{{ name }}: {{ ticks }} ticks</p>
</template>`,
          'shared.js': `import { effectScope, onScopeDispose } from 'vue'
import { useClock } from './useClock.js'

export function createShared(composable) {
  let subscribers = 0
  let state
  let scope

  function release() {
    subscribers--
    if (subscribers <= 0 && scope) {
      scope.stop()
      scope = undefined
      state = undefined
      subscribers = 0
    }
  }

  return (...args) => {
    subscribers++
    if (!state) {
      scope = effectScope(true) // detached: no caller owns it
      state = scope.run(() => composable(...args))
    }
    onScopeDispose(release) // registered in the CALLER's scope
    return state
  }
}

export const useSharedClock = createShared(useClock)`,
          'useClock.js': `import { ref, onScopeDispose } from 'vue'
import { startInterval } from './timers.js'

export function useClock() {
  const ticks = ref(0)
  const stop = startInterval(() => ticks.value++, 200)
  onScopeDispose(stop)
  return { ticks }
}`,
          'timers.js': timersJs,
        },
      },
      tests: [
        { name: 'no widgets, no intervals', code: `expect(text('.timers')).toBe('Active intervals: 0')` },
        { name: 'two widgets share one interval', code: `await click('.toggle-a'); await click('.toggle-b'); expect(findAll('.widget')).toHaveLength(2); expect(text('.timers')).toBe('Active intervals: 1')` },
        { name: 'it survives while one widget remains', code: `await click('.toggle-a'); await click('.toggle-b'); await click('.toggle-a'); expect(text('.timers')).toBe('Active intervals: 1')` },
        { name: 'the last unmount stops it', code: `await click('.toggle-a'); await click('.toggle-b'); await click('.toggle-a'); await click('.toggle-b'); expect(text('.timers')).toBe('Active intervals: 0')` },
        { name: 'a new user starts fresh', code: `await click('.toggle-a'); await click('.toggle-a'); await click('.toggle-b'); expect(text('.timers')).toBe('Active intervals: 1'); expect(text('.widget')).toContain('B:')` },
      ],
    },
  ],

  interview: [
    {
      id: 'effect-scope-what-why',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is `effectScope()` and what problem does it solve?',
      answer: 'An effect scope collects the reactive effects (watchers, computeds) and `onScopeDispose` cleanups created while it is active, so they can all be stopped with one `scope.stop()`. It solves cleanup for reactive code that lives outside a single component — stores, shared composables, plugins, tests — where nothing would otherwise stop the effects.',
      explanation: 'Components get this for free: Vue runs setup inside a scope and stops it on unmount. `effectScope()` exposes the same mechanism to you.',
      whyAsked: 'Shows whether the candidate thinks about effect lifetimes and leaks, which separates senior from mid-level Vue developers.',
      mistakes: ['Saying it is "for performance".', 'Not knowing components already use a scope.', 'Confusing it with CSS scoping or `<style scoped>`.'],
      followUps: ['What is a detached scope?', 'What happens to effects created after an await?', 'How does a library like Pinia use scopes?'],
      modelAnswer: 'Every watcher or computed keeps running until it is stopped. Inside components Vue handles that: setup runs inside a scope Vue creates and stops on unmount. `effectScope()` gives me the same container for code outside components. I create the scope, call `scope.run()` with my setup code, and every effect created synchronously inside is collected, plus any `onScopeDispose` cleanups like clearing a timer. One `scope.stop()` later tears it all down. I use it for stores, shared composables and tests.',
    },
    {
      id: 'effect-scope-async-leak',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A component\'s memory usage grows each time a user opens and closes it. In setup you find `api.load().then((data) => { watch(() => data.items, sync, { deep: true }) })`. What\'s going on?',
      answer: 'The watcher is created in a promise callback, after setup finished, when no scope is active. It is not collected by the component, so it survives unmount and keeps `data` alive and re-running. Each open adds another. Keep the stop handle and call it on unmount, or create the watcher synchronously with a guard for "not loaded yet".',
      explanation: 'Automatic cleanup only covers effects created synchronously during setup.',
      whyAsked: 'A realistic leak that appears in data-loading code; tests understanding of scope activity.',
      mistakes: ['Blaming the deep option only.', 'Suggesting `onUnmounted` inside the `.then` (no active instance there either).'],
      followUps: ['How would you detect this leak?', 'Would `<script setup>` top-level await change things?'],
      modelAnswer: 'Vue collects effects into the component\'s scope only while setup is running synchronously. This watcher is created inside a `.then` callback, so there\'s no active scope; it\'s never stopped, keeps the loaded data reachable and keeps running after unmount. Every open adds one more. I\'d store the stop handle and call it in onUnmounted, or move the watch into setup with a getter that tolerates missing data. To confirm, I\'d take heap snapshots before and after a few open/close cycles in DevTools.',
    },
    {
      id: 'effect-scope-dispose-vs-unmounted',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 2,
      question: '`onScopeDispose` vs `onUnmounted` — what\'s the difference, and which should a composable use?',
      options: [
        'They are aliases',
        '`onScopeDispose` works in any active effect scope (including components); `onUnmounted` only in a component\'s setup — composables should prefer `onScopeDispose`',
        '`onUnmounted` is newer and replaces `onScopeDispose`',
        '`onScopeDispose` only works outside components',
      ],
      correctOption: 1,
      answer: '`onUnmounted` is a component lifecycle hook and needs an active component instance. `onScopeDispose` registers on the active effect scope, which exists both in a component\'s setup and in any `effectScope().run()`. A composable that uses `onScopeDispose` cleans up correctly in components, stores, shared scopes and tests.',
      explanation: 'In a component, both run on unmount. Outside one, only `onScopeDispose` works.',
      whyAsked: 'Checks composable-authoring maturity.',
      mistakes: ['Saying they are identical.', 'Not knowing `onUnmounted` warns outside components.'],
      followUps: ['What does the 3.5 `failSilently` argument do?', 'When would you still use `onUnmounted`?'],
      modelAnswer: 'onUnmounted is tied to a component instance, so it only works during setup. onScopeDispose attaches cleanup to the current effect scope — inside a component that\'s the component\'s scope, so it also runs on unmount, but it works in a standalone effectScope too. That\'s why composables should use onScopeDispose: they become usable in stores, shared composables and tests. Since 3.5 you can pass failSilently to skip the warning when no scope is active.',
    },
    {
      id: 'effect-scope-shared-composable',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Five components on a page each call `useLiveRates()`, which opens a WebSocket. How would you make them share one connection, and close it when none of them are mounted?',
      answer: 'Wrap the composable in a shared factory: keep a subscriber count, the shared state and a detached effect scope in a closure. The first call creates `effectScope(true)` and runs the composable in it (the composable closes its socket via `onScopeDispose`). Every call increments the count, registers `onScopeDispose(release)` in the caller\'s scope, and returns the shared state. `release` decrements; at zero it stops the shared scope and resets the state.',
      explanation: 'Detached so no single component owns it; reference counted so it lives exactly as long as it is used.',
      whyAsked: 'A practical architecture question about shared resources, lifetimes and cleanup.',
      mistakes: ['Opening the socket at module load and never closing it.', 'Using a non-detached scope that the first component collects.', 'Forgetting to reset state after stopping.'],
      followUps: ['Would Pinia be a better fit?', 'How would you handle SSR, where there are no unmounts?', 'What if components pass different arguments?'],
      modelAnswer: 'I\'d build a createShared wrapper. In its closure: a subscriber count, the shared result and a scope. On the first call I create a detached effectScope and run the composable inside it, so the socket and its watchers belong to that scope, and the composable closes the socket in onScopeDispose. Every call bumps the count, registers a release callback with onScopeDispose in the caller\'s own scope, and returns the shared state. When the count drops to zero I stop the shared scope and reset. If the state needed actions and devtools support I\'d consider a Pinia store instead — and on the server I\'d avoid opening sockets at all.',
    },
    {
      id: 'effect-scope-pause',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 3,
      question: 'A dashboard has heavy widgets in hidden tabs that keep recomputing. A teammate suggests `scope.pause()` (Vue 3.5+). What does it do, and what does it not do?',
      answer: '`pause()` pauses every reactive effect in the scope (and its child scopes): triggered effects are only recorded, then run once on `resume()` with the latest state. It does not stop timers, sockets or fetches, does not free state, and is not cleanup — for that you need `stop()`. It fits hidden-but-alive widgets; you still need to pause polling yourself.',
      explanation: 'Reactive effects pause; everything else is your responsibility.',
      whyAsked: 'Tests knowledge of a newer API and its limits.',
      mistakes: ['Thinking pause stops network polling.', 'Confusing pause with stop.', 'Not mentioning the 3.5 requirement.'],
      followUps: ['How would you pause polling too?', 'How does KeepAlive compare?'],
      modelAnswer: 'Since 3.5, an effect scope can be paused. While paused, its effects — watchers, computeds\' subscribers, render effects collected by it — don\'t run; if they\'re triggered, Vue remembers and runs each once on resume with the current state. It doesn\'t touch timers, sockets or in-flight requests, and it doesn\'t release memory; that\'s what stop and onScopeDispose are for. So for hidden tabs I\'d pause the scope and also pause polling explicitly, then resume both when the tab becomes visible.',
    },
    {
      id: 'effect-scope-coding-store',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: '`createCartStore()` (a plain module, no component) watches the cart and counts saves. Its `dispose()` does nothing, so the watcher leaks. Use an effect scope so `dispose()` stops it.',
      starter: {
        files: {
          'cartStore.js': `import { ref, computed, watch, effectScope } from 'vue'

export function createCartStore() {
  const items = ref([])
  const saves = ref(0)
  const total = computed(() => items.value.reduce((sum, n) => sum + n, 0))

  watch(total, () => {
    saves.value++
  })

  function add(price) {
    items.value.push(price)
  }

  function dispose() {
    // TODO: stop everything this store created
  }

  return { items, saves, total, add, dispose }
}`,
          'App.vue': `<script setup>
import { createCartStore } from './cartStore.js'
const store = createCartStore()
</script>

<template>
  <p class="total">Total: {{ store.total.value }}</p>
  <p class="saves">Saves: {{ store.saves.value }}</p>
  <button class="add" @click="store.add(5)">Add item (5)</button>
</template>`,
        },
      },
      tests: [
        {
          name: 'the store saves when the total changes',
          code: `const { createCartStore } = requireModule('cartStore.js')
const store = createCartStore()
store.add(5)
await nextTick()
expect(store.saves.value).toBe(1)
store.dispose()`,
        },
        {
          name: 'after dispose() the watcher no longer runs',
          code: `const { createCartStore } = requireModule('cartStore.js')
const store = createCartStore()
store.add(5)
await nextTick()
store.dispose()
store.add(5)
await nextTick()
expect(store.saves.value).toBe(1)`,
        },
        { name: 'the app still works', code: `await click('.add'); expect(text('.total')).toBe('Total: 5'); expect(text('.saves')).toBe('Saves: 1')` },
      ],
      hints: [
        'Create `const scope = effectScope()` at the start of `createCartStore()`.',
        'Move the state, computed, watcher and functions into `scope.run(() => { …; return { … } })`.',
        'Return the object from `run()` plus `dispose: () => scope.stop()`.',
      ],
      answer: 'Create the store\'s effects inside `scope.run()` and make `dispose()` call `scope.stop()`.',
      solution: {
        files: {
          'cartStore.js': `import { ref, computed, watch, effectScope } from 'vue'

export function createCartStore() {
  const scope = effectScope()

  const store = scope.run(() => {
    const items = ref([])
    const saves = ref(0)
    const total = computed(() => items.value.reduce((sum, n) => sum + n, 0))

    watch(total, () => {
      saves.value++
    })

    function add(price) {
      items.value.push(price)
    }

    return { items, saves, total, add }
  })

  return { ...store, dispose: () => scope.stop() }
}`,
          'App.vue': `<script setup>
import { createCartStore } from './cartStore.js'
const store = createCartStore()
</script>

<template>
  <p class="total">Total: {{ store.total.value }}</p>
  <p class="saves">Saves: {{ store.saves.value }}</p>
  <button class="add" @click="store.add(5)">Add item (5)</button>
</template>`,
        },
      },
      explanation: 'Everything reactive is created inside `scope.run()`, so the scope collects the watcher; `dispose()` stops it. In the component, the store\'s scope is created during setup, so it is also nested in (and stopped with) the component\'s scope.',
      whyAsked: 'Hand-written stores and services are common; this checks that the candidate can give them a proper lifetime.',
      mistakes: ['Collecting stop handles one by one and missing some.', 'Creating the scope but defining the watcher outside `run()`.', 'Using `onUnmounted` in a non-component module.'],
      followUps: ['Why does the component version stop automatically even without calling dispose()?', 'How would you make this store a singleton?'],
      modelAnswer: 'I create an effect scope at the top of the factory and build the whole store inside `scope.run()`, returning its public API. Every watcher and computed created there is collected, so `dispose()` is just `scope.stop()`. It also composes well: if the factory is called during a component\'s setup, the new scope becomes a child of the component\'s scope and stops on unmount automatically. In tests, calling dispose after each case prevents watchers leaking between tests.',
    },
  ],

  takeaways: [
    'An effect scope collects effects and `onScopeDispose` cleanups created while it is active; `scope.stop()` tears them all down.',
    'Components already run setup in a scope — that\'s why synchronous watchers stop on unmount.',
    'Effects created later (callbacks, timers, promise handlers) have no owner: stop them yourself.',
    'Nested scopes stop with their parent; `effectScope(true)` creates a detached scope you must stop.',
    'Composables should clean up with `onScopeDispose`, which works in components and standalone scopes.',
    '`pause()`/`resume()` (3.5+) pause reactive effects only — timers and sockets keep going.',
    '`EffectScope` internals are private; build on the documented methods.',
  ],
}
