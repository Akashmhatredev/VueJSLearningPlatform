// Lesson: Computed caching, scheduling & flush timing (Level 11 — Advanced Reactivity & Internals)

const flushLab = `<script setup>
import { ref, watch, onMounted, onUpdated } from 'vue'

let nextId = 3
const messages = ref([
  { id: 1, text: 'Hi!' },
  { id: 2, text: 'Anyone here?' },
])
const listEl = ref(null)
const logEl = ref(null)
const domReport = ref('')
let updates = 0

// The log goes straight into the DOM (and the console) on purpose:
// writing reactive state from onUpdated would cause yet another update.
function log(line) {
  console.log(line)
  if (!logEl.value) return
  const li = document.createElement('li')
  li.textContent = line
  logEl.value.appendChild(li)
}

function domCount() {
  return listEl.value ? listEl.value.children.length : 0
}

function report() {
  domReport.value = 'DOM has ' + domCount() + ' messages'
}
onMounted(report)

// Default flush ('pre'): runs BEFORE this component's DOM is updated
watch(() => messages.value.length, (n) => {
  log('pre watcher: state has ' + n + ', DOM has ' + domCount())
  report()
})

// flush: 'sync' runs immediately, on EVERY change — no batching
watch(() => messages.value.length, (n) => {
  log('sync watcher: length is now ' + n)
}, { flush: 'sync' })

onUpdated(() => {
  updates++
  log('onUpdated #' + updates + ': DOM has ' + domCount())
})

function send() {
  log('— click: send one')
  const id = nextId++
  messages.value.push({ id, text: 'Message ' + id })
}

function sendThree() {
  log('— click: send three')
  for (const word of ['One', 'Two', 'Three']) {
    messages.value.push({ id: nextId++, text: word })
  }
}

function clearLog() {
  if (logEl.value) logEl.value.innerHTML = ''
}
</script>

<template>
  <h2>Flush timing lab</h2>
  <ul ref="listEl" class="messages">
    <li v-for="m in messages" :key="m.id">{{ m.text }}</li>
  </ul>
  <p class="dom-count">{{ domReport }}</p>
  <button class="send" @click="send">Send one</button>
  <button class="three" @click="sendThree">Send three</button>
  <button class="clear" @click="clearLog">Clear log</button>
  <h3>Log</h3>
  <ol ref="logEl" class="log"></ol>
</template>`

const computedLab = `<script setup>
import { ref, computed, watchEffect } from 'vue'

const age = ref(30)
let getterRuns = 0
let effectRuns = 0

const isAdult = computed(() => {
  getterRuns++
  console.log('isAdult getter run #' + getterRuns)
  return age.value >= 18
})

// Depends ONLY on isAdult. In Vue 3.4+ it re-runs only when
// isAdult's value actually changes (computed stability).
watchEffect(() => {
  effectRuns++
  console.log('effect run #' + effectRuns + ': isAdult = ' + isAdult.value)
})
</script>

<template>
  <h2>Computed stability (Vue 3.4+)</h2>
  <p>Age: {{ age }}</p>
  <button @click="age++">Birthday (age + 1)</button>
  <button @click="age = 10">Set age to 10</button>
  <button @click="age = 30">Set age to 30</button>
  <p>Open the console. Every birthday re-runs the getter, but the effect
  only runs again when <code>isAdult</code> flips between true and false.</p>
</template>`

