// Lesson: customRef() (Level 11 — Advanced Reactivity & Internals)

const debouncedRefJs = `import { customRef } from 'vue'

// A ref whose new value only "lands" after typing pauses for \`delay\` ms
export function useDebouncedRef(value, delay = 300) {
  let timer
  return customRef((track, trigger) => ({
    get() {
      track()            // whoever reads me depends on me
      return value
    },
    set(newValue) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        value = newValue
        trigger()        // now tell my dependents
      }, delay)
    },
  }))
}`

const apiJs = `import { reactive } from 'vue'

export const stats = reactive({ searches: 0 })

const FRUITS = ['Apple', 'Apricot', 'Banana', 'Blackberry', 'Blueberry', 'Cherry', 'Grape',
  'Mango', 'Melon', 'Orange', 'Peach', 'Pear', 'Pineapple', 'Plum', 'Strawberry']

// A fake search API: counts every call and answers after 100 ms
export function searchFruits(query) {
  stats.searches++
  console.log('search #' + stats.searches + ': "' + query + '"')
  const q = query.toLowerCase()
  return new Promise((resolve) => {
    setTimeout(() => resolve(FRUITS.filter((f) => f.toLowerCase().includes(q))), 100)
  })
}`

const searchApp = `<script setup>
import { ref, watch } from 'vue'
import { useDebouncedRef } from './useDebouncedRef.js'
import { searchFruits, stats } from './api.js'

const query = useDebouncedRef('', 300)
const results = ref([])

watch(query, async (q) => {
  results.value = await searchFruits(q)
}, { immediate: true })
</script>

<template>
  <h2>Fruit search</h2>
  <input class="search" v-model="query" placeholder="Type a fruit…" />
  <p class="searches">Searches run: {{ stats.searches }}</p>
  <p class="query">Searching for: "{{ query }}"</p>
  <ul class="results">
    <li v-for="fruit in results" :key="fruit">{{ fruit }}</li>
  </ul>
</template>`

const clampedApp = `<script setup>
import { useClampedRef } from './clamped.js'

const qty = useClampedRef(1, 1, 10)
</script>

<template>
  <label>
    Quantity (1–10):
    <input class="qty" type="number" v-model.number="qty" />
  </label>
  <p class="value">Quantity: {{ qty }}</p>
</template>`

