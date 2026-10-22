// Lesson: Testing async code, APIs & routing.
// Vitest / Vue Test Utils / MSW code is shown as static blocks. Runnable checks use the
// platform's teaching harness against a small routed app with a pretend API (api.js).

const apiFile = `// api.js — a pretend user API (simplified: in memory, no network).
// \`server\` plays the role a mock server (like MSW) plays in real tests:
// tests flip it to force failures.
export const server = { failNext: false, delay: 200 }

const USERS = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Grace Hopper' },
  { id: 3, name: 'Alan Turing' },
]

function respond(make) {
  const fail = server.failNext
  server.failNext = false
  return new Promise((resolve, reject) => {
    setTimeout(() => (fail ? reject(new Error('Server error (500)')) : resolve(make())), server.delay)
  })
}

export const getUsers = () => respond(() => USERS.map((u) => ({ ...u })))
export const getUser = (id) => respond(() => ({ ...USERS.find((u) => u.id === Number(id)) }))`

const authFile = `// auth.js — who is signed in (simplified: in memory).
import { reactive } from 'vue'

export const auth = reactive({ loggedIn: false })`

const routerFile = `// router.js
import { createRouter, createMemoryHistory } from 'vue-router'
import { auth } from './auth.js'
import UsersPage from './UsersPage.vue'
import UserPage from './UserPage.vue'

const AdminPage = { template: '<h2 class="admin">Admin area</h2>' }
const LoginPage = { template: '<h2 class="login">Please sign in</h2>' }

export const router = createRouter({
  history: createMemoryHistory(), // real apps: createWebHistory()
  routes: [
    { path: '/', component: UsersPage },
    { path: '/users/:id', component: UserPage },
    { path: '/admin', component: AdminPage, meta: { requiresAuth: true } },
    { path: '/login', component: LoginPage },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.loggedIn) {
    return { path: '/login' }
  }
})`

const mainFile = `// main.js
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'

createApp(App).use(router).mount('#app')`

const appFile = `<template>
  <nav>
    <RouterLink to="/" class="nav-users">People</RouterLink> ·
    <RouterLink to="/admin" class="nav-admin">Admin</RouterLink>
  </nav>
  <RouterView />
</template>`

const usersPage = `<script setup>
import { ref, onMounted } from 'vue'
import { getUsers } from './api.js'

const users = ref([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    users.value = await getUsers()
  } catch (e) {
    console.error(e) // nobody sees this…
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <h2>People</h2>
  <button class="reload" @click="load">Reload</button>
  <p v-if="loading" class="loading">Loading…</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id">
      <RouterLink :to="'/users/' + user.id" class="user-link">{{ user.name }}</RouterLink>
    </li>
  </ul>
</template>`

const userPage = `<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getUser } from './api.js'

const route = useRoute()
const user = ref(null)
const nextId = computed(() => (Number(route.params.id) % 3) + 1)

async function load() {
  user.value = null
  user.value = await getUser(route.params.id)
}

onMounted(load)
</script>

<template>
  <p v-if="!user" class="loading">Loading…</p>
  <h2 v-else class="user-name">{{ user.name }}</h2>
  <RouterLink :to="'/users/' + nextId" class="next-user">Next person →</RouterLink>
</template>`

const finishedUsersPage = `<script setup>
import { ref, onMounted } from 'vue'
import { getUsers } from './api.js'

const users = ref([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    users.value = await getUsers()
  } catch (e) {
    error.value = 'Could not load people. ' + e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <h2>People</h2>
  <button class="reload" @click="load">Reload</button>
  <p v-if="loading" class="loading">Loading…</p>
  <p v-else-if="error" class="error" role="alert">{{ error }}</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id">
      <RouterLink :to="'/users/' + user.id" class="user-link">{{ user.name }}</RouterLink>
    </li>
  </ul>
</template>`

const finishedUserPage = `<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getUser } from './api.js'

const route = useRoute()
const user = ref(null)
const nextId = computed(() => (Number(route.params.id) % 3) + 1)

// The same component instance is reused for /users/1 → /users/2,
// so react to the param instead of loading only on mount.
watch(
  () => route.params.id,
  async (id) => {
    user.value = null
    user.value = await getUser(id)
  },
  { immediate: true },
)
</script>

<template>
  <p v-if="!user" class="loading">Loading…</p>
  <h2 v-else class="user-name">{{ user.name }}</h2>
  <RouterLink :to="'/users/' + nextId" class="next-user">Next person →</RouterLink>
</template>`

const finishedRouter = routerFile.replace("return { path: '/login' }", "return { path: '/login', query: { redirect: to.fullPath } }")

const injectApi = `// api.js — the real (pretend) API module.
export function getUsers() {
  return new Promise((resolve) => {
    setTimeout(() => resolve([{ id: 1, name: 'Ada Lovelace' }, { id: 2, name: 'Grace Hopper' }]), 200)
  })
}`

const injectStarter = `// useUsers.js
import { ref } from 'vue'
import { getUsers } from './api.js'

// TODO: accept the API as a parameter so tests can pass a fake one
export function useUsers() {
  const users = ref([])
  const status = ref('idle')
  const error = ref('')

  async function load() {
    status.value = 'loading'
    users.value = await getUsers()
    status.value = 'success'
  }

  return { users, status, error, load }
}`

const injectSolution = `// useUsers.js
import { ref } from 'vue'
import * as realApi from './api.js'

// The dependency comes in as a parameter, with the real API as the default.
export function useUsers(api = realApi) {
  const users = ref([])
  const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
  const error = ref('')

  async function load() {
    status.value = 'loading'
    error.value = ''
    try {
      users.value = await api.getUsers()
      status.value = 'success'
    } catch (e) {
      error.value = e.message
      status.value = 'error'
    }
  }

  return { users, status, error, load }
}`

const injectApp = `<script setup>
import { onMounted } from 'vue'
import { useUsers } from './useUsers.js'

const { users, status, error, load } = useUsers()
onMounted(load)
</script>

<template>
  <p v-if="status === 'loading'" class="loading">Loading…</p>
  <p v-else-if="status === 'error'" class="error">{{ error }}</p>
  <ul v-else>
    <li v-for="user in users" :key="user.id" class="user">{{ user.name }}</li>
  </ul>
</template>`

const guardRouterStarter = `// router.js
import { createRouter, createMemoryHistory } from 'vue-router'
import { auth } from './auth.js'

const Home = { template: '<h2 class="home">Home</h2>' }
const Admin = { template: '<h2 class="admin">Admin</h2>' }
const Login = { template: '<h2 class="login">Login</h2>' }

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/admin', component: Admin, meta: { requiresAuth: true } },
    { path: '/login', component: Login },
  ],
})

// The rules are buried in here, so they can only be tested by driving the router.
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.loggedIn) return '/login'
})`

const guardRouterSolution = `// router.js
import { createRouter, createMemoryHistory } from 'vue-router'
import { auth } from './auth.js'
import { authGuard } from './guards.js'

const Home = { template: '<h2 class="home">Home</h2>' }
const Admin = { template: '<h2 class="admin">Admin</h2>' }
const Login = { template: '<h2 class="login">Login</h2>' }

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/admin', component: Admin, meta: { requiresAuth: true } },
    { path: '/login', component: Login },
  ],
})

router.beforeEach((to) => authGuard(to, auth))`

const guardAppFile = `<template>
  <RouterView />
</template>`

const guardsStarter = `// guards.js
// TODO: return true to allow the navigation, or a location object to redirect.
export function authGuard(to, auth) {
  return true
}`

const guardsSolution = `// guards.js — a pure function: (target route, auth state) → decision.
export function authGuard(to, auth) {
  if (to.meta && to.meta.requiresAuth && !auth.loggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && auth.loggedIn) {
    return to.query && to.query.redirect ? to.query.redirect : '/'
  }
  return true
}`

