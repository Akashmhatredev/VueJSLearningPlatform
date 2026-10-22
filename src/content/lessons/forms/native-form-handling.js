// Lesson: Native form handling in Vue

const signupApp = `<script setup>
import { reactive, ref } from 'vue'

// One function describes the empty form — used to start AND to reset
function emptyForm() {
  return {
    name: '',
    email: '',
    ticket: 'standard', // radio group → one string
    shirt: 'M',         // <select> → the chosen option's value
    workshops: [],      // checkbox group → array of values
    notes: '',          // <textarea> → string
    agree: false,       // single checkbox → true / false
  }
}

const form = reactive(emptyForm())
const submitted = ref(null)

function onSubmit() {
  // A real app would validate here and send the data to a server
  submitted.value = JSON.parse(JSON.stringify(form))
}
</script>

<template>
  <form class="signup" @submit.prevent="onSubmit">
    <label for="name">Name</label>
    <input id="name" name="name" v-model="form.name" autocomplete="name" />

    <label for="email">Email</label>
    <input id="email" name="email" type="email" v-model="form.email" autocomplete="email" />

    <fieldset>
      <legend>Ticket</legend>
      <label><input type="radio" name="ticket" value="standard" v-model="form.ticket" /> Standard</label>
      <label><input type="radio" name="ticket" value="vip" v-model="form.ticket" /> VIP</label>
    </fieldset>

    <label for="shirt">T-shirt size</label>
    <select id="shirt" name="shirt" v-model="form.shirt">
      <option value="S">Small</option>
      <option value="M">Medium</option>
      <option value="L">Large</option>
    </select>

    <fieldset>
      <legend>Workshops</legend>
      <label><input type="checkbox" value="vue" v-model="form.workshops" /> Vue deep dive</label>
      <label><input type="checkbox" value="a11y" v-model="form.workshops" /> Accessibility</label>
      <label><input type="checkbox" value="testing" v-model="form.workshops" /> Testing</label>
    </fieldset>

    <label for="notes">Anything we should know?</label>
    <textarea id="notes" name="notes" rows="3" v-model="form.notes"></textarea>

    <label><input type="checkbox" class="agree" v-model="form.agree" /> I agree to the code of conduct</label>

    <button type="submit" class="submit">Register</button>
  </form>

  <h3 v-if="submitted">What would be sent</h3>
  <pre v-if="submitted" class="preview">{{ submitted }}</pre>
</template>

<style>
.signup { display: grid; gap: 6px; max-width: 360px; }
fieldset { border: 1px solid #ccc; }
.preview { background: #f4f4f4; padding: 8px; }
</style>`

// ---- exercise: feedback form
const feedbackStarter = `<script setup>
import { ref } from 'vue'

const name = ref('')
const message = ref('')
const rating = ref(null)
</script>

<template>
  <form class="feedback">
    <label for="fb-name">Your name</label>
    <input id="fb-name" class="name" />

    <fieldset>
      <legend>How was the workshop?</legend>
      <label v-for="n in 5" :key="n">
        <input type="radio" name="rating" :value="n" /> {{ n }}
      </label>
    </fieldset>

    <label for="fb-message">Message</label>
    <textarea id="fb-message" class="message" maxlength="200"></textarea>
    <p class="counter">0 / 200</p>

    <button type="submit">Send feedback</button>
  </form>
</template>`

const feedbackSolution = `<script setup>
import { ref } from 'vue'

const name = ref('')
const message = ref('')
const rating = ref(null)   // a number once chosen, thanks to :value="n"
const error = ref('')
const sent = ref(false)

function send() {
  if (rating.value === null) {
    error.value = 'Please choose a rating.'
    return
  }
  error.value = ''
  sent.value = true
}
</script>

<template>
  <p v-if="sent" class="thanks">Thanks, {{ name }}! You rated us {{ rating }}/5.</p>

  <form v-else class="feedback" @submit.prevent="send">
    <label for="fb-name">Your name</label>
    <input id="fb-name" class="name" v-model.trim="name" />

    <fieldset>
      <legend>How was the workshop?</legend>
      <label v-for="n in 5" :key="n">
        <input type="radio" name="rating" :value="n" v-model="rating" /> {{ n }}
      </label>
    </fieldset>

    <label for="fb-message">Message</label>
    <textarea id="fb-message" class="message" maxlength="200" v-model="message"></textarea>
    <p class="counter">{{ message.length }} / 200</p>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button type="submit">Send feedback</button>
  </form>
</template>`

// ---- exercise: dynamic invoice lines
const invoiceStarter = `<script setup>
import { ref } from 'vue'

const lines = ref([{ id: 1, description: '', qty: 1, price: 0 }])
const saved = ref(false)

// TODO: addLine(), removeLine(id), a computed total
</script>

<template>
  <form class="invoice" @submit.prevent="saved = true">
    <div v-for="(line, index) in lines" :key="index" class="line">
      <input class="desc" v-model="line.description" placeholder="Description" />
      <input class="qty" type="number" min="1" v-model="line.qty" aria-label="Quantity" />
      <input class="price" type="number" min="0" step="0.01" v-model="line.price" aria-label="Unit price" />
      <button class="remove-line">Remove</button>
    </div>

    <button class="add-line">Add line</button>
    <p class="total">Total: 0.00</p>
    <button type="submit">Save invoice</button>
  </form>
  <p v-if="saved" class="saved">Invoice saved</p>
</template>`

const invoiceSolution = `<script setup>
import { ref, computed } from 'vue'

let nextId = 2
const lines = ref([{ id: 1, description: '', qty: 1, price: 0 }])
const saved = ref(false)

function addLine() {
  lines.value.push({ id: nextId++, description: '', qty: 1, price: 0 })
}

function removeLine(id) {
  lines.value = lines.value.filter((line) => line.id !== id)
}

// Number(...) guards against '' while a number field is being cleared
const total = computed(() =>
  lines.value.reduce((sum, line) => sum + Number(line.qty) * Number(line.price), 0),
)
</script>

<template>
  <form class="invoice" @submit.prevent="saved = true">
    <!-- a stable id as key: removing a row never mixes up the others -->
    <div v-for="line in lines" :key="line.id" class="line">
      <input class="desc" v-model="line.description" placeholder="Description" />
      <input class="qty" type="number" min="1" v-model="line.qty" aria-label="Quantity" />
      <input class="price" type="number" min="0" step="0.01" v-model="line.price" aria-label="Unit price" />
      <!-- type="button": inside a form, a plain <button> would SUBMIT it -->
      <button type="button" class="remove-line" @click="removeLine(line.id)">Remove</button>
    </div>

    <button type="button" class="add-line" @click="addLine">Add line</button>
    <p class="total">Total: {{ total.toFixed(2) }}</p>
    <button type="submit">Save invoice</button>
  </form>
  <p v-if="saved" class="saved">Invoice saved</p>
</template>`

