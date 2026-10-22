// Lesson: Search, filters, sorting & pagination.
// Runnable code talks to api.js, a pretend people-search API (no real network).

const PEOPLE = `const PEOPLE = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
  { id: 2, name: 'Alan Turing', role: 'Researcher' },
  { id: 3, name: 'Barbara Liskov', role: 'Engineer' },
  { id: 4, name: 'Claude Shannon', role: 'Researcher' },
  { id: 5, name: 'Dorothy Vaughan', role: 'Manager' },
  { id: 6, name: 'Edsger Dijkstra', role: 'Engineer' },
  { id: 7, name: 'Frances Allen', role: 'Researcher' },
  { id: 8, name: 'Grace Hopper', role: 'Manager' },
  { id: 9, name: 'Hedy Lamarr', role: 'Designer' },
  { id: 10, name: 'Ivan Sutherland', role: 'Designer' },
  { id: 11, name: 'Joan Clarke', role: 'Researcher' },
  { id: 12, name: 'Katherine Johnson', role: 'Engineer' },
  { id: 13, name: 'Linus Torvalds', role: 'Engineer' },
  { id: 14, name: 'Margaret Hamilton', role: 'Manager' },
  { id: 15, name: 'Niklaus Wirth', role: 'Engineer' },
  { id: 16, name: 'Radia Perlman', role: 'Engineer' },
  { id: 17, name: 'Shafi Goldwasser', role: 'Researcher' },
  { id: 18, name: 'Tim Berners-Lee', role: 'Designer' },
  { id: 19, name: 'Vint Cerf', role: 'Manager' },
  { id: 20, name: 'Whitfield Diffie', role: 'Researcher' },
  { id: 21, name: 'Yukihiro Matsumoto', role: 'Engineer' },
  { id: 22, name: 'Evan You', role: 'Engineer' },
  { id: 23, name: 'Susan Kare', role: 'Designer' },
]`

const searchApi = `// api.js — a pretend people-search API (simplified: in memory, no network).
// GET /api/users?q=&role=&sort=&page=&perPage= → { items, total, page, perPage }
${PEOPLE}

export const stats = { requests: 0 }

export function searchUsers({ q = '', role = '', sort = 'name-asc', page = 1, perPage = 5 } = {}) {
  stats.requests++
  console.log('→ GET /api/users?q=' + q + '&role=' + role + '&sort=' + sort + '&page=' + page)
  return new Promise((resolve) => {
    setTimeout(() => {
      const needle = q.trim().toLowerCase()
      let rows = PEOPLE.filter((p) => p.name.toLowerCase().includes(needle))
      if (role) rows = rows.filter((p) => p.role === role)
      rows.sort((a, b) => {
        if (sort === 'name-desc') return b.name.localeCompare(a.name)
        if (sort === 'role') return a.role.localeCompare(b.role) || a.name.localeCompare(b.name)
        return a.name.localeCompare(b.name)
      })
      const start = (page - 1) * perPage
      resolve({ items: rows.slice(start, start + perPage), total: rows.length, page, perPage })
    }, 250)
  })
}`

const playgroundApp = `<script setup>
import { ref, computed, watch } from 'vue'
import { searchUsers } from './api.js'

const q = ref('')
const role = ref('')
const sort = ref('name-asc')
const page = ref(1)
const perPage = 5

const items = ref([])
const total = ref(0)
const loading = ref(false)

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / perPage)))

async function load() {
  loading.value = true
  try {
    const res = await searchUsers({
      q: q.value, role: role.value, sort: sort.value, page: page.value, perPage,
    })
    items.value = res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// Search again whenever any part of the query changes
watch([q, role, sort, page], load, { immediate: true })
</script>

<template>
  <h2>People finder</h2>
  <div class="filters">
    <input v-model="q" class="search" type="search" placeholder="Search by name…" aria-label="Search by name" />
    <select v-model="role" class="role" aria-label="Role">
      <option value="">All roles</option>
      <option>Engineer</option>
      <option>Designer</option>
      <option>Manager</option>
      <option>Researcher</option>
    </select>
    <select v-model="sort" class="sort" aria-label="Sort by">
      <option value="name-asc">Name A → Z</option>
      <option value="role">Role</option>
    </select>
  </div>

  <p class="status" role="status">{{ loading ? 'Searching…' : total + ' people' }}</p>
  <ul class="results">
    <li v-for="user in items" :key="user.id" class="user">
      <span class="name">{{ user.name }}</span> <small>{{ user.role }}</small>
    </li>
  </ul>
  <p v-if="!loading && total === 0" class="empty">Nobody matches "{{ q }}".</p>

  <nav class="pager" aria-label="Pagination">
    <button class="prev" :disabled="page === 1" @click="page--">Previous</button>
    <span class="page-info">Page {{ page }} of {{ pageCount }}</span>
    <button class="next" :disabled="page >= pageCount" @click="page++">Next</button>
  </nav>
</template>`

const finishedApp = `<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { searchUsers } from './api.js'

const q = ref('')
const role = ref('')
const sort = ref('name-asc')
const page = ref(1)
const perPage = 5

const items = ref([])
const total = ref(0)
const loading = ref(false)

// 1. Debounce typing: commit the search only after 300 ms without a keystroke
const debouncedQ = ref('')
let timer = null
watch(q, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    debouncedQ.value = value.trim()
  }, 300)
})
onUnmounted(() => clearTimeout(timer))

// 2. A new search, filter or sort starts from page 1
watch([debouncedQ, role, sort], () => {
  page.value = 1
})

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / perPage)))
const rangeStart = computed(() => (total.value === 0 ? 0 : (page.value - 1) * perPage + 1))
const rangeEnd = computed(() => Math.min(page.value * perPage, total.value))

async function load() {
  loading.value = true
  try {
    const res = await searchUsers({
      q: debouncedQ.value, role: role.value, sort: sort.value, page: page.value, perPage,
    })
    items.value = res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

watch([debouncedQ, role, sort, page], load, { immediate: true })
</script>

<template>
  <h2>People finder</h2>
  <div class="filters">
    <input v-model="q" class="search" type="search" placeholder="Search by name…" aria-label="Search by name" />
    <select v-model="role" class="role" aria-label="Role">
      <option value="">All roles</option>
      <option>Engineer</option>
      <option>Designer</option>
      <option>Manager</option>
      <option>Researcher</option>
    </select>
    <select v-model="sort" class="sort" aria-label="Sort by">
      <option value="name-asc">Name A → Z</option>
      <option value="name-desc">Name Z → A</option>
      <option value="role">Role</option>
    </select>
  </div>

  <p class="status" role="status">{{ loading ? 'Searching…' : total + ' people' }}</p>
  <ul class="results">
    <li v-for="user in items" :key="user.id" class="user">
      <span class="name">{{ user.name }}</span> <small>{{ user.role }}</small>
    </li>
  </ul>
  <p v-if="!loading && total === 0" class="empty">Nobody matches "{{ q }}".</p>
  <p v-if="total > 0" class="range">Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}</p>

  <nav class="pager" aria-label="Pagination">
    <button class="prev" :disabled="page === 1" @click="page--">Previous</button>
    <span class="page-info">Page {{ page }} of {{ pageCount }}</span>
    <button class="next" :disabled="page >= pageCount" @click="page++">Next</button>
  </nav>
</template>`

