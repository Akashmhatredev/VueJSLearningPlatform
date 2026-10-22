// Lesson: Array superpowers — map, filter, reduce.

const productsModule = `export const products = [
  { id: 1, name: 'Desk Lamp', category: 'home', price: 39, inStock: true },
  { id: 2, name: 'Notebook', category: 'office', price: 6, inStock: true },
  { id: 3, name: 'Headphones', category: 'tech', price: 89, inStock: false },
  { id: 4, name: 'Coffee Mug', category: 'home', price: 12, inStock: true },
  { id: 5, name: 'USB Cable', category: 'tech', price: 9, inStock: true },
]`

const shopMain = `import { products } from './products.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <label><input type="checkbox" class="in-stock" /> In stock only</label>
  <input class="search" placeholder="Search products" />
  <ul class="list"></ul>
  <p class="summary"></p>
\`

const inStockBox = app.querySelector('.in-stock')
const searchBox = app.querySelector('.search')
const list = app.querySelector('.list')
const summary = app.querySelector('.summary')

function render() {
  const query = searchBox.value.trim()

  const visible = products
    .filter((p) => !inStockBox.checked || p.inStock) // keep some items
    .filter((p) => p.name.includes(query))           // keep matches

  const items = visible.map((p) => {                 // transform each item
    const li = document.createElement('li')
    li.className = 'product'
    li.textContent = p.name + ' — $' + p.price
    return li
  })

  list.replaceChildren(...items)
  summary.textContent = visible.length + ' of ' + products.length + ' products'
}

inStockBox.addEventListener('change', render)
searchBox.addEventListener('input', render)
render()`

