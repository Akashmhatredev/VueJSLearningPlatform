// Lesson: Suspense (experimental).

const dashboardApp = `<script setup>
import { ref } from 'vue'
import ProfileCard from './ProfileCard.vue'
import OrdersCard from './OrdersCard.vue'

const version = ref(0) // bump to reload the whole dashboard
</script>

<template>
  <h2>My account</h2>
  <button class="refresh" @click="version++">Refresh</button>

  <Suspense>
    <!-- #default: ONE root node; every async component inside is awaited -->
    <div :key="version" class="dashboard">
      <ProfileCard />
      <OrdersCard />
    </div>

    <template #fallback>
      <p class="loading">Loading your dashboard…</p>
    </template>
  </Suspense>
</template>

<style>
.dashboard {
  display: grid;
  gap: 10px;
}
.card {
  border: 2px solid #1a1a1a;
  padding: 8px 12px;
}
</style>`

const profileCard = `<script setup>
import { fetchProfile } from './api.js'

// top-level await: this component is now an "async dependency"
const profile = await fetchProfile()
</script>

<template>
  <section class="card profile">
    <h3 class="name">{{ profile.name }}</h3>
    <p>Member since {{ profile.since }}</p>
  </section>
</template>`

const ordersCard = `<script setup>
import { fetchOrders } from './api.js'

const orders = await fetchOrders()
</script>

<template>
  <section class="card orders">
    <h3>Recent orders</h3>
    <ul>
      <li v-for="o in orders" :key="o.id" class="order">{{ o.item }} — {{ o.status }}</li>
    </ul>
  </section>
</template>`

const statsCard = `<script setup>
import { fetchStats } from './api.js'

const stats = await fetchStats()
</script>

<template>
  <section class="card stats">
    <h3>This year</h3>
    <p>{{ stats.orders }} orders · {{ stats.saved }} € saved</p>
  </section>
</template>`

const recsCard = `<script setup>
import { fetchRecommendations } from './api.js'

// this request fails — what does Suspense do with that?
const items = await fetchRecommendations()
</script>

<template>
  <section class="card recs">
    <h3>You might like</h3>
    <p v-for="item in items" :key="item">{{ item }}</p>
  </section>
</template>`

const dashboardApi = `// Simulated API — the sandbox has no network.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchProfile() {
  await wait(150)
  return { name: 'Ada Lovelace', since: 2021 }
}

export async function fetchOrders() {
  await wait(300)
  return [
    { id: 101, item: 'Trail Backpack', status: 'Shipped' },
    { id: 102, item: 'Camp Stove', status: 'Processing' },
  ]
}

export async function fetchStats() {
  await wait(200)
  return { orders: 7, saved: 42 }
}

export async function fetchRecommendations() {
  await wait(200)
  throw new Error('Recommendations are unavailable right now')
}`

