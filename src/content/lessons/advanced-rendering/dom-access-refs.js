// Lesson: Template refs in depth & DOM access.

const chatApp = `<script setup>
import { ref, useTemplateRef, nextTick } from 'vue'
import ChatLog from './ChatLog.vue'

const messages = ref([
  { id: 1, text: 'Hi! Are we still on for 4pm?' },
  { id: 2, text: 'Yes — see you at the café.' },
])
const draft = ref('')
let nextId = 3

// Vue 3.5+: link a variable to the element with ref="composer"
const input = useTemplateRef('composer')
// a component ref: we only get what ChatLog chooses to expose
const chatLog = useTemplateRef('log')

async function send() {
  const text = draft.value.trim()
  if (!text) return
  messages.value.push({ id: nextId++, text })
  draft.value = ''
  await nextTick() // wait until the new message is in the DOM
  chatLog.value.scrollToBottom()
}
</script>

<template>
  <ChatLog ref="log" :messages="messages" />
  <form class="composer-form" @submit.prevent="send">
    <input
      ref="composer"
      v-model="draft"
      class="composer"
      placeholder="Type a message…"
    />
    <button class="send">Send</button>
  </form>
</template>`

const chatLog = `<script setup>
import { useTemplateRef } from 'vue'

defineProps({
  messages: { type: Array, required: true },
})

const list = useTemplateRef('list')

function scrollToBottom() {
  // a real DOM API: there is no template syntax for "scroll this box"
  list.value.scrollTop = list.value.scrollHeight
}

// <script setup> components are closed by default.
// The parent can reach ONLY what is listed here.
defineExpose({ scrollToBottom })
</script>

<template>
  <ul ref="list" class="log">
    <li v-for="m in messages" :key="m.id" class="bubble">{{ m.text }}</li>
  </ul>
</template>

<style scoped>
.log {
  height: 140px;
  overflow-y: auto;
  list-style: none;
  margin: 0 0 12px;
  padding: 8px;
  border: 2px solid #1a1a1a;
}
.bubble {
  background: #eef1ff;
  margin: 6px 0;
  padding: 6px 10px;
  border-radius: 12px;
  width: fit-content;
}
</style>`

