// Project 2: Task Manager — components, props, events, list rendering, local persistence.

const baseCss = `/* Shared look for the task manager (global, imported once by App.vue) */
.task-app {
  --ink: #1d1d1f;
  --muted: #5f5f6b;
  --line: #e0e0e7;
  --accent: #3b5bdb;
  --danger: #c92a2a;
  max-width: 480px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
  color: var(--ink);
}
.task-app button { font: inherit; cursor: pointer; }
.task-app :focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
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

const appStyles = `<style scoped>
.top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
.top h1 { margin: 0; font-size: 1.6rem; }
.remaining { margin: 0; color: var(--muted); }
.task-list { list-style: none; margin: 12px 0 0; padding: 0; border: 1px solid var(--line); border-radius: 12px; }
.empty { margin: 12px 0 0; padding: 24px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 12px; }
.footer { display: flex; justify-content: flex-end; margin-top: 10px; }
.clear-done { border: 0; background: none; color: var(--danger); text-decoration: underline; }
</style>`

// ---------------------------------------------------------------- starter

const starterApp = `<script setup>
import { ref } from 'vue'
import TaskForm from './TaskForm.vue'
import TaskItem from './TaskItem.vue'
import TaskFilters from './TaskFilters.vue'
import './base.css'
// TODO (step 6): import { loadTasks, saveTasks } from './storage.js'

const SAMPLE_TASKS = [
  { id: 1, title: 'Buy oat milk', done: false },
  { id: 2, title: 'Finish the history essay', done: true },
  { id: 3, title: 'Call grandma', done: false },
]

// App owns the list. Children get it through props and ask for changes with events.
const tasks = ref(SAMPLE_TASKS.map((task) => ({ ...task })))

// TODO (step 3): toggleTask(id) and removeTask(id)
// TODO (step 4): addTask(title)
// TODO (step 5): filter, counts, visibleTasks, remainingLabel
// TODO (step 6): load on start, save on every change
</script>

<template>
  <main class="task-app">
    <header class="top">
      <h1>Today</h1>
      <p class="remaining" aria-live="polite">2 tasks left</p>
    </header>

    <TaskForm />
    <TaskFilters current="all" :counts="{ all: 3, active: 2, done: 1 }" />

    <ul class="task-list">
      <TaskItem v-for="task in tasks" :key="task.id" :task="task" />
    </ul>
  </main>
</template>

${appStyles}`

const starterItem = `<script setup>
defineProps({
  task: { type: Object, required: true },
})
// TODO (step 2): declare the events this component can send: 'toggle' and 'remove'
</script>

<template>
  <li class="task" :class="{ 'is-done': task.done }">
    <label class="task-label">
      <!-- TODO (step 2): emit 'toggle' with the task id on change -->
      <input type="checkbox" class="task-toggle" :checked="task.done" />
      <span class="task-title">{{ task.title }}</span>
    </label>
    <!-- TODO (step 2): emit 'remove' with the task id on click -->
    <button type="button" class="task-delete" :aria-label="'Delete task: ' + task.title">
      <span aria-hidden="true">✕</span>
    </button>
  </li>
</template>

