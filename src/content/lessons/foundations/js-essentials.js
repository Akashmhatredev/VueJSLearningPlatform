// Lesson: JavaScript essentials — values, objects, functions & closures.

const counterModule = `// A factory function: every call creates a NEW, private \`count\`.
export function createCounter(start = 0) {
  let count = start

  function increment() {
    count = count + 1
    return count
  }

  function current() {
    return count
  }

  return { increment, current }
}`

const essentialsMain = `import { createCounter } from './counter.js'

const app = document.getElementById('app')

app.innerHTML = \`
  <section>
    <h3>Closures: two counters, two private counts</h3>
    <button class="apples">Apples: 0</button>
    <button class="pears">Pears: 0</button>
  </section>
  <section>
    <h3>References: one object, two names</h3>
    <p class="original"></p>
    <p class="copy"></p>
  </section>
\`

// Each call returns functions that remember THEIR OWN count
const apples = createCounter()
const pears = createCounter()

app.querySelector('.apples').addEventListener('click', (event) => {
  event.target.textContent = 'Apples: ' + apples.increment()
})
app.querySelector('.pears').addEventListener('click', (event) => {
  event.target.textContent = 'Pears: ' + pears.increment()
})

// \`=\` does not copy objects: both names point to the SAME object
const original = { name: 'Ada', skills: ['maths'] }
const copy = original
copy.name = 'Grace'

app.querySelector('.original').textContent = 'original.name is ' + original.name
app.querySelector('.copy').textContent = 'copy.name is ' + copy.name

console.log('apples === pears:', apples === pears)
console.log('typeof apples.increment:', typeof apples.increment)`

