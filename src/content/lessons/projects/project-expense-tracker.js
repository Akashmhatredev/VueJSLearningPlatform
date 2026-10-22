// Project 3: Expense Tracker — forms, computed totals, filtering, reusable components, a hand-drawn SVG chart.

const baseCss = `/* Global look for the expense tracker (imported once by App.vue) */
.expense-app {
  --ink: #1d1d1f;
  --muted: #5f5f6b;
  --line: #e2e2e9;
  --soft: #f6f6f9;
  --accent: #3b5bdb;
  --danger: #c92a2a;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
  color: var(--ink);
}
.expense-app button,
.expense-app input,
.expense-app select { font: inherit; }
.expense-app :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
`

const moneyJs = `// Money helpers. Amounts are stored as INTEGER CENTS everywhere:
// 12.50 dollars is 1250. Integers add up exactly; decimals in binary
// floating point do not (try 0.1 + 0.2 in the console).

export const MAX_CENTS = 10000000 // 100,000.00

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatCents(cents) {
  return formatter.format(cents / 100)
}

// "12.5" -> 1250, "0.29" -> 29, "3" -> 300.
// Returns null for anything that is not a plain amount with at most 2 decimals.
export function parseAmountToCents(input) {
  const text = String(input).trim()
  if (!/^\\d+(\\.\\d{1,2})?$/.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
`

const starterMoneyJs = `// Money helpers. Amounts are stored as INTEGER CENTS everywhere:
// 12.50 dollars is 1250. Integers add up exactly; decimals in binary
// floating point do not (try 0.1 + 0.2 in the console).

export const MAX_CENTS = 10000000 // 100,000.00

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatCents(cents) {
  return formatter.format(cents / 100)
}

// "12.5" -> 1250, "0.29" -> 29, "3" -> 300.
// Returns null for anything that is not a plain amount with at most 2 decimals.
export function parseAmountToCents(input) {
  // TODO (step 1): validate with a regular expression, then build the cents
  // from the whole part and the (padded) fraction — no floating point maths.
  return null
}
`

const expensesHeader = `import { parseAmountToCents, MAX_CENTS } from './money.js'

export const CATEGORIES = [
  { id: 'food', label: 'Food', color: '#d9480f' },
  { id: 'transport', label: 'Transport', color: '#1864ab' },
  { id: 'bills', label: 'Bills', color: '#6741d9' },
  { id: 'fun', label: 'Fun', color: '#2b8a3e' },
  { id: 'other', label: 'Other', color: '#495057' },
]

const FALLBACK = CATEGORIES[CATEGORIES.length - 1]

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) ?? FALLBACK
}

// Dates are stored as "YYYY-MM-DD" strings: exactly what <input type="date"> gives you.
export const SAMPLE_EXPENSES = [
  { id: 1, description: 'Groceries', amountCents: 6420, category: 'food', date: '2026-10-03' },
  { id: 2, description: 'Bus pass', amountCents: 4500, category: 'transport', date: '2026-10-01' },
  { id: 3, description: 'Cinema tickets', amountCents: 2400, category: 'fun', date: '2026-10-05' },
  { id: 4, description: 'Electricity bill', amountCents: 7815, category: 'bills', date: '2026-09-28' },
  { id: 5, description: 'Lunch with Sam', amountCents: 1850, category: 'food', date: '2026-09-21' },
  { id: 6, description: 'Bike repair', amountCents: 3000, category: 'transport', date: '2026-09-14' },
]

// "2026-10-05" -> "2026-10"
export function monthKey(isoDate) {
  return isoDate.slice(0, 7)
}

// Format in UTC so a date never shifts by a day in the user's time zone.
const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export function monthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)))
}

export function formatDay(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return dayFormatter.format(new Date(Date.UTC(year, month - 1, day)))
}
`

const starterExpensesJs = `${expensesHeader}
// Sum of amountCents.
export function totalCents(expenses) {
  // TODO (step 5)
  return 0
}

// [{ category: 'food', cents: 8270 }, ...] — biggest first, only categories with spending.
export function totalsByCategory(expenses) {
  // TODO (step 6)
  return []
}

// Returns an object of error messages, e.g. { amount: 'Enter an amount like 12.50.' }.
// An empty object means the draft is valid.
export function validateExpense(draft) {
  // TODO (step 3)
  return {}
}
`

const expensesJs = `${expensesHeader}
// Sum of amountCents.
export function totalCents(expenses) {
  return expenses.reduce((sum, expense) => sum + expense.amountCents, 0)
}

// [{ category: 'food', cents: 8270 }, ...] — biggest first, only categories with spending.
export function totalsByCategory(expenses) {
  const sums = new Map()
  for (const expense of expenses) {
    sums.set(expense.category, (sums.get(expense.category) ?? 0) + expense.amountCents)
  }
  return [...sums]
    .map(([category, cents]) => ({ category, cents }))
    .sort((a, b) => b.cents - a.cents)
}

// Returns an object of error messages, e.g. { amount: 'Enter an amount like 12.50.' }.
// An empty object means the draft is valid.
export function validateExpense(draft) {
  const errors = {}

  const description = draft.description.trim()
  if (!description) errors.description = 'Describe what you spent money on.'
  else if (description.length > 60) errors.description = 'Keep it under 60 characters.'

  const cents = parseAmountToCents(draft.amount)
  if (cents === null) errors.amount = 'Enter an amount like 12.50.'
  else if (cents === 0) errors.amount = 'The amount must be more than 0.'
  else if (cents > MAX_CENTS) errors.amount = 'That is more than 100,000.'

  if (!CATEGORIES.some((c) => c.id === draft.category)) errors.category = 'Pick a category.'
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(draft.date)) errors.date = 'Pick a date.'

  return errors
}
`

// ---------------------------------------------------------------- reusable components (given complete in the starter)

const formFieldVue = `<script setup>
import { useId } from 'vue'

// A reusable label + control + error wrapper.
// The control itself comes from the parent through a scoped slot, so this
// works for inputs, selects and textareas alike.
defineProps({
  label: { type: String, required: true },
  error: { type: String, default: '' },
})

const id = useId() // unique per instance (Vue 3.5+)
const errorId = id + '-error'
</script>

<template>
  <div class="field" :class="{ 'has-error': error }">
    <label :for="id" class="field-label">{{ label }}</label>
    <slot :id="id" :invalid="Boolean(error)" :describedby="error ? errorId : undefined" />
    <p v-if="error" :id="errorId" class="field-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.field { display: grid; gap: 4px; }
.field-label { font-size: 0.85rem; font-weight: 600; }
.field :slotted(input),
.field :slotted(select) { padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
.has-error :slotted(input),
.has-error :slotted(select) { border-color: var(--danger); }
.field-error { margin: 0; color: var(--danger); font-size: 0.85rem; }
</style>`

const statCardVue = `<script setup>
// A small display card. Extra attributes (like class="stat-total") fall
// through to the root <article> automatically.
defineProps({
  label: { type: String, required: true },
  value: { type: String, required: true },
  detail: { type: String, default: '' },
})
</script>

<template>
  <article class="stat">
    <h2 class="stat-label">{{ label }}</h2>
    <p class="stat-value">{{ value }}</p>
    <p v-if="detail" class="stat-detail">{{ detail }}</p>
  </article>
</template>

<style scoped>
.stat { padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.stat-label { margin: 0; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.stat-value { margin: 4px 0 0; font-size: 1.6rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.stat-detail { margin: 2px 0 0; color: var(--muted); font-size: 0.85rem; }
</style>`

// ---------------------------------------------------------------- form

const formStyles = `<style scoped>
.expense-form { display: grid; gap: 12px; align-content: start; padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--soft); }
.expense-form h2 { margin: 0; font-size: 1.1rem; }
.add-btn { padding: 10px; border: 0; border-radius: 8px; background: var(--ink); color: #fff; cursor: pointer; }
.form-status { margin: 0; color: var(--danger); font-size: 0.9rem; }
</style>`

const formTemplate = `<template>
  <form class="expense-form" novalidate @submit.prevent="submit">
    <h2>Add an expense</h2>

    <FormField v-slot="{ id, invalid, describedby }" label="Description" :error="visibleErrors.description">
      <input
        :id="id"
        v-model="draft.description"
        class="input-description"
        type="text"
        maxlength="60"
        autocomplete="off"
        :aria-invalid="invalid"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField v-slot="{ id, invalid, describedby }" label="Amount (USD)" :error="visibleErrors.amount">
      <input
        :id="id"
        v-model="draft.amount"
        class="input-amount"
        type="text"
        inputmode="decimal"
        placeholder="12.50"
        autocomplete="off"
        :aria-invalid="invalid"
        :aria-describedby="describedby"
      />
    </FormField>

    <FormField v-slot="{ id, invalid, describedby }" label="Category" :error="visibleErrors.category">
      <select :id="id" v-model="draft.category" class="input-category" :aria-invalid="invalid" :aria-describedby="describedby">
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.label }}</option>
      </select>
    </FormField>

    <FormField v-slot="{ id, invalid, describedby }" label="Date" :error="visibleErrors.date">
      <input
        :id="id"
        v-model="draft.date"
        class="input-date"
        type="date"
        :aria-invalid="invalid"
        :aria-describedby="describedby"
      />
    </FormField>

    <p v-if="statusMessage" class="form-status" role="alert">{{ statusMessage }}</p>
    <button type="submit" class="add-btn">Add expense</button>
  </form>
</template>`