const deferredApp = `<script setup>
import { ref } from 'vue'
import { createDeferred } from './deferred.js'

const status = ref('idle')
let pending = null

function start() {
  pending = createDeferred()
  status.value = 'waiting'
  pending.promise.then(() => (status.value = 'done'), () => (status.value = 'failed'))
}
</script>

<template>
  <button class="start" @click="start">Start</button>
  <button class="finish" @click="pending && pending.resolve()">Resolve</button>
  <button class="fail" @click="pending && pending.reject(new Error('nope'))">Reject</button>
  <p class="status">{{ status }}</p>
</template>`

export default {
  id: 'testing-async-routing',
  title: 'Testing async code, APIs & routing',
  summary: 'Test components that load data and navigate: wait for promises properly, mock the API at the right level, control timing, and test routes and guards.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['component-testing', 'testing-logic', 'async-ui-states', 'navigation-guards'],
  related: ['testing-fundamentals', 'e2e-and-quality', 'router-in-practice', 'cancellation-race-conditions', 'fetching-data', 'composable-design'],
  tags: ['testing', 'vitest', 'vue test utils', 'flushPromises', 'nextTick', 'vi.mock', 'vi.fn', 'MSW', 'mocking', 'fake timers', 'vue router', 'navigation guards'],
  apis: [
    { name: 'flushPromises()', summary: 'Vue Test Utils: resolves after pending promise callbacks have run — use it after triggering async work.' },
    { name: 'vi.mock(path, factory)', summary: 'Vitest: replace a module for the whole test file (hoisted to the top).' },
    { name: 'vi.fn().mockResolvedValue(v)', summary: 'Vitest: a mock function returning a promise that resolves to `v` (`mockRejectedValue` for failures).' },
    { name: 'createMemoryHistory()', summary: 'Vue Router: an in-memory history — the standard choice for tests.' },
    { name: 'router.isReady()', summary: 'Vue Router: resolves when the initial navigation has completed.' },
    { name: 'vi.useFakeTimers()', summary: 'Vitest: replace setTimeout/setInterval/Date with controllable fakes.' },
  ],
  docs: [
    { label: 'Vue Test Utils — Asynchronous behavior', url: 'https://test-utils.vuejs.org/guide/advanced/async-suspense' },
    { label: 'Vue Test Utils — Making HTTP requests', url: 'https://test-utils.vuejs.org/guide/advanced/http-requests' },
    { label: 'Vue Test Utils — Testing Vue Router', url: 'https://test-utils.vuejs.org/guide/advanced/vue-router' },
    { label: 'Vitest — Mocking', url: 'https://vitest.dev/guide/mocking' },
    { label: 'Vue Guide — Testing', url: 'https://vuejs.org/guide/scaling-up/testing.html' },
  ],

  intro: `
Most real components don't just render props. They **load data** when they appear, **wait**, show a spinner, maybe an error, and **navigate** when you click. Testing them raises three new questions:

1. **When do I assert?** The data arrives *later*. Assert too early and the test sees the spinner; wait with a fixed \`sleep\` and the test becomes slow and flaky.
2. **What do I do about the network?** Real requests make tests slow and unreliable, so you replace the API with a **mock** — a stand-in you control.
3. **How do I test routing?** Components read the current route and links change it; guards decide who may go where.

This lesson answers all three with Vitest and Vue Test Utils (shown as static code), and lets you practise the ideas on a small routed app in the playground.
`,

  why: `
Async code is where most UI bugs hide: a spinner that never stops, an error that's swallowed, a page that doesn't reload when the URL changes, a guard that forgets where the user wanted to go. These are exactly the things you can't see by testing pure functions.

They're also where badly written tests hurt the most:

- tests that hit a real API fail whenever the network or test data changes;
- tests that \`await sleep(1000)\` are slow — and still flaky on a busy CI machine;
- tests that mock *everything* pass while the real app is broken.

The goal is tests that are **deterministic** (same result every run), **fast**, and still **realistic** enough to catch real bugs. That comes down to three skills: waiting precisely, mocking at the right boundary, and using a real router in memory.
`,

  eli15: `
Imagine testing a vending machine that takes a few seconds to drop your snack.

- If you check the tray **immediately** after pressing the button, it's empty — your test says "broken", but it just wasn't finished.
- If you always wait **ten seconds**, testing a hundred snacks takes forever.
- The smart way: wait for the "clunk" — the moment the machine says it's done. In tests, that's \`await flushPromises()\`.

And you don't want to call the real snack factory every time you test the buttons. So you put a **pretend factory** behind the machine — one that you control: "this time, pretend you're out of crisps". That's a **mock**.
`,

  analogy: {
    title: 'A flight simulator',
    body: `
Pilots don't practise engine failures on real planes. They use a **simulator**: the cockpit is real, the instruments are real, but the outside world — weather, engines, other planes — is controlled by an instructor who can say "now the left engine fails" at exactly the right moment.

A good async test is a simulator. Your component (the cockpit) is real. The API is replaced by something you control (the instructor's console), so you can make it slow, make it fail, or make it answer instantly — and **pause time** to look at the instruments mid-flight (the loading state).

Simulate too little and practice is dangerous (real network, flaky). Simulate too much — a cardboard cockpit — and you learn nothing (everything mocked, nothing real tested).
`,
    mapping: [
      ['the real cockpit', 'the component under test, mounted for real'],
      ['the instructor\'s console', 'mocked API: `vi.fn()`, `vi.mock()`, MSW handlers'],
      ['"now the engine fails"', '`mockRejectedValueOnce(new Error(...))`'],
      ['pausing mid-flight', 'a deferred promise you resolve when *you* choose'],
      ['waiting for the plane to settle', '`await flushPromises()`'],
      ['a cardboard cockpit', 'mocking so much that nothing real is tested'],
    ],
  },

  visual: {
    type: 'event-loop',
    props: { preset: 'promises' },
    title: 'Why nextTick isn\'t enough after an API call',
    caption: 'A click handler that awaits an API resolves in several promise steps. `nextTick` waits for Vue\'s next render; `flushPromises` waits until pending promise callbacks have run.',
    alt: 'An event-loop stepper with call stack, microtask queue and task queue. Promise callbacks are queued as microtasks and run one after another once the stack is empty; a later task (like setTimeout) runs only after all microtasks finished.',
  },

  syntax: [
    `
#### Waiting: \`nextTick\` vs \`flushPromises\`

- \`await nextTick()\` (or awaiting \`trigger\` / \`setValue\`) waits for Vue to re-render after a **synchronous** state change.
- \`await flushPromises()\` from Vue Test Utils waits until **pending promise callbacks** have run — what you need after the component awaited a (mocked) API call.
`,
    {
      code: `import { mount, flushPromises } from '@vue/test-utils'
import { vi, test, expect } from 'vitest'
import UsersPage from './UsersPage.vue'
import { getUsers } from './api.js'

vi.mock('./api.js', () => ({ getUsers: vi.fn() })) // hoisted: runs before the imports

test('shows the people returned by the API', async () => {
  vi.mocked(getUsers).mockResolvedValue([{ id: 1, name: 'Ada Lovelace' }])

  const wrapper = mount(UsersPage)
  expect(wrapper.find('.loading').exists()).toBe(true)   // before the promise settles

  await flushPromises()                                   // let the mocked request resolve
  expect(wrapper.text()).toContain('Ada Lovelace')
  expect(getUsers).toHaveBeenCalledTimes(1)
})

test('shows an error when the API fails', async () => {
  vi.mocked(getUsers).mockRejectedValue(new Error('Server error (500)'))
  const wrapper = mount(UsersPage)
  await flushPromises()
  expect(wrapper.find('[role="alert"]').text()).toContain('Could not load people')
})`,
      lang: 'js',
      title: 'UsersPage.test.js — mocking the API module',
      static: true,
    },
    `
Remember to reset mocks between tests — \`vi.clearAllMocks()\` / \`vi.resetAllMocks()\` in \`beforeEach\`, or the \`clearMocks\` / \`restoreMocks\` options in your Vitest config — so one test's setup can't leak into the next.

#### Three ways to fake the API

1. **\`vi.mock\` the module** — quick and common. Your test is coupled to *which module and function* the component imports.
2. **Dependency injection** — pass the API into the composable (\`useUsers(api)\`) or \`provide\` it. Tests hand in a fake object; no module magic needed.
3. **Mock the network** with MSW (Mock Service Worker) — intercepts \`fetch\` requests, so your real API module, URLs and JSON parsing all run. Most realistic; a bit more setup.
`,
    {
      code: `// test/setup.js — MSW v2 in Node (static example)
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const server = setupServer(
  http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Ada Lovelace' }])),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())   // undo per-test overrides
afterAll(() => server.close())

// in a test: make just this request fail
server.use(http.get('/api/users', () => new HttpResponse(null, { status: 500 })))`,
      lang: 'js',
      title: 'mocking at the network level with MSW',
      static: true,
    },
    `
#### Testing the loading state on purpose

Resolved mocks finish almost immediately, which makes the loading state hard to catch. A **deferred** promise lets *you* decide when the request finishes:
`,
    {
      code: `function createDeferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

test('shows a spinner until the data arrives', async () => {
  const request = createDeferred()
  vi.mocked(getUsers).mockReturnValue(request.promise)

  const wrapper = mount(UsersPage)
  await nextTick()
  expect(wrapper.find('.loading').exists()).toBe(true)  // frozen mid-request

  request.resolve([{ id: 1, name: 'Ada Lovelace' }])
  await flushPromises()
  expect(wrapper.find('.loading').exists()).toBe(false)
})`,
      lang: 'js',
      title: 'a deferred promise',
      static: true,
    },
    `
Newer JavaScript runtimes also offer \`Promise.withResolvers()\`, which returns the same \`{ promise, resolve, reject }\` trio.

#### Timers: don't sleep, control time

For code with \`setTimeout\` (debounce, polling, delayed spinners), use fake timers instead of real waiting — \`vi.useFakeTimers()\`, then \`await vi.advanceTimersByTimeAsync(300)\`, and \`vi.useRealTimers()\` afterwards. (See [testing debounced watchers](lesson:testing-logic) for a full example.)

#### Testing with Vue Router

Use a **real router with memory history** — the closest thing to the app, without a browser URL:
`,
    {
      code: `import { createRouter, createMemoryHistory } from 'vue-router'
import { routes } from '@/router/routes.js'

async function mountAt(path) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  router.push(path)
  await router.isReady()                       // wait for the initial navigation
  const wrapper = mount(App, { global: { plugins: [router] } })
  return { wrapper, router }
}

test('navigating between users reloads the profile', async () => {
  vi.mocked(getUser).mockImplementation(async (id) => ({ id, name: 'User ' + id }))
  const { wrapper, router } = await mountAt('/users/1')
  await flushPromises()
  expect(wrapper.text()).toContain('User 1')

  await router.push('/users/2')                // same component, new param
  await flushPromises()
  expect(wrapper.text()).toContain('User 2')
})`,
      lang: 'js',
      title: 'a real router in tests',
      static: true,
    },
    `
Create a **new router per test** so navigation state doesn't leak. For a component that only *renders* links, you can stub them instead: \`mount(Nav, { global: { stubs: { RouterLink: RouterLinkStub } } })\` (\`RouterLinkStub\` comes from Vue Test Utils) and assert on its \`to\` prop.

Guards are easiest to test when their logic is a **plain function** — \`authGuard(to, auth)\` returning \`true\` or a redirect location — that the router calls. Then most cases are one-line unit tests, plus one integration test that the router really uses it.
`,
    {
      callout: 'note',
      title: 'On this platform: the harness',
      text: 'The sandbox can\'t run Vitest, Vue Test Utils or MSW. The playground checks use this platform\'s teaching harness instead: `await wait(ms)` / `await flush()` stand in for `flushPromises()` (the pretend API uses real short timers); `requireModule(\'api.js\').server.failNext = true` stands in for `mockRejectedValueOnce` or an MSW override; `vm.$router.push()` drives the app\'s real in-memory router; `withSetup(() => useUsers(fakeApi))` runs a composable with an injected fake. It\'s a teaching harness — real projects use the static examples above.',
    },
  ],

  walkthrough: {
    title: 'UserPage.vue — the route-param fix',
    lang: 'vue',
    code: finishedUserPage,
    intro: 'The playground\'s profile page after the second experiment. It\'s also a lesson in what tests catch: a test that navigates from one user to another fails on the original code.',
    steps: [
      { lines: [3, 4], text: '`useRoute()` (Vue Router) gives a reactive view of the current route, including `params`.' },
      { lines: [6, 8], text: 'Local state for the loaded user, plus a computed id for the "Next person" link.' },
      { lines: [10, 11], text: 'Vue Router **reuses** the component when only the param changes (`/users/1` → `/users/2`), so `onMounted` would run once and never again. That\'s the bug a navigation test exposes.' },
      { lines: [12, 19], text: 'Watching `route.params.id` with `immediate: true` loads on first render *and* on every param change. (Real code would also cancel the previous request — see [race conditions](lesson:cancellation-race-conditions).)' },
      { lines: [22, 26], text: 'Stable classes (`user-name`, `next-user`) give tests something reliable to find and click.' },
    ],
  },

  playground: {
    title: 'People directory with routes',
    objective: 'Fix the bugs a good async + routing test suite would catch: a swallowed API error, a page that ignores param changes, and a guard that forgets where you were going.',
    files: { 'main.js': mainFile, 'App.vue': appFile, 'router.js': routerFile, 'UsersPage.vue': usersPage, 'UserPage.vue': userPage, 'api.js': apiFile, 'auth.js': authFile },
    expected: 'A list of three people loads after a moment. Click one to open their page, then **Next person →** — the URL changes but the name doesn\'t. **Admin** sends you to the sign-in page (and forgets you wanted Admin).',
    experiments: [
      {
        id: 'error-state',
        task: '`UsersPage.vue` swallows API errors with `console.error`, so a failed reload just shows an empty list. Show an element with `class="error"` (and `role="alert"`) when loading fails.',
        hint: 'Add `const error = ref(\'\')`, clear it at the start of `load()`, set it in the `catch`, and add `<p v-else-if="error" class="error" role="alert">{{ error }}</p>` before the list.',
        tests: [
          {
            name: 'a failed reload shows .error',
            code: `await wait(300)
requireModule('api.js').server.failNext = true
await click('.reload')
await wait(300)
expect(exists('.error')).toBe(true)`,
          },
        ],
        explain: 'The test controls the "server" (like `mockRejectedValueOnce` or an MSW override would), triggers the action, waits for the promise to settle, then asserts on what the user sees. Untested error paths are the ones that silently break.',
      },
      {
        id: 'param-change',
        task: 'Open a person, then click **Next person →**: the URL changes, the name doesn\'t. In `UserPage.vue`, load the user whenever `route.params.id` changes, not just on mount.',
        hint: 'Replace `onMounted(load)` with `watch(() => route.params.id, load, { immediate: true })` (import `watch`; `load` can read `route.params.id` itself).',
        tests: [
          {
            name: 'navigating to the next person loads them',
            code: `await vm.$router.push('/users/1')
await wait(300)
expect(text('.user-name')).toBe('Ada Lovelace')
await click('.next-user')
await wait(300)
expect(text('.user-name')).toBe('Grace Hopper')`,
          },
        ],
        explain: 'A test that only mounts `/users/1` would pass. The bug appears only when the route changes *while the component stays mounted* — so good router tests navigate, not just mount.',
      },
      {
        id: 'guard-redirect',
        task: 'Visiting **Admin** while signed out redirects to `/login`, but the app forgets where you were going. In `router.js`, redirect to `/login` with the original destination in the query: `?redirect=/admin`.',
        hint: '`return { path: \'/login\', query: { redirect: to.fullPath } }` inside the guard.',
        tests: [
          {
            name: 'the guard redirects to /login?redirect=/admin',
            code: `await vm.$router.push('/admin')
await wait(50)
expect(vm.$route.path).toBe('/login')
expect(vm.$route.query.redirect).toBe('/admin')`,
          },
        ],
        explain: 'Router tests can assert on the resulting route (`router.currentRoute.value` in Vitest, `vm.$route` here) — no DOM needed. Better still, extract the guard\'s decision into a pure function and unit-test every case (Exercise 2).',
      },
      {
        id: 'map-the-harness',
        task: 'Read the static `UsersPage.test.js` in the **Syntax** section, then look back at the test of the first experiment. Match each line: which harness call plays the role of `vi.mocked(getUsers).mockRejectedValue(…)`, which one of `mount`, and which one of `await flushPromises()`?',
        hint: '`server.failNext = true` ↔ the rejected mock; `main.js` mounting the app ↔ `mount`; `await wait(300)` ↔ `flushPromises` (the pretend API uses a real 200 ms timer).',
        explain: 'The ideas are identical; only the tools differ. In real Vitest tests the mock resolves instantly, so `flushPromises()` is enough and no real time passes — which is exactly why mocked tests are fast.',
      },
    ],
    variants: [
      {
        id: 'finished',
        label: 'Finished version (all three fixes)',
        files: { 'main.js': mainFile, 'App.vue': appFile, 'router.js': finishedRouter, 'UsersPage.vue': finishedUsersPage, 'UserPage.vue': finishedUserPage, 'api.js': apiFile, 'auth.js': authFile },
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'Controlling time in a test',
    caption: 'A deterministic async test never guesses how long something takes. It holds the request open, checks the loading state, releases it, waits for promises, and checks the result.',
    alt: 'A five-step flow. Arrange: a mock returns a deferred promise. Act: mount the component. Assert: the loading spinner is visible while the promise is pending. Resolve: the test resolves the deferred promise with data. flushPromises: pending promise callbacks run and Vue re-renders. Assert: the data is visible and the spinner is gone.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'arrange', label: 'mock → deferred', note: 'request stays pending', tone: 'kraft' },
        { id: 'mount', label: 'mount()', note: 'component starts loading', tone: 'paper' },
        { id: 'loading', label: 'assert spinner', note: 'frozen mid-request', tone: 'cobalt' },
        { id: 'resolve', label: 'resolve(data)', note: 'you choose when', tone: 'kraft' },
        { id: 'flush', label: 'await flushPromises()', note: 'callbacks run, Vue renders', tone: 'ink' },
        { id: 'done', label: 'assert data', note: 'spinner gone', tone: 'acid' },
      ],
      edges: [
        { from: 'arrange', to: 'mount' },
        { from: 'mount', to: 'loading' },
        { from: 'loading', to: 'resolve' },
        { from: 'resolve', to: 'flush' },
        { from: 'flush', to: 'done' },
      ],
      steps: [
        { focus: ['arrange'], text: 'The mocked API returns a promise *you* control. Nothing resolves until you say so.' },
        { focus: ['mount', 'loading'], edges: ['arrange->mount', 'mount->loading'], text: 'Mount the component. After a `nextTick`, the loading state is on screen — and it stays there, so the assertion can\'t be flaky.' },
        { focus: ['resolve'], edges: ['loading->resolve'], text: 'Resolve the request with test data (or reject it to test the error path).' },
        { focus: ['flush'], edges: ['resolve->flush'], text: '`flushPromises()` lets the component\'s `await` continue and Vue re-render. No `sleep`, no guessing.' },
        { focus: ['done'], edges: ['flush->done'], text: 'Assert on what the user would see. The whole test runs in milliseconds and gives the same result every time.' },
      ],
    },
  },

  internals: {
    beginner: `
When a component loads data, the test and the component are running "at the same time" in one JavaScript thread. The test must give the component chances to continue: every \`await\` in the test hands control back to the event loop, where the component's pending promises can finish and Vue can re-render. \`flushPromises()\` is a convenient "let everything that's ready finish now".
`,
    technical: [
      `
**What flushPromises does.** Vue Test Utils implements it by scheduling a **macrotask** (via \`setTimeout\`/\`setImmediate\`-style scheduling) and resolving when it runs. Because the microtask queue is always drained before the next macrotask, every promise callback that was *already ready* — including chains several \`then\`s deep, and Vue's own render flush, which is also a microtask — has run by then. It does **not** wait for real timers or network requests that haven't completed; that's why tests mock the API with already-resolved promises, or use fake timers.

**Why \`await trigger()\` is not enough.** \`trigger\` returns \`nextTick()\`, which only waits for the render caused by synchronous state changes. A click handler like \`async () => { loading.value = true; users.value = await getUsers() }\` re-renders once for \`loading\` (caught by \`nextTick\`) and again only after the API promise resolves (needs \`flushPromises\`).

**How \`vi.mock\` works.** Vitest hoists \`vi.mock(path, factory)\` calls above the imports in the test file, and its module system returns the factory's object to *every* importer of that path — including the component. That's powerful but couples tests to file structure: move \`getUsers\` to another module and the mock silently stops applying.
`,
      {
        code: `// Why the param-change bug hides from mount-only tests
//   mount at /users/1          → setup runs, onMounted → load(1) ✓
//   router.push('/users/2')    → SAME instance reused, setup does NOT re-run,
//                                onMounted does NOT fire → still user 1 ✗
// Only a test that navigates while mounted sees it.`,
        lang: 'js',
        title: 'component reuse in Vue Router',
      },
      `
**Router in tests.** \`app.use(router)\` (or \`global.plugins: [router]\`) starts the initial navigation; with memory history you choose the starting location yourself via \`router.push()\` and wait with \`await router.isReady()\`. Navigations are async — they run guards and may resolve lazy route components — so \`await router.push(...)\` and then \`flushPromises()\` before asserting on the DOM. A fresh router per test avoids state leaking between tests.
`,
    ],
    production: `
- **Default to realistic mocks at the boundary.** MSW (network level) or dependency injection keeps your real API code under test; \`vi.mock\` is fine for quick unit tests but mocks only what you tell it to.
- **Test every async state**: loading (with a deferred), success, empty, and error — the error path is the most often broken.
- **Never \`sleep\`.** Use \`flushPromises\`, fake timers, or test helpers that wait for a condition. Arbitrary waits are the top cause of flaky suites.
- **Reset everything between tests**: mocks (\`clearMocks\`/\`restoreMocks\` config), MSW handlers (\`resetHandlers\`), routers (new instance), stores (new Pinia), fake timers (\`useRealTimers\`).
- **Routing:** a real router with memory history for integration tests; pure guard functions for exhaustive unit tests; stubs only for components that merely render links.
- **Keep a few end-to-end tests** for critical flows through the real backend or a staging environment — mocks can drift from the real API ([E2E tests](lesson:e2e-and-quality)).
`,
  },

  mistakes: [
    {
      title: 'Asserting before the promise settles',
      wrong: { code: `const wrapper = mount(UsersPage)\nexpect(wrapper.text()).toContain('Ada') // still "Loading…"`, lang: 'js' },
      right: { code: `const wrapper = mount(UsersPage)\nawait flushPromises()\nexpect(wrapper.text()).toContain('Ada')`, lang: 'js' },
      explanation: 'The component\'s `await` hasn\'t continued yet. Give it a chance with `flushPromises()`.',
    },
    {
      title: 'Sleeping instead of waiting precisely',
      wrong: { code: `await new Promise((r) => setTimeout(r, 1000)) // slow, and still flaky on a busy CI`, lang: 'js' },
      right: { code: `await flushPromises()            // for mocked promises\nawait vi.advanceTimersByTimeAsync(300) // for timers, with vi.useFakeTimers()`, lang: 'js' },
      explanation: 'Fixed sleeps make every run slower and fail whenever the machine is slower than you guessed.',
    },
    {
      title: 'Hitting the real API in unit/component tests',
      wrong: { code: `test('lists users', async () => {\n  const wrapper = mount(UsersPage) // calls the real backend\n  await new Promise((r) => setTimeout(r, 2000))\n})`, lang: 'js' },
      right: { code: `vi.mock('./api.js', () => ({ getUsers: vi.fn().mockResolvedValue([{ id: 1, name: 'Ada' }]) }))`, lang: 'js' },
      explanation: 'Real requests are slow, depend on data you don\'t control and fail when the network does. Mock at the boundary; keep real-backend checks for a few E2E tests.',
    },
    {
      title: 'Letting mocks leak between tests',
      wrong: { code: `test('error', () => { getUsers.mockRejectedValue(new Error('x')) /* … */ })\ntest('success', () => { /* still rejecting! */ })`, lang: 'js' },
      right: { code: `beforeEach(() => vi.resetAllMocks())\n// or in vitest config: test: { mockReset: true }`, lang: 'js' },
      explanation: 'Mock implementations persist across tests in the same file unless reset. Tests then pass or fail depending on order.',
    },
    {
      title: 'Not awaiting the router',
      wrong: { code: `router.push('/users/7')\nconst wrapper = mount(App, { global: { plugins: [router] } })\nexpect(wrapper.text()).toContain('User 7') // navigation not finished`, lang: 'js' },
      right: { code: `router.push('/users/7')\nawait router.isReady()\nconst wrapper = mount(App, { global: { plugins: [router] } })\nawait flushPromises()`, lang: 'js' },
      explanation: 'Navigation is asynchronous (guards, lazy components). Wait for it before asserting.',
    },
  ],

  debugging: [
    {
      symptom: 'The test sees "Loading…" even though the mock resolves immediately.',
      cause: 'The assertion runs before the component\'s promise callbacks; `await trigger()`/`nextTick()` alone doesn\'t wait for them.',
      fix: 'Add `await flushPromises()` after the action that starts the request.',
    },
    {
      symptom: 'A test passes alone (`it.only`) but fails in the full run.',
      cause: 'State leaks: a mock implementation, an MSW override, a shared router or store, or fake timers left on by an earlier test.',
      fix: 'Reset mocks (`mockReset`/`restoreMocks`), call `server.resetHandlers()`, create routers/stores per test, and `vi.useRealTimers()` in `afterEach`.',
    },
    {
      symptom: 'The mocked function is never called; the real one runs.',
      cause: 'The `vi.mock` path doesn\'t match the module the component imports (different path or alias), or the function lives in another module now.',
      fix: 'Mock the exact module the component imports, or switch to dependency injection / MSW so the test doesn\'t depend on file layout.',
    },
    {
      symptom: '`[Vue warn]: injection "Symbol(router)" not found` or `Failed to resolve component: RouterLink`.',
      cause: 'The component uses the router but the test mounted it without one.',
      fix: 'Install a memory-history router via `global.plugins`, or stub `RouterLink`/`RouterView` when routing isn\'t under test.',
    },
    {
      symptom: 'A test with fake timers hangs or never resolves.',
      cause: 'Code awaits a timer that never advances, or `flushPromises` (which schedules its own timer) is used while timers are faked.',
      fix: 'Advance time with `await vi.advanceTimersByTimeAsync(ms)` / `vi.runAllTimersAsync()`, and restore real timers after the test.',
    },
  ],

  bestPractices: [
    'Await precisely: `flushPromises()` after async actions, fake timers for `setTimeout` — never fixed sleeps.',
    'Mock at a boundary you own: network (MSW) or injected dependencies; use `vi.mock` deliberately.',
    'Test loading, success, empty and error states; use deferred promises to freeze the loading state.',
    'Reset mocks, handlers, timers, routers and stores between tests.',
    'Use a real router with `createMemoryHistory()` per test; await `router.isReady()` and navigations.',
    'Extract guard logic into pure functions and unit-test every branch.',
    'Assert on what the user sees and on the resulting route — not on internal refs.',
  ],

  useCases: [
    'A list page that loads data on mount and offers a retry.',
    'A details page whose content depends on a route param.',
    'An auth guard with redirects and return URLs.',
    'A form that submits to an API and shows server validation errors.',
    'A search box with debounced requests (fake timers).',
  ],

  whenToUse: {
    use: [
      '`flushPromises` whenever the component awaits something you mocked.',
      'MSW when you want your real HTTP client, URLs and parsing under test.',
      'Dependency injection for composables and services you design yourself.',
      'A real router for components that read routes or navigate; stubs for components that only render links.',
    ],
    avoid: [
      'Real network calls in unit and component tests.',
      'Arbitrary `setTimeout` waits in tests.',
      'Mocking the component\'s own internals (its refs, methods) instead of its dependencies.',
      'Sharing one router or one mock implementation across tests.',
    ],
  },

  comparison: {
    title: 'Ways to fake an API in tests',
    headers: ['', '`vi.mock` module', 'Dependency injection', 'MSW (network level)'],
    rows: [
      ['What runs for real', 'everything except the mocked module', 'everything except the injected fake', 'your API module, fetch calls, URL building, JSON parsing'],
      ['Setup effort', 'low', 'low (needs a design that accepts deps)', 'medium (handlers + server lifecycle)'],
      ['Coupled to file layout', 'yes', 'no', 'no — coupled to URLs instead'],
      ['Catches wrong URLs / headers', 'no', 'no', 'yes'],
      ['Reusable in the browser / Storybook', 'no', 'partly', 'yes (MSW also runs in browsers)'],
    ],
    note: 'Many teams use MSW for component and integration tests, DI for composables, and `vi.mock` for small unit tests.',
  },

  quiz: [
    {
      id: 'testing-async-routing-q1',
      type: 'mcq',
      prompt: 'A button\'s handler does `loading.value = true; users.value = await getUsers()`. The test does `await wrapper.find(\'button\').trigger(\'click\')` and then expects the users. It fails. Why?',
      options: [
        { text: '`trigger` only waits for the next render (`nextTick`), not for the mocked promise and the render after it.' },
        { text: 'Mocked functions can\'t return promises.', why: '`mockResolvedValue` exists precisely to return promises.' },
        { text: '`trigger` doesn\'t fire click handlers.', why: 'It does; the handler started — it just hasn\'t finished.' },
        { text: 'The test needs `await wrapper.vm.$forceUpdate()`.', why: 'Forcing a render doesn\'t make the pending promise resolve.' },
      ],
      answer: 0,
      explanation: 'The first render (loading) happens after `nextTick`. The data arrives only after the awaited promise settles — add `await flushPromises()`.',
    },
    {
      id: 'testing-async-routing-q2',
      type: 'output',
      prompt: 'The mock resolves immediately. Which assertions pass?',
      code: {
        lang: 'js',
        code: `getUsers.mockResolvedValue([{ id: 1, name: 'Ada' }])
const wrapper = mount(UsersPage)          // onMounted: users.value = await getUsers()

expect(wrapper.text()).toContain('Ada')   // A
await nextTick()
await flushPromises()
expect(wrapper.text()).toContain('Ada')   // B`,
      },
      options: ['A and B', 'only A', 'only B', 'neither'],
      answer: 2,
      explanation: 'Even an already-resolved promise continues the `await` in a later microtask, so A runs too early. After `flushPromises()`, the callbacks and Vue\'s re-render have run, so B passes.',
    },
    {
      id: 'testing-async-routing-q3',
      type: 'bug',
      prompt: 'This test intermittently fails with "expected \'\' to contain \'User 7\'". Click the line that should change.',
      code: {
        lang: 'js',
        code: `test('shows user 7', async () => {
  const router = createRouter({ history: createMemoryHistory(), routes })
  router.push('/users/7')
  const wrapper = mount(App, { global: { plugins: [router] } })
  await flushPromises()
  expect(wrapper.text()).toContain('User 7')
})`,
      },
      answerLine: 3,
      explanation: 'Navigation is async. Wait for it: `router.push(\'/users/7\'); await router.isReady()` (or `await router.push(...)`) before mounting and asserting.',
    },
    {
      id: 'testing-async-routing-q4',
      type: 'fill',
      prompt: 'Complete the test so the API fails and the test waits for the component to react.',
      code: {
        lang: 'js',
        code: `getUsers.___(new Error('Server error'))
const wrapper = mount(UsersPage)
await ___()
expect(wrapper.find('[role="alert"]').exists()).toBe(true)`,
      },
      answer: [['mockRejectedValue', 'mockRejectedValueOnce'], ['flushPromises']],
      explanation: '`mockRejectedValue` makes the mock return a rejecting promise; `flushPromises` waits for the component\'s `catch` to run and Vue to re-render.',
    },
    {
      id: 'testing-async-routing-q5',
      type: 'mcq',
      prompt: 'What is the main advantage of MSW over `vi.mock(\'./api.js\')`?',
      options: [
        { text: 'It intercepts requests at the network level, so your real API module, URLs, headers and parsing are tested too.' },
        { text: 'It makes tests run without Node.', why: 'MSW runs in Node (and browsers); it doesn\'t remove the need for a test runner.' },
        { text: 'It removes the need to wait for promises.', why: 'Responses are still async; you still `await flushPromises()` or similar.' },
        { text: 'It automatically records real API responses.', why: 'You write handlers yourself (some tools can help generate them).' },
      ],
      answer: 0,
      explanation: 'Mocking further out keeps more real code under test, and the tests don\'t depend on which module exports which function.',
    },
    {
      id: 'testing-async-routing-q6',
      type: 'short',
      prompt: 'Why might you design a composable as `useUsers(api = realApi)` instead of importing the API module directly?',
      answer: 'Taking the dependency as a parameter (dependency injection) lets tests pass a fake API — a plain object with functions returning controllable promises — without module mocking. Tests become simpler, independent of file paths, and can freeze the request with a deferred promise to check the loading state. Production code uses the default, so callers don\'t change.',
    },
  ],

  exercises: [
    {
      id: 'injectable-api',
      title: 'Make the composable testable',
      difficulty: 'intermediate',
      prompt: `
\`useUsers()\` imports the API directly, so a test can't control it without module mocking. Refactor **useUsers.js**:

- \`useUsers(api)\` takes the API as a parameter and **defaults to the real module** (\`import * as realApi from './api.js'\`), so App.vue keeps working unchanged;
- it returns \`{ users, status, error, load }\` (refs + function);
- \`load()\` sets \`status\` to \`'loading'\` **synchronously**, then awaits \`api.getUsers()\`;
- success → \`users\` filled, \`status = 'success'\`; failure → \`error\` = the error message, \`status = 'error'\` (no throw).

Tests call \`withSetup(() => useUsers(fakeApi))\` with a fake whose promise *they* resolve or reject.
`,
      files: { 'App.vue': injectApp, 'useUsers.js': injectStarter, 'api.js': injectApi },
      hints: [
        'Change the signature to `export function useUsers(api = realApi)` and import the module as a namespace: `import * as realApi from \'./api.js\'`.',
        'Call `api.getUsers()` instead of the imported `getUsers()`.',
        'Wrap the await in try/catch: the catch sets `error.value = e.message` and `status.value = \'error\'`.',
      ],
      solution: {
        explanation: 'The composable no longer decides *which* API it talks to — the caller does, with a sensible default. Tests can now hold a request open (deferred promise), check `loading`, then resolve or reject it and check the outcome, all without `vi.mock`.',
        files: { 'App.vue': injectApp, 'useUsers.js': injectSolution, 'api.js': injectApi },
      },
      tests: [
        {
          name: 'loading → success with an injected fake',
          code: `const { useUsers } = requireModule('useUsers.js')
let resolve
const fakeApi = { getUsers: () => new Promise((r) => (resolve = r)) }
const u = withSetup(() => useUsers(fakeApi))
const done = u.load()
expect(u.status.value).toBe('loading')
resolve([{ id: 9, name: 'Test Person' }])
await done
expect(u.status.value).toBe('success')
expect(u.users.value[0].name).toBe('Test Person')`,
        },
        {
          name: 'a rejected request sets error without throwing',
          code: `const { useUsers } = requireModule('useUsers.js')
const fakeApi = { getUsers: () => Promise.reject(new Error('boom')) }
const u = withSetup(() => useUsers(fakeApi))
let threw = false
try { await u.load() } catch (e) { threw = true }
expect(threw).toBe(false)
expect(u.status.value).toBe('error')
expect(u.error.value).toBe('boom')`,
        },
        {
          name: 'the app still uses the real API by default',
          code: `await wait(300)
expect(findAll('.user').map((li) => li.textContent.trim())).toEqual(['Ada Lovelace', 'Grace Hopper'])`,
        },
      ],
    },
    {
      id: 'guard-function',
      title: 'Extract a testable guard',
      difficulty: 'intermediate',
      prompt: `
The auth rules live inside \`router.beforeEach\`, so they can only be tested by driving a router. Move them into a **pure function** in **guards.js** and use it from **router.js**:

\`authGuard(to, auth)\` returns:

- \`{ path: '/login', query: { redirect: to.fullPath } }\` when \`to.meta.requiresAuth\` is true and \`auth.loggedIn\` is false;
- \`to.query.redirect\` (or \`'/'\` if missing) when a **signed-in** user goes to \`/login\`;
- \`true\` otherwise.

Then register it: \`router.beforeEach((to) => authGuard(to, auth))\`. Tests call \`authGuard\` with plain objects and also navigate the app via \`vm.$router\`.
`,
      files: { 'main.js': mainFile, 'App.vue': guardAppFile, 'router.js': guardRouterStarter, 'guards.js': guardsStarter, 'auth.js': authFile },
      hints: [
        'Start with the protected-route case: `if (to.meta && to.meta.requiresAuth && !auth.loggedIn) return { path: \'/login\', query: { redirect: to.fullPath } }`.',
        'Then the signed-in-on-login case: `if (to.path === \'/login\' && auth.loggedIn) return (to.query && to.query.redirect) || \'/\'`. Finish with `return true`.',
        'In router.js import `authGuard` and replace the inline guard body with `return authGuard(to, auth)`.',
      ],
      solution: {
        explanation: 'The guard\'s *decision* is now a plain function of its inputs — every branch is a one-line test with plain objects, no router or DOM needed. One integration test then confirms the router actually calls it.',
        files: { 'main.js': mainFile, 'App.vue': guardAppFile, 'router.js': guardRouterSolution, 'guards.js': guardsSolution, 'auth.js': authFile },
      },
      tests: [
        {
          name: 'signed-out users are sent to /login with a redirect',
          code: `const { authGuard } = requireModule('guards.js')
const to = { path: '/admin', fullPath: '/admin?tab=billing', meta: { requiresAuth: true }, query: { tab: 'billing' } }
expect(authGuard(to, { loggedIn: false })).toEqual({ path: '/login', query: { redirect: '/admin?tab=billing' } })`,
        },
        {
          name: 'allowed navigations return true',
          code: `const { authGuard } = requireModule('guards.js')
expect(authGuard({ path: '/admin', fullPath: '/admin', meta: { requiresAuth: true }, query: {} }, { loggedIn: true })).toBe(true)
expect(authGuard({ path: '/', fullPath: '/', meta: {}, query: {} }, { loggedIn: false })).toBe(true)`,
        },
        {
          name: 'signed-in users visiting /login go to the redirect (or home)',
          code: `const { authGuard } = requireModule('guards.js')
expect(authGuard({ path: '/login', fullPath: '/login?redirect=/admin', meta: {}, query: { redirect: '/admin' } }, { loggedIn: true })).toBe('/admin')
expect(authGuard({ path: '/login', fullPath: '/login', meta: {}, query: {} }, { loggedIn: true })).toBe('/')`,
        },
        {
          name: 'the router really uses the guard',
          code: `await vm.$router.push('/admin')
await wait(30)
expect(vm.$route.path).toBe('/login')\nexpect(vm.$route.query.redirect).toBe('/admin')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'testing-async-routing-flush-vs-tick',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `await nextTick()` and `await flushPromises()` in Vue tests? When do you need each?',
      answer: '`nextTick()` waits for Vue\'s next DOM update after synchronous state changes — enough after `setValue`/`trigger` when the handler is synchronous (and `trigger` already returns it). `flushPromises()` (Vue Test Utils) resolves after a macrotask, by which time all already-resolved promise callbacks have run, including the component continuing after an awaited (mocked) API call and Vue re-rendering. Use `flushPromises` whenever the component awaits something.',
      explanation: 'One waits for a render; the other waits for pending async work to settle.',
      whyAsked: 'Async waiting is the most common source of confusing component-test failures.',
      mistakes: ['Thinking `nextTick` waits for API calls.', 'Believing `flushPromises` waits for real network requests or real timers.', 'Sprinkling both everywhere without knowing why.'],
      followUps: ['Why doesn\'t flushPromises help with a real 500 ms setTimeout?', 'How would you test a debounced search?', 'What does `await trigger()` return?'],
      modelAnswer: '`nextTick` resolves after Vue flushes its pending DOM updates — it\'s what you need after a synchronous state change, and `trigger` and `setValue` already return it. But if the handler awaits a mocked API, the data arrives a few promise steps later. `flushPromises` waits for a macrotask, and since microtasks always drain first, every already-resolved promise callback — the component\'s continuation and Vue\'s re-render — has run by then. It doesn\'t wait for real timers or real network, which is why I mock with resolved promises or use fake timers.',
    },
    {
      id: 'testing-async-routing-mock-strategy',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How do you mock API calls in a Vue test suite? Compare `vi.mock`, dependency injection and MSW, and say what you\'d standardise on.',
      answer: '`vi.mock` replaces a module for the test file — fast to write, but coupled to file layout and it skips your real HTTP code. Dependency injection (passing an API into composables/services or via provide/inject) makes fakes trivial and explicit but requires designing for it. MSW intercepts requests at the network level, so the real API client, URLs, headers and parsing run, and handlers are reusable across tests, Storybook and local development. A common standard: MSW for component/integration tests, DI for composables and services, `vi.mock` for narrow unit tests — plus a few E2E tests against a real backend to catch contract drift.',
      explanation: 'Mock as far out as is practical: the more real code runs, the more bugs the tests can catch.',
      whyAsked: 'Shows test-architecture judgement beyond knowing API names.',
      mistakes: ['Mocking everything with vi.mock and never testing the HTTP layer.', 'Real network calls in component tests.', 'No strategy for keeping mocks in sync with the real API.'],
      followUps: ['How do you keep MSW handlers in sync with the backend?', 'How do you test error responses with each approach?', 'When is vi.mock the best choice?'],
      modelAnswer: 'There are three levels. `vi.mock` swaps a whole module — quick, but the test now depends on import paths and my real API client never runs. Dependency injection means my composables take their API as a parameter or via inject, so tests pass a plain fake; it\'s explicit and needs no magic. MSW intercepts fetch at the network boundary, so my real client, URLs and JSON parsing all run, and the same handlers power Storybook and local dev. I\'d standardise on MSW for component and integration tests and DI for composables, use vi.mock sparingly, and keep a handful of E2E tests against a real backend because mocks can drift from the actual contract.',
    },
    {
      id: 'testing-async-routing-loading-state',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate\'s test for the loading spinner passes sometimes and fails sometimes. How do you test a loading state deterministically?',
      answer: 'Don\'t race the real request. Mock the API to return a **deferred** promise the test controls, mount, `await nextTick()`, assert the spinner — it stays visible because the promise is still pending — then resolve (or reject) the deferred, `await flushPromises()`, and assert the result and that the spinner is gone. No sleeps; for time-based behaviour like a delayed spinner, use fake timers.',
      explanation: 'Control the timing instead of guessing it.',
      whyAsked: 'Flaky tests are expensive; this checks whether you can design reliable async tests.',
      mistakes: ['Adding a longer sleep.', 'Asserting the spinner after flushPromises (it\'s already gone).', 'Only testing the success state.'],
      followUps: ['How would you write `createDeferred`?', 'How do you test the error path the same way?', 'What about a spinner shown only after 200 ms?'],
      modelAnswer: 'The flakiness comes from racing a request that resolves on its own schedule. I\'d make the API mock return a deferred promise — one the test resolves manually. Then the test mounts, waits a tick, and asserts the spinner, which can\'t disappear because the request is still pending. Next it resolves the deferred with data, calls flushPromises, and asserts the list is shown and the spinner is gone. The error path is the same with reject. If the spinner depends on time, I\'d add fake timers and advance them explicitly.',
    },
    {
      id: 'testing-async-routing-leaking-mocks',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A test passes when run alone with `it.only`, but fails when the whole file runs. What do you look for?',
      answer: 'Shared state leaking between tests: mock implementations not reset (`mockRejectedValue` from a previous test still active), MSW `server.use` overrides not reset, one router or Pinia instance reused across tests, fake timers left enabled, module-level state in the code under test, or leftover DOM/mounted components. Fix by resetting in hooks or config (`mockReset`/`restoreMocks`, `server.resetHandlers()`, `vi.useRealTimers()`), creating routers/stores per test, and unmounting.',
      explanation: 'Order-dependent tests are a symptom of missing isolation.',
      whyAsked: 'Debugging order-dependent failures is a daily reality on larger suites.',
      mistakes: ['Re-running until it passes.', 'Adding `it.only`/`skip` and moving on.', 'Blaming Vitest.'],
      followUps: ['How can you make Vitest run tests in random order to find these?', 'What does `restoreMocks` do differently from `clearMocks`?', 'How do module-level singletons cause this?'],
      modelAnswer: 'That pattern means the test depends on state left by earlier tests. I\'d check, in order: mocks whose implementation from a previous test is still active, MSW overrides that weren\'t reset, a router or store created once at module level and reused, fake timers left on, and module-level state in the code itself. The fix is isolation: reset mocks and handlers in afterEach or via config, restore real timers, create a fresh router and Pinia per test, and unmount wrappers. Shuffling test order is a good way to flush out the rest.',
    },
    {
      id: 'testing-async-routing-router',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How would you test a component that reads route params and navigates with links?',
      answer: 'Mount it with a real Vue Router using `createMemoryHistory()` — a new router per test — push the starting route and `await router.isReady()`, mount with `global.plugins: [router]`, then interact and `await flushPromises()`. Assert on the DOM and on `router.currentRoute.value`. Navigate while mounted to cover param changes (component reuse). For components that only render links, stub `RouterLink` (e.g. `RouterLinkStub`) and assert on `to`. Test guard logic as pure functions.',
      explanation: 'A real in-memory router keeps tests realistic without a browser URL.',
      whyAsked: 'Routing is in almost every Vue app, and router-dependent components are often left untested.',
      mistakes: ['Mocking `useRoute` everywhere so the real routing never runs.', 'Reusing one router across tests.', 'Not awaiting navigation.'],
      followUps: ['When would you mock `useRoute` instead?', 'How do you test lazy-loaded routes?', 'How do you test that a guard redirects?'],
      modelAnswer: 'I prefer a real router with memory history, created fresh for each test from the app\'s route definitions. I push the starting path, await `router.isReady()`, mount with the router as a plugin, and await `flushPromises` after interactions. Then I can assert on what\'s rendered and on `router.currentRoute.value`. Importantly I also navigate while the component stays mounted, because Vue Router reuses components across param changes. For a nav bar that just renders links I\'d stub RouterLink, and guard logic I extract into pure functions with their own unit tests.',
    },
    {
      id: 'testing-async-routing-guard-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'The user is signed out. After `await router.push(\'/settings?tab=billing\')`, what are `router.currentRoute.value.path` and `router.currentRoute.value.query.redirect`?',
      code: {
        lang: 'js',
        code: `router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.loggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})
// routes: { path: '/settings', meta: { requiresAuth: true } }, { path: '/login' }`,
      },
      options: [
        '`/settings` and `undefined`',
        '`/login` and `/settings?tab=billing`',
        '`/login` and `/settings`',
        'The push throws a navigation error',
      ],
      correctOption: 1,
      answer: '`path` is `/login` and `query.redirect` is `/settings?tab=billing`. Returning a location from a guard redirects the navigation, and the guard stored the original `fullPath` (including its query) in the redirect query.',
      explanation: 'Since Vue Router 4, returning a route location from `beforeEach` cancels the current navigation and starts a redirect to that location; the `push` promise resolves without throwing. `fullPath` includes the query string, `path` doesn\'t.',
      whyAsked: 'Checks precise knowledge of guard return values and how to assert on them in tests.',
      mistakes: ['Expecting the original path.', 'Using `to.path` and losing the query string the user had.', 'Thinking redirects reject the push promise.'],
      followUps: ['What does returning `false` do?', 'Why assert on `path` and `query` rather than on the full URL string?', 'How do you test this without a router?'],
      modelAnswer: 'The guard returns a location, so Vue Router redirects to `/login`, and `query.redirect` holds the original full path, `/settings?tab=billing`, because the guard used `to.fullPath` rather than `to.path`. A redirect doesn\'t make `push` throw — it resolves once the redirected navigation finishes. In tests I assert on `path` and the decoded `query` values rather than on a full URL string, so encoding details don\'t matter, and I unit-test the decision itself as a pure function.',
    },
    {
      id: 'testing-async-routing-deferred',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `createDeferred()` in **deferred.js**: it returns `{ promise, resolve, reject, settled }`, where calling `resolve(value)` / `reject(error)` settles `promise`, and `settled` (a property you read later) becomes `true` once either has been called. Tests use it the way a component test would freeze an API call.',
      starter: {
        files: {
          'App.vue': deferredApp,
          'deferred.js': `// deferred.js
export function createDeferred() {
  const promise = new Promise(() => {})
  return { promise, resolve() {}, reject() {}, settled: false }
}`,
        },
      },
      tests: [
        {
          name: 'resolve() settles the promise with the value',
          code: `const { createDeferred } = requireModule('deferred.js')
const d = createDeferred()
expect(d.settled).toBe(false)
d.resolve(42)
expect(d.settled).toBe(true)
expect(await d.promise).toBe(42)`,
        },
        {
          name: 'reject() makes the promise reject',
          code: `const { createDeferred } = requireModule('deferred.js')
const d = createDeferred()
d.reject(new Error('nope'))
expect(d.settled).toBe(true)
let message = ''
try { await d.promise } catch (e) { message = e.message }
expect(message).toBe('nope')`,
        },
        {
          name: 'freezes a "request" until the test decides',
          code: `const { createDeferred } = requireModule('deferred.js')
const d = createDeferred()
let status = 'loading'
d.promise.then(() => (status = 'done'))
await flush()
expect(status).toBe('loading')
d.resolve()
await flush()
expect(status).toBe('done')`,
        },
        {
          name: 'the demo page reacts to resolve',
          code: `await click('.start')
expect(text('.status')).toBe('waiting')
await click('.finish')
expect(text('.status')).toBe('done')`,
        },
      ],
      hints: ['Capture the executor\'s `resolve` and `reject` in variables: `new Promise((res, rej) => { … })`.', 'Return an object whose `resolve(value)` sets `deferred.settled = true` and calls the captured `res(value)`.', 'Build the object first (`const deferred = { promise, settled: false, resolve(v) {…}, reject(e) {…} }`) so the methods can update `deferred.settled`.'],
      answer: 'Capture the executor\'s resolve/reject, expose them as methods that also flip a `settled` flag on the returned object.',
      solution: {
        files: {
          'App.vue': deferredApp,
          'deferred.js': `// deferred.js
export function createDeferred() {
  let res, rej
  const promise = new Promise((resolve, reject) => {
    res = resolve
    rej = reject
  })
  const deferred = {
    promise,
    settled: false,
    resolve(value) {
      deferred.settled = true
      res(value)
    },
    reject(error) {
      deferred.settled = true
      rej(error)
    },
  }
  return deferred
}`,
        },
      },
      explanation: 'The Promise executor runs synchronously, so `res` and `rej` are captured before `createDeferred` returns. Exposing them lets a test decide *exactly* when "the server answers" — the key to deterministic loading-state tests. Modern runtimes provide `Promise.withResolvers()` for the same trio.',
      whyAsked: 'Tests promise fundamentals and a pattern every serious async test suite uses.',
      mistakes: ['Assuming the executor runs asynchronously.', 'Returning `settled` as a copied boolean that never updates.', 'Forgetting the reject path.'],
      followUps: ['How would you use it with `vi.fn().mockReturnValue`?', 'What does `Promise.withResolvers()` return?', 'Why not just use `mockResolvedValue`?'],
      modelAnswer: 'The Promise constructor runs its executor synchronously, so I capture `resolve` and `reject` into outer variables. Then I return an object with the promise and two methods that flip `settled` on that same object and call the captured functions. In a component test I\'d make the API mock return `deferred.promise`, assert the loading state while it\'s pending, then resolve or reject and flush promises. Newer runtimes have `Promise.withResolvers()` for the same idea.',
    },
  ],

  takeaways: [
    '`nextTick` waits for a render; `flushPromises` waits for pending promise callbacks — use it after async actions.',
    'Never sleep in tests: mock with controllable promises and use fake timers for `setTimeout`.',
    'Mock at a boundary: `vi.mock` (quick, coupled to files), dependency injection (explicit), MSW (network-level, most realistic).',
    'Freeze requests with a deferred promise to test loading states deterministically; test error paths too.',
    'Use a fresh real router with `createMemoryHistory()` per test, await `isReady()` and navigations, and navigate while mounted.',
    'Extract guard decisions into pure functions; reset mocks, handlers, timers, routers and stores between tests.',
  ],
}
