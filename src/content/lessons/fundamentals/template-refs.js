// Lesson: Template refs — reaching the real DOM

const searchApp = `<script setup>
import { ref, useTemplateRef, onMounted } from 'vue'

const query = ref('')
const searchInput = useTemplateRef('search')
const showNotes = ref(false)
const notesBox = ref(null)

onMounted(() => {
  console.log('mounted, input is:', searchInput.value)
})

function focusSearch() {
  searchInput.value.focus()
}

function clearSearch() {
  query.value = ''
}
</script>

<template>
  <input ref="search" class="search" v-model="query" placeholder="Search products…" />
  <button class="focus-btn" @click="focusSearch">Focus search</button>
  <button class="clear-btn" @click="clearSearch">Clear</button>

  <button class="notes-btn" @click="showNotes = !showNotes">Notes</button>
  <textarea v-if="showNotes" ref="notesBox" class="notes"></textarea>
</template>`

const querySelectorVersion = `<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // searches the WHOLE page:
  // - finds another component's .search first?
  // - breaks if the class is renamed
  // - two instances of this component → same element
  document.querySelector('.search').focus()
})
</script>

<template>
  <input class="search" />
</template>`

const templateRefVersion = `<script setup>
import { useTemplateRef, onMounted } from 'vue'

// Vue 3.5+: points at THIS component's element
const input = useTemplateRef('search')

onMounted(() => {
  input.value.focus()
})
</script>

<template>
  <input ref="search" class="search" />
</template>`

