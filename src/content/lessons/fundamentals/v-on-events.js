// Lesson: Events with v-on & modifiers

const chatApp = `<script setup>
import { ref } from 'vue'

const draft = ref('')
const sent = ref([])
const cardClicks = ref(0)

function onInput(event) {
  draft.value = event.target.value
}

function send() {
  if (!draft.value.trim()) return
  sent.value.push(draft.value.trim())
  draft.value = ''
}
</script>

<template>
  <section class="card" @click="cardClicks++">
    <h2 class="title">Team chat</h2>
    <form class="composer" @submit.prevent="send">
      <input class="draft" :value="draft" @input="onInput" placeholder="Type a message…" />
      <button class="send">Send</button>
    </form>
    <p class="count">{{ sent.length }} sent · last: {{ sent[sent.length - 1] || '—' }}</p>
    <p class="card-clicks">Card clicked {{ cardClicks }} times</p>
  </section>
</template>`

const plainEvents = `const form = document.querySelector('.composer')
const input = document.querySelector('.draft')

form.addEventListener('submit', (event) => {
  event.preventDefault()            // stop the page reload
  send()
})

input.addEventListener('keyup', (event) => {
  if (event.key !== 'Escape') return
  input.value = ''
})

// and later, if this widget is removed:
// form.removeEventListener(...), input.removeEventListener(...)`

const vueEvents = `<template>
  <form class="composer" @submit.prevent="send">
    <input
      class="draft"
      :value="draft"
      @input="onInput"
      @keyup.esc="draft = ''"
    />
  </form>
</template>

<!-- Vue adds the listeners when the component mounts
     and removes them when it unmounts. -->`

