// Lesson: Accessible, reusable inputs & multi-step forms

const textField = `<script setup>
import { computed, useId } from 'vue'

// Vue 3.3+: don't put extra attributes (name, type, autocomplete…) on the wrapper <div>
defineOptions({ inheritAttrs: false })

// Vue 3.4+: v-model on <TextField> = a modelValue prop + an update:modelValue event
const model = defineModel({ type: String, default: '' })

const props = defineProps({
  label: { type: String, required: true },
  error: { type: String, default: '' },
})

// Vue 3.5+: a unique id per instance, stable between server and client rendering
const id = useId()
const errorId = id + '-error'

// Screen readers read the elements listed here when the input is focused
const describedBy = computed(() => (props.error ? errorId : undefined))
</script>

<template>
  <div class="text-field">
    <label :for="id">{{ label }}</label>
    <input :id="id" v-model="model" v-bind="$attrs" :aria-describedby="describedBy" />
    <p v-if="error" :id="errorId" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.text-field { display: grid; gap: 2px; margin-bottom: 10px; max-width: 320px; }
.error { color: #b00020; margin: 0; }
</style>`

const wizardApp = `<script setup>
import { reactive, ref, computed } from 'vue'
import TextField from './TextField.vue'

const steps = ['Account', 'Profile', 'Review']
const step = ref(0)
const values = reactive({ email: '', password: '', name: '', plan: 'free' })
const showErrors = ref(false) // becomes true when the user tries to continue
const done = ref(false)

const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ // simplified

// Each step validates only its own fields
const stepErrors = computed(() => {
  const e = {}
  if (step.value === 0) {
    if (!EMAIL.test(values.email)) e.email = 'Enter an email like name@example.com.'
    if (values.password.length < 8) e.password = 'Use at least 8 characters.'
  } else if (step.value === 1) {
    if (!values.name.trim()) e.name = 'Please enter your name.'
  }
  return e
})

const err = (field) => (showErrors.value ? stepErrors.value[field] : '')

function next() {
  showErrors.value = true
  if (Object.keys(stepErrors.value).length) return
  showErrors.value = false
  step.value++
}

function back() {
  showErrors.value = false
  step.value--
}

function finish() {
  // A real app would send the values to the server here — and the server validates again
  done.value = true
}
</script>

<template>
  <p v-if="done" class="success" role="status">
    All set, {{ values.name }}! Your {{ values.plan }} account is ready.
  </p>

  <form v-else novalidate @submit.prevent="step < steps.length - 1 ? next() : finish()">
    <p class="progress">Step {{ step + 1 }} of {{ steps.length }}</p>
    <h2 tabindex="-1">Step {{ step + 1 }}: {{ steps[step] }}</h2>

    <template v-if="step === 0">
      <TextField v-model="values.email" label="Email" name="email" type="email"
        autocomplete="email" required :error="err('email')" />
      <TextField v-model="values.password" label="Password" name="password" type="password"
        autocomplete="new-password" required hint="At least 8 characters." :error="err('password')" />
    </template>

    <template v-else-if="step === 1">
      <TextField v-model="values.name" label="Full name" name="name" autocomplete="name"
        required :error="err('name')" />
      <fieldset>
        <legend>Plan</legend>
        <label><input type="radio" name="plan" value="free" v-model="values.plan" /> Free</label>
        <label><input type="radio" name="plan" value="pro" v-model="values.plan" /> Pro</label>
      </fieldset>
    </template>

    <dl v-else class="review">
      <dt>Email</dt><dd>{{ values.email }}</dd>
      <dt>Name</dt><dd>{{ values.name }}</dd>
      <dt>Plan</dt><dd>{{ values.plan }}</dd>
    </dl>

    <div class="actions">
      <button v-if="step > 0" type="button" class="back" @click="back">Back</button>
      <button type="submit" class="next">{{ step < steps.length - 1 ? 'Next' : 'Create account' }}</button>
    </div>
  </form>
</template>

<style>
.progress { color: #555; margin: 0; }
h2:focus { outline: 3px solid #4c7bf4; outline-offset: 2px; }
.actions { display: flex; gap: 8px; margin-top: 8px; }
.success { background: #e7f7ea; padding: 12px; }
</style>`

// Finished versions (all three code experiments applied) — offered as a variant
const textFieldComplete = textField
  .replace(
    `  error: { type: String, default: '' },
})`,
    `  error: { type: String, default: '' },
  hint: { type: String, default: '' },
})`,
  )
  .replace(
    `const errorId = id + '-error'

// Screen readers read the elements listed here when the input is focused
const describedBy = computed(() => (props.error ? errorId : undefined))`,
    `const errorId = id + '-error'
const hintId = id + '-hint'

// Screen readers read the elements listed here when the input is focused
const describedBy = computed(() => {
  const ids = []
  if (props.hint) ids.push(hintId)
  if (props.error) ids.push(errorId)
  return ids.length ? ids.join(' ') : undefined
})`,
  )
  .replace(
    `<input :id="id" v-model="model" v-bind="$attrs" :aria-describedby="describedBy" />
    <p v-if="error"`,
    `<input :id="id" v-model="model" v-bind="$attrs"
      :aria-describedby="describedBy" :aria-invalid="error ? 'true' : undefined" />
    <p v-if="hint" :id="hintId" class="hint">{{ hint }}</p>
    <p v-if="error"`,
  )

const wizardAppComplete = wizardApp
  .replace(`import { reactive, ref, computed } from 'vue'`, `import { reactive, ref, computed, nextTick, useTemplateRef } from 'vue'`)
  .replace(
    `const done = ref(false)
`,
    `const done = ref(false)
const heading = useTemplateRef('heading') // Vue 3.5+ (use ref(null) on older versions)

// After a step change, move focus to the new heading so keyboard and
// screen-reader users start at the top of the new step
async function focusHeading() {
  await nextTick()
  heading.value?.focus()
}
`,
  )
  .replace(
    `  showErrors.value = false
  step.value++
}`,
    `  showErrors.value = false
  step.value++
  focusHeading()
}`,
  )
  .replace(
    `  showErrors.value = false
  step.value--
}`,
    `  showErrors.value = false
  step.value--
  focusHeading()
}`,
  )
  .replace(`<h2 tabindex="-1">`, `<h2 ref="heading" tabindex="-1">`)

// ---- exercise: BaseSelect
const baseSelectStarter = `<script setup>
defineProps({
  label: { type: String, required: true },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: 'Choose…' },
  error: { type: String, default: '' },
})
</script>

<template>
  <div class="base-select">
    <label>{{ label }}</label>
    <select>
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>`

const baseSelectSolution = `<script setup>
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })            // Vue 3.3+

const model = defineModel({ type: String, default: '' }) // Vue 3.4+

const props = defineProps({
  label: { type: String, required: true },
  options: { type: Array, default: () => [] }, // [{ value, label }]
  placeholder: { type: String, default: 'Choose…' },
  error: { type: String, default: '' },
})

const id = useId()                                // Vue 3.5+
const errorId = id + '-error'
const describedBy = computed(() => (props.error ? errorId : undefined))
</script>

<template>
  <div class="base-select">
    <label :for="id">{{ label }}</label>
    <select :id="id" v-model="model" v-bind="$attrs"
      :aria-invalid="error ? 'true' : undefined" :aria-describedby="describedBy">
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <p v-if="error" :id="errorId" class="error">{{ error }}</p>
  </div>
</template>`

const selectApp = `<script setup>
import { ref } from 'vue'
import BaseSelect from './BaseSelect.vue'

const size = ref('')
const sizes = [
  { value: 's', label: 'Small' },
  { value: 'm', label: 'Medium' },
  { value: 'l', label: 'Large' },
]
</script>

<template>
  <BaseSelect v-model="size" label="T-shirt size" name="size" :options="sizes"
    :error="size ? '' : 'Please choose a size.'" />
  <p class="chosen">Chosen: {{ size || 'nothing yet' }}</p>
</template>`

