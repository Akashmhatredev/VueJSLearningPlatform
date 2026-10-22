// Lesson: Component tests with Vue Test Utils.
// Vue Test Utils can't run in the sandbox, so VTU/Vitest code is static. The
// runnable experiments are checked by the platform's in-browser harness
// (mountFile, click, type…), which mirrors the same ideas.

const stepperVue = `<script setup>
const props = defineProps({
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 10 },
  label: { type: String, default: 'quantity' },
})
const emit = defineEmits(['update:modelValue'])

function decrease() {
  if (props.modelValue > props.min) emit('update:modelValue', props.modelValue - 1)
}

function increase() {
  emit('update:modelValue', props.modelValue + 1)
}
</script>

<template>
  <span class="stepper">
    <button class="dec" type="button" :disabled="modelValue <= min" @click="decrease">−</button>
    <span class="value">{{ modelValue }}</span>
    <button class="inc" type="button" @click="increase">+</button>
  </span>
</template>`

const stepperApp = `<script setup>
import { ref } from 'vue'
import QuantityStepper from './QuantityStepper.vue'

const beans = ref(1)
const mugs = ref(0)
</script>

<template>
  <h2>Your order</h2>
  <div class="line">
    Coffee beans
    <QuantityStepper v-model="beans" label="Coffee beans" :min="1" :max="5" />
  </div>
  <div class="line">
    Mugs
    <QuantityStepper v-model="mugs" label="Mugs" :max="3" />
  </div>
  <p class="summary">{{ beans }} bag(s) of beans, {{ mugs }} mug(s)</p>
</template>`

const stepperTest = `import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuantityStepper from './QuantityStepper.vue'

describe('QuantityStepper', () => {
  it('shows the current value', () => {
    const wrapper = mount(QuantityStepper, { props: { modelValue: 3 } })
    expect(wrapper.get('[data-test="qty-value"]').text()).toBe('3')
  })

  it('emits the next value when + is clicked', async () => {
    const wrapper = mount(QuantityStepper, { props: { modelValue: 3 } })
    await wrapper.get('button.inc').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[4]])
  })

  it('disables + at the maximum', () => {
    const wrapper = mount(QuantityStepper, { props: { modelValue: 5, max: 5 } })
    expect(wrapper.get('button.inc').attributes('disabled')).toBeDefined()
  })

  it('works with v-model', async () => {
    const wrapper = mount(QuantityStepper, {
      props: {
        modelValue: 1,
        'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
      },
    })
    await wrapper.get('button.inc').trigger('click')
    expect(wrapper.get('[data-test="qty-value"]').text()).toBe('2')
  })
})`

const ratingApp = `<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'

const rating = ref(3)
</script>

<template>
  <h2>Rate this recipe</h2>
  <StarRating v-model="rating" />
  <p class="rating-text">You rated it {{ rating }} / 5</p>
</template>`

const loginApp = `<script setup>
import { ref } from 'vue'
import LoginForm from './LoginForm.vue'

const signedInAs = ref('')

function onLogin(credentials) {
  signedInAs.value = credentials.email
}
</script>

<template>
  <LoginForm @submit="onLogin" />
  <p v-if="signedInAs" class="welcome">Welcome, {{ signedInAs }}!</p>
</template>`

const toggleApp = `<script setup>
import { ref } from 'vue'
import ToggleSwitch from './ToggleSwitch.vue'

const dark = ref(false)
</script>

<template>
  <ToggleSwitch v-model="dark" label="Dark mode" />
  <p class="mode">{{ dark ? 'Dark' : 'Light' }} theme</p>
</template>`

