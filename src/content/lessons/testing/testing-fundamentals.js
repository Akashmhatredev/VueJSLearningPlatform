// Lesson: Testing fundamentals & Vitest.
// Vitest itself can't run inside the sandbox, so real test files are shown as
// static code. The runnable parts are the code under test; the platform's own
// in-browser test harness checks the learner's fixes.

const pricingJs = `// pricing.js — pure functions: same input → same output, no side effects.
// Money is stored in cents (whole numbers) so 0.1 + 0.2 never bites us.

export const FREE_SHIPPING_FROM = 5000 // free shipping on $50.00 or more
export const SHIPPING_FEE = 499

export function subtotal(items) {
  return items
    .map((item) => item.priceCents * item.qty)
    .reduce((sum, line) => sum + line)
}

export function discount(subtotalCents, code) {
  if (code === 'SAVE10') return Math.round(subtotalCents * 0.1)
  if (code === 'FIVEOFF') return 500
  return 0
}

export function shipping(amountCents) {
  return amountCents > FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE
}

export function formatPrice(cents) {
  return '$' + (cents / 100).toFixed(2)
}`

const cartApp = `<script setup>
import { ref, computed } from 'vue'
import { subtotal, discount, shipping, formatPrice } from './pricing.js'

const items = ref([
  { id: 1, name: 'Coffee beans', priceCents: 1299, qty: 2 },
  { id: 2, name: 'Ceramic mug', priceCents: 1850, qty: 1 },
])
const code = ref('')

const sub = computed(() => subtotal(items.value))
const off = computed(() => discount(sub.value, code.value))
const ship = computed(() => shipping(sub.value - off.value))
const total = computed(() => sub.value - off.value + ship.value)

function remove(id) {
  items.value = items.value.filter((item) => item.id !== id)
}
</script>

<template>
  <h2>Your cart</h2>
  <ul>
    <li v-for="item in items" :key="item.id" class="line">
      {{ item.qty }} × {{ item.name }} — {{ formatPrice(item.priceCents * item.qty) }}
      <button class="remove" @click="remove(item.id)">Remove</button>
    </li>
  </ul>
  <label>Discount code <input v-model.trim="code" class="code" placeholder="SAVE10 or FIVEOFF" /></label>
  <dl>
    <dt>Subtotal</dt><dd class="subtotal">{{ formatPrice(sub) }}</dd>
    <dt>Discount</dt><dd class="discount">−{{ formatPrice(off) }}</dd>
    <dt>Shipping</dt><dd class="shipping">{{ formatPrice(ship) }}</dd>
    <dt>Total</dt><dd class="total">{{ formatPrice(total) }}</dd>
  </dl>
</template>`

const pricingTest = `import { describe, it, expect } from 'vitest'
import { subtotal, shipping } from './pricing.js'

describe('subtotal', () => {
  it('adds price × quantity for every line', () => {
    // Arrange
    const items = [
      { priceCents: 1299, qty: 2 },
      { priceCents: 1850, qty: 1 },
    ]
    // Act
    const result = subtotal(items)
    // Assert
    expect(result).toBe(4448)
  })

  it('is 0 for an empty cart', () => {
    expect(subtotal([])).toBe(0)
  })
})

describe('shipping', () => {
  it.each([
    [4999, 499],
    [5000, 0],
    [7500, 0],
  ])('shipping(%i) is %i', (amount, expected) => {
    expect(shipping(amount)).toBe(expected)
  })
})`

const passwordStarterApp = `<script setup>
import { ref } from 'vue'

const password = ref('')
const problems = ref([])
const checked = ref(false)

// All the rules live inside this click handler. To test them you would have
// to render the component, type into the input and click — for every case.
function check() {
  const found = []
  if (password.value.length < 8) found.push('At least 8 characters')
  if (!/\\d/.test(password.value)) found.push('At least one number')
  if (!/[A-Z]/.test(password.value)) found.push('At least one capital letter')
  problems.value = found
  checked.value = true
}
</script>

<template>
  <label>Password <input v-model="password" class="password" type="password" /></label>
  <button class="check" @click="check">Check</button>
  <ul v-if="problems.length">
    <li v-for="p in problems" :key="p" class="problem">{{ p }}</li>
  </ul>
  <p v-else-if="checked" class="ok">Strong enough ✓</p>
</template>`

const passwordSolutionApp = `<script setup>
import { ref } from 'vue'
import { checkPassword, messages } from './passwordRules.js'

const password = ref('')
const failed = ref([])
const checked = ref(false)

// The component only wires input → rules → output. The rules are tested on their own.
function check() {
  failed.value = checkPassword(password.value)
  checked.value = true
}
</script>

<template>
  <label>Password <input v-model="password" class="password" type="password" /></label>
  <button class="check" @click="check">Check</button>
  <ul v-if="failed.length">
    <li v-for="id in failed" :key="id" class="problem">{{ messages[id] }}</li>
  </ul>
  <p v-else-if="checked" class="ok">Strong enough ✓</p>
</template>`

const passwordMessages = `export const messages = {
  length: 'At least 8 characters',
  number: 'At least one number',
  upper: 'At least one capital letter',
}`

const podcastApp = `<script setup>
import { formatDuration } from './formatDuration.js'

const episodes = [
  { id: 1, title: 'Why tests make you faster', seconds: 3725 },
  { id: 2, title: 'Mocking without tears', seconds: 1508 },
  { id: 3, title: 'Quick tip: it.each', seconds: 45 },
]
</script>

<template>
  <h2>Episodes</h2>
  <ul>
    <li v-for="ep in episodes" :key="ep.id" class="episode">
      {{ ep.title }} <span class="duration">{{ formatDuration(ep.seconds) }}</span>
    </li>
  </ul>
</template>`

const slugApp = `<script setup>
import { ref, computed } from 'vue'
import { slugify } from './slugify.js'

const title = ref('Learn Vue in 30 days')
const slug = computed(() => slugify(title.value))
</script>

<template>
  <input v-model="title" class="title" />
  <p>URL: /blog/<span class="slug">{{ slug }}</span></p>
</template>`