const starterFormVue = `<script setup>
import { reactive } from 'vue'
import FormField from './FormField.vue'
// TODO (step 3): import { validateExpense } from '../expenses.js'
// TODO (step 3): import { parseAmountToCents } from '../money.js'

defineProps({
  categories: { type: Array, required: true },
})
// TODO (step 3): declare the 'add' event

const draft = reactive({ description: '', amount: '', category: 'food', date: todayISO() })

// TODO (step 3): errors (computed from validateExpense), a submitted flag,
// visibleErrors (only after the first submit) and a statusMessage.
const visibleErrors = {}
const statusMessage = ''

function todayISO() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
}

function submit() {
  // TODO (step 3): validate, emit 'add' with
  // { description, amountCents, category, date }, then reset description + amount
}
</script>

${formTemplate}

${formStyles}`

const formVue = `<script setup>
import { reactive, ref, computed } from 'vue'
import FormField from './FormField.vue'
import { validateExpense } from '../expenses.js'
import { parseAmountToCents } from '../money.js'

defineProps({
  categories: { type: Array, required: true },
})
const emit = defineEmits(['add'])

// One reactive object for the whole draft: it is replaced field by field, never as a whole.
const draft = reactive({ description: '', amount: '', category: 'food', date: todayISO() })
const submitted = ref(false)

// Errors are DERIVED from the draft, so they update as the user fixes them.
const errors = computed(() => validateExpense(draft))
const errorCount = computed(() => Object.keys(errors.value).length)
// Don't shout at people before they have tried to submit.
const visibleErrors = computed(() => (submitted.value ? errors.value : {}))
const statusMessage = computed(() => {
  if (!submitted.value || errorCount.value === 0) return ''
  return errorCount.value === 1 ? 'Please fix 1 field.' : 'Please fix ' + errorCount.value + ' fields.'
})

function todayISO() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate())
}

function submit() {
  submitted.value = true
  if (errorCount.value > 0) return

  emit('add', {
    description: draft.description.trim(),
    amountCents: parseAmountToCents(draft.amount),
    category: draft.category,
    date: draft.date,
  })

  // Keep category and date: people often enter several expenses from the same day.
  draft.description = ''
  draft.amount = ''
  submitted.value = false
}
</script>

${formTemplate}

${formStyles}`

// ---------------------------------------------------------------- table

const tableTemplate = (deleteHandler) => `<template>
  <table v-if="expenses.length" class="expense-table">
    <caption class="visually-hidden">Expenses, newest first</caption>
    <thead>
      <tr>
        <th scope="col">Date</th>
        <th scope="col">Description</th>
        <th scope="col">Category</th>
        <th scope="col" class="num">Amount</th>
        <th scope="col"><span class="visually-hidden">Actions</span></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="expense in expenses" :key="expense.id" class="expense-row">
        <td class="muted">{{ formatDay(expense.date) }}</td>
        <td class="expense-description">{{ expense.description }}</td>
        <td>
          <span class="pill" :style="{ '--pill': categoryById(expense.category).color }">
            {{ categoryById(expense.category).label }}
          </span>
        </td>
        <td class="num expense-amount">{{ formatCents(expense.amountCents) }}</td>
        <td class="num">
          <button
            type="button"
            class="expense-delete"
            :aria-label="'Delete ' + expense.description"${deleteHandler}
          >
            Delete
          </button>
        </td>
      </tr>
    </tbody>
  </table>
  <p v-else class="empty-state">No expenses match these filters.</p>
</template>

<style scoped>
.expense-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
th { text-align: left; font-size: 0.8rem; color: var(--muted); font-weight: 600; padding: 6px 8px; border-bottom: 1px solid var(--line); }
td { padding: 8px; border-bottom: 1px solid var(--line); }
.num { text-align: right; font-variant-numeric: tabular-nums; }
.muted { color: var(--muted); white-space: nowrap; }
.pill { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.8rem; color: #fff; background: var(--pill); }
.expense-delete { border: 0; background: none; color: var(--danger); cursor: pointer; text-decoration: underline; }
.empty-state { margin-top: 12px; padding: 20px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 12px; }
</style>`

const starterTableVue = `<script setup>
import { formatCents } from '../money.js'
import { categoryById, formatDay } from '../expenses.js'

defineProps({
  expenses: { type: Array, required: true },
})
// TODO (step 4): declare a 'remove' event and emit it with the expense id
</script>

${tableTemplate('')}`

const tableVue = `<script setup>
import { formatCents } from '../money.js'
import { categoryById, formatDay } from '../expenses.js'

defineProps({
  expenses: { type: Array, required: true },
})
const emit = defineEmits(['remove'])
</script>

${tableTemplate('\n            @click="emit(\'remove\', expense.id)"')}`

// ---------------------------------------------------------------- chart

const chartStyles = `<style scoped>
.chart { margin: 0; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.chart-title { font-weight: 700; margin-bottom: 8px; }
.chart-svg { display: block; width: 100%; height: auto; }
.bar-label { font-size: 13px; fill: var(--ink); }
.bar-value { font-size: 13px; fill: var(--muted); font-variant-numeric: tabular-nums; }
.chart-empty { margin: 0; color: var(--muted); }
</style>`

const starterChartVue = `<script setup>
import { computed, useId } from 'vue'

// A generic horizontal bar chart: it knows nothing about money or categories.
const props = defineProps({
  title: { type: String, required: true },
  // [{ id, label, value, color }] — drawn in the order given
  items: { type: Array, required: true },
  formatValue: { type: Function, default: (value) => String(value) },
})

// Layout constants, in SVG user units (the viewBox scales them to fit).
const WIDTH = 480
const LABEL_W = 90 // room for the labels on the left
const VALUE_W = 80 // room for the value text on the right
const BAR_MAX = WIDTH - LABEL_W - VALUE_W
const ROW = 34
const BAR_H = 22

const titleId = useId()
const descId = useId()

// TODO (step 6): height, maxValue, barWidth(value) and a text summary
// for screen readers, then draw one <g class="bar"> per item in the SVG.
</script>

<template>
  <figure class="chart">
    <figcaption :id="titleId" class="chart-title">{{ title }}</figcaption>
    <p class="chart-empty">Chart coming soon.</p>
  </figure>
</template>

${chartStyles}`

const chartVue = `<script setup>
import { computed, useId } from 'vue'

// A generic horizontal bar chart: it knows nothing about money or categories.
const props = defineProps({
  title: { type: String, required: true },
  // [{ id, label, value, color }] — drawn in the order given
  items: { type: Array, required: true },
  formatValue: { type: Function, default: (value) => String(value) },
})

// Layout constants, in SVG user units (the viewBox scales them to fit).
const WIDTH = 480
const LABEL_W = 90 // room for the labels on the left
const VALUE_W = 80 // room for the value text on the right
const BAR_MAX = WIDTH - LABEL_W - VALUE_W
const ROW = 34
const BAR_H = 22

const titleId = useId()
const descId = useId()

const height = computed(() => props.items.length * ROW)
// At least 1, so an all-zero chart never divides by zero.
const maxValue = computed(() => Math.max(1, ...props.items.map((item) => item.value)))

function barWidth(value) {
  if (value <= 0) return 0
  // The biggest value gets the full width; tiny values stay visible (2 units).
  return Math.max(2, (value / maxValue.value) * BAR_MAX)
}

// role="img" hides the SVG's inner text from screen readers,
// so the same data is provided as one readable sentence.
const summary = computed(() =>
  props.items.map((item) => item.label + ' ' + props.formatValue(item.value)).join(', '),
)
</script>

<template>
  <figure class="chart">
    <figcaption :id="titleId" class="chart-title">{{ title }}</figcaption>
    <svg
      v-if="items.length"
      class="chart-svg"
      :viewBox="'0 0 ' + WIDTH + ' ' + height"
      role="img"
      :aria-labelledby="titleId"
      :aria-describedby="descId"
    >
      <desc :id="descId">{{ summary }}</desc>
      <g
        v-for="(item, index) in items"
        :key="item.id"
        class="bar"
        :transform="'translate(0, ' + index * ROW + ')'"
      >
        <text class="bar-label" x="0" :y="BAR_H / 2" dy="0.35em">{{ item.label }}</text>
        <rect
          class="bar-rect"
          :x="LABEL_W"
          y="0"
          :width="barWidth(item.value)"
          :height="BAR_H"
          rx="4"
          :fill="item.color"
        />
        <text class="bar-value" :x="LABEL_W + barWidth(item.value) + 6" :y="BAR_H / 2" dy="0.35em">
          {{ formatValue(item.value) }}
        </text>
      </g>
    </svg>
    <p v-else class="chart-empty">No spending to show for this filter.</p>
  </figure>
</template>

${chartStyles}`

// ---------------------------------------------------------------- App

const appStyles = `<style scoped>
.top h1 { margin: 0; font-size: 1.7rem; }
.subtitle { margin: 2px 0 16px; color: var(--muted); }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-bottom: 16px; }
.layout { display: grid; grid-template-columns: minmax(220px, 280px) 1fr; gap: 16px; align-items: start; }
@media (max-width: 720px) { .layout { grid-template-columns: 1fr; } }
.filters { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
.filters label { display: grid; gap: 4px; font-size: 0.85rem; font-weight: 600; }
.filters select { padding: 6px 8px; border: 1px solid var(--line); border-radius: 8px; background: #fff; }
</style>`

