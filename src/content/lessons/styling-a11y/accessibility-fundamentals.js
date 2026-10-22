// Lesson: Accessibility fundamentals — semantic HTML, keyboard, focus, screen readers,
// forms, motion and contrast in Vue apps.

const brokenTasks = `<script setup>
import { ref } from 'vue'

const tasks = ref([
  { id: 1, title: 'Buy oat milk' },
  { id: 2, title: 'Email the landlord' },
  { id: 3, title: 'Book the dentist' },
])
const draft = ref('')
let nextId = 4

function addTask() {
  const title = draft.value.trim()
  if (!title) return
  tasks.value.push({ id: nextId++, title })
  draft.value = ''
}

function removeTask(index) {
  tasks.value.splice(index, 1)
}
</script>

<template>
  <div class="card">
    <div class="title">My tasks</div>

    <div class="row">
      <input v-model="draft" class="new-task" placeholder="New task…" @keyup.enter="addTask" />
      <div class="add" @click="addTask">Add</div>
    </div>

    <ul class="tasks">
      <li v-for="(task, index) in tasks" :key="task.id">
        <span>{{ task.title }}</span>
        <span class="remove" @click="removeTask(index)">✕</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.card { font-family: system-ui, sans-serif; max-width: 22rem; padding: 1rem; border: 1px solid #ddd; border-radius: 12px; }
.title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; }
.row { display: flex; gap: 0.5rem; }
.new-task { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid #ddd; border-radius: 6px; }
.add { padding: 0.4rem 0.8rem; background: #60a5fa; color: #fff; border-radius: 6px; cursor: pointer; }
.tasks { list-style: none; padding: 0; }
.tasks li { display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px solid #eee; }
.remove { color: #bbb; cursor: pointer; }
*:focus { outline: none; }
</style>`

const fixedTasks = `<script setup>
import { ref, nextTick, useId } from 'vue'

const tasks = ref([
  { id: 1, title: 'Buy oat milk' },
  { id: 2, title: 'Email the landlord' },
  { id: 3, title: 'Book the dentist' },
])
const draft = ref('')
const announcement = ref('')
const headingId = useId()          // unique ids (Vue 3.5+)
const inputId = useId()
const heading = ref(null)
const removeButtons = new Map()    // task id -> its remove <button>
let nextId = 4

function setRemoveButton(id, el) {
  if (el) removeButtons.set(id, el)
  else removeButtons.delete(id)
}

function addTask() {
  const title = draft.value.trim()
  if (!title) return
  tasks.value.push({ id: nextId++, title })
  draft.value = ''
  announcement.value = 'Added: ' + title
}

async function removeTask(index) {
  const [removed] = tasks.value.splice(index, 1)
  announcement.value = 'Removed: ' + removed.title
  await nextTick()
  const next = tasks.value[index] ?? tasks.value[index - 1]
  if (next) removeButtons.get(next.id)?.focus()
  else heading.value?.focus()
}
</script>

<template>
  <section class="card" :aria-labelledby="headingId">
    <h2 :id="headingId" ref="heading" class="title" tabindex="-1">My tasks</h2>

    <form class="row" @submit.prevent="addTask">
      <label :for="inputId" class="label">New task</label>
      <input :id="inputId" v-model="draft" class="new-task" autocomplete="off" />
      <button class="add">Add</button>
    </form>

    <ul class="tasks">
      <li v-for="(task, index) in tasks" :key="task.id">
        <span>{{ task.title }}</span>
        <button
          :ref="(el) => setRemoveButton(task.id, el)"
          type="button"
          class="remove"
          :aria-label="'Remove ' + task.title"
          @click="removeTask(index)"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </li>
    </ul>

    <p class="visually-hidden" role="status">{{ announcement }}</p>
  </section>
</template>

<style scoped>
.card { font-family: system-ui, sans-serif; max-width: 22rem; padding: 1rem; border: 1px solid #949494; border-radius: 12px; }
.title { font-size: 1.25rem; font-weight: 700; margin: 0 0 0.75rem; }
.row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.label { width: 100%; font-weight: 600; }
.new-task { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid #767676; border-radius: 6px; }
.add { padding: 0.4rem 0.8rem; background: #1d4ed8; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
.tasks { list-style: none; padding: 0; }
.tasks li { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid #ddd; }
.remove { min-width: 2rem; min-height: 2rem; background: none; border: 1px solid #767676; border-radius: 6px; color: #374151; cursor: pointer; }
:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
</style>`

const startFiles = { 'App.vue': brokenTasks }

