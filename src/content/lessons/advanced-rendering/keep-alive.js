// Lesson: KeepAlive & activation hooks.

const mailApp = `<script setup>
import { ref } from 'vue'
import Compose from './Compose.vue'
import Inbox from './Inbox.vue'
import Settings from './Settings.vue'

const tabs = { Compose, Inbox, Settings }
const current = ref('Compose')
</script>

<template>
  <nav class="tabs">
    <button
      v-for="(_, name) in tabs"
      :key="name"
      :data-tab="name"
      :class="{ active: current === name }"
      @click="current = name"
    >
      {{ name }}
    </button>
  </nav>

  <!-- switching unmounts the old tab and mounts a brand-new one -->
  <component :is="tabs[current]" />
</template>

<style>
.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.tabs .active {
  background: #1a1a1a;
  color: #fff;
}
</style>`

const composeFile = `<script setup>
import { ref } from 'vue'

const draft = ref('')
</script>

<template>
  <section class="compose">
    <textarea v-model="draft" class="draft" rows="4" placeholder="Write an email…"></textarea>
    <p class="chars">{{ draft.length }} characters</p>
  </section>
</template>`

const inboxFile = `<script setup>
import { ref, onMounted } from 'vue'
import { fetchInbox } from './api.js'

const messages = ref([])
const loading = ref(false)
const loads = ref(0)

async function load() {
  loading.value = true
  messages.value = await fetchInbox()
  loads.value++
  loading.value = false
}

onMounted(load)
</script>

<template>
  <section class="inbox">
    <p v-if="loading" class="loading">Loading…</p>
    <ul v-else>
      <li v-for="m in messages" :key="m.id" class="message">{{ m.subject }}</li>
    </ul>
    <p class="loads">Loaded {{ loads }} time(s)</p>
  </section>
</template>`

const settingsFile = `<script setup>
import { ref } from 'vue'

const notifications = ref(true)
</script>

<template>
  <section class="settings">
    <label>
      <input v-model="notifications" type="checkbox" class="notify" />
      Email notifications
    </label>
  </section>
</template>`

const apiFile = `// Simulated API — the sandbox has no network.
const inbox = [
  { id: 1, subject: 'Welcome aboard 👋' },
  { id: 2, subject: 'Your order has shipped' },
  { id: 3, subject: 'Team lunch on Friday?' },
]

export function fetchInbox() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(inbox.map((m) => ({ ...m }))), 200)
  })
}`

const inboxSolved = `<script setup>
import { ref, onMounted, onActivated, onDeactivated, onUnmounted } from 'vue'
import { fetchInbox } from './api.js'

const messages = ref([])
const loading = ref(false)
const loads = ref(0)

async function load() {
  loading.value = true
  messages.value = await fetchInbox()
  loads.value++
  loading.value = false
}

onMounted(() => console.log('mounted: once per instance'))

// first mount AND every time the tab comes back from the cache
onActivated(load)

// when the tab goes into the cache (and on final unmount)
onDeactivated(() => console.log('deactivated: pause timers, sockets…'))

onUnmounted(() => console.log('unmounted: evicted, or KeepAlive removed'))
</script>

<template>
  <section class="inbox">
    <!-- keep old messages on screen while refreshing in the background -->
    <p v-if="loading && !messages.length" class="loading">Loading…</p>
    <ul v-if="messages.length">
      <li v-for="m in messages" :key="m.id" class="message">{{ m.subject }}</li>
    </ul>
    <p class="loads">Loaded {{ loads }} time(s)</p>
  </section>
</template>`

