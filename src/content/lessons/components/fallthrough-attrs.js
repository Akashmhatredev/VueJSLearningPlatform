// Lesson: Fallthrough attributes & $attrs

const attrsApp = `<script setup>
import { ref } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseInput from './BaseInput.vue'

const email = ref('')
const subscribed = ref(false)
</script>

<template>
  <form class="signup" @submit.prevent="subscribed = true">
    <BaseInput v-model="email" label="Email" placeholder="you@example.com" />
    <BaseButton class="primary" type="submit">Subscribe</BaseButton>
  </form>
  <p v-if="subscribed" class="thanks">Thanks, {{ email }}!</p>
</template>`

const baseButton = `<template>
  <!-- one root element: anything the parent passes that is not
       a prop or a declared event lands here automatically -->
  <button class="base-button" type="button">
    <slot />
  </button>
</template>

<style scoped>
.base-button { padding: 6px 14px; border: 2px solid #222; border-radius: 8px; background: #fff; cursor: pointer; }
.primary { background: #222; color: #fff; }
.base-button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>`

const baseInput = `<script setup>
defineProps({ label: String })
const model = defineModel()
</script>

<template>
  <label class="field">
    {{ label }}
    <input class="field-input" v-model="model" />
  </label>
</template>

<style scoped>
.field { display: block; margin: 8px 0; }
.field-input { margin-left: 8px; }
.wide .field-input { width: 260px; }
</style>`

const iconApp = `<script setup>
import { ref } from 'vue'
import IconButton from './IconButton.vue'

const likes = ref(0)
</script>

<template>
  <IconButton
    class="like"
    aria-label="Like this post"
    tooltip="Like"
    @click="likes++"
  >♥</IconButton>
  <p class="likes">{{ likes }} likes</p>
</template>`

