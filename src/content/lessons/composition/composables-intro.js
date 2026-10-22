// Lesson: Composables — reusable stateful logic.

const useCounterFile = `import { ref, computed } from 'vue'

export function useCounter(initial = 0, options = {}) {
  const { min = 0, max = Infinity } = options

  const count = ref(initial)
  const atMin = computed(() => count.value <= min)
  const atMax = computed(() => count.value >= max)

  function increment() {
    if (count.value < max) count.value++
  }

  function decrement() {
    if (count.value > min) count.value--
  }

  function reset() {
    count.value = initial
  }

  return { count, atMin, atMax, increment, decrement, reset }
}`

const habitCardFile = `<script setup>
import { useCounter } from './useCounter.js'

const props = defineProps({
  label: { type: String, required: true },
  goal: { type: Number, default: 8 },
})

// Each card calls the composable → each card gets its OWN count
const { count, atMin, atMax, increment, decrement } = useCounter(0, { max: props.goal })
</script>

<template>
  <article class="habit">
    <h3>{{ label }}</h3>
    <p class="count">{{ count }} / {{ goal }}</p>
    <button class="dec" :disabled="atMin" @click="decrement">−</button>
    <button class="inc" :disabled="atMax" @click="increment">+</button>
  </article>
</template>

<style scoped>
.habit { border: 2px solid #222; border-radius: 10px; padding: 8px 14px; margin: 8px 0; }
h3 { margin: 0 0 4px; font-size: 16px; }
.count { font-size: 22px; margin: 4px 0 8px; }
button { width: 36px; font-size: 18px; margin-right: 6px; }
</style>`

const appFile = `<script setup>
import HabitCard from './HabitCard.vue'
</script>

<template>
  <h2>Daily habits</h2>
  <HabitCard label="Glasses of water" :goal="8" />
  <HabitCard label="Pages read" :goal="20" />
</template>`

const inlineHabitCard = `<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  goal: { type: Number, default: 8 },
})

// The same logic, written directly inside the component.
// Works fine — until a second component needs a counter too.
const count = ref(0)
const atMin = computed(() => count.value <= 0)
const atMax = computed(() => count.value >= props.goal)

function increment() {
  if (count.value < props.goal) count.value++
}
function decrement() {
  if (count.value > 0) count.value--
}
</script>

<template>
  <article class="habit">
    <h3>{{ label }}</h3>
    <p class="count">{{ count }} / {{ goal }}</p>
    <button class="dec" :disabled="atMin" @click="decrement">−</button>
    <button class="inc" :disabled="atMax" @click="increment">+</button>
  </article>
</template>`