<style scoped>
.task { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--line); }
.task:last-child { border-bottom: 0; }
.task-label { flex: 1; display: flex; align-items: center; gap: 10px; cursor: pointer; }
.task-toggle { width: 18px; height: 18px; accent-color: var(--accent); }
.is-done .task-title { color: var(--muted); text-decoration: line-through; }
.task-delete { border: 0; background: none; color: var(--muted); border-radius: 6px; padding: 4px 8px; }
.task-delete:hover { color: var(--danger); background: #fff0f0; }
</style>`

const starterForm = `<script setup>
import { ref } from 'vue'

const title = ref('')

function submit() {
  // TODO (step 4): trim the title, reject blanks with a message,
  // emit 'add' with the clean title, then clear the input
}
</script>

<template>
  <form class="task-form" novalidate @submit.prevent="submit">
    <label for="new-task" class="visually-hidden">New task</label>
    <input
      id="new-task"
      v-model="title"
      class="new-task-input"
      type="text"
      placeholder="What needs doing?"
      maxlength="80"
      autocomplete="off"
    />
    <button type="submit" class="add-btn">Add</button>
  </form>
</template>

<style scoped>
.task-form { display: flex; flex-wrap: wrap; gap: 8px; }
.new-task-input { flex: 1; font: inherit; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; }
.add-btn { padding: 10px 16px; border: 0; border-radius: 10px; background: var(--ink); color: #fff; }
.form-error { flex-basis: 100%; margin: 0; color: var(--danger); font-size: 0.9rem; }
</style>`

const starterFilters = `<script setup>
defineProps({
  current: { type: String, required: true },
  counts: { type: Object, required: true },
})
// TODO (step 5): emit 'change' with the filter id when a button is clicked

const filters = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
]
</script>

<template>
  <div class="filters" role="group" aria-label="Show tasks">
    <button
      v-for="f in filters"
      :key="f.id"
      type="button"
      :class="['filter', 'filter-' + f.id, { 'is-active': current === f.id }]"
      :aria-pressed="current === f.id"
    >
      {{ f.label }} <span class="filter-count">{{ counts[f.id] }}</span>
    </button>
  </div>
</template>

<style scoped>
.filters { display: flex; gap: 6px; margin-top: 14px; }
.filter { padding: 6px 12px; border: 1px solid var(--line); border-radius: 99px; background: #fff; }
.filter.is-active { background: var(--ink); border-color: var(--ink); color: #fff; }
.filter-count { opacity: 0.7; font-variant-numeric: tabular-nums; }
</style>`

const starterStorage = `// Everything about saving and loading lives here, so components never
// touch localStorage directly.

export const STORAGE_KEY = 'vue-zero.tasks.v1'

// Returns the saved array of tasks, or null when there is nothing usable.
export function loadTasks() {
  // TODO (step 6)
  return null
}

export function saveTasks(tasks) {
  // TODO (step 6)
}
`

// ---------------------------------------------------------------- solution

const solutionApp = `<script setup>
import { ref, computed, watch } from 'vue'
import TaskForm from './TaskForm.vue'
import TaskItem from './TaskItem.vue'
import TaskFilters from './TaskFilters.vue'
import { loadTasks, saveTasks } from './storage.js'
import './base.css'

const SAMPLE_TASKS = [
  { id: 1, title: 'Buy oat milk', done: false },
  { id: 2, title: 'Finish the history essay', done: true },
  { id: 3, title: 'Call grandma', done: false },
]

// ---- State (App owns it; children receive it through props)
// Copy the samples so we never mutate the shared module-level array.
const tasks = ref(loadTasks() ?? SAMPLE_TASKS.map((task) => ({ ...task })))
const filter = ref('all')

// ---- Persistence: save after every change, including nested ones like task.done
watch(tasks, (value) => saveTasks(value), { deep: true })

// ---- Derived state
const counts = computed(() => {
  const done = tasks.value.filter((task) => task.done).length
  return { all: tasks.value.length, active: tasks.value.length - done, done }
})

const visibleTasks = computed(() => {
  if (filter.value === 'active') return tasks.value.filter((task) => !task.done)
  if (filter.value === 'done') return tasks.value.filter((task) => task.done)
  return tasks.value
})

const remainingLabel = computed(() =>
  counts.value.active === 1 ? '1 task left' : counts.value.active + ' tasks left',
)

const emptyMessage = computed(() => {
  if (filter.value === 'active') return 'Nothing left to do. Enjoy your day!'
  if (filter.value === 'done') return 'Nothing completed yet.'
  return 'No tasks yet. Add your first one above.'
})

// ---- Event handlers: the only code that changes the list
function nextId() {
  return tasks.value.reduce((max, task) => Math.max(max, task.id), 0) + 1
}

function addTask(title) {
  tasks.value.push({ id: nextId(), title, done: false })
}

function toggleTask(id) {
  const task = tasks.value.find((t) => t.id === id)
  if (task) task.done = !task.done
}

function removeTask(id) {
  tasks.value = tasks.value.filter((task) => task.id !== id)
}

function clearCompleted() {
  tasks.value = tasks.value.filter((task) => !task.done)
}
</script>

<template>
  <main class="task-app">
    <header class="top">
      <h1>Today</h1>
      <p class="remaining" aria-live="polite">{{ remainingLabel }}</p>
    </header>

    <TaskForm @add="addTask" />
    <TaskFilters :current="filter" :counts="counts" @change="filter = $event" />

    <ul v-if="visibleTasks.length" class="task-list">
      <TaskItem
        v-for="task in visibleTasks"
        :key="task.id"
        :task="task"
        @toggle="toggleTask"
        @remove="removeTask"
      />
    </ul>
    <p v-else class="empty">{{ emptyMessage }}</p>

    <footer v-if="counts.done > 0" class="footer">
      <button type="button" class="clear-done" @click="clearCompleted">
        Clear {{ counts.done }} completed
      </button>
    </footer>
  </main>
</template>

${appStyles}`

const solutionItem = `<script setup>
defineProps({
  task: { type: Object, required: true },
})

// The child never changes the task itself. It reports what happened,
// and the owner of the data (App) decides what to do.
const emit = defineEmits(['toggle', 'remove'])
</script>

<template>
  <li class="task" :class="{ 'is-done': task.done }">
    <label class="task-label">
      <input
        type="checkbox"
        class="task-toggle"
        :checked="task.done"
        @change="emit('toggle', task.id)"
      />
      <span class="task-title">{{ task.title }}</span>
    </label>
    <button
      type="button"
      class="task-delete"
      :aria-label="'Delete task: ' + task.title"
      @click="emit('remove', task.id)"
    >
      <span aria-hidden="true">✕</span>
    </button>
  </li>
</template>

<style scoped>
.task { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--line); }
.task:last-child { border-bottom: 0; }
.task-label { flex: 1; display: flex; align-items: center; gap: 10px; cursor: pointer; }
.task-toggle { width: 18px; height: 18px; accent-color: var(--accent); }
.is-done .task-title { color: var(--muted); text-decoration: line-through; }
.task-delete { border: 0; background: none; color: var(--muted); border-radius: 6px; padding: 4px 8px; }
.task-delete:hover { color: var(--danger); background: #fff0f0; }
</style>`

const solutionForm = `<script setup>
import { ref } from 'vue'

const emit = defineEmits(['add'])

const title = ref('')
const error = ref('')

function submit() {
  const clean = title.value.trim()
  if (!clean) {
    error.value = 'Give the task a name first.'
    return
  }
  emit('add', clean)
  title.value = ''
  error.value = ''
}
</script>

<template>
  <form class="task-form" novalidate @submit.prevent="submit">
    <label for="new-task" class="visually-hidden">New task</label>
    <input
      id="new-task"
      v-model="title"
      class="new-task-input"
      type="text"
      placeholder="What needs doing?"
      maxlength="80"
      autocomplete="off"
      :aria-invalid="error ? 'true' : 'false'"
      aria-describedby="new-task-error"
      @input="error = ''"
    />
    <button type="submit" class="add-btn">Add</button>
    <p v-if="error" id="new-task-error" class="form-error" role="alert">{{ error }}</p>
  </form>
</template>

<style scoped>
.task-form { display: flex; flex-wrap: wrap; gap: 8px; }
.new-task-input { flex: 1; font: inherit; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; }
.add-btn { padding: 10px 16px; border: 0; border-radius: 10px; background: var(--ink); color: #fff; }
.form-error { flex-basis: 100%; margin: 0; color: var(--danger); font-size: 0.9rem; }
</style>`

const solutionFilters = `<script setup>
defineProps({
  current: { type: String, required: true },
  counts: { type: Object, required: true },
})

const emit = defineEmits(['change'])

const filters = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
]
</script>

<template>
  <div class="filters" role="group" aria-label="Show tasks">
    <button
      v-for="f in filters"
      :key="f.id"
      type="button"
      :class="['filter', 'filter-' + f.id, { 'is-active': current === f.id }]"
      :aria-pressed="current === f.id"
      @click="emit('change', f.id)"
    >
      {{ f.label }} <span class="filter-count">{{ counts[f.id] }}</span>
    </button>
  </div>
</template>

<style scoped>
.filters { display: flex; gap: 6px; margin-top: 14px; }
.filter { padding: 6px 12px; border: 1px solid var(--line); border-radius: 99px; background: #fff; }
.filter.is-active { background: var(--ink); border-color: var(--ink); color: #fff; }
.filter-count { opacity: 0.7; font-variant-numeric: tabular-nums; }
</style>`

const solutionStorage = `// Everything about saving and loading lives here, so components never
// touch localStorage directly. (In this sandbox localStorage is in-memory
// and resets on every run; in a real browser it persists per site.)

// The ".v1" suffix lets a future version change the data shape safely.
export const STORAGE_KEY = 'vue-zero.tasks.v1'

function isTask(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    typeof value.done === 'boolean'
  )
}

// Returns the saved array of tasks, or null when there is nothing usable.
export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isTask) : null
  } catch (error) {
    // Corrupted JSON, or storage blocked (some privacy modes): start fresh.
    console.warn('Could not read saved tasks:', error.message)
    return null
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (error) {
    // Quota exceeded or storage blocked: the app keeps working in memory.
    console.warn('Could not save tasks:', error.message)
  }
}
`

// ---------------------------------------------------------------- interview coding question

const renameStarter = `<script setup>
defineProps({
  task: { type: Object, required: true },
})
const emit = defineEmits(['rename'])
</script>

<template>
  <li class="task">
    <span class="task-title">{{ task.title }}</span>
  </li>
</template>`

const renameSolution = `<script setup>
import { ref } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
})
const emit = defineEmits(['rename'])

// Local UI state: only this item cares whether it is being edited.
const editing = ref(false)
const draft = ref('')

function startEdit() {
  draft.value = props.task.title
  editing.value = true
}

