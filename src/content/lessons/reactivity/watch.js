// Lesson: watch() — run side effects when reactive state changes.
// See CONTENT_GUIDE.md for every field.

const searchApp = `<script setup>
import { ref, watch } from 'vue'
import { searchBooks } from './api.js'

const query = ref('')
const onlyAvailable = ref(false)
const results = ref([])
const loading = ref(false)

watch(query, async (newQuery, oldQuery) => {
  console.log(\`query: "\${oldQuery}" → "\${newQuery}"\`)
  loading.value = true
  const books = await searchBooks(newQuery, { onlyAvailable: onlyAvailable.value })
  results.value = books
  loading.value = false
})
</script>

<template>
  <h2>Book search</h2>
  <input v-model="query" class="search" placeholder="Search books…" />
  <label>
    <input v-model="onlyAvailable" type="checkbox" class="available" />
    Only available
  </label>
  <p v-if="loading" class="loading">Searching…</p>
  <ul>
    <li v-for="book in results" :key="book.id" class="result">{{ book.title }}</li>
  </ul>
  <p class="count">{{ results.length }} books</p>
</template>`

const searchApi = `// A simulated server — the sandbox has no network.
const BOOKS = [
  { id: 1, title: 'Vue.js in Action', available: true },
  { id: 2, title: 'Learning Vue', available: false },
  { id: 3, title: 'React Explained', available: true },
  { id: 4, title: 'Eloquent JavaScript', available: true },
  { id: 5, title: "You Don't Know JS", available: false },
  { id: 6, title: 'CSS Secrets', available: true },
]

// Short queries are "slower" on purpose, so fast typing can make
// responses arrive out of order — just like a real, busy server.
export function searchBooks(query, { onlyAvailable = false } = {}) {
  const q = query.trim().toLowerCase()
  const delay = Math.max(50, 300 - q.length * 60)
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        BOOKS.filter(
          (book) => book.title.toLowerCase().includes(q) && (!onlyAvailable || book.available)
        )
      )
    }, delay)
  })
}`

const userApi = `// A simulated server — the sandbox has no network.
const USERS = {
  1: { id: 1, name: 'Ada Lovelace' },
  2: { id: 2, name: 'Grace Hopper' },
  3: { id: 3, name: 'Alan Turing' },
}

// Different users take different times, so fast clicks can finish out of order.
const DELAYS = { 1: 150, 2: 100, 3: 300 }

export function fetchUser(id) {
  return new Promise((resolve) => setTimeout(() => resolve(USERS[id]), DELAYS[id]))
}`

const cityApi = `// A simulated server — the sandbox has no network.
const CITIES = ['Pune', 'Paris', 'Lagos', 'London', 'Lisbon', 'Oslo', 'Toronto']

export function search(query) {
  const q = query.trim().toLowerCase()
  return new Promise((resolve) => {
    setTimeout(() => resolve(CITIES.filter((c) => c.toLowerCase().includes(q))), 50)
  })
}`

