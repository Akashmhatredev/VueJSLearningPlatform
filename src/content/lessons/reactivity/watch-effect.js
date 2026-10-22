// Lesson: watchEffect() and watch vs watchEffect.
// See CONTENT_GUIDE.md for every field.

const draftApp = `<script setup>
import { ref, watchEffect } from 'vue'

const title = ref('Groceries')
const body = ref('Milk, eggs, bread')
const status = ref('')
let saves = 0

watchEffect(() => {
  const draft = { title: title.value, body: body.value }
  localStorage.setItem('draft', JSON.stringify(draft))
  saves++
  status.value = \`Saved \${saves} time(s)\`
  console.log('saved', JSON.stringify(draft))
})
</script>

<template>
  <h2>Note draft</h2>
  <input class="title" v-model="title" />
  <textarea class="body" v-model="body"></textarea>
  <p class="status">{{ status }}</p>
</template>`

const searchApi = `// A fake package registry. No network in the sandbox, so we simulate one.
// Shorter queries are *slower* here, so answers can arrive out of order —
// exactly the race condition real search boxes suffer from.
const PACKAGES = ['vue', 'vue-router', 'vuex', 'vite', 'vitest', 'pinia', 'nuxt', 'vueuse']

export function searchPackages(query) {
  const delay = Math.max(40, 300 - query.length * 80)
  return new Promise((resolve) => {
    setTimeout(() => resolve(PACKAGES.filter((name) => name.includes(query))), delay)
  })
}`

const searchStarter = `<script setup>
import { ref, watchEffect, onWatcherCleanup } from 'vue'
import { searchPackages } from './api.js'

const query = ref('')
const results = ref([])

watchEffect(async () => {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    return
  }
  // TODO: ignore the answer if the query changed while we were waiting
  const found = await searchPackages(q)
  results.value = found
})
</script>

<template>
  <input class="search" v-model="query" placeholder="Search packages" />
  <p class="count">{{ results.length }} result(s)</p>
  <ul>
    <li v-for="name in results" :key="name" class="result">{{ name }}</li>
  </ul>
</template>`

const searchSolution = `<script setup>
import { ref, watchEffect, onWatcherCleanup } from 'vue'
import { searchPackages } from './api.js'

const query = ref('')
const results = ref([])

watchEffect(async () => {
  const q = query.value.trim()          // tracked: read before any await
  if (!q) {
    results.value = []
    return
  }

  let stale = false
  onWatcherCleanup(() => {               // 3.5+ — must be called before the await
    stale = true
  })

  const found = await searchPackages(q)
  if (!stale) results.value = found      // an outdated answer is simply dropped
})
</script>

<template>
  <input class="search" v-model="query" placeholder="Search packages" />
  <p class="count">{{ results.length }} result(s)</p>
  <ul>
    <li v-for="name in results" :key="name" class="result">{{ name }}</li>
  </ul>
</template>`

