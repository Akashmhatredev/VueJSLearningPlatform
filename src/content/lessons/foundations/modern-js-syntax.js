// Lesson: Modern syntax — destructuring, spread & friends.

const usersModule = `export const users = [
  { id: 1, name: 'Ada', role: 'Admin', address: { city: 'London' }, points: 120 },
  { id: 2, name: 'Grace', address: { city: 'Arlington' }, points: 0 },
  { id: 3, name: 'Linus', role: 'Editor', points: 45 },
]`

const formatModule = `export function formatUser(user) {
  const { name, role = 'Member', address } = user // destructuring + a default
  const city = address?.city ?? 'Unknown city'     // optional chaining + nullish coalescing
  return \`\${name} · \${role} · \${city}\`              // template literal
}`

const syntaxMain = `import { users } from './users.js'
import { formatUser } from './format.js'

const app = document.getElementById('app')
const [first, ...others] = users // array destructuring + rest

app.innerHTML = \`
  <h3>Team (\${users.length})</h3>
  <ul class="team"></ul>
\`

const list = app.querySelector('.team')
for (const user of users) {
  const li = document.createElement('li')
  li.className = 'member'
  li.textContent = formatUser(user)
  list.append(li)
}

// Spread: copy an object and override one property, without touching the original
const promoted = { ...first, role: 'Owner' }
console.log(first.role, '→', promoted.role)
console.log('others:', others.length)`

