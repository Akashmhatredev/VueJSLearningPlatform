// Lesson: refactoring & migrating legacy Vue code.
// Safe refactoring, Options API → Composition API step by step, mixins →
// composables, Vue 2 → Vue 3 (EOL, 2.7, @vue/compat, silent breaking
// changes) and code review practices.

const productsApi = `// Simulated API — the sandbox has no network.
const PRODUCTS = [
  { id: 1, name: 'Desk lamp' },
  { id: 2, name: 'Notebook' },
  { id: 3, name: 'Floor lamp' },
  { id: 4, name: 'Backpack' },
  { id: 5, name: 'Headphones' },
  { id: 6, name: 'Reading lamp' },
  { id: 7, name: 'Water bottle' },
  { id: 8, name: 'Plant pot' },
]

export function fetchProducts() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(PRODUCTS.map((p) => ({ ...p }))), 150)
  })
}`

const paginationMixin = `// A Vue 2-era mixin. Notice what it silently assumes about its host component.
export default {
  data() {
    return { page: 1, perPage: 3 }
  },
  computed: {
    pageCount() {
      // \`filtered\` must exist on whichever component uses this mixin!
      return Math.max(1, Math.ceil(this.filtered.length / this.perPage))
    },
    pageItems() {
      const start = (this.page - 1) * this.perPage
      return this.filtered.slice(start, start + this.perPage)
    },
  },
  methods: {
    nextPage() {
      if (this.page < this.pageCount) this.page++
    },
    prevPage() {
      if (this.page > 1) this.page--
    },
  },
}`

const usePaginationStub = `import { computed, ref, toValue } from 'vue'

// Migration step 1: rewrite mixins/paginationMixin.js as a composable.
// \`source\` is a ref, a computed or a getter that returns the array to paginate.
// toValue() (Vue 3.3+) reads all three.
export function usePagination(source, perPage = 3) {
  // TODO: return { page, pageCount, pageItems, nextPage, prevPage }
  return {}
}`

const usePaginationDone = `import { computed, ref, toValue } from 'vue'

// The mixin, rewritten: explicit input (source), explicit output (the return value).
export function usePagination(source, perPage = 3) {
  const page = ref(1)
  const items = computed(() => toValue(source))

  const pageCount = computed(() => Math.max(1, Math.ceil(items.value.length / perPage)))
  const pageItems = computed(() => {
    const start = (page.value - 1) * perPage
    return items.value.slice(start, start + perPage)
  })

  function nextPage() {
    if (page.value < pageCount.value) page.value++
  }
  function prevPage() {
    if (page.value > 1) page.value--
  }

  return { page, pageCount, pageItems, nextPage, prevPage }
}`

const useFavouritesDone = `import { ref, watch } from 'vue'

export function useFavourites() {
  const favourites = ref([])
  const savedMessage = ref('')

  // A ref holding an array: watch() only sees .value being replaced,
  // so array mutations (push/splice) need { deep: true } — just like Vue 3's watch option.
  watch(
    favourites,
    (list) => {
      savedMessage.value = 'Saved ' + list.length + ' favourite(s)'
    },
    { deep: true },
  )

  const isFavourite = (id) => favourites.value.includes(id)

  function toggleFavourite(id) {
    const i = favourites.value.indexOf(id)
    if (i === -1) favourites.value.push(id)
    else favourites.value.splice(i, 1)
  }

  return { favourites, savedMessage, isFavourite, toggleFavourite }
}`

const productListTemplate = `<template>
  <section class="product-list">
    <label>Search <input class="search" v-model="query" placeholder="Try “lamp”" /></label>
    <p v-if="loading" class="loading">Loading…</p>
    <template v-else>
      <ul class="products">
        <li v-for="p in pageItems" :key="p.id">
          {{ p.name }}
          <button type="button" class="fav" :aria-pressed="isFavourite(p.id)" @click="toggleFavourite(p.id)">
            <span aria-hidden="true">{{ isFavourite(p.id) ? '★' : '☆' }}</span>
            <span class="visually-hidden">Favourite {{ p.name }}</span>
          </button>
        </li>
      </ul>
      <nav class="pager" aria-label="Pagination">
        <button type="button" class="prev" :disabled="page === 1" @click="prevPage">Previous</button>
        <span class="page-label">Page {{ page }} of {{ pageCount }}</span>
        <button type="button" class="next" :disabled="page === pageCount" @click="nextPage">Next</button>
      </nav>
      <p class="saved" role="status">{{ savedMessage }}</p>
    </template>
  </section>
</template>

<style scoped>
.products { padding-left: 1.2rem; }
.fav { margin-left: 8px; font: inherit; background: none; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; }
.pager { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
</style>`

const productListLegacy = `<script>
import { fetchProducts } from './api.js'
import paginationMixin from './mixins/paginationMixin.js'

export default {
  name: 'ProductList',
  mixins: [paginationMixin],
  data() {
    return {
      products: [],
      loading: true,
      query: '',
      favourites: [],
      savedMessage: '',
    }
  },
  computed: {
    // paginationMixin silently depends on this exact name.
    filtered() {
      const q = this.query.trim().toLowerCase()
      return this.products.filter((p) => p.name.toLowerCase().includes(q))
    },
  },
  watch: {
    query() {
      this.page = 1 // \`page\` comes from the mixin. Could you tell?
    },
    // Copied unchanged from the Vue 2 version of this app.
    favourites(list) {
      this.savedMessage = 'Saved ' + list.length + ' favourite(s)'
    },
  },
  async created() {
    this.products = await fetchProducts()
    this.loading = false
  },
  methods: {
    isFavourite(id) {
      return this.favourites.includes(id)
    },
    toggleFavourite(id) {
      const i = this.favourites.indexOf(id)
      if (i === -1) this.favourites.push(id)
      else this.favourites.splice(i, 1)
    },
  },
}
</script>

${productListTemplate}`

const productListMigrated = `<script setup>
import { computed, ref, watch } from 'vue'
import { fetchProducts } from './api.js'
import { usePagination } from './composables/usePagination.js'
import { useFavourites } from './composables/useFavourites.js'

// — Loading (was: data.products, data.loading and created())
const products = ref([])
const loading = ref(true)
async function load() {
  products.value = await fetchProducts()
  loading.value = false
}
load() // top-level setup code runs where created() used to

// — Search (was: data.query + computed.filtered)
const query = ref('')
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return products.value.filter((p) => p.name.toLowerCase().includes(q))
})

// — Pagination (was: paginationMixin — now an explicit input and output)
const { page, pageCount, pageItems, nextPage, prevPage } = usePagination(filtered, 3)
watch(query, () => {
  page.value = 1
})

// — Favourites (was: data.favourites + a watcher + two methods)
const { savedMessage, isFavourite, toggleFavourite } = useFavourites()
</script>

${productListTemplate}`

const appVue = `<script setup>
import ProductList from './ProductList.vue'
</script>

<template>
  <h2>Product catalogue</h2>
  <ProductList />
</template>`

// ---------- exercise 1: Options API → <script setup>
const quantityApp = `<script setup>
import { ref } from 'vue'
import QuantityPicker from './QuantityPicker.vue'

const qty = ref(2)
const stock = ref(5)
</script>

<template>
  <QuantityPicker v-model="qty" :max="stock" autofocus />
  <p class="summary">{{ qty }} in basket · {{ stock }} in stock</p>
  <button type="button" class="sell-out" @click="stock = 1">Simulate stock dropping to 1</button>
</template>`

const quantityTemplate = `<template>
  <div class="quantity-picker" role="group" aria-label="Quantity">
    <button type="button" class="dec" aria-label="Decrease quantity" :disabled="!canDecrease" @click="decrease">−</button>
    <output class="qty">{{ modelValue }}</output>
    <button ref="increaseBtn" type="button" class="inc" aria-label="Increase quantity" :disabled="!canIncrease" @click="increase">+</button>
  </div>
</template>`

const quantityStarter = `<script>
export default {
  name: 'QuantityPicker',
  props: {
    modelValue: { type: Number, required: true },
    max: { type: Number, default: 10 },
    autofocus: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  computed: {
    canDecrease() {
      return this.modelValue > 1
    },
    canIncrease() {
      return this.modelValue < this.max
    },
  },
  watch: {
    max(newMax) {
      if (this.modelValue > newMax) this.$emit('update:modelValue', newMax)
    },
  },
  mounted() {
    if (this.autofocus) this.$refs.increaseBtn.focus()
  },
  methods: {
    decrease() {
      if (this.canDecrease) this.$emit('update:modelValue', this.modelValue - 1)
    },
    increase() {
      if (this.canIncrease) this.$emit('update:modelValue', this.modelValue + 1)
    },
  },
}
</script>

${quantityTemplate}`

const quantitySolution = `<script setup>
import { computed, onMounted, useTemplateRef, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Number, required: true },
  max: { type: Number, default: 10 },
  autofocus: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

const canDecrease = computed(() => props.modelValue > 1)
const canIncrease = computed(() => props.modelValue < props.max)

// watch: { max(newMax) {…} }  →  watch a getter, because props.max is a property
watch(
  () => props.max,
  (newMax) => {
    if (props.modelValue > newMax) emit('update:modelValue', newMax)
  },
)

// this.$refs.increaseBtn  →  useTemplateRef (Vue 3.5+; use ref(null) on older 3.x)
const increaseButton = useTemplateRef('increaseBtn')
onMounted(() => {
  if (props.autofocus) increaseButton.value.focus()
})

function decrease() {
  if (canDecrease.value) emit('update:modelValue', props.modelValue - 1)
}
function increase() {
  if (canIncrease.value) emit('update:modelValue', props.modelValue + 1)
}
</script>

${quantityTemplate}`

// ---------- exercise 2: Vue 2 leftovers
const scrollLock = `import { ref } from 'vue'

// Simplified scroll lock: real code would also set overflow: hidden on <body>
// while lockCount > 0. Every lock() must be paired with an unlock().
export const lockCount = ref(0)

export function lock() {
  lockCount.value++
}

export function unlock() {
  lockCount.value = Math.max(0, lockCount.value - 1)
}`

const leftoversAppStarter = `<script setup>
import { ref } from 'vue'
import TextField from './TextField.vue'
import Disclosure from './Disclosure.vue'
import TipsPanel from './TipsPanel.vue'
import { lockCount } from './scrollLock.js'

const name = ref('Ada')
const showTips = ref(false)
</script>

<template>
  <div class="name-field">
    <TextField v-model="name" label="Your name" />
  </div>
  <p class="greeting">Hello, {{ name || 'stranger' }}!</p>

  <Disclosure :open.sync="showTips" label="Show tips">
    <TipsPanel />
  </Disclosure>

  <p class="lock-status">Scroll lock: {{ lockCount > 0 ? 'on' : 'off' }}</p>
</template>`

