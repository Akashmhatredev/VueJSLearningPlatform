// Lesson: Design systems & component libraries — tokens, theming, base components, layout components.

const mainJs = `import { createApp } from 'vue'
import './styles/tokens.css'
import App from './App.vue'

createApp(App).mount('#app')`

const tokensCss = `/* 1. PRIMITIVE tokens: the raw palette and scales.
      Components never use these directly. */
:root {
  --blue-600: #1d4ed8;
  --blue-300: #93b4fd;
  --red-700: #b91c1c;
  --red-300: #fca5a5;
  --gray-0: #ffffff;
  --gray-100: #f3f4f6;
  --gray-300: #d1d5db;
  --gray-700: #374151;
  --gray-900: #111827;
  --gray-950: #0b0f19;

  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;
  --radius-md: 8px;
}

/* 2. SEMANTIC tokens: what a value is FOR. Components use these. */
:root {
  --color-surface: var(--gray-0);
  --color-surface-raised: var(--gray-100);
  --color-text: var(--gray-900);
  --color-text-muted: var(--gray-700);
  --color-border: var(--gray-700);
  --color-action: var(--blue-600);
  --color-on-action: var(--gray-0);
  --color-danger: var(--red-700);
  --color-on-danger: var(--gray-0);
}

/* 3. A THEME only re-points semantic tokens. No component changes. */
[data-theme='dark'] {
  --color-surface: var(--gray-950);
  --color-surface-raised: var(--gray-900);
  --color-text: var(--gray-100);
  --color-text-muted: var(--gray-300);
  --color-border: var(--gray-300);
  --color-action: var(--blue-300);
  --color-on-action: var(--gray-950);
  --color-danger: var(--red-300);
  --color-on-danger: var(--gray-950);
}`

const baseButtonVue = `<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md'].includes(value),
  },
  type: { type: String, default: 'button' },
})

const variantClass = {
  primary: 'btn--primary',
  secondary: 'btn--secondary',
}
const sizeClass = { sm: 'btn--sm', md: 'btn--md' }

const classes = computed(() => [
  'btn',
  variantClass[props.variant] ?? variantClass.primary,
  sizeClass[props.size] ?? sizeClass.md,
])
</script>

<template>
  <button :type="type" :class="classes">
    <slot />
  </button>
</template>

<style scoped>
/* Component tokens live on the component and are fed by semantic tokens */
.btn {
  --btn-bg: var(--color-action);
  --btn-fg: var(--color-on-action);
  --btn-border: var(--color-action);

  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 2px solid var(--btn-border);
  border-radius: var(--radius-md);
  background: var(--btn-bg);
  color: var(--btn-fg);
  font: inherit;
  font-weight: 600;
  box-shadow: none;
  cursor: pointer;
}

.btn--secondary {
  --btn-bg: transparent;
  --btn-fg: var(--color-action);
}

.btn--sm {
  padding: var(--space-1) var(--space-2);
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn:focus-visible {
  outline: 3px solid var(--color-action);
  outline-offset: 2px;
}
</style>`

const baseStackVue = `<script setup>
import { computed } from 'vue'

const props = defineProps({
  gap: { type: String, default: 'md' },
  as: { type: String, default: 'div' },
})

// Gap names map to spacing tokens, so layouts can't drift off the scale
const gapToken = {
  sm: 'var(--space-2)',
  md: 'var(--space-4)',
}

const style = computed(() => ({ '--stack-gap': gapToken[props.gap] ?? gapToken.md }))
</script>

<template>
  <component :is="as" class="stack" :style="style">
    <slot />
  </component>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--stack-gap);
  margin: 0;
  padding: 0;
}
</style>`

const appVue = `<script setup>
import { ref } from 'vue'
import BaseButton from './components/BaseButton.vue'
import BaseStack from './components/BaseStack.vue'

const theme = ref('light')
const saving = ref(false)

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

function save() {
  saving.value = true
  setTimeout(() => {
    saving.value = false
  }, 400)
}
</script>

<template>
  <div class="app" :data-theme="theme">
    <BaseStack gap="lg" data-test="sections">
      <header class="app-header">
        <h1 class="app-title">Project settings</h1>
        <BaseButton
          variant="secondary"
          size="sm"
          class="theme-toggle"
          :aria-pressed="theme === 'dark'"
          @click="toggleTheme"
        >
          Dark mode
        </BaseButton>
      </header>

      <section class="panel">
        <BaseStack gap="sm">
          <h2 class="panel-title">General</h2>
          <p class="muted">Rename the project or change who can see it.</p>
          <BaseButton data-test="save" :loading="saving" @click="save">Save changes</BaseButton>
        </BaseStack>
      </section>

      <section class="panel">
        <BaseStack gap="sm">
          <h2 class="panel-title">Danger zone</h2>
          <p class="muted">Deleting a project cannot be undone.</p>
          <BaseButton variant="danger" data-test="delete">Delete project</BaseButton>
        </BaseStack>
      </section>
    </BaseStack>
  </div>
</template>

<style scoped>
.app {
  padding: var(--space-4);
  background: var(--color-surface);
  color: var(--color-text);
}

.app-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.app-title {
  margin: 0;
}

.panel {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-raised);
}

.panel-title {
  margin: 0;
  font-size: 1.1rem;
}

.muted {
  margin: 0;
  color: var(--color-text-muted);
}
</style>`

const alertApp = `<script setup>
import { ref } from 'vue'
import BaseAlert from './BaseAlert.vue'

const visible = ref(true)
</script>

<template>
  <BaseAlert
    v-if="visible"
    tone="warning"
    title="Storage almost full"
    dismissible
    class="page-alert"
    @dismiss="visible = false"
  >
    You have used 9 of your 10 GB.
  </BaseAlert>
  <p v-else class="restored">Alert dismissed.</p>
</template>`

const alertSolution = `<script setup>
import { computed } from 'vue'

const props = defineProps({
  tone: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'success', 'warning', 'danger'].includes(value),
  },
  title: { type: String, default: '' },
  dismissible: { type: Boolean, default: false },
})

const emit = defineEmits(['dismiss'])

const toneClass = {
  info: 'alert--info',
  success: 'alert--success',
  warning: 'alert--warning',
  danger: 'alert--danger',
}

const classes = computed(() => ['alert', toneClass[props.tone] ?? toneClass.info])
</script>

<template>
  <div :class="classes">
    <div class="alert-content">
      <p v-if="title" class="alert-title">{{ title }}</p>
      <div class="alert-body"><slot /></div>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="alert-dismiss"
      aria-label="Dismiss"
      @click="emit('dismiss')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.alert {
  --alert-accent: #1d4ed8;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-left: 6px solid var(--alert-accent);
  border-radius: 8px;
  background: #fff;
}

.alert--success { --alert-accent: #15803d; }
.alert--warning { --alert-accent: #b45309; }
.alert--danger { --alert-accent: #b91c1c; }

.alert-title {
  margin: 0 0 4px;
  font-weight: 700;
}

.alert-dismiss {
  padding: 0 8px;
  border: 0;
  background: transparent;
  box-shadow: none;
  font-size: 1.25rem;
  line-height: 1;
}
</style>`

const themeApp = `<script setup>
import { useTheme } from './useTheme.js'

const { theme, resolvedTheme, setTheme } = useTheme()
const options = ['light', 'dark', 'system']
</script>

<template>
  <div class="app" :data-theme="resolvedTheme">
    <p>Theme</p>
    <div class="theme-options" role="group" aria-label="Colour theme">
      <button
        v-for="option in options"
        :key="option"
        :class="'theme-' + option"
        :aria-pressed="theme === option"
        @click="setTheme(option)"
      >
        {{ option }}
      </button>
    </div>
    <p class="current">Showing: {{ resolvedTheme }}</p>
  </div>
</template>

<style scoped>
.app {
  padding: 16px;
  background: var(--color-surface);
  color: var(--color-text);
}
.theme-options { display: flex; gap: 8px; }
</style>`

const themeTokens = `:root {
  --color-surface: #ffffff;
  --color-text: #111827;
}

[data-theme='dark'] {
  --color-surface: #0b0f19;
  --color-text: #f3f4f6;
}`