const starterAppVue = `<script setup>
import { ref } from 'vue'
import ExpenseForm from './components/ExpenseForm.vue'
import ExpenseTable from './components/ExpenseTable.vue'
import StatCard from './components/StatCard.vue'
import BarChart from './components/BarChart.vue'
import { CATEGORIES, SAMPLE_EXPENSES } from './expenses.js'
import { formatCents } from './money.js'
import './base.css'

const expenses = ref(SAMPLE_EXPENSES.map((expense) => ({ ...expense })))

// TODO (step 4): addExpense(expense) and removeExpense(id)
// TODO (step 5): categoryFilter + monthFilter refs, months (from the data),
//                filtered (newest first), total, filterSummary
// TODO (step 6): chartItems and topCategory from totalsByCategory()
</script>

<template>
  <main class="expense-app">
    <header class="top">
      <h1>Pocket</h1>
      <p class="subtitle">Where did my money go?</p>
    </header>

    <section class="stats" aria-label="Summary">
      <StatCard class="stat-total" label="Total spent" value="$0.00" />
      <StatCard class="stat-count" label="Expenses" :value="String(expenses.length)" />
      <StatCard class="stat-top" label="Top category" value="—" />
    </section>

    <div class="layout">
      <ExpenseForm :categories="CATEGORIES" />

      <section aria-label="Expenses">
        <div class="filters">
          <label>
            Category
            <select class="filter-category">
              <option value="all">All categories</option>
              <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </label>
          <label>
            Month
            <select class="filter-month">
              <option value="all">All months</option>
            </select>
          </label>
        </div>

        <BarChart title="Spending by category" :items="[]" :format-value="formatCents" />
        <ExpenseTable :expenses="expenses" />
      </section>
    </div>
  </main>
</template>

${appStyles}`

const appVue = `<script setup>
import { ref, computed } from 'vue'
import ExpenseForm from './components/ExpenseForm.vue'
import ExpenseTable from './components/ExpenseTable.vue'
import StatCard from './components/StatCard.vue'
import BarChart from './components/BarChart.vue'
import {
  CATEGORIES,
  SAMPLE_EXPENSES,
  categoryById,
  monthKey,
  monthLabel,
  totalCents,
  totalsByCategory,
} from './expenses.js'
import { formatCents } from './money.js'
import './base.css'

// ---- State
const expenses = ref(SAMPLE_EXPENSES.map((expense) => ({ ...expense })))
const categoryFilter = ref('all')
const monthFilter = ref('all')
const announcement = ref('')

// ---- Derived state
// The month options come from the data, newest first.
const months = computed(() => {
  const keys = new Set(expenses.value.map((expense) => monthKey(expense.date)))
  return [...keys].sort().reverse().map((key) => ({ key, label: monthLabel(key) }))
})

const filtered = computed(() =>
  expenses.value
    .filter((e) => categoryFilter.value === 'all' || e.category === categoryFilter.value)
    .filter((e) => monthFilter.value === 'all' || monthKey(e.date) === monthFilter.value)
    // filter() returned a new array, so sorting it never reorders the state itself
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
)

const total = computed(() => totalCents(filtered.value))

const chartItems = computed(() =>
  totalsByCategory(filtered.value).map((row) => {
    const category = categoryById(row.category)
    return { id: category.id, label: category.label, value: row.cents, color: category.color }
  }),
)

const topCategory = computed(() => chartItems.value[0] ?? null)

const filterSummary = computed(() => {
  const month = monthFilter.value === 'all' ? 'All months' : monthLabel(monthFilter.value)
  const category = categoryFilter.value === 'all' ? 'all categories' : categoryById(categoryFilter.value).label
  return month + ' · ' + category
})

// ---- Event handlers
function nextId() {
  return expenses.value.reduce((max, expense) => Math.max(max, expense.id), 0) + 1
}

function addExpense(expense) {
  expenses.value.push({ id: nextId(), ...expense })
  announcement.value = 'Added ' + expense.description + ' (' + formatCents(expense.amountCents) + ').'
}

function removeExpense(id) {
  const removed = expenses.value.find((expense) => expense.id === id)
  expenses.value = expenses.value.filter((expense) => expense.id !== id)
  if (removed) announcement.value = 'Deleted ' + removed.description + '.'
}
</script>

<template>
  <main class="expense-app">
    <header class="top">
      <h1>Pocket</h1>
      <p class="subtitle">Where did my money go?</p>
    </header>

    <section class="stats" aria-label="Summary">
      <StatCard class="stat-total" label="Total spent" :value="formatCents(total)" :detail="filterSummary" />
      <StatCard class="stat-count" label="Expenses" :value="String(filtered.length)" />
      <StatCard
        class="stat-top"
        label="Top category"
        :value="topCategory ? topCategory.label : '—'"
        :detail="topCategory ? formatCents(topCategory.value) : 'No spending yet'"
      />
    </section>

    <div class="layout">
      <ExpenseForm :categories="CATEGORIES" @add="addExpense" />

      <section aria-label="Expenses">
        <div class="filters">
          <label>
            Category
            <select v-model="categoryFilter" class="filter-category">
              <option value="all">All categories</option>
              <option v-for="c in CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </label>
          <label>
            Month
            <select v-model="monthFilter" class="filter-month">
              <option value="all">All months</option>
              <option v-for="m in months" :key="m.key" :value="m.key">{{ m.label }}</option>
            </select>
          </label>
        </div>

        <BarChart title="Spending by category" :items="chartItems" :format-value="formatCents" />
        <ExpenseTable :expenses="filtered" @remove="removeExpense" />
      </section>
    </div>

    <p class="visually-hidden" aria-live="polite">{{ announcement }}</p>
  </main>
</template>

${appStyles}`

// ---------------------------------------------------------------- interview coding question

const budgetStarter = `<script setup>
import { formatCents } from './money.js'

const props = defineProps({
  spent: { type: Number, required: true },  // cents
  budget: { type: Number, required: true }, // cents
})
// TODO: derive the numbers and the state from the props
</script>

<template>
  <div class="budget">
    <p class="budget-text">$0.00 of $0.00</p>
    <svg viewBox="0 0 100 8" class="budget-svg" aria-hidden="true">
      <rect x="0" y="0" width="100" height="8" rx="4" fill="#eee" />
      <rect class="budget-fill" x="0" y="0" width="0" height="8" rx="4" fill="#2b8a3e" />
    </svg>
    <p class="budget-left">$0.00 left</p>
  </div>
</template>`

const budgetSolution = `<script setup>
import { computed } from 'vue'
import { formatCents } from './money.js'

const props = defineProps({
  spent: { type: Number, required: true },  // cents
  budget: { type: Number, required: true }, // cents
})

const isOver = computed(() => props.spent > props.budget)
const percent = computed(() => {
  if (props.budget <= 0) return props.spent > 0 ? 100 : 0
  return Math.min(100, (props.spent / props.budget) * 100)
})
const leftLabel = computed(() =>
  isOver.value
    ? formatCents(props.spent - props.budget) + ' over'
    : formatCents(props.budget - props.spent) + ' left',
)
</script>

<template>
  <div class="budget" :class="{ 'is-over': isOver }">
    <p class="budget-text">{{ formatCents(spent) }} of {{ formatCents(budget) }}</p>
    <svg viewBox="0 0 100 8" class="budget-svg" aria-hidden="true">
      <rect x="0" y="0" width="100" height="8" rx="4" fill="#eee" />
      <rect
        class="budget-fill"
        x="0"
        y="0"
        :width="percent"
        height="8"
        rx="4"
        :fill="isOver ? '#c92a2a' : '#2b8a3e'"
      />
    </svg>
    <p class="budget-left">{{ leftLabel }}</p>
  </div>
</template>`

const budgetApp = `<script setup>
import BudgetBar from './BudgetBar.vue'
</script>

<template>
  <BudgetBar :spent="4250" :budget="10000" />
</template>`

