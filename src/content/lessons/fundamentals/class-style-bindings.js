// Lesson: Class & style bindings

const boardApp = `<script setup>
import { ref, computed } from 'vue'

const tasks = ref([
  { id: 1, title: 'Design the logo', done: true, priority: 'low' },
  { id: 2, title: 'Write the landing page', done: false, priority: 'high' },
  { id: 3, title: 'Set up analytics', done: false, priority: 'medium' },
])
const compact = ref(false)

const progress = computed(() => {
  const done = tasks.value.filter((t) => t.done).length
  return Math.round((done / tasks.value.length) * 100)
})
</script>

<template>
  <section class="board" :class="{ compact }">
    <button class="toggle-compact" @click="compact = !compact">Compact view</button>

    <div class="progress">
      <div class="bar" :style="{ width: progress + '%' }"></div>
    </div>
    <p class="label">{{ progress }}% done</p>

    <ul>
      <li v-for="task in tasks" :key="task.id">
        <button class="task" :class="{ done: task.done }" @click="task.done = !task.done">
          {{ task.title }}
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.board { font-family: system-ui, sans-serif; }
.compact .task { padding: 2px 6px; }
.progress { background: #eee; height: 10px; border-radius: 5px; overflow: hidden; }
.bar { background: #0f7a3d; height: 100%; transition: width 0.3s; }
ul { list-style: none; padding: 0; }
.task { display: block; width: 100%; text-align: left; padding: 8px 12px; border: 2px solid #222; margin: 4px 0; background: white; cursor: pointer; }
.done { text-decoration: line-through; opacity: 0.6; }
.priority-high { border-color: crimson; }
.priority-medium { border-color: orange; }
.priority-low { border-color: #888; }
.all-done .label { font-weight: 700; }
</style>`