const themeMain = `import { createApp } from 'vue'
import './tokens.css'
import App from './App.vue'

createApp(App).mount('#app')`

const clusterStarter = `<script setup>
// TODO: props gap, justify and as
</script>

<template>
  <div class="cluster">
    <slot />
  </div>
</template>

<style scoped>
.cluster {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>`

const clusterApp = `<script setup>
import BaseCluster from './BaseCluster.vue'
</script>

<template>
  <BaseCluster as="ul" gap="sm" justify="between" data-test="tags">
    <li>vue</li>
    <li>css</li>
    <li>design tokens</li>
  </BaseCluster>
</template>`

export default {
  id: 'design-systems',
  title: 'Design systems & component libraries',
  summary: 'Turn design decisions into tokens, build themeable base and layout components on top of them, and evaluate component libraries with clear criteria instead of hype.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['styling-in-vue', 'fallthrough-attrs', 'slots'],
  related: ['responsive-dynamic-styles', 'accessible-components', 'accessibility-fundamentals', 'project-structure', 'design-patterns', 'dynamic-components'],
  tags: ['design system', 'design tokens', 'theming', 'dark mode', 'base components', 'layout components', 'component library', 'headless components', 'variants', 'fallthrough attributes', 'semantic tokens'],
  apis: [
    { name: 'Design tokens', summary: 'Named design decisions (colour, spacing, radius, type) stored once and reused everywhere — in CSS usually as custom properties.' },
    { name: '[data-theme] overrides', summary: 'A theme re-points semantic tokens under an attribute selector; components stay unchanged.' },
    { name: '<component :is="as">', summary: 'Lets a layout component render as any element (div, ul, section) while keeping its styling.' },
    { name: 'Fallthrough attributes', summary: 'class, style, listeners and other attributes passed to a component land on its root element automatically.' },
  ],
  docs: [
    { label: 'Vue Guide — Fallthrough Attributes', url: 'https://vuejs.org/guide/components/attrs.html' },
    { label: 'Vue Guide — Slots', url: 'https://vuejs.org/guide/components/slots.html' },
    { label: 'Vue Guide — Props validation', url: 'https://vuejs.org/guide/components/props.html#prop-validation' },
    { label: 'Vue Guide — Dynamic components', url: 'https://vuejs.org/guide/essentials/component-basics.html#dynamic-components' },
    { label: 'MDN — Using CSS custom properties', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties' },
    { label: 'MDN — prefers-color-scheme', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme' },
  ],

  intro: `
A **design system** is a team's shared language for building interfaces. It usually contains:

- **Design tokens** — named design decisions: \`--color-action\`, \`--space-4\`, \`--radius-md\`.
- **Components** — reusable building blocks that use those tokens: \`BaseButton\`, \`BaseInput\`, \`BaseStack\`.
- **Patterns & guidelines** — how pieces combine ("one primary button per screen", "destructive actions ask for confirmation").
- **Documentation** — so everyone can find and use all of the above.

A **component library** is just the components part, and it may be your own or a third-party package. This lesson builds a tiny design system in Vue — tokens, a theme, a button with variants and a layout component — and then shows how to judge third-party libraries calmly.
`,

  why: `
Without a system, every developer makes small, reasonable decisions on their own:

\`\`\`css
.save-button   { background: #1d4ed8; padding: 8px 16px; border-radius: 8px; }
.submit-btn    { background: #1e40af; padding: 10px 14px; border-radius: 6px; }
.confirm       { background: #2563eb; padding: 8px 18px; border-radius: 4px; }
\`\`\`

Three "blue buttons", three slightly different blues, paddings and corners. Multiply by every screen and every year, and the product looks stitched together. Now the brand colour changes — or someone asks for dark mode — and you're searching hundreds of files for hex codes.

A design system fixes this by deciding things **once**: one token for "the action colour", one \`BaseButton\` that everyone uses. Changing the brand becomes a one-line edit; dark mode becomes a second set of token values. And because the button is built once, its accessibility (focus ring, disabled state, keyboard behaviour) is done right once — for everyone.
`,

  eli15: `
Think of LEGO. LEGO doesn't make a new brick shape for every set. There are standard bricks, in a standard set of colours, with standard sizes that always click together. That's why a castle and a spaceship can share pieces.

A design system is LEGO for an app:

- **Tokens** are the official colours and sizes ("LEGO red", "2×4"). In code: \`--color-action\`, \`--space-4\`.
- **Base components** are the standard bricks: one button, one input, one card.
- **Layout components** are the baseplates that hold things in neat rows and columns.

**Dark mode** is like swapping the colour palette of the whole box at once: the bricks keep their shapes; only the colours behind the names change.
`,

  analogy: {
    title: 'A restaurant chain\'s kitchen standards',
    body: `
A restaurant chain wants its burger to taste the same in every city. So headquarters publishes standards: exact ingredients (the **primitives**), named recipes for each component like "house sauce" (**semantic tokens**: the sauce is defined by its purpose, not its ingredients), and assembly guides for each dish (**components**).

A local branch with a vegan menu doesn't rewrite every dish — it swaps what "house sauce" is made of. That's a **theme**: same names, different values underneath.

Buying a ready-made sauce from a supplier is like adopting a **third-party component library**: faster, but you check the ingredients, whether it fits your recipes, and what happens if the supplier changes the formula.
`,
    mapping: [
      ['raw ingredients', 'primitive tokens (`--blue-600`, `--space-4`)'],
      ['"house sauce" (named by purpose)', 'semantic tokens (`--color-action`)'],
      ['the dish assembly guide', 'base components (`BaseButton`)'],
      ['a branch swapping the sauce recipe', 'a theme overriding semantic tokens'],
      ['buying from a supplier', 'adopting a third-party component library'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Token layers: from palette to pixels',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'prim', label: 'Primitive tokens', note: '--blue-600: #1d4ed8', tone: 'paper', x: 110, y: 90 },
        { id: 'sem', label: 'Semantic tokens', note: '--color-action: var(--blue-600)', tone: 'acid', x: 330, y: 90 },
        { id: 'comp', label: 'Component tokens', note: '.btn { --btn-bg: var(--color-action) }', tone: 'cobalt', x: 560, y: 90 },
        { id: 'ui', label: 'Rendered button', note: 'background: var(--btn-bg)', tone: 'ink', x: 560, y: 250 },
        { id: 'theme', label: 'Dark theme', note: '[data-theme=dark] { --color-action: var(--blue-300) }', tone: 'kraft', x: 250, y: 250 },
      ],
      edges: [
        { from: 'prim', to: 'sem', label: 'named by purpose' },
        { from: 'sem', to: 'comp', label: 'feeds' },
        { from: 'comp', to: 'ui', label: 'used by CSS' },
        { from: 'theme', to: 'sem', label: 're-points', dashed: true },
      ],
      steps: [
        { focus: ['prim'], text: '**Primitives** are the raw palette and scales: every blue, every spacing step. They describe *what exists*, not where to use it.' },
        { focus: ['sem'], edges: ['prim->sem'], text: '**Semantic tokens** name a *purpose*: "the action colour", "muted text", "raised surface". Components should only ever use this layer (or their own).' },
        { focus: ['comp'], edges: ['sem->comp'], text: '**Component tokens** (optional) give one component its own knobs — `--btn-bg` — defaulting to semantic tokens. Variants just re-set these knobs.' },
        { focus: ['ui'], edges: ['comp->ui'], text: 'The component\'s CSS reads its tokens. No hex codes in component files means nothing to hunt down later.' },
        { focus: ['theme', 'sem'], edges: ['theme->sem'], text: 'A **theme** re-points semantic tokens under `[data-theme="dark"]`. Every component updates, and not a single component file changed.' },
      ],
    },
    caption: 'Themes swap the middle layer; components only read semantic or component tokens.',
    alt: 'Diagram with three layers left to right: primitive tokens like --blue-600, semantic tokens like --color-action that point at primitives, and component tokens like --btn-bg that point at semantic tokens and are used by the rendered button. A dark theme box re-points the semantic layer.',
  },

  syntax: [
    `
#### 1. Tokens as CSS custom properties
Keep three layers. Primitives on \`:root\`; semantic tokens on \`:root\` that point at primitives; themes that re-point semantic tokens.
`,
    {
      code: `:root {
  --blue-600: #1d4ed8;                    /* primitive */
  --color-action: var(--blue-600);        /* semantic */
}

[data-theme='dark'] {
  --color-action: var(--blue-300);        /* theme: re-point the semantic token */
}`,
      lang: 'css',
      title: 'styles/tokens.css',
    },
    {
      callout: 'warn',
      title: 'Define component tokens on the component, not on :root',
      text: 'A custom property that uses `var()` is resolved **where it is declared**, then inherited as a finished value. If `--btn-bg: var(--color-action)` lives on `:root`, a dark theme set on a wrapper can\'t change it — `--btn-bg` was already resolved at the root. Declare it on `.btn` instead, so it resolves inside the themed subtree.',
    },
    `
#### 2. A base component with variants
Validate the allowed values, map them to classes, and let **fallthrough attributes** (\`class\`, \`data-*\`, \`aria-*\`, listeners) land on the root \`<button>\` automatically.
`,
    {
      code: `<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary', validator: (v) => ['primary', 'secondary', 'danger'].includes(v) },
  type: { type: String, default: 'button' },       // never submit a form by accident
})

const variantClass = { primary: 'btn--primary', secondary: 'btn--secondary', danger: 'btn--danger' }
const classes = computed(() => ['btn', variantClass[props.variant] ?? variantClass.primary])
</script>

<template>
  <button :type="type" :class="classes"><slot /></button>
</template>`,
      lang: 'vue',
      title: 'BaseButton.vue (core idea)',
    },
    `
\`<BaseButton variant="danger" class="mt" @click="remove">\` renders \`<button type="button" class="btn btn--danger mt">\` with the click listener attached — you didn't declare \`class\` or \`onClick\`; they fell through.

#### 3. Layout components
Layout components own **spacing and arrangement**, so feature components don't each invent margins. Map size names to spacing tokens, and render any element with \`<component :is>\`.
`,
    {
      code: `<!-- BaseStack.vue -->
<template>
  <component :is="as" class="stack" :style="{ '--stack-gap': gapToken[gap] }">
    <slot />
  </component>
</template>

<!-- usage -->
<BaseStack as="ul" gap="sm">
  <li>…</li>
</BaseStack>`,
      lang: 'vue',
      title: 'a stack layout',
    },
    `
Other common layout primitives: **Cluster** (items in a wrapping row), **Grid** (responsive columns), **PageLayout** (named slots for \`header\`, \`sidebar\`, default, \`footer\`).

#### 4. Theming the whole app
Set the theme attribute high in the tree — usually on \`<html>\` — and default to the user's system preference:
`,
    {
      code: `// e.g. in App.vue or a useTheme() composable
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
document.documentElement.dataset.theme = savedTheme ?? (prefersDark ? 'dark' : 'light')`,
      lang: 'js',
      title: 'apply the theme',
    },
    {
      callout: 'note',
      title: 'Component libraries: the three broad kinds',
      text: '**Styled libraries** ship behaviour, accessibility and a visual design (themeable to a degree). **Headless / unstyled libraries** ship behaviour and accessibility only — you bring all the styling, often with your own tokens. **CSS frameworks / utility CSS** ship styles only, no component behaviour. All are valid; the right one depends on how custom your design is and how much you want to own.',
    },
    {
      callout: 'version',
      text: 'Everything here is standard Vue 3 and CSS. `defineOptions({ inheritAttrs: false })` (for when attributes should land somewhere other than the root) needs Vue 3.3+; before that, use a separate `<script>` block with `export default { inheritAttrs: false }`.',
    },
  ],

  walkthrough: {
    title: 'components/BaseButton.vue',
    lang: 'vue',
    code: baseButtonVue,
    intro: 'The button from the playground — small, but it carries the whole design-system idea.',
    steps: [
      { lines: [4, 16], text: 'Props are the button\'s **public API**. Validators document the allowed values and warn in development when someone passes an unknown one.' },
      { lines: [15], text: '`type` defaults to `"button"`. A plain `<button>` inside a `<form>` defaults to `submit` — a classic bug a design system fixes once for everyone.' },
      { lines: [18, 22], text: 'Variant and size **maps**: one place to see every option. A typo in the validator list or here is easy to spot in review.' },
      { lines: [24, 28], text: 'The computed class list with fallbacks, so an invalid value still renders a sensible button.' },
      { lines: [31, 35], text: 'The template is tiny. No `class`, `disabled` or `@click` declared — they arrive as **fallthrough attributes** and land on `<button>` because it is the single root.' },
      { lines: [38, 42], text: '**Component tokens** declared on `.btn` and fed by semantic tokens. Because they are declared here, they resolve inside whatever theme wraps the button.' },
      { lines: [44, 55], text: 'The base styles read only tokens — no hex codes, no magic spacing numbers.' },
      { lines: [58, 61], text: 'A variant just re-sets component tokens. Adding `danger` will be three lines.' },
      { lines: [73, 76], text: 'A visible focus style built in, using the action colour token — so keyboard users get it on every button in the app.' },
    ],
  },

  playground: {
    title: 'Mini design system',
    objective: 'Explore tokens, a theme, a variant-driven button and a layout component — then extend the system in the way real teams do.',
    files: {
      'main.js': mainJs,
      'styles/tokens.css': tokensCss,
      'App.vue': appVue,
      'components/BaseButton.vue': baseButtonVue,
      'components/BaseStack.vue': baseStackVue,
    },
    expected: 'A **Project settings** page with two panels. Click **Dark mode**: every colour flips, though no component changed. The **Delete project** button looks like a normal blue button and the console shows a Vue warning — `danger` isn\'t a variant yet. **Save changes** has no loading state yet.',
    experiments: [
      {
        id: 'danger-variant',
        task: 'Add a `danger` variant to BaseButton.vue: allow it in the validator, add `danger: \'btn--danger\'` to the variant map, and add a `.btn--danger` rule that sets `--btn-bg` and `--btn-border` to `var(--color-danger)` and `--btn-fg` to `var(--color-on-danger)`.',
        hint: 'Three small edits in BaseButton.vue. The tokens `--color-danger` and `--color-on-danger` already exist in both themes.',
        tests: [
          {
            name: 'Delete project renders with btn--danger',
            code: `const cls = classes('[data-test="delete"]')
expect(cls).toContain('btn--danger')
expect(cls).not.toContain('btn--primary')`,
          },
        ],
        explain: 'You didn\'t pick a red for dark mode — the theme already defines what "danger" means there. Variants set component tokens, themes set semantic tokens, and the two never step on each other.',
      },
      {
        id: 'stack-gap-lg',
        task: 'The page uses `<BaseStack gap="lg">`, but BaseStack only knows `sm` and `md`, so the sections are too close together. Add an `lg` size that maps to the `--space-6` token.',
        hint: 'Add `lg: \'var(--space-6)\'` to `gapToken` in BaseStack.vue.',
        tests: [
          {
            name: 'the outer stack uses the --space-6 token',
            code: `expect(find('[data-test="sections"]').style.getPropertyValue('--stack-gap').trim()).toBe('var(--space-6)')`,
          },
        ],
        explain: 'Layout components only accept names from the spacing scale, so pages can\'t drift into random pixel values. Notice that `data-test="sections"` reached the root element through fallthrough attributes.',
      },
      {
        id: 'loading-state',
        task: 'Give BaseButton a `loading` prop (Boolean). While loading, the button must be **disabled** and have `aria-busy="true"`. Click **Save changes** to see it.',
        hint: 'Declare `loading: { type: Boolean, default: false }`, then on `<button>` bind `:disabled="loading"` and `:aria-busy="loading ? \'true\' : undefined"`.',
        tests: [
          {
            name: 'while saving, the button is disabled and aria-busy',
            code: `await click('[data-test="save"]')
expect(find('[data-test="save"]').disabled).toBe(true)
expect(attr('[data-test="save"]', 'aria-busy')).toBe('true')
await wait(450)
expect(find('[data-test="save"]').disabled).toBe(false)
expect(attr('[data-test="save"]', 'aria-busy')).toBeNull()`,
          },
        ],
        explain: 'Building the loading state into the base component means every save button in the app prevents double submits and tells assistive technology it is busy — without each feature remembering to.',
      },
      {
        id: 'theme-only',
        task: 'Click **Dark mode** and inspect `.app` in DevTools: only `data-theme` changed. Now, in `styles/tokens.css`, change the dark theme\'s `--color-action` to `var(--red-300)` and toggle again. Then change it back.',
        hint: 'Look at the `[data-theme=\'dark\']` block — it only re-points semantic tokens.',
        explain: 'One line changed the action colour of every button, focus ring and secondary label in dark mode. That leverage is what tokens buy you — and why primitives should never be used directly in components.',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Hard-coded values vs tokens',
    props: {
      left: {
        label: 'Hard-coded',
        lang: 'css',
        code: `.save-btn {
  background: #1d4ed8;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 8px;
}

/* dark mode: copy every rule again */
.dark .save-btn {
  background: #93b4fd;
  color: #0b0f19;
}`,
      },
      right: {
        label: 'Token-based',
        lang: 'css',
        code: `.btn {
  --btn-bg: var(--color-action);
  --btn-fg: var(--color-on-action);
  background: var(--btn-bg);
  color: var(--btn-fg);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
}

/* dark mode lives in tokens.css — nothing here */`,
      },
      points: [
        'Hard-coded values repeat in every component and drift apart over time.',
        'Tokens name a purpose ("action colour"), so a rebrand is a one-line change.',
        'With tokens, dark mode is a second set of values — component CSS doesn\'t change.',
        'Spacing tokens keep every layout on the same scale.',
      ],
    },
    caption: 'The same button, two ways. Only one of them survives a rebrand gracefully.',
    alt: 'Side-by-side CSS: on the left a button with hex colours and pixel values plus a duplicated dark-mode rule; on the right the same button reading component tokens fed by semantic tokens, with dark mode handled entirely in the tokens file.',
  },

  internals: {
    beginner: `
Tokens are just CSS custom properties with good names, organised in layers. Because custom properties are inherited, a theme can change their values for a whole part of the page at once. Base components are ordinary Vue components that read those tokens and expose a small, well-documented set of props.
`,
    technical: [
      `
**How the cascade makes themes work.** A custom property's value is computed on each element where it is declared — \`var()\` references are substituted at that point — and then **inherited as that computed value**. That's why:

- semantic tokens re-declared under \`[data-theme='dark']\` take effect for that subtree;
- component tokens must be declared on the component's own selector (\`.btn\`), so they are computed *inside* the themed subtree;
- a component token declared on \`:root\` would be "frozen" to the light value for every descendant.
`,
      {
        code: `/* ❌ resolved once at :root, inherited as the light value */
:root { --btn-bg: var(--color-action); }

/* ✅ resolved on each .btn, inside whatever theme wraps it */
.btn  { --btn-bg: var(--color-action); }`,
        lang: 'css',
        title: 'where to declare component tokens',
      },
      `
**How Vue helps base components.** Attributes and listeners a component doesn't declare as props or emits are collected into \`$attrs\` and merged onto the root element: \`class\` and \`style\` are **merged** with the root's own, other attributes override the root's, listeners are added. Prop \`validator\` functions run in development builds only and log warnings — they don't stop rendering, so keep a fallback in the class map. \`<component :is="as">\` accepts a tag name string or a component, which is how layout components can render as \`ul\`, \`section\` or \`nav\`.

**Token pipelines.** Larger systems often keep tokens in a data file (for example JSON) and generate CSS custom properties, JavaScript constants and native-platform values from it with a build tool. The W3C Design Tokens Community Group publishes a shared file format for this.
`,
    ],
    production: `
- **Version the system like a product.** If it's a shared package, use semantic versioning, write a changelog, and deprecate props (with dev warnings) for a release before removing them.
- **Document every component** with live examples and its props, slots, events and accessibility notes — tools like Storybook or Histoire are common; a docs page in your own app works too.
- **Accessibility belongs in the base layer.** Focus styles, \`type="button"\`, labels, keyboard support and contrast are solved once in base components. Check text/background token pairs against WCAG AA (4.5:1 for normal text, 3:1 for large text and UI component boundaries) — in **every** theme. (The token pairs in this lesson's playground were checked for AA.)
- **Wrap third-party components** in your own (\`AppDatePicker\`) so the rest of the app depends on your API, not the library's. Upgrades and replacements then touch one file.
- **Evaluate libraries with criteria, not popularity:** accessibility quality (keyboard and screen-reader support), theming model (does it accept your tokens?), Vue 3 support and maintenance activity, bundle impact and tree-shaking, SSR/Nuxt compatibility, RTL/i18n support, TypeScript types, licence, and how easy it is to escape when you need something custom.
- **Avoid flash of the wrong theme** in server-rendered apps by applying the saved theme before first paint (e.g. a tiny inline script that sets \`data-theme\` on \`<html>\`).
- **Visual regression tests** catch accidental token changes that unit tests can't see.
`,
  },

  mistakes: [
    {
      title: 'Using primitive tokens directly in components',
      wrong: { code: `.btn { background: var(--blue-600); }`, lang: 'css' },
      right: { code: `.btn { background: var(--color-action); }`, lang: 'css' },
      explanation: 'A primitive says *what colour*, not *what for*. Themes re-point semantic tokens, so a component using `--blue-600` stays blue in dark mode (and in a rebrand). Components should only read semantic or their own component tokens.',
    },
    {
      title: 'Declaring component tokens on :root',
      wrong: { code: `:root { --btn-bg: var(--color-action); }\n[data-theme='dark'] { --color-action: var(--blue-300); }\n/* buttons inside the dark wrapper keep the LIGHT theme's blue */`, lang: 'css' },
      right: { code: `.btn { --btn-bg: var(--color-action); }`, lang: 'css' },
      explanation: 'Custom properties resolve `var()` where they are declared and inherit the result. Declare component tokens on the component so they resolve inside the theme.',
    },
    {
      title: 'A base button without `type="button"`',
      wrong: { code: `<template>\n  <button :class="classes"><slot /></button>\n</template>`, lang: 'vue' },
      right: { code: `<template>\n  <button :type="type" :class="classes"><slot /></button>\n</template>\n<!-- with a type prop defaulting to 'button' -->`, lang: 'vue' },
      explanation: 'Inside a `<form>`, a `<button>` without a type is a submit button. Every "Cancel" or "Show password" BaseButton would submit the form. Default to `button` and let callers opt into `submit`.',
    },
    {
      title: 'Layout spacing baked into reusable components',
      wrong: { code: `<style scoped>\n.product-card { margin-bottom: 24px; } /* wrong in a grid, a sidebar, a modal... */\n</style>`, lang: 'vue' },
      right: { code: `<BaseStack gap="lg">\n  <ProductCard v-for="p in products" :key="p.id" :product="p" />\n</BaseStack>`, lang: 'vue' },
      explanation: 'Outer margins assume where a component will be placed. Let the **parent layout** own the space between children (with `gap`), and keep components free of external margins.',
    },
    {
      title: 'Re-implementing complex widgets from scratch without need',
      wrong: { code: `// a home-made combobox / date picker with partial keyboard support`, lang: 'js' },
      right: { code: `// a well-tested headless or styled library component,\n// wrapped once in AppCombobox.vue and themed with your tokens`, lang: 'js' },
      explanation: 'Comboboxes, date pickers and data grids have a lot of accessibility and edge-case behaviour. Building them is fine when you need to — but budget for it. Often a library component, wrapped behind your own API, is the safer choice.',
    },
  ],

  debugging: [
    {
      symptom: 'Dark mode changes most colours, but one component stays light.',
      cause: 'That component uses hex codes or primitive tokens, or its component tokens are declared on `:root`.',
      fix: 'Search it for hex codes and `--blue-…`-style primitives; switch to semantic tokens and declare component tokens on the component selector.',
    },
    {
      symptom: '`var(--color-action)` renders as nothing (transparent / default colour).',
      cause: 'The token isn\'t defined in scope — typo, or tokens.css isn\'t imported (e.g. only imported in one route\'s chunk).',
      fix: 'Inspect the element: the Computed panel shows custom property values. Import tokens once in `main.js`, and give `var()` a fallback for critical properties while debugging.',
    },
    {
      symptom: 'A `class` passed to a base component doesn\'t appear in the DOM, with a warning about extraneous non-props attributes.',
      cause: 'The component has multiple root nodes (a fragment), so Vue can\'t decide where fallthrough attributes go.',
      fix: 'Use a single root, or bind `v-bind="$attrs"` on the element that should receive them (with `inheritAttrs: false` if needed).',
    },
    {
      symptom: 'A Vue warning: "Invalid prop: custom validator check failed for prop variant".',
      cause: 'Someone passed a value the base component doesn\'t support (e.g. `variant="danger"` before it existed).',
      fix: 'Add the variant properly (validator + map + CSS) or use an existing one. Validators only warn in development — the class-map fallback keeps production rendering sane.',
    },
  ],

  bestPractices: [
    'Keep three token layers: primitives → semantic → (optional) component; components never read primitives.',
    'Themes override semantic tokens only; check contrast for every theme (WCAG AA: 4.5:1 text, 3:1 large text and UI parts).',
    'Give base components a small, validated prop API with sensible defaults (`type="button"`, `variant="primary"`).',
    'Let fallthrough attributes do their job — don\'t re-declare `class` or `onClick` as props.',
    'Let layout components own spacing; keep reusable components free of outer margins.',
    'Wrap third-party components behind your own components and theme them with your tokens.',
    'Document, version and deprecate gradually — a design system is a product with users.',
  ],

  useCases: [
    'Rebranding an app by changing a handful of primitive or semantic tokens.',
    'Light, dark and high-contrast themes from one set of components.',
    'Multi-brand products (white-label apps) where each customer gets their own semantic token values.',
    'A shared component package used by several apps in a company.',
    'Consistent page layouts built from Stack, Cluster, Grid and PageLayout components.',
    'Evaluating whether to adopt a styled library, a headless library, or build components in-house.',
  ],

  whenToUse: {
    use: [
      'As soon as two people build UI in the same app: at least tokens and a few base components.',
      'When you need theming (dark mode, brands) — tokens make it cheap.',
      'A component library when its accessibility, theming model and maintenance meet your criteria.',
      'Headless libraries when your design is custom but you want proven behaviour and accessibility.',
    ],
    avoid: [
      'Building a huge in-house system before the product\'s needs are clear — grow it from real, repeated components.',
      'Adopting a library you\'ll fight constantly to make look like your design.',
      'Wrapping every native element "just because" — wrap when you add real value (variants, accessibility, consistency).',
      'Tokens for one-off values that will never be reused or themed.',
    ],
  },

  comparison: {
    title: 'Where your components come from',
    headers: ['', 'Build in-house', 'Styled library', 'Headless library', 'CSS framework / utilities'],
    rows: [
      ['You get', 'exactly what you build', 'behaviour + accessibility + visual design', 'behaviour + accessibility, no styles', 'styles only'],
      ['Visual freedom', 'total', 'limited to its theming options', 'total', 'high'],
      ['Effort to start', 'highest', 'lowest', 'medium', 'medium'],
      ['Accessibility work', 'all yours', 'mostly done (verify)', 'mostly done (verify)', 'all yours for behaviour'],
      ['Main risk', 'time and edge cases', 'fighting its look; upgrade churn', 'more styling work', 'no behaviour; class sprawl'],
    ],
    note: 'These approaches combine: many teams use a headless library for complex widgets, their own tokens for styling, and in-house base components on top. Next: make them usable by everyone in [Accessibility fundamentals](lesson:accessibility-fundamentals).',
  },

  quiz: [
    {
      id: 'design-systems-q1',
      type: 'mcq',
      prompt: 'Which of these is a **semantic** token?',
      options: [
        { text: '`--color-text-muted`' },
        { text: '`--gray-500`', why: 'That names a colour in the palette — a primitive. It says nothing about what it is used for.' },
        { text: '`#6b7280`', why: 'That\'s a raw value, not a token at all.' },
        { text: '`--btn-bg`', why: 'That\'s a component token: scoped to one component, usually fed by a semantic token.' },
      ],
      answer: 0,
      explanation: 'Semantic tokens name a purpose ("muted text"). Themes re-point them; components read them.',
    },
    {
      id: 'design-systems-q2',
      type: 'output',
      prompt: '`BaseButton` has a single root `<button :class="[\'btn\', variantClass]">`. What `class` attribute does this usage render?',
      code: { lang: 'vue', code: `<BaseButton variant="secondary" class="mt-2">Cancel</BaseButton>\n\n<!-- variantClass for "secondary" is 'btn--secondary' -->` },
      options: ['btn btn--secondary mt-2', 'mt-2', 'btn btn--secondary', 'btn mt-2'],
      answer: 0,
      explanation: '`class` isn\'t a prop, so it falls through to the root element and is **merged** with the component\'s own classes.',
    },
    {
      id: 'design-systems-q3',
      type: 'bug',
      prompt: 'In dark mode, every button turns light blue except the card\'s **Buy** button, which stays dark blue. Click the line that causes it.',
      code: {
        lang: 'css',
        code: `[data-theme='dark'] {
  --color-action: var(--blue-300);
}

.card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
}

.card .buy {
  background: var(--blue-600);
  color: var(--color-on-action);
}`,
      },
      answerLine: 11,
      explanation: 'The Buy button reads the primitive `--blue-600` directly, so the theme (which re-points `--color-action`) can\'t reach it. Use `var(--color-action)`.',
    },
    {
      id: 'design-systems-q4',
      type: 'fill',
      prompt: 'Complete the dark theme so it re-points the **semantic** surface token, and make the card read it.',
      code: { lang: 'css', code: `[data-theme='dark'] {\n  --color-surface: ___(--gray-950);\n}\n\n.card {\n  background: var(--color-___);\n}` },
      answer: [['var'], ['surface']],
      explanation: 'The theme points `--color-surface` at a different primitive with `var()`. Components only ever read the semantic name.',
    },
    {
      id: 'design-systems-q5',
      type: 'mcq',
      prompt: 'Select **all** good criteria for evaluating a third-party component library.',
      options: [
        { text: 'Keyboard and screen-reader support of its complex components (menus, dialogs, comboboxes).' },
        { text: 'Whether its theming model can use your tokens.' },
        { text: 'Maintenance activity and Vue 3 / SSR compatibility.' },
        { text: 'How many stars it has compared with other libraries.', why: 'Popularity says little about accessibility, fit with your design, or maintenance quality for your use case.' },
        { text: 'Bundle impact and whether unused components are tree-shaken.' },
      ],
      answer: [0, 1, 2, 4],
      explanation: 'Judge fit and quality: accessibility, theming, compatibility, maintenance, bundle impact, licence and escape hatches — not popularity contests.',
    },
    {
      id: 'design-systems-q6',
      type: 'mcq',
      prompt: 'Why should a reusable `ProductCard` avoid `margin-bottom: 24px` on its root?',
      options: [
        { text: 'Outer spacing depends on where the card is placed; the parent layout should own it (e.g. with `gap`).' },
        { text: 'Margins don\'t work on Vue components.', why: 'They work fine — the problem is the assumption about context, not the CSS.' },
        { text: 'Scoped styles ignore margins.', why: 'Scoping only changes which elements match; any property can be set.' },
        { text: 'Margins break fallthrough attributes.', why: 'Unrelated — fallthrough attributes are about props and the root element.' },
      ],
      answer: 0,
      explanation: 'A card in a grid, a list and a modal needs different spacing. Layout components with `gap` keep spacing consistent and components context-free.',
    },
    {
      id: 'design-systems-q7',
      type: 'short',
      prompt: 'Why might a team wrap a third-party date picker in their own `AppDatePicker.vue` instead of using it directly everywhere?',
      answer: 'The wrapper gives the app one stable API it controls. The library is configured, themed with the team\'s tokens and made accessible in one place; upgrades, bug workarounds or a full library replacement then touch one file instead of every page.',
    },
  ],

  exercises: [
    {
      id: 'base-alert',
      title: 'BaseAlert: variants, slots and events',
      difficulty: 'intermediate',
      prompt: `
Build \`BaseAlert.vue\`, a design-system alert used by \`App.vue\` (already written).

- Props: \`tone\` — one of \`info\` (default), \`success\`, \`warning\`, \`danger\` (validate it); \`title\` (string, optional); \`dismissible\` (boolean).
- The single root element has class \`alert\` plus \`alert--<tone>\`. An unknown tone falls back to \`alert--info\`.
- If \`title\` is set, render \`<p class="alert-title">\`; otherwise render no title element.
- Render the default slot inside \`<div class="alert-body">\`.
- If \`dismissible\`, render \`<button type="button" class="alert-dismiss" aria-label="Dismiss">\` that emits \`dismiss\` (declare it with \`defineEmits\`).
- Don't declare \`class\` as a prop — App's \`class="page-alert"\` must reach the root through fallthrough.
- Style tones by setting a component token such as \`--alert-accent\` in each \`.alert--<tone>\` rule.
`,
      files: {
        'App.vue': alertApp,
        'BaseAlert.vue': `<script setup>
// TODO: props, emits and the tone class
</script>

<template>
  <div class="alert">
    <slot />
  </div>
</template>`,
      },
      hints: [
        'Use `defineProps` with a `validator` for `tone`, and a `toneClass` map with a fallback in a computed.',
        'Wrap the slot in `<div class="alert-body">` and add `<p v-if="title" class="alert-title">`.',
        '`const emit = defineEmits([\'dismiss\'])`, then `<button v-if="dismissible" type="button" class="alert-dismiss" aria-label="Dismiss" @click="emit(\'dismiss\')">×</button>`.',
      ],
      solution: {
        explanation: 'Props are the alert\'s public API, the tone map keeps variants explicit, slots let callers provide any content, and an emitted event lets the parent decide what "dismiss" means. Fallthrough attributes handle `class` for free. Styling uses one component token per tone.',
        files: { 'App.vue': alertApp, 'BaseAlert.vue': alertSolution },
      },
      tests: [
        {
          name: 'tone sets alert--<tone>, defaulting to info',
          code: `const warn = mountFile('BaseAlert.vue', { tone: 'warning' })
expect([...warn.find('.alert').classList]).toContain('alert--warning')
const plain = mountFile('BaseAlert.vue', {})
expect([...plain.find('.alert').classList]).toContain('alert--info')`,
        },
        {
          name: 'unknown tone falls back to alert--info',
          code: `const odd = mountFile('BaseAlert.vue', { tone: 'purple' })
const cls = [...odd.find('.alert').classList]
expect(cls).toContain('alert--info')
expect(cls).not.toContain('alert--purple')`,
        },
        {
          name: 'title renders only when given',
          code: `const withTitle = mountFile('BaseAlert.vue', { title: 'Heads up' })
expect(withTitle.find('.alert-title').textContent.trim()).toBe('Heads up')
const noTitle = mountFile('BaseAlert.vue', {})
expect(noTitle.find('.alert-title')).toBeNull()`,
        },
        {
          name: 'dismiss button is labelled and emits dismiss',
          code: `const a = mountFile('BaseAlert.vue', { dismissible: true })
const btn = a.find('.alert-dismiss')
expect(btn).toBeTruthy()
expect(btn.getAttribute('aria-label')).toBe('Dismiss')
expect(btn.getAttribute('type')).toBe('button')
await click(btn)
expect(a.emitted('dismiss')).toHaveLength(1)
const b = mountFile('BaseAlert.vue', {})
expect(b.find('.alert-dismiss')).toBeNull()`,
        },
        {
          name: 'in App: slot content, fallthrough class and dismissing work',
          code: `expect(text('.page-alert .alert-body')).toBe('You have used 9 of your 10 GB.')
expect(classes('.page-alert')).toContain('alert--warning')
await click('.page-alert .alert-dismiss')
expect(exists('.page-alert')).toBe(false)
expect(text('.restored')).toBe('Alert dismissed.')`,
        },
      ],
    },
    {
      id: 'use-theme',
      title: 'useTheme: light, dark and system',
      difficulty: 'intermediate',
      prompt: `
\`App.vue\` and \`tokens.css\` are ready. Implement \`useTheme.js\` so the theme buttons work.

\`useTheme()\` returns \`{ theme, resolvedTheme, setTheme }\` and creates fresh state each time it is called (App calls it once; a bigger app would share it with provide/inject or a store).

- \`theme\` is a ref: \`'light'\`, \`'dark'\` or \`'system'\`. Its initial value is the one saved in \`localStorage\` under the key \`'theme'\` if that value is valid; otherwise \`'system'\`.
- \`setTheme(value)\` ignores invalid values; otherwise updates \`theme\` and saves it to \`localStorage\` (\`'theme'\`).
- \`resolvedTheme\` is a computed that is always \`'light'\` or \`'dark'\`: for \`'system'\` it checks \`window.matchMedia('(prefers-color-scheme: dark)').matches\` (if \`matchMedia\` doesn't exist, use \`'light'\`).

App binds \`data-theme="resolvedTheme"\` on \`.app\` and \`aria-pressed\` on the buttons \`.theme-light\`, \`.theme-dark\`, \`.theme-system\`.
`,
      files: {
        'main.js': themeMain,
        'tokens.css': themeTokens,
        'App.vue': themeApp,
        'useTheme.js': `import { ref, computed } from 'vue'

// TODO: read the saved theme, support "system", persist changes
export function useTheme() {
  const theme = ref('light')
  const resolvedTheme = computed(() => theme.value)

  function setTheme(value) {
    theme.value = value
  }

  return { theme, resolvedTheme, setTheme }
}`,
      },
      hints: [
        'Keep a list of valid values: `const THEMES = [\'light\', \'dark\', \'system\']`, and read the saved value with `localStorage.getItem(\'theme\')`.',
        'In `setTheme`, return early if `!THEMES.includes(value)`; otherwise set the ref and call `localStorage.setItem(\'theme\', value)`.',
        'For `resolvedTheme`: if `theme.value !== \'system\'` return it; otherwise return `window.matchMedia?.(\'(prefers-color-scheme: dark)\').matches ? \'dark\' : \'light\'`.',
      ],
      solution: {
        explanation: 'The composable separates the user\'s **choice** (`theme`, which may be "system") from what is **applied** (`resolvedTheme`, always light or dark). Persisting only valid values keeps bad data out of storage. Bonus for production: listen for `change` on the media query list so "system" follows the OS live, and apply the theme before first paint in SSR apps.',
        files: {
          'main.js': themeMain,
          'tokens.css': themeTokens,
          'App.vue': themeApp,
          'useTheme.js': `import { ref, computed } from 'vue'

const THEMES = ['light', 'dark', 'system']
const STORAGE_KEY = 'theme'

function readSaved() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return THEMES.includes(saved) ? saved : 'system'
  } catch {
    return 'system' // storage can be unavailable (privacy modes)
  }
}

function systemPrefersDark() {
  return typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useTheme() {
  const theme = ref(readSaved())

  const resolvedTheme = computed(() => {
    if (theme.value !== 'system') return theme.value
    return systemPrefersDark() ? 'dark' : 'light'
  })

  function setTheme(value) {
    if (!THEMES.includes(value)) return
    theme.value = value
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* ignore: the theme still applies for this visit */
    }
  }

  return { theme, resolvedTheme, setTheme }
}`,
        },
      },
      tests: [
        {
          name: 'defaults to system and resolves it with prefers-color-scheme',
          code: `const original = window.matchMedia
window.matchMedia = (q) => ({ matches: String(q).includes('dark'), media: q, addEventListener() {}, removeEventListener() {} })
try {
  localStorage.removeItem('theme')
  const t = withSetup(() => requireModule('useTheme.js').useTheme())
  expect(t.theme.value).toBe('system')
  expect(t.resolvedTheme.value).toBe('dark')
} finally {
  window.matchMedia = original
}`,
        },
        {
          name: 'buttons set data-theme and aria-pressed',
          code: `try {
  await click('.theme-dark')
  expect(attr('.app', 'data-theme')).toBe('dark')
  expect(attr('.theme-dark', 'aria-pressed')).toBe('true')
  expect(attr('.theme-light', 'aria-pressed')).toBe('false')
  await click('.theme-light')
  expect(attr('.app', 'data-theme')).toBe('light')
} finally {
  localStorage.removeItem('theme')
}`,
        },
        {
          name: 'persists the choice in localStorage',
          code: `try {
  await click('.theme-dark')
  expect(localStorage.getItem('theme')).toBe('dark')
} finally {
  localStorage.removeItem('theme')
}`,
        },
        {
          name: 'restores a saved choice and ignores invalid ones',
          code: `try {
  localStorage.setItem('theme', 'dark')
  const saved = withSetup(() => requireModule('useTheme.js').useTheme())
  expect(saved.theme.value).toBe('dark')
  expect(saved.resolvedTheme.value).toBe('dark')
  localStorage.setItem('theme', 'neon')
  const invalid = withSetup(() => requireModule('useTheme.js').useTheme())
  expect(invalid.theme.value).toBe('system')
  invalid.setTheme('purple')
  expect(invalid.theme.value).toBe('system')
} finally {
  localStorage.removeItem('theme')
}`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'design-systems-what-is',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between a design system and a component library?',
      answer: 'A component library is a set of reusable UI components. A design system is broader: design tokens, components, usage patterns and guidelines, accessibility standards and documentation — the shared language a team uses to design and build. A component library is usually one part of a design system.',
      explanation: 'Components are the bricks; the design system also includes the colours, sizes, rules and manual.',
      whyAsked: 'Checks that you think beyond "a folder of components" when talking about UI consistency.',
      mistakes: ['Treating the two terms as identical.', 'Forgetting tokens and documentation.', 'Describing it as only a Figma file or only code.'],
      followUps: ['What would you build first for a new product?', 'Who owns a design system in a company?'],
      modelAnswer: 'A component library is the code part — buttons, inputs, dialogs. A design system is the whole shared language: tokens for colour, spacing and type; components built on those tokens; guidelines for how to combine them; accessibility standards; and documentation so designers and developers stay in sync. So a component library is one deliverable of a design system. In practice I\'d start small — tokens and a few base components — and grow it from patterns we actually repeat.',
    },
    {
      id: 'design-systems-token-layers',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Explain primitive, semantic and component tokens. Why not just use the primitives everywhere?',
      answer: 'Primitives are the raw palette and scales (`--blue-600`, `--space-4`). Semantic tokens name a purpose and point at primitives (`--color-action: var(--blue-600)`). Component tokens are per-component knobs fed by semantic tokens (`--btn-bg: var(--color-action)`). Using primitives everywhere hard-codes *which colour* instead of *what for*, so themes and rebrands require editing every component.',
      explanation: 'The semantic layer is the indirection that makes themes and rebrands cheap.',
      code: { lang: 'css', code: `:root { --blue-600: #1d4ed8; --color-action: var(--blue-600); }\n[data-theme='dark'] { --color-action: var(--blue-300); }\n.btn { --btn-bg: var(--color-action); background: var(--btn-bg); }` },
      whyAsked: 'Token architecture is a core design-system skill and reveals understanding of the CSS cascade.',
      mistakes: ['Defining component tokens on `:root` (they then can\'t follow themes).', 'Naming semantic tokens after colours (`--color-blue-button`).', 'Creating tokens for one-off values.'],
      followUps: ['Where should component tokens be declared and why?', 'How would you support multiple brands?'],
      modelAnswer: 'Primitives describe what exists — every blue, every spacing step. Semantic tokens describe purpose — action colour, muted text, raised surface — and point at primitives. Component tokens give a component its own knobs, defaulting to semantic tokens, so variants just re-set them. Components only read semantic or component tokens, so a theme or a brand just re-points the semantic layer. One subtlety: declare component tokens on the component\'s selector, because custom properties resolve `var()` where they\'re declared.',
    },
    {
      id: 'design-systems-choose-library',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your team is starting a Vue 3 admin app with a custom brand. How would you decide between a styled component library, a headless library and building your own components?',
      answer: 'List requirements first (how custom the design is, which complex widgets are needed, accessibility level, SSR, RTL, timeline). Then evaluate candidates on accessibility quality, theming model (can it take our tokens?), Vue 3/SSR compatibility, maintenance, bundle impact, licence and escape hatches — with a small spike on the hardest component. A styled library is fastest if its look is close to the brand; a headless library suits custom designs while still reusing proven behaviour; building in-house fits simple components or very specific needs. Whatever you pick, wrap it behind your own components.',
      explanation: 'Criteria + a spike + a wrapper layer beats choosing by popularity.',
      whyAsked: 'Senior engineers are expected to make and justify tooling decisions.',
      mistakes: ['Choosing by popularity or personal habit.', 'Not testing accessibility of the actual components.', 'Letting the library\'s API spread across every page.'],
      followUps: ['How would you migrate away from a library later?', 'How would you verify accessibility claims?'],
      modelAnswer: 'I\'d start from requirements: how custom the brand is, which complex widgets we need — data tables, date pickers, comboboxes — our accessibility target, SSR and RTL. Then I\'d shortlist options and score them on accessibility, theming model, Vue 3 and SSR support, maintenance activity, bundle impact, licence and how easy it is to go custom. A one-day spike on the hardest widget usually decides it. A styled library wins if its look is close; headless if our design is custom; in-house for simple pieces. In all cases I\'d wrap third-party components in our own `App*` components so the choice stays reversible.',
    },
    {
      id: 'design-systems-attrs-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: '`BaseInput.vue` renders `<div class="field"><label>…</label><input /></div>`. When used as `<BaseInput placeholder="Email" @focus="track" />`, the placeholder appears on the div and `track` never runs on input focus. Why, and how do you fix it?',
      answer: 'Undeclared attributes and listeners fall through to the **root** element — the wrapper div — so `placeholder` lands on the div and the `focus` listener is attached to the div (which never receives focus). Fix: `defineOptions({ inheritAttrs: false })` (Vue 3.3+) and bind `v-bind="$attrs"` on the `<input>`. If the wrapper should still receive `class`/`style`, split them out of `$attrs` manually.',
      explanation: 'Fallthrough is root-only by default; for wrapped native inputs you redirect it.',
      code: {
        lang: 'vue',
        code: `<script setup>
defineOptions({ inheritAttrs: false })
const model = defineModel()
</script>

<template>
  <div class="field">
    <label><slot /></label>
    <input v-model="model" v-bind="$attrs" />
  </div>
</template>`,
      },
      whyAsked: 'Base form components hit this constantly; it tests real knowledge of `$attrs`.',
      mistakes: ['Re-declaring every native attribute as a prop.', 'Moving the input to the root and losing the label wrapper.', 'Not knowing `inheritAttrs`.'],
      followUps: ['What happens to `class` and `style` with `inheritAttrs: false`?', 'How would you associate the label and input (ids)?'],
      modelAnswer: 'Attributes and listeners the component doesn\'t declare fall through to its root element — here the wrapper div — so the placeholder and the focus listener end up there. For wrapper components around a native input, I turn off automatic inheritance with `defineOptions({ inheritAttrs: false })` and bind `v-bind="$attrs"` on the input. Then `placeholder`, `autocomplete`, `aria-*` and listeners all reach the input. With inheritance off, `class` and `style` are in `$attrs` too, so if the wrapper should keep them I\'d split them out.',
    },
    {
      id: 'design-systems-theming-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design dark mode and multi-brand theming for a large Vue app that is also server-rendered. What are the moving parts?',
      answer: 'Tokens in three layers; themes and brands are sets of semantic token values under attribute selectors (`[data-theme="dark"]`, `[data-brand="acme"]`), combinable. A composable/store holds the user\'s choice (light/dark/system) separately from the resolved theme; "system" follows `prefers-color-scheme` with a change listener. The choice is persisted (cookie if the server must render the right theme; localStorage otherwise) and applied before first paint to avoid a flash — via the server reading the cookie or a tiny inline script setting the attribute on `<html>`. Set `color-scheme` so native controls match. Every theme is checked for WCAG AA contrast, and visual regression tests cover each theme.',
      explanation: 'Separate choice from resolution, apply early, keep themes as data, test every theme.',
      whyAsked: 'A realistic architecture problem that touches CSS, state, SSR and accessibility together.',
      mistakes: ['Toggling a class on every component instead of swapping tokens.', 'Forgetting the flash of the wrong theme in SSR.', 'Only checking contrast in the light theme.'],
      followUps: ['Why would you store the choice in a cookie rather than localStorage?', 'How do you handle third-party components in dark mode?'],
      modelAnswer: 'I\'d model themes as data: primitives once, then semantic token sets per theme and per brand under attribute selectors on `<html>`, so they combine. A `useTheme` composable keeps the user\'s choice — light, dark or system — separate from the resolved value, and listens to `prefers-color-scheme` for system. Because the app is server-rendered, I\'d persist the choice in a cookie so the server can render the right attribute, or else run a tiny inline script before paint; otherwise users see a flash. I\'d set `color-scheme` for native controls, theme third-party components through their variables, and check contrast plus visual regressions for every theme.',
    },
    {
      id: 'design-systems-library-vs-inhouse',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare wrapping a third-party component library behind your own components versus using the library\'s components directly in feature code.',
      answer: 'Direct use is faster at first and has no indirection, but spreads the library\'s API, naming and quirks through the codebase — upgrades, theming changes or replacing the library then touch every feature. Wrapping costs a thin layer per component but gives one stable app-level API, one place to apply tokens, accessibility fixes and defaults, and makes migrations local. Wrap the components you use widely; don\'t wrap trivially for its own sake.',
      explanation: 'A wrapper is a seam: it localises change.',
      whyAsked: 'Tests understanding of coupling and long-term maintenance, not just component syntax.',
      mistakes: ['Wrapping every component with a 1:1 pass-through that adds nothing.', 'Never wrapping, then facing a huge migration.', 'Leaking library-specific props through the wrapper anyway.'],
      followUps: ['How do you keep a wrapper from becoming a leaky pass-through?', 'How would you migrate one wrapped component to another library?'],
      modelAnswer: 'Using the library directly is quickest and fine for prototypes, but its API and quirks end up in every feature, so an upgrade or a switch is a codebase-wide change. Wrapping widely used components — buttons, inputs, dialogs, date pickers — gives us a stable API we design, a single place to apply tokens, defaults and accessibility fixes, and makes migration a per-wrapper job. The cost is a thin layer to maintain. I avoid pure pass-through wrappers; a wrapper should encode our decisions.',
    },
    {
      id: 'design-systems-base-cluster',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `BaseCluster.vue`, a layout component that lays children out in a wrapping row. Props: `gap` (`sm`/`md`/`lg` → `var(--space-2)`/`var(--space-4)`/`var(--space-6)`, default `md`, unknown → `md`), `justify` (`start`/`center`/`end`/`between` → `flex-start`/`center`/`flex-end`/`space-between`, default `start`), `as` (element tag, default `div`). The root has class `cluster` and the custom properties `--cluster-gap` and `--cluster-justify`, which the scoped CSS uses.',
      starter: { files: { 'App.vue': clusterApp, 'BaseCluster.vue': clusterStarter } },
      tests: [
        {
          name: 'renders as the given element with class cluster',
          code: `const c = mountFile('BaseCluster.vue', { as: 'ul' })
const root = c.el.firstElementChild
expect(root.tagName).toBe('UL')
expect([...root.classList]).toContain('cluster')`,
        },
        {
          name: 'maps gap and justify to custom properties',
          code: `const c = mountFile('BaseCluster.vue', { gap: 'lg', justify: 'between' })
const s = c.el.firstElementChild.style
expect(s.getPropertyValue('--cluster-gap').trim()).toBe('var(--space-6)')
expect(s.getPropertyValue('--cluster-justify').trim()).toBe('space-between')`,
        },
        {
          name: 'defaults: div, md gap, flex-start; unknown gap falls back to md',
          code: `const d = mountFile('BaseCluster.vue', {})
const root = d.el.firstElementChild
expect(root.tagName).toBe('DIV')
expect(root.style.getPropertyValue('--cluster-gap').trim()).toBe('var(--space-4)')
expect(root.style.getPropertyValue('--cluster-justify').trim()).toBe('flex-start')
const odd = mountFile('BaseCluster.vue', { gap: 'huge' })
expect(odd.el.firstElementChild.style.getPropertyValue('--cluster-gap').trim()).toBe('var(--space-4)')`,
        },
        {
          name: 'in App: slot content and fallthrough attributes reach the root',
          code: `const root = find('[data-test="tags"]')
expect(root.tagName).toBe('UL')
expect(findAll('[data-test="tags"] > li')).toHaveLength(3)
expect(root.style.getPropertyValue('--cluster-gap').trim()).toBe('var(--space-2)')`,
        },
      ],
      hints: ['Two maps (`gapToken`, `justifyValue`) and one computed style object.', 'Render `<component :is="as" class="cluster" :style="style"><slot /></component>` and use `gap: var(--cluster-gap)` and `justify-content: var(--cluster-justify)` in CSS.'],
      answer: 'Map the named options to token values in a computed style object and render `<component :is="as">` with the slot. CSS reads the custom properties.',
      solution: {
        files: {
          'App.vue': clusterApp,
          'BaseCluster.vue': `<script setup>
import { computed } from 'vue'

const props = defineProps({
  gap: { type: String, default: 'md' },
  justify: { type: String, default: 'start' },
  as: { type: String, default: 'div' },
})

const gapToken = { sm: 'var(--space-2)', md: 'var(--space-4)', lg: 'var(--space-6)' }
const justifyValue = { start: 'flex-start', center: 'center', end: 'flex-end', between: 'space-between' }

const style = computed(() => ({
  '--cluster-gap': gapToken[props.gap] ?? gapToken.md,
  '--cluster-justify': justifyValue[props.justify] ?? justifyValue.start,
}))
</script>

<template>
  <component :is="as" class="cluster" :style="style">
    <slot />
  </component>
</template>

<style scoped>
.cluster {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--cluster-gap);
  justify-content: var(--cluster-justify);
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>`,
        },
      },
      explanation: 'Named options keep layouts on the token scale; custom properties keep the CSS static; `<component :is>` keeps markup semantic (a list of tags can really be a `<ul>`).',
      whyAsked: 'Layout primitives are a staple of design systems; this checks dynamic components, style bindings and API design together.',
      mistakes: ['Accepting raw pixel values, which defeats the spacing scale.', 'Always rendering a `div`, forcing non-semantic markup.', 'Hard-coding margins on children instead of using `gap`.'],
      followUps: ['How would you build a responsive Grid component?', 'Should layout components accept raw CSS values as an escape hatch?'],
      modelAnswer: 'I\'d accept only named options and map them to tokens — gap to spacing tokens, justify to flex values — in a computed style object of custom properties, with fallbacks for unknown values. The root is `<component :is="as">` so a group of tags can be a real `<ul>`, and the slot renders the children. CSS uses `gap` and `justify-content` from the custom properties, so the stylesheet stays static and fallthrough attributes like `data-test` land on the root.',
    },
  ],

  takeaways: [
    'A design system = tokens + components + patterns + documentation; a component library is one part of it.',
    'Layer tokens: primitives → semantic (named by purpose) → component tokens; components never read primitives.',
    'Themes and brands re-point semantic tokens; declare component tokens on the component so they follow the theme.',
    'Base components expose small validated APIs, sensible defaults and built-in accessibility; fallthrough attributes handle `class`, `aria-*` and listeners.',
    'Layout components own spacing and arrangement; reusable components avoid outer margins.',
    'Choose libraries by criteria (accessibility, theming, compatibility, maintenance, bundle, licence) and wrap them behind your own components.',
  ],
}
