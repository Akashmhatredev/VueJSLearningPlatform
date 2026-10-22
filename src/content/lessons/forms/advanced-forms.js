// Lesson: Async validation, server errors & duplicate submits

const registerApi = `// A fake server (simplified): in-memory data, short delays, real-looking errors.
const takenUsernames = ['admin', 'ada', 'vue']
const takenEmails = ['taken@example.com']
export const stats = { usernameChecks: 0, registrations: 0 }

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Shorter names answer MORE SLOWLY here, so a race is easy to reproduce
export async function checkUsername(username) {
  stats.usernameChecks++
  await delay(Math.max(100, 400 - username.length * 60))
  return { available: !takenUsernames.includes(username.toLowerCase()) }
}

export async function register(payload) {
  stats.registrations++
  await delay(300)
  const fields = {}
  if (takenEmails.includes(payload.email.toLowerCase())) fields.email = 'This email is already registered.'
  if (takenUsernames.includes(payload.username.toLowerCase())) fields.username = 'This username was just taken.'
  if (Object.keys(fields).length) {
    const error = new Error('Validation failed')
    error.status = 422 // "Unprocessable Content": the request was understood but the data is invalid
    error.fields = fields
    throw error
  }
  return { id: 100 + stats.registrations, username: payload.username, email: payload.email }
}`

const registerApp = `<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { checkUsername, register } from './api.js'

function initialValues() {
  return { username: '', email: '', password: '', terms: false }
}

const values = reactive(initialValues())
const touched = reactive({})
const submitAttempted = ref(false)
const usernameStatus = ref('idle') // 'idle' | 'checking' | 'available' | 'taken'
const serverErrors = reactive({})  // field → message from the server
const formError = ref('')
const isSubmitting = ref(false)
const createdUser = ref(null)

const EMAIL = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ // simplified
const USERNAME = /^[a-z0-9_]{3,20}$/i

// Synchronous rules: instant, in the browser
const errors = computed(() => {
  const e = {}
  if (!USERNAME.test(values.username)) e.username = 'Use 3–20 letters, numbers or _.'
  else if (usernameStatus.value === 'taken') e.username = 'That username is taken.'
  if (!EMAIL.test(values.email)) e.email = 'Enter an email like name@example.com.'
  if (values.password.length < 8) e.password = 'Use at least 8 characters.'
  if (!values.terms) e.terms = 'Please accept the terms.'
  return e
})

// Async rule: ask the server whether the username is free
watch(() => values.username, async (name) => {
  if (!USERNAME.test(name)) {
    usernameStatus.value = 'idle'
    return
  }
  usernameStatus.value = 'checking'
  const { available } = await checkUsername(name)
  usernameStatus.value = available ? 'available' : 'taken'
})

// Editing a field clears the server's complaint about it
for (const field of Object.keys(values)) {
  watch(() => values[field], () => delete serverErrors[field])
}

function visibleError(field) {
  if (serverErrors[field]) return serverErrors[field]
  return touched[field] || submitAttempted.value ? errors.value[field] : ''
}

async function onSubmit() {
  submitAttempted.value = true
  formError.value = ''
  if (Object.keys(errors.value).length) return
  if (usernameStatus.value === 'checking') {
    formError.value = 'Still checking your username — try again in a moment.'
    return
  }

  isSubmitting.value = true
  try {
    createdUser.value = await register({ ...values })
  } catch (error) {
    formError.value = 'Could not create your account. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section v-if="createdUser" class="success" role="status">
    <h3>Welcome, {{ createdUser.username }}!</h3>
    <p>Account #{{ createdUser.id }} was created for {{ createdUser.email }}.</p>
  </section>

  <form v-else novalidate @submit.prevent="onSubmit">
    <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

    <div class="field">
      <label for="username">Username</label>
      <input id="username" v-model.trim="values.username" autocomplete="username"
        @blur="touched.username = true" :aria-invalid="!!visibleError('username')" />
      <p class="username-status" aria-live="polite">
        <span v-if="usernameStatus === 'checking'">Checking availability…</span>
        <span v-else-if="usernameStatus === 'available'">✓ Username available</span>
      </p>
      <p v-if="visibleError('username')" id="username-error" class="error">{{ visibleError('username') }}</p>
    </div>

    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" v-model.trim="values.email" autocomplete="email"
        @blur="touched.email = true" :aria-invalid="!!visibleError('email')" />
      <p v-if="visibleError('email')" id="email-error" class="error">{{ visibleError('email') }}</p>
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input id="password" type="password" v-model="values.password" autocomplete="new-password"
        @blur="touched.password = true" :aria-invalid="!!visibleError('password')" />
      <p v-if="visibleError('password')" id="password-error" class="error">{{ visibleError('password') }}</p>
    </div>

    <label><input id="terms" type="checkbox" v-model="values.terms" /> I accept the terms</label>
    <p v-if="visibleError('terms')" id="terms-error" class="error">{{ visibleError('terms') }}</p>

    <button type="submit" class="submit">
      {{ isSubmitting ? 'Creating account…' : 'Create account' }}
    </button>
  </form>
</template>

<style>
.field { display: grid; gap: 2px; margin-bottom: 8px; max-width: 320px; }
.error, .form-error { color: #b00020; margin: 0; }
.username-status { min-height: 1.2em; margin: 0; font-size: 0.9em; color: #2e7d32; }
.success { background: #e7f7ea; padding: 12px; }
button[disabled] { opacity: 0.6; }
</style>`

// The finished version (all four experiments applied) — offered as a variant
const registerAppComplete = registerApp
  .replace(
    `watch(() => values.username, async (name) => {
  if (!USERNAME.test(name)) {
    usernameStatus.value = 'idle'
    return
  }
  usernameStatus.value = 'checking'
  const { available } = await checkUsername(name)
  usernameStatus.value = available ? 'available' : 'taken'
})`,
    `// Debounced (300 ms) and race-safe: a newer value cancels the older check
watch(() => values.username, (name, _oldName, onCleanup) => {
  if (!USERNAME.test(name)) {
    usernameStatus.value = 'idle'
    return
  }
  usernameStatus.value = 'checking'
  let cancelled = false
  const timer = setTimeout(async () => {
    const { available } = await checkUsername(name)
    if (!cancelled) usernameStatus.value = available ? 'available' : 'taken'
  }, 300)
  onCleanup(() => {
    cancelled = true
    clearTimeout(timer)
  })
})`,
  )
  .replace(
    `async function onSubmit() {
  submitAttempted.value = true`,
    `async function onSubmit() {
  if (isSubmitting.value) return // already sending: ignore double clicks / Enter
  submitAttempted.value = true`,
  )
  .replace(
    `  } catch (error) {
    formError.value = 'Could not create your account. Please try again.'
  }`,
    `  } catch (error) {
    if (error.status === 422 && error.fields) {
      Object.assign(serverErrors, error.fields) // show them next to the fields
    } else {
      formError.value = 'Could not create your account. Please try again.'
    }
  }`,
  )
  .replace(
    `<button type="submit" class="submit">`,
    `<button type="submit" class="submit" :disabled="isSubmitting" :aria-busy="isSubmitting">`,
  )

// ---- exercise: map server errors
const profileApi = `export const stats = { saves: 0 }

// Simulated server (simplified)
export function saveProfile(payload) {
  stats.saves++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (payload.displayName === 'crash') {
        const error = new Error('Internal Server Error')
        error.status = 500
        return reject(error)
      }
      const fields = {}
      if (payload.email === 'taken@example.com') fields.email = 'Email is already in use.'
      if (payload.website.startsWith('http://')) fields.website = 'Website must start with https://'
      if (Object.keys(fields).length) {
        const error = new Error('Validation failed')
        error.status = 422
        error.fields = fields
        return reject(error)
      }
      resolve({ ...payload })
    }, 150)
  })
}`