export default {
  id: 'custom-ref',
  title: 'customRef()',
  summary: 'Build your own kind of ref by deciding exactly when Vue tracks a read and when it notifies dependents — debounced, clamped and storage-backed refs.',
  difficulty: 'advanced',
  minutes: 35,
  prerequisites: ['ref', 'dependency-tracking', 'effect-scope'],
  related: ['composable-recipes', 'runtime-performance', 'shallow-and-raw', 'scheduling-flush', 'v-model-forms'],
  tags: ['customRef', 'track', 'trigger', 'debounce', 'debounced ref', 'clamp', 'validation', 'localStorage', 'composables'],
  apis: [
    { name: 'customRef(factory)', summary: 'Creates a ref with explicit control over tracking and triggering. The factory receives (track, trigger) and returns { get, set }.' },
    { name: 'track()', summary: 'Inside a customRef getter: records the currently running effect as a dependent of this ref.' },
    { name: 'trigger()', summary: 'Inside a customRef: notifies every dependent that the value changed. Call it whenever you decide the change should be visible.' },
  ],
  docs: [
    { label: 'API — Reactivity: Advanced — customRef()', url: 'https://vuejs.org/api/reactivity-advanced.html#customref' },
    { label: 'Vue Guide — Reactivity in Depth', url: 'https://vuejs.org/guide/extras/reactivity-in-depth.html' },
    { label: 'Vue Guide — Composables', url: 'https://vuejs.org/guide/reusability/composables.html' },
  ],

  intro: `
A normal \`ref()\` makes two decisions for you: every read of \`.value\` is **tracked**, and every write of a different value **triggers** an update immediately.

\`customRef()\` hands those two decisions to you. You write the getter and setter yourself and receive two functions from Vue: \`track()\` ("someone depends on me") and \`trigger()\` ("my dependents should update now"). Call them when *you* decide.

That small amount of control unlocks refs with behaviour built in: a **debounced** ref that only updates after typing pauses, a **clamped** ref that refuses out-of-range values, a ref that **persists** itself to \`localStorage\`. To the rest of your app it is still just a ref — it works in templates, with \`v-model\`, \`watch\` and \`computed\`.
`,

  why: `
Some behaviour belongs to the *value itself*, not to the component that uses it. "Wait until the user stops typing" is a classic: without \`customRef\` you need two refs and a watcher.

\`\`\`js
const input = ref('')
const query = ref('')
let timer
watch(input, (v) => {
  clearTimeout(timer)
  timer = setTimeout(() => (query.value = v), 300)
})
\`\`\`

It works, but the debounce logic leaks into every component that needs it, and the two refs can be confused. With \`customRef\` you package the behaviour once — \`const query = useDebouncedRef('', 300)\` — and every consumer gets a single ref that simply updates late.

It also exposes the reactivity system's two primitives in a safe, public way, which makes it a great lens for understanding [how tracking works](lesson:dependency-tracking).
`,

  eli15: `
Imagine a class notice board with a rule: students who *read* the board sign a list, and when the board changes, the teacher calls everyone on the list.

A normal ref is a board where both things happen automatically: reading signs you up, and any new notice calls everyone straight away.

With \`customRef\` **you** are the board manager. You choose to sign readers up (\`track()\`), and you choose when to call them (\`trigger()\`). Maybe you wait until the teacher has stopped scribbling for a few seconds before calling anyone — that's a debounced ref. Maybe you refuse to pin up anything with a spelling mistake — that's a validated ref.

From the students' point of view, it's still just a notice board.
`,

  analogy: {
    title: 'The notice board manager',
    body: `
A self-service notice board updates everyone instantly. A managed board lets a person decide who's on the call list and when the calls go out — while looking exactly the same to the students.
`,
    mapping: [
      ['the notice board', 'the customRef — still a ref to everyone else'],
      ['students signing the list when they read', '`track()` called in `get()`'],
      ['the manager phoning the list', '`trigger()`'],
      ['waiting for the scribbling to stop', 'a debounced set: trigger after a pause'],
      ['refusing a bad notice', 'a validated/clamped set'],
      ['students reading without signing', 'a getter that forgets `track()` — nobody is ever called'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'You hold the two switches',
    caption: 'A customRef is a ref whose two reactive moments — tracking and triggering — are yours to place.',
    alt: 'A stepped diagram. A component render reads the custom ref, whose get function calls track to subscribe the render. Typing calls set, which stores the value and starts a timer instead of triggering. When the timer finishes, set calls trigger, the render re-runs and reads the ref again through get.',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'render', label: 'Render / watcher', note: 'reads query', x: 110, y: 80, tone: 'acid' },
        { id: 'get', label: 'get()', note: 'track(); return value', x: 380, y: 80, tone: 'cobalt' },
        { id: 'input', label: 'v-model input', note: 'user types', x: 110, y: 230, tone: 'kraft' },
        { id: 'set', label: 'set(newValue)', note: 'store + start timer', x: 380, y: 230, tone: 'cobalt' },
        { id: 'timer', label: 'timer fires', note: 'after 300 ms of quiet', x: 640, y: 230, tone: 'paper' },
        { id: 'trigger', label: 'trigger()', note: 'notify dependents', x: 640, y: 80, tone: 'red' },
      ],
      edges: [
        { from: 'render', to: 'get', label: 'read' },
        { from: 'input', to: 'set', label: 'write' },
        { from: 'set', to: 'timer', label: 'setTimeout' },
        { from: 'timer', to: 'trigger', label: 'value = newValue' },
        { from: 'trigger', to: 'render', label: 're-run', dashed: true },
      ],
      steps: [
        { focus: ['render', 'get'], edges: ['render->get'], text: 'A render (or watcher) reads the ref. Your `get()` calls **track()**, so that effect is now a dependent.' },
        { focus: ['input', 'set'], edges: ['input->set'], text: 'The user types; `v-model` writes to the ref, calling your `set()`. A normal ref would notify immediately. Yours doesn\'t — yet.' },
        { focus: ['set', 'timer'], edges: ['set->timer'], text: 'Each keystroke restarts the timer. While the user keeps typing, nothing is triggered and no search runs.' },
        { focus: ['timer', 'trigger'], edges: ['timer->trigger'], text: 'After a pause the timer fires: store the value and call **trigger()**.' },
        { focus: ['trigger', 'render', 'get'], edges: ['trigger->render', 'render->get'], text: 'Dependents re-run, call `get()` again (re-tracking) and see the new value. You decided the moment.' },
      ],
    },
  },

  syntax: [
    `
#### The shape
`,
    {
      code: `import { customRef } from 'vue'

const myRef = customRef((track, trigger) => {
  // private state lives in this closure
  let value = 'initial'

  return {
    get() {
      track()          // subscribe the current effect (if any)
      return value
    },
    set(newValue) {
      value = newValue
      trigger()        // notify dependents
    },
  }
})

myRef.value          // calls get()
myRef.value = 'next' // calls set('next')`,
      lang: 'js',
      title: 'customRef(factory)',
    },
    `
**The rules:**

1. The factory runs **once**, when the ref is created. Keep private state in its closure.
2. \`get()\` must call \`track()\` or nothing will ever react to this ref.
3. Nothing updates until you call \`trigger()\`. Vue does **not** compare old and new values for you — skip the call yourself if nothing changed (or call it on purpose, see the clamped ref).
4. \`get()\` runs on **every** read — there is no caching like \`computed\`. Keep it cheap.
5. The result is a real ref: \`isRef()\` is true, templates unwrap it, \`v-model\`, \`watch\` and \`computed\` accept it.
`,
    `
#### A debounced ref (with cleanup)
`,
    {
      code: `import { customRef, onScopeDispose } from 'vue'

export function useDebouncedRef(value, delay = 300) {
  let timer
  // clear a pending timer if the owner (component or scope) goes away;
  // 'true' = failSilently (3.5+): no warning when used outside any scope
  onScopeDispose(() => clearTimeout(timer), true)

  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        value = newValue
        trigger()
      }, delay)
    },
  }))
}`,
      lang: 'js',
      title: 'useDebouncedRef',
    },
    {
      callout: 'warn',
      title: 'Debounced refs and v-model',
      text: 'While the delay is running, the ref still holds the **old** value. If the component re-renders for any other reason during that window (a clock, a parent update), `v-model` writes the old value back into the input and the user\'s latest keystrokes disappear from the box. For text inputs, the robust pattern is a normal ref bound to the input plus a debounced value derived from it; use a debounced customRef where nothing else re-renders the component mid-typing, or for non-input values.',
    },
    `
#### A clamped ref: trigger even when nothing changed
`,
    {
      code: `export function useClampedRef(initial, min, max) {
  let value = initial
  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(next) {
      value = Math.min(max, Math.max(min, Number(next)))
      trigger() // ALWAYS: if 150 was clamped to the 10 we already had,
                // re-rendering lets v-model put "10" back in the input
    },
  }))
}`,
      lang: 'js',
      title: 'useClampedRef',
    },
    {
      callout: 'version',
      title: 'Version notes',
      text: '`customRef()` is part of Vue 3\'s public reactivity API. The `failSilently` second argument of `onScopeDispose` is **3.5+**; on older versions guard with `if (getCurrentScope()) onScopeDispose(…)`.',
    },
    {
      callout: 'note',
      title: 'Public API vs internals',
      text: 'Public: `customRef(factory)`, the `track`/`trigger` arguments and the `{ get, set }` contract. Internal: the `CustomRefImpl` class and the `Dep` object whose methods `track` and `trigger` actually are — don\'t rely on their names or properties.',
    },
  ],

  walkthrough: {
    title: 'useDebouncedRef.js',
    lang: 'js',
    code: debouncedRefJs,
    intro: 'The heart of the playground: a ref that only lands after a pause. (The production version above adds timer cleanup.)',
    steps: [
      { lines: [4], text: 'A normal function — a composable. `value` is the private, current value; it lives in this closure, not in any reactive object.' },
      { lines: [5], text: '`timer` holds the pending timeout, so each new keystroke can cancel the previous one.' },
      { lines: [6], text: '`customRef` calls our factory once with Vue\'s two primitives: `track` and `trigger`.' },
      { lines: [7, 10], text: '`get()` subscribes whoever is reading (a render, a watcher) and returns the value. Forget `track()` here and nothing would ever update.' },
      { lines: [11, 17], text: '`set()` doesn\'t store or notify straight away. It restarts a timer; only when typing pauses does it store the new value and call `trigger()`.' },
    ],
  },

  playground: {
    title: 'Debounced fruit search',
    objective: 'Type in the box and watch the search counter, then change when — and whether — the ref triggers.',
    files: { 'App.vue': searchApp, 'useDebouncedRef.js': debouncedRefJs, 'api.js': apiJs },
    expected: `
An input, **Searches run: 1** (the first, immediate search), and all fifteen fruits. Type \`berry\` quickly: the counter goes up **once**, about 300 ms after you stop, and three berries remain. The console shows each search with its query.
`,
    experiments: [
      {
        id: 'longer-delay',
        task: 'Make the search wait for **500 ms** of quiet instead of 300 ms.',
        hint: 'The delay is the second argument of `useDebouncedRef(...)` in **App.vue**.',
        tests: [
          {
            name: 'nothing runs at 350 ms; the search runs by 650 ms',
            code: `await type('.search', 'ap')
await wait(350)
expect(text('.searches')).toBe('Searches run: 1')
await wait(300)
expect(text('.searches')).toBe('Searches run: 2')`,
          },
        ],
        explain: 'The delay is configuration of the ref itself; consumers don\'t change. Longer delays mean fewer requests but a slower-feeling UI — pick by measuring how people type, not by guessing.',
      },
      {
        id: 'clear-immediately',
        task: 'When the box is **cleared** (empty string), apply it **immediately** instead of waiting.',
        hint: 'At the top of `set()`: if `newValue === \'\'`, `clearTimeout(timer)`, set `value`, call `trigger()` and `return`.',
        tests: [
          {
            name: 'clearing the box searches without waiting',
            code: `await type('.search', 'ap')
await wait(450)
expect(text('.searches')).toBe('Searches run: 2')
await type('.search', '')
await wait(150)
expect(text('.searches')).toBe('Searches run: 3')
expect(findAll('.results li')).toHaveLength(15)`,
          },
        ],
        explain: 'You own `trigger()`, so you can trigger at different times for different values. Here clearing feels instant while typing stays debounced.',
      },
      {
        id: 'normalise',
        task: 'Trim whitespace before committing, and **don\'t trigger** if the trimmed value equals the current one. Typing `ap` and then `ap   ` should run only one search.',
        hint: 'Compute `const next = newValue.trim()` and, inside the timeout, `if (next === value) return` before assigning and triggering.',
        tests: [
          {
            name: 'trailing spaces do not cause a second search',
            code: `await type('.search', 'ap')
await wait(450)
expect(text('.searches')).toBe('Searches run: 2')
await type('.search', 'ap   ')
await wait(450)
expect(text('.searches')).toBe('Searches run: 2')
expect(text('.query')).toBe('Searching for: "ap"')`,
          },
        ],
        explain: 'A plain ref compares with `Object.is` for you; a customRef doesn\'t. Normalising and skipping no-op triggers is your job — and it saves a whole render-and-search cycle.',
      },
      {
        id: 'get-every-read',
        task: 'Add `console.log(\'get\')` inside `get()`. Type a few letters and count the logs.',
        hint: 'Every render reads the ref twice (the input\'s value and the "Searching for" line) and the watcher reads it too.',
        explain: 'Unlike `computed`, a customRef has **no cache**: `get()` runs on every single read. That\'s fine for returning a variable — but never do expensive work there.',
      },
    ],
    variants: [
      {
        id: 'clamped',
        label: 'A clamped ref',
        files: {
          'App.vue': clampedApp,
          'clamped.js': `import { customRef } from 'vue'

export function useClampedRef(initial, min, max) {
  let value = initial
  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(next) {
      const n = Number(next)
      if (!Number.isNaN(n)) value = Math.min(max, Math.max(min, n))
      trigger() // always, so the input snaps back to the clamped value
    },
  }))
}`,
        },
      },
    ],
  },

  animation: {
    type: 'performance',
    props: { demo: 'debounce' },
    title: 'Debouncing, measured',
    caption: 'Type in both boxes: one reacts to every keystroke, the other waits for a pause. The counts are measured live in your browser — try typing fast and slow.',
    alt: 'A live, measured demo with two inputs: one handles every keystroke immediately, the other is debounced. Counters show how many times each handler actually ran while you type.',
  },

  internals: {
    beginner: `
Every ref has a little list of "who's interested in me". A normal ref adds readers to the list automatically and phones the whole list the moment its value changes.

A customRef gives you the pen and the phone. \`track()\` writes the current reader on the list; \`trigger()\` phones everyone on it. Vue still manages the list and decides *how* to re-run those readers (batched, in order) — you just decide *when* the call goes out.
`,
    technical: [
      `
Under the hood, Vue creates one dependency object for each customRef and passes you its \`track\` and \`trigger\` methods. Reading \`.value\` calls your \`get()\` every time; writing calls your \`set()\`. Because the ref has a single dependency, \`track()\` subscribes "the current effect" to the whole ref and \`trigger()\` schedules every subscriber — exactly like a \`ref\`'s \`.value\`, minus the automatic \`Object.is\` check and deep conversion.

Calling \`trigger()\` doesn't run dependents synchronously: component renders and default watchers are **queued** and flushed together (see [scheduling & flush timing](lesson:scheduling-flush)). Calling \`trigger()\` three times in one tick still produces one render. \`track()\` outside a running effect (in an event handler, say) is a no-op — just as with any ref.
`,
      {
        code: `// A SIMPLIFIED model of customRef — not Vue's source
function customRef(factory) {
  const subscribers = new Set()
  const track = () => { if (activeEffect) subscribers.add(activeEffect) }
  const trigger = () => subscribers.forEach((effect) => scheduler.queue(effect))
  const { get, set } = factory(track, trigger)
  return {
    __isRef: true,
    get value() { return get() },   // no cache: runs on every read
    set value(v) { set(v) },
  }
}`,
        lang: 'js',
        title: 'mental model',
      },
      {
        callout: 'warn',
        title: 'Implementation detail',
        text: 'In Vue 3.5 the class is `CustomRefImpl`, and `track`/`trigger` are bound methods of an internal `Dep`. Those names, and fields like `dep`, are not public and changed shape in the 3.5 reactivity refactor.',
      },
    ],
    production: `
- **Package behaviour, not business logic.** Debounce, throttle, clamp, normalise, persist — generic value behaviour is a great fit. "Fetch the user when the id changes" is not; that's a watcher.
- **Clean up timers** with \`onScopeDispose\` (3.5+: \`failSilently\`) so a pending debounce can't fire after the component is gone.
- **Mind \`v-model\` with delayed refs**: a re-render during the delay writes the stale value into the input. Bind inputs to a plain ref and debounce a derived value when the component can re-render while the user types.
- **Skip no-op triggers** for expensive dependents; **trigger deliberately** when the UI must be corrected (clamping, rejecting input).
- **Keep \`get()\` trivial.** It runs on every read, including every render.
- **Libraries already ship these.** VueUse, for example, provides debounced, throttled and storage-backed refs; reading their source is a great way to see production-grade edge-case handling. Write your own when you need behaviour they don't cover.
`,
  },

  mistakes: [
    {
      title: 'Forgetting `track()` in the getter',
      wrong: { code: `customRef((track, trigger) => ({\n  get() { return value },          // nobody is ever subscribed\n  set(v) { value = v; trigger() },\n}))`, lang: 'js' },
      right: { code: `customRef((track, trigger) => ({\n  get() { track(); return value },\n  set(v) { value = v; trigger() },\n}))`, lang: 'js' },
      explanation: 'Without `track()`, renders and watchers read the value but never subscribe, so `trigger()` has no one to notify. The screen shows the first value forever.',
    },
    {
      title: 'Forgetting `trigger()` in the setter',
      wrong: { code: `set(v) {\n  value = v // stored… but nobody is told\n}`, lang: 'js' },
      right: { code: `set(v) {\n  value = v\n  trigger()\n}`, lang: 'js' },
      explanation: 'The value changes in memory, but dependents only re-run when you call `trigger()`. The UI updates only by accident when something else re-renders it.',
    },
    {
      title: 'Expensive work in `get()`',
      wrong: { code: `get() {\n  track()\n  return hugeList.filter(matches).sort(byScore) // runs on EVERY read\n}`, lang: 'js' },
      right: { code: `const raw = useDebouncedRef('')\nconst results = computed(() => hugeList.filter((x) => matches(x, raw.value)).sort(byScore))`, lang: 'js' },
      explanation: 'A customRef doesn\'t cache. Derived, expensive values belong in a `computed`, which is cached until its dependencies change.',
    },
    {
      title: 'A debounce timer that outlives its component',
      wrong: { code: `export function useDebouncedRef(value, delay) {\n  let timer\n  return customRef(/* … setTimeout without cleanup … */)\n}`, lang: 'js' },
      right: { code: `export function useDebouncedRef(value, delay) {\n  let timer\n  onScopeDispose(() => clearTimeout(timer), true) // 3.5+\n  return customRef(/* … */)\n}`, lang: 'js' },
      explanation: 'Unmount the component while a timer is pending and the timeout still fires later, running code for a component that no longer exists. Register cleanup on the owning scope.',
    },
  ],

  debugging: [
    {
      symptom: 'The template never changes after writing to the customRef.',
      cause: '`get()` doesn\'t call `track()`, or `set()` doesn\'t call `trigger()`.',
      fix: 'Call `track()` before returning in `get()`, and `trigger()` whenever the change should become visible.',
    },
    {
      symptom: 'Characters disappear from an input bound to a debounced ref.',
      cause: 'Something re-rendered the component during the delay, and `v-model` wrote the old (not yet committed) value back into the input.',
      fix: 'Bind the input to a plain ref and derive a debounced value from it, or avoid re-renders of that component while typing.',
    },
    {
      symptom: 'An out-of-range number stays in a clamped input.',
      cause: 'The setter only triggers when the stored value changes — and clamping produced the same value as before.',
      fix: 'Call `trigger()` unconditionally in that setter so the component re-renders and `v-model` resets the field.',
    },
    {
      symptom: 'A watcher on the customRef runs even though the value is the same.',
      cause: 'A `watchEffect` (or render) re-runs on every `trigger()`; customRef never skips triggers for you. (A `watch` callback is still skipped when the value is unchanged.)',
      fix: 'Compare in `set()` and skip `trigger()` when the new value equals the old one.',
    },
  ],

  bestPractices: [
    'Always pair `track()` in `get()` with `trigger()` in `set()` (or in your timer).',
    'Keep `get()` cheap; put expensive derivations in `computed`.',
    'Decide explicitly whether to skip unchanged values or trigger on purpose — and comment why.',
    'Clean up timers and listeners with `onScopeDispose`.',
    'Wrap customRefs in `useSomething()` composables with clear names (`useDebouncedRef`, `useClampedRef`).',
    'Prefer a writable `computed` when the value is purely derived from other state.',
  ],

  useCases: [
    'Debounced search queries and filters.',
    'Throttled values from rapid sources (slider drags, scroll positions).',
    'Clamped or validated numeric inputs that snap back.',
    'A ref persisted to `localStorage` (and updated from other tabs via the `storage` event).',
    'Normalising input on write (trim, lowercase) with no-op writes skipped.',
  ],

  whenToUse: {
    use: [
      'Behaviour belongs to the value: delay, rate-limit, validate, normalise, persist.',
      'You need control over *when* dependents update, not only *what* they see.',
      'You want consumers to receive one ordinary ref instead of a ref plus a watcher.',
    ],
    avoid: [
      'The value is derived from other reactive state — use `computed` (writable if needed).',
      'You need a side effect when something changes (fetching, saving) — use `watch`.',
      'A bound text input can be re-rendered mid-typing — debounce a derived value instead of the input\'s own ref.',
    ],
  },

  comparison: {
    title: 'customRef vs similar tools',
    headers: ['', '`ref()`', '`customRef()`', 'writable `computed`', '`ref` + `watch`'],
    rows: [
      ['When dependents update', 'immediately on change', 'whenever you call `trigger()`', 'when its sources change', 'when the watcher writes'],
      ['Skips unchanged values', 'yes (`Object.is`)', 'only if you code it', 'yes (3.4+ stability)', 'depends on your code'],
      ['Caches reads', 'n/a (stores a value)', 'no — `get()` runs every read', 'yes', 'n/a'],
      ['Holds its own state', 'yes', 'yes (closure)', 'no — derived', 'yes (two refs)'],
      ['Good for', 'plain state', 'debounce, clamp, persist', 'derived values with a setter', 'side effects'],
    ],
    note: 'Writable computeds are covered in [computed()](lesson:computed); shallow refs and `triggerRef` in [shallowRef, triggerRef, markRaw & toRaw](lesson:shallow-and-raw).',
  },

  quiz: [
    {
      id: 'custom-ref-q1',
      type: 'mcq',
      prompt: 'In a customRef, what must `get()` do so that components re-render later?',
      options: [
        { text: 'Call `trigger()`', why: '`trigger()` notifies dependents; calling it on every read would cause needless re-runs and doesn\'t subscribe anyone.' },
        { text: 'Call `track()` before returning the value' },
        { text: 'Return a new object each time', why: 'Returning new objects has nothing to do with subscribing — and would break identity.' },
        { text: 'Nothing — Vue tracks customRefs automatically', why: 'Automatic tracking is exactly what customRef hands over to you.' },
      ],
      answer: 1,
      explanation: '`track()` records the running effect as a dependent. Without it, `trigger()` later has nobody to notify.',
    },
    {
      id: 'custom-ref-q2',
      type: 'output',
      prompt: 'The button is clicked once. What does the heading show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { customRef } from 'vue'

let value = 1
const n = customRef((track, trigger) => ({
  get() { track(); return value },
  set(v) { value = v },
}))
</script>

<template>
  <h2>{{ n }}</h2>
  <button @click="n = n + 1">+1</button>
</template>`,
      },
      options: [
        { text: '1' },
        { text: '2', why: 'The value is 2 in memory, but `set()` never calls `trigger()`, so the heading never re-renders.' },
        { text: 'NaN', why: 'Reading works fine; `n + 1` is 2.' },
        { text: 'An error is thrown', why: 'Nothing throws — the update is just silent.' },
      ],
      answer: 0,
      explanation: 'The setter stores 2 but never triggers, so the component isn\'t told to re-render.',
    },
    {
      id: 'custom-ref-q3',
      type: 'bug',
      prompt: 'The search results never update, although `set()` triggers after the delay. Click the buggy line.',
      code: {
        lang: 'js',
        code: `export function useDebouncedRef(value, delay = 300) {
  let timer
  return customRef((track, trigger) => ({
    get() {
      return value
    },
    set(newValue) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        value = newValue
        trigger()
      }, delay)
    },
  }))
}`,
      },
      answerLine: 5,
      explanation: '`get()` returns without calling `track()`, so no render or watcher ever subscribes. Add `track()` before the return.',
    },
    {
      id: 'custom-ref-q4',
      type: 'fill',
      prompt: 'Fill the blanks: the names of the two functions Vue passes to the factory.',
      code: {
        lang: 'js',
        code: `const name = customRef((___, ___) => ({
  get() {
    track()
    return current
  },
  set(v) {
    current = v.trim()
    trigger()
  },
}))`,
      },
      answer: [['track'], ['trigger']],
      explanation: 'The factory receives `(track, trigger)` and returns `{ get, set }`.',
    },
    {
      id: 'custom-ref-q5',
      type: 'output',
      prompt: '`get()` logs "get". How many times is it logged by these three lines (no writes in between)?',
      code: {
        lang: 'js',
        code: `const r = customRef((track) => ({
  get() { console.log('get'); track(); return 42 },
  set() {},
}))