export default {
  id: 'composables-intro',
  title: 'Composables: reusable stateful logic',
  summary: 'Pull reactive state, logic and side effects out of components into plain `use…` functions that any component can call.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['setup-and-script-setup', 'ref', 'computed', 'lifecycle-hooks'],
  related: ['composable-recipes', 'composable-design', 'composition-vs-options', 'provide-inject', 'why-state-management', 'effect-scope'],
  tags: ['composables', 'composition api', 'reusable logic', 'use functions', 'shared state', 'cleanup', 'onUnmounted', 'onScopeDispose'],
  apis: [
    { name: 'composable (use…)', summary: 'A function that uses Vue\'s Composition API to create and return reactive state and logic.' },
    { name: 'onUnmounted()', summary: 'Registers a callback that runs when the calling component is removed — the usual place to clean up timers and listeners.' },
    { name: 'onScopeDispose()', summary: 'Registers cleanup on the current effect scope. Works inside components (runs on unmount) and inside a manual effectScope().' },
  ],
  docs: [
    { label: 'Vue Guide — Composables', url: 'https://vuejs.org/guide/reusability/composables.html' },
    { label: 'API — Composition API: Lifecycle Hooks', url: 'https://vuejs.org/api/composition-api-lifecycle.html' },
    { label: 'API — onScopeDispose()', url: 'https://vuejs.org/api/reactivity-advanced.html#onscopedispose' },
  ],

  intro: `
A **composable** is a function that uses Vue's Composition API — \`ref\`, \`computed\`, \`watch\`, lifecycle hooks — to package a piece of *stateful logic* so many components can reuse it.

By convention its name starts with \`use\`: \`useCounter()\`, \`useMouse()\`, \`useCart()\`. A component calls it inside \`<script setup>\`, gets back reactive state and functions, and uses them as if it had written that logic itself.

That's it. There is no special API to register, no base class, no magic. A composable is **just a function** — which is exactly why it is so useful.
`,

  why: `
Components are great at reusing *UI*. But a lot of what makes an app work is not UI — it is **logic with state**: "count up but never past the goal", "track the window width", "load this user and remember whether it failed".

Without composables, that logic ends up copy-pasted into every component that needs it. Two copies drift apart. A bug fixed in one stays alive in the other.

\`\`\`js
// HabitCard.vue, ReadingTracker.vue, WaterTracker.vue…
const count = ref(0)
function increment() { if (count.value < goal) count.value++ }
function decrement() { if (count.value > 0) count.value-- }
// …the same 10 lines, three times
\`\`\`

Vue 2 tried to solve this with *mixins*, which caused name clashes and "where did this property come from?" confusion (see [the Options API lesson](lesson:options-api)). Composables solve the same problem with ordinary JavaScript: **put the logic in a function, call the function, and see exactly what you get back**.
`,

  eli15: `
Think of a recipe card for pancakes. The card itself is not a pancake — it's instructions. Every time someone *follows* the card, they get their **own** pancakes.

A composable is a recipe card for a piece of app logic. \`useCounter()\` says: "make a number box starting at 0, plus buttons to go up and down, but never below 0."

When the *Water* card calls \`useCounter()\`, it gets its own counter. When the *Reading* card calls it, it gets a different counter. Same recipe, separate pancakes.

And if you ever want everyone to share **one** plate of pancakes? You make the plate once, outside the recipe, and the recipe hands out that same plate every time. That's "shared state" — we'll see exactly how in a minute.
`,

  analogy: {
    title: 'The recipe card',
    body: `
A good recipe card lists ingredients, steps and what you end up with. Anyone in any kitchen can follow it, and the card never changes when you cook — the food is new each time.

A composable works the same way. The function body is the recipe; calling it is cooking; the object it \`return\`s is the finished dish handed to the component. If something must be shared by every kitchen — say, one shared pantry — it lives *outside* the recipe, so every cook reaches the same shelf.
`,
    mapping: [
      ['the recipe card', 'the composable function, e.g. `useCounter()`'],
      ['following the recipe', 'calling `useCounter()` in a component\'s setup'],
      ['the finished dish', 'the returned object of refs and functions'],
      ['each cook\'s own pancakes', 'state created *inside* the function — one copy per component'],
      ['the shared pantry', 'state created *outside* the function at module level — shared by all'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'Same logic, two homes',
    props: {
      left: {
        label: 'Logic inside the component',
        lang: 'vue',
        code: `<script setup>
import { ref, computed } from 'vue'
const props = defineProps(['goal'])

const count = ref(0)
const atMax = computed(() => count.value >= props.goal)
function increment() {
  if (count.value < props.goal) count.value++
}
</script>`,
      },
      right: {
        label: 'Logic in a composable',
        lang: 'vue',
        code: `<script setup>
import { useCounter } from './useCounter.js'
const props = defineProps(['goal'])

const { count, atMax, increment } =
  useCounter(0, { max: props.goal })
</script>`,
      },
      points: [
        'Both versions behave identically — the composable is the same code moved into a function.',
        'The composable version can be reused by any component and tested on its own.',
        'Destructuring the result shows exactly which state and functions the component uses — nothing is hidden.',
        'The component shrinks to "what this card shows", while the rules live in one place.',
      ],
    },
    caption: 'Extracting a composable is a refactor, not a rewrite: the code moves into a function and the component calls it.',
    alt: 'Side-by-side code. Left: a component defines count, atMax and increment directly in script setup. Right: the same component imports useCounter and destructures count, atMax and increment from its return value. Notes below list the differences.',
  },

  syntax: [
    `
**Anatomy of a composable.** It lives in its own file (often \`src/composables/useSomething.js\`), is a named export, and returns the things callers need:
`,
    {
      code: `// useCounter.js
import { ref, computed, onUnmounted } from 'vue'

export function useCounter(initial = 0) {   // 1. a function named use…
  const count = ref(initial)                  // 2. its own reactive state
  const isZero = computed(() => count.value === 0)

  function increment() { count.value++ }     // 3. functions that change it

  onUnmounted(() => { /* clean up side effects here */ })  // 4. optional lifecycle

  return { count, isZero, increment }        // 5. a plain object of refs + functions
}`,
      lang: 'js',
      title: 'the shape of every composable',
    },
    {
      code: `<script setup>
import { useCounter } from './useCounter.js'

const { count, isZero, increment } = useCounter(10)
</script>

<template>
  <button @click="increment">{{ count }}</button>
  <p v-if="isZero">Nothing yet</p>
</template>`,
      lang: 'vue',
      title: 'using it in a component',
    },
    `
**The rules — and why each one exists:**

1. **Name it \`useSomething\`.** Purely a convention, but a strong one: readers (and linters) instantly know "this function creates reactive state and may register lifecycle hooks".
2. **Call it synchronously at the top of \`<script setup>\` or \`setup()\`** — not inside a click handler, a \`setTimeout\`, or after an \`await\` in your own async function. Lifecycle hooks and watchers attach themselves to "the component currently being set up". Outside setup there is no such component, so they silently attach to nothing (Vue prints a warning).
3. **Return a plain object of refs**, not a \`reactive()\` object. Callers love destructuring (\`const { count } = useCounter()\`), and destructuring a \`reactive\` object copies plain values that no longer update. Refs survive destructuring.
4. **Clean up what you start.** Watchers and computeds created during setup stop automatically when the component unmounts. Things Vue doesn't own — \`setInterval\`, \`addEventListener\`, WebSockets — must be undone in \`onUnmounted()\` (or \`onScopeDispose()\`).
5. **Where you create state decides who shares it.** State created *inside* the function is new for every call (local). State created *outside*, at module level, is created once and shared by every caller.
`,
    {
      code: `import { ref } from 'vue'

const sharedTotal = ref(0)        // module level: ONE ref for the whole app

export function useHabit() {
  const count = ref(0)            // inside: a NEW ref for every caller
  function increment() {
    count.value++
    sharedTotal.value++
  }
  return { count, sharedTotal, increment }
}`,
      lang: 'js',
      title: 'local vs shared state',
    },
    {
      callout: 'version',
      text: 'Composables rely on the Composition API, which is built into Vue 3 (and was backported to Vue 2.7). `onScopeDispose()` exists since Vue 3.2.',
    },
  ],

  walkthrough: {
    title: 'useCounter.js',
    lang: 'js',
    code: useCounterFile,
    intro: 'The composable used by the playground. Notice that nothing in it knows about templates, cards or habits — it is pure, reusable counting logic.',
    steps: [
      { lines: [1], text: 'A composable imports Composition API functions straight from `\'vue\'`, exactly like a component would.' },
      { lines: [3], text: 'A **named export** of a function starting with `use`. Parameters make it configurable: a starting value and an options object with sensible defaults.' },
      { lines: [4], text: 'Destructuring `options` with defaults (`min = 0`, `max = Infinity`) means callers can pass only what they care about: `useCounter(0, { max: 8 })`.' },
      { lines: [6, 8], text: 'The state is created **inside** the function. Every call runs these lines again, so every caller gets a brand-new `count` and its own computed flags.' },
      { lines: [10, 20], text: 'The rules about the data (never past `max`, never below `min`) live next to the data. Components can\'t forget them because they never reimplement them.' },
      { lines: [22], text: 'Return a **plain object** of refs and functions. Callers destructure what they need, and every destructured ref stays reactive.' },
    ],
  },

  playground: {
    title: 'Habit tracker',
    objective: 'See that each component calling a composable gets its own state — then deliberately add a piece of shared state.',
    files: { 'App.vue': appFile, 'HabitCard.vue': habitCardFile, 'useCounter.js': useCounterFile },
    expected: 'Two cards, **Glasses of water 0 / 8** and **Pages read 0 / 20**. Clicking **+** on one card never changes the other — each card called `useCounter()` and got its own `count`. The − button is disabled at 0 and + is disabled at the goal.',
    experiments: [
      {
        id: 'third-card',
        task: 'Add a third `<HabitCard>` labelled **Push-ups** with a goal of **30**. Click its **+** and check the other cards.',
        hint: 'Copy one of the `<HabitCard … />` lines in `App.vue` and change `label` and `:goal`.',
        tests: [
          {
            name: 'there are three cards and the third has its own count',
            code: `const cards = findAll('.habit')
expect(cards).toHaveLength(3)
await click(cards[2].querySelector('.inc'))
expect(cards[2].querySelector('.count').textContent).toContain('1 / 30')
expect(cards[0].querySelector('.count').textContent).toContain('0 / 8')`,
          },
        ],
        explain: 'You reused all the counting logic without writing a single new line of JavaScript. Each `<HabitCard>` instance ran its own `setup`, called `useCounter()` once, and received a fresh `ref(0)`.',
      },
      {
        id: 'reset-button',
        task: 'The composable already returns a `reset()` function that nobody uses. Add a **Reset** button with `class="reset"` to each card that calls it.',
        hint: 'Add `reset` to the destructuring in `HabitCard.vue`, then `<button class="reset" @click="reset">Reset</button>` in the template.',
        tests: [
          {
            name: 'Reset puts that card back to 0',
            code: `const card = findAll('.habit')[0]
await click(card.querySelector('.inc'))
await click(card.querySelector('.inc'))
expect(card.querySelector('.count').textContent).toContain('2 /')
const btn = card.querySelector('.reset')
expect(btn).toBeTruthy()
await click(btn)
expect(card.querySelector('.count').textContent).toContain('0 /')`,
          },
        ],
        explain: 'A composable is an API. Callers pick the pieces they need from the returned object — unused pieces cost nothing and are there when someone needs them.',
      },
      {
        id: 'shared-total',
        task: 'Show a running **total of all habits** in `App.vue` inside `<p class="total">`. Create a `total` ref at the **top of `useCounter.js`, outside the function**, keep it updated in `increment()` / `decrement()`, and export it so `App.vue` can import and display it.',
        hint: 'In `useCounter.js`: `export const total = ref(0)` above `export function useCounter`. Add `total.value++` / `total.value--` next to the existing changes. In `App.vue`: `import { total } from \'./useCounter.js\'` and `<p class="total">Total: {{ total }}</p>`.',
        tests: [
          {
            name: 'the total adds up every card',
            code: `const cards = findAll('.habit')
await click(cards[0].querySelector('.inc'))
await click(cards[0].querySelector('.inc'))
await click(cards[1].querySelector('.inc'))
expect(exists('.total')).toBe(true)
expect(text('.total')).toMatch(/\\b3\\b/)
await click(cards[0].querySelector('.dec'))
expect(text('.total')).toMatch(/\\b2\\b/)`,
          },
        ],
        explain: 'A module is evaluated **once**, so a ref declared at module level exists once for the whole app. Every card\'s `increment()` changes the *same* `total`, while `count` (created inside the function) stays per-card. This is the simplest form of shared state — powerful, but global: on a server that renders many users\' pages it would be shared between users too.',
      },
      {
        id: 'lifecycle-inside',
        task: 'Composables can use lifecycle hooks. Import `onMounted` in `useCounter.js` and add `onMounted(() => console.log(\'counter ready\', initial))` inside the function. Run it and open the console.',
        hint: 'Put the `onMounted(...)` call anywhere inside `useCounter`, before the `return`.',
        tests: [
          {
            name: 'every card logs "counter ready" when it mounts',
            code: `const ready = logs.filter((l) => /counter ready/.test(l))
expect(ready.length).toBeGreaterThanOrEqual(findAll('.habit').length)
expect(findAll('.habit').length).toBeGreaterThan(0)`,
          },
        ],
        explain: 'The log appears once **per card**. `onMounted` registers on whichever component is running `setup` when the composable is called — so each card gets its own hook. That is why composables must be called synchronously during setup.',
      },
    ],
    variants: [
      {
        id: 'inline',
        label: 'Before: logic inside the component',
        files: { 'App.vue': appFile, 'HabitCard.vue': inlineHabitCard },
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'One function, many copies — or one shared copy',
    props: {
      nodes: [
        { id: 'fn', label: 'useCounter()', note: 'useCounter.js', tone: 'acid', x: 380, y: 50 },
        { id: 'cardA', label: 'Water card', note: 'calls useCounter()', tone: 'paper', x: 130, y: 150 },
        { id: 'cardB', label: 'Pages card', note: 'calls useCounter()', tone: 'paper', x: 630, y: 150 },
        { id: 'stateA', label: 'count = 2', note: 'water\'s own ref', tone: 'cobalt', x: 130, y: 270 },
        { id: 'stateB', label: 'count = 5', note: 'pages\' own ref', tone: 'cobalt', x: 630, y: 270 },
        { id: 'total', label: 'total = 7', note: 'module level, shared', tone: 'red', x: 380, y: 270 },
      ],
      edges: [
        { from: 'cardA', to: 'fn', label: 'call' },
        { from: 'cardB', to: 'fn', label: 'call' },
        { from: 'cardA', to: 'stateA', label: 'new ref' },
        { from: 'cardB', to: 'stateB', label: 'new ref' },
        { from: 'cardA', to: 'total', label: 'same ref', dashed: true },
        { from: 'cardB', to: 'total', label: 'same ref', dashed: true },
      ],
      steps: [
        { focus: ['fn'], text: '`useCounter` is just a function sitting in a file. Defining it creates nothing — no state exists until somebody **calls** it.' },
        { focus: ['cardA', 'stateA'], edges: ['cardA->fn', 'cardA->stateA'], text: 'The Water card calls `useCounter()` during setup. The line `const count = ref(0)` runs, creating a ref that belongs only to this card.' },
        { focus: ['cardB', 'stateB'], edges: ['cardB->fn', 'cardB->stateB'], text: 'The Pages card calls the same function. The body runs again → a **second, independent** ref. Clicking + on one card cannot touch the other.' },
        { focus: ['total'], edges: ['cardA->total', 'cardB->total'], text: 'A ref declared **outside** the function, at module level, was created once when the file first loaded. Every caller reaches the same object — that is shared state.' },
        { focus: ['fn', 'stateA', 'stateB', 'total'], text: 'The rule to remember: **inside the function = one per component; outside = one for everybody.** Choose on purpose; accidental sharing is a classic bug.' },
      ],
    },
    caption: 'Where you write `ref()` decides who owns the state.',
    alt: 'A diagram with useCounter at the top. Two cards, Water and Pages, both call it. Each card gets its own count ref below it (count 2 and count 5). In the middle, a red total ref at module level is connected to both cards with dashed lines labelled same ref.',
  },

  internals: {
    beginner: `
A composable has no superpowers of its own. When \`<script setup>\` runs, Vue remembers "I am currently setting up the Water card". Any \`ref\`, \`computed\`, \`watch\` or \`onMounted\` you call — directly or from inside a function you call — happens *during* that setup, so Vue can connect it to the Water card. A composable is simply a way to run those same lines from a different file.
`,
    technical: [
      `
While a component's \`setup\` runs, Vue sets an internal **current instance** (and an active **effect scope** that belongs to that instance). Two things depend on it:

- **Lifecycle hooks** — \`onMounted(fn)\` looks up the current instance and pushes \`fn\` into its list of mounted hooks. With no current instance it can't register anything, so Vue warns that it was "called when there is no active component instance".
- **Effects** — every \`computed\`, \`watch\` and \`watchEffect\` created while the scope is active is collected by that scope. When the component unmounts, the scope is stopped and all those effects are stopped with it. That's why you never manually stop watchers created inside a composable called from setup.
`,
      {
        code: `// A simplified model — not Vue's real source
let currentInstance = null

function setupComponent(instance) {
  currentInstance = instance          // "I am setting up this component"
  instance.setupState = instance.type.setup(instance.props)
  currentInstance = null              // setup is over
}

function onMounted(fn) {
  if (!currentInstance) return warn('no active component instance')
  currentInstance.mountedHooks.push(fn)
}`,
        lang: 'js',
        title: 'why composables must be called during setup',
      },
      `
**Why "synchronously"?** After an \`await\` inside your own async function, setup has already finished and \`currentInstance\` is back to \`null\`. One exception: in \`<script setup>\`, the compiler wraps top-level \`await\` so the instance is restored afterwards — which is why calling a composable after a top-level \`await\` in \`<script setup>\` works. It does *not* happen inside your own \`async function\`.

**Cleanup that Vue can't see.** \`setInterval\`, \`addEventListener\` and sockets live outside Vue's reactivity, so stopping the effect scope doesn't touch them. You register the undo step yourself with \`onUnmounted()\` (component-only) or \`onScopeDispose()\` (works for any effect scope, including a component's — handy for composables that might also run inside a manual [\`effectScope()\`](lesson:effect-scope)).
`,
    ],
    production: `
- **Module-level state is a singleton per JavaScript runtime.** In a browser that means "per tab", which is often fine. With server-side rendering, one Node process renders many users' requests, so module-level refs leak data between users. Use [Pinia](lesson:why-state-management) or [provide/inject](lesson:provide-inject) per app instance for shared state in SSR apps (see [rendering strategies](lesson:rendering-strategies)).
- **Keep composables focused.** \`useCart\`, \`usePagination\`, \`useEventListener\` — one job each. Compose small ones rather than writing one \`useEverything\` (more in [Designing & testing composables](lesson:composable-design)).
- **Always pair "start" with "stop"** for timers, listeners and subscriptions. Leaks show up as handlers firing several times after navigating back and forth.
- **Prefer an established, well-tested library for common recipes** (the third-party VueUse collection, for example) once you understand how they work. The next lesson builds several of them by hand: [Composable recipes](lesson:composable-recipes).
`,
  },

  mistakes: [
    {
      title: 'Returning a reactive object, then destructuring it',
      wrong: { code: `// usePointer.js
export function usePointer() {
  const state = reactive({ x: 0, y: 0 })
  // …listeners update state.x / state.y
  return state
}

// Component
const { x, y } = usePointer()   // x and y are frozen numbers`, lang: 'js' },
      right: { code: `export function usePointer() {
  const x = ref(0)
  const y = ref(0)
  // …listeners update x.value / y.value
  return { x, y }               // plain object of refs
}

const { x, y } = usePointer()   // still reactive`, lang: 'js' },
      explanation: 'Destructuring a `reactive()` object reads each property once and copies the plain value. Refs are objects, so destructuring copies the *ref* — which stays connected. If a caller prefers object syntax they can wrap the result: `const pointer = reactive(usePointer())`.',
    },
    {
      title: 'Starting a timer or listener without stopping it',
      wrong: { code: `export function useClock() {
  const now = ref(new Date())
  setInterval(() => (now.value = new Date()), 1000)
  return { now }
}`, lang: 'js' },
      right: { code: `export function useClock() {
  const now = ref(new Date())
  const id = setInterval(() => (now.value = new Date()), 1000)
  onUnmounted(() => clearInterval(id))
  return { now }
}`, lang: 'js' },
      explanation: 'The interval belongs to the browser, not to Vue. Open and close a component using the wrong version ten times and ten intervals keep running forever. Whatever a composable starts, it must stop.',
    },
    {
      title: 'Calling a composable inside an event handler',
      wrong: { code: `<script setup>
function openChart() {
  const { width } = useWindowSize()   // too late: setup is over
}
</script>`, lang: 'vue' },
      right: { code: `<script setup>
const { width } = useWindowSize()     // during setup
function openChart() {
  console.log(width.value)
}
</script>`, lang: 'vue' },
      explanation: 'Event handlers run long after setup. Lifecycle hooks inside the composable have no component to attach to (Vue warns), so `onMounted`/`onUnmounted` never run — and listeners are never removed. Call composables at the top level of setup and *use* their results later.',
    },
    {
      title: 'Sharing state by accident',
      wrong: { code: `import { ref } from 'vue'

const isOpen = ref(false)      // module level!

export function useDropdown() {
  return { isOpen, toggle: () => (isOpen.value = !isOpen.value) }
}`, lang: 'js' },
      right: { code: `import { ref } from 'vue'

export function useDropdown() {
  const isOpen = ref(false)    // one per dropdown
  return { isOpen, toggle: () => (isOpen.value = !isOpen.value) }
}`, lang: 'js' },
      explanation: 'With the ref outside the function, opening one dropdown opens every dropdown on the page. Module-level state is a deliberate design decision for things that really are global (the logged-in user, a toast queue) — never a default.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: onMounted is called when there is no active component instance…`',
      cause: 'The composable (or the hook) was called outside synchronous setup — in an event handler, a timer, or after an `await` in a regular async function.',
      fix: 'Move the call to the top level of `<script setup>` / `setup()`. Use the returned refs and functions later from handlers.',
    },
    {
      symptom: 'Two components unexpectedly show the same data, or changing one changes the other.',
      cause: 'The ref is declared at module level, outside the composable function, so every caller shares it.',
      fix: 'Move the `ref()` call inside the function. Keep it outside only when sharing is intended — and then name it so (`sharedTotal`) or use a store.',
    },
    {
      symptom: 'A destructured value from a composable never updates.',
      cause: 'The composable returns a `reactive()` object (or plain values), and destructuring copied the current values.',
      fix: 'Return a plain object of refs. If you can\'t change the composable, use `toRefs(result)` before destructuring.',
    },
    {
      symptom: 'A handler fires two, three, four times after navigating back and forth.',
      cause: 'A listener or interval added in a composable is never removed, so each mount adds another one.',
      fix: 'Remove it in `onUnmounted()` / `onScopeDispose()`. For listeners, pass the *same function reference* to `addEventListener` and `removeEventListener`.',
    },
  ],

  bestPractices: [
    'Name composables `useThing` and keep one per file in a `composables/` folder (or next to the feature that owns it).',
    'Call composables synchronously at the top of `<script setup>` — never conditionally, in handlers, or after `await` in your own async functions.',
    'Return a plain object of refs and functions so callers can destructure safely.',
    'Create state inside the function by default; move it to module level only when the whole app must share it — and remember SSR.',
    'Clean up every timer, listener and subscription you start, with `onUnmounted()` or `onScopeDispose()`.',
    'Accept options with defaults (`useCounter(0, { max: 8 })`) instead of long positional parameter lists.',
    'Extract a composable when logic is reused *or* when it makes a big component easier to read — not just because you can.',
  ],

  useCases: [
    'Form logic: a field value, its validation error and a "touched" flag — reused by every input in a form.',
    'Fetching data: `data`, `error` and `loading` refs plus a `reload()` function.',
    'Browser events: the mouse position, the scroll position, the online/offline status, keyboard shortcuts.',
    'Timers: a countdown, a stopwatch, a clock, polling an API every few seconds.',
    'Small shared state: a toast/notification queue or the current theme, using module-level refs in a client-only app.',
  ],

  whenToUse: {
    use: [
      'Two or more components need the same stateful logic.',
      'A component\'s `<script setup>` has grown long and mixes several unrelated concerns — extract each concern into a composable.',
      'Logic needs lifecycle hooks or cleanup (listeners, timers) and you want that pairing written once, correctly.',
    ],
    avoid: [
      'The function holds no reactive state and uses no Vue API — that is a plain utility (`formatPrice()`), not a composable.',
      'The thing you\'re reusing is mostly *markup* — that is a component (or a slot).',
      'Many distant components share complex state with actions and devtools needs — reach for a Pinia store.',
    ],
  },

  comparison: {
    title: 'Composable vs its neighbours',
    headers: ['', 'Composable', 'Utility function', 'Component', 'Pinia store'],
    rows: [
      ['Reuses', 'stateful logic', 'stateless logic', 'UI + logic', 'shared app state'],
      ['Uses Vue APIs?', 'yes — ref, computed, watch, hooks', 'no', 'yes', 'yes'],
      ['State per caller?', 'yes by default (module level = shared)', 'no state', 'yes, per instance', 'no — one per app'],
      ['Renders anything?', 'no', 'no', 'yes', 'no'],
      ['Example', '`useCounter()`', '`formatPrice(9.5)`', '`<HabitCard>`', '`useCartStore()`'],
    ],
    note: 'A Pinia store is, under the hood, a carefully managed shared composable with devtools and SSR support. See [Why shared state?](lesson:why-state-management).',
  },

  quiz: [
    {
      id: 'composables-intro-q1',
      type: 'mcq',
      prompt: 'Which of these is a **composable**?',
      options: [
        { text: '`function formatPrice(n) { return \'$\' + n.toFixed(2) }`', why: 'It holds no reactive state and uses no Vue API — it\'s a plain utility function.' },
        { text: '`function useCart() { const items = ref([]); const add = (p) => items.value.push(p); return { items, add } }`' },
        { text: 'A `CartList.vue` component that shows cart items', why: 'Components reuse UI. A composable reuses logic and renders nothing.' },
        { text: '`export const cart = reactive({ items: [] })`', why: 'That is a shared reactive object, not a function callers can invoke — no `use…` function wraps it.' },
      ],
      answer: 1,
      explanation: 'A composable is a function that uses the Composition API (here `ref`) to create and return reactive state and logic. `useCart` fits exactly.',
    },
    {
      id: 'composables-intro-q2',
      type: 'output',
      prompt: '`useCounter` creates `const count = ref(0)` **inside** the function. Components A and B each call it. A\'s button is clicked three times. What does **B** show?',
      code: {
        lang: 'js',
        code: `export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}`,
      },
      options: ['0', '3', '6', 'It throws because two components share one ref'],
      answer: 0,
      explanation: 'Each call runs `ref(0)` again, so A and B have separate refs. A shows 3; B still shows 0.',
    },
    {
      id: 'composables-intro-q3',
      type: 'output',
      prompt: 'Now the ref is declared **outside** the function. A\'s button is clicked three times. What does **B** show?',
      code: {
        lang: 'js',
        code: `const count = ref(0)

export function useCounter() {
  const increment = () => count.value++
  return { count, increment }
}`,
      },
      options: [
        { text: '0', why: 'The ref is no longer created per call — it was created once when the module loaded.' },
        { text: '3' },
        { text: 'B shows 3 only after B re-mounts', why: 'B reads the same ref, so it updates immediately like any other reactive dependency.' },
      ],
      answer: 1,
      explanation: 'Module code runs once. Both components receive the same `count` ref, so B shows 3 right away — shared state.',
    },
    {
      id: 'composables-intro-q4',
      type: 'bug',
      prompt: 'A modal uses this clock. After opening and closing the modal ten times the page gets sluggish. Click the line that causes the leak.',
      code: {
        lang: 'js',
        code: `import { ref } from 'vue'

export function useClock() {
  const now = ref(new Date())

  setInterval(() => {
    now.value = new Date()
  }, 1000)

  return { now }
}`,
      },
      answerLine: 6,
      explanation: 'The interval is never cleared. Store its id (`const id = setInterval(…)`) and call `clearInterval(id)` in `onUnmounted()` or `onScopeDispose()`.',
    },
    {
      id: 'composables-intro-q5',
      type: 'fill',
      prompt: 'Complete the composable: follow the naming convention and stop the timer when the component goes away.',
      code: {
        lang: 'js',
        code: `import { ref, onUnmounted } from 'vue'

export function ___Stopwatch() {
  const seconds = ref(0)
  const id = setInterval(() => seconds.value++, 1000)
  ___(() => clearInterval(id))
  return { seconds }
}`,
      },
      answer: [['use'], ['onUnmounted', 'onBeforeUnmount', 'onScopeDispose']],
      explanation: 'Composables are named `use…`. `onUnmounted` registers cleanup on the calling component (`onBeforeUnmount` or `onScopeDispose` would also work).',
    },
    {
      id: 'composables-intro-q6',
      type: 'mcq',
      prompt: 'Why must composables be called **synchronously during setup**?',
      options: [
        { text: 'Because lifecycle hooks and watchers inside them attach to the component that is currently being set up.' },
        { text: 'Because composables are slow and must finish before the first render.', why: 'Speed has nothing to do with it; the issue is which component the hooks register on.' },
        { text: 'Because JavaScript does not allow calling functions inside event handlers.', why: 'You can call any function in a handler — but setup is over by then, so hooks have no component to attach to.' },
        { text: 'Because the template compiler inlines composables.', why: 'Composables are ordinary runtime functions; the compiler does not inline them.' },
      ],
      answer: 0,
      explanation: 'Vue tracks a "current instance" only while setup runs. Hooks and effects created then are bound to that component and cleaned up with it.',
    },
    {
      id: 'composables-intro-q7',
      type: 'short',
      prompt: 'In two or three sentences: how do you decide whether state in a composable should be local or shared?',
      answer: 'Ask whether every caller should have its own copy (a dropdown\'s open flag, a form field) or whether everyone must see the same value (the logged-in user, a toast queue). Local state is created inside the function, shared state outside at module level. Shared module state is global — risky with SSR — so for serious app-wide state a store such as Pinia is usually the better home.',
    },
  ],

  exercises: [
    {
      id: 'use-field',
      title: 'Form logic: a reusable useField()',
      difficulty: 'intermediate',
      prompt: `
The sign-up form needs the same logic for every input: a value, a "touched" flag (has the user left the field yet?) and an error message. Write it **once** as a composable.

In \`useField.js\`, implement \`useField(initialValue, validate)\`:

- \`validate\` is a function that receives the current value and returns an **error message string**, or \`''\` when the value is valid.
- Return a plain object with:
  - \`value\` — a ref holding the field value (starts at \`initialValue\`),
  - \`touched\` — a ref, \`false\` until \`blur()\` is called,
  - \`error\` — a computed: the validation message **only once touched**, otherwise \`''\`,
  - \`isValid\` — a computed: \`true\` when \`validate(value)\` returns \`''\` (whether touched or not),
  - \`blur()\` — sets \`touched\` to \`true\`.

Then use it in \`App.vue\` for **both** fields:

- Email input \`class="email"\`, its error in \`<p class="email-error">\` — rule: must contain \`@\` → message \`Enter a valid email\`.
- Password input \`class="password"\`, its error in \`<p class="password-error">\` — rule: at least 8 characters → message \`Use at least 8 characters\`.
- Each input calls its field's \`blur()\` on \`@blur\`.
- The submit button \`class="submit"\` is disabled until both fields are valid.
`,
      files: {
        'useField.js': `import { ref, computed } from 'vue'

// TODO: implement useField(initialValue, validate)
export function useField(initialValue, validate) {
  return {}
}`,
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

// Logic for ONE field, written inline. Move it into useField()
// and use the composable for both email and password.
const email = ref('')
const emailTouched = ref(false)
const emailError = computed(() =>
  emailTouched.value && !email.value.includes('@') ? 'Enter a valid email' : ''
)
</script>

<template>
  <form @submit.prevent>
    <label>Email <input class="email" v-model="email" @blur="emailTouched = true" /></label>
    <p class="email-error">{{ emailError }}</p>

    <label>Password <input class="password" type="password" /></label>
    <p class="password-error"></p>

    <button class="submit">Create account</button>
  </form>
</template>`,
      },
      hints: [
        'Inside `useField`, create `const value = ref(initialValue)` and `const touched = ref(false)`, then build `error` and `isValid` with `computed()`.',
        '`error` is `computed(() => (touched.value ? validate(value.value) : \'\'))` and `isValid` is `computed(() => validate(value.value) === \'\')`. Return them all, plus `blur`.',
        'In `App.vue`, destructure with renames so each ref is a top-level binding the template unwraps: `const { value: email, error: emailError, isValid: emailOk, blur: blurEmail } = useField(\'\', (v) => (v.includes(\'@\') ? \'\' : \'Enter a valid email\'))`. Do the same for the password, then `:disabled="!(emailOk && passwordOk)"`.',
      ],
      solution: {
        explanation: 'All the field rules live in one function. Each call creates new refs, so email and password never interfere. The component destructures with renames so every ref is top-level in the template (refs nested in a plain object are not unwrapped in expressions like `!a.isValid`). The submit button derives its state from the two `isValid` computeds — no extra bookkeeping.',
        files: {
          'useField.js': `import { ref, computed } from 'vue'

export function useField(initialValue, validate) {
  const value = ref(initialValue)
  const touched = ref(false)

  const isValid = computed(() => validate(value.value) === '')
  const error = computed(() => (touched.value ? validate(value.value) : ''))

  function blur() {
    touched.value = true
  }

  return { value, touched, error, isValid, blur }
}`,
          'App.vue': `<script setup>
import { computed } from 'vue'
import { useField } from './useField.js'

const {
  value: email,
  error: emailError,
  isValid: emailOk,
  blur: blurEmail,
} = useField('', (v) => (v.includes('@') ? '' : 'Enter a valid email'))

const {
  value: password,
  error: passwordError,
  isValid: passwordOk,
  blur: blurPassword,
} = useField('', (v) => (v.length >= 8 ? '' : 'Use at least 8 characters'))

const canSubmit = computed(() => emailOk.value && passwordOk.value)
</script>

<template>
  <form @submit.prevent>
    <label>Email <input class="email" v-model="email" @blur="blurEmail" /></label>
    <p class="email-error">{{ emailError }}</p>

    <label>Password <input class="password" type="password" v-model="password" @blur="blurPassword" /></label>
    <p class="password-error">{{ passwordError }}</p>

    <button class="submit" :disabled="!canSubmit">Create account</button>
  </form>
</template>`,
        },
      },
      tests: [
        {
          name: 'useField: no error before blur, error after blur, cleared when valid',
          code: `const { useField } = requireModule('useField.js')
const f = withSetup(() => useField('', (v) => (v.includes('@') ? '' : 'bad')))
expect(f.value.value).toBe('')
expect(f.touched.value).toBe(false)
expect(f.error.value).toBe('')
expect(f.isValid.value).toBe(false)
f.blur()
expect(f.touched.value).toBe(true)
expect(f.error.value).toBe('bad')
f.value.value = 'a@b.co'
expect(f.error.value).toBe('')
expect(f.isValid.value).toBe(true)`,
        },
        {
          name: 'each call has its own state',
          code: `const { useField } = requireModule('useField.js')
const a = withSetup(() => useField('x', () => ''))
const b = withSetup(() => useField('y', () => ''))
a.value.value = 'changed'
expect(b.value.value).toBe('y')`,
        },
        {
          name: 'email shows its error only after blur',
          code: `await type('.email', 'nope')
expect(text('.email-error')).toBe('')
await trigger('.email', 'blur')
expect(text('.email-error')).toBe('Enter a valid email')
await type('.email', 'me@example.com')
expect(text('.email-error')).toBe('')`,
        },
        {
          name: 'password is validated independently',
          code: `await trigger('.email', 'blur')
expect(text('.password-error')).toBe('')
await type('.password', 'short')
await trigger('.password', 'blur')
expect(text('.password-error')).toBe('Use at least 8 characters')`,
        },
        {
          name: 'submit is enabled only when both fields are valid',
          code: `expect(find('.submit').disabled).toBe(true)
await type('.email', 'me@example.com')
expect(find('.submit').disabled).toBe(true)
await type('.password', 'longenough')
expect(find('.submit').disabled).toBe(false)`,
        },
      ],
    },
    {
      id: 'use-countdown',
      title: 'Timers & cleanup: useCountdown()',
      difficulty: 'intermediate',
      prompt: `
Build a countdown composable for a quiz timer in \`useCountdown.js\`:

\`useCountdown(from, options)\` where \`options.interval\` is the tick length in ms (default \`1000\`). Return:

- \`remaining\` — a ref starting at \`from\`,
- \`isRunning\` — a ref, \`false\` at first,
- \`start()\` — starts ticking: every \`interval\` ms, \`remaining\` goes down by 1. Calling \`start()\` while already running must **not** start a second timer.
- \`stop()\` — stops ticking.

When \`remaining\` reaches **0**, stop automatically (\`isRunning\` becomes \`false\`).

**Cleanup:** register the cleanup with \`onScopeDispose()\` (imported from \`'vue'\`) so the timer is cleared when the component unmounts — the tests also stop it through a manual effect scope, where \`onUnmounted\` would not run.

\`App.vue\` is already wired: \`.remaining\`, \`.start\` and \`.stop\`.
`,
      files: {
        'useCountdown.js': `import { ref, onScopeDispose } from 'vue'

export function useCountdown(from, options = {}) {
  const { interval = 1000 } = options
  const remaining = ref(from)
  const isRunning = ref(false)

  // TODO: start(), stop(), auto-stop at 0, and cleanup with onScopeDispose()
  function start() {}
  function stop() {}

  return { remaining, isRunning, start, stop }
}`,
        'App.vue': `<script setup>
import { useCountdown } from './useCountdown.js'

const { remaining, isRunning, start, stop } = useCountdown(5, { interval: 100 })
</script>

<template>
  <p class="remaining">{{ remaining }}</p>
  <button class="start" :disabled="isRunning" @click="start">Start</button>
  <button class="stop" :disabled="!isRunning" @click="stop">Stop</button>
</template>`,
      },
      hints: [
        'Keep the interval id in a plain variable (`let timer = null`) — it is bookkeeping, not something the UI shows, so it doesn\'t need to be a ref.',
        '`start()`: return early if `timer` is already set; otherwise `timer = setInterval(() => { remaining.value--; if (remaining.value <= 0) stop() }, interval)` and set `isRunning.value = true`.',
        '`stop()`: `clearInterval(timer); timer = null; isRunning.value = false`. Then register `onScopeDispose(stop)` once, inside `useCountdown`.',
      ],
      solution: {
        explanation: 'The timer id is private bookkeeping held in a closure. `start()` guards against double timers, `stop()` is safe to call repeatedly, and `onScopeDispose(stop)` guarantees the browser timer dies with the component — or with any effect scope the composable runs in.',
        files: {
          'useCountdown.js': `import { ref, onScopeDispose } from 'vue'

export function useCountdown(from, options = {}) {
  const { interval = 1000 } = options
  const remaining = ref(from)
  const isRunning = ref(false)
  let timer = null

  function stop() {
    clearInterval(timer)
    timer = null
    isRunning.value = false
  }

  function start() {
    if (timer !== null || remaining.value <= 0) return
    isRunning.value = true
    timer = setInterval(() => {
      remaining.value--
      if (remaining.value <= 0) stop()
    }, interval)
  }

  onScopeDispose(stop)

  return { remaining, isRunning, start, stop }
}`,
          'App.vue': `<script setup>
import { useCountdown } from './useCountdown.js'

const { remaining, isRunning, start, stop } = useCountdown(5, { interval: 100 })
</script>

<template>
  <p class="remaining">{{ remaining }}</p>
  <button class="start" :disabled="isRunning" @click="start">Start</button>
  <button class="stop" :disabled="!isRunning" @click="stop">Stop</button>
</template>`,
        },
      },
      tests: [
        {
          name: 'counts down and stops at 0',
          code: `const { useCountdown } = requireModule('useCountdown.js')
const c = withSetup(() => useCountdown(3, { interval: 30 }))
expect(c.remaining.value).toBe(3)
expect(c.isRunning.value).toBe(false)
c.start()
expect(c.isRunning.value).toBe(true)
await wait(200)
expect(c.remaining.value).toBe(0)
expect(c.isRunning.value).toBe(false)`,
        },
        {
          name: 'calling start() twice does not double the speed',
          code: `const { useCountdown } = requireModule('useCountdown.js')
const c = withSetup(() => useCountdown(10, { interval: 50 }))
c.start()
c.start()
await wait(130)
expect(c.remaining.value).toBeGreaterThanOrEqual(7)
c.stop()`,
        },
        {
          name: 'stop() pauses the countdown',
          code: `await click('.start')
await wait(250)
await click('.stop')
const paused = text('.remaining')
expect(Number(paused)).toBeLessThan(5)
await wait(250)
expect(text('.remaining')).toBe(paused)`,
        },
        {
          name: 'the timer is cleared when its scope is disposed',
          code: `const { effectScope } = requireModule('vue')
const { useCountdown } = requireModule('useCountdown.js')
const scope = effectScope()
const c = scope.run(() => useCountdown(50, { interval: 20 }))
c.start()
await wait(70)
scope.stop()
const after = c.remaining.value
expect(after).toBeLessThan(50)
await wait(100)
expect(c.remaining.value).toBe(after)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'composables-intro-what-is',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a composable in Vue 3, and what problem does it solve?',
      answer: 'A composable is a function — conventionally named `useSomething` — that uses Composition API features (`ref`, `computed`, `watch`, lifecycle hooks) to encapsulate stateful logic and return it, usually as a plain object of refs and functions. It solves reusing *logic* (not markup) across components without copy-paste or mixins.',
      explanation: 'Components reuse UI; utilities reuse stateless code; composables reuse logic *with state and lifecycle*. Because it is just a function call, the component can see exactly what it receives.',
      code: {
        lang: 'js',
        code: `export function useOnline() {
  const isOnline = ref(navigator.onLine)
  const update = () => (isOnline.value = navigator.onLine)
  onMounted(() => {
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })
  onUnmounted(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
  return { isOnline }
}`,
      },
      whyAsked: 'It is the central reuse pattern of modern Vue. Interviewers check that you know it is "just a function" and what makes it different from a plain helper.',
      mistakes: [
        'Calling any helper function a composable, even when it has no reactive state.',
        'Saying composables are a special API you must register.',
        'Forgetting to mention lifecycle/cleanup, which is where composables shine.',
      ],
      followUps: ['How does a composable differ from a mixin?', 'Why does a composable usually return refs rather than a reactive object?', 'Where in a component can you call a composable?'],
      modelAnswer: 'A composable is a plain function, by convention named `use…`, that uses the Composition API to create reactive state, derived values, watchers and lifecycle hooks, and returns what the caller needs — typically a plain object of refs and functions. It exists to reuse stateful logic, the part components and plain utilities don\'t cover. For example `useOnline()` owns an `isOnline` ref, adds listeners on mount and removes them on unmount; any component gets that behaviour with one line. Because the component destructures the return value, it is explicit where every piece comes from, unlike mixins. The trade-off is discipline: call them synchronously in setup and clean up side effects.',
    },
    {
      id: 'composables-intro-local-shared',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Two components call `useTheme()`. In one design they each get their own theme; in another, changing the theme in one changes it everywhere. What is the code difference?',
      options: [
        'The shared version declares the ref at module level, outside the function; the local version creates it inside.',
        'The shared version uses `reactive()` instead of `ref()`.',
        'The shared version must be registered with `app.use()`.',
        'The shared version is called in `onMounted` instead of setup.',
      ],
      correctOption: 0,
      answer: 'Where the state is created. Inside the function body, each call creates new refs (local, per component). At module level, the ref is created once when the module is first imported, and every call returns the same ref (shared, app-wide).',
      explanation: 'Modules are evaluated once. Function bodies run on every call. That single fact decides ownership.',
      code: {
        lang: 'js',
        code: `// shared
const theme = ref('light')
export function useTheme() { return { theme } }

// local
export function useLocalTheme() {
  const theme = ref('light')
  return { theme }
}`,
      },
      whyAsked: 'Accidental sharing (or accidental non-sharing) is one of the most common composable bugs, and the shared variant has SSR implications.',
      mistakes: ['Thinking `reactive` vs `ref` affects sharing.', 'Not mentioning SSR request leakage for module-level state.', 'Believing each import creates a new module instance.'],
      followUps: ['Why is module-level state risky with SSR?', 'When would you choose Pinia instead?', 'How could provide/inject give you "shared within a subtree"?'],
      modelAnswer: 'It depends only on where the `ref()` call lives. Inside the function, every call runs it again, so each component owns its state. At module level it runs once when the module loads, so every caller gets the same ref — effectively a tiny global store. Shared module state is fine in a client-only SPA for things like a toast queue, but in SSR a single server process renders many users, so the state would leak between requests. For app-wide state in serious apps I use Pinia, and for "shared within one subtree" I use provide/inject.',
    },
    {
      id: 'composables-intro-reactive-return',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'The pointer moves to x = 120. What does `{{ x }}` show in the component?',
      code: {
        lang: 'js',
        code: `// usePointer.js
export function usePointer() {
  const state = reactive({ x: 0, y: 0 })
  const move = (e) => { state.x = e.clientX; state.y = e.clientY }
  onMounted(() => window.addEventListener('pointermove', move))
  onUnmounted(() => window.removeEventListener('pointermove', move))
  return state
}

// Component.vue
const { x } = usePointer()`,
      },
      options: ['120', '0', 'undefined', 'A ref object'],
      correctOption: 1,
      answer: '`0`. Destructuring a reactive object copies the current primitive value; `x` is a plain number that never updates.',
      explanation: 'Return `{ x: ref(0), y: ref(0) }` instead (or `toRefs(state)`), so destructured values stay connected.',
      whyAsked: 'Tests understanding of how reactivity survives (or doesn\'t) across function boundaries — a daily concern when writing composables.',
      mistakes: ['Answering 120 because "state is reactive".', 'Suggesting `nextTick` as a fix.'],
      followUps: ['How would you fix it without changing the component?', 'Why do refs survive destructuring?'],
      modelAnswer: 'It shows 0 forever. Destructuring reads `state.x` once and stores the number in a new variable, so the link to the proxy is gone. The fix is to return a plain object of refs — or `toRefs(state)` — because destructuring then copies the ref objects, which stay reactive. If a caller wants object syntax, they can wrap the result in `reactive()` themselves.',
    },
    {
      id: 'composables-intro-notify-coding',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'A notification system is split into two components: `SendButton.vue` adds a notification, `NotificationList.vue` shows them. Both call `useNotifications()`, yet the list never shows anything. Fix `useNotifications.js` so all components share one list. Requirements: `notify(text)` adds `{ id, text }`; `dismiss(id)` removes it; the list renders `li.note` items with a `button.dismiss` each.',
      starter: {
        files: {
          'useNotifications.js': `import { ref } from 'vue'

let nextId = 1

export function useNotifications() {
  const notifications = ref([])

  function notify(text) {
    notifications.value.push({ id: nextId++, text })
  }

  function dismiss(id) {
    // TODO
  }

  return { notifications, notify, dismiss }
}`,
          'SendButton.vue': `<script setup>
import { useNotifications } from './useNotifications.js'
const { notify } = useNotifications()
</script>

<template>
  <button class="send" @click="notify('Saved!')">Save</button>
</template>`,
          'NotificationList.vue': `<script setup>
import { useNotifications } from './useNotifications.js'
const { notifications, dismiss } = useNotifications()
</script>

<template>
  <ul class="list">
    <li v-for="n in notifications" :key="n.id" class="note">
      {{ n.text }} <button class="dismiss" @click="dismiss(n.id)">×</button>
    </li>
  </ul>
</template>`,
          'App.vue': `<script setup>
import SendButton from './SendButton.vue'
import NotificationList from './NotificationList.vue'
</script>

<template>
  <SendButton />
  <NotificationList />
</template>`,
        },
      },
      tests: [
        { name: 'sending shows a notification in the list', code: `await click('.send'); expect(findAll('.note')).toHaveLength(1); expect(text('.note')).toContain('Saved!')` },
        { name: 'several notifications stack up', code: `await click('.send'); await click('.send'); await click('.send'); expect(findAll('.note')).toHaveLength(3)` },
        { name: 'dismiss removes only that notification', code: `await click('.send'); await click('.send'); await click(findAll('.dismiss')[0]); expect(findAll('.note')).toHaveLength(1)` },
      ],
      hints: ['Each component currently gets its own `notifications` ref. Which line runs once per call?', 'Move `const notifications = ref([])` above the function, next to `nextId`.', '`dismiss` can reassign: `notifications.value = notifications.value.filter((n) => n.id !== id)`.'],
      answer: 'Move the `notifications` ref to module level so every call returns the same ref, and implement `dismiss` with `filter`.',
      solution: {
        files: {
          'useNotifications.js': `import { ref } from 'vue'

// Module level: created once, shared by every caller
const notifications = ref([])
let nextId = 1

export function useNotifications() {
  function notify(text) {
    notifications.value.push({ id: nextId++, text })
  }

  function dismiss(id) {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  return { notifications, notify, dismiss }
}`,
          'SendButton.vue': `<script setup>
import { useNotifications } from './useNotifications.js'
const { notify } = useNotifications()
</script>

<template>
  <button class="send" @click="notify('Saved!')">Save</button>
</template>`,
          'NotificationList.vue': `<script setup>
import { useNotifications } from './useNotifications.js'
const { notifications, dismiss } = useNotifications()
</script>

<template>
  <ul class="list">
    <li v-for="n in notifications" :key="n.id" class="note">
      {{ n.text }} <button class="dismiss" @click="dismiss(n.id)">×</button>
    </li>
  </ul>
</template>`,
          'App.vue': `<script setup>
import SendButton from './SendButton.vue'
import NotificationList from './NotificationList.vue'
</script>

<template>
  <SendButton />
  <NotificationList />
</template>`,
        },
      },
      explanation: 'The button and the list each called the composable and received *separate* arrays. Moving the ref to module level turns the composable into a shared, app-wide service. In a real app you might also wrap the exported list in `readonly()` so only `notify`/`dismiss` can change it.',
      whyAsked: 'Shows you can reason about state ownership in composables, not just write them.',
      mistakes: ['Passing the list down through props instead of fixing ownership.', 'Moving `nextId` but not the ref.', 'Mutating with `splice` using the id as an index.'],
      followUps: ['How would this break with server-side rendering?', 'How would you stop components from pushing directly into `notifications`?'],
      modelAnswer: 'Both components call `useNotifications()`, and because the ref is created inside the function, each gets a separate array — the button pushes into one nobody renders. Moving the ref to module scope makes it a singleton, so every caller shares it. I\'d implement `dismiss` with a `filter` by id, and expose the list as `readonly(notifications)` so state changes only go through the functions. In an SSR app I\'d move this into Pinia so each request gets fresh state.',
    },
    {
      id: 'composables-intro-leak',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A dashboard tab uses `useResizeLogger()`. After switching tabs a few times, every window resize logs five lines instead of one. What is wrong, and how do you fix it?',
      code: {
        lang: 'js',
        code: `export function useResizeLogger() {
  onMounted(() => {
    window.addEventListener('resize', () => console.log('resized'))
  })
  onUnmounted(() => {
    window.removeEventListener('resize', () => console.log('resized'))
  })
}`,
      },
      answer: 'Each arrow function is a *new* function object, so `removeEventListener` is asked to remove a function that was never added. The original listener stays attached, and each mount adds another. Store the handler in a variable and pass the same reference to both calls.',
      explanation: '`removeEventListener` matches by identity (same event type, same function reference, same capture flag).',
      whyAsked: 'Classic memory-leak bug in composables that wrap browser APIs.',
      mistakes: ['Blaming Vue for not unmounting.', 'Suggesting `{ once: true }`, which changes behaviour instead of fixing cleanup.'],
      followUps: ['How could you make a reusable `useEventListener(target, event, handler)`?', 'Why might `onScopeDispose` be preferable to `onUnmounted` here?'],
      modelAnswer: 'The cleanup never works because `removeEventListener` needs the exact same function reference that was added, and the code creates two different arrow functions. Every mount therefore adds a listener and none are removed, so after five mounts there are five. The fix is `const onResize = () => console.log(\'resized\')` and passing `onResize` to both calls. I\'d generalise it into a `useEventListener` composable so the add/remove pairing is written once.',
    },
    {
      id: 'composables-intro-ssr-singleton',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'Your team keeps the logged-in user in a module-level ref inside `useCurrentUser.js`. The app is moving to server-side rendering. What could go wrong, and what would you do?',
      answer: 'On the server, one Node process handles many requests, and ES modules are evaluated once per process. A module-level ref is therefore shared by every request: user A\'s data could appear in user B\'s rendered HTML. Move the state into something created per app instance — a Pinia store (created per request with `createPinia()`) or a value provided with `app.provide()` — and keep composables as accessors to it.',
      explanation: 'In the browser, one tab = one app, so module state feels harmless. On the server it becomes cross-request state.',
      whyAsked: 'Checks whether you understand the runtime context of shared state, which matters for Nuxt and any SSR setup.',
      mistakes: ['Saying it only matters for performance.', 'Assuming each request gets fresh modules.', 'Proposing `localStorage`, which doesn\'t exist on the server.'],
      followUps: ['How does Pinia avoid this problem?', 'Is module-level state ever fine in an SSR app?'],
      modelAnswer: 'Module-level refs are singletons per JavaScript runtime. In a browser that\'s per tab, but with SSR the server process reuses the same module across requests, so a module-level `currentUser` would leak between users — a privacy bug, not just a glitch. I\'d move it to Pinia, which is installed per app instance and therefore per request, or provide it on the app with `app.provide`. The composable can stay as a thin `useCurrentUser()` that reads from the store, so components don\'t change. Truly constant data, like configuration, can stay at module level.',
    },
    {
      id: 'composables-intro-vs-utility',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'A teammate names a date-formatting helper `useFormatDate(date)`. It returns a string and imports nothing from Vue. Is it a composable? Does the name matter?',
      answer: 'No — it holds no reactive state and uses no Vue API, so it is a plain utility and should be called `formatDate`. The `use` prefix signals "this creates reactive state / registers hooks and must be called in setup", so misusing it misleads readers and lint rules.',
      explanation: 'Names are documentation. `use…` carries a calling contract; a pure function can be called anywhere.',
      whyAsked: 'A quick check that you know what *makes* something a composable.',
      mistakes: ['Saying any function in the composables folder is a composable.', 'Thinking the prefix is required by Vue at runtime.'],
      followUps: ['When would a date helper become a composable? (e.g. `useNow()` returning a ref that ticks)', 'Can composables call plain utilities?'],
      modelAnswer: 'It isn\'t a composable — it\'s a pure function that happens to be named like one. What makes something a composable is that it uses Vue\'s reactivity or lifecycle APIs and so must run during setup. The `use` prefix communicates that contract, so I\'d rename it `formatDate` so people know they can call it anywhere, even in a template or a test. A `useRelativeTime(date)` that returns a ref which updates every minute *would* be a composable.',
    },
  ],

  takeaways: [
    'A composable is a plain function named `use…` that uses the Composition API to package stateful logic.',
    'Call composables synchronously during setup so their hooks and watchers attach to the right component.',
    'Return a plain object of refs and functions — refs survive destructuring, reactive properties do not.',
    'State created inside the function is per caller; state at module level is shared app-wide (and leaks across requests in SSR).',
    'Clean up everything Vue does not own — timers, listeners, sockets — with `onUnmounted()` or `onScopeDispose()`.',
  ],
}