const profileStarter = `<script setup>
import { reactive, ref } from 'vue'
import { saveProfile } from './api.js'

const values = reactive({ displayName: 'Ada', email: 'ada@example.com', website: 'https://ada.dev' })
const serverErrors = reactive({})
const formError = ref('')
const saved = ref(false)

async function onSubmit() {
  formError.value = ''
  saved.value = false
  try {
    await saveProfile({ ...values })
    saved.value = true
  } catch (error) {
    formError.value = 'Could not save.'
  }
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

    <label for="displayName">Display name</label>
    <input id="displayName" v-model.trim="values.displayName" />
    <p v-if="serverErrors.displayName" id="displayName-error" class="error">{{ serverErrors.displayName }}</p>

    <label for="email">Email</label>
    <input id="email" v-model.trim="values.email" />
    <p v-if="serverErrors.email" id="email-error" class="error">{{ serverErrors.email }}</p>

    <label for="website">Website</label>
    <input id="website" v-model.trim="values.website" />
    <p v-if="serverErrors.website" id="website-error" class="error">{{ serverErrors.website }}</p>

    <button type="submit">Save profile</button>
  </form>
  <p v-if="saved" class="saved" role="status">Profile saved</p>
</template>`

const profileSolution = `<script setup>
import { reactive, ref, watch } from 'vue'
import { saveProfile } from './api.js'

const values = reactive({ displayName: 'Ada', email: 'ada@example.com', website: 'https://ada.dev' })
const serverErrors = reactive({})
const formError = ref('')
const saved = ref(false)

// Editing a field means the server's old complaint about it no longer applies
for (const field of Object.keys(values)) {
  watch(() => values[field], () => delete serverErrors[field])
}

function clearServerErrors() {
  Object.keys(serverErrors).forEach((field) => delete serverErrors[field])
}

async function onSubmit() {
  formError.value = ''
  saved.value = false
  clearServerErrors()
  try {
    await saveProfile({ ...values })
    saved.value = true
  } catch (error) {
    if (error.status === 422 && error.fields) {
      Object.assign(serverErrors, error.fields)        // field-level: show next to inputs
    } else {
      formError.value = 'Something went wrong on our side. Please try again.' // everything else
    }
  }
}
</script>

<template>
  <form novalidate @submit.prevent="onSubmit">
    <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>

    <label for="displayName">Display name</label>
    <input id="displayName" v-model.trim="values.displayName" :aria-invalid="!!serverErrors.displayName" />
    <p v-if="serverErrors.displayName" id="displayName-error" class="error">{{ serverErrors.displayName }}</p>

    <label for="email">Email</label>
    <input id="email" v-model.trim="values.email" :aria-invalid="!!serverErrors.email" />
    <p v-if="serverErrors.email" id="email-error" class="error">{{ serverErrors.email }}</p>

    <label for="website">Website</label>
    <input id="website" v-model.trim="values.website" :aria-invalid="!!serverErrors.website" />
    <p v-if="serverErrors.website" id="website-error" class="error">{{ serverErrors.website }}</p>

    <button type="submit">Save profile</button>
  </form>
  <p v-if="saved" class="saved" role="status">Profile saved</p>
</template>`

// ---- exercise: promo code async validator
const couponApi = `export const stats = { checks: 0 }

const codes = { SAVE10: 10, VIP: 25 }

// Simulated server (simplified). Shorter codes answer MORE SLOWLY, to provoke races.
export function checkCoupon(code) {
  stats.checks++
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(codes[code] ? { valid: true, percent: codes[code] } : { valid: false })
    }, Math.max(80, 400 - code.length * 70))
  })
}`

const couponStarter = `<script setup>
import { ref, watch } from 'vue'
import { checkCoupon } from './api.js'

const code = ref('')
const status = ref('') // text shown to the user

watch(code, async (value) => {
  status.value = 'Checking…'
  const result = await checkCoupon(value)
  status.value = result.valid ? \`Valid: \${result.percent}% off\` : 'Invalid code'
})
</script>

<template>
  <label for="coupon">Promo code</label>
  <input id="coupon" v-model="code" autocomplete="off" />
  <p class="coupon-status" aria-live="polite">{{ status }}</p>
</template>`

const couponSolution = `<script setup>
import { ref, watch } from 'vue'
import { checkCoupon } from './api.js'

const code = ref('')
const status = ref('')

watch(code, async (value, _old, onCleanup) => {
  const normalised = value.trim().toUpperCase()
  if (!normalised) {
    status.value = '' // nothing to check — no request
    return
  }

  // If code changes again before this check finishes, Vue runs the cleanup first
  let stale = false
  onCleanup(() => {
    stale = true
  })

  status.value = 'Checking…'
  const result = await checkCoupon(normalised)
  if (stale) return // a newer value is being checked — ignore this answer
  status.value = result.valid ? \`Valid: \${result.percent}% off\` : 'Invalid code'
})
</script>

<template>
  <label for="coupon">Promo code</label>
  <input id="coupon" v-model="code" autocomplete="off" />
  <p class="coupon-status" aria-live="polite">{{ status }}</p>
</template>`

// ---- interview coding: submit guard
const contactApi = `export const stats = { sent: 0 }

// Simulated server (simplified): messages containing "fail" are rejected
export function sendMessage(text) {
  stats.sent++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (text.includes('fail')) reject(new Error('Message could not be sent.'))
      else resolve({ ok: true })
    }, 200)
  })
}`

const contactStarter = `<script setup>
import { ref } from 'vue'
import { sendMessage } from './api.js'

const message = ref('')
const isSending = ref(false)
const error = ref('')
const sent = ref(false)

async function onSubmit() {
  error.value = ''
  try {
    await sendMessage(message.value)
    sent.value = true
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <label for="message">Message</label>
    <textarea id="message" v-model="message"></textarea>
    <button type="submit" class="send">Send</button>
  </form>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <p v-if="sent" class="sent" role="status">Sent!</p>
</template>`

const contactSolution = `<script setup>
import { ref } from 'vue'
import { sendMessage } from './api.js'

const message = ref('')
const isSending = ref(false)
const error = ref('')
const sent = ref(false)

async function onSubmit() {
  if (isSending.value) return   // guard: Enter or a double click while sending
  isSending.value = true        // set BEFORE the first await
  error.value = ''
  try {
    await sendMessage(message.value)
    sent.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    isSending.value = false     // always re-enable, even after a failure
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <label for="message">Message</label>
    <textarea id="message" v-model="message"></textarea>
    <button type="submit" class="send" :disabled="isSending" :aria-busy="isSending">
      {{ isSending ? 'Sending…' : 'Send' }}
    </button>
  </form>
  <p v-if="error" class="error" role="alert">{{ error }}</p>
  <p v-if="sent" class="sent" role="status">Sent!</p>
</template>`