function save() {
  const clean = draft.value.trim()
  if (clean && clean !== props.task.title) emit('rename', props.task.id, clean)
  editing.value = false
}

function cancel() {
  editing.value = false
}
</script>

<template>
  <li class="task">
    <input
      v-if="editing"
      v-model="draft"
      class="task-edit"
      aria-label="Task title"
      @keyup.enter="save"
      @keyup.esc="cancel"
    />
    <span v-else class="task-title" @dblclick="startEdit">{{ task.title }}</span>
  </li>
</template>`

const renameApp = `<script setup>
import TaskItem from './TaskItem.vue'
</script>

<template>
  <ul>
    <TaskItem :task="{ id: 1, title: 'Buy oat milk', done: false }" />
  </ul>
</template>`

export default {
  id: 'project-task-manager',
  kind: 'project',
  title: 'Project 2: Task Manager',
  summary: 'Build a multi-component to-do app where data flows down as props, changes flow up as events, and the list survives a page reload.',
  difficulty: 'beginner',
  minutes: 90,
  prerequisites: ['first-component', 'props', 'emits', 'list-rendering', 'watch'],
  related: ['project-counter', 'v-model-forms', 'component-communication', 'composable-recipes', 'project-expense-tracker'],
  tags: ['project', 'todo', 'components', 'props', 'emits', 'v-for', 'keys', 'localStorage', 'persistence', 'watch'],
  apis: [
    { name: 'defineProps()', summary: 'Declares the data a component receives from its parent (here: one task).' },
    { name: 'defineEmits()', summary: 'Declares the events a component can send to its parent (toggle, remove, add, change).' },
    { name: 'v-for + :key', summary: 'Renders one TaskItem per task, keyed by the stable task id.' },
    { name: 'watch(source, cb, { deep: true })', summary: 'Saves the task list to localStorage after every change, including nested ones.' },
  ],
  docs: [
    { label: 'Vue Guide — Components Basics', url: 'https://vuejs.org/guide/essentials/component-basics.html' },
    { label: 'Vue Guide — Props (one-way data flow)', url: 'https://vuejs.org/guide/components/props.html#one-way-data-flow' },
    { label: 'Vue Guide — Component Events', url: 'https://vuejs.org/guide/components/events.html' },
    { label: 'Vue Guide — List Rendering (key)', url: 'https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key' },
    { label: 'Vue Guide — Watchers (deep)', url: 'https://vuejs.org/guide/essentials/watchers.html#deep-watchers' },
  ],

  intro: `
A to-do list is the "hello world" of real apps for a reason: it is the smallest thing that needs **several components**, a **list**, **user input** and **saved data** all at once.

You will build *Today*, a task manager with:

- a form to add tasks (with validation),
- a list where each task can be ticked off or deleted,
- **All / Active / Done** filters with live counts,
- "Clear completed",
- and tasks that are still there after a reload.

The app is split into four components plus a storage module. The interesting part is not any single file — it is **how they talk to each other**.
`,

  why: `
In Project 1 everything lived in one file. That stops scaling quickly: a 600-line component is hard to read, hard to test and impossible to reuse.

Splitting the UI into *components* (self-contained pieces with their own template, logic and styles) fixes that — but raises new questions:

