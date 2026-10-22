// Lesson: design patterns for large Vue apps.
// Container/presentational, renderless (scoped-slot) components, compound
// components with provide/inject, adapters, prop drilling, monoliths, large
// forms and large tables.

const ordersApi = `// Simulated API — the sandbox has no network.
// A real service would call fetch() here (see the service-layers lesson).
const ORDERS = [
  { id: 1001, customer: 'Asha Rao', status: 'shipped', total: 1250 },
  { id: 1002, customer: 'Ben Okafor', status: 'pending', total: 89.5 },
  { id: 1003, customer: 'Chen Wei', status: 'cancelled', total: 430 },
  { id: 1004, customer: 'Dana Silva', status: 'shipped', total: 15.99 },
  { id: 1005, customer: 'Elif Kaya', status: 'pending', total: 610 },
]

export function fetchOrders() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ORDERS.map((order) => ({ ...order }))), 150)
  })
}`

const useOrders = `import { computed, onMounted, ref } from 'vue'
import { fetchOrders } from '../services/ordersApi.js'

// All the "what and when" logic for orders. No markup in here.
export function useOrders() {
  const orders = ref([])
  const loading = ref(true)
  const error = ref(null)
  const sortKey = ref('id')
  const sortDir = ref('asc')

  async function load() {
    loading.value = true
    error.value = null
    try {
      orders.value = await fetchOrders()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  function sortBy(key) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = 'asc'
    }
  }

  // Copy before sorting: never sort the source array in place.
  const sortedOrders = computed(() => {
    const dir = sortDir.value === 'asc' ? 1 : -1
    const key = sortKey.value
    return [...orders.value].sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0))
  })

  onMounted(load)

  return { orders: sortedOrders, loading, error, sortKey, sortDir, sortBy, reload: load }
}`

const dataTable = `<script setup>
// Presentational + generic: knows nothing about orders.
// Data comes in through props, user intent goes out through events,
// and callers customise cells through scoped slots.
defineProps({
  columns: { type: Array, required: true }, // [{ key, label, sortable? }]
  rows: { type: Array, required: true },
  rowKey: { type: String, default: 'id' },
  sortKey: { type: String, default: '' },
  sortDir: { type: String, default: 'asc' },
})
const emit = defineEmits(['sort'])
</script>

<template>
  <table class="data-table">
    <thead>
      <tr>
        <th
          v-for="col in columns"
          :key="col.key"
          :data-col="col.key"
          :aria-sort="col.key === sortKey ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined"
        >
          <button v-if="col.sortable" type="button" class="sort" @click="emit('sort', col.key)">
            <span class="th-label">{{ col.label }}</span>
            <span v-if="col.key === sortKey" aria-hidden="true">{{ sortDir === 'asc' ? ' ▲' : ' ▼' }}</span>
          </button>
          <span v-else class="th-label">{{ col.label }}</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row[rowKey]">
        <td v-for="col in columns" :key="col.key" :data-col="col.key">
          <!-- One named scoped slot per column: #cell-<key>="{ row, value }" -->
          <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
            {{ row[col.key] }}
          </slot>
        </td>
      </tr>
      <tr v-if="!rows.length">
        <td :colspan="columns.length" class="empty">
          <slot name="empty">No rows.</slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.data-table { border-collapse: collapse; width: 100%; font-size: 0.95rem; }
th, td { text-align: left; padding: 6px 10px; border-bottom: 1px solid #ddd; }
.sort { font: inherit; font-weight: 700; background: none; border: 0; padding: 0; cursor: pointer; }
.empty { color: #555; font-style: italic; }
</style>`

const statusBadge = `<script setup>
// Purely presentational: one prop in, markup out. Trivial to test and reuse.
defineProps({ status: { type: String, required: true } })
</script>

<template>
  <span class="badge" :class="'badge--' + status">{{ status }}</span>
</template>

<style scoped>
.badge { padding: 2px 8px; border-radius: 999px; font-size: 0.8rem; }
.badge--shipped { background: #dcfce7; color: #14532d; }
.badge--pending { background: #fef9c3; color: #713f12; }
.badge--cancelled { background: #fee2e2; color: #7f1d1d; }
</style>`

const formatJs = `const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatMoney(amount) {
  return money.format(amount)
}`

const ordersPage = `<script setup>
import DataTable from './components/DataTable.vue'
import StatusBadge from './components/StatusBadge.vue'
import { useOrders } from './composables/useOrders.js'
import { formatMoney } from './utils/format.js'

// Container: decides WHAT data the page needs and WHEN to load it.
const { orders, loading, error, sortKey, sortDir, sortBy, reload } = useOrders()

// Configuration, not code: the table renders whatever columns it is given.
const columns = [
  { key: 'id', label: 'Order', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
]
</script>

<template>
  <h2>Orders</h2>
  <p v-if="loading" class="loading">Loading orders…</p>
  <p v-else-if="error" class="error">
    Could not load orders. <button type="button" @click="reload">Retry</button>
  </p>
  <DataTable
    v-else
    :columns="columns"
    :rows="orders"
    :sort-key="sortKey"
    :sort-dir="sortDir"
    @sort="sortBy"
  >
    <template #cell-status="{ value }">
      <StatusBadge :status="value" />
    </template>
  </DataTable>
</template>`

const orderCards = `<script setup>
import StatusBadge from './StatusBadge.vue'
import { formatMoney } from '../utils/format.js'

// Presentational: a second VIEW of the same data.
// Not used yet — swap it in for <DataTable> in App.vue.
defineProps({ orders: { type: Array, required: true } })
</script>

<template>
  <ul class="order-cards">
    <li v-for="order in orders" :key="order.id" class="order-card">
      <strong>#{{ order.id }}</strong> · {{ order.customer }}
      <StatusBadge :status="order.status" />
      <span class="order-card__total">{{ formatMoney(order.total) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.order-cards { list-style: none; padding: 0; display: grid; gap: 8px; }
.order-card { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
.order-card__total { margin-left: auto; font-weight: 700; }
</style>`

const sharedFiles = {
  'components/DataTable.vue': dataTable,
  'components/StatusBadge.vue': statusBadge,
  'composables/useOrders.js': useOrders,
  'services/ordersApi.js': ordersApi,
  'utils/format.js': formatJs,
}

const playgroundFiles = {
  'App.vue': ordersPage,
  ...sharedFiles,
  'components/OrderCards.vue': orderCards,
}

// ---------- variant: the same page with a renderless component instead of a composable
const ordersSource = `<script setup>
import { reactive } from 'vue'
import { useOrders } from '../composables/useOrders.js'

// reactive() unwraps the refs, so slot props arrive as plain values.
const state = reactive(useOrders())
</script>

<template>
  <!-- Renderless: no element of its own, only the slot. -->
  <slot v-bind="state" />
</template>`

const renderlessPage = `<script setup>
import DataTable from './components/DataTable.vue'
import StatusBadge from './components/StatusBadge.vue'
import OrdersSource from './components/OrdersSource.vue'

const columns = [
  { key: 'id', label: 'Order', sortable: true },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total', sortable: true },
]
</script>

<template>
  <h2>Orders (renderless version)</h2>
  <OrdersSource v-slot="{ orders, loading, sortKey, sortDir, sortBy }">
    <p v-if="loading" class="loading">Loading orders…</p>
    <DataTable
      v-else
      :columns="columns"
      :rows="orders"
      :sort-key="sortKey"
      :sort-dir="sortDir"
      @sort="sortBy"
    >
      <template #cell-status="{ value }">
        <StatusBadge :status="value" />
      </template>
    </DataTable>
  </OrdersSource>
</template>`

// ---------- variant: compound components (plan picker)
const planPickerKey = `// One shared, collision-proof key for the compound component.
export const PlanPickerKey = Symbol('PlanPicker')`

const planPicker = `<script setup>
import { provide, readonly, useId } from 'vue'
import { PlanPickerKey } from './planPickerKey.js'

defineProps({ legend: { type: String, required: true } })
const selected = defineModel({ type: String, default: '' }) // Vue 3.4+

// Children get read-only state plus ONE way to change it.
provide(PlanPickerKey, {
  name: useId(), // Vue 3.5+: a stable, unique radio-group name
  selected: readonly(selected),
  select: (value) => (selected.value = value),
})
</script>

<template>
  <fieldset class="plan-picker">
    <legend>{{ legend }}</legend>
    <slot />
  </fieldset>
</template>

<style scoped>
.plan-picker { display: grid; gap: 8px; border: 1px solid #ccc; padding: 12px; }
</style>`

const planOption = `<script setup>
import { computed, inject } from 'vue'
import { PlanPickerKey } from './planPickerKey.js'

const props = defineProps({ value: { type: String, required: true } })

const picker = inject(PlanPickerKey, null)
if (!picker) throw new Error('<PlanOption> must be used inside <PlanPicker>.')

const checked = computed(() => picker.selected.value === props.value)
</script>

<template>
  <!-- Native radios: arrow-key navigation and screen-reader semantics for free. -->
  <label class="plan-option" :class="{ checked }">
    <input type="radio" :name="picker.name" :value="value" :checked="checked" @change="picker.select(value)" />
    <slot />
  </label>
</template>

<style scoped>
.plan-option { display: flex; gap: 8px; padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
.checked { border-color: #1d4ed8; background: #eff6ff; }
</style>`

