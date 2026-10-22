// Lesson: Custom directives.

const profileApp = `<script setup>
import { ref } from 'vue'
import { vFocus } from './focus.js'

const name = ref('')
const color = ref('#fff3a3')

// a local directive: the variable vHighlight is usable as v-highlight
const vHighlight = {
  mounted(el, binding) {
    el.style.backgroundColor = binding.value
  },
}
</script>

<template>
  <h2>Edit profile</h2>
  <label>
    Display name
    <input v-model="name" v-focus class="name" />
  </label>

  <p v-highlight="color" class="tip">Tip: use the name your friends know you by.</p>

  <label>
    Highlight colour
    <select v-model="color" class="color">
      <option value="#fff3a3">Yellow</option>
      <option value="#c8f7c5">Green</option>
      <option value="#ffd6e0">Pink</option>
    </select>
  </label>
</template>`

const focusFile = `// v-focus: focus the element as soon as Vue inserts it — on the first
// render AND whenever a v-if brings it back (unlike the autofocus attribute).
export const vFocus = {
  mounted(el) {
    el.focus()
  },
}`

export default {
  id: 'custom-directives',
  title: 'Custom directives',
  summary: 'Package low-level DOM behaviour — autofocus, click-outside, long-press — into reusable v-something attributes with a well-defined lifecycle.',
  difficulty: 'intermediate',
  minutes: 36,
  prerequisites: ['dom-access-refs', 'lifecycle-hooks'],
  related: ['plugins-app-config', 'render-functions', 'composables-intro', 'teleport'],
  tags: ['custom directive', 'v-focus', 'v-click-outside', 'directive hooks', 'binding', 'arg', 'modifiers', 'app.directive', 'withDirectives', 'DOM'],
  apis: [
    { name: 'directive object', summary: 'An object with any of the hooks `created`, `beforeMount`, `mounted`, `beforeUpdate`, `updated`, `beforeUnmount`, `unmounted`.' },
    { name: 'binding', summary: 'Second hook argument: `value`, `oldValue`, `arg`, `modifiers`, `instance` and `dir`.' },
    { name: 'vName in <script setup>', summary: 'Any camelCase variable starting with `v` (e.g. `vFocus`) can be used in the template as `v-focus`.' },
    { name: 'app.directive(name, def)', summary: 'Registers a directive globally for the whole app.' },
    { name: 'function shorthand', summary: 'A directive written as a single function runs on `mounted` and `updated`.' },
  ],
  docs: [
    { label: 'Vue Guide — Custom Directives', url: 'https://vuejs.org/guide/reusability/custom-directives.html' },
    { label: 'API — app.directive()', url: 'https://vuejs.org/api/application.html#app-directive' },
    { label: 'API — withDirectives()', url: 'https://vuejs.org/api/render-function.html#withdirectives' },
    { label: 'Vue Guide — SSR: custom directives', url: 'https://vuejs.org/guide/scaling-up/ssr.html#custom-directives' },
  ],

  intro: `
You already use Vue's built-in directives — \`v-if\`, \`v-for\`, \`v-model\`, \`v-show\`. A **custom directive** is one you write yourself: a reusable piece of behaviour that you attach to an element with a \`v-\` attribute.

\`\`\`vue
<input v-focus />
<div v-click-outside="closeMenu">…</div>
\`\`\`

Under the hood a directive is just an object with **hook functions** that Vue calls at key moments in the element's life — created, inserted into the page, updated, removed — and each hook receives the **real DOM element**. That makes directives the right tool for one specific job: **reusable, low-level DOM work** on plain elements.
`,

  why: `
Some behaviour is about the element itself, not about data:

- focus this input whenever it appears;
- close this menu when someone clicks *outside* it;
- run an action if the user *holds* a button for half a second;
- hand this element to a tooltip library and clean up afterwards.

You could do each with a [template ref](lesson:dom-access-refs) and lifecycle hooks in every component that needs it — but you'd copy the same \`onMounted\`/\`onUnmounted\` dance into dozens of files, and forget the cleanup in a few of them.

A directive packages that behaviour once, with its setup *and* teardown, and applies it with a single attribute anywhere. The Vue docs are equally clear about the limit: use custom directives **only** when the job genuinely needs direct DOM manipulation. If a binding like \`:class\` or a component can do it, prefer those.
`,

  eli15: `
Think of stickers you can put on things. A "fragile" sticker on a box changes how everyone handles it — you don't rebuild the box, you just stick the label on.

A custom directive is a sticker for HTML elements. \`v-focus\` on an input means "put the cursor here as soon as you show me". \`v-click-outside="close"\` on a menu means "if someone clicks anywhere *else*, call \`close\`".

Each sticker comes with instructions for specific moments: what to do when the element is **put on the page**, when it **changes**, and — very important — what to tidy up when it's **taken away**. Vue reads the sticker and follows those instructions at exactly the right times.
`,

  analogy: {
    title: 'Handling stickers on parcels',
    body: `
A warehouse doesn't redesign boxes for every special case. It has stickers — "fragile", "this side up", "keep cold" — and workers follow the sticker's rules at each stage: receiving, storing, shipping.

Directives are stickers for elements. The sticker's name is \`v-something\`, the text written on it is the **value** (\`v-highlight="color"\`), a qualifier after a colon is the **argument** (\`v-pin:top\`), and little ticked boxes are **modifiers** (\`.bold\`). Vue is the warehouse worker who applies the rules at each stage of the element's life.
`,
    mapping: [
      ['the sticker', 'the directive attribute, e.g. `v-click-outside`'],
      ['what\'s written on it', '`binding.value` — the expression after `=`'],
      ['a qualifier like "top"', '`binding.arg` in `v-pin:top`'],
      ['ticked option boxes', '`binding.modifiers`, e.g. `{ bold: true }` for `.bold`'],
      ['rules at each warehouse stage', 'hooks: `mounted`, `updated`, `unmounted`, …'],
      ['removing tape and labels when shipping out', 'cleanup in `unmounted` (listeners, timers, library instances)'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Directive hooks along an element\'s life',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'created', label: 'created', note: 'before attrs/listeners applied', tone: 'paper', x: 90, y: 70 },
        { id: 'beforeMount', label: 'beforeMount', note: 'before insertion', tone: 'paper', x: 280, y: 70 },
        { id: 'mounted', label: 'mounted', note: 'in the DOM — set up here', tone: 'acid', x: 470, y: 70 },
        { id: 'beforeUpdate', label: 'beforeUpdate', note: 'owner re-renders', tone: 'kraft', x: 660, y: 70 },
        { id: 'updated', label: 'updated', note: 'value / oldValue', tone: 'kraft', x: 660, y: 220 },
        { id: 'beforeUnmount', label: 'beforeUnmount', note: 'still in the DOM', tone: 'red', x: 400, y: 220 },
        { id: 'unmounted', label: 'unmounted', note: 'clean up here', tone: 'red', x: 150, y: 220 },
      ],
      edges: [
        { from: 'created', to: 'beforeMount' },
        { from: 'beforeMount', to: 'mounted' },
        { from: 'mounted', to: 'beforeUpdate', label: 'state changes' },
        { from: 'beforeUpdate', to: 'updated' },
        { from: 'updated', to: 'beforeUnmount', label: 'v-if false / unmount' },
        { from: 'beforeUnmount', to: 'unmounted' },
      ],
      steps: [
        { focus: ['created', 'beforeMount'], edges: ['created->beforeMount'], text: '`created` runs before the element\'s attributes and event listeners are applied; `beforeMount` right before it is inserted. Rarely needed.' },
        { focus: ['mounted'], edges: ['beforeMount->mounted'], text: '`mounted` runs once the element — and the component that owns it — is in the DOM. This is where most directives do their setup: focus, add listeners, create library instances.' },
        { focus: ['beforeUpdate', 'updated'], edges: ['mounted->beforeUpdate', 'beforeUpdate->updated'], text: 'Whenever the **owning component** re-renders, `beforeUpdate` and `updated` run — even if this directive\'s value didn\'t change. Compare `binding.value` with `binding.oldValue` to skip needless work.' },
        { focus: ['beforeUnmount', 'unmounted'], edges: ['updated->beforeUnmount', 'beforeUnmount->unmounted'], text: 'When the element is removed, `beforeUnmount` (still in the DOM) and `unmounted` run. Undo everything from `mounted` here — otherwise document listeners and timers leak.' },
      ],
    },
    caption: 'Seven optional hooks; most directives need only `mounted`, sometimes `updated`, and a cleanup hook.',
    alt: 'A loop of seven boxes: created, beforeMount, mounted (set up here), then beforeUpdate and updated when the owning component re-renders, then beforeUnmount and unmounted (clean up here) when the element is removed.',
  },

  animation: {
    type: 'comparison',
    title: 'Directive or composable?',
    props: {
      left: {
        label: 'Directive: behaviour as an attribute',
        lang: 'vue',
        code: `<script setup>
import { vClickOutside } from './clickOutside.js'
const open = ref(false)
</script>

<template>
  <div v-click-outside="() => (open = false)" class="dropdown">
    …
  </div>
</template>`,
      },
      right: {
        label: 'Composable: behaviour as a function',
        lang: 'vue',
        code: `<script setup>
import { useTemplateRef } from 'vue'
import { useClickOutside } from './useClickOutside.js'
const open = ref(false)
const dropdown = useTemplateRef('dropdown')
useClickOutside(dropdown, () => (open.value = false))
</script>

<template>
  <div ref="dropdown" class="dropdown">…</div>
</template>`,
      },
      points: [
        'Both attach and remove a document listener at the right time; both are valid.',
        'The directive is terser in templates and works on any element, even inside `v-for`.',
        'The composable is plain JavaScript: easier to type, to return state from, and to combine with other composables.',
        'Directives only make sense for DOM work; anything that produces state or markup belongs in a composable or component.',
      ],
    },
    caption: 'Same job, two packagings. Pick by ergonomics — and whether you need to return state.',
    alt: 'Side-by-side code. Left: a dropdown with a v-click-outside directive bound to a function that closes it. Right: the same dropdown using a template ref and a useClickOutside composable.',
  },

  syntax: [
    `
#### Defining and using a directive
`,
    {
      code: `<script setup>
// any camelCase variable starting with "v" is a directive in the template
const vHighlight = {
  mounted(el, binding) {
    el.style.backgroundColor = binding.value
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.style.backgroundColor = binding.value
    }
  },
}
</script>

<template>
  <p v-highlight="'yellow'">Look at me</p>
</template>`,
      lang: 'vue',
      title: 'a local directive in <script setup>',
    },
    `
Directives in other files are imported with a \`v\` name (or renamed on import: \`import { highlight as vHighlight } from './highlight.js'\`). Without \`<script setup>\`, list them in the \`directives\` option. To make one available everywhere:
`,
    {
      code: `// main.js
const app = createApp(App)
app.directive('focus', {
  mounted: (el) => el.focus(),
})
app.mount('#app')`,
      lang: 'js',
      title: 'global registration',
    },
    `
#### The hooks and their arguments

Every hook receives \`(el, binding, vnode, prevVnode)\`. \`el\` is the real element — the only argument you should modify. \`prevVnode\` exists only in \`beforeUpdate\`/\`updated\`.

| \`binding\` property | for \`v-pin:top.animate="200"\` |
|---|---|
| \`value\` | \`200\` |
| \`oldValue\` | previous value (meaningful in \`beforeUpdate\`/\`updated\`) |
| \`arg\` | \`'top'\` |
| \`modifiers\` | \`{ animate: true }\` |
| \`instance\` | the component instance that uses the directive |
| \`dir\` | the directive definition object |
`,
    {
      code: `<!-- dynamic argument -->
<div v-pin:[side]="offset">…</div>

<!-- several values: pass an object literal -->
<div v-tooltip="{ text: 'Copy link', delay: 300 }">…</div>`,
      lang: 'vue',
      title: 'dynamic args and object values',
    },
    `
#### Function shorthand

If a directive does the same thing in \`mounted\` and \`updated\` and needs no other hook, write it as a function:
`,
    {
      code: `const vColor = (el, binding) => {
  el.style.color = binding.value
}`,
      lang: 'js',
      title: 'shorthand = mounted + updated',
    },
    `
**The rules:**

1. Use directives for **direct DOM manipulation** on plain elements. Prefer bindings, components and composables for everything else.
2. Undo in \`beforeUnmount\`/\`unmounted\` whatever you set up in \`mounted\` — listeners on \`document\`/\`window\`, timers, observers, library instances.
3. Treat \`binding\` and \`vnode\` as **read-only**. To share data between hooks, store it on the element (\`el.dataset\`, or a \`WeakMap\` keyed by \`el\` for non-string data).
4. \`beforeUpdate\`/\`updated\` run whenever the owning component re-renders — check \`value !== oldValue\` before doing expensive work.
5. Avoid directives on **components**: they apply to the component's root element, can't be forwarded with \`v-bind="$attrs"\`, and are ignored (with a warning) on multi-root components.
`,
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: profileApp,
    intro: 'A profile form using one imported directive and one local directive. Step through it, then improve both in the playground.',
    steps: [
      { lines: [3], text: '`vFocus` is imported from `focus.js`. Because its name starts with `v`, `<script setup>` makes it available in the template as `v-focus`.' },
      { lines: [9, 13], text: 'A local directive is just an object of hooks. This one only has `mounted`, which runs once the element is in the DOM.' },
      { lines: [10, 11], text: 'Hooks receive the real element (`el`) and a `binding` object. `binding.value` is whatever the attribute\'s expression evaluates to — here the current colour.' },
      { lines: [20], text: '`v-focus` sits next to `v-model`: directives combine freely. When the input is inserted, `mounted` focuses it.' },
      { lines: [23], text: '`v-highlight="color"` passes the `color` ref (unwrapped) as `binding.value`.' },
      { lines: [27, 31], text: 'Changing the select changes `color` and re-renders the component — but `vHighlight` has no `updated` hook, so the background never changes. That is your first experiment.' },
    ],
  },

  playground: {
    title: 'Profile form',
    objective: 'Make a directive follow updates, add an argument and a modifier, see v-focus work on dynamic elements, and trace the hook order.',
    files: { 'App.vue': profileApp, 'focus.js': focusFile },
    expected: 'The **Display name** input is focused on load (that\'s `v-focus`). The tip has a yellow background. Pick **Green** in the select: nothing happens — the directive only ran once.',
    experiments: [
      {
        id: 'follow-updates',
        task: 'Make `v-highlight` follow changes: picking another colour should recolour the tip.',
        hint: 'Add an `updated(el, binding)` hook doing the same assignment — or replace the object with the function shorthand: `const vHighlight = (el, binding) => { el.style.backgroundColor = binding.value }`.',
        tests: [
          {
            name: 'the background changes with the select',
            code: `const before = find('.tip').style.backgroundColor
expect(before).not.toBe('')
await select('.color', '#c8f7c5')
expect(find('.tip').style.backgroundColor).not.toBe(before)
expect(find('.tip').style.backgroundColor).not.toBe('')`,
          },
        ],
        explain: '`updated` runs after the owning component re-renders. The function shorthand registers the same function for `mounted` and `updated`, which is exactly what simple "apply this value" directives need.',
      },
      {
        id: 'arg-and-modifier',
        task: 'Teach `v-highlight` an **argument** and a **modifier**: `v-highlight:text` colours the *text* instead of the background, and `.bold` makes it bold. Use it on a new `<p v-highlight:text.bold="\'#c0392b\'" class="warning">Display names are public.</p>`.',
        hint: 'Inside the directive: `const prop = binding.arg === \'text\' ? \'color\' : \'backgroundColor\'`, then `el.style[prop] = binding.value`, and `if (binding.modifiers.bold) el.style.fontWeight = \'bold\'`.',
        tests: [
          {
            name: 'arg switches the property, modifier adds bold',
            code: `const warning = find('.warning')
expect(warning).toBeTruthy()
expect(warning.style.color).not.toBe('')
expect(warning.style.backgroundColor).toBe('')
expect(warning.style.fontWeight).toBe('bold')
expect(find('.tip').style.backgroundColor).not.toBe('')`,
          },
        ],
        explain: '`binding.arg` is the part after the colon, `binding.modifiers` an object of the dot-suffixes. The same directive now covers several variations without extra attributes.',
      },
      {
        id: 'focus-on-reveal',
        task: 'Add an **Add bio** button (`class="add-bio"`) that reveals `<textarea class="bio">` with `v-if`. Put `v-focus` on the textarea.',
        hint: '`const showBio = ref(false)`, `<button class="add-bio" @click="showBio = true">Add bio</button>`, and `<textarea v-if="showBio" v-focus class="bio"></textarea>`.',
        tests: [
          {
            name: 'the revealed textarea is focused',
            code: `const btn = find('.add-bio')
expect(btn).toBeTruthy()
await click(btn)
expect(document.activeElement).toBe(find('.bio'))`,
          },
        ],
        explain: 'The `autofocus` attribute only works on page load. A directive\'s `mounted` hook runs every time Vue inserts the element — including when `v-if` brings it in later — without any `nextTick` juggling.',
      },
      {
        id: 'trace-hooks',
        task: 'Create a `vTrace` directive whose seven hooks each log their own name (`created`, `beforeMount`, `mounted`, `beforeUpdate`, `updated`, `beforeUnmount`, `unmounted`). Put `v-trace` on the name input, run, and type a letter.',
        hint: 'Write the object by hand, or: `const vTrace = Object.fromEntries([\'created\', \'beforeMount\', \'mounted\', \'beforeUpdate\', \'updated\', \'beforeUnmount\', \'unmounted\'].map((h) => [h, () => console.log(h)]))`.',
        tests: [
          {
            name: 'hooks fire in lifecycle order',
            code: `await type('.name', 'A')
const order = ['created', 'beforeMount', 'mounted', 'beforeUpdate', 'updated']
for (const hook of order) expect(logs).toContain(hook)
const idx = order.map((hook) => logs.indexOf(hook))
expect(idx).toEqual([...idx].sort((a, b) => a - b))`,
          },
        ],
        explain: 'Typing changed `name`, so the component re-rendered and the input\'s directive hooks ran. Try clicking elsewhere to trigger unrelated re-renders: `beforeUpdate`/`updated` fire for **every** re-render of the owning component — which is why real directives compare `value` with `oldValue`.',
      },
    ],
  },

  internals: {
    beginner: `
When Vue builds an element that has a custom directive, it remembers "this element has these directive objects attached". Then, at each step of the element's life — about to be created, inserted, updated, removed — it checks whether your directive has a hook with that name and calls it, handing over the real element and the current value.
`,
    technical: [
      `
The template compiler turns directives into a \`withDirectives()\` call around the element's vnode. This is real Vue 3.5 output for \`<input v-focus />\` and \`<p v-pin:top.animate="200">\` in \`<script setup>\`:
`,
      {
        code: `_withDirectives(_createElementVNode("input", null, null, 512 /* NEED_PATCH */), [
  [vFocus]                                   // local directive: referenced directly
]),
_withDirectives(_createElementBlock("p", …), [
  [_directive_pin, 200, "top", { animate: true }]   // [dir, value, arg, modifiers]
])
// _directive_pin = _resolveDirective("pin") — a globally registered directive`,
        lang: 'js',
        title: 'compiled output',
      },
      `
\`withDirectives\` stores the bindings on \`vnode.dirs\`. The \`NEED_PATCH\` flag tells the renderer to keep visiting this element on updates even though nothing else about it is dynamic. The renderer then invokes the hooks at fixed points:

- \`created\` before props and listeners are applied, \`beforeMount\` before insertion;
- \`mounted\` queued to run after the whole component subtree is in the DOM;
- \`beforeUpdate\` before patching the element and \`updated\` after the owning component finishes updating — on every re-render of that component, with \`oldValue\` set from the previous binding;
- \`beforeUnmount\` / \`unmounted\` around removal.
`,
      {
        code: `// A simplified model of how the renderer calls directive hooks — not Vue's real source
function invokeDirectiveHook(vnode, prevVNode, hookName) {
  const bindings = vnode.dirs
  const oldBindings = prevVNode && prevVNode.dirs
  bindings.forEach((binding, i) => {
    if (oldBindings) binding.oldValue = oldBindings[i].value
    const hook = binding.dir[hookName]
    if (hook) hook(vnode.el, binding, vnode, prevVNode)
  })
}`,
        lang: 'js',
        title: 'mental model: invoking hooks',
      },
      `
On **components**, Vue applies the directive to the component's root element (\`vnode.el\` of the component). With several root nodes there is no single element, so Vue warns and skips it.

**Server-side rendering:** directive hooks don't run on the server (there is no DOM). A directive can provide \`getSSRProps(binding, vnode)\` to return attributes that should be rendered into the server HTML.
`,
    ],
    production: `
- **Always pair setup with teardown.** Every \`addEventListener\` on \`document\`/\`window\`, \`setTimeout\`/\`setInterval\`, observer or library instance created in \`mounted\` needs a matching cleanup. Keep the handles in a \`WeakMap\` keyed by \`el\` (or on the element) so the cleanup hook can find them.
- **Handle changing values.** If the binding is a function (\`v-click-outside="() => …"\`), it's a new function on every render — update the stored callback in \`updated\` rather than re-adding listeners.
- **Skip redundant work** in \`updated\` by comparing \`binding.value\` and \`binding.oldValue\` (for objects, compare the fields you care about).
- **Register app-wide directives in a plugin** (\`app.directive\`) so naming and behaviour are consistent — see [Plugins & app-level configuration](lesson:plugins-app-config).
- **Type them** in TypeScript with \`Directive<HTMLElement, ValueType>\` (static code in a TS project).
- **Know the limits.** Directives can't render markup or hold reactive state for the template; reach for a component or composable when you need either.
`,
  },

  mistakes: [
    {
      title: 'Adding a document listener without removing it',
      wrong: { code: `export const vClickOutside = {\n  mounted(el, binding) {\n    document.addEventListener('click', (e) => {\n      if (!el.contains(e.target)) binding.value(e)\n    })\n  },\n}`, lang: 'js' },
      right: { code: `const handlers = new WeakMap()\nexport const vClickOutside = {\n  mounted(el, binding) {\n    const onClick = (e) => { if (!el.contains(e.target)) handlers.get(el).cb(e) }\n    handlers.set(el, { onClick, cb: binding.value })\n    document.addEventListener('click', onClick)\n  },\n  updated(el, binding) { handlers.get(el).cb = binding.value },\n  unmounted(el) {\n    document.removeEventListener('click', handlers.get(el).onClick)\n    handlers.delete(el)\n  },\n}`, lang: 'js' },
      explanation: 'The anonymous listener can never be removed, so every mount adds another one that keeps running after the element is gone — a memory leak and a source of ghost callbacks. Keep a reference and remove it in `unmounted`.',
    },
    {
      title: 'Only implementing `mounted` for a value that changes',
      wrong: { code: `const vHighlight = {\n  mounted(el, binding) { el.style.backgroundColor = binding.value },\n}`, lang: 'js' },
      right: { code: `const vHighlight = (el, binding) => {\n  el.style.backgroundColor = binding.value // mounted + updated\n}`, lang: 'js' },
      explanation: '`mounted` runs once. If the bound value can change, handle `updated` too — the function shorthand does both.',
    },
    {
      title: 'Using a directive for something a binding can do',
      wrong: { code: `const vActive = (el, binding) => {\n  el.classList.toggle('active', binding.value)\n}\n// <li v-active="tab === current">`, lang: 'js' },
      right: { code: `<li :class="{ active: tab === current }">`, lang: 'vue' },
      explanation: 'Class, style, attribute and text changes are exactly what bindings are for. A directive here adds indirection and can fight Vue\'s own class patching.',
    },
    {
      title: 'Mutating `binding` to share state between hooks',
      wrong: { code: `mounted(el, binding) {\n  binding.timer = setInterval(tick, 1000)\n},\nunmounted(el, binding) {\n  clearInterval(binding.timer)\n}`, lang: 'js' },
      right: { code: `const timers = new WeakMap()\n// mounted:   timers.set(el, setInterval(tick, 1000))\n// unmounted: clearInterval(timers.get(el)); timers.delete(el)`, lang: 'js' },
      explanation: 'The docs ask you to treat `binding` as read-only. Store per-element data on the element (`el.dataset` for strings) or in a `WeakMap` keyed by the element.',
    },
    {
      title: 'Putting a directive on a multi-root component',
      wrong: { code: `<!-- UserCard.vue has two root elements -->\n<UserCard v-tooltip="'Profile'" />`, lang: 'vue' },
      right: { code: `<!-- apply it to an element inside UserCard, or accept a prop -->\n<UserCard tooltip="Profile" />`, lang: 'vue' },
      explanation: 'Directives on components target the root element. With multiple roots Vue can\'t choose one, warns, and ignores the directive — and unlike attributes, directives can\'t be forwarded with `v-bind="$attrs"`.',
    },
  ],

  debugging: [
    {
      symptom: '`Failed to resolve directive: focus` in the console.',
      cause: 'The directive isn\'t registered: the `<script setup>` variable doesn\'t start with `v` (e.g. `focus` instead of `vFocus`), or it was never imported or registered globally.',
      fix: 'Name it `vFocus` (or rename on import), or register it with `app.directive(\'focus\', …)`.',
    },
    {
      symptom: 'The directive works once but ignores later value changes.',
      cause: 'Only a `mounted` hook is implemented.',
      fix: 'Add an `updated` hook, or use the function shorthand.',
    },
    {
      symptom: 'Callbacks keep firing after navigating away, or memory grows over time.',
      cause: 'Listeners, timers or observers added in `mounted` are never removed.',
      fix: 'Store the handles per element and remove them in `beforeUnmount`/`unmounted`.',
    },
    {
      symptom: 'A click-outside menu closes immediately after it opens.',
      cause: 'The menu (and its directive) is mounted during the click that opened it; the new document listener then receives that same click as it bubbles up.',
      fix: 'Put the directive on an element that exists before the click (the wrapper), listen for `pointerdown` instead, or ignore events that started before the directive was mounted.',
    },
    {
      symptom: 'Vue warns about runtime directives on a component that "renders non-element root node".',
      cause: 'The directive is used on a component with multiple roots (or a fragment/text root).',
      fix: 'Move the directive to an element inside the component, or expose the behaviour as a prop.',
    },
  ],

  bestPractices: [
    'Reserve custom directives for direct DOM manipulation; use bindings, components and composables otherwise.',
    'Clean up everything you set up: listeners, timers, observers, third-party instances.',
    'Keep per-element state in a `WeakMap` (or `el.dataset`), never on `binding`.',
    'Update stored callbacks in `updated` and skip work when `value === oldValue`.',
    'Use plain elements; avoid directives on components, especially multi-root ones.',
    'Register shared directives globally through a plugin with clear, `v-` prefixed names.',
  ],

  useCases: [
    '`v-focus` — focus inputs when they are inserted (dialogs, inline editors).',
    '`v-click-outside` — close dropdowns, popovers and menus.',
    '`v-long-press` — destructive actions that require holding a button.',
    '`v-tooltip` — attach a tooltip library to an element and destroy it on unmount.',
    '`v-intersect` / lazy images — start an `IntersectionObserver` for the element.',
    '`v-select-all` — select a coupon code or share link when it is focused.',
  ],

  whenToUse: {
    use: [
      'The behaviour needs the real element (focus, listeners, observers, measurements, libraries).',
      'The same low-level behaviour is needed on many elements across the app.',
      'The behaviour has clear setup and teardown tied to the element\'s lifetime.',
    ],
    avoid: [
      'Changing classes, styles, attributes or text — use bindings.',
      'Behaviour that renders markup or owns reactive state — use a component.',
      'Logic you want to return values from or compose — use a composable.',
      'Applying behaviour to a component\'s internals from outside.',
    ],
  },

  comparison: {
    title: 'Where should reusable DOM behaviour live?',
    headers: ['', 'custom directive', 'composable + template ref', 'wrapper component', 'inline ref + hooks'],
    rows: [
      ['Usage in template', '`<div v-click-outside="close">`', '`ref="el"` + a call in setup', '`<ClickOutside @outside="close">`', 'ref + `onMounted` code each time'],
      ['Can return reactive state?', 'no', 'yes', 'via slot props / events', 'yes'],
      ['Can render markup?', 'no', 'no', 'yes', 'n/a'],
      ['Works on any element (incl. in `v-for`)?', 'yes', 'needs a ref per element', 'adds a wrapper', 'needs a ref per element'],
      ['Best for', 'small, reusable DOM effects', 'logic + state around an element', 'behaviour plus its own UI', 'one-off cases'],
    ],
    note: 'For one-off DOM work in a single component, a [template ref](lesson:dom-access-refs) is simplest. Package it as a directive or composable once you need it in several places.',
  },

  quiz: [
    {
      id: 'custom-directives-q1',
      type: 'mcq',
      prompt: 'In `<script setup>`, which variable name lets you write `<button v-tooltip="\'Save\'">` in the template?',
      options: [
        { text: '`const tooltip = { … }`', why: 'Without the `v` prefix, `<script setup>` doesn\'t treat the variable as a directive.' },
        { text: '`const vTooltip = { … }`' },
        { text: '`const v_tooltip = { … }`', why: 'Directive variables use camelCase: `v` + capitalised name.' },
        { text: '`const directiveTooltip = { … }`', why: 'The convention is the `v` prefix, not a word like `directive`.' },
      ],
      answer: 1,
      explanation: 'Any camelCase variable starting with `v` is available as a directive: `vTooltip` → `v-tooltip`.',
    },
    {
      id: 'custom-directives-q2',
      type: 'output',
      prompt: '`vLog` logs the name of every hook it has. `show` starts as `true` and is set to `false` once. Which hooks are logged, in order?',
      code: {
        lang: 'vue',
        code: `<template>
  <p v-if="show" v-log>Hello</p>
</template>`,
      },
      options: [
        'created, beforeMount, mounted, beforeUnmount, unmounted',
        { text: 'mounted, unmounted', why: 'The other hooks exist and run too; they just are less commonly used.' },
        { text: 'created, mounted, updated, unmounted', why: 'Removing the element via `v-if` unmounts it — `updated` runs for re-renders while the element stays.' },
        { text: 'beforeMount, mounted, beforeUpdate, updated', why: 'The element is removed, so the unmount hooks run.' },
      ],
      answer: 0,
      explanation: 'Mounting runs `created` → `beforeMount` → `mounted`; removing the element runs `beforeUnmount` → `unmounted`.',
    },
    {
      id: 'custom-directives-q3',
      type: 'bug',
      prompt: 'This directive leaks: after the dropdown is removed, clicks still call the callback. Click the line responsible.',
      code: {
        lang: 'js',
        code: `export const vClickOutside = {
  mounted(el, binding) {
    document.addEventListener('click', (e) => {
      if (!el.contains(e.target)) binding.value(e)
    })
  },
  unmounted(el, binding) {
    document.removeEventListener('click', (e) => {
      if (!el.contains(e.target)) binding.value(e)
    })
  },
}`,
      },
      answerLine: [3, 8],
      explanation: '`removeEventListener` only removes the **same function object** that was added. Two separate arrow functions are never equal, so nothing is removed. Store the handler (e.g. in a `WeakMap` keyed by `el`) and remove that exact function.',
    },
    {
      id: 'custom-directives-q4',
      type: 'fill',
      prompt: 'For `<div v-pin:top.animate="200">`, fill the blanks so the directive reads the side and the modifier.',
      code: {
        lang: 'js',
        code: `const vPin = {
  mounted(el, binding) {
    const side = binding.___            // 'top'
    const animate = binding.___.animate  // true
    el.style.position = 'fixed'
    el.style[side] = binding.value + 'px'
    if (animate) el.style.transition = 'all 0.2s'
  },
}`,
      },
      answer: [['arg'], ['modifiers']],
      explanation: '`binding.arg` holds the part after the colon; `binding.modifiers` is an object of the dot-suffixes.',
    },
    {
      id: 'custom-directives-q5',
      type: 'mcq',
      prompt: 'A directive is written as a single function: `const vColor = (el, binding) => { … }`. When does Vue call it?',
      options: [
        { text: 'Only on `mounted`', why: 'The shorthand also covers updates.' },
        { text: 'On `mounted` and `updated`' },
        { text: 'On every hook', why: 'Only the two most common hooks — not created/unmount hooks.' },
        { text: 'Only on `created`', why: 'At `created` the element isn\'t even in the DOM yet.' },
      ],
      answer: 1,
      explanation: 'The function shorthand is for directives that do the same thing when the element is mounted and when the owning component updates.',
    },
    {
      id: 'custom-directives-q6',
      type: 'mcq',
      prompt: 'Which are good candidates for a custom directive? **Select all that apply.**',
      options: [
        { text: 'Focusing an input whenever it is inserted' },
        { text: 'Rendering a list of products', why: 'Rendering markup is the job of templates and components.' },
        { text: 'Closing a popover when clicking outside it' },
        { text: 'Formatting a price as text', why: 'That\'s a computed value or a function in the template.' },
        { text: 'Attaching a third-party tooltip library to an element and destroying it on removal' },
      ],
      answer: [0, 2, 4],
      explanation: 'Directives shine for reusable, low-level DOM behaviour with setup and teardown. Rendering and formatting belong elsewhere.',
    },
    {
      id: 'custom-directives-q7',
      type: 'short',
      prompt: 'Why does the Vue documentation recommend against using custom directives on components?',
      answer: 'On a component, a directive applies to the component\'s root element, so it depends on the component\'s internal markup. If the component has multiple root nodes, Vue can\'t pick one, warns and ignores the directive. Unlike attributes, directives can\'t be forwarded to an inner element with v-bind="$attrs". It is clearer to put the directive on a specific element inside the component or expose the behaviour as a prop.',
    },
  ],

  exercises: [
    {
      id: 'click-outside',
      title: 'v-click-outside with proper cleanup',
      difficulty: 'intermediate',
      prompt: `
Implement \`vClickOutside\` in **clickOutside.js**. App.vue (complete) puts it on a dropdown wrapper: \`v-click-outside="onOutside"\`.

- When a click happens **outside** the element, call the bound function with the event.
- Clicks **inside** the element (including the toggle button and menu options) must not call it.
- If the bound function changes between renders, use the latest one.
- When the element is removed, **remove the document listener** — afterwards, outside clicks must not call anything.

App shows the number of outside clicks in \`.count\`; \`.remove\` removes the dropdown.
`,
      files: {
        'clickOutside.js': `// v-click-outside="handler": call handler(event) when a click happens
// OUTSIDE the element.
// TODO: implement mounted, updated and unmounted.
export const vClickOutside = {}`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import { vClickOutside } from './clickOutside.js'

const showDropdown = ref(true)
const open = ref(false)
const outsideClicks = ref(0)

function onOutside() {
  outsideClicks.value++
  open.value = false
}
</script>

<template>
  <p class="outside">Somewhere else on the page</p>
  <p>Outside clicks: <span class="count">{{ outsideClicks }}</span></p>
  <button class="remove" @click="showDropdown = false">Remove dropdown</button>

  <div v-if="showDropdown" v-click-outside="onOutside" class="dropdown">
    <button class="toggle" @click="open = !open">Sort by ▾</button>
    <ul v-if="open" class="menu">
      <li class="option">Price</li>
      <li class="option">Rating</li>
    </ul>
  </div>
</template>`,
      },
      hints: [
        'In `mounted`, create a handler: `(event) => { if (!el.contains(event.target)) callback(event) }` and add it with `document.addEventListener(\'click\', handler)`.',
        'You\'ll need the same handler in `unmounted` and the latest callback in `updated`. Keep both in a `WeakMap`: `handlers.set(el, { onClick, callback: binding.value })`.',
        '`updated(el, binding) { handlers.get(el).callback = binding.value }` and `unmounted(el) { document.removeEventListener(\'click\', handlers.get(el).onClick); handlers.delete(el) }`.',
      ],
      solution: {
        explanation: 'The listener lives on `document` so it sees clicks anywhere; `el.contains(event.target)` tells inside from outside. Keeping the exact handler function in a `WeakMap` is what makes `removeEventListener` work, and reading the callback through the map means `updated` can swap in the latest function without re-adding listeners. The `WeakMap` also lets the entry be garbage-collected with the element.',
        files: {
          'clickOutside.js': `// v-click-outside="handler": call handler(event) when a click happens
// OUTSIDE the element.
const handlers = new WeakMap()

export const vClickOutside = {
  mounted(el, binding) {
    const onClick = (event) => {
      if (!el.contains(event.target)) handlers.get(el).callback(event)
    }
    handlers.set(el, { onClick, callback: binding.value })
    document.addEventListener('click', onClick)
  },
  updated(el, binding) {
    handlers.get(el).callback = binding.value
  },
  unmounted(el) {
    document.removeEventListener('click', handlers.get(el).onClick)
    handlers.delete(el)
  },
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { vClickOutside } from './clickOutside.js'

const showDropdown = ref(true)
const open = ref(false)
const outsideClicks = ref(0)

function onOutside() {
  outsideClicks.value++
  open.value = false
}
</script>

<template>
  <p class="outside">Somewhere else on the page</p>
  <p>Outside clicks: <span class="count">{{ outsideClicks }}</span></p>
  <button class="remove" @click="showDropdown = false">Remove dropdown</button>

  <div v-if="showDropdown" v-click-outside="onOutside" class="dropdown">
    <button class="toggle" @click="open = !open">Sort by ▾</button>
    <ul v-if="open" class="menu">
      <li class="option">Price</li>
      <li class="option">Rating</li>
    </ul>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'the toggle opens the menu', code: `await click('.toggle'); expect(exists('.menu')).toBe(true); expect(text('.count')).toBe('0')` },
        {
          name: 'clicks inside keep it open',
          code: `await click('.toggle')
await click('.option')
expect(exists('.menu')).toBe(true)
expect(text('.count')).toBe('0')`,
        },
        {
          name: 'an outside click calls the handler and closes the menu',
          code: `await click('.toggle')
await click('.outside')
expect(exists('.menu')).toBe(false)
expect(text('.count')).toBe('1')`,
        },
        {
          name: 'the listener is removed with the element',
          code: `await click('.toggle')
await click('.outside')
expect(text('.count')).toBe('1')
await click('.remove')
const before = text('.count')
await click('.outside')
await click('.outside')
expect(text('.count')).toBe(before)`,
        },
      ],
    },
    {
      id: 'long-press',
      title: 'v-long-press with an argument',
      difficulty: 'intermediate',
      prompt: `
Implement \`vLongPress\` in **longPress.js**: \`v-long-press:600="handler"\` calls \`handler\` once the element has been held for 600 ms.

- Start timing on \`pointerdown\`. Cancel on \`pointerup\` or \`pointerleave\`.
- The **argument** is the duration in milliseconds; without one, use **500**.
- Call the handler **once** per press.
- Always call the **latest** bound function (App passes inline arrow functions).
- When the element is removed, **cancel any running timer** and remove the listeners.

App.vue (complete) has \`.hold-fast\` (\`v-long-press:200\`), \`.hold-default\` (no argument), counters \`.fast\` / \`.slow\`, and \`.hide\`, which removes the fast button.
`,
      files: {
        'longPress.js': `// v-long-press:ms="handler" — call handler once the element has been
// pressed for \`ms\` milliseconds (default 500).
// TODO
export const vLongPress = {}`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import { vLongPress } from './longPress.js'

const fast = ref(0)
const slow = ref(0)
const visible = ref(true)
</script>

<template>
  <button v-if="visible" v-long-press:200="() => fast++" class="hold-fast">Hold (0.2 s)</button>
  <button v-long-press="() => slow++" class="hold-default">Hold (default)</button>
  <button class="hide" @click="visible = false">Hide fast button</button>
  <p>Fast: <span class="fast">{{ fast }}</span> · Default: <span class="slow">{{ slow }}</span></p>
</template>`,
      },
      hints: [
        'Duration: `const duration = Number(binding.arg) || 500`. Keep per-element state (`{ handler, timer, start, cancel }`) in a `WeakMap`.',
        '`start = () => { clearTimeout(s.timer); s.timer = setTimeout(() => s.handler(), duration) }` and `cancel = () => clearTimeout(s.timer)`. Add listeners for `pointerdown` (start), `pointerup` and `pointerleave` (cancel).',
        '`updated`: `state.get(el).handler = binding.value`. `beforeUnmount`: call `cancel()`, remove the three listeners and delete the map entry.',
      ],
      solution: {
        explanation: 'The directive turns a pointer gesture into a timed callback, entirely with DOM APIs on the element. The argument configures it per use, the `WeakMap` gives each element its own timer and listeners, `updated` keeps the newest inline function, and cleanup cancels a pending timer so nothing fires after the button is gone.',
        files: {
          'longPress.js': `// v-long-press:ms="handler" — call handler once the element has been
// pressed for \`ms\` milliseconds (default 500).
const state = new WeakMap()

export const vLongPress = {
  mounted(el, binding) {
    const duration = Number(binding.arg) || 500
    const s = { handler: binding.value, timer: null }
    s.start = () => {
      clearTimeout(s.timer)
      s.timer = setTimeout(() => s.handler(), duration)
    }
    s.cancel = () => clearTimeout(s.timer)
    el.addEventListener('pointerdown', s.start)
    el.addEventListener('pointerup', s.cancel)
    el.addEventListener('pointerleave', s.cancel)
    state.set(el, s)
  },
  updated(el, binding) {
    state.get(el).handler = binding.value
  },
  beforeUnmount(el) {
    const s = state.get(el)
    s.cancel()
    el.removeEventListener('pointerdown', s.start)
    el.removeEventListener('pointerup', s.cancel)
    el.removeEventListener('pointerleave', s.cancel)
    state.delete(el)
  },
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { vLongPress } from './longPress.js'

const fast = ref(0)
const slow = ref(0)
const visible = ref(true)
</script>

<template>
  <button v-if="visible" v-long-press:200="() => fast++" class="hold-fast">Hold (0.2 s)</button>
  <button v-long-press="() => slow++" class="hold-default">Hold (default)</button>
  <button class="hide" @click="visible = false">Hide fast button</button>
  <p>Fast: <span class="fast">{{ fast }}</span> · Default: <span class="slow">{{ slow }}</span></p>
</template>`,
        },
      },
      tests: [
        {
          name: 'holding fires once after the argument\'s duration',
          code: `await trigger('.hold-fast', 'pointerdown')
await wait(300)
expect(text('.fast')).toBe('1')
await wait(300)
expect(text('.fast')).toBe('1')`,
        },
        {
          name: 'a quick press does not fire',
          code: `await trigger('.hold-fast', 'pointerdown')
await wait(50)
await trigger('.hold-fast', 'pointerup')
await wait(300)
expect(text('.fast')).toBe('0')`,
        },
        {
          name: 'without an argument the duration is 500 ms',
          code: `await trigger('.hold-default', 'pointerdown')
await wait(300)
expect(text('.slow')).toBe('0')
await wait(350)
expect(text('.slow')).toBe('1')`,
        },
        {
          name: 'removing the element cancels a running press',
          code: `await trigger('.hold-fast', 'pointerdown')
await click('.hide')
await wait(350)
expect(text('.fast')).toBe('0')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'custom-directives-purpose',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a custom directive in Vue 3, and when should you write one?',
      answer: 'An object of lifecycle hooks (`created` … `unmounted`) that Vue calls for an element carrying a `v-name` attribute, passing the real element and a `binding` (value, arg, modifiers, oldValue). Write one for reusable, low-level DOM behaviour on plain elements — focusing, click-outside, gestures, attaching DOM libraries — with setup in `mounted` and cleanup in `unmounted`. For anything a binding, component or composable can do, use those instead.',
      explanation: 'Directives are Vue\'s hook into an element\'s lifecycle, meant for direct DOM manipulation.',
      whyAsked: 'Checks you know the API and — more importantly — its intended, narrow use.',
      mistakes: ['Using directives for rendering or state.', 'Not mentioning cleanup.', 'Confusing them with components.'],
      followUps: ['What is the function shorthand?', 'How do you register a directive globally?'],
      modelAnswer: 'A custom directive is an object of hooks — mounted, updated, unmounted and a few more — that Vue calls for any element with that `v-` attribute, handing me the real element and a binding with the value, argument and modifiers. I use them for reusable DOM-level behaviour like autofocus, click-outside or wiring up a tooltip library, where I need the element and a clean setup/teardown. If a binding, component or composable can do the job, I prefer those.',
    },
    {
      id: 'custom-directives-update-hooks',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'A component renders `<p v-highlight="color">` and also a counter button. The user clicks the counter (which doesn\'t change `color`). Which hooks of `vHighlight` run, and what is `binding.oldValue`?',
      options: [
        'beforeUpdate and updated run; oldValue equals value',
        'No hooks run, because color did not change',
        'Only updated runs; oldValue is undefined',
        'mounted runs again',
      ],
      correctOption: 0,
      answer: '`beforeUpdate` and `updated` run because the **owning component** re-rendered; `oldValue` equals the current `value`. Directives aren\'t tracked per value — compare `value` and `oldValue` to skip work.',
      explanation: 'Directive update hooks follow the component\'s re-renders, not the specific bound expression.',
      whyAsked: 'A subtle behaviour that leads to wasted work or bugs in real directives.',
      mistakes: ['Assuming hooks run only when the value changes.', 'Doing expensive work in `updated` unconditionally.'],
      followUps: ['How would you avoid re-initialising a tooltip library on every update?'],
      modelAnswer: 'Both `beforeUpdate` and `updated` run, because those hooks follow re-renders of the component that owns the element, not changes to the bound value. `oldValue` will equal `value` here. So in real directives I compare the two, and only touch the DOM or call a library\'s update method when something actually changed.',
    },
    {
      id: 'custom-directives-leak',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'After navigating between pages for a while, an app gets slower and a dropdown\'s "close" callback fires on pages where the dropdown isn\'t even shown. The dropdown uses a home-made `v-click-outside`. What would you look for?',
      answer: 'A listener added to `document` in `mounted` that is never removed — often because `unmounted` is missing, or because it calls `removeEventListener` with a *new* function instead of the one that was added. Each mount stacks another live listener holding references to old elements and callbacks. Fix: store the handler per element (WeakMap or element property), remove exactly that function in `unmounted`, and update the stored callback in `updated`.',
      explanation: 'Leaks in directives come from asymmetric setup/teardown of global resources.',
      whyAsked: 'Memory leaks from event listeners are a classic production issue; this checks practical debugging skill.',
      mistakes: ['Blaming Vue Router.', 'Wrapping the callback in try/catch.', 'Not knowing that `removeEventListener` needs the same function reference.'],
      followUps: ['How would you confirm the leak in browser devtools?', 'Why a WeakMap rather than a Map?'],
      modelAnswer: 'I\'d suspect the directive adds a document click listener in `mounted` and never removes it — or tries to with a new arrow function, which doesn\'t match. Every mount leaves another listener behind, still calling old callbacks and keeping old elements in memory. The fix is to keep the exact handler per element, remove it in `unmounted`, and update the stored callback in `updated`. In devtools I\'d check document listeners and heap snapshots for detached elements.',
    },
    {
      id: 'custom-directives-on-components',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: '`<BaseInput v-focus />` doesn\'t focus anything and Vue logs a warning. `BaseInput` renders a `<label>` and an `<input>` side by side. Why, and what would you do?',
      answer: 'A directive on a component is applied to the component\'s root element. `BaseInput` has two root nodes, so there is no single element — Vue warns and skips the directive. (And even with one root, it would target the wrapper, not necessarily the input.) Directives can\'t be forwarded with `$attrs`. Use `v-focus` on the `<input>` inside BaseInput (perhaps behind an `autofocus` prop), or expose a `focus()` method via `defineExpose` and call it from the parent.',
      explanation: 'Directives target elements; components hide their elements behind an API.',
      whyAsked: 'Shows whether you respect component boundaries and know directive limitations.',
      mistakes: ['Adding a wrapper div just to make the directive apply (it would focus the div).', 'Trying `v-bind="$attrs"` to forward it.'],
      followUps: ['How would you implement an `autofocus` prop on BaseInput?'],
      modelAnswer: 'Directives on components go to the root element, and BaseInput has two roots — so Vue can\'t pick one, warns and ignores it. Even with one root, the directive would land on whatever the root is, which may not be the input. Directives also can\'t be forwarded through `$attrs`. I\'d give BaseInput an `autofocus` prop that applies `v-focus` to its inner input, or expose a `focus()` method with `defineExpose`.',
    },
    {
      id: 'custom-directives-vs-composable',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'You need click-outside behaviour in many places. Would you implement it as a directive (`v-click-outside`) or a composable (`useClickOutside(elRef, cb)`)? Discuss trade-offs.',
      answer: 'Both work. The directive is the most ergonomic in templates, needs no template ref, and works on any element including inside `v-for`. The composable is plain JavaScript: easier to type with TypeScript, can return state (e.g. `isOutside`), composes with other composables (e.g. with Escape handling for a full `useDismiss`), and handles multiple elements (trigger + teleported menu) naturally. Many teams provide the composable as the core and a thin directive on top for template convenience.',
      explanation: 'Pick packaging by who consumes it and whether state or composition is needed.',
      whyAsked: 'Senior-level judgment about API design and reusability.',
      mistakes: ['Claiming one is always better.', 'Forgetting teleported content when checking "inside".', 'Ignoring cleanup in either approach.'],
      followUps: ['How would you support a teleported menu in each approach?', 'How would you test them?'],
      modelAnswer: 'I\'d probably build the logic once as a composable — it\'s plain JS, easy to type, can return state and can accept several elements, which matters when a menu is teleported. Then I\'d offer a thin `v-click-outside` directive on top, because in templates an attribute is the nicest API and needs no refs, even inside `v-for`. Either way, the core concerns are the same: one listener per use, comparing against all "inside" elements, and removing the listener on unmount.',
    },
    {
      id: 'custom-directives-ssr',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'What happens to custom directives during server-side rendering, and how can a directive affect server output?',
      answer: 'Directive hooks don\'t run on the server — there\'s no DOM to manipulate — so any effect a directive has is applied only after hydration in the browser. If a directive needs to influence the initial HTML (e.g. add an attribute so the server and client markup match), it can implement `getSSRProps(binding, vnode)` and return props to render on the server. Keep client-only behaviour (focus, listeners) in `mounted`, which only runs in the browser.',
      explanation: 'On the server, Vue renders strings; DOM hooks are meaningless there.',
      whyAsked: 'Probes SSR awareness for teams using Nuxt or custom SSR setups.',
      mistakes: ['Assuming `mounted` runs on the server.', 'Using directives to set content that must be in the server HTML without `getSSRProps`.'],
      followUps: ['How could a directive cause a hydration mismatch?'],
      modelAnswer: 'On the server there\'s no DOM, so directive hooks simply don\'t run; their effects appear only in the browser after hydration. That\'s fine for focus or listeners in `mounted`. If a directive needs to change the initial HTML — say, add an attribute — it can implement `getSSRProps`, returning props that the server renders, so the server markup matches what the client expects.',
    },
    {
      id: 'custom-directives-coding-select-all',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Write `vSelectAll` in `selectAll.js`: when an input with `v-select-all` gets focus, all of its text is selected. It must also work on inputs that appear later, and remove its listener when the element is removed.',
      starter: {
        files: {
          'selectAll.js': `// v-select-all: select the input's whole value when it gains focus
// TODO
export const vSelectAll = {}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { vSelectAll } from './selectAll.js'

const showCoupon = ref(false)
</script>

<template>
  <label>Share link <input v-select-all class="link" value="https://vue-zero.dev/l/abc123" readonly /></label>
  <button class="show" @click="showCoupon = true">Show coupon</button>
  <input v-if="showCoupon" v-select-all class="coupon" value="SUMMER-26" readonly />
</template>`,
        },
      },
      tests: [
        {
          name: 'focusing the link selects all of it',
          code: `await trigger('.link', 'focus')
const input = find('.link')
expect(input.selectionStart).toBe(0)
expect(input.selectionEnd).toBe(input.value.length)`,
        },
        {
          name: 'works on an input inserted later',
          code: `await click('.show')
await trigger('.coupon', 'focus')
const input = find('.coupon')
expect(input.selectionStart).toBe(0)
expect(input.selectionEnd).toBe('SUMMER-26'.length)`,
        },
      ],
      hints: [
        'Add a `focus` listener to the element in `mounted`, and remove it in `unmounted`.',
        'Use one shared handler function so the same reference can be removed: `function selectAll(event) { event.target.select() }`.',
      ],
      answer: 'Attach one shared `focus` handler that calls `event.target.select()` in `mounted`, and remove it in `unmounted`.',
      solution: {
        files: {
          'selectAll.js': `// v-select-all: select the input's whole value when it gains focus
function selectAll(event) {
  event.target.select()
}

export const vSelectAll = {
  mounted(el) {
    el.addEventListener('focus', selectAll)
  },
  unmounted(el) {
    el.removeEventListener('focus', selectAll)
  },
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { vSelectAll } from './selectAll.js'

const showCoupon = ref(false)
</script>

<template>
  <label>Share link <input v-select-all class="link" value="https://vue-zero.dev/l/abc123" readonly /></label>
  <button class="show" @click="showCoupon = true">Show coupon</button>
  <input v-if="showCoupon" v-select-all class="coupon" value="SUMMER-26" readonly />
</template>`,
        },
      },
      explanation: 'Because the handler is a single module-level function that only uses `event.target`, it can be shared by every element and removed by reference. `mounted` runs whenever an element is inserted, so dynamically shown inputs work automatically.',
      whyAsked: 'A small warm-up to check you know the hook signature, listener cleanup and the "works on dynamic elements" benefit.',
      mistakes: ['Selecting in `created`, before the element is in the DOM.', 'Forgetting cleanup.', 'Writing a new anonymous function in `unmounted`.'],
      followUps: ['Why does a shared module-level handler work here but not for click-outside?'],
      modelAnswer: 'In `mounted` I add a focus listener that calls `select()` on the event target, and in `unmounted` I remove it. Because the handler only uses `event.target`, one shared function works for every element and can be removed by reference. And since `mounted` runs whenever Vue inserts an element, inputs revealed later with `v-if` get the behaviour automatically.',
    },
  ],

  takeaways: [
    'A custom directive is an object of hooks (`created` … `unmounted`) that receives the real element and a `binding` (`value`, `oldValue`, `arg`, `modifiers`).',
    'In `<script setup>`, any `vCamelCase` variable is a directive; register app-wide ones with `app.directive()`.',
    'The function shorthand runs on `mounted` and `updated`; update hooks fire on every re-render of the owning component.',
    'Always clean up listeners, timers and library instances in `unmounted`, keeping handles in a `WeakMap` or on the element.',
    'Use directives only for low-level DOM behaviour on plain elements — not on components, and not for rendering or state.',
    'Directive hooks don\'t run during SSR; `getSSRProps` can contribute attributes to server HTML.',
  ],
}
