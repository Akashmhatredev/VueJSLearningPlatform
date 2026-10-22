// Project 1: Interactive Counter — a venue "door counter".
// Concepts: refs, events, computed, templates.

const counterStyles = `<style scoped>
.door-counter {
  --ink: #1d1d1f;
  --muted: #5b5b66;
  --line: #d9d9e0;
  --ok: #1f7a4d;
  --busy: #a15c00;
  --full: #b42318;
  max-width: 420px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
  color: var(--ink);
}
.top h1 { margin: 0; font-size: 1.5rem; }
.subtitle { margin: 4px 0 16px; color: var(--muted); }
.panel {
  border: 2px solid var(--line);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  transition: border-color 0.2s;
}
.panel.is-ok { border-color: var(--ok); }
.panel.is-busy { border-color: var(--busy); }
.panel.is-full,
.panel.is-over { border-color: var(--full); }
.panel__label { margin: 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }
.count { margin: 4px 0; font-size: 4rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.status { margin: 0 0 12px; font-weight: 600; }
.is-busy .status { color: var(--busy); }
.is-full .status,
.is-over .status { color: var(--full); }
.bar { height: 10px; border-radius: 99px; background: #eee; overflow: hidden; }
.bar__fill { height: 100%; background: currentColor; transition: width 0.2s; }
.remaining { margin: 10px 0 0; color: var(--muted); }
.controls { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
.controls button { font-size: 1.4rem; padding: 14px; border-radius: 12px; border: 2px solid var(--ink); background: #fff; cursor: pointer; }
.controls .btn-inc { background: var(--ink); color: #fff; }
.controls button:disabled { opacity: 0.35; cursor: not-allowed; }
.controls button:focus-visible,
.settings :focus-visible { outline: 3px solid #4c6ef5; outline-offset: 2px; }
.settings { display: flex; flex-wrap: wrap; gap: 12px; align-items: end; }
.settings label { display: grid; gap: 4px; font-size: 0.9rem; color: var(--muted); }
.settings select,
.settings input { font: inherit; padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; width: 90px; }
.btn-reset { margin-left: auto; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--line); background: #fff; cursor: pointer; }
.capacity-error { flex-basis: 100%; margin: 0; color: var(--full); font-size: 0.85rem; }
</style>`

const starterApp = `<script setup>
import { ref } from 'vue'
// TODO (step 4): import computed from 'vue'
// TODO (step 4): import { statusFor, clamp } from './capacity.js'

// ---- State: the values that change
const count = ref(0)
// TODO (step 3): a capacity ref (starts at 20) and a step ref (starts at 1)

// ---- Events: the only places that change state
function increment() {
  count.value++ // TODO (step 2 + 3): use the step size and stop at the capacity
}

// TODO (step 2): decrement() — never below 0
// TODO (step 5): reset()
</script>

<template>
  <main class="door-counter">
    <header class="top">
      <h1>Door counter</h1>
      <p class="subtitle">How many people are inside right now?</p>
    </header>

    <!-- TODO (step 5): bind the class to the status, e.g. is-ok / is-full -->
    <section class="panel is-empty" aria-labelledby="inside-label">
      <p id="inside-label" class="panel__label">People inside</p>
      <p class="count" aria-live="polite">{{ count }}</p>
      <!-- TODO (step 4): these three lines are hard-coded — derive them -->
      <p class="status">Empty</p>
      <div class="bar" aria-hidden="true"><div class="bar__fill" style="width: 0%"></div></div>
      <p class="remaining">20 spots left</p>
    </section>

    <div class="controls">
      <button type="button" class="btn-dec" aria-label="Remove 1 person">− 1</button>
      <button type="button" class="btn-inc" aria-label="Add 1 person" @click="increment">+ 1</button>
    </div>

    <form class="settings" @submit.prevent>
      <label>
        Step
        <select class="step">
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="5">5</option>
        </select>
      </label>
      <label>
        Capacity
        <input class="capacity" type="number" min="1" value="20" />
      </label>
      <button type="button" class="btn-reset">Reset</button>
    </form>
  </main>
</template>

${counterStyles}`

const starterCapacity = `// Pure helpers: no Vue, no DOM — just rules about numbers.
// Keeping them here makes them easy to read, reuse and test.

export const BUSY_AT = 0.8 // 80% full or more counts as "almost full"

// Keep a number inside [min, max].
export function clamp(value, min, max) {
  // TODO (step 4)
  return value
}

// Describe how full the venue is.
// Returns { key, label } where key is one of:
// 'empty' | 'ok' | 'busy' | 'full' | 'over'
export function statusFor(count, capacity) {
  // TODO (step 4)
  return { key: 'empty', label: 'Empty' }
}
`

const solutionCapacity = `// Pure helpers: no Vue, no DOM — just rules about numbers.
// Keeping them here makes them easy to read, reuse and test.

export const BUSY_AT = 0.8 // 80% full or more counts as "almost full"

// Keep a number inside [min, max].
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// Describe how full the venue is.
// Returns { key, label } where key is one of:
// 'empty' | 'ok' | 'busy' | 'full' | 'over'
export function statusFor(count, capacity) {
  if (count === 0) return { key: 'empty', label: 'Empty' }
  if (count > capacity) return { key: 'over', label: 'Over capacity' }
  if (count === capacity) return { key: 'full', label: 'Full' }
  if (count / capacity >= BUSY_AT) return { key: 'busy', label: 'Almost full' }
  return { key: 'ok', label: 'Plenty of room' }
}
`

