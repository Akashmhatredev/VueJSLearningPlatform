// Lesson: Dynamic components with <component :is>

const dynApp = `<script setup>
import { shallowRef } from 'vue'
import TabProfile from './TabProfile.vue'
import TabNotes from './TabNotes.vue'
import TabBilling from './TabBilling.vue'

const tabs = [
  { label: 'Profile', component: TabProfile },
  { label: 'Notes', component: TabNotes },
  { label: 'Billing', component: TabBilling },
]

const current = shallowRef(tabs[0])
</script>

<template>
  <nav class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.label"
      class="tab"
      :class="{ active: current === tab }"
      @click="current = tab"
    >
      {{ tab.label }}
    </button>
  </nav>

  <component :is="current.component" class="panel" />
</template>

<style>
.tabs { display: flex; gap: 6px; margin-bottom: 8px; }
.tab { padding: 4px 12px; border: 2px solid #222; border-radius: 8px 8px 0 0; background: #fff; }
.tab.active { background: #222; color: #fff; }
.panel { border: 2px solid #222; border-radius: 0 8px 8px 8px; padding: 10px 14px; }
</style>`

const tabProfile = `<template>
  <section>
    <h3>Profile</h3>
    <p class="user-name">Guest</p>
  </section>
</template>`

const tabNotes = `<script setup>
import { ref } from 'vue'

// local state: lives only as long as this component instance
const draft = ref('')
</script>

<template>
  <section>
    <h3>Notes</h3>
    <textarea class="draft" v-model="draft" placeholder="Write a note…"></textarea>
    <p class="chars">{{ draft.length }} characters</p>
  </section>
</template>`

const tabBilling = `<template>
  <section>
    <h3>Billing</h3>
    <p class="plan">Free plan</p>
  </section>
</template>`

const wizardFiles = {
  'StepAccount.vue': `<template>
  <div class="step-account">
    <h3>Create your account</h3>
    <p>Email and password go here.</p>
  </div>
</template>`,
  'StepAddress.vue': `<template>
  <div class="step-address">
    <h3>Shipping address</h3>
    <p>Street, city, postcode.</p>
  </div>
</template>`,
  'StepConfirm.vue': `<template>
  <div class="step-confirm">
    <h3>All done?</h3>
    <p>Review and confirm.</p>
  </div>
</template>`,
}

const blockFiles = {
  'HeadingBlock.vue': `<script setup>
defineProps({ text: String })
</script>

<template>
  <h2 class="block-heading">{{ text }}</h2>
</template>`,
  'ParagraphBlock.vue': `<script setup>
defineProps({ text: String })
</script>

<template>
  <p class="block-paragraph">{{ text }}</p>
</template>`,
  'QuoteBlock.vue': `<script setup>
defineProps({ text: String, author: String })
</script>

<template>
  <blockquote class="block-quote">
    “{{ text }}” <cite>— {{ author }}</cite>
  </blockquote>
</template>`,
  'UnknownBlock.vue': `<script setup>
defineProps({ type: String })
</script>

<template>
  <p class="unknown-block">Unsupported block: {{ type }}</p>
</template>`,
}

