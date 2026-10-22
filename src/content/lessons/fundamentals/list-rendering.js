// Lesson: List rendering with v-for & keys

const todoApp = `<script setup>
import { ref } from 'vue'

const todos = ref([
  { id: 1, text: 'Buy milk' },
  { id: 2, text: 'Walk the dog' },
  { id: 3, text: 'Learn v-for' },
])
const newTodo = ref('')
let nextId = 4

function addTodo() {
  if (!newTodo.value.trim()) return
  todos.value.push({ id: nextId++, text: newTodo.value.trim() })
  newTodo.value = ''
}

function removeTodo(id) {
  todos.value = todos.value.filter((t) => t.id !== id)
}
</script>

<template>
  <form @submit.prevent="addTodo">
    <input class="new" :value="newTodo" @input="newTodo = $event.target.value" placeholder="New todo" />
    <button>Add</button>
  </form>

  <ul class="todos">
    <li v-for="(todo, index) in todos" :key="index" class="todo">
      <span class="label">{{ index + 1 }}. {{ todo.text }}</span>
      <input class="note" placeholder="note…" />
      <button class="remove" @click="removeTodo(todo.id)">✕</button>
    </li>
  </ul>
  <p class="count">{{ todos.length }} todos</p>
</template>`

export default {
  id: 'list-rendering',
  title: 'List rendering with v-for & keys',
  summary: 'v-for turns an array into a list of elements, and a stable :key tells Vue which element belongs to which item when the list changes.',
  difficulty: 'beginner',
  minutes: 26,
  prerequisites: ['conditional-rendering', 'array-methods'],
  related: ['v-model-forms', 'computed', 'arrays-objects-reactivity', 'how-vue-updates', 'large-lists', 'props'],
  tags: ['v-for', 'key', ':key', 'lists', 'arrays', 'index', 'v-if with v-for', 'range', 'stable identity'],
  apis: [
    { name: 'v-for="item in items"', summary: 'Renders the element once per item in an array (also objects, numbers, iterables).' },
    { name: '(item, index) in items', summary: 'Gives access to the current position as well.' },
    { name: '(value, key, index) in object', summary: 'Iterates over an object\'s properties.' },
    { name: ':key', summary: 'A unique, stable identity for each rendered item so Vue can track it across updates.' },
  ],
  docs: [
    { label: 'Vue Guide — List Rendering', url: 'https://vuejs.org/guide/essentials/list.html' },
    { label: 'Vue Guide — Maintaining State with key', url: 'https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key' },
    { label: 'API — v-for', url: 'https://vuejs.org/api/built-in-directives.html#v-for' },
  ],

  intro: `
Lists are everywhere: todo items, products, messages, search results. \`v-for\` takes an array and renders an element **for each item**:

\`\`\`vue
<li v-for="todo in todos" :key="todo.id">{{ todo.text }}</li>
\`\`\`

Read it as *"for each \`todo\` in \`todos\`, render this \`<li>\`"*. Add an item to the array and a new \`<li>\` appears; remove one and its \`<li>\` disappears.

The \`:key\` is the important part people skip: it gives each item a **stable identity**, so when the list is reordered, filtered or edited, Vue knows exactly which element belongs to which item.
`,

  why: `
In plain JavaScript, rendering a list means looping, creating elements, appending them — and then, every time the data changes, either rebuilding the whole list (slow, and it destroys anything the user typed into it) or carefully working out which elements to add, remove and move.

\`v-for\` handles all of that. You describe one item; Vue renders all of them and, on every change, figures out the minimal set of DOM operations.

To do that well, Vue needs to know *which* old element corresponds to *which* new item. Positions aren't enough — if you delete the first item, every item's position changes. That's what keys are for: a key is a name tag that stays with the item, not with the position.
`,

  eli15: `
Imagine a coat check at a party. Every coat gets a **ticket number**. When people leave in random order, the attendant uses the tickets to hand back the right coat.

Now imagine there are no tickets, and the attendant just gives out coats **by position**: "first person in line gets the coat on the first hook". The moment someone leaves early, everyone gets the wrong coat.

\`v-for\` is the attendant, the elements on the page are the hooks, and \`:key\` is the ticket. Use something that belongs to the item — like \`todo.id\` — and every item keeps its own element, including anything typed into it. Use the position (\`index\`) and things get mixed up when the list changes.
`,

  analogy: {
    title: 'The coat check',
    body: `
Hooks are reused all evening — Vue reuses DOM elements too, because creating them is expensive. The question is only how the attendant decides which coat goes on which hook.

With **ticket numbers** (stable keys), a coat always returns to its owner, even when the queue reorders. With **"by position"** (index keys), the coats stay on their hooks while the people shuffle — so the wrong person walks off with them.
`,
    mapping: [
      ['coats', 'the items in your array'],
      ['hooks', 'the DOM elements Vue creates and reuses'],
      ['ticket number', '`:key="item.id"` — identity that travels with the item'],
      ['handing out by position', '`:key="index"` — identity tied to the slot, not the item'],
      ['someone leaving early', 'removing, inserting or sorting items'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'v-for' },
    title: 'v-for in the real DOM',
    caption: 'Add, remove and reorder items and watch which `<li>` elements Vue creates, moves or reuses — with stable keys and with index keys.',
    alt: 'An interactive lab with a small array and buttons to add, remove and shuffle items. The live DOM panel shows the list items, highlighting new elements, moved elements and elements whose content was patched in place.',
  },

  syntax: [
    `
#### Arrays
`,
    {
      code: `<li v-for="todo in todos" :key="todo.id">{{ todo.text }}</li>

<!-- with the index (position, starting at 0) -->
<li v-for="(todo, index) in todos" :key="todo.id">{{ index + 1 }}. {{ todo.text }}</li>

<!-- destructuring works too -->
<li v-for="{ id, text } in todos" :key="id">{{ text }}</li>

<!-- "of" is an alias for "in" -->
<li v-for="todo of todos" :key="todo.id">{{ todo.text }}</li>`,
      lang: 'vue',
      title: 'looping over an array',
    },
    `
#### Objects and ranges
`,
    {
      code: `<!-- (value, key, index) in an object — in Object.keys() order -->
<dl>
  <template v-for="(value, key) in profile" :key="key">
    <dt>{{ key }}</dt>
    <dd>{{ value }}</dd>
  </template>
</dl>

<!-- a number: n goes from 1 to 5 (not 0 to 4!) -->
<span v-for="n in 5" :key="n">★</span>`,
      lang: 'vue',
      title: 'objects and ranges',
    },
    `
\`<template v-for>\` repeats a *group* of elements without adding a wrapper — put the \`:key\` on the \`<template>\` itself.

#### Keys: the rules

1. **Unique** among siblings — two items with the same key confuse Vue (it warns: *Duplicate keys found during update*).
2. **Stable** — the same item must get the same key on every render. Database ids are perfect.
3. **Primitive** — strings or numbers, not objects.
4. **Not random** — \`:key="Math.random()"\` creates a new identity on *every* render, so Vue destroys and re-creates every element each time.
5. **Index keys** are only safe for lists that never reorder, insert or delete in the middle, and whose rows hold no state (no inputs, no stateful child components). When in doubt, use an id.

#### Changing the list

Vue tracks arrays reactively, so the page updates when you **mutate** them:
`,
    {
      code: `todos.value.push(newTodo)          // add at the end
todos.value.unshift(newTodo)       // add at the start
todos.value.splice(index, 1)       // remove one
todos.value.sort(compare)          // sort in place
todos.value.reverse()              // reverse in place
todos.value[0] = updatedTodo       // index assignment — detected in Vue 3

// filter / map / slice / concat return a NEW array — assign it back:
todos.value = todos.value.filter((t) => !t.done)`,
      lang: 'js',
      title: 'mutation vs replacement',
    },
    `
#### Showing a filtered or sorted version

Don't filter or sort inside \`v-for\`. Derive a new array with a **computed property** ([computed()](lesson:computed)) — and copy before sorting, because \`sort()\` and \`reverse()\` change the original array:
`,
    {
      code: `<script setup>
import { ref, computed } from 'vue'

const products = ref([/* … */])
const inStock = computed(() => products.value.filter((p) => p.stock > 0))
const cheapestFirst = computed(() => [...products.value].sort((a, b) => a.price - b.price))
// or, in modern browsers: products.value.toSorted((a, b) => a.price - b.price)
</script>

<template>
  <li v-for="p in inStock" :key="p.id">{{ p.name }}</li>
</template>`,
      lang: 'vue',
      title: 'derive, don\'t mutate',
    },
    {
      callout: 'warn',
      title: 'v-if and v-for on the same element',
      text: 'In Vue 3, `v-if` has **higher priority** than `v-for` on the same element, so the condition cannot see the loop variable (`<li v-for="u in users" v-if="u.active">` fails). Filter with a computed property, or move the `v-for` to a wrapping `<template>`. (Vue 2 had the opposite priority — another reason not to combine them.)',
    },
    `
#### v-for with components

A component in a loop does **not** receive the item automatically — pass it as a prop:
`,
    {
      code: `<TodoItem
  v-for="todo in todos"
  :key="todo.id"
  :todo="todo"
  @remove="removeTodo(todo.id)"
/>`,
      lang: 'vue',
      title: 'components in a loop',
      static: true,
    },
    `
More on that in [Your first component](lesson:first-component) and [Props](lesson:props).
`,
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: todoApp,
    intro: 'A todo list with add and remove. It contains one deliberate mistake on line 30 — the first experiment fixes it.',
    steps: [
      { lines: [4, 8], text: 'The source of truth: an array of objects, each with a unique `id`. The ids are what make good keys.' },
      { lines: [12, 16], text: '`push` mutates the array — Vue notices and renders one new `<li>` at the end.' },
      { lines: [18, 20], text: '`filter` returns a *new* array, so we assign it back to `todos.value`. Forgetting the assignment is a classic "why didn\'t it update?" bug.' },
      { lines: [30], text: '`v-for="(todo, index) in todos"` renders one `<li>` per todo. **But** `:key="index"` ties each element to a *position*, not to a todo. That is the bug you will expose.' },
      { lines: [31, 33], text: 'Inside the loop you can use `todo` and `index`. The `.note` input is *uncontrolled* — its typed value lives only in the DOM element, which makes key mistakes visible.' },
      { lines: [36], text: 'Outside the loop, the array is just an array: `todos.length` updates automatically.' },
    ],
  },

  playground: {
    title: 'Todo list',
    objective: 'Expose and fix the index-key bug, then practise empty states and in-place mutations.',
    files: { 'App.vue': todoApp },
    expected: 'Three todos with a note box each. Type a note next to **Walk the dog**, then remove **Buy milk** — the note jumps to **Learn v-for**. That is the index-key bug.',
    experiments: [
      {
        id: 'stable-key',
        task: 'Type a note next to "Walk the dog", remove "Buy milk", and watch the note jump. Then fix the key so each note stays with its todo.',
        hint: 'On line 30, use something that belongs to the todo instead of its position: `:key="todo.id"`.',
        tests: [
          {
            name: 'the note stays with its todo after removing the first item',
            code: `await type(findAll('.todo .note')[1], 'bring the leash')
await click(findAll('.todo .remove')[0])
const first = findAll('.todo')[0]
expect(first.querySelector('.label').textContent).toContain('Walk the dog')
expect(first.querySelector('.note').value).toBe('bring the leash')`,
          },
        ],
        explain: 'With index keys, removing the first item makes key 0 point at "Walk the dog" — so Vue patches the *first* `<li>`\'s text and deletes the *last* `<li>`. The DOM input (and your note) stayed in its slot. With `todo.id` keys, Vue removes the `<li>` whose key is 1 and leaves the others untouched.',
      },
      {
        id: 'empty-state',
        task: 'When every todo is removed, show `<p class="empty">Nothing to do 🎉</p>` instead of the list.',
        hint: 'Put `v-if="todos.length"` on the `<ul>` and add a `v-else` paragraph right after it.',
        tests: [
          {
            name: 'empty message after removing everything',
            code: `expect(exists('.empty')).toBe(false)
for (let i = 0; i < 3; i++) await click('.todo .remove')
expect(exists('.empty')).toBe(true)
expect(exists('.todo')).toBe(false)`,
          },
        ],
        explain: '`v-for` over an empty array renders nothing — the empty state is your job. Check `.length`, because an empty array is truthy.',
      },
      {
        id: 'sort',
        task: 'Add a button with `class="sort"` that sorts the todos alphabetically **in place**.',
        hint: '`@click="todos.sort((a, b) => a.text.localeCompare(b.text))"` — in the template, refs are unwrapped, so no `.value`.',
        tests: [
          {
            name: 'sorting reorders the list',
            code: `await click('.sort')
const labels = findAll('.todo .label').map((l) => l.textContent.replace(/^\\d+\\.\\s*/, '').trim())
expect(labels).toEqual(['Buy milk', 'Learn v-for', 'Walk the dog'])`,
          },
        ],
        explain: '`sort()` mutates the array, and Vue tracks array mutations, so the list re-renders. With stable keys, Vue *moves* the existing `<li>` elements instead of rewriting their contents.',
      },
      {
        id: 'inspect',
        task: 'With `:key="todo.id"` in place, open dev tools, select one `<li>` in the Elements panel, then sort or remove another item.',
        hint: 'Watch whether your selected element is replaced or just moves.',
        explain: 'The same DOM node moves around: Vue reuses elements by key. That is why keyed rows keep focus, scroll position, typed text and child component state.',
      },
    ],
  },

  animation: {
    type: 'vdom',
    props: { preset: 'keys' },
    title: 'Why keys matter: the diff',
    caption: 'The same list change diffed twice: once with index keys (content patched into the wrong elements) and once with stable keys (one element removed, the rest untouched).',
    alt: 'A conceptual virtual DOM diff. Left: old and new list trees keyed by index, with every item\'s text patched and the last element removed. Right: the same change keyed by id, where only the removed item\'s element is deleted and the others are matched unchanged.',
  },

  internals: {
    beginner: `
\`v-for\` makes one element per item. When the array changes, Vue compares the new list with the old one. Keys are how it matches them up: same key means "same item — keep this element and just update what changed". Without good keys, Vue matches by position and ends up rewriting elements that didn't need to change — or worse, leaving state in the wrong place.
`,
    technical: [
      `
The compiler turns \`v-for\` into a \`renderList()\` call inside a fragment: one virtual node per item, each carrying the \`key\` you provided.

On update, the renderer diffs the old and new child lists:

- **Keyed lists** (\`patchKeyedChildren\`): Vue first walks matching keys from the start, then from the end. For the unmatched middle it builds a \`key → new index\` map, patches nodes whose keys still exist, unmounts the ones whose keys disappeared, mounts new ones, and **moves** existing DOM nodes — using a longest-increasing-subsequence calculation to keep the number of moves small.
- **Unkeyed lists** (\`patchUnkeyedChildren\`): Vue patches old child *i* with new child *i* and then mounts or unmounts the difference at the end. Index keys behave the same way, because the key *is* the position.
`,
      {
        code: `// old: [A(key 1), B(key 2), C(key 3)]   new: [B(key 2), C(key 3)]

// keyed by id:     key 1 is gone → unmount A's <li>. B and C are matched by key
//                  and left alone (nothing to patch).

// keyed by index:  old keys [0, 1, 2] → new keys [0, 1]
//                  key 0: patch A's <li> with B's data
//                  key 1: patch B's <li> with C's data
//                  key 2: unmount C's <li>
//                  → any DOM state (input value, focus) stays in the wrong <li>`,
        lang: 'js',
        title: 'what the diff does (simplified)',
      },
      `
Array reactivity in Vue 3 comes from a Proxy around the array: index writes, \`length\` changes and mutation methods are all intercepted, so \`arr[i] = x\` works (in Vue 2 it didn't, and you needed \`Vue.set\`). See [Reactivity with arrays, objects & destructuring](lesson:arrays-objects-reactivity) and [How Vue updates the DOM](lesson:how-vue-updates).
`,
    ],
    production: `
- **Keys come from data.** Use database ids. For items created on the client before they have an id, generate one *once* when the item is created (e.g. \`crypto.randomUUID()\`), never during render.
- **Big lists:** rendering thousands of rows is expensive no matter how good the diff is. Paginate, or use virtual scrolling (render only visible rows). See [Large lists & virtual scrolling](lesson:large-lists).
- **Heavy rows:** extract a row component (so each row re-renders independently) and consider \`v-memo\` (3.2+) after measuring. For huge read-only datasets, \`shallowRef\` avoids making every nested property reactive.
- **Animations:** \`<TransitionGroup>\` needs keyed children to animate moves, enters and leaves.
- **Lint for it:** \`eslint-plugin-vue\` flags missing keys and \`v-if\` + \`v-for\` on the same element.
`,
  },

  mistakes: [
    {
      title: 'Using the index as the key for a list that changes',
      wrong: { code: `<li v-for="(todo, i) in todos" :key="i">\n  {{ todo.text }} <input />\n</li>`, lang: 'vue' },
      right: { code: `<li v-for="todo in todos" :key="todo.id">\n  {{ todo.text }} <input />\n</li>`, lang: 'vue' },
      explanation: 'Index keys follow the position. After removing, inserting or sorting, DOM state (inputs, focus, child component state) stays with the position and ends up next to the wrong item.',
    },
    {
      title: 'v-if and v-for on the same element',
      wrong: { code: `<li v-for="user in users" v-if="user.active" :key="user.id">{{ user.name }}</li>`, lang: 'vue' },
      right: { code: `<script setup>\nconst activeUsers = computed(() => users.value.filter((u) => u.active))\n</script>\n\n<template>\n  <li v-for="user in activeUsers" :key="user.id">{{ user.name }}</li>\n</template>`, lang: 'vue' },
      explanation: 'In Vue 3 the `v-if` runs first, before `user` exists, so it throws. A computed filter is clearer and runs once per change instead of once per render. (Alternatively: `<template v-for>` with the `v-if` on the inner element.)',
    },
    {
      title: 'Sorting the original array in a computed',
      wrong: { code: `const sorted = computed(() => items.value.sort((a, b) => a.price - b.price))`, lang: 'js' },
      right: { code: `const sorted = computed(() => [...items.value].sort((a, b) => a.price - b.price))`, lang: 'js' },
      explanation: '`sort()` reorders the array it is called on. Inside a computed, that silently mutates your source data (and every other view of it). Copy first, or use `toSorted()`.',
    },
    {
      title: 'Calling filter() without using the result',
      wrong: { code: `function removeDone() {\n  todos.value.filter((t) => !t.done) // returns a new array… which is thrown away\n}`, lang: 'js' },
      right: { code: `function removeDone() {\n  todos.value = todos.value.filter((t) => !t.done)\n}`, lang: 'js' },
      explanation: '`filter`, `map`, `slice` and `concat` never change the original array. Assign the result back.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: Duplicate keys found during update: 3 Make sure keys are unique.`',
      cause: 'Two items share the same key — often copied items or ids generated with a counter that restarted.',
      fix: 'Make keys unique: use real ids, or generate a unique id once when the item is created.',
    },
    {
      symptom: 'Typed text, checkbox state or focus jumps to a different row after deleting or sorting.',
      cause: 'The list uses `:key="index"` (or no key), so DOM state stays with the position.',
      fix: 'Key by a stable id: `:key="item.id"`.',
    },
    {
      symptom: '`Cannot read properties of undefined` or "property was accessed during render but is not defined" on a loop variable.',
      cause: '`v-if` and `v-for` on the same element — `v-if` runs first, before the loop variable exists.',
      fix: 'Filter with a computed property or move `v-for` to a wrapping `<template>`.',
    },
    {
      symptom: 'The list doesn\'t change after "removing" items.',
      cause: 'A non-mutating method (`filter`, `map`, `slice`) was called and its result discarded.',
      fix: 'Assign the result back to the ref, or use a mutating method like `splice`.',
    },
    {
      symptom: 'Your linter reports "Elements in iteration expect to have \'v-bind:key\' directives".',
      cause: 'A `v-for` without `:key` (rule from eslint-plugin-vue).',
      fix: 'Add a unique, stable `:key`.',
    },
  ],

  bestPractices: [
    'Always add `:key` with a stable, unique id from your data.',
    'Use index keys only for static lists with no per-row state.',
    'Filter and sort with computed properties; copy before `sort()`/`reverse()`.',
    'Never combine `v-if` and `v-for` on one element.',
    'Render an explicit empty state when the array is empty.',
    'Extract a row component once a list item grows beyond a few lines — pass the item as a prop.',
  ],

  useCases: [
    'Todo lists, shopping carts, chat messages, notifications.',
    'Tables and grids of data from an API.',
    'Navigation menus and tabs generated from config.',
    'Select options and radio groups built from arrays.',
    'Repeating a fixed number of things: rating stars with `n in 5`.',
  ],

  whenToUse: {
    use: [
      'Whenever the number of elements depends on data.',
      'Iterating over an object\'s properties for key/value displays.',
      'Ranges (`n in 10`) for a fixed count of repeated elements.',
    ],
    avoid: [
      'Thousands of rows rendered at once — paginate or virtualise.',
      'Complex filtering/sorting written inside the template — use computed.',
      'Using `v-for` + `v-if` together on one element.',
    ],
  },

  comparison: {
    title: 'Choosing a key',
    headers: ['', 'Stable id `:key="todo.id"`', 'Index `:key="index"`', 'No key', 'Random `:key="Math.random()"`'],
    rows: [
      ['Identity follows…', 'the item', 'the position', 'the position (in-place patching)', 'nothing — new every render'],
      ['After remove / reorder', 'elements move with their items', 'contents shift between elements', 'contents shift between elements', 'every element is re-created'],
      ['Row state (inputs, child components)', 'stays with the right item', 'ends up on the wrong item', 'ends up on the wrong item', 'lost on every render'],
      ['When acceptable', 'always — the default', 'static lists with no row state', 'same as index', 'never'],
    ],
    note: 'Watch the diff in [How Vue updates the DOM](lesson:how-vue-updates).',
  },

  quiz: [
    {
      id: 'list-rendering-q1',
      type: 'mcq',
      prompt: 'Why does Vue need a `:key` on `v-for` items?',
      options: [
        { text: 'To track each item\'s identity, so elements (and their state) can be reused, moved or removed correctly when the list changes.' },
        { text: 'To make the list sort itself by key.', why: 'Keys never change the order; they identify items.' },
        { text: 'Because `v-for` throws an error without one.', why: 'It renders without one; you just lose identity tracking (and your linter will complain).' },
        { text: 'To style each item with a unique CSS selector.', why: 'Keys are not rendered as attributes and are not for styling.' },
      ],
      answer: 0,
      explanation: 'Keys tell the diff algorithm "this new item is that old element". Without stable keys Vue matches by position.',
    },
    {
      id: 'list-rendering-q2',
      type: 'output',
      prompt: 'What text does this render?',
      code: { lang: 'vue', code: `<span v-for="n in 3" :key="n">{{ n }}</span>` },
      answer: '123',
      accept: ['1 2 3', '1,2,3', '1, 2, 3'],
      explanation: 'A number range starts at **1**: `n` takes the values 1, 2 and 3.',
    },
    {
      id: 'list-rendering-q3',
      type: 'bug',
      prompt: 'This template throws `Cannot read properties of undefined (reading \'active\')`. Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const users = ref([
  { id: 1, name: 'Ada', active: true },
  { id: 2, name: 'Linus', active: false },
])
</script>

<template>
  <ul>
    <li v-for="user in users" v-if="user.active" :key="user.id">{{ user.name }}</li>
  </ul>
</template>`,
      },
      answerLine: 11,
      explanation: 'In Vue 3, `v-if` has higher priority than `v-for` on the same element, so `user` is not defined yet when the condition runs. Filter with a computed (`activeUsers`) instead.',
    },
    {
      id: 'list-rendering-q4',
      type: 'fill',
      prompt: 'Show a numbered list and key each item by its id.',
      code: { lang: 'vue', code: `<li v-for="(todo, ___) in todos" :key="todo.___">\n  {{ index + 1 }}. {{ todo.text }}\n</li>` },
      answer: [['index'], ['id']],
      explanation: 'The second alias is the position (named `index` here because the template uses it), and the key should be the stable `id`.',
    },
    {
      id: 'list-rendering-q5',
      type: 'mcq',
      prompt: 'Which call does **not** change the array, so you must assign its result back to see a change?',
      options: [
        { text: '`todos.value.filter((t) => !t.done)`' },
        { text: '`todos.value.push(todo)`', why: '`push` mutates the array in place; Vue picks it up.' },
        { text: '`todos.value.splice(0, 1)`', why: '`splice` mutates the array in place.' },
        { text: '`todos.value.sort(compare)`', why: '`sort` mutates the array in place (which is why you copy before sorting derived views).' },
      ],
      answer: 0,
      explanation: '`filter` returns a new array. Write `todos.value = todos.value.filter(…)`.',
    },
    {
      id: 'list-rendering-q6',
      type: 'mcq',
      prompt: 'What happens if you use `:key="Math.random()"`?',
      options: [
        { text: 'Every render produces new keys, so Vue destroys and re-creates every item each time — losing their state.' },
        { text: 'Nothing special; any unique value is fine.', why: 'Keys must also be *stable*: the same item needs the same key on every render.' },
        { text: 'Vue sorts the list randomly.', why: 'Keys do not affect order.' },
        { text: 'Vue caches the items forever.', why: 'The opposite: nothing can be reused because no key ever matches.' },
      ],
      answer: 0,
      explanation: 'A key that changes on every render means "this is a brand-new item" every time.',
    },
    {
      id: 'list-rendering-q7',
      type: 'short',
      prompt: 'When is using the index as the key acceptable?',
      answer: 'Only when the list is effectively static — items are never inserted, removed or reordered (except appending at the end) — and the rows hold no state of their own, such as input values, focus or stateful child components. In that case position and identity never diverge. Otherwise use a stable id.',
    },
  ],

  exercises: [
    {
      id: 'product-list',
      title: 'A filterable product list',
      difficulty: 'beginner',
      prompt: `
Render the products and add an "in stock only" filter:

- Each product is an \`<li class="product">\` showing **name — €price** with two decimals (e.g. "Desk lamp — €24.50"), keyed by \`id\`.
- A \`<button class="toggle-stock">\` flips a ref \`onlyInStock\`. When it is true, products with \`stock === 0\` are hidden.
- Use a **computed** property \`visibleProducts\` for the filtered list.
- When there is nothing to show, render \`<p class="empty">No products</p>\` instead of the list.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

const products = ref([
  { id: 1, name: 'Desk lamp', price: 24.5, stock: 3 },
  { id: 2, name: 'Notebook', price: 4, stock: 0 },
  { id: 3, name: 'Gel pens', price: 6.25, stock: 12 },
  { id: 4, name: 'Monitor stand', price: 39.99, stock: 1 },
])
const onlyInStock = ref(false)

// TODO: visibleProducts
</script>

<template>
  <button class="toggle-stock">In stock only</button>
  <ul class="products">
    <li class="product">Product — €0.00</li>
  </ul>
</template>`,
      },
      hints: [
        '`const visibleProducts = computed(() => onlyInStock.value ? products.value.filter((p) => p.stock > 0) : products.value)`.',
        "Loop: `<li v-for=\"p in visibleProducts\" :key=\"p.id\" class=\"product\">{{ p.name }} — €{{ p.price.toFixed(2) }}</li>`.",
        'Put `v-if="visibleProducts.length"` on the `<ul>` and a `v-else` paragraph after it. The button gets `@click="onlyInStock = !onlyInStock"`.',
      ],
      solution: {
        explanation: 'The array stays untouched; a computed derives the visible subset and re-runs only when `products` or `onlyInStock` change. Keys come from ids, and the empty state is handled explicitly.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const products = ref([
  { id: 1, name: 'Desk lamp', price: 24.5, stock: 3 },
  { id: 2, name: 'Notebook', price: 4, stock: 0 },
  { id: 3, name: 'Gel pens', price: 6.25, stock: 12 },
  { id: 4, name: 'Monitor stand', price: 39.99, stock: 1 },
])
const onlyInStock = ref(false)