export default {
  id: 'advanced-forms',
  title: 'Async validation, server errors & duplicate submits',
  summary: 'Finish a production-grade registration form: async username checks without races, server-side errors mapped onto fields, honest loading states, no duplicate submissions — and when a schema library helps.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['form-validation', 'watch', 'async-js'],
  related: ['accessible-reusable-inputs', 'cancellation-race-conditions', 'async-ui-states', 'pinia-async-patterns', 'composable-design'],
  tags: ['forms', 'async validation', 'debounce', 'race condition', 'onCleanup', 'onWatcherCleanup', 'server errors', '422', 'duplicate submit', 'idempotency', 'VeeValidate', 'Zod', 'Valibot', 'schema'],
  apis: [
    { name: 'watch(source, (value, old, onCleanup) => …)', summary: 'The cleanup callback runs before the next run of the watcher — ideal for cancelling stale async checks and debounce timers.' },
    { name: 'onWatcherCleanup()', summary: 'Vue 3.5+: registers the same kind of cleanup from inside a watcher callback (must be called before the first `await`).' },
    { name: 'isSubmitting guard', summary: 'A flag set before the first `await` that ignores re-entrant submits and disables the button.' },
    { name: '422 field errors', summary: 'A common server response shape `{ fields: { email: \'…\' } }` that the form maps onto its inputs.' },
  ],
  docs: [
    { label: 'Vue Guide — Watchers: side effect cleanup', url: 'https://vuejs.org/guide/essentials/watchers.html#side-effect-cleanup' },
    { label: 'Vue API — onWatcherCleanup() (3.5+)', url: 'https://vuejs.org/api/reactivity-core.html#onwatchercleanup' },
    { label: 'Vue Guide — Form Input Bindings', url: 'https://vuejs.org/guide/essentials/forms.html' },
  ],

  intro: `
Some rules can't be checked in the browser alone. "Is this username free?" needs the server. "This email is already registered" comes back only after you submit. And the network adds its own surprises: slow answers, answers in the wrong order, and users who click **Submit** twice because nothing seemed to happen.

This lesson finishes the job started in [native form handling](lesson:native-form-handling) and [client-side validation](lesson:form-validation) with a complete registration form:

- **async validation** — check a username while the user types, debounced and race-safe;
- **server-side errors** — show the server's verdict next to the right field;
- **loading states** — tell the truth while a request is running;
- **duplicate submissions** — make sure one click means one account;
- **schema libraries** — what VeeValidate, Zod and Valibot offer, and when they are worth it.
`,

  why: `
A registration form that only validates in the browser still fails in real life:

- two people pick the same username at the same moment — only the server knows who won;
- the user types "ada", then "adam"; the answer for "ada" (taken) arrives *after* the one for "adam" (free) and the form wrongly says "taken";
- the server rejects the email, but the form shows a vague "Something went wrong" at the top and the user has no idea which field to fix;
- the network is slow, the button looks dead, the user clicks again — and gets **two** accounts (or two charges, or two orders).

None of these are exotic. They are what happens when a form meets a real network and real people. Each has a small, well-known fix.
`,

  eli15: `
Imagine signing up for a club by talking to a receptionist on the phone.

- You suggest a nickname; they check the member list and say "free" or "taken". If you change your mind mid-check, they should answer about your **new** nickname, not the old one. That's **race-safe async validation**.
- You don't ask after every letter you spell — you wait until you've finished the word. That's **debouncing**.
- When you hand in the form, the club secretary might say "that email is already used" — and should point at the email line, not just say "problem!". That's **mapping server errors to fields**.
- While the secretary is processing your form, the receptionist says "one moment…" — **a loading state** — and if you ask "did you get it?" five times, they don't sign you up five times. That's **preventing duplicate submissions**.
`,

  analogy: {
    title: 'The club receptionist on the phone',
    body: `
A good receptionist checks things for you while you talk, but always answers about the *latest* thing you said. They wait for you to finish spelling a name before looking it up. When the secretary finds a problem with your application, they tell you exactly which line to fix. And while the application is being processed, they say "please hold" and ignore repeated "did it go through?" calls — instead of filing the same application again.
`,
    mapping: [
      ['checking the member list while you talk', 'async validation in a `watch`'],
      ['answering about your latest suggestion', 'ignoring stale responses (`onCleanup`)'],
      ['waiting until you finish spelling', 'debouncing the check'],
      ['"the email line is the problem"', 'mapping 422 field errors onto inputs'],
      ['"please hold…"', 'a loading state on the submit button'],
      ['not filing the same application twice', 'the `isSubmitting` guard (+ a server idempotency key)'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'How a stale answer wins — and how cleanup stops it',
    caption: 'Requests don\'t finish in the order they start. A watcher\'s cleanup marks older checks as stale.',
    alt: 'A timeline. The user types "ada" and a check starts. Then they type "adam" and a second check starts. The "adam" check answers first with "available". The older "ada" check answers later with "taken" and, without protection, overwrites the result. With a cleanup flag, the old answer is ignored.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'ada', label: 'type "ada"', note: 'check #1 starts', x: 110, y: 70, tone: 'paper' },
        { id: 'adam', label: 'type "adam"', note: 'check #2 starts; #1 cleaned up', x: 330, y: 70, tone: 'paper' },
        { id: 'reply2', label: '#2 replies', note: '"adam" available', x: 560, y: 70, tone: 'acid' },
        { id: 'reply1', label: '#1 replies late', note: '"ada" taken', x: 560, y: 240, tone: 'red' },
        { id: 'ignored', label: 'ignored', note: 'stale flag is true', x: 300, y: 240, tone: 'cobalt' },
      ],
      edges: [
        { from: 'ada', to: 'adam', label: 'value changes' },
        { from: 'adam', to: 'reply2' },
        { from: 'ada', to: 'reply1', label: 'slow network', dashed: true },
        { from: 'reply1', to: 'ignored' },
      ],
      steps: [
        { focus: ['ada'], text: 'The user types `ada`. The watcher starts check #1 and shows "Checking…".' },
        { focus: ['adam'], edges: ['ada->adam'], text: 'Before #1 answers, they type `adam`. Vue runs the **cleanup** registered by the previous watcher run — it sets that run\'s `stale` flag — then starts check #2.' },
        { focus: ['reply2'], edges: ['adam->reply2'], text: 'Check #2 happens to answer first: "adam" is available. The form shows ✓.' },
        { focus: ['reply1'], edges: ['ada->reply1'], text: 'Check #1 answers late: "ada" is taken. Without protection, this older answer would overwrite the newer one and the form would wrongly say "taken".' },
        { focus: ['ignored'], edges: ['reply1->ignored'], text: 'With the cleanup flag, run #1 sees `stale === true` and drops its answer. The latest value always wins, regardless of network order.' },
      ],
    },
  },

  animation: {
    type: 'concept-diagram',
    title: 'The life of one submit',
    caption: 'One click, one request — and an honest UI on every path.',
    alt: 'A flow: the user submits; a guard ignores the submit if one is already in flight; client rules run; the button switches to a loading state; the request is sent; on success a preview is shown; on a 422 the server\'s field errors are shown next to inputs; on other errors a general message appears; finally the loading state ends.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'submit', label: 'Submit', note: 'click or Enter', x: 90, y: 60, tone: 'paper' },
        { id: 'guard', label: 'Already sending?', note: 'yes → ignore', x: 290, y: 60, tone: 'red' },
        { id: 'rules', label: 'Client rules', note: 'invalid → show errors', x: 490, y: 60, tone: 'acid' },
        { id: 'loading', label: 'isSubmitting', note: 'button disabled, "Creating…"', x: 680, y: 150, tone: 'cobalt' },
        { id: 'ok', label: '200: success preview', x: 560, y: 260, tone: 'acid' },
        { id: 'fields', label: '422: field errors', note: 'next to inputs', x: 330, y: 260, tone: 'kraft' },
        { id: 'general', label: 'other: general error', note: 'retry later', x: 110, y: 260, tone: 'ink' },
      ],
      edges: [
        { from: 'submit', to: 'guard' },
        { from: 'guard', to: 'rules', label: 'no' },
        { from: 'rules', to: 'loading', label: 'valid' },
        { from: 'loading', to: 'ok' },
        { from: 'loading', to: 'fields' },
        { from: 'loading', to: 'general' },
      ],
      steps: [
        { focus: ['submit', 'guard'], edges: ['submit->guard'], text: 'The first thing the handler does is check `isSubmitting`. A second click or Enter while a request is in flight does nothing.' },
        { focus: ['rules'], edges: ['guard->rules'], text: 'Client-side rules run (instantly). If anything is invalid, show the errors and stop — no request.' },
        { focus: ['loading'], edges: ['rules->loading'], text: '`isSubmitting = true` is set **before** the first `await`. The button is disabled and says "Creating account…" — the user can see something is happening.' },
        { focus: ['ok'], edges: ['loading->ok'], text: 'Success: show a preview of what was created (or navigate).' },
        { focus: ['fields'], edges: ['loading->fields'], text: 'A **422** with field errors: put each message next to its field. Editing that field clears its server error.' },
        { focus: ['general'], edges: ['loading->general'], text: 'Anything else (network error, 500): a general message — and in all cases `finally` ends the loading state so the user can try again.' },
      ],
    },
  },

  syntax: [
    `
#### Async validation in a watcher, race-safe
`,
    {
      code: `watch(() => values.username, async (name, _old, onCleanup) => {
  if (!USERNAME.test(name)) return (status.value = 'idle')   // no request for invalid input

  let stale = false
  onCleanup(() => { stale = true })   // runs when username changes again (or on unmount)

  status.value = 'checking'
  const { available } = await api.checkUsername(name)
  if (stale) return                   // a newer value is being checked
  status.value = available ? 'available' : 'taken'
})`,
      lang: 'js',
      title: 'onCleanup',
    },
    `
In Vue 3.5+ you can call \`onWatcherCleanup(() => …)\` (imported from \`vue\`) instead of using the third argument — but only **before the first \`await\`**, because it must run while Vue still knows which watcher is active.

#### Debounce the check
`,
    {
      code: `watch(() => values.username, (name, _old, onCleanup) => {
  const timer = setTimeout(() => runCheck(name), 300) // wait for a pause in typing
  onCleanup(() => clearTimeout(timer))                // typing again cancels the timer
})`,
      lang: 'js',
      title: 'debounce with cleanup',
    },
    `
#### Map server errors onto fields
`,
    {
      code: `try {
  await api.register(values)
} catch (error) {
  if (error.status === 422 && error.fields) {
    Object.assign(serverErrors, error.fields)   // { email: 'Already registered' }
  } else {
    formError.value = 'Could not create your account. Please try again.'
  }
}

// a field's server error no longer applies once the user edits it
watch(() => values.email, () => delete serverErrors.email)`,
      lang: 'js',
      title: 'server errors',
    },
    `
#### Prevent duplicate submissions
`,
    {
      code: `async function onSubmit() {
  if (isSubmitting.value) return      // 1. ignore re-entry
  isSubmitting.value = true           // 2. BEFORE the first await
  try {
    await api.register(values)
  } finally {
    isSubmitting.value = false        // 3. always re-enable
  }
}`,
      lang: 'js',
      title: 'submit guard',
    },
    {
      code: `<button type="submit" :disabled="isSubmitting" :aria-busy="isSubmitting">
  {{ isSubmitting ? 'Creating account…' : 'Create account' }}
</button>`,
      lang: 'vue',
      title: 'honest loading state',
    },
    `
For operations that must never happen twice (payments, orders), the client guard is not enough — a flaky connection can retry a request the server already processed. Many APIs accept an **idempotency key**: the client generates one id per attempt (for example \`crypto.randomUUID()\`) and sends it with the request; the server stores it and returns the original result for repeats instead of acting again.

#### Schema validation libraries (static examples)

Hand-written computed rules are perfectly fine for small forms. Libraries help when you have many forms, nested or array fields, async rules, or want to share one schema with a Node backend. They cost a dependency and an abstraction to learn. A few popular options — **illustrative snippets; check each library's docs for current APIs and version compatibility**:
`,
    {
      code: `// Zod: describe the shape once, parse anywhere (browser or Node)
import * as z from 'zod'

const RegistrationSchema = z.object({
  username: z.string().min(3, 'At least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Use at least 8 characters'),
})

const result = RegistrationSchema.safeParse(values)
if (!result.success) {
  for (const issue of result.error.issues) {
    errors[issue.path[0]] = issue.message
  }
}`,
      lang: 'js',
      title: 'Zod (static)',
      static: true,
    },
    {
      code: `// Valibot: similar idea, built from small composable functions
import * as v from 'valibot'

const RegistrationSchema = v.object({
  username: v.pipe(v.string(), v.minLength(3, 'At least 3 characters')),
  email: v.pipe(v.string(), v.email('Enter a valid email')),
  password: v.pipe(v.string(), v.minLength(8, 'Use at least 8 characters')),
})

const result = v.safeParse(RegistrationSchema, values)
if (!result.success) {
  for (const issue of result.issues) errors[issue.path?.[0]?.key] = issue.message
}`,
      lang: 'js',
      title: 'Valibot (static)',
      static: true,
    },
    {
      code: `// VeeValidate: form state for Vue (values, errors, touched, submitting)
// that can use a schema, e.g. Zod through its @vee-validate/zod adapter
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'

const { defineField, errors, handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(RegistrationSchema),
})
const [email, emailAttrs] = defineField('email')

const onSubmit = handleSubmit(async (formValues) => {
  await api.register(formValues)
})`,
      lang: 'js',
      title: 'VeeValidate + Zod (static)',
      static: true,
    },
    `
**The rules:**

1. Async checks go in a **watcher** (a side effect), with a cleanup that marks older runs stale.
2. **Debounce** checks that fire while typing, and skip the request when the value fails the synchronous rules.
3. An async "available" is a **hint**, not a guarantee — the server re-checks at submit time.
4. Map **422** field errors onto fields; show other failures as one general, retryable message.
5. Set \`isSubmitting\` **before** the first \`await\`, guard against re-entry, reset in \`finally\`.
6. Make the loading state visible (disabled button, label change, \`aria-busy\`) — and use idempotency keys server-side for anything that must not happen twice.
`,
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: registerApp,
    intro: 'The registration form from the playground. It already validates kindly; step through to find the four places where the network can still trip it up.',
    steps: [
      { lines: [9, 16], text: 'On top of values and touched, the form tracks async state: the username check status, errors the server sent back, a general form error, whether a submit is in flight, and the created user for the success preview.' },
      { lines: [18, 19], text: 'Two simplified patterns: a loose email check and a username rule. Synchronous checks run first — no point asking the server about "a!".' },
      { lines: [21, 30], text: 'Synchronous rules in one computed. The async result feeds in too: a "taken" status becomes a normal error message.' },
      { lines: [32, 41], text: 'The async rule lives in a **watcher**, because calling a server is a side effect. ⚠️ It has no debounce (a request per keystroke) and no stale protection — two experiments fix that.' },
      { lines: [43, 46], text: 'One small watcher per field: as soon as the user edits a field, the server\'s old complaint about it is removed.' },
      { lines: [48, 51], text: 'Server errors win over client errors (they are the final word), and client errors still wait for touched or a submit attempt.' },
      { lines: [53, 60], text: 'Submit: reveal errors, stop if invalid, and don\'t submit while the username check is still running.' },
      { lines: [62, 70], text: 'The request. `isSubmitting` drives the button label, and `finally` always clears it. ⚠️ Nothing stops a second submit while the first is in flight, and the `catch` throws away the server\'s field errors.' },
      { lines: [74, 77], text: 'The success preview replaces the form once the account exists, with `role="status"` so screen readers announce it.' },
      { lines: [86, 89], text: 'The status line uses `aria-live="polite"`: screen readers announce "Checking…" and "Username available" without moving focus.' },
    ],
  },

  playground: {
    title: 'Registration form vs a real network',
    objective: 'Harden a registration form: one click = one account, server errors on the right field, race-safe and debounced username checks.',
    files: { 'App.vue': registerApp, 'api.js': registerApi },
    expected: 'Type a username: "Checking availability…" then "✓ Username available" (try `ada` or `admin` for taken names). Fill the form and submit to see the success preview. Then try the problems: submit with `taken@example.com`, or press Enter twice quickly. The **Complete version** variant has every fix applied.',
    experiments: [
      {
        id: 'no-double-submit',
        task: 'Pressing **Create account** twice quickly creates two accounts (watch `stats.registrations` in `api.js`). Make `onSubmit` ignore submits while one is in flight, and disable the button while submitting.',
        hint: 'First line of `onSubmit`: `if (isSubmitting.value) return`. On the button: `:disabled="isSubmitting"`. The flag is already set before the `await`.',
        tests: [
          {
            name: 'two quick submits create one account',
            code: `await type('#username', 'grace')
await wait(500)
await type('#email', 'grace@example.com')
await type('#password', 'longenough')
await check('#terms', true)
await submit('form')
await submit('form')
await wait(450)
expect(requireModule('api.js').stats.registrations).toBe(1)
expect(exists('.success')).toBe(true)`,
          },
        ],
        explain: 'The guard works because `isSubmitting` is set synchronously, before the first `await` — the second submit sees it immediately. Disabling the button adds visual feedback; the guard also covers Enter, which ignores a disabled-looking button. For payments, add an idempotency key on the server too.',
      },
      {
        id: 'server-field-errors',
        task: 'Register with `taken@example.com`: the server answers **422** with `error.fields = { email: \'This email is already registered.\' }`, but the form shows a vague banner. In the `catch`, copy `error.fields` into `serverErrors` for 422s, keeping the banner for other errors.',
        hint: '`if (error.status === 422 && error.fields) Object.assign(serverErrors, error.fields) else formError.value = …`. The template already shows `serverErrors` through `visibleError`.',
        tests: [
          {
            name: 'the server error appears under the email field and clears on edit',
            code: `await type('#username', 'grace')
await wait(500)
await type('#email', 'taken@example.com')
await type('#password', 'longenough')
await check('#terms', true)
await submit('form')
await wait(450)
expect(text('#email-error')).toContain('already registered')
await type('#email', 'grace@example.com')
expect(exists('#email-error')).toBe(false)`,
          },
        ],
        explain: 'The server is the final judge, and its verdict is only useful if the user can act on it. Field-level messages tell them exactly what to change; the per-field watcher removes the message as soon as they do.',
      },
      {
        id: 'stale-username',
        task: 'Type `ada`, then quickly `adam`: the form ends up saying nothing is available, because the slow answer for "ada" (taken) arrives last. Make the watcher **ignore stale answers** using its `onCleanup` argument.',
        hint: 'Change the callback to `async (name, _old, onCleanup) => { … }`, add `let stale = false; onCleanup(() => { stale = true })` before the `await`, and `if (stale) return` after it.',
        tests: [
          {
            name: 'the latest username wins',
            code: `await type('#username', 'ada')
await type('#username', 'adam')
await wait(800)
expect(text('.username-status')).toContain('available')
expect(exists('#username-error')).toBe(false)`,
          },
        ],
        explain: 'Before a watcher runs again, Vue calls the cleanup registered by its previous run. That flips the old run\'s `stale` flag, so its late answer is dropped. This is the standard Vue pattern for any async work inside a watcher.',
      },
      {
        id: 'debounce-check',
        task: 'Typing `grace` letter by letter sends a request for `gra`, `grac` and `grace`. **Debounce** the check: only call the server once the user pauses for 300 ms.',
        hint: 'Wrap the request in `const timer = setTimeout(async () => { … }, 300)` and add `clearTimeout(timer)` to the cleanup. Keep the stale check inside the timeout callback.',
        tests: [
          {
            name: 'one request after typing a whole word',
            code: `for (const partial of ['g', 'gr', 'gra', 'grac', 'grace']) await type('#username', partial)
await wait(800)
expect(requireModule('api.js').stats.usernameChecks).toBe(1)
expect(text('.username-status')).toContain('available')`,
          },
        ],
        explain: 'The same cleanup that marks old runs stale also cancels their pending timers, so only the last value in a burst of typing reaches the server. Less load, fewer races, and the answer the user sees is about what they actually typed.',
      },
    ],
    variants: [
      { id: 'complete', label: 'Complete version (all fixes applied)', files: { 'App.vue': registerAppComplete, 'api.js': registerApi } },
    ],
  },

  internals: {
    beginner: `
A watcher can start slow work — like asking a server a question — every time a value changes. The problem is that slow answers can arrive out of order. Vue helps by letting each watcher run leave a "cleanup note": before the watcher runs again, Vue reads the note. If the note says "ignore my answer", the old answer is thrown away when it finally arrives.

For submitting, the trick is simply to raise a flag ("I'm busy") *before* waiting for the server, and to lower it afterwards no matter what happened.
`,
    technical: [
      `
**Watcher cleanup.** Each time a watcher's callback runs, it can register a cleanup function (via the \`onCleanup\` argument, or \`onWatcherCleanup()\` in 3.5+). Vue calls it right before the next run of that callback, and when the watcher is stopped (e.g. the component unmounts). Because each run has its own closure, a \`let stale = false\` captured by that run is independent of later runs.

**Why \`onWatcherCleanup\` must come before \`await\`.** Vue tracks the "currently running watcher" synchronously. After an \`await\`, the callback resumes in a later microtask when that information is gone, so the registration would fail (Vue warns in development). The third-argument \`onCleanup\` is bound to its run and works anywhere — but registering early is still the clear habit.
`,
      {
        code: `// Simplified model of how Vue runs a watcher callback with cleanup
let cleanup
function runWatcher(newValue, oldValue) {
  if (cleanup) cleanup()                // previous run's cleanup first
  cleanup = undefined
  callback(newValue, oldValue, (fn) => { cleanup = fn })
}`,
        lang: 'js',
        title: 'mental model of onCleanup',
      },
      `
**The submit guard and the event loop.** \`submit\` events are dispatched one at a time. The first handler runs synchronously until its first \`await\`; if it has already set \`isSubmitting = true\` by then, a second submit event (even milliseconds later) sees the flag. Setting the flag *after* an \`await\` leaves a gap where a second submit slips through.

**Client "available" vs server truth.** Between the availability check and the submit, someone else can register the name. That is why \`register\` re-validates and may still answer 422 for the username — the form must handle it like any other field error.
`,
    ],
    production: `
- **Error contract.** Agree on one error shape with the backend (for example \`{ message, fields: { email: [...] } }\` with a 422 status) and parse it in one place — your API layer — so every form handles it the same way.
- **Map unknown fields.** If the server reports an error for a field the form doesn't show, display it in the general message instead of dropping it.
- **Focus and announce.** After a failed submit, move focus to the first field with an error (or an error summary) and use live regions — see [accessible inputs](lesson:accessible-reusable-inputs).
- **Idempotency for important writes.** Generate a key per submit attempt and keep it across automatic retries of the *same* attempt; the server returns the stored result for repeats.
- **Rate limits.** Availability endpoints are easy to abuse for enumeration; debounce on the client and rate-limit on the server. Consider whether revealing "this email is registered" is acceptable for your product's privacy requirements.
- **Cancel when you can.** With real \`fetch\`, an \`AbortController\` in the cleanup cancels the request entirely (and ignore the resulting \`AbortError\`). See [cancellation & races](lesson:cancellation-race-conditions).
- **Libraries.** If many forms repeat this machinery, a form library or a shared composable keeps it consistent. Choose based on your forms' complexity and your team, not hype.
`,
  },

  mistakes: [
    {
      title: 'Setting the busy flag after an `await`',
      wrong: { code: `async function onSubmit() {
  if (isSubmitting.value) return
  await validateAsync()         // second click arrives here…
  isSubmitting.value = true     // …before this line runs
  await api.register(values)
}`, lang: 'js' },
      right: { code: `async function onSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true     // immediately
  try {
    await validateAsync()
    await api.register(values)
  } finally {
    isSubmitting.value = false
  }
}`, lang: 'js' },
      explanation: 'Anything before the flag is set — especially an `await` — is a window for a duplicate submit. Raise the flag first, lower it in `finally`.',
    },
    {
      title: 'Letting stale async answers win',
      wrong: { code: `watch(username, async (name) => {
  status.value = (await api.check(name)).available ? 'ok' : 'taken'
})`, lang: 'js' },
      right: { code: `watch(username, async (name, _old, onCleanup) => {
  let stale = false
  onCleanup(() => { stale = true })
  const { available } = await api.check(name)
  if (!stale) status.value = available ? 'ok' : 'taken'
})`, lang: 'js' },
      explanation: 'Responses arrive in network order, not typing order. Without a stale check, an old answer can overwrite the answer for what the user actually typed.',
    },
    {
      title: 'Hiding the server\'s field errors behind a generic message',
      wrong: { code: `} catch {
  formError.value = 'Something went wrong.'
}`, lang: 'js' },
      right: { code: `} catch (error) {
  if (error.status === 422 && error.fields) Object.assign(serverErrors, error.fields)
  else formError.value = 'Something went wrong. Please try again.'
}`, lang: 'js' },
      explanation: 'Users can fix "this email is already registered" — but only if you tell them. Keep the general message for failures they can\'t fix by editing a field.',
    },
    {
      title: 'Trusting the async "available" check',
      wrong: { code: `// "the username was available a minute ago, so the server doesn't need to check"`, lang: 'js' },
      right: { code: `// server, at registration time:
if (await users.exists(username)) {
  return res.status(422).json({ fields: { username: 'This username was just taken.' } })
}`, lang: 'js' },
      explanation: 'Someone can take the name between the check and the submit. The availability check is a convenience; uniqueness is enforced by the server (and a database constraint).',
    },
  ],

  debugging: [
    {
      symptom: 'The username sometimes shows "taken" for a name that is free.',
      cause: 'A slower response for an earlier value arrived last and overwrote the newer result.',
      fix: 'Mark earlier runs stale with `onCleanup` / `onWatcherCleanup`, or compare a request id, before writing the result.',
    },
    {
      symptom: 'Duplicate records appear when users double-click Submit or press Enter twice.',
      cause: 'No re-entry guard, or the busy flag is set after an `await`.',
      fix: 'Guard at the top of the handler, set the flag before awaiting, reset it in `finally`; add idempotency on the server for critical actions.',
    },
    {
      symptom: 'The submit button stays disabled forever after a failed request.',
      cause: 'The flag is reset only on success.',
      fix: 'Reset it in `finally`.',
    },
    {
      symptom: 'A server error message stays under a field after the user fixes it.',
      cause: 'Server errors are stored but never cleared when the value changes.',
      fix: 'Clear a field\'s server error when its value changes (a watcher per field), and clear all of them at the start of each submit.',
    },
    {
      symptom: '"onWatcherCleanup() was called when there was no active watcher" warning.',
      cause: '`onWatcherCleanup()` was called after an `await` inside the watcher callback.',
      fix: 'Register it before the first `await`, or use the `onCleanup` argument.',
    },
  ],

  bestPractices: [
    'Run async validation in a watcher with cleanup; debounce it and skip it for values that fail sync rules.',
    'Treat async results as hints; the server re-validates at submit.',
    'Agree on one server error shape (e.g. 422 + `fields`) and map it onto inputs.',
    'Clear a field\'s server error as soon as the user edits it.',
    'Guard submits, set the busy flag before awaiting, reset it in `finally`, and show it in the UI.',
    'Use idempotency keys for payments, orders and other writes that must not repeat.',
    'Reach for a form library or shared composable when many forms repeat the same machinery.',
  ],

  useCases: [
    'Username, handle or subdomain availability checks.',
    'Promo or gift-card codes validated against the server.',
    'Registration and checkout forms that must never create duplicates.',
    'Profile forms where the server rejects an email or URL.',
    'Address lookups and postcode validation through an API.',
  ],

  whenToUse: {
    use: [
      'Async validation when the answer depends on server data (uniqueness, codes, lookups).',
      'Debounce whenever a check runs on input events.',
      'A submit guard on every form that sends a request.',
      'A schema library when many forms share rules, or the schema must run on client and server.',
    ],
    avoid: [
      'Async checks for rules the browser can evaluate itself (length, format).',
      'Relying on the async check instead of server-side enforcement.',
      'Disabling the button as the *only* duplicate protection (Enter and retries still happen).',
      'A heavy form library for one or two simple forms.',
    ],
  },

  comparison: {
    title: 'Hand-written rules vs schema libraries',
    headers: ['', 'Computed rules (this course)', 'Schema library (Zod, Valibot…)', 'Form library (VeeValidate…)'],
    rows: [
      ['What it gives you', 'full control, no dependency', 'one declarative schema; parse/validate data anywhere', 'form state: values, errors, touched, submitting, field arrays'],
      ['Shared with a Node backend', 'only if you extract the rules', 'yes — same schema on both sides', 'via the schema it uses'],
      ['Learning curve', 'just Vue', 'the schema API', 'the library\'s API and concepts'],
      ['Best for', 'small and medium forms', 'shared validation, typed data at boundaries', 'many complex forms in one app'],
      ['Trade-off', 'you maintain the machinery', 'another dependency', 'another dependency and abstraction'],
    ],
    note: 'These are complementary, not rivals: a form library can validate with a schema library. Next: [accessible, reusable inputs and multi-step forms](lesson:accessible-reusable-inputs).',
  },

  quiz: [
    {
      id: 'advanced-forms-q1',
      type: 'mcq',
      prompt: 'The username check said "available". Why must the server still check uniqueness when the form is submitted?',
      options: [
        { text: 'Someone else may have taken it between the check and the submit, and client checks can be bypassed' },
        { text: 'Because the async check is always wrong', why: 'It is usually right — but only at the moment it ran.' },
        { text: 'Because Vue caches watcher results', why: 'Vue doesn\'t cache watcher results; the issue is time and trust.' },
        { text: 'It doesn\'t need to', why: 'The server is the only place uniqueness can be guaranteed.' },
      ],
      answer: 0,
      explanation: 'An availability check is a snapshot and a hint. Uniqueness is enforced at write time by the server (ideally backed by a database constraint).',
    },
    {
      id: 'advanced-forms-q2',
      type: 'output',
      prompt: 'The user types "ada" then quickly "adam". The answer for "adam" (available) arrives first, then "ada" (taken). What does `status` end up as?',
      code: {
        lang: 'js',
        code: `let latest = 0

watch(username, async (name) => {
  const id = ++latest
  const { available } = await api.check(name)
  if (id !== latest) return
  status.value = available ? 'available' : 'taken'
})`,
      },
      options: [
        { text: '\'available\'' },
        { text: '\'taken\'', why: 'The "ada" response has id 1 but `latest` is 2, so it returns early.' },
        { text: 'It flickers forever', why: 'Each response is applied at most once.' },
        { text: 'undefined', why: 'The "adam" response set it before the stale one arrived.' },
      ],
      answer: 0,
      explanation: 'The request-id guard is another way to ignore stale responses: only the response whose id matches the latest request may write.',
    },
    {
      id: 'advanced-forms-q3',
      type: 'bug',
      prompt: 'Users still manage to create duplicate orders by double-clicking. Click the line that leaves the gap.',
      code: {
        lang: 'js',
        code: `async function onSubmit() {
  if (isSubmitting.value) return
  const total = await pricing.calculate(cart)
  isSubmitting.value = true
  try {
    await api.placeOrder(cart, total)
  } finally {
    isSubmitting.value = false
  }
}`,
      },
      answerLine: 4,
      explanation: 'The flag is set only after the first `await`, so a second click during `pricing.calculate` passes the guard. Set `isSubmitting.value = true` right after the guard, before any `await`.',
    },
    {
      id: 'advanced-forms-q4',
      type: 'fill',
      prompt: 'Complete the watcher so older checks are ignored when the code changes again.',
      code: {
        lang: 'js',
        code: `watch(code, async (value, oldValue, ___) => {
  let stale = false
  ___(() => { stale = true })
  const result = await api.checkCoupon(value)
  if (!stale) status.value = result.valid ? 'Valid' : 'Invalid'
})`,
      },
      answer: [['onCleanup'], ['onCleanup']],
      explanation: 'The third argument of a `watch` callback registers a cleanup that runs before the next run (or when the watcher stops).',
    },
    {
      id: 'advanced-forms-q5',
      type: 'mcq',
      prompt: 'Which HTTP status do many APIs use for "the request was well-formed, but some fields are invalid", often with field errors in the body?',
      options: [
        { text: '422 (Unprocessable Content) — 400 is also common' },
        { text: '200 with `ok: false`', why: 'Possible, but it hides failures from HTTP-level tooling; status codes are clearer.' },
        { text: '500', why: '500 means the server failed, not that the input was invalid.' },
        { text: '301', why: 'That is a redirect.' },
      ],
      answer: 0,
      explanation: '422 is widely used for validation failures (some APIs use 400). What matters is a consistent contract the client can parse.',
    },
    {
      id: 'advanced-forms-q6',
      type: 'mcq',
      prompt: 'What problem does an **idempotency key** solve?',
      options: [
        { text: 'A repeated request (double click, automatic retry) is recognised by the server and not executed twice' },
        { text: 'It encrypts the form data', why: 'It is an identifier, not encryption.' },
        { text: 'It replaces client-side validation', why: 'It is unrelated to validation.' },
        { text: 'It makes requests faster', why: 'It is about correctness, not speed.' },
      ],
      answer: 0,
      explanation: 'The client sends the same unique key for repeats of one logical operation; the server stores the result for that key and returns it instead of acting again.',
    },
    {
      id: 'advanced-forms-q7',
      type: 'short',
      prompt: 'Describe how you would show server-side validation errors in a Vue form.',
      answer: 'Agree on an error format with the backend, for example a 422 response with a fields object. In the submit catch block, if the status is 422, copy each field message into a reactive serverErrors object and render it next to the matching input (with aria-invalid). Show anything else — network errors, 500s, unknown fields — as one general message. Clear a field\'s server error when the user edits it, and clear all of them at the start of each submit.',
    },
  ],

  exercises: [
    {
      id: 'map-server-errors',
      title: 'Map server errors onto fields',
      difficulty: 'intermediate',
      prompt: `
The profile form shows "Could not save." for every failure. Improve \`onSubmit\` in \`App.vue\`:

- for a **422** (\`error.status === 422\`), copy \`error.fields\` into \`serverErrors\` so messages appear in \`#email-error\`, \`#website-error\`, etc.;
- for **any other** error, set \`formError\` to "Something went wrong on our side. Please try again." (shown in \`.form-error\`) and show no field errors;
- **editing** a field removes that field's server error (only that one);
- each new submit starts with no old errors; a successful save shows \`.saved\`.

In \`api.js\`, \`taken@example.com\` and websites starting with \`http://\` are rejected with 422; a display name of \`crash\` causes a 500.
`,
      files: { 'App.vue': profileStarter, 'api.js': profileApi },
      hints: [
        'In the `catch`, branch on `error.status === 422 && error.fields`. `Object.assign(serverErrors, error.fields)` copies every message in.',
        'Clear old errors at the start of `onSubmit` (delete every key of `serverErrors`).',
        'For "edit clears", loop over `Object.keys(values)` and add `watch(() => values[field], () => delete serverErrors[field])`.',
      ],
      solution: {
        explanation: 'Field errors go where the user can act on them; everything else becomes one general, retryable message. Watching each field removes its server message as soon as it is edited, and clearing at submit start prevents stale messages from an earlier attempt.',
        files: { 'App.vue': profileSolution, 'api.js': profileApi },
      },
      tests: [
        {
          name: 'a 422 shows the message under the email field',
          code: `await type('#email', 'taken@example.com')
await submit('form')
await wait(250)
expect(text('#email-error')).toContain('already in use')
expect(exists('.form-error')).toBe(false)`,
        },
        {
          name: 'several field errors at once',
          code: `await type('#email', 'taken@example.com')
await type('#website', 'http://ada.dev')
await submit('form')
await wait(250)
expect(exists('#email-error')).toBe(true)
expect(text('#website-error')).toContain('https://')`,
        },
        {
          name: 'editing a field clears only its error',
          code: `await type('#email', 'taken@example.com')
await type('#website', 'http://ada.dev')
await submit('form')
await wait(250)
await type('#email', 'ada@example.org')
expect(exists('#email-error')).toBe(false)
expect(exists('#website-error')).toBe(true)`,
        },
        {
          name: 'a 500 shows a general message and no field errors',
          code: `await type('#displayName', 'crash')
await submit('form')
await wait(250)
expect(text('.form-error')).toContain('Something went wrong on our side')
expect(findAll('.error')).toHaveLength(0)`,
        },
        {
          name: 'a successful save clears old errors',
          code: `await type('#website', 'http://ada.dev')
await submit('form')
await wait(250)
await type('#website', 'https://ada.dev')
await submit('form')
await wait(250)
expect(exists('.saved')).toBe(true)
expect(findAll('.error')).toHaveLength(0)`,
        },
      ],
    },
    {
      id: 'promo-code-check',
      title: 'A race-safe promo code checker',
      difficulty: 'advanced',
      prompt: `
The promo code field asks the server about every change and prints the answer in \`.coupon-status\`. Fix the watcher in \`App.vue\`:

- **normalise** the code (trim + uppercase) before checking, so \`save10\` is valid;
- an **empty** code clears the status and sends **no** request;
- show \`Checking…\` while a check runs, then \`Valid: <percent>% off\` or \`Invalid code\`;
- **ignore stale answers**: if the code changes before an answer arrives, that answer must not be shown.

The fake server answers shorter codes more slowly, so \`VIP\` → \`VIPX\` typed quickly will expose a race.
`,
      files: { 'App.vue': couponStarter, 'api.js': couponApi },
      hints: [
        'Start the callback with `const normalised = value.trim().toUpperCase()` and return early (clearing `status`) when it is empty.',
        'Add the third parameter: `async (value, _old, onCleanup) => { … }`.',
        'Before the `await`: `let stale = false; onCleanup(() => { stale = true })`. After it: `if (stale) return`.',
      ],
      solution: {
        explanation: 'Each watcher run owns a `stale` flag; Vue flips it (via the cleanup) when the code changes again, so late answers for old codes are dropped. Normalising first keeps the server question consistent, and the early return avoids pointless requests for an empty field.',
        files: { 'App.vue': couponSolution, 'api.js': couponApi },
      },
      tests: [
        {
          name: 'a valid code, typed in lower case',
          code: `await type('#coupon', 'save10')
expect(text('.coupon-status')).toBe('Checking…')
await wait(450)
expect(text('.coupon-status')).toBe('Valid: 10% off')`,
        },
        {
          name: 'an unknown code',
          code: `await type('#coupon', 'NOPE')
await wait(450)
expect(text('.coupon-status')).toBe('Invalid code')`,
        },
        {
          name: 'a stale answer is ignored',
          code: `await type('#coupon', 'VIP')
await type('#coupon', 'VIPX')
await wait(500)
expect(text('.coupon-status')).toBe('Invalid code')`,
        },
        {
          name: 'clearing the field clears the status without a request',
          code: `await type('#coupon', 'VIP')
await wait(450)
const api = requireModule('api.js')
const before = api.stats.checks
await type('#coupon', '   ')
await wait(450)
expect(text('.coupon-status')).toBe('')
expect(api.stats.checks).toBe(before)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'advanced-forms-duplicate-submit',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Customers occasionally get charged twice after double-clicking "Pay". How do you fix this end to end?',
      answer: 'On the client: guard the submit handler (`if (isSubmitting) return`), set the flag before the first `await`, disable the button and show a loading label, and reset in `finally`. On the server: require an idempotency key generated per payment attempt, store it with the result, and return the stored result for repeats; ideally also a uniqueness constraint on the order. The client guard handles double clicks; the idempotency key handles retries, network glitches and multiple tabs.',
      explanation: 'Defence in depth: the UI prevents most duplicates; the server guarantees none get through.',
      whyAsked: 'A real production incident pattern; tests whether you think beyond the frontend.',
      mistakes: ['Only disabling the button.', 'Setting the flag after an `await`.', 'Ignoring retries and timeouts where the first request actually succeeded.'],
      followUps: ['Where would you generate the idempotency key and when would you regenerate it?', 'How should the UI behave if the request times out?'],
      modelAnswer: 'I would fix it in two layers. In the UI, the submit handler returns early if a payment is in flight, sets that flag before any await, disables the button with a "Processing…" label and resets in finally. That stops double clicks. But retries and timeouts can still send the same payment twice, so the API takes an idempotency key the client generates once per attempt; the server stores the result under that key and returns it for repeats instead of charging again.',
    },
    {
      id: 'advanced-forms-async-race',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'A username field occasionally says "taken" for a free name. The watcher is below. What is happening and how do you fix it in Vue?',
      code: {
        lang: 'js',
        code: `watch(() => form.username, async (name) => {
  status.value = 'checking'
  const { available } = await api.checkUsername(name)
  status.value = available ? 'available' : 'taken'
})`,
      },
      answer: 'A race: checks for earlier values can resolve after later ones, overwriting the result with an answer about an old value. Use the watcher\'s cleanup: register `onCleanup(() => { stale = true })` (or `onWatcherCleanup` in 3.5+ before the first await) and skip the assignment when stale. Optionally debounce the check and abort the request with an AbortController in the same cleanup.',
      explanation: 'Vue calls the previous run\'s cleanup before running the watcher again.',
      whyAsked: 'Tests understanding of async side effects in watchers — a classic source of flaky UI.',
      mistakes: ['Saying debounce alone fixes it.', 'Using one shared boolean for all runs.', 'Calling `onWatcherCleanup` after the await.'],
      followUps: ['How would you also cancel the HTTP request?', 'What happens to pending checks when the component unmounts?'],
      modelAnswer: 'It is a race between overlapping requests: an older check finishes last and overwrites the newer result. In Vue the idiomatic fix is the watcher cleanup — each run registers a cleanup that marks it stale, Vue calls it before the next run, and the run skips writing if it is stale. I would also debounce the check to cut requests, and with real fetch abort the old request in the same cleanup. The cleanup also runs on unmount, so no late writes happen after the component is gone.',
    },
    {
      id: 'advanced-forms-server-errors',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How should a form handle a 422 response compared with a network error or a 500?',
      answer: 'A 422 means the input was understood but invalid: map the field errors onto the matching inputs so the user can fix them, and clear each one when that field is edited. A network error or 500 is not the user\'s fault and can\'t be fixed by editing fields: show one general message with a retry path, keep the user\'s input, and log details for developers. Unknown field errors fall back to the general message.',
      explanation: 'Classify errors by what the user can do about them.',
      whyAsked: 'Checks that you build forms that recover gracefully, not just happy paths.',
      mistakes: ['One generic message for everything.', 'Clearing the form after an error.', 'Showing raw server error text or stack traces to users.'],
      followUps: ['Where would you parse the error shape — component or API layer?', 'How do you announce errors to screen-reader users?'],
      modelAnswer: 'I treat errors by what the user can do. A 422 carries field errors, so I place each next to its input and clear it when the field changes. Network failures and 500s aren\'t fixable by editing, so they get one friendly general message with a retry, the input stays intact, and details go to logging. I parse the error shape once in the API layer so every form behaves the same.',
    },
    {
      id: 'advanced-forms-debounce',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why debounce an async validation check, and how would you do it in a Vue watcher?',
      answer: 'Without debouncing, every keystroke sends a request: wasted server work, more chances for out-of-order responses, and flickering status messages. Debouncing waits for a pause in typing (e.g. a few hundred milliseconds) and checks only the latest value. In a watcher: start a `setTimeout` and clear it in the watcher\'s cleanup, so each new keystroke cancels the previous timer.',
      explanation: 'Debounce = "wait until they stop"; the watcher cleanup is the natural place to cancel the timer.',
      whyAsked: 'A common performance and UX technique for search and validation.',
      mistakes: ['Confusing debounce with throttle.', 'Thinking debounce fixes races completely.', 'Debouncing the whole input binding instead of the side effect.'],
      followUps: ['When would you prefer throttle?', 'What delay would you choose and why?'],
      modelAnswer: 'Checking on every keystroke floods the server and makes stale responses more likely, so I debounce: only check after the user pauses. In Vue I start a timer inside the watcher and clear it in the watcher\'s cleanup, which runs before the next change. I still keep the stale-response check, because debouncing reduces races but does not eliminate them.',
    },
    {
      id: 'advanced-forms-schema-libraries',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'When would you write validation by hand with `computed`, and when would you use a library like VeeValidate, Zod or Valibot?',
      answer: 'Hand-written computed rules work well for a few small or medium forms: no dependency, full control, easy to read. A schema library (Zod, Valibot) helps when the same rules should run on client and server, or when you want typed, parsed data at boundaries. A form library (VeeValidate) helps when many complex forms need the same state machinery — touched, submitting, field arrays, async rules — and it can use a schema library underneath. The trade-offs are dependencies and an abstraction the team must learn.',
      explanation: 'Match the tool to the scale and sharing needs of your forms.',
      whyAsked: 'Shows pragmatic, non-dogmatic decision making.',
      mistakes: ['"Always use a library" or "never use a library".', 'Confusing schema libraries with form-state libraries.', 'Inventing bundle-size numbers.'],
      followUps: ['How would you migrate hand-written rules to a schema gradually?', 'What would you validate on the server regardless?'],
      modelAnswer: 'For a handful of forms I write rules in a computed — it is plain Vue and easy to review. Once the same rules need to run on a Node backend too, a schema library like Zod or Valibot lets me define them once and parse data on both sides. If the app has many complex forms, a form library like VeeValidate handles touched state, submitting and field arrays consistently, and can use one of those schemas. I weigh that against adding dependencies and a new abstraction for the team.',
    },
    {
      id: 'advanced-forms-shared-schema',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your team wants one validation schema shared between the Vue frontend and the Node API. How would you set it up, and what still differs between client and server?',
      answer: 'Put the schema in a shared package (or a shared folder in a monorepo) imported by both sides; the client uses it for instant feedback and the server for authoritative validation and parsing. Things that still differ: checks needing server data (uniqueness, permissions, stock) run only on the server; the client may show friendlier, localised messages; the server must also enforce authorisation and database constraints; and the client may skip expensive checks. Version the schema with the API so old clients don\'t silently disagree.',
      explanation: 'Share the shape and pure rules; keep data-dependent and security checks on the server.',
      whyAsked: 'Architecture question touching monorepos, contracts and security boundaries.',
      mistakes: ['Assuming a shared schema removes the need for server checks.', 'Putting secrets or permission logic into the shared bundle.', 'No plan for versioning.'],
      followUps: ['How would you handle i18n of messages?', 'How do you keep the error format consistent?'],
      modelAnswer: 'I would keep the schema in a shared package that both the Vue app and the API import. The client runs it for fast feedback, the server runs it as the real gate and to parse typed data. Some checks stay server-only: uniqueness, permissions, stock, anything needing the database or secrets. Messages may be localised on the client, and the error format stays a single contract. The schema is versioned with the API so deployments don\'t drift apart.',
    },
    {
      id: 'advanced-forms-coding-submit-guard',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'The contact form sends the message twice when the user double-submits. Make `onSubmit` ignore submits while sending, disable `.send` and show "Sending…" during the request, and re-enable it after success **or** failure.',
      starter: { files: { 'App.vue': contactStarter, 'api.js': contactApi } },
      tests: [
        {
          name: 'double submit sends once',
          code: `await type('#message', 'Hello there')
await submit('form')
await submit('form')
await wait(300)
expect(requireModule('api.js').stats.sent).toBe(1)
expect(exists('.sent')).toBe(true)`,
        },
        {
          name: 'the button shows a busy state while sending',
          code: `await type('#message', 'Hello there')
await submit('form')
expect(find('.send').disabled).toBe(true)
expect(text('.send')).toBe('Sending…')
await wait(300)
expect(find('.send').disabled).toBe(false)`,
        },
        {
          name: 'after a failure the user can try again',
          code: `await type('#message', 'please fail')
await submit('form')
await wait(300)
expect(text('.error')).toContain('could not be sent')
expect(find('.send').disabled).toBe(false)`,
        },
      ],
      hints: ['Guard first: `if (isSending.value) return`, then set `isSending.value = true` before the `await`.', 'Reset in `finally`, and bind `:disabled="isSending"` plus a conditional label on the button.'],
      answer: 'Guard at the top, set the flag before awaiting, reset it in `finally`, and bind it to the button\'s `disabled` and label.',
      solution: { files: { 'App.vue': contactSolution, 'api.js': contactApi } },
      explanation: 'Setting the flag synchronously closes the double-submit window; `finally` guarantees the form recovers after errors; the disabled button and label make the state visible.',
      whyAsked: 'A short, practical task that reveals whether you understand async timing in event handlers.',
      mistakes: ['Only disabling the button (Enter still submits).', 'Resetting the flag only on success.', 'Setting the flag after the await.'],
      followUps: ['How would you add an idempotency key?', 'How would you announce "Sent!" to screen readers?'],
      modelAnswer: 'I check the flag at the start of the handler and return if a send is in progress, then set it immediately, before any await, so a second submit can\'t slip in. The request goes in try/catch with finally resetting the flag, so a failure doesn\'t leave the form stuck. The button binds disabled and switches its label to "Sending…", and I add aria-busy for assistive technology.',
    },
  ],

  takeaways: [
    'Async validation is a side effect: run it in a watcher, debounce it, and drop stale answers with `onCleanup`/`onWatcherCleanup`.',
    'An async "available" is a hint — the server re-validates at submit.',
    'Map 422 field errors onto inputs; show other failures as one general, retryable message.',
    'Clear a field\'s server error when the user edits it.',
    'Prevent duplicates: guard, set the busy flag before `await`, reset in `finally`, show it — and use idempotency keys for critical writes.',
    'Schema and form libraries help at scale; hand-written computed rules are fine for small forms.',
  ],
}
