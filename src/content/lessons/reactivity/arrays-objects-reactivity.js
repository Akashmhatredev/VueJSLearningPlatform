// Lesson: reactivity with arrays, objects, Maps & Sets — and how destructuring loses it.

const playlistApp = `<script setup>
import { ref, reactive, computed } from 'vue'

const songs = ref([
  { id: 1, title: 'Blue Monday', plays: 3 },
  { id: 2, title: 'Clair de Lune', plays: 7 },
  { id: 3, title: 'Africa', plays: 5 },
])

const liked = reactive(new Set([2]))

const stats = reactive({ totalPlays: 15, lastPlayed: 'nothing yet' })
const { totalPlays, lastPlayed } = stats // ⚠️ copies the current values

const mostPlayed = computed(() =>
  [...songs.value].sort((a, b) => b.plays - a.plays).slice(0, 2)
)

function play(song) {
  song.plays++
  stats.totalPlays++
  stats.lastPlayed = song.title
}

function toggleLike(id) {
  if (liked.has(id)) liked.delete(id)
  else liked.add(id)
}
</script>

<template>
  <ul>
    <li v-for="song in songs" :key="song.id" class="song">
      <span class="title">{{ song.title }}</span> ({{ song.plays }})
      <button class="play" @click="play(song)">Play</button>
      <button class="like" @click="toggleLike(song.id)">{{ liked.has(song.id) ? '♥' : '♡' }}</button>
    </li>
  </ul>
  <p class="liked-count">{{ liked.size }} liked</p>
  <p class="top">Top 2: {{ mostPlayed.map((s) => s.title).join(', ') }}</p>
  <p class="stats">{{ totalPlays }} plays · last: {{ lastPlayed }}</p>
</template>`