const visibleProducts = computed(() =>
  onlyInStock.value ? products.value.filter((p) => p.stock > 0) : products.value
)
</script>

<template>
  <button class="toggle-stock" @click="onlyInStock = !onlyInStock">In stock only</button>
  <ul v-if="visibleProducts.length" class="products">
    <li v-for="p in visibleProducts" :key="p.id" class="product">{{ p.name }} — €{{ p.price.toFixed(2) }}</li>
  </ul>
  <p v-else class="empty">No products</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'renders every product with two decimals',
          code: `const items = findAll('.product').map((li) => li.textContent.trim())
expect(items).toEqual(['Desk lamp — €24.50', 'Notebook — €4.00', 'Gel pens — €6.25', 'Monitor stand — €39.99'])`,
        },
        {
          name: 'the toggle hides out-of-stock products',
          code: `await click('.toggle-stock')
expect(findAll('.product').length).toBe(3)
expect(text('.products')).not.toContain('Notebook')
await click('.toggle-stock')
expect(findAll('.product').length).toBe(4)`,
        },
        {
          name: 'new products appear automatically',
          code: `state.products.push({ id: 5, name: 'Stapler', price: 9, stock: 2 })
await nextTick()
expect(findAll('.product').length).toBe(5)`,
        },
        { name: 'empty state', code: `state.products = []; await nextTick(); expect(exists('.empty')).toBe(true); expect(exists('.product')).toBe(false)` },
      ],
    },
    {
      id: 'leaderboard',
      title: 'A sorted leaderboard that doesn\'t touch the data',
      difficulty: 'beginner',
      prompt: `
Show the players as \`<li class="row">\` sorted by **score, highest first**, each as **#rank name (score)** — e.g. "#1 Mia (310)".

- Use a computed property \`ranked\`.
- Do **not** reorder the original \`players\` array (other parts of the app rely on its order).
- Key rows by \`id\`.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

const players = ref([
  { id: 1, name: 'Leo', score: 120 },
  { id: 2, name: 'Mia', score: 310 },
  { id: 3, name: 'Sam', score: 205 },
])

// TODO: ranked
</script>

<template>
  <ol class="board">
    <li class="row">#1 Name (0)</li>
  </ol>
</template>`,
      },
      hints: [
        'Copy before sorting: `[...players.value].sort((a, b) => b.score - a.score)`.',
        'Wrap it: `const ranked = computed(() => [...players.value].sort((a, b) => b.score - a.score))`.',
        "Loop with the index for the rank: `<li v-for=\"(p, i) in ranked\" :key=\"p.id\" class=\"row\">#{{ i + 1 }} {{ p.name }} ({{ p.score }})</li>`.",
      ],
      solution: {
        explanation: 'Spreading into a new array before `sort()` leaves `players` untouched; the computed re-sorts whenever a score changes. The index is fine for the *rank label* — the key is still the stable id, so rows move correctly when the order changes.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const players = ref([
  { id: 1, name: 'Leo', score: 120 },
  { id: 2, name: 'Mia', score: 310 },
  { id: 3, name: 'Sam', score: 205 },
])

