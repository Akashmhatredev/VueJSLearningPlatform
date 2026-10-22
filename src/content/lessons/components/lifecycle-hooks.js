// Lesson: Lifecycle hooks & ordering

const tickerJs = `// A tiny helper around setInterval that counts running timers,
// so leaks become visible. (Simplified — real code would usually call
// setInterval/clearInterval directly or use a composable.)
export const active = { count: 0 }

export function startTicker(callback, ms) {
  const id = setInterval(callback, ms)
  active.count++
  return function stop() {
    clearInterval(id)
    active.count--
  }
}`

const lcApp = `<script setup>
import { ref, onMounted, onUpdated } from 'vue'
import LiveClock from './LiveClock.vue'

const showClock = ref(true)
const city = ref('London')

console.log('App: setup')
onMounted(() => console.log('App: mounted'))
onUpdated(() => console.log('App: updated'))
</script>

<template>
  <button class="toggle" @click="showClock = !showClock">
    {{ showClock ? 'Hide' : 'Show' }} clock
  </button>
  <button class="city" @click="city = city === 'London' ? 'Tokyo' : 'London'">
    Switch city
  </button>
  <LiveClock v-if="showClock" :city="city" />
</template>`

const liveClock = `<script setup>
import { ref, onBeforeMount, onMounted } from 'vue'
import { startTicker } from './ticker.js'

defineProps({ city: String })

const seconds = ref(0)
const face = ref(null) // template ref to the <p> below
let stopTicker = null

console.log('Clock: setup')

onBeforeMount(() => {
  console.log('Clock: beforeMount — element exists?', face.value !== null)
})

onMounted(() => {
  console.log('Clock: mounted — element exists?', face.value !== null)
  stopTicker = startTicker(() => seconds.value++, 1000)
})
</script>

<template>
  <p ref="face" class="clock">{{ city }} — open for {{ seconds }}s</p>
</template>`

const draftFiles = {
  'App.vue': `<script setup>
import { ref } from 'vue'
import DraftEditor from './DraftEditor.vue'

const editing = ref(true)
</script>

<template>
  <button class="toggle" @click="editing = !editing">{{ editing ? 'Close' : 'Open' }} editor</button>
  <DraftEditor v-if="editing" />
</template>`,
}

const boundaryFiles = {
  'App.vue': `<script setup>
import { ref } from 'vue'
import ErrorBoundary from './ErrorBoundary.vue'
import WeatherWidget from './WeatherWidget.vue'

const broken = ref(false)
</script>

<template>
  <h3>Dashboard</h3>
  <button class="break" @click="broken = true">Break the widget</button>
  <ErrorBoundary>
    <WeatherWidget :broken="broken" />
  </ErrorBoundary>
  <p class="footer">The rest of the page keeps working.</p>
</template>`,
  'WeatherWidget.vue': `<script setup>
const props = defineProps({ broken: Boolean })

function temperature() {
  if (props.broken) throw new Error('Weather service returned garbage')
  return '21°C'
}
</script>

<template>
  <p class="widget">Today: {{ temperature() }}</p>
</template>`,
}