// ---- exercise: error summary
const summaryTextField = `<script setup>
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })
const model = defineModel({ type: String, default: '' })
const props = defineProps({
  label: { type: String, required: true },
  error: { type: String, default: '' },
  id: { type: String, default: '' }, // optional fixed id, so an error summary can link to it
})

const autoId = useId()
const inputId = computed(() => props.id || autoId)
const errorId = computed(() => inputId.value + '-error')
</script>

<template>
  <div class="text-field">
    <label :for="inputId">{{ label }}</label>
    <input :id="inputId" v-model="model" v-bind="$attrs"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="error ? errorId : undefined" />
    <p v-if="error" :id="errorId" class="error">{{ error }}</p>
  </div>
</template>`

const summaryStarter = `<script setup>
import { reactive, ref, computed } from 'vue'
import TextField from './TextField.vue'

const values = reactive({ name: '', email: '', message: '' })
const submitAttempted = ref(false)
const sent = ref(false)

const errors = computed(() => {
  const e = {}
  if (!values.name.trim()) e.name = 'Enter your name.'
  if (!values.email.includes('@')) e.email = 'Enter an email address.'
  if (values.message.trim().length < 10) e.message = 'Write at least 10 characters.'
  return e
})

const err = (field) => (submitAttempted.value ? errors.value[field] : '')

// TODO: an error summary that lists every error, links to each field and receives focus

function onSubmit() {
  submitAttempted.value = true
  if (Object.keys(errors.value).length) return
  sent.value = true
}
</script>

<template>
  <p v-if="sent" class="sent" role="status">Thanks — we'll be in touch.</p>

  <form v-else novalidate @submit.prevent="onSubmit">
    <TextField id="contact-name" v-model="values.name" label="Name" :error="err('name')" />
    <TextField id="contact-email" v-model="values.email" label="Email" type="email" :error="err('email')" />
    <TextField id="contact-message" v-model="values.message" label="Message" :error="err('message')" />
    <button type="submit">Send</button>
  </form>
</template>`

const summarySolution = `<script setup>
import { reactive, ref, computed, nextTick } from 'vue'
import TextField from './TextField.vue'

const values = reactive({ name: '', email: '', message: '' })
const submitAttempted = ref(false)
const sent = ref(false)
const summary = ref(null) // template ref (useTemplateRef('summary') in Vue 3.5+)

const errors = computed(() => {
  const e = {}
  if (!values.name.trim()) e.name = 'Enter your name.'
  if (!values.email.includes('@')) e.email = 'Enter an email address.'
  if (values.message.trim().length < 10) e.message = 'Write at least 10 characters.'
  return e
})

const err = (field) => (submitAttempted.value ? errors.value[field] : '')

const fieldIds = { name: 'contact-name', email: 'contact-email', message: 'contact-message' }
const errorList = computed(() =>
  Object.entries(errors.value).map(([field, message]) => ({ id: fieldIds[field], message })),
)
const summaryTitle = computed(() => {
  const n = errorList.value.length
  return n === 1 ? 'There is 1 problem' : 'There are ' + n + ' problems'
})

async function onSubmit() {
  submitAttempted.value = true
  if (errorList.value.length) {
    await nextTick()          // wait until the summary is rendered…
    summary.value?.focus()    // …then move focus to it
    return
  }
  sent.value = true
}
</script>

<template>
  <p v-if="sent" class="sent" role="status">Thanks — we'll be in touch.</p>

  <form v-else novalidate @submit.prevent="onSubmit">
    <div v-if="submitAttempted && errorList.length" ref="summary"
      class="error-summary" role="alert" tabindex="-1">
      <h2>{{ summaryTitle }}</h2>
      <ul>
        <li v-for="item in errorList" :key="item.id">
          <a :href="'#' + item.id">{{ item.message }}</a>
        </li>
      </ul>
    </div>

    <TextField id="contact-name" v-model="values.name" label="Name" :error="err('name')" />
    <TextField id="contact-email" v-model="values.email" label="Email" type="email" :error="err('email')" />
    <TextField id="contact-message" v-model="values.message" label="Message" :error="err('message')" />
    <button type="submit">Send</button>
  </form>
</template>`

// ---- interview coding: accessible switch
const switchStarter = `<script setup>
defineProps({ label: { type: String, required: true } })
</script>

<template>
  <div class="toggle" @click="() => {}">
    <span>{{ label }}</span>
  </div>
</template>`

const switchSolution = `<script setup>
const on = defineModel({ type: Boolean, default: false }) // Vue 3.4+
defineProps({ label: { type: String, required: true } })
</script>

<template>
  <!-- a real <button>: focusable, and Space/Enter activate it for free -->
  <button type="button" class="toggle" role="switch" :aria-checked="on ? 'true' : 'false'" @click="on = !on">
    <span class="label">{{ label }}</span>
    <span class="state" aria-hidden="true">{{ on ? 'On' : 'Off' }}</span>
  </button>
</template>`

const switchApp = `<script setup>
import { ref } from 'vue'
import ToggleSwitch from './ToggleSwitch.vue'

const emails = ref(true)
</script>

<template>
  <ToggleSwitch v-model="emails" label="Email notifications" />
  <p class="status">Emails are {{ emails ? 'on' : 'off' }}</p>
</template>`