- Who **owns** the list of tasks?
- How does a checkbox deep inside a list item change data that lives in the parent?
- How do we save the data without sprinkling \`localStorage\` calls everywhere?

Vue's answer is a simple, strict rule: **props down, events up**. Data flows from the owner to its children as *props*; children report what happened with *events*; only the owner changes the data. Learn that here, with four small components, and it will carry you through apps with four hundred.
`,

  eli15: `
Picture a family whiteboard on the fridge with the day's chores. **Mum owns the whiteboard** — she is the only one who writes on it.

Each kid gets a **photo** of their chore (that's a *prop*: read-only information handed down). When a kid finishes, they don't scribble on the photo — they shout "I finished the dishes!" (that's an *event*). Mum hears it and ticks it off on the real board.

Why so strict? Because if every kid edited their own copy, nobody would know which list is true.

And at night, Mum takes a picture of the board and saves it on her phone (that's *localStorage*), so tomorrow morning the board can be rebuilt exactly as it was.
`,

  analogy: {
    title: 'The restaurant order board',
    body: `
In a restaurant kitchen, the **head chef owns the order board**. Each station (grill, salads, desserts) receives a ticket for its dish — the station can read the ticket, not rewrite the board. When a dish is ready, the station calls out "table 4, burger up!" and the head chef updates the board.

The new-order screen at the front (the waiter's tablet) doesn't write on the board either: it sends "new order: two pancakes" and the chef adds it. At closing time the board is photographed so tomorrow's shift can carry on.
`,
    mapping: [
      ['head chef + order board', '`App.vue` owning the `tasks` ref'],
      ['ticket handed to a station', 'the `task` prop passed to `TaskItem`'],
      ['"table 4, burger up!"', '`emit(\'toggle\', task.id)`'],
      ['waiter\'s tablet sending a new order', '`TaskForm` emitting `add`'],
      ['photo of the board at closing', '`saveTasks()` writing to `localStorage`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Props down, events up',
    caption: 'App owns the tasks. Children receive data as props and report changes with events. A deep watcher saves every change.',
    alt: 'Diagram: App.vue in the centre owns tasks and filter. Arrows labelled props go down to TaskItem (one per task) and TaskFilters. Arrows labelled events go up from TaskForm (add), TaskItem (toggle, remove) and TaskFilters (change) back to App. App also connects to storage.js: loadTasks on start and saveTasks on every change via a deep watch, which talks to localStorage.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'form', label: 'TaskForm.vue', note: 'emits add(title)', tone: 'paper' },
        { id: 'app', label: 'App.vue', note: 'owns tasks + filter', tone: 'acid' },
        { id: 'storage', label: 'storage.js', note: 'loadTasks · saveTasks', tone: 'kraft' },
        { id: 'filters', label: 'TaskFilters.vue', note: 'props: current, counts', tone: 'paper' },
        { id: 'item', label: 'TaskItem.vue × n', note: 'prop: task · emits toggle, remove', tone: 'cobalt' },
        { id: 'ls', label: 'localStorage', note: 'vue-zero.tasks.v1', tone: 'ink' },
      ],
      edges: [
        { from: 'form', to: 'app', label: 'add' },
        { from: 'app', to: 'item', label: 'props' },
        { from: 'item', to: 'app', id: 'item-up', label: 'toggle / remove', dashed: true },
        { from: 'app', to: 'filters', label: 'props' },
        { from: 'filters', to: 'app', id: 'filters-up', label: 'change', dashed: true },
        { from: 'app', to: 'storage', label: 'watch → save' },
        { from: 'storage', to: 'ls', label: 'JSON' },
      ],
      steps: [
        { focus: ['app'], text: '`App.vue` is the single owner of `tasks` and `filter`. Nobody else changes them.' },
        { focus: ['app', 'item', 'filters'], edges: ['app->item', 'app->filters'], text: 'Data flows **down** as props: each `TaskItem` gets one task, `TaskFilters` gets the current filter and the counts.' },
        { focus: ['item', 'filters', 'form', 'app'], edges: ['item-up', 'filters-up', 'form->app'], text: 'Changes flow **up** as events: "toggle task 3", "remove task 2", "add *Water plants*", "show done". App runs the matching handler.' },
        { focus: ['app', 'storage', 'ls'], edges: ['app->storage', 'storage->ls'], text: 'A deep `watch` on `tasks` calls `saveTasks()` after every change. On start, `loadTasks()` restores the list (or `null` → sample tasks).' },
      ],
    },
  },

  requirements: [
    'Start with three sample tasks — **Buy oat milk**, **Finish the history essay** (done) and **Call grandma** — rendered as `<li class="task">` items with the title in `.task-title`. A done task has the class `is-done`.',
    '`.remaining` shows the number of unfinished tasks: **"2 tasks left"**, **"1 task left"**.',
    'A `<form class="task-form">` with an `<input class="new-task-input">` adds a task on submit and clears the input. Blank or whitespace-only titles are rejected and show a message in `.form-error`.',
    'Each task has a checkbox `.task-toggle` (toggles done) and a `.task-delete` button (removes it). `TaskItem` must **not** change its `task` prop — it emits `toggle` / `remove` with the task id.',
    'Filter buttons `.filter-all`, `.filter-active`, `.filter-done` show the matching tasks, each with its count in `.filter-count`, and expose `aria-pressed`.',
    'When the current filter has no tasks, show a friendly message in `.empty`. A `.clear-done` button (only shown when something is done) removes all done tasks.',
    'Tasks are saved to `localStorage` under the key exported as `STORAGE_KEY` from `storage.js` after **every** change (add, toggle, remove) and restored on start. Corrupted saved data must not crash the app.',
  ],

  objectives: [
    'Split a UI into focused components and decide which one **owns** each piece of state.',
    'Pass data down with `defineProps()` and send changes up with `defineEmits()` — and explain why children must not mutate props.',
    'Render lists with `v-for` and stable `:key`s, and derive filtered views with `computed()`.',
    'Persist state with a deep `watch` and a small storage module that survives bad data and blocked storage.',
    'Build accessible list UIs: real labels, `aria-pressed` toggles, descriptive delete buttons and live counts.',
  ],

  playground: {
    title: 'Task manager — starter',
    objective: 'The components exist but do not talk to each other yet. Wire up props, events, filters and persistence until every test passes.',
    files: {
      'App.vue': starterApp,
      'TaskForm.vue': starterForm,
      'TaskItem.vue': starterItem,
      'TaskFilters.vue': starterFilters,
      'storage.js': starterStorage,
      'base.css': baseCss,
    },
    expected: 'The starter shows the three sample tasks, but nothing reacts: the form does not add, checkboxes and delete buttons do nothing, filters are static and nothing is saved. **localStorage in this sandbox is in-memory and resets on every run** — the tests check that your code *writes and reads* it correctly; in a real browser the data would survive reloads.',
    tests: [
      {
        name: 'shows the three sample tasks',
        code: `expect(findAll('.task')).toHaveLength(3)
expect(text('.task-list')).toContain('Buy oat milk')
expect(text('.task-list')).toContain('Call grandma')
expect(text('.remaining')).toBe('2 tasks left')`,
      },
      {
        name: 'adds a task from the form and clears the input',
        code: `try {
  await type('.new-task-input', '  Water the plants ')
  await submit('.task-form')
  expect(findAll('.task')).toHaveLength(4)
  expect(text('.task-list')).toContain('Water the plants')
  expect(find('.new-task-input').value).toBe('')
  expect(text('.remaining')).toBe('3 tasks left')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'rejects a blank title with a message',
        code: `await type('.new-task-input', '   ')
await submit('.task-form')
expect(findAll('.task')).toHaveLength(3)
expect(exists('.form-error')).toBe(true)`,
      },
      {
        name: 'ticking a checkbox marks the task done',
        code: `try {
  await check('.task-toggle', true)
  expect(classes('.task')).toContain('is-done')
  expect(text('.remaining')).toBe('1 task left')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'the delete button removes the task',
        code: `try {
  await click('.task-delete')
  expect(findAll('.task')).toHaveLength(2)
  expect(text('.task-list')).not.toContain('Buy oat milk')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'filters show active / done tasks with counts',
        code: `expect(text('.filter-active .filter-count')).toBe('2')
expect(text('.filter-done .filter-count')).toBe('1')
await click('.filter-active')
expect(findAll('.task')).toHaveLength(2)
expect(findAll('.task.is-done')).toHaveLength(0)
await click('.filter-done')
expect(findAll('.task')).toHaveLength(1)
expect(text('.task-list')).toContain('Finish the history essay')
expect(attr('.filter-done', 'aria-pressed')).toBe('true')
expect(attr('.filter-all', 'aria-pressed')).toBe('false')`,
      },
      {
        name: 'clear completed removes done tasks, then shows the empty state',
        code: `try {
  await click('.clear-done')
  expect(findAll('.task')).toHaveLength(2)
  expect(exists('.clear-done')).toBe(false)
  await click('.filter-done')
  expect(exists('.task')).toBe(false)
  expect(isVisible('.empty')).toBe(true)
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'TaskItem emits events instead of mutating its prop',
        code: `const item = mountFile('TaskItem.vue', { task: { id: 7, title: 'Read a chapter', done: false } })
await check(item.find('.task-toggle'), true)
expect(item.emitted('toggle')).toEqual([[7]])
expect(item.props.task.done).toBe(false)
await click(item.find('.task-delete'))
expect(item.emitted('remove')).toEqual([[7]])`,
      },
      {
        name: 'every change is saved to localStorage',
        code: `const { STORAGE_KEY } = requireModule('storage.js')
try {
  await type('.new-task-input', 'Pack gym bag')
  await submit('.task-form')
  let saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
  expect(saved).toHaveLength(4)
  expect(saved[3].title).toBe('Pack gym bag')
  await check('.task-toggle', true)
  saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
  expect(saved[0].done).toBe(true)
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'saved tasks are restored on start',
        code: `const { STORAGE_KEY } = requireModule('storage.js')
try {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 9, title: 'From last time', done: false }]))
  const app = mountFile('App.vue')
  expect(app.text()).toContain('From last time')
  expect(app.text()).not.toContain('Buy oat milk')
} finally {
  localStorage.clear()
}`,
      },
      {
        name: 'corrupted saved data does not crash the app',
        code: `const { STORAGE_KEY } = requireModule('storage.js')
try {
  localStorage.setItem(STORAGE_KEY, '{definitely not json')
  const app = mountFile('App.vue')
  expect(app.text()).toContain('Buy oat milk')
} finally {
  localStorage.clear()
}`,
      },
    ],
  },

  steps: [
    {
      title: 'Plan the components and who owns the data',
      body: [
        `
Sketch the screen and draw boxes around pieces that have **one job**:

- \`TaskForm\` — type a title, press Add.
- \`TaskFilters\` — All / Active / Done buttons.
- \`TaskItem\` — one row: checkbox, title, delete.
- \`App\` — puts them together.

Now the key question: **which component owns the list of tasks?** The form needs to add to it, the items need to change it, the filters need to count it. The rule is: state lives in the **closest common parent** of everyone who needs it. Here that is \`App\`.

Everything else follows from that decision: \`App\` passes data down as *props* ([props](lesson:props)) and children send requests up as *events* ([emits](lesson:emits)).
`,
        {
          callout: 'tip',
          title: 'A useful test',
          text: 'If two components need the same data, neither of them should own it — their parent should. If the whole app needs it, that is when a store like Pinia earns its place (Project 5).',
        },
      ],
    },
    {
      title: 'TaskItem: read a prop, emit events',
      body: [
        `
A *prop* is read-only input from the parent. An *event* is a message to the parent. \`TaskItem\` receives one \`task\` and declares the two things that can happen to it:
`,
        {
          code: `<script setup>
defineProps({
  task: { type: Object, required: true },
})

const emit = defineEmits(['toggle', 'remove'])
</script>

<template>
  <li class="task" :class="{ 'is-done': task.done }">
    <label class="task-label">
      <input
        type="checkbox"
        class="task-toggle"
        :checked="task.done"
        @change="emit('toggle', task.id)"
      />
      <span class="task-title">{{ task.title }}</span>
    </label>
    <button
      type="button"
      class="task-delete"
      :aria-label="'Delete task: ' + task.title"
      @click="emit('remove', task.id)"
    >
      <span aria-hidden="true">✕</span>
    </button>
  </li>
</template>`,
          lang: 'vue',
          title: 'TaskItem.vue',
        },
        `
Notice what is **not** here: \`task.done = !task.done\`. Mutating a prop's nested property would technically work (Vue only warns when you reassign a prop itself), but then the child secretly changes the parent's data and nobody can tell where changes come from. Emit, and let the owner decide.

The checkbox sits inside a \`<label>\` so clicking the title ticks it too, and the ✕ button gets a real \`aria-label\` because "✕" means nothing to a screen reader.
`,
      ],
    },
    {
      title: 'Render the list and handle the events in App',
      body: [
        `
\`v-for\` renders one \`TaskItem\` per task ([list rendering](lesson:list-rendering)). The \`:key\` must be a **stable, unique id** — not the array index — so Vue can match each component to the right task when the list changes.
`,
        {
          code: `<ul class="task-list">
  <TaskItem
    v-for="task in visibleTasks"
    :key="task.id"
    :task="task"
    @toggle="toggleTask"
    @remove="removeTask"
  />
</ul>`,
          lang: 'vue',
          title: 'App.vue — template',
        },
        {
          code: `function toggleTask(id) {
  const task = tasks.value.find((t) => t.id === id)
  if (task) task.done = !task.done
}

function removeTask(id) {
  tasks.value = tasks.value.filter((task) => task.id !== id)
}`,
          lang: 'js',
          title: 'App.vue — handlers',
        },
        `
\`@toggle="toggleTask"\` passes the event's payload (the id) as the first argument. Both styles of update are fine on a ref'd array: mutate an item in place, or replace the array with a filtered copy.
`,
      ],
    },
    {
      title: 'TaskForm: local input state, validation, and an add event',
      body: [
        `
What the user is *typing* is local to the form — nobody else cares until they press Add. So \`title\` lives in \`TaskForm\`, and only the finished, cleaned-up title travels up.
`,
        {
          code: `<script setup>
import { ref } from 'vue'

const emit = defineEmits(['add'])
const title = ref('')
const error = ref('')

function submit() {
  const clean = title.value.trim()
  if (!clean) {
    error.value = 'Give the task a name first.'
    return
  }
  emit('add', clean)
  title.value = ''
  error.value = ''
}
</script>`,
          lang: 'vue',
          title: 'TaskForm.vue — script',
        },
        `
In the template, \`@submit.prevent="submit"\` stops the browser's default page reload and handles both the Add button *and* pressing Enter. Show the error with \`v-if\`, link it with \`aria-describedby\`, and give it \`role="alert"\` so it is announced.

Back in \`App\`, create the task with the next free id:
`,
        {
          code: `function nextId() {
  return tasks.value.reduce((max, task) => Math.max(max, task.id), 0) + 1
}

function addTask(title) {
  tasks.value.push({ id: nextId(), title, done: false })
}`,
          lang: 'js',
          title: 'App.vue',
        },
        {
          callout: 'note',
          title: 'Simplified ids',
          text: '"Highest id + 1" is fine for a single-user list in one tab. Real apps get ids from the server, or generate random ones (for example `crypto.randomUUID()` in secure contexts) so two devices never create the same id.',
        },
      ],
    },
    {
      title: 'Filters, counts and empty states with computed()',
      body: [
        `
The filter is new state (\`ref('all')\`); the visible tasks and counts are **derived** from it and from \`tasks\` ([computed()](lesson:computed)):
`,
        {
          code: `const filter = ref('all')

const counts = computed(() => {
  const done = tasks.value.filter((task) => task.done).length
  return { all: tasks.value.length, active: tasks.value.length - done, done }
})

const visibleTasks = computed(() => {
  if (filter.value === 'active') return tasks.value.filter((task) => !task.done)
  if (filter.value === 'done') return tasks.value.filter((task) => task.done)
  return tasks.value
})

const remainingLabel = computed(() =>
  counts.value.active === 1 ? '1 task left' : counts.value.active + ' tasks left',
)`,
          lang: 'js',
          title: 'App.vue — derived state',
        },
        `
\`TaskFilters\` stays "dumb": it shows \`current\` and \`counts\` and emits \`change\`. App listens with \`@change="filter = $event"\` (\`$event\` is the emitted value). Each button gets \`:aria-pressed="current === f.id"\` so assistive tech knows which filter is on.

Finally, never show an empty box: \`<ul v-if="visibleTasks.length">\` … \`<p v-else class="empty">\` with a message that matches the filter, and a \`.clear-done\` button shown only when \`counts.done > 0\`.
`,
      ],
    },
    {
      title: 'Persist with a storage module and a deep watch',
      body: [
        `
Keep \`localStorage\` out of your components. A tiny \`storage.js\` hides the details — key name, JSON, error handling — behind two functions:
`,
        {
          code: `export const STORAGE_KEY = 'vue-zero.tasks.v1'

export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data.filter(isTask) : null
  } catch (error) {
    console.warn('Could not read saved tasks:', error.message)
    return null
  }
}

export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch (error) {
    console.warn('Could not save tasks:', error.message)
  }
}`,
          lang: 'js',
          title: 'storage.js',
        },
        `
Why so defensive? \`JSON.parse\` throws on corrupted text, \`setItem\` can throw when storage is full or blocked, and saved data may come from an older version of your app. \`isTask()\` filters out anything that does not have the right shape.

Then, in \`App\`, load once and save on every change ([watch](lesson:watch)):
`,
        {
          code: `const tasks = ref(loadTasks() ?? SAMPLE_TASKS.map((task) => ({ ...task })))

watch(tasks, (value) => saveTasks(value), { deep: true })`,
          lang: 'js',
          title: 'App.vue',
        },
        `
\`deep: true\` matters: ticking a checkbox changes \`task.done\` *inside* the array without replacing the array. A plain watch on a ref only fires when \`.value\` is replaced; the deep option makes it notice nested changes too.
`,
        {
          callout: 'warn',
          title: 'Sandbox note',
          text: 'In this playground `localStorage` is an in-memory stand-in that resets on every run, so a "reload" here always starts fresh. The tests check that your code writes and reads the right data; in a real browser it persists per site until the user clears it.',
        },
      ],
    },
    {
      title: 'Polish and review',
      body: `
Run the tests. When they are green, read your code once more with these questions:

- Does any child change data it received as a prop? (It shouldn't.)
- Is every \`v-for\` keyed by a stable id?
- Is anything stored that could be computed? (\`counts\`, \`visibleTasks\`, the label — all computed.)
- Would the app survive storage being full or the saved JSON being garbage?
- Can you use the whole app with only a keyboard? (Tab to the input, Enter to add, Space to tick a checkbox, Tab to delete.)

Then try the stretch challenges — inline editing is a great next step.
`,
    },
  ],

  solution: {
    entry: 'App.vue',
    files: {
      'App.vue': solutionApp,
      'TaskForm.vue': solutionForm,
      'TaskItem.vue': solutionItem,
      'TaskFilters.vue': solutionFilters,
      'storage.js': solutionStorage,
      'base.css': baseCss,
    },
    explanation: `
**One owner, clear messages.** \`App.vue\` owns \`tasks\` and \`filter\`. Every other component is either a *display* of props (\`TaskItem\`, \`TaskFilters\`) or a *source* of events (\`TaskForm\`, \`TaskItem\`, \`TaskFilters\`). When something changes, you can find out why by searching for one handler in one file.

**Derived, not stored.** Counts, the visible list, the "tasks left" label and the empty message are all \`computed\`, so they can never disagree with the data.

**Persistence at the edge.** \`storage.js\` is the only file that knows about \`localStorage\`, JSON or the key name. It validates what it reads and swallows storage errors, so a bad save never takes the app down. A single deep \`watch\` saves after every kind of change — add, toggle, remove, clear — without each handler having to remember.

**Accessible by default.** Labels wrap the checkboxes, delete buttons have descriptive labels, filters expose \`aria-pressed\`, the remaining count is \`aria-live\` and the form error uses \`role="alert"\`.
`,
  },

  challenges: [
    'Inline editing: double-click a title to edit it; **Enter** saves (emit `rename` with id and title), **Escape** cancels. The interview coding question gets you started.',
    'Add a priority (low / normal / high) to each task and sort high-priority tasks first with a computed.',
    'Remember the selected filter too — but think about whether it belongs in the same storage key as the tasks.',
    'Sync between browser tabs: listen to the `storage` event on `window` (and remove the listener in `onUnmounted`).',
    'Extract the persistence into a reusable `usePersistentRef(key, defaultValue)` composable — see [composable recipes](lesson:composable-recipes).',
    'Add drag-and-drop reordering and persist the order.',
  ],

  mistakes: [
    {
      title: 'Mutating a prop inside the child',
      wrong: { lang: 'vue', code: `<input type="checkbox" v-model="task.done" />\n<!-- the child silently edits the parent's object -->` },
      right: { lang: 'vue', code: `<input type="checkbox" :checked="task.done" @change="emit('toggle', task.id)" />` },
      explanation: 'Props are one-way. Vue warns if you reassign a prop, but nested mutations slip through silently — and then changes come from places nobody expects. Emit an event and let the owner update its own data.',
    },
    {
      title: 'Using the array index as the key',
      wrong: { lang: 'vue', code: `<TaskItem v-for="(task, index) in tasks" :key="index" :task="task" />` },
      right: { lang: 'vue', code: `<TaskItem v-for="task in tasks" :key="task.id" :task="task" />` },
      explanation: 'When you delete the first task, every index shifts. Vue then reuses the component that showed task 1 for task 2, so any local state inside it (an open edit box, focus, an animation) ends up on the wrong task. Keys must identify the *item*, not its position.',
    },
    {
      title: 'Watching without `deep` and wondering why toggles are not saved',
      wrong: { lang: 'js', code: `watch(tasks, saveTasks) // fires on tasks.value = …, not on task.done = true` },
      right: { lang: 'js', code: `watch(tasks, saveTasks, { deep: true })` },
      explanation: 'A watcher on a ref only triggers when `.value` is replaced. Changing a property of an item inside the array needs a deep watcher (or watch a getter that reads what you care about).',
    },
    {
      title: 'Trusting whatever is in localStorage',
      wrong: { lang: 'js', code: `const tasks = ref(JSON.parse(localStorage.getItem('tasks')))\n// null on first visit, throws on corrupted text` },
      right: { lang: 'js', code: `const tasks = ref(loadTasks() ?? SAMPLE_TASKS.map((t) => ({ ...t })))` },
      explanation: 'Saved data can be missing, corrupted, from an older app version, or blocked entirely. Parse inside `try/catch`, validate the shape, and fall back to a sensible default.',
    },
    {
      title: 'Sharing a module-level array as initial state',
      wrong: { lang: 'js', code: `const tasks = ref(loadTasks() ?? SAMPLE_TASKS) // edits change SAMPLE_TASKS itself` },
      right: { lang: 'js', code: `const tasks = ref(loadTasks() ?? SAMPLE_TASKS.map((task) => ({ ...task })))` },
      explanation: '`ref()` wraps the object you give it — it does not copy it. Mutating tasks would mutate the shared constant, so a second instance of the component (or a "reset to samples" feature) would start from the edited data.',
    },
  ],

  debugging: [
    {
      symptom: 'Clicking a checkbox does nothing (or the parent handler never runs).',
      cause: 'The child emits a different event name than the parent listens to, or forgot to emit at all.',
      fix: 'Check `defineEmits([...])`, the `emit(\'name\')` call and the `@name` listener all use the same name. Vue Devtools\' timeline shows every component event.',
    },
    {
      symptom: 'Ticking tasks works, but after a reload the ticks are gone.',
      cause: 'The watcher is not deep, so nested `task.done` changes never trigger a save.',
      fix: 'Use `watch(tasks, save, { deep: true })`.',
    },
    {
      symptom: 'After deleting a task, an edit box or focus jumps to a different task.',
      cause: '`v-for` is keyed by index, so components are reused for the wrong items.',
      fix: 'Key by a stable id: `:key="task.id"`.',
    },
  ],

  quiz: [
    {
      id: 'project-task-manager-q1',
      type: 'mcq',
      prompt: '`TaskForm`, `TaskItem` and `TaskFilters` all need the task list. Where should the `tasks` ref live?',
      options: [
        { text: 'In `TaskItem`, since that is where tasks are shown', why: 'Each TaskItem shows one task; the form and the filters would have no way to reach the list.' },
        { text: 'In `App`, the closest common parent' },
        { text: 'A copy in each component, kept in sync with watchers', why: 'Copies drift apart. Syncing them with watchers is fragile and the classic source of "the screen disagrees with itself" bugs.' },
        { text: 'Only in `localStorage`, read whenever needed', why: 'localStorage is not reactive — Vue would not re-render when it changes. It is a backup, not the source of truth.' },
      ],
      answer: 1,
      explanation: 'Shared state lives in the closest common ancestor of the components that need it. Children get it via props and request changes via events.',
    },
    {
      id: 'project-task-manager-q2',
      type: 'output',
      prompt: 'The user ticks the first task (`tasks.value[0].done = true` runs). How many times has `save` been called?',
      code: {
        lang: 'js',
        code: `const tasks = ref([{ id: 1, title: 'Buy oat milk', done: false }])
let calls = 0
const save = () => calls++

watch(tasks, save)

tasks.value[0].done = true
// …after Vue has flushed its watchers`,
      },
      options: ['0', '1', '2', 'It throws an error'],
      answer: 0,
      explanation: 'Without `{ deep: true }`, a watcher on a ref only fires when `.value` itself is replaced. A nested property change does not trigger it, so `save` was never called.',
    },
    {
      id: 'project-task-manager-q3',
      type: 'bug',
      prompt: 'Clicking the checkbox never toggles the task. Click the line that causes the bug.',
      code: {
        lang: 'vue',
        code: `<!-- TaskItem.vue -->
<script setup>
defineProps({ task: Object })
const emit = defineEmits(['toggle'])
</script>

<template>
  <input type="checkbox" :checked="task.done" @change="emit('toggled', task.id)" />
</template>

<!-- App.vue -->
<TaskItem v-for="t in tasks" :key="t.id" :task="t" @toggle="toggleTask" />`,
      },
      answerLine: 8,
      explanation: 'The child emits `toggled`, but it declared and the parent listens for `toggle`. Event names must match exactly; Vue also warns that `toggled` is not a declared event.',
    },
    {
      id: 'project-task-manager-q4',
      type: 'fill',
      prompt: 'Complete `TaskItem` so it declares its events and reports which task was removed.',
      code: { lang: 'js', code: `const emit = ___(['toggle', 'remove'])\n\nfunction onDelete() {\n  emit('remove', props.task.___)\n}` },
      answer: [['defineEmits'], ['id']],
      explanation: '`defineEmits()` declares the events (and returns the `emit` function). Sending the stable `id` lets the parent find the right task.',
    },
    {
      id: 'project-task-manager-q5',
      type: 'short',
      prompt: 'Why does the solution validate the data it reads from `localStorage` instead of using `JSON.parse` directly?',
      answer: 'Saved data is untrusted input: it may be missing (first visit), corrupted (JSON.parse throws), written by an older version of the app with a different shape, or storage may be blocked. Parsing in try/catch, checking the shape, and falling back to defaults keeps the app working in all those cases.',
    },
  ],

  interview: [
    {
      id: 'project-task-manager-one-way-flow',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'In your task manager, `TaskItem` emits `toggle` instead of setting `task.done` itself. Why — it would work either way?',
      answer: 'Props are one-way: the parent owns the data. If children mutate it, changes can come from anywhere and become impossible to trace; emitting keeps every change in the owner\'s handlers, where rules (validation, persistence, permissions) live. Vue only warns when you reassign a prop, not for nested mutations, so this is a discipline, not something Vue fully enforces.',
      explanation: 'Props down, events up: one place changes data, everyone else asks.',
      whyAsked: 'One-way data flow is the core of component design in Vue; interviewers want to hear the "why", not just the rule.',
      mistakes: ['Saying Vue throws an error for nested prop mutation (it does not).', 'Saying it is "just convention" without mentioning traceability.'],
      followUps: ['When is `v-model` on a component appropriate?', 'How would you handle this with `defineModel()`?'],
      modelAnswer: 'The parent owns the task list, so only the parent should change it. The child reports intent — "toggle task 3" — and the parent\'s handler applies it. That keeps every mutation in one place, which makes bugs traceable and lets the owner apply rules like persistence. Vue warns if you reassign a prop, but nested mutations like `task.done = true` are silent, so it is a discipline worth keeping. For form-like components, `v-model` or `defineModel()` is the sanctioned two-way pattern, and it is still an event under the hood.',
    },
    {
      id: 'project-task-manager-index-key',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Each `TaskItem` has a local `editing` ref. A user opens the edit box on task 2, then deletes task 1 — and now task 3 shows the edit box. What is wrong?',
      code: { lang: 'vue', code: `<TaskItem v-for="(task, i) in tasks" :key="i" :task="task" @remove="removeTask" />` },
      answer: 'The list is keyed by index. After deleting task 1, the component that was at index 1 (task 2, in edit mode) is reused for whatever is now at index 1 (task 3), keeping its local `editing` state. Key by the stable `task.id`.',
      explanation: 'Keys tell Vue which component belongs to which item. Index keys follow the position, not the item.',
      whyAsked: 'Keys are a classic interview topic; this checks you understand the consequence, not just the rule.',
      mistakes: ['Saying keys are only for performance.', 'Suggesting `Math.random()` keys (forces every item to re-mount on each render).'],
      followUps: ['What happens with random keys?', 'When is an index key acceptable?'],
      modelAnswer: 'Vue uses keys to decide which existing component instance matches which item. With index keys, deleting the first item shifts every index, so Vue reuses the instance at position 1 — which still has `editing = true` — for the next task. The fix is a stable, unique key like `task.id`. Index keys are only safe for static lists with no local state and no reordering; random keys are worse because they remount everything on every render.',
    },
    {
      id: 'project-task-manager-multi-tab',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A user has the task manager open in **two tabs**. They add a task in tab A, then tick a task in tab B. Later, tab A\'s new task has disappeared. Explain and propose a fix.',
      answer: 'Each tab loaded the list once and holds its own copy in memory. Tab B never saw tab A\'s addition, so when B saved after the tick, it overwrote storage with its stale list (last write wins). Fix: listen to the `storage` event on `window` (fired in *other* tabs when localStorage changes) and reload the list, or use BroadcastChannel; for real multi-device sync, the server must be the source of truth.',
      explanation: 'localStorage is shared per origin, but your reactive state is per tab.',
      whyAsked: 'Tests understanding of where state actually lives and of concurrency in "simple" persistence.',
      mistakes: ['Assuming localStorage is reactive.', 'Forgetting to remove the window listener on unmount.'],
      followUps: ['Does the `storage` event fire in the tab that made the change?', 'How would you merge instead of replace?'],
      modelAnswer: 'Each tab holds its own in-memory copy, and saving writes the whole list, so the last tab to save wins and erases the other\'s changes. I would add a `storage` event listener on window — it fires in the other tabs when a key changes — and replace the in-memory list with the new data, removing the listener in onUnmounted. For anything beyond one browser, I would move the source of truth to a server and sync per-task changes rather than whole lists.',
    },
    {
      id: 'project-task-manager-persistence-placement',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'You put persistence in a deep watcher in `App.vue` plus a `storage.js` module. What are the alternatives, and when would you switch?',
      answer: 'Options: (1) a reusable composable like `usePersistentRef(key, default)` that returns a ref and saves it — good once two features need persistence; (2) a Pinia store with a `$subscribe` that saves — good when the state is shared app-wide; (3) explicit saves in each handler — simple but easy to forget one. Keeping storage details in one module is the constant across all of them.',
      explanation: 'Persistence is a cross-cutting concern: centralise it so components only deal with reactive state.',
      whyAsked: 'Checks whether you can reason about structure as an app grows rather than following a single recipe.',
      mistakes: ['Calling localStorage directly from many components.', 'Not considering performance of deep watchers on very large lists.'],
      followUps: ['How would you debounce saving?', 'How would you test `usePersistentRef`?'],
      modelAnswer: 'Right now one deep watcher in the owner is the simplest thing that works: every change is saved and no handler can forget. If a second feature needs persistence, I would extract a `usePersistentRef(key, default)` composable. If the state becomes global, it moves into a Pinia store and I would save with `$subscribe`. In every version I keep the storage details — key, JSON, validation, error handling — in one module. For very large lists I would also debounce the save.',
    },
    {
      id: 'project-task-manager-migration',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Version 2 of the app adds `priority` and `createdAt` to every task. Thousands of users already have v1 data saved. How do you ship this safely?',
      answer: 'Version the storage format (the `.v1` key suffix, or a `{ version, tasks }` wrapper). On load, detect old data, run a migration function that fills defaults (`priority: \'normal\'`, `createdAt: null` or "now"), save it under the new version, and keep validation tolerant of missing fields. Never assume saved data matches the current shape; test the migration with real v1 samples.',
      explanation: 'Client-side storage is a database you do not control. It needs migrations just like a server database.',
      whyAsked: 'Separates people who have shipped persistent features from people who have only built demos.',
      mistakes: ['Silently discarding old data.', 'Crashing on `undefined.priority` in templates.', 'Migrating on every load instead of once.'],
      followUps: ['What if the user downgrades to v1?', 'Where would you keep migration functions?'],
      modelAnswer: 'I treat localStorage like a database with a schema version. On load I read the version — from the key or a wrapper object — and if it is older, I run migration functions in order, each filling defaults for new fields, then save under the new version once. Validation tolerates missing optional fields. I keep the migrations in the storage module with unit tests fed by real v1 payloads, and I keep the old key until the new one has been written successfully so a failure does not lose data.',
    },
    {
      id: 'project-task-manager-coding-rename',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Make `TaskItem` editable: **double-clicking** `.task-title` replaces it with an `<input class="task-edit">` pre-filled with the title. **Enter** emits `rename` with `(id, newTitle)` (trimmed; nothing is emitted for blank or unchanged titles) and leaves edit mode. **Escape** cancels without emitting.',
      starter: { files: { 'App.vue': renameApp, 'TaskItem.vue': renameStarter } },
      tests: [
        {
          name: 'double-click shows a pre-filled input',
          code: `const item = mountFile('TaskItem.vue', { task: { id: 4, title: 'Call grandma', done: false } })
await trigger(item.find('.task-title'), 'dblclick')
expect(item.find('.task-edit')).toBeTruthy()
expect(item.find('.task-edit').value).toBe('Call grandma')`,
        },
        {
          name: 'Enter emits rename with id and trimmed title',
          code: `const item = mountFile('TaskItem.vue', { task: { id: 4, title: 'Call grandma', done: false } })
await trigger(item.find('.task-title'), 'dblclick')
await type(item.find('.task-edit'), '  Call grandpa  ')
await trigger(item.find('.task-edit'), 'keyup', { key: 'Enter' })
expect(item.emitted('rename')).toEqual([[4, 'Call grandpa']])
expect(item.find('.task-edit')).toBeNull()`,
        },
        {
          name: 'Escape cancels without emitting',
          code: `const item = mountFile('TaskItem.vue', { task: { id: 4, title: 'Call grandma', done: false } })
await trigger(item.find('.task-title'), 'dblclick')
await type(item.find('.task-edit'), 'Something else')
await trigger(item.find('.task-edit'), 'keyup', { key: 'Escape' })
expect(item.emitted('rename')).toEqual([])
expect(item.text()).toContain('Call grandma')`,
        },
      ],
      hints: [
        'You need two pieces of **local** state: `editing` (boolean) and `draft` (the text being typed).',
        'Use `v-if="editing"` for the input and `v-else` for the title; `@dblclick` copies the title into `draft` and turns editing on.',
        'Use `@keyup.enter="save"` and `@keyup.esc="cancel"`; in `save()`, trim and only `emit(\'rename\', props.task.id, clean)` when it is non-empty and different.',
      ],
      answer: 'Keep `editing` and `draft` as local refs. Double-click copies the title into `draft` and shows the input; Enter trims, emits `rename` with the id and new title if it changed, and exits; Escape just exits.',
      solution: { files: { 'App.vue': renameApp, 'TaskItem.vue': renameSolution } },
      explanation: 'Whether a row is being edited is local UI state (nobody else cares), so it lives in the child. The actual title belongs to the parent, so the child emits a rename request instead of changing the prop.',
      whyAsked: 'Combines local vs shared state, emits with payloads, key modifiers and conditional rendering — a realistic feature in a small space.',
      mistakes: ['Editing `props.task.title` directly with v-model.', 'Emitting on every keystroke.', 'Forgetting to handle blank input.'],
      followUps: ['How would you focus the input automatically when it appears?', 'Should blur save or cancel?'],
      modelAnswer: 'Editing state is local to the row, so `editing` and `draft` are refs inside TaskItem. Double-click copies the current title into the draft and shows the input with v-if. On Enter I trim; if the result is non-empty and different, I emit `rename` with the id and the new title, then leave edit mode. Escape leaves without emitting. The parent owns the real title and applies the rename in its handler, so one-way flow is preserved. To focus the input I would use a template ref and `nextTick`, or a small `v-focus` directive.',
    },
  ],

  takeaways: [
    'Put shared state in the closest common parent; pass it down as props and send changes up as events.',
    'Children report intent (`emit(\'toggle\', id)`) — they never mutate props, even though Vue only warns about reassignment.',
    'Key `v-for` lists by stable ids so component state stays attached to the right item.',
    'Derive counts, filtered lists and labels with `computed()`; store only what cannot be calculated.',
    'Persist through one small module and a deep watcher; treat saved data as untrusted and remember the sandbox\'s `localStorage` is in-memory.',
  ],
}
