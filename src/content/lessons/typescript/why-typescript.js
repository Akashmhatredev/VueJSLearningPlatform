// Lesson: Why TypeScript with Vue? (Level 18 — optional TypeScript track)
//
// The sandbox runs plain JavaScript only. TypeScript appears in static code
// blocks; the runnable parts show the JavaScript side of the same ideas
// (runtime checks, prop validation) next to the TS versions.

const apiJs = `// What the backend really sends: it serialises decimal prices as strings.
export const apiItems = [
  { id: 1, name: 'Trail Backpack', price: '89.00' },
  { id: 2, name: 'Camp Stove', price: '45.00' },
]`

const formatJs = `export function formatPrice(value) {
  return '€' + Number(value).toFixed(2)
}`

const productRowVue = `<script setup>
import { formatPrice } from './format.js'

// Array syntax: any value, any type, no checks at all.
const props = defineProps(['name', 'price'])
</script>

<template>
  <p class="row">{{ props.name }} — {{ formatPrice(props.price) }}</p>
</template>`

const appVue = `<script setup>
import { computed } from 'vue'
import ProductRow from './ProductRow.vue'
import { apiItems } from './api.js'
import { formatPrice } from './format.js'

const items = apiItems

// Looks fine. Isn't: price is a string, so + glues text together.
const total = computed(() => items.reduce((sum, item) => sum + item.price, 0))
</script>

<template>
  <h2>Cart</h2>
  <ProductRow v-for="item in items" :key="item.id" :name="item.name" :price="item.price" />
  <p class="total">Total: {{ formatPrice(total) }}</p>
</template>`

const tsVersion = `<script setup lang="ts">
import { computed } from 'vue'

interface ApiItem {
  id: number
  name: string
  price: string          // the truth about the API
}

const props = defineProps<{ items: ApiItem[] }>()

const total = computed(() =>
  props.items.reduce((sum, item) => sum + item.price, 0),
  // ❌ TypeScript reports an error here: the callback returns a
  //    string where the number accumulator is expected.
)
</script>`

// ---------- exercise 1: runtime validation of API data
const parseStarter = `// Validate one product from the API and return a clean object:
//   { id: number, name: string, price: number, tags: string[] }
export function parseProduct(raw) {
  return raw
}`

const parseSolution = `function fail(field, expected, value) {
  throw new TypeError('product.' + field + ': expected ' + expected + ', got ' + JSON.stringify(value))
}

export function parseProduct(raw) {
  if (raw === null || typeof raw !== 'object') fail('(root)', 'an object', raw)

  const { id, name, price, tags = [] } = raw
  if (!Number.isInteger(id)) fail('id', 'an integer', id)
  if (typeof name !== 'string' || name.trim() === '') fail('name', 'a non-empty string', name)

  const amount = typeof price === 'string' ? Number(price) : price
  if (typeof amount !== 'number' || !Number.isFinite(amount)) fail('price', 'a number', price)

  if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) fail('tags', 'an array of strings', tags)

  return { id, name: name.trim(), price: amount, tags }
}`

const parseApp = `<script setup>
import { parseProduct } from './parseProduct.js'

const fromApi = { id: 7, name: ' Head Lamp ', price: '24.90', tags: ['camping'] }
let product = null
let error = ''
try {
  product = parseProduct(fromApi)
} catch (e) {
  error = e.message
}
</script>

<template>
  <p v-if="product" class="product">{{ product.name }} costs {{ product.price.toFixed(2) }}</p>
  <p v-else class="error">{{ error }}</p>
</template>`

// ---------- exercise 2: runtime props mirroring a TS interface
const priceTagStarter = `<script setup>
// TypeScript version to mirror (static):
//   interface Props {
//     amount: number
//     currency?: 'EUR' | 'USD' | 'INR'   // default 'EUR'
//     compact?: boolean                  // default false
//   }
const props = defineProps(['amount', 'currency', 'compact'])

const SYMBOLS = { EUR: '€', USD: '$', INR: '₹' }
</script>

<template>
  <span class="price">{{ SYMBOLS[props.currency] }}{{ props.amount }}</span>
</template>`

const priceTagSolution = `<script setup>
const props = defineProps({
  amount: { type: Number, required: true },
  currency: {
    type: String,
    default: 'EUR',
    validator: (value) => ['EUR', 'USD', 'INR'].includes(value),
  },
  compact: { type: Boolean, default: false },
})

const SYMBOLS = { EUR: '€', USD: '$', INR: '₹' }
</script>

<template>
  <span class="price">
    {{ SYMBOLS[props.currency] }}{{ props.compact ? Math.round(props.amount) : props.amount.toFixed(2) }}
  </span>
</template>`

const priceTagApp = `<script setup>
import PriceTag from './PriceTag.vue'
</script>

<template>
  <p class="a"><PriceTag :amount="12.5" /></p>
  <p class="b"><PriceTag :amount="99.99" currency="USD" compact /></p>
</template>`

// ---------- interview coding: a runtime guard
const guardStarter = `// Return true only if value looks like { id: number, email: string, roles: string[] }
export function isUser(value) {
  return Boolean(value)
}`

const guardSolution = `export function isUser(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'number' &&
    typeof value.email === 'string' &&
    value.email.includes('@') &&
    Array.isArray(value.roles) &&
    value.roles.every((role) => typeof role === 'string')
  )
}`

const guardApp = `<script setup>
import { isUser } from './isUser.js'

const samples = [
  { id: 1, email: 'ada@example.com', roles: ['admin'] },
  { id: '1', email: 'bea@example.com', roles: [] },
]
</script>

<template>
  <ul>
    <li v-for="(s, i) in samples" :key="i" class="sample">{{ i }}: {{ isUser(s) ? 'valid' : 'invalid' }}</li>
  </ul>
</template>`