export default {
  id: 'class-style-bindings',
  title: 'Class & style bindings',
  summary: ':class and :style accept objects and arrays, so you can switch CSS classes and inline styles on and off from state without building strings.',
  difficulty: 'beginner',
  minutes: 22,
  prerequisites: ['v-bind'],
  related: ['styling-in-vue', 'responsive-dynamic-styles', 'fallthrough-attrs', 'single-file-components', 'design-systems'],
  tags: [':class', ':style', 'class binding', 'style binding', 'object syntax', 'array syntax', 'dynamic classes', 'css variables', 'inline styles'],
  apis: [
    { name: ':class="{ name: condition }"', summary: 'Object syntax: each key is a class name, added when its value is truthy.' },
    { name: ':class="[a, b]"', summary: 'Array syntax: applies a list of classes (items may be strings or objects).' },
    { name: ':style="{ prop: value }"', summary: 'Object syntax for inline styles; camelCase or quoted kebab-case keys.' },
    { name: ':style="[base, overrides]"', summary: 'Array syntax: merges several style objects.' },
  ],
  docs: [
    { label: 'Vue Guide — Class and Style Bindings', url: 'https://vuejs.org/guide/essentials/class-and-style.html' },
    { label: 'Vue Guide — Security: Style Injection', url: 'https://vuejs.org/guide/best-practices/security.html#style-injection' },
  ],

  intro: `
Styling often depends on state: a tab is **active**, a task is **done**, a field has an **error**, a progress bar is **73%** wide. \`class\` and \`style\` are attributes, so you could bind them with \`v-bind\` and glue strings together — but that gets messy fast.

So Vue gives \`:class\` and \`:style\` extra powers: they accept **objects** and **arrays**.

\`\`\`vue
<button class="task" :class="{ done: task.done }">…</button>
<div class="bar" :style="{ width: progress + '%' }"></div>
\`\`\`

Read the first line as *"always \`task\`; add \`done\` when \`task.done\` is true"*.
`,

  why: `
Without object syntax, conditional classes turn into string surgery:

\`\`\`js
el.className = 'task' + (task.done ? ' done' : '') + (task.priority === 'high' ? ' urgent' : '')
\`\`\`

One missing space and two classes melt into one. With plain DOM code you'd call \`classList.toggle\` for each class, after every state change, and update \`element.style.width\` by hand.

\`:class\` and \`:style\` let you describe the rule — *"\`done\` when the task is done"*, *"width equals the progress"* — and Vue adds, removes and merges classes and style properties for you, keeping any static \`class\` you wrote.
`,

  eli15: `
Think of getting dressed with a checklist:

- raincoat → only if it's raining
- sunglasses → only if it's sunny
- school uniform → always

\`:class="{ raincoat: isRaining, sunglasses: isSunny }"\` is that checklist. Each class name has a yes/no next to it; Vue puts on exactly the ones marked "yes", and the static \`class="uniform"\` is always worn.

\`:style\` is for things you can't pick from a wardrobe because they're a measurement — like "a scarf exactly 73 cm long": \`:style="{ width: progress + '%' }"\`.
`,

  analogy: {
    title: 'A sticker checklist',
    body: `
Your CSS file is a sheet of stickers, each with a name (\`.done\`, \`.active\`, \`.error\`). An element can wear several stickers at once.

Object syntax is a checklist next to the sheet: a tick decides whether each sticker goes on. Array syntax is a list of sticker names to apply. Inline styles are hand-painting — fine for one-off measurements, but stickers are reusable and easier to change.
`,
    mapping: [
      ['a sticker', 'a CSS class (`.done`)'],
      ['the tick boxes', 'object syntax: `{ done: task.done }`'],
      ['a list of sticker names', 'array syntax: `[sizeClass, themeClass]`'],
      ['the sticker that is always on', 'the static `class="task"`'],
      ['hand-painting a measurement', '`:style="{ width: pct + \'%\' }"`'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'class' },
    title: 'Class bindings in the real DOM',
    caption: 'Flip the conditions and watch the element\'s `class` attribute change. The static class always stays; dynamic classes join and leave.',
    alt: 'An interactive lab with toggles for several conditions. The template uses a static class plus an object-syntax :class; the live DOM panel shows the resulting class attribute updating as classes are added and removed.',
  },

  syntax: [
    `
#### :class — object syntax
`,
    {
      code: `<div :class="{ active: isActive, 'text-danger': hasError }"></div>
<!-- isActive = true, hasError = false  →  <div class="active"></div> -->

<!-- static and dynamic classes merge -->
<div class="tab" :class="{ active: isActive }"></div>
<!--  →  <div class="tab active"></div> -->

<!-- shorthand: a key with the same name as the variable -->
<section :class="{ compact }"></section>   <!-- same as { compact: compact } -->`,
      lang: 'vue',
      title: 'object syntax',
    },
    `
Each **key** is a class name, each **value** a condition. Class names with dashes must be quoted (\`'text-danger'\`), because \`text-danger\` alone would be read as subtraction.

The object doesn't have to be inline — a computed property keeps templates tidy:
`,
    {
      code: `<script setup>
const classes = computed(() => ({
  'btn-primary': variant.value === 'primary',
  'btn-loading': isLoading.value,
  'btn-disabled': disabled.value,
}))
</script>

<template>
  <button class="btn" :class="classes">Save</button>
</template>`,
      lang: 'vue',
      title: 'a computed class object',
    },
    `
#### :class — array syntax
`,
    {
      code: `<div :class="[sizeClass, themeClass]"></div>
<!-- sizeClass = 'btn-lg', themeClass = 'dark'  →  class="btn-lg dark" -->

<div :class="[isActive ? 'active' : '', errorClass]"></div>

<!-- objects inside arrays -->
<div :class="[{ active: isActive }, errorClass]"></div>`,
      lang: 'vue',
      title: 'array syntax',
    },
    `
Arrays are handy when class names come *from data* (\`'priority-' + task.priority\`), objects when you switch *known* classes on and off. A plain string (\`:class="themeClass"\`) works too.

**On components**, a \`class\` you pass to a component is added to its root element and merged with the root's own classes. If the component has several root elements, it must decide where the class goes with \`$attrs\` — see [Fallthrough attributes](lesson:fallthrough-attrs).

#### :style — object syntax
`,
    {
      code: `<div :style="{ color: textColor, fontSize: size + 'px' }"></div>
<div :style="{ 'font-size': size + 'px' }"></div>   <!-- quoted kebab-case also works -->

<!-- arrays merge several style objects (later ones win) -->
<div :style="[baseStyles, highlightStyles]"></div>

<!-- CSS custom properties -->
<div :style="{ '--progress': progress + '%' }"></div>`,
      lang: 'vue',
      title: 'style bindings',
    },
    `
- Keys are CSS properties in **camelCase** (\`fontSize\`) or quoted kebab-case (\`'font-size'\`).
- **Vue does not add units.** \`fontSize: 20\` is invalid CSS and the browser ignores it — write \`size + 'px'\`.
- A static \`style="…"\` and \`:style\` are merged, just like classes.
- If a property needs a vendor prefix in the current browser, Vue adds it automatically. You can also pass an array of fallback values: \`{ display: ['-webkit-box', 'flex'] }\` renders the last one the browser supports.
`,
    {
      callout: 'tip',
      title: 'Classes first, styles for measurements',
      text: 'Prefer toggling classes: they are reusable, support `:hover` and media queries, and keep design decisions in CSS. Use `:style` for values that are truly dynamic — a width percentage, a position, a user-chosen colour (ideally as a CSS variable). Inside `<style>`, Vue also supports `v-bind()` for reactive CSS values — see [Styling in Vue](lesson:styling-in-vue).',
    },
    {
      callout: 'warn',
      title: 'User-provided styles',
      text: 'Never bind a style object (or style string) supplied by users. Arbitrary CSS can overlay invisible elements on your page (clickjacking). If users may pick a colour, bind only that property: `:style="{ color: userColor }"`, and validate the value.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: boardApp,
    intro: 'A task board with three bindings: a class object on the board, a style object on the progress bar, and a class object per task.',
    steps: [
      { lines: [4, 9], text: 'Each task has a `done` flag and a `priority`. `compact` switches the board\'s density.' },
      { lines: [11, 14], text: 'A computed percentage of finished tasks — it will drive the bar\'s width.' },
      { lines: [18], text: '`class="board"` is static; `:class="{ compact }"` is the shorthand for `{ compact: compact }`. When `compact` is true, the element has `class="board compact"`.' },
      { lines: [22, 24], text: '`:style="{ width: progress + \'%\' }"` sets an inline width. Note the explicit `\'%\'` — Vue never guesses units.' },
      { lines: [28, 30], text: 'Each task button keeps its static `task` class and gains `done` when `task.done` is true. Clicking toggles the flag; the class (and the progress bar) follow.' },
      { lines: [36, 48], text: 'Plain scoped CSS. The bindings only decide *which* classes apply; *what they look like* stays in the stylesheet. The `priority-*` and `all-done` rules are waiting for the experiments.' },
    ],
  },

  playground: {
    title: 'Task board',
    objective: 'Add array, computed-object and style bindings, then inspect how classes merge in the DOM.',
    files: { 'App.vue': boardApp },
    expected: 'Three tasks; the first is crossed out and the bar is a third full (33%). Click tasks to toggle them and watch the bar grow. **Compact view** toggles a class on the whole board.',
    experiments: [
      {
        id: 'priority',
        task: 'Give each task button a border colour by priority. The CSS classes `priority-high`, `priority-medium` and `priority-low` already exist — add the right one with **array syntax**, keeping the `done` toggle.',
        hint: '`:class="[{ done: task.done }, \'priority-\' + task.priority]"`',
        tests: [
          {
            name: 'tasks get done + priority classes',
            code: `const buttons = findAll('.task')
expect(classes(buttons[0])).toContain('done')
expect(classes(buttons[0])).toContain('priority-low')
expect(classes(buttons[1])).toContain('priority-high')
expect(classes(buttons[1])).not.toContain('done')
expect(classes(buttons[1])).toContain('task')`,
          },
        ],
        explain: 'Array syntax combines a class name computed from data (`\'priority-\' + task.priority`) with an object for the on/off class. The static `task` class still merges in.',
      },
      {
        id: 'bar-color',
        task: 'Make the bar **crimson** while progress is below 50% and **seagreen** from 50% up, by adding a `backgroundColor` to the bar\'s style object.',
        hint: '`:style="{ width: progress + \'%\', backgroundColor: progress < 50 ? \'crimson\' : \'seagreen\' }"`',
        tests: [
          {
            name: 'the bar colour follows the progress',
            code: `expect(find('.bar').style.backgroundColor).toBe('crimson')
await click(findAll('.task')[1])
expect(find('.bar').style.width).toBe('67%')
expect(find('.bar').style.backgroundColor).toBe('seagreen')`,
          },
        ],
        explain: 'Inline styles win over the stylesheet\'s `.bar` background. That is fine for a value computed from data — but if you only need two looks, toggling a class (`bar-low`) would keep colours in CSS.',
      },
      {
        id: 'all-done',
        task: 'Replace the board\'s inline object with a computed `boardClasses` that returns `{ compact: compact.value, \'all-done\': progress.value === 100 }`, and bind `:class="boardClasses"`.',
        hint: '`const boardClasses = computed(() => ({ compact: compact.value, \'all-done\': progress.value === 100 }))` — remember the quotes around `all-done`.',
        tests: [
          {
            name: 'the board gets all-done when every task is finished',
            code: `expect(classes('.board')).not.toContain('all-done')
const buttons = findAll('.task')
await click(buttons[1])
await click(buttons[2])
expect(classes('.board')).toContain('all-done')
await click('.toggle-compact')
expect(classes('.board')).toContain('compact')
expect(classes('.board')).toContain('board')`,
          },
        ],
        explain: 'A computed class object keeps the template readable and gives the rule a name. It recalculates only when `compact` or `progress` change.',
      },
      {
        id: 'inspect',
        task: 'Inspect the board in your browser\'s dev tools and click **Compact view** a few times. Then inspect the bar while toggling tasks.',
        hint: 'Watch the `class` attribute of `<section>` and the `style` attribute of `.bar`.',
        explain: 'The `class` attribute always contains `board` and gains or loses `compact`; Vue merged the static and dynamic parts into one string. On the bar, only the `width` value inside `style` changes.',
      },
    ],
  },

  animation: {
    type: 'directive-lab',
    props: { directive: 'style' },
    title: 'Style bindings in the real DOM',
    caption: 'Change the values and watch individual properties inside the `style` attribute update. Try a number without a unit and see the browser ignore it.',
    alt: 'An interactive lab with sliders and inputs feeding a :style object. The live DOM panel shows the element\'s style attribute, highlighting each property as it changes and showing that unitless lengths are dropped.',
  },

  internals: {
    beginner: `
Whatever you give \`:class\` — an object, an array, a string — Vue turns it into one plain class string, adds your static classes, and puts the result on the element. For \`:style\`, Vue compares the new style object with the old one and only sets the properties that changed.
`,
    technical: [
      `
The compiler merges static and dynamic values at compile time: \`class="task" :class="{ done }"\` becomes \`class: normalizeClass(['task', { done: task.done }])\` with a \`CLASS\` patch flag, so updates only look at the class.

- **\`normalizeClass\`** flattens strings, arrays (recursively) and objects (keys with truthy values) into a single space-separated string. The renderer then sets \`el.className\`.
- **\`normalizeStyle\`** merges arrays of style objects (later wins) and parses style strings into objects. \`patchStyle\` diffs the old and new objects: removed properties are cleared, changed ones are set. Keys starting with \`--\` go through \`style.setProperty()\`, values ending in \`!important\` are set with the important flag, and other keys are resolved to a supported (possibly vendor-prefixed) property name, cached per property.
`,
      {
        code: `// A simplified model of normalizeClass — not Vue's real source
function normalizeClass(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(normalizeClass).filter(Boolean).join(' ')
  if (value && typeof value === 'object') {
    return Object.keys(value).filter((name) => value[name]).join(' ')
  }
  return ''
}

normalizeClass(['task', { done: true, urgent: false }, 'priority-high'])
// → 'task done priority-high'`,
        lang: 'js',
        title: 'mental model of class normalisation',
      },
      `
When a component receives a \`class\` from its parent, Vue merges it into the root element's own class with the same normalisation, which is why both sets of classes end up on the element.
`,
    ],
    production: `
- **Variant maps over ternary chains.** For components with many variants, map props to classes in one computed (\`{ primary: 'btn-primary', danger: 'btn-danger' }[variant]\`) — easy to read and test.
- **Utility-CSS tools** (such as Tailwind) find class names by scanning your source files. Classes assembled from fragments (\`'text-' + color + '-500'\`) can't be found and get dropped from the production CSS. Write complete class names, e.g. in a lookup object.
- **Theming:** set CSS custom properties once (\`:style="{ '--brand': brandColor }"\` on a root element, or \`v-bind()\` in \`<style>\`) and use \`var(--brand)\` everywhere, instead of inline-styling every element.
- **Inline styles have the highest specificity** (short of \`!important\`) and can't express \`:hover\`, \`::before\` or media queries — another reason to prefer classes.
- **Security:** never bind user-provided style objects or strings; whitelist individual properties.
- **Transitions** add and remove their own classes (\`v-enter-active\`…) alongside yours — see [Transitions](lesson:transitions).
`,
  },

  mistakes: [
    {
      title: 'Forgetting quotes around dashed class names',
      wrong: { code: `<p :class="{ text-danger: hasError }">…</p>  <!-- compile error -->`, lang: 'vue' },
      right: { code: `<p :class="{ 'text-danger': hasError }">…</p>`, lang: 'vue' },
      explanation: 'Inside the object, `text-danger` is parsed as `text - danger` (a subtraction), which is not a valid key. Quote any class name containing a dash.',
    },
    {
      title: 'Leaving out CSS units',
      wrong: { code: `<div :style="{ width: progress }"></div>   <!-- width: 40 → ignored -->`, lang: 'vue' },
      right: { code: `<div :style="{ width: progress + '%' }"></div>`, lang: 'vue' },
      explanation: 'Vue passes values through as-is and does not add `px`. Unitless lengths (except 0) are invalid CSS, so the browser drops them.',
    },
    {
      title: 'Building class strings by hand',
      wrong: { code: `<li :class="'item' + (selected ? ' selected' : '') + (disabled ? 'disabled' : '')">`, lang: 'vue' },
      right: { code: `<li class="item" :class="{ selected, disabled }">`, lang: 'vue' },
      explanation: 'The wrong version even has a bug: a missing space produces `selecteddisabled`. Object syntax handles spacing, merging and readability for you.',
    },
    {
      title: 'Using inline styles for states that belong in CSS',
      wrong: { code: `<button :style="{ background: isActive ? '#222' : 'white', color: isActive ? 'white' : '#222' }">`, lang: 'vue' },
      right: { code: `<button :class="{ active: isActive }">\n\n<style scoped>\n.active { background: #222; color: white; }\n</style>`, lang: 'vue' },
      explanation: 'Fixed visual states are design decisions — keep them in CSS where they can use `:hover`, transitions, media queries and themes. Reserve `:style` for values computed from data.',
    },
  ],

  debugging: [
    {
      symptom: 'Compile error ("Unexpected token" / "Error parsing JavaScript expression") on a `:class` line.',
      cause: 'An unquoted class name with a dash in object syntax, or missing braces.',
      fix: 'Quote dashed names: `{ \'is-open\': open }`, and wrap objects in `{ }`.',
    },
    {
      symptom: 'A style binding seems to do nothing.',
      cause: 'A missing unit (`width: 40`), a misspelled property, or an unquoted kebab-case key.',
      fix: 'Add units (`40 + \'px\'`), use camelCase (`fontSize`) or quote kebab-case (`\'font-size\'`), and check the element\'s `style` attribute in dev tools.',
    },
    {
      symptom: 'A class is always applied, even when the condition is "false".',
      cause: 'The value is a non-empty string such as `\'false\'` (truthy), not the boolean `false`.',
      fix: 'Make sure the condition is a real boolean (e.g. bind props with `:` so `false` is not a string).',
    },
    {
      symptom: 'A class passed to a child component doesn\'t show up.',
      cause: 'The child has multiple root elements or sets `inheritAttrs: false`, so it doesn\'t automatically receive `class`.',
      fix: 'In the child, bind `:class="$attrs.class"` (or `v-bind="$attrs"`) on the intended element.',
    },
    {
      symptom: 'Classes work in development but are missing styles in the production build (utility CSS).',
      cause: 'Class names were built from fragments, so the CSS tool\'s source scanner never saw them.',
      fix: 'Use complete class names, for example in a lookup object.',
    },
  ],

  bestPractices: [
    'Keep a static `class` for the base look and add state classes with object syntax.',
    'Quote dashed class names; use the `{ compact }` shorthand when the class and variable share a name.',
    'Move non-trivial class logic into a computed property.',
    'Prefer classes for visual states; use `:style` for data-driven measurements and CSS variables.',
    'Always include units in style values.',
    'Never bind user-supplied style objects or strings.',
  ],

  useCases: [
    'Active tabs and navigation links (`{ active: tab === current }`).',
    'Done / selected / disabled list items.',
    'Form validation states (`{ \'has-error\': errors.email }`).',
    'Progress bars, meters and sliders (`:style="{ width: pct + \'%\' }"`).',
    'User-chosen themes via CSS variables (`:style="{ \'--accent\': accent }"`).',
  ],

  whenToUse: {
    use: [
      '`:class` object syntax to switch known classes on and off.',
      '`:class` array syntax when class names come from data or props.',
      '`:style` for values you can\'t know in advance: sizes, positions, percentages, colours.',
    ],
    avoid: [
      'Inline styles for fixed states (active, hover, error) — use classes.',
      'Concatenating class strings by hand.',
      'Binding style objects that come from users or APIs.',
    ],
  },

  comparison: {
    title: 'Ways to style from state',
    headers: ['', '`:class` object', '`:class` array', 'String building', '`:style` object'],
    rows: [
      ['Best for', 'toggling known classes', 'class names from data', 'nothing — avoid', 'truly dynamic values'],
      ['Readability', 'high', 'high', 'low (spaces, ternaries)', 'medium'],
      ['Merges with static attribute', 'yes (with `class`)', 'yes (with `class`)', 'yes', 'yes (with `style`)'],
      [':hover, media queries, themes', 'yes — it\'s CSS', 'yes — it\'s CSS', 'yes, but fragile', 'no — inline styles can\'t express them'],
    ],
    note: 'More styling techniques — scoped CSS, CSS modules, `v-bind()` in CSS — in [Styling in Vue](lesson:styling-in-vue).',
  },

  quiz: [
    {
      id: 'class-style-bindings-q1',
      type: 'mcq',
      prompt: 'What does `:class="{ active: isActive }"` do?',
      options: [
        { text: 'Adds the class `active` when `isActive` is truthy, and removes it otherwise.' },
        { text: 'Sets the class to the value of `isActive` (e.g. "true").', why: 'In object syntax the key is the class name; the value is only the condition.' },
        { text: 'Adds a class called `isActive`.', why: 'The value is a condition, not a class name.' },
        { text: 'Removes every other class from the element.', why: 'Dynamic classes merge with static ones; nothing else is removed.' },
      ],
      answer: 0,
      explanation: 'Object syntax: `{ className: condition }`.',
    },
    {
      id: 'class-style-bindings-q2',
      type: 'output',
      prompt: 'What `class` attribute does this render?',
      code: { lang: 'vue', code: `<button class="btn" :class="['btn-lg', { disabled: false, primary: true }]">Save</button>` },
      options: [
        { text: '`class="btn btn-lg primary"`' },
        { text: '`class="btn-lg primary"`', why: 'The static `btn` class is merged in, not replaced.' },
        { text: '`class="btn btn-lg disabled primary"`', why: '`disabled` is false, so it is left out.' },
        { text: '`class="btn [object Object]"`', why: 'Vue normalises objects inside arrays into class names.' },
      ],
      answer: 0,
      explanation: 'Static `btn` + `btn-lg` from the array + only the truthy keys of the object (`primary`).',
    },
    {
      id: 'class-style-bindings-q3',
      type: 'bug',
      prompt: 'This component fails to compile. Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const email = ref('')
const hasError = ref(true)
</script>

<template>
  <input v-model="email" class="field" :class="{ field-error: hasError }" />
  <p v-if="hasError">Please enter a valid email.</p>
</template>`,
      },
      answerLine: 8,
      explanation: '`field-error` contains a dash, so it must be quoted: `{ \'field-error\': hasError }`. Unquoted, it is parsed as `field - error`.',
    },
    {
      id: 'class-style-bindings-q4',
      type: 'fill',
      prompt: 'Add the class `selected` when `isSelected` is true, and set the font size from `size` (a number of pixels).',
      code: { lang: 'vue', code: `<button :class="{ ___: isSelected }" :style="{ fontSize: size + ___ }">Pick</button>` },
      answer: [['selected', "'selected'", '"selected"'], ["'px'", '"px"']],
      explanation: 'The object key is the class name. Style values need explicit units — Vue does not add `px`.',
    },
    {
      id: 'class-style-bindings-q5',
      type: 'mcq',
      prompt: 'With `const size = ref(20)`, what happens with `<p :style="{ fontSize: size }">`?',
      options: [
        { text: 'The font size is not applied: Vue doesn\'t add units, and a unitless font-size is invalid CSS.' },
        { text: 'Vue adds `px` automatically, so it is 20px.', why: 'Vue passes values through unchanged; it never appends units.' },
        { text: 'Vue throws an error.', why: 'No error — the browser simply ignores the invalid value.' },
        { text: 'The font size becomes 20em.', why: 'No unit is guessed at all.' },
      ],
      answer: 0,
      explanation: 'Write `size + \'px\'` (or use a CSS variable with units in the stylesheet).',
    },
    {
      id: 'class-style-bindings-q6',
      type: 'mcq',
      prompt: 'Select **all** valid `:class` bindings.',
      options: [
        { text: '`:class="{ open: isOpen }"`' },
        { text: '`:class="[sizeClass, { open: isOpen }]"`' },
        { text: '`:class="themeClass"` (a string variable)' },
        { text: '`:class="open: isOpen"`', why: 'Without braces this is not a valid JavaScript expression.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Objects, arrays (which may contain objects) and strings are all accepted.',
    },
    {
      id: 'class-style-bindings-q7',
      type: 'short',
      prompt: 'When would you use `:style` instead of `:class`?',
      answer: 'Use `:class` for predefined visual states (active, done, error) so the look stays in CSS, where it can use hover, media queries and themes. Use `:style` when the value can\'t be known in advance and comes from data — a progress width, a drag position, a user-chosen colour — ideally by setting a CSS variable that the stylesheet consumes.',
    },
  ],

  exercises: [
    {
      id: 'tab-bar',
      title: 'An accessible tab bar',
      difficulty: 'beginner',
      prompt: `
Render a tab button for each name in \`tabs\` and track the current tab in \`current\`:

- Every button has the static class \`tab\`; the current one also gets \`active\`.
- The current button has \`aria-selected="true"\`, the others \`aria-selected="false"\`.
- Clicking a tab makes it current. \`.panel\` shows the current tab's name.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const tabs = ['Profile', 'Security', 'Billing']
const current = ref('Profile')
</script>

<template>
  <div class="tabs" role="tablist">
    <button class="tab" role="tab">Tab</button>
  </div>
  <section class="panel">Panel</section>
</template>

<style scoped>
.tab { border: 2px solid #222; background: white; padding: 0.4rem 0.8rem; }
.active { background: #222; color: white; }
</style>`,
      },
      hints: [
        'Loop: `<button v-for="tab in tabs" :key="tab" class="tab" role="tab">{{ tab }}</button>`.',
        'Add `:class="{ active: tab === current }"` and `:aria-selected="tab === current"` (Vue 3 writes `false` as "false" for ARIA).',
        'Click handler: `@click="current = tab"`; panel: `{{ current }}`.',
      ],
      solution: {
        explanation: 'One piece of state (`current`) drives the class, the ARIA attribute and the panel, so they always agree. The static `tab` class merges with the dynamic `active` class.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const tabs = ['Profile', 'Security', 'Billing']
const current = ref('Profile')
</script>

<template>
  <div class="tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab"
      class="tab"
      role="tab"
      :class="{ active: tab === current }"
      :aria-selected="tab === current"
      @click="current = tab"
    >
      {{ tab }}
    </button>
  </div>
  <section class="panel">{{ current }}</section>
</template>

<style scoped>
.tab { border: 2px solid #222; background: white; padding: 0.4rem 0.8rem; }
.active { background: #222; color: white; }
</style>`,
        },
      },
      tests: [
        {
          name: 'three tabs, the first one active',
          code: `const tabs = findAll('.tab')
expect(tabs.length).toBe(3)
expect(classes(tabs[0])).toContain('active')
expect(tabs[0].getAttribute('aria-selected')).toBe('true')
expect(tabs[1].getAttribute('aria-selected')).toBe('false')`,
        },
        {
          name: 'clicking a tab makes it the only active one',
          code: `await click(findAll('.tab')[2])
const active = findAll('.tab').filter((t) => t.classList.contains('active'))
expect(active.length).toBe(1)
expect(active[0].textContent.trim()).toBe('Billing')
expect(text('.panel')).toBe('Billing')`,
        },
        { name: 'every tab keeps its static class', code: `await click(findAll('.tab')[1]); expect(findAll('.tab').every((t) => t.classList.contains('tab'))).toBe(true)` },
      ],
    },
    {
      id: 'password-meter',
      title: 'A password strength meter',
      difficulty: 'beginner',
      prompt: `
Score the password from 0 to 4 — one point each for: at least 8 characters, a digit, an uppercase letter, a symbol (anything that is not a letter or digit). The state and a computed \`strength\` are provided.

- \`.meter-fill\` gets an inline width of \`strength × 25\` percent (e.g. 2 → \`50%\`).
- \`.meter\` gets **one** class: \`weak\` (0–1), \`medium\` (2–3) or \`strong\` (4), in addition to its static \`meter\` class.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

const password = ref('')

const strength = computed(() => {
  const p = password.value
  let score = 0
  if (p.length >= 8) score++
  if (/\\d/.test(p)) score++
  if (/[A-Z]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})
</script>

<template>
  <label>Password <input class="password" type="password" v-model="password" /></label>
  <div class="meter">
    <div class="meter-fill"></div>
  </div>
  <p class="score">{{ strength }} / 4</p>
</template>

<style scoped>
.meter { height: 8px; background: #eee; }
.meter-fill { height: 100%; background: currentColor; transition: width 0.2s; }
.weak { color: crimson; }
.medium { color: orange; }
.strong { color: seagreen; }
</style>`,
      },
      hints: [
        "The width: `:style=\"{ width: strength * 25 + '%' }\"` on `.meter-fill`.",
        'Create a computed `level` that returns `\'weak\'`, `\'medium\'` or `\'strong\'` from `strength`.',
        'Bind it with array (or string) syntax: `<div class="meter" :class="level">`.',
      ],
      solution: {
        explanation: 'The width is a measurement, so it is an inline style. The colour is one of three fixed looks, so it is a class chosen by a computed — the colours stay in CSS. Both derive from the same `strength`. (A real strength check would also look for common passwords; and the server enforces the actual password policy.)',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const password = ref('')

const strength = computed(() => {
  const p = password.value
  let score = 0
  if (p.length >= 8) score++
  if (/\\d/.test(p)) score++
  if (/[A-Z]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const level = computed(() => {
  if (strength.value <= 1) return 'weak'
  if (strength.value <= 3) return 'medium'
  return 'strong'
})
</script>

<template>
  <label>Password <input class="password" type="password" v-model="password" /></label>
  <div class="meter" :class="level">
    <div class="meter-fill" :style="{ width: strength * 25 + '%' }"></div>
  </div>
  <p class="score">{{ strength }} / 4</p>
</template>

<style scoped>
.meter { height: 8px; background: #eee; }
.meter-fill { height: 100%; background: currentColor; transition: width 0.2s; }
.weak { color: crimson; }
.medium { color: orange; }
.strong { color: seagreen; }
</style>`,
        },
      },
      tests: [
        { name: 'empty password: 0% and weak', code: `expect(find('.meter-fill').style.width).toBe('0%'); expect(classes('.meter')).toContain('weak')` },
        {
          name: 'two points: 50% and medium',
          code: `await type('.password', 'abcdefgh1')
expect(find('.meter-fill').style.width).toBe('50%')
expect(classes('.meter')).toContain('medium')
expect(classes('.meter')).not.toContain('weak')`,
        },
        {
          name: 'four points: 100% and strong, static class kept',
          code: `await type('.password', 'Abcdefgh1!')
expect(find('.meter-fill').style.width).toBe('100%')
expect(classes('.meter')).toEqual(['meter', 'strong'])`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'class-style-bindings-syntaxes',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What are the object and array syntaxes for `:class`, and when would you use each?',
      answer: 'Object syntax maps class names to conditions — `{ active: isActive, \'has-error\': error }` — and is best for switching known classes on and off. Array syntax lists classes — `[sizeClass, themeClass]` — and is best when class names come from data or props; arrays may contain objects too. Both merge with a static `class` attribute.',
      explanation: 'Objects answer "which of these classes?"; arrays answer "which classes, from these values?".',
      whyAsked: 'Everyday template knowledge; a quick fluency check.',
      mistakes: ['Thinking the object value is the class name.', 'Not knowing they merge with static classes.'],
      followUps: ['How do you keep complex class logic readable?', 'What happens with a class passed to a component?'],
      modelAnswer: "With object syntax the keys are class names and the values are conditions, so a class is applied when its condition is truthy — great for toggling known states like active or disabled. Array syntax takes a list of class names, which suits values coming from props or data, like a size class, and an array can contain objects for conditional parts. Either way Vue merges the result with the static class attribute. When it gets complex I move it into a computed.",
    },
    {
      id: 'class-style-bindings-component-merge',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'The child `BaseButton` renders `<button class="btn" :class="{ primary }">` with `primary = true`. The parent writes `<BaseButton class="wide" :class="{ busy: false }" />`. Which classes end up on the `<button>`?',
      options: ['btn, primary, wide', 'wide only', 'btn, primary only', 'btn, primary, wide, busy'],
      correctOption: 0,
      answer: '`btn`, `primary` and `wide`. A class passed to a component falls through to its single root element and is merged with the root\'s own classes; `busy` is false, so it is dropped.',
      explanation: 'Parent and child classes are normalised and merged — neither replaces the other.',
      whyAsked: 'Checks understanding of fallthrough attributes, which matters when building component libraries.',
      mistakes: ['Thinking the parent\'s class replaces the child\'s.', 'Forgetting that false object values are dropped.'],
      followUps: ['What changes if BaseButton has two root elements?', 'What does `inheritAttrs: false` do?'],
      modelAnswer: "btn, primary and wide. Because BaseButton has a single root element, the class from the parent falls through to that root and is merged with the root's own classes rather than replacing them. busy is false so it's dropped. If the component had multiple roots, it would have to place $attrs.class itself.",
    },
    {
      id: 'class-style-bindings-style-vs-class',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare toggling classes with binding inline styles. Which would you use for a "selected" card state, and which for a draggable element\'s position?',
      answer: 'Selected state → a class: it\'s a fixed design state, belongs in CSS, can use hover/transition/media queries and theming, and keeps specificity manageable. Drag position → `:style` (e.g. a `transform`), because the value is computed continuously from data and cannot be predefined. For values that should feed CSS, a CSS custom property bound with `:style` or `v-bind()` in CSS is a good middle ground.',
      explanation: 'Classes for finite states; styles for continuous values.',
      code: {
        lang: 'vue',
        code: `<article class="card" :class="{ selected }"
         :style="{ transform: \`translate(\${x}px, \${y}px)\` }">`,
      },
      whyAsked: 'Shows CSS architecture judgement, not just Vue syntax.',
      mistakes: ['Using inline styles for everything.', 'Trying to precompute classes for continuous values.'],
      followUps: ['How do CSS variables help here?', 'Why do inline styles make theming harder?'],
      modelAnswer: "A selected state is one of a few fixed looks, so it's a class: the visual design stays in CSS, I get hover and transitions, themes can override it, and specificity stays sane. A drag position changes continuously and comes from data, so an inline transform via :style is right. When CSS needs a dynamic value, I'd rather set a custom property with :style or use v-bind in the style block, and let the stylesheet use var().",
    },
    {
      id: 'class-style-bindings-dash-bug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'This line breaks the build: `<div :class="{ is-open: open, has-items: items.length }">`. Why?',
      answer: 'Object keys containing dashes must be quoted. Unquoted, `is-open` is parsed as the expression `is - open`, which is not a valid object key, so the template expression fails to compile. Write `{ \'is-open\': open, \'has-items\': items.length }`.',
      explanation: 'The value of `:class` is JavaScript, so JavaScript object rules apply.',
      whyAsked: 'A very common beginner mistake; checks that you read directive values as JavaScript.',
      mistakes: ['Blaming Vue for not supporting dashed class names.'],
      followUps: ['Would camelCase class names avoid the quotes?', 'Is the `{ open }` shorthand valid?'],
      modelAnswer: "Directive values are JavaScript, and in a JavaScript object literal a key with a dash has to be quoted — otherwise is-open reads as is minus open. So the fix is quoting both keys. Single-word class names, or the same-name shorthand like { open }, don't need quotes.",
    },
    {
      id: 'class-style-bindings-theming',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'Users can choose an accent colour for their workspace, used by buttons, links and charts across hundreds of components. How would you apply it, and what security concern applies?',
      answer: 'Set a CSS custom property once near the root — `:style="{ \'--accent\': accent }"` on the app shell (or `document.documentElement.style.setProperty`) — and have component styles use `var(--accent)`. That keeps components unaware of where the colour comes from and avoids inline styles everywhere. Validate the value (e.g. a hex colour pattern) on input and on the server, and only bind that single property — never a user-supplied style object or string, which could enable style injection such as invisible overlays for clickjacking.',
      explanation: 'One variable, consumed everywhere; whitelist what users can control.',
      code: {
        lang: 'vue',
        code: `<!-- AppShell.vue -->
<div class="app" :style="{ '--accent': safeAccent }">
  <RouterView />
</div>

/* any component */
.button-primary { background: var(--accent); }`,
      },
      whyAsked: 'Combines styling architecture with Vue\'s security guidance on style injection.',
      mistakes: ['Passing the colour as a prop through every component.', 'Binding whole style objects from user settings.', 'No validation.'],
      followUps: ['How would you ensure text contrast stays accessible?', 'How does v-bind() in <style> compare?'],
      modelAnswer: "I'd set one CSS custom property, say --accent, on the app's root element with a style binding, and have every component's CSS use var(--accent) with a fallback. Components don't need props or JavaScript for it, and changing the setting updates everything instantly. The value must be validated — a strict colour format on the client and on the server — and I'd only ever bind that one property. Binding a user-provided style object or string would allow style injection, like positioning an invisible element over the page for clickjacking. I'd also check contrast so text on the accent colour stays readable.",
    },
    {
      id: 'class-style-bindings-variants',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 3,
      question: 'A `BaseButton` supports `variant` (primary, secondary, danger), `size` (sm, md, lg), `loading` and `block` props. How do you keep its class logic clean?',
      answer: 'Compute the class list in one place: a computed returning an array such as `[\'btn\', \`btn-\${variant}\`, \`btn-\${size}\`, { \'btn-loading\': loading, \'btn-block\': block }]`, or map props through lookup objects with complete class names (important for utility-CSS scanners). Validate props so only known variants are accepted, keep visual definitions in CSS, and test the computed\'s output.',
      explanation: 'One computed = one source of truth for how props become classes.',
      whyAsked: 'Design-system work is common; this shows maintainable component API thinking.',
      mistakes: ['Long ternary chains in the template.', 'Inline styles for each variant.', 'Accepting arbitrary strings as class suffixes without validation.'],
      followUps: ['How would you validate the variant prop?', 'Why might a lookup object be better than string templates with Tailwind?'],
      modelAnswer: "I'd put all of it in one computed that returns an array: the base class, a class per variant and size, and an object for the boolean states. If we use a utility-CSS framework I'd use a lookup object with complete class names so the build tool can find them. The props get validators so only known variants are accepted, the look itself lives in CSS, and the computed is easy to unit-test.",
    },
    {
      id: 'class-style-bindings-coding-rating',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Build a 5-star rating: render five `<button class="star">` elements; the first `rating` stars also get the class `filled`. Clicking star N sets the rating to N. Show **N / 5** in `.label`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const rating = ref(3)
</script>

<template>
  <div class="stars">
    <button class="star">★</button>
  </div>
  <p class="label">0 / 5</p>
</template>

<style scoped>
.star { color: #ccc; background: none; border: none; font-size: 1.5rem; }
.filled { color: goldenrod; }
</style>`,
        },
      },
      tests: [
        {
          name: 'five stars, the first three filled',
          code: `const stars = findAll('.star')
expect(stars.length).toBe(5)
expect(stars.map((s) => s.classList.contains('filled'))).toEqual([true, true, true, false, false])
expect(text('.label')).toBe('3 / 5')`,
        },
        {
          name: 'clicking a star sets the rating',
          code: `await click(findAll('.star')[4])
expect(findAll('.star').filter((s) => s.classList.contains('filled')).length).toBe(5)
await click(findAll('.star')[0])
expect(text('.label')).toBe('1 / 5')`,
        },
      ],
      hints: ['A range loop: `v-for="n in 5" :key="n"` (n goes from 1 to 5).', 'Bind `:class="{ filled: n <= rating }"` and `@click="rating = n"`.'],
      answer: 'A range `v-for` with a class object comparing each star number to the rating.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const rating = ref(3)
</script>

<template>
  <div class="stars">
    <button
      v-for="n in 5"
      :key="n"
      class="star"
      :class="{ filled: n <= rating }"
      :aria-label="n + ' star' + (n > 1 ? 's' : '')"
      @click="rating = n"
    >
      ★
    </button>
  </div>
  <p class="label">{{ rating }} / 5</p>
</template>

<style scoped>
.star { color: #ccc; background: none; border: none; font-size: 1.5rem; }
.filled { color: goldenrod; }
</style>`,
        },
      },
      explanation: 'Each star decides its own class from one number. The colours stay in CSS; the template only states the rule.',
      whyAsked: 'A small UI widget that combines v-for ranges, class bindings and events.',
      mistakes: ['Keeping an array of five booleans in sync by hand.', 'Inline colour styles instead of a class.'],
      followUps: ['How would you show a hover preview?', 'How would you make it a keyboard-accessible radio group?'],
      modelAnswer: "I'd render the stars with a range v-for from 1 to 5, give each the class filled when its number is less than or equal to the rating, and set the rating to n on click. The rating is the only state, so there's nothing to sync. For accessibility I'd add labels, or better, implement it as a radio group so arrow keys work.",
    },
  ],

  takeaways: [
    '`:class` takes objects (`{ done: task.done }`), arrays (`[a, b]`), mixes of both, or strings.',
    'Dynamic classes merge with the static `class`; classes passed to a component merge onto its root.',
    'Quote dashed class names in object syntax: `{ \'has-error\': error }`.',
    '`:style` takes camelCase (or quoted kebab-case) objects and arrays — and Vue never adds units.',
    'Classes for fixed states, `:style` (or CSS variables) for data-driven values; never bind user-provided styles.',
  ],
}
