// Lesson: Conditional rendering — v-if vs v-show

const orderApp = `<script setup>
import { ref } from 'vue'

const status = ref('loading') // 'loading' | 'error' | 'ready'
const showHelp = ref(false)
const showNotes = ref(true)
</script>

<template>
  <div class="controls">
    <button class="set-loading" @click="status = 'loading'">Loading</button>
    <button class="set-error" @click="status = 'error'">Error</button>
    <button class="set-ready" @click="status = 'ready'">Ready</button>
  </div>

  <p v-if="status === 'loading'" class="msg loading">Loading your order…</p>
  <p v-else-if="status === 'error'" class="msg error">Couldn't load the order.</p>
  <p v-else class="msg ready">Order #1042 is on its way 🚚</p>

  <button class="toggle-help" @click="showHelp = !showHelp">Help</button>
  <p v-show="showHelp" class="help">Orders usually arrive in 2–3 days.</p>

  <button class="toggle-notes" @click="showNotes = !showNotes">Notes</button>
  <textarea v-if="showNotes" class="notes" placeholder="Delivery notes…"></textarea>
</template>`

export default {
  id: 'conditional-rendering',
  title: 'Conditional rendering: v-if vs v-show',
  summary: 'Show or hide parts of the page based on state — v-if adds and removes elements, v-show keeps them and toggles their visibility.',
  difficulty: 'beginner',
  minutes: 22,
  prerequisites: ['v-on-events'],
  related: ['list-rendering', 'template-syntax', 'async-ui-states', 'keep-alive', 'transitions', 'lifecycle-hooks'],
  tags: ['v-if', 'v-else', 'v-else-if', 'v-show', 'conditional rendering', 'template v-if', 'display none', 'toggle'],
  apis: [
    { name: 'v-if', summary: 'Renders the element only when the expression is truthy; removes it otherwise.' },
    { name: 'v-else-if', summary: 'An extra condition in a v-if chain; must directly follow v-if or v-else-if.' },
    { name: 'v-else', summary: 'The fallback branch of a v-if chain; must directly follow v-if or v-else-if.' },
    { name: 'v-show', summary: 'Always renders the element and toggles its inline `display: none`.' },
  ],
  docs: [
    { label: 'Vue Guide — Conditional Rendering', url: 'https://vuejs.org/guide/essentials/conditional.html' },
    { label: 'API — v-if / v-show', url: 'https://vuejs.org/api/built-in-directives.html#v-if' },
  ],

  intro: `
Most screens change depending on the situation: a spinner *while loading*, an error message *if something failed*, a "Log out" button *only for signed-in users*. Vue gives you two tools for that:

- **\`v-if\`** (with \`v-else-if\` and \`v-else\`) — the element exists only when the condition is true. When it becomes false, Vue removes it from the page entirely.
- **\`v-show\`** — the element is always there; Vue just hides it with CSS (\`display: none\`) when the condition is false.

They look the same to the user, but they behave very differently underneath — and choosing the right one is a classic interview question.
`,

  why: `
Without a framework, conditional UI means writing code like \`el.style.display = loading ? 'block' : 'none'\` for every element, or creating and removing elements with \`createElement\`/\`remove()\` — and keeping all of it in sync whenever any state changes.

With \`v-if\`/\`v-show\` you write the rule *once*, on the element: *"this paragraph appears when \`status === 'error'\`"*. Vue re-checks the rule whenever the state changes.

Two tools exist because there's a real trade-off:

- Creating elements costs work up front but nothing while hidden — good for things that rarely change, or should not exist at all for some users.
- Keeping elements and flipping CSS costs work once but makes toggling cheap — good for things toggled often.
`,

  eli15: `
Picture a school play.

**\`v-if\`** is an actor who only walks onto the stage when their scene starts and walks off when it ends. When they're off stage, they're not there at all — and every time they come back they have to get into costume again. If they were holding a prop, it's gone.

**\`v-show\`** is an actor who stays on stage the whole time, but behind a curtain. Pull the curtain and they're instantly visible, still holding whatever they had.

\`v-else\` is the understudy: "if the main actor isn't on, I go on instead."
`,

  analogy: {
    title: 'Actors on a stage vs behind a curtain',
    body: `
A director can handle a character who appears only sometimes in two ways: have the actor **enter and exit** (\`v-if\`) or keep them **on stage behind a curtain** (\`v-show\`).

Entering and exiting is perfect for a character who appears once — no one waits backstage all night. But for a character who pops in and out every minute, the curtain is much quicker, and they keep everything they were holding.
`,
    mapping: [
      ['actor enters / exits', '`v-if`: the element is created / destroyed'],
      ['actor behind a curtain', '`v-show`: the element stays, `display: none` hides it'],
      ['getting into costume again', 'components inside `v-if` are re-created and lose their state'],
      ['the understudy', '`v-else` / `v-else-if` branches'],
      ['cheap to pull the curtain', '`v-show` toggles are cheap; first render always happens'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'v-if' },
    title: 'v-if in the real DOM',
    caption: 'Toggle the condition and watch the element appear and disappear from the DOM tree. When it is false, only a `<!--v-if-->` comment placeholder remains.',
    alt: 'An interactive lab with a checkbox controlling a v-if condition. The live DOM panel shows the paragraph element being inserted when true and replaced by a v-if comment placeholder when false.',
  },

  syntax: [
    `
#### v-if, v-else-if, v-else
`,
    {
      code: `<p v-if="status === 'loading'">Loading…</p>
<p v-else-if="status === 'error'">Something went wrong.</p>
<p v-else-if="orders.length === 0">No orders yet.</p>
<ul v-else>
  <!-- the list of orders -->
</ul>`,
      lang: 'vue',
      title: 'a chain of branches',
    },
    `
**Rules:**

1. \`v-if\` renders its element only when the expression is **truthy**.
2. \`v-else-if\` and \`v-else\` must come **immediately after** a \`v-if\` or \`v-else-if\` sibling — no other element in between, or the template won't compile.
3. Exactly one branch of a chain is rendered (or none, if there is no \`v-else\`).
4. To toggle **several elements** at once without adding a wrapper element, put \`v-if\` on a \`<template>\` — it renders its children but not itself:
`,
    {
      code: `<template v-if="user">
  <img :src="user.avatar" alt="" />
  <span>{{ user.name }}</span>
  <button @click="logout">Log out</button>
</template>
<button v-else @click="login">Log in</button>`,
      lang: 'vue',
      title: '<template v-if>',
    },
    `
#### v-show
`,
    {
      code: `<p v-show="showHelp" class="help">Orders usually arrive in 2–3 days.</p>
<!-- when showHelp is false: <p class="help" style="display: none;">…</p> -->`,
      lang: 'vue',
      title: 'v-show',
    },
    `
- The element is **always rendered** and stays in the DOM; Vue only toggles its inline \`display\` style.
- \`v-show\` does **not** work on \`<template>\` and has no \`v-else\`.
- It only controls the inline style: if a stylesheet already hides the element (\`.help { display: none }\`), \`v-show="true"\` won't reveal it.

#### Choosing between them
`,
    {
      callout: 'tip',
      title: 'The rule of thumb (from the Vue docs)',
      text: '`v-if` has higher toggle costs; `v-show` has higher initial render costs. Prefer `v-show` for things toggled very often; prefer `v-if` when the condition rarely changes — and whenever the content should not exist at all (or should be re-created fresh) when hidden.',
    },
    `
#### Truthy and falsy

Conditions use JavaScript truthiness. \`false\`, \`0\`, \`''\`, \`null\`, \`undefined\` and \`NaN\` are falsy — but **an empty array \`[]\` and an empty object \`{}\` are truthy**. So \`v-if="cart"\` is true even for an empty cart; write \`v-if="cart.length"\` (or \`cart.length > 0\`).
`,
    {
      callout: 'warn',
      title: 'v-if with v-for',
      text: 'Don\'t put `v-if` and `v-for` on the same element. In Vue 3, `v-if` is evaluated first, so it cannot see the loop variable. Filter with a computed property or wrap with `<template v-for>`. Details in [List rendering](lesson:list-rendering).',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: orderApp,
    intro: 'An order screen with a three-way v-if chain, a v-show toggle and a v-if toggle. Notice the different behaviours as you click.',
    steps: [
      { lines: [4, 6], text: 'One `status` string drives the main message. Two booleans drive the help text and the notes box.' },
      { lines: [10, 14], text: 'Three buttons simply set `status`. Nothing else — the template decides what to show.' },
      { lines: [16, 18], text: 'A `v-if` / `v-else-if` / `v-else` chain. Exactly one paragraph exists in the DOM at any time; the others are not hidden, they are **absent**.' },
      { lines: [20, 21], text: '`v-show` on the help text: the paragraph is always in the DOM; Vue toggles `style="display: none;"` on it.' },
      { lines: [23, 24], text: '`v-if` on the notes box: hiding it **destroys** the textarea. Type something, hide, show again — it\'s gone, because a brand-new textarea was created.' },
    ],
  },

  playground: {
    title: 'Order status',
    objective: 'Extend a v-if chain, then switch between v-if and v-show and observe what changes in the DOM and in the element\'s state.',
    files: { 'App.vue': orderApp },
    expected: 'The message changes with the three buttons. **Help** toggles a paragraph that stays in the DOM (inspect it). **Notes** toggles a textarea — and whatever you typed is lost each time you hide it.',
    experiments: [
      {
        id: 'cancelled',
        task: 'Add a fourth status: a button with `class="set-cancelled"` that sets `status` to `\'cancelled\'`, and a new branch `<p class="msg cancelled">This order was cancelled.</p>` in the chain.',
        hint: 'Add a `v-else-if="status === \'cancelled\'"` paragraph **before** the `v-else` — branches must stay adjacent, and `v-else` must be last.',
        tests: [
          {
            name: 'the cancelled branch replaces the others',
            code: `await click('.set-cancelled')
expect(exists('.msg.cancelled')).toBe(true)
expect(findAll('.msg').length).toBe(1)`,
          },
        ],
        explain: 'Branches are checked top to bottom; the first truthy one wins and the rest are not rendered at all.',
      },
      {
        id: 'keep-notes',
        task: 'Type something in the notes box, hide it, show it again — the text is gone. Make the notes **survive** being hidden.',
        hint: 'Switch the textarea from `v-if` to `v-show`.',
        tests: [
          {
            name: 'typed notes survive hide + show',
            code: `await type('.notes', 'Leave it at the door')
await click('.toggle-notes')
await click('.toggle-notes')
expect(find('.notes').value).toBe('Leave it at the door')`,
          },
        ],
        explain: 'With `v-if`, hiding destroyed the textarea and showing created a new, empty one. With `v-show`, the same element stays in the DOM — only its `display` changes — so its value survives. The same applies to components: their internal state survives `v-show` but not `v-if`.',
      },
      {
        id: 'help-v-if',
        task: 'Now the opposite: change the help paragraph from `v-show` to `v-if`, and check that it is completely **absent** from the DOM while hidden.',
        hint: 'Replace `v-show="showHelp"` with `v-if="showHelp"`, then inspect the DOM.',
        tests: [
          {
            name: 'the help paragraph is absent while hidden',
            code: `expect(exists('.help')).toBe(false)
await click('.toggle-help')
expect(isVisible('.help')).toBe(true)`,
          },
        ],
        explain: 'While hidden, a `v-if` element is replaced by an invisible `<!--v-if-->` comment placeholder. It costs nothing while hidden and is created fresh when shown.',
      },
      {
        id: 'template-group',
        task: 'When the order is ready, also show a link `<a class="track" href="#">Track parcel</a>` next to the message — without adding a wrapper element.',
        hint: 'Turn the `v-else` paragraph into `<template v-else>` containing both the paragraph (keep its classes) and the link.',
        tests: [
          {
            name: 'ready shows the message and the link',
            code: `await click('.set-ready')
expect(exists('.msg.ready')).toBe(true)
expect(exists('.track')).toBe(true)
await click('.set-error')
expect(exists('.track')).toBe(false)`,
          },
        ],
        explain: '`<template>` is an invisible wrapper: it groups elements for a directive but renders nothing itself. (It works with `v-if`/`v-else`, but not with `v-show`.)',
      },
    ],
  },

  animation: {
    type: 'directive-lab',
    props: { directive: 'v-show' },
    title: 'v-show in the real DOM',
    caption: 'Same toggle, different mechanism: the element never leaves the DOM tree — watch the `style="display: none;"` attribute come and go instead.',
    alt: 'An interactive lab with a checkbox controlling a v-show condition. The live DOM panel shows the paragraph always present, with an inline style display none added when false and removed when true.',
  },

  internals: {
    beginner: `
For \`v-if\`, Vue builds the element only when the condition is true. When it turns false, Vue tears the element down — including any components inside it, which run their unmount code and forget their state — and leaves a tiny invisible comment as a bookmark. For \`v-show\`, Vue builds the element once and afterwards only flips one CSS property.
`,
    technical: [
      `
**v-if** compiles into a ternary in the render function. Each branch gets its own \`key\`, so when the condition changes the renderer **unmounts** the old branch and **mounts** the new one instead of patching one into the other. A false \`v-if\` with no \`v-else\` renders a comment node (\`<!--v-if-->\`) to mark the position. Unmounting a component runs its \`onBeforeUnmount\`/\`onUnmounted\` hooks and discards its state; mounting creates a fresh instance and runs \`setup()\` again.

**v-show** compiles into a runtime directive. Its hooks set \`el.style.display\` to \`'none'\` when falsy and restore the element's original inline display value when truthy. The element and any components inside stay mounted.
`,
      {
        code: `// <p v-if="ok">Yes</p><p v-else>No</p>   compiles to roughly:
ok
  ? (openBlock(), createElementBlock('p', { key: 0 }, 'Yes'))
  : (openBlock(), createElementBlock('p', { key: 1 }, 'No'))

// <p v-if="ok">Yes</p>   (no v-else)
ok ? (openBlock(), createElementBlock('p', { key: 0 }, 'Yes')) : createCommentVNode('v-if', true)

// <p v-show="open">Help</p>
withDirectives(createElementVNode('p', null, 'Help'), [[vShow, open]])`,
        lang: 'js',
        title: 'compiled output (simplified)',
      },
      `
Because each branch is keyed, two branches with the same tag (say, two \`<input>\`s) are *not* reused for each other in Vue 3 — switching branches gives you a fresh element.
`,
    ],
    production: `
- **Model async UI as one status**, not several booleans: \`'idle' | 'loading' | 'error' | 'success'\` with a \`v-if\` chain makes impossible combinations ("loading *and* error") impossible. See [Loading, error & empty states](lesson:async-ui-states).
- **Preserve component state deliberately.** If a heavy tab should keep its state when hidden, use \`v-show\`, or \`<KeepAlive>\` around a \`v-if\`/dynamic component ([KeepAlive](lesson:keep-alive)), or lift the state into a parent or store.
- **Animations:** wrap a \`v-if\` or \`v-show\` element in \`<Transition>\` to animate entering and leaving ([Transitions](lesson:transitions)).
- **\`v-if\` is not security.** Hiding an admin panel with \`v-if\` keeps it off the screen, but its code still ships in your JavaScript bundle and anyone can call your API. Enforce permissions on the server; lazy-load admin-only code if you also don't want to ship it to everyone.
- **SSR:** \`v-show\` renders \`style="display:none"\` in server HTML (the content is still sent); \`v-if\` doesn't send the hidden content at all.
`,
  },

  mistakes: [
    {
      title: 'Testing an array instead of its length',
      wrong: { code: `<p v-if="results">Found {{ results.length }} results</p>\n<p v-else>No results</p>`, lang: 'vue' },
      right: { code: `<p v-if="results.length">Found {{ results.length }} results</p>\n<p v-else>No results</p>`, lang: 'vue' },
      explanation: 'An empty array is truthy in JavaScript, so the "No results" branch never renders. Check `.length`.',
    },
    {
      title: 'Something between v-if and v-else',
      wrong: { code: `<p v-if="loggedIn">Welcome back!</p>\n<hr />\n<p v-else>Please log in</p>`, lang: 'vue' },
      right: { code: `<p v-if="loggedIn">Welcome back!</p>\n<p v-else>Please log in</p>\n<hr />`, lang: 'vue' },
      explanation: '`v-else` must directly follow a `v-if`/`v-else-if` element. Anything in between breaks the chain and the compiler reports "v-else/v-else-if has no adjacent v-if or v-else-if".',
    },
    {
      title: 'Expecting state to survive a v-if toggle',
      wrong: { code: `<SearchFilters v-if="filtersOpen" />  <!-- filters reset every time it reopens -->`, lang: 'vue' },
      right: { code: `<SearchFilters v-show="filtersOpen" />\n<!-- or keep the filter values in the parent / a store and pass them down -->`, lang: 'vue' },
      explanation: '`v-if` destroys the component when hidden and creates a new one when shown, so its internal state starts over. Use `v-show`, `<KeepAlive>`, or move the state up.',
    },
    {
      title: 'Using v-show on a <template>',
      wrong: { code: `<template v-show="open">\n  <h3>Details</h3>\n  <p>…</p>\n</template>`, lang: 'vue' },
      right: { code: `<div v-show="open">\n  <h3>Details</h3>\n  <p>…</p>\n</div>`, lang: 'vue' },
      explanation: '`<template>` renders no element, so there is nothing to put `display: none` on. Use a real wrapper element with `v-show`, or use `v-if` on the `<template>`.',
    },
  ],

  debugging: [
    {
      symptom: 'Compile error: `v-else/v-else-if has no adjacent v-if or v-else-if`.',
      cause: 'Another element, or a missing `v-if`, sits between the branches.',
      fix: 'Make the branches direct siblings; move the extra element before or after the chain.',
    },
    {
      symptom: 'Text typed into a field (or a child component\'s state) disappears after hiding and showing it.',
      cause: 'It is rendered with `v-if`, which destroys and re-creates it.',
      fix: 'Use `v-show`, wrap a component in `<KeepAlive>`, or store the value in a parent ref.',
    },
    {
      symptom: '`v-show="true"` but the element is still invisible.',
      cause: 'A stylesheet rule (e.g. `.panel { display: none }`) hides it; `v-show` only removes its own inline `display: none`.',
      fix: 'Remove the CSS rule, or control visibility with a class binding instead.',
    },
    {
      symptom: 'The empty state ("No items") never appears.',
      cause: 'The condition checks the array (`v-if="items"`), which is truthy even when empty.',
      fix: 'Check `items.length`.',
    },
    {
      symptom: 'The "Log in" button flashes briefly before the logged-in UI appears.',
      cause: 'The initial state (`user = null`) means "logged out" and "not loaded yet" at the same time.',
      fix: 'Add an explicit loading state (`status = \'loading\'`) and render nothing or a spinner until it resolves.',
    },
  ],

  bestPractices: [
    'Use `v-if` for content that rarely toggles or should not exist when hidden; `v-show` for frequent toggles.',
    'Model mutually exclusive UI states with one status value and a `v-if` / `v-else-if` / `v-else` chain.',
    'Check `array.length`, not the array, in conditions.',
    'Use `<template v-if>` to group elements instead of adding wrapper `<div>`s.',
    'Remember that hiding with `v-if` resets component state — choose deliberately.',
    'Never treat `v-if` as a security control.',
  ],

  useCases: [
    'Loading / error / empty / success states for data from an API.',
    'Logged-in vs logged-out UI.',
    'Tabs, accordions, dropdowns and tooltips that open and close often (`v-show`).',
    'Modals and dialogs that should start fresh each time they open (`v-if`).',
    'Feature flags and role-based UI (with server-side enforcement).',
  ],

  whenToUse: {
    use: [
      '`v-if`: the condition rarely changes, the content is heavy and often unused, or it must be re-created fresh.',
      '`v-show`: the user toggles it often and it should keep its DOM and state.',
      '`v-else-if` chains for several mutually exclusive states.',
    ],
    avoid: [
      '`v-show` for content some users must never receive (it is still in the DOM).',
      '`v-if` for something toggled many times a second (e.g. hover effects) — use `v-show` or CSS.',
      '`v-if` and `v-for` on the same element.',
    ],
  },

  comparison: {
    title: 'Ways to hide something',
    headers: ['', '`v-if`', '`v-show`', 'CSS class / `hidden`', '`<KeepAlive>` + `v-if`'],
    rows: [
      ['When false', 'not in the DOM (comment placeholder)', 'in the DOM with `display: none`', 'in the DOM, hidden by CSS', 'component cached, not in the DOM'],
      ['Initial render when false', 'skipped (lazy)', 'rendered anyway', 'rendered anyway', 'skipped until first shown'],
      ['Toggle cost', 'higher (create / destroy)', 'low (one style change)', 'low', 'low after the first time'],
      ['Child component state', 'reset on every toggle', 'kept', 'kept', 'kept'],
      ['Works with `v-else` / `<template>`', 'yes / yes', 'no / no', '—', 'components only'],
    ],
    note: 'Start with `v-if`. Switch to `v-show` when you toggle often or need to keep state.',
  },

  quiz: [
    {
      id: 'conditional-rendering-q1',
      type: 'mcq',
      prompt: 'What is the key difference between `v-if` and `v-show`?',
      options: [
        { text: '`v-if` adds/removes the element from the DOM; `v-show` keeps it and toggles `display: none`.' },
        { text: '`v-show` removes the element; `v-if` only hides it.', why: 'It is the other way round.' },
        { text: 'They are identical; `v-show` is just an older name.', why: 'They have different mechanisms and costs.' },
        { text: '`v-if` only works with booleans; `v-show` works with any value.', why: 'Both use JavaScript truthiness.' },
      ],
      answer: 0,
      explanation: '`v-if` is "real" conditional rendering (create/destroy). `v-show` is CSS-based (always rendered, toggles visibility).',
    },
    {
      id: 'conditional-rendering-q2',
      type: 'output',
      prompt: 'With `const cart = ref([])`, what does this render?',
      code: {
        lang: 'vue',
        code: `<p v-if="cart">You have items in your cart</p>
<p v-else>Your cart is empty</p>`,
      },
      options: [
        { text: 'You have items in your cart' },
        { text: 'Your cart is empty', why: 'An empty array is truthy in JavaScript, so the `v-if` branch renders.' },
        { text: 'Both paragraphs', why: 'A v-if/v-else chain renders exactly one branch.' },
        { text: 'Nothing', why: 'One of the branches always renders when there is a `v-else`.' },
      ],
      answer: 0,
      explanation: '`[]` is truthy. Use `v-if="cart.length"` to test for an empty array.',
    },
    {
      id: 'conditional-rendering-q3',
      type: 'bug',
      prompt: 'This template fails with "v-else/v-else-if has no adjacent v-if". Click the line that breaks the chain.',
      code: {
        lang: 'vue',
        code: `<template>
  <h2>Account</h2>
  <p v-if="user">Signed in as {{ user.name }}</p>
  <hr />
  <p v-else>You are not signed in.</p>
</template>`,
      },
      answerLine: 4,
      explanation: 'The `<hr />` sits between the `v-if` and `v-else` siblings. `v-else` must immediately follow its `v-if` — move the `<hr />` above or below the pair.',
    },
    {
      id: 'conditional-rendering-q4',
      type: 'fill',
      prompt: 'Complete the stock message chain.',
      code: { lang: 'vue', code: `<p v-if="stock > 10">In stock</p>\n<p ___="stock > 0">Only {{ stock }} left</p>\n<p ___>Sold out</p>` },
      answer: [['v-else-if'], ['v-else']],
      explanation: '`v-else-if` adds another condition; `v-else` is the fallback and takes no value.',
    },
    {
      id: 'conditional-rendering-q5',
      type: 'mcq',
      prompt: 'Select **all** statements that are true about `v-show`.',
      options: [
        { text: 'The element is always rendered, even when the condition is false.' },
        { text: 'It toggles the element\'s inline `display` style.' },
        { text: 'It can be used on a `<template>` element.', why: '`<template>` renders no element, so there is nothing to apply `display: none` to.' },
        { text: 'It can be followed by `v-else`.', why: '`v-else` only pairs with `v-if` / `v-else-if`.' },
      ],
      answer: [0, 1],
      explanation: '`v-show` = always rendered + CSS toggle. No `<template>`, no `v-else`.',
    },
    {
      id: 'conditional-rendering-q6',
      type: 'mcq',
      prompt: 'A `<Timer />` component with its own running count is inside `<div v-if="open">`. You set `open` to false, then back to true. What happens to the count?',
      options: [
        { text: 'It starts over: the component was destroyed and a new instance was created.' },
        { text: 'It continues where it left off.', why: 'That is what would happen with `v-show` (or `<KeepAlive>`), not with `v-if`.' },
        { text: 'It continues, but the screen shows the old value.', why: 'The old instance no longer exists; a fresh one renders.' },
        { text: 'Vue throws an error because the component is reused.', why: 'Destroying and re-creating components is normal `v-if` behaviour.' },
      ],
      answer: 0,
      explanation: '`v-if` unmounts the component (its state is lost) and mounts a new instance when the condition becomes true again.',
    },
    {
      id: 'conditional-rendering-q7',
      type: 'short',
      prompt: 'A dashboard has four tabs, each with a heavy chart. Users switch tabs constantly and expect zoom levels to be kept. Would you use `v-if` or `v-show` for the tab panels, and why?',
      answer: '`v-show` (or `<KeepAlive>` with dynamic components). Users toggle often, so `v-show`\'s cheap CSS toggle beats re-creating charts each time, and the chart components stay mounted so their zoom state is kept. The trade-off is a higher initial cost because all four charts render up front — if that is too slow, lazily mount each tab on first visit and keep it alive afterwards.',
    },
  ],

  exercises: [
    {
      id: 'login-panel',
      title: 'Logged-in vs logged-out header',
      difficulty: 'beginner',
      prompt: `
Build the header with \`v-if\` / \`v-else\`:

- When \`user\` is \`null\`: show only \`<button class="login-btn">Log in</button>\`.
- When \`user\` is set: show \`<span class="welcome">Welcome, NAME</span>\` and \`<button class="logout-btn">Log out</button>\` — and **no** login button.
- If \`user.isAdmin\` is true, also show \`<a class="admin-link" href="#">Admin</a>\`.
- \`Log in\` sets \`user\` to \`{ name: 'Ada', isAdmin: false }\`; \`Log out\` sets it back to \`null\`.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const user = ref(null)
</script>

<template>
  <header class="site-header">
    <button class="login-btn">Log in</button>
    <span class="welcome">Welcome, NAME</span>
    <a class="admin-link" href="#">Admin</a>
    <button class="logout-btn">Log out</button>
  </header>
</template>`,
      },
      hints: [
        'Group the logged-in elements in a `<template v-if="user">` and put `v-else` on the login button right after it.',
        'Inside the group, the admin link gets its own `v-if="user.isAdmin"`.',
        "Handlers: `@click=\"user = { name: 'Ada', isAdmin: false }\"` and `@click=\"user = null\"`.",
      ],
      solution: {
        explanation: 'One piece of state (`user`) decides everything. `<template v-if>` groups the logged-in elements without an extra wrapper, `v-else` is the logged-out fallback, and a nested `v-if` handles the admin-only link. (In a real app the server still decides what an admin may do.)',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const user = ref(null)
</script>

<template>
  <header class="site-header">
    <template v-if="user">
      <span class="welcome">Welcome, {{ user.name }}</span>
      <a v-if="user.isAdmin" class="admin-link" href="#">Admin</a>
      <button class="logout-btn" @click="user = null">Log out</button>
    </template>
    <button v-else class="login-btn" @click="user = { name: 'Ada', isAdmin: false }">Log in</button>
  </header>
</template>`,
        },
      },
      tests: [
        { name: 'logged out: only the login button', code: `expect(exists('.login-btn')).toBe(true); expect(exists('.welcome')).toBe(false); expect(exists('.logout-btn')).toBe(false)` },
        { name: 'logging in shows the welcome text', code: `await click('.login-btn'); expect(text('.welcome')).toBe('Welcome, Ada'); expect(exists('.login-btn')).toBe(false); expect(exists('.admin-link')).toBe(false)` },
        { name: 'admins see the admin link', code: `state.user = { name: 'Grace', isAdmin: true }; await nextTick(); expect(exists('.admin-link')).toBe(true); expect(text('.welcome')).toBe('Welcome, Grace')` },
        { name: 'logging out goes back', code: `await click('.login-btn'); await click('.logout-btn'); expect(exists('.login-btn')).toBe(true); expect(exists('.welcome')).toBe(false)` },
      ],
    },
    {
      id: 'faq-accordion',
      title: 'An FAQ accordion with v-show',
      difficulty: 'beginner',
      prompt: `
Three questions, one answer open at a time:

- Each \`.question\` button toggles its \`.answer\`. Opening one closes the others; clicking an open one closes it.
- Use **\`v-show\`** — all three \`.answer\` elements must stay in the DOM (hidden), because the answers are toggled constantly.
- Track the open answer with a ref \`openIndex\` (\`null\` when none is open).
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const openIndex = ref(null)
</script>

<template>
  <section class="faq">
    <button class="question">How long does shipping take?</button>
    <p class="answer">Two to three working days.</p>

    <button class="question">Can I return an item?</button>
    <p class="answer">Yes, within 30 days.</p>

    <button class="question">Do you ship abroad?</button>
    <p class="answer">To most countries in Europe.</p>
  </section>
</template>`,
      },
      hints: [
        'Write `function toggle(i) { openIndex.value = openIndex.value === i ? null : i }`.',
        'Each question gets `@click="toggle(0)"`, `toggle(1)`, `toggle(2)`.',
        'Each answer gets `v-show="openIndex === 0"` (then 1, then 2).',
      ],
      solution: {
        explanation: 'A single `openIndex` makes "only one open" automatic — there is no way for two answers to be open at once. `v-show` keeps every answer in the DOM and just toggles its display, which is cheap for something users click constantly. (After the next lesson you would render these from an array with `v-for`.)',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const openIndex = ref(null)

function toggle(i) {
  openIndex.value = openIndex.value === i ? null : i
}
</script>

<template>
  <section class="faq">
    <button class="question" @click="toggle(0)">How long does shipping take?</button>
    <p v-show="openIndex === 0" class="answer">Two to three working days.</p>

    <button class="question" @click="toggle(1)">Can I return an item?</button>
    <p v-show="openIndex === 1" class="answer">Yes, within 30 days.</p>

    <button class="question" @click="toggle(2)">Do you ship abroad?</button>
    <p v-show="openIndex === 2" class="answer">To most countries in Europe.</p>
  </section>
</template>`,
        },
      },
      tests: [
        {
          name: 'all answers exist but start hidden',
          code: `const answers = findAll('.answer')
expect(answers.length).toBe(3)
expect(answers.some((a) => isVisible(a))).toBe(false)`,
        },
        {
          name: 'one open at a time',
          code: `const q = findAll('.question')
await click(q[0])
expect(findAll('.answer').map((a) => isVisible(a))).toEqual([true, false, false])
await click(q[2])
expect(findAll('.answer').map((a) => isVisible(a))).toEqual([false, false, true])`,
        },
        { name: 'clicking an open question closes it', code: `const q = findAll('.question'); await click(q[1]); await click(q[1]); expect(findAll('.answer').some((a) => isVisible(a))).toBe(false)` },
      ],
    },
  ],

  interview: [
    {
      id: 'conditional-rendering-if-vs-show',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `v-if` and `v-show`, and when would you use each?',
      answer: '`v-if` is real conditional rendering: the element (and any components inside) is created when the condition is true and destroyed when it is false; it is lazy, so nothing renders if it starts false. `v-show` always renders the element and toggles `display: none`. `v-if` has higher toggle cost, `v-show` higher initial cost. Use `v-show` for frequent toggles or to keep state; use `v-if` for rarely-changing conditions, heavy content that may never be needed, or content that should not exist at all.',
      explanation: 'Create/destroy vs always-rendered + CSS.',
      code: {
        lang: 'vue',
        code: `<AdminPanel v-if="user.isAdmin" />   <!-- rarely changes, not needed by most users -->
<DropdownMenu v-show="menuOpen" />    <!-- toggled constantly -->`,
      },
      whyAsked: 'Probably the most common Vue interview question. They want the mechanism *and* the trade-off.',
      mistakes: ['Only saying "v-show uses CSS".', 'Not mentioning that component state is lost with v-if.', 'Claiming v-show is always faster.'],
      followUps: ['What happens to a child component\'s state with each?', 'Can v-show be used on `<template>`?', 'How does `<KeepAlive>` change the picture?'],
      modelAnswer: "v-if actually adds and removes the element: when the condition is false there's just a comment placeholder, and any child components are unmounted and lose their state. It's also lazy — if it starts false, nothing is rendered. v-show always renders the element and only toggles display none. So v-if costs more to toggle and v-show costs more up front. I use v-show for things users toggle often, like dropdowns or tabs where I want to keep state, and v-if for things that rarely change or shouldn't exist when hidden, like an admin panel or a modal that should start fresh.",
    },
    {
      id: 'conditional-rendering-lost-form',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Users complain that a collapsible "Shipping details" section forgets everything they typed when they collapse and re-open it. The section is a `<ShippingForm v-if="expanded" />`. Why, and what are your options?',
      answer: '`v-if` unmounts `ShippingForm` when collapsed, so its internal state is discarded; re-opening creates a new instance. Options: switch to `v-show` so it stays mounted; wrap it in `<KeepAlive>`; or — often best for forms — lift the form data into the parent or a store and pass it down (props + `v-model`/emits), so the data outlives the component.',
      explanation: 'State that must survive hiding cannot live inside a component that gets destroyed.',
      whyAsked: 'A realistic bug that tests understanding of component lifecycle and state ownership.',
      mistakes: ['Saving to localStorage on every keystroke as the first fix.', 'Not considering where the state should live.'],
      followUps: ['Which option would you choose if the form is also submitted from the parent?', 'What does KeepAlive cost?'],
      modelAnswer: "v-if destroys the ShippingForm when it's collapsed, and its refs go with it; expanding creates a new, empty instance. The quick fix is v-show, which keeps it mounted and just hides it. KeepAlive would also cache the instance. But for form data I usually prefer lifting the state up: the parent owns the shipping data and passes it down with v-model, so it survives no matter how the form is shown — and the parent needs that data to submit anyway.",
    },
    {
      id: 'conditional-rendering-empty-array',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'An API returns `results = []`. What does this render?',
      code: {
        lang: 'vue',
        code: `<ul v-if="results"><li>…</li></ul>
<p v-else>No results found</p>`,
      },
      options: ['An empty list (the <ul>)', 'No results found', 'Both elements', 'Nothing'],
      correctOption: 0,
      answer: 'It renders the (empty) `<ul>`, not the message. An empty array is truthy in JavaScript, so `v-if="results"` is true. Use `v-if="results.length"`.',
      explanation: 'Only `false`, `0`, `\'\'`, `null`, `undefined` and `NaN` are falsy.',
      whyAsked: 'A small JavaScript-fundamentals trap that causes real empty-state bugs.',
      mistakes: ['Assuming empty arrays are falsy (as in some other languages).'],
      followUps: ['How would you handle "not loaded yet" vs "loaded but empty"?'],
      modelAnswer: "It renders the empty ul, because an empty array is truthy in JavaScript, so the v-else never shows. The condition should be results.length. And if I also need to distinguish 'not loaded yet' from 'loaded but empty', I'd use a separate status, because null and an empty array mean different things.",
    },
    {
      id: 'conditional-rendering-async-states',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You are building a product list that loads from an API. How would you model and render the loading, error, empty and success states?',
      answer: 'Use one status value (`\'loading\' | \'error\' | \'success\'`) plus the data and error, instead of independent booleans like `isLoading` and `hasError` that can contradict each other. Render a single `v-if` / `v-else-if` / `v-else` chain: loading → spinner, error → message with a retry button, success with `products.length === 0` → empty state, otherwise the list.',
      explanation: 'One status makes impossible states impossible; the chain guarantees exactly one view.',
      code: {
        lang: 'vue',
        code: `<p v-if="status === 'loading'">Loading products…</p>
<div v-else-if="status === 'error'">
  <p>Couldn't load products.</p>
  <button @click="load">Try again</button>
</div>
<p v-else-if="products.length === 0">No products match your filters.</p>
<ProductGrid v-else :products="products" />`,
      },
      whyAsked: 'Every real app has async states; this checks structured thinking and UX awareness.',
      mistakes: ['Forgetting the empty state or the retry action.', 'Using several booleans that can be true at the same time.', 'Showing a stale list during a new load without indication.'],
      followUps: ['How would you avoid flicker for very fast responses?', 'How do you handle a refresh while data is already shown?'],
      modelAnswer: "I'd keep a single status — loading, error or success — alongside the data and the error, because separate booleans can end up both true. In the template it's one chain: a loading indicator, an error message with a retry button, an empty state when the request succeeded with no products, and otherwise the grid. That way exactly one view is shown at a time. For refreshes I might keep showing the old list with a subtle indicator rather than flashing the spinner.",
    },
    {
      id: 'conditional-rendering-security',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'A product manager says: "Non-admins can\'t see the Delete button because it\'s behind `v-if="user.isAdmin"`, so we\'re secure." What is your response?',
      answer: '`v-if` only controls what is rendered. The component code still ships in the bundle, `user.isAdmin` can be changed in DevTools, and anyone can call the delete API directly. Security must be enforced by the server on every request (authorization). The UI check is still useful for UX. If shipping admin code to everyone is a concern, lazy-load admin features (async components / lazy routes) — but that is about bundle size and exposure, not security.',
      explanation: 'The browser is controlled by the user; only the server can enforce permissions.',
      whyAsked: 'Tests security maturity — a common misconception in frontend teams.',
      mistakes: ['Agreeing that hidden UI is secure.', 'Thinking `v-show` vs `v-if` matters for security.'],
      followUps: ['How would you structure route guards for admin pages?', 'What should the API return when a non-admin tries?'],
      modelAnswer: "v-if is a rendering decision, not a permission check. The admin code is still in the JavaScript bundle, the isAdmin flag lives in the browser where users can change it, and the delete endpoint can be called directly with curl or the console. The server must authorise every request and return 403 for non-admins. I'd keep the v-if for a clean UX, maybe lazy-load admin features so we don't ship that code to everyone, but the real control is on the backend.",
    },
    {
      id: 'conditional-rendering-compiled',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How do `v-if` and `v-show` work under the hood, and why does Vue 3 not reuse elements between `v-if` and `v-else` branches?',
      answer: '`v-if` compiles to a ternary in the render function; a false condition without `v-else` renders a `<!--v-if-->` comment placeholder. Each branch is given a unique key, so on a switch the renderer unmounts the old branch and mounts the new one instead of patching one into the other — that avoids accidentally carrying DOM state (like an input\'s value) between unrelated branches. `v-show` compiles to the `vShow` runtime directive, which sets `el.style.display` to `none` or restores the original value.',
      explanation: 'v-if = structural (different vnodes, keyed). v-show = a directive that edits one style property.',
      whyAsked: 'Senior-level question about rendering internals and a Vue 2 → 3 behaviour change.',
      mistakes: ['Thinking v-if just toggles visibility internally.', 'Not knowing about the comment placeholder.'],
      followUps: ['In Vue 2, how did you force a re-created input between branches?', 'How do transitions hook into both?'],
      modelAnswer: "v-if becomes a ternary in the render function. A false branch with no else renders a comment node as a placeholder. Vue 3 automatically gives each branch a distinct key, so switching branches unmounts one subtree and mounts the other rather than patching — which means two inputs in different branches never share DOM state, something you had to add manual keys for in Vue 2. v-show compiles to a runtime directive whose hooks set display none or restore the element's original display value; the element and its children stay mounted.",
    },
    {
      id: 'conditional-rendering-coding-stock',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 5,
      question: 'Show a stock badge: `.badge` reads **In stock** when `stock > 10`, **Only N left** when 1–10, and **Sold out** at 0. Show `<button class="notify">Notify me</button>` only when sold out.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const stock = ref(25)
</script>

<template>
  <span class="badge">In stock</span>
  <button class="notify">Notify me</button>
</template>`,
        },
      },
      tests: [
        { name: 'more than 10: In stock, no notify button', code: `expect(text('.badge')).toBe('In stock'); expect(exists('.notify')).toBe(false)` },
        { name: '1–10: Only N left', code: `state.stock = 3; await nextTick(); expect(text('.badge')).toBe('Only 3 left'); expect(exists('.notify')).toBe(false)` },
        { name: '0: Sold out + notify button', code: `state.stock = 0; await nextTick(); expect(text('.badge')).toBe('Sold out'); expect(exists('.notify')).toBe(true)` },
      ],
      hints: ['Three badge branches: `v-if`, `v-else-if`, `v-else` — all with `class="badge"`.', 'The notify button gets its own `v-if="stock === 0"`.'],
      answer: 'A three-branch chain for the badge plus an independent `v-if` for the button.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const stock = ref(25)
</script>

<template>
  <span v-if="stock > 10" class="badge">In stock</span>
  <span v-else-if="stock > 0" class="badge">Only {{ stock }} left</span>
  <span v-else class="badge">Sold out</span>
  <button v-if="stock === 0" class="notify">Notify me</button>
</template>`,
        },
      },
      explanation: 'The chain guarantees exactly one badge. The button is a separate condition because it is not an alternative to the badge.',
      whyAsked: 'A quick check of v-if chains and independent conditions.',
      mistakes: ['Putting the button inside the chain, which hides the badge.', 'Ordering conditions so that `stock > 0` catches everything first.'],
      followUps: ['Would v-show be better for the badge?', 'How would you derive the label with a computed instead?'],
      modelAnswer: "I'd write a three-branch chain for the badge, ordered from most to least specific, so exactly one renders, and a separate v-if for the notify button because it isn't an alternative to the badge. If the label logic grew, I'd move it into a computed and render one span.",
    },
  ],

  takeaways: [
    '`v-if` / `v-else-if` / `v-else` create and destroy elements; branches must be adjacent siblings.',
    '`v-show` always renders and toggles `display: none`; no `<template>`, no `v-else`.',
    '`v-if`: higher toggle cost, lazy, resets component state. `v-show`: higher initial cost, keeps state.',
    'Use `<template v-if>` to group elements; check `array.length`, not the array.',
    '`v-if` is not security — the server enforces permissions.',
  ],
}