export default {
  id: 'template-refs',
  title: 'Template refs: reaching the real DOM',
  summary: 'A template ref gives your code direct access to a real DOM element (or child component) after it mounts — for focus, measuring, media and third-party libraries.',
  difficulty: 'beginner',
  minutes: 22,
  prerequisites: ['v-on-events', 'conditional-rendering'],
  related: ['dom-access-refs', 'lifecycle-hooks', 'setup-and-script-setup', 'ref', 'next-tick', 'accessibility-fundamentals'],
  tags: ['template refs', 'useTemplateRef', 'ref attribute', 'DOM access', 'focus', 'onMounted', 'nextTick', 'defineExpose'],
  apis: [
    { name: 'ref="name"', summary: 'Marks an element (or component) in the template so script code can reach it.' },
    { name: 'useTemplateRef(key)', summary: 'Vue 3.5+: returns a shallow ref filled with the element whose ref attribute matches `key`.' },
    { name: 'const name = ref(null)', summary: 'Pre-3.5 pattern (still supported): a ref with the same name as the ref attribute.' },
    { name: ':ref="(el) => …"', summary: 'Function ref: called with the element on mount/update and with null on unmount.' },
    { name: 'onMounted()', summary: 'Runs after the component\'s DOM exists — the earliest point a template ref is filled.' },
  ],
  docs: [
    { label: 'Vue Guide — Template Refs', url: 'https://vuejs.org/guide/essentials/template-refs.html' },
    { label: 'API — useTemplateRef()', url: 'https://vuejs.org/api/composition-api-helpers.html#usetemplateref' },
    { label: 'API — defineExpose()', url: 'https://vuejs.org/api/sfc-script-setup.html#defineexpose' },
  ],

  intro: `
Almost everything in Vue is declarative: you change state and Vue updates the DOM. But a few browser features can only be *commanded*: "put the cursor in this input", "play this video", "how wide is this box?", "draw a chart on this canvas".

For those, you need the **actual element**. A **template ref** is a label you put on an element so your script can grab it:

\`\`\`vue
<script setup>
import { useTemplateRef, onMounted } from 'vue'
const input = useTemplateRef('search')     // Vue 3.5+
onMounted(() => input.value.focus())
</script>

<template>
  <input ref="search" />
</template>
\`\`\`

Once the component is on the page, \`input.value\` *is* the \`<input>\` element.
`,

  why: `
Some DOM APIs are imperative by nature: \`focus()\`, \`select()\`, \`scrollIntoView()\`, \`play()\`, \`getBoundingClientRect()\`, \`canvas.getContext()\`. There's no attribute you can bind for "have focus now".

You *could* use \`document.querySelector('.search')\`, but inside components that's fragile:

- it searches the **whole page**, so with two instances of the component you always get the first one's element;
- it breaks when someone renames a class;
- it doesn't know about timing — call it before the element exists and you get \`null\`.

Template refs fix all three: they belong to **this component instance**, they're named in the template next to the element, and Vue fills them **exactly when the element exists** (and empties them when it's removed).
`,

  eli15: `
Imagine a big shared garage full of identical bikes. Shouting "hand me the red bike!" (\`querySelector\`) might get you someone else's red bike.

A template ref is like putting **your own name tag** on your bike (\`ref="search"\`) and keeping the matching key in your pocket (\`useTemplateRef('search')\`). The key only works once the bike has actually been delivered to the garage — that moment is called **mounted**. If the bike is taken away (say, by \`v-if\`), your key opens nothing until it comes back.

Use the key for things only *you* can do with the bike — like riding it (focusing an input). Don't use it to repaint the bike; ask Vue to do that by changing state.
`,

  analogy: {
    title: 'A name tag and a key',
    body: `
The \`ref\` attribute is the name tag stuck on an element. \`useTemplateRef()\` (or a same-named \`ref(null)\`) is the key in your pocket. Before delivery the key opens nothing (\`null\`); after delivery (\`onMounted\`) it opens exactly your element; when the element is taken away, the key goes back to opening nothing.
`,
    mapping: [
      ['name tag on the bike', '`ref="search"` in the template'],
      ['the key in your pocket', '`const input = useTemplateRef(\'search\')`'],
      ['bike delivered', 'the component mounted — `input.value` is the element'],
      ['bike taken away', 'the element was unmounted (`v-if` false) — `input.value` is `null`'],
      ['riding the bike', 'imperative calls: `focus()`, `play()`, measuring'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'When is a template ref filled?',
    props: {
      nodes: [
        { id: 'setup', label: 'setup runs', note: 'input.value === null', tone: 'paper' },
        { id: 'render', label: 'render', note: 'virtual DOM built', tone: 'cobalt' },
        { id: 'dom', label: 'DOM created', note: '<input ref="search">', tone: 'acid' },
        { id: 'fill', label: 'ref filled', note: 'input.value = <input>', tone: 'kraft' },
        { id: 'mounted', label: 'onMounted', note: 'safe to focus()', tone: 'ink' },
        { id: 'gone', label: 'element removed', note: 'v-if false → null', tone: 'red' },
      ],
      edges: [
        { from: 'setup', to: 'render' },
        { from: 'render', to: 'dom' },
        { from: 'dom', to: 'fill' },
        { from: 'fill', to: 'mounted' },
        { from: 'mounted', to: 'gone', label: 'later…', dashed: true },
      ],
      layout: 'grid',
      cols: 3,
      steps: [
        { focus: ['setup'], text: '`<script setup>` runs first. `useTemplateRef(\'search\')` returns a ref, but its value is **null** — no element exists yet.' },
        { focus: ['render', 'dom'], edges: ['setup->render', 'render->dom'], text: 'Vue renders the template and creates the real `<input>` element.' },
        { focus: ['fill'], edges: ['dom->fill'], text: 'Right after patching the DOM, Vue stores the element into every ref whose name matches `ref="search"`.' },
        { focus: ['mounted'], edges: ['fill->mounted'], text: '`onMounted` callbacks run. This is the first safe place to call `input.value.focus()`.' },
        { focus: ['gone'], edges: ['mounted->gone'], text: 'If the element is later removed (for example by `v-if`), Vue sets the ref back to **null**. Code that may run at that time should check: `input.value?.focus()`.' },
      ],
    },
    caption: 'null → element → null. Access template refs in onMounted, in event handlers, or after `await nextTick()`.',
    alt: 'A grid timeline: setup runs with the ref still null; render and DOM creation follow; Vue fills the ref with the input element; onMounted runs and can safely call focus; later, if the element is removed by v-if, the ref becomes null again.',
  },

  syntax: [
    `
#### Vue 3.5+: useTemplateRef()
`,
    {
      code: `<script setup>
import { useTemplateRef, onMounted } from 'vue'

const input = useTemplateRef('search')   // the argument matches ref="search"

onMounted(() => {
  input.value.focus()
})
</script>

<template>
  <input ref="search" />
</template>`,
      lang: 'vue',
      title: 'useTemplateRef (3.5+)',
    },
    `
#### Before 3.5 (still works): a ref with the same name
`,
    {
      code: `<script setup>
import { ref, onMounted } from 'vue'

const search = ref(null)   // the variable name MUST equal the ref attribute

onMounted(() => {
  search.value.focus()
})
</script>

<template>
  <input ref="search" />
</template>`,
      lang: 'vue',
      title: 'same-name ref (all Vue 3 versions)',
    },
    `
You'll see both in real code. \`useTemplateRef\` makes the intent obvious and lets the variable have a different name from the label; the same-name pattern is what most code written before 3.5 uses.

**The rules:**

1. The ref is **\`null\` until the element exists**: not during \`<script setup>\`'s top-level code, but in \`onMounted\`, event handlers and later.
2. When the element is removed (\`v-if\`), the ref becomes **\`null\`** again.
3. After changing state that *creates* an element, wait for the DOM: \`await nextTick()\` — see [Batched updates & nextTick()](lesson:next-tick).
4. Use refs for **imperative** tasks only. Text, classes, attributes and visibility should still come from state and bindings.

#### Timing in practice
`,
    {
      code: `<script setup>
import { ref, useTemplateRef, nextTick } from 'vue'

const open = ref(false)
const field = useTemplateRef('field')

async function openForm() {
  open.value = true
  console.log(field.value)   // null — the DOM hasn't updated yet
  await nextTick()
  field.value.focus()        // now the input exists
}
</script>

<template>
  <button @click="openForm">Add comment</button>
  <input v-if="open" ref="field" />
</template>`,
      lang: 'vue',
      title: 'refs + v-if + nextTick',
    },
    `
#### Refs inside v-for

A ref inside \`v-for\` holds an **array** of elements. The array's order is *not* guaranteed to match the source array, so if order matters, use a function ref with the index:
`,
    {
      code: `<script setup>
import { ref, useTemplateRef } from 'vue'
const items = ref(['Milk', 'Eggs', 'Bread'])
const rows = useTemplateRef('rows')   // → [<li>, <li>, <li>] after mount

const inputs = []                     // index → element, in a known order
</script>

<template>
  <li v-for="item in items" :key="item" ref="rows">{{ item }}</li>

  <input
    v-for="(item, i) in items"
    :key="item"
    :ref="(el) => (inputs[i] = el)"
  />
</template>`,
      lang: 'vue',
      title: 'array refs and function refs',
      static: true,
    },
    `
A **function ref** (\`:ref="(el) => …"\`) is called with the element when it mounts or updates, and with \`null\` when it unmounts.

#### Refs on components

\`ref\` on a child **component** gives you its instance — but a \`<script setup>\` component is **closed by default**: the parent can only see what the child explicitly exposes with \`defineExpose()\`. Prefer props and events; reach into children only for imperative actions like \`focus()\` or \`open()\`.
`,
    {
      code: `<!-- SearchBox.vue -->
<script setup>
import { useTemplateRef } from 'vue'
const input = useTemplateRef('input')
function focus() { input.value.focus() }
defineExpose({ focus })   // the only thing parents can call
</script>

<template>
  <input ref="input" />
</template>

<!-- Parent.vue -->
<script setup>
import { useTemplateRef } from 'vue'
import SearchBox from './SearchBox.vue'
const searchBox = useTemplateRef('box')
</script>

<template>
  <SearchBox ref="box" />
  <button @click="searchBox.focus()">Search</button>
</template>`,
      lang: 'vue',
      title: 'ref on a component + defineExpose',
      static: true,
    },
    `
In the Options API the same refs live on \`this.$refs\` (\`this.$refs.search.focus()\`). For a deeper dive see [Template refs in depth & DOM access](lesson:dom-access-refs).
`,
    {
      callout: 'version',
      text: '`useTemplateRef()` requires Vue 3.5+. On earlier Vue 3 versions use `const name = ref(null)` with a matching `ref="name"` attribute. `defineExpose()` is available in all `<script setup>` versions.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: searchApp,
    intro: 'A search box with two template refs — one written with `useTemplateRef`, one with the older same-name pattern.',
    steps: [
      { lines: [2], text: 'We import `useTemplateRef` (Vue 3.5+) and `onMounted`, the hook that runs once the DOM exists.' },
      { lines: [5], text: '`useTemplateRef(\'search\')` connects to the element marked `ref="search"`. Right now, during setup, its value is `null`.' },
      { lines: [7], text: 'The pre-3.5 pattern: a plain `ref(null)` whose **variable name** matches the attribute `ref="notesBox"`. Vue fills it the same way.' },
      { lines: [9, 11], text: 'Inside `onMounted` the element exists, so the log shows the `<input>` element instead of `null`.' },
      { lines: [13, 15], text: 'An imperative call: there is no attribute for "have focus now", so we call the DOM method `focus()` on the element.' },
      { lines: [23], text: '`ref="search"` is the label. Note that `v-model` still manages the value — the ref is only for things bindings can\'t do.' },
      { lines: [28], text: 'This textarea only exists while `showNotes` is true. While hidden, `notesBox.value` is `null` — you\'ll handle that in an experiment.' },
    ],
  },

  playground: {
    title: 'Search box with focus management',
    objective: 'Use template refs for focus — on mount, after an action, and for an element that appears with v-if.',
    files: { 'App.vue': searchApp },
    expected: 'The console logs the input element after mounting. **Focus search** puts the cursor in the box. **Notes** toggles a textarea.',
    experiments: [
      {
        id: 'autofocus',
        task: 'Focus the search box **automatically** when the component mounts.',
        hint: 'Inside `onMounted`, call `searchInput.value.focus()`.',
        tests: [{ name: 'the search box has focus after mounting', code: `expect(document.activeElement).toBe(find('.search'))` }],
        explain: '`onMounted` is the first moment the element exists. Calling `focus()` at the top level of `<script setup>` would crash, because the ref is still `null` there.',
      },
      {
        id: 'clear-refocus',
        task: 'After **Clear**, put the cursor back into the search box so the user can type straight away.',
        hint: 'In `clearSearch()`, after emptying `query`, call `searchInput.value.focus()`.',
        tests: [
          {
            name: 'clear empties and refocuses the input',
            code: `await type('.search', 'desk lamp')
find('.notes-btn').focus()
await click('.clear-btn')
expect(find('.search').value).toBe('')
expect(document.activeElement).toBe(find('.search'))`,
          },
        ],
        explain: 'State (`query`) handles the value declaratively; the ref handles focus imperatively. Each tool does the job it\'s good at.',
      },
      {
        id: 'focus-notes',
        task: 'When the notes box **opens**, focus it. Write an `async function toggleNotes()` and use it in the Notes button.',
        hint: 'The textarea only exists after Vue re-renders: `showNotes.value = !showNotes.value`, then `await nextTick()`, then `notesBox.value?.focus()`. Import `nextTick` from vue.',
        tests: [
          {
            name: 'opening the notes focuses the textarea',
            code: `await click('.notes-btn')
expect(exists('.notes')).toBe(true)
expect(document.activeElement).toBe(find('.notes'))`,
          },
        ],
        explain: 'Changing `showNotes` doesn\'t create the textarea immediately — Vue batches DOM updates. `await nextTick()` waits for that update, so the ref is filled. The `?.` keeps the code safe when the box is being *closed* and the ref is `null`.',
      },
      {
        id: 'watch-null',
        task: 'Add `console.log(\'notes ref:\', notesBox.value)` at the very end of `toggleNotes()` (after the `await`). Open and close the notes a few times.',
        hint: 'Watch the console as the box appears and disappears.',
        explain: 'You\'ll see the element when the box is open and `null` when it is closed: Vue clears the ref when the element is unmounted. Always assume a ref to a conditional element can be `null`.',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'querySelector vs a template ref',
    props: {
      left: { label: 'document.querySelector', lang: 'vue', code: querySelectorVersion },
      right: { label: 'Template ref', lang: 'vue', code: templateRefVersion },
      points: [
        '`querySelector` searches the whole page; a template ref belongs to this component instance.',
        'With two instances, `querySelector` always returns the first one\'s element.',
        'Renaming a CSS class silently breaks `querySelector`; the ref label is explicit.',
        'Vue fills (and clears) template refs at exactly the right time.',
      ],
    },
    caption: 'Same goal — focus the input on mount — but only the template ref is safe inside reusable components.',
    alt: 'Two panels. Left: a component that calls document.querySelector(".search").focus() in onMounted, with comments listing its problems. Right: the same component using useTemplateRef("search") and ref="search" on the input.',
  },

  internals: {
    beginner: `
Each component keeps a small list of its labelled elements. When Vue creates an element that has \`ref="search"\`, it writes that element into the matching ref. When the element is removed, Vue writes \`null\`. Because this happens right after Vue updates the page, the element is ready by the time \`onMounted\` runs.
`,
    technical: [
      `
\`ref\` is a special vnode property, not a real attribute — it never appears in the DOM. After the renderer patches an element (or mounts a component), it calls an internal \`setRef()\` that assigns the element — or, for components, the exposed public instance — to:

- the instance's \`refs\` registry under that key (this is what \`useTemplateRef(key)\` reads; it returns a shallow ref connected to that key),
- a matching \`<script setup>\` ref binding with the same name (the compiler knows \`notesBox\` is a ref and passes it along),
- or a function ref, which is simply called with the element.

Assignment is scheduled as a post-render job that runs before \`mounted\` hooks, which is why refs are ready in \`onMounted\`. On unmount the same path assigns \`null\`. Inside \`v-for\`, the compiler marks the ref so values are collected into an array.
`,
      {
        code: `// A simplified model of what Vue does with ref="search" — not real source
function setRef(key, el, owner) {
  owner.refs[key] = el                              // useTemplateRef('search') reads this
  if (isRef(owner.setupState[key])) {
    owner.setupState[key].value = el                // same-name ref(null) pattern
  }
}

// after mounting <input ref="search">:   setRef('search', inputEl, instance)
// after it is removed:                   setRef('search', null, instance)`,
        lang: 'js',
        title: 'mental model (simplified)',
      },
    ],
    production: `
- **Focus management is an accessibility feature.** Move focus into a dialog when it opens and back to the trigger when it closes; focus the first invalid field after a failed submit. See [Accessible components](lesson:accessible-components).
- **Third-party libraries** (charts, maps, editors) usually need an element: create them in \`onMounted\`, update them from a \`watch\`, and **destroy them in \`onUnmounted\`** to avoid leaks. Keep the library instance out of deep reactivity (\`shallowRef\` or \`markRaw\`).
- **SSR:** there is no DOM on the server and \`onMounted\` doesn't run there, so all element access must live in \`onMounted\` (or later) — never at the top level of setup.
- **Don't fight Vue.** Changing text, classes or children of Vue-managed elements through a ref gets overwritten on the next render. Change state instead.
- **Reaching into child components** couples them tightly. Expose a minimal imperative API (\`focus\`, \`open\`, \`reset\`) with \`defineExpose\` and prefer props/events for data.
`,
  },

  mistakes: [
    {
      title: 'Using the ref before the element exists',
      wrong: { code: `<script setup>\nimport { useTemplateRef } from 'vue'\nconst input = useTemplateRef('search')\ninput.value.focus() // TypeError: Cannot read properties of null\n</script>`, lang: 'vue' },
      right: { code: `<script setup>\nimport { useTemplateRef, onMounted } from 'vue'\nconst input = useTemplateRef('search')\nonMounted(() => input.value.focus())\n</script>`, lang: 'vue' },
      explanation: 'Top-level setup code runs before the template is rendered. Access template refs in `onMounted`, in event handlers, or after `await nextTick()`.',
    },
    {
      title: 'Mismatched names (pre-3.5 pattern)',
      wrong: { code: `<script setup>\nconst email = ref(null)\n</script>\n\n<template>\n  <input ref="emailInput" />  <!-- email.value stays null -->\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\nconst emailInput = ref(null)\n</script>\n\n<template>\n  <input ref="emailInput" />\n</template>`, lang: 'vue' },
      explanation: 'With the same-name pattern, the variable name must equal the attribute. With `useTemplateRef(\'emailInput\')` you can name the variable anything — the string argument does the matching.',
    },
    {
      title: 'Editing Vue-managed DOM through a ref',
      wrong: { code: `function markDone() {\n  item.value.textContent = 'Done!'\n  item.value.classList.add('done')\n}`, lang: 'js' },
      right: { code: `const done = ref(false)\nfunction markDone() {\n  done.value = true\n}\n// template: <li :class="{ done }">{{ done ? 'Done!' : label }}</li>`, lang: 'js' },
      explanation: 'Vue re-renders from state and will overwrite manual DOM edits — or get confused by them. Use refs only for what bindings cannot express.',
    },
    {
      title: 'Accessing a newly shown element without waiting',
      wrong: { code: `function openSearch() {\n  showSearch.value = true\n  searchInput.value.focus() // still null: the DOM hasn't updated\n}`, lang: 'js' },
      right: { code: `async function openSearch() {\n  showSearch.value = true\n  await nextTick()\n  searchInput.value.focus()\n}`, lang: 'js' },
      explanation: 'Vue batches DOM updates. `nextTick()` resolves after the pending update, when the new element (and its ref) exists.',
    },
  ],

  debugging: [
    {
      symptom: '`TypeError: Cannot read properties of null (reading \'focus\')`.',
      cause: 'The ref was used before mount (top-level setup), after the element was removed by `v-if`, or right after a state change without waiting.',
      fix: 'Move the call into `onMounted` or an event handler, `await nextTick()` after state changes, and use `?.` for conditional elements.',
    },
    {
      symptom: 'The ref stays `null` even though the element is on screen.',
      cause: 'The names don\'t match (`ref="emailInput"` vs `const email = ref(null)`), or the `useTemplateRef` key has a typo.',
      fix: 'Make the attribute and the variable name (or the `useTemplateRef` key) identical.',
    },
    {
      symptom: '`childRef.value.someMethod is not a function` when calling into a child component.',
      cause: 'The child uses `<script setup>`, which exposes nothing by default.',
      fix: 'In the child, `defineExpose({ someMethod })` — or better, communicate through props and events.',
    },
    {
      symptom: 'Focus jumps to the wrong row in a list.',
      cause: 'An array ref from `v-for` was assumed to be in source order.',
      fix: 'Use a function ref that stores elements by index or id: `:ref="(el) => (inputs[i] = el)"`.',
    },
    {
      symptom: 'Text you set through `el.textContent` disappears after the next click.',
      cause: 'Vue re-rendered the element from its template and overwrote the manual change.',
      fix: 'Put the text in state and render it with interpolation.',
    },
  ],

  bestPractices: [
    'Use template refs only for imperative work: focus, selection, scrolling, measuring, media, third-party libraries.',
    'Prefer `useTemplateRef()` on Vue 3.5+; use the same-name `ref(null)` pattern on older versions.',
    'Access refs in `onMounted`, event handlers, or after `await nextTick()` — never at the top level of setup.',
    'Guard refs to conditional elements with `?.`.',
    'Clean up anything you create on an element (charts, observers) in `onUnmounted`.',
    'Expose a minimal API from child components with `defineExpose()`; prefer props/events.',
  ],

  useCases: [
    'Autofocus a search box or the first field of a form.',
    'Focus the first invalid field after a failed submit; move focus into and out of dialogs.',
    'Play/pause a `<video>`, draw on a `<canvas>`, select text in an input.',
    'Measure an element\'s size or position for tooltips and popovers.',
    'Mount third-party widgets (charts, maps, rich-text editors) onto an element.',
  ],

  whenToUse: {
    use: [
      'You need a DOM API that has no declarative equivalent (`focus()`, `play()`, `getBoundingClientRect()`).',
      'A non-Vue library needs a real element to render into.',
      'A parent needs to trigger a small imperative action on a child (`focus`, `open`).',
    ],
    avoid: [
      'Changing text, classes, attributes or visibility — use bindings and state.',
      'Passing data between components — use props, events or a store.',
      'Querying elements outside your component — that\'s not yours to manage.',
    ],
  },

  comparison: {
    title: 'Ways to get at the DOM',
    headers: ['', 'Template ref', '`document.querySelector`', 'State + bindings', 'Custom directive'],
    rows: [
      ['Scope', 'this component instance', 'the whole page', '—', 'the element it is placed on'],
      ['Multiple instances', 'each gets its own element', 'always the first match', 'each has its own state', 'each element handled'],
      ['Timing', 'filled after mount, null when removed', 'whatever exists right now', 'always in sync', 'lifecycle hooks with the element'],
      ['Use it for', 'focus, measuring, media, libraries', 'non-Vue parts of the page only', 'text, classes, attributes, visibility', 'reusable DOM behaviour (e.g. `v-focus`)'],
    ],
    note: 'Reusable DOM behaviour often becomes a [custom directive](lesson:custom-directives) or a composable.',
  },

  quiz: [
    {
      id: 'template-refs-q1',
      type: 'mcq',
      prompt: 'When does `useTemplateRef(\'search\')` first contain the `<input ref="search">` element?',
      options: [
        { text: 'After the component has mounted — e.g. inside `onMounted`.' },
        { text: 'Immediately, at the top of `<script setup>`.', why: 'Setup runs before the template is rendered, so the value is still `null`.' },
        { text: 'Only after the user interacts with the element.', why: 'Interaction is irrelevant; Vue fills the ref once the element is created.' },
        { text: 'Never — you must use `document.querySelector`.', why: 'Template refs exist exactly to avoid that.' },
      ],
      answer: 0,
      explanation: 'Vue assigns the element right after creating it, before `onMounted` callbacks run.',
    },
    {
      id: 'template-refs-q2',
      type: 'output',
      prompt: 'What does the console show, in order?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { useTemplateRef, onMounted } from 'vue'
const box = useTemplateRef('box')
console.log(box.value)
onMounted(() => console.log(box.value.tagName))
</script>

<template>
  <div ref="box">Hello</div>
</template>`,
      },
      options: [
        { text: '`null`, then `DIV`' },
        { text: '`DIV`, then `DIV`', why: 'The first log runs during setup, before the div exists.' },
        { text: '`undefined`, then `undefined`', why: 'The ref starts as `null` and is filled before `onMounted` runs.' },
        { text: 'An error on the first line', why: 'Logging `null` is fine; only calling a method on it would throw.' },
      ],
      answer: 0,
      explanation: 'Setup runs first (null). After mounting, the ref holds the `<div>` and `tagName` is "DIV".',
    },
    {
      id: 'template-refs-q3',
      type: 'bug',
      prompt: 'Clicking the button throws `Cannot read properties of null (reading \'focus\')`. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'

const email = ref(null)

function focusEmail() {
  email.value.focus()
}
</script>

<template>
  <input ref="emailInput" type="email" />
  <button @click="focusEmail">Edit email</button>
</template>`,
      },
      answerLine: 12,
      explanation: 'With the same-name pattern, `ref="emailInput"` fills a ref called `emailInput`, not `email`. Rename one so they match (or use `useTemplateRef(\'emailInput\')`).',
    },
    {
      id: 'template-refs-q4',
      type: 'fill',
      prompt: 'Complete the Vue 3.5+ template ref.',
      code: { lang: 'vue', code: `<script setup>\nimport { ___, onMounted } from 'vue'\nconst input = useTemplateRef('search')\nonMounted(() => input.value.focus())\n</script>\n\n<template>\n  <input ___="search" />\n</template>` },
      answer: [['useTemplateRef'], ['ref']],
      explanation: 'Import `useTemplateRef`, and label the element with the `ref` attribute whose value matches the key.',
    },
    {
      id: 'template-refs-q5',
      type: 'mcq',
      prompt: 'A parent puts `ref="picker"` on a child component written with `<script setup>`. What can the parent access through it?',
      options: [
        { text: 'Only what the child exposes with `defineExpose()`.' },
        { text: 'Every variable and function inside the child.', why: '`<script setup>` components are closed by default.' },
        { text: 'The child\'s root DOM element only.', why: 'A ref on a component gives the component instance, not its root element.' },
        { text: 'Nothing — refs only work on HTML elements.', why: 'Refs work on components too; they just expose little by default.' },
      ],
      answer: 0,
      explanation: '`defineExpose({ open, focus })` decides the child\'s public imperative API.',
    },
    {
      id: 'template-refs-q6',
      type: 'mcq',
      prompt: 'What is true about a ref placed inside `v-for`?',
      options: [
        { text: 'It holds an array of elements, whose order is not guaranteed to match the source array.' },
        { text: 'It holds only the last element.', why: 'Inside `v-for` the ref collects all of the elements.' },
        { text: 'It holds an array in exactly the same order as the data.', why: 'The docs explicitly say the order is not guaranteed.' },
        { text: 'Refs are not allowed inside `v-for`.', why: 'They are allowed and produce an array.' },
      ],
      answer: 0,
      explanation: 'When order matters, use a function ref and store elements by index or id.',
    },
    {
      id: 'template-refs-q7',
      type: 'short',
      prompt: 'Why is `document.querySelector` a bad way to find elements inside a Vue component?',
      answer: 'It searches the entire page, so with several instances of the component it returns the first match rather than this instance\'s element; it couples code to CSS class names; and it ignores Vue\'s timing, so the element may not exist yet or may have been replaced. Template refs are scoped to the component instance, explicitly named, and filled and cleared by Vue at the right time.',
    },
  ],

  exercises: [
    {
      id: 'focus-invalid-field',
      title: 'Focus the first invalid field',
      difficulty: 'beginner',
      prompt: `
On submit (prevent the reload):

- If \`.name\` is empty → focus the name input and show \`<p class="error">Name is required</p>\`.
- Otherwise, if \`.email\` has no "@" → focus the email input and show \`<p class="error">Email is invalid</p>\`.
- Otherwise → show \`<p class="success">Thanks, NAME!</p>\` and no error.

Use template refs for the focus (either \`useTemplateRef\` or same-name refs).
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const error = ref('')
const sent = ref(false)

function submit() {
  // TODO: validate, set error, focus the first invalid field
}
</script>

<template>
  <form class="contact" @submit.prevent="submit">
    <label>Name <input class="name" v-model.trim="name" /></label>
    <label>Email <input class="email" v-model.trim="email" /></label>
    <button>Send</button>
  </form>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="sent" class="success">Thanks, {{ name }}!</p>
</template>`,
      },
      hints: [
        'Add `ref="nameInput"` and `ref="emailInput"` to the inputs and create matching refs with `useTemplateRef(\'nameInput\')` / `useTemplateRef(\'emailInput\')`.',
        'In `submit()`: check the name first; if it is empty, set `error.value`, call `nameInput.value.focus()` and `return`.',
        'Then check `email.value.includes(\'@\')` the same way. If both pass, clear `error` and set `sent.value = true`.',
      ],
      solution: {
        explanation: 'Validation decides *what* is wrong (state: `error`), and the template ref handles *where the cursor goes* (imperative focus). Moving focus to the first problem is a real accessibility win: keyboard and screen-reader users land exactly where they need to fix something. (The server must validate again.)',
        files: {
          'App.vue': `<script setup>
import { ref, useTemplateRef } from 'vue'

const name = ref('')
const email = ref('')
const error = ref('')
const sent = ref(false)

const nameInput = useTemplateRef('nameInput')
const emailInput = useTemplateRef('emailInput')

function submit() {
  sent.value = false
  if (!name.value) {
    error.value = 'Name is required'
    nameInput.value.focus()
    return
  }
  if (!email.value.includes('@')) {
    error.value = 'Email is invalid'
    emailInput.value.focus()
    return
  }
  error.value = ''
  sent.value = true
}
</script>

<template>
  <form class="contact" @submit.prevent="submit">
    <label>Name <input ref="nameInput" class="name" v-model.trim="name" /></label>
    <label>Email <input ref="emailInput" class="email" v-model.trim="email" /></label>
    <button>Send</button>
  </form>
  <p v-if="error" class="error">{{ error }}</p>
  <p v-if="sent" class="success">Thanks, {{ name }}!</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'empty name: error + focus on name',
          code: `await submit('.contact')
expect(text('.error')).toBe('Name is required')
expect(document.activeElement).toBe(find('.name'))`,
        },
        {
          name: 'bad email: error + focus on email',
          code: `await type('.name', 'Ada')
await submit('.contact')
expect(text('.error')).toBe('Email is invalid')
expect(document.activeElement).toBe(find('.email'))`,
        },
        {
          name: 'valid form: success and no error',
          code: `await type('.name', 'Ada')
await type('.email', 'ada@example.com')
await submit('.contact')
expect(text('.success')).toBe('Thanks, Ada!')
expect(exists('.error')).toBe(false)`,
        },
      ],
    },
    {
      id: 'checklist-enter',
      title: 'Press Enter to jump to the next item',
      difficulty: 'beginner',
      prompt: `
A packing checklist has one \`<input class="item">\` per item. Make **Enter** in any input move the focus to the **next** input (Enter in the last one does nothing).

- Store the inputs in index order with a **function ref**: \`:ref="(el) => (inputs[i] = el)"\`.
- Handle \`@keydown.enter\` and focus \`inputs[i + 1]\` if it exists.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const items = ref(['Passport', 'Charger', 'Toothbrush'])
</script>

<template>
  <ul class="checklist">
    <li v-for="(item, i) in items" :key="item">
      <input class="item" :value="item" />
    </li>
  </ul>
</template>`,
      },
      hints: [
        'Create a plain array: `const inputs = []` — it doesn\'t need to be reactive, it just stores elements.',
        'On each input: `:ref="(el) => (inputs[i] = el)"` and `@keydown.enter="focusNext(i)"`.',
        '`function focusNext(i) { inputs[i + 1]?.focus() }` — the `?.` makes Enter on the last item a no-op.',
      ],
      solution: {
        explanation: 'A function ref is called with each element as it mounts (and `null` when it unmounts), so storing by index gives a reliable, ordered lookup — unlike a `v-for` array ref, whose order is not guaranteed. The array is a plain one because nothing in the template depends on it.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const items = ref(['Passport', 'Charger', 'Toothbrush'])
const inputs = []

function focusNext(i) {
  inputs[i + 1]?.focus()
}
</script>

<template>
  <ul class="checklist">
    <li v-for="(item, i) in items" :key="item">
      <input
        class="item"
        :value="item"
        :ref="(el) => (inputs[i] = el)"
        @keydown.enter="focusNext(i)"
      />
    </li>
  </ul>
</template>`,
        },
      },
      tests: [
        {
          name: 'Enter moves focus to the next input',
          code: `const inputs = findAll('.item')
inputs[0].focus()
await trigger(inputs[0], 'keydown', { key: 'Enter' })
expect(document.activeElement).toBe(inputs[1])
await trigger(inputs[1], 'keydown', { key: 'Enter' })
expect(document.activeElement).toBe(inputs[2])`,
        },
        {
          name: 'Enter on the last input keeps focus there',
          code: `const inputs = findAll('.item')
inputs[2].focus()
await trigger(inputs[2], 'keydown', { key: 'Enter' })
expect(document.activeElement).toBe(inputs[2])`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'template-refs-purpose',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a template ref, and when should you use one?',
      answer: 'A template ref gives script code direct access to a DOM element (or child component instance) rendered by the template: mark it with `ref="name"` and read it via `useTemplateRef(\'name\')` (3.5+) or a same-named `ref(null)`. It is filled after mount and reset to `null` on unmount. Use it for imperative needs bindings cannot express — focus, text selection, scrolling, measuring, media playback, third-party libraries — not for changing text, classes or visibility.',
      explanation: 'Declarative for data, imperative only when the browser API demands it.',
      whyAsked: 'Checks that you know the escape hatch and its limits.',
      mistakes: ['Using refs to change content or styles.', 'Not knowing when the ref is populated.'],
      followUps: ['Why is the ref null in setup?', 'What do you get from a ref on a component?'],
      modelAnswer: "A template ref is a way to get the actual element out of the template. I label the element with a ref attribute and read it with useTemplateRef on Vue 3.5 and later, or with a ref of the same name on older versions. Vue fills it once the element is mounted and sets it back to null when it's removed. I only use it for imperative things the browser can't do declaratively, like focus, measuring, or handing an element to a chart library — content and styling stay in state and bindings.",
    },
    {
      id: 'template-refs-null-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A component calls `input.value.focus()` and crashes with "Cannot read properties of null". Sometimes it works, sometimes not. What are the likely causes?',
      answer: 'The ref is null whenever the element doesn\'t exist: (1) the code runs at the top level of setup, before mount; (2) the element is behind a `v-if` that is false; (3) the code runs right after a state change that will create the element, before Vue has flushed the update. Fix by accessing it in `onMounted` or an event handler, awaiting `nextTick()` after state changes, and guarding conditional elements with `?.`. Also check for a name mismatch between the attribute and the ref.',
      explanation: 'Template refs follow the element\'s lifecycle: no element, no ref.',
      code: {
        lang: 'js',
        code: `async function edit() {
  editing.value = true
  await nextTick()          // wait for <input v-if="editing" ref="field"> to exist
  field.value?.focus()
}`,
      },
      whyAsked: 'One of the most common template-ref bugs in practice.',
      mistakes: ['Wrapping it in `setTimeout(…, 100)`.', 'Not knowing about `nextTick`.'],
      followUps: ['What does `nextTick` actually wait for?', 'How would you autofocus an element inside a modal component?'],
      modelAnswer: "The ref is only populated while the element exists, so null means the code ran when it didn't: at the top level of setup before mount, while a v-if is false, or immediately after changing state that will create the element but before Vue has re-rendered. 'Sometimes' usually points to the last two. I'd move the access into onMounted or the event handler, await nextTick after the state change, and use optional chaining for conditional elements. And I'd double-check the ref name matches the attribute.",
    },
    {
      id: 'template-refs-use-template-ref',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `useTemplateRef(\'input\')` (Vue 3.5+) with the older `const input = ref(null)` pattern.',
      answer: 'Both get filled with the element marked `ref="input"`. With `ref(null)`, matching relies on the variable name being identical to the attribute, and it looks like ordinary reactive state. `useTemplateRef(key)` matches by an explicit string key, so the variable can have any name, the intent ("this is a template ref") is obvious, it works naturally inside composables (pass the key in), and it gives better type inference. It requires Vue 3.5+; the older pattern still works.',
      explanation: 'Same mechanism, clearer API.',
      code: {
        lang: 'js',
        code: `// composable that needs an element
export function useAutofocus(key) {
  const el = useTemplateRef(key)
  onMounted(() => el.value?.focus())
}`,
      },
      whyAsked: 'Checks that you follow recent Vue releases and understand the trade-offs.',
      mistakes: ['Saying the old pattern is deprecated — it is still supported.', 'Not knowing the version requirement.'],
      followUps: ['How would you type `useTemplateRef` in TypeScript?', 'Can two refs point at the same key?'],
      modelAnswer: "They're backed by the same mechanism. The classic way is a ref initialised to null whose variable name must equal the ref attribute — it works, but it's implicit and looks like normal state. useTemplateRef, added in 3.5, takes the key as a string, so the variable can be named freely, the intent is explicit, and it's easy to use from a composable by passing the key. It also infers element types better. On projects older than 3.5 I'd keep the classic pattern; it isn't deprecated.",
    },
    {
      id: 'template-refs-expose',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What do you get when you put a template ref on a child component, and why are `<script setup>` components "closed by default"?',
      answer: 'You get the child\'s public instance. For an Options API component that includes its data and methods; for a `<script setup>` component nothing is public unless the child calls `defineExpose({ … })`, because its bindings live in the setup closure and are not returned as a public object. This keeps components encapsulated: parents can call a deliberate imperative API (e.g. `focus()`, `open()`) but cannot depend on internals. Data flow should still use props and events.',
      explanation: 'Encapsulation by default; explicit opt-in for imperative APIs.',
      code: {
        lang: 'vue',
        code: `<!-- Modal.vue -->
<script setup>
import { ref } from 'vue'
const isOpen = ref(false)
function open() { isOpen.value = true }
function close() { isOpen.value = false }
defineExpose({ open, close })
</script>`,
      },
      whyAsked: 'Tests understanding of component boundaries and `<script setup>` compilation.',
      mistakes: ['Expecting full access to the child\'s state.', 'Using refs as the main way components communicate.'],
      followUps: ['When is an imperative child API appropriate?', 'How does this interact with TypeScript?'],
      modelAnswer: "A ref on a component gives me its instance rather than a DOM element. With the Options API that instance exposes everything; with script setup the bindings live inside the compiled setup closure and nothing is returned publicly, so the parent sees only what the child passes to defineExpose. That's intentional encapsulation: the child can offer a small imperative API like open or focus without letting parents depend on its internal refs. For data I'd still use props and emits.",
    },
    {
      id: 'template-refs-chart-library',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'You need to render a third-party chart library (it takes a `<canvas>` element and a data object) inside a Vue component, and the data updates every few seconds. How do you integrate it?',
      answer: 'Put `<canvas ref="canvas">` in the template. In `onMounted`, create the chart with `canvasRef.value` and keep the instance in a non-deep reactive holder (a plain variable, `shallowRef`, or `markRaw`) so Vue doesn\'t proxy the library\'s internals. `watch` the data prop and call the library\'s update method instead of recreating the chart. In `onUnmounted`, call the library\'s destroy method to release listeners and memory. Wrap it in a reusable component or composable.',
      explanation: 'Vue owns the element; the library owns its contents. Create, update and destroy in sync with the component lifecycle.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { useTemplateRef, onMounted, onUnmounted, watch } from 'vue'
const props = defineProps({ data: Object })
const canvas = useTemplateRef('canvas')
let chart = null

onMounted(() => { chart = createChart(canvas.value, props.data) }) // library API (illustrative)
watch(() => props.data, (d) => chart?.update(d), { deep: true })
onUnmounted(() => chart?.destroy())
</script>

<template>
  <canvas ref="canvas"></canvas>
</template>`,
      },
      whyAsked: 'Real apps integrate non-Vue libraries constantly; this checks lifecycle and reactivity judgement.',
      mistakes: ['Creating the chart in setup (no element yet).', 'Recreating the chart on every update.', 'Forgetting to destroy it — memory leaks.', 'Making the chart instance deeply reactive.'],
      followUps: ['Why avoid deep reactivity for the chart instance?', 'How would you handle SSR?'],
      modelAnswer: "The template renders a canvas with a ref. In onMounted — the first moment the canvas exists — I create the chart and store the instance outside deep reactivity, as a plain variable or with markRaw, so Vue doesn't try to proxy the library's internals. A watcher on the data calls the library's update method rather than rebuilding the chart. In onUnmounted I destroy it to free listeners and memory. Since onMounted doesn't run on the server, this also works with SSR. I'd wrap it as a ChartCanvas component so the rest of the app just passes data.",
    },
    {
      id: 'template-refs-nexttick-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'The user clicks **Edit**. What do the two `console.log` calls print?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, useTemplateRef, nextTick } from 'vue'
const editing = ref(false)
const field = useTemplateRef('field')

async function edit() {
  editing.value = true
  console.log(field.value)
  await nextTick()
  console.log(field.value.tagName)
}
</script>

<template>
  <button @click="edit">Edit</button>
  <input v-if="editing" ref="field" />
</template>`,
      },
      options: ['null, then INPUT', 'INPUT, then INPUT', 'null, then an error', 'undefined, then INPUT'],
      correctOption: 0,
      answer: '`null`, then `INPUT`. Setting `editing` schedules a re-render but doesn\'t perform it synchronously, so the input (and the ref) don\'t exist yet at the first log. After `await nextTick()` the DOM has been updated and the ref is filled.',
      explanation: 'Vue batches DOM updates; `nextTick()` waits for the flush.',
      whyAsked: 'Tests understanding of Vue\'s asynchronous update queue.',
      mistakes: ['Assuming state changes update the DOM immediately.'],
      followUps: ['Why does Vue batch updates?', 'What would happen with two state changes before the await?'],
      modelAnswer: "First null, then INPUT. Changing editing doesn't re-render synchronously — Vue queues the update and flushes it in a microtask — so on the first log the input hasn't been created and the ref is still null. After await nextTick the flush has happened, the input exists and the ref holds it, so tagName is INPUT.",
    },
    {
      id: 'template-refs-coding-modal',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'When `.open-btn` opens the dialog (`v-if`), focus its `.modal-input` automatically. When `.close-btn` closes it, return focus to `.open-btn`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <button class="open-btn" @click="open = true">Rename file</button>
  <div v-if="open" class="modal" role="dialog" aria-label="Rename file">
    <input class="modal-input" placeholder="New name" />
    <button class="close-btn" @click="open = false">Close</button>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'opening focuses the input', code: `await click('.open-btn'); expect(document.activeElement).toBe(find('.modal-input'))` },
        { name: 'closing returns focus to the trigger', code: `await click('.open-btn'); await click('.close-btn'); expect(exists('.modal')).toBe(false); expect(document.activeElement).toBe(find('.open-btn'))` },
      ],
      hints: ['Two refs: one on the input, one on the open button. Use async functions with `await nextTick()` before focusing.', 'Opening: set `open`, await `nextTick()`, focus the input. Closing: set `open = false`, then focus the open button (it always exists).'],
      answer: 'Template refs on the input and the trigger; `nextTick()` before focusing the newly rendered input.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, useTemplateRef, nextTick } from 'vue'

const open = ref(false)
const input = useTemplateRef('input')
const trigger = useTemplateRef('trigger')

async function openModal() {
  open.value = true
  await nextTick()
  input.value?.focus()
}

function closeModal() {
  open.value = false
  trigger.value?.focus()
}
</script>

<template>
  <button ref="trigger" class="open-btn" @click="openModal">Rename file</button>
  <div v-if="open" class="modal" role="dialog" aria-label="Rename file">
    <input ref="input" class="modal-input" placeholder="New name" />
    <button class="close-btn" @click="closeModal">Close</button>
  </div>
</template>`,
        },
      },
      explanation: 'Moving focus into a dialog and back to its trigger is standard accessible dialog behaviour. The input only exists after the re-render, hence `nextTick()`.',
      whyAsked: 'Combines refs, timing and accessibility in a small realistic task.',
      mistakes: ['Focusing before `nextTick` (the ref is null).', 'Forgetting to restore focus on close.'],
      followUps: ['How would you trap focus inside the dialog?', 'How does the native <dialog> element help?'],
      modelAnswer: "I'd add refs to the input and the trigger button. Opening sets the flag, awaits nextTick so the dialog's input actually exists, then focuses it. Closing hides the dialog and moves focus back to the trigger, so keyboard users don't lose their place. A full solution would also trap focus inside the dialog and close on Escape — or use the native dialog element.",
    },
  ],

  takeaways: [
    'Mark an element with `ref="name"` and read it with `useTemplateRef(\'name\')` (3.5+) or a same-named `ref(null)`.',
    'Template refs are `null` until mount and become `null` again when the element is removed.',
    'Access them in `onMounted`, event handlers, or after `await nextTick()`.',
    'Use refs for imperative tasks (focus, measuring, media, libraries) — never to change what bindings control.',
    'Refs in `v-for` are arrays (order not guaranteed); refs on `<script setup>` components only see what `defineExpose()` exposes.',
  ],
}
