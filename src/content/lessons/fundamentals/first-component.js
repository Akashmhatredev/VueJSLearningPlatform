// Lesson: your first component (Level 2 capstone, bridge to Level 4).

const likeButton = `<script setup>
import { ref } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
})

const likes = ref(0)
</script>

<template>
  <button class="like" @click="likes++">
    ♥ {{ label }}: {{ likes }}
  </button>
</template>`

const appFile = `<script setup>
import LikeButton from './LikeButton.vue'
</script>

<template>
  <h2>What do you like?</h2>
  <LikeButton label="Cats" />
  <LikeButton label="Dogs" />
</template>`

export default {
  id: 'first-component',
  title: 'Your first component',
  summary: 'Package a piece of UI into its own file, reuse it as many times as you like, and customise each copy with props.',
  difficulty: 'beginner',
  minutes: 24,
  prerequisites: ['single-file-components', 'template-syntax'],
  related: ['why-components', 'props', 'emits', 'slots'],
  tags: ['components', 'reuse', 'import', 'defineProps', 'instances', 'PascalCase'],
  apis: [
    { name: 'defineProps()', summary: 'Declares the inputs (props) a <script setup> component accepts.' },
    { name: '<MyComponent />', summary: 'Using an imported component in a template, like a custom HTML tag.' },
  ],
  docs: [
    { label: 'Vue Guide — Components Basics', url: 'https://vuejs.org/guide/essentials/component-basics.html' },
    { label: 'Vue Guide — Component Registration', url: 'https://vuejs.org/guide/components/registration.html' },
  ],

  intro: `
A **component** is a reusable piece of interface with its own template, logic and styles — a custom HTML tag that you invent. A like button, a product card, a navigation bar: each can be a component.

So far you've written everything in one \`App.vue\`. In this lesson you'll pull a piece out into its own file, then use it **several times**, each copy with its own label and its own state.
`,

  why: `
Imagine a shop page with 40 product cards. Without components you'd copy the same 15 lines of HTML 40 times. Fix a typo in the price layout? Fix it 40 times.

Components solve three problems at once:

- **Reuse** — write the card once, use it everywhere.
- **Focus** — each file does one job, so it's small enough to understand.
- **Isolation** — each copy (an *instance*) keeps its own state, so liking one product doesn't like all of them.
`,

  eli15: `
Think of a component as a **cookie cutter**. You design the shape once (\`LikeButton.vue\`). Then you press out as many cookies as you want (\`<LikeButton />\`, \`<LikeButton />\`…).

Every cookie is separate: if you take a bite out of one, the others stay whole. In Vue terms, each copy has its **own** \`likes\` counter.

And you can decorate each cookie differently — that's what **props** are: little settings you pass in, like \`label="Cats"\` or \`label="Dogs"\`.
`,

  analogy: {
    title: 'The cookie cutter',
    body: `
A baker doesn't sculpt every cookie by hand — they design one cutter and stamp out a tray. Sprinkles can be different on each cookie, but the shape is the same, and eating one doesn't affect the others.

A Vue component works the same way: one definition, many independent instances, each configured with its own props.
`,
    mapping: [
      ['the cookie cutter', 'the component file (`LikeButton.vue`)'],
      ['each stamped cookie', 'an instance (`<LikeButton />` in a template)'],
      ['different sprinkles', 'props (`label="Cats"`)'],
      ['a bite out of one cookie', "that instance's own state (`likes`) changing"],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'One definition, many instances',
    props: {
      nodes: [
        { id: 'def', label: 'LikeButton.vue', note: 'the definition', tone: 'kraft', x: 380, y: 60 },
        { id: 'a', label: '<LikeButton label="Cats" />', note: 'likes = 2', tone: 'acid', x: 130, y: 230 },
        { id: 'b', label: '<LikeButton label="Dogs" />', note: 'likes = 0', x: 380, y: 230 },
        { id: 'c', label: '<LikeButton label="Pizza" />', note: 'likes = 5', x: 630, y: 230 },
      ],
      edges: [
        { from: 'def', to: 'a', label: 'instance' },
        { from: 'def', to: 'b', label: 'instance' },
        { from: 'def', to: 'c', label: 'instance' },
      ],
      steps: [
        { focus: ['def'], text: 'You write the component **once**: template, script and styles in `LikeButton.vue`.' },
        { focus: ['a', 'b', 'c'], edges: ['def->a', 'def->b', 'def->c'], text: 'Every `<LikeButton />` in a template creates a separate **instance**.' },
        { focus: ['a'], text: 'Each instance gets its own copy of the state: clicking Cats changes only Cats’ `likes`.' },
        { focus: ['a', 'b', 'c'], text: 'Props (`label`) let the parent customise each instance without changing the component.' },
      ],
    },
    alt: 'A diagram with LikeButton.vue at the top and three instances below it labelled Cats, Dogs and Pizza, each showing its own likes count, connected by arrows labelled instance.',
  },

  syntax: [
    `
**1. Create the component** in its own \`.vue\` file. Name it in **PascalCase** with at least two words (\`LikeButton\`, not \`Button\`), so it can't clash with real HTML tags.
`,
    { code: likeButton, lang: 'vue', title: 'LikeButton.vue' },
    `
**2. Import it** in the parent. With \`<script setup>\`, an imported component is automatically available in the template — no extra registration step.

**3. Use it** like an HTML tag, passing props as attributes:
`,
    { code: appFile, lang: 'vue', title: 'App.vue' },
    `
**The rules:**

- One component per file; the file name is the component name.
- Use PascalCase in templates (\`<LikeButton />\`); \`<like-button>\` also works in SFC templates, but pick one style and stick to it.
- Self-closing tags (\`<LikeButton />\`) are fine inside SFC templates.
- A string prop can be passed as plain text (\`label="Cats"\`); anything else needs \`:\` (\`:count="3"\`, \`:done="true"\`).
`,
    {
      callout: 'note',
      text: 'There is also *global* registration (`app.component(\'LikeButton\', LikeButton)`), which makes a component available everywhere without importing. Local imports are usually better: they make dependencies explicit and let bundlers drop unused code. More in [Why components?](lesson:why-components).',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: appFile,
    intro: 'The parent side is short — walk through it, then open `LikeButton.vue` in the playground below.',
    steps: [
      { lines: [2], text: '`import LikeButton from \'./LikeButton.vue\'` pulls in the component. In `<script setup>` the import is all the registration you need.' },
      { lines: [6], text: '`<LikeButton label="Cats" />` creates the **first instance** and passes it the prop `label` with the value `"Cats"`.' },
      { lines: [7], text: 'A **second, independent instance** with a different label. It runs the component’s setup again, so it gets its own `likes` ref.' },
      { lines: [5], text: 'Parents can mix normal HTML with components freely — components are just more tags.' },
    ],
  },

  playground: {
    title: 'Like buttons',
    objective: 'Reuse one component several times and see that each instance keeps its own state.',
    files: { 'App.vue': appFile, 'LikeButton.vue': likeButton },
    expected: 'Two buttons, **♥ Cats: 0** and **♥ Dogs: 0**. Clicking one only increases its own count.',
    experiments: [
      {
        id: 'third',
        task: 'Add a third like button for **Pizza**.',
        hint: 'Copy one of the `<LikeButton … />` lines in `App.vue` and change the `label`.',
        tests: [{ name: 'a Pizza button exists', code: `expect(findAll('.like').some((b) => b.textContent.includes('Pizza'))).toBe(true)` }],
        explain: 'Three tags, three instances — and you did not touch `LikeButton.vue` at all. That is reuse.',
      },
      {
        id: 'independent',
        task: 'Click **Cats** three times. Look at Dogs. Why didn’t it change?',
        hint: 'Where is `likes` created? How many times does that line run?',
        explain: '`const likes = ref(0)` runs once **per instance**, so every button owns a separate ref.',
      },
      {
        id: 'prop-type',
        task: 'Give `LikeButton` a second prop, `start` (a Number), and make `likes` start at it. Then use `:start="10"` on the Dogs button.',
        hint: 'Add `start: { type: Number, default: 0 }` to `defineProps`, then `const likes = ref(props.start)`. Numbers need the colon: `:start="10"`.',
        tests: [
          {
            name: 'Dogs starts at 10, Cats still at 0',
            code: `const dogs = findAll('.like').find((b) => b.textContent.includes('Dogs'))
const cats = findAll('.like').find((b) => b.textContent.includes('Cats'))
expect(dogs.textContent).toContain('10')
expect(cats.textContent).toContain(': 0')`,
          },
        ],
        explain: 'Props are the component’s settings. Without the colon, `start="10"` would pass the *string* "10".',
      },
      {
        id: 'total',
        task: 'Stretch: show a total of all likes in `App.vue`. Make `LikeButton` call `emit(\'liked\')` on click and listen with `@liked="total++"`.',
        hint: 'In LikeButton: `const emit = defineEmits([\'liked\'])` and `@click="likes++; emit(\'liked\')"`. In App: `const total = ref(0)` and `<p class="total">Total: {{ total }}</p>`.',
        tests: [
          {
            name: 'clicking two different buttons gives a total of 2',
            code: `const buttons = findAll('.like')
await click(buttons[0])
await click(buttons[1])
expect(text('.total')).toContain('2')`,
          },
        ],
        explain: 'Props go **down** from parent to child; events go **up**. You will master both in [Props](lesson:props) and [Emits](lesson:emits).',
      },
    ],
  },

  animation: {
    type: 'component-flow',
    props: { mode: 'props' },
    title: 'Props flow from parent to child',
    caption: 'The parent owns the data and hands it down; the child receives it read-only.',
    alt: 'A parent box with a count and a button above a child box. Clicking the parent button sends a packet labelled :count down to the child, which displays the new value; the child trying to change the prop is refused.',
  },

  internals: {
    beginner: `
When Vue renders \`<LikeButton label="Cats" />\`, it creates a little object for that instance, runs the component's \`<script setup>\` for it (so it gets its own \`likes\`), and renders its template into the page. Do it twice and you get two objects, two \`likes\`, two buttons.
`,
    technical: `
A \`.vue\` file compiles to a **component definition**: an object with a \`setup()\` function (from \`<script setup>\`), a \`render\` function (from \`<template>\`) and metadata like declared \`props\`.

In the parent's render function, \`<LikeButton label="Cats" />\` becomes a call like \`createVNode(LikeButton, { label: 'Cats' })\` — a **virtual node** describing "an instance of this component with these props". When Vue mounts that vnode it creates a **component instance**, resolves its props, calls \`setup()\` for that instance only, and runs its render function inside its own reactive effect. That's why state is per instance and why a change in one instance only re-renders that instance.
`,
    production: `
- Keep components focused: if a component grows past one screen of template or mixes unrelated concerns, split it.
- Prefer local imports over global registration so dependencies are visible and unused components are tree-shaken.
- Use multi-word PascalCase names (\`ProductCard\`, \`AppHeader\`) — Vue's style guide recommends it and linters enforce it.
- Distinguish generic, reusable components (\`BaseButton\`) from feature-specific ones (\`CheckoutSummary\`) in your folder structure — see [project structure](lesson:project-structure).
`,
  },

  mistakes: [
    {
      title: 'Using a component without importing it',
      wrong: { code: `<script setup>\n// forgot the import\n</script>\n\n<template>\n  <LikeButton label="Cats" />\n</template>`, lang: 'vue' },
      right: { code: `<script setup>\nimport LikeButton from './LikeButton.vue'\n</script>\n\n<template>\n  <LikeButton label="Cats" />\n</template>`, lang: 'vue' },
      explanation: 'Vue warns `Failed to resolve component: LikeButton` and renders an unknown `<likebutton>` element. With `<script setup>`, the import itself is the registration.',
    },
    {
      title: 'Passing numbers or booleans without the colon',
      wrong: { code: `<LikeButton label="Dogs" start="10" />`, lang: 'vue' },
      right: { code: `<LikeButton label="Dogs" :start="10" />`, lang: 'vue' },
      explanation: 'Without `:`, every attribute value is a plain string, so the prop receives `"10"` and Vue warns about the type. The colon (`v-bind`) evaluates `10` as JavaScript.',
    },
    {
      title: 'Single-word component names',
      wrong: { code: `// Button.vue, Card.vue, Header.vue`, lang: 'js' },
      right: { code: `// BaseButton.vue, ProductCard.vue, AppHeader.vue`, lang: 'js' },
      explanation: 'Single-word names can collide with current or future HTML elements (`<header>`, `<button>`). Multi-word names avoid that and read better.',
    },
  ],

  debugging: [
    {
      symptom: '[Vue warn]: Failed to resolve component: LikeButton',
      cause: 'The component is used in the template but was never imported (or the import name differs from the tag).',
      fix: 'Add `import LikeButton from \'./LikeButton.vue\'` and make sure the tag name matches the imported name.',
    },
    {
      symptom: 'Clicking one instance changes all of them.',
      cause: 'The state was created outside the component (in a shared module), so every instance reads the same ref.',
      fix: 'Create per-instance state inside `<script setup>`. Share state on purpose only — with a store or a shared composable.',
    },
    {
      symptom: '[Vue warn]: Invalid prop: type check failed for prop "start". Expected Number, got String.',
      cause: 'A number was passed as a plain attribute (`start="10"`).',
      fix: 'Bind it: `:start="10"`.',
    },
  ],

  bestPractices: [
    'One component per file, named in multi-word PascalCase.',
    'Import components locally where they are used.',
    'Give each component one clear job; split when it starts doing two.',
    'Declare props explicitly with types (and defaults where sensible) — they are the component’s public API.',
    'Keep state inside the component unless several components truly need to share it.',
  ],

  useCases: [
    'Repeated UI: product cards, list rows, comment items, avatars.',
    'Layout pieces: `AppHeader`, `AppFooter`, `SideNav`.',
    'Design-system building blocks: `BaseButton`, `BaseInput`, `BaseModal`.',
    'Splitting a big page into readable sections: `CheckoutAddress`, `CheckoutPayment`.',
  ],

  whenToUse: {
    use: [
      'The same markup appears more than once.',
      'A section of a page has its own state or behaviour.',
      'A file has grown hard to read and has natural sections.',
    ],
    avoid: [
      'A tiny one-off snippet that is clearer inline — abstraction has a cost.',
      'Splitting so finely that every change touches five files.',
    ],
  },

  comparison: {
    title: 'Ways to reuse markup',
    headers: ['', 'Component', 'Copy-paste', 'v-for in one template'],
    rows: [
      ['Change it in one place', 'yes', 'no', 'yes'],
      ['Own state per copy', 'yes', 'yes, but duplicated code', 'only via an array of objects'],
      ['Customise each copy', 'props & slots', 'edit each copy', 'via item data'],
      ['Reuse across pages', 'yes (import it)', 'copy again', 'no'],
    ],
    note: 'Components and `v-for` combine well: `<ProductCard v-for="p in products" :key="p.id" :product="p" />`.',
  },

  quiz: [
    {
      id: 'first-component-q1',
      type: 'mcq',
      prompt: 'In `<script setup>`, what makes `LikeButton` usable in the template?',
      options: [
        { text: 'Importing it: `import LikeButton from \'./LikeButton.vue\'`' },
        { text: 'Listing it in a `components: {}` option', why: 'That is how the Options API registers components; `<script setup>` does not need it.' },
        { text: 'Naming the file in lowercase', why: 'The file name does not register anything by itself.' },
        { text: 'Nothing — Vue finds every `.vue` file automatically', why: 'Plain Vue does not auto-import components (some tools/frameworks like Nuxt do).' },
      ],
      answer: 0,
      explanation: 'With `<script setup>`, imported components are available to the template directly.',
    },
    {
      id: 'first-component-q2',
      type: 'output',
      prompt: 'Each `Counter` has `const n = ref(0)` and `<button @click="n++">{{ n }}</button>`. After clicking the **first** button twice, what do the three buttons show?',
      code: { lang: 'vue', code: `<template>\n  <Counter />\n  <Counter />\n  <Counter />\n</template>` },
      options: ['2 2 2', '2 0 0', '6 0 0', '0 0 0'],
      answer: 1,
      explanation: 'Every instance runs setup separately and owns its own `n`, so only the first changes.',
    },
    {
      id: 'first-component-q3',
      type: 'bug',
      prompt: 'Vue warns “Failed to resolve component: UserCard”. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
import UserCard from './UserCard.vue'
const users = ref(['Ada', 'Grace'])
</script>

<template>
  <user-card v-for="u in users" :key="u" :name="u" />
  <UsrCard name="Linus" />
</template>`,
      },
      answerLine: 9,
      explanation: '`<UsrCard>` is a typo — no component with that name was imported. (`<user-card>` on line 8 is fine: kebab-case resolves to `UserCard`.)',
    },
    {
      id: 'first-component-q4',
      type: 'fill',
      prompt: 'Complete the parent so it uses the `ProductCard` component with a number prop.',
      code: { lang: 'vue', code: `<script setup>\nimport ProductCard from '___'\n</script>\n\n<template>\n  <ProductCard name="Socks" ___price="6" />\n</template>` },
      answer: [['./ProductCard.vue'], [':']],
      explanation: 'Import from the file path, and bind the number with `:` so it arrives as a Number, not a string.',
    },
    {
      id: 'first-component-q5',
      type: 'mcq',
      prompt: 'Which component name follows the Vue style guide best?',
      options: [
        { text: '`Card`', why: 'Single-word names can clash with HTML elements.' },
        { text: '`product-card.vue` with a lowercase import', why: 'Files and imports are usually PascalCase in Vue projects.' },
        { text: '`ProductCard`' },
        { text: '`productcard`', why: 'Hard to read and not PascalCase.' },
      ],
      answer: 2,
      explanation: 'Multi-word PascalCase: readable and never collides with native elements.',
    },
    {
      id: 'first-component-q6',
      type: 'short',
      prompt: 'In your own words: why does each instance of a component get its own state?',
      answer: 'Because the component’s setup code (`<script setup>`) runs once per instance. Each time Vue renders a component tag it creates a new instance and runs setup again, so every `ref()` inside is created fresh for that instance.',
    },
  ],

  exercises: [
    {
      id: 'user-card',
      title: 'A reusable UserCard',
      difficulty: 'beginner',
      prompt: `
Create a **\`UserCard.vue\`** component and use it twice in \`App.vue\`.

- \`UserCard\` takes two String props: **\`name\`** and **\`role\`**.
- Its root element is \`<article class="user-card">\` containing \`<h3>\` with the name and \`<p>\` with the role.
- In \`App.vue\`, render two cards: **Ada — Engineer** and **Grace — Admiral**.
`,
      files: {
        'App.vue': `<script setup>
// import UserCard here
</script>

<template>
  <!-- use <UserCard> twice -->
</template>`,
        'UserCard.vue': `<script setup>
// declare the name and role props
</script>

<template>
  <article class="user-card">
    <h3>name goes here</h3>
    <p>role goes here</p>
  </article>
</template>`,
      },
      hints: [
        'In UserCard: `defineProps({ name: String, role: String })`, then use `{{ name }}` and `{{ role }}` in the template.',
        'In App: `import UserCard from \'./UserCard.vue\'`.',
        'Then `<UserCard name="Ada" role="Engineer" />` and a second one for Grace.',
      ],
      solution: {
        explanation: 'The component knows nothing about Ada or Grace — the parent decides through props. That is what makes it reusable.',
        files: {
          'App.vue': `<script setup>
import UserCard from './UserCard.vue'
</script>

<template>
  <UserCard name="Ada" role="Engineer" />
  <UserCard name="Grace" role="Admiral" />
</template>`,
          'UserCard.vue': `<script setup>
defineProps({
  name: { type: String, required: true },
  role: { type: String, default: 'Member' },
})
</script>

<template>
  <article class="user-card">
    <h3>{{ name }}</h3>
    <p>{{ role }}</p>
  </article>
</template>`,
        },
      },
      tests: [
        { name: 'App renders two user cards', code: `expect(findAll('.user-card')).toHaveLength(2)` },
        { name: 'cards show Ada/Engineer and Grace/Admiral', code: `const t = text(); expect(t).toContain('Ada'); expect(t).toContain('Engineer'); expect(t).toContain('Grace'); expect(t).toContain('Admiral')` },
        { name: 'UserCard displays whatever props it receives', code: `const w = mountFile('UserCard.vue', { name: 'Linus', role: 'Maintainer' }); expect(w.find('h3').textContent.trim()).toBe('Linus'); expect(w.find('p').textContent.trim()).toBe('Maintainer')` },
      ],
    },
    {
      id: 'independent-counters',
      title: 'Three independent counters',
      difficulty: 'beginner',
      prompt: `
Build **\`TallyCounter.vue\`**: a \`<div class="counter">\` with a \`<span class="value">\` showing its count and a \`<button class="add">\` that adds one. Use **three** of them in \`App.vue\`. Clicking one must not change the others.
`,
      files: {
        'App.vue': `<script setup>
import TallyCounter from './TallyCounter.vue'
</script>

<template>
  <TallyCounter />
</template>`,
        'TallyCounter.vue': `<script setup>
</script>

<template>
  <div class="counter">
    <span class="value">0</span>
    <button class="add">+1</button>
  </div>
</template>`,
      },
      hints: [
        'Each counter needs its own `ref(0)` — create it inside TallyCounter’s `<script setup>`.',
        'Wire the button with `@click="count++"` and show `{{ count }}` in the span.',
        'Then repeat `<TallyCounter />` three times in App.',
      ],
      solution: {
        explanation: 'Because `ref(0)` lives inside the component, each of the three instances owns a separate count.',
        files: {
          'App.vue': `<script setup>
import TallyCounter from './TallyCounter.vue'
</script>

<template>
  <TallyCounter />
  <TallyCounter />
  <TallyCounter />
</template>`,
          'TallyCounter.vue': `<script setup>
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="counter">
    <span class="value">{{ count }}</span>
    <button class="add" @click="count++">+1</button>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'three counters are rendered', code: `expect(findAll('.counter')).toHaveLength(3)` },
        {
          name: 'clicking the first only changes the first',
          code: `const adds = findAll('.add')
await click(adds[0])
await click(adds[0])
const values = findAll('.value').map((v) => v.textContent.trim())
expect(values).toEqual(['2', '0', '0'])`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'first-component-what',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a component in Vue, and why would you split an interface into components?',
      answer: 'A component is a self-contained, reusable unit of UI that bundles its template, logic and styles. Splitting an interface into components gives you reuse, smaller files that each do one job, and isolated state per instance.',
      explanation: 'Like LEGO bricks: build small pieces once, then combine and reuse them to make bigger things.',
      whyAsked: 'It checks whether you think in components — the core mental model of Vue (and every modern UI framework).',
      mistakes: ['Only mentioning reuse and forgetting maintainability and isolation.', 'Describing components as just “HTML templates” without state or behaviour.'],
      followUps: ['How do components communicate?', 'When would you NOT create a new component?', 'What is the difference between local and global registration?'],
      modelAnswer: 'A component is a reusable, self-contained piece of UI — in Vue usually a Single-File Component with its own template, script and styles. Splitting an app into components lets me reuse UI instead of duplicating it, keep each file focused on one job so it is easier to read and test, and isolate state so each instance manages its own data. Parents configure children through props and children notify parents through events. The trade-off is indirection, so I avoid splitting tiny one-off snippets.',
    },
    {
      id: 'first-component-instances',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'A `Toggle` component has `const on = ref(false)`. The parent renders `<Toggle />` twice. The user turns the first one on. What state is the second one in?',
      options: ['On — they share the same ref', 'Off — each instance has its own ref', 'Undefined until it is clicked', 'It depends on the order they mounted'],
      correctOption: 1,
      answer: 'Off. Setup runs separately for each instance, so each `Toggle` owns its own `on` ref.',
      explanation: 'The component file is a blueprint; every tag creates a new instance with fresh state.',
      whyAsked: 'Confirms you understand instance isolation — the basis for reasoning about bugs where state is (or is not) shared.',
      mistakes: ['Thinking state declared in a component file is shared by all instances.', 'Confusing component-level state with module-level variables.'],
      followUps: ['How would you make two components share state on purpose?', 'In the Options API, why must `data` be a function?'],
      modelAnswer: 'The second one is still off. Each `<Toggle />` creates its own component instance and runs its setup separately, so each gets its own `ref(false)`. If I wanted them to share state I would lift the state up to the parent, or use a store or a module-level composable on purpose. In the Options API this is why `data` has to be a function: it returns a fresh object per instance.',
    },
    {
      id: 'first-component-registration',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare local and global component registration. Which would you default to?',
      answer: 'Global registration (`app.component()`) makes a component usable in every template without importing; local registration (importing it in the component that uses it) keeps dependencies explicit and lets the bundler tree-shake unused components. Default to local; reserve global for a few truly ubiquitous base components, if any.',
      explanation: 'Global is convenient but hides where things come from and ships everything even if unused.',
      code: {
        lang: 'js',
        code: `// global — available everywhere
app.component('BaseButton', BaseButton)

// local — explicit, tree-shakable
import BaseButton from './BaseButton.vue'`,
      },
      whyAsked: 'Shows awareness of bundle size and maintainability trade-offs beyond “it works”.',
      mistakes: ['Saying global is always simpler without mentioning tree-shaking.', 'Not knowing that `<script setup>` imports register components automatically.'],
      followUps: ['How does tree-shaking interact with global registration?', 'How do auto-import plugins change this trade-off?'],
      modelAnswer: 'Globally registered components are available in every template, which is convenient, but they are always included in the bundle and it is not obvious where a component comes from. Locally registered components are imported where they are used — in `<script setup>` the import itself is the registration — so dependencies are explicit and unused components can be tree-shaken. I default to local registration and would only register a couple of truly ubiquitous base components globally.',
    },
    {
      id: 'first-component-naming',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 1,
      question: 'Why does the Vue style guide recommend multi-word component names?',
      answer: 'To avoid conflicts with existing and future HTML elements, since all HTML elements are single words.',
      explanation: 'A component called `Header` could be confused with the native `<header>` element.',
      whyAsked: 'A quick check of familiarity with Vue conventions and code-review hygiene.',
      mistakes: ['Saying it is required for Vue to work (it is a recommendation, enforced by lint rules).'],
      followUps: ['Can you use kebab-case tags for PascalCase components in SFC templates?', 'What about in in-DOM templates?'],
      modelAnswer: 'HTML element names are single words, so multi-word names like `AppHeader` or `ProductCard` can never collide with a native or future element. It is a style-guide recommendation that the official ESLint plugin enforces. In SFC templates I use PascalCase tags so components stand out from native elements.',
    },
    {
      id: 'first-component-split',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate’s `ProductPage.vue` is 600 lines: gallery, price box, reviews and recommendations. How would you approach splitting it?',
      answer: 'Identify the natural sections with their own data and behaviour (gallery, price/buy box, reviews, recommendations), extract each into a focused component, pass data down through props and events up, and keep page-level data fetching in the page. Split incrementally with tests or manual checks after each step, and avoid over-splitting tiny pieces.',
      explanation: 'Split along responsibilities, not line counts, and keep the data flow simple.',
      whyAsked: 'Real-world refactoring judgement: candidates who split well produce maintainable codebases.',
      mistakes: ['Splitting purely by size into arbitrary chunks.', 'Moving all state into a global store just to avoid props.', 'Rewriting everything at once without safety checks.'],
      followUps: ['Where should data fetching live?', 'When would you introduce a store?', 'How do you prevent prop drilling as it grows?'],
      modelAnswer: 'I would look for sections with their own responsibility and state — here the gallery, the price and buy box, reviews and recommendations — and extract each into its own component in a feature folder. The page keeps the data loading and passes what each section needs as props, with events back up for actions like add to cart. I would do it one section at a time, checking behaviour after each extraction, and stop before creating components so small that they add indirection without value.',
    },
    {
      id: 'first-component-coding-badge',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Create a `StatusBadge.vue` component with a required String prop `status`. It renders `<span class="badge">` showing the status text, and adds the class `badge--ok` when the status is `"online"`. Render three badges in App: online, away, offline.',
      starter: {
        files: {
          'App.vue': `<script setup>
import StatusBadge from './StatusBadge.vue'
</script>

<template>
  <StatusBadge status="online" />
</template>`,
          'StatusBadge.vue': `<script setup>
</script>

<template>
  <span class="badge">status</span>
</template>`,
        },
      },
      tests: [
        { name: 'App renders three badges', code: `expect(findAll('.badge')).toHaveLength(3)` },
        { name: 'badges show their status text', code: `expect(findAll('.badge').map((b) => b.textContent.trim())).toEqual(['online', 'away', 'offline'])` },
        { name: 'only the online badge gets badge--ok', code: `expect(findAll('.badge--ok')).toHaveLength(1); expect(find('.badge--ok').textContent.trim()).toBe('online')` },
      ],
      solution: {
        files: {
          'App.vue': `<script setup>
import StatusBadge from './StatusBadge.vue'
</script>

<template>
  <StatusBadge status="online" />
  <StatusBadge status="away" />
  <StatusBadge status="offline" />
</template>`,
          'StatusBadge.vue': `<script setup>
defineProps({
  status: { type: String, required: true },
})
</script>

<template>
  <span class="badge" :class="{ 'badge--ok': status === 'online' }">{{ status }}</span>
</template>`,
        },
      },
      hints: ['Declare the prop with `defineProps`.', 'Use a class binding: `:class="{ \'badge--ok\': status === \'online\' }"`.'],
      answer: 'Declare `status` with `defineProps`, render it in the span and add the modifier class with a conditional class binding.',
      explanation: 'The component stays generic; the parent decides which status each badge shows.',
      whyAsked: 'A warm-up that checks props, class bindings and reuse in one go.',
      mistakes: ['Hard-coding the status inside the component.', 'Building the class string with manual concatenation and getting spaces wrong.'],
      followUps: ['How would you validate that status is one of three values?', 'How would you add an icon slot?'],
      modelAnswer: 'I would declare a required `status` prop, render it in the span and use an object class binding to add `badge--ok` when it equals "online". To harden it I would add a prop validator restricting it to the allowed values, and maybe a slot for an icon.',
    },
  ],

  takeaways: [
    'A component is a reusable piece of UI in its own `.vue` file: template, logic and styles together.',
    'In `<script setup>`, importing a component is all you need to use it in the template.',
    'Every tag creates a separate instance with its own state.',
    'Props configure each instance; plain attributes are strings, use `:` for numbers, booleans, objects.',
    'Name components in multi-word PascalCase and give each one a single clear job.',
  ],
}