export default {
  id: 'scheduling-flush',
  title: 'Computed caching, scheduling & flush timing',
  summary: 'Learn when Vue actually runs your computeds, watchers and renders — lazily, in batches, and in a precise pre / render / post order you can choose.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['dependency-tracking', 'next-tick', 'watch'],
  related: ['computed', 'watch-effect', 'effect-scope', 'debugging-reactivity', 'render-optimization'],
  tags: ['scheduler', 'flush', 'pre', 'post', 'sync', 'nextTick', 'batching', 'computed caching', 'computed stability', 'watchPostEffect', 'watchSyncEffect', 'deep watch'],
  apis: [
    { name: "watch(..., { flush: 'pre' | 'post' | 'sync' })", summary: "Chooses when a watcher callback runs: before the owner component's DOM update (default), after it, or synchronously on every change." },
    { name: 'watchPostEffect()', summary: "Alias of watchEffect with flush: 'post' — runs after Vue has updated the DOM (3.2+)." },
    { name: 'watchSyncEffect()', summary: "Alias of watchEffect with flush: 'sync' — runs synchronously on every reactive change (3.2+)." },
    { name: 'nextTick()', summary: 'Returns a promise that resolves after the pending DOM update flush has finished.' },
    { name: 'computed((previous) => …)', summary: 'Since 3.4 the getter receives its previous value, so it can return the old object when nothing meaningful changed.' },
    { name: 'watch(..., { deep: number })', summary: 'Since 3.5, deep can be a number that limits how many levels a deep watcher traverses.' },
  ],
  docs: [
    { label: 'Vue Guide — Watchers: Callback Flush Timing', url: 'https://vuejs.org/guide/essentials/watchers.html#callback-flush-timing' },
    { label: 'Vue Guide — Computed: Getting the Previous Value (3.4+)', url: 'https://vuejs.org/guide/essentials/computed.html#getting-the-previous-value' },
    { label: 'Vue Guide — Performance: Computed Stability', url: 'https://vuejs.org/guide/best-practices/performance.html#computed-stability' },
    { label: 'API — nextTick()', url: 'https://vuejs.org/api/general.html#nexttick' },
    { label: 'API — watch() options', url: 'https://vuejs.org/api/reactivity-core.html#watch' },
  ],

  intro: `
In the [previous lesson](lesson:dependency-tracking) you saw *who* gets notified when state changes. This lesson is about *when* they actually run.

Vue does not run everything the instant you write to a ref. A **computed** waits until somebody reads it. A **component** waits until the end of the current tick, so ten writes cost one re-render. A **watcher** runs at a moment you can choose: before the DOM update (\`'pre'\`, the default), after it (\`'post'\`), or immediately on every single change (\`'sync'\`).

Knowing this timing is the difference between "my watcher sees the old DOM and I don't know why" and "of course — I need \`flush: 'post'\`".
`,

  why: `
Three practical problems are all about timing:

1. **Wasted work.** If every write re-rendered immediately, a loop that pushes 100 items would render 100 times. Batching and lazy computeds make most of that work disappear.
2. **Reading the DOM at the wrong moment.** A watcher that measures an element, scrolls a list or focuses an input runs, by default, *before* the DOM has been patched. It sees the past.
3. **Unexpected re-runs.** A watcher on a computed that returns a fresh array fires on every refresh, even when the contents are identical. Understanding computed caching and stability fixes it.

The rules are small and precise. Learn them once and a whole category of bugs becomes easy.
`,

  eli15: `
Think of a restaurant kitchen.

When orders come in, the chef doesn't cook each one the second it's shouted. They **collect** all orders that arrived in the same moment, then cook in one go — that's **batching**.

The kitchen also has a strict order of work: first the **prep cooks** (they check ingredients before anything is plated — *pre* watchers), then the **chefs plate the food** (components update the screen), then the **waiters** take photos of the finished plates for the menu (*post* watchers — they need the finished dish).

And there's one panicky assistant who runs to the manager **every single time** anything changes, even mid-sentence — that's a *sync* watcher. Useful occasionally, exhausting if overused.

Finally, the dessert station is lazy in a good way: it only makes a dessert when someone actually **orders** it, and keeps the last one ready if nothing changed — that's a **computed**.
`,

  analogy: {
    title: 'The restaurant kitchen',
    body: `
Orders arrive (state changes). Instead of reacting to each shout, the kitchen batches them into one round of work, done in a fixed order: prep, plate, photograph. A lazy dessert station only cooks on demand and keeps the last dessert if the recipe's ingredients didn't change.
`,
    mapping: [
      ['orders arriving', 'writes to refs / reactive objects'],
      ['collecting orders before cooking', 'batching: effects are queued and run once per tick'],
      ['prep cooks', "watchers with flush: 'pre' (the default) — before the DOM update"],
      ['plating the food', 'component re-renders and DOM patches (parents before children)'],
      ['the photographer', "flush: 'post' watchers, watchPostEffect, onUpdated — after the DOM update"],
      ['the panicky assistant', "flush: 'sync' — runs immediately on every change"],
      ['the lazy dessert station', 'computed: evaluated only when read, cached until a dependency changes'],
    ],
  },

  visual: {
    type: 'dependency-tracker',
    props: { preset: 'chain' },
    title: 'Lazy computed chains',
    caption: 'Change a source value and follow the chain: computeds are only **marked dirty** at first. They re-evaluate when something actually reads them — and if a computed\'s result is unchanged, the things downstream of it stay quiet.',
    alt: 'A live mini reactivity engine showing a chain of computed values that depend on each other. Editing the source value marks the computeds in the chain as dirty; they re-evaluate only when read, and effects downstream of a computed whose value did not change are not re-run.',
    after: 'This visualizer is a **simplified** model built for teaching; the pull-based, cached behaviour it shows is how Vue\'s computeds behave.',
  },

  syntax: [
    `
#### Computed: lazy and cached

A \`computed\` does **nothing** when its dependencies change except remember "I'm out of date" (it is *dirty*). The getter only re-runs when someone reads \`.value\` (the template, a watcher, your code) *and* it is dirty. Read it twice with no change in between and the second read is free.
`,
    {
      code: `const price = ref(10)
let runs = 0
const withTax = computed(() => { runs++; return price.value * 1.2 })

price.value = 20
price.value = 30
console.log(runs)        // 0 — nobody has read it yet

withTax.value
withTax.value
console.log(runs)        // 1 — computed once, then served from cache`,
      lang: 'js',
      title: 'laziness and caching',
    },
    `
#### Computed stability (3.4+)

Since Vue 3.4, a computed only notifies the effects that read it when its **value actually changed** (compared with \`Object.is\`). \`isAdult\` going from \`true\` to \`true\` re-runs the getter, but no component or watcher reading \`isAdult\` re-runs.

The catch: a getter that builds a **new object or array** every time always counts as "changed". In 3.4+ the getter receives its **previous value**, so you can hand the old object back when nothing meaningful changed:
`,
    {
      code: `const openIds = computed((previous) => {
  const next = todos.value.filter((t) => !t.done).map((t) => t.id)
  const same = previous && previous.length === next.length &&
    previous.every((id, i) => id === next[i])
  return same ? previous : next   // same identity → dependents stay quiet
})`,
      lang: 'js',
      title: 'returning the previous value (3.4+)',
    },
    {
      callout: 'version',
      title: 'Version notes',
      text: 'Computed stability and the `previous` getter argument: **Vue 3.4+**. `watchPostEffect` / `watchSyncEffect`: **3.2+**. `watch(…, { once: true })`: **3.4+**. `deep` as a number: **3.5+**. `onWatcherCleanup()`: **3.5+**.',
    },
    `
#### Batching and the scheduler

When you write to state, Vue doesn't run the affected effects right away (except \`'sync'\` watchers). It puts them in a **queue**, skipping any that are already queued, and schedules one **flush** in a microtask. Write ten times in one click handler and the component renders once.

Inside a flush the order is:

1. **pre** jobs — watchers with the default \`flush: 'pre'\`, which run before their owner component's DOM update;
2. **component updates** — sorted so parents update before children;
3. **post** jobs — \`flush: 'post'\` watchers, \`watchPostEffect\`, \`onMounted\`/\`onUpdated\` hooks; the DOM is now up to date.

\`await nextTick()\` resumes after the flush has finished.

#### Choosing a watcher's flush timing
`,
    {
      code: `import { watch, watchEffect, watchPostEffect, watchSyncEffect } from 'vue'

watch(source, cb)                      // 'pre' (default): new state, OLD DOM
watch(source, cb, { flush: 'post' })   // after the DOM update: read/measure the DOM here
watch(source, cb, { flush: 'sync' })   // immediately, once per write: rarely needed

watchEffect(fn, { flush: 'post' })     // same options for watchEffect…
watchPostEffect(fn)                    // …or the aliases (3.2+)
watchSyncEffect(fn)`,
      lang: 'js',
      title: 'flush options',
    },
    `
#### Deep watchers cost what they touch

\`watch(obj, cb, { deep: true })\` — and watching a reactive object directly, which is implicitly deep — **reads every nested property** so all of them become dependencies, and does so again every time it re-runs. On a big tree that's real work, and the callback fires for changes you may not care about. Prefer a getter for exactly what you need: \`watch(() => settings.theme, cb)\`, a list of getters, or (3.5+) a depth limit like \`{ deep: 1 }\`.
`,
    {
      callout: 'warn',
      title: 'Guaranteed behaviour vs implementation detail',
      text: 'Documented and safe to rely on: computeds are cached and lazily re-evaluated; 3.4+ computed stability; updates are batched and asynchronous; `nextTick()` resolves after the DOM update; the meaning of `pre`/`post`/`sync`. **Internal:** the scheduler functions (`queueJob`, `flushJobs`…), job ids and flags, how the queue is sorted, the recursion limit, and the dirty-checking machinery behind computeds (version counters since 3.5). Don\'t write code that depends on the exact order of two unrelated watchers — make the order explicit.',
    },
  ],

  walkthrough: {
    title: 'App.vue (flush timing lab)',
    lang: 'vue',
    code: flushLab,
    intro: 'The whole lab. The log is deliberately written straight into the DOM so that observing the timing doesn\'t change it — keep that trick in mind when you debug renders.',
    steps: [
      { lines: [4, 12], text: 'State: a list of messages (with stable ids for keys), template refs for the `<ul>` and the log, and a plain `let updates` counter. The counter is *not* reactive on purpose — `onUpdated` will change it.' },
      { lines: [14, 22], text: '`log()` writes to the console **and** appends an `<li>` with plain DOM APIs. If it wrote to a ref instead, every log line from `onUpdated` would cause another update: an observer that disturbs what it observes.' },
      { lines: [24, 31], text: '`domCount()` counts the `<li>` elements that are **really in the DOM** right now. `report()` stores that in `domReport` for display; it first runs in `onMounted`, when the list exists.' },
      { lines: [33, 37], text: 'A default watcher (`flush: \'pre\'`). When messages change it runs before this component re-renders — so the state has the new length but the DOM still has the old one. That\'s why "DOM has" lags behind.' },
      { lines: [39, 42], text: 'The same source watched with `flush: \'sync\'`: it runs **inside** each `push()`, before Vue has even queued anything. Batching does not apply to it.' },
      { lines: [44, 47], text: '`onUpdated` is a post-flush hook: it runs after the component\'s DOM patch, so here the DOM count matches the state.' },
      { lines: [55, 60], text: '`sendThree()` pushes three times in one click. Watch the log: the sync watcher runs three times, the pre watcher once, and `onUpdated` once — one batch, one render.' },
      { lines: [69, 72], text: 'The list uses stable ids as keys and the template ref `listEl`, which `domCount()` reads.' },
    ],
  },

  playground: {
    title: 'Flush timing lab',
    objective: 'Click the buttons, read the log, then change the flush timing and prove each change with the log and the DOM.',
    files: { 'App.vue': flushLab },
    expected: `
Two messages, a line reading **DOM has 2 messages**, three buttons and an empty log. Click **Send one**: the log shows the sync watcher, then the pre watcher reporting *"state has 3, DOM has 2"*, then \`onUpdated\` with 3. The status line stubbornly says **DOM has 2 messages** — the pre watcher measured too early.

Switch to the **computed stability** variant to see lazy, stable computeds in action (open the console there).
`,
    experiments: [
      {
        id: 'flush-post',
        task: 'Make the **pre watcher** run *after* the DOM update so the status line is correct: after **Send one** it must read **DOM has 3 messages**.',
        hint: 'Pass a third argument to that `watch()`: `{ flush: \'post\' }`. (`watchPostEffect(report)` would also work.)',
        tests: [
          {
            name: 'the status line matches the DOM after sending',
            code: `await click('.send')
expect(text('.dom-count')).toBe('DOM has 3 messages')
await click('.send')
expect(text('.dom-count')).toBe('DOM has 4 messages')`,
          },
        ],
        explain: '`flush: \'post\'` moves the callback after the component\'s DOM patch, so measurements see the new DOM. Notice the log now shows a **second** `onUpdated`: the post watcher wrote `domReport`, which needs one more render. That\'s normal — just don\'t let a post watcher write to something it also watches.',
      },
      {
        id: 'batching',
        task: 'Clear the log and click **Send three**. Before you look: how many times will the sync watcher run? The pre watcher? `onUpdated`?',
        hint: 'Three writes happen inside one click handler.',
        explain: 'The sync watcher runs **3** times (once per push). The pre watcher runs **once** with the final length, and the component renders **once**. Queued effects are de-duplicated: a job that is already in the queue isn\'t added again.',
      },
      {
        id: 'sync-cost',
        task: 'Remove `{ flush: \'sync\' }` from the sync watcher, then click **Send three** again. It should now log **once** per click.',
        hint: 'Delete the third argument of the second `watch()` call — leave the callback as is.',
        tests: [
          {
            name: 'the former sync watcher runs once for three writes',
            code: `await click('.three')
const runs = logs.filter((line) => line.includes('sync watcher'))
expect(runs.length).toBe(1)
expect(runs[0]).toContain('length is now 5')`,
          },
        ],
        explain: 'With the default flush the callback joins the batch: it runs once, with the final value. A sync watcher inside a loop that writes a thousand times runs a thousand times — that\'s why `\'sync\'` is reserved for rare cases that truly need every intermediate value.',
      },
      {
        id: 'next-tick',
        task: 'Make `send()` **async**: after the push, `await nextTick()` and then `log(\'after nextTick: DOM has \' + domCount())`. Sending should log **after nextTick: DOM has 3**.',
        hint: 'Import `nextTick` from `\'vue\'`, write `async function send()`, and put `await nextTick()` after the `push(...)` line.',
        tests: [
          {
            name: 'after nextTick the DOM is up to date',
            code: `await click('.send')
expect(logs.some((line) => line.includes('after nextTick: DOM has 3'))).toBe(true)`,
          },
        ],
        explain: '`nextTick()` returns a promise for "the current flush is done", so code after `await nextTick()` sees the patched DOM. Use it in event handlers and async functions; use `flush: \'post\'` for watchers.',
      },
    ],
    variants: [
      { id: 'computed-stability', label: 'Computed stability (3.4+)', files: { 'App.vue': computedLab } },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'One write, one flush',
    caption: 'What happens between `count.value++` and `await nextTick()` resolving.',
    alt: 'A stepped diagram. A state write immediately runs sync watchers, and queues all other effects in a job queue. A microtask later the flush runs pre watchers, then component updates from parent to child, then post callbacks such as post watchers and onUpdated, and finally nextTick resolves.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'write', label: 'State write', note: 'count.value++', x: 80, y: 130, tone: 'kraft' },
        { id: 'sync', label: 'sync watchers', note: 'right now, every write', x: 80, y: 260, tone: 'red' },
        { id: 'queue', label: 'Job queue', note: 'deduplicated', x: 230, y: 130, tone: 'paper' },
        { id: 'pre', label: 'pre jobs', note: "flush: 'pre' (default)", x: 380, y: 130, tone: 'cobalt' },
        { id: 'render', label: 'Component updates', note: 'parent → child', x: 530, y: 130, tone: 'acid' },
        { id: 'post', label: 'post jobs', note: "flush: 'post', onUpdated", x: 680, y: 130, tone: 'cobalt' },
        { id: 'tick', label: 'nextTick() resolves', note: 'DOM is current', x: 680, y: 260, tone: 'ink' },
      ],
      edges: [
        { from: 'write', to: 'sync', label: 'immediately' },
        { from: 'write', to: 'queue', label: 'queue' },
        { from: 'queue', to: 'pre', label: 'microtask' },
        { from: 'pre', to: 'render' },
        { from: 'render', to: 'post' },
        { from: 'post', to: 'tick' },
      ],
      steps: [
        { focus: ['write'], text: '`count.value++` triggers every effect that depends on `count`.' },
        { focus: ['write', 'sync'], edges: ['write->sync'], text: 'Watchers with `flush: \'sync\'` run **immediately**, inside the write — once for every write, with no batching.' },
        { focus: ['queue'], edges: ['write->queue'], text: 'Everything else is **queued**. Writing again before the flush doesn\'t add duplicates. Vue schedules a single flush in a microtask.' },
        { focus: ['pre'], edges: ['queue->pre'], text: 'The flush begins with **pre** jobs: default watchers. They see the new state, but their component\'s DOM hasn\'t been patched yet.' },
        { focus: ['render'], edges: ['pre->render'], text: '**Component updates** run, sorted so parents go before children. Each renders a new virtual tree and patches the real DOM.' },
        { focus: ['post'], edges: ['render->post'], text: '**Post** jobs: `flush: \'post\'` watchers, `watchPostEffect`, `onMounted`/`onUpdated`. The DOM is up to date — measure, scroll and focus here.' },
        { focus: ['tick'], edges: ['post->tick'], text: 'The flush is finished and `await nextTick()` continues. If a post job changed state, Vue flushes again before `nextTick` resolves.' },
      ],
    },
  },

  internals: {
    beginner: `
Vue keeps a to-do list of "things that need to re-run". Changing state adds items to the list (never the same item twice), and a moment later Vue works through the whole list in a fixed order: prep work, then screen updates, then anything that needs the finished screen.

Computeds aren't on that list at all. They just get a sticky note saying "out of date", and they recalculate the next time someone asks for their value.
`,
    technical: [
      `
**Push, then pull.** When a dependency changes, notifications are *pushed* through the graph: effects are scheduled and computeds are flagged dirty. Values are *pulled*: a dirty computed re-evaluates only when read. If a computed has no readers left, it does no work at all. Since 3.4, when a computed re-evaluates to the same value (\`Object.is\`), it doesn't count as a change, so effects that only read it are skipped.

**The scheduler.** A component's render effect doesn't run when notified; its scheduler queues an update job. Watchers queue a job too, flagged as *pre* (default) or pushed into the *post* list, while \`'sync'\` watchers run inline. A flush is scheduled with a resolved promise, so it runs in a microtask — after your current synchronous code, before the browser paints. Jobs are ordered by component creation order, which puts parents before children; a parent update can therefore update a child's props before that child's own job would have run, and the child's now-redundant job is skipped.

**nextTick.** \`nextTick()\` returns (a promise chained onto) the promise of the current flush. If no flush is pending, it resolves on the next microtask.
`,
      {
        code: `// A SIMPLIFIED model of the queue — not Vue's source
const queue = new Set()
let flushing = false

function queueJob(job) {
  queue.add(job)                    // a Set ignores duplicates: batching for free
  if (!flushing) {
    flushing = true
    Promise.resolve().then(flush)   // one flush per tick, in a microtask
  }
}

function flush() {
  const jobs = [...queue].sort((a, b) => a.order - b.order) // parents first
  queue.clear()
  jobs.forEach((job) => job())
  flushing = false
}`,
        lang: 'js',
        title: 'mental model of batching',
      },
      {
        callout: 'warn',
        title: 'Implementation details — may change',
        text: 'Real Vue uses an array queue with job ids and flag bits (`PRE`, `ALLOW_RECURSE`…), binary-search insertion, separate pre/post lists, a recursion guard that warns "Maximum recursive updates exceeded" in development, and (since 3.5) version counters for cheap dirty checks. These names and mechanisms have changed across 3.x releases.',
      },
    ],
    production: `
- **Default to the default.** \`'pre'\` is right for most watchers: it batches and runs before rendering, so state you set in the callback lands in the same render.
- **Use \`'post'\` exactly when you touch the DOM** — measuring, scrolling, focusing, third-party widgets that read the DOM. In event handlers, \`await nextTick()\` plays the same role.
- **Treat \`'sync'\` as a code smell** unless you can say why you need every intermediate value. It defeats batching and can run thousands of times in a loop.
- **Keep computeds pure.** They can run zero times (nobody reads them) or many times; side effects inside them happen unpredictably. Put side effects in watchers.
- **Make computed outputs stable.** Return primitives where you can; in 3.4+, return the \`previous\` object when nothing meaningful changed; or watch a cheap key (\`() => ids.value.join(',')\`).
- **Narrow deep watchers.** Watch the specific getter you care about; use \`deep: <number>\` (3.5+) to cap traversal; for big replace-only data, \`shallowRef\` + replacing the value is often better.
`,
  },

  mistakes: [
    {
      title: 'Measuring the DOM in a default watcher',
      wrong: { code: `watch(messages, () => {\n  // runs BEFORE the DOM update: lastElementChild is the old last message\n  listEl.value.lastElementChild.scrollIntoView()\n}, { deep: true })`, lang: 'js' },
      right: { code: `watch(messages, () => {\n  listEl.value.lastElementChild.scrollIntoView()\n}, { deep: true, flush: 'post' })`, lang: 'js' },
      explanation: 'Default watchers run in the pre phase. Anything that reads layout, children or element sizes belongs in `flush: \'post\'` (or after `await nextTick()`).',
    },
    {
      title: 'Using `flush: \'sync\'` "to be safe"',
      wrong: { code: `watch(() => cart.items.length, saveCart, { flush: 'sync' })\n\nfor (const item of imported) cart.items.push(item) // saveCart runs per item`, lang: 'js' },
      right: { code: `watch(() => cart.items.length, saveCart) // default: once per flush`, lang: 'js' },
      explanation: 'Sync watchers skip batching entirely. Importing 500 items calls `saveCart` 500 times. The default flush calls it once, with the final state.',
    },
    {
      title: 'Watching a computed that rebuilds its array every time',
      wrong: { code: `const openIds = computed(() => todos.value.filter((t) => !t.done).map((t) => t.id))\nwatch(openIds, saveSelection) // fires on every refresh, even with identical ids`, lang: 'js' },
      right: { code: `const openIds = computed((prev) => {\n  const next = todos.value.filter((t) => !t.done).map((t) => t.id)\n  return prev && prev.join() === next.join() ? prev : next   // 3.4+\n})\nwatch(openIds, saveSelection)`, lang: 'js' },
      explanation: 'A new array is never `Object.is`-equal to the old one, so the computed always "changes". Returning the previous value (3.4+) — or watching a primitive key — makes it stable.',
    },
    {
      title: 'Side effects inside a computed',
      wrong: { code: `const results = computed(() => {\n  analytics.track('search', query.value) // runs only if someone reads results…\n  return items.value.filter((i) => i.name.includes(query.value))\n})`, lang: 'js' },
      right: { code: `const results = computed(() => items.value.filter((i) => i.name.includes(query.value)))\nwatch(query, (q) => analytics.track('search', q))`, lang: 'js' },
      explanation: 'Computeds are lazy and cached: the getter may run zero times (no reader), once for many changes, or again for each read after a change. Side effects belong in watchers, where timing is explicit.',
    },
    {
      title: 'A deep watcher over a huge object',
      wrong: { code: `watch(spreadsheet, recalcTotals, { deep: true }) // traverses every cell, every time`, lang: 'js' },
      right: { code: `watch(() => spreadsheet.version, recalcTotals)  // bump a counter on edits\n// or (3.5+): watch(spreadsheet, recalcTotals, { deep: 1 })`, lang: 'js' },
      explanation: 'Deep watching makes every nested property a dependency and re-traverses on each run. Watch the specific signal you care about.',
    },
  ],

  debugging: [
    {
      symptom: 'A watcher reads element sizes, children or scroll positions and gets the previous values.',
      cause: 'It runs with the default `flush: \'pre\'`, before the component\'s DOM update.',
      fix: "Use `{ flush: 'post' }` or `watchPostEffect`. In an event handler, `await nextTick()` before reading the DOM.",
    },
    {
      symptom: 'A `console.log` inside a computed never prints.',
      cause: 'Nothing reads the computed, so it never evaluates. Computeds are lazy.',
      fix: 'This is expected. If you need code to run on a change, use `watch`/`watchEffect` instead of relying on a computed being read.',
    },
    {
      symptom: 'A watcher fires on every data refresh even though nothing visible changed.',
      cause: 'Its source is a computed (or getter) that returns a fresh object/array every time.',
      fix: 'Return the previous value when equal (3.4+ `computed((prev) => …)`), watch a primitive key, or compare inside the callback.',
    },
    {
      symptom: 'Dev console: "Maximum recursive updates exceeded".',
      cause: 'A watcher or `onUpdated` hook writes state that re-triggers itself (directly or through a render) in an endless cycle.',
      fix: 'Break the cycle: derive with `computed` instead of syncing with a watcher, guard the write (`if (a !== b)`), or move the write out of `onUpdated`.',
    },
    {
      symptom: 'The UI hangs briefly when importing or editing many items at once.',
      cause: 'A `flush: \'sync\'` or deep watcher runs per mutation or traverses a large tree on each run.',
      fix: 'Use the default flush, narrow the watch source, cap depth with `deep: <number>` (3.5+), and measure with the Performance panel (see [measuring performance](lesson:measuring-performance)).',
    },
  ],

  bestPractices: [
    "Leave watchers on the default `flush: 'pre'` unless they touch the DOM.",
    "Use `flush: 'post'` / `watchPostEffect` for DOM reads; `await nextTick()` in handlers.",
    "Use `flush: 'sync'` only when every intermediate value matters, and say why in a comment.",
    'Keep computed getters pure and cheap to re-run; put side effects in watchers.',
    'Return primitives or stable objects from computeds; use the 3.4+ `previous` argument when needed.',
    'Watch narrow getters instead of deep-watching big objects.',
    'Never depend on the relative order of two unrelated watchers — make the sequence explicit.',
  ],

  useCases: [
    "Auto-scrolling a chat to the newest message (`flush: 'post'`).",
    'Focusing an input that just appeared with `v-if` (`await nextTick()` or a post watcher).',
    'Syncing state to a server once per batch of edits (default flush).',
    'Skipping redundant saves when a polled API returns identical data (stable computed).',
    'Keeping a third-party chart in sync with data after Vue updates the container (post).',
  ],

  whenToUse: {
    use: [
      "`'pre'` (default): deriving more state, saving, fetching — anything that doesn't read the DOM.",
      "`'post'`: reading or measuring the updated DOM, scrolling, focusing, driving DOM-based libraries.",
      "`'sync'`: rare cases needing every intermediate value, e.g. an undo stack recording each individual mutation.",
    ],
    avoid: [
      "`'sync'` for performance or \"to be safe\" — it removes batching.",
      'Computeds with side effects or async work — use a watcher.',
      'Deep watchers on large or frequently mutated trees when a narrow getter would do.',
    ],
  },

  comparison: {
    title: 'The three flush modes',
    headers: ['', "`'pre'` (default)", "`'post'`", "`'sync'`"],
    rows: [
      ['When it runs', "before the owner component's DOM update", 'after the DOM update', 'immediately, inside the write'],
      ['DOM it sees', 'old', 'updated', 'old'],
      ['Batched?', 'yes — once per flush', 'yes — once per flush', 'no — once per write'],
      ['Shortcut for effects', '`watchEffect(fn)`', '`watchPostEffect(fn)` (3.2+)', '`watchSyncEffect(fn)` (3.2+)'],
      ['Typical use', 'derive/save/fetch', 'measure, scroll, focus', 'record every intermediate value'],
      ['Main risk', 'stale DOM reads', 'an extra render if it writes state', 'runs N times in loops'],
    ],
    note: "`nextTick()` is the imperative cousin of `'post'`: it waits for the current flush to finish. See [Batched updates & nextTick()](lesson:next-tick) for the basics.",
  },

  quiz: [
    {
      id: 'scheduling-flush-q1',
      type: 'mcq',
      prompt: 'With no options, when does a `watch()` callback created in a component run?',
      options: [
        { text: "Immediately, inside the write", why: "That's `flush: 'sync'`." },
        { text: "Before the owner component's DOM update, in the same flush" },
        { text: 'After the DOM has been updated', why: "That's `flush: 'post'`." },
        { text: 'On the next animation frame', why: 'Vue flushes in a microtask, not on animation frames.' },
      ],
      answer: 1,
      explanation: "The default is `flush: 'pre'`: batched, and run before the component re-renders. State it changes is included in the upcoming render.",
    },
    {
      id: 'scheduling-flush-q2',
      type: 'output',
      prompt: 'In what order are the lines logged?',
      code: {
        lang: 'js',
        code: `const n = ref(0)
watch(n, () => console.log('pre'))
watch(n, () => console.log('post'), { flush: 'post' })
watch(n, () => console.log('sync'), { flush: 'sync' })

n.value++
console.log('after write')`,
      },
      options: [
        { text: 'sync, after write, pre, post' },
        { text: 'after write, sync, pre, post', why: 'A sync watcher runs inside the write, before the next line of your code.' },
        { text: 'sync, pre, post, after write', why: 'Pre and post watchers are queued and run in a microtask, after the current synchronous code.' },
        { text: 'pre, sync, after write, post', why: 'Nothing queued runs before the synchronous code finishes.' },
      ],
      answer: 0,
      explanation: 'The sync watcher fires during `n.value++`. Then the synchronous code continues. In the microtask flush, pre jobs run before post jobs.',
    },
    {
      id: 'scheduling-flush-q3',
      type: 'output',
      prompt: 'What do the two `console.log` calls print?',
      code: {
        lang: 'js',
        code: `const a = ref(1)
let runs = 0
const double = computed(() => { runs++; return a.value * 2 })

a.value = 2
a.value = 3
console.log(runs)

double.value
double.value
console.log(runs)`,
      },
      options: [
        { text: '0 then 1' },
        { text: '2 then 4', why: 'A computed doesn\'t re-run when its dependencies change — only when read while dirty.' },
        { text: '1 then 2', why: 'Creating a computed doesn\'t evaluate it; the first read does.' },
        { text: '0 then 2', why: 'The second read hits the cache: nothing changed between the two reads.' },
      ],
      answer: 0,
      explanation: 'Computeds are lazy (no read → no run) and cached (two reads with no change in between → one run).',
    },
    {
      id: 'scheduling-flush-q4',
      type: 'bug',
      prompt: 'This should scroll to the newest message, but it always scrolls to the one before. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `const messages = ref([])
const listEl = ref(null)

watch(
  () => messages.value.length,
  () => {
    listEl.value.lastElementChild?.scrollIntoView()
  },
  { flush: 'sync' }
)`,
      },
      answerLine: 9,
      explanation: "A sync watcher runs during the push — the new `<li>` isn't in the DOM yet. Use `{ flush: 'post' }` so it runs after the DOM update.",
    },
    {
      id: 'scheduling-flush-q5',
      type: 'fill',
      prompt: 'Fill the blanks so both effects run **after** Vue has updated the DOM.',
      code: {
        lang: 'js',
        code: `watch(items, scrollToEnd, { flush: '___' })

___(() => {
  console.log('rows in DOM:', listEl.value.children.length)
})`,
      },
      answer: [['post'], ['watchPostEffect']],
      explanation: "`flush: 'post'` for `watch`, and `watchPostEffect` (3.2+) — an alias for `watchEffect(fn, { flush: 'post' })`.",
    },
    {
      id: 'scheduling-flush-q6',
      type: 'mcq',
      prompt: 'Vue 3.4+. A component only reads `isAdult = computed(() => age.value >= 18)`. `age` changes from 30 to 31. What happens?',
      options: [
        { text: 'The component re-renders because `age` changed', why: "The component doesn't read `age`; it reads `isAdult`, whose value didn't change." },
        { text: 'The getter re-runs when read, returns `true` again, and the component does not re-render' },
        { text: "Nothing at all: the getter doesn't re-run", why: 'The computed is marked dirty, so the getter does re-run when its value is needed — it just produces the same result.' },
        { text: 'The component re-renders twice', why: 'Updates are batched, and here none is needed at all.' },
      ],
      answer: 1,
      explanation: 'Computed stability (3.4+): dependents are only triggered when the computed\'s value changes by `Object.is`. Before 3.4, effects reading the computed would re-run anyway.',
    },
    {
      id: 'scheduling-flush-q7',
      type: 'short',
      prompt: "When is `flush: 'sync'` appropriate, and what does it cost?",
      answer: "Only when you genuinely need to react to every individual mutation at the moment it happens — for example, recording each change for an undo history, or keeping an external non-Vue system exactly in step. The cost: it bypasses batching, so it runs once per write (N times in a loop of N writes), always sees the old DOM, and can make bulk operations slow.",
    },
  ],

  exercises: [
    {
      id: 'stable-computed',
      title: 'Stop saving identical data',
      difficulty: 'advanced',
      prompt: `
A "refresh" replaces \`todos\` with fresh objects containing **the same data** (like a polling API would). The watcher on \`openIds\` then "saves" again, even though the open ids didn't change.

Make \`openIds\` **stable** so the watcher only fires when the ids really change.

- \`.open\` shows the open ids, e.g. **Open: 1, 3**.
- \`.saves\` shows how many saves happened, e.g. **Saves: 0**.
- **Refresh** (\`class="refresh"\`) with identical data must **not** save.
- **Toggle** (\`class="toggle"\`) flips "Walk the dog" and must save once.
- Keep the watcher as \`watch(openIds, …)\`.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed, watch } from 'vue'

function makeTodos() {
  return [
    { id: 1, text: 'Buy milk', done: false },
    { id: 2, text: 'Walk the dog', done: true },
    { id: 3, text: 'Write code', done: false },
  ]
}

const todos = ref(makeTodos())
const saves = ref(0)

// The ids of the todos that are still open
const openIds = computed(() => todos.value.filter((t) => !t.done).map((t) => t.id))

// Pretend this sends the open ids to a server
watch(openIds, () => {
  saves.value++
})

// A poll: the server returns the same data as fresh objects
function refresh() {
  todos.value = makeTodos()
}

function toggleDog() {
  const dog = todos.value.find((t) => t.id === 2)
  dog.done = !dog.done
}
</script>

<template>
  <p class="open">Open: {{ openIds.join(', ') }}</p>
  <p class="saves">Saves: {{ saves }}</p>
  <button class="refresh" @click="refresh">Refresh from server</button>
  <button class="toggle" @click="toggleDog">Toggle "Walk the dog"</button>
</template>`,
      },
      hints: [
        'The ids are equal after a refresh, but the computed returns a **new array** — and a new array is never `Object.is`-equal to the old one.',
        'Since Vue 3.4 the getter receives its previous value: `computed((previous) => { … })`.',
        'Build `next`, then `return previous && previous.length === next.length && previous.every((id, i) => id === next[i]) ? previous : next`.',
      ],
      solution: {
        explanation: 'Returning the **same array instance** when the ids are equal means the computed\'s value hasn\'t changed by `Object.is`. With 3.4+ computed stability, the watcher isn\'t triggered at all. An alternative that works on any Vue 3 version is to watch a primitive key — `watch(() => openIds.value.join(\',\'), …)` — because strings compare by value.',
        files: {
          'App.vue': `<script setup>
import { ref, computed, watch } from 'vue'

function makeTodos() {
  return [
    { id: 1, text: 'Buy milk', done: false },
    { id: 2, text: 'Walk the dog', done: true },
    { id: 3, text: 'Write code', done: false },
  ]
}

const todos = ref(makeTodos())
const saves = ref(0)

// Stable: hand back the previous array when the ids are the same (Vue 3.4+)
const openIds = computed((previous) => {
  const next = todos.value.filter((t) => !t.done).map((t) => t.id)
  const same =
    previous &&
    previous.length === next.length &&
    previous.every((id, i) => id === next[i])
  return same ? previous : next
})

watch(openIds, () => {
  saves.value++
})

function refresh() {
  todos.value = makeTodos()
}

function toggleDog() {
  const dog = todos.value.find((t) => t.id === 2)
  dog.done = !dog.done
}
</script>

<template>
  <p class="open">Open: {{ openIds.join(', ') }}</p>
  <p class="saves">Saves: {{ saves }}</p>
  <button class="refresh" @click="refresh">Refresh from server</button>
  <button class="toggle" @click="toggleDog">Toggle "Walk the dog"</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts with 1, 3 open and no saves', code: `expect(text('.open')).toBe('Open: 1, 3'); expect(text('.saves')).toBe('Saves: 0')` },
        { name: 'a refresh with identical data does not save', code: `await click('.refresh'); await click('.refresh'); expect(text('.saves')).toBe('Saves: 0')` },
        { name: 'toggling saves once', code: `await click('.toggle'); expect(text('.open')).toBe('Open: 1, 2, 3'); expect(text('.saves')).toBe('Saves: 1')` },
        { name: 'toggle then refresh (a real change back) saves twice', code: `await click('.toggle'); await click('.refresh'); expect(text('.open')).toBe('Open: 1, 3'); expect(text('.saves')).toBe('Saves: 2')` },
      ],
    },
    {
      id: 'narrow-deep-watch',
      title: 'Replace a deep watcher with a targeted one',
      difficulty: 'intermediate',
      prompt: `
Settings are saved by a **deep** watcher, so opening a file (which only adds to \`recentFiles\`) triggers a save too.

Change the watching so a save happens only when **theme** or **fontSize** changes.

- \`.saves\` shows **Saves: N**.
- \`class="open-file"\` adds a recent file — must **not** save.
- \`class="theme"\` toggles light/dark — saves once.
- \`class="font"\` increases the font size — saves once.
- \`class="reset"\` sets theme **and** font size in one click — saves **once** (batching).
`,
      files: {
        'App.vue': `<script setup>
import { reactive, ref, watch } from 'vue'

const settings = reactive({
  theme: 'light',
  fontSize: 16,
  recentFiles: ['notes.txt'],
})
const saves = ref(0)

// Saves on ANY change, however deep — including recentFiles
watch(settings, () => {
  saves.value++
}, { deep: true })

function openFile() {
  settings.recentFiles.push('file-' + settings.recentFiles.length + '.txt')
}
function toggleTheme() {
  settings.theme = settings.theme === 'light' ? 'dark' : 'light'
}
function biggerFont() {
  settings.fontSize++
}
function reset() {
  settings.theme = 'dark'
  settings.fontSize = 20
}
</script>

<template>
  <p>Theme: {{ settings.theme }} · Font: {{ settings.fontSize }}px · Recent: {{ settings.recentFiles.length }}</p>
  <p class="saves">Saves: {{ saves }}</p>
  <button class="open-file" @click="openFile">Open a file</button>
  <button class="theme" @click="toggleTheme">Toggle theme</button>
  <button class="font" @click="biggerFont">Bigger font</button>
  <button class="reset" @click="reset">Reset to dark/20</button>
</template>`,
      },
      hints: [
        'Watching a reactive object (with or without `deep: true`) makes every nested property a dependency — including `recentFiles`.',
        '`watch()` accepts getters and arrays of getters as sources.',
        'Use `watch([() => settings.theme, () => settings.fontSize], () => { saves.value++ })` and drop `deep`.',
      ],
      solution: {
        explanation: 'Each getter reads exactly one property, so the watcher depends on `theme` and `fontSize` only. `recentFiles` changes no longer reach it, and nothing has to traverse the whole object on every run. `reset()` changes both values in one handler, but the watcher is batched (default `pre` flush), so it saves once.',
        files: {
          'App.vue': `<script setup>
import { reactive, ref, watch } from 'vue'

const settings = reactive({
  theme: 'light',
  fontSize: 16,
  recentFiles: ['notes.txt'],
})
const saves = ref(0)

// Only the two settings we persist are dependencies
watch([() => settings.theme, () => settings.fontSize], () => {
  saves.value++
})

function openFile() {
  settings.recentFiles.push('file-' + settings.recentFiles.length + '.txt')
}
function toggleTheme() {
  settings.theme = settings.theme === 'light' ? 'dark' : 'light'
}
function biggerFont() {
  settings.fontSize++
}
function reset() {
  settings.theme = 'dark'
  settings.fontSize = 20
}
</script>

<template>
  <p>Theme: {{ settings.theme }} · Font: {{ settings.fontSize }}px · Recent: {{ settings.recentFiles.length }}</p>
  <p class="saves">Saves: {{ saves }}</p>
  <button class="open-file" @click="openFile">Open a file</button>
  <button class="theme" @click="toggleTheme">Toggle theme</button>
  <button class="font" @click="biggerFont">Bigger font</button>
  <button class="reset" @click="reset">Reset to dark/20</button>
</template>`,
        },
      },
      tests: [
        { name: 'opening files does not save', code: `await click('.open-file'); await click('.open-file'); expect(text('.saves')).toBe('Saves: 0')` },
        { name: 'toggling the theme saves once', code: `await click('.theme'); expect(text('.saves')).toBe('Saves: 1')` },
        { name: 'a bigger font saves once', code: `await click('.font'); expect(text('.saves')).toBe('Saves: 1')` },
        { name: 'reset changes two values but saves once', code: `await click('.reset'); expect(text('.saves')).toBe('Saves: 1')` },
      ],
    },
  ],

  interview: [
    {
      id: 'scheduling-flush-pre-post-sync',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: "Compare `flush: 'pre'`, `'post'` and `'sync'` for watchers. When would you use each?",
      answer: "`'pre'` (default) runs batched, before the owner component's DOM update — right for deriving state, saving or fetching. `'post'` runs batched, after the DOM update — use it to read, measure or manipulate the DOM (alias `watchPostEffect`). `'sync'` runs immediately inside every write, unbatched — only when every intermediate value matters (alias `watchSyncEffect`).",
      explanation: 'The same watcher can see different DOM states and run a different number of times depending on its flush.',
      whyAsked: 'Timing bugs are common in real apps; this checks whether the candidate understands the scheduler, not just the watch API.',
      mistakes: ["Thinking 'pre' means \"before the state change\".", "Using 'sync' as a performance optimisation.", 'Not mentioning batching.'],
      followUps: ['How does `nextTick()` relate to `flush: \'post\'`?', "What happens if a 'post' watcher writes state?"],
      modelAnswer: "All three decide when the callback runs relative to rendering. The default, 'pre', is batched and runs before the owning component re-renders, so it sees new state but the old DOM — ideal for saving or deriving data. 'post' is also batched but runs after the DOM patch, so I use it, or watchPostEffect, when I need to measure, scroll or focus. 'sync' fires inside every single write, without batching; I'd only use it when I really need each intermediate value, like an undo log, because a loop of a thousand writes means a thousand callbacks.",
    },
    {
      id: 'scheduling-flush-batching-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'A click handler runs `count.value++` three times. The template shows `{{ count }}` and the component has an `onUpdated` hook that logs. How many times does it log?',
      code: {
        lang: 'js',
        code: `const count = ref(0)
onUpdated(() => console.log('updated'))

function onClick() {
  count.value++
  count.value++
  count.value++
}`,
      },
      options: ['0', '1', '3', 'It depends on the browser'],
      correctOption: 1,
      answer: 'Once. The three writes queue the same update job, which is de-duplicated; the component renders once in the next microtask with `count` = 3.',
      explanation: 'Batching: Vue collects effects during the current synchronous code and flushes them together.',
      whyAsked: 'A quick check that the candidate knows updates are asynchronous and batched.',
      mistakes: ['Answering 3.', "Thinking the DOM shows intermediate values 1 and 2."],
      followUps: ['How would you read the updated DOM inside `onClick`?', 'What would a sync watcher on `count` log?'],
      modelAnswer: "It logs once. Each write triggers the component's render effect, but its scheduler just queues an update job, and a job that's already queued isn't added again. The flush happens in a microtask after the handler finishes, so the component renders a single time with the final value, 3. If I needed the DOM inside the handler, I'd `await nextTick()` after the writes.",
    },
    {
      id: 'scheduling-flush-computed-lazy',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'When does a computed\'s getter actually run? What happens to a computed nobody reads?',
      answer: 'A computed is lazy: when a dependency changes it is only marked dirty and notifies its own readers. The getter runs when `.value` is read while dirty; repeated reads without changes return the cached value. A computed nobody reads never runs its getter at all.',
      explanation: 'Push notifications, pull evaluation. This makes unused derived data free.',
      whyAsked: 'Distinguishes computed from "a function called on every render" and probes understanding of caching.',
      mistakes: ['Saying computeds re-run immediately when dependencies change.', 'Putting side effects in a computed and expecting them to run.'],
      followUps: ['What changed for computeds in 3.4?', 'Why must computed getters be side-effect free?'],
      modelAnswer: "A computed doesn't run when its dependencies change — it's marked dirty and passes the notification on. The getter only runs when something reads `.value` and the computed is dirty; otherwise the cached value is returned. So a computed that nothing reads costs nothing, and ten reads after one change cost one evaluation. That laziness is also why getters must be pure: whether, and how often, they run depends on who reads them.",
    },
    {
      id: 'scheduling-flush-stability',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A dashboard polls an API every 5 seconds. Each response has identical data, yet a watcher on `visibleIds = computed(() => rows.value.filter(…).map(r => r.id))` fires every poll and a child component re-renders. Explain and fix.',
      answer: 'Each poll replaces `rows`, so the computed re-evaluates and builds a new array. A new array is never `Object.is`-equal to the old one, so 3.4+ computed stability can\'t help: the value "changed", dependents are triggered, and the watcher and the child (receiving a new array prop) run. Fix: return the previous array when the ids are equal (3.4+ `computed((prev) => …)`), watch a primitive key such as `ids.join(\',\')`, or avoid replacing `rows` when the payload is unchanged.',
      explanation: 'Stability works on identity for objects. Producing the same contents in a new container is still a change.',
      whyAsked: 'Polling and refetching are everywhere; this tests practical understanding of computed stability and prop identity.',
      mistakes: ['Suggesting `deep: true`, which makes it worse.', 'Blaming the watcher instead of the source of new identities.', 'Not knowing 3.4 changed computed behaviour.'],
      followUps: ['How would you also avoid replacing `rows` when nothing changed?', 'How would you confirm which dependency triggers the child render?'],
      modelAnswer: "Every poll assigns a new rows array, so the computed re-runs and returns a brand-new ids array. Since Vue 3.4 a computed only triggers dependents if its value changed by Object.is, but a new array always counts as changed — so the watcher fires and the child gets a new prop. I'd make the computed stable by returning the previous array when the ids are equal, using the previous-value argument added in 3.4, or watch a primitive key like the joined ids. Upstream, I'd skip assigning rows when the payload hasn't changed. I'd confirm the fix by counting renders with onRenderTriggered in development.",
    },
    {
      id: 'scheduling-flush-stale-dom',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A watcher sets the height of a sidebar to match a list\'s `scrollHeight` whenever items change, but the height is always one update behind. What\'s wrong?',
      code: {
        lang: 'js',
        code: `watch(items, () => {
  sidebarHeight.value = listEl.value.scrollHeight + 'px'
}, { deep: true })`,
      },
      answer: "The watcher uses the default `flush: 'pre'`, so it runs before the DOM is patched and measures the previous list. Use `{ deep: true, flush: 'post' }` (or `watchPostEffect`) so it measures after the update. Writing `sidebarHeight` from a post watcher causes one extra render, which is acceptable.",
      explanation: 'Measuring is a DOM read: it belongs in the post phase.',
      whyAsked: 'Very common real-world bug with layout code, charts and scroll positions.',
      mistakes: ['Adding `setTimeout` as a fix.', 'Calling `$forceUpdate()`.', 'Not knowing about flush options.'],
      followUps: ['Could you avoid the extra render?', 'Would a `ResizeObserver` be better here?'],
      modelAnswer: "The callback runs with the default pre flush — before Vue has patched the DOM — so scrollHeight still reflects the old list. Switching to `flush: 'post'` moves it after the DOM update, so the measurement is current. That write triggers one more render, which is fine; if sizes can change for other reasons, like fonts loading or window resizes, a ResizeObserver is the more robust tool. I'd avoid setTimeout, since it only works by accident.",
    },
    {
      id: 'scheduling-flush-deep-cost',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'An editor keeps a large document tree (thousands of nodes) in `reactive()` and uses `watch(doc, autosave, { deep: true })`. Typing feels sluggish. What are the costs, and how would you restructure it?',
      answer: 'A deep watcher traverses every node on each run to collect dependencies, and every keystroke anywhere triggers it; deep `reactive()` also proxies every node lazily as it is accessed. Options: watch a cheap signal (a `version` counter bumped by edit commands), keep the tree in `shallowRef` and replace it immutably, cap traversal with `deep: <number>` (3.5+), debounce the save, and measure before and after in a production build.',
      explanation: 'Deep reactivity and deep watching cost proportional to the data they touch. Big data wants explicit change signals.',
      whyAsked: 'Probes performance judgement on large state — common in editors, spreadsheets and dashboards.',
      mistakes: ['Assuming deep watching is free.', 'Suggesting `flush: \'sync\'`.', 'Optimising without measuring.'],
      followUps: ['How would you implement a version counter cleanly?', 'What does `markRaw` change here?'],
      modelAnswer: "Two costs stack up: deep reactive makes every node a proxy as it's touched, and the deep watcher re-traverses the entire tree on every run, reading every property to track it. With thousands of nodes and one run per keystroke, that adds up. I'd make edits go through commands that bump a version ref and watch that instead, or hold the tree in a shallowRef and replace changed branches immutably. I'd also debounce the autosave and, on 3.5+, cap any remaining deep watch with a numeric depth. Then I'd profile a production build to confirm the improvement rather than guess.",
    },
    {
      id: 'scheduling-flush-coding-nexttick',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: '`addItem()` must add an item and resolve to the number of `<li>` elements **actually rendered** afterwards. It currently returns a stale count. Fix it. The **Add item** button (`class="add"`) shows the result in `class="rendered"`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const items = ref(['Milk', 'Eggs'])
const listEl = ref(null)
const rendered = ref(null)

// Must resolve to the number of <li> in the DOM AFTER the push
async function addItem(text) {
  items.value.push(text)
  return listEl.value.children.length
}

async function onAdd() {
  rendered.value = await addItem('Item ' + (items.value.length + 1))
}
</script>

<template>
  <ul ref="listEl">
    <li v-for="item in items" :key="item">{{ item }}</li>
  </ul>
  <button class="add" @click="onAdd">Add item</button>
  <p class="rendered">Rendered: {{ rendered }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'addItem resolves to the updated DOM count', code: `const n = await state.addItem('Tea'); expect(n).toBe(3)` },
        { name: 'the button shows 3 after one click', code: `await click('.add'); expect(text('.rendered')).toBe('Rendered: 3')` },
        { name: 'and 4 after two clicks', code: `await click('.add'); await click('.add'); expect(text('.rendered')).toBe('Rendered: 4')` },
      ],
      hints: ['The push only queues a re-render; the DOM changes in the next flush.', 'Import `nextTick` and `await nextTick()` between the push and the DOM read.'],
      answer: 'Await `nextTick()` after mutating state and before reading the DOM.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, nextTick } from 'vue'

const items = ref(['Milk', 'Eggs'])
const listEl = ref(null)
const rendered = ref(null)

async function addItem(text) {
  items.value.push(text)
  await nextTick() // wait for the DOM update flush
  return listEl.value.children.length
}

async function onAdd() {
  rendered.value = await addItem('Item ' + (items.value.length + 1))
}
</script>

<template>
  <ul ref="listEl">
    <li v-for="item in items" :key="item">{{ item }}</li>
  </ul>
  <button class="add" @click="onAdd">Add item</button>
  <p class="rendered">Rendered: {{ rendered }}</p>
</template>`,
        },
      },
      explanation: 'Mutations are applied to the DOM in a batched flush. `await nextTick()` resumes after that flush, so the DOM count matches the state.',
      whyAsked: 'Tests practical knowledge of asynchronous DOM updates — a frequent source of flaky UI code and tests.',
      mistakes: ['Using `setTimeout(…, 0)` instead of `nextTick`.', 'Reading the count from state and claiming it is the DOM count.', 'Forgetting that the function must stay async.'],
      followUps: ['How would you do the same inside a watcher?', 'Why do component tests often `await nextTick()`?'],
      modelAnswer: "The push only schedules a re-render, so reading the DOM on the next line sees the old list. I import nextTick and await it between the mutation and the read — it resolves after Vue's flush, when the new li exists. In a watcher I'd use `flush: 'post'` instead. setTimeout would usually work too, but only by accident of timing; nextTick expresses the intent and is tied to Vue's scheduler.",
    },
  ],

  takeaways: [
    'Computeds are lazy and cached: dirty on change, re-evaluated only when read.',
    'Since 3.4, computeds only trigger dependents when their value changes (`Object.is`) — return stable values, and use the `previous` argument when needed.',
    'Writes are batched: effects are queued, de-duplicated and flushed once per tick in a microtask.',
    "A flush runs pre jobs (default watchers), then component updates (parent → child), then post jobs (`flush: 'post'`, `onUpdated`).",
    "Use `'post'`/`watchPostEffect` or `await nextTick()` for DOM reads; reserve `'sync'` for rare cases.",
    'Deep watchers traverse everything they watch — prefer narrow getters or `deep: <number>` (3.5+).',
    'Scheduler internals (job ids, flags, queue order) are implementation details — rely only on the documented guarantees.',
  ],
}