// ---- interview coding: newsletter
const newsletterStarter = `<script setup>
import { ref } from 'vue'

const email = ref('')
const topics = ref([])
const frequency = ref('weekly')
const summary = ref('')
</script>

<template>
  <form class="newsletter">
    <label for="nl-email">Email</label>
    <input id="nl-email" class="email" type="email" />

    <fieldset>
      <legend>Topics</legend>
      <label><input type="checkbox" class="topic" value="news" /> News</label>
      <label><input type="checkbox" class="topic" value="releases" /> Releases</label>
      <label><input type="checkbox" class="topic" value="events" /> Events</label>
    </fieldset>

    <label for="nl-frequency">Frequency</label>
    <select id="nl-frequency" class="frequency">
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>

    <button type="submit">Subscribe</button>
  </form>
  <p v-if="summary" class="summary">{{ summary }}</p>
</template>`

const newsletterSolution = `<script setup>
import { ref } from 'vue'

const email = ref('')
const topics = ref([])
const frequency = ref('weekly')
const summary = ref('')

function subscribe() {
  const chosen = topics.value.length ? topics.value.join(', ') : 'no topics'
  summary.value = \`\${email.value} · \${frequency.value} · \${chosen}\`
}
</script>

<template>
  <form class="newsletter" @submit.prevent="subscribe">
    <label for="nl-email">Email</label>
    <input id="nl-email" class="email" type="email" v-model.trim="email" />

    <fieldset>
      <legend>Topics</legend>
      <label><input type="checkbox" class="topic" value="news" v-model="topics" /> News</label>
      <label><input type="checkbox" class="topic" value="releases" v-model="topics" /> Releases</label>
      <label><input type="checkbox" class="topic" value="events" v-model="topics" /> Events</label>
    </fieldset>

    <label for="nl-frequency">Frequency</label>
    <select id="nl-frequency" class="frequency" v-model="frequency">
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>

    <button type="submit">Subscribe</button>
  </form>
  <p v-if="summary" class="summary">{{ summary }}</p>
</template>`

