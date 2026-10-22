// Lesson: Composition API vs Options API

const snacksJs = `// Shared data for both versions of the component.
export const snacks = [
  { id: 1, name: 'Chocolate cookie', inStock: true },
  { id: 2, name: 'Cheese crackers', inStock: false },
  { id: 3, name: 'Mango smoothie', inStock: true },
  { id: 4, name: 'Salted popcorn', inStock: true },
  { id: 5, name: 'Chilli chips', inStock: false },
  { id: 6, name: 'Banana bread', inStock: true },
]`

const optionsSearch = `<script>
import { snacks } from './snacks.js'

export default {
  data() {
    return {
      query: '',      // search feature
      searches: 0,    // search feature
      likes: 0,       // likes feature
      snacks,
    }
  },
  computed: {
    results() {       // search feature
      const q = this.query.trim().toLowerCase()
      return this.snacks.filter((s) => s.name.toLowerCase().includes(q))
    },
  },
  watch: {
    query() {         // search feature
      this.searches++
    },
  },
  methods: {
    like() {          // likes feature
      this.likes++
    },
  },
  mounted() {
    console.log('[options] mounted with', this.snacks.length, 'snacks')
  },
}
</script>

<template>
  <input v-model="query" class="search" placeholder="Search snacks…" />
  <p class="count">{{ results.length }} of {{ snacks.length }} · {{ searches }} searches</p>
  <ul>
    <li v-for="snack in results" :key="snack.id">
      {{ snack.name }} <small v-if="!snack.inStock">(sold out)</small>
    </li>
  </ul>
  <button class="like" @click="like">♥ {{ likes }}</button>
</template>`

const compositionSearch = `<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { snacks } from './snacks.js'

// ── Feature 1: search ─────────────────────────
const query = ref('')
const searches = ref(0)

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return snacks.filter((s) => s.name.toLowerCase().includes(q))
})

watch(query, () => {
  searches.value++
})

// ── Feature 2: likes ──────────────────────────
const likes = ref(0)

function like() {
  likes.value++
}

onMounted(() => {
  console.log('[composition] mounted with', snacks.length, 'snacks')
})
</script>

<template>
  <input v-model="query" class="search" placeholder="Search snacks…" />
  <p class="count">{{ results.length }} of {{ snacks.length }} · {{ searches }} searches</p>
  <ul>
    <li v-for="snack in results" :key="snack.id">
      {{ snack.name }} <small v-if="!snack.inStock">(sold out)</small>
    </li>
  </ul>
  <button class="like" @click="like">♥ {{ likes }}</button>
</template>`

const appVue = `<script setup>
import OptionsSearch from './OptionsSearch.vue'
import CompositionSearch from './CompositionSearch.vue'
</script>

<template>
  <div class="grid">
    <section class="panel options">
      <h3>Options API</h3>
      <OptionsSearch />
    </section>
    <section class="panel composition">
      <h3>Composition API</h3>
      <CompositionSearch />
    </section>
  </div>
</template>

<style>
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
.panel { border: 2px solid #222; border-radius: 10px; padding: 10px 12px; }
.panel h3 { margin: 0 0 8px; }
.panel ul { padding-left: 18px; }
</style>`

// Variant: the search feature extracted into a composable and reused.
const useSnackSearch = `import { ref, computed, watch } from 'vue'

// Everything the search feature needs, in one reusable function.
export function useSnackSearch(list) {
  const query = ref('')
  const searches = ref(0)

  const results = computed(() => {
    const q = query.value.trim().toLowerCase()
    return list.filter((s) => s.name.toLowerCase().includes(q))
  })

  watch(query, () => {
    searches.value++
  })

  return { query, searches, results }
}`

const compositionWithComposable = `<script setup>
import { ref } from 'vue'
import { snacks } from './snacks.js'
import { useSnackSearch } from './useSnackSearch.js'

// Feature 1: search — now a single line.
const { query, searches, results } = useSnackSearch(snacks)

// Feature 2: likes
const likes = ref(0)
function like() {
  likes.value++
}
</script>

<template>
  <input v-model="query" class="search" placeholder="Search snacks…" />
  <p class="count">{{ results.length }} of {{ snacks.length }} · {{ searches }} searches</p>
  <ul>
    <li v-for="snack in results" :key="snack.id">
      {{ snack.name }} <small v-if="!snack.inStock">(sold out)</small>
    </li>
  </ul>
  <button class="like" @click="like">♥ {{ likes }}</button>
</template>`

const optionsWithClear = optionsSearch
  .replace(
    `    like() {          // likes feature
      this.likes++
    },`,
    `    like() {          // likes feature
      this.likes++
    },
    clear() {         // search feature (again, in another bucket)
      this.query = ''
    },`,
  )
  .replace(
    `<p class="count">`,
    `<button class="clear" @click="clear">Clear</button>
  <p class="count">`,
  )

const compositionWithClear = compositionSearch
  .replace(
    `watch(query, () => {
  searches.value++
})`,
    `watch(query, () => {
  searches.value++
})

function clear() {
  query.value = ''
}`,
  )
  .replace(
    `<p class="count">`,
    `<button class="clear" @click="clear">Clear</button>
  <p class="count">`,
  )