const ranked = computed(() => [...players.value].sort((a, b) => b.score - a.score))
</script>

<template>
  <ol class="board">
    <li v-for="(p, i) in ranked" :key="p.id" class="row">#{{ i + 1 }} {{ p.name }} ({{ p.score }})</li>
  </ol>
</template>`,
        },
      },
      tests: [
        {
          name: 'sorted by score, highest first',
          code: `expect(findAll('.row').map((r) => r.textContent.trim())).toEqual(['#1 Mia (310)', '#2 Sam (205)', '#3 Leo (120)'])`,
        },
        { name: 'the original array keeps its order', code: `expect(state.players.map((p) => p.name)).toEqual(['Leo', 'Mia', 'Sam'])` },
        {
          name: 'the board re-sorts when a score changes',
          code: `state.players[0].score = 400
await nextTick()
expect(findAll('.row')[0].textContent.trim()).toBe('#1 Leo (400)')
expect(state.players[0].name).toBe('Leo')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'list-rendering-keys',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why do we need keys in `v-for`?',
      answer: 'Keys give each rendered item a stable identity. When the list changes, Vue\'s diff matches old and new virtual nodes by key, so it can reuse, move, add and remove the right DOM elements — and DOM state (input values, focus) or child component state stays with the right item. Without keys (or with index keys), Vue patches elements in place by position, which is fine for static lists but misplaces state when items are inserted, removed or reordered.',
      explanation: 'Keys answer "which element is this item?" — positions can\'t, because they change.',
      whyAsked: 'One of the most common Vue (and React) interview questions.',
      mistakes: ['Saying keys are "for performance" only.', 'Saying the index is a fine key in general.', 'Not mentioning component/DOM state.'],
      followUps: ['When is the index acceptable?', 'What happens with duplicate keys?', 'How does the keyed diff move elements?'],
      modelAnswer: "Keys give each item in a list a stable identity. When the array changes, Vue compares the old and new lists, and with keys it can say 'this new item is that old element', so it reuses and moves the right DOM nodes and only adds or removes what really changed. That matters for correctness, not just speed: things like input values, focus or a child component's state live in those elements, so they must stay with the right item. Without keys, or with index keys, Vue matches by position, so after a deletion or sort the state ends up next to the wrong item. I use ids from the data.",
    },
    {
      id: 'list-rendering-index-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'In a list of editable rows, deleting the first row makes the second row show what was typed into the first. The template uses `<EditableRow v-for="(row, i) in rows" :key="i" :row="row" />`. Explain.',
      answer: 'With index keys, deleting row 0 makes key 0 refer to the old row 1. Vue keeps the first `EditableRow` instance (and its local state, such as a draft value) and just passes it new props; the last instance is unmounted. The local state therefore stays at position 0. Keying by `row.id` makes Vue unmount the deleted row\'s instance and keep the others with their own state.',
      explanation: 'Index keys tie component instances to positions, so local state follows the position instead of the data.',
      whyAsked: 'A very common real bug, and it tests whether you truly understand keys.',
      mistakes: ['Suggesting `nextTick` or forcing a re-render.', 'Blaming the child component.'],
      followUps: ['How would you generate ids for rows created on the client?', 'Would lifting the draft into the parent also fix it?'],
      modelAnswer: "The key is the index, so after deleting the first row, key zero now belongs to what used to be row two. Vue sees key zero in both lists and keeps that component instance, just updating its props — but the instance's local state, like the draft text, stays. The instance with key two disappears instead. So the state belongs to the position rather than the row. Keying by row.id fixes it: Vue unmounts exactly the deleted row's instance and the others keep their own state.",
    },
    {
      id: 'list-rendering-if-for',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What happens when `v-if` and `v-for` are on the same element in Vue 3 compared with Vue 2, and what should you do instead?',
      answer: 'In Vue 3, `v-if` has higher priority, so it is evaluated before the loop and cannot access the loop variable (usually an error). In Vue 2, `v-for` had higher priority, so the condition ran for every item on every render. In both cases the recommendation is the same: don\'t combine them. Filter with a computed property, or put `v-for` on a `<template>` and `v-if` on the inner element — or, to hide the entire list, put the `v-if` on a wrapping element.',
      explanation: 'Precedence flipped between versions, which is exactly why mixing them is discouraged.',
      code: {
        lang: 'vue',
        code: `<!-- filter -->
<li v-for="u in activeUsers" :key="u.id">{{ u.name }}</li>

<!-- or wrap -->
<template v-for="u in users" :key="u.id">
  <li v-if="u.active">{{ u.name }}</li>
</template>`,
      },
      whyAsked: 'Checks Vue 3 knowledge and migration awareness.',
      mistakes: ['Saying v-for still has priority.', 'Not offering an alternative.'],
      followUps: ['Why is the computed approach usually better?', 'Where does the key go with `<template v-for>`?'],
      modelAnswer: "In Vue 3 v-if wins, so the condition runs before the loop variable exists and typically throws. Vue 2 was the opposite: the loop ran first and the condition was checked per item every render. Because of that ambiguity the style guide says never to combine them. I filter with a computed, which is clearer and only recalculates when the data changes, or I wrap with template v-for and put the v-if inside, with the key on the template.",
    },
    {
      id: 'list-rendering-sort-mutation',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A "Price: low to high" view uses `const sorted = computed(() => products.value.sort((a, b) => a.price - b.price))`. Afterwards, another component that shows products "in the order they were added" is sorted too. Why?',
      answer: '`Array.prototype.sort()` sorts in place, so the computed mutates the shared source array. Every view of `products` sees the new order, and mutating reactive state inside a computed is a side effect computeds must not have. Copy first (`[...products.value].sort(…)`) or use `toSorted()`.',
      explanation: 'Computeds should be pure: derive new data, never change their inputs.',
      whyAsked: 'Classic JavaScript + reactivity trap seen in many codebases.',
      mistakes: ['Not knowing `sort` mutates.', 'Thinking computed makes a copy automatically.'],
      followUps: ['Which other array methods mutate in place?', 'What do `toSorted` and `toReversed` do?'],
      modelAnswer: "sort mutates the array it's called on, so the computed is reordering the shared products array itself — every component reading it sees the sorted order. It's also a side effect inside a computed, which should be a pure derivation. The fix is to sort a copy: spread into a new array first, or use toSorted in environments that support it. Same story for reverse and splice.",
    },
    {
      id: 'list-rendering-object-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What does this render?',
      code: {
        lang: 'vue',
        code: `<script setup>
const sizes = { s: 36, m: 40 }
</script>

<template>
  <span v-for="(value, key, index) in sizes" :key="key">{{ index }}-{{ key }}-{{ value }} </span>
</template>`,
      },
      options: ['0-s-36 1-m-40', 's-0-36 m-1-40', '36-s-0 40-m-1', '1-s-36 2-m-40'],
      correctOption: 0,
      answer: '"0-s-36 1-m-40". With objects the aliases are `(value, key, index)`, in `Object.keys()` order, and the index starts at 0.',
      explanation: 'Value first, then key, then index — the opposite of what many people guess.',
      whyAsked: 'Checks precise syntax knowledge.',
      mistakes: ['Swapping key and value.', 'Starting the index at 1 (only number ranges start at 1).'],
      followUps: ['What does `v-for="n in 3"` render?', 'In what order are object keys iterated?'],
      modelAnswer: "It renders 0-s-36 then 1-m-40. For objects the aliases are value, key, index — value comes first — iterating in Object.keys order with a zero-based index. The only place v-for counts from one is a number range like n in 3.",
    },
    {
      id: 'list-rendering-huge-list',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A table renders 10,000 rows from an API and scrolling and filtering feel slow. How would you approach it?',
      answer: 'Measure first (Vue DevTools, the browser performance panel). Then reduce what is rendered: paginate or use virtual scrolling so only visible rows exist in the DOM. Keep keys stable. Avoid deep reactivity for large read-only data (`shallowRef`, or `markRaw` for nested objects). Move filtering and sorting into computed properties (and debounce search input). Extract a row component so rows update independently, and use `v-memo` only where profiling shows benefit. Consider server-side filtering/pagination.',
      explanation: 'The fastest DOM node is the one you never create.',
      whyAsked: 'Senior question that combines rendering, reactivity and UX trade-offs.',
      mistakes: ['Jumping to micro-optimisations without measuring.', 'Believing keys alone fix large lists.', 'Forgetting server-side options.'],
      followUps: ['How does virtual scrolling work?', 'What does `shallowRef` change for a large array?', 'When does `v-memo` help?'],
      modelAnswer: "First I'd profile to see whether the cost is rendering, reactivity or the filtering itself. The biggest win is usually rendering fewer rows: pagination or virtual scrolling, where only the visible rows plus a buffer exist in the DOM. For large read-only data I'd use shallowRef so Vue doesn't make ten thousand objects deeply reactive. Filtering and sorting go into computeds with a debounced search input, rows become a separate component so updates stay local, and v-memo is a targeted tool if profiling shows rows re-rendering needlessly. If the data keeps growing, I'd move filtering and pagination to the server.",
    },
    {
      id: 'list-rendering-coding-cart',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 7,
      question: 'Render the cart: each item as `<li class="item">` with **name × qty** and a `<button class="remove">`; show the total in `.total` as **Total: €X.XX**; show `<p class="empty">Your cart is empty</p>` when there are no items.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const cart = ref([
  { id: 'a1', name: 'Coffee', price: 3.5, qty: 2 },
  { id: 'b2', name: 'Bagel', price: 2.25, qty: 1 },
])
</script>