export default {
  id: 'accessibility-fundamentals',
  title: 'Accessibility fundamentals',
  summary: 'Build Vue interfaces that work with a keyboard, a screen reader, zoom and reduced motion — starting from semantic HTML instead of patching with ARIA.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['template-refs', 'v-model-forms', 'next-tick'],
  related: ['accessible-components', 'accessible-reusable-inputs', 'design-systems', 'responsive-dynamic-styles', 'router-in-practice', 'e2e-and-quality', 'transitions'],
  tags: ['accessibility', 'a11y', 'aria', 'semantic html', 'keyboard', 'focus', 'screen reader', 'aria-live', 'wcag', 'contrast', 'prefers-reduced-motion', 'useId'],
  apis: [
    { name: 'useId()', summary: 'Vue 3.5+: generates an id that is unique per application and stable between server and client — ideal for `for`/`id` and `aria-*` wiring.' },
    { name: 'aria-describedby', summary: 'Points at the id(s) of elements that describe a control (hints, error messages).' },
    { name: 'aria-live / role="status"', summary: 'Marks a region whose content changes should be announced by screen readers.' },
    { name: ':focus-visible', summary: 'CSS pseudo-class that matches when the browser decides focus should be visibly indicated (typically keyboard focus).' },
    { name: 'prefers-reduced-motion', summary: 'Media feature reflecting the user\'s operating-system request for less motion.' },
  ],
  docs: [
    { label: 'Vue Guide — Accessibility', url: 'https://vuejs.org/guide/best-practices/accessibility.html' },
    { label: 'API — useId()', url: 'https://vuejs.org/api/composition-api-helpers.html#useid' },
    { label: 'WAI — Understanding SC 1.4.3 Contrast (Minimum)', url: 'https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html' },
    { label: 'WAI — Understanding SC 1.4.11 Non-text Contrast', url: 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html' },
    { label: 'WAI-ARIA Authoring Practices Guide — Read Me First', url: 'https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/' },
    { label: 'MDN — prefers-reduced-motion', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion' },
  ],

  intro: `
*Accessibility* (often shortened to **a11y** — "a", eleven letters, "y") means building interfaces that people can use **however they use a computer**: with a mouse, a keyboard only, a screen reader that speaks the page aloud, voice control, a switch device, zoomed to 400%, or with animations turned off because motion makes them ill.

The good news for Vue developers: Vue renders **real HTML**. Almost everything in this lesson is about *what your templates output* — the right elements, the right attributes, and moving focus at the right moment. Vue gives you the tools (template refs, \`nextTick()\`, \`useId()\`); you decide whether the result is usable.
`,

  why: `
A page can look perfect and still be unusable. Here is a "button" that works fine with a mouse:

\`\`\`html
<div class="add" @click="addTask">Add</div>
\`\`\`

For a keyboard user it does not exist — a \`<div>\` cannot receive focus, so Tab skips it. A screen reader announces it as plain text, "Add", with no hint that it can be pressed. Nothing is broken in the code; it is broken for **people**.

This matters because a lot of people rely on these technologies — permanently (blindness, motor impairments), temporarily (a broken arm) or situationally (bright sunlight, a baby on one arm). It is also a legal requirement for many organisations, and the improvements help everyone: keyboard shortcuts, clear labels and good contrast make an app faster and easier for all users. Designers call this the *curb-cut effect* — ramps built for wheelchairs also help prams, suitcases and delivery carts.
`,

  eli15: `
Imagine you could only use your computer with the **Tab** key and **Enter**. Or that your screen was off, and a voice read each thing out loud: "Heading: My tasks. Edit text. Button: Add."

That voice is a *screen reader*. It doesn't see colours or layout. It only knows what your HTML **says** each thing is. A real \`<button>\` says "I'm a button, press me". A \`<div>\` dressed up to look like a button says nothing — so the voice can't tell you it exists, and Tab won't stop on it.

Accessibility is mostly three habits:

1. **Use the right HTML element** for the job (\`<button>\`, \`<a>\`, \`<label>\`, \`<h2>\`).
2. **Give everything a name** people can hear ("Remove Buy oat milk", not just "✕").
3. **Never lose the user's place** — when something disappears, move the keyboard focus somewhere sensible, and announce changes they can't see.
`,

  analogy: {
    title: 'A building everyone can enter',
    body: `
A well-designed building has stairs **and** a ramp, signs with large print **and** braille, a lift that announces each floor, and exit signs you can find in the dark. Nobody thinks of the ramp as a "special feature" — it is part of the entrance.

A web page is the same. The visual design is the staircase. Keyboard support, names and announcements are the ramp, braille and lift voice. If you build them in from the start they cost little; bolting a ramp onto a finished building is expensive and usually awkward.
`,
    mapping: [
      ['stairs-only entrance', 'a UI that only works with a mouse'],
      ['the ramp', 'keyboard support: every control reachable with Tab and usable with Enter/Space'],
      ['braille signs on doors', 'accessible names: labels, `aria-label`, alt text'],
      ['the lift announcing "3rd floor"', 'live regions announcing changes (`role="status"`)'],
      ['"You are here" on the map', 'visible focus and deliberate focus management'],
      ['clear, high-contrast signage', 'colour contrast that meets WCAG AA'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'How your template reaches a screen-reader user',
    caption: 'Step through it: the browser turns your DOM into an *accessibility tree* of roles, names and states. Assistive technology reads that tree — not your CSS.',
    alt: 'A left-to-right diagram with five boxes: Vue template and DOM, accessibility tree (role, name, state), platform accessibility API, assistive technology (screen reader, voice control, switch), and the user. Arrows show the browser computing the tree from the DOM, exposing it to the OS, the screen reader querying it and speaking to the user, and a dashed arrow back from the user to the DOM for keyboard input.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'dom', label: 'Template → DOM', note: '<button aria-expanded="false">', tone: 'acid' },
        { id: 'tree', label: 'Accessibility tree', note: 'role · name · state', tone: 'cobalt' },
        { id: 'api', label: 'Platform a11y API', note: 'provided by the OS', tone: 'paper' },
        { id: 'at', label: 'Assistive tech', note: 'screen reader, voice, switch', tone: 'kraft' },
        { id: 'user', label: 'The user', note: '"Menu, button, collapsed"', tone: 'ink' },
      ],
      edges: [
        { from: 'dom', to: 'tree', label: 'browser computes' },
        { from: 'tree', to: 'api', label: 'exposes' },
        { from: 'api', to: 'at', label: 'queried by' },
        { from: 'at', to: 'user', label: 'speech / braille' },
        { from: 'user', to: 'dom', label: 'keyboard events', dashed: true },
      ],
      steps: [
        { focus: ['dom'], text: 'Your Vue template renders real DOM elements. `<button>`, `<h2>`, `<label>` and `aria-*` attributes are the raw material.' },
        { focus: ['tree'], edges: ['dom->tree'], text: 'The browser builds a second tree next to the DOM: the **accessibility tree**. Every node gets a **role** (button, heading, textbox), a **name** ("Remove Buy oat milk") and **states** (expanded, pressed, invalid). A styled `<div>` becomes a nameless *generic* node.' },
        { focus: ['api'], edges: ['tree->api'], text: 'The tree is handed to the operating system\'s accessibility API, the same channel native apps use.' },
        { focus: ['at'], edges: ['api->at'], text: 'Assistive technology — a screen reader, voice control ("click Add"), a switch device — queries that API. It never sees your colours or your layout.' },
        { focus: ['user'], edges: ['at->user'], text: 'The user hears (or reads in braille) something like "Menu, button, collapsed". If the role or name is missing, there is nothing useful to say.' },
        { focus: ['user', 'dom'], edges: ['user->dom'], text: 'The user acts with the keyboard (or a tool that sends keyboard-like events). Only focusable, keyboard-operable elements can be used this way — which is why native elements matter so much.' },
      ],
    },
  },

  syntax: [
    `
#### 1. Semantic HTML first

Pick the element that already *means* what you want. You get keyboard support, focus and screen-reader semantics for free.
`,
    {
      code: `<!-- Actions → button.  Navigation → a with href. -->
<button type="button" @click="save">Save</button>
<RouterLink to="/settings">Settings</RouterLink>   <!-- renders <a href> -->

<!-- Structure: landmarks and a logical heading outline -->
<header>…</header>
<nav aria-label="Main">…</nav>
<main>
  <h1>Orders</h1>
  <h2>Open orders</h2>
</main>
<footer>…</footer>`,
      lang: 'vue',
      title: 'the right element for the job',
    },
    `
#### 2. Accessible names and the first rule of ARIA

*ARIA* (Accessible Rich Internet Applications) is a set of HTML attributes — \`role\`, \`aria-label\`, \`aria-expanded\`… — that change what the accessibility tree says. The **first rule of ARIA**: if a native element or attribute already does the job, use it instead. ARIA changes what assistive tech is *told*; it never adds behaviour (focus, keyboard handling) by itself.
`,
    {
      code: `<!-- Icon-only button: give it a name, hide the decorative glyph -->
<button type="button" aria-label="Close dialog" @click="close">
  <span aria-hidden="true">✕</span>
</button>

<!-- Or: visible-to-screen-readers-only text -->
<button type="button" @click="close">
  <span aria-hidden="true">✕</span>
  <span class="visually-hidden">Close dialog</span>
</button>

<!-- States: Vue 3 renders false as "false" for non-boolean attributes -->
<button :aria-expanded="isOpen" aria-controls="filters">Filters</button>`,
      lang: 'vue',
      title: 'names and states',
    },
    `
#### 3. Keyboard and focus

- Everything you can do with a mouse must work with the keyboard. Native \`<button>\`, \`<a href>\`, \`<input>\` are focusable and respond to Enter/Space already.
- \`tabindex="0"\` puts a custom element into the Tab order (in DOM order). \`tabindex="-1"\` makes it focusable **only from code** — perfect for headings you move focus to. **Never use positive values** like \`tabindex="3"\`: they create a separate order that jumps ahead of everything else.
- Never remove the focus outline without a replacement. Style \`:focus-visible\` instead.
- When the focused element disappears (a deleted row, a closed panel), move focus somewhere sensible **after the DOM updates** — \`await nextTick()\`, then \`el.focus()\`.
`,
    {
      code: `:focus-visible {
  outline: 3px solid var(--focus-ring, #1d4ed8);
  outline-offset: 2px;
}

/* Hide visually, keep for screen readers */
.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

/* Respect the OS "reduce motion" setting */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`,
      lang: 'css',
      title: 'focus, hidden text and motion',
    },
    `
#### 4. Forms and announcements

Every input needs a **label** (a placeholder is not a label — it disappears as soon as you type). Hints and errors are connected with \`aria-describedby\`; invalid fields get \`aria-invalid="true"\`. Changes the user cannot see — "Saved", "3 results" — go into a **live region** that is already on the page *before* the message arrives.
`,
    {
      code: `<script setup>
import { ref, useId } from 'vue'
const email = ref('')
const error = ref('')
const id = useId()               // e.g. "v-0" — unique per app
</script>

<template>
  <label :for="id">Email</label>
  <input
    :id="id"
    v-model="email"
    type="email"
    autocomplete="email"
    :aria-invalid="error ? 'true' : null"
    :aria-describedby="\`\${id}-hint\${error ? ' ' + id + '-error' : ''}\`"
  />
  <p :id="\`\${id}-hint\`">We only use it for receipts.</p>
  <p v-if="error" :id="\`\${id}-error\`">{{ error }}</p>

  <!-- rendered once, filled later -->
  <p class="visually-hidden" role="status">{{ statusMessage }}</p>
</template>`,
      lang: 'vue',
      title: 'labels, descriptions and a live region',
    },
    {
      callout: 'version',
      text: '`useId()` needs **Vue 3.5+**. On older versions, generate ids with a module-level counter (fine for client-only apps) or pass them in as props — and be careful with SSR, where server and client ids must match.',
    },
    `
#### 5. Colour contrast (WCAG 2.x, level AA)

- **Text:** at least **4.5:1** against its background; **3:1** for *large* text (at least 18pt ≈ 24 CSS px, or 14pt ≈ 18.7 CSS px bold).
- **Non-text:** at least **3:1** for the visual parts needed to identify UI components and their states (input borders, focus indicators, icon buttons) and for meaningful graphics.
- Never use colour **alone** to carry meaning — pair red borders with an error message or an icon.
`,
  ],

  walkthrough: {
    title: 'App.vue (accessible version)',
    lang: 'vue',
    code: fixedTasks,
    intro: 'This is the task list after every fix from the playground. Step through the lines that make it accessible — none of them change how it looks for a mouse user.',
    steps: [
      { lines: [11, 12], text: '`useId()` (Vue 3.5+) creates ids that are unique in this app, so two copies of this component never fight over `id="title"`. We use one for the heading and one for the input.' },
      { lines: [13, 20], text: 'A template ref to the heading plus a `Map` of remove buttons keyed by task id. A function ref fills the map; Vue calls it with `null` when a button unmounts, so the map never holds dead elements.' },
      { lines: [22, 28], text: 'Adding a task also writes to `announcement`. Sighted users see the new row; screen-reader users hear "Added: …" because the text lands in a live region.' },
      { lines: [30, 37], text: 'The focus fix. Splicing removes the button that had focus, which would drop focus to `<body>`. We wait for the DOM with `await nextTick()`, then focus the next row\'s button — or the heading when the list is empty.' },
      { lines: [41, 42], text: 'A `<section>` named by its heading becomes a *region landmark*. The heading is a real `<h2>` with `tabindex="-1"`: focusable from code, but not an extra Tab stop.' },
      { lines: [44, 48], text: 'A real `<form>` with a visible `<label for>` and a real `<button>`. Enter in the input submits the form natively — no `@keyup.enter` needed — and `.prevent` stops a page reload.' },
      { lines: [53, 61], text: 'Each ✕ is a `<button type="button">` with a unique name, "Remove Buy oat milk". The glyph itself is `aria-hidden` so it is not read as "multiplication x".' },
      { lines: [65], text: 'The live region: rendered from the start, visually hidden, and `role="status"` (which implies `aria-live="polite"`). Only its *text* changes.' },
      { lines: [79], text: 'A visible focus ring for keyboard users via `:focus-visible`, replacing the original `*:focus { outline: none }` that hid where the user was.' },
    ],
  },

  playground: {
    title: 'Fix the inaccessible task list',
    objective: 'The list works with a mouse but fails keyboard and screen-reader users. Fix it one barrier at a time.',
    files: startFiles,
    expected: 'A task list with an input, an **Add** control and ✕ icons. Try it **without a mouse**: press Tab — focus jumps straight past Add and every ✕, and you cannot see where focus is. Switch to the **Accessible version** variant to compare.',
    experiments: [
      {
        id: 'real-buttons',
        task: 'Turn the **Add** `<div>` and every ✕ `<span>` into real `<button type="button">` elements (keep the classes `add` and `remove`). Give each ✕ a unique accessible name such as **"Remove Buy oat milk"**.',
        hint: 'Use `:aria-label="\'Remove \' + task.title"` on the ✕ button, and wrap the glyph in `<span aria-hidden="true">✕</span>` so it is not read aloud.',
        tests: [
          {
            name: 'Add is a real button',
            code: `expect(find('.add').tagName).toBe('BUTTON')`,
          },
          {
            name: 'every ✕ is a button with a unique "Remove …" name',
            code: `const removes = findAll('.remove')
expect(removes.length).toBeGreaterThan(0)
const names = removes.map((b) => (b.getAttribute('aria-label') || b.textContent).replace(/\\s+/g, ' ').trim())
for (const b of removes) expect(b.tagName).toBe('BUTTON')
for (const n of names) expect(n).toMatch(/remove/i)
expect(new Set(names).size).toBe(names.length)`,
          },
        ],
        explain: 'A `<button>` is focusable, fires `click` on Enter and Space, and is announced as "button" — all for free. The unique name matters because a screen-reader user who lists all buttons would otherwise hear "Remove, Remove, Remove" with no idea which is which.',
      },
      {
        id: 'label',
        task: 'The input only has a placeholder. Give it a real **label** — either `<label for>` pointing at the input\'s `id`, or a `<label>` wrapping the input.',
        hint: 'Import `useId` from `vue` (3.5+), create `const inputId = useId()`, then `<label :for="inputId">New task</label>` and `<input :id="inputId" …>`.',
        tests: [
          {
            name: 'the input has a non-empty label',
            code: `const input = find('.new-task')
const viaFor = input.id ? find('label[for="' + input.id + '"]') : null
const label = viaFor || input.closest('label')
expect(label).toBeTruthy()
expect(label.textContent.trim().length).toBeGreaterThan(0)`,
          },
        ],
        explain: 'A label gives the input its accessible name ("New task, edit text") and makes the label clickable — a bigger target for everyone. Placeholders vanish when you type, often have low contrast, and are not a reliable name.',
      },
      {
        id: 'announce',
        task: 'Screen-reader users get no feedback when a task is added. Add a live region — e.g. `<p role="status">` — that is **always rendered**, and put **"Added: <title>"** into it when a task is added.',
        hint: 'Create `const announcement = ref(\'\')`, render `<p class="visually-hidden" role="status">{{ announcement }}</p>` unconditionally, and set `announcement.value = \'Added: \' + title` in `addTask()`.',
        tests: [
          {
            name: 'a live region exists before anything is added and then announces the task',
            code: `const region = find('[role="status"]') || find('[aria-live]')
expect(region).toBeTruthy()
await type('.new-task', 'Water the plants')
await click('.add')
expect(region.textContent).toContain('Added')
expect(region.textContent).toContain('Water the plants')`,
          },
        ],
        explain: 'Screen readers watch live regions for **changes**. If the region were created together with its message (with `v-if`), many screen readers would say nothing. Rendering it empty up front and changing its text is the reliable pattern.',
      },
      {
        id: 'focus-after-delete',
        task: 'Delete a task with the keyboard and focus falls back to `<body>` — the user is thrown to the top of the page. After removing a task, move focus to the **next task\'s ✕ button**, or to the heading if the list is empty.',
        hint: 'Make `removeTask` `async`, `await nextTick()` after the splice, then call `.focus()` on an element you hold in a template ref. A heading needs `tabindex="-1"` to be focusable from code. (Do the **real-buttons** experiment first so the ✕ elements can take focus.)',
        tests: [
          {
            name: 'after removing a task, focus stays inside the card',
            code: `await click(findAll('.remove')[0])
const active = document.activeElement
expect(Boolean(active) && active !== document.body && find('.card').contains(active)).toBe(true)`,
          },
        ],
        explain: 'When the focused element is removed from the DOM, the browser has nowhere to put focus and resets it to the document. You must wait for Vue to update the DOM (`nextTick`) before the next button exists to receive focus. This "never lose the user\'s place" rule applies to deletions, closed dialogs and route changes alike.',
      },
    ],
    variants: [
      { id: 'start', label: 'Starting point', files: startFiles },
      { id: 'accessible', label: 'Accessible version (all fixes applied)', files: { 'App.vue': fixedTasks } },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'A fake button vs a real one',
    caption: 'Same look, very different experience for keyboard and screen-reader users.',
    alt: 'Side-by-side code. Left: a div with a click handler and a CSS class. Right: a button element with type button and the same click handler. Bullet points list what the native button provides: focusability, Enter and Space activation, the button role, disabled support and form behaviour.',
    props: {
      left: {
        label: 'Clickable div',
        lang: 'vue',
        code: `<div class="btn" @click="save">
  Save
</div>

<!-- to fix it you'd need: -->
<div class="btn" role="button" tabindex="0"
     @click="save"
     @keydown.enter.prevent="save"
     @keydown.space.prevent="save">
  Save
</div>`,
      },
      right: {
        label: 'Native button',
        lang: 'vue',
        code: `<button type="button" class="btn" @click="save">
  Save
</button>`,
      },
      points: [
        'A `<div>` is not focusable: Tab skips it entirely.',
        'It has no role, so screen readers announce plain text — nothing says it can be pressed.',
        'Patching it needs `role`, `tabindex` and Enter/Space handlers — and you still lack `disabled`, form submission and voice-control support you get for free.',
        'The `<button>` is focusable, activates on Enter and Space, is announced as "Save, button" and supports `disabled`.',
        'Use `type="button"` inside forms unless the button should submit the form.',
      ],
    },
  },

  internals: {
    beginner: `
Next to the DOM, the browser keeps an **accessibility tree**. Each node has a *role* (what it is), a *name* (what it is called) and *states* (expanded? pressed? invalid?). Screen readers and voice control read that tree. Your CSS doesn't appear in it, so a \`<div>\` that *looks* like a button is, to them, just text.

Keyboard users move through the page with **focus** — exactly one element has it at a time. Tab moves to the next focusable element in the order they appear in the HTML. If the focused element is deleted, focus is lost, which feels like being teleported to the top of the page.
`,
    technical: [
      `
**Roles** come from the element (\`<button>\` has the implicit role *button*, \`<nav>\` is a *navigation* landmark, \`<ul>\` a *list*) or from an explicit \`role\` attribute. A \`role\` only changes what is *announced* — \`role="button"\` on a \`<div>\` does not make it focusable or clickable by keyboard.

**Names** are computed by the *accessible name computation* (the W3C "accname" spec). A simplified order of precedence:
`,
      {
        code: `// A simplified model of how a button gets its name — not the full spec
function accessibleName(el) {
  if (el.hasAttribute('aria-labelledby')) return textOfIds(el.getAttribute('aria-labelledby'))
  if (el.hasAttribute('aria-label')) return el.getAttribute('aria-label')
  if (hasNativeLabel(el)) return nativeLabelText(el)   // <label for>, alt, <legend>, <caption>
  if (roleAllowsNameFromContent(el)) return visibleTextContent(el) // buttons, links, headings
  return el.getAttribute('title') ?? ''                // last resort (placeholder for inputs)
}`,
        lang: 'js',
        title: 'mental model: accessible name',
      },
      `
\`aria-describedby\` adds a separate *description* that is usually read after the name and role ("Email, edit text, invalid entry, Enter a valid email address").

**Vue's part.** Vue renders exactly the attributes you bind. In Vue 3, binding \`false\` to a *non-boolean* attribute renders the string \`"false"\` — which is exactly what \`aria-expanded\`, \`aria-pressed\` and \`aria-selected\` need. Bind \`null\` or \`undefined\` to remove an attribute completely. (Vue 2 removed attributes bound to \`false\`; this is one of the Vue 3 migration changes.)

**Focus.** \`document.activeElement\` is the focused element. Sequential (Tab) order is DOM order for elements that are focusable natively or with \`tabindex="0"\`; \`tabindex="-1"\` means "focusable by script only". Vue patches the DOM asynchronously, batched in a microtask, so an element created by a state change doesn't exist until after \`await nextTick()\` — focusing earlier silently does nothing.

**Live regions.** Assistive tech observes elements with \`aria-live\` (or the roles \`status\` → polite and \`alert\` → assertive). It announces *changes to the content of a region it already knows about*. A region inserted together with its text is not reliably announced, so render the region empty and change its text. \`polite\` waits for the user to be idle; \`assertive\` interrupts — reserve it for urgent problems.
`,
    ],
    production: [
      `
- **Route changes.** In a single-page app, navigation doesn't load a new page, so screen readers get no "new page" signal and focus stays on the link that was clicked. Common approach: after each navigation, update \`document.title\` and move focus to the main heading (or a wrapper with \`tabindex="-1"\`). See [Vue Router in practice](lesson:router-in-practice).
`,
      {
        code: `// router.js — focus the new page's <h1> after navigation (simplified)
router.afterEach(async (to) => {
  document.title = to.meta.title ? \`\${to.meta.title} · Acme\` : 'Acme'
  await nextTick()
  const heading = document.querySelector('main h1')
  if (heading) {
    heading.setAttribute('tabindex', '-1')
    heading.focus({ preventScroll: true })
  }
})`,
        lang: 'js',
        title: 'route-change focus management',
        static: true,
      },
      `
- **Bake it into components.** Accessible patterns belong in your shared base components (buttons, inputs, dialogs, tabs) so every feature team gets them for free — see [Accessible components](lesson:accessible-components) and [Design systems](lesson:design-systems).
- **Automate what can be automated.** Linting (for example the community \`eslint-plugin-vuejs-accessibility\`) and axe-based checks in component or end-to-end tests catch missing names, invalid ARIA and many contrast problems. They cannot judge whether focus order is logical or whether an announcement makes sense, so they find only *part* of the issues — see [E2E tests & accessibility checks](lesson:e2e-and-quality).
- **Test manually, every feature.** A keyboard-only pass (Tab, Shift+Tab, Enter, Space, Escape, arrow keys); a quick screen-reader check (NVDA or JAWS on Windows, VoiceOver on macOS/iOS, TalkBack on Android); zoom to 200% and 400%; turn on reduced motion and forced-colours/high-contrast modes.
- **Design tokens with contrast built in.** Check colour pairs once, in the token set, instead of in every component.
- **Target WCAG 2.x level AA** — the common baseline in accessibility policies. Ideally, include disabled users in research and usability testing: guidelines are the floor, not the ceiling.
- **Repeated identical announcements.** Setting a live region to the same text twice is not a change, so nothing is read. Clear it first and set the new text after \`nextTick()\`, or append a counter.
`,
    ],
  },

  mistakes: [
    {
      title: 'Removing the focus outline',
      wrong: { code: `*:focus { outline: none; }`, lang: 'css' },
      right: { code: `:focus-visible {\n  outline: 3px solid #1d4ed8;\n  outline-offset: 2px;\n}`, lang: 'css' },
      explanation: 'Without a visible focus indicator, keyboard users cannot see where they are. If the default ring clashes with your design, restyle it with `:focus-visible` (which browsers typically apply for keyboard focus, not mouse clicks) — never delete it.',
    },
    {
      title: 'Positive tabindex values',
      wrong: { code: `<input tabindex="1" />\n<button tabindex="2">Search</button>`, lang: 'html' },
      right: { code: `<!-- Put elements in the right DOM order instead -->\n<input />\n<button>Search</button>`, lang: 'html' },
      explanation: 'Positive `tabindex` values are visited *before* everything else on the page, in numeric order, creating a confusing tab order that breaks as soon as anything is added. Use DOM order, `0` and `-1` only.',
    },
    {
      title: 'Using the placeholder as the label',
      wrong: { code: `<input v-model="email" placeholder="Email" />`, lang: 'vue' },
      right: { code: `<label for="email">Email</label>\n<input id="email" v-model="email" type="email" autocomplete="email" />`, lang: 'vue' },
      explanation: 'The placeholder disappears once the user types, is often low contrast and is not a dependable accessible name. Visible labels help everyone — including people with memory or attention difficulties who forget what a field was for.',
    },
    {
      title: '`aria-hidden` on something focusable',
      wrong: { code: `<button aria-hidden="true" @click="close">✕</button>`, lang: 'vue' },
      right: { code: `<button aria-label="Close" @click="close">\n  <span aria-hidden="true">✕</span>\n</button>`, lang: 'vue' },
      explanation: '`aria-hidden="true"` removes an element from the accessibility tree, but it can still receive keyboard focus — a screen-reader user lands on "nothing". Hide only decorative content, never interactive elements.',
    },
    {
      title: 'Creating the live region together with the message',
      wrong: { code: `<p v-if="saved" role="status">Saved!</p>`, lang: 'vue' },
      right: { code: `<p role="status">{{ saved ? 'Saved!' : '' }}</p>`, lang: 'vue' },
      explanation: 'Screen readers announce *changes inside a region they already track*. A region that appears with its text already inside is often not announced at all. Keep the region rendered and change its content.',
    },
    {
      title: 'Colour as the only signal',
      wrong: { code: `<input :class="{ 'border-red': !valid }" />`, lang: 'vue' },
      right: { code: `<input :aria-invalid="!valid ? 'true' : null" :aria-describedby="!valid ? 'email-error' : null" />\n<p v-if="!valid" id="email-error">⚠ Enter a valid email address.</p>`, lang: 'vue' },
      explanation: 'People with colour-vision deficiencies may not see the red border, and screen readers do not announce it. Add text (and optionally an icon) and expose the state with `aria-invalid` and `aria-describedby`.',
    },
  ],

  debugging: [
    {
      symptom: 'A screen reader announces just "button" with no name.',
      cause: 'An icon-only button (an SVG or a symbol like ✕) has no text and no `aria-label`.',
      fix: 'Add `aria-label="Close dialog"` (or visually hidden text) and mark the icon `aria-hidden="true"`. Check the result in the browser devtools Accessibility panel.',
    },
    {
      symptom: 'After deleting an item or closing a panel, pressing Tab starts again from the top of the page.',
      cause: 'The focused element was removed from the DOM, so focus fell back to `<body>`.',
      fix: 'After the state change, `await nextTick()` and focus a sensible element: the next item, the trigger that opened the panel, or a heading with `tabindex="-1"`.',
    },
    {
      symptom: '`el.focus()` runs but nothing gets focus.',
      cause: 'The element does not exist yet (the DOM update is still pending), it is hidden with `display: none`, or it is not focusable (a `<div>` or `<h2>` without `tabindex`).',
      fix: 'Call it after `await nextTick()`, make sure the element is visible, and add `tabindex="-1"` to non-interactive targets.',
    },
    {
      symptom: 'The "Saved" message never gets read out.',
      cause: 'The live region is created with `v-if` at the same moment as the text, or the text did not change (same message twice).',
      fix: 'Render the region unconditionally and change its text; for repeated messages, clear it and set the new text after `nextTick()`.',
    },
    {
      symptom: 'Keyboard users can reach a custom control but nothing happens on Enter or Space.',
      cause: 'It is a `<div>` with `tabindex="0"` and a `@click` handler — click handlers are not triggered by keys on non-native elements.',
      fix: 'Replace it with a `<button>`. If that is truly impossible, add `role="button"` and handlers for Enter and Space — but prefer the native element.',
    },
    {
      symptom: 'Users report dizziness from page transitions.',
      cause: 'Large movement animations ignore the operating-system reduce-motion setting.',
      fix: 'Wrap motion in `@media (prefers-reduced-motion: no-preference)` or turn it off under `(prefers-reduced-motion: reduce)`; in JavaScript check `matchMedia(\'(prefers-reduced-motion: reduce)\').matches`.',
    },
  ],

  bestPractices: [
    'Reach for the native element first: `<button>` for actions, `<a href>` / `<RouterLink>` for navigation, `<label>` for inputs, headings for structure.',
    'Give every interactive element an accessible name that would make sense read out of context ("Remove Buy oat milk", not "✕" or "click here").',
    'Keep one `<h1>` per page and a heading outline without skipped levels; wrap regions in landmarks (`header`, `nav`, `main`, `footer`).',
    'Never remove focus outlines; style `:focus-visible`. Avoid positive `tabindex`.',
    'Manage focus deliberately whenever content the user was focused on disappears or a view changes — after `await nextTick()`.',
    'Render live regions up front and change their text; use `role="status"` for routine updates and `role="alert"` only for urgent ones.',
    'Use `useId()` (3.5+) for `for`/`id` and `aria-describedby` wiring in reusable components.',
    'Check colour pairs against WCAG AA (4.5:1 text, 3:1 large text and UI component boundaries) — ideally once, in your design tokens.',
    'Respect `prefers-reduced-motion`, and test with keyboard only, a screen reader and 200%+ zoom before calling a feature done.',
  ],

  useCases: [
    'Turning icon buttons (close, delete, edit, favourite) into named, focusable buttons.',
    'Announcing async results: "Saved", "3 results found", "Item added to cart".',
    'Keeping keyboard focus in place after deleting rows in tables and lists.',
    'Focusing the main heading after a client-side route change.',
    'Connecting form hints and validation errors to their inputs.',
    'Turning off parallax, auto-playing carousels and large transitions for users who ask for reduced motion.',
  ],

  whenToUse: {
    use: [
      'Always — accessibility is a quality attribute of every feature, like correctness or security, not an optional extra.',
      'Especially for shared components: one accessible `<BaseButton>` fixes every screen that uses it.',
      'ARIA attributes when native HTML has no equivalent: `aria-expanded`, `aria-controls`, `aria-live`, `aria-describedby`, `aria-current`.',
    ],
    avoid: [
      'ARIA roles that duplicate native semantics (`<button role="button">`) or override them (`<h2 role="button">`).',
      '`aria-label` on generic elements like a plain `<div>` or `<span>` — naming is not supported for the generic role, so many screen readers ignore it.',
      'Building custom widgets (selects, comboboxes) when a native element would do the job.',
      '`role="alert"` / `aria-live="assertive"` for routine messages — interrupting users constantly is its own barrier.',
    ],
  },

  comparison: {
    title: 'Ways to hide content — and who still perceives it',
    headers: ['', 'Visible on screen?', 'Read by screen readers?', 'Can receive focus?', 'Typical use'],
    rows: [
      ['`v-if="false"`', 'no', 'no', 'no (not in the DOM)', 'content that should not exist yet'],
      ['`v-show` / `display: none` / `hidden`', 'no', 'no', 'no', 'collapsed panels, inactive tab panels'],
      ['`aria-hidden="true"`', 'yes', 'no', '**yes, if focusable — avoid on interactive elements**', 'decorative icons and duplicated visuals'],
      ['`.visually-hidden` class', 'no', 'yes', 'yes, if focusable', 'extra context for screen readers, live regions, skip links'],
      ['`opacity: 0`', 'no (but takes space)', 'yes', 'yes', 'animations only — a trap if left in place'],
    ],
    note: 'Pick based on *who* should perceive the content. If nobody should, remove it (`v-if`) or hide it for everyone (`v-show`).',
  },

  quiz: [
    {
      id: 'accessibility-fundamentals-q1',
      type: 'mcq',
      prompt: 'Your design uses grey body text `#949494` on white. Its contrast ratio is about **3.03:1**. What does WCAG 2.x level AA say?',
      options: [
        { text: 'It passes for all text.', why: 'Normal-size text needs at least 4.5:1 at level AA.' },
        { text: 'It passes only for large text (at least 18pt, or 14pt bold).' },
        { text: 'It passes because grey is a neutral colour.', why: 'WCAG measures luminance contrast, not hue — grey is judged like any other colour.' },
        { text: 'Contrast rules only apply to buttons and links.', why: 'SC 1.4.3 covers text and images of text in general; SC 1.4.11 adds UI components and graphics.' },
      ],
      answer: 1,
      explanation: 'AA requires 4.5:1 for normal text and 3:1 for large text. 3.03:1 meets only the large-text threshold. (Also: never round up — 2.99:1 does not "round" to 3:1.)',
    },
    {
      id: 'accessibility-fundamentals-q2',
      type: 'output',
      prompt: 'Which HTML does **Vue 3** render for this button?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const open = ref(false)
</script>

<template>
  <button :aria-expanded="open">Menu</button>
</template>`,
      },
      options: [
        { text: '`<button aria-expanded="false">Menu</button>`' },
        { text: '`<button>Menu</button>`', why: 'That was Vue 2 behaviour. Vue 3 only removes non-boolean attributes for `null`/`undefined`.' },
        { text: '`<button aria-expanded="">Menu</button>`', why: 'Empty-string output is for *boolean* attributes like `disabled` when true.' },
        { text: '`<button aria-expanded="0">Menu</button>`', why: 'Vue does not convert booleans to numbers.' },
      ],
      answer: 0,
      explanation: 'In Vue 3, `false` on a non-boolean attribute renders the string "false" — exactly what `aria-expanded` needs. Use `null` to remove an attribute.',
    },
    {
      id: 'accessibility-fundamentals-q3',
      type: 'bug',
      prompt: 'Keyboard users say they can\'t tell which control is active. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<template>
  <label for="q">Search</label>
  <input id="q" type="search" />
  <button class="go">Go</button>
</template>

<style>
.go { background: #1d4ed8; color: white; }
button:focus,
input:focus {
  outline: none;
}
</style>`,
      },
      answerLine: 11,
      explanation: '`outline: none` removes the focus indicator with no replacement. Style `:focus-visible` with a clear outline instead.',
    },
    {
      id: 'accessibility-fundamentals-q4',
      type: 'fill',
      prompt: 'Wire the label to the input and the hint as its description.',
      code: {
        lang: 'vue',
        code: `<label :___="emailId">Email</label>
<input :id="emailId" type="email" aria-___="email-hint" />
<p id="email-hint">We only use it for receipts.</p>`,
      },
      answer: [['for'], ['describedby']],
      explanation: '`<label for>` names the input (it must match the input\'s `id`), and `aria-describedby` points at the hint\'s id so it is read as a description.',
    },
    {
      id: 'accessibility-fundamentals-q5',
      type: 'mcq',
      prompt: 'Select **all** the ways that give an icon-only `<button>` an accessible name.',
      options: [
        { text: '`aria-label="Close"` on the button' },
        { text: 'A visually hidden `<span>` with the text "Close" inside the button' },
        { text: '`aria-labelledby` pointing at the id of visible text that says "Close"' },
        { text: '`alt="Close"` on the button', why: '`alt` belongs on `<img>` (and `<area>`, `<input type="image">`); browsers ignore it on a button.' },
        { text: '`aria-describedby` pointing at text that says "Close"', why: 'That adds a *description*, not a name — the button is still announced as unnamed.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Names come from `aria-labelledby`, `aria-label` or the button\'s text content (visually hidden text counts). Descriptions and misplaced attributes do not name it.',
    },
    {
      id: 'accessibility-fundamentals-q6',
      type: 'short',
      prompt: 'Why can\'t an automated accessibility checker prove that a page is accessible?',
      answer: 'Automated tools can check machine-verifiable rules — missing names, invalid ARIA, many contrast failures — but cannot judge meaning: whether a label is accurate, whether focus order is logical, whether focus is managed after changes, or whether announcements make sense. Those need manual keyboard and screen-reader testing.',
    },
  ],

  exercises: [
    {
      id: 'accessible-favourite',
      title: 'An accessible favourite toggle',
      difficulty: 'beginner',
      prompt: `
The heart on this product card is a \`<span>\` with a click handler. Make it accessible:

- \`.fav\` must be a real \`<button type="button">\`.
- Its accessible name must contain **"Favourite"** (or "Favorite") — via \`aria-label\` or visually hidden text — and the name must **not change** when toggled.
- It exposes its state with \`aria-pressed\`: \`"false"\` initially, \`"true"\` after a click, \`"false"\` again after a second click.
- The heart glyph sits in a \`<span class="icon" aria-hidden="true">\`.
- A \`<p class="status" role="status">\` is **always rendered**: empty at first, **"Saved to favourites"** after turning it on and **"Removed from favourites"** after turning it off.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const product = { name: 'Trail running shoes', price: '€89' }
const favourite = ref(false)
</script>

<template>
  <article class="product">
    <h2>{{ product.name }}</h2>
    <p>{{ product.price }}</p>
    <span class="fav" @click="favourite = !favourite">{{ favourite ? '♥' : '♡' }}</span>
  </article>
</template>`,
      },
      hints: [
        'Swap the `<span>` for `<button type="button" class="fav">` — keep the click handler.',
        'Bind `:aria-pressed="favourite"` (Vue 3 renders `"false"`/`"true"`), add a fixed `aria-label="Favourite"`, and put the heart inside `<span class="icon" aria-hidden="true">`.',
        'Add `const status = ref(\'\')`, write a `toggle()` that flips `favourite` and sets `status.value` to the right message, and render `<p class="status" role="status">{{ status }}</p>` without `v-if`.',
      ],
      solution: {
        explanation: 'The native button brings focus and Enter/Space support. `aria-pressed` makes it a *toggle button*, so the name stays constant ("Favourite") while the state is announced as "pressed"/"not pressed" — changing the label as well would announce a contradiction like "Remove from favourites, pressed". The always-present status region announces the result without moving focus.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const product = { name: 'Trail running shoes', price: '€89' }
const favourite = ref(false)
const status = ref('')

function toggle() {
  favourite.value = !favourite.value
  status.value = favourite.value ? 'Saved to favourites' : 'Removed from favourites'
}
</script>

<template>
  <article class="product">
    <h2>{{ product.name }}</h2>
    <p>{{ product.price }}</p>
    <button
      type="button"
      class="fav"
      aria-label="Favourite"
      :aria-pressed="favourite"
      @click="toggle"
    >
      <span class="icon" aria-hidden="true">{{ favourite ? '♥' : '♡' }}</span>
    </button>
    <p class="status" role="status">{{ status }}</p>
  </article>
</template>`,
        },
      },
      tests: [
        { name: '.fav is a button with type="button"', code: `expect(find('.fav').tagName).toBe('BUTTON'); expect(attr('.fav', 'type')).toBe('button')` },
        {
          name: 'it has a "Favourite" name that does not change when toggled',
          code: `const nameOf = () => (attr('.fav', 'aria-label') || text('.fav'))
const before = nameOf()
expect(before).toMatch(/favou?rite/i)
await click('.fav')
expect(nameOf().replace(/[♥♡]/g, '').trim()).toBe(before.replace(/[♥♡]/g, '').trim())`,
        },
        {
          name: 'aria-pressed toggles false → true → false',
          code: `expect(attr('.fav', 'aria-pressed')).toBe('false')
await click('.fav')
expect(attr('.fav', 'aria-pressed')).toBe('true')
await click('.fav')
expect(attr('.fav', 'aria-pressed')).toBe('false')`,
        },
        { name: 'the glyph is hidden from screen readers', code: `expect(attr('.fav .icon', 'aria-hidden')).toBe('true')` },
        {
          name: 'the status region exists up front and announces both changes',
          code: `const region = find('.status')
expect(region).toBeTruthy()
expect(attr('.status', 'role')).toBe('status')
expect(region.textContent.trim()).toBe('')
await click('.fav')
expect(text('.status')).toBe('Saved to favourites')
await click('.fav')
expect(text('.status')).toBe('Removed from favourites')`,
        },
      ],
    },
    {
      id: 'contrast-checker',
      title: 'Build a WCAG contrast checker',
      difficulty: 'intermediate',
      prompt: `
Finish a small contrast checker. \`contrast.js\` already exports \`relativeLuminance(hex)\` (the WCAG formula). You write the rest:

- In \`contrast.js\`, export \`contrastRatio(fg, bg)\` = \`(lighter + 0.05) / (darker + 0.05)\`, where *lighter*/*darker* are the two relative luminances. Order of arguments must not matter. Black on white is 21.
- In \`App.vue\`, two text inputs \`.fg\` and \`.bg\` hold 6-digit hex colours (defaults \`#767676\` and \`#ffffff\`).
- \`.ratio\` shows the ratio **rounded down to two decimals** followed by \`:1\` (e.g. \`4.54:1\`).
- \`.aa-normal\` shows **Pass** if the ratio is at least 4.5, otherwise **Fail**. \`.aa-large\` shows **Pass** at 3 or more, otherwise **Fail**.
- **Compare the unrounded ratio.** WCAG thresholds are exact: \`#959595\` on white is 2.995…:1, which must **Fail** the large-text check.
`,
      files: {
        'contrast.js': `// WCAG 2.x relative luminance of a "#rrggbb" colour.
function channel(value) {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex) {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

// TODO: (lighter + 0.05) / (darker + 0.05)
export function contrastRatio(fg, bg) {
  return 1
}`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import { contrastRatio } from './contrast.js'

const fg = ref('#767676')
const bg = ref('#ffffff')
</script>

<template>
  <label>Text colour <input v-model="fg" class="fg" /></label>
  <label>Background <input v-model="bg" class="bg" /></label>

  <p :style="{ color: fg, background: bg, padding: '1rem' }">The quick brown fox</p>

  <p>Ratio: <strong class="ratio">?</strong></p>
  <p>AA normal text: <span class="aa-normal">?</span></p>
  <p>AA large text: <span class="aa-large">?</span></p>
</template>`,
      },
      hints: [
        'In `contrastRatio`, compute both luminances, then use `Math.max` and `Math.min` so the argument order does not matter.',
        'In `App.vue`, create `const ratio = computed(() => contrastRatio(fg.value, bg.value))`. Derive two more computeds for the pass/fail checks from the raw `ratio.value`.',
        'For display, round *down*: `Math.floor(ratio.value * 100) / 100`, then `.toFixed(2)` so `21` shows as `21.00`.',
      ],
      solution: {
        explanation: 'The ratio formula is symmetric thanks to `Math.max`/`Math.min`. Pass/fail is computed from the exact value, and rounding happens only for display — and downwards, so the screen never claims a ratio the colours do not reach. Text-colour hints like these are a good candidate for design tokens, so the check happens once, not per component.',
        files: {
          'contrast.js': `// WCAG 2.x relative luminance of a "#rrggbb" colour.
function channel(value) {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex) {
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(fg, bg) {
  const a = relativeLuminance(fg)
  const b = relativeLuminance(bg)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}`,
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import { contrastRatio } from './contrast.js'

const fg = ref('#767676')
const bg = ref('#ffffff')

const ratio = computed(() => contrastRatio(fg.value, bg.value))
const shown = computed(() => (Math.floor(ratio.value * 100) / 100).toFixed(2) + ':1')
const passNormal = computed(() => ratio.value >= 4.5)
const passLarge = computed(() => ratio.value >= 3)
</script>

<template>
  <label>Text colour <input v-model="fg" class="fg" /></label>
  <label>Background <input v-model="bg" class="bg" /></label>

  <p :style="{ color: fg, background: bg, padding: '1rem' }">The quick brown fox</p>

  <p>Ratio: <strong class="ratio">{{ shown }}</strong></p>
  <p>AA normal text: <span class="aa-normal">{{ passNormal ? 'Pass' : 'Fail' }}</span></p>
  <p>AA large text: <span class="aa-large">{{ passLarge ? 'Pass' : 'Fail' }}</span></p>
</template>`,
        },
      },
      tests: [
        {
          name: 'contrastRatio: black on white is 21, order does not matter',
          code: `const { contrastRatio } = requireModule('contrast.js')
expect(Math.abs(contrastRatio('#000000', '#ffffff') - 21) < 0.001).toBe(true)
expect(Math.abs(contrastRatio('#ffffff', '#000000') - 21) < 0.001).toBe(true)
expect(Math.abs(contrastRatio('#ffffff', '#ffffff') - 1) < 0.001).toBe(true)`,
        },
        { name: 'defaults: #767676 on white shows 4.54:1 and passes both', code: `expect(text('.ratio')).toBe('4.54:1'); expect(text('.aa-normal')).toBe('Pass'); expect(text('.aa-large')).toBe('Pass')` },
        { name: '#777777 fails normal text but passes large text', code: `await type('.fg', '#777777'); expect(text('.ratio')).toBe('4.47:1'); expect(text('.aa-normal')).toBe('Fail'); expect(text('.aa-large')).toBe('Pass')` },
        { name: '#959595 (2.995:1) fails large text — no rounding up', code: `await type('.fg', '#959595'); expect(text('.ratio')).toBe('2.99:1'); expect(text('.aa-large')).toBe('Fail')` },
        { name: 'black on white shows 21.00:1', code: `await type('.fg', '#000000'); expect(text('.ratio')).toBe('21.00:1')` },
      ],
    },
  ],

  interview: [
    {
      id: 'accessibility-fundamentals-div-button',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why is `<div @click="save">` worse than `<button @click="save">`? What would you have to add to make the div equivalent?',
      answer: 'A `<div>` has no role, is not focusable and does not respond to Enter/Space, so keyboard and screen-reader users cannot discover or operate it. To approximate a button you would need `role="button"`, `tabindex="0"`, key handlers for Enter and Space, disabled handling and focus styles — and you would still miss native behaviours like form submission. Using `<button type="button">` gives all of it for free.',
      explanation: 'Native elements come with semantics (role and name) and behaviour (focus and keyboard activation). ARIA can fix the semantics but never adds behaviour.',
      code: {
        lang: 'vue',
        code: `<!-- what the div would need -->
<div role="button" tabindex="0"
     @click="save"
     @keydown.enter.prevent="save"
     @keydown.space.prevent="save">Save</div>

<!-- what you should write -->
<button type="button" @click="save">Save</button>`,
      },
      whyAsked: 'It is the quickest signal of whether a candidate understands that accessibility starts with HTML, not with ARIA attributes.',
      mistakes: [
        'Saying `role="button"` alone is enough.',
        'Forgetting keyboard activation (Enter and Space).',
        'Treating accessibility as a styling concern.',
      ],
      followUps: ['When is `<a href>` the right element instead of `<button>`?', 'Why add `type="button"` inside a form?', 'What does the first rule of ARIA say?'],
      modelAnswer: 'A div is invisible to keyboard users because it isn\'t focusable, and screen readers announce it as plain text because it has no role. To fake a button I\'d need `role="button"`, `tabindex="0"`, Enter and Space handlers, disabled logic and focus styles — and I\'d still lose native form behaviour. So I use a `<button type="button">`: same styling freedom, all the semantics and keyboard support built in. For navigation I\'d use a link instead.',
    },
    {
      id: 'accessibility-fundamentals-first-rule-aria',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the "first rule of ARIA", and why do people say "no ARIA is better than bad ARIA"?',
      answer: 'If a native HTML element or attribute already has the semantics and behaviour you need, use it instead of repurposing an element with ARIA. ARIA only changes what assistive technology is told; it adds no behaviour. Incorrect ARIA actively lies — a `role="menu"` without the expected arrow-key behaviour, or `aria-hidden` on a focusable element, is worse than no ARIA because users are told to expect something that is not there.',
      explanation: 'ARIA is a promise to the user. Native HTML keeps the promise automatically; with ARIA you must implement it yourself.',
      whyAsked: 'Shows whether the candidate will sprinkle attributes around or design from semantic HTML up.',
      mistakes: ['Thinking ARIA makes elements focusable or clickable.', 'Adding redundant roles like `<button role="button">`.', 'Using `role="menu"` for site navigation.'],
      followUps: ['Name ARIA attributes that have no native HTML equivalent.', 'What happens if you put `aria-hidden="true"` on a button?'],
      modelAnswer: 'The first rule says: prefer native elements and attributes over ARIA when they exist. ARIA only rewrites the accessibility tree — role, name, state — and gives no keyboard or focus behaviour. When I add a role, I promise a specific interaction model, and if I don\'t implement it the user is misled. That\'s why bad ARIA is worse than none. I use ARIA for things HTML can\'t express, like `aria-expanded`, `aria-controls`, `aria-live` and `aria-current`.',
    },
    {
      id: 'accessibility-fundamentals-error-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Screen-reader users say they never hear why this field is invalid. What is wrong and how do you fix it?',
      code: {
        lang: 'vue',
        code: `<input v-model="email" placeholder="Email" :class="{ invalid: error }" />
<p v-if="error" class="error-text">{{ error }}</p>`,
      },
      answer: 'The input has no label (only a placeholder), the invalid state is shown only visually through a class, and the error paragraph is not connected to the input. Add a visible `<label for>`, set `aria-invalid="true"` when invalid, give the error an id and reference it with `aria-describedby` (generate ids with `useId()` in Vue 3.5+). On submit, move focus to the first invalid field so the error is read with it.',
      explanation: 'Visual connections (proximity, red colour) do not exist in the accessibility tree. Programmatic connections — `for`/`id`, `aria-describedby`, `aria-invalid` — do.',
      whyAsked: 'Forms are where accessibility bugs cost the most: users simply cannot complete the task.',
      mistakes: ['Only adding `role="alert"` to the error and leaving the field unlabelled.', 'Relying on colour alone.', 'Hard-coding ids in a reusable component that is rendered twice.'],
      followUps: ['Why not announce every error as it is typed?', 'How would you build this into a reusable `<BaseInput>`? (lesson:accessible-reusable-inputs)'],
      modelAnswer: 'Three gaps: no real label, a purely visual invalid state, and an error that is not programmatically tied to the field. I\'d add a `<label for>`, bind `aria-invalid` when there\'s an error, and point `aria-describedby` at the error\'s id, generated with `useId()` so it\'s unique. On submit I\'d focus the first invalid field, so the screen reader reads the label, the invalid state and the message together.',
    },
    {
      id: 'accessibility-fundamentals-route-change',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'In your Vue SPA, screen-reader users click a navigation link and hear nothing — they don\'t know the page changed. What do you do?',
      answer: 'Client-side navigation does not load a new document, so assistive tech gets no "new page" signal and focus stays on the old link. After each navigation (e.g. in `router.afterEach`), update `document.title`, wait for the new view to render, and move focus to the new page\'s main heading or a focusable wrapper (`tabindex="-1"`). Some teams also announce the page title through a polite live region. Keep scroll behaviour consistent and test with a real screen reader.',
      explanation: 'In a traditional site, the browser resets focus and announces the new title on every page load. A SPA must recreate that signal itself.',
      code: {
        lang: 'js',
        code: `router.afterEach(async (to) => {
  document.title = \`\${to.meta.title ?? 'Home'} · Acme\`
  await nextTick()
  document.querySelector('main h1')?.focus()   // h1 has tabindex="-1"
})`,
      },
      whyAsked: 'Tests whether the candidate understands the SPA-specific accessibility gap, not just static HTML rules.',
      mistakes: ['Saying screen readers handle SPAs automatically.', 'Focusing before the new view has rendered.', 'Forgetting `document.title`.'],
      followUps: ['Where would you put this logic so every route gets it?', 'How would you handle a route change that only updates query params (filters)?'],
      modelAnswer: 'A SPA swaps content without a page load, so screen readers don\'t hear a new page and focus stays on the clicked link. I\'d hook into `router.afterEach`, set `document.title` from route meta, wait for the DOM with `nextTick`, then focus the new view\'s `<h1>` with `tabindex="-1"`. Optionally a polite live region announces the title. For filter-only changes I wouldn\'t move focus — I\'d announce the result count instead.',
    },
    {
      id: 'accessibility-fundamentals-live-politeness',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 3,
      question: 'An autosave shows "Draft saved" every few seconds. Which live region setup fits best?',
      options: [
        '`role="alert"` created with `v-if` each time the draft saves',
        'A persistent `role="status"` element whose text changes to "Draft saved"',
        '`aria-live="assertive"` on the whole form',
        'Move focus to a "Draft saved" message each time',
      ],
      correctOption: 1,
      answer: 'A persistent `role="status"` region (implicitly `aria-live="polite"`) whose text changes. Polite announcements wait until the user pauses, so routine confirmations do not interrupt typing.',
      explanation: '`alert`/`assertive` interrupt whatever is being read — right for "Connection lost", wrong for routine confirmations. Inserting the region with `v-if` is unreliable, `assertive` on a whole form would announce every change inside it, and moving focus pulls the user out of the field they are typing in.',
      whyAsked: 'Distinguishes candidates who know live regions exist from those who know how they behave in practice.',
      mistakes: ['Choosing `alert` because "it\'s important".', 'Putting `aria-live` on a large container so everything is read.', 'Stealing focus for a non-urgent message.'],
      followUps: ['When would `role="alert"` be correct?', 'How do you make the same message announce twice in a row?'],
      modelAnswer: 'I\'d use one persistent `role="status"` region, which is polite: the screen reader finishes what it\'s saying and announces "Draft saved" when the user pauses. `alert` or `assertive` would interrupt typing every few seconds, and inserting the region with `v-if` is unreliable because screen readers track changes to existing regions. I\'d reserve `alert` for urgent failures like "Could not save — you are offline".',
    },
    {
      id: 'accessibility-fundamentals-focus-view',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'This app switches views with buttons (like a mini router). Make it accessible: after switching, move focus to the new view\'s heading `h1.view-title` (focusable from code only, not a Tab stop), and mark the active nav button with `aria-current="page"` (other buttons must not have the attribute).',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const views = [
  { id: 'inbox', label: 'Inbox', body: 'You have 3 new messages.' },
  { id: 'settings', label: 'Settings', body: 'Change your password and notifications.' },
]
const current = ref('inbox')
const view = computed(() => views.find((v) => v.id === current.value))
</script>

<template>
  <nav aria-label="Main">
    <button
      v-for="v in views"
      :key="v.id"
      type="button"
      class="nav-btn"
      @click="current = v.id"
    >
      {{ v.label }}
    </button>
  </nav>
  <main>
    <h1 class="view-title">{{ view.label }}</h1>
    <p>{{ view.body }}</p>
  </main>
</template>`,
        },
      },
      tests: [
        { name: 'switching shows the new view', code: `await click(findAll('.nav-btn')[1]); expect(text('.view-title')).toBe('Settings')` },
        { name: 'the heading is focusable from code but not a Tab stop', code: `expect(attr('.view-title', 'tabindex')).toBe('-1')` },
        { name: 'focus moves to the new heading after switching', code: `await click(findAll('.nav-btn')[1]); expect(document.activeElement).toBe(find('.view-title')); expect(document.activeElement.textContent.trim()).toBe('Settings')` },
        {
          name: 'only the active button has aria-current="page"',
          code: `let btns = findAll('.nav-btn')
expect(attr(btns[0], 'aria-current')).toBe('page')
expect(btns[1].hasAttribute('aria-current')).toBe(false)
await click(btns[1])
btns = findAll('.nav-btn')
expect(attr(btns[1], 'aria-current')).toBe('page')
expect(btns[0].hasAttribute('aria-current')).toBe(false)`,
        },
      ],
      hints: [
        'Add `tabindex="-1"` and `ref="title"` to the `<h1>`, and create `const title = ref(null)`.',
        'Replace the inline handler with an `async go(id)` function: set `current`, `await nextTick()`, then `title.value.focus()`.',
        'Bind `:aria-current="current === v.id ? \'page\' : null"` — `null` removes the attribute.',
      ],
      answer: 'Switch the view, wait for the DOM with `nextTick()`, then focus a heading that has `tabindex="-1"`. Use `aria-current="page"` (or `null` to remove it) on the nav buttons.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed, nextTick } from 'vue'

const views = [
  { id: 'inbox', label: 'Inbox', body: 'You have 3 new messages.' },
  { id: 'settings', label: 'Settings', body: 'Change your password and notifications.' },
]
const current = ref('inbox')
const view = computed(() => views.find((v) => v.id === current.value))
const title = ref(null)

async function go(id) {
  current.value = id
  await nextTick()
  title.value?.focus()
}
</script>

<template>
  <nav aria-label="Main">
    <button
      v-for="v in views"
      :key="v.id"
      type="button"
      class="nav-btn"
      :aria-current="current === v.id ? 'page' : null"
      @click="go(v.id)"
    >
      {{ v.label }}
    </button>
  </nav>
  <main>
    <h1 ref="title" class="view-title" tabindex="-1">{{ view.label }}</h1>
    <p>{{ view.body }}</p>
  </main>
</template>`,
        },
      },
      explanation: 'This mirrors what a router `afterEach` hook does for real routes: announce the new context by focusing its heading, after the DOM has updated. `aria-current="page"` tells screen-reader users which navigation item is active — something the visual highlight alone cannot.',
      whyAsked: 'Live-coding check that you know focus must wait for `nextTick()` and how to bind ARIA attributes conditionally in Vue.',
      mistakes: ['Calling `focus()` before `nextTick()` (works by luck here because the heading is reused, but breaks when the view component changes).', 'Binding `aria-current="false"` on inactive items instead of removing it.', 'Giving the heading `tabindex="0"`, adding a pointless Tab stop.'],
      followUps: ['How would you move this into a router `afterEach` hook?', 'Should a "Load more" button also move focus? Where to?'],
      modelAnswer: 'I hold a template ref to the heading and give it `tabindex="-1"` so code can focus it without adding a Tab stop. The click handler sets the current view, awaits `nextTick()` so Vue has patched the DOM, and focuses the heading — the screen reader then reads the new context. For the nav I bind `aria-current="page"` on the active button and `null` on the rest, which removes the attribute.',
    },
    {
      id: 'accessibility-fundamentals-team-process',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You join a team whose large Vue app has many accessibility issues. How do you make accessibility sustainable instead of a one-off clean-up?',
      answer: 'Fix it where it multiplies: make shared base components (button, input, dialog, tabs, menu) accessible and replace ad-hoc copies; put contrast-checked colours into design tokens; add linting and axe-based checks to CI so regressions are caught; add focus-management helpers (e.g. a router hook); define a manual checklist (keyboard pass, screen-reader smoke test, zoom, reduced motion) as part of the definition of done; prioritise fixes by user impact on key journeys (sign-up, checkout); and, where possible, test with disabled users.',
      explanation: 'One-off audits decay. Accessibility sticks when the easy path — the shared component, the default token, the CI check — is the accessible one.',
      whyAsked: 'Senior roles are judged on systems and process, not on individual fixes.',
      mistakes: ['Relying on a single audit or a single automated tool.', 'Fixing pages one by one while the shared components stay broken.', 'Making it one specialist\'s job.'],
      followUps: ['What can automated checks not catch?', 'How would you prioritise a backlog of 200 issues?'],
      modelAnswer: 'First I\'d fix the multipliers: accessible base components and contrast-checked design tokens, so every screen improves at once. Then I\'d prevent regressions with lint rules and axe checks in CI, knowing they only catch part of the problems. I\'d add a manual checklist — keyboard, screen reader, zoom, reduced motion — to the definition of done, and prioritise remaining issues by impact on core journeys like checkout. Finally I\'d push for testing with disabled users, because guidelines are the minimum, not the goal.',
    },
  ],

  takeaways: [
    'Accessibility means the app works with a keyboard, screen readers, voice control, zoom and reduced motion — and it mostly comes down to what your templates output.',
    'Semantic HTML first: `<button>`, `<a href>`, `<label>`, headings and landmarks give roles, names and keyboard behaviour for free. ARIA only changes what is announced.',
    'Every control needs an accessible name; icon-only buttons need `aria-label` or visually hidden text, with the icon `aria-hidden`.',
    'Never hide focus; avoid positive `tabindex`; after removing or replacing focused content, `await nextTick()` and move focus deliberately.',
    'Announce invisible changes through a live region that exists before the message; prefer `role="status"` over `role="alert"` for routine updates.',
    'WCAG AA contrast: 4.5:1 for normal text, 3:1 for large text and for UI component boundaries — and never colour alone.',
    'Automated checks catch only part of the problems; keyboard and screen-reader testing complete the picture.',
  ],
}
