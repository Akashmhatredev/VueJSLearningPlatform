// Lesson: E2E tests, accessibility checks & healthy suites.
// Playwright / axe / coverage tooling is shown as static code. Runnable checks use the
// platform's teaching harness to verify accessibility attributes and robust behaviour.

const signupApi = `// api.js — pretend account endpoint (simplified, no network).
export const stats = { calls: 0 }

export function createAccount(data) {
  stats.calls++
  return new Promise((resolve) => setTimeout(() => resolve({ id: stats.calls, email: data.email }), 300))
}`

const signupApp = `<script setup>
import { ref } from 'vue'
import { createAccount } from './api.js'

const email = ref('')
const password = ref('')
const error = ref('')
const done = ref(false)
const showPassword = ref(false)

async function submit() {
  error.value = ''
  if (!email.value.includes('@')) {
    error.value = 'Please enter a valid email address.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Your password needs at least 8 characters.'
    return
  }
  await createAccount({ email: email.value, password: password.value })
  done.value = true
}
</script>

<template>
  <h2>Create your account</h2>

  <form v-if="!done" class="signup" @submit.prevent="submit">
    <div>Email</div>
    <input id="email" v-model="email" type="email" placeholder="you@example.com" />

    <div>Password</div>
    <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" />
    <button type="button" class="toggle-password" @click="showPassword = !showPassword">👁</button>

    <p v-if="error" class="error">{{ error }}</p>
    <button class="submit">Sign up</button>
  </form>

  <p v-else class="success">Welcome aboard! Check your inbox.</p>
</template>`

const signupFinished = `<script setup>
import { ref } from 'vue'
import { createAccount } from './api.js'

const email = ref('')
const password = ref('')
const error = ref('')
const done = ref(false)
const showPassword = ref(false)

async function submit() {
  error.value = ''
  if (!email.value.includes('@')) {
    error.value = 'Please enter a valid email address.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Your password needs at least 8 characters.'
    return
  }
  await createAccount({ email: email.value, password: password.value })
  done.value = true
}
</script>

<template>
  <h2>Create your account</h2>

  <form v-if="!done" class="signup" novalidate @submit.prevent="submit">
    <label for="email">Email</label>
    <input id="email" v-model="email" type="email" autocomplete="email" placeholder="you@example.com" />

    <label for="password">Password</label>
    <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" />
    <button
      type="button"
      class="toggle-password"
      :aria-label="showPassword ? 'Hide password' : 'Show password'"
      :aria-pressed="showPassword"
      @click="showPassword = !showPassword"
    >
      👁
    </button>

    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <button class="submit">Sign up</button>
  </form>

  <p v-else class="success" role="status">Welcome aboard! Check your inbox.</p>
</template>`

const profileStarter = `<script setup>
import { reactive, ref } from 'vue'

const form = reactive({ name: '', email: '' })
const errors = reactive({ name: '', email: '' })
const saved = ref(false)

function validate() {
  errors.name = form.name.trim() ? '' : 'Name is required.'
  errors.email = form.email.includes('@') ? '' : 'Enter a valid email, like ada@example.com.'
  return !errors.name && !errors.email
}

function save() {
  saved.value = validate()
}
</script>

<template>
  <form class="profile" novalidate @submit.prevent="save">
    <span>Name</span>
    <input id="name" v-model="form.name" />
    <small v-if="errors.name" class="field-error">{{ errors.name }}</small>

    <span>Email</span>
    <input id="email" v-model="form.email" type="email" />
    <small v-if="errors.email" class="field-error">{{ errors.email }}</small>

    <button class="save">Save</button>
    <p v-if="saved" class="saved">Saved!</p>
  </form>
</template>`

const profileSolution = `<script setup>
import { reactive, ref } from 'vue'

const form = reactive({ name: '', email: '' })
const errors = reactive({ name: '', email: '' })
const saved = ref(false)

function validate() {
  errors.name = form.name.trim() ? '' : 'Name is required.'
  errors.email = form.email.includes('@') ? '' : 'Enter a valid email, like ada@example.com.'
  return !errors.name && !errors.email
}

function save() {
  saved.value = validate()
}
</script>

<template>
  <form class="profile" novalidate @submit.prevent="save">
    <label for="name">Name</label>
    <input
      id="name"
      v-model="form.name"
      :aria-invalid="errors.name ? 'true' : undefined"
      :aria-describedby="errors.name ? 'name-error' : undefined"
    />
    <small v-if="errors.name" id="name-error" class="field-error">{{ errors.name }}</small>

    <label for="email">Email</label>
    <input
      id="email"
      v-model="form.email"
      type="email"
      :aria-invalid="errors.email ? 'true' : undefined"
      :aria-describedby="errors.email ? 'email-error' : undefined"
    />
    <small v-if="errors.email" id="email-error" class="field-error">{{ errors.email }}</small>

    <button class="save">Save</button>
    <p v-if="saved" class="saved" role="status">Saved!</p>
  </form>
</template>`

const saveApi = `// api.js — pretend "save settings" endpoint that counts calls.
export const stats = { calls: 0 }

export function saveSettings(settings) {
  stats.calls++
  return new Promise((resolve) => setTimeout(() => resolve({ ...settings }), 300))
}`

const saveStarter = `<script setup>
import { ref } from 'vue'
import { saveSettings } from './api.js'

const nickname = ref('ada')
const message = ref('')

async function save() {
  await saveSettings({ nickname: nickname.value })
  message.value = 'Saved'
}
</script>

<template>
  <form class="settings" @submit.prevent="save">
    <label for="nickname">Nickname</label>
    <input id="nickname" v-model="nickname" />
    <button class="save">Save</button>
  </form>
  <p v-if="message" class="status">{{ message }}</p>
</template>`

const saveSolution = `<script setup>
import { ref } from 'vue'
import { saveSettings } from './api.js'

const nickname = ref('ada')
const message = ref('')
const saving = ref(false)

async function save() {
  if (saving.value) return // a second submit while saving is ignored
  saving.value = true
  message.value = ''
  try {
    await saveSettings({ nickname: nickname.value })
    message.value = 'Saved'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="settings" @submit.prevent="save">
    <label for="nickname">Nickname</label>
    <input id="nickname" v-model="nickname" />
    <button class="save" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
  </form>
  <!-- always in the page, so screen readers announce changes to its text -->
  <p class="status" role="status">{{ message }}</p>
</template>`

const searchStarter = `<script setup>
import { ref, computed } from 'vue'

const PRODUCTS = [
  { id: 1, name: 'Blue mug', img: 'mug.png' },
  { id: 2, name: 'Green tote bag', img: 'tote.png' },
  { id: 3, name: 'Blue cap', img: 'cap.png' },
]
const query = ref('')
const results = computed(() => PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.value.toLowerCase())))
</script>

<template>
  <div class="search">
    <input id="q" v-model="query" placeholder="Search products" />
    <button class="clear" type="button" @click="query = ''">✕</button>
  </div>
  <p class="count">{{ results.length }} results</p>
  <ul>
    <li v-for="p in results" :key="p.id" class="result">
      <img :src="p.img" />
      {{ p.name }}
    </li>
  </ul>
</template>`

const searchSolution = `<script setup>
import { ref, computed } from 'vue'

const PRODUCTS = [
  { id: 1, name: 'Blue mug', img: 'mug.png' },
  { id: 2, name: 'Green tote bag', img: 'tote.png' },
  { id: 3, name: 'Blue cap', img: 'cap.png' },
]
const query = ref('')
const results = computed(() => PRODUCTS.filter((p) => p.name.toLowerCase().includes(query.value.toLowerCase())))
</script>

<template>
  <div class="search" role="search">
    <label for="q">Search products</label>
    <input id="q" v-model="query" type="search" placeholder="e.g. mug" />
    <button class="clear" type="button" aria-label="Clear search" @click="query = ''">✕</button>
  </div>
  <p class="count" role="status">{{ results.length }} results</p>
  <ul>
    <li v-for="p in results" :key="p.id" class="result">
      <img :src="p.img" alt="" />
      {{ p.name }}
    </li>
  </ul>
</template>`

