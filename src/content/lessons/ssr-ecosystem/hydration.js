// Lesson: Hydration & mismatch errors (Level 17)
//
// The runnable examples perform REAL hydration: main.js puts "server" HTML into
// the page and calls createSSRApp(App).mount(), exactly like an SSR client entry.

const harnessMain = (extra = '') => `import { createSSRApp } from 'vue'
import App from './App.vue'
import { serverHtml } from './server-output.js'

// ---- Pretend to be the browser receiving a server-rendered page ----${extra}
const host = document.createElement('div')
host.innerHTML = serverHtml // the HTML that arrived over the network
document.getElementById('app').appendChild(host)

// ---- The client entry of every SSR app ----
createSSRApp(App).mount(host) // hydrate: adopt the existing DOM`

const mainJs = harnessMain(`
localStorage.setItem('theme', 'dark') // this visitor picked dark mode last time
`)

const serverOutput = `// What the server sent: the result of renderToString(App) on the server.
// A real server re-renders from the same App.vue on every request, so the two
// never drift apart. Here the HTML is frozen text — when an experiment changes
// what the server would render, update this string too: you are the server.
//
// Rendered at 09:00:00 server time, in a process with no localStorage.
export const serverHtml =
  '<div class="page theme-light">' +
  '<h1>Trail Backpack</h1>' +
  '<p class="mode">light mode</p>' +
  '<p class="clock">Local time: 09:00:00</p>' +
  '<button class="like">♥ 0</button>' +
  '<p class="note"><div>Free shipping on orders over €50</div></p>' +
  '</div>'`

const appVue = `<script setup>
import { ref } from 'vue'

// ❌ Mismatch 1: reads a browser-only value during setup.
// The typeof guard stops the server from crashing — not from disagreeing.
const theme = ref(
  typeof localStorage !== 'undefined' ? localStorage.getItem('theme') ?? 'light' : 'light',
)

// ❌ Mismatch 2: the server's clock is not the visitor's clock.
const time = new Date().toLocaleTimeString()

const likes = ref(0)

// ❌ Mismatch 3 is in the template: a <div> inside a <p>.
</script>

<template>
  <div :class="['page', 'theme-' + theme]">
    <h1>Trail Backpack</h1>
    <p class="mode">{{ theme }} mode</p>
    <p class="clock">Local time: {{ time }}</p>
    <button class="like" @click="likes++">♥ {{ likes }}</button>
    <p class="note"><div>Free shipping on orders over €50</div></p>
  </div>
</template>`

// ---------- exercise 1: <ClientOnly>
const clientOnlyMain = harnessMain()

const clientOnlyServer = `// The server can't render ScreenInfo (no window there), so it rendered
// the #fallback slot. Note the <!--[--> <!--]--> markers: that's how Vue's
// server renderer marks a fragment (here, the rendered slot).
export const serverHtml =
  '<main class="page"><h1>Dashboard</h1>' +
  '<!--[--><p class="loading">Loading widget…</p><!--]-->' +
  '</main>'`

const clientOnlyApp = `<script setup>
import ClientOnly from './ClientOnly.vue'
import ScreenInfo from './ScreenInfo.vue'
</script>

<template>
  <main class="page">
    <h1>Dashboard</h1>
    <ClientOnly>
      <ScreenInfo />
      <template #fallback>
        <p class="loading">Loading widget…</p>
      </template>
    </ClientOnly>
  </main>
</template>`

const screenInfo = `<script setup>
// Uses browser-only APIs directly during setup: this can never run on a server.
const width = window.innerWidth
const language = navigator.language
</script>

<template>
  <p class="screen">Window: {{ width }}px · Language: {{ language }}</p>
</template>`

const clientOnlyStarter = `<script setup>
// TODO: render the #fallback slot during SSR and hydration,
// and the default slot only once the component is mounted in the browser.
</script>

<template>
  <slot />
</template>`

const clientOnlySolution = `<script setup>
import { ref, onMounted } from 'vue'

// false on the server AND during hydration, so both render the fallback.
const mounted = ref(false)

// onMounted never runs on the server: this flips only in the browser,
// after hydration has finished.
onMounted(() => {
  mounted.value = true
})
</script>

<template>
  <slot v-if="mounted" />
  <slot v-else name="fallback" />
</template>`

// ---------- exercise 2: useId
const idMain = harnessMain()

const idServer = `// What the server sends for the FINISHED form (the version using useId()).
// useId() numbers ids per application in render order — the exact format is an
// implementation detail, so never hard-code it in your components.
export const serverHtml =
  '<form class="signup">' +
  '<div class="field"><label for="v-0">Email</label><input id="v-0"></div>' +
  '<div class="field"><label for="v-1">Name</label><input id="v-1"></div>' +
  '</form>'`

const idApp = `<script setup>
import FormField from './FormField.vue'
</script>

<template>
  <form class="signup">
    <FormField label="Email" />
    <FormField label="Name" />
  </form>
</template>`

const fieldStarter = `<script>
// Module scope: shared by every instance — and, on a server, by every request
// the process has handled since it started. Server and browser counters differ.
let nextId = 0
</script>

<script setup>
defineProps({ label: { type: String, required: true } })

const id = 'field-' + nextId++
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input :id="id" />
  </div>
</template>`

const fieldSolution = `<script setup>
import { useId } from 'vue'

defineProps({ label: { type: String, required: true } })

// Stable across server and client renders (Vue 3.5+).
const id = useId()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>
    <input :id="id" />
  </div>
</template>`

// ---------- interview coding question: useBrowserValue
const bvMain = harnessMain()
const bvServer = `// The server has no window, so it rendered the fallback value (0).
export const serverHtml = '<p class="width">Width: 0px</p>'`
const bvApp = `<script setup>
import { useBrowserValue } from './useBrowserValue.js'

const width = useBrowserValue(() => window.innerWidth, 0)
</script>

<template>
  <p class="width">Width: {{ width }}px</p>
</template>`
const bvStarter = `import { ref } from 'vue'

// Return a ref that holds getter()'s value — safely for SSR + hydration.
export function useBrowserValue(getter, fallback) {
  return ref(getter())
}`
const bvSolution = `import { ref, onMounted } from 'vue'

export function useBrowserValue(getter, fallback) {
  const value = ref(fallback) // what the server rendered, and the first client render
  onMounted(() => {
    value.value = getter() // browser only, after hydration
  })
  return value
}`

const noMismatch = `const warnings = logs.filter((line) => /mismatch/i.test(line))
expect(warnings).toEqual([])`