const leftoversAppSolution = leftoversAppStarter.replace(':open.sync="showTips"', 'v-model:open="showTips"')

const textFieldStarter = `<script>
export default {
  name: 'TextField',
  props: {
    value: { type: String, default: '' },
    label: { type: String, required: true },
  },
  methods: {
    onInput(event) {
      this.$emit('input', event.target.value)
    },
  },
}
</script>

<template>
  <label class="text-field">
    {{ label }}
    <input :value="value" @input="onInput" />
  </label>
</template>`

const textFieldSolution = `<script>
export default {
  name: 'TextField',
  props: {
    modelValue: { type: String, default: '' }, // Vue 3: v-model passes modelValue…
    label: { type: String, required: true },
  },
  emits: ['update:modelValue'], // …and listens for update:modelValue
  methods: {
    onInput(event) {
      this.$emit('update:modelValue', event.target.value)
    },
  },
}
</script>

<template>
  <label class="text-field">
    {{ label }}
    <input :value="modelValue" @input="onInput" />
  </label>
</template>`

const disclosure = `<script>
export default {
  name: 'Disclosure',
  props: {
    open: { type: Boolean, default: false },
    label: { type: String, required: true },
  },
  emits: ['update:open'],
  methods: {
    toggle() {
      this.$emit('update:open', !this.open)
    },
  },
}
</script>

<template>
  <div class="disclosure">
    <button type="button" class="tips-toggle" :aria-expanded="open" @click="toggle">{{ label }}</button>
    <div v-if="open" class="tips">
      <slot />
    </div>
  </div>
</template>`

const tipsPanelStarter = `<script>
import { lock, unlock } from './scrollLock.js'

export default {
  name: 'TipsPanel',
  mounted() {
    lock()
  },
  beforeDestroy() {
    unlock()
  },
}
</script>

<template>
  <ul class="tips-list">
    <li>Press Tab to move to the next field.</li>
    <li>Press Shift+Tab to move back.</li>
  </ul>
</template>`

const tipsPanelSolution = tipsPanelStarter.replace('beforeDestroy() {', 'beforeUnmount() {')

// ---------- interview coding: mixin → composable
const selectionMixin = `// Vue 2-era mixin: expects its host component to define \`items\` (an array of { id }).
export default {
  data() {
    return { selectedIds: [] }
  },
  computed: {
    allSelected() {
      return this.items.length > 0 && this.selectedIds.length === this.items.length
    },
  },
  watch: {
    // Drop selections whose items disappeared.
    items: {
      handler(list) {
        const ids = list.map((item) => item.id)
        this.selectedIds = this.selectedIds.filter((id) => ids.includes(id))
      },
      deep: true,
    },
  },
  methods: {
    isSelected(id) {
      return this.selectedIds.includes(id)
    },
    toggle(id) {
      this.selectedIds = this.isSelected(id)
        ? this.selectedIds.filter((x) => x !== id)
        : [...this.selectedIds, id]
    },
    toggleAll() {
      this.selectedIds = this.allSelected ? [] : this.items.map((item) => item.id)
    },
  },
}`

const inboxTemplate = `<template>
  <label><input type="checkbox" class="all" :checked="allSelected" @change="toggleAll" /> Select all</label>
  <ul class="inbox">
    <li v-for="item in items" :key="item.id">
      <label>
        <input type="checkbox" class="pick" :checked="isSelected(item.id)" @change="toggle(item.id)" />
        {{ item.subject }}
      </label>
    </li>
  </ul>
  <button type="button" class="archive" :disabled="!selectedIds.length" @click="archiveSelected">
    Archive {{ selectedIds.length }}
  </button>
</template>`

const inboxLegacy = `<script>
import selectionMixin from './selectionMixin.js'

// The legacy version — use it as the reference behaviour.
export default {
  mixins: [selectionMixin],
  data() {
    return {
      items: [
        { id: 1, subject: 'Invoice #42' },
        { id: 2, subject: 'Team lunch on Friday' },
        { id: 3, subject: 'Your parcel has shipped' },
      ],
    }
  },
  methods: {
    archiveSelected() {
      this.items = this.items.filter((item) => !this.isSelected(item.id))
    },
  },
}
</script>

${inboxTemplate}`

const inboxMigrated = `<script setup>
import { ref } from 'vue'
import { useSelection } from './useSelection.js'

const items = ref([
  { id: 1, subject: 'Invoice #42' },
  { id: 2, subject: 'Team lunch on Friday' },
  { id: 3, subject: 'Your parcel has shipped' },
])

const { selectedIds, allSelected, isSelected, toggle, toggleAll } = useSelection(items)

function archiveSelected() {
  items.value = items.value.filter((item) => !isSelected(item.id))
}
</script>

${inboxTemplate}`

const useSelectionStub = `import { computed, ref, toValue, watch } from 'vue'

// Rewrite selectionMixin.js as a composable.
// \`source\` is a ref, computed or getter returning an array of { id } objects.
export function useSelection(source) {
  // TODO: return { selectedIds, allSelected, isSelected, toggle, toggleAll }
  return {}
}`

const useSelectionDone = `import { computed, ref, toValue, watch } from 'vue'

export function useSelection(source) {
  const selectedIds = ref([])
  const items = computed(() => toValue(source))

  const allSelected = computed(
    () => items.value.length > 0 && selectedIds.value.length === items.value.length,
  )

  // Was the mixin's deep \`items\` watcher: drop selections whose items disappeared.
  watch(
    items,
    (list) => {
      const ids = list.map((item) => item.id)
      selectedIds.value = selectedIds.value.filter((id) => ids.includes(id))
    },
    { deep: true },
  )

  const isSelected = (id) => selectedIds.value.includes(id)

  function toggle(id) {
    selectedIds.value = isSelected(id)
      ? selectedIds.value.filter((x) => x !== id)
      : [...selectedIds.value, id]
  }

  function toggleAll() {
    selectedIds.value = allSelected.value ? [] : items.value.map((item) => item.id)
  }

  return { selectedIds, allSelected, isSelected, toggle, toggleAll }
}`

const legacyFiles = {
  'App.vue': appVue,
  'ProductList.vue': productListLegacy,
  'mixins/paginationMixin.js': paginationMixin,
  'composables/usePagination.js': usePaginationStub,
  'api.js': productsApi,
}