export default {
  id: 'native-form-handling',
  title: 'Native form handling in Vue',
  summary: 'Bind every kind of native input with v-model, submit forms the right way, build dynamic rows, and reset cleanly — the foundation for validation.',
  difficulty: 'beginner',
  minutes: 35,
  prerequisites: ['v-model-forms', 'v-on-events', 'list-rendering'],
  related: ['form-validation', 'advanced-forms', 'accessible-reusable-inputs', 'component-v-model'],
  tags: ['forms', 'v-model', 'submit', 'prevent', 'checkbox', 'radio', 'select', 'textarea', 'dynamic forms', 'reset', 'FormData', 'modifiers'],
  apis: [
    { name: '@submit.prevent', summary: 'Listens for the form\'s submit event and calls `preventDefault()`, so the browser does not reload the page.' },
    { name: 'v-model.trim / .number / .lazy', summary: 'Trim whitespace, cast to a number, or sync on `change` instead of `input`.' },
    { name: 'checkbox group v-model', summary: 'Several checkboxes bound to one array collect the `value` of each checked box.' },
    { name: 'true-value / false-value', summary: 'Custom values a single checkbox writes instead of `true` / `false`.' },
  ],
  docs: [
    { label: 'Vue Guide — Form Input Bindings', url: 'https://vuejs.org/guide/essentials/forms.html' },
    { label: 'Vue Guide — Event Modifiers', url: 'https://vuejs.org/guide/essentials/event-handling.html#event-modifiers' },
    { label: 'MDN — The <form> element', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form' },
  ],

  intro: `
A *form* is how a web page asks the user for information: a name, an email, a choice between options, a few ticked boxes. HTML already gives us the pieces — \`<input>\`, \`<textarea>\`, \`<select>\`, checkboxes, radio buttons and \`<form>\` itself.

Vue's job is to connect those pieces to your **state**. With \`v-model\`, every field mirrors a value in JavaScript, so the data you will send to a server is always sitting in one object, up to date, ready to validate.

This lesson covers every native input type, submitting without reloading the page, dynamic "add another" rows, and resetting a form — the base for [validation](lesson:form-validation) in the next lesson.
`,

  why: `
Without Vue, reading a form means walking the DOM on submit:

\`\`\`js
const name = document.querySelector('#name').value
const workshops = [...document.querySelectorAll('input[name=workshop]:checked')].map((el) => el.value)
\`\`\`

That works for a snapshot, but real forms need the values *while* the user types: a character counter, a "VIP" section that appears when a radio is picked, a total that updates as quantities change, a submit button that knows whether the form is complete.

\`v-model\` keeps a JavaScript object and the form in sync in both directions. Your template stays declarative, and the "what would be sent" object is always one variable away.

Submitting also has a trap: by default, a browser handles a form submit by **navigating** — reloading the page and throwing away your app's state. Vue's \`.prevent\` modifier is how you keep control.
`,

  eli15: `
Picture a paper form at the doctor's office, but magical: whatever you write on it instantly appears on the receptionist's screen, and if the receptionist fixes a typo on the screen, it changes on your paper too.

That two-way link is \`v-model\`. Each box on the form is tied to one value in your code.

- A text box holds **words** (a string).
- A single tick box holds **yes or no** (true / false).
- A group of tick boxes holds a **list** of everything you ticked.
- Radio buttons and drop-downs hold **one choice**.

When you press **Register**, the browser's old habit is to send the paper away and give you a blank page. \`@submit.prevent\` says: "Thanks, I'll handle sending it myself."
`,

  analogy: {
    title: 'The magic carbon-copy form',
    body: `
Old paper forms had carbon copies: whatever you wrote on the top sheet appeared on the copy underneath. \`v-model\` is a carbon copy that works both ways — between the form on screen and an object in your code.

The clerk (your submit handler) never needs to read the form itself. They read the copy, check it, and decide whether to send it. And "start over" means handing out a fresh copy of the blank form — the same blank you started with.
`,
    mapping: [
      ['the top sheet', 'the inputs on the page'],
      ['the carbon copy', 'the reactive `form` object'],
      ['writing works both ways', '`v-model` updates state on input, and inputs when state changes'],
      ['the clerk reading the copy', 'the `@submit.prevent` handler'],
      ['a fresh blank form', '`emptyForm()` used both to start and to reset'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'v-model' },
    title: 'v-model on real inputs',
    caption: 'Type, tick and choose — then inspect the real DOM. `v-model` is a value binding plus an event listener, and the event differs by input type.',
    alt: 'An interactive lab with a text input, a checkbox and a select, each bound with v-model. Changing an input updates the bound value shown beside it, and an inspector shows the DOM property and event v-model uses for that input type.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'What happens when a form is submitted',
    caption: 'From pressing Enter to the data being ready to send.',
    alt: 'A flow: the user presses Enter or clicks a submit button; the browser fires a submit event on the form; .prevent cancels the default page navigation; the handler reads the reactive form object; the data is validated and sent; the form is reset or a success message is shown.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'user', label: 'Enter / Submit button', tone: 'paper' },
        { id: 'event', label: 'submit event', note: 'fired on <form>', tone: 'cobalt' },
        { id: 'prevent', label: '.prevent', note: 'no page reload', tone: 'red' },
        { id: 'handler', label: 'onSubmit()', note: 'reads form state', tone: 'acid' },
        { id: 'send', label: 'Validate & send', note: 'then reset', tone: 'kraft' },
      ],
      edges: [
        { from: 'user', to: 'event' },
        { from: 'event', to: 'prevent' },
        { from: 'prevent', to: 'handler' },
        { from: 'handler', to: 'send' },
      ],
      steps: [
        { focus: ['user'], text: 'The user presses **Enter** in a text field or clicks a button that submits. Both trigger the same thing — that is why you listen on the form, not on the button.' },
        { focus: ['event'], edges: ['user->event'], text: 'If the browser\'s own checks pass (\`required\`, \`type="email"\`… unless the form has \`novalidate\`), it fires a **submit** event on the \`<form>\`.' },
        { focus: ['prevent'], edges: ['event->prevent'], text: 'Without intervention, the browser would now navigate to the form\'s \`action\` — reloading the page and wiping your app\'s state. \`@submit.prevent\` calls \`event.preventDefault()\` first.' },
        { focus: ['handler'], edges: ['prevent->handler'], text: 'Your handler runs. It doesn\'t query the DOM — the reactive \`form\` object already holds every value thanks to \`v-model\`.' },
        { focus: ['send'], edges: ['handler->send'], text: 'Validate, send to the server (see [advanced forms](lesson:advanced-forms)), then reset the form or show a success message.' },
      ],
    },
  },

  syntax: [
    `
#### Every native input with v-model
`,
    {
      code: `<input v-model="form.name" />                          <!-- string -->
<textarea v-model="form.notes"></textarea>              <!-- string (not {{ }} inside!) -->

<input type="checkbox" v-model="form.agree" />          <!-- true / false -->
<input type="checkbox" v-model="form.newsletter"
       true-value="yes" false-value="no" />             <!-- custom values -->

<input type="checkbox" value="vue" v-model="form.workshops" />   <!-- array: -->
<input type="checkbox" value="a11y" v-model="form.workshops" />  <!-- ['vue', 'a11y'] -->

<input type="radio" value="standard" v-model="form.ticket" />    <!-- one value -->
<input type="radio" value="vip" v-model="form.ticket" />

<select v-model="form.shirt">                                    <!-- one value -->
  <option disabled value="">Pick a size</option>
  <option value="S">Small</option>
</select>
<select v-model="form.sizes" multiple>…</select>                 <!-- array -->`,
      lang: 'vue',
      title: 'input types',
    },
    `
#### Modifiers
`,
    {
      code: `<input v-model.trim="form.name" />     <!-- strips leading/trailing spaces -->
<input v-model.number="form.age" />    <!-- parseFloat; keeps the string if it can't -->
<input v-model.lazy="form.city" />     <!-- syncs on "change" (blur/Enter), not each key -->
<input type="number" v-model="form.guests" /> <!-- type="number" is cast automatically -->`,
      lang: 'vue',
      title: 'modifiers',
    },
    `
#### Submitting
`,
    {
      code: `<form @submit.prevent="onSubmit">
  <!-- …fields… -->
  <button type="submit">Save</button>                 <!-- submits -->
  <button type="button" @click="addRow">Add row</button> <!-- does NOT submit -->
</form>`,
      lang: 'vue',
      title: 'submit',
    },
    `
#### Dynamic rows
`,
    {
      code: `<script setup>
import { reactive } from 'vue'
let nextId = 1
const form = reactive({ guests: [] })
const addGuest = () => form.guests.push({ id: nextId++, name: '' })
const removeGuest = (id) => (form.guests = form.guests.filter((g) => g.id !== id))
</script>

<template>
  <div v-for="guest in form.guests" :key="guest.id">
    <input v-model="guest.name" aria-label="Guest name" />
    <button type="button" @click="removeGuest(guest.id)">Remove</button>
  </div>
  <button type="button" @click="addGuest">Add guest</button>
</template>`,
      lang: 'vue',
      title: 'add / remove rows',
    },
    `
**The rules:**

1. Keep the whole form in **one** object (\`reactive({...})\` or \`ref({...})\`) built by a function, so the same function can **reset** it.
2. Listen on the form: \`@submit.prevent\`, not \`@click\` on the button — Enter key submits too.
3. Inside a form, a \`<button>\` **without a type is a submit button**. Give every other button \`type="button"\`.
4. \`v-model\` **ignores** the \`value\`, \`checked\` and \`selected\` attributes in your HTML. The initial value comes from your state.
5. Text inputs give **strings**. Use \`.number\` (or \`type="number"\`, which Vue casts automatically) when you need numbers.
6. Give dynamic rows a **stable id** for \`:key\`, never the array index.
7. Every field needs a \`<label>\` (\`for\` + \`id\`, or wrapping). Group radios and related checkboxes in \`<fieldset>\` + \`<legend>\`.
`,
    {
      callout: 'note',
      title: 'Native validation',
      text: 'Attributes like `required`, `type="email"`, `min` and `maxlength` make the browser check fields before it fires `submit`. Many apps add `novalidate` to the form and show their own messages instead — the next lesson does exactly that. Either way, the server must validate again.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: signupApp,
    intro: 'The whole sign-up form from the playground. Step through it to see how each input type maps to a value in one reactive object.',
    steps: [
      { lines: [5, 15], text: '`emptyForm()` returns a brand-new blank form object. Using a function (not a shared constant) means we can call it again later to reset, and nothing can accidentally mutate "the blank".' },
      { lines: [9, 13], text: 'Each field has a starting value of the type its input produces: strings for text, one string for the radio group and the select, an **array** for the checkbox group, a **boolean** for the single checkbox.' },
      { lines: [17, 18], text: 'The form lives in one `reactive` object; `submitted` will hold a copy of what would be sent, so the preview doesn\'t change if you keep typing.' },
      { lines: [20, 23], text: 'The handler never touches the DOM. Everything is already in `form`. `JSON.parse(JSON.stringify(...))` takes a plain snapshot of the reactive object (fine for simple data).' },
      { lines: [27], text: '`@submit.prevent` handles both the Register button and pressing Enter in a field, and stops the browser from reloading the page.' },
      { lines: [28, 32], text: 'Text inputs: `v-model` writes on every `input` event. `<label for>` + `id` connects each label to its field — clicking the label focuses the input, and screen readers announce it.' },
      { lines: [34, 38], text: 'Radios share a `name` and the same `v-model`. Whichever is checked writes its `value`. The `<fieldset>`/`<legend>` gives the group a name for assistive technology.' },
      { lines: [40, 45], text: 'A `<select>` binds to the chosen option\'s `value`. The initial `\'M\'` selects "Medium" — Vue ignores any `selected` attribute in the HTML.' },
      { lines: [47, 52], text: 'Three checkboxes bound to **one array**: ticking adds the box\'s `value`, unticking removes it.' },
      { lines: [54, 57], text: 'A `<textarea>` uses `v-model` (interpolation inside a textarea does not work). A lone checkbox without `value` binds `true`/`false`.' },
      { lines: [59], text: 'An explicit `type="submit"`. Other buttons inside this form will need `type="button"`, or they would submit too.' },
      { lines: [62, 63], text: 'The preview prints the snapshot. Vue displays objects as formatted JSON, which is handy for seeing exactly what the server would receive.' },
    ],
  },

  playground: {
    title: 'Event sign-up form',
    objective: 'See every native input type feed one object, then fix whitespace, add a number field, a reset button and dynamic attendee rows.',
    files: { 'App.vue': signupApp },
    expected: 'A sign-up form. Fill it in and press **Register** (or Enter in a text field): a JSON preview shows exactly what would be sent. Tick two workshops and notice `workshops` becomes an array. Type a name with spaces around it — they end up in the data.',
    experiments: [
      {
        id: 'trim-name',
        task: 'Type `  Ada Lovelace  ` (with spaces) as the name and submit: the spaces are in the data. Make the **name** field trim whitespace automatically.',
        hint: 'Add the `.trim` modifier: `v-model.trim="form.name"`.',
        tests: [
          {
            name: 'the submitted name has no surrounding spaces',
            code: `await type('#name', '  Ada Lovelace  ')
await submit('form')
expect(text('.preview')).toContain('"name": "Ada Lovelace"')`,
          },
        ],
        explain: '`.trim` cleans the value before it reaches your state, so validation and the server never see accidental spaces. (It trims the stored value; the server should still trim and validate.)',
      },
      {
        id: 'guests-number',
        task: 'Add a **Guests** field: `emptyForm()` gets `guests: 1`, and the template gets a labelled `<input id="guests" type="number" min="1" max="4" v-model="form.guests">`. Submit with 3 guests and look at the preview: is it `3` or `"3"`?',
        hint: 'Put a `<label for="guests">Guests</label>` before the input. No modifier is needed for `type="number"`.',
        tests: [
          {
            name: 'guests is submitted as a number',
            code: `expect(exists('#guests')).toBe(true)
await type('#guests', '3')
await submit('form')
expect(text('.preview')).toContain('"guests": 3')
expect(text('.preview')).not.toContain('"guests": "3"')`,
          },
        ],
        explain: 'Inputs always hold strings in the DOM. Vue casts `type="number"` inputs for you (like the `.number` modifier), so `3` arrives as a number. A plain text input would give `"3"`, and `"3" + 1` is `"31"`.',
      },
      {
        id: 'reset-button',
        task: 'Add a **Reset** button with `class="reset"` that puts every field back to its starting value and hides the preview. It must **not** submit the form.',
        hint: 'Write `function reset() { Object.assign(form, emptyForm()); submitted.value = null }` and use `<button type="button" class="reset" @click="reset">`.',
        tests: [
          {
            name: 'reset restores the defaults without submitting',
            code: `await type('#name', 'Grace')
await check(findAll('input[type="checkbox"][value]')[0], true)
await submit('form')
expect(exists('.preview')).toBe(true)
expect(exists('.reset')).toBe(true)
await click('.reset')
expect(find('#name').value).toBe('')
expect(findAll('input[type="checkbox"][value]')[0].checked).toBe(false)
expect(exists('.preview')).toBe(false)`,
          },
        ],
        explain: 'The same `emptyForm()` that built the form rebuilds it, so reset can never forget a field. `type="button"` matters: a typeless button inside a form is a submit button, and clicking it would show the preview again.',
      },
      {
        id: 'attendees',
        task: 'Let people bring friends: add `attendees: []` to `emptyForm()`, an **Add attendee** button (`class="add-attendee"`) that pushes `{ id, name: \'\' }`, and for each attendee an `<input class="attendee">` plus a **Remove** button (`class="remove-attendee"`). Use the id as the `:key`.',
        hint: 'Keep `let nextId = 1` in the script. In the template: `<div v-for="person in form.attendees" :key="person.id">`. Both new buttons need `type="button"`.',
        tests: [
          {
            name: 'rows can be added, filled, removed and submitted',
            code: `expect(exists('.add-attendee')).toBe(true)
await click('.add-attendee')
await click('.add-attendee')
expect(findAll('.attendee')).toHaveLength(2)
await type(findAll('.attendee')[1], 'Grace')
await click(findAll('.remove-attendee')[0])
expect(findAll('.attendee')).toHaveLength(1)
expect(findAll('.attendee')[0].value).toBe('Grace')
await submit('form')
expect(text('.preview')).toContain('Grace')`,
          },
        ],
        explain: 'A dynamic form is just a `v-for` over an array in your state. Adding or removing a row is an array operation, and `v-model` on `person.name` writes straight into the right object. Stable ids as keys keep each input attached to its own person when rows are removed.',
      },
    ],
  },

  internals: {
    beginner: `
\`v-model\` is shorthand. On a text input, \`v-model="form.name"\` means: "show \`form.name\` as the input's value, and whenever the user types, write the new text back into \`form.name\`". It's a value going in and an event coming out.

For checkboxes and radios, the "value going in" is whether the box is ticked, and the event is \`change\` instead of \`input\`. Vue picks the right combination for each kind of input, so you write \`v-model\` everywhere.
`,
    technical: [
      `
**Compiled form.** On native elements, \`v-model\` compiles to a built-in directive (\`vModelText\`, \`vModelCheckbox\`, \`vModelRadio\`, \`vModelSelect\`) plus an \`onUpdate:modelValue\` handler that assigns the new value:
`,
      {
        code: `<!-- you write -->
<input v-model="form.name" />

<!-- roughly what the compiler produces (simplified) -->
<input
  :value="form.name"
  @input="form.name = $event.target.value"
/>`,
        lang: 'vue',
        title: 'v-model, desugared (simplified)',
      },
      `
| Element | DOM property Vue sets | Event Vue listens to | Value written |
|---|---|---|---|
| \`<input>\`, \`<textarea>\` | \`value\` | \`input\` (\`change\` with \`.lazy\`) | string (number with \`.number\` or \`type="number"\`) |
| checkbox (single) | \`checked\` | \`change\` | \`true\`/\`false\` or \`true-value\`/\`false-value\` |
| checkbox (bound to array) | \`checked\` | \`change\` | the array with this box's \`value\` added/removed |
| radio | \`checked\` | \`change\` | the radio's \`value\` |
| \`<select>\` | selected option | \`change\` | option \`value\` (array with \`multiple\`) |

**Non-string values.** When you bind \`:value="n"\` on a radio, checkbox or option, Vue remembers the real JavaScript value (a number, even an object) and writes *that* back — not the stringified DOM value.

**IME composition.** For languages typed through an input method editor (Chinese, Japanese, Korean…), \`v-model\` waits until composition ends before updating. If you need every intermediate keystroke, bind \`:value\` and \`@input\` yourself.

**The submit event.** A form submits when the user presses Enter in a single-line field (implicit submission) or clicks a submit button. The browser first runs constraint validation (unless \`novalidate\`), then fires \`submit\`; if nothing calls \`preventDefault()\`, it navigates. \`form.requestSubmit()\` behaves like a click on a submit button; \`form.submit()\` skips validation *and* the submit event.
`,
    ],
    production: `
- **One source of truth.** Keep form state in one object, created by a factory function. It makes reset, "unsaved changes" detection and testing trivial.
- **Don't trust the client.** Everything the browser sends can be edited in devtools. The server validates types, lengths and permissions again.
- **Autocomplete helps users.** Set \`name\` and \`autocomplete\` (\`name\`, \`email\`, \`street-address\`, \`one-time-code\`…) so browsers and password managers can fill fields correctly.
- **Snapshot before sending.** Send a plain copy (\`structuredClone(toRaw(form))\` or a JSON round-trip for simple data), not the live reactive object that keeps changing as the user types.
- **FormData is fine too.** For simple forms, reading \`new FormData(event.target)\` in the submit handler is valid and needs no \`v-model\` — but you lose live state for counters, conditional fields and validation as you type.
- **Accessibility from the start:** labels for every field, fieldsets for groups, visible focus, and no placeholder-as-label. The [accessible inputs lesson](lesson:accessible-reusable-inputs) goes deeper.
`,
  },

  mistakes: [
    {
      title: 'Forgetting `.prevent` on submit',
      wrong: { code: `<form @submit="save">  <!-- the page reloads after save() runs -->`, lang: 'vue' },
      right: { code: `<form @submit.prevent="save">`, lang: 'vue' },
      explanation: 'Without `preventDefault()`, the browser performs its default form submission: it navigates to the form\'s action URL (the current page if none), reloading and wiping all state. (This sandbox blocks the reload and warns you.)',
    },
    {
      title: 'Buttons that accidentally submit',
      wrong: { code: `<form @submit.prevent="save">
  <button @click="addRow">Add row</button>  <!-- also submits! -->
</form>`, lang: 'vue' },
      right: { code: `<form @submit.prevent="save">
  <button type="button" @click="addRow">Add row</button>
</form>`, lang: 'vue' },
      explanation: 'The default `type` of a `<button>` inside a form is `submit`. Every non-submit button needs `type="button"`.',
    },
    {
      title: 'Doing maths with strings from text inputs',
      wrong: { code: `<input v-model="qty" />  <!-- "2" -->
<p>{{ qty + 1 }}</p>      <!-- "21" -->`, lang: 'vue' },
      right: { code: `<input v-model.number="qty" />  <!-- 2 -->
<p>{{ qty + 1 }}</p>             <!-- 3 -->`, lang: 'vue' },
      explanation: 'DOM inputs hold strings. `+` with a string concatenates. Use `.number`, `type="number"` (cast automatically by Vue), or convert with `Number()` where you compute.',
    },
    {
      title: 'Setting initial values in HTML attributes',
      wrong: { code: `<input v-model="form.city" value="Pune" />  <!-- ignored -->
<option value="M" selected>Medium</option>   <!-- ignored -->`, lang: 'vue' },
      right: { code: `const form = reactive({ city: 'Pune', shirt: 'M' })`, lang: 'js' },
      explanation: '`v-model` treats your JavaScript state as the source of truth and ignores `value`, `checked` and `selected` attributes. Put initial values in state.',
    },
    {
      title: 'Index keys on removable rows',
      wrong: { code: `<div v-for="(row, i) in rows" :key="i">…</div>`, lang: 'vue' },
      right: { code: `<div v-for="row in rows" :key="row.id">…</div>`, lang: 'vue' },
      explanation: 'When a row is removed, every later index shifts, so Vue reuses the wrong elements — any per-row DOM or component state (focus, an open dropdown, a child\'s local data) ends up on the wrong row. Stable ids keep identity.',
    },
  ],

  debugging: [
    {
      symptom: 'The page flashes and all form data disappears when submitting.',
      cause: 'The submit event was not prevented, so the browser navigated.',
      fix: 'Use `@submit.prevent` on the `<form>`.',
    },
    {
      symptom: 'Clicking "Add row" (or "Show password") submits the form.',
      cause: 'The button has no `type`, so it defaults to `submit`.',
      fix: 'Add `type="button"` to every button that isn\'t meant to submit.',
    },
    {
      symptom: 'A total shows "12" + "3" = "123".',
      cause: 'Values from text inputs are strings.',
      fix: 'Use `v-model.number`, `type="number"`, or `Number()` in the computation.',
    },
    {
      symptom: 'A checkbox group gives `true` instead of a list.',
      cause: 'The model is not an array (e.g. initialised to `false` or `\'\'`), so Vue treats it as a single checkbox.',
      fix: 'Initialise the model to `[]` and give each checkbox a `value`.',
    },
    {
      symptom: 'The preview keeps changing after submit as you edit fields.',
      cause: 'The submitted value is the live reactive object, not a copy.',
      fix: 'Store a snapshot (`structuredClone(toRaw(form))` or a JSON round-trip for plain data).',
    },
  ],

  bestPractices: [
    'Keep each form\'s state in one object created by an `emptyForm()` factory; reuse it for reset.',
    'Handle submission with `@submit.prevent` on the form so Enter works too.',
    'Give every non-submit button inside a form `type="button"`.',
    'Pick the right model type: string, boolean, array, number — and initialise it accordingly.',
    'Use `.trim` for names and emails, `.number`/`type="number"` for quantities.',
    'Use stable ids as keys for dynamic rows.',
    'Label every field and group related controls with `<fieldset>` and `<legend>`.',
  ],

  useCases: [
    'Registration and contact forms.',
    'Checkout forms with shipping options (radio) and extras (checkbox group).',
    'Invoices, recipe ingredients and survey questions with add/remove rows.',
    'Settings pages where toggles and selects save preferences.',
    'Search forms where Enter should trigger the search.',
  ],

  whenToUse: {
    use: [
      '`v-model` when the UI needs live values: counters, conditional fields, totals, validation as you type.',
      'A single reactive form object for any form with more than one field.',
      '`@submit.prevent` for every form your JavaScript handles.',
      'Dynamic rows (`v-for` + array) whenever the user decides how many entries there are.',
    ],
    avoid: [
      'Reading values with `document.querySelector` inside a Vue component.',
      '`@click` on the submit button as the only handler — Enter wouldn\'t work.',
      'Index keys for rows that can be removed or reordered.',
      'Relying on HTML attributes for initial values when using `v-model`.',
    ],
  },

  comparison: {
    title: 'Reading form data: v-model vs FormData',
    headers: ['', '`v-model` + reactive object', '`new FormData(form)` on submit'],
    rows: [
      ['Live values while typing', 'yes', 'no — only when you read it'],
      ['Conditional fields, counters, totals', 'easy', 'needs extra listeners'],
      ['Types', 'strings, numbers, booleans, arrays as you choose', 'strings (and Files); use `getAll()` for multiple values'],
      ['Needs `name` attributes', 'no (still good for autocomplete)', 'yes'],
      ['Reset', 'reassign from a factory', '`form.reset()` (back to HTML defaults)'],
      ['Best for', 'almost every Vue form', 'very simple forms, file uploads, progressive enhancement'],
    ],
    note: 'Next: [client-side validation, touched & dirty](lesson:form-validation).',
  },

  quiz: [
    {
      id: 'native-form-handling-q1',
      type: 'mcq',
      prompt: 'What does `v-model` write for a **single** checkbox with no `value`, `true-value` or `false-value`?',
      options: [
        { text: '`true` when checked, `false` when not' },
        { text: 'The string `"on"`', why: 'That is what FormData would send for a checked box; `v-model` uses booleans.' },
        { text: 'An array of checked values', why: 'Only when the model is an array (a checkbox group).' },
        { text: '`1` or `0`', why: 'You could get those with `true-value="1"`, but the default is a boolean.' },
      ],
      answer: 0,
      explanation: 'A lone checkbox bound to a non-array model writes `true`/`false`, or the `true-value`/`false-value` you provide.',
    },
    {
      id: 'native-form-handling-q2',
      type: 'output',
      prompt: 'The user ticks **Testing**, then **Vue**. What does the paragraph show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const picked = ref([])
</script>

<template>
  <label><input type="checkbox" value="vue" v-model="picked" /> Vue</label>
  <label><input type="checkbox" value="testing" v-model="picked" /> Testing</label>
  <p>{{ picked.join(',') }}</p>
</template>`,
      },
      options: [
        { text: 'testing,vue' },
        { text: 'vue,testing', why: 'Vue appends values in the order they are checked, not the order of the boxes.' },
        { text: 'true', why: 'The model is an array, so it collects values instead of a boolean.' },
        { text: 'vue', why: 'Both boxes are checked, so both values are in the array.' },
      ],
      answer: 0,
      explanation: 'Checking a box pushes its `value` onto the array. Testing was checked first, so the array is `[\'testing\', \'vue\']`.',
    },
    {
      id: 'native-form-handling-q3',
      type: 'bug',
      prompt: 'Submitting this form reloads the page and the data is lost. Click the line to fix.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { reactive } from 'vue'
const form = reactive({ email: '' })
function subscribe() {
  console.log('subscribing', form.email)
}
</script>

<template>
  <form @submit="subscribe">
    <input type="email" v-model="form.email" />
    <button>Subscribe</button>
  </form>
</template>`,
      },
      answerLine: 10,
      explanation: '`@submit` runs the handler but doesn\'t stop the browser\'s default navigation. Use `@submit.prevent="subscribe"`.',
    },
    {
      id: 'native-form-handling-q4',
      type: 'fill',
      prompt: 'Complete the template so the form doesn\'t reload the page and the name has no surrounding spaces.',
      code: {
        lang: 'vue',
        code: `<form @submit.___="save">
  <input v-model.___="form.name" />
  <button type="submit">Save</button>
</form>`,
      },
      answer: [['prevent'], ['trim']],
      explanation: '`.prevent` calls `preventDefault()` on the submit event; `.trim` strips whitespace before the value reaches your state.',
    },
    {
      id: 'native-form-handling-q5',
      type: 'mcq',
      prompt: 'Inside a `<form>`, which button does **not** submit it when clicked?',
      options: [
        { text: '`<button type="button">Add row</button>`' },
        { text: '`<button>Add row</button>`', why: 'A button inside a form with no `type` defaults to `type="submit"`.' },
        { text: '`<button type="submit">Add row</button>`', why: 'That is explicitly a submit button.' },
        { text: '`<input type="submit" value="Add row">`', why: 'Submit inputs submit the form.' },
      ],
      answer: 0,
      explanation: 'Only `type="button"` (or `type="reset"`, which resets native values) avoids submitting.',
    },
    {
      id: 'native-form-handling-q6',
      type: 'mcq',
      prompt: 'What does `v-model.lazy` change?',
      options: [
        { text: 'The value syncs on the `change` event (e.g. when the field loses focus) instead of on every keystroke' },
        { text: 'It delays the initial render of the input', why: 'It only changes which event updates the state.' },
        { text: 'It debounces typing by 300 ms', why: 'Vue has no built-in debounce modifier for v-model.' },
        { text: 'It makes the field load its value from the server lazily', why: 'It has nothing to do with data loading.' },
      ],
      answer: 0,
      explanation: '`.lazy` switches text inputs from the `input` event to `change`. Useful when you only care about the final value.',
    },
    {
      id: 'native-form-handling-q7',
      type: 'short',
      prompt: 'Why is it a good idea to build the form state with a function like `emptyForm()` instead of writing the object inline?',
      answer: 'Because the same function can be called again to reset the form, so the reset can never forget a field or drift from the initial values. It also returns a fresh object each time, so nothing can accidentally mutate a shared "blank" object, and it documents the shape and types of the form in one place.',
    },
  ],

  exercises: [
    {
      id: 'feedback-form',
      title: 'A feedback form with a live counter',
      difficulty: 'beginner',
      prompt: `
Wire up the feedback form in \`App.vue\` (keep the existing refs \`name\`, \`message\` and \`rating\`):

- \`.name\` is bound to \`name\` and **trimmed**;
- the five radios set \`rating\` to a **number** (1–5);
- \`.message\` is bound to \`message\`, and \`.counter\` shows \`<length> / 200\` live;
- submitting must **not reload the page**;
- submitting without a rating shows \`<p class="error">Please choose a rating.</p>\`;
- a successful submit replaces the form with \`<p class="thanks">Thanks, <name>! You rated us <rating>/5.</p>\`.
`,
      files: { 'App.vue': feedbackStarter },
      hints: [
        'Add `v-model.trim="name"`, `v-model="message"` and `v-model="rating"` on the radios. Because they already use `:value="n"`, the stored rating is a number.',
        'The counter is `{{ message.length }} / 200`. Add `@submit.prevent="send"` to the form.',
        'In `send()`, check `rating.value === null` to set an error; otherwise set a `sent` ref and use `v-if="sent"` / `v-else` to swap the thanks message and the form.',
      ],
      solution: {
        explanation: 'Every field writes into a ref, so the counter and the thanks message are just expressions of state. `:value="n"` on the radios makes `v-model` store real numbers. `.prevent` keeps the page alive, and a tiny check prepares you for the validation lesson.',
        files: { 'App.vue': feedbackSolution },
      },
      tests: [
        {
          name: 'the counter updates while typing',
          code: `await type('.message', 'Great talk!')
expect(text('.counter')).toBe('11 / 200')`,
        },
        {
          name: 'a complete submit shows the thanks message',
          code: `await type('.name', '  Ada  ')
await check(findAll('input[name="rating"]')[3], true)
await submit('form')
expect(text('.thanks')).toBe('Thanks, Ada! You rated us 4/5.')
expect(exists('form')).toBe(false)`,
        },
        {
          name: 'the rating is stored as a number',
          code: `await check(findAll('input[name="rating"]')[4], true)
expect(state.rating).toBe(5)`,
        },
        {
          name: 'submitting without a rating shows an error',
          code: `await type('.name', 'Ada')
await submit('form')
expect(text('.error')).toContain('Please choose a rating')
expect(exists('.thanks')).toBe(false)`,
        },
        {
          name: 'the submit event is prevented',
          code: `const event = new Event('submit', { bubbles: true, cancelable: true })
find('form').dispatchEvent(event)
expect(event.defaultPrevented).toBe(true)`,
        },
      ],
    },
    {
      id: 'invoice-lines',
      title: 'Dynamic invoice lines',
      difficulty: 'intermediate',
      prompt: `
Build an invoice with a variable number of lines in \`App.vue\`:

- each line (\`.line\`) has \`.desc\`, \`.qty\` and \`.price\` inputs and a \`.remove-line\` button;
- \`.add-line\` adds a line with \`qty: 1, price: 0\`;
- \`.remove-line\` removes **that** line, leaving the others' values intact;
- \`.total\` shows \`Total: <sum of qty × price>\` with two decimals (e.g. \`Total: 24.00\`);
- **Add** and **Remove** must not submit the form; **Save invoice** still does (it shows \`.saved\`).

Use a stable id for each line's \`:key\`.
`,
      files: { 'App.vue': invoiceStarter },
      hints: [
        'Inside a form, buttons without a `type` submit it. Give the add and remove buttons `type="button"`.',
        'Keep a `let nextId = 2` counter; `addLine()` pushes `{ id: nextId++, … }` and `removeLine(id)` filters by id. Use `:key="line.id"`.',
        'The total is a `computed`: `lines.value.reduce((sum, l) => sum + Number(l.qty) * Number(l.price), 0)`, shown with `.toFixed(2)`.',
      ],
      solution: {
        explanation: 'The form is an array in state; adding and removing rows are array operations. `type="button"` keeps those buttons from submitting, stable ids keep each row\'s identity, and the total is derived — never stored — so it is always correct.',
        files: { 'App.vue': invoiceSolution },
      },
      tests: [
        { name: 'starts with one line and a zero total', code: `expect(findAll('.line')).toHaveLength(1)\nexpect(text('.total')).toBe('Total: 0.00')` },
        {
          name: 'Add line adds a row without submitting',
          code: `await click('.add-line')
expect(findAll('.line')).toHaveLength(2)
expect(exists('.saved')).toBe(false)`,
        },
        {
          name: 'the total sums qty × price',
          code: `await click('.add-line')
const lines = findAll('.line')
await type(lines[0].querySelector('.qty'), '2')
await type(lines[0].querySelector('.price'), '9.5')
await type(lines[1].querySelector('.price'), '5')
expect(text('.total')).toBe('Total: 24.00')`,
        },
        {
          name: 'removing a line keeps the others intact',
          code: `await click('.add-line')
let lines = findAll('.line')
await type(lines[0].querySelector('.desc'), 'Design')
await type(lines[1].querySelector('.desc'), 'Hosting')
await type(lines[1].querySelector('.price'), '5')
await click(lines[0].querySelector('.remove-line'))
lines = findAll('.line')
expect(lines).toHaveLength(1)
expect(lines[0].querySelector('.desc').value).toBe('Hosting')
expect(text('.total')).toBe('Total: 5.00')
expect(exists('.saved')).toBe(false)`,
        },
        {
          name: 'saving still submits',
          code: `await submit('form')
expect(exists('.saved')).toBe(true)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'native-form-handling-submit-prevent',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why do Vue forms use `@submit.prevent` on the `<form>` instead of `@click` on the submit button?',
      answer: 'A form can be submitted by clicking a submit button *or* by pressing Enter in a field, and both fire the form\'s `submit` event — a click handler on the button would miss Enter. `.prevent` calls `preventDefault()` so the browser doesn\'t perform its default navigation, which would reload the page and wipe app state.',
      explanation: 'Listen where the event happens (the form), and stop the browser\'s default behaviour.',
      whyAsked: 'Checks basic web-platform knowledge that many framework-first developers skip.',
      mistakes: ['Not knowing Enter submits forms.', 'Thinking `.prevent` stops validation — the browser validates before firing submit.', 'Using `@click.prevent` on the button.'],
      followUps: ['What is implicit submission?', 'What is the difference between `form.submit()` and `form.requestSubmit()`?'],
      modelAnswer: 'Forms submit in more than one way: clicking a submit button or pressing Enter in a field. Both fire the form\'s submit event, so I listen there. By default the browser then navigates to the form\'s action, reloading the page and throwing away the app\'s state, so `.prevent` calls `preventDefault()`. Native constraint validation still runs before the submit event unless the form has `novalidate`.',
    },
    {
      id: 'native-form-handling-model-types',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'A form has a single checkbox bound to `agree` (initially `false`) and a checkbox group bound to `tags` (initially `[]`) with values `a` and `b`. The user ticks the single box and then box `b`. What are `agree` and `tags`?',
      options: ['`agree: "on"`, `tags: "b"`', '`agree: true`, `tags: ["b"]`', '`agree: true`, `tags: true`', '`agree: 1`, `tags: ["a", "b"]`'],
      correctOption: 1,
      answer: '`agree` is `true` and `tags` is `["b"]`. A checkbox bound to a non-array model writes booleans; checkboxes bound to an array add or remove their `value`.',
      explanation: 'The model\'s type decides the behaviour: array → collect values, otherwise boolean (or `true-value`/`false-value`).',
      whyAsked: 'Quick check that you know `v-model` semantics per input type.',
      mistakes: ['Answering `"on"` (the FormData value).', 'Thinking unchecked group boxes appear in the array.'],
      followUps: ['How do you store "yes"/"no" instead of booleans?', 'What does `<select multiple>` bind to?'],
      modelAnswer: '`agree` becomes `true` because a lone checkbox with a non-array model writes booleans. `tags` becomes `["b"]` because checkboxes bound to an array push their `value` when ticked and remove it when unticked. If I needed other values I would use `true-value` and `false-value`.',
    },
    {
      id: 'native-form-handling-string-numbers',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'An order form shows a total of "210" when quantity is 2 and the extra is 10. What is wrong and how do you fix it?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, computed } from 'vue'
const qty = ref(1)
const extra = ref(0)
const total = computed(() => qty.value + extra.value)
</script>

<template>
  <input v-model="qty" />
  <input v-model="extra" />
  <p>Total: {{ total }}</p>
</template>`,
      },
      answer: 'DOM inputs produce strings, so after typing `qty` is `"2"` and `extra` is `"10"`; `+` concatenates them into `"210"`. Use `v-model.number` (or `type="number"`, which Vue casts automatically), and/or convert with `Number()` inside the computed so empty strings are handled.',
      explanation: 'The initial values were numbers, but the first keystroke replaced them with strings.',
      whyAsked: 'A very common real bug; tests understanding of how DOM values flow into state.',
      mistakes: ['Blaming `computed`.', 'Using `parseInt` everywhere in the template instead of fixing the binding.'],
      followUps: ['What does `.number` do with input it cannot parse?', 'Why might you still keep `Number()` in the computed?'],
      modelAnswer: 'The refs start as numbers, but text inputs write strings, so after typing the computed adds "2" and "10" and gets "210". I would bind with `v-model.number` or use `type="number"`, which Vue casts automatically. I would also keep a `Number()` conversion in the computed, because a cleared number field gives an empty string.',
    },
    {
      id: 'native-form-handling-button-type',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'Clicking "Show password" toggles the password field but also submits the login form. Why?',
      code: {
        lang: 'vue',
        code: `<form @submit.prevent="login">
  <input :type="visible ? 'text' : 'password'" v-model="password" />
  <button @click="visible = !visible">Show password</button>
  <button>Log in</button>
</form>`,
      },
      answer: 'Inside a form, a `<button>` without a `type` attribute is a submit button. Clicking it runs the click handler *and* submits the form. Add `type="button"` to the toggle (and ideally `type="submit"` to the real submit button for clarity).',
      explanation: 'HTML\'s default button type in a form is `submit`.',
      whyAsked: 'Shows attention to HTML defaults — a frequent source of production bugs.',
      mistakes: ['Adding `.prevent` to the click (works, but hides the real issue).', 'Moving the button outside the form.'],
      followUps: ['What does `type="reset"` do, and why is it rarely used with v-model?'],
      modelAnswer: 'The toggle has no type, and inside a form a button defaults to type="submit", so clicking it also submits. The fix is `type="button"` on the toggle, and I would write `type="submit"` on the login button explicitly so intent is obvious to the next reader.',
    },
    {
      id: 'native-form-handling-vmodel-vs-formdata',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'When would you read a form with `new FormData(event.target)` instead of binding every field with `v-model`?',
      answer: 'FormData suits simple forms where you only need values at submit time, file uploads (it carries `File` objects and multipart encoding), or progressive enhancement where the form also works without JavaScript. It requires `name` attributes and gives strings (use `getAll` for multi-values). `v-model` is better when the UI needs live values: conditional fields, counters, totals, validation while typing, unsaved-changes detection.',
      explanation: 'FormData reads a snapshot from the DOM; v-model keeps state continuously in sync.',
      whyAsked: 'Shows you understand the platform as well as the framework.',
      mistakes: ['Saying FormData doesn\'t work with Vue.', 'Forgetting checkbox groups need `getAll()`.', 'Ignoring file uploads.'],
      followUps: ['How would you send a file and JSON fields together?', 'How do you reset each approach?'],
      modelAnswer: 'With v-model my state is always current, which I need for conditional sections, live totals or validation as the user types. FormData reads the DOM once at submit; it is great for very simple forms, for file uploads because it carries File objects, and for progressive enhancement. It needs name attributes, gives strings, and checkbox groups need getAll. In most Vue apps I use v-model and build a FormData only when uploading files.',
    },
    {
      id: 'native-form-handling-dynamic-rows',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A dynamic "team members" form renders each row as a `<MemberRow>` component with its own local "expanded" state, keyed by index. After deleting the first row, the second row\'s details panel appears expanded/collapsed incorrectly. Explain and fix.',
      answer: 'With `:key="index"`, deleting row 0 shifts every later item down one index. Vue sees keys 0..n-1 still present (minus the last), so it reuses the existing component instances for the shifted data and destroys the last one. Each instance keeps its local state (expanded), now attached to a different member. Fix: use a stable unique id for each row (`:key="member.id"`), generated when the row is created.',
      explanation: 'Keys tell Vue which DOM/component instance belongs to which item.',
      whyAsked: 'Probes understanding of keyed diffing in a realistic form scenario.',
      mistakes: ['Saying index keys are fine "because the data updates".', 'Using `Math.random()` as a key in the template (new key every render).'],
      followUps: ['Where should ids come from for rows not yet saved?', 'Would the bug appear without local component state?'],
      modelAnswer: 'Index keys tie component instances to positions, not to members. When I delete the first row, the indexes shift, so Vue patches the existing instances with new props and removes the last instance — local state like "expanded" stays with the instance and ends up on the wrong member. Plain v-model inputs mostly look fine because their values come from props, which hides the bug. I would assign a stable id when each row is created — a counter or crypto.randomUUID — and key by it.',
    },
    {
      id: 'native-form-handling-coding-newsletter',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Wire up the newsletter form: bind `.email` (trimmed) to `email`, the `.topic` checkboxes to the `topics` array, and `.frequency` to `frequency`. On submit (without reloading), set `summary` to `<email> · <frequency> · <topics joined by ", ">` — or `no topics` when none are ticked.',
      starter: { files: { 'App.vue': newsletterStarter } },
      tests: [
        {
          name: 'summary with topics',
          code: `await type('.email', ' ada@example.com ')
await check(findAll('.topic')[0], true)
await check(findAll('.topic')[2], true)
await select('.frequency', 'monthly')
await submit('form')
expect(text('.summary')).toBe('ada@example.com · monthly · news, events')`,
        },
        {
          name: 'summary without topics',
          code: `await type('.email', 'grace@example.com')
await submit('form')
expect(text('.summary')).toBe('grace@example.com · weekly · no topics')`,
        },
      ],
      hints: ['`v-model.trim` for the email, `v-model="topics"` on each checkbox (the array collects values), `v-model="frequency"` on the select.', 'Add `@submit.prevent="subscribe"` and build the string in `subscribe()`.'],
      answer: 'Bind each control with the right `v-model`, then build the summary in a `@submit.prevent` handler.',
      solution: { files: { 'App.vue': newsletterSolution } },
      explanation: 'Three input types, three model types: a trimmed string, an array collected by checkboxes, and a single value from a select. The submit handler only reads state.',
      whyAsked: 'A warm-up that reveals whether you know v-model semantics for each input type.',
      mistakes: ['Initialising `topics` as a boolean.', 'Handling `@click` on the button instead of submit.', 'Querying the DOM in the handler.'],
      followUps: ['How would you require at least one topic?', 'How would you reset the form after subscribing?'],
      modelAnswer: 'I bind the email with v-model.trim, all three checkboxes to the same topics array so ticked values are collected, and the select to frequency. A `@submit.prevent` handler builds the summary from state, using "no topics" when the array is empty. No DOM queries are needed.',
    },
  ],

  takeaways: [
    '`v-model` binds every native input; the model type follows the input: string, boolean, array or a single choice.',
    'Keep each form in one object built by a factory — reuse the factory to reset.',
    'Submit with `@submit.prevent` on the form; Enter submits too.',
    'Inside a form, buttons default to `type="submit"` — use `type="button"` for everything else.',
    'Inputs give strings: use `.number` (automatic for `type="number"`) and `.trim` where they help.',
    'Dynamic forms are arrays in state rendered with `v-for` and stable id keys.',
  ],
}
