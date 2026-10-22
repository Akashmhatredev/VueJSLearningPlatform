// Lesson: Form input bindings with v-model

const pizzaApp = `<script setup>
import { ref, computed } from 'vue'

const name = ref('')
const size = ref('medium')
const toppings = ref(['cheese'])
const delivery = ref(false)
const tip = ref(0)
const notes = ref('')

const prices = { small: 8, medium: 10, large: 13 }
const total = computed(() => prices[size.value] + toppings.value.length + tip.value)
</script>

<template>
  <form class="order" @submit.prevent>
    <label>Name <input class="name" v-model="name" /></label>

    <label><input type="radio" value="small" v-model="size" /> Small</label>
    <label><input type="radio" value="medium" v-model="size" /> Medium</label>
    <label><input type="radio" value="large" v-model="size" /> Large</label>

    <label><input type="checkbox" value="cheese" v-model="toppings" /> Cheese</label>
    <label><input type="checkbox" value="olives" v-model="toppings" /> Olives</label>
    <label><input type="checkbox" value="basil" v-model="toppings" /> Basil</label>

    <label><input type="checkbox" class="delivery" v-model="delivery" /> Deliver to my door</label>
    <label>Tip (€) <input class="tip" type="text" v-model="tip" /></label>
    <label>Notes <textarea class="notes" v-model="notes"></textarea></label>
  </form>

  <p class="greeting">Order for: "{{ name }}"</p>
  <p class="summary">{{ size }} pizza with {{ toppings.join(', ') || 'no toppings' }}{{ delivery ? ', delivered' : '' }}</p>
  <p class="total">Total: €{{ total }}</p>
  <pre class="preview">{{ { name, size, toppings, delivery, tip, notes } }}</pre>
</template>`

const manualBinding = `<script setup>
import { ref } from 'vue'
const name = ref('')
const agree = ref(false)
</script>

<template>
  <input
    :value="name"
    @input="name = $event.target.value"
  />
  <input
    type="checkbox"
    :checked="agree"
    @change="agree = $event.target.checked"
  />
</template>`

const vModelBinding = `<script setup>
import { ref } from 'vue'
const name = ref('')
const agree = ref(false)
</script>

<template>
  <input v-model="name" />
  <input type="checkbox" v-model="agree" />
</template>

<!-- v-model picks the right property (value / checked)
     and the right event (input / change) for each
     kind of input. -->`