export default {
  id: 'watch',
  title: 'watch(): reacting to changes',
  summary: 'Run your own code — fetching, saving, logging — whenever a specific piece of reactive state changes.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['computed'],
  related: ['watch-effect', 'next-tick', 'reactivity-utilities', 'arrays-objects-reactivity'],
  tags: ['reactivity', 'watch', 'watcher', 'side effects', 'deep', 'immediate', 'once', 'onCleanup', 'onWatcherCleanup', 'race conditions', 'getter source'],
  apis: [
    { name: 'watch(source, callback, options?)', summary: 'Runs `callback(newValue, oldValue, onCleanup)` whenever the source changes. Lazy by default.' },
    { name: 'onWatcherCleanup(fn)', summary: 'Vue 3.5+: registers a cleanup to run before the watcher runs again or stops. Must be called synchronously inside the callback.' },
    { name: 'WatchHandle', summary: 'The return value of `watch()`: call it (or `.stop()`) to stop; 3.5+ also has `.pause()` and `.resume()`.' },
  ],
  docs: [
    { label: 'Vue Guide — Watchers', url: 'https://vuejs.org/guide/essentials/watchers.html' },
    { label: 'API — watch()', url: 'https://vuejs.org/api/reactivity-core.html#watch' },
    { label: 'API — onWatcherCleanup()', url: 'https://vuejs.org/api/reactivity-core.html#onwatchercleanup' },
  ],

  intro: `
\`watch()\` lets you say: **"when *this* changes, run *that*."**

[computed()](lesson:computed) is for *values* — a total, a filtered list. But sometimes a change should cause an **action**: fetch new search results when the query changes, save a draft when the text changes, scroll to the newest chat message. Those actions are called **side effects** — code that reaches outside the calculation to change the world: the network, \`localStorage\`, the console, the DOM.

You give \`watch()\` a **source** to keep an eye on and a **callback** to run. Vue calls the callback with the new value and the old value each time the source changes.
`,

  why: `
Without a watcher, every place that changes the query would also have to remember to start a search:

\`\`\`js
function onInput(e) {
  query.value = e.target.value
  runSearch(query.value)          // remember here…
}
function clearSearch() {
  query.value = ''
  runSearch('')                   // …and here…
}
function loadFromUrl(params) {
  query.value = params.q
  runSearch(params.q)             // …and here.
}
\`\`\`

Miss one place and the results no longer match the box. Worse, the logic "a new query means a new search" is scattered across the app.

\`watch(query, runSearch)\` states the rule **once, next to the data**: *whenever \`query\` changes, for whatever reason, search again*. The functions that change the query no longer need to know a search exists.
`,

  eli15: `
Imagine you ask a friend: "Tell me whenever the bakery puts out fresh croissants." Your friend watches the window. When the tray changes, they text you: *"Fresh croissants! Before: none. Now: 12."*

\`watch()\` is that friend.

\`\`\`js
watch(croissants, (now, before) => {
  sendText(\`Before: \${before}. Now: \${now}.\`)
})
\`\`\`

- \`croissants\` is **what to watch** (the source).
- The arrow function is **what to do** (the callback). It gets the new value and the old value.
- By default your friend only texts when something **changes** — not the moment you ask. (You can ask for an immediate report too: \`{ immediate: true }\`.)

And if you're waiting on an answer that's now outdated ("is the bakery open?") when a newer question comes in, you can tell your friend to **ignore the old answer**. That's what *cleanup* is for.
`,

  analogy: {
    title: 'The parcel-tracking notification',
    body: `
You order a parcel and turn on notifications. You don't refresh the tracking page all day — the shop **watches the status for you** and pings you when it changes: *"Status changed from 'Packed' to 'Out for delivery'"*.

You choose **what** to be notified about. "Tell me when the *status* changes" is different from "tell me when *anything* about the order changes, including the box size and the courier's van number" — the second one is noisier and more work for the shop. That is the difference between watching one property with a getter and watching a whole object **deeply**.

You can ask for the **current status right now** when you subscribe (\`immediate\`), ask for **just one** notification (\`once\`), or **unsubscribe** (stop the watcher). And if two updates arrive out of order, a good app shows the newest one and throws the stale one away (cleanup).
`,
    mapping: [
      ['the order status you care about', 'the watch source (a ref, a getter, a reactive object)'],
      ['the push notification', 'the callback, called with `(newValue, oldValue)`'],
      ['"from Packed to Out for delivery"', '`oldValue` → `newValue`'],
      ['"notify me about every detail of the order"', '`{ deep: true }` or watching a reactive object'],
      ['"also tell me the status right now"', '`{ immediate: true }`'],
      ['"just tell me once"', '`{ once: true }` (Vue 3.4+)'],
      ['ignoring an outdated update', 'cleanup with `onCleanup` / `onWatcherCleanup()`'],
      ['turning notifications off', 'calling the stop handle returned by `watch()`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The life of a watcher',
    caption: 'Step through what happens between a state change and your callback running.',
    alt: 'A stepped diagram. A source (ref, reactive object, getter or array) is turned into a getter that Vue runs and tracks. When a dependency changes, the getter re-runs and Vue compares the new value with the old one. If it changed, the cleanup from the previous run is called, then the callback runs with the new value, the old value and onCleanup, and performs a side effect such as a fetch or a save.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'source', label: 'Source', note: 'ref · reactive · getter · [array]', tone: 'acid', x: 95, y: 80 },
        { id: 'getter', label: 'Getter runs', note: 'every reactive read is tracked', x: 285, y: 80 },
        { id: 'compare', label: 'Changed?', note: 'Object.is(new, old) — or deep', x: 475, y: 80 },
        { id: 'cleanup', label: 'Cleanup', note: 'previous run\'s onCleanup()', tone: 'kraft', x: 665, y: 80 },
        { id: 'change', label: 'Dependency changes', note: 'query.value = \'vue\'', tone: 'red', x: 285, y: 240 },
        { id: 'effect', label: 'Side effect', note: 'fetch · save · log · scroll', tone: 'ink', x: 475, y: 240 },
        { id: 'callback', label: 'Callback', note: '(newValue, oldValue, onCleanup)', tone: 'cobalt', x: 665, y: 240 },
      ],
      edges: [
        { from: 'source', to: 'getter', label: 'normalised' },
        { from: 'change', to: 'getter', label: 're-run', dashed: true },
        { from: 'getter', to: 'compare' },
        { from: 'compare', to: 'cleanup', label: 'yes' },
        { from: 'cleanup', to: 'callback' },
        { from: 'callback', to: 'effect' },
      ],
      steps: [
        { focus: ['source'], text: 'You hand `watch()` a **source**: a ref, a reactive object, a getter function like `() => user.address.city`, or an array of these.' },
        { focus: ['getter'], edges: ['source->getter'], text: 'Vue turns the source into a **getter** and runs it once. Every reactive value it reads becomes a dependency. The callback does **not** run yet — watchers are lazy unless you pass `immediate: true`.' },
        { focus: ['change', 'getter'], edges: ['change->getter'], text: 'Later, a dependency changes. Vue queues the watcher (by default it runs before the component re-renders, and several changes in one tick are batched into one run) and re-runs the getter.' },
        { focus: ['compare'], edges: ['getter->compare'], text: 'Vue compares the new value with the old one. Same value → nothing happens. Deep watchers skip this check, because a mutated object is still the *same* object.' },
        { focus: ['cleanup'], edges: ['compare->cleanup'], text: 'If the previous run registered a **cleanup** (with `onCleanup` or `onWatcherCleanup()`), it runs now — the perfect moment to cancel an outdated request.' },
        { focus: ['callback', 'effect'], edges: ['cleanup->callback', 'callback->effect'], text: 'Finally your **callback** runs with `(newValue, oldValue, onCleanup)` and performs the side effect.' },
      ],
    },
  },

  syntax: [
    `
**The basic shape.** \`watch(source, callback, options?)\`:
`,
    {
      code: `import { ref, watch } from 'vue'

const query = ref('')

watch(query, (newQuery, oldQuery) => {
  console.log(\`"\${oldQuery}" → "\${newQuery}"\`)
})`,
      lang: 'js',
      title: 'watching a ref',
    },
    `
**What can be a source?**
`,
    {
      code: `const count = ref(0)
const user = reactive({ name: 'Ada', address: { city: 'London' } })

// 1. A ref
watch(count, (n) => { /* … */ })

// 2. A getter function — for a property of a reactive object, or any expression
watch(() => user.address.city, (city) => { /* … */ })
watch(() => count.value * 2, (doubled) => { /* … */ })

// 3. A reactive object — implicitly DEEP: fires on any nested change
watch(user, (newUser, oldUser) => {
  // newUser === oldUser here: same object, it was mutated
})

// 4. An array of sources — fires when any of them changes
watch([count, () => user.name], ([newCount, newName], [oldCount, oldName]) => { /* … */ })`,
      lang: 'js',
      title: 'the four kinds of source',
    },
    `
**The trap:** \`watch(user.name, cb)\` does **not** work. \`user.name\` is evaluated *before* \`watch\` is called, so you pass the plain string \`'Ada'\` — there is nothing to track. Vue warns *"Invalid watch source"*. Wrap it in a getter: \`watch(() => user.name, cb)\`.

**Options:**
`,
    {
      code: `watch(source, callback, {
  immediate: true, // also run the callback right away (oldValue is undefined)
  deep: true,      // fire on nested mutations of an object returned by a getter
  once: true,      // run the callback once, then stop (Vue 3.4+)
  flush: 'post',   // run after the DOM has updated (default 'pre' = before render)
})`,
      lang: 'js',
      title: 'options',
    },
    `
**Deep vs shallow.** A getter that returns an object only fires when the getter returns a **different** object. Mutating a property inside it is invisible unless you ask for \`deep\`:
`,
    {
      code: `const cart = reactive({ items: [] })

watch(() => cart.items, save)                 // fires only when cart.items is REPLACED
watch(() => cart.items, save, { deep: true }) // fires on push, splice, item.qty++ …
watch(() => cart.items, save, { deep: 1 })    // 3.5+: only one level down (push/splice, not item.qty)`,
      lang: 'js',
      title: 'deep',
    },
    `
**Cleanup.** The callback's third argument, \`onCleanup\`, registers a function Vue calls **before the callback runs again** and **when the watcher stops**. Use it to cancel or ignore work that has become outdated. Vue 3.5 adds \`onWatcherCleanup()\`, which does the same without threading the argument through:
`,
    {
      code: `import { watch, onWatcherCleanup } from 'vue'

// Works in every Vue 3 version
watch(id, async (newId, oldId, onCleanup) => {
  let cancelled = false
  onCleanup(() => { cancelled = true })
  const data = await fetchUser(newId)
  if (!cancelled) user.value = data
})

// Vue 3.5+: call it synchronously — BEFORE the first await
watch(id, (newId) => {
  const controller = new AbortController()
  fetch(\`/api/users/\${newId}\`, { signal: controller.signal }).then(/* … */)
  onWatcherCleanup(() => controller.abort())
})`,
      lang: 'js',
      title: 'cleaning up stale work',
    },
    {
      callout: 'version',
      title: 'Version notes',
      text: '`once: true` needs Vue **3.4+**. `onWatcherCleanup()`, `deep` as a number, and `pause()`/`resume()` on the watch handle need Vue **3.5+**. `onWatcherCleanup()` must be called during the synchronous part of the callback — after an `await` Vue no longer knows which watcher is running.',
    },
    `
**Stopping.** \`watch()\` returns a handle. Call it to stop watching:
`,
    {
      code: `const stop = watch(source, callback)
stop()            // no more callbacks; the last cleanup runs

// Vue 3.5+: the same handle can pause and resume
const handle = watch(source, callback)
handle.pause()
handle.resume()
handle.stop()`,
      lang: 'js',
      title: 'stopping a watcher',
    },
    `
Watchers created **synchronously** inside \`<script setup>\` or \`setup()\` belong to that component and stop automatically when it unmounts. A watcher created later — inside a \`setTimeout\` or a \`.then()\` callback, or after an \`await\` inside an async function such as a composable — is not tied to the component and must be stopped by hand, or it keeps running (a memory leak). One exception: a *top-level* \`await\` in \`<script setup>\` is compiled so that the component context is restored afterwards, so watchers created after it are still stopped on unmount.
`,
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: searchApp,
    intro: 'A book search driven by a watcher. It works — but it has two gaps you will fix in the experiments. Read it line by line first.',
    steps: [
      { lines: [2, 3], text: 'Import `watch` from Vue and the simulated API from `./api.js` (the sandbox has no network, so `searchBooks` fakes a server with `setTimeout`).' },
      { lines: [5, 8], text: 'The state: what the user typed, a filter, the results and a loading flag. The results are **not** a computed — they come from an asynchronous request, which is a side effect.' },
      { lines: [10], text: '`watch(query, …)` — the source is the `query` ref itself (no `.value`!). Passing `query.value` would pass a plain string that Vue cannot track.' },
      { lines: [11], text: 'The callback receives the new and the old value. The log shows each transition. On the very first change the old value is `""`.' },
      { lines: [12, 15], text: 'The side effect: set the loading flag, wait for the simulated server, store the results. Watcher callbacks may be `async` — Vue doesn\'t wait for them, it just calls them.' },
      { lines: [13], text: 'Gap #1: `onlyAvailable.value` is read **inside the callback**, not in the source. Reads in the callback are not tracked, so ticking the checkbox does nothing yet.' },
      { lines: [10, 16], text: 'Gap #2: nothing runs on mount (watchers are lazy), and nothing protects against an older, slower response arriving after a newer one.' },
      { lines: [21], text: '`v-model` writes into `query` on every keystroke — that is the change the watcher reacts to.' },
      { lines: [26, 30], text: 'The template only displays state. It never calls the search itself.' },
    ],
  },

  playground: {
    title: 'Book search with a watcher',
    objective: 'Make the watcher run at start, react to two sources, and survive out-of-order responses.',
    files: { 'App.vue': searchApp, 'api.js': searchApi },
    expected: 'A search box, an "Only available" checkbox and **0 books** — nothing loads until you type (watchers are lazy). Type `vue` and two books appear. The console logs each `query: "old" → "new"` transition.',
    experiments: [
      {
        id: 'observe',
        task: 'Open the **Console**. Type `j`, then `ja`, then `jav` slowly and read the log lines. Then tick **Only available** and notice that nothing happens.',
        hint: 'Every log line shows the old and the new query. The checkbox is read inside the callback, not watched.',
        explain: 'The callback receives both values because Vue remembers the previous result of the source. The checkbox does nothing because a watcher only tracks its **source** — reads inside the callback are deliberately not tracked, so you stay in control of what triggers it.',
      },
      {
        id: 'immediate',
        task: 'Show all books as soon as the page opens, without the user typing anything. Do it with a watcher option, not by calling the search twice.',
        hint: 'Pass a third argument: `watch(query, async (…) => { … }, { immediate: true })`.',
        tests: [
          {
            name: 'all 6 books appear without typing',
            code: `await wait(400)
expect(findAll('.result')).toHaveLength(6)
expect(text('.count')).toBe('6 books')`,
          },
        ],
        explain: '`immediate: true` runs the callback once right away, during setup, with `oldValue` as `undefined` (look at the first log line). The same function now handles both the initial load and later changes — no duplicated "load on mount" code.',
      },
      {
        id: 'two-sources',
        task: 'Make ticking **Only available** re-run the search too. Watch **both** `query` and `onlyAvailable`.',
        hint: 'Use an array of sources: `watch([query, onlyAvailable], async ([newQuery, only], [oldQuery]) => { … })`, and pass `only` to `searchBooks`.',
        tests: [
          {
            name: 'the checkbox filters the current results',
            code: `await type('.search', 'vue')
await wait(400)
expect(findAll('.result')).toHaveLength(2)
await check('.available', true)
await wait(400)
expect(findAll('.result')).toHaveLength(1)
expect(text('.result')).toBe('Vue.js in Action')`,
          },
        ],
        explain: 'With an array source, the callback receives arrays of new and old values, in the same order. It fires when **any** of the sources changes. Reading `onlyAvailable.value` inside the callback was not enough — only the source is tracked.',
      },
      {
        id: 'stale-response',
        task: 'Type `r`, then quickly change it to `react`. The short query is slower on this "server", so its old answer arrives **last** and overwrites the correct results. Fix it: ignore any response that belongs to an outdated run.',
        hint: 'Add the third callback parameter `onCleanup`. At the start of the callback: `let cancelled = false; onCleanup(() => { cancelled = true })`. After the `await`, `if (cancelled) return`. (With Vue 3.5+ you can call `onWatcherCleanup(() => { cancelled = true })` instead — before the `await`.)',
        tests: [
          {
            name: 'only the newest query\'s results are shown',
            code: `await type('.search', 'r')
await type('.search', 'react')
await wait(450)
expect(findAll('.result')).toHaveLength(1)
expect(text('.result')).toBe('React Explained')`,
          },
        ],
        explain: 'When the query changes again, Vue calls the previous run\'s cleanup **before** starting the new run. The old request still finishes, but its result is thrown away. In a real app you would also abort the request with an `AbortController`, saving bandwidth.',
      },
    ],
  },

  animation: {
    type: 'reactivity',
    props: { preset: 'watch' },
    title: 'Inside a watcher',
    caption: 'Step through the flow: the source is read and tracked, the state changes, Vue triggers the watcher, compares old and new values and calls your callback — a side effect, not a re-render.',
    alt: 'A step-by-step diagram of a watcher. Reactive state is read by the watcher\'s source getter and recorded as a dependency. When the state changes, Vue triggers the watcher, queues it before the next render, re-reads the source, compares old and new values and runs the callback with both values. The callback performs a side effect, and the DOM updates separately through the component\'s render effect.',
  },

  internals: {
    beginner: `
A watcher is a little subscription with two parts.

1. **The source.** Vue runs it like a mini-template: whatever reactive values it reads are written down as things to keep an eye on.
2. **The callback.** When one of those values changes, Vue re-reads the source. If the result is different from last time, it calls your callback with the new and old results.

Reading things **inside the callback** doesn't subscribe to them — only the source does. That is the big difference from [watchEffect()](lesson:watch-effect), which subscribes to everything it reads.
`,
    technical: [
      `
Under the hood, \`watch()\` builds a reactive **effect** whose job is to run a *getter*, plus a **scheduler** that decides when to call your callback. The source is normalised into that getter:

- a ref → \`() => source.value\`
- a reactive object → a function that **traverses** every nested property (reading each one subscribes to it — that is why it is deep, and why it costs more on big objects)
- a getter → used as-is (wrapped in a traversal if \`deep\` is set; with \`deep: n\` the traversal stops at depth \`n\`)
- an array → a getter that reads each element in turn

Here is the idea, heavily simplified:
`,
      {
        code: `// A simplified model — not Vue's real source
function watch(source, callback, { immediate, deep, once } = {}) {
  const getter = normalise(source, deep) // ref / reactive / getter / array → a function
  let oldValue
  let cleanup

  const onCleanup = (fn) => { cleanup = fn }

  const job = () => {
    const newValue = runner()                    // re-run getter, re-collect deps
    if (!deep && Object.is(newValue, oldValue)) return
    if (cleanup) cleanup()                       // invalidate the previous run
    callback(newValue, oldValue, onCleanup)
    oldValue = newValue
    if (once) stop()
  }

  const runner = createEffect(getter, {
    scheduler: () => queueBeforeRender(job),     // flush: 'pre' — batched
  })

  if (immediate) job()          // first call: oldValue is undefined
  else oldValue = runner()      // collect dependencies, remember the first value

  function stop() { /* unsubscribe the effect, run the last cleanup */ }
  return stop
}`,
        lang: 'js',
        title: 'mental model of watch()',
      },
      `
Consequences worth knowing:

- **Batching.** The job is queued, not run on the spot. \`count.value = 2; count.value = 3\` in the same tick produces **one** callback, \`(3, 1)\`. Use \`flush: 'sync'\` only if you truly need every intermediate value (rarely a good idea).
- **Deep means "always changed".** A mutated object is still the same object, so for deep watchers Vue skips the identity check — and \`newValue === oldValue\`. If you need the previous *contents*, copy them yourself.
- **Timing.** The default \`flush: 'pre'\` runs callbacks after parent components update and before the owner component's DOM update. \`flush: 'post'\` runs after the DOM is patched. Details in [watchEffect()](lesson:watch-effect).
- **Ownership.** A watcher created during a component's synchronous setup is registered with that component's effect scope, so unmounting stops it. See [effectScope()](lesson:effect-scope) for grouping watchers yourself.

> **Note:** \`normalise\`, \`traverse\` and \`queueBeforeRender\` are illustrative names. Vue 3.5 moved the core of \`watch\` into \`@vue/reactivity\` and reworked its internals; the public behaviour above is what is documented and stable.
`,
    ],
    production: `
- **Watch the narrowest thing you need.** \`() => order.status\` instead of the whole \`order\` deeply. Deep watching traverses every nested property on each trigger, which adds up on large data. \`deep: n\` (3.5+) is a middle ground.
- **Every async watcher needs a stale-response strategy.** Cancel with \`AbortController\` in a cleanup, or ignore outdated results with a flag/request id. Users type and click faster than servers respond.
- **Debounce chatty sources.** A search watcher that fires on every keystroke can be debounced with a timer that the cleanup clears — no library needed.
- **Don't use a watcher to keep derived state in sync.** If you are writing \`watch(a, () => { b.value = f(a.value) })\`, \`b\` should be a [computed()](lesson:computed).
- **Avoid write loops.** A callback that writes to its own source re-triggers itself. Guard it, or restructure.
- **Create watchers synchronously in setup.** Watchers created in timers, promise callbacks or after an \`await\` inside an async composable are not stopped on unmount — keep the stop handle and stop it from a cleanup hook registered synchronously (\`onUnmounted\` / \`onScopeDispose\`), or create them in an \`effectScope\`. (A top-level \`await\` in \`<script setup>\` restores the component context, so it is the exception.)
- **\`immediate\` replaces "load on mount + watch".** One watcher with \`immediate: true\` covers the initial load and later changes. (It runs during setup, before the DOM exists — if you need the DOM, use \`flush: 'post'\` or \`onMounted\`.)
- Frontend watchers that, for example, hide an admin button when a role changes are a **UX convenience**, not security — the server must authorise every request.
`,
  },

  mistakes: [
    {
      title: 'Watching a property value instead of a getter',
      wrong: { code: `const user = reactive({ name: 'Ada' })\n\nwatch(user.name, (name) => console.log(name)) // ⚠ "Invalid watch source"`, lang: 'js' },
      right: { code: `watch(() => user.name, (name) => console.log(name))`, lang: 'js' },
      explanation: '`user.name` is evaluated immediately and hands `watch` the string `\'Ada\'`. A string can\'t change, so there is nothing to watch. A getter is re-run by Vue, which is how it notices changes.',
    },
    {
      title: 'Expecting nested changes from a shallow getter',
      wrong: { code: `watch(() => cart.items, saveCart)\n\ncart.items.push(newItem) // ❌ callback does not fire`, lang: 'js' },
      right: { code: `watch(() => cart.items, saveCart, { deep: true })\n// or: watch(cart, saveCart) if cart is reactive and you want everything`, lang: 'js' },
      explanation: 'A getter watcher compares the returned value by identity. `push` mutates the same array, so the getter returns the same array — "no change". Ask for `deep` (or watch the reactive object directly) when nested mutations matter.',
    },
    {
      title: 'Using a watcher for derived state',
      wrong: { code: `const fullName = ref('')\nwatch([first, last], ([f, l]) => {\n  fullName.value = f + ' ' + l\n}, { immediate: true })`, lang: 'js' },
      right: { code: `const fullName = computed(() => first.value + ' ' + last.value)`, lang: 'js' },
      explanation: 'The watcher version is longer, briefly out of sync (it runs later than the change), and easy to break. If the result is a value derived from state, it is a computed.',
    },
    {
      title: 'Letting old async results overwrite new ones',
      wrong: { code: `watch(userId, async (id) => {\n  user.value = await fetchUser(id) // a slow old response can land last\n})`, lang: 'js' },
      right: { code: `watch(userId, async (id, oldId, onCleanup) => {\n  let stale = false\n  onCleanup(() => { stale = true })\n  const data = await fetchUser(id)\n  if (!stale) user.value = data\n})`, lang: 'js' },
      explanation: 'Requests don\'t finish in the order they started. Without cleanup, the screen can show user 3 while the selected tab says user 2. Cleanup runs before the next callback, marking the old run as stale.',
    },
    {
      title: 'Calling onWatcherCleanup() after an await',
      wrong: { code: `watch(id, async (newId) => {\n  const data = await fetchUser(newId)\n  onWatcherCleanup(() => { /* … */ }) // ⚠ too late: Vue warns, nothing registered\n})`, lang: 'js' },
      right: { code: `watch(id, async (newId) => {\n  let stale = false\n  onWatcherCleanup(() => { stale = true }) // ✅ before the first await\n  const data = await fetchUser(newId)\n  if (!stale) user.value = data\n})`, lang: 'js' },
      explanation: '`onWatcherCleanup()` (3.5+) finds "the watcher currently running" through internal state that only exists during the synchronous part of the callback. After an `await`, that context is gone. The `onCleanup` argument does not have this restriction.',
    },
    {
      title: 'Creating a watcher asynchronously and never stopping it',
      wrong: { code: `<script setup>\nsetTimeout(() => {\n  watch(source, callback) // not owned by the component — keeps running after unmount\n}, 100)\n</script>`, lang: 'vue' },
      right: { code: `<script setup>\nwatch(source, callback) // created synchronously → stopped automatically on unmount\n</script>`, lang: 'vue' },
      explanation: 'Only watchers created while the component\'s setup is running (synchronously, or after a top-level `await` in `<script setup>`, which restores the context) are attached to the component. If you must create one later, store the stop handle and call it from an `onUnmounted` hook registered during setup.',
    },
  ],

  debugging: [
    {
      symptom: 'Console warning: "Invalid watch source: … A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types."',
      cause: 'You passed a plain value — usually `state.prop` or `someRef.value` — instead of something Vue can track.',
      fix: 'Pass the ref itself (`count`, not `count.value`) or a getter (`() => state.prop`).',
    },
    {
      symptom: 'The callback never fires when you change something nested, like `form.address.city`.',
      cause: 'The source is a getter that returns the parent object; nested mutations keep the same object identity.',
      fix: 'Watch the exact property with a getter (`() => form.address.city`), or add `{ deep: true }`.',
    },
    {
      symptom: '`newValue` and `oldValue` are identical in a deep watcher.',
      cause: 'For mutations, both point to the same (mutated) object. This is expected.',
      fix: 'Watch the specific primitive you care about with a getter, or keep your own copy (`structuredClone(toRaw(obj))`) of the previous state.',
    },
    {
      symptom: 'Data only loads after the user changes something; the first screen is empty.',
      cause: 'Watchers are lazy — the callback only runs on changes.',
      fix: 'Add `{ immediate: true }`.',
    },
    {
      symptom: '"Maximum recursive updates exceeded" or a frozen tab after adding a watcher.',
      cause: 'The callback writes to its own source (directly or via another watcher), so every run triggers another.',
      fix: 'Only write when the value really needs to change, or restructure so the derived value is a computed.',
    },
    {
      symptom: 'Logs from a watcher keep appearing after you navigated away from the page.',
      cause: 'The watcher was created asynchronously (in a timer, after `await`, in a callback), so it is not owned by the component.',
      fix: 'Create it synchronously in setup, or keep the handle and call `stop()` in `onUnmounted`.',
    },
  ],

  bestPractices: [
    'Use `watch` for side effects only; use `computed` for values derived from state.',
    'Pass refs themselves or getters as sources — never `.value` or `state.prop` directly.',
    'Watch the narrowest source that expresses your intent; reach for `deep` deliberately.',
    'Give every async watcher a cleanup that cancels or ignores outdated work.',
    'Use `immediate: true` instead of duplicating "load on mount" and "reload on change".',
    'Create watchers synchronously in setup so Vue stops them on unmount.',
    'Keep callbacks short: call a well-named function (`watch(query, runSearch)`) so the rule reads like a sentence.',
  ],

  useCases: [
    'Fetching data when an id, page number or search query changes.',
    'Autosaving a form or draft to `localStorage` or a server.',
    'Syncing state to the URL query string, or to document.title.',
    'Debouncing input before calling an API.',
    'Triggering an animation or scrolling a chat to the newest message (with `flush: \'post\'` when the DOM must be updated first).',
    'Sending analytics or logging when a user reaches a particular step.',
  ],

  whenToUse: {
    use: [
      'A change should cause an **action** (network, storage, DOM, logging), not just a new value.',
      'You need the **previous** value as well as the new one.',
      'You want precise control over **what** triggers the effect (only this property, not everything the code reads).',
      'The work is asynchronous and must be cancelled or ignored when a newer change arrives.',
    ],
    avoid: [
      'The result is a value derived from state — use [computed()](lesson:computed).',
      'The effect simply follows every reactive value it reads and doesn\'t need old values — [watchEffect()](lesson:watch-effect) is shorter.',
      'The action is a direct response to a user event (a click, a submit) — call it from the event handler.',
      'You are watching a huge object deeply "just in case" — find the specific property instead.',
    ],
  },

  comparison: {
    title: 'watch vs its neighbours',
    headers: ['', '`watch()`', '`watchEffect()`', '`computed()`', 'event handler'],
    rows: [
      ['Job', 'side effect on a specific change', 'side effect that follows whatever it reads', 'derived value', 'response to a user action'],
      ['What triggers it', 'only the source you pass', 'every reactive read in the effect', 'every reactive read in the getter', 'the DOM event'],
      ['Runs immediately?', 'no (unless `immediate: true`)', 'yes', 'lazily, on first read', 'when the event fires'],
      ['Old value available?', '**yes**', 'no', 'previous value via getter arg (3.4+)', 'n/a'],
      ['Async OK?', 'yes (use cleanup)', 'yes (only sync reads tracked)', 'no', 'yes'],
      ['Typical use', 'fetch on id change, autosave', 'sync a canvas / log many values', 'totals, filters, flags', 'submit, add to cart'],
    ],
    note: 'Next: [watchEffect() and watch vs watchEffect](lesson:watch-effect), including flush timing.',
  },

  quiz: [
    {
      id: 'watch-q1',
      type: 'mcq',
      prompt: 'Given `const state = reactive({ count: 0, name: \'Ada\' })`, which line runs a callback when **only** `state.count` changes?',
      options: [
        { text: '`watch(state.count, cb)`', why: '`state.count` is evaluated first, so `watch` receives the number `0`. Vue warns "Invalid watch source" and nothing is watched.' },
        { text: '`watch(() => state.count, cb)`' },
        { text: '`watch(state, cb)`', why: 'That watches the whole object deeply — it also fires when `name` changes.' },
        { text: '`watch(\'state.count\', cb)`', why: 'String paths belong to the Options API (`watch: { \'a.b\': … }` / `this.$watch`). The Composition API `watch()` does not accept strings.' },
      ],
      answer: 1,
      explanation: 'A getter lets Vue re-read `state.count` and track exactly that property.',
    },
    {
      id: 'watch-q2',
      type: 'output',
      prompt: 'What is logged? (Default options.)',
      code: {
        lang: 'js',
        code: `import { ref, watch, nextTick } from 'vue'

const n = ref(1)
watch(n, (value, old) => console.log(\`\${old}→\${value}\`))

n.value = 2
n.value = 3
await nextTick()`,
      },
      options: [
        { text: '`1→2` then `2→3`', why: 'That is what `flush: \'sync\'` would print. By default watcher callbacks are queued and batched, so they see only the final value.' },
        { text: '`1→3` once' },
        { text: 'Nothing — watchers are lazy', why: 'Lazy means "no call when created". There *are* changes here, so the callback runs.' },
        { text: '`undefined→1`, `1→2`, `2→3`', why: 'The `undefined → …` call only happens with `immediate: true`.' },
      ],
      answer: 1,
      explanation: 'The watcher job is queued on the first change and runs once before the next render. By then `n` is 3; the old value is the one seen at the previous run, 1.',
    },
    {
      id: 'watch-q3',
      type: 'bug',
      prompt: 'The "Moved to" message never appears and Vue prints a warning. Click the line with the bug.',
      code: {
        lang: 'js',
        code: `import { reactive, watch } from 'vue'

const user = reactive({
  name: 'Ada',
  address: { city: 'London' },
})

watch(user.address.city, (city) => {
  console.log('Moved to', city)
})

user.address.city = 'Pune'`,
      },
      answerLine: 8,
      explanation: '`user.address.city` passes the string `\'London\'`. Use a getter: `watch(() => user.address.city, …)`.',
    },
    {
      id: 'watch-q4',
      type: 'fill',
      prompt: 'Fill in the option names.',
      code: {
        lang: 'js',
        code: `watch(
  () => cart.items,
  saveCart,
  {
    ___: true, // run the callback right away, not only on changes
    ___: true, // also fire when an item inside the array is mutated
  }
)`,
      },
      answer: [['immediate'], ['deep']],
      explanation: '`immediate` runs the callback once when the watcher is created; `deep` makes a getter watcher react to nested mutations.',
    },
    {
      id: 'watch-q5',
      type: 'mcq',
      prompt: 'When does Vue call a function you registered with `onCleanup` (or `onWatcherCleanup()`)?',
      options: [
        { text: 'Right before the callback runs again, and when the watcher is stopped (for example when the component unmounts).' },
        { text: 'Only when the component unmounts.', why: 'It also runs before every re-run — that is what lets you cancel a request that has become outdated.' },
        { text: 'Immediately after the callback finishes.', why: 'Then an async callback could never be cancelled — the cleanup waits for the *next* change.' },
        { text: 'Only when you call it yourself.', why: 'You only register it; Vue decides when to call it.' },
      ],
      answer: 0,
      explanation: 'The cleanup marks the end of a run\'s "lifetime": a newer run is starting, or the watcher is going away.',
    },
    {
      id: 'watch-q6',
      type: 'output',
      prompt: 'What does the callback log?',
      code: {
        lang: 'js',
        code: `const settings = reactive({ theme: 'light', font: { size: 14 } })

watch(settings, (newVal, oldVal) => {
  console.log(newVal === oldVal, newVal.font.size)
})

settings.font.size = 16`,
      },
      options: [
        { text: '`false 16`', why: 'Mutating a property does not create a new object; both arguments point to the same reactive object.' },
        { text: '`true 16`' },
        { text: 'Nothing — nested changes are ignored', why: 'Watching a reactive object directly is implicitly deep.' },
        { text: '`true 14`', why: 'Both values are the same object, which now holds 16.' },
      ],
      answer: 1,
      explanation: 'Watching a reactive object creates a deep watcher. For a mutation, the new and old value are the same object, so `newVal === oldVal` is `true`.',
    },
    {
      id: 'watch-q7',
      type: 'short',
      prompt: 'Why does a watcher that fetches search results need a cleanup? Answer in two or three sentences.',
      answer: 'Because requests can finish out of order: an older, slower request may resolve after a newer one and overwrite the correct results. A cleanup runs before the next callback, so it can abort the old request or mark it as stale and ignore its result, guaranteeing the UI shows results for the latest query.',
    },
  ],

  exercises: [
    {
      id: 'autosave-draft',
      title: 'Fix the autosave',
      difficulty: 'beginner',
      prompt: `
This note editor is supposed to save the draft to \`localStorage\` whenever you type, but **it never saves**. Fix the watcher and add a Clear button.

- Typing in \`.title\` (an input) or \`.body\` (a textarea) must save the draft as JSON under the key \`'draft'\` and add one to the counter shown in \`.saves\`.
- Nothing is saved when the page first opens (\`.saves\` starts at \`0\`).
- Add a \`<button class="clear">\` that empties **both** fields. Clearing must cause exactly **one** save, not two.
`,
      files: {
        'App.vue': `<script setup>
import { reactive, ref, watch } from 'vue'

const draft = reactive({ title: '', body: '' })
const saves = ref(0)

function save(value) {
  localStorage.setItem('draft', JSON.stringify(value))
  saves.value++
}

// Bug: this never fires when you type. Why?
watch(() => draft, (value) => save(value))
</script>

<template>
  <input v-model="draft.title" class="title" placeholder="Title" />
  <textarea v-model="draft.body" class="body" placeholder="Write something…"></textarea>
  <p>Saved <span class="saves">{{ saves }}</span> times</p>
</template>`,
      },
      hints: [
        'The getter `() => draft` returns the same object every time. Typing mutates a property inside it — the object itself never changes.',
        'Either watch the reactive object directly (`watch(draft, …)`, which is implicitly deep) or keep the getter and add `{ deep: true }`.',
        'For the button, write a `clear()` that sets `draft.title = \'\'` and `draft.body = \'\'`. Watcher callbacks are batched, so two changes in one click produce one save.',
      ],
      solution: {
        explanation: 'A getter watcher fires only when the returned value changes identity, and a mutated reactive object keeps its identity. Watching `draft` directly makes Vue traverse and track every property, so typing in either field triggers a save. In `clear()`, both assignments happen in the same tick; the watcher job is queued once and runs once, so you get a single save. Notice `immediate` is not set, so mounting saves nothing.',
        files: {
          'App.vue': `<script setup>
import { reactive, ref, watch } from 'vue'

const draft = reactive({ title: '', body: '' })
const saves = ref(0)

function save(value) {
  localStorage.setItem('draft', JSON.stringify(value))
  saves.value++
}

// Watching a reactive object directly is implicitly deep.
watch(draft, (value) => save(value))

function clear() {
  draft.title = ''
  draft.body = ''
}
</script>

<template>
  <input v-model="draft.title" class="title" placeholder="Title" />
  <textarea v-model="draft.body" class="body" placeholder="Write something…"></textarea>
  <button class="clear" @click="clear">Clear</button>
  <p>Saved <span class="saves">{{ saves }}</span> times</p>
</template>`,
        },
      },
      tests: [
        { name: 'nothing is saved on start', code: `expect(text('.saves')).toBe('0')` },
        {
          name: 'typing a title saves the draft',
          code: `await type('.title', 'Groceries')
expect(JSON.parse(localStorage.getItem('draft')).title).toBe('Groceries')
expect(text('.saves')).toBe('1')`,
        },
        {
          name: 'typing in the body saves too',
          code: `await type('.body', 'Milk, eggs')
expect(JSON.parse(localStorage.getItem('draft')).body).toBe('Milk, eggs')
expect(text('.saves')).toBe('1')`,
        },
        {
          name: 'Clear empties both fields with a single save',
          code: `await type('.title', 'Plan')
await type('.body', 'Step one')
expect(text('.saves')).toBe('2')
await click('.clear')
expect(find('.title').value).toBe('')
expect(find('.body').value).toBe('')
expect(text('.saves')).toBe('3')`,
        },
      ],
    },
    {
      id: 'profile-loader',
      title: 'A profile loader that never shows the wrong user',
      difficulty: 'intermediate',
      prompt: `
Three buttons (\`.user-1\`, \`.user-2\`, \`.user-3\`) choose a user, and \`fetchUser(id)\` in \`api.js\` loads it (each user takes a different time). Rewrite the watcher so that:

- User 1 loads **as soon as the page opens** and its name appears in \`.name\`.
- While a user is loading, \`.name\` shows \`Loading…\`.
- If you click **User 3** and then quickly **User 2**, the page ends up showing **Grace Hopper** (user 2), even though user 3's slower response arrives later.

Keep one watcher on \`userId\`; don't add a separate "load on mount" call.
`,
      files: {
        'App.vue': `<script setup>
import { ref, watch } from 'vue'
import { fetchUser } from './api.js'

const userId = ref(1)
const user = ref(null)

watch(userId, async (id) => {
  user.value = await fetchUser(id)
})
</script>

<template>
  <nav>
    <button v-for="id in [1, 2, 3]" :key="id" :class="'user-' + id" @click="userId = id">
      User {{ id }}
    </button>
  </nav>
  <p class="name">{{ user ? user.name : 'Loading…' }}</p>
</template>`,
        'api.js': userApi,
      },
      hints: [
        'Loading on start is a watcher option: `{ immediate: true }`. Showing "Loading…" just needs `user.value = null` at the start of each run.',
        'To ignore stale responses, create a `let stale = false` flag inside the callback and register a cleanup that sets it to `true`.',
        'Use the third parameter `onCleanup(() => { stale = true })`, or `onWatcherCleanup(…)` (3.5+, import it from `\'vue\'`, call it before the `await`). After the `await`, only assign when `!stale`.',
      ],
      solution: {
        explanation: '`immediate: true` makes the same callback handle the first load and every change. Each run gets its own `stale` flag. When `userId` changes again, Vue calls the previous run\'s cleanup **before** starting the new one, flipping that run\'s flag — so when user 3\'s slow response finally arrives, it is ignored. `onWatcherCleanup()` is used here (Vue 3.5+); `onCleanup` as the third callback argument works the same way and also works in older Vue 3 versions.',
        files: {
          'App.vue': `<script setup>
import { ref, watch, onWatcherCleanup } from 'vue'
import { fetchUser } from './api.js'

const userId = ref(1)
const user = ref(null)

watch(
  userId,
  async (id) => {
    let stale = false
    onWatcherCleanup(() => {
      stale = true // a newer id was chosen: this run's result is outdated
    })

    user.value = null // show "Loading…"
    const result = await fetchUser(id)
    if (!stale) user.value = result
  },
  { immediate: true }
)
</script>

<template>
  <nav>
    <button v-for="id in [1, 2, 3]" :key="id" :class="'user-' + id" @click="userId = id">
      User {{ id }}
    </button>
  </nav>
  <p class="name">{{ user ? user.name : 'Loading…' }}</p>
</template>`,
          'api.js': userApi,
        },
      },
      tests: [
        { name: 'user 1 loads on start', code: `await wait(250)\nexpect(text('.name')).toBe('Ada Lovelace')` },
        {
          name: 'shows Loading… while a new user loads',
          code: `await wait(250)
await click('.user-3')
expect(text('.name')).toBe('Loading…')
await wait(400)
expect(text('.name')).toBe('Alan Turing')`,
        },
        {
          name: 'a slower, outdated response is ignored',
          code: `await wait(250)
await click('.user-3')
await click('.user-2')
await wait(450)
expect(text('.name')).toBe('Grace Hopper')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'watch-src-reactive-prop',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A colleague writes `watch(props.userId, loadUser)` and the user never reloads when the parent passes a new id. Vue also prints "Invalid watch source". What is wrong?',
      code: { lang: 'js', code: `const props = defineProps(['userId'])\n\nwatch(props.userId, loadUser) // ❌` },
      answer: '`props.userId` is read once, when `watch` is called, so `watch` receives a plain number, not something reactive. Use a getter: `watch(() => props.userId, loadUser)`. The same applies to any property of a `reactive()` object.',
      explanation: 'Vue can only notice changes it can re-read. A getter is a function Vue can call again; a number is just a number.',
      whyAsked: 'One of the most frequent real-world watcher bugs, especially with props. It checks that you understand what a "source" is.',
      mistakes: ['Suggesting `{ deep: true }` — depth is not the problem.', 'Suggesting `toRefs(props)` without explaining why the original fails.', 'Saying props are not reactive.'],
      followUps: ['Would `watch(props, …)` work? What would it watch?', 'How does `toRef(props, \'userId\')` compare to a getter?'],
      modelAnswer: 'The expression `props.userId` is evaluated before `watch` runs, so it receives the current number — Vue has nothing to track, hence the warning. Props are a reactive object, so the fix is a getter, `watch(() => props.userId, loadUser)`, which Vue re-runs and tracks. I\'d probably add `immediate: true` so the first user loads too. `toRef(props, \'userId\')` would also work, but a getter is the idiomatic choice.',
    },
    {
      id: 'watch-deep-sources',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'Explain the difference between `watch(state, cb)`, `watch(() => state.items, cb)`, `watch(() => state.items, cb, { deep: true })` and `watch(() => state.items.length, cb)`, where `state` is reactive.',
      answer: '`watch(state, cb)` is implicitly deep: any nested change anywhere in `state` fires it. `watch(() => state.items, cb)` fires only when `state.items` is **replaced** with a different array. Adding `{ deep: true }` makes it fire on any mutation inside the array too (push, splice, `item.done = true`). `watch(() => state.items.length, cb)` fires only when the number of items changes. In Vue 3.5+ `deep` can also be a number that limits how many levels are traversed.',
      explanation: 'Getters compare by identity; deep watchers traverse and track everything. Pick the narrowest one that matches what you care about.',
      code: {
        lang: 'js',
        code: `const state = reactive({ items: [{ text: 'Milk', done: false }] })

watch(state, cb)                                // any nested change
watch(() => state.items, cb)                    // only state.items = newArray
watch(() => state.items, cb, { deep: true })    // push, splice, item.done = true
watch(() => state.items, cb, { deep: 1 })       // 3.5+: push/splice, not item.done
watch(() => state.items.length, cb)             // only when the count changes`,
      },
      whyAsked: 'Distinguishes candidates who know watchers compare by identity, and who think about the cost of deep traversal.',
      mistakes: ['Thinking getters are deep by default.', 'Not knowing that `newValue === oldValue` for deep mutations.', 'Ignoring the performance cost of deep watching large structures.'],
      followUps: ['Why are `newValue` and `oldValue` the same object in a deep watcher?', 'How would you get the previous contents of the array?', 'When would `deep: 1` be useful?'],
      modelAnswer: 'Watching a reactive object directly creates a deep watcher, so any nested change fires it. A getter returning `state.items` is compared by identity — it only fires when the array is replaced. With `deep: true` Vue traverses the array and every item, so mutations fire it too, but `newValue` and `oldValue` are then the same object. Watching `state.items.length` is the most precise if I only care about additions and removals. Deep watching has a cost on large data, so I prefer the narrowest getter, and in 3.5+ I can cap the depth with a number.',
    },
    {
      id: 'watch-immediate-vs-onmounted',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'To load data for the current `route.params.id` and reload when it changes, should you use `onMounted` + `watch`, or a single `watch` with `immediate: true`? Are there timing differences?',
      answer: 'A single `watch(() => route.params.id, load, { immediate: true })` is usually better: one function covers the initial load and every change. Timing differs: an immediate watcher runs synchronously during setup, **before** the component is mounted, so there is no DOM yet; `onMounted` runs after the first render. For data fetching that doesn\'t matter (and starting earlier is good). If you need the DOM, use `onMounted` or `flush: \'post\'`.',
      explanation: 'Duplicated "load on mount" and "load on change" code tends to drift apart. `immediate` keeps it in one place.',
      code: {
        lang: 'js',
        code: `// Two places that must stay in sync
onMounted(() => load(route.params.id))
watch(() => route.params.id, (id) => load(id))

// One place
watch(() => route.params.id, (id) => load(id), { immediate: true })`,
      },
      whyAsked: 'Tests practical watcher experience and knowledge of the component lifecycle.',
      mistakes: ['Claiming `immediate` runs after mount.', 'Accessing template refs inside an immediate callback and getting `null`.', 'Forgetting the stale-response problem when the id changes quickly.'],
      followUps: ['What is `oldValue` on the immediate call?', 'How would you handle the id changing while a request is in flight?'],
      modelAnswer: 'I\'d use one watcher with `immediate: true`, because the initial load and the reload are the same operation and shouldn\'t be written twice. The difference is timing: the immediate run happens synchronously during setup, before mount, so `oldValue` is undefined and template refs are still null. For fetching data that\'s fine — it even starts the request earlier. If the callback needed the DOM I\'d use `flush: \'post\'` or `onMounted`. And since ids can change quickly I\'d add a cleanup to ignore stale responses.',
    },
    {
      id: 'watch-race-cleanup',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Users of an e-mail app click quickly through conversations. Sometimes the reading pane shows conversation A while conversation B is highlighted. The pane is filled by a watcher on `selectedId`. Diagnose and fix it.',
      answer: 'It is a race condition: requests resolve out of order, and a slow response for A lands after the response for B, overwriting it. Fix it with watcher cleanup: in each run, create an `AbortController` (or a `stale` flag), register a cleanup with `onCleanup` / `onWatcherCleanup()` that aborts it, and only assign the result if the run is still current. Optionally debounce rapid selection changes.',
      explanation: 'Vue calls the previous run\'s cleanup before the next run starts — exactly the moment the old request becomes irrelevant.',
      code: {
        lang: 'js',
        code: `watch(selectedId, async (id, oldId, onCleanup) => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())

  try {
    const res = await fetch(\`/api/conversations/\${id}\`, { signal: controller.signal })
    conversation.value = await res.json()
  } catch (err) {
    if (err.name !== 'AbortError') error.value = err
  }
})`,
      },
      whyAsked: 'Async races are among the most common production bugs in data-driven UIs; this shows whether you know Vue\'s built-in tool for them.',
      mistakes: ['Blaming caching or the server.', 'Adding a `setTimeout` delay as a "fix".', 'Calling `onWatcherCleanup()` after the `await`.', 'Forgetting to ignore `AbortError` in the catch block.'],
      followUps: ['What is the difference between aborting and ignoring the result?', 'Why must `onWatcherCleanup()` be called before the first `await`?', 'How would a request id counter solve the same problem?'],
      modelAnswer: 'This is a classic race: two requests are in flight, and the older one finishes last and overwrites the newer result. Vue watchers have a cleanup hook for exactly this — the previous run\'s cleanup is called before the next callback. I\'d create an `AbortController` per run, abort it in `onCleanup`, and ignore `AbortError`; if the API can\'t be aborted, a `stale` flag works too. With 3.5 I can use `onWatcherCleanup()`, but it must be registered before the first `await`. I might also debounce the selection to avoid wasted requests.',
    },
    {
      id: 'watch-options-once',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this log? (Vue 3.4+.)',
      code: {
        lang: 'js',
        code: `const step = ref(1)

watch(step, (s) => console.log('A', s), { once: true })
watch(step, (s) => console.log('B', s), { immediate: true, once: true })

step.value = 2
await nextTick()
step.value = 3
await nextTick()`,
      },
      options: ['`B 1`, `A 2`', '`B 1`, `A 2`, `B 2`, `A 3`, `B 3`', '`A 2`, `B 2`', '`B 1`, `A 2`, `A 3`'],
      correctOption: 0,
      answer: '`B 1` (immediately, during creation), then `A 2` after the first change. Both watchers are then stopped, so the change to 3 logs nothing.',
      explanation: '`once: true` stops the watcher after its first callback. For B, the first callback is the immediate one.',
      whyAsked: 'Checks precise knowledge of watcher options and their interaction, including a 3.4 feature.',
      mistakes: ['Thinking `once` means "once after the immediate call".', 'Forgetting that `immediate` runs synchronously at creation.'],
      followUps: ['How would you implement `once` before Vue 3.4?', 'What happens to the cleanup when a `once` watcher stops?'],
      modelAnswer: 'B has `immediate`, so it logs `B 1` right when it is created — and because of `once`, that first call also stops it. A is lazy, so its first callback is the change to 2: `A 2`, and then it stops too. The change to 3 logs nothing. Before 3.4 I\'d have called the stop handle inside the callback to get the same effect.',
    },
    {
      id: 'watch-leak-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'In a composable, a watcher is created after an `await` (once some config has loaded). Memory usage grows as users navigate. Why, and how should watcher lifetimes be managed?',
      code: {
        lang: 'js',
        code: `export async function useLiveScore(matchId) {
  const config = await loadConfig()
  watch(matchId, (id) => subscribe(id, config)) // created after await
}`,
      },
      answer: 'Only watchers created during the **synchronous** part of a component\'s setup are attached to that component and stopped on unmount. After an `await` inside the composable\'s own async function, there is no active component, so this watcher lives forever, keeping its callback, closures and subscriptions alive. (Only a top-level `await` in `<script setup>` gets the component context restored by the compiler — an `await` inside a composable does not.) Fix: create the watcher synchronously (and let it react when config arrives), or keep the stop handle and stop it from an `onScopeDispose`/`onUnmounted` hook registered *before* the `await`, or group effects in an `effectScope()` you stop yourself. Also clean up the subscription in the watcher\'s cleanup.',
      explanation: 'Vue attaches effects to the "currently active" component/effect scope. After an `await`, that context is gone.',
      whyAsked: 'Senior-level: composable design and resource lifetimes are a real source of leaks in large SPAs.',
      mistakes: ['Assuming every watcher stops on unmount.', 'Fixing it only with a page reload / navigation guard.', 'Not cleaning up the external subscription.'],
      followUps: ['What does `onScopeDispose` give you over `onUnmounted` in a composable?', 'How do `pause()` and `resume()` (3.5+) differ from stopping?'],
      modelAnswer: 'Vue binds a watcher to whatever component or effect scope is active when it is created, and that only exists during the synchronous part of setup. After `await loadConfig()` nothing is active, so the watcher is never stopped — every navigation adds another one, along with its subscription. I\'d restructure: create the watcher synchronously, with config as a ref it can wait for, so Vue stops it on unmount. If it really must be created later, I\'d register `onScopeDispose` before the `await` and stop the stored handle there, or run the composable inside an `effectScope()` I control. A top-level `await` in `<script setup>` would be fine, because the compiler restores the component context — but an `await` inside a composable isn\'t covered. The callback\'s cleanup should also unsubscribe from the live feed.',
    },
    {
      id: 'watch-coding-debounce',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'This city search sends a request on every keystroke. Debounce it **inside the watcher**: only call `search()` when the user has stopped typing for **300 ms**. `.requests` shows how many requests were sent; `.result` items show the cities for the latest query. Use no libraries.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, watch } from 'vue'
import { search } from './api.js'

const query = ref('')
const results = ref([])
const requests = ref(0)

// Fires a request on every keystroke — debounce it!
watch(query, async (q) => {
  requests.value++
  results.value = await search(q)
})
</script>

<template>
  <input v-model="query" class="search" placeholder="Search cities" />
  <p>Requests sent: <span class="requests">{{ requests }}</span></p>
  <ul>
    <li v-for="city in results" :key="city" class="result">{{ city }}</li>
  </ul>
</template>`,
          'api.js': cityApi,
        },
      },
      tests: [
        {
          name: 'fast typing sends only one request',
          code: `await type('.search', 'p')
await type('.search', 'pu')
await type('.search', 'pun')
await wait(450)
expect(text('.requests')).toBe('1')
expect(text('ul')).toContain('Pune')`,
        },
        {
          name: 'no request before the 300 ms pause',
          code: `await type('.search', 'pa')
await wait(100)
expect(text('.requests')).toBe('0')`,
        },
        {
          name: 'two pauses send two requests',
          code: `await type('.search', 'l')
await wait(450)
await type('.search', 'lo')
await wait(450)
expect(text('.requests')).toBe('2')
expect(findAll('.result')).toHaveLength(2)`,
        },
      ],
      hints: [
        'Start a `setTimeout(…, 300)` inside the callback and do the request inside the timer.',
        'Each new keystroke should cancel the previous timer. Which watcher feature runs code right before the next callback?',
        'Use the third parameter: `onCleanup(() => clearTimeout(timer))`.',
      ],
      answer: 'Start a 300 ms timer in each callback run and clear it in the run\'s cleanup. A new keystroke triggers the cleanup of the previous run, cancelling its timer, so only the last timer fires.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, watch } from 'vue'
import { search } from './api.js'

const query = ref('')
const results = ref([])
const requests = ref(0)

watch(query, (q, oldQ, onCleanup) => {
  let stale = false
  const timer = setTimeout(async () => {
    requests.value++
    const found = await search(q)
    if (!stale) results.value = found
  }, 300)

  onCleanup(() => {
    stale = true          // ignore a request that is already in flight
    clearTimeout(timer)   // cancel a request that has not started yet
  })
})
</script>

<template>
  <input v-model="query" class="search" placeholder="Search cities" />
  <p>Requests sent: <span class="requests">{{ requests }}</span></p>
  <ul>
    <li v-for="city in results" :key="city" class="result">{{ city }}</li>
  </ul>
</template>`,
          'api.js': cityApi,
        },
      },
      explanation: 'The watcher\'s cleanup is a natural debounce: every change cancels the previous run\'s pending timer. The `stale` flag additionally protects against a request that already started before the next keystroke.',
      whyAsked: 'Debounced search is a staple of frontend interviews; solving it with watcher cleanup shows real understanding of the watcher lifecycle rather than reaching for lodash by reflex.',
      mistakes: ['Keeping the timer id in a variable outside the watcher and forgetting to clear it on unmount.', 'Debouncing the request but not protecting against stale responses.', 'Using `watchEffect` and accidentally tracking `results`.'],
      followUps: ['What happens to a pending timer when the component unmounts?', 'How would you also show a loading indicator?', 'How would you turn this into a reusable `useDebouncedSearch` composable?'],
      modelAnswer: 'I\'d debounce inside the watcher itself: each run starts a 300 ms timer that performs the request, and registers a cleanup that clears the timer. Because Vue calls the previous run\'s cleanup before the next callback, every keystroke cancels the previous timer, and only the last one fires. The cleanup also runs on unmount, so nothing fires after the component is gone. I\'d add a stale flag in the same cleanup so a request that already started can\'t overwrite newer results.',
    },
  ],

  takeaways: [
    '`watch(source, callback)` runs a side effect when a specific source changes; the callback gets `(newValue, oldValue, onCleanup)`.',
    'Sources: a ref, a getter (`() => obj.prop`), a reactive object (implicitly deep) or an array of these — never a plain `obj.prop` value.',
    'Getters compare by identity: use `deep` (or a number of levels, 3.5+) for nested mutations, or watch the exact property.',
    'Watchers are lazy and batched; `immediate: true` runs at creation, `once: true` (3.4+) runs a single time.',
    'Async watchers need cleanup: `onCleanup` or `onWatcherCleanup()` (3.5+, before any `await`) to cancel or ignore stale work.',
    'Watchers created synchronously in setup stop on unmount; others must be stopped with the returned handle.',
  ],
}
