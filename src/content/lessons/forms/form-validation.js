// Lesson: Client-side validation, touched & dirty

const signupApp = `<script setup>
import { reactive, ref, computed } from 'vue'

function initialValues() {
  return { name: '', email: '', age: '', password: '', confirm: '', business: false, company: '' }
}

const values = reactive(initialValues())
const touched = reactive({}) // field → true once the user has left it
const submitAttempted = ref(false)
const submitted = ref(null)

// Simplified check: "something@something.something" (real proof = a confirmation email)
const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/

// Errors are DERIVED from values — one computed, never edited by hand
const errors = computed(() => {
  const e = {}
  if (!values.name) e.name = 'Please enter your name.'

  if (!values.email) e.email = 'Please enter your email.'
  else if (!EMAIL.test(values.email)) e.email = 'Enter an email like name@example.com.'

  // optional — but if filled in, a whole number from 13 to 120
  if (values.age !== '' && !(Number.isInteger(values.age) && values.age >= 13 && values.age <= 120)) {
    e.age = 'Age must be a whole number from 13 to 120.'
  }

  if (!values.password) e.password = 'Please choose a password.'
  return e
})

const isValid = computed(() => Object.keys(errors.value).length === 0)

// Show an error only after the user had a fair chance: left the field, or tried to submit
function visibleError(field) {
  return touched[field] || submitAttempted.value ? errors.value[field] : ''
}

function onSubmit() {
  submitAttempted.value = true
  if (!isValid.value) return
  submitted.value = { ...values }
}

function reset() {
  Object.assign(values, initialValues())
  Object.keys(touched).forEach((field) => delete touched[field])
  submitAttempted.value = false
  submitted.value = null
}
</script>

<template>
  <p v-if="submitted" class="success">Welcome aboard, {{ submitted.name }}!</p>

  <form novalidate @submit.prevent="onSubmit">
    <div class="field">
      <label for="name">Name</label>
      <input id="name" v-model.trim="values.name" @blur="touched.name = true" :aria-invalid="!!visibleError('name')" />
      <p v-if="visibleError('name')" id="name-error" class="error">{{ visibleError('name') }}</p>
    </div>

    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" v-model.trim="values.email" @blur="touched.email = true" :aria-invalid="!!visibleError('email')" />
      <p v-if="visibleError('email')" id="email-error" class="error">{{ visibleError('email') }}</p>
    </div>

    <div class="field">
      <label for="age">Age (optional)</label>
      <input id="age" type="number" v-model="values.age" @blur="touched.age = true" :aria-invalid="!!visibleError('age')" />
      <p v-if="visibleError('age')" id="age-error" class="error">{{ visibleError('age') }}</p>
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input id="password" type="password" v-model="values.password" @blur="touched.password = true" :aria-invalid="!!visibleError('password')" />
      <p v-if="visibleError('password')" id="password-error" class="error">{{ visibleError('password') }}</p>
    </div>

    <div class="field">
      <label for="confirm">Confirm password</label>
      <input id="confirm" type="password" v-model="values.confirm" @blur="touched.confirm = true" :aria-invalid="!!visibleError('confirm')" />
      <p v-if="visibleError('confirm')" id="confirm-error" class="error">{{ visibleError('confirm') }}</p>
    </div>

    <label><input id="business" type="checkbox" v-model="values.business" /> This is a business account</label>

    <div v-if="values.business" class="field">
      <label for="company">Company name</label>
      <input id="company" v-model.trim="values.company" @blur="touched.company = true" :aria-invalid="!!visibleError('company')" />
      <p v-if="visibleError('company')" id="company-error" class="error">{{ visibleError('company') }}</p>
    </div>

    <button type="submit">Create account</button>
    <button type="button" class="reset" @click="reset">Reset</button>
  </form>
</template>

<style>
.field { display: grid; gap: 2px; margin-bottom: 8px; max-width: 320px; }
.error { color: #b00020; margin: 0; font-size: 0.9em; }
input[aria-invalid="true"] { border-color: #b00020; }
.success { background: #e7f7ea; padding: 8px; }
</style>`

// ---- exercise: login validation
const loginStarter = `<script setup>
import { reactive, ref } from 'vue'

const values = reactive({ email: '', password: '' })
const loggedIn = ref(false)

function onSubmit() {
  loggedIn.value = true
}
</script>

<template>
  <p v-if="loggedIn" class="success">Logged in as {{ values.email }}</p>

  <form v-else novalidate @submit.prevent="onSubmit">
    <label for="email">Email</label>
    <input id="email" type="email" v-model.trim="values.email" />

    <label for="password">Password</label>
    <input id="password" type="password" v-model="values.password" />

    <button type="submit">Log in</button>
  </form>
</template>`

const loginSolution = `<script setup>
import { reactive, ref, computed } from 'vue'

const values = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const submitAttempted = ref(false)
const loggedIn = ref(false)

const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ // simplified

const errors = computed(() => {
  const e = {}
  if (!values.email) e.email = 'Email is required.'
  else if (!EMAIL.test(values.email)) e.email = 'Enter a valid email address.'
  if (!values.password) e.password = 'Password is required.'
  return e
})

function show(field) {
  return (touched[field] || submitAttempted.value) && errors.value[field]
}

function onSubmit() {
  submitAttempted.value = true
  if (Object.keys(errors.value).length) return
  loggedIn.value = true
}
</script>

<template>
  <p v-if="loggedIn" class="success">Logged in as {{ values.email }}</p>

  <form v-else novalidate @submit.prevent="onSubmit">
    <label for="email">Email</label>
    <input id="email" type="email" v-model.trim="values.email"
      @blur="touched.email = true" :aria-invalid="show('email') ? 'true' : 'false'" />
    <p v-if="show('email')" id="email-error" class="error">{{ errors.email }}</p>

    <label for="password">Password</label>
    <input id="password" type="password" v-model="values.password"
      @blur="touched.password = true" :aria-invalid="show('password') ? 'true' : 'false'" />
    <p v-if="show('password')" id="password-error" class="error">{{ errors.password }}</p>

    <button type="submit">Log in</button>
  </form>
</template>`

// ---- exercise: booking with cross-field + conditional rules
const bookingStarter = `<script setup>
import { reactive, ref, computed } from 'vue'

const values = reactive({ checkIn: '', checkOut: '', guests: 2, pets: false, petName: '' })
const submitAttempted = ref(false)
const booked = ref(null)

const errors = computed(() => {
  const e = {}
  // TODO: checkIn required; checkOut required and AFTER checkIn
  // TODO: guests a whole number from 1 to 6
  // TODO: petName required only when pets is checked
  return e
})

function onSubmit() {
  submitAttempted.value = true
  if (Object.keys(errors.value).length) return
  booked.value = { ...values }
}
</script>

<template>
  <p v-if="booked" class="success">
    Booked: {{ booked.checkIn }} → {{ booked.checkOut }} for {{ booked.guests }} guests
  </p>

  <form novalidate @submit.prevent="onSubmit">
    <label for="checkin">Check-in</label>
    <input id="checkin" type="date" v-model="values.checkIn" />
    <p v-if="submitAttempted && errors.checkIn" id="checkin-error" class="error">{{ errors.checkIn }}</p>

    <label for="checkout">Check-out</label>
    <input id="checkout" type="date" v-model="values.checkOut" />
    <p v-if="submitAttempted && errors.checkOut" id="checkout-error" class="error">{{ errors.checkOut }}</p>

    <label for="guests">Guests</label>
    <input id="guests" type="number" min="1" max="6" v-model="values.guests" />
    <p v-if="submitAttempted && errors.guests" id="guests-error" class="error">{{ errors.guests }}</p>

    <label><input id="pets" type="checkbox" v-model="values.pets" /> Bringing a pet</label>
    <template v-if="values.pets">
      <label for="pet-name">Pet's name</label>
      <input id="pet-name" v-model.trim="values.petName" />
      <p v-if="submitAttempted && errors.petName" id="pet-name-error" class="error">{{ errors.petName }}</p>
    </template>

    <button type="submit">Book</button>
  </form>
</template>`