const compoundApp = `<script setup>
import { ref } from 'vue'
import PlanPicker from './PlanPicker.vue'
import PlanOption from './PlanOption.vue'

const plan = ref('team')
</script>

<template>
  <PlanPicker v-model="plan" legend="Choose a plan">
    <PlanOption value="solo"><strong>Solo</strong> — one seat</PlanOption>
    <!-- Any markup can sit between the parent and its options. -->
    <div class="recommended">
      <PlanOption value="team"><strong>Team</strong> — up to 10 seats</PlanOption>
    </div>
    <PlanOption value="business"><strong>Business</strong> — unlimited seats</PlanOption>
  </PlanPicker>
  <p class="chosen">Selected: {{ plan }}</p>
</template>`

// ---------- exercise 1: compound accordion
const accordionKey = `export const AccordionKey = Symbol('Accordion')`

const accordionApp = `<script setup>
import Accordion from './Accordion.vue'
import AccordionItem from './AccordionItem.vue'
</script>

<template>
  <Accordion>
    <AccordionItem title="Shipping">Orders leave our warehouse within two business days.</AccordionItem>
    <AccordionItem title="Returns">Changed your mind? Send it back within 30 days.</AccordionItem>
    <AccordionItem title="Warranty">Every product carries a one-year warranty.</AccordionItem>
  </Accordion>
</template>`

const accordionStarter = `<script setup>
import { ref } from 'vue'
import { AccordionKey } from './accordionKey.js'

const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

// TODO: provide the accordion context (read-only openId + toggle) with AccordionKey
</script>

<template>
  <div class="accordion">
    <slot />
  </div>
</template>`

const accordionItemStarter = `<script setup>
import { useId } from 'vue'

const props = defineProps({ title: { type: String, required: true } })
const id = useId()

// TODO: inject the accordion context and derive isOpen from it
const isOpen = false
</script>

<template>
  <div class="accordion-item">
    <h3>
      <button
        type="button"
        class="accordion-trigger"
        :id="id + '-trigger'"
        :aria-expanded="isOpen"
        :aria-controls="id + '-panel'"
      >
        {{ title }}
      </button>
    </h3>
    <div
      v-show="isOpen"
      class="accordion-panel"
      role="region"
      :id="id + '-panel'"
      :aria-labelledby="id + '-trigger'"
    >
      <slot />
    </div>
  </div>
</template>`

const accordionSolution = `<script setup>
import { provide, readonly, ref } from 'vue'
import { AccordionKey } from './accordionKey.js'

const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

provide(AccordionKey, { openId: readonly(openId), toggle })
</script>

<template>
  <div class="accordion">
    <slot />
  </div>
</template>`

const accordionItemSolution = `<script setup>
import { computed, inject, useId } from 'vue'
import { AccordionKey } from './accordionKey.js'

const props = defineProps({ title: { type: String, required: true } })
const id = useId()

const accordion = inject(AccordionKey, null)
if (!accordion) throw new Error('<AccordionItem> must be used inside <Accordion>.')

const isOpen = computed(() => accordion.openId.value === id)
</script>

<template>
  <div class="accordion-item">
    <h3>
      <button
        type="button"
        class="accordion-trigger"
        :id="id + '-trigger'"
        :aria-expanded="isOpen"
        :aria-controls="id + '-panel'"
        @click="accordion.toggle(id)"
      >
        {{ title }}
      </button>
    </h3>
    <div
      v-show="isOpen"
      class="accordion-panel"
      role="region"
      :id="id + '-panel'"
      :aria-labelledby="id + '-trigger'"
    >
      <slot />
    </div>
  </div>
</template>`

// ---------- exercise 2: split a large form
const checkoutStarter = `<script setup>
import { reactive } from 'vue'
import AddressFields from './AddressFields.vue'

const form = reactive({
  email: '',
  shipping: { street: '', city: '', zip: '' },
  billing: { street: '', city: '', zip: '' },
})

function formatAddress(a) {
  const line2 = [a.city, a.zip].filter(Boolean).join(' ')
  return [a.street, line2].filter(Boolean).join(', ') || '—'
}
</script>

<template>
  <form class="checkout" @submit.prevent>
    <label>Email <input class="email" v-model="form.email" type="email" /></label>

    <!-- Monolith alert: these fields are about to be copy-pasted for billing… -->
    <fieldset>
      <legend>Shipping address</legend>
      <label>Street <input v-model="form.shipping.street" /></label>
      <label>City <input v-model="form.shipping.city" /></label>
      <label>ZIP <input v-model="form.shipping.zip" /></label>
    </fieldset>

    <!-- TODO: billing address -->
  </form>

  <p class="summary-shipping">Ship to: {{ formatAddress(form.shipping) }}</p>
  <p class="summary-billing">Bill to: {{ formatAddress(form.billing) }}</p>
</template>`

const addressStarter = `<script setup>
// TODO: accept a \`legend\` prop and a v-model address object (defineModel, Vue 3.4+).
</script>

<template>
  <fieldset class="address-fields">
    <legend>Address</legend>
    <!-- TODO: street, city and zip inputs -->
  </fieldset>
</template>`

const checkoutSolution = `<script setup>
import { reactive } from 'vue'
import AddressFields from './AddressFields.vue'

const form = reactive({
  email: '',
  shipping: { street: '', city: '', zip: '' },
  billing: { street: '', city: '', zip: '' },
})

function formatAddress(a) {
  const line2 = [a.city, a.zip].filter(Boolean).join(' ')
  return [a.street, line2].filter(Boolean).join(', ') || '—'
}
</script>

<template>
  <form class="checkout" @submit.prevent>
    <label>Email <input class="email" v-model="form.email" type="email" /></label>

    <div class="shipping">
      <AddressFields v-model="form.shipping" legend="Shipping address" />
    </div>
    <div class="billing">
      <AddressFields v-model="form.billing" legend="Billing address" />
    </div>
  </form>

  <p class="summary-shipping">Ship to: {{ formatAddress(form.shipping) }}</p>
  <p class="summary-billing">Bill to: {{ formatAddress(form.billing) }}</p>
</template>`

const addressSolution = `<script setup>
defineProps({ legend: { type: String, required: true } })

// Vue 3.4+: a ref that reads the parent's modelValue and emits update:modelValue.
const address = defineModel({ type: Object, required: true })

// Emit a NEW object instead of mutating the parent's object in place.
function update(field, value) {
  address.value = { ...address.value, [field]: value }
}
</script>

<template>
  <fieldset class="address-fields">
    <legend>{{ legend }}</legend>
    <label>Street <input class="street" :value="address.street" @input="update('street', $event.target.value)" /></label>
    <label>City <input class="city" :value="address.city" @input="update('city', $event.target.value)" /></label>
    <label>ZIP <input class="zip" :value="address.zip" @input="update('zip', $event.target.value)" /></label>
  </fieldset>
</template>`

// ---------- interview coding: renderless paginator
const paginateApp = `<script setup>
import Paginate from './Paginate.vue'

const products = [
  'Desk lamp', 'Notebook', 'Backpack', 'Headphones', 'Water bottle',
  'Sticky notes', 'Monitor stand', 'USB cable', 'Plant pot', 'Mouse pad',
]
</script>

<template>
  <Paginate
    :items="products"
    :per-page="3"
    v-slot="{ pageItems, page, pageCount, hasPrev, hasNext, prev, next }"
  >
    <ul class="products">
      <li v-for="item in pageItems" :key="item">{{ item }}</li>
    </ul>
    <nav class="pager" aria-label="Pagination">
      <button type="button" class="prev" :disabled="!hasPrev" @click="prev">Previous</button>
      <span class="page-label">Page {{ page }} of {{ pageCount }}</span>
      <button type="button" class="next" :disabled="!hasNext" @click="next">Next</button>
    </nav>
  </Paginate>
</template>`

const paginateStarter = `<script setup>
// TODO: accept \`items\` (Array, required) and \`perPage\` (Number, default 5),
// keep the current page, and expose everything through the default slot:
// pageItems, page, pageCount, hasPrev, hasNext, prev, next
</script>

<template>
  <slot />
</template>`

const paginateSolution = `<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  perPage: { type: Number, default: 5 },
})

const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(props.items.length / props.perPage)))
const pageItems = computed(() => {
  const start = (page.value - 1) * props.perPage
  return props.items.slice(start, start + props.perPage)
})
const hasPrev = computed(() => page.value > 1)
const hasNext = computed(() => page.value < pageCount.value)

function prev() {
  if (hasPrev.value) page.value--
}
function next() {
  if (hasNext.value) page.value++
}

// If the list shrinks (e.g. after filtering), keep the page in range.
watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})
</script>

<template>
  <slot
    :pageItems="pageItems"
    :page="page"
    :pageCount="pageCount"
    :hasPrev="hasPrev"
    :hasNext="hasNext"
    :prev="prev"
    :next="next"
  />
</template>`