const solutionApp = `<script setup>
import { ref, computed } from 'vue'
import { statusFor, clamp } from './capacity.js'

// ---- State: the values that change
const count = ref(0)
const capacity = ref(20)
const step = ref(1)
const stepOptions = [1, 2, 5]

// ---- Derived state: always calculated from the state above, never stored
// v-model.number gives back the raw string when the box can't be parsed
// (for example when it is empty), so validate before doing maths with it.
const capacityIsValid = computed(() => Number.isInteger(capacity.value) && capacity.value >= 1)
const safeCapacity = computed(() => (capacityIsValid.value ? capacity.value : 1))

const remaining = computed(() => Math.max(0, safeCapacity.value - count.value))
const spotsLabel = computed(() => (remaining.value === 1 ? '1 spot left' : remaining.value + ' spots left'))
const percentFull = computed(() => clamp(Math.round((count.value / safeCapacity.value) * 100), 0, 100))
const status = computed(() => statusFor(count.value, safeCapacity.value))
const isFull = computed(() => count.value >= safeCapacity.value)
const isEmpty = computed(() => count.value === 0)

// ---- Events: the only places that change state
function increment() {
  if (isFull.value) return // also covers "over capacity": + never lowers the count
  count.value = Math.min(count.value + step.value, safeCapacity.value)
}

function decrement() {
  count.value = Math.max(0, count.value - step.value)
}

function reset() {
  count.value = 0
}
</script>

<template>
  <main class="door-counter">
    <header class="top">
      <h1>Door counter</h1>
      <p class="subtitle">How many people are inside right now?</p>
    </header>

    <section class="panel" :class="'is-' + status.key" aria-labelledby="inside-label">
      <p id="inside-label" class="panel__label">People inside</p>
      <p class="count" aria-live="polite">{{ count }}</p>
      <p class="status">{{ status.label }}</p>
      <div class="bar" aria-hidden="true">
        <div class="bar__fill" :style="{ width: percentFull + '%' }"></div>
      </div>
      <p class="remaining">{{ spotsLabel }}</p>
    </section>

    <div class="controls">
      <button
        type="button"
        class="btn-dec"
        :disabled="isEmpty"
        :aria-label="'Remove ' + step + (step === 1 ? ' person' : ' people')"
        @click="decrement"
      >
        − {{ step }}
      </button>
      <button
        type="button"
        class="btn-inc"
        :disabled="isFull"
        :aria-label="'Add ' + step + (step === 1 ? ' person' : ' people')"
        @click="increment"
      >
        + {{ step }}
      </button>
    </div>

    <form class="settings" @submit.prevent>
      <label>
        Step
        <select v-model.number="step" class="step">
          <option v-for="n in stepOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
      <label>
        Capacity
        <input
          v-model.number="capacity"
          class="capacity"
          type="number"
          min="1"
          :aria-invalid="!capacityIsValid"
          aria-describedby="capacity-help"
        />
      </label>
      <button type="button" class="btn-reset" @click="reset">Reset</button>
      <p v-if="!capacityIsValid" id="capacity-help" class="capacity-error" role="alert">
        Enter a whole number of at least 1.
      </p>
    </form>
  </main>
</template>

${counterStyles}`

const undoStarter = `<script setup>
import { ref } from 'vue'

const count = ref(0)

function add(amount) {
  count.value += amount
}
</script>

<template>
  <p class="count">{{ count }}</p>
  <button class="plus" @click="add(1)">+1</button>
  <button class="minus" @click="add(-1)">−1</button>
  <button class="undo">Undo</button>
</template>`

const undoSolution = `<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const history = ref([]) // previous values, newest last

const canUndo = computed(() => history.value.length > 0)

function add(amount) {
  history.value.push(count.value) // remember where we were
  count.value += amount
}

function undo() {
  if (!canUndo.value) return
  count.value = history.value.pop()
}
</script>

<template>
  <p class="count">{{ count }}</p>
  <button class="plus" @click="add(1)">+1</button>
  <button class="minus" @click="add(-1)">−1</button>
  <button class="undo" :disabled="!canUndo" @click="undo">Undo</button>
</template>`