export default {
  id: 'modern-js-syntax',
  title: 'Modern syntax: destructuring, spread & friends',
  summary: 'Read and write the compact modern JavaScript you will see in every Vue file: destructuring, spread and rest, template literals, optional chaining and nullish coalescing.',
  difficulty: 'beginner',
  minutes: 30,
  prerequisites: ['js-essentials'],
  related: ['array-methods', 'es-modules', 'props', 'reactivity-utilities', 'arrays-objects-reactivity'],
  tags: ['javascript', 'es6', 'destructuring', 'spread', 'rest', 'template literals', 'optional chaining', 'nullish coalescing', '??', '?.', 'default parameters', 'shorthand'],
  apis: [
    { name: 'const { a, b } = obj', summary: 'Object destructuring: pull properties into variables (with renaming and defaults).' },
    { name: 'const [x, ...rest] = arr', summary: 'Array destructuring with a rest element that collects the remaining items.' },
    { name: '{ ...obj } / [...arr]', summary: 'Spread: copy properties or items into a new object or array (shallow).' },
    { name: 'a?.b', summary: 'Optional chaining: returns `undefined` instead of throwing when `a` is null or undefined.' },
    { name: 'a ?? b', summary: 'Nullish coalescing: uses `b` only when `a` is null or undefined (unlike `||`, keeps 0 and \'\').' },
    { name: '`Hello ${name}`', summary: 'Template literal: a string with embedded expressions and real line breaks.' },
  ],
  docs: [
    { label: 'MDN — Destructuring', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring' },
    { label: 'MDN — Spread syntax', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax' },
    { label: 'MDN — Optional chaining (?.)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining' },
    { label: 'MDN — Nullish coalescing (??)', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing' },
    { label: 'Vue Guide — Reactive props destructure (3.5+)', url: 'https://vuejs.org/guide/components/props.html#reactive-props-destructure' },
  ],

  intro: `
Open any Vue project and you'll see lines like these:

\`\`\`js
const { title, done = false } = props
emit('save', { ...form, updatedAt: Date.now() })
const city = user?.address?.city ?? 'Unknown'
\`\`\`

They're not Vue features — they're modern JavaScript (mostly from 2015 onwards, with \`?.\` and \`??\` arriving in 2020). Each one is a shortcut for something you could write the long way. This lesson teaches you to read them fluently, and — just as important — where each shortcut has a sharp edge.
`,

  why: `
These features exist because the long versions are noisy and error-prone:

\`\`\`js
// the long way
var name = user.name
var role = user.role !== undefined ? user.role : 'Member'
var city = user.address && user.address.city ? user.address.city : 'Unknown'
var copy = Object.assign({}, user, { role: 'Owner' })
\`\`\`

Modern syntax says the same thing in a way that matches how you think: "take the name and role out", "copy this and change one thing", "the city, if there is one".

In Vue they matter even more, because some of them interact with reactivity:

- **Spread** makes copies — perfect for "edit a draft, then save", but a copy of reactive state is *not* reactive.
- **Destructuring** a \`reactive()\` object pulls out plain values and **loses reactivity** — unless you use \`toRefs()\`. Destructuring \`defineProps()\` stays reactive only in Vue 3.5+.
- \`?.\` and \`??\` keep templates from crashing while data is still loading.
`,

  eli15: `
Think of a lunchbox with labelled compartments: sandwich, apple, cookie.

**Destructuring** is opening the lunchbox and taking out exactly what you want by name: "give me the sandwich and the apple". \`const { sandwich, apple } = lunchbox\`.

**Spread** (\`...\`) is tipping everything out of one lunchbox into a *new* one — and then you can swap one item: "same lunch, but a banana instead of the apple". \`{ ...lunchbox, apple: 'banana' }\`. The old lunchbox is untouched.

**Optional chaining** (\`?.\`) is asking "what's in the *side pocket*, *if* there is a side pocket?" — no crash if the pocket doesn't exist, you just get "nothing".

**Nullish coalescing** (\`??\`) is "use what's there, or this backup if there's *nothing* there". A cookie with zero chocolate chips still counts as a cookie — \`??\` keeps it; the older \`||\` would throw it away.
`,

  analogy: {
    title: 'Packing and unpacking a moving box',
    body: `
When you move house you **unpack** boxes (take out the items you need), **repack** (pour one box into a fresh one and add a few things), **check for an inner box** before reaching into it, and **fall back** to a spare when something is missing.

Modern JavaScript gives each of those moves its own short syntax.
`,
    mapping: [
      ['unpacking named items from a box', 'object destructuring: `const { name, role } = user`'],
      ['taking the first item, then "the rest"', 'array destructuring with rest: `const [first, ...others] = list`'],
      ['pouring into a new box and adding things', 'spread: `{ ...user, role: \'Owner\' }`'],
      ['"if there is an inner box, look inside"', 'optional chaining: `user.address?.city`'],
      ['"if it\'s missing, use the spare"', 'nullish coalescing: `role ?? \'Member\'`'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'The long way vs the modern way',
    caption: 'The same function, written twice. Same behaviour — except one important improvement on the right: `??` keeps a legitimate `0`.',
    alt: 'Two code panels side by side. The left panel uses var, explicit property reads, ternaries and && checks and string concatenation. The right panel uses destructuring with a default, optional chaining, nullish coalescing and a template literal. Bullet points list the differences.',
    props: {
      left: {
        label: 'Before (ES5 style)',
        lang: 'js',
        code: `function formatUser(user) {
  var name = user.name
  var role = user.role !== undefined ? user.role : 'Member'
  var city = user.address && user.address.city
    ? user.address.city
    : 'Unknown city'
  var points = user.points || 'no'
  return name + ' · ' + role + ' · ' + city +
    ' · ' + points + ' pts'
}`,
      },
      right: {
        label: 'Modern',
        lang: 'js',
        code: `function formatUser(user) {
  const { name, role = 'Member', address, points } = user
  const city = address?.city ?? 'Unknown city'
  return \`\${name} · \${role} · \${city} · \${points ?? 'no'} pts\`
}`,
      },
      points: [
        'Destructuring pulls several properties out in one line, with a default for `role`.',
        '`address?.city` replaces the `user.address && user.address.city` guard.',
        '`??` only falls back for null/undefined: a user with **0** points shows "0 pts"; `||` on the left wrongly shows "no pts".',
        'The template literal reads like the final string instead of a chain of `+`.',
      ],
    },
  },

  syntax: [
    `
#### Object destructuring
`,
    {
      code: `const user = { name: 'Ada', role: 'Admin', address: { city: 'London' } }

const { name, role } = user                 // name = 'Ada', role = 'Admin'
const { name: fullName } = user             // rename: fullName = 'Ada'
const { plan = 'free' } = user              // default when the property is undefined
const { address: { city } } = user          // nested: city = 'London'
const { role: _ignored, ...publicInfo } = user // rest: everything except role

function UserCard({ name, role = 'Member' }) { // destructure parameters
  return name + ' (' + role + ')'
}`,
      lang: 'js',
      title: 'objects',
    },
    `
#### Array destructuring
`,
    {
      code: `const scores = [98, 87, 75, 60]

const [gold, silver] = scores        // by position: 98, 87
const [, , bronze] = scores          // skip with commas: 75
const [winner, ...rest] = scores     // rest: [87, 75, 60]

let a = 1, b = 2
;[a, b] = [b, a]                     // swap without a temp variable`,
      lang: 'js',
      title: 'arrays',
    },
    `
#### Spread and rest: the same \`...\`, opposite jobs

**Spread** expands an object or array *into* a new one. **Rest** collects "the remaining" items *out of* one.
`,
    {
      code: `// spread → build new values
const tags = ['vue', 'js']
const moreTags = [...tags, 'css']                  // ['vue', 'js', 'css']
const settings = { theme: 'light', size: 16 }
const dark = { ...settings, theme: 'dark' }        // later properties win
Math.max(...[3, 9, 4])                             // 9: spread into arguments

// rest → collect leftovers
function logAll(first, ...others) { console.log(first, others) }
const { password, ...safeUser } = account          // drop a field`,
      lang: 'js',
      title: 'spread and rest',
    },
    {
      callout: 'warn',
      title: 'Spread is shallow',
      text: '`{ ...cart }` makes a new top-level object, but nested objects and arrays are **shared** with the original. `copy.items.push(x)` changes `cart.items` too. Spread each level you change: `{ ...cart, items: [...cart.items, x] }`, or use `structuredClone()` for a deep copy of plain data.',
    },
    `
#### Template literals
`,
    {
      code: `const name = 'Ada'
const items = 3
const msg = \`Hi \${name}, you have \${items} item\${items === 1 ? '' : 's'}\`
const html = \`
  <p class="greeting">
    \${msg}
  </p>
\`                                          // real line breaks allowed`,
      lang: 'js',
      title: 'template literals',
    },
    `
#### Optional chaining \`?.\` and nullish coalescing \`??\`
`,
    {
      code: `user?.address?.city      // undefined (no error) if user or address is null/undefined
user.getAvatar?.()        // call only if the method exists
list?.[0]                 // index only if list exists

count ?? 0                // 0 only when count is null or undefined
count || 0                // ⚠ also replaces 0, '', false, NaN

settings.theme ??= 'light' // assign only if currently null/undefined (ES2021)`,
      lang: 'js',
      title: '?. and ??',
    },
    `
#### Small shortcuts you'll see everywhere
`,
    {
      code: `const title = 'Buy milk', done = false
const todo = { title, done }               // shorthand: { title: title, done: done }
const field = 'email'
const errors = { [field]: 'Required' }     // computed key: { email: 'Required' }
const api = { load() { /* … */ } }         // method shorthand
const toItem = (name) => ({ name, qty: 1 }) // arrow returning an object needs ( )
function greet(name = 'friend') {}          // default parameter`,
      lang: 'js',
      title: 'shorthand, computed keys, defaults',
    },
    `
#### In Vue
`,
    {
      code: `<script setup>
import { reactive, toRefs, computed } from 'vue'

// Vue 3.5+: destructured props stay reactive (the compiler rewrites them)
const { title, done = false } = defineProps(['title', 'done'])

const form = reactive({ name: '', email: '' })
const { name } = form            // ❌ plain string: no longer reactive
const { email } = toRefs(form)   // ✅ a ref linked to form.email

const emit = defineEmits(['save'])
const save = () => emit('save', { ...form }) // send a plain snapshot

const label = computed(() => \`\${title} \${done ? '✓' : ''}\`)
</script>

<template>
  <p>{{ user?.address?.city ?? 'Unknown city' }}</p>
</template>`,
      lang: 'vue',
      title: 'modern syntax in a component',
    },
    {
      callout: 'version',
      title: 'Version notes',
      text: 'Reactive props destructure is stable in **Vue 3.5+**; before that, destructuring `defineProps()` lost reactivity. To watch a destructured prop, wrap it in a getter: `watch(() => title, …)`. `?.` and `??` are ES2020 and work in all current browsers and in Vue 3 templates.',
    },
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: syntaxMain,
    intro: 'The page imports data and a formatter. Read `format.js` first — it packs four modern features into three lines — then follow `main.js`.',
    steps: [
      { lines: [1, 2], text: 'Named imports are destructuring too, in spirit: take `users` out of one module and `formatUser` out of another. (Modules get their own lesson next-but-one.)' },
      { lines: [5], text: '`const [first, ...others] = users` — array destructuring with a rest element: `first` is Ada, `others` is a new array of the remaining two users.' },
      { lines: [7, 10], text: 'A template literal builds the HTML. `${users.length}` drops an expression straight into the string; the backticks allow real line breaks.' },
      { lines: [12, 18], text: 'For each user, `formatUser(user)` (in `format.js`) destructures `name`, `role` with a default of `\'Member\'`, and `address`, then uses `address?.city ?? \'Unknown city\'` so Linus (no address) doesn\'t crash the page.' },
      { lines: [20, 23], text: 'Spread: `{ ...first, role: \'Owner\' }` copies every property of Ada into a **new** object, then overrides `role`. The console shows `Admin → Owner` — the original is untouched.' },
    ],
  },

  playground: {
    title: 'Team list',
    objective: 'Extend a formatter and a page using destructuring, spread, `?.` and `??` — and see where `??` and `||` differ.',
    files: { 'main.js': syntaxMain, 'format.js': formatModule, 'users.js': usersModule },
    expected: 'A heading **Team (3)** and three lines: **Ada · Admin · London**, **Grace · Member · Arlington** and **Linus · Editor · Unknown city**. The console shows `Admin → Owner` and `others: 2`.',
    experiments: [
      {
        id: 'show-points',
        task: 'In `format.js`, add the user\'s points to the end of the line: **· 120 pts**. If `points` is missing, show **· ? pts** — but a user with **0** points must show **· 0 pts**.',
        hint: 'Destructure `points` as well, then use `\${points ?? \'?\'}` in the template literal. Try `||` first and look at Grace\'s line.',
        tests: [
          { name: '0 points shows as 0, missing shows ?', code: `const { formatUser } = requireModule('format.js')\nexpect(formatUser({ name: 'Zoe', points: 0 })).toContain('0 pts')\nexpect(formatUser({ name: 'Zoe' })).toContain('? pts')\nexpect(formatUser({ name: 'Zoe', points: 7 })).toContain('7 pts')` },
          { name: 'Grace\'s line on the page shows 0 pts', code: `expect(findAll('.member')[1].textContent).toContain('0 pts')` },
        ],
        explain: '`||` treats every falsy value as missing, so Grace\'s 0 would become "?". `??` only replaces `null` and `undefined` — the right tool whenever 0, `\'\'` or `false` are real values.',
      },
      {
        id: 'with-role',
        task: 'Add and export a function `withRole(user, role)` in `format.js` that returns a **new** user object with the given role. It must not change the user passed in.',
        hint: '`export function withRole(user, role) { return { ...user, role } }` — spread, then the shorthand `role` property overrides the old one.',
        tests: [
          { name: 'returns a new object with the new role', code: `const { withRole } = requireModule('format.js')\nconst ada = { name: 'Ada', role: 'Admin' }\nconst owner = withRole(ada, 'Owner')\nexpect(owner.role).toBe('Owner')\nexpect(owner.name).toBe('Ada')\nexpect(owner === ada).toBe(false)` },
          { name: 'the original is untouched', code: `const { withRole } = requireModule('format.js')\nconst ada = { name: 'Ada', role: 'Admin' }\nwithRole(ada, 'Owner')\nexpect(ada.role).toBe('Admin')` },
        ],
        explain: 'Returning new objects instead of mutating is how you "update" state predictably — it\'s the pattern behind emitting a changed copy from a form, or `$patch`-style updates in a store.',
      },
      {
        id: 'featured',
        task: 'Use the existing `first` and `others` variables: show the first user in a `<p class="featured">` above the list (text: **Featured: ** followed by `formatUser(first)`), and list **only the others** in the `<ul>`.',
        hint: 'Add `<p class="featured"></p>` to the HTML string, set its `textContent`, and loop over `others` instead of `users`.',
        tests: [
          { name: 'Ada is featured', code: `expect(text('.featured')).toBe('Featured: Ada · Admin · London')` },
          { name: 'the list holds the other two', code: `expect(findAll('.member')).toHaveLength(2)\nexpect(text('.team')).not.toContain('Ada')` },
        ],
        explain: 'Array destructuring with rest splits "the first" from "the rest" without index arithmetic or slicing. Nothing was mutated — `users` still has all three.',
      },
      {
        id: 'default-trap',
        task: 'Predict, then check in the console: add `const { role = \'Member\' } = { role: null }` and `console.log(role)` to the end of `main.js`.',
        hint: 'Destructuring defaults have the same rule as default parameters.',
        explain: 'It logs `null`. Defaults apply **only when the value is `undefined`**. If your API sends `null` for "no role", combine them: `const role = user.role ?? \'Member\'`.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'What a spread copy really copies',
    caption: 'Step through `const copy = { ...cart }` followed by two different changes. The top level is new; the nested array is shared.',
    alt: 'A diagram with two object boxes, cart and copy, each with a coupon field, and one array box items shared by both. Steps show the copy being created, copy.coupon changed independently, copy.items.push changing the shared array, and a fix where copy gets its own new items array.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'cart', label: 'cart', note: '{ coupon: null, items }', tone: 'cobalt', x: 140, y: 80 },
        { id: 'copy', label: 'copy = { ...cart }', note: '{ coupon, items }', tone: 'acid', x: 140, y: 240 },
        { id: 'items', label: 'items array', note: "['mug']", tone: 'kraft', x: 480, y: 160 },
        { id: 'newItems', label: 'new items array', note: "['mug', 'pen']", tone: 'paper', x: 640, y: 260 },
      ],
      edges: [
        { from: 'cart', to: 'items', label: 'items →' },
        { from: 'copy', to: 'items', label: 'items →', dashed: true },
        { id: 'fixed', from: 'copy', to: 'newItems', label: 'own items →' },
      ],
      steps: [
        { focus: ['cart', 'items'], edges: ['cart->items'], text: '`cart` is an object whose `items` property references an array.' },
        { focus: ['copy'], edges: ['cart->items', 'copy->items'], text: '`const copy = { ...cart }` creates a **new object** and copies each property\'s value. For `items`, the value is a *reference*, so both objects now point to the **same array**.' },
        { focus: ['copy'], text: '`copy.coupon = \'SAVE10\'` changes only `copy` — top-level properties really are independent.' },
        { focus: ['items'], edges: ['cart->items', 'copy->items'], text: '`copy.items.push(\'pen\')` mutates the shared array, so `cart.items` sees `pen` too. This is the "spread is shallow" trap.' },
        { focus: ['copy', 'newItems'], edges: ['fixed'], text: 'The fix: copy every level you change — `const copy = { ...cart, items: [...cart.items, \'pen\'] }`. Now `copy` has its own array and `cart` is untouched.' },
      ],
    },
  },

  internals: {
    beginner: `
None of these features add new abilities — they're shorter ways to write things JavaScript could already do. Destructuring is "read these properties into variables". Spread is "loop over the properties and copy them into a new object". \`?.\` is "check for null first". \`??\` is "if it's null or undefined, use the other value".
`,
    technical: [
      `
**Rough equivalents** (simplified — the real spec handles getters, symbols and more):
`,
      {
        code: `// const { name, role = 'Member' } = user
const name = user.name
const role = user.role === undefined ? 'Member' : user.role

// const copy = { ...user, role: 'Owner' }
const copy = Object.assign({}, user, { role: 'Owner' })

// user?.address?.city
(user == null ? undefined : (user.address == null ? undefined : user.address.city))

// count ?? 0
(count !== null && count !== undefined ? count : 0)`,
        lang: 'js',
        title: 'what the shortcuts mean',
      },
      `
**Details worth knowing:**

- Object spread copies **own enumerable** properties. It reads getters (copying their current value) and does not copy the prototype — spread a class instance and you get a plain object without its methods.
- Array destructuring and spread work on any **iterable** (strings, Maps, Sets), using the iteration protocol. Object destructuring works on any value except \`null\`/\`undefined\` — destructuring those throws a \`TypeError\`.
- \`?.\` **short-circuits**: in \`a?.b.c.d\`, if \`a\` is nullish, the whole chain is \`undefined\` without evaluating the rest.
- You can't mix \`??\` with \`||\`/\`&&\` without parentheses (\`a || b ?? c\` is a SyntaxError) — the language forces you to say what you mean.
`,
      `
**Why destructuring breaks Vue reactivity.** \`reactive()\` tracks reads of properties *on the proxy*. \`const { name } = form\` reads \`form.name\` once and stores the string in a plain variable — later reads of \`name\` never touch the proxy, so nothing is tracked. \`toRefs(form)\` instead returns an object of refs whose \`.value\` reads and writes go back through the proxy. Vue 3.5's reactive props destructure is a **compiler** feature: in \`<script setup>\`, the compiler rewrites \`title\` to \`props.title\` wherever you use it.
`,
    ],
    production: `
- Prefer immutable updates for shared state: \`items.value = [...items.value, newItem]\` or plain \`push\` — both are reactive in Vue 3, but immutable updates make change history and undo easier and are required by some libraries.
- Use \`??\` for defaults from APIs and config; reserve \`||\` for genuinely boolean logic.
- Don't overuse \`?.\`. Sprinkling it everywhere hides bugs — if \`user\` should always exist at that point, a crash with a clear stack trace is more useful than a silent \`undefined\`. Use it where absence is a real, expected state (data still loading, optional fields).
- When sending reactive state to an API, spread or \`toRaw()\` to a plain object first — some libraries and \`structuredClone()\` don't accept proxies.
- Deep nested spreads get unreadable fast. If you're writing \`{ ...a, b: { ...a.b, c: { ...a.b.c, d: 1 } } }\`, consider flattening the state shape.
`,
  },

  mistakes: [
    {
      title: 'Using `||` for defaults when 0 or \'\' are valid',
      wrong: { code: `const quantity = item.quantity || 1   // 0 becomes 1!\nconst note = form.note || 'N/A'        // an intentionally empty note becomes 'N/A'`, lang: 'js' },
      right: { code: `const quantity = item.quantity ?? 1\nconst note = form.note ?? 'N/A'`, lang: 'js' },
      explanation: '`||` falls back for every falsy value. `??` falls back only for `null`/`undefined`.',
    },
    {
      title: 'Expecting destructuring defaults to replace `null`',
      wrong: { code: `const { avatar = '/default.png' } = { avatar: null }\n// avatar is null`, lang: 'js' },
      right: { code: `const avatar = user.avatar ?? '/default.png'`, lang: 'js' },
      explanation: 'Defaults (in destructuring and parameters) apply only when the value is `undefined`. Many APIs send `null` for "empty" — use `??` for those.',
    },
    {
      title: 'Forgetting the parentheses when an arrow returns an object',
      wrong: { code: `const toTag = (label) => { label: label }\n['vue', 'js'].map(toTag) // [undefined, undefined]`, lang: 'js' },
      right: { code: `const toTag = (label) => ({ label })\n['vue', 'js'].map(toTag) // [{ label: 'vue' }, { label: 'js' }]`, lang: 'js' },
      explanation: 'After `=>`, a `{` starts a function body, so `label:` is parsed as a statement label and nothing is returned. Wrap object literals in `( )`.',
    },
    {
      title: 'Destructuring a reactive object and losing reactivity',
      wrong: { code: `const state = reactive({ count: 0 })\nlet { count } = state\ncount++ // state.count is still 0; the template never updates`, lang: 'js' },
      right: { code: `const state = reactive({ count: 0 })\nconst { count } = toRefs(state)\ncount.value++ // state.count is 1`, lang: 'js' },
      explanation: 'Destructuring copies the current value into a plain variable. `toRefs()` gives you refs that stay connected to the reactive object.',
    },
  ],

  debugging: [
    {
      symptom: '`TypeError: Cannot destructure property \'name\' of \'undefined\'`.',
      cause: 'You destructured something that is `undefined` — often data that hasn\'t loaded yet, or a function called without its options object.',
      fix: 'Give a default: `function f({ name } = {})`, or guard before destructuring. In templates, render the part only when the data exists (`v-if="user"`).',
    },
    {
      symptom: 'A copy changes when the original changes (or vice versa) even though you used spread.',
      cause: 'Spread is shallow: nested objects/arrays are still shared.',
      fix: 'Spread every level you modify, or `structuredClone(plain)` for a deep copy.',
    },
    {
      symptom: 'A value destructured from a store or reactive object stops updating on screen.',
      cause: 'Destructuring copied a plain value out of the proxy.',
      fix: 'Use `toRefs(state)` (or Pinia\'s `storeToRefs(store)`), or read `state.x` directly.',
    },
    {
      symptom: 'A number shows a fallback ("N/A", 1, "?") when it is 0.',
      cause: '`||` treats 0 as missing.',
      fix: 'Replace `||` with `??`.',
    },
  ],

  bestPractices: [
    'Destructure what a function needs at the top of it — it documents the inputs.',
    'Use `??` for defaults, `||` only for boolean logic.',
    'Create new objects/arrays with spread instead of mutating data you don\'t own.',
    'Remember spread is shallow; copy each level you change.',
    'Use `?.` where absence is expected (loading, optional fields), not to silence real bugs.',
    'In Vue, use `toRefs()` / `storeToRefs()` when destructuring reactive objects or stores.',
  ],

  useCases: [
    'Destructuring props, composable results (`const { data, error } = useFetch(url)`) and event payloads.',
    'Emitting a changed copy of a form: `emit(\'save\', { ...draft })`.',
    'Merging options with defaults: `{ ...defaults, ...options }`.',
    'Templates that show nested API data safely: `{{ order?.customer?.name ?? \'Guest\' }}`.',
    'Building class names and URLs with template literals: `` `/api/users/${id}` ``.',
  ],

  whenToUse: {
    use: [
      'Destructuring for function parameters and composable return values.',
      'Spread for immutable updates and merging defaults.',
      '`?.` and `??` for genuinely optional or not-yet-loaded data.',
    ],
    avoid: [
      'Destructuring `reactive()` objects without `toRefs()`.',
      'Destructuring `defineProps()` in projects on Vue < 3.5 (use `props.x`).',
      'Deeply nested spreads that hide what changes — restructure the data instead.',
      '`?.` chains on values that should never be missing — let the error surface.',
    ],
  },

  comparison: {
    title: '`||` vs `??` vs destructuring defaults',
    headers: ['Value of `x`', '`x || \'fallback\'`', '`x ?? \'fallback\'`', '`const { x = \'fallback\' } = obj`'],
    rows: [
      ['`undefined`', 'fallback', 'fallback', 'fallback'],
      ['`null`', 'fallback', 'fallback', '**null**'],
      ['`0`', '**fallback**', '0', '0'],
      ['`\'\'`', '**fallback**', '\'\'', '\'\''],
      ['`false`', '**fallback**', 'false', 'false'],
      ['`\'Ada\'`', '\'Ada\'', '\'Ada\'', '\'Ada\''],
    ],
    note: 'Bold cells are the usual surprises. Next: [Array superpowers](lesson:array-methods) uses spread and destructuring constantly.',
  },

  quiz: [
    {
      id: 'modern-js-syntax-q1',
      type: 'mcq',
      prompt: 'After `const { name: fullName } = user`, which variable exists?',
      options: [
        { text: '`name`', why: 'With `name: fullName`, `name` is the property to read and `fullName` is the new variable.' },
        { text: '`fullName`' },
        { text: 'Both `name` and `fullName`', why: 'Only the variable on the right of the colon is created.' },
        { text: 'Neither — it\'s a syntax error', why: 'It\'s valid renaming syntax.' },
      ],
      answer: 1,
      explanation: 'In object destructuring, `property: variable` reads `user.name` into a variable called `fullName`.',
    },
    {
      id: 'modern-js-syntax-q2',
      type: 'output',
      prompt: 'What is logged?',
      code: { lang: 'js', code: `const points = 0\nconsole.log(points || 10, points ?? 10)` },
      options: [
        { text: '10 10', why: '`??` only falls back for null/undefined, so `points ?? 10` is 0.' },
        { text: '10 0' },
        { text: '0 0', why: '`||` falls back for any falsy value, including 0.' },
        { text: '0 10', why: 'You have them reversed.' },
      ],
      answer: 1,
      explanation: '`0 || 10` is 10 because 0 is falsy. `0 ?? 10` is 0 because 0 is neither null nor undefined.',
    },
    {
      id: 'modern-js-syntax-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: { lang: 'js', code: `const { role = 'Member' } = { role: null }\nconsole.log(role)` },
      options: [
        { text: 'Member', why: 'Destructuring defaults only apply when the value is `undefined`.' },
        { text: 'null' },
        { text: 'undefined', why: 'The property exists and its value is `null`.' },
        { text: 'TypeError', why: 'Destructuring an object with a null property is fine; destructuring `null` itself would throw.' },
      ],
      answer: 1,
      explanation: 'Defaults kick in for `undefined` only. For APIs that send `null`, use `user.role ?? \'Member\'`.',
    },
    {
      id: 'modern-js-syntax-q4',
      type: 'bug',
      prompt: '`tags` ends up as `[undefined, undefined]`. Click the buggy line.',
      code: { lang: 'js', code: `const names = ['vue', 'pinia']\n\nconst toTag = (label) => { label: label }\n\nconst tags = names.map(toTag)\nconsole.log(tags)` },
      answerLine: 3,
      explanation: 'The `{` after `=>` starts a function body; `label:` becomes a statement label and nothing is returned. Write `(label) => ({ label })`.',
    },
    {
      id: 'modern-js-syntax-q5',
      type: 'fill',
      prompt: 'Read the city if the user has an address, otherwise use `\'Unknown\'` (but keep an empty-string city if the API sends one).',
      code: { lang: 'js', code: `const city = user.address___city ___ 'Unknown'` },
      answer: [['?.'], ['??']],
      explanation: '`?.` stops with `undefined` when `address` is missing; `??` then supplies the fallback — without replacing `\'\'` the way `||` would.',
    },
    {
      id: 'modern-js-syntax-q6',
      type: 'mcq',
      prompt: '`const copy = { ...cart }` then `copy.items.push(\'pen\')`. What happens to `cart.items`?',
      options: [
        { text: 'Nothing — spread made a full copy', why: 'Spread is shallow: `copy.items` and `cart.items` are the same array.' },
        { text: 'It also contains `\'pen\'`' },
        { text: 'It throws because `cart` is const', why: '`const` doesn\'t prevent mutation, and we mutated a shared array anyway.' },
        { text: 'It becomes `undefined`', why: 'Nothing removes the property.' },
      ],
      answer: 1,
      explanation: 'Only the top-level object is new. Copy nested arrays too: `{ ...cart, items: [...cart.items, \'pen\'] }`.',
    },
    {
      id: 'modern-js-syntax-q7',
      type: 'short',
      prompt: 'Why does `const { count } = reactive({ count: 0 })` lose reactivity, and how do you fix it?',
      answer: 'Destructuring reads `count` from the proxy once and copies the number into a plain variable. Later reads of that variable don\'t go through the proxy, so Vue can\'t track or trigger anything. Use `const { count } = toRefs(state)` (refs linked to the reactive object), or keep reading `state.count`.',
    },
  ],

  exercises: [
    {
      id: 'merge-settings',
      title: 'Merge settings without mutating',
      difficulty: 'beginner',
      prompt: `
Implement \`mergeSettings(defaults, overrides)\` in \`settings.js\`. It returns a **new** settings object where:

- every top-level value from \`overrides\` replaces the one from \`defaults\`;
- the nested \`notifications\` object is merged **one level deep** (overriding \`push\` keeps the default \`email\`);
- the result's \`notifications\` is always a **new** object;
- neither \`defaults\` nor \`overrides\` is changed.

The starter uses \`Object.assign(defaults, overrides)\` — run it and see why that\'s a problem.
`,
      files: {
        'settings.js': `export function mergeSettings(defaults, overrides) {
  return Object.assign(defaults, overrides)
}`,
        'main.js': `import { mergeSettings } from './settings.js'

const defaults = { theme: 'light', fontSize: 16, notifications: { email: true, push: false } }
const mine = mergeSettings(defaults, { theme: 'dark', notifications: { push: true } })

const app = document.getElementById('app')
app.innerHTML = '<pre class="out"></pre>'
app.querySelector('.out').textContent =
  'mine: ' + JSON.stringify(mine, null, 2) + '\\n\\ndefaults: ' + JSON.stringify(defaults, null, 2)`,
      },
      hints: [
        'Start with `{ ...defaults, ...overrides }` — later properties win.',
        'That replaces `notifications` wholesale. Add a `notifications` property after the spreads that merges the two nested objects.',
        '`notifications: { ...defaults.notifications, ...overrides.notifications }` — spreading `undefined` is allowed and adds nothing.',
      ],
      solution: {
        explanation: '`Object.assign(defaults, …)` writes *into* `defaults`, so every caller after the first gets corrupted defaults, and nested objects are replaced instead of merged. Spreading into fresh literals at each level you care about gives a new object every time and leaves the inputs alone.',
        files: {
          'settings.js': `export function mergeSettings(defaults, overrides) {
  return {
    ...defaults,
    ...overrides,
    notifications: { ...defaults.notifications, ...overrides.notifications },
  }
}`,
          'main.js': `import { mergeSettings } from './settings.js'

const defaults = { theme: 'light', fontSize: 16, notifications: { email: true, push: false } }
const mine = mergeSettings(defaults, { theme: 'dark', notifications: { push: true } })

const app = document.getElementById('app')
app.innerHTML = '<pre class="out"></pre>'
app.querySelector('.out').textContent =
  'mine: ' + JSON.stringify(mine, null, 2) + '\\n\\ndefaults: ' + JSON.stringify(defaults, null, 2)`,
        },
      },
      tests: [
        { name: 'top-level overrides win, others are kept', code: `const { mergeSettings } = requireModule('settings.js')\nconst d = { theme: 'light', fontSize: 16, notifications: { email: true, push: false } }\nconst r = mergeSettings(d, { theme: 'dark' })\nexpect(r.theme).toBe('dark')\nexpect(r.fontSize).toBe(16)` },
        { name: 'notifications are merged one level deep', code: `const { mergeSettings } = requireModule('settings.js')\nconst d = { theme: 'light', fontSize: 16, notifications: { email: true, push: false } }\nconst r = mergeSettings(d, { notifications: { push: true } })\nexpect(r.notifications.email).toBe(true)\nexpect(r.notifications.push).toBe(true)` },
        { name: 'inputs are not mutated', code: `const { mergeSettings } = requireModule('settings.js')\nconst d = { theme: 'light', fontSize: 16, notifications: { email: true, push: false } }\nconst o = { theme: 'dark', notifications: { push: true } }\nmergeSettings(d, o)\nexpect(d.theme).toBe('light')\nexpect(d.notifications.push).toBe(false)\nexpect(Object.keys(o.notifications)).toEqual(['push'])` },
        { name: 'the result gets its own notifications object', code: `const { mergeSettings } = requireModule('settings.js')\nconst d = { theme: 'light', fontSize: 16, notifications: { email: true, push: false } }\nconst r = mergeSettings(d, { fontSize: 18 })\nexpect(r === d).toBe(false)\nexpect(r.notifications === d.notifications).toBe(false)\nexpect(r.notifications.email).toBe(true)` },
      ],
    },
    {
      id: 'immutable-cart',
      title: 'Immutable cart helpers',
      difficulty: 'intermediate',
      prompt: `
In \`cart.js\`, implement three functions. **None may mutate their input**; each returns a new cart object.

- \`addItem(cart, item)\` → a cart whose \`items\` array is a **new** array with \`item\` added at the end.
- \`applyCoupon(cart, code)\` → a cart with \`coupon\` set to \`code\` (other properties unchanged).
- \`removeCoupon(cart)\` → a cart **without** a \`coupon\` property at all (\`'coupon' in result\` is \`false\`).

Use spread for the first two and object rest for the third.
`,
      files: {
        'cart.js': `export function addItem(cart, item) {
  cart.items.push(item)
  return cart
}

export function applyCoupon(cart, code) {
  cart.coupon = code
  return cart
}

export function removeCoupon(cart) {
  delete cart.coupon
  return cart
}`,
        'main.js': `import { addItem, applyCoupon, removeCoupon } from './cart.js'

const empty = { owner: 'Ada', items: [] }
const withMug = addItem(empty, { name: 'Mug', price: 12 })
const discounted = applyCoupon(withMug, 'SAVE10')
const plain = removeCoupon(discounted)

const app = document.getElementById('app')
app.innerHTML = '<pre class="out"></pre>'
app.querySelector('.out').textContent = [empty, withMug, discounted, plain]
  .map((c) => JSON.stringify(c))
  .join('\\n')`,
      },
      hints: [
        '`addItem`: return `{ ...cart, items: [...cart.items, item] }`.',
        '`applyCoupon`: return `{ ...cart, coupon: code }`.',
        '`removeCoupon`: `const { coupon, ...rest } = cart` collects every property except `coupon` into `rest`; return `rest`.',
      ],
      solution: {
        explanation: 'Each helper builds a fresh object (and a fresh array where items change) instead of editing the old one. The page now shows four distinct snapshots — exactly what you need for undo, change detection and predictable shared state.',
        files: {
          'cart.js': `export function addItem(cart, item) {
  return { ...cart, items: [...cart.items, item] }
}

export function applyCoupon(cart, code) {
  return { ...cart, coupon: code }
}

export function removeCoupon(cart) {
  const { coupon, ...rest } = cart
  return rest
}`,
          'main.js': `import { addItem, applyCoupon, removeCoupon } from './cart.js'

const empty = { owner: 'Ada', items: [] }
const withMug = addItem(empty, { name: 'Mug', price: 12 })
const discounted = applyCoupon(withMug, 'SAVE10')
const plain = removeCoupon(discounted)

const app = document.getElementById('app')
app.innerHTML = '<pre class="out"></pre>'
app.querySelector('.out').textContent = [empty, withMug, discounted, plain]
  .map((c) => JSON.stringify(c))
  .join('\\n')`,
        },
      },
      tests: [
        { name: 'addItem returns a new cart and a new items array', code: `const { addItem } = requireModule('cart.js')\nconst cart = { owner: 'Ada', items: [] }\nconst next = addItem(cart, { name: 'Mug' })\nexpect(next === cart).toBe(false)\nexpect(next.items === cart.items).toBe(false)\nexpect(next.items).toHaveLength(1)\nexpect(cart.items).toHaveLength(0)\nexpect(next.owner).toBe('Ada')` },
        { name: 'applyCoupon does not mutate', code: `const { applyCoupon } = requireModule('cart.js')\nconst cart = { owner: 'Ada', items: [] }\nconst next = applyCoupon(cart, 'SAVE10')\nexpect(next.coupon).toBe('SAVE10')\nexpect('coupon' in cart).toBe(false)` },
        { name: 'removeCoupon drops the key without mutating', code: `const { removeCoupon } = requireModule('cart.js')\nconst cart = { owner: 'Ada', items: [], coupon: 'SAVE10' }\nconst next = removeCoupon(cart)\nexpect('coupon' in next).toBe(false)\nexpect(next.owner).toBe('Ada')\nexpect(cart.coupon).toBe('SAVE10')` },
      ],
    },
  ],

  interview: [
    {
      id: 'modern-js-syntax-shallow-copy',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does it mean that spread creates a *shallow* copy, and when does that bite you in a Vue app?',
      answer: 'Spread copies the top-level properties into a new object, but values that are objects or arrays are copied as references, so nested data is shared between the original and the copy. In Vue it bites when you copy state into a form draft (`{ ...props.user }`) and then edit a nested field like `draft.address.city` — you mutate the parent\'s data. Fix by copying each nested level you edit or by deep-cloning plain data with `structuredClone()` (after `toRaw()` for reactive state).',
      explanation: 'A shallow copy gives you a new box containing the same inner boxes.',
      whyAsked: 'Shallow copies cause subtle shared-state bugs; interviewers want to see you know where the boundary is.',
      mistakes: ['Saying spread deep-copies.', 'Recommending `JSON.parse(JSON.stringify(x))` without mentioning it drops `undefined`, functions and turns Dates into strings.', 'Not knowing `structuredClone` throws on Vue proxies.'],
      followUps: ['How would you deep-copy a reactive object?', 'What does `JSON.parse(JSON.stringify(obj))` lose?'],
      modelAnswer: 'Spread creates a new object and copies each own property\'s value. For primitives that\'s a real copy, but for nested objects and arrays the value is a reference, so the copy and the original share them. In Vue that shows up with edit forms: I spread `props.user` into a draft, edit `draft.address.city`, and I\'ve just mutated the parent. I either spread each level I change, or deep-clone plain data with `structuredClone(toRaw(user))`. The trade-off is cost — deep clones of big data aren\'t free — so I clone only what the form edits.',
    },
    {
      id: 'modern-js-syntax-or-vs-nullish',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'A cart item has `quantity: 0`. What does each line display?',
      code: {
        lang: 'js',
        code: `const item = { quantity: 0, note: '' }
console.log(item.quantity || 1, item.quantity ?? 1)
console.log(item.note || 'none', item.note ?? 'none')`,
      },
      options: ['1 1 / none none', '1 0 / none \'\'(empty)', '0 0 / \'\' \'\'', '0 1 / \'\' none'],
      correctOption: 1,
      answer: 'First line: `1 0`. Second line: `none` and an empty string. `||` replaces every falsy value; `??` replaces only `null` and `undefined`.',
      explanation: 'Use `??` for defaults whenever 0, empty strings or false are meaningful values.',
      whyAsked: 'Shows whether you pick the right operator for defaults — a frequent source of UI bugs like "0 items shows 1".',
      mistakes: ['Thinking `??` and `||` are interchangeable.', 'Forgetting empty strings are falsy.'],
      followUps: ['What does `??=` do?', 'Why can\'t you write `a || b ?? c` without parentheses?'],
      modelAnswer: 'The first line prints 1 then 0, and the second prints "none" then an empty string. `||` treats every falsy value — 0, empty string, false, NaN — as missing, while `??` only treats null and undefined as missing. For defaults I almost always want `??`, because 0 quantity or an intentionally empty note are real values.',
    },
    {
      id: 'modern-js-syntax-default-null',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does `greet(null)` return, and what does `greet()` return?',
      code: {
        lang: 'js',
        code: `function greet(name = 'friend') {
  return \`Hello, \${name}!\`
}`,
      },
      options: ['"Hello, friend!" both times', '"Hello, null!" and "Hello, friend!"', '"Hello, null!" and "Hello, undefined!"', 'A TypeError for null'],
      correctOption: 1,
      answer: '`greet(null)` → `"Hello, null!"`; `greet()` → `"Hello, friend!"`. Default parameters (like destructuring defaults) apply only when the argument is `undefined`.',
      explanation: 'Passing `null` is passing a value. Only a missing or explicitly `undefined` argument triggers the default.',
      whyAsked: 'APIs often return `null`; knowing this prevents "null" appearing in the UI.',
      mistakes: ['Assuming defaults handle any "empty" value.', 'Not knowing destructuring defaults follow the same rule.'],
      followUps: ['How would you make `null` fall back too?', 'Do Vue prop `default`s behave the same way?'],
      modelAnswer: '`greet(null)` gives "Hello, null!" and `greet()` gives "Hello, friend!", because defaults only replace undefined. If null should also fall back I\'d write `const n = name ?? \'friend\'` inside the function. Vue prop defaults follow a similar rule: a default applies when the prop is absent or undefined, but an explicit null is passed through.',
    },
    {
      id: 'modern-js-syntax-reactive-destructure',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Clicking the button changes nothing on screen. What\'s wrong?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { reactive } from 'vue'

const state = reactive({ count: 0 })
let { count } = state

function add() {
  count++
}
</script>

<template>
  <button @click="add">{{ count }}</button>
</template>`,
      },
      answer: '`let { count } = state` copies the number 0 out of the reactive proxy into a plain local variable. `count++` changes only that variable; `state.count` never changes, and the template\'s `count` isn\'t reactive. Fix: use `state.count++` and `{{ state.count }}`, or `const { count } = toRefs(state)` with `count.value++`.',
      explanation: 'Reactivity lives in property access on the proxy. Destructuring reads once and disconnects.',
      whyAsked: 'One of the most common Composition API mistakes; tests understanding of how proxies track reads.',
      mistakes: ['Suggesting `nextTick`.', 'Switching to `ref` without explaining why destructuring broke it.', 'Not mentioning `toRefs`.'],
      followUps: ['Why does destructuring `defineProps()` work in Vue 3.5 but not this?', 'What does `storeToRefs` do for Pinia?'],
      modelAnswer: 'Destructuring pulls the current value of `state.count` — a plain number — into a local variable, so the link to the proxy is gone. Incrementing the local variable never goes through the proxy\'s set trap, so nothing triggers, and the template binding is just a non-reactive value. I\'d either keep using `state.count`, or `toRefs(state)` to get refs connected to the reactive object. Vue 3.5\'s props destructure works differently because the compiler rewrites those variables back to `props.x` accesses.',
    },
    {
      id: 'modern-js-syntax-props-destructure',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate writes `const { userId } = defineProps([\'userId\'])` and then `watch(userId, load)`. It works in one project and errors in another. Explain.',
      answer: 'Reactive props destructure is stable from Vue 3.5: the compiler rewrites `userId` to `props.userId` everywhere in `<script setup>`. But `watch(userId, …)` passes the *current value* (a string or number), not a reactive source, so Vue warns that it is an invalid watch source — even in 3.5. It must be `watch(() => userId, load)`. In projects on Vue < 3.5, destructuring isn\'t reactive at all, so `userId` is a constant snapshot; use `props.userId` and `watch(() => props.userId, load)` there.',
      explanation: 'The compiler can rewrite *reads*, but passing a variable to a function hands over its value; a getter keeps the read lazy and trackable.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { watch } from 'vue'
const { userId } = defineProps(['userId'])   // Vue 3.5+

watch(() => userId, (id) => load(id), { immediate: true }) // ✅ getter
// watch(userId, load)                                     // ❌ not a reactive source
</script>`,
      },
      whyAsked: 'Tests up-to-date Vue knowledge, the difference between a value and a reactive source, and version awareness.',
      mistakes: ['Claiming destructured props are refs.', 'Not knowing the feature is version-dependent.', 'Recommending `toRefs(props)` without mentioning the 3.5 alternative.'],
      followUps: ['How do you give a destructured prop a default?', 'How would you pass a destructured prop into a composable and keep it reactive?'],
      modelAnswer: 'From Vue 3.5, destructuring defineProps is reactive because the compiler rewrites each use of `userId` into `props.userId`. But calling `watch(userId, …)` evaluates `props.userId` right there and passes a plain value, which isn\'t a valid watch source, so Vue warns. The fix is a getter, `watch(() => userId, load)`, and the same applies when passing it into a composable — pass a getter and normalise with `toValue`. On older Vue versions destructuring isn\'t reactive at all, so I\'d use `props.userId` there.',
    },
    {
      id: 'modern-js-syntax-build-request',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `buildRequest(url, options)` in `request.js` using destructuring with defaults and spread. It returns `{ url, method, headers, body? }` where `method` defaults to `\'GET\'`, `headers` always include `Accept: \'application/json\'` merged with any custom headers (custom ones win), and `body`, if given, is `JSON.stringify`-ed. If no body is given, the result must not have a `body` key. Calling `buildRequest(\'/x\')` with no options must work.',
      starter: {
        files: {
          'request.js': `export function buildRequest(url, options) {
  // TODO
  return { url }
}`,
          'main.js': `import { buildRequest } from './request.js'

const app = document.getElementById('app')
app.innerHTML = '<pre class="out"></pre>'
app.querySelector('.out').textContent = JSON.stringify(
  buildRequest('/api/todos', { method: 'POST', body: { title: 'Buy milk' } }),
  null,
  2,
)`,
        },
      },
      tests: [
        { name: 'defaults: GET with an Accept header, no body key', code: `const { buildRequest } = requireModule('request.js')\nconst r = buildRequest('/x')\nexpect(r.url).toBe('/x')\nexpect(r.method).toBe('GET')\nexpect(r.headers.Accept).toBe('application/json')\nexpect('body' in r).toBe(false)` },
        { name: 'custom method, merged headers and a JSON body', code: `const { buildRequest } = requireModule('request.js')\nconst r = buildRequest('/x', { method: 'POST', headers: { 'X-Trace': 'abc' }, body: { a: 1 } })\nexpect(r.method).toBe('POST')\nexpect(r.headers.Accept).toBe('application/json')\nexpect(r.headers['X-Trace']).toBe('abc')\nexpect(r.body).toBe('{"a":1}')` },
        { name: 'custom headers override the default', code: `const { buildRequest } = requireModule('request.js')\nconst r = buildRequest('/x', { headers: { Accept: 'text/plain' } })\nexpect(r.headers.Accept).toBe('text/plain')` },
      ],
      hints: ['Destructure in the parameter list with a default for the whole object: `function buildRequest(url, { method = \'GET\', headers = {}, body } = {})`.', 'Build the result with `{ url, method, headers: { Accept: \'application/json\', ...headers } }`, then add `body` only when `body !== undefined`.'],
      answer: 'Destructure options with defaults (including `= {}` for the whole object), merge headers with spread so custom ones come last, and only add `body` when one was provided.',
      solution: {
        files: {
          'request.js': `export function buildRequest(url, { method = 'GET', headers = {}, body } = {}) {
  const request = {
    url,
    method,
    headers: { Accept: 'application/json', ...headers },
  }
  if (body !== undefined) request.body = JSON.stringify(body)
  return request
}`,
          'main.js': `import { buildRequest } from './request.js'

const app = document.getElementById('app')
app.innerHTML = '<pre class="out"></pre>'
app.querySelector('.out').textContent = JSON.stringify(
  buildRequest('/api/todos', { method: 'POST', body: { title: 'Buy milk' } }),
  null,
  2,
)`,
        },
      },
      explanation: 'The `= {}` default on the destructured parameter prevents "cannot destructure undefined"; header order in the spread decides who wins.',
      whyAsked: 'Option objects with defaults are everywhere (API clients, composables); this checks fluent use of destructuring and spread.',
      mistakes: ['Forgetting `= {}` so a call without options throws.', 'Spreading custom headers before the default, so the default always wins.', 'Adding `body: undefined` instead of omitting the key.'],
      followUps: ['How would you support a `query` object that becomes a query string?', 'Why might you want to omit `Content-Type` for `FormData` bodies?'],
      modelAnswer: 'I destructure the options right in the signature with defaults — `method = \'GET\'`, `headers = {}`, and a default of an empty object for the whole parameter so calling without options doesn\'t throw. Headers are merged as `{ Accept: \'application/json\', ...headers }` so custom headers win. I add `body` only if one was passed, stringified, so GET requests don\'t carry a body key.',
    },
  ],

  takeaways: [
    'Destructuring pulls properties or items into variables, with renaming, defaults and rest.',
    'Spread (`...`) builds new objects/arrays; rest (`...`) collects leftovers. Spread copies are shallow.',
    'Defaults (destructuring and parameters) apply only to `undefined`; use `??` when `null` should fall back too.',
    '`??` keeps 0, \'\' and false; `||` replaces them — prefer `??` for defaults.',
    '`?.` returns `undefined` instead of throwing on null/undefined — use it where absence is expected.',
    'Destructuring a `reactive()` object loses reactivity (use `toRefs`); destructuring `defineProps()` is reactive only in Vue 3.5+.',
  ],
}