r.value
r.value
r.value`,
      },
      options: [
        { text: '3' },
        { text: '1', why: 'That would be true for a computed. A customRef has no cache.' },
        { text: '0', why: 'Reading `.value` always calls `get()`.' },
        { text: '6', why: 'Each read calls `get()` exactly once.' },
      ],
      answer: 0,
      explanation: 'Every `.value` read calls `get()`. Keep getters cheap.',
    },
    {
      id: 'custom-ref-q6',
      type: 'mcq',
      prompt: 'You need `fullName` that reads `first`/`last` and, when assigned, splits the string back into them. Best tool?',
      options: [
        { text: 'A writable `computed` with get/set' },
        { text: '`customRef`', why: 'It would work, but the value is purely derived from other state — exactly what writable computed is for, with caching included.' },
        { text: 'Two watchers syncing three refs', why: 'Watchers that sync state are fragile and can loop. Derive instead.' },
        { text: '`shallowRef`', why: 'shallowRef controls deep reactivity; it doesn\'t derive values.' },
      ],
      answer: 0,
      explanation: 'Derived value + setter = writable computed. customRef is for values with their own state and custom timing or validation.',
    },
    {
      id: 'custom-ref-q7',
      type: 'short',
      prompt: 'In a clamped ref, why call `trigger()` even when clamping produced the value the ref already had?',
      answer: 'Because the input element still shows what the user typed (say 150). If the stored value didn\'t change and we skip `trigger()`, nothing re-renders, so `v-model` never resets the field. Triggering forces a re-render, and `v-model` writes the clamped value (10) back into the input.',
    },
  ],

  exercises: [
    {
      id: 'clamped-ref',
      title: 'A quantity that stays in range',
      difficulty: 'intermediate',
      prompt: `
