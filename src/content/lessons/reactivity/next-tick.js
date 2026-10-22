// Lesson: batched, asynchronous DOM updates and nextTick().

const chatApp = `<script setup>
import { ref, nextTick, useTemplateRef } from 'vue'

const messages = ref(['Welcome to the chat!'])
const draft = ref('')
const listEl = useTemplateRef('list') // Vue 3.5+; ref(null) also works

async function send() {
  const text = draft.value.trim()
  if (!text) return
  messages.value.push(text)
  draft.value = ''

  console.log('state says:', messages.value.length, 'messages')
  console.log('DOM says (before):', listEl.value.children.length, 'messages')

  await nextTick()

  console.log('DOM says (after):', listEl.value.children.length, 'messages')
}
</script>

<template>
  <ul ref="list" class="messages">
    <li v-for="(text, index) in messages" :key="index" class="message">{{ text }}</li>
  </ul>
  <input class="draft" v-model="draft" @keyup.enter="send" placeholder="Say something" />
  <button class="send" @click="send">Send</button>
</template>

<style scoped>
.messages {
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 8px 24px;
}
</style>`

export default {
  id: 'next-tick',
  title: 'Batched updates & nextTick()',
  summary: 'State changes instantly but the DOM updates a moment later, in one batch — learn why, and how nextTick() lets you run code after the page has caught up.',
  difficulty: 'intermediate',
  minutes: 26,
  prerequisites: ['ref', 'async-js'],
  related: ['watch-effect', 'how-reactivity-works', 'template-refs', 'lifecycle-hooks', 'scheduling-flush', 'testing-async-routing'],
  tags: ['nextTick', 'batching', 'async DOM updates', 'scheduler', 'microtask', 'event loop', 'focus', 'scroll', 'DOM timing', 'flush'],
  apis: [
    { name: 'nextTick()', summary: 'Returns a Promise that resolves after Vue applies pending DOM updates; also accepts a callback.' },
    { name: '$nextTick()', summary: 'The Options API instance method with the same behaviour.' },
    { name: "watch(..., { flush: 'post' })", summary: 'Runs a watcher callback after Vue has updated the DOM.' },
  ],
  docs: [
    { label: 'Vue Guide — Reactivity Fundamentals: DOM update timing', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing' },
    { label: 'API — nextTick()', url: 'https://vuejs.org/api/general.html#nexttick' },
    { label: 'Vue Guide — Watchers: callback flush timing', url: 'https://vuejs.org/guide/essentials/watchers.html#callback-flush-timing' },
  ],

  intro: `
When you change reactive state, two things happen at different moments:

1. **The state changes immediately.** The very next line of your code sees the new value.
2. **The DOM changes a moment later.** Vue collects every change you make, waits until your code has finished, then updates the page **once**.

That waiting point is called the **next tick**. Most of the time you never notice it. But when your code needs the *updated page* — to focus an input that just appeared, scroll a chat to its newest message, or hand fresh DOM to another library — you need to wait for it. That's what \`nextTick()\` is for.
`,

  why: [
    `
Why doesn't Vue just update the DOM the instant you change something? Consider a click handler:
`,
    {
      code: `function checkout() {
  cart.value = []          // change 1
  status.value = 'paid'    // change 2
  points.value += 50       // change 3
}`,
      lang: 'js',
      title: 'three changes in one handler',
    },
    `
If Vue updated the page after *each* line, the component would render three times, and two of those renders would show a half-finished state (an empty cart but still "unpaid"). By **batching** — queueing the work and doing it once after your code finishes — Vue renders once, with everything consistent.

The price: for a brief moment, your state and your DOM disagree. Code that reads the DOM right after a change sees the *old* page:
`,
    {
      code: `async function openSearch() {
  showSearch.value = true        // the <input v-if="showSearch"> will appear...
  searchInput.value.focus()      // ❌ ...but not yet: the ref is still null

  await nextTick()               // wait for Vue to update the DOM
  searchInput.value.focus()      // ✅ the input exists now
}`,
      lang: 'js',
      title: 'reading the DOM too early',
    },
  ],

  eli15: `
Picture a waiter at your table. You say: "a burger… and fries… oh, and a milkshake." A good waiter doesn't run to the kitchen after every word. They write everything on their notepad, and when you've finished ordering, they make **one** trip to the kitchen.

Vue is that waiter. Each time you change a value, Vue writes "redraw this component" on its notepad (only once, even if you change ten things). When your code finishes, Vue makes one trip and updates the page.

Two consequences:

- **The notepad is updated instantly.** If you ask "what did I order?", the answer is right there. In Vue terms: reading \`count.value\` right after changing it gives the new value.
- **The food isn't on the table yet.** If you want to take a photo of your burger, you have to wait until it arrives. In Vue terms: if you need the updated page, write \`await nextTick()\` — "tell me when it's served".
`,

  analogy: {
    title: 'The waiter who batches your order',
    body: `
The waiter waits until you've stopped talking, then carries the whole order to the kitchen in a single trip. Your table gets everything together, and nobody sees a half-served meal.

\`nextTick()\` is asking the waiter to come back and tell you once the plates are on the table. It doesn't make the kitchen faster and it doesn't wait for things that aren't part of the order (like a friend who's still on their way — a network request).
`,
    mapping: [
      ['saying each dish', 'each reactive state change'],
      ['the waiter\'s notepad', 'Vue\'s scheduler queue of pending updates'],
      ['writing "burger" twice still means one burger', 'de-duplication: a component is queued once per tick'],
      ['one trip after you stop talking', 'the flush: runs after your synchronous code, in a microtask'],
      ['plates arriving together', 'the DOM patched in one go'],
      ['"tell me when it\'s served"', '`await nextTick()`'],
      ['reading your order back from the notepad', 'reading state — already up to date, no waiting needed'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Three changes, one update',
    caption: 'Step through what happens between three state changes in one click handler and the moment `await nextTick()` continues.',
    alt: 'A flow diagram. Three boxes on the left — count.value++, name.value = "Ada", count.value++ — all point to a Scheduler queue box containing a single "App update" job. The queue leads to a Flush (microtask) box, then to DOM patched once, then to nextTick resolves. The third change is marked "already queued".',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'c1', label: 'count.value++', note: 'state: 1', x: 100, y: 60, tone: 'acid' },
        { id: 'c2', label: "name.value = 'Ada'", note: 'state: Ada', x: 100, y: 160, tone: 'acid' },
        { id: 'c3', label: 'count.value++', note: 'state: 2', x: 100, y: 260, tone: 'acid' },
        { id: 'queue', label: 'Scheduler queue', note: '[ App update ]', x: 300, y: 160, tone: 'kraft' },
        { id: 'flush', label: 'Flush', note: 'microtask, after your code', x: 470, y: 160, tone: 'cobalt' },
        { id: 'dom', label: 'DOM patched once', note: 'shows 2 and Ada', x: 640, y: 90, tone: 'ink' },
        { id: 'tick', label: 'nextTick resolves', note: 'await continues', x: 640, y: 240, tone: 'red' },
      ],
      edges: [
        { from: 'c1', to: 'queue', label: 'queue App' },
        { from: 'c2', to: 'queue', label: 'already queued' },
        { from: 'c3', to: 'queue', label: 'already queued', dashed: true },
        { from: 'queue', to: 'flush', label: 'when the stack is empty' },
        { from: 'flush', to: 'dom', label: 'one render' },
        { from: 'dom', to: 'tick', label: 'then' },
      ],
      steps: [
        { focus: ['c1', 'queue'], edges: ['c1->queue'], text: '`count.value++` changes the state **immediately** (it is 1 now). Vue sees that the App component depends on `count` and puts its update job in the queue. It also schedules a flush as a microtask.' },
        { focus: ['c2', 'c3', 'queue'], edges: ['c2->queue', 'c3->queue'], text: 'Two more changes. The state updates each time (`name` is "Ada", `count` is 2), but the App job is **already queued**, so nothing new is added. One component, one job, however many changes.' },
        { focus: ['flush'], edges: ['queue->flush'], text: 'Your click handler finishes and the call stack is empty. The microtask runs: Vue **flushes** the queue (pre-flush watchers first, then component updates, then post-flush callbacks).' },
        { focus: ['dom'], edges: ['flush->dom'], text: 'The App re-renders **once**, reading the final state, and Vue patches only the DOM nodes that changed. This happens before the browser paints, so users never see a half-updated page.' },
        { focus: ['tick'], edges: ['dom->tick'], text: 'Code waiting on `await nextTick()` continues now — the DOM matches the state again. That\'s the moment to focus, scroll or measure.' },
      ],
    },
  },

  syntax: [
    `
\`nextTick\` is a named import from \`'vue'\`. Use it with \`await\` (most common) or pass a callback:
`,
    {
      code: `import { ref, nextTick } from 'vue'

const count = ref(0)

async function increment() {
  count.value++

  console.log(count.value)   // 1 — state is already updated
  // the DOM still shows 0 here

  await nextTick()
  // the DOM shows 1 now
}

// callback style (also returns a Promise)
nextTick(() => {
  // runs after the pending DOM update
})`,
      lang: 'js',
      title: 'await nextTick()',
    },
    `
**The rules:**

1. **State is synchronous.** After \`x.value = 5\`, reading \`x.value\` gives 5. You never need \`nextTick()\` to read state.
2. **DOM updates are asynchronous and batched.** Each affected component re-renders once per tick, after your synchronous code finishes.
3. **Change first, then wait.** Make your state changes, *then* \`await nextTick()\`, then touch the DOM.
4. **It only waits for Vue's DOM update.** Not for network requests, timers, images, fonts, CSS transitions or other async work.
5. **Prefer declarative tools when they fit:** a watcher with \`flush: 'post'\` ([watchEffect & flush](lesson:watch-effect)) when the DOM work should follow a state change wherever it comes from; \`onMounted\` for the first render; a [template ref](lesson:template-refs) to reach the element.
`,
    {
      code: `// Options API: the same behaviour as an instance method
export default {
  methods: {
    async open() {
      this.isOpen = true
      await this.$nextTick()
      this.$refs.input.focus()
    },
  },
}`,
      lang: 'js',
      title: 'Options API: this.$nextTick()',
    },
    {
      callout: 'version',
      text: '`nextTick()` is a global API exported from `\'vue\'` (Vue 2 had `Vue.nextTick` and `this.$nextTick`; Vue 3 keeps `this.$nextTick` for the Options API). The playground uses `useTemplateRef()`, which needs **Vue 3.5+**; `const el = ref(null)` with a matching `ref="…"` attribute works in all Vue 3 versions.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: chatApp,
    intro: 'A tiny chat that logs what the state says and what the DOM says, before and after `nextTick()`. Run it, send a message and read the Console tab.',
    steps: [
      { lines: [2], text: 'We import `nextTick` alongside `ref`, plus `useTemplateRef` to reach the `<ul>` element.' },
      { lines: [6], text: '`useTemplateRef(\'list\')` gives a ref that will hold the element with `ref="list"` once it is rendered (Vue 3.5+).' },
      { lines: [11, 12], text: 'Two state changes: push a message, clear the draft. Both are queued into **one** component update.' },
      { lines: [14], text: 'State is synchronous: the array already has the new message, so this logs the new length.' },
      { lines: [15], text: 'The DOM hasn\'t been patched yet, so the `<ul>` still has the *old* number of `<li>` children.' },
      { lines: [17], text: '`await nextTick()` pauses this function until Vue has flushed the queue and patched the DOM.' },
      { lines: [19], text: 'Now the DOM agrees with the state: the `<ul>` has one more child.' },
      { lines: [24, 26], text: 'The template that renders the list. `ref="list"` connects the element to `listEl`.' },
    ],
  },

  playground: {
    title: 'A chat that logs the tick',
    objective: 'See the gap between state and DOM in the console, then use nextTick(), batching and post-flush watchers deliberately.',
    files: { 'App.vue': chatApp },
    expected: 'A message list and an input. Send "Hi" and the Console shows **state says: 2 messages**, **DOM says (before): 1 messages**, **DOM says (after): 2 messages** — the state is ahead of the DOM until the next tick.',
    experiments: [
      {
        id: 'log-last',
        task: 'After the DOM has updated, also log the **text of the last message in the DOM**, exactly as `last in DOM: <text>` (e.g. `last in DOM: Hi there`).',
        hint: 'After `await nextTick()`, `listEl.value.lastElementChild.textContent` is the newest `<li>`. Log `\'last in DOM: \' + …`.',
        tests: [
          {
            name: 'logs the newest message read from the DOM',
            code: `await type('.draft', 'Hi there')
await click('.send')
expect(logs).toContain('last in DOM: Hi there')`,
          },
        ],
        explain: 'Try moving your log *above* `await nextTick()`: it prints "Welcome to the chat!", the old last item. Reading the DOM is only safe once the tick has passed.',
      },
      {
        id: 'burst',
        task: 'Add `onUpdated(() => console.log(\'rendered\'))` and a `<button class="burst">` that pushes **three** messages in one handler. How many times does the component re-render per click?',
        hint: 'Import `onUpdated` from \'vue\'. The handler can be `messages.value.push(\'one\', \'two\', \'three\')` — or three separate `push` calls.',
        tests: [
          {
            name: 'three changes produce one re-render',
            code: `expect(exists('.burst')).toBe(true)
const before = logs.filter((line) => line === 'rendered').length
await click('.burst')
expect(findAll('.message')).toHaveLength(4)
expect(logs.filter((line) => line === 'rendered').length - before).toBe(1)`,
          },
        ],
        explain: 'Three separate `push` calls trigger the component three times, but the scheduler de-duplicates its update job, so `onUpdated` fires once. Batching is automatic — you don\'t opt in.',
      },
      {
        id: 'post-watcher',
        task: 'Without touching `send()`, add a watcher on the number of messages that logs `post watcher sees: <n> messages`, where `<n>` is the number of `<li>` elements **in the DOM**. It must report the updated count.',
        hint: '`watch(() => messages.value.length, () => console.log(\'post watcher sees:\', listEl.value.children.length, \'messages\'), { flush: \'post\' })` — and try it once without `flush: \'post\'` to see the difference.',
        tests: [
          {
            name: 'the watcher sees the updated DOM',
            code: `await type('.draft', 'Hello')
await click('.send')
expect(logs).toContain('post watcher sees: 2 messages')`,
          },
        ],
        explain: 'By default a watcher runs **before** the component re-renders (`flush: \'pre\'`), so it would see 1 `<li>`. `flush: \'post\'` runs it **after** the DOM update — the declarative alternative to `await nextTick()` when DOM work should follow every change of some state.',
      },
      {
        id: 'auto-scroll',
        task: 'Send messages until the list scrolls. Then make it scroll to the newest message automatically: after `await nextTick()`, set `listEl.value.scrollTop = listEl.value.scrollHeight`.',
        hint: 'Try setting `scrollTop` *before* the `await` first — it scrolls to the previous last message, one step behind.',
        explain: '`scrollHeight` only includes the new message once it is in the DOM. This is the classic nextTick job: imperative DOM work that depends on the result of a state change. (Layout values like `scrollHeight` aren\'t available in the automated tests, so this one has no checker — trust your eyes.)',
      },
    ],
  },

  animation: {
    type: 'event-loop',
    props: { preset: 'nexttick' },
    title: 'nextTick on the event loop',
    caption: 'Step through the call stack, the microtask queue and the task queue: your click handler runs to completion, Vue\'s flush runs as a microtask, and code after `await nextTick()` resumes once the flush is done — all before the next timer task.',
    alt: 'An event-loop stepper showing the call stack, microtask queue and task queue. A click handler changes state and calls await nextTick(); Vue\'s flush is queued as a microtask; when the stack empties, the flush runs and patches the DOM; then the continuation after await nextTick() runs; a setTimeout callback in the task queue runs only afterwards.',
  },

  internals: {
    beginner: `
Vue keeps a to-do list called the **queue**. When state changes, Vue adds "update this component" to the list — but only if it's not there already. When your code finishes, Vue works through the list in one go and updates the page.

\`nextTick()\` simply means: "run my code after that list has been finished".
`,
    technical: [
      `
- When a reactive change triggers a component's render effect, Vue doesn't run it. It **queues** the component's update job. Jobs are de-duplicated, so a component appears at most once per flush.
- The first queued job schedules a **flush** as a **microtask** (a promise callback). Microtasks run as soon as the current JavaScript finishes — after your event handler, before timers (\`setTimeout\`) and before the browser paints.
- During the flush, Vue runs queued jobs in a stable order: watchers with \`flush: 'pre'\` before the component updates that depend on them, component updates **parent before child**, and then **post-flush** callbacks (\`flush: 'post'\` watchers, \`mounted\`/\`updated\` hooks).
- \`nextTick()\` returns the promise for the current flush (or an already-resolved promise if nothing is pending), so \`await nextTick()\` continues after the DOM has been patched and post-flush callbacks have run.
`,
      {
        code: `// A SIMPLIFIED model of Vue's scheduler — names and details differ in the real source.
const queue = []
let flushPromise = null

function queueJob(job) {
  if (!queue.includes(job)) queue.push(job)          // de-duplicate
  if (!flushPromise) flushPromise = Promise.resolve().then(flushJobs)
}

function flushJobs() {
  queue.sort((a, b) => a.id - b.id)                  // parents before children
  for (const job of queue) job()                     // re-render each component once
  queue.length = 0
  flushPromise = null
  // ...then post-flush callbacks (updated hooks, flush: 'post' watchers)
}

function nextTick(fn) {
  const p = flushPromise || Promise.resolve()
  return fn ? p.then(fn) : p
}`,
        lang: 'js',
        title: 'mental model of the scheduler (simplified)',
      },
      `
Because the flush is a microtask, the DOM is updated **before** the browser gets a chance to paint — users see one consistent update, not intermediate states. A \`setTimeout(fn, 0)\` callback, by contrast, is a *task* that runs after all microtasks (and possibly after a paint), which is why it often "works" for DOM timing but is imprecise. The full timing story continues in [scheduling & flush timing](lesson:scheduling-flush).
`,
    ],
    production: `
- **Use \`nextTick()\` for imperative DOM work after a change:** focusing, selecting text, scrolling, measuring, or initialising a third-party widget on freshly rendered markup.
- **Reach for declarative options first.** A \`flush: 'post'\` watcher (or \`watchPostEffect\`) keeps DOM work tied to the state that causes it, no matter which function changed that state. \`onMounted\` covers first render.
- **Don't paper over data-flow bugs with nextTick chains.** If you find yourself writing \`await nextTick(); await nextTick()\` to make something work, the real problem is usually ordering or ownership of state.
- **It doesn't wait for children that load asynchronously** (async components, \`<Suspense>\` content — which is experimental), images or transitions. Use their own events/hooks.
- **Accessibility:** moving focus after a UI change (opening a dialog, showing an error summary) is one of the most important legitimate uses of nextTick.
- **Testing:** after triggering a change in a component test, \`await nextTick()\` (or await the helper that triggered it) before asserting on the DOM. Vue Test Utils' \`flushPromises()\` is a *testing-library* helper for pending promises (e.g. mocked API calls), not part of Vue core — see [testing async code](lesson:testing-async-routing).
`,
  },

  mistakes: [
    {
      title: 'Touching the DOM right after a state change',
      wrong: { code: `function openEditor() {\n  editing.value = true\n  editorInput.value.focus()   // null: the <input v-if> doesn't exist yet\n}`, lang: 'js' },
      right: { code: `async function openEditor() {\n  editing.value = true\n  await nextTick()\n  editorInput.value.focus()\n}`, lang: 'js' },
      explanation: 'The state changed, but the DOM is patched in the next tick. Wait for it before reaching for elements that the change creates.',
    },
    {
      title: 'Using setTimeout to "wait for the DOM"',
      wrong: { code: `items.value.push(item)\nsetTimeout(() => scrollToBottom(), 100)   // magic number`, lang: 'js' },
      right: { code: `items.value.push(item)\nawait nextTick()\nscrollToBottom()`, lang: 'js' },
      explanation: 'A timer is a guess: too short on a slow device, needlessly late on a fast one, and it may run after a paint (a visible jump). `nextTick()` resolves exactly when Vue\'s update is done.',
    },
    {
      title: 'Expecting nextTick to wait for data',
      wrong: { code: `loadUsers()            // starts a fetch\nawait nextTick()\nconsole.log(users.value) // still empty: the request isn't done`, lang: 'js' },
      right: { code: `await loadUsers()      // wait for the async work itself\nawait nextTick()       // only if you then need the updated DOM`, lang: 'js' },
      explanation: '`nextTick()` waits for Vue\'s DOM flush, nothing else. Await the promise of the async operation you actually care about.',
    },
    {
      title: 'Awaiting nextTick just to read state',
      wrong: { code: `count.value++\nawait nextTick()\nconsole.log(count.value)`, lang: 'js' },
      right: { code: `count.value++\nconsole.log(count.value)   // already updated`, lang: 'js' },
      explanation: 'Reactive state updates synchronously. Only the DOM lags behind.',
    },
  ],

  debugging: [
    {
      symptom: '`Cannot read properties of null (reading \'focus\')` right after showing an element with `v-if`.',
      cause: 'The template ref is still `null` because the element is only created in the next DOM update.',
      fix: 'Make the function `async` and `await nextTick()` after changing state, before using the ref.',
    },
    {
      symptom: 'Code that reads the DOM (text, child count, scroll size) is always "one step behind".',
      cause: 'It runs before Vue\'s flush and sees the previous render.',
      fix: 'Move it after `await nextTick()`, or into a watcher with `flush: \'post\'`.',
    },
    {
      symptom: 'It works the second time but not the first (e.g. focus moves only when an error box was already visible).',
      cause: 'The first time, the element is created by the change and doesn\'t exist yet; the second time it already exists from the previous render.',
      fix: 'Always `await nextTick()` before touching elements that a state change may create.',
    },
    {
      symptom: 'A component test fails because the DOM still shows old text after triggering a click.',
      cause: 'The assertion runs before Vue\'s asynchronous update.',
      fix: '`await` the trigger (or `await nextTick()`) before asserting.',
    },
    {
      symptom: 'Your nextTick callback seems to run before the update you expected.',
      cause: 'The change it should wait for was made *after* `nextTick()` was called, or in another async step.',
      fix: 'Make the state change first, then call `await nextTick()` in the same flow.',
    },
  ],

  bestPractices: [
    'Change state first, then `await nextTick()`, then touch the DOM.',
    'Use `nextTick()` only for imperative DOM work; read state directly.',
    'Prefer `flush: \'post\'` watchers when DOM work should follow every change of some state.',
    'Never use timers as a substitute for `nextTick()`.',
    'Move focus with `nextTick()` when UI appears (dialogs, inline editors, error summaries) — it matters for keyboard and screen-reader users.',
    'In tests, await DOM updates before asserting.',
  ],

  useCases: [
    'Focusing an input or dialog that was just rendered with `v-if`.',
    'Scrolling a chat or log view to the newest entry after pushing it.',
    'Selecting the text of an inline editor when editing starts.',
    'Moving focus to an error summary after a failed form submission.',
    'Initialising or refreshing a non-Vue library (chart, editor) on markup Vue just rendered.',
  ],

  whenToUse: {
    use: [
      'You need the DOM *as it will be* after a state change you just made.',
      'One specific action (a click, a submit) should be followed by DOM work.',
      'Tests need to wait for the re-render before asserting.',
    ],
    avoid: [
      'Reading reactive state — it is already up to date.',
      'Waiting for network requests, timers, images or transitions — await those directly or use their events.',
      'DOM work that should follow *every* change of some state — use a `flush: \'post\'` watcher.',
      'Fixing ordering bugs by stacking several `await nextTick()` calls.',
    ],
  },

  comparison: {
    title: 'Ways to run code after the DOM updates',
    headers: ['', '`await nextTick()`', "watch `{ flush: 'post' }`", '`onUpdated()`', '`setTimeout(fn, 0)`'],
    rows: [
      ['Runs when', 'after the pending flush, once', 'after the DOM update, every time its source changes', 'after *any* re-render of the component', 'a later task, after microtasks (often after a paint)'],
      ['Tied to', 'the code path that changed state', 'specific reactive sources', 'the whole component', 'nothing — a timer'],
      ['Good for', 'focus/scroll after a specific action', 'DOM work that follows certain state', 'rare: reacting to every render', 'avoid for DOM timing'],
      ['Main risk', 'forgetting it, or overusing it', 'running more often than needed', 'runs on unrelated renders', 'flicker, magic delays, flaky timing'],
    ],
    note: 'Flush timing in detail: [watchEffect & flush](lesson:watch-effect) and the advanced [scheduling lesson](lesson:scheduling-flush).',
  },

  quiz: [
    {
      id: 'next-tick-q1',
      type: 'mcq',
      prompt: 'What does `await nextTick()` wait for?',
      options: [
        { text: 'Vue to apply the pending DOM updates caused by state changes.' },
        { text: 'One animation frame (about 16 ms).', why: 'It isn\'t tied to frames — it resolves after Vue\'s flush, which runs as a microtask.' },
        { text: 'All pending network requests to finish.', why: 'Vue knows nothing about your requests. Await their promises instead.' },
        { text: 'The reactive state to be updated.', why: 'State updates synchronously, the moment you assign it.' },
      ],
      answer: 0,
      explanation: '`nextTick()` resolves after Vue flushes its update queue — the DOM then reflects the state changes made before it.',
    },
    {
      id: 'next-tick-q2',
      type: 'output',
      prompt: 'The template is `<p ref="p">{{ count }}</p>` (`p` is the template ref). What does `run()` log?',
      code: {
        lang: 'js',
        code: `const count = ref(0)

async function run() {
  count.value = 1
  count.value = 2
  console.log(count.value, p.value.textContent)

  await nextTick()
  console.log(count.value, p.value.textContent)
}`,
      },
      options: [
        { text: '`2 2` then `2 2`', why: 'The DOM is only patched in the next tick, so the first log still sees the old text.' },
        { text: '`2 0` then `2 2`' },
        { text: '`1 0` then `2 2`', why: 'State is synchronous: by the first log, `count.value` is already 2.' },
        { text: '`2 0` then `2 1`', why: 'The two changes are batched; the DOM goes straight from 0 to 2.' },
      ],
      answer: 1,
      explanation: 'State updates immediately (2), the DOM lags (still "0"). After the tick, the component has rendered once with the final value, so both say 2. The intermediate value 1 never reaches the DOM.',
    },
    {
      id: 'next-tick-q3',
      type: 'bug',
      prompt: 'Clicking **Search** throws `Cannot read properties of null (reading \'focus\')`. Click the line that throws.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, useTemplateRef } from 'vue'

const showSearch = ref(false)
const searchInput = useTemplateRef('search')

function openSearch() {
  showSearch.value = true
  searchInput.value.focus()
}
</script>

<template>
  <button @click="openSearch">Search</button>
  <input v-if="showSearch" ref="search" />
</template>`,
      },
      answerLine: 9,
      explanation: 'When line 9 runs, the `<input v-if>` hasn\'t been created yet — the DOM update happens in the next tick — so the ref is still `null`. Make `openSearch` async and add `await nextTick()` between lines 8 and 9.',
    },
    {
      id: 'next-tick-q4',
      type: 'fill',
      prompt: 'Fill the blanks so the newest item is scrolled into view after it is rendered.',
      code: {
        lang: 'js',
        code: `import { ref, ___ } from 'vue'

async function addItem(item) {
  items.value.push(item)
  ___ nextTick()
  listEl.value.lastElementChild.scrollIntoView()
}`,
      },
      answer: [['nextTick'], ['await']],
      explanation: 'Import `nextTick` and `await` it after the state change, so the new element exists before you scroll to it.',
    },
    {
      id: 'next-tick-q5',
      type: 'mcq',
      prompt: 'A click handler runs `for (let i = 0; i < 100; i++) count.value++`. How many times does the component that shows `count` re-render?',
      options: [
        { text: '100 times', why: 'Each change queues the same update job, which is de-duplicated.' },
        { text: 'Once' },
        { text: 'Never — loops don\'t trigger reactivity', why: 'Each increment is a tracked write; they are simply batched.' },
        { text: '50 times', why: 'There is no partial batching — one flush per tick.' },
      ],
      answer: 1,
      explanation: 'Vue queues the component\'s update once and flushes after the handler finishes, so it renders once, showing 100.',
    },
    {
      id: 'next-tick-q6',
      type: 'mcq',
      prompt: 'Which jobs is `nextTick()` the right tool for? (Select all that apply.)',
      options: [
        { text: 'Focusing an input that a `v-if` just rendered' },
        { text: 'Scrolling a chat to the message you just pushed' },
        { text: 'Waiting for an API response', why: 'Await the request\'s promise. `nextTick()` only waits for Vue\'s DOM update.' },
        { text: 'Reading the new value of a ref you just set', why: 'State is synchronous — read it straight away.' },
        { text: 'Waiting for a CSS transition to end', why: 'Use transition hooks or the `transitionend` event; nextTick resolves long before.' },
      ],
      answer: [0, 1],
      explanation: '`nextTick()` is for DOM work that depends on a state change you just made.',
    },
    {
      id: 'next-tick-q7',
      type: 'short',
      prompt: 'In two or three sentences: why does Vue batch DOM updates instead of applying each change immediately?',
      answer: 'Batching lets a component re-render once per tick no matter how many state changes happened, which avoids wasted work. It also guarantees the page is updated from a consistent final state, so users never see half-applied changes. The trade-off is that the DOM is briefly behind the state, which is why nextTick() exists.',
    },
  ],

  exercises: [
    {
      id: 'timing-log',
      title: 'Log the gap between state and DOM',
      difficulty: 'intermediate',
      prompt: `
Instrument a counter so its logs prove when state and DOM change.

- \`<p class="count" ref="countEl">\` shows \`count\` (starts at 0). \`<button class="add-three">\` increments \`count\` **three times** in one handler.
- In that handler, after the increments, log **exactly**, in this order:
  1. \`state: <count>\`
  2. \`dom before: <text of the .count paragraph>\`
  3. then wait for Vue's DOM update and log \`dom after: <text of the .count paragraph>\`
- Add an \`onUpdated\` hook that logs \`updated\`.

After one click the logs must be: \`state: 3\`, \`dom before: 0\`, \`updated\`, \`dom after: 3\`.
`,
      files: {
        'App.vue': `<script setup>
import { ref, useTemplateRef } from 'vue'

const count = ref(0)
const countEl = useTemplateRef('countEl')

function addThree() {
  count.value++
  count.value++
  count.value++
  // TODO: log the state, the DOM before, wait, then the DOM after
}

// TODO: log 'updated' after every re-render
</script>

<template>
  <p class="count" ref="countEl">{{ count }}</p>
  <button class="add-three" @click="addThree">+3</button>
</template>`,
      },
      hints: [
        'The DOM text is `countEl.value.textContent`. Read it right after the increments for "dom before".',
        'Make the handler `async` and `await nextTick()` before the "dom after" log. Import `nextTick` and `onUpdated`.',
        '`onUpdated(() => console.log(\'updated\'))` runs during Vue\'s flush — before `await nextTick()` continues — which is why "updated" comes before "dom after".',
      ],
      solution: {
        explanation: 'The three increments update `count` synchronously (state: 3) but only queue one render, so the DOM still says 0. `await nextTick()` resumes after the flush: the component has rendered once (the `updated` hook logs during that flush) and the paragraph now says 3.',
        files: {
          'App.vue': `<script setup>
import { ref, nextTick, onUpdated, useTemplateRef } from 'vue'

const count = ref(0)
const countEl = useTemplateRef('countEl')

async function addThree() {
  count.value++
  count.value++
  count.value++
  console.log('state: ' + count.value)
  console.log('dom before: ' + countEl.value.textContent)
  await nextTick()
  console.log('dom after: ' + countEl.value.textContent)
}

onUpdated(() => console.log('updated'))
</script>

<template>
  <p class="count" ref="countEl">{{ count }}</p>
  <button class="add-three" @click="addThree">+3</button>
</template>`,
        },
      },
      tests: [
        {
          name: 'one click logs state, DOM before, one update, DOM after',
          code: `await click('.add-three')
const lines = logs.filter((l) => /^(state|dom|updated)/.test(l))
expect(lines).toEqual(['state: 3', 'dom before: 0', 'updated', 'dom after: 3'])`,
        },
        {
          name: 'a second click continues from 3',
          code: `await click('.add-three')
await click('.add-three')
const lines = logs.filter((l) => /^(state|dom)/.test(l))
expect(lines.slice(3)).toEqual(['state: 6', 'dom before: 3', 'dom after: 6'])`,
        },
        { name: 'the screen shows the final value', code: `await click('.add-three'); expect(text('.count')).toBe('3')` },
      ],
    },
    {
      id: 'error-summary',
      title: 'Move focus to an error summary',
      difficulty: 'intermediate',
      prompt: `
A sign-up form shows an error summary when validation fails. For keyboard and screen-reader users, **focus must move to the summary** every time it is shown.

- \`<form>\` with \`<input class="email">\`, \`<input class="password" type="password">\` and a submit button. Submitting is handled with \`@submit.prevent\`.
- Errors: email without \`@\` → *Enter a valid email*; password shorter than 8 characters → *Password must be at least 8 characters*.
- With errors: show \`<div class="error-summary" tabindex="-1">\` containing one \`<li class="error">\` per error, and **focus that div**.
- Without errors: no summary, and \`<p class="success">Account created</p>\` is shown.

The starter validates correctly, but focus only works sometimes. Find out why and fix it.
`,
      files: {
        'App.vue': `<script setup>
import { ref, useTemplateRef } from 'vue'

const email = ref('')
const password = ref('')
const errors = ref([])
const success = ref(false)
const summaryEl = useTemplateRef('summary')

function onSubmit() {
  const found = []
  if (!email.value.includes('@')) found.push('Enter a valid email')
  if (password.value.length < 8) found.push('Password must be at least 8 characters')
  errors.value = found
  success.value = found.length === 0

  if (found.length) summaryEl.value?.focus()
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div v-if="errors.length" ref="summary" class="error-summary" tabindex="-1">
      <p>Please fix:</p>
      <ul><li v-for="error in errors" :key="error" class="error">{{ error }}</li></ul>
    </div>
    <input class="email" v-model="email" placeholder="Email" />
    <input class="password" type="password" v-model="password" placeholder="Password" />
    <button type="submit">Sign up</button>
    <p v-if="success" class="success">Account created</p>
  </form>
</template>`,
      },
      hints: [
        'Submit the empty form twice in the preview: focus only moves on the second submit. What is different the first time?',
        'The first time, the summary is created by the `errors` change, so `summaryEl.value` is still `null` when `focus()` runs (the `?.` hides the problem).',
        'Make `onSubmit` async and `await nextTick()` before focusing.',
      ],
      solution: {
        explanation: 'On the first failed submit, the summary `<div>` only exists after Vue\'s next DOM update; before that, the template ref is `null`, and optional chaining silently skipped the focus. Waiting for `nextTick()` guarantees the element exists — whether it was just created or already there.',
        files: {
          'App.vue': `<script setup>
import { ref, nextTick, useTemplateRef } from 'vue'

const email = ref('')
const password = ref('')
const errors = ref([])
const success = ref(false)
const summaryEl = useTemplateRef('summary')

async function onSubmit() {
  const found = []
  if (!email.value.includes('@')) found.push('Enter a valid email')
  if (password.value.length < 8) found.push('Password must be at least 8 characters')
  errors.value = found
  success.value = found.length === 0

  if (found.length) {
    await nextTick()
    summaryEl.value.focus()
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <div v-if="errors.length" ref="summary" class="error-summary" tabindex="-1">
      <p>Please fix:</p>
      <ul><li v-for="error in errors" :key="error" class="error">{{ error }}</li></ul>
    </div>
    <input class="email" v-model="email" placeholder="Email" />
    <input class="password" type="password" v-model="password" placeholder="Password" />
    <button type="submit">Sign up</button>
    <p v-if="success" class="success">Account created</p>
  </form>
</template>`,
        },
      },
      tests: [
        {
          name: 'the first failed submit focuses the summary',
          code: `await submit('form')
expect(exists('.error-summary')).toBe(true)
expect(findAll('.error')).toHaveLength(2)
expect(document.activeElement).toBe(find('.error-summary'))`,
        },
        {
          name: 'a partially fixed form still focuses the summary',
          code: `await type('.email', 'ada@example.com')
await type('.password', 'short')
await submit('form')
expect(findAll('.error').map((li) => li.textContent.trim())).toEqual(['Password must be at least 8 characters'])
expect(document.activeElement).toBe(find('.error-summary'))`,
        },
        {
          name: 'a valid form shows success and no summary',
          code: `await type('.email', 'ada@example.com')
await type('.password', 'long-enough')
await submit('form')
expect(exists('.error-summary')).toBe(false)
expect(text('.success')).toBe('Account created')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'next-tick-batching',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is `nextTick()` in Vue, and why does it exist?',
      answer: 'Vue updates the DOM asynchronously: state changes take effect immediately, but component re-renders are queued and flushed together after the current synchronous code, in a microtask. `nextTick()` returns a promise (or takes a callback) that resolves after that flush, so code that needs the updated DOM — focusing, scrolling, measuring — can wait for it.',
      explanation: 'Batching means many changes → one render, and no half-updated page. nextTick is the hook for "after the page has caught up".',
      whyAsked: 'A very common question that reveals whether you understand Vue\'s update timing — the root of many "the element is null" bugs.',
      mistakes: [
        'Saying nextTick is needed to read updated state.',
        'Describing it as a timer or "the next animation frame".',
        'Not mentioning batching / de-duplication.',
      ],
      followUps: ['How many times does a component render if you change three refs in one handler?', 'What are alternatives to nextTick for running code after the DOM updates?', 'How is it implemented?'],
      modelAnswer: 'When state changes, Vue doesn\'t touch the DOM immediately. It queues the affected components\' update jobs — once each — and flushes the queue in a microtask after the current code finishes. That gives one render per tick and a consistent page. The catch is that right after a change the DOM is still old, so `nextTick()` gives me a promise that resolves after the flush. I use it for imperative DOM work like focusing an input that a `v-if` just rendered. State itself never needs it — it updates synchronously.',
    },
    {
      id: 'next-tick-order-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'In a component that renders `count`, a click runs `handle()`. What order are the logs in?',
      code: {
        lang: 'js',
        code: `onUpdated(() => console.log('C: updated'))

function handle() {
  count.value++
  nextTick(() => console.log('A: tick'))
  console.log('B: sync')
}`,
      },
      options: ['B: sync → C: updated → A: tick', 'A: tick → B: sync → C: updated', 'B: sync → A: tick → C: updated', 'C: updated → B: sync → A: tick'],
      correctOption: 0,
      answer: '"B: sync" first (synchronous code always finishes first), then "C: updated" (the `updated` hook runs during Vue\'s flush), then "A: tick" (the nextTick callback runs after the flush completes).',
      explanation: 'The state change queued a flush; `nextTick` chained its callback after that flush. Hooks like `updated` run inside the flush.',
      whyAsked: 'Tests a precise mental model of the event loop and Vue\'s scheduler.',
      mistakes: ['Thinking the nextTick callback runs immediately.', 'Placing the updated hook after the nextTick callback.'],
      followUps: ['Where would a `watch` callback with default flush run?', 'Where would a `setTimeout(…, 0)` log appear?'],
      modelAnswer: 'B first, because synchronous code runs to completion. The increment queued a component update and a flush microtask, and `nextTick` chained its callback after that flush. When the flush runs, the component re-renders and its `updated` hook logs C. Then the nextTick callback logs A. A `setTimeout(…, 0)` would come after all of these, because it\'s a task, not a microtask.',
    },
    {
      id: 'next-tick-focus-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'When a user clicks **Reply**, a textarea appears below a comment and should receive focus. Walk through how you would implement it and the alternatives.',
      answer: 'Toggle a `replying` ref that drives `v-if`, then `await nextTick()` and call `focus()` on the template ref. Alternatives: a small custom directive (`v-focus`) whose `mounted` hook focuses the element whenever it is inserted; or extracting the reply form into a child component that focuses itself in `onMounted`. All three wait until the element exists; the directive/child approaches keep the focus logic next to the element and work no matter what toggles it.',
      explanation: 'The core problem is timing: the element doesn\'t exist when the click handler changes state.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, nextTick, useTemplateRef } from 'vue'

const replying = ref(false)
const box = useTemplateRef('box')

async function reply() {
  replying.value = true
  await nextTick()
  box.value.focus()
}

// alternative: a local custom directive, used as v-focus on the element
const vFocus = { mounted: (el) => el.focus() }
</script>

<template>
  <button @click="reply">Reply</button>
  <textarea v-if="replying" ref="box" />
</template>`,
      },
      whyAsked: 'A practical, extremely common task that also touches accessibility.',
      mistakes: ['Focusing immediately after setting state.', 'Using `setTimeout` with a delay.', 'Relying on the `autofocus` attribute for elements inserted later — browsers handle it inconsistently.'],
      followUps: ['How would you return focus to the Reply button when the form is cancelled?', 'How do you test this?'],
      modelAnswer: 'I would drive the textarea with a `replying` ref and `v-if`. In the click handler I set `replying` to true, `await nextTick()` so Vue renders the textarea, then focus it through a template ref. If this pattern repeats, a `v-focus` directive using the `mounted` hook, or a child component that focuses itself in `onMounted`, keeps the logic next to the element. For accessibility I would also return focus to the Reply button when the form closes.',
    },
    {
      id: 'next-tick-settimeout',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate scrolls a log view with `setTimeout(scrollToBottom, 50)` after pushing a line, "because without the timeout it scrolls to the wrong place". What is happening, and what would you change?',
      code: {
        lang: 'js',
        code: `function addLine(line) {
  lines.value.push(line)
  setTimeout(scrollToBottom, 50) // "needed, otherwise it's one line off"
}`,
      },
      answer: 'Without waiting, `scrollToBottom` runs before Vue patches the DOM, so the new line isn\'t there and the scroll height is one line short. The timeout "fixes" it by running later, but the delay is arbitrary (flaky on slow devices, a visible jump on fast ones). Replace it with `await nextTick()` after the push, or a `flush: \'post\'` watcher on `lines`.',
      explanation: 'The bug is timing, not scrolling. nextTick resolves exactly when Vue\'s update is done; a timer only guesses.',
      whyAsked: 'Magic timeouts are a common code smell; this checks you can explain the real cause and the precise fix.',
      mistakes: ['Increasing the timeout.', 'Suggesting `requestAnimationFrame` without explaining Vue\'s flush.', 'Moving the scroll into `onUpdated` (runs on every unrelated update).'],
      followUps: ['Why does even `setTimeout(fn, 0)` usually work?', 'How would you avoid scrolling when the user has scrolled up to read history?'],
      modelAnswer: 'The scroll runs before Vue has rendered the new line, because DOM updates are batched into the next tick, so the scroll height is stale. The timeout works by accident: by 50ms Vue has flushed. But it\'s a guess — flaky under load and needlessly late otherwise. I would make the function async and `await nextTick()` after pushing, or put the scroll in a watcher on `lines` with `flush: \'post\'` so it follows every change. A zero timeout also tends to work, because tasks run after microtasks, but it can still run after a paint and cause a jump.',
    },
    {
      id: 'next-tick-testing',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'In a component test, you click a button that increments a counter, then assert on the text — and the assertion sees the old value. Why, and what are the correct ways to wait? What if the click also triggers a (mocked) API call?',
      answer: 'The DOM update is asynchronous, so the assertion ran before Vue\'s flush. Await the update: `await nextTick()`, or await the testing helper that triggered it (Vue Test Utils\' `trigger()` returns a promise that resolves after the next tick). If the click starts a mocked API call, nextTick isn\'t enough — you must wait for that promise to resolve, e.g. with VTU\'s `flushPromises()` (a testing-library helper, not Vue core) or by awaiting the mocked call, then wait for the resulting re-render.',
      explanation: 'Two different kinds of waiting: for Vue\'s DOM flush (nextTick) and for your own async work (its promise). Tests often need both.',
      code: {
        lang: 'js',
        code: `// Vue Test Utils + Vitest (static example)
await wrapper.find('button').trigger('click') // resolves after the next tick
expect(wrapper.text()).toContain('1')

await wrapper.find('.load').trigger('click')
await flushPromises()                          // VTU helper: settle pending promises
expect(wrapper.findAll('li')).toHaveLength(3)`,
      },
      whyAsked: 'Flaky or failing tests around timing are common; this shows you can reason about what exactly you are waiting for.',
      mistakes: ['Adding arbitrary `setTimeout` waits in tests.', 'Thinking `nextTick()` also waits for API promises.', 'Attributing `flushPromises` to Vue core.'],
      followUps: ['How would you test a debounced input?', 'What is the difference between a microtask and a task in this context?'],
      modelAnswer: 'The assertion runs before Vue\'s asynchronous DOM flush. I either `await nextTick()` or await the helper that caused the change — Vue Test Utils\' `trigger` resolves after the next tick. If the click also kicks off a mocked request, nextTick isn\'t enough, because the data arrives later. Then I wait for the promise itself, for example with VTU\'s `flushPromises()` — a test helper, not part of Vue — and assert after the resulting re-render. I avoid fixed timeouts because they make tests slow and flaky.',
    },
    {
      id: 'next-tick-coding-rename',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Clicking **Rename** (`.rename`) should open a panel (`.panel`) with an input (`.name-input`) pre-filled with the current name and **focused**. **Save** (`.save`) stores the trimmed value in `.name` (ignoring empty input) and closes the panel. The starter crashes when you click Rename — fix it.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, useTemplateRef } from 'vue'

const name = ref('Ada Lovelace')
const editing = ref(false)
const draft = ref('')
const nameInput = useTemplateRef('nameInput')

function startEditing() {
  draft.value = name.value
  editing.value = true
  nameInput.value.focus()
}

function save() {
  name.value = draft.value.trim() || name.value
  editing.value = false
}
</script>

<template>
  <p class="name">{{ name }}</p>
  <button class="rename" @click="startEditing">Rename</button>
  <div v-if="editing" class="panel">
    <input ref="nameInput" class="name-input" v-model="draft" />
    <button class="save" @click="save">Save</button>
  </div>
</template>`,
        },
      },
      tests: [
        {
          name: 'Rename opens a pre-filled, focused input',
          code: `await click('.rename')
expect(isVisible('.panel')).toBe(true)
expect(find('.name-input').value).toBe('Ada Lovelace')
expect(document.activeElement).toBe(find('.name-input'))`,
        },
        {
          name: 'Save stores the new name and closes the panel',
          code: `await click('.rename')
await type('.name-input', '  Grace Hopper ')
await click('.save')
expect(text('.name')).toBe('Grace Hopper')
expect(exists('.panel')).toBe(false)`,
        },
        { name: 'saving an empty name keeps the old one', code: `await click('.rename'); await type('.name-input', '   '); await click('.save'); expect(text('.name')).toBe('Ada Lovelace')` },
      ],
      hints: [
        'The crash says the ref is `null`: the `<input>` inside `v-if` doesn\'t exist yet when `focus()` runs.',
        'Import `nextTick`, make `startEditing` async, and `await nextTick()` after setting `editing`.',
      ],
      answer: 'Await nextTick() after opening the panel and before focusing the input.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, nextTick, useTemplateRef } from 'vue'

const name = ref('Ada Lovelace')
const editing = ref(false)
const draft = ref('')
const nameInput = useTemplateRef('nameInput')

async function startEditing() {
  draft.value = name.value
  editing.value = true
  await nextTick()
  nameInput.value.focus()
}

function save() {
  name.value = draft.value.trim() || name.value
  editing.value = false
}
</script>

<template>
  <p class="name">{{ name }}</p>
  <button class="rename" @click="startEditing">Rename</button>
  <div v-if="editing" class="panel">
    <input ref="nameInput" class="name-input" v-model="draft" />
    <button class="save" @click="save">Save</button>
  </div>
</template>`,
        },
      },
      explanation: 'Setting `editing` only queues the render that creates the input. After `await nextTick()`, the input exists, the template ref points to it, and `focus()` works.',
      whyAsked: 'The canonical nextTick task, under interview conditions.',
      mistakes: ['Wrapping `focus()` in `setTimeout`.', 'Using `nameInput.value?.focus()` — it hides the crash but still doesn\'t focus.', 'Forgetting to make the function async.'],
      followUps: ['How would you also select all the text?', 'How would you return focus to the Rename button after saving?'],
      modelAnswer: 'The input is rendered by `v-if`, so it doesn\'t exist in the same tick that `editing` becomes true — the ref is null. I make `startEditing` async and `await nextTick()` before focusing. To select the text I would call `select()` after `focus()`, and after saving I would move focus back to the Rename button for keyboard users.',
    },
  ],

  takeaways: [
    'State changes are synchronous; DOM updates are batched and applied in the next tick.',
    'A component re-renders at most once per tick, however many of its dependencies changed.',
    '`await nextTick()` (or `nextTick(cb)`) runs code after Vue has patched the DOM.',
    'Use it for imperative DOM work after a change: focus, scroll, select, measure, third-party widgets.',
    'It doesn\'t wait for network, timers, images or transitions — and you never need it to read state.',
    'For DOM work that should follow every change of some state, prefer a `flush: \'post\'` watcher.',
  ],
}