const bookingSolution = bookingStarter.replace(
  `  // TODO: checkIn required; checkOut required and AFTER checkIn
  // TODO: guests a whole number from 1 to 6
  // TODO: petName required only when pets is checked`,
  `  if (!values.checkIn) e.checkIn = 'Choose a check-in date.'

  // cross-field: compares two values. ISO dates (YYYY-MM-DD) compare correctly as strings.
  if (!values.checkOut) e.checkOut = 'Choose a check-out date.'
  else if (values.checkIn && values.checkOut <= values.checkIn) {
    e.checkOut = 'Check-out must be after check-in.'
  }

  const g = values.guests
  if (!Number.isInteger(g) || g < 1 || g > 6) e.guests = 'Guests must be a whole number from 1 to 6.'

  // conditional: only applies when another field says so
  if (values.pets && !values.petName) e.petName = 'Tell us your pet\\'s name.'`,
)

// ---- interview coding: touched-based error display
const touchedStarter = `<script setup>
import { reactive, ref, computed } from 'vue'

const values = reactive({ username: '', city: '' })
const done = ref(false)

const errors = computed(() => {
  const e = {}
  if (values.username.length < 3) e.username = 'At least 3 characters.'
  if (!values.city) e.city = 'City is required.'
  return e
})

// TODO: only show an error once its field was blurred, or after a submit attempt
function visible(field) {
  return errors.value[field]
}

function onSubmit() {
  if (Object.keys(errors.value).length) return
  done.value = true
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <label for="username">Username</label>
    <input id="username" v-model.trim="values.username" />
    <p v-if="visible('username')" id="username-error" class="error">{{ visible('username') }}</p>

    <label for="city">City</label>
    <input id="city" v-model.trim="values.city" />
    <p v-if="visible('city')" id="city-error" class="error">{{ visible('city') }}</p>

    <button type="submit">Save</button>
  </form>
  <p v-if="done" class="done">Saved!</p>
</template>`

const touchedSolution = `<script setup>
import { reactive, ref, computed } from 'vue'

const values = reactive({ username: '', city: '' })
const touched = reactive({})
const submitAttempted = ref(false)
const done = ref(false)

const errors = computed(() => {
  const e = {}
  if (values.username.length < 3) e.username = 'At least 3 characters.'
  if (!values.city) e.city = 'City is required.'
  return e
})

function visible(field) {
  return touched[field] || submitAttempted.value ? errors.value[field] : ''
}

function onSubmit() {
  submitAttempted.value = true
  if (Object.keys(errors.value).length) return
  done.value = true
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <label for="username">Username</label>
    <input id="username" v-model.trim="values.username" @blur="touched.username = true" />
    <p v-if="visible('username')" id="username-error" class="error">{{ visible('username') }}</p>

    <label for="city">City</label>
    <input id="city" v-model.trim="values.city" @blur="touched.city = true" />
    <p v-if="visible('city')" id="city-error" class="error">{{ visible('city') }}</p>

    <button type="submit">Save</button>
  </form>
  <p v-if="done" class="done">Saved!</p>
</template>`