export default {
  id: 'v-model-forms',
  title: 'Form input bindings with v-model',
  summary: 'v-model keeps a form field and a piece of state in sync in both directions — for text, checkboxes, radios and selects — with .lazy, .number and .trim to shape the value.',
  difficulty: 'beginner',
  minutes: 26,
  prerequisites: ['v-on-events', 'v-bind'],
  related: ['native-form-handling', 'form-validation', 'component-v-model', 'list-rendering', 'accessible-reusable-inputs'],
  tags: ['v-model', 'forms', 'two-way binding', 'checkbox', 'radio', 'select', 'textarea', '.lazy', '.number', '.trim'],
  apis: [
    { name: 'v-model', summary: 'Two-way binding between a form input (or component) and state.' },
    { name: 'v-model.lazy', summary: 'Syncs on the `change` event instead of on every `input`.' },
    { name: 'v-model.number', summary: 'Casts the value with parseFloat(); keeps the original string if it cannot be parsed.' },
    { name: 'v-model.trim', summary: 'Removes leading and trailing whitespace from the value.' },
    { name: 'true-value / false-value', summary: 'Custom values a single checkbox writes when checked / unchecked.' },
  ],
  docs: [
    { label: 'Vue Guide — Form Input Bindings', url: 'https://vuejs.org/guide/essentials/forms.html' },
    { label: 'API — v-model', url: 'https://vuejs.org/api/built-in-directives.html#v-model' },
    { label: 'Vue Guide — Component v-model', url: 'https://vuejs.org/guide/components/v-model.html' },
  ],

  intro: `
Forms are a conversation: the page shows a value, the user changes it, your code needs the new value. Wiring that by hand means binding the value *and* listening for changes on every field.

\`v-model\` does both in one attribute:

\`\`\`vue
<input v-model="name" />
\`\`\`

Now \`name\` and the input are **two-way bound**: type in the box and \`name\` changes; change \`name\` in code and the box updates. It works on text inputs, textareas, checkboxes, radio buttons and selects — and later on your own components too.
`,

  why: `
Without \`v-model\`, every field needs two bindings, and they differ per input type:

- text and textarea: bind \`value\`, listen to \`input\`;
- checkboxes and radios: bind \`checked\`, listen to \`change\`;
- selects: bind \`value\`, listen to \`change\` (and handle \`multiple\`);
- a group of checkboxes: add or remove values from an array yourself.

That's a lot of repetitive, easy-to-get-wrong code for every form. \`v-model\` knows each input type and uses the right property and event automatically. Its modifiers handle three things almost every form needs: trimming spaces (\`.trim\`), converting text to numbers (\`.number\`) and only syncing when the user is done with a field (\`.lazy\`).
`,

  eli15: `
Imagine a shared online document open on two screens. Type on one screen and the other updates instantly — in both directions.

\`v-model\` makes an input box and a variable in your code work like those two screens. Type "Ada" in the box → the variable becomes "Ada". Your code sets the variable to "" → the box empties.

The modifiers are settings for the sync:

- \`.trim\` — "ignore spaces at the start and end",
- \`.number\` — "turn what I type into a real number",
- \`.lazy\` — "only sync when I click away, not on every key".
`,

  analogy: {
    title: 'A document shared between two screens',
    body: `
Screen A is the form field the user sees. Screen B is your state. A sync service keeps them identical: edits on either side appear on the other.

With plain \`:value\` you only have a projector — state shows on the screen, but writing on the screen changes nothing. \`v-model\` adds the return channel.
`,
    mapping: [
      ['screen A', 'the form field (`<input>`, `<select>`, …)'],
      ['screen B', 'your reactive state (`const name = ref(\'\')`)'],
      ['the sync service', '`v-model`'],
      ['"sync only when I click away"', '`.lazy` (uses `change` instead of `input`)'],
      ['"store it as a number"', '`.number`'],
      ['"strip extra spaces"', '`.trim`'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'v-model' },
    title: 'v-model in the real DOM',
    caption: 'Type into the field or change the state directly, and watch both sides stay in sync. Toggle .lazy, .number and .trim to see what ends up in the state — including its type.',
    alt: 'An interactive lab with an input bound with v-model and a panel showing the reactive state value and its type. Toggles for the lazy, number and trim modifiers change when the state updates and what value is stored.',
  },

  syntax: [
    `
#### Text and textarea
`,
    {
      code: `<input v-model="message" placeholder="Say something" />
<textarea v-model="bio"></textarea>

<!-- v-model on a text input is shorthand for: -->
<input :value="message" @input="message = $event.target.value" />`,
      lang: 'vue',
      title: 'text inputs',
    },
    `
Don't use interpolation inside a textarea (\`<textarea>{{ bio }}</textarea>\`) — it won't work. Use \`v-model\`.

#### Checkboxes
`,
    {
      code: `<!-- one checkbox → a boolean -->
<input type="checkbox" v-model="agree" />

<!-- custom values instead of true / false -->
<input type="checkbox" v-model="plan" true-value="pro" false-value="free" />

<!-- several checkboxes, one ARRAY → the values of the checked boxes -->
<input type="checkbox" value="cheese" v-model="toppings" />
<input type="checkbox" value="olives" v-model="toppings" />
<!-- toppings = ref([]) becomes e.g. ['olives', 'cheese'] (in the order they were checked) -->`,
      lang: 'vue',
      title: 'checkboxes',
    },
    `
#### Radio buttons and selects
`,
    {
      code: `<input type="radio" value="small" v-model="size" />
<input type="radio" value="large" v-model="size" />
<!-- size = 'small' or 'large' -->

<select v-model="country">
  <option disabled value="">Please choose</option>
  <option value="pt">Portugal</option>
  <option value="in">India</option>
</select>

<!-- multiple → an array of selected values -->
<select v-model="languages" multiple>
  <option>JavaScript</option>
  <option>Python</option>
</select>`,
      lang: 'vue',
      title: 'radios and selects',
    },
    `
- If a select's value matches no option, it renders "unselected" — and on iOS the user then can't pick the first option. That's why the docs recommend a **disabled empty option** first.
- To bind non-string values (numbers, objects), use \`:value\` on the radio/option/checkbox: \`<option :value="{ code: 'pt' }">\`.

#### The golden rule

\`v-model\` **ignores** the \`value\`, \`checked\` and \`selected\` attributes in your HTML. The state is the single source of truth — set initial values in JavaScript (\`ref('medium')\`), not in markup.

#### Modifiers
`,
    {
      code: `<input v-model.trim="username" />    <!-- "  ada  " → "ada" -->
<input v-model.number="age" />       <!-- "17" → 17 (a number) -->
<input v-model.lazy="title" />       <!-- syncs on change (blur / Enter), not on every key -->
<input v-model.lazy.trim="city" />   <!-- modifiers combine -->`,
      lang: 'vue',
      title: '.trim, .number, .lazy',
    },
    `
- \`.trim\` removes whitespace at the start and end.
- \`.number\` runs the value through \`parseFloat()\`. If it **can't** be parsed (e.g. \`"abc"\` or \`""\`), you get the **original string** back — so still validate the type. On \`<input type="number">\`, Vue applies \`.number\` automatically.
- \`.lazy\` listens to \`change\` instead of \`input\`: the state updates when the user leaves the field or presses Enter.
`,
    {
      callout: 'note',
      title: 'Languages with IME input',
      text: 'For languages typed with an input method editor (IME) — Chinese, Japanese, Korean — `v-model` does not update during composition, only once a word is committed. If you need every intermediate keystroke, use your own `@input` listener with `:value`.',
    },
    `
#### v-model on components

\`v-model\` also works on your own components (\`<SearchBox v-model="query" />\`). Under the hood it becomes a \`modelValue\` prop plus an \`update:modelValue\` event; in Vue 3.4+ \`defineModel()\` writes that for you. See [Component v-model & defineModel()](lesson:component-v-model).
`,
    {
      callout: 'version',
      text: 'Vue 3 changed component v-model from Vue 2\'s `value` / `input` pair to `modelValue` / `update:modelValue` and allows several `v-model:name` bindings per component. `defineModel()` is stable from Vue 3.4. Native input behaviour is the same as in Vue 2.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: pizzaApp,
    intro: 'A pizza order form using every kind of v-model binding. The live preview at the bottom shows the exact state — including its types. One field hides a bug.',
    steps: [
      { lines: [4, 9], text: 'One ref per field. The initial values *are* the form\'s initial state: medium size, cheese ticked, no delivery, zero tip.' },
      { lines: [11, 12], text: 'The total is derived with `computed()`: base price + €1 per topping + tip. Watch what happens to it when you type a tip…' },
      { lines: [17], text: 'A text input. `v-model="name"` = `:value="name"` + `@input="name = $event.target.value"`.' },
      { lines: [19, 21], text: 'Three radios share one `v-model`. Each writes its own `value` into `size` when selected.' },
      { lines: [23, 25], text: 'Three checkboxes bound to the **array** `toppings`: checking one adds its `value`, unchecking removes it.' },
      { lines: [27], text: 'A single checkbox bound to a **boolean**: `true` when ticked, `false` when not.' },
      { lines: [28], text: 'The tip field. It\'s a text input, so whatever you type arrives as a **string** — "5", not 5. That\'s the hidden bug: `11 + "5"` is `"115"`.' },
      { lines: [29], text: 'A textarea uses `v-model` exactly like a text input.' },
      { lines: [32, 35], text: 'Everything below the form reads the same state. The `<pre>` shows the state as JSON — notice the quotes around a typed tip.' },
    ],
  },

  playground: {
    title: 'Pizza order form',
    objective: 'Use modifiers to fix real bugs (stray spaces, string math) and change when a field syncs.',
    files: { 'App.vue': pizzaApp },
    expected: 'Changing any field updates the summary and the JSON preview instantly. Now type **5** into the tip: the total jumps to **€115** instead of €16, and the preview shows `"tip": "5"` in quotes — a string.',
    experiments: [
      {
        id: 'trim',
        task: 'Type `  Ada  ` (with spaces) into the name. The greeting keeps the spaces. Make the name ignore leading and trailing spaces.',
        hint: 'Add the `.trim` modifier: `v-model.trim="name"`.',
        tests: [
          {
            name: 'the name is trimmed',
            code: `await type('.name', '  Ada  ')
expect(state.name).toBe('Ada')
expect(text('.greeting')).toBe('Order for: "Ada"')`,
          },
        ],
        explain: 'Users paste and type stray spaces all the time. `.trim` cleans the value before it reaches your state — still validate on the server, though.',
      },
      {
        id: 'number',
        task: 'Fix the tip bug: typing **5** should make the total **€16**, not €115.',
        hint: 'Inputs always produce strings. Add `.number` to the tip\'s `v-model`.',
        tests: [
          {
            name: 'the tip is a number',
            code: `await type('.tip', '5')
expect(state.tip).toBe(5)
expect(text('.total')).toBe('Total: €16')`,
          },
        ],
        explain: '`11 + "5"` concatenates to `"115"`. `.number` converts the input with `parseFloat()`, so `11 + 5 = 16`. (On `<input type="number">` Vue does this automatically.)',
      },
      {
        id: 'lazy',
        task: 'The notes are copied into the preview on every keystroke. Make them sync only when the user leaves the field.',
        hint: '`v-model.lazy="notes"` syncs on the `change` event instead of `input`.',
        tests: [
          {
            name: 'notes sync on change, not on input',
            code: `const el = find('.notes')
el.value = 'Ring twice'
el.dispatchEvent(new Event('input', { bubbles: true }))
await nextTick()
expect(state.notes).toBe('')
el.dispatchEvent(new Event('change', { bubbles: true }))
await nextTick()
expect(state.notes).toBe('Ring twice')`,
          },
        ],
        explain: 'With `.lazy`, typing only changes the DOM; the state updates when `change` fires (on blur, or Enter for single-line inputs). Useful when every update triggers expensive work, like validation or a request.',
      },
      {
        id: 'crust',
        task: 'Add a crust choice: `const crust = ref(\'\')` and a `<select class="crust" v-model="crust">` with a disabled "Choose a crust" option (empty value) and **thin**, **classic**, **stuffed**.',
        hint: '`<option disabled value="">Choose a crust</option>` then `<option value="thin">Thin</option>` …',
        tests: [
          {
            name: 'the select writes the chosen crust',
            code: `expect(find('.crust').value).toBe('')
await select('.crust', 'stuffed')
expect(state.crust).toBe('stuffed')`,
          },
        ],
        explain: 'A select\'s `v-model` holds the `value` of the selected option. The disabled empty option gives a sensible "nothing chosen yet" state and avoids an iOS quirk with unmatched values.',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'What v-model saves you from writing',
    props: {
      left: { label: 'Manual two-way binding', lang: 'vue', code: manualBinding },
      right: { label: 'v-model', lang: 'vue', code: vModelBinding },
      points: [
        'Text inputs: `:value` + `@input` → `v-model`.',
        'Checkboxes use a different property and event (`checked` + `change`) — v-model knows that.',
        'Checkbox groups, radios and multi-selects need array/value handling — v-model does it.',
        'Modifiers (`.trim`, `.number`, `.lazy`) replace hand-written conversions.',
      ],
    },
    caption: 'v-model is syntactic sugar, but sugar that knows the quirks of every input type.',
    alt: 'Two panels. Left: an input with :value and @input, and a checkbox with :checked and @change writing event.target values back to refs. Right: the same two inputs written with v-model.',
  },

  internals: {
    beginner: `
\`v-model\` is a shortcut. Vue puts your state's value into the field, and listens to the field so that when the user changes it, the new value is written back to your state. Because the state changed, anything else that shows it updates too.
`,
    technical: [
      `
On native elements the compiler turns \`v-model\` into an \`onUpdate:modelValue\` handler (which assigns to your state) plus a **runtime directive** chosen by element type: \`vModelText\`, \`vModelCheckbox\`, \`vModelRadio\`, \`vModelSelect\` (or \`vModelDynamic\` when the \`type\` is bound).

- \`vModelText\` listens to \`input\` (or \`change\` with \`.lazy\`), applies \`.trim\`/\`.number\` casting, and pauses during IME composition (\`compositionstart\`/\`compositionend\`). On updates it only writes \`el.value\` when it actually differs, so the cursor doesn't jump.
- \`vModelCheckbox\` writes a boolean (or \`true-value\`/\`false-value\`), or adds/removes the element's value when the model is an array (or a Set).
- \`vModelSelect\` handles single and \`multiple\` selects, including non-string \`:value\`s.
`,
      {
        code: `// <input v-model.trim="name" />   compiles to roughly (simplified):
withDirectives(
  createElementVNode('input', {
    'onUpdate:modelValue': ($event) => (name.value = $event),
  }),
  [[vModelText, name.value, void 0, { trim: true }]]
)

// the .number cast is essentially:
function looseToNumber(val) {
  const n = parseFloat(val)
  return isNaN(n) ? val : n   // unparsable → the original string
}`,
        lang: 'js',
        title: 'compiled v-model (simplified)',
      },
      `
On a **component**, \`v-model="x"\` compiles to \`:modelValue="x" @update:modelValue="v => x = v"\` — no directive involved. That's why the component must declare the prop and emit the event (or use \`defineModel()\`).
`,
    ],
    production: `
- **Group form state.** For bigger forms, keep one object (\`const form = reactive({ email: '', plan: 'free' })\`) and bind \`v-model="form.email"\`. Resetting and submitting become one-liners. See [Native form handling](lesson:native-form-handling).
- **Validate types and content.** \`.number\` may hand you a string; \`<input type="date">\` gives \`"YYYY-MM-DD"\` strings. Validate on the client for UX ([Client-side validation](lesson:form-validation)) and always on the server for safety.
- **Accessibility:** every input needs a label (wrapping \`<label>\` or \`for\`/\`id\`), and use the right \`type\`, \`autocomplete\` and \`inputmode\` attributes so phones show the right keyboard. See [Accessible, reusable inputs](lesson:accessible-reusable-inputs).
- **Expensive reactions** to typing (search requests) should be debounced, or use \`.lazy\`.
- **Never \`v-model\` a prop** in a child component — props are read-only. Emit an update or use \`defineModel()\` (3.4+).
- **File inputs** can't use \`v-model\` (their value is read-only); listen to \`@change\` and read \`event.target.files\`.
`,
  },

  mistakes: [
    {
      title: 'Doing math with text input values',
      wrong: { code: `<input type="text" v-model="quantity" />\n<p>{{ quantity + 1 }}</p>   <!-- "2" + 1 = "21" -->`, lang: 'vue' },
      right: { code: `<input type="text" v-model.number="quantity" />\n<p>{{ quantity + 1 }}</p>   <!-- 2 + 1 = 3 -->`, lang: 'vue' },
      explanation: 'Input values are always strings. `+` with a string concatenates. Use `.number` (or `type="number"`, which applies it automatically) — and remember unparsable input stays a string.',
    },
    {
      title: 'Setting the initial value in HTML',
      wrong: { code: `<script setup>\nconst city = ref('')\n</script>\n\n<template>\n  <input v-model="city" value="Lisbon" />  <!-- shows an empty box -->\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\nconst city = ref('Lisbon')\n</script>\n\n<template>\n  <input v-model="city" />\n</template>`, lang: 'vue' },
      explanation: '`v-model` ignores `value`, `checked` and `selected` attributes — the state is the source of truth. Put initial values in the ref.',
    },
    {
      title: 'Binding a checkbox group to a non-array',
      wrong: { code: `const toppings = ref('')   // string!\n\n<input type="checkbox" value="cheese" v-model="toppings" />\n<input type="checkbox" value="olives" v-model="toppings" />`, lang: 'vue' },
      right: { code: `const toppings = ref([])\n\n<input type="checkbox" value="cheese" v-model="toppings" />\n<input type="checkbox" value="olives" v-model="toppings" />`, lang: 'vue' },
      explanation: 'With a non-array model, each checkbox writes `true`/`false` into the same variable, so they all fight over it. An array (or Set) model collects the checked values.',
    },
    {
      title: 'Using v-model on a prop',
      wrong: { code: `<script setup>\nconst props = defineProps({ title: String })\n</script>\n\n<template>\n  <input v-model="title" />  <!-- compile error: props are not writable -->\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\nconst title = defineModel('title') // Vue 3.4+\n</script>\n\n<template>\n  <input v-model="title" />\n</template>`, lang: 'vue' },
      explanation: 'Props flow one way, parent → child. A child that wants to change a value must ask the parent (emit an event). `defineModel()` sets up the prop + event pair for you.',
    },
  ],

  debugging: [
    {
      symptom: 'A total shows "115" or "105" instead of 16 or 15.',
      cause: 'A text input bound with plain `v-model` produced a string, and `+` concatenated it.',
      fix: 'Use `v-model.number` (and handle the case where the value is still a string because it could not be parsed).',
    },
    {
      symptom: 'The field starts empty even though the HTML has `value="…"` (or a checkbox ignores `checked`).',
      cause: '`v-model` ignores those attributes.',
      fix: 'Set the initial value in the ref: `ref(\'…\')`, `ref(true)`.',
    },
    {
      symptom: 'Compile error: "v-model cannot be used on a prop, because local prop bindings are not writable".',
      cause: '`v-model` is bound directly to a prop inside the child component.',
      fix: 'Use `defineModel()` (3.4+), or bind `:value` and emit `update:…` to the parent.',
    },
    {
      symptom: 'Compile error: "v-model cannot be used on file inputs since they are read-only".',
      cause: '`<input type="file" v-model="…">`.',
      fix: 'Use `@change="files = $event.target.files"`.',
    },
    {
      symptom: 'All checkboxes in a group tick and untick together.',
      cause: 'The group is bound to a boolean or string instead of an array.',
      fix: 'Initialise the model as an array: `ref([])`.',
    },
    {
      symptom: 'While typing Japanese or Chinese, the bound value lags behind what is on screen.',
      cause: '`v-model` waits for IME composition to finish.',
      fix: 'That is intended. If you need live updates, use `:value` with your own `@input` handler.',
    },
  ],

  bestPractices: [
    'Use `v-model` for form fields; reach for `:value` + `@input` only when you need custom per-keystroke logic.',
    'Set initial values in state, never with `value`/`checked` attributes.',
    'Use `.number` for numeric text fields and `.trim` for names, emails and search terms.',
    'Bind checkbox groups and multi-selects to arrays.',
    'Start selects with a disabled empty option.',
    'Label every field and validate on the server, not only in the browser.',
  ],

  useCases: [
    'Sign-up, login, checkout and settings forms.',
    'Search boxes and filters (`v-model.trim="query"`).',
    'Toggles and preference checkboxes (`v-model="darkMode"`).',
    'Quantity pickers and calculators (`v-model.number`).',
    'Custom input components (`<DatePicker v-model="date" />`).',
  ],

  whenToUse: {
    use: [
      'Any form field whose value your code needs to read and also set.',
      'Checkbox groups, radio groups and selects — v-model handles their different mechanics.',
      'Your own input-like components, with `defineModel()`.',
    ],
    avoid: [
      'Read-only displays of state — a one-way `:value` (or plain text) is clearer.',
      'File inputs — use `@change`.',
      'Binding directly to props or to computed values without a setter.',
    ],
  },

  comparison: {
    title: 'Ways to connect an input to state',
    headers: ['', '`v-model`', '`:value` + `@input`', '`:value` only', 'no binding (read via a template ref)'],
    rows: [
      ['Data flow', 'two-way', 'two-way, written by hand', 'one-way: state → field', 'the DOM keeps its own value'],
      ['Checkbox / radio / select quirks', 'handled', 'you write each case', '—', '—'],
      ['`.trim` / `.number` / `.lazy`', 'built in', 'do it yourself', '—', '—'],
      ['Good for', 'almost every field', 'custom transforms on each keystroke, IME live updates', 'read-only displays', 'file inputs, third-party widgets'],
    ],
  },

  quiz: [
    {
      id: 'v-model-forms-q1',
      type: 'mcq',
      prompt: 'For a text input, `v-model="name"` is equivalent to…',
      options: [
        { text: '`:value="name" @input="name = $event.target.value"`' },
        { text: '`:value="name"`', why: 'That is one-way: typing would not change `name`.' },
        { text: '`@input="name = $event.target.value"`', why: 'That is the other half only: changing `name` in code would not update the box.' },
        { text: '`:checked="name" @change="name = $event.target.checked"`', why: 'That is roughly what v-model does for a *checkbox*, not a text input.' },
      ],
      answer: 0,
      explanation: 'Bind the value down, listen for input, write it back up. v-model picks different properties/events for checkboxes, radios and selects.',
    },
    {
      id: 'v-model-forms-q2',
      type: 'output',
      prompt: 'With `const picked = ref([])`, the user checks **B**, then **A**. What does `{{ picked }}` show (ignoring whitespace)?',
      code: {
        lang: 'vue',
        code: `<input type="checkbox" value="A" v-model="picked" /> A
<input type="checkbox" value="B" v-model="picked" /> B
<p>{{ picked }}</p>`,
      },
      options: [
        { text: '["B", "A"]' },
        { text: '["A", "B"]', why: 'Values are appended in the order the boxes are checked, not in page order.' },
        { text: 'true', why: 'An array model collects values; a boolean only happens with a non-array model.' },
        { text: '"A"', why: 'Several boxes bound to an array produce an array of all checked values.' },
      ],
      answer: 0,
      explanation: 'Checking a box appends its `value` to the array; unchecking removes it.',
    },
    {
      id: 'v-model-forms-q3',
      type: 'bug',
      prompt: 'The user types **17** and the page says "Next year you\'ll be 171". Click the line that needs fixing.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const age = ref(16)
</script>

<template>
  <label>Age <input type="text" v-model="age" /></label>
  <p>Next year you'll be {{ age + 1 }}</p>
</template>`,
      },
      answerLine: 7,
      explanation: 'After typing, `age` is the string "17", and `"17" + 1` is "171". Use `v-model.number="age"` (or `type="number"`).',
    },
    {
      id: 'v-model-forms-q4',
      type: 'fill',
      prompt: 'Strip spaces from the email and store the quantity as a number.',
      code: { lang: 'vue', code: `<input type="email" v-model.___="email" />\n<input type="text" v-model.___="quantity" />` },
      answer: [['trim'], ['number']],
      explanation: '`.trim` removes leading/trailing whitespace; `.number` parses the value with `parseFloat()`.',
    },
    {
      id: 'v-model-forms-q5',
      type: 'mcq',
      prompt: 'What does `v-model.lazy` change?',
      options: [
        { text: 'The state updates on the `change` event (e.g. when leaving the field) instead of on every keystroke.' },
        { text: 'The input is only rendered when it scrolls into view.', why: '`.lazy` is about *when the value syncs*, not lazy rendering.' },
        { text: 'The value is debounced by 300 ms.', why: 'There is no timer; it simply listens to `change` instead of `input`.' },
        { text: 'The state can no longer update the input.', why: 'Binding is still two-way; only the input → state timing changes.' },
      ],
      answer: 0,
      explanation: '`.lazy` swaps the `input` event for `change`, which fires on blur (or Enter in single-line inputs).',
    },
    {
      id: 'v-model-forms-q6',
      type: 'mcq',
      prompt: 'With `const city = ref(\'\')`, what does `<input v-model="city" value="Lisbon" />` show initially?',
      options: [
        { text: 'An empty box — v-model ignores the `value` attribute.' },
        { text: '"Lisbon", and `city` becomes "Lisbon".', why: 'v-model treats the state as the source of truth and ignores the attribute.' },
        { text: '"Lisbon", but `city` stays empty.', why: 'Vue overwrites the field with the state value, which is empty.' },
        { text: 'A compile error.', why: 'It compiles; the attribute is simply ignored (your linter may warn).' },
      ],
      answer: 0,
      explanation: 'Initial values belong in state: `ref(\'Lisbon\')`.',
    },
    {
      id: 'v-model-forms-q7',
      type: 'short',
      prompt: 'Explain what `v-model` does differently for a single checkbox, a group of checkboxes bound to an array, and a text input.',
      answer: 'For a text input it binds `value` and listens to `input`, writing the string back. For a single checkbox it binds `checked` and listens to `change`, writing a boolean (or `true-value`/`false-value`). For a group bound to an array, each checkbox is checked if its `value` is in the array, and checking/unchecking adds or removes that value.',
    },
  ],

  exercises: [
    {
      id: 'newsletter-form',
      title: 'Newsletter sign-up',
      difficulty: 'beginner',
      prompt: `
Wire up the form with \`v-model\`:

- \`.email\` → ref \`email\`, **trimmed**.
- Topic checkboxes (values \`vue\`, \`css\`, \`a11y\`) → array \`topics\`.
- Frequency radios (values \`weekly\`, \`monthly\`) → \`frequency\`, starting as **weekly**.
- \`.consent\` checkbox → boolean \`consent\`.
- \`.submit\` is **disabled** unless the email contains "@" **and** consent is given.
- On submit (prevent the reload), show \`<p class="confirmation">\` with: **Subscribed EMAIL to TOPICS (FREQUENCY)**, topics joined with ", " — e.g. "Subscribed ada@example.com to vue, css (weekly)".
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const email = ref('')
const topics = ref([])
const frequency = ref('weekly')
const consent = ref(false)
const submitted = ref(false)
</script>

<template>
  <form class="signup">
    <label>Email <input class="email" type="email" /></label>

    <fieldset>
      <legend>Topics</legend>
      <label><input type="checkbox" value="vue" /> Vue</label>
      <label><input type="checkbox" value="css" /> CSS</label>
      <label><input type="checkbox" value="a11y" /> Accessibility</label>
    </fieldset>

    <fieldset>
      <legend>How often?</legend>
      <label><input type="radio" value="weekly" /> Weekly</label>
      <label><input type="radio" value="monthly" /> Monthly</label>
    </fieldset>

    <label><input class="consent" type="checkbox" /> I agree to receive emails</label>
    <button class="submit">Subscribe</button>
  </form>
</template>`,
      },
      hints: [
        'Add `v-model.trim="email"` to the email input, `v-model="topics"` to each topic checkbox, `v-model="frequency"` to each radio and `v-model="consent"` to the consent box.',
        'Disable the button with `:disabled="!email.includes(\'@\') || !consent"`, and add `@submit.prevent="submitted = true"` to the form.',
        "Show the result: `<p v-if=\"submitted\" class=\"confirmation\">Subscribed {{ email }} to {{ topics.join(', ') }} ({{ frequency }})</p>`.",
      ],
      solution: {
        explanation: 'Each field type gets the same `v-model` syntax, but Vue binds it differently: a trimmed string, an array of checked values, the selected radio value, and a boolean. The disabled rule and the confirmation are both derived from that state. (In a real app the server would validate the email and consent again.)',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const email = ref('')
const topics = ref([])
const frequency = ref('weekly')
const consent = ref(false)
const submitted = ref(false)
</script>

<template>
  <form class="signup" @submit.prevent="submitted = true">
    <label>Email <input class="email" type="email" v-model.trim="email" /></label>

    <fieldset>
      <legend>Topics</legend>
      <label><input type="checkbox" value="vue" v-model="topics" /> Vue</label>
      <label><input type="checkbox" value="css" v-model="topics" /> CSS</label>
      <label><input type="checkbox" value="a11y" v-model="topics" /> Accessibility</label>
    </fieldset>

    <fieldset>
      <legend>How often?</legend>
      <label><input type="radio" value="weekly" v-model="frequency" /> Weekly</label>
      <label><input type="radio" value="monthly" v-model="frequency" /> Monthly</label>
    </fieldset>

    <label><input class="consent" type="checkbox" v-model="consent" /> I agree to receive emails</label>
    <button class="submit" :disabled="!email.includes('@') || !consent">Subscribe</button>
  </form>

  <p v-if="submitted" class="confirmation">Subscribed {{ email }} to {{ topics.join(', ') }} ({{ frequency }})</p>
</template>`,
        },
      },
      tests: [
        { name: 'the email is trimmed', code: `await type('.email', '  ada@example.com  '); expect(state.email).toBe('ada@example.com')` },
        {
          name: 'checkboxes collect topics, radios pick a frequency',
          code: `await check('input[value="css"]', true)
await check('input[value="vue"]', true)
expect(state.topics).toEqual(['css', 'vue'])
await check('input[value="monthly"]', true)
expect(state.frequency).toBe('monthly')`,
        },
        {
          name: 'submit is disabled until the email and consent are valid',
          code: `expect(find('.submit').disabled).toBe(true)
await type('.email', 'ada@example.com')
expect(find('.submit').disabled).toBe(true)
await check('.consent', true)
expect(find('.submit').disabled).toBe(false)`,
        },
        {
          name: 'submitting shows the confirmation',
          code: `await type('.email', ' ada@example.com ')
await check('input[value="vue"]', true)
await check('input[value="css"]', true)
await check('.consent', true)
await submit('.signup')
expect(text('.confirmation')).toBe('Subscribed ada@example.com to vue, css (weekly)')`,
        },
      ],
    },
    {
      id: 'temperature-converter',
      title: 'A temperature converter with .number',
      difficulty: 'beginner',
      prompt: `
Type degrees Celsius into \`.celsius\` (a **text** input) and show Fahrenheit in \`.fahrenheit\` with one decimal and "°F" — e.g. 100 → **212.0°F**.

- Bind with \`v-model.number\` so \`celsius\` becomes a real number.
- If the value is not a number (empty or unparsable, so \`.number\` left it as a string), show **Enter a number**.
- Use a computed property for the result.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

const celsius = ref('')

const fahrenheit = computed(() => {
  if (typeof celsius.value !== 'number') return 'Enter a number'
  return ((celsius.value * 9) / 5 + 32).toFixed(1) + '°F'
})
</script>

<template>
  <label>Celsius <input class="celsius" type="text" v-model="celsius" /></label>
  <p class="fahrenheit">{{ fahrenheit }}</p>
</template>`,
      },
      hints: [
        'Run it and type 100: it still says "Enter a number". Why? Check `typeof` of what a text input produces.',
        'Text inputs always give strings. One modifier converts them.',
        'Change the binding to `v-model.number="celsius"`.',
      ],
      solution: {
        explanation: '`.number` parses the input with `parseFloat()`, so "100" becomes 100 and the computed can do math. Unparsable input (like "abc" or an empty field) stays a string, which the `typeof` check catches — exactly why you should still validate after `.number`.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const celsius = ref('')

const fahrenheit = computed(() => {
  if (typeof celsius.value !== 'number') return 'Enter a number'
  return ((celsius.value * 9) / 5 + 32).toFixed(1) + '°F'
})
</script>

<template>
  <label>Celsius <input class="celsius" type="text" v-model.number="celsius" /></label>
  <p class="fahrenheit">{{ fahrenheit }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'starts by asking for a number', code: `expect(text('.fahrenheit')).toBe('Enter a number')` },
        { name: '100 → 212.0°F', code: `await type('.celsius', '100'); expect(state.celsius).toBe(100); expect(text('.fahrenheit')).toBe('212.0°F')` },
        { name: '-40 → -40.0°F', code: `await type('.celsius', '-40'); expect(text('.fahrenheit')).toBe('-40.0°F')` },
        { name: 'non-numbers are rejected', code: `await type('.celsius', 'abc'); expect(text('.fahrenheit')).toBe('Enter a number')` },
      ],
    },
  ],

  interview: [
    {
      id: 'v-model-forms-sugar',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What is `v-model` syntactic sugar for?',
      answer: 'On native inputs it combines a value binding with an event listener, choosing them by input type: text/textarea → `value` + `input`; checkbox/radio → `checked` + `change`; select → `value` + `change`. On components, `v-model="x"` expands to `:modelValue="x"` plus `@update:modelValue="v => x = v"` (Vue 3), which `defineModel()` (3.4+) implements for you.',
      explanation: 'One directive, different property/event pairs depending on the element.',
      code: {
        lang: 'vue',
        code: `<input v-model="q" />
<!-- ≈ <input :value="q" @input="q = $event.target.value" /> -->

<SearchBox v-model="q" />
<!-- ≈ <SearchBox :modelValue="q" @update:modelValue="v => q = v" /> -->`,
      },
      whyAsked: 'Fundamental; also reveals whether you know the Vue 3 component contract.',
      mistakes: ['Saying it is always `value` + `input`.', 'Giving the Vue 2 component contract (`value`/`input`) for Vue 3.'],
      followUps: ['How do you support several v-models on one component?', 'What does defineModel() return?'],
      modelAnswer: "v-model is two-way binding sugar. On a text input it's a value binding plus an input listener that writes event.target.value back. For checkboxes and radios it uses checked and the change event, and for selects value and change, including arrays for multiple. On a component in Vue 3 it becomes a modelValue prop and an update:modelValue event — and since 3.4, defineModel creates that pair for me and returns a ref I can bind directly.",
    },
    {
      id: 'v-model-forms-modifiers',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Explain `.lazy`, `.number` and `.trim`, with a use case for each.',
      answer: '`.lazy` syncs on `change` instead of `input` — e.g. a field that triggers validation or a save only when the user leaves it. `.number` casts with `parseFloat()` (returning the original string if it cannot be parsed) — e.g. a quantity in a text field. `.trim` removes leading/trailing whitespace — e.g. emails, usernames, search terms.',
      explanation: 'When to sync, what type to store, and how to clean it.',
      whyAsked: 'Practical knowledge that prevents common form bugs.',
      mistakes: ['Thinking `.lazy` debounces with a timer.', 'Thinking `.number` guarantees a number.'],
      followUps: ['What happens with `.number` and input "12abc"?', 'Is `.number` needed on type="number"?'],
      modelAnswer: "lazy changes when the state updates: on change — when the field loses focus or Enter is pressed — instead of on every keystroke, which is handy for expensive validation. number parses the value with parseFloat so math works; if the text can't be parsed it leaves the original string, so I still validate, and on type=number inputs Vue applies it automatically. trim strips surrounding whitespace, which I use on emails and search terms.",
    },
    {
      id: 'v-model-forms-string-math',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'An order form shows "Total: €2010" when the user enters quantity 2 at €10 plus a €10 shipping fee. The template is `{{ quantity * price + shipping }}` and shipping comes from `<input type="text" v-model="shipping">`. What is going on?',
      answer: '`shipping` is a string because text inputs produce strings. `quantity * price` coerces to a number (20), but `20 + "10"` concatenates to "2010". Use `v-model.number` (or `type="number"`), and validate that the value is actually a number, since `.number` returns the original string for unparsable input.',
      explanation: '`*` coerces to numbers; `+` prefers string concatenation if either side is a string.',
      whyAsked: 'A real, common bug that tests JavaScript type coercion and v-model knowledge together.',
      mistakes: ['Wrapping everything in `Number()` in the template instead of fixing the binding.', 'Not considering unparsable input.'],
      followUps: ['Why did the multiplication still work?', 'How would you handle money without floating-point issues?'],
      modelAnswer: "Form inputs always give strings, so shipping is '10'. The multiplication coerces its operands, giving 20, but plus with a string concatenates, so we get '2010'. The fix belongs in the binding: v-model.number, or an input of type number, which applies it automatically. I'd still validate the type, because unparsable input stays a string, and for money I'd work in integer cents.",
    },
    {
      id: 'v-model-forms-initial-attr',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does the user see initially?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const plan = ref('free')
const newsletter = ref(false)
</script>

<template>
  <select v-model="plan">
    <option value="free">Free</option>
    <option value="pro" selected>Pro</option>
  </select>
  <input type="checkbox" v-model="newsletter" checked />
</template>`,
      },
      options: ['Free selected, checkbox unchecked', 'Pro selected, checkbox checked', 'Pro selected, checkbox unchecked', 'Free selected, checkbox checked'],
      correctOption: 0,
      answer: '"Free" is selected and the checkbox is unchecked. `v-model` ignores the `selected` and `checked` attributes; the state (`\'free\'`, `false`) is the source of truth.',
      explanation: 'Initial values belong in the refs.',
      whyAsked: 'Checks the "state is the source of truth" principle — a common source of confusion for people coming from server-rendered forms.',
      mistakes: ['Assuming HTML attributes win.', 'Assuming v-model reads the initial DOM value into the state.'],
      followUps: ['How would you pre-fill a form from server data?'],
      modelAnswer: "Free is selected and the checkbox is unchecked. v-model ignores the selected, checked and value attributes because the state is the single source of truth — plan is 'free' and newsletter is false. To pre-fill a form, I set the refs, for example from an API response.",
    },
    {
      id: 'v-model-forms-prop-mutation',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate builds `<TitleEditor :title="post.title" />` and inside it writes `<input v-model="title">` against the prop. It fails to compile. How do you make `TitleEditor` editable from the parent with `v-model`?',
      answer: 'Props are read-only (one-way data flow), so `v-model` cannot write to one. Make the component support `v-model`: in Vue 3.4+, `const title = defineModel(\'title\')` and bind `<input v-model="title">`; the parent uses `<TitleEditor v-model:title="post.title" />`. Before 3.4, declare the `title` prop and emit `update:title` from an `@input` handler (or use a computed with get/set).',
      explanation: 'The child asks; the parent owns the data and decides.',
      code: {
        lang: 'vue',
        code: `<!-- TitleEditor.vue (Vue 3.4+) -->
<script setup>
const title = defineModel('title')
</script>

<template>
  <input v-model="title" />
</template>

<!-- Parent -->
<TitleEditor v-model:title="post.title" />`,
      },
      whyAsked: 'Tests one-way data flow and the modern component v-model API.',
      mistakes: ['Copying the prop into a local ref and never syncing back.', 'Mutating the prop object\'s properties as a workaround.'],
      followUps: ['What does defineModel compile to?', 'How would you add a `.capitalize` modifier?'],
      modelAnswer: "Props are read-only in the child, so v-model on a prop is a compile error — the parent owns that data. The fix is to make the component itself v-model-compatible. On Vue 3.4 and later I'd write const title = defineModel('title'), which declares the prop and the update:title event and gives me a ref I can bind to the input; the parent uses v-model:title. On older versions I'd declare the prop, bind it with :value, and emit update:title on input.",
    },
    {
      id: 'v-model-forms-big-form',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You are building a 20-field account settings form with validation, a reset button and a dirty-check ("You have unsaved changes"). How would you structure the state?',
      answer: 'Keep the data in one object (e.g. `const form = reactive(structuredClone(initial))` or a ref to an object) and bind `v-model="form.email"`. Store the initial snapshot separately so reset is `Object.assign(form, structuredClone(initial))` and dirty is a computed comparing `form` with the snapshot. Derive validation errors with computed properties (or a validation library) and show them per field after it is touched. Submit a plain copy, disable the button while saving, map server errors back to fields — and validate on the server too.',
      explanation: 'One source of truth per form, with everything else (errors, dirty, canSubmit) derived.',
      whyAsked: 'Shows whether you can scale beyond toy forms.',
      mistakes: ['20 independent refs with ad-hoc syncing.', 'Storing errors that could be derived.', 'Relying only on client validation.'],
      followUps: ['How would you reuse validation across forms?', 'How would you handle async validation (username taken)?'],
      modelAnswer: "I'd keep the form data in a single reactive object initialised from a cloned snapshot of the server data, and bind each field with v-model to a property of it. Keeping the snapshot means reset is just copying it back, and a dirty computed can compare the two. Validation errors are computed from the form, shown once a field is touched, so they never drift out of sync. On submit I send a plain copy, disable the button while saving, and map server-side errors back onto fields — because the server validates everything again. For many forms I'd extract this into a composable or use a validation library.",
    },
    {
      id: 'v-model-forms-coding-filter',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 7,
      question: 'Build a filter: a text input `.query` (trimmed, case-insensitive) and a `<select class="category">` (values `all`, `fruit`, `veg`). Render matching items as `<li class="item">`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const items = [
  { id: 1, name: 'Apple', category: 'fruit' },
  { id: 2, name: 'Carrot', category: 'veg' },
  { id: 3, name: 'Banana', category: 'fruit' },
  { id: 4, name: 'Broccoli', category: 'veg' },
]
const query = ref('')
const category = ref('all')
</script>

<template>
  <input class="query" placeholder="Search…" />
  <select class="category">
    <option value="all">All</option>
    <option value="fruit">Fruit</option>
    <option value="veg">Vegetables</option>
  </select>
  <ul></ul>
</template>`,
        },
      },
      tests: [
        { name: 'shows everything initially', code: `expect(findAll('.item').length).toBe(4)` },
        { name: 'filters by text, case-insensitive and trimmed', code: `await type('.query', '  BR '); expect(findAll('.item').map((li) => li.textContent.trim())).toEqual(['Broccoli'])` },
        { name: 'filters by category', code: `await select('.category', 'fruit'); expect(findAll('.item').map((li) => li.textContent.trim())).toEqual(['Apple', 'Banana'])` },
        { name: 'both filters combine', code: `await select('.category', 'veg'); await type('.query', 'car'); expect(findAll('.item').map((li) => li.textContent.trim())).toEqual(['Carrot'])` },
      ],
      hints: ['Bind `v-model.trim="query"` and `v-model="category"`.', 'A computed filters by `category.value === \'all\' || item.category === category.value` and `item.name.toLowerCase().includes(query.value.toLowerCase())`.'],
      answer: 'Two v-models feed one computed; the list renders the computed.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const items = [
  { id: 1, name: 'Apple', category: 'fruit' },
  { id: 2, name: 'Carrot', category: 'veg' },
  { id: 3, name: 'Banana', category: 'fruit' },
  { id: 4, name: 'Broccoli', category: 'veg' },
]
const query = ref('')
const category = ref('all')

const visible = computed(() =>
  items.filter(
    (item) =>
      (category.value === 'all' || item.category === category.value) &&
      item.name.toLowerCase().includes(query.value.toLowerCase())
  )
)
</script>

<template>
  <input class="query" v-model.trim="query" placeholder="Search…" />
  <select class="category" v-model="category">
    <option value="all">All</option>
    <option value="fruit">Fruit</option>
    <option value="veg">Vegetables</option>
  </select>
  <ul>
    <li v-for="item in visible" :key="item.id" class="item">{{ item.name }}</li>
  </ul>
</template>`,
        },
      },
      explanation: 'The form fields only hold input state; the list is derived. Nothing has to be kept in sync by hand.',
      whyAsked: 'A classic live-coding task combining v-model, computed and v-for.',
      mistakes: ['Filtering inside the template.', 'Forgetting case-insensitivity or trimming.'],
      followUps: ['How would you sync the filters to the URL query string?', 'How would you debounce the search if it hit an API?'],
      modelAnswer: "Two v-models — a trimmed one for the query and one for the category — feed a single computed that filters by both conditions, case-insensitively. The list renders that computed with keyed v-for. If it hit an API I'd watch the query with a debounce, and I'd mirror the filters into the route query so the URL is shareable.",
    },
  ],

  takeaways: [
    '`v-model` = two-way binding: field → state on input, state → field on render.',
    'It picks the right property/event per input: text (`value`/`input`), checkbox & radio (`checked`/`change`), select.',
    'Checkbox groups and multi-selects bind to arrays; a single checkbox binds to a boolean (or `true-value`/`false-value`).',
    '`.trim`, `.number` (parseFloat, may still return a string) and `.lazy` (sync on change) shape the value.',
    'State is the source of truth: `value`/`checked`/`selected` attributes are ignored — and props can\'t be v-modelled directly.',
  ],
}