export default {
  id: 'accessible-reusable-inputs',
  title: 'Accessible, reusable inputs & multi-step forms',
  summary: 'Build input components that work with v-model, screen readers and keyboards — labels, aria-describedby, aria-invalid, live announcements — and use them in a multi-step form that keeps focus and data where users expect.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['form-validation', 'component-v-model', 'fallthrough-attrs'],
  related: ['accessibility-fundamentals', 'accessible-components', 'advanced-forms', 'template-refs', 'design-systems'],
  tags: ['forms', 'accessibility', 'a11y', 'aria-describedby', 'aria-invalid', 'aria-live', 'label', 'useId', 'defineModel', 'inheritAttrs', 'reusable input', 'multi-step form', 'wizard', 'focus management'],
  apis: [
    { name: 'defineModel()', summary: 'Vue 3.4+: declares a two-way `v-model` binding in a component (a prop plus an update event).' },
    { name: 'useId()', summary: 'Vue 3.5+: generates a unique id per component instance that matches between server and client rendering.' },
    { name: 'defineOptions({ inheritAttrs: false })', summary: 'Vue 3.3+: stop automatic attribute fallthrough so you can bind `$attrs` onto the inner input.' },
    { name: 'aria-describedby', summary: 'Points to the ids of elements (hint, error) that screen readers read after the field\'s label.' },
    { name: 'aria-invalid', summary: 'Tells assistive technology that the current value failed validation.' },
    { name: 'aria-live / role="alert"', summary: 'Live regions announce content changes without moving focus (`polite` waits; `alert` interrupts).' },
  ],
  docs: [
    { label: 'Vue Guide — Accessibility: forms', url: 'https://vuejs.org/guide/best-practices/accessibility.html#semantic-forms' },
    { label: 'Vue Guide — Component v-model (defineModel)', url: 'https://vuejs.org/guide/components/v-model.html' },
    { label: 'Vue API — useId() (3.5+)', url: 'https://vuejs.org/api/composition-api-helpers.html#useid' },
    { label: 'Vue Guide — Fallthrough attributes', url: 'https://vuejs.org/guide/components/attrs.html' },
    { label: 'WAI — Forms tutorial (W3C)', url: 'https://www.w3.org/WAI/tutorials/forms/' },
  ],

  intro: `
A form is only finished when **everyone** can use it: people navigating with a keyboard, people using a screen reader (software that reads the page aloud), people zoomed in to 300%, people on a phone with one thumb.

Most of that comes from plain HTML used properly — real \`<label>\`s, real \`<button>\`s, \`<fieldset>\` for groups. The rest is a handful of ARIA attributes that connect hints and errors to fields, and a little **focus management** so users always know where they are.

Because every form repeats the same patterns, you'll wrap them in a **reusable input component** that supports \`v-model\`, generates its own ids, and wires up the accessibility automatically. Then you'll use it in a **multi-step form** — a wizard — that validates step by step without losing data or focus.
`,

  why: `
Look at a typical "quick" input:

\`\`\`html
<input placeholder="Email" v-model="email" class="red-if-invalid" />
<span class="error">Invalid</span>
\`\`\`

To a screen-reader user this is an unlabeled text box — the placeholder disappears as soon as they type, and may not be announced reliably. The red border means nothing if you can't see colour. "Invalid" floats somewhere on the page, unconnected to the field. Copy that snippet into thirty forms and you have thirty broken forms.

A reusable \`TextField\` component fixes it **once**: it always renders a real label, links hints and errors with \`aria-describedby\`, marks invalid fields with \`aria-invalid\`, and supports \`v-model\` like a native input. Teams that build forms this way ship accessible forms by default, not by heroic effort.

Multi-step forms add their own traps: data lost when going back, focus left on a button that no longer means anything, and no clue which step you're on. Each has a simple, standard fix.
`,

  eli15: `
Imagine filling in a form with your eyes closed while a friend reads it to you.

- If a box has no **label**, your friend says "a box". A box for what?
- If there's a hint like "at least 8 characters" floating somewhere, your friend only knows to read it if it's **connected** to that box (\`aria-describedby\`).
- If the box is wrong, your friend needs to say "this one has a problem" (\`aria-invalid\`) and read the problem out.
- When you move to page 2 of the form, your friend should start reading from the **top of page 2** — not from wherever their finger happened to be (focus management).

A reusable input component is like giving your friend a script that always does these things, for every box, on every form.
`,

  analogy: {
    title: 'Reading a form aloud to a friend',
    body: `
A friend who can't see the screen relies on you to say, for every box: what it's for, any instructions, and whether something is wrong with it. They also rely on you to tell them when you've turned the page, and to start reading from the top of the new page.

If you always forget the instructions, write yourself a checklist and use it every time. In code, that checklist is a component.
`,
    mapping: [
      ['"this box is for your email"', '`<label for>` linked to the input\'s `id`'],
      ['"…it needs at least 8 characters"', 'a hint linked with `aria-describedby`'],
      ['"…and there\'s a problem with it"', '`aria-invalid="true"` + the error in `aria-describedby`'],
      ['"we\'re on page 2 now"', 'moving focus to the new step\'s heading'],
      ['interrupting to say something urgent', '`role="alert"` / `aria-live`'],
      ['the checklist you use every time', 'a reusable `TextField` component'],
    ],
  },

  visual: {
    type: 'component-flow',
    props: { mode: 'v-model' },
    title: 'v-model on your own input component',
    caption: 'The parent passes the value down as `modelValue`; the input component emits `update:modelValue` when the user types. `defineModel()` (Vue 3.4+) writes both halves for you.',
    alt: 'An animated parent and child component. The parent binds v-model to a child input component; the value flows down as the modelValue prop, and when the user types in the child, an update:modelValue event flows back up and changes the parent\'s state.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'What a screen reader gets from one field',
    caption: 'Step through how label, hint, error and live regions turn into one spoken announcement.',
    alt: 'A diagram of one form field. The label is connected to the input with for and id. The hint and error paragraphs are connected through aria-describedby. aria-invalid marks the input as invalid. A screen reader focusing the input announces the label, the role, the invalid state, then the hint and error. A separate live region announces status messages without moving focus.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'label', label: '<label for="v-0">', note: '"Password"', x: 120, y: 60, tone: 'paper' },
        { id: 'input', label: '<input id="v-0">', note: 'aria-invalid="true"', x: 380, y: 60, tone: 'cobalt' },
        { id: 'hint', label: '<p id="v-0-hint">', note: '"At least 8 characters."', x: 620, y: 60, tone: 'kraft' },
        { id: 'error', label: '<p id="v-0-error">', note: '"Use at least 8 characters."', x: 620, y: 190, tone: 'red' },
        { id: 'sr', label: 'Screen reader', note: 'reads it all on focus', x: 380, y: 250, tone: 'ink' },
        { id: 'live', label: 'aria-live region', note: '"Step 2 of 3"', x: 120, y: 250, tone: 'acid' },
      ],
      edges: [
        { from: 'label', to: 'input', label: 'for → id' },
        { from: 'input', to: 'hint', label: 'aria-describedby', dashed: true },
        { from: 'input', to: 'error', label: 'aria-describedby', dashed: true },
        { from: 'input', to: 'sr', label: 'focus' },
        { from: 'live', to: 'sr', label: 'announces changes', dashed: true },
      ],
      steps: [
        { focus: ['label', 'input'], edges: ['label->input'], text: '`<label for>` matching the input\'s `id` gives the field its **accessible name**. Clicking the label also focuses the input — a bigger target for everyone.' },
        { focus: ['hint'], edges: ['input->hint'], text: 'The hint has its own id, listed in the input\'s `aria-describedby`. It becomes the field\'s **description**, read after the name.' },
        { focus: ['error'], edges: ['input->error'], text: 'When validation fails, the error\'s id is added to `aria-describedby` too (space-separated), and the input gets `aria-invalid="true"`.' },
        { focus: ['sr'], edges: ['input->sr'], text: 'Focusing the input, a screen reader announces roughly: name ("Password"), role (edit text), state (invalid), then the description (hint and error). Exact wording varies by screen reader.' },
        { focus: ['live'], edges: ['live->sr'], text: 'Messages that appear elsewhere — "Saved", "Step 2 of 3", an error summary — are announced through **live regions** (`aria-live="polite"`, `role="status"` or `role="alert"`) without moving focus.' },
      ],
    },
  },

  syntax: [
    `
#### A reusable input with v-model
`,
    {
      code: `<!-- TextField.vue -->
<script setup>
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })                  // Vue 3.3+
const model = defineModel({ type: String, default: '' }) // Vue 3.4+
const props = defineProps({ label: String, hint: String, error: String })

const id = useId()                                        // Vue 3.5+
const hintId = id + '-hint'
const errorId = id + '-error'
const describedBy = computed(() =>
  [props.hint && hintId, props.error && errorId].filter(Boolean).join(' ') || undefined)
</script>

<template>
  <div class="text-field">
    <label :for="id">{{ label }}</label>
    <input :id="id" v-model="model" v-bind="$attrs"
           :aria-describedby="describedBy"
           :aria-invalid="error ? 'true' : undefined" />
    <p v-if="hint" :id="hintId" class="hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="error">{{ error }}</p>
  </div>
</template>`,
      lang: 'vue',
      title: 'TextField.vue',
    },
    {
      code: `<TextField v-model="form.email" label="Email" type="email" name="email"
           autocomplete="email" required :error="errors.email" />`,
      lang: 'vue',
      title: 'using it',
    },
    `
\`name\`, \`type\`, \`autocomplete\` and \`required\` aren't props, so they are **fallthrough attributes**. With \`inheritAttrs: false\` and \`v-bind="$attrs"\` they land on the \`<input>\` — where they mean something — instead of on the wrapper \`<div>\`.

#### Before Vue 3.4: the manual v-model
`,
    {
      code: `const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])
// <input :value="modelValue" @input="emit('update:modelValue', $event.target.value)" />`,
      lang: 'js',
      title: 'modelValue + update:modelValue',
    },
    `
#### Groups, live regions and focus
`,
    {
      code: `<!-- radio/checkbox groups: one name for the whole group -->
<fieldset>
  <legend>Plan</legend>
  <label><input type="radio" value="free" v-model="plan" /> Free</label>
  <label><input type="radio" value="pro" v-model="plan" /> Pro</label>
</fieldset>

<!-- status messages: announced without stealing focus -->
<p role="status">{{ saved ? 'Saved' : '' }}</p>          <!-- polite -->
<div role="alert" v-if="formError">{{ formError }}</div> <!-- assertive -->

<!-- focus management after a step change or a failed submit -->
<h2 ref="heading" tabindex="-1">Step 2: Profile</h2>`,
      lang: 'vue',
      title: 'patterns',
    },
    `
**The rules:**

1. Every input has a **visible label** linked with \`for\`/\`id\` (or wrapping). Placeholders are examples, not labels.
2. Generate ids with \`useId()\` (3.5+) — never \`Math.random()\`, which changes between server and client.
3. Link hints and errors with \`aria-describedby\` (space-separated ids); set \`aria-invalid="true"\` while an error is shown.
4. Don't rely on colour alone: show text, and ideally an icon.
5. Use real \`<button>\`s and native inputs; group radios/checkboxes in \`<fieldset>\` with a \`<legend>\`.
6. Keep \`required\` on required fields even with \`novalidate\` — it is still exposed to assistive technology.
7. After a failed submit, **move focus** to the first invalid field or an error summary. After a step change, move focus to the new step's heading.
8. Use live regions sparingly: \`role="status"\` (polite) for confirmations, \`role="alert"\` only for urgent errors. Don't announce every keystroke.
`,
    {
      callout: 'version',
      title: 'Version notes',
      text: '`defineOptions` needs Vue 3.3+, `defineModel` 3.4+, and `useId` / `useTemplateRef` 3.5+. On older versions use the `inheritAttrs: false` option in a normal `<script>`, the `modelValue` prop + `update:modelValue` emit, and a counter-based id (careful with SSR).',
    },
  ],

  walkthrough: {
    title: 'TextField.vue',
    lang: 'vue',
    code: textField,
    intro: 'The reusable input behind the wizard. Every line exists for a reason — mostly so that a screen reader can say the right thing.',
    steps: [
      { lines: [4, 5], text: '`inheritAttrs: false` stops Vue from putting attributes like `type`, `name` and `autocomplete` on the wrapper `<div>`. We will place them on the `<input>` ourselves.' },
      { lines: [7, 8], text: '`defineModel()` makes `v-model` work on `<TextField>` exactly like on `<input>`. Under the hood: a `modelValue` prop plus an `update:modelValue` event.' },
      { lines: [10, 13], text: 'Props are the things the component needs to render the accessibility wiring: a label (required — no unlabeled fields) and an error message.' },
      { lines: [15, 17], text: '`useId()` gives each instance its own id, identical on server and client. The error\'s id is derived from it, so ids never clash when the component appears many times.' },
      { lines: [19, 20], text: '`aria-describedby` lists the elements a screen reader reads after the label. While there is an error, it points at the error paragraph; otherwise it is removed entirely.' },
      { lines: [25], text: 'A real `<label>` with `for` matching the input\'s `id`. That gives the input its accessible name — and clicking the label focuses the input.' },
      { lines: [26], text: '`v-bind="$attrs"` forwards every fallthrough attribute (name, type, autocomplete, required…) onto the input. ⚠️ It does not set `aria-invalid` yet — the first experiment.' },
      { lines: [27], text: 'The error renders only when present, with the id that `aria-describedby` points to.' },
    ],
  },

  playground: {
    title: 'An accessible sign-up wizard',
    objective: 'Finish the accessibility wiring of a reusable TextField and make a three-step form move focus where users expect.',
    files: { 'App.vue': wizardApp, 'TextField.vue': textField },
    expected: 'A three-step form: Account, Profile, Review. **Next** validates only the current step; **Back** keeps everything you typed. The password field is passed a `hint`, but `TextField` doesn\'t render it yet. The **Complete version** variant has every fix applied.',
    experiments: [
      {
        id: 'aria-invalid',
        task: 'Errors are shown as text, but assistive technology isn\'t told the field is invalid. In `TextField.vue`, set `aria-invalid="true"` on the input while there is an error (and remove it otherwise).',
        hint: 'On the `<input>`: `:aria-invalid="error ? \'true\' : undefined"` — binding `undefined` removes the attribute.',
        tests: [
          {
            name: 'invalid fields are marked, fixed fields are not',
            code: `await click('.next')
expect(attr('input[name="email"]', 'aria-invalid')).toBe('true')
await type('input[name="email"]', 'ada@example.com')
expect(find('input[name="email"]').getAttribute('aria-invalid')).not.toBe('true')`,
          },
        ],
        explain: 'One line in the component fixed every field in every form that uses it. Screen readers now announce "invalid" when the field is focused, alongside the error text from `aria-describedby`.',
      },
      {
        id: 'hint-describedby',
        task: 'Add a `hint` prop to `TextField`. When given, render `<p class="hint">` with its own id, and include that id in `aria-describedby` — together with the error id when there is an error.',
        hint: 'Add `hint: { type: String, default: \'\' }` and `const hintId = id + \'-hint\'`. Build `describedBy` from an array: push `hintId` if there is a hint and `errorId` if there is an error, then `join(\' \')` (or `undefined` when empty).',
        tests: [
          {
            name: 'the hint is rendered and linked, alongside errors',
            code: `const hint = find('.hint')
expect(hint).toBeTruthy()
expect(hint.textContent).toContain('8 characters')
expect(hint.id).toBeTruthy()
expect(attr('input[name="password"]', 'aria-describedby') || '').toContain(hint.id)
await click('.next')
const describedBy = attr('input[name="password"]', 'aria-describedby') || ''
const error = find('input[name="password"]').closest('.text-field').querySelector('.error')
expect(describedBy).toContain(hint.id)
expect(describedBy).toContain(error.id)`,
          },
        ],
        explain: 'Before this change, `hint` wasn\'t a prop, so it fell through onto the `<input>` as a meaningless attribute. Now the hint is a real description: screen readers read it after the label, and both hint and error are read when invalid.',
      },
      {
        id: 'focus-heading',
        task: 'After **Next** (or **Back**) moves to another step, focus stays on the button. Move focus to the step\'s `<h2>` instead (it already has `tabindex="-1"`).',
        hint: 'Add `ref="heading"` to the `<h2>`, get it with `useTemplateRef(\'heading\')` (Vue 3.5+) or `ref(null)`, and after changing the step: `await nextTick(); heading.value?.focus()`.',
        tests: [
          {
            name: 'focus lands on the new step heading',
            code: `await type('input[name="email"]', 'ada@example.com')
await type('input[name="password"]', 'longenough')
await click('.next')
await nextTick()
const active = document.activeElement
expect(active.tagName).toBe('H2')
expect(active.textContent).toContain('Step 2')`,
          },
        ],
        explain: 'The page changed under the user\'s feet; moving focus to the new heading tells keyboard and screen-reader users "you are now on step 2" and starts them at the top of it. `tabindex="-1"` makes the heading focusable by script without adding it to the Tab order.',
      },
      {
        id: 'keyboard-only',
        task: 'Put your mouse away. Fill in the whole wizard using only **Tab**, **Shift+Tab**, **Space** (radios) and **Enter** (submits the step). Then try it with your operating system\'s screen reader if you can (VoiceOver on macOS, Narrator on Windows, TalkBack on Android).',
        hint: 'Enter in a text field submits the form, which runs Next — no special key handling needed.',
        explain: 'Native elements give you keyboard support for free: labels focus inputs, arrow keys move between radios in a group, Enter submits. The more you use real HTML elements, the less accessibility code you write yourself.',
      },
    ],
    variants: [
      { id: 'complete', label: 'Complete version (all fixes applied)', files: { 'App.vue': wizardAppComplete, 'TextField.vue': textFieldComplete } },
    ],
  },

  internals: {
    beginner: `
Browsers build an **accessibility tree** next to the DOM: a simplified version of the page that screen readers use. Each element becomes a node with a *role* ("text box", "button"), a *name* (from its label), a *description* (from \`aria-describedby\`) and *states* ("invalid", "required", "checked").

When you link a label with \`for\`/\`id\`, or point \`aria-describedby\` at a hint, you're filling in those fields of the tree. A reusable component fills them in the same way every time.
`,
    technical: [
      `
**Names and descriptions.** The accessible name of an input comes (roughly in priority order) from \`aria-labelledby\`, \`aria-label\`, an associated \`<label>\`, then fallbacks such as \`title\` or \`placeholder\`. The description comes from \`aria-describedby\` (ids are space-separated and read in order). Because these use ids, ids must be unique in the document — which is why reusable components generate them.

**useId().** In Vue 3.5+, \`useId()\` returns an id that is unique within the app and **deterministic**: the server render and the client hydration produce the same value, so there is no hydration mismatch. \`Math.random()\` or a module-level counter would differ between server and client (and a counter would keep growing across SSR requests).

**Attribute fallthrough.** Attributes passed to a component that aren't declared as props or emits land in \`$attrs\`. By default Vue applies them to the root element; \`inheritAttrs: false\` turns that off so you can choose the target with \`v-bind="$attrs"\`. In Vue 3, \`$attrs\` also includes \`class\`, \`style\` and listeners — if you want the wrapper to keep \`class\`, split them yourself.
`,
      {
        code: `// defineModel() is a compiler macro — roughly:
const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])
const model = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
// (the real implementation also keeps a local copy when no v-model is bound)`,
        lang: 'js',
        title: 'defineModel, simplified',
      },
      `
**Live regions.** Content inserted into an element with \`aria-live="polite"\` (or \`role="status"\`) is announced when the screen reader is idle; \`role="alert"\` (assertive) interrupts. Screen readers watch *changes* inside a region that already exists, so it is most reliable to render the region container up front and change its text. Content that is added together with its \`role="alert"\` is generally announced, but behaviour varies between screen readers — test with real ones.

**Focus.** \`element.focus()\` only works on focusable elements; \`tabindex="-1"\` makes a heading or container focusable by script without adding it to the Tab order. In Vue, focus after the DOM has updated — after \`await nextTick()\` — or the element may not exist yet.
`,
    ],
    production: `
- **One input component per control type** (text, select, checkbox, radio group, textarea) in your design system, each owning its label, hint, error and ARIA wiring. See [design systems](lesson:design-systems).
- **Error summaries** for long forms: a focused box at the top listing every error as a link to its field. Common in public-sector design systems because it works well for screen-reader and keyboard users.
- **Multi-step forms:** keep all answers in one parent state (or a store if steps are separate routes), validate per step, re-validate everything on final submit (and on the server), let users go back without losing data, show "Step 2 of 3", and move focus to each step's heading. Consider a route per step so the browser Back button works, with guards that stop people skipping required steps.
- **Test with real tools:** keyboard-only runs, a screen reader, browser accessibility inspectors and automated checkers (they catch a portion of issues, not all). Covered in [E2E and accessibility checks](lesson:e2e-and-quality).
- **Zoom and touch:** labels above fields, generous tap targets, no layout that breaks at 200–400% zoom.
- **\`aria-errormessage\`** exists for linking errors, but support in screen readers has historically been uneven; \`aria-describedby\` is the widely supported choice.
`,
  },

  mistakes: [
    {
      title: 'Using a placeholder as the label',
      wrong: { code: `<input v-model="email" placeholder="Email" />`, lang: 'vue' },
      right: { code: `<label for="email">Email</label>
<input id="email" v-model="email" placeholder="name@example.com" />`, lang: 'vue' },
      explanation: 'Placeholders vanish when typing (users forget what the field was), often have low contrast, and are not a reliable accessible name. Use a visible label; keep placeholders for examples.',
    },
    {
      title: 'Attributes landing on the wrapper instead of the input',
      wrong: { code: `<!-- BaseInput.vue root is <div> -->
<BaseInput type="email" name="email" autocomplete="email" />
<!-- renders <div type="email" name="email" …><input /></div> -->`, lang: 'vue' },
      right: { code: `<script setup>
defineOptions({ inheritAttrs: false })
</script>
<template>
  <div class="field">
    <input v-bind="$attrs" />
  </div>
</template>`, lang: 'vue' },
      explanation: 'Fallthrough attributes go to the root element by default. On a wrapper `<div>` they do nothing — the email keyboard, autofill and validation never reach the input.',
    },
    {
      title: 'Hard-coded or random ids in a reusable component',
      wrong: { code: `<label for="email">Email</label>
<input id="email" />            <!-- two instances → duplicate ids -->

const id = 'f-' + Math.random() // differs between server and client`, lang: 'vue' },
      right: { code: `const id = useId() // Vue 3.5+: unique per instance, SSR-safe`, lang: 'js' },
      explanation: 'Duplicate ids break label association and `aria-describedby` (the first match wins). Random ids cause hydration mismatches with SSR. `useId()` solves both.',
    },
    {
      title: 'Error text that isn\'t connected to the field',
      wrong: { code: `<input id="email" v-model="email" class="invalid" />
<span class="error">Invalid email</span>`, lang: 'vue' },
      right: { code: `<input id="email" v-model="email"
       aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" class="error">Enter an email like name@example.com.</p>`, lang: 'vue' },
      explanation: 'A red border and nearby text are visual-only connections. `aria-invalid` and `aria-describedby` make a screen reader announce the problem when the field is focused.',
    },
    {
      title: 'Leaving focus behind after a step change',
      wrong: { code: `function next() {
  step.value++ // focus stays on the "Next" button, now on a different page
}`, lang: 'js' },
      right: { code: `async function next() {
  step.value++
  await nextTick()
  heading.value?.focus() // <h2 tabindex="-1" ref="heading">
}`, lang: 'js' },
      explanation: 'Without focus management, screen-reader users aren\'t told the content changed, and keyboard users have to hunt for the first field. Move focus to the new step\'s heading.',
    },
  ],

  debugging: [
    {
      symptom: 'Clicking a label doesn\'t focus its input; a screen reader announces "edit text" with no name.',
      cause: 'The label\'s `for` doesn\'t match the input\'s `id` (or ids are duplicated).',
      fix: 'Generate the id once (`useId()`) and use it for both `for` and `id`.',
    },
    {
      symptom: '`type="email"` or `autocomplete` on a custom input has no effect.',
      cause: 'The attributes fell through to the component\'s root wrapper, not the input.',
      fix: '`defineOptions({ inheritAttrs: false })` and `v-bind="$attrs"` on the input.',
    },
    {
      symptom: '"Hydration id mismatch" style warnings with SSR after adding a form component.',
      cause: 'Ids generated with `Math.random()` or a counter differ between server and client.',
      fix: 'Use `useId()` (Vue 3.5+).',
    },
    {
      symptom: 'Calling `focus()` on the new step\'s field does nothing.',
      cause: 'The element isn\'t rendered yet when `focus()` runs.',
      fix: 'Wait for the DOM update with `await nextTick()` first (and make non-interactive targets focusable with `tabindex="-1"`).',
    },
    {
      symptom: 'Screen readers announce every keystroke or repeat messages constantly.',
      cause: 'A live region (often `role="alert"`) re-renders on each input.',
      fix: 'Only announce meaningful changes (on blur/submit), use `polite` for non-urgent messages, and keep live regions small.',
    },
  ],

  bestPractices: [
    'Build one accessible component per input type and use it everywhere.',
    'Visible label for every field; placeholders only as examples.',
    'Generate ids with `useId()`; derive hint/error ids from it.',
    'Link hints and errors with `aria-describedby`; set `aria-invalid` while an error is visible.',
    'Forward attributes to the real input with `inheritAttrs: false` + `v-bind="$attrs"`.',
    'Group radios and checkboxes in `<fieldset>` + `<legend>`; use real buttons.',
    'Manage focus: first error or summary after a failed submit, the new heading after a step change.',
    'In multi-step forms, keep data in one place, validate per step, and validate everything again at the end and on the server.',
  ],

  useCases: [
    'A design-system `TextField`, `SelectField`, `CheckboxField` used by every form in the app.',
    'Sign-up, checkout and onboarding wizards.',
    'Long application forms with an error summary at the top.',
    'Settings toggles built as accessible switches.',
    'Forms that must meet accessibility requirements in contracts or law.',
  ],

  whenToUse: {
    use: [
      'A reusable input component as soon as the same field markup appears twice.',
      '`aria-describedby` for every hint and error; `aria-invalid` for invalid fields.',
      'Focus management whenever content changes without a page load (steps, failed submits, dialogs).',
      'A multi-step form when one long form would overwhelm users or steps depend on earlier answers.',
    ],
    avoid: [
      'ARIA where native HTML already does the job (a `<button>` instead of `<div role="button">`).',
      'Splitting short forms into steps just to look modern.',
      '`role="alert"` for routine, non-urgent messages.',
      'Hiding labels visually without providing an accessible name.',
    ],
  },

  comparison: {
    title: 'Ways to announce feedback',
    headers: ['', 'aria-describedby', 'role="status" / aria-live="polite"', 'role="alert"', 'Moving focus'],
    rows: [
      ['When it is read', 'when the field is focused', 'when the screen reader is idle', 'immediately, interrupting', 'immediately, at the new location'],
      ['Best for', 'hints and field errors', '"Saved", "3 results", "Checking…"', 'urgent errors (failed submit)', 'step changes, error summaries, dialogs'],
      ['Changes where the user is', 'no', 'no', 'no', 'yes'],
      ['Risk if overused', 'long descriptions are tiring', 'chatty announcements', 'constant interruptions', 'disorienting jumps'],
    ],
    note: 'Combine them: describe errors on fields, focus a summary after a failed submit, and use polite status messages for confirmations. More in [accessibility fundamentals](lesson:accessibility-fundamentals) and [accessible components](lesson:accessible-components).',
  },

  quiz: [
    {
      id: 'accessible-reusable-inputs-q1',
      type: 'mcq',
      prompt: 'Which markup gives an input a reliable accessible name **and** makes the label clickable?',
      options: [
        { text: '`<label for="email">Email</label> <input id="email">`' },
        { text: '`<input placeholder="Email">`', why: 'Placeholders disappear while typing and are not a reliable accessible name.' },
        { text: '`<span>Email</span> <input>`', why: 'A nearby span is a visual relationship only.' },
        { text: '`<input title="Email">`', why: '`title` is a weak fallback and isn\'t visible to most users.' },
      ],
      answer: 0,
      explanation: 'A `<label>` linked with `for`/`id` (or wrapping the input) names the field and focuses it when clicked.',
    },
    {
      id: 'accessible-reusable-inputs-q2',
      type: 'output',
      prompt: '`useId()` returned `"v-3"`. The field has a hint and is currently invalid. What is the input\'s `aria-describedby`?',
      code: {
        lang: 'js',
        code: `const id = useId()          // "v-3"
const hintId = id + '-hint'
const errorId = id + '-error'
const describedBy = computed(() =>
  [props.hint && hintId, props.error && errorId].filter(Boolean).join(' ') || undefined)`,
      },
      options: [
        { text: '"v-3-hint v-3-error"' },
        { text: '"v-3-error"', why: 'The hint is present too, and it comes first in the array.' },
        { text: '"v-3-hint,v-3-error"', why: '`join(\' \')` uses a space — and aria-describedby expects space-separated ids.' },
        { text: 'undefined', why: 'Both the hint and the error are present, so the string is not empty.' },
      ],
      answer: 0,
      explanation: 'Both ids are included, space-separated, in order: the screen reader reads the hint, then the error.',
    },
    {
      id: 'accessible-reusable-inputs-q3',
      type: 'bug',
      prompt: 'Sighted users see the error, but screen-reader users hear nothing about it when they focus the field. Click the line to fix.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { useId } from 'vue'
const model = defineModel({ type: String, default: '' })
defineProps({ label: String, error: String })
const id = useId()
</script>

<template>
  <label :for="id">{{ label }}</label>
  <input :id="id" v-model="model" />
  <p v-if="error" :id="id + '-error'" class="error">{{ error }}</p>
</template>`,
      },
      answerLine: 10,
      explanation: 'The input never references the error. Add `:aria-describedby="error ? id + \'-error\' : undefined"` and `:aria-invalid="error ? \'true\' : undefined"` to the input.',
    },
    {
      id: 'accessible-reusable-inputs-q4',
      type: 'fill',
      prompt: 'Complete the reusable input: two-way binding (Vue 3.4+) and an SSR-safe unique id (Vue 3.5+).',
      code: {
        lang: 'js',
        code: `import { useId } from 'vue'

const model = ___({ type: String, default: '' })
const id = ___()`,
      },
      answer: [['defineModel'], ['useId']],
      explanation: '`defineModel()` declares the `v-model` binding; `useId()` returns a unique id that matches between server and client.',
    },
    {
      id: 'accessible-reusable-inputs-q5',
      type: 'mcq',
      prompt: 'A "Draft saved" message appears every few seconds. How should it be announced?',
      options: [
        { text: 'In a `role="status"` (polite) region, so it is read when the screen reader is idle' },
        { text: 'With `role="alert"` so nobody misses it', why: 'Alerts interrupt; a routine confirmation shouldn\'t.' },
        { text: 'By moving focus to the message', why: 'Stealing focus every few seconds would make the form unusable.' },
        { text: 'It shouldn\'t be exposed to screen readers', why: 'Everyone should know their work is saved — just not by interrupting them.' },
      ],
      answer: 0,
      explanation: 'Polite live regions announce non-urgent updates without interrupting or moving focus.',
    },
    {
      id: 'accessible-reusable-inputs-q6',
      type: 'mcq',
      prompt: 'Select **all** good practices for a multi-step form.',
      options: [
        { text: 'Keep every step\'s answers in one parent state (or store) so Back never loses data' },
        { text: 'Validate the current step before moving on, and everything again on final submit' },
        { text: 'Move focus to the new step\'s heading after Next/Back' },
        { text: 'Show "Step 2 of 3" or a similar progress indicator' },
        { text: 'Skip server validation because each step was checked in the browser', why: 'Browser checks can be bypassed; the server always validates.' },
      ],
      answer: [0, 1, 2, 3],
      explanation: 'Data in one place, per-step and final validation, focus management and visible progress make wizards usable. The server still validates everything.',
    },
    {
      id: 'accessible-reusable-inputs-q7',
      type: 'short',
      prompt: 'Why should a multi-step form move focus to the new step\'s heading after the user presses Next?',
      answer: 'Because the content changed without a page load. Focus would otherwise stay on the Next button (or be lost), so screen-reader users aren\'t told that a new step appeared and keyboard users have to hunt for the first field. Focusing the heading (made focusable with tabindex="-1") announces where they are and starts them at the top of the new step.',
    },
  ],

  exercises: [
    {
      id: 'base-select',
      title: 'A reusable, accessible BaseSelect',
      difficulty: 'intermediate',
      prompt: `
Turn \`BaseSelect.vue\` into a reusable select that works like the playground's \`TextField\`:

- **\`v-model\`** support (emit \`update:modelValue\` with the chosen value) — use \`defineModel()\` (Vue 3.4+);
- the \`<label>\`'s \`for\` matches the \`<select>\`'s \`id\`, generated with \`useId()\` (Vue 3.5+);
- non-prop attributes such as \`name\` go on the **\`<select>\`**, not on the wrapper \`<div>\`;
- when \`error\` is set: \`aria-invalid="true"\` on the select, and \`aria-describedby\` pointing at the \`<p class="error">\`.

\`App.vue\` already uses it with \`v-model\` and shows the choice in \`.chosen\`.
`,
      files: { 'App.vue': selectApp, 'BaseSelect.vue': baseSelectStarter },
      hints: [
        '`const model = defineModel({ type: String, default: \'\' })` and `v-model="model"` on the `<select>`.',
        '`const id = useId()`; use `:for="id"` and `:id="id"`. Add `defineOptions({ inheritAttrs: false })` and `v-bind="$attrs"` on the select.',
        'Give the error paragraph `:id="id + \'-error\'"` and bind `:aria-describedby` / `:aria-invalid` on the select only when `error` is set.',
      ],
      solution: {
        explanation: 'The component owns all the wiring — label association, generated ids, error description, invalid state and attribute forwarding — so every form that uses it gets them right automatically. `defineModel` makes it feel exactly like a native `<select>` with `v-model`.',
        files: { 'App.vue': selectApp, 'BaseSelect.vue': baseSelectSolution },
      },
      tests: [
        {
          name: 'the label is linked to the select',
          code: `const w = mountFile('BaseSelect.vue', { label: 'Size', options: [{ value: 's', label: 'Small' }] })
const id = w.find('select').id
expect(id).toBeTruthy()
expect(w.find('label').getAttribute('for')).toBe(id)`,
        },
        {
          name: 'choosing an option emits update:modelValue',
          code: `const w = mountFile('BaseSelect.vue', { label: 'Size', modelValue: '', options: [{ value: 's', label: 'Small' }, { value: 'm', label: 'Medium' }] })
await select(w.find('select'), 'm')
expect(w.emitted('update:modelValue')[0]).toEqual(['m'])`,
        },
        {
          name: 'attributes land on the select, not the wrapper',
          code: `const w = mountFile('BaseSelect.vue', { label: 'Size', name: 'size', options: [] })
expect(w.find('select').getAttribute('name')).toBe('size')
expect(w.find('.base-select').getAttribute('name')).toBeNull()`,
        },
        {
          name: 'errors are announced',
          code: `const w = mountFile('BaseSelect.vue', { label: 'Size', options: [], error: '' })
expect(w.find('select').getAttribute('aria-invalid')).not.toBe('true')
await w.setProps({ error: 'Please choose a size.' })
const sel = w.find('select')
expect(sel.getAttribute('aria-invalid')).toBe('true')
const describedBy = sel.getAttribute('aria-describedby')
expect(describedBy).toBeTruthy()
expect(w.find('#' + describedBy.split(' ')[0]).textContent).toContain('Please choose a size')`,
        },
        {
          name: 'v-model works inside the app',
          code: `await select('select', 'l')
expect(text('.chosen')).toBe('Chosen: l')
expect(exists('.error')).toBe(false)`,
        },
      ],
    },
    {
      id: 'error-summary',
      title: 'An error summary that takes focus',
      difficulty: 'advanced',
      prompt: `
The contact form validates on submit, and each \`TextField\` already shows its own error. Add an **error summary** in \`App.vue\` for when a submit fails:

- render \`<div class="error-summary" role="alert" tabindex="-1">\` at the top of the form, only after a failed submit while errors remain;
- inside: an \`<h2>\` reading \`There is 1 problem\` or \`There are N problems\`, and a list with one link per error — \`<a href="#contact-name">Enter your name.</a>\` etc. (the fields have ids \`contact-name\`, \`contact-email\`, \`contact-message\`);
- after a failed submit, **move focus** to the summary;
- a successful submit shows \`.sent\` as before.
`,
      files: { 'App.vue': summaryStarter, 'TextField.vue': summaryTextField },
      hints: [
        'Build a computed list from `errors`: map each field to `{ id, message }` using a small `{ name: \'contact-name\', … }` lookup.',
        'Render the summary with `v-if="submitAttempted && errorList.length"`, a `ref="summary"`, and links with `:href="\'#\' + item.id"`.',
        'In `onSubmit`, when there are errors: `await nextTick()` then `summary.value?.focus()` (make `onSubmit` async).',
      ],
      solution: {
        explanation: 'The summary gives keyboard and screen-reader users one place that explains everything wrong, and each link jumps straight to its field. It is derived from the same `errors` computed as the inline messages, so the two can never disagree. Focusing it (it has `tabindex="-1"`) makes screen readers read it immediately.',
        files: { 'App.vue': summarySolution, 'TextField.vue': summaryTextField },
      },
      tests: [
        { name: 'no summary before submitting', code: `expect(exists('.error-summary')).toBe(false)` },
        {
          name: 'a failed submit shows a linked summary',
          code: `await submit('form')
expect(attr('.error-summary', 'role')).toBe('alert')
expect(text('.error-summary h2')).toBe('There are 3 problems')
const hrefs = findAll('.error-summary a').map((a) => a.getAttribute('href'))
expect(hrefs).toEqual(['#contact-name', '#contact-email', '#contact-message'])`,
        },
        {
          name: 'focus moves to the summary',
          code: `await submit('form')
await nextTick()
expect(document.activeElement && document.activeElement.classList.contains('error-summary')).toBe(true)`,
        },
        {
          name: 'the count updates as errors are fixed',
          code: `await type('#contact-name', 'Ada')
await type('#contact-email', 'ada@example.com')
await submit('form')
expect(text('.error-summary h2')).toBe('There is 1 problem')
expect(text('.error-summary')).toContain('Write at least 10 characters.')`,
        },
        {
          name: 'a valid submit sends',
          code: `await type('#contact-name', 'Ada')
await type('#contact-email', 'ada@example.com')
await type('#contact-message', 'Hello, I have a question.')
await submit('form')
expect(exists('.sent')).toBe(true)
expect(exists('.error-summary')).toBe(false)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'accessible-reusable-inputs-validate-accessibly',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'How do you make form validation accessible?',
      answer: 'Give every field a visible, associated label. Show errors as text (not colour alone), connect them to the field with `aria-describedby`, and set `aria-invalid="true"` while invalid. Don\'t show errors before the user has had a chance (touched or submit). After a failed submit, move focus to the first invalid field or to an error summary that links to each field; use live regions (`role="alert"` for urgent errors, `role="status"` for confirmations) sparingly. Keep `required` on required fields, use native elements, and test with a keyboard and a screen reader.',
      explanation: 'Accessible validation = the same information, delivered through name, description, state and focus instead of only visuals.',
      whyAsked: 'A classic question for frontend roles; accessibility is increasingly a legal and contractual requirement.',
      mistakes: ['Only mentioning red borders or icons.', 'Using `role="alert"` on every field and every keystroke.', 'Disabling submit with no explanation.', 'Forgetting focus management.'],
      followUps: ['When would you use an error summary?', 'How do you test this?', 'aria-describedby or aria-errormessage?'],
      modelAnswer: 'I start with labels linked to every input and native elements. Errors appear as text after a field is touched or a submit is attempted, they are linked with aria-describedby and the input gets aria-invalid, so a screen reader announces the problem when the field is focused. After a failed submit I move focus to the first invalid field or, for long forms, an error summary with links to each field. I use live regions sparingly — alert for urgent errors, status for confirmations — and I test with only a keyboard and a real screen reader. I wrap all of this in reusable input components so it is consistent everywhere.',
    },
    {
      id: 'accessible-reusable-inputs-placeholder',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A designer wants inputs with only placeholders, no labels, "to look clean". What problems does that cause, and what would you suggest?',
      answer: 'Placeholders disappear while typing, so users (especially with memory or attention difficulties) forget what the field is; they often have low contrast; and they aren\'t a reliable accessible name. Suggest visible labels above fields (placeholders only for examples), or a floating-label pattern that keeps a real `<label>` visible at all times.',
      explanation: 'A label must stay visible and programmatically associated.',
      whyAsked: 'Tests whether you can advocate for accessibility in design discussions.',
      mistakes: ['Adding `aria-label` and calling it done — sighted users still lose the label.', 'Saying placeholders are fine because screen readers may read them.'],
      followUps: ['Is a visually hidden label ever acceptable?', 'How do floating labels need to be built to stay accessible?'],
      modelAnswer: 'Placeholder-only fields lose their label as soon as someone types, often fail contrast requirements, and aren\'t a dependable accessible name. I would propose visible labels above each field and use placeholders only for examples like name@example.com. If the design really wants a compact look, a floating label works as long as it is a real label element that stays visible.',
    },
    {
      id: 'accessible-reusable-inputs-attrs',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate\'s `<BaseInput type="email" autocomplete="email" />` doesn\'t show the email keyboard on phones or autofill. The component renders `<div class="field"><label/><input v-model="model"/></div>`. Why, and how do you fix it?',
      answer: 'Undeclared attributes fall through to the component\'s root element — the wrapper `<div>` — so the input never receives `type` or `autocomplete`. Add `defineOptions({ inheritAttrs: false })` (3.3+) and `v-bind="$attrs"` on the `<input>`. If the wrapper should keep `class`/`style`, split those out of `$attrs` explicitly.',
      explanation: 'Fallthrough attributes target the root by default.',
      whyAsked: 'A very common reusable-component bug; tests knowledge of `$attrs`.',
      mistakes: ['Declaring every possible HTML attribute as a prop.', 'Not knowing `$attrs` includes class and listeners in Vue 3.'],
      followUps: ['What else is in `$attrs` in Vue 3?', 'How do you type `$attrs` in TypeScript?'],
      modelAnswer: 'Attributes that aren\'t props go to the component\'s root element, which here is the wrapper div, so type and autocomplete never reach the input. I would turn off the automatic behaviour with inheritAttrs false and bind $attrs onto the input. In Vue 3 $attrs also carries class, style and listeners, so if the wrapper needs the class I would separate it out.',
    },
    {
      id: 'accessible-reusable-inputs-useid',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 3,
      question: 'Why use `useId()` in a form component instead of `Math.random()` or a module-level counter?',
      answer: '`useId()` (Vue 3.5+) generates ids that are unique within the app and identical between server rendering and client hydration. `Math.random()` produces a different id on the client, causing hydration mismatches and broken label/aria links; a module-level counter on the server keeps growing across requests, so server and client values diverge too. Hard-coded ids break as soon as the component is used twice.',
      explanation: 'Accessibility relies on ids; ids must be unique and stable.',
      whyAsked: 'Tests awareness of SSR, hydration and modern Vue APIs.',
      mistakes: ['Not knowing `useId` exists or its version.', 'Thinking random ids are fine without SSR — they also change on remount, which breaks tests and snapshots.'],
      followUps: ['What did people do before 3.5?', 'What is `app.config.idPrefix` for?'],
      modelAnswer: 'Labels and aria-describedby work through ids, so they must be unique on the page and the same on server and client. useId, added in Vue 3.5, does exactly that. Math.random gives a different id when the client hydrates, and a module-level counter on the server keeps incrementing across requests, so both can mismatch. Hard-coding breaks the moment the component appears twice.',
    },
    {
      id: 'accessible-reusable-inputs-multistep',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design a multi-step checkout form (shipping → payment → review) in Vue. Where does state live, how do you validate, and what about accessibility and navigation?',
      answer: 'State: one source of truth for all steps — a parent component\'s reactive object if steps are components on one page, or a Pinia store / composable if each step is a route. Validation: per-step rules before moving on, all rules again on final submit, and the server re-validates and may return field errors mapped back to the right step. Navigation: optionally a route per step so the Back button works, with guards preventing skipping ahead; Back never loses data; consider saving a draft. Accessibility: "Step 2 of 3" progress, focus the new step\'s heading on change, focus the first error on a failed step, fieldset/legend groups, live region for async status.',
      explanation: 'Treat the wizard as one form split across views — one state, layered validation, explicit focus.',
      whyAsked: 'Combines state management, routing, validation and accessibility judgement.',
      mistakes: ['Each step owning its own local state, so data vanishes on Back.', 'Only validating the last step.', 'Ignoring browser Back behaviour.', 'No focus management.'],
      followUps: ['How would you restore a half-finished checkout after a reload?', 'How do you map a server error to step 1 when the user is on step 3?'],
      modelAnswer: 'I treat it as one form split into views. All answers live in one place — a parent component for a single-page wizard, or a Pinia store if each step is a route, which also makes the browser Back button work, with guards so nobody skips ahead. Each step validates its own fields, the final submit validates everything, and the server validates again; if it returns an error for a shipping field I send the user back to that step with the error shown. For accessibility I show "Step 2 of 3", move focus to each step\'s heading, focus the first error on a failed Next, and use fieldsets for groups.',
    },
    {
      id: 'accessible-reusable-inputs-live-regions',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Your form shows "Checking availability…", "Username available", a "Saved" toast and an error banner after a failed submit. Which announcement technique fits each?',
      answer: '"Checking…" and "Username available": a polite live region next to the field (`aria-live="polite"`), announced without interrupting. "Saved": `role="status"` (polite). The failed-submit banner: `role="alert"` (assertive) — or better, move focus to an error summary. Don\'t announce on every keystroke; render the live region container up front and change its text.',
      explanation: 'Match urgency to the technique: polite for routine updates, assertive or focus for blocking errors.',
      whyAsked: 'Shows nuanced, practical accessibility knowledge.',
      mistakes: ['Making everything `role="alert"`.', 'Moving focus for routine messages.', 'Creating the live region at the same moment as its content and assuming it will always be read.'],
      followUps: ['Why render live regions before their content changes?', 'How would you test announcements?'],
      modelAnswer: 'Availability updates are routine, so they go in a polite live region next to the field; "Saved" is a role="status" message. The failed submit is urgent: either a role="alert" banner or, better, I move focus to an error summary listing each problem. I keep live regions small, render their containers up front and only change the text, and avoid announcing on every keystroke. I verify with a real screen reader because announcement behaviour varies.',
    },
    {
      id: 'accessible-reusable-inputs-coding-switch',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Build an accessible `ToggleSwitch.vue` that works with `v-model` (a boolean). It must be a real `<button type="button" class="toggle">` with `role="switch"`, `aria-checked` set to `"true"`/`"false"`, its label as visible text, and clicking it must toggle the value.',
      starter: { files: { 'App.vue': switchApp, 'ToggleSwitch.vue': switchStarter } },
      tests: [
        {
          name: 'renders a switch button with its state',
          code: `const btn = find('.toggle')
expect(btn.tagName).toBe('BUTTON')
expect(btn.getAttribute('role')).toBe('switch')
expect(btn.getAttribute('aria-checked')).toBe('true')
expect(btn.textContent).toContain('Email notifications')`,
        },
        {
          name: 'clicking toggles v-model and aria-checked',
          code: `await click('.toggle')
expect(text('.status')).toBe('Emails are off')
expect(attr('.toggle', 'aria-checked')).toBe('false')
await click('.toggle')
expect(text('.status')).toBe('Emails are on')`,
        },
        {
          name: 'emits update:modelValue',
          code: `const w = mountFile('ToggleSwitch.vue', { label: 'Dark mode', modelValue: false })
await click(w.find('.toggle'))
expect(w.emitted('update:modelValue')[0]).toEqual([true])`,
        },
      ],
      hints: ['`const on = defineModel({ type: Boolean, default: false })` gives you the v-model.', 'Use `<button type="button" role="switch" :aria-checked="on ? \'true\' : \'false\'" @click="on = !on">` with the label inside.'],
      answer: 'A `<button role="switch">` bound to a `defineModel` boolean, with `aria-checked` mirroring it and the label as its text.',
      solution: { files: { 'App.vue': switchApp, 'ToggleSwitch.vue': switchSolution } },
      explanation: 'A real button is focusable and activated by Space and Enter without extra code; `role="switch"` plus `aria-checked` tell assistive technology it is an on/off control and its state. `defineModel` makes it work with `v-model` like a native checkbox.',
      whyAsked: 'Custom controls are where accessibility usually breaks; this checks you start from native elements.',
      mistakes: ['Using a `<div @click>` (not focusable, no keyboard support).', 'Forgetting `type="button"` inside forms.', 'Showing state only with colour.'],
      followUps: ['Why not just style a checkbox?', 'How would you label it if the visible text lived elsewhere?'],
      modelAnswer: 'I start from a real button so it is focusable and Space and Enter work for free, with type="button" so it never submits a form. role="switch" with aria-checked tells screen readers it is an on/off control and what state it is in, and the label is the button\'s visible text, which gives it its accessible name. The value comes from defineModel, so parents just use v-model. A styled native checkbox is an equally good alternative.',
    },
  ],

  takeaways: [
    'Accessible forms start with native HTML: real labels, buttons, fieldsets and legends.',
    'Connect hints and errors with `aria-describedby`; mark invalid fields with `aria-invalid`.',
    'Wrap the wiring in reusable components: `defineModel` (3.4+), `useId` (3.5+), `inheritAttrs: false` + `v-bind="$attrs"`.',
    'Manage focus: the first error or an error summary after a failed submit, the new heading after a step change.',
    'Use live regions sparingly: polite for routine updates, alert for urgent errors.',
    'Multi-step forms: one source of truth, per-step and final validation, Back never loses data — and the server validates again.',
  ],
}