export default {
  id: 'lifecycle-hooks',
  title: 'Lifecycle hooks & ordering',
  summary: 'Run code at the right moments of a component\'s life — before and after mounting, updating and unmounting — know the exact parent/child order, and always clean up after yourself.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['why-components', 'ref'],
  related: ['template-refs', 'watch', 'next-tick', 'keep-alive', 'error-handling', 'composables-intro', 'dynamic-components'],
  tags: ['lifecycle', 'onMounted', 'onUnmounted', 'onBeforeMount', 'onBeforeUpdate', 'onUpdated', 'onBeforeUnmount', 'onErrorCaptured', 'cleanup', 'memory leaks', 'hook order'],
  apis: [
    { name: 'onBeforeMount()', summary: 'Runs right before the component\'s DOM is created and inserted.' },
    { name: 'onMounted()', summary: 'Runs after the component\'s DOM (and its synchronous children) is in place — the first safe moment for DOM access.' },
    { name: 'onBeforeUpdate() / onUpdated()', summary: 'Run before / after the component re-renders because of a reactive change.' },
    { name: 'onBeforeUnmount() / onUnmounted()', summary: 'Run before / after the component is removed — the place to clean up timers, listeners and connections.' },
    { name: 'onErrorCaptured()', summary: 'Captures errors thrown by descendant components; return false to stop propagation.' },
  ],
  docs: [
    { label: 'Vue Guide — Lifecycle Hooks', url: 'https://vuejs.org/guide/essentials/lifecycle.html' },
    { label: 'API — Composition API: Lifecycle Hooks', url: 'https://vuejs.org/api/composition-api-lifecycle.html' },
    { label: 'API — Options: Lifecycle', url: 'https://vuejs.org/api/options-lifecycle.html' },
  ],

  intro: `
Every component instance has a **life**: it is created, its DOM is put on the page (*mounted*), it re-renders when its data changes (*updated*), and one day it is removed (*unmounted*).

**Lifecycle hooks** let you run your own code at those moments. \`onMounted(() => …)\` says "call this once my DOM is on the page". \`onUnmounted(() => …)\` says "call this when I'm gone — time to clean up".

You'll use \`onMounted\` and \`onUnmounted\` constantly: to measure or focus elements, start and stop timers, connect to services, and set up third-party libraries. This lesson also nails down the exact **order** hooks run in for parents and children — a favourite interview question and a real debugging tool.
`,

  why: `
\`<script setup>\` runs **before** the component has any DOM. If you try to focus an input there, it doesn't exist yet. If you start a \`setInterval\` there and never stop it, it keeps running after the component disappears — wasting battery, firing requests, and sometimes throwing errors because it touches things that no longer exist. That's a **memory leak**.

Lifecycle hooks give you precise moments:

- "My DOM exists now" → \`onMounted\`: focus, measure, attach a chart library.
- "I'm about to be removed" / "I'm gone" → \`onBeforeUnmount\` / \`onUnmounted\`: clear timers, remove listeners, close sockets.
- "I just re-rendered" → \`onUpdated\`: rare, but useful for syncing with non-Vue code.

Getting these right is the difference between components that come and go cleanly and an app that gets slower the longer it's open.
`,

  eli15: `
Think about putting on a play.

- **Setup** is rehearsal: the actor learns their lines (your \`<script setup>\` code runs, refs are created). Nobody in the audience can see them yet.
- **Before mount** is standing behind the curtain, about to walk on.
- **Mounted** is being on stage — now the audience sees you, and you can interact with the set (the DOM).
- **Updated** is every time the scene changes and you adjust.
- **Before unmount / unmounted** is the end of the show: before you leave, you switch off the props you turned on — the fog machine, the spotlight. If you forget, the fog machine keeps running in an empty theatre.

Lifecycle hooks are notes in the script: "when you get on stage, turn on the fog machine; when you leave, switch it off."
`,

  analogy: {
    title: 'An actor\'s night at the theatre',
    body: `
An actor rehearses backstage, waits in the wings, performs on stage, adapts as scenes change, and finally exits — switching off anything they turned on during the show. Scenes with several actors follow a strict order: the lead can only take a bow once every supporting actor is on stage.
`,
    mapping: [
      ['rehearsing backstage', '`setup` / `<script setup>` — state exists, no DOM yet'],
      ['waiting in the wings', '`onBeforeMount`'],
      ['on stage, visible to the audience', '`onMounted` — the DOM is in the page'],
      ['adjusting when the scene changes', '`onBeforeUpdate` / `onUpdated`'],
      ['last lines before exiting', '`onBeforeUnmount` — still fully functional'],
      ['gone; props switched off', '`onUnmounted` — cleanup done'],
      ['the lead bows after the supporting cast is on stage', 'a parent\'s `onMounted` runs after its children\'s'],
    ],
  },

  visual: {
    type: 'lifecycle',
    props: { withChild: true },
    title: 'Watch the hooks fire',
    caption: 'Mount, update and unmount a real parent with a child, and watch each hook fire in order — including which ones run first for the child.',
    alt: 'An interactive timeline with a parent and child component. Buttons mount, update and unmount them; each lifecycle hook appears in the timeline as it fires, showing parent and child hooks interleaved in their real order.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Parent and child: the exact order',
    props: {
      width: 760,
      height: 340,
      layout: 'column',
      nodes: [
        { id: 'p-setup', label: 'Parent: setup', tone: 'acid', x: 150, y: 40 },
        { id: 'p-bm', label: 'Parent: onBeforeMount', x: 150, y: 110 },
        { id: 'c-setup', label: 'Child: setup', tone: 'cobalt', x: 420, y: 110 },
        { id: 'c-bm', label: 'Child: onBeforeMount', tone: 'cobalt', x: 420, y: 180 },
        { id: 'c-m', label: 'Child: onMounted', tone: 'cobalt', x: 420, y: 250 },
        { id: 'p-m', label: 'Parent: onMounted', tone: 'acid', x: 150, y: 310 },
        { id: 'teardown', label: 'unmount: parent before → children before → children un → parent un', note: 'cleanup order', tone: 'red', x: 610, y: 320 },
      ],
      edges: [
        { from: 'p-setup', to: 'p-bm' },
        { from: 'p-bm', to: 'c-setup', label: 'render reaches <Child>' },
        { from: 'c-setup', to: 'c-bm' },
        { from: 'c-bm', to: 'c-m', label: 'child DOM ready' },
        { from: 'c-m', to: 'p-m', label: 'all children mounted' },
      ],
      steps: [
        { focus: ['p-setup'], text: 'The parent\'s `setup` runs first: refs are created, hooks are *registered* (not run).' },
        { focus: ['p-bm'], edges: ['p-setup->p-bm'], text: '`onBeforeMount`: the parent is about to render. Its template refs are still `null`.' },
        { focus: ['c-setup', 'c-bm'], edges: ['p-bm->c-setup', 'c-setup->c-bm'], text: 'While rendering, the parent meets `<Child>`, so the child is created: child `setup`, then child `onBeforeMount`.' },
        { focus: ['c-m'], edges: ['c-bm->c-m'], text: 'The child\'s DOM is built: child `onMounted` fires **first**.' },
        { focus: ['p-m'], edges: ['c-m->p-m'], text: 'Only when all its synchronous children are mounted does the parent\'s `onMounted` run. Updates follow the same shape: parent `onBeforeUpdate` → child `onBeforeUpdate` → child `onUpdated` → parent `onUpdated`.' },
        { focus: ['teardown'], text: 'Unmounting: parent `onBeforeUnmount` → each child\'s `onBeforeUnmount` → each child\'s `onUnmounted` → parent `onUnmounted`. "Before" hooks go top-down; "after" hooks bottom-up.' },
      ],
    },
    caption: 'Hooks are registered in setup and called in a strict order; children finish mounting before their parent.',
    alt: 'A stepped diagram of mount order: Parent setup, Parent onBeforeMount, Child setup, Child onBeforeMount, Child onMounted, then Parent onMounted. A note shows the unmount order: parent before-unmount, children before-unmount, children unmounted, parent unmounted.',
  },

  syntax: [
    `
Import the hooks from \`vue\` and call them **synchronously** inside \`<script setup>\` (or \`setup()\`). Each takes a callback:
`,
    {
      code: `<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const input = ref(null)          // template ref
let timer

onMounted(() => {
  input.value.focus()            // the DOM exists now
  timer = setInterval(saveDraft, 5000)
})

onUnmounted(() => {
  clearInterval(timer)           // always undo what you started
})
</script>

<template>
  <input ref="input" />
</template>`,
      lang: 'vue',
      title: 'the everyday pair',
    },
    `
**All the hooks:**

| Hook | When it runs | Typical use |
|---|---|---|
| \`setup\` / \`<script setup>\` | when the instance is created, before any DOM | create state, register hooks, start data fetching |
| \`onBeforeMount\` | right before the first render is inserted | rarely needed |
| \`onMounted\` | after the component's DOM and its synchronous children are in place | DOM access, measuring, focusing, third-party libraries, timers |
| \`onBeforeUpdate\` | before re-rendering after a reactive change | read the DOM state *before* Vue patches it |
| \`onUpdated\` | after the re-render has been applied to the DOM | sync with non-Vue code (never change state here) |
| \`onBeforeUnmount\` | before removal — the instance still works | start cleanup while everything is still available |
| \`onUnmounted\` | after removal — children unmounted, effects stopped | clear timers, remove listeners, close connections |
| \`onErrorCaptured\` | when a descendant component throws | error boundaries, reporting |
| \`onActivated\` / \`onDeactivated\` | when a [KeepAlive](lesson:keep-alive)-cached component is shown/hidden | pause/resume work |

\`onRenderTracked\` / \`onRenderTriggered\` are development-only debugging hooks, and \`onServerPrefetch\` is for server-side rendering.

**The rules:**

1. Register hooks **synchronously during setup**. They can be called from a helper function or composable, as long as that call happens synchronously while setup runs — not inside \`setTimeout\` or after an \`await\` in a plain function.
2. You can register the same hook several times; the callbacks run in registration order.
3. Mount, update and unmount hooks **don't run during server-side rendering** — only in the browser.
4. Anything you start manually (timers, \`window\` listeners, sockets, library instances), you stop manually. Watchers and computeds created synchronously in setup are stopped for you on unmount.
`,
    {
      code: `// Options API equivalents
export default {
  beforeCreate() {}, created() {},      // ≈ setup()
  beforeMount() {}, mounted() {},
  beforeUpdate() {}, updated() {},
  beforeUnmount() {}, unmounted() {},   // Vue 2 called these beforeDestroy / destroyed
  errorCaptured(err, instance, info) {},
}`,
      lang: 'js',
      title: 'Options API names',
    },
    `
**Catching errors from children** with \`onErrorCaptured\` — a simple *error boundary*:
`,
    {
      code: `<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  error.value = err
  return false          // stop the error from propagating further up
})
</script>

<template>
  <p v-if="error" class="fallback">Something went wrong.</p>
  <slot v-else />
</template>`,
      lang: 'vue',
      title: 'ErrorBoundary.vue',
    },
    {
      callout: 'tip',
      title: 'onUpdated vs nextTick vs watch',
      text: 'To run code after the DOM reflects *one specific* change, prefer `await nextTick()` right after the change ([nextTick](lesson:next-tick)) or a `watch` with `flush: \'post\'` ([watch](lesson:watch)). `onUpdated` fires after *every* re-render of the component, for any reason.',
    },
  ],

  walkthrough: {
    title: 'LiveClock.vue',
    lang: 'vue',
    code: liveClock,
    intro: 'A clock that logs its lifecycle and starts a timer. It has a bug: it never stops the timer.',
    steps: [
      { lines: [2], text: 'Lifecycle hooks are plain functions imported from `vue`.' },
      { lines: [7, 9], text: 'State and a **template ref** (`face`), plus a variable to hold the "stop" function of our timer.' },
      { lines: [11], text: 'Runs once per instance, during setup — before any hook. Watch the console order when the page loads.' },
      { lines: [13, 15], text: '`onBeforeMount`: about to render. The template ref is still `null` — there is no `<p>` yet.' },
      { lines: [17, 20], text: '`onMounted`: the `<p>` exists, so the ref is filled. This is where the timer starts…' },
      { lines: [21], text: '…and here is the bug: there is **no** `onUnmounted` (or `onBeforeUnmount`) that stops it. Hide the clock and the timer keeps running.' },
    ],
  },

  playground: {
    title: 'A clock with a lifecycle',
    objective: 'Read the console to see hooks fire in order, fix a timer leak, and verify the exact parent/child order for updates and unmounts.',
    files: { 'App.vue': lcApp, 'LiveClock.vue': liveClock, 'ticker.js': tickerJs },
    expected: 'A clock counting seconds. The console shows **App: setup → Clock: setup → Clock: beforeMount (element exists? false) → Clock: mounted (element exists? true) → App: mounted**. Every second the clock re-renders; "Switch city" changes its `city` prop.',
    experiments: [
      {
        id: 'cleanup',
        task: 'Fix the leak: when the clock is hidden, its timer must stop. Use the `stopTicker` function returned by `startTicker`.',
        hint: 'Import `onUnmounted` (or `onBeforeUnmount`) and add `onUnmounted(() => stopTicker())`.',
        tests: [
          {
            name: 'the timer runs while the clock is shown',
            code: `expect(requireModule('ticker.js').active.count).toBe(1)`,
          },
          {
            name: 'hiding the clock stops its timer',
            code: `await click('.toggle')
expect(requireModule('ticker.js').active.count).toBe(0)`,
          },
          {
            name: 'showing it again starts exactly one timer',
            code: `await click('.toggle')
await click('.toggle')
expect(requireModule('ticker.js').active.count).toBe(1)`,
          },
        ],
        explain: 'Vue stops what *it* created for the component (render effect, watchers, computeds) — but `setInterval` belongs to the browser. Without cleanup, every show/hide cycle adds another running timer that updates a component nobody can see.',
      },
      {
        id: 'unmount-order',
        task: 'Predict, then verify, the order when the clock is hidden. Add logs: `Clock: beforeUnmount` and `Clock: unmounted` in `LiveClock`, and `App: beforeUpdate` in `App` (with `onBeforeUpdate`). Click **Hide clock** and read the console.',
        hint: 'In App: `onBeforeUpdate(() => console.log(\'App: beforeUpdate\'))`. In LiveClock: `onBeforeUnmount(() => console.log(\'Clock: beforeUnmount\'))` and `onUnmounted(() => console.log(\'Clock: unmounted\'))`.',
        tests: [
          {
            name: 'App: beforeUpdate → Clock: beforeUnmount → Clock: unmounted → App: updated',
            code: `logs.length = 0
await click('.toggle')
const order = ['App: beforeUpdate', 'Clock: beforeUnmount', 'Clock: unmounted', 'App: updated'].map((m) => logs.indexOf(m))
expect(order.every((i) => i !== -1)).toBe(true)
expect(order[0]).toBeLessThan(order[1])
expect(order[1]).toBeLessThan(order[2])
expect(order[2]).toBeLessThan(order[3])`,
          },
        ],
        explain: 'Hiding the clock is an **update of App** (its `v-if` changed). During that update, the clock is unmounted — so the child\'s unmount hooks run *inside* the parent\'s update, between App\'s `beforeUpdate` and `updated`.',
      },
      {
        id: 'update-order',
        task: 'Now prove the order for a **prop change**. Add `onBeforeUpdate` and `onUpdated` logs to `LiveClock` (`Clock: beforeUpdate`, `Clock: updated`) and click **Switch city**.',
        hint: 'These will also fire every second because the clock\'s own `seconds` changes — that\'s expected.',
        tests: [
          {
            name: 'Clock: beforeUpdate → Clock: updated → App: updated',
            code: `logs.length = 0
await click('.city')
const order = ['Clock: beforeUpdate', 'Clock: updated', 'App: updated'].map((m) => logs.indexOf(m))
expect(order.every((i) => i !== -1)).toBe(true)
expect(order[0]).toBeLessThan(order[1])
expect(order[1]).toBeLessThan(order[2])`,
          },
        ],
        explain: 'App re-renders because it reads `city`, passes a new prop, and the clock updates **inside** App\'s update. So the child\'s `updated` fires before the parent\'s — the same "children finish first" rule as mounting.',
      },
      {
        id: 'dom-timing',
        task: 'Look at the first log lines again: *beforeMount — element exists? false* and *mounted — element exists? true*. Now try calling `face.value.textContent` directly at the top level of `<script setup>` and read the error.',
        explain: 'During setup and `onBeforeMount` there is no DOM yet, so template refs are `null` and `face.value.textContent` throws a `TypeError`. `onMounted` is the first moment the element exists. Remove the line afterwards.',
      },
    ],
  },

  internals: {
    beginner: `
Calling \`onMounted(fn)\` doesn't run \`fn\` — it **saves** it on the component instance that is currently being set up. Later, when Vue reaches that moment in the instance's life, it calls everything saved for that moment. That's why hooks must be registered while setup is running: it's the only time Vue knows *which* instance you mean.
`,
    technical: [
      `
During \`setup()\`, Vue sets a global "current instance". Each hook function pushes your callback into an array on it:
`,
      {
        code: `// Simplified model — not Vue's real source
let currentInstance = null

function onMounted(fn) {
  if (!currentInstance) {
    console.warn('onMounted is called when there is no active component instance…')
    return
  }
  (currentInstance.mounted ||= []).push(fn)
}

function mountComponent(vnode, container) {
  const instance = createInstance(vnode)
  currentInstance = instance
  instance.setupState = instance.type.setup(instance.props)  // hooks get registered
  currentInstance = null

  run(instance.beforeMount)                  // sync
  const subTree = instance.render()
  patch(null, subTree, container)            // children mount here, recursively
  queuePostFlush(instance.mounted)           // queued AFTER the children queued theirs
}`,
        lang: 'js',
        title: 'mental model of hook registration and mounting',
      },
      `
That last line explains the ordering. Each child queues its \`mounted\` callbacks while the parent is still patching, so by the time the parent queues its own, the children's are already ahead in the queue. The same pattern holds for updates (\`beforeUpdate\` runs synchronously before patching, \`updated\` is queued after) and unmounting (\`beforeUnmount\` runs synchronously top-down, \`unmounted\` callbacks are queued bottom-up).

On unmount Vue also stops the instance's **effect scope**: its render effect plus every \`watch\`, \`watchEffect\` and \`computed\` created synchronously during setup. It cannot know about timers, global event listeners, WebSockets or library instances you created yourself — those need your cleanup code. (Watchers created asynchronously, e.g. after an \`await\`, aren't bound to the instance and must be stopped manually.)

"Mounted" covers the component's own DOM and its **synchronous** children. Async components and children inside \`<Suspense>\` may still be loading when the parent's \`onMounted\` runs.
`,
    ],
    production: `
- **Pair every start with a stop.** \`addEventListener\`/\`removeEventListener\`, \`setInterval\`/\`clearInterval\`, \`new Chart()\`/\`chart.destroy()\`, \`socket.open\`/\`socket.close\`. Code review should look for unpaired calls.
- **Wrap setup + cleanup in composables** (\`useEventListener\`, \`useInterval\`) so the cleanup can't be forgotten — see [composables](lesson:composables-intro) and [composable recipes](lesson:composable-recipes).
- **Data fetching** can start directly in setup (no DOM needed). In SSR apps, \`onMounted\` runs only in the browser — use it for browser-only APIs and leave server data loading to the framework (e.g. Nuxt) or \`onServerPrefetch\`.
- **Avoid logic in \`onUpdated\`.** It runs after every re-render; changing state there can cause \`Maximum recursive updates exceeded\`. React to specific values with \`watch\`.
- **Error boundaries**: combine \`onErrorCaptured\` in layout-level components (show a fallback) with \`app.config.errorHandler\` for reporting ([error handling](lesson:error-handling)).
- **KeepAlive** components aren't unmounted when hidden; pause timers in \`onDeactivated\` and resume in \`onActivated\`.
`,
  },

  mistakes: [
    {
      title: 'Touching the DOM during setup',
      wrong: { code: `const input = ref(null)\ninput.value.focus() // TypeError: input.value is null`, lang: 'js' },
      right: { code: `const input = ref(null)\nonMounted(() => input.value.focus())`, lang: 'js' },
      explanation: 'Setup runs before the template is rendered. Template refs are filled just before `onMounted` runs.',
    },
    {
      title: 'Starting something without stopping it',
      wrong: { code: `onMounted(() => {\n  window.addEventListener('resize', onResize)\n  setInterval(poll, 5000)\n})`, lang: 'js' },
      right: { code: `let timer\nonMounted(() => {\n  window.addEventListener('resize', onResize)\n  timer = setInterval(poll, 5000)\n})\nonUnmounted(() => {\n  window.removeEventListener('resize', onResize)\n  clearInterval(timer)\n})`, lang: 'js' },
      explanation: 'Global listeners and timers outlive the component. Every mount without cleanup stacks another copy — a classic memory leak and a source of duplicate requests.',
    },
    {
      title: 'Registering a hook asynchronously',
      wrong: { code: `async function init() {\n  const user = await fetchUser()\n  onMounted(() => console.log(user)) // no active instance anymore\n}\ninit()`, lang: 'js' },
      right: { code: `const user = ref(null)\nonMounted(() => console.log('mounted'))\nfetchUser().then((u) => (user.value = u))`, lang: 'js' },
      explanation: 'After an `await` in a plain function, setup has finished and Vue no longer knows which instance the hook belongs to. Register hooks first, then do async work.',
    },
    {
      title: 'Changing state in onUpdated',
      wrong: { code: `onUpdated(() => {\n  renderCount.value++ // triggers another update… forever\n})`, lang: 'js' },
      right: { code: `watch(items, (list) => {\n  summary.value = list.length + ' items'\n})`, lang: 'js' },
      explanation: 'A state change in `onUpdated` schedules another render, which calls `onUpdated` again. Vue eventually stops with "Maximum recursive updates exceeded". Use `watch` or `computed` for derived values.',
    },
  ],

  debugging: [
    {
      symptom: 'A template ref is `null` in your code.',
      cause: 'It is read during setup or `onBeforeMount`, or the element is behind a `v-if` that is currently false.',
      fix: 'Read it in `onMounted` (or after `await nextTick()` once the `v-if` turns true).',
    },
    {
      symptom: 'Console logs or network requests keep happening after you navigate away from a component.',
      cause: 'A timer, listener or subscription started in the component was never stopped.',
      fix: 'Stop it in `onUnmounted`/`onBeforeUnmount`, or use a composable that cleans up automatically.',
    },
    {
      symptom: '`[Vue warn]: onMounted is called when there is no active component instance to be associated with.`',
      cause: 'The hook was registered outside synchronous setup — inside a timeout, a promise callback or after an `await` in a regular function.',
      fix: 'Register hooks synchronously at the top level of `<script setup>` (or in a composable called from there).',
    },
    {
      symptom: '`Maximum recursive updates exceeded in component <X>`.',
      cause: 'Something during or after render (often `onUpdated` or a watcher) mutates state that the render depends on.',
      fix: 'Remove state changes from `onUpdated`; derive values with `computed`; make watchers compare before writing.',
    },
    {
      symptom: 'A parent\'s `onMounted` can\'t find a child\'s DOM.',
      cause: 'The child is an async component or behind a `v-if`, so it wasn\'t part of the synchronous mount.',
      fix: 'Have the child emit an event when ready, or watch for it; don\'t rely on mount order across async boundaries.',
    },
  ],

  bestPractices: [
    'Use `onMounted` for DOM work and `onUnmounted`/`onBeforeUnmount` for cleanup; most components need nothing else.',
    'Start data fetching in setup; you don\'t need the DOM to request data.',
    'Pair every manual start (timer, listener, socket, library) with a stop.',
    'Encapsulate start/stop pairs in composables.',
    'Register hooks synchronously; do async work afterwards.',
    'Avoid state changes in `onUpdated`; prefer `watch`, `computed` or `nextTick`.',
  ],

  useCases: [
    'Focusing an input or scrolling to an element after it appears.',
    'Initialising and destroying third-party libraries (charts, maps, editors).',
    'Starting/stopping timers, polling and animations.',
    'Adding/removing `window` or `document` listeners (resize, keyboard shortcuts).',
    'Opening/closing WebSocket or EventSource connections.',
    'Error boundaries with `onErrorCaptured`.',
  ],

  whenToUse: {
    use: [
      'You need the real DOM (measure, focus, integrate a library) → `onMounted`.',
      'You started something the browser keeps running → cleanup in `onUnmounted`.',
      'You want to contain errors from a subtree → `onErrorCaptured`.',
    ],
    avoid: [
      'Reacting to a specific value changing → `watch`.',
      'Computing derived data → `computed`.',
      'Fetching data that doesn\'t need the DOM → just start it in setup.',
    ],
  },

  comparison: {
    title: 'Where should this code go?',
    headers: ['', 'Top of `<script setup>`', '`onMounted`', '`watch`', '`onUnmounted`'],
    rows: [
      ['Runs', 'once, at creation', 'once, after DOM is ready', 'when a specific source changes', 'once, after removal'],
      ['DOM available?', 'no', 'yes', 'only with `flush: \'post\'`', 'no (removed)'],
      ['Runs during SSR?', 'yes', 'no', 'only `immediate` runs during setup', 'no'],
      ['Typical', 'state, fetch start', 'focus, measure, libraries, timers', 'react to input/props', 'cleanup'],
    ],
  },

  quiz: [
    {
      id: 'lifecycle-hooks-q1',
      type: 'mcq',
      prompt: 'Which is the **first** hook in which a component\'s template refs point to real DOM elements?',
      options: [
        { text: 'The top level of `<script setup>`', why: 'Setup runs before rendering; refs are `null`.' },
        { text: '`onBeforeMount`', why: 'Called right before the DOM is created; refs are still `null`.' },
        { text: '`onMounted`' },
        { text: '`onUpdated`', why: 'Refs are available there too, but `onMounted` comes first.' },
      ],
      answer: 2,
      explanation: 'Vue creates the DOM, fills template refs, and then calls `onMounted`.',
    },
    {
      id: 'lifecycle-hooks-q2',
      type: 'output',
      prompt: 'Each component logs in `setup`, `onBeforeMount` and `onMounted`. `Parent` renders `<Child />`. What is the console order on first load?',
      code: {
        lang: 'text',
        code: `P = Parent, C = Child
setup → "setup", onBeforeMount → "beforeMount", onMounted → "mounted"`,
      },
      options: [
        { text: 'P setup, P beforeMount, P mounted, C setup, C beforeMount, C mounted', why: 'The parent can\'t be fully mounted before its children are.' },
        { text: 'P setup, P beforeMount, C setup, C beforeMount, C mounted, P mounted' },
        { text: 'C setup, C beforeMount, C mounted, P setup, P beforeMount, P mounted', why: 'The child is only created when the parent renders it.' },
        { text: 'P setup, C setup, P beforeMount, C beforeMount, P mounted, C mounted', why: 'The child is created during the parent\'s render, which happens after the parent\'s beforeMount.' },
      ],
      answer: 1,
      explanation: 'The parent starts first, creates the child while rendering, and finishes (mounted) last — once all synchronous children are mounted.',
    },
    {
      id: 'lifecycle-hooks-q3',
      type: 'bug',
      prompt: 'This component crashes on load. Which line causes it?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, onMounted } from 'vue'

const search = ref(null)
search.value.focus()

onMounted(() => {
  console.log('ready')
})
</script>

<template>
  <input ref="search" />
</template>`,
      },
      answerLine: 5,
      explanation: 'At this point the template hasn\'t rendered, so `search.value` is `null`. Move `search.value.focus()` into `onMounted`.',
    },
    {
      id: 'lifecycle-hooks-q4',
      type: 'fill',
      prompt: 'Listen for the Escape key while the dialog is on screen — and stop listening when it\'s removed.',
      code: {
        lang: 'js',
        code: `function onKey(e) { if (e.key === 'Escape') emit('close') }

___(() => window.addEventListener('keydown', onKey))
___(() => window.removeEventListener('keydown', onKey))`,
      },
      answer: [['onMounted'], ['onUnmounted', 'onBeforeUnmount']],
      explanation: 'Attach after mounting, detach on unmount (either `onBeforeUnmount` or `onUnmounted` works for this). Pass the same function reference to both calls.',
    },
    {
      id: 'lifecycle-hooks-q5',
      type: 'mcq',
      prompt: '`Parent` (which renders `<Child />`) is removed from the page. In what order do the unmount hooks run?',
      options: [
        { text: 'Parent beforeUnmount → Parent unmounted → Child beforeUnmount → Child unmounted', why: 'The parent can\'t finish unmounting before its children.' },
        { text: 'Child beforeUnmount → Child unmounted → Parent beforeUnmount → Parent unmounted', why: 'The parent\'s beforeUnmount runs first — it is still fully functional and about to tear down its subtree.' },
        { text: 'Parent beforeUnmount → Child beforeUnmount → Child unmounted → Parent unmounted' },
        { text: 'All four run at the same time.', why: 'They run in a well-defined order.' },
      ],
      answer: 2,
      explanation: '"Before" hooks run top-down while everything still works; "after" hooks run bottom-up, so the parent\'s `onUnmounted` is last.',
    },
    {
      id: 'lifecycle-hooks-q6',
      type: 'mcq',
      prompt: 'Which of these does Vue clean up **automatically** when a component unmounts? Select **all** that apply.',
      options: [
        { text: 'A `watch` created synchronously in `<script setup>`' },
        { text: 'A `computed` created in `<script setup>`' },
        { text: 'A `setInterval` started in `onMounted`', why: 'Timers belong to the browser; clear them yourself.' },
        { text: 'A `window.addEventListener` added in `onMounted`', why: 'Global listeners must be removed manually.' },
      ],
      answer: [0, 1],
      explanation: 'Vue stops the effects it created for the instance (render effect, watchers, computeds). Anything you started through browser APIs or libraries is yours to stop.',
    },
    {
      id: 'lifecycle-hooks-q7',
      type: 'short',
      prompt: 'What happens when a component is unmounted, and what is your job at that moment?',
      answer: 'Vue calls `onBeforeUnmount` (the instance still works), unmounts its children, removes its DOM, stops its reactive effects (render effect, watchers and computeds created in setup), and then calls `onUnmounted`. My job is to clean up everything I started outside Vue\'s reactivity: clear timers, remove global event listeners, close sockets/subscriptions and destroy third-party library instances.',
    },
  ],

  exercises: [
    {
      id: 'draft-editor',
      title: 'An editor that focuses itself and saves on close',
      difficulty: 'intermediate',
      prompt: `
Finish \`DraftEditor.vue\`:

- It renders \`<textarea class="draft">\` bound to a local \`text\` ref.
- When it **mounts**, it focuses the textarea and restores any saved draft from \`localStorage.getItem('draft')\`.
- Right **before it unmounts**, it saves the current text with \`localStorage.setItem('draft', text)\`.

\`App.vue\` toggles the editor with \`.toggle\`.
`,
      files: {
        ...draftFiles,
        'DraftEditor.vue': `<script setup>
import { ref } from 'vue'

const text = ref('')
const box = ref(null)
// TODO: focus + restore on mount, save before unmount
</script>

<template>
  <textarea ref="box" class="draft" v-model="text" placeholder="Start typing…"></textarea>
</template>`,
      },
      hints: [
        'Import `onMounted` and `onBeforeUnmount` from `vue`.',
        'In `onMounted`: `text.value = localStorage.getItem(\'draft\') ?? \'\'` and `box.value.focus()`.',
        'In `onBeforeUnmount`: `localStorage.setItem(\'draft\', text.value)`.',
      ],
      solution: {
        explanation: 'Focusing needs the real element, so it waits for `onMounted`. Saving happens in `onBeforeUnmount`, while the component and its state are still fully available. Restoring could also happen in setup, since it doesn\'t need the DOM.',
        files: {
          ...draftFiles,
          'DraftEditor.vue': `<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const text = ref('')
const box = ref(null)

onMounted(() => {
  text.value = localStorage.getItem('draft') ?? ''
  box.value.focus()
})

onBeforeUnmount(() => {
  localStorage.setItem('draft', text.value)
})
</script>

<template>
  <textarea ref="box" class="draft" v-model="text" placeholder="Start typing…"></textarea>
</template>`,
        },
      },
      tests: [
        { name: 'focuses the textarea on mount', code: `expect(document.activeElement).toBe(find('.draft'))` },
        {
          name: 'saves the draft when closed',
          code: `await type('.draft', 'Dear diary')
await click('.toggle')
expect(localStorage.getItem('draft')).toBe('Dear diary')`,
        },
        {
          name: 'restores the draft when reopened',
          code: `await type('.draft', 'Shopping list')
await click('.toggle')
await click('.toggle')
expect(find('.draft').value).toBe('Shopping list')
expect(document.activeElement).toBe(find('.draft'))`,
        },
      ],
    },
    {
      id: 'error-boundary',
      title: 'An error boundary with onErrorCaptured',
      difficulty: 'advanced',
      prompt: `
\`WeatherWidget\` throws while rendering once it is \`broken\`. Right now that error breaks the widget area and is only logged.

Finish \`ErrorBoundary.vue\`:

- Render its default slot normally.
- Use \`onErrorCaptured\` to catch errors from descendants: store the error and **stop it from propagating** further.
- When an error was caught, render \`<p class="error-fallback">\` with the text **Widget unavailable: ** followed by the error message — instead of the slot.

The \`.footer\` paragraph in \`App.vue\` must keep rendering.
`,
      files: {
        ...boundaryFiles,
        'ErrorBoundary.vue': `<script setup>
// TODO: catch errors from children
</script>

<template>
  <div class="boundary">
    <slot />
  </div>
</template>`,
      },
      hints: [
        '`const error = ref(null)` and `onErrorCaptured((err) => { … })` — import both from `vue`.',
        'Inside the hook, set `error.value = err` and `return false` to stop propagation.',
        'Template: `<p v-if="error" class="error-fallback">Widget unavailable: {{ error.message }}</p>` and `<slot v-else />`.',
      ],
      solution: {
        explanation: '`onErrorCaptured` runs in ancestors when a descendant throws during render, setup, a lifecycle hook, a watcher or an event handler. Storing the error switches the boundary to its fallback; returning `false` tells Vue the error is handled, so it doesn\'t propagate to higher boundaries or `app.config.errorHandler`.',
        files: {
          ...boundaryFiles,
          'ErrorBoundary.vue': `<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err) => {
  error.value = err
  return false
})
</script>

<template>
  <div class="boundary">
    <p v-if="error" class="error-fallback">Widget unavailable: {{ error.message }}</p>
    <slot v-else />
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'renders the widget normally', code: `expect(text('.widget')).toBe('Today: 21°C'); expect(exists('.error-fallback')).toBe(false)` },
        {
          name: 'shows the fallback when the widget throws',
          code: `await click('.break')
expect(exists('.error-fallback')).toBe(true)
expect(text('.error-fallback')).toBe('Widget unavailable: Weather service returned garbage')`,
        },
        { name: 'the rest of the page keeps rendering', code: `await click('.break'); expect(text('.footer')).toBe('The rest of the page keeps working.')` },
      ],
    },
  ],

  interview: [
    {
      id: 'lifecycle-hooks-what',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What are lifecycle hooks in Vue, and which ones do you use most?',
      answer: 'Lifecycle hooks are functions Vue calls at specific moments of a component instance\'s life: before/after mount, before/after update, before/after unmount (plus `onErrorCaptured`, `onActivated`/`onDeactivated` for KeepAlive, and debug/SSR hooks). In the Composition API you register them in setup with `onMounted(fn)` etc. The most used are `onMounted` (DOM access, timers, libraries) and `onUnmounted`/`onBeforeUnmount` (cleanup).',
      explanation: 'They let you hook your code into create → mount → update → unmount.',
      whyAsked: 'A classic question that checks practical understanding of component lifetimes.',
      mistakes: ['Listing hooks without explaining when or why to use them.', 'Saying data must be fetched in `onMounted` — it can start in setup.', 'Forgetting cleanup.'],
      followUps: ['In what order do parent and child hooks run?', 'What happens on unmount?', 'Why must hooks be registered synchronously?'],
      modelAnswer: 'Lifecycle hooks are callbacks Vue runs at defined points in a component\'s life. In `<script setup>` I register them with functions like `onMounted` and `onUnmounted`. Setup itself replaces the old created hooks. I use `onMounted` whenever I need the real DOM — focusing, measuring, initialising a chart library or starting a timer — and `onUnmounted` or `onBeforeUnmount` to undo exactly those things. The update hooks I rarely need, and `onErrorCaptured` is useful for error boundaries.',
    },
    {
      id: 'lifecycle-hooks-parent-child-order',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'A parent renders a child. In which order do `onMounted` and `onUnmounted` run for the two of them, and why?',
      options: [
        'Mounted: parent then child. Unmounted: parent then child.',
        'Mounted: child then parent. Unmounted: child then parent.',
        'Mounted: child then parent. Unmounted: parent then child.',
        'Mounted: parent then child. Unmounted: child then parent.',
      ],
      correctOption: 1,
      answer: 'Child first in both cases. Mount: parent setup → parent beforeMount → child setup → child beforeMount → child mounted → parent mounted. Unmount: parent beforeUnmount → child beforeUnmount → child unmounted → parent unmounted.',
      explanation: 'A parent is only "mounted" once its synchronous children are, and only "unmounted" once its children are gone. "Before" hooks run top-down, "after" hooks bottom-up.',
      whyAsked: 'Ordering questions are popular because they reveal whether you understand how rendering recurses.',
      mistakes: ['Assuming the parent mounts first because it starts first.', 'Forgetting that the parent\'s beforeUnmount runs before the child\'s.'],
      followUps: ['What about updates triggered by a prop change?', 'Does this hold for async children?'],
      modelAnswer: 'Both `onMounted` and `onUnmounted` fire for the child first. The parent starts first — its setup and beforeMount run, then rendering creates the child, which goes through its whole mount — and only then does the parent\'s mounted run. On teardown the parent\'s beforeUnmount runs first, then the child\'s beforeUnmount and unmounted, and the parent\'s unmounted last. Updates follow the same shape. Async components and Suspense children are the exception — they may finish later.',
    },
    {
      id: 'lifecycle-hooks-unmount',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What happens when a component is unmounted, and what must you clean up yourself?',
      answer: 'Vue calls `onBeforeUnmount` (instance still functional), recursively unmounts children, removes the DOM, stops the instance\'s effect scope — its render effect and the watchers/computeds created synchronously in setup — and calls `onUnmounted`. You must clean up anything created outside Vue\'s reactivity: timers, `window`/`document` listeners, WebSocket/EventSource connections, observers (`ResizeObserver`, `IntersectionObserver`), third-party library instances, and watchers created asynchronously.',
      explanation: 'Vue cleans up what Vue created; you clean up what you created.',
      whyAsked: 'Memory leaks from missing cleanup are a common production problem.',
      mistakes: ['Thinking Vue clears timers automatically.', 'Forgetting that watchers created after an `await` aren\'t auto-stopped.'],
      followUps: ['How would you make cleanup impossible to forget?', 'What changes with KeepAlive?'],
      modelAnswer: 'Unmounting runs `onBeforeUnmount` while everything still works, tears down the children, removes the DOM, stops the instance\'s reactive effects — render, watchers and computeds created during setup — and finally runs `onUnmounted`. Vue doesn\'t know about browser timers, global listeners, sockets, observers or chart instances, so I stop those in an unmount hook. To make it hard to forget, I wrap each start/stop pair in a composable. With KeepAlive, a hidden component isn\'t unmounted, so I pause work in `onDeactivated`.',
    },
    {
      id: 'lifecycle-hooks-fetch-where',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A teammate always fetches data in `onMounted`. Is that right? Where would you start fetching, and what changes with server-side rendering?',
      answer: 'Fetching doesn\'t need the DOM, so it can start directly in setup, which begins the request slightly earlier and keeps the code simple (track loading/error state). `onMounted` is fine for browser-only work. With SSR, `onMounted` never runs on the server, so data fetched there isn\'t in the server-rendered HTML; server data loading goes through the framework (e.g. Nuxt\'s data-fetching composables) or `onServerPrefetch`.',
      explanation: 'Use the earliest hook that has what you need: data needs nothing → setup; DOM needs mounting → onMounted.',
      whyAsked: 'Checks whether you understand what each phase provides, and SSR implications.',
      mistakes: ['Claiming you must wait for `onMounted` to fetch.', 'Not handling loading and error states.', 'Not knowing mount hooks are skipped in SSR.'],
      followUps: ['How would you cancel the request if the component unmounts first?'],
      modelAnswer: 'It works, but it isn\'t required: fetching doesn\'t need DOM, so I start it in setup with loading and error refs. `onMounted` is for browser-only things like measuring or `window`. If the app is server-rendered, `onMounted` doesn\'t run on the server at all, so the HTML wouldn\'t contain that data — there I\'d use the framework\'s data fetching or `onServerPrefetch`. I\'d also cancel the request with an `AbortController` on unmount to avoid updating a dead component.',
    },
    {
      id: 'lifecycle-hooks-recursive-updates',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 3,
      question: 'A component logs "Maximum recursive updates exceeded". It contains `onUpdated(() => { height.value = el.value.offsetHeight })` and renders `height` in the template. Explain and fix.',
      answer: 'Every update calls `onUpdated`, which writes `height`; because the template reads `height`, that write schedules another update, which calls `onUpdated` again — a loop. Fix: only write when the value actually changed (compare first), measure in `onMounted` plus a `ResizeObserver`, or measure in a `watch` with `flush: \'post\'` on the specific source that affects height — and don\'t render a value that is derived from rendering itself if you can avoid it.',
      explanation: 'State changes in `onUpdated` feed back into rendering.',
      whyAsked: 'Shows understanding of the reactivity/render loop and practical DOM measurement.',
      mistakes: ['Wrapping the write in `nextTick` (still loops).', 'Ignoring the warning because the UI looks right.'],
      followUps: ['How would `ResizeObserver` help here?', 'What does Vue do when it detects the loop?'],
      modelAnswer: 'The hook mutates state that the template depends on, so each update triggers another one and Vue stops after a limit with that warning. I\'d stop measuring on every update: measure once in `onMounted` and keep it current with a `ResizeObserver` cleaned up on unmount, or use a post-flush watcher on the specific data that changes the height. At minimum, compare and only assign when the value differs, so the loop settles.',
    },
    {
      id: 'lifecycle-hooks-async-registration',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 3,
      question: 'Why does this composable trigger "onUnmounted is called when there is no active component instance", and how do you fix it?',
      code: {
        lang: 'js',
        code: `export function useLiveScores() {
  const scores = ref([])
  loadConfig().then((config) => {
    const socket = connect(config.url)
    socket.onmessage = (e) => (scores.value = JSON.parse(e.data))
    onUnmounted(() => socket.close())
  })
  return { scores }
}`,
      },
      answer: 'Hooks attach to the "current instance", which only exists while setup runs synchronously. The `.then` callback runs later, when no instance is active, so `onUnmounted` can\'t be registered and the socket is never closed. Register the hook synchronously and let it close whatever exists at that time: `let socket; onUnmounted(() => socket?.close())`, and also guard against the component unmounting before the config arrives.',
      explanation: 'Register first, do async work later.',
      whyAsked: 'A subtle bug in composables that leaks connections.',
      mistakes: ['Moving the hook into another async callback.', 'Not handling unmount-before-connect.'],
      followUps: ['How does `<script setup>` with top-level `await` differ?', 'How would you test this composable?'],
      modelAnswer: 'Lifecycle hooks register on the instance that\'s currently running setup. Inside the promise callback, setup has long finished, so there is no active instance — Vue warns and the cleanup is never registered, leaking the socket. I\'d declare `let socket` and `let cancelled = false`, register `onUnmounted` synchronously to set `cancelled` and close the socket if it exists, and in the callback skip connecting when `cancelled` is already true.',
    },
    {
      id: 'lifecycle-hooks-coding-countdown',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Finish `CountdownTimer.vue`: count down from the `from` prop once every 50 ms (the provided `tick()` logs **tick** and decrements), stop at **0** and emit a declared `done` event, and stop the interval if the component is removed early.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import CountdownTimer from './CountdownTimer.vue'

const visible = ref(true)
const finished = ref(false)
</script>

<template>
  <button class="hide" @click="visible = false">Hide</button>
  <CountdownTimer v-if="visible" :from="3" @done="finished = true" />
  <p v-if="finished" class="finished">Done!</p>
</template>`,
          'CountdownTimer.vue': `<script setup>
import { ref } from 'vue'

const props = defineProps({ from: { type: Number, required: true } })
const left = ref(props.from)

function tick() {
  console.log('tick')
  left.value--
}
// TODO: start an interval on mount, stop at 0 (emit done), clean up on unmount
</script>

<template>
  <p class="left">{{ left }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'starts at 3', code: `expect(text('.left')).toBe('3')` },
        {
          name: 'reaches 0, emits done and stops',
          code: `await wait(300)
expect(text('.left')).toBe('0')
expect(exists('.finished')).toBe(true)
await wait(120)
expect(text('.left')).toBe('0')`,
        },
        {
          name: 'stops ticking when removed early',
          code: `await click('.hide')
const before = logs.filter((l) => l === 'tick').length
await wait(200)
expect(logs.filter((l) => l === 'tick').length).toBe(before)`,
        },
      ],
      hints: ['Declare `const emit = defineEmits([\'done\'])` and keep the interval id in a variable.', 'In `onMounted`, `setInterval` a function that calls `tick()` and, when `left.value === 0`, clears the interval and emits `done`.', 'In `onUnmounted`, `clearInterval(id)`.'],
      answer: 'Start the interval in `onMounted`, clear it when the count reaches 0 (emitting `done`), and clear it again in `onUnmounted` for early removal.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import CountdownTimer from './CountdownTimer.vue'

const visible = ref(true)
const finished = ref(false)
</script>

<template>
  <button class="hide" @click="visible = false">Hide</button>
  <CountdownTimer v-if="visible" :from="3" @done="finished = true" />
  <p v-if="finished" class="finished">Done!</p>
</template>`,
          'CountdownTimer.vue': `<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({ from: { type: Number, required: true } })
const emit = defineEmits(['done'])
const left = ref(props.from)
let id = null

function tick() {
  console.log('tick')
  left.value--
}

onMounted(() => {
  id = setInterval(() => {
    tick()
    if (left.value <= 0) {
      clearInterval(id)
      emit('done')
    }
  }, 50)
})

onUnmounted(() => clearInterval(id))
</script>

<template>
  <p class="left">{{ left }}</p>
</template>`,
        },
      },
      explanation: 'Two exits, one interval: normal completion clears it and emits; early unmount clears it too. `clearInterval` on an already-cleared id is harmless.',
      whyAsked: 'Tests timers, emits and cleanup — the most common lifecycle pattern.',
      mistakes: ['Forgetting the early-unmount cleanup.', 'Letting the count go negative.', 'Starting the interval in setup and never storing the id.'],
      followUps: ['Turn this into a `useCountdown()` composable.', 'How would you pause it when the tab is hidden?'],
      modelAnswer: 'I start the interval in `onMounted` and store its id. Each tick decrements; when it hits zero I clear the interval and emit `done`. Separately, `onUnmounted` clears the interval, covering the case where the parent removes the timer early. As a composable, `useCountdown` would own the interval and register its own `onUnmounted`, so any component using it gets cleanup for free.',
    },
  ],

  takeaways: [
    'Hooks are registered synchronously in setup and called later at fixed moments: mount, update, unmount.',
    '`onMounted` is the first moment the DOM (and template refs) exist; setup and `onBeforeMount` have no DOM.',
    'Order: parent setup → parent beforeMount → child setup/beforeMount/mounted → parent mounted. Updates and unmounts follow the same "children finish first" rule.',
    'On unmount Vue stops its own effects; you must stop timers, listeners, sockets and library instances.',
    'Don\'t change state in `onUpdated`; use `watch`, `computed` or `nextTick` for specific changes.',
    '`onErrorCaptured` lets an ancestor catch descendant errors (return `false` to stop propagation).',
  ],
}