<template>
  <ul class="cart"></ul>
  <p class="total">Total: €0.00</p>
</template>`,
        },
      },
      tests: [
        { name: 'renders the items', code: `expect(findAll('.item').map((li) => li.textContent.replace('✕', '').trim())).toEqual(['Coffee × 2', 'Bagel × 1'])` },
        { name: 'shows the total', code: `expect(text('.total')).toBe('Total: €9.25')` },
        {
          name: 'remove updates the list and total',
          code: `await click('.item .remove')
expect(findAll('.item').length).toBe(1)
expect(text('.total')).toBe('Total: €2.25')`,
        },
        { name: 'empty state', code: `await click('.item .remove'); await click('.item .remove'); expect(exists('.empty')).toBe(true); expect(text('.total')).toBe('Total: €0.00')` },
      ],
      hints: ['`const total = computed(() => cart.value.reduce((sum, i) => sum + i.price * i.qty, 0))`.', 'Remove with `cart.value = cart.value.filter((i) => i.id !== id)`; key rows by `item.id`.'],
      answer: 'A keyed `v-for` over `cart`, a computed total, a filter-based remove and a `v-if`/`v-else` empty state.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const cart = ref([
  { id: 'a1', name: 'Coffee', price: 3.5, qty: 2 },
  { id: 'b2', name: 'Bagel', price: 2.25, qty: 1 },
])

const total = computed(() => cart.value.reduce((sum, i) => sum + i.price * i.qty, 0))

function remove(id) {
  cart.value = cart.value.filter((i) => i.id !== id)
}
</script>

<template>
  <ul v-if="cart.length" class="cart">
    <li v-for="item in cart" :key="item.id" class="item">
      {{ item.name }} × {{ item.qty }}
      <button class="remove" @click="remove(item.id)">✕</button>
    </li>
  </ul>
  <p v-else class="empty">Your cart is empty</p>
  <p class="total">Total: €{{ total.toFixed(2) }}</p>
</template>`,
        },
      },
      explanation: 'The array is the single source of truth: the list, the total and the empty state all derive from it.',
      whyAsked: 'A typical live-coding task combining v-for, keys, computed and conditionals.',
      mistakes: ['Keying by index.', 'Storing the total in a separate ref that drifts out of sync.'],
      followUps: ['How would you add quantity buttons?', 'How would you avoid floating-point rounding issues with money?'],
      modelAnswer: "I'd render the cart with a keyed v-for, key by item id, derive the total with a computed reduce, and remove items by filtering and reassigning. An empty-state paragraph uses v-else after checking cart.length. For real money I'd store amounts in cents as integers to avoid floating-point surprises.",
    },
  ],

  takeaways: [
    '`v-for="item in items"` renders one element per item; `(item, index)`, objects `(value, key, index)` and ranges `n in 5` (1-based) work too.',
    'Always key by a stable, unique id: `:key="item.id"`. Index keys misplace state when the list changes.',
    'Mutating methods (`push`, `splice`, `sort`…) update the list; `filter`/`map` return new arrays — assign them back.',
    'Derive filtered/sorted lists with computed, and copy before `sort()`.',
    'Never put `v-if` and `v-for` on the same element — in Vue 3, `v-if` runs first.',
  ],
}