export default {
  id: 'v-on-events',
  title: 'Events with v-on & modifiers',
  summary: 'v-on (or @) runs your code when the user clicks, types or submits — and modifiers like .prevent, .stop and .enter remove the usual event boilerplate.',
  difficulty: 'beginner',
  minutes: 24,
  prerequisites: ['v-bind', 'dom-and-events'],
  related: ['v-model-forms', 'emits', 'native-form-handling', 'template-refs', 'accessibility-fundamentals'],
  tags: ['v-on', '@click', 'events', 'event modifiers', 'key modifiers', '.prevent', '.stop', '.self', '.once', '$event'],
  apis: [
    { name: 'v-on:event / @event', summary: 'Listens to a DOM event (or a component event) and runs a handler.' },
    { name: '$event', summary: 'The native event object, available inside inline handlers.' },
    { name: '.stop .prevent .self .capture .once .passive', summary: 'Event modifiers for propagation, default behaviour and listener options.' },
    { name: '.enter .tab .delete .esc .space .up .down .left .right', summary: 'Key modifier aliases; any KeyboardEvent.key in kebab-case also works.' },
    { name: '.ctrl .alt .shift .meta .exact', summary: 'System-modifier keys and exact-combination matching.' },
  ],
  docs: [
    { label: 'Vue Guide — Event Handling', url: 'https://vuejs.org/guide/essentials/event-handling.html' },
    { label: 'API — v-on', url: 'https://vuejs.org/api/built-in-directives.html#v-on' },
  ],

  intro: `
An **event** is something that happens on the page: a click, a key press, a form being submitted, the mouse moving. \`v-on\` tells Vue *"when this event happens on this element, run this code"*:

\`\`\`vue
<button v-on:click="addToCart">Add to cart</button>
<button @click="addToCart">Add to cart</button>   <!-- the same, with the shorthand -->
\`\`\`

\`v-on\` also understands **modifiers** — little suffixes such as \`.prevent\` or \`.enter\` — that handle the most common event chores for you: \`@submit.prevent\` stops a form from reloading the page, \`@keyup.enter\` only reacts to the Enter key.
`,

  why: `
In plain JavaScript, handling an event takes several steps: find the element, call \`addEventListener\`, remember \`event.preventDefault()\` and \`event.stopPropagation()\`, check \`event.key\` by hand, and — easy to forget — remove the listener when the element goes away, or it keeps running and leaks memory.

\`v-on\` folds all of that into the template, right next to the element it belongs to:

- **No element lookups.** The listener is attached to the element it's written on.
- **Automatic cleanup.** Vue removes listeners when the component unmounts.
- **Modifiers** replace repetitive code: \`.prevent\`, \`.stop\`, \`.once\`, \`.enter\`, \`.esc\`, \`.ctrl\`…
- **Direct access to state.** Handlers are your component's own functions, so they can change refs directly — and the template updates.
`,

  eli15: `
Think of a doorbell. Wiring it up means connecting the **button** (the element) to the **chime** (your function). \`@click="ring"\` is that wire.

Modifiers are the settings on the doorbell box:

- \`.once\` — ring only the first time, then go quiet.
- \`.prevent\` — don't do the usual thing (like a form refreshing the page).
- \`.stop\` — don't let the sound travel to the rest of the house (the event stops "bubbling" up to parent elements).
- \`.enter\` — only react if the visitor pressed the Enter key.

You describe *what should happen*; Vue handles the wiring and unplugs it when the door is removed.
`,

  analogy: {
    title: 'A receptionist with standing instructions',
    body: `
Visitors (events) arrive at a desk (an element). The receptionist (Vue) follows your instructions (the handler). Your sticky notes on the desk are modifiers: "deal with it here and don't send them upstairs" (\`.stop\`), "never open the default door" (\`.prevent\`), "only help people who came to *this* desk, not ones walking past" (\`.self\`), "only the first visitor today" (\`.once\`), "only if they show a red badge" (\`.ctrl\`).

When the desk is closed down, the receptionist goes home too — Vue removes the listener.
`,
    mapping: [
      ['a visitor arriving', 'an event (click, keyup, submit)'],
      ['the desk', 'the element with `@event`'],
      ['the instructions', 'your handler function'],
      ['sticky notes', 'modifiers: `.stop`, `.prevent`, `.self`, `.once`, `.ctrl`'],
      ['visitors walking upstairs', 'event bubbling to parent elements'],
      ['closing the desk', 'unmounting — Vue removes the listener'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'v-on' },
    title: 'v-on in the real DOM',
    caption: 'Fire events, toggle modifiers and watch which handlers run — and in which order the event travels through the elements.',
    alt: 'An interactive lab with nested elements and @click listeners. Toggling modifiers like .stop, .self and .once changes which handlers run when you click the inner or outer element; an event log lists each handler call in order.',
  },

  syntax: [
    `
#### Two kinds of handlers
`,
    {
      code: `<!-- 1. Method handler: the name of a function. It receives the native event. -->
<button @click="addToCart">Add</button>

<!-- 2. Inline handler: a JavaScript statement that runs on the event. -->
<button @click="count++">+1</button>
<button @click="addToCart(product)">Add</button>
<button @click="addToCart(product, $event)">Add</button>       <!-- $event = the native event -->
<button @click="(event) => addToCart(product, event)">Add</button>`,
      lang: 'vue',
      title: 'method vs inline handlers',
    },
    `
Vue looks at the value: if it is just a function name or property path (\`addToCart\`, \`cart.add\`), Vue calls it **with the event** as the first argument. Anything else is treated as inline code and wrapped in a function — so \`@click="addToCart(product)"\` does **not** run during rendering; it runs on each click.
`,
    {
      code: `<script setup>
function addToCart(event) {
  console.log(event.type)          // "click"
  console.log(event.target.tagName) // "BUTTON"
}
</script>`,
      lang: 'vue',
      title: 'a method handler receives the event',
      static: true,
    },
    `
#### Event modifiers
`,
    {
      code: `<form @submit.prevent="save">            <!-- event.preventDefault(): no page reload -->
<a @click.stop="track">                  <!-- event.stopPropagation(): parents don't hear it -->
<div @click.self="close">                <!-- only if the click started on THIS element, not a child -->
<button @click.once="claimReward">       <!-- runs at most once -->
<div @click.capture="log">               <!-- listen during the capture phase (outer → inner) -->
<div @scroll.passive="onScroll">         <!-- tells the browser you won't call preventDefault() -->
<a @click.stop.prevent="openMenu">       <!-- modifiers can be chained -->
<form @submit.prevent>                   <!-- a modifier alone, no handler -->`,
      lang: 'vue',
      title: 'event modifiers',
    },
    `
**Order matters** when chaining: modifiers apply left to right. \`@click.prevent.self\` prevents the default action for clicks on the element *and its children*, while \`@click.self.prevent\` only prevents clicks on the element itself. And don't combine \`.passive\` with \`.prevent\` — \`.passive\` promises the browser you won't prevent the default, so \`.prevent\` would be ignored (and the browser may warn).

#### Key modifiers
`,
    {
      code: `<input @keyup.enter="search" />           <!-- Enter -->
<input @keyup.esc="clear" />              <!-- Escape -->
<input @keydown.up="previous" @keydown.down="next" />
<input @keyup.page-down="nextPage" />     <!-- any KeyboardEvent.key, in kebab-case -->
<textarea @keydown.ctrl.enter="send" />   <!-- Ctrl + Enter -->
<button @click.ctrl.exact="selectOne">    <!-- Ctrl and NO other modifier keys -->
<button @click.exact="open">              <!-- no modifier keys at all -->
<div @contextmenu.prevent @mousedown.right="openMenu">  <!-- mouse buttons: .left .right .middle -->`,
      lang: 'vue',
      title: 'key and mouse modifiers',
    },
    `
- Aliases: \`.enter\`, \`.tab\`, \`.delete\` (both Delete **and** Backspace), \`.esc\`, \`.space\`, \`.up\`, \`.down\`, \`.left\`, \`.right\`.
- System modifiers: \`.ctrl\`, \`.alt\`, \`.shift\`, \`.meta\` (⌘ on Mac, ⊞ on Windows). With \`keyup\`, they must be *held* when the other key is released: \`@keyup.ctrl\` alone won't fire just from releasing Ctrl.
- \`.exact\` demands that **only** the listed modifier keys are pressed — without it, \`@keydown.up\` also fires for Shift + ↑.

#### Events from components

The same syntax listens to *custom* events that child components emit: \`<CartItem @remove="removeItem" />\`. That's covered in [Custom events with emits](lesson:emits).
`,
    {
      callout: 'version',
      title: 'Vue 2 → Vue 3',
      text: 'Numeric key-code modifiers such as `@keyup.13` were removed in Vue 3 — use key names (`.enter`). The `.native` modifier for components was removed too; see [Fallthrough attributes](lesson:fallthrough-attrs) for how native listeners reach a component\'s root element now.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: chatApp,
    intro: 'A small chat composer that uses a method handler, an inline handler and an event modifier.',
    steps: [
      { lines: [4, 6], text: 'Three refs: the text being typed, the list of sent messages, and a counter for clicks anywhere on the card.' },
      { lines: [8, 10], text: 'A **method handler** for the `input` event. Vue passes the native event, so `event.target.value` is the text in the box.' },
      { lines: [12, 16], text: '`send()` ignores empty drafts, stores the message and clears the draft. Because `draft` is reactive and bound to the input, the box empties itself.' },
      { lines: [20], text: '`@click="cardClicks++"` is an **inline handler** on the whole card. Every click inside the card *bubbles up* to it — including clicks on the input and button.' },
      { lines: [22], text: '`@submit.prevent="send"` — the `.prevent` modifier calls `event.preventDefault()`, so submitting (Enter or the Send button) doesn\'t reload the page.' },
      { lines: [23], text: '`:value` + `@input` keeps the input and `draft` in sync by hand. This exact pair is what `v-model` does for you — next up in [v-model](lesson:v-model-forms).' },
      { lines: [26, 27], text: 'Both lines re-render whenever their state changes. Watch the card counter: it increases even when you click the input — that is bubbling.' },
    ],
  },

  playground: {
    title: 'Chat composer',
    objective: 'Add key modifiers, inline handlers with arguments, and stop event bubbling — then see what each change does.',
    files: { 'App.vue': chatApp },
    expected: 'Type a message and press Enter or **Send**: the count goes up and the box clears, without a page reload. Notice that clicking anywhere inside the card — even the input — increases **Card clicked**.',
    experiments: [
      {
        id: 'escape-clears',
        task: 'Pressing **Escape** inside the input should clear the draft.',
        hint: 'Add `@keyup.esc="draft = \'\'"` to the `<input>`.',
        tests: [
          {
            name: 'Escape clears the draft',
            code: `await type('.draft', 'hello there')
await trigger('.draft', 'keyup', { key: 'Escape' })
expect(find('.draft').value).toBe('')
expect(state.draft).toBe('')`,
          },
        ],
        explain: '`.esc` is a key modifier: Vue checks `event.key` for you and only runs the handler for Escape. No `if (event.key === …)` needed.',
      },
      {
        id: 'emoji',
        task: 'Add a button with `class="emoji"` and the label 👍 **outside** the form (just under it). Clicking it should append 👍 to the draft. Write a function `addEmoji(symbol)` and call it with an argument.',
        hint: '`function addEmoji(symbol) { draft.value += symbol }` and `<button class="emoji" @click="addEmoji(\'👍\')">👍</button>`.',
        tests: [
          {
            name: 'the emoji button appends to the draft',
            code: `await type('.draft', 'Nice')
await click('.emoji')
expect(find('.draft').value).toBe('Nice👍')`,
          },
        ],
        explain: '`addEmoji(\'👍\')` is an **inline handler**: Vue wraps it in a function and calls it on each click. If you also needed the event, you would pass `$event` as an extra argument.',
      },
      {
        id: 'stop-bubbling',
        task: 'Clicks inside the composer shouldn\'t count as card clicks. Stop them from bubbling up — but clicks on the title must still count.',
        hint: 'Add `@click.stop` (no handler needed) to the `<form>`.',
        tests: [
          {
            name: 'composer clicks don\'t reach the card, title clicks do',
            code: `await click('.draft')
await click('.send')
expect(state.cardClicks).toBe(0)
await click('.title')
expect(state.cardClicks).toBe(1)`,
          },
        ],
        explain: 'Events *bubble*: a click on the button is also a click on the form, the card and the page. `.stop` calls `event.stopPropagation()` at the form, so ancestors never hear it. Use it deliberately — stopped events are invisible to anything listening higher up, like analytics or "click outside" handlers.',
      },
      {
        id: 'remove-prevent',
        task: 'Remove `.prevent` from `@submit.prevent` and press **Send**. Then put it back.',
        hint: 'In a normal browser tab the whole page would reload and your messages would vanish.',
        explain: 'A form\'s default action is to navigate (reload the page). This sandbox blocks that and shows a warning, but in a real app forgetting `.prevent` wipes the app\'s state on every submit.',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Listening to events: by hand vs v-on',
    props: {
      left: { label: 'Plain JavaScript', lang: 'js', code: plainEvents },
      right: { label: 'Vue with v-on', lang: 'vue', code: vueEvents },
      points: [
        'Plain JS must find elements first; `@event` is written on the element itself.',
        '`event.preventDefault()` becomes the `.prevent` modifier.',
        '`if (event.key !== \'Escape\') return` becomes the `.esc` key modifier.',
        'Vue removes the listeners automatically when the component unmounts — no forgotten cleanup.',
      ],
    },
    caption: 'The behaviour is identical; v-on removes the bookkeeping.',
    alt: 'Two panels. Left: plain JavaScript that queries the form and input, adds submit and keyup listeners with preventDefault and a key check, and notes that the listeners must be removed later. Right: a Vue template with @submit.prevent and @keyup.esc on the elements.',
  },

  internals: {
    beginner: `
When the template compiles, \`@click="addToCart"\` becomes an \`onClick\` entry on the element. The first time Vue creates the button, it calls \`addEventListener('click', …)\` for you. Later re-renders don't add more listeners — Vue just makes sure the latest handler is the one that runs. When the component is removed, Vue removes the listener.
`,
    technical: [
      `
**Compilation.** \`@click\` becomes an \`onClick\` prop on the virtual node. Inline statements are wrapped in an arrow function. Modifiers that affect the *handler* are applied with helpers: \`withModifiers(fn, ['stop', 'prevent'])\` and \`withKeys(fn, ['enter'])\` return wrapped functions that call \`stopPropagation()\`/\`preventDefault()\` or check \`event.key\` first. Modifiers that affect the *listener options* — \`.once\`, \`.capture\`, \`.passive\` — are encoded in the prop name (\`onClickOnce\`, \`onScrollPassive\`) and passed to \`addEventListener\`.
`,
      {
        code: `// <form @submit.prevent="send">  and  <input @keyup.esc="draft = ''">
// compile to roughly (simplified):
h('form', { onSubmit: withModifiers(send, ['prevent']) }, [
  h('input', { onKeyup: withKeys(($event) => (draft.value = ''), ['esc']) }),
])`,
        lang: 'js',
        title: 'compiled listeners (simplified)',
      },
      `
**Patching.** \`@vue/runtime-dom\` attaches a small *invoker* function as the real listener and stores your handler on it. When a re-render produces a new handler (inline arrow functions are new on every render), Vue only swaps \`invoker.value\` — no \`removeEventListener\`/\`addEventListener\` churn. On unmount, the invoker is removed. Errors thrown inside handlers are routed to \`app.config.errorHandler\`.
`,
    ],
    production: `
- **Use real buttons.** \`<div @click>\` is invisible to keyboards and screen readers. A \`<button type="button">\` gets focus, Enter/Space activation and the right role for free. See [Accessibility fundamentals](lesson:accessibility-fundamentals).
- **Global listeners need manual cleanup.** \`v-on\` only manages listeners in templates. For \`window\`/\`document\` events (resize, global shortcuts), add the listener in \`onMounted\` and remove it in \`onUnmounted\` — or wrap that in a composable. See [Lifecycle hooks](lesson:lifecycle-hooks).
- **Expensive handlers on frequent events** (\`input\`, \`scroll\`, \`mousemove\`) should be debounced or throttled. See [Runtime performance](lesson:runtime-performance).
- **Double submits:** disable the button while a request is pending; \`.once\` is rarely right because it never re-enables after a failure. The backend should also make important actions idempotent.
- **Prefer \`.self\` or better structure over sprinkling \`.stop\`** — stopped events break analytics, outside-click detection and parent logic you can't see.
`,
  },

  mistakes: [
    {
      title: 'Forgetting .prevent on a form',
      wrong: { code: `<form @submit="save">  <!-- the page reloads after save() -->`, lang: 'vue' },
      right: { code: `<form @submit.prevent="save">`, lang: 'vue' },
      explanation: 'Submitting a form navigates by default. The reload throws away all of your app\'s state. `.prevent` cancels the default action.',
    },
    {
      title: 'Passing an argument and losing the event',
      wrong: { code: `<button @click="remove(item)">✕</button>\n\n<script setup>\nfunction remove(item, event) {\n  event.stopPropagation() // TypeError: event is undefined\n}\n</script>`, lang: 'vue' },
      right: { code: `<button @click="remove(item, $event)">✕</button>`, lang: 'vue' },
      explanation: 'Only *method* handlers (`@click="remove"`) receive the event automatically. In an inline call, pass `$event` yourself — or use a modifier (`@click.stop="remove(item)"`).',
    },
    {
      title: 'Making a div clickable instead of using a button',
      wrong: { code: `<div class="btn" @click="save">Save</div>`, lang: 'vue' },
      right: { code: `<button type="button" class="btn" @click="save">Save</button>`, lang: 'vue' },
      explanation: 'Keyboard users can\'t focus or activate a `<div>`, and screen readers don\'t announce it as a button. A real `<button>` handles all of that.',
    },
    {
      title: 'Using Vue 2 key codes',
      wrong: { code: `<input @keyup.13="search" />`, lang: 'vue' },
      right: { code: `<input @keyup.enter="search" />`, lang: 'vue' },
      explanation: 'Numeric key codes were removed in Vue 3 (and `keyCode` is deprecated in browsers). Use key names.',
    },
  ],

  debugging: [
    {
      symptom: 'The page reloads (or the sandbox warns) when a form is submitted.',
      cause: 'The `submit` event\'s default action was not prevented.',
      fix: 'Use `@submit.prevent="handler"`.',
    },
    {
      symptom: 'Clicking inside a modal closes it.',
      cause: 'The click bubbles from the dialog to the backdrop, whose `@click` closes the modal.',
      fix: 'Use `@click.self="close"` on the backdrop so only clicks that start on the backdrop itself count.',
    },
    {
      symptom: '`event` is `undefined` inside a handler.',
      cause: 'The handler was called inline with arguments (`@click="fn(x)"`), so Vue did not pass the event.',
      fix: 'Pass `$event` explicitly: `@click="fn(x, $event)"`.',
    },
    {
      symptom: 'A shortcut like Shift + ↑ triggers both the "up" and the "shift up" handlers.',
      cause: 'Key modifiers match when the listed keys are pressed, even if others are too.',
      fix: 'Add `.exact` to the plain version: `@keydown.up.exact`.',
    },
    {
      symptom: 'A keyboard handler on `window` runs two, three, four times after navigating around.',
      cause: 'Each mount added a `window.addEventListener` that was never removed.',
      fix: 'Add it in `onMounted` and remove the same function in `onUnmounted`.',
    },
  ],

  bestPractices: [
    'Use `@` everywhere; keep handlers short and move logic into named functions.',
    'Use method handlers (`@click="save"`) when you need the event, inline calls (`@click="remove(item)"`) when you need arguments.',
    'Always `@submit.prevent` on forms handled by JavaScript.',
    'Put click handlers on `<button>`s, not `<div>`s.',
    'Prefer `.self` or better structure over scattering `.stop`.',
    'Clean up `window`/`document` listeners yourself; Vue only manages template listeners.',
  ],

  useCases: [
    'Buttons: add to cart, like, delete, open menu.',
    'Forms: `@submit.prevent` to validate and send data with JavaScript.',
    'Keyboard UX: Enter to search, Escape to close or clear, arrow keys to move through a list.',
    'Modals and dropdowns: close on backdrop click with `.self`.',
    'Listening to custom events from child components: `<TodoItem @toggle="…" />`.',
  ],

  whenToUse: {
    use: [
      'Any user interaction on an element in your template.',
      'Modifiers whenever you would otherwise write `preventDefault`, `stopPropagation` or key checks by hand.',
    ],
    avoid: [
      'Global events on `window`/`document` — `v-on` can\'t attach those; use lifecycle hooks or a composable.',
      'Simple two-way input binding — `v-model` is shorter and clearer than `:value` + `@input`.',
      'Using `.stop` as a quick fix for a bubbling bug you don\'t understand.',
    ],
  },

  comparison: {
    title: 'Three ways to handle a click',
    headers: ['', '`addEventListener`', '`@click` (v-on)', 'HTML `onclick="…"`'],
    rows: [
      ['Where the code lives', 'a script that must find the element', 'on the element in the template', 'an attribute string'],
      ['Cleanup', 'manual `removeEventListener`', 'automatic on unmount', 'when the element is removed'],
      ['preventDefault / stopPropagation', 'write it yourself', '`.prevent` / `.stop`', 'write it yourself'],
      ['Key filtering', '`if (e.key === \'Enter\')`', '`.enter`, `.esc`, `.ctrl.enter`…', 'manual'],
      ['Access to component state', 'via closures', 'direct', 'globals only (and blocked by strict CSP)'],
    ],
  },

  quiz: [
    {
      id: 'v-on-events-q1',
      type: 'mcq',
      prompt: '`<button @click="save">` is shorthand for…',
      options: [
        { text: '`<button v-on:click="save">`' },
        { text: '`<button v-bind:click="save">`', why: '`v-bind` sets attributes; its shorthand is `:`.' },
        { text: '`<button onclick="save">`', why: 'That is a native HTML attribute that runs a global string of code, not a Vue listener.' },
        { text: '`<button v-model:click="save">`', why: '`v-model` creates two-way bindings, not event listeners.' },
      ],
      answer: 0,
      explanation: '`@` is the shorthand for `v-on:`.',
    },
    {
      id: 'v-on-events-q2',
      type: 'output',
      prompt: 'The button is clicked **three** times. What does it show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const points = ref(0)
</script>

<template>
  <button @click.once="points += 10">{{ points }} points</button>
</template>`,
      },
      options: [
        { text: '10 points' },
        { text: '30 points', why: '`.once` removes the listener after its first call, so later clicks do nothing.' },
        { text: '0 points', why: 'The first click does run the handler.' },
        { text: '1 points', why: 'The handler adds 10, not 1.' },
      ],
      answer: 0,
      explanation: '`.once` means the handler runs at most once. Clicks 2 and 3 are ignored.',
    },
    {
      id: 'v-on-events-q3',
      type: 'bug',
      prompt: 'Every time the user signs up, the page reloads and the success message never appears. Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const done = ref(false)
function signUp() {
  done.value = true
}
</script>

<template>
  <form @submit="signUp">
    <input type="email" required />
    <button>Sign up</button>
  </form>
  <p v-if="done">Welcome aboard!</p>
</template>`,
      },
      answerLine: 10,
      explanation: 'Without `.prevent`, the browser performs the form\'s default action and reloads the page. Use `@submit.prevent="signUp"`.',
    },
    {
      id: 'v-on-events-q4',
      type: 'fill',
      prompt: 'Run `search` when Enter is released in the input, and close the modal only when the backdrop itself (not its content) is clicked.',
      code: { lang: 'vue', code: `<input @keyup.___="search" />\n\n<div class="backdrop" @click.___="close">\n  <div class="dialog">…</div>\n</div>` },
      answer: [['enter'], ['self']],
      explanation: '`.enter` filters by key; `.self` only runs the handler when `event.target` is the element itself.',
    },
    {
      id: 'v-on-events-q5',
      type: 'mcq',
      prompt: 'What is the difference between `@click="greet"` and `@click="greet()"`?',
      options: [
        { text: 'Both call `greet` on click; the first receives the native event as an argument, the second gets no arguments.' },
        { text: 'The second calls `greet` once during rendering, not on click.', why: 'Vue wraps inline handlers in a function, so `greet()` runs on each click, not during render.' },
        { text: 'There is no difference at all.', why: 'There is one: only the method-handler form passes the event automatically.' },
        { text: 'Only the second one works.', why: 'Both are valid Vue syntax.' },
      ],
      answer: 0,
      explanation: 'A bare function name is a method handler and gets the event. Anything else is an inline handler; pass `$event` if you need the event there.',
    },
    {
      id: 'v-on-events-q6',
      type: 'mcq',
      prompt: 'Select **all** keys that trigger `@keydown.delete`.',
      options: [
        { text: 'Delete' },
        { text: 'Backspace' },
        { text: 'Escape', why: 'Escape is `.esc`.' },
        { text: 'Space', why: 'Space is `.space`.' },
      ],
      answer: [0, 1],
      explanation: 'The `.delete` alias captures both the Delete and the Backspace keys.',
    },
    {
      id: 'v-on-events-q7',
      type: 'short',
      prompt: 'A dropdown closes when you click a menu item inside it, because the document-level "click outside" logic also sees the click. A teammate suggests adding `.stop` to every menu item. What are the trade-offs, and what might be better?',
      answer: '`.stop` would work but hides those clicks from everything above — analytics, other listeners, parent components — and has to be remembered on every item. Better: make the outside-click logic check whether the click target is inside the dropdown element (`dropdownEl.contains(event.target)`), or use `.self` on the element whose own clicks should count. Fix the logic instead of muting events.',
    },
  ],

  exercises: [
    {
      id: 'keyboard-stepper',
      title: 'A keyboard-controlled quantity field',
      difficulty: 'beginner',
      prompt: `
Make the quantity box \`<input class="qty">\` respond to the keyboard (use \`keydown\`):

- **↑** adds 1, **↓** subtracts 1 (never below 1).
- **Shift + ↑** adds **10** (and must *not* also add 1).
- **Escape** resets to 1.
- Clicking \`.plus\` / \`.minus\` buttons still works.

The quantity lives in a ref called \`qty\`, shown as the input's value.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const qty = ref(1)

function increase(amount) {
  qty.value += amount
}

function decrease() {
  if (qty.value > 1) qty.value--
}
</script>

<template>
  <label>
    Quantity
    <input class="qty" :value="qty" readonly />
  </label>
  <button class="minus" @click="decrease">−</button>
  <button class="plus" @click="increase(1)">+</button>
</template>`,
      },
      hints: [
        'Key modifiers for arrows are `.up` and `.down`: `@keydown.down="decrease"`.',
        'Shift + ↑ is `@keydown.shift.up="increase(10)"`. Without `.exact`, the plain `@keydown.up` handler would also fire for Shift + ↑.',
        'Final set: `@keydown.up.exact="increase(1)" @keydown.shift.up="increase(10)" @keydown.down="decrease" @keydown.esc="qty = 1"`.',
      ],
      solution: {
        explanation: 'Each shortcut is one listener with key modifiers. `.exact` on the plain ↑ handler makes it ignore presses where Shift (or any other modifier) is held, so Shift + ↑ adds exactly 10.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const qty = ref(1)

function increase(amount) {
  qty.value += amount
}

function decrease() {
  if (qty.value > 1) qty.value--
}
</script>

<template>
  <label>
    Quantity
    <input
      class="qty"
      :value="qty"
      readonly
      @keydown.up.exact="increase(1)"
      @keydown.shift.up="increase(10)"
      @keydown.down="decrease"
      @keydown.esc="qty = 1"
    />
  </label>
  <button class="minus" @click="decrease">−</button>
  <button class="plus" @click="increase(1)">+</button>
</template>`,
        },
      },
      tests: [
        {
          name: '↑ and ↓ change the quantity',
          code: `await trigger('.qty', 'keydown', { key: 'ArrowUp' })
await trigger('.qty', 'keydown', { key: 'ArrowUp' })
expect(state.qty).toBe(3)
await trigger('.qty', 'keydown', { key: 'ArrowDown' })
expect(state.qty).toBe(2)`,
        },
        { name: 'Shift + ↑ adds exactly 10', code: `await trigger('.qty', 'keydown', { key: 'ArrowUp', shiftKey: true }); expect(state.qty).toBe(11)` },
        { name: 'never below 1', code: `await trigger('.qty', 'keydown', { key: 'ArrowDown' }); await trigger('.qty', 'keydown', { key: 'ArrowDown' }); expect(state.qty).toBe(1)` },
        { name: 'Escape resets to 1', code: `await click('.plus'); await click('.plus'); await trigger('.qty', 'keydown', { key: 'Escape' }); expect(state.qty).toBe(1); expect(find('.qty').value).toBe('1')` },
      ],
    },
    {
      id: 'backdrop-modal',
      title: 'A modal that closes on backdrop click',
      difficulty: 'beginner',
      prompt: `
The modal closes when you click **anywhere** — even inside the dialog. Fix it:

- \`.open-btn\` opens the modal.
- Clicking the dark \`.backdrop\` closes it.
- Clicking inside \`.dialog\` (text, input) must **not** close it.
- \`.close-btn\` inside the dialog closes it.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <button class="open-btn" @click="open = true">Open settings</button>

  <div v-if="open" class="backdrop" @click="open = false">
    <div class="dialog" role="dialog" aria-label="Settings">
      <h2>Settings</h2>
      <input class="nickname" placeholder="Nickname" />
      <button class="close-btn" @click="open = false">Close</button>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  display: grid;
  place-items: center;
}
.dialog {
  background: white;
  padding: 1rem;
  border: 2px solid #222;
}
</style>`,
      },
      hints: [
        'Clicks inside the dialog *bubble up* to the backdrop and trigger its handler.',
        'You want the backdrop handler to run only when the click *started* on the backdrop itself.',
        'Change the backdrop listener to `@click.self="open = false"`.',
      ],
      solution: {
        explanation: '`.self` only runs the handler when `event.target` is the backdrop element itself. Clicks on the dialog still bubble to the backdrop, but their target is the dialog (or something inside it), so the handler is skipped. No `.stop` needed — other listeners can still hear those clicks.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const open = ref(false)
</script>

<template>
  <button class="open-btn" @click="open = true">Open settings</button>

  <div v-if="open" class="backdrop" @click.self="open = false">
    <div class="dialog" role="dialog" aria-label="Settings">
      <h2>Settings</h2>
      <input class="nickname" placeholder="Nickname" />
      <button class="close-btn" @click="open = false">Close</button>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.5);
  display: grid;
  place-items: center;
}
.dialog {
  background: white;
  padding: 1rem;
  border: 2px solid #222;
}
</style>`,
        },
      },
      tests: [
        { name: 'opens', code: `await click('.open-btn'); expect(exists('.dialog')).toBe(true)` },
        { name: 'clicking inside the dialog keeps it open', code: `await click('.open-btn'); await click('.dialog'); await click('.nickname'); expect(exists('.dialog')).toBe(true)` },
        { name: 'clicking the backdrop closes it', code: `await click('.open-btn'); await click('.backdrop'); expect(exists('.dialog')).toBe(false)` },
        { name: 'the close button closes it', code: `await click('.open-btn'); await click('.close-btn'); expect(exists('.dialog')).toBe(false)` },
      ],
    },
  ],

  interview: [
    {
      id: 'v-on-events-handler-types',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between a method handler and an inline handler in `v-on`, and how do you access the event in each?',
      answer: 'A method handler is just a function name or path (`@click="save"`); Vue calls it with the native event as the first argument. An inline handler is any other JavaScript (`@click="count++"`, `@click="remove(item)"`); Vue wraps it in a function, and you access the event through the special `$event` variable or by writing an arrow function `(e) => remove(item, e)`.',
      explanation: 'Name → event passed automatically. Code → wrap and use `$event`.',
      whyAsked: 'Basic but frequently misunderstood, especially by developers coming from React.',
      mistakes: ['Thinking `@click="fn()"` runs during render.', 'Not knowing `$event`.'],
      followUps: ['How does Vue decide which kind a handler is?', 'When would you use an arrow function in a handler?'],
      modelAnswer: "If the value is just a function name or property path, it's a method handler, and Vue calls it with the native event as its first argument. Anything else — an expression like count++ or a call with arguments — is an inline handler that Vue wraps in a function, so it runs on the event, not during render. In inline handlers I get the event through $event, or by writing an explicit arrow function. Typically I use method handlers when I need the event and inline calls when I need to pass data like the current item.",
    },
    {
      id: 'v-on-events-modifier-list',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Name Vue\'s event modifiers and explain what each one does.',
      answer: '`.stop` calls `stopPropagation()`; `.prevent` calls `preventDefault()`; `.self` runs the handler only when `event.target` is the element itself; `.capture` listens in the capture phase; `.once` removes the listener after the first call; `.passive` registers a passive listener (you promise not to call `preventDefault()`, which lets the browser start scrolling immediately). Modifiers chain left to right, so order matters, and `.passive` should not be combined with `.prevent`.',
      explanation: 'Two groups: those that wrap your handler (stop, prevent, self, keys) and those that change listener options (capture, once, passive).',
      whyAsked: 'Checks practical fluency with everyday template code.',
      mistakes: ['Confusing `.stop` and `.prevent`.', 'Not knowing what `.passive` is for.', 'Ignoring modifier order.'],
      followUps: ['Why does modifier order matter?', 'What happens if you use .passive and .prevent together?'],
      modelAnswer: "There are six. stop calls stopPropagation so parents don't receive the event; prevent calls preventDefault, which I use on form submits; self only runs the handler when the event target is the element itself, not a child; capture listens during the capture phase instead of bubbling; once removes the listener after the first call; and passive registers a passive listener, telling the browser I won't prevent the default so it can scroll immediately. They're applied left to right, so order matters, and combining passive with prevent makes no sense — the prevent would be ignored.",
    },
    {
      id: 'v-on-events-stop-vs-self',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'For a modal backdrop that should close on outside clicks, compare putting `.stop` on the dialog vs `.self` on the backdrop.',
      answer: '`.stop` on the dialog stops every click inside it from bubbling, so the backdrop never sees them — but neither does anything else above (analytics, global listeners, other parents). `.self` on the backdrop lets events bubble normally and simply ignores those whose target is not the backdrop itself. `.self` is more local and has fewer side effects.',
      explanation: '`.stop` mutes the event for everyone; `.self` just filters it for one listener.',
      code: {
        lang: 'vue',
        code: `<!-- ✅ preferred -->
<div class="backdrop" @click.self="close">
  <div class="dialog">…</div>
</div>

<!-- works, but hides dialog clicks from every ancestor -->
<div class="backdrop" @click="close">
  <div class="dialog" @click.stop>…</div>
</div>`,
      },
      whyAsked: 'Event propagation is a common source of UI bugs; interviewers want to see you choose the least invasive fix.',
      mistakes: ['Saying they are equivalent.', 'Defaulting to `.stop` everywhere.'],
      followUps: ['How would you implement click-outside for a dropdown?', 'What is the capture phase?'],
      modelAnswer: "Both make inside clicks not close the modal, but they differ in side effects. stop on the dialog calls stopPropagation, so no ancestor ever sees those clicks — that can silently break analytics or other listeners higher up. self on the backdrop leaves propagation alone and simply ignores events whose target isn't the backdrop itself. I'd use self because it's local to the one listener that cares.",
    },
    {
      id: 'v-on-events-modifier-order',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'The user clicks the `<span>` inside each link. Which links navigate to `/x`?',
      code: {
        lang: 'vue',
        code: `<a href="/x" class="a" @click.self.prevent="track"><span>A</span></a>
<a href="/x" class="b" @click.prevent.self="track"><span>B</span></a>`,
      },
      options: ['Only A navigates', 'Only B navigates', 'Both navigate', 'Neither navigates'],
      correctOption: 0,
      answer: 'Only **A** navigates. Modifiers apply left to right. In A, `.self` runs first: the target is the span, not the link, so the handler — including `.prevent` — is skipped and the browser follows the link. In B, `.prevent` runs first for every click, then `.self` skips `track`; navigation is prevented.',
      explanation: 'Read modifier chains as a pipeline from left to right.',
      whyAsked: 'Tests precise understanding rather than memorised modifier names.',
      mistakes: ['Assuming modifier order is irrelevant.', 'Forgetting that the click target is the span.'],
      followUps: ['Is `track` called in either case?', 'How would you prevent navigation but only track clicks on the link itself?'],
      modelAnswer: "Only A navigates. Modifiers are applied in order. In A, self comes first; the click target is the span, so the whole handler is skipped — including prevent — and the browser navigates. In B, prevent comes first and runs for every click on the link or its children, then self skips track. So in neither case is track called for a span click, but only B stops navigation.",
    },
    {
      id: 'v-on-events-global-listener',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A component registers `window.addEventListener(\'keydown\', onKey)` in `<script setup>`. After navigating away and back a few times, each key press triggers `onKey` several times and memory usage grows. Explain and fix.',
      answer: '`v-on` only manages listeners declared in the template. A manual `window` listener added on every setup is never removed, so each mount adds another one, and each keeps the old component instance alive (a memory leak). Add it in `onMounted` and remove the same function reference in `onUnmounted` — or extract a `useEventListener` composable that does both.',
      explanation: 'Whatever you add by hand, you must remove by hand.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { onMounted, onUnmounted } from 'vue'

function onKey(event) {
  if (event.key === '/') focusSearch()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>`,
      },
      whyAsked: 'Leaking global listeners is one of the most common production bugs in SPAs.',
      mistakes: ['Removing with a different (new) function reference.', 'Assuming Vue cleans up all listeners automatically.'],
      followUps: ['Why must the function reference be the same?', 'How would you write a reusable composable for this?'],
      modelAnswer: "Vue only cleans up listeners it created from the template. This one is attached manually to window on every mount and never removed, so each visit stacks another listener, and each closure keeps the old component alive — a leak. The fix is to pair it with the lifecycle: add the listener in onMounted and remove the exact same function in onUnmounted. Since this pattern repeats, I'd wrap it in a useEventListener composable that registers and cleans up automatically.",
    },
    {
      id: 'v-on-events-double-submit',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Customers double-click **Pay** and sometimes get charged twice. A colleague proposes `@click.once`. What would you do instead?',
      answer: '`.once` never re-enables the button, so a failed payment could not be retried without a reload. Track a `paying` state: set it before the request, disable the button (`:disabled="paying"`) and ignore clicks while it is true, then reset it in `finally`. Most importantly, the backend should make the charge idempotent (for example with an idempotency key), because the frontend cannot guarantee a single request.',
      explanation: 'UI prevents most duplicates; the server must prevent all of them.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const paying = ref(false)
async function pay() {
  if (paying.value) return
  paying.value = true
  try {
    await api.charge(orderId)
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <button :disabled="paying" @click="pay">{{ paying ? 'Paying…' : 'Pay' }}</button>
</template>`,
      },
      whyAsked: 'Combines events, state and real-world reliability; reveals whether you think beyond the UI.',
      mistakes: ['Relying only on the frontend.', 'Using `.once` and breaking retries.', 'Not resetting the state on errors.'],
      followUps: ['What is an idempotency key?', 'How would you show progress to screen-reader users?'],
      modelAnswer: "once is a poor fit because the listener is gone forever, so a declined card couldn't be retried. I'd keep a paying flag: return early if it's set, set it before the request, bind it to disabled and a 'Paying…' label, and reset it in a finally block so errors re-enable the button. But the UI can't guarantee a single request — network retries or two tabs can still duplicate it — so the payment endpoint should be idempotent, for example using an idempotency key per order.",
    },
    {
      id: 'v-on-events-coding-search',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Build a search box: pressing **Enter** in `.search` runs a search (adds the trimmed term to `history` and shows it in `.last-search`), empty terms are ignored, and **Escape** clears the input.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const term = ref('')
const history = ref([])
</script>

<template>
  <input class="search" :value="term" @input="term = $event.target.value" placeholder="Search…" />
  <p class="last-search">{{ history[history.length - 1] || 'No searches yet' }}</p>
  <p class="count">{{ history.length }} searches</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'Enter searches with the trimmed term',
          code: `await type('.search', '  vue router ')
await trigger('.search', 'keyup', { key: 'Enter' })
expect(text('.last-search')).toBe('vue router')
expect(text('.count')).toBe('1 searches')`,
        },
        { name: 'empty terms are ignored', code: `await type('.search', '   '); await trigger('.search', 'keyup', { key: 'Enter' }); expect(text('.count')).toBe('0 searches')` },
        { name: 'Escape clears the input', code: `await type('.search', 'pinia'); await trigger('.search', 'keyup', { key: 'Escape' }); expect(find('.search').value).toBe('')` },
      ],
      hints: ['Write a `search()` function that trims `term.value`, returns early if empty, and pushes to `history.value`.', 'Add `@keyup.enter="search"` and `@keyup.esc="term = \'\'"` to the input.'],
      answer: 'Two key-modified listeners on the input: `.enter` calls `search()`, `.esc` clears `term`.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const term = ref('')
const history = ref([])

function search() {
  const value = term.value.trim()
  if (!value) return
  history.value.push(value)
}
</script>

<template>
  <input
    class="search"
    :value="term"
    @input="term = $event.target.value"
    @keyup.enter="search"
    @keyup.esc="term = ''"
    placeholder="Search…"
  />
  <p class="last-search">{{ history[history.length - 1] || 'No searches yet' }}</p>
  <p class="count">{{ history.length }} searches</p>
</template>`,
        },
      },
      explanation: 'Key modifiers keep the template declarative: each shortcut is one attribute, and the logic stays in a named function.',
      whyAsked: 'A realistic small task that exercises key modifiers and state.',
      mistakes: ['Checking `event.key` manually inside one big handler.', 'Not trimming input.'],
      followUps: ['How would you debounce a search-as-you-type version?', 'How would you avoid duplicate history entries?'],
      modelAnswer: "I'd add two listeners to the input: keyup.enter calls a search function that trims the term, ignores empty values and pushes into history; keyup.esc resets the term, which clears the input through the value binding. For search-as-you-type I'd switch to the input event with a debounce so we don't search on every keystroke.",
    },
  ],

  takeaways: [
    '`v-on:event` — written `@event` — runs code when an event fires; Vue adds and removes the listener for you.',
    'Method handlers (`@click="save"`) receive the event; inline handlers (`@click="remove(item)"`) use `$event` if needed.',
    'Event modifiers: `.prevent`, `.stop`, `.self`, `.once`, `.capture`, `.passive` — applied left to right.',
    'Key modifiers: `.enter`, `.esc`, `.delete`, arrows, any key in kebab-case, plus `.ctrl/.alt/.shift/.meta` and `.exact`.',
    'Use `<button>`s for clickable things and clean up `window` listeners yourself.',
  ],
}
