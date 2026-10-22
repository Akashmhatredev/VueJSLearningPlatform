// Lesson: The DOM, events & user input.

const todoMain = `const app = document.getElementById('app')

app.innerHTML = \`
  <form class="add-form">
    <input class="new-todo" placeholder="What needs doing?" />
    <button type="submit">Add</button>
  </form>
  <ul class="todo-list"></ul>
  <p class="count">0 todos</p>
\`

const form = app.querySelector('.add-form')
const input = app.querySelector('.new-todo')
const list = app.querySelector('.todo-list')
const count = app.querySelector('.count')

function updateCount() {
  const n = list.children.length
  count.textContent = n + ' todos'
}

function addTodo(title) {
  const li = document.createElement('li')
  li.className = 'todo'

  const span = document.createElement('span')
  span.className = 'title'
  span.textContent = title // text only: never parsed as HTML

  const remove = document.createElement('button')
  remove.type = 'button'
  remove.className = 'remove'
  remove.textContent = '✕'

  li.append(span, remove)
  list.append(li)
  updateCount()
}

form.addEventListener('submit', (event) => {
  event.preventDefault() // stop the browser from reloading the page
  const title = input.value.trim()
  if (title === '') return
  addTodo(title)
  input.value = ''
})

// ONE listener on the <ul> handles clicks on every button inside it,
// even buttons created later. This is event delegation.
list.addEventListener('click', (event) => {
  if (event.target.matches('.remove')) {
    event.target.closest('li').remove()
    updateCount()
  }
})`