export default {
  id: 'suspense',
  title: 'Suspense (experimental)',
  summary: 'Coordinate the loading state of a whole tree of async components with one fallback — and understand why the API is still marked experimental.',
  difficulty: 'advanced',
  minutes: 38,
  prerequisites: ['async-components', 'async-ui-states', 'lifecycle-hooks'],
  related: ['keep-alive', 'transitions', 'error-handling', 'nuxt-intro', 'lazy-routes-scroll'],
  tags: ['Suspense', 'experimental', 'async setup', 'top-level await', 'fallback', 'async dependency', 'onErrorCaptured', 'defineAsyncComponent', 'suspensible', 'timeout', 'loading state'],
  apis: [
    { name: '<Suspense>', summary: 'Experimental built-in that shows `#fallback` content until every async dependency in its `#default` tree has resolved.' },
    { name: 'async setup / top-level await', summary: 'A component whose `setup` returns a promise — including `<script setup>` with top-level `await` — is an async dependency.' },
    { name: '@pending / @resolve / @fallback', summary: 'Events emitted when Suspense enters the pending state, finishes resolving new default content, or shows its fallback.' },
    { name: 'timeout', summary: 'After the first resolve, how long (ms) to keep showing the previous content before switching to the fallback when the default root is replaced.' },
    { name: 'suspensible', summary: '`defineAsyncComponent` option (default `true`) — and, on a nested `<Suspense>` (3.3+), a prop that hands its dependencies to the parent boundary.' },
    { name: 'onErrorCaptured()', summary: 'Hook in an ancestor that receives errors thrown by descendants — the way to build error UI around Suspense.' },
  ],
  docs: [
    { label: 'Vue Guide — Suspense', url: 'https://vuejs.org/guide/built-ins/suspense.html' },
    { label: 'API — <Suspense>', url: 'https://vuejs.org/api/built-in-components.html#suspense' },
    { label: 'Vue Guide — Async components: using with Suspense', url: 'https://vuejs.org/guide/components/async.html#using-with-suspense' },
    { label: 'API — onErrorCaptured()', url: 'https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured' },
  ],

  intro: [
    {
      callout: 'warn',
      title: 'Experimental feature',
      text: '`<Suspense>` is marked **experimental** in Vue 3. The Vue docs say it is not guaranteed to reach stable status and its API may change before it does. Vue even logs an info message when you use it. Learn it — frameworks like Nuxt build on it — but adopt it deliberately.',
    },
    `
\`<Suspense>\` is a built-in component for **waiting**. You put a tree of components in its \`#default\` slot and a loading message in its \`#fallback\` slot. If any component in that tree needs to wait for something asynchronous before it can render — say, its data — Suspense shows the fallback until **all** of them are ready, then swaps in the finished tree in one go.

Instead of five components each juggling their own \`loading\` flag and spinner, one boundary coordinates them.
`,
  ],

  why: `
A dashboard has a profile card, an orders card and a stats card. Each fetches its own data. The usual approach ([Loading, error & empty states](lesson:async-ui-states)) gives each card its own \`loading\` ref and spinner. That works, but:

- the page flickers into place piece by piece — three spinners, then content popping in at different times, with the layout jumping;
- every component repeats the same "if loading show spinner, else show content" boilerplate;
- a parent can't easily say "show **one** skeleton until the whole section is ready".

\`<Suspense>\` lets components simply \`await\` their data at the top of \`<script setup>\` — no loading flags at all — and moves the waiting to one place in the tree. The parent decides what "loading" looks like and how much of the page it covers.

It also matters for **server-side rendering**: when rendering on the server, Vue has to wait for async setup before sending HTML, and Suspense-style async setup is how frameworks such as Nuxt express "this component needs data before it renders".
`,

  eli15: `
Imagine a restaurant table of four. The kitchen could bring each plate as soon as it's ready — one person eats while the others stare. Good restaurants wait until **every** plate is ready and bring them out together.

\`<Suspense>\` is that waiter. Each component in the tree is a dish. A component that writes \`await fetchSomething()\` is saying "I'm still cooking". While anyone is still cooking, the waiter keeps the table busy with bread — the **fallback** ("Loading…"). When the last dish is done, everything arrives at once.

And if a dish gets burnt (an error)? This waiter doesn't handle complaints — you need a manager nearby (\`onErrorCaptured\` in a parent) to decide what to tell the customer.
`,

  analogy: {
    title: 'The waiter who serves the table together',
    body: `
The kitchen cooks several dishes at different speeds. The waiter holds every plate until the whole table's order is ready, keeping guests happy with bread meanwhile, then serves everything in one trip.

Suspense holds back the whole default tree until every async component has finished its \`await\`, shows the fallback meanwhile, and then displays the complete tree at once.
`,
    mapping: [
      ['the table\'s order', 'the `#default` slot tree'],
      ['a dish still cooking', 'a component with async setup (top-level `await`) or an async component that hasn\'t loaded'],
      ['the bread basket', 'the `#fallback` slot'],
      ['serving everything in one trip', 'Suspense resolving and showing the finished tree'],
      ['a burnt dish and the manager', 'an error in async setup, handled by `onErrorCaptured` in a parent'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'How Suspense waits',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'suspense', label: '<Suspense>', note: 'boundary', tone: 'cobalt', x: 110, y: 160 },
        { id: 'root', label: 'div.dashboard', note: '#default root (in memory)', tone: 'paper', x: 330, y: 160 },
        { id: 'profile', label: 'ProfileCard', note: 'await fetchProfile() · 150 ms', tone: 'kraft', x: 560, y: 70 },
        { id: 'orders', label: 'OrdersCard', note: 'await fetchOrders() · 300 ms', tone: 'kraft', x: 560, y: 250 },
        { id: 'fallback', label: '#fallback', note: '"Loading your dashboard…"', tone: 'acid', x: 110, y: 40 },
        { id: 'done', label: 'resolved', note: 'whole tree shown at once', tone: 'acid', x: 110, y: 280 },
      ],
      edges: [
        { from: 'suspense', to: 'root', label: 'renders' },
        { from: 'root', to: 'profile' },
        { from: 'root', to: 'orders' },
        { from: 'suspense', to: 'fallback', label: 'pending' },
        { from: 'suspense', to: 'done', label: 'all deps resolved' },
      ],
      steps: [
        { focus: ['suspense', 'root'], edges: ['suspense->root'], text: 'Suspense starts rendering its `#default` slot **in memory** — not yet in the page.' },
        { focus: ['profile', 'orders'], edges: ['root->profile', 'root->orders'], text: 'Both cards have a top-level `await`, so their setup returns a promise. Each one registers itself with the nearest Suspense as an **async dependency**.' },
        { focus: ['fallback'], edges: ['suspense->fallback'], text: 'With dependencies pending, Suspense enters the **pending** state (emitting `pending` and `fallback`) and displays the `#fallback` slot.' },
        { focus: ['profile'], text: 'After 150 ms the profile data arrives — but the orders are still loading, so nothing changes on screen yet. No half-finished dashboard.' },
        { focus: ['orders', 'done'], edges: ['suspense->done'], text: 'At 300 ms the last dependency resolves. Suspense swaps the fallback for the finished tree in one step and emits `resolve`.' },
      ],
    },
    caption: 'One boundary waits for every async dependency below it, then shows everything together.',
    alt: 'A Suspense boundary renders a dashboard div in memory, which contains ProfileCard (awaiting data for 150 ms) and OrdersCard (awaiting for 300 ms). While they wait, the fallback "Loading your dashboard…" is shown. When both resolve, the whole tree is shown at once.',
  },

  animation: {
    type: 'comparison',
    title: 'Loading flags vs. Suspense',
    props: {
      left: {
        label: 'Each component manages its own loading',
        lang: 'vue',
        code: `<!-- ProfileCard.vue -->
<script setup>
import { ref, onMounted } from 'vue'
import { fetchProfile } from './api.js'

const profile = ref(null)
const loading = ref(true)
onMounted(async () => {
  profile.value = await fetchProfile()
  loading.value = false
})
</script>

<template>
  <p v-if="loading" class="spinner">Loading…</p>
  <h3 v-else>{{ profile.name }}</h3>
</template>`,
      },
      right: {
        label: 'Components just await; a parent boundary waits',
        lang: 'vue',
        code: `<!-- ProfileCard.vue -->
<script setup>
import { fetchProfile } from './api.js'
const profile = await fetchProfile()
</script>

<template>
  <h3>{{ profile.name }}</h3>
</template>

<!-- Parent.vue -->
<Suspense>
  <ProfileCard />
  <template #fallback>Loading…</template>
</Suspense>`,
      },
      points: [
        'Left: stable API, fine-grained control, but repeated boilerplate and staggered pop-in.',
        'Right: no loading flags in the component; one boundary decides what loading looks like.',
        'Right requires a `<Suspense>` ancestor — without one, an async-setup component renders nothing and Vue warns.',
        'Neither handles errors for you: left needs an `error` ref, right needs `onErrorCaptured` in a parent.',
      ],
    },
    caption: 'Suspense moves "waiting" out of each component and up to a boundary.',
    alt: 'Side-by-side code. Left: a ProfileCard with loading and profile refs filled in onMounted and a v-if spinner. Right: a ProfileCard that awaits its data at the top level, and a parent wrapping it in Suspense with a fallback template.',
  },

  syntax: [
    `
#### Async dependencies

Suspense waits for two kinds of **async dependencies** anywhere in its default tree:

1. **Components with an async \`setup()\`** — in \`<script setup>\`, any **top-level \`await\`** makes the component async.
2. **Async components** created with \`defineAsyncComponent\` — they are *suspensible* by default.
`,
    {
      code: `<!-- UserCard.vue -->
<script setup>
import { fetchUser } from './api.js'

const user = await fetchUser()   // top-level await → async dependency
</script>

<template>
  <h3>{{ user.name }}</h3>
</template>`,
      lang: 'vue',
      title: 'an async component via top-level await',
    },
    `
#### The boundary
`,
    {
      code: `<template>
  <Suspense @pending="onPending" @resolve="onResolve" :timeout="200">
    <!-- default slot: ONE immediate child node -->
    <UserDashboard />

    <template #fallback>
      <p>Loading…</p>
    </template>
  </Suspense>
</template>`,
      lang: 'vue',
      title: 'default + fallback',
    },
    `
**The rules:**

1. Each slot allows **one immediate child node**. Two siblings directly in \`#default\` trigger a warning and nothing renders — wrap them in one element.
2. **Initial render:** if any async dependency is found, Suspense shows \`#fallback\` until **all** of them resolve; if none, it shows the default content straight away.
3. **After resolving**, Suspense only goes back to pending when the **root node** of \`#default\` is replaced (a different component, or a changed \`key\`). New async components deeper in the tree do *not* bring the fallback back.
4. When it does go back to pending, it keeps showing the **previous** content while waiting, unless \`timeout\` elapses — \`timeout="0"\` shows the fallback immediately.
5. Suspense has **no error slot**. Catch errors with \`onErrorCaptured\` in a parent component.
6. A component with top-level \`await\` **needs** a Suspense ancestor. Without one, Vue warns that no \`<Suspense>\` boundary was found and the component renders nothing.
`,
    {
      code: `import { defineAsyncComponent } from 'vue'

// suspensible by default: the nearest <Suspense> controls its loading state
const StatsCard = defineAsyncComponent(() => import('./StatsCard.vue'))

// opt out: it shows its own loadingComponent / errorComponent instead
const MapWidget = defineAsyncComponent({
  loader: () => import('./MapWidget.vue'),
  suspensible: false,
  loadingComponent: MapSkeleton,
})`,
      lang: 'js',
      title: 'async components and suspensible',
    },
    {
      callout: 'note',
      title: 'Lazy routes are different',
      text: 'Vue Router (a separate library) lazily loads route components with dynamic imports, but those are **not** async components and currently don\'t trigger Suspense themselves. Async components or async-setup components *inside* a route still do.',
    },
    `
#### Nesting with other built-ins

When combining with Vue Router, \`<Transition>\` and \`<KeepAlive>\`, the Vue docs recommend this order (static code — it needs a router):
`,
    {
      code: `<RouterView v-slot="{ Component }">
  <template v-if="Component">
    <Transition mode="out-in">
      <KeepAlive>
        <Suspense>
          <component :is="Component" />
          <template #fallback>Loading…</template>
        </Suspense>
      </KeepAlive>
    </Transition>
  </template>
</RouterView>`,
      lang: 'vue',
      title: 'RouterView → Transition → KeepAlive → Suspense',
      static: true,
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: dashboardApp,
    intro: 'A dashboard with two cards that each `await` their own data. The parent decides how loading looks. Step through it, then open ProfileCard.vue in the playground to see the `await`.',
    steps: [
      { lines: [3, 4], text: 'The cards are imported like any other component. What makes them async is inside them: `const profile = await fetchProfile()` at the top of `<script setup>`.' },
      { lines: [6], text: '`version` will become the `key` of the default root. Changing it replaces that root — the only thing that sends a resolved Suspense back to pending.' },
      { lines: [13], text: '`<Suspense>` creates the boundary. Every async dependency rendered inside its default slot reports to it.' },
      { lines: [14, 18], text: 'The default slot has exactly **one** root node, `div.dashboard`. Both cards are awaited together: nothing inside appears until both have finished.' },
      { lines: [20, 22], text: '`#fallback` is shown while anything is pending. It\'s a normal slot: a skeleton, a spinner, or a message.' },
      { lines: [11], text: '**Refresh** bumps the key. Suspense re-enters pending — but by default it keeps showing the *old* dashboard until the new one is ready. You\'ll change that with `timeout`.' },
    ],
  },

  playground: {
    title: 'Async dashboard',
    objective: 'Watch one boundary coordinate several async components, then add resolve tracking, a lazily loaded card, a timeout, and error handling.',
    files: {
      'App.vue': dashboardApp,
      'ProfileCard.vue': profileCard,
      'OrdersCard.vue': ordersCard,
      'StatsCard.vue': statsCard,
      'RecommendationsCard.vue': recsCard,
      'api.js': dashboardApi,
    },
    expected: '"Loading your dashboard…" for about 0.3 s, then **both** cards appear together — even though the profile arrived earlier. The console shows Vue\'s note that Suspense is experimental. Click **Refresh**: the old dashboard stays on screen while the new one loads. `StatsCard.vue` and `RecommendationsCard.vue` exist but aren\'t used yet.',
    experiments: [
      {
        id: 'count-resolves',
        task: 'Track when the dashboard is ready. Count the Suspense `resolve` events and show them in `<p class="ready">Loaded 1 time(s)</p>` (the number must update).',
        hint: 'Add `const loads = ref(0)`, put `@resolve="loads++"` on `<Suspense>`, and render `<p class="ready">Loaded {{ loads }} time(s)</p>` above it.',
        tests: [
          {
            name: 'resolve fires once per load',
            code: `await wait(450)
expect(text('.ready')).toContain('1')
await click('.refresh')
await wait(450)
expect(text('.ready')).toContain('2')`,
          },
        ],
        explain: '`resolve` fires when the default content has finished resolving — on the first load and again after each refresh (because the root\'s key changed). `pending` and `fallback` are its counterparts.',
      },
      {
        id: 'lazy-stats',
        task: 'Add the stats card, but load its code **lazily**: create it with `defineAsyncComponent(() => import(\'./StatsCard.vue\'))` and put `<StatsCard />` in the dashboard.',
        hint: 'Import `defineAsyncComponent` from `vue` (next to `ref`), write `const StatsCard = defineAsyncComponent(() => import(\'./StatsCard.vue\'))`, and add `<StatsCard />` inside `div.dashboard`.',
        tests: [
          {
            name: 'the stats card joins the same loading state',
            code: `expect(exists('.loading')).toBe(true)
expect(exists('.stats')).toBe(false)
await wait(500)
expect(exists('.stats')).toBe(true)
expect(exists('.loading')).toBe(false)`,
          },
        ],
        explain: 'StatsCard is a dependency twice over: its code is loaded asynchronously (an async component, suspensible by default), and its setup awaits data. Suspense simply waits for both — the page still appears in one piece.',
      },
      {
        id: 'timeout-zero',
        task: 'When **Refresh** is clicked, show the fallback **immediately** instead of keeping the old dashboard on screen.',
        hint: 'Add `timeout="0"` to `<Suspense>`. The timeout only matters when Suspense re-enters pending after it has resolved once.',
        tests: [
          {
            name: 'Refresh shows the fallback right away',
            code: `await wait(450)
await click('.refresh')
expect(exists('.loading')).toBe(true)
expect(exists('.dashboard')).toBe(false)`,
          },
        ],
        explain: 'Keeping old content while new content loads avoids flashes for fast requests; `timeout` decides how long that grace period is. `0` means "always show the fallback straight away".',
      },
      {
        id: 'error-ui',
        task: 'Add `<RecommendationsCard />` to the dashboard — its request fails and the fallback stays forever. Catch the error with `onErrorCaptured` in App.vue and render `<p class="error">` with the error\'s message **instead of** the Suspense. (Remove the card again afterwards.)',
        hint: 'Import the card and `onErrorCaptured`. Add `const error = ref(null)` and `onErrorCaptured((err) => { error.value = err; return false })`. In the template: `<p v-if="error" class="error">{{ error.message }}</p>` and `v-else` on `<Suspense>`.',
        tests: [
          {
            name: 'the error replaces the endless spinner',
            code: `await wait(500)
expect(text('.error')).toContain('Recommendations are unavailable')
expect(exists('.loading')).toBe(false)`,
          },
        ],
        explain: 'A failed async setup never resolves, so Suspense would stay pending forever. Suspense has no error slot — error UI is built around it with `onErrorCaptured`. Returning `false` stops the error from propagating to the app-level error handler.',
      },
    ],
  },

  internals: {
    beginner: `
Suspense renders its default slot "off-screen" first. Every component inside that has to \`await\` something tells Suspense "wait for me". Suspense counts them. While the count is above zero, it shows the fallback on screen. Each time one finishes, the count goes down; when it reaches zero, Suspense moves the finished content onto the screen.
`,
    technical: [
      `
**Async setup compiles specially.** A top-level \`await\` in \`<script setup>\` makes the generated \`setup()\` an \`async\` function. The compiler also wraps each \`await\` with an internal helper (\`withAsyncContext\`) that restores the "current component instance" afterwards, so lifecycle hooks and \`inject()\` called *after* an \`await\` still know which component they belong to.

**Registering dependencies.** When the renderer mounts a component whose \`setup\` returned a promise, it doesn't render it. It registers the promise with the nearest Suspense boundary (found through the parent chain) and increments a pending counter. When the promise resolves, the component finishes setup and renders, and the counter goes down.

**Two containers.** On the initial render, Suspense mounts the default tree into a **detached container** (not in the document) while the fallback is mounted in the real one. On resolve, it moves the finished default tree into place and unmounts the fallback.
`,
      {
        code: `// A simplified model of a Suspense boundary — not Vue's real source
function createBoundary(showFallback, showContent, emit) {
  let pending = 0
  return {
    register(promise) {
      if (pending++ === 0) { emit('pending'); showFallback(); emit('fallback') }
      promise.then(() => {
        if (--pending === 0) { showContent(); emit('resolve') }
      }) // a rejection is reported through onErrorCaptured; pending never reaches 0
    },
  }
}`,
        lang: 'js',
        title: 'mental model: counting async dependencies',
      },
      `
**After resolving**, the boundary only re-enters pending when the root vnode of the default slot is replaced. It then renders the new tree in the detached container while the old content stays visible; if \`timeout\` is set and elapses first, it switches to the fallback. Deeper async components rendered later don't affect it — that is what nested boundaries are for (\`<Suspense suspensible>\`, 3.3+, hands a nested boundary's dependencies to its parent).

**Errors.** A rejected async setup is passed to Vue's error handling, which walks up the component tree calling \`errorCaptured\` hooks and finally \`app.config.errorHandler\`. The boundary itself just stays pending — which is why error UI belongs in an ancestor.
`,
    ],
    production: `
- **Experimental means a moving target.** Keep Suspense usage to a few well-defined boundaries (page sections, route views) so a future API change touches few files.
- **Always pair a boundary with error handling.** An \`ErrorBoundary\` component with \`onErrorCaptured\`, an error message and a retry is the minimum; otherwise a single failed request leaves an endless spinner.
- **Watch for waterfalls.** Sibling async components load in parallel, but a parent that awaits before rendering its children delays the children's requests. Start independent requests together (\`Promise.all\`) where it matters.
- **Mind the granularity.** One boundary around the whole page means the fastest part waits for the slowest. Use several boundaries — or keep per-component loading states for independent widgets.
- **SSR and frameworks:** Nuxt relies on async setup and Suspense for data loading during server rendering; in a plain SPA, explicit per-component loading states or a data-fetching composable are a stable, perfectly good alternative. See [Nuxt fundamentals](lesson:nuxt-intro).
- **Accessibility:** announce loading and completion for assistive technology (e.g. an \`aria-live\` region or \`aria-busy\` on the region being loaded) — Suspense only swaps DOM.
`,
  },

  mistakes: [
    {
      title: 'Top-level await without a Suspense ancestor',
      wrong: { code: `<!-- App.vue -->\n<template>\n  <UserCard /> <!-- UserCard has: const user = await fetchUser() -->\n</template>`, lang: 'vue' },
      right: { code: `<template>\n  <Suspense>\n    <UserCard />\n    <template #fallback>Loading…</template>\n  </Suspense>\n</template>`, lang: 'vue' },
      explanation: 'Vue warns "setup function returned a promise, but no <Suspense> boundary was found" and renders nothing for that component. Either add a boundary, or load data in `onMounted` with your own loading state.',
    },
    {
      title: 'Two root nodes in the default slot',
      wrong: { code: `<Suspense>\n  <ProfileCard />\n  <OrdersCard />\n  <template #fallback>Loading…</template>\n</Suspense>`, lang: 'vue' },
      right: { code: `<Suspense>\n  <div class="dashboard">\n    <ProfileCard />\n    <OrdersCard />\n  </div>\n  <template #fallback>Loading…</template>\n</Suspense>`, lang: 'vue' },
      explanation: 'Each Suspense slot expects a single immediate child. With two, Vue warns "<Suspense> slots expect a single root node" and nothing is shown.',
    },
    {
      title: 'No error handling around the boundary',
      wrong: { code: `<Suspense>\n  <Dashboard />  <!-- one request fails → "Loading…" forever -->\n  <template #fallback>Loading…</template>\n</Suspense>`, lang: 'vue' },
      right: { code: `<ErrorBoundary>        <!-- onErrorCaptured + message + retry -->\n  <Suspense>\n    <Dashboard />\n    <template #fallback>Loading…</template>\n  </Suspense>\n</ErrorBoundary>`, lang: 'vue' },
      explanation: 'A rejected async setup never resolves, and Suspense has no error state. Catch errors in an ancestor and render something useful.',
    },
    {
      title: 'Calling defineExpose (or registering hooks) carelessly after await',
      wrong: { code: `const data = await load()\ndefineExpose({ refresh })   // exposed too late`, lang: 'js' },
      right: { code: `defineExpose({ refresh })\nconst data = await load()`, lang: 'js' },
      explanation: 'The Vue docs require `defineExpose` before any `await`. Keeping macros and hook registrations at the top, before awaits, is the safe habit — even though the compiler restores the instance context for awaits in `<script setup>`.',
    },
    {
      title: 'Expecting the fallback for every later change',
      wrong: { code: `<Suspense>\n  <Layout>\n    <component :is="currentWidget" /> <!-- a nested async component swaps -->\n  </Layout>\n  …\n</Suspense>`, lang: 'vue' },
      right: { code: `<Suspense>\n  <Layout :key="currentWidget.name"> <!-- replace the ROOT to re-enter pending -->\n    <component :is="currentWidget" />\n  </Layout>\n  …\n</Suspense>`, lang: 'vue' },
      explanation: 'After the first resolve, only replacing the default slot\'s root node sends Suspense back to pending. For deeper swaps, change the root\'s key, or add a nested `<Suspense>`.',
    },
  ],

  debugging: [
    {
      symptom: 'The fallback stays on screen forever.',
      cause: 'An async dependency rejected (or its promise never settles), so the pending count never reaches zero.',
      fix: 'Check the console for the error, add `onErrorCaptured` in a parent to show error UI, and make sure every simulated or real request settles.',
    },
    {
      symptom: 'A component renders nothing and Vue warns "no <Suspense> boundary was found".',
      cause: 'The component has top-level `await` (async setup) but no Suspense ancestor.',
      fix: 'Wrap it (or an ancestor) in `<Suspense>`, or move the async work into `onMounted` with explicit loading state.',
    },
    {
      symptom: '"<Suspense> slots expect a single root node" and an empty page.',
      cause: 'Several sibling nodes directly inside `#default` or `#fallback`.',
      fix: 'Wrap the siblings in one element (or a single component).',
    },
    {
      symptom: 'Clicking "refresh" or switching tabs doesn\'t show the fallback.',
      cause: 'After the first resolve, Suspense keeps the previous content while the new root loads — or the root wasn\'t replaced at all.',
      fix: 'Replace the root (change its `key` or component) and set `timeout` (e.g. `0`) to show the fallback sooner.',
    },
    {
      symptom: 'An async component\'s own `loadingComponent` never shows.',
      cause: 'Async components are suspensible by default; inside a Suspense, the boundary controls loading and their own loading/error/delay/timeout options are ignored.',
      fix: 'Pass `suspensible: false` to `defineAsyncComponent` if that component should manage its own loading state.',
    },
  ],

  bestPractices: [
    'Remember Suspense is experimental: use it at a few clear boundaries and keep the rest of the app independent of it.',
    'Wrap every boundary in error handling (`onErrorCaptured`) with a retry path.',
    'Keep `defineExpose`, lifecycle hooks and `inject()` calls above the first `await` in `<script setup>`.',
    'Give the default slot one root node; use its `key` to deliberately restart loading.',
    'Choose boundary granularity on purpose: one per section the user perceives as a unit.',
    'Start independent requests in parallel to avoid waterfalls.',
    'Use `suspensible: false` for async components that should keep their own loading UI.',
  ],

  useCases: [
    'A dashboard or profile page whose sections should appear together instead of popping in one by one.',
    'Route views whose components fetch data in async setup (often in SSR frameworks such as Nuxt).',
    'Lazy-loaded heavy components (charts, editors) that should share a single skeleton with their data.',
    'Coordinating several async components behind one skeleton layout.',
  ],

  whenToUse: {
    use: [
      'Several async components should be presented as one unit with one loading state.',
      'You use (or plan to use) SSR or a framework that builds on async setup.',
      'You want components to simply `await` their data without loading-flag boilerplate.',
    ],
    avoid: [
      'Your team requires only stable, non-experimental APIs.',
      'Widgets are independent and should appear as soon as each is ready.',
      'You need fine-grained loading/error states per component — explicit refs or a data-fetching composable are clearer.',
      'You have no plan for error handling around the boundary.',
    ],
  },

  comparison: {
    title: 'Ways to handle async loading',
    headers: ['', '`<Suspense>` + async setup', 'per-component loading refs', '`defineAsyncComponent` loading/error options'],
    rows: [
      ['API status', '**experimental**', 'stable (plain reactivity)', 'stable'],
      ['Coordinates many components?', 'yes — one boundary waits for all', 'no — each decides alone', 'no — per component'],
      ['Waits for data?', 'yes (top-level `await`)', 'yes (you write it)', 'only for loading the component\'s **code**'],
      ['Error UI', '`onErrorCaptured` in an ancestor', 'an `error` ref in the component', '`errorComponent` option'],
      ['Boilerplate per component', 'minimal', 'loading/error refs + template branches', 'options object'],
      ['Best for', 'sections shown as a unit, SSR frameworks', 'independent widgets, maximum control', 'lazy code-splitting of heavy components'],
    ],
    note: 'They mix: an async component inside a Suspense is controlled by the boundary unless it sets `suspensible: false`. Background on async components: [defineAsyncComponent](lesson:async-components).',
  },

  quiz: [
    {
      id: 'suspense-q1',
      type: 'mcq',
      prompt: 'Which of these count as async dependencies for a parent `<Suspense>`? **Select all that apply.**',
      options: [
        { text: 'A `<script setup>` component with a top-level `await`' },
        { text: 'An async component from `defineAsyncComponent(() => import(\'./Chart.vue\'))`' },
        { text: 'A component that fetches data inside `onMounted`', why: 'Its setup is synchronous; it renders immediately and loads later. Suspense never knows about it.' },
        { text: 'An async component created with `suspensible: false`', why: 'That option opts the component out of Suspense control; it manages its own loading state.' },
        { text: 'A lazily loaded Vue Router route component', why: 'Router lazy loading uses dynamic imports, not async components, and currently doesn\'t trigger Suspense itself.' },
      ],
      answer: [0, 1],
      explanation: 'Async setup (including top-level await) and suspensible async components are the two kinds of async dependencies.',
    },
    {
      id: 'suspense-q2',
      type: 'output',
      prompt: '`ProfileCard` resolves after 150 ms and `OrdersCard` after 300 ms. What is on screen at **200 ms**?',
      code: {
        lang: 'vue',
        code: `<Suspense>
  <div class="dashboard">
    <ProfileCard />
    <OrdersCard />
  </div>
  <template #fallback>
    <p>Loading…</p>
  </template>
</Suspense>`,
      },
      options: [
        'Only "Loading…"',
        { text: 'The profile card, and "Loading…" where the orders will go', why: 'Suspense doesn\'t show partial trees — it waits for all dependencies.' },
        { text: 'The profile card and an empty orders card', why: 'Nothing from the default tree is displayed until everything resolves.' },
        { text: 'Nothing at all', why: 'The fallback is displayed while pending.' },
      ],
      answer: 0,
      explanation: 'Suspense shows the fallback until the **last** dependency resolves (at 300 ms), then shows the full dashboard at once.',
    },
    {
      id: 'suspense-q3',
      type: 'bug',
      prompt: 'This page shows nothing and Vue warns. What is wrong?',
      code: {
        lang: 'vue',
        code: `<template>
  <Suspense>
    <ProfileCard />
    <OrdersCard />
    <template #fallback>
      <p>Loading…</p>
    </template>
  </Suspense>
</template>`,
      },
      options: [
        'The default slot has two root nodes — wrap ProfileCard and OrdersCard in one element',
        { text: 'The `#fallback` template must come before the default content', why: 'Slot order in the template doesn\'t matter.' },
        { text: 'Suspense needs a `timeout` prop', why: '`timeout` is optional and only matters after the first resolve.' },
        { text: 'Async components can\'t be siblings', why: 'They can — inside a single root element.' },
      ],
      answer: 0,
      explanation: 'Suspense slots expect a single immediate child. Vue warns "<Suspense> slots expect a single root node" and renders nothing.',
    },
    {
      id: 'suspense-q4',
      type: 'fill',
      prompt: 'Fill the blanks: name the loading slot, and the hook a parent uses to catch an async setup error.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, ___ } from 'vue'
const error = ref(null)
onErrorCaptured((err) => { error.value = err; return false })
</script>

<template>
  <p v-if="error">{{ error.message }}</p>
  <Suspense v-else>
    <Dashboard />
    <template ___>Loading…</template>
  </Suspense>
</template>`,
      },
      answer: [['onErrorCaptured'], ['#fallback', 'v-slot:fallback']],
      explanation: '`onErrorCaptured` receives descendants\' errors (returning `false` stops propagation); `#fallback` is the slot shown while pending.',
    },
    {
      id: 'suspense-q5',
      type: 'mcq',
      prompt: 'The dashboard has resolved. Inside it, a tab component swaps to a **different async component** (not the Suspense\'s root). What does Suspense do?',
      options: [
        { text: 'Shows the fallback again until the new component resolves', why: 'Only replacing the default slot\'s root node sends a resolved Suspense back to pending.' },
        { text: 'Nothing — it stays resolved; the nested change is not tracked by this boundary' },
        { text: 'Throws an error', why: 'Nested async components are allowed; they just aren\'t coordinated by an already resolved boundary.' },
        { text: 'Re-renders the whole default tree from scratch', why: 'Vue patches only what changed.' },
      ],
      answer: 1,
      explanation: 'Once resolved, Suspense only reverts to pending when its default root is replaced. For deeper changes, key the root or add a nested `<Suspense>` (optionally `suspensible`, 3.3+).',
    },
    {
      id: 'suspense-q6',
      type: 'mcq',
      prompt: 'Why does the Vue team label `<Suspense>` experimental?',
      options: [
        { text: 'It only works in development builds', why: 'It works in production builds too.' },
        { text: 'It is not guaranteed to become stable and its API may still change' },
        { text: 'It is deprecated and will be removed in Vue 3.6', why: 'It is not deprecated; it is unfinished.' },
        { text: 'It needs Nuxt to run', why: 'It is part of Vue core and works without Nuxt (Nuxt builds on it).' },
      ],
      answer: 1,
      explanation: 'The docs state it\'s not guaranteed to reach stable status and the API may change — so adopt it deliberately and keep usage contained.',
    },
    {
      id: 'suspense-q7',
      type: 'short',
      prompt: 'In two or three sentences: how do you show an error message when an async component inside Suspense fails?',
      answer: 'Suspense has no error slot and simply stays pending when a dependency rejects. A parent (often a reusable ErrorBoundary component) registers onErrorCaptured, stores the error in a ref, returns false to stop propagation, and renders an error message (with a retry that re-mounts the Suspense) instead of the Suspense subtree.',
    },
  ],

  exercises: [
    {
      id: 'error-boundary',
      title: 'An ErrorBoundary with retry',
      difficulty: 'advanced',
      prompt: `
The weather widget awaits \`fetchWeather()\`, which **fails the first time** and succeeds on the next call. Right now the page shows "Checking the sky…" forever.

Implement **ErrorBoundary.vue** (App.vue already wraps the Suspense in it):

- Catch errors from descendants with \`onErrorCaptured\` and **stop them from propagating** further (App has its own \`onErrorCaptured\` that counts leaked errors in \`.leaked\` — it must stay at \`0\`).
- When an error was caught, render \`<div class="error-box">\` containing the error message and \`<button class="retry">Try again</button>\` **instead of** the slot.
- **Try again** clears the error and renders the slot again — re-creating the Suspense and the widget, so the request runs again.
`,
      files: {
        'App.vue': `<script setup>
import { ref, onErrorCaptured } from 'vue'
import ErrorBoundary from './ErrorBoundary.vue'
import WeatherWidget from './WeatherWidget.vue'

// canary: counts errors that escaped the boundary
const leaked = ref(0)
onErrorCaptured(() => {
  leaked.value++
})
</script>

<template>
  <h2>Today</h2>
  <ErrorBoundary>
    <Suspense>
      <WeatherWidget />
      <template #fallback>
        <p class="loading">Checking the sky…</p>
      </template>
    </Suspense>
  </ErrorBoundary>
  <p>Leaked errors: <span class="leaked">{{ leaked }}</span></p>
</template>`,
        'ErrorBoundary.vue': `<script setup>
// TODO: catch descendant errors, show them, allow a retry
</script>

<template>
  <slot />
</template>`,
        'WeatherWidget.vue': `<script setup>
import { fetchWeather } from './api.js'

const weather = await fetchWeather()
</script>

<template>
  <p class="weather">{{ weather.city }}: <span class="temp">{{ weather.temp }}°C</span></p>
</template>`,
        'api.js': `let calls = 0

// Fails on the first call, succeeds afterwards (a flaky service).
export function fetchWeather() {
  calls++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (calls === 1) reject(new Error('Weather service unavailable'))
      else resolve({ city: 'Pune', temp: 18 })
    }, 200)
  })
}`,
      },
      hints: [
        'Keep `const error = ref(null)` in ErrorBoundary and register `onErrorCaptured((err) => { … })`.',
        'Inside the hook, store the error and **return `false`** — that is what stops propagation to App\'s hook and the app error handler.',
        'Template: `<div v-if="error" class="error-box">{{ error.message }} <button class="retry" @click="error = null">Try again</button></div>` and `<slot v-else />`. Removing the slot with `v-if` and bringing it back re-creates everything inside it.',
      ],
      solution: {
        explanation: 'Errors thrown in a descendant\'s async setup travel up the component tree through `errorCaptured` hooks. The boundary catches the error, renders a fallback UI and returns `false` so nothing above it (App\'s canary, the app error handler) sees it. Retrying unmounts the error box and mounts the slot again — a brand-new Suspense and WeatherWidget, so `setup` (and the request) runs again.',
        files: {
          'App.vue': `<script setup>
import { ref, onErrorCaptured } from 'vue'
import ErrorBoundary from './ErrorBoundary.vue'
import WeatherWidget from './WeatherWidget.vue'

// canary: counts errors that escaped the boundary
const leaked = ref(0)
onErrorCaptured(() => {
  leaked.value++
})
</script>

<template>
  <h2>Today</h2>
  <ErrorBoundary>
    <Suspense>
      <WeatherWidget />
      <template #fallback>
        <p class="loading">Checking the sky…</p>
      </template>
    </Suspense>
  </ErrorBoundary>
  <p>Leaked errors: <span class="leaked">{{ leaked }}</span></p>
</template>`,
          'ErrorBoundary.vue': `<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err) => {
  error.value = err
  return false // handled here: don't propagate further
})

function retry() {
  error.value = null // the slot (and everything in it) is mounted again
}
</script>

<template>
  <div v-if="error" class="error-box" role="alert">
    <p>Something went wrong: {{ error.message }}</p>
    <button class="retry" @click="retry">Try again</button>
  </div>
  <slot v-else />
</template>`,
          'WeatherWidget.vue': `<script setup>
import { fetchWeather } from './api.js'

const weather = await fetchWeather()
</script>

<template>
  <p class="weather">{{ weather.city }}: <span class="temp">{{ weather.temp }}°C</span></p>
</template>`,
          'api.js': `let calls = 0

// Fails on the first call, succeeds afterwards (a flaky service).
export function fetchWeather() {
  calls++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (calls === 1) reject(new Error('Weather service unavailable'))
      else resolve({ city: 'Pune', temp: 18 })
    }, 200)
  })
}`,
        },
      },
      tests: [
        { name: 'shows the fallback first', code: `expect(exists('.loading')).toBe(true)` },
        {
          name: 'an error replaces the endless fallback',
          code: `await wait(400)
expect(text('.error-box')).toContain('Weather service unavailable')
expect(exists('.loading')).toBe(false)`,
        },
        {
          name: 'the error does not leak past the boundary',
          code: `await wait(400)
expect(text('.leaked')).toBe('0')`,
        },
        {
          name: 'Try again reloads and succeeds',
          code: `await wait(400)
await click('.retry')
expect(exists('.loading')).toBe(true)
await wait(400)
expect(text('.temp')).toBe('18°C')
expect(exists('.error-box')).toBe(false)`,
        },
      ],
    },
    {
      id: 'suspense-status',
      title: 'Loading status from Suspense events',
      difficulty: 'advanced',
      prompt: `
Two tabs (\`data-tab="News"\` and \`data-tab="Sports"\`) each await their data. Using **Suspense events** and props in App.vue:

- \`<p class="status">\` shows **\`Loading…\`** while Suspense is pending and **\`Loaded\`** once it has resolved.
- \`<p class="loads">\` shows how many times Suspense has resolved (starting at \`0\`).
- When switching tabs, show the fallback (\`.loading\`) **immediately** instead of keeping the previous tab on screen.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import NewsTab from './NewsTab.vue'
import SportsTab from './SportsTab.vue'

const tabs = { News: NewsTab, Sports: SportsTab }
const current = ref('News')
</script>

<template>
  <button v-for="(_, name) in tabs" :key="name" :data-tab="name" @click="current = name">
    {{ name }}
  </button>
  <p class="status">?</p>
  <p class="loads">?</p>

  <Suspense>
    <component :is="tabs[current]" />
    <template #fallback>
      <p class="loading">Loading…</p>
    </template>
  </Suspense>
</template>`,
        'NewsTab.vue': `<script setup>
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await wait(200)
const headline = 'City opens three new libraries'
</script>

<template>
  <p class="headline">{{ headline }}</p>
</template>`,
        'SportsTab.vue': `<script setup>
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await wait(200)
const score = 'Lions 2 – 1 Tigers'
</script>

<template>
  <p class="score">{{ score }}</p>
</template>`,
      },
      hints: [
        'Keep two refs: `const status = ref(\'Loading…\')` and `const loads = ref(0)`, and render them in `.status` and `.loads`.',
        '`<Suspense @pending="status = \'Loading…\'" @resolve="onResolve">`, where `onResolve` sets `status` to `Loaded` and increments `loads`.',
        'Switching `<component :is>` replaces the default root, so Suspense goes pending again — add `timeout="0"` to show the fallback immediately.',
      ],
      solution: {
        explanation: '`pending` fires whenever Suspense enters the pending state — on the first render and when the default root is replaced by a tab switch — and `resolve` when the new content is ready. `timeout="0"` removes the grace period during which the old tab would stay visible.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import NewsTab from './NewsTab.vue'
import SportsTab from './SportsTab.vue'

const tabs = { News: NewsTab, Sports: SportsTab }
const current = ref('News')

const status = ref('Loading…')
const loads = ref(0)

function onResolve() {
  status.value = 'Loaded'
  loads.value++
}
</script>

<template>
  <button v-for="(_, name) in tabs" :key="name" :data-tab="name" @click="current = name">
    {{ name }}
  </button>
  <p class="status">{{ status }}</p>
  <p class="loads">{{ loads }}</p>

  <Suspense timeout="0" @pending="status = 'Loading…'" @resolve="onResolve">
    <component :is="tabs[current]" />
    <template #fallback>
      <p class="loading">Loading…</p>
    </template>
  </Suspense>
</template>`,
          'NewsTab.vue': `<script setup>
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await wait(200)
const headline = 'City opens three new libraries'
</script>

<template>
  <p class="headline">{{ headline }}</p>
</template>`,
          'SportsTab.vue': `<script setup>
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
await wait(200)
const score = 'Lions 2 – 1 Tigers'
</script>

<template>
  <p class="score">{{ score }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'pending at first',
          code: `expect(text('.status')).toBe('Loading…')
expect(text('.loads')).toBe('0')
expect(exists('.loading')).toBe(true)`,
        },
        {
          name: 'loaded after the first resolve',
          code: `await wait(400)
expect(text('.status')).toBe('Loaded')
expect(text('.loads')).toBe('1')
expect(exists('.headline')).toBe(true)`,
        },
        {
          name: 'switching tabs shows the fallback at once and resolves again',
          code: `await wait(400)
await click('[data-tab="Sports"]')
expect(exists('.loading')).toBe(true)
expect(text('.status')).toBe('Loading…')
await wait(400)
expect(text('.status')).toBe('Loaded')
expect(text('.loads')).toBe('2')
expect(exists('.score')).toBe(true)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'suspense-what-is-it',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is `<Suspense>` in Vue 3, what does it wait for, and what is its status?',
      answer: 'An experimental built-in component that shows a `#fallback` slot until every async dependency in its `#default` tree has resolved, then displays the whole tree at once. Async dependencies are components with an async `setup` (in `<script setup>`, any top-level `await`) and async components from `defineAsyncComponent` (suspensible by default). It is experimental: the API may change and isn\'t guaranteed to become stable.',
      explanation: 'It centralises "waiting" at a boundary instead of in each component.',
      whyAsked: 'Checks awareness of newer Vue features and the judgment to mention the experimental status.',
      mistakes: ['Not mentioning it\'s experimental.', 'Claiming it handles errors.', 'Thinking data fetched in `onMounted` triggers it.'],
      followUps: ['How do you handle errors with Suspense?', 'When does a resolved Suspense show the fallback again?'],
      modelAnswer: 'Suspense is a built-in boundary for async component trees. Its default slot renders off-screen; any component with async setup — like a top-level `await` in `<script setup>` — or a suspensible async component registers as a dependency, and Suspense shows the fallback until all of them resolve, then swaps in the whole tree. It\'s still experimental, so I\'d use it at a few boundaries and always pair it with error handling via `onErrorCaptured`, because Suspense itself has no error state.',
    },
    {
      id: 'suspense-endless-spinner',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'In production, a dashboard occasionally shows "Loading…" forever. It is wrapped in `<Suspense>`, and its cards use top-level `await`. What\'s the likely cause and the fix?',
      answer: 'One of the awaited requests rejects (or never settles). A rejected async setup never resolves, so the boundary stays pending — Suspense has no error state. Add an error boundary: a parent component with `onErrorCaptured` that stores the error, returns `false`, and renders an error message with a retry (re-mounting the Suspense). Also add timeouts to requests that can hang, and report errors to monitoring.',
      explanation: 'Suspense only knows "pending" and "resolved". Failure handling must live around it.',
      whyAsked: 'A realistic failure mode that tests understanding of Suspense\'s limits and Vue\'s error propagation.',
      mistakes: ['Increasing the `timeout` prop (unrelated to errors).', 'Wrapping each await in try/catch and returning fake data silently.', 'Not knowing `onErrorCaptured`.'],
      followUps: ['What does returning `false` from `onErrorCaptured` do?', 'How would the retry button work?'],
      modelAnswer: 'Most likely one of the cards\' requests rejects. With async setup, a rejection means that dependency never resolves, so Suspense sits in pending — it has no error state of its own. I\'d wrap the boundary in an ErrorBoundary component: `onErrorCaptured` stores the error and returns `false` to stop propagation, and the template shows a message and a retry that re-mounts the Suspense. I\'d also make sure requests time out instead of hanging and report the error.',
    },
    {
      id: 'suspense-revert-rules',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'After the first load, clicking a "reload" button in a Suspense-wrapped page re-fetches data, but users never see the fallback — the old content just sits there, then updates. Explain the behaviour and how you\'d control it.',
      answer: 'Once resolved, Suspense only re-enters pending if the default slot\'s root node is replaced. If the reload replaces the root (e.g. by changing its `key`), Suspense renders the new tree off-screen and keeps showing the previous content while it loads; the `timeout` prop controls how long before it switches to the fallback (`0` = immediately). If the reload doesn\'t replace the root, Suspense isn\'t involved at all and the component needs its own loading state.',
      explanation: 'Keeping old content avoids flashes for fast reloads; `timeout` tunes that trade-off.',
      whyAsked: 'Distinguishes people who have actually used Suspense from those who know only the happy path.',
      mistakes: ['Thinking any new async work shows the fallback.', 'Not knowing the `timeout` prop.', 'Re-creating the entire Suspense to force a fallback.'],
      followUps: ['What is a nested `<Suspense suspensible>` for?', 'Which events fire during a revert?'],
      modelAnswer: 'A resolved Suspense goes back to pending only when its default root is replaced — for instance by changing its key. Even then, by design it keeps the previous content visible while the new tree resolves off-screen, to avoid flashing a spinner for quick reloads; `timeout` sets how long that lasts, and `timeout="0"` shows the fallback straight away. `pending` fires at the start and `resolve` at the end. If the reload just refetches inside a component without replacing the root, Suspense doesn\'t know about it, so that component needs its own loading indicator.',
    },
    {
      id: 'suspense-no-boundary',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 2,
      question: 'A teammate adds `const user = await fetchUser()` to a component\'s `<script setup>`. Now the component disappears, and Vue warns about a missing boundary. Why, and what are the two ways to fix it?',
      options: [
        'Async setup needs a <Suspense> ancestor — add one, or load the data in onMounted with explicit loading state',
        'Top-level await is not allowed in <script setup>',
        'fetchUser must return a ref',
        'The component needs defineAsyncComponent',
      ],
      correctOption: 0,
      answer: 'A top-level `await` makes `setup` async, and a component with async setup can only be rendered inside a `<Suspense>` boundary — without one, Vue warns and renders nothing. Either wrap it (or an ancestor) in `<Suspense>` with a fallback, or keep setup synchronous and load data in `onMounted` (or a composable) with a `loading` ref.',
      explanation: 'Async setup is a contract with a parent boundary.',
      whyAsked: 'A common surprise when people first try top-level await.',
      mistakes: ['Saying top-level await is invalid.', 'Wrapping the await in an IIFE without understanding the consequences for the template.'],
      followUps: ['Which option would you choose for a reusable component library, and why?'],
      modelAnswer: 'Top-level `await` turns the component\'s setup into an async function, and Vue can only render async-setup components under a `<Suspense>` — otherwise it warns that no boundary was found and renders nothing. I can add a Suspense around it with a fallback, or keep setup synchronous and load the data in `onMounted` or a composable with explicit loading and error refs. For a reusable library component I\'d avoid requiring Suspense, since it\'s experimental and forces a choice on every consumer.',
    },
    {
      id: 'suspense-vs-flags',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare Suspense with per-component loading states (e.g. a `useFetch` composable returning `data`, `loading`, `error`).',
      answer: 'Suspense coordinates many components behind one fallback and removes loading boilerplate from components, but it is experimental, has no built-in error state, and makes components depend on a boundary. Per-component states are stable, explicit and fine-grained (each widget handles its own loading, error and retry) and show content as soon as each part is ready, at the cost of repetition and a page that can pop in piece by piece. Many apps use composables for independent widgets and Suspense (often via a framework like Nuxt) for page-level boundaries.',
      explanation: 'Coordination and less boilerplate vs. stability and granularity.',
      whyAsked: 'Senior engineers are expected to weigh experimental features against stable patterns.',
      mistakes: ['Presenting Suspense as strictly better.', 'Ignoring error handling in either approach.', 'Not mentioning the experimental status.'],
      followUps: ['How would you avoid the "fastest part waits for the slowest" problem with Suspense?'],
      modelAnswer: 'Suspense moves waiting up to a boundary: components just await their data and the parent shows one fallback until everything is ready, which looks clean and cuts boilerplate. But it\'s experimental, it has no error state of its own, and the fastest widget waits for the slowest. A `useFetch`-style composable gives each component explicit loading, error and retry states — stable, granular and testable, but repetitive and prone to pop-in. I\'d use composables for independent widgets and reserve Suspense for sections that should appear as a unit, with an error boundary around each.',
    },
    {
      id: 'suspense-adoption',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your team wants to use `<Suspense>` throughout a large production SPA. What guidance would you give?',
      answer: 'Acknowledge it\'s experimental and contain it: a small number of boundaries (route views, major page sections), each wrapped in a shared ErrorBoundary with retry and error reporting. Follow the documented nesting order with RouterView/Transition/KeepAlive. Keep components usable without it where reasonable (e.g. composables that expose loading/error), keep `defineExpose`/hooks before `await`, avoid request waterfalls with parallel fetching, and use nested `<Suspense suspensible>` (3.3+) only where nested async swaps need it. Add tests for loading, error and retry states, and track Vue release notes for API changes.',
      explanation: 'Experimental features are fine with containment, a fallback plan and tests.',
      whyAsked: 'Tests risk management and architectural judgment around a powerful but unstable API.',
      mistakes: ['Banning it outright without reasons, or adopting it everywhere.', 'No error boundaries.', 'Deeply nesting boundaries without understanding revert rules.'],
      followUps: ['How would you migrate away if the API changed?', 'Where would you put error reporting?'],
      modelAnswer: 'I\'d say yes, but contained. Suspense is experimental, so I\'d limit it to a few boundaries — route views and big page sections — each inside one shared ErrorBoundary that shows an error, offers retry and reports to monitoring. Components keep hooks and `defineExpose` above their awaits, and we fetch in parallel to avoid waterfalls. Nested `suspensible` boundaries only where nested async swaps need them. We\'d test loading, error and retry paths, and because usage is concentrated in a few files, an API change later would be a small migration.',
    },
    {
      id: 'suspense-coding-async-setup',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Refactor `UserCard.vue` to load its user with a **top-level `await`** (no `loading` ref, no `.spinner`), and make App show `<p class="skeleton">Loading profile…</p>` from a `<Suspense>` fallback until the card is ready.',
      starter: {
        files: {
          'App.vue': `<script setup>
import UserCard from './UserCard.vue'
</script>

<template>
  <h2>Profile</h2>
  <UserCard />
</template>`,
          'UserCard.vue': `<script setup>
import { ref, onMounted } from 'vue'
import { fetchUser } from './api.js'

const user = ref(null)
const loading = ref(true)

onMounted(async () => {
  user.value = await fetchUser()
  loading.value = false
})
</script>

<template>
  <p v-if="loading" class="spinner">Loading…</p>
  <section v-else class="user-card">
    <h3 class="user-name">{{ user.name }}</h3>
  </section>
</template>`,
          'api.js': `export function fetchUser() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ name: 'Grace Hopper' }), 200)
  })
}`,
        },
      },
      tests: [
        {
          name: 'the Suspense fallback shows first, with no spinner',
          code: `expect(exists('.skeleton')).toBe(true)
expect(exists('.spinner')).toBe(false)
expect(exists('.user-card')).toBe(false)`,
        },
        {
          name: 'the card appears when the data arrives',
          code: `await wait(400)
expect(text('.user-name')).toBe('Grace Hopper')
expect(exists('.skeleton')).toBe(false)
expect(exists('.spinner')).toBe(false)`,
        },
      ],
      hints: [
        'In UserCard: delete the refs and `onMounted`; write `const user = await fetchUser()` directly in `<script setup>`.',
        'The template no longer needs `v-if` — `user` is always there when the component renders.',
        'In App: `<Suspense><UserCard /><template #fallback><p class="skeleton">Loading profile…</p></template></Suspense>`.',
      ],
      answer: 'Make UserCard await its data at the top level and drop the loading branch; wrap it in Suspense with the skeleton as the fallback.',
      solution: {
        files: {
          'App.vue': `<script setup>
import UserCard from './UserCard.vue'
</script>

<template>
  <h2>Profile</h2>
  <Suspense>
    <UserCard />
    <template #fallback>
      <p class="skeleton">Loading profile…</p>
    </template>
  </Suspense>
</template>`,
          'UserCard.vue': `<script setup>
import { fetchUser } from './api.js'

const user = await fetchUser()
</script>

<template>
  <section class="user-card">
    <h3 class="user-name">{{ user.name }}</h3>
  </section>
</template>`,
          'api.js': `export function fetchUser() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ name: 'Grace Hopper' }), 200)
  })
}`,
        },
      },
      explanation: 'The component becomes simpler — it can assume its data exists — and the parent owns the loading UI. The trade-off: UserCard now *requires* a Suspense ancestor, and error handling must be added around the boundary.',
      whyAsked: 'Checks that you can apply async setup correctly and articulate its trade-offs.',
      mistakes: ['Keeping `v-if="loading"` around (dead code).', 'Forgetting the Suspense boundary, so the card renders nothing.', 'Putting two root nodes in the default slot.'],
      followUps: ['How would you add error handling?', 'What changes if UserCard should also work outside Suspense?'],
      modelAnswer: 'I move the fetch to a top-level `await` in UserCard, which removes the loading ref and the `v-if` — the component only renders once the user exists. In App I wrap it in Suspense with the skeleton in `#fallback`. The trade-off is that UserCard now needs a Suspense ancestor, and I\'d add an error boundary with `onErrorCaptured` around it for failures.',
    },
  ],

  takeaways: [
    '`<Suspense>` is **experimental**: its API may change, so use it at a few deliberate boundaries.',
    'It waits for async dependencies — async-setup components (top-level `await`) and suspensible async components — and shows `#fallback` until all resolve.',
    'Each slot needs a single root node; components with async setup need a Suspense ancestor or they render nothing.',
    'After resolving, it only re-enters pending when the default root is replaced, keeping old content unless `timeout` elapses.',
    'It has no error state: wrap boundaries with `onErrorCaptured` (return `false`) and offer a retry.',
    'Use `pending`/`resolve`/`fallback` events for status, `suspensible: false` to opt async components out, and the RouterView → Transition → KeepAlive → Suspense order.',
  ],
}