export default {
  id: 'keep-alive',
  title: 'KeepAlive & activation hooks',
  summary: 'Cache components when they are switched away instead of destroying them — and use onActivated/onDeactivated to keep cached components fresh and frugal.',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['dynamic-components', 'lifecycle-hooks'],
  related: ['transitions', 'suspense', 'router-basics', 'render-optimization', 'why-state-management'],
  tags: ['KeepAlive', 'keep-alive', 'component cache', 'onActivated', 'onDeactivated', 'include', 'exclude', 'max', 'tabs', 'RouterView', 'preserve state'],
  apis: [
    { name: '<KeepAlive>', summary: 'Built-in component that caches the component instance it wraps when it is switched out, instead of unmounting it.' },
    { name: 'include / exclude', summary: 'Which components to cache, matched against their `name`: a comma-separated string, a RegExp or an array.' },
    { name: 'max', summary: 'Maximum number of cached instances; the least recently accessed one is destroyed when the limit is exceeded.' },
    { name: 'onActivated()', summary: 'Runs when a cached component is inserted: on first mount and every time it comes back from the cache.' },
    { name: 'onDeactivated()', summary: 'Runs when a cached component is moved into the cache, and when it is finally unmounted.' },
  ],
  docs: [
    { label: 'Vue Guide — KeepAlive', url: 'https://vuejs.org/guide/built-ins/keep-alive.html' },
    { label: 'API — <KeepAlive>', url: 'https://vuejs.org/api/built-in-components.html#keepalive' },
    { label: 'API — onActivated() / onDeactivated()', url: 'https://vuejs.org/api/composition-api-lifecycle.html#onactivated' },
    { label: 'Vue Router — RouterView slot (with KeepAlive)', url: 'https://router.vuejs.org/guide/advanced/router-view-slot.html' },
  ],

  intro: `
When you switch between components with \`<component :is>\` (or between pages with a router), Vue normally **destroys** the old component and builds a fresh one next time. Everything it remembered — a half-written email, a scroll position, a filter, data it fetched — is gone.

\`<KeepAlive>\` changes that. Wrap the switching component in it, and Vue **puts the old instance in a cache** instead of destroying it. Switch back, and you get the very same instance, exactly as you left it.

Because cached components are no longer mounted and unmounted each time, they get two extra lifecycle hooks — \`onActivated\` and \`onDeactivated\` — so they can refresh data or pause work while they're out of sight.
`,

  why: `
Imagine an email app with tabs: Compose, Inbox, Settings. You start writing an email, glance at the Inbox to check an address, come back… and your draft is gone. That's the default behaviour of dynamic components: [switching unmounts](lesson:dynamic-components).

You have a few ways to fix it, each with costs:

- **\`v-show\` every tab** — all tabs are mounted from the start (even ones the user never opens), and they all stay in the page.
- **Lift the state up** into the parent or a [Pinia store](lesson:why-state-management) — great for data that truly is shared, but tedious for purely local UI state like a scroll position or an unsaved textarea.
- **\`<KeepAlive>\`** — tabs are created the first time they're visited, then cached. Local state survives with zero extra code, and you can limit which components and how many are cached.

KeepAlive also saves work: re-creating a heavy component (charts, long lists, an editor) and re-fetching its data on every visit is often the slowest part of tab switching.
`,

  eli15: `
Think about apps on your phone. When you switch from a game to your messages and back, the game is usually right where you left it — paused, not restarted. The phone kept it **in memory**.

\`<KeepAlive>\` does that for parts of your page. Without it, leaving a tab is like *closing* the app: next time it starts from the beginning. With it, leaving a tab is like *switching* apps: it's paused in the background.

Two special moments get announcements:

- **"You're back!"** — \`onActivated\`. A good time to check for new messages.
- **"You're going into the background."** — \`onDeactivated\`. A good time to pause timers or the music.

And just like a phone, you can't keep *everything* open forever — memory runs out. That's what \`max\` is for: when too many are cached, the one you haven't used for the longest is closed for real.
`,

  analogy: {
    title: 'Switching apps vs. closing them',
    body: `
On a phone, closing an app throws away its state; switching away keeps it in memory, paused. When memory gets tight, the system quietly closes the app you used least recently.

\`<component :is>\` alone *closes* the app every time. Wrapped in \`<KeepAlive>\`, it *switches* instead. \`include\`/\`exclude\` decide which apps are allowed to stay in the background, and \`max\` is the memory limit.
`,
    mapping: [
      ['closing an app', 'unmounting the component — state is lost, `setup` runs again next time'],
      ['switching to another app', 'deactivating — the instance is moved into KeepAlive\'s cache'],
      ['coming back to the app', 'activating — the same instance is reinserted (`onActivated`)'],
      ['"pause the music when I leave"', 'stopping timers, polling or media in `onDeactivated`'],
      ['which apps may stay in the background', '`include` / `exclude` (matched by component name)'],
      ['the phone closing the least-used app', '`max` — the least recently accessed cached instance is destroyed'],
    ],
  },

  visual: {
    type: 'rendering-lab',
    props: { mode: 'keep-alive' },
    title: 'KeepAlive, live',
    caption: 'Type into a tab, switch away and back — first without KeepAlive, then with it — and watch the lifecycle log: unmount/mount versus deactivate/activate.',
    alt: 'An interactive demo with tabs. Each tab has an input and a lifecycle log. Without KeepAlive, switching logs unmounted and mounted and the input is cleared. With KeepAlive, switching logs deactivated and activated and the typed text is still there.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Without vs. with KeepAlive',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'tab', label: 'Compose is shown', note: 'draft: "Hi Sam"', tone: 'paper', x: 100, y: 150 },
        { id: 'unmount', label: 'switch → unmounted', note: 'instance destroyed', tone: 'red', x: 330, y: 60 },
        { id: 'remount', label: 'back → mounted again', note: 'setup re-runs, draft: ""', tone: 'red', x: 600, y: 60 },
        { id: 'deact', label: 'switch → deactivated', note: 'DOM moved into the cache', tone: 'cobalt', x: 330, y: 240 },
        { id: 'act', label: 'back → activated', note: 'same instance, draft: "Hi Sam"', tone: 'acid', x: 600, y: 240 },
      ],
      edges: [
        { from: 'tab', to: 'unmount', label: 'no KeepAlive' },
        { from: 'unmount', to: 'remount' },
        { from: 'tab', to: 'deact', label: '<KeepAlive>' },
        { from: 'deact', to: 'act' },
      ],
      steps: [
        { focus: ['tab'], text: 'The Compose tab is on screen and the user has typed "Hi Sam" — state that lives only inside this component instance.' },
        { focus: ['unmount', 'remount'], edges: ['tab->unmount', 'unmount->remount'], text: '**Without KeepAlive**, switching tabs unmounts Compose: its DOM and its state are thrown away. Coming back creates a brand-new instance — `setup` runs again and the draft is empty.' },
        { focus: ['deact'], edges: ['tab->deact'], text: '**With KeepAlive**, switching away *deactivates* Compose: its DOM is detached from the page and kept in memory with the instance. `onDeactivated` runs. Timers and watchers it started keep running unless you pause them.' },
        { focus: ['act'], edges: ['deact->act'], text: 'Coming back *activates* the cached instance: the same DOM is moved back into the page and `onActivated` runs. No `setup`, no `onMounted` — and the draft is still "Hi Sam".' },
      ],
    },
    caption: 'KeepAlive turns unmount/mount into deactivate/activate.',
    alt: 'A diagram starting from a Compose tab with a draft. The upper path, without KeepAlive, goes to unmounted and then mounted again with an empty draft. The lower path, with KeepAlive, goes to deactivated (DOM moved into the cache) and then activated with the same instance and the draft preserved.',
  },

  syntax: [
    `
#### Basic use

Wrap the element that switches components:
`,
    {
      code: `<template>
  <KeepAlive>
    <component :is="tabs[current]" />
  </KeepAlive>
</template>`,
      lang: 'vue',
      title: 'cache every tab',
    },
    `
KeepAlive expects **one direct child component** at a time — a dynamic component, or components toggled with \`v-if\`/\`v-else\`.

#### Choosing what to cache
`,
    {
      code: `<!-- comma-separated string: NO spaces, exact names -->
<KeepAlive include="Compose,Inbox">…</KeepAlive>

<!-- RegExp or array: use v-bind -->
<KeepAlive :include="/^(Compose|Inbox)$/">…</KeepAlive>
<KeepAlive :include="['Compose', 'Inbox']">…</KeepAlive>

<!-- everything except Settings -->
<KeepAlive exclude="Settings">…</KeepAlive>

<!-- at most 5 cached instances (least recently used is destroyed) -->
<KeepAlive :max="5">…</KeepAlive>`,
      lang: 'vue',
      title: 'include, exclude and max',
    },
    `
\`include\`/\`exclude\` match against the component's **\`name\` option**. A \`<script setup>\` component gets a name inferred from its file name (\`Compose.vue\` → \`Compose\`). To choose a different name, use \`defineOptions\`:
`,
    {
      code: `<script setup>
defineOptions({ name: 'ProfileForm' })
</script>`,
      lang: 'vue',
      title: 'naming a <script setup> component',
    },
    {
      callout: 'version',
      title: 'Name inference and defineOptions',
      text: 'Name inference from the file name for `<script setup>` components arrived in Vue 3.2.34; `defineOptions()` needs Vue 3.3+. Before that, you added a separate `<script>` block with `export default { name: \'…\' }`.',
    },
    `
#### Activation hooks
`,
    {
      code: `import { onActivated, onDeactivated } from 'vue'

onActivated(() => {
  // first mount, and every time it comes back from the cache
  refreshIfStale()
  startPolling()
})

onDeactivated(() => {
  // moved into the cache, and also on final unmount
  stopPolling()
})`,
      lang: 'js',
      title: 'onActivated / onDeactivated',
    },
    `
Both hooks also fire for **descendants** inside the cached tree, not just the component KeepAlive wraps directly. Components that are *not* inside a KeepAlive never get them.

#### With Vue Router

Vue Router is a separate library (not part of Vue core). Its \`<RouterView>\` exposes the current route component through a slot, so you can wrap it:
`,
    {
      code: `<RouterView v-slot="{ Component }">
  <KeepAlive :include="['ProductList']">
    <component :is="Component" />
  </KeepAlive>
</RouterView>`,
      lang: 'vue',
      title: 'caching route components',
      static: true,
    },
  ],

  walkthrough: {
    title: 'Inbox.vue (cache-aware)',
    lang: 'vue',
    code: inboxSolved,
    intro: 'This is the Inbox you will build in the playground: cached by KeepAlive, refreshed whenever it comes back, and honest about the four lifecycle moments.',
    steps: [
      { lines: [9, 14], text: '`load()` fetches messages from the simulated API and counts how many times it ran, so you can see refreshes happen.' },
      { lines: [16], text: '`onMounted` runs **once per instance**. With KeepAlive, coming back to the tab does not mount again — so it is the wrong place for "refresh every time I\'m shown".' },
      { lines: [18, 19], text: '`onActivated` runs on the first mount **and** every time the cached tab is shown again. That makes it the right place to refresh data that might be stale.' },
      { lines: [21, 22], text: '`onDeactivated` runs when the tab goes into the cache (and on final unmount). A cached component is still alive: stop timers, polling, sockets and media here.' },
      { lines: [24], text: '`onUnmounted` only runs when the instance is really destroyed — evicted by `max`, excluded later, or because the KeepAlive itself goes away.' },
      { lines: [29, 33], text: 'Stale-while-refresh: the loading message only shows when there is nothing to display yet. On later visits the cached messages stay visible while new ones load.' },
    ],
  },

  playground: {
    title: 'Mail tabs',
    objective: 'Keep the Compose draft alive across tab switches, control what gets cached, and refresh cached data with activation hooks.',
    files: { 'App.vue': mailApp, 'Compose.vue': composeFile, 'Inbox.vue': inboxFile, 'Settings.vue': settingsFile, 'api.js': apiFile },
    expected: 'Three tabs. Type something in **Compose**, open **Inbox** (it shows "Loading…" then three messages), then go back to Compose: your draft is **gone**, and Inbox reloads every time you open it.',
    experiments: [
      {
        id: 'keep-draft',
        task: 'Make the Compose draft survive switching tabs.',
        hint: 'In App.vue, wrap `<component :is="tabs[current]" />` in `<KeepAlive>…</KeepAlive>`.',
        tests: [
          {
            name: 'the draft is still there after visiting Inbox',
            code: `await type('.draft', 'Hi Sam, about Friday…')
await click('[data-tab="Inbox"]')
await click('[data-tab="Compose"]')
expect(find('.draft').value).toBe('Hi Sam, about Friday…')`,
          },
        ],
        explain: 'Switching now deactivates Compose instead of unmounting it. Its DOM and state were kept in KeepAlive\'s cache and simply moved back into the page.',
      },
      {
        id: 'include-compose',
        task: 'Inbox should load fresh data on **every** visit, while Compose stays cached. Cache **only** Compose.',
        hint: 'Use `<KeepAlive include="Compose">`. The name comes from the file name `Compose.vue`.',
        tests: [
          {
            name: 'Compose is cached, Inbox is re-created',
            code: `await type('.draft', 'Draft!')
await click('[data-tab="Inbox"]')
await wait(400)
await click('[data-tab="Compose"]')
expect(find('.draft').value).toBe('Draft!')
await click('[data-tab="Inbox"]')
expect(exists('.loading')).toBe(true)`,
          },
        ],
        explain: '`include` lists component names to cache; everything else is unmounted as usual. Watch out: the string form is split on commas **without trimming**, so `"Compose, Inbox"` would silently fail to match `Inbox`.',
      },
      {
        id: 'refresh-on-activate',
        task: 'Better idea: cache Inbox **too** (so it opens instantly), but refresh it in the background every time it is shown. Old messages should stay visible during the refresh.',
        hint: 'Cache both (remove `include`, or use `include="Compose,Inbox"`). In Inbox.vue, replace `onMounted(load)` with `onActivated(load)`, then show `.loading` only when `loading && !messages.length`, and the list `v-if="messages.length"`.',
        tests: [
          {
            name: 'cached messages show instantly and refresh in the background',
            code: `await click('[data-tab="Inbox"]')
await wait(400)
expect(text('.loads')).toContain('1')
await click('[data-tab="Compose"]')
await click('[data-tab="Inbox"]')
expect(findAll('.message')).toHaveLength(3)
await wait(400)
expect(text('.loads')).toContain('2')`,
          },
        ],
        explain: '`onActivated` fires on the first mount *and* on every return from the cache — exactly "whenever this is shown". Combined with keeping old data on screen, users get an instant tab and fresh data.',
      },
      {
        id: 'log-hooks',
        task: 'In Compose.vue, log `compose activated` in `onActivated` and `compose deactivated` in `onDeactivated` (exactly those strings). Switch to Inbox and back, and read the console.',
        hint: '`import { ref, onActivated, onDeactivated } from \'vue\'`, then `onActivated(() => console.log(\'compose activated\'))` and the same for deactivated. Compose must be cached by KeepAlive for these to fire.',
        tests: [
          {
            name: 'activated on mount and on return, deactivated on leave',
            code: `await click('[data-tab="Inbox"]')
await click('[data-tab="Compose"]')
expect(logs).toContain('compose deactivated')
expect(logs.filter((l) => l === 'compose activated')).toHaveLength(2)`,
          },
        ],
        explain: '`onActivated` ran twice: once for the initial mount and once on return. If Compose weren\'t inside a KeepAlive (or were excluded), neither hook would run at all.',
      },
    ],
  },

  internals: {
    beginner: `
KeepAlive keeps a little cupboard (a cache). When its child component is switched out, instead of destroying it, KeepAlive takes the component's elements off the page, puts them — together with the component instance and all its state — in the cupboard, and tells the component "you're deactivated". When the same component is needed again, KeepAlive takes it out of the cupboard, puts the same elements back on the page, and says "you're activated".
`,
    technical: [
      `
KeepAlive is a built-in component that renders its single child and hooks into the renderer:

- It keeps a \`Map\` from a **cache key** to the child's vnode (which references the component instance). The key is the vnode's \`key\` if it has one, otherwise the component definition itself.
- When the child is switched out, the renderer calls KeepAlive's **deactivate** instead of unmounting: the component's DOM is moved into a detached container element (not in the document), and \`deactivated\` hooks are queued.
- When a cached component is rendered again, the renderer calls **activate**: the stored DOM is moved back into place, the instance is patched with any new props, and \`activated\` hooks are queued.
- \`include\`/\`exclude\` are checked against the component's name; non-matching children are mounted and unmounted normally.
- With \`max\`, cache keys are kept in recency order; when a new entry would exceed the limit, the least recently accessed entry is unmounted for real.
`,
      {
        code: `// A simplified model of KeepAlive's decision — not Vue's real source
function render(child) {
  const name = child.type.name || child.type.__name   // __name: inferred from file
  if (!shouldCache(name, include, exclude)) return child // normal mount/unmount

  const key = child.key ?? child.type
  if (cache.has(key)) {
    child.component = cache.get(key).component   // reuse the SAME instance
    markAsKeptAlive(child)                        // renderer will "activate", not mount
    keys.delete(key); keys.add(key)               // now most recently used
  } else {
    cache.set(key, child)
    keys.add(key)
    if (max && keys.size > max) pruneOldest()     // really unmount the LRU entry
  }
  return child
}`,
        lang: 'js',
        title: 'mental model of KeepAlive',
      },
      `
**A deactivated component is still alive.** Its reactive effects are not stopped: watchers keep firing when their sources change, and \`setInterval\`s or event listeners on \`window\` keep running. That is why \`onDeactivated\` exists.
`,
    ],
    production: `
- **Bound the cache.** Every cached instance keeps its DOM and state in memory. Use \`include\` for the views that benefit and \`max\` as a safety net.
- **Pause work in \`onDeactivated\`.** Polling, WebSockets, animations, media and global listeners should stop while hidden and resume in \`onActivated\`.
- **Refresh in \`onActivated\`.** Cached data goes stale. Refetch (or check a "last updated" timestamp) when the view becomes active again, keeping old data visible meanwhile.
- **Know your cache keys with routing.** Navigating from \`/users/1\` to \`/users/2\` renders the *same* component, so it is simply patched — no activation hooks; watch the route params instead. To cache each user page separately, give the component a key such as \`route.fullPath\` (and bound it with \`max\`).
- **Shared data belongs in a store.** KeepAlive is great for local UI state (drafts, scroll, open panels). Data other parts of the app need should live in [Pinia](lesson:why-state-management), not hidden inside a cached instance.
- **Combine in the right order:** \`<Transition>\` outside, \`<KeepAlive>\` inside: \`<Transition mode="out-in"><KeepAlive><component :is="view" /></KeepAlive></Transition>\`.
`,
  },

  mistakes: [
    {
      title: 'A space after the comma in `include`',
      wrong: { code: `<KeepAlive include="Compose, Inbox">`, lang: 'vue' },
      right: { code: `<KeepAlive include="Compose,Inbox">\n<!-- or -->\n<KeepAlive :include="['Compose', 'Inbox']">`, lang: 'vue' },
      explanation: 'The string is split on commas without trimming, so `" Inbox"` (with a leading space) never matches. The array form avoids the trap.',
    },
    {
      title: 'Using kebab-case or the wrong name',
      wrong: { code: `<!-- component file: UserList.vue -->\n<KeepAlive include="user-list">`, lang: 'vue' },
      right: { code: `<KeepAlive include="UserList">\n<!-- or rename explicitly: defineOptions({ name: 'UserList' }) -->`, lang: 'vue' },
      explanation: 'Matching is an exact comparison with the component\'s `name` (for `<script setup>`, inferred from the file name). Case styles are not converted.',
    },
    {
      title: 'Refreshing in onMounted inside a cached component',
      wrong: { code: `onMounted(loadNotifications) // only runs the first time`, lang: 'js' },
      right: { code: `onActivated(loadNotifications) // first time AND every return`, lang: 'js' },
      explanation: 'A cached component mounts once. If something should happen whenever the view is shown, use `onActivated` — it also runs on the initial mount, so you don\'t need both.',
    },
    {
      title: 'Leaving timers running while cached',
      wrong: { code: `onMounted(() => { timer = setInterval(poll, 5000) })\nonUnmounted(() => clearInterval(timer)) // never runs while cached`, lang: 'js' },
      right: { code: `onActivated(() => { timer = setInterval(poll, 5000) })\nonDeactivated(() => clearInterval(timer))`, lang: 'js' },
      explanation: 'Deactivated components are not unmounted, so `onUnmounted` doesn\'t fire on tab switches. A hidden tab would keep polling the server. Pair start/stop with activate/deactivate.',
    },
    {
      title: 'Caching everything, forever',
      wrong: { code: `<RouterView v-slot="{ Component }">\n  <KeepAlive>\n    <component :is="Component" :key="$route.fullPath" />\n  </KeepAlive>\n</RouterView>`, lang: 'vue' },
      right: { code: `<RouterView v-slot="{ Component }">\n  <KeepAlive :include="['ProductList']" :max="10">\n    <component :is="Component" />\n  </KeepAlive>\n</RouterView>`, lang: 'vue' },
      explanation: 'Keying by full path with no limit caches a new instance for every URL ever visited. Cache the few views that benefit, and cap the size.',
    },
  ],

  debugging: [
    {
      symptom: 'State is still lost when switching, even with `<KeepAlive>`.',
      cause: '`include` doesn\'t match the component\'s name (spaces, kebab-case, a different file name), or the child gets a new `key` each time.',
      fix: 'Check the name in Vue Devtools, use the array form of `include`, set a name with `defineOptions` if needed, and keep keys stable.',
    },
    {
      symptom: '`onActivated` never fires.',
      cause: 'The component isn\'t inside a KeepAlive, or it is excluded, so it is mounted/unmounted normally.',
      fix: 'Make sure the component (or an ancestor) is the cached child of a KeepAlive and matches `include`.',
    },
    {
      symptom: 'A hidden tab keeps making network requests or playing audio.',
      cause: 'Work started in `onMounted` keeps running while the component is deactivated.',
      fix: 'Start it in `onActivated` and stop it in `onDeactivated`.',
    },
    {
      symptom: 'A cached list shows outdated data after editing an item on another page.',
      cause: 'The cached instance kept its old data; nothing told it to refresh.',
      fix: 'Refetch or re-read from a shared store in `onActivated`, or keep the data in a store that the edit page updates.',
    },
    {
      symptom: 'Memory keeps growing as users browse.',
      cause: 'Unbounded caching — often a KeepAlive around `RouterView` keyed by full path.',
      fix: 'Restrict with `include`, set `max`, and avoid per-URL keys unless they are bounded.',
    },
  ],

  bestPractices: [
    'Cache the views where re-creation hurts users (lost drafts, slow re-render, refetching) — not everything.',
    'Use the array form of `include` and set `max` as a safety net.',
    'Refresh data in `onActivated`, keeping the old data visible while it loads.',
    'Pause timers, polling, sockets and media in `onDeactivated`; resume in `onActivated`.',
    'Keep shared data in a store; use KeepAlive for local UI state.',
    'Name components explicitly with `defineOptions({ name })` when the file name isn\'t the name you want to match.',
  ],

  useCases: [
    'Tabbed interfaces where each tab has unsaved input or expensive content.',
    'A product list with filters and scroll position, kept while the user opens product details.',
    'Multi-step wizards where users go back and forth between steps.',
    'Dashboards with heavy charts that are slow to rebuild.',
    'Route views in admin tools where users jump between a list and its detail pages.',
  ],

  whenToUse: {
    use: [
      'Users switch back and forth between a few views and expect them to be as they left them.',
      'A component is expensive to create or to load data for.',
      'The state is local UI state you don\'t want to lift into a store.',
    ],
    avoid: [
      'Views that must always show fresh data and are cheap to rebuild.',
      'Unbounded sets of views (one per URL or record) without `max`.',
      'Data that other components need — put it in a store instead.',
      'Very memory-heavy views on low-end devices, unless measured.',
    ],
  },

  comparison: {
    title: 'Keeping state across switches',
    headers: ['', 'default (`:is` / `v-if`)', '`v-show`', '`<KeepAlive>`', 'lift state to parent / Pinia'],
    rows: [
      ['Local state survives a switch?', 'no', 'yes', 'yes', 'only the state you lift'],
      ['Hidden view\'s DOM', 'destroyed', 'in the page, hidden', 'detached, kept in memory', 'destroyed'],
      ['When views are created', 'on each visit', 'all up front', 'on first visit, then reused', 'on each visit'],
      ['Special hooks', '—', '—', '`onActivated` / `onDeactivated`', '—'],
      ['Memory cost', 'lowest', 'all views at once', 'cached views (bounded by `max`)', 'just the data'],
      ['Best for', 'cheap views', 'a few small toggles', 'tabs and list ↔ detail flows', 'data shared across the app'],
    ],
    note: 'These combine well: cache a view with KeepAlive for its UI state, and keep its shared data in a store.',
  },

  quiz: [
    {
      id: 'keep-alive-q1',
      type: 'mcq',
      prompt: 'Inside `<KeepAlive>`, what happens to a component when the user switches to another tab?',
      options: [
        { text: 'It is unmounted and its state is saved to localStorage', why: 'KeepAlive never touches storage — it keeps the live instance in memory.' },
        { text: 'It is deactivated: its DOM is detached and the instance, with its state, is kept in memory' },
        { text: 'It stays in the page but is hidden with `display: none`', why: 'That is `v-show`. KeepAlive removes the DOM from the page and stores it.' },
        { text: 'It is unmounted, and `setup` re-creates the same state next time', why: 'Nothing is re-created: the very same instance is reused.' },
      ],
      answer: 1,
      explanation: 'KeepAlive caches the component instance and its DOM in a detached container. Switching back reinserts the same instance.',
    },
    {
      id: 'keep-alive-q2',
      type: 'output',
      prompt: '`Profile` logs from four hooks. Everything is wrapped in a plain `<KeepAlive>`. The user goes Profile → Settings → Profile. What does Profile log?',
      code: {
        lang: 'js',
        code: `// Profile.vue
onMounted(() => console.log('mounted'))
onActivated(() => console.log('activated'))
onDeactivated(() => console.log('deactivated'))
onUnmounted(() => console.log('unmounted'))`,
      },
      options: [
        'mounted, activated, deactivated, activated',
        { text: 'mounted, deactivated, activated', why: '`onActivated` also runs on the initial mount.' },
        { text: 'mounted, unmounted, mounted', why: 'That is what happens without KeepAlive.' },
        { text: 'activated, deactivated, activated', why: '`onMounted` still runs once, when the instance is first created.' },
      ],
      answer: 0,
      explanation: 'First visit: mounted, then activated. Leaving: deactivated (not unmounted). Returning: activated again — no second mount.',
    },
    {
      id: 'keep-alive-q3',
      type: 'bug',
      prompt: '`Inbox` loses its state on every switch, but `Compose` is cached fine. Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
import Compose from './Compose.vue'
import Inbox from './Inbox.vue'

const tabs = { Compose, Inbox }
const current = ref('Compose')
</script>

<template>
  <KeepAlive include="Compose, Inbox">
    <component :is="tabs[current]" />
  </KeepAlive>
</template>`,
      },
      answerLine: 11,
      explanation: 'The string is split on commas without trimming, so the second entry is `" Inbox"` — which never matches `Inbox`. Remove the space, or use `:include="[\'Compose\', \'Inbox\']"`.',
    },
    {
      id: 'keep-alive-q4',
      type: 'fill',
      prompt: 'Fill the blanks so a cached live-chat tab only polls while it is visible.',
      code: {
        lang: 'js',
        code: `import { ___, ___ } from 'vue'

let timer
onActivated(() => { timer = setInterval(fetchMessages, 3000) })
onDeactivated(() => clearInterval(timer))`,
      },
      answer: [['onActivated'], ['onDeactivated']],
      explanation: 'Both hooks are imported from `vue`. `onActivated` starts polling on first mount and on every return; `onDeactivated` stops it when the tab is cached.',
    },
    {
      id: 'keep-alive-q5',
      type: 'mcq',
      prompt: '`<KeepAlive :max="2">` already caches `A` and `B` (A was used least recently). The user now opens `C`. What happens?',
      options: [
        { text: 'C is not cached because the limit is reached', why: 'New components are cached; something else makes room.' },
        { text: '`A` is destroyed to make room, and C is cached' },
        { text: '`B` is destroyed because it was cached last', why: 'Eviction is by least recent **access**, not insertion order — B was used more recently than A.' },
        { text: 'Vue throws an error', why: '`max` is a normal limit, not an error condition.' },
      ],
      answer: 1,
      explanation: 'When the cache would exceed `max`, the least recently accessed instance is unmounted for real, and its state is lost.',
    },
    {
      id: 'keep-alive-q6',
      type: 'mcq',
      prompt: 'A component started a `setInterval`, a `watch()` on a store value, and a `window` resize listener in `onMounted`. It is now **deactivated** in a KeepAlive cache. What is still active? **Select all that apply.**',
      options: [
        { text: 'The interval timer' },
        { text: 'The watcher' },
        { text: 'Its DOM inside the visible page', why: 'Its DOM has been moved into a detached container, out of the document.' },
        { text: 'Its local state (refs)' },
        { text: 'The window resize listener' },
      ],
      answer: [0, 1, 3, 4],
      explanation: 'Deactivation only detaches the DOM. The instance is alive: its state is kept, and timers, watchers and global listeners keep running unless you pause them in `onDeactivated`.',
    },
    {
      id: 'keep-alive-q7',
      type: 'short',
      prompt: 'Give two situations where you would **not** use KeepAlive, and say what you would do instead.',
      answer: 'When the view must always show fresh data and is cheap to rebuild — just let it remount (or refetch). When the set of views is unbounded, e.g. one per record or URL — caching would grow memory; keep only the data in a store, or use KeepAlive with a strict include and max. Also, when the state is needed by other components, it belongs in a store (Pinia) rather than inside a cached instance.',
    },
  ],

  exercises: [
    {
      id: 'pause-polling',
      title: 'Pause a live scoreboard while it is hidden',
      difficulty: 'intermediate',
      prompt: `
\`Scores.vue\` polls a (pretend) server every 100 ms, and App caches it with \`<KeepAlive>\`. App shows the total number of requests in \`.polls\`, even while the Scores tab is hidden.

Right now Scores starts polling in \`onMounted\` and stops in \`onUnmounted\` — which never happens on a tab switch. Fix **Scores.vue** so that:

- it polls only while it is **visible** (stop when deactivated, resume when activated);
- its \`minute\` counter keeps its value across switches (it's cached — don't reset it);
- there is never more than **one** interval running.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import Scores from './Scores.vue'
import News from './News.vue'
import { stats } from './stats.js'

const tabs = { Scores, News }
const current = ref('Scores')
</script>

<template>
  <button v-for="(_, name) in tabs" :key="name" :data-tab="name" @click="current = name">
    {{ name }}
  </button>
  <p>Server requests so far: <span class="polls">{{ stats.polls }}</span></p>

  <KeepAlive>
    <component :is="tabs[current]" />
  </KeepAlive>
</template>`,
        'Scores.vue': `<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { stats } from './stats.js'

const minute = ref(0)
let timer = null

function poll() {
  stats.polls++   // pretend: ask the server for the latest score
  minute.value++
}

onMounted(() => {
  timer = setInterval(poll, 100)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<template>
  <section class="scores">
    <h3>Live: Lions 2 – 1 Tigers</h3>
    <p class="minute">Minute {{ minute }}</p>
  </section>
</template>`,
        'News.vue': `<template>
  <section class="news">
    <h3>Headlines</h3>
    <p>Local team wins the cup.</p>
  </section>
</template>`,
        'stats.js': `import { reactive } from 'vue'

// shared, so App can show the request count while Scores is hidden
export const stats = reactive({ polls: 0 })`,
      },
      hints: [
        'Which hooks run every time a cached component is shown or hidden? Not `onMounted`/`onUnmounted`.',
        'Write `start()` and `stop()` functions. `start` creates the interval only if `timer` is `null`; `stop` clears it and sets `timer = null`.',
        'Call `onActivated(start)` and `onDeactivated(stop)`. They also run on the first mount and final unmount, so you can delete the `onMounted`/`onUnmounted` calls.',
      ],
      solution: {
        explanation: 'Activation hooks bracket exactly the time the component is visible, including the first mount and the final unmount. The `if (!timer)` guard plus resetting `timer` to `null` guarantees a single interval, and because the instance is cached, `minute` simply continues where it stopped.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import Scores from './Scores.vue'
import News from './News.vue'
import { stats } from './stats.js'

const tabs = { Scores, News }
const current = ref('Scores')
</script>

<template>
  <button v-for="(_, name) in tabs" :key="name" :data-tab="name" @click="current = name">
    {{ name }}
  </button>
  <p>Server requests so far: <span class="polls">{{ stats.polls }}</span></p>

  <KeepAlive>
    <component :is="tabs[current]" />
  </KeepAlive>
</template>`,
          'Scores.vue': `<script setup>
import { ref, onActivated, onDeactivated } from 'vue'
import { stats } from './stats.js'

const minute = ref(0)
let timer = null

function poll() {
  stats.polls++   // pretend: ask the server for the latest score
  minute.value++
}

function start() {
  if (!timer) timer = setInterval(poll, 100)
}

function stop() {
  clearInterval(timer)
  timer = null
}

onActivated(start)   // first mount + every return from the cache
onDeactivated(stop)  // every trip into the cache + final unmount
</script>

<template>
  <section class="scores">
    <h3>Live: Lions 2 – 1 Tigers</h3>
    <p class="minute">Minute {{ minute }}</p>
  </section>
</template>`,
          'News.vue': `<template>
  <section class="news">
    <h3>Headlines</h3>
    <p>Local team wins the cup.</p>
  </section>
</template>`,
          'stats.js': `import { reactive } from 'vue'

// shared, so App can show the request count while Scores is hidden
export const stats = reactive({ polls: 0 })`,
        },
      },
      tests: [
        {
          name: 'polls while visible',
          code: `await wait(450)
expect(Number(text('.polls'))).toBeGreaterThanOrEqual(3)`,
        },
        {
          name: 'stops polling while hidden',
          code: `await wait(250)
await click('[data-tab="News"]')
const before = Number(text('.polls'))
await wait(400)
expect(Number(text('.polls'))).toBe(before)`,
        },
        {
          name: 'resumes with the minute counter kept',
          code: `await wait(250)
const minute = text('.minute')
await click('[data-tab="News"]')
await wait(300)
await click('[data-tab="Scores"]')
expect(text('.minute')).toBe(minute)
const before = Number(text('.polls'))
await wait(350)
expect(Number(text('.polls'))).toBeGreaterThan(before)`,
        },
        {
          name: 'never runs two intervals at once',
          code: `await click('[data-tab="News"]')
await click('[data-tab="Scores"]')
await click('[data-tab="News"]')
await click('[data-tab="Scores"]')
const before = Number(text('.polls'))
await wait(500)
expect(Number(text('.polls')) - before).toBeLessThanOrEqual(7)`,
        },
      ],
    },
    {
      id: 'cache-by-name',
      title: 'Cache some tabs, not others',
      difficulty: 'intermediate',
      prompt: `
A shop app has three tabs: **Search** (\`SearchPage.vue\`), **Cart** (\`Cart.vue\`) and **Profile** (\`Profile.vue\`). Currently every tab is cached.

- Give \`Profile.vue\` the component name **\`ProfileForm\`** using \`defineOptions\`.
- Change App's \`<KeepAlive>\` to cache **only** \`SearchPage\` and \`ProfileForm\`, using an array for \`include\`.
- Cart must **not** be cached: its quantity (\`.qty\`) should start at 1 again on every visit.

Tabs are buttons with \`data-tab="Search"\`, \`data-tab="Cart"\` and \`data-tab="Profile"\`.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import SearchPage from './SearchPage.vue'
import Cart from './Cart.vue'
import Profile from './Profile.vue'

const tabs = { Search: SearchPage, Cart, Profile }
const current = ref('Search')
</script>

<template>
  <button v-for="(_, name) in tabs" :key="name" :data-tab="name" @click="current = name">
    {{ name }}
  </button>

  <KeepAlive>
    <component :is="tabs[current]" />
  </KeepAlive>
</template>`,
        'SearchPage.vue': `<script setup>
import { ref } from 'vue'
const query = ref('')
</script>

<template>
  <input v-model="query" class="query" placeholder="Search tents, stoves…" />
</template>`,
        'Cart.vue': `<script setup>
import { ref } from 'vue'
const qty = ref(1)
</script>

<template>
  <p>Trail Backpack × <span class="qty">{{ qty }}</span></p>
  <button class="plus" @click="qty++">+</button>
</template>`,
        'Profile.vue': `<script setup>
import { ref } from 'vue'
const nickname = ref('')
</script>

<template>
  <input v-model="nickname" class="nickname" placeholder="Nickname" />
</template>`,
      },
      hints: [
        'A `<script setup>` component\'s name is inferred from its file name: `SearchPage.vue` is `SearchPage`, `Profile.vue` is `Profile` — until you override it.',
        'In Profile.vue: `defineOptions({ name: \'ProfileForm\' })` (no import needed — it is a compiler macro).',
        'In App.vue: `<KeepAlive :include="[\'SearchPage\', \'ProfileForm\']">`. Don\'t forget the colon — an array needs `v-bind`.',
      ],
      solution: {
        explanation: 'KeepAlive compares `include` entries with each component\'s `name`. `SearchPage` is inferred from the file name; `ProfileForm` comes from `defineOptions`. Cart matches neither, so it is mounted and unmounted normally and its quantity resets.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import SearchPage from './SearchPage.vue'
import Cart from './Cart.vue'
import Profile from './Profile.vue'

const tabs = { Search: SearchPage, Cart, Profile }
const current = ref('Search')
</script>

<template>
  <button v-for="(_, name) in tabs" :key="name" :data-tab="name" @click="current = name">
    {{ name }}
  </button>

  <KeepAlive :include="['SearchPage', 'ProfileForm']">
    <component :is="tabs[current]" />
  </KeepAlive>
</template>`,
          'SearchPage.vue': `<script setup>
import { ref } from 'vue'
const query = ref('')
</script>

<template>
  <input v-model="query" class="query" placeholder="Search tents, stoves…" />
</template>`,
          'Cart.vue': `<script setup>
import { ref } from 'vue'
const qty = ref(1)
</script>

<template>
  <p>Trail Backpack × <span class="qty">{{ qty }}</span></p>
  <button class="plus" @click="qty++">+</button>
</template>`,
          'Profile.vue': `<script setup>
import { ref } from 'vue'

defineOptions({ name: 'ProfileForm' })

const nickname = ref('')
</script>

<template>
  <input v-model="nickname" class="nickname" placeholder="Nickname" />
</template>`,
        },
      },
      tests: [
        {
          name: 'the search query survives a switch',
          code: `await type('.query', 'tent')
await click('[data-tab="Cart"]')
await click('[data-tab="Search"]')
expect(find('.query').value).toBe('tent')`,
        },
        {
          name: 'the profile nickname survives a switch',
          code: `await click('[data-tab="Profile"]')
await type('.nickname', 'trailblazer')
await click('[data-tab="Search"]')
await click('[data-tab="Profile"]')
expect(find('.nickname').value).toBe('trailblazer')`,
        },
        {
          name: 'the cart starts fresh on every visit',
          code: `await click('[data-tab="Cart"]')
await click('.plus')
await click('.plus')
expect(text('.qty')).toBe('3')
await click('[data-tab="Search"]')
await click('[data-tab="Cart"]')
expect(text('.qty')).toBe('1')`,
        },
        {
          name: 'Profile is named ProfileForm',
          code: `expect(requireModule('Profile.vue').default.name).toBe('ProfileForm')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'keep-alive-purpose',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What does `<KeepAlive>` do, and what problem does it solve?',
      answer: 'It caches the component instance it wraps when that component is switched out (via `<component :is>`, `v-if`/`v-else` or a router view), instead of unmounting it. Coming back reuses the same instance with its state and DOM, so drafts, filters and scroll positions survive and expensive components don\'t have to be rebuilt or refetch. Cached components get `onActivated`/`onDeactivated` hooks.',
      explanation: 'It turns "destroy and rebuild" into "pause and resume" for switched components.',
      whyAsked: 'A standard Vue question that checks you know the built-ins and when caching is appropriate.',
      mistakes: ['Confusing it with `v-show`.', 'Thinking it persists state to storage or across page reloads.', 'Not mentioning the activation hooks or memory trade-off.'],
      followUps: ['How do you limit what gets cached?', 'Which lifecycle hooks change for cached components?'],
      modelAnswer: 'KeepAlive is a built-in wrapper for components that get swapped — dynamic components, `v-if`/`v-else` branches or route views. Instead of unmounting the old component, it keeps the instance and its DOM in an in-memory cache, and puts the same instance back when it\'s needed again. That preserves local state like drafts and scroll position and avoids re-rendering or refetching. Because they\'re not remounted, cached components use `onActivated` and `onDeactivated`, and I control memory with `include` and `max`.',
    },
    {
      id: 'keep-alive-hook-order',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: '`<KeepAlive include="A">` wraps `<component :is>`. A and B both log every lifecycle hook. The user goes A → B → A. What is logged?',
      options: [
        'A mounted, A activated, A deactivated, B mounted, B unmounted, A activated',
        'A mounted, A unmounted, B mounted, B unmounted, A mounted',
        'A mounted, A activated, A deactivated, B mounted, B activated, B deactivated, A activated',
        'A mounted, B mounted, A activated',
      ],
      correctOption: 0,
      answer: 'A mounted, A activated (first visit) → A deactivated, B mounted (switch; A is cached, B is not) → B unmounted, A activated (switch back). B never gets activation hooks because it isn\'t cached.',
      explanation: 'Only components matching `include` are cached and receive activation hooks; others mount and unmount normally.',
      whyAsked: 'Checks precise understanding of how include interacts with the lifecycle — a frequent source of bugs.',
      mistakes: ['Forgetting that `onActivated` also runs on the first mount.', 'Assuming every child of KeepAlive gets activation hooks.', 'Expecting A to mount twice.'],
      followUps: ['What would change with no `include`?', 'When does A\'s `onUnmounted` run?'],
      modelAnswer: 'A mounts and is activated — activation also fires on first mount. Switching to B deactivates A, since it matches `include`, and mounts B. Switching back unmounts B, because B isn\'t cached, and re-activates A without mounting it again. So: A mounted, A activated, A deactivated, B mounted, B unmounted, A activated.',
    },
    {
      id: 'keep-alive-include-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate writes `<KeepAlive include="order-list, OrderDetail">`. Neither component is cached. The files are `OrderList.vue` and `OrderDetails.vue`. What\'s wrong?',
      answer: 'Three problems: `include` compares exact names, so kebab-case `order-list` doesn\'t match `OrderList`; the string is split on commas without trimming, so `" OrderDetail"` has a leading space; and the second file is `OrderDetails.vue`, so its inferred name is `OrderDetails`, not `OrderDetail`. Use `:include="[\'OrderList\', \'OrderDetails\']"`, or set explicit names with `defineOptions({ name })`.',
      explanation: 'Name matching is exact and literal — no case conversion, no trimming — and `<script setup>` names come from file names.',
      whyAsked: 'A very common real bug; it tests attention to detail and knowledge of name inference.',
      mistakes: ['Only spotting one of the three issues.', 'Thinking Vue normalises case like it does for component tags.', 'Not checking the actual name in Devtools.'],
      followUps: ['Where does a `<script setup>` component\'s name come from?', 'Why might you prefer the array syntax?'],
      modelAnswer: 'KeepAlive matches `include` against component names exactly. `order-list` is kebab-case and won\'t match `OrderList`; the comma-separated string isn\'t trimmed, so the second entry has a leading space; and `OrderDetails.vue` infers the name `OrderDetails`. I\'d switch to the array form with the exact names, and if a file name isn\'t what we want to match, set it with `defineOptions({ name })`. Devtools shows the actual names.',
    },
    {
      id: 'keep-alive-route-params',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'Route views are wrapped in `<RouterView v-slot="{ Component }"><KeepAlive><component :is="Component" /></KeepAlive></RouterView>`. Navigating from `/users/1` to `/users/2` keeps showing user 1, and `onActivated` doesn\'t fire. Why?',
      answer: 'Both URLs render the same component, so Vue just patches the existing instance — it is never deactivated or reactivated, and `setup` doesn\'t run again. Data loaded once in `setup`/`onActivated` therefore stays on user 1. Watch the route param (`watch(() => route.params.id, load, { immediate: true })`) or use `onBeforeRouteUpdate`. If you want separate cached instances per user, key the component (`:key="route.fullPath"`) and bound the cache with `max`.',
      explanation: 'KeepAlive caches by component (or key), not by URL. Same component + no key = same instance.',
      whyAsked: 'Combines router behaviour (component reuse) with KeepAlive caching keys — a classic production bug.',
      mistakes: ['Blaming KeepAlive alone — the same reuse happens without it.', 'Keying by `fullPath` without a `max`.', 'Reloading the page as a "fix".'],
      followUps: ['What are the memory implications of keying by full path?', 'How would you restore scroll position per user page?'],
      modelAnswer: 'Going from `/users/1` to `/users/2` renders the same route component, so Vue patches the existing instance — it isn\'t deactivated or remounted, so neither `setup` nor `onActivated` runs. That happens even without KeepAlive. The fix is to react to the param: a watcher on `route.params.id` with `immediate`, or `onBeforeRouteUpdate`. If I actually want one cached instance per user, I key the component by the path, which makes KeepAlive treat each as a separate entry — and then I add `max` so the cache stays bounded.',
    },
    {
      id: 'keep-alive-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'An admin app has dozens of routes. Product wants "pages should remember where I was" when users go back. How would you design caching?',
      answer: 'Decide per route: add a route meta flag (e.g. `meta.keepAlive`) for list-like views where state matters, and build the `include` array from those component names. Wrap `<RouterView>` with `<KeepAlive :include="cachedNames" :max="N">`. In cached views, refresh in `onActivated` (stale-while-refresh) and pause polling/sockets in `onDeactivated`. Keep shared data (current user, entities) in Pinia so caches don\'t hold diverging copies. Handle scroll via the router\'s `scrollBehavior` with saved positions. Measure memory on target devices and adjust `max`.',
      explanation: 'Caching is a per-view product decision with memory costs; make it explicit, bounded and observable.',
      whyAsked: 'Senior-level: balances UX, memory, data freshness and maintainability across many routes.',
      mistakes: ['Wrapping every route in KeepAlive with no limit.', 'Duplicating server data inside cached components instead of a store.', 'Forgetting to pause background work.'],
      followUps: ['How would you evict a cached view after the user logs out?', 'How do you test that a view refreshes on activation?'],
      modelAnswer: 'I\'d make caching opt-in per route with a meta flag, and derive KeepAlive\'s `include` list from the flagged component names, with a `max` as a safety net. Cached views follow two rules: refresh in `onActivated` while still showing the old data, and stop polling or sockets in `onDeactivated`. Shared entities live in Pinia so cached pages don\'t hold stale copies. Scroll restoration goes through the router\'s `scrollBehavior`. And I\'d check memory on realistic devices before raising `max`.',
    },
    {
      id: 'keep-alive-vs-alternatives',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `v-show`, `<KeepAlive>` and lifting state into a Pinia store for preserving tab state.',
      answer: '`v-show` mounts every tab up front and keeps all of them in the page, hidden — simple, but pays the cost of tabs never opened. `<KeepAlive>` creates tabs lazily on first visit and caches their instances and DOM off-page, preserving all local state with no extra code, with activation hooks and `include`/`max` controls. A store preserves only the data you move into it; components still remount, which is cheaper in memory and makes the data available elsewhere.',
      explanation: 'They trade upfront cost, memory and explicitness differently.',
      whyAsked: 'Shows you can pick the right tool rather than defaulting to one.',
      mistakes: ['Saying KeepAlive and v-show are the same.', 'Moving purely local UI state into a global store by default.', 'Ignoring that `v-show` mounts everything immediately.'],
      followUps: ['Can you combine KeepAlive with a store?', 'Which would you pick for a 3-tab settings dialog?'],
      modelAnswer: '`v-show` renders all tabs immediately and hides the inactive ones — fine for a few cheap tabs, wasteful otherwise. KeepAlive builds each tab the first time it\'s opened and caches the live instance off-page, so local state like scroll position or a draft survives with no extra code, and I get activation hooks plus `include`/`max`. A store keeps only the data I lift into it; the component itself still remounts, which costs less memory and makes the data available elsewhere. I often combine KeepAlive for UI state with a store for shared data.',
    },
    {
      id: 'keep-alive-coding-unsaved-dot',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Show an "unsaved draft" dot on the Compose tab while the user is away from Compose with a non-empty draft. Compose is cached by KeepAlive. Compose should emit `draft-status` with `true`/`false`; App renders `<span class="dot">` inside the Compose tab button when it\'s `true`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import Compose from './Compose.vue'
import Inbox from './Inbox.vue'

const tabs = { Compose, Inbox }
const current = ref('Compose')
</script>

<template>
  <button v-for="(_, name) in tabs" :key="name" :data-tab="name" @click="current = name">
    {{ name }}
  </button>

  <KeepAlive>
    <component :is="tabs[current]" />
  </KeepAlive>
</template>`,
          'Compose.vue': `<script setup>
import { ref } from 'vue'

const draft = ref('')
</script>

<template>
  <textarea v-model="draft" class="draft"></textarea>
</template>`,
          'Inbox.vue': `<template>
  <p class="inbox">No new messages.</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'leaving with a draft shows the dot',
          code: `await type('.draft', 'Dear landlord…')
await click('[data-tab="Inbox"]')
expect(exists('[data-tab="Compose"] .dot')).toBe(true)`,
        },
        {
          name: 'returning to Compose hides the dot',
          code: `await type('.draft', 'Dear landlord…')
await click('[data-tab="Inbox"]')
await click('[data-tab="Compose"]')
expect(exists('[data-tab="Compose"] .dot')).toBe(false)`,
        },
        {
          name: 'leaving with an empty draft shows no dot',
          code: `await click('[data-tab="Inbox"]')
expect(exists('[data-tab="Compose"] .dot')).toBe(false)`,
        },
      ],
      hints: [
        'Compose: `const emit = defineEmits([\'draft-status\'])`.',
        '`onDeactivated(() => emit(\'draft-status\', draft.value.trim() !== \'\'))` and `onActivated(() => emit(\'draft-status\', false))`.',
        'App: keep `const hasDraft = ref(false)`, listen with `@draft-status="(v) => (hasDraft = v)"` on `<component>`, and render `<span v-if="name === \'Compose\' && hasDraft" class="dot">●</span>` inside the button.',
      ],
      answer: 'Emit the draft status from `onDeactivated` (true if non-empty) and `onActivated` (false), and let App render the dot from that state.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import Compose from './Compose.vue'
import Inbox from './Inbox.vue'

const tabs = { Compose, Inbox }
const current = ref('Compose')
const hasDraft = ref(false)
</script>

<template>
  <button v-for="(_, name) in tabs" :key="name" :data-tab="name" @click="current = name">
    {{ name }}
    <span v-if="name === 'Compose' && hasDraft" class="dot">●</span>
  </button>

  <KeepAlive>
    <component :is="tabs[current]" @draft-status="(v) => (hasDraft = v)" />
  </KeepAlive>
</template>`,
          'Compose.vue': `<script setup>
import { ref, onActivated, onDeactivated } from 'vue'

const emit = defineEmits(['draft-status'])
const draft = ref('')

onDeactivated(() => emit('draft-status', draft.value.trim() !== ''))
onActivated(() => emit('draft-status', false))
</script>

<template>
  <textarea v-model="draft" class="draft"></textarea>
</template>`,
          'Inbox.vue': `<template>
  <p class="inbox">No new messages.</p>
</template>`,
        },
      },
      explanation: 'The cached Compose instance still exists while hidden, so it can tell its parent about its state at the exact moments it is hidden and shown. Listeners passed through `<component :is>` only reach components that declare the event.',
      whyAsked: 'Tests activation hooks in a realistic UX feature and component communication through KeepAlive.',
      mistakes: ['Using `onUnmounted`, which never fires on tab switches here.', 'Reading the child\'s state from the parent through a template ref on every render.', 'Forgetting to clear the dot when returning.'],
      followUps: ['How would you warn before the user closes the window with an unsaved draft?', 'Would you move the draft into a store instead? When?'],
      modelAnswer: 'Because Compose is cached, leaving the tab deactivates it rather than unmounting it. So in `onDeactivated` I emit whether the draft is non-empty, and in `onActivated` I emit false since the user can see it again. App keeps a `hasDraft` flag updated from that event and renders the dot in the Compose tab when it\'s true.',
    },
  ],

  takeaways: [
    '`<KeepAlive>` caches switched-out component instances instead of unmounting them — local state and DOM survive.',
    'Cached components are deactivated (DOM detached, instance alive) and activated (same instance reinserted).',
    '`onActivated` runs on first mount and every return; `onDeactivated` on every trip into the cache and on final unmount.',
    'A deactivated component keeps running timers, watchers and listeners — pause work in `onDeactivated`.',
    '`include`/`exclude` match component names exactly (no trimming, no case conversion); `max` evicts the least recently used.',
    'Cache what benefits users, bound it, refresh on activation, and keep shared data in a store.',
  ],
}
