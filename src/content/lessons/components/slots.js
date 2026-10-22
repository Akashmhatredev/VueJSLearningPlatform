// Lesson: Slots — default, named & fallback

const slotsApp = `<script setup>
import { ref } from 'vue'
import BaseCard from './BaseCard.vue'

const likes = ref(0)
</script>

<template>
  <BaseCard>
    <template #header>
      <h3>Ceramic Mug</h3>
    </template>

    <p>Hand-glazed, holds 350 ml of coffee.</p>
    <p class="likes">{{ likes }} people like this</p>

    <template #footer>
      <button class="like" @click="likes++">♥ Like</button>
    </template>
  </BaseCard>

  <BaseCard>
    <template #header>
      <h3>Gift card</h3>
    </template>
    <p>Let them choose.</p>
  </BaseCard>
</template>`

const baseCard = `<template>
  <article class="card">
    <header class="card-header">
      <slot name="header" />
    </header>

    <div class="card-body">
      <slot />
    </div>

    <footer class="card-footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<style scoped>
.card { border: 2px solid #222; border-radius: 12px; margin: 12px 0; max-width: 320px; overflow: hidden; }
.card-header { background: #ffe14d; padding: 6px 14px; }
.card-header :slotted(h3) { margin: 0; }
.card-body { padding: 6px 14px; }
.card-footer { border-top: 1px dashed #999; padding: 6px 14px; min-height: 1em; }
</style>`

const modalApp = `<script setup>
import { ref } from 'vue'
import ModalShell from './ModalShell.vue'

const showTerms = ref(false)
const showDelete = ref(false)
const deleted = ref(false)

function confirmDelete() {
  deleted.value = true
  showDelete.value = false
}
</script>

<template>
  <button class="open-terms" @click="showTerms = true">Read terms</button>
  <button class="open-delete" @click="showDelete = true">Delete project</button>
  <p v-if="deleted" class="deleted">Project deleted.</p>

  <ModalShell v-if="showTerms" class="terms" @close="showTerms = false">
    <p>Be kind. Don't break things on purpose.</p>
  </ModalShell>

  <ModalShell v-if="showDelete" class="delete" @close="showDelete = false">
    <template #header>Delete this project?</template>
    <p>This cannot be undone.</p>
    <template #footer>
      <button class="cancel" @click="showDelete = false">Cancel</button>
      <button class="confirm" @click="confirmDelete">Delete</button>
    </template>
  </ModalShell>
</template>`