export default {
  id: 'form-validation',
  title: 'Client-side validation, touched & dirty',
  summary: 'Validate forms with computed error objects — required, format, numeric, cross-field and conditional rules — and show friendly messages at the right moment using touched and dirty state.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['native-form-handling', 'computed'],
  related: ['advanced-forms', 'accessible-reusable-inputs', 'composables-intro', 'watch'],
  tags: ['forms', 'validation', 'errors', 'touched', 'dirty', 'pristine', 'required', 'email', 'cross-field', 'conditional', 'reset', 'novalidate'],
  apis: [
    { name: 'computed errors', summary: 'A `computed` that returns `{ field: message }` for every failing rule — derived from values, never stored by hand.' },
    { name: 'touched', summary: 'A field the user has visited and left (blur). Used to decide when to show its error.' },
    { name: 'dirty', summary: 'A form (or field) whose current value differs from its initial value — "unsaved changes".' },
    { name: 'novalidate', summary: 'HTML attribute that turns off the browser\'s built-in validation bubbles so your own messages are shown.' },
  ],
  docs: [
    { label: 'Vue Guide — Computed Properties', url: 'https://vuejs.org/guide/essentials/computed.html' },
    { label: 'Vue Guide — Form Input Bindings', url: 'https://vuejs.org/guide/essentials/forms.html' },
    { label: 'MDN — Client-side form validation', url: 'https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation' },
  ],

  intro: `
*Validation* means checking the user's input against rules before you accept it: is the email filled in and shaped like an email? Is the age a sensible number? Do the two passwords match?

Good validation is kind. It doesn't shout "INVALID" at a field the user hasn't even reached yet, and it doesn't wait until they press Submit to mention a problem they could have fixed a minute ago. To get the timing right, forms track two extra facts about each field:

- **touched** — has the user visited this field and left it?
- **dirty** — is the value different from what it started as?

In Vue, the rules themselves fit beautifully into one \`computed\`: an object of error messages that recalculates whenever any value changes.
`,

  why: `
Why validate in the browser at all, if the server checks everything anyway (and it **must**)?

Because a round trip to the server for "you forgot the @ in your email" is slow and frustrating. Client-side validation gives instant, specific feedback, prevents pointless requests, and guides people through the form.

But naive client-side validation creates new problems:

- errors that appear on page load, before the user has typed anything;
- errors that flash red on the first keystroke of an email address ("n" is not a valid email!);
- error messages stored in variables that drift out of sync with the actual values;
- a "passwords don't match" message that doesn't update when the *first* password changes.

Deriving errors with \`computed\` fixes the sync problems. Tracking **touched** and **submit attempts** fixes the timing problems.
`,

  eli15: `
Imagine a teacher checking a worksheet.

A bad teacher stands over your shoulder and says "wrong!" while you're still writing the first letter of the answer. Another bad teacher says nothing until you hand the whole thing in, then gives it back covered in red.

A good teacher waits until you've **finished a question and moved on** (that's *touched*), then gently points out a mistake on that question. And if you try to hand in the worksheet with blanks, they point at **every** blank at once (that's the *submit attempt*).

*Dirty* is simpler: it just means "you've written something different from what was there at the start" — useful for warning "you have unsaved changes" before someone leaves the page.
`,

  analogy: {
    title: 'A kind teacher marking a worksheet',
    body: `
The teacher has a list of rules ("every answer filled in", "dates in order", "if you ticked 'other', explain"). They check against those rules constantly in their head — but they only *say* something about a question once you've moved past it, or once you try to hand the sheet in.

They never keep a separate list of mistakes that could fall out of date: they look at your current answers every time. And if you rub everything out and start again, the sheet is back to "untouched" — no red marks.
`,
    mapping: [
      ['the rules in the teacher\'s head', 'the `errors` computed'],
      ['looking at your current answers every time', 'errors derived from values, recalculated automatically'],
      ['you finished a question and moved on', '`touched[field]` set on blur'],
      ['trying to hand the sheet in', '`submitAttempted` — show every error'],
      ['you changed an answer', 'dirty: value differs from the initial value'],
      ['rubbing everything out', 'reset values, touched and submit state'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The life of a field',
    caption: 'A field moves from pristine to dirty and touched. Its error always exists in the computed — the question is only whether to show it yet.',
    alt: 'A diagram of a field\'s states. Pristine and untouched at first. Typing makes it dirty. Leaving the field makes it touched. The errors computed always knows whether the value is valid; the error is shown when the field is touched or a submit was attempted.',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'pristine', label: 'Pristine', note: 'untouched, initial value', x: 100, y: 80, tone: 'paper' },
        { id: 'dirty', label: 'Dirty', note: 'value ≠ initial', x: 330, y: 80, tone: 'kraft' },
        { id: 'touched', label: 'Touched', note: 'user left the field', x: 560, y: 80, tone: 'cobalt' },
        { id: 'errors', label: 'errors (computed)', note: 'always up to date', x: 330, y: 230, tone: 'acid' },
        { id: 'shown', label: 'Error shown', note: 'touched OR submitted', x: 600, y: 230, tone: 'red' },
      ],
      edges: [
        { from: 'pristine', to: 'dirty', label: 'types' },
        { from: 'dirty', to: 'touched', label: 'blur' },
        { from: 'dirty', to: 'errors', label: 'value changes', dashed: true },
        { from: 'touched', to: 'shown' },
        { from: 'errors', to: 'shown' },
      ],
      steps: [
        { focus: ['pristine'], text: 'At first a field is **pristine** (unchanged) and **untouched**. It may already be invalid — an empty required field — but showing an error now would be rude.' },
        { focus: ['dirty'], edges: ['pristine->dirty'], text: 'The user types. The field is now **dirty**: its value differs from the initial one. The form can warn about unsaved changes.' },
        { focus: ['errors'], edges: ['dirty->errors'], text: 'Every change re-runs the `errors` computed. It always knows exactly which rules fail — there is no separate error state to forget to update.' },
        { focus: ['touched'], edges: ['dirty->touched'], text: 'The user leaves the field (**blur**). Now it is **touched**: they have had a fair chance to finish typing.' },
        { focus: ['shown'], edges: ['touched->shown', 'errors->shown'], text: 'An error is **shown** when the field is touched *or* a submit was attempted — and only if the computed has an error for it. Fixing the value makes the message disappear instantly.' },
      ],
    },
  },

  animation: {
    type: 'concept-diagram',
    title: 'From values to a safe submit',
    caption: 'Rules run in the browser for speed and kindness; the server runs them again for safety.',
    alt: 'A pipeline: form values feed the errors computed, which feeds isValid. On submit, the handler marks the attempt, stops if invalid and focuses the first error, otherwise sends the data. The server validates again and may return its own errors.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'values', label: 'values', note: 'reactive form', tone: 'paper' },
        { id: 'errors', label: 'errors', note: 'computed rules', tone: 'acid' },
        { id: 'submit', label: 'onSubmit', note: 'submitAttempted = true', tone: 'cobalt' },
        { id: 'gate', label: 'isValid?', note: 'no → show all, focus first', tone: 'red' },
        { id: 'server', label: 'Server', note: 'validates again', tone: 'ink' },
      ],
      edges: [
        { from: 'values', to: 'errors' },
        { from: 'errors', to: 'submit' },
        { from: 'submit', to: 'gate' },
        { from: 'gate', to: 'server', label: 'valid' },
      ],
      steps: [
        { focus: ['values'], text: 'The user edits the form; `v-model` keeps `values` up to date.' },
        { focus: ['errors'], edges: ['values->errors'], text: 'The `errors` computed re-evaluates every rule: required, format, numeric ranges, cross-field comparisons, conditional rules.' },
        { focus: ['submit'], edges: ['errors->submit'], text: 'On submit, the handler first records the attempt, which makes every remaining error visible.' },
        { focus: ['gate'], edges: ['submit->gate'], text: 'If anything is invalid, stop. Good forms also move focus to the first invalid field so keyboard and screen-reader users land on the problem.' },
        { focus: ['server'], edges: ['gate->server'], text: 'Only valid data is sent — but the **server validates again**, because anyone can bypass browser code. Its errors come back to the form (see [advanced forms](lesson:advanced-forms)).' },
      ],
    },
  },

  syntax: [
    `
#### Errors as a computed
`,
    {
      code: `const values = reactive({ email: '', password: '', confirm: '' })

const errors = computed(() => {
  const e = {}
  if (!values.email) e.email = 'Please enter your email.'                 // required
  else if (!EMAIL.test(values.email)) e.email = 'That email looks wrong.' // format
  if (values.password.length < 8) e.password = 'At least 8 characters.'   // length
  if (values.confirm !== values.password) e.confirm = 'Passwords do not match.' // cross-field
  return e
})

const isValid = computed(() => Object.keys(errors.value).length === 0)`,
      lang: 'js',
      title: 'rules',
    },
    `
#### Touched, submit attempts and visible errors
`,
    {
      code: `<script setup>
const touched = reactive({})
const submitAttempted = ref(false)

const visibleError = (field) =>
  touched[field] || submitAttempted.value ? errors.value[field] : ''

function onSubmit() {
  submitAttempted.value = true
  if (!isValid.value) return
  // …send
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <label for="email">Email</label>
    <input id="email" v-model.trim="values.email" @blur="touched.email = true"
           :aria-invalid="!!visibleError('email')" />
    <p v-if="visibleError('email')" id="email-error" class="error">
      {{ visibleError('email') }}
    </p>
  </form>
</template>`,
      lang: 'vue',
      title: 'showing errors at the right time',
    },
    `
#### Dirty and reset
`,
    {
      code: `function initialValues() {
  return { email: '', password: '', confirm: '' }
}
const initial = initialValues()
const values = reactive(initialValues())

const isDirty = computed(() =>
  Object.keys(initial).some((key) => values[key] !== initial[key]))

function reset() {
  Object.assign(values, initialValues())
  Object.keys(touched).forEach((key) => delete touched[key])
  submitAttempted.value = false
}`,
      lang: 'js',
      title: 'dirty & reset',
    },
    `
#### Kinds of rules

| Rule | Example | Typical check |
|---|---|---|
| required | name, email | \`!values.name\` (after \`.trim\`) |
| format | email, postcode | a regular expression — keep it simple |
| numeric | age, quantity | \`Number.isInteger(v) && v >= 13 && v <= 120\` |
| length | password | \`values.password.length >= 8\` |
| cross-field | confirm password, date ranges | compare two values |
| conditional | company if "business" is ticked | \`if (values.business && !values.company)\` |

**The rules:**

1. **Derive** errors with \`computed\`; don't store them in refs you update by hand.
2. Show a field's error once it is **touched** or after a **submit attempt** — not on page load, not on the first keystroke.
3. Once an error is visible, let it **disappear as soon as the value is fixed** (the computed does this for free).
4. Use \`novalidate\` when you show your own messages, so browser bubbles and your messages don't compete.
5. Don't disable the submit button just because the form is invalid; let people submit and then show what's missing.
6. Keep regexes simple and **label them** — the only real proof of an email address is a confirmation email.
7. **Client-side validation is UX, not security.** The server must validate every field again.
`,
    {
      callout: 'tip',
      title: 'Regular expressions in lesson files and templates',
      text: 'In plain JavaScript, `/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/` uses `\\s` (whitespace) and `\\.` (a literal dot). Never add the `g` flag to a regex you reuse with `.test()` — it remembers `lastIndex` between calls and alternates between `true` and `false`.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: signupApp,
    intro: 'The validated sign-up form. Step through the script to see the four ingredients: values, touched, a computed of errors, and a function that decides which errors are visible.',
    steps: [
      { lines: [4, 6], text: '`initialValues()` describes the empty form. It is used to create the form and, later, to reset it — so the two can never drift apart.' },
      { lines: [8, 11], text: 'Four pieces of state: the values, which fields were touched (left after visiting), whether a submit was attempted, and the submitted snapshot.' },
      { lines: [13, 14], text: 'A deliberately simple email pattern. In a JavaScript file you write `\\s` and `\\.`; a stricter regex mostly rejects real addresses, so keep it loose and label it simplified.' },
      { lines: [16, 31], text: 'All rules live in one `computed`. It returns an object with a message for each failing field. Because it is derived, it is always in sync with the values — no "forgot to clear the error" bugs.' },
      { lines: [24, 27], text: 'An optional numeric rule: empty is fine, but if filled in it must be a whole number in range. `type="number"` makes `v-model` give a number (or `\'\'` when cleared).' },
      { lines: [33], text: '`isValid` is derived from `errors` — the submit gate.' },
      { lines: [35, 38], text: '`visibleError` decides *when* to show a message: after the field is touched or after a submit attempt. The error exists earlier; we just don\'t nag.' },
      { lines: [40, 44], text: 'Submitting marks the attempt (revealing every error) and stops if anything is invalid. Only valid data becomes `submitted`.' },
      { lines: [46, 51], text: 'Reset restores values, clears touched and the attempt flag — the form looks brand new, with no red.' },
      { lines: [58, 62], text: 'Each field: a label, `v-model`, `@blur` to mark it touched, `aria-invalid` for assistive tech, and the error paragraph only when visible. (The accessible-inputs lesson adds `aria-describedby` and live announcements.)' },
    ],
  },

  playground: {
    title: 'A sign-up form that validates kindly',
    objective: 'Add the missing rules — length, cross-field and conditional — and an "unsaved changes" indicator, without breaking the timing of error messages.',
    files: { 'App.vue': signupApp },
    expected: 'A sign-up form with no errors on load. Tab through a field without typing and its error appears; fix it and the error disappears. Press **Create account** with empty fields and every error appears at once. A valid form shows a welcome message.',
    experiments: [
      {
        id: 'password-length',
        task: 'Passwords like `abc` are accepted. Add a rule: the password must be **at least 8 characters** (message mentioning "8").',
        hint: 'In the computed: `if (!values.password) … else if (values.password.length < 8) e.password = \'Use at least 8 characters.\'`.',
        tests: [
          {
            name: 'a short password shows an error after blur, a long one does not',
            code: `await type('#password', 'abc')
await trigger('#password', 'blur')
expect(exists('#password-error')).toBe(true)
expect(text('#password-error')).toContain('8')
await type('#password', 'longenough')
expect(exists('#password-error')).toBe(false)`,
          },
        ],
        explain: 'Adding a rule is one line in one place. The error appears only because the field is touched, and vanishes the moment the value is fixed — the computed re-evaluates on every keystroke.',
      },
      {
        id: 'confirm-match',
        task: 'Add a **cross-field** rule: `confirm` must equal `password`, with a message containing "match".',
        hint: '`if (values.confirm !== values.password) e.confirm = \'Passwords do not match.\'` — add it inside the computed.',
        tests: [
          {
            name: 'confirm must match password — and re-checks when the password changes',
            code: `await type('#password', 'longenough')
await type('#confirm', 'longenougX')
await trigger('#confirm', 'blur')
expect(text('#confirm-error')).toContain('match')
await type('#confirm', 'longenough')
expect(exists('#confirm-error')).toBe(false)
await type('#password', 'different1')
expect(exists('#confirm-error')).toBe(true)`,
          },
        ],
        explain: 'Changing the *password* re-validated the *confirm* field, because the computed reads both values. With a watcher on only one field you would have to remember to re-check from both sides.',
      },
      {
        id: 'conditional-company',
        task: 'Add a **conditional** rule: when "This is a business account" is ticked, **Company name** is required. When it isn\'t ticked, the company must not block submission.',
        hint: '`if (values.business && !values.company) e.company = \'Please enter your company name.\'`.',
        tests: [
          {
            name: 'company is required only for business accounts',
            code: `await type('#name', 'Ada')
await type('#email', 'ada@example.com')
await type('#password', 'longenough')
await type('#confirm', 'longenough')
await check('#business', true)
await submit('form')
expect(exists('#company-error')).toBe(true)
expect(exists('.success')).toBe(false)
await type('#company', 'Analytical Engines Ltd')
await submit('form')
expect(exists('.success')).toBe(true)`,
          },
        ],
        explain: 'Conditional rules read the condition from the same reactive values. When the checkbox is unticked, the rule simply doesn\'t produce an error — and the hidden field can\'t block the form.',
      },
      {
        id: 'dirty-indicator',
        task: 'Show `<p class="dirty">Unsaved changes</p>` whenever any value differs from its initial value. It must disappear after **Reset**, and when the user changes a value back.',
        hint: 'Keep `const initial = initialValues()` and add `const isDirty = computed(() => Object.keys(initial).some((k) => values[k] !== initial[k]))`, then `v-if="isDirty"`.',
        tests: [
          {
            name: 'dirty follows the values',
            code: `expect(exists('.dirty')).toBe(false)
await type('#name', 'Ada')
expect(exists('.dirty')).toBe(true)
await type('#name', '')
expect(exists('.dirty')).toBe(false)
await type('#email', 'x@y.zz')
await click('.reset')
expect(exists('.dirty')).toBe(false)`,
          },
        ],
        explain: '"Dirty" compares the current values with the initial ones, so typing and then deleting returns to clean. (A naive "set dirty = true on input" flag can never become clean again.) Real apps use it to warn before leaving the page or to enable a Save button.',
      },
    ],
  },

  internals: {
    beginner: `
The \`errors\` computed is like a spreadsheet formula: it reads the values, works out the messages, and Vue re-runs it automatically whenever a value it read changes. You never "update the errors" yourself.

**Touched** is just a little object of yes/no flags, set when the user leaves a field. **Submit attempted** is one more flag. Together they answer "is it fair to show this error yet?".
`,
    technical: [
      `
**Dependency tracking does the cross-field work.** While the computed runs, Vue records every reactive property it reads — \`values.password\` and \`values.confirm\` for the confirm rule. Changing either marks the computed dirty, and the next read recalculates it. Rules that depend on a condition (\`values.business\`) also track that condition.

**Why not watchers?** A watcher that sets \`errors.confirm\` when \`password\` changes must also be told about \`confirm\`, and every new rule means another watcher. Missing one leaves a stale error. A computed derives the complete error object from the complete state every time — less code and no sync bugs. Watchers are still right for *side effects*, such as async validation (next lesson).
`,
      {
        code: `// ❌ stored errors, updated by hand
watch(() => values.password, (pw) => {
  errors.confirm = values.confirm !== pw ? 'No match' : ''
})
// forgot: watching values.confirm → stale error after editing confirm

// ✅ derived errors
const errors = computed(() => ({
  ...(values.confirm !== values.password && { confirm: 'No match' }),
}))`,
        lang: 'js',
        title: 'stored vs derived errors',
      },
      `
**Touched vs dirty.** They answer different questions: touched = "has the user been here and left?" (timing of messages); dirty = "is the value different from the start?" (unsaved changes). A field can be touched but pristine (tabbed through) or dirty but untouched (still typing).

**Browser validation.** Constraint attributes (\`required\`, \`type="email"\`, \`min\`, \`pattern\`) power the browser's own checks and the \`:invalid\` CSS pseudo-class. \`novalidate\` on the form disables the blocking bubbles; the constraint API (\`input.validity\`, \`checkValidity()\`) still works if you want to reuse it.

**Performance.** Recomputing a handful of rules on each keystroke is cheap. For very large forms, compute errors per field (one computed each) so a keystroke only re-runs that field's rules.
`,
    ],
    production: `
- **The server is the authority.** Client rules can be bypassed with devtools or a script. Validate everything again on the server and map its errors back to fields.
- **Share rule definitions** where possible (for example a schema used by both client and server), so messages and limits don't drift — see [schema validation](lesson:advanced-forms).
- **Write helpful messages:** say what's wrong and how to fix it ("Use at least 8 characters"), not just "Invalid".
- **Focus the first invalid field** after a failed submit, and announce errors for screen-reader users — covered in [accessible inputs](lesson:accessible-reusable-inputs).
- **Don't over-validate.** Names, addresses and phone numbers vary enormously across the world; strict regexes reject real people.
- **Unsaved-changes guards** (route leave guards or \`beforeunload\`) should use \`isDirty\`, not "the user typed something once".
`,
  },

  mistakes: [
    {
      title: 'Showing errors before the user did anything',
      wrong: { code: `<p v-if="errors.email" class="error">{{ errors.email }}</p>
<!-- red text on page load: "Please enter your email." -->`, lang: 'vue' },
      right: { code: `<p v-if="(touched.email || submitAttempted) && errors.email" class="error">
  {{ errors.email }}
</p>`, lang: 'vue' },
      explanation: 'A required field is invalid from the start, but complaining before the user has had a chance is hostile. Gate visibility on touched or a submit attempt.',
    },
    {
      title: 'Storing errors and forgetting to update them',
      wrong: { code: `const errors = reactive({})
function validateEmail() {
  errors.email = EMAIL.test(values.email) ? '' : 'Invalid'
}
// called on blur… but not after the value is autofilled or reset`, lang: 'js' },
      right: { code: `const errors = computed(() => {
  const e = {}
  if (!EMAIL.test(values.email)) e.email = 'Invalid'
  return e
})`, lang: 'js' },
      explanation: 'Manually maintained errors go stale when values change through any path you didn\'t anticipate (autofill, reset, programmatic updates). A computed is always correct.',
    },
    {
      title: 'Treating client validation as security',
      wrong: { code: `// "the form already checks the price, so the API can trust it"
app.post('/orders', (req, res) => saveOrder(req.body))`, lang: 'js' },
      right: { code: `app.post('/orders', (req, res) => {
  const result = validateOrder(req.body) // same rules, enforced on the server
  if (!result.ok) return res.status(422).json({ errors: result.errors })
  saveOrder(result.data)
})`, lang: 'js' },
      explanation: 'Anything the browser does can be skipped or modified. Client-side validation improves the experience; only server-side validation protects your data.',
    },
    {
      title: 'Disabling submit until the form is valid',
      wrong: { code: `<button :disabled="!isValid">Create account</button>
<!-- users can't tell why the button does nothing -->`, lang: 'vue' },
      right: { code: `<button type="submit">Create account</button>
<!-- on submit: show every error and focus the first invalid field -->`, lang: 'vue' },
      explanation: 'A disabled button gives no explanation, and disabled buttons are skipped by keyboard focus. Letting people submit and then clearly showing what\'s missing is easier to understand and more accessible.',
    },
  ],

  debugging: [
    {
      symptom: 'Error messages are visible as soon as the page loads.',
      cause: 'Errors are rendered whenever the computed has them, with no touched/submit gate.',
      fix: 'Show an error only when `touched[field] || submitAttempted`.',
    },
    {
      symptom: '"Passwords do not match" stays after fixing the first password field.',
      cause: 'The error is stored and recalculated only when one of the two fields changes.',
      fix: 'Derive it in a computed that reads both fields.',
    },
    {
      symptom: 'A regex check alternates between valid and invalid for the same input.',
      cause: 'The regex has the `g` (global) flag and is reused with `.test()`, which advances `lastIndex`.',
      fix: 'Remove the `g` flag for validation patterns.',
    },
    {
      symptom: 'The browser shows its own tooltip bubbles on submit, and your messages never appear.',
      cause: 'Native constraint validation blocks the submit event before your handler runs.',
      fix: 'Add `novalidate` to the `<form>` when you render your own messages (or drop the constraint attributes).',
    },
    {
      symptom: '"Unsaved changes" stays on after the user undoes their edits.',
      cause: 'Dirty is a flag set on input instead of a comparison with the initial values.',
      fix: 'Compute dirty by comparing current values with an initial snapshot.',
    },
  ],

  bestPractices: [
    'Derive all errors in one `computed` (or one per field for big forms).',
    'Reveal errors after blur or a submit attempt; hide them as soon as they are fixed.',
    'Use clear, specific messages that say how to fix the problem.',
    'Let users submit; on failure show all errors and move focus to the first invalid field.',
    'Compute dirty from an initial snapshot; reset values, touched and submit state together.',
    'Use `novalidate` when you render your own messages.',
    'Always validate again on the server.',
  ],

  useCases: [
    'Sign-up forms with email, password strength and confirmation.',
    'Booking forms with date ranges (check-out after check-in).',
    'Checkout forms where a company or VAT number is required only for business customers.',
    'Settings pages with an "unsaved changes" warning.',
    'Quantity fields with numeric ranges.',
  ],

  whenToUse: {
    use: [
      'Any form where users can make fixable mistakes before submitting.',
      'Cross-field and conditional rules — a computed handles them naturally.',
      'Touched/submit gating for every visible error message.',
      'Dirty tracking when leaving the page could lose work.',
    ],
    avoid: [
      'Relying on client validation for security or data integrity.',
      'Very strict regexes for names, addresses or phone numbers.',
      'Watchers that copy values into error refs.',
      'Disabling submit as the only feedback.',
    ],
  },

  comparison: {
    title: 'When to show an error',
    headers: ['', 'On every keystroke', 'On blur (touched)', 'On submit only', 'Touched OR submitted (recommended)'],
    rows: [
      ['First feedback', 'immediately — often too early', 'after leaving the field', 'only at the end', 'after leaving the field'],
      ['Nags while typing', 'yes ("n" is not an email)', 'no', 'no', 'no'],
      ['Skipped fields flagged', 'no', 'only if visited', 'yes', 'yes, on submit'],
      ['Error clears when fixed', 'yes', 'only on next blur unless derived', 'only on next submit unless derived', 'yes, instantly (computed)'],
    ],
    note: 'A common refinement: once a field has shown an error, re-validate it live on each keystroke so the message disappears as soon as it\'s fixed — exactly what a computed gives you. Next: [async validation and server errors](lesson:advanced-forms).',
  },

  quiz: [
    {
      id: 'form-validation-q1',
      type: 'mcq',
      prompt: 'What does it mean when a field is **touched**?',
      options: [
        { text: 'The user has focused it and then left it (blur)' },
        { text: 'Its value differs from the initial value', why: 'That is *dirty*.' },
        { text: 'It currently has a validation error', why: 'Validity is separate from whether the user has visited the field.' },
        { text: 'The user has typed at least one character', why: 'Typing makes a field dirty; touched is about leaving it.' },
      ],
      answer: 0,
      explanation: 'Touched = visited and left. It is mainly used to decide when it is fair to show that field\'s error.',
    },
    {
      id: 'form-validation-q2',
      type: 'output',
      prompt: 'The user types "Ada" into the name field, then deletes it again. What does `isDirty` show?',
      code: {
        lang: 'js',
        code: `const initial = { name: '', email: '' }
const values = reactive({ ...initial })

const isDirty = computed(() =>
  Object.keys(initial).some((key) => values[key] !== initial[key]))`,
      },
      options: [
        { text: 'false' },
        { text: 'true', why: 'Dirty is a comparison, not a history. The value is back to `\'\'`, equal to the initial value.' },
        { text: 'undefined', why: '`some()` always returns a boolean.' },
        { text: 'It throws because initial is not reactive', why: 'The initial snapshot doesn\'t need to be reactive; `values` is.' },
      ],
      answer: 0,
      explanation: 'The computed compares current values to the snapshot. After deleting, `values.name === \'\'` again, so nothing differs.',
    },
    {
      id: 'form-validation-q3',
      type: 'bug',
      prompt: 'After the user fixes the **confirm** field to match, "Passwords do not match" stays on screen. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `const values = reactive({ password: '', confirm: '' })
const errors = reactive({ confirm: '' })

watch(
  () => values.password,
  () => {
    errors.confirm = values.confirm === values.password ? '' : 'Passwords do not match'
  },
)`,
      },
      answerLine: 5,
      explanation: 'The watcher only watches `password`, so editing `confirm` never re-runs the check. Watching both would fix it — but deriving `errors` with `computed` avoids the problem entirely.',
    },
    {
      id: 'form-validation-q4',
      type: 'fill',
      prompt: 'Complete the code so errors are derived automatically and a field becomes touched when the user leaves it.',
      code: {
        lang: 'vue',
        code: `<script setup>
const errors = ___(() => {
  const e = {}
  if (!values.email) e.email = 'Please enter your email.'
  return e
})
</script>

<template>
  <input v-model="values.email" @___="touched.email = true" />
</template>`,
      },
      answer: [['computed'], ['blur']],
      explanation: '`computed` keeps errors in sync with values; the `blur` event fires when a field loses focus.',
    },
    {
      id: 'form-validation-q5',
      type: 'mcq',
      prompt: 'Which approach is generally better for usability and accessibility when the form is incomplete?',
      options: [
        { text: 'Keep the submit button enabled; on submit, show all errors and move focus to the first invalid field' },
        { text: 'Disable the submit button until every field is valid', why: 'Users get no explanation, and disabled buttons are skipped by keyboard focus.' },
        { text: 'Show every error as soon as the page loads', why: 'Nagging before people have started is unfriendly and noisy for screen readers.' },
        { text: 'Silently ignore the submit', why: 'Users can\'t tell what went wrong.' },
      ],
      answer: 0,
      explanation: 'Let people try, then tell them clearly what\'s missing and take them there.',
    },
    {
      id: 'form-validation-q6',
      type: 'mcq',
      prompt: 'Select **all** rules that are **cross-field** or **conditional**.',
      options: [
        { text: 'Confirm password must equal password' },
        { text: 'Check-out date must be after check-in date' },
        { text: 'Email must contain an @', why: 'That is a format rule on one field.' },
        { text: 'VAT number is required when "business" is ticked' },
        { text: 'Name is required', why: 'A simple required rule on one field.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Cross-field rules compare two fields; conditional rules apply only when another value says so. A computed reading all values handles both.',
    },
    {
      id: 'form-validation-q7',
      type: 'short',
      prompt: 'Why is client-side validation not enough on its own?',
      answer: 'Because it runs in the user\'s browser, which they control: devtools, disabled JavaScript, or a script calling the API directly can skip or change it. Client-side validation is for fast, friendly feedback; the server must validate every field again before trusting or saving the data.',
    },
  ],

  exercises: [
    {
      id: 'login-validation',
      title: 'Validate a login form',
      difficulty: 'intermediate',
      prompt: `
Add validation to the login form in \`App.vue\`:

- **email**: required (message containing "required"), and must look like an email (message containing "valid email");
- **password**: required (message containing "required");
- show an error in \`<p id="email-error" class="error">\` / \`<p id="password-error" class="error">\` only after that field is **blurred** or after a **submit attempt**;
- set \`aria-invalid="true"\` on an input while its error is visible (and \`"false"\` otherwise);
- an invalid submit must **not** log in; a valid one shows \`.success\` as before.
`,
      files: { 'App.vue': loginStarter },
      hints: [
        'Add `touched` (reactive object) and `submitAttempted` (ref), plus an `errors` computed returning `{ email?, password? }`.',
        'A helper `show(field)` returns the error only when `touched[field] || submitAttempted.value`. Use it for `v-if`, the message and `:aria-invalid`.',
        'In `onSubmit`, set `submitAttempted.value = true` first and `return` if `errors` has any keys.',
      ],
      solution: {
        explanation: 'Rules are derived in one computed, visibility is gated by touched/submit, and `aria-invalid` mirrors the visible state so assistive technology announces invalid fields. Fixing a value makes its message disappear instantly.',
        files: { 'App.vue': loginSolution },
      },
      tests: [
        { name: 'no errors before interaction', code: `expect(findAll('.error')).toHaveLength(0)` },
        {
          name: 'blurring an empty email shows "required"',
          code: `await trigger('#email', 'blur')
expect(text('#email-error')).toContain('required')
expect(exists('#password-error')).toBe(false)`,
        },
        {
          name: 'a malformed email asks for a valid email',
          code: `await type('#email', 'not-an-email')
await trigger('#email', 'blur')
expect(text('#email-error')).toContain('valid email')
expect(attr('#email', 'aria-invalid')).toBe('true')`,
        },
        {
          name: 'submitting empty shows both errors and does not log in',
          code: `await submit('form')
expect(exists('#email-error')).toBe(true)
expect(exists('#password-error')).toBe(true)
expect(exists('.success')).toBe(false)`,
        },
        {
          name: 'fixing a field removes its error',
          code: `await submit('form')
await type('#email', 'ada@example.com')
expect(exists('#email-error')).toBe(false)
expect(attr('#email', 'aria-invalid')).toBe('false')`,
        },
        {
          name: 'a valid submit logs in',
          code: `await type('#email', 'ada@example.com')
await type('#password', 'correct horse')
await submit('form')
expect(text('.success')).toContain('ada@example.com')`,
        },
      ],
    },
    {
      id: 'booking-rules',
      title: 'Cross-field and conditional rules',
      difficulty: 'intermediate',
      prompt: `
The booking form already shows errors after a submit attempt — but the \`errors\` computed is empty. Fill in the rules:

- \`checkIn\` is required → \`#checkin-error\`;
- \`checkOut\` is required **and must be after** \`checkIn\` (same day is not allowed) → \`#checkout-error\` containing "after";
- \`guests\` must be a whole number from 1 to 6 → \`#guests-error\`;
- \`petName\` is required **only when** \`pets\` is ticked → \`#pet-name-error\`.

A valid booking shows \`.success\` (e.g. "Booked: 2026-05-01 → 2026-05-04 for 2 guests").
`,
      files: { 'App.vue': bookingStarter },
      hints: [
        'Date inputs give strings like `\'2026-05-01\'`. ISO dates compare correctly as strings, so `values.checkOut <= values.checkIn` means "not after".',
        '`type="number"` with `v-model` gives a number (or `\'\'` when cleared). Check `Number.isInteger(g) && g >= 1 && g <= 6`.',
        'A conditional rule is just an `if` that reads the condition: `if (values.pets && !values.petName) e.petName = …`.',
      ],
      solution: {
        explanation: 'One computed handles single-field, cross-field and conditional rules because it reads all the values it needs. Vue tracks every value each rule reads, so changing check-in re-checks check-out, and unticking "pets" removes the pet-name error.',
        files: { 'App.vue': bookingSolution },
      },
      tests: [
        { name: 'no errors before the first submit', code: `expect(findAll('.error')).toHaveLength(0)` },
        {
          name: 'check-out before check-in is rejected',
          code: `await type('#checkin', '2026-05-04')
await type('#checkout', '2026-05-01')
await submit('form')
expect(text('#checkout-error')).toContain('after')
expect(exists('.success')).toBe(false)`,
        },
        {
          name: 'same-day check-out is rejected',
          code: `await type('#checkin', '2026-05-04')
await type('#checkout', '2026-05-04')
await submit('form')
expect(exists('#checkout-error')).toBe(true)`,
        },
        {
          name: 'missing dates and bad guest counts are flagged',
          code: `await type('#guests', '7')
await submit('form')
expect(exists('#checkin-error')).toBe(true)
expect(exists('#checkout-error')).toBe(true)
expect(exists('#guests-error')).toBe(true)
await type('#guests', '0')
expect(exists('#guests-error')).toBe(true)
await type('#guests', '3')
expect(exists('#guests-error')).toBe(false)`,
        },
        {
          name: 'pet name is required only with a pet',
          code: `await type('#checkin', '2026-05-01')
await type('#checkout', '2026-05-04')
await check('#pets', true)
await submit('form')
expect(exists('#pet-name-error')).toBe(true)
await check('#pets', false)
await submit('form')
expect(exists('.success')).toBe(true)`,
        },
        {
          name: 'a valid booking succeeds',
          code: `await type('#checkin', '2026-05-01')
await type('#checkout', '2026-05-04')
await submit('form')
expect(text('.success')).toBe('Booked: 2026-05-01 → 2026-05-04 for 2 guests')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'form-validation-touched-dirty',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between "touched" and "dirty" in a form, and what is each used for?',
      answer: 'Touched means the user has focused a field and left it (blur); it is used to decide when to show that field\'s validation error. Dirty means the current value differs from the initial value; it is used for "unsaved changes" warnings and enabling Save buttons. A field can be touched but pristine (tabbed through) or dirty but untouched (still typing).',
      explanation: 'Touched is about timing of feedback; dirty is about whether there is anything to save.',
      whyAsked: 'Standard vocabulary for anyone building forms or using form libraries.',
      mistakes: ['Treating them as synonyms.', 'Implementing dirty as a flag that can never reset.', 'Showing errors based on dirty only, so skipped fields never show errors.'],
      followUps: ['How would you compute dirty for nested objects?', 'How does a submit attempt fit in?'],
      modelAnswer: 'Touched means the user visited the field and left it, so it is fair to show its error now. Dirty means the value differs from the initial value, which drives unsaved-changes warnings or a Save button. They are independent: tabbing through makes a field touched but not dirty, and typing without leaving makes it dirty but not touched. I compute dirty by comparing with an initial snapshot, so undoing edits makes it clean again.',
    },
    {
      id: 'form-validation-when-to-show',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Users complain that the sign-up form "yells at them" while typing their email, but also that they don\'t notice skipped fields. How would you change when errors appear?',
      answer: 'Show a field\'s error once it is touched (after blur) or after a submit attempt, not on every keystroke. Once an error is visible, re-validate live so it disappears as soon as the value is fixed. On submit, reveal all errors, move focus to the first invalid field, and consider an error summary at the top.',
      explanation: 'This is the common "touched OR submitted, then live" strategy.',
      whyAsked: 'Tests UX judgement about validation timing — a frequent product discussion.',
      mistakes: ['Validating only on submit.', 'Disabling submit with no explanation.', 'Not focusing the first error.'],
      followUps: ['How would you announce errors to screen-reader users?', 'What changes for async checks like username availability?'],
      modelAnswer: 'I would stop validating visibly on each keystroke and gate errors on touched or a submit attempt. That avoids flagging "n" as an invalid email while someone types, but still catches skipped fields when they submit. Once an error shows, the computed re-validates live, so it disappears as soon as it is fixed. On a failed submit I focus the first invalid field and, for long forms, show a summary linking to each error.',
    },
    {
      id: 'form-validation-computed-vs-watch',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Should validation errors be stored in refs updated by watchers, or derived with `computed`? Why?',
      answer: 'Derive them with `computed`. Errors are a pure function of the current values; a computed recalculates whenever any value it reads changes — including cross-field and conditional dependencies — so it can never be stale. Watchers that write errors must cover every relevant source and every update path (autofill, reset, programmatic changes), which is easy to get wrong. Use watchers for side effects like async checks.',
      explanation: 'Derived state belongs in computed; side effects belong in watchers.',
      whyAsked: 'Probes understanding of derived vs stored state, a core Vue skill.',
      mistakes: ['Saying computed is slower.', 'Using a watcher per field for synchronous rules.', 'Forgetting async validation does need watchers or handlers.'],
      followUps: ['How would you split rules for a very large form?', 'Where does a server error fit in this model?'],
      modelAnswer: 'Errors are derived data — given the values, the messages are fully determined — so I use a computed. Vue tracks every value each rule reads, so a cross-field rule like password confirmation updates when either field changes, and a reset or autofill can\'t leave stale messages. With watchers I would have to wire every dependency by hand. Watchers are still right for side effects such as calling the server to check a username.',
    },
    {
      id: 'form-validation-client-security',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'If the frontend validates every field, does the backend still need to validate?',
      answer: 'Yes, always. The frontend runs on the user\'s machine, so its checks can be bypassed with devtools, disabled JavaScript, or by calling the API directly. Client-side validation is for user experience; server-side validation protects data integrity and security. The server should return field errors the client can display.',
      explanation: 'Never trust the client.',
      whyAsked: 'A security fundamentals check that applies to every web developer.',
      mistakes: ['"The form prevents invalid data."', 'Only validating on the server and giving no fast feedback.'],
      followUps: ['How do you avoid duplicating rules on both sides?', 'What status code would you return for validation errors?'],
      modelAnswer: 'Yes. Anything in the browser can be bypassed — devtools, a modified request, or a script calling the API directly. Client validation gives fast, friendly feedback; server validation is the real gate that protects the database. Ideally both use shared rule definitions, and the server returns field-level errors, often with a 422 status, that the form maps back onto its inputs.',
    },
    {
      id: 'form-validation-regex-g-flag',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 3,
      question: 'A form says the same valid email is invalid every second time you blur the field. What could cause this?',
      code: {
        lang: 'js',
        code: `const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/g

function validateEmail(value) {
  return EMAIL.test(value) ? '' : 'Enter a valid email'
}`,
      },
      options: [
        'The regex is missing the `i` flag',
        'A regex with the `g` flag keeps `lastIndex` between `.test()` calls, so it alternates between matching and failing',
        '`.test()` is asynchronous',
        'Vue caches the result of the function',
      ],
      correctOption: 1,
      answer: 'The `g` flag makes the regex stateful: after a successful `.test()`, `lastIndex` points past the match, so the next call starts searching from there and fails, which resets `lastIndex` to 0. Remove the `g` flag for validation patterns.',
      explanation: 'Global regexes are for iterating matches, not for yes/no checks.',
      whyAsked: 'A subtle JavaScript bug that shows depth beyond framework knowledge.',
      mistakes: ['Blaming Vue reactivity.', 'Recreating the regex on each call without understanding why that "fixes" it.'],
      followUps: ['When is the `g` flag appropriate?', 'Why might a strict email regex be a bad idea anyway?'],
      modelAnswer: 'The regex has the global flag. With `g`, `.test()` updates `lastIndex`, so after one success the next search starts after the previous match and fails, and the failure resets it — the result alternates. Validation patterns should never use `g`. I would also keep the pattern loose, because the only real proof of an email is a confirmation message.',
    },
    {
      id: 'form-validation-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your app has 30 forms with hand-written validation in each. Design a reusable approach in Vue.',
      answer: 'Extract a `useForm` composable that owns `values`, `touched`, `submitAttempted`, a computed `errors` built from a rules map (`{ email: [required, email] }` where each rule is `(value, values) => message or an empty string`), `isDirty`, `visibleError(field)`, `handleSubmit(fn)` (marks attempt, stops if invalid, focuses the first error, tracks `isSubmitting`) and `setServerErrors()`. Rules are small pure functions, easy to unit-test and reuse; messages can go through i18n. Alternatively adopt a library (e.g. VeeValidate) or a schema library shared with the server — the decision depends on team size and how complex the forms are.',
      explanation: 'Centralise the mechanics (state, timing, submit) and keep rules as composable pure functions.',
      code: {
        lang: 'js',
        code: `const required = (v) => (v === '' || v == null ? 'Required.' : '')
const minLength = (n) => (v) => (v.length < n ? \`At least \${n} characters.\` : '')
const sameAs = (other) => (v, all) => (v !== all[other] ? 'Does not match.' : '')

const form = useForm(
  { email: '', password: '', confirm: '' },
  { email: [required], password: [required, minLength(8)], confirm: [sameAs('password')] },
)`,
      },
      whyAsked: 'Senior question about turning repeated code into a clean abstraction.',
      mistakes: ['Global validation state shared between forms.', 'Rules that can\'t see other fields (no cross-field support).', 'Ignoring server errors and async rules.'],
      followUps: ['How would you support async rules?', 'How would you test the composable?', 'When would you choose a library instead?'],
      modelAnswer: 'I would write a `useForm` composable that each form calls, so state is per form. It holds values, touched and submit state, derives errors from a rules map where each rule is a pure function receiving the value and all values — which handles cross-field rules — and exposes visibleError, isDirty, a handleSubmit wrapper that guards double submits and focuses the first error, and a way to merge server errors. Rules are tiny functions that are trivial to unit-test. If the forms get complex or the team prefers a standard, I would evaluate VeeValidate or a schema shared with the backend.',
    },
    {
      id: 'form-validation-coding-touched',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'The form shows errors immediately on load. Change `visible(field)` (and whatever state it needs) so an error appears only after its field is **blurred** or after a **submit attempt**, and disappears as soon as the value is fixed.',
      starter: { files: { 'App.vue': touchedStarter } },
      tests: [
        { name: 'no errors on load', code: `expect(findAll('.error')).toHaveLength(0)` },
        {
          name: 'blur reveals only that field’s error',
          code: `await trigger('#username', 'blur')
expect(exists('#username-error')).toBe(true)
expect(exists('#city-error')).toBe(false)`,
        },
        {
          name: 'submit reveals every error and fixing hides it',
          code: `await submit('form')
expect(exists('#username-error')).toBe(true)
expect(exists('#city-error')).toBe(true)
await type('#city', 'Pune')
expect(exists('#city-error')).toBe(false)
expect(exists('.done')).toBe(false)`,
        },
      ],
      hints: ['Add `const touched = reactive({})` and `const submitAttempted = ref(false)`; set `touched.x = true` with `@blur`.', 'Return the error only when `touched[field] || submitAttempted.value`, and set `submitAttempted.value = true` at the start of `onSubmit`.'],
      answer: 'Track touched per field (on blur) and a submit-attempt flag; `visible(field)` returns the computed error only when either is true.',
      solution: { files: { 'App.vue': touchedSolution } },
      explanation: 'The errors computed stays the single source of truth; `visible` only decides timing. Because the message is read from the computed, fixing the value hides it instantly.',
      whyAsked: 'Tests whether you can separate "is it invalid?" from "should we say so yet?".',
      mistakes: ['Storing a copy of the error on blur, which then never clears.', 'Forgetting the submit attempt, so skipped fields never show errors.'],
      followUps: ['How would you reset touched state?', 'How would you focus the first invalid field on submit?'],
      modelAnswer: 'I keep the computed as the source of truth for validity and add two pieces of timing state: a touched map set on blur and a submitAttempted flag set at the start of submit. `visible` returns the computed error only when either is true. Since the message is still read from the computed, fixing the value makes it disappear immediately.',
    },
  ],

  takeaways: [
    'Derive errors with one `computed` — required, format, numeric, cross-field and conditional rules all fit.',
    'Separate "is it invalid?" (computed) from "should we show it yet?" (touched or submit attempted).',
    'Touched = visited and left; dirty = differs from the initial value.',
    'Reset values, touched and submit state together, from the same initial-values factory.',
    'Let users submit; show all errors and focus the first invalid field.',
    'Client-side validation is UX; the server must validate again.',
  ],
}