const smallApi = `// api.js — a small team that is cheap to load in one go.
export const stats = { requests: 0 }

const TEAM = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer' },
  { id: 2, name: 'Tim Berners-Lee', role: 'Designer' },
  { id: 3, name: 'Grace Hopper', role: 'Manager' },
  { id: 4, name: 'Susan Kare', role: 'Designer' },
  { id: 5, name: 'Alan Turing', role: 'Engineer' },
  { id: 6, name: 'Hedy Lamarr', role: 'Designer' },
  { id: 7, name: 'Margaret Hamilton', role: 'Manager' },
  { id: 8, name: 'Linus Torvalds', role: 'Engineer' },
]

export function getTeam() {
  stats.requests++
  return new Promise((resolve) => setTimeout(() => resolve(TEAM.map((p) => ({ ...p }))), 200))
}`

const clientStarter = `<script setup>
import { ref, onMounted } from 'vue'
import { getTeam } from './api.js'

const team = ref([])
const search = ref('')
const role = ref('')

onMounted(async () => {
  team.value = await getTeam()
})

// TODO: a computed list filtered by search + role, sorted by name
</script>

<template>
  <input v-model="search" class="search" placeholder="Search…" />
  <select v-model="role" class="role">
    <option value="">All roles</option>
    <option>Engineer</option>
    <option>Designer</option>
    <option>Manager</option>
  </select>

  <p class="count">{{ team.length }} of {{ team.length }} people</p>
  <ul>
    <li v-for="person in team" :key="person.id" class="user">{{ person.name }}</li>
  </ul>
</template>`

const clientSolution = `<script setup>
import { ref, computed, onMounted } from 'vue'
import { getTeam } from './api.js'

const team = ref([])
const search = ref('')
const role = ref('')

onMounted(async () => {
  team.value = await getTeam()
})

const visible = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return team.value
    .filter((p) => p.name.toLowerCase().includes(needle))
    .filter((p) => !role.value || p.role === role.value)
    .slice() // copy before sorting: sort() mutates
    .sort((a, b) => a.name.localeCompare(b.name))
})
</script>

<template>
  <input v-model="search" class="search" placeholder="Search…" />
  <select v-model="role" class="role">
    <option value="">All roles</option>
    <option>Engineer</option>
    <option>Designer</option>
    <option>Manager</option>
  </select>

  <p class="count">{{ visible.length }} of {{ team.length }} people</p>
  <ul>
    <li v-for="person in visible" :key="person.id" class="user">{{ person.name }}</li>
  </ul>
  <p v-if="team.length && !visible.length" class="empty">No one matches your filters.</p>
</template>`

const loadMoreStarter = `<script setup>
import { ref, watch } from 'vue'
import { searchUsers } from './api.js'

const q = ref('')
const items = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)

async function fetchPage() {
  loading.value = true
  try {
    const res = await searchUsers({ q: q.value, page: page.value, perPage: 5 })
    items.value = res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  fetchPage()
}

watch(q, () => fetchPage(), { immediate: true })
</script>

<template>
  <input v-model="q" class="search" placeholder="Search…" />
  <ul>
    <li v-for="user in items" :key="user.id" class="user">{{ user.name }}</li>
  </ul>
  <button class="load-more" :disabled="loading" @click="loadMore">Load more</button>
</template>`

const loadMoreSolution = `<script setup>
import { ref, computed, watch } from 'vue'
import { searchUsers } from './api.js'

const q = ref('')
const items = ref([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)

const hasMore = computed(() => items.value.length < total.value)

async function fetchPage({ append = false } = {}) {
  loading.value = true
  try {
    const res = await searchUsers({ q: q.value, page: page.value, perPage: 5 })
    items.value = append ? [...items.value, ...res.items] : res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function loadMore() {
  page.value++
  fetchPage({ append: true })
}

watch(
  q,
  () => {
    page.value = 1 // a new search starts a fresh list
    fetchPage()
  },
  { immediate: true },
)
</script>

<template>
  <input v-model="q" class="search" placeholder="Search…" />
  <ul>
    <li v-for="user in items" :key="user.id" class="user">{{ user.name }}</li>
  </ul>
  <button v-if="hasMore" class="load-more" :disabled="loading" @click="loadMore">Load more</button>
</template>`

const debounceApp = `<script setup>
import { ref } from 'vue'
import { debounce } from './debounce.js'

const searches = ref([])
const runSearch = debounce((text) => searches.value.push(text), 300)
</script>

<template>
  <input class="search" placeholder="Type fast…" @input="runSearch($event.target.value)" />
  <p>Searches sent:</p>
  <ol>
    <li v-for="(s, i) in searches" :key="i" class="sent">{{ s }}</li>
  </ol>
</template>`