export default {
  id: 'project-counter',
  kind: 'project',
  title: 'Project 1: Interactive Counter',
  summary: 'Build a venue door counter with refs, click handlers, computed status and a template that always tells the truth.',
  difficulty: 'beginner',
  minutes: 60,
  prerequisites: ['ref', 'computed', 'v-on-events', 'template-syntax'],
  related: ['v-model-forms', 'class-style-bindings', 'conditional-rendering', 'es-modules', 'project-task-manager'],
  tags: ['project', 'counter', 'ref', 'computed', 'events', 'v-model', 'class binding', 'beginner project'],
  apis: [
    { name: 'ref()', summary: 'Holds the count, capacity and step size — the state that changes.' },
    { name: 'computed()', summary: 'Derives remaining spots, the fill percentage and the status label from the state.' },
    { name: 'v-model.number', summary: 'Binds the step select and capacity input, converting text to numbers when it can.' },
  ],
  docs: [
    { label: 'Vue Guide — Reactivity Fundamentals', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html' },
    { label: 'Vue Guide — Computed Properties', url: 'https://vuejs.org/guide/essentials/computed.html' },
    { label: 'Vue Guide — Event Handling', url: 'https://vuejs.org/guide/essentials/event-handling.html' },
    { label: 'Vue Guide — Form Input Bindings (.number modifier)', url: 'https://vuejs.org/guide/essentials/forms.html#number' },
  ],

  intro: `
Your first real Vue app: a **door counter** for a café, gym or concert hall. Staff tap **+** when people come in and **−** when they leave. The app shows how many people are inside, how many spots are left, and a status — *Plenty of room*, *Almost full*, *Full* or *Over capacity*.

It sounds tiny, and that is the point. A counter is small enough to finish in one sitting, but it already contains the three ideas every Vue app is built from:

- **state** — values that change (\`ref()\`),
- **events** — the moments that change them (\`@click\`, \`v-model\`),
- **derived values** — things you calculate from the state instead of storing (\`computed()\`).

Get these three right here and every later project is the same pattern, just bigger.
`,

  why: `
A naive counter is three lines. A counter staff can **trust** is a different job:

- It must never show \`-1\` people, and never let the door staff wave in person 21 when the limit is 20.
- The status, the "spots left" text and the colour must **always agree** with the number. If one of them is a separate variable you update by hand, one day you forget, and the screen lies.
- The manager might lower the capacity while people are inside. The app must handle that without deleting anyone.

This project teaches the habit that prevents all of those bugs: **store as little as possible, derive everything else, and change state only in a few well-named functions.**
`,

  eli15: `
Think of the app as a whiteboard by the door with **one number** written on it: people inside.

Everything else — "12 spots left", "Almost full", the orange colour — is not written on the board. It's worked out from that number every time you look. That's what \`computed()\` does: it is a little formula Vue re-runs only when the numbers it uses change.

The **+** and **−** buttons are the only markers allowed to touch the board, and they follow rules: no going below zero, no going past the limit.

In Vue terms: the number is a \`ref\`, the buttons are event handlers, the formulas are \`computed\` values, and the template is the whiteboard everyone reads.
`,

  analogy: {
    title: 'The bouncer with a clicker',
    body: `
A bouncer holds a hand clicker. The clicker stores exactly one thing: a number. The bouncer does not keep a separate notepad saying "almost full" — they glance at the clicker and *know*. And the clicker has rules built in: it won't go below zero.

Your app is that clicker plus the bouncer's judgement. The clicker is the state, the glance-and-know is a computed value, and the button rules live inside the event handlers.
`,
    mapping: [
      ['the number on the clicker', '`count` — a `ref`'],
      ['pressing the clicker', '`increment()` / `decrement()` called by `@click`'],
      ['"we\'re almost full" judgement', '`status` — a `computed` from `count` and `capacity`'],
      ['the fire-safety limit on the wall', '`capacity` — a `ref` bound with `v-model.number`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'How the door counter is wired',
    caption: 'Events write state; computed values derive from state; the template reads both. Nothing in the template is updated by hand.',
    alt: 'Diagram with six boxes. "You click or type" points to "Event handlers" (increment, decrement, reset), which write to "State (refs)" (count, capacity, step). A dashed arrow labelled v-model goes straight from the user to the state. State feeds "Derived (computed)" (remaining, percentFull, status), which also uses the pure rules in "capacity.js". Both state and derived values flow into the "Template", which renders what the user sees.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'user', label: 'You click / type', note: '+, −, step, capacity', tone: 'paper' },
        { id: 'handlers', label: 'Event handlers', note: 'increment · decrement · reset', tone: 'cobalt' },
        { id: 'state', label: 'State (refs)', note: 'count · capacity · step', tone: 'acid' },
        { id: 'helpers', label: 'capacity.js', note: 'statusFor() · clamp()', tone: 'kraft' },
        { id: 'derived', label: 'Derived (computed)', note: 'remaining · percentFull · status', tone: 'acid' },
        { id: 'template', label: 'Template', note: '{{ count }} · :class · :disabled', tone: 'ink' },
      ],
      edges: [
        { from: 'user', to: 'handlers', label: '@click' },
        { from: 'handlers', to: 'state', label: 'writes .value' },
        { from: 'user', to: 'state', label: 'v-model', dashed: true },
        { from: 'state', to: 'derived', label: 'tracked reads' },
        { from: 'helpers', to: 'derived', label: 'pure rules' },
        { from: 'derived', to: 'template', label: 'renders' },
        { from: 'state', to: 'template', label: 'renders' },
      ],
      steps: [
        { focus: ['user', 'handlers'], edges: ['user->handlers'], text: 'A click on **+** calls `increment()`. Handlers are the only code allowed to change the count, so every rule ("not past capacity") lives in one place.' },
        { focus: ['handlers', 'state'], edges: ['handlers->state'], text: 'The handler writes `count.value`. That write is what Vue notices.' },
        { focus: ['user', 'state'], edges: ['user->state'], text: 'The step size and capacity are changed directly by `v-model.number` — a shortcut for "listen to input events and write the ref".' },
        { focus: ['state', 'helpers', 'derived'], edges: ['state->derived', 'helpers->derived'], text: '`remaining`, `percentFull` and `status` are `computed`. They re-calculate only when a ref they read changes, using the plain rules in `capacity.js`.' },
        { focus: ['derived', 'state', 'template'], edges: ['derived->template', 'state->template'], text: 'The template reads state and derived values. Vue re-renders the parts that changed — the number, the label, the class, the disabled buttons — all from one write.' },
      ],
    },
  },

  requirements: [
    'Show the number of people inside in `.count`, starting at **0**.',
    '`.btn-inc` adds the current step size; `.btn-dec` removes it. The count never goes **below 0** and **+** never takes it **past the capacity** (it fills up to the limit).',
    'A `<select class="step">` offers step sizes **1, 2 and 5** (default 1).',
    'An `<input class="capacity" type="number">` sets the capacity (default **20**). A blank or invalid value shows an error in `.capacity-error` and must never produce `NaN` on screen.',
    '`.remaining` shows the spots left, e.g. **"20 spots left"** / **"1 spot left"** (never negative).',
    '`.status` shows **Empty**, **Plenty of room**, **Almost full** (80% or more), **Full** or **Over capacity** (if the capacity is lowered below the count). `.panel` gets the matching class: `is-empty`, `is-ok`, `is-busy`, `is-full`, `is-over`.',
    'Lowering the capacity below the count keeps the count (nobody is deleted); **+** then does nothing.',
    '`.btn-reset` sets the count back to 0. `capacity.js` exports `statusFor(count, capacity)` and `clamp(value, min, max)`.',
  ],

  objectives: [
    'Decide what is **state** (a `ref`) and what is **derived** (a `computed`) — and explain why storing derived values causes bugs.',
    'Wire user actions to state with `@click` handlers that enforce rules in one place.',
    'Bind form controls with `v-model.number` and handle the case where the input is not a number.',
    'Drive classes, inline styles, `disabled` and ARIA attributes from state with `v-bind`.',
    'Move pure rules into a plain `.js` module so they are easy to read and test.',
  ],

  playground: {
    title: 'Door counter — starter',
    objective: 'Turn the half-built counter into the finished app. Follow the steps below, press **Run tests** often, and stop when every test is green.',
    files: { 'App.vue': starterApp, 'capacity.js': starterCapacity },
    expected: 'The starter renders the layout and **+** adds one, but **−**, the step size, the capacity, the status and the "spots left" text are not wired yet — most tests fail. When you are done, all tests pass and the app behaves like the finished preview above.',
    tests: [
      {
        name: 'starts empty with 20 spots left',
        code: `expect(text('.count')).toBe('0')
expect(text('.remaining')).toBe('20 spots left')
expect(text('.status')).toBe('Empty')`,
      },
      {
        name: '+ and − change the count by one',
        code: `await click('.btn-inc')
await click('.btn-inc')
await click('.btn-dec')
expect(text('.count')).toBe('1')
expect(text('.remaining')).toBe('19 spots left')`,
      },
      {
        name: 'never drops below 0 (and − is disabled at 0)',
        code: `await click('.btn-inc')
await click('.btn-dec')
expect(find('.btn-dec').disabled).toBe(true)
// force clicks anyway: the rule must live in the handler, not only in :disabled
for (let i = 0; i < 3; i++) {
  find('.btn-dec').disabled = false
  await click('.btn-dec')
}
expect(text('.count')).toBe('0')`,
      },
      {
        name: 'the step select changes how much + and − move',
        code: `await select('.step', '5')
await click('.btn-inc')
expect(text('.count')).toBe('5')
await click('.btn-inc')
expect(text('.count')).toBe('10')
await click('.btn-dec')
expect(text('.count')).toBe('5')`,
      },
      {
        name: 'never goes above the capacity',
        code: `await type('.capacity', '3')
for (let i = 0; i < 5; i++) {
  find('.btn-inc').disabled = false
  await click('.btn-inc')
}
expect(text('.count')).toBe('3')
expect(text('.status')).toBe('Full')
expect(text('.remaining')).toBe('0 spots left')
expect(classes('.panel')).toContain('is-full')`,
      },
      {
        name: 'status is derived from count and capacity',
        code: `await type('.capacity', '10')
for (let i = 0; i < 7; i++) await click('.btn-inc')
expect(text('.status')).toBe('Plenty of room')
expect(classes('.panel')).toContain('is-ok')
await click('.btn-inc')
expect(text('.status')).toBe('Almost full')
expect(classes('.panel')).toContain('is-busy')
await click('.btn-inc')
expect(text('.remaining')).toBe('1 spot left')`,
      },
      {
        name: 'lowering the capacity below the count shows Over capacity',
        code: `for (let i = 0; i < 6; i++) await click('.btn-inc')
await type('.capacity', '4')
expect(text('.count')).toBe('6')
expect(text('.status')).toBe('Over capacity')
expect(text('.remaining')).toBe('0 spots left')
find('.btn-inc').disabled = false
await click('.btn-inc')
expect(text('.count')).toBe('6')`,
      },
      {
        name: 'Reset empties the venue',
        code: `await click('.btn-inc')
await click('.btn-inc')
await click('.btn-reset')
expect(text('.count')).toBe('0')
expect(text('.status')).toBe('Empty')`,
      },
      {
        name: 'a blank capacity shows an error, never NaN',
        code: `await type('.capacity', '')
expect(exists('.capacity-error')).toBe(true)
expect(text()).not.toContain('NaN')
await type('.capacity', '15')
expect(exists('.capacity-error')).toBe(false)
expect(text('.remaining')).toBe('15 spots left')`,
      },
      {
        name: 'capacity.js: statusFor() and clamp() follow the rules',
        code: `const { statusFor, clamp } = requireModule('capacity.js')
expect(statusFor(0, 10).key).toBe('empty')
expect(statusFor(5, 10).key).toBe('ok')
expect(statusFor(8, 10).key).toBe('busy')
expect(statusFor(10, 10).key).toBe('full')
expect(statusFor(11, 10).key).toBe('over')
expect(clamp(150, 0, 100)).toBe(100)
expect(clamp(-5, 0, 100)).toBe(0)
expect(clamp(42, 0, 100)).toBe(42)`,
      },
    ],
  },

  steps: [
    {
      title: 'Separate state from derived values',
      body: [
        `
Before writing code, list everything the screen shows and ask one question about each: **"Could I calculate this from something else?"**

| On screen | Calculate it? | So it is… |
|---|---|---|
| people inside | no — only clicks know it | **state** (\`ref\`) |
| capacity | no — the manager types it | **state** (\`ref\`) |
| step size | no — staff choose it | **state** (\`ref\`) |
| spots left | yes: capacity − count | **derived** (\`computed\`) |
| fill bar % | yes: count ÷ capacity | **derived** |
| status + colour | yes: from count and capacity | **derived** |

Three refs, everything else derived. This table *is* the design of the app.
`,
        {
          callout: 'tip',
          title: 'The golden rule',
          text: 'If you store a value that could be calculated, you now have two sources of truth that can disagree. Store the minimum; derive the rest.',
        },
      ],
    },
    {
      title: 'Count with + and − (and guard the floor)',
      body: [
        `
A *ref* is a reactive box: you read and write its contents through \`.value\` in JavaScript, and the template unwraps it for you (see [ref()](lesson:ref)). An *event handler* is a function Vue calls when something happens — here, a click ([v-on](lesson:v-on-events)).

Write \`decrement()\` and attach both handlers. The "never below zero" rule goes **inside the function**, because that is the one place the count can go down.
`,
        {
          code: `function increment() {
  count.value++
}

function decrement() {
  count.value = Math.max(0, count.value - 1)
}`,
          lang: 'js',
          title: 'App.vue — script',
        },
        {
          code: `<button type="button" class="btn-dec" @click="decrement">− 1</button>
<button type="button" class="btn-inc" @click="increment">+ 1</button>`,
          lang: 'vue',
          title: 'App.vue — template',
        },
        `
\`Math.max(0, x)\` returns whichever is larger, so the result can never be negative. Run the tests: "+ and − change the count by one" should now pass.
`,
      ],
    },
    {
      title: 'Add the step size and the capacity with v-model.number',
      body: [
        `
Two new pieces of state, bound to form controls with [v-model](lesson:v-model-forms). The \`.number\` modifier converts the text the browser gives you into a number — important, because \`0 + "5"\` in JavaScript is the *string* \`"05"\`.
`,
        {
          code: `const capacity = ref(20)
const step = ref(1)
const stepOptions = [1, 2, 5]`,
          lang: 'js',
          title: 'App.vue — new state',
        },
        {
          code: `<select v-model.number="step" class="step">
  <option v-for="n in stepOptions" :key="n" :value="n">{{ n }}</option>
</select>

<input v-model.number="capacity" class="capacity" type="number" min="1" />`,
          lang: 'vue',
          title: 'App.vue — settings',
        },
        `
Now use them in the handlers. **+** must stop at the capacity, and must never *lower* the count if the capacity was reduced below it:
`,
        {
          code: `function increment() {
  if (count.value >= capacity.value) return
  count.value = Math.min(count.value + step.value, capacity.value)
}

function decrement() {
  count.value = Math.max(0, count.value - step.value)
}`,
          lang: 'js',
        },
        {
          callout: 'warn',
          title: '.number is not validation',
          text: 'If the input cannot be parsed (for example it is empty), `v-model.number` gives you the original string instead of a number. We deal with that in the next step.',
        },
      ],
    },
    {
      title: 'Derive everything else with computed()',
      body: [
        `
A *computed* value is a formula Vue caches and re-runs only when a ref it reads changes ([computed()](lesson:computed)). First, write the pure rules in \`capacity.js\` — plain functions with no Vue in them:
`,
        {
          code: `export const BUSY_AT = 0.8

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function statusFor(count, capacity) {
  if (count === 0) return { key: 'empty', label: 'Empty' }
  if (count > capacity) return { key: 'over', label: 'Over capacity' }
  if (count === capacity) return { key: 'full', label: 'Full' }
  if (count / capacity >= BUSY_AT) return { key: 'busy', label: 'Almost full' }
  return { key: 'ok', label: 'Plenty of room' }
}`,
          lang: 'js',
          title: 'capacity.js',
        },
        `
The order of the \`if\`s matters: "over" and "full" must be checked before the percentage, or 100% would be reported as "Almost full". Now derive the UI values in \`App.vue\`. Note the guard for an invalid capacity — every other computed uses \`safeCapacity\`, so none of them can ever produce \`NaN\`:
`,
        {
          code: `import { ref, computed } from 'vue'
import { statusFor, clamp } from './capacity.js'

const capacityIsValid = computed(() => Number.isInteger(capacity.value) && capacity.value >= 1)
const safeCapacity = computed(() => (capacityIsValid.value ? capacity.value : 1))

const remaining = computed(() => Math.max(0, safeCapacity.value - count.value))
const spotsLabel = computed(() => (remaining.value === 1 ? '1 spot left' : remaining.value + ' spots left'))
const percentFull = computed(() => clamp(Math.round((count.value / safeCapacity.value) * 100), 0, 100))
const status = computed(() => statusFor(count.value, safeCapacity.value))
const isFull = computed(() => count.value >= safeCapacity.value)
const isEmpty = computed(() => count.value === 0)`,
          lang: 'js',
          title: 'App.vue — derived state',
        },
        `
Switch \`increment()\` to use \`isFull\` and \`safeCapacity\` so the handlers and the screen use exactly the same rules.
`,
      ],
    },
    {
      title: 'Bind the template to the derived values',
      body: [
        `
Replace every hard-coded bit of the template with a binding. \`:class\` adds the status class ([class bindings](lesson:class-style-bindings)), \`:style\` sizes the bar, and \`:disabled\` turns buttons off when an action makes no sense.
`,
        {
          code: `<section class="panel" :class="'is-' + status.key" aria-labelledby="inside-label">
  <p id="inside-label" class="panel__label">People inside</p>
  <p class="count" aria-live="polite">{{ count }}</p>
  <p class="status">{{ status.label }}</p>
  <div class="bar" aria-hidden="true">
    <div class="bar__fill" :style="{ width: percentFull + '%' }"></div>
  </div>
  <p class="remaining">{{ spotsLabel }}</p>
</section>

<button type="button" class="btn-dec" :disabled="isEmpty" @click="decrement">− {{ step }}</button>
<button type="button" class="btn-inc" :disabled="isFull" @click="increment">+ {{ step }}</button>
<button type="button" class="btn-reset" @click="reset">Reset</button>`,
          lang: 'vue',
          title: 'App.vue — template',
        },
        `
Add a tiny \`reset()\` handler (\`count.value = 0\`) and show the capacity error with [v-if](lesson:conditional-rendering):
`,
        {
          code: `<p v-if="!capacityIsValid" id="capacity-help" class="capacity-error" role="alert">
  Enter a whole number of at least 1.
</p>`,
          lang: 'vue',
        },
        {
          callout: 'note',
          title: 'Why keep the guard in the handler if the button is disabled?',
          text: '`disabled` is a convenience for people. The real rule must live in the handler, because handlers can be called from other places too (keyboard shortcuts, tests, future features). The tests deliberately re-enable buttons to check this.',
        },
      ],
    },
    {
      title: 'Polish: accessibility and labels people can read',
      body: [
        `
Small details make the app usable for everyone:

- \`aria-live="polite"\` on \`.count\` makes screen readers announce the new number after each change.
- Buttons whose text is a symbol ("+ 5") get a real label: \`:aria-label="'Add ' + step + (step === 1 ? ' person' : ' people')"\`.
- The bar is decorative (the text already says the same thing), so it is hidden from assistive tech with \`aria-hidden="true"\`.
- \`:aria-invalid\` and \`role="alert"\` tell assistive tech when the capacity is wrong.
- \`:focus-visible\` outlines keep keyboard users oriented.

Run the tests one last time — they should all be green. Then compare your code with the finished solution.
`,
      ],
    },
  ],

  solution: {
    entry: 'App.vue',
    files: { 'App.vue': solutionApp, 'capacity.js': solutionCapacity },
    explanation: `
The whole app is **three refs** (\`count\`, \`capacity\`, \`step\`), **a handful of computed values**, and **three handlers**.

- Every number on screen is either a ref or computed from refs, so the status, colour, bar and "spots left" can never disagree with the count.
- All rules about changing the count live in \`increment()\` / \`decrement()\` — the \`disabled\` bindings are only a convenience.
- \`safeCapacity\` is the single gatekeeper for the user's typed input. Because everything else reads it, an empty box can never leak \`NaN\` into the UI.
- \`capacity.js\` holds the business rules as plain functions. They can be unit-tested without mounting anything (the last test does exactly that) and reused anywhere.

This is a deliberately small, single-component app. In the next project you will split an app into several components that talk through props and events.
`,
  },

  challenges: [
    'Add keyboard shortcuts: with the panel focused (`tabindex="0"`), **ArrowUp** adds and **ArrowDown** removes. Use `@keydown.up.prevent` and `@keydown.down.prevent`.',
    'Add an **Undo** button that restores the previous count (keep a history array — the interview coding question walks through it).',
    'Show a small log of the last five changes ("+2 at 14:03") using `v-for` and `Date` formatting.',
    'Track entries and exits separately (total visitors today vs people inside now) — which of these is state and which is derived?',
    'Make the "almost full" threshold configurable and move it into the settings form.',
  ],

  mistakes: [
    {
      title: 'Storing the status in its own ref',
      wrong: {
        lang: 'js',
        code: `const count = ref(0)
const status = ref('Empty')

function increment() {
  count.value++
  if (count.value >= 16) status.value = 'Almost full'
  // forgot decrement(), reset() and capacity changes…
}`,
      },
      right: { lang: 'js', code: `const status = computed(() => statusFor(count.value, capacity.value))` },
      explanation: 'A stored status must be updated by every function that touches the count *or* the capacity. Miss one and the screen lies. A computed is re-derived automatically whenever its inputs change.',
    },
    {
      title: 'Forgetting `.number` on `v-model`',
      wrong: { lang: 'vue', code: `<select v-model="step">…</select>\n<!-- count.value + step.value → 0 + "5" → "05" -->` },
      right: { lang: 'vue', code: `<select v-model.number="step">…</select>` },
      explanation: 'Form controls always produce strings. `+` with a string concatenates instead of adding. `.number` converts when the text is numeric (or bind numeric `:value`s on the options).',
    },
    {
      title: 'Relying only on `disabled` to enforce a rule',
      wrong: { lang: 'vue', code: `<button :disabled="count === 0" @click="count--">−</button>` },
      right: { lang: 'js', code: `function decrement() {\n  count.value = Math.max(0, count.value - step.value)\n}` },
      explanation: 'The button state is a hint for humans. Any other caller — a shortcut, a test, a future feature — bypasses it. Put the rule in the code that changes the state.',
    },
    {
      title: 'Clamping the count when the capacity drops',
      wrong: { lang: 'js', code: `function increment() {\n  // capacity was lowered to 4 while 6 people are inside…\n  count.value = Math.min(count.value + step.value, capacity.value) // → 4!\n}` },
      right: { lang: 'js', code: `function increment() {\n  if (isFull.value) return\n  count.value = Math.min(count.value + step.value, safeCapacity.value)\n}` },
      explanation: 'Six people do not vanish because a setting changed. Keep the true count, derive an "Over capacity" status, and make + a no-op until people leave.',
    },
    {
      title: 'Writing a static attribute where you meant a binding',
      wrong: { lang: 'vue', code: `<button disabled="isFull">+</button>` },
      right: { lang: 'vue', code: `<button :disabled="isFull">+</button>` },
      explanation: 'Without the colon, `disabled="isFull"` is plain text — and *any* value of the `disabled` attribute disables the button, so it is disabled forever. `:` (short for `v-bind:`) evaluates the expression.',
    },
  ],

  debugging: [
    {
      symptom: 'The count shows "05", "051" or similar after changing the step.',
      cause: 'The step comes from a form control as a string, so `+` concatenates.',
      fix: 'Use `v-model.number` (or numeric `:value` bindings on the options).',
    },
    {
      symptom: '"NaN spots left" appears when the capacity box is cleared.',
      cause: 'An empty number input gives `""`, and maths with it produces `NaN`.',
      fix: 'Validate once in a computed (`safeCapacity`) and make every other computed read the validated value.',
    },
    {
      symptom: 'The status text is right but the colour is wrong (or vice versa).',
      cause: 'They are computed from different sources, or one of them is stored and updated by hand.',
      fix: 'Drive both from the same computed (`status.key` for the class, `status.label` for the text).',
    },
  ],

  quiz: [
    {
      id: 'project-counter-q1',
      type: 'mcq',
      prompt: 'Which of these should be a `computed()` rather than a `ref()` in the door counter?',
      options: [
        { text: 'The number of people inside', why: 'Nothing else can tell you this — only clicks change it, so it is state.' },
        { text: 'The capacity', why: 'The manager types it; it cannot be calculated from anything else.' },
        { text: 'The "Almost full" status' },
        { text: 'The step size', why: 'Staff choose it from the select — it is input, so it is state.' },
      ],
      answer: 2,
      explanation: 'The status can always be calculated from the count and the capacity, so it is derived state — a `computed`.',
    },
    {
      id: 'project-counter-q2',
      type: 'output',
      prompt: 'The step select uses plain `v-model` (no `.number`). The user picks **5** and clicks **+** once. What does `{{ count }}` show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const count = ref(0)
const step = ref(1)
</script>

<template>
  <select v-model="step">
    <option value="1">1</option>
    <option value="5">5</option>
  </select>
  <button @click="count = count + step">+</button>
  <p>{{ count }}</p>
</template>`,
      },
      options: ['5', '05', '1', 'NaN'],
      answer: 1,
      explanation: 'The option values are strings, so `step` becomes `"5"`. `0 + "5"` is string concatenation in JavaScript: `"05"`. `v-model.number` fixes it.',
    },
    {
      id: 'project-counter-q3',
      type: 'bug',
      prompt: 'The **+** button is disabled from the very start, even when the venue is empty. Click the line with the bug.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, computed } from 'vue'
const count = ref(0)
const capacity = ref(20)
const isFull = computed(() => count.value >= capacity.value)
</script>

<template>
  <p>{{ count }}</p>
  <button disabled="isFull" @click="count++">+</button>
</template>`,
      },
      answerLine: 10,
      explanation: 'Without `:`, `disabled="isFull"` is a literal attribute, and any value of `disabled` disables the button. Write `:disabled="isFull"`.',
    },
    {
      id: 'project-counter-q4',
      type: 'fill',
      prompt: 'Complete the derived value so it updates whenever the count or capacity changes.',
      code: { lang: 'js', code: `import { ref, ___ } from 'vue'\n\nconst remaining = computed(() => capacity.value - count.___)` },
      answer: [['computed'], ['value']],
      explanation: 'Import `computed`, and read refs through `.value` inside JavaScript (including inside computed getters).',
    },
    {
      id: 'project-counter-q5',
      type: 'short',
      prompt: 'Why does the solution keep the "not past capacity" check inside `increment()` even though the + button is already disabled when full?',
      answer: 'Disabling the button only stops one way of calling the handler. Rules about state should live where the state changes, so keyboard shortcuts, tests and future features that call `increment()` are protected too. `disabled` is a usability hint, not enforcement.',
    },
  ],

  interview: [
    {
      id: 'project-counter-derived-state',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'In your counter app, why is the status ("Almost full") a `computed` instead of a `ref` you update in the click handlers?',
      answer: 'Because it can be calculated from the count and capacity. Storing it would create a second source of truth that every handler must remember to update; a computed re-derives it automatically and caches the result until its inputs change.',
      explanation: 'State = what cannot be calculated. Derived = everything else. Derived values belong in `computed()`.',
      code: { lang: 'js', code: `const status = computed(() => statusFor(count.value, safeCapacity.value))` },
      whyAsked: 'Checks whether you understand the difference between state and derived state — the root cause of many "the UI is out of sync" bugs.',
      mistakes: ['Saying computed is "just for performance" without mentioning consistency.', 'Suggesting a watcher that copies values into another ref.'],
      followUps: ['When would a watcher be the right tool instead?', 'Is a computed re-run every render?'],
      modelAnswer: 'I keep the minimum state — count, capacity, step — and derive the rest. The status depends only on count and capacity, so it is a computed. If I stored it in a ref, increment, decrement, reset and the capacity input would all need to update it, and missing one would make the screen lie. A computed tracks its dependencies, recalculates only when they change, and caches the result between renders. A watcher copying values into another ref would just reintroduce the duplicate state.',
    },
    {
      id: 'project-counter-plain-const-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate wrote this. The + button never becomes disabled, even at 20 people. Why?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const count = ref(0)
const capacity = ref(20)
const isFull = count.value >= capacity.value
</script>

<template>
  <button :disabled="isFull" @click="count++">+ ({{ count }})</button>
</template>`,
      },
      answer: '`isFull` is a plain boolean calculated **once**, when `<script setup>` runs (it is `false`). It is not reactive, so it never updates. Make it `computed(() => count.value >= capacity.value)`.',
      explanation: '`<script setup>` runs once per component instance. Only refs, reactive objects and computeds update later.',
      whyAsked: 'A very common beginner bug that shows whether you know when setup code runs.',
      mistakes: ['Blaming the `:disabled` binding.', 'Thinking the template re-runs the script on every render.'],
      followUps: ['Would `function isFull() { … }` called in the template work?', 'What is the difference between that and a computed?'],
      modelAnswer: 'The expression runs once when setup executes, so `isFull` is frozen at `false`. Setup is not re-run on re-render — only reactive sources update. Wrapping it in `computed()` makes Vue track `count` and `capacity` and recompute when they change. A method called from the template would also work, but it re-runs on every render instead of being cached.',
    },
    {
      id: 'project-counter-capacity-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Product says: "The manager can lower the capacity at any time, even while people are inside." What should the counter do when the capacity drops below the current count?',
      answer: 'Keep the real count, show an explicit "Over capacity" status, block further increments, and let decrements work normally. Do not clamp the count down — that would erase real people from the data.',
      explanation: 'The count represents reality; the capacity is a rule. When a rule changes, you surface the conflict instead of rewriting reality.',
      whyAsked: 'Tests product thinking and edge-case handling, not just Vue syntax.',
      mistakes: ['Silently clamping the count to the new capacity.', 'Preventing the capacity change entirely without asking product.', 'Letting + reduce the count via `Math.min`.'],
      followUps: ['How would you test this?', 'Would you warn before applying the new capacity?'],
      modelAnswer: 'The count is a fact about the room, so I would never clamp it — six people do not leave because a setting changed. The status is derived, so I add an "over" band in `statusFor` that wins when count exceeds capacity, style it as an alert, and make `increment()` a no-op while full or over. Decrement still works so staff can bring numbers back down. I would cover it with a test that adds six people, lowers capacity to four and checks the count stays six with an "Over capacity" status.',
    },
    {
      id: 'project-counter-pure-module',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 3,
      question: 'Why did you put `statusFor()` and `clamp()` in a separate `capacity.js` instead of writing that logic inside the component?',
      answer: 'They are pure business rules — same input, same output, no Vue, no DOM. In their own module they are easier to read, reuse (another screen, a server, a report) and unit-test without mounting a component. The component focuses on state, events and rendering.',
      explanation: 'Separate "what are the rules?" (plain JS) from "how does the UI react?" (Vue).',
      whyAsked: 'Shows whether you think about testability and separation of concerns even in small apps.',
      mistakes: ['Saying "because files should be short" with no reasoning.', 'Making the helper import Vue refs, which ties it to the UI.'],
      followUps: ['What would you move out next if the app grew?', 'When does a helper become a composable?'],
      modelAnswer: 'I split pure rules from UI wiring. `statusFor` takes numbers and returns a status object, so I can unit-test every band in milliseconds without rendering anything, and reuse it elsewhere. The component keeps the refs, computeds and handlers. If the logic needed reactive state of its own — say a history with undo — I would turn it into a composable that returns refs, which comes later in the course.',
    },
    {
      id: 'project-counter-multi-door',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'The venue now has **three doors**, each with a tablet running this counter. How would the architecture change so everyone sees the same number?',
      answer: 'The count can no longer live in one component\'s ref — each tablet would have its own. A server must own the authoritative count. Tablets send **events** ("+2 at door B") rather than absolute values, the server applies them in order and broadcasts the new total (for example over WebSockets), and each tablet renders the shared value. Inside one app you would also move the count into shared state (a store).',
      explanation: 'Multiple writers need a single owner of the truth. Sending deltas avoids two tablets overwriting each other\'s absolute numbers.',
      whyAsked: 'Distinguishes candidates who can scale a toy into a real system: source of truth, concurrency, real-time sync.',
      mistakes: ['Syncing through `localStorage` (it is per-browser).', 'Sending absolute counts, so the last writer wins and entries are lost.', 'Ignoring offline tablets.'],
      followUps: ['What happens if a tablet goes offline for a minute?', 'Would you show the change optimistically before the server confirms?'],
      modelAnswer: 'Each tablet\'s ref is local, so the truth has to move to a server. I would send increments and decrements as events rather than absolute totals, because two doors writing "12" and "13" at the same time would lose a person. The server applies events in order, enforces the capacity, and pushes the new total to every tablet over a WebSocket. On the client I might apply changes optimistically and reconcile with the server\'s number, queueing events while offline. Inside the app I would hold the shared count in a Pinia store so every component reads one value.',
    },
    {
      id: 'project-counter-coding-undo',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 8,
      question: 'Add an **Undo** button (`.undo`) to this counter. Each click on `.plus` / `.minus` can be undone, newest first. Undo is **disabled** when there is nothing to undo.',
      starter: { files: { 'App.vue': undoStarter } },
      tests: [
        { name: 'Undo starts disabled', code: `expect(find('.undo').disabled).toBe(true)` },
        {
          name: 'undoes the last change',
          code: `await click('.plus')
await click('.plus')
await click('.minus')
expect(text('.count')).toBe('1')
await click('.undo')
expect(text('.count')).toBe('2')`,
        },
        {
          name: 'undoes several changes in reverse order, then disables',
          code: `await click('.plus')
await click('.plus')
await click('.undo')
expect(text('.count')).toBe('1')
await click('.undo')
expect(text('.count')).toBe('0')
expect(find('.undo').disabled).toBe(true)`,
        },
      ],
      hints: ['Keep an array of **previous** counts in a ref.', 'Push the current value before every change; `pop()` it in `undo()`.', 'Derive `canUndo` with `computed(() => history.value.length > 0)` and bind `:disabled="!canUndo"`.'],
      answer: 'Keep a `history` ref holding previous values. Every change pushes the old count first; `undo()` pops the last value back into `count`. A computed `canUndo` drives the disabled state.',
      solution: { files: { 'App.vue': undoSolution } },
      explanation: 'History is genuinely new state (you cannot calculate the past from the present), so it is a ref. Whether undo is possible *can* be calculated, so it is a computed.',
      whyAsked: 'A small, realistic feature that tests state design: what to store, what to derive.',
      mistakes: ['Storing `canUndo` in a ref and forgetting to update it.', 'Pushing the *new* value instead of the previous one.', 'Re-creating the array with spread on every push without reason.'],
      followUps: ['How would you add Redo?', 'How would you cap the history at 50 entries?'],
      modelAnswer: 'History is new state, so I add `history = ref([])`. Before every change I push the current count; undo pops the last entry back into `count`. Whether undo is possible is derived, so `canUndo` is a computed bound to `:disabled`. For redo I would keep a second stack and clear it whenever a new change happens.',
    },
  ],

  takeaways: [
    'Store the minimum state (`count`, `capacity`, `step`) in refs; derive everything else with `computed()`.',
    'Change state only in a few named handlers, and enforce rules there — `disabled` is a hint, not a guard.',
    '`v-model.number` converts numeric text but returns the raw string otherwise: validate once, then derive from the validated value.',
    'Drive classes, styles, `disabled` and ARIA attributes from the same computed values so the UI can never disagree with itself.',
    'Put pure rules in plain `.js` modules — they are easier to test and reuse than logic buried in a component.',
  ],
}