export default {
  id: 'array-methods',
  title: 'Array superpowers: map, filter, reduce',
  summary: 'Transform, filter, search and summarise lists with array methods — the exact toolkit behind every filtered, sorted, totalled list in a Vue app.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['js-essentials', 'modern-js-syntax'],
  related: ['list-rendering', 'computed', 'arrays-objects-reactivity', 'search-pagination', 'large-lists'],
  tags: ['javascript', 'arrays', 'map', 'filter', 'reduce', 'find', 'some', 'every', 'sort', 'toSorted', 'immutability', 'callbacks'],
  apis: [
    { name: 'array.map(fn)', summary: 'A new array with `fn(item)` for every item — same length, transformed.' },
    { name: 'array.filter(fn)', summary: 'A new array with only the items for which `fn(item)` is truthy.' },
    { name: 'array.reduce(fn, initial)', summary: 'Folds the array into one value (a total, an object, a string…).' },
    { name: 'array.find(fn) / findIndex(fn)', summary: 'The first matching item (or `undefined`) / its index (or -1).' },
    { name: 'array.some(fn) / every(fn)', summary: '`true` if at least one / all items match.' },
    { name: 'array.sort(compare)', summary: 'Sorts **in place** (mutates). Without a compare function it sorts as strings.' },
    { name: 'array.toSorted(compare)', summary: 'ES2023: returns a sorted copy and leaves the original untouched.' },
  ],
  docs: [
    { label: 'MDN — Array', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array' },
    { label: 'MDN — Array.prototype.reduce()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce' },
    { label: 'MDN — Array.prototype.toSorted()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted' },
    { label: 'Vue Guide — List Rendering: displaying filtered/sorted results', url: 'https://vuejs.org/guide/essentials/list.html#displaying-filtered-sorted-results' },
  ],

  intro: `
Almost every screen in an app is a list: products, messages, todos, search results. And almost every list needs the same handful of operations: **show only some** items, **turn each item into something else**, **find one**, **add them up**, **put them in order**.

JavaScript arrays have a method for each of those. You hand the method a small function — "keep it if it's in stock", "turn it into its name" — and it does the looping for you:

\`\`\`js
const inStock = products.filter((p) => p.inStock)
const names = inStock.map((p) => p.name)
const total = inStock.reduce((sum, p) => sum + p.price, 0)
\`\`\`

In Vue you'll write exactly these lines inside \`computed()\` to feed \`v-for\`.
`,

  why: `
Without these methods you write loops — and loops make you manage everything yourself: a counter, an empty result array, pushing, remembering the right condition.

\`\`\`js
const names = []
for (let i = 0; i < products.length; i++) {
  if (products[i].inStock) {
    names.push(products[i].name)
  }
}
\`\`\`

That works, but it hides *what* you're doing under *how* you loop. \`products.filter(isInStock).map(toName)\` reads like the sentence you'd say out loud.

There's a second, bigger reason: \`map\`, \`filter\` and \`reduce\` **don't change the original array** — they return new ones. That makes them safe to use inside a Vue \`computed()\`, which must never modify the state it reads. Knowing which methods *do* mutate (\`sort\`, \`reverse\`, \`splice\`, \`push\`…) prevents a whole class of "my list reordered itself" bugs.
`,

  eli15: `
Picture a conveyor belt of fruit going past you.

- **filter** is a person who only lets apples through. Everything else drops off. Fewer fruits come out the other end.
- **map** is a machine that turns every fruit into juice. Same number of things come out, but each one is changed.
- **reduce** is a big bucket at the end that collects everything into **one** thing — say, the total weight of all the fruit.
- **find** is someone who shouts "found one!" at the first banana and stops looking.
- **some** asks "is there *any* rotten fruit?"; **every** asks "is *every* fruit ripe?"

And the best part: the original pile of fruit is never touched. The belt makes new piles.
`,

  analogy: {
    title: 'A sorting line at a recycling plant',
    body: `
Items arrive on a conveyor belt. One station removes everything that isn't plastic, the next shreds each bottle into flakes, and at the end a scale weighs the whole lot. Each station does one simple job, and you can rearrange or add stations without rebuilding the belt.

An array method chain is that line. Each method is a station; the small function you pass in is the station's instruction.
`,
    mapping: [
      ['the conveyor belt', 'the array being processed'],
      ['a station that removes items', '`filter((item) => condition)`'],
      ['a station that changes each item', '`map((item) => newItem)`'],
      ['the scale at the end', '`reduce((total, item) => total + item.weight, 0)`'],
      ['the station\'s instruction card', 'the callback function you pass in'],
      ['the original pile, left untouched', 'non-mutating methods return a new array'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'A loop vs a method chain',
    caption: 'Both compute the names and total of in-stock products. The chain states *what* happens; the loop makes you manage *how*.',
    alt: 'Two code panels. Left: a for loop with an index variable, an if statement, a names array and a running total. Right: products.filter by inStock, then map to names and reduce to a total. Bullet points describe the differences.',
    props: {
      left: {
        label: 'for loop',
        lang: 'js',
        code: `const names = []
let total = 0
for (let i = 0; i < products.length; i++) {
  const p = products[i]
  if (p.inStock) {
    names.push(p.name)
    total += p.price
  }
}`,
      },
      right: {
        label: 'array methods',
        lang: 'js',
        code: `const inStock = products.filter((p) => p.inStock)
const names = inStock.map((p) => p.name)
const total = inStock.reduce((sum, p) => sum + p.price, 0)`,
      },
      points: [
        'No index variable, no manual `push`, no off-by-one risk.',
        'Each line has one job and a name that says what it does.',
        'The original `products` array is never modified — safe inside `computed()`.',
        'The loop does everything in one pass; the chain makes intermediate arrays. For normal UI-sized lists that cost is negligible — measure before optimising.',
      ],
    },
  },

  syntax: [
    `
Every callback receives \`(item, index, array)\`. You usually only need \`item\`.

#### map — transform every item (same length)
`,
    {
      code: `const prices = products.map((p) => p.price)            // [39, 6, 89, 12, 9]
const labels = products.map((p, i) => \`\${i + 1}. \${p.name}\`)
const withTax = products.map((p) => ({ ...p, price: p.price * 1.2 })) // new objects`,
      lang: 'js',
      title: 'map',
    },
    `
#### filter — keep some items
`,
    {
      code: `const inStock = products.filter((p) => p.inStock)
const cheap = products.filter((p) => p.price < 10)
const withoutLamp = products.filter((p) => p.id !== 1)   // "remove" without mutating`,
      lang: 'js',
      title: 'filter',
    },
    `
#### reduce — boil it down to one value
`,
    {
      code: `const total = products.reduce((sum, p) => sum + p.price, 0)   // always pass the initial value

const byCategory = products.reduce((groups, p) => {
  groups[p.category] = groups[p.category] ?? []
  groups[p.category].push(p)
  return groups                       // always return the accumulator
}, {})
// { home: [Lamp, Mug], office: [Notebook], tech: [Headphones, Cable] }`,
      lang: 'js',
      title: 'reduce',
    },
    `
#### Searching and checking
`,
    {
      code: `products.find((p) => p.id === 4)        // { id: 4, name: 'Coffee Mug', … } or undefined
products.findIndex((p) => p.id === 4)   // 3, or -1 if missing
products.some((p) => !p.inStock)        // true — at least one is out of stock
products.every((p) => p.price > 0)      // true — all have a price
['vue', 'pinia'].includes('vue')        // true — for simple values`,
      lang: 'js',
      title: 'find, some, every, includes',
    },
    `
#### Sorting — careful, it mutates
`,
    {
      code: `[10, 1, 2].sort()                           // [1, 10, 2] — compared as STRINGS!
products.sort((a, b) => a.price - b.price)  // ⚠ reorders \`products\` itself

const cheapest = [...products].sort((a, b) => a.price - b.price) // copy first
const cheapest2 = products.toSorted((a, b) => a.price - b.price) // ES2023: returns a copy
const byName = products.toSorted((a, b) => a.name.localeCompare(b.name))`,
      lang: 'js',
      title: 'sort and toSorted',
    },
    {
      callout: 'version',
      title: 'toSorted() and friends',
      text: '`toSorted()`, `toReversed()`, `toSpliced()` and `with()` are ES2023 non-mutating versions of `sort`, `reverse`, `splice` and index assignment. They work in current versions of all major browsers and Node 20+; if you support older browsers, use `[...arr].sort()` instead.',
    },
    `
#### Mutating vs non-mutating
`,
    {
      code: `// MUTATE the array they're called on:
push  pop  shift  unshift  splice  sort  reverse  fill

// RETURN something new, original untouched:
map  filter  reduce  slice  concat  find  some  every  includes  join
toSorted  toReversed  toSpliced  with  flat  flatMap`,
      lang: 'text',
      title: 'know which is which',
    },
    `
#### In Vue
`,
    {
      code: `<script setup>
import { ref, computed } from 'vue'

const products = ref([/* … */])
const query = ref('')

const visible = computed(() =>
  products.value
    .filter((p) => p.name.toLowerCase().includes(query.value.toLowerCase()))
    .toSorted((a, b) => a.price - b.price)      // never .sort() the source here
)
const total = computed(() => visible.value.reduce((sum, p) => sum + p.price, 0))

function remove(id) {
  products.value = products.value.filter((p) => p.id !== id) // or splice — both are reactive
}
</script>

<template>
  <input v-model="query" />
  <li v-for="p in visible" :key="p.id">{{ p.name }}</li>
  <p>Total: \${{ total }}</p>
</template>`,
      lang: 'vue',
      title: 'array methods feeding v-for',
    },
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: shopMain,
    intro: 'A filterable product list in plain JavaScript. The heart of it is a five-line chain inside `render()` — the same chain you\'ll later put in a `computed()`.',
    steps: [
      { lines: [1], text: 'The product data lives in its own module (`products.js`). It is never modified anywhere in this file.' },
      { lines: [17], text: '`render()` starts by reading the current search text from the input. Every time the user types or ticks the box, we recompute everything from scratch.' },
      { lines: [19, 21], text: 'Two `filter` calls chained. Each returns a **new** array: first "only in-stock if the box is ticked", then "only names containing the query". `products` itself is untouched.' },
      { lines: [23, 28], text: '`map` turns each product object into an `<li>` element — same number of items, different shape. Using `textContent` keeps product names from being parsed as HTML.' },
      { lines: [30, 31], text: '`replaceChildren(...items)` swaps the list contents (spread passes the array as separate arguments). The summary uses `.length` of the filtered array.' },
      { lines: [34, 36], text: 'Re-render on every change. Notice the search is case-sensitive: typing "lamp" finds nothing. That\'s your first experiment.' },
    ],
  },

  playground: {
    title: 'Product filter',
    objective: 'Improve a filtered product list with `filter`, `map`, `toSorted` and `reduce` — without ever mutating the original data.',
    files: { 'main.js': shopMain, 'products.js': productsModule },
    expected: 'A checkbox, a search box, five products and **5 of 5 products**. Ticking **In stock only** hides the headphones. Typing **Lamp** shows only the desk lamp — but typing **lamp** shows nothing (yet).',
    experiments: [
      {
        id: 'case-insensitive',
        task: 'Make the search **case-insensitive**: typing `lamp` (or `LAMP`) should find **Desk Lamp**.',
        hint: 'Compare lowercase to lowercase: `p.name.toLowerCase().includes(query.toLowerCase())`.',
        tests: [
          { name: '"lamp" finds Desk Lamp', code: `await type('.search', 'lamp')\nexpect(text('.list')).toContain('Desk Lamp')\nexpect(findAll('.product')).toHaveLength(1)` },
          { name: '"MUG" finds Coffee Mug', code: `await type('.search', 'MUG')\nexpect(text('.list')).toContain('Coffee Mug')` },
        ],
        explain: 'The callback is just a function returning true or false — any logic you can write in a function can decide what `filter` keeps.',
      },
      {
        id: 'sort-price',
        task: 'Show the visible products **cheapest first** — without changing the order of the original `products` array.',
        hint: 'Add `.toSorted((a, b) => a.price - b.price)` to the chain (or `[...visible].sort(...)`). A negative result puts `a` first.',
        tests: [
          { name: 'the cheapest product is listed first', code: `const rows = findAll('.product').map((li) => li.textContent)\nexpect(rows[0]).toContain('Notebook')\nexpect(rows[rows.length - 1]).toContain('Headphones')` },
          { name: 'the original products array keeps its order', code: `const { products } = requireModule('products.js')\nexpect(products[0].name).toBe('Desk Lamp')\nexpect(products[2].name).toBe('Headphones')` },
        ],
        explain: 'Sorting the filtered copy is safe because `filter` already returned a new array — but `products.sort()` would reorder the shared data for every other module that imports it. `toSorted` makes the intent explicit.',
      },
      {
        id: 'total',
        task: 'Add a `<p class="total">` that shows the total price of the **visible** products, like **Total: $155**. It must update when filters change.',
        hint: 'Add the element to the HTML, then in `render()`: `visible.reduce((sum, p) => sum + p.price, 0)`.',
        tests: [
          { name: 'all products total $155', code: `expect(text('.total')).toBe('Total: $155')` },
          { name: 'in-stock only totals $66', code: `await check('.in-stock', true)\nexpect(text('.total')).toBe('Total: $66')` },
        ],
        explain: '`reduce` folds a list into one value. The `0` is the starting total — without it, `reduce` would start from the first *product object* and the "sum" would be nonsense (and an empty list would throw).',
      },
      {
        id: 'mutation-demo',
        task: 'See the mutation trap: at the end of `main.js`, add `const sorted = products.sort((a, b) => b.price - a.price)` then `console.log(sorted === products, products[0].name)`. Click the checkbox afterwards and watch the list order.',
        hint: '`sort` returns the same array it was called on.',
        explain: 'It logs `true Headphones`: `sort` reordered `products` itself and returned it. Every later render now starts from the mutated data. In a Vue `computed()` this mutates reactive state while computing — Vue\'s docs warn about exactly this. Remove the line when you\'re done.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'A chain, one station at a time',
    caption: 'Follow five products through `filter → map` and `filter → reduce`. Every station produces a new array (or a single value); the source never changes.',
    alt: 'A row of boxes: products with 5 items, filter in stock with 4 items, map to names with 4 strings, and reduce to total with the number 66. Steps highlight each stage and the arrows between them.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'src', label: 'products', note: '5 objects', tone: 'kraft' },
        { id: 'filter', label: 'filter(p => p.inStock)', note: '4 objects', tone: 'cobalt' },
        { id: 'map', label: 'map(p => p.name)', note: '4 strings', tone: 'acid' },
        { id: 'reduce', label: 'reduce(sum + price, 0)', note: '66', tone: 'red' },
      ],
      edges: [
        { from: 'src', to: 'filter' },
        { from: 'filter', to: 'map' },
        { id: 'toReduce', from: 'filter', to: 'reduce', dashed: true },
      ],
      steps: [
        { focus: ['src'], text: 'Start: five product objects. Lamp $39, Notebook $6, Headphones $89 (out of stock), Mug $12, Cable $9.' },
        { focus: ['filter'], edges: ['src->filter'], text: '`filter` calls the callback once per item. Headphones returns `false`, so it is left out. Result: a **new** array of 4 references to the same product objects.' },
        { focus: ['map'], edges: ['filter->map'], text: '`map` calls `p => p.name` for each of the 4 and collects the results: `[\'Desk Lamp\', \'Notebook\', \'Coffee Mug\', \'USB Cable\']`. Same length, new shape.' },
        { focus: ['reduce'], edges: ['toReduce'], text: '`reduce` walks the 4 in-stock products carrying a running total: 0 → 39 → 45 → 57 → 66. One value comes out.' },
        { focus: ['src'], text: 'And `products` still holds all five, in the original order. That\'s why these methods are safe inside a Vue `computed()`.' },
      ],
    },
  },

  internals: {
    beginner: `
Each method is a loop someone already wrote for you. \`map\` makes an empty array, runs your function on each item and pushes the result. \`filter\` pushes the item only if your function says yes. \`reduce\` keeps one running value and replaces it with whatever your function returns each time.
`,
    technical: [
      `
Simplified versions (the real ones also handle sparse arrays, \`thisArg\` and more):
`,
      {
        code: `// Simplified — not the real spec implementations
function map(array, fn) {
  const out = []
  for (let i = 0; i < array.length; i++) out.push(fn(array[i], i, array))
  return out
}

function filter(array, fn) {
  const out = []
  for (let i = 0; i < array.length; i++) if (fn(array[i], i, array)) out.push(array[i])
  return out
}

function reduce(array, fn, initial) {
  let acc = initial
  for (let i = 0; i < array.length; i++) acc = fn(acc, array[i], i, array)
  return acc
}`,
        lang: 'js',
        title: 'what map, filter and reduce do',
      },
      `
**Edge cases worth knowing:**

- \`reduce\` without an initial value uses the first item as the accumulator and starts at index 1 — and throws \`TypeError: Reduce of empty array with no initial value\` on an empty array. Always pass one.
- \`sort()\` without a compare function converts items to strings and compares UTF-16 code units, so \`10\` sorts before \`2\` and \`'Z'\` before \`'a'\`. Use \`(a, b) => a - b\` for numbers and \`localeCompare\` for human text. Since ES2019, \`sort\` is required to be **stable** (equal items keep their relative order).
- \`filter\` and \`map\` copy **references**: \`filter\` returns a new array holding the *same* objects. Mutating \`filtered[0].price\` changes the original product too.
- \`forEach\` always returns \`undefined\` and can't be stopped early (use \`for…of\` with \`break\`, or \`some\`/\`find\`). It also doesn't wait for \`async\` callbacks.
`,
      `
**Vue and arrays.** In Vue 3, reactive arrays are proxies, so mutating methods (\`push\`, \`splice\`, \`sort\`…) and index assignment are all tracked. Non-mutating methods return plain new arrays; to update state with them you assign the result back: \`todos.value = todos.value.filter(…)\`. A \`computed()\` should only *read* — calling \`sort()\` or \`reverse()\` on reactive state inside it mutates the source while computing.
`,
    ],
    production: `
- Put list derivations (filter/sort/search/total) in \`computed()\`, not in template expressions or methods — computed values are cached until their inputs change. See [computed()](lesson:computed).
- Never use \`v-if\` and \`v-for\` on the same element to filter; filter in a computed instead (in Vue 3, \`v-if\` runs first and can't see the loop variable).
- For very large lists, chaining many methods on every keystroke can become noticeable. Measure first; then consider debouncing the input, combining passes, paginating, or [virtual scrolling](lesson:large-lists).
- Lookups by id in hot paths: \`array.find\` scans the whole list. If you do it repeatedly, build a \`Map\` (\`new Map(items.map((i) => [i.id, i]))\`) once.
- Prefer immutable updates for shared state you might want to undo, compare or snapshot; plain \`push\` is fine for simple local lists.
`,
  },

  mistakes: [
    {
      title: 'Forgetting to return from a map/filter callback with braces',
      wrong: { code: `const doubled = [1, 2, 3].map((n) => { n * 2 })\n// [undefined, undefined, undefined]`, lang: 'js' },
      right: { code: `const doubled = [1, 2, 3].map((n) => n * 2)\n// or: .map((n) => { return n * 2 })`, lang: 'js' },
      explanation: 'With `{ }`, an arrow function needs an explicit `return`. Without braces, the expression is returned automatically.',
    },
    {
      title: 'Sorting the source array inside a computed',
      wrong: { code: `const sorted = computed(() =>\n  products.value.sort((a, b) => a.price - b.price) // mutates products!\n)`, lang: 'js' },
      right: { code: `const sorted = computed(() =>\n  products.value.toSorted((a, b) => a.price - b.price) // or [...products.value].sort(…)\n)`, lang: 'js' },
      explanation: '`sort` and `reverse` modify the array in place. Inside a computed, that changes reactive state as a side effect of reading it. Sort a copy.',
    },
    {
      title: 'reduce without an initial value',
      wrong: { code: `const total = cart.reduce((sum, item) => sum + item.price)\n// first "sum" is the first item OBJECT → "[object Object]12"\n// and an empty cart throws a TypeError`, lang: 'js' },
      right: { code: `const total = cart.reduce((sum, item) => sum + item.price, 0)`, lang: 'js' },
      explanation: 'Without the second argument, `reduce` starts with the first element as the accumulator. Always pass the starting value.',
    },
    {
      title: 'Using map when you only want side effects',
      wrong: { code: `todos.map((t) => console.log(t.title)) // builds an array of undefined for nothing`, lang: 'js' },
      right: { code: `todos.forEach((t) => console.log(t.title))\n// or: for (const t of todos) console.log(t.title)`, lang: 'js' },
      explanation: '`map` is for producing a new array. If you ignore the result, you meant `forEach` or a `for…of` loop.',
    },
  ],

  debugging: [
    {
      symptom: 'A list shows items in the wrong order everywhere after one component sorted it.',
      cause: '`sort()` (or `reverse()`) mutated a shared array.',
      fix: 'Sort a copy: `toSorted()` or `[...arr].sort()`. Search the code for `.sort(` and `.reverse(` on state.',
    },
    {
      symptom: 'Numbers sort as 1, 10, 2, 20, 3.',
      cause: '`sort()` without a compare function compares strings.',
      fix: 'Pass a compare function: `(a, b) => a - b`.',
    },
    {
      symptom: 'The result of `map` is full of `undefined`.',
      cause: 'The callback has braces but no `return`.',
      fix: 'Remove the braces or add `return`. For object literals use `(x) => ({ … })`.',
    },
    {
      symptom: '`TypeError: Reduce of empty array with no initial value`.',
      cause: '`reduce` was called on an empty array without its second argument.',
      fix: 'Always pass an initial value: `reduce(fn, 0)`, `reduce(fn, {})`, `reduce(fn, [])`.',
    },
    {
      symptom: 'Editing an item in a filtered list also edits it in the full list.',
      cause: '`filter` returns a new array of the *same* objects.',
      fix: 'That\'s often what you want (same item, two views). If you need an independent copy, `map((p) => ({ ...p }))`.',
    },
  ],

  bestPractices: [
    'Pick the method that says what you mean: `filter` to keep, `map` to transform, `find` for one item, `some`/`every` for yes/no, `reduce` for one value.',
    'Keep callbacks small and pure — no side effects inside `map`/`filter`.',
    'Always give `reduce` an initial value.',
    'Never `sort`/`reverse` state in place inside a computed; use `toSorted()` or copy first.',
    'Use a compare function for every `sort` (`a - b` for numbers, `localeCompare` for text).',
    'Name intermediate results when a chain gets long: `const inStock = …; const sorted = …`.',
  ],

  useCases: [
    'Search, filter and sort lists in a `computed()` that feeds `v-for`.',
    'Cart totals, item counts and averages with `reduce`.',
    'Removing an item immutably: `items.filter((i) => i.id !== id)`.',
    'Updating one item immutably: `items.map((i) => (i.id === id ? { ...i, done: true } : i))`.',
    'Validation: `fields.every((f) => f.valid)` to enable a submit button.',
    'Grouping data for charts or sectioned lists with `reduce`.',
  ],

  whenToUse: {
    use: [
      '`map`/`filter`/`reduce` for deriving new data from lists — especially in computed properties.',
      '`find`/`some`/`every` when you need one item or a yes/no answer and want to stop early.',
      '`toSorted()` (or copy + `sort`) whenever the array is shared state.',
    ],
    avoid: [
      '`map` for side effects — use `forEach` or `for…of`.',
      '`sort`/`reverse`/`splice` on arrays you don\'t own (props, store state inside getters/computed).',
      '`reduce` for things a clearer method already does (`filter`, `some`, `Math.max(...arr)`).',
      'Repeated `find` by id inside big loops — build a `Map` once.',
    ],
  },

  comparison: {
    title: 'Which method do I need?',
    headers: ['Method', 'Returns', 'Mutates?', 'Typical use'],
    rows: [
      ['`map`', 'new array, same length', 'no', 'transform each item'],
      ['`filter`', 'new array, ≤ length', 'no', 'keep matching items / remove one immutably'],
      ['`reduce`', 'any single value', 'no', 'totals, grouping, counting'],
      ['`find`', 'first match or `undefined`', 'no', 'look up one item'],
      ['`some` / `every`', '`true` / `false`', 'no', 'any / all checks'],
      ['`forEach`', '`undefined`', 'no (but your callback might)', 'side effects only'],
      ['`sort` / `reverse`', 'the same array', '**yes**', 'local arrays you own'],
      ['`toSorted` / `toReversed`', 'new array', 'no', 'sorting shared state (ES2023)'],
    ],
    note: 'Next you\'ll split code across files with [ES modules](lesson:es-modules); later, [list rendering](lesson:list-rendering) shows these methods driving `v-for`.',
  },

  quiz: [
    {
      id: 'array-methods-q1',
      type: 'mcq',
      prompt: 'You have an array of products and want a new array containing only the ones that are in stock. Which method?',
      options: [
        { text: '`map`', why: '`map` keeps every item and transforms it; the length never changes.' },
        { text: '`filter`' },
        { text: '`find`', why: '`find` returns only the *first* match, not an array of all matches.' },
        { text: '`some`', why: '`some` returns a boolean: is there at least one?' },
      ],
      answer: 1,
      explanation: '`products.filter((p) => p.inStock)` keeps the items for which the callback returns true.',
    },
    {
      id: 'array-methods-q2',
      type: 'output',
      prompt: 'What is logged?',
      code: { lang: 'js', code: `const doubled = [1, 2, 3].map((n) => { n * 2 })\nconsole.log(doubled)` },
      options: [
        { text: '[2, 4, 6]', why: 'With braces, the arrow function body needs an explicit `return`.' },
        { text: '[undefined, undefined, undefined]' },
        { text: '[1, 2, 3]', why: '`map` uses the callback\'s return value, which is `undefined` here.' },
        { text: 'SyntaxError', why: 'The code is valid — it just returns nothing.' },
      ],
      answer: 1,
      explanation: 'The braces make a function body; without `return`, each call returns `undefined`.',
    },
    {
      id: 'array-methods-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: { lang: 'js', code: `console.log([10, 1, 2].sort())` },
      options: [
        { text: '[1, 2, 10]', why: 'That needs a numeric compare function: `sort((a, b) => a - b)`.' },
        { text: '[1, 10, 2]' },
        { text: '[10, 2, 1]', why: 'Default sort is ascending — but by string comparison.' },
        { text: '[10, 1, 2]', why: '`sort` does reorder the array.' },
      ],
      answer: 1,
      explanation: 'Without a compare function, items are converted to strings: "1" < "10" < "2".',
    },
    {
      id: 'array-methods-q4',
      type: 'bug',
      prompt: '`cartTotal([{ price: 5 }, { price: 7 }])` returns `"[object Object]7"`. Click the buggy line.',
      code: { lang: 'js', code: `function cartTotal(cart) {\n  return cart.reduce((sum, item) => sum + item.price)\n}\n\nconsole.log(cartTotal([{ price: 5 }, { price: 7 }]))` },
      answerLine: 2,
      explanation: 'No initial value: the first item *object* becomes `sum`, and object + number becomes string concatenation. Pass `0` as the second argument.',
    },
    {
      id: 'array-methods-q5',
      type: 'fill',
      prompt: 'Fill the blanks to get the names of all products and the total price.',
      code: { lang: 'js', code: `const names = products.___((p) => p.name)\nconst total = products.___((sum, p) => sum + p.price, ___)` },
      answer: [['map'], ['reduce'], ['0']],
      explanation: '`map` transforms each product into its name; `reduce` folds the list into one number starting from `0`.',
    },
    {
      id: 'array-methods-q6',
      type: 'mcq',
      prompt: 'Select **all** the methods that change (mutate) the array they are called on.',
      options: [
        { text: '`push`' },
        { text: '`map`', why: '`map` returns a new array.' },
        { text: '`sort`' },
        { text: '`filter`', why: '`filter` returns a new array.' },
        { text: '`splice`' },
        { text: '`toSorted`', why: '`toSorted` is the non-mutating version of `sort`.' },
      ],
      answer: [0, 2, 4],
      explanation: '`push`, `sort` and `splice` modify the original. `map`, `filter` and `toSorted` return new arrays.',
    },
    {
      id: 'array-methods-q7',
      type: 'short',
      prompt: 'What is the difference between `map` and `forEach`, and when would you use each?',
      answer: '`map` calls a function on every item and returns a new array of the results, so it\'s for transforming data (for example, turning products into their names). `forEach` also calls the function on every item but always returns `undefined`, so it\'s only for side effects like logging. If you ignore what `map` returns, you should be using `forEach` or a `for…of` loop.',
    },
  ],

  exercises: [
    {
      id: 'cart-math',
      title: 'Cart calculations',
      difficulty: 'beginner',
      prompt: `
Implement four functions in \`cart.js\`. Each item looks like \`{ name, price, qty, inStock }\`.

- \`cartTotal(items)\` → the sum of \`price * qty\` (an empty cart is \`0\`).
- \`itemCount(items)\` → the sum of all \`qty\`.
- \`namesOver(items, min)\` → an array of the **names** of items whose \`price\` is greater than \`min\`, in the original order.
- \`hasOutOfStock(items)\` → \`true\` if at least one item has \`inStock: false\`.

Don't use \`for\` loops — use \`reduce\`, \`filter\`, \`map\` and \`some\`.
`,
      files: {
        'cart.js': `export function cartTotal(items) {
  return 0
}

export function itemCount(items) {
  return 0
}

export function namesOver(items, min) {
  return []
}

export function hasOutOfStock(items) {
  return false
}`,
        'main.js': `import { cartTotal, itemCount, namesOver, hasOutOfStock } from './cart.js'

const cart = [
  { name: 'Desk Lamp', price: 39, qty: 1, inStock: true },
  { name: 'Notebook', price: 6, qty: 3, inStock: true },
  { name: 'Headphones', price: 89, qty: 1, inStock: false },
]

const app = document.getElementById('app')
app.innerHTML = \`
  <p class="total">Total: $\${cartTotal(cart)}</p>
  <p class="count">\${itemCount(cart)} items</p>
  <p class="pricey">Over $20: \${namesOver(cart, 20).join(', ')}</p>
  <p class="warning">\${hasOutOfStock(cart) ? 'Some items are out of stock' : ''}</p>
\``,
      },
      hints: [
        'Totals are `reduce` with a starting value of `0`: `items.reduce((sum, item) => sum + …, 0)`.',
        '`namesOver` is two steps: `filter` by price, then `map` to the name.',
        '`hasOutOfStock`: `items.some((item) => !item.inStock)`.',
      ],
      solution: {
        explanation: 'Each function is one expression that names its intent. `reduce` with an initial `0` handles the empty cart; `filter` + `map` keeps order; `some` stops at the first out-of-stock item.',
        files: {
          'cart.js': `export function cartTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0)
}

export function itemCount(items) {
  return items.reduce((sum, item) => sum + item.qty, 0)
}

export function namesOver(items, min) {
  return items.filter((item) => item.price > min).map((item) => item.name)
}

export function hasOutOfStock(items) {
  return items.some((item) => !item.inStock)
}`,
          'main.js': `import { cartTotal, itemCount, namesOver, hasOutOfStock } from './cart.js'

const cart = [
  { name: 'Desk Lamp', price: 39, qty: 1, inStock: true },
  { name: 'Notebook', price: 6, qty: 3, inStock: true },
  { name: 'Headphones', price: 89, qty: 1, inStock: false },
]

const app = document.getElementById('app')
app.innerHTML = \`
  <p class="total">Total: $\${cartTotal(cart)}</p>
  <p class="count">\${itemCount(cart)} items</p>
  <p class="pricey">Over $20: \${namesOver(cart, 20).join(', ')}</p>
  <p class="warning">\${hasOutOfStock(cart) ? 'Some items are out of stock' : ''}</p>
\``,
        },
      },
      tests: [
        { name: 'cartTotal sums price × qty', code: `const { cartTotal } = requireModule('cart.js')\nexpect(cartTotal([{ price: 39, qty: 1 }, { price: 6, qty: 3 }])).toBe(57)\nexpect(cartTotal([])).toBe(0)` },
        { name: 'itemCount sums quantities', code: `const { itemCount } = requireModule('cart.js')\nexpect(itemCount([{ qty: 1 }, { qty: 3 }, { qty: 2 }])).toBe(6)` },
        { name: 'namesOver keeps order and returns names', code: `const { namesOver } = requireModule('cart.js')\nconst items = [{ name: 'A', price: 30 }, { name: 'B', price: 5 }, { name: 'C', price: 21 }]\nexpect(namesOver(items, 20)).toEqual(['A', 'C'])` },
        { name: 'hasOutOfStock detects any out-of-stock item', code: `const { hasOutOfStock } = requireModule('cart.js')\nexpect(hasOutOfStock([{ inStock: true }, { inStock: false }])).toBe(true)\nexpect(hasOutOfStock([{ inStock: true }])).toBe(false)` },
        { name: 'the page shows the cart summary', code: `expect(text('.total')).toBe('Total: $146')\nexpect(text('.count')).toBe('5 items')\nexpect(text('.warning')).toBe('Some items are out of stock')` },
      ],
    },
    {
      id: 'group-and-sort',
      title: 'Group by category, sort without mutating',
      difficulty: 'intermediate',
      prompt: `
Implement two functions in \`catalog.js\`:

- \`groupByCategory(products)\` → an object whose keys are categories and whose values are arrays of the products in that category, in their original order. Use \`reduce\`.
- \`sortByPrice(products, direction = 'asc')\` → a **new** array sorted by \`price\` (\`'asc'\` cheapest first, \`'desc'\` most expensive first). The input array must keep its order.
`,
      files: {
        'catalog.js': `export function groupByCategory(products) {
  // TODO: use reduce
  return {}
}

export function sortByPrice(products, direction = 'asc') {
  return products.sort((a, b) => a.price - b.price)
}`,
        'main.js': `import { groupByCategory, sortByPrice } from './catalog.js'

const products = [
  { name: 'Desk Lamp', category: 'home', price: 39 },
  { name: 'Notebook', category: 'office', price: 6 },
  { name: 'Headphones', category: 'tech', price: 89 },
  { name: 'Coffee Mug', category: 'home', price: 12 },
]

const app = document.getElementById('app')
const groups = groupByCategory(products)
app.innerHTML = Object.entries(groups)
  .map(([category, items]) => '<h4>' + category + '</h4><p>' + items.map((p) => p.name).join(', ') + '</p>')
  .join('')
console.log('cheapest first:', sortByPrice(products).map((p) => p.name).join(', '))`,
      },
      hints: [
        'Start `reduce` with `{}`. For each product: create the category\'s array if missing (`groups[p.category] ??= []`), push the product, and **return** `groups`.',
        'The starter\'s `sort` mutates the input. Copy first: `[...products]` or use `products.toSorted(...)`.',
        'For `\'desc\'`, swap the subtraction: `b.price - a.price`.',
      ],
      solution: {
        explanation: '`reduce` builds the grouped object one product at a time, starting from `{}` and returning the accumulator each step. `toSorted` returns a new array, so callers that still need the original order are unaffected; the direction just flips the comparison.',
        files: {
          'catalog.js': `export function groupByCategory(products) {
  return products.reduce((groups, product) => {
    groups[product.category] ??= []
    groups[product.category].push(product)
    return groups
  }, {})
}

export function sortByPrice(products, direction = 'asc') {
  const compare = direction === 'desc'
    ? (a, b) => b.price - a.price
    : (a, b) => a.price - b.price
  return products.toSorted(compare)
}`,
          'main.js': `import { groupByCategory, sortByPrice } from './catalog.js'

const products = [
  { name: 'Desk Lamp', category: 'home', price: 39 },
  { name: 'Notebook', category: 'office', price: 6 },
  { name: 'Headphones', category: 'tech', price: 89 },
  { name: 'Coffee Mug', category: 'home', price: 12 },
]

const app = document.getElementById('app')
const groups = groupByCategory(products)
app.innerHTML = Object.entries(groups)
  .map(([category, items]) => '<h4>' + category + '</h4><p>' + items.map((p) => p.name).join(', ') + '</p>')
  .join('')
console.log('cheapest first:', sortByPrice(products).map((p) => p.name).join(', '))`,
        },
      },
      tests: [
        { name: 'groups products by category in order', code: `const { groupByCategory } = requireModule('catalog.js')\nconst g = groupByCategory([{ name: 'Lamp', category: 'home' }, { name: 'Pen', category: 'office' }, { name: 'Mug', category: 'home' }])\nexpect(Object.keys(g).sort()).toEqual(['home', 'office'])\nexpect(g.home.map((p) => p.name)).toEqual(['Lamp', 'Mug'])\nexpect(g.office).toHaveLength(1)` },
        { name: 'sorts ascending by default without mutating', code: `const { sortByPrice } = requireModule('catalog.js')\nconst input = [{ price: 39 }, { price: 6 }, { price: 89 }]\nconst out = sortByPrice(input)\nexpect(out.map((p) => p.price)).toEqual([6, 39, 89])\nexpect(input.map((p) => p.price)).toEqual([39, 6, 89])\nexpect(out === input).toBe(false)` },
        { name: 'sorts descending on request', code: `const { sortByPrice } = requireModule('catalog.js')\nexpect(sortByPrice([{ price: 39 }, { price: 6 }, { price: 89 }], 'desc').map((p) => p.price)).toEqual([89, 39, 6])` },
        { name: 'the page shows a heading per category', code: `expect(findAll('h4')).toHaveLength(3)\nexpect(text()).toContain('Desk Lamp, Coffee Mug')` },
      ],
    },
  ],

  interview: [
    {
      id: 'array-methods-map-vs-foreach',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'What is the difference between `map`, `filter` and `forEach`?',
      answer: '`map` returns a new array of the same length with each item transformed. `filter` returns a new array containing only items for which the callback returns truthy. `forEach` returns `undefined`; it only runs the callback for its side effects. None of them mutate the original array by themselves.',
      explanation: 'Choose by what you want back: a transformed list, a shorter list, or nothing.',
      whyAsked: 'Basic fluency check — these methods appear in nearly every Vue computed property.',
      mistakes: ['Using `map` for side effects and ignoring its return value.', 'Thinking `forEach` can be stopped with `break` or `return`.', 'Claiming `filter` copies the objects (it copies references).'],
      followUps: ['How do you stop iterating early?', 'Does `forEach` wait for async callbacks?'],
      modelAnswer: '`map` transforms: same length out, each item replaced by the callback\'s result. `filter` selects: the items whose callback returned truthy, in order. `forEach` just runs the callback and returns undefined, so it\'s for side effects. Both `map` and `filter` return new arrays but hold the same object references, so mutating an item still affects the original. If I need to stop early I use `find`, `some` or a `for…of` loop with `break`.',
    },
    {
      id: 'array-methods-sort-default',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What do these two lines log?',
      code: {
        lang: 'js',
        code: `console.log([10, 9, 1].sort())
console.log(['banana', 'apple', 'Cherry'].sort())`,
      },
      options: [
        '[1, 9, 10] and [apple, banana, Cherry]',
        '[1, 10, 9] and [Cherry, apple, banana]',
        '[10, 9, 1] and [Cherry, banana, apple]',
        '[1, 9, 10] and [Cherry, apple, banana]',
      ],
      correctOption: 1,
      answer: '`[1, 10, 9]` and `[\'Cherry\', \'apple\', \'banana\']`. The default sort converts items to strings and compares UTF-16 code units: "10" comes before "9", and uppercase letters come before lowercase.',
      explanation: 'Always pass a compare function: `(a, b) => a - b` for numbers, `(a, b) => a.localeCompare(b)` for text.',
      whyAsked: 'A classic gotcha that causes real ordering bugs in tables and leaderboards.',
      mistakes: ['Assuming numeric sorting by default.', 'Forgetting `sort` mutates the array.'],
      followUps: ['How would you sort case-insensitively, respecting the user\'s language?', 'Is `sort` stable?'],
      modelAnswer: 'It logs 1, 10, 9 and then Cherry, apple, banana. Without a compare function `sort` stringifies items and compares code units, so "10" sorts before "9" and capital letters sort before lowercase. For numbers I pass `(a, b) => a - b`; for human text `localeCompare`, optionally with `Intl.Collator`. I\'d also use `toSorted` or a copy, because `sort` mutates.',
    },
    {
      id: 'array-methods-computed-sort',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A "Sort by price" view works, but afterwards the main product list — which never asked to be sorted — is also in price order. What\'s wrong?',
      code: {
        lang: 'js',
        code: `const products = ref(await loadProducts())

const byPrice = computed(() =>
  products.value.sort((a, b) => a.price - b.price)
)`,
      },
      answer: '`sort` mutates the array in place, so the computed reorders the reactive `products` source while computing. Every component that reads `products` now sees the sorted order. Sort a copy: `products.value.toSorted(...)` or `[...products.value].sort(...)`.',
      explanation: 'Computed properties must be side-effect free. `sort` and `reverse` are side effects.',
      whyAsked: 'The Vue docs call this out specifically; it\'s a real bug that surfaces as "unrelated" ordering changes.',
      mistakes: ['Blaming reactivity or caching.', 'Not knowing which array methods mutate.', 'Missing that `filter` before `sort` would have produced a copy (so it depends on the chain).'],
      followUps: ['Which other array methods mutate?', 'What else must computed getters never do?'],
      modelAnswer: '`sort` sorts in place and returns the same array, so the computed is mutating `products` — reactive state — as a side effect of being read. Everything else that reads `products` now gets the sorted order. Computed getters should be pure, so I\'d use `toSorted`, or spread into a new array before sorting. If the chain had a `filter` first it would accidentally work, because `filter` returns a copy — which is exactly why it\'s easy to miss.',
    },
    {
      id: 'array-methods-find-filter-some',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'When would you use `find`, `filter`, `some` or `includes`?',
      answer: '`find` when you need the first item matching a condition (e.g. a product by id). `filter` when you need all matches as an array. `some` when you need a yes/no answer — does any item match? `includes` for a yes/no answer about a simple value (`tags.includes(\'vue\')`). `find` and `some` stop at the first match.',
      explanation: 'Pick by the shape of the answer you need: one item, many items, or a boolean.',
      whyAsked: 'Shows whether you choose precise tools rather than using `filter` for everything.',
      mistakes: ['Using `filter(...)[0]` instead of `find`.', 'Using `filter(...).length > 0` instead of `some`.', 'Using `includes` with objects (it compares references).'],
      followUps: ['Why does `[{ id: 1 }].includes({ id: 1 })` return false?', 'What does `find` return when nothing matches?'],
      modelAnswer: 'I choose by the answer\'s shape. `find` gives me one item or undefined — for lookups by id. `filter` gives every match as a new array — for search results. `some` gives a boolean and stops at the first match — "is anything out of stock?". `includes` checks for a primitive value; with objects it compares references, so it\'s usually the wrong tool there.',
    },
    {
      id: 'array-methods-big-list',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A search box filters and sorts a list of thousands of rows in a `computed()`. Typing feels laggy. How do you approach it?',
      answer: 'Measure first (Vue DevTools / browser Performance panel) to see whether the time is in the computation or in rendering many DOM rows. If computation: debounce the input, precompute lowercase search keys once, combine passes, avoid sorting on every keystroke when only the query changed, or move filtering to the server with pagination. If rendering: paginate or use virtual scrolling so only visible rows are rendered, and make sure rows have stable keys. Use `shallowRef` for large immutable data to avoid deep reactivity overhead.',
      explanation: 'Array methods are rarely the bottleneck by themselves — rendering thousands of nodes usually is. Find out which before changing code.',
      whyAsked: 'Separates engineers who measure from those who micro-optimise loops.',
      mistakes: ['Rewriting chains as `for` loops without measuring.', 'Ignoring DOM rendering cost.', 'Debouncing without considering that results should still feel responsive.'],
      followUps: ['How does virtual scrolling work?', 'When would you move filtering to the server?', 'What does `shallowRef` change here?'],
      modelAnswer: 'I\'d profile first to see whether time goes into the computed or into rendering thousands of rows. If it\'s rendering, pagination or virtual scrolling fixes it far more than any array tweak. If it\'s computation, I\'d debounce the input, precompute normalised search fields once, and split filtering and sorting into separate computeds so a query change doesn\'t force a re-sort. For very large datasets I\'d paginate on the server. I\'d also hold the raw data in a `shallowRef` so Vue doesn\'t make every row deeply reactive.',
    },
    {
      id: 'array-methods-unique-by',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Implement `uniqueBy(items, key)` in `unique.js`: return a new array with duplicates removed, where two items are duplicates if `item[key]` is equal. Keep the **first** occurrence and the original order; don\'t mutate the input.',
      starter: {
        files: {
          'unique.js': `export function uniqueBy(items, key) {
  // TODO
  return items
}`,
          'main.js': `import { uniqueBy } from './unique.js'

const contacts = [
  { name: 'Ada', email: 'ada@example.com' },
  { name: 'Grace', email: 'grace@example.com' },
  { name: 'Ada L.', email: 'ada@example.com' },
]

const app = document.getElementById('app')
app.innerHTML = '<ul class="contacts"></ul>'
for (const c of uniqueBy(contacts, 'email')) {
  const li = document.createElement('li')
  li.textContent = c.name
  app.querySelector('.contacts').append(li)
}`,
        },
      },
      tests: [
        { name: 'removes duplicates by key, keeping the first', code: `const { uniqueBy } = requireModule('unique.js')\nconst out = uniqueBy([{ id: 1, n: 'a' }, { id: 2, n: 'b' }, { id: 1, n: 'c' }], 'id')\nexpect(out.map((x) => x.n)).toEqual(['a', 'b'])` },
        { name: 'does not mutate the input', code: `const { uniqueBy } = requireModule('unique.js')\nconst input = [{ id: 1 }, { id: 1 }]\nconst out = uniqueBy(input, 'id')\nexpect(input).toHaveLength(2)\nexpect(out === input).toBe(false)` },
        { name: 'the page lists each email once', code: `expect(findAll('.contacts li')).toHaveLength(2)\nexpect(text('.contacts')).toContain('Ada')\nexpect(text('.contacts')).not.toContain('Ada L.')` },
      ],
      hints: ['Keep a `Set` of keys you\'ve already seen.', '`items.filter((item) => { if (seen.has(item[key])) return false; seen.add(item[key]); return true })`.'],
      answer: 'Filter with a `Set` of seen keys: skip an item if its key is already in the set, otherwise add the key and keep the item.',
      solution: {
        files: {
          'unique.js': `export function uniqueBy(items, key) {
  const seen = new Set()
  return items.filter((item) => {
    const value = item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}`,
          'main.js': `import { uniqueBy } from './unique.js'

const contacts = [
  { name: 'Ada', email: 'ada@example.com' },
  { name: 'Grace', email: 'grace@example.com' },
  { name: 'Ada L.', email: 'ada@example.com' },
]

const app = document.getElementById('app')
app.innerHTML = '<ul class="contacts"></ul>'
for (const c of uniqueBy(contacts, 'email')) {
  const li = document.createElement('li')
  li.textContent = c.name
  app.querySelector('.contacts').append(li)
}`,
        },
      },
      explanation: '`filter` keeps order and returns a new array; the `Set` makes each "seen?" check fast instead of searching the result array every time.',
      whyAsked: 'Tests combining array methods with the right data structure, and awareness of performance (`Set` vs nested `find`).',
      mistakes: ['Using `findIndex` inside `filter` (works, but scans the array for every item).', 'Keeping the last occurrence instead of the first.', 'Mutating the input with `splice`.'],
      followUps: ['How would you accept a function instead of a key name?', 'What is the time complexity of your solution vs a nested `find`?'],
      modelAnswer: 'I filter the array while tracking keys I\'ve seen in a Set. For each item, if its key is already in the set I drop it; otherwise I add the key and keep the item. That preserves order, keeps the first occurrence, never mutates the input, and makes each lookup constant time on average instead of rescanning the array.',
    },
    {
      id: 'array-methods-push-or-replace',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'In Vue 3, should you update a reactive list with `todos.value.push(t)` or with `todos.value = [...todos.value, t]`? What are the trade-offs?',
      answer: 'Both are reactive in Vue 3: arrays inside `ref()`/`reactive()` are proxies, so `push`, `splice` and index assignment are tracked. Mutation is simple and cheap for local state. Replacing the array (immutable update) is required when the list is held in a `shallowRef` (only `.value` assignment is tracked), and it helps when you want undo/history, cheap change detection by reference, or to avoid surprising other code that holds the old array. Pick one style per piece of state and be consistent.',
      explanation: 'Unlike Vue 2, Vue 3 has no array caveats — the choice is about design, not about whether it works.',
      whyAsked: 'Distinguishes up-to-date Vue 3 knowledge from Vue 2 folklore, and probes design thinking.',
      mistakes: ['Claiming `push` isn\'t reactive (a Vue 2-era myth about index assignment).', 'Not knowing `shallowRef` only tracks `.value` replacement.', 'Ignoring that watchers on the array need `deep` to see mutations.'],
      followUps: ['What does a `watch(todos, …)` see after `push` — and with `{ deep: true }`?', 'When would you choose `shallowRef` for a list?'],
      modelAnswer: 'In Vue 3 both work, because reactive arrays are proxies that track mutating methods. I\'ll use `push` or `splice` for simple local lists — it\'s clear and cheap. I switch to immutable updates when the list lives in a `shallowRef` for performance, since then only replacing `.value` triggers, or when I need history, undo, or reference-based change detection. The other subtlety is watchers: a watcher on a ref holding an array only fires on replacement unless it is deep.',
    },
  ],

  takeaways: [
    '`map` transforms, `filter` keeps some, `reduce` folds into one value, `find` gets one, `some`/`every` answer yes/no.',
    'These methods return new arrays/values and leave the original alone — safe inside `computed()`.',
    '`sort`, `reverse`, `splice`, `push` mutate. Use `toSorted()` or `[...arr].sort()` for shared state.',
    'Always give `sort` a compare function and `reduce` an initial value.',
    'With braces, an arrow callback needs `return`; returning an object literal needs `({ … })`.',
    'In Vue, derive filtered/sorted/totalled lists in `computed()` and render them with `v-for`.',
  ],
}