export default {
  id: 'watch-effect',
  title: 'watchEffect() and watch vs watchEffect',
  summary: 'Run a side effect that automatically re-runs whenever any reactive value it read changes — and know when to pick it over watch().',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['watch'],
  related: ['watch', 'computed', 'next-tick', 'effect-scope', 'scheduling-flush'],
  tags: ['reactivity', 'watchEffect', 'side effects', 'auto-tracking', 'flush', 'watchPostEffect', 'watchSyncEffect', 'onWatcherCleanup', 'cleanup'],
  apis: [
    { name: 'watchEffect()', summary: 'Runs a function immediately, tracks every reactive value it reads, and re-runs it when any of them changes.' },
    { name: 'watchPostEffect()', summary: 'Alias of `watchEffect(fn, { flush: \'post\' })` — runs after Vue has updated the DOM.' },
    { name: 'watchSyncEffect()', summary: 'Alias of `watchEffect(fn, { flush: \'sync\' })` — runs synchronously on every change. Use sparingly.' },
    { name: 'onWatcherCleanup()', summary: 'Vue 3.5+: registers a cleanup that runs before the current watcher re-runs or stops. Call it synchronously.' },
  ],
  docs: [
    { label: 'Vue Guide — Watchers: watchEffect()', url: 'https://vuejs.org/guide/essentials/watchers.html#watcheffect' },
    { label: 'Vue Guide — Side Effect Cleanup', url: 'https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup' },
    { label: 'Vue Guide — Callback Flush Timing', url: 'https://vuejs.org/guide/essentials/watchers.html#callback-flush-timing' },
    { label: 'API — watchEffect()', url: 'https://vuejs.org/api/reactivity-core.html#watcheffect' },
    { label: 'API — onWatcherCleanup()', url: 'https://vuejs.org/api/reactivity-core.html#onwatchercleanup' },
  ],

  intro: `
\`watchEffect()\` runs a function **right away** and quietly notes every piece of reactive state that function reads. Whenever any of those values changes, Vue runs the function again.

You never write a list of what to watch. The function's own code *is* the list. Read \`title.value\` and \`body.value\` inside it, and both are watched; stop reading one, and it stops being watched.

It is the automatic sibling of [watch()](lesson:watch): same job — doing something *because* state changed — with a different way of deciding what to watch.
`,

  why: `
Some work is not "show a value on screen". It is a **side effect** — something that reaches outside the component: saving to \`localStorage\`, setting \`document.title\`, starting a timer, sending a request, talking to a chart library.

With [watch()](lesson:watch) you name each source explicitly. That is precise, but when an effect depends on four or five values, the list gets long and easy to forget to update:

\`\`\`js
// Every value used inside must ALSO be listed here — forget one and it goes stale
watch([title, body, tags, author], () => {
  saveDraft({ title: title.value, body: body.value, tags: tags.value, author: author.value })
}, { immediate: true })
\`\`\`

\`watchEffect()\` removes the duplication. The values you *use* are the values it *watches*:

\`\`\`js
watchEffect(() => {
  saveDraft({ title: title.value, body: body.value, tags: tags.value, author: author.value })
})
\`\`\`

Add a fifth field to the draft and it is watched automatically. That is the whole reason \`watchEffect\` exists: **keep side effects in sync with state without maintaining a dependency list by hand.**
`,

  eli15: `
Imagine a helper who does one chore for you — say, writing today's to-do list on the fridge whiteboard. To do it, they glance at your calendar and your homework planner.

Here's the trick: the helper **remembers exactly what they looked at**. If your calendar changes, they rewrite the whiteboard. If your planner changes, same thing. If your sock drawer changes — they don't care, they never looked at it.

That helper is \`watchEffect()\`. You give it a function. Vue runs it once immediately, remembers which reactive values it *read*, and re-runs it whenever one of those changes.

Two small rules come with it:

- If the helper needs to undo something before redoing it (wipe the whiteboard, cancel the old timer), you tell them how — that's **cleanup**.
- If the helper leaves the room halfway through (an \`await\`), anything they look at *after* coming back isn't remembered. Only what they read before leaving counts.
`,

  analogy: {
    title: 'The sous-chef who remembers what they touched',
    body: `
A head chef can give a sous-chef two kinds of instructions.

**The explicit kind** (that's \`watch()\`): "When the tomato delivery changes, remake the sauce." The sous-chef watches tomatoes and only tomatoes — even if the recipe also uses basil.

**The automatic kind** (that's \`watchEffect()\`): "Make the sauce now, and remake it whenever *anything you used* changes." The sous-chef cooks once straight away, and remembers every ingredient they actually picked up. New basil arrives? They used basil, so they remake it. New flour arrives? They never touched flour, so they ignore it.

Before plating a fresh batch, a good sous-chef clears the old plate — otherwise you end up with two sauces on the pass. That is **cleanup**.

And if the sous-chef steps out to the market mid-recipe (an \`await\`), whatever they grab after returning isn't on their "remake when this changes" list. Only ingredients touched before stepping out count.
`,
    mapping: [
      ['the sous-chef', 'the effect function you pass to `watchEffect()`'],
      ['ingredients they picked up', 'reactive values read while the effect runs'],
      ['a new delivery of a used ingredient', 'a dependency changes → the effect is queued to re-run'],
      ['clearing the old plate first', 'cleanup via `onCleanup` / `onWatcherCleanup()`'],
      ['stepping out to the market', 'an `await` — reads after it are not tracked'],
      ['"only watch the tomatoes"', '`watch(tomatoes, …)` — explicit sources'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'The same feature, two ways',
    props: {
      left: {
        label: 'watch() — explicit source',
        lang: 'js',
        code: `const userId = ref(1)
const todos = ref([])

watch(
  userId,
  async (id, oldId) => {
    todos.value = await fetchTodos(id)
  },
  { immediate: true }
)`,
      },
      right: {
        label: 'watchEffect() — automatic tracking',
        lang: 'js',
        code: `const userId = ref(1)
const todos = ref([])

watchEffect(async () => {
  // userId.value is read before the await,
  // so it is tracked
  todos.value = await fetchTodos(userId.value)
})`,
      },
      points: [
        '`watch` names its source (`userId`); `watchEffect` discovers it by *reading* `userId.value`.',
        '`watch` is lazy — it needs `immediate: true` to load on mount. `watchEffect` always runs once immediately.',
        '`watch` hands you `(id, oldId)`. `watchEffect` has no old value.',
        'In `watchEffect`, only reads made before the first `await` count. `userId.value` is evaluated as an argument before the function pauses, so it is tracked.',
        'With many inputs, `watchEffect` saves you a dependency list. With one precise trigger, `watch` documents your intent better.',
      ],
    },
    caption: 'Both load the todos for the current user and reload when `userId` changes. The difference is *how* Vue learns what to watch.',
    alt: 'Side-by-side code. Left: watch(userId, async (id, oldId) => { todos.value = await fetchTodos(id) }, { immediate: true }). Right: watchEffect(async () => { todos.value = await fetchTodos(userId.value) }). Callouts list the differences: explicit vs automatic sources, lazy vs immediate first run, old value only in watch, and only pre-await reads tracked in watchEffect.',
  },

  syntax: [
    `
**Creating an effect.** Import \`watchEffect\` from \`'vue'\` and pass it a function. It runs immediately, then again whenever something it read changes:
`,
    {
      code: `import { ref, watchEffect } from 'vue'

const query = ref('')

const stop = watchEffect(() => {
  console.log('searching for', query.value)   // query is now a dependency
})

stop()   // later: stop watching for good`,
      lang: 'js',
      title: 'basic usage',
    },
    `
**Cleaning up.** If the effect starts something that must be undone before the next run (a timer, a listener, a request), register a cleanup. There are two ways:
`,
    {
      code: `import { watchEffect, onWatcherCleanup } from 'vue'

// 1. The onCleanup argument — works in every Vue 3 version
watchEffect((onCleanup) => {
  const id = setInterval(tick, delay.value)
  onCleanup(() => clearInterval(id))
})

// 2. onWatcherCleanup() — Vue 3.5+, call it synchronously (before any await)
watchEffect(() => {
  const id = setInterval(tick, delay.value)
  onWatcherCleanup(() => clearInterval(id))
})`,
      lang: 'js',
      title: 'cleanup',
    },
    `
**Choosing when it runs (flush timing).** By default an effect re-runs *before* the component re-renders. You can move it:
`,
    {
      code: `import { watchEffect, watchPostEffect, watchSyncEffect } from 'vue'

watchEffect(fn)                      // flush: 'pre'  (default) — before the DOM update
watchEffect(fn, { flush: 'post' })   // after Vue updated the DOM
watchPostEffect(fn)                  // same as the line above
watchEffect(fn, { flush: 'sync' })   // immediately on every single change
watchSyncEffect(fn)                  // same as the line above`,
      lang: 'js',
      title: 'flush options',
    },
    `
**The rules:**

1. The effect runs **once immediately**, then re-runs when any reactive value it read *during its last run* changes.
2. Dependencies are **re-collected on every run**. An \`if\` that skips a read means that value isn't watched until a later run reads it again.
3. Only reads made **synchronously** count. In an \`async\` effect, anything read after the first \`await\` is not tracked.
4. Several changes in the same tick cause **one** re-run, not one per change (except with \`flush: 'sync'\`).
5. There is no old value. If you need "what was it before?", use [watch()](lesson:watch).
6. Effects created synchronously in \`setup\` / \`<script setup>\` stop automatically when the component unmounts. Ones created inside an async callback (a \`setTimeout\`, a promise's \`.then\`) are not bound to the component and must be stopped by you.
`,
    {
      callout: 'version',
      title: 'Version notes',
      text: '`watchEffect`, `watchPostEffect` and `watchSyncEffect` are core Vue 3 APIs. `onWatcherCleanup()` was added in **Vue 3.5**; on older versions use the `onCleanup` argument. In **3.5+** the returned handle can also be destructured: `const { stop, pause, resume } = watchEffect(fn)`.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: draftApp,
    intro: 'A note editor that auto-saves its draft. Step through how a single `watchEffect` keeps `localStorage` in sync with two inputs — without listing either of them.',
    steps: [
      { lines: [2], text: 'We import `ref` for state and `watchEffect` for the side effect.' },
      { lines: [4, 6], text: 'Three refs. `title` and `body` are bound to inputs; `status` is a message we show on screen.' },
      { lines: [7], text: '`saves` is a plain `let`. It only counts saves for the message — nothing on screen reads it directly, so it does not need to be reactive.' },
      { lines: [9, 10], text: 'The effect runs **immediately**. Building `draft` reads `title.value` and `body.value` — and those two reads are exactly what Vue now watches.' },
      { lines: [11], text: 'The actual side effect: writing to `localStorage`, something outside Vue entirely.' },
      { lines: [12, 13], text: 'Writing `status.value` is fine — the effect *writes* it but never *reads* it, so it does not become a dependency.' },
      { lines: [14], text: 'A log line so you can see each run in the console (and so tests can count runs).' },
      { lines: [20, 21], text: '`v-model` updates `title`/`body` on every keystroke. Each change queues the effect; Vue runs it once per tick, before re-rendering.' },
    ],
  },

  playground: {
    title: 'Auto-saving note draft',
    objective: 'See watchEffect discover its own dependencies, then make it conditional, stoppable and debounced with proper cleanup.',
    files: { 'App.vue': draftApp },
    expected: 'A title input, a textarea and **Saved 1 time(s)** — the effect already ran once on mount. Every keystroke in either field saves again and bumps the counter. The console shows one `saved {…}` line per run.',
    experiments: [
      {
        id: 'author',
        task: 'Add an **author** field: a new `author` ref starting at `\'Ada\'`, an `<input class="author" v-model="author" />`, and include `author: author.value` in the `draft` object. Type in it — does it save?',
        hint: 'Add `const author = ref(\'Ada\')`, then change line 10 to `const draft = { title: title.value, body: body.value, author: author.value }`. You do not need to register `author` anywhere else.',
        tests: [
          {
            name: 'typing an author saves a draft containing it',
            code: `expect(exists('.author')).toBe(true)
await type('.author', 'Grace Hopper')
await wait(400)
expect(logs.some((l) => l.startsWith('saved') && l.includes('Grace Hopper'))).toBe(true)`,
          },
        ],
        explain: 'You never told Vue "also watch author". Reading `author.value` inside the effect was enough — the effect\'s code *is* its dependency list. With `watch()` you would have had to add `author` to the sources array too.',
      },
      {
        id: 'toggle',
        task: 'Add an **Autosave** checkbox — `<input type="checkbox" class="autosave" v-model="autosave" />` backed by `const autosave = ref(true)`. When it is unchecked, the effect must **return early without saving**. Re-ticking it should save the latest text straight away.',
        hint: 'Put `if (!autosave.value) return` as the first line of the effect. Think about what the effect reads on a run that returns early.',
        tests: [
          {
            name: 'no saves while unchecked; re-checking saves the latest text',
            code: `expect(exists('.autosave')).toBe(true)
const saved = () => logs.filter((l) => l.startsWith('saved')).length
await check('.autosave', false)
await wait(400)
const before = saved()
await type('.title', 'Hardware store')
await wait(400)
expect(saved()).toBe(before)
await check('.autosave', true)
await wait(400)
expect(logs.some((l) => l.startsWith('saved') && l.includes('Hardware store'))).toBe(true)`,
          },
        ],
        explain: 'On a run that returns early, the effect reads **only** `autosave` — so `title` and `body` are not dependencies at all while it is off, and typing does not even wake the effect. Ticking the box changes `autosave`, the effect re-runs, reads the fields again, and saves. Dependencies are re-collected on every run.',
      },
      {
        id: 'stop',
        task: 'Add a **Stop autosave** button with `class="stop"` that stops the watcher permanently.',
        hint: '`watchEffect()` returns a stop function: `const stopAutosave = watchEffect(…)`. Call it from the button: `@click="stopAutosave()"`.',
        tests: [
          {
            name: 'after Stop, edits are no longer saved',
            code: `expect(exists('.stop')).toBe(true)
const saved = () => logs.filter((l) => l.startsWith('saved')).length
await click('.stop')
await wait(400)
const before = saved()
await type('.title', 'Never saved')
await type('.body', 'Nope')
await wait(400)
expect(saved()).toBe(before)
expect(logs.some((l) => l.includes('Never saved'))).toBe(false)`,
          },
        ],
        explain: 'The handle stops the effect and runs any pending cleanup. You rarely need it inside components — effects created in `setup` stop automatically on unmount — but it matters for effects you create later, conditionally, or outside components.',
      },
      {
        id: 'debounce',
        task: 'Saving on every keystroke is wasteful. Delay the save by **300 ms** with `setTimeout`, and use `onWatcherCleanup()` (Vue 3.5+) to cancel the pending timer whenever the effect re-runs — so a burst of typing produces **one** save of the final text.',
        hint: 'Keep reading `title.value` and `body.value` **synchronously** at the top (build `draft` first), then `const timer = setTimeout(() => { /* save + log */ }, 300)` and `onWatcherCleanup(() => clearTimeout(timer))`. Import `onWatcherCleanup` from `\'vue\'`. If you read the refs inside the `setTimeout` callback instead, they will not be tracked!',
        tests: [
          {
            name: 'a burst of typing is saved once, and later edits still save',
            code: `const saves = () => logs.filter((l) => l.startsWith('saved'))
const start = saves().length
await type('.title', 'G')
await type('.title', 'Gr')
await type('.title', 'Gro')
await wait(450)
expect(saves().length - start).toBe(1)
expect(saves()[saves().length - 1]).toContain('Gro')
await type('.title', 'Grocery run')
await wait(450)
expect(saves().length - start).toBe(2)`,
          },
        ],
        explain: 'Each keystroke re-runs the effect, and *before* it re-runs Vue calls the cleanup from the previous run, cancelling its timer. Only the last timer survives. The second half of the test catches a subtle bug: if the refs were read inside the `setTimeout` callback, they would not be tracked and later edits would never save.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'When does each flush mode run?',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'write', label: 'State changes', note: "title.value = 'Hi'", tone: 'acid', x: 90, y: 200 },
        { id: 'sync', label: "flush: 'sync'", note: 'runs inside the write', tone: 'red', x: 250, y: 70 },
        { id: 'pre', label: "flush: 'pre' (default)", note: 'DOM still old', tone: 'cobalt', x: 250, y: 200 },
        { id: 'render', label: 'Component re-renders', note: 'DOM patched', tone: 'ink', x: 420, y: 200 },
        { id: 'post', label: "flush: 'post'", note: 'sees the new DOM', tone: 'cobalt', x: 580, y: 200 },
        { id: 'tick', label: 'await nextTick()', note: 'resumes', tone: 'kraft', x: 700, y: 90 },
      ],
      edges: [
        { from: 'write', to: 'sync', label: 'immediately', dashed: true },
        { from: 'write', to: 'pre', label: 'queued' },
        { from: 'pre', to: 'render' },
        { from: 'render', to: 'post' },
        { from: 'post', to: 'tick' },
      ],
      steps: [
        { focus: ['write'], text: 'Your code changes state, e.g. `title.value = \'Hi\'` in a click handler. Effects that read `title` are notified.' },
        { focus: ['sync'], edges: ['write->sync'], text: 'A `flush: \'sync\'` effect (`watchSyncEffect`) runs **right now**, inside the assignment, before your next line of code. Change three things and it runs three times. Powerful, rarely needed.' },
        { focus: ['pre'], edges: ['write->pre'], text: 'Everything else is **queued** and runs together in a later microtask. Default `\'pre\'` effects run first — after any parent component updates, but **before** this component\'s DOM is patched. The DOM still shows the old text.' },
        { focus: ['render'], edges: ['pre->render'], text: 'The component re-renders and Vue patches only the DOM that changed. State changes made by `\'pre\'` effects are included in this same render.' },
        { focus: ['post'], edges: ['render->post'], text: '`flush: \'post\'` effects (`watchPostEffect`) run **after** the DOM update — the right place to measure an element or scroll to the newest message.' },
        { focus: ['tick'], edges: ['post->tick'], text: 'Once the whole flush is finished, code waiting on `await nextTick()` continues. See [nextTick()](lesson:next-tick) for batching in depth.' },
      ],
    },
    caption: 'One state change, three possible moments for an effect to run. Most effects should keep the default `pre`; use `post` when you need the updated DOM.',
    alt: 'A flow diagram. "State changes" has a dashed arrow labelled "immediately" up to "flush: sync", and a solid arrow labelled "queued" to "flush: pre (default) — DOM still old", which leads to "Component re-renders — DOM patched", then to "flush: post — sees the new DOM", then to "await nextTick() resumes".',
  },

  internals: {
    beginner: `
While your effect runs, Vue is "listening". Every time the effect reads a reactive value, Vue writes down "this effect depends on that value". When one of those values changes later, Vue puts the effect on a to-do list and runs it again soon — after first calling your cleanup. On each new run the list of dependencies is thrown away and written again from scratch, which is why an \`if\` can change what is watched.
`,
    technical: [
      `
\`watchEffect()\` is built on the same machinery as everything else in Vue's reactivity: a **reactive effect**. While an effect runs, Vue marks it as the *active effect*; every reactive getter that runs in the meantime calls an internal \`track()\` which records "active effect depends on me". A setter calls \`trigger()\`, which notifies the dependent effects. (Track and trigger are covered in depth in [How reactivity works](lesson:how-reactivity-works).)
`,
      {
        code: `// A simplified model of watchEffect — NOT Vue's real source
function watchEffect(fn) {
  let cleanup = null
  const onCleanup = (cb) => { cleanup = cb }

  const run = () => {
    if (cleanup) { cleanup(); cleanup = null }  // undo the previous run
    clearDependencies(run)                      // forget last run's reads
    activeEffect = run                          // start listening
    try {
      fn(onCleanup)                             // reads in here are tracked
    } finally {
      activeEffect = null                       // stop listening
    }
  }

  run.scheduler = () => queuePreFlush(run)      // re-runs are queued, not instant
  run()                                         // first run: immediately

  return () => { stop(run); if (cleanup) cleanup() }
}`,
        lang: 'js',
        title: 'mental model (simplified)',
      },
      `
Three behaviours fall straight out of that model:

- **Why reads after \`await\` are not tracked.** \`activeEffect\` is only set while \`fn\` runs *synchronously*. An \`async\` function returns at its first \`await\`; the \`finally\` has already cleared \`activeEffect\` by the time the rest of the function resumes in a later microtask, so later reads have no effect to attach to.
- **Why dependencies are dynamic.** Each run starts by forgetting the old dependencies, so only the values read on the *latest* run are watched.
- **Why several changes cause one run.** The scheduler puts the effect in a queue; queueing the same job twice is a no-op. The queue is flushed in a microtask, so ten changes in one click handler produce one re-run (with \`flush: 'sync'\` there is no queue, so each change runs the effect).

In Vue's actual source, \`watchEffect\` and \`watch\` share one implementation: \`watchEffect(fn)\` is essentially "a watcher whose source is \`fn\` and that has no separate callback". That is also why both accept the same \`flush\`, \`onTrack\` and \`onTrigger\` options and both return the same kind of stop handle. How that implementation is organised (which package, which internal functions) is an implementation detail that has changed between minor versions — rely only on the public API.
`,
    ],
    production: `
- **Pick by intent.** Use \`watchEffect\` when the effect naturally uses several values and should stay in sync with all of them (saving drafts, syncing \`document.title\`, configuring a chart). Use [watch()](lesson:watch) when one specific change should trigger work, when you need the old value, or when the effect reads things that must *not* trigger it.
- **Keep effects small.** A big effect that reads ten values re-runs whenever any of them changes. Two small effects with clear purposes are easier to reason about than one that does everything.
- **Always clean up what you start** — intervals, event listeners, sockets, in-flight requests. Without cleanup, each re-run stacks another copy, which shows up as doubled ticks, duplicate requests or memory growth.
- **Create effects synchronously in setup.** Then they stop with the component. An effect created inside an async callback (\`setTimeout\`, \`.then\`, a third-party event handler) isn't bound to the component and will keep running after unmount unless you call its stop handle. To manage many effects as a group, see [effectScope()](lesson:effect-scope).
- **Don't use it to derive state.** \`watchEffect(() => { total.value = a.value + b.value })\` works but costs an extra update cycle and splits one fact across two places. That is what [computed()](lesson:computed) is for.
- **Beware accidental deep reads.** \`JSON.stringify(state)\` or logging a whole reactive object inside an effect reads *every* nested property, so the effect re-runs on any change anywhere in that object. Sometimes that's what you want (a draft autosave); often it isn't.
- **Debug with \`onTrack\` / \`onTrigger\`.** Passing \`{ onTrigger(e) { debugger } }\` pauses whenever a dependency triggers the effect and shows which one. These hooks only work in development builds. More in [Debugging reactivity](lesson:debugging-reactivity).
`,
  },

  mistakes: [
    {
      title: 'Reading a dependency after `await`',
      wrong: {
        code: `watchEffect(async () => {
  const user = await fetchUser(userId.value)
  posts.value = await fetchPosts(user.id, page.value) // page is NOT tracked
})`,
        lang: 'js',
      },
      right: {
        code: `watchEffect(async () => {
  const id = userId.value      // read everything you depend on first
  const p = page.value
  const user = await fetchUser(id)
  posts.value = await fetchPosts(user.id, p)
})`,
        lang: 'js',
      },
      explanation: 'Only synchronous reads are tracked. `page.value` is read after the first `await`, so changing the page never re-runs the effect. Read every dependency at the top, before any `await` — or switch to `watch([userId, page], …)` so the sources are explicit.',
    },
    {
      title: 'Starting something without cleaning it up',
      wrong: {
        code: `watchEffect(() => {
  setInterval(() => poll(endpoint.value), 5000)
  // every change of endpoint starts ANOTHER interval
})`,
        lang: 'js',
      },
      right: {
        code: `watchEffect((onCleanup) => {
  const url = endpoint.value
  const id = setInterval(() => poll(url), 5000)
  onCleanup(() => clearInterval(id))
})`,
        lang: 'js',
      },
      explanation: 'Every re-run starts a new interval while the old ones keep going. Register a cleanup so Vue stops the previous interval before the next run (and when the watcher stops). Note the right version reads `endpoint.value` synchronously too — inside the interval callback it would not be tracked.',
    },
    {
      title: 'Using watchEffect to compute a value',
      wrong: {
        code: `const fullName = ref('')
watchEffect(() => {
  fullName.value = first.value + ' ' + last.value
})`,
        lang: 'js',
      },
      right: {
        code: `const fullName = computed(() => first.value + ' ' + last.value)`,
        lang: 'js',
      },
      explanation: 'If the "effect" only produces a value from other values, it is not a side effect — it is derived state. `computed()` is cached, lazy, read-only and always consistent; the watchEffect version needs an extra ref and briefly holds a stale value. See [computed()](lesson:computed).',
    },
    {
      title: 'Creating an effect inside an async callback',
      wrong: {
        code: `<script setup>
loadConfig().then((config) => {
  watchEffect(() => applyTheme(config.theme, darkMode.value))
  // created in a callback: not bound to the component,
  // keeps running after unmount
})
</script>`,
        lang: 'vue',
      },
      right: {
        code: `<script setup>
const config = ref(null)
watchEffect(() => {
  if (config.value) applyTheme(config.value.theme, darkMode.value)
})
loadConfig().then((c) => (config.value = c))
</script>`,
        lang: 'vue',
      },
      explanation: 'Effects are tied to the component only when they are created synchronously while setup is running. Inside a `.then`, `setTimeout` or third-party callback, Vue no longer knows which component is current. Create the effect first and let it react to the data arriving — or keep the stop handle and call it in `onUnmounted`. (Top-level `await` in `<script setup>` is a special case: the compiler restores the component context after the `await`, so watchers created there are still bound.)',
    },
  ],

  debugging: [
    {
      symptom: 'The effect ran once on mount, but changing one particular value never re-runs it.',
      cause: 'That value is read after an `await`, inside a callback (`setTimeout`, `.then`), or in a branch the last run skipped — so it is not a dependency.',
      fix: 'Read it synchronously at the top of the effect, or use `watch()` with explicit sources.',
    },
    {
      symptom: 'The effect re-runs far more often than expected.',
      cause: 'It reads more reactive state than you think — a helper function that reads extra refs, or `JSON.stringify`/logging of a whole reactive object, which reads every nested property.',
      fix: 'Add `{ onTrigger(e) { console.log(e) } }` (dev only) to see which dependency triggered it. Narrow the reads, split the effect, or switch to `watch()` with a precise source.',
    },
    {
      symptom: 'An effect that reads the DOM (heights, scroll position, element text) sees the previous state.',
      cause: 'Default `flush: \'pre\'` effects run before the component re-renders.',
      fix: 'Use `watchPostEffect()` / `{ flush: \'post\' }`, or `await nextTick()` inside the effect before reading the DOM.',
    },
    {
      symptom: 'Ticks double, requests are sent twice, or event handlers fire multiple times after a few changes.',
      cause: 'Each re-run starts a new interval/listener/request and nothing stops the old one.',
      fix: 'Register a cleanup with `onCleanup` or `onWatcherCleanup()` (3.5+) that undoes what the run started.',
    },
    {
      symptom: 'Console warnings or errors keep appearing after the component was closed.',
      cause: 'The effect was created inside an async callback (a timer, a promise `.then`, a third-party event), so it was never bound to the component instance.',
      fix: 'Create it synchronously in setup, or store the returned handle and call it in `onUnmounted()`.',
    },
    {
      symptom: '"Maximum recursive updates exceeded" warning.',
      cause: 'Effects (or an effect and a computed/render) keep writing state that re-triggers each other in a cycle.',
      fix: 'Find the write that feeds back into a dependency. Derive the value with `computed()` instead, or guard the write so it only happens when the value actually differs.',
    },
  ],

  bestPractices: [
    'Read every dependency synchronously at the top of the effect — especially in async effects.',
    'Register a cleanup for anything the effect starts: timers, listeners, subscriptions, requests.',
    'Use `onWatcherCleanup()` on Vue 3.5+ (called before any `await`); use the `onCleanup` argument when you must support older versions.',
    'Keep each effect focused on one side effect; split unrelated work into separate effects.',
    'Prefer `computed()` for values and `watchEffect`/`watch` only for side effects.',
    'Create effects synchronously in setup so they stop with the component; keep the stop handle for any created later.',
    'Use `watchPostEffect` only when the effect genuinely needs the updated DOM.',
  ],

  useCases: [
    'Auto-saving a form or editor draft to `localStorage` as the user types.',
    'Keeping `document.title` in sync with unread counts or the current page.',
    'Re-fetching data whenever any filter (search text, category, page) changes.',
    'Configuring a third-party widget (chart, map, editor) from several reactive options.',
    'Starting a timer or polling interval whose behaviour depends on reactive settings, with cleanup.',
    'Measuring or scrolling DOM elements after updates with `watchPostEffect`.',
  ],

  whenToUse: {
    use: [
      'The side effect uses several reactive values and should re-run when any of them changes.',
      'You want it to run immediately and stay in sync from then on.',
      'The set of values it depends on changes with conditions (dynamic dependencies).',
    ],
    avoid: [
      'You only need a value derived from state — use `computed()`.',
      'You need the previous value, or want the effect to run only when one specific source changes — use `watch()`.',
      'Most of the work happens after `await` and depends on values read there — use `watch()` with explicit sources so tracking is not fragile.',
      'The effect reads reactive data it must not react to — `watch()` lets you read anything inside the callback without tracking it.',
    ],
  },

  comparison: {
    title: 'watchEffect vs watch vs computed',
    headers: ['', '`watchEffect()`', '`watch()`', '`computed()`'],
    rows: [
      ['Purpose', 'side effects, automatically tracked', 'side effects, explicit sources', 'derive a value'],
      ['What is watched', 'every reactive value read synchronously in the last run', 'exactly the source(s) you pass', 'every reactive value its getter reads'],
      ['First run', 'immediately', 'lazily — on the first change (unless `immediate: true`)', 'lazily — on the first read'],
      ['Old value', 'no', 'yes: `(newValue, oldValue)`', 'previous value via the getter argument (3.4+)'],
      ['Async work', 'allowed, but only reads before the first `await` are tracked', 'allowed; tracking is unaffected because sources are explicit', 'never — getters must be synchronous and pure'],
      ['Returns', 'a stop handle', 'a stop handle', 'a ref holding the value'],
      ['Typical example', 'auto-save a draft from several fields', 'fetch when `userId` changes', '`total` of a cart'],
    ],
    note: 'Rule of thumb: value → `computed`; one precise trigger or old value needed → `watch`; "keep this side effect in sync with whatever it uses" → `watchEffect`.',
  },

  quiz: [
    {
      id: 'watch-effect-q1',
      type: 'mcq',
      prompt: 'When does a `watchEffect` callback run for the **first** time?',
      options: [
        { text: 'Immediately, when `watchEffect()` is called.' },
        { text: 'The first time one of its dependencies changes.', why: 'That is `watch()`\'s default (lazy) behaviour. `watchEffect` must run once to discover its dependencies.' },
        { text: 'After the component is mounted.', why: 'Default effects run immediately during setup. Only `flush: \'post\'` effects wait for the DOM to be ready.' },
        { text: 'Only when you call the returned handle.', why: 'The returned handle *stops* the effect; it does not start it.' },
      ],
      answer: 0,
      explanation: '`watchEffect` runs its function straight away — that first run is how it learns which reactive values it depends on.',
    },
    {
      id: 'watch-effect-q2',
      type: 'output',
      prompt: 'This runs inside `<script setup>`. What does the console show, in order, once Vue has flushed its updates?',
      code: {
        lang: 'js',
        code: `const count = ref(0)

watchEffect(() => {
  console.log('effect', count.value)
})

console.log('after')
count.value++
count.value++
console.log('end')`,
      },
      options: [
        { text: 'effect 0 · after · effect 1 · effect 2 · end', why: 'Re-runs are not synchronous — they are queued and batched, so the two increments cause one re-run later.' },
        { text: 'effect 0 · after · end · effect 2' },
        { text: 'after · end · effect 2', why: 'The first run happens immediately, before `after` is logged.' },
        { text: 'after · effect 0 · end · effect 1 · effect 2', why: 'The first run is synchronous inside `watchEffect()`, and the two changes are batched into a single re-run.' },
      ],
      answer: 1,
      explanation: 'The first run is synchronous (`effect 0`). The two increments each notify the effect, but re-runs are queued and de-duplicated, so after the synchronous code finishes (`after`, `end`) the effect runs once and sees the final value: `effect 2`.',
    },
    {
      id: 'watch-effect-q3',
      type: 'bug',
      prompt: 'Changing `userId` reloads the posts, but clicking **Next page** (`page.value++`) does nothing. Click the line that causes the bug.',
      code: {
        lang: 'js',
        code: `import { ref, watchEffect } from 'vue'

const userId = ref(1)
const page = ref(1)
const posts = ref([])

watchEffect(async () => {
  const user = await fetchUser(userId.value)
  posts.value = await fetchPosts(user.id, page.value)
})`,
      },
      answerLine: 9,
      explanation: '`page.value` is read after the first `await`, when Vue is no longer tracking this effect, so `page` never becomes a dependency. Read it before the first `await` (`const p = page.value` at the top) or use `watch([userId, page], …)`.',
    },
    {
      id: 'watch-effect-q4',
      type: 'fill',
      prompt: 'Fill the blanks so a new search **cancels the previous request** before it starts.',
      code: {
        lang: 'js',
        code: `import { ref, ___ } from 'vue'

const query = ref('')

watchEffect((___) => {
  const controller = new AbortController()
  fetch('/api/search?q=' + query.value, { signal: controller.signal })
  onCleanup(() => controller.___())
})`,
      },
      answer: [['watchEffect'], ['onCleanup'], ['abort']],
      explanation: 'The effect function receives a cleanup registrar (conventionally called `onCleanup`). The registered function runs before the next run and when the watcher stops — a perfect place to abort the outdated request with `controller.abort()`.',
    },
    {
      id: 'watch-effect-q5',
      type: 'mcq',
      prompt: 'After a new message is pushed to a chat list, you want to scroll the list to the bottom using the element\'s new `scrollHeight`. Which is the right tool?',
      options: [
        { text: '`watchEffect(fn)` with the default flush', why: 'Default (`pre`) effects run before the component re-renders, so the new message is not in the DOM yet.' },
        { text: '`watchPostEffect(fn)` (or `flush: \'post\'`)' },
        { text: '`watchSyncEffect(fn)`', why: '`sync` runs at the moment of the change — even earlier than `pre`, long before the DOM is updated.' },
        { text: 'A `computed()` that returns the scroll height', why: 'Computed getters must be pure and depend on reactive state, not on the DOM.' },
      ],
      answer: 1,
      explanation: '`post` effects run after Vue has patched the DOM, so the new message element exists and `scrollHeight` is up to date.',
    },
    {
      id: 'watch-effect-q6',
      type: 'mcq',
      prompt: 'Right now `showDetails.value` is `false`. Which changes will re-run this effect? (Select all that apply.)',
      code: {
        lang: 'js',
        code: `const showDetails = ref(false)
const user = reactive({ name: 'Ada', email: 'ada@example.com' })

watchEffect(() => {
  if (showDetails.value) {
    console.log(user.name, user.email)
  } else {
    console.log(user.name)
  }
})`,
      },
      options: [
        { text: '`showDetails.value = true`' },
        { text: '`user.name = \'Grace\'`' },
        { text: '`user.email = \'grace@example.com\'`', why: 'The last run took the `else` branch and never read `user.email`, so it is not a dependency — until a run reads it again.' },
      ],
      answer: [0, 1],
      explanation: 'Dependencies come from the **last run**. It read `showDetails` and `user.name`. Once `showDetails` becomes `true`, the next run reads `user.email` too, and from then on email changes re-run it.',
    },
    {
      id: 'watch-effect-q7',
      type: 'short',
      prompt: 'In two or three sentences: how do `watch()` and `watchEffect()` decide what to watch, and when would you pick each?',
      answer: '`watch()` watches exactly the sources you pass and is lazy by default; it gives you the new and old values. `watchEffect()` runs immediately and watches whatever reactive values it reads during each run. I pick `watchEffect` to keep a side effect in sync with everything it uses, and `watch` when one specific change should trigger the work, when I need the old value, or when async code makes automatic tracking fragile.',
    },
  ],

  exercises: [
    {
      id: 'inbox-title',
      title: 'Unread count in the browser tab',
      difficulty: 'beginner',
      prompt: `
Show the unread count in the browser tab's title, like many mail apps do.

- The starter has a list of messages and a \`computed\` \`unread\` count.
- Use \`watchEffect\` so that \`document.title\` is **\`(N) Inbox\`** when there are N unread messages, and just **\`Inbox\`** when there are none.
- Each message's button has \`class="read"\` and marks that message as read. The **Mark all read** button has \`class="mark-all"\`.
- The title must be correct immediately on load and after every change.
`,
      files: {
        'App.vue': `<script setup>
import { reactive, computed, watchEffect } from 'vue'

const messages = reactive([
  { id: 1, subject: 'Your order has shipped', read: false },
  { id: 2, subject: 'Team lunch on Friday?', read: false },
  { id: 3, subject: 'Weekly newsletter', read: true },
  { id: 4, subject: 'Password changed', read: false },
])

const unread = computed(() => messages.filter((m) => !m.read).length)

function markAllRead() {
  messages.forEach((m) => (m.read = true))
}

// TODO: keep document.title in sync with the unread count
</script>

<template>
  <h2>Inbox ({{ unread }} unread)</h2>
  <ul>
    <li v-for="m in messages" :key="m.id" class="message">
      <strong v-if="!m.read">{{ m.subject }}</strong>
      <span v-else>{{ m.subject }}</span>
      <button v-if="!m.read" class="read" @click="m.read = true">Mark read</button>
    </li>
  </ul>
  <button class="mark-all" @click="markAllRead">Mark all read</button>
</template>`,
      },
      hints: [
        '`document.title` lives outside Vue, so updating it is a side effect — a job for `watchEffect`.',
        'Inside `watchEffect(() => { … })`, read `unread.value` and assign `document.title`. Because the effect runs immediately, the title is right on load too.',
        "Use a ternary: `document.title = unread.value > 0 ? '(' + unread.value + ') Inbox' : 'Inbox'` (a template string works just as well).",
      ],
      solution: {
        explanation: 'The effect reads `unread.value`, so the computed becomes its dependency — and the computed in turn depends on every message\'s `read` flag. Clicking any button changes a flag, the computed changes, and the effect re-runs. Because `watchEffect` runs immediately, there is no separate "set it on mount" code to forget.',
        files: {
          'App.vue': `<script setup>
import { reactive, computed, watchEffect } from 'vue'

const messages = reactive([
  { id: 1, subject: 'Your order has shipped', read: false },
  { id: 2, subject: 'Team lunch on Friday?', read: false },
  { id: 3, subject: 'Weekly newsletter', read: true },
  { id: 4, subject: 'Password changed', read: false },
])

const unread = computed(() => messages.filter((m) => !m.read).length)

function markAllRead() {
  messages.forEach((m) => (m.read = true))
}

watchEffect(() => {
  document.title = unread.value > 0 ? \`(\${unread.value}) Inbox\` : 'Inbox'
})
</script>

<template>
  <h2>Inbox ({{ unread }} unread)</h2>
  <ul>
    <li v-for="m in messages" :key="m.id" class="message">
      <strong v-if="!m.read">{{ m.subject }}</strong>
      <span v-else>{{ m.subject }}</span>
      <button v-if="!m.read" class="read" @click="m.read = true">Mark read</button>
    </li>
  </ul>
  <button class="mark-all" @click="markAllRead">Mark all read</button>
</template>`,
        },
      },
      tests: [
        { name: 'title shows 3 unread on load', code: `expect(document.title).toBe('(3) Inbox')` },
        { name: 'marking one read updates the title', code: `await click('.read'); expect(document.title).toBe('(2) Inbox')` },
        { name: 'no unread messages → plain "Inbox"', code: `await click('.mark-all'); expect(document.title).toBe('Inbox')` },
      ],
    },
    {
      id: 'stale-search',
      title: 'Search that ignores stale answers',
      difficulty: 'intermediate',
      prompt: `
The starter is a package search box. It uses \`watchEffect\` to call a fake API (\`api.js\`) whenever the query changes. **Shorter queries answer more slowly**, so if you type \`v\` and then quickly \`vit\`, the old answer for \`v\` arrives *last* and overwrites the correct results.

Fix it with effect cleanup:

- When the query changes while a request is still pending, the old request's answer must be **ignored**.
- Keep the selectors: the input has \`class="search"\`, each result is an \`<li class="result">\`, and the count is in \`class="count"\`.
- Use \`onWatcherCleanup()\` (Vue 3.5+) or the effect's \`onCleanup\` argument.
`,
      files: { 'App.vue': searchStarter, 'api.js': searchApi },
      hints: [
        'Before the next run, Vue calls the cleanup registered by the previous run. That is your signal that the previous answer is now stale.',
        'Create a local `let stale = false` in each run, and register `onWatcherCleanup(() => { stale = true })` **before** the `await`.',
        'After `const found = await searchPackages(q)`, only assign when the run is still current: `if (!stale) results.value = found`.',
      ],
      solution: {
        explanation: 'Each run of the effect gets its own `stale` flag through the closure. When the query changes, Vue runs the previous run\'s cleanup first — flipping *that* run\'s flag — and then starts a new run with a fresh flag. When the slow, outdated answer finally arrives, its run sees `stale === true` and drops it. `onWatcherCleanup()` must be called synchronously, so it goes before the `await`. (With a real `fetch`, you would also call `controller.abort()` in the cleanup to cancel the request itself.)',
        files: { 'App.vue': searchSolution, 'api.js': searchApi },
      },
      tests: [
        {
          name: 'shows results for the query',
          code: `await type('.search', 'pin')
await wait(400)
expect(findAll('.result').map((li) => li.textContent.trim())).toEqual(['pinia'])
expect(text('.count')).toBe('1 result(s)')`,
        },
        {
          name: 'a slow, outdated answer does not overwrite newer results',
          code: `await type('.search', 'v')
await type('.search', 'vit')
await wait(450)
expect(findAll('.result').map((li) => li.textContent.trim())).toEqual(['vite', 'vitest'])`,
        },
        {
          name: 'clearing the query clears the results',
          code: `await type('.search', 'nuxt')
await wait(400)
await type('.search', '')
await wait(100)
expect(findAll('.result')).toHaveLength(0)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'watch-effect-tracking-basics',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What does `watchEffect()` do, and how does it know what to watch?',
      answer: 'It runs a function immediately and re-runs it whenever any reactive value read during the last run changes. It knows what to watch because Vue tracks every reactive read made while the function runs — there is no explicit dependency list.',
      explanation: 'The function body doubles as the dependency list: read `a.value` and `b.value` and both are watched. Dependencies are re-collected on every run.',
      code: {
        lang: 'js',
        code: `const city = ref('Pune')
const units = ref('metric')

watchEffect(() => {
  loadWeather(city.value, units.value) // both are dependencies
})`,
      },
      whyAsked: 'Checks that you understand automatic dependency tracking rather than treating `watchEffect` as "watch everything".',
      mistakes: [
        'Saying it watches all component state.',
        'Saying it is lazy like `watch()`.',
        'Not mentioning that dependencies can change from run to run.',
      ],
      followUps: [
        'What happens to values read after an `await`?',
        'How do you stop a `watchEffect`?',
        'Why does it need to run immediately?',
      ],
      modelAnswer: '`watchEffect` takes a function, runs it right away, and while it runs Vue records every reactive value it reads. Those reads become its dependencies, so when any of them changes the function is queued to run again. The dependencies are re-collected on every run, so conditional code can change what is watched. It has to run immediately because running is how it discovers what to watch. I use it for side effects like saving a draft or syncing `document.title`.',
    },
    {
      id: 'watch-effect-vs-watch',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare `watch()` and `watchEffect()`. When would you choose each?',
      answer: '`watch()` watches explicit sources, is lazy by default (unless `immediate: true`), gives you new and old values, and only reacts to those sources. `watchEffect()` runs immediately, automatically tracks whatever it reads synchronously, has no old value, and re-collects dependencies each run. Choose `watchEffect` to keep a side effect in sync with everything it uses; choose `watch` for a precise trigger, when you need the old value, or when async code would make automatic tracking unreliable.',
      explanation: 'Same engine, different contract: "watch these and call me" vs "run this and re-run when anything it used changes".',
      code: {
        lang: 'js',
        code: `// precise trigger, old value available, lazy
watch(userId, (id, oldId) => loadProfile(id))

// immediate, auto-tracked: re-runs when title OR body changes
watchEffect(() => saveDraft({ title: title.value, body: body.value }))`,
      },
      whyAsked: 'A classic. It reveals whether you know the trade-off between explicitness and convenience and the async-tracking trap.',
      mistakes: [
        'Saying one is "better" without context.',
        'Forgetting that `watch` is lazy and `watchEffect` is immediate.',
        'Not mentioning the old value or the `await` tracking limitation.',
        'Using either to derive values that should be `computed`.',
      ],
      followUps: [
        'How do you make `watch` behave like `watchEffect` for the first run?',
        'What if the effect reads a value that should not trigger it?',
        'How does cleanup work in each?',
      ],
      modelAnswer: 'Both run side effects in response to reactive changes and share the same flush and stop behaviour. `watch` takes explicit sources: it is lazy unless I pass `immediate: true`, it gives me `newValue` and `oldValue`, and only those sources trigger it — anything else read in the callback is not tracked. `watchEffect` runs immediately and tracks whatever it reads synchronously, so there is no dependency list to maintain, but no old value either, and reads after an `await` are not tracked. I use `watchEffect` for "keep this in sync with everything it uses", like auto-saving a draft, and `watch` for a specific trigger like fetching when an id changes. For derived values I use neither — that is `computed`.',
    },
    {
      id: 'watch-effect-dynamic-deps',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Inside an async function, each change below is followed by `await nextTick()`. What is logged, in order?',
      code: {
        lang: 'js',
        code: `const loggedIn = ref(false)
const name = ref('Ada')

watchEffect(() => {
  console.log(loggedIn.value ? 'Hi ' + name.value : 'Please log in')
})

name.value = 'Grace'
await nextTick()
loggedIn.value = true
await nextTick()
name.value = 'Linus'
await nextTick()`,
      },
      options: [
        'Please log in · Please log in · Hi Grace · Hi Linus',
        'Please log in · Hi Grace · Hi Linus',
        'Please log in · Hi Linus',
        'Hi Ada · Hi Grace · Hi Linus',
      ],
      correctOption: 1,
      answer: '`Please log in`, then `Hi Grace`, then `Hi Linus`. The first run only read `loggedIn`, so changing `name` to Grace triggered nothing. Logging in re-runs the effect, which now reads `name` (Grace) too, so the final change to Linus re-runs it again.',
      explanation: 'Dependencies are collected per run. The ternary short-circuits, so `name` is only a dependency while `loggedIn` is true.',
      whyAsked: 'Tests whether you truly understand dynamic dependency tracking — a common source of "why didn\'t my effect run?" questions.',
      mistakes: [
        'Assuming every ref mentioned anywhere in the function is tracked.',
        'Expecting a second "Please log in" when the name changes.',
        'Forgetting the immediate first run.',
      ],
      followUps: [
        'How would `watch([loggedIn, name], …)` behave differently?',
        'How can you see which dependency triggered a run?',
      ],
      modelAnswer: 'It logs "Please log in", "Hi Grace", "Hi Linus". `watchEffect` tracks only what each run actually reads. The first run took the false branch, so only `loggedIn` was a dependency and the name change was ignored. When `loggedIn` became true the effect re-ran, read `name` — now Grace — and from then on `name` was tracked, so changing it to Linus triggered another run. With `watch([loggedIn, name])` the name change would have triggered the callback even while logged out.',
    },
    {
      id: 'watch-effect-async-tracking',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'This effect reloads products when the user logs in, but changing the category filter never reloads anything. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `watchEffect(async () => {
  const token = await getToken(session.userId)
  products.value = await api.products({
    token,
    category: filters.category,
    sort: filters.sort,
  })
})`,
      },
      answer: 'Only `session.userId` is read before the first `await`. `filters.category` and `filters.sort` are read after it, when the effect is no longer being tracked, so they are not dependencies. Read them synchronously at the top (`const { category, sort } = filters` before the `await`), or use `watch(() => [session.userId, filters.category, filters.sort], …)`.',
      explanation: 'Vue tracks reads only while the effect runs synchronously. An async function pauses at its first `await`; the rest runs later, outside tracking.',
      whyAsked: 'This is one of the most common real-world `watchEffect` bugs, and fixing it shows you understand how tracking works, not just the API.',
      mistakes: [
        'Blaming the API or caching.',
        'Suggesting `deep: true` (not a `watchEffect` option and not the problem).',
        'Adding `nextTick()` calls.',
      ],
      followUps: [
        'Why does destructuring `filters` at the top fix it?',
        'How would you also cancel the stale request when filters change quickly?',
      ],
      modelAnswer: 'The filters are read after the first `await`. `watchEffect` only tracks reads made while the function runs synchronously — once it hits `await getToken`, tracking for this run is over, so `filters.category` and `filters.sort` never become dependencies. The fix is to read everything I depend on before awaiting, for example `const { category, sort } = filters` at the top, or switch to `watch` with an explicit getter source, which makes the dependencies independent of where the reads happen. I would also add a cleanup so a stale response is ignored when filters change mid-request.',
    },
    {
      id: 'watch-effect-flush-post',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A chat window should auto-scroll to the newest message. The team wrote `watchEffect(() => { messages.value.length; list.value.scrollTop = list.value.scrollHeight })`, but it always scrolls to the *previous* last message. Explain and fix.',
      answer: 'Default effects use `flush: \'pre\'`: they run after the state change but before the component re-renders, so the new message is not in the DOM yet and `scrollHeight` is stale. Use `watchPostEffect()` (or `flush: \'post\'`), which runs after the DOM is patched — or `await nextTick()` before measuring.',
      explanation: 'Flush timing decides whether the effect sees the old or the new DOM. `post` exists precisely for DOM reads after updates.',
      code: {
        lang: 'js',
        code: `watchPostEffect(() => {
  messages.value.length          // dependency: re-run when a message is added
  const el = list.value
  if (el) el.scrollTop = el.scrollHeight
})`,
      },
      whyAsked: 'Checks practical knowledge of Vue\'s update scheduling — the difference between "state changed" and "DOM updated".',
      mistakes: [
        'Wrapping it in `setTimeout` without understanding why it "works".',
        'Choosing `flush: \'sync\'`, which runs even earlier.',
        'Thinking Vue updates the DOM synchronously on assignment.',
      ],
      followUps: [
        'What are the three flush modes and their aliases?',
        'Why is `sync` usually discouraged?',
        'How would you avoid scrolling if the user has scrolled up to read history?',
      ],
      modelAnswer: 'By default a watcher runs in the `pre` flush: Vue batches the state change, runs pre watchers, then re-renders. So when the effect reads `scrollHeight`, the new message has not been rendered yet. Switching to `watchPostEffect` — `flush: \'post\'` — runs the effect after the component has patched the DOM, so the measurement includes the new message. An alternative is `await nextTick()` before reading. I would avoid `flush: \'sync\'` because it runs synchronously on every change, even earlier and with no batching.',
    },
    {
      id: 'watch-effect-lifetime',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You are writing a composable that starts several effects (timers, listeners, a socket subscription). How do you make sure nothing leaks when the component using it goes away — or when the effects are re-run?',
      answer: 'Two layers: per-run cleanup and lifetime. Each effect registers cleanup (`onCleanup` or `onWatcherCleanup()` in 3.5+) for whatever it starts, so re-runs never stack duplicates. For lifetime, create effects synchronously during the caller\'s setup so they are bound to the component and stop on unmount; if they must be created later or outside a component, keep their stop handles (or group them in an `effectScope()` and call `scope.stop()`), and use `onScopeDispose()` for non-effect teardown.',
      explanation: 'Cleanup handles "this run is outdated"; stopping handles "this whole thing is over". Leaks happen when either is missing.',
      code: {
        lang: 'js',
        code: `export function usePolling(url, intervalMs) {
  const data = ref(null)

  watchEffect((onCleanup) => {
    const target = toValue(url)          // tracked
    const ms = toValue(intervalMs)       // tracked
    const id = setInterval(async () => {
      data.value = await fetchJson(target)
    }, ms)
    onCleanup(() => clearInterval(id))   // per-run cleanup
  })

  return { data }  // created during setup → stops on unmount
}`,
      },
      whyAsked: 'Senior-level: memory leaks and duplicated side effects are common production bugs in long-lived SPAs.',
      mistakes: [
        'Relying on `onUnmounted` alone and forgetting per-run cleanup.',
        'Creating watchers inside async callbacks (timers, `.then`) and assuming they auto-stop.',
        'Never considering composables used outside components.',
      ],
      followUps: [
        'What does `effectScope()` give you over keeping stop handles in an array?',
        'Where does `onScopeDispose()` fit compared to `onUnmounted()`?',
        'How would you test that the interval is cleared?',
      ],
      modelAnswer: 'I think about two lifetimes. A single run can become outdated when its dependencies change, so every effect registers a cleanup for what it started — clear the interval, remove the listener, unsubscribe — using `onCleanup` or `onWatcherCleanup` on 3.5+. The whole set of effects ends when the owner goes away: if I create them synchronously during setup, Vue binds them to the component and stops them on unmount, which also runs the last cleanup. If they are created later or outside a component, I keep the stop handles or wrap everything in an `effectScope` and stop the scope, using `onScopeDispose` for any extra teardown. Then I test it by advancing timers after unmount and asserting nothing else runs.',
    },
    {
      id: 'watch-effect-coding-ticker',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Build a ticker: while running, `ticks` increases by 1 every **100 ms**. The `.toggle` button starts and pauses it; `.ticks` shows the count. Use `watchEffect` and make sure there is **never more than one interval** running, however often the button is clicked.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, watchEffect } from 'vue'

const running = ref(false)
const ticks = ref(0)

// TODO: while running is true, add 1 to ticks every 100 ms.
// Use watchEffect, and clean up the interval.
</script>

<template>
  <p class="ticks">{{ ticks }}</p>
  <button class="toggle" @click="running = !running">
    {{ running ? 'Pause' : 'Start' }}
  </button>
</template>`,
        },
      },
      tests: [
        {
          name: 'starts paused at 0',
          code: `expect(text('.ticks')).toBe('0')
await wait(250)
expect(text('.ticks')).toBe('0')`,
        },
        {
          name: 'ticks while running',
          code: `await click('.toggle')
await wait(450)
const n = Number(text('.ticks'))
expect(n).toBeGreaterThanOrEqual(2)
expect(n).toBeLessThanOrEqual(5)`,
        },
        {
          name: 'pausing stops the ticks',
          code: `await click('.toggle')
await wait(250)
await click('.toggle')
const paused = text('.ticks')
await wait(300)
expect(text('.ticks')).toBe(paused)
expect(Number(paused)).toBeGreaterThan(0)`,
        },
        {
          name: 'start → pause → start never runs two intervals',
          code: `await click('.toggle')
await click('.toggle')
await click('.toggle')
await wait(450)
const n = Number(text('.ticks'))
expect(n).toBeGreaterThanOrEqual(2)
expect(n).toBeLessThanOrEqual(5)`,
        },
      ],
      hints: [
        'The effect should read `running.value` and return early when it is false.',
        'When running, start `setInterval(() => ticks.value++, 100)` and register a cleanup that clears it.',
        'Use the `onCleanup` argument: `watchEffect((onCleanup) => { … onCleanup(() => clearInterval(id)) })`.',
      ],
      answer: 'One `watchEffect` reads `running`; when true it starts an interval and registers a cleanup that clears it. Toggling re-runs the effect, which first runs the cleanup, so at most one interval exists.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, watchEffect } from 'vue'

const running = ref(false)
const ticks = ref(0)

watchEffect((onCleanup) => {
  if (!running.value) return
  const id = setInterval(() => {
    ticks.value++
  }, 100)
  onCleanup(() => clearInterval(id))
})
</script>

<template>
  <p class="ticks">{{ ticks }}</p>
  <button class="toggle" @click="running = !running">
    {{ running ? 'Pause' : 'Start' }}
  </button>
</template>`,
        },
      },
      explanation: 'The effect depends only on `running` (the `ticks.value++` inside the interval callback runs later, outside tracking). Every toggle re-runs the effect; Vue calls the previous cleanup first, so the old interval is always cleared before a new one starts. On unmount the watcher stops and the cleanup runs one last time.',
      whyAsked: 'A compact test of effect cleanup — the skill that prevents leaks and doubled side effects in real apps.',
      mistakes: [
        'Starting the interval in the click handler and losing track of the id.',
        'Forgetting cleanup, so start → pause → start runs two intervals.',
        'Reading `running.value` only inside the interval callback, so it is never tracked.',
      ],
      followUps: [
        'How would you let the user change the speed while it runs?',
        'Would `watch(running, …)` be clearer here? Why or why not?',
        'How would you write this with `onWatcherCleanup()`?',
      ],
      modelAnswer: 'I would use a single `watchEffect` that reads `running`. If it is false the effect returns; if true it starts a 100 ms interval that increments `ticks` and registers `onCleanup(() => clearInterval(id))`. Each toggle re-runs the effect, and Vue calls the previous cleanup first, so there is never more than one interval — and when the component unmounts, the watcher stops and clears it too. `watch(running, …, { immediate: true })` with the same cleanup would work equally well and make the single trigger explicit.',
    },
  ],

  takeaways: [
    '`watchEffect(fn)` runs immediately and re-runs whenever a reactive value read during its last run changes — no dependency list.',
    'Dependencies are re-collected every run; only synchronous reads count, so read everything before the first `await`.',
    'Clean up what each run starts with `onCleanup` or `onWatcherCleanup()` (3.5+, call it synchronously).',
    'Flush timing: `pre` (default, before the DOM update), `post` / `watchPostEffect` (after it), `sync` / `watchSyncEffect` (immediately — use sparingly).',
    'Choose `watchEffect` to keep a side effect in sync with everything it uses; choose `watch` for precise triggers, old values or async-heavy work; choose `computed` for values.',
    'Effects created synchronously in setup stop on unmount; stop any created later yourself (the handle, or `effectScope()`).',
  ],
}