export default {
  id: 'dynamic-components',
  title: 'Dynamic components with <component :is>',
  summary: 'Render a component chosen at runtime with <component :is>, understand what happens to state when it switches, and keep it alive with <KeepAlive> when you need to.',
  difficulty: 'intermediate',
  minutes: 25,
  prerequisites: ['why-components', 'props'],
  related: ['keep-alive', 'async-components', 'shallow-and-raw', 'router-basics', 'render-functions', 'lifecycle-hooks'],
  tags: ['dynamic components', '<component :is>', 'is', 'KeepAlive', 'tabs', 'shallowRef', 'markRaw', 'component registry', 'wizard'],
  apis: [
    { name: '<component :is>', summary: 'Built-in placeholder that renders whatever component (or HTML tag) `is` points to.' },
    { name: '<KeepAlive>', summary: 'Caches inactive component instances instead of destroying them, preserving their state.' },
    { name: 'shallowRef()', summary: 'A ref that does not make its value deeply reactive — the right container for component objects.' },
  ],
  docs: [
    { label: 'Vue Guide — Dynamic Components', url: 'https://vuejs.org/guide/essentials/component-basics.html#dynamic-components' },
    { label: 'API — <component>', url: 'https://vuejs.org/api/built-in-special-elements.html#component' },
    { label: 'Vue Guide — KeepAlive', url: 'https://vuejs.org/guide/built-ins/keep-alive.html' },
  ],

  intro: `
Sometimes you don't know *which* component to render until the app is running: the active tab, the current step of a wizard, the widget a user picked for their dashboard, the block type a CMS sent.

Vue's built-in \`<component>\` element is a placeholder for exactly that. Bind its \`is\` attribute to a component — \`<component :is="current" />\` — and Vue renders that component. Change \`current\` and Vue swaps it for another.

By default, swapping **destroys** the old component and **creates** the new one, so local state is lost. Wrap it in \`<KeepAlive>\` when you want switched-away components to keep their state.
`,

  why: `
Without dynamic components, a tab interface turns into a staircase of conditionals:

\`\`\`vue
<TabProfile v-if="tab === 'profile'" />
<TabNotes v-else-if="tab === 'notes'" />
<TabBilling v-else-if="tab === 'billing'" />
<!-- …and one more line every time a tab is added -->
\`\`\`

That works for three tabs. It doesn't scale to a dashboard with twenty widget types, or to content from a CMS where the list of blocks comes from data.

With \`<component :is>\`, the **choice of component becomes data**. You keep a list or a map (\`{ heading: HeadingBlock, quote: QuoteBlock }\`) and render \`<component :is="registry[block.type]" />\`. Adding a type means adding one entry — the template doesn't change.
`,

  eli15: `
Think of a TV. The screen (\`<component>\`) stays the same, but the **channel** decides what you see. Press a button on the remote (\`current = TabNotes\`) and the screen shows a different show.

Normally, switching channels means the old show is gone — when you come back, it doesn't remember where you were. That's what happens to a component's state when you switch away.

\`<KeepAlive>\` is like a TV with a **pause** feature for every channel: switch away and the show pauses; come back and it continues exactly where you left it.
`,

  analogy: {
    title: 'A TV and its channels',
    body: `
The TV set is always on the wall. The remote picks which channel's programme fills the screen. Without a recorder, switching channels loses your place. With a recorder that pauses each channel, coming back resumes exactly where you were — at the cost of the recorder's storage.
`,
    mapping: [
      ['the TV screen', '`<component>` — the placeholder in your template'],
      ['the current channel', 'the value bound to `:is`'],
      ['pressing a channel button', 'changing `current` to another component'],
      ['losing your place on switch', 'the old component is unmounted and its state destroyed'],
      ['a recorder that pauses each channel', '`<KeepAlive>` caching inactive instances'],
      ['the recorder\'s limited storage', 'KeepAlive\'s `max` option and memory cost'],
    ],
  },

  visual: {
    type: 'rendering-lab',
    props: { mode: 'dynamic' },
    title: 'Switch components live',
    caption: 'Switch between components rendered with `<component :is>` and watch what happens to their state — with and without `<KeepAlive>`.',
    alt: 'An interactive demo with buttons to switch between several components rendered in one placeholder. A toggle wraps it in KeepAlive; with it off, typed state resets on every switch, with it on, state is preserved.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'What happens when :is changes',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'change', label: 'current = TabBilling', note: 'the :is value changes', tone: 'acid', x: 130, y: 60 },
        { id: 'diff', label: 'patch', note: 'different component type', x: 380, y: 60 },
        { id: 'unmount', label: 'unmount TabNotes', note: 'hooks run, state destroyed', tone: 'red', x: 260, y: 230 },
        { id: 'mount', label: 'mount TabBilling', note: 'fresh setup()', tone: 'cobalt', x: 500, y: 230 },
        { id: 'cache', label: '<KeepAlive> cache', note: 'deactivated, state kept', tone: 'kraft', x: 660, y: 60 },
      ],
      edges: [
        { from: 'change', to: 'diff' },
        { from: 'diff', to: 'unmount', label: 'without KeepAlive' },
        { from: 'diff', to: 'mount' },
        { from: 'diff', to: 'cache', label: 'with KeepAlive', dashed: true },
      ],
      steps: [
        { focus: ['change'], text: 'A click sets `current` to another component. The parent re-renders.' },
        { focus: ['diff'], edges: ['change->diff'], text: 'Vue compares the old and new virtual nodes. The **component type** is different, so this is not an update — it\'s a replacement.' },
        { focus: ['unmount'], edges: ['diff->unmount'], text: 'Without KeepAlive, the old instance is **unmounted**: its unmount hooks run, its effects stop, its DOM is removed — and its state (like a half-typed note) is gone.' },
        { focus: ['mount'], edges: ['diff->mount'], text: 'The new component is **mounted** from scratch: a fresh `setup()`, fresh refs, fresh DOM.' },
        { focus: ['cache'], edges: ['diff->cache'], text: 'With `<KeepAlive>`, the old instance is **deactivated** instead — its DOM is moved out of the page and kept in memory. Switching back **reactivates** it with its state intact.' },
      ],
    },
    caption: 'The lifecycle of a switch, with and without `<KeepAlive>`.',
    alt: 'A stepped diagram: changing current leads to a patch with a different component type. Without KeepAlive, the old component is unmounted and the new one mounted fresh. With KeepAlive (dashed), the old instance goes into a cache and can be reactivated later.',
  },

  syntax: [
    `
**Basic usage.** In \`<script setup>\`, components are just imported variables — pass the component object itself to \`:is\`:
`,
    {
      code: `<script setup>
import { shallowRef } from 'vue'
import TabProfile from './TabProfile.vue'
import TabNotes from './TabNotes.vue'

const current = shallowRef(TabProfile)   // shallowRef: don't make the component reactive
</script>

<template>
  <button @click="current = TabProfile">Profile</button>
  <button @click="current = TabNotes">Notes</button>

  <component :is="current" />
</template>`,
      lang: 'vue',
      title: 'switching between imported components',
    },
    `
**What \`is\` accepts:**

- an **imported component object** (the usual choice in \`<script setup>\`);
- a **registered component name** as a string — only for components registered globally with \`app.component()\` or locally in the Options API \`components\` option;
- an **HTML tag name**: \`<component :is="ordered ? 'ol' : 'ul'">\`.

Props, attributes, listeners, \`v-model\` and slots written on \`<component>\` go to whichever component is currently active:
`,
    {
      code: `<!-- v-bind spreads per-tab props kept in data; :user and @save go to every tab -->
<component
  :is="tabs[active].component"
  v-bind="tabs[active].props"
  :user="user"
  @save="onSave"
/>`,
      lang: 'vue',
      title: 'passing props and listeners',
    },
    `
**Keeping state alive.** Wrap the dynamic component in \`<KeepAlive>\`. Inactive instances are cached instead of destroyed:
`,
    {
      code: `<KeepAlive>
  <component :is="current" />
</KeepAlive>

<!-- only cache some components (by component name), and at most 5 -->
<KeepAlive include="TabNotes,TabDraft" :max="5">
  <component :is="current" />
</KeepAlive>`,
      lang: 'vue',
      title: '<KeepAlive>',
    },
    `
Cached components get two extra lifecycle hooks: \`onActivated()\` (also called on the first mount) and \`onDeactivated()\`. More in the [KeepAlive lesson](lesson:keep-alive).

**The rules:**

1. Store component objects in plain variables, arrays, objects or a \`shallowRef\` — **not** in \`ref()\` / \`reactive()\`, which would make the component definition itself reactive (Vue warns). \`markRaw(Component)\` is the alternative when it must live inside reactive state.
2. Switching to a different component **unmounts** the old one (state lost) unless it is inside \`<KeepAlive>\`.
3. A string like \`is="TabNotes"\` only works if \`TabNotes\` is *registered*. An import in \`<script setup>\` is not a registration by name — pass the object.
`,
    {
      callout: 'note',
      title: 'In-DOM templates',
      text: 'In templates written directly in HTML, `<tr is="vue:product-row">` tells Vue to replace a native element with a component (needed where HTML only allows certain children, like inside `<table>`). The `vue:` prefix is required in Vue 3.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: dynApp,
    intro: 'A tab bar whose panel is a single `<component :is>`. The list of tabs is plain data.',
    steps: [
      { lines: [3, 5], text: 'Each tab is a normal component, imported like any other. `<component :is>` needs the component *object*.' },
      { lines: [7, 11], text: 'The tabs live in a plain array — data, not template. Adding a tab means adding an entry. The array isn\'t reactive, so the component objects inside stay plain.' },
      { lines: [13], text: '`shallowRef` tracks *which* tab object is current, without making the tab objects (and the components inside them) deeply reactive.' },
      { lines: [18, 25], text: 'One button per tab. Clicking sets `current`; the `active` class compares object identity.' },
      { lines: [29], text: 'The placeholder. When `current.component` changes, Vue unmounts the old panel and mounts the new one. `class="panel"` falls through to whichever panel is active.' },
    ],
  },

  playground: {
    title: 'Account settings tabs',
    objective: 'Switch components at runtime, see state disappear on switch, keep it with <KeepAlive>, and pass per-tab props.',
    files: { 'App.vue': dynApp, 'TabProfile.vue': tabProfile, 'TabNotes.vue': tabNotes, 'TabBilling.vue': tabBilling },
    expected: 'Three tabs. Type something in **Notes**, switch to **Billing** and back: your note is gone — the Notes component was destroyed and recreated.',
    experiments: [
      {
        id: 'observe-unmount',
        task: 'Prove the Notes tab is destroyed on switch: in `TabNotes.vue`, import `onMounted` and `onUnmounted` and log **Notes mounted** / **Notes unmounted**. Open Notes, then switch to Profile and read the console.',
        hint: '`onMounted(() => console.log(\'Notes mounted\'))` and `onUnmounted(() => console.log(\'Notes unmounted\'))`.',
        tests: [
          {
            name: 'switching away unmounts the Notes tab',
            code: `await click(findAll('.tab')[1])
expect(logs).toContain('Notes mounted')
await click(findAll('.tab')[0])
expect(logs).toContain('Notes unmounted')`,
          },
        ],
        explain: 'A different component type in the same spot means *replace*, not *update*: the old instance runs its unmount hooks and is thrown away. Every visit to Notes creates a brand-new instance with a fresh `draft`.',
      },
      {
        id: 'keep-alive',
        task: 'Keep the note when switching tabs: wrap `<component :is>` in `<KeepAlive>`. Type a note, switch to Billing, come back — it should still be there.',
        hint: '`<KeepAlive><component :is="current.component" class="panel" /></KeepAlive>`. No import needed — it\'s a built-in.',
        tests: [
          {
            name: 'the draft survives a tab switch',
            code: `await click(findAll('.tab')[1])
await type('.draft', 'Buy milk')
await click(findAll('.tab')[2])
expect(exists('.draft')).toBe(false)
await click(findAll('.tab')[1])
expect(find('.draft').value).toBe('Buy milk')`,
          },
        ],
        explain: '`<KeepAlive>` deactivates the instance instead of unmounting it: its DOM is kept off-screen and its state stays in memory. If you did experiment 1, notice "Notes unmounted" no longer appears — `onDeactivated` would fire instead.',
      },
      {
        id: 'per-tab-props',
        task: 'Pass data to the active tab. Give each tab entry a `props` object — Profile: `{ name: \'Ada Lovelace\' }`, Notes: `{}`, Billing: `{ plan: \'Pro\' }` — and spread it with `v-bind="current.props"` on `<component>`. Make `TabProfile` declare a `name` prop shown in `.user-name`, and `TabBilling` a `plan` prop shown in `.plan`.',
        hint: 'In `TabProfile.vue`: `<script setup>defineProps({ name: String })</script>` and `{{ name }}` in `.user-name`.',
        tests: [
          { name: 'Profile shows the name', code: `expect(text('.user-name')).toBe('Ada Lovelace')` },
          { name: 'Billing shows the plan', code: `await click(findAll('.tab')[2]); expect(text('.plan')).toBe('Pro')` },
        ],
        explain: 'Keeping props next to the component in data means the template never has to know which tab needs what. Spreading an object with `v-bind` passes each key as a separate prop.',
      },
      {
        id: 'ref-warning',
        task: 'Change `shallowRef(tabs[0])` to `ref(tabs[0])` (import `ref`) and click a tab. Read the console, then change it back.',
        explain: '`ref()` makes its value deeply reactive, which would turn the component definitions inside into reactive proxies. Vue warns: `Vue received a Component that was made a reactive object…` and suggests `markRaw` or `shallowRef`. Component objects never change, so there\'s nothing to track inside them.',
      },
    ],
  },

  internals: {
    beginner: `
\`<component :is="x">\` is a slot in the page that Vue fills with "whatever \`x\` is right now". When \`x\` changes to a different component, Vue removes the old one completely and builds the new one, just as if you had toggled two \`v-if\`s. \`<KeepAlive>\` changes "remove completely" into "put aside for later".
`,
    technical: [
      `
The compiler turns \`<component :is="x">\` into a call that resolves \`x\` and creates a vnode of that type:
`,
      {
        code: `// Simplified compile output
import { resolveDynamicComponent, h } from 'vue'

function render() {
  // object → used as is; string → registered component by name, else an HTML tag
  return h(resolveDynamicComponent(current.value.component), { class: 'panel' })
}`,
        lang: 'js',
        title: 'what <component :is> compiles to (simplified)',
      },
      `
During patching, Vue checks whether the old and new vnodes have the **same type** (and key). Different component → unmount the old subtree (calling \`onBeforeUnmount\`/\`onUnmounted\`, stopping its effects, removing DOM) and mount the new one. Same component with new props → a normal update. Adding \`:key\` lets you force a remount even for the same component.

\`<KeepAlive>\` intercepts that unmount: it keeps a cache of vnodes keyed by component (or \`key\`), moves the inactive instance's DOM into a detached container, and calls \`deactivated\` hooks; on return it moves the DOM back and calls \`activated\`. With \`max\`, the least recently used entry is evicted (and truly unmounted) when the cache is full.

A string \`is\` goes through name resolution (\`components\` option, then \`app.component\` registry). \`<script setup>\` imports are not part of that registry, which is why \`is="TabNotes"\` renders an unknown \`<tabnotes>\` element there.
`,
    ],
    production: `
- **Registries over conditionals**: map types to components (\`const blocks = { heading: HeadingBlock, … }\`) and render \`<component :is="blocks[block.type] ?? UnknownBlock">\`. Always fall back for unknown types — data from a CMS or API can contain types your build doesn't know.
- **Treat the registry as a whitelist**. Never resolve components or tags directly from user input; look them up in a map you control.
- **Lazy-load heavy panels** with [\`defineAsyncComponent\`](lesson:async-components) so rarely opened tabs don't bloat the initial bundle.
- **KeepAlive costs memory** and keeps instances' state (and possibly stale data) around. Use \`include\` and \`max\`, and refresh data in \`onActivated\` when needed.
- **Prefer Vue Router** for views that should have their own URL, survive refresh and work with the back button ([router basics](lesson:router-basics)). Dynamic components are for in-page switching.
- Dashboards and form builders often combine \`<component :is>\` with \`v-bind\` of per-item props and a consistent event contract (\`@update\`, \`@remove\`) so every widget plugs in the same way.
`,
  },

  mistakes: [
    {
      title: 'Passing a name string for an imported component',
      wrong: { code: `<script setup>\nimport TabNotes from './TabNotes.vue'\n</script>\n<template>\n  <component is="TabNotes" /> <!-- renders <tabnotes></tabnotes> -->\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\nimport TabNotes from './TabNotes.vue'\n</script>\n<template>\n  <component :is="TabNotes" />\n</template>`, lang: 'vue' },
      explanation: 'String names are only looked up among *registered* components. In `<script setup>`, pass the imported object with `:is`.',
    },
    {
      title: 'Storing components in ref() or reactive()',
      wrong: { code: `const current = ref(TabProfile)\nconst tabs = reactive([{ label: 'Profile', component: TabProfile }])`, lang: 'js' },
      right: { code: `const current = shallowRef(TabProfile)\nconst tabs = [{ label: 'Profile', component: TabProfile }]\n// or, inside reactive state: { component: markRaw(TabProfile) }`, lang: 'js' },
      explanation: 'Deep reactivity would wrap the component definition in a proxy for no benefit, and Vue warns about it. Use `shallowRef`, plain data or `markRaw`.',
    },
    {
      title: 'Expecting state to survive a switch',
      wrong: { code: `<component :is="current" />\n<!-- the form the user half-filled is reset on every switch -->`, lang: 'vue' },
      right: { code: `<KeepAlive>\n  <component :is="current" />\n</KeepAlive>\n<!-- or lift the state up into the parent / a store -->`, lang: 'vue' },
      explanation: 'Switching unmounts the old component. Either cache instances with `<KeepAlive>` or keep important state outside the switched component.',
    },
    {
      title: 'Passing props only some components declare',
      wrong: { code: `<component :is="current" :user="user" />\n<!-- tabs that don't declare "user" get user="[object Object]" on their root element -->`, lang: 'vue' },
      right: { code: `<component :is="current.component" v-bind="current.props" />`, lang: 'vue' },
      explanation: 'Undeclared props become fallthrough attributes. Give each entry its own props, or make every component accept the shared props.',
    },
  ],

  debugging: [
    {
      symptom: 'The DOM shows an empty `<tabnotes></tabnotes>` (or similar lowercase tag).',
      cause: '`is` received a string name for a component that isn\'t registered by name.',
      fix: 'Bind the imported component object: `:is="TabNotes"`, or look it up in a registry object.',
    },
    {
      symptom: '`[Vue warn]: Vue received a Component that was made a reactive object…`',
      cause: 'A component definition was stored inside `ref()` or `reactive()`.',
      fix: 'Use `shallowRef`, a plain array/object, or wrap the component with `markRaw()`.',
    },
    {
      symptom: 'Form input or scroll position resets whenever you switch away and back.',
      cause: 'The component is unmounted on every switch.',
      fix: 'Wrap with `<KeepAlive>` (optionally with `include`/`max`), or move the state up.',
    },
    {
      symptom: '`<KeepAlive include="TabNotes">` doesn\'t cache anything.',
      cause: '`include` matches the component\'s **name**; the names don\'t match.',
      fix: 'In `<script setup>` the name is inferred from the file name; check spelling, or set it with `defineOptions({ name })` (3.3+).',
    },
    {
      symptom: 'An attribute like `user="[object Object]"` appears on a panel\'s root element.',
      cause: 'That component doesn\'t declare the prop, so it fell through as an attribute.',
      fix: 'Declare the prop, or pass per-component props with `v-bind`.',
    },
  ],

  bestPractices: [
    'Pass component objects to `:is`; use strings only for HTML tags or registered names.',
    'Keep component lists/maps as plain data or `shallowRef`; use `markRaw` inside reactive state.',
    'Use a registry map with a fallback component for data-driven rendering.',
    'Decide deliberately whether switched components should keep state (`<KeepAlive>`) or reset.',
    'Bound `<KeepAlive>` with `include`/`max` in larger apps.',
    'Use the router instead when each view deserves its own URL.',
  ],

  useCases: [
    'Tabs and segmented panels inside a page.',
    'Multi-step wizards where each step is a component.',
    'CMS / page-builder content: render blocks by type.',
    'User-configurable dashboards with different widget components.',
    'Switching the wrapper element: `<component :is="href ? \'a\' : \'button\'">`.',
  ],

  whenToUse: {
    use: [
      'Which component to render is decided by data or user choice at runtime.',
      'Many alternatives would otherwise need a long `v-if` / `v-else-if` chain.',
      'You render a list of heterogeneous items (blocks, widgets).',
    ],
    avoid: [
      'Only two fixed alternatives — a simple `v-if`/`v-else` is clearer.',
      'The views should be bookmarkable or work with the back button — use Vue Router.',
      'The component name comes straight from user input without a whitelist.',
    ],
  },

  comparison: {
    title: 'Ways to switch what is rendered',
    headers: ['', '`v-if` / `v-else-if`', '`<component :is>`', 'Vue Router `<RouterView>`'],
    rows: [
      ['Choice expressed as', 'template conditions', 'data (a component value)', 'the URL'],
      ['Scales to many options?', 'poorly', 'well (registry map)', 'well (route table)'],
      ['State on switch', 'destroyed', 'destroyed (unless `<KeepAlive>`)', 'destroyed (unless `<KeepAlive>`)'],
      ['Bookmarkable / back button', 'no', 'no', 'yes'],
      ['Typical use', '2–3 fixed branches', 'tabs, wizards, CMS blocks, widgets', 'pages/views'],
    ],
    note: '`<RouterView>` uses the same mechanism internally: it renders the matched route\'s component dynamically.',
  },

  quiz: [
    {
      id: 'dynamic-components-q1',
      type: 'mcq',
      prompt: 'In a `<script setup>` component, which values can you bind to `:is`? Select **all** that work.',
      options: [
        { text: 'An imported component object, e.g. `TabNotes`' },
        { text: 'An HTML tag name, e.g. `\'section\'`' },
        { text: 'The string `\'TabNotes\'` when `TabNotes` is only imported in `<script setup>`', why: 'Imports are not registered by name; the string renders an unknown element.' },
        { text: 'The name of a component registered globally with `app.component(\'BaseCard\', …)`' },
      ],
      answer: [0, 1, 3],
      explanation: 'Objects always work. Strings resolve to registered components by name, otherwise to an HTML element.',
    },
    {
      id: 'dynamic-components-q2',
      type: 'output',
      prompt: 'No `<KeepAlive>`. The user types "hello" into Notes\' textarea, clicks **Billing**, then clicks **Notes** again. What does the textarea contain?',
      code: {
        lang: 'vue',
        code: `<!-- TabNotes.vue -->
<script setup>
import { ref } from 'vue'
const draft = ref('')
</script>
<template><textarea v-model="draft" /></template>

<!-- App.vue -->
<component :is="current" />`,
      },
      options: [
        { text: '"hello"', why: 'That would need `<KeepAlive>` or state stored outside the component.' },
        { text: 'An empty string' },
        { text: '"hellohello"', why: 'A new instance starts from `ref(\'\')`; nothing is appended.' },
        { text: 'It throws because the component was destroyed', why: 'Vue simply mounts a fresh instance.' },
      ],
      answer: 1,
      explanation: 'Switching away unmounted the Notes instance; coming back mounted a brand-new one whose `draft` starts at `\'\'`.',
    },
    {
      id: 'dynamic-components-q3',
      type: 'bug',
      prompt: 'This code works but logs a performance warning every time a tab is chosen. Which line causes it?',
      code: {
        lang: 'js',
        code: `import { ref } from 'vue'
import TabA from './TabA.vue'
import TabB from './TabB.vue'

const tabs = { a: TabA, b: TabB }
const current = ref(TabA)

function select(key) {
  current.value = tabs[key]
}`,
      },
      answerLine: 6,
      explanation: '`ref()` makes its value deeply reactive, turning the component definition into a reactive proxy. Use `shallowRef(TabA)` (or `markRaw`).',
    },
    {
      id: 'dynamic-components-q4',
      type: 'fill',
      prompt: 'Render the current step and keep every step\'s state when switching.',
      code: {
        lang: 'vue',
        code: `<___>
  <component ___="steps[index]" />
</___>`,
      },
      answer: [['KeepAlive', 'keep-alive'], [':is', 'v-bind:is'], ['KeepAlive', 'keep-alive']],
      explanation: '`<KeepAlive>` caches inactive instances; `:is` binds the component to render.',
    },
    {
      id: 'dynamic-components-q5',
      type: 'mcq',
      prompt: 'A component inside `<KeepAlive>` is switched away from and later back to. Which hooks run?',
      options: [
        { text: '`onUnmounted`, then `onMounted`', why: 'Those run only without KeepAlive (or when evicted by `max`).' },
        { text: '`onDeactivated`, then `onActivated`' },
        { text: 'No hooks at all', why: 'KeepAlive provides dedicated hooks for exactly this.' },
        { text: '`onBeforeUpdate`, then `onUpdated`', why: 'Switching isn\'t an update of that component.' },
      ],
      answer: 1,
      explanation: 'Cached components are deactivated/activated instead of unmounted/mounted. `onActivated` also runs on the first mount.',
    },
    {
      id: 'dynamic-components-q6',
      type: 'mcq',
      prompt: 'An admin area has Users, Orders and Settings screens. Users want to bookmark Orders and use the back button. What fits best?',
      options: [
        { text: '`<component :is>` with a `current` ref', why: 'In-page switching has no URL, so no bookmarks or back button.' },
        { text: 'Vue Router routes for each screen' },
        { text: 'A `v-if` chain', why: 'Same problem: the URL never changes.' },
        { text: '`<KeepAlive>` around the screens', why: 'KeepAlive preserves state but doesn\'t give screens URLs.' },
      ],
      answer: 1,
      explanation: 'URL-addressable views are the router\'s job. Use dynamic components for tabs, steps and widgets within a page.',
    },
    {
      id: 'dynamic-components-q7',
      type: 'short',
      prompt: 'Why does switching components with `<component :is>` lose local state, and what are two ways to keep it?',
      answer: 'A different component type in the same place is a replacement, so Vue unmounts the old instance (destroying its state) and mounts a fresh one. To keep state: wrap it in `<KeepAlive>` so inactive instances are cached, or lift the state up to the parent (or a store) and pass it down as props.',
    },
  ],

  exercises: [
    {
      id: 'wizard',
      title: 'A three-step checkout wizard',
      difficulty: 'intermediate',
      prompt: `
Turn \`App.vue\` into a wizard that renders one step at a time with \`<component :is>\`.

- The steps, in order: \`StepAccount\`, \`StepAddress\`, \`StepConfirm\` (already written).
- \`<p class="progress">\` shows **Step 1 of 3**, **Step 2 of 3**…
- \`<button class="back">\` goes to the previous step and is **disabled** on the first step.
- \`<button class="next">\` goes to the next step and is **not rendered** on the last step.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import StepAccount from './StepAccount.vue'
import StepAddress from './StepAddress.vue'
import StepConfirm from './StepConfirm.vue'

// TODO: a list of steps and the current index
</script>

<template>
  <p class="progress">Step 1 of 3</p>
  <StepAccount />
  <button class="back">Back</button>
  <button class="next">Next</button>
</template>`,
        ...wizardFiles,
      },
      hints: [
        'Keep the components in a plain array: `const steps = [StepAccount, StepAddress, StepConfirm]`, and the position in `const index = ref(0)`.',
        'Render `<component :is="steps[index]" />` and the progress as `Step {{ index + 1 }} of {{ steps.length }}`.',
        'Back: `:disabled="index === 0" @click="index--"`. Next: `v-if="index < steps.length - 1" @click="index++"`.',
      ],
      solution: {
        explanation: 'The list of steps is data; only the index is reactive state. `<component :is>` renders whichever step the index points to, so adding a step is a one-line change.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import StepAccount from './StepAccount.vue'
import StepAddress from './StepAddress.vue'
import StepConfirm from './StepConfirm.vue'

const steps = [StepAccount, StepAddress, StepConfirm]
const index = ref(0)
</script>

<template>
  <p class="progress">Step {{ index + 1 }} of {{ steps.length }}</p>
  <component :is="steps[index]" />
  <button class="back" :disabled="index === 0" @click="index--">Back</button>
  <button v-if="index < steps.length - 1" class="next" @click="index++">Next</button>
</template>`,
          ...wizardFiles,
        },
      },
      tests: [
        { name: 'starts on step 1 with Back disabled', code: `expect(text('.progress')).toBe('Step 1 of 3'); expect(exists('.step-account')).toBe(true); expect(find('.back').disabled).toBe(true)` },
        {
          name: 'Next and Back move between steps',
          code: `await click('.next')
expect(text('.progress')).toBe('Step 2 of 3')
expect(exists('.step-address')).toBe(true)
expect(exists('.step-account')).toBe(false)
await click('.back')
expect(exists('.step-account')).toBe(true)`,
        },
        {
          name: 'the last step has no Next button',
          code: `await click('.next')
await click('.next')
expect(exists('.step-confirm')).toBe(true)
expect(exists('.next')).toBe(false)
expect(text('.progress')).toBe('Step 3 of 3')`,
        },
      ],
    },
    {
      id: 'block-renderer',
      title: 'Render CMS blocks from data',
      difficulty: 'intermediate',
      prompt: `
A CMS sends a list of content blocks. Render each one with the right component:

- \`heading\` → \`HeadingBlock\`, \`paragraph\` → \`ParagraphBlock\`, \`quote\` → \`QuoteBlock\` (all written; they take \`text\` and, for quotes, \`author\` props).
- Any **unknown** type → \`UnknownBlock\`, which takes a \`type\` prop.
- Use **one** \`<component :is>\` inside a \`v-for\`, a registry object mapping types to components, and \`v-bind="block"\` to pass each block's fields as props.
`,
      files: {
        'App.vue': `<script setup>
import HeadingBlock from './HeadingBlock.vue'
import ParagraphBlock from './ParagraphBlock.vue'
import QuoteBlock from './QuoteBlock.vue'
import UnknownBlock from './UnknownBlock.vue'

const blocks = [
  { id: 1, type: 'heading', text: 'Why Vue?' },
  { id: 2, type: 'paragraph', text: 'It is approachable and fast.' },
  { id: 3, type: 'quote', text: 'Simplicity is prerequisite for reliability.', author: 'Edsger Dijkstra' },
  { id: 4, type: 'video', text: 'intro.mp4' },
]

// TODO: a registry from type to component
</script>

<template>
  <article class="page">
    <!-- TODO: render every block with <component :is> -->
  </article>
</template>`,
        ...blockFiles,
      },
      hints: [
        '`const registry = { heading: HeadingBlock, paragraph: ParagraphBlock, quote: QuoteBlock }` — a plain object, not reactive.',
        'Look up with a fallback: `registry[block.type] ?? UnknownBlock`.',
        '`<component v-for="block in blocks" :key="block.id" :is="registry[block.type] ?? UnknownBlock" v-bind="block" />`.',
      ],
      solution: {
        explanation: 'The registry is a whitelist: only known types map to components, and everything else gets a safe fallback instead of breaking the page. `v-bind="block"` passes `text`, `author` and `type` as props; fields a block component doesn\'t declare fall through as attributes.',
        files: {
          'App.vue': `<script setup>
import HeadingBlock from './HeadingBlock.vue'
import ParagraphBlock from './ParagraphBlock.vue'
import QuoteBlock from './QuoteBlock.vue'
import UnknownBlock from './UnknownBlock.vue'

const blocks = [
  { id: 1, type: 'heading', text: 'Why Vue?' },
  { id: 2, type: 'paragraph', text: 'It is approachable and fast.' },
  { id: 3, type: 'quote', text: 'Simplicity is prerequisite for reliability.', author: 'Edsger Dijkstra' },
  { id: 4, type: 'video', text: 'intro.mp4' },
]

const registry = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  quote: QuoteBlock,
}
</script>

<template>
  <article class="page">
    <component
      v-for="block in blocks"
      :key="block.id"
      :is="registry[block.type] ?? UnknownBlock"
      v-bind="block"
    />
  </article>
</template>`,
          ...blockFiles,
        },
      },
      tests: [
        { name: 'heading and paragraph render', code: `expect(text('.block-heading')).toBe('Why Vue?'); expect(text('.block-paragraph')).toBe('It is approachable and fast.')` },
        { name: 'quote renders with its author', code: `expect(text('.block-quote')).toContain('Simplicity is prerequisite'); expect(text('.block-quote')).toContain('Edsger Dijkstra')` },
        { name: 'unknown types use the fallback', code: `expect(text('.unknown-block')).toBe('Unsupported block: video')` },
        { name: 'blocks stay in order', code: `const kids = [...find('.page').children].map((el) => el.className.split(' ')[0])\nexpect(kids).toEqual(['block-heading', 'block-paragraph', 'block-quote', 'unknown-block'])` },
      ],
    },
  ],

  interview: [
    {
      id: 'dynamic-components-what',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What are dynamic components in Vue and how do you use them?',
      answer: 'The built-in `<component :is="x">` renders whatever `x` is — a component object, a registered component name or an HTML tag — and swaps it when `x` changes. Props, listeners and slots on `<component>` go to the active component. Switching unmounts the old one unless it\'s wrapped in `<KeepAlive>`.',
      explanation: 'It turns "which component to render" into data.',
      whyAsked: 'Common in tabbed UIs, wizards and CMS-driven pages.',
      mistakes: ['Passing a string for an imported component in `<script setup>`.', 'Not knowing state is lost on switch.'],
      followUps: ['How do you preserve state?', 'Why use `shallowRef`?', 'When would you use the router instead?'],
      modelAnswer: 'Dynamic components use the built-in `<component>` with an `is` binding. In `<script setup>` I pass the imported component object, often from a registry map, and Vue renders it, forwarding any props and listeners I put on the tag. When `is` changes to a different component, Vue unmounts the old instance and mounts the new one, so local state resets — if I need to keep it, I wrap it in `<KeepAlive>`. I keep component objects in plain data or a `shallowRef` so they aren\'t made reactive.',
    },
    {
      id: 'dynamic-components-state-loss',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Users complain that a half-filled form in the "Address" tab disappears when they peek at another tab. What are your options and their trade-offs?',
      answer: '(1) `<KeepAlive>` around the dynamic component: keeps instances (and their state) in memory; simple, but costs memory and can keep stale data — bound it with `include`/`max` and refresh in `onActivated`. (2) Lift the form state up to the parent or a store and pass it down: survives switches and even unmounts, and is easier to submit together; more wiring. (3) Persist drafts (e.g. `localStorage`) if they should survive reloads.',
      explanation: 'Decide whether the state belongs to the component instance or to the flow.',
      whyAsked: 'Tests understanding of component lifetimes and state ownership.',
      mistakes: ['Reaching for KeepAlive without considering memory or stale data.', 'Not considering where the data will be submitted from.'],
      followUps: ['Which hooks run with KeepAlive?', 'How would you reset a cached form after submit?'],
      modelAnswer: 'Switching tabs unmounts the Address component, so its local state dies. The quickest fix is `<KeepAlive>`, which caches the instance — I\'d limit it with `include` or `max`. But for a multi-tab form that is submitted as a whole, the state really belongs to the flow, so I\'d lift it into the parent or a store and pass it down; then switching doesn\'t matter at all. For drafts that should survive a reload, I\'d persist them too.',
    },
    {
      id: 'dynamic-components-reactive-warning',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 2,
      question: 'Why does Vue warn "Vue received a Component that was made a reactive object" and how do you fix it?',
      answer: 'A component definition was stored in deeply reactive state (`ref()`, `reactive()`), so Vue wrapped it in a proxy. Component objects don\'t need tracking; proxying them is wasted work. Store them in `shallowRef`, in plain (non-reactive) arrays/objects, or wrap them with `markRaw()` when they must live inside reactive state.',
      explanation: 'Track *which* component is current, not the component\'s internals.',
      whyAsked: 'A frequent warning in tab/dashboard code.',
      mistakes: ['Ignoring the warning.', 'Using `toRaw` at render time instead of fixing the storage.'],
      followUps: ['What does `markRaw` do exactly?', 'Why is `shallowRef` enough for switching?'],
      modelAnswer: 'It means a component definition ended up inside deeply reactive state, typically `ref(SomeComponent)`, so Vue turned it into a reactive proxy. I only need to track which component is current, not its internals, so I store it in a `shallowRef`, keep the list of components in plain data, or mark them with `markRaw` if they live inside a reactive object.',
    },
    {
      id: 'dynamic-components-vs-router',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'When would you use `<component :is>`, a `v-if` chain, or Vue Router to switch views?',
      answer: '`v-if`/`v-else` for two or three fixed branches. `<component :is>` when the choice is data-driven or there are many options (tabs, wizard steps, CMS blocks, widgets) — it scales with a registry map. Vue Router when views need their own URL (bookmarks, back button, deep links, refresh). The router itself renders the matched component dynamically.',
      explanation: 'Fixed and small → v-if; data-driven → `<component>`; URL-addressable → router.',
      whyAsked: 'Shows architectural judgment about navigation and rendering.',
      mistakes: ['Using dynamic components for pages that should be routes.', 'Using routes for a small in-page tab group that doesn\'t need URLs.'],
      followUps: ['How would you sync a tab with a query parameter?'],
      modelAnswer: 'For a couple of fixed alternatives I use `v-if`. When the set is data-driven or large — a wizard, dashboard widgets, blocks from a CMS — `<component :is>` with a registry map keeps the template stable. If users should be able to bookmark the view, use the back button or refresh, it\'s a route. Sometimes I combine them: a tab group whose active tab is stored in a query parameter.',
    },
    {
      id: 'dynamic-components-cms',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A headless CMS returns pages as arrays of blocks (`{ type, ...fields }`). Design the rendering layer in Vue.',
      answer: 'A registry map `type → component` (plain object, a whitelist); render `<component v-for="b in blocks" :key="b.id" :is="registry[b.type] ?? UnknownBlock" v-bind="b.fields" />`. Lazy-load rarely used, heavy blocks with `defineAsyncComponent` (with loading/error components). Validate/normalise the payload at the API boundary, never resolve components from raw strings, sanitize any rich text server-side (avoid `v-html` with untrusted content), give each block a consistent prop contract, and log unknown types in development.',
      explanation: 'A whitelist registry plus a safe fallback is the core; async components keep the bundle small.',
      code: {
        lang: 'js',
        code: `import { defineAsyncComponent } from 'vue'

export const blockRegistry = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  gallery: defineAsyncComponent(() => import('./blocks/GalleryBlock.vue')),
}`,
      },
      whyAsked: 'A realistic system-design question combining dynamic components, performance and security.',
      mistakes: ['Resolving components by arbitrary string names from the API.', 'Rendering CMS HTML with `v-html` without sanitisation.', 'No fallback for unknown types — one new block type breaks the page.'],
      followUps: ['How would you handle a block that fails to load?', 'How would you preview drafts?'],
      modelAnswer: 'I\'d keep a registry object mapping block types to components — a whitelist — and render the list with one `<component :is>` inside a `v-for`, spreading each block\'s fields as props and falling back to an `UnknownBlock`. Heavy, rare blocks like galleries are async components with loading and error states. I normalise the payload at the API layer, never trust raw HTML, and log unknown types in development so the team notices new CMS block types.',
    },
    {
      id: 'dynamic-components-string-is',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 3,
      question: 'In a `<script setup>` component, `<component :is="activeTab" />` works when `activeTab` holds the imported object, but a teammate changed it to store names (`\'TabNotes\'`) and now an empty `<tabnotes>` element renders. Why?',
      options: [
        'Strings must be kebab-case: `\'tab-notes\'`',
        'A string `is` is resolved only against registered component names; `<script setup>` imports aren\'t registered by name',
        'The component needs `defineOptions({ name: \'TabNotes\' })`',
        'Dynamic components require `shallowRef`',
      ],
      correctOption: 1,
      answer: 'A string goes through name resolution: the Options API `components` option, then the app-level registry (`app.component`). `<script setup>` imports are variables, not registered names, so resolution fails and Vue treats the string as an HTML tag. Map names to components with a registry object, or register them.',
      explanation: 'Objects are used directly; strings are looked up by name or treated as tags.',
      whyAsked: 'A subtle difference between `<script setup>` and Options API mental models.',
      mistakes: ['Thinking `name` makes a component resolvable as a string.', 'Blaming kebab-case.'],
      followUps: ['How would you keep storing names (e.g. from a URL) safely?'],
      modelAnswer: 'With a string, Vue tries to resolve a registered component by that name — local `components` option, then global registrations — and falls back to creating an HTML element. A `<script setup>` import isn\'t a registration, so you get an unknown `<tabnotes>` element. If names come from data, I map them through a registry object, which also acts as a whitelist.',
    },
    {
      id: 'dynamic-components-coding-tabs',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Finish `App.vue`: render the active tab with `<component :is>` from the `tabs` registry and keep each tab\'s state when switching. Buttons with `class="tab"` switch tabs; `CounterTab` has a `.count` and an `.inc` button.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { shallowRef } from 'vue'
import CounterTab from './CounterTab.vue'
import InfoTab from './InfoTab.vue'

const tabs = { counter: CounterTab, info: InfoTab }
const active = shallowRef('counter')
</script>

<template>
  <button class="tab" @click="active = 'counter'">Counter</button>
  <button class="tab" @click="active = 'info'">Info</button>
  <!-- TODO -->
</template>`,
          'CounterTab.vue': `<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <div><span class="count">{{ count }}</span> <button class="inc" @click="count++">+</button></div>
</template>`,
          'InfoTab.vue': `<template>
  <p class="info">Nothing to see here.</p>
</template>`,
        },
      },
      tests: [
        { name: 'shows the counter tab first', code: `expect(exists('.count')).toBe(true)` },
        { name: 'switches to the info tab', code: `await click(findAll('.tab')[1]); expect(exists('.info')).toBe(true); expect(exists('.count')).toBe(false)` },
        {
          name: 'keeps the counter state across switches',
          code: `await click('.inc'); await click('.inc')
await click(findAll('.tab')[1])
await click(findAll('.tab')[0])
expect(text('.count')).toBe('2')`,
        },
      ],
      hints: ['Look the component up in the registry: `tabs[active]`.', 'Wrap the `<component>` in `<KeepAlive>`.'],
      answer: 'Render `<KeepAlive><component :is="tabs[active]" /></KeepAlive>`.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { shallowRef } from 'vue'
import CounterTab from './CounterTab.vue'
import InfoTab from './InfoTab.vue'

const tabs = { counter: CounterTab, info: InfoTab }
const active = shallowRef('counter')
</script>

<template>
  <button class="tab" @click="active = 'counter'">Counter</button>
  <button class="tab" @click="active = 'info'">Info</button>
  <KeepAlive>
    <component :is="tabs[active]" />
  </KeepAlive>
</template>`,
          'CounterTab.vue': `<script setup>
import { ref } from 'vue'
const count = ref(0)
</script>

<template>
  <div><span class="count">{{ count }}</span> <button class="inc" @click="count++">+</button></div>
</template>`,
          'InfoTab.vue': `<template>
  <p class="info">Nothing to see here.</p>
</template>`,
        },
      },
      explanation: 'The reactive state is just the active key; the registry maps it to a component object, and KeepAlive caches the inactive instance.',
      whyAsked: 'Combines registry lookup, dynamic rendering and KeepAlive in a few lines.',
      mistakes: ['Binding the string key directly to `:is`.', 'Forgetting KeepAlive and losing state.'],
      followUps: ['How would you only keep the counter tab alive?', 'How would you persist the active tab in the URL?'],
      modelAnswer: 'I look the component up in the registry with `tabs[active]` and bind that object to `:is`, so the string never goes through name resolution. Wrapping it in `<KeepAlive>` caches the inactive tab, so the counter keeps its value. To cache only some tabs, I\'d use `include` with component names, and to make the tab bookmarkable I\'d sync `active` with a route query.',
    },
  ],

  takeaways: [
    '`<component :is="x">` renders whatever `x` is: a component object, a registered name, or an HTML tag.',
    'In `<script setup>`, pass imported component objects — strings only resolve registered names.',
    'Store components in plain data or `shallowRef` (or `markRaw`), never deeply reactive state.',
    'Switching unmounts the old component and its state; `<KeepAlive>` caches instances instead.',
    'Registries with fallbacks make data-driven rendering safe and scalable; use the router for URL-addressable views.',
  ],
}