export default {
  id: 'slots',
  title: 'Slots: default, named & fallback',
  summary: 'Let a parent pass whole chunks of template into a child — with the default slot, named slots and fallback content — so layout components stay flexible.',
  difficulty: 'intermediate',
  minutes: 30,
  prerequisites: ['props'],
  related: ['scoped-slots', 'fallthrough-attrs', 'dynamic-components', 'render-functions', 'design-systems', 'accessible-components'],
  tags: ['slots', '<slot>', 'v-slot', '#default', 'named slots', 'fallback content', '$slots', 'useSlots', 'render scope', 'content distribution'],
  apis: [
    { name: '<slot>', summary: 'Marks where parent-provided content is rendered inside a child template. Content between its tags is the fallback.' },
    { name: 'v-slot / #name', summary: 'Targets a named slot from the parent: `<template #footer>…</template>`.' },
    { name: '$slots / useSlots()', summary: 'The slots the parent passed, as functions — useful to check whether a slot was provided.' },
    { name: 'defineSlots()', summary: '3.3+ macro to type slots in TypeScript (no runtime effect).' },
  ],
  docs: [
    { label: 'Vue Guide — Slots', url: 'https://vuejs.org/guide/components/slots.html' },
    { label: 'API — <slot>', url: 'https://vuejs.org/api/built-in-special-elements.html#slot' },
    { label: 'API — v-slot', url: 'https://vuejs.org/api/built-in-directives.html#v-slot' },
  ],

  intro: `
Props pass **data** into a component. **Slots** pass **template content** — elements, text, even other components — from the parent into holes the child leaves open.

The child marks a hole with \`<slot />\`. Whatever the parent writes between the child's tags is rendered there. A component can have several holes, each with a **name** (\`header\`, \`footer\`…), and each hole can show **fallback content** when the parent leaves it empty.

This is how you build cards, modals, layouts and buttons that look consistent but can hold anything.
`,

  why: `
Imagine a \`BaseCard\` built only with props. It starts simple: \`title\`, \`body\`. Then someone needs a title with an icon. Then a body with a list. Then a footer with two buttons — one of them red. Soon you have \`titleIcon\`, \`bodyHtml\`, \`footerButtons\`, \`showSecondButton\`, \`secondButtonColor\`…

That's **prop explosion**: the component tries to anticipate every possible piece of content, and fails. Worse, \`bodyHtml\` with \`v-html\` opens the door to cross-site scripting.

Slots flip the responsibility. The card owns the **frame** — the border, spacing, header strip, footer line. The parent owns the **content** and writes it as normal template code, with full access to its own data and event handlers. The card never needs to change when the content does.
`,

  eli15: `
Think of a picture frame. The frame maker decides the size, the wood, the glass. But the frame comes with a **hole** in the middle — you decide what picture goes in.

Some fancy frames have **several** holes: a big one for a photo and a small one at the bottom for a caption. Each hole has a name, so you know which picture goes where.

And some frames come with a **sample photo** already inside ("Your picture here!"). If you don't put your own picture in, you see the sample. That's **fallback content**.

In Vue, the frame is the child component, the holes are \`<slot>\` tags, and the pictures are whatever the parent writes between the component's tags.
`,

  analogy: {
    title: 'A picture frame with labelled openings',
    body: `
A frame maker builds a frame with a large opening for a photo and a small one marked "caption". The customer brings their own photo and caption. If the caption opening is left empty, the frame shows its printed sample text instead.

The customer's photo belongs to the customer — the frame maker never sees inside the photo; they just decide where it sits.
`,
    mapping: [
      ['the frame', 'the child component (layout, styling, structure)'],
      ['the main opening', 'the default slot: `<slot />`'],
      ['the opening labelled "caption"', 'a named slot: `<slot name="caption" />`'],
      ['the customer\'s photo', 'the parent\'s slot content'],
      ['the printed sample in the frame', 'fallback content inside `<slot>…</slot>`'],
      ['the photo belongs to the customer', 'slot content is compiled in the parent\'s scope'],
    ],
  },

  visual: {
    type: 'component-flow',
    props: { mode: 'slots' },
    title: 'Content flows into the child\'s slots',
    caption: 'The parent writes template content; Vue hands it to the child, which places it into the matching `<slot>` outlets. Click a component to see its code.',
    alt: 'An animated diagram: blocks of markup written in the parent component travel down into labelled openings (header, default, footer) inside the child component\'s layout.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Who owns what in a slot',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'parent', label: 'Parent template', note: 'likes = 3', tone: 'acid', x: 140, y: 70 },
        { id: 'fns', label: 'slot functions', note: '{ header, default, footer }', tone: 'kraft', x: 400, y: 70 },
        { id: 'child', label: 'BaseCard template', note: 'frame + <slot> outlets', tone: 'cobalt', x: 650, y: 70 },
        { id: 'header', label: '<slot name="header">', note: 'filled', x: 470, y: 250 },
        { id: 'footer', label: '<slot name="footer">', note: 'empty → fallback', tone: 'red', x: 690, y: 250 },
        { id: 'dom', label: 'Rendered card', x: 200, y: 250 },
      ],
      edges: [
        { from: 'parent', to: 'fns', label: 'compiled into' },
        { from: 'fns', to: 'child', label: 'passed as children' },
        { from: 'child', to: 'header', label: 'calls header()' },
        { from: 'child', to: 'footer', label: 'no fn → fallback' },
        { from: 'header', to: 'dom' },
      ],
      steps: [
        { focus: ['parent'], text: 'The parent writes content between `<BaseCard>` tags. It can use **its own** data (`likes`) and handlers (`likes++`).' },
        { focus: ['fns'], edges: ['parent->fns'], text: 'The compiler turns each block into a **function** — one per slot name. They are still the parent\'s code, closing over the parent\'s scope.' },
        { focus: ['child'], edges: ['fns->child'], text: 'Those functions are passed to the child like hidden children. The child decides **where** (and whether) to render each one.' },
        { focus: ['header'], edges: ['child->header'], text: 'Where the child has `<slot name="header" />`, it calls the `header` function and inserts the result.' },
        { focus: ['footer'], edges: ['child->footer'], text: 'The parent passed no `footer`, so the child renders the **fallback** content written inside `<slot name="footer">…</slot>`.' },
        { focus: ['dom'], edges: ['header->dom'], text: 'Result: the child\'s frame with the parent\'s content inside. The child never saw `likes` — it only placed the parent\'s content.' },
      ],
    },
    caption: 'Slot content is compiled in the parent, passed to the child as functions, and placed where the child\'s `<slot>` outlets are.',
    alt: 'A stepped diagram: the parent template is compiled into slot functions (header, default, footer), passed to the BaseCard template, which calls header() into the header outlet and falls back to default content for the empty footer outlet, producing the rendered card.',
  },

  syntax: [
    `
**Default slot.** The child marks the outlet; the parent puts content between the tags:
`,
    {
      code: `<!-- SubmitButton.vue -->
<template>
  <button type="submit" class="submit">
    <slot>Submit</slot>   <!-- "Submit" is the fallback -->
  </button>
</template>

<!-- parent -->
<SubmitButton />                               <!-- renders: Submit -->
<SubmitButton>Save changes</SubmitButton>      <!-- renders: Save changes -->
<SubmitButton><strong>Pay</strong> $20</SubmitButton>  <!-- any markup -->`,
      lang: 'vue',
      title: 'default slot with fallback',
    },
    `
**Named slots.** Give outlets a \`name\`; target them from the parent with \`<template v-slot:name>\` — usually shortened to \`#name\`. Anything not inside a named \`<template>\` goes to the **default** slot:
`,
    {
      code: `<!-- BaseCard.vue -->
<template>
  <article class="card">
    <header><slot name="header" /></header>
    <div class="body"><slot /></div>              <!-- name="default" implied -->
    <footer><slot name="footer">Free shipping over $30</slot></footer>
  </article>
</template>

<!-- parent -->
<BaseCard>
  <template #header>
    <h3>Ceramic Mug</h3>
  </template>

  <p>Hand-glazed, 350 ml.</p>                       <!-- default slot -->

  <template #footer>
    <button @click="addToCart">Add to cart</button>
  </template>
</BaseCard>`,
      lang: 'vue',
      title: 'named slots',
    },
    `
**Render scope.** Slot content is compiled in the **parent**, so it can use the parent's data and methods — and *cannot* see the child's variables:

> Expressions in the parent template only have access to the parent scope; expressions in the child template only have access to the child scope.

If the child needs to give data *to* the slot content (like "here's the current row"), that's a **scoped slot** — the [next lesson](lesson:scoped-slots).

**Checking whether a slot was passed** — to avoid rendering an empty wrapper:
`,
    {
      code: `<template>
  <article class="card">
    <header v-if="$slots.header" class="card-header">
      <slot name="header" />
    </header>
    <slot />
  </article>
</template>

<script setup>
import { useSlots } from 'vue'
const slots = useSlots()          // same object, for use in script
const hasFooter = () => !!slots.footer
</script>`,
      lang: 'vue',
      title: '$slots / useSlots()',
    },
    `
**More rules:**

1. \`v-slot\` / \`#\` only works on a \`<template>\` or directly on a **component** tag (for its default slot) — not on a \`<div>\`.
2. When you use named slots, put the default content either loose between the tags or in \`<template #default>\`.
3. Slot names can be dynamic: \`<template #[currentTab]>\`.
4. Each slot is optional unless your component requires it; always consider fallback content.
`,
    {
      code: `// TypeScript (reference only): typing slots, Vue 3.3+
defineSlots<{
  default(): any
  header(): any
  footer?(): any
}>()`,
      lang: 'ts',
      static: true,
      title: 'defineSlots (3.3+)',
    },
  ],

  walkthrough: {
    title: 'BaseCard.vue',
    lang: 'vue',
    code: baseCard,
    intro: 'The child owns the frame — structure and styling — and leaves three openings for the parent\'s content.',
    steps: [
      { lines: [2], text: 'The card\'s structure belongs to the child: every card in the app gets the same border, padding and sections.' },
      { lines: [3, 5], text: 'A **named slot**. The parent fills it with `<template #header>`. The `<header>` wrapper always renders here — even when empty (experiment 2 fixes that).' },
      { lines: [7, 9], text: 'The **default slot** — `<slot />` with no name. Any content the parent writes outside named templates lands here.' },
      { lines: [11, 13], text: 'Another named slot, `footer`. The second card in the playground doesn\'t fill it, so this footer renders empty (experiment 1 adds fallback content).' },
      { lines: [20], text: '`:slotted()` lets the child\'s scoped CSS style elements that came from the parent\'s slot content.' },
    ],
  },

  playground: {
    title: 'A reusable card frame',
    objective: 'Fill named and default slots, add fallback content, and skip wrappers for slots the parent didn\'t provide.',
    files: { 'App.vue': slotsApp, 'BaseCard.vue': baseCard },
    expected: 'Two cards with a yellow header strip. The mug card has text and a **♥ Like** button in its footer — clicking it updates the like count (the slot content uses the **parent\'s** `likes`). The gift card has an empty footer line.',
    experiments: [
      {
        id: 'footer-fallback',
        task: 'Give the footer slot **fallback content**: `<small class="fallback">Free shipping on orders over $30</small>`. Cards that pass their own footer should not show it.',
        hint: 'Put the fallback *between* the slot tags: `<slot name="footer"><small class="fallback">…</small></slot>`.',
        tests: [
          {
            name: 'the gift card shows the fallback',
            code: `const footers = findAll('.card-footer')
expect(footers[1].textContent).toContain('Free shipping')`,
          },
          {
            name: 'the mug card shows its own footer instead',
            code: `const footers = findAll('.card-footer')
expect(footers[0].textContent).toContain('Like')
expect(footers[0].textContent).not.toContain('Free shipping')`,
          },
        ],
        explain: 'Fallback content renders only when the parent provides nothing for that slot. It\'s a sensible default that keeps simple usages short.',
      },
      {
        id: 'optional-header',
        task: 'Add a third `<BaseCard>` to `App.vue` with only body text: `<p>Sold out soon!</p>`. Then make `BaseCard` skip the whole `<header class="card-header">` when no header slot is passed.',
        hint: 'In `BaseCard.vue`: `<header v-if="$slots.header" class="card-header">`.',
        tests: [
          {
            name: 'three cards, the third has no header element',
            code: `const cards = findAll('.card')
expect(cards).toHaveLength(3)
expect(cards[2].querySelector('.card-header')).toBeNull()
expect(cards[2].textContent).toContain('Sold out soon!')`,
          },
          {
            name: 'cards with a header still render it',
            code: `expect(findAll('.card')[0].querySelector('.card-header')).toBeTruthy()`,
          },
        ],
        explain: '`$slots` holds a function for every slot the parent passed. Checking it lets a layout component avoid empty wrappers, padding and borders.',
      },
      {
        id: 'badge-slot',
        task: 'Add a new named slot, `badge`, inside the card header (after the header slot). In `App.vue`, give the mug card `<template #badge><span class="badge">New</span></template>`.',
        hint: 'Child: `<slot name="badge" />` inside `<header>`. Parent: a new `<template #badge>` block inside the first `<BaseCard>`.',
        tests: [
          {
            name: 'the mug card shows a New badge in its header',
            code: `const header = findAll('.card')[0].querySelector('.card-header')
expect(header.querySelector('.badge')).toBeTruthy()
expect(header.textContent).toContain('New')`,
          },
        ],
        explain: 'Adding a slot extends the component without breaking existing usages — cards that don\'t pass a badge simply render nothing there.',
      },
      {
        id: 'render-scope',
        task: 'Inside the mug card\'s footer template in `App.vue`, try to display `{{ title }}` (a variable that does not exist in App). Read the console, then remove it.',
        explain: 'You get a warning like `Property "title" was accessed during render but is not defined on instance` — slot content is compiled in the **parent\'s** scope. It can use `likes` because App owns it, but it can never see the child\'s variables. Passing data from child to slot is what scoped slots are for.',
      },
    ],
  },

  internals: {
    beginner: `
When the parent writes content between \`<BaseCard>\` tags, Vue doesn't render it right away. It wraps each block in a little **function** and gives the functions to the child. When the child reaches \`<slot name="header" />\`, it calls the \`header\` function and puts the result there. If there's no function for a slot, it shows the fallback.
`,
    technical: [
      `
Slots compile to an object of functions passed as the component's children:
`,
      {
        code: `// Parent: <BaseCard><template #header><h3>Mug</h3></template><p>Body</p></BaseCard>
// compiles to roughly (simplified):
h(BaseCard, null, {
  header: withCtx(() => [h('h3', 'Mug')]),
  default: withCtx(() => [h('p', 'Body')]),
  _: 1,                       // compiler hint: these slots are stable
})

// Child: <slot name="footer">Free shipping</slot> compiles to roughly:
renderSlot($slots, 'footer', {}, () => ['Free shipping'])`,
        lang: 'js',
        title: 'slots are functions (simplified compile output)',
      },
      `
Consequences:

- **Lazy**: slot content is only created when the child calls the function. If the child puts \`<slot>\` inside a \`v-if\` that is false, the parent's content is never rendered.
- **Parent scope**: \`withCtx\` keeps the parent as the "owner" of the content — the functions close over the parent's variables, and the parent's scoped-CSS attribute is applied to them. That's why the child needs \`:slotted()\` to style slot content.
- **Fine-grained updates**: the slot function runs during the *child's* render, so reactive reads inside slot content (like the parent's \`likes\`) are tracked by the child's render effect. Changing \`likes\` re-renders the card that shows it. The \`_: 1\` hint tells Vue the slot structure is static, so a parent re-render doesn't force the child to update just because "children" were passed.
- \`$slots\` contains only the slots the parent actually passed, which is what makes \`v-if="$slots.header"\` work. It tells you a slot was *passed*, not that it renders visible content.
`,
    ],
    production: `
- **Prefer slots over HTML-string props.** \`v-html\` with user-controlled content is an XSS risk ([v-html security](lesson:v-html)); slots keep content as safe, compiled template.
- **Design the frame, not the content.** Base components (cards, modals, layouts, list items) expose a small set of well-named slots with good fallbacks.
- **Skip empty wrappers** with \`$slots\` checks so spacing and borders don't appear for missing sections.
- **Let the parent own semantics**: a card shouldn't hard-code \`<h2>\` vs \`<h3>\` for its title; a \`header\` slot lets the page choose the right heading level for accessibility.
- **Document slots** (and type them with \`defineSlots\` in TypeScript, 3.3+) — they're part of the public API just like props and events.
- When slot content needs data from the child (rows, items, state), use [scoped slots](lesson:scoped-slots).
`,
  },

  mistakes: [
    {
      title: 'Using v-slot on a plain element',
      wrong: { code: `<BaseCard>\n  <div v-slot:footer>\n    <button>Buy</button>\n  </div>\n</BaseCard>`, lang: 'vue' },
      right: { code: `<BaseCard>\n  <template #footer>\n    <button>Buy</button>\n  </template>\n</BaseCard>`, lang: 'vue' },
      explanation: '`v-slot` is only allowed on `<template>` or on a component tag. The compiler reports an error for other elements.',
    },
    {
      title: 'Expecting slot content to see the child\'s data',
      wrong: { code: `<!-- UserCard has const user = {...} inside -->\n<UserCard>\n  <p>{{ user.name }}</p>  <!-- user is not defined in the parent -->\n</UserCard>`, lang: 'vue' },
      right: { code: `<!-- UserCard: <slot :user="user" /> -->\n<UserCard v-slot="{ user }">\n  <p>{{ user.name }}</p>\n</UserCard>`, lang: 'vue' },
      explanation: 'Slot content is compiled in the parent\'s scope. To hand data from child to slot, the child passes slot props — a scoped slot.',
    },
    {
      title: 'Prop explosion instead of a slot',
      wrong: { code: `<AppCard\n  title="Mug"\n  title-icon="star"\n  :footer-buttons="['Buy', 'Save']"\n  second-button-color="red"\n/>`, lang: 'vue' },
      right: { code: `<AppCard>\n  <template #header><StarIcon /> Mug</template>\n  <template #footer>\n    <BaseButton>Buy</BaseButton>\n    <BaseButton variant="danger">Save</BaseButton>\n  </template>\n</AppCard>`, lang: 'vue' },
      explanation: 'When props start describing markup, the content belongs in a slot. The card keeps its layout; the parent controls the content.',
    },
    {
      title: 'Always rendering the wrapper of an optional slot',
      wrong: { code: `<footer class="card-footer">\n  <slot name="footer" />\n</footer>`, lang: 'vue' },
      right: { code: `<footer v-if="$slots.footer" class="card-footer">\n  <slot name="footer" />\n</footer>`, lang: 'vue' },
      explanation: 'An empty footer still has padding and a border. Render the wrapper only if the slot was passed — or give it fallback content.',
    },
  ],

  debugging: [
    {
      symptom: 'Content passed to a component doesn\'t appear at all.',
      cause: 'The child has no `<slot>` for it, or the names don\'t match (`#Footer` vs `name="footer"`).',
      fix: 'Add the outlet in the child and make the names identical (slot names are case-sensitive).',
    },
    {
      symptom: 'Warning: `Property "x" was accessed during render but is not defined on instance` inside slot content.',
      cause: 'The slot content uses a variable that only exists in the child.',
      fix: 'Use parent data, or have the child expose it as a slot prop (scoped slot).',
    },
    {
      symptom: 'Compile error about `v-slot` usage.',
      cause: '`v-slot` placed on a regular element, or default-slot `v-slot` on the component mixed with nested named `<template>`s.',
      fix: 'Use `<template #name>` for every slot when you have named slots, including `<template #default>` if the default needs slot props.',
    },
    {
      symptom: 'Child styles don\'t apply to slot content.',
      cause: 'Scoped CSS of the child doesn\'t match elements owned by the parent.',
      fix: 'Use `:slotted(selector)` in the child\'s scoped styles, or style the content in the parent.',
    },
  ],

  bestPractices: [
    'Use slots for markup and props for data/configuration.',
    'Name slots after their role (`header`, `footer`, `actions`, `empty`), not their looks.',
    'Provide fallback content for slots with a sensible default.',
    'Check `$slots.name` before rendering wrappers of optional slots.',
    'Keep slot content in the parent\'s scope; use scoped slots when the child must share data.',
    'Avoid `v-html` props for rich content — slots are safer and more flexible.',
  ],

  useCases: [
    'Layout components: page shells with `header`, `sidebar`, `default`, `footer`.',
    'Cards, panels and list items with flexible content.',
    'Modals and dialogs with custom bodies and action buttons.',
    'Buttons with icons or rich labels.',
    'Empty states with a custom message and call-to-action.',
  ],

  whenToUse: {
    use: [
      'The parent needs to supply markup, components or formatted content.',
      'A component provides structure/styling around content it shouldn\'t know about.',
      'You see props that describe markup (`titleIcon`, `footerButtons`, `bodyHtml`).',
    ],
    avoid: [
      'Passing plain data like a name or a price — use props.',
      'The child needs to control the content\'s data — use scoped slots or props.',
      'Every usage has identical content — keep it inside the component.',
    ],
  },

  comparison: {
    title: 'Slots vs props',
    headers: ['', 'Props', 'Slots'],
    rows: [
      ['Pass', 'data (strings, numbers, objects, functions)', 'template content (elements, components, text)'],
      ['Who writes the markup?', 'the child', 'the parent'],
      ['Scope of expressions', 'evaluated in the parent, value given to child', 'compiled in the parent, rendered by the child'],
      ['Optional default', '`default` option', 'fallback content inside `<slot>`'],
      ['Check if provided', 'compare to `undefined`', '`$slots.name`'],
      ['Typical', '`title`, `price`, `variant`', 'card body, modal footer, button label with icon'],
    ],
    note: 'Many good components use both: props for configuration, slots for content.',
  },

  quiz: [
    {
      id: 'slots-q1',
      type: 'output',
      prompt: '`SubmitButton.vue` is `<button><slot>Submit</slot></button>`. What text do these two buttons show?',
      code: {
        lang: 'vue',
        code: `<SubmitButton />
<SubmitButton>Save draft</SubmitButton>`,
      },
      options: [
        { text: '"Submit" and "Submit Save draft"', why: 'Fallback content is replaced, not combined, when the parent provides content.' },
        { text: '"Submit" and "Save draft"' },
        { text: 'empty and "Save draft"', why: 'An empty slot shows its fallback content.' },
        { text: '"Submit" and "Submit"', why: 'Provided content replaces the fallback.' },
      ],
      answer: 1,
      explanation: 'Fallback content renders only when the parent passes nothing for that slot.',
    },
    {
      id: 'slots-q2',
      type: 'mcq',
      prompt: 'Parent `App.vue` has `const cartCount = ref(2)`. Inside `<BaseCard>…</BaseCard>` it writes `<p>{{ cartCount }}</p>`. `BaseCard` has its own `const cartCount = ref(99)`. What renders?',
      options: [
        { text: '2' },
        { text: '99', why: 'Slot content is compiled in the parent\'s scope; it never sees the child\'s variables.' },
        { text: 'Nothing — names clash and Vue errors.', why: 'There is no clash: each template only sees its own component\'s scope.' },
        { text: '2 in development, 99 in production', why: 'Scope rules are the same in every build.' },
      ],
      answer: 0,
      explanation: 'Render scope: expressions in the parent\'s template — including slot content — use the parent\'s data.',
    },
    {
      id: 'slots-q3',
      type: 'bug',
      prompt: 'This template fails to compile. Which line causes it?',
      code: {
        lang: 'vue',
        code: `<BaseModal>
  <template #header>
    <h2>Delete file?</h2>
  </template>
  <p>This cannot be undone.</p>
  <div #footer>
    <button>Cancel</button>
  </div>
</BaseModal>`,
      },
      answerLine: 6,
      explanation: '`#footer` (v-slot) can only be used on a `<template>` or a component tag. Use `<template #footer>`.',
    },
    {
      id: 'slots-q4',
      type: 'fill',
      prompt: 'Declare a named outlet in the child and fill it from the parent.',
      code: {
        lang: 'vue',
        code: `<!-- child -->
<footer><slot ___="actions" /></footer>

<!-- parent -->
<template ___actions>
  <button>Save</button>
</template>`,
      },
      answer: [['name'], ['#', 'v-slot:']],
      explanation: '`<slot name="actions">` in the child; `<template #actions>` (short for `v-slot:actions`) in the parent.',
    },
    {
      id: 'slots-q5',
      type: 'mcq',
      prompt: 'What is `$slots.footer` typically used for inside a child template?',
      options: [
        { text: 'Rendering the footer slot content directly with `{{ $slots.footer }}`.', why: 'Slots are functions; you render them with `<slot name="footer" />`.' },
        { text: 'Checking whether the parent passed a footer, e.g. `v-if="$slots.footer"` on a wrapper.' },
        { text: 'Passing data to the footer content.', why: 'That is done with slot props: `<slot name="footer" :data="x" />`.' },
        { text: 'Declaring the slot so Vue knows it exists.', why: 'Slots don\'t need declaring at runtime; `defineSlots` is only for types.' },
      ],
      answer: 1,
      explanation: '`$slots` holds a function for each slot the parent passed, so it\'s ideal for conditional wrappers.',
    },
    {
      id: 'slots-q6',
      type: 'mcq',
      prompt: 'A `NotificationBanner` needs: a severity (`info`/`warning`/`error`), and a message that sometimes contains a link and bold text. How should these be passed?',
      options: [
        { text: 'Both as props, with the message as an HTML string rendered via `v-html`.', why: '`v-html` is an XSS risk with untrusted content and loses component features.' },
        { text: 'Severity as a prop, message as the default slot.' },
        { text: 'Both as slots.', why: 'Severity is a simple value that changes the component\'s styling — a prop.' },
        { text: 'Severity as a slot, message as a prop.', why: 'This is backwards: markup belongs in slots, configuration in props.' },
      ],
      answer: 1,
      explanation: 'Props for configuration/data, slots for rich content.',
    },
    {
      id: 'slots-q7',
      type: 'short',
      prompt: 'Explain the difference between slots and props in two or three sentences.',
      answer: 'Props pass data from parent to child, and the child decides how to render it in its own template. Slots pass template content: the parent writes the markup (compiled in the parent\'s scope with access to parent data), and the child decides where to place it. Use props for values and configuration, slots for flexible content.',
    },
  ],

  exercises: [
    {
      id: 'alert-box',
      title: 'An AlertBox with a named title slot',
      difficulty: 'intermediate',
      prompt: `
Build \`AlertBox.vue\`:

- Root: \`<div class="alert">\` with an extra class equal to the \`type\` prop (\`info\` by default) — e.g. \`class="alert warning"\`.
- A named slot \`title\` rendered inside \`<strong class="alert-title">\`, with fallback text **Heads up!**
- The default slot rendered inside \`<div class="alert-body">\`.

\`App.vue\` already uses it twice.
`,
      files: {
        'App.vue': `<script setup>
import AlertBox from './AlertBox.vue'
</script>

<template>
  <AlertBox>
    Your trial ends in <b>3 days</b>.
  </AlertBox>

  <AlertBox type="warning">
    <template #title>Payment failed</template>
    Please update your card.
  </AlertBox>
</template>`,
        'AlertBox.vue': `<script setup>
// TODO: type prop
</script>

<template>
  <div class="alert">
    <!-- TODO: title slot with fallback, default slot -->
  </div>
</template>`,
      },
      hints: [
        'Declare `defineProps({ type: { type: String, default: \'info\' } })` and bind `:class="[\'alert\', type]"` (or `class="alert" :class="type"`).',
        'Fallback content goes between the slot tags: `<slot name="title">Heads up!</slot>`.',
        '`<strong class="alert-title"><slot name="title">Heads up!</slot></strong>` and `<div class="alert-body"><slot /></div>`.',
      ],
      solution: {
        explanation: '`type` is configuration, so it\'s a prop. The title and body are content the parent writes (including bold text), so they\'re slots — the title with a sensible fallback.',
        files: {
          'App.vue': `<script setup>
import AlertBox from './AlertBox.vue'
</script>

<template>
  <AlertBox>
    Your trial ends in <b>3 days</b>.
  </AlertBox>

  <AlertBox type="warning">
    <template #title>Payment failed</template>
    Please update your card.
  </AlertBox>
</template>`,
          'AlertBox.vue': `<script setup>
defineProps({
  type: { type: String, default: 'info' },
})
</script>

<template>
  <div class="alert" :class="type" role="status">
    <strong class="alert-title"><slot name="title">Heads up!</slot></strong>
    <div class="alert-body"><slot /></div>
  </div>
</template>

<style scoped>
.alert { border-left: 4px solid #3b82f6; padding: 8px 12px; margin: 8px 0; }
.alert.warning { border-color: #f59e0b; }
</style>`,
        },
      },
      tests: [
        {
          name: 'fallback title when none is passed',
          code: `const alerts = findAll('.alert')
expect(alerts[0].querySelector('.alert-title').textContent.trim()).toBe('Heads up!')`,
        },
        {
          name: 'custom title replaces the fallback',
          code: `expect(findAll('.alert-title')[1].textContent.trim()).toBe('Payment failed')`,
        },
        {
          name: 'body content (with markup) lands in .alert-body',
          code: `const body = findAll('.alert-body')[0]
expect(body.textContent).toContain('Your trial ends in 3 days.')
expect(body.querySelector('b')).toBeTruthy()`,
        },
        {
          name: 'type becomes a class (info by default)',
          code: `expect(classes(findAll('.alert')[0])).toContain('info')
expect(classes(findAll('.alert')[1])).toContain('warning')`,
        },
      ],
    },
    {
      id: 'modal-shell',
      title: 'A ModalShell with optional header and a fallback footer',
      difficulty: 'intermediate',
      prompt: `
Finish \`ModalShell.vue\`, a reusable dialog frame:

- Root: \`<div class="modal" role="dialog">\`.
- \`<header class="modal-header">\` containing the \`header\` slot — rendered **only if** the parent passes a header.
- \`<div class="modal-body">\` with the default slot.
- \`<footer class="modal-footer">\` with the \`footer\` slot. Its **fallback** is \`<button class="close">Close</button>\`, which emits a declared \`close\` event.

\`App.vue\` already uses it: the terms dialog relies on the fallback footer, the delete dialog passes its own header and footer.
`,
      files: {
        'App.vue': modalApp,
        'ModalShell.vue': `<script setup>
// TODO: declare the close event
</script>

<template>
  <div class="modal" role="dialog">
    <!-- TODO: optional header, body, footer with fallback -->
  </div>
</template>`,
      },
      hints: [
        '`const emit = defineEmits([\'close\'])`.',
        'Wrap the header slot: `<header v-if="$slots.header" class="modal-header"><slot name="header" /></header>`.',
        'Footer: `<footer class="modal-footer"><slot name="footer"><button class="close" @click="emit(\'close\')">Close</button></slot></footer>`.',
      ],
      solution: {
        explanation: 'The fallback button lives in the child, so it can emit the child\'s `close` event; dialogs that need custom actions replace the whole footer. The `$slots.header` check means simple dialogs don\'t render an empty header bar.',
        files: {
          'App.vue': modalApp,
          'ModalShell.vue': `<script setup>
const emit = defineEmits(['close'])
</script>

<template>
  <div class="modal" role="dialog">
    <header v-if="$slots.header" class="modal-header">
      <slot name="header" />
    </header>

    <div class="modal-body">
      <slot />
    </div>

    <footer class="modal-footer">
      <slot name="footer">
        <button class="close" @click="emit('close')">Close</button>
      </slot>
    </footer>
  </div>
</template>

<style scoped>
.modal { border: 2px solid #222; border-radius: 12px; padding: 12px 16px; margin: 12px 0; max-width: 360px; }
.modal-header { font-weight: bold; margin-bottom: 8px; }
.modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
</style>`,
        },
      },
      tests: [
        {
          name: 'the terms dialog has no header and a fallback Close button',
          code: `await click('.open-terms')
expect(exists('.terms')).toBe(true)
expect(find('.terms .modal-header')).toBeNull()
expect(text('.terms .modal-body')).toContain('Be kind')
expect(exists('.terms .close')).toBe(true)`,
        },
        {
          name: 'the fallback Close button emits close',
          code: `await click('.open-terms')
await click('.terms .close')
expect(exists('.terms')).toBe(false)`,
        },
        {
          name: 'the delete dialog uses its own header and footer',
          code: `await click('.open-delete')
expect(text('.delete .modal-header')).toBe('Delete this project?')
expect(find('.delete .close')).toBeNull()
await click('.delete .confirm')
expect(exists('.delete')).toBe(false)
expect(text('.deleted')).toBe('Project deleted.')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'slots-vs-props',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between slots and props? When do you use each?',
      answer: 'Props pass data from parent to child; the child owns the markup and decides how to render the data. Slots pass template content: the parent writes the markup, compiled in the parent\'s scope, and the child decides where to place it. Use props for values and configuration (`variant`, `title` string, `items`), slots when the parent should control rich content (a card body, modal actions, a button label with an icon).',
      explanation: 'Props = data in; slots = content in.',
      whyAsked: 'A classic question about component API design.',
      mistakes: ['Saying slots are "props for HTML" without mentioning scope.', 'Recommending `v-html` props for rich content.', 'Not knowing fallback content exists.'],
      followUps: ['What is render scope?', 'How do you pass data from the child to slot content?', 'How do you check whether a slot was provided?'],
      modelAnswer: 'Props carry data: the parent passes values, the child renders them with its own markup. Slots carry template: the parent writes markup between the child\'s tags, compiled in the parent\'s scope so it can use the parent\'s data and handlers, and the child decides where to place it with `<slot>`. I use props for configuration and simple values, and slots when the content varies — card bodies, modal footers, rich labels. Slots also prevent prop explosion and avoid unsafe `v-html` props.',
    },
    {
      id: 'slots-render-scope',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is "render scope" for slots, and what does it imply?',
      answer: 'Slot content is compiled as part of the parent\'s template, so its expressions can only access the parent\'s state — never the child\'s, even though the child renders it. If the child needs to provide data to the slot content, it must pass slot props (a scoped slot).',
      explanation: 'Who wrote it decides what it can see — not who renders it.',
      whyAsked: 'Confusion about slot scope is a common source of "undefined" warnings.',
      mistakes: ['Thinking slot content can read the child\'s variables.', 'Not knowing scoped slots are the solution.'],
      followUps: ['How do scoped slots work?', 'How does scoped CSS interact with slot content?'],
      modelAnswer: 'Render scope means expressions are evaluated in the scope of the template they\'re written in. Slot content is written in the parent, so it sees the parent\'s data and methods, even though the child decides where it\'s rendered. The child\'s variables are invisible to it. When the child needs to share data, like the current item in a list, it passes slot props and the parent receives them with `v-slot`. A side effect is styling: the content belongs to the parent, so the child styles it with `:slotted()`.',
    },
    {
      id: 'slots-conditional-wrapper',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Your `PageSection` renders `<div class="section-actions"><slot name="actions" /></div>`. Designers complain about an empty grey bar on sections without actions. Fix it, and mention one edge case.',
      answer: 'Render the wrapper only when the slot was passed: `<div v-if="$slots.actions" class="section-actions">`. Edge case: `$slots.actions` only tells you the parent passed the slot, not that its content is visible — a parent passing `<template #actions><button v-if="false" /></template>` still gets the wrapper. If that matters, inspect the rendered vnodes or let the parent control visibility.',
      explanation: '`$slots` contains functions for passed slots, which makes conditional wrappers easy.',
      whyAsked: 'Practical layout-component skill with a nuance that shows depth.',
      mistakes: ['Using CSS `:empty` hacks only.', 'Adding a `showActions` prop that duplicates information.'],
      followUps: ['How would you access slots in `<script setup>`?', 'Would you use fallback content instead?'],
      modelAnswer: 'I\'d wrap the bar in `v-if="$slots.actions"`, so it only renders when the parent passed an actions slot. In script I can use `useSlots()` for the same check. One nuance: `$slots` tells me a slot was passed, not that it produces visible content — a slot whose only element is behind a false `v-if` still counts — so for that case the parent should simply not pass the slot.',
    },
    {
      id: 'slots-internals',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How are slots implemented under the hood, and what are the practical consequences?',
      answer: 'The parent\'s slot content compiles into functions (one per slot, wrapped in `withCtx` to keep the parent as owner) passed as the component\'s children object. The child calls them via `renderSlot` where `<slot>` appears, passing slot props and a fallback function. Consequences: content is rendered lazily (not at all if the child doesn\'t call it); it closes over the parent\'s scope; reactive reads inside it are tracked by the child\'s render effect because that\'s where it runs; and stable compiled slots avoid forcing child updates on every parent render.',
      explanation: 'Slots are callbacks the child invokes during its render.',
      code: {
        lang: 'js',
        code: `// parent (simplified)
h(BaseCard, null, {
  header: withCtx(() => [h('h3', title.value)]),
  _: 1,
})
// child (simplified)
renderSlot($slots, 'header', {}, () => ['Untitled'])`,
      },
      whyAsked: 'Distinguishes deep understanding — useful for render functions and performance reasoning.',
      mistakes: ['Thinking slot content is rendered by the parent and moved into the child.', 'Not knowing slots are lazy.'],
      followUps: ['How do scoped slots fit into this model?', 'How would you pass slots in a render function?'],
      modelAnswer: 'The compiler turns each slot\'s content into a function and passes an object of those functions as the component\'s children; `withCtx` keeps the parent as the rendering owner. The child calls `renderSlot` where its `<slot>` is, which invokes the function or falls back. Because it\'s a function call during the child\'s render, content is lazy, it closes over the parent\'s scope, and reactive reads inside it subscribe the child\'s render effect. Scoped slots are the same functions receiving arguments — the slot props.',
    },
    {
      id: 'slots-api-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'Design the API for a reusable `DataPanel` (title, optional toolbar, content, optional empty state, optional footer). What would be props, what would be slots?',
      answer: 'Props for configuration and state: `title` (string, with a `header` slot as an override), `loading`, `empty` (boolean or derived from `items`), maybe `variant`. Slots for content: `default` (main content), `toolbar` (buttons/filters — wrapper rendered only when passed), `empty` (fallback "Nothing here yet"), `footer`, and a `header` slot whose fallback renders the `title` prop. Document the slots and type them with `defineSlots`.',
      explanation: 'Combine props for simple cases with slots for customisation; fallbacks keep the common case short.',
      whyAsked: 'Assesses API design judgment for shared components.',
      mistakes: ['Exposing only props (`toolbarButtons` arrays).', 'Exposing only slots, making simple usage verbose.', 'Forgetting empty/loading states.'],
      followUps: ['Where would scoped slots help here?', 'How would you test this component?'],
      modelAnswer: 'Simple values are props: `title`, `loading`, `variant`. Content is slots: the default slot for the body, `toolbar` and `footer` wrapped in `$slots` checks, and `empty` with a friendly fallback. I\'d also add a `header` slot whose fallback renders the `title` prop, so the common case is a one-liner and complex headers are still possible. If the panel renders rows itself, a scoped `row` slot would let the parent format each item.',
    },
    {
      id: 'slots-debug-vslot',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A teammate writes `<BaseCard><div #footer><button>Buy</button></div></BaseCard>` and gets a compile error. What is wrong?',
      options: [
        'Named slots must be declared with `defineSlots` first',
        '`v-slot` (`#footer`) can only be used on `<template>` or a component tag',
        'The child must use `<slot name="#footer">`',
        'Buttons are not allowed inside slots',
      ],
      correctOption: 1,
      answer: '`#footer` is shorthand for `v-slot:footer`, which is only valid on a `<template>` (or a component tag for its default slot). Use `<template #footer><button>Buy</button></template>`.',
      explanation: 'A `<template>` groups the slot content without adding an extra element.',
      whyAsked: 'Quick check of hands-on slot experience.',
      mistakes: ['Thinking slot names need a `#` in the child.', 'Believing slots must be declared at runtime.'],
      followUps: ['When can `v-slot` go on the component tag itself?'],
      modelAnswer: '`#footer` is the shorthand for `v-slot:footer`, and `v-slot` only goes on a `<template>` or directly on a component tag for its default slot. Wrapping the button in `<template #footer>` fixes it without adding an extra div to the DOM.',
    },
    {
      id: 'slots-coding-empty-state',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Implement `EmptyState.vue`: a default slot inside `<p class="message">` with fallback **Nothing here yet.**, and an optional `actions` slot inside `<div class="actions">` that is only rendered when passed.',
      starter: {
        files: {
          'App.vue': `<script setup>
import EmptyState from './EmptyState.vue'
</script>

<template>
  <section class="plain">
    <EmptyState />
  </section>
  <section class="custom">
    <EmptyState>
      No projects found.
      <template #actions>
        <button class="create">Create project</button>
      </template>
    </EmptyState>
  </section>
</template>`,
          'EmptyState.vue': `<template>
  <div class="empty-state">
    <p class="message">Nothing here yet.</p>
    <div class="actions"></div>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'fallback message', code: `expect(text('.plain .message')).toBe('Nothing here yet.')` },
        { name: 'custom message', code: `expect(text('.custom .message')).toBe('No projects found.')` },
        { name: 'actions only when passed', code: `expect(find('.plain .actions')).toBeNull(); expect(exists('.custom .actions .create')).toBe(true)` },
      ],
      hints: ['Fallback goes between `<slot>` tags.', 'Use `v-if="$slots.actions"` on the actions wrapper.'],
      answer: 'Use `<slot>Nothing here yet.</slot>` inside the message and wrap `<slot name="actions" />` in a `div` with `v-if="$slots.actions"`.',
      solution: {
        files: {
          'App.vue': `<script setup>
import EmptyState from './EmptyState.vue'
</script>

<template>
  <section class="plain">
    <EmptyState />
  </section>
  <section class="custom">
    <EmptyState>
      No projects found.
      <template #actions>
        <button class="create">Create project</button>
      </template>
    </EmptyState>
  </section>
</template>`,
          'EmptyState.vue': `<template>
  <div class="empty-state">
    <p class="message"><slot>Nothing here yet.</slot></p>
    <div v-if="$slots.actions" class="actions">
      <slot name="actions" />
    </div>
  </div>
</template>`,
        },
      },
      explanation: 'Fallback content handles the common case; the `$slots` check prevents an empty actions bar.',
      whyAsked: 'Checks default, named and fallback slots plus conditional rendering in one small task.',
      mistakes: ['Rendering the actions wrapper unconditionally.', 'Using a `message` prop that can\'t hold markup.'],
      followUps: ['How would you add an illustration slot with an icon fallback?'],
      modelAnswer: 'I put a default slot inside the message paragraph with "Nothing here yet." as fallback, and a named `actions` slot inside a wrapper guarded by `v-if="$slots.actions"`. Simple usages are just `<EmptyState />`, and pages that need a custom message or a call-to-action pass slots without extra props.',
    },
  ],

  takeaways: [
    'Slots let a parent pass template content into a child; the child decides where it goes with `<slot>`.',
    'Named slots (`<slot name="footer">` + `<template #footer>`) give a component several outlets; loose content goes to the default slot.',
    'Content inside `<slot>…</slot>` is fallback, shown only when the parent passes nothing.',
    'Slot content is compiled in the parent\'s scope — it sees parent data, never the child\'s.',
    'Use `$slots.name` to skip wrappers for slots that weren\'t passed.',
    'Props for data and configuration, slots for content.',
  ],
}
