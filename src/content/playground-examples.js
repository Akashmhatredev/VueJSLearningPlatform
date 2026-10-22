// Curated examples for the standalone /playground page. Pure data.
// Each example: { id, title, level, blurb, files, entry?, variants?, guide? }

const counterComposition = `<script setup>
import { ref, computed } from 'vue'

const count = ref(0)
const parity = computed(() => (count.value % 2 === 0 ? 'even' : 'odd'))

function increment() {
  count.value++
}
</script>

<template>
  <h2>{{ count }} is {{ parity }}</h2>
  <button @click="increment">+1</button>
  <button @click="count = 0">reset</button>
</template>`

export const playgroundExamples = [
  {
    id: 'counter',
    title: 'Counter — three ways',
    level: 'beginner',
    blurb: 'The same counter written with <script setup>, the Options API and a composable.',
    files: { 'App.vue': counterComposition },
    guide: [
      { file: 'App.vue', lines: [2, 2], text: 'Import the reactivity tools you need from `vue`.' },
      { file: 'App.vue', lines: [4, 4], text: '`ref(0)` creates reactive state. Vue tracks it.' },
      { file: 'App.vue', lines: [5, 5], text: '`computed()` derives a value and caches it until `count` changes.' },
      { file: 'App.vue', lines: [7, 9], text: 'Change state through `.value`; the template follows automatically.' },
      { file: 'App.vue', lines: [12, 16], text: 'In the template, refs are unwrapped — no `.value` needed.' },
    ],
    variants: [
      { id: 'composition', label: 'Composition API (<script setup>)', files: { 'App.vue': counterComposition } },
      {
        id: 'options',
        label: 'Options API',
        files: {
          'App.vue': `<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    parity() {
      return this.count % 2 === 0 ? 'even' : 'odd'
    },
  },
  methods: {
    increment() {
      this.count++
    },
  },
}
</script>

<template>
  <h2>{{ count }} is {{ parity }}</h2>
  <button @click="increment">+1</button>
  <button @click="count = 0">reset</button>
</template>`,
        },
      },
      {
        id: 'composable',
        label: 'Extracted into a composable',
        files: {
          'App.vue': `<script setup>
import { useCounter } from './useCounter.js'

const { count, parity, increment, reset } = useCounter()
</script>

<template>
  <h2>{{ count }} is {{ parity }}</h2>
  <button @click="increment">+1</button>
  <button @click="reset">reset</button>
</template>`,
          'useCounter.js': `import { ref, computed } from 'vue'

export function useCounter(start = 0) {
  const count = ref(start)
  const parity = computed(() => (count.value % 2 === 0 ? 'even' : 'odd'))
  const increment = () => count.value++
  const reset = () => (count.value = start)
  return { count, parity, increment, reset }
}`,
        },
      },
    ],
  },
  {
    id: 'todo',
    title: 'Todo list',
    level: 'beginner',
    blurb: 'v-model, v-for with keys, computed filters and events.',
    files: {
      'App.vue': `<script setup>
import { ref, computed } from 'vue'

let nextId = 3
const draft = ref('')
const filter = ref('all')
const todos = ref([
  { id: 1, text: 'Learn refs', done: true },
  { id: 2, text: 'Build something', done: false },
])

const visible = computed(() =>
  filter.value === 'all' ? todos.value : todos.value.filter((t) => t.done === (filter.value === 'done'))
)
const remaining = computed(() => todos.value.filter((t) => !t.done).length)

function add() {
  const text = draft.value.trim()
  if (!text) return
  todos.value.push({ id: nextId++, text, done: false })
  draft.value = ''
}
</script>

<template>
  <form @submit.prevent="add">
    <input v-model="draft" placeholder="What needs doing?" />
    <button>Add</button>
  </form>
  <p>
    <label v-for="f in ['all', 'open', 'done']" :key="f">
      <input v-model="filter" type="radio" :value="f" /> {{ f }}
    </label>
  </p>
  <ul>
    <li v-for="todo in visible" :key="todo.id">
      <label>
        <input v-model="todo.done" type="checkbox" />
        <s v-if="todo.done">{{ todo.text }}</s>
        <span v-else>{{ todo.text }}</span>
      </label>
    </li>
  </ul>
  <p>{{ remaining }} left</p>
</template>`,
    },
  },
  {
    id: 'fetch',
    title: 'Loading, error & empty states',
    level: 'intermediate',
    blurb: 'A simulated API with latency, failures and cancellation (no real network).',
    files: {
      'App.vue': `<script setup>
import { ref, watch } from 'vue'
import { searchUsers } from './api.js'

const query = ref('')
const users = ref([])
const status = ref('idle') // idle | loading | error | success
let controller = null

watch(query, async (q) => {
  controller?.abort() // cancel the previous, now-stale request
  controller = new AbortController()
  status.value = 'loading'
  try {
    users.value = await searchUsers(q, { signal: controller.signal })
    status.value = 'success'
  } catch (e) {
    if (e.name !== 'AbortError') status.value = 'error'
  }
}, { immediate: true })
</script>

<template>
  <input v-model="query" placeholder="search users (type 'fail' to see an error)" />
  <p v-if="status === 'loading'">Loading…</p>
  <p v-else-if="status === 'error'" style="color: #b8220f">Something went wrong. Try again.</p>
  <p v-else-if="!users.length">No users match “{{ query }}”.</p>
  <ul v-else>
    <li v-for="u in users" :key="u.id">{{ u.name }}</li>
  </ul>
</template>`,
      'api.js': `// Simulated server: a short random delay, honours AbortSignal, can fail.
const PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Alan Turing', 'Evan You']
  .map((name, id) => ({ id, name }))

export function searchUsers(q, { signal } = {}) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (q.includes('fail')) return reject(new Error('Server error'))
      resolve(PEOPLE.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())))
    }, 200 + Math.random() * 300)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })
}`,
    },
  },
  {
    id: 'pinia',
    title: 'Pinia cart shared by components',
    level: 'intermediate',
    blurb: 'One store, two components, state that stays in sync.',
    files: {
      'main.js': `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')`,
      'cart.js': `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCart = defineStore('cart', () => {
  const items = ref([])
  const total = computed(() => items.value.reduce((n, i) => n + i.price, 0))
  function add(product) {
    items.value.push(product)
  }
  return { items, total, add }
})`,
      'App.vue': `<script setup>
import ProductList from './ProductList.vue'
import CartBadge from './CartBadge.vue'
</script>

<template>
  <CartBadge />
  <ProductList />
</template>`,
      'ProductList.vue': `<script setup>
import { useCart } from './cart.js'

const cart = useCart()
const products = [
  { id: 1, name: 'Socks', price: 6 },
  { id: 2, name: 'Cap', price: 18 },
]
</script>

<template>
  <button v-for="p in products" :key="p.id" @click="cart.add(p)">
    Add {{ p.name }} (\${{ p.price }})
  </button>
</template>`,
      'CartBadge.vue': `<script setup>
import { storeToRefs } from 'pinia'
import { useCart } from './cart.js'

const { items, total } = storeToRefs(useCart())
</script>

<template>
  <p>🛒 {{ items.length }} items · \${{ total }}</p>
</template>`,
    },
  },
  {
    id: 'router',
    title: 'Mini app with Vue Router',
    level: 'intermediate',
    blurb: 'Routes, params, a 404 and a lazy-loaded page (memory history in the sandbox).',
    files: {
      'main.js': `import { createApp } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from './App.vue'
import Home from './Home.vue'
import User from './User.vue'

const router = createRouter({
  history: createMemoryHistory(), // real apps: createWebHistory()
  routes: [
    { path: '/', component: Home },
    { path: '/users/:id', component: User, props: true },
    { path: '/about', component: () => import('./About.vue') }, // lazy route
    { path: '/:pathMatch(.*)*', component: { template: '<h2>404 — not found</h2>' } },
  ],
})

createApp(App).use(router).mount('#app')`,
      'App.vue': `<template>
  <nav>
    <RouterLink to="/">Home</RouterLink> ·
    <RouterLink to="/users/42">User 42</RouterLink> ·
    <RouterLink to="/about">About (lazy)</RouterLink> ·
    <RouterLink to="/nope">Broken link</RouterLink>
  </nav>
  <RouterView />
</template>`,
      'Home.vue': `<template><h2>Home</h2></template>`,
      'User.vue': `<script setup>
defineProps({ id: String })
</script>

<template><h2>User #{{ id }}</h2></template>`,
      'About.vue': `<template><h2>About — this chunk loaded on demand</h2></template>`,
    },
  },
  {
    id: 'transition',
    title: 'Animated list',
    level: 'advanced',
    blurb: 'TransitionGroup with enter, leave and move animations.',
    files: {
      'App.vue': `<script setup>
import { ref } from 'vue'

let id = 4
const items = ref([1, 2, 3])
const add = () => items.value.splice(Math.floor(Math.random() * (items.value.length + 1)), 0, id++)
const remove = (n) => (items.value = items.value.filter((x) => x !== n))
const shuffle = () => (items.value = [...items.value].sort(() => Math.random() - 0.5))
</script>

<template>
  <button @click="add">add</button>
  <button @click="shuffle">shuffle</button>
  <TransitionGroup name="list" tag="ul">
    <li v-for="n in items" :key="n" @click="remove(n)">item {{ n }} (click to remove)</li>
  </TransitionGroup>
</template>

<style>
.list-move, .list-enter-active, .list-leave-active { transition: all 0.4s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(30px); }
.list-leave-active { position: absolute; }
li { cursor: pointer; padding: 4px 0; }
</style>`,
    },
  },
  {
    id: 'directive',
    title: 'Custom directives',
    level: 'advanced',
    blurb: 'v-focus and v-highlight written with directive hooks.',
    files: {
      'App.vue': `<script setup>
import { ref } from 'vue'

// In <script setup>, any camelCase variable starting with "v" is a directive.
const vFocus = { mounted: (el) => el.focus() }
const vHighlight = {
  mounted(el, binding) { el.style.background = binding.value },
  updated(el, binding) { el.style.background = binding.value },
}
const color = ref('#dcff1e')
</script>

<template>
  <input v-focus placeholder="I was focused on mount" />
  <p v-highlight="color">Highlighted with {{ color }}</p>
  <input v-model="color" type="color" />
</template>`,
    },
  },
  {
    id: 'render-fn',
    title: 'Render function with h()',
    level: 'advanced',
    blurb: 'A heading component whose level is a prop — easy with h(), awkward in templates.',
    files: {
      'App.vue': `<script setup>
import { ref } from 'vue'
import Heading from './Heading.js'

const level = ref(2)
</script>

<template>
  <input v-model.number="level" type="range" min="1" max="6" />
  <Heading :level="level">I am an h{{ level }}</Heading>
</template>`,
      'Heading.js': `import { h } from 'vue'

export default {
  props: { level: { type: Number, default: 1 } },
  setup(props, { slots }) {
    return () => h('h' + props.level, slots.default?.())
  },
}`,
    },
  },
]