export default {
  id: 'why-typescript',
  title: 'Why TypeScript with Vue?',
  summary: 'See what TypeScript adds to a Vue project — earlier error detection, better editor help, safer refactors — what it costs, and why types never replace runtime checks.',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['props', 'composables-intro'],
  related: ['typing-components', 'typing-composables-stores', 'props', 'testing-fundamentals', 'legacy-migration', 'create-vue-project'],
  tags: ['typescript', 'ts', 'types', 'vue-tsc', 'type checking', 'jsdoc', 'runtime validation', 'migration', 'lang="ts"'],
  apis: [
    { name: '<script setup lang="ts">', summary: 'Write a component\'s script in TypeScript.' },
    { name: 'vue-tsc', summary: 'Type-checks .vue files from the command line (Vite transpiles TS but does not type-check).' },
    { name: '// @ts-check + JSDoc', summary: 'Get TypeScript checking in plain .js files without converting them.' },
  ],
  docs: [
    { label: 'Vue Guide — Using Vue with TypeScript', url: 'https://vuejs.org/guide/typescript/overview.html' },
    { label: 'Vite — TypeScript (transpile only)', url: 'https://vite.dev/guide/features.html#typescript' },
    { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
    { label: 'TypeScript — JSDoc reference', url: 'https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html' },
  ],

  intro: `
**TypeScript** (TS) is JavaScript with **types**: notes in your code that say what kind of value something is — \`price: number\`, \`items: CartItem[]\`. A tool reads those notes and points out mistakes **while you type and before you ship**: a misspelled property, a string where a number belongs, a prop you forgot to pass.

The types exist only during development. When the app is built, they are **removed** — the browser runs plain JavaScript, exactly like the JavaScript you've written in this course.

Vue itself is written in TypeScript and supports it first-class: you opt in per component with \`<script setup lang="ts">\`. This track is **optional** — everything you learned works without TypeScript — but many professional Vue codebases use it.
`,

  why: `
Here is a real-world bug, in plain JavaScript:

\`\`\`js
// The API sends prices as strings: { price: "89.00" }
const total = items.reduce((sum, item) => sum + item.price, 0)
// 0 + "89.00" + "45.00"  →  "089.0045.00"
\`\`\`

Nothing complains. The page shows **€NaN** (or worse, a plausible-looking wrong number), and you find out from a customer.

With TypeScript, if \`price\` is declared as \`string\`, the editor underlines this line immediately: the callback returns a string where a number is expected. That's the core value: **a class of bugs moves from "found in production" to "found while typing"**.

Other benefits follow from the same type information:

- **Autocomplete and inline docs** for props, store state, API responses.
- **Safe refactors**: rename a prop or a store field and every usage that breaks is listed.
- **Contracts between components and teams**: a component's props and events are documented by its types.

And the costs are real: a learning curve, more syntax, a type-check step in your build — and types that can **lie** if they describe what you *hope* the API sends rather than what it sends.
`,

  eli15: `
Imagine sorting LEGO bricks into labelled boxes: "red 2×4", "blue 1×2". If someone tries to drop a wheel into the "red 2×4" box, the label makes the mistake obvious **before** you start building.

TypeScript puts labels on your variables: "this holds a number", "this holds a list of cart items". Your editor checks every time you put something in a box or take something out. Wrong piece? It tells you right away.

Two important details:

1. The labels are for **you and your tools**. When the app is built, the labels are peeled off — the browser just gets the bricks (plain JavaScript).
2. Labels only check what **you** put in the boxes. If a delivery truck (an API) dumps random pieces in, the label doesn't stop it. For deliveries you still need someone at the door checking each piece — that's **runtime validation**.
`,

  analogy: {
    title: 'Labelled LEGO boxes',
    body: `
Labels make building faster and safer, but they don't inspect deliveries. A good workshop has both: labels on every box (types) and a person at the loading dock checking what arrives (runtime validation of API data).
`,
    mapping: [
      ['a label on a box', 'a type annotation: `price: number`'],
      ['noticing the wrong piece before building', 'type errors in the editor / `vue-tsc` before shipping'],
      ['peeling labels off before the show', 'types are erased at build time — the browser runs JavaScript'],
      ['a delivery truck dumping pieces', 'data from an API, localStorage, a URL'],
      ['the person checking deliveries', 'runtime validation (guards, schemas, Vue prop validation in dev)'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'The same bug, in JavaScript and TypeScript',
    caption: 'Left: runs and quietly computes nonsense. Right: the editor flags the line before you run anything — because the type says what the API really sends.',
    alt: 'Side by side. Left: a JavaScript Vue component summing item prices with reduce, with no warning, producing a concatenated string. Right: the same component with lang="ts", an ApiItem interface declaring price as string, and a comment marking the error TypeScript reports on the reduce call.',
    props: {
      left: {
        label: 'JavaScript — runs, wrong result',
        lang: 'vue',
        code: `<script setup>
import { computed } from 'vue'

const props = defineProps(['items'])

const total = computed(() =>
  props.items.reduce((sum, item) => sum + item.price, 0),
)
// items from the API: price "89.00", "45.00"
// total → "089.0045.00"  (no error anywhere)
</script>`,
      },
      right: {
        label: 'TypeScript — flagged while typing',
        lang: 'vue',
        code: tsVersion,
      },
      points: [
        'Same logic; the only difference is the type information.',
        'TypeScript only helps if the type matches reality: declaring price as number would hide this bug.',
        'Types are erased at build time — runtime data still needs checking at the boundary.',
        'Fix in both: convert once where data enters the app, e.g. price: Number(item.price).',
      ],
    },
  },

  animation: {
    type: 'concept-diagram',
    title: 'Where types live — and where they don\'t',
    caption: 'Types help in the editor and in CI. In the browser, only JavaScript runs.',
    alt: 'A pipeline: you write .vue files with lang="ts"; the editor\'s language tooling shows errors as you type; vue-tsc type-checks in CI; Vite strips the types and bundles JavaScript; the browser runs plain JavaScript; data from the API arrives at runtime, where only runtime validation can check it.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'code', label: 'Your .vue / .ts files', note: 'types written here', tone: 'paper', x: 100, y: 90 },
        { id: 'editor', label: 'Editor tooling', note: 'errors while typing', tone: 'cobalt', x: 290, y: 40 },
        { id: 'check', label: 'vue-tsc in CI', note: 'fails the build on type errors', tone: 'cobalt', x: 290, y: 160 },
        { id: 'vite', label: 'Vite build', note: 'strips types, no checking', tone: 'kraft', x: 480, y: 90 },
        { id: 'browser', label: 'Browser', note: 'plain JavaScript', tone: 'acid', x: 660, y: 90 },
        { id: 'api', label: 'API data', note: 'unknown until runtime', tone: 'red', x: 660, y: 250 },
      ],
      edges: [
        { from: 'code', to: 'editor' },
        { from: 'code', to: 'check' },
        { from: 'code', to: 'vite' },
        { from: 'vite', to: 'browser', label: 'JS only' },
        { from: 'api', to: 'browser', label: 'runtime', dashed: true },
      ],
      steps: [
        { focus: ['code'], text: 'You write components with `<script setup lang="ts">` and plain `.ts` modules. Types describe props, emits, refs, API responses, store state.' },
        { focus: ['editor'], edges: ['code->editor'], text: 'The editor (for VS Code, the official Vue extension) understands `.vue` files and shows type errors and autocompletion as you type — the biggest everyday win.' },
        { focus: ['check'], edges: ['code->check'], text: '`vue-tsc` checks the whole project from the command line. Projects scaffolded with create-vue run it as part of their build script; run it in CI so type errors can\'t be merged.' },
        { focus: ['vite'], edges: ['code->vite'], text: 'Vite **transpiles** TypeScript by removing the types — it does **not** type-check. A project full of type errors still builds unless you run the checker.' },
        { focus: ['browser'], edges: ['vite->browser'], text: 'The browser runs plain JavaScript. There are no types left — `price: number` is gone.' },
        { focus: ['api'], edges: ['api->browser'], text: 'Data from APIs, storage and URLs arrives at runtime, where no type can check it. Validate it at the boundary (guards or schema libraries), then let types carry the guarantee inward.' },
      ],
    },
  },

  syntax: [
    `
#### Opting in

\`\`\`bash
npm create vue@latest     # choose "Add TypeScript? › Yes"
\`\`\`

Then, per component:
`,
    {
      code: `<script setup lang="ts">
import { ref, computed } from 'vue'

interface CartItem {
  id: number
  name: string
  price: number
  qty: number
}

const props = defineProps<{ items: CartItem[]; currency?: string }>()

const coupon = ref<string | null>(null)            // explicit type
const total = computed(() =>                        // inferred: number
  props.items.reduce((sum, i) => sum + i.price * i.qty, 0),
)
</script>`,
      lang: 'vue',
      title: 'a typed component (static example)',
      static: true,
    },
    `
- \`interface\` / \`type\` describe the shape of data.
- \`defineProps<{ … }>()\` declares props with types instead of runtime options ([next lesson](lesson:typing-components)).
- Most types are **inferred**: \`ref(0)\` is already \`Ref<number>\`. You annotate where inference can't know (\`null\` now, an object later; API data).

#### Checking types

Vite strips types but doesn't check them. Type-check separately:
`,
    {
      code: `npx vue-tsc --noEmit        # check .vue and .ts files, emit nothing

# package.json in a create-vue TS project (roughly)
"build": "run-p type-check \\"build-only {@}\\" --",
"type-check": "vue-tsc --build"`,
      lang: 'bash',
      title: 'terminal',
    },
    `
#### TypeScript-lite for JavaScript files

You can get much of the editor checking without converting files, using JSDoc comments and \`// @ts-check\`:
`,
    {
      code: `// @ts-check

/**
 * @param {number} cents
 * @param {'EUR' | 'USD'} [currency]
 * @returns {string}
 */
export function formatPrice(cents, currency = 'EUR') {
  return (currency === 'EUR' ? '€' : '$') + (cents / 100).toFixed(2)
}

formatPrice('899') // the editor flags this: string is not assignable to number`,
      lang: 'js',
      title: 'format.js with JSDoc types',
    },
    {
      callout: 'warn',
      title: 'Types are erased — runtime data isn\'t checked',
      text: 'A type like `Product` on an API response is a promise *you* make, not a check. Validate data at the boundary (hand-written guards or a schema library), and keep Vue\'s runtime prop validation in mind as the development-time check JavaScript components get.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: appVue,
    intro: 'The playground\'s cart has the bug from the top of the lesson. Step through it to see why plain JavaScript stays silent.',
    steps: [
      { lines: [4], text: '`apiItems` comes from the "backend". Its prices are strings like `"89.00"` — a common choice for decimal values, and invisible from here.' },
      { lines: [7], text: 'The data is used as-is. There is no single place where "API shape" becomes "app shape" — that\'s the real design flaw.' },
      { lines: [9, 10], text: '`sum + item.price` with a string concatenates: `0 + "89.00"` is `"089.00"`. JavaScript\'s `+` is both addition and string joining, and nothing tells you which one happened.' },
      { lines: [15], text: '`ProductRow` receives a string price too. Its array-syntax props accept anything — no type, no check.' },
      { lines: [16], text: '`formatPrice` calls `Number("089.0045.00")` → `NaN`, so the page shows **€NaN**. With TypeScript the reduce line would already have been flagged.' },
    ],
  },

  playground: {
    title: 'A bug TypeScript would have caught',
    objective: 'Find and fix a type bug in plain JavaScript, then add the runtime checks that are JavaScript\'s answer to static types.',
    files: { 'App.vue': appVue, 'ProductRow.vue': productRowVue, 'format.js': formatJs, 'api.js': apiJs },
    expected: 'Two cart rows with prices, and **Total: €NaN** — the strings were glued together instead of added.',
    experiments: [
      {
        id: 'convert-at-boundary',
        task: 'Fix the total by converting prices **once, where the data enters the app**: map `apiItems` to items whose `price` is a number. The total should read **€134.00**.',
        hint: '`const items = apiItems.map((item) => ({ ...item, price: Number(item.price) }))`',
        tests: [
          {
            name: 'the total is €134.00',
            code: `expect(text('.total')).toBe('Total: €134.00')`,
          },
          {
            name: 'rows still show prices',
            code: `expect(text('.row')).toContain('€89.00')`,
          },
        ],
        explain: 'Converting at the boundary means every component after it can trust the shape. In TypeScript you\'d express that as two types — `ApiItem` (price: string) and `CartItem` (price: number) — with one function converting between them.',
      },
      {
        id: 'runtime-props',
        task: 'Give `ProductRow.vue` real prop declarations: `name` is a required `String`, `price` a required `Number`. This is JavaScript\'s version of typed props.',
        hint: '`defineProps({ name: { type: String, required: true }, price: { type: Number, required: true } })`',
        tests: [
          {
            name: 'price is declared as a Number prop',
            code: `const p = requireModule('ProductRow.vue').default.props
const price = p && p.price
expect(Boolean(price && (price === Number || price.type === Number))).toBe(true)`,
          },
        ],
        explain: 'Vue checks these declarations at runtime in development builds: pass a string and the console shows "Invalid prop: type check failed". TypeScript catches the same mistake earlier — in the editor — but only for values whose types it knows. Runtime validation warnings are skipped in production builds.',
      },
      {
        id: 'guard-format',
        task: 'Make `formatPrice` fail loudly instead of printing `€NaN`: throw a `TypeError` when the value isn\'t a finite number. `formatPrice(89)` must still return `€89.00`.',
        hint: '`if (typeof value !== \'number\' || !Number.isFinite(value)) throw new TypeError(\'formatPrice expects a number, got \' + typeof value)`',
        tests: [
          {
            name: 'numbers are formatted, everything else throws',
            code: `const { formatPrice } = requireModule('format.js')
expect(formatPrice(89)).toBe('€89.00')
expect(() => formatPrice('89')).toThrow()
expect(() => formatPrice(NaN)).toThrow()`,
          },
        ],
        explain: 'A runtime guard turns a silent wrong answer into an immediate, clear error — the closest JavaScript gets to a type error, but only when the code actually runs. TypeScript would report `formatPrice(\'89\')` without running anything. (If you skipped the first experiment, the rows will now throw — the guard found the bug for you.)',
      },
      {
        id: 'read-ts',
        task: 'Compare the playground with the TypeScript version in the "same bug" visual above. Which single line would you change in the TS version to make the bug disappear — and why would changing the interface to `price: number` be the *wrong* fix?',
        hint: 'Ask: does the interface describe what the API sends, or what you wish it sent?',
        explain: 'Changing the interface to `price: number` silences the error but makes the type lie — the bug comes back at runtime. The right fix converts the value (and, ideally, validates the API response) so that types describe reality.',
      },
    ],
  },

  internals: {
    beginner: `
TypeScript is a separate tool that reads your code, including the type notes, and reports problems. Then a build step deletes the type notes so the result is ordinary JavaScript. Nothing about TypeScript runs in the browser — which is why it can't check data that only shows up while the app runs.
`,
    technical: [
      `
**Two separate jobs.** *Type checking* (\`tsc\`/\`vue-tsc\`, and your editor's language server) analyses the program and reports errors. *Transpiling* (Vite, using a fast compiler) removes type syntax and outputs JavaScript, file by file, without understanding types. Vite only does the second job — so you add the first to your editor, scripts and CI.

**.vue files need special tooling.** Plain \`tsc\` doesn't understand single-file components. \`vue-tsc\` (built on Vue's language tools, the same engine behind the official VS Code extension) maps \`<script setup lang="ts">\` and the **template** to TypeScript so it can check both: a typo like \`{{ produt.name }}\` in a template is reported too.

**Inference does most of the work.** \`ref(0)\` is \`Ref<number>\`; \`computed(() => items.length)\` is \`ComputedRef<number>\`; a setup store in Pinia infers its whole public type. You mostly annotate *boundaries*: props, emits, API responses, \`ref(null)\` that will later hold an object.
`,
      {
        code: `// Types are erased: this TypeScript…
const price: number = Number(raw.price)
function total(items: CartItem[]): number { /* … */ }

// …becomes this JavaScript:
const price = Number(raw.price)
function total(items) { /* … */ }`,
        lang: 'ts',
        title: 'what the browser actually receives',
        static: true,
      },
      `
**Types vs runtime validation.** TypeScript proves things about code paths it can see. Data from \`fetch\`, \`localStorage\`, \`JSON.parse\` or the URL is typed as whatever *you* claim. Robust apps validate that data once at the boundary — with type guards or schema libraries that produce both a runtime check and a TypeScript type from one definition — and Vue's runtime prop validation remains a useful development-time check for components used from JavaScript.
`,
    ],
    production: `
- **Adopt incrementally.** TypeScript and JavaScript files can coexist (\`allowJs\`). Convert leaf modules and new components first; use \`// @ts-check\` with JSDoc in files you can't convert yet.
- **Turn on \`strict\`** for new projects (create-vue does). Retrofitting strictness later is much harder.
- **Run \`vue-tsc\` in CI** so type errors block merges — the editor alone isn't a gate.
- **Avoid \`any\`** (it switches checking off and spreads); prefer \`unknown\` plus a guard for data of unknown shape.
- **Validate external data** at the edges (API responses, storage, query params) and convert to internal types there.
- **Measure the cost**: type-check time grows with project size; incremental builds (\`vue-tsc --build\`) and project references help in large repositories.
- **TypeScript is optional.** Small prototypes, scripts and teams new to Vue can ship excellent JavaScript apps — runtime prop validation, tests and JSDoc cover a lot.
`,
  },

  mistakes: [
    {
      title: 'Typing API data as what you hope it is',
      wrong: { code: `interface Product { price: number }\nconst product = (await res.json()) as Product  // the API sends "89.00"`, lang: 'ts' },
      right: { code: `const raw: unknown = await res.json()\nconst product = parseProduct(raw)   // checks + converts, returns Product`, lang: 'ts' },
      explanation: '`as Product` is a promise, not a check. If the API disagrees, the type lies and the bug reappears at runtime. Validate (and convert) at the boundary.',
    },
    {
      title: 'Assuming the Vite build type-checks',
      wrong: { code: `"build": "vite build"   // type errors still produce a bundle`, lang: 'json' },
      right: { code: `"build": "vue-tsc --noEmit && vite build"`, lang: 'json' },
      explanation: 'Vite only strips types. Add `vue-tsc` to the build or CI so type errors fail the pipeline.',
    },
    {
      title: 'Silencing errors with any',
      wrong: { code: `const items: any = response.data\nitems.forEach((i: any) => total += i.prise) // typo, no error`, lang: 'ts' },
      right: { code: `const items: unknown = response.data\nif (isCartItemList(items)) items.forEach((i) => total += i.price)`, lang: 'ts' },
      explanation: '`any` turns TypeScript off for that value and everything derived from it. Use `unknown` and narrow it with a guard.',
    },
    {
      title: 'Thinking TypeScript replaces prop validation and tests',
      wrong: { code: `// "We have types, we don't need tests or runtime checks"`, lang: 'ts' },
      right: { code: `// Types: shape errors at compile time\n// Runtime validation: untrusted data\n// Tests: behaviour`, lang: 'ts' },
      explanation: 'Types prove shapes in code you control. They don\'t prove behaviour (tests do) or validate data from outside (runtime checks do).',
    },
  ],

  debugging: [
    {
      symptom: 'The project builds and deploys even though the editor shows red squiggles.',
      cause: 'Vite transpiles TypeScript without type-checking.',
      fix: 'Run `vue-tsc --noEmit` (or `vue-tsc --build`) as part of the build script and in CI.',
    },
    {
      symptom: 'TypeScript says everything is fine, but the app crashes on `undefined` from the API.',
      cause: 'The response was cast to a type (`as User`) without validation, and the API sent a different shape.',
      fix: 'Type the raw response as `unknown`, validate it (guard or schema library), and convert to your internal type at the boundary.',
    },
    {
      symptom: '`tsc` reports errors about `.vue` files or can\'t find their modules.',
      cause: 'Plain `tsc` doesn\'t understand single-file components.',
      fix: 'Use `vue-tsc`, and the official Vue extension in your editor.',
    },
    {
      symptom: 'After enabling `strict`, hundreds of "possibly null/undefined" errors appear.',
      cause: 'Strict null checks reveal places where values may be missing — many are real bugs.',
      fix: 'Fix them gradually: initialise with real values, narrow with `if (x)` checks, use optional chaining, and avoid non-null assertions (`!`) unless you can justify them.',
    },
  ],

  bestPractices: [
    'Let inference work; annotate boundaries: props, emits, API responses, refs that start as `null`.',
    'Make types describe reality; convert and validate external data once at the boundary.',
    'Run `vue-tsc` in the build or CI — editor squiggles aren\'t a gate.',
    'Enable `strict` from the start in new projects.',
    'Prefer `unknown` + guards over `any`.',
    'Migrate incrementally; use JSDoc + `// @ts-check` where converting isn\'t practical yet.',
    'Keep tests and runtime checks: types prove shapes, not behaviour or external data.',
  ],

  useCases: [
    'Large or long-lived codebases where refactors must be safe.',
    'Teams sharing components and stores, where types document contracts.',
    'Apps consuming complex APIs, with typed responses generated or validated at the boundary.',
    'Libraries and design systems, where consumers benefit from typed props and events.',
    'Incremental hardening of an existing JavaScript app via JSDoc and `@ts-check`.',
  ],

  whenToUse: {
    use: [
      'Projects with several developers, a long lifetime, or many shared components.',
      'Codebases that get refactored often or integrate complex data models.',
      'When the team is comfortable with TypeScript (or willing to invest in learning it).',
    ],
    avoid: [
      'Treating types as validation for API or user data.',
      'Very small prototypes where the overhead outweighs the benefit — JavaScript with runtime checks is fine.',
      'Adding TypeScript but disabling strictness and sprinkling `any` — you pay the cost without the benefit.',
    ],
  },

  comparison: {
    title: 'Three ways to catch type mistakes',
    headers: ['', 'TypeScript', 'Vue runtime prop validation', 'Hand-written runtime guards'],
    rows: [
      ['When it checks', 'while editing / in CI, before running', 'at runtime, development builds only', 'at runtime, every build'],
      ['What it checks', 'all code paths it can see', 'props passed to a component', 'whatever data you pass through it'],
      ['Checks API / storage data?', 'no — types are erased', 'only when passed as props', '**yes**'],
      ['Cost', 'tooling, syntax, learning curve', 'small', 'code you write and maintain'],
      ['Best for', 'catching mistakes early, editor help, refactors', 'component contracts in JS projects', 'boundaries with untrusted data'],
    ],
    note: 'They complement each other. Next: [typing props, emits, refs & computed](lesson:typing-components).',
  },

  quiz: [
    {
      id: 'why-typescript-q1',
      type: 'output',
      prompt: 'What does this JavaScript compute?',
      code: { lang: 'js', code: `const items = [{ price: '10' }, { price: '5' }]\nconst total = items.reduce((sum, item) => sum + item.price, 0)\nconsole.log(total)` },
      options: [
        { text: '`15`', why: 'That would require numeric addition; with string operands `+` concatenates.' },
        { text: '`"0105"`' },
        { text: '`NaN`', why: 'No number conversion happens, so there is no NaN — just string joining.' },
        { text: 'A TypeError', why: 'JavaScript happily adds a number and a string by converting to string.' },
      ],
      answer: 1,
      explanation: '`0 + "10"` is `"010"`, then `"010" + "5"` is `"0105"`. TypeScript would flag the callback returning a string for a number accumulator — if `price` is typed as `string`.',
    },
    {
      id: 'why-typescript-q2',
      type: 'mcq',
      prompt: 'Your Vite + Vue project has TypeScript errors, but `vite build` succeeds. Why?',
      options: [
        { text: 'Vite strips types without type-checking; you need to run `vue-tsc` separately.' },
        { text: 'The errors are only warnings in production mode.', why: 'There is no production/development distinction for type errors — Vite simply doesn\'t check them.' },
        { text: 'Vite ignores files with `lang="ts"`.', why: 'Vite compiles them fine; it just removes the types instead of checking them.' },
        { text: 'TypeScript errors are fixed automatically during the build.', why: 'Nothing fixes them; the types are deleted and the code is bundled as-is.' },
      ],
      answer: 0,
      explanation: 'Transpiling (removing types) and type-checking are separate jobs. Add `vue-tsc --noEmit` (or `--build`) to your build or CI.',
    },
    {
      id: 'why-typescript-q3',
      type: 'bug',
      prompt: 'This TypeScript compiles without errors, yet crashes in production when the API returns `{ "price": "89.00" }`. Click the line that hides the problem.',
      code: {
        lang: 'ts',
        code: `interface Product {
  name: string
  price: number
}

async function loadProduct(id: number): Promise<Product> {
  const res = await fetch('/api/products/' + id)
  return (await res.json()) as Product
}

const p = await loadProduct(1)
console.log(p.price.toFixed(2))`,
      },
      answerLine: 8,
      explanation: 'Line 8 *asserts* that the JSON is a `Product` without checking. The API sends a string, so `toFixed` fails at runtime on line 12. Validate and convert the response instead of casting.',
    },
    {
      id: 'why-typescript-q4',
      type: 'fill',
      prompt: 'Complete the component so its script is TypeScript, and the command that type-checks `.vue` files.',
      code: {
        lang: 'vue',
        code: `<script setup lang="___">
const props = defineProps<{ title: string }>()
</script>

<!-- terminal: npx ___ --noEmit -->`,
      },
      answer: [['ts'], ['vue-tsc']],
      explanation: '`lang="ts"` opts a component into TypeScript. `vue-tsc` understands single-file components (scripts and templates) and reports type errors.',
    },
    {
      id: 'why-typescript-q5',
      type: 'mcq',
      prompt: 'Which statements about TypeScript in a Vue app are true? (Select all that apply.)',
      options: [
        { text: 'Types are removed at build time; the browser runs JavaScript.' },
        { text: 'TypeScript validates JSON from `fetch` at runtime.', why: 'There are no types at runtime. Validate external data yourself.' },
        { text: 'You can convert a project gradually, component by component.' },
        { text: '`vue-tsc` can report errors in templates, not only in scripts.' },
        { text: 'TypeScript makes tests unnecessary.', why: 'Types prove shapes, not behaviour.' },
      ],
      answer: [0, 2, 3],
      explanation: 'Types are a development-time tool: erased in the build, adoptable incrementally, and — with Vue\'s tooling — able to check templates too.',
    },
    {
      id: 'why-typescript-q6',
      type: 'mcq',
      prompt: 'In a plain JavaScript component, what is the closest equivalent of declaring `price: number` for a prop?',
      options: [
        { text: '`defineProps({ price: { type: Number, required: true } })` — checked at runtime in development' },
        { text: '`defineProps([\'price\'])`', why: 'Array syntax declares the name only — no type and no check.' },
        { text: 'A comment `// price is a number`', why: 'Comments aren\'t checked by anything (unless they are JSDoc read by a type checker).' },
        { text: 'There is no equivalent', why: 'Vue\'s runtime prop declarations validate types in development builds.' },
      ],
      answer: 0,
      explanation: 'Runtime prop declarations produce development warnings for wrong types. TypeScript checks earlier, in the editor; runtime validation still covers values TypeScript can\'t see.',
    },
    {
      id: 'why-typescript-q7',
      type: 'short',
      prompt: 'Why do TypeScript projects still need runtime validation?',
      answer: 'Because types are erased at build time and only describe what the code claims. Data from APIs, storage, URLs or users arrives at runtime in whatever shape it actually has. Validating (and converting) it at the boundary makes the types true; after that, TypeScript can carry the guarantee through the rest of the app.',
    },
  ],

  exercises: [
    {
      id: 'parse-product',
      title: 'Validate API data at the boundary',
      difficulty: 'intermediate',
      prompt: `
Implement \`parseProduct(raw)\` in \`parseProduct.js\` — the runtime check a TypeScript \`Product\` type can't do for you:

- Return \`{ id, name, price, tags }\` where \`id\` is an integer, \`name\` a non-empty string (trimmed), \`price\` a finite number, \`tags\` an array of strings (default \`[]\` when missing).
- \`price\` may arrive as a numeric string (\`"24.90"\`) — convert it to a number.
- For anything invalid, throw a \`TypeError\` whose message contains the field path, e.g. \`'product.price: expected a number, got "abc"'\`. Non-objects (\`null\`, strings) are invalid too.
- Return a **new** object (don't return \`raw\`).

\`App.vue\` shows the parsed sample in \`.product\`.
`,
      files: { 'App.vue': parseApp, 'parseProduct.js': parseStarter },
      hints: [
        'Start with the root: `if (raw === null || typeof raw !== \'object\') throw new TypeError(\'product.(root): …\')`.',
        'Check each field in turn: `Number.isInteger(id)`, `typeof name === \'string\' && name.trim() !== \'\'`, `Number.isFinite(amount)` after converting strings with `Number()`.',
        'For tags: `Array.isArray(tags) && tags.every((t) => typeof t === \'string\')`. A small `fail(field, expected, value)` helper keeps the messages consistent.',
      ],
      solution: {
        explanation: 'This function is the boundary between "whatever the API sent" and "data the app can trust". In TypeScript its signature would be `parseProduct(raw: unknown): Product` — the type is only honest because the function checks. Schema libraries generate this kind of code (and the matching type) from one declaration.',
        files: { 'App.vue': parseApp, 'parseProduct.js': parseSolution },
      },
      tests: [
        {
          name: 'valid data is returned clean, with price converted',
          code: `const { parseProduct } = requireModule('parseProduct.js')
const p = parseProduct({ id: 7, name: ' Head Lamp ', price: '24.90', tags: ['camping'] })
expect(p.id).toBe(7)
expect(p.name).toBe('Head Lamp')
expect(p.price).toBe(24.9)
expect(p.tags).toEqual(['camping'])`,
        },
        {
          name: 'tags default to an empty array and a new object is returned',
          code: `const { parseProduct } = requireModule('parseProduct.js')
const raw = { id: 1, name: 'Mug', price: 12 }
const p = parseProduct(raw)
expect(p.tags).toEqual([])
expect(p === raw).toBe(false)`,
        },
        {
          name: 'invalid prices throw a TypeError naming the field',
          code: `const { parseProduct } = requireModule('parseProduct.js')
let error = null
try { parseProduct({ id: 1, name: 'Mug', price: 'abc' }) } catch (e) { error = e }
expect(error instanceof TypeError).toBe(true)
expect(error.message).toContain('price')`,
        },
        {
          name: 'other invalid fields throw too',
          code: `const { parseProduct } = requireModule('parseProduct.js')
expect(() => parseProduct({ id: '1', name: 'Mug', price: 1 })).toThrow()
expect(() => parseProduct({ id: 1, name: '  ', price: 1 })).toThrow()
expect(() => parseProduct({ id: 1, name: 'Mug', price: 1, tags: [1] })).toThrow()
expect(() => parseProduct(null)).toThrow()`,
        },
        { name: 'the page shows the parsed product', code: `expect(text('.product')).toBe('Head Lamp costs 24.90')` },
      ],
    },
    {
      id: 'price-tag-props',
      title: 'Runtime props that mirror a TypeScript interface',
      difficulty: 'beginner',
      prompt: `
\`PriceTag.vue\` documents its intended TypeScript props in a comment but uses array syntax, so nothing is checked. Rewrite \`defineProps\` with **runtime declarations** that express the same contract:

- \`amount\`: \`Number\`, required.
- \`currency\`: \`String\`, default \`'EUR'\`, with a \`validator\` that accepts only \`'EUR'\`, \`'USD'\` and \`'INR'\`.
- \`compact\`: \`Boolean\`, default \`false\`.

Render \`<span class="price">\` as the currency symbol (€, $, ₹) followed by the amount with two decimals — or rounded to a whole number when \`compact\` is true.
`,
      files: { 'App.vue': priceTagApp, 'PriceTag.vue': priceTagStarter },
      hints: [
        'Use the object syntax: `defineProps({ amount: { type: Number, required: true }, … })`.',
        '`validator: (value) => [\'EUR\', \'USD\', \'INR\'].includes(value)` and `default: \'EUR\'` for currency.',
        'In the template: `{{ props.compact ? Math.round(props.amount) : props.amount.toFixed(2) }}`.',
      ],
      solution: {
        explanation: 'Each runtime option mirrors a part of the TS interface: `type: Number` ↔ `amount: number`, `required` ↔ no `?`, a validator ↔ the union `\'EUR\' | \'USD\' | \'INR\'`, `default` ↔ `withDefaults`. Vue checks them at runtime in development; TypeScript would check the same contract in the editor.',
        files: { 'App.vue': priceTagApp, 'PriceTag.vue': priceTagSolution },
      },
      tests: [
        {
          name: 'props are declared with types, required and defaults',
          code: `const props = requireModule('PriceTag.vue').default.props
expect(props.amount.type).toBe(Number)
expect(props.amount.required).toBe(true)
expect(props.currency.default).toBe('EUR')
expect(props.compact.type).toBe(Boolean)`,
        },
        {
          name: 'the currency validator accepts only EUR, USD and INR',
          code: `const { currency } = requireModule('PriceTag.vue').default.props
expect(currency.validator('USD')).toBe(true)
expect(currency.validator('INR')).toBe(true)
expect(currency.validator('GBP')).toBe(false)`,
        },
        {
          name: 'renders with defaults and with compact',
          code: `expect(text('.a .price')).toBe('€12.50')
expect(text('.b .price')).toBe('$100')`,
        },
        {
          name: 'works when mounted on its own',
          code: `const tag = mountFile('PriceTag.vue', { amount: 5, currency: 'INR' })
expect(tag.text()).toBe('₹5.00')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'why-typescript-benefits',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why would you use TypeScript in a Vue project? What are the costs?',
      answer: 'Benefits: type errors caught while editing and in CI instead of in production; autocompletion and inline docs for props, emits, stores and API data; safe refactoring; explicit contracts between components and teams. Vue is written in TS and has first-class support (`lang="ts"`, type-based `defineProps`, `vue-tsc` checking templates). Costs: learning curve and syntax, a separate type-check step (Vite doesn\'t check), occasional complex types (generics), and the risk of types that lie about runtime data.',
      explanation: 'TypeScript moves a class of bugs earlier; it doesn\'t validate runtime data or replace tests.',
      whyAsked: 'Shows whether you can weigh tools instead of following trends.',
      mistakes: ['Claiming TS validates data at runtime.', 'Listing only benefits.', 'Not knowing Vite skips type-checking.'],
      followUps: ['How do you check types in .vue templates?', 'How would you introduce TS into an existing JS project?'],
      modelAnswer: 'TypeScript lets the editor and CI catch shape errors — a wrong prop type, a typo in a store field, a string where a number belongs — before users do, and gives autocomplete and safe refactors across the codebase. Vue supports it first-class with lang="ts", type-based defineProps and vue-tsc, which checks templates too. The costs are a learning curve, more syntax, and a type-check step, because Vite only strips types. And types are erased at runtime, so API data still needs validation at the boundary.',
    },
    {
      id: 'why-typescript-runtime-data',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Your API client returns `Promise<User>`. Does TypeScript guarantee the server actually sent a `User`?',
      answer: 'No. Types are erased at build time; the `User` type is an assertion about data TypeScript never sees. If the backend changes or sends unexpected values, the code still compiles and fails at runtime. Validate at the boundary — type the raw JSON as `unknown`, check it with a guard or schema library (which can also derive the TS type), and convert it to the internal type — or generate types and validators from an API schema shared with the backend.',
      explanation: 'Types describe code; validation checks data.',
      whyAsked: 'A frequent misconception that leads to fragile apps.',
      mistakes: ['"Yes, because the function is typed."', 'Using `as User` everywhere.', 'Using `any` for responses.'],
      followUps: ['What is a type guard?', 'Where would you validate in a Vue app — component, composable or API layer?'],
      modelAnswer: 'No — the Promise<User> type is a claim, not a check, because types disappear at build time. If the backend sends something else, the code compiles and breaks at runtime. I treat responses as unknown, validate them once in the API layer with a guard or a schema library that also gives me the TypeScript type, and convert them to the app\'s internal types. After that boundary the types are honest, and the rest of the app can rely on them.',
    },
    {
      id: 'why-typescript-build-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate merged a PR with type errors; CI was green because it only runs `vite build` and tests. What happened and how do you prevent it?',
      answer: 'Vite transpiles TypeScript by stripping types and does not type-check, and test runners typically transpile the same way. So no step checked types. Add `vue-tsc --noEmit` (or `vue-tsc --build`, as create-vue projects do in their build script) to the build and as a required CI step; optionally run it in a pre-commit hook. Use `vue-tsc` rather than `tsc` so `.vue` files and templates are checked.',
      explanation: 'Editor squiggles are advice; CI is the gate.',
      whyAsked: 'Practical tooling knowledge for TypeScript Vue projects.',
      mistakes: ['Blaming TypeScript.', 'Using plain tsc, which can\'t read .vue files.'],
      followUps: ['How do you keep type-checking fast in a big repo?'],
      modelAnswer: 'Nothing in the pipeline actually checked types: Vite only removes them, and the tests are transpiled the same way. I\'d add vue-tsc with noEmit — or the build mode create-vue uses — as a required CI step and to the build script, so type errors fail the pipeline. It has to be vue-tsc rather than plain tsc, so single-file components and templates are included.',
    },
    {
      id: 'why-typescript-erasure-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What JavaScript does the build produce for `const qty: number = Number(input); function add(a: number, b: number): number { return a + b }`?',
      options: [
        'The same code — browsers understand type annotations',
        'const qty = Number(input); function add(a, b) { return a + b }',
        'Code with runtime checks that throw if a or b is not a number',
        'Nothing — typed functions are removed',
      ],
      correctOption: 1,
      answer: 'The annotations are removed: `const qty = Number(input); function add(a, b) { return a + b }`. No runtime checks are added.',
      explanation: 'TypeScript\'s types (and interfaces) produce no runtime code. That\'s why they can\'t validate runtime data.',
      whyAsked: 'Confirms understanding of type erasure, which explains most TS misconceptions.',
      mistakes: ['Believing TS adds runtime checks.', 'Believing browsers run TypeScript.'],
      followUps: ['Which TypeScript features do produce runtime code (e.g. enums)?'],
      modelAnswer: 'The types are simply erased, so the output is const qty = Number(input) and function add(a, b) returning a + b. TypeScript doesn\'t add runtime checks; it only verifies the code before the build. That\'s why external data still needs runtime validation.',
    },
    {
      id: 'why-typescript-migration',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How would you migrate a large JavaScript Vue 3 codebase to TypeScript without stopping feature work?',
      answer: 'Incrementally: (1) add TS tooling (tsconfig with `allowJs`, `vue-tsc`, editor extension) and a CI type-check that initially covers converted files; (2) start with leaves and boundaries — API layer types and validators, utility modules, stores — since they give the most leverage; (3) new components in `lang="ts"`; convert existing ones when touched; (4) use JSDoc + `// @ts-check` for JS files not yet converted; (5) ratchet strictness (start with `strict` for new code or enable flags progressively; track and reduce `any`/`@ts-expect-error`); (6) share types between frontend and backend where possible (OpenAPI-generated types). Measure progress and keep runtime validation at the boundaries.',
      explanation: 'Types pay off most at boundaries and in shared code; convert there first.',
      whyAsked: 'Senior question about change management, not syntax.',
      mistakes: ['Big-bang conversion.', 'Disabling strictness forever.', 'Converting UI leaf components first while the data layer stays untyped.'],
      followUps: ['How do you handle third-party libraries without types?', 'How do you stop `any` from spreading?'],
      modelAnswer: 'I\'d do it incrementally. First the tooling: tsconfig with allowJs, vue-tsc in CI, the editor extension. Then the highest-leverage code: the API layer with validated, typed responses, shared utilities and the stores, because everything else depends on them. New components are written in TypeScript and old ones converted when we touch them, with JSDoc and ts-check covering the rest in the meantime. Strictness is ratcheted up and we track any and expect-error counts so they go down, ideally sharing generated API types with the backend.',
    },
    {
      id: 'why-typescript-prototype-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A two-person team is building a quick prototype to test a product idea in two weeks. Someone insists on TypeScript with maximum strictness. What would you advise?',
      answer: 'It depends on the team\'s fluency and the prototype\'s future. If both are comfortable with TS and the prototype may become the product, TS with `strict` is cheap insurance (create-vue sets it up in seconds). If they\'re new to TS, the learning curve competes with the deadline — plain JS with runtime prop validation, JSDoc on key functions and a few tests is a fine choice, and migration later is possible. Either way, validate API data at the boundary.',
      explanation: 'TypeScript is a trade-off, not a moral question.',
      whyAsked: 'Tests pragmatism.',
      mistakes: ['Dogmatic answers in either direction.'],
      followUps: ['What would change your recommendation?'],
      modelAnswer: 'I\'d decide by fluency and lifespan. If the team already writes TypeScript comfortably and the prototype might become the product, strict TS from day one costs little and saves a migration. If they\'re learning it, the deadline matters more: plain JavaScript with runtime prop validation, JSDoc on the important functions and a few tests is perfectly reasonable, and we can migrate later. In both cases API data gets validated at the boundary.',
    },
    {
      id: 'why-typescript-coding-guard',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write `isUser(value)` in `isUser.js`: return `true` only for objects shaped like `{ id: number, email: string (containing "@"), roles: string[] }`. In TypeScript this would be a type guard `(value: unknown): value is User`.',
      starter: { files: { 'isUser.js': guardStarter, 'App.vue': guardApp } },
      tests: [
        { name: 'accepts a valid user', code: `const { isUser } = requireModule('isUser.js')\nexpect(isUser({ id: 1, email: 'ada@example.com', roles: ['admin'] })).toBe(true)\nexpect(isUser({ id: 2, email: 'bea@example.com', roles: [] })).toBe(true)` },
        { name: 'rejects wrong field types', code: `const { isUser } = requireModule('isUser.js')\nexpect(isUser({ id: '1', email: 'a@b.c', roles: [] })).toBe(false)\nexpect(isUser({ id: 1, email: 'not-an-email', roles: [] })).toBe(false)\nexpect(isUser({ id: 1, email: 'a@b.c', roles: [1] })).toBe(false)` },
        { name: 'rejects missing fields and non-objects', code: `const { isUser } = requireModule('isUser.js')\nexpect(isUser({ id: 1, email: 'a@b.c' })).toBe(false)\nexpect(isUser(null)).toBe(false)\nexpect(isUser('user')).toBe(false)` },
      ],
      hints: [
        'Check `typeof value === \'object\' && value !== null` first — `typeof null` is `\'object\'`.',
        'Then check each field\'s type with `typeof` and `Array.isArray`.',
        '`value.roles.every((r) => typeof r === \'string\')` validates every role.',
      ],
      answer: 'Chain the checks with `&&`: object and not null, numeric id, string email containing "@", roles is an array whose every element is a string.',
      solution: { files: { 'isUser.js': guardSolution, 'App.vue': guardApp } },
      explanation: 'A guard is a runtime check whose result TypeScript can trust: in TS you\'d write `function isUser(value: unknown): value is User`, and inside `if (isUser(x))` the compiler treats `x` as a `User`. The runtime logic is identical in JavaScript.',
      whyAsked: 'Type guards are the bridge between runtime data and static types.',
      mistakes: ['Forgetting `typeof null === \'object\'`.', 'Checking only that fields exist, not their types.', 'Not validating array elements.'],
      followUps: ['How would you write this as a TypeScript type guard?', 'When would you switch to a schema library?'],
      modelAnswer: 'I check that the value is a non-null object, then each field: a numeric id, a string email containing an at sign, and roles as an array where every element is a string, all combined with and. In TypeScript the signature would be value: unknown, value is User, so inside an if the compiler narrows the type. For bigger shapes I\'d use a schema library that generates both the check and the type.',
    },
  ],

  takeaways: [
    'TypeScript adds types that tools check while you edit and in CI; they\'re erased in the build.',
    'Vue supports TS first-class: `<script setup lang="ts">`, type-based `defineProps`, `vue-tsc` (checks templates too).',
    'Vite strips types but doesn\'t check them — run `vue-tsc` in your build/CI.',
    'Types don\'t validate runtime data: validate and convert API/storage data at the boundary.',
    'In JavaScript, runtime prop declarations, guards and JSDoc + `@ts-check` give part of the benefit.',
    'Adopt incrementally, enable `strict`, avoid `any` — or choose JavaScript deliberately for small projects.',
  ],
}