export default {
  id: 'hydration',
  title: 'Hydration & mismatch errors',
  summary: 'Understand how Vue brings server-rendered HTML to life in the browser, why the client must render exactly what the server sent, and how to find and fix hydration mismatches.',
  difficulty: 'advanced',
  minutes: 42,
  prerequisites: ['rendering-strategies', 'lifecycle-hooks'],
  related: ['nuxt-intro', 'spa-or-nuxt', 'template-refs', 'composables-intro', 'async-components'],
  tags: ['ssr', 'hydration', 'hydration mismatch', 'createSSRApp', 'useId', 'data-allow-mismatch', 'onMounted', 'ClientOnly', 'universal code', 'lazy hydration'],
  apis: [
    { name: 'createSSRApp().mount()', summary: 'In the browser: hydrates existing server-rendered HTML instead of rendering from scratch.' },
    { name: 'useId()', summary: 'Generates unique-per-app ids that are stable across server and client renders (3.5+).' },
    { name: 'data-allow-mismatch', summary: 'Attribute that silences hydration mismatch warnings for an intentional difference (3.5+); value can be text, children, class, style or attribute.' },
    { name: 'hydrateOnVisible() & co.', summary: 'Lazy hydration strategies for async components: hydrateOnIdle, hydrateOnVisible, hydrateOnMediaQuery, hydrateOnInteraction (3.5+).' },
  ],
  docs: [
    { label: 'Vue Guide — SSR: client hydration', url: 'https://vuejs.org/guide/scaling-up/ssr.html#client-hydration' },
    { label: 'Vue Guide — SSR: hydration mismatch', url: 'https://vuejs.org/guide/scaling-up/ssr.html#hydration-mismatch' },
    { label: 'API — useId()', url: 'https://vuejs.org/api/composition-api-helpers.html#useid' },
    { label: 'API — data-allow-mismatch', url: 'https://vuejs.org/api/ssr.html#data-allow-mismatch' },
    { label: 'Vue Guide — Async components: lazy hydration', url: 'https://vuejs.org/guide/components/async.html#lazy-hydration' },
  ],

  intro: `
Server-side rendering sends finished HTML, so the page *looks* ready immediately. But it's a picture of an app: no click handlers, no reactive state. **Hydration** is the step where Vue, running in the browser, walks through that existing HTML and brings it to life — attaching event listeners and connecting each DOM node to the component that owns it.

To do that, Vue renders your app *again* in the browser and expects the result to match the server's HTML node for node. When they disagree — different text, a different class, a different number of elements — you get a **hydration mismatch**: a warning in development, and possibly a broken-looking page in production.
`,

  why: `
Why not just throw the server HTML away and render fresh in the browser? Because that would waste the work, flash or rebuild the content the user is already reading, and lose scroll position or focus. Hydration **reuses** the DOM, which is the whole point of SSR.

The price is a strict contract: **the first client render must produce the same HTML the server produced.** Plenty of innocent-looking code breaks it:

- reading \`localStorage\`, \`window.innerWidth\` or cookies-only-the-browser-knows during setup;
- showing \`new Date()\`, \`Math.random()\` or a locale-formatted number — server and visitor disagree;
- generating ids with a counter that keeps counting across requests on the server;
- writing HTML the browser silently "repairs" (a \`<div>\` inside a \`<p>\`).

Some mismatches only cost a console warning. Others leave the page **visibly wrong** — Vue fixes mismatched text, but in production it does not fix mismatched classes or attributes. Learning to read the warnings and fix the causes is a core SSR skill, whether you hand-roll SSR or use [Nuxt](lesson:nuxt-intro).
`,

  eli15: `
Imagine a theatre. Before the audience arrives, the stage crew sets up the whole stage: furniture, props, painted backdrop. That's the **server-rendered HTML** — it looks complete.

Then the actors arrive with their scripts. Each actor walks to *their* spot, picks up *their* prop, and the play begins. That's **hydration**: Vue's components walking onto the stage and taking control of the pieces already there.

Now imagine the script says "pick up the red cup from the table", but the crew put a *blue* cup there. The actor is confused. That's a **hydration mismatch**: the browser's version of the page doesn't match the stage that was set.

The fix is simple to say: make sure the crew and the actors follow the **same plan**. Anything only the actors can know (like "what's the weather outside right now?") gets added *after* the play has started — that's what \`onMounted\` is for.
`,

  analogy: {
    title: 'The stage crew and the actors',
    body: `
The crew (server) and the actors (browser) use the same script (your components). Hydration works when the actors find every prop exactly where the script says. A last-minute change only one side knows about — a different clock, a saved preference — must wait until the play is running, or both sides must be told about it.
`,
    mapping: [
      ['the stage set up before the audience arrives', 'server-rendered HTML'],
      ['actors walking on and taking their props', 'hydration: components adopt existing DOM nodes'],
      ['the shared script', 'your components, run on both server and client'],
      ['a blue cup where the script says red', 'a hydration mismatch'],
      ['changes made after the curtain rises', 'browser-only updates in `onMounted`'],
      ['a note in the script: "this prop may vary"', '`data-allow-mismatch` for intentional differences'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'What happens during hydration',
    caption: 'From server HTML to an interactive page — and the branch where a mismatch is detected.',
    alt: 'A flow: the server-rendered HTML arrives and is painted but not interactive; the JavaScript bundle loads; createSSRApp().mount() renders a virtual tree and walks the existing DOM in parallel. Where nodes match, Vue adopts them and attaches listeners. Where they differ, Vue warns and patches text or replaces nodes, but leaves class and attribute differences in place. Finally onMounted hooks run and the page is interactive.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'html', label: 'Server HTML arrives', note: 'painted · not interactive', tone: 'kraft', x: 100, y: 90 },
        { id: 'js', label: 'JS bundle loads', tone: 'paper', x: 280, y: 90 },
        { id: 'walk', label: 'createSSRApp().mount()', note: 'render vnodes + walk DOM', tone: 'cobalt', x: 470, y: 90 },
        { id: 'match', label: 'Match', note: 'adopt node + listeners', tone: 'acid', x: 660, y: 40 },
        { id: 'mismatch', label: 'Mismatch', note: 'warn · patch text · replace nodes', tone: 'red', x: 660, y: 170 },
        { id: 'mounted', label: 'onMounted runs', note: 'browser-only code, safe now', tone: 'acid', x: 470, y: 260 },
      ],
      edges: [
        { from: 'html', to: 'js' },
        { from: 'js', to: 'walk' },
        { from: 'walk', to: 'match', label: 'same' },
        { from: 'walk', to: 'mismatch', label: 'different', dashed: true },
        { from: 'match', to: 'mounted' },
        { from: 'mismatch', to: 'mounted' },
      ],
      steps: [
        { focus: ['html'], text: 'The browser receives finished HTML and paints it. The user can read it — but buttons do nothing yet, because no JavaScript has run.' },
        { focus: ['js'], edges: ['html->js'], text: 'The app\'s JavaScript downloads and runs. The client entry calls `createSSRApp(App).mount(\'#app\')` — **not** `createApp`, which would wipe the HTML and render from scratch.' },
        { focus: ['walk'], edges: ['js->walk'], text: 'Vue runs your components (setup, render) in the browser to get a virtual tree, then walks it side by side with the existing DOM: this vnode ↔ that element, this text ↔ that text node.' },
        { focus: ['match'], edges: ['walk->match'], text: 'When they match, Vue simply **adopts** the DOM node: it records the element and attaches event listeners. No DOM is created. This is the fast path you want everywhere.' },
        { focus: ['mismatch'], edges: ['walk->mismatch'], text: 'When they differ, Vue reports a mismatch (detailed warnings in development). It patches mismatched **text** and replaces mismatched **nodes**, but **class, style and attribute** mismatches are only reported — the server value stays in the DOM.' },
        { focus: ['mounted'], edges: ['match->mounted', 'mismatch->mounted'], text: 'Hydration is done: `onMounted` hooks run. This is the safe place for browser-only values (saved theme, window size, local time) — changing state here triggers a normal update, not a mismatch.' },
      ],
    },
  },

  animation: {
    type: 'comparison',
    title: 'The classic mismatch and its fix',
    caption: 'Same feature, two timings. The fix keeps the first client render identical to the server\'s, then updates in onMounted.',
    alt: 'Side by side. Left: a theme ref initialised from localStorage during setup, producing different HTML on the server (light) and in the browser (dark). Right: the theme starts as light on both sides and is read from localStorage in onMounted, after hydration.',
    props: {
      left: {
        label: 'Mismatch: browser value read during setup',
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'

// server: no localStorage → 'light'
// browser: saved value → 'dark'
const theme = ref(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('theme') ?? 'light'
    : 'light',
)
</script>

<template>
  <div :class="'theme-' + theme">…</div>
</template>`,
      },
      right: {
        label: 'Fixed: same first render, update after mount',
        lang: 'vue',
        code: `<script setup>
import { ref, onMounted } from 'vue'

// server AND first client render: 'light'
const theme = ref('light')

// browser only, after hydration
onMounted(() => {
  theme.value = localStorage.getItem('theme') ?? 'light'
})
</script>

<template>
  <div :class="'theme-' + theme">…</div>
</template>`,
      },
      points: [
        'Left: the server renders theme-light, the browser renders theme-dark — Vue warns, and the class is NOT corrected.',
        'Right: both render theme-light, hydration matches, then onMounted switches to dark with a normal reactive update.',
        'The trade-off on the right is a brief moment of the default theme; for themes, many sites avoid it by storing the preference in a cookie the server can read.',
      ],
    },
  },

  syntax: [
    `
#### The client entry hydrates
`,
    {
      code: `import { createSSRApp } from 'vue'
import App from './App.vue'

// Finds the server HTML inside #app and adopts it.
createSSRApp(App).mount('#app')

// createApp(App).mount('#app') would clear #app and render from scratch.`,
      lang: 'js',
      title: 'client entry (Vue core)',
    },
    `
#### The golden rule

> **Note:** The first client render must match the server render. Anything only the browser can know is applied **after** mounting.
`,
    {
      code: `<script setup>
import { ref, onMounted } from 'vue'

const now = ref(null)              // same on server and client
onMounted(() => {
  now.value = new Date()           // browser only, after hydration
})
</script>

<template>
  <p>{{ now ? now.toLocaleTimeString() : '' }}</p>
</template>`,
      lang: 'vue',
      title: 'browser-only values go in onMounted',
    },
    `
#### Tools for specific cases
`,
    {
      code: `<script setup>
import { useId } from 'vue'
const id = useId()   // Vue 3.5+: same id on server and client
</script>

<template>
  <label :for="id">Email</label>
  <input :id="id" />

  <!-- Vue 3.5+: an intentional difference — don't warn about this text -->
  <time data-allow-mismatch="text">{{ publishedAt.toLocaleString() }}</time>
</template>`,
      lang: 'vue',
      title: 'useId() and data-allow-mismatch',
    },
    `
- \`data-allow-mismatch\` accepts \`text\`, \`children\`, \`class\`, \`style\` or \`attribute\` (comma-separated), or no value to allow all. It must be rendered by the **server** too — Vue reads it from the server-rendered element.
- It only silences the warning: text is still replaced with the client value, and class/attribute differences still stay as the server rendered them. Use it for genuinely unavoidable differences, not to hide bugs.
- **Valid HTML matters.** Browsers repair invalid markup while parsing the server's HTML (\`<p><div></div></p>\` becomes two siblings), so the DOM no longer matches your template. Vue's template compiler warns about invalid nesting during development.
`,
    {
      callout: 'version',
      title: 'Version notes',
      text: '`useId()`, `data-allow-mismatch` and lazy hydration strategies (`hydrateOnVisible`, `hydrateOnIdle`, …) require Vue 3.5+. Since Vue 3.4, production builds can include detailed mismatch messages by enabling the `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__` compile-time flag; otherwise production only logs a short "Hydration completed but contains mismatches." error.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: appVue,
    intro: 'The playground\'s component contains three of the most common real-world mismatch causes. Step through them before you fix them.',
    steps: [
      { lines: [4, 8], text: 'On the server `localStorage` doesn\'t exist, so `theme` is `\'light\'`. In this visitor\'s browser the saved value is `\'dark\'`. The `typeof` guard prevents a crash — the two sides still render different HTML.' },
      { lines: [10, 11], text: 'The server rendered at 09:00:00; the visitor\'s clock (and time zone, and locale) say something else. Dates and random numbers are classic mismatch sources.' },
      { lines: [13], text: 'Ordinary client-only state. `likes` starts at 0 on both sides, so it hydrates cleanly — and the button only works after hydration attaches its listener.' },
      { lines: [19], text: 'The class binding: server says `theme-light`, client says `theme-dark`. Vue reports it but leaves the server\'s class in the DOM.' },
      { lines: [21, 22], text: 'Text mismatches: Vue warns and replaces the text with the client value. So after hydration the page says "dark mode" while still using the light theme class — visibly inconsistent.' },
      { lines: [24], text: 'Invalid HTML: the browser\'s parser closes the `<p>` before the `<div>`, so the real DOM has a different shape than the template. Vue sees missing and extra children.' },
    ],
  },

  playground: {
    title: 'Hydration bug hunt (real hydration!)',
    objective: 'This playground really hydrates server HTML with createSSRApp. Read the mismatch warnings in the console and fix all three causes.',
    files: {
      'main.js': mainJs,
      'App.vue': appVue,
      'server-output.js': serverOutput,
    },
    expected: 'The page shows the backpack, "dark mode" text but the **light** theme class, and a like button that works. The **Console** lists hydration warnings: a text and a class mismatch for the theme, a text mismatch for the clock, and children mismatches for the shipping note. (This app is created with `createSSRApp`, so watch the console rather than the state inspector.)',
    experiments: [
      {
        id: 'theme-on-mount',
        task: 'Fix the theme mismatch: start `theme` as `\'light\'` (what the server renders) and read `localStorage` in `onMounted`. After the fix the page should end up with the `theme-dark` class and the text "dark mode".',
        hint: '`const theme = ref(\'light\')` and `onMounted(() => { theme.value = localStorage.getItem(\'theme\') ?? \'light\' })` — remember to import `onMounted`.',
        tests: [
          {
            name: 'no theme-related hydration warnings',
            code: `const themeWarnings = logs.filter((l) => /text content mismatch on <p\\.mode>|class mismatch/i.test(l))
expect(themeWarnings).toEqual([])`,
          },
          {
            name: 'the dark theme is applied after mounting',
            code: `expect(classes('.page')).toContain('theme-dark')
expect(text('.mode')).toBe('dark mode')`,
          },
        ],
        explain: 'The first client render now equals the server\'s HTML, so hydration adopts it silently. `onMounted` then changes the state, and Vue patches the class and the text with a normal update — which, unlike a mismatch, always reaches the DOM.',
      },
      {
        id: 'allow-clock',
        task: 'A visitor\'s local time can never match the server\'s. Mark the clock as an intentional difference with `data-allow-mismatch="text"` (Vue 3.5+) on the `<p class="clock">` — in `App.vue` **and** in `server-output.js`, because Vue reads the attribute from the server-rendered element.',
        hint: 'App.vue: `<p class="clock" data-allow-mismatch="text">`. server-output.js: `\'<p class="clock" data-allow-mismatch="text">Local time: 09:00:00</p>\'`.',
        tests: [
          {
            name: 'no clock-related hydration warnings',
            code: `const clockWarnings = logs.filter((l) => /mismatch on <p\\.clock>/i.test(l))
expect(clockWarnings).toEqual([])
expect(text('.clock')).toContain('Local time:')`,
          },
        ],
        explain: 'The attribute documents an intentional difference and silences the warning; Vue still replaces the text with the visitor\'s time. In a real SSR app the server renders the attribute automatically, because it runs the same template. The alternative fix — render a placeholder and fill in the time in `onMounted` — avoids the difference entirely.',
      },
      {
        id: 'valid-nesting',
        task: 'Fix the shipping note: a `<div>` can\'t live inside a `<p>`, so the browser rearranges the server HTML. Make the note valid HTML — e.g. `<div class="note">Free shipping on orders over €50</div>` — in both `App.vue` and `server-output.js`.',
        hint: 'Replace `<p class="note"><div>…</div></p>` with `<div class="note">…</div>` in both files (or keep the `<p>` and use a `<span>` inside it).',
        tests: [
          {
            name: 'no children/node mismatches and the note is shown',
            code: `const structural = logs.filter((l) => /children mismatch|node mismatch/i.test(l))
expect(structural).toEqual([])
expect(exists('.note')).toBe(true)
expect(text('.note')).toContain('Free shipping')`,
          },
        ],
        explain: 'Hydration compares against the DOM the **browser** built, not the string the server sent. Invalid nesting (block elements in `<p>`, missing `<tbody>` in tables, nested `<a>` or `<form>`) makes those differ. Vue\'s compiler warns about invalid nesting during development — treat those warnings as bugs.',
      },
      {
        id: 'dead-html',
        task: 'See the "before hydration" state: comment out the `createSSRApp(App).mount(host)` line in `main.js`, run, and click the like button. Then restore it.',
        hint: 'Put `//` in front of the last line of `main.js`.',
        explain: 'Without hydration the page looks identical — it\'s the server\'s HTML — but nothing responds. On a real site this is the window between "HTML painted" and "JavaScript loaded and hydrated"; heavy bundles make it longer, which is why SSR doesn\'t replace bundle optimisation.',
      },
    ],
  },

  internals: {
    beginner: `
Hydration is a matching game. Vue runs your components in the browser and gets a description of the page (the virtual DOM). Then it holds that description next to the real page and goes through both in order: first element ↔ first element, its text ↔ its text, and so on. Every time they match, Vue just remembers "this element is mine" and hooks up the event listeners. Every time they don't, it complains and tries to repair what it can.
`,
    technical: [
      `
**The walk.** \`createSSRApp(App).mount(el)\` calls the renderer's \`hydrate\` path instead of \`patch\`. For each vnode it inspects the current DOM node:

- **Element:** same tag? Then hydrate its props (event listeners are attached; in development, \`class\`, \`style\` and known attributes are compared and mismatches reported) and recurse into its children.
- **Text:** same content? Adopt the text node. Different? Warn and set the client text.
- **Fragment** (multiple roots, \`v-for\`, slots): the server marks fragments with \`<!--[-->\` and \`<!--]-->\` comments so the client can find their boundaries. \`v-if\` that renders nothing leaves a \`<!--v-if-->\` comment.
- **Component:** run its setup and render, then hydrate its subtree.

**What Vue repairs.** Text mismatches are patched. A node of the wrong type or tag is replaced with a freshly mounted client node. Missing children are mounted; extra server children are removed. **Class, style and attribute** mismatches are check-only: the warning says the DOM won't be rectified, because comparing and fixing every attribute would slow production hydration down.
`,
      {
        code: `// What the dev warnings look like (from this lesson's playground)
[Vue warn]: Hydration text content mismatch on <p.mode>
  - rendered on server: light mode
  - expected on client: dark mode
[Vue warn]: Hydration class mismatch on <div.page.theme-light>
  - rendered on server: class="page theme-light"
  - expected on client: class="page theme-dark"
  Note: this mismatch is check-only. The DOM will not be rectified in production…
Hydration completed but contains mismatches.`,
        lang: 'text',
        title: 'reading the warnings',
      },
      `
**Why \`onMounted\` is the escape hatch.** Mount hooks run after hydration finishes and never run on the server. State changed there goes through the normal reactive update path — Vue diffs old and new virtual DOM and patches the real DOM, class and attributes included.

**Why \`useId()\` works.** Ids are derived from the component's position in the app tree (plus a per-app prefix, configurable with \`app.config.idPrefix\`), not from a counter shared by the whole process. The server and the browser build the same tree, so they produce the same ids.

**Lazy hydration (3.5+).** For async components you can delay hydration until the component is idle, visible, matches a media query or receives an interaction: \`defineAsyncComponent({ loader: () => import('./Comments.vue'), hydrate: hydrateOnVisible() })\`. The server HTML is shown immediately; the JavaScript and hydration cost are paid only when needed.
`,
    ],
    production: `
- **Treat mismatch warnings as bugs.** In development they are detailed; in production you typically get only "Hydration completed but contains mismatches." — and possibly wrong classes or attributes users can see. Fix them before shipping; consider an automated check that fails CI on hydration warnings in end-to-end tests.
- **Make data deterministic.** Fetch on the server and transfer the payload to the client instead of fetching again (Nuxt's \`useFetch\`/\`useAsyncData\` do this). Format dates with an explicit time zone and locale shared by both sides, or format them after mount.
- **Read user preferences the server can see.** For themes, locales and A/B buckets, a cookie lets the server render the right variant from the start — no mismatch and no flash.
- **Keep client-only widgets client-only.** Maps, charts and libraries that touch \`window\` during setup belong behind a mounted flag or a client-only wrapper (Nuxt ships \`<ClientOnly>\`).
- **Write valid HTML**, and watch out for browser extensions that inject attributes or nodes — they can trigger warnings you can\'t reproduce in a clean profile.
- **Measure hydration cost.** Large pages pay for running every component in the browser; lazy hydration, smaller component trees and less JavaScript on mostly-static pages help.
`,
  },

  mistakes: [
    {
      title: 'Reading browser-only values during setup',
      wrong: { code: `const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0)`, lang: 'js' },
      right: { code: `const width = ref(0)\nonMounted(() => {\n  width.value = window.innerWidth\n})`, lang: 'js' },
      explanation: 'The guard avoids a server crash but guarantees a mismatch: the server renders 0, the browser something else. Keep the first render identical and update after mount.',
    },
    {
      title: 'Random values or ids from a counter',
      wrong: { code: `const id = 'field-' + Math.random().toString(36).slice(2)\n// or: let next = 0 … const id = 'field-' + next++`, lang: 'js' },
      right: { code: `import { useId } from 'vue'\nconst id = useId() // 3.5+`, lang: 'js' },
      explanation: 'Random values differ by definition; module-level counters keep growing across server requests. `useId()` derives ids from the component tree, so both sides agree.',
    },
    {
      title: 'Hiding real bugs with data-allow-mismatch',
      wrong: { code: `<div data-allow-mismatch :class="'theme-' + theme">  <!-- silences, doesn't fix -->`, lang: 'vue' },
      right: { code: `<div :class="'theme-' + theme">  <!-- theme set in onMounted (or from a cookie) -->`, lang: 'vue' },
      explanation: 'The attribute only removes the warning. The class still stays as the server rendered it. Reserve it for genuinely unavoidable differences such as a visitor\'s local time.',
    },
    {
      title: 'Invalid HTML nesting',
      wrong: { code: `<p class="note"><div>Free shipping</div></p>\n<table><tr><td>…</td></tr></table>`, lang: 'vue' },
      right: { code: `<div class="note">Free shipping</div>\n<table><tbody><tr><td>…</td></tr></tbody></table>`, lang: 'vue' },
      explanation: 'The browser repairs invalid markup while parsing the server HTML (closing the `<p>`, inserting `<tbody>`), so the DOM no longer matches the template. Write HTML the parser keeps as-is.',
    },
    {
      title: 'Using createApp in the client entry of an SSR app',
      wrong: { code: `createApp(App).mount('#app') // discards the server HTML`, lang: 'js' },
      right: { code: `createSSRApp(App).mount('#app') // hydrates it`, lang: 'js' },
      explanation: '`createApp().mount()` clears the container and renders from scratch, losing the benefit of SSR (and possibly causing a flash). SSR client entries use `createSSRApp`.',
    },
  ],

  debugging: [
    {
      symptom: '`Hydration text content mismatch` on an element showing a date or price.',
      cause: 'Server and browser format differently — another time zone, locale or clock.',
      fix: 'Format with an explicit `timeZone` and `locale` known to both sides, render the formatted value on the server and reuse it, format after mount, or mark it with `data-allow-mismatch="text"` if the difference is intended.',
    },
    {
      symptom: 'The page text says one thing but the styling says another (e.g. "dark mode" with light colours).',
      cause: 'A class mismatch: Vue patched the text but left the server\'s class in place.',
      fix: 'Remove the source of the difference — set the value in `onMounted`, or let the server know it (cookie) so both render the same.',
    },
    {
      symptom: '`Hydration children mismatch … server rendered element contains more/fewer child nodes`.',
      cause: 'Invalid HTML repaired by the browser, a `v-if` that depends on browser-only state, or a third-party script/extension that modified the DOM before hydration.',
      fix: 'Validate the nesting (Vue\'s compiler warns about it), move browser-only conditions after mount or into a client-only wrapper, and test in a clean browser profile.',
    },
    {
      symptom: '`label for` and `input id` disagree after hydration, or attribute mismatch warnings on ids.',
      cause: 'Ids generated with a counter or random value.',
      fix: 'Use `useId()` (3.5+), which is stable across server and client.',
    },
    {
      symptom: 'Production logs "Hydration completed but contains mismatches." with no detail.',
      cause: 'Detailed mismatch messages are stripped from production builds by default.',
      fix: 'Reproduce in a development build, or enable `__VUE_PROD_HYDRATION_MISMATCH_DETAILS__` (3.4+) in a debugging build.',
    },
  ],

  bestPractices: [
    'Make the first client render identical to the server render; apply browser-only values in `onMounted`.',
    'Use `useId()` (3.5+) for ids, never counters or random values.',
    'Transfer server-fetched data to the client instead of refetching (frameworks do this for you).',
    'Format dates and numbers deterministically (explicit time zone and locale), or after mount.',
    'Write valid HTML and heed the compiler\'s nesting warnings.',
    'Use `data-allow-mismatch` only for genuinely intentional differences, rendered on both sides.',
    'Wrap components that need the browser to render at all in a client-only wrapper with a fallback.',
    'Treat hydration warnings as bugs and catch them in development and end-to-end tests.',
  ],

  useCases: [
    'Theme or locale preferences saved in the browser — set after mount, or move them to a cookie.',
    'Relative times ("5 minutes ago") and local clocks.',
    'Accessible forms with `label for` / `aria-describedby` ids in SSR apps — `useId()`.',
    'Charts, maps and editors that touch `window` — client-only with a placeholder.',
    'Long pages with below-the-fold comments or widgets — lazy hydration (3.5+).',
  ],

  whenToUse: {
    use: [
      '`onMounted` for anything that depends on the browser: storage, window size, local time, feature detection.',
      '`useId()` whenever an SSR-rendered component needs an id.',
      '`data-allow-mismatch` for small, intentional, unavoidable differences like a visitor\'s local time.',
    ],
    avoid: [
      'Reading `window`, `document`, `localStorage` or `navigator` during setup in SSR code — even with a `typeof` guard.',
      '`Math.random()`, `Date.now()` or module counters in rendered output.',
      'Blanket `data-allow-mismatch` on large subtrees to make warnings go away.',
    ],
  },

  comparison: {
    title: 'Fixes for hydration differences',
    headers: ['', 'Set in `onMounted`', '`useId()`', '`data-allow-mismatch`', 'Client-only wrapper'],
    rows: [
      ['Use for', 'browser-only values (theme, width, time)', 'ids for labels/ARIA', 'intentional, unavoidable differences', 'components that can\'t render on the server'],
      ['Removes the mismatch?', 'yes', 'yes', 'no — silences the warning', 'yes (server renders a fallback)'],
      ['Cost', 'first paint shows the default value', 'none', 'DOM text replaced; class/attrs stay as server rendered', 'content appears only after JS'],
      ['Version', 'any Vue 3', '3.5+', '3.5+', 'any (Nuxt ships `<ClientOnly>`)'],
    ],
    note: 'Frameworks handle much of this plumbing for you: meet [Nuxt](lesson:nuxt-intro).',
  },

  quiz: [
    {
      id: 'hydration-q1',
      type: 'mcq',
      prompt: 'What does hydration do?',
      options: [
        { text: 'The server re-renders the page whenever data changes.', why: 'Hydration happens in the browser, once, after the server HTML arrives.' },
        { text: 'Vue in the browser adopts the server-rendered DOM, attaching listeners and connecting components, instead of rendering from scratch.' },
        { text: 'The browser downloads the HTML a second time with JavaScript included.', why: 'Nothing is downloaded twice; the existing DOM is reused.' },
        { text: 'It converts the virtual DOM into an HTML string.', why: 'That is server rendering (renderToString), the step before hydration.' },
      ],
      answer: 1,
      explanation: 'Hydration makes server HTML interactive by matching it with the client\'s virtual DOM and attaching listeners.',
    },
    {
      id: 'hydration-q2',
      type: 'output',
      prompt: 'The server rendered `<div class="theme-light">`; the client\'s first render says `theme-dark`. After hydration (production build), which class is on the element?',
      code: { lang: 'vue', code: `<div :class="'theme-' + theme">…</div>\n<!-- server: theme = 'light' · client: theme = 'dark' -->` },
      options: [
        { text: '`theme-dark` — Vue always applies the client value', why: 'That\'s true for text, but class, style and attribute mismatches are check-only and not rectified.' },
        { text: '`theme-light` — the server\'s class stays' },
        { text: 'Both classes', why: 'Vue doesn\'t merge them; it simply leaves the server\'s attribute value alone.' },
        { text: 'No class — Vue removes conflicting attributes', why: 'Nothing is removed; the mismatch is only reported (in development).' },
      ],
      answer: 1,
      explanation: 'Vue patches text mismatches, but for class/style/attribute mismatches it only warns (in development). The DOM keeps the server value until something triggers a real update.',
    },
    {
      id: 'hydration-q3',
      type: 'bug',
      prompt: 'This SSR component produces a hydration mismatch on every page load. Click the line responsible.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { computed } from 'vue'

const props = defineProps({ product: Object })
const price = computed(() => props.product.price.toFixed(2))
const badgeId = 'badge-' + Math.random().toString(36).slice(2, 8)
</script>

<template>
  <span :id="badgeId">€{{ price }}</span>
</template>`,
      },
      answerLine: 6,
      explanation: 'A random id differs between server and client every time. Use `useId()` (3.5+). The computed price is deterministic, so it\'s fine.',
    },
    {
      id: 'hydration-q4',
      type: 'fill',
      prompt: 'Complete the SSR-safe id and mark the visitor\'s local time as an intentional text difference.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ___ } from 'vue'
const id = useId()
</script>

<template>
  <label :for="id">Email</label> <input :id="id" />
  <time data-allow-mismatch="___">{{ new Date().toLocaleTimeString() }}</time>
</template>`,
      },
      answer: [['useId'], ['text']],
      explanation: '`useId()` (3.5+) gives matching ids on both sides. `data-allow-mismatch="text"` (3.5+) silences text-mismatch warnings for that element — and must be rendered by the server too.',
    },
    {
      id: 'hydration-q5',
      type: 'mcq',
      prompt: 'Which of these cause hydration mismatches in an SSR app? (Select all that apply.)',
      options: [
        { text: '`{{ Date.now() }}` in a template' },
        { text: 'Reading `localStorage` in `setup()` to choose what to render' },
        { text: 'A `<div>` nested inside a `<p>`' },
        { text: 'Reading `localStorage` in `onMounted()` and updating a ref', why: '`onMounted` runs after hydration, so the change is a normal update, not a mismatch.' },
        { text: 'A `computed` derived from props', why: 'Same props on both sides give the same result — deterministic rendering is fine.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Time, browser-only state during setup and invalid HTML make the client\'s first render differ from the server\'s DOM.',
    },
    {
      id: 'hydration-q6',
      type: 'mcq',
      prompt: 'Where does `data-allow-mismatch="text"` need to be present to silence a text mismatch?',
      options: [
        { text: 'Only in the client bundle', why: 'Vue checks the attribute on the server-rendered DOM element during hydration.' },
        { text: 'On the server-rendered element (in practice: in the template both sides render)' },
        { text: 'In `app.config`', why: 'There is no global setting; it\'s a per-element attribute.' },
        { text: 'On the `<html>` element', why: 'It applies to the element (and, for text/children, its descendants) it is placed on.' },
      ],
      answer: 1,
      explanation: 'Vue reads the attribute from the existing DOM node (or an ancestor for text/children mismatches). Because the server renders the same template, putting it in the template covers both.',
    },
    {
      id: 'hydration-q7',
      type: 'short',
      prompt: 'Why does moving a `localStorage` read from `setup()` into `onMounted()` fix a hydration mismatch?',
      answer: 'The server has no localStorage, so it renders the default value. If setup reads localStorage, the browser\'s first render differs from the server HTML. In onMounted, the first client render still uses the default (matching the server), hydration succeeds, and then the stored value is applied as a normal reactive update — which Vue fully patches into the DOM.',
    },
  ],

  exercises: [
    {
      id: 'client-only-wrapper',
      title: 'Build a <ClientOnly> wrapper',
      difficulty: 'advanced',
      prompt: `
\`ScreenInfo.vue\` reads \`window\` and \`navigator\` during setup, so it can't render on a server. The server therefore sent the **fallback** (see \`server-output.js\`). Right now \`ClientOnly.vue\` renders the widget immediately, so hydration mismatches — and the widget even keeps the wrong class.

Implement \`ClientOnly.vue\`:

- During SSR **and** during hydration, render the \`#fallback\` slot.
- After the component has mounted in the browser, render the default slot instead.

When it works, the page hydrates **without any mismatch warnings**, then shows \`<p class="screen">\` and no \`.loading\`.
`,
      files: {
        'main.js': clientOnlyMain,
        'server-output.js': clientOnlyServer,
        'App.vue': clientOnlyApp,
        'ClientOnly.vue': clientOnlyStarter,
        'ScreenInfo.vue': screenInfo,
      },
      hints: [
        'You need a piece of state that is `false` on the server and during hydration, and becomes `true` only in the browser afterwards.',
        '`const mounted = ref(false)` plus `onMounted(() => { mounted.value = true })` — `onMounted` never runs on the server.',
        'Template: `<slot v-if="mounted" />` and `<slot v-else name="fallback" />`.',
      ],
      solution: {
        explanation: 'The mounted flag makes the first client render identical to the server\'s (the fallback), so hydration adopts the existing `<p class="loading">`. Then `onMounted` flips the flag and Vue swaps in the real widget with a normal update. This is the idea behind Nuxt\'s built-in `<ClientOnly>` component.',
        files: {
          'main.js': clientOnlyMain,
          'server-output.js': clientOnlyServer,
          'App.vue': clientOnlyApp,
          'ClientOnly.vue': clientOnlySolution,
          'ScreenInfo.vue': screenInfo,
        },
      },
      tests: [
        { name: 'hydrates without mismatch warnings', code: noMismatch },
        { name: 'shows the widget after mounting', code: `expect(exists('.screen')).toBe(true)\nexpect(exists('.loading')).toBe(false)\nexpect(text('.screen')).toContain('Window:')` },
      ],
    },
    {
      id: 'stable-ids',
      title: 'Stable ids with useId()',
      difficulty: 'intermediate',
      prompt: `
\`FormField.vue\` builds its id from a module-level counter. On a real server that counter keeps growing across requests, so server and browser ids never agree. \`server-output.js\` holds what the server sends once the component is fixed.

- Replace the counter with \`useId()\` (Vue 3.5+) so the page hydrates **without mismatch warnings**.
- Each \`<label>\`'s \`for\` must equal its \`<input>\`'s \`id\`, and the two fields must have different ids.
- Don't hard-code ids.
`,
      files: {
        'main.js': idMain,
        'server-output.js': idServer,
        'App.vue': idApp,
        'FormField.vue': fieldStarter,
      },
      hints: [
        'Delete the separate `<script>` block with `nextId` — module-level state is the problem.',
        '`import { useId } from \'vue\'` in `<script setup>`.',
        '`const id = useId()` — it must be called during setup (not inside a callback).',
      ],
      solution: {
        explanation: '`useId()` derives an id from the component\'s position in the app, so the server render and the client render produce the same values. A module-level counter depends on how many components that process has ever rendered — on a server, that\'s every request since startup.',
        files: {
          'main.js': idMain,
          'server-output.js': idServer,
          'App.vue': idApp,
          'FormField.vue': fieldSolution,
        },
      },
      tests: [
        { name: 'hydrates without mismatch warnings', code: noMismatch },
        {
          name: 'labels point at their inputs and ids are unique',
          code: `const fields = findAll('.field')
expect(fields.length).toBe(2)
const ids = fields.map((f) => f.querySelector('input').id)
fields.forEach((f, i) => expect(f.querySelector('label').getAttribute('for')).toBe(ids[i]))
expect(ids[0] === ids[1]).toBe(false)
expect(ids[0].length).toBeGreaterThan(0)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'hydration-what-is-it',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is hydration in Vue SSR, and why is it needed?',
      answer: 'Server-rendered HTML is static: no event listeners or reactive state. Hydration is the client-side step where `createSSRApp(App).mount()` runs the same app in the browser, matches its virtual DOM to the existing DOM nodes, adopts them, and attaches listeners — making the page interactive without re-creating the DOM.',
      explanation: 'It reuses the server\'s work instead of throwing it away, which avoids a flash and keeps SSR\'s fast first paint.',
      whyAsked: 'The foundation for every SSR discussion; mismatches only make sense once hydration is clear.',
      mistakes: ['Saying hydration re-renders the page from scratch.', 'Confusing it with fetching data.', 'Not knowing createSSRApp is used on the client.'],
      followUps: ['What happens if the client renders something different?', 'What is lazy hydration?'],
      modelAnswer: 'SSR sends finished HTML, but it\'s inert — no listeners, no reactive connections. Hydration is the browser step where I call createSSRApp with the same root component and mount it on the container. Vue renders a virtual tree, walks it alongside the existing DOM, adopts each matching node and attaches event listeners, so the page becomes interactive without rebuilding the DOM. The requirement is that the client\'s first render matches the server\'s HTML.',
    },
    {
      id: 'hydration-mismatch-causes',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What typically causes hydration mismatches, and how do you fix each cause?',
      answer: '(1) Browser-only values during setup — localStorage, window size, user agent: keep the first render neutral and update in `onMounted`, or let the server know (cookie). (2) Non-deterministic values — `Date.now()`, `Math.random()`, time zones/locales: pass the server value along, format deterministically, format after mount, or `data-allow-mismatch` for intended differences (3.5+). (3) Ids from counters: `useId()` (3.5+). (4) Invalid HTML that the browser repairs: fix the nesting. (5) Different data on server and client: transfer the server payload instead of refetching. (6) External DOM changes (extensions, third-party scripts): client-only wrappers, clean-profile testing.',
      explanation: 'Every cause is a way the client\'s first render can differ from the DOM the browser built from the server HTML.',
      whyAsked: 'Mismatches are the most common SSR bug class.',
      mistakes: ['Only knowing "use onMounted".', 'Suggesting `data-allow-mismatch` for everything.', 'Forgetting invalid HTML.'],
      followUps: ['What does Vue repair automatically and what not?', 'How do you debug a production-only mismatch?'],
      modelAnswer: 'The usual suspects are browser-only values read during setup, non-deterministic output like dates, random values and locale formatting, ids from counters, invalid HTML that the browser restructures, and data fetched differently on each side. The fixes match the causes: neutral first render then onMounted for browser values, deterministic formatting or a transferred payload for data, useId for ids, valid nesting for HTML, and data-allow-mismatch only for truly intentional differences like a local clock.',
    },
    {
      id: 'hydration-date-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'An SSR blog shows `Hydration text content mismatch` on the "Published" date: server "21/10/2026, 09:00:00", client "10/21/2026, 11:00:00 AM". What\'s going on and what are your options?',
      answer: '`toLocaleString()` uses the runtime\'s default locale and time zone. The server (often UTC, some default locale) and the visitor\'s browser differ. Options: format with explicit `locale` and `timeZone` on both sides (e.g. the site\'s locale and the article\'s time zone); render a machine-readable `<time datetime="…">` with server formatting and optionally re-format after mount; if showing the visitor\'s local time is desired, render it after mount or mark the element with `data-allow-mismatch="text"` (3.5+).',
      explanation: 'Locale and time zone are environment-dependent inputs; make them explicit or move the formatting to the client deliberately.',
      whyAsked: 'A realistic, very common SSR bug.',
      mistakes: ['Blaming Vue.', 'Suppressing the warning without deciding which time the user should see.', 'Forgetting time zones and only fixing the locale.'],
      followUps: ['How would you test this?', 'What does Vue do with the mismatched text?'],
      modelAnswer: 'toLocaleString depends on the environment\'s locale and time zone, and the server and the visitor don\'t share either, so the two renders differ. First I\'d decide what the user should see. If it\'s the article\'s time, I pass an explicit locale and timeZone so both sides format identically. If it\'s the visitor\'s local time, I render something neutral on the server and format in onMounted, or mark it with data-allow-mismatch="text". Vue would replace the text anyway, but the warning signals a real inconsistency.',
    },
    {
      id: 'hydration-class-output',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'During hydration the server HTML has `<p class="mode light">light mode</p>` but the client renders `<p class="mode dark">dark mode</p>`. In a production build, what does the user end up seeing?',
      options: [
        'class="mode dark", text "dark mode"',
        'class="mode light", text "dark mode"',
        'class="mode light", text "light mode"',
        'The element is removed and re-created',
      ],
      correctOption: 1,
      answer: 'Vue patches the text to the client value ("dark mode") but does not rectify class mismatches — the server\'s `class="mode light"` stays. The user sees dark-mode text with light styling until some later update changes the class.',
      explanation: 'Text mismatches are fixed; class/style/attribute mismatches are check-only (dev warning) for performance reasons.',
      whyAsked: 'Shows deep understanding of hydration behaviour and why mismatches can cause visible bugs.',
      mistakes: ['Assuming Vue fixes everything.', 'Assuming the element is re-created (that happens for a different tag or node type).'],
      followUps: ['How would you fix the root cause?', 'When does Vue replace a node instead?'],
      modelAnswer: 'The text gets corrected to "dark mode", because Vue patches text mismatches. The class doesn\'t — attribute, class and style mismatches are only reported in development and never rectified, to keep hydration fast. So the user sees dark-mode text with light styling, a visibly inconsistent page. The real fix is to make the first render match, for example reading the preference in onMounted or from a cookie on the server.',
    },
    {
      id: 'hydration-invalid-html',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A component renders `<p class="intro"><div class="banner">Sale!</div></p>`. It works perfectly as a CSR app, but under SSR you get children and node mismatch warnings. Why?',
      answer: 'The server sends that markup as a string, and the browser\'s HTML parser repairs it: a `<div>` can\'t be inside a `<p>`, so the parser closes the `<p>` early, producing `<p class="intro"></p><div class="banner">Sale!</div><p></p>`. Vue hydrates against this repaired DOM, which doesn\'t match the template\'s tree. In CSR the DOM is built with DOM APIs, which allow the invalid nesting, so no problem shows. Fix the markup (`<div class="intro">` or a `<span>` inside the `<p>`); Vue\'s compiler warns about invalid nesting in development.',
      explanation: 'Hydration compares with the parsed DOM, not with the HTML string.',
      whyAsked: 'A subtle bug that tests understanding of how browsers parse HTML versus how Vue builds DOM.',
      mistakes: ['Blaming Vue\'s SSR renderer.', 'Adding data-allow-mismatch.', 'Not knowing about parser repair rules (also tables and tbody).'],
      followUps: ['What other invalid structures cause this?', 'Why doesn\'t CSR show it?'],
      modelAnswer: 'Under SSR the browser parses the server\'s HTML string, and the HTML parser doesn\'t allow a div inside a p: it closes the paragraph early, so the real DOM has extra siblings and an empty paragraph. Vue then hydrates against that repaired tree and finds the children don\'t line up. In CSR the DOM is created with DOM APIs that permit the invalid nesting, which is why it never showed up before. The fix is valid markup — a div wrapper or a span — and listening to the compiler\'s nesting warnings.',
    },
    {
      id: 'hydration-lazy-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A long, server-rendered product page feels sluggish on mid-range phones: content shows fast, but the first taps are slow to respond. How would you approach it?',
      answer: 'The likely cost is hydration: the browser downloads and runs every component on the page before it\'s interactive. Measure first (performance profile, Interaction to Next Paint). Then: ship less JavaScript (code-split, remove unused libraries); keep mostly-static parts as plain markup with few components; use lazy hydration for below-the-fold or rarely used components — `defineAsyncComponent({ loader, hydrate: hydrateOnVisible() })` or `hydrateOnIdle()` / `hydrateOnInteraction()` (Vue 3.5+); avoid hydration mismatches, which force extra DOM work; defer non-critical third-party scripts. Frameworks may offer additional patterns for this (e.g. delayed hydration of lazy components or server-only components) — check what your version supports.',
      explanation: 'SSR makes content visible early; hydration cost decides when it becomes usable.',
      whyAsked: 'Senior-level performance question about the hidden cost of SSR.',
      mistakes: ['"Add more SSR."', 'Not measuring.', 'Not knowing lazy hydration exists.'],
      followUps: ['What are the risks of lazy hydration (a click before hydration)?', 'How would you measure hydration time?'],
      modelAnswer: 'I\'d suspect hydration: everything on the page has to download and run before it reacts, so I\'d confirm with a performance profile and INP from real users. Then I\'d cut JavaScript, keep static sections as plain markup, and use Vue 3.5\'s lazy hydration for below-the-fold pieces — hydrateOnVisible for comments, hydrateOnInteraction for a rarely used widget. I\'d also fix any mismatches, since they cause extra DOM work, and defer third-party scripts. Then measure again.',
    },
    {
      id: 'hydration-coding-browser-value',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Write a composable `useBrowserValue(getter, fallback)` in `useBrowserValue.js`. It returns a ref that renders `fallback` on the server and during hydration, then holds `getter()` once mounted in the browser. The playground hydrates real server HTML (`Width: 0px`).',
      starter: {
        files: {
          'main.js': bvMain,
          'server-output.js': bvServer,
          'App.vue': bvApp,
          'useBrowserValue.js': bvStarter,
        },
      },
      tests: [
        { name: 'hydrates without mismatch warnings', code: noMismatch },
        { name: 'shows the real value after mounting', code: `expect(text('.width')).toBe('Width: ' + window.innerWidth + 'px')` },
        {
          name: 'the getter is not called during setup',
          code: `const { useBrowserValue } = requireModule('useBrowserValue.js')
let calledDuringSetup = null
let called = false
const value = withSetup(() => {
  const r = useBrowserValue(() => { called = true; return 42 }, 0)
  calledDuringSetup = called
  return r
})
expect(calledDuringSetup).toBe(false)
expect(value.value).toBe(42)`,
        },
      ],
      hints: [
        'Start the ref with `fallback`, not with `getter()`.',
        'Register `onMounted` inside the composable — composables can use lifecycle hooks because they run during setup.',
        'In the hook: `value.value = getter()`.',
      ],
      answer: 'Create `ref(fallback)`, register `onMounted(() => { value.value = getter() })`, and return the ref. The server and the first client render both use the fallback; the real value arrives as a normal update after hydration.',
      solution: {
        files: {
          'main.js': bvMain,
          'server-output.js': bvServer,
          'App.vue': bvApp,
          'useBrowserValue.js': bvSolution,
        },
      },
      explanation: 'The composable packages the golden rule — "same first render, browser values after mount" — so components can\'t get it wrong. The getter is never called on the server, so it may freely use `window`.',
      whyAsked: 'Checks that you can turn an SSR rule into reusable code and that you understand when lifecycle hooks run.',
      mistakes: ['Calling getter() during setup "with a typeof window guard".', 'Using watchEffect, which runs during setup.', 'Forgetting that onMounted never runs on the server.'],
      followUps: ['How would you also react to window resizes (and clean up)?', 'Could the server know some of these values (cookies, headers)?'],
      modelAnswer: 'I start the ref with the fallback, so the server render and the first client render agree, and I register onMounted inside the composable to replace it with getter() in the browser. Because onMounted never runs on the server, the getter can safely touch window or localStorage. Hydration matches, and the real value arrives as a normal reactive update. For live values like the window size I\'d add a listener in onMounted and remove it in onUnmounted.',
    },
  ],

  takeaways: [
    'Hydration: `createSSRApp().mount()` adopts server HTML, attaching listeners instead of re-rendering.',
    'The first client render must match the server render — node for node.',
    'Vue patches mismatched text and replaces mismatched nodes, but class/style/attribute mismatches stay as the server rendered them.',
    'Browser-only values go in `onMounted`; ids come from `useId()` (3.5+); dates are formatted deterministically or after mount.',
    '`data-allow-mismatch` (3.5+) silences intentional differences; it must be rendered by the server and doesn\'t fix anything.',
    'Invalid HTML is repaired by the browser\'s parser and breaks hydration — write valid nesting.',
  ],
}