export default {
  id: 'design-patterns',
  title: 'Design patterns for large Vue apps',
  summary: 'Container/presentational splits, renderless and compound components, adapters, and the shapes that keep big forms, tables and teams sane.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['scoped-slots', 'provide-inject', 'composables-intro', 'component-v-model'],
  related: ['project-structure', 'service-layers', 'component-communication', 'composable-design', 'large-lists', 'legacy-migration', 'accessible-components'],
  tags: ['architecture', 'design patterns', 'container', 'presentational', 'renderless', 'scoped slots', 'compound components', 'provide', 'inject', 'adapter', 'prop drilling', 'large forms', 'data table'],
  apis: [
    { name: 'provide() / inject()', summary: 'Share values from an ancestor with any descendant without passing props through every level.' },
    { name: 'Scoped slots', summary: 'A child calls a slot with data (`<slot :row="row">`); the parent decides how to render it (`#cell="{ row }"`).' },
    { name: 'defineModel()', summary: 'Vue 3.4+: declares a two-way `v-model` binding as a ref inside a child component.' },
    { name: 'readonly()', summary: 'Wraps state in a read-only proxy — useful when providing state children may read but not change.' },
    { name: 'useId()', summary: 'Vue 3.5+: generates unique, stable ids per component instance, e.g. for aria-controls and label wiring.' },
  ],
  docs: [
    { label: 'Vue Guide — Slots: Scoped Slots & Renderless Components', url: 'https://vuejs.org/guide/components/slots.html#scoped-slots' },
    { label: 'Vue Guide — Provide / Inject', url: 'https://vuejs.org/guide/components/provide-inject.html' },
    { label: 'Vue Guide — Composables vs. Renderless Components', url: 'https://vuejs.org/guide/reusability/composables.html#vs-renderless-components' },
    { label: 'Vue Guide — Component v-model', url: 'https://vuejs.org/guide/components/v-model.html' },
    { label: 'Vue Style Guide', url: 'https://vuejs.org/style-guide/' },
  ],

  intro: `
A *design pattern* is a named, reusable shape for solving a problem that keeps coming back. It is not a library and not a rule — it is shared vocabulary. When a teammate says "make that a presentational component", everyone should picture the same thing.

Vue gives you a small set of building blocks — props, events, slots, \`provide\`/\`inject\` and composables. The patterns in this lesson are the proven ways to *combine* those blocks so a codebase stays understandable at 5 components and at 500:

- **Container / presentational** — split "getting data" from "showing data".
- **Renderless components** — share behaviour, let the caller own every pixel.
- **Compound components** — a parent and its children cooperate without prop wiring.
- **Adapters** — wrap things you don't control behind an interface you do.

Then we put them to work on the two places big apps hurt most: **large forms** and **large tables**.
`,

  why: `
Small apps forgive anything. Large apps punish two habits in particular:

1. **Everything in one component.** A 1,200-line \`OrdersPage.vue\` that fetches, filters, sorts, validates, formats money and renders three modals. Every change risks breaking something unrelated, and nobody can test a piece in isolation.
2. **Everything wired by hand.** A \`user\` prop passed through six components that never use it, just so the seventh can. Rename one prop and you touch seven files.

\`\`\`vue
<!-- Prop drilling: Layout and Sidebar don't care about user — they just pass it on -->
<Layout :user="user">          <!-- passes to Sidebar -->
  <Sidebar :user="user">       <!-- passes to UserMenu -->
    <UserMenu :user="user" />  <!-- finally uses it -->
\`\`\`

Patterns exist so each piece has **one reason to change** and **one obvious way to talk** to its neighbours. That's what makes a codebase safe for a team to change on a Friday afternoon.
`,

  eli15: `
Think about a restaurant.

- The **waiter** takes your order and talks to the kitchen. They don't cook. (That's a *container*: it knows *what* is needed and *where* to get it.)
- The **plate** just presents whatever food is put on it. It doesn't care which chef cooked it. (That's a *presentational* component: give it data, it shows it.)
- A **recipe card** tells you the steps but leaves the plating to you. (That's a *renderless* component: it handles the logic, you decide how it looks.)
- A **set menu** — starter, main, dessert — only makes sense together; the courses know they belong to the same meal. (Those are *compound* components.)
- A **travel plug adapter** lets your laptop work in any country without rewiring the laptop. (That's an *adapter*: wrap the foreign thing so your code doesn't change.)

None of these are rules. They are names for good habits, so a whole team can build the same way.
`,

  analogy: {
    title: 'A well-run restaurant',
    body: `
In a chaotic restaurant, one person takes orders, cooks, plates and washes up. It works for a food truck. It collapses at 200 covers.

A good restaurant splits the work: front of house talks to customers, the kitchen cooks, plates are interchangeable, recipes are shared, and the espresso machine from another country plugs in through an adapter. Each role can be replaced or trained without retraining everyone else.

Your Vue app scales the same way: split responsibilities, standardise how pieces talk, and isolate the parts you don't control.
`,
    mapping: [
      ['waiter (takes orders, talks to kitchen)', 'container component / page — calls composables and services'],
      ['plate (shows whatever it is given)', 'presentational component — props in, events out'],
      ['recipe card (steps, not plating)', 'renderless component — logic exposed via a scoped slot'],
      ['set menu courses', 'compound components sharing state through provide/inject'],
      ['travel plug adapter', 'an adapter module or wrapper component around a third-party library'],
      ['the kitchen ticket system', 'composables + stores: the shared, testable logic'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'One page, four responsibilities',
    caption: 'Step through the playground app: the page decides, the composable thinks, the service fetches, the table displays — and scoped slots hand rendering decisions back to the page.',
    alt: 'A diagram with six boxes. Top row: ordersApi service, useOrders composable, OrdersPage container. Bottom row: StatusBadge, cell slots, DataTable. Arrows: the page calls useOrders, which fetches from ordersApi; the page passes rows and columns down to DataTable and receives sort events; DataTable hands each row back through cell slots, where the page renders StatusBadge.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'service', label: 'ordersApi', note: 'the only code that talks to the server', tone: 'kraft', x: 120, y: 70 },
        { id: 'composable', label: 'useOrders()', note: 'state + logic, no markup', tone: 'cobalt', x: 380, y: 70 },
        { id: 'page', label: 'OrdersPage', note: 'container: what & when', tone: 'acid', x: 640, y: 70 },
        { id: 'badge', label: 'StatusBadge', note: 'presentational', tone: 'paper', x: 120, y: 245 },
        { id: 'cell', label: 'cell slots', note: '#cell-status="{ value }"', tone: 'paper', x: 380, y: 245 },
        { id: 'table', label: 'DataTable', note: 'generic, prop-driven', tone: 'ink', x: 640, y: 245 },
      ],
      edges: [
        { from: 'page', to: 'composable', label: 'calls' },
        { from: 'composable', to: 'service', label: 'fetchOrders()' },
        { from: 'page', to: 'table', label: 'props down · sort event up' },
        { from: 'table', to: 'cell', label: 'slot props: row, value' },
        { from: 'cell', to: 'badge', label: 'page renders' },
      ],
      steps: [
        { focus: ['page'], text: 'The **page** is the *container*. It decides *what* data the screen needs and *when* to load it. It contains almost no markup of its own.' },
        { focus: ['composable', 'service'], edges: ['page->composable', 'composable->service'], text: 'The logic lives in a **composable** (`useOrders`), and only the **service** knows how to reach the server. Swap the API and nothing above it changes.' },
        { focus: ['table'], edges: ['page->table'], text: '`DataTable` is **presentational and generic**: rows and columns in, a `sort` event out. It has never heard of orders, so every table in the app can reuse it.' },
        { focus: ['cell', 'badge'], edges: ['table->cell', 'cell->badge'], text: 'For special cells the table calls a **scoped slot** with the row. The page decides to render a `StatusBadge` there — the table keeps the structure, the caller keeps control of the content.' },
        { focus: ['service', 'composable', 'page', 'table', 'cell', 'badge'], text: 'Each box now has **one reason to change**: API format → service; business rules → composable; layout of the page → page; table behaviour → DataTable; badge look → StatusBadge.' },
      ],
    },
  },

  syntax: [
    `
#### 1. Container / presentational

A **presentational** component receives everything through props and reports user intent through events. A **container** (often a page) gathers data — today usually by calling composables or stores — and feeds the presentational components.
`,
    {
      code: `<!-- OrderList.vue — presentational: no fetching, no store access -->
<script setup>
defineProps({ orders: { type: Array, required: true } })
defineEmits(['select'])
</script>

<template>
  <ul>
    <li v-for="o in orders" :key="o.id" @click="$emit('select', o.id)">{{ o.customer }}</li>
  </ul>
</template>

<!-- OrdersPage.vue — container -->
<script setup>
import { useOrders } from '@/features/orders/useOrders'
const { orders, select } = useOrders()
</script>

<template>
  <OrderList :orders="orders" @select="select" />
</template>`,
      lang: 'vue',
      title: 'the split',
      static: true,
    },
    `
In Vue 3 the "container" role is often *thin*, because the logic moved into a composable. The split still pays off: presentational components are trivial to test, document and reuse.

#### 2. Renderless components (scoped slots)

A *renderless* component owns behaviour and renders **only a slot**, passing its state as slot props. The caller writes all the markup.
`,
    {
      code: `<!-- Toggle.vue -->
<script setup>
import { ref } from 'vue'
const on = ref(false)
const toggle = () => (on.value = !on.value)
</script>

<template>
  <slot :on="on" :toggle="toggle" />
</template>

<!-- usage -->
<Toggle v-slot="{ on, toggle }">
  <button :aria-pressed="on" @click="toggle">{{ on ? 'Muted' : 'Mute' }}</button>
</Toggle>`,
      lang: 'vue',
      title: 'a renderless toggle',
      static: true,
    },
    {
      callout: 'note',
      title: 'Composables usually win',
      text: 'The official guide notes that most renderless use cases can be done more efficiently with a composable, which adds no extra component instance. Reach for a renderless component when you want logic **and** a template-level API — for example a reusable `<Paginate>` or `<DataTable>` that callers drive from the template.',
    },
    `
#### 3. Compound components (provide / inject)

A parent and its children form one widget — \`<PlanPicker>\` + \`<PlanOption>\`, \`<Accordion>\` + \`<AccordionItem>\`. The parent **provides** a small context; children **inject** it. Callers write natural markup with no prop wiring.
`,
    {
      code: `// planPickerKey.js — one Symbol key, imported by both sides
export const PlanPickerKey = Symbol('PlanPicker')

// PlanPicker.vue (setup)
const selected = defineModel({ type: String })
provide(PlanPickerKey, {
  selected: readonly(selected),          // children may read…
  select: (v) => (selected.value = v),   // …and change it only through this
})

// PlanOption.vue (setup)
const picker = inject(PlanPickerKey, null)
if (!picker) throw new Error('<PlanOption> must be used inside <PlanPicker>.')
const checked = computed(() => picker.selected.value === props.value)`,
      lang: 'js',
      title: 'compound component wiring',
      static: true,
    },
    `
Rules: use a **Symbol** key from a shared module (no name collisions), provide **refs or reactive objects** (never \`.value\` — that's a frozen snapshot), keep mutations in the provider, and fail loudly when a child is used outside its parent.

#### 4. Adapters

An *adapter* translates between an interface you don't control (a third-party library, a browser API, an awkward API payload) and the interface your app wants. The rest of the app only knows the adapter.
`,
    {
      code: `// shared/analytics.js — the app calls track(); only this file knows the vendor
import { vendorSdk } from 'some-analytics-sdk' // illustrative

export function track(event, data = {}) {
  vendorSdk.logEvent({ name: event, properties: data, ts: Date.now() })
}

// Later you switch vendors: rewrite this one file, not 80 call sites.`,
      lang: 'js',
      title: 'an adapter module (illustrative)',
      static: true,
    },
    `
The same idea works for UI: wrap a third-party date picker in your own \`<AppDatePicker v-model="date">\` so props, events and styling stay under your control. Mapping API responses into app-friendly shapes is also an adapter — the [service-layers lesson](lesson:service-layers) covers it.

#### 5. Escaping prop drilling

- A parent wants to control *what* a deep child renders → **slots**: pass content, not data.
- A widget's children need the widget's state → **provide / inject** (compound components).
- Many unrelated screens share the same state → a **store** ([Pinia](lesson:pinia-basics)).
- Several components reuse the same *logic* → a **composable**.
`,
    {
      callout: 'version',
      text: '`defineModel()` needs Vue 3.4+, `useId()` needs Vue 3.5+. `provide`/`inject`, scoped slots and `readonly()` work in every Vue 3 version.',
    },
  ],

  walkthrough: {
    title: 'App.vue — the container page',
    lang: 'vue',
    code: ordersPage,
    intro: 'This is the playground\'s entry file. Notice how little it does: it chooses pieces, wires them together and makes rendering decisions — the work happens elsewhere.',
    steps: [
      { lines: [2, 5], text: 'Four imports, four responsibilities: a generic table, a presentational badge, a composable with the logic and a formatting utility. The page knows *which* pieces it needs, not *how* they work.' },
      { lines: [7, 8], text: 'The container\'s logic is one line: call `useOrders()`. Loading, errors and sorting live in the composable, so another page — or a test — can reuse them without this template.' },
      { lines: [10, 15], text: '**Configuration, not code.** The table renders whatever columns it is given. Adding a column means adding an object here, not editing `DataTable.vue`.' },
      { lines: [20, 23], text: 'Async UI states belong to the container: the presentational table never has to know what "loading" means for orders.' },
      { lines: [24, 31], text: 'Props down, events up. `DataTable` emits `sort` with a column key; the container decides what sorting means. The table stays generic.' },
      { lines: [32, 34], text: 'A **scoped slot**: the table calls `cell-status` with `{ row, value }` for every row, and the page decides to render a `StatusBadge`. The table owns structure, the caller owns content.' },
    ],
  },

  playground: {
    title: 'Orders dashboard',
    objective: 'Extend a container/presentational page using only configuration and scoped slots — without editing the generic table.',
    files: playgroundFiles,
    entry: 'App.vue',
    expected: 'A heading **Orders**, a short loading message, then a table of five orders with an **Order** column (sortable — click it), a **Status** column showing coloured badges and a raw **Total** column. Explore the folders: `components/`, `composables/`, `services/`, `utils/` — `components/OrderCards.vue` is waiting to be used in the last experiment.',
    experiments: [
      {
        id: 'money-cell',
        task: 'The **Total** column shows raw numbers such as `1250`. *Without touching `DataTable.vue`*, add a `#cell-total` slot in `App.vue` that shows each amount with `formatMoney()` (already imported) — e.g. **$1,250.00**.',
        hint: 'Copy the `#cell-status` template: `<template #cell-total="{ value }">{{ formatMoney(value) }}</template>`.',
        tests: [
          {
            name: 'the first order total is formatted as money',
            code: `await wait(300)
expect(text('tbody tr:first-child td[data-col="total"]')).toBe('$1,250.00')`,
          },
        ],
        explain: 'The table exposes one named scoped slot per column (`cell-<key>`). The *table* decides where cells go; the *page* decides what goes in them. You extended a generic component without modifying it.',
      },
      {
        id: 'customer-column',
        task: 'Add a **Customer** column between *Order* and *Status* — by editing only the `columns` array.',
        hint: 'Insert `{ key: \'customer\', label: \'Customer\' }` as the second item.',
        tests: [
          {
            name: 'headers are Order, Customer, Status, Total',
            code: `await wait(300)
const heads = findAll('thead .th-label').map((el) => el.textContent.trim())
expect(heads).toEqual(['Order', 'Customer', 'Status', 'Total'])`,
          },
          {
            name: 'the first row shows the customer name',
            code: `await wait(300)
expect(text('tbody tr:first-child td[data-col="customer"]')).toBe('Asha Rao')`,
          },
        ],
        explain: 'Configuration-driven components let callers grow features without forking the component. That\'s how one `DataTable` can serve dozens of screens.',
      },
      {
        id: 'sort-total',
        task: 'Make the **Total** column sortable. One click on its header should put the cheapest order first; a second click the most expensive.',
        hint: 'The table already renders a sort button for any column with `sortable: true`, and `useOrders()` already sorts by any key.',
        tests: [
          {
            name: 'clicking Total sorts ascending, then descending',
            code: `await wait(300)
const btn = find('th[data-col="total"] button')
expect(btn).toBeTruthy()
await click(btn)
expect(text('tbody tr:first-child td[data-col="id"]')).toBe('1004')
await click(btn)
expect(text('tbody tr:first-child td[data-col="id"]')).toBe('1001')`,
          },
          {
            name: 'the sorted column announces its direction with aria-sort',
            code: `await wait(300)
await click('th[data-col="total"] button')
expect(attr('th[data-col="total"]', 'aria-sort')).toBe('ascending')`,
          },
        ],
        explain: 'The table only *emits* `sort` with a key; the composable owns *how* to sort. Behaviour and presentation evolved independently — and `aria-sort` came for free because the generic table implements it once for everyone.',
      },
      {
        id: 'swap-view',
        task: '`components/OrderCards.vue` is a second presentational view of the same data. In `App.vue`, import it and replace the whole `<DataTable …>…</DataTable>` block with `<OrderCards v-else :orders="orders" />`. Then look at what you did **not** have to change.',
        hint: 'Add `import OrderCards from \'./components/OrderCards.vue\'` to the script. Keep `v-else` so the loading/error chain still works.',
        tests: [
          {
            name: 'the page shows five order cards and no table',
            code: `await wait(300)
expect(findAll('.order-card')).toHaveLength(5)
expect(exists('table')).toBe(false)`,
          },
        ],
        explain: '`useOrders.js` and `ordersApi.js` did not change at all. That is the payoff of the container/presentational split: the *view* is replaceable because it never owned the data logic. Then pick **Renderless version** in the example menu to see the same page built with a renderless component instead of a composable (loading an example replaces the editor\'s files; **Starting point** brings the original back).',
      },
    ],
    variants: [
      { id: 'start', label: 'Starting point (composable version)', files: playgroundFiles },
      {
        id: 'renderless',
        label: 'Renderless version (same page)',
        files: {
          'App.vue': renderlessPage,
          'components/OrdersSource.vue': ordersSource,
          ...sharedFiles,
        },
      },
      {
        id: 'compound',
        label: 'Compound components: plan picker',
        files: {
          'App.vue': compoundApp,
          'PlanPicker.vue': planPicker,
          'PlanOption.vue': planOption,
          'planPickerKey.js': planPickerKey,
        },
      },
    ],
  },

  animation: {
    type: 'component-flow',
    props: { mode: 'scoped-slots' },
    title: 'How a scoped slot hands data back',
    caption: 'The child calls the slot with data; the parent\'s template decides how to render it. This one mechanism powers renderless components and customisable table cells.',
    alt: 'An animated parent and child component. The child holds data and calls its slot with that data as slot props; the data travels up to the parent\'s slot template, which renders it inside the child\'s layout.',
  },

  internals: {
    beginner: `
Patterns don't add new features to Vue — they arrange the ones you have. Props and events connect a parent to its direct child. Slots let a parent pass *content* (even content that needs the child's data). \`provide\`/\`inject\` let an ancestor share something with any descendant. Composables let components share logic. Every pattern in this lesson is one of those tools used deliberately.
`,
    technical: [
      `
**Scoped slots are functions.** The parent's \`<template #cell-status="{ value }">\` compiles to a function stored on the child's \`$slots\`. When the child renders \`<slot :value="…">\`, it *calls* that function with the slot props and inserts the returned virtual nodes into its own tree. Because the function runs during the **child's** render, reactive reads inside slot content are tracked by the child's render effect — in Vue 3 a change that only affects slot content can update the child without re-rendering the parent.

**Renderless components still cost an instance.** A renderless component is a real component: it has its own setup, reactive effects and a render function that returns the slot's nodes (a fragment). A composable runs *inside* the calling component — no extra instance. That's why the guide prefers composables for pure logic reuse.

**provide / inject walk a prototype chain.** Every component instance has a \`provides\` object. By default it *is* the parent's object. The first time a component calls \`provide()\`, Vue gives it its own object created with \`Object.create(parentProvides)\`, so lookups fall through to ancestors. \`inject(key)\` reads from the **parent's** \`provides\` — which is why a component can't inject something it provides itself.
`,
      {
        code: `// Simplified model of provide/inject — not Vue's real source
function provide(instance, key, value) {
  const parentProvides = instance.parent ? instance.parent.provides : instance.appContext.provides
  if (instance.provides === parentProvides) {
    instance.provides = Object.create(parentProvides) // own layer, inherits ancestors
  }
  instance.provides[key] = value
}

function inject(instance, key, fallback) {
  const provides = instance.parent ? instance.parent.provides : instance.appContext.provides
  return key in provides ? provides[key] : fallback // walks the prototype chain
}`,
        lang: 'js',
        title: 'mental model of provide / inject (simplified)',
      },
      `
**Injection is not reactive by itself.** \`inject\` returns exactly the value that was provided. Provide a ref or reactive object and children stay in sync; provide \`openId.value\` and they receive a number that never changes. \`readonly()\` gives children a live view they can't write to.

**\`defineModel()\` is sugar** for a \`modelValue\` prop plus an \`update:modelValue\` emit, returned as a ref. Assigning \`model.value = newObject\` emits; mutating \`model.value.city = 'x'\` would mutate the parent's object directly — legal JavaScript, but it bypasses one-way data flow.
`,
    ],
    production: `
- **Rule of three:** extract a pattern the third time you need it, not the first. Premature generic components (a \`<DataTable>\` with 40 props on day one) are as costly as monoliths.
- **Composables first** for logic reuse; components when you also want a template-level API or shared structure.
- **Presentational components are your design-system layer.** Keep them prop-driven so they can be documented in isolation and reused across features (see [design systems](lesson:design-systems)).
- **Compound components:** export the injection key from one module, provide read-only state plus explicit actions, and throw a helpful error when a child is used outside its parent.
- **Large tables:** keep sorting, filtering and pagination state in a composable (or the URL query), do it server-side once data is big, and virtualise long lists ([large lists](lesson:large-lists)). Store big read-only row arrays in \`shallowRef\` to skip deep proxying.
- **Large forms:** split by section into components bound with \`v-model\` to slices of one form object; keep validation rules in plain functions or a composable so they're testable. Schema-driven forms pay off when *many* forms share structure — for two or three forms, plain templates are easier to read. Client-side validation is a convenience; the server must validate again.
- **Adapters** belong at the edges: vendor SDKs, browser APIs, API payloads, third-party components. If the adapter mirrors the library 1:1 it isn't buying you anything.
`,
  },

  mistakes: [
    {
      title: 'Providing a snapshot instead of reactive state',
      wrong: { code: `const openId = ref(null)\nprovide(AccordionKey, { openId: openId.value, toggle })\n// children receive null forever`, lang: 'js' },
      right: { code: `const openId = ref(null)\nprovide(AccordionKey, { openId: readonly(openId), toggle })`, lang: 'js' },
      explanation: '`openId.value` is read once, at setup time — children get a plain value that never changes. Provide the ref (read-only if children shouldn\'t write) so every injector stays in sync.',
    },
    {
      title: 'A "presentational" component that secretly fetches or reads a store',
      wrong: { code: `<!-- UserCard.vue -->\n<script setup>\nimport { useUserStore } from '@/stores/user'\nconst store = useUserStore()  // hidden dependency\n</script>\n\n<template><p>{{ store.current.name }}</p></template>`, lang: 'vue' },
      right: { code: `<!-- UserCard.vue -->\n<script setup>\ndefineProps({ user: { type: Object, required: true } })\n</script>\n\n<template><p>{{ user.name }}</p></template>`, lang: 'vue' },
      explanation: 'A card that reaches into a store can only ever show *the current user*, needs that store in every test and can\'t appear in a list of other users. Let the container decide which user; let the card display it.',
    },
    {
      title: 'The boolean-prop "god component"',
      wrong: { code: `<AppCard\n  :is-compact="true"\n  :show-footer="false"\n  :is-admin-mode="true"\n  :hide-avatar="true"\n  :use-alt-header="true"\n/>`, lang: 'vue' },
      right: { code: `<AppCard compact>\n  <template #header><AdminHeader /></template>\n  …\n</AppCard>`, lang: 'vue' },
      explanation: 'Every flag doubles the number of combinations to test, and the template fills with `v-if`s. Slots and composition (small pieces assembled by the caller) scale better than switches.',
    },
    {
      title: 'Mutating props in a presentational component',
      wrong: { code: `const sorted = computed(() =>\n  props.rows.sort((a, b) => a.total - b.total) // sorts the PARENT's array\n)`, lang: 'js' },
      right: { code: `const sorted = computed(() =>\n  [...props.rows].sort((a, b) => a.total - b.total)\n)`, lang: 'js' },
      explanation: '`Array.prototype.sort()` sorts in place, so this quietly reorders the parent\'s data and puts a side effect inside a computed. Copy first (or use `toSorted()`, ES2023) — or better, emit `sort` and let the owner decide.',
    },
    {
      title: 'A renderless component where a composable would do',
      wrong: { code: `<MousePosition v-slot="{ x, y }">\n  <Tooltip :x="x" :y="y" />\n</MousePosition>`, lang: 'vue' },
      right: { code: `const { x, y } = useMouse()\n// <Tooltip :x="x" :y="y" />`, lang: 'js' },
      explanation: 'If the component renders nothing and callers just need values, a composable is lighter (no extra instance, no extra template nesting) and works in plain JavaScript too.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: injection "Symbol(Accordion)" not found` and `inject()` returns `undefined`.',
      cause: 'The child is rendered outside its provider (wrong place in the tree, or teleported out of the subtree), the two files import different keys, or `provide()` runs too late (e.g. inside `onMounted`, after the children\'s setup already ran).',
      fix: 'Call `provide()` synchronously in the parent\'s setup, import the same Symbol from one shared module, and give `inject` a `null` default plus a clear error for misuse.',
    },
    {
      symptom: 'A custom cell slot never appears; the table shows the default value instead.',
      cause: 'Slot name mismatch — e.g. `#cell-Total` vs the generated `cell-total`, or the column key differs from the slot suffix.',
      fix: 'Check the exact names the child generates (Vue DevTools shows a component\'s slots). For computed names in your own templates use dynamic slot syntax: `#[name]="…"`.',
    },
    {
      symptom: 'Typing in a form section updates the field but the parent\'s summary stays stale.',
      cause: 'The section copied the prop into local state (`const local = ref({ ...props.modelValue })`) and never emits changes back.',
      fix: 'Bind the section with `defineModel()` (3.4+) or `modelValue` + `update:modelValue`, and emit a new object on every change.',
    },
    {
      symptom: 'A large table feels sluggish when anything on the page changes.',
      cause: 'Thousands of deeply reactive rows, expensive inline formatting in every cell, or the whole table re-rendering because it depends on unrelated state.',
      fix: 'Measure first (Vue DevTools / browser profiler). Then: paginate or virtualise, keep rows in `shallowRef`, precompute formatted values, and split the table so unrelated state isn\'t read in its render.',
    },
  ],

  bestPractices: [
    'Give every component one clear job you can describe in a sentence without "and".',
    'Keep presentational components prop-driven: no fetching, no global stores, no router access.',
    'Reuse *logic* with composables; reuse *structure* with components and slots.',
    'For compound components, provide read-only state plus explicit actions with a Symbol key, and throw a helpful error outside the parent.',
    'Prefer configuration (column arrays, slot names) over flags when a generic component must serve many screens.',
    'Wrap third-party libraries and SDKs behind adapters you own, so replacing them touches one file.',
    'Extract abstractions when the pattern repeats (rule of three), not in anticipation of it.',
  ],

  useCases: [
    'A generic `DataTable` with column config, sort events and `#cell-<key>` slots shared by every admin screen.',
    'A checkout form split into `ContactFields`, `AddressFields` (used twice) and `PaymentFields`, each bound with `v-model` to a slice of one form object.',
    'Compound widgets like `<Tabs>`/`<Tab>`, `<Accordion>`/`<AccordionItem>`, `<Menu>`/`<MenuItem>` built on provide/inject.',
    'Renderless `<Paginate>`, `<InfiniteScroll>` or `<Draggable>` components where callers need full control of markup.',
    'An analytics or error-reporting adapter so the vendor can change without touching feature code.',
    'An `<AppDatePicker>` wrapper around a third-party picker so the whole app shares one API and style.',
  ],

  whenToUse: {
    use: [
      'A component mixes data fetching, business rules and markup for several unrelated areas.',
      'The same prop is passed through layers that don\'t use it.',
      'Several screens need the same behaviour but different markup.',
      'Parent and child components only make sense together and share state.',
      'Your code calls a third-party API in many places.',
    ],
    avoid: [
      'A small, stable component that is easy to read as-is — patterns add files and indirection.',
      'Abstracting after seeing a pattern once; wait until the repetition is real.',
      'Reaching for provide/inject or a store just to skip passing one prop one level down.',
      'Building a renderless component when a composable gives callers the same values more simply.',
    ],
  },

  comparison: {
    title: 'Which pattern solves what?',
    headers: ['', 'Container / presentational', 'Renderless (scoped slot)', 'Composable', 'Compound (provide/inject)', 'Adapter'],
    rows: [
      ['Solves', 'data access mixed into markup', 'reusing behaviour while callers own the markup', 'reusing stateful logic', 'a parent and children cooperating without prop wiring', 'isolating code you don\'t control'],
      ['Renders its own UI?', 'presentational: yes · container: mostly composes children', 'no — only `<slot>`', 'no — returns state', 'yes, usually', 'n/a — a module or thin wrapper'],
      ['Talks through', 'props down, events up', 'slot props', 'returned refs and functions', 'an injection key', 'its own small interface'],
      ['Watch out for', 'pass-through layers that add nothing', 'an extra component instance per use', 'hidden coupling to globals', 'an implicit dependency on an ancestor', 'mirroring the library 1:1'],
    ],
    note: 'These combine freely: a container page uses composables, renders presentational and compound components, and everything that touches the outside world goes through adapters and [services](lesson:service-layers).',
  },

  quiz: [
    {
      id: 'design-patterns-q1',
      type: 'mcq',
      prompt: 'You are building `<PlanPicker>` whose `<PlanOption>` children are written freely in its default slot (sometimes wrapped in other markup). Each option needs the current selection and a way to select itself. What fits best?',
      options: [
        { text: 'Pass `selected` and `onSelect` props to every `<PlanOption>` at each call site', why: 'It works, but every usage must wire every option by hand — the parent\'s internals leak into every template that uses it.' },
        { text: 'Compound components: `<PlanPicker>` provides state + a `select` action via a Symbol key; options inject it' },
        { text: 'A Pinia store holding the selected plan', why: 'That makes a local widget global: two pickers on the same page would share one selection.' },
        { text: 'Read the picker through `$parent` inside each option', why: '`$parent` couples the option to the exact tree; one wrapper component in between breaks it. It is discouraged for this reason.' },
      ],
      answer: 1,
      explanation: 'Compound components are designed for exactly this: the parent provides a small context, children inject it no matter how deep they sit inside the parent, and callers write plain markup.',
    },
    {
      id: 'design-patterns-q2',
      type: 'output',
      prompt: '`Toggle.vue` is renderless. Button **a** is clicked three times and button **b** once. What do the buttons show?',
      code: {
        lang: 'vue',
        code: `<!-- Toggle.vue -->
<script setup>
import { ref } from 'vue'
const on = ref(false)
const toggle = () => (on.value = !on.value)
</script>
<template><slot :on="on" :toggle="toggle" /></template>

<!-- App.vue -->
<template>
  <Toggle v-slot="{ on, toggle }">
    <button class="a" @click="toggle">{{ on ? 'ON' : 'off' }}</button>
  </Toggle>
  <Toggle v-slot="{ on, toggle }">
    <button class="b" @click="toggle">{{ on ? 'ON' : 'off' }}</button>
  </Toggle>
</template>`,
      },
      options: [
        'a: ON · b: ON',
        { text: 'a: off · b: ON', why: 'Three toggles from off go off → ON → off → ON, so a ends on ON.' },
        { text: 'a: ON · b: off', why: 'Each `<Toggle>` has its own state, and b was clicked once, so b is ON.' },
        { text: 'Both show the same value because they share the Toggle component', why: 'Each component *instance* runs its own setup and gets its own `on` ref. Sharing a definition never shares state.' },
      ],
      answer: 0,
      explanation: 'Every `<Toggle>` instance has its own `on` ref. a: off→ON→off→ON. b: off→ON. Renderless components are still full component instances.',
    },
    {
      id: 'design-patterns-q3',
      type: 'bug',
      prompt: 'This presentational table component corrupts its parent\'s data. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { computed } from 'vue'
const props = defineProps({ rows: Array, sortKey: String })

const sorted = computed(() =>
  props.rows.sort((a, b) => a[props.sortKey] - b[props.sortKey])
)
</script>

<template>
  <tr v-for="row in sorted" :key="row.id">…</tr>
</template>`,
      },
      answerLine: 6,
      explanation: '`sort()` sorts the array **in place**, so the computed reorders the parent\'s own array — a hidden side effect that breaks one-way data flow. Copy first: `[...props.rows].sort(…)` or `props.rows.toSorted(…)`.',
    },
    {
      id: 'design-patterns-q4',
      type: 'fill',
      prompt: 'Complete the compound-component wiring: a collision-proof key, and the child reading the provided context.',
      code: {
        lang: 'js',
        code: `// cartKey.js
export const CartKey = ___('Cart')

// CartProvider.vue (setup)
provide(CartKey, { items: readonly(items), add })

// CartLine.vue (setup)
const cart = ___(CartKey)`,
      },
      answer: [['Symbol'], ['inject']],
      explanation: 'A `Symbol` key can never collide with another library\'s string key; `inject(CartKey)` looks it up through the ancestor chain.',
    },
    {
      id: 'design-patterns-q5',
      type: 'mcq',
      prompt: 'Which are warning signs that a component has become **monolithic**? (Select all that apply.)',
      options: [
        { text: 'Its script mixes data fetching, validation, analytics and UI toggles for unrelated parts of the screen' },
        { text: 'It takes many boolean props (`isCompact`, `showFooter`, `isAdminMode`) that switch big chunks of template on and off' },
        { text: 'It renders a list with `v-for`', why: 'Rendering lists is normal and says nothing about size or responsibilities.' },
        { text: 'Changing one area regularly breaks an unrelated area, and it is hard to test any piece in isolation' },
        { text: 'It uses a computed property', why: 'Computed properties are a healthy sign, not a smell.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Monoliths are about *responsibilities*, not features used. Mixed concerns, flag-driven templates and fragile, untestable code are the classic signals.',
    },
    {
      id: 'design-patterns-q6',
      type: 'mcq',
      prompt: 'Five pages need the same "load orders + loading + error + retry" logic, each with completely different markup. What is usually the leanest choice in Vue 3?',
      options: [
        { text: 'A composable, `useOrders()`' },
        { text: 'A renderless `<OrdersSource>` component', why: 'It works, but adds a component instance and slot nesting for logic that renders nothing; the guide recommends composables for pure logic reuse.' },
        { text: 'A global mixin', why: 'Mixins still exist in the Options API but hide where properties come from and collide on names — composables replaced them.' },
        { text: 'Copy the logic into each page', why: 'Five copies to keep in sync when the API or the retry rules change.' },
      ],
      answer: 0,
      explanation: 'A composable runs inside each page\'s own setup, returns refs and functions, and adds no extra component. Reach for a renderless component only when a template-level API is the point.',
    },
    {
      id: 'design-patterns-q7',
      type: 'short',
      prompt: 'Explain the container/presentational split in two or three sentences, and name one concrete benefit in a Vue 3 app that already uses composables.',
      answer: 'Containers (often pages) decide what data is needed and get it — usually by calling composables or stores — while presentational components only receive props and emit events. Even with composables, the split makes presentational components trivial to test and document in isolation, lets you swap the view (table → cards) without touching data logic, and lets the same component display data from different sources.',
    },
  ],

  exercises: [
    {
      id: 'compound-accordion',
      title: 'Wire a compound accordion with provide / inject',
      difficulty: 'intermediate',
      prompt: `
\`<Accordion>\` and \`<AccordionItem>\` are a compound component pair, but nothing connects them yet. Wire them with \`provide\`/\`inject\` — **no props for state**.

- In \`Accordion.vue\`, provide an object under \`AccordionKey\` (from \`accordionKey.js\`) containing a **read-only** \`openId\` and the \`toggle(id)\` function.
- In \`AccordionItem.vue\`, inject it and make \`isOpen\` a \`computed\` that is true when \`openId\` equals this item's \`id\`.
- Clicking a \`.accordion-trigger\` button calls \`toggle(id)\`.
- Only **one** panel may be open at a time; clicking an open trigger closes it.
- Keep the existing ARIA wiring: \`aria-expanded\` on the trigger, \`.accordion-panel\` shown with \`v-show\`.
- Bonus: throw a clear error if \`<AccordionItem>\` is used outside \`<Accordion>\`.
`,
      files: {
        'App.vue': accordionApp,
        'Accordion.vue': accordionStarter,
        'AccordionItem.vue': accordionItemStarter,
        'accordionKey.js': accordionKey,
      },
      hints: [
        'Parent: `provide(AccordionKey, { openId: readonly(openId), toggle })` — import `provide` and `readonly` from vue.',
        'Child: `const accordion = inject(AccordionKey)` then `const isOpen = computed(() => accordion.openId.value === id)`.',
        'Add `@click="accordion.toggle(id)"` to the trigger button. `id` comes from `useId()`, so every item has a unique one.',
      ],
      solution: {
        explanation: 'The parent owns the state and the only function that changes it; children receive a read-only ref, so they can never get out of sync or mutate each other. Because `inject` looks up the ancestor chain, items keep working even if a caller wraps them in other markup. `useId()` (Vue 3.5+) gives each item a unique id for both the toggle logic and the `aria-controls`/`aria-labelledby` pairing.',
        files: {
          'App.vue': accordionApp,
          'Accordion.vue': accordionSolution,
          'AccordionItem.vue': accordionItemSolution,
          'accordionKey.js': accordionKey,
        },
      },
      tests: [
        {
          name: 'all panels start closed',
          code: `const panels = findAll('.accordion-panel')
expect(panels).toHaveLength(3)
expect(panels.filter((p) => isVisible(p))).toHaveLength(0)
expect(findAll('.accordion-trigger').every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true)`,
        },
        {
          name: 'clicking a trigger opens its panel',
          code: `const first = findAll('.accordion-trigger')[0]
await click(first)
expect(first.getAttribute('aria-expanded')).toBe('true')
expect(isVisible(findAll('.accordion-panel')[0])).toBe(true)`,
        },
        {
          name: 'only one panel is open at a time',
          code: `const [t1, t2] = findAll('.accordion-trigger')
await click(t1)
await click(t2)
expect(t1.getAttribute('aria-expanded')).toBe('false')
expect(t2.getAttribute('aria-expanded')).toBe('true')
const panels = findAll('.accordion-panel')
expect(isVisible(panels[0])).toBe(false)
expect(isVisible(panels[1])).toBe(true)`,
        },
        {
          name: 'clicking an open trigger closes it',
          code: `const t = findAll('.accordion-trigger')[2]
await click(t)
await click(t)
expect(t.getAttribute('aria-expanded')).toBe('false')
expect(isVisible(findAll('.accordion-panel')[2])).toBe(false)`,
        },
        {
          name: 'each trigger controls its own panel',
          code: `const t = findAll('.accordion-trigger')[1]
const p = findAll('.accordion-panel')[1]
expect(t.getAttribute('aria-controls')).toBe(p.id)
expect(p.getAttribute('aria-labelledby')).toBe(t.id)`,
        },
      ],
    },
    {
      id: 'split-large-form',
      title: 'Split a growing form into reusable sections',
      difficulty: 'advanced',
      prompt: `
The checkout form is turning into a monolith: the shipping address is written inline and billing is about to be copy-pasted. Extract a reusable section instead.

- Build \`AddressFields.vue\`: a \`<fieldset class="address-fields">\` with a \`<legend>\` showing a required \`legend\` prop, and three labelled inputs with classes \`street\`, \`city\` and \`zip\`.
- It works with \`v-model\` on an address object \`{ street, city, zip }\` — use \`defineModel()\` (Vue 3.4+).
- **Never mutate the parent's object in place**: on every input, emit a *new* object (e.g. \`model.value = { ...model.value, city }\`).
- In \`App.vue\`, replace the inline fieldset: render \`<AddressFields>\` inside \`<div class="shipping">\` (bound to \`form.shipping\`, legend **Shipping address**) and inside \`<div class="billing">\` (bound to \`form.billing\`, legend **Billing address**).
- The existing \`.summary-shipping\` and \`.summary-billing\` paragraphs must update as you type.
`,
      files: {
        'App.vue': checkoutStarter,
        'AddressFields.vue': addressStarter,
      },
      hints: [
        'In the child: `defineProps({ legend: String })` and `const address = defineModel({ type: Object, required: true })`.',
        'Bind each input one-way with `:value="address.city"` and handle `@input` with a function that assigns a new object to `address.value`.',
        'In the parent: `<div class="shipping"><AddressFields v-model="form.shipping" legend="Shipping address" /></div>` — and the same for billing.',
      ],
      solution: {
        explanation: 'The form state stays in one place (the parent), and each section owns only its markup and how it reports changes. Assigning a new object to the `defineModel()` ref emits `update:modelValue`, so the parent replaces `form.shipping` — one-way data flow is preserved, and the same component serves shipping and billing. The same shape scales to 20 sections; validation can live in a composable that reads the single form object.',
        files: {
          'App.vue': checkoutSolution,
          'AddressFields.vue': addressSolution,
        },
      },
      tests: [
        { name: 'renders two address sections', code: `expect(findAll('.address-fields')).toHaveLength(2)` },
        {
          name: 'each section shows its legend',
          code: `expect(text('.shipping legend')).toBe('Shipping address')
expect(text('.billing legend')).toBe('Billing address')`,
        },
        {
          name: 'typing in shipping updates the shipping summary',
          code: `await type('.shipping .street', '12 Hill Rd')
await type('.shipping .city', 'Pune')
await type('.shipping .zip', '411001')
expect(text('.summary-shipping')).toBe('Ship to: 12 Hill Rd, Pune 411001')`,
        },
        {
          name: 'billing is independent of shipping',
          code: `await type('.billing .city', 'Lyon')
expect(text('.summary-billing')).toContain('Lyon')
expect(text('.summary-shipping')).not.toContain('Lyon')`,
        },
        {
          name: 'the section emits a new object instead of mutating in place',
          code: `const before = state.form.shipping
await type('.shipping .city', 'Pune')
expect(state.form.shipping.city).toBe('Pune')
expect(state.form.shipping === before).toBe(false)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'design-patterns-container-presentational',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the container/presentational pattern, and is it still relevant in Vue 3 now that we have composables?',
      answer: 'Presentational components receive data through props and emit events; containers decide what data is needed and obtain it. In Vue 3 the container\'s logic usually moves into composables, so containers get thin — but the split remains valuable because presentational components stay pure, testable and reusable, and views can be swapped without touching data logic.',
      explanation: 'Composables changed *where logic lives*, not *why you separate fetching from rendering*. A page calls `useOrders()`; `OrderList` just renders whatever it\'s given.',
      whyAsked: 'Checks whether you understand separation of concerns beyond buzzwords, and whether you know how Vue 3 changed the pattern.',
      mistakes: [
        'Describing it as a strict rule that every component must be one or the other.',
        'Saying composables made it obsolete without explaining what the split still buys.',
        'Letting "presentational" components read global stores.',
      ],
      followUps: ['Where would you put loading and error state?', 'How does this split help with component documentation or visual testing?', 'When is the split overkill?'],
      modelAnswer: 'Presentational components are props in, events out: no fetching, no store, no router. Containers — usually pages — decide what data the screen needs and when to load it. In Vue 3 most container logic moves into composables like `useOrders()`, so the container becomes a thin layer that wires a composable to presentational components. The split is still worth it: presentational components are trivial to test and document, can show data from any source, and I can replace a table with cards without touching data logic. For a tiny component I would not force it.',
    },
    {
      id: 'design-patterns-renderless-vs-composable',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Renderless component or composable: when would you choose each?',
      options: [
        'Always a renderless component — composables cannot hold state',
        'Composable for pure logic reuse; renderless component when you also want a template-level API (e.g. slot-driven <Paginate> or <DataTable>)',
        'They are identical; pick either',
        'Renderless components for logic, composables only for formatting helpers',
      ],
      correctOption: 1,
      answer: 'Use a composable when callers just need reactive state and functions — it runs inside the caller and adds no component instance. Use a renderless component when you want consumers to drive the behaviour declaratively from the template, or when the component also needs to coordinate structure, slots or child components.',
      explanation: 'Both share logic. A composable is a function; a renderless component is a component whose only output is its slot. The official guide recommends composables for most logic reuse.',
      whyAsked: 'Separates people who know both tools from people who learned one tutorial.',
      mistakes: ['Claiming composables can\'t hold state.', 'Ignoring the extra instance cost of renderless components.', 'Not knowing scoped slots are how renderless components expose data.'],
      followUps: ['How would you implement the same pagination logic both ways?', 'Can a renderless component use a composable internally?'],
      modelAnswer: 'Both share stateful logic. A composable is a function called in the consumer\'s setup; it returns refs and functions and adds no component, so it\'s my default. A renderless component renders only a scoped slot and passes its state as slot props — it\'s useful when I want a declarative, template-level API, like `<Paginate v-slot="{ pageItems }">`, or when it also coordinates child components. Often the best design is both: the renderless component is a thin template wrapper around a composable.',
    },
    {
      id: 'design-patterns-inject-snapshot',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This compound `<Tabs>` component renders, but clicking a tab never changes which panel is shown. Why?',
      code: {
        lang: 'js',
        code: `// Tabs.vue (setup)
const active = ref('profile')
provide(TabsKey, {
  active: active.value,
  select: (name) => (active.value = name),
})

// Tab.vue (setup)
const tabs = inject(TabsKey)
const isActive = computed(() => tabs.active === props.name)`,
      },
      answer: '`active.value` is read once at setup, so children receive the string `\'profile\'` forever. `select()` does update the ref, but nobody is reading the ref. Provide the ref itself — `active: readonly(active)` — and read `tabs.active.value` in the child.',
      explanation: 'Reactivity travels with refs and reactive objects, not with plain values copied out of them.',
      whyAsked: 'A very common real bug in compound components; tests understanding of how reactivity crosses provide/inject.',
      mistakes: ['Blaming `computed` caching.', 'Suggesting `forceUpdate` or a `key` hack.', 'Providing the writable ref to all children without considering ownership.'],
      followUps: ['Why wrap it in `readonly()`?', 'What happens if a child is rendered outside `<Tabs>`?', 'Could you provide a `reactive()` object instead?'],
      modelAnswer: 'The provider passes `active.value`, which is just the string at setup time, so the injected object never changes even though the ref does. Inject doesn\'t add reactivity — it hands over exactly what was provided. I\'d provide the ref, wrapped in `readonly()` so children can only change it through `select()`, and read `.value` in the child\'s computed. A reactive object for the whole context would also work.',
    },
    {
      id: 'design-patterns-prop-drilling',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A `currentUser` object is passed as a prop through `AppLayout → Sidebar → NavSection → UserMenu`, and only `UserMenu` uses it. A new `theme` value is about to follow the same path. What would you do?',
      answer: 'Pick the tool by the kind of data. `currentUser` is app-wide session state used in many places → a store (or an app-level `provide`), and `UserMenu` reads it directly. `theme` is a subtree-wide setting → `provide` at the layout and `inject` where needed. If a parent just wants to control what appears deep down, pass content through slots instead of data through props.',
      explanation: 'Prop drilling is a symptom: intermediate components are carrying data they don\'t own. Slots, provide/inject and stores each remove the carriers in a different way.',
      whyAsked: 'Shows judgement: interviewers want a decision framework, not "always use Pinia".',
      mistakes: ['Moving everything into a global store by reflex.', 'Using a global event bus.', 'Not mentioning slots as a way to avoid drilling.'],
      followUps: ['What are the downsides of provide/inject?', 'How would you test `UserMenu` once it reads from a store?', 'When is passing props the right answer after all?'],
      modelAnswer: 'I\'d first ask what kind of data it is. The current user is session-wide and used across the app, so it belongs in a store like Pinia and `UserMenu` reads it directly — the three middle layers stop carrying it. Theme is a setting for everything under the layout, so `provide` at the layout and `inject` with a sensible default fits. And if the layout only needs to decide *what* goes in the sidebar, a slot avoids passing data at all. One or two levels of props is fine — explicit beats clever.',
    },
    {
      id: 'design-patterns-data-table-api',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design the API of a reusable `<DataTable>` that every admin screen will use, including large datasets.',
      answer: 'Props: `columns` (key, label, sortable, align, width), `rows`, `rowKey`, `loading`, sort state (`sortKey`, `sortDir`) and optional selection via `v-model:selected`. Events: `sort`, `row-click`, and paging events (or `v-model:page`). Slots: `#cell-<key>="{ row, value }"`, `#header-<key>`, `#empty`, `#loading`, `#actions="{ row }"`. Keep it controlled: the table emits intent; the owner (a `useTable` composable) does sorting/filtering/pagination — server-side for big data, so the table never needs every row. Add virtualisation for long pages, `aria-sort` on headers and real `<table>` semantics.',
      explanation: 'A good generic component is *controlled* (state lives outside), *configurable* (columns are data) and *extensible* (slots for anything custom). That combination lets one component serve many screens without a flag explosion.',
      code: {
        lang: 'vue',
        code: `<DataTable
  :columns="columns"
  :rows="rows"
  row-key="id"
  :loading="loading"
  :sort-key="sortKey"
  :sort-dir="sortDir"
  v-model:selected="selectedIds"
  @sort="sortBy"
>
  <template #cell-status="{ value }"><StatusBadge :status="value" /></template>
  <template #actions="{ row }"><RowMenu :order="row" /></template>
  <template #empty>No orders match your filters.</template>
</DataTable>`,
      },
      whyAsked: 'Generic components are where senior engineers either save or sink a codebase; this tests API design, scalability and accessibility thinking.',
      mistakes: [
        'Doing sorting/filtering inside the table on the full dataset with no plan for server-side data.',
        'One boolean prop per screen-specific need instead of slots.',
        'Building it with divs and losing table semantics for screen readers.',
      ],
      followUps: ['Where does the sort state live, and could it live in the URL?', 'How would you handle 50,000 rows?', 'How do you keep the column config type-safe?'],
      modelAnswer: 'I\'d make it controlled, configurable and extensible. Columns are data — key, label, sortable, alignment. Rows and the sort and selection state come in as props or v-models, and the table only emits intent like `sort` and `row-click`; a `useTable` composable or the URL owns that state. Anything custom goes through slots: `#cell-<key>` with the row, `#empty`, `#actions`. For big data I\'d paginate and sort on the server, keep rows in a `shallowRef`, and add virtual scrolling for long pages. I\'d keep real `<table>` markup with `aria-sort` so it stays accessible.',
    },
    {
      id: 'design-patterns-monolith-refactor',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'You inherit a 1,200-line `CheckoutPage.vue` that handles cart display, address forms, payment, coupon logic and analytics. How do you break it up safely?',
      answer: 'First add characterisation tests around current behaviour (component or E2E). Then extract in small, reviewable steps: pure helpers (price/coupon maths) into plain functions with unit tests; stateful logic into composables (`useCoupon`, `useCheckoutForm`); UI regions into presentational components (`CartSummary`, `AddressFields` ×2, `PaymentFields`) bound via props and v-model; analytics behind an adapter. Keep the page as the container that wires them. Ship each step separately and keep behaviour identical until the refactor is done.',
      explanation: 'The order matters: tests first, then the lowest-risk extractions (pure functions), then logic, then UI. Small steps keep every pull request reviewable and revertible.',
      whyAsked: 'Every senior role involves legacy code. Interviewers want a safe, incremental plan — not "rewrite it".',
      mistakes: ['Proposing a big-bang rewrite.', 'Refactoring without tests.', 'Splitting purely by line count instead of by responsibility.'],
      followUps: ['How do you split the work across pull requests?', 'What would you extract first, and why?', 'How do you know you are done?'],
      modelAnswer: 'I wouldn\'t rewrite it. I\'d start by pinning current behaviour with tests — a few component tests and an end-to-end happy path. Then I\'d extract in small PRs, lowest risk first: pure functions like price and coupon calculations with unit tests, then stateful logic into composables like `useCoupon`, then UI regions into presentational components, with `AddressFields` reused for shipping and billing. Analytics goes behind an adapter. The page ends up as a thin container. Each PR keeps behaviour identical so it\'s easy to review and revert. The [legacy-migration lesson](lesson:legacy-migration) covers this process in depth.',
    },
    {
      id: 'design-patterns-coding-paginate',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Implement a **renderless** `<Paginate>` component. It takes `items` (Array) and `perPage` (Number, default 5) and exposes `pageItems`, `page`, `pageCount`, `hasPrev`, `hasNext`, `prev` and `next` through its default scoped slot. It must render no element of its own. `App.vue` already uses it with `per-page="3"`.',
      starter: {
        files: {
          'App.vue': paginateApp,
          'Paginate.vue': paginateStarter,
        },
      },
      tests: [
        {
          name: 'shows the first page of three items',
          code: `expect(findAll('.products li')).toHaveLength(3)
expect(text('.products li')).toBe('Desk lamp')
expect(text('.page-label')).toBe('Page 1 of 4')`,
        },
        {
          name: 'next and previous move between pages',
          code: `await click('.next')
expect(text('.products li')).toBe('Headphones')
expect(text('.page-label')).toBe('Page 2 of 4')
await click('.prev')
expect(text('.products li')).toBe('Desk lamp')`,
        },
        {
          name: 'the last page holds the remainder and disables Next',
          code: `await click('.next')
await click('.next')
await click('.next')
expect(findAll('.products li')).toHaveLength(1)
expect(text('.products li')).toBe('Mouse pad')
expect(find('.next').disabled).toBe(true)`,
        },
        { name: 'Previous is disabled on page 1', code: `expect(find('.prev').disabled).toBe(true)` },
        { name: 'renders no wrapper element of its own', code: `expect(find('.products').parentElement.id).toBe('app')` },
      ],
      hints: [
        'Keep `const page = ref(1)` and derive everything else with `computed()`.',
        '`pageItems` is `props.items.slice((page - 1) * perPage, page * perPage)`; `pageCount` is `Math.ceil(items.length / perPage)` (at least 1).',
        'The template is a single `<slot :pageItems="pageItems" :page="page" … />` — nothing else.',
      ],
      answer: 'Hold the current page in a ref, derive `pageItems`, `pageCount`, `hasPrev` and `hasNext` with computeds, guard `prev`/`next`, and pass everything as slot props from a template that contains only `<slot>`.',
      solution: {
        files: {
          'App.vue': paginateApp,
          'Paginate.vue': paginateSolution,
        },
      },
      explanation: 'Because the template is only a `<slot>`, the component renders whatever the caller writes, wherever the caller puts it — the definition of renderless. All state is derived from one ref, so the label, buttons and list can never disagree. The `watch` keeps the page in range if the list shrinks.',
      whyAsked: 'Tests scoped slots, derived state and API design in one small task.',
      mistakes: ['Wrapping the slot in a `<div>` (it\'s no longer renderless).', 'Storing `pageItems` in a ref and forgetting to update it.', 'Letting `page` go past `pageCount` when items shrink.'],
      followUps: ['How would you write the same thing as a `usePagination()` composable?', 'How would you sync `page` with the URL query?', 'What changes if pagination happens on the server?'],
      modelAnswer: 'I keep one source of truth, `page`, and derive the rest: `pageCount` from items length and `perPage`, `pageItems` with a slice, `hasPrev`/`hasNext` as booleans. `prev` and `next` are guarded so they can\'t leave the range, and a watcher clamps the page if the list shrinks. The template is just a `<slot>` with those values as slot props, so the caller owns all markup. In practice I\'d put the logic in a `usePagination` composable and make the component a thin wrapper.',
    },
  ],

  takeaways: [
    'Patterns are named combinations of props, events, slots, provide/inject and composables — shared vocabulary, not rules.',
    'Container/presentational: pages decide what data and when; presentational components are props in, events out.',
    'Renderless components expose behaviour through scoped slots; for pure logic reuse, a composable is usually leaner.',
    'Compound components share a read-only context plus actions via a Symbol injection key — never provide a `.value` snapshot.',
    'Adapters isolate libraries and APIs you don\'t control; generic components stay controlled, configurable and slot-extensible.',
    'Fix prop drilling with the right tool: slots for content, provide/inject for subtrees, stores for app-wide state.',
  ],
}
