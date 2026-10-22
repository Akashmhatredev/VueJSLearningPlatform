// Lesson: Template syntax & interpolation

const receiptApp = `<script setup>
import { ref } from 'vue'

const customer = ref({ firstName: 'Maya', lastName: 'Chen' })
const product = ref({ name: 'notebook', price: 4.5 })
const quantity = ref(2)
const note = ref('<b>Leave at the door</b>')

function formatPrice(amount) {
  return '€' + amount.toFixed(2)
}
</script>

<template>
  <h2>Receipt for {{ customer.firstName + ' ' + customer.lastName }}</h2>
  <p class="line">{{ quantity }} × {{ product.name.toUpperCase() }}</p>
  <p class="total">Total: {{ formatPrice(product.price * quantity) }}</p>
  <p class="badge">{{ quantity > 1 ? 'Multi-buy' : 'Single item' }}</p>
  <p class="note">Note: {{ note }}</p>
  <button class="more" @click="quantity++">Add one more</button>
</template>`

export default {
  id: 'template-syntax',
  title: 'Template syntax & interpolation',
  summary: 'Vue templates are HTML plus two superpowers: {{ }} to show JavaScript values as text, and v- directives to add behaviour.',
  difficulty: 'beginner',
  minutes: 22,
  prerequisites: ['single-file-components'],
  related: ['v-bind', 'v-on-events', 'conditional-rendering', 'computed', 'v-html', 'xss-safe-rendering'],
  tags: ['template', 'interpolation', 'mustache', '{{ }}', 'expressions', 'directives', 'v-once', 'escaping'],
  apis: [
    { name: '{{ expression }}', summary: 'Text interpolation: renders the value of a JavaScript expression as escaped text.' },
    { name: 'v-once', summary: 'Renders an element once and skips it in future updates.' },
    { name: 'v-pre', summary: 'Skips compilation for an element; mustaches are shown literally.' },
    { name: 'v-text', summary: 'Sets an element\'s text content, like a whole-element interpolation.' },
  ],
  docs: [
    { label: 'Vue Guide — Template Syntax', url: 'https://vuejs.org/guide/essentials/template-syntax.html' },
    { label: 'API — Built-in Directives', url: 'https://vuejs.org/api/built-in-directives.html' },
    { label: 'Vue Guide — Security', url: 'https://vuejs.org/guide/best-practices/security.html' },
  ],

  intro: `
A Vue **template** is ordinary HTML with two extras:

1. **Text interpolation** — \`{{ }}\` (nicknamed *mustaches*, because they look like sideways moustaches). Whatever JavaScript expression you put inside is evaluated and shown as text: \`<h2>Hello, {{ name }}</h2>\`.
2. **Directives** — special attributes that start with \`v-\` and give an element behaviour: \`v-if\` (show it only sometimes), \`v-for\` (repeat it), \`v-on\` (react to events), \`v-bind\` (set attributes from data) and more.

Everything else is the HTML you already know.
`,

  why: `
Your data lives in JavaScript; your page is HTML. Something has to connect them.

With plain JavaScript you'd glue strings together and push them into the page by hand — \`el.textContent = 'Hello, ' + name\` — and do it again every time \`name\` changes. It's easy to forget, and building HTML from strings is a classic security hole.

Templates solve both problems:

- You write HTML that *reads* like the final page, with holes where data goes. Designers and backend developers can understand it at a glance.
- Vue keeps every hole filled with the **current** value, automatically.
- Values are inserted as **text**, never as HTML, so a user who types \`<script>\` into their name can't inject code.
`,

  eli15: `
Remember fill-in-the-blank letters?

> Dear [name], you have [number] new messages.

A Vue template is that letter, with the blanks written as \`{{ name }}\` and \`{{ messages.length }}\`. Vue fills in the blanks from your data — and here's the magic part — **it rewrites the letter instantly whenever the data changes.**

Directives are instructions scribbled in the margin: *"only include this paragraph if they're a member"* (\`v-if\`), *"write this line once for each item"* (\`v-for\`), *"when they click here, do this"* (\`v-on\`).
`,

  analogy: {
    title: 'A form letter that rewrites itself',
    body: `
An office sends thousands of letters from one template: "Dear «first name», your order «order number» ships on «date»". The blanks are filled from a database.

Vue templates work the same way, with one upgrade: the letter stays *live*. If the customer's order date changes while they're looking at it, the date on the page changes too. The margin notes (directives) control which paragraphs appear and how many times.
`,
    mapping: [
      ['the letter template', 'your `<template>` markup'],
      ['«blank» fields', '`{{ expression }}` interpolations'],
      ['the customer database', 'your reactive state (`ref`, props…)'],
      ['margin instructions', 'directives like `v-if`, `v-for`, `v-on`'],
      ['the letter updating itself', 'Vue re-rendering when the state changes'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'interpolation' },
    title: 'Interpolation in the real DOM',
    caption: 'Change the data and watch which DOM text node Vue updates. Try typing HTML tags — they appear as text, not as markup.',
    alt: 'An interactive lab: an input edits a reactive value, a template using double-brace interpolation is shown, and the live DOM output underneath highlights the text node that changes. Typed HTML tags appear escaped as plain text.',
  },

  syntax: [
    `
#### Text interpolation
`,
    {
      code: `<p>Hello, {{ name }}!</p>
<p>{{ cart.length }} items</p>
<p>{{ price * quantity }}</p>
<p>{{ isMember ? 'Member price' : 'Regular price' }}</p>
<p>{{ title.toUpperCase() }}</p>
<p>{{ formatDate(order.createdAt) }}</p>`,
      lang: 'vue',
      title: 'what can go inside {{ }}',
    },
    `
Inside \`{{ }}\` you can write any **single JavaScript expression** — a piece of code that produces a value: variables, arithmetic, comparisons, the ternary operator \`a ? b : c\`, property access, method calls and function calls.

You **cannot** write *statements* — code that does something rather than produces a value:
`,
    {
      code: `<!-- ❌ these do not compile -->
<p>{{ let total = price * quantity }}</p>   <!-- declaration -->
<p>{{ if (ok) { 'yes' } }}</p>              <!-- if statement -->
<p>{{ total = 5; total++ }}</p>            <!-- multiple statements -->

<!-- ✅ use an expression instead -->
<p>{{ ok ? 'yes' : 'no' }}</p>`,
      lang: 'vue',
      title: 'expressions only',
      static: true,
    },
    `
**Rules worth memorising:**

1. **Output is text.** \`{{ '<b>hi</b>' }}\` shows the characters \`<b>hi</b>\`, not bold text. Vue never parses interpolated values as HTML. (To render trusted HTML there is \`v-html\` — see [v-html and its security implications](lesson:v-html).)
2. **\`null\` and \`undefined\` render as nothing**, and objects/arrays render as formatted JSON — handy for debugging (\`<pre>{{ user }}</pre>\`).
3. **Mustaches don't work inside attributes.** \`<a href="{{ url }}">\` is just a literal string. Use \`v-bind\`: \`<a :href="url">\` — next lesson, [v-bind](lesson:v-bind).
4. **Functions called in a template run on every re-render** of the component. Keep them fast and free of side effects (they must not change state). For expensive derived values, use [computed()](lesson:computed).
5. **Only a safe list of globals is available** — such as \`Math\`, \`Date\`, \`JSON\`, \`Number\`, \`String\`, \`parseInt\` and \`Intl\`. Your own globals like \`window.config\` are not; expose what you need from \`<script setup>\`.

#### Directives
`,
    {
      code: `<p v-if="isLoggedIn">Welcome back!</p>        <!-- v-if: render conditionally -->
<li v-for="todo in todos">{{ todo.text }}</li>  <!-- v-for: repeat -->
<a v-bind:href="profileUrl">Profile</a>         <!-- v-bind: set an attribute -->
<button v-on:click="save">Save</button>        <!-- v-on: listen to an event -->
<input v-model="search" />                      <!-- v-model: two-way binding -->`,
      lang: 'vue',
      title: 'the most common directives',
    },
    `
A directive's value is a JavaScript expression (\`v-for\` and \`v-on\` have small special syntaxes). Directives can also take an **argument** after a colon and **modifiers** after dots:
`,
    {
      code: `<form v-on:submit.prevent="save">
<!--  │    │      │        └─ value: a JavaScript expression
      │    │      └─ modifier: a special flag (.prevent → call event.preventDefault())
      │    └─ argument: which event / attribute
      └─ directive name -->

<a v-bind:[attributeName]="url">  <!-- dynamic argument: the attribute name itself comes from data -->`,
      lang: 'vue',
      title: 'anatomy of a directive',
      static: true,
    },
    `
The two directives you'll type thousands of times have shorthands:

- \`v-bind:href="url"\` → \`:href="url"\`
- \`v-on:click="save"\` → \`@click="save"\`

(\`v-slot\` also has a shorthand, \`#\`, which you'll meet in [Slots](lesson:slots).)

#### Two rarely needed helpers
`,
    {
      code: `<p v-once>Welcome, {{ name }}</p>   <!-- rendered once; later changes to name are ignored -->
<p v-pre>{{ this will be shown as-is }}</p>  <!-- not compiled at all -->`,
      lang: 'vue',
      title: 'v-once and v-pre',
      static: true,
    },
    {
      callout: 'tip',
      title: 'Keep templates declarative',
      text: 'If an expression needs more than a line or two, give it a name: move it into a `computed()` or a function in `<script setup>`. Templates should read like a description of the page, not like an algorithm.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: receiptApp,
    intro: 'A small receipt that uses every kind of expression you will commonly write in a template.',
    steps: [
      { lines: [4, 7], text: 'Four pieces of reactive state: two objects, a number and a string that happens to contain HTML tags.' },
      { lines: [9, 11], text: 'A plain helper function. Templates can call it like any function — but it will run on every re-render, so it must be quick and must not change state.' },
      { lines: [15], text: 'String concatenation inside a mustache. Any single expression is allowed: here we build the full name from two properties.' },
      { lines: [16], text: 'Two interpolations in one line, the second calling a string method: `product.name.toUpperCase()` shows **NOTEBOOK**.' },
      { lines: [17], text: 'Arithmetic plus a function call: `formatPrice(4.5 * 2)` → **€9.00**. Change `quantity` and this line recomputes.' },
      { lines: [18], text: 'The ternary operator is the template-friendly way to say "if/else" in a single expression.' },
      { lines: [19], text: 'The note contains `<b>` tags, but interpolation always inserts **text**. You will see the angle brackets on screen — this is what keeps user input from injecting HTML.' },
      { lines: [20], text: 'A sneak peek at a directive: `@click="quantity++"` (short for `v-on:click`). Clicking changes `quantity`, and every expression that uses it re-renders.' },
    ],
  },

  playground: {
    title: 'A live receipt',
    objective: 'Write and change template expressions, and see escaping and allowed globals in action.',
    files: { 'App.vue': receiptApp },
    expected: 'A receipt for **Maya Chen**: "2 × NOTEBOOK", "Total: €9.00", a **Multi-buy** badge, and a note that shows its `<b>` tags as plain text. **Add one more** updates the line, the total and the badge together.',
    experiments: [
      {
        id: 'initials',
        task: 'Add `<p class="initials">` that shows the customer\'s initials (**MC**) using an expression on `customer`.',
        hint: 'Strings can be indexed like arrays: `customer.firstName[0]`. Join two of them with `+`.',
        tests: [{ name: 'shows MC', code: `expect(text('.initials')).toBe('MC')` }],
        explain: 'Property access, indexing and `+` are all expressions, so they are fine inside `{{ }}`. If this grew more complex you would move it into a computed property.',
      },
      {
        id: 'discount',
        task: 'Orders of **3 or more** get **10% off**. Change the `.total` line so the price is multiplied by `0.9` when `quantity >= 3`. Then click **Add one more**.',
        hint: 'Inside `formatPrice(...)`, use a ternary: `product.price * quantity * (quantity >= 3 ? 0.9 : 1)`.',
        tests: [
          {
            name: 'no discount at 2, 10% off at 3',
            code: `expect(text('.total')).toBe('Total: €9.00')
await click('.more')
expect(text('.total')).toBe('Total: €12.15')`,
          },
        ],
        explain: 'You can nest expressions freely — but notice how fast it gets hard to read. That is the signal to give the logic a name in `<script setup>` (a function or a `computed()`).',
      },
      {
        id: 'globals',
        task: 'Add a footer `<p class="year">© {{ new Date().getFullYear() }} Paper Co.</p>`. Then try `{{ window.innerWidth }}` in another paragraph and check the console.',
        hint: '`Date` is on Vue\'s list of allowed globals; `window` is not.',
        tests: [{ name: 'the footer shows the current year', code: `expect(text('.year')).toContain(String(new Date().getFullYear()))` }],
        explain: 'Templates can only reach your component\'s state and a safe list of globals (`Math`, `Date`, `JSON`, `Intl`, …). Anything else — `window`, `localStorage`, your own globals — must be exposed from `<script setup>` first.',
      },
      {
        id: 'escaping',
        task: 'Change `note` to `\'<img src=x onerror="alert(1)">\'` and run it. Does an alert pop up?',
        hint: 'Watch what appears in the Note line.',
        explain: 'No alert: interpolation inserts the value as a text node, so the browser never parses it as HTML. This automatic escaping is why rendering user input with `{{ }}` is safe — and why `v-html` with untrusted content is dangerous. See [XSS & safe rendering](lesson:xss-safe-rendering).',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'Anatomy of a directive',
    props: {
      nodes: [
        { id: 'prefix', label: 'v-on', note: 'directive name', tone: 'acid' },
        { id: 'arg', label: ':submit', note: 'argument', tone: 'cobalt' },
        { id: 'mod', label: '.prevent', note: 'modifier', tone: 'kraft' },
        { id: 'value', label: '="save"', note: 'value: a JS expression', tone: 'paper' },
        { id: 'short', label: '@submit.prevent', note: 'shorthand', tone: 'ink' },
      ],
      edges: [
        { from: 'prefix', to: 'arg' },
        { from: 'arg', to: 'mod' },
        { from: 'mod', to: 'value' },
        { from: 'prefix', to: 'short', label: 'v-on: → @', dashed: true },
      ],
      layout: 'row',
      steps: [
        { focus: ['prefix'], text: 'Every directive starts with `v-`. The **name** says what kind of behaviour it adds: `v-on` listens to events, `v-bind` sets attributes, `v-if` renders conditionally.' },
        { focus: ['arg'], edges: ['prefix->arg'], text: 'The **argument** comes after a colon and narrows it down: *which* event (`submit`) or *which* attribute (`v-bind:href`). It can even be dynamic: `v-bind:[attrName]`.' },
        { focus: ['mod'], edges: ['arg->mod'], text: '**Modifiers** come after dots and tweak the behaviour. `.prevent` means "call `event.preventDefault()` for me", so the form does not reload the page.' },
        { focus: ['value'], edges: ['mod->value'], text: 'The **value** is a JavaScript expression evaluated against your component: a function name, a call like `save(draft)`, or any expression.' },
        { focus: ['short'], edges: ['prefix->short'], text: '`v-on:` and `v-bind:` are so common they have **shorthands**: `@submit.prevent="save"` and `:href="url"` mean exactly the same thing.' },
      ],
    },
    caption: '`<form v-on:submit.prevent="save">` — four parts, each with one job.',
    alt: 'A row of labelled boxes breaking down v-on:submit.prevent="save": the directive name v-on, the argument submit, the modifier prevent and the value save. A dashed arrow shows the shorthand @submit.prevent.',
  },

  internals: {
    beginner: `
Vue doesn't read your template while the app runs the way a browser reads HTML. A **compiler** turns it into a JavaScript function ahead of time. Each \`{{ }}\` becomes a small piece of code that reads your data and turns it into text. When the data changes, Vue runs the function again and updates only the text that actually changed.
`,
    technical: [
      `
The template compiler parses the template into an AST (a tree describing it), transforms it, and generates a **render function**. Each interpolation becomes a call to \`toDisplayString()\`, which converts values to text: \`null\`/\`undefined\` → empty string, arrays and plain objects → \`JSON.stringify(value, null, 2)\`, everything else → \`String(value)\`.

Identifiers in expressions are resolved against the component — with \`<script setup>\` the compiler knows each binding (ref, constant, function) and generates direct access. Names that are neither bindings nor in the **allowed globals list** are looked up on the component instance, which is why \`window\` gives a "not defined" warning instead of working.

Dynamic text is written into text nodes (\`textContent\`/\`nodeValue\`), never via \`innerHTML\`, so it can never be parsed as markup. The compiler also tags each dynamic node with a *patch flag* (for example "only the text changes here"), so updates skip static content entirely.
`,
      {
        code: `// <p class="total">Total: {{ formatPrice(product.price * quantity) }}</p>
// compiles to roughly (simplified):
createElementVNode('p', { class: 'total' },
  'Total: ' + toDisplayString(formatPrice(product.value.price * quantity.value)),
  1 /* PatchFlags.TEXT: only the text is dynamic */)`,
        lang: 'js',
        title: 'compiled interpolation (simplified)',
      },
      `
You can explore real compiler output in the official [Vue Template Explorer](https://template-explorer.vuejs.org/). More in [Compiler macros & template compilation](lesson:compiler-macros).
`,
    ],
    production: `
- **Expressions stay small.** Long template expressions are hard to test and review. Name them: computed properties for derived values, functions for formatting.
- **No side effects in templates.** A template expression that changes state (\`{{ count++ }}\`, or a function that pushes to an array) triggers another render, which changes state again — Vue stops it with "Maximum recursive updates exceeded".
- **Never compile user-provided templates.** A template is code: rendering a template string that came from a user is equivalent to letting them run JavaScript in your app. Interpolate user *data*; never use it *as* a template.
- **\`v-html\` only with trusted or sanitised HTML** (e.g. sanitised with a library such as DOMPurify) — and remember sanitising in the browser does not replace server-side validation.
- **\`v-once\` is a niche optimisation** for content that truly never changes; reach for it only after measuring.
`,
  },

  mistakes: [
    {
      title: 'Writing statements inside mustaches',
      wrong: { code: `<p>{{ if (stock > 0) { 'In stock' } else { 'Sold out' } }}</p>`, lang: 'vue' },
      right: { code: `<p>{{ stock > 0 ? 'In stock' : 'Sold out' }}</p>`, lang: 'vue' },
      explanation: 'Only expressions are allowed. Rewrite `if/else` as a ternary, or use `v-if`/`v-else` on elements for bigger branches.',
    },
    {
      title: 'Using mustaches inside attributes',
      wrong: { code: `<img src="{{ product.imageUrl }}" alt="{{ product.name }}" />`, lang: 'vue' },
      right: { code: `<img :src="product.imageUrl" :alt="product.name" />`, lang: 'vue' },
      explanation: 'Attributes are not interpolated — the browser would request a URL literally named `{{ product.imageUrl }}`. Bind attributes with `v-bind` (`:`).',
    },
    {
      title: 'Changing state from the template',
      wrong: { code: `<p>Visits: {{ visits++ }}</p>`, lang: 'vue' },
      right: { code: `<script setup>\nimport { ref, onMounted } from 'vue'\nconst visits = ref(0)\nonMounted(() => visits.value++)\n</script>\n\n<template>\n  <p>Visits: {{ visits }}</p>\n</template>`, lang: 'vue' },
      explanation: 'Rendering should only *read* state. Changing state during render schedules another render, which changes it again… Vue detects the loop and warns "Maximum recursive updates exceeded". Change state in event handlers, lifecycle hooks or watchers.',
    },
    {
      title: 'Doing heavy work inline',
      wrong: { code: `<p>{{ orders.filter(o => o.paid).reduce((s, o) => s + o.total, 0).toFixed(2) }}</p>`, lang: 'vue' },
      right: { code: `<script setup>\nconst paidTotal = computed(() =>\n  orders.value.filter((o) => o.paid).reduce((s, o) => s + o.total, 0)\n)\n</script>\n\n<template>\n  <p>{{ paidTotal.toFixed(2) }}</p>\n</template>`, lang: 'vue' },
      explanation: 'The inline version is hard to read and recalculates on every re-render, even when `orders` didn\'t change. A computed property has a name and caches its result.',
    },
  ],

  debugging: [
    {
      symptom: 'Compile error like `Error parsing JavaScript expression: Unexpected token`.',
      cause: 'A statement (`let`, `if`, `;`-separated code) or a typo inside `{{ }}` or a directive value.',
      fix: 'Reduce it to a single expression (ternary instead of if), or move the logic into `<script setup>`.',
    },
    {
      symptom: '`[Vue warn]: Property "config" was accessed during render but is not defined on instance.`',
      cause: 'A typo, a variable not declared in `<script setup>`, or a browser global (`window.config`) that templates cannot see.',
      fix: 'Declare or import it in `<script setup>` (e.g. `const config = window.config`) and use that binding.',
    },
    {
      symptom: 'The page literally shows `{{ url }}` inside a link or image path.',
      cause: 'A mustache was used inside an attribute.',
      fix: 'Use `v-bind`: `:href="url"`, `:src="imageUrl"`.',
    },
    {
      symptom: 'A paragraph shows a JSON blob like `{ "name": "Ada", "age": 36 }`.',
      cause: 'You interpolated a whole object instead of one of its properties.',
      fix: 'Pick the property: `{{ user.name }}`. (Showing an object as JSON is still a handy debugging trick: `<pre>{{ user }}</pre>`.)',
    },
    {
      symptom: '`[Vue warn]: Maximum recursive updates exceeded in component <App>`.',
      cause: 'Something in the template changes reactive state while rendering (e.g. `{{ count++ }}` or a function that mutates data).',
      fix: 'Make template expressions pure. Move changes into event handlers, watchers or lifecycle hooks.',
    },
  ],

  bestPractices: [
    'Use `{{ }}` for text and `:attr` for attributes — never mix them up.',
    'Keep template expressions short and side-effect free; name anything complex with a computed or function.',
    'Prefer the ternary operator for small either/or text; use `v-if`/`v-else` for whole blocks.',
    'Expose browser globals and config explicitly from `<script setup>` instead of reaching for `window` in templates.',
    'Render user content with interpolation (auto-escaped); treat `v-html` as a security decision.',
  ],

  useCases: [
    'Showing data: names, counts, prices, dates, status labels.',
    'Light formatting: `{{ price.toFixed(2) }}`, `{{ title.toUpperCase() }}`, `{{ formatDate(d) }}`.',
    'Small either/or labels: `{{ isOnline ? \'Online\' : \'Offline\' }}`.',
    'Debugging during development: `<pre>{{ formState }}</pre>` to see an object live.',
  ],

  whenToUse: {
    use: [
      'Anywhere text in the page depends on data.',
      'Short, pure expressions that read naturally in the markup.',
    ],
    avoid: [
      'Multi-step logic, loops or filtering inside `{{ }}` — move it to a computed property.',
      'Setting attributes — use `v-bind` instead of mustaches.',
      'Rendering HTML strings — interpolation escapes them; `v-html` exists but needs trusted content.',
    ],
  },

  comparison: {
    title: 'Ways to put data into the page',
    headers: ['', '`{{ }}`', '`v-text`', '`v-html`', '`v-bind` (`:`)'],
    rows: [
      ['Where', 'inside element text', 'attribute; replaces all text content', 'attribute; replaces inner HTML', 'attributes and DOM properties'],
      ['Output', 'escaped text', 'escaped text', 'raw HTML (parsed by the browser)', 'attribute/property value'],
      ['Safe with user input?', 'yes', 'yes', '**no** — only trusted/sanitised HTML', 'yes, except dangerous URLs like `javascript:`'],
      ['Typical use', 'almost everything', 'rarely needed', 'trusted rich text (CMS, markdown output)', '`href`, `src`, `disabled`, `class`…'],
    ],
    note: 'Next up: [Attribute binding with v-bind](lesson:v-bind).',
  },

  quiz: [
    {
      id: 'template-syntax-q1',
      type: 'mcq',
      prompt: 'Which of these is valid inside `{{ }}`?',
      options: [
        { text: '`{{ stock > 0 ? \'In stock\' : \'Sold out\' }}`' },
        { text: '`{{ let total = price * qty }}`', why: '`let` declares a variable — that is a statement, not an expression.' },
        { text: '`{{ if (ok) { \'yes\' } }}`', why: '`if` is a statement. Use the ternary operator instead.' },
        { text: '`{{ total = 5; total++ }}`', why: 'Two statements separated by `;` are not a single expression (and templates should not change state anyway).' },
      ],
      answer: 0,
      explanation: 'Mustaches accept exactly one JavaScript expression — something that produces a value. The ternary operator is the expression form of if/else.',
    },
    {
      id: 'template-syntax-q2',
      type: 'output',
      prompt: 'With `const word = ref(\'Vue\')`, what text does this paragraph show?',
      code: { lang: 'vue', code: `<p>{{ word.split('').reverse().join('') }}</p>` },
      answer: 'euV',
      accept: ['euv'],
      explanation: 'Method calls are expressions: split into letters, reverse, join back together → "euV".',
    },
    {
      id: 'template-syntax-q3',
      type: 'bug',
      prompt: 'The link goes to a page literally called `{{ profileUrl }}`. Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<script setup>
const name = 'Ada'
const profileUrl = '/users/ada'
</script>

<template>
  <h2>{{ name }}</h2>
  <a href="{{ profileUrl }}">View profile</a>
</template>`,
      },
      answerLine: 8,
      explanation: 'Mustaches only work in text, not in attributes. Write `<a :href="profileUrl">` (short for `v-bind:href`).',
    },
    {
      id: 'template-syntax-q4',
      type: 'fill',
      prompt: 'Complete the directive: listen to the form\'s `submit` event and prevent the page reload. Use the full (non-shorthand) form.',
      code: { lang: 'vue', code: `<form v-on___submit.___="save">` },
      answer: [[':'], ['prevent']],
      explanation: 'Directive name `v-on`, argument after a colon (`:submit`), modifier after a dot (`.prevent`), value `"save"`. Shorthand: `@submit.prevent="save"`.',
    },
    {
      id: 'template-syntax-q5',
      type: 'mcq',
      prompt: 'With `const bio = ref(\'<b>Hi</b>\')`, what does `<p>{{ bio }}</p>` show on screen?',
      options: [
        { text: 'The literal characters `<b>Hi</b>`' },
        { text: 'The word **Hi** in bold', why: 'That would require parsing the value as HTML, which interpolation never does (`v-html` would).' },
        { text: 'Nothing — Vue strips HTML tags', why: 'Vue does not strip anything; it escapes, so the tags are shown as text.' },
        { text: 'A compile error', why: 'The template is fine; the value is just a string.' },
      ],
      answer: 0,
      explanation: 'Interpolated values are inserted as text, so HTML in data is displayed, not executed. This is Vue\'s built-in protection against HTML injection.',
    },
    {
      id: 'template-syntax-q6',
      type: 'mcq',
      prompt: '`{{ window.innerWidth }}` logs a warning that `window` is not defined. Why?',
      options: [
        { text: 'Templates can only access component state and a restricted list of safe globals; `window` isn\'t on it.' },
        { text: 'The code runs on a server where `window` does not exist.', why: 'In a normal client-side app the template runs in the browser — the restriction is deliberate.' },
        { text: 'You must write `this.window` in templates.', why: 'There is no `this.window`. Expose the value from `<script setup>` instead.' },
        { text: '`window` is only available inside `v-html`.', why: '`v-html` has nothing to do with which globals are accessible.' },
      ],
      answer: 0,
      explanation: 'Vue allows globals like `Math`, `Date`, `JSON` and `Intl`. For anything else, create a binding in `<script setup>` — ideally a reactive one if it can change.',
    },
    {
      id: 'template-syntax-q7',
      type: 'short',
      prompt: 'Why should a function you call inside `{{ }}` never change reactive state?',
      answer: 'Template expressions run during rendering, and they run again on every re-render. If one changes reactive state, that change schedules another render, which runs the function again and changes the state again — an infinite loop that Vue stops with "Maximum recursive updates exceeded". Templates should only read state; changes belong in event handlers, watchers or lifecycle hooks.',
    },
  ],

  exercises: [
    {
      id: 'profile-card',
      title: 'Fill in a profile card',
      difficulty: 'beginner',
      prompt: `
The state is ready; the template still shows placeholder text. Replace each placeholder with an interpolation:

- \`.full-name\` → first and last name with a space: **Grace Hopper**
- \`.username\` → \`@\` followed by the username in **lower case**: **@ghopper**
- \`.status\` → **Online** if \`isOnline\` is true, otherwise **Away**
- \`.bio-count\` → the bio length out of 160, e.g. **39/160**

The tests also change the state, so the template must really use the data.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const user = ref({
  firstName: 'Grace',
  lastName: 'Hopper',
  username: 'GHopper',
  isOnline: true,
  bio: 'Wrote the first compiler. Found a bug.',
})
</script>

<template>
  <article class="card">
    <h2 class="full-name">FULL NAME</h2>
    <p class="username">@username</p>
    <p class="status">STATUS</p>
    <p class="bio-count">0/160</p>
  </article>
</template>`,
      },
      hints: [
        'Access properties through the ref in the template without `.value`: `{{ user.firstName }}`.',
        "Combine with `+`: `{{ user.firstName + ' ' + user.lastName }}`; call `.toLowerCase()` on the username.",
        "Use a ternary for the status: `{{ user.isOnline ? 'Online' : 'Away' }}`, and `{{ user.bio.length }}/160` for the counter.",
      ],
      solution: {
        explanation: 'Every placeholder became a single expression reading from `user`. Because they read reactive state, they update automatically when it changes — the tests prove that by changing `isOnline` and `bio`.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const user = ref({
  firstName: 'Grace',
  lastName: 'Hopper',
  username: 'GHopper',
  isOnline: true,
  bio: 'Wrote the first compiler. Found a bug.',
})
</script>

<template>
  <article class="card">
    <h2 class="full-name">{{ user.firstName + ' ' + user.lastName }}</h2>
    <p class="username">@{{ user.username.toLowerCase() }}</p>
    <p class="status">{{ user.isOnline ? 'Online' : 'Away' }}</p>
    <p class="bio-count">{{ user.bio.length }}/160</p>
  </article>
</template>`,
        },
      },
      tests: [
        { name: 'full name', code: `expect(text('.full-name')).toBe('Grace Hopper')` },
        { name: 'lower-case username', code: `expect(text('.username')).toBe('@ghopper')` },
        {
          name: 'status follows isOnline',
          code: `expect(text('.status')).toBe('Online')
state.user.isOnline = false
await nextTick()
expect(text('.status')).toBe('Away')`,
        },
        {
          name: 'bio counter follows the bio',
          code: `expect(text('.bio-count')).toBe(state.user.bio.length + '/160')
state.user.bio = 'Hi'
await nextTick()
expect(text('.bio-count')).toBe('2/160')`,
        },
      ],
    },
    {
      id: 'weather-widget',
      title: 'Format a weather widget with helper functions',
      difficulty: 'beginner',
      prompt: `
Write two helper functions in \`<script setup>\` and call them from the template:

- \`formatTemp(celsius)\` returns the temperature **rounded** to a whole number with \`°C\`, e.g. \`21.4\` → **21°C**.
- \`windLabel(kmh)\` returns **Calm** below 10, **Breezy** below 30, and **Windy** from 30 up.

Show them in \`.temp\` and \`.wind\`; show the city in \`.city\`. The tests change \`forecast\`, so the widget must update.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const forecast = ref({ city: 'Lisbon', tempC: 21.4, windKmh: 18 })

// TODO: formatTemp(celsius) and windLabel(kmh)
</script>

<template>
  <section class="weather">
    <h2 class="city">City</h2>
    <p class="temp">--°C</p>
    <p class="wind">--</p>
  </section>
</template>`,
      },
      hints: [
        '`Math.round(celsius) + \'°C\'` gives the formatted temperature.',
        '`windLabel` needs two `if` checks inside the function body — statements are fine in `<script setup>`, just not inside `{{ }}`.',
        'In the template: `{{ forecast.city }}`, `{{ formatTemp(forecast.tempC) }}`, `{{ windLabel(forecast.windKmh) }}`.',
      ],
      solution: {
        explanation: 'Logic with `if` statements lives in plain functions; the template just calls them. Vue re-runs those calls whenever the component re-renders, so changing `forecast` updates the text. If these were expensive, a computed property would cache the results.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const forecast = ref({ city: 'Lisbon', tempC: 21.4, windKmh: 18 })

function formatTemp(celsius) {
  return Math.round(celsius) + '°C'
}

function windLabel(kmh) {
  if (kmh < 10) return 'Calm'
  if (kmh < 30) return 'Breezy'
  return 'Windy'
}
</script>

<template>
  <section class="weather">
    <h2 class="city">{{ forecast.city }}</h2>
    <p class="temp">{{ formatTemp(forecast.tempC) }}</p>
    <p class="wind">{{ windLabel(forecast.windKmh) }}</p>
  </section>
</template>`,
        },
      },
      tests: [
        { name: 'shows the city and rounded temperature', code: `expect(text('.city')).toBe('Lisbon'); expect(text('.temp')).toBe('21°C')` },
        { name: '18 km/h is Breezy', code: `expect(text('.wind')).toBe('Breezy')` },
        {
          name: 'labels update when the forecast changes',
          code: `state.forecast.windKmh = 35
state.forecast.tempC = 7.6
await nextTick()
expect(text('.wind')).toBe('Windy')
expect(text('.temp')).toBe('8°C')
state.forecast.windKmh = 4
await nextTick()
expect(text('.wind')).toBe('Calm')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'template-syntax-expressions',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What can and can\'t you put inside `{{ }}` in a Vue template?',
      answer: 'Any single JavaScript expression: variables, property access, arithmetic, comparisons, ternaries, method and function calls. Not statements such as `let`/`const` declarations, `if`, loops or multiple `;`-separated statements. Expressions can only access component state and a restricted list of globals, and they should be free of side effects.',
      explanation: 'Think "something you could put on the right side of `=`".',
      whyAsked: 'Fundamental template knowledge; reveals whether you understand expression vs statement.',
      mistakes: ['Saying "any JavaScript".', 'Forgetting the restricted globals.', 'Not mentioning that templates should be pure.'],
      followUps: ['How do you write an if/else in a mustache?', 'Why can\'t templates access `window`?'],
      modelAnswer: "Inside mustaches I can write exactly one JavaScript expression — anything that produces a value, like property access, arithmetic, a ternary, or calling a method or function. Statements aren't allowed, so no variable declarations, if blocks, loops or multiple statements. Expressions are evaluated against the component's state, plus a short list of safe globals like Math and Date. And they should be pure: they run on every render, so they must not change state. Anything complex I move into a computed property.",
    },
    {
      id: 'template-syntax-xss',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Why is `{{ userInput }}` safe from XSS, and where can Vue rendering still be unsafe?',
      answer: 'Interpolation writes values into text nodes, so the browser never parses them as HTML — `<script>` shows up as text. Risks remain with `v-html` (raw HTML), binding user-controlled URLs to `href`/`src` (e.g. `javascript:` URLs), binding user-controlled styles, and, worst of all, compiling user-provided content as a Vue template, which is equivalent to running their code.',
      explanation: 'Vue escapes text by default; anything that turns data back into markup, URLs or code needs care.',
      code: {
        lang: 'vue',
        code: `<p>{{ comment }}</p>          <!-- ✅ escaped text -->
<div v-html="comment"></div>  <!-- ⚠️ only if sanitised/trusted -->
<a :href="user.website">…</a> <!-- ⚠️ validate the URL scheme -->`,
      },
      whyAsked: 'Security awareness is expected even from junior frontend developers.',
      mistakes: ['Claiming Vue makes apps XSS-proof.', 'Forgetting URL and template-injection risks.', 'Relying only on frontend sanitising without server-side validation.'],
      followUps: ['How would you render markdown from users safely?', 'What does Vue\'s security guide say about user-provided templates?'],
      modelAnswer: "Interpolation is safe because Vue sets the value as text content rather than HTML, so markup in user data is displayed, not executed. The risky spots are wherever data becomes markup, URLs or code: v-html renders raw HTML, so it needs trusted or sanitised content; binding a user-controlled URL to href can allow javascript: URLs, so I validate the scheme; and compiling a user-supplied string as a Vue template is effectively running their code — never do that. Frontend sanitising is defence in depth; the server still validates and sanitises.",
    },
    {
      id: 'template-syntax-method-vs-computed',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `{{ totalPrice() }}` (a function) and `{{ totalPrice }}` (a computed property)?',
      answer: 'A function call in the template runs on every re-render of the component, even if its inputs did not change. A computed property caches its result and only recalculates when one of its reactive dependencies changes. Use computed for derived values; use functions for things that take arguments or must run fresh each time.',
      explanation: 'Same output, different cost: computed = cached, function = recalculated every render.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, computed } from 'vue'
const items = ref([{ price: 5, qty: 2 }])
function totalPriceFn() { return items.value.reduce((s, i) => s + i.price * i.qty, 0) }
const totalPrice = computed(() => items.value.reduce((s, i) => s + i.price * i.qty, 0))
</script>

<template>
  <p>{{ totalPriceFn() }}</p>  <!-- runs on every re-render -->
  <p>{{ totalPrice }}</p>      <!-- cached until items change -->
</template>`,
      },
      whyAsked: 'A classic question; it reveals whether you think about rendering cost.',
      mistakes: ['Saying they are identical.', 'Claiming functions never re-run.', 'Using computed for something that needs arguments.'],
      followUps: ['Can a computed take arguments?', 'When is a method in the template perfectly fine?'],
      modelAnswer: "Both can produce the same value, but they behave differently. A function called in the template is executed every time the component re-renders, whatever caused the render. A computed property tracks its reactive dependencies and caches the result, so it only recalculates when those dependencies change. For derived state like a cart total I use computed; for formatting helpers that take an argument, like formatPrice(amount), a plain function is fine as long as it's cheap and pure.",
    },
    {
      id: 'template-syntax-global-config',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A legacy page sets `window.siteConfig = { name: \'Pixel Shop\' }` before the app loads. The template `{{ siteConfig.name }}` throws and warns that `siteConfig` was accessed during render but is not defined. Why, and how do you fix it?',
      answer: 'Templates are not evaluated against `window`. Identifiers resolve to the component\'s bindings or a restricted list of safe globals; `siteConfig` is neither, so it is `undefined` and `.name` throws. Fix: create a binding in `<script setup>` (`const siteConfig = window.siteConfig`), or for app-wide values use `app.provide()`/`inject()` or `app.config.globalProperties`.',
      explanation: 'The template sandbox is deliberate: it keeps templates predictable and prevents accidental global access.',
      whyAsked: 'A realistic integration bug when adding Vue to existing pages.',
      mistakes: ['Suggesting `this.window.siteConfig`.', 'Not knowing the allowed-globals list exists.'],
      followUps: ['Would the template update if `window.siteConfig` changes later?', 'When would you use `provide`/`inject` instead?'],
      modelAnswer: "Vue templates don't see arbitrary globals. Each identifier is resolved against the component's own bindings and a small whitelist of safe globals like Math and Date, so siteConfig comes back undefined and reading name throws. The fix is to bring it in explicitly: in script setup, const siteConfig = window.siteConfig, and the template can use it. For something app-wide I'd provide it once at the app level and inject it where needed. Note that copying it this way isn't reactive — later changes to the window object won't update the page.",
    },
    {
      id: 'template-syntax-once-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'The button is clicked **three** times. What do the two paragraphs show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <p v-once>Started at {{ count }}</p>
  <p>Now at {{ count }}</p>
  <button @click="count++">+1</button>
</template>`,
      },
      options: ['Started at 0 / Now at 0', 'Started at 0 / Now at 3', 'Started at 3 / Now at 3', 'Started at 3 / Now at 0'],
      correctOption: 1,
      answer: '"Started at 0" and "Now at 3". `v-once` renders its element a single time and skips it in all later updates; the second paragraph updates normally.',
      explanation: '`v-once` freezes that subtree after the first render.',
      whyAsked: 'Tests knowledge of the less common built-in directives and of how updates are scoped.',
      mistakes: ['Thinking `v-once` stops the whole component from updating.', 'Thinking `v-once` prevents the value from changing — the ref still changes, only that element is not re-rendered.'],
      followUps: ['When would `v-once` actually be worth using?', 'How is `v-memo` different?'],
      modelAnswer: "The first paragraph stays at 'Started at 0' because v-once renders that element once and then treats it as static. The ref itself still changes, so the second paragraph shows 'Now at 3'. I'd only use v-once for content that genuinely never changes, and only if profiling showed it mattered.",
    },
    {
      id: 'template-syntax-compiled',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What happens to a Vue template between writing it and seeing it in the browser, and why does compiling ahead of time help performance?',
      answer: 'The template compiler parses the template into an AST, transforms it and generates a render function that returns virtual DOM nodes. In SFC projects this happens at build time. Ahead-of-time compilation means the compiler does not ship to users (smaller runtime-only build) and lets Vue optimise: static content is hoisted and skipped during updates, dynamic nodes get patch flags describing exactly what can change (text, class, props), and nodes are grouped into blocks so diffing only walks the dynamic parts.',
      explanation: 'Because the compiler sees the whole template, it can tell the runtime which parts can never change.',
      whyAsked: 'Senior candidates are expected to understand Vue\'s rendering model and why it is efficient.',
      mistakes: ['Saying Vue diffs the entire tree on every update without optimisation.', 'Not knowing that in-DOM/string templates compile in the browser.'],
      followUps: ['What is a patch flag?', 'What does the runtime-only build leave out?', 'How would you inspect compiled output?'],
      modelAnswer: "The template is compiled into a render function: parsed into an AST, transformed, then turned into JavaScript that creates virtual nodes. With Vite and SFCs that happens at build time, so the browser gets plain JavaScript and the smaller runtime-only build without the compiler. Because the compiler sees the whole template, it can annotate it: static parts are hoisted and never diffed, dynamic nodes get patch flags saying exactly what can change — just text, just class — and dynamic nodes are tracked in blocks so updates skip static subtrees. The Template Explorer shows this output if you want to see it.",
    },
    {
      id: 'template-syntax-coding-order',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 5,
      question: 'Display an order using interpolation only: `.order-id` shows **#1042**, `.summary` shows **3 items · €59.50**, and `.status` shows **Awaiting payment** or **Paid** depending on `order.paid`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const order = ref({ id: 1042, items: 3, total: 59.5, paid: false })
</script>

<template>
  <h2 class="order-id">#0</h2>
  <p class="summary">0 items · €0.00</p>
  <p class="status">?</p>
</template>`,
        },
      },
      tests: [
        { name: 'order id', code: `expect(text('.order-id')).toBe('#1042')` },
        { name: 'summary with two decimals', code: `expect(text('.summary')).toBe('3 items · €59.50')` },
        {
          name: 'status follows paid',
          code: `expect(text('.status')).toBe('Awaiting payment')
state.order.paid = true
await nextTick()
expect(text('.status')).toBe('Paid')`,
        },
      ],
      hints: ['`toFixed(2)` turns 59.5 into "59.50".', 'Use a ternary on `order.paid` for the status.'],
      answer: 'Three interpolations: `#{{ order.id }}`, `{{ order.items }} items · €{{ order.total.toFixed(2) }}`, and a ternary for the status.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const order = ref({ id: 1042, items: 3, total: 59.5, paid: false })
</script>

<template>
  <h2 class="order-id">#{{ order.id }}</h2>
  <p class="summary">{{ order.items }} items · €{{ order.total.toFixed(2) }}</p>
  <p class="status">{{ order.paid ? 'Paid' : 'Awaiting payment' }}</p>
</template>`,
        },
      },
      explanation: 'Each value is one expression reading reactive state, so the status updates when `paid` changes.',
      whyAsked: 'A quick warm-up to see fluency with template expressions.',
      mistakes: ['Hard-coding formatted strings in state.', 'Forgetting `toFixed(2)` and showing "59.5".'],
      followUps: ['How would you handle "1 item" vs "3 items"?', 'How would you format currency for different locales (Intl.NumberFormat)?'],
      modelAnswer: "I'd use three interpolations: the id with a literal hash in front, the item count and the total formatted with toFixed(2), and a ternary on order.paid for the status. For real currency formatting across locales I'd use Intl.NumberFormat in a small helper or computed.",
    },
  ],

  takeaways: [
    'Templates are HTML plus `{{ }}` for text and `v-` directives for behaviour.',
    'Mustaches take one JavaScript expression — no statements — and output escaped text.',
    'Mustaches don\'t work in attributes: use `v-bind` (`:`).',
    'Directives can have an argument (`:submit`), modifiers (`.prevent`) and shorthands (`@`, `:`).',
    'Template expressions run on every render: keep them short, pure and free of `window`-style globals.',
  ],
}