export default {
  id: 'project-expense-tracker',
  kind: 'project',
  title: 'Project 3: Expense Tracker',
  summary: 'Build a budgeting app with a validated form, exact money maths, filters, reusable components and a bar chart you draw yourself in SVG.',
  difficulty: 'intermediate',
  minutes: 120,
  prerequisites: ['project-task-manager', 'v-model-forms', 'computed', 'props', 'slots'],
  related: ['form-validation', 'scoped-slots', 'fallthrough-attrs', 'accessible-reusable-inputs', 'array-methods', 'project-api-explorer'],
  tags: ['project', 'expenses', 'budget', 'forms', 'validation', 'computed', 'filters', 'svg chart', 'money', 'reusable components', 'useId'],
  apis: [
    { name: 'reactive()', summary: 'Holds the form draft as one object whose fields v-model binds to.' },
    { name: 'computed()', summary: 'Derives validation errors, filtered lists, totals and chart data from state.' },
    { name: 'Scoped slots', summary: 'Let the reusable FormField hand an id and ARIA attributes to whatever control the parent puts inside it.' },
    { name: 'useId()', summary: 'Vue 3.5+: generates a unique id per component instance for label/aria wiring.' },
    { name: 'Intl.NumberFormat', summary: 'Formats integer cents as a localised currency string.' },
  ],
  docs: [
    { label: 'Vue Guide — Form Input Bindings', url: 'https://vuejs.org/guide/essentials/forms.html' },
    { label: 'Vue Guide — Computed Properties', url: 'https://vuejs.org/guide/essentials/computed.html' },
    { label: 'Vue Guide — Scoped Slots', url: 'https://vuejs.org/guide/components/slots.html#scoped-slots' },
    { label: 'Vue Guide — Fallthrough Attributes', url: 'https://vuejs.org/guide/components/attrs.html' },
    { label: 'Vue API — useId()', url: 'https://vuejs.org/api/composition-api-helpers.html#useid' },
  ],

  intro: `
*Pocket* is a small budgeting app: you log what you spend, then slice it by **category** and **month** to see where your money actually goes.

You will build:

- an **add-expense form** with friendly validation (description, amount, category, date),
- a **table** of expenses, newest first, with delete,
- **filters** for category and month,
- **summary cards** — total, count and top category — that follow the filters,
- and a **bar chart drawn by hand in SVG**: no chart library, just rectangles and a little maths.

Along the way you will build three **reusable components** — a form field wrapper, a stat card and a generic bar chart — and learn why money should never be stored as a decimal number.
`,

  why: `
Almost every business app is this app in disguise: a form that creates records, a list that shows them, filters that narrow them, and numbers or charts that summarise them. Invoices, orders, workouts, support tickets — same shape.

It is also where small mistakes get expensive:

- Store \`12.10\` as a decimal and add a few of them — floating point will eventually show you \`$0.30000000000000004\`.
- Store the total in a variable you update by hand — the day you add a delete button, the total starts lying.
- Parse \`"2026-10-01"\` with \`new Date()\` and format it in the user's time zone — half the planet sees September 30.

This project shows the patterns that avoid all three: **integer cents**, **derived totals**, and **careful date handling**, wrapped in components you could reuse in your next app.
`,

  eli15: `
Imagine keeping your spending in a notebook. Each line is one purchase: what, how much, which kind, which day. That notebook is your **state** — the only thing you actually write down.

Everything else you work out *from* the notebook: "How much did I spend in October?", "What did I spend most on?", the little bar drawing at the top of the page. You never write those down, because the next purchase would make them wrong. In Vue, those worked-out answers are \`computed\` values.

Two more tricks. First, you write money in **cents** (1250 instead of 12.50) — computers are weirdly bad at adding decimals but perfect at adding whole numbers. Second, you build little reusable **stamps** — a "form field" stamp, a "stat card" stamp, a "bar chart" stamp — so you never redraw the same thing twice.
`,

  analogy: {
    title: 'The shoebox of receipts',
    body: `
Lots of people keep receipts in a shoebox. The receipts are the truth. At the end of the month you tip them out, sort them into piles (food, transport…), add up each pile, and maybe sketch a quick bar chart.

You would never write the monthly total on the box lid and then keep adding receipts — the lid would be wrong by tomorrow. You recompute from the receipts whenever you need the answer. Your app does exactly that, automatically, every time a receipt goes in or out.
`,
    mapping: [
      ['the receipts in the box', '`expenses` — the only state'],
      ['sorting into piles', '`filtered` and `totalsByCategory()`'],
      ['adding up a pile', '`totalCents()` inside a `computed`'],
      ['sketching a bar chart', '`<BarChart>` drawing SVG rectangles from computed data'],
      ['writing the total on the lid', 'the bug: storing a total you must remember to update'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'One list in, many views out',
    caption: 'The expenses array is the only state. Filters narrow it, and every number, row and bar on screen is computed from the filtered list.',
    alt: 'Diagram: ExpenseForm emits add to App, which owns the expenses array and the category and month filters. App computes a filtered list, which feeds three outputs: the totals shown in StatCards, the chart items shown by the generic BarChart, and the rows shown in ExpenseTable, which emits remove back to App. Pure helpers in money.js and expenses.js are used for parsing, validation and totals.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'form', label: 'ExpenseForm', note: 'reactive draft · computed errors', tone: 'paper' },
        { id: 'app', label: 'App.vue', note: 'expenses · categoryFilter · monthFilter', tone: 'acid' },
        { id: 'helpers', label: 'money.js + expenses.js', note: 'parse · validate · totals', tone: 'kraft' },
        { id: 'stats', label: 'StatCard × 3', note: 'total · count · top category', tone: 'cobalt' },
        { id: 'chart', label: 'BarChart', note: 'generic SVG bars', tone: 'cobalt' },
        { id: 'table', label: 'ExpenseTable', note: 'rows · emits remove', tone: 'cobalt' },
      ],
      edges: [
        { from: 'form', to: 'app', label: 'add(expense)' },
        { from: 'helpers', to: 'app', label: 'pure functions' },
        { from: 'app', to: 'stats', label: 'computed totals' },
        { from: 'app', to: 'chart', label: 'chartItems' },
        { from: 'app', to: 'table', label: 'filtered' },
        { from: 'table', to: 'app', id: 'table-up', label: 'remove(id)', dashed: true },
      ],
      steps: [
        { focus: ['form', 'app'], edges: ['form->app'], text: 'The form validates its own draft and emits a clean expense — amount already converted to integer cents.' },
        { focus: ['app', 'helpers'], edges: ['helpers->app'], text: '`App` owns the array and the two filters. Rules (parsing, validation, totals) live in plain JS modules that are easy to test.' },
        { focus: ['app', 'stats', 'chart', 'table'], edges: ['app->stats', 'app->chart', 'app->table'], text: 'One computed `filtered` list feeds every view. Change a filter and the cards, chart and table all update together.' },
        { focus: ['table', 'app'], edges: ['table-up'], text: 'Deleting emits `remove(id)` up to the owner. Because totals are computed, nothing else needs updating by hand.' },
      ],
    },
  },

  requirements: [
    'Show the six sample expenses in `.expense-table` as `.expense-row` rows, **newest first**. Amounts are formatted as US dollars (e.g. **$64.20**).',
    'Store every amount as **integer cents** (`amountCents`). `money.js` exports `parseAmountToCents(text)` (returns `null` for invalid input, e.g. more than 2 decimals) and `formatCents(cents)`.',
    'A `<form class="expense-form">` with `.input-description`, `.input-amount` (text input, `inputmode="decimal"`), `.input-category` and `.input-date` adds an expense on submit and clears description and amount.',
    'Invalid input is not added. After a submit attempt, each problem shows in a `.field-error` linked with `aria-describedby`, and the input gets `aria-invalid="true"`. Rules: description required (max 60 chars); amount > 0 with at most 2 decimals; a known category; a date.',
    '`.filter-category` and `.filter-month` (`<select>`s) narrow the list. Month options are built from the data, labelled like **"September 2026"**, with values like `2026-09`.',
    'Three `StatCard`s follow the filters: `.stat-total` (total), `.stat-count` (number of expenses), `.stat-top` (top category). Values live in `.stat-value`.',
    '`BarChart` (a generic component: props `title`, `items: [{ id, label, value, color }]`, `formatValue`) draws one `<g class="bar">` per item with a `.bar-label`, a `.bar-rect` (widest = biggest value) and a `.bar-value`, plus an SVG `<desc>` summarising the data. With no items it shows `.chart-empty`.',
    'Each row has a `.expense-delete` button. When filters match nothing, show `.empty-state`.',
  ],

  objectives: [
    'Build a validated form with a `reactive` draft, computed errors and accessible error messages.',
    'Handle money safely with integer cents and `Intl.NumberFormat`, and dates safely with ISO strings and UTC formatting.',
    'Derive filtered lists, totals and chart data with `computed()` — including filter options built from the data.',
    'Design reusable components with props, fallthrough attributes and scoped slots (`FormField`, `StatCard`, `BarChart`).',
    'Draw an accessible SVG bar chart by mapping data to coordinates yourself.',
  ],

  playground: {
    title: 'Expense tracker — starter',
    objective: 'The reusable `FormField` and `StatCard` are done and the table renders. Make the form validate and add, wire delete, filters and totals, and draw the chart.',
    files: {
      'App.vue': starterAppVue,
      'components/ExpenseForm.vue': starterFormVue,
      'components/ExpenseTable.vue': starterTableVue,
      'components/BarChart.vue': starterChartVue,
      'components/FormField.vue': formFieldVue,
      'components/StatCard.vue': statCardVue,
      'money.js': starterMoneyJs,
      'expenses.js': starterExpensesJs,
      'base.css': baseCss,
    },
    expected: 'The starter shows the six sample expenses and the empty cards, but the form does nothing, delete does nothing, the filters are static, the total says $0.00 and the chart is a placeholder. Work through the steps until every test passes.',
    tests: [
      {
        name: 'shows the sample expenses with a correct total',
        code: `expect(findAll('.expense-row')).toHaveLength(6)
expect(text('.stat-total .stat-value')).toBe('$259.85')
expect(text('.stat-count .stat-value')).toBe('6')
expect(text('.expense-table')).toContain('$64.20')`,
      },
      {
        name: 'rows are sorted newest first',
        code: `const rows = findAll('.expense-row')
expect(rows[0].textContent).toContain('Cinema tickets')
expect(rows[5].textContent).toContain('Bike repair')`,
      },
      {
        name: 'parseAmountToCents() converts text to exact integer cents',
        code: `const { parseAmountToCents } = requireModule('money.js')
expect(parseAmountToCents('12.5')).toBe(1250)
expect(parseAmountToCents('0.29')).toBe(29)
expect(parseAmountToCents(' 3 ')).toBe(300)
expect(parseAmountToCents('3.999')).toBeNull()
expect(parseAmountToCents('abc')).toBeNull()
expect(parseAmountToCents('1,000')).toBeNull()
expect(parseAmountToCents('-5')).toBeNull()`,
      },
      {
        name: 'adds a valid expense and resets the text fields',
        code: `await type('.input-description', 'Coffee beans')
await type('.input-amount', '12.5')
await select('.input-category', 'food')
await type('.input-date', '2026-10-06')
await submit('.expense-form')
expect(findAll('.expense-row')).toHaveLength(7)
expect(findAll('.expense-row')[0].textContent).toContain('Coffee beans')
expect(text('.stat-total .stat-value')).toBe('$272.35')
expect(find('.input-description').value).toBe('')
expect(find('.input-amount').value).toBe('')`,
      },
      {
        name: 'invalid input shows accessible errors and is not added',
        code: `await type('.input-description', '   ')
await type('.input-amount', '4.999')
await submit('.expense-form')
expect(findAll('.expense-row')).toHaveLength(6)
expect(findAll('.field-error').length).toBeGreaterThanOrEqual(2)
expect(attr('.input-amount', 'aria-invalid')).toBe('true')
const errorId = attr('.input-amount', 'aria-describedby')
expect(errorId).toBeTruthy()
expect(find('[id="' + errorId + '"]').textContent).toContain('12.50')`,
      },
      {
        name: 'a zero amount is rejected',
        code: `await type('.input-description', 'Free sample')
await type('.input-amount', '0')
await type('.input-date', '2026-10-06')
await submit('.expense-form')
expect(findAll('.expense-row')).toHaveLength(6)
expect(text('.expense-form')).toContain('more than 0')`,
      },
      {
        name: 'cents add up exactly (no floating point drift)',
        code: `for (const amount of ['0.10', '0.20']) {
  await type('.input-description', 'Gum')
  await type('.input-amount', amount)
  await type('.input-date', '2026-10-07')
  await submit('.expense-form')
}
expect(text('.stat-total .stat-value')).toBe('$260.15')`,
      },
      {
        name: 'the category filter narrows rows and totals',
        code: `await select('.filter-category', 'food')
expect(findAll('.expense-row')).toHaveLength(2)
expect(text('.stat-total .stat-value')).toBe('$82.70')
expect(text('.stat-count .stat-value')).toBe('2')`,
      },
      {
        name: 'month options come from the data and filter correctly',
        code: `expect(text('.filter-month')).toContain('September 2026')
expect(text('.filter-month')).toContain('October 2026')
await select('.filter-month', '2026-09')
expect(findAll('.expense-row')).toHaveLength(3)
expect(text('.stat-total .stat-value')).toBe('$126.65')`,
      },
      {
        name: 'the chart draws one bar per category, biggest first',
        code: `const bars = findAll('.bar')
expect(bars).toHaveLength(4)
expect(text('.bar-label')).toBe('Food')
const widths = findAll('.bar-rect').map((r) => Number(r.getAttribute('width')))
for (let i = 1; i < widths.length; i++) expect(widths[i]).toBeLessThanOrEqual(widths[i - 1])
expect(widths[0]).toBeGreaterThan(widths[3])
expect(find('.chart-svg desc').textContent).toContain('Food $82.70')
expect(text('.stat-top .stat-value')).toBe('Food')`,
      },
      {
        name: 'chart, table and cards follow the filters, with empty states',
        code: `await select('.filter-month', '2026-09')
expect(findAll('.bar')).toHaveLength(3)
await select('.filter-category', 'fun')
expect(exists('.expense-row')).toBe(false)
expect(exists('.empty-state')).toBe(true)
expect(exists('.chart-empty')).toBe(true)
expect(text('.stat-total .stat-value')).toBe('$0.00')
expect(text('.stat-top .stat-value')).toBe('—')`,
      },
      {
        name: 'delete removes an expense and updates the totals',
        code: `await click('.expense-delete')
expect(findAll('.expense-row')).toHaveLength(5)
expect(text('.expense-table')).not.toContain('Cinema tickets')
expect(text('.stat-total .stat-value')).toBe('$235.85')`,
      },
      {
        name: 'BarChart is generic: it works with any data',
        code: `const chart = mountFile('components/BarChart.vue', {
  title: 'Steps this week',
  items: [
    { id: 'mon', label: 'Mon', value: 3000, color: '#333' },
    { id: 'tue', label: 'Tue', value: 6000, color: '#333' },
  ],
  formatValue: (v) => v + ' steps',
})
const rects = [...chart.el.querySelectorAll('.bar-rect')]
expect(rects).toHaveLength(2)
expect(Number(rects[1].getAttribute('width'))).toBeGreaterThan(Number(rects[0].getAttribute('width')))
expect(chart.find('desc').textContent).toContain('Tue 6000 steps')`,
      },
    ],
  },

  steps: [
    {
      title: 'Model the data: integer cents and ISO dates',
      body: [
        `
Decide the shape of one expense before writing any UI:

\`\`\`js
{ id: 1, description: 'Groceries', amountCents: 6420, category: 'food', date: '2026-10-03' }
\`\`\`

Two deliberate choices:

- **Money as integer cents.** Computers store decimals in binary floating point, which cannot represent \`0.1\` exactly — \`0.1 + 0.2\` is \`0.30000000000000004\`. Whole numbers (up to \`Number.MAX_SAFE_INTEGER\`) add exactly. So \`$64.20\` is stored as \`6420\`, and you only divide by 100 when *formatting*.
- **Dates as \`"YYYY-MM-DD"\` strings.** It is exactly what \`<input type="date">\` gives you, it sorts correctly as text, and the month is just the first seven characters.

Write the parser without touching floating point at all:
`,
        {
          code: `export function parseAmountToCents(input) {
  const text = String(input).trim()
  if (!/^\\d+(\\.\\d{1,2})?$/.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}`,
          lang: 'js',
          title: 'money.js',
        },
        `
The regular expression accepts digits, optionally followed by a dot and one or two digits — so \`"-5"\`, \`"1,000"\` and \`"3.999"\` are rejected. \`"12.5"\` becomes \`12 * 100 + 50 = 1250\`. Formatting is one line with the built-in \`Intl.NumberFormat\`:
`,
        {
          code: `const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatCents(cents) {
  return formatter.format(cents / 100)
}`,
          lang: 'js',
          title: 'money.js',
        },
        {
          callout: 'note',
          title: 'Why a text input for the amount?',
          text: '`<input type="number">` makes Vue cast the value with `parseFloat` (it applies `.number` automatically), which turns "12.50" into 12.5 and accepts things like "1e3". For money we want the exact text the user typed, so we use `type="text"` with `inputmode="decimal"` (which still shows a numeric keyboard on phones) and validate it ourselves.',
        },
      ],
    },
    {
      title: 'Meet the reusable pieces: FormField and StatCard',
      body: [
        `
Two components are already written in the starter. Read them — they show two different ways to make a component reusable.

**\`StatCard\`** takes plain props (\`label\`, \`value\`, \`detail\`). When the parent writes \`<StatCard class="stat-total" …>\`, that \`class\` is not a prop, so Vue applies it to the card's root element automatically ([fallthrough attributes](lesson:fallthrough-attrs)). That is how the tests can target each card.

**\`FormField\`** wraps a label, a control and an error message. The control could be an input, a select or a textarea, so instead of guessing, \`FormField\` exposes a **scoped slot** ([scoped slots](lesson:scoped-slots)): it passes \`id\`, \`invalid\` and \`describedby\` to whatever the parent puts inside.
`,
        {
          code: `<script setup>
import { useId } from 'vue'

defineProps({
  label: { type: String, required: true },
  error: { type: String, default: '' },
})

const id = useId() // unique per instance (Vue 3.5+)
const errorId = id + '-error'
</script>

<template>
  <div class="field" :class="{ 'has-error': error }">
    <label :for="id" class="field-label">{{ label }}</label>
    <slot :id="id" :invalid="Boolean(error)" :describedby="error ? errorId : undefined" />
    <p v-if="error" :id="errorId" class="field-error">{{ error }}</p>
  </div>
</template>`,
          lang: 'vue',
          title: 'components/FormField.vue',
        },
        {
          callout: 'version',
          text: '`useId()` was added in Vue 3.5. It generates ids that are unique per app instance and stable between server and client renders. On older versions, generate ids with a counter or pass them in as props.',
        },
      ],
    },
    {
      title: 'The form: a reactive draft, computed errors, one add event',
      body: [
        `
First write the rules as a pure function in \`expenses.js\` — it takes a draft and returns an object of messages. An empty object means valid.
`,
        {
          code: `export function validateExpense(draft) {
  const errors = {}

  const description = draft.description.trim()
  if (!description) errors.description = 'Describe what you spent money on.'
  else if (description.length > 60) errors.description = 'Keep it under 60 characters.'

  const cents = parseAmountToCents(draft.amount)
  if (cents === null) errors.amount = 'Enter an amount like 12.50.'
  else if (cents === 0) errors.amount = 'The amount must be more than 0.'
  else if (cents > MAX_CENTS) errors.amount = 'That is more than 100,000.'

  if (!CATEGORIES.some((c) => c.id === draft.category)) errors.category = 'Pick a category.'
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(draft.date)) errors.date = 'Pick a date.'

  return errors
}`,
          lang: 'js',
          title: 'expenses.js',
        },
        `
In the form, errors are **computed** from the draft, so they update live as the user fixes things. But we only *show* them after the first submit attempt — nobody likes a red form before they have typed anything ([form validation](lesson:form-validation)).
`,
        {
          code: `const emit = defineEmits(['add'])

const draft = reactive({ description: '', amount: '', category: 'food', date: todayISO() })
const submitted = ref(false)

const errors = computed(() => validateExpense(draft))
const errorCount = computed(() => Object.keys(errors.value).length)
const visibleErrors = computed(() => (submitted.value ? errors.value : {}))

function submit() {
  submitted.value = true
  if (errorCount.value > 0) return

  emit('add', {
    description: draft.description.trim(),
    amountCents: parseAmountToCents(draft.amount),
    category: draft.category,
    date: draft.date,
  })

  draft.description = ''
  draft.amount = ''
  submitted.value = false
}`,
          lang: 'js',
          title: 'components/ExpenseForm.vue',
        },
        `
Each field uses \`FormField\` with \`v-slot\` to receive the wiring:
`,
        {
          code: `<FormField v-slot="{ id, invalid, describedby }" label="Amount (USD)" :error="visibleErrors.amount">
  <input
    :id="id"
    v-model="draft.amount"
    class="input-amount"
    type="text"
    inputmode="decimal"
    :aria-invalid="invalid"
    :aria-describedby="describedby"
  />
</FormField>`,
          lang: 'vue',
        },
        `
\`reactive()\` suits the draft: it is one object whose fields change, and we never replace it as a whole ([reactive](lesson:reactive)). Add \`novalidate\` on the \`<form>\` so the browser's own bubbles don't compete with your messages, and a short \`role="alert"\` summary ("Please fix 2 fields.") so screen-reader users hear that the submit failed.
`,
      ],
    },
    {
      title: 'Table and delete: props down, events up (again)',
      body: [
        `
\`ExpenseTable\` receives the rows to show and emits \`remove\` with an id — the same contract as \`TaskItem\` in [Project 2](lesson:project-task-manager). Use a real \`<table>\` with \`<th scope="col">\` headers: it is tabular data, and screen readers can then announce "Amount, $64.20" as users move through cells.
`,
        {
          code: `const emit = defineEmits(['remove'])`,
          lang: 'js',
          title: 'components/ExpenseTable.vue',
        },
        {
          code: `<button
  type="button"
  class="expense-delete"
  :aria-label="'Delete ' + expense.description"
  @click="emit('remove', expense.id)"
>
  Delete
</button>`,
          lang: 'vue',
        },
        `
In \`App\`, the owner handles both events:
`,
        {
          code: `function addExpense(expense) {
  expenses.value.push({ id: nextId(), ...expense })
  announcement.value = 'Added ' + expense.description + ' (' + formatCents(expense.amountCents) + ').'
}

function removeExpense(id) {
  const removed = expenses.value.find((expense) => expense.id === id)
  expenses.value = expenses.value.filter((expense) => expense.id !== id)
  if (removed) announcement.value = 'Deleted ' + removed.description + '.'
}`,
          lang: 'js',
          title: 'App.vue',
        },
        `
The \`announcement\` goes into a visually hidden \`aria-live="polite"\` paragraph — useful because a newly added expense may be hidden by the current filter.
`,
      ],
    },
    {
      title: 'Filters, month options and totals — all computed',
      body: [
        `
Two refs hold the filters. Everything else is derived ([computed()](lesson:computed), [array methods](lesson:array-methods)):
`,
        {
          code: `const categoryFilter = ref('all')
const monthFilter = ref('all')

// Month options come from the data, newest first: add a November expense and "November 2026" appears.
const months = computed(() => {
  const keys = new Set(expenses.value.map((expense) => monthKey(expense.date)))
  return [...keys].sort().reverse().map((key) => ({ key, label: monthLabel(key) }))
})

const filtered = computed(() =>
  expenses.value
    .filter((e) => categoryFilter.value === 'all' || e.category === categoryFilter.value)
    .filter((e) => monthFilter.value === 'all' || monthKey(e.date) === monthFilter.value)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id),
)

const total = computed(() => totalCents(filtered.value))`,
          lang: 'js',
          title: 'App.vue',
        },
        `
\`.sort()\` mutates the array it is called on. Here that is safe because \`.filter()\` already returned a *new* array — calling \`expenses.value.sort()\` directly inside a computed would reorder your state as a side effect. Dates compare correctly as strings because ISO dates are written biggest unit first.

\`totalCents\` is a one-line \`reduce\` in \`expenses.js\`. Pass the results to the cards: \`<StatCard class="stat-total" label="Total spent" :value="formatCents(total)" />\`.
`,
        {
          callout: 'warn',
          title: 'Dates and time zones',
          text: '`new Date("2026-10-01")` is parsed as midnight **UTC**. Formatting it in a time zone behind UTC (the Americas) shows September 30. That is why `monthLabel()` and `formatDay()` build dates with `Date.UTC(...)` and format with `timeZone: "UTC"`.',
        },
      ],
    },
    {
      title: 'Draw the bar chart in SVG',
      body: [
        `
First, the data. Group the filtered expenses by category, biggest first:
`,
        {
          code: `export function totalsByCategory(expenses) {
  const sums = new Map()
  for (const expense of expenses) {
    sums.set(expense.category, (sums.get(expense.category) ?? 0) + expense.amountCents)
  }
  return [...sums]
    .map(([category, cents]) => ({ category, cents }))
    .sort((a, b) => b.cents - a.cents)
}`,
          lang: 'js',
          title: 'expenses.js',
        },
        `
\`App\` maps that to the chart's generic shape — \`{ id, label, value, color }\` — so \`BarChart\` never needs to know what a category or a cent is.

Now the drawing. SVG is a coordinate system: you place shapes at \`x\`/\`y\` positions in "user units", and the \`viewBox\` scales those units to whatever size the element is on screen. Each bar is a row: label on the left, a \`<rect>\` whose **width is proportional to its value**, and the value text right after it.
`,
        {
          code: `const WIDTH = 480
const LABEL_W = 90
const VALUE_W = 80
const BAR_MAX = WIDTH - LABEL_W - VALUE_W
const ROW = 34
const BAR_H = 22

const height = computed(() => props.items.length * ROW)
const maxValue = computed(() => Math.max(1, ...props.items.map((item) => item.value)))

function barWidth(value) {
  if (value <= 0) return 0
  return Math.max(2, (value / maxValue.value) * BAR_MAX)
}`,
          lang: 'js',
          title: 'components/BarChart.vue',
        },
        {
          code: `<svg
  v-if="items.length"
  class="chart-svg"
  :viewBox="'0 0 ' + WIDTH + ' ' + height"
  role="img"
  :aria-labelledby="titleId"
  :aria-describedby="descId"
>
  <desc :id="descId">{{ summary }}</desc>
  <g v-for="(item, index) in items" :key="item.id" class="bar" :transform="'translate(0, ' + index * ROW + ')'">
    <text class="bar-label" x="0" :y="BAR_H / 2" dy="0.35em">{{ item.label }}</text>
    <rect class="bar-rect" :x="LABEL_W" y="0" :width="barWidth(item.value)" :height="BAR_H" rx="4" :fill="item.color" />
    <text class="bar-value" :x="LABEL_W + barWidth(item.value) + 6" :y="BAR_H / 2" dy="0.35em">
      {{ formatValue(item.value) }}
    </text>
  </g>
</svg>
<p v-else class="chart-empty">No spending to show for this filter.</p>`,
          lang: 'vue',
          title: 'components/BarChart.vue — template',
        },
        `
\`Math.max(1, …)\` guards against dividing by zero. \`dy="0.35em"\` nudges text down so it is vertically centred on the bar.

**Accessibility:** \`role="img"\` makes the whole SVG one image for assistive technology, which also hides its inner \`<text>\` elements. So the same information must be available as words: \`aria-labelledby\` points at the visible title, and a \`<desc>\` holds a one-sentence summary ("Food $82.70, Bills $78.15, …"). The values are also printed next to each bar, so nobody has to judge bar lengths by eye — and colour is never the only way to tell categories apart.
`,
      ],
    },
    {
      title: 'Polish and review',
      body: `
Run the tests until they are all green, then review:

- **Is anything stored that could be derived?** Only \`expenses\`, the two filters and the announcement are state. Totals, counts, the top category, month options and chart items are all computed.
- **Is money ever a float in state?** It shouldn't be — only \`formatCents\` divides by 100, at the last moment.
- **Do the reusable components know about expenses?** \`BarChart\`, \`StatCard\` and \`FormField\` shouldn't. That is what makes them reusable (one test mounts \`BarChart\` with step counts to prove it).
- **Empty states:** every view has something sensible to say when the filters match nothing.

Then try a challenge — persisting expenses with what you learned in Project 2 is a good one.
`,
    },
  ],

  solution: {
    entry: 'App.vue',
    files: {
      'App.vue': appVue,
      'components/ExpenseForm.vue': formVue,
      'components/ExpenseTable.vue': tableVue,
      'components/BarChart.vue': chartVue,
      'components/FormField.vue': formFieldVue,
      'components/StatCard.vue': statCardVue,
      'money.js': moneyJs,
      'expenses.js': expensesJs,
      'base.css': baseCss,
    },
    explanation: `
**State is tiny.** \`App\` stores the expenses array and two filters. Everything you see — rows, totals, the top category, month options, chart bars — is a \`computed\` chain starting from \`filtered\`, so adding, deleting or filtering updates every view at once and they can never disagree.

**Rules live in plain modules.** \`money.js\` parses and formats money without floating-point maths; \`expenses.js\` validates drafts, groups totals and formats dates in UTC. They are unit-tested directly (\`requireModule\`) and could run on a server unchanged.

**The form owns its draft.** What the user is typing is local to \`ExpenseForm\`. It validates with the same pure function, shows errors only after a submit attempt, and emits a finished expense — amount already in cents.

**Three kinds of reusable component.** \`StatCard\` is configured by props and styled from outside via fallthrough \`class\`. \`FormField\` uses a scoped slot plus \`useId()\` to wire labels and errors to any control. \`BarChart\` is fully generic: data in a neutral \`{ id, label, value, color }\` shape and a \`formatValue\` function prop, so the same chart can show cents, steps or minutes.

**Simplified on purpose:** one currency, one locale (en-US), data kept in memory. A production version would load and save through an API, store the currency with every amount, and format for the user's locale.
`,
  },

  challenges: [
    'Persist expenses with a `storage.js` module and a deep watcher, reusing what you built in Project 2.',
    'Add a monthly **budget** per category and show progress bars (the interview coding question builds the bar).',
    'Add a vertical "spending per day" chart for the selected month, with an x-axis of day numbers.',
    'Let users edit an expense: clicking a row fills the form, and the form emits `update` instead of `add`.',
    'Format money for the user\'s locale with `new Intl.NumberFormat(navigator.language, …)` — and think about what must *not* change (the currency of each amount).',
    'Export the filtered list as CSV (build the text, create a `Blob`, and download it with a temporary `<a download>`).',
  ],

  mistakes: [
    {
      title: 'Storing money as decimal numbers',
      wrong: { lang: 'js', code: `expenses.value.push({ amount: 0.1 })\nexpenses.value.push({ amount: 0.2 })\n// total: 0.30000000000000004` },
      right: { lang: 'js', code: `expenses.value.push({ amountCents: 10 })\nexpenses.value.push({ amountCents: 20 })\n// total: 30 → formatCents(30) → "$0.30"` },
      explanation: 'Binary floating point cannot represent most decimal fractions exactly, so sums drift. Store integer cents and only divide when formatting.',
    },
    {
      title: 'Sorting state inside a computed',
      wrong: { lang: 'js', code: `const newestFirst = computed(() =>\n  expenses.value.sort((a, b) => b.date.localeCompare(a.date)),\n)` },
      right: { lang: 'js', code: `const newestFirst = computed(() =>\n  [...expenses.value].sort((a, b) => b.date.localeCompare(a.date)),\n)` },
      explanation: '`.sort()` sorts in place, so this computed silently reorders the original array — a side effect inside a getter, which can also trigger extra updates. Copy first (spread, `.slice()`, or `toSorted()` where supported), or sort the new array that `.filter()` returns.',
    },
    {
      title: 'Keeping a running total in a ref',
      wrong: { lang: 'js', code: `const total = ref(0)\nfunction addExpense(e) {\n  expenses.value.push(e)\n  total.value += e.amountCents\n}\n// removeExpense and the filters forget to update it…` },
      right: { lang: 'js', code: `const total = computed(() => totalCents(filtered.value))` },
      explanation: 'Every code path that changes the list must remember to update a stored total, and filters make it worse. A computed total is always correct by construction.',
    },
    {
      title: 'Parsing ISO dates with `new Date()` and formatting locally',
      wrong: { lang: 'js', code: `new Date('2026-10-01').toLocaleDateString('en-US')\n// "9/30/2026" for users west of UTC` },
      right: { lang: 'js', code: `const [y, m, d] = '2026-10-01'.split('-').map(Number)\nnew Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)))` },
      explanation: 'Date-only ISO strings are parsed as UTC midnight, then shown in the local time zone — which can be the previous day. Treat calendar dates as UTC end to end (or keep them as strings).',
    },
    {
      title: 'Showing every validation error before the user has typed',
      wrong: { lang: 'vue', code: `<p v-if="errors.amount" class="field-error">{{ errors.amount }}</p>` },
      right: { lang: 'js', code: `const visibleErrors = computed(() => (submitted.value ? errors.value : {}))` },
      explanation: 'A form that starts covered in red feels hostile. Compute errors all the time, but reveal them after a submit attempt (or after a field is touched), then keep them live as the user fixes them.',
    },
  ],

  debugging: [
    {
      symptom: 'The total shows something like $0.30000000000000004 or is off by a cent.',
      cause: 'Amounts are stored or summed as decimals.',
      fix: 'Convert to integer cents at the input boundary (`parseAmountToCents`) and divide by 100 only in `formatCents`.',
    },
    {
      symptom: 'The table order changes unexpectedly after typing in an unrelated field.',
      cause: 'A computed calls `.sort()` on the state array, mutating it.',
      fix: 'Sort a copy: `[...list].sort(...)`, or sort the new array returned by `.filter()`.',
    },
    {
      symptom: 'Labels are not announced for inputs, or clicking a label does not focus its input.',
      cause: 'The label\'s `for` and the input\'s `id` do not match (often duplicated ids when a component is used twice).',
      fix: 'Generate ids per instance with `useId()` (Vue 3.5+) and pass them to the control through a scoped slot.',
    },
    {
      symptom: 'The chart is blank or bars are `NaN` wide.',
      cause: 'Dividing by a maximum of 0 when no data matches, or values passed as strings.',
      fix: 'Use `Math.max(1, ...values)` for the scale and pass numbers. Render an empty state when there are no items.',
    },
  ],

  quiz: [
    {
      id: 'project-expense-tracker-q1',
      type: 'mcq',
      prompt: 'Why does the app store `amountCents: 6420` instead of `amount: 64.2`?',
      options: [
        { text: 'Integers use less memory than decimals in JavaScript', why: 'Both are the same `number` type (64-bit floats) in JavaScript; memory is not the reason.' },
        { text: 'Whole numbers add up exactly, while binary floating point cannot represent most decimal fractions' },
        { text: '`Intl.NumberFormat` only accepts integers', why: 'It formats decimals happily — we divide by 100 right before formatting.' },
        { text: 'Vue cannot make decimal numbers reactive', why: 'Reactivity does not care about the type of number.' },
      ],
      answer: 1,
      explanation: '`0.1 + 0.2` is `0.30000000000000004` in JavaScript. Integer cents (safe up to `Number.MAX_SAFE_INTEGER`) avoid that drift entirely.',
    },
    {
      id: 'project-expense-tracker-q2',
      type: 'output',
      prompt: 'A user in New York (UTC−4 in October) loads this page. What does it print?',
      code: { lang: 'js', code: `const d = new Date('2026-10-01')\nconsole.log(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))` },
      options: ['Oct 1', 'Sep 30', 'Invalid Date', 'Oct 2'],
      answer: 1,
      explanation: 'A date-only ISO string is parsed as midnight UTC. In New York that moment is 8 pm on September 30, so the local format shows "Sep 30". Format with `timeZone: "UTC"` (or keep calendar dates as strings).',
    },
    {
      id: 'project-expense-tracker-q3',
      type: 'bug',
      prompt: 'After this computed first runs, the original `expenses` array is in a different order. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `const expenses = ref(SAMPLE_EXPENSES.map((e) => ({ ...e })))
const onlyFood = ref(false)

const visible = computed(() => {
  const list = onlyFood.value
    ? expenses.value.filter((e) => e.category === 'food')
    : expenses.value
  return list.sort((a, b) => b.date.localeCompare(a.date))
})`,
      },
      answerLine: 8,
      explanation: 'When `onlyFood` is false, `list` *is* the state array, and `.sort()` sorts in place — mutating state inside a computed. Copy first: `[...list].sort(...)`.',
    },
    {
      id: 'project-expense-tracker-q4',
      type: 'fill',
      prompt: 'Complete the bar width so the biggest value fills `BAR_MAX` and an empty chart never divides by zero.',
      code: { lang: 'js', code: `const maxValue = computed(() => Math.___(1, ...props.items.map((item) => item.value)))\n\nfunction barWidth(value) {\n  return (value / maxValue.value) * ___\n}` },
      answer: [['max'], ['BAR_MAX']],
      explanation: '`Math.max(1, …values)` is the scale (never below 1). Each bar is its share of the maximum, times the available width.',
    },
    {
      id: 'project-expense-tracker-q5',
      type: 'short',
      prompt: 'The SVG chart has `role="img"`, an `aria-labelledby` title and a `<desc>` summary. Why is the summary needed?',
      answer: '`role="img"` makes assistive technology treat the SVG as a single image and ignore the text elements inside it. Without a text alternative, screen-reader users would only hear the title, not the values. The `<desc>` (linked with aria-describedby) gives the same data as a sentence. Printing values next to bars also helps everyone who cannot judge lengths or colours.',
    },
  ],

  interview: [
    {
      id: 'project-expense-tracker-integer-cents',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How did you handle money in the expense tracker, and why?',
      answer: 'Amounts are stored as integer cents. The text the user types is parsed straight into cents without floating-point maths, all sums are integer additions, and only the formatter divides by 100 with `Intl.NumberFormat`. Binary floating point cannot represent most decimal fractions exactly, so decimal sums drift (`0.1 + 0.2`).',
      explanation: 'Convert at the boundaries: text → cents on input, cents → text on display.',
      whyAsked: 'Money bugs are expensive and common; interviewers want to see you know the trap and a standard fix.',
      mistakes: ['Suggesting `toFixed(2)` on every sum (it rounds the display, not the drift in state).', 'Parsing with `parseFloat(text) * 100` without rounding.'],
      followUps: ['What about currencies without cents, like JPY?', 'Where would currency conversion happen?'],
      modelAnswer: 'I store every amount as integer cents. The input is a text field; I validate it with a regex and build cents from the whole and fractional parts, so no float maths ever touches the value. Totals are integer sums, and the only division by 100 happens in the formatter using Intl.NumberFormat. That avoids the classic 0.1 plus 0.2 drift. In a multi-currency app I would store the currency with each amount and use the currency\'s minor-unit count rather than assuming two decimals.',
    },
    {
      id: 'project-expense-tracker-date-shift',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Users in California report that an expense dated October 1 shows as "Sep 30" and lands in the September filter. Users in Europe see it correctly. What is going on?',
      code: { lang: 'js', code: `const label = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })\nconst month = new Date(expense.date).getMonth() + 1` },
      answer: '`new Date("2026-10-01")` parses a date-only ISO string as midnight UTC. `toLocaleDateString` and `getMonth()` use the local time zone; west of UTC that instant is still September 30. Treat calendar dates as plain strings (month = `date.slice(0, 7)`) or as UTC (`Date.UTC` + `timeZone: "UTC"`) consistently.',
      explanation: 'A calendar date is not a moment in time. Mixing UTC parsing with local formatting shifts it.',
      whyAsked: 'Time-zone bugs are frequent in real apps and reveal whether you understand how JS dates work.',
      mistakes: ['Adding or subtracting hours as a "fix".', 'Blaming the server.'],
      followUps: ['How would you store a timestamp (with time) instead?', 'How would you test this regardless of the machine\'s time zone?'],
      modelAnswer: 'Date-only ISO strings are parsed as UTC midnight, but getMonth and toLocaleDateString work in local time, so anywhere west of UTC the date moves back a day. For calendar dates I keep the YYYY-MM-DD string as the source of truth, derive the month with slice, and when I need a Date for formatting I build it with Date.UTC and format with timeZone UTC. Real timestamps are different: store them in UTC and format in the user\'s zone. I would test by formatting with an explicit timeZone, so results do not depend on the machine.',
    },
    {
      id: 'project-expense-tracker-multi-currency',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'A user travels and logs expenses in EUR and USD. Product wants one "total spent". How do you approach it?',
      answer: 'Never add amounts in different currencies directly. Store `currency` with each expense (amounts in that currency\'s minor units). Either show one total per currency, or convert to a home currency using an exchange rate for each expense\'s date from a trusted server source, and label the converted total as an estimate. Keep the original amounts unchanged.',
      explanation: 'Currency is part of the value, not a display detail.',
      whyAsked: 'Tests data-modelling judgement and whether you ask the right product questions.',
      mistakes: ['Converting with today\'s rate for old expenses without saying so.', 'Hard-coding exchange rates in the client.', 'Assuming every currency has 2 decimals.'],
      followUps: ['Which rate do you use for an expense from three months ago?', 'Where should conversion run — client or server?'],
      modelAnswer: 'First I would change the model: every expense stores its currency and an integer amount in that currency\'s minor units, because adding euros to dollars is meaningless. The simplest honest UI shows a total per currency. If product needs one number, I would convert into the user\'s home currency using a dated exchange rate fetched from the server, ideally the rate on the expense date, and label it as converted. Original amounts stay untouched, so we can recompute when rates are corrected.',
    },
    {
      id: 'project-expense-tracker-reusable-design',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'Walk me through how you made `FormField` and `BarChart` reusable. What would you avoid?',
      answer: '`FormField` owns the label, error message and ids (via `useId()`), and exposes `id`, `invalid` and `describedby` through a scoped slot, so any control can be placed inside and wired correctly. `BarChart` accepts neutral data (`{ id, label, value, color }`) plus a `formatValue` function, so it knows nothing about expenses. Avoid baking domain knowledge (categories, cents) into generic components and avoid giant prop lists that try to cover every case.',
      explanation: 'Reusable = decoupled from the domain, with a small, well-named API.',
      whyAsked: 'Component API design is a core senior skill: it determines how a codebase scales.',
      mistakes: ['Making the chart fetch or compute its own data.', 'Passing the whole expenses array into the chart.', 'Duplicated ids when a field is used twice.'],
      followUps: ['When would you use a render function or a library instead?', 'How would you add a vertical orientation without a boolean explosion?'],
      modelAnswer: 'I kept generic components ignorant of the domain. FormField handles the label, the error and the ids, and gives the control what it needs through a scoped slot, so inputs, selects or textareas all get correct for/id and aria wiring; useId makes ids unique per instance. BarChart takes a neutral array of label, value and colour plus a format function, and App maps expenses into that shape. I would avoid passing domain objects into generic components and avoid boolean props for every variation; if a second orientation came along I would consider a separate component or an orientation prop with a clear default.',
    },
    {
      id: 'project-expense-tracker-scale',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A power user imports several years of bank data — tens of thousands of expenses. Changing a filter now feels sluggish. How would you investigate and fix it?',
      answer: 'Measure first (Vue Devtools performance, the browser profiler) to find whether time goes into filtering/aggregation or rendering rows. Likely fixes: virtualize or paginate the table so only visible rows render; precompute indexes (e.g. expenses grouped by month) so filters do not scan everything; hold the big array in a `shallowRef` and replace it immutably if deep reactivity is the cost; move heavy aggregation to the server or a Web Worker; debounce text search.',
      explanation: 'Computed values already cache, but each recomputation still scans the whole list, and rendering thousands of rows is expensive.',
      whyAsked: 'Distinguishes "add a library" answers from a measured, layered approach.',
      mistakes: ['Guessing without profiling.', 'Quoting made-up thresholds.', 'Dropping computed for manual caching everywhere.'],
      followUps: ['What does shallowRef change for this list?', 'When does server-side aggregation become the right call?'],
      modelAnswer: 'I would profile before changing anything, separating the cost of recomputing filters and totals from the cost of rendering rows. Rendering tens of thousands of rows is usually the first problem, so I would paginate or virtualize the table. For the maths I would build indexes — say, a map from month to expenses — so a month filter does not scan years of data, and aggregate once per filter change. If deep reactivity on the big array shows up in the profile, a shallowRef with immutable replacement helps. Beyond that, I would ask the server for pre-aggregated totals instead of shipping every row to the browser.',
    },
    {
      id: 'project-expense-tracker-coding-budget',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Finish `BudgetBar.vue`. Props `spent` and `budget` are integer cents. Show `.budget-text` as **"$42.50 of $100.00"**, size `.budget-fill` with a `width` from 0 to 100 (percentage spent, capped at 100), show `.budget-left` as **"$57.50 left"** or **"$12.00 over"**, and add the class `is-over` to `.budget` when spent exceeds the budget. Use `formatCents` from `money.js`.',
      starter: { files: { 'App.vue': budgetApp, 'BudgetBar.vue': budgetStarter, 'money.js': moneyJs } },
      tests: [
        {
          name: 'shows spent of budget and what is left',
          code: `const bar = mountFile('BudgetBar.vue', { spent: 4250, budget: 10000 })
expect(bar.find('.budget-text').textContent.trim()).toBe('$42.50 of $100.00')
expect(bar.find('.budget-left').textContent.trim()).toBe('$57.50 left')
expect(Number(bar.find('.budget-fill').getAttribute('width'))).toBe(42.5)`,
        },
        {
          name: 'caps the bar and flags overspending',
          code: `const bar = mountFile('BudgetBar.vue', { spent: 11200, budget: 10000 })
expect(bar.find('.budget-left').textContent.trim()).toBe('$12.00 over')
expect(Number(bar.find('.budget-fill').getAttribute('width'))).toBe(100)
expect(bar.find('.budget').classList.contains('is-over')).toBe(true)`,
        },
        {
          name: 'reacts to prop changes',
          code: `const bar = mountFile('BudgetBar.vue', { spent: 0, budget: 5000 })
expect(bar.find('.budget').classList.contains('is-over')).toBe(false)
await bar.setProps({ spent: 6000 })
expect(bar.find('.budget').classList.contains('is-over')).toBe(true)
expect(bar.find('.budget-left').textContent.trim()).toBe('$10.00 over')`,
        },
      ],
      hints: [
        'Everything here is derived from the two props — reach for `computed()`.',
        'You need `isOver`, a capped `percent` (`Math.min(100, spent / budget * 100)`) and a `leftLabel`.',
        'Bind `:width="percent"` on the rect and `:class="{ \'is-over\': isOver }"` on the root; guard against a budget of 0.',
      ],
      answer: 'Derive `isOver`, a capped `percent` and a `leftLabel` with computed values from the props, format with `formatCents`, and bind them to the text, the rect width and the root class.',
      solution: { files: { 'App.vue': budgetApp, 'BudgetBar.vue': budgetSolution, 'money.js': moneyJs } },
      explanation: 'A pure display component: no state of its own, only values computed from props. The cap keeps the SVG rect inside its track; the 0-budget guard avoids dividing by zero.',
      whyAsked: 'Checks computed-from-props thinking, SVG attribute binding and edge cases (overspend, zero budget).',
      mistakes: ['Copying props into refs (they stop updating when props change).', 'Letting the width exceed 100.', 'Subtracting in the wrong order for the "over" label.'],
      followUps: ['How would you make this accessible as a meter?', 'How would you animate the width change?'],
      modelAnswer: 'BudgetBar has no state, so everything is a computed from the props: isOver compares spent to budget, percent is spent over budget times 100 capped at 100 with a guard for a zero budget, and leftLabel formats either the remaining amount or the overspend. The template binds the text, the rect width and an is-over class. For accessibility I would expose it as role="meter" with aria-valuenow, aria-valuemin and aria-valuemax, or simply rely on the visible text.',
    },
  ],

  takeaways: [
    'Store money as integer cents; convert text → cents on input and cents → text only when formatting.',
    'Keep calendar dates as ISO strings and format them in UTC so they never shift a day.',
    'One small piece of state (the expenses + filters) can feed many views through a chain of computed values.',
    'Reusable components stay domain-free: props and fallthrough attrs (`StatCard`), scoped slots + `useId()` (`FormField`), neutral data + function props (`BarChart`).',
    'An SVG chart is just data mapped to coordinates — give it a text alternative, because `role="img"` hides its inner text.',
  ],
}