export default {
  id: 'arrays-objects-reactivity',
  title: 'Reactivity with arrays, objects & destructuring',
  summary: 'Which changes to arrays, objects, Maps and Sets Vue tracks — and why copying values out of reactive state (destructuring, spreading, passing a property) silently disconnects them.',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['reactive', 'reactivity-utilities'],
  related: ['reactive', 'reactivity-utilities', 'list-rendering', 'props', 'using-stores', 'legacy-migration'],
  tags: ['reactivity', 'arrays', 'objects', 'Map', 'Set', 'destructuring', 'spread', 'reactivity loss', 'toRefs', 'sort', 'props destructure', 'Vue 2 caveats'],
  apis: [
    { name: 'reactive(new Map()) / reactive(new Set())', summary: 'Reactive collections: get, set, add, delete, has, size, clear and iteration are tracked.' },
    { name: 'toRefs() / toRef()', summary: 'Destructure reactive state without losing the connection: each property becomes a linked ref.' },
    { name: 'Array.prototype.toSorted()', summary: 'Plain JavaScript (ES2023): a sorted copy, leaving the original array untouched — safe inside computed().' },
  ],
  docs: [
    { label: 'Vue Guide — Limitations of reactive() (destructuring)', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html#limitations-of-reactive' },
    { label: 'Vue Guide — List Rendering: array change detection', url: 'https://vuejs.org/guide/essentials/list.html#array-change-detection' },
    { label: 'Vue Guide — Ref unwrapping in arrays and collections', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html#caveat-in-arrays-and-collections' },
    { label: 'Vue Guide — Reactive props destructure (3.5+)', url: 'https://vuejs.org/guide/components/props.html#reactive-props-destructure' },
  ],

  intro: `
Most real state is **collections**: a cart is an array of items, a profile is an object of fields, a set of selected ids is a \`Set\`, a lookup by key is a \`Map\`.

Good news first: in Vue 3, practically **every way you change** an array, object, \`Map\` or \`Set\` is tracked — \`push\`, \`splice\`, \`list[3] = x\`, adding and deleting properties, \`map.set()\`, \`set.add()\`.

The real trap is the opposite direction: **copying values out** of reactive state. Destructuring, spreading and passing a property to a function all produce plain copies that no longer follow the source. This lesson shows exactly what is and isn't connected, and how to keep the connection when you need it.
`,

  why: [
    `
Two bugs every Vue developer meets, usually in their first month:
`,
    {
      code: `const cart = reactive({ items: [], total: 0 })

// Bug 1: a "shortcut" that disconnects
const { total } = cart          // total is the NUMBER 0, forever
cart.total = 99                 // the template showing {{ total }} still says 0

// Bug 2: a derived list that damages its source
const cheapestFirst = computed(() =>
  cart.items.sort((a, b) => a.price - b.price) // sorts cart.items IN PLACE
)`,
      lang: 'js',
      title: 'disconnected copies and accidental mutation',
    },
    `
Neither line looks wrong at a glance — that's what makes them expensive. To avoid them you need two mental models:

1. **What Vue can see:** only operations that go *through* a reactive proxy (or a ref's \`.value\`) are tracked.
2. **What JavaScript copies:** destructuring and spreading copy primitive values (numbers, strings, booleans) and copy *references* to objects. A copied number is just a number; Vue has no way to keep it updated.

If you've used Vue 2, there's a third reason: many old "caveats" about arrays and new properties **no longer apply** — and old workarounds like \`Vue.set\` are gone.
`,
  ],

  eli15: `
Think of a shared online document that everyone can edit live.

- **Editing the document** — typing in a paragraph, adding a page, deleting a section — everyone sees it instantly. That's what changing a reactive array or object is like: \`push\`, \`splice\`, setting a property, \`map.set()\`… all live.
- **Taking a screenshot** of a paragraph gives you a picture that will never change, even when someone edits the paragraph. That's destructuring: \`const { total } = cart\` is a screenshot of \`total\` right now.
- **A share link** to the paragraph always shows the current text. That's \`toRef(cart, 'total')\` or \`toRefs(cart)\` — instead of copying the value, you keep a live link to it.

One more: if you **print a sorted copy** of a list, the original stays in its order. If you sort *the document itself*, everyone's list gets reordered. That's \`[...list].sort()\` versus \`list.sort()\`.
`,

  analogy: {
    title: 'The live document and the screenshot',
    body: `
A live document is shared: every edit reaches every reader. A screenshot is a frozen copy — perfectly accurate at the moment you took it, and wrong from the next edit on.

Reactive arrays, objects, Maps and Sets are live documents. Destructuring, spreading and passing a single value to a function take screenshots. Links (\`toRef\`, \`toRefs\`, getters like \`() => cart.total\`) let you keep pointing at the live content.
`,
    mapping: [
      ['the live, shared document', 'a reactive array / object / Map / Set'],
      ['typing, adding a page, deleting a section', '`push`, `splice`, `obj.newKey = …`, `delete obj.key`, `map.set()`, `set.add()`'],
      ['a screenshot of one paragraph', '`const { total } = cart`, `{ ...cart }`, `useThing(cart.total)`'],
      ['a share link that always shows the current text', '`toRef(cart, \'total\')`, `toRefs(cart)`, or a getter `() => cart.total`'],
      ['printing a sorted copy', '`[...list].sort()` or `list.toSorted()`'],
      ['re-sorting the document itself', '`list.sort()` — mutates the source everyone shares'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'Destructuring vs a linked ref',
    caption: 'The same destructuring line, two outcomes. On the left you get a screenshot of the value; on the right, a ref that reads and writes the original property.',
    alt: 'Side-by-side code. Left, labelled "Destructured copy": const { count } = state; after state.count++ the copy is still 0. Right, labelled "toRefs: linked": const { count } = toRefs(state); after state.count++, count.value is 1, and writing count.value also updates state.count.',
    props: {
      left: {
        label: 'Destructured copy (disconnected)',
        lang: 'js',
        code: `const state = reactive({ count: 0, user: { name: 'Ada' } })
const { count, user } = state

state.count++
console.log(count)      // 0 — a copied number

state.user.name = 'Grace'
console.log(user.name)  // 'Grace' — same object...
state.user = { name: 'Linus' }
console.log(user.name)  // 'Grace' — ...until it is replaced`,
      },
      right: {
        label: 'toRefs: linked refs',
        lang: 'js',
        code: `const state = reactive({ count: 0, user: { name: 'Ada' } })
const { count, user } = toRefs(state)

state.count++
console.log(count.value)      // 1 — reads state.count

count.value = 10
console.log(state.count)      // 10 — writes go through too

state.user = { name: 'Linus' }
console.log(user.value.name)  // 'Linus' — always the current object`,
      },
      points: [
        'Destructuring runs the proxy\'s get once and stores the result in a plain variable.',
        'Primitive values (numbers, strings, booleans) are copied, so they never update.',
        'Object values are shared references — they see nested changes, but go stale when the property is replaced.',
        '`toRefs()` gives one ref per property; each ref reads and writes the original reactive object.',
      ],
    },
  },

  syntax: [
    `
#### Arrays: every mutation is tracked
`,
    {
      code: `const todos = ref([{ id: 1, text: 'Buy milk', done: false }])

todos.value.push({ id: 2, text: 'Walk dog', done: false }) // ✅
todos.value.splice(0, 1)                                  // ✅ remove
todos.value[0] = { id: 3, text: 'Call mum', done: false } // ✅ index assignment (Vue 3)
todos.value.length = 0                                    // ✅ truncate
todos.value[0].done = true                                // ✅ nested (deep)

todos.value = todos.value.filter((t) => !t.done)          // ✅ replace (with a ref)`,
      lang: 'js',
      title: 'mutating and replacing arrays',
    },
    `
**Careful with methods that mutate in place:** \`sort()\`, \`reverse()\`, \`splice()\`, \`fill()\` and \`copyWithin()\` change the array itself. Inside a \`computed()\` (which should never change its sources), work on a copy:
`,
    {
      code: `// ❌ reorders the source array for everyone
const byPrice = computed(() => products.value.sort((a, b) => a.price - b.price))

// ✅ sorted copies — the source keeps its order
const byPrice2 = computed(() => [...products.value].sort((a, b) => a.price - b.price))
const byPrice3 = computed(() => products.value.toSorted((a, b) => a.price - b.price)) // ES2023`,
      lang: 'js',
      title: 'sorting without side effects',
    },
    `
#### Objects: adding and deleting keys is tracked
`,
    {
      code: `const user = reactive({ name: 'Ada' })

user.age = 36              // ✅ new property — tracked in Vue 3
delete user.age            // ✅ deletion — tracked
'age' in user              // tracked read: re-runs when 'age' is added/removed
Object.keys(user)          // tracked iteration: re-runs when keys are added/removed`,
      lang: 'js',
      title: 'dynamic keys',
    },
    `
#### Map and Set: use their methods
`,
    {
      code: `const stock = reactive(new Map([['apples', 12]]))
stock.set('bread', 3)        // ✅ add / update
stock.delete('apples')       // ✅
stock.get('bread')           // tracked read
stock.size                   // tracked
for (const [name, qty] of stock) {} // tracked iteration

const selected = reactive(new Set())
selected.add(42)             // ✅
selected.has(42)             // tracked read
selected.clear()             // ✅

const tags = ref(new Set())  // also fine: the Set inside .value is made reactive
tags.value.add('vue')        // ✅`,
      lang: 'js',
      title: 'reactive collections',
    },
    `
#### Copies are disconnected
`,
    {
      code: `const cart = reactive({ items: [], coupon: '' })

const { coupon } = cart            // ❌ plain string copy
const snapshot = { ...cart }       // ❌ plain object; snapshot.coupon never updates
validateCoupon(cart.coupon)        // ❌ passes the current string only

const { coupon: couponRef } = toRefs(cart)   // ✅ linked ref
const couponRef2 = toRef(cart, 'coupon')     // ✅ linked ref
validateCoupon(() => cart.coupon)            // ✅ a getter the function can re-run`,
      lang: 'js',
      title: 'what loses reactivity, and the fixes',
    },
    `
**The rules:**

1. In Vue 3, **all** changes made *through* reactive state are tracked: index assignment, \`length\`, mutation methods, new and deleted keys, \`Map\`/\`Set\` methods.
2. **Destructuring, spreading and passing a property's value** create disconnected copies (primitives) or shared references that go stale when the property is replaced (objects).
3. To keep a link, use **\`toRefs()\` / \`toRef()\`**, access through the object (\`cart.coupon\`), or pass a **getter** (\`() => cart.coupon\`).
4. Never mutate the source inside \`computed()\` — sort and reverse **copies**.
5. Refs stored **inside** reactive arrays and \`Map\`/\`Set\` are **not** unwrapped: write \`list[0].value\`, \`map.get('a').value\`.
6. Use stable ids as \`:key\` when lists are reordered, filtered or spliced ([list rendering](lesson:list-rendering)).
`,
    {
      callout: 'version',
      title: 'Coming from Vue 2?',
      text: 'Vue 2 made data reactive with `Object.defineProperty`, so it could not detect new properties, deletions, `arr[i] = x` or `arr.length = n` — you needed `Vue.set` / `Vue.delete` or `splice`. Vue 3\'s Proxy-based reactivity detects all of these, and `Vue.set`/`Vue.delete` no longer exist. Reactive `Map`/`Set` support is also new in Vue 3. See [legacy migration](lesson:legacy-migration).',
    },
    {
      callout: 'version',
      title: 'Props destructure (Vue 3.5+)',
      text: 'In `<script setup>`, `const { title } = defineProps([\'title\'])` stays reactive in Vue 3.5+, because the compiler rewrites `title` to `props.title` within that `<script setup>` block. Passing it *out* still needs a getter: `watch(() => title, …)` or `useThing(() => title)`. Destructuring `props` inside a classic `setup(props)` function still breaks reactivity — use `toRefs(props)` there.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: playlistApp,
    intro: 'A playlist that uses a reactive array, a reactive Set, a reactive object — and one deliberate destructuring trap. Spot which line will misbehave before you run it.',
    steps: [
      { lines: [4, 8], text: '`songs` is a ref holding an array of objects. The array and every song object inside are deeply reactive, so `song.plays++` will be tracked.' },
      { lines: [10], text: '`liked` is a **reactive Set**. `add`, `delete`, `has` and `size` are all tracked — no `.value`, because it is `reactive()`, not `ref()`.' },
      { lines: [12], text: '`stats` is a reactive object, updated every time a song is played.' },
      { lines: [13], text: '**The trap.** Destructuring reads `stats.totalPlays` and `stats.lastPlayed` *once* and stores a number and a string in plain variables. They will never change again.' },
      { lines: [15, 17], text: '`[...songs.value]` sorts a **copy**, so the playlist keeps its own order while "Top 2" is ordered by plays.' },
      { lines: [19, 23], text: '`play()` mutates a nested object (`song.plays++`) and the reactive `stats` object. Both writes go through proxies, so they trigger updates — but nothing updates the destructured copies.' },
      { lines: [25, 28], text: 'Set methods are tracked: the heart icons and the liked count update when `liked` changes.' },
      { lines: [36, 39], text: '`liked.has(song.id)` and `liked.size` are tracked reads of the Set.' },
      { lines: [41], text: 'This line reads the frozen copies. Even when the component re-renders (because `plays` changed), it shows the same stale values: re-rendering can\'t fix a copy.' },
    ],
  },

  playground: {
    title: 'A playlist with arrays, a Set and a trap',
    objective: 'Fix the destructuring trap, then change the array and the Set in different ways and confirm every one of them is tracked.',
    files: { 'App.vue': playlistApp },
    expected: 'Three songs, **1 liked** and **Top 2: Clair de Lune, Africa**. Play buttons update the play counts and the Top 2. The last line, **15 plays · last: nothing yet**, is deliberately broken: it never changes. Your first job is to fix it.',
    experiments: [
      {
        id: 'fix-stats',
        task: 'Fix the stats line so it shows **16 plays · last: Blue Monday** after playing *Blue Monday* once — while keeping a destructuring line (or by not destructuring at all).',
        hint: 'Destructure from `toRefs(stats)` instead of `stats` (import `toRefs`). Or delete line 13 and write `{{ stats.totalPlays }}` / `{{ stats.lastPlayed }}` in the template.',
        tests: [
          {
            name: 'stats follow every play',
            code: `await click(findAll('.play')[0])
expect(text('.stats')).toBe('16 plays · last: Blue Monday')
await click(findAll('.play')[2])
expect(text('.stats')).toBe('17 plays · last: Africa')`,
          },
        ],
        explain: '`toRefs(stats)` turns each property into a ref that reads and writes `stats` — a link instead of a copy. Accessing `stats.totalPlays` directly works for the same reason: every render reads through the proxy.',
      },
      {
        id: 'remove-song',
        task: 'Give each song a `<button class="remove">` that removes it from the playlist **and** from the liked set.',
        hint: 'In a `remove(song)` function: `songs.value.splice(songs.value.indexOf(song), 1)` (or `songs.value = songs.value.filter(...)`) and `liked.delete(song.id)`.',
        tests: [
          {
            name: 'removing Clair de Lune updates the list and the liked count',
            code: `const removes = findAll('.remove')
expect(removes).toHaveLength(3)
await click(removes[1])
expect(findAll('.title').map((el) => el.textContent.trim())).toEqual(['Blue Monday', 'Africa'])
expect(text('.liked-count')).toBe('0 liked')
expect(text('.top')).toBe('Top 2: Africa, Blue Monday')`,
          },
        ],
        explain: '`splice` (a mutation) and `filter` + reassignment (a replacement) are both tracked for a ref\'d array, and `Set.delete` is tracked for the reactive Set. The computed Top 2 recalculates because it read the array.',
      },
      {
        id: 'add-song',
        task: 'Add an `<input class="new-title">` and a `<button class="add">` that appends a new song (0 plays) with that title, then clears the input.',
        hint: 'Keep the typed text in a `ref(\'\')` bound with `v-model`. In `add()`, `songs.value.push({ id: Date.now(), title, plays: 0 })` and reset the text ref.',
        tests: [
          {
            name: 'a new song is appended and the input is cleared',
            code: `expect(exists('.new-title')).toBe(true)
await type('.new-title', 'Hey Jude')
await click('.add')
expect(findAll('.title').map((el) => el.textContent.trim())).toEqual(['Blue Monday', 'Clair de Lune', 'Africa', 'Hey Jude'])
expect(find('.new-title').value).toBe('')`,
          },
        ],
        explain: '`push` is tracked: Vue notices the new index and the changed `length`, so the `v-for` list and the Top 2 computed both update.',
      },
      {
        id: 'index-assignment',
        task: 'Add a button that renames the first song with **index assignment**: `songs.value[0] = { ...songs.value[0], title: \'Renamed\' }`. Then try `songs.value.length = 1`.',
        hint: 'Watch the list after each click. In Vue 2 neither of these would have updated the screen.',
        explain: 'Vue 3\'s Proxy sees index writes and `length` changes, so both update the list. Vue 2 couldn\'t detect them and needed `Vue.set` or `splice` — a caveat you can now forget (but may meet in older code).',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'What each operation touches',
    caption: 'Step through three operations: an array push, a Map set, and a destructuring line. Only the first two reach Vue\'s effects.',
    alt: 'A diagram with three rows. Row one: list.push(x) touches a new index and the length, which triggers effects. Row two: map.set(k, v) goes through Vue\'s instrumented set method, touching the key and the size/iteration, which triggers effects. Row three: const { a } = obj performs one read and produces a plain copy, with a dashed "no link" line to the effects.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'push', label: 'list.push(x)', note: 'through the proxy', x: 110, y: 60, tone: 'acid' },
        { id: 'arr', label: 'new index + length', note: 'set traps', x: 380, y: 60, tone: 'cobalt' },
        { id: 'mapset', label: "map.set('k', v)", note: 'instrumented method', x: 110, y: 160, tone: 'acid' },
        { id: 'map', label: 'key k + size + iteration', note: 'collection handlers', x: 380, y: 160, tone: 'cobalt' },
        { id: 'destructure', label: 'const { a } = obj', note: 'one read, now', x: 110, y: 260, tone: 'red' },
        { id: 'copy', label: 'plain copy', note: 'no proxy', x: 380, y: 260, tone: 'paper' },
        { id: 'effects', label: 'Effects re-run', note: 'render, computed, watch', x: 650, y: 160, tone: 'ink' },
      ],
      edges: [
        { from: 'push', to: 'arr', label: 'writes' },
        { from: 'arr', to: 'effects', label: 'trigger' },
        { from: 'mapset', to: 'map', label: 'writes' },
        { from: 'map', to: 'effects', label: 'trigger' },
        { from: 'destructure', to: 'copy', label: 'copies' },
        { from: 'copy', to: 'effects', label: 'no link', dashed: true },
      ],
      steps: [
        { focus: ['push', 'arr'], edges: ['push->arr'], text: '**`list.push(x)` on a reactive array** writes a new index and updates `length` — both through the proxy\'s set trap.' },
        { focus: ['arr', 'effects'], edges: ['arr->effects'], text: 'Effects that read the array (a `v-for`, a computed using `length` or iterating) are triggered. That\'s why lists "just update" in Vue 3.' },
        { focus: ['mapset', 'map'], edges: ['mapset->map'], text: '**`Map`/`Set` keep their data in internal slots**, not in properties, so a plain Proxy trap can\'t see `set()`. Vue wraps the collection methods instead: `get`, `set`, `has`, `delete`, `size`, iteration.' },
        { focus: ['map', 'effects'], edges: ['map->effects'], text: 'Effects that called `get(\'k\')`, read `size` or iterated the map are triggered.' },
        { focus: ['destructure', 'copy'], edges: ['destructure->copy'], text: '**Destructuring** performs one read *right now* and stores the result in a plain variable. For a number or string that\'s a frozen copy.' },
        { focus: ['copy', 'effects'], edges: ['copy->effects'], text: 'Later writes go to the reactive object, not to your copy. There is no path from the copy to any effect — use `toRefs()`, `toRef()` or a getter to keep a link.' },
      ],
    },
  },

  internals: {
    beginner: `
A reactive array or object is a proxy: every read and write that goes *through* it is seen by Vue. \`push\`, \`splice\`, setting \`list[3]\`, adding or deleting a key — all of them are writes through the proxy, so Vue notices.

A destructured variable is not a proxy. JavaScript copied a value into it at one moment. Vue can't update a plain variable, and it never tries to.
`,
    technical: [
      `
**What gets tracked (conceptually):**

- **Index and property reads** track that key. **Writes** to that key trigger it.
- **Iteration** (\`for…of\` on arrays, \`for…in\`, \`Object.keys\`) tracks the *shape* of the object, so adding or deleting a key re-runs code that loops over it. Changing \`length\` triggers code that depends on indexes beyond the new length.
- **Array mutation methods** (\`push\`, \`pop\`, \`shift\`, \`unshift\`, \`splice\`) are wrapped by Vue so that calling them inside an effect doesn't make that effect depend on \`length\` — otherwise an effect that pushes would re-trigger itself forever.
- **Identity-sensitive search methods** (\`includes\`, \`indexOf\`, \`lastIndexOf\`) are also wrapped, so searching a reactive array works whether you pass the raw object or its proxy.
- **Collections:** \`Map\`/\`Set\` store entries in internal slots that a Proxy \`get\`/\`set\` trap never sees. Vue proxies the collection and replaces its methods with instrumented versions that call track/trigger, and wrap returned values so nested objects are reactive too.

These are implementation details — the public guarantee is simply "changes through reactive state are tracked".
`,
      {
        code: `// What destructuring actually does (simplified):
const state = reactive({ count: 0 })

// const { count } = state   is roughly:
const count = state.count    // one get-trap call → returns the number 0

// toRef(state, 'count') is roughly:
const countRef = {
  get value() { return state.count },        // reads through the proxy every time
  set value(v) { state.count = v },          // writes through the proxy
}`,
        lang: 'js',
        title: 'copy vs link (simplified)',
      },
      `
**Ref unwrapping stops at collections.** A reactive *object* unwraps refs stored in its properties, but a reactive *array* or \`Map\` returns the ref itself — Vue can't know whether you wanted the ref or its value at an arbitrary index or key.
`,
    ],
    production: `
- **Mutate or replace? Be consistent per piece of state.** Mutating in place (\`push\`, \`splice\`) is natural with deep reactivity. Replacing (\`list.value = [...]\`) is required with [shallowRef](lesson:shallow-and-raw), plays well with shallow watchers, and makes changes easy to spot in devtools. Mixing styles in one feature confuses readers.
- **Keys:** with reordering, filtering and splicing, \`:key\` must be a stable id, never the index — otherwise DOM state (inputs, focus, transitions) sticks to the wrong row.
- **Persistence:** \`JSON.stringify(new Map())\` gives \`"{}"\`. Convert collections before saving (\`[...map]\`, \`[...set]\`) and rebuild them when loading.
- **Destructuring stores:** Pinia stores are reactive objects, so destructure state and getters with Pinia's \`storeToRefs()\` (actions can be destructured directly) — see [using stores](lesson:using-stores).
- **Composables:** return refs (or \`toRefs(state)\`) so callers can destructure safely; accept getters or refs as inputs ([utilities](lesson:reactivity-utilities)).
- **Big arrays:** deep reactivity creates a proxy for each item you access. For large, replace-only lists, consider \`shallowRef\` — after measuring.
`,
  },

  mistakes: [
    {
      title: 'Destructuring reactive state for "shorter" template names',
      wrong: { code: `const stats = reactive({ totalPlays: 0, lastPlayed: '' })\nconst { totalPlays, lastPlayed } = stats   // frozen copies`, lang: 'js' },
      right: { code: `const stats = reactive({ totalPlays: 0, lastPlayed: '' })\nconst { totalPlays, lastPlayed } = toRefs(stats)   // linked refs`, lang: 'js' },
      explanation: 'Destructuring copies the current values. `toRefs()` gives you refs that read and write the original object.',
    },
    {
      title: 'Spreading reactive state to make a "live copy"',
      wrong: { code: `const form = reactive({ email: '', name: '' })\nconst payload = { ...form }   // snapshot at this moment\n// later: payload.email is still ''`, lang: 'js' },
      right: { code: `const payload = computed(() => ({ ...form }))   // re-created when form changes\n// or spread at the moment you need it:\nfunction submit() { api.save({ ...form }) }`, lang: 'js' },
      explanation: 'A spread is a one-time copy — exactly right when you send data somewhere, wrong when you expect it to follow later changes.',
    },
    {
      title: 'Sorting or reversing the source inside computed()',
      wrong: { code: `const ranked = computed(() =>\n  players.value.sort((a, b) => b.score - a.score)\n)`, lang: 'js' },
      right: { code: `const ranked = computed(() =>\n  [...players.value].sort((a, b) => b.score - a.score)\n)`, lang: 'js' },
      explanation: '`sort()` and `reverse()` mutate the array they are called on, so the "derived" value reorders the original list everywhere it is shown. Computed getters must not change their sources — sort a copy (or use `toSorted()`).',
    },
    {
      title: 'Reassigning a local alias instead of the reactive property',
      wrong: { code: `const cart = reactive({ items: [] })\nlet items = cart.items\n\nfunction clear() {\n  items = []          // only the local variable changes\n}`, lang: 'js' },
      right: { code: `function clear() {\n  cart.items = []     // or: cart.items.splice(0)\n}`, lang: 'js' },
      explanation: 'The alias pointed at the same array, but assigning a new array to the alias doesn\'t touch `cart.items`. Write through the reactive object.',
    },
    {
      title: 'Saving a reactive Map with JSON.stringify',
      wrong: { code: `localStorage.setItem('stock', JSON.stringify(stock))   // "{}"`, lang: 'js' },
      right: { code: `localStorage.setItem('stock', JSON.stringify([...stock]))\n// load: reactive(new Map(JSON.parse(saved)))`, lang: 'js' },
      explanation: '`Map` and `Set` have no JSON representation, so they serialise as empty objects. Convert them to arrays of entries first.',
    },
  ],

  debugging: [
    {
      symptom: 'A value shown in the template never changes, even though the reactive object it came from does.',
      cause: 'It was destructured or copied out of the reactive object (`const { x } = state`, `{ ...state }`).',
      fix: 'Use `state.x` in the template, destructure from `toRefs(state)`, or create a `computed(() => state.x)`.',
    },
    {
      symptom: 'The original list order changes when a "sorted view" is displayed.',
      cause: '`sort()` or `reverse()` was called on the source array inside a computed or template.',
      fix: 'Sort a copy: `[...list].sort(...)` or `list.toSorted(...)`.',
    },
    {
      symptom: 'A composable or helper doesn\'t react when a property changes.',
      cause: 'It received `state.prop` — a plain value — instead of something it can re-read.',
      fix: 'Pass a getter (`() => state.prop`), `toRef(state, \'prop\')`, or the whole reactive object.',
    },
    {
      symptom: '`map.get(\'key\')` shows a ref object instead of its value.',
      cause: 'Refs inside reactive Maps (and arrays and Sets) are not unwrapped.',
      fix: 'Read `.value`, or store plain values in the collection.',
    },
    {
      symptom: 'Inputs keep the wrong text after removing or reordering list items.',
      cause: 'The `v-for` uses the index as `:key`, so Vue reuses DOM nodes for different items.',
      fix: 'Use a stable unique id as the key.',
    },
  ],

  bestPractices: [
    'Change collections through reactive state and forget the old Vue 2 workarounds — index writes, `length`, new keys and deletions are tracked in Vue 3.',
    'Never destructure reactive objects (or classic `setup()` props) directly; use `toRefs()`/`toRef()` or dot access.',
    'Pass getters or refs — not property values — into composables, helpers and watchers.',
    'Treat computed getters as read-only views: sort, reverse and splice copies, not sources.',
    'Use `reactive(new Map())` / `new Set()` for keyed lookups and membership, and convert to arrays before serialising.',
    'Key list items by stable ids.',
  ],

  useCases: [
    'Carts, todo lists and playlists: arrays of objects mutated with `push`, `splice` and nested property writes.',
    'Selected rows, favourites or open panels tracked with a reactive `Set` of ids.',
    'Lookups by id or name (stock levels, cached users) with a reactive `Map`.',
    'Forms with optional fields added or removed at runtime (`form.extra = …`, `delete form.extra`).',
    'Destructuring composable results and props safely with `toRefs()` and Vue 3.5 props destructure.',
  ],

  whenToUse: {
    use: [
      'Mutating arrays/objects in place when the state is deep (`ref`/`reactive`) and owned by one feature.',
      'Replacing arrays (`list.value = newList`) for server data, shallow state or when you want obvious change points.',
      '`Map`/`Set` when you need keyed lookup, membership checks or non-string keys.',
      '`toRefs()` when you genuinely want short names for reactive properties (composable returns, templates).',
    ],
    avoid: [
      'Destructuring or spreading reactive state when you expect the result to keep updating.',
      'Mutating methods (`sort`, `reverse`, `splice`) inside computed getters or templates.',
      'Storing refs inside reactive arrays or Maps unless you really mean to (no unwrapping there).',
      'Plain objects/arrays for state the UI shows — they are not reactive at all.',
    ],
  },

  comparison: {
    title: 'Change detection: Vue 3 vs Vue 2 (legacy)',
    headers: ['', 'Vue 3 (Proxy)', 'Vue 2 (legacy, Object.defineProperty)'],
    rows: [
      ['`arr[i] = x`', 'tracked', 'not detected — needed `Vue.set(arr, i, x)` or `splice`'],
      ['`arr.length = n`', 'tracked', 'not detected — needed `splice`'],
      ['`push`, `splice`, `sort`…', 'tracked', 'tracked (methods were patched)'],
      ['Adding a new property', 'tracked', 'not detected — needed `Vue.set`'],
      ['`delete obj.key`', 'tracked', 'not detected — needed `Vue.delete`'],
      ['`Map` / `Set`', 'supported via `reactive()` / `ref()`', 'not supported'],
      ['Destructuring a primitive', 'disconnected copy', 'disconnected copy (same in both)'],
    ],
    note: 'Vue 3 removed the old caveats — but not JavaScript\'s copying rules. Destructuring loses reactivity in every version. Deep dive: [How reactivity works](lesson:how-reactivity-works).',
  },

  quiz: [
    {
      id: 'arrays-objects-reactivity-q1',
      type: 'mcq',
      prompt: 'With `const list = reactive([\'a\', \'b\'])` and `const user = reactive({ name: \'Ada\' })`, which changes trigger updates in **Vue 3**? (Select all that apply.)',
      options: [
        { text: '`list[5] = \'x\'`' },
        { text: '`list.length = 0`' },
        { text: '`user.age = 36` (a new property)' },
        { text: '`delete user.name`' },
        { text: '`let n = user.name; n = \'Grace\'`', why: '`n` is a plain copy of the string. Reassigning it never touches `user`.' },
      ],
      answer: [0, 1, 2, 3],
      explanation: 'Vue 3\'s proxies see index writes, length changes, new keys and deletions. Reassigning a copied value only changes the local variable.',
    },
    {
      id: 'arrays-objects-reactivity-q2',
      type: 'output',
      prompt: 'What does this log?',
      code: {
        lang: 'js',
        code: `const state = reactive({ count: 1, user: { name: 'Ada' } })
const { count, user } = state

state.count++
state.user.name = 'Grace'

console.log(count, user.name)`,
      },
      options: [
        { text: '`2 Grace`', why: '`count` was copied as the number 1 when destructuring; later increments don\'t reach it.' },
        { text: '`1 Ada`', why: '`user` is a reference to the same (proxied) nested object, so it sees the name change.' },
        { text: '`1 Grace`' },
        { text: '`2 Ada`', why: 'Both halves are reversed: the number is a frozen copy, the object is shared.' },
      ],
      answer: 2,
      explanation: 'Destructuring copies primitives (`count` stays 1) but copies *references* to objects. `user` points at the same nested object, so the name change is visible. It would go stale if `state.user` were replaced with a new object.',
    },
    {
      id: 'arrays-objects-reactivity-q3',
      type: 'bug',
      prompt: 'Elsewhere on the page, the sign-up order of players gets scrambled as soon as the leaderboard is shown. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `import { ref, computed } from 'vue'

const players = ref([
  { name: 'Ada', score: 12 },
  { name: 'Grace', score: 30 },
  { name: 'Linus', score: 21 },
])

const leaderboard = computed(() =>
  players.value.sort((a, b) => b.score - a.score)
)`,
      },
      answerLine: 10,
      explanation: '`sort()` mutates `players.value` in place, so the computed reorders its own source — and every other view of `players`. Sort a copy: `[...players.value].sort(...)` or `players.value.toSorted(...)`.',
    },
    {
      id: 'arrays-objects-reactivity-q4',
      type: 'fill',
      prompt: 'Fill the blanks for a reactive Map of stock levels.',
      code: {
        lang: 'js',
        code: `const stock = reactive(new Map())

stock.___('apples', 3)            // add or update an entry
console.log(stock.___('apples'))  // 3
console.log(stock.___)            // 1 (number of entries)`,
      },
      answer: [['set'], ['get'], ['size']],
      explanation: 'Reactive Maps are used through their normal methods: `set`, `get`, `has`, `delete`, `size` and iteration — all tracked by Vue.',
    },
    {
      id: 'arrays-objects-reactivity-q5',
      type: 'mcq',
      prompt: 'Which statement about `todos.value[2] = newTodo` on an array held in `ref()` is true?',
      options: [
        { text: 'In Vue 3 it is tracked and updates the screen.' },
        { text: 'It requires `Vue.set(todos.value, 2, newTodo)`.', why: 'That was the Vue 2 workaround; `Vue.set` doesn\'t exist in Vue 3.' },
        { text: 'It only works if you call `nextTick()` afterwards.', why: '`nextTick()` waits for an update — it doesn\'t cause one.' },
        { text: 'It throws because reactive arrays are read-only.', why: 'Reactive arrays are fully mutable.' },
      ],
      answer: 0,
      explanation: 'Vue 3 uses Proxies, which intercept index assignment, so `arr[i] = x` is tracked.',
    },
    {
      id: 'arrays-objects-reactivity-q6',
      type: 'mcq',
      prompt: 'In a Vue 3.5 `<script setup>` component with `const { count } = defineProps([\'count\'])`, how should you watch `count`?',
      options: [
        { text: '`watch(count, cb)`', why: 'That passes the current value, not a reactive source — Vue\'s compiler flags this mistake.' },
        { text: '`watch(() => count, cb)`' },
        { text: 'You can\'t: destructured props are never reactive.', why: 'Since Vue 3.5, destructured `defineProps()` bindings are compiled to `props.count` accesses, so they are reactive inside `<script setup>`.' },
        { text: '`watch(toRefs(count), cb)`', why: '`toRefs()` expects a reactive object, not a single value.' },
      ],
      answer: 1,
      explanation: 'Inside `<script setup>`, the compiler rewrites `count` to `props.count`, so a getter `() => count` reads the prop reactively. Passing `count` itself would pass a plain value.',
    },
    {
      id: 'arrays-objects-reactivity-q7',
      type: 'short',
      prompt: 'In two or three sentences: why does destructuring a reactive object lose reactivity, and what are two ways to keep it?',
      answer: 'Destructuring reads each property once through the proxy and stores the result in a plain variable; primitives become frozen copies and objects become references that go stale if replaced. Keep reactivity by accessing properties through the object (`state.count`), by destructuring from `toRefs(state)` (linked refs), or by using getters/computed (`() => state.count`).',
    },
  ],

  exercises: [
    {
      id: 'tag-set',
      title: 'A tag picker backed by a reactive Set',
      difficulty: 'beginner',
      prompt: `
Build a tag picker that stores tags in a **reactive \`Set\`** (so duplicates are impossible).

- \`<input class="tag-input">\` and \`<button class="add-tag">\`: add the typed tag, **trimmed and lower-cased**, then clear the input. Ignore empty input.
- Each tag is an \`<li class="tag">\` containing \`<span class="tag-name">\` and a \`<button class="remove-tag">\` that removes it.
- Tags appear in the order they were added.
- \`<p class="tag-count">\` shows **\`<n> tags\`**, e.g. \`2 tags\`.
- \`<button class="clear-tags">\` removes all tags.
`,
      files: {
        'App.vue': `<script setup>
import { reactive, ref } from 'vue'

const tags = reactive(new Set())
const draft = ref('')

// TODO: addTag(), removeTag(tag), clearTags()
</script>

<template>
  <input class="tag-input" v-model="draft" placeholder="Add a tag" />
  <button class="add-tag">Add</button>
  <ul></ul>
  <p class="tag-count">0 tags</p>
  <button class="clear-tags">Clear</button>
</template>`,
      },
      hints: [
        'A `Set` ignores values it already contains, so `tags.add(\'vue\')` twice keeps one entry. Normalise with `draft.value.trim().toLowerCase()` first.',
        'A Set is iterable: `v-for="tag in tags"` works, in insertion order. Use the tag itself as the `:key`.',
        'Use the Set methods — `tags.delete(tag)`, `tags.clear()` — and `tags.size` for the count. All are tracked.',
      ],
      solution: {
        explanation: 'The reactive Set gives uniqueness for free, and every Set method (`add`, `delete`, `clear`, `size`, iteration) is tracked by Vue, so the list and the count follow automatically.',
        files: {
          'App.vue': `<script setup>
import { reactive, ref } from 'vue'

const tags = reactive(new Set())
const draft = ref('')

function addTag() {
  const tag = draft.value.trim().toLowerCase()
  if (!tag) return
  tags.add(tag)
  draft.value = ''
}

function removeTag(tag) {
  tags.delete(tag)
}

function clearTags() {
  tags.clear()
}
</script>

<template>
  <input class="tag-input" v-model="draft" placeholder="Add a tag" />
  <button class="add-tag" @click="addTag">Add</button>
  <ul>
    <li v-for="tag in tags" :key="tag" class="tag">
      <span class="tag-name">{{ tag }}</span>
      <button class="remove-tag" @click="removeTag(tag)">×</button>
    </li>
  </ul>
  <p class="tag-count">{{ tags.size }} tags</p>
  <button class="clear-tags" @click="clearTags">Clear</button>
</template>`,
        },
      },
      tests: [
        {
          name: 'adds normalised tags without duplicates',
          code: `await type('.tag-input', 'Vue')
await click('.add-tag')
await type('.tag-input', '  vue ')
await click('.add-tag')
expect(findAll('.tag-name').map((el) => el.textContent.trim())).toEqual(['vue'])
expect(text('.tag-count')).toBe('1 tags')
expect(find('.tag-input').value).toBe('')`,
        },
        {
          name: 'keeps insertion order and removes a tag',
          code: `await type('.tag-input', 'Vue'); await click('.add-tag')
await type('.tag-input', 'Pinia'); await click('.add-tag')
expect(findAll('.tag-name').map((el) => el.textContent.trim())).toEqual(['vue', 'pinia'])
await click(findAll('.remove-tag')[0])
expect(findAll('.tag-name').map((el) => el.textContent.trim())).toEqual(['pinia'])`,
        },
        {
          name: 'ignores empty input and clears all tags',
          code: `await type('.tag-input', '   '); await click('.add-tag')
expect(findAll('.tag')).toHaveLength(0)
await type('.tag-input', 'a'); await click('.add-tag')
await type('.tag-input', 'b'); await click('.add-tag')
await click('.clear-tags')
expect(findAll('.tag')).toHaveLength(0)
expect(text('.tag-count')).toBe('0 tags')`,
        },
      ],
    },
    {
      id: 'stock-map',
      title: 'Stock levels in a reactive Map',
      difficulty: 'intermediate',
      prompt: `
Track stock levels in \`const stock = reactive(new Map([['apples', 12], ['bread', 3]]))\`.

- A form with \`<input class="product">\`, \`<input class="qty" type="number">\` and \`<button class="set-stock">\` sets a product's quantity — adding it if new, updating it if it exists. Product names are **trimmed and lower-cased**; empty names are ignored.
- Each product is an \`<li class="row">\`, **sorted alphabetically**, containing \`<span class="label">name: qty</span>\` (e.g. \`apples: 12\`) and a \`<button class="remove">\` that deletes it.
- \`<p class="total">\` shows **\`Total items: <sum of quantities>\`**.
- \`<p class="low">\` shows **\`Low stock: <number of products with qty below 5>\`**.

Don't mutate the Map while sorting — derive the sorted rows.
`,
      files: {
        'App.vue': `<script setup>
import { reactive, ref, computed } from 'vue'

const stock = reactive(new Map([['apples', 12], ['bread', 3]]))
const product = ref('')
const qty = ref(1)

// TODO: rows, total, lowCount (computed) and setStock()
</script>

<template>
  <input class="product" v-model="product" placeholder="Product" />
  <input class="qty" type="number" v-model.number="qty" />
  <button class="set-stock">Set stock</button>
  <ul>
    <li class="row"><span class="label">apples: 12</span> <button class="remove">Remove</button></li>
  </ul>
  <p class="total">Total items: 12</p>
  <p class="low">Low stock: 0</p>
</template>`,
      },
      hints: [
        'Get sorted rows without touching the Map: `computed(() => [...stock.entries()].sort(([a], [b]) => a.localeCompare(b)))`, then `v-for="[name, count] in rows" :key="name"`.',
        'Sum with `[...stock.values()].reduce((sum, n) => sum + n, 0)`; count low stock with `.filter((n) => n < 5).length`. Reading `entries()`/`values()` is tracked iteration.',
        'In `setStock()`, normalise the name, return early if it is empty, then `stock.set(name, Number(qty.value))`. Delete with `stock.delete(name)`.',
      ],
      solution: {
        explanation: 'All reads go through the reactive Map\'s methods (`entries`, `values`), which Vue tracks as iteration; `set` and `delete` trigger those readers. Sorting happens on a fresh array built from the entries, so the Map itself is never reordered.',
        files: {
          'App.vue': `<script setup>
import { reactive, ref, computed } from 'vue'

const stock = reactive(new Map([['apples', 12], ['bread', 3]]))
const product = ref('')
const qty = ref(1)

const rows = computed(() =>
  [...stock.entries()].sort(([a], [b]) => a.localeCompare(b))
)
const total = computed(() => [...stock.values()].reduce((sum, n) => sum + n, 0))
const lowCount = computed(() => [...stock.values()].filter((n) => n < 5).length)

function setStock() {
  const name = product.value.trim().toLowerCase()
  if (!name) return
  stock.set(name, Number(qty.value))
  product.value = ''
}
</script>

<template>
  <input class="product" v-model="product" placeholder="Product" />
  <input class="qty" type="number" v-model.number="qty" />
  <button class="set-stock" @click="setStock">Set stock</button>
  <ul>
    <li v-for="[name, count] in rows" :key="name" class="row">
      <span class="label">{{ name }}: {{ count }}</span>
      <button class="remove" @click="stock.delete(name)">Remove</button>
    </li>
  </ul>
  <p class="total">Total items: {{ total }}</p>
  <p class="low">Low stock: {{ lowCount }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'shows the initial stock sorted, with totals',
          code: `expect(findAll('.label').map((el) => el.textContent.trim())).toEqual(['apples: 12', 'bread: 3'])
expect(text('.total')).toBe('Total items: 15')
expect(text('.low')).toBe('Low stock: 1')`,
        },
        {
          name: 'adds a new product in alphabetical position',
          code: `await type('.product', '  Cheese ')
await type('.qty', '2')
await click('.set-stock')
expect(findAll('.label').map((el) => el.textContent.trim())).toEqual(['apples: 12', 'bread: 3', 'cheese: 2'])
expect(text('.total')).toBe('Total items: 17')
expect(text('.low')).toBe('Low stock: 2')`,
        },
        {
          name: 'updates an existing product',
          code: `await type('.product', 'Bread')
await type('.qty', '10')
await click('.set-stock')
expect(findAll('.label').map((el) => el.textContent.trim())).toEqual(['apples: 12', 'bread: 10'])
expect(text('.total')).toBe('Total items: 22')
expect(text('.low')).toBe('Low stock: 0')`,
        },
        {
          name: 'removes a product',
          code: `await click(findAll('.remove')[0])
expect(findAll('.label').map((el) => el.textContent.trim())).toEqual(['bread: 3'])
expect(text('.total')).toBe('Total items: 3')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'arrays-objects-reactivity-review',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'You are reviewing this composable usage. Find every place reactivity is lost, and suggest a fix for each.',
      code: {
        lang: 'js',
        code: `const cart = reactive({ items: [], coupon: '' })
const { items, coupon } = cart                 // 1

const discount = useCouponDiscount(cart.coupon) // 2

const filtersCopy = { ...filters }             // 3
watch(filtersCopy, refetch)

function clearCart() {
  cart.items = []                              // 4 (combined with line 1)
}`,
      },
      answer: '(1) `coupon` is a frozen string copy; `items` is a reference to the current array, which goes stale once line 4 replaces `cart.items`. Use `toRefs(cart)` or dot access. (2) `cart.coupon` passes the current string; pass `() => cart.coupon` or `toRef(cart, \'coupon\')`. (3) `{ ...filters }` is a plain, non-reactive snapshot, so the watcher never fires (Vue warns about an invalid source); watch `filters` itself or a getter. (4) Replacing the array is fine on its own, but anything holding the old reference (like `items` from line 1) is now disconnected — clear in place with `cart.items.splice(0)` or stop holding aliases.',
      explanation: 'All four are the same root cause: a value was copied out of the proxy at one moment, so later changes can\'t reach it.',
      whyAsked: 'Code-review style questions reveal whether you can spot reactivity loss in realistic code, not just define it.',
      mistakes: ['Only spotting line 1.', 'Saying line 4 is wrong by itself (replacing a property is tracked — the problem is the stale alias).', 'Suggesting `nextTick()` as a fix.'],
      followUps: ['How would you design `useCouponDiscount` so callers can\'t make mistake 2?', 'When is a spread copy exactly what you want?'],
      modelAnswer: 'All four lose the link to the proxy. Line 1 copies `coupon` as a string and keeps a reference to the current `items` array that goes stale when line 4 assigns a new array — I would use `toRefs(cart)` or dot access. Line 2 passes the current coupon string, so the composable should accept a getter or ref and I would call it with `() => cart.coupon`. Line 3 watches a plain snapshot, which isn\'t a reactive source — watch `filters` directly. And I would clear the cart with `splice(0)` or drop the alias. The general rule: copies are snapshots; pass links — refs, getters, or the reactive object.',
    },
    {
      id: 'arrays-objects-reactivity-vue2-vs-vue3',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'What array and object change-detection caveats did Vue 2 have, and why don\'t they apply in Vue 3?',
      answer: 'Vue 2 converted each existing property into a getter/setter with `Object.defineProperty`. It therefore could not detect properties added or deleted later, `arr[i] = x`, or `arr.length = n`; you needed `Vue.set`, `Vue.delete` or `splice`. Vue 3 wraps objects in Proxies, which intercept every get, set, delete, `in` and key enumeration, so all of these are detected and `Vue.set` was removed. Vue 3 also supports reactive `Map` and `Set`.',
      explanation: 'defineProperty works per existing property; a Proxy works per object, for any key — including ones that don\'t exist yet.',
      whyAsked: 'Common in teams migrating from Vue 2, and a good check of whether you understand *why* the caveats existed.',
      mistakes: ['Saying Vue 3 "still needs Vue.set for arrays".', 'Not knowing destructuring loses reactivity in both versions.', 'Claiming Vue 2 could not detect `push` (array methods were patched).'],
      followUps: ['What does a Proxy cost compared to defineProperty?', 'What would you look for when migrating Vue 2 code that uses `Vue.set`?'],
      modelAnswer: 'Vue 2 made data reactive by redefining each existing property as a getter/setter with `Object.defineProperty`. That only works for properties that exist at conversion time, so adding or deleting properties, setting an array index or changing `length` went unnoticed — hence `Vue.set`, `Vue.delete` and `splice` workarounds. Array methods like `push` worked because Vue patched them. Vue 3 wraps the whole object in a Proxy, which intercepts any key, including new ones, plus deletes and key enumeration, so the caveats disappeared and `Vue.set` was removed. One thing didn\'t change: destructuring still copies values in both versions.',
    },
    {
      id: 'arrays-objects-reactivity-collections',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How do `Map` and `Set` work with Vue\'s reactivity, and what practical gotchas should you know?',
      answer: 'Pass them to `reactive()` (or put them in a `ref()`), and use their methods: `get`, `set`, `has`, `add`, `delete`, `clear`, `size` and iteration are all tracked. Gotchas: refs stored inside are not unwrapped; `JSON.stringify` turns them into `{}`, so convert to arrays before persisting or sending; object keys are compared by identity, so be consistent about proxies vs raw objects; and they render in `v-for` in insertion order.',
      explanation: 'Collections store data in internal slots rather than properties, so Vue instruments their methods instead of relying on property traps.',
      whyAsked: 'Maps and Sets are increasingly common in app state; this checks practical, not theoretical, knowledge.',
      mistakes: ['Thinking Map/Set need special Vue APIs.', 'Forgetting serialisation.', 'Using `map[key] = value` instead of `map.set()`.'],
      followUps: ['Why can\'t a plain Proxy `set` trap see `map.set()`?', 'When would you choose a Map over a plain object?'],
      modelAnswer: 'You make them reactive like any object — `reactive(new Map())` or `ref(new Set())` — and use their normal methods. Vue instruments `get`, `set`, `has`, `add`, `delete`, `clear`, `size` and iteration, because a Map\'s entries live in internal slots that ordinary property traps can\'t see. Things to watch: refs inside aren\'t unwrapped, `JSON.stringify` gives `{}` so I convert with `[...map]` before saving, and object keys rely on identity, so I keep keys consistent. I reach for a Map for keyed lookups with non-string keys or frequent adds and removes, and a Set for membership, like selected ids.',
    },
    {
      id: 'arrays-objects-reactivity-mutate-replace',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'In a Vue app, should list updates mutate arrays in place (`push`, `splice`) or replace them immutably (`list.value = [...]`)? What are the trade-offs?',
      answer: 'Both are tracked with deep reactivity. Mutation is concise and natural for local, deep state. Replacement is required for `shallowRef` state, triggers getter-based and shallow watchers (a new array identity), makes "what changed" explicit, and avoids accidentally mutating arrays shared with other components or caches. Costs of replacement: allocating new arrays, and losing identity-based assumptions. Pick per piece of state and be consistent; keep `:key`s stable either way.',
      explanation: 'The question is really about ownership and observability: who else holds this array, and how do watchers detect changes?',
      code: {
        lang: 'js',
        code: `// mutation: watcher on a getter does NOT fire (same array identity)
watch(() => state.items, onChange)          // shallow by default
state.items.push(item)

// replacement: new identity, the same watcher fires
state.items = [...state.items, item]

// with shallowRef, replacement is the only tracked change
const rows = shallowRef([])
rows.value = [...rows.value, row]`,
      },
      whyAsked: 'Senior candidates should reason about consistency, watchers and performance rather than having a dogmatic answer.',
      mistakes: ['Claiming mutation "isn\'t reactive" in Vue 3.', 'Ignoring shallow watchers and shallowRef.', 'Ignoring shared references between components or caches.'],
      followUps: ['How does Pinia handle this?', 'What happens to DOM state when you replace an array but keep the same keys?'],
      modelAnswer: 'With deep reactivity both work, so it\'s a design choice. In-place mutation is concise and fine for state one feature owns. Immutable replacement is mandatory with `shallowRef`, it fires shallow and getter-based watchers because the array identity changes, it makes changes explicit, and it protects arrays shared with other components or caches. Its cost is allocation and losing identity. I pick one style per piece of state — often replacement for server data and shallow state, mutation for local UI lists — and always keep keys stable so Vue reuses the right DOM nodes.',
    },
    {
      id: 'arrays-objects-reactivity-props-destructure',
      difficulty: 'advanced',
      type: 'output',
      minutes: 4,
      question: 'This is a Vue 3.5 `<script setup>` child component. The parent changes `count` from 1 to 2. What happens?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { computed, watch } from 'vue'

const { count = 0 } = defineProps(['count'])

const doubled = computed(() => count * 2)
watch(() => count, (n) => console.log('count is', n))
</script>

<template>
  <p>{{ count }} × 2 = {{ doubled }}</p>
</template>`,
      },
      options: [
        'The paragraph shows "2 × 2 = 4" and "count is 2" is logged',
        'Nothing updates: destructured props are never reactive',
        'The paragraph shows "2 × 2 = 2" because the computed captured the old value',
        'It throws: props cannot be destructured',
      ],
      correctOption: 0,
      answer: 'In Vue 3.5+, the compiler rewrites every use of the destructured `count` inside `<script setup>` to `props.count`, so the computed and the getter-based watcher read the prop reactively: the paragraph shows "2 × 2 = 4" and "count is 2" is logged. Before 3.5 (without an experimental opt-in) the destructured value would have been a one-time copy.',
      explanation: 'Reactive props destructure is a compile-time transform. It keeps reactivity inside `<script setup>`; passing `count` itself to a function (e.g. `watch(count, …)`) still passes a plain value, which is why the watcher uses a getter.',
      whyAsked: 'A version-sensitive detail that shows whether you keep up with Vue changes and understand compile-time vs runtime reactivity.',
      mistakes: ['Applying the old rule ("destructuring props always breaks") to Vue 3.5.', 'Using `watch(count, …)` directly.', 'Thinking the default value `= 0` breaks reactivity.'],
      followUps: ['What about `setup(props)` in a non-`<script setup>` component?', 'How would you pass `count` into a composable?'],
      modelAnswer: 'It updates: the paragraph shows "2 × 2 = 4" and "count is 2" is logged. Since Vue 3.5, destructuring `defineProps()` in `<script setup>` is reactive because the compiler turns each `count` reference into `props.count`. The getter in `watch(() => count, …)` is needed because passing `count` directly would pass a value — the compiler flags that case. In a classic `setup(props)` function, destructuring props still breaks reactivity, so there I would use `toRefs(props)`.',
    },
    {
      id: 'arrays-objects-reactivity-coding-reorder',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Implement move-up / move-down for a song structure. Each `<li class="item">` has a `<span class="name">`, an `<button class="up">` and a `<button class="down">`. Moving the first item up or the last item down does nothing.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const parts = ref(['Intro', 'Verse', 'Chorus', 'Outro'])

function moveUp(index) {
  // TODO
}

function moveDown(index) {
  // TODO
}
</script>

<template>
  <ol>
    <li v-for="(part, index) in parts" :key="part" class="item">
      <span class="name">{{ part }}</span>
      <button class="up" @click="moveUp(index)">↑</button>
      <button class="down" @click="moveDown(index)">↓</button>
    </li>
  </ol>
</template>`,
        },
      },
      tests: [
        {
          name: 'moving Chorus up swaps it with Verse',
          code: `await click(findAll('.up')[2])
expect(findAll('.name').map((el) => el.textContent.trim())).toEqual(['Intro', 'Chorus', 'Verse', 'Outro'])`,
        },
        {
          name: 'moving Intro down swaps it with Verse',
          code: `await click(findAll('.down')[0])
expect(findAll('.name').map((el) => el.textContent.trim())).toEqual(['Verse', 'Intro', 'Chorus', 'Outro'])`,
        },
        {
          name: 'edges do nothing',
          code: `await click(findAll('.up')[0])
await click(findAll('.down')[3])
expect(findAll('.name').map((el) => el.textContent.trim())).toEqual(['Intro', 'Verse', 'Chorus', 'Outro'])`,
        },
      ],
      hints: [
        'Moving up = swapping with the item at `index - 1`; moving down = swapping with `index + 1`.',
        'Guard the edges: do nothing if the target index is below 0 or past the end.',
        'Index assignment is tracked in Vue 3: `[list[i], list[j]] = [list[j], list[i]]` (or use `splice`).',
      ],
      answer: 'Swap the two positions with index assignment (tracked in Vue 3), guarding the list edges.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const parts = ref(['Intro', 'Verse', 'Chorus', 'Outro'])

function swap(i, j) {
  const list = parts.value
  if (j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j], list[i]]
}

function moveUp(index) {
  swap(index, index - 1)
}

function moveDown(index) {
  swap(index, index + 1)
}
</script>

<template>
  <ol>
    <li v-for="(part, index) in parts" :key="part" class="item">
      <span class="name">{{ part }}</span>
      <button class="up" @click="moveUp(index)">↑</button>
      <button class="down" @click="moveDown(index)">↓</button>
    </li>
  </ol>
</template>`,
        },
      },
      explanation: 'Both index writes go through the reactive array\'s proxy, so Vue re-renders the list. Because the items are keyed by their (unique) names, Vue moves the existing `<li>` elements instead of re-creating them.',
      whyAsked: 'Reordering is a common UI task; it checks that you know index writes are reactive in Vue 3 and that you handle edges and keys.',
      mistakes: ['Using the index as `:key` (DOM state would stick to positions).', 'Forgetting the edge guards (creating `undefined` entries).', 'Believing index assignment needs `Vue.set`.'],
      followUps: ['How would you implement drag-and-drop reordering on top of this?', 'What changes if the list is a `shallowRef`?'],
      modelAnswer: 'I swap the item with its neighbour using index assignment, which Vue 3 tracks, and return early if the neighbour index is out of range. Keys are the unique part names, so Vue moves the existing list items. With a `shallowRef` I would build a new array and assign it to `.value` instead.',
    },
  ],

  takeaways: [
    'In Vue 3, every change made through reactive state is tracked: index writes, `length`, mutation methods, new and deleted keys, and Map/Set methods.',
    'Destructuring, spreading and passing a property\'s value make copies: primitives freeze, objects go stale when replaced.',
    'Keep links with `toRefs()`/`toRef()`, dot access or getters (`() => state.x`).',
    'Never sort or reverse a source inside `computed()` — work on a copy (`[...list]` or `toSorted()`).',
    'Refs inside reactive arrays, Maps and Sets are not unwrapped; Maps and Sets need converting before `JSON.stringify`.',
    'Vue 3.5 props destructure keeps `<script setup>` props reactive — but pass them onward as getters.',
  ],
}