export default {
  id: 'legacy-migration',
  title: 'Refactoring & migrating legacy Vue code',
  summary: 'Change old code without breaking it: safe refactoring, Options API → Composition API step by step, mixins → composables, and moving Vue 2 codebases to Vue 3.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['options-api', 'composition-vs-options', 'composables-intro', 'component-testing'],
  related: ['design-patterns', 'project-structure', 'setup-and-script-setup', 'component-v-model', 'fallthrough-attrs', 'composable-design', 'watch', 'lifecycle-hooks'],
  tags: ['legacy', 'refactoring', 'migration', 'vue 2', 'vue 3', 'options api', 'composition api', 'mixins', 'composables', '@vue/compat', 'end of life', 'code review'],
  apis: [
    { name: 'setup() option', summary: 'Lets an Options API component use the Composition API; returned bindings are available on `this` in other options.' },
    { name: 'toValue()', summary: 'Vue 3.3+: reads a ref, a getter or a plain value — handy for composable inputs.' },
    { name: 'useTemplateRef()', summary: 'Vue 3.5+: the Composition API replacement for `this.$refs.name`.' },
    { name: '@vue/compat', summary: 'The Vue 3 "migration build": runs most Vue 2 code with runtime warnings so you can migrate incrementally.' },
  ],
  docs: [
    { label: 'Vue 3 Migration Guide — Breaking Changes', url: 'https://v3-migration.vuejs.org/breaking-changes/' },
    { label: 'Vue 3 Migration Guide — Migration Build', url: 'https://v3-migration.vuejs.org/migration-build.html' },
    { label: 'Vue 2 End of Life', url: 'https://v2.vuejs.org/eol/' },
    { label: 'Vue Guide — Composition API FAQ', url: 'https://vuejs.org/guide/extras/composition-api-faq.html' },
    { label: 'Vue Guide — Composables vs. Mixins', url: 'https://vuejs.org/guide/reusability/composables.html#vs-mixins' },
    { label: 'Vue Blog — Vue 2.7 "Naruto" released', url: 'https://blog.vuejs.org/posts/vue-2-7-naruto' },
  ],

  intro: `
*Legacy code* is code that people depend on but are nervous to change. Usually it works, it earns money, and nobody remembers why it is shaped the way it is.

This lesson is about changing such code **without breaking it**:

- **Refactoring:** changing how code is *structured* without changing what it *does*.
- **Options API → Composition API:** moving a component from \`data\`/\`methods\`/\`computed\` blocks ([the Options API](lesson:options-api)) to \`<script setup>\`, one concern at a time.
- **Mixins → composables:** replacing Vue 2's main reuse tool with explicit functions ([composables](lesson:composables-intro)).
- **Vue 2 → Vue 3:** Vue 2 reached **end of life on 31 December 2023**, so many teams are migrating real apps right now — and a handful of changes fail *silently*.
- **Reviewing** these changes so the team can trust them.
`,

  why: `
Rewrites are tempting: "it'd be faster to start over". It almost never is. The old code contains years of bug fixes and edge cases that nobody wrote down, and a rewrite has to rediscover every one of them while the old app keeps changing.

Doing nothing isn't safe either. On an unsupported framework version you get no more fixes from the core team — security fixes included — and libraries gradually stop supporting it. Even inside Vue 3, a 1,500-line Options API component with five mixins slows every feature that touches it.

The professional middle path: **small, behaviour-preserving steps, each protected by tests, each shippable on its own.** It's slower per step and much faster overall — and you can stop at any point with a working app.
`,

  eli15: `
Imagine renovating the kitchen in a house where a family is still living. You can't knock the whole house down — they need to eat dinner tonight.

So you work one cupboard at a time. Before you touch anything, you take photos of how it all works (where the plates go, which tap is hot). After each change you check the photos: does dinner still work? Yes? Next cupboard.

That's refactoring. The **photos are tests**: they record what the code does today. Each **cupboard is a small change**. And moving from Vue 2 to Vue 3 is like switching the house from gas to electric: some appliances need a new plug, and a few seem to work but quietly don't — so you check each one.
`,

  analogy: {
    title: 'Renovating a house while people live in it',
    body: `
Good renovators don't demolish; they work room by room, keep the water running, and test each room before moving on. They label the wires they find (because nobody else did), and they swap old plugs for new ones carefully — some old appliances look fine on the new supply but silently don't work.

Migrating a live Vue app is the same job: keep it shippable every day, change one area at a time, and check every "plug" Vue 3 changed.
`,
    mapping: [
      ['photos of how the house works', 'characterisation tests that pin current behaviour'],
      ['one room at a time', 'one component, one concern, one pull request at a time'],
      ['labelling mystery wires', 'replacing mixins with composables that have explicit inputs and outputs'],
      ['gas → electric', 'Vue 2 → Vue 3'],
      ['appliances that look fine but don\'t work', 'silent breaking changes: `.sync`, `beforeDestroy`, array watchers, the `value`/`input` v-model contract'],
      ['a temporary adapter on the old cooker', 'the `@vue/compat` migration build'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'The same component, before and after',
    caption: 'The behaviour is identical. What changed is where things live: grouped by concern, with every name\'s origin visible.',
    alt: 'Side-by-side code. Left: an Options API component with a pagination mixin, splitting the search, pagination and favourites logic across data, computed, watch and methods blocks, with page and pageItems coming from an invisible mixin. Right: a script setup version where each concern is a small group of lines, and pagination comes from an explicitly imported usePagination composable that takes the filtered list as input.',
    props: {
      left: {
        label: 'Options API + mixin',
        lang: 'js',
        code: `export default {
  mixins: [paginationMixin],     // adds page, pageItems… (invisible)
  data() {
    return { products: [], query: '', favourites: [] }
  },
  computed: {
    filtered() { /* search */ },  // the mixin needs this exact name
  },
  watch: {
    query() { this.page = 1 },    // where does page come from?
    favourites(list) { /* … */ }, // Vue 3: fires only on replacement
  },
  async created() { /* load */ },
  methods: {
    isFavourite(id) { /* … */ },
    toggleFavourite(id) { /* … */ },
  },
}`,
      },
      right: {
        label: '<script setup> + composables',
        lang: 'js',
        code: `// search
const query = ref('')
const filtered = computed(() => /* … */)

// pagination: explicit input, explicit output
const { page, pageItems, nextPage, prevPage } =
  usePagination(filtered, 3)
watch(query, () => { page.value = 1 })

// favourites: one import, one line
const { isFavourite, toggleFavourite, savedMessage } =
  useFavourites()

// loading (was created())
load()`,
      },
      points: [
        'Options API splits one feature across `data`, `computed`, `watch` and `methods`; Composition API keeps each feature\'s lines together.',
        'The mixin\'s `page` and `pageItems` appear from nowhere; the composable\'s outputs are destructured in plain sight.',
        'The mixin silently required a property called `filtered`; the composable takes its input as an argument.',
        'The template did not change at all — a good sign the refactor preserved behaviour.',
      ],
    },
  },

  syntax: [
    `
#### The rules of a safe refactor

1. **Behaviour stays the same.** A refactoring PR changes structure only. Bug fixes and features go in separate PRs.
2. **Pin behaviour first.** Write *characterisation tests* — tests that record what the code does *today*, even the odd parts — before you move anything ([component tests](lesson:component-testing) and [E2E tests](lesson:e2e-and-quality)).
3. **Small, reversible steps.** Each step compiles, passes the tests and could be shipped on its own.
4. **Leave it better than you found it**, but only in code you're already changing.

#### Options API → Composition API: the mapping

`,
    {
      code: `// Options API                  →  Composition API (<script setup>)
data() { return { n: 0 } }      →  const n = ref(0)            // or reactive({ … })
computed: { x() { … } }         →  const x = computed(() => …)
methods: { f() { … } }          →  function f() { … }
watch: { x() { … } }            →  watch(x, …)   ·  for a prop: watch(() => props.x, …)
props / emits                   →  defineProps() / defineEmits()  ·  v-model: defineModel() (3.4+)
created()                       →  code at the top level of setup
mounted() / beforeUnmount()     →  onMounted() / onBeforeUnmount()
this.$refs.input                →  useTemplateRef('input') (3.5+)  ·  or const input = ref(null)
this.$emit('x')                 →  emit('x')    // const emit = defineEmits(['x'])
mixins: [m]                     →  const { … } = useM()        // a composable
this.$router / this.$route      →  useRouter() / useRoute()    // Vue Router
this.$attrs / this.$slots       →  useAttrs() / useSlots()`,
      lang: 'js',
      title: 'Options API → Composition API mapping',
      static: true,
    },
    `

#### Step by step, without a big bang

Options and Composition API can live in **the same component**. The \`setup()\` option runs first, and whatever it returns is available on \`this\` in the other options. That lets you move one concern at a time:
`,
    {
      code: `import { useFavourites } from './composables/useFavourites.js'
import paginationMixin from './mixins/paginationMixin.js'

export default {
  mixins: [paginationMixin],            // not migrated yet — still works
  props: { productId: Number },
  setup() {
    // Migrated concern: favourites now live in a composable
    const { favourites, toggleFavourite } = useFavourites()
    return { favourites, toggleFavourite } // → this.favourites, this.toggleFavourite
  },
  computed: {
    isFavourite() {
      return this.favourites.includes(this.productId) // options code reads setup bindings
    },
  },
}`,
      lang: 'js',
      title: 'mid-migration: both styles in one component',
      static: true,
    },
    `
The full sequence for one component:

0. **Tests** around its current behaviour (props in, rendered output, emitted events).
1. **Extract pure helpers** (formatting, calculations) into plain functions with unit tests. Lowest risk, instant win.
2. **Turn mixins into composables** with explicit inputs and outputs.
3. **Move concerns into \`setup()\`** one at a time — search, then pagination, then favourites — running the tests after each.
4. **Switch to \`<script setup>\`** once \`setup()\` holds everything; replace \`props\`/\`emits\` with the macros.
5. **Delete** the empty options and the unused mixin.

#### Mixins → composables
`,
    {
      code: `// Before — mixin: implicit inputs (this.filtered), invisible outputs
export default {
  data: () => ({ page: 1 }),
  computed: { pageItems() { return this.filtered.slice(/* … */) } },
}

// After — composable: input is an argument, outputs are returned
export function usePagination(source, perPage = 3) {
  const page = ref(1)
  const pageItems = computed(() => toValue(source).slice(/* … */))
  return { page, pageItems }
}`,
      lang: 'js',
      title: 'the same logic, made explicit',
      static: true,
    },
    `
The Vue guide lists the three problems with mixins: **unclear source** of properties, **name collisions** between mixins, and **implicit cross-mixin communication** through shared property names. Composables fix all three: you see every name you destructure, you can rename on destructure, and dependencies are passed as arguments.

#### Vue 2 → Vue 3: the changes that bite

Most breaking changes fail **loudly** — a compile error or a runtime exception you can't miss. A few fail **silently**, and those are the ones to hunt for:
`,
    {
      code: `<!-- ⚠ silent: .sync is not a Vue 3 modifier — the binding becomes one-way -->
<Modal :open.sync="isOpen" />            →  <Modal v-model:open="isOpen" />

<!-- ⚠ silent: v-model on a component now uses modelValue / update:modelValue -->
props: ['value'], $emit('input', v)      →  props: ['modelValue'], $emit('update:modelValue', v)

// ⚠ silent: Vue 2 lifecycle names are simply ignored by Vue 3 (not the compat build)
beforeDestroy() / destroyed()            →  beforeUnmount() / unmounted()

// ⚠ silent: array watchers fire only when the array is REPLACED
watch: { cart() {…} }                    →  watch: { cart: { handler() {…}, deep: true } }

// loud: removed APIs throw or fail to compile
{{ price | currency }}                   →  {{ formatCurrency(price) }}
this.$on / $off / $once (event bus)      →  emits, provide/inject, a store or a tiny emitter library
@click.native                            →  declare the event in emits (native listeners fall through)
new Vue({ … }), Vue.use(…)               →  createApp(App).use(…)
this.$set(obj, 'key', v)                 →  obj.key = v   (proxies track new keys)`,
      lang: 'js',
      title: 'Vue 2 → Vue 3 cheat sheet (not exhaustive)',
      static: true,
    },
    `
Background for these: [component v-model](lesson:component-v-model), [watchers](lesson:watch), [lifecycle hooks](lesson:lifecycle-hooks) and [fallthrough attributes](lesson:fallthrough-attrs). Others to check in the [official list](https://v3-migration.vuejs.org/breaking-changes/): \`v-if\` now has higher precedence than \`v-for\` on the same element, \`$listeners\` merged into \`$attrs\` (which now also includes \`class\` and \`style\`), transition classes renamed (\`v-enter\` → \`v-enter-from\`), async components need \`defineAsyncComponent\`, custom directive hooks renamed, \`data\` from mixins merges shallowly, and \`$children\` was removed.

#### Reviewing refactors and migrations

A reviewer's checklist for these pull requests:

- **Is it really a refactor?** Behaviour changes (even "obvious fixes") belong in their own PR.
- **Are there tests** that pinned behaviour *before* the change, and do they still pass unchanged?
- **Reactivity kept?** Destructuring \`props\` or a \`reactive()\` object into plain variables breaks reactivity (except destructuring straight from \`defineProps()\` in 3.5+). Composables should return refs.
- **Silent Vue 2 leftovers?** \`.sync\`, \`value\`/\`input\`, \`beforeDestroy\`, array watchers without \`deep\`.
- **Cleanup kept?** Every listener, timer or lock added in \`onMounted\` is removed in \`onBeforeUnmount\`/\`onUnmounted\`.
- **Is the PR small enough** to review properly? Large mechanical changes are easier to review when split from logic changes.
- **Style is automated**, not argued: lint rules and a formatter catch what humans shouldn't spend review time on.
`,
    {
      callout: 'version',
      title: 'Versions that matter here',
      text: 'Vue 2 reached end of life on **31 December 2023**; its final release is **2.7.16**. Vue 2.7 backported the Composition API, `<script setup>` and `v-bind()` in CSS to Vue 2 — but not `createApp()`, and its reactivity is still Vue 2\'s. In Vue 3: `toValue()` needs 3.3+, `defineModel()` 3.4+, `useTemplateRef()` and reactive props destructure 3.5+.',
    },
  ],

  walkthrough: {
    title: 'ProductList.vue — after the migration',
    lang: 'vue',
    code: productListMigrated,
    intro: 'This is where the playground\'s legacy component ends up (open the **Migrated** variant to run it). Every block is labelled with what it replaced.',
    steps: [
      { lines: [1, 5], text: 'Every name now has a visible origin: Vue APIs, the API module and two composables. With mixins, `page` or `pageItems` appeared on `this` and you had to search the codebase to find out where from.' },
      { lines: [7, 14], text: '`data()` became two refs. `created()` became a plain call at the top level of setup — setup runs at the same moment `created` used to, so the data starts loading just as early.' },
      { lines: [16, 21], text: 'Search is one small group: its state and its computed sit together instead of being split between the `data` and `computed` blocks.' },
      { lines: [23, 27], text: 'The mixin, replaced. `usePagination(filtered, 3)` takes its input **as an argument** — the mixin silently required the host to have a property named `filtered`. The query watcher resets the page, and you can now see that `page` came from the composable.' },
      { lines: [29, 30], text: 'Favourites moved to a composable that uses `{ deep: true }` — fixing the array-watcher behaviour Vue 3 changed. One line here, fully testable on its own.' },
      { lines: [33, 55], text: 'The template is **unchanged**. In a migration, the template is the contract with the user: if it doesn\'t need to change, you know the refactor kept the same names and behaviour.' },
    ],
  },

  playground: {
    title: 'Migrating a legacy product list',
    objective: 'Move a working Options API component with a mixin to `<script setup>` and a composable, and fix a silent Vue 2 → 3 bug on the way.',
    files: legacyFiles,
    entry: 'App.vue',
    expected: 'A searchable product list, three items per page, with **Previous/Next** buttons and a ☆ button per product. Search for "lamp" and the list jumps back to page 1. One thing is broken: clicking ☆ toggles the star, but the "Saved … favourite(s)" message never appears.',
    experiments: [
      {
        id: 'write-composable',
        task: '**Step 1 — composable.** Implement `usePagination(source, perPage = 3)` in `composables/usePagination.js` by porting `mixins/paginationMixin.js`. Return `{ page, pageCount, pageItems, nextPage, prevPage }`. Don\'t wire it into the component yet — the app should keep working exactly as before.',
        hint: 'Read the source with `const items = computed(() => toValue(source))`, then copy the mixin\'s logic, replacing `this.filtered` with `items.value` and `this.page` with `page.value`.',
        tests: [
          {
            name: 'paginates a ref of items',
            code: `const { ref } = requireModule('vue')
const { usePagination } = requireModule('composables/usePagination.js')
const items = ref(['a', 'b', 'c', 'd', 'e', 'f', 'g'])
const p = withSetup(() => usePagination(items, 3))
expect(p.pageItems.value).toEqual(['a', 'b', 'c'])
expect(p.pageCount.value).toBe(3)
p.nextPage()
expect(p.page.value).toBe(2)
expect(p.pageItems.value).toEqual(['d', 'e', 'f'])
p.prevPage()
p.prevPage()
expect(p.page.value).toBe(1)`,
          },
          {
            name: 'follows its source and accepts a getter',
            code: `const { ref } = requireModule('vue')
const { usePagination } = requireModule('composables/usePagination.js')
const list = ref([1, 2, 3, 4, 5])
const p = withSetup(() => usePagination(() => list.value.filter((n) => n % 2), 2))
expect(p.pageItems.value).toEqual([1, 3])
expect(p.pageCount.value).toBe(2)
list.value = [1]
expect(p.pageCount.value).toBe(1)`,
          },
        ],
        explain: 'You wrote the new version **beside** the old one, without touching the component. That\'s the first rule of a migration: build the replacement, prove it with tests, then switch over. The composable\'s input is an argument, so it no longer cares what the host calls its list.',
      },
      {
        id: 'script-setup',
        task: '**Step 2 — switch over.** Rewrite `ProductList.vue` with `<script setup>`: refs for state, a `computed` for `filtered`, your `usePagination(filtered, 3)`, a `watch` on `query` that resets `page`, and favourites as plain refs and functions (inline for now). Remove the mixin. **Don\'t touch the template** — the behaviour must stay identical.',
        hint: 'Use the mapping table from the Syntax section. `created()` becomes a `load()` call at the top level of setup; `this.page = 1` becomes `page.value = 1`.',
        tests: [
          {
            name: 'ProductList uses <script setup> and no mixin',
            code: `const C = requireModule('ProductList.vue').default
expect(typeof C.setup).toBe('function')
expect(C.mixins).toBeUndefined()
expect(C.methods).toBeUndefined()`,
          },
          {
            name: 'behaviour is unchanged: paging and search',
            code: `await wait(300)
expect(text('.page-label')).toBe('Page 1 of 3')
expect(findAll('.products li')).toHaveLength(3)
await click('.next')
expect(text('.page-label')).toBe('Page 2 of 3')
await type('.search', 'lamp')
expect(text('.page-label')).toBe('Page 1 of 1')
expect(findAll('.products li')).toHaveLength(3)`,
          },
        ],
        explain: 'The tests that described the old component pass against the new one — that\'s what makes this a refactor rather than a rewrite. Notice the code now reads top to bottom by **feature** (loading, search, pagination, favourites) instead of by **option type**.',
      },
      {
        id: 'array-watcher',
        task: '**Migration bug hunt.** Clicking ☆ should show **Saved 1 favourite(s)** in the status line. This code worked in Vue 2. Find out why it does nothing in Vue 3 and fix it (in whichever version of the component you have now).',
        hint: 'Vue 3 changed array watchers: they fire only when the array is *replaced*. `push` and `splice` mutate it. Options API: `favourites: { handler(list) {…}, deep: true }`. Composition API with a ref: `watch(favourites, cb, { deep: true })`.',
        tests: [
          {
            name: 'starring a product shows the saved message',
            code: `await wait(300)
await click('.fav')
expect(attr('.fav', 'aria-pressed')).toBe('true')
expect(text('.saved')).toBe('Saved 1 favourite(s)')`,
          },
          {
            name: 'un-starring updates the message again',
            code: `await wait(300)
await click('.fav')
await click('.fav')
expect(attr('.fav', 'aria-pressed')).toBe('false')
expect(text('.saved')).toBe('Saved 0 favourite(s)')`,
          },
        ],
        explain: 'This is a **silent** breaking change: no error, no warning, just a feature that stopped working. Vue 2 notified array watchers on mutation; Vue 3\'s array watchers fire only on replacement unless `deep` is set. Silent changes are why you need behaviour tests before migrating.',
      },
      {
        id: 'compare',
        task: 'Pick **Migrated** in the example menu above the editor and compare it with your version. Then pick **Mid-migration**: the component uses a `setup()` option *and* the old mixin at the same time, and still works.',
        hint: 'Loading an example replaces the editor\'s files, so copy anything of yours you want to keep first. **Starting point** brings back the original legacy files.',
        explain: 'The mid-migration variant is how big teams really migrate: one concern moves into `setup()`, the PR ships, and the next concern follows. `setup()` bindings are available on `this` in the remaining options, so both styles cooperate during the transition.',
      },
    ],
    variants: [
      { id: 'start', label: 'Starting point (legacy Options API)', files: legacyFiles },
      {
        id: 'migrated',
        label: 'Migrated (<script setup> + composables)',
        files: {
          'App.vue': appVue,
          'ProductList.vue': productListMigrated,
          'composables/usePagination.js': usePaginationDone,
          'composables/useFavourites.js': useFavouritesDone,
          'api.js': productsApi,
        },
      },
      {
        id: 'mid-migration',
        label: 'Mid-migration (setup() + mixin together)',
        files: {
          'App.vue': appVue,
          'ProductList.vue': `<script>
import { fetchProducts } from './api.js'
import paginationMixin from './mixins/paginationMixin.js'
import { useFavourites } from './composables/useFavourites.js'

export default {
  name: 'ProductList',
  mixins: [paginationMixin], // still here — pagination is the next PR
  setup() {
    // Already migrated: favourites (with the deep-watch fix inside)
    const { savedMessage, isFavourite, toggleFavourite } = useFavourites()
    return { savedMessage, isFavourite, toggleFavourite } // available as this.*
  },
  data() {
    return { products: [], loading: true, query: '' }
  },
  computed: {
    filtered() {
      const q = this.query.trim().toLowerCase()
      return this.products.filter((p) => p.name.toLowerCase().includes(q))
    },
  },
  watch: {
    query() {
      this.page = 1
    },
  },
  async created() {
    this.products = await fetchProducts()
    this.loading = false
  },
}
</script>

${productListTemplate}`,
          'mixins/paginationMixin.js': paginationMixin,
          'composables/useFavourites.js': useFavouritesDone,
          'api.js': productsApi,
        },
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'A Vue 2 → Vue 3 migration roadmap',
    caption: 'Every stage leaves you with a working, shippable app. Simplified — the official migration guide has the detailed checklist.',
    alt: 'A six-step roadmap: pin behaviour with tests; upgrade to Vue 2.7; remove Vue 2-only APIs such as filters, the event bus, .native and .sync; audit dependencies and build tooling; switch to Vue 3 with the @vue/compat migration build and fix warnings; remove the compat build and adopt the Composition API gradually.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'tests', label: 'Pin behaviour', note: 'characterisation + E2E tests', tone: 'acid' },
        { id: 'v27', label: 'Vue 2.7', note: 'Composition API on Vue 2', tone: 'paper' },
        { id: 'clean', label: 'Remove Vue 2-only APIs', note: 'filters, $on, .native, .sync', tone: 'paper' },
        { id: 'deps', label: 'Audit dependencies', note: 'router, store, UI kit, build tool', tone: 'kraft' },
        { id: 'compat', label: 'Vue 3 + @vue/compat', note: 'fix warnings one by one', tone: 'cobalt' },
        { id: 'vue3', label: 'Plain Vue 3', note: 'remove compat · migrate gradually', tone: 'ink' },
      ],
      edges: [
        { from: 'tests', to: 'v27' },
        { from: 'v27', to: 'clean' },
        { from: 'clean', to: 'deps' },
        { from: 'deps', to: 'compat' },
        { from: 'compat', to: 'vue3' },
      ],
      steps: [
        { focus: ['tests'], text: '**Pin behaviour first.** A handful of end-to-end tests on the money paths (log in, search, checkout) plus component tests on risky components. These are your "photos of the house".' },
        { focus: ['v27'], edges: ['tests->v27'], text: '**Upgrade to Vue 2.7** (final release 2.7.16). It backports the Composition API and `<script setup>`, so new and refactored code can already be written the Vue 3 way — while still running on Vue 2.' },
        { focus: ['clean'], edges: ['v27->clean'], text: '**Remove Vue 2-only patterns while still on Vue 2**: filters → functions, event bus → emits/stores, `.native`, `.sync` → `v-model:prop` style events, deprecated slot syntax. Each is a small PR that ships on its own.' },
        { focus: ['deps'], edges: ['clean->deps'], text: '**Audit dependencies.** Vue Router 3 → 4, Vuex 3 → Vuex 4 or Pinia, and — often the real blocker — your UI component library and build tooling (many teams move to Vite). A library with no Vue 3 version can decide your timeline.' },
        { focus: ['compat'], edges: ['deps->compat'], text: '**Switch to Vue 3 with `@vue/compat`**, the migration build. It runs most Vue 2 code and warns about every deprecated usage, so you fix warnings incrementally. It\'s a temporary bridge with known limits (e.g. libraries relying on Vue 2 internals).' },
        { focus: ['vue3'], edges: ['compat->vue3'], text: '**Remove the compat build** once the warnings are gone. Now migrate components to the Composition API *gradually* — Vue 3 still fully supports the Options API, so there is no deadline for that part.' },
      ],
    },
  },

  internals: {
    beginner: `
Both API styles end up as the same thing inside Vue: a component instance with reactive state and a render function. The Options API is built *on top of* the same reactivity system the Composition API exposes — \`data()\` becomes a \`reactive()\` object, \`computed\` options become \`computed()\` refs, \`watch\` options become \`watch()\` calls. That's why both styles can share one component, and why migrating is a reorganisation, not a rewrite of the logic.
`,
    technical: [
      `
**Order inside one component.** Vue runs \`setup()\` first, then applies the Options API: the \`beforeCreate\` hook, then \`inject\`, \`methods\`, \`data\`, \`computed\`, \`watch\` and \`provide\`, then the \`created\` hook. Setup bindings are merged into the instance's render context, so options code can read them via \`this\`; \`setup()\` itself has no \`this\` and can't see options.

**Why array watchers changed.** A \`watch\` option on \`cart\` is effectively \`watch(() => this.cart, cb)\`. Pushing to the array doesn't change *which* array that getter returns — it's the same proxy — so the callback isn't called. Vue 2 instead patched array mutation methods and notified the array's own dependency. With \`deep: true\`, Vue 3 traverses the array's contents while watching, so mutations are tracked.

**Why some Vue 2 code fails silently.** Vue 3 doesn't recognise \`beforeDestroy\` (outside the compat build), so the function is just an unknown option and never called. \`.sync\` isn't a Vue 3 \`v-bind\` modifier, so the prop is bound one-way and no \`update:\` listener is registered. A child declaring \`props: ['value']\` receives nothing from \`v-model\` (which now passes \`modelValue\`), and the unused \`modelValue\` falls through to the root element as an HTML attribute — check the DOM and you'll literally see \`modelvalue="…"\`.
`,
      {
        code: `// What v-model on a component compiles to (simplified)
// Vue 2:  <Child v-model="name" />
h(Child, { props: { value: name }, on: { input: (v) => (name = v) } })

// Vue 3:  <Child v-model="name" />
h(Child, { modelValue: name, 'onUpdate:modelValue': (v) => (name = v) })`,
        lang: 'js',
        title: 'the v-model contract, before and after',
      },
      `
**Reactivity engine.** Vue 2 (2.7 included) converts objects with \`Object.defineProperty\` getters/setters, so new properties need \`Vue.set\` and setting an array index directly isn't tracked. Vue 3 uses \`Proxy\`, which sees added and deleted properties, index writes, \`Map\` and \`Set\`. Code that works around Vue 2's limits (\`this.$set\`, \`splice\` instead of index writes) keeps working in Vue 3 — the workarounds just stop being necessary. \`Vue.set\`/\`this.$set\` themselves were removed.

**The migration build** (\`@vue/compat\`) is a Vue 3 build that runs in "Vue 2 mode" by default: deprecated behaviour is reimplemented and each use logs a warning. Compatibility can be configured globally or per component (\`compatConfig\`), so you can flip features to Vue 3 behaviour one at a time.
`,
    ],
    production: `
- **Don't migrate blind.** Add end-to-end tests for the critical user journeys first; they survive any internal restructuring.
- **One kind of change per PR.** Mechanical renames, structural refactors and behaviour changes in separate PRs keep reviews honest and reverts cheap.
- **Let tooling find leftovers.** \`eslint-plugin-vue\` has rules for Vue 2-only syntax (for example \`vue/no-deprecated-filter\`, \`vue/no-deprecated-v-bind-sync\`, \`vue/no-deprecated-destroyed-lifecycle\`, \`vue/no-deprecated-dollar-listeners-api\`, \`vue/require-explicit-emits\`). Run them across the codebase before and during the move.
- **Dependencies decide the schedule.** Check every Vue-dependent package for a Vue 3 version before committing to dates. Vue CLI is in maintenance mode; most teams move to Vite during the migration.
- **Staying on Vue 2 is a risk decision, not a technical one.** After end of life there are no official fixes, including security fixes. If you must stay, the official EOL page lists paid extended-support options; communicate the risk to stakeholders in writing.
- **Don't migrate the whole codebase to the Composition API just because you can.** Vue 3 fully supports the Options API. Convert components when you're already changing them, or when logic needs to be shared. When you do split a big component, the [design patterns lesson](lesson:design-patterns) shows the shapes to aim for.
- **Code review culture:** review the change, not the person; say *why* ("this loses reactivity because…"); mark blocking issues clearly versus nits; keep PRs small enough to review in one sitting; automate formatting so humans discuss design.
`,
  },

  mistakes: [
    {
      title: 'The big-bang rewrite',
      wrong: { code: `// "Let's rewrite the app in Vue 3 on a branch and merge in three months."\n// Meanwhile main gets 400 new commits and the branch never lands.`, lang: 'js' },
      right: { code: `// Week 1: tests for the checkout journey\n// Week 2: filters → functions (ships)\n// Week 3: event bus → store (ships)\n// …each step merged to main and released`, lang: 'js' },
      explanation: 'Long-lived rewrite branches drift away from production and rediscover old bugs. Incremental steps keep the app shippable and the risk small at every point.',
    },
    {
      title: 'Translating option-by-option instead of grouping by concern',
      wrong: { code: `// --- "data"\nconst products = ref([])\nconst query = ref('')\nconst favourites = ref([])\n// --- "computed"\nconst filtered = computed(/* … */)\n// --- "methods"\nfunction toggleFavourite() { /* … */ }`, lang: 'js' },
      right: { code: `// search\nconst query = ref('')\nconst filtered = computed(/* … */)\n\n// favourites\nconst { isFavourite, toggleFavourite } = useFavourites()`, lang: 'js' },
      explanation: 'The point of the Composition API is organising code by **feature**. Recreating the old `data`/`computed`/`methods` sections inside `<script setup>` keeps all the old problems with new syntax.',
    },
    {
      title: 'Losing reactivity while destructuring props',
      wrong: { code: `const props = defineProps({ max: Number })\nconst { max } = props            // a one-time copy\nconst canIncrease = computed(() => qty.value < max) // never updates`, lang: 'js' },
      right: { code: `const props = defineProps({ max: Number })\nconst canIncrease = computed(() => qty.value < props.max)\n\n// Vue 3.5+ also allows: const { max } = defineProps({ max: Number })`, lang: 'js' },
      explanation: '`this.max` was always live in the Options API. A plain destructure of the `props` object copies the current value. Read `props.max`, use `toRefs(props)`, or — in Vue 3.5+ — destructure directly from the `defineProps()` call, which the compiler keeps reactive.',
    },
    {
      title: 'Leaving Vue 2 lifecycle names behind',
      wrong: { code: `export default {\n  mounted() { window.addEventListener('resize', this.onResize) },\n  beforeDestroy() { window.removeEventListener('resize', this.onResize) }, // never runs in Vue 3\n}`, lang: 'js' },
      right: { code: `export default {\n  mounted() { window.addEventListener('resize', this.onResize) },\n  beforeUnmount() { window.removeEventListener('resize', this.onResize) },\n}`, lang: 'js' },
      explanation: 'Vue 3 renamed `beforeDestroy`/`destroyed` to `beforeUnmount`/`unmounted`. The old names are silently ignored, so cleanup never runs and listeners pile up each time the component is shown.',
    },
    {
      title: 'Mixing a refactor with a behaviour change',
      explanation: 'A PR titled "Migrate CartPage to script setup" that also "fixes" the discount rounding is impossible to review: when a test changes, is that the intended fix or a migration bug? Ship the refactor with tests unchanged, then fix the rounding in a separate PR.',
    },
  ],

  debugging: [
    {
      symptom: 'A custom input migrated from Vue 2 shows empty, typing doesn\'t update the parent, and the DOM shows a `modelvalue="…"` attribute.',
      cause: 'The child still uses the Vue 2 v-model contract (`value` prop + `input` event); Vue 3 passes `modelValue` and listens for `update:modelValue`.',
      fix: 'Rename the prop to `modelValue`, emit `update:modelValue` and declare it in `emits` — or use `defineModel()` (3.4+).',
    },
    {
      symptom: 'Clicking a child\'s toggle never updates the parent, with no error.',
      cause: 'The parent uses `:prop.sync="x"`. Vue 3 has no `.sync` modifier, so the binding is one-way and no listener is attached.',
      fix: 'Replace `:open.sync="x"` with `v-model:open="x"`. The child\'s `update:open` event already matches.',
    },
    {
      symptom: 'Listeners, timers or locks pile up every time a component is shown and hidden.',
      cause: 'Cleanup lives in `beforeDestroy`/`destroyed`, which Vue 3 ignores.',
      fix: 'Rename to `beforeUnmount`/`unmounted` (or `onBeforeUnmount`/`onUnmounted`). Lint with `vue/no-deprecated-destroyed-lifecycle`.',
    },
    {
      symptom: 'A watcher on an array stopped firing after the upgrade.',
      cause: 'Vue 3 array watchers only fire when the array is replaced; `push`/`splice` mutate it.',
      fix: 'Add `deep: true`, or replace the array instead of mutating it (`list.value = [...list.value, item]`).',
    },
    {
      symptom: '`TypeError: this.$on is not a function` (or `$off`, `$once`).',
      cause: 'A Vue 2 event bus — the instance event API was removed in Vue 3.',
      fix: 'Replace with emits for parent/child, provide/inject for subtrees, a store for shared state, or a small external emitter library as a last resort.',
    },
    {
      symptom: '`Cannot read properties of undefined` on an element that has both `v-for` and `v-if`.',
      cause: 'In Vue 3 `v-if` has higher precedence than `v-for`, so the `v-if` runs before the loop variable exists.',
      fix: 'Filter with a computed (`visibleItems`) or move `v-for` to a wrapping `<template>`.',
    },
  ],

  bestPractices: [
    'Pin current behaviour with tests before moving any code — including the weird parts.',
    'Keep refactors behaviour-preserving and separate from fixes and features.',
    'Migrate concern by concern; `setup()` and Options API can coexist during the transition.',
    'Turn mixins into composables with explicit arguments and returned refs.',
    'Hunt the silent Vue 2 leftovers first: `.sync`, `value`/`input`, `beforeDestroy`/`destroyed`, array watchers.',
    'Audit dependencies (router, store, UI library, build tool) before committing to a migration timeline.',
    'Automate style and deprecated-syntax checks with lint rules so reviews focus on design and correctness.',
  ],

  useCases: [
    'Moving a Vue 2.6 app to 2.7, then to Vue 3 with the migration build, then to plain Vue 3.',
    'Converting a 900-line Options API component into `<script setup>` plus three composables while shipping weekly.',
    'Replacing a set of overlapping mixins (`formMixin`, `validationMixin`, `apiMixin`) with explicit composables.',
    'Removing a global event bus in favour of emits, provide/inject and a Pinia store.',
    'Reviewing a teammate\'s migration PR with a checklist of silent breaking changes.',
  ],

  whenToUse: {
    use: [
      'Code you must change often is hard to change safely — refactor it as part of that work.',
      'You are on Vue 2, which no longer receives official fixes, including security fixes.',
      'Mixins collide, hide where properties come from, or depend on each other implicitly.',
      'One component mixes several unrelated features and blocks parallel work.',
    ],
    avoid: [
      'Rewriting stable code nobody needs to change, just to use newer syntax.',
      'Converting every Options API component to the Composition API in one sweep — Vue 3 fully supports both.',
      'Refactoring code with no tests and no way to verify behaviour — write the tests first.',
      'Starting a framework migration before checking that critical dependencies support Vue 3.',
    ],
  },

  comparison: {
    title: 'Where a Vue codebase can be today',
    headers: ['', 'Vue 2.6', 'Vue 2.7', 'Vue 3 + @vue/compat', 'Vue 3'],
    rows: [
      ['Composition API', 'only via the `@vue/composition-api` plugin', 'built in', 'built in', 'built in'],
      ['`<script setup>`', 'no', 'yes', 'yes', 'yes'],
      ['Reactivity', 'getters/setters — `Vue.set` for new keys', 'same Vue 2 engine', 'Vue 3 proxies', 'Vue 3 proxies'],
      ['Vue 2 APIs (filters, `$on`, `new Vue`)', 'yes', 'yes', 'mostly, each use warns (configurable)', 'removed'],
      ['Official support', 'ended 31 Dec 2023 (all of Vue 2)', 'ended 31 Dec 2023 — final release 2.7.16', 'a temporary migration bridge', 'actively maintained'],
    ],
    note: 'Vue 2.7 is the best place to wait while dependencies catch up: you can already write Composition API code that will move to Vue 3 with few changes.',
  },

  quiz: [
    {
      id: 'legacy-migration-q1',
      type: 'mcq',
      prompt: 'Vue 2 reached end of life on 31 December 2023. What does that mean for an app still running Vue 2?',
      options: [
        { text: 'It no longer gets official updates or fixes — security fixes included — though existing apps keep running' },
        { text: 'The app stops working in browsers from that date', why: 'Already-built apps keep running; EOL is about support, not a kill switch.' },
        { text: 'Vue 2.7 keeps receiving new features for another two years', why: 'EOL means no new features, updates or fixes for any Vue 2 version.' },
        { text: 'npm removes Vue 2 so you can no longer install it', why: 'Vue 2 remains available on its existing distribution channels.' },
      ],
      answer: 0,
      explanation: 'End of life is a support statement: no more official releases. The app works, but newly discovered vulnerabilities won\'t be fixed by the core team and the ecosystem moves on. Paid extended support exists for teams that can\'t migrate yet.',
    },
    {
      id: 'legacy-migration-q2',
      type: 'output',
      prompt: 'This Vue 2-style code now runs on **Vue 3**. The button is clicked once. What does the `<p>` show?',
      code: {
        lang: 'vue',
        code: `<!-- Child.vue -->
<script>
export default {
  props: { open: Boolean },
  methods: { toggle() { this.$emit('update:open', !this.open) } },
}
</script>
<template><button @click="toggle">Toggle</button></template>

<!-- App.vue -->
<script setup>
import { ref } from 'vue'
import Child from './Child.vue'
const open = ref(false)
</script>
<template>
  <Child :open.sync="open" />
  <p>{{ open }}</p>
</template>`,
      },
      options: [
        'false',
        { text: 'true', why: 'Vue 3 has no `.sync` modifier. The prop is bound one-way and nobody listens for `update:open`.' },
        { text: 'A compile error', why: 'It compiles without complaint — which is exactly what makes it dangerous.' },
        { text: 'undefined', why: '`open` is still the ref initialised to `false`; it just never changes.' },
      ],
      answer: 0,
      explanation: 'A silent breaking change: `:open.sync` becomes a plain one-way binding. Replace it with `v-model:open="open"`, which listens for the same `update:open` event.',
    },
    {
      id: 'legacy-migration-q3',
      type: 'bug',
      prompt: 'This component was copied from a Vue 2 app into a Vue 3 app. After it is shown and hidden a few times, every window resize runs several handlers. Click the line responsible.',
      code: {
        lang: 'js',
        code: `export default {
  data() {
    return { width: window.innerWidth }
  },
  mounted() {
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
  },
  methods: {
    onResize() {
      this.width = window.innerWidth
    },
  },
}`,
      },
      answerLine: 8,
      explanation: 'Vue 3 renamed `beforeDestroy` to `beforeUnmount` and ignores the old name, so the listener is never removed. Each mount adds another one.',
    },
    {
      id: 'legacy-migration-q4',
      type: 'fill',
      prompt: 'Complete the migration of these options into `<script setup>`.',
      code: {
        lang: 'js',
        code: `// data() { return { count: 0 } }
const count = ___(0)

// mounted() { this.startPolling() }
___(() => startPolling())

// beforeDestroy() { this.stopPolling() }   (Vue 2 name)
onBeforeUnmount(() => stopPolling())`,
      },
      answer: [['ref'], ['onMounted']],
      explanation: '`data` becomes refs, and each lifecycle option has an `on…` function. Note the Vue 2 `beforeDestroy` maps to Vue 3\'s `onBeforeUnmount`.',
    },
    {
      id: 'legacy-migration-q5',
      type: 'mcq',
      prompt: 'Which of these are real Vue 2 → Vue 3 breaking changes? (Select all that apply.)',
      options: [
        { text: 'Filters (`{{ price | currency }}`) were removed' },
        { text: '`$on`, `$off` and `$once` were removed, ending the instance event-bus pattern' },
        { text: '`v-model` on components uses `modelValue` / `update:modelValue` by default' },
        { text: 'The Options API was removed', why: 'Vue 3 fully supports the Options API. Migrating to the Composition API is optional.' },
        { text: '`computed` properties must now be written as watchers', why: 'Computed properties work as before, in both API styles.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Filters, the instance events API and the component v-model contract all changed. The Options API and computed properties are alive and well in Vue 3.',
    },
    {
      id: 'legacy-migration-q6',
      type: 'mcq',
      prompt: 'You must restructure a 1,000-line legacy component that has no tests. What should you do first?',
      options: [
        { text: 'Write characterisation tests that pin its current behaviour' },
        { text: 'Convert it to TypeScript', why: 'Types help, but they don\'t verify behaviour, and converting is itself a risky change without tests.' },
        { text: 'Rewrite it from scratch in `<script setup>`', why: 'A rewrite throws away years of edge-case fixes and gives you nothing to compare against.' },
        { text: 'Rename the variables to modern conventions', why: 'Cosmetic churn first makes the diff noisier and still leaves you with no safety net.' },
      ],
      answer: 0,
      explanation: 'Tests that describe what the code does today let every later step be checked. Without them, you can\'t tell a refactor from a regression.',
    },
    {
      id: 'legacy-migration-q7',
      type: 'short',
      prompt: 'Name the three problems with mixins that composables solve, and explain how composables solve them.',
      answer: 'Unclear source: with several mixins you can\'t tell where `this.page` came from; composables return values you destructure explicitly. Name collisions: two mixins defining the same property silently clash; with composables you rename on destructure. Implicit cross-mixin communication: mixins depend on each other (or on the host) through shared property names like `this.filtered`; composables take their dependencies as arguments.',
    },
  ],

  exercises: [
    {
      id: 'quantity-picker-script-setup',
      title: 'Migrate an Options API component to <script setup>',
      difficulty: 'intermediate',
      prompt: `
\`QuantityPicker.vue\` works, but it's written in the Options API. Rewrite its \`<script>\` as \`<script setup>\` **without changing behaviour or the template**.

- Props \`modelValue\` (Number, required), \`max\` (Number, default 10), \`autofocus\` (Boolean) via \`defineProps\`; the \`update:modelValue\` event via \`defineEmits\`.
- \`canDecrease\` / \`canIncrease\` become \`computed\`.
- The \`max\` watcher still clamps the quantity when stock drops (watch a getter: \`() => props.max\`).
- On mount, if \`autofocus\` is set, focus the **+** button (\`ref="increaseBtn"\`) — use \`useTemplateRef()\` (Vue 3.5+) or \`ref(null)\`.
- No \`data\`, \`computed\`, \`methods\`, \`watch\` or \`mounted\` options may remain.
- Keep the classes the tests use: \`.inc\`, \`.dec\`, \`.qty\`; the app shows \`.summary\` and a \`.sell-out\` button.
`,
      files: {
        'App.vue': quantityApp,
        'QuantityPicker.vue': quantityStarter,
      },
      hints: [
        'Start with `const props = defineProps({...})` and `const emit = defineEmits([\'update:modelValue\'])`, copying the existing definitions.',
        'Every `this.x` becomes `props.x` for props, `emit(…)` for `this.$emit(…)`, and `.value` for computeds. The watcher becomes `watch(() => props.max, (newMax) => {…})`.',
        '`this.$refs.increaseBtn` → `const increaseButton = useTemplateRef(\'increaseBtn\')`, then `onMounted(() => { if (props.autofocus) increaseButton.value.focus() })`.',
      ],
      solution: {
        explanation: 'Each option has a direct Composition API equivalent, and the template didn\'t change because the names it uses (`modelValue`, `canDecrease`, `increase`…) are still exposed. Two traps avoided: watching `props.max` needs a getter (`watch(props.max, …)` would watch a plain number), and the template ref variable is named differently from the function `increase` so the names can\'t clash. With Vue 3.4+, `defineModel()` could replace the prop + emit pair.',
        files: {
          'App.vue': quantityApp,
          'QuantityPicker.vue': quantitySolution,
        },
      },
      tests: [
        {
          name: 'uses <script setup> with no leftover options',
          code: `const C = requireModule('QuantityPicker.vue').default
expect(typeof C.setup).toBe('function')
expect(C.data).toBeUndefined()
expect(C.computed).toBeUndefined()
expect(C.methods).toBeUndefined()
expect(C.watch).toBeUndefined()
expect(C.mounted).toBeUndefined()`,
        },
        {
          name: 'v-model still works in both directions',
          code: `await click('.inc')
expect(text('.summary')).toBe('3 in basket · 5 in stock')
await click('.dec')
await click('.dec')
expect(text('.qty')).toBe('1')
expect(find('.dec').disabled).toBe(true)`,
        },
        {
          name: 'never goes above max',
          code: `for (let i = 0; i < 6; i++) await click('.inc')
expect(text('.qty')).toBe('5')
expect(find('.inc').disabled).toBe(true)`,
        },
        {
          name: 'clamps the quantity when max drops',
          code: `await click('.sell-out')
expect(text('.summary')).toBe('1 in basket · 1 in stock')`,
        },
        { name: 'autofocus focuses the + button on mount', code: `expect(document.activeElement).toBe(find('.inc'))` },
      ],
    },
    {
      id: 'vue2-leftovers',
      title: 'Hunt down three silent Vue 2 leftovers',
      difficulty: 'advanced',
      prompt: `
These components were copied from a Vue 2 app. Nothing throws an error, but three things are broken in Vue 3. Fix them:

1. **The name field** (\`TextField.vue\`) starts empty and typing doesn't update \`.greeting\` (expected **Hello, Ada!** at first, then e.g. **Hello, Grace!**). Make it follow Vue 3's component \`v-model\` contract, and declare the event in \`emits\`.
2. **The tips toggle** (\`.tips-toggle\`) never opens the \`.tips\` panel. The child (\`Disclosure.vue\`) is fine — look at how \`App.vue\` binds \`open\`.
3. **The scroll lock** (\`.lock-status\`) turns **on** when the tips open but never turns **off** again after they close. Look at \`TipsPanel.vue\`.

Keep the existing classes: \`.name-field input\`, \`.greeting\`, \`.tips-toggle\`, \`.tips\`, \`.lock-status\`.
`,
      files: {
        'App.vue': leftoversAppStarter,
        'TextField.vue': textFieldStarter,
        'Disclosure.vue': disclosure,
        'TipsPanel.vue': tipsPanelStarter,
        'scrollLock.js': scrollLock,
      },
      hints: [
        'Inspect the DOM in the preview: the `<label>` around the name field carries a `modelvalue="Ada"` attribute. What prop name does Vue 3\'s `v-model` pass?',
        '`.sync` is not a Vue 3 modifier. The Vue 3 equivalent of `:open.sync="x"` is `v-model:open="x"`.',
        'Vue 3 renamed two lifecycle hooks: `beforeDestroy` → `beforeUnmount`, `destroyed` → `unmounted`.',
      ],
      solution: {
        explanation: 'All three are silent breaking changes, which is why they survived the copy-paste: (1) Vue 3\'s component `v-model` passes `modelValue` and listens for `update:modelValue`, so the old `value`/`input` pair receives nothing and the unknown `modelValue` falls through as an HTML attribute. (2) `.sync` was folded into `v-model:prop`; the child\'s `update:open` event already matches, so only the parent changes. (3) `beforeDestroy` is ignored by Vue 3, so `unlock()` never ran — the hook is now `beforeUnmount`. Lint rules such as `vue/no-deprecated-v-bind-sync` and `vue/no-deprecated-destroyed-lifecycle` catch these automatically.',
        files: {
          'App.vue': leftoversAppSolution,
          'TextField.vue': textFieldSolution,
          'Disclosure.vue': disclosure,
          'TipsPanel.vue': tipsPanelSolution,
          'scrollLock.js': scrollLock,
        },
      },
      tests: [
        { name: 'the name field starts with the parent value', code: `expect(find('.name-field input').value).toBe('Ada')` },
        {
          name: 'typing updates the greeting',
          code: `await type('.name-field input', 'Grace')
expect(text('.greeting')).toBe('Hello, Grace!')`,
        },
        {
          name: 'TextField declares the event it emits',
          code: `const C = requireModule('TextField.vue').default
const emits = Array.isArray(C.emits) ? C.emits : Object.keys(C.emits || {})
expect(emits).toContain('update:modelValue')`,
        },
        {
          name: 'the tips toggle opens and closes the panel',
          code: `await click('.tips-toggle')
expect(exists('.tips')).toBe(true)
expect(attr('.tips-toggle', 'aria-expanded')).toBe('true')
await click('.tips-toggle')
expect(exists('.tips')).toBe(false)`,
        },
        {
          name: 'closing the tips releases the scroll lock',
          code: `await click('.tips-toggle')
expect(text('.lock-status')).toBe('Scroll lock: on')
await click('.tips-toggle')
expect(text('.lock-status')).toBe('Scroll lock: off')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'legacy-migration-vue2-eol',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Vue 2 reached end of life. What does that mean in practice, and how would you explain the risk to a non-technical stakeholder?',
      answer: 'Since 31 December 2023 Vue 2 gets no new features, updates or fixes from the core team — security fixes included. Existing apps keep running, but any newly found vulnerability stays unfixed (unless the company pays for extended support), and libraries gradually drop Vue 2. For a stakeholder: "the app works today, but we\'re on a version that will never get another security patch, and that risk grows every month".',
      explanation: 'EOL is about support and ecosystem, not about the app breaking overnight. The decision is a risk trade-off: migrate, buy extended support, or accept and document the risk.',
      whyAsked: 'Many companies still run Vue 2. Interviewers want to see that you understand the business side, not just the code changes.',
      mistakes: ['Saying the app will stop working.', 'Ignoring the security dimension.', 'Not mentioning options other than an immediate rewrite.'],
      followUps: ['What would you do first if you were asked to plan the migration?', 'Why is Vue 2.7 a useful stepping stone?', 'What are the alternatives if migration must wait?'],
      modelAnswer: 'End of life means the core team stopped releasing anything for Vue 2 after 31 December 2023 — no features, no bug fixes and, importantly, no security patches. The app doesn\'t break; it just stops getting fixes, and libraries move on to Vue 3 over time. I\'d explain it as growing, unpatched risk. The options are to migrate — usually incrementally via Vue 2.7 and the migration build — to buy extended commercial support, or to accept the risk explicitly and in writing.',
    },
    {
      id: 'legacy-migration-coexist',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Can the Options API and the Composition API be used in the same component? How does that help a migration?',
      answer: 'Yes. An Options API component can have a `setup()` option; it runs before the other options, and whatever it returns is available on `this` in `computed`, `methods`, `watch` and the template. That lets a team move one concern at a time into `setup()` (often by calling a composable), ship it, and continue — instead of converting the whole component in one risky step.',
      explanation: 'Both styles sit on the same reactivity system and the same component instance, so they interoperate. `setup()` has no `this`, so options can read setup bindings but not the other way round.',
      code: {
        lang: 'js',
        code: `export default {
  mixins: [paginationMixin],        // not migrated yet
  setup() {
    const { isFavourite, toggleFavourite } = useFavourites()
    return { isFavourite, toggleFavourite }   // → this.isFavourite in options
  },
  computed: {
    favCount() { return this.items.filter((i) => this.isFavourite(i.id)).length },
  },
}`,
      },
      whyAsked: 'Separates candidates who have actually migrated code from those who think it must be all-or-nothing.',
      mistakes: ['Claiming you must convert a whole component at once.', 'Saying `setup()` can access `this`.', 'Believing the Options API is deprecated in Vue 3.'],
      followUps: ['In which order do `setup()` and `data()` run?', 'When would you stop and switch to `<script setup>`?', 'Is there a deadline to remove the Options API?'],
      modelAnswer: 'Yes — an Options component can declare `setup()`. It runs first, and its returned bindings are exposed on `this`, so existing computeds, methods and the template can use them. That\'s how I migrate incrementally: move one concern into `setup()`, often by calling a new composable, keep everything else as options, run the tests and ship. Once everything is in `setup()`, I switch to `<script setup>`. The Options API isn\'t deprecated, so there\'s no deadline for that last step.',
    },
    {
      id: 'legacy-migration-array-watch',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'On **Vue 3**, `add(\'apple\')` is called twice. What does `log` contain?',
      code: {
        lang: 'js',
        code: `export default {
  data() {
    return { cart: [], log: [] }
  },
  watch: {
    cart(newCart) {
      this.log.push('cart has ' + newCart.length)
    },
  },
  methods: {
    add(item) {
      this.cart.push(item)
    },
  },
}`,
      },
      options: ['[] — the watcher never fires', "['cart has 1', 'cart has 2']", "['cart has 2']", 'It throws: cart is not reactive'],
      correctOption: 0,
      answer: 'An empty array. In Vue 3, watching an array fires only when the array is replaced; `push` mutates it in place. Vue 2 would have logged both entries. Fix: `cart: { handler(c) {…}, deep: true }`, or replace the array.',
      explanation: 'This is one of the silent breaking changes in the migration guide. The watcher\'s getter returns the same array proxy before and after `push`, so nothing changed from its point of view.',
      whyAsked: 'Tests real migration experience: this bug produces no error, only a feature that quietly stops working.',
      mistakes: ['Answering with the Vue 2 behaviour.', 'Thinking the array isn\'t reactive at all — the template would still update.'],
      followUps: ['How would you write this watcher with the Composition API?', 'What does `deep: true` cost on a large array?'],
      modelAnswer: 'It stays empty. In Vue 3 an array watcher only fires when the array itself is replaced; `push` keeps the same array, so the watcher sees no change — even though a template showing `cart.length` would update. Vue 2 notified on mutation, so this silently broke during migration. I\'d add `deep: true`, or switch to replacing the array, and I\'d grep for array watchers as part of any migration.',
    },
    {
      id: 'legacy-migration-vmodel-contract',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After moving to Vue 3, this custom input shows empty and typing never updates the parent. The DOM shows `<label modelvalue="Ada">`. What\'s wrong?',
      code: {
        lang: 'vue',
        code: `<!-- Parent -->
<TextField v-model="name" />

<!-- TextField.vue -->
<script>
export default {
  props: ['value'],
  methods: {
    onInput(e) { this.$emit('input', e.target.value) },
  },
}
</script>
<template>
  <label><input :value="value" @input="onInput" /></label>
</template>`,
      },
      answer: 'TextField uses Vue 2\'s v-model contract. In Vue 3, `v-model` on a component passes `modelValue` and listens for `update:modelValue`. So `value` is undefined, the unused `modelValue` falls through to the root `<label>` as an attribute, and the `input` event has no listener. Rename to `modelValue` / `update:modelValue` and declare `emits` — or use `defineModel()` (3.4+).',
      explanation: 'The stray `modelvalue` attribute is the giveaway: a prop the child didn\'t declare becomes a fallthrough attribute.',
      whyAsked: 'The most common silent breakage in Vue 2 → 3 migrations of component libraries and form inputs.',
      mistakes: ['Suggesting `.sync` or `$listeners`.', 'Blaming reactivity of `name`.', 'Not knowing about the `modelValue` rename.'],
      followUps: ['How do you support multiple v-models on one component?', 'What replaced `.sync`?', 'Why should the child declare `emits`?'],
      modelAnswer: 'The child still implements Vue 2\'s v-model: a `value` prop and an `input` event. Vue 3 changed the default to a `modelValue` prop and an `update:modelValue` event. So the child never receives the value, the undeclared `modelValue` falls through as an HTML attribute — that\'s the `modelvalue` we see — and nobody listens for `input`. I\'d rename the prop and event and declare them in `emits`, or use `defineModel()` in 3.4+. `.sync` became `v-model:prop` the same way.',
    },
    {
      id: 'legacy-migration-plan',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 7,
      question: 'You join a team with a large Vue 2.6 app: Vuex 3, Vue Router 3, Vue CLI, filters everywhere, a global event bus, and a UI component library. Plan the migration to Vue 3.',
      answer: 'Phase 0: E2E tests on critical journeys, lint rules for deprecated syntax, and a dependency audit (does the UI library have a Vue 3 version? that often sets the timeline). Phase 1 on Vue 2: upgrade to 2.7.16; remove filters, the event bus, `.native`, `.sync` and deprecated slot syntax in small PRs; write new code with the Composition API. Phase 2: move tooling (often to Vite), then switch to Vue 3 + `@vue/compat`, upgrade Router to v4 and Vuex to v4 (or Pinia), fix warnings feature by feature. Phase 3: remove compat, then convert components to the Composition API only where you\'re already working. Ship after every step.',
      explanation: 'The shape is: make it safe (tests, lint), remove what Vue 3 won\'t support while still on Vue 2, change the platform with a compatibility layer, then clean up. No phase leaves main unshippable.',
      code: {
        lang: 'js',
        code: `// .eslintrc excerpt (illustrative) — let tooling find Vue 2 leftovers
rules: {
  'vue/no-deprecated-filter': 'error',
  'vue/no-deprecated-events-api': 'error',        // $on / $off / $once
  'vue/no-deprecated-v-bind-sync': 'error',
  'vue/no-deprecated-v-on-native-modifier': 'error',
  'vue/no-deprecated-destroyed-lifecycle': 'error',
  'vue/require-explicit-emits': 'error',
}`,
      },
      whyAsked: 'Senior engineers are hired to de-risk exactly this kind of project. Interviewers look for sequencing, risk management and business awareness.',
      mistakes: [
        'Proposing a rewrite on a long-lived branch.',
        'Forgetting third-party dependencies until the end.',
        'Migrating every component to the Composition API as part of the version upgrade.',
        'No plan for testing or rollback.',
      ],
      followUps: ['What if the UI library will never support Vue 3?', 'Would you migrate Vuex to Pinia at the same time?', 'How do you keep shipping features during the migration?'],
      modelAnswer: 'I\'d sequence it so main stays shippable throughout. First, safety: end-to-end tests on the money paths, deprecated-syntax lint rules to measure the work, and a dependency audit, because a UI library without Vue 3 support can dictate the timeline. Then, still on Vue 2, I\'d upgrade to 2.7 and remove filters, the event bus, `.native` and `.sync` in small PRs, writing new code with the Composition API. Next, tooling and the switch to Vue 3 with the `@vue/compat` migration build, upgrading Router and Vuex alongside and fixing warnings one area at a time. Finally I\'d remove compat. Converting components to the Composition API is a separate, opportunistic effort — Vue 3 supports the Options API indefinitely.',
    },
    {
      id: 'legacy-migration-code-review',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A teammate opens a 2,000-line PR: "Migrate cart feature to Composition API + fix discount rounding". How do you review it?',
      answer: 'First the shape: ask to split it — the mechanical migration, the structural refactor and the rounding fix should be separate PRs, so behaviour changes are visible. Then, in the migration part, check that pinned tests pass unchanged, reactivity is preserved (no plain destructuring of props or reactive objects, composables return refs), cleanup still runs (listeners, timers), and no Vue 2 leftovers remain (`.sync`, `value`/`input`, `beforeDestroy`, array watchers without `deep`). Give feedback with reasons, marking blocking issues apart from nits, and let lint and formatting handle style.',
      explanation: 'Good reviews protect behaviour and the team\'s ability to understand changes. Mixing a refactor with a fix makes both unreviewable.',
      whyAsked: 'Senior roles are judged on how they review as much as how they code; this tests both technical checks and collaboration.',
      mistakes: ['Rubber-stamping because it\'s "just a migration".', 'Bikeshedding formatting instead of reactivity and behaviour.', 'Harsh feedback with no explanation.'],
      followUps: ['What would make you block the PR?', 'How do you review a large mechanical change efficiently?', 'How would you avoid this situation next time?'],
      modelAnswer: 'I\'d start with the shape rather than the lines: a 2,000-line PR that mixes a migration with a rounding fix can\'t be reviewed properly, so I\'d ask to split out the fix and ideally separate mechanical changes from structural ones. For the migration I\'d check that the existing tests pass unchanged, look for lost reactivity — destructured props or reactive objects — check that every listener or timer still has cleanup, and scan for Vue 2 leftovers like `.sync` or `beforeDestroy`. I\'d explain the reason behind each comment and label what blocks merging versus what\'s a suggestion. Then I\'d propose agreeing on PR size limits as a team.',
    },
    {
      id: 'legacy-migration-coding-mixin',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Port `selectionMixin.js` to a composable `useSelection(source)` in `useSelection.js`. `source` is a ref, computed or getter returning an array of `{ id }` objects. Return `{ selectedIds, allSelected, isSelected, toggle, toggleAll }` with the same behaviour as the mixin, including dropping selections whose items disappear. (`App.vue` shows the legacy behaviour.)',
      starter: {
        files: {
          'App.vue': inboxLegacy,
          'selectionMixin.js': selectionMixin,
          'useSelection.js': useSelectionStub,
        },
      },
      tests: [
        {
          name: 'toggle selects and deselects one item',
          code: `const { ref } = requireModule('vue')
const { useSelection } = requireModule('useSelection.js')
const items = ref([{ id: 1 }, { id: 2 }, { id: 3 }])
const s = withSetup(() => useSelection(items))
expect(s.selectedIds.value).toEqual([])
s.toggle(2)
expect(s.isSelected(2)).toBe(true)
expect(s.isSelected(1)).toBe(false)
s.toggle(2)
expect(s.isSelected(2)).toBe(false)`,
        },
        {
          name: 'toggleAll selects everything, then nothing',
          code: `const { ref } = requireModule('vue')
const { useSelection } = requireModule('useSelection.js')
const items = ref([{ id: 1 }, { id: 2 }, { id: 3 }])
const s = withSetup(() => useSelection(items))
s.toggle(1)
expect(s.allSelected.value).toBe(false)
s.toggleAll()
expect(s.selectedIds.value).toEqual([1, 2, 3])
expect(s.allSelected.value).toBe(true)
s.toggleAll()
expect(s.selectedIds.value).toEqual([])`,
        },
        {
          name: 'accepts a getter as the source',
          code: `const { ref } = requireModule('vue')
const { useSelection } = requireModule('useSelection.js')
const list = ref([{ id: 1, done: false }, { id: 2, done: true }, { id: 3, done: false }])
const s = withSetup(() => useSelection(() => list.value.filter((t) => !t.done)))
s.toggleAll()
expect(s.selectedIds.value).toEqual([1, 3])`,
        },
        {
          name: 'drops selections for items that disappear',
          code: `const { ref } = requireModule('vue')
const { useSelection } = requireModule('useSelection.js')
const items = ref([{ id: 1 }, { id: 2 }, { id: 3 }])
const s = withSetup(() => useSelection(items))
s.toggleAll()
items.value = [{ id: 3 }]
await nextTick()
expect(s.selectedIds.value).toEqual([3])
expect(s.allSelected.value).toBe(true)`,
        },
      ],
      hints: [
        'Normalise the input once: `const items = computed(() => toValue(source))`.',
        '`this.selectedIds` → `selectedIds.value`; the `allSelected` computed and the three methods translate almost line by line.',
        'The mixin\'s deep `items` watcher becomes `watch(items, (list) => {…}, { deep: true })`.',
      ],
      answer: 'Keep `selectedIds` in a ref, read the source through `computed(() => toValue(source))`, derive `allSelected`, translate the methods to functions, port the deep watcher with `watch(items, …, { deep: true })`, and return everything.',
      solution: {
        files: {
          'App.vue': inboxMigrated,
          'selectionMixin.js': selectionMixin,
          'useSelection.js': useSelectionDone,
        },
      },
      explanation: 'The mixin depended on its host having `this.items` — an invisible contract. The composable takes the source as an argument, so it works with any list, a filtered getter, or several lists in the same component. `toValue()` (3.3+) lets callers pass a ref, a computed or a getter. The solution\'s `App.vue` shows the component side of the migration.',
      whyAsked: 'Mixin-to-composable conversion is the bread and butter of Vue 3 migrations; it tests the API mapping and whether you remove implicit dependencies.',
      mistakes: ['Reading `this.items` or a global instead of taking a parameter.', 'Returning plain values (`selectedIds.value`) so callers lose reactivity.', 'Forgetting the watcher that prunes removed items.'],
      followUps: ['How would you test this composable?', 'What changes if two lists on the same page need independent selections?', 'Why might you store `selectedIds` as a `Set`?'],
      modelAnswer: 'The mixin\'s hidden input was `this.items`, so the composable takes a `source` parameter and normalises it with `computed(() => toValue(source))`. `selectedIds` becomes a ref, `allSelected` a computed, and the methods become plain functions working on `.value`. The deep watcher on items becomes `watch(items, …, { deep: true })`, pruning ids that disappeared. I return refs and functions so callers can destructure without losing reactivity — and two lists can now each call `useSelection` independently, which the mixin couldn\'t do.',
    },
  ],

  takeaways: [
    'Refactoring changes structure, not behaviour: pin behaviour with tests first, then move in small, shippable steps.',
    'Options and Composition API can coexist in one component — migrate concern by concern via `setup()`, then switch to `<script setup>`.',
    'Turn mixins into composables with explicit arguments and returned refs; that fixes unclear sources, collisions and implicit coupling.',
    'Vue 2 reached end of life on 31 Dec 2023 (final release 2.7.16): no more official fixes, security included.',
    'Hunt the silent Vue 3 changes: `.sync`, the `value`/`input` v-model contract, `beforeDestroy`/`destroyed`, array watchers without `deep`.',
    'Review migrations for unchanged tests, preserved reactivity and cleanup, and keep refactors separate from fixes.',
  ],
}