export default {
  id: 'e2e-and-quality',
  title: 'E2E tests, accessibility checks & healthy suites',
  summary: 'Test whole user journeys in a real browser with Playwright, catch accessibility problems automatically, use coverage wisely, and keep a test suite fast, stable and trusted.',
  difficulty: 'advanced',
  minutes: 50,
  prerequisites: ['testing-async-routing', 'accessibility-fundamentals'],
  related: ['testing-fundamentals', 'component-testing', 'testing-logic', 'accessible-components', 'accessible-reusable-inputs', 'production-readiness'],
  tags: ['e2e', 'end-to-end', 'playwright', 'cypress', 'locators', 'auto-waiting', 'accessibility', 'axe', 'coverage', 'flaky tests', 'snapshot', 'ci'],
  apis: [
    { name: 'page.getByRole(role, { name })', summary: 'Playwright: find elements the way assistive technology sees them — the most robust locator.' },
    { name: 'await expect(locator).toHaveText()', summary: 'Playwright web-first assertion: retries until the condition is met or the timeout expires.' },
    { name: 'page.route(url, handler)', summary: 'Playwright: intercept network requests and fulfil them with mock responses.' },
    { name: 'AxeBuilder', summary: '@axe-core/playwright: run automated accessibility checks on a page.' },
    { name: 'vitest run --coverage', summary: 'Vitest: measure which lines and branches your tests executed (v8 or istanbul provider).' },
  ],
  docs: [
    { label: 'Vue Guide — Testing (E2E testing)', url: 'https://vuejs.org/guide/scaling-up/testing.html#e2e-testing' },
    { label: 'Playwright — Writing tests', url: 'https://playwright.dev/docs/writing-tests' },
    { label: 'Playwright — Locators', url: 'https://playwright.dev/docs/locators' },
    { label: 'Playwright — Accessibility testing', url: 'https://playwright.dev/docs/accessibility-testing' },
    { label: 'Vitest — Coverage', url: 'https://vitest.dev/guide/coverage' },
  ],

  intro: `
Unit and component tests check pieces. An **end-to-end (E2E) test** checks a whole journey the way a user experiences it: open the real app in a real browser, type into the real form, click the real button, see the real result.

On top of that sit two kinds of **quality checks** that keep a suite honest:

- **accessibility checks**, which catch problems like inputs without labels or buttons without names — things sighted mouse users never notice but that lock others out;
- **coverage reports**, which show which code your tests never touched.

And then there's the craft of keeping the whole suite **healthy**: fast, stable, and trusted enough that a red test means "something is broken", not "run it again".
`,

  why: `
Lower-level tests can all pass while the product is broken: the router isn't configured, the build drops an environment variable, a CSS change hides the "Pay" button behind a banner, the API contract changed. E2E tests are the only ones that exercise the real thing end to end — the build, the browser, routing, styling, network.

But E2E tests are slower and have more moving parts, so a careless suite becomes **flaky**: it fails randomly, people start re-running it until it's green, and soon nobody trusts any test. That's worse than no tests, because it wastes time *and* hides real failures.

Accessibility deserves automated checks because the bugs are invisible to most developers, easy to reintroduce, and genuinely exclude people — and many are cheap to detect. Coverage deserves a careful look because it's easy to chase the number instead of the confidence.
`,

  eli15: `
Imagine testing a new bike.

- **Unit tests** check each part on a workbench: the brake lever pulls, the chain turns.
- An **E2E test** is a test ride around the block: you get on, pedal, brake at the corner, and arrive. If the brakes were installed backwards, only the test ride finds out.

Test rides take longer, so you don't do a thousand of them — just the important routes (to school, down the steep hill).

**Accessibility checks** make sure the bike works for everyone — for example that the bell can be found without looking. **Coverage** is a map of which streets you've ridden; a street you never rode might have a pothole. But riding every street doesn't prove your brakes are good — it only proves you were there.
`,

  analogy: {
    title: 'The dress rehearsal',
    body: `
A theatre company rehearses scenes separately all week (unit and component tests). Before opening night they do a **dress rehearsal**: full costumes, real lights, real stage, the whole play from start to finish. It's expensive, so they do it a few times — but it catches things no scene rehearsal can: a costume change that takes too long, a prop left on the wrong side of the stage.

A good stage manager runs it from a **script of cues** ("when the actor says 'goodbye', lights down"), not a stopwatch ("lights down at minute 43") — because actors' timing varies. That's the difference between waiting for something to happen and sleeping for a fixed time.

And an accessibility check is the usher walking the theatre with a checklist: are there ramps, captions, clear signs?
`,
    mapping: [
      ['rehearsing scenes separately', 'unit and component tests'],
      ['the dress rehearsal', 'E2E tests in a real browser against the built app'],
      ['cues, not a stopwatch', 'web-first assertions instead of `waitForTimeout`'],
      ['a few full rehearsals, not hundreds', 'E2E for critical journeys only'],
      ['the usher\'s accessibility checklist', 'axe-core and manual keyboard/screen-reader checks'],
      ['a rehearsal that fails at random', 'a flaky test — fix it or remove it, don\'t ignore it'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'What an E2E test actually drives',
    caption: 'Playwright controls real browsers. The app under test is your built app; the network can be real (a staging API) or mocked per test.',
    alt: 'An architecture diagram. The Playwright test runner starts a web server for the built app and launches real browsers (Chromium, Firefox, WebKit). The browser loads the Vue app, which calls the API. Requests can go to a real staging API or be intercepted with page.route and fulfilled with mock data. Assertions auto-wait on the page; on failure, traces, screenshots and videos are saved.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'runner', label: 'Playwright test', note: 'signup.spec.js', tone: 'ink', x: 90, y: 160 },
        { id: 'server', label: 'webServer', note: 'npm run preview (built app)', tone: 'kraft', x: 290, y: 60 },
        { id: 'browser', label: 'real browsers', note: 'Chromium · Firefox · WebKit', tone: 'cobalt', x: 290, y: 250 },
        { id: 'app', label: 'your Vue app', note: 'router, styles, real DOM', tone: 'acid', x: 500, y: 160 },
        { id: 'mock', label: 'page.route()', note: 'mocked responses', tone: 'paper', x: 680, y: 80 },
        { id: 'api', label: 'staging API', note: 'or the real backend', tone: 'paper', x: 680, y: 250 },
      ],
      edges: [
        { from: 'runner', to: 'server', label: 'starts' },
        { from: 'runner', to: 'browser', label: 'drives' },
        { from: 'server', to: 'app', label: 'serves' },
        { from: 'browser', to: 'app', label: 'loads & clicks' },
        { from: 'app', to: 'mock', label: 'fetch (intercepted)', dashed: true },
        { from: 'app', to: 'api', label: 'fetch (real)' },
      ],
      steps: [
        { focus: ['runner', 'server'], edges: ['runner->server'], text: 'The runner can start your app for you (`webServer` in the config), ideally the **production build** (`vite build` + `vite preview`), because that\'s what users get.' },
        { focus: ['browser'], edges: ['runner->browser'], text: 'It launches real browser engines — you can run the same test in Chromium, Firefox and WebKit as separate "projects".' },
        { focus: ['app'], edges: ['server->app', 'browser->app'], text: 'The test interacts like a user: find by role or label, type, click. Every action waits for the element to be visible, enabled and stable first (**auto-waiting**).' },
        { focus: ['mock', 'api'], edges: ['app->mock', 'app->api'], text: 'Network: mock specific endpoints with `page.route()` for speed and edge cases, or hit a real staging backend for true end-to-end confidence. Most teams do some of each.' },
        { focus: ['runner'], text: 'Assertions like `await expect(locator).toHaveText(…)` retry until they pass or time out. On failure, a **trace** records every step, DOM snapshot and network call for debugging.' },
      ],
    },
  },

  syntax: [
    `
#### A Playwright E2E test

Playwright is a browser-automation test runner. A test gets a \`page\` (a browser tab), finds elements with **locators**, acts on them, and asserts with **web-first assertions** that retry automatically:
`,
    {
      code: `// e2e/signup.spec.js
import { test, expect } from '@playwright/test'

test('a visitor can create an account', async ({ page }) => {
  // mock just this endpoint (optional)
  await page.route('**/api/accounts', (route) => route.fulfill({ status: 201, json: { id: 1 } }))

  await page.goto('/signup')
  await page.getByLabel('Email').fill('ada@example.com')
  await page.getByLabel('Password', { exact: true }).fill('correct horse battery')
  await page.getByRole('button', { name: 'Sign up' }).click()

  await expect(page.getByRole('status')).toHaveText(/welcome aboard/i) // retries until true
})

test('shows a helpful error for an invalid email', async ({ page }) => {
  await page.goto('/signup')
  await page.getByLabel('Email').fill('not-an-email')
  await page.getByRole('button', { name: 'Sign up' }).click()
  await expect(page.getByRole('alert')).toContainText('valid email')
})`,
      lang: 'js',
      title: 'signup.spec.js (static example)',
      static: true,
    },
    `
Notice what's *not* there: no CSS selectors tied to styling, no \`waitForTimeout\`. \`getByRole\` and \`getByLabel\` find elements the way assistive technology does — so an E2E suite written this way **also checks accessibility basics**: if the input has no label, \`getByLabel('Email')\` can't find it. (\`exact: true\` matters for "Password", because a "Show password" button's \`aria-label\` would also match a substring search.)
`,
    {
      code: `// playwright.config.js (excerpt)
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  retries: process.env.CI ? 2 : 0,                 // retry in CI — but track flaky tests!
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4173' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})`,
      lang: 'js',
      title: 'playwright.config.js',
      static: true,
    },
    `
**Cypress** is the other popular choice: it runs tests inside the browser next to your app, with commands like \`cy.get()\`, \`cy.intercept()\` for network mocking, and automatic retrying of assertions. Both are good; the principles in this lesson apply to either.

#### Automated accessibility checks

[axe-core](https://github.com/dequelabs/axe-core) is a widely used engine that checks a page against many accessibility rules (missing labels, missing alt text, invalid ARIA, colour contrast in a real browser…).
`,
    {
      code: `// e2e/a11y.spec.js — in a real browser
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('signup page has no detectable accessibility violations', async ({ page }) => {
  await page.goto('/signup')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

// Component level (jsdom): vitest-axe / jest-axe, with their matchers registered in a setup file
// const wrapper = mount(ProfileForm, { attachTo: document.body })
// expect(await axe(wrapper.element)).toHaveNoViolations()
// Note: layout-dependent rules such as colour contrast can't run reliably in jsdom.`,
      lang: 'js',
      title: 'axe in Playwright (and in component tests)',
      static: true,
    },
    {
      callout: 'warn',
      title: 'Automated checks find some problems, not all',
      text: 'Tools can tell that an image has no `alt` attribute; they can\'t tell whether the alt text is meaningful, whether the focus order makes sense, or whether a custom dropdown is usable with a keyboard and a screen reader. "Zero violations" means "no *detectable* problems". Pair automation with manual keyboard checks and occasional screen-reader testing — see [Accessible components](lesson:accessible-components).',
    },
    `
#### Coverage

Coverage tools record which **lines**, **branches** (both sides of every \`if\`), **functions** and **statements** ran during your tests.
`,
    {
      code: `// vite.config.js — Vitest coverage (needs @vitest/coverage-v8 or @vitest/coverage-istanbul)
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',                          // or 'istanbul'
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,vue}'],
      thresholds: { lines: 80, branches: 75 }, // example numbers — choose your own
    },
  },
})
// run: npx vitest run --coverage   → open coverage/index.html`,
      lang: 'js',
      title: 'coverage config',
      static: true,
    },
    `
Coverage answers "what did my tests **not** run?" — useful for finding untested error paths. It does **not** answer "are my tests any good?": a test can execute every line and assert nothing. Treat thresholds as a floor that prevents backsliding, not a target to game.

#### Keeping the suite healthy

| Smell | Why it hurts | Instead |
|---|---|---|
| CSS-path selectors (\`div > .btn-primary\`) | break on any markup or style change | roles, labels, visible text, \`data-test\` |
| \`waitForTimeout(2000)\` / \`sleep\` | slow, and still flaky on slow machines | web-first assertions, \`flushPromises\`, fake timers |
| Testing internals (\`wrapper.vm.count\`) | breaks on refactors that change nothing for users | assert on what users see |
| Huge snapshots updated blindly | reviewers can't tell what changed or why | small, intentional snapshots or explicit assertions |
| Tests sharing state / depending on order | pass alone, fail together | fresh setup per test, reset mocks and data |
| Retrying until green | hides real bugs and real flakiness | quarantine and fix flaky tests, track them |
`,
    {
      callout: 'note',
      title: 'On this platform: the harness',
      text: 'The sandbox can\'t run Playwright or axe. The playground checks use this platform\'s teaching harness to verify the same things at component level: `find(\'label[for="email"]\')` stands in for `getByLabel(\'Email\')`, `attr(\'.error\', \'role\')` for `getByRole(\'alert\')`, and `attr(\'.toggle-password\', \'aria-label\')` for `getByRole(\'button\', { name: \'Show password\' })`. It\'s a teaching harness — real projects use the static examples above.',
    },
  ],

  walkthrough: {
    title: 'App.vue — the accessible signup form',
    lang: 'vue',
    code: signupFinished,
    intro: 'The playground form after all the experiments. Every change here is something Playwright\'s role and label locators — and axe — rely on.',
    steps: [
      { lines: [29, 29], text: '`novalidate` turns off the browser\'s own validation bubbles so the app\'s messages are the single source of feedback (a design choice — native validation is also fine if you rely on it consistently).' },
      { lines: [30, 31], text: 'A real `<label for="email">` tied to `id="email"`. Clicking the label focuses the input, screen readers announce "Email, edit text", and `getByLabel(\'Email\')` can find it. `autocomplete` helps password managers.' },
      { lines: [33, 34], text: 'Same for the password. A placeholder is **not** a label: it disappears as you type and isn\'t reliably announced.' },
      { lines: [35, 43], text: 'An icon-only button needs an accessible name. `aria-label` changes with the state ("Show password" / "Hide password"), and `aria-pressed` tells assistive technology it\'s a toggle.' },
      { lines: [45, 45], text: '`role="alert"` makes screen readers announce the error as soon as it appears — and gives tests a meaningful locator: `getByRole(\'alert\')`.' },
      { lines: [46, 46], text: 'A visible, descriptive button name: `getByRole(\'button\', { name: \'Sign up\' })`.' },
      { lines: [49, 49], text: '`role="status"` politely announces the success message. (For messages that appear while the user stays on the same element, prefer a status region that is always in the DOM and change its text.)' },
    ],
  },

  playground: {
    title: 'An inaccessible signup form',
    objective: 'Fix the accessibility problems that would make role/label-based E2E tests (and real users) fail.',
    files: { 'App.vue': signupApp, 'api.js': signupApi },
    expected: 'The form works with a mouse. But the "labels" are plain `<div>`s, the eye button has no name, and errors appear silently. A screen reader user hears "edit text, edit text, button" — and `getByLabel(\'Email\')` in Playwright would find nothing.',
    experiments: [
      {
        id: 'labels',
        task: 'Replace the two `<div>` captions with real `<label>` elements connected to their inputs: `<label for="email">Email</label>` and `<label for="password">Password</label>` (the inputs already have matching ids).',
        hint: 'The `for` attribute must equal the input\'s `id`. Alternatively wrap the input inside the label — but this task checks `for`/`id`.',
        tests: [
          {
            name: 'both inputs have associated labels',
            code: `for (const id of ['email', 'password']) {
  expect(exists('label[for="' + id + '"]')).toBe(true)
  expect(exists('#' + id)).toBe(true)
}
expect(text('label[for="email"]')).toContain('Email')
expect(text('label[for="password"]')).toContain('Password')`,
          },
        ],
        explain: 'A label connected with `for`/`id` gives the input an accessible name, a bigger click target, and makes `getByLabel()` work in Playwright and Testing Library. A placeholder or a nearby `<div>` provides none of that.',
      },
      {
        id: 'error-alert',
        task: 'Submit with an invalid email: the message appears, but a screen reader user isn\'t told. Add `role="alert"` to the `.error` paragraph.',
        hint: '`<p v-if="error" class="error" role="alert">{{ error }}</p>`.',
        tests: [
          {
            name: 'the validation error is an alert',
            code: `await type('#email', 'not-an-email')
await submit()
expect(text('.error')).toContain('valid email')
expect(attr('.error', 'role')).toBe('alert')`,
          },
        ],
        explain: '`role="alert"` is an assertive live region: its content is announced immediately. It also gives E2E tests a locator that describes *meaning* — `getByRole(\'alert\')` — instead of styling.',
      },
      {
        id: 'button-name',
        task: 'The 👁 button has no accessible name (an emoji isn\'t a reliable one). Give it `aria-label="Show password"` when the password is hidden and `"Hide password"` when it\'s visible, plus `:aria-pressed="showPassword"`.',
        hint: '`:aria-label="showPassword ? \'Hide password\' : \'Show password\'"`.',
        tests: [
          {
            name: 'the toggle has a state-aware accessible name',
            code: `expect(attr('.toggle-password', 'aria-label')).toMatch(/show password/i)
await click('.toggle-password')
expect(attr('.toggle-password', 'aria-label')).toMatch(/hide password/i)
expect(attr('.toggle-password', 'aria-pressed')).toBe('true')`,
          },
        ],
        explain: 'Icon-only buttons are one of the most common accessibility failures — and one axe flags reliably ("Buttons must have discernible text"). With a name, Playwright can target it as `getByRole(\'button\', { name: \'Show password\' })`.',
      },
      {
        id: 'write-the-e2e',
        task: 'Read the static `signup.spec.js` in the **Syntax** section. Which of its locators would have failed against the *original* form, and why? Then think: which locator would you use for the success message?',
        hint: '`getByLabel(\'Email\')` needs a label; `getByRole(\'alert\')` needs the role; `getByRole(\'status\')` for success needs `role="status"` on the welcome message.',
        explain: 'Role- and label-based locators turn accessibility into a precondition for your tests. When they can\'t find an element, that\'s often a real bug for real users — not a test problem.',
      },
    ],
    variants: [{ id: 'finished', label: 'Finished accessible form', files: { 'App.vue': signupFinished, 'api.js': signupApi } }],
  },

  animation: {
    type: 'comparison',
    title: 'Brittle vs robust E2E test',
    caption: 'Both tests pass today. Only one survives a redesign, a slow CI machine and a copy tweak.',
    alt: 'Side-by-side Playwright code. Left: a test using a long CSS selector path, a fixed two-second waitForTimeout and an exact text comparison read once. Right: a test using getByLabel and getByRole locators and a web-first expect(...).toHaveText with a regular expression that retries automatically.',
    props: {
      left: {
        label: 'Brittle',
        lang: 'js',
        code: `await page.fill('#app > div:nth-child(2) > input', 'ada@example.com')
await page.fill('form input[type=password]', 'correct horse battery')
await page.click('.btn.btn-primary.signup-btn')
await page.waitForTimeout(2000)                       // hope it's done
const msg = await page.textContent('.msg-success')
expect(msg).toBe('Welcome aboard! Check your inbox.')  // read once, exact copy`,
      },
      right: {
        label: 'Robust',
        lang: 'js',
        code: `await page.getByLabel('Email').fill('ada@example.com')
await page.getByLabel('Password', { exact: true }).fill('correct horse battery')
await page.getByRole('button', { name: 'Sign up' }).click()
await expect(page.getByRole('status')).toHaveText(/welcome aboard/i) // retries`,
      },
      points: [
        'CSS paths break when markup or styling changes; roles and labels change only when meaning changes.',
        'A fixed wait is too long on fast machines and too short on slow ones; web-first assertions wait exactly as long as needed.',
        'Reading text once and comparing races the UI; `expect(locator)` retries until the timeout.',
        'A regex tolerates small copy edits while still checking the message is right.',
      ],
    },
  },

  internals: {
    beginner: `
Playwright talks to real browser engines through a remote-control protocol: "go to this URL", "find the button named Sign up", "click it". Before every action it checks the element is attached, visible, stable (not animating) and enabled, so you rarely need manual waits. Assertions written as \`await expect(locator)…\` keep re-checking the page until they pass or a timeout expires.

Accessibility tools like axe read the same thing a screen reader reads — the **accessibility tree** the browser builds from your HTML: roles, names, states. A \`<div>\` that looks like a label isn't a label in that tree.
`,
    technical: [
      `
**Locators are lazy and strict.** A locator (\`page.getByRole('button', { name: 'Sign up' })\`) is a *description*, re-evaluated every time it's used, so it survives re-renders. Actions are **strict**: if a locator matches more than one element, Playwright throws instead of guessing — which is why ambiguous labels ("Password" vs "Show password") need \`exact: true\` or a narrower scope.

**Web-first assertions** (\`toBeVisible\`, \`toHaveText\`, \`toHaveURL\`…) poll until they pass, using the configured expect timeout. A plain \`expect(await locator.textContent()).toBe(…)\` reads once and doesn't retry — a common source of flakiness.

**Isolation.** Each test gets a fresh **browser context** (like a new incognito profile): no cookies, storage or cache leak between tests. Logging in through the UI for every test is slow; Playwright supports saving an authenticated \`storageState\` once and reusing it.

**Accessible names** are computed by the browser from, in order of precedence, \`aria-labelledby\`, \`aria-label\`, the associated \`<label>\`, then content or \`title\` (simplified — the full algorithm has more cases). \`getByRole(…, { name })\` and \`getByLabel\` query exactly this, so E2E tests and screen readers agree.

**How coverage is collected.** The \`v8\` provider asks the JavaScript engine which code ran (with source maps to map back to your \`.vue\` and \`.js\` files); \`istanbul\` instruments the code with counters before it runs. Branch coverage is stricter than line coverage: \`if (a && b)\` on one line can be "covered" while the \`b\`-false path never ran.
`,
      {
        code: `// Why "100% coverage" can still be useless
export const price = (qty, unit) => qty * unit
test('price', () => {
  price(2, 5)          // every line ran → 100% coverage
})                     // …but nothing was asserted, and price(2, 5) could return 99`,
        lang: 'js',
        title: 'coverage measures execution, not checking',
      },
    ],
    production: `
- **Shape the suite deliberately**: many fast unit/component tests, a solid layer of integration tests, and a small set of E2E tests for revenue- and safety-critical journeys (sign-up, checkout, login, the one feature your users pay for).
- **Run E2E against the production build**, in CI, on every pull request for the critical set; run the broader set (more browsers, staging backend) nightly or before release.
- **Make failures debuggable**: traces on retry, screenshots/videos on failure, uploaded as CI artifacts.
- **Flaky-test policy**: retries in CI are a safety net, not a fix. Report tests that only pass on retry, quarantine them, and fix the cause (missing waits, shared data, animations, time zones, test order).
- **Test data**: seed known data per test or use isolated accounts; never depend on what a previous test created.
- **Accessibility**: axe in E2E and component tests to catch regressions, plus manual keyboard and screen-reader passes for new components. Automated "zero violations" is a floor, not proof of accessibility.
- **Coverage**: a threshold to prevent backsliding, reviewed for *what's* uncovered (error paths, edge cases), never gamed with assertion-free tests.
`,
  },

  mistakes: [
    {
      title: 'Sleeping instead of asserting',
      wrong: { code: `await page.getByRole('button', { name: 'Save' }).click()\nawait page.waitForTimeout(3000)\nexpect(await page.textContent('.toast')).toBe('Saved')`, lang: 'js' },
      right: { code: `await page.getByRole('button', { name: 'Save' }).click()\nawait expect(page.getByRole('status')).toHaveText('Saved')`, lang: 'js' },
      explanation: 'Fixed waits waste time when the app is fast and fail when CI is slow. Web-first assertions wait exactly as long as needed.',
    },
    {
      title: 'Selectors tied to styling or structure',
      wrong: { code: `await page.click('div.card:nth-child(3) .btn-primary')`, lang: 'js' },
      right: { code: `await page.getByRole('button', { name: 'Add to cart' }).click()\n// or, when there is no good role/name: page.getByTestId('add-to-cart')`, lang: 'js' },
      explanation: 'Markup and classes change during redesigns; roles, names and dedicated test ids change only when the feature does.',
    },
    {
      title: 'E2E-testing every edge case',
      wrong: { code: `// 140 Playwright tests for every validation message and every filter combination`, lang: 'js' },
      right: { code: `// E2E: the happy path + one key failure per critical journey\n// component/unit tests: every validation rule and edge case`, lang: 'js' },
      explanation: 'E2E tests are the slowest and most expensive to maintain. Push detailed cases down to faster tests; keep E2E for "does the journey work end to end?".',
    },
    {
      title: 'Treating "no axe violations" as accessible',
      wrong: { code: `expect(results.violations).toEqual([]) // ✓ ship it`, lang: 'js' },
      right: { code: `expect(results.violations).toEqual([])\n// + tab through the flow, check focus order and visible focus,\n// + try it with a screen reader for new interactive components`, lang: 'js' },
      explanation: 'Automated tools can only check rules a machine can evaluate. Meaningful labels, logical focus order and keyboard operability need a human.',
    },
    {
      title: 'Chasing a coverage number',
      wrong: { code: `test('covers formatPrice', () => {\n  formatPrice(1999) // no expect — but the lines are "covered"\n})`, lang: 'js' },
      right: { code: `test('formats cents as euros', () => {\n  expect(formatPrice(1999)).toBe('€19.99')\n})`, lang: 'js' },
      explanation: 'Coverage counts executed code, not verified behaviour. Use it to find gaps, not as proof of quality.',
    },
  ],

  debugging: [
    {
      symptom: 'A Playwright test fails randomly with "element is not visible" or times out.',
      cause: 'A race with animations, overlays or data still loading — often hidden behind a fixed `waitForTimeout` elsewhere.',
      fix: 'Remove sleeps; assert on the state you need (`await expect(locator).toBeVisible()`), wait for the network response if needed, and inspect the trace (`npx playwright show-trace`).',
    },
    {
      symptom: '"strict mode violation: getByLabel(\'Password\') resolved to 2 elements".',
      cause: 'The locator matches more than one element (e.g. the password input and a "Show password" button).',
      fix: 'Use `{ exact: true }`, a more specific role/name, or scope the locator (`page.getByRole(\'form\').getByLabel(…)`).',
    },
    {
      symptom: 'Tests pass locally but fail in CI.',
      cause: 'Slower machines exposing races, different screen size or browser, time zone/locale differences, missing env variables, or tests depending on order and leftover data.',
      fix: 'Reproduce with CI settings (same browser project, `--workers=1`, the CI time zone), download the trace/screenshots, and remove hidden dependencies on timing, data and order.',
    },
    {
      symptom: 'A unit test fails and you can\'t see why.',
      cause: 'The assertion doesn\'t show the state that led to it.',
      fix: 'Run just that test (`it.only`, or filter by name), print the DOM (`console.log(wrapper.html())` in VTU, `screen.debug()` in Testing Library), use `--reporter=verbose`, or attach a debugger. For Playwright: `--debug`, `--ui`, or `await page.pause()`.',
    },
    {
      symptom: 'Coverage is high but bugs keep reaching production in error paths.',
      cause: 'Tests execute code without asserting outcomes, or only the happy path is tested while branches show as partially covered.',
      fix: 'Look at **branch** coverage and the HTML report\'s uncovered branches; add tests that assert error handling.',
    },
  ],

  bestPractices: [
    'Keep E2E tests few and focused on critical user journeys; push edge cases down to unit/component tests.',
    'Locate elements by role, label and visible text (or `data-test` as a fallback), never by styling.',
    'Use web-first assertions and auto-waiting; never fixed sleeps.',
    'Run E2E against the production build in CI, with traces and screenshots on failure.',
    'Add automated accessibility checks (axe) and do manual keyboard/screen-reader passes for new components.',
    'Use coverage to find untested branches; set thresholds as a floor, not a goal.',
    'Treat flaky tests as bugs: track, quarantine and fix — don\'t just retry.',
  ],

  useCases: [
    'Guarding sign-up, login and checkout flows on every pull request.',
    'Running the same journey in Chromium, Firefox and WebKit before release.',
    'Catching unlabeled inputs and nameless buttons before they ship.',
    'Finding untested error branches with an HTML coverage report.',
    'Debugging a CI-only failure from a recorded Playwright trace.',
  ],

  whenToUse: {
    use: [
      'E2E tests for journeys where a failure costs money, trust or safety.',
      'Network mocking in E2E for edge cases that are hard to produce on a real backend.',
      'A small set of E2E tests against a real staging backend to catch contract drift.',
      'axe checks in CI for every page or key component state.',
    ],
    avoid: [
      'E2E tests for logic that a unit test can check in milliseconds.',
      'Snapshot tests of whole pages as the main safety net.',
      'Retrying flaky tests without investigating why they fail.',
      'Coverage targets that encourage assertion-free tests.',
    ],
  },

  comparison: {
    title: 'Where each kind of check fits',
    headers: ['', 'Unit / component tests', 'E2E tests (Playwright / Cypress)', 'Automated a11y (axe)', 'Coverage report'],
    rows: [
      ['Answers', '"does this piece behave?"', '"does the journey work in a real browser?"', '"are there detectable a11y violations?"', '"what code did tests never run?"'],
      ['Speed', 'fast', 'slow', 'fast to medium', 'adds some overhead to test runs'],
      ['Catches', 'logic and rendering bugs', 'integration, routing, build, styling, network bugs', 'missing labels/names/alt, invalid ARIA, contrast (in a browser)', 'untested branches'],
      ['Misses', 'how pieces fit together', 'detailed edge cases (too costly)', 'meaningfulness, keyboard flow, real usability', 'whether tests assert anything'],
    ],
    note: 'A healthy suite uses all four, each for what it does best.',
  },

  quiz: [
    {
      id: 'e2e-and-quality-q1',
      type: 'mcq',
      prompt: 'What is the main trade-off of E2E tests compared to component tests?',
      options: [
        { text: 'They give the most realistic confidence but are slower, costlier to maintain and more prone to flakiness.' },
        { text: 'They are faster because they run in a real browser.', why: 'Real browsers, real builds and real networks make them the *slowest* kind of test.' },
        { text: 'They can replace all other tests.', why: 'Testing every edge case end to end would be slow and fragile; lower-level tests cover details better.' },
        { text: 'They can\'t test anything visual.', why: 'They run in real browsers, so layout, visibility and styling issues can surface.' },
      ],
      answer: 0,
      explanation: 'E2E tests exercise the real system, which is exactly why they cost more. Use a few for critical journeys.',
    },
    {
      id: 'e2e-and-quality-q2',
      type: 'output',
      prompt: 'The form has `<label for="pw">Password</label><input id="pw">` and a button `<button aria-label="Show password">👁</button>`. What happens?',
      code: {
        lang: 'js',
        code: `await page.getByLabel('Password').fill('correct horse battery')`,
      },
      options: [
        'It fills the password input',
        'It throws a strict mode violation: the locator matches 2 elements',
        'It fills both elements',
        'It types into the button',
      ],
      answer: 1,
      explanation: '`getByLabel` also matches `aria-label`, and by default matching is a case-insensitive substring, so "Show password" matches too. Playwright actions are strict and refuse to guess. Use `getByLabel(\'Password\', { exact: true })`.',
    },
    {
      id: 'e2e-and-quality-q3',
      type: 'bug',
      prompt: 'This test passes on your laptop and fails about one run in ten on CI. Click the line that makes it flaky.',
      code: {
        lang: 'js',
        code: `test('saves settings', async ({ page }) => {
  await page.goto('/settings')
  await page.getByLabel('Nickname').fill('ada')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.waitForTimeout(1000)
  expect(await page.getByRole('status').textContent()).toBe('Saved')
})`,
      },
      answerLine: 5,
      explanation: 'A fixed wait guesses how long saving takes. On a slow CI run, one second isn\'t enough, and line 6 reads the text only once. Replace both with `await expect(page.getByRole(\'status\')).toHaveText(\'Saved\')`, which retries.',
    },
    {
      id: 'e2e-and-quality-q4',
      type: 'fill',
      prompt: 'Complete the robust locator and the coverage command.',
      code: {
        lang: 'js',
        code: `await page.getByRole('___', { name: 'Sign up' }).click()

// terminal
npx vitest run --___`,
      },
      answer: [['button'], ['coverage']],
      explanation: 'Buttons have the role `button`; their accessible name comes from their text or `aria-label`. `--coverage` turns on coverage collection with the configured provider.',
    },
    {
      id: 'e2e-and-quality-q5',
      type: 'mcq',
      prompt: 'Select **all** problems an automated tool like axe can reliably detect.',
      options: [
        { text: 'An `<img>` with no `alt` attribute' },
        { text: 'An input with no accessible name' },
        { text: 'Alt text that is present but meaningless, like "image123"', why: 'Judging whether text is *meaningful* needs a human.' },
        { text: 'A focus order that jumps around the page illogically', why: 'Tools can find some focus issues, but judging whether an order makes sense requires manual testing.' },
      ],
      answer: [0, 1],
      explanation: 'Machines are good at presence and validity checks; humans are needed for meaning and real-world usability.',
    },
    {
      id: 'e2e-and-quality-q6',
      type: 'mcq',
      prompt: 'A module has 100% line coverage. What can you conclude?',
      options: [
        { text: 'Every line ran during the tests — nothing about whether the results were checked.' },
        { text: 'The module has no bugs.', why: 'Tests can run code without asserting anything, and can assert the wrong thing.' },
        { text: 'Every branch was tested.', why: 'Line coverage can be 100% while some branches (e.g. the false side of `a && b`) never ran.' },
        { text: 'The tests are fast.', why: 'Coverage says nothing about speed.' },
      ],
      answer: 0,
      explanation: 'Coverage measures execution. It\'s great for finding what you *didn\'t* test, not for proving what you did test is correct.',
    },
    {
      id: 'e2e-and-quality-q7',
      type: 'short',
      prompt: 'Why do Playwright and Testing Library recommend locating elements by role and label instead of CSS classes?',
      answer: 'Roles and labels describe what an element *is* and *means* to users, including assistive-technology users, so they only change when the feature changes — not on redesigns or refactors. They also make tests double as accessibility checks: if an input has no label or a button has no name, the locator can\'t find it, exposing a real bug.',
    },
  ],

  exercises: [
    {
      id: 'accessible-form',
      title: 'Make field errors accessible',
      difficulty: 'intermediate',
      prompt: `
This profile form shows errors visually, but assistive technology can't connect them to the fields. Fix the markup:

- replace the \`<span>\` captions with \`<label for="name">\` and \`<label for="email">\`;
- when a field is invalid, its input gets \`aria-invalid="true"\` and \`aria-describedby\` pointing at the **id** of its error message — \`name-error\` / \`email-error\` — and those ids go on the \`.field-error\` elements;
- when a field is valid, the input has **no** \`aria-invalid="true"\` and no \`aria-describedby\` pointing to a missing element;
- the "Saved!" message gets \`role="status"\`.

Tests submit the form (\`form.profile\`), type into \`#name\` / \`#email\` and inspect attributes.
`,
      files: { 'App.vue': profileStarter },
      hints: [
        'Labels first: `<label for="name">Name</label>` and `<label for="email">Email</label>`.',
        'Bind conditionally: `:aria-invalid="errors.name ? \'true\' : undefined"` — Vue removes an attribute bound to `undefined`.',
        'Add `id="name-error"` to the name\'s `<small>` and `:aria-describedby="errors.name ? \'name-error\' : undefined"` to the input; repeat for email; add `role="status"` to `.saved`.',
      ],
      solution: {
        explanation: '`aria-invalid` tells assistive technology the value was rejected; `aria-describedby` makes screen readers read the error text when the field is focused. Binding them only while there is an error keeps valid fields clean. These are the same attributes an axe scan and a `getByRole(\'textbox\', { name: \'Name\' })` locator rely on.',
        files: { 'App.vue': profileSolution },
      },
      tests: [
        {
          name: 'both inputs have labels',
          code: `expect(text('label[for="name"]')).toContain('Name')
expect(text('label[for="email"]')).toContain('Email')`,
        },
        {
          name: 'invalid fields are marked and described by their errors',
          code: `await submit('form.profile')
expect(attr('#name', 'aria-invalid')).toBe('true')
expect(attr('#name', 'aria-describedby')).toBe('name-error')
expect(text('#name-error')).toContain('required')
expect(attr('#email', 'aria-invalid')).toBe('true')
expect(attr('#email', 'aria-describedby')).toBe('email-error')
expect(exists('#email-error')).toBe(true)`,
        },
        {
          name: 'fixed fields lose the error attributes; success is announced',
          code: `await submit('form.profile')
await type('#name', 'Ada Lovelace')
await type('#email', 'ada@example.com')
await submit('form.profile')
expect(attr('#name', 'aria-invalid')).not.toBe('true')
expect(attr('#name', 'aria-describedby')).toBeNull()
expect(attr('#email', 'aria-invalid')).not.toBe('true')
expect(attr('.saved', 'role')).toBe('status')`,
        },
      ],
    },
    {
      id: 'robust-submit',
      title: 'No double saves',
      difficulty: 'intermediate',
      prompt: `
E2E tests (and impatient users) double-click. Right now, clicking **Save** twice quickly sends two requests.

Make the settings form robust:

- while saving, \`button.save\` is **disabled**;
- \`save()\` also **ignores** a second submit while a save is in progress (pressing Enter or a second submit event must not start another request);
- \`.status\` is **always rendered**, has \`role="status"\`, and reads **Saved** after a successful save (empty before).

Tests click \`.save\` / submit the form twice and count requests via \`stats.calls\` in **api.js**.
`,
      files: { 'App.vue': saveStarter, 'api.js': saveApi },
      hints: [
        'Add `const saving = ref(false)` and bind `:disabled="saving"` on the button.',
        'At the top of `save()`: `if (saving.value) return`, then `saving.value = true`; reset it in `finally`.',
        'Render `<p class="status" role="status">{{ message }}</p>` without `v-if`, so the live region exists before its text changes.',
      ],
      solution: {
        explanation: 'Disabling the button covers mouse users; the guard in `save()` covers every other path (Enter key, programmatic submits, a test calling submit twice). A permanent `role="status"` region is reliably announced when its text changes — and gives E2E tests a stable `getByRole(\'status\')` to wait on.',
        files: { 'App.vue': saveSolution, 'api.js': saveApi },
      },
      tests: [
        {
          name: 'a double click saves once',
          code: `await click('.save')
await click('.save')
await wait(400)
expect(requireModule('api.js').stats.calls).toBe(1)`,
        },
        {
          name: 'a second submit while saving is ignored',
          code: `await submit('form.settings')
await submit('form.settings')
await wait(400)
expect(requireModule('api.js').stats.calls).toBe(1)`,
        },
        {
          name: 'the button is disabled while saving and the result is announced',
          code: `expect(attr('.status', 'role')).toBe('status')
await click('.save')
expect(find('.save').disabled).toBe(true)
await wait(400)
expect(find('.save').disabled).toBe(false)
expect(text('.status')).toContain('Saved')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'e2e-and-quality-a11y-automation',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How would you test the accessibility of a Vue app? What can automated tools catch, and what can\'t they?',
      answer: 'Combine automation and manual checks. Automated: axe-core in E2E tests (`@axe-core/playwright`) and component tests (`vitest-axe`/`jest-axe`), plus role- and label-based locators that fail when names are missing. They catch missing labels, button names and alt attributes, invalid ARIA, duplicate ids and — in real browsers — colour-contrast problems. They can\'t judge whether text alternatives are meaningful, whether focus order and keyboard interaction make sense, or whether a custom widget is actually usable with a screen reader; that needs manual keyboard passes and screen-reader testing.',
      explanation: '"No detectable violations" is a floor, not proof.',
      whyAsked: 'Accessibility is increasingly a legal and product requirement; interviewers want realistic, not checkbox, answers.',
      mistakes: ['Claiming axe guarantees accessibility.', 'Only mentioning manual testing (no regression safety).', 'Not knowing that role/label locators help.'],
      followUps: ['Which component would you test manually first?', 'How do you test focus management in a modal?', 'Why can\'t contrast checks run in jsdom?'],
      modelAnswer: 'I use two layers. Automated checks run in CI: axe in our Playwright tests for key pages and states, axe in component tests for shared components, and role- and label-based locators everywhere, so a missing label or button name breaks a test. That reliably catches things like unlabeled inputs, icon buttons without names, missing alt attributes and invalid ARIA. But tools can\'t tell whether alt text is meaningful, whether the focus order is logical or whether a custom dropdown works with a keyboard and screen reader, so new interactive components also get a manual keyboard pass and a screen-reader check.',
    },
    {
      id: 'e2e-and-quality-flaky-waits',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A Playwright test uses `page.waitForTimeout(2000)` after clicking "Save" and then reads the toast text with `textContent()`. It\'s flaky. How do you fix it, and why does your fix work?',
      answer: 'Remove the fixed wait and use a web-first assertion on a meaningful locator: `await expect(page.getByRole(\'status\')).toHaveText(\'Saved\')`. Web-first assertions retry until the condition holds or the timeout expires, so they wait exactly as long as needed. Actions already auto-wait for elements to be visible, enabled and stable. If the UI depends on a specific network call, wait for it with `page.waitForResponse` or mock it with `page.route` for determinism.',
      explanation: 'Wait for conditions, not for time.',
      whyAsked: 'Flaky E2E suites are a top complaint in teams; this checks if you know the tool\'s core design.',
      mistakes: ['Increasing the timeout to 5 seconds.', 'Adding retries as the fix.', 'Using `textContent()` + plain `expect`, which reads once.'],
      followUps: ['What does Playwright check before clicking?', 'When would you use `waitForResponse`?', 'How do you find out why it failed in CI?'],
      modelAnswer: 'The fixed wait is a guess: on a slow CI run two seconds isn\'t enough, and on a fast one it\'s wasted time. Reading `textContent()` once then races the UI. I\'d replace both lines with a web-first assertion — `await expect(page.getByRole(\'status\')).toHaveText(\'Saved\')` — which keeps re-checking until it passes or times out. Actions like click already auto-wait for the element to be actionable. If the result depends on a request, I\'d either mock it with `page.route` or explicitly wait for the response, and I\'d look at the trace if it still fails.',
    },
    {
      id: 'e2e-and-quality-coverage-goal',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your manager wants the team to reach 100% test coverage this quarter. How do you respond?',
      answer: 'Agree with the goal behind it (confidence, fewer regressions) but explain that coverage measures executed code, not verified behaviour; the last percent is often trivial or generated code; and chasing a number encourages assertion-free tests. Propose instead: a sensible threshold as a floor that blocks backsliding, focus on branch coverage of critical modules (pricing, auth, checkout), mandatory tests for bug fixes, E2E tests for critical journeys, and tracking outcome metrics like escaped bugs and flaky-test rate.',
      explanation: 'Measure confidence, not lines.',
      whyAsked: 'Shows maturity: understanding metrics and communicating trade-offs with non-engineers.',
      mistakes: ['Blindly agreeing.', 'Dismissing coverage entirely.', 'Not offering an alternative plan.'],
      followUps: ['What threshold would you choose and why?', 'How do you make sure tests actually assert?', 'Would mutation testing help?'],
      modelAnswer: 'I\'d say I share the goal — fewer regressions — but 100% coverage is the wrong lever. Coverage only shows which lines ran; you can hit 100% with tests that assert nothing, and the last few percent usually cost the most for the least value. I\'d propose a threshold as a floor so coverage can\'t drop, a focus on branch coverage in the critical modules like pricing and checkout, a rule that every bug fix comes with a test, and a handful of E2E tests for the key journeys. Then we report escaped bugs and flaky-test counts, which measure what we actually care about.',
    },
    {
      id: 'e2e-and-quality-snapshots',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What are the pros and cons of snapshot tests (e.g. `expect(wrapper.html()).toMatchSnapshot()`) compared to explicit assertions?',
      answer: 'Snapshots are quick to write and catch any change in output, which can be useful for small, stable outputs (a formatter, a serialized config, a tiny presentational component). But large snapshots fail on every harmless markup change, reviewers can\'t tell intended from accidental changes, and people update them blindly — so they protect little. Explicit assertions document the behaviour that matters and fail only when it breaks. Prefer explicit assertions; use small, focused (or inline) snapshots deliberately.',
      explanation: 'A snapshot says "something changed"; an assertion says "this specific behaviour broke".',
      whyAsked: 'Snapshot overuse is a common source of brittle, low-value suites.',
      mistakes: ['Snapshotting whole pages.', 'Running with `-u` whenever a snapshot fails.', 'Saying snapshots are always bad.'],
      followUps: ['What is an inline snapshot?', 'How would you review a snapshot diff?', 'What about visual (screenshot) regression tests?'],
      modelAnswer: 'Snapshots are cheap to write and flag any change in output, which is handy for small, stable things like a formatted string or a tiny component. The trouble is big snapshots: they break on harmless markup changes, the diffs are hard to review, and teams end up pressing "update" without reading — so they stop protecting anything. Explicit assertions say what matters — this button is disabled, this error is shown — and only fail when that behaviour breaks. I use focused or inline snapshots sparingly and explicit assertions by default.',
    },
    {
      id: 'e2e-and-quality-ci-only',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 5,
      question: 'An E2E test passes locally every time but fails intermittently in CI. Walk through how you investigate.',
      answer: 'Collect evidence first: enable traces/screenshots/videos on failure and inspect the trace of a failing run. Reproduce CI conditions: same browser project, headless, fewer workers or the same parallelism, CI time zone/locale, viewport, production build, environment variables, cold caches. Use repetition (`--repeat-each`) to reproduce locally. Typical causes: races hidden by fast local machines (fixed waits, missing assertions, animations), shared test data or order dependence under parallel workers, time/date and locale differences, network calls to real services, and resource limits. Fix the cause and keep retries only as a safety net with flaky-test reporting.',
      explanation: 'CI is a different environment; make the differences visible and remove hidden dependencies.',
      whyAsked: 'Senior engineers are expected to keep CI trustworthy.',
      mistakes: ['Adding retries and closing the ticket.', 'Increasing all timeouts.', 'Only re-running locally in headed mode.'],
      followUps: ['How do you isolate test data across parallel workers?', 'How do you handle dates in tests?', 'When is it OK to quarantine a test?'],
      modelAnswer: 'First I get evidence: traces and screenshots on failure, and I open the trace from a failing CI run to see exactly which step and what the page looked like. Then I recreate CI conditions locally — headless, the same browser, the same worker count, the CI time zone and locale, the production build — and use repeat-each to make it fail on my machine. The usual suspects are timing races that a fast laptop hides, tests sharing data when they run in parallel, date or locale assumptions, and real third-party calls. I fix the cause, and while it\'s being fixed I quarantine the test rather than letting retries hide it.',
    },
    {
      id: 'e2e-and-quality-strategy',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design a test strategy for a medium-sized Vue + Pinia + Vue Router app with a checkout flow. What do you test at each level, and what runs when?',
      answer: 'Unit tests (Vitest) for pure logic and composables: pricing, validation, formatters, store getters/actions. Component tests (Vue Test Utils or Testing Library) for shared components and pages with mocked APIs (MSW): rendering, events, loading/error/empty states, accessibility (axe). Integration tests for pages with a real router and Pinia. A small E2E suite (Playwright) on the production build for critical journeys — sign-up, login, search-to-checkout — mostly with mocked or seeded backends, plus a few against staging to catch contract drift. On every PR: lint, unit, component and critical E2E in one browser; nightly or pre-release: full E2E across browsers and staging. Coverage threshold as a floor, flaky tests tracked and fixed.',
      explanation: 'Fast feedback on every change, broad confidence before release.',
      whyAsked: 'Tests whether you can balance confidence, speed and maintenance across a whole team.',
      mistakes: ['Only E2E tests.', 'No plan for flakiness or test data.', 'Treating coverage as the strategy.'],
      followUps: ['How do you keep MSW handlers in sync with the backend?', 'How would you test payments?', 'What would block a merge?'],
      modelAnswer: 'I\'d build it in layers. Pure logic and composables — pricing, validation, store actions — get fast Vitest unit tests. Pages and shared components get component tests with MSW mocking the API, covering loading, error and empty states, plus axe checks. Pages that depend on routing and the store get integration tests with a real memory router and a fresh Pinia. On top, a small Playwright suite on the production build covers the critical journeys: sign-up, login and search through checkout, mostly against mocks or seeded data, with a few runs against staging. Every PR runs unit, component and the critical E2E path; the full cross-browser and staging runs happen nightly and before releases. Coverage is a floor, and flaky tests are tracked like bugs.',
    },
    {
      id: 'e2e-and-quality-accessible-search',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'This product search would fail role- and label-based E2E tests and basic axe checks. Fix the markup in **App.vue** so: the input has an associated `<label for="q">`; the ✕ button (`.clear`) has the accessible name "Clear search"; the result count (`.count`) is announced politely (`role="status"`); the search area has `role="search"`; and the decorative product images have an empty `alt=""`.',
      starter: { files: { 'App.vue': searchStarter } },
      tests: [
        { name: 'the input has a label', code: `expect(exists('label[for="q"]')).toBe(true)\nexpect(exists('#q')).toBe(true)` },
        { name: 'the clear button has a name', code: `expect(attr('.clear', 'aria-label')).toMatch(/clear search/i)` },
        { name: 'the count is a status region and the area is a search landmark', code: `expect(attr('.count', 'role')).toBe('status')\nexpect(attr('.search', 'role')).toBe('search')` },
        {
          name: 'decorative images have empty alt text',
          code: `const imgs = findAll('.result img')
expect(imgs.length).toBe(3)
for (const img of imgs) expect(img.getAttribute('alt')).toBe('')`,
        },
        { name: 'search still works', code: `await type('#q', 'blue')\nexpect(findAll('.result').length).toBe(2)\nawait click('.clear')\nexpect(findAll('.result').length).toBe(3)` },
      ],
      hints: ['Add `<label for="q">Search products</label>` before the input (a placeholder is not a label).', 'Icon-only buttons need `aria-label="Clear search"`.', 'Images next to a visible product name are decorative: `alt=""` tells screen readers to skip them. Add `role="status"` on `.count` and `role="search"` on `.search`.'],
      answer: 'Associate a label, name the icon button, make the count a polite live region, mark the search landmark and give decorative images empty alt text.',
      solution: { files: { 'App.vue': searchSolution } },
      explanation: 'Each fix adds information to the accessibility tree: names for controls, a landmark for navigation, an announcement for changing results, and an explicit "skip me" for decorative images (a *missing* alt is a violation; an *empty* one is a deliberate choice). The same changes make `getByLabel(\'Search products\')`, `getByRole(\'button\', { name: \'Clear search\' })` and `getByRole(\'status\')` work in Playwright.',
      whyAsked: 'A practical check that you can turn accessibility knowledge into markup — and connect it to testability.',
      mistakes: ['Using the placeholder as the only label.', 'Writing alt text that repeats the visible product name (screen readers would hear it twice).', 'Making the count `role="alert"` (too assertive for every keystroke).'],
      followUps: ['When should an image have non-empty alt text here?', 'How would you avoid announcing the count on every keystroke?', 'What would an axe scan of the original report?'],
      modelAnswer: 'I\'d add a real label connected to the input, give the icon-only clear button an aria-label of "Clear search", make the result count a polite `role="status"` region so screen-reader users hear how many results there are, mark the wrapper as a search landmark, and give the product images empty alt text because the product name is already right next to them. Those changes fix what axe would flag and make role- and label-based locators work. I might also debounce the count announcement so it doesn\'t speak on every keystroke.',
    },
  ],

  takeaways: [
    'E2E tests drive the real app in real browsers; keep them few, focused on critical journeys, and run them against the production build.',
    'Locate by role, label and text; rely on auto-waiting and web-first assertions — never fixed sleeps.',
    'Role/label locators double as accessibility checks; add axe for detectable violations and manual checks for the rest.',
    'Coverage shows what never ran, not whether tests check anything; use thresholds as a floor.',
    'Brittle tests come from styling selectors, sleeps, internals, giant snapshots and shared state.',
    'Treat flaky tests as bugs: collect traces, reproduce CI conditions, fix the cause instead of retrying.',
  ],
}