export default {
  id: 'testing-fundamentals',
  title: 'Testing fundamentals & Vitest',
  summary: 'Learn what an automated test is, which kinds exist, and how to write and run your first unit tests with Vitest.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['es-modules', 'array-methods', 'computed'],
  related: ['component-testing', 'testing-logic', 'testing-async-routing', 'e2e-and-quality', 'composable-design'],
  tags: ['testing', 'vitest', 'unit test', 'test pyramid', 'arrange act assert', 'tdd', 'expect', 'pure functions'],
  apis: [
    { name: 'describe(name, fn)', summary: 'Vitest: groups related tests under a heading.' },
    { name: 'it(name, fn) / test(name, fn)', summary: 'Vitest: defines one test case. `it` and `test` are aliases.' },
    { name: 'expect(value)', summary: 'Vitest: starts an assertion, e.g. `expect(x).toBe(3)`; a failed matcher throws and fails the test.' },
    { name: 'it.each(table)', summary: 'Vitest: runs the same test body for each row of inputs.' },
    { name: 'vi.fn()', summary: 'Vitest: creates a mock function that records how it was called.' },
  ],
  docs: [
    { label: 'Vue Guide — Testing', url: 'https://vuejs.org/guide/scaling-up/testing.html' },
    { label: 'Vitest — Getting Started', url: 'https://vitest.dev/guide/' },
    { label: 'Vitest — expect API', url: 'https://vitest.dev/api/expect.html' },
    { label: 'Vitest — Test API (describe, it, each)', url: 'https://vitest.dev/api/' },
  ],

  intro: `
A **test** is a small program that checks another program. It runs your code with a known input and compares what comes out with what you expected. If they match, the test *passes*; if not, it *fails* and tells you exactly where.

Instead of clicking through your app after every change ("does the total still add up? does an empty cart still work?"), you write those checks down once as code. A **test runner** — in the Vue world that's usually **Vitest** — runs hundreds of them in a few seconds, every time you save.
`,

  why: `
Every change can break something you weren't looking at. You fix the free-shipping rule and accidentally break discounts. You don't notice, because you only clicked through the part you changed. Your users notice.

Manual checking doesn't scale: the list of "things to try" grows with every feature, and nobody re-checks all of it on every change. Automated tests do:

- **They catch regressions** — a *regression* is something that used to work and now doesn't.
- **They let you change code without fear.** Refactoring (restructuring code without changing what it does) is safe when tests tell you behaviour stayed the same.
- **They document behaviour.** \`it('gives free shipping from $50.00')\` is a spec that can't go out of date — if it did, it would fail.
- **They make bugs cheaper.** A failing test on your laptop costs seconds. The same bug found in production costs support tickets, hot-fixes and trust.

Tests aren't free: they take time to write and maintain, and badly written ones break whenever you touch anything. This lesson is about writing the useful kind.
`,

  eli15: `
Imagine you build a calculator app. To check it works, you type \`2 + 2\` and look for \`4\`. Then \`10 / 4\` and look for \`2.5\`. That's testing — you just did it by hand.

Now imagine writing those checks down so the computer does them:

"Run \`add(2, 2)\`. **Expect** the answer **to be** 4."

That sentence is almost exactly what a Vitest test looks like: \`expect(add(2, 2)).toBe(4)\`.

The computer never gets bored, never forgets a check, and does all of them in a blink. So every time you change your calculator, you press one button and know within seconds whether you broke something.
`,

  analogy: {
    title: 'The pilot\'s pre-flight checklist',
    body: `
Before every flight, pilots run the same checklist: flaps move, fuel is full, lights work. They don't skip it because "it worked yesterday" — small things break between flights.

Automated tests are your app's pre-flight checklist. Each item is precise ("with 2 bags of coffee and a mug, the subtotal is $44.48"), gets checked every single time, and a failed item stops the plane *before* take-off, not mid-air.

There are checklists at different levels, too: a mechanic checks one part on the bench (a **unit test**), engineers check that systems work together (an **integration test**), and a test pilot flies the whole plane (an **end-to-end test**).
`,
    mapping: [
      ['one checklist item', 'one test case: `it(\'…\', () => { … })`'],
      ['"flaps should move 30°"', 'an assertion: `expect(flaps).toBe(30)`'],
      ['running the whole checklist', 'running the test suite: `npx vitest`'],
      ['checking one part on the bench', 'a unit test of one function'],
      ['a full test flight', 'an end-to-end test in a real browser'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The test pyramid',
    caption: 'Lower layers are fast, cheap and pinpoint the broken line; higher layers are slower but prove more of the real app works. Most suites have many small tests and a few big ones.',
    alt: 'A pyramid of four stacked boxes. At the base, static checks (linting, TypeScript). Above it, many unit tests of single functions or composables. Above that, component and integration tests that combine components with their children, store and router. At the top, a few end-to-end tests that drive the real app in a browser. A label on the lower left says fast, cheap, precise; a label on the upper right says slow, costly, realistic.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'e2e', label: 'E2E tests', note: 'real browser, real app — a few', tone: 'red', x: 380, y: 50 },
        { id: 'component', label: 'Component & integration tests', note: 'components + children, store, router', tone: 'cobalt', x: 380, y: 130 },
        { id: 'unit', label: 'Unit tests', note: 'one function or composable — many', tone: 'acid', x: 380, y: 210 },
        { id: 'static', label: 'Static checks', note: 'linting, TypeScript', tone: 'paper', x: 380, y: 285 },
        { id: 'fast', label: 'Fast · cheap · precise', note: 'run on every save', tone: 'kraft', x: 110, y: 230 },
        { id: 'real', label: 'Slow · costly · realistic', note: 'run before merge / deploy', tone: 'kraft', x: 650, y: 60 },
      ],
      edges: [
        { from: 'static', to: 'unit', label: 'more real parts' },
        { from: 'unit', to: 'component', label: 'more real parts' },
        { from: 'component', to: 'e2e', label: 'more real parts' },
        { from: 'fast', to: 'unit', dashed: true },
        { from: 'real', to: 'e2e', dashed: true },
      ],
      steps: [
        { focus: ['static'], text: '**Static checks** run without executing your code: a linter flags suspicious patterns and TypeScript catches type mistakes as you type. Not "tests", but the cheapest safety net.' },
        { focus: ['unit', 'fast'], edges: ['static->unit', 'fast->unit'], text: '**Unit tests** check one small piece — a function like `subtotal()` or a composable — in isolation. Milliseconds each, and when one fails you know exactly which function broke.' },
        { focus: ['component'], edges: ['unit->component'], text: '**Component and integration tests** render a component (often with its children, a store or a router) and interact with it like a user would: click, type, read the text. They catch mistakes in how pieces fit together.' },
        { focus: ['e2e', 'real'], edges: ['component->e2e', 'real->e2e'], text: '**End-to-end (E2E) tests** start the real app in a real browser and walk through a user journey: sign in, add to cart, check out. The most realistic — and the slowest and most fragile. Keep a few for your critical paths.' },
        { focus: ['unit', 'component', 'e2e'], text: 'The pyramid is a **heuristic**, not a law. Another popular picture, the *testing trophy*, puts the biggest layer at integration tests, because they give a lot of confidence per test. Both agree on the essentials: cheap tests for logic, a handful of expensive ones for the critical flows.' },
      ],
    },
  },

  syntax: [
    `
#### Anatomy of a test

A test file is a normal JavaScript module that imports the code it checks. By convention it sits next to that code and ends in \`.test.js\` (or \`.spec.js\`), which is how Vitest finds it.
`,
    {
      code: `import { describe, it, expect } from 'vitest'
import { subtotal } from './pricing.js'

describe('subtotal', () => {                // a group of related tests
  it('adds price × quantity', () => {        // one test case, named like a sentence
    const items = [{ priceCents: 1299, qty: 2 }]   // Arrange: set up the input
    const result = subtotal(items)                 // Act: run the code
    expect(result).toBe(2598)                      // Assert: compare with what you expect
  })
})`,
      lang: 'js',
      title: 'pricing.test.js',
      static: true,
    },
    `
Every good test follows the same three beats, called **Arrange–Act–Assert**: set up the situation, do the one thing you're testing, check the result. If you can't name the "act" in one phrase, the test is probably checking too much.

#### The matchers you'll use daily

An **assertion** is a statement that must be true; a **matcher** is the method that checks it.
`,
    {
      code: `expect(2 + 2).toBe(4)                     // same value (Object.is) — numbers, strings, booleans
expect({ qty: 2 }).toEqual({ qty: 2 })    // same contents — objects and arrays
expect(['a', 'b']).toContain('b')         // array includes / string includes
expect('Total: $44.48').toMatch(/44\\.48/) // regex
expect(user).toBeNull()                   // also toBeUndefined, toBeDefined, toBeTruthy
expect(0.1 + 0.2).toBeCloseTo(0.3)        // floating point with tolerance
expect(() => parse('')).toThrow()         // the function throws
expect(total).not.toBe(0)                 // .not flips any matcher`,
      lang: 'js',
      title: 'common matchers',
      static: true,
    },
    `
#### Setting up Vitest

**Vitest** is a test runner built on top of Vite. It reuses your \`vite.config.js\` (plugins, aliases), understands ES modules out of the box, and offers an API that is largely compatible with Jest's. New projects created with \`npm create vue@latest\` can include it for you; otherwise:
`,
    {
      code: `npm install -D vitest
# for tests that need a DOM (components): a simulated browser environment
npm install -D jsdom`,
      lang: 'bash',
      title: 'install',
      static: true,
    },
    {
      code: `// vite.config.js
import { defineConfig } from 'vitest/config' // like Vite's defineConfig, plus the "test" key
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom', // default is 'node' (no document/window)
  },
})

// package.json
// "scripts": { "test": "vitest", "test:run": "vitest run" }`,
      lang: 'js',
      title: 'configure',
      static: true,
    },
    `
\`npm test\` starts Vitest in **watch mode** when run in a terminal: it re-runs only the tests affected by the file you just saved. \`vitest run\` runs everything once and exits — that's what CI (the server that checks every pull request) uses.

A failing test prints what it expected, what it got, and where:
`,
    {
      code: ` FAIL  src/pricing.test.js > subtotal > adds price × quantity for every line
AssertionError: expected 5000 to be 4448 // Object.is equality

 ❯ src/pricing.test.js:14:20

 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)`,
      lang: 'text',
      title: 'roughly what a failure looks like',
      static: true,
    },
    {
      callout: 'note',
      title: 'About the tests on this platform',
      text: 'The sandbox can\'t run Vitest, so the green/red checks in playgrounds and exercises come from this platform\'s own small **in-browser test harness**. Its `expect(x).toBe(y)` mirrors a subset of Vitest\'s matchers, and `requireModule(\'pricing.js\')` plays the role of `import { … } from \'./pricing.js\'`. It is a teaching harness, not Vitest: real test files look like the static examples in this lesson.',
    },
  ],

  walkthrough: {
    title: 'pricing.test.js',
    lang: 'js',
    code: pricingTest,
    intro: 'A real Vitest file for the playground\'s pricing module. Step through it — then use the playground to fix the bugs these tests (and the harness) catch.',
    steps: [
      { lines: [1, 2], text: 'Import the test API from `vitest` and the code under test from its module. (With `test: { globals: true }` in the config you can skip the first import, but explicit imports are clearer.)' },
      { lines: [4, 4], text: '`describe` groups tests and prefixes their names in the report: "subtotal › adds price × quantity for every line".' },
      { lines: [5, 15], text: 'One test, in three beats. **Arrange** the cart, **Act** by calling `subtotal`, **Assert** the expected number of cents. The name reads like a sentence about behaviour, not about how the function works inside.' },
      { lines: [17, 19], text: 'Edge cases deserve their own tests. An empty cart is the kind of input nobody clicks through by hand — and exactly where `reduce()` without a starting value throws.' },
      { lines: [22, 30], text: '`it.each` runs one test body for every row of a table. Boundaries are where bugs hide: $49.99, *exactly* $50.00, and well above. `%i` prints each integer into the test name.' },
    ],
  },

  playground: {
    title: 'Cart pricing under test',
    objective: 'Fix three bugs in pure pricing functions — each one is caught by a test the way a Vitest suite would catch it.',
    files: { 'App.vue': cartApp, 'pricing.js': pricingJs },
    expected: 'A cart with 2 bags of coffee and a mug: subtotal **$44.48**, shipping **$4.99**. Type `SAVE10` or `FIVEOFF` to see the discount. It looks fine — but each experiment below has a test that proves a rule is broken. Read the test, fix `pricing.js`, run it.',
    experiments: [
      {
        id: 'free-shipping-boundary',
        task: 'The rule is "free shipping on orders of **$50.00 or more**". The test calls `shipping(5000)` and expects `0`. Fix `shipping()` in **pricing.js**.',
        hint: 'Compare the code with the sentence "or more". Which operator means "greater than **or equal**"?',
        tests: [
          {
            name: 'shipping is free at exactly $50.00, charged just below',
            code: `const { shipping } = requireModule('pricing.js')
expect(shipping(5000)).toBe(0)
expect(shipping(4999)).toBe(499)
expect(shipping(12000)).toBe(0)`,
          },
        ],
        explain: 'An off-by-one at a boundary — `>` where the rule says `>=`. Clicking around would almost never land on *exactly* $50.00, but a test that checks the boundary on purpose finds it instantly. Always test just below, exactly at, and above a threshold.',
      },
      {
        id: 'empty-cart',
        task: 'Click **Remove** on both items. The prices disappear and the console shows `TypeError: Reduce of empty array with no initial value`. The test expects `subtotal([])` to be `0`. Fix `subtotal()`.',
        hint: '`reduce` without a starting value uses the first element as the start — and an empty array has no first element. Pass `0` as the second argument to `reduce`.',
        tests: [
          {
            name: 'an empty cart has a subtotal of 0',
            code: `const { subtotal } = requireModule('pricing.js')
expect(subtotal([])).toBe(0)
expect(subtotal([{ priceCents: 1299, qty: 2 }, { priceCents: 1850, qty: 1 }])).toBe(4448)`,
          },
        ],
        explain: '`.reduce((sum, line) => sum + line, 0)` starts from 0, so an empty list returns 0 instead of throwing. Empty inputs are one of the most common bugs that unit tests catch: they\'re easy to forget and trivial to test.',
      },
      {
        id: 'discount-cap',
        task: 'With a tiny order, `FIVEOFF` takes off more than the order is worth and the total goes negative. The test expects `discount(300, \'FIVEOFF\')` to be `300` — a discount can never exceed the subtotal. Fix `discount()`.',
        hint: '`Math.min(500, subtotalCents)` picks whichever is smaller.',
        tests: [
          {
            name: 'FIVEOFF never takes off more than the subtotal',
            code: `const { discount } = requireModule('pricing.js')
expect(discount(300, 'FIVEOFF')).toBe(300)
expect(discount(4448, 'FIVEOFF')).toBe(500)
expect(discount(4448, 'SAVE10')).toBe(445)
expect(discount(4448, 'NOPE')).toBe(0)`,
          },
        ],
        explain: 'The test also re-checks the cases that already worked (SAVE10, unknown codes). That\'s the point of a suite: when you fix one rule, the other assertions prove you didn\'t break its neighbours.',
      },
      {
        id: 'spec-question',
        task: 'Remove every item again. The total now says **$4.99** — shipping on an empty cart. Is that a bug? Write down (in a comment) the test you would add, and the question you would ask your product owner first.',
        hint: 'A test needs an *expected* value. Who decides what it is?',
        explain: 'Writing tests forces you to decide what the code *should* do in situations nobody specified. Often the most valuable output of testing is the question "what should happen here?", asked before users find out.',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Checking by hand vs checking with a test',
    caption: 'The same check, done two ways. Only one of them happens on every change.',
    alt: 'Side by side: on the left a manual checklist of steps (start the dev server, add items, type a code, look at the total, remove everything, repeat after every change); on the right a short Vitest test file that performs the same checks automatically.',
    props: {
      left: {
        label: 'Manual check',
        lang: 'text',
        code: `1. npm run dev, open the browser
2. Add 2 × Coffee beans and 1 mug
3. Type FIVEOFF in the code box
4. Look: is the total $44.47?
5. Remove everything — does it crash?
6. Repeat steps 1–5 after every change…`,
      },
      right: {
        label: 'Automated test (Vitest)',
        lang: 'js',
        code: `it('applies FIVEOFF', () => {
  const sub = subtotal(cart)          // 4448
  const off = discount(sub, 'FIVEOFF')
  expect(sub - off + shipping(sub - off)).toBe(4447)
})

it('handles an empty cart', () => {
  expect(subtotal([])).toBe(0)
})`,
      },
      points: [
        'The test runs in milliseconds, on every save and on every pull request.',
        'It checks the exact number, not "looks about right".',
        'It never forgets step 5 on a Friday afternoon.',
        'Writing it took a minute once; the manual check costs minutes forever.',
        'Manual exploring still matters — it finds the cases you didn\'t think to write down.',
      ],
    },
  },

  internals: {
    beginner: `
Vitest looks for files whose names end in \`.test.js\` or \`.spec.js\`, runs each one, and keeps score. Inside a test, \`expect(...).toBe(...)\` is just a function: if the values match it does nothing, if they don't it **throws an error**. Vitest catches that error, marks the test as failed and prints the message. A test passes simply by finishing without throwing.
`,
    technical: [
      `
**Collection, then execution.** Vitest finds test files (by default anything matching \`**/*.{test,spec}.?(c|m)[jt]s?(x)\`), transforms them with the same Vite pipeline your app uses (so \`.vue\` files, aliases and plugins work), and runs files in parallel workers. Running a file first *collects* the \`describe\`/\`it\` calls into a tree, then executes each test function — awaiting it if it returns a promise.

**Isolation.** By default each test **file** runs in its own isolated module environment, so module-level state doesn't leak between files. Tests *inside* one file share that module state — which is why \`beforeEach\` exists to reset it.

**Environments.** The default environment is \`node\`: no \`window\`, no \`document\`. \`environment: 'jsdom'\` (or \`'happy-dom'\`) installs a simulated DOM written in JavaScript, so components can be mounted without a browser. It's fast, but it doesn't do layout or real rendering — that's what browser-based and E2E tests are for.
`,
      {
        code: `// What an assertion boils down to (simplified, not Vitest's source)
function expect(actual) {
  return {
    toBe(expected) {
      if (!Object.is(actual, expected)) {
        throw new AssertionError(\`expected \${actual} to be \${expected}\`)
      }
    },
  }
}

// And a test runner, at its core:
for (const test of collectedTests) {
  try {
    await test.fn()          // async tests are awaited
    report.pass(test.name)
  } catch (error) {
    report.fail(test.name, error)
  }
}`,
        lang: 'js',
        title: 'mental model of a runner',
        static: true,
      },
      `
**Watch mode** uses Vite's module graph: when you save \`pricing.js\`, Vitest knows which test files import it (directly or indirectly) and re-runs only those.

**Why pure functions are the easiest to test:** a *pure function* returns a result based only on its arguments and changes nothing outside itself. No DOM to build, no network to fake, no clock to control — just input → output. That's why moving logic out of components into plain functions (as in exercise 1) makes it dramatically easier to test.
`,
    ],
    production: `
- **Run the suite in CI** on every pull request with \`vitest run\`; block merging on failures. Tests that only run on one laptop protect nobody.
- **Test behaviour, not implementation.** Assert on outputs and visible results, not on which private helper was called. Implementation-coupled tests break on every refactor and teach the team to ignore red builds.
- **Keep tests deterministic.** Control time (\`vi.useFakeTimers()\`, \`vi.setSystemTime()\`), randomness and network. A test that fails "sometimes" (a *flaky* test) is worse than no test — it trains people to re-run instead of investigate.
- **Name tests as specs**: "applies SAVE10 as 10% off, rounded to the nearest cent". The report then reads like documentation.
- **Red–green–refactor** (the core loop of *test-driven development*, TDD): write a failing test for the next small behaviour, make it pass with the simplest code, then clean up with the test as a safety net. You don't have to do TDD everywhere, but it's excellent for bug fixes: reproduce the bug in a test first, then fix it, and it can never silently return.
- **Coverage** (which lines ran during tests) is a useful map of untested areas, not a quality score — see [E2E tests, accessibility checks & healthy suites](lesson:e2e-and-quality).
`,
  },

  mistakes: [
    {
      title: 'A test with no assertion',
      wrong: { code: `it('calculates the total', () => {\n  const result = total(cart)\n  expect(result) // no matcher — checks nothing, always passes\n})`, lang: 'js' },
      right: { code: `it('calculates the total', () => {\n  expect(total(cart)).toBe(4947)\n})`, lang: 'js' },
      explanation: '`expect(x)` on its own does nothing; only a matcher like `.toBe()` can throw. A test that can\'t fail is worse than none, because it gives false confidence. Make each new test fail once on purpose (break the code or the expected value) to prove it can.',
    },
    {
      title: 'Using toBe for objects and arrays',
      wrong: { code: `expect(applyCoupon(cart)).toBe({ total: 4000 }) // fails: different objects`, lang: 'js' },
      right: { code: `expect(applyCoupon(cart)).toEqual({ total: 4000 }) // compares contents`, lang: 'js' },
      explanation: '`toBe` uses `Object.is`, i.e. "the very same thing". Two objects with the same contents are still two different objects. Use `toEqual` (or `toStrictEqual`, which also checks `undefined` properties and classes) for structures.',
    },
    {
      title: 'Testing how the code works instead of what it does',
      wrong: { code: `it('uses the helper', () => {\n  const spy = vi.spyOn(utils, 'sumLines')\n  subtotal(cart)\n  expect(spy).toHaveBeenCalledTimes(1) // breaks if you inline the helper\n})`, lang: 'js' },
      right: { code: `it('adds every line', () => {\n  expect(subtotal(cart)).toBe(4448) // survives any refactor that keeps behaviour\n})`, lang: 'js' },
      explanation: 'Tests should describe behaviour a user or caller relies on. If a refactor that changes nothing visible makes tests fail, those tests were testing implementation details.',
    },
    {
      title: 'Tests that depend on each other',
      wrong: { code: `const cart = []\nit('adds an item', () => {\n  addItem(cart, coffee)\n  expect(cart).toHaveLength(1)\n})\nit('removes an item', () => {\n  removeItem(cart, coffee.id) // only works if the previous test ran first\n  expect(cart).toHaveLength(0)\n})`, lang: 'js' },
      right: { code: `let cart\nbeforeEach(() => { cart = [] })\nit('removes an item', () => {\n  addItem(cart, coffee)\n  removeItem(cart, coffee.id)\n  expect(cart).toHaveLength(0)\n})`, lang: 'js' },
      explanation: 'Each test must set up everything it needs. Shared mutable state makes tests pass or fail depending on order — and `it.only` or a re-ordered file suddenly breaks them.',
    },
    {
      title: 'Doing money in floating-point dollars',
      wrong: { code: `expect(0.1 + 0.2).toBe(0.3) // fails: 0.30000000000000004`, lang: 'js' },
      right: { code: `expect(10 + 20).toBe(30)               // work in cents\nexpect(0.1 + 0.2).toBeCloseTo(0.3)     // or compare with a tolerance`, lang: 'js' },
      explanation: 'Binary floating point can\'t represent most decimal fractions exactly. Store money as integer cents (as `pricing.js` does) and only format to dollars for display.',
    },
  ],

  debugging: [
    {
      symptom: '`No test files found, exiting with code 1`.',
      cause: 'The file name doesn\'t match Vitest\'s include pattern (e.g. `pricing-tests.js`), or `test.include` in the config points elsewhere.',
      fix: 'Name it `pricing.test.js` / `pricing.spec.js`, or adjust `test.include`.',
    },
    {
      symptom: '`ReferenceError: document is not defined` (or `window is not defined`).',
      cause: 'The test environment is the default `node`, which has no DOM.',
      fix: 'Set `test: { environment: \'jsdom\' }` (and install `jsdom`), or add `// @vitest-environment jsdom` at the top of that one file.',
    },
    {
      symptom: '`ReferenceError: describe is not defined`.',
      cause: 'Vitest doesn\'t inject globals by default.',
      fix: 'Import them: `import { describe, it, expect } from \'vitest\'`, or enable `test: { globals: true }`.',
    },
    {
      symptom: 'A test passes when run alone (`it.only`) but fails in the full run — or the other way round.',
      cause: 'Tests share state: a module-level variable, a mock that wasn\'t reset, `localStorage`, or a fake timer left on.',
      fix: 'Reset in `beforeEach`/`afterEach` (`vi.restoreAllMocks()`, `vi.useRealTimers()`, `localStorage.clear()`), and create fresh data inside each test.',
    },
    {
      symptom: 'A test is green even though you deliberately broke the code.',
      cause: 'Missing matcher, an assertion inside a callback that never runs, or an async assertion that isn\'t awaited.',
      fix: 'Add the matcher, `await` async work (`await expect(p).rejects.toThrow()`), and consider `expect.assertions(n)` to require that n assertions ran.',
    },
  ],

  bestPractices: [
    'Name tests as sentences about behaviour: "gives free shipping from $50.00".',
    'One behaviour per test, structured as Arrange–Act–Assert.',
    'Test boundaries and edge cases on purpose: empty, zero, one, exactly-at-the-limit, invalid input.',
    'Move business rules out of components into pure functions — they become trivial to test.',
    'See every new test fail once before trusting it.',
    'Keep tests independent: fresh data per test, reset mocks and timers in `afterEach`.',
    'When fixing a bug, first write a test that reproduces it.',
    'Run the whole suite in CI and keep it green; fix or delete flaky tests quickly.',
  ],

  useCases: [
    'Pricing, tax and discount rules in a shop.',
    'Validation rules (passwords, emails, form fields) shared by several forms.',
    'Formatting helpers: dates, durations, currencies, slugs.',
    'Reproducing a bug report as a failing test before fixing it.',
    'Refactoring a messy module with confidence that behaviour is unchanged.',
  ],

  whenToUse: {
    use: [
      'Unit tests for any logic with rules, branches or edge cases — especially pure functions.',
      'Tests for code that is changed often or by many people.',
      'A regression test for every bug you fix.',
    ],
    avoid: [
      'Testing the framework itself (that `v-if` hides things, that `ref` is reactive) — Vue already tests that.',
      'Asserting on private internals or exact markup that changes with every design tweak.',
      'Chasing 100% coverage with tests that execute lines but assert nothing meaningful.',
    ],
  },

  comparison: {
    title: 'Kinds of automated tests',
    headers: ['', 'Unit', 'Component', 'Integration', 'End-to-end'],
    rows: [
      ['What it checks', 'one function / composable', 'one component\'s rendered output and events', 'several pieces together (components + store + router)', 'a full user journey in the real app'],
      ['What is real', 'just that code', 'the component (children real or stubbed)', 'most of the frontend; network usually mocked', 'everything: browser, app, often a test backend'],
      ['Typical tools', 'Vitest', 'Vitest + Vue Test Utils', 'Vitest + Vue Test Utils', 'Playwright, Cypress'],
      ['Speed', 'milliseconds', 'milliseconds to tens of ms', 'tens to hundreds of ms', 'seconds per test'],
      ['When it fails, you know…', 'exactly which function', 'which component', 'which feature', 'that a journey is broken somewhere'],
    ],
    note: 'Next: [Component tests with Vue Test Utils](lesson:component-testing) and [E2E tests](lesson:e2e-and-quality).',
  },

  quiz: [
    {
      id: 'testing-fundamentals-q1',
      type: 'mcq',
      prompt: 'What makes a Vitest test **fail**?',
      options: [
        { text: 'The test function throws (for example, a matcher like `toBe` finds a mismatch) or returns a promise that rejects.' },
        { text: 'The test function returns `false`.', why: 'Return values are ignored (except promises, which are awaited). Only a thrown error or rejected promise fails a test.' },
        { text: 'The test takes longer than one second.', why: 'There is a timeout (5 seconds by default in Vitest), but that\'s not the main mechanism — assertions fail by throwing.' },
        { text: '`console.log` prints something.', why: 'Logging is allowed and doesn\'t affect the result.' },
      ],
      answer: 0,
      explanation: 'A test passes by finishing without an error. Matchers throw an `AssertionError` on mismatch, which the runner catches and reports.',
    },
    {
      id: 'testing-fundamentals-q2',
      type: 'output',
      prompt: 'Which assertion **fails**?',
      code: {
        lang: 'js',
        code: `const line = { name: 'Mug', qty: 1 }

expect(line).toBe(line)                        // A
expect(line).toEqual({ name: 'Mug', qty: 1 })  // B
expect(line).toBe({ name: 'Mug', qty: 1 })     // C
expect([1, 2]).toEqual([1, 2])                 // D`,
      },
      options: ['A', 'B', 'C', 'D'],
      answer: 2,
      explanation: '`toBe` uses `Object.is`: C compares two *different* objects that happen to have the same contents, so it fails. A is the same object; B and D compare contents with `toEqual`.',
    },
    {
      id: 'testing-fundamentals-q3',
      type: 'bug',
      prompt: 'This test stays green even when `total()` returns nonsense. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `import { it, expect } from 'vitest'
import { total } from './pricing.js'

it('adds shipping below $50', () => {
  const cart = [{ priceCents: 1000, qty: 1 }]
  const result = total(cart)
  expect(result)
})`,
      },
      answerLine: 7,
      explanation: '`expect(result)` creates an assertion object but never calls a matcher, so nothing can throw. It should be `expect(result).toBe(1499)`.',
    },
    {
      id: 'testing-fundamentals-q4',
      type: 'fill',
      prompt: 'Complete the test: group it, define the case, and compare an **array\'s contents**.',
      code: {
        lang: 'js',
        code: `___('checkPassword', () => {
  ___('lists every failed rule', () => {
    expect(checkPassword('abc')).___(['length', 'number', 'upper'])
  })
})`,
      },
      answer: [['describe'], ['it', 'test'], ['toEqual', 'toStrictEqual']],
      explanation: '`describe` groups, `it` (alias `test`) defines a case, and arrays need `toEqual` because `toBe` would compare identity.',
    },
    {
      id: 'testing-fundamentals-q5',
      type: 'mcq',
      prompt: 'You want to check that "a signed-in user can search for a product, add it to the cart and pay". Which kind of test fits best?',
      options: [
        { text: 'A unit test of `subtotal()`', why: 'That only checks one function; it says nothing about signing in, searching or paying working together.' },
        { text: 'An end-to-end test in a real browser' },
        { text: 'A static type check', why: 'Types catch shape mistakes but never run the journey.' },
        { text: 'A snapshot of the cart component', why: 'A snapshot records markup; it doesn\'t exercise the flow across pages.' },
      ],
      answer: 1,
      explanation: 'A critical multi-page user journey is exactly what E2E tests are for. Keep them few and focused on paths that would really hurt if broken.',
    },
    {
      id: 'testing-fundamentals-q6',
      type: 'mcq',
      prompt: 'Select **all** properties of a good unit test.',
      options: [
        { text: 'It gives the same result every time it runs (deterministic).' },
        { text: 'It only passes if the tests above it ran first.', why: 'That\'s order dependence — each test must set up its own state.' },
        { text: 'It fails for a clear reason that points at the broken behaviour.' },
        { text: 'It calls the real production API so it\'s realistic.', why: 'Real network makes unit tests slow and flaky; fake it at this level.' },
        { text: 'It runs fast enough to run on every save.' },
      ],
      answer: [0, 2, 4],
      explanation: 'Good unit tests are fast, isolated, deterministic and readable. Realism is the job of the higher pyramid layers.',
    },
    {
      id: 'testing-fundamentals-q7',
      type: 'short',
      prompt: 'Explain in two or three sentences what "test behaviour, not implementation" means and why it matters.',
      answer: 'Assert on what the code does for its callers or users — return values, rendered text, emitted events — not on how it does it internally, like which private helper was called or which variable changed. Then a refactor that keeps behaviour the same keeps the tests green, so tests protect you instead of breaking on every change.',
    },
  ],

  exercises: [
    {
      id: 'make-it-testable',
      title: 'Make the password rules testable',
      difficulty: 'intermediate',
      prompt: `
The password checker works, but its rules are buried inside the component's click handler. Testing them means rendering, typing and clicking for every case.

Move the rules into **passwordRules.js** as a pure function:

- \`checkPassword(password)\` returns an **array of failed rule ids**, always in this order: \`'length'\` (fewer than 8 characters), \`'number'\` (no digit), \`'upper'\` (no capital letter A–Z). A password that passes everything returns \`[]\`.
- Keep the \`messages\` export and use it in **App.vue** to show each failed rule as an \`li.problem\`.
- **App.vue** must call \`checkPassword\` instead of its own inline rules. The \`.password\` input, \`.check\` button, \`li.problem\` items and the \`.ok\` paragraph must keep working.
`,
      files: {
        'App.vue': passwordStarterApp,
        'passwordRules.js': `// passwordRules.js
// TODO: move the rules out of App.vue into this pure function.
// checkPassword('abc') → ['length', 'number', 'upper']
export function checkPassword(password) {
  return []
}

${passwordMessages}`,
      },
      hints: [
        'Start by copying the three `if` statements from `check()` into `checkPassword`, but push rule **ids** instead of messages.',
        'Inside `checkPassword` use the `password` argument, not `password.value` — the function shouldn\'t know about refs or components.',
        'In App.vue, store `failed.value = checkPassword(password.value)` and render `messages[id]` for each id.',
      ],
      solution: {
        explanation: '`checkPassword` is now pure: a string in, an array out, no refs, no DOM. The rules can be tested with one line per case, while the component shrinks to wiring. Returning ids rather than messages also keeps wording (which designers change) out of the logic (which tests pin down).',
        files: {
          'App.vue': passwordSolutionApp,
          'passwordRules.js': `// passwordRules.js — pure: a string in, the failed rule ids out.
export function checkPassword(password) {
  const failed = []
  if (password.length < 8) failed.push('length')
  if (!/\\d/.test(password)) failed.push('number')
  if (!/[A-Z]/.test(password)) failed.push('upper')
  return failed
}

${passwordMessages}`,
        },
      },
      tests: [
        {
          name: 'checkPassword lists every failed rule, in order',
          code: `const { checkPassword } = requireModule('passwordRules.js')
expect(checkPassword('abc')).toEqual(['length', 'number', 'upper'])`,
        },
        {
          name: 'each rule is checked on its own',
          code: `const { checkPassword } = requireModule('passwordRules.js')
expect(checkPassword('sunflower7')).toEqual(['upper'])
expect(checkPassword('Sunflowers')).toEqual(['number'])
expect(checkPassword('Sun7')).toEqual(['length'])
expect(checkPassword('Sunflower7')).toEqual([])`,
        },
        {
          name: 'the form still shows each problem and the success message',
          code: `await type('.password', 'abc')
await click('.check')
expect(findAll('.problem')).toHaveLength(3)
expect(text()).toContain('At least one capital letter')
await type('.password', 'Sunflower7')
await click('.check')
expect(exists('.problem')).toBe(false)
expect(exists('.ok')).toBe(true)`,
        },
      ],
    },
    {
      id: 'format-duration',
      title: 'Make formatDuration pass its spec',
      difficulty: 'intermediate',
      prompt: `
A podcast app shows episode lengths with \`formatDuration(seconds)\` from **formatDuration.js**. The tests are the specification — fix the function until they all pass:

- under an hour: \`m:ss\` → \`0\` → \`'0:00'\`, \`7\` → \`'0:07'\`, \`61\` → \`'1:01'\`, \`3599\` → \`'59:59'\`;
- an hour or more: \`h:mm:ss\` → \`3600\` → \`'1:00:00'\`, \`3661\` → \`'1:01:01'\`;
- fractions of a second are **dropped** (floored): \`59.9\` → \`'0:59'\`.

The episode list renders each duration in a \`.duration\` span.
`,
      files: {
        'App.vue': podcastApp,
        'formatDuration.js': `// formatDuration.js
export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  return minutes + ':' + secs
}`,
      },
      hints: [
        'Run the tests and read the first failure: what does `formatDuration(0)` return right now?',
        '`String(n).padStart(2, \'0\')` turns `7` into `\'07\'`. Floor the input first with `Math.floor`.',
        'Split into hours (`Math.floor(s / 3600)`), minutes (`Math.floor((s % 3600) / 60)`) and seconds (`s % 60`); only show hours when they are above 0.',
      ],
      solution: {
        explanation: 'Flooring first removes fractions everywhere at once. Hours, minutes and seconds come from integer division and remainders; padding is applied to every part that follows a colon. The table of cases in the tests is exactly how you\'d write this in Vitest with `it.each`.',
        files: {
          'App.vue': podcastApp,
          'formatDuration.js': `// formatDuration.js
const pad = (n) => String(n).padStart(2, '0')

export function formatDuration(totalSeconds) {
  const s = Math.floor(totalSeconds)
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  if (hours > 0) return hours + ':' + pad(minutes) + ':' + pad(seconds)
  return minutes + ':' + pad(seconds)
}`,
        },
      },
      tests: [
        { name: 'under a minute pads the seconds', code: `const { formatDuration } = requireModule('formatDuration.js')\nexpect(formatDuration(0)).toBe('0:00')\nexpect(formatDuration(7)).toBe('0:07')\nexpect(formatDuration(59)).toBe('0:59')` },
        { name: 'minutes and seconds', code: `const { formatDuration } = requireModule('formatDuration.js')\nexpect(formatDuration(60)).toBe('1:00')\nexpect(formatDuration(61)).toBe('1:01')\nexpect(formatDuration(3599)).toBe('59:59')` },
        { name: 'an hour or more shows h:mm:ss', code: `const { formatDuration } = requireModule('formatDuration.js')\nexpect(formatDuration(3600)).toBe('1:00:00')\nexpect(formatDuration(3661)).toBe('1:01:01')\nexpect(formatDuration(36000)).toBe('10:00:00')` },
        { name: 'fractions are floored', code: `const { formatDuration } = requireModule('formatDuration.js')\nexpect(formatDuration(59.9)).toBe('0:59')\nexpect(formatDuration(61.5)).toBe('1:01')` },
        { name: 'the episode list uses it', code: `expect(findAll('.duration').map((el) => el.textContent.trim())).toEqual(['1:02:05', '25:08', '0:45'])` },
      ],
    },
  ],

  interview: [
    {
      id: 'testing-fundamentals-why-test',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why do we write automated tests, and how do you decide what is worth testing?',
      answer: 'Tests catch regressions early, make refactoring safe, and document expected behaviour in a form that can\'t go stale. They cost time to write and maintain, so focus them where bugs are likely or expensive: business rules and edge cases, code that changes often, critical user flows, and every bug you\'ve already fixed.',
      explanation: 'The value of a test is the cost of the bug it prevents times how likely that bug is, minus the cost of maintaining the test.',
      whyAsked: 'Interviewers want to hear judgement — not "test everything" or "tests slow us down", but a cost/benefit view.',
      mistakes: ['Saying "to reach 100% coverage".', 'Only mentioning bug-finding, not refactoring confidence and documentation.', 'Proposing to test framework behaviour (that `v-if` works).'],
      followUps: ['What would you *not* test?', 'How do you know a test is valuable?', 'How do tests help during code review?'],
      modelAnswer: 'I write tests so I can change code quickly without breaking things I\'m not looking at. A good suite catches regressions on every pull request, lets me refactor with confidence, and doubles as precise documentation of behaviour. Tests aren\'t free, so I prioritise: business rules with branches and edge cases, code many people touch, the critical user journeys, and a regression test for each bug I fix. I don\'t test the framework itself or chase coverage numbers with assertion-free tests.',
    },
    {
      id: 'testing-fundamentals-levels',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between unit, component, integration and end-to-end tests? Give a Vue example of each.',
      answer: 'A unit test checks one function or composable in isolation (`subtotal()` returns 4448). A component test mounts one component and checks its output and events (clicking + emits `update:modelValue`). An integration test combines several real pieces (a page with its store and router, network mocked). An E2E test runs the real app in a real browser through a user journey (sign in → checkout).',
      explanation: 'Moving up the levels, more of the system is real: confidence per test rises, but so do run time, setup cost and flakiness.',
      whyAsked: 'Shows whether you can choose the right tool for a given risk.',
      mistakes: ['Treating "unit" as "any test written in Vitest".', 'Saying E2E tests should cover everything.', 'Not mentioning the speed/confidence trade-off.'],
      followUps: ['Which level would you use for a form validation rule?', 'Where do you mock the network?', 'What makes E2E tests flaky?'],
      modelAnswer: 'They differ in how much of the system is real. A unit test exercises one piece, like a pricing function or a composable, in milliseconds. A component test mounts a single Vue component and interacts with it — props in, DOM and emitted events out. An integration test wires several real parts together, say a page with Pinia and the router, usually with a mocked network. An end-to-end test drives the whole app in a real browser, like a user would. Higher levels give more confidence per test but are slower and more brittle, so I use many small tests and a few E2E tests for critical journeys.',
    },
    {
      id: 'testing-fundamentals-pyramid-trophy',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'The test pyramid says "mostly unit tests"; the testing trophy says "mostly integration tests". How would you shape the test suite of a typical Vue app?',
      answer: 'Both are heuristics about cost vs confidence. For a Vue app: static checks (lint, TypeScript) everywhere; unit tests for pure logic, composables and stores; the largest share of component/integration tests that render real components with their children and mocked network; and a small set of E2E tests for revenue- or safety-critical journeys. Adjust by where your bugs actually come from.',
      explanation: 'The pyramid emphasises speed and precision; the trophy emphasises realism per test. Modern tooling (fast jsdom component tests) makes integration-style tests cheap, which is why many frontend teams lean towards the trophy.',
      whyAsked: 'Tests strategic thinking about testing, not just syntax.',
      mistakes: ['Treating either picture as a strict rule.', 'Ignoring maintenance cost of E2E tests.', 'Unit-testing every tiny component in isolation with everything stubbed, then missing integration bugs.'],
      followUps: ['How do you decide a test belongs at E2E level?', 'How do you keep integration tests fast?', 'How would you use bug history to rebalance?'],
      modelAnswer: 'I treat both shapes as heuristics about the same trade-off: lower tests are fast and precise, higher tests are realistic but slower and more fragile. In a Vue app I\'d have linting and types as the base, unit tests for pure logic, composables and stores, and the bulk of my tests at component or integration level — mounting real components with their children and a mocked network, asserting what the user sees. On top, a handful of Playwright tests for critical journeys like checkout. Then I adjust based on where production bugs actually come from.',
    },
    {
      id: 'testing-fundamentals-flaky-date',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'This test passed all week and started failing on Saturday. Why, and how do you make it reliable?',
      code: {
        lang: 'js',
        code: `// openingHours.js
export function isOpenNow() {
  const day = new Date().getDay() // 0 = Sunday … 6 = Saturday
  return day >= 1 && day <= 5
}

// openingHours.test.js
it('is open now', () => {
  expect(isOpenNow()).toBe(true)
})`,
      },
      answer: 'The function reads the real clock, so the result depends on when the test runs: it fails at weekends. Make time an input — `isOpen(date)` — and test specific dates, or control the clock in the test with `vi.useFakeTimers()` + `vi.setSystemTime(new Date(...))` (and restore with `vi.useRealTimers()`).',
      explanation: 'Hidden inputs — the clock, randomness, network, shared state — are the classic causes of non-deterministic (flaky) tests.',
      whyAsked: 'Flaky tests are a real productivity drain; this checks you can find hidden inputs and design for testability.',
      mistakes: ['Re-running until green.', 'Adding a retry instead of fixing the cause.', 'Forgetting to restore real timers after faking them.'],
      followUps: ['What other hidden inputs cause flakiness?', 'Which design do you prefer: injecting the date or faking timers?', 'How would you find flaky tests in CI?'],
      modelAnswer: 'The test depends on a hidden input — the current date — so it passes on weekdays and fails at weekends. A test has to be deterministic. My preferred fix is design: make the date a parameter, `isOpen(date = new Date())`, and test Monday, Friday and Saturday explicitly, including the boundaries. If I can\'t change the signature, Vitest can freeze the clock with `vi.useFakeTimers()` and `vi.setSystemTime()`, restoring real timers afterwards. Same idea for randomness, network and shared state.',
    },
    {
      id: 'testing-fundamentals-vitest-jest',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Your Vue project uses Vite. Why do most such projects choose Vitest over Jest, and what changes if you migrate tests from Jest?',
      answer: 'Vitest runs on Vite\'s transform pipeline, so it reuses the app\'s config, plugins (including `.vue` handling) and aliases, and supports ES modules natively — no separate Babel/ts-jest setup. Its API is largely Jest-compatible (`describe`, `it`, `expect`, mocks), but mocks live on `vi` instead of `jest`, and globals are opt-in (`globals: true`). Most tests migrate with small changes.',
      explanation: 'The big win is one toolchain: what compiles in the app compiles in the tests.',
      whyAsked: 'Checks familiarity with the current Vue tooling and the ability to justify a tooling choice.',
      mistakes: ['Claiming Jest can\'t test Vue (it can, with extra transforms).', 'Claiming the APIs are 100% identical.', 'Saying Vitest is "required" by Vue.'],
      followUps: ['What is `vi.fn()` equivalent to in Jest?', 'How do you enable a DOM environment in Vitest?', 'What does watch mode re-run?'],
      modelAnswer: 'In a Vite project Vitest is the natural fit because it uses the same transform pipeline as the app: the Vue plugin, aliases and ES modules just work, without a parallel Babel or ts-jest configuration. Its API is largely Jest-compatible — describe, it, expect, snapshot and mock functions — so migrating is mostly swapping `jest.fn` for `vi.fn`, importing the test functions or enabling `globals`, and setting the environment to jsdom where needed. Jest still works for Vue, it just needs more setup to understand `.vue` files and ESM.',
    },
    {
      id: 'testing-fundamentals-slugify',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'TDD style: the tests are written, the code isn\'t. Implement `slugify(title)` in **slugify.js** so a blog title becomes a URL slug: lowercase; every run of characters that isn\'t `a–z` or `0–9` becomes a single `-`; no leading or trailing `-`.',
      starter: {
        files: {
          'App.vue': slugApp,
          'slugify.js': `// slugify.js
// slugify('Hello World') → 'hello-world'
export function slugify(title) {
  return title.toLowerCase().replace(' ', '-')
}`,
        },
      },
      tests: [
        { name: 'turns spaces into dashes', code: `const { slugify } = requireModule('slugify.js')\nexpect(slugify('Hello World')).toBe('hello-world')\nexpect(slugify('Learn Vue in 30 days')).toBe('learn-vue-in-30-days')` },
        { name: 'collapses punctuation and trims the ends', code: `const { slugify } = requireModule('slugify.js')\nexpect(slugify('  Vue 3.5 is out!  ')).toBe('vue-3-5-is-out')\nexpect(slugify('Rock & Roll')).toBe('rock-roll')` },
        { name: 'returns an empty string when nothing is left', code: `const { slugify } = requireModule('slugify.js')\nexpect(slugify('!!!')).toBe('')` },
        { name: 'the preview uses it', code: `expect(text('.slug')).toBe('learn-vue-in-30-days')` },
      ],
      hints: ['`String.prototype.replace` with a string only replaces the **first** match — use a regular expression with the `g` flag.', '`/[^a-z0-9]+/g` matches each run of "anything else"; replace it with `\'-\'` after lowercasing.', 'Finish with `.replace(/^-+|-+$/g, \'\')` to strip dashes at the ends.'],
      answer: 'Lowercase, replace every run of non-alphanumeric characters with one dash using a global regex, then strip leading/trailing dashes.',
      solution: {
        files: {
          'App.vue': slugApp,
          'slugify.js': `// slugify.js
export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}`,
        },
      },
      explanation: 'Each test pins down one rule, so the implementation grows rule by rule — the red–green–refactor loop. A real-world version would also handle accented letters (e.g. normalise with `String.prototype.normalize(\'NFKD\')` first).',
      whyAsked: 'Shows you can read tests as a specification and work in small, verifiable steps.',
      mistakes: ['Using `replace(\' \', \'-\')`, which replaces only the first space.', 'Producing double dashes for "Rock & Roll".', 'Forgetting the "nothing left" edge case.'],
      followUps: ['How would you support accented characters like "Crème brûlée"?', 'What test would you add next?', 'Would you write these with `it.each`?'],
      modelAnswer: 'I let the tests drive it: lowercase first, then a global regex that replaces every run of characters outside a–z and 0–9 with a single dash, which handles spaces, punctuation and symbols in one rule, and finally strip dashes from both ends. That covers all four tests. I\'d then add tests for accented letters and decide with the team whether to transliterate or drop them.',
    },
    {
      id: 'testing-fundamentals-legacy-start',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'You join a team with a large Vue app and zero tests. Releases often break checkout. Where do you start, and how do you build a test suite without stopping feature work?',
      answer: 'Start where the pain is: add a few E2E smoke tests for the critical journeys (log in, checkout) so the worst regressions are caught immediately. Set up Vitest in CI. From then on, every bug fix comes with a regression test, and every touched module gets tests for its logic — extracting pure functions out of components where needed. Grow coverage organically around change, not by a big-bang rewrite.',
      explanation: 'Highest-risk paths first, then "leave it better than you found it" for everything you touch.',
      whyAsked: 'Senior-level judgement: prioritisation, incremental change and team habits.',
      mistakes: ['Proposing to stop features to write tests for everything.', 'Starting with unit tests for trivial helpers while checkout keeps breaking.', 'Ignoring CI — tests that don\'t run automatically decay.'],
      followUps: ['How do you test code that is too tangled to unit test?', 'How do you get the team to adopt the habit?', 'What metrics would show progress?'],
      modelAnswer: 'I\'d start with the highest-risk paths: two or three Playwright smoke tests for log-in and checkout running in CI, so the regressions that hurt most get caught right away. In parallel I\'d set up Vitest and agree on a rule: every bug fix ships with a test that reproduces it, and any module we touch gets tests for its logic. Tangled components get their rules extracted into pure functions or composables as we go, which makes them testable. That way the suite grows where the code is actually changing, without a feature freeze, and I\'d track escaped bugs rather than raw coverage.',
    },
  ],

  takeaways: [
    'A test runs code with a known input and asserts on the output; it fails when an assertion throws.',
    'Structure tests as Arrange–Act–Assert, one behaviour each, named like a sentence.',
    'Unit → component → integration → E2E: more realism and confidence, but slower and costlier. Pyramid and trophy are heuristics for the mix.',
    'Vitest reuses your Vite config, runs `*.test.js` files, has a Jest-like API (`describe`, `it`, `expect`, `vi.fn`) and a watch mode.',
    'Pure functions are the easiest code to test — move business rules out of components.',
    'Good tests are fast, isolated, deterministic and test behaviour, not implementation. Test boundaries and empty inputs on purpose.',
  ],
}