Implement \`useClampedRef(initial, min, max)\` in **clamped.js** with \`customRef\`.

- Values written outside \`min\`–\`max\` are clamped to the nearest bound.
- The input (\`class="qty"\`, \`v-model.number\`) must **show** the clamped value after every write — even when the clamped value equals the previous one.
- \`class="value"\` shows **Quantity: N**. The app uses min 1, max 10, starting at 1.
`,
      files: {
        'App.vue': clampedApp,
        'clamped.js': `import { ref, customRef } from 'vue'

// TODO: use customRef so writes are clamped to [min, max]
export function useClampedRef(initial, min, max) {
  return ref(initial)
}`,
      },
      hints: [
        'Keep `let value = initial` in the closure and return `customRef((track, trigger) => ({ get() {…}, set(next) {…} }))`.',
        'In `set`: `value = Math.min(max, Math.max(min, Number(next)))`.',
        'Call `trigger()` every time in `set` — not only when the value changed — so the input re-syncs.',
      ],
      solution: {
        explanation: 'The setter owns the rule, so no consumer can store an invalid quantity. Triggering unconditionally matters for the second out-of-range write: the stored value stays 10, but the re-render lets `v-model` replace the "99" in the input with "10".',
        files: {
          'App.vue': clampedApp,
          'clamped.js': `import { customRef } from 'vue'

export function useClampedRef(initial, min, max) {
  let value = initial
  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(next) {
      const n = Number(next)
      if (!Number.isNaN(n)) value = Math.min(max, Math.max(min, n))
      trigger() // always: lets v-model reset the input to the clamped value
    },
  }))
}`,
        },
      },
      tests: [
        { name: 'starts at 1', code: `expect(text('.value')).toBe('Quantity: 1')` },
        { name: 'in-range values are kept', code: `await type('.qty', '5'); expect(text('.value')).toBe('Quantity: 5')` },
        { name: 'too big is clamped to 10', code: `await type('.qty', '150'); expect(text('.value')).toBe('Quantity: 10'); expect(find('.qty').value).toBe('10')` },
        { name: 'too small is clamped to 1', code: `await type('.qty', '5'); await type('.qty', '-3'); expect(text('.value')).toBe('Quantity: 1')` },
        { name: 'the input snaps back even when the clamped value is unchanged', code: `await type('.qty', '150'); await type('.qty', '99'); expect(find('.qty').value).toBe('10')` },
      ],
    },
    {
      id: 'debounce-cleanup',
      title: 'A debounced ref that cleans up after itself',
      difficulty: 'advanced',
      prompt: `
\`useDebouncedRef\` in **useDebouncedRef.js** works, but a pending timer still fires after its owner is gone.

- If the **scope that created the ref is stopped** (a component unmounting, or \`scope.stop()\`), a pending value must **never** be committed.
- Using the ref **outside any scope** must still work and must **not** log a Vue warning.
- Debouncing must keep working (the last write wins after \`delay\` ms).
`,
      files: {
        'useDebouncedRef.js': `import { customRef, onScopeDispose } from 'vue'

export function useDebouncedRef(value, delay = 300) {
  let timer
  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        value = newValue
        trigger()
      }, delay)
    },
  }))
}`,
        'App.vue': `<script setup>
import { useDebouncedRef } from './useDebouncedRef.js'
const note = useDebouncedRef('', 200)
</script>

<template>
  <input class="note" v-model="note" placeholder="Type a note" />
  <p class="saved">Saved: {{ note }}</p>
</template>`,
      },
      hints: [
        'Register a cleanup on the active scope with `onScopeDispose(() => clearTimeout(timer))`.',
        'Outside any scope, `onScopeDispose` warns. Vue 3.5+ accepts a second argument `failSilently`.',
        'Write `onScopeDispose(() => clearTimeout(timer), true)` before returning the customRef.',
      ],
      solution: {
        explanation: '`onScopeDispose` attaches the cleanup to whatever scope is active when the composable is called — a component\'s setup or an `effectScope().run()` — so stopping that scope clears a pending timer. The `true` (failSilently, 3.5+) makes standalone use quiet; on older versions you would check `getCurrentScope()` first.',
        files: {
          'useDebouncedRef.js': `import { customRef, onScopeDispose } from 'vue'

export function useDebouncedRef(value, delay = 300) {
  let timer
  // cancel a pending commit when the owner goes away (no warning outside a scope, 3.5+)
  onScopeDispose(() => clearTimeout(timer), true)

  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(newValue) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        value = newValue
        trigger()
      }, delay)
    },
  }))
}`,
          'App.vue': `<script setup>
import { useDebouncedRef } from './useDebouncedRef.js'
const note = useDebouncedRef('', 200)
</script>

<template>
  <input class="note" v-model="note" placeholder="Type a note" />
  <p class="saved">Saved: {{ note }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'stopping the owning scope cancels a pending value',
          code: `const { effectScope } = requireModule('vue')
const { useDebouncedRef } = requireModule('useDebouncedRef.js')
const scope = effectScope()
const r = scope.run(() => useDebouncedRef('a', 100))
r.value = 'b'
scope.stop()
await wait(200)
expect(r.value).toBe('a')`,
        },
        {
          name: 'works outside any scope without a warning',
          code: `const { useDebouncedRef } = requireModule('useDebouncedRef.js')
const r = useDebouncedRef('a', 50)
r.value = 'b'
await wait(120)
expect(r.value).toBe('b')
expect(logs.some((line) => line.includes('onScopeDispose'))).toBe(false)`,
        },
        {
          name: 'still debounces in the app',
          code: `await type('.note', 'h')
await type('.note', 'hi')
expect(text('.saved')).toBe('Saved:')
await wait(300)
expect(text('.saved')).toBe('Saved: hi')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'custom-ref-what',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is `customRef()` and when would you reach for it?',
      answer: '`customRef(factory)` creates a ref where you control tracking and triggering. The factory receives `track` and `trigger` and returns `get`/`set`. Use it when behaviour belongs to the value itself — debouncing, throttling, clamping/validation, normalising, persisting — so consumers get one ordinary ref with that behaviour built in.',
      explanation: 'It exposes the two primitives of reactivity (subscribe on read, notify on write) in a public, safe way.',
      whyAsked: 'Shows depth beyond `ref`/`computed` and an understanding of how reactivity is built.',
      mistakes: ['Describing it as "a ref with a default value".', 'Using it for derived state that a computed would handle.', 'Not mentioning that `get` must call `track`.'],
      followUps: ['How does Vue decide when to re-render after `trigger()`?', 'What does customRef not do that ref does?'],
      modelAnswer: 'customRef lets me build a ref with custom timing or rules. Vue gives my factory two functions: track, which I call in get so the current effect subscribes, and trigger, which I call when I want dependents to update. The classic example is a debounced ref: set restarts a timer and only triggers after a pause. Other good uses are clamped or validated values and refs that persist to storage. Consumers just see a normal ref — it works in templates, v-model and watch.',
    },
    {
      id: 'custom-ref-vs-computed',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `customRef`, a writable `computed`, and a `ref` + `watch` pair. How do you choose?',
      answer: 'A writable computed derives its value from other reactive state (cached, stable since 3.4) and maps writes back to sources — use it for derived values. A customRef owns its own state and decides when to track/trigger — use it for value behaviour like debounce or clamping. A ref + watch is for side effects in response to changes (fetch, save); using it to sync state is a smell.',
      explanation: 'Derived → computed. Behaviour of a value → customRef. Side effects → watch.',
      whyAsked: 'Tests judgement about the right reactive primitive, a frequent source of over-engineering.',
      mistakes: ['Using watchers to keep two refs in sync.', 'Using customRef for purely derived values.', 'Not knowing computed caches but customRef does not.'],
      followUps: ['Which of them caches reads?', 'Which skips unchanged values automatically?'],
      modelAnswer: 'I ask where the value comes from. If it\'s derived from other state, I use computed — writable if assignments should map back — and I get caching and 3.4+ stability for free. If the value has its own state and I want special timing or rules, like debouncing or clamping, I use customRef, remembering that it doesn\'t cache and doesn\'t skip unchanged values unless I code it. Watch is for side effects such as fetching or saving; using it to copy state between refs usually means I should be deriving.',
    },
    {
      id: 'custom-ref-debounce-vmodel',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A search input uses `v-model="query"` where `query = useDebouncedRef(\'\', 400)`. The page also shows a live clock that updates every second. Users report letters vanishing as they type. Why?',
      answer: 'The clock re-renders the component every second. During the 400 ms debounce window the ref still holds the old value, and on re-render `v-model` syncs the input element to the ref\'s value — overwriting what the user just typed. Fix: bind the input to a plain ref and debounce a derived value (or a watcher/customRef reading from it), or move the clock into its own component so it doesn\'t re-render the input\'s parent.',
      explanation: '`v-model` keeps the element in sync with the model on every update. A delayed model is temporarily "wrong".',
      whyAsked: 'A subtle real-world bug that tests understanding of both v-model and re-render triggers.',
      mistakes: ['Blaming the browser or the debounce timing.', 'Increasing the delay.', 'Not connecting the clock to re-renders.'],
      followUps: ['Why would isolating the clock in a child component fix it?', 'How would you debounce a derived value?'],
      modelAnswer: 'v-model doesn\'t only listen to input events; on every component update it writes the model value back into the element if they differ. With a debounced ref, the model lags behind the input for 400 ms. The clock re-renders the component each second, so whenever a tick lands inside that window, the input is reset to the stale value and recent keystrokes vanish. I\'d bind the input to a plain ref and debounce a separate value derived from it, and I\'d move the clock into its own small component so its ticks don\'t re-render the form.',
    },
    {
      id: 'custom-ref-forgot-trigger',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'A customRef\'s setter stores the new value but never calls `trigger()`. A button writes to it. What does the template show after the click?',
      code: {
        lang: 'js',
        code: `const count = customRef((track) => {
  let v = 0
  return {
    get() { track(); return v },
    set(next) { v = next },
  }
})
// template: <button @click="count++">{{ count }}</button>`,
      },
      options: ['1', '0', 'NaN', 'It throws'],
      correctOption: 1,
      answer: 'Still 0. The value becomes 1 in memory, but without `trigger()` no dependent is told to re-run, so the button keeps showing 0 until something else re-renders it.',
      explanation: 'With customRef, notifying is explicit.',
      whyAsked: 'Quick check that the candidate understands track/trigger responsibilities.',
      mistakes: ['Answering 1 because "it is a ref".'],
      followUps: ['What would make it show 1 without fixing the setter?', 'Why is that a bad thing to rely on?'],
      modelAnswer: 'It still shows 0. The setter updates the closure variable, but nothing calls trigger, so the button\'s render effect is never notified. It would only show 1 if some other state re-rendered the component, which would be an accident. The fix is to call trigger in the setter.',
    },
    {
      id: 'custom-ref-leak',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 3,
      question: 'Your `useDebouncedRef` is used in a modal. Closing the modal right after typing logs errors from code that runs after unmount. What\'s happening and how do you harden the composable?',
      answer: 'The pending `setTimeout` still fires after the modal unmounts, committing the value and triggering dependents (and any side effects) for a component that\'s gone. Register cleanup on the owning scope: `onScopeDispose(() => clearTimeout(timer), true)` (failSilently is 3.5+; on older versions check `getCurrentScope()`), so unmounting or `scope.stop()` cancels the pending commit.',
      explanation: 'Timers are not reactive effects; stopping a scope only clears them if you register cleanup.',
      whyAsked: 'Probes resource-cleanup discipline in composables.',
      mistakes: ['Using `onUnmounted` (breaks outside components).', 'Assuming Vue cancels timers automatically.'],
      followUps: ['Why `onScopeDispose` rather than `onUnmounted`?', 'Should the pending value be flushed or dropped on dispose?'],
      modelAnswer: 'The setTimeout scheduled by the last keystroke isn\'t owned by Vue, so unmounting the modal doesn\'t cancel it; it fires later and runs dependents for a component that no longer exists. I\'d make the composable register `onScopeDispose(() => clearTimeout(timer), true)` when it\'s created. That ties the timer to whatever scope owns the ref — the modal\'s component or a standalone effect scope — and the failSilently flag keeps it quiet when used outside any scope. Whether to drop or flush the pending value on dispose is a product decision; dropping is the safe default.',
    },
    {
      id: 'custom-ref-coding-stored',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Implement `useStoredRef(key, initial)` in **stored.js** with `customRef`: read the initial value from `localStorage` (JSON) if present, otherwise use `initial`; every write saves JSON to `localStorage` and triggers. The app toggles a theme with `class="toggle"` and shows it in `class="theme"`.',
      starter: {
        files: {
          'stored.js': `import { ref, customRef } from 'vue'

// TODO: a ref that loads from and saves to localStorage
export function useStoredRef(key, initial) {
  return ref(initial)
}`,
          'App.vue': `<script setup>
import { useStoredRef } from './stored.js'
const theme = useStoredRef('vz-theme', 'light')
</script>

<template>
  <p class="theme">Theme: {{ theme }}</p>
  <button class="toggle" @click="theme = theme === 'light' ? 'dark' : 'light'">Toggle</button>
</template>`,
        },
      },
      tests: [
        { name: 'toggling updates the screen', code: `const before = text('.theme'); await click('.toggle'); expect(text('.theme')).not.toBe(before)` },
        {
          name: 'writes are saved as JSON',
          code: `const { useStoredRef } = requireModule('stored.js')
const r = useStoredRef('t-save', 'a')
r.value = 'b'
expect(localStorage.getItem('t-save')).toBe('"b"')`,
        },
        {
          name: 'an existing stored value is loaded',
          code: `localStorage.setItem('t-load', JSON.stringify({ size: 3 }))
const { useStoredRef } = requireModule('stored.js')
const r = useStoredRef('t-load', { size: 1 })
expect(r.value.size).toBe(3)`,
        },
        {
          name: 'effects re-run on write',
          code: `const { watchEffect } = requireModule('vue')
const { useStoredRef } = requireModule('stored.js')
const r = useStoredRef('t-effect', 1)
const seen = []
watchEffect(() => { seen.push(r.value) }, { flush: 'sync' })
r.value = 2
expect(seen).toEqual([1, 2])`,
        },
      ],
      hints: [
        'Read once at creation: `const saved = localStorage.getItem(key); let value = saved === null ? initial : JSON.parse(saved)`.',
        'Return `customRef((track, trigger) => ({ get() { track(); return value }, set(v) { … } }))`.',
        'In `set`: assign, `localStorage.setItem(key, JSON.stringify(v))`, then `trigger()`.',
      ],
      answer: 'Load once from localStorage into a closure variable; get tracks and returns it; set assigns, saves JSON and triggers.',
      solution: {
        files: {
          'stored.js': `import { customRef } from 'vue'

export function useStoredRef(key, initial) {
  const saved = localStorage.getItem(key)
  let value = saved === null ? initial : JSON.parse(saved)

  return customRef((track, trigger) => ({
    get() {
      track()
      return value
    },
    set(next) {
      value = next
      localStorage.setItem(key, JSON.stringify(next))
      trigger()
    },
  }))
}`,
          'App.vue': `<script setup>
import { useStoredRef } from './stored.js'
const theme = useStoredRef('vz-theme', 'light')
</script>

<template>
  <p class="theme">Theme: {{ theme }}</p>
  <button class="toggle" @click="theme = theme === 'light' ? 'dark' : 'light'">Toggle</button>
</template>`,
        },
      },
      explanation: 'The closure holds the current value, so reads never touch storage; writes persist and notify. Note the trade-off: objects stored this way are **not deeply reactive** — mutate `r.value.size` and nothing is saved or triggered; replace the whole value instead. Production versions also handle invalid JSON, quota errors, SSR (no `localStorage`) and the `storage` event for other tabs.',
      whyAsked: 'A practical composable that tests customRef mechanics plus real-world edge cases.',
      mistakes: ['Reading localStorage in `get()` on every read.', 'Forgetting `track()` or `trigger()`.', 'Not handling the missing key case.'],
      followUps: ['How would you sync changes from other tabs?', 'How would you make nested object changes persist?', 'What breaks during SSR?'],
      modelAnswer: 'I read the key once when the ref is created, parsing JSON or falling back to the initial value, and keep it in a closure variable. get calls track and returns that variable, so reads are cheap. set assigns, writes JSON to localStorage and calls trigger. For production I\'d wrap parse and setItem in try/catch, skip storage when it doesn\'t exist (SSR), and listen to the window storage event to trigger when another tab changes the key — cleaning that listener up with onScopeDispose. I\'d also document that nested mutations aren\'t persisted; callers replace the value.',
    },
  ],

  takeaways: [
    '`customRef((track, trigger) => ({ get, set }))` gives you control of both reactive moments.',
    'Call `track()` in `get()` or nothing will ever react; call `trigger()` when the change should become visible.',
    'customRef doesn\'t cache reads or skip unchanged values — keep `get()` cheap and compare yourself.',
    'Great for value behaviour: debounce, throttle, clamp/validate, normalise, persist.',
    'Clean up timers with `onScopeDispose` (3.5+ `failSilently`).',
    'Delayed refs and `v-model` clash when the component re-renders mid-delay — debounce a derived value instead.',
    'Use `computed` for derived values and `watch` for side effects.',
  ],
}