export default {
  id: 'dom-and-events',
  title: 'The DOM, events & user input',
  summary: 'Learn how the browser represents a page as a tree of objects, how to find and change them, and how clicks and keystrokes reach your code.',
  difficulty: 'beginner',
  minutes: 30,
  prerequisites: ['how-the-web-works'],
  related: ['js-essentials', 'v-on-events', 'v-model-forms', 'template-refs', 'xss-safe-rendering'],
  tags: ['dom', 'events', 'addEventListener', 'querySelector', 'bubbling', 'event delegation', 'preventDefault', 'input', 'forms', 'textContent', 'innerHTML'],
  apis: [
    { name: 'document.querySelector()', summary: 'Returns the first element matching a CSS selector, or `null`.' },
    { name: 'document.createElement()', summary: 'Creates a new element node that you can fill and insert.' },
    { name: 'element.textContent', summary: 'Reads or sets an element\'s text. Setting it never parses HTML, so it is safe for user data.' },
    { name: 'element.classList', summary: '`add`, `remove`, `toggle` and `contains` for an element\'s classes.' },
    { name: 'element.addEventListener()', summary: 'Registers a function to run when an event of a given type reaches the element.' },
    { name: 'event.preventDefault()', summary: 'Cancels the browser\'s default action, such as submitting a form or following a link.' },
    { name: 'event.target / event.currentTarget', summary: 'The element where the event started / the element whose listener is running now.' },
  ],
  docs: [
    { label: 'MDN — Introduction to the DOM', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction' },
    { label: 'MDN — Introduction to events', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events' },
    { label: 'MDN — Event bubbling', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Event_bubbling' },
    { label: 'Vue Guide — Event Handling', url: 'https://vuejs.org/guide/essentials/event-handling.html' },
  ],

  intro: `
When the browser reads your HTML, it doesn't keep it as text. It builds a **tree of objects** — one object per element — called the **DOM** (*Document Object Model*). JavaScript can find any object in that tree, read it, change it, add new ones or remove them, and the screen updates to match.

**Events** are the other half. Every click, keystroke and form submission is turned into an *event object* that travels through the tree. Your code can listen for those events and respond.

Find, listen, change — that is the whole loop of an interactive page. Vue automates most of it, but it is built on exactly these APIs: \`@click\` *is* \`addEventListener('click')\`, and \`{{ name }}\` ends up as text in a DOM node.
`,

  why: `
HTML alone is a printed poster: it can't respond to anything. The DOM turns the poster into something you can reach into from JavaScript, and events tell you *when* to reach.

Understanding them pays off in Vue every day:

- \`@click.prevent\`, \`@click.stop\` and \`@keyup.enter\` are shortcuts for \`preventDefault()\`, \`stopPropagation()\` and checking \`event.key\` — you can't reason about them without knowing what they wrap.
- \`v-model\` is "set the value, listen for \`input\`" — the two halves you'll write by hand in this lesson.
- [Template refs](lesson:template-refs) hand you a real DOM element when you must focus an input or measure something.
- Security: \`{{ }}\` sets *text*, \`v-html\` sets *HTML*. The difference between \`textContent\` and \`innerHTML\` is the difference between safe and an XSS hole.
`,

  eli15: `
Imagine your web page is a family tree. At the top is the great-grandparent (\`<html>\`), then grandparents (\`<body>\`), then parents and children — a list, its items, a button inside an item.

The **DOM** is that family tree living inside the browser, where JavaScript can talk to each family member: "Hey, paragraph, change your words to *3 likes*." "List, here's a new child."

**Events** are like shouting in that family. When you click a button, the button hears it first — then the shout travels **up** to its parent, then the grandparent, all the way to the top. That's called **bubbling**. Any family member can be listening.

So you can put one listener on the list (the parent) and catch clicks on any of its children — even children born later. That trick is called **event delegation**.
`,

  analogy: {
    title: 'A building with an intercom',
    body: `
A tall office building has floors, offices on each floor and desks in each office — a tree. The building directory lets you find any desk by its label ("3rd floor, office B, desk 2"), and maintenance can add or remove desks at any time.

When someone presses a buzzer at a desk, the signal goes up: desk → office → floor → reception. Reception can handle every buzzer in the building without wiring each desk separately.
`,
    mapping: [
      ['the building\'s floors, offices and desks', 'the DOM tree of elements'],
      ['the building directory', '`querySelector` / `getElementById`'],
      ['adding or removing a desk', '`createElement`, `append`, `remove`'],
      ['pressing a buzzer', 'an event (click, input, submit)'],
      ['the signal travelling up to reception', 'event bubbling'],
      ['reception handling every buzzer', 'event delegation: one listener on a parent'],
    ],
  },

  visual: {
    type: 'dom-tree',
    props: {
      html: `<form class="add-form">
  <input class="new-todo" placeholder="What needs doing?">
  <button type="submit">Add</button>
</form>
<ul class="todo-list">
  <li class="todo">
    <span class="title">Buy milk</span>
    <button class="remove">✕</button>
  </li>
</ul>
<p class="count">1 todos</p>`,
    },
    title: 'HTML in, tree out',
    caption: 'Edit the markup and watch the tree change. `querySelector(\'.todo-list\')` returns the `<ul>` node; `.children` gives its `<li>` children; `.closest(\'li\')` walks upwards from a button.',
    alt: 'An editable HTML panel beside a tree. Under the root are a form (with an input and a button), a ul (with an li containing a span and a button) and a paragraph.',
  },

  syntax: [
    `
#### 1. Find elements
`,
    {
      code: `const app = document.getElementById('app')          // by id → one element or null
const list = app.querySelector('.todo-list')          // first match of a CSS selector, or null
const items = app.querySelectorAll('.todo')           // ALL matches (a NodeList)
const firstItem = list.children[0]                    // walk down
const row = button.closest('li')                      // walk up to the nearest matching ancestor`,
      lang: 'js',
      title: 'finding',
    },
    `
#### 2. Change them
`,
    {
      code: `title.textContent = 'Buy oat milk'       // set text (safe — never parsed as HTML)
row.classList.add('done')                 // add / remove / toggle / contains
input.value = ''                          // form fields keep their value in .value
button.disabled = true                    // most attributes are also properties
link.setAttribute('href', '/cart')        // any attribute by name
row.dataset.id = '42'                     // data-id="42" — handy for your own data

const li = document.createElement('li')   // create…
li.textContent = 'Walk the dog'
list.append(li)                           // …insert…
li.remove()                               // …or remove`,
      lang: 'js',
      title: 'changing',
    },
    `
#### 3. Listen for events
`,
    {
      code: `button.addEventListener('click', (event) => {
  console.log(event.type)          // "click"
  console.log(event.target)        // the element that was actually clicked
  console.log(event.currentTarget) // the element this listener is attached to
})

input.addEventListener('input', () => console.log(input.value))       // every keystroke
input.addEventListener('keyup', (e) => { if (e.key === 'Enter') save() })

form.addEventListener('submit', (event) => {
  event.preventDefault()           // don't reload the page
})

list.addEventListener('click', (event) => {
  event.stopPropagation()          // don't bubble any further up
})`,
      lang: 'js',
      title: 'listening',
    },
    `
Pass the function itself — \`addEventListener('click', save)\` — not the result of calling it (\`save()\`).

#### The same ideas in Vue
`,
    {
      code: `<!-- Vue attaches the listener for you and passes the event object -->
<form @submit.prevent="addTodo">                <!-- preventDefault() -->
  <input v-model="title" @keyup.enter="addTodo"> <!-- value + input event; event.key check -->
</form>
<li v-for="todo in todos" :key="todo.id" :class="{ done: todo.done }">
  {{ todo.title }}                               <!-- set as text, like textContent -->
  <button @click.stop="remove(todo)">✕</button>   <!-- stopPropagation() -->
</li>`,
      lang: 'vue',
      title: 'Vue templates wrap these DOM APIs',
    },
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: todoMain,
    intro: 'A complete todo list with plain DOM APIs. Step through it — every Vue feature you\'ll learn later replaces one of these chunks.',
    steps: [
      { lines: [3, 10], text: 'Static structure: a form, an empty `<ul>` and a counter. The list starts empty; JavaScript will fill it.' },
      { lines: [12, 15], text: 'Find the elements once and keep references. `querySelector` searches inside `app` using CSS selectors (`.add-form` = "class add-form").' },
      { lines: [17, 20], text: '`updateCount()` reads the DOM (`list.children.length`) and writes the DOM (`count.textContent`). We must call it after **every** change — a chore Vue\'s reactivity removes.' },
      { lines: [22, 38], text: 'Building a row by hand: `createElement` for each node, `className` for styling hooks, `textContent` for the title. Using `textContent` means a title like `<img onerror=…>` shows up as harmless text.' },
      { lines: [40, 46], text: 'Forms fire `submit` when you press Enter or click the submit button. `event.preventDefault()` cancels the browser\'s default action — reloading the page. In Vue: `@submit.prevent`.' },
      { lines: [48, 55], text: '**Event delegation.** Clicks on any ✕ bubble up to the `<ul>`. `event.target` is the element actually clicked; `matches(\'.remove\')` checks it is a remove button and `closest(\'li\')` walks up to its row.' },
    ],
  },

  playground: {
    title: 'A todo list, by hand',
    objective: 'Extend a plain-DOM todo list and feel exactly which chores Vue will take off your hands.',
    files: { 'main.js': todoMain },
    expected: 'A text box with an **Add** button, an empty list and **0 todos**. Type something and press Enter or click Add: a row appears with a ✕ button that removes it, and the count updates.',
    experiments: [
      {
        id: 'singular',
        task: 'The count says **1 todos**. Make it say **1 todo** for exactly one item, and **N todos** otherwise (including 0).',
        hint: 'Change `updateCount()`: pick the word with a ternary — `n === 1 ? \'todo\' : \'todos\'`.',
        tests: [
          { name: 'one item → "1 todo"', code: `await type('.new-todo', 'Buy milk')\nawait submit('.add-form')\nexpect(text('.count')).toBe('1 todo')` },
          { name: 'two items → "2 todos"', code: `await type('.new-todo', 'Buy milk')\nawait submit('.add-form')\nawait type('.new-todo', 'Walk dog')\nawait submit('.add-form')\nexpect(text('.count')).toBe('2 todos')` },
        ],
        explain: 'Every bit of text derived from data is code you must keep correct and call at the right time. In Vue this becomes a `computed()` value that is always up to date.',
      },
      {
        id: 'toggle-done',
        task: 'Clicking a todo\'s **title** should toggle the class `done` on its `<li>` (click again to undo). Use the existing delegated listener on the list — don\'t add a listener per row.',
        hint: 'Inside the list\'s click listener, add a second check: `if (event.target.matches(\'.title\'))` → `event.target.closest(\'li\').classList.toggle(\'done\')`.',
        tests: [
          { name: 'clicking the title toggles .done', code: `await type('.new-todo', 'Buy milk')\nawait submit('.add-form')\nawait click('.title')\nexpect(classes('.todo')).toContain('done')\nawait click('.title')\nexpect(classes('.todo')).not.toContain('done')` },
        ],
        explain: 'One listener now handles two kinds of clicks for every row, present and future. That\'s the power of delegation: the parent inspects `event.target` and decides.',
      },
      {
        id: 'no-duplicates',
        task: 'Refuse to add a todo whose title is already in the list (compare without caring about upper/lower case). Leave the text in the input so the user can fix it.',
        hint: 'Before `addTodo`, collect existing titles: `[...list.querySelectorAll(\'.title\')].map((s) => s.textContent.toLowerCase())`, then check with `.includes(...)`.',
        tests: [
          { name: 'adding "Milk" twice keeps one row', code: `await type('.new-todo', 'Milk')\nawait submit('.add-form')\nawait type('.new-todo', 'milk')\nawait submit('.add-form')\nexpect(findAll('.todo')).toHaveLength(1)\nexpect(text('.count')).toContain('1')` },
        ],
        explain: 'Notice that you had to *read data back out of the DOM* to answer a question about your todos. In Vue the data lives in a JavaScript array and the DOM is only a picture of it — much easier to query.',
      },
      {
        id: 'see-the-reload',
        task: 'Comment out `event.preventDefault()` and submit the form. Read the warning in the console, then put the line back.',
        hint: 'On a real page the browser would submit the form and reload — wiping every todo.',
        explain: 'Default actions are the browser\'s built-in behaviour for an event: forms submit, links navigate, checkboxes toggle. `preventDefault()` cancels them; Vue\'s `.prevent` modifier calls it for you.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'One click, travelling through the tree',
    caption: 'Step through what happens when you click the ✕ in a todo row, and why one listener on the `<ul>` can handle it.',
    alt: 'A vertical diagram of four nodes: div#app at the top, ul.todo-list, li.todo, and button.remove at the bottom. The steps show the click starting at the button (the target), then bubbling up through the li to the ul, where the delegated listener runs and reads event.target, then continuing to #app.',
    props: {
      layout: 'column',
      nodes: [
        { id: 'app', label: 'div#app', note: 'no listener', tone: 'paper' },
        { id: 'ul', label: 'ul.todo-list', note: 'click listener (delegation)', tone: 'cobalt' },
        { id: 'li', label: 'li.todo', note: 'no listener', tone: 'paper' },
        { id: 'btn', label: 'button.remove', note: 'event.target', tone: 'red' },
      ],
      edges: [
        { from: 'btn', to: 'li', label: 'bubbles' },
        { from: 'li', to: 'ul', label: 'bubbles' },
        { from: 'ul', to: 'app', label: 'bubbles', dashed: true },
      ],
      steps: [
        { focus: ['btn'], text: 'You click the ✕. The browser creates a `click` event object whose **target** is the `<button>` — the deepest element under the pointer.' },
        { focus: ['btn', 'li'], edges: ['btn->li'], text: 'Listeners on the button itself run first (there are none here). Then the event **bubbles** to the parent `<li>`.' },
        { focus: ['ul'], edges: ['li->ul'], text: 'The `<ul>` has a listener. It runs with `event.currentTarget === ul` but `event.target === button`. The code checks `event.target.matches(\'.remove\')` and removes `event.target.closest(\'li\')`.' },
        { focus: ['app'], edges: ['ul->app'], text: 'Unless someone calls `event.stopPropagation()`, the event keeps bubbling to `#app`, `<body>` and `document`. (Before bubbling there is also a *capture* phase going down — rarely needed, available with `{ capture: true }`.)' },
      ],
    },
  },

  internals: {
    beginner: `
The DOM is a set of linked JavaScript objects. Each element object knows its parent, its children and its attributes. Changing a property like \`textContent\` changes the object, and the browser redraws that part of the screen. An event is also an object; the browser passes it along the chain of parents, calling every matching listener on the way.
`,
    technical: [
      `
**Event flow** has three phases: *capture* (from \`window\` down to the target's parent), *target*, then *bubble* (back up). \`addEventListener(type, fn)\` listens in the bubble phase by default; \`{ capture: true }\` listens on the way down. Not every event bubbles — \`focus\` and \`blur\` don't (their bubbling cousins are \`focusin\`/\`focusout\`).

**Listener options:** \`{ once: true }\` removes the listener after the first call; \`{ passive: true }\` promises you won't call \`preventDefault()\`, which lets the browser start scrolling immediately for touch and wheel events.

**\`input\` vs \`change\`:** text fields fire \`input\` on every edit and \`change\` when the edit is committed (usually on blur). Checkboxes, radios and selects fire \`change\` as soon as the selection changes. Vue's \`v-model\` listens to \`input\` on text fields (or \`change\` with \`.lazy\`) and to \`change\` on checkboxes, radios and selects.
`,
      {
        code: `// What Vue's modifiers correspond to (simplified)
// @click.stop      → event.stopPropagation()
// @submit.prevent  → event.preventDefault()
// @click.self      → only run if event.target === event.currentTarget
// @click.once      → addEventListener('click', fn, { once: true })
// @scroll.passive  → addEventListener('scroll', fn, { passive: true })
// @keyup.enter     → only run if event.key === 'Enter'`,
        lang: 'js',
        title: 'Vue event modifiers in DOM terms',
      },
      `
**How Vue uses the DOM.** Vue keeps a lightweight description of your UI (the *virtual DOM*), compares it with the previous one after a state change, and applies only the needed DOM operations — set this text, add that class, insert this node. In Vue 3, \`@click\` attaches a native listener directly on that element. See [How Vue updates the DOM](lesson:how-vue-updates).
`,
    ],
    production: `
- **Never** put untrusted data into \`innerHTML\` (or Vue's \`v-html\`). A comment like \`<img src=x onerror="stealCookies()">\` would run as code. Use \`textContent\` / \`{{ }}\`. See [XSS & safe rendering](lesson:xss-safe-rendering).
- In a Vue app, let Vue own the DOM it renders. If you change Vue-managed nodes by hand, the next re-render can overwrite your change or get confused. Use [template refs](lesson:template-refs) only for things templates can't express: focus, measuring, third-party widgets.
- Listeners you add to \`window\` or \`document\` (resize, keydown shortcuts) outlive components. In Vue, add them in \`onMounted\` and remove them in \`onUnmounted\`, or you leak memory and get duplicate handlers.
- Delegation is great for long lists in plain JavaScript. In Vue you rarely need it — the template attaches listeners as rows are created and removes them when rows go away.
`,
  },

  mistakes: [
    {
      title: 'Calling the handler instead of passing it',
      wrong: { code: `button.addEventListener('click', save())  // runs save() NOW, passes its return value`, lang: 'js' },
      right: { code: `button.addEventListener('click', save)\n// or, to pass arguments:\nbutton.addEventListener('click', () => save(todo))`, lang: 'js' },
      explanation: '`save()` calls the function immediately and passes whatever it returns (often `undefined`) as the listener. Pass the function itself, or wrap the call in an arrow function.',
    },
    {
      title: 'Using innerHTML with user input',
      wrong: { code: `li.innerHTML = input.value   // "<img src=x onerror=alert(1)>" runs code`, lang: 'js' },
      right: { code: `li.textContent = input.value // shown as plain text`, lang: 'js' },
      explanation: '`innerHTML` parses its string as HTML, including attributes that run JavaScript. `textContent` never parses. The Vue equivalents: `{{ value }}` is safe, `v-html` is not.',
    },
    {
      title: 'Re-rendering with innerHTML and losing listeners',
      wrong: { code: `list.innerHTML += '<li><button class="remove">✕</button></li>'\n// every existing button was destroyed and recreated —\n// listeners attached to them directly are gone`, lang: 'js' },
      right: { code: `const li = document.createElement('li')\n// …build it…\nlist.append(li)          // existing rows untouched\n// and/or use ONE delegated listener on the list`, lang: 'js' },
      explanation: '`innerHTML += …` serialises the list to a string, appends text, and re-parses everything into brand-new elements. Listeners and form values on the old elements vanish. Append nodes instead, or delegate.',
    },
    {
      title: 'Forgetting preventDefault on a form',
      wrong: { code: `form.addEventListener('submit', () => {\n  addTodo(input.value) // the page reloads right after — work lost\n})`, lang: 'js' },
      right: { code: `form.addEventListener('submit', (event) => {\n  event.preventDefault()\n  addTodo(input.value)\n})`, lang: 'js' },
      explanation: 'A form\'s default action is to send the data and navigate. In a JavaScript-driven page you almost always cancel it. In Vue: `@submit.prevent`.',
    },
  ],

  debugging: [
    {
      symptom: '`Cannot read properties of null (reading \'addEventListener\')`.',
      cause: '`querySelector` found nothing: a typo in the selector, a missing `.` or `#`, or the element doesn\'t exist yet.',
      fix: 'Log the result of the query. Compare the selector with the HTML in DevTools → Elements. Make sure the code runs after the element is created.',
    },
    {
      symptom: 'Clicking a dynamically added button does nothing.',
      cause: 'The listener was attached to the elements that existed at the time — new elements never got one.',
      fix: 'Attach the listener when you create each element, or use event delegation on a parent that always exists.',
    },
    {
      symptom: 'A click on a child also triggers the parent\'s click handler.',
      cause: 'Events bubble: the parent\'s listener runs after the child\'s.',
      fix: 'Call `event.stopPropagation()` in the child (Vue: `@click.stop`), or check `event.target` in the parent (Vue: `@click.self`).',
    },
    {
      symptom: 'The page flashes and all state is gone after pressing Enter in a form.',
      cause: 'The form submitted and the browser reloaded the page.',
      fix: 'Call `event.preventDefault()` in the submit listener (Vue: `@submit.prevent`).',
    },
  ],

  bestPractices: [
    'Use `textContent` for text and reserve `innerHTML` for trusted, static markup.',
    'Select by class or `data-*` attributes, not by deep tag paths that break when markup changes.',
    'Keep references to elements you use often instead of querying in every event.',
    'Use event delegation for many similar children in plain JavaScript.',
    'Listen to `submit` on forms (it covers Enter and the button) rather than `click` on the button.',
    'Remove listeners you add to `window`/`document` when they are no longer needed.',
  ],

  useCases: [
    'Plain-JavaScript widgets: a menu toggle, a character counter, tabs, a copy-to-clipboard button.',
    'Understanding and debugging Vue event modifiers (`.prevent`, `.stop`, `.self`, key modifiers).',
    'Reaching the real DOM from Vue via template refs: focusing inputs, measuring, integrating chart libraries.',
    'Global shortcuts (Escape closes a modal) registered on `document` in `onMounted`.',
  ],

  whenToUse: {
    use: [
      'Direct DOM code for small, isolated enhancements on otherwise static pages.',
      'Template refs in Vue for focus, scrolling, measuring and third-party libraries.',
      'Event delegation for long or frequently changing lists in plain JavaScript.',
    ],
    avoid: [
      'Manually editing elements that Vue renders — change the state instead.',
      '`innerHTML` with any data a user or API can influence.',
      'Building a large, data-heavy UI with hand-written DOM updates — that is what a framework is for.',
    ],
  },

  comparison: {
    title: 'Plain DOM vs Vue for the same job',
    headers: ['Job', 'Plain DOM', 'Vue'],
    rows: [
      ['Show text', '`el.textContent = name`', '`{{ name }}`'],
      ['Listen for a click', '`el.addEventListener(\'click\', fn)`', '`@click="fn"`'],
      ['Cancel a form submit', '`event.preventDefault()`', '`@submit.prevent`'],
      ['Keep an input and a variable in sync', 'set `.value` + listen to `input`', '`v-model="title"`'],
      ['Toggle a class', '`el.classList.toggle(\'done\')`', '`:class="{ done: todo.done }"`'],
      ['Render a list', '`createElement` + `append` per item', '`v-for` with `:key`'],
    ],
    note: 'Vue does the left column for you. See [Events with v-on](lesson:v-on-events) and [v-model](lesson:v-model-forms).',
  },

  quiz: [
    {
      id: 'dom-and-events-q1',
      type: 'mcq',
      prompt: 'What is the DOM?',
      options: [
        { text: 'The HTML file stored on the server', why: 'The file is text. The DOM is what the browser builds from it in memory.' },
        { text: 'A tree of objects the browser builds from HTML, which JavaScript can read and change' },
        { text: 'A JavaScript library you install', why: 'The DOM is built into every browser — no installation.' },
        { text: 'Vue\'s internal copy of the page', why: 'That is the *virtual* DOM, a Vue (and other frameworks) concept built on top of the real DOM.' },
      ],
      answer: 1,
      explanation: 'The Document Object Model is the live, in-memory tree of the page. Change it and the screen follows.',
    },
    {
      id: 'dom-and-events-q2',
      type: 'output',
      prompt: 'The user clicks the button. In what order are the messages logged?',
      code: {
        lang: 'js',
        code: `// <div class="page"><div class="card"><button>Buy</button></div></div>
page.addEventListener('click', () => console.log('page'))
card.addEventListener('click', () => console.log('card'))
button.addEventListener('click', () => console.log('button'))`,
      },
      options: [
        { text: 'page, card, button', why: 'That would be the capture phase. Default listeners run during bubbling, from the target upwards.' },
        { text: 'button, card, page' },
        { text: 'button only', why: 'Events bubble to ancestors unless something calls `stopPropagation()`.' },
        { text: 'The order is random', why: 'Bubbling order is well defined: target first, then each ancestor.' },
      ],
      answer: 1,
      explanation: 'The click starts at the button (target) and bubbles up through `.card` to `.page`, calling each listener on the way.',
    },
    {
      id: 'dom-and-events-q3',
      type: 'bug',
      prompt: 'The alert pops up as soon as the page loads, and clicking does nothing. Click the buggy line.',
      code: {
        lang: 'js',
        code: `const button = document.querySelector('.save')

function save() {
  alert('Saved!')
}

button.addEventListener('click', save())`,
      },
      answerLine: 7,
      explanation: '`save()` runs immediately and its return value (`undefined`) is passed as the listener. Pass the function itself: `addEventListener(\'click\', save)`.',
    },
    {
      id: 'dom-and-events-q4',
      type: 'fill',
      prompt: 'Complete the submit handler: stop the page reloading, then find the `<li>` that contains the clicked element.',
      code: { lang: 'js', code: `form.addEventListener('submit', (event) => {\n  event.___()\n  save()\n})\n\nlist.addEventListener('click', (event) => {\n  const row = event.target.___('li')\n})` },
      answer: [['preventDefault'], ['closest']],
      explanation: '`preventDefault()` cancels the default action; `closest(selector)` walks up from an element to the nearest ancestor (or itself) that matches.',
    },
    {
      id: 'dom-and-events-q5',
      type: 'mcq',
      prompt: 'A user types a comment and you display it on the page. Which line is safe?',
      options: [
        { text: '`commentEl.innerHTML = comment`', why: '`innerHTML` parses the text as HTML, so a comment containing `<img onerror=…>` would run code (XSS).' },
        { text: '`commentEl.textContent = comment`' },
        { text: '`commentEl.outerHTML = comment`', why: 'Also parses HTML — and replaces the element itself.' },
        { text: 'All are equally safe', why: 'Only `textContent` treats the string as plain text.' },
      ],
      answer: 1,
      explanation: '`textContent` never interprets HTML. Vue\'s `{{ comment }}` gives you the same safety; `v-html` is the dangerous one.',
    },
    {
      id: 'dom-and-events-q6',
      type: 'mcq',
      prompt: 'Which DOM call does Vue\'s `@submit.prevent="save"` make for you?',
      options: [
        { text: '`event.stopPropagation()`', why: 'That is `.stop`, which stops bubbling.' },
        { text: '`event.preventDefault()`' },
        { text: '`form.reset()`', why: 'Vue doesn\'t clear your form; `.prevent` only cancels the default action.' },
        { text: '`removeEventListener()`', why: 'That would be closer to `.once`, which removes the listener after one call.' },
      ],
      answer: 1,
      explanation: '`.prevent` calls `event.preventDefault()` before your handler runs, so the browser doesn\'t submit the form and reload.',
    },
    {
      id: 'dom-and-events-q7',
      type: 'short',
      prompt: 'What is event delegation, and why does it work for elements created after the listener was added?',
      answer: 'Event delegation means putting one listener on a common parent instead of one on each child. It works because most events bubble from the element where they happen up through all its ancestors, so the parent\'s listener runs for clicks on any child — including children added later. Inside the listener you check `event.target` (for example with `matches` or `closest`) to see which child was clicked.',
    },
  ],

  exercises: [
    {
      id: 'char-counter',
      title: 'A tweet-style character counter',
      difficulty: 'beginner',
      prompt: `
The HTML is ready. Add the behaviour in \`main.js\`:

- \`<p class="counter">\` shows **N / 140**, where N is the number of characters in \`<textarea class="message">\`. It starts at **0 / 140** and updates on every keystroke.
- When N is **over 140**, the counter gets the class \`over\` (remove it again when back under).
- The \`<button class="send">\` is **disabled** when the message is empty or over 140 characters.
`,
      files: {
        'main.js': `const app = document.getElementById('app')

app.innerHTML = \`
  <textarea class="message" rows="4" placeholder="What's happening?"></textarea>
  <p class="counter">0 / 140</p>
  <button class="send" disabled>Send</button>
\`

const message = app.querySelector('.message')
const counter = app.querySelector('.counter')
const send = app.querySelector('.send')

// TODO: update the counter, the "over" class and the button on every keystroke
`,
      },
      hints: [
        'Listen for the `input` event on the textarea — it fires on every change to its value.',
        'Inside the listener, `const n = message.value.length`, then set `counter.textContent = n + \' / 140\'`.',
        'Use `counter.classList.toggle(\'over\', n > 140)` (the second argument forces on/off) and `send.disabled = n === 0 || n > 140`.',
      ],
      solution: {
        explanation: 'One `input` listener recomputes everything from the current value: text, class and disabled state. Deriving all three from a single source (`message.value`) keeps them consistent — the same idea as a `computed()` in Vue.',
        files: {
          'main.js': `const app = document.getElementById('app')

app.innerHTML = \`
  <textarea class="message" rows="4" placeholder="What's happening?"></textarea>
  <p class="counter">0 / 140</p>
  <button class="send" disabled>Send</button>
\`

const message = app.querySelector('.message')
const counter = app.querySelector('.counter')
const send = app.querySelector('.send')

message.addEventListener('input', () => {
  const n = message.value.length
  counter.textContent = n + ' / 140'
  counter.classList.toggle('over', n > 140)
  send.disabled = n === 0 || n > 140
})
`,
        },
      },
      tests: [
        { name: 'starts at 0 / 140 with Send disabled', code: `expect(text('.counter')).toBe('0 / 140')\nexpect(find('.send').disabled).toBe(true)` },
        { name: 'typing updates the count and enables Send', code: `await type('.message', 'hello')\nexpect(text('.counter')).toBe('5 / 140')\nexpect(find('.send').disabled).toBe(false)` },
        { name: 'over 140 adds .over and disables Send', code: `await type('.message', 'x'.repeat(141))\nexpect(text('.counter')).toBe('141 / 140')\nexpect(classes('.counter')).toContain('over')\nexpect(find('.send').disabled).toBe(true)` },
        { name: 'back under 140 removes .over', code: `await type('.message', 'x'.repeat(141))\nawait type('.message', 'short')\nexpect(classes('.counter')).not.toContain('over')` },
      ],
    },
    {
      id: 'tabs-delegation',
      title: 'Tabs with one delegated listener',
      difficulty: 'intermediate',
      prompt: `
Make the tab bar work using **one** click listener on \`<div class="tabs">\`:

- Each \`<button class="tab">\` has a \`data-tab\` attribute (\`info\`, \`reviews\`, \`shipping\`).
- Clicking a tab shows \`content[thatKey]\` as the text of \`<p class="panel">\` and gives **only** that tab the class \`active\`.
- Clicking empty space inside \`.tabs\` (not on a button) must not break anything.
- Initially the **info** tab is active and its text is shown (already done in the HTML).
`,
      files: {
        'main.js': `const content = {
  info: 'Hand-made ceramic mug, 350 ml.',
  reviews: '★★★★★ "My coffee tastes better." — Sam',
  shipping: 'Ships in 2 working days.',
}

const app = document.getElementById('app')

app.innerHTML = \`
  <div class="tabs">
    <button class="tab active" data-tab="info">Info</button>
    <button class="tab" data-tab="reviews">Reviews</button>
    <button class="tab" data-tab="shipping">Shipping</button>
  </div>
  <p class="panel">\${content.info}</p>
\`

const tabs = app.querySelector('.tabs')
const panel = app.querySelector('.panel')

// TODO: one click listener on "tabs"
`,
      },
      hints: [
        'Add `tabs.addEventListener(\'click\', (event) => { … })`. Find the clicked tab with `event.target.closest(\'.tab\')`.',
        'If `closest` returns `null`, the click wasn\'t on a tab — `return` early. Read the key with `tab.dataset.tab`.',
        'Remove `active` from every tab (`tabs.querySelectorAll(\'.tab\').forEach(…)`), add it to the clicked one, then set `panel.textContent = content[key]`.',
      ],
      solution: {
        explanation: '`closest(\'.tab\')` makes the listener robust — it works whether you click the button or something inside it, and returns `null` for empty space. `dataset` reads `data-*` attributes, so the HTML carries the key and the JavaScript needs no per-tab code.',
        files: {
          'main.js': `const content = {
  info: 'Hand-made ceramic mug, 350 ml.',
  reviews: '★★★★★ "My coffee tastes better." — Sam',
  shipping: 'Ships in 2 working days.',
}

const app = document.getElementById('app')

app.innerHTML = \`
  <div class="tabs">
    <button class="tab active" data-tab="info">Info</button>
    <button class="tab" data-tab="reviews">Reviews</button>
    <button class="tab" data-tab="shipping">Shipping</button>
  </div>
  <p class="panel">\${content.info}</p>
\`

const tabs = app.querySelector('.tabs')
const panel = app.querySelector('.panel')

tabs.addEventListener('click', (event) => {
  const tab = event.target.closest('.tab')
  if (!tab) return
  tabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'))
  tab.classList.add('active')
  panel.textContent = content[tab.dataset.tab]
})
`,
        },
      },
      tests: [
        { name: 'starts on Info', code: `expect(text('.panel')).toBe('Hand-made ceramic mug, 350 ml.')\nexpect(classes('[data-tab="info"]')).toContain('active')` },
        { name: 'clicking Reviews shows reviews and moves .active', code: `await click('[data-tab="reviews"]')\nexpect(text('.panel')).toContain('My coffee tastes better.')\nexpect(classes('[data-tab="reviews"]')).toContain('active')\nexpect(classes('[data-tab="info"]')).not.toContain('active')\nexpect(findAll('.tab.active')).toHaveLength(1)` },
        { name: 'clicking Shipping works too', code: `await click('[data-tab="shipping"]')\nexpect(text('.panel')).toBe('Ships in 2 working days.')` },
        { name: 'clicking the empty bar changes nothing', code: `await click('[data-tab="reviews"]')\nawait click('.tabs')\nexpect(text('.panel')).toContain('My coffee')\nexpect(findAll('.tab.active')).toHaveLength(1)` },
      ],
    },
  ],

  interview: [
    {
      id: 'dom-and-events-what-is-dom',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the DOM, and how does it relate to the HTML you write?',
      answer: 'The DOM (Document Object Model) is the browser\'s in-memory tree of objects representing the page. The browser builds it by parsing HTML; afterwards JavaScript can read and modify it, and the rendered page reflects the DOM, not the original HTML text.',
      explanation: 'HTML is the blueprint; the DOM is the building. If JavaScript adds a room, the blueprint file doesn\'t change, but the building does.',
      whyAsked: 'Fundamental vocabulary — needed to discuss rendering, the virtual DOM and debugging in DevTools.',
      mistakes: ['Saying the DOM *is* the HTML file.', 'Confusing the DOM with Vue\'s virtual DOM.', 'Not knowing DevTools → Elements shows the live DOM, not the source.'],
      followUps: ['What is the virtual DOM and why does Vue use one?', 'Why can the DOM differ from "View source"?'],
      modelAnswer: 'The DOM is the live tree of objects the browser builds when it parses HTML — one node per element and text. JavaScript works with that tree through APIs like querySelector, textContent and appendChild, and the screen reflects the DOM\'s current state. So the HTML file is just the starting point: after scripts run, the DOM can look very different — DevTools\' Elements panel shows the live DOM, while View Source shows the original file. Vue\'s virtual DOM is a separate JavaScript description that Vue diffs to decide which real DOM operations to make.',
    },
    {
      id: 'dom-and-events-text-vs-html',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `textContent` and `innerHTML`, and how does it map to Vue?',
      answer: '`textContent` sets or reads plain text; any `<` characters are shown literally. `innerHTML` parses the string as HTML and creates elements, which means untrusted strings can inject markup and scripts (XSS). In Vue, `{{ }}` interpolation behaves like `textContent`, and `v-html` behaves like `innerHTML`.',
      explanation: 'Text is inert. HTML is executable structure. Mixing user data into HTML is how cross-site scripting happens.',
      whyAsked: 'Security awareness is expected even for juniors; this is the most common XSS vector in frontend code.',
      mistakes: ['Saying they are interchangeable.', 'Thinking `<script>` tags are the only danger — event-handler attributes like `onerror` run too.', 'Believing Vue sanitises `v-html` (it does not).'],
      followUps: ['When is `v-html` acceptable?', 'How would you render user-written Markdown safely?'],
      modelAnswer: '`textContent` treats the string as text, so it is always safe for user data. `innerHTML` hands the string to the HTML parser — if it contains something like an image with an onerror attribute, that code runs, which is XSS. Vue mirrors this: `{{ }}` sets text, `v-html` sets HTML and Vue does not sanitise it. I only use `v-html` with trusted or properly sanitised content, for example HTML produced by a sanitiser library on content I control.',
    },
    {
      id: 'dom-and-events-delegation',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'Explain event bubbling and how event delegation uses it.',
      answer: 'Most events start at the target element and then bubble up through each ancestor, triggering their listeners in turn. Event delegation attaches a single listener to a common ancestor and inspects `event.target` to decide what was clicked. It means fewer listeners and automatic support for children added later.',
      explanation: 'The parent hears every click from its descendants, so it can act as a dispatcher.',
      whyAsked: 'Shows understanding of the event model — useful for performance, dynamic content and reasoning about `.stop`/`.self` in Vue.',
      mistakes: ['Forgetting that `event.target` may be a nested element (use `closest`).', 'Claiming every event bubbles — `focus`/`blur` don\'t.', 'Mixing up `target` and `currentTarget`.'],
      followUps: ['Which events don\'t bubble?', 'What is the capture phase?', 'Does Vue use delegation internally?'],
      modelAnswer: 'When I click a button, the event is dispatched to the button and then bubbles to its parent, grandparent and so on up to the document, running listeners at each level. Delegation exploits that: I put one listener on a container like the list, and in it check `event.target.closest(\'.remove\')` to find which row\'s button was clicked. That handles thousands of rows with one listener and works for rows added later. In Vue I rarely need it, because Vue attaches and removes listeners per element as the template renders.',
    },
    {
      id: 'dom-and-events-target-current',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'The user clicks the `<span>`. What does the listener log?',
      code: {
        lang: 'js',
        code: `// <li class="row"><span class="title">Milk</span></li>
const row = document.querySelector('.row')
row.addEventListener('click', (event) => {
  console.log(event.target.className, event.currentTarget.className)
})`,
      },
      options: ['row row', 'title title', 'title row', 'row title'],
      correctOption: 2,
      answer: '`title row` — `target` is where the event started (the span); `currentTarget` is the element whose listener is running (the li).',
      explanation: 'During bubbling, `target` stays the same while `currentTarget` changes as the event moves up.',
      whyAsked: 'Quick check that you can write correct delegation code and understand `.self` in Vue.',
      mistakes: ['Assuming `target` is always the element with the listener.', 'Not knowing `currentTarget` is `null` after the event finishes dispatching (when logged later).'],
      followUps: ['How does Vue\'s `.self` modifier use these two properties?', 'Why might you use `closest()` instead of checking `target` directly?'],
      modelAnswer: 'It logs "title row". The target is the deepest element that was clicked — the span — and it doesn\'t change while the event bubbles. currentTarget is the element whose listener is executing, here the li. Vue\'s `.self` modifier is exactly the check `event.target === event.currentTarget`.',
    },
    {
      id: 'dom-and-events-vue-modifiers',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A modal has a dark backdrop. Clicking the backdrop should close the modal, but clicking inside the dialog box should not. How would you implement it with plain DOM, and with Vue?',
      answer: 'The click on the dialog bubbles to the backdrop, so the backdrop handler must ignore clicks that started inside the dialog. Plain DOM: in the backdrop\'s listener, close only if `event.target === event.currentTarget`. Vue: `@click.self="close"` on the backdrop does exactly that. Alternatively stop propagation in the dialog (`@click.stop`), though `.self` is cleaner because it doesn\'t block other listeners.',
      explanation: 'Know what each modifier compiles down to, and prefer the one with the fewest side effects.',
      code: {
        lang: 'vue',
        code: `<div class="backdrop" @click.self="close">
  <div class="dialog" role="dialog" aria-modal="true">
    …content…
  </div>
</div>`,
      },
      whyAsked: 'A very common real UI requirement that tests bubbling knowledge and Vue modifiers together.',
      mistakes: ['Putting `@click.stop` on everything, which breaks analytics or other listeners higher up.', 'Not handling the Escape key for accessibility.', 'Using `.prevent` (cancels default actions) when `.stop` or `.self` was meant.'],
      followUps: ['How would you also close on Escape?', 'What else does an accessible modal need (focus trap, restoring focus)?'],
      modelAnswer: 'Because clicks bubble, a click inside the dialog reaches the backdrop too. So the backdrop should only react when it is itself the target: in plain JavaScript, `if (event.target === event.currentTarget) close()`; in Vue, `@click.self="close"`. I prefer that over `@click.stop` on the dialog, since stopping propagation can break other listeners further up. For accessibility I\'d also close on Escape and manage focus — see the accessible components lesson.',
    },
    {
      id: 'dom-and-events-lost-listeners',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 4,
      question: 'After adding a new item, the delete buttons on all the *older* items stop working, and a half-typed value in an input disappears. What is going on?',
      code: {
        lang: 'js',
        code: `function addItem(name) {
  list.innerHTML += \`<li>\${name} <button class="delete">✕</button></li>\`
  list.querySelectorAll('.delete').forEach((btn) => {
    btn.addEventListener('click', onDelete)
  })
}`,
      },
      answer: '`innerHTML +=` serialises the whole list to a string, appends, and re-parses it into brand-new elements. All old nodes are destroyed — including their listeners and any typed input values. (Here the loop re-adds listeners to the new nodes, so the deeper problems are lost state, wasted work and the XSS risk of interpolating `name` into HTML.) Fix: create and `append` a new node, use `textContent` for the name, and use one delegated listener on the list.',
      explanation: '`innerHTML +=` is "throw away everything and rebuild from text", not "add one item".',
      whyAsked: 'Distinguishes people who have debugged real DOM code; it also explains why frameworks patch the DOM minimally.',
      mistakes: ['Blaming event bubbling.', 'Missing the XSS issue of interpolating `name` into HTML.', 'Not explaining that element identity changed.'],
      followUps: ['How does Vue avoid this when a list changes?', 'Why do `:key`s matter for keeping input state in `v-for`?'],
      modelAnswer: 'The `innerHTML +=` line rebuilds the entire list: the browser turns the current DOM into a string, appends the new markup, and parses it all into new elements. Every old element — with its listeners, focus and typed values — is gone. It is also an XSS hole because `name` is inserted as HTML. I\'d create the li with createElement, set the name with textContent, append it, and handle deletes with one delegated listener on the list. This is also why Vue patches the DOM minimally and why stable keys matter: they preserve element identity.',
    },
    {
      id: 'dom-and-events-select-list',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Using a single listener on `<ul class="people">`, make clicking a person select them: the clicked `<li>` gets the class `selected` (only one at a time), and `<p class="chosen">` shows **Selected: NAME**. Clicks on the list but outside an item should be ignored.',
      starter: {
        files: {
          'main.js': `const app = document.getElementById('app')

app.innerHTML = \`
  <ul class="people">
    <li data-name="Ada">Ada</li>
    <li data-name="Grace">Grace</li>
    <li data-name="Linus">Linus</li>
  </ul>
  <p class="chosen">Selected: nobody</p>
\`

const people = app.querySelector('.people')
const chosen = app.querySelector('.chosen')

// TODO
`,
        },
      },
      tests: [
        { name: 'clicking Grace selects Grace', code: `await click('[data-name="Grace"]')\nexpect(classes('[data-name="Grace"]')).toContain('selected')\nexpect(text('.chosen')).toBe('Selected: Grace')` },
        { name: 'only one item is selected at a time', code: `await click('[data-name="Ada"]')\nawait click('[data-name="Linus"]')\nexpect(findAll('.people .selected')).toHaveLength(1)\nexpect(text('.chosen')).toBe('Selected: Linus')` },
        { name: 'clicking the list itself is ignored', code: `await click('[data-name="Ada"]')\nawait click('.people')\nexpect(text('.chosen')).toBe('Selected: Ada')` },
      ],
      hints: ['`event.target.closest(\'li\')` finds the clicked item (or `null`).', 'Clear `selected` from the previous item before adding it to the new one; read the name from `dataset.name`.'],
      answer: 'One listener on the list; find the item with `closest(\'li\')`, return if null, move the `selected` class and update the paragraph from `dataset.name`.',
      solution: {
        files: {
          'main.js': `const app = document.getElementById('app')

app.innerHTML = \`
  <ul class="people">
    <li data-name="Ada">Ada</li>
    <li data-name="Grace">Grace</li>
    <li data-name="Linus">Linus</li>
  </ul>
  <p class="chosen">Selected: nobody</p>
\`

const people = app.querySelector('.people')
const chosen = app.querySelector('.chosen')

people.addEventListener('click', (event) => {
  const item = event.target.closest('li')
  if (!item) return
  const previous = people.querySelector('.selected')
  if (previous) previous.classList.remove('selected')
  item.classList.add('selected')
  chosen.textContent = 'Selected: ' + item.dataset.name
})
`,
        },
      },
      explanation: 'Delegation plus `closest` gives robust selection logic with one listener; `dataset` keeps data in the markup instead of hard-coding it in JavaScript.',
      whyAsked: 'A standard DOM warm-up that tests delegation, class manipulation and defensive null checks.',
      mistakes: ['Adding a listener to each `li` in a loop (works, but misses the point and breaks for new items).', 'Forgetting the null check when clicking empty space.', 'Using `innerHTML` to update the text.'],
      followUps: ['How would you make it keyboard-accessible?', 'What would this look like in Vue?'],
      modelAnswer: 'I\'d attach one click listener to the ul. Inside, `event.target.closest(\'li\')` gives the clicked item or null for empty space, in which case I return. Then I remove `selected` from the previously selected item, add it to this one, and set the paragraph\'s textContent from `item.dataset.name`. In Vue this would be a `selected` ref, `:class="{ selected: p === selected }"` and `@click="selected = p"` — no manual class juggling.',
    },
  ],

  takeaways: [
    'The DOM is the browser\'s live tree of objects built from HTML; change it and the screen follows.',
    'Find (`querySelector`, `closest`), change (`textContent`, `classList`, `append`), listen (`addEventListener`) — every interaction uses these.',
    'Events bubble from the target up through ancestors; `event.target` is where it started, `event.currentTarget` is where the listener sits.',
    'Event delegation = one listener on a parent that inspects `event.target`; it covers future children too.',
    'Use `textContent` (Vue: `{{ }}`) for data; `innerHTML` (Vue: `v-html`) with untrusted data is an XSS hole.',
    'Vue\'s `@event` modifiers and `v-model` are thin layers over `preventDefault`, `stopPropagation`, `event.key` and `input`/`change` events.',
  ],
}