export default {
  id: 'composition-vs-options',
  title: 'Composition API vs Options API',
  summary: 'Two official ways to write the same component — one sorts code into option buckets, the other groups it by feature with plain functions.',
  difficulty: 'intermediate',
  minutes: 28,
  prerequisites: ['first-component', 'ref', 'computed', 'watch', 'lifecycle-hooks'],
  related: ['setup-and-script-setup', 'options-api', 'composables-intro', 'composable-design', 'legacy-migration'],
  tags: ['composition api', 'options api', 'script setup', 'setup', 'code organization', 'logic reuse', 'api style'],
  apis: [
    { name: 'Options API', summary: 'Describe a component with an options object: `data`, `computed`, `methods`, `watch`, lifecycle hooks, accessed through `this`.' },
    { name: 'Composition API', summary: 'Build component logic with imported functions — `ref`, `computed`, `watch`, `onMounted` — inside `setup()` or `<script setup>`.' },
    { name: 'setup()', summary: 'Component option that runs before `beforeCreate`; the entry point for Composition API code inside an options object.' },
  ],
  docs: [
    { label: 'Vue Guide — API Styles', url: 'https://vuejs.org/guide/introduction.html#api-styles' },
    { label: 'Vue Guide — Composition API FAQ', url: 'https://vuejs.org/guide/extras/composition-api-faq.html' },
    { label: 'API — Composition API: setup()', url: 'https://vuejs.org/api/composition-api-setup.html' },
  ],

  intro: `
Vue gives you **two official styles** for writing a component's logic. Both produce exactly the same kind of component, use the same templates and the same reactivity system underneath. What differs is *how you arrange the code*.

- The **Options API** describes a component as an object with fixed slots ("options"): \`data\` for state, \`computed\` for derived values, \`methods\` for functions, \`watch\` for reactions, \`mounted\` and friends for lifecycle. Inside them you reach everything through \`this\`.
- The **Composition API** builds the same component from **imported functions** — \`ref()\`, \`computed()\`, \`watch()\`, \`onMounted()\` — called inside \`setup()\` or, more commonly, \`<script setup>\`. There is no \`this\`; state lives in ordinary variables.

This lesson puts the two side by side so you can read either one, understand *why* the Composition API was added, and choose sensibly.
`,

  why: `
The Options API is friendly: every piece of code has an obvious home. The trouble starts when a component grows several **features** (a *feature*, or "logical concern", is one thing the component does — searching, paginating, tracking likes).

In the Options API, one feature gets **split across buckets**: its state in \`data\`, its derived value in \`computed\`, its reaction in \`watch\`, its handler in \`methods\`, its setup in \`mounted\`. In a 600-line component you scroll up and down to follow one idea, and two features are interleaved in every bucket.

Reusing a feature in another component was also awkward. Vue 2's main tool, **mixins**, merges hidden options into your component, so it's unclear where \`this.something\` came from and names can clash (you'll see why in [the Options API lesson](lesson:options-api)).

The Composition API exists to fix those two problems:

1. **Organise by feature.** All the code for "search" can sit together — and be moved out into a function.
2. **Reuse logic as plain functions** called [composables](lesson:composables-intro): \`const { query, results } = useSearch(list)\`. You can see exactly what comes in and what comes out.

It also works better with TypeScript, because it's mostly plain variables and functions, which type inference handles naturally.
`,

  eli15: `
Imagine tidying a bedroom.

**Options API = sorting by type of thing.** All shirts in one drawer, all cables in a box, all papers on a shelf. Easy to explain to anyone. But your *football kit* is now in three places: shirt in the drawer, boots in the shoe rack, shin pads in the box. Packing for a match means visiting every spot.

**Composition API = sorting by activity.** One bag for football (shirt, boots, shin pads), one bag for coding (laptop, charger, notebook). Packing for a match is "grab the football bag". And when your friend wants to play too, you can hand them a copy of the same bag.

Both rooms hold the same stuff. The Composition API just keeps the things you use *together* close together — and makes them easy to share.
`,

  analogy: {
    title: 'A toolbox sorted by tool vs a kit sorted by job',
    body: `
A workshop can store tools in drawers by type — all screwdrivers here, all wrenches there. That's the Options API: \`data\`, \`computed\`, \`methods\` are the drawers. Any tool is easy to find, but fixing a bike means opening five drawers.

The same workshop can also keep **job kits**: a "fix a puncture" kit with exactly the tyre levers, patches and pump you need. That's the Composition API. Each kit is self-contained, and you can make another copy for a second bike — that copy is a *composable*.
`,
    mapping: [
      ['drawers sorted by tool type', 'Options API buckets: `data`, `computed`, `watch`, `methods`, hooks'],
      ['a job kit with everything for one task', 'a feature block in `<script setup>`'],
      ['copying a kit for another bike', 'extracting a composable like `useSnackSearch()` and reusing it'],
      ['the tools themselves', 'the same reactivity system (`reactive`, `computed`, effects) in both styles'],
    ],
  },

  visual: {
    type: 'comparison',
    props: {
      left: {
        label: 'Options API',
        lang: 'js',
        code: `export default {
  data() {
    return { query: '', likes: 0 }
  },
  computed: {
    results() {
      return list.filter((s) => s.name.includes(this.query))
    },
  },
  watch: {
    query() { console.log('searching…') },
  },
  methods: {
    like() { this.likes++ },
  },
}`,
      },
      right: {
        label: 'Composition API (<script setup>)',
        lang: 'js',
        code: `import { ref, computed, watch } from 'vue'

// search
const query = ref('')
const results = computed(() =>
  list.filter((s) => s.name.includes(query.value)))
watch(query, () => console.log('searching…'))

// likes
const likes = ref(0)
function like() { likes.value++ }`,
      },
      points: [
        'Same component, same behaviour, same template.',
        'Options API: code is grouped by **option type**; you read and write state through `this`.',
        'Composition API: code is grouped by **feature**; state lives in variables and refs need `.value` in JavaScript.',
        'The Composition API version can move the search block into a reusable `useSearch()` function unchanged.',
      ],
    },
    title: 'One component, two styles',
    caption: 'Read both columns line by line: every Options API bucket has a Composition API function that does the same job.',
    alt: 'Two code panels side by side. Left, an Options API component with data, computed, watch and methods sections. Right, the same component in script setup using ref, computed and watch, with comments grouping the code into a search block and a likes block. Bullet points underneath list the differences.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Where does the "search" feature live?',
    caption: 'Step through: in the Options API one feature is spread over several buckets; in the Composition API it becomes one block, then one reusable function.',
    alt: 'A diagram with four Options API buckets on the left (data, computed, watch, methods), two feature blocks in the middle (search block, likes block) and on the right a useSnackSearch composable that is reused by another component. Steps highlight how the search feature moves from four buckets into one block and then into a composable.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'data', label: 'data()', note: 'query · searches · likes', tone: 'kraft', x: 110, y: 45 },
        { id: 'computed', label: 'computed', note: 'results', tone: 'kraft', x: 110, y: 120 },
        { id: 'watch', label: 'watch', note: 'query → searches++', tone: 'kraft', x: 110, y: 195 },
        { id: 'methods', label: 'methods', note: 'like()', tone: 'kraft', x: 110, y: 270 },
        { id: 'search', label: 'search block', note: 'query · results · watch', tone: 'cobalt', x: 400, y: 95 },
        { id: 'likes', label: 'likes block', note: 'likes · like()', tone: 'cobalt', x: 400, y: 235 },
        { id: 'composable', label: 'useSnackSearch()', note: 'a reusable function', tone: 'acid', x: 650, y: 95 },
        { id: 'other', label: 'another component', note: 'calls useSnackSearch()', tone: 'paper', x: 650, y: 235 },
      ],
      edges: [
        { from: 'data', to: 'search', label: 'query', dashed: true },
        { from: 'computed', to: 'search', dashed: true },
        { from: 'watch', to: 'search', dashed: true },
        { from: 'methods', to: 'likes', dashed: true },
        { from: 'search', to: 'composable', label: 'extract' },
        { from: 'composable', to: 'other', label: 'reuse' },
      ],
      steps: [
        { focus: ['data', 'computed', 'watch', 'methods'], text: 'In the **Options API** you write code into fixed buckets. Each bucket mixes pieces of *different* features: `data()` holds both the search query and the like counter.' },
        { focus: ['data', 'computed', 'watch'], text: 'Follow just the **search** feature: its state is in `data`, its filtered list in `computed`, its reaction in `watch`. One idea, three places.' },
        { focus: ['search'], edges: ['data->search', 'computed->search', 'watch->search'], text: 'In the **Composition API** those pieces can sit together: `ref`, `computed` and `watch` for search, written one after another.' },
        { focus: ['likes'], edges: ['methods->likes'], text: 'The likes feature gets its own block too. Reading the component now means reading one feature at a time.' },
        { focus: ['composable'], edges: ['search->composable'], text: 'Because the search block is just function calls, you can cut it out into a function — a **composable** — without changing how it works.' },
        { focus: ['other', 'composable'], edges: ['composable->other'], text: 'Any other component can call `useSnackSearch()` and get its *own* fresh search state. That is the reuse story the Options API never had a clean answer for.' },
      ],
    },
  },

  syntax: [
    `
#### Options API: an object of options

You export an object. Vue reads each option and wires it up. Everything is reached through \`this\` — the component instance.
`,
    {
      code: `<script>
export default {
  props: ['initial'],
  data() {
    return { count: this.initial ?? 0 }        // state (must be a function)
  },
  computed: {
    double() { return this.count * 2 },          // derived state
  },
  watch: {
    count(next, prev) { console.log(prev, '→', next) },
  },
  methods: {
    increment() { this.count++ },                // functions
  },
  mounted() {
    console.log('in the DOM')                    // lifecycle hook
  },
}
</script>`,
      lang: 'vue',
      title: 'Options API',
    },
    `
#### Composition API: functions inside \`<script setup>\`

You import what you need and call it. Top-level variables and functions are available in the template automatically.
`,
    {
      code: `<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps(['initial'])

const count = ref(props.initial ?? 0)            // state
const double = computed(() => count.value * 2)   // derived state
watch(count, (next, prev) => console.log(prev, '→', next))
function increment() { count.value++ }           // functions
onMounted(() => console.log('in the DOM'))       // lifecycle hook
</script>`,
      lang: 'vue',
      title: 'Composition API',
    },
    `
#### The translation table

| Options API | Composition API |
|---|---|
| \`data() { return { n: 0 } }\` | \`const n = ref(0)\` (or \`reactive({...})\`) |
| \`computed: { d() {...} }\` | \`const d = computed(() => ...)\` |
| \`watch: { n(v) {...} }\` | \`watch(n, (v) => ...)\` |
| \`methods: { inc() {...} }\` | \`function inc() {...}\` |
| \`mounted() {...}\` | \`onMounted(() => {...})\` |
| \`this.n\` | \`n.value\` (in JS) / \`n\` (in template) |
| \`props: [...]\` / \`emits: [...]\` | \`defineProps()\` / \`defineEmits()\` |
| mixins | composables (\`useX()\` functions) |

**The rules:**

1. Pick **one style per component**. Mixing is possible but makes code harder to read.
2. In the Composition API, refs need \`.value\` in JavaScript and are unwrapped in templates (see [ref()](lesson:ref)).
3. There is no \`this\` in Composition API code — inside \`setup()\` it's \`undefined\`, and \`<script setup>\` code doesn't need it.
4. Composition functions like \`onMounted()\` and \`watch()\` must be called **synchronously during setup**, so Vue knows which component they belong to.
`,
    {
      callout: 'version',
      title: 'Both are official',
      text: 'Vue 3 fully supports both styles and the Options API is **not deprecated**. The Composition API was introduced with Vue 3 and back-ported to Vue 2.7. `<script setup>` requires a build step with Single-File Components (Vue 3.2+).',
    },
    {
      callout: 'note',
      title: 'Using both in one component',
      text: 'An options object may include a `setup()` function. Whatever `setup()` returns becomes available on `this` and in the template, so a legacy Options API component can call a composable. The reverse does not work: `setup()` runs before `data`, `computed` and `methods` exist, and has no `this`.',
    },
  ],

  walkthrough: {
    title: 'CompositionSearch.vue',
    lang: 'vue',
    code: compositionSearch,
    intro: 'The Composition API half of the playground. Notice how each feature reads top to bottom in one place.',
    steps: [
      { lines: [2, 3], text: 'Instead of option keys, you **import functions** from `vue`. You only pay attention to (and bundle) what you use.' },
      { lines: [5, 7], text: 'The search feature starts here. `query` and `searches` are refs — the Composition API equivalent of two `data()` properties.' },
      { lines: [9, 12], text: '`computed()` replaces the `computed: { results() {} }` option. It reads `query.value` — no `this` anywhere.' },
      { lines: [14, 16], text: '`watch(query, …)` replaces the `watch: { query() {} }` option. It sits right next to the state it watches.' },
      { lines: [18, 23], text: 'The likes feature is its own little block: one ref, one function. In the Options API these two lines were split between `data` and `methods`.' },
      { lines: [25, 27], text: '`onMounted()` registers the same lifecycle hook as the `mounted()` option. You may call it several times — each feature can register its own.' },
      { lines: [30, 39], text: 'The template is **identical** to the Options API version. Top-level bindings of `<script setup>` are available in the template, and refs are unwrapped.' },
    ],
  },

  playground: {
    title: 'The same snack search, twice',
    objective: 'Change both versions in the same way and notice how many places you touch in each style.',
    files: {
      'App.vue': appVue,
      'OptionsSearch.vue': optionsSearch,
      'CompositionSearch.vue': compositionSearch,
      'snacks.js': snacksJs,
    },
    entry: 'App.vue',
    expected: 'Two panels that behave identically: type in either search box to filter the snack list; the counter of searches goes up on every change; ♥ counts likes. The console shows one "mounted" line from each component.',
    experiments: [
      {
        id: 'clear-composition',
        task: 'In **CompositionSearch.vue**, add a `<button class="clear">Clear</button>` that empties the search box. Keep the new code inside the search block.',
        hint: 'Add `function clear() { query.value = \'\' }` right under the `watch(...)`, then `<button class="clear" @click="clear">Clear</button>` in the template.',
        tests: [
          {
            name: 'Clear empties the Composition API search',
            code: `await type('.composition .search', 'ch')
expect(findAll('.composition li')).toHaveLength(3)
const btn = find('.composition .clear')
expect(btn).toBeTruthy()
await click(btn)
expect(find('.composition .search').value).toBe('')
expect(findAll('.composition li')).toHaveLength(6)`,
          },
        ],
        explain: 'Everything about searching — the ref, the computed, the watcher and now `clear()` — lives in one block. Adding to a feature means adding to one place.',
      },
      {
        id: 'clear-options',
        task: 'Now add the same `<button class="clear">` to **OptionsSearch.vue**. Count how many buckets you visit.',
        hint: 'You need a `clear()` entry inside `methods` that sets `this.query = \'\'`, plus the button in the template.',
        tests: [
          {
            name: 'Clear empties the Options API search',
            code: `await type('.options .search', 'ch')
expect(findAll('.options li')).toHaveLength(3)
const btn = find('.options .clear')
expect(btn).toBeTruthy()
await click(btn)
expect(find('.options .search').value).toBe('')
expect(findAll('.options li')).toHaveLength(6)`,
          },
        ],
        explain: 'It works just as well — but `clear()` landed in `methods`, far from `query` in `data` and `results` in `computed`. In small components that is fine; in big ones the search feature ends up scattered.',
      },
      {
        id: 'in-stock',
        task: 'Add a brand-new feature to **CompositionSearch.vue**: a checkbox `<input type="checkbox" class="in-stock">` that, when ticked, hides sold-out snacks. Write all of its code as one new block.',
        hint: 'Create `const onlyInStock = ref(false)`, bind it with `v-model="onlyInStock"` on the checkbox, and make `results` also filter with `(!onlyInStock.value || s.inStock)`.',
        tests: [
          {
            name: 'ticking the checkbox hides sold-out snacks',
            code: `expect(exists('.composition .in-stock')).toBe(true)
await check('.composition .in-stock', true)
expect(findAll('.composition li')).toHaveLength(4)
await type('.composition .search', 'ch')
expect(findAll('.composition li')).toHaveLength(1)
await check('.composition .in-stock', false)
expect(findAll('.composition li')).toHaveLength(3)`,
          },
        ],
        explain: 'A feature = a few refs, a computed and maybe a watcher. In the Composition API they stay together, which is exactly what makes them easy to extract into a composable later.',
      },
      {
        id: 'composable-variant',
        task: 'Switch to the **Search extracted into a composable** version. Compare `CompositionSearch.vue` with `useSnackSearch.js`. What did the component keep, and what moved out?',
        hint: 'The component keeps only the likes feature and one line: `const { query, searches, results } = useSnackSearch(snacks)`.',
        explain: 'The search block moved into `useSnackSearch.js` almost unchanged. Each component that calls it gets its own fresh refs. You will build composables properly in [Composables: reusable stateful logic](lesson:composables-intro).',
      },
    ],
    variants: [
      {
        id: 'with-clear',
        label: 'Both versions with a Clear button',
        files: {
          'App.vue': appVue,
          'OptionsSearch.vue': optionsWithClear,
          'CompositionSearch.vue': compositionWithClear,
          'snacks.js': snacksJs,
        },
      },
      {
        id: 'composable',
        label: 'Search extracted into a composable',
        files: {
          'App.vue': appVue,
          'OptionsSearch.vue': optionsSearch,
          'CompositionSearch.vue': compositionWithComposable,
          'useSnackSearch.js': useSnackSearch,
          'snacks.js': snacksJs,
        },
      },
    ],
  },

  internals: {
    beginner: `
Whichever style you write, Vue ends up with the same thing: a **component instance** holding reactive state, plus a **render function** (your template compiled into JavaScript) that reads that state. The Options API is a *description* Vue reads and turns into reactive state for you. The Composition API lets you create that reactive state yourself with function calls. Same engine, different steering wheel.
`,
    technical: [
      `
**The Options API runs on the same reactivity core.** When Vue sets up an options component it, roughly:

- calls your \`data()\` function and passes the result to \`reactive()\`;
- wraps each \`computed\` option in a \`computed()\` ref;
- turns each \`watch\` entry into a watcher using the same machinery as \`watch()\`;
- registers \`mounted\`, \`updated\`, … exactly like \`onMounted()\` and friends would.

The Vue docs put it this way: the Options API is implemented on top of the Composition API.

**\`this\` is a proxy.** In the Options API, \`this\` is the component's *public instance proxy*. Reading \`this.query\` makes the proxy look the key up in a fixed order: setup bindings, then \`data\`, then props, then methods/computed and other context. That's why a key returned from \`setup()\` wins over a \`data\` key with the same name — and why you should never use the same name twice.
`,
      {
        code: `// Simplified mental model of applying options — not Vue's real source
function applyOptions(instance, options) {
  instance.data = reactive(options.data.call(instance.proxy))
  for (const key in options.computed) {
    instance.ctx[key] = computed(() => options.computed[key].call(instance.proxy))
  }
  for (const key in options.watch) {
    watch(() => instance.proxy[key], options.watch[key].bind(instance.proxy))
  }
  if (options.mounted) onMounted(options.mounted.bind(instance.proxy))
}`,
        lang: 'js',
        title: 'mental model: options → reactivity calls',
      },
      `
**Order of execution.** For a component that has both, \`setup()\` runs **first** — before \`beforeCreate\`, \`data()\` or any method exists. That's why \`setup()\` can't use \`this\`, while options can use what \`setup()\` returned.

**Why \`<script setup>\` can be smaller.** With \`<script setup>\`, the compiler can place the render function in the same scope as your variables (in production builds), so the template reads \`query\` directly instead of going through \`this.query\`. Local variable names can be shortened by a minifier; property names on \`this\` cannot. The Vue docs list this as one reason Composition API code minifies better.
`,
    ],
    production: `
- **Choosing for a team.** The Vue docs suggest the Options API when you use Vue without build tools or for low-complexity scenarios, and the Composition API with SFCs for full applications. Consistency inside a codebase matters more than the choice itself.
- **Don't rewrite working code for style.** Migrating a stable Options API component costs time and risks regressions. Migrate when you're already changing a component substantially, or when you need to share its logic (see [Refactoring & migrating legacy Vue code](lesson:legacy-migration)).
- **Gradual migration** works: new components in \`<script setup>\`, old ones untouched, and legacy components can call new composables through a \`setup()\` option.
- **TypeScript.** Composition API code is mostly plain variables and functions, so type inference "just works"; the Options API relies on more complex type gymnastics around \`this\`.
- **Bundle flag.** If *no* code in your app — including dependencies — uses the Options API, bundlers let you set the compile-time flag \`__VUE_OPTIONS_API__\` to \`false\` to drop Options API support code. Check your libraries first; many UI libraries still use options internally.
- **Discipline.** The Composition API gives you freedom, which also means freedom to write a 500-line unorganised \`<script setup>\`. Keep features grouped, and extract composables when a block grows or repeats.
`,
  },

  mistakes: [
    {
      title: 'Believing the Options API is deprecated',
      explanation: 'It isn\'t. Vue 3 supports both styles as first-class, and the Vue team has said there are no plans to deprecate the Options API. You will meet it in many existing codebases and libraries — learn to read it fluently (see [the Options API lesson](lesson:options-api)).',
    },
    {
      title: 'Using `this` inside `setup()`',
      wrong: {
        code: `export default {
  data() { return { count: 0 } },
  setup() {
    function increment() {
      this.count++   // 💥 this is undefined in setup()
    }
    return { increment }
  },
}`,
        lang: 'js',
      },
      right: {
        code: `import { ref } from 'vue'

export default {
  setup() {
    const count = ref(0)
    function increment() {
      count.value++
    }
    return { count, increment }
  },
}`,
        lang: 'js',
      },
      explanation: '`setup()` runs before the instance\'s `data`, `computed` and `methods` are set up, and `this` is `undefined` there. Keep state that `setup()` needs inside `setup()`.',
    },
    {
      title: 'Writing Composition API code but still sorting it by type',
      wrong: {
        code: `// all refs…
const query = ref('')
const likes = ref(0)
const page = ref(1)
// …then all computeds…
const results = computed(() => /* search */ [])
const pageCount = computed(() => /* paging */ 1)
// …then all functions
function like() { likes.value++ }
function nextPage() { page.value++ }`,
        lang: 'js',
      },
      right: {
        code: `// search
const query = ref('')
const results = computed(() => /* search */ [])

// likes
const likes = ref(0)
function like() { likes.value++ }

// paging
const page = ref(1)
const pageCount = computed(() => /* paging */ 1)
function nextPage() { page.value++ }`,
        lang: 'js',
      },
      explanation: 'Re-creating the Options API buckets inside `<script setup>` gives you the downsides of both. Group code by feature so each block can be read — and extracted — on its own.',
    },
    {
      title: 'Forgetting `.value` when translating `this.x`',
      wrong: { code: `// Options: this.query = ''\nfunction clear() {\n  query = ''          // TypeError: assignment to constant\n}`, lang: 'js' },
      right: { code: `function clear() {\n  query.value = ''\n}`, lang: 'js' },
      explanation: '`this.query` read the value directly. In the Composition API, `query` is a ref (the box), so you read and write `query.value` in JavaScript. Templates still use just `query`.',
    },
  ],

  debugging: [
    {
      symptom: '`Cannot read properties of undefined` when touching `this` inside `setup()`.',
      cause: '`setup()` has no `this`; it runs before the component instance exposes data and methods.',
      fix: 'Create state with `ref()`/`reactive()` inside `setup()` and use the variables directly.',
    },
    {
      symptom: 'A converted component renders once but never updates.',
      cause: 'A `data()` property became a plain `let` variable during conversion, or `.value` was dropped when assigning.',
      fix: 'Every piece of state that the template shows must be a `ref()` or `reactive()`; assign through `.value`.',
    },
    {
      symptom: 'Template warns "Property X was accessed during render but is not defined" in a component using a `setup()` function.',
      cause: 'With a `setup()` function (not `<script setup>`), only what you **return** is exposed to the template.',
      fix: 'Return the binding from `setup()`, or switch to `<script setup>`, where all top-level bindings are exposed automatically.',
    },
    {
      symptom: 'The template shows a different value than `data()` should provide.',
      cause: 'A `setup()` binding with the same name shadows the `data` property — setup bindings are looked up first.',
      fix: 'Use unique names, and avoid splitting one component\'s state between `data()` and `setup()`.',
    },
  ],

  bestPractices: [
    'Use `<script setup>` + Composition API for new components in build-tool projects; keep each component in a single style.',
    'Group Composition API code by feature, with a short comment heading per block.',
    'When a feature block grows or appears in two components, extract it into a composable.',
    'Leave stable Options API components alone unless you are changing them anyway; migrate gradually.',
    'Let legacy Options components use new composables via a `setup()` option instead of rewriting them.',
    'Agree on one style per codebase and enforce it with linting (e.g. eslint-plugin-vue rules) so reviews stay simple.',
  ],

  useCases: [
    'Reading and maintaining Vue 2 / early Vue 3 codebases written with options.',
    'New feature-rich components (dashboards, editors, checkouts) where logic grouping by feature pays off.',
    'Sharing behaviour across components: search, pagination, form state, media queries — as composables.',
    'TypeScript projects that benefit from straightforward type inference.',
    'Progressive enhancement without a build step (CDN + Options API object), where `<script setup>` is not available.',
  ],

  whenToUse: {
    use: [
      'Composition API: full applications with SFCs and a build step, components with several features, logic you want to reuse or test separately, TypeScript.',
      'Options API: an existing codebase that already uses it consistently, quick no-build pages, or teams that strongly prefer its fixed structure.',
    ],
    avoid: [
      'Rewriting a working Options API codebase just to change style.',
      'Mixing `data()` and `setup()` state in the same component as a long-term pattern.',
      'Assuming the Composition API makes rendering faster at runtime — both styles use the same rendering and reactivity system.',
    ],
  },

  comparison: {
    title: 'Options API vs Composition API',
    headers: ['', 'Options API', 'Composition API'],
    rows: [
      ['Code organised by', 'option type (`data`, `methods`, …)', 'feature / logical concern'],
      ['State access', '`this.x`', 'variables; `x.value` for refs in JS'],
      ['Logic reuse', 'mixins (implicit, name clashes)', 'composables (explicit inputs and outputs)'],
      ['TypeScript inference', 'works, with more complex typing around `this`', 'natural — plain variables and functions'],
      ['Learning curve', 'gentle, guided structure', 'needs reactivity basics (`ref`, `.value`) and discipline'],
      ['Needs a build step?', 'no', '`setup()` no; `<script setup>` yes (SFC compiler)'],
      ['Status in Vue 3', 'fully supported, not deprecated', 'fully supported, recommended for full apps'],
    ],
    note: 'Both share templates, directives, components, lifecycle and the reactivity system. Next: [setup(), <script setup> & defineExpose](lesson:setup-and-script-setup).',
  },

  quiz: [
    {
      id: 'composition-vs-options-q1',
      type: 'mcq',
      prompt: 'Which statement about the Options API in Vue 3 is accurate?',
      options: [
        { text: 'It was removed in Vue 3; only Vue 2 supports it.', why: 'Vue 3 fully supports the Options API.' },
        { text: 'It is supported and not deprecated; it is built on the same reactivity core as the Composition API.' },
        { text: 'It still works but prints deprecation warnings in development.', why: 'There are no deprecation warnings — it is a first-class style.' },
        { text: 'It only works inside `<script setup>`.', why: '`<script setup>` is Composition API syntax; options go in a plain `<script>` export.' },
      ],
      answer: 1,
      explanation: 'Both styles are official. Internally the Options API is implemented on top of the same machinery (`reactive`, `computed`, watchers, lifecycle registration).',
    },
    {
      id: 'composition-vs-options-q2',
      type: 'output',
      prompt: 'In what order do these lines appear in the console when the component is created?',
      code: {
        lang: 'js',
        code: `export default {
  data() { return { name: 'Ada' } },
  beforeCreate() { console.log('beforeCreate') },
  created() { console.log('created', this.name) },
  setup() { console.log('setup'); return {} },
}`,
      },
      options: [
        { text: 'beforeCreate → setup → created Ada', why: '`setup()` runs even earlier than `beforeCreate`.' },
        { text: 'setup → beforeCreate → created Ada' },
        { text: 'beforeCreate → created Ada → setup', why: 'Vue calls `setup()` before any Options API hook.' },
        { text: 'setup → created undefined → beforeCreate', why: '`beforeCreate` always comes before `created`, and `data` is ready by `created`.' },
      ],
      answer: 1,
      explanation: '`setup()` is called first, before `beforeCreate`. That is exactly why it cannot use `this.name`: `data()` has not been applied yet. By `created`, data is ready.',
    },
    {
      id: 'composition-vs-options-q3',
      type: 'bug',
      prompt: 'This component was converted from the Options API. Clicking "Reset" throws an error. Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, computed } from 'vue'

const total = ref(10)
const doubled = computed(() => total.value * 2)

function reset() {
  total = 0
}
</script>

<template>
  <p>{{ total }} / {{ doubled }}</p>
  <button @click="reset">Reset</button>
</template>`,
      },
      answerLine: 8,
      explanation: '`total` is a `const` ref. The Options API line `this.total = 0` must become `total.value = 0`; assigning to the variable itself throws "Assignment to constant variable".',
    },
    {
      id: 'composition-vs-options-q4',
      type: 'fill',
      prompt: 'Translate `computed: { remaining() { return this.todos.filter(t => !t.done).length } }` to the Composition API.',
      code: {
        lang: 'js',
        code: `import { ref, ___ } from 'vue'

const todos = ref([])
const remaining = computed(() => todos.___.filter((t) => !t.done).length)`,
      },
      answer: [['computed'], ['value']],
      explanation: 'Import `computed`, and read the ref through `.value` inside the getter. No `this` needed.',
    },
    {
      id: 'composition-vs-options-q5',
      type: 'mcq',
      prompt: 'Select **all** reasons the Vue docs give for the Composition API.',
      options: [
        { text: 'Cleaner logic reuse through composable functions' },
        { text: 'More flexible code organisation by feature' },
        { text: 'Better TypeScript type inference' },
        { text: 'It makes every component re-render faster than the same Options API component', why: 'Both styles use the same reactivity and rendering system; there is no general runtime speed-up per render.' },
        { text: '`<script setup>` code tends to minify better (no `this` property access)' },
      ],
      answer: [0, 1, 2, 4],
      explanation: 'The docs cite logic reuse, flexible organisation, type inference, and smaller production bundles with `<script setup>`. Runtime rendering speed is not a general difference.',
    },
    {
      id: 'composition-vs-options-q6',
      type: 'mcq',
      prompt: 'A legacy Options API component needs the `useOnlineStatus()` composable. What is the least invasive way?',
      options: [
        { text: 'Rewrite the whole component in `<script setup>` first.', why: 'Possible, but it is the most invasive option and not required.' },
        { text: 'Add a `setup()` option that calls the composable and returns what the component needs.' },
        { text: 'Call `useOnlineStatus()` inside `methods`.', why: 'Composables that register watchers or lifecycle hooks must run during setup, not later in a method.' },
        { text: 'Composables cannot be used with the Options API at all.', why: 'They can — through the `setup()` option.' },
      ],
      answer: 1,
      explanation: 'Whatever `setup()` returns is exposed on `this` and in the template, so options like `computed` can then read `this.online`.',
    },
    {
      id: 'composition-vs-options-q7',
      type: 'short',
      prompt: 'In two or three sentences: what problem does "organising code by feature" solve in a big component?',
      answer: 'In the Options API one feature is split across data, computed, watch, methods and hooks, so following it means jumping around the file, and features interleave. Grouping by feature keeps all the code for one concern together, which makes it easier to read, change, and extract into a reusable composable.',
    },
  ],

  exercises: [
    {
      id: 'convert-reading-list',
      title: 'Convert a reading list to <script setup>',
      difficulty: 'intermediate',
      prompt: `
\`App.vue\` is a working **Options API** component. Rewrite it with \`<script setup>\` and the Composition API **without changing its behaviour**.

Keep these selectors and behaviours:

- \`<input class="new-title">\` + \`<button class="add">\` add a book (trimmed; empty titles are ignored; the input is cleared after adding).
- Each book is an \`<li class="book">\` with a checkbox that toggles \`done\`.
- \`<p class="remaining">\` shows \`N left\` (books not done).
- A watcher logs \`Remaining: N\` whenever the remaining count changes.
- On mount, the component logs \`Reading list ready\`.

The tests also check that the component no longer uses a \`data()\` option.
`,
      files: {
        'App.vue': `<script>
export default {
  data() {
    return {
      newTitle: '',
      books: [
        { id: 1, title: 'The Hobbit', done: false },
        { id: 2, title: 'Dune', done: true },
      ],
    }
  },
  computed: {
    remaining() {
      return this.books.filter((b) => !b.done).length
    },
  },
  watch: {
    remaining(n) {
      console.log('Remaining: ' + n)
    },
  },
  methods: {
    addBook() {
      const title = this.newTitle.trim()
      if (!title) return
      this.books.push({ id: Date.now(), title, done: false })
      this.newTitle = ''
    },
  },
  mounted() {
    console.log('Reading list ready')
  },
}
</script>

<template>
  <input v-model="newTitle" class="new-title" placeholder="Book title" />
  <button class="add" @click="addBook">Add</button>
  <ul>
    <li v-for="book in books" :key="book.id" class="book">
      <label><input v-model="book.done" type="checkbox" /> {{ book.title }}</label>
    </li>
  </ul>
  <p class="remaining">{{ remaining }} left</p>
</template>`,
      },
      hints: [
        'Use the translation table: `data` → `ref()`, `computed` option → `computed()`, `watch` option → `watch()`, `methods` → plain functions, `mounted` → `onMounted()`.',
        'Start with `const newTitle = ref(\'\')` and `const books = ref([...])`. Inside functions, `this.books` becomes `books.value`.',
        '`watch(remaining, (n) => console.log(\'Remaining: \' + n))` — you can pass a computed ref directly to `watch()`. The template does not need to change at all.',
      ],
      solution: {
        explanation: 'Each option maps to one function call, and `this.x` becomes `x.value`. The template is untouched because `<script setup>` exposes top-level bindings and unwraps refs. Notice the watcher can sit right next to the computed it observes.',
        files: {
          'App.vue': `<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const newTitle = ref('')
const books = ref([
  { id: 1, title: 'The Hobbit', done: false },
  { id: 2, title: 'Dune', done: true },
])

const remaining = computed(() => books.value.filter((b) => !b.done).length)

watch(remaining, (n) => {
  console.log('Remaining: ' + n)
})

function addBook() {
  const title = newTitle.value.trim()
  if (!title) return
  books.value.push({ id: Date.now(), title, done: false })
  newTitle.value = ''
}

onMounted(() => {
  console.log('Reading list ready')
})
</script>

<template>
  <input v-model="newTitle" class="new-title" placeholder="Book title" />
  <button class="add" @click="addBook">Add</button>
  <ul>
    <li v-for="book in books" :key="book.id" class="book">
      <label><input v-model="book.done" type="checkbox" /> {{ book.title }}</label>
    </li>
  </ul>
  <p class="remaining">{{ remaining }} left</p>
</template>`,
        },
      },
      tests: [
        { name: 'uses the Composition API (no data() option)', code: `expect(typeof vm.$options.setup).toBe('function')\nexpect(vm.$options.data).toBeUndefined()` },
        { name: 'shows 1 left initially and logs on mount', code: `expect(text('.remaining')).toBe('1 left')\nexpect(logs.join('\\n')).toContain('Reading list ready')` },
        {
          name: 'adding a book trims, clears the input and updates the count',
          code: `await type('.new-title', '  Matilda  ')
await click('.add')
expect(findAll('.book')).toHaveLength(3)
expect(text('.book:last-child')).toContain('Matilda')
expect(find('.new-title').value).toBe('')
expect(text('.remaining')).toBe('2 left')`,
        },
        { name: 'empty titles are ignored', code: `await type('.new-title', '   ')\nawait click('.add')\nexpect(findAll('.book')).toHaveLength(2)` },
        {
          name: 'toggling a book logs the new remaining count',
          code: `await check('.book input[type=checkbox]', true)
expect(text('.remaining')).toBe('0 left')
expect(logs.join('\\n')).toContain('Remaining: 0')`,
        },
      ],
    },
    {
      id: 'composable-in-options',
      title: 'Use a composable inside a legacy Options API component',
      difficulty: 'intermediate',
      prompt: `
\`useLikes.js\` is a ready-made composable. \`App.vue\` is a legacy **Options API** post card you must **not** rewrite — keep \`data\`, \`computed\` and the rest as options.

Wire the composable in with a \`setup()\` option:

- Call \`useLikes(3)\` in \`setup()\` and return \`likes\`, \`label\` and \`like\`.
- Show \`label\` in \`<span class="likes">\` (so it starts as **3 likes**).
- \`<button class="like-btn">\` calls \`like\`.
- Add a \`computed\` **option** \`isPopular\` that returns \`this.likes >= 5\`, and show \`<strong class="popular">Popular</strong>\` only when it is true.
`,
      files: {
        'useLikes.js': `import { ref, computed } from 'vue'

export function useLikes(start = 0) {
  const likes = ref(start)
  const label = computed(() => (likes.value === 1 ? '1 like' : likes.value + ' likes'))
  function like() {
    likes.value++
  }
  return { likes, label, like }
}`,
        'App.vue': `<script>
import { useLikes } from './useLikes.js'

export default {
  data() {
    return { title: 'Why I love Vue' }
  },
  // TODO: add setup() that uses useLikes(3)
  computed: {
    shout() {
      return this.title.toUpperCase()
    },
    // TODO: isPopular
  },
}
</script>

<template>
  <article>
    <h2>{{ shout }}</h2>
    <!-- TODO: likes label, like button, popular badge -->
  </article>
</template>`,
      },
      hints: [
        'An options object can have a `setup()` function. Whatever it returns is available in the template and on `this`.',
        '`setup() { const { likes, label, like } = useLikes(3); return { likes, label, like } }`',
        'In the computed option, `this.likes` is already unwrapped (a number), so `isPopular() { return this.likes >= 5 }` works. In the template: `<strong v-if="isPopular" class="popular">Popular</strong>`.',
      ],
      solution: {
        explanation: '`setup()` runs first and its returned refs are exposed on `this` (automatically unwrapped) and in the template. Options like `computed` can then build on them — a clean way to bring new composables into old components one at a time.',
        files: {
          'useLikes.js': `import { ref, computed } from 'vue'

export function useLikes(start = 0) {
  const likes = ref(start)
  const label = computed(() => (likes.value === 1 ? '1 like' : likes.value + ' likes'))
  function like() {
    likes.value++
  }
  return { likes, label, like }
}`,
          'App.vue': `<script>
import { useLikes } from './useLikes.js'

export default {
  data() {
    return { title: 'Why I love Vue' }
  },
  setup() {
    const { likes, label, like } = useLikes(3)
    return { likes, label, like }
  },
  computed: {
    shout() {
      return this.title.toUpperCase()
    },
    isPopular() {
      return this.likes >= 5
    },
  },
}
</script>

<template>
  <article>
    <h2>{{ shout }}</h2>
    <span class="likes">{{ label }}</span>
    <button class="like-btn" @click="like">♥</button>
    <strong v-if="isPopular" class="popular">Popular</strong>
  </article>
</template>`,
        },
      },
      tests: [
        { name: 'keeps the Options API data()', code: `expect(typeof vm.$options.data).toBe('function')\nexpect(text('h2')).toBe('WHY I LOVE VUE')` },
        { name: 'starts at 3 likes, not popular', code: `expect(text('.likes')).toBe('3 likes')\nexpect(exists('.popular')).toBe(false)` },
        { name: 'one click → 4 likes', code: `await click('.like-btn')\nexpect(text('.likes')).toBe('4 likes')\nexpect(exists('.popular')).toBe(false)` },
        { name: 'two clicks → 5 likes and Popular badge', code: `await click('.like-btn')\nawait click('.like-btn')\nexpect(text('.likes')).toBe('5 likes')\nexpect(exists('.popular')).toBe(true)` },
      ],
    },
  ],

  interview: [
    {
      id: 'composition-vs-options-differences',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between the Options API and the Composition API in Vue?',
      answer: 'They are two ways to write component logic on the same reactivity system. The Options API declares a component as an object of options (`data`, `computed`, `methods`, `watch`, lifecycle hooks) and accesses everything via `this`. The Composition API builds logic with imported functions (`ref`, `computed`, `watch`, `onMounted`) inside `setup()` or `<script setup>`, so code can be grouped by feature and extracted into reusable composables.',
      explanation: 'Options API = sorted by kind of code. Composition API = sorted by what the code is for. Same engine underneath.',
      code: {
        lang: 'js',
        code: `// Options API
export default {
  data: () => ({ count: 0 }),
  methods: { inc() { this.count++ } },
}

// Composition API (<script setup>)
const count = ref(0)
const inc = () => count.value++`,
      },
      whyAsked: 'The most common Vue 3 interview opener. It checks whether you understand the *motivation* (organisation, reuse, typing) rather than just syntax.',
      mistakes: [
        'Saying the Options API is deprecated or "Vue 2 only".',
        'Claiming the Composition API is faster at rendering in general.',
        'Describing only syntax differences without the reason: logic reuse and organisation by feature.',
      ],
      followUps: [
        'Can you use both in one component? How?',
        'Which would you choose for a new project, and why?',
        'How did people share logic in the Options API?',
      ],
      modelAnswer: 'Both are official ways to write Vue components and they share the same reactivity system. The Options API organises a component into fixed options — data, computed, methods, watch, hooks — and you use `this` to reach everything. The Composition API uses imported functions like `ref`, `computed` and `onMounted` inside `<script setup>`, so I can keep all code for one feature together. The big win is reuse: that grouped logic can be pulled into a composable function with clear inputs and outputs, which replaces mixins. It also gives better TypeScript inference. The trade-off is that it needs more discipline, because there are no buckets forcing a structure.',
    },
    {
      id: 'composition-vs-options-rewrite',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You join a team with 200 Options API components. A colleague proposes rewriting everything in the Composition API. What do you recommend?',
      answer: 'Don\'t do a big-bang rewrite. Both styles are supported and the Options API is not deprecated. Write new components with `<script setup>`, migrate an existing component only when you are substantially changing it or need to share its logic, and let legacy components consume new composables through a `setup()` option. Back changes with tests.',
      explanation: 'A rewrite costs time and risks regressions without adding user value. Incremental migration gets the benefits where they matter.',
      whyAsked: 'Tests engineering judgement: weighing consistency, risk and value instead of following trends.',
      mistakes: [
        'Agreeing to rewrite everything "because Options is old".',
        'Refusing any change, ignoring the maintainability benefits for complex components.',
        'Forgetting that tests are needed before refactoring.',
      ],
      followUps: [
        'How can an Options API component use a composable?',
        'Which components would you migrate first?',
        'How would you keep the codebase consistent during the transition?',
      ],
      modelAnswer: 'I\'d avoid a big-bang rewrite: the Options API is fully supported, and rewriting 200 working components is risk without user value. Instead I\'d agree on a rule — new components use `<script setup>` — and migrate existing ones opportunistically, when we\'re making a substantial change or when their logic needs to be shared. Shared logic becomes composables, and legacy components can call them through a `setup()` option, so both worlds coexist. I\'d make sure the components we touch have tests first, and add lint rules so the convention is enforced in review.',
    },
    {
      id: 'composition-vs-options-shadowing',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'This component defines `count` in both `data()` and `setup()`. What does the template render?',
      code: {
        lang: 'vue',
        code: `<script>
import { ref } from 'vue'
export default {
  data() { return { count: 1 } },
  setup() { return { count: ref(99) } },
}
</script>

<template><p>{{ count }}</p></template>`,
      },
      options: ['1', '99', '100', 'An error: duplicate key'],
      correctOption: 1,
      answer: 'It renders **99**. The render context looks up setup bindings before `data`, so the ref returned from `setup()` shadows the `data` property.',
      explanation: 'The instance proxy checks setup state first, then data, then props and the rest. Never reuse names across the two — it is confusing even when it "works".',
      whyAsked: 'Checks understanding of how the two APIs coexist on one instance, which matters in gradual migrations.',
      mistakes: ['Guessing that `data` wins because it is declared first.', 'Expecting Vue to merge or add the values.'],
      followUps: ['What is the order of lookup on `this`?', 'Why does `setup()` not see `this.count` from data?'],
      modelAnswer: 'It shows 99. When both APIs are used, the component\'s render proxy resolves names from setup bindings first, then data, then props and other context, so the setup ref shadows the data property. `setup()` itself can\'t even see the data value because it runs before `data()` is applied and has no `this`. In practice I\'d never split state like this — keep each component in one style, or use `setup()` only to bring in composables with unique names.',
    },
    {
      id: 'composition-vs-options-this-setup',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A developer adds a `setup()` function to an existing component and writes `this.items.push(x)` inside it. It crashes. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `export default {
  data() { return { items: [] } },
  setup() {
    function add(x) { this.items.push(x) }
    return { add }
  },
}`,
      },
      answer: '`setup()` code has no access to the component instance through `this` (it is `undefined` inside `setup()`), and it runs before `data()` is applied. Either move `items` into `setup()` as `const items = ref([])` and use `items.value.push(x)`, or keep `add` as an Options API method that uses `this.items`.',
      explanation: 'The two APIs have a direction: options can use what setup returns, but setup cannot use options.',
      whyAsked: 'A very common mistake during migrations; reveals whether the candidate knows the execution order.',
      mistakes: ['Suggesting `.bind(this)` or an arrow function — there is still no instance `this` to bind.', 'Saying `setup()` is called after `created`.'],
      followUps: ['What arguments does `setup()` receive?', 'How would you access props inside `setup()`?'],
      modelAnswer: '`this` isn\'t the component inside `setup()` — it\'s `undefined` there — and `setup()` runs before `beforeCreate`, so `data()` hasn\'t been applied yet. Binding or arrow functions don\'t help. The fix is to keep each piece of state in one place: either create `items` with `ref([])` inside `setup()` and return it, or leave `add` as a regular method using `this.items`. If you need props in `setup()`, use its first argument.',
    },
    {
      id: 'composition-vs-options-hooks',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'How is Vue\'s Composition API different from React Hooks?',
      answer: 'They look similar but run differently. Vue\'s `setup()` / `<script setup>` runs **once** per component instance, and reactivity tracks dependencies automatically. React function components re-run on every render, so hooks depend on call order, need dependency arrays for effects and memoisation, and can capture stale values in closures. Vue composables can be called conditionally inside setup and don\'t need `useMemo`/`useCallback`-style optimisations for the same purpose.',
      explanation: 'React: the function re-runs, so hooks are re-called each render. Vue: setup runs once and fine-grained reactivity decides what updates.',
      whyAsked: 'Common for candidates with React experience; shows understanding of Vue\'s reactivity model rather than surface syntax.',
      mistakes: [
        'Saying they are "the same idea with different names".',
        'Claiming Vue composables re-run on every render.',
        'Forgetting that Vue still requires lifecycle/watch calls to happen synchronously during setup.',
      ],
      followUps: ['Why don\'t Vue watchers need dependency arrays?', 'What rule do Vue composables still have about where they are called?'],
      modelAnswer: 'Both let you compose stateful logic from functions, but the execution model differs. In Vue, setup runs once per instance; refs and computed values are reactive objects, and Vue tracks which effects read them, so there are no dependency arrays and no stale-closure problems from re-renders. In React, the component function re-runs every render, so hooks rely on stable call order and you declare dependencies manually. Vue has its own rule though: lifecycle hooks and watchers must be registered synchronously during setup so they attach to the right instance.',
    },
    {
      id: 'composition-vs-options-ts-bundle',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'Why does the Composition API with `<script setup>` tend to give better TypeScript inference and smaller production bundles?',
      answer: 'Composition API code is plain variables and functions, which TypeScript infers naturally; the Options API needs complex typing to describe `this`. For size, `<script setup>` lets the compiler put the template\'s render function in the same scope as your variables in production, so the template reads local variables instead of properties on `this` — and local names can be minified, property names cannot.',
      explanation: 'Plain functions are easy for both type-checkers and minifiers. A `this` object with dynamic properties is harder for both.',
      whyAsked: 'Checks depth beyond "it\'s newer": understanding of compilation and tooling trade-offs.',
      mistakes: ['Claiming a specific percentage size reduction.', 'Saying the Options API cannot be typed at all.'],
      followUps: ['What does the `__VUE_OPTIONS_API__` flag do?', 'What does `<script setup>` compile to?'],
      modelAnswer: 'With the Composition API I\'m writing ordinary variables and functions, so TypeScript can infer types directly; with the Options API, types have to flow through the `this` context, which needs heavier type machinery. On bundle size, `<script setup>` compiles the template into a render function that lives in the same scope as my bindings in production, so it accesses them as local variables. Minifiers can shorten local variable names but not object property names like `this.query`. And if no code uses the Options API, bundlers can drop its support code with the `__VUE_OPTIONS_API__` flag.',
    },
    {
      id: 'composition-vs-options-convert',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Convert this Options API temperature converter to `<script setup>`. Keep the selectors: `input.celsius` (number input), `p.fahrenheit` showing e.g. `77°F`, and `p.hint` that reads `Hot!` when Celsius is 30 or more, otherwise `Nice`.',
      starter: {
        files: {
          'App.vue': `<script>
export default {
  data() {
    return { celsius: 25 }
  },
  computed: {
    fahrenheit() {
      return Math.round(this.celsius * 9 / 5 + 32)
    },
    hint() {
      return this.celsius >= 30 ? 'Hot!' : 'Nice'
    },
  },
}
</script>

<template>
  <input v-model.number="celsius" class="celsius" type="number" />
  <p class="fahrenheit">{{ fahrenheit }}°F</p>
  <p class="hint">{{ hint }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'uses <script setup> (no data option)', code: `expect(typeof vm.$options.setup).toBe('function')\nexpect(vm.$options.data).toBeUndefined()` },
        { name: '25°C shows 77°F and Nice', code: `expect(text('.fahrenheit')).toBe('77°F')\nexpect(text('.hint')).toBe('Nice')` },
        { name: 'typing 30 shows 86°F and Hot!', code: `await type('.celsius', '30')\nexpect(text('.fahrenheit')).toBe('86°F')\nexpect(text('.hint')).toBe('Hot!')` },
      ],
      hints: ['`data` → `const celsius = ref(25)`.', 'Each computed option becomes `const x = computed(() => ...)` reading `celsius.value`.'],
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const celsius = ref(25)
const fahrenheit = computed(() => Math.round(celsius.value * 9 / 5 + 32))
const hint = computed(() => (celsius.value >= 30 ? 'Hot!' : 'Nice'))
</script>

<template>
  <input v-model.number="celsius" class="celsius" type="number" />
  <p class="fahrenheit">{{ fahrenheit }}°F</p>
  <p class="hint">{{ hint }}</p>
</template>`,
        },
      },
      answer: 'One ref for the state and two computed refs for derived values; `this.celsius` becomes `celsius.value`. The template stays identical.',
      explanation: 'A mechanical translation: the template is the contract and does not change.',
      whyAsked: 'Live-coding check that you can read and migrate both styles — a daily task in mixed codebases.',
      mistakes: ['Storing fahrenheit in a second ref and syncing it with a watcher.', 'Forgetting `.value` inside the computed getters.'],
      followUps: ['How would you make the conversion two-way (edit Fahrenheit too)?', 'Would you extract this into a composable? When?'],
      modelAnswer: 'I keep `celsius` as a ref and turn each computed option into a `computed()` call that reads `celsius.value`. The template doesn\'t change because `<script setup>` exposes the bindings and unwraps refs. I wouldn\'t mirror Fahrenheit into its own ref — it\'s derived state, so computed is right. For two-way editing I\'d use a writable computed with get and set.',
    },
  ],

  takeaways: [
    'Vue 3 has two official API styles over one reactivity system; the Options API is not deprecated.',
    'Options API: fixed buckets (`data`, `computed`, `watch`, `methods`, hooks) and `this`. Composition API: imported functions in `setup()`/`<script setup>`, no `this`.',
    'The Composition API exists for organisation by feature, clean logic reuse (composables instead of mixins) and better type inference.',
    '`setup()` runs before `beforeCreate`; options can use what `setup()` returns, never the reverse.',
    'Choose one style per component, prefer `<script setup>` for new SFC-based apps, and migrate legacy code gradually.',
  ],
}