export default {
  id: 'component-testing',
  title: 'Component tests with Vue Test Utils',
  summary: 'Mount a component in a test, interact with it like a user, and assert on what it renders and the events it emits.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['testing-fundamentals', 'props', 'emits', 'component-v-model'],
  related: ['testing-logic', 'testing-async-routing', 'e2e-and-quality', 'slots', 'accessible-components'],
  tags: ['testing', 'vue test utils', 'vtu', 'mount', 'shallowMount', 'trigger', 'setValue', 'emitted', 'component test', 'data-test'],
  apis: [
    { name: 'mount(Component, options)', summary: 'Vue Test Utils: renders a component (with its children) and returns a wrapper.' },
    { name: 'shallowMount(Component, options)', summary: 'Vue Test Utils: like mount, but replaces every child component with a stub.' },
    { name: 'wrapper.get(selector) / find(selector)', summary: '`get` returns the element wrapper or throws; `find` returns an empty wrapper you can check with `.exists()`.' },
    { name: 'await wrapper.trigger(event)', summary: 'Dispatches a DOM event and returns a promise that resolves after Vue re-renders.' },
    { name: 'await wrapper.setValue(value)', summary: 'Sets an input/select value and fires the event v-model listens to.' },
    { name: 'wrapper.emitted(name)', summary: 'Array of argument arrays for each time the component emitted that event (undefined if never).' },
  ],
  docs: [
    { label: 'Vue Guide — Testing: component testing', url: 'https://vuejs.org/guide/scaling-up/testing.html#component-testing' },
    { label: 'Vue Test Utils — Getting started', url: 'https://test-utils.vuejs.org/guide/' },
    { label: 'Vue Test Utils — API reference', url: 'https://test-utils.vuejs.org/api/' },
    { label: 'Vue Test Utils — Testing v-model', url: 'https://test-utils.vuejs.org/guide/advanced/v-model.html' },
  ],

  intro: `
A **component test** renders one Vue component in a test, pokes it like a user would — click, type, choose — and checks what happens: the text on screen, the attributes, and the **events** it sends to its parent.

The official library for this is **Vue Test Utils** (VTU). You \`mount\` a component, get back a **wrapper** (an object with helper methods around the rendered component), and use it to find elements, trigger events and read what was emitted. It runs inside Vitest, in a simulated browser DOM, so hundreds of component tests still finish in seconds.
`,

  why: `
Unit tests prove your *functions* work. But a lot of bugs live in the component layer: the button that isn't disabled at the maximum, the event emitted with the wrong value, the label a screen reader never announces, the \`v-model\` that doesn't update.

You could catch those by clicking through the app — every time, on every change. Or with an end-to-end test, which needs the whole app running in a real browser and is much slower.

A component test sits in between: it treats the component as a black box with a **public contract** — *props go in, DOM and events come out* — and checks that contract in milliseconds. Get the contract right and the component can be reused anywhere with confidence.
`,

  eli15: `
Think of a component as a vending machine. You don't care which gears are inside. You care that when you press **B4** (an input), the right snack drops out (an output), the display shows the right price, and the button for a sold-out item doesn't work.

A component test is a robot that stands in front of the machine. It sets the machine up (\`mount\` with some props), presses buttons (\`trigger('click')\`), types on the keypad (\`setValue\`), and then checks the display and the tray (\`text()\`, \`emitted()\`).

The robot never opens the machine. If you rebuild the inside with completely new gears but the buttons and snacks behave the same, the robot's checks still pass. That's exactly what you want.
`,

  analogy: {
    title: 'The crash-test lab',
    body: `
Car makers don't test seatbelts by driving to work. They put a single seat in a lab rig, strap in a crash-test dummy, run a controlled impact, and measure the result with sensors.

\`mount()\` is the lab rig: one component, held in place, with exactly the props you choose. \`trigger()\` and \`setValue()\` are the controlled impacts. \`text()\`, \`attributes()\` and \`emitted()\` are the sensors. The whole car — the full app in a real browser — is tested too, but only a few times, in E2E tests.
`,
    mapping: [
      ['the lab rig', '`mount(QuantityStepper, { props })`'],
      ['the controlled impact', '`await wrapper.get(\'button.inc\').trigger(\'click\')`'],
      ['the sensors', '`text()`, `attributes()`, `emitted()`'],
      ['"the dummy stayed in the seat"', '`expect(wrapper.emitted(\'update:modelValue\')).toEqual([[4]])`'],
      ['driving the real car', 'an end-to-end test of the whole app'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Anatomy of a component test',
    caption: 'Mount, interact, wait for Vue to re-render, assert. Forgetting the "wait" step is the most common reason a correct component fails its test.',
    alt: 'A row of five boxes connected by arrows: the test calls mount with props; mount returns a wrapper around the rendered component; the test interacts through the wrapper with trigger or setValue; the test awaits the DOM update; then it asserts on text, attributes and emitted events. A dashed arrow from the component back to the assertions is labelled events.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'mount', label: 'mount()', note: 'component + props', tone: 'acid' },
        { id: 'wrapper', label: 'wrapper', note: 'get / find / findComponent', tone: 'cobalt' },
        { id: 'act', label: 'interact', note: 'trigger · setValue · setProps' },
        { id: 'wait', label: 'await', note: 'Vue re-renders (next tick)', tone: 'kraft' },
        { id: 'assert', label: 'assert', note: 'text · attributes · emitted', tone: 'red' },
      ],
      edges: [
        { from: 'mount', to: 'wrapper', label: 'returns' },
        { from: 'wrapper', to: 'act', label: 'element' },
        { from: 'act', to: 'wait', label: 'promise' },
        { from: 'wait', to: 'assert', label: 'fresh DOM' },
      ],
      steps: [
        { focus: ['mount'], text: '`mount(QuantityStepper, { props: { modelValue: 3 } })` creates a small Vue app around the component, passes the props and renders it into a simulated DOM.' },
        { focus: ['wrapper'], edges: ['mount->wrapper'], text: 'You get a **wrapper**: the rendered component plus helpers. `wrapper.get(\'button.inc\')` finds an element (and throws a clear error if it isn\'t there).' },
        { focus: ['act'], edges: ['wrapper->act'], text: 'Interact like a user: `trigger(\'click\')` dispatches a real DOM event; `setValue(\'Ada\')` fills an input and fires the event `v-model` listens to.' },
        { focus: ['wait'], edges: ['act->wait'], text: 'Vue batches DOM updates to the next tick. `trigger` and `setValue` return a promise for exactly that moment — so you `await` them.' },
        { focus: ['assert'], edges: ['wait->assert'], text: 'Now assert on the contract: rendered `text()`, `attributes(\'disabled\')`, and `emitted(\'update:modelValue\')` — never on the component\'s private variables.' },
      ],
    },
  },

  syntax: [
    `
#### Install and mount

Vue Test Utils v2 is the version for Vue 3. It runs in Vitest with a DOM environment (\`environment: 'jsdom'\`, see [Testing fundamentals](lesson:testing-fundamentals)).
`,
    {
      code: `npm install -D @vue/test-utils jsdom`,
      lang: 'bash',
      title: 'install',
      static: true,
    },
    {
      code: `import { mount } from '@vue/test-utils'
import QuantityStepper from './QuantityStepper.vue'

const wrapper = mount(QuantityStepper, {
  props: { modelValue: 3, max: 5 },        // props the parent would pass
  slots: { default: 'bags' },              // slot content (string, template or component)
  global: {
    plugins: [router, pinia],              // app.use(...) for this test
    stubs: { RouterLink: true },           // replace children with placeholders
    provide: { theme: 'dark' },            // provide() values for inject()
  },
})`,
      lang: 'js',
      title: 'mount() and its options',
      static: true,
    },
    `
#### Finding things

- \`wrapper.get(sel)\` — returns the element's wrapper or **throws** with a helpful message. Use it when the element must exist.
- \`wrapper.find(sel)\` — returns a wrapper that may be empty; check with \`.exists()\`. Use it to assert something is **absent**.
- \`wrapper.findAll(sel)\` — an array of wrappers.
- \`wrapper.findComponent(Child)\` — find a child *component*, e.g. to read \`.props()\` or check an event it emitted.

#### Reading and interacting
`,
    {
      code: `wrapper.text()                         // all visible text
wrapper.html()                         // rendered markup (handy for debugging)
wrapper.get('button.inc').attributes('aria-label')
wrapper.get('.stepper').classes()      // ['stepper', ...]
wrapper.find('.error').exists()        // true / false

await wrapper.get('button.inc').trigger('click')
await wrapper.get('input[type=email]').setValue('ada@example.com')
await wrapper.setProps({ modelValue: 4 })

wrapper.emitted('update:modelValue')   // [[4]] — one array of arguments per emit
wrapper.emitted('submit')              // undefined if it never happened`,
      lang: 'js',
      title: 'the wrapper API you use daily',
      static: true,
    },
    {
      callout: 'warn',
      title: 'Always await trigger and setValue',
      text: 'Vue updates the DOM asynchronously (batched to the next tick). `trigger()`, `setValue()` and `setProps()` return a promise that resolves after that update. Without `await`, your assertion reads the **old** DOM.',
    },
    `
#### Testing v-model

\`v-model\` on a component is just the \`modelValue\` prop plus an \`update:modelValue\` event (see [Component v-model](lesson:component-v-model)). Either assert on the emitted event, or let the test play the parent by passing an \`onUpdate:modelValue\` listener that feeds the value back in:
`,
    {
      code: `const wrapper = mount(QuantityStepper, {
  props: {
    modelValue: 1,
    'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
  },
})
await wrapper.get('button.inc').trigger('click')
expect(wrapper.props('modelValue')).toBe(2)`,
      lang: 'js',
      title: 'v-model round trip',
      static: true,
    },
    `
#### On this platform: the harness

The sandbox can't run Vue Test Utils. The checks in the playground and exercises use this platform's small **teaching harness**, which mirrors VTU's ideas with plain DOM elements:

- \`mount(C, { props })\` → \`mountFile('C.vue', props)\` (props only, no slots or global options)
- \`wrapper.get(sel)\` → \`w.find(sel)\` — returns a DOM element (or \`null\`)
- \`await el.trigger('click')\` → \`await click(element)\`
- \`await input.setValue('x')\` → \`await type(element, 'x')\`
- \`wrapper.emitted('x')\` → \`w.emitted('x')\` — returns \`[]\` (not \`undefined\`) when nothing was emitted, and only records events the component **declares**
- \`attributes('aria-label')\` → \`element.getAttribute('aria-label')\`

\`mountFile\` also acts like a parent using \`v-model\`: when the component emits \`update:x\`, the harness feeds the value back into prop \`x\`. It's a teaching harness, not VTU — real tests use the static examples on this page.
`,
  ],

  walkthrough: {
    title: 'QuantityStepper.test.js',
    lang: 'js',
    code: stepperTest,
    intro: 'A real Vue Test Utils + Vitest file for the playground\'s stepper. After the experiments, every one of these tests would pass.',
    steps: [
      { lines: [1, 3], text: 'Import the test API, VTU\'s `mount`, and the component itself — the real `.vue` file, compiled by Vitest through the Vite Vue plugin.' },
      { lines: [6, 9], text: 'Mount with a prop and assert on rendered text. The selector is a `data-test` attribute: it exists *for tests*, so restyling or renaming CSS classes can\'t break it.' },
      { lines: [11, 15], text: 'An interaction test is `async`: `await trigger(\'click\')`, then check `emitted`. The value `[[4]]` means "emitted once, with one argument: 4". The stepper doesn\'t change its own prop — it *asks* the parent to.' },
      { lines: [17, 20], text: 'Assert on the attribute users and assistive tech rely on. `attributes(\'disabled\')` is `\'\'` when present and `undefined` when absent. (VTU\'s `trigger` does nothing on a disabled element, so the attribute check is the meaningful one.)' },
      { lines: [22, 31], text: 'The v-model round trip: the test plays the parent by listening to `update:modelValue` and feeding the value back with `setProps`. After one click the displayed value is 2.' },
    ],
  },

  playground: {
    title: 'QuantityStepper under test',
    objective: 'Make a reusable stepper honour its contract — max limit, accessible labels and stable test hooks — as checked by component tests.',
    files: { 'App.vue': stepperApp, 'QuantityStepper.vue': stepperVue },
    expected: 'Two steppers bound with `v-model`. Click **+** on the beans row a few times: it goes past 5 even though `:max="5"` is passed — that\'s the first bug. The experiments mount `QuantityStepper.vue` on its own with `mountFile()` (the harness version of VTU\'s `mount`) and check its contract.',
    experiments: [
      {
        id: 'respect-max',
        task: 'The **+** button ignores `max`. Make it **disabled** when `modelValue >= max`, and make `increase()` refuse to emit past `max` even if it is somehow called.',
        hint: 'Mirror what the − button already does with `min`: a `:disabled` binding on the button and a guard inside `increase()`.',
        tests: [
          {
            name: 'at max, + is disabled and emits nothing',
            code: `const w = mountFile('QuantityStepper.vue', { modelValue: 5, max: 5 })
const inc = w.find('.inc')
expect(inc.disabled).toBe(true)
inc.disabled = false // force a click anyway: the guard must hold
await click(inc)
expect(w.emitted('update:modelValue')).toHaveLength(0)`,
          },
          {
            name: 'below max, + still emits the next value',
            code: `const w = mountFile('QuantityStepper.vue', { modelValue: 4, max: 5 })
await click(w.find('.inc'))
expect(w.emitted('update:modelValue')).toEqual([[5]])`,
          },
        ],
        explain: 'Two layers: the disabled attribute tells users (and screen readers) "you can\'t", and the guard keeps the contract even if the method is called another way. The test forces a click on purpose to prove the second layer exists.',
      },
      {
        id: 'aria-labels',
        task: 'A screen reader announces the buttons as just "−" and "+". Give them `aria-label`s built from the `label` prop: **"Decrease Coffee beans"** and **"Increase Coffee beans"**.',
        hint: 'Bind it on each button: `:aria-label="\'Increase \' + label"` and `:aria-label="\'Decrease \' + label"` (a template string works too).',
        tests: [
          {
            name: 'both buttons have descriptive labels',
            code: `const w = mountFile('QuantityStepper.vue', { modelValue: 2, label: 'Coffee beans' })
expect(w.find('.inc').getAttribute('aria-label')).toBe('Increase Coffee beans')
expect(w.find('.dec').getAttribute('aria-label')).toBe('Decrease Coffee beans')`,
          },
        ],
        explain: 'An accessible name is part of a component\'s public contract, so it belongs in component tests. In VTU you\'d assert `wrapper.get(\'button.inc\').attributes(\'aria-label\')`; Testing Library goes further and *finds* the button by that name: `getByRole(\'button\', { name: \'Increase Coffee beans\' })`.',
      },
      {
        id: 'data-test-hook',
        task: 'The walkthrough\'s tests look up the number with `[data-test="qty-value"]`. Add that attribute to the `<span>` that shows the value.',
        hint: '`<span class="value" data-test="qty-value">{{ modelValue }}</span>`',
        tests: [
          {
            name: 'the value has a data-test hook',
            code: `const w = mountFile('QuantityStepper.vue', { modelValue: 3 })
const value = w.find('[data-test="qty-value"]')
expect(value).toBeTruthy()
expect(value.textContent.trim()).toBe('3')
await click(w.find('.inc'))
expect(w.find('[data-test="qty-value"]').textContent.trim()).toBe('4')`,
          },
        ],
        explain: 'A `data-test` attribute is a promise to tests: "this stays, whatever the styling". Classes change when designers restyle; tag structure changes when you refactor. The second half of the test also shows the harness acting as a `v-model` parent — the emitted 4 came back in as the new prop.',
      },
      {
        id: 'map-the-test',
        task: 'Read the walkthrough\'s **QuantityStepper.test.js**. For each VTU line, find the harness call that does the same job in the experiment tests above (`mountFile`, `w.find`, `click`, `w.emitted`, `getAttribute`). Which VTU method has **no** need for an equivalent here, and why?',
        hint: 'Look at how the v-model test feeds values back with `setProps`.',
        explain: 'The harness\'s `mountFile` wires `update:*` events back into props automatically, so the explicit `onUpdate:modelValue` + `setProps` dance from VTU isn\'t needed. Real VTU leaves that to you, which keeps the parent\'s role visible in the test.',
      },
    ],
  },

  animation: {
    type: 'component-flow',
    props: { mode: 'emits' },
    title: 'The contract a component test checks',
    caption: 'Props flow down into the child; events flow up to the parent. A component test stands in for the parent: it supplies the props and listens for the events.',
    alt: 'An animated parent and child component. Data flows down from parent to child as props; when the child is clicked it emits an event that travels up to the parent, which updates its state.',
  },

  internals: {
    beginner: `
\`mount()\` builds a tiny Vue app whose only job is to render your component with the props you gave it. It renders into a DOM made of JavaScript objects (jsdom), not a real browser window. The wrapper you get back is a remote control: it can find elements, fire events at them and read what the component emitted. Because Vue redraws the screen a moment *after* a change, each interaction gives you a promise to wait for that redraw.
`,
    technical: [
      `
**What mount does.** VTU calls \`createApp\` with a small parent component that renders yours with the given \`props\`, \`attrs\` and \`slots\`. It applies \`global\` options to that app (\`plugins\` → \`app.use\`, \`provide\`, \`components\`, \`directives\`, \`mocks\` for global properties like \`$t\`, \`stubs\`) and mounts it on a detached \`<div>\` (pass \`attachTo: document.body\` when you need focus or document-level behaviour). VTU also records every event your component emits, which is what \`emitted()\` returns.

**Wrappers.** \`wrapper.get('button')\` is essentially \`element.querySelector('button')\` wrapped in a \`DOMWrapper\`; \`findComponent()\` searches the component tree and returns a \`VueWrapper\` with \`.props()\`, \`.emitted()\` and \`.vm\`.

**Why the promises.** A click dispatches a DOM event synchronously, your handler runs and changes state, and Vue *schedules* the re-render. \`trigger()\` resolves after \`nextTick()\`, when that render has flushed. Promises your component starts itself (API calls) are **not** covered by that tick — that's what \`flushPromises()\` is for, covered in [Testing async code, APIs & routing](lesson:testing-async-routing).
`,
      {
        code: `// What trigger() boils down to (simplified, not VTU's source)
async trigger(eventName) {
  if (this.element.disabled) return nextTick() // disabled elements get no event
  this.element.dispatchEvent(new Event(eventName, { bubbles: true }))
  return nextTick() // resolves after Vue flushes its re-render
}`,
        lang: 'js',
        title: 'mental model of trigger()',
        static: true,
      },
      `
**mount vs shallowMount.** \`shallowMount\` is \`mount\` with every child component replaced by a stub (\`<child-stub>\`). Stubs make a test independent of children, but they also hide integration bugs: the parent may pass a wrong prop name and the test still passes. The Vue docs and VTU guide lean towards \`mount\` with selective \`global.stubs\` for heavy or external children.
`,
    ],
    production: `
- **Test the public contract**: props → rendered output, user actions → emitted events and visible changes, slots render where expected. Skip private state (\`wrapper.vm.internalFlag\`) — it changes with every refactor.
- **Choose selectors that survive change.** Prefer what users perceive — roles, labels, text — or dedicated \`data-test\` attributes. Avoid styling classes and tag-structure selectors (\`div > span:nth-child(2)\`).
- **Consider Testing Library.** \`@testing-library/vue\` is built on VTU and only offers user-centric queries (\`getByRole\`, \`getByLabelText\`), which nudges tests towards accessibility and away from implementation details.
- **Centralise global setup.** If every component needs the router, i18n or Pinia, register them once (VTU's \`config.global\` in a Vitest setup file) or write a \`renderWithPlugins()\` helper.
- **Be careful with snapshots.** \`expect(wrapper.html()).toMatchSnapshot()\` catches *any* change, which means reviewers learn to press "update snapshot" without reading. Use small, targeted snapshots — or explicit assertions.
- **Keep component tests next to components** (\`QuantityStepper.test.js\` beside \`QuantityStepper.vue\`) so they move and get deleted together.
`,
  },

  mistakes: [
    {
      title: 'Asserting before Vue re-renders',
      wrong: { code: `wrapper.get('button.inc').trigger('click') // not awaited\nexpect(wrapper.get('.value').text()).toBe('4') // still "3"`, lang: 'js' },
      right: { code: `await wrapper.get('button.inc').trigger('click')\nexpect(wrapper.get('.value').text()).toBe('4')`, lang: 'js' },
      explanation: 'DOM updates are batched to the next tick. `trigger`, `setValue` and `setProps` return a promise for that moment — await it. (Asserting on `emitted()` happens to work without the await because emitting is synchronous, which hides the habit until a DOM assertion fails.)',
    },
    {
      title: 'Testing private state instead of behaviour',
      wrong: { code: `await wrapper.get('form').trigger('submit')\nexpect(wrapper.vm.isSubmitting).toBe(true) // breaks when you rename it`, lang: 'js' },
      right: { code: `await wrapper.get('form').trigger('submit')\nexpect(wrapper.get('button[type=submit]').attributes('disabled')).toBeDefined()\nexpect(wrapper.text()).toContain('Signing in…')`, lang: 'js' },
      explanation: 'Users never see `isSubmitting`; they see a disabled button and a message. Assert on that, and the test survives refactors (a status enum, a composable, Pinia) that keep the behaviour.',
    },
    {
      title: 'Not declaring an event that shares a native name',
      wrong: { code: `<!-- LoginForm.vue: root is <form>, 'submit' not declared -->\n<script setup>\nconst emit = defineEmits([])\n</script>\n<template><form @submit.prevent="emit('submit', data)">…</form></template>`, lang: 'vue' },
      right: { code: `<script setup>\nconst emit = defineEmits(['submit'])\n</script>`, lang: 'vue' },
      explanation: 'An undeclared `@submit` listener from the parent falls through to the root `<form>` as a **native** listener, so the parent\'s handler runs twice — once with the native event, once with your data. Declaring `emits` makes it a component event only. Component tests that check `emitted(\'submit\')` and the parent\'s behaviour catch this.',
    },
    {
      title: 'Reaching for shallowMount by default',
      wrong: { code: `const wrapper = shallowMount(OrderForm)\n// <quantity-stepper-stub> — the real stepper never renders,\n// so a wrong prop name between parent and child goes unnoticed`, lang: 'js' },
      right: { code: `const wrapper = mount(OrderForm, {\n  global: { stubs: { PaymentWidget: true } }, // stub only the heavy/external child\n})`, lang: 'js' },
      explanation: 'Stubbing everything turns component tests into tests of templates in isolation. Mount for real and stub selectively — third-party widgets, things that hit the network, or very expensive children.',
    },
    {
      title: 'Selectors tied to styling or structure',
      wrong: { code: `wrapper.get('div.flex > span.text-sm:nth-child(2)')`, lang: 'js' },
      right: { code: `wrapper.get('[data-test="qty-value"]')\n// or, with Testing Library: getByRole('button', { name: 'Increase Coffee beans' })`, lang: 'js' },
      explanation: 'Utility classes and DOM structure change with every redesign. Roles, labels and `data-test` hooks express intent and stay stable.',
    },
  ],

  debugging: [
    {
      symptom: '`Unable to get button.inc within: <span class="stepper">…`.',
      cause: '`get()` didn\'t find the element: wrong selector, the element is behind a `v-if`, or the DOM hasn\'t updated yet.',
      fix: 'Print `wrapper.html()` to see what actually rendered. Await the interaction that should show it; use `find(...).exists()` when absence is expected.',
    },
    {
      symptom: '`wrapper.emitted(\'update:modelValue\')` is `undefined`.',
      cause: 'The event was never emitted — the handler didn\'t run (element disabled, wrong event name like `\'click\'` vs `\'submit\'`) or the component emits a different name.',
      fix: 'Check the event name exactly (`update:modelValue`, not `update:model-value` in the call), log inside the handler, and make sure the element you triggered is the one with the listener.',
    },
    {
      symptom: '`[Vue warn]: Failed to resolve component: RouterLink` or `injection "Symbol(router)" not found`.',
      cause: 'The component uses something the real app installs globally (router, Pinia, i18n), but the test\'s mini app doesn\'t have it.',
      fix: 'Provide it: `global: { plugins: [router] }`, or stub it: `global: { stubs: { RouterLink: RouterLinkStub } }` (exported by VTU). For Pinia use `createTestingPinia()` — see [testing stores](lesson:testing-logic).',
    },
    {
      symptom: 'An assertion sees the old text even though the click handler clearly ran.',
      cause: 'Missing `await` on `trigger`/`setValue`/`setProps`, or the change happens after a promise (API call) resolves.',
      fix: 'Await every interaction. For component-started promises, `await flushPromises()` from VTU.',
    },
  ],

  bestPractices: [
    'Test a component through its contract: props in, rendered DOM and emitted events out.',
    'Await every `trigger`, `setValue` and `setProps` before asserting on the DOM.',
    'Use `get()` when an element must exist and `find().exists()` to assert absence.',
    'Prefer role/label/text queries or `data-test` attributes over styling classes.',
    'Use `mount` by default; stub only heavy, external or irrelevant children.',
    'Include accessibility attributes (`aria-label`, `aria-pressed`, `disabled`) in your assertions.',
    'Print `wrapper.html()` when a test fails mysteriously — see what actually rendered.',
  ],

  useCases: [
    'Reusable inputs and controls: steppers, toggles, star ratings, date pickers.',
    'Forms: validation messages appear, submit emits the right payload, buttons disable while busy.',
    'Components with `v-model`: emitted `update:modelValue` values and round trips.',
    'Slot-based layout components: content lands in the right slot.',
    'Conditional UI: empty states, error banners and permission-dependent buttons.',
  ],

  whenToUse: {
    use: [
      'Reusable components with a clear props/events contract.',
      'Components with interaction logic: forms, toggles, anything with disabled/enabled states.',
      'Accessibility-relevant behaviour you want to lock in (labels, ARIA states).',
    ],
    avoid: [
      'Re-testing pure logic through the UI when a unit test of the function is simpler.',
      'Asserting on exact HTML or CSS classes that change with design tweaks.',
      'Full multi-page journeys — that\'s what [E2E tests](lesson:e2e-and-quality) are for.',
    ],
  },

  comparison: {
    title: 'Ways to test a component',
    headers: ['', '`mount` (VTU)', '`shallowMount` (VTU)', 'Testing Library `render`', 'E2E (Playwright)'],
    rows: [
      ['Children', 'real', 'stubbed', 'real', 'real'],
      ['Queries', 'any CSS selector, components', 'any CSS selector, components', 'user-centric: role, label, text', 'locators: role, label, text, CSS'],
      ['Access to internals', 'yes (`vm`, `props()`) — use sparingly', 'yes', 'deliberately no', 'no'],
      ['Runs in', 'Vitest + jsdom', 'Vitest + jsdom', 'Vitest + jsdom', 'a real browser'],
      ['Catches parent/child wiring bugs', 'yes', 'no', 'yes', 'yes'],
      ['Speed', 'fast', 'fastest', 'fast', 'slow'],
    ],
    note: 'Testing Library for Vue is built on top of Vue Test Utils — you can mix both in one project.',
  },

  quiz: [
    {
      id: 'component-testing-q1',
      type: 'output',
      prompt: 'The stepper starts at `modelValue: 3`. The test clicks **+** twice (awaiting each click). The test does **not** feed values back with `setProps`. What does `wrapper.emitted(\'update:modelValue\')` contain?',
      code: {
        lang: 'js',
        code: `const wrapper = mount(QuantityStepper, { props: { modelValue: 3 } })
await wrapper.get('button.inc').trigger('click')
await wrapper.get('button.inc').trigger('click')
console.log(wrapper.emitted('update:modelValue'))`,
      },
      options: ['`[[4], [5]]`', '`[[4], [4]]`', '`[4, 5]`', '`undefined`'],
      answer: 1,
      explanation: 'The component never changes its own prop — it emits `modelValue + 1`. Nobody passed the new value back, so `modelValue` is still 3 and both clicks emit 4. Each emit is recorded as an array of its arguments, hence `[[4], [4]]`.',
    },
    {
      id: 'component-testing-q2',
      type: 'mcq',
      prompt: 'Why do you `await wrapper.get(\'button\').trigger(\'click\')`?',
      options: [
        { text: 'Because the click event itself is dispatched asynchronously.', why: 'The DOM event is dispatched synchronously; your handler runs right away.' },
        { text: 'Because Vue applies DOM updates on the next tick, and `trigger` returns a promise that resolves after that.' },
        { text: 'Because otherwise `emitted()` is always empty.', why: 'Emits are recorded synchronously. It\'s the *DOM* that lags behind.' },
        { text: 'Only for buttons inside forms.', why: 'It applies to every interaction that changes rendered output.' },
      ],
      answer: 1,
      explanation: 'Vue batches re-renders. Awaiting the returned promise means your assertions see the updated DOM.',
    },
    {
      id: 'component-testing-q3',
      type: 'bug',
      prompt: 'This test fails with "expected \'Hello, \' to contain \'Ada\'" even though the component works in the browser. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `it('greets the user', async () => {
  const wrapper = mount(Greeting)
  const input = wrapper.get('input')
  input.setValue('Ada')
  expect(wrapper.get('.greeting').text()).toContain('Ada')
})`,
      },
      answerLine: 4,
      explanation: '`setValue` returns a promise for the re-render. Without `await`, the assertion on line 5 reads the DOM before Vue updated it.',
    },
    {
      id: 'component-testing-q4',
      type: 'fill',
      prompt: 'Complete the test: pass a prop, click, and read the emitted event.',
      code: {
        lang: 'js',
        code: `const wrapper = mount(StarRating, { ___: { modelValue: 2 } })
await wrapper.findAll('.star')[3].___('click')
expect(wrapper.___('update:modelValue')).toEqual([[4]])`,
      },
      answer: [['props'], ['trigger'], ['emitted']],
      explanation: 'Mounting options take `props`; `trigger(\'click\')` dispatches the event; `emitted(name)` returns the recorded argument lists.',
    },
    {
      id: 'component-testing-q5',
      type: 'mcq',
      prompt: '`OrderForm` renders `<QuantityStepper :model-value="qty" />` but the stepper\'s prop was renamed to `value`. Which test would catch this?',
      options: [
        { text: 'A `shallowMount(OrderForm)` test that checks a `<quantity-stepper-stub>` exists', why: 'The stub renders regardless of which props are passed, so the broken wiring is invisible.' },
        { text: 'A `mount(OrderForm)` test that checks the displayed quantity after clicking +' },
        { text: 'A unit test of the stepper\'s `increase()` function alone', why: 'It tests the child in isolation and never sees what the parent passes.' },
        { text: 'A snapshot of `QuantityStepper` on its own', why: 'Same problem: the child alone looks fine.' },
      ],
      answer: 1,
      explanation: 'Only a test that renders parent and real child together, and checks visible behaviour, notices that the prop no longer arrives.',
    },
    {
      id: 'component-testing-q6',
      type: 'mcq',
      prompt: 'Select **all** selectors that are likely to survive a redesign.',
      options: [
        { text: '`[data-test="checkout-button"]`' },
        { text: '`div.mt-4 > button.bg-blue-500`', why: 'Utility classes and nesting change with styling.' },
        { text: 'The button\'s role and accessible name ("Place order")' },
        { text: '`button:nth-child(3)`', why: 'Adding one button before it breaks the test.' },
      ],
      answer: [0, 2],
      explanation: '`data-test` hooks exist only for tests, and roles/names reflect what users perceive. Both change only when behaviour changes.',
    },
    {
      id: 'component-testing-q7',
      type: 'short',
      prompt: 'What is a component\'s "public contract", and why should component tests stick to it?',
      answer: 'It\'s what the outside world can rely on: the props it accepts, the slots it renders, the DOM users see and interact with, and the events it emits. Tests that only use that contract keep passing when the internals are refactored, and fail only when behaviour that callers or users depend on actually changes.',
    },
  ],

  exercises: [
    {
      id: 'star-rating',
      title: 'Build a test-proof StarRating',
      difficulty: 'intermediate',
      prompt: `
Finish **StarRating.vue** so it passes its component tests. They mount it on its own with \`mountFile('StarRating.vue', props)\`.

- Props: \`modelValue\` (Number, default \`0\`) and \`max\` (Number, default \`5\`).
- Render **one \`<button class="star">\` per possible star** (\`max\` of them).
- Each star has \`aria-pressed="true"\` if its number is ≤ \`modelValue\`, otherwise \`"false"\`, and an \`aria-label\` like **"3 stars"**.
- Clicking star *n* emits \`update:modelValue\` with *n*. **Declare** the event with \`defineEmits\` (the harness only records declared events).
`,
      files: {
        'App.vue': ratingApp,
        'StarRating.vue': `<script setup>
defineProps({
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
})
// TODO: declare and emit update:modelValue
</script>

<template>
  <div class="rating">
    <!-- TODO: one <button class="star"> per possible star -->
  </div>
</template>`,
      },
      hints: [
        '`v-for="n in max"` loops from 1 to `max` — perfect for star numbers.',
        'Bind `:aria-pressed="n <= modelValue"` and `:aria-label="n + \' stars\'"` on each button.',
        'Store `const emit = defineEmits([\'update:modelValue\'])` and use `@click="emit(\'update:modelValue\', n)"`.',
      ],
      solution: {
        explanation: 'The component owns no state: the parent\'s `v-model` holds the rating, the component renders it and *requests* changes by emitting. `aria-pressed` turns each star into a toggle button that assistive technology can announce, and it doubles as a stable, meaningful thing for tests to assert on.',
        files: {
          'App.vue': ratingApp,
          'StarRating.vue': `<script setup>
defineProps({
  modelValue: { type: Number, default: 0 },
  max: { type: Number, default: 5 },
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="rating">
    <button
      v-for="n in max"
      :key="n"
      class="star"
      type="button"
      :aria-pressed="n <= modelValue"
      :aria-label="n + ' stars'"
      @click="emit('update:modelValue', n)"
    >
      {{ n <= modelValue ? '★' : '☆' }}
    </button>
  </div>
</template>`,
        },
      },
      tests: [
        {
          name: 'renders 5 stars by default and max stars when given',
          code: `const a = mountFile('StarRating.vue', { modelValue: 0 })
expect(a.el.querySelectorAll('.star')).toHaveLength(5)
const b = mountFile('StarRating.vue', { modelValue: 0, max: 10 })
expect(b.el.querySelectorAll('.star')).toHaveLength(10)`,
        },
        {
          name: 'aria-pressed and aria-label reflect the value',
          code: `const w = mountFile('StarRating.vue', { modelValue: 3 })
const stars = [...w.el.querySelectorAll('.star')]
expect(stars.map((s) => s.getAttribute('aria-pressed'))).toEqual(['true', 'true', 'true', 'false', 'false'])
expect(stars[1].getAttribute('aria-label')).toBe('2 stars')`,
        },
        {
          name: 'clicking star 4 emits update:modelValue with 4',
          code: `const w = mountFile('StarRating.vue', { modelValue: 2 })
await click(w.el.querySelectorAll('.star')[3])
expect(w.emitted('update:modelValue')).toEqual([[4]])`,
        },
        {
          name: 'works with v-model in the app',
          code: `await click(findAll('.star')[4])
expect(text('.rating-text')).toBe('You rated it 5 / 5')`,
        },
      ],
    },
    {
      id: 'login-form',
      title: 'A LoginForm that emits the right thing',
      difficulty: 'intermediate',
      prompt: `
Fix **LoginForm.vue** so it passes these component tests:

- It declares and emits **\`submit\`** with **one object** \`{ email, password }\` — but **only** when the email contains \`@\` and the password has at least **8** characters.
- When invalid, it emits nothing and shows a \`<p class="error">\` with a message. The error disappears after a valid submit.
- Prop \`busy\` (Boolean, default \`false\`): while true, the submit button (\`button[type="submit"]\`) is disabled and reads **"Signing in…"**.

Keep the classes: \`.email\` and \`.password\` inputs inside a \`<form>\`.
`,
      files: {
        'App.vue': loginApp,
        'LoginForm.vue': `<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])
const email = ref('')
const password = ref('')

function onSubmit() {
  emit('submit', email.value, password.value)
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <label>Email <input v-model="email" class="email" type="email" /></label>
    <label>Password <input v-model="password" class="password" type="password" /></label>
    <button type="submit">Sign in</button>
  </form>
</template>`,
      },
      hints: [
        'The tests expect `emitted(\'submit\')` to equal `[[{ email, password }]]` — one argument, an object.',
        'Add an `error` ref. In `onSubmit`, set it and `return` early when the email lacks `@` or the password is shorter than 8; otherwise clear it and emit.',
        'Declare `const props = defineProps({ busy: { type: Boolean, default: false } })`, then `:disabled="busy"` and `{{ busy ? \'Signing in…\' : \'Sign in\' }}` on the button.',
      ],
      solution: {
        explanation: 'The form validates before it emits, so the parent only ever receives well-formed credentials, in one object that is easy to extend. `busy` is controlled by the parent (it knows when the request is in flight), which keeps the form reusable. Every assertion targets the contract: emitted payloads, the visible error and the disabled button.',
        files: {
          'App.vue': loginApp,
          'LoginForm.vue': `<script setup>
import { ref } from 'vue'

defineProps({ busy: { type: Boolean, default: false } })
const emit = defineEmits(['submit'])
const email = ref('')
const password = ref('')
const error = ref('')

function onSubmit() {
  if (!email.value.includes('@')) {
    error.value = 'Please enter a valid email address.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'The password needs at least 8 characters.'
    return
  }
  error.value = ''
  emit('submit', { email: email.value, password: password.value })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <label>Email <input v-model="email" class="email" type="email" /></label>
    <label>Password <input v-model="password" class="password" type="password" /></label>
    <p v-if="error" class="error">{{ error }}</p>
    <button type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
  </form>
</template>`,
        },
      },
      tests: [
        {
          name: 'valid input emits submit with one { email, password } object',
          code: `const w = mountFile('LoginForm.vue')
await type(w.find('.email'), 'ada@example.com')
await type(w.find('.password'), 'correct-horse')
await submit(w.find('form'))
expect(w.emitted('submit')).toEqual([[{ email: 'ada@example.com', password: 'correct-horse' }]])
expect(w.find('.error')).toBeNull()`,
        },
        {
          name: 'invalid input shows an error and emits nothing',
          code: `const w = mountFile('LoginForm.vue')
await type(w.find('.email'), 'ada')
await type(w.find('.password'), 'short')
await submit(w.find('form'))
expect(w.emitted('submit')).toHaveLength(0)
expect(w.find('.error')).toBeTruthy()`,
        },
        {
          name: 'a short password alone is rejected, and the error clears once valid',
          code: `const w = mountFile('LoginForm.vue')
await type(w.find('.email'), 'ada@example.com')
await type(w.find('.password'), '1234567')
await submit(w.find('form'))
expect(w.emitted('submit')).toHaveLength(0)
expect(w.find('.error')).toBeTruthy()
await type(w.find('.password'), '12345678')
await submit(w.find('form'))
expect(w.emitted('submit')).toHaveLength(1)
expect(w.find('.error')).toBeNull()`,
        },
        {
          name: 'busy disables the button and changes its label',
          code: `const w = mountFile('LoginForm.vue', { busy: true })
const button = w.find('button[type="submit"]')
expect(button.disabled).toBe(true)
expect(button.textContent.trim()).toBe('Signing in…')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'component-testing-how-to',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you test a Vue component?',
      answer: 'Mount it with Vue Test Utils (or Testing Library) inside Vitest with a DOM environment, passing the props and global plugins it needs. Interact like a user — `trigger(\'click\')`, `setValue()` — awaiting each interaction so Vue re-renders. Then assert on the public contract: rendered text and attributes, and events from `emitted()`. Mock external dependencies such as API calls; don\'t assert on private state.',
      explanation: 'Mount → interact → await → assert, through props, DOM and events only.',
      code: {
        lang: 'js',
        code: `it('emits the next value on +', async () => {
  const wrapper = mount(QuantityStepper, { props: { modelValue: 3 } })
  await wrapper.get('button.inc').trigger('click')
  expect(wrapper.emitted('update:modelValue')).toEqual([[4]])
})`,
      },
      whyAsked: 'The most common Vue testing question; it reveals whether you\'ve actually written component tests and whether you test behaviour or internals.',
      mistakes: ['Describing only snapshot tests.', 'Asserting on `wrapper.vm` internals.', 'Forgetting to mention awaiting DOM updates.', 'Not mentioning how to deal with router/Pinia/API dependencies.'],
      followUps: ['How do you test `v-model` on a component?', 'When would you use `shallowMount`?', 'How do you test a component that fetches data on mount?'],
      modelAnswer: 'I use Vue Test Utils in Vitest with jsdom. I mount the component with the props it needs and any global plugins, like the router or a testing Pinia. Then I interact the way a user would — trigger clicks, set input values — and await each interaction, because Vue updates the DOM on the next tick. My assertions target the public contract: the rendered text and attributes, including accessibility ones, and the events from `emitted()`. Network calls are mocked so the test is fast and deterministic, and I avoid reaching into `wrapper.vm` so refactors don\'t break tests.',
    },
    {
      id: 'component-testing-mount-vs-shallow',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `mount` and `shallowMount`, and which do you default to?',
      answer: '`mount` renders the component and all its real children; `shallowMount` replaces every child component with a stub. Shallow tests are isolated and fast but miss integration bugs between parent and child and couple tests to the component tree. Default to `mount` and stub selectively with `global.stubs` for heavy, external or network-bound children.',
      explanation: 'Isolation vs realism: stubbing everything means you never test how pieces fit together.',
      whyAsked: 'A classic VTU question that reveals testing philosophy.',
      mistakes: ['Saying shallowMount is "the unit test way" and therefore always better.', 'Not knowing you can stub individual components with `global.stubs`.', 'Claiming shallowMount is needed for speed in normal apps.'],
      followUps: ['When is stubbing a child the right call?', 'What does a stubbed child render?', 'How does Testing Library handle this?'],
      modelAnswer: '`mount` renders the real child components; `shallowMount` swaps all of them for stubs. Shallow mounting isolates the component, but it hides wiring bugs — if the parent passes a prop under the wrong name, the stub doesn\'t care and the test passes. It also ties tests to which child components exist. I default to `mount` and stub only specific children through `global.stubs`, like a third-party chart, a payment widget or something that hits the network.',
    },
    {
      id: 'component-testing-await-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What does this test print, and why?',
      code: {
        lang: 'js',
        code: `// Counter.vue renders <p class="n">{{ n }}</p> and a button that does n++
const wrapper = mount(Counter)
wrapper.get('button').trigger('click')
console.log(wrapper.get('.n').text())
await wrapper.vm.$nextTick()
console.log(wrapper.get('.n').text())`,
      },
      options: ['`1` then `1`', '`0` then `1`', '`0` then `0`', 'It throws because trigger was not awaited'],
      correctOption: 1,
      answer: '`0` then `1`. The click handler runs synchronously and sets `n` to 1, but Vue re-renders on the next tick, so the first read sees the old DOM. After awaiting `nextTick`, the DOM shows 1. Awaiting `trigger()` itself does the same thing.',
      explanation: 'State changes immediately; the DOM catches up asynchronously.',
      whyAsked: 'Distinguishes people who understand Vue\'s async rendering from those who copy `await` by habit.',
      mistakes: ['Thinking the handler itself is async.', 'Believing `trigger` without await throws.', 'Not knowing what `trigger` returns.'],
      followUps: ['What would `wrapper.vm.n` be after the first line?', 'When is `nextTick` not enough? (`flushPromises`)', 'Why does Vue batch updates?'],
      modelAnswer: 'It prints 0 and then 1. Dispatching the click runs the handler synchronously, so the reactive state is already 1, but Vue batches DOM updates and flushes them on the next tick. The first `text()` call reads the stale DOM; after awaiting `nextTick` the patch has been applied. That\'s exactly why `trigger` returns a promise and why I always await it. For updates that wait on other promises, like API calls, I\'d use `flushPromises` instead.',
    },
    {
      id: 'component-testing-implementation-details',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate refactored a form from three boolean refs to one `status` value. Nothing changed for users, but 14 component tests failed. What went wrong with the tests, and how would you rewrite them?',
      answer: 'The tests were coupled to implementation details — they read `wrapper.vm.isLoading` or set internal refs directly. Rewrite them to drive the component through its contract (props, user events, mocked API responses) and assert what users see: the disabled button, the spinner text, the error message, the emitted events.',
      explanation: 'A refactor that doesn\'t change behaviour should never break tests; when it does, the tests are measuring the wrong thing.',
      whyAsked: 'Brittle test suites are a major real-world cost; this checks you know how to prevent them.',
      mistakes: ['Blaming the refactor.', 'Updating the tests to read the new `status` ref (repeats the problem).', 'Deleting the tests without replacement.'],
      followUps: ['Is reading `wrapper.vm` ever OK?', 'How do you test a loading state without reaching into internals?', 'How does Testing Library prevent this?'],
      modelAnswer: 'The tests were checking how the component worked instead of what it did — reading `wrapper.vm.isLoading` and friends. When the internals changed, the tests broke even though behaviour didn\'t, which is the definition of a brittle test. I\'d rewrite them to set up the situation through the contract — props, user interaction and a mocked API that I can resolve or reject — and assert on visible outcomes: the button is disabled, "Saving…" appears, the error message shows, the right event is emitted. Testing Library makes this the default because it doesn\'t expose internals at all.',
    },
    {
      id: 'component-testing-selectors',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 3,
      question: 'Your team keeps breaking component tests with CSS changes. What selector strategy would you put in your testing guidelines?',
      answer: 'Prefer what users perceive: roles with accessible names, label text, visible text (Testing Library queries make this natural). Where that\'s awkward, add dedicated `data-test` attributes. Ban styling classes, tag-structure and `nth-child` selectors in tests. Optionally strip `data-test` attributes from production builds if you care about the bytes.',
      explanation: 'Selectors should change only when behaviour changes.',
      whyAsked: 'Shows maturity in maintaining a test suite over time.',
      mistakes: ['Using CSS classes from a utility framework.', 'Using ids that are also used for styling.', 'Ignoring the accessibility benefit of role-based queries.'],
      followUps: ['Why do role-based queries improve accessibility?', 'How would you enforce the rule? (lint rules)', 'Do the same rules apply to E2E tests?'],
      modelAnswer: 'I\'d say: query the way a user perceives the page first — by role and accessible name, by label, by visible text. That\'s stable and doubles as an accessibility check, because if a test can\'t find "the Increase button" by name, neither can a screen reader. When there\'s no good semantic handle, use a `data-test` attribute that exists only for tests. Styling classes, DOM structure and nth-child selectors are off-limits. The same guidelines carry over to Playwright locators.',
    },
    {
      id: 'component-testing-toggle',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement **ToggleSwitch.vue** to pass its component tests: a `<button class="switch">` with `role="switch"`, `aria-checked` reflecting the `modelValue` prop, the `label` prop as its text, and a click that emits `update:modelValue` with the opposite value — unless the `disabled` prop is true (then the button is disabled and nothing is emitted).',
      starter: {
        files: {
          'App.vue': toggleApp,
          'ToggleSwitch.vue': `<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <button class="switch">{{ label }}</button>
</template>`,
        },
      },
      tests: [
        { name: 'role and aria-checked reflect modelValue', code: `const on = mountFile('ToggleSwitch.vue', { label: 'Dark mode', modelValue: true })\nexpect(on.find('.switch').getAttribute('role')).toBe('switch')\nexpect(on.find('.switch').getAttribute('aria-checked')).toBe('true')\nconst off = mountFile('ToggleSwitch.vue', { label: 'Dark mode', modelValue: false })\nexpect(off.find('.switch').getAttribute('aria-checked')).toBe('false')` },
        { name: 'click emits the opposite value', code: `const w = mountFile('ToggleSwitch.vue', { label: 'Dark mode', modelValue: false })\nawait click(w.find('.switch'))\nexpect(w.emitted('update:modelValue')).toEqual([[true]])` },
        { name: 'disabled: the button is disabled and never emits', code: `const w = mountFile('ToggleSwitch.vue', { label: 'Dark mode', disabled: true })\nconst btn = w.find('.switch')\nexpect(btn.disabled).toBe(true)\nbtn.disabled = false\nawait click(btn)\nexpect(w.emitted('update:modelValue')).toHaveLength(0)` },
        { name: 'works with v-model in the app', code: `await click('.switch')\nexpect(text('.mode')).toBe('Dark theme')` },
      ],
      hints: ['Keep the props in a variable: `const props = defineProps(...)` and `const emit = defineEmits(...)`.', 'Bind `role="switch"`, `:aria-checked="modelValue"` and `:disabled="disabled"` on the button.', 'In the click handler, `return` early when `props.disabled`, otherwise `emit(\'update:modelValue\', !props.modelValue)`.'],
      answer: 'Bind role, aria-checked and disabled from props; on click, guard on `disabled` and emit the negated `modelValue`.',
      solution: {
        files: {
          'App.vue': toggleApp,
          'ToggleSwitch.vue': `<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

function toggle() {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    class="switch"
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    @click="toggle"
  >
    {{ label }}
  </button>
</template>`,
        },
      },
      explanation: 'The component is controlled: it renders what the parent gives it and requests changes through an event. The tests check exactly that contract plus the accessibility state, and force a click on the disabled button to prove the guard.',
      whyAsked: 'A small, realistic task that shows whether you think in props/events and accessibility, and can read tests as a spec.',
      mistakes: ['Keeping an internal `checked` ref that drifts from `modelValue`.', 'Mutating the prop directly.', 'Relying only on the `disabled` attribute without a guard.', 'Forgetting `role="switch"` / `aria-checked`.'],
      followUps: ['How would you write these tests with VTU?', 'Would you use `defineModel()` (Vue 3.4+) here?', 'How would you support keyboard users?'],
      modelAnswer: 'I\'d make it a controlled component: `modelValue` in, `update:modelValue` out. The button gets `role="switch"` and `aria-checked` bound to the prop so assistive tech announces its state, plus `:disabled`. The click handler returns early when disabled and otherwise emits the negated value. In VTU I\'d test it by mounting with props, triggering a click and checking `emitted`, plus the ARIA attributes. With Vue 3.4+ I could use `defineModel()` to shorten it, and a native button already gives me keyboard support.',
    },
    {
      id: 'component-testing-global-deps',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'Mounting `UserMenu.vue` in a test prints `[Vue warn]: Failed to resolve component: RouterLink` and then fails with `injection "Symbol(pinia)" not found`-style errors. The component works in the app. What\'s going on and how do you fix it?',
      answer: 'In the app, `main.js` installs the router and Pinia globally; `mount()` creates a fresh mini app without them. Provide what the component needs through mounting options: `global: { plugins: [router, createTestingPinia()] }`, or stub what you don\'t care about (`global: { stubs: { RouterLink: RouterLinkStub } }`). If many tests need the same setup, put it in a shared helper or VTU\'s `config.global` in the Vitest setup file.',
      explanation: 'Every `mount` is a brand-new app: global plugins, components and provides must be supplied again.',
      code: {
        lang: 'js',
        code: `import { mount, RouterLinkStub } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { vi } from 'vitest'

const wrapper = mount(UserMenu, {
  global: {
    plugins: [createTestingPinia({ createSpy: vi.fn })],
    stubs: { RouterLink: RouterLinkStub },
  },
})`,
      },
      whyAsked: 'Everyone hits this the first week of testing a real app; the fix shows you understand what `mount` actually creates.',
      mistakes: ['Importing `main.js` into the test.', 'Mocking every import by hand instead of using plugins/stubs.', 'Using the real Pinia store with real API calls in a component test.'],
      followUps: ['When would you use a real router instead of a stub?', 'What does `createTestingPinia` do to actions?', 'How would you share this setup across tests?'],
      modelAnswer: 'The test\'s `mount` creates a brand-new app, so nothing from `main.js` is installed — no router, no Pinia. I\'d pass them through mounting options: `global.plugins` with `createTestingPinia()` for the store, and either a real memory-history router or a `RouterLinkStub` if I only need links to render. If lots of tests need it, I wrap `mount` in a `renderWithPlugins` helper or set `config.global` in the Vitest setup file. The key is to supply each dependency deliberately rather than booting the whole app.',
    },
  ],

  takeaways: [
    'A component test mounts one component, interacts like a user and asserts on its public contract: props → DOM and emitted events.',
    'Vue Test Utils: `mount`/`shallowMount`, `get`/`find`/`findAll`/`findComponent`, `trigger`, `setValue`, `setProps`, `emitted`, `text`, `attributes`.',
    'Await `trigger`, `setValue` and `setProps` — Vue updates the DOM on the next tick.',
    'Test v-model via `emitted(\'update:modelValue\')` or a round trip with an `onUpdate:modelValue` listener.',
    'Default to `mount`; stub selectively. Supply router/Pinia/plugins through `global`.',
    'Use stable selectors (roles, labels, `data-test`) and never assert on private state.',
  ],
}