export default {
  id: 'search-pagination',
  title: 'Search, filters, sorting & pagination',
  summary: 'Turn a search box, filters, sort order and page number into one query, debounce the typing, and page through results without confusing anyone.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['async-ui-states', 'watch', 'computed', 'v-model-forms'],
  related: ['cancellation-race-conditions', 'router-in-practice', 'dynamic-routes', 'runtime-performance', 'large-lists', 'composable-recipes'],
  tags: ['search', 'filter', 'sort', 'pagination', 'debounce', 'throttle', 'query params', 'load more', 'cursor pagination', 'offset'],
  apis: [
    { name: 'watch([a, b, c], fn, { immediate: true })', summary: 'Re-run a search whenever any of several sources changes, and once right away.' },
    { name: 'debounce', summary: 'Delay an action until input has been quiet for a set time — one request per pause, not per keystroke.' },
    { name: 'pageCount = Math.ceil(total / perPage)', summary: 'Total pages from the server\'s total count.' },
    { name: 'router.replace({ query })', summary: 'Vue Router: mirror filters in the URL without adding history entries.' },
  ],
  docs: [
    { label: 'Vue Guide — Watchers', url: 'https://vuejs.org/guide/essentials/watchers.html' },
    { label: 'Vue Guide — Computed properties', url: 'https://vuejs.org/guide/essentials/computed.html' },
    { label: 'Vue Router — Programmatic navigation (query)', url: 'https://router.vuejs.org/guide/essentials/navigation.html' },
    { label: 'MDN — URLSearchParams', url: 'https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams' },
  ],

  intro: `
Almost every app with a list grows the same controls: a **search box**, a few **filters** ("only designers"), a **sort** order and some way to move through **pages** of results.

Each control is just a piece of state. Together they form one **query** — "people whose name contains *ada*, role *Engineer*, sorted A→Z, page 2" — and every time the query changes, you fetch (or compute) a new set of results.

The craft is in the details: not sending a request on every keystroke (**debouncing**), jumping back to page 1 when the search changes, and telling the user where they are ("Showing 6–10 of 23").
`,

  why: `
Lists outgrow the screen quickly. Nobody scrolls through 10,000 orders; they search, filter and page. And the server usually can't send 10,000 rows at once either — it would be slow to transfer and slow to render.

Small mistakes here are very visible:

- typing "grace" sends **five** requests — one per letter — and wastes the server's time;
- a user on page 4 types a new search and sees **"no results"**, because the new search only has one page;
- the result counter says "page 3 of 2";
- refreshing the page or sharing the link loses every filter.

This lesson builds a people finder that gets all of those right, and explains when to do the work in the browser versus on the server.
`,

  eli15: `
Imagine a library with a librarian at the desk.

You don't ask for "every book". You say: "books with *dragon* in the title, only fantasy, newest first, and show me the **first shelf** of results." That sentence is your **query**.

If you mumble one letter at a time — "d… dr… dra…" — and the librarian runs off to search after every letter, they'll be exhausted. Better: they wait until you **pause** for a moment, then search once. That pause is **debouncing**.

And if you were looking at shelf 4 of the dragon books and then ask for *unicorn* books instead, the librarian should start you at **shelf 1** of the unicorn books — there might not even be a shelf 4.
`,

  analogy: {
    title: 'The library desk',
    body: `
The librarian (the server) can find anything, but each trip to the stacks takes time. A good patron gives one clear request, waits for a pause before changing their mind, and understands that results come one shelf at a time.

A good app does the same: it combines every control into one query, waits for typing to settle, asks for one page at a time and shows which shelf you're on.
`,
    mapping: [
      ['"books with dragon in the title"', 'the search term `q`'],
      ['"only fantasy", "newest first"', 'filters and sort: `role`, `sort`'],
      ['one shelf at a time', 'a page of results: `page`, `perPage`'],
      ['waiting until you pause', 'debouncing the search input'],
      ['"start me at shelf 1"', 'resetting `page` when the query changes'],
      ['"shelf 2 of 5"', '`Page 2 of 5` / `Showing 6–10 of 23`'],
    ],
  },

  visual: {
    type: 'performance',
    props: { demo: 'debounce' },
    title: 'Debouncing, measured live',
    caption: 'Type in both boxes. The undebounced one fires on every keystroke; the debounced one waits for a pause. The counts are real, measured in your browser.',
    alt: 'Two text inputs side by side with counters. Typing in the left one increments its "handler runs" counter on every keystroke. Typing in the right one only increments its counter after typing pauses.',
  },

  syntax: [
    `
#### Where should the filtering happen?

- **Client-side** — load everything once, then filter/sort/paginate with \`computed\`. Instant, works offline, no extra requests. Only sensible when the full dataset is small and the user may see all of it.
- **Server-side** — send the query as URL **query parameters** (\`?q=ada&role=Engineer&sort=name-asc&page=2\`) and receive one page plus a **total count**. Required for large or private datasets.

#### Client-side: one computed chain
`,
    {
      code: `const visible = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return team.value
    .filter((p) => p.name.toLowerCase().includes(needle))
    .filter((p) => !role.value || p.role === role.value)
    .slice()                                    // sort() mutates — copy first
    .sort((a, b) => a.name.localeCompare(b.name))
})`,
      lang: 'js',
      title: 'filter + sort in the browser',
    },
    `
#### Server-side: state → query → request

Keep each control as its own ref, and re-run the request whenever any of them changes:
`,
    {
      code: `const q = ref('')
const role = ref('')
const sort = ref('name-asc')
const page = ref(1)

async function load() {
  const res = await searchUsers({ q: q.value, role: role.value, sort: sort.value, page: page.value, perPage: 5 })
  items.value = res.items   // just this page
  total.value = res.total   // how many match in total
}

watch([q, role, sort, page], load, { immediate: true })`,
      lang: 'js',
      title: 'one watcher for the whole query',
    },
    `
#### Debounce the typing

A **debounce** waits until events stop for a given time, then runs once with the latest value. (A **throttle**, by contrast, runs at most once per time window *while* events keep coming — better for scroll or resize handlers.)
`,
    {
      code: `const q = ref('')            // bound to the input, updates on every keystroke
const debouncedQ = ref('')   // what the search actually uses
let timer = null

watch(q, (value) => {
  clearTimeout(timer)                       // a new keystroke cancels the pending one
  timer = setTimeout(() => {
    debouncedQ.value = value.trim()
  }, 300)
})
onUnmounted(() => clearTimeout(timer))      // don't fire after the component is gone`,
      lang: 'js',
      title: 'a debounced search term',
    },
    `
#### Reset the page when the query changes

Page 4 of the old search means nothing for the new one:
`,
    {
      code: `watch([debouncedQ, role, sort], () => {
  page.value = 1
})`,
      lang: 'js',
      title: 'new query → page 1',
    },
    `
#### Pagination maths

- \`pageCount = Math.max(1, Math.ceil(total / perPage))\`
- \`offset = (page - 1) * perPage\` — how many rows to skip
- first row shown: \`offset + 1\`; last row shown: \`Math.min(page * perPage, total)\`

Disable **Previous** on page 1 and **Next** on the last page.

#### Offset vs cursor pagination

- **Offset** (\`?page=3\` or \`?offset=10&limit=5\`): simple, lets users jump to any page. But if rows are inserted or deleted while someone pages, items can be skipped or shown twice, and very deep offsets can be slow for the database.
- **Cursor** (\`?after=user_42&limit=5\`): the server returns an opaque token pointing to the last item you saw. Stable while data changes and efficient — ideal for feeds and "Load more" / infinite scroll — but you can't jump straight to page 37.

#### Keep the query in the URL (Vue Router)

Putting filters in the URL makes them survive refreshes, work with the back button and be shareable. With [Vue Router](lesson:router-in-practice) (static example):
`,
    {
      code: `import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// read: URL → state (query values are strings — parse and validate them)
const page = computed(() => Math.max(1, Number(route.query.page) || 1))
const q = computed(() => String(route.query.q ?? ''))

// write: state → URL; replace() avoids a history entry per keystroke
function setQuery(patch) {
  router.replace({ query: { ...route.query, ...patch } })
}`,
      lang: 'js',
      title: 'filters in route.query (Vue Router)',
      static: true,
    },
    {
      callout: 'warn',
      title: 'Debouncing doesn\'t fix out-of-order responses',
      text: 'Fewer requests means fewer chances, but if a slow response for "gr" arrives after a fast one for "grace", the stale results still win. Guarding against that is the next lesson: [Cancellation, race conditions & stale responses](lesson:cancellation-race-conditions).',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: playgroundApp,
    intro: 'The playground\'s people finder. It works — but it sends a request per keystroke, forgets to reset the page and is missing a sort option.',
    steps: [
      { lines: [5, 9], text: 'Every control is one ref. Together `q`, `role`, `sort` and `page` *are* the query. `perPage` never changes, so it\'s a plain constant.' },
      { lines: [11, 13], text: 'The result: just the current page (`items`) plus the **total** number of matches, which the server reports so we can compute page counts.' },
      { lines: [15, 15], text: '`Math.ceil` rounds up: 23 people at 5 per page is 4.6 → 5 pages. `Math.max(1, …)` keeps "Page 1 of 1" sensible when nothing matches.' },
      { lines: [17, 28], text: '`load()` sends the whole query and stores the page and total. (A real app would also track errors — see [async states](lesson:async-ui-states).)' },
      { lines: [31, 31], text: 'One watcher over all four refs: any change triggers a new search, and `immediate: true` runs it once on mount. Problem: `q` changes on **every keystroke**.' },
      { lines: [36, 48], text: '`v-model` binds each control to its ref. An `<option>` without a `value` uses its text, so "Engineer" filters by that role.' },
      { lines: [51, 57], text: 'A `role="status"` line announces progress and the count. The empty state appears only when the search finished with no matches.' },
      { lines: [59, 63], text: 'Pagination controls. Buttons disable at the edges so you can\'t ask for page 0 or page 6 of 5.' },
    ],
  },

  playground: {
    title: 'People finder',
    objective: 'Make the people finder efficient and honest: reset the page on new searches, debounce typing, add a sort option and show the visible range.',
    files: { 'App.vue': playgroundApp, 'api.js': searchApi },
    expected: 'A list of 5 people, "23 people" and **Page 1 of 5**. Type a name and watch the **Console**: one request is logged per keystroke. Go to page 3, then search for "ada" — you\'ll be stuck on an empty page 3.',
    experiments: [
      {
        id: 'reset-page',
        task: 'Go to page 2, then type in the search box. You stay on page 2 of the *new* results (or an empty page). Make any change to the search, role or sort **reset `page` to 1**.',
        hint: 'Add a second watcher: `watch([q, role, sort], () => { page.value = 1 })`. It only needs to change `page` — the existing watcher does the loading.',
        tests: [
          {
            name: 'a new search goes back to page 1',
            code: `await wait(350)
await click('.next')
await wait(350)
expect(text('.page-info')).toContain('Page 2')
await type('.search', 'a')
await wait(700)
expect(text('.page-info')).toContain('Page 1')`,
          },
        ],
        explain: 'A page number only means something relative to one particular query. When the query changes, the old position is meaningless — page 1 of the new results is the only safe place to land.',
      },
      {
        id: 'debounce',
        task: 'Open the **Console** and type "gra" quickly: three requests fire. Debounce the search so that typing a burst of letters sends **one** request, about 300 ms after the last keystroke.',
        hint: 'Create `const debouncedQ = ref(\'\')`. `watch(q, …)` with `clearTimeout(timer)` + `timer = setTimeout(() => (debouncedQ.value = value), 300)`. Then use `debouncedQ` (not `q`) in `load()` and in the main watcher.',
        tests: [
          {
            name: 'a burst of typing sends a single request',
            code: `await wait(350)
const stats = requireModule('api.js').stats
const before = stats.requests
await type('.search', 'g')
await type('.search', 'gr')
await type('.search', 'gra')
await wait(700)
expect(stats.requests - before).toBe(1)
expect(text('.user .name')).toBe('Grace Hopper')`,
          },
        ],
        explain: 'The input still updates instantly (it\'s bound to `q`), but the expensive part — the request — only happens once typing pauses. Clearing the previous timer on every keystroke is what collapses a burst into one call. Remember `onUnmounted(() => clearTimeout(timer))`.',
      },
      {
        id: 'sort-desc',
        task: 'The server also understands `sort: \'name-desc\'`. Add a **Name Z → A** option to the sort `<select>` so the list can be reversed.',
        hint: '`<option value="name-desc">Name Z → A</option>` inside `select.sort`.',
        tests: [
          {
            name: 'Name Z → A puts Yukihiro Matsumoto first',
            code: `await wait(350)
await select('.sort', 'name-desc')
await wait(700)
expect(text('.user .name')).toBe('Yukihiro Matsumoto')`,
          },
        ],
        explain: 'Sorting happens on the server, so the browser receives an already-ordered page. If you sorted only the 5 rows you received, you\'d get "the current page reversed" — not "the whole list reversed, page 1". With server-side pagination, sorting must happen server-side too.',
      },
      {
        id: 'range',
        task: 'Tell users exactly what they\'re looking at: add an element with `class="range"` reading **Showing 6–10 of 23** on page 2 (and "Showing 1–5 of 23" on page 1). Hide it when nothing matches.',
        hint: 'Two computeds: `rangeStart = (page - 1) * perPage + 1` and `rangeEnd = Math.min(page * perPage, total)`. Then `<p v-if="total > 0" class="range">Showing {{ rangeStart }}–{{ rangeEnd }} of {{ total }}</p>`.',
        tests: [
          {
            name: 'page 2 shows "Showing 6–10 of 23"',
            code: `await wait(350)
await click('.next')
await wait(350)
expect(text('.range')).toMatch(/6\\s*[–-]\\s*10 of 23/)`,
          },
        ],
        explain: '`Math.min` matters on the last page: page 5 shows "21–23", not "21–25". Derived values like these belong in `computed` — they can never drift out of sync with `page` and `total`.',
      },
    ],
    variants: [{ id: 'finished', label: 'Finished version (all four fixes)', files: { 'App.vue': finishedApp, 'api.js': searchApi } }],
  },

  animation: {
    type: 'concept-diagram',
    title: 'From controls to results',
    caption: 'Each control feeds the query. Only the text box goes through the debounce; selects and pager buttons are deliberate clicks, so they can search immediately.',
    alt: 'A pipeline diagram. The search box feeds a debounce step, which feeds the query. The role select, sort select and page buttons feed the query directly. A change to search, role or sort also resets page to 1. The query triggers a watcher, which sends one request; the response contains items and a total, from which page count and the "Showing x–y of z" range are computed.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'input', label: 'Search box', note: 'q (every keystroke)', tone: 'paper', x: 90, y: 60 },
        { id: 'debounce', label: 'debounce 300 ms', note: 'debouncedQ', tone: 'kraft', x: 280, y: 60 },
        { id: 'selects', label: 'Role · Sort', note: 'role, sort', tone: 'paper', x: 90, y: 160 },
        { id: 'pager', label: 'Prev / Next', note: 'page', tone: 'paper', x: 90, y: 260 },
        { id: 'query', label: 'query', note: '{ q, role, sort, page }', tone: 'acid', x: 470, y: 160 },
        { id: 'request', label: 'one request', note: 'GET /api/users?…', tone: 'cobalt', x: 660, y: 100 },
        { id: 'result', label: 'items + total', note: 'pageCount, range', tone: 'acid', x: 660, y: 240 },
      ],
      edges: [
        { from: 'input', to: 'debounce', label: 'keystrokes' },
        { from: 'debounce', to: 'query', label: 'after a pause' },
        { from: 'selects', to: 'query' },
        { from: 'pager', to: 'query' },
        { id: 'reset', from: 'selects', to: 'pager', label: 'reset to page 1', dashed: true },
        { from: 'query', to: 'request', label: 'watch' },
        { from: 'request', to: 'result', label: 'response' },
      ],
      steps: [
        { focus: ['input', 'debounce'], edges: ['input->debounce'], text: 'Typing changes `q` on every keystroke — the input must feel instant. The debounce holds back the *search* until typing pauses.' },
        { focus: ['debounce', 'query'], edges: ['debounce->query'], text: 'After 300 ms of quiet, `debouncedQ` updates and becomes part of the query.' },
        { focus: ['selects', 'pager', 'query'], edges: ['selects->query', 'pager->query'], text: 'Selects and pager buttons are single, deliberate actions — no need to debounce them.' },
        { focus: ['selects', 'pager'], edges: ['reset'], text: 'Any new search, filter or sort also resets `page` to 1, because the old page number belonged to the old query.' },
        { focus: ['query', 'request'], edges: ['query->request'], text: 'One watcher over the whole query sends exactly one request per meaningful change.' },
        { focus: ['result'], edges: ['request->result'], text: 'The server returns one page plus the total count. `pageCount` and "Showing 6–10 of 23" are `computed` from them.' },
      ],
    },
  },

  internals: {
    beginner: `
A search screen is a chain: controls → query → request → results → what's displayed. Vue's job is the arrows. \`v-model\` keeps each control's ref up to date, a \`watch\` notices when the query changes and starts a request, and \`computed\` values (page count, range, client-side filtered lists) recalculate automatically when their inputs change.
`,
    technical: [
      `
**Watching several sources.** \`watch([q, role, sort, page], load)\` creates one watcher whose getter reads all four refs. When several of them change in the same tick (for example \`debouncedQ\` changes *and* the reset watcher sets \`page = 1\`), Vue's scheduler de-duplicates the queued watcher job, so \`load\` typically runs once with the final values. Watchers default to \`flush: 'pre'\` — they run before the component re-renders.

**Why \`computed\` for client-side filtering.** A computed caches its result and only recalculates when a dependency it read changes (\`team\`, \`search\`, \`role\`). Typing re-filters; re-rendering for unrelated reasons doesn't. Note that \`Array.prototype.sort\` sorts **in place** — sorting \`team.value\` directly inside a computed would mutate state (a side effect) and could trigger extra updates. Copy first (\`.slice()\` or, in modern runtimes, \`toSorted()\`).

**How a debounce works.** Each event clears the previous timer and starts a new one; only the last timer survives long enough to fire. A generic helper:
`,
      {
        code: `export function debounce(fn, ms) {
  let timer = null
  function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), ms)
  }
  debounced.cancel = () => clearTimeout(timer)
  return debounced
}`,
        lang: 'js',
        title: 'debounce in 8 lines',
      },
      `
**String query params.** Everything in a URL is a string. \`route.query.page\` is \`'2'\`, not \`2\` — and it may be missing, repeated (\`?tag=a&tag=b\` becomes an array) or nonsense (\`?page=banana\`). Parse and validate on the way in, and build URLs with \`URLSearchParams\` on the way out so values are encoded.
`,
    ],
    production: `
- **Server-side for anything big or private.** Never ship a full dataset to the browser just to filter it — it's slow, and users can read everything you send.
- **Validate on the server too.** Clamp \`perPage\` (someone will request \`perPage=100000\`), whitelist sort fields, and treat \`q\` as untrusted input.
- **Debounce the input, not the clicks.** Typing gets a debounce (a few hundred ms is common — tune it); selects and buttons should respond immediately.
- **Protect against stale responses** — debouncing reduces but doesn't remove races ([next lesson](lesson:cancellation-race-conditions)).
- **URL as the source of truth** for shareable lists: read filters from \`route.query\`, write with \`router.replace\`, so refresh, back button and links all work.
- **Cursor pagination for feeds** and infinite scroll; offset pagination when users need page numbers. Infinite scroll needs an accessible fallback (a "Load more" button) and should not trap keyboard users before the footer.
- **Very long result lists** are a rendering problem as much as a fetching one — see [Large lists & virtual scrolling](lesson:large-lists).
`,
  },

  mistakes: [
    {
      title: 'Not resetting the page when the query changes',
      wrong: { code: `watch([q, role, page], load)\n// user is on page 4, types a new search → asks for page 4 of the new results`, lang: 'js' },
      right: { code: `watch([q, role], () => { page.value = 1 })\nwatch([q, role, page], load)`, lang: 'js' },
      explanation: 'A page number belongs to one query. Keeping it across a new search often lands on an empty page that looks like "no results".',
    },
    {
      title: 'Requesting on every keystroke',
      wrong: { code: `<input v-model="q" />\nwatch(q, load) // "grace" = 5 requests`, lang: 'js' },
      right: { code: `watch(q, (v) => {\n  clearTimeout(timer)\n  timer = setTimeout(() => (debouncedQ.value = v), 300)\n})\nwatch(debouncedQ, load)`, lang: 'js' },
      explanation: 'Debounce the expensive part (the request) while keeping the input itself instant.',
    },
    {
      title: 'Sorting only the current page',
      wrong: { code: `const sorted = computed(() =>\n  items.value.slice().sort(byNameDesc) // 5 rows from page 1, reversed\n)`, lang: 'js' },
      right: { code: `searchUsers({ q, page, sort: 'name-desc' }) // the server sorts everything, then pages`, lang: 'js' },
      explanation: 'With server pagination, the browser only holds one page. Sorting it locally just shuffles those few rows. Send sort (and filters) to the server.',
    },
    {
      title: 'Mutating state inside a computed with sort()',
      wrong: { code: `const visible = computed(() => team.value.sort(byName)) // sorts team in place`, lang: 'js' },
      right: { code: `const visible = computed(() => team.value.slice().sort(byName))`, lang: 'js' },
      explanation: '`sort()` mutates the array it is called on. Computeds should be pure — copy before sorting.',
    },
    {
      title: 'Using Math.floor or Math.round for page counts',
      wrong: { code: `const pageCount = computed(() => Math.floor(total.value / perPage)) // 23 / 5 → 4`, lang: 'js' },
      right: { code: `const pageCount = computed(() => Math.max(1, Math.ceil(total.value / perPage))) // → 5`, lang: 'js' },
      explanation: 'A partly filled last page is still a page. Round up.',
    },
  ],

  debugging: [
    {
      symptom: 'A new search shows "no results" although matches exist.',
      cause: 'The page number from the previous search was kept.',
      fix: 'Reset `page` to 1 whenever the search, filters or sort change.',
    },
    {
      symptom: 'The Network tab shows one request per typed character.',
      cause: 'The watcher reacts directly to the input\'s ref.',
      fix: 'Watch a debounced copy of the search term (or debounce the handler).',
    },
    {
      symptom: 'Results briefly show the right list, then switch to an older search\'s results.',
      cause: 'Responses arrive out of order and the stale one is applied last.',
      fix: 'Ignore or cancel outdated requests — see [race conditions](lesson:cancellation-race-conditions).',
    },
    {
      symptom: '"Page 3 of 2" or a disabled Next button on a page that has more results.',
      cause: 'Wrong rounding (`floor`) or the total isn\'t updated with the page.',
      fix: 'Use `Math.ceil(total / perPage)` and update `total` from every response.',
    },
    {
      symptom: 'Filters from the URL don\'t apply, or `page` comparisons behave oddly.',
      cause: 'Query values are strings (`\'2\'`), possibly arrays or missing.',
      fix: 'Parse with `Number(...)`, provide defaults, and validate before use.',
    },
  ],

  bestPractices: [
    'Treat search, filters, sort and page as one query; fetch whenever it changes.',
    'Debounce free-text input; respond to selects and buttons immediately.',
    'Reset to page 1 when anything but the page changes.',
    'Let the server filter, sort and paginate large or private datasets; return a total count.',
    'Show where the user is ("Showing 6–10 of 23") and disable Prev/Next at the edges.',
    'Mirror filters in the URL with `router.replace` so refresh, back and share work.',
    'Clean up debounce timers on unmount.',
  ],

  useCases: [
    'An admin table of orders with status filters, date sort and numbered pages.',
    'A product catalogue with a search box, category filters and "Load more".',
    'A social feed with cursor-based infinite scroll.',
    'A small settings list filtered instantly in the browser.',
    'A support inbox whose filters live in the URL so agents can share views.',
  ],

  whenToUse: {
    use: [
      'Client-side filtering when the full dataset is small, already loaded and not sensitive.',
      'Server-side search and pagination for anything large, growing or private.',
      'Debounce for text inputs that trigger requests or expensive work.',
      'Cursor pagination for feeds where items are constantly added.',
    ],
    avoid: [
      'Loading thousands of rows just to filter them in the browser.',
      'Debouncing clicks on pager buttons or selects — it just feels laggy.',
      'Infinite scroll as the only way to reach content (footer links, keyboard users).',
      'Offset pagination for fast-moving feeds where duplicates and gaps would be noticeable.',
    ],
  },

  comparison: {
    title: 'Pagination styles',
    headers: ['', 'Numbered pages (offset)', 'Load more (offset or cursor)', 'Infinite scroll (usually cursor)'],
    rows: [
      ['Jump to page N', 'yes', 'no', 'no'],
      ['Stable when data changes', 'can skip/duplicate items', 'stable with a cursor', 'stable with a cursor'],
      ['User knows where they are', 'yes — "Page 3 of 9"', 'partly — "Showing 30 of 120"', 'rarely'],
      ['Accessibility', 'good', 'good (it\'s a button)', 'needs care (focus, footer, announcements)'],
      ['Typical use', 'admin tables, search results', 'catalogues, comments', 'social feeds, image galleries'],
    ],
    note: 'Whichever you choose, show the total or "no more results" so users know when they\'ve reached the end.',
  },

  quiz: [
    {
      id: 'search-pagination-q1',
      type: 'mcq',
      prompt: 'A user is on **page 4** of the results for "a" and changes the search to "ada". Why should the app go back to page 1?',
      options: [
        { text: 'Because the page number belonged to the old query; the new results may not even have a page 4.' },
        { text: 'Because Vue Router requires it.', why: 'This has nothing to do with the router — it\'s about what a page number means.' },
        { text: 'To reduce the number of requests.', why: 'Resetting the page doesn\'t reduce requests; it avoids showing a meaningless (often empty) page.' },
        { text: 'Because `watch` can only track one source at a time.', why: '`watch` can track an array of sources.' },
      ],
      answer: 0,
      explanation: '"Page 4" is a position *within* one result set. A different query is a different result set, so position 1 is the only sensible starting point.',
    },
    {
      id: 'search-pagination-q2',
      type: 'output',
      prompt: 'The search is debounced by **300 ms**. Keystrokes happen at **0 ms** ("a"), **100 ms** ("ab"), **200 ms** ("abc") and **600 ms** ("abcd"). How many requests are sent?',
      options: ['1', '2', '3', '4'],
      answer: 1,
      explanation: 'The first three keystrokes are within 300 ms of each other, so only the last one ("abc") fires, at 500 ms. The keystroke at 600 ms starts a new timer and fires "abcd" at 900 ms. Two requests.',
    },
    {
      id: 'search-pagination-q3',
      type: 'bug',
      prompt: 'With 23 results and 5 per page, the pager says "Page 1 of 4" and the last 3 people can never be reached. Click the buggy line.',
      code: {
        lang: 'js',
        code: `const perPage = 5
const total = ref(23)
const page = ref(1)

const pageCount = computed(() => Math.floor(total.value / perPage))
const hasNext = computed(() => page.value < pageCount.value)`,
      },
      answerLine: 5,
      explanation: '`Math.floor(23 / 5)` is 4. A partly filled last page still counts — use `Math.ceil` (and `Math.max(1, …)` for zero results).',
    },
    {
      id: 'search-pagination-q4',
      type: 'fill',
      prompt: 'Complete the pagination maths.',
      code: {
        lang: 'js',
        code: `const offset = (page.value - ___) * perPage          // rows to skip
const pageCount = Math.max(1, Math.___(total.value / perPage))`,
      },
      answer: [['1'], ['ceil']],
      explanation: 'Page 1 skips 0 rows, page 2 skips `perPage` rows, and so on. Page counts round **up**.',
    },
    {
      id: 'search-pagination-q5',
      type: 'mcq',
      prompt: 'A social feed gets new posts at the top every few seconds. Users click "Load more" to see older posts. Which pagination fits best?',
      options: [
        { text: 'Offset pagination (`?page=2`)', why: 'New posts shift everything down, so page 2 now contains posts the user already saw — duplicates.' },
        { text: 'Cursor pagination (`?after=<id of last post seen>`)' },
        { text: 'Load everything once and paginate with computed', why: 'A feed is unbounded; you can\'t load all of it.' },
        { text: 'No pagination — render all posts', why: 'That doesn\'t scale for data or for rendering.' },
      ],
      answer: 1,
      explanation: 'A cursor marks "continue after this item", which stays correct no matter how many items are inserted before it.',
    },
    {
      id: 'search-pagination-q6',
      type: 'short',
      prompt: 'When would you filter a list in the browser with `computed`, and when would you send the filters to the server?',
      answer: 'Filter in the browser when the whole dataset is small, already loaded and not sensitive — it\'s instant and needs no requests. Send filters to the server when the data is large, grows over time or contains things the user shouldn\'t download in full; the server returns one page plus a total. Mixing is possible, but sorting and filtering must happen wherever pagination happens.',
    },
  ],

  exercises: [
    {
      id: 'client-side-filter',
      title: 'Instant filtering in the browser',
      difficulty: 'beginner',
      prompt: `
The team list is small (8 people) and loaded once on mount, so filtering should happen **in the browser** — no extra requests.

Create a \`computed\` list that:

- keeps people whose **name contains** the \`.search\` text — case-insensitive, ignoring surrounding spaces;
- keeps only the chosen role when \`select.role\` isn't "All roles" (empty value);
- is **sorted by name A→Z**, without mutating the original array.

Render one \`li.user\` per visible person, a \`.count\` reading **"N of M people"** (visible of total), and a \`.empty\` message when the team has loaded but nothing matches. The tests also check that filtering sends **no** new requests (\`stats.requests\` in api.js stays at 1).
`,
      files: { 'App.vue': clientStarter, 'api.js': smallApi },
      hints: [
        'Start with `const visible = computed(() => team.value.filter(...))` and loop over `visible` in the template.',
        'Normalise once: `const needle = search.value.trim().toLowerCase()`, then compare with `p.name.toLowerCase().includes(needle)`. For the role: `!role.value || p.role === role.value`.',
        'Sort a copy: `.slice().sort((a, b) => a.name.localeCompare(b.name))`. Use `visible.length` and `team.length` in `.count`.',
      ],
      solution: {
        explanation: 'One computed chain derives exactly what to show from three inputs. Because computeds cache, typing re-runs the filter but unrelated re-renders don\'t. Sorting a copy keeps `team` untouched — computeds must not have side effects.',
        files: { 'App.vue': clientSolution, 'api.js': smallApi },
      },
      tests: [
        {
          name: 'search is case-insensitive and trims spaces',
          code: `await wait(300)
await type('.search', '  ADA ')
expect(findAll('.user').map((li) => li.textContent.trim())).toEqual(['Ada Lovelace'])`,
        },
        {
          name: 'the role filter and A→Z sorting work together',
          code: `await wait(300)
await select('.role', 'Designer')
expect(findAll('.user').map((li) => li.textContent.trim())).toEqual(['Hedy Lamarr', 'Susan Kare', 'Tim Berners-Lee'])
expect(text('.count')).toBe('3 of 8 people')`,
        },
        {
          name: 'no matches shows .empty and filtering sends no requests',
          code: `await wait(300)
await type('.search', 'zz')
expect(findAll('.user').length).toBe(0)
expect(exists('.empty')).toBe(true)
expect(requireModule('api.js').stats.requests).toBe(1)`,
        },
      ],
    },
    {
      id: 'load-more',
      title: 'A correct "Load more" button',
      difficulty: 'intermediate',
      prompt: `
This list uses server pagination with a **Load more** button (5 people per page, 23 in total). It has three bugs: clicking the button *replaces* the list instead of appending, the button never goes away, and a new search continues from the old page.

Fix it so that:

- clicking \`button.load-more\` **appends** the next page to the existing \`li.user\` items;
- \`button.load-more\` is **not rendered** once every match has been loaded;
- typing in \`.search\` starts again from **page 1** with a fresh list.
`,
      files: { 'App.vue': loadMoreStarter, 'api.js': searchApi },
      hints: [
        'Give `fetchPage` an option: `fetchPage({ append: true })` combines `[...items.value, ...res.items]`; otherwise it replaces.',
        'Add `const hasMore = computed(() => items.value.length < total.value)` and `v-if="hasMore"` on the button.',
        'In the `watch(q, …)` callback, set `page.value = 1` before calling `fetchPage()`.',
      ],
      solution: {
        explanation: 'A "Load more" list accumulates pages, so appending vs replacing depends on *why* you fetch: more of the same query → append; a new query → replace and restart at page 1. The server\'s `total` tells you when to stop.',
        files: { 'App.vue': loadMoreSolution, 'api.js': searchApi },
      },
      tests: [
        {
          name: 'Load more appends the next 5 people',
          code: `await wait(350)
expect(findAll('.user').length).toBe(5)
await click('.load-more')
await wait(350)
const names = findAll('.user').map((li) => li.textContent.trim())
expect(names.length).toBe(10)
expect(names[0]).toBe('Ada Lovelace')`,
        },
        {
          name: 'the button disappears when everything is loaded',
          code: `await wait(350)
for (let i = 0; i < 4; i++) {
  await click('.load-more')
  await wait(350)
}
expect(findAll('.user').length).toBe(23)
expect(exists('.load-more')).toBe(false)`,
        },
        {
          name: 'a new search starts a fresh list from page 1',
          code: `await wait(350)
await click('.load-more')
await wait(350)
await type('.search', 'an')
await wait(400)
const expected = await requireModule('api.js').searchUsers({ q: 'an', page: 1, perPage: 5 })
expect(findAll('.user').map((li) => li.textContent.trim())).toEqual(expected.items.map((u) => u.name))`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'search-pagination-client-vs-server',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Client-side vs server-side filtering and pagination: how do you choose?',
      answer: 'Client-side (load everything, filter/sort/page with computed) is instant and simple, but only works when the full dataset is small, bounded and safe for the user to download. Server-side (send q/filters/sort/page as query params, receive one page plus a total) scales to any size and keeps data the user shouldn\'t see on the server, at the cost of a request per change, loading states and race handling. Whatever paginates must also filter and sort.',
      explanation: 'The deciding factors are dataset size, growth and sensitivity — not personal preference.',
      whyAsked: 'A practical design decision that reveals whether you think about data volume, security and UX together.',
      mistakes: ['Filtering a paginated server response locally and calling it "search".', 'Ignoring that everything sent to the browser is readable.', 'Forgetting the total count needed for page numbers.'],
      followUps: ['What would you add to make server-side search feel fast?', 'Where would you put the debounce?', 'How do you keep the filters in the URL?'],
      modelAnswer: 'If the dataset is small, bounded and not sensitive — say a list of 50 settings — I load it once and filter, sort and paginate with computed; it\'s instant and has no loading states. As soon as the data is large, grows, or contains rows the user shouldn\'t have in full, I move it server-side: the query goes in URL params and the server returns one page and a total. The important rule is that filtering and sorting happen wherever pagination happens; sorting five rows of page one locally isn\'t sorting the list. Server-side then needs debouncing, loading states and stale-response protection.',
    },
    {
      id: 'search-pagination-debounce-throttle',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between debouncing and throttling? Which would you use for a search box, and which for a scroll handler?',
      answer: 'Debounce waits until events stop for N ms, then runs once with the latest value — ideal for a search box, where you want one request after the user pauses. Throttle runs at most once every N ms while events keep firing — ideal for scroll or resize handlers that need regular updates during the activity.',
      explanation: 'Debounce = "after the burst". Throttle = "steadily during the burst".',
      whyAsked: 'A classic performance question that shows you understand event frequency and user experience.',
      mistakes: ['Using the words interchangeably.', 'Debouncing scroll handlers (nothing happens until scrolling stops).', 'Forgetting to cancel pending timers on unmount.'],
      followUps: ['Implement a debounce.', 'What delay would you choose and why?', 'Does debouncing prevent race conditions?'],
      modelAnswer: 'Both limit how often a function runs during a burst of events. A debounce restarts a timer on every event and only runs when the events stop — perfect for a search box, because I want one request after the user pauses typing. A throttle lets the function run at most once per interval while events continue — better for scroll position or resize work that should update steadily. In Vue I\'d debounce the value feeding the search watcher and clean the timer up on unmount. Debouncing reduces requests but doesn\'t solve out-of-order responses.',
    },
    {
      id: 'search-pagination-offset-cursor',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Compare offset and cursor pagination. Which would you use for an admin orders table, and which for an activity feed? What does the frontend need from the API in each case?',
      answer: 'Offset pagination (`page`/`offset` + `limit`) lets users jump to any page and show "Page 3 of 9", so it suits admin tables; it can skip or duplicate rows when data changes between requests, and deep offsets can be slow. Cursor pagination returns an opaque cursor for "the next items after this one"; it stays consistent while items are inserted and is efficient, so it suits feeds and infinite scroll, but can\'t jump to page N. Frontend needs: for offset, the total count (and page size); for cursor, the next cursor and a `hasMore` flag.',
      explanation: 'Pick based on how users navigate (jump vs continue) and how fast the data changes.',
      whyAsked: 'Senior-level API design awareness; the frontend often influences the API contract.',
      mistakes: ['Thinking cursors are just page numbers with another name.', 'Ignoring duplicates/skips with offset on live data.', 'Building infinite scroll on offsets without de-duplicating.'],
      followUps: ['How would you de-duplicate items if you had to use offsets on a feed?', 'How do you restore scroll position when returning to a feed?', 'What would the URL look like for each?'],
      modelAnswer: 'With offset pagination the client asks for page N, which maps to skipping (N−1)×size rows. It\'s simple and lets users jump around, which is what an admin orders table needs, together with a total for "Page 3 of 9". Its weakness is live data: if rows are inserted while someone pages, items shift and you see duplicates or miss some. Cursor pagination asks for "the next items after this cursor", which stays consistent as new items arrive and is efficient for the database — ideal for a feed with Load more or infinite scroll, though you can\'t jump to page 37. So: offset with a total for the table, cursor plus `hasMore` for the feed.',
    },
    {
      id: 'search-pagination-page-reset',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'QA reports: "Go to page 3, search for \'ada\' → the list says No results, but Ada exists." The code is below. What\'s the bug and the fix?',
      code: {
        lang: 'js',
        code: `const q = ref('')
const page = ref(1)

watch([q, page], async () => {
  const res = await searchUsers({ q: q.value, page: page.value })
  items.value = res.items
  total.value = res.total
}, { immediate: true })`,
      },
      answer: 'The page number survives the new search. "ada" has one page of results, so asking for page 3 returns an empty list. Reset `page` to 1 whenever `q` (or any filter/sort) changes — e.g. `watch(q, () => { page.value = 1 })` — while the existing watcher handles loading.',
      explanation: 'Position within results is only meaningful for one query.',
      whyAsked: 'A very common real bug; tests whether you reason about state dependencies.',
      mistakes: ['Blaming the API.', 'Clearing the results but keeping the page.', 'Resetting the page inside the loading watcher in a way that triggers a second request with the stale page first.'],
      followUps: ['Where else should the page reset?', 'How would the fix look with filters in the URL?', 'How would you test this?'],
      modelAnswer: 'The query and the page are treated as independent, but the page depends on the query. After searching "ada" we still request page 3, which is empty, so the UI says no results. The fix is to reset the page to 1 whenever the search, a filter or the sort changes — a small watcher on those sources does it, and the existing watcher then loads page 1 once. I\'d add a test that goes to page 3, searches and expects page 1.',
    },
    {
      id: 'search-pagination-url-state',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Product wants filtered views to be shareable ("send me the link to all open orders from March, sorted by amount") and to survive a refresh. How do you implement it in a Vue app?',
      answer: 'Make the URL query the source of truth. Read filters from `route.query` (parsing strings to numbers/dates, applying defaults and validating), and when a control changes write it back with `router.replace({ query: { ...route.query, ...patch } })` — `replace` so typing doesn\'t fill the history; `push` for deliberate navigations like page changes if you want Back to step through them. Watch `route.query` (or computed values derived from it) to trigger the request. Drop empty values to keep URLs clean.',
      explanation: 'If the URL holds the state, refresh, back/forward and sharing come for free.',
      whyAsked: 'Shows routing knowledge and attention to real-world UX expectations.',
      mistakes: ['Storing filters only in component state or Pinia.', 'Using `push` on every keystroke.', 'Trusting query values without parsing/validation.'],
      followUps: ['How do you avoid a request loop between state and URL?', 'What about filters that aren\'t safe to put in a URL?', 'How would you test it?'],
      modelAnswer: 'I\'d make `route.query` the single source of truth. Computeds parse it into typed values with defaults — page as a number, dates validated — and a watcher on those triggers the search. Controls don\'t own state; they call a helper that does `router.replace` with the merged query, so a refresh, a shared link or the back button reproduce the same view. I use `replace` for typing to avoid a history entry per keystroke and keep empty values out of the URL. Anything sensitive stays out of the query string.',
    },
    {
      id: 'search-pagination-debounce-code',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `debounce(fn, ms)` in **debounce.js**. Calling the returned function repeatedly should run `fn` **once**, `ms` after the last call, with the **latest** arguments. Separate bursts run separately. The returned function also has a `cancel()` method that drops a pending call.',
      starter: {
        files: {
          'App.vue': debounceApp,
          'debounce.js': `// debounce.js
export function debounce(fn, ms) {
  return (...args) => {
    setTimeout(() => fn(...args), ms)
  }
}`,
        },
      },
      tests: [
        {
          name: 'a burst runs once with the latest arguments',
          code: `const { debounce } = requireModule('debounce.js')
const calls = []
const d = debounce((x) => calls.push(x), 50)
d(1); d(2); d(3)
expect(calls).toEqual([])
await wait(120)
expect(calls).toEqual([3])`,
        },
        {
          name: 'separate bursts run separately',
          code: `const { debounce } = requireModule('debounce.js')
const calls = []
const d = debounce((x) => calls.push(x), 50)
d('a')
await wait(120)
d('b')
await wait(120)
expect(calls).toEqual(['a', 'b'])`,
        },
        {
          name: 'cancel() drops the pending call',
          code: `const { debounce } = requireModule('debounce.js')
const calls = []
const d = debounce((x) => calls.push(x), 50)
d(1)
d.cancel()
await wait(120)
expect(calls).toEqual([])`,
        },
      ],
      hints: ['Keep the timer id in a variable outside the returned function (a closure).', 'On every call: `clearTimeout(timer)`, then start a new timer.', 'Attach `debounced.cancel = () => clearTimeout(timer)` before returning.'],
      answer: 'Store the pending timer in a closure; each call clears it and schedules a new one, so only the last call in a burst survives. `cancel` clears it.',
      solution: {
        files: {
          'App.vue': debounceApp,
          'debounce.js': `// debounce.js
export function debounce(fn, ms) {
  let timer = null
  function debounced(...args) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
    }, ms)
  }
  debounced.cancel = () => {
    clearTimeout(timer)
    timer = null
  }
  return debounced
}`,
        },
      },
      explanation: 'The closure gives every debounced function its own private `timer`. Clearing it on each call is the whole trick. `cancel` matters in components: call it in `onUnmounted` so a pending search can\'t fire after the component is gone.',
      whyAsked: 'A small, classic implementation that checks closures, timers and API design.',
      mistakes: ['Not clearing the previous timer (that\'s a delay, not a debounce).', 'Using the first call\'s arguments instead of the last.', 'A shared module-level timer, so two debounced functions interfere.'],
      followUps: ['Add a `leading` option that fires on the first call.', 'Implement throttle.', 'How would you use this inside a Vue component safely?'],
      modelAnswer: 'I keep a `timer` variable in a closure. Each call clears the existing timer and starts a new one with the latest arguments, so in a burst only the last call survives and runs after the quiet period. I preserve `this` with `apply` and expose `cancel` that clears the timer. In a component I\'d create it once in setup and call `cancel` in `onUnmounted`.',
    },
  ],

  takeaways: [
    'Search, filters, sort and page together form one query; re-fetch (or re-compute) when it changes.',
    'Filter in the browser only for small, loaded, non-sensitive data; otherwise let the server filter, sort, paginate and return a total.',
    'Debounce text input so a burst of typing sends one request; keep selects and buttons instant.',
    'Reset to page 1 when the query changes; compute `pageCount` with `Math.ceil` and show "Showing x–y of z".',
    'Offset pagination supports page numbers; cursor pagination stays stable for live feeds.',
    'Keep shareable filters in the URL with `router.replace`, and parse query strings carefully.',
  ],
}