export default {
  id: 'fallthrough-attrs',
  title: 'Fallthrough attributes & $attrs',
  summary: 'Understand what happens to attributes and listeners a component doesn\'t declare — how they fall through to the root element, how class and style merge, and how to redirect them with inheritAttrs and $attrs.',
  difficulty: 'intermediate',
  minutes: 25,
  prerequisites: ['props', 'emits'],
  related: ['component-v-model', 'slots', 'accessible-reusable-inputs', 'design-systems', 'class-style-bindings'],
  tags: ['$attrs', 'fallthrough attributes', 'inheritAttrs', 'useAttrs', 'defineOptions', 'v-bind="$attrs"', 'class merging', 'wrapper components', 'multi-root'],
  apis: [
    { name: '$attrs', summary: 'Template access to every fallthrough attribute and listener the component received.' },
    { name: 'useAttrs()', summary: 'Returns the fallthrough attrs object inside `<script setup>` (always current, but not reactive for watchers).' },
    { name: 'inheritAttrs: false', summary: 'Turns off automatic application of fallthrough attributes to the root element.' },
    { name: 'defineOptions()', summary: '3.3+ macro for component options like `inheritAttrs` inside `<script setup>`.' },
  ],
  docs: [
    { label: 'Vue Guide — Fallthrough Attributes', url: 'https://vuejs.org/guide/components/attrs.html' },
    { label: 'API — inheritAttrs', url: 'https://vuejs.org/api/options-misc.html#inheritattrs' },
    { label: 'API — useAttrs()', url: 'https://vuejs.org/api/sfc-script-setup.html#useslots-useattrs' },
  ],

  intro: `
When a parent writes attributes on a child component's tag, Vue sorts them into buckets. Declared **props** go to props. Listeners for declared **emits** go to the emit system. **Everything else** — \`class\`, \`style\`, \`id\`, \`placeholder\`, \`aria-label\`, \`data-*\`, \`disabled\`, even \`@click\` — is a **fallthrough attribute**.

By default, Vue applies fallthrough attributes to the component's **root element**. That's why \`<BaseButton class="primary" disabled>\` just works: the class and the \`disabled\` attribute land on the \`<button>\` inside.

Sometimes the root is the wrong place — think of an input wrapped in a \`<label>\`. Then you switch the automatic behaviour off with \`inheritAttrs: false\` and put \`$attrs\` exactly where it belongs.
`,

  why: `
Reusable base components (\`BaseButton\`, \`BaseInput\`, \`BaseCard\`) would be miserable to write if you had to declare a prop for every possible HTML attribute: \`id\`, \`title\`, \`name\`, \`autocomplete\`, \`aria-describedby\`, \`data-test\`, \`tabindex\`…

Fallthrough attributes let a component **behave like the native element it wraps**: the parent can pass any standard attribute or listener and it simply arrives on the right element. The component only declares the props that change its *own* behaviour.

But defaults can bite. If \`BaseInput\`'s root is a \`<label>\`, the parent's \`placeholder\` lands on the label — where it does nothing. Knowing how fallthrough works (and how to redirect it) is the difference between a component library that feels native and one that silently drops attributes.
`,

  eli15: `
Imagine sending a parcel to a big office building. The address has the building's name (that's a **prop** — the receptionist knows exactly what to do with it). But you also stick extra labels on the box: "FRAGILE", "THIS WAY UP", "for Maria".

The receptionist doesn't have a rule for those extra labels, so by default they just leave them stuck on the box when it goes to the **front desk** (the root element).

But maybe "for Maria" should go to Maria's desk on the third floor, not the front desk. So the building says: "Don't leave extra labels at the front desk automatically — I'll pass them to the right person myself." That's \`inheritAttrs: false\` plus \`v-bind="$attrs"\` on the right element.
`,

  analogy: {
    title: 'Extra labels on a parcel',
    body: `
A parcel arrives with an address the receptionist knows how to handle, plus stickers nobody declared a rule for. By default the stickers stay on the parcel at the front desk. A smart building can instead collect all the extra stickers and forward them to the exact room where they matter.
`,
    mapping: [
      ['the address the receptionist understands', 'declared props and emits'],
      ['the extra stickers', 'fallthrough attributes and listeners (`$attrs`)'],
      ['the front desk', 'the component\'s root element'],
      ['"don\'t leave stickers at the front desk"', '`inheritAttrs: false`'],
      ['forwarding stickers to Maria\'s room', '`v-bind="$attrs"` on an inner element'],
      ['two front desks, nobody knows which to use', 'a multi-root component: no automatic fallthrough, Vue warns'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'Default fallthrough vs redirected $attrs',
    props: {
      left: {
        label: 'Default: attrs land on the root',
        lang: 'vue',
        code: `<!-- parent -->
<BaseInput label="Email" placeholder="you@example.com" />

<!-- BaseInput.vue -->
<template>
  <label>          <!-- placeholder ends up HERE ✗ -->
    {{ label }}
    <input v-model="model" />
  </label>
</template>`,
      },
      right: {
        label: 'inheritAttrs: false + v-bind="$attrs"',
        lang: 'vue',
        code: `<!-- BaseInput.vue -->
<script setup>
defineOptions({ inheritAttrs: false })
defineProps({ label: String })
const model = defineModel()
</script>

<template>
  <label>
    {{ label }}
    <input v-bind="$attrs" v-model="model" />  <!-- ✓ -->
  </label>
</template>`,
      },
      points: [
        '`label` is a declared prop, so it never appears in `$attrs`.',
        'By default every undeclared attribute is applied to the single root element — the `<label>` on the left.',
        '`inheritAttrs: false` stops the automatic application; `v-bind="$attrs"` puts them on the element you choose.',
        'With `inheritAttrs: false`, `class` and `style` are *also* moved — they are part of `$attrs` in Vue 3.',
      ],
    },
    caption: 'The same parent code, two child implementations: only one gets the placeholder onto the actual input.',
    alt: 'Side-by-side code. Left: a BaseInput whose root is a label; the placeholder attribute lands on the label. Right: the same component with inheritAttrs false and v-bind="$attrs" on the inner input, so the placeholder reaches the input.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'How Vue sorts what the parent passes',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'tag', label: '<BaseInput …>', note: 'label, placeholder, class, @focus, @update:modelValue', tone: 'acid', x: 380, y: 45 },
        { id: 'props', label: 'props', note: 'label, modelValue', tone: 'cobalt', x: 130, y: 165 },
        { id: 'emits', label: 'emit listeners', note: 'update:modelValue', tone: 'cobalt', x: 380, y: 165 },
        { id: 'attrs', label: '$attrs', note: 'placeholder, class, onFocus', tone: 'kraft', x: 630, y: 165 },
        { id: 'root', label: 'root element', note: 'default target', x: 520, y: 280 },
        { id: 'inner', label: '<input v-bind="$attrs">', note: 'with inheritAttrs: false', tone: 'acid', x: 720, y: 280 },
      ],
      edges: [
        { from: 'tag', to: 'props', label: 'declared in defineProps' },
        { from: 'tag', to: 'emits', label: 'declared in defineEmits' },
        { from: 'tag', to: 'attrs', label: 'everything else' },
        { from: 'attrs', to: 'root', label: 'automatic' },
        { from: 'attrs', to: 'inner', label: 'manual', dashed: true },
      ],
      steps: [
        { focus: ['tag'], text: 'The parent writes a mix of things on the component tag: data, native attributes, a class, listeners.' },
        { focus: ['props'], edges: ['tag->props'], text: 'Names declared with `defineProps` (here `label`, and `modelValue` from `defineModel`) become **props**.' },
        { focus: ['emits'], edges: ['tag->emits'], text: 'Listeners for events declared with `defineEmits` (here `update:modelValue`) are kept for `emit()`.' },
        { focus: ['attrs'], edges: ['tag->attrs'], text: 'Everything else goes into **`$attrs`** — including `class`, `style` and undeclared listeners like `@focus` (stored as `onFocus`).' },
        { focus: ['root'], edges: ['attrs->root'], text: 'By default Vue merges `$attrs` into the **single root element**: `class` and `style` are combined, other attributes override, listeners are added.' },
        { focus: ['inner'], edges: ['attrs->inner'], text: 'With `inheritAttrs: false`, nothing is applied automatically — you bind `v-bind="$attrs"` wherever it belongs.' },
      ],
    },
    caption: 'Step through the three buckets every attribute on a component tag ends up in.',
    alt: 'A diagram: the attributes on a BaseInput tag split into three boxes — props (label, modelValue), emit listeners (update:modelValue) and $attrs (placeholder, class, onFocus). $attrs flows automatically to the root element, or manually (dashed) to an inner input with v-bind="$attrs".',
  },

  syntax: [
    `
**Automatic fallthrough (single root).** No code needed in the child:
`,
    {
      code: `<!-- BaseButton.vue -->
<template>
  <button class="base-button" type="button"><slot /></button>
</template>

<!-- parent -->
<BaseButton class="primary" type="submit" :disabled="saving" @click="save">Save</BaseButton>

<!-- rendered -->
<button class="base-button primary" type="submit" disabled>Save</button>`,
      lang: 'vue',
      title: 'class merges, other attributes override, listeners are added',
    },
    `
**The merge rules** when attrs land on the root:

- \`class\` and \`style\` are **merged** with the root's own values.
- Other attributes from the parent **override** the root's value (\`type="submit"\` beats \`type="button"\`).
- \`v-on\` listeners are **added**: if the root has its own \`@click\`, both run (the child's first).
- If the root is *another component*, the attrs are passed on to it (minus anything the middle component declares as props or emits).

**Turning it off and binding manually:**
`,
    {
      code: `<script setup>
defineOptions({ inheritAttrs: false })   // Vue 3.3+
defineProps({ label: String })
const model = defineModel()
</script>

<template>
  <label class="field">
    {{ label }}
    <input v-bind="$attrs" v-model="model" />
  </label>
</template>`,
      lang: 'vue',
      title: 'BaseInput.vue — attrs on the inner input',
    },
    {
      code: `<!-- before Vue 3.3: a separate normal <script> block -->
<script>
export default { inheritAttrs: false }
</script>

<script setup>
// …
</script>`,
      lang: 'vue',
      title: 'inheritAttrs before defineOptions',
    },
    `
**Reading attrs in JavaScript** with \`useAttrs()\`. Keys keep their original casing (\`attrs['data-test']\`), and listeners appear as \`onXxx\` functions (\`attrs.onFocus\`):
`,
    {
      code: `<script setup>
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()

// split: class on the wrapper, everything else on the input
const inputAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
})
</script>

<template>
  <label :class="attrs.class" :style="attrs.style">
    <input v-bind="inputAttrs" />
  </label>
</template>`,
      lang: 'vue',
      title: 'useAttrs()',
    },
    `
**The rules:**

1. Fallthrough = anything **not** declared as a prop or emit.
2. Single root element → applied automatically. **Multi-root** (fragment) → nothing is applied, and Vue warns unless you bind \`$attrs\` explicitly.
3. In Vue 3, \`$attrs\` **includes \`class\`, \`style\` and listeners** (Vue 2 kept them separate, with \`$listeners\`).
4. The attrs object always holds the latest values, but it is **not reactive** — you can't \`watch\` it. If you need to react to a value, declare it as a prop.
`,
    {
      callout: 'version',
      text: '`defineOptions()` requires Vue **3.3+**. On older versions, put `inheritAttrs: false` in a separate `<script>` block next to `<script setup>`.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: attrsApp,
    intro: 'The parent passes a mix of props and plain attributes. Watch where each one ends up.',
    steps: [
      { lines: [11], text: 'A normal form. `@submit.prevent` handles submission in Vue instead of reloading the page.' },
      { lines: [12], text: '`v-model` and `label` are declared by `BaseInput` (via `defineModel` and `defineProps`). `placeholder` is not — it is a fallthrough attribute, and it will land on `BaseInput`\'s root element.' },
      { lines: [13], text: '`BaseButton` declares no props at all, so `class="primary"` and `type="submit"` both fall through to its root `<button>`. `type="submit"` overrides the button\'s own `type="button"`, so clicking it submits the form.' },
      { lines: [15], text: 'Proof the submit worked. Now ask yourself: where did `placeholder` go? (Experiment 1.)' },
    ],
  },

  playground: {
    title: 'Newsletter signup with base components',
    objective: 'Watch attributes fall through to root elements, fix a wrapper component that drops them in the wrong place, and redirect them precisely.',
    files: { 'App.vue': attrsApp, 'BaseButton.vue': baseButton, 'BaseInput.vue': baseInput },
    expected: 'An email field and a black **Subscribe** button. Submitting shows a thank-you line. But the placeholder text is missing from the field — it fell through to the `<label>`.',
    experiments: [
      {
        id: 'fix-placeholder',
        task: 'The placeholder lands on the `<label>` (the root) instead of the `<input>`. Fix `BaseInput.vue` so fallthrough attributes go to the inner input.',
        hint: 'Add `defineOptions({ inheritAttrs: false })` and `v-bind="$attrs"` on the `<input>`.',
        tests: [
          {
            name: 'the placeholder is on the input, not the label',
            code: `expect(attr('.field-input', 'placeholder')).toBe('you@example.com')
expect(attr('.field', 'placeholder')).toBeNull()`,
          },
          {
            name: 'v-model still works',
            code: `await type('.field-input', 'ada@example.com')
await submit('.signup')
expect(text('.thanks')).toBe('Thanks, ada@example.com!')`,
          },
        ],
        explain: '`inheritAttrs: false` stops Vue from applying attrs to the root, and `v-bind="$attrs"` spreads them onto the element where they make sense. Every future attribute (`type`, `autocomplete`, `aria-*`) now works too — no new props needed.',
      },
      {
        id: 'disabled-until-valid',
        task: 'Disable **Subscribe** until the email contains an `@`: add `:disabled="!email.includes(\'@\')"` to `<BaseButton>` in `App.vue`. Do **not** edit `BaseButton.vue`.',
        hint: '`disabled` isn\'t a prop of `BaseButton`, so it falls through to the `<button>`.',
        tests: [
          {
            name: 'disabled while the email is invalid',
            code: `expect(find('.base-button').disabled).toBe(true)`,
          },
          {
            name: 'enabled once it contains @',
            code: `await type('.field-input', 'grace@navy.mil')
expect(find('.base-button').disabled).toBe(false)`,
          },
        ],
        explain: 'A component that passes attributes through behaves like the native element it wraps. Remember the client-side check is only a convenience — the server must still validate the email.',
      },
      {
        id: 'split-class',
        task: 'Pass `class="wide"` to `<BaseInput>` in `App.vue`. After experiment 1 the class lands on the `<input>`, but layout classes belong on the wrapper. Make `BaseInput` put `class` on the `<label>` and **everything else** on the `<input>`.',
        hint: 'Use `useAttrs()` and a computed that removes `class`: `const { class: _c, ...rest } = attrs`. Bind `:class="attrs.class"` on the label and `v-bind="rest"` on the input.',
        tests: [
          {
            name: 'class on the wrapper, placeholder on the input',
            code: `expect(classes('.field')).toContain('wide')
expect(classes('.field-input')).not.toContain('wide')
expect(attr('.field-input', 'placeholder')).toBe('you@example.com')`,
          },
        ],
        explain: 'Because Vue 3 puts `class` and `style` inside `$attrs`, you can route them separately from the rest. Wrapper components in design systems often do exactly this split.',
      },
      {
        id: 'multi-root',
        task: 'Add a second root element to `BaseButton.vue` — for example `<small class="hint">No spam, ever.</small>` after the button — and look at the button and the console.',
        hint: 'Then fix it by adding `v-bind="$attrs"` to the `<button>`.',
        explain: 'With two roots, Vue can\'t guess where attrs belong, so `class` and `type` are dropped and you get: `Extraneous non-props attributes (class, type) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.` Binding `$attrs` explicitly resolves both the warning and the bug.',
      },
    ],
  },

  internals: {
    beginner: `
Vue looks at every attribute on a component tag and asks: "Is this a declared prop? A declared event?" If not, it goes into a bag called \`$attrs\`. After the child renders, Vue opens the bag and sticks its contents onto the child's single root element — unless the child said \`inheritAttrs: false\`, in which case the child decides where the bag goes.
`,
    technical: [
      `
During prop resolution, undeclared keys (and \`onXxx\` listeners that don't match declared emits) are stored in \`instance.attrs\`. After the component's render function returns its root vnode, Vue performs **attribute inheritance**:
`,
      {
        code: `// Simplified model of root attribute inheritance — not the real source
function renderComponentRoot(instance) {
  let root = instance.render()
  const attrs = instance.attrs
  if (instance.inheritAttrs !== false && Object.keys(attrs).length) {
    if (isSingleElementOrComponent(root)) {
      // class: concatenated, style: merged, onXxx: combined into an array,
      // everything else: the fallthrough value wins
      root = cloneVNode(root, attrs)        // uses mergeProps(root.props, attrs)
    } else if (__DEV__) {
      warn('Extraneous non-props attributes (…) were passed to component but could not be automatically inherited …')
    }
  }
  return root
}`,
        lang: 'js',
        title: 'mental model of attribute inheritance',
      },
      `
If the root is another component, the cloned vnode carries the attrs into *that* component, where the same sorting happens again — props it declares are consumed, the rest falls through further.

\`$attrs\` / \`useAttrs()\` return \`instance.attrs\`. Vue updates that object in place on each parent render and re-renders the child when attrs change, but the object is not a reactive proxy you can \`watch\` — the docs recommend a prop (or \`onUpdated\`) if you need to react to a specific attribute.
`,
    ],
    production: `
- **Decide where attrs go for every base component.** For inputs, the inner \`<input>\` is usually right; for cards and buttons, the root is fine. Document it.
- **Split \`class\`/\`style\` from the rest** in wrapper components so layout classes affect the wrapper while \`aria-*\`, \`name\`, \`autocomplete\` reach the control. Accessibility attributes on the wrong element are a common, invisible bug.
- **Declaring a prop swallows the attribute.** If \`BaseButton\` declares a \`type\` prop for its own logic, remember to bind it to the \`<button>\` — otherwise \`type="submit"\` silently stops reaching the element.
- **Multi-root components** (common with \`<Teleport>\` or sibling tooltips) must bind \`$attrs\` explicitly.
- **Listener fallthrough** can cause double handlers when a component also emits the same event name — declare emits ([emits](lesson:emits)).
- Fallthrough + \`defineModel()\` + \`useId()\` (3.5+) is the standard recipe for [accessible, reusable inputs](lesson:accessible-reusable-inputs) in [design systems](lesson:design-systems).
`,
  },

  mistakes: [
    {
      title: 'Letting input attributes land on a wrapper element',
      wrong: { code: `<template>\n  <label>\n    {{ label }}\n    <input v-model="model" />\n  </label>\n</template>\n<!-- placeholder, type, aria-* end up on <label> -->`, lang: 'vue' },
      right: { code: `<script setup>\ndefineOptions({ inheritAttrs: false })\n</script>\n<template>\n  <label>\n    {{ label }}\n    <input v-bind="$attrs" v-model="model" />\n  </label>\n</template>`, lang: 'vue' },
      explanation: 'The root gets the attrs by default. For wrapper components, turn inheritance off and bind `$attrs` on the real control.',
    },
    {
      title: '`inheritAttrs: false` without binding `$attrs` anywhere',
      wrong: { code: `defineOptions({ inheritAttrs: false })\n// …template never uses $attrs`, lang: 'js' },
      right: { code: `defineOptions({ inheritAttrs: false })\n// template: <input v-bind="$attrs" />`, lang: 'js' },
      explanation: 'Now every class, aria attribute and undeclared listener the parent passes is silently discarded — no warning.',
    },
    {
      title: 'Multi-root component that ignores $attrs',
      wrong: { code: `<template>\n  <button><slot /></button>\n  <span class="tooltip">{{ tooltip }}</span>\n</template>`, lang: 'vue' },
      right: { code: `<template>\n  <button v-bind="$attrs"><slot /></button>\n  <span class="tooltip">{{ tooltip }}</span>\n</template>`, lang: 'vue' },
      explanation: 'With several root nodes Vue doesn\'t know where attrs belong, so it applies none and warns. Bind them explicitly.',
    },
    {
      title: 'Declaring a prop and forgetting to forward it',
      wrong: { code: `<script setup>\ndefineProps({ type: String }) // now "type" is a prop, not an attr\n</script>\n<template>\n  <button><slot /></button> <!-- type="submit" never arrives -->\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\ndefineProps({ type: { type: String, default: 'button' } })\n</script>\n<template>\n  <button :type="type"><slot /></button>\n</template>`, lang: 'vue' },
      explanation: 'Declared props are removed from `$attrs`. If the element still needs the value, bind it yourself.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: Extraneous non-props attributes (class) were passed to component but could not be automatically inherited because component renders fragment or text or teleport root nodes.`',
      cause: 'The component has more than one root node (or a text/teleport root), so Vue can\'t apply attrs automatically.',
      fix: 'Bind `v-bind="$attrs"` on the element that should receive them, or wrap the template in a single root element.',
    },
    {
      symptom: 'A `placeholder`, `aria-label` or `autocomplete` passed to an input component has no effect.',
      cause: 'It fell through to the wrapper root (a `<div>` or `<label>`) instead of the `<input>`.',
      fix: 'Use `inheritAttrs: false` and bind `$attrs` (or the non-class part of it) on the input.',
    },
    {
      symptom: 'A click handler runs twice.',
      cause: 'The parent\'s `@click` falls through to the root as a native listener, and the component also emits `click`.',
      fix: 'Declare `click` in `defineEmits` or stop emitting it.',
    },
    {
      symptom: 'A `watch(() => attrs.foo, …)` never fires.',
      cause: 'The attrs object is not reactive for watchers.',
      fix: 'Declare `foo` as a prop if the component needs to react to it, or read it in `onUpdated`.',
    },
    {
      symptom: 'An attribute stopped reaching the element after you added a prop with the same name.',
      cause: 'Declared props are excluded from `$attrs`.',
      fix: 'Bind the prop to the element explicitly (`:type="type"`).',
    },
  ],

  bestPractices: [
    'Declare as props only what changes the component\'s own behaviour; let standard HTML attributes fall through.',
    'For wrapper components, use `inheritAttrs: false` and bind `$attrs` on the real control.',
    'Route `class`/`style` to the wrapper and the rest to the control when both matter.',
    'Multi-root components must bind `$attrs` explicitly.',
    'Declare emits so component events don\'t also become native fallthrough listeners.',
    'Don\'t watch `useAttrs()`; promote values you need to react to into props.',
  ],

  useCases: [
    'Base buttons that accept `type`, `disabled`, `aria-*` and `@click` like a native `<button>`.',
    'Input wrappers that forward `placeholder`, `name`, `autocomplete`, `required` to the inner `<input>`.',
    'Passing `data-test` attributes for end-to-end tests without declaring them.',
    'Thin wrappers around third-party components that forward everything they don\'t handle.',
    'Layout classes (`class="mt-4"`) on any component without extra props.',
  ],

  whenToUse: {
    use: [
      'You wrap a native element and want the component to accept its attributes and listeners.',
      'The root element is the right target (the default) — no code needed.',
      'You need precise control over which element receives attrs (`inheritAttrs: false`).',
    ],
    avoid: [
      'Relying on fallthrough for data the component\'s logic depends on — declare a prop.',
      'Watching attrs for changes — use props.',
      'Spreading `$attrs` onto several elements at once, which duplicates ids and listeners.',
    ],
  },

  comparison: {
    title: 'Props vs fallthrough attributes',
    headers: ['', 'Declared prop', 'Fallthrough attribute'],
    rows: [
      ['Declared with', '`defineProps` / `defineModel`', 'nothing — anything undeclared'],
      ['Where it lives', '`props`', '`$attrs` / `useAttrs()`'],
      ['Applied to the DOM automatically?', 'no — you decide how to use it', 'yes, on the single root (unless `inheritAttrs: false`)'],
      ['Validated / typed?', 'yes (dev warnings, TS types)', 'no'],
      ['Reactive for `watch` / `computed`?', 'yes', 'no (always current, but not watchable)'],
      ['Typical examples', '`label`, `variant`, `modelValue`', '`class`, `id`, `placeholder`, `aria-*`, `data-*`, `@focus`'],
    ],
    note: 'If the component\'s logic reads it, make it a prop. If it just needs to reach an element, let it fall through.',
  },

  quiz: [
    {
      id: 'fallthrough-attrs-q1',
      type: 'output',
      prompt: '`BaseButton` declares no props and renders `<button class="btn" type="button">Go</button>`. What does the parent below render?',
      code: { lang: 'vue', code: `<BaseButton class="big" type="submit" />` },
      options: [
        { text: '`<button class="big" type="submit">Go</button>`', why: '`class` is merged, not replaced.' },
        { text: '`<button class="btn big" type="submit">Go</button>`' },
        { text: '`<button class="btn big" type="button">Go</button>`', why: 'For attributes other than class/style, the parent\'s fallthrough value overrides the root\'s own value.' },
        { text: '`<button class="btn" type="button">Go</button>`', why: 'Fallthrough is on by default for single-root components.' },
      ],
      answer: 1,
      explanation: 'Classes and styles are merged; other attributes from the parent override the root\'s values.',
    },
    {
      id: 'fallthrough-attrs-q2',
      type: 'mcq',
      prompt: 'A component declares `defineProps([\'label\'])` and `defineEmits([\'close\'])`. The parent writes `<Panel label="Hi" class="wide" data-id="7" @close="x" @mouseenter="y" />`. Select **all** keys that appear in `$attrs`.',
      options: [
        { text: '`label`', why: 'Declared props are removed from `$attrs`.' },
        { text: '`class`' },
        { text: '`data-id`' },
        { text: '`onClose`', why: '`close` is a declared emit, so its listener is not a fallthrough attribute.' },
        { text: '`onMouseenter`' },
      ],
      answer: [1, 2, 4],
      explanation: 'Only undeclared things fall through. In Vue 3 that includes `class`, `style` and undeclared listeners (as `onXxx`).',
    },
    {
      id: 'fallthrough-attrs-q3',
      type: 'bug',
      prompt: 'The parent passes `placeholder` and `aria-describedby` to this component, but neither appears anywhere in the DOM. Click the line that explains why.',
      code: {
        lang: 'vue',
        code: `<script setup>
defineOptions({ inheritAttrs: false })
defineProps({ label: String })
const model = defineModel()
</script>

<template>
  <div class="field">
    <label>{{ label }}</label>
    <input v-model="model" />
  </div>
</template>`,
      },
      answerLine: 10,
      explanation: 'Inheritance is turned off, but `$attrs` is never bound, so the attributes are discarded. Line 10 should be `<input v-bind="$attrs" v-model="model" />`.',
    },
    {
      id: 'fallthrough-attrs-q4',
      type: 'fill',
      prompt: 'Turn off automatic inheritance and forward the attributes to the inner input.',
      code: {
        lang: 'vue',
        code: `<script setup>
defineOptions({ ___: false })
</script>

<template>
  <label>
    <input v-bind="___" />
  </label>
</template>`,
      },
      answer: [['inheritAttrs'], ['$attrs']],
      explanation: '`inheritAttrs: false` disables the default; `v-bind="$attrs"` spreads every fallthrough attribute and listener onto the element.',
    },
    {
      id: 'fallthrough-attrs-q5',
      type: 'mcq',
      prompt: 'A component\'s template has two root elements and no `v-bind="$attrs"`. The parent passes `class="highlight"`. What happens?',
      options: [
        { text: 'The class goes on the first root element.', why: 'Vue does not guess for multi-root components.' },
        { text: 'The class goes on both root elements.', why: 'That would duplicate attributes like ids; Vue applies none.' },
        { text: 'The class is not applied anywhere, and Vue warns in development.' },
        { text: 'Vue throws an error.', why: 'It only warns.' },
      ],
      answer: 2,
      explanation: 'Automatic fallthrough needs a single root. With fragments you bind `$attrs` where it belongs.',
    },
    {
      id: 'fallthrough-attrs-q6',
      type: 'mcq',
      prompt: 'Which statement about `useAttrs()` is true?',
      options: [
        { text: 'It returns a reactive object you can pass to `watch`.', why: 'The docs state the attrs object is not reactive; watchers on it won\'t fire.' },
        { text: 'It always reflects the latest fallthrough attributes, but it isn\'t reactive — use a prop if you need to react to changes.' },
        { text: 'It excludes `class` and `style`, like in Vue 2.', why: 'In Vue 3, `class` and `style` are part of `$attrs`.' },
        { text: 'It only works when `inheritAttrs` is `false`.', why: 'It works either way; `inheritAttrs` only controls automatic application.' },
      ],
      answer: 1,
      explanation: 'Read it during render or in event handlers; promote values you need to watch to props.',
    },
    {
      id: 'fallthrough-attrs-q7',
      type: 'short',
      prompt: 'When would you set `inheritAttrs: false`? Give a concrete example.',
      answer: 'When the root element isn\'t where the parent\'s attributes belong. Example: a `BaseInput` whose root is a `<label>` wrapper — `placeholder`, `type` and `aria-*` should go to the inner `<input>`, so you disable inheritance and bind `v-bind="$attrs"` on the input (often keeping `class` on the wrapper).',
    },
  ],

  exercises: [
    {
      id: 'base-input',
      title: 'A BaseInput that forwards attributes correctly',
      difficulty: 'intermediate',
      prompt: `
Finish \`BaseInput.vue\`:

- A \`label\` prop shown in \`<span class="label-text">\`.
- \`v-model\` support via \`defineModel()\`.
- Root element: \`<label class="field">\`. Inside it, \`<input class="control">\`.
- **Every** fallthrough attribute (\`placeholder\`, \`type\`, \`required\`, \`aria-*\`…) must end up on the \`<input>\`, **not** on the \`<label>\`.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import BaseInput from './BaseInput.vue'

const email = ref('')
</script>

<template>
  <BaseInput
    v-model="email"
    label="Email"
    type="email"
    placeholder="you@example.com"
    aria-describedby="email-help"
    required
  />
  <p id="email-help">We never share your email.</p>
  <p class="echo">{{ email }}</p>
</template>`,
        'BaseInput.vue': `<script setup>
// TODO: label prop, model, attribute forwarding
</script>

<template>
  <label class="field">
    <span class="label-text">Label</span>
    <input class="control" />
  </label>
</template>`,
      },
      hints: [
        'You need three macros: `defineOptions`, `defineProps` and `defineModel`.',
        '`defineOptions({ inheritAttrs: false })` stops attributes from landing on the `<label>`.',
        'On the input: `<input class="control" v-bind="$attrs" v-model="model" />`.',
      ],
      solution: {
        explanation: 'The component declares only what it uses itself (`label` and the model). Everything else is forwarded to the control with `v-bind="$attrs"`, so the parent can pass any input attribute — including accessibility ones — without new props.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import BaseInput from './BaseInput.vue'

const email = ref('')
</script>

<template>
  <BaseInput
    v-model="email"
    label="Email"
    type="email"
    placeholder="you@example.com"
    aria-describedby="email-help"
    required
  />
  <p id="email-help">We never share your email.</p>
  <p class="echo">{{ email }}</p>
</template>`,
          'BaseInput.vue': `<script setup>
defineOptions({ inheritAttrs: false })
defineProps({ label: String })
const model = defineModel()
</script>

<template>
  <label class="field">
    <span class="label-text">{{ label }}</span>
    <input class="control" v-bind="$attrs" v-model="model" />
  </label>
</template>`,
        },
      },
      tests: [
        { name: 'shows the label', code: `expect(text('.label-text')).toBe('Email')` },
        {
          name: 'attributes land on the input',
          code: `expect(attr('.control', 'placeholder')).toBe('you@example.com')
expect(attr('.control', 'type')).toBe('email')
expect(attr('.control', 'aria-describedby')).toBe('email-help')
expect(find('.control').required).toBe(true)`,
        },
        {
          name: 'nothing leaks onto the label',
          code: `expect(attr('.field', 'placeholder')).toBeNull()
expect(attr('.field', 'type')).toBeNull()`,
        },
        { name: 'v-model works', code: `await type('.control', 'ada@example.com'); expect(text('.echo')).toBe('ada@example.com')` },
      ],
    },
    {
      id: 'icon-button',
      title: 'A multi-root IconButton',
      difficulty: 'intermediate',
      prompt: `
\`IconButton.vue\` renders **two** root elements: a \`<button class="icon-button">\` and a \`<span class="tooltip">\` showing the \`tooltip\` prop. Because it is multi-root, the parent's \`class\`, \`aria-label\` and \`@click\` are currently lost (check the console).

Fix \`IconButton.vue\` so:

- \`class="like"\`, \`aria-label\` and the \`@click\` listener all reach the \`<button>\`;
- the tooltip \`<span>\` receives none of them;
- clicking the button increases the parent's like count.
`,
      files: {
        'App.vue': iconApp,
        'IconButton.vue': `<script setup>
defineProps({ tooltip: String })
</script>

<template>
  <button class="icon-button" type="button"><slot /></button>
  <span class="tooltip">{{ tooltip }}</span>
</template>`,
      },
      hints: [
        'Multi-root components never apply attrs automatically.',
        'Bind them yourself on the element that should receive them.',
        'Add `v-bind="$attrs"` to the `<button>`.',
      ],
      solution: {
        explanation: 'With two root nodes Vue cannot guess where attrs belong, so it applies none and warns. Binding `$attrs` on the button delivers the class, the aria-label and the click listener (stored as `onClick`) exactly there.',
        files: {
          'App.vue': iconApp,
          'IconButton.vue': `<script setup>
defineProps({ tooltip: String })
</script>

<template>
  <button class="icon-button" type="button" v-bind="$attrs"><slot /></button>
  <span class="tooltip">{{ tooltip }}</span>
</template>`,
        },
      },
      tests: [
        {
          name: 'class and aria-label reach the button',
          code: `expect(classes('.icon-button')).toContain('like')
expect(attr('.icon-button', 'aria-label')).toBe('Like this post')`,
        },
        { name: 'the tooltip gets nothing extra', code: `expect(classes('.tooltip')).not.toContain('like'); expect(attr('.tooltip', 'aria-label')).toBeNull()` },
        { name: 'clicking increases the likes', code: `await click('.icon-button'); await click('.icon-button'); expect(text('.likes')).toBe('2 likes')` },
      ],
    },
  ],

  interview: [
    {
      id: 'fallthrough-attrs-what',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 2,
      question: 'What are fallthrough attributes in Vue 3, and where do they go by default?',
      answer: 'Attributes and `v-on` listeners passed to a component that it doesn\'t declare as props or emits — e.g. `class`, `style`, `id`, `aria-*`, `data-*`, native attributes and undeclared listeners. By default Vue applies them to the component\'s single root element, merging `class`/`style` and letting other values override. They are available as `$attrs` / `useAttrs()`.',
      explanation: 'They let a wrapper component behave like the element it wraps without declaring every HTML attribute.',
      whyAsked: 'Essential for building reusable base components and understanding where attributes end up.',
      mistakes: ['Thinking `class` and `style` are excluded (that was Vue 2).', 'Not knowing multi-root components don\'t inherit automatically.'],
      followUps: ['How do you put them on an inner element?', 'What happens with multi-root components?'],
      modelAnswer: 'Fallthrough attributes are everything a parent passes to a component that isn\'t a declared prop or emit — classes, styles, ids, aria and data attributes, native attributes and undeclared listeners. Vue applies them to the root element automatically: class and style merge with the root\'s own, other attributes override, listeners are added. In Vue 3 they\'re all in `$attrs`, including class, style and listeners. If the root isn\'t the right target, I set `inheritAttrs: false` and bind `$attrs` myself.',
    },
    {
      id: 'fallthrough-attrs-wrapper-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Your design system\'s `TextField` renders a `<div class="field">` containing a `<label>`, an `<input>` and an error message. QA reports that `autocomplete="email"` and `aria-invalid` passed to `TextField` don\'t work. What\'s happening and how do you fix it without adding props?',
      answer: 'They fall through to the root `<div>`, where they have no effect. Set `inheritAttrs: false`, bind `$attrs` on the `<input>`, and ideally keep `class`/`style` on the wrapper by splitting them with `useAttrs()` in a computed.',
      explanation: 'Wrapper components must redirect fallthrough to the actual control.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { computed, useAttrs } from 'vue'
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const controlAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})
</script>
<template>
  <div class="field" :class="attrs.class" :style="attrs.style">
    <label>…</label>
    <input v-bind="controlAttrs" />
  </div>
</template>`,
      },
      whyAsked: 'A very common design-system bug with accessibility consequences.',
      mistakes: ['Adding a prop for every attribute.', 'Binding `$attrs` on both the wrapper and the input.'],
      followUps: ['Why keep `class` on the wrapper?', 'How would you also generate an id for the label?'],
      modelAnswer: 'The attributes fall through to the root div, where autocomplete and aria-invalid do nothing. I\'d disable inheritance with `defineOptions({ inheritAttrs: false })` and forward the attributes to the input. Because class and style are part of `$attrs` in Vue 3, I\'d split them out with `useAttrs` and a computed, so layout classes stay on the wrapper and everything else reaches the control. Then any future attribute works without new props.',
    },
    {
      id: 'fallthrough-attrs-multi-root',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 2,
      question: 'You add a `<Teleport>`-ed tooltip as a second root node to a `Chip` component and suddenly see "Extraneous non-props attributes (class) were passed to component but could not be automatically inherited…". Explain and fix.',
      answer: 'The component now has multiple root nodes, so Vue can\'t decide which one gets the attrs and applies none. Bind `v-bind="$attrs"` to the element that should receive them (e.g. the chip `<span>`), or wrap the roots in a single element.',
      explanation: 'Automatic inheritance requires a single root element or component.',
      whyAsked: 'Shows you can read Vue warnings and understand multi-root components.',
      mistakes: ['Suppressing the warning instead of fixing it.', 'Binding `$attrs` on both roots.'],
      followUps: ['Why doesn\'t Vue just pick the first root?'],
      modelAnswer: 'Multi-root components don\'t get automatic attribute inheritance because Vue has no way to know which root is the "real" element. The class is being dropped, and the warning tells me so. I bind `v-bind="$attrs"` on the chip element itself. Binding on both roots would duplicate things like ids and listeners, so I pick one deliberately.',
    },
    {
      id: 'fallthrough-attrs-vue2-vs-vue3',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What changed about `$attrs` between Vue 2 and Vue 3?',
      answer: 'In Vue 3, `$attrs` contains everything not declared as props or emits — including `class`, `style` and listeners (as `onXxx`). Vue 2 kept `class`/`style` out of `$attrs` (they always went to the root) and exposed listeners separately in `$listeners`, which Vue 3 removed. So in Vue 3, `inheritAttrs: false` also stops `class`/`style` from reaching the root.',
      explanation: 'One unified `$attrs` object replaces `$attrs` + `$listeners` + special class/style handling.',
      whyAsked: 'Common in migration projects; tests precise knowledge.',
      mistakes: ['Looking for `$listeners` in Vue 3.', 'Expecting `class` to stay on the root after `inheritAttrs: false`.'],
      followUps: ['How would you migrate a component that used `v-on="$listeners"`?'],
      modelAnswer: 'Vue 3 unified things: `$attrs` now includes class, style and any undeclared listener, stored as `onClick` style keys. `$listeners` is gone — `v-bind="$attrs"` forwards listeners too. The behavioural catch when migrating is that `inheritAttrs: false` now also removes class and style from the root, so a wrapper that relied on classes landing on the root needs to bind them explicitly.',
    },
    {
      id: 'fallthrough-attrs-reactivity',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'A component needs to run logic when the parent changes `aria-expanded` on it. It does `watch(() => attrs[\'aria-expanded\'], …)` with `useAttrs()`. Will that work? What would you do?',
      answer: 'The attrs object always holds the latest values and the component re-renders when they change, but it is not reactive for watchers, so the watcher isn\'t a reliable trigger (the Vue docs say you can\'t observe attrs with watchers). Declare it as a prop (`expanded`) so it is reactive, validated and documented; or, if you only need to respond after renders, use `onUpdated`.',
      explanation: 'If the component\'s logic depends on a value, it is a prop by definition.',
      whyAsked: 'Probes the boundary between props and attrs and an easily missed caveat.',
      mistakes: ['Assuming everything Vue exposes is reactive.', 'Wrapping attrs in `reactive()`.'],
      followUps: ['Why might Vue choose not to make attrs reactive?'],
      modelAnswer: 'No — `useAttrs()` is always up to date when you read it, and the child re-renders when attrs change, but the object isn\'t something watchers can track, as the docs explicitly note. Since the component\'s behaviour depends on that value, it should be a declared prop: then it\'s reactive, typed and part of the documented API. For pure post-render reactions `onUpdated` is an option, but a prop is the right design.',
    },
    {
      id: 'fallthrough-attrs-coding-split',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Finish `SearchField.vue`: its root is `<div class="search-field">` containing `<input class="search-input">`. Any `class` the parent passes must stay on the **root div**; every other attribute and listener must go to the **input**.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import SearchField from './SearchField.vue'

const focused = ref(false)
</script>

<template>
  <SearchField
    class="compact"
    placeholder="Search docs…"
    aria-label="Search the documentation"
    @focus="focused = true"
  />
  <p class="state">{{ focused ? 'focused' : 'idle' }}</p>
</template>`,
          'SearchField.vue': `<script setup>
// TODO
</script>

<template>
  <div class="search-field">
    <input class="search-input" type="search" />
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'class stays on the root', code: `expect(classes('.search-field')).toContain('compact'); expect(classes('.search-input')).not.toContain('compact')` },
        {
          name: 'other attrs go to the input',
          code: `expect(attr('.search-input', 'placeholder')).toBe('Search docs…')
expect(attr('.search-input', 'aria-label')).toBe('Search the documentation')
expect(attr('.search-field', 'placeholder')).toBeNull()`,
        },
        { name: 'listeners reach the input', code: `await trigger('.search-input', 'focus'); expect(text('.state')).toBe('focused')` },
      ],
      hints: ['Turn off automatic inheritance with `defineOptions`.', 'Use `useAttrs()` and a computed that removes `class` from a copy.', 'Bind `:class="attrs.class"` on the div and `v-bind="inputAttrs"` on the input.'],
      answer: 'Disable inheritance, then split `useAttrs()` into the `class` (for the wrapper) and the rest (for the input) with a computed.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import SearchField from './SearchField.vue'

const focused = ref(false)
</script>

<template>
  <SearchField
    class="compact"
    placeholder="Search docs…"
    aria-label="Search the documentation"
    @focus="focused = true"
  />
  <p class="state">{{ focused ? 'focused' : 'idle' }}</p>
</template>`,
          'SearchField.vue': `<script setup>
import { computed, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()

const inputAttrs = computed(() => {
  const { class: _class, ...rest } = attrs
  return rest
})
</script>

<template>
  <div class="search-field" :class="attrs.class">
    <input class="search-input" type="search" v-bind="inputAttrs" />
  </div>
</template>`,
        },
      },
      explanation: 'The computed re-evaluates during render, when attrs are current. The `onFocus` listener is just another key in attrs, so it travels to the input with the rest.',
      whyAsked: 'A practical design-system task that tests understanding of `$attrs` contents in Vue 3.',
      mistakes: ['Forgetting that listeners live in `$attrs` too.', 'Binding `$attrs` on both elements.', 'Keeping inheritance on, so attrs also land on the div.'],
      followUps: ['Would you move `style` to the wrapper as well?', 'How would you type this component in TypeScript?'],
      modelAnswer: 'I disable inheritance with `defineOptions({ inheritAttrs: false })`, read `useAttrs()`, and build a computed that copies the attrs without `class`. The div binds `attrs.class`; the input gets `v-bind` of the rest, which includes the placeholder, aria-label and the `onFocus` listener. I\'d probably route `style` to the wrapper too, since it\'s usually about layout.',
    },
    {
      id: 'fallthrough-attrs-api-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'You\'re designing `BaseButton` for a component library. Which inputs would you declare as props, which would you leave as fallthrough attributes, and why?',
      answer: 'Declare props for things the component\'s own logic or styling depends on: `variant`, `size`, `loading`, maybe `type` with a safe default of `"button"` (bound explicitly). Leave standard attributes and listeners to fall through: `disabled`, `aria-*`, `title`, `form`, `name`, `data-test`, `class`, `@click`, `@focus`. That keeps the API small, lets the button behave like a native `<button>`, and avoids re-implementing HTML.',
      explanation: 'Props for behaviour, fallthrough for the native surface.',
      whyAsked: 'Senior/design-system roles need judgment about component API surface area.',
      mistakes: ['Declaring props for every HTML attribute.', 'Declaring `click` as an emit and also letting it fall through natively.', 'Forgetting `type="button"` defaults inside forms.'],
      followUps: ['How would `loading` interact with `disabled`?', 'Would you make it polymorphic (render as `<a>`)?'],
      modelAnswer: 'I\'d declare only what changes the component itself: `variant` and `size` with validators, `loading` because it swaps content and should disable the button, and `type` defaulting to "button" so it doesn\'t accidentally submit forms — bound explicitly since declaring it removes it from attrs. Everything else — disabled, aria attributes, data attributes, classes and native listeners — falls through to the root button, so it behaves like a native element and the API stays small.',
    },
  ],

  takeaways: [
    'Anything passed to a component that isn\'t a declared prop or emit is a fallthrough attribute, available as `$attrs` / `useAttrs()`.',
    'With a single root element, attrs are applied automatically: class/style merge, other attributes override, listeners are added.',
    'Multi-root components get no automatic fallthrough — bind `$attrs` explicitly.',
    '`inheritAttrs: false` (via `defineOptions`, 3.3+) plus `v-bind="$attrs"` redirects attrs to the right element.',
    'In Vue 3, `$attrs` includes `class`, `style` and listeners; it is always current but not watchable.',
  ],
}