export default {
  id: 'dom-access-refs',
  title: 'Template refs in depth & DOM access',
  summary: 'Get hold of real DOM elements and child component instances — in loops, through functions and with useTemplateRef() — and know when touching the DOM is actually the right call.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['template-refs', 'setup-and-script-setup', 'lifecycle-hooks'],
  related: ['next-tick', 'custom-directives', 'composables-intro', 'teleport', 'accessible-components'],
  tags: ['template refs', 'ref attribute', 'useTemplateRef', 'defineExpose', 'DOM access', 'focus', 'v-for refs', 'function refs', 'component refs', '$refs'],
  apis: [
    { name: 'ref="name"', summary: 'Template attribute that asks Vue to hand you the element (or component instance) once it is mounted.' },
    { name: 'useTemplateRef(key)', summary: 'Vue 3.5+: returns a shallow ref that Vue fills with the element or component whose `ref` attribute equals `key`.' },
    { name: ':ref="(el) => …"', summary: 'Function ref: Vue calls your function with the element after mount and on updates, and with `null` on unmount.' },
    { name: 'defineExpose()', summary: 'Compiler macro that chooses which properties a `<script setup>` component makes available through a template ref.' },
    { name: 'this.$refs', summary: 'Options API: an object of all template refs registered by the component.' },
  ],
  docs: [
    { label: 'Vue Guide — Template Refs', url: 'https://vuejs.org/guide/essentials/template-refs.html' },
    { label: 'API — useTemplateRef()', url: 'https://vuejs.org/api/composition-api-helpers.html#usetemplateref' },
    { label: 'API — defineExpose()', url: 'https://vuejs.org/api/sfc-script-setup.html#defineexpose' },
    { label: 'API — nextTick()', url: 'https://vuejs.org/api/general.html#nexttick' },
  ],

  intro: `
A **template ref** is Vue's official way to get your hands on a *real* thing in the page: an actual \`<input>\` element you can call \`.focus()\` on, or the instance of a child component you can call a method on.

You met the basic version in [Template refs: reaching the real DOM](lesson:template-refs). This lesson goes deeper:

- **when** a ref is filled in, and when it goes back to \`null\`;
- refs inside \`v-for\`, and **function refs** for dynamic lists;
- **component refs** and \`defineExpose()\` — what a parent is allowed to touch;
- \`useTemplateRef()\` (Vue 3.5+);
- the judgment call: **when touching the DOM is right, and when it quietly fights Vue.**
`,

  why: `
Vue is *declarative*: you describe what the page should look like for the current data, and Vue makes the real DOM match. You almost never say "find this element and change it".

But some browser features are *imperative* — they are actions, not descriptions, and they need the actual element:

- put the cursor in a search box (\`input.focus()\`), select its text (\`input.select()\`);
- scroll a chat window to the bottom, or an item into view;
- measure an element (\`getBoundingClientRect()\`) to position a tooltip;
- play or pause a \`<video>\`;
- hand a \`<canvas>\` or \`<div>\` to a chart, map or editor library that draws into it.

There is no \`v-focus-now\` attribute for these. You *could* use \`document.querySelector('.search')\` — but inside a component that is fragile:

\`\`\`js
// inside a component — don't do this
document.querySelector('.search').focus()
// ❌ finds the FIRST .search on the whole page — maybe another instance's
// ❌ returns null if this component hasn't rendered yet
// ❌ keeps pointing at a removed element after a v-if hides it
\`\`\`

Template refs solve all three: they are **scoped to this component instance**, **filled in by Vue at the right moment**, and **reset to \`null\`** when the element disappears.
`,

  eli15: `
Think of Vue as a stage crew. You hand them a script (the template) and they build the set. Normally, when the story changes, you just change the script and the crew rearranges everything for you.

But sometimes you need to *physically hand the lead actor a microphone* — "put the cursor in this box **now**". For that you need to find one exact object on stage.

A template ref is a **name tag** you stick on one object in the script: \`ref="composer"\`. After the crew has built the set, the tag points to the real object, and you can do things with it.

- **Before** the set is built, the tag points to nothing (\`null\`).
- **While** the object is on stage, the tag points to it.
- When the object is **taken off stage** (\`v-if\` becomes false), the tag goes back to \`null\`.

And if the object is another *actor* (a child component), you can only ask them to do the things they have publicly agreed to do — that agreement is \`defineExpose()\`.
`,

  analogy: {
    title: 'Hotel key cards',
    body: `
You book a room before you arrive. The booking exists, but your key card is blank — the room is still being prepared. Once you check in, the front desk activates the card and it opens *your* room, not any room on that floor. When you check out, the card stops working.

A template ref works the same way. You declare it in \`<script setup>\` (the booking), Vue activates it when the element is mounted (check-in), and deactivates it — back to \`null\` — when the element is removed (check-out).

Booking several rooms for a group (\`v-for\`)? You get a stack of cards. And for a room with staff (a child component), your card only gives access to the services the hotel lists on the menu — that menu is \`defineExpose()\`.
`,
    mapping: [
      ['booking the room', 'declaring `useTemplateRef(\'composer\')` or `ref(null)` in setup'],
      ['the blank card before check-in', 'the ref is `null` during setup and `onBeforeMount`'],
      ['check-in activates the card', 'Vue fills the ref when the element is mounted — use it in `onMounted`'],
      ['checking out', 'the element is unmounted (e.g. `v-if` false) and the ref returns to `null`'],
      ['a stack of cards for a group', '`ref` inside `v-for` gives an array of elements'],
      ['the room-service menu', '`defineExpose({ … })` — the only things a parent can call on a child'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The life of a template ref',
    props: {
      nodes: [
        { id: 'setup', label: 'setup runs', note: 'input.value === null', tone: 'paper' },
        { id: 'render', label: 'render', note: 'vnode has ref="composer"', tone: 'paper' },
        { id: 'mount', label: 'element inserted', note: 'Vue sets input.value = <input>', tone: 'acid' },
        { id: 'mounted', label: 'onMounted', note: 'safe to call .focus()', tone: 'cobalt' },
        { id: 'update', label: 'state changes', note: 'same element is reused', tone: 'kraft' },
        { id: 'unmount', label: 'v-if false / unmount', note: 'input.value = null', tone: 'red' },
      ],
      edges: [
        { from: 'setup', to: 'render' },
        { from: 'render', to: 'mount' },
        { from: 'mount', to: 'mounted' },
        { from: 'mounted', to: 'update', label: 'later' },
        { from: 'update', to: 'unmount', label: 'element removed' },
      ],
      steps: [
        { focus: ['setup'], text: '`<script setup>` runs first. `useTemplateRef(\'composer\')` creates an empty box — there is **no element yet**, so its value is `null`.' },
        { focus: ['render'], edges: ['setup->render'], text: 'Vue renders the template into virtual nodes. The `<input>` vnode carries a note: "when you create me, put me in the `composer` ref".' },
        { focus: ['mount'], edges: ['render->mount'], text: 'Vue creates the real `<input>`, inserts it into the page, and **then** writes it into the ref.' },
        { focus: ['mounted'], edges: ['mount->mounted'], text: '`onMounted` runs after that, so it is the first safe place to call DOM methods like `input.value.focus()`.' },
        { focus: ['update'], edges: ['mounted->update'], text: 'When state changes, Vue patches the existing element. The ref keeps pointing at the same element — no need to look it up again.' },
        { focus: ['unmount'], edges: ['update->unmount'], text: 'If the element is removed (`v-if` turns false, or the component unmounts), Vue sets the ref back to `null`. Code that runs later must not assume it still exists.' },
      ],
      layout: 'row',
    },
    caption: 'A template ref is only non-null while its element is actually in the page.',
    alt: 'A six-step left-to-right diagram: setup runs with the ref equal to null; render creates a vnode tagged with the ref name; the element is inserted and Vue fills the ref; onMounted is the first safe place to use it; later updates reuse the same element; when the element is removed the ref becomes null again.',
  },

  animation: {
    type: 'lifecycle',
    props: { withChild: true },
    title: 'Why refs are ready in onMounted',
    caption: 'Mount the parent and child and watch the order: the child finishes mounting **before** the parent\'s `onMounted` runs. That is why a parent can safely call a child\'s exposed method (or use any element ref) inside its own `onMounted`.',
    alt: 'An interactive lifecycle timeline with a parent and a child component. Mounting shows parent setup, parent beforeMount, child setup, child beforeMount, child mounted, then parent mounted — template refs are filled before mounted hooks run.',
  },

  syntax: [
    `
#### 1. An element ref

Put \`ref="someKey"\` on an element, and create a matching ref in \`<script setup>\`. There are two ways to create it:
`,
    {
      code: `<script setup>
import { ref, useTemplateRef, onMounted } from 'vue'

// Vue 3.5+: the string links them, the variable name is up to you
const searchBox = useTemplateRef('search')

// Any Vue 3 version: the variable name MUST equal the ref attribute
const search = ref(null)

onMounted(() => {
  searchBox.value.focus()
})
</script>

<template>
  <input ref="search" />
</template>`,
      lang: 'vue',
      title: 'two ways to declare an element ref',
    },
    {
      callout: 'version',
      title: 'useTemplateRef() needs Vue 3.5+',
      text: 'Before 3.5, use `const search = ref(null)` with the **same name** as the `ref` attribute. Both work at runtime; `useTemplateRef()` decouples the names, works nicely inside composables, and gets better type inference in IDEs.',
    },
    `
#### 2. Refs inside \`v-for\`

When \`ref\` sits on an element inside \`v-for\`, the ref holds an **array** of elements. The array is filled after mount — and Vue's docs say plainly that it **does not guarantee the same order as your source array**.
`,
    {
      code: `<script setup>
import { ref, useTemplateRef, onMounted } from 'vue'
const todos = ref(['Buy milk', 'Walk dog', 'Read'])
const items = useTemplateRef('items')   // or: const items = ref([])

onMounted(() => console.log(items.value.length)) // 3
</script>

<template>
  <li v-for="t in todos" :key="t" ref="items">{{ t }}</li>
</template>`,
      lang: 'vue',
      title: 'an array of elements',
    },
    `
#### 3. Function refs

Bind \`:ref\` (note the colon) to a function. Vue calls it with the element after mounting — and may call it again when the owning component re-renders — and calls it with **\`null\`** when the element is removed. This is the tool for "one element per item, looked up by id":
`,
    {
      code: `<script setup>
const rowEls = new Map()   // id -> element; plain Map, no reactivity needed

function setRow(id, el) {
  if (el) rowEls.set(id, el)
  else rowEls.delete(id)   // element was removed
}

function focusRow(id) {
  rowEls.get(id)?.focus()
}
</script>

<template>
  <input
    v-for="row in rows"
    :key="row.id"
    :ref="(el) => setRow(row.id, el)"
  />
</template>`,
      lang: 'vue',
      title: 'function refs keyed by id',
    },
    `
#### 4. Component refs and \`defineExpose()\`

A \`ref\` on a **component** gives you its instance. A \`<script setup>\` component is **closed by default**: the parent sees nothing unless the child lists it in \`defineExpose()\`. Exposed refs are unwrapped when you read them from the instance (no \`.value\`).
`,
    {
      code: `<!-- VideoPlayer.vue -->
<script setup>
import { ref, useTemplateRef } from 'vue'
const video = useTemplateRef('video')
const isPlaying = ref(false)

function play() { video.value.play(); isPlaying.value = true }
function pause() { video.value.pause(); isPlaying.value = false }

defineExpose({ play, pause, isPlaying })  // the public "menu"
</script>

<!-- Parent.vue -->
<script setup>
import { useTemplateRef } from 'vue'
import VideoPlayer from './VideoPlayer.vue'
const player = useTemplateRef('player')
// player.value.play(), player.value.isPlaying (unwrapped: true/false)
</script>

<template>
  <VideoPlayer ref="player" />
</template>`,
      lang: 'vue',
      title: 'a component with a public interface',
      static: true,
    },
    `
**The rules:**

1. A template ref is \`null\` until the element is mounted — use it in \`onMounted\`, event handlers, or after \`await nextTick()\`.
2. It goes back to \`null\` when the element is removed. Guard code that can run later.
3. After changing state that **adds** an element (\`v-if\`), \`await nextTick()\` before touching it — DOM updates are batched. See [Batched updates & nextTick()](lesson:next-tick).
4. \`defineExpose()\` must be called **before any \`await\`** in \`<script setup>\`.
5. In the Options API, all refs live on \`this.$refs\`, and component refs give the full instance unless the child uses the \`expose\` option.
`,
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: chatApp,
    intro: 'A tiny chat window. The parent owns the messages; the child `ChatLog` owns the scrolling box and exposes one method. Step through the parent.',
    steps: [
      { lines: [2], text: 'We import `useTemplateRef` (Vue 3.5+) and `nextTick`. No `document.querySelector` anywhere.' },
      { lines: [12, 13], text: '`useTemplateRef(\'composer\')` creates a ref that Vue will fill with the element whose `ref` attribute is `"composer"`. Right now — during setup — it is `null`.' },
      { lines: [14, 15], text: 'The same helper works for components. `chatLog` will hold ChatLog\'s **public instance**: only what ChatLog passed to `defineExpose()`.' },
      { lines: [17, 21], text: 'Sending is plain state work: push a message and clear the draft. Vue will add the new `<li>` — but not instantly. Updates are batched until the next tick.' },
      { lines: [22, 23], text: '`await nextTick()` waits until the new message is really in the DOM, so the box\'s height is correct. Then we call the exposed `scrollToBottom()` — an imperative DOM action the template cannot express.' },
      { lines: [28], text: '`ref="log"` on a component: Vue writes ChatLog\'s public instance into `chatLog` once it is mounted.' },
      { lines: [30, 35], text: '`ref="composer"` links the real `<input>` to `input`. Notice `v-model` still owns the **value** — the ref is only for things state cannot do, like focusing.' },
    ],
  },

  playground: {
    title: 'Chat composer',
    objective: 'Use template refs for the jobs only the real DOM can do — focusing, refocusing after changes, and calling a child\'s exposed method.',
    files: { 'App.vue': chatApp, 'ChatLog.vue': chatLog },
    expected: 'A chat log with two messages and a message box. Type a message and press **Send**: it appears at the bottom and the log scrolls down to it (send a few to see the scrolling). The message box is **not** focused when the app loads — that is your first job.',
    experiments: [
      {
        id: 'autofocus',
        task: 'Make the message box **focused as soon as the app appears**, so the user can start typing immediately.',
        hint: 'Import `onMounted` and call `input.value.focus()` inside it. Why not call it directly in `<script setup>`? Try it and read the error.',
        tests: [{ name: 'the message box is focused after mount', code: `expect(document.activeElement).toBe(find('.composer'))` }],
        explain: 'Setup runs before the template is turned into elements, so the ref is still `null` there. `onMounted` runs after Vue has inserted the elements and filled the refs.',
      },
      {
        id: 'clear-refocus',
        task: 'Add a **Clear** button (`class="clear"`) that empties the draft **and puts the cursor back** in the message box.',
        hint: 'Write a `clear()` function: `draft.value = \'\'` then `input.value.focus()`. Give the button `type="button"` so clicking it does not submit the form.',
        tests: [
          {
            name: 'Clear empties the box and refocuses it',
            code: `await type('.composer', 'tpyo')
find('.composer').blur()
const btn = find('.clear')
expect(btn).toBeTruthy()
await click(btn)
expect(find('.composer').value).toBe('')
expect(document.activeElement).toBe(find('.composer'))`,
          },
        ],
        explain: 'Two jobs, two tools: the **value** is state (`draft`), so you change it through state. **Focus** has no state equivalent, so you use the ref. Clicking a button moves focus to the button — the ref lets you give it back.',
      },
      {
        id: 'offline-toggle',
        task: 'Add a button `class="toggle-online"` **outside the form** that hides and shows the whole composer form with `v-if`. When the form **comes back**, the message box should be focused.',
        hint: 'Use `const online = ref(true)` and `v-if="online"` on the form. In the toggle handler, after setting `online.value = true`, the input does not exist yet — `await nextTick()` first, then focus.',
        tests: [
          {
            name: 'the form hides, comes back, and the box is focused',
            code: `const toggle = find('.toggle-online')
expect(toggle).toBeTruthy()
await click(toggle)
expect(exists('.composer')).toBe(false)
await click(toggle)
expect(exists('.composer')).toBe(true)
expect(document.activeElement).toBe(find('.composer'))`,
          },
        ],
        explain: 'When `v-if` removed the input, Vue set the ref back to `null`. Setting `online` to `true` only *schedules* a re-render; `nextTick()` waits for it. Only then does the new `<input>` exist — and the ref points at that new element automatically.',
      },
      {
        id: 'closed-by-default',
        task: 'In App.vue, add `onMounted(() => console.log(chatLog.value))` and look at the console. Then **delete** the `defineExpose(...)` line in ChatLog.vue, run again, and press Send.',
        hint: 'With `defineExpose` you should see only `scrollToBottom`. Without it, the parent sees an empty object — and Send throws because `scrollToBottom` is not a function.',
        explain: '`<script setup>` components are private by default. The parent gets only what the child deliberately exposes — so the child is free to rename or rewrite anything else without breaking its parents. Put `defineExpose` back when you are done.',
      },
    ],
  },

  internals: {
    beginner: `
When Vue mounts your template, it creates each element, inserts it into the page, and then looks at its \`ref\` attribute: "this one belongs in the \`composer\` slot of this component". It writes the element there. When the element is later removed, Vue writes \`null\` into the same slot. Your code reads whatever is currently in the slot — that is all a template ref is.
`,
    technical: [
      `
The template compiler keeps the \`ref\` on the element's **vnode** (a vnode, or *virtual node*, is the lightweight JavaScript object Vue builds to describe an element before creating it). Elements that have a ref are marked so Vue keeps patching them even when nothing else about them is dynamic.

After the renderer creates or patches a vnode, it runs an internal \`setRef()\` step:

- for a **string** ref, it writes the element into the instance's \`refs\` object (what the Options API exposes as \`this.$refs\`) and, if \`<script setup>\` has a ref with that name, into that ref;
- for a **ref object**, it sets \`.value\`;
- for a **function**, it calls the function with the element;
- inside \`v-for\`, it collects the elements into an array instead.

Non-null values are written in the **post-render queue** (after the DOM is updated, before \`mounted\`/\`updated\` hooks run). \`null\` is written immediately during unmount.
`,
      {
        code: `// A simplified model of useTemplateRef() — not Vue's real source
function useTemplateRef(key) {
  const r = shallowRef(null)
  const instance = getCurrentInstance()
  // the renderer writes instance.refs[key] = el; route that into our ref
  Object.defineProperty(instance.refs, key, {
    get: () => r.value,
    set: (el) => { r.value = el },
  })
  return r // Vue returns it read-only in development builds
}`,
        lang: 'js',
        title: 'mental model: useTemplateRef()',
      },
      `
Two consequences worth knowing:

- The ref holds the element in a **shallow** ref. Vue does not wrap DOM nodes in deep reactive proxies — that would be slow and break identity checks.
- A **component** ref receives the component's *public instance*. For \`<script setup>\` that is a proxy over the object you passed to \`defineExpose()\` (refs auto-unwrapped). Built-in public properties such as \`$el\` remain reachable, but relying on them couples the parent to the child's internal markup.
`,
    ],
    production: `
- **Prefer state over DOM.** If you could express it with a binding (\`:class\`, \`v-show\`, \`{{ }}\`), do that. Manual DOM edits on elements Vue manages are overwritten on the next render.
- **Wrap third-party DOM libraries in a composable.** Create the instance in \`onMounted\` with the element ref, update it with \`watch\`, destroy it in \`onBeforeUnmount\`. Keep the library instance in a plain variable or \`shallowRef\` — never in deep \`ref()\`/\`reactive()\`, which would proxy its internals.
- **Keep exposed surfaces tiny.** Expose verbs (\`focus\`, \`open\`, \`reset\`), not internal state. Data should still flow through props and events ([Component communication patterns](lesson:component-communication)).
- **Guard late callbacks.** Timers, \`await\`ed requests and observers can fire after the element is gone. Check for \`null\` and clean up in \`onUnmounted\`.
- **Server-side rendering:** there is no DOM on the server, refs stay \`null\` and \`onMounted\` never runs there — which is exactly why DOM work belongs in \`onMounted\`.
`,
  },

  mistakes: [
    {
      title: 'Using the ref during setup',
      wrong: { code: `const input = useTemplateRef('search')\ninput.value.focus() // TypeError: Cannot read properties of null`, lang: 'js' },
      right: { code: `const input = useTemplateRef('search')\nonMounted(() => input.value.focus())`, lang: 'js' },
      explanation: 'Setup runs before any element exists. Use the ref in `onMounted`, in event handlers (which only run after mount), or after `await nextTick()`.',
    },
    {
      title: 'Name mismatch with the classic `ref(null)` style',
      wrong: { code: `<script setup>\nconst inputEl = ref(null)   // never filled!\n</script>\n<template><input ref="input" /></template>`, lang: 'vue' },
      right: { code: `<script setup>\nconst input = ref(null)      // same name as the attribute\n// or (3.5+): const inputEl = useTemplateRef('input')\n</script>\n<template><input ref="input" /></template>`, lang: 'vue' },
      explanation: 'With `ref(null)`, Vue links the attribute to the binding **by name**. A different name means the ref stays `null` forever, silently. `useTemplateRef(\'input\')` makes the link explicit.',
    },
    {
      title: 'Focusing an element that `v-if` has only just enabled',
      wrong: { code: `function openSearch() {\n  showSearch.value = true\n  searchInput.value.focus() // still null — not rendered yet\n}`, lang: 'js' },
      right: { code: `async function openSearch() {\n  showSearch.value = true\n  await nextTick()\n  searchInput.value.focus()\n}`, lang: 'js' },
      explanation: 'Changing state schedules a re-render; it does not run it synchronously. `nextTick()` resolves after the DOM update, when the new element and its ref exist.',
    },
    {
      title: 'Editing DOM that Vue owns',
      wrong: { code: `onMounted(() => {\n  title.value.textContent = 'Cart (' + count.value + ')'\n  title.value.classList.add('highlight')\n})`, lang: 'js' },
      right: { code: `<h2 :class="{ highlight: isNew }">Cart ({{ count }})</h2>`, lang: 'vue' },
      explanation: 'Vue does not know about manual edits, so the next render can overwrite them — or they drift out of sync with state. Text, classes, styles and attributes belong in bindings; refs are for actions with no declarative equivalent.',
    },
    {
      title: 'Trusting the order of a `v-for` ref array',
      wrong: { code: `// after sorting todos, items.value[i] may not be todos[i]\nitems.value[index].focus()`, lang: 'js' },
      right: { code: `// keep elements by id with a function ref\n:ref="(el) => setRow(todo.id, el)"\n// …\nrowEls.get(todo.id).focus()`, lang: 'js' },
      explanation: 'The docs explicitly say the ref array does not guarantee source order. Look elements up by a stable key instead of an index.',
    },
  ],

  debugging: [
    {
      symptom: '`TypeError: Cannot read properties of null (reading \'focus\')`',
      cause: 'The ref is used before the element exists (during setup, or right after setting a `v-if` condition), or after it was removed.',
      fix: 'Move the call into `onMounted`, or `await nextTick()` after the state change. For code that can run late (timers, async callbacks), guard with `if (el.value)`.',
    },
    {
      symptom: '`childRef.value.open is not a function` — or the child ref looks like an empty object.',
      cause: 'The child uses `<script setup>` and does not expose `open`, or calls `defineExpose()` after an `await`.',
      fix: 'Add `defineExpose({ open })` in the child, before any `await`. Log `childRef.value` in the parent to see exactly what is exposed.',
    },
    {
      symptom: 'The ref is still `null` inside `onMounted`.',
      cause: 'With `ref(null)`, the variable name does not match the `ref` attribute — or the element is inside a `v-if` that was false at mount time.',
      fix: 'Match the names (or use `useTemplateRef(\'key\')`). For conditional elements, react when they appear: `watch(el, (node) => { if (node) … })`.',
    },
    {
      symptom: 'Changes made through the ref disappear after the next click.',
      cause: 'You edited text, classes or attributes that a binding also controls; Vue re-rendered and restored what the template says.',
      fix: 'Drive that part of the element from state with a binding. Keep refs for focus, scroll, measurement, media and library integration.',
    },
    {
      symptom: 'After sorting or filtering a list, the wrong row gets focused.',
      cause: 'The code indexes into a `v-for` ref array, whose order is not guaranteed to match the data.',
      fix: 'Store elements in a `Map` keyed by a stable id using a function ref, and look them up by id.',
    },
  ],

  bestPractices: [
    'Reach for a template ref only when no binding can express what you need (focus, scroll, measure, media, third-party libraries).',
    'Use `useTemplateRef()` in Vue 3.5+ code; use `ref(null)` with a matching name in older code — never `document.querySelector` inside a component.',
    'Do DOM work in `onMounted`, event handlers or after `await nextTick()`; guard anything that can run after unmount.',
    'Expose a small, verb-based API from children (`focus`, `reset`, `scrollToBottom`) and keep data flowing through props and events.',
    'For lists, use function refs into a `Map` keyed by id instead of relying on array order.',
    'Clean up anything you attached to an element (observers, library instances, listeners) in `onBeforeUnmount`/`onUnmounted`.',
  ],

  useCases: [
    'Autofocus the first field of a form, or the search box when a dialog opens.',
    'Focus the first invalid field after a failed submit — an accessibility win for keyboard and screen-reader users.',
    'Scroll a chat or log panel to the newest entry.',
    'Measure an element to position a tooltip or popover.',
    'Control `<video>`/`<audio>` playback, or call `showModal()` on a native `<dialog>`.',
    'Give a chart, map or rich-text editor library the element it should draw into.',
    'A reusable input component that exposes `focus()` so parents can manage focus without reaching into its markup.',
  ],

  whenToUse: {
    use: [
      'The browser API is an action on a specific element (`focus`, `select`, `scrollIntoView`, `play`, `showModal`).',
      'You need measurements of the rendered element.',
      'A non-Vue library needs a real DOM node to work with.',
      'A parent needs to trigger an imperative action inside a child (via `defineExpose`).',
    ],
    avoid: [
      'Changing text, classes, styles or attributes — use bindings.',
      'Reading form values — use `v-model`.',
      'Passing data from child to parent — use emits; from parent to child — use props.',
      'Reaching into a child\'s internal elements — ask the child to expose a method or accept a prop instead.',
    ],
  },

  comparison: {
    title: 'Ways to reach an element',
    headers: ['', '`ref="x"` + `ref(null)`', '`useTemplateRef(\'x\')`', 'function `:ref`', '`document.querySelector`'],
    rows: [
      ['Vue version', '3.0+', '**3.5+**', '3.0+', 'n/a (browser API)'],
      ['Scoped to this component instance?', 'yes', 'yes', 'yes', '**no** — searches the whole page'],
      ['Variable name must match the attribute?', 'yes', 'no — the string key links them', 'no — you decide where to store it', 'n/a'],
      ['Follows v-if / unmount?', 'yes (becomes `null`)', 'yes (becomes `null`)', 'yes (called with `null`)', 'no — a stale snapshot'],
      ['Best for', 'existing codebases', 'new code and composables', 'dynamic lists, lookup by id', 'non-Vue pages only'],
    ],
    note: 'For reusable behaviour that touches the element (autofocus, click-outside), also consider a [custom directive](lesson:custom-directives).',
  },

  quiz: [
    {
      id: 'dom-access-refs-q1',
      type: 'mcq',
      prompt: 'In `<script setup>`, you write `const box = useTemplateRef(\'box\')` and put `ref="box"` on a `<div>`. When does `box.value` first hold the element?',
      options: [
        { text: 'Immediately, on the line where it is declared', why: 'Setup runs before the template is turned into elements — nothing exists yet, so it is `null`.' },
        { text: 'Inside `onBeforeMount`', why: 'At `beforeMount` the DOM elements have not been created and inserted yet.' },
        { text: 'Inside `onMounted` (and from then on, while the element exists)' },
        { text: 'Only after the first user interaction', why: 'Refs have nothing to do with interaction; Vue fills them during mounting.' },
      ],
      answer: 2,
      explanation: 'Vue inserts the element, writes it into the ref, then runs `mounted` hooks. It stays set until the element is removed.',
    },
    {
      id: 'dom-access-refs-q2',
      type: 'output',
      prompt: 'What does the console show when this component mounts?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, onMounted } from 'vue'
const field = ref(null)
console.log('setup:', field.value)
onMounted(() => console.log('mounted:', field.value.tagName))
</script>

<template>
  <input ref="field" />
</template>`,
      },
      options: [
        'setup: null  →  mounted: INPUT',
        { text: 'setup: INPUT  →  mounted: INPUT', why: 'During setup the template has not rendered — the ref is still its initial `null`.' },
        { text: 'setup: undefined  →  mounted: INPUT', why: 'We passed `null` to `ref()`, so the value is `null`, not `undefined`.' },
        { text: 'setup: null  →  a TypeError in onMounted', why: 'The names match (`field`), so Vue fills the ref before `onMounted` runs.' },
      ],
      answer: 0,
      explanation: 'Setup logs the initial value (`null`). By the time `onMounted` runs, Vue has written the real `<input>` into the ref, so `tagName` is `"INPUT"`.',
    },
    {
      id: 'dom-access-refs-q3',
      type: 'bug',
      prompt: 'Clicking **Edit** throws `Cannot read properties of null`. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const editing = ref(false)
const field = ref(null)

function startEditing() {
  editing.value = true
  field.value.focus()
}
</script>

<template>
  <button @click="startEditing">Edit</button>
  <input v-if="editing" ref="field" />
</template>`,
      },
      answerLine: 8,
      explanation: 'Setting `editing` only schedules the re-render. The `<input>` does not exist yet, so `field.value` is still `null`. Make the function `async` and `await nextTick()` before focusing.',
    },
    {
      id: 'dom-access-refs-q4',
      type: 'fill',
      prompt: 'Fill the blanks: the child makes `open()` public, and the parent (Vue 3.5+) gets the child instance by its ref key.',
      code: {
        lang: 'js',
        code: `// ConfirmDialog.vue — <script setup>
function open() { /* … */ }
___({ open })

// Parent.vue — <script setup>
const dialog = ___('dialog')
function askFirst() {
  dialog.value.open()
}`,
      },
      answer: [['defineExpose'], ['useTemplateRef']],
      explanation: '`defineExpose()` is the compiler macro that publishes members of a `<script setup>` component. `useTemplateRef(\'dialog\')` links to `<ConfirmDialog ref="dialog" />`.',
    },
    {
      id: 'dom-access-refs-q5',
      type: 'mcq',
      prompt: 'Which of these are good reasons to use a template ref? **Select all that apply.**',
      options: [
        { text: 'Focus an input when a dialog opens' },
        { text: 'Change a heading\'s text when a count changes', why: 'That is exactly what interpolation (`{{ count }}`) does — and Vue would overwrite a manual edit anyway.' },
        { text: 'Hand a `<canvas>` to a charting library' },
        { text: 'Add an `active` class to the selected tab', why: 'Use a class binding: `:class="{ active: tab === current }"`.' },
        { text: 'Measure an element to position a tooltip next to it' },
      ],
      answer: [0, 2, 4],
      explanation: 'Refs are for imperative actions and measurements with no declarative equivalent. Anything a binding can express should stay a binding.',
    },
    {
      id: 'dom-access-refs-q6',
      type: 'mcq',
      prompt: 'A parent has `<ProductCard ref="card" />`. `ProductCard` uses `<script setup>` with `const stock = ref(3)` and no `defineExpose`. What is `card.value.stock` in the parent\'s `onMounted`?',
      options: [
        { text: '`3`', why: 'That would be true for an Options API component (full instance), but `<script setup>` components are closed by default.' },
        { text: 'A ref object with `.value === 3`', why: 'Even exposed refs are unwrapped on the instance — and this one is not exposed at all.' },
        { text: '`undefined`' },
        { text: 'It throws because `card.value` is `null`', why: 'The child is mounted before the parent\'s `onMounted`, so `card.value` is the (closed) instance.' },
      ],
      answer: 2,
      explanation: 'Nothing was exposed, so the public instance has no `stock`. Add `defineExpose({ stock })` — and then reading it gives `3`, unwrapped.',
    },
    {
      id: 'dom-access-refs-q7',
      type: 'short',
      prompt: 'Why is `document.querySelector(\'.search\')` inside a component worse than a template ref? Give at least two reasons.',
      answer: 'It searches the whole page, so with two instances of the component it can return the other instance\'s element. It returns null if called before this component has rendered, and it keeps a stale reference after a v-if removes the element. A template ref is scoped to this instance, is filled by Vue after mount, and is reset to null on unmount.',
    },
  ],

  exercises: [
    {
      id: 'first-empty-field',
      title: 'Focus the first empty field on submit',
      difficulty: 'intermediate',
      prompt: `
A checkout form should help keyboard users: when they submit with missing data, the cursor jumps to the **first empty field**.

The starter renders the inputs with \`v-for\` from a \`fields\` array. Each input already has \`class="field"\` and \`data-field="<id>"\` (\`name\`, \`email\`, \`address\`). The form has \`class="checkout"\`.

When the form is submitted:

- If any field is empty (ignore surrounding spaces), **focus the first empty one** in the order of the \`fields\` array, show \`<p class="error">Please fill in {label}.</p>\` (for example \`Please fill in Email.\`), and do **not** show the success message.
- If every field is filled, remove the error and show \`<p class="success">Order placed!</p>\`.

Look elements up by field id — don't rely on the order of a \`v-for\` ref array.
`,
      files: {
        'App.vue': `<script setup>
import { ref, reactive } from 'vue'

const fields = [
  { id: 'name', label: 'Full name' },
  { id: 'email', label: 'Email' },
  { id: 'address', label: 'Address' },
]
const values = reactive({ name: '', email: '', address: '' })
const error = ref('')
const done = ref(false)

// TODO: keep each input element, looked up by field id

function submit() {
  // TODO: find the first empty field, focus its input and set the error
  done.value = true
}
</script>

<template>
  <form class="checkout" @submit.prevent="submit">
    <label v-for="field in fields" :key="field.id">
      {{ field.label }}
      <input v-model="values[field.id]" class="field" :data-field="field.id" />
    </label>
    <button class="pay">Pay</button>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="done" class="success">Order placed!</p>
  </form>
</template>`,
      },
      hints: [
        'You need a way to go from a field id (`\'email\'`) to its `<input>` element. A plain object or `Map` works — element handles do not need to be reactive.',
        'Use a function ref on the input: `:ref="(el) => setInput(field.id, el)"`. In `setInput`, store the element when `el` is set and delete it when `el` is `null`.',
        'In `submit()`: `const firstEmpty = fields.find((f) => !values[f.id].trim())`. If found: set `error.value`, set `done.value = false`, call `inputs[firstEmpty.id].focus()` and return. Otherwise clear the error and set `done.value = true`.',
      ],
      solution: {
        explanation: 'The function ref builds an id → element lookup that stays correct even if the list is reordered or filtered, and cleans itself up when an input is removed (Vue calls the function with `null`). The **decision** (which field is empty) comes from state; the ref is only used for the one thing state cannot do — moving focus.',
        files: {
          'App.vue': `<script setup>
import { ref, reactive } from 'vue'

const fields = [
  { id: 'name', label: 'Full name' },
  { id: 'email', label: 'Email' },
  { id: 'address', label: 'Address' },
]
const values = reactive({ name: '', email: '', address: '' })
const error = ref('')
const done = ref(false)

// element handles don't need reactivity: a plain object is enough
const inputs = {}

function setInput(id, el) {
  if (el) inputs[id] = el
  else delete inputs[id] // Vue passes null when the input is removed
}

function submit() {
  const firstEmpty = fields.find((f) => !values[f.id].trim())
  if (firstEmpty) {
    error.value = \`Please fill in \${firstEmpty.label}.\`
    done.value = false
    inputs[firstEmpty.id].focus()
    return
  }
  error.value = ''
  done.value = true
}
</script>

<template>
  <form class="checkout" @submit.prevent="submit">
    <label v-for="field in fields" :key="field.id">
      {{ field.label }}
      <input
        :ref="(el) => setInput(field.id, el)"
        v-model="values[field.id]"
        class="field"
        :data-field="field.id"
      />
    </label>
    <button class="pay">Pay</button>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="done" class="success">Order placed!</p>
  </form>
</template>`,
        },
      },
      tests: [
        {
          name: 'an empty submit focuses the name field',
          code: `await submit('.checkout')
expect(document.activeElement).toBe(find('[data-field="name"]'))
expect(text('.error')).toBe('Please fill in Full name.')
expect(exists('.success')).toBe(false)`,
        },
        {
          name: 'focuses the first EMPTY field, not always the first',
          code: `await type('[data-field="name"]', 'Ada Lovelace')
await submit('.checkout')
expect(document.activeElement).toBe(find('[data-field="email"]'))
expect(text('.error')).toBe('Please fill in Email.')`,
        },
        {
          name: 'whitespace-only counts as empty',
          code: `await type('[data-field="name"]', 'Ada')
await type('[data-field="email"]', 'ada@example.com')
await type('[data-field="address"]', '   ')
await submit('.checkout')
expect(document.activeElement).toBe(find('[data-field="address"]'))
expect(exists('.success')).toBe(false)`,
        },
        {
          name: 'a complete form shows success and no error',
          code: `await submit('.checkout')
await type('[data-field="name"]', 'Ada')
await type('[data-field="email"]', 'ada@example.com')
await type('[data-field="address"]', '12 Analytical St')
await submit('.checkout')
expect(text('.success')).toBe('Order placed!')
expect(exists('.error')).toBe(false)`,
        },
      ],
    },
    {
      id: 'expose-focus',
      title: 'A search field with a public focus() and clear()',
      difficulty: 'intermediate',
      prompt: `
Build a reusable \`SearchField.vue\` that parents can control **without touching its markup**.

**SearchField.vue**
- Renders \`<input class="search-input">\` bound with \`v-model\` to its **own** internal \`query\` ref.
- Exposes exactly two methods with \`defineExpose\`: \`focus()\` (focuses the input) and \`clear()\` (empties \`query\` and focuses the input).
- Does **not** expose \`query\` itself.

**App.vue**
- Keeps the component ref in a variable named **\`search\`**.
- \`<button class="focus-search">\` calls the child's \`focus()\`.
- \`<button class="reset">\` calls the child's \`clear()\`.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import SearchField from './SearchField.vue'

const search = ref(null)
</script>

<template>
  <SearchField ref="search" />
  <button class="focus-search">Focus search</button>
  <button class="reset">Reset</button>
</template>`,
        'SearchField.vue': `<script setup>
import { ref } from 'vue'

const query = ref('')
</script>

<template>
  <input v-model="query" class="search-input" placeholder="Search products…" />
</template>`,
      },
      hints: [
        'Inside SearchField, you need your own element ref for the `<input>` (for example `useTemplateRef(\'input\')`).',
        'Write `focus()` and `clear()` functions in SearchField, then call `defineExpose({ focus, clear })`.',
        'In App.vue: `<button class="focus-search" @click="search.focus()">` — `search` is unwrapped in the template, and it holds the exposed instance.',
      ],
      solution: {
        explanation: 'The child owns its markup and state; the parent only sees two verbs. If SearchField later swaps the `<input>` for something fancier, no parent breaks — that is the point of keeping `<script setup>` components closed by default and exposing deliberately.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import SearchField from './SearchField.vue'

const search = ref(null)
</script>

<template>
  <SearchField ref="search" />
  <button class="focus-search" @click="search.focus()">Focus search</button>
  <button class="reset" @click="search.clear()">Reset</button>
</template>`,
          'SearchField.vue': `<script setup>
import { ref, useTemplateRef } from 'vue'

const query = ref('')
const input = useTemplateRef('input')

function focus() {
  input.value.focus()
}

function clear() {
  query.value = ''
  focus()
}

defineExpose({ focus, clear })
</script>

<template>
  <input
    ref="input"
    v-model="query"
    class="search-input"
    placeholder="Search products…"
  />
</template>`,
        },
      },
      tests: [
        {
          name: 'Focus search focuses the inner input',
          code: `await click('.focus-search')
expect(document.activeElement).toBe(find('.search-input'))`,
        },
        {
          name: 'Reset clears the text and focuses the input',
          code: `await type('.search-input', 'headphones')
find('.search-input').blur()
await click('.reset')
expect(find('.search-input').value).toBe('')
expect(document.activeElement).toBe(find('.search-input'))`,
        },
        {
          name: 'exposes focus and clear, but not query',
          code: `expect(typeof state.search.focus).toBe('function')
expect(typeof state.search.clear).toBe('function')
expect(state.search.query).toBeUndefined()`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'dom-access-refs-null-timing',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why is a template ref `null` inside `<script setup>`, and where is it safe to use it?',
      answer: '`<script setup>` runs before the template is rendered, so the element does not exist yet. Vue fills the ref after inserting the element, just before `mounted` hooks run. Use it in `onMounted`, in event handlers, or after `await nextTick()`. It becomes `null` again when the element is removed.',
      explanation: 'Setup prepares data; rendering creates elements from that data. The ref can only point at an element once the element exists.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { useTemplateRef, onMounted } from 'vue'
const input = useTemplateRef('name')
// input.value === null here
onMounted(() => input.value.focus()) // safe
</script>

<template>
  <input ref="name" />
</template>`,
      },
      whyAsked: 'It checks that you understand the order setup → render → mount, which underlies a huge number of "it is null" bugs.',
      mistakes: [
        'Saying refs are available in `onBeforeMount`.',
        'Forgetting that refs become `null` again on unmount or when `v-if` turns false.',
        'Suggesting `setTimeout` as the fix instead of `onMounted`/`nextTick`.',
      ],
      followUps: ['How do you react when a conditionally rendered element appears later?', 'Why does a parent\'s `onMounted` see its child components already mounted?'],
      modelAnswer: 'Setup runs first and only prepares state; the template hasn\'t produced any elements yet, so the ref is `null`. During mounting Vue creates and inserts the element, writes it into the ref, and then calls `mounted` hooks. So `onMounted` is the first safe place, along with event handlers that can only fire after mount. If the element is under a `v-if`, I wait for `nextTick()` after flipping the condition — or watch the ref. And I remember it goes back to `null` on unmount.',
    },
    {
      id: 'dom-access-refs-nexttick-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This "open search" button throws `Cannot read properties of null (reading \'focus\')`. Why, and how do you fix it?',
      code: {
        lang: 'js',
        code: `const showSearch = ref(false)
const searchInput = useTemplateRef('search')

function openSearch() {
  showSearch.value = true
  searchInput.value.focus()
}`,
      },
      answer: 'Setting `showSearch` does not render immediately — Vue batches DOM updates until the next tick. At the moment `focus()` is called, the `v-if` input has not been created, so the ref is `null`. Make the function `async` and `await nextTick()` before focusing (or focus from the child\'s own `onMounted`, or a `v-focus` directive).',
      explanation: 'Reactivity is synchronous, rendering is asynchronous. The ref is filled during the render that happens after your function returns.',
      whyAsked: 'It is one of the most common real bugs with refs and reveals whether you understand Vue\'s async update queue.',
      mistakes: ['Wrapping it in `setTimeout(…, 100)`.', 'Switching to `v-show` without understanding why that "fixes" it (the element always exists).', 'Blaming the ref name.'],
      followUps: ['What exactly does `nextTick()` wait for?', 'When would `v-show` actually be the better choice here?', 'How would a custom `v-focus` directive solve it?'],
      modelAnswer: 'Vue batches DOM updates: changing `showSearch` queues a re-render that runs after the current code finishes. So when I call `focus()` on the next line, the input doesn\'t exist and the ref is still `null`. The fix is `await nextTick()` between the state change and the DOM access — `nextTick` resolves after the pending render flush. Alternatives are focusing in the input component\'s own `onMounted`, or a small `v-focus` directive, which both run exactly when the element is inserted.',
    },
    {
      id: 'dom-access-refs-closed-instance',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'A parent holds a template ref to a child. What can it access if the child uses `<script setup>` versus the Options API — and why is the default different?',
      answer: 'An Options API child gives the parent its full public instance (`data`, `methods`, `computed` and so on) unless it restricts it with the `expose` option. A `<script setup>` child is closed by default: the parent sees only what the child passes to `defineExpose()` (plus built-in `$` properties). The closed default protects encapsulation, so children can refactor internals without breaking parents.',
      explanation: 'An open instance invites parents to depend on every internal detail. A closed one forces an explicit, small public API.',
      options: [
        'Both expose everything the child declares',
        'Options API exposes the full instance; `<script setup>` exposes only `defineExpose` members',
        'Both expose nothing; you must use provide/inject',
        '`<script setup>` exposes everything; Options API exposes only `methods`',
      ],
      correctOption: 1,
      whyAsked: 'Tests knowledge of a real behavioural difference people hit when migrating to `<script setup>`, and whether they value encapsulation.',
      mistakes: ['Not knowing about `defineExpose` at all.', 'Exposing all state "to be safe".', 'Using refs to read child data that should be emitted.'],
      followUps: ['Why must `defineExpose` be called before any `await`?', 'Are exposed refs unwrapped when the parent reads them?', 'When would you prefer an emit over an exposed method?'],
      modelAnswer: 'With the Options API, a template ref gives you the whole component instance — every data property and method. `<script setup>` compiles differently and is closed by default; the parent only gets what the child lists in `defineExpose`, and exposed refs are unwrapped. I like the closed default: it makes the child\'s public surface explicit and small, usually just verbs like `focus` or `reset`. Data still flows through props and emits; refs are for imperative actions.',
    },
    {
      id: 'dom-access-refs-list-order',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A spreadsheet-like table renders editable cells with `v-for` and `ref="cells"`. After the user sorts the rows, arrow-key navigation focuses the wrong cell. What is going on and how would you redesign it?',
      answer: 'A `ref` inside `v-for` collects elements into an array, and Vue does not guarantee that array matches the source order — especially after reordering. Indexing `cells.value[i]` is therefore unreliable. Use a function ref that stores each element in a `Map` keyed by a stable id (row id + column), delete entries when called with `null`, and navigate by computing the next id from the data, then looking up its element.',
      explanation: 'The data (sorted rows) decides which cell is "next"; the element lookup should be by identity, not by position in a DOM-collected array.',
      code: {
        lang: 'vue',
        code: `<script setup>
const cellEls = new Map()
function setCell(key, el) {
  if (el) cellEls.set(key, el)
  else cellEls.delete(key)
}
function focusCell(rowId, col) {
  cellEls.get(rowId + ':' + col)?.focus()
}
</script>

<template>
  <tr v-for="row in sortedRows" :key="row.id">
    <td v-for="col in columns" :key="col">
      <input :ref="(el) => setCell(row.id + ':' + col, el)" />
    </td>
  </tr>
</template>`,
      },
      whyAsked: 'Probes whether you know a documented caveat of v-for refs and can design a robust alternative instead of patching symptoms.',
      mistakes: ['Re-sorting the ref array to match the data.', 'Querying the DOM with `querySelectorAll` and hoping order matches.', 'Forgetting to remove entries when cells unmount (memory leak / stale elements).'],
      followUps: ['Why doesn\'t the `Map` need to be reactive?', 'How often can a function ref be called?', 'How would you handle virtual scrolling where most rows are not mounted?'],
      modelAnswer: 'Refs collected inside `v-for` come back as an array whose order isn\'t guaranteed to match the data, so index-based lookups break after sorting. I\'d switch to a function ref that registers each input in a `Map` keyed by row id and column, and removes it when Vue calls the function with `null`. Navigation logic works on the sorted data to find the next key, then asks the map for the element. The map is plain, not reactive — nothing renders from it.',
    },
    {
      id: 'dom-access-refs-third-party',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You need to integrate a third-party charting library that draws into a `<canvas>` and has `new Chart(el, config)`, `chart.update(data)` and `chart.destroy()`. How do you wire it into a Vue component safely?',
      answer: 'Get the canvas with a template ref. Create the chart in `onMounted` (the element exists, and this never runs during SSR). Keep the instance in a plain variable or `shallowRef` — not deep `ref()`/`reactive()`, which would proxy the library\'s internals. `watch` the data prop and call `chart.update()`. Destroy the chart in `onBeforeUnmount`. Package it as a composable like `useChart(canvasRef, data)` so every chart component gets the lifecycle right.',
      explanation: 'Vue owns the canvas element; the library owns what is drawn inside it. The component\'s lifecycle hooks are the contract between the two.',
      code: {
        lang: 'js',
        code: `// useChart.js — library calls shown as static code
import { onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'

export function useChart(canvasRef, data) {
  const chart = shallowRef(null)
  onMounted(() => {
    chart.value = new Chart(canvasRef.value, { data: data.value })
  })
  watch(data, (next) => chart.value?.update(next), { deep: true })
  onBeforeUnmount(() => {
    chart.value?.destroy()
    chart.value = null
  })
  return chart
}`,
      },
      whyAsked: 'Real apps integrate maps, charts, editors and video players. This reveals lifecycle discipline, memory-leak awareness and knowledge of reactivity costs.',
      mistakes: ['Creating the chart in setup (no element yet).', 'Storing the library instance in `reactive()`.', 'Never calling `destroy()`, leaking listeners and memory on every route change.', 'Re-creating the chart on every data change instead of updating it.'],
      followUps: ['What changes if the component lives inside `<KeepAlive>`?', 'How would you handle the canvas being under a `v-if`?', 'Why `shallowRef` rather than `markRaw`, or vice versa?'],
      modelAnswer: 'I\'d take the canvas through a template ref and create the chart in `onMounted`, because that\'s the first moment the element exists and it never runs on the server. The instance goes in a `shallowRef` or a plain variable so Vue doesn\'t deeply proxy the library\'s objects. A `watch` on the data calls the library\'s update method instead of recreating it, and `onBeforeUnmount` destroys it so we don\'t leak. I\'d wrap all of that in a `useChart` composable so the lifecycle is written once. Inside `<KeepAlive>` I\'d also consider pausing work in `onDeactivated`.',
    },
    {
      id: 'dom-access-refs-usetemplateref',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does `useTemplateRef()` add over the classic `const el = ref(null)` pattern?',
      answer: '`useTemplateRef(\'key\')` (Vue 3.5+) links to the element by an explicit string key, so the variable name no longer has to match the `ref` attribute. That makes the link visible, lets composables accept a key or create the ref themselves, and gives IDEs better type inference. At runtime both hold the element in a ref that is `null` until mount and reset on unmount.',
      explanation: 'The old pattern relied on a naming coincidence between script and template; the new one makes the connection explicit.',
      whyAsked: 'Checks that you follow current Vue (3.5) and understand what really changed — and what did not.',
      mistakes: ['Claiming `useTemplateRef` is available in all Vue 3 versions.', 'Thinking it fills the ref earlier than `ref(null)` does.', 'Assigning to the returned ref yourself (it is meant to be filled by Vue).'],
      followUps: ['How would you write a `useAutofocus(key)` composable?', 'What does a `useTemplateRef` hold when the ref is inside `v-for`?'],
      modelAnswer: 'Before 3.5 you wrote `const input = ref(null)` and Vue matched it to `ref="input"` purely by name, which is easy to break silently. `useTemplateRef(\'input\')` makes the link explicit with a string key, so I can name the variable anything, and composables can work with template refs cleanly. Timing is identical — `null` until mount, `null` again on unmount — and in `v-for` it holds an array. It also gives better TypeScript inference in IDEs.',
    },
    {
      id: 'dom-access-refs-coding-inline-edit',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement inline editing of a playlist title: clicking `.edit` replaces the `<h2 class="title">` with an `<input class="title-input">` that is **focused with its text selected**. Pressing **Enter** saves the new title; pressing **Escape** cancels and restores the old one.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const title = ref('Road trip mix')
const editing = ref(false)
const draft = ref('')

function startEdit() {
  draft.value = title.value
  editing.value = true
  // TODO: focus the input and select its text
}

function save() {
  // TODO
}

function cancel() {
  // TODO
}
</script>

<template>
  <input
    v-if="editing"
    v-model="draft"
    class="title-input"
  />
  <h2 v-else class="title">{{ title }}</h2>
  <button v-if="!editing" class="edit" @click="startEdit">Edit</button>
</template>`,
        },
      },
      tests: [
        {
          name: 'Edit shows a focused input with the text selected',
          code: `await click('.edit')
const input = find('.title-input')
expect(input).toBeTruthy()
expect(document.activeElement).toBe(input)
expect(input.selectionStart).toBe(0)
expect(input.selectionEnd).toBe('Road trip mix'.length)`,
        },
        {
          name: 'Enter saves the new title',
          code: `await click('.edit')
await type('.title-input', 'Summer 2026')
await trigger('.title-input', 'keydown', { key: 'Enter' })
expect(exists('.title-input')).toBe(false)
expect(text('.title')).toBe('Summer 2026')`,
        },
        {
          name: 'Escape cancels and keeps the old title',
          code: `await click('.edit')
await type('.title-input', 'Oops')
await trigger('.title-input', 'keydown', { key: 'Escape' })
expect(exists('.title-input')).toBe(false)
expect(text('.title')).toBe('Road trip mix')`,
        },
      ],
      hints: [
        'Add `ref="titleInput"` to the input and `const titleInput = useTemplateRef(\'titleInput\')` in the script.',
        'The input only exists after the re-render: make `startEdit` async and `await nextTick()` before calling `titleInput.value.focus()` and `.select()`.',
        'Use `@keydown.enter="save"` and `@keydown.esc="cancel"` on the input.',
      ],
      answer: 'Flip `editing`, `await nextTick()` so the `v-if` input exists, then call `focus()` and `select()` through a template ref. Enter copies the draft into the title; Escape just leaves edit mode.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, useTemplateRef, nextTick } from 'vue'

const title = ref('Road trip mix')
const editing = ref(false)
const draft = ref('')
const titleInput = useTemplateRef('titleInput')

async function startEdit() {
  draft.value = title.value
  editing.value = true
  await nextTick() // the <input> exists only after this
  titleInput.value.focus()
  titleInput.value.select()
}

function save() {
  const next = draft.value.trim()
  if (next) title.value = next
  editing.value = false
}

function cancel() {
  editing.value = false
}
</script>

<template>
  <input
    v-if="editing"
    ref="titleInput"
    v-model="draft"
    class="title-input"
    @keydown.enter="save"
    @keydown.esc="cancel"
  />
  <h2 v-else class="title">{{ title }}</h2>
  <button v-if="!editing" class="edit" @click="startEdit">Edit</button>
</template>`,
        },
      },
      explanation: 'State decides *what* is shown (heading or input); the ref handles the two imperative actions (focus, select) once the input exists.',
      whyAsked: 'A realistic live-coding task combining `v-if`, async rendering, template refs and keyboard handling.',
      mistakes: ['Calling `focus()` before `nextTick()`.', 'Selecting text by manipulating the DOM value instead of `select()`.', 'Saving on Escape or losing the original title on cancel.'],
      followUps: ['How would you also save when the input loses focus (`blur`) without double-saving on Enter?', 'How would you announce the change to screen-reader users?'],
      modelAnswer: 'I keep `editing` and a `draft` in state. Starting an edit copies the title into the draft and flips `editing`, then I `await nextTick()` because the input only exists after the re-render. Through a template ref I call `focus()` and `select()`. Enter commits the trimmed draft; Escape just exits edit mode, so the original title is untouched.',
    },
  ],

  takeaways: [
    'A template ref is `null` until its element is mounted, and goes back to `null` when the element is removed.',
    'Use refs in `onMounted`, event handlers, or after `await nextTick()` when state has just added the element.',
    '`useTemplateRef(\'key\')` (Vue 3.5+) links by an explicit key; `ref(null)` must share the attribute\'s name.',
    'Inside `v-for` a ref gives an array whose order is not guaranteed — use function refs keyed by id for lookups.',
    '`<script setup>` components are closed: parents only reach what `defineExpose()` publishes. Expose verbs, not state.',
    'Refs are an escape hatch for focus, scrolling, measurement, media and libraries — anything a binding can do should stay a binding.',
  ],
}