export default {
  id: 'js-essentials',
  title: 'JavaScript essentials: values, objects, functions & closures',
  summary: 'The core JavaScript ideas Vue leans on every day: values versus references, truthiness, functions as values, scope and closures.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['how-the-web-works'],
  related: ['dom-and-events', 'modern-js-syntax', 'array-methods', 'ref', 'composables-intro', 'options-api'],
  tags: ['javascript', 'variables', 'let', 'const', 'types', 'equality', 'truthy', 'falsy', 'objects', 'references', 'functions', 'arrow functions', 'scope', 'closures', 'this'],
  apis: [
    { name: 'let / const', summary: 'Block-scoped variable declarations. `const` forbids reassigning the variable, not changing the object it points to.' },
    { name: '=== (strict equality)', summary: 'Compares without type conversion. Objects are equal only if they are the same object.' },
    { name: 'typeof', summary: 'Returns a string naming a value\'s type (`"number"`, `"object"`, `"function"`…).' },
    { name: 'Array.isArray()', summary: 'The reliable way to check for an array (`typeof []` is `"object"`).' },
    { name: 'Object.is()', summary: 'Like `===` but treats `NaN` as equal to itself and `+0`/`-0` as different. Vue uses this rule to decide whether a ref really changed.' },
  ],
  docs: [
    { label: 'MDN — JavaScript data types and data structures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures' },
    { label: 'MDN — Equality comparisons and sameness', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness' },
    { label: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures' },
    { label: 'MDN — Functions', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions' },
    { label: 'Vue Guide — Composables', url: 'https://vuejs.org/guide/reusability/composables.html' },
  ],

  intro: `
You don't need *all* of JavaScript to write Vue — but you need a few parts of it really well. This lesson is those parts:

- **Values**: the kinds of data JavaScript has, and the crucial difference between a *primitive* (a number, a string) and an *object* (an object, an array, a function).
- **Variables**: \`let\` and \`const\`, and what \`const\` actually promises.
- **Comparisons and truthiness**: \`===\`, and which values count as "false" in an \`if\`.
- **Functions**: values you can store, pass around and return.
- **Closures**: functions that remember the variables around them — the idea every Vue *composable* is built on.
`,

  why: `
Most confusing Vue bugs are really JavaScript bugs wearing a Vue costume:

- "I changed the copy and the original changed too" → **references**: \`=\` doesn't copy objects.
- "The price of a free item shows *unavailable*" → **truthiness**: \`0\` is falsy, so \`v-if="price"\` hides it.
- "\`this\` is undefined in my method" → **arrow functions** don't get their own \`this\` (an Options API trap).
- "Both components share the same counter" / "Each component gets its own counter" → **closures and scope** decide which.

Vue's own design is pure JavaScript too. A \`ref\` is an *object* (that's why you write \`.value\`), \`reactive()\` returns a *proxy object*, and a [composable](lesson:composables-intro) is just a *function that closes over* some reactive state. Learn these ideas once and a lot of Vue stops being magic.
`,

  eli15: `
Imagine two kinds of things you can hand to a friend.

A **primitive** (a number, a piece of text, true/false) is like a **photocopy**. If I give you a copy of my score — 10 — and you scribble 99 on yours, mine still says 10.

An **object** (a list, a profile, a cart) is like a **shared Google Doc link**. If I give you the link and you change the doc, *I see the change too*, because we're both looking at the same doc. Writing \`const copy = original\` just shares the link.

A **function** is a recipe you can pass around like any other value. And a **closure** is a recipe that remembers the kitchen it was written in: a \`createCounter()\` recipe hands back an "add one" button that remembers *its own* count, even after \`createCounter\` has finished. Call \`createCounter()\` twice and you get two buttons with two separate counts.
`,

  analogy: {
    title: 'Photocopies, shared links and backpacks',
    body: `
Handing someone a **photocopy** gives them their own independent version. Handing them a **shared link** gives them access to the one original.

A closure is like a **backpack**: when a function is created inside another function, it packs the variables it can see and carries them wherever it goes. Each time the outer function runs, a brand-new backpack is packed.
`,
    mapping: [
      ['a photocopy', 'a primitive value copied into another variable'],
      ['a shared document link', 'a reference to an object or array'],
      ['editing the shared document', 'mutating an object through any variable that points to it'],
      ['a backpack of variables', 'a closure: the variables a function remembers'],
      ['packing a new backpack each call', 'each `createCounter()` call gets its own private `count`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Values are copied, objects are shared',
    caption: 'Step through two assignments. A number is copied into the new variable; an object is not — both variables end up pointing to the same object.',
    alt: 'Four variable boxes on the left — score, bonus, original and copy — and one object box on the right holding name Ada. Steps show score 10 copied into bonus, then bonus changed without affecting score; then original and copy both drawn with arrows to the same object, and copy.name = Grace changing what both see.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'score', label: 'score', note: '10', tone: 'acid', x: 110, y: 60 },
        { id: 'bonus', label: 'bonus', note: '10 → 99', tone: 'acid', x: 300, y: 60 },
        { id: 'original', label: 'original', note: 'reference', tone: 'cobalt', x: 110, y: 230 },
        { id: 'copy', label: 'copy', note: 'reference', tone: 'cobalt', x: 300, y: 230 },
        { id: 'obj', label: '{ name: "Ada" }', note: 'one object in memory', tone: 'kraft', x: 590, y: 230 },
      ],
      edges: [
        { from: 'score', to: 'bonus', label: 'value copied' },
        { from: 'original', to: 'obj', label: 'points to' },
        { from: 'copy', to: 'obj', label: 'points to', dashed: true },
      ],
      steps: [
        { focus: ['score'], text: '`let score = 10` stores the number 10 in `score`.' },
        { focus: ['score', 'bonus'], edges: ['score->bonus'], text: '`let bonus = score` **copies the value**. Then `bonus = 99` changes only `bonus` — `score` is still 10. Strings, booleans, `null` and `undefined` behave the same way.' },
        { focus: ['original', 'obj'], edges: ['original->obj'], text: '`const original = { name: \'Ada\' }` creates an object somewhere in memory; the variable holds a **reference** — a way to find it.' },
        { focus: ['copy', 'obj'], edges: ['original->obj', 'copy->obj'], text: '`const copy = original` copies the **reference**, not the object. There is still only one object.' },
        { focus: ['obj'], edges: ['original->obj', 'copy->obj'], text: '`copy.name = \'Grace\'` changes the shared object, so `original.name` is now `\'Grace\'` too. To get an independent object, make one: `{ ...original }` (next lesson).' },
      ],
    },
  },

  syntax: [
    `
#### Values and types

JavaScript has **primitive** values — \`string\`, \`number\`, \`boolean\`, \`null\`, \`undefined\`, \`bigint\`, \`symbol\` — and **objects** (plain objects, arrays, functions, dates, maps…). Primitives are copied; objects are shared by reference.
`,
    {
      code: `typeof 'Ada'         // "string"
typeof 42            // "number"   (integers and decimals are both numbers)
typeof true          // "boolean"
typeof undefined     // "undefined" — "no value was given"
typeof null          // "object"   ← a famous historical quirk; null is a primitive
typeof { a: 1 }      // "object"
typeof [1, 2]        // "object"   → use Array.isArray([1, 2]) // true
typeof function () {} // "function"`,
      lang: 'js',
      title: 'typeof',
    },
    `
#### Variables: \`let\` and \`const\`
`,
    {
      code: `let total = 0       // can be reassigned
total = total + 5

const user = { name: 'Ada' }
user.name = 'Grace' // ✅ allowed: we changed the object, not the variable
user = {}           // ❌ TypeError: Assignment to constant variable.

// var is the old, function-scoped keyword. Prefer let/const.`,
      lang: 'js',
      title: 'let and const',
    },
    `
\`const\` means "this variable will always point to the same thing". It does **not** freeze the thing. That's why Vue code says \`const count = ref(0)\` and then changes \`count.value\`.

#### Comparing: always \`===\`
`,
    {
      code: `5 === 5            // true
5 === '5'          // false — different types
5 == '5'           // true  — == converts types first (avoid)
null == undefined  // true  — the one == people sometimes use on purpose

{ id: 1 } === { id: 1 }  // false — two different objects
const a = { id: 1 }
const b = a
a === b                  // true  — same object

NaN === NaN              // false — use Number.isNaN(x)`,
      lang: 'js',
      title: 'equality',
    },
    `
#### Truthy and falsy

\`if (x)\`, \`x && y\`, \`!x\` — and Vue's \`v-if="x"\` — treat these eight values as **false**: \`false\`, \`0\`, \`-0\`, \`0n\`, \`''\` (empty string), \`null\`, \`undefined\`, \`NaN\`. **Everything else is truthy**, including \`'0'\`, \`'false'\`, \`[]\` and \`{}\`.
`,
    {
      code: `if (cart.length) { /* has items */ }       // fine: 0 means empty
if (price) { /* ... */ }                   // ⚠ a price of 0 is skipped!
if (price !== null && price !== undefined) // explicit
if (price != null)                         // same thing, shorter`,
      lang: 'js',
      title: 'truthiness in practice',
    },
    `
#### Functions are values
`,
    {
      code: `function add(a, b) {          // declaration (hoisted: usable before this line)
  return a + b
}

const double = function (n) { // expression stored in a variable
  return n * 2
}

const triple = (n) => n * 3   // arrow function; single expression = implicit return

button.addEventListener('click', () => save()) // passed as an argument (a "callback")`,
      lang: 'js',
      title: 'three ways to write a function',
    },
    `
#### Scope and closures

A variable is visible inside the block \`{ }\` where it's declared, and in every block nested inside. A function created inside another function **keeps access** to the outer variables, even after the outer function has returned. That remembered environment is a **closure**.
`,
    {
      code: `function createCounter() {
  let count = 0                  // private to this call
  return function increment() {
    count = count + 1            // still reachable later: closure
    return count
  }
}

const a = createCounter()
const b = createCounter()
a() // 1
a() // 2
b() // 1 — b has its own count`,
      lang: 'js',
      title: 'a closure',
    },
    {
      callout: 'note',
      title: 'Why this matters for Vue',
      text: 'A composable like `useCounter()` is this exact pattern with a `ref` inside: each component that calls it gets its own state. Create the ref *outside* the function instead, and every caller shares one — see [Composables](lesson:composables-intro).',
    },
    `
#### \`this\` in one paragraph

A regular \`function\` gets its \`this\` from **how it is called** (\`cart.total()\` → \`this\` is \`cart\`). An arrow function has **no \`this\` of its own** — it uses the \`this\` of the code around it. In Vue's Options API, define \`methods\` as regular functions so Vue can bind \`this\` to the component. The Composition API (\`<script setup>\`) doesn't use \`this\` at all.
`,
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: essentialsMain,
    intro: 'Two experiments in one file: closures on top, references at the bottom. Open `counter.js` too — it is the factory being used.',
    steps: [
      { lines: [1], text: 'We import `createCounter` from `counter.js`. It is a plain function that returns an object of two functions.' },
      { lines: [18, 20], text: 'Two calls → two separate closures. Inside each, a private `count` starts at 0. Nothing outside can read or change it except through the returned functions.' },
      { lines: [22, 27], text: 'Each button calls *its own* counter\'s `increment()`. Clicking Apples never affects Pears, because they closed over different `count` variables.' },
      { lines: [29, 32], text: 'The reference trap: `const copy = original` does not create a second object. `copy.name = \'Grace\'` edits the one shared object.' },
      { lines: [34, 35], text: 'So both paragraphs say Grace. If `original` were a parent component\'s data and `copy` a child\'s "local copy", the child just changed the parent\'s data.' },
      { lines: [37, 38], text: 'Open the console: `apples === pears` is `false` (two different objects), and `typeof apples.increment` is `"function"` — functions are values stored in properties.' },
    ],
  },

  playground: {
    title: 'Closures and references lab',
    objective: 'Change a closure-based counter and fix a reference bug, and see how each change affects what is shared and what is private.',
    files: { 'main.js': essentialsMain, 'counter.js': counterModule },
    expected: 'Two buttons, **Apples: 0** and **Pears: 0**, that count independently. Below them, both lines say **Grace** — the reference trap in action. The console shows `apples === pears: false`.',
    experiments: [
      {
        id: 'pears-from-10',
        task: 'Make the Pears counter **start at 10**: the button should read **Pears: 10** at first and **Pears: 11** after one click. Apples must still start at 0.',
        hint: '`createCounter` already accepts a starting value. Also update the button\'s initial label in the HTML string.',
        tests: [
          { name: 'Pears starts at 10 and counts up', code: `expect(text('.pears')).toBe('Pears: 10')\nawait click('.pears')\nexpect(text('.pears')).toBe('Pears: 11')` },
          { name: 'Apples is unaffected', code: `await click('.apples')\nexpect(text('.apples')).toBe('Apples: 1')` },
        ],
        explain: 'The argument was captured in the closure as `start`/`count` for that call only. One factory, many independent instances — exactly how a composable called by two components behaves.',
      },
      {
        id: 'real-copy',
        task: 'Fix the reference trap: make `copy` a **separate object** so that changing `copy.name` leaves `original.name` as **Ada**.',
        hint: 'Create a new object with the same properties: `const copy = { ...original }` (spread syntax — more in the next lesson) or `Object.assign({}, original)`.',
        tests: [
          { name: 'original stays Ada, copy becomes Grace', code: `expect(text('.original')).toBe('original.name is Ada')\nexpect(text('.copy')).toBe('copy.name is Grace')` },
        ],
        explain: 'Now there are two objects. Careful: this is a **shallow** copy — `copy.skills` and `original.skills` still point to the *same* array. Push to one and both see it.',
      },
      {
        id: 'reset',
        task: 'In `counter.js`, add a `reset()` function to the returned object. It sets the count back to the **starting value** and returns it.',
        hint: 'Inside `createCounter`, write `function reset() { count = start; return count }` and add `reset` to the returned object.',
        tests: [
          { name: 'reset() goes back to the start value', code: `const { createCounter } = requireModule('counter.js')\nconst c = createCounter(5)\nc.increment()\nc.increment()\nexpect(c.reset()).toBe(5)\nexpect(c.current()).toBe(5)` },
          { name: 'resetting one counter leaves another alone', code: `const { createCounter } = requireModule('counter.js')\nconst a = createCounter()\nconst b = createCounter()\na.increment(); b.increment(); b.increment()\na.reset()\nexpect(a.current()).toBe(0)\nexpect(b.current()).toBe(2)` },
        ],
        explain: '`reset` was created in the same call as `count` and `start`, so it closes over the same variables as `increment`. Functions created together share one backpack.',
      },
      {
        id: 'predict',
        task: 'Before running, predict what these print, then add them to the end of `main.js` and check the console: `console.log(original === copy)`, `console.log({ a: 1 } === { a: 1 })`, `console.log(typeof null)`.',
        hint: 'Objects are equal only when they are the very same object.',
        explain: '`original === copy` is `true` with the trap and `false` after your fix. Two separate literals are never `===`. `typeof null` is `"object"` — a decades-old quirk kept for compatibility.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'How a closure keeps state alive',
    caption: 'Step through two calls to `createCounter()`. Each call creates a fresh scope; the returned function keeps that scope alive.',
    alt: 'A diagram with a createCounter function box in the middle, two scope boxes (count for call A and count for call B) and two returned functions, a and b, each connected to its own scope. Steps show the first call creating scope A, returning a, then a second call creating scope B, and a() changing only scope A.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'factory', label: 'createCounter()', note: 'the factory', tone: 'ink' },
        { id: 'scopeA', label: 'scope of call A', note: 'count = 0 → 2', tone: 'kraft' },
        { id: 'fnA', label: 'a()', note: 'returned function', tone: 'acid' },
        { id: 'empty', label: 'garbage collector', note: 'frees unused scopes', tone: 'paper' },
        { id: 'scopeB', label: 'scope of call B', note: 'count = 0 → 1', tone: 'kraft' },
        { id: 'fnB', label: 'b()', note: 'returned function', tone: 'acid' },
      ],
      edges: [
        { from: 'factory', to: 'scopeA', label: 'call A' },
        { from: 'fnA', to: 'scopeA', label: 'remembers' },
        { from: 'factory', to: 'scopeB', label: 'call B' },
        { from: 'fnB', to: 'scopeB', label: 'remembers' },
      ],
      steps: [
        { focus: ['factory', 'scopeA'], edges: ['factory->scopeA'], text: '`const a = createCounter()` runs the factory. A new scope is created holding `let count = 0`.' },
        { focus: ['fnA', 'scopeA'], edges: ['fnA->scopeA'], text: 'The factory returns the inner function and finishes. Normally its variables would be thrown away — but the returned function still refers to `count`, so the scope stays alive. That link is the **closure**.' },
        { focus: ['factory', 'scopeB', 'fnB'], edges: ['factory->scopeB', 'fnB->scopeB'], text: '`const b = createCounter()` runs the factory **again**: a second, separate scope with its own `count = 0`.' },
        { focus: ['fnA', 'scopeA'], edges: ['fnA->scopeA'], text: '`a(); a()` changes only scope A (count 2). `b()` changes only scope B (count 1). Nobody else can reach either `count` — it is truly private.' },
        { focus: ['empty'], text: 'If you drop every reference to `a` (say, a component unmounts), nothing can reach scope A any more and the garbage collector can free it. Keeping functions referenced keeps their closures — and their memory — alive.' },
      ],
    },
  },

  internals: {
    beginner: `
Every time a function runs, JavaScript creates a little "room" for its variables. Usually the room is cleaned up when the function ends. But if the function hands out an inner function that still uses those variables, the room is kept — that's a closure. Objects live in memory on their own; variables just hold the address, which is why two variables can point at the same object.
`,
    technical: [
      `
**Lexical scope.** Which variables a function can see is decided by where it is *written*, not where it is *called*. Each function keeps a hidden link to the environment it was created in; looking up a name walks outward through those environments.

**Pass-by-sharing.** Arguments are passed like assignments: primitives arrive as copies, objects arrive as references. A function can therefore mutate an object you pass in, but reassigning the parameter (\`user = {…}\`) only changes its local variable.
`,
      {
        code: `function rename(user) {
  user.name = 'Grace'       // mutates the caller's object
  user = { name: 'Linus' }  // only rebinds the local parameter
}

const u = { name: 'Ada' }
rename(u)
u.name // 'Grace'`,
        lang: 'js',
        title: 'mutating vs reassigning a parameter',
      },
      `
**How Vue builds on this:**

- \`ref(0)\` returns an *object* with a \`value\` property. JavaScript can't observe a plain variable being read or written, but it *can* run code when an object property is accessed — so Vue wraps values in objects.
- \`reactive(obj)\` returns a **Proxy**, a different object that wraps \`obj\`. \`reactive(obj) === obj\` is \`false\`, which is why you should keep using the proxy.
- When you assign \`count.value = x\`, Vue only triggers updates if the value really changed according to \`Object.is\`. Mutating the *same* object inside a ref is detected through the deep proxy, not through \`===\`.
`,
    ],
    production: `
- **Copy before you edit shared data.** Edit forms usually work on \`{ ...props.user }\` and emit the result, so the parent's data isn't mutated behind its back — see [Props & one-way data flow](lesson:props).
- \`{ ...obj }\` and \`[...arr]\` are **shallow** copies. For deep copies of plain data use \`structuredClone()\` — but note it can't clone functions, and it throws on Vue's reactive proxies; pass \`toRaw(state)\` or a plain object instead.
- **Closures hold memory.** A listener on \`window\` that closes over a big object keeps that object alive until the listener is removed. Clean up in \`onUnmounted\`.
- **Module-level variables are shared.** A \`let\` at the top of a module is one variable for the whole app — handy for deliberate shared state, a source of bugs (and of cross-request leaks with server-side rendering) when accidental. See [ES modules](lesson:es-modules).
- Use a linter (ESLint's \`eqeqeq\` rule) to forbid \`==\`, and \`no-param-reassign\` to catch accidental parameter mutation.
`,
  },

  mistakes: [
    {
      title: 'Thinking `=` copies an object',
      wrong: { code: `const draft = props.user  // same object!\ndraft.name = input.value  // silently edits the parent's data`, lang: 'js' },
      right: { code: `const draft = { ...props.user } // a new (shallow) object\ndraft.name = input.value`, lang: 'js' },
      explanation: 'Assignment copies the reference, so both names reach the same object. Create a new object when you want an independent copy.',
    },
    {
      title: 'Letting `0` or `\'\'` fall through a truthiness check',
      wrong: { code: `function priceLabel(price) {\n  if (!price) return 'Price unavailable'  // free items (0) land here\n  return '$' + price\n}`, lang: 'js' },
      right: { code: `function priceLabel(price) {\n  if (price == null) return 'Price unavailable'  // only null/undefined\n  return '$' + price\n}`, lang: 'js' },
      explanation: '`!price` is true for `0`. Check for exactly the "missing" values you mean. The same trap hides zero counts with `v-if="count"` in templates.',
    },
    {
      title: 'Arrow functions as Options API methods',
      wrong: { code: `export default {\n  data: () => ({ count: 0 }),\n  methods: {\n    increment: () => {\n      this.count++ // this is NOT the component\n    },\n  },\n}`, lang: 'js' },
      right: { code: `export default {\n  data: () => ({ count: 0 }),\n  methods: {\n    increment() {\n      this.count++\n    },\n  },\n}`, lang: 'js' },
      explanation: 'Arrow functions take `this` from the surrounding code, so Vue can\'t bind it to the component. The Vue docs say to avoid arrow functions for `methods`. (`data: () => ({…})` is fine because it doesn\'t use `this`.)',
    },
    {
      title: 'Using `==` and getting surprised by conversions',
      wrong: { code: `if (input.value == 0) { … }  // '' == 0 is true!`, lang: 'js' },
      right: { code: `if (Number(input.value) === 0) { … }`, lang: 'js' },
      explanation: '`==` converts both sides before comparing, with rules few people remember. Convert explicitly, then compare with `===`.',
    },
  ],

  debugging: [
    {
      symptom: 'Editing a "copy" changes the original (or a child edit changes the parent\'s list).',
      cause: 'Both variables reference the same object or array.',
      fix: 'Make a new object/array: `{ ...obj }`, `[...arr]`, or `structuredClone(plainObj)` for nested data. Check with `a === b` in the console.',
    },
    {
      symptom: 'A value of 0 or an empty string is treated as "missing".',
      cause: 'A truthiness check (`if (!x)`, `x || default`, `v-if="x"`) treats them as false.',
      fix: 'Compare explicitly (`x == null`, `x === \'\'`) or use `??` for defaults (next lesson).',
    },
    {
      symptom: '`TypeError: Cannot read properties of undefined (reading \'count\')` inside a method.',
      cause: '`this` isn\'t what you expect: an arrow function in `methods`, or a method passed as a callback and called without its object.',
      fix: 'Use regular method syntax in the Options API; in plain JavaScript wrap the call (`() => cart.total()`) or prefer closures over `this`.',
    },
    {
      symptom: 'Two components unexpectedly share state (or unexpectedly don\'t).',
      cause: 'Whether state is created inside a function (one per call) or at module level (one for everyone).',
      fix: 'Put the `let`/`ref` inside the function for per-caller state, outside for shared state — and make the choice deliberately.',
    },
  ],

  bestPractices: [
    'Default to `const`; use `let` only when you will reassign. Never use `var` in new code.',
    'Always compare with `===` / `!==`; the only common exception is `x == null` to mean "null or undefined".',
    'Check for exactly the values you mean instead of relying on truthiness when `0` or `\'\'` are valid.',
    'Treat objects you didn\'t create (props, function arguments) as read-only; copy before changing.',
    'Use closures (factory functions, composables) for private state instead of global variables.',
    'Use regular functions for Options API `methods`; use arrow functions for short callbacks.',
  ],

  useCases: [
    'Composables: a function that creates refs and returns them — one closure per component.',
    'Event handlers that remember which item they belong to: `() => remove(todo.id)`.',
    'Copying a record before editing it in a form, so Cancel can discard changes.',
    'Factory functions for API clients that hold a base URL and token privately.',
    'Debounce/throttle helpers, which keep their timer id in a closure.',
  ],

  whenToUse: {
    use: [
      'Closures when you need private state per instance (counters, timers, caches).',
      '`const` for every binding that won\'t be reassigned — including refs and reactive objects.',
      'A shallow copy (`{ ...obj }`) before editing data you don\'t own.',
    ],
    avoid: [
      '`==` (except `== null`), and `var`.',
      'Truthiness checks on numbers and strings where 0 or empty are valid values.',
      'Arrow functions where you need a dynamic `this` (Options API methods, object methods that use `this`).',
      'Module-level mutable variables unless you deliberately want app-wide shared state.',
    ],
  },

  comparison: {
    title: 'Primitives vs objects',
    headers: ['', 'Primitives', 'Objects (incl. arrays, functions)'],
    rows: [
      ['Examples', '`42`, `\'Ada\'`, `true`, `null`, `undefined`', '`{ name: \'Ada\' }`, `[1, 2]`, `() => {}`'],
      ['`b = a` gives you', 'an independent copy of the value', 'a second reference to the same object'],
      ['Can be changed in place?', 'no — you can only replace them', 'yes — properties and items can change'],
      ['`===` compares', 'the values', 'identity: is it the same object?'],
      ['In Vue', 'wrap in `ref()` to make reactive', '`ref()` or `reactive()`; nested changes are tracked'],
    ],
    note: 'This is why Vue needs `ref()` for primitives: a number can\'t be observed in place, but an object\'s `.value` property can. See [ref()](lesson:ref).',
  },

  quiz: [
    {
      id: 'js-essentials-q1',
      type: 'mcq',
      prompt: 'Which line throws an error?',
      code: { lang: 'js', code: `const user = { name: 'Ada' }\nuser.name = 'Grace'   // A\nuser.age = 36         // B\nuser = { name: 'Linus' } // C` },
      options: [
        { text: 'A', why: 'Changing a property of a `const` object is allowed — the variable still points to the same object.' },
        { text: 'B', why: 'Adding a property is also just changing the object.' },
        { text: 'C' },
        { text: 'None of them', why: 'Reassigning a `const` variable is a TypeError.' },
      ],
      answer: 2,
      explanation: '`const` forbids reassigning the *variable*. The object it points to can still change. That is why `const count = ref(0)` works with `count.value++`.',
    },
    {
      id: 'js-essentials-q2',
      type: 'output',
      prompt: 'What is logged?',
      code: { lang: 'js', code: `const a = { likes: 1 }\nconst b = a\nb.likes++\nconsole.log(a.likes)` },
      options: [
        { text: '1', why: '`b` is not a copy — it references the same object as `a`.' },
        { text: '2' },
        { text: 'undefined', why: '`a.likes` exists; it was changed through `b`.' },
        { text: 'TypeError', why: 'Mutating a property of a `const` object is allowed.' },
      ],
      answer: 1,
      explanation: '`a` and `b` reference one object. Incrementing `b.likes` changes what `a.likes` reads.',
    },
    {
      id: 'js-essentials-q3',
      type: 'output',
      prompt: 'What does the last line log?',
      code: { lang: 'js', code: `function makeCounter() {\n  let n = 0\n  return () => ++n\n}\n\nconst c1 = makeCounter()\nconst c2 = makeCounter()\nc1()\nc1()\nconsole.log(c1(), c2())` },
      options: [
        { text: '3 1' },
        { text: '3 4', why: 'That would mean `c1` and `c2` share `n`. Each `makeCounter()` call creates its own `n`.' },
        { text: '1 1', why: '`c1` has already been called twice before the log, and its `n` is remembered.' },
        { text: '0 0', why: '`++n` increments first and returns the new value.' },
      ],
      answer: 0,
      explanation: 'Each call to `makeCounter` creates a separate closure. `c1`\'s `n` reaches 3; `c2`\'s `n` is incremented for the first time to 1.',
    },
    {
      id: 'js-essentials-q4',
      type: 'bug',
      prompt: 'A free sticker (price `0`) shows **Price unavailable**. Click the line with the bug.',
      code: { lang: 'js', code: `function priceLabel(price) {\n  if (!price) {\n    return 'Price unavailable'\n  }\n  return '$' + price.toFixed(2)\n}\n\npriceLabel(0)` },
      answerLine: 2,
      explanation: '`!price` is true for `0` because 0 is falsy. Check for the missing values you mean: `if (price == null)` (null or undefined).',
    },
    {
      id: 'js-essentials-q5',
      type: 'fill',
      prompt: 'Fill the blanks: make `copy` a separate object, then check the original is untouched using strict equality.',
      code: { lang: 'js', code: `const original = { name: 'Ada' }\nconst copy = { ___original }\ncopy.name = 'Grace'\nconsole.log(original.name ___ 'Ada') // true` },
      answer: [['...'], ['===']],
      explanation: '`{ ...original }` spreads the properties into a new object. `===` compares without type conversion.',
    },
    {
      id: 'js-essentials-q6',
      type: 'mcq',
      prompt: 'Select **all** the falsy values.',
      options: [
        { text: '`0`' },
        { text: '`\'\'` (empty string)' },
        { text: '`\'0\'`', why: 'A non-empty string is truthy — even the text "0".' },
        { text: '`[]`', why: 'Every object, including an empty array, is truthy. Check `arr.length` instead.' },
        { text: '`null`' },
        { text: '`NaN`' },
      ],
      answer: [0, 1, 4, 5],
      explanation: 'The falsy values are `false`, `0`, `-0`, `0n`, `\'\'`, `null`, `undefined` and `NaN`. Everything else — including `[]`, `{}` and `\'0\'` — is truthy.',
    },
    {
      id: 'js-essentials-q7',
      type: 'short',
      prompt: 'What is a closure? Give one example of where Vue code relies on one.',
      answer: 'A closure is a function together with the variables from the scope where it was created; the function can keep using those variables after the outer function has returned. A composable such as `useCounter()` creates a `ref` inside the function and returns functions that use it, so each component calling it gets its own private state. Event handlers like `() => remove(todo.id)` inside a `v-for` also close over the current item.',
    },
  ],

  exercises: [
    {
      id: 'stock-label',
      title: 'Fix the falsy-zero bug',
      difficulty: 'beginner',
      prompt: `
\`stockLabel(qty)\` in \`stock.js\` returns the label shown next to each product. It has a bug: products with **0** in stock show **Unknown**.

Make it return exactly:

- \`'Unknown'\` when \`qty\` is \`null\` or \`undefined\`;
- \`'Out of stock'\` when \`qty\` is \`0\`;
- \`'Low stock (N left)'\` when \`qty\` is 1 to 5 (e.g. \`'Low stock (3 left)'\`);
- \`'In stock'\` otherwise.

Use \`===\`, not \`==\`. The page in \`main.js\` shows each product\'s label in an element with \`class="stock"\`.
`,
      files: {
        'stock.js': `export function stockLabel(qty) {
  if (!qty) return 'Unknown'
  if (qty == '0') return 'Out of stock'
  if (qty <= 5) return 'Low stock (' + qty + ' left)'
  return 'In stock'
}`,
        'main.js': `import { stockLabel } from './stock.js'

const products = [
  { name: 'Ceramic mug', qty: 0 },
  { name: 'Tea towel', qty: 3 },
  { name: 'Teapot', qty: 12 },
  { name: 'Mystery box', qty: null },
]

const app = document.getElementById('app')
const list = document.createElement('ul')

for (const product of products) {
  const li = document.createElement('li')
  li.innerHTML = '<span class="name"></span> — <span class="stock"></span>'
  li.querySelector('.name').textContent = product.name
  li.querySelector('.stock').textContent = stockLabel(product.qty)
  list.append(li)
}

app.append(list)`,
      },
      hints: [
        'Which values is `!qty` true for? Write them down — `0` is one of them.',
        'Check for the "missing" case first, explicitly: `if (qty === null || qty === undefined) return \'Unknown\'`.',
        'Then `if (qty === 0) return \'Out of stock\'`. The remaining two rules can stay as they are.',
      ],
      solution: {
        explanation: 'The original guard treated "zero" and "missing" as the same thing because both are falsy. Checking `null`/`undefined` explicitly keeps 0 as a real number. (`qty == null` is an accepted shorthand for "null or undefined"; spelling it out with `===` makes the intent obvious to beginners.)',
        files: {
          'stock.js': `export function stockLabel(qty) {
  if (qty === null || qty === undefined) return 'Unknown'
  if (qty === 0) return 'Out of stock'
  if (qty <= 5) return 'Low stock (' + qty + ' left)'
  return 'In stock'
}`,
          'main.js': `import { stockLabel } from './stock.js'

const products = [
  { name: 'Ceramic mug', qty: 0 },
  { name: 'Tea towel', qty: 3 },
  { name: 'Teapot', qty: 12 },
  { name: 'Mystery box', qty: null },
]

const app = document.getElementById('app')
const list = document.createElement('ul')

for (const product of products) {
  const li = document.createElement('li')
  li.innerHTML = '<span class="name"></span> — <span class="stock"></span>'
  li.querySelector('.name').textContent = product.name
  li.querySelector('.stock').textContent = stockLabel(product.qty)
  list.append(li)
}

app.append(list)`,
        },
      },
      tests: [
        { name: '0 → "Out of stock"', code: `const { stockLabel } = requireModule('stock.js')\nexpect(stockLabel(0)).toBe('Out of stock')` },
        { name: 'null and undefined → "Unknown"', code: `const { stockLabel } = requireModule('stock.js')\nexpect(stockLabel(null)).toBe('Unknown')\nexpect(stockLabel(undefined)).toBe('Unknown')` },
        { name: '1–5 → low stock with the number', code: `const { stockLabel } = requireModule('stock.js')\nexpect(stockLabel(3)).toBe('Low stock (3 left)')\nexpect(stockLabel(5)).toBe('Low stock (5 left)')` },
        { name: 'more than 5 → "In stock"', code: `const { stockLabel } = requireModule('stock.js')\nexpect(stockLabel(12)).toBe('In stock')` },
        { name: 'the mug on the page shows Out of stock', code: `expect(text('.stock')).toBe('Out of stock')` },
      ],
    },
    {
      id: 'wallet-closure',
      title: 'A wallet with private money',
      difficulty: 'intermediate',
      prompt: `
In \`wallet.js\`, implement \`createWallet(initial)\` so it returns an object with three functions, and **no other way** to reach the money:

- \`balance()\` → the current amount;
- \`deposit(amount)\` → adds a **positive** amount and returns \`true\`; for zero or negative amounts it changes nothing and returns \`false\`;
- \`withdraw(amount)\` → subtracts and returns \`true\` if there is enough money; otherwise changes nothing and returns \`false\`.

Two wallets must be completely independent, and \`wallet.money\` (or any other property besides the three functions) must not expose the amount.
`,
      files: {
        'wallet.js': `export function createWallet(initial = 0) {
  // TODO: keep the amount private in a variable here

  return {
    balance() {},
    deposit(amount) {},
    withdraw(amount) {},
  }
}`,
        'main.js': `import { createWallet } from './wallet.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <p class="amount">Balance: ?</p>
  <button class="add">Deposit 10</button>
  <button class="spend">Spend 25</button>
\`

const wallet = createWallet(20)
const amount = app.querySelector('.amount')
const show = () => { amount.textContent = 'Balance: ' + wallet.balance() }

app.querySelector('.add').addEventListener('click', () => { wallet.deposit(10); show() })
app.querySelector('.spend').addEventListener('click', () => {
  if (!wallet.withdraw(25)) alert('Not enough money!')
  show()
})
show()`,
      },
      hints: [
        'Declare `let money = initial` inside `createWallet`, before the `return`.',
        'Each function reads or changes `money` — they all close over the same variable. Don\'t put `money` in the returned object.',
        '`deposit`: `if (amount <= 0) return false; money += amount; return true`. `withdraw`: `if (amount > money) return false; money -= amount; return true`.',
      ],
      solution: {
        explanation: '`money` lives only in the closure created by each `createWallet` call. The three returned functions are the *only* door to it, so the rules (no negative deposits, no overdraft) can\'t be bypassed. Composables use the same structure to expose state plus the functions allowed to change it.',
        files: {
          'wallet.js': `export function createWallet(initial = 0) {
  let money = initial

  return {
    balance() {
      return money
    },
    deposit(amount) {
      if (amount <= 0) return false
      money += amount
      return true
    },
    withdraw(amount) {
      if (amount > money) return false
      money -= amount
      return true
    },
  }
}`,
          'main.js': `import { createWallet } from './wallet.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <p class="amount">Balance: ?</p>
  <button class="add">Deposit 10</button>
  <button class="spend">Spend 25</button>
\`

const wallet = createWallet(20)
const amount = app.querySelector('.amount')
const show = () => { amount.textContent = 'Balance: ' + wallet.balance() }

app.querySelector('.add').addEventListener('click', () => { wallet.deposit(10); show() })
app.querySelector('.spend').addEventListener('click', () => {
  if (!wallet.withdraw(25)) alert('Not enough money!')
  show()
})
show()`,
        },
      },
      tests: [
        { name: 'starts with the initial amount', code: `const { createWallet } = requireModule('wallet.js')\nexpect(createWallet(20).balance()).toBe(20)` },
        { name: 'deposit adds positive amounts only', code: `const { createWallet } = requireModule('wallet.js')\nconst w = createWallet(20)\nexpect(w.deposit(10)).toBe(true)\nexpect(w.balance()).toBe(30)\nexpect(w.deposit(-5)).toBe(false)\nexpect(w.deposit(0)).toBe(false)\nexpect(w.balance()).toBe(30)` },
        { name: 'withdraw refuses to overdraw', code: `const { createWallet } = requireModule('wallet.js')\nconst w = createWallet(20)\nexpect(w.withdraw(25)).toBe(false)\nexpect(w.balance()).toBe(20)\nexpect(w.withdraw(5)).toBe(true)\nexpect(w.balance()).toBe(15)` },
        { name: 'wallets are independent and private', code: `const { createWallet } = requireModule('wallet.js')\nconst a = createWallet(10)\nconst b = createWallet(10)\na.deposit(5)\nexpect(a.balance()).toBe(15)\nexpect(b.balance()).toBe(10)\nexpect(Object.keys(a).sort()).toEqual(['balance', 'deposit', 'withdraw'])` },
      ],
    },
  ],

  interview: [
    {
      id: 'js-essentials-closure',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is a closure, and where do closures show up in Vue code?',
      answer: 'A closure is a function bundled with references to the variables of the scope it was defined in, so it can keep using them after that scope has finished executing. In Vue, composables rely on closures: `useCounter()` creates a ref and returns functions that close over it, giving each calling component private state. Event handlers in templates (`@click="remove(todo.id)"` inside `v-for`) and watcher callbacks also close over surrounding variables.',
      explanation: 'Closures are how JavaScript gives you private, per-instance state without classes.',
      code: {
        lang: 'js',
        code: `import { ref } from 'vue'

export function useCounter(start = 0) {
  const count = ref(start)          // created per call
  const increment = () => count.value++ // closes over count
  return { count, increment }
}`,
      },
      whyAsked: 'Closures are the foundation of composables, debouncing, memoisation and many interview puzzles.',
      mistakes: ['Defining a closure as "a function inside a function" without mentioning the retained variables.', 'Not connecting it to per-instance state in composables.', 'Forgetting that closures can keep memory alive.'],
      followUps: ['What changes if the ref is declared outside `useCounter`?', 'How can closures cause memory leaks?', 'How does a debounce function use a closure?'],
      modelAnswer: 'A closure is a function plus the variables it captured from where it was written; it can keep reading and writing them even after the outer function returns. Each call of the outer function creates a fresh set of variables, so closures give private, per-instance state. Composables are the clearest Vue example — `useCounter` creates a ref inside the function and returns functions that close over it, so every component gets its own counter. If I moved the ref to module level instead, all callers would share it, which is sometimes exactly what I want for global state. The trade-off is memory: anything a live closure references can\'t be garbage collected, so listeners must be cleaned up.',
    },
    {
      id: 'js-essentials-pass-by-sharing',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this log?',
      code: {
        lang: 'js',
        code: `function rename(user) {
  user.name = 'Grace'
  user = { name: 'Linus' }
}

const u = { name: 'Ada' }
rename(u)
console.log(u.name)`,
      },
      options: ['Ada', 'Grace', 'Linus', 'TypeError'],
      correctOption: 1,
      answer: '`Grace`. The function receives a reference to the same object and mutates it. Reassigning the parameter afterwards only changes the local variable `user`; `u` still points to the original (now renamed) object.',
      explanation: 'JavaScript passes object references by value ("pass-by-sharing"): you can change the shared object, but not which object the caller\'s variable points to.',
      whyAsked: 'It checks the exact mental model behind "why did my prop/parent data change?" bugs.',
      mistakes: ['Answering Linus (thinking the reassignment escapes the function).', 'Answering Ada (thinking objects are copied when passed).'],
      followUps: ['How would you write `rename` so it doesn\'t mutate its input?', 'How does this relate to passing objects as props in Vue?'],
      modelAnswer: 'It logs Grace. The parameter holds a copy of the reference, so `user.name = \'Grace\'` mutates the caller\'s object. Then `user = { … }` just points the local parameter at a new object — the caller never sees that. To avoid surprising callers I\'d return a new object instead: `return { ...user, name: \'Grace\' }`.',
    },
    {
      id: 'js-essentials-equality',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `==`, `===` and `Object.is()`. Which does Vue use to decide whether a ref changed?',
      answer: '`==` converts types before comparing (`\'5\' == 5` is true). `===` compares without conversion, but `NaN === NaN` is false and `+0 === -0` is true. `Object.is()` is like `===` except `Object.is(NaN, NaN)` is true and `Object.is(+0, -0)` is false. Vue\'s reactivity uses `Object.is` semantics to check whether a new value differs from the old one before triggering updates. For objects, all three compare identity, not contents.',
      explanation: 'Use `===` in your code; know `Object.is` exists because Vue (and React) use it for change detection.',
      whyAsked: 'Basic correctness plus a hint of framework internals.',
      mistakes: ['Saying `===` compares objects by content.', 'Not knowing the `NaN` edge case.', 'Using `==` "because it is shorter".'],
      followUps: ['Why does assigning the same object to a ref not trigger an update?', 'How would you compare two objects by content?'],
      modelAnswer: 'Double equals coerces types, which produces surprising results like empty string equal to zero, so I avoid it except for `x == null`. Triple equals compares type and value with no conversion. `Object.is` is the same as triple equals except for two edge cases: NaN equals NaN, and plus and minus zero differ. Vue uses Object.is-style comparison when you assign to a ref, so assigning the same value — or the same object reference — doesn\'t trigger anything. None of them compare objects by contents; for that you compare fields or use a deep-equal helper.',
    },
    {
      id: 'js-essentials-this-arrow',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Clicking the button throws `TypeError: Cannot read properties of undefined (reading \'count\')`. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment: () => {
      this.count++
    },
  },
}`,
      },
      answer: '`increment` is an arrow function, so it has no `this` of its own — it uses the `this` of the module scope, which is `undefined` in an ES module. Vue can\'t bind it to the component. Use method shorthand: `increment() { this.count++ }`.',
      explanation: 'Regular functions get `this` from the call; arrow functions inherit it lexically. Vue binds `methods` to the instance only if they are regular functions.',
      whyAsked: 'A very common bug in Options API codebases, and a probe of how well you understand `this`.',
      mistakes: ['Suggesting `.bind(this)` inside the object literal (still the wrong `this`).', 'Not knowing why arrow functions behave differently.', 'Claiming `data: () => ({…})` is also wrong (it is fine when it doesn\'t use `this`).'],
      followUps: ['Why doesn\'t the Composition API have this problem?', 'When are arrow functions the better choice?'],
      modelAnswer: 'Arrow functions don\'t have their own `this`; they capture it from the surrounding scope, which here is the module, where `this` is undefined. Vue binds each method\'s `this` to the component proxy, but it can\'t rebind an arrow function. The fix is method shorthand, `increment() { this.count++ }`. The Composition API sidesteps the problem because `<script setup>` uses closures over refs instead of `this`.',
    },
    {
      id: 'js-essentials-prop-mutation',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A child component receives a `user` object as a prop and edits `props.user.name` in a form. The parent\'s data changes immediately, even before the user clicks Save. Explain what happens and how you would restructure it.',
      answer: 'Props pass the object by reference, so `props.user` is the parent\'s object. Vue only prevents reassigning the prop itself (`props.user = …` warns), not mutating nested properties, so the edit writes straight into the parent\'s state. Restructure: copy the prop into local state (`const draft = ref({ ...props.user })`), bind the form to `draft`, and emit `save` with the draft; the parent decides whether to apply it.',
      explanation: 'One-way data flow is a convention Vue enforces only at the top level. Object references make it easy to bypass by accident.',
      whyAsked: 'Combines JavaScript references with Vue\'s data-flow rules — a classic real-world bug.',
      mistakes: ['Saying Vue copies props.', 'Using a shallow copy for deeply nested data without noting nested objects are still shared.', 'Silencing the issue instead of emitting changes.'],
      followUps: ['What if `user` has nested objects (addresses)?', 'How would `defineModel()` change this design?', 'How would you reset the draft when the prop changes?'],
      modelAnswer: 'The prop is a reference to the parent\'s object, so writing `props.user.name` mutates the parent directly — Vue only blocks reassigning the prop itself. That breaks one-way data flow and makes Cancel impossible. I\'d make a local draft — a shallow copy, or `structuredClone` of the raw data if it is nested — bind the form to the draft, and emit `save` with it. If the parent passes a new user, I\'d watch the prop and reset the draft.',
    },
    {
      id: 'js-essentials-loop-closure',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'What do the two loops log?',
      code: {
        lang: 'js',
        code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log('var', i))
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log('let', j))
}`,
      },
      options: ['var 0 1 2, let 0 1 2', 'var 3 3 3, let 0 1 2', 'var 3 3 3, let 3 3 3', 'var 0 1 2, let 3 3 3'],
      correctOption: 1,
      answer: '`var 3 3 3` then `let 0 1 2`. `var` is function-scoped, so all three callbacks close over one `i`, which is 3 by the time they run. `let` creates a fresh binding per iteration, so each callback closes over its own `j`.',
      explanation: 'Closures capture variables, not values. Whether you get one variable or one per iteration depends on the declaration.',
      whyAsked: 'The classic closure puzzle; it shows whether you understand capture and block scope rather than memorising rules.',
      mistakes: ['Thinking closures copy the value at creation time.', 'Not knowing that `let` in a `for` header is per-iteration.'],
      followUps: ['How was this fixed before `let` existed?', 'Where could a similar bug appear in a Vue component?'],
      modelAnswer: 'The `var` loop logs 3, 3, 3 and the `let` loop logs 0, 1, 2. Closures capture variables, not snapshots. With `var` there is a single function-scoped `i` that the loop has already pushed to 3 when the timeouts fire. With `let`, each iteration gets its own binding of `j`, so each callback sees its own value. Before `let`, people wrapped the body in an immediately-invoked function to create a new scope per iteration.',
    },
    {
      id: 'js-essentials-once',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Implement `once(fn)` in `once.js`: it returns a new function that calls `fn` only the first time (passing along its arguments) and returns that first result on every later call.',
      starter: {
        files: {
          'once.js': `export function once(fn) {
  // TODO
  return fn
}`,
          'main.js': `import { once } from './once.js'

const app = document.getElementById('app')
app.innerHTML = '<button class="init">Initialise analytics</button><p class="log"></p>'

let setups = 0
const init = once(() => {
  setups++
  return 'ready'
})

app.querySelector('.init').addEventListener('click', () => {
  app.querySelector('.log').textContent = init() + ' (setup ran ' + setups + ' time(s))'
})`,
        },
      },
      tests: [
        { name: 'calls fn only once and caches the result', code: `const { once } = requireModule('once.js')\nlet calls = 0\nconst double = once((x) => { calls++; return x * 2 })\nexpect(double(5)).toBe(10)\nexpect(double(7)).toBe(10)\nexpect(calls).toBe(1)` },
        { name: 'two wrapped functions are independent', code: `const { once } = requireModule('once.js')\nconst a = once(() => 'a')\nconst b = once(() => 'b')\nexpect(a()).toBe('a')\nexpect(b()).toBe('b')` },
        { name: 'the button reports a single setup', code: `await click('.init')\nawait click('.init')\nexpect(text('.log')).toBe('ready (setup ran 1 time(s))')` },
      ],
      hints: ['Keep two variables in the closure: `called` (boolean) and `result`.', 'Return `(...args) => { if (!called) { called = true; result = fn(...args) } return result }`.'],
      answer: 'Store `called` and `result` in the closure; on the first call run `fn(...args)` and remember the result; afterwards return the stored result.',
      solution: {
        files: {
          'once.js': `export function once(fn) {
  let called = false
  let result

  return (...args) => {
    if (!called) {
      called = true
      result = fn(...args)
    }
    return result
  }
}`,
          'main.js': `import { once } from './once.js'

const app = document.getElementById('app')
app.innerHTML = '<button class="init">Initialise analytics</button><p class="log"></p>'

let setups = 0
const init = once(() => {
  setups++
  return 'ready'
})

app.querySelector('.init').addEventListener('click', () => {
  app.querySelector('.log').textContent = init() + ' (setup ran ' + setups + ' time(s))'
})`,
        },
      },
      explanation: 'Each call to `once` creates a new closure with its own `called` and `result`, which is why two wrapped functions don\'t interfere.',
      whyAsked: 'A compact test of closures, higher-order functions and rest/spread arguments.',
      mistakes: ['Using a module-level `called` flag, so every wrapped function shares it.', 'Not forwarding arguments.', 'Checking `if (!result)`, which re-runs `fn` when it returns a falsy value.'],
      followUps: ['How would you preserve `this` for methods?', 'How is `once` different from memoize?', 'What does `{ once: true }` do in `addEventListener`?'],
      modelAnswer: 'I keep a `called` flag and a `result` in the closure created by `once`. The returned function checks the flag: on the first call it sets it, calls `fn` with the forwarded arguments and stores the result; afterwards it just returns the stored result. I use a separate boolean rather than checking whether `result` is truthy, because `fn` could legitimately return 0 or undefined. Every `once(...)` call gets its own closure, so wrapped functions are independent.',
    },
  ],

  takeaways: [
    'Primitives are copied; objects (including arrays and functions) are shared by reference — `=` never copies an object.',
    '`const` stops reassignment, not mutation. That is why `const count = ref(0)` then `count.value++` works.',
    'Use `===`. Know the eight falsy values, and don\'t let `0` or `\'\'` fall through a truthiness check.',
    'Functions are values: store them, pass them as callbacks, return them from other functions.',
    'A closure is a function plus the variables it captured; each call of the outer function creates fresh ones — the basis of composables.',
    'Arrow functions have no own `this`; use regular methods in the Options API.',
  ],
}
