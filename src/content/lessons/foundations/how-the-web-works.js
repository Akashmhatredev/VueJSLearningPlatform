// Lesson: How websites work — HTML, CSS, JS & the browser.

const cardMain = `import './styles.css'

// The sandbox gives us one empty element: <div id="app"></div>.
// A Vue app starts from exactly the same place.
const app = document.getElementById('app')

// 1) HTML: the structure. WHAT is on the page.
app.innerHTML = \`
  <article class="card">
    <h1 class="name">Ada Lovelace</h1>
    <p class="role">Often called the first computer programmer</p>
    <button class="like" type="button">♡ Like</button>
    <p class="likes">0 likes</p>
  </article>
\`

// 2) CSS: the presentation. Lives in styles.css (open that tab).

// 3) JavaScript: the behaviour. What HAPPENS when the user acts.
let likes = 0
const likeButton = app.querySelector('.like')
const likesText = app.querySelector('.likes')

likeButton.addEventListener('click', () => {
  likes = likes + 1
  likesText.textContent = likes + ' likes'
})`

const cardCss = `.card {
  max-width: 320px;
  padding: 20px;
  border: 2px solid #1d1d1f;
  border-radius: 12px;
  background: #fffbe8;
  font-family: system-ui, sans-serif;
}

.name {
  margin: 0 0 4px;
  font-size: 1.6rem;
}

.role {
  margin: 0 0 16px;
  color: #555;
}

.like {
  padding: 6px 14px;
  border: 2px solid #1d1d1f;
  border-radius: 999px;
  background: white;
  cursor: pointer;
}`

export default {
  id: 'how-the-web-works',
  title: 'How websites work: HTML, CSS, JS & the browser',
  summary: 'Follow a web page from the URL you type to the pixels you see, and learn the three languages every page — and every Vue app — is made of.',
  difficulty: 'beginner',
  minutes: 25,
  prerequisites: [],
  related: ['dom-and-events', 'js-essentials', 'http-apis-json', 'what-is-vue', 'create-app-mount'],
  tags: ['web', 'browser', 'html', 'css', 'javascript', 'http', 'url', 'client', 'server', 'rendering', 'spa'],
  apis: [
    { name: 'document.getElementById()', summary: 'Finds the one element with a given `id` attribute.' },
    { name: 'element.innerHTML', summary: 'Reads or replaces the HTML inside an element (the browser parses the string into elements).' },
    { name: 'element.addEventListener()', summary: 'Runs a function when something happens to an element, such as a click.' },
    { name: '<script type="module">', summary: 'Loads a JavaScript file as an ES module; module scripts are deferred until the HTML is parsed.' },
  ],
  docs: [
    { label: 'MDN — How the web works', url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works' },
    { label: 'MDN — How browsers work', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work' },
    { label: 'MDN — What is JavaScript?', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_is_JavaScript' },
    { label: 'Vue Guide — Creating a Vue Application', url: 'https://vuejs.org/guide/essentials/application.html' },
  ],

  intro: `
A website is a conversation between two computers. Your computer — the **client**, usually a web browser like Chrome, Firefox or Safari — asks for a page. Another computer somewhere — the **server** — answers with files.

Those files are written in three languages, each with one job:

- **HTML** says *what* is on the page: a heading, a paragraph, a button.
- **CSS** says *how it looks*: colours, sizes, spacing, layout.
- **JavaScript** says *what happens*: when you click the button, add one like.

The browser reads all three and turns them into the page you see and touch. Vue, which you'll learn soon, is "just" JavaScript that writes and updates HTML for you — so understanding this pipeline is understanding what Vue is built on.
`,

  why: `
You can use Vue without knowing any of this — right up until something goes wrong. A blank white page after deploying. A button that does nothing. Styles that "don't apply". Each of these is a problem in one specific step of the pipeline, and you can only find it if you know the steps exist.

There's a second reason. Vue's whole purpose is to solve a pain you can only feel in plain web code: **keeping the page in sync with your data**.

\`\`\`js
let likes = 0
button.addEventListener('click', () => {
  likes = likes + 1
  // ...and now YOU must remember to update every element that shows likes
  likesText.textContent = likes + ' likes'
})
\`\`\`

With one counter that's fine. With a shopping cart shown in a header badge, a sidebar and a checkout summary, it becomes a source of bugs. Seeing this by hand makes it obvious why [reactivity](lesson:what-is-reactivity) is worth learning.
`,

  eli15: `
Think of ordering food through a restaurant window.

You (the **browser**) walk up and say "one page, please — the one called \`example.com/menu\`". That address is the **URL**. The kitchen (the **server**) sends back a tray.

On the tray are three things:

1. **HTML** — the food itself, arranged on the plate: here's the burger, here's the fries.
2. **CSS** — the presentation: the nice plate, the sauce drizzle, where everything sits.
3. **JavaScript** — a little robot waiter that stays at your table and *does things* when you ask: "more ketchup?" → it adds ketchup.

The browser unpacks the tray and builds the page. From then on, every click is you talking to the robot waiter. Vue is a very smart robot waiter: you tell it what the table *should* look like, and it rearranges the plates for you.
`,

  analogy: {
    title: 'A restaurant order',
    body: `
A restaurant has customers, a kitchen and waiters. Customers order using the menu's item names; the kitchen prepares dishes; waiters carry them out and keep serving during the meal.

The web works the same way. The browser orders with a URL, the server prepares a response, and JavaScript stays on the page "serving" — reacting to clicks and typing long after the page arrived.
`,
    mapping: [
      ['the customer', 'the browser (the client)'],
      ['the order slip with the dish name', 'the URL and the HTTP request'],
      ['the kitchen', 'the server'],
      ['the dish', 'HTML: the content and its structure'],
      ['plating and presentation', 'CSS: how the content looks'],
      ['the waiter who keeps serving', 'JavaScript: behaviour after the page loads'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'From URL to pixels',
    caption: 'Step through the journey of one page load. The last steps — DOM, render, JavaScript — repeat every time you interact with the page.',
    alt: 'A step-by-step diagram with seven boxes in a row: You type a URL; DNS finds the server address; the browser sends an HTTP request; the server sends back HTML; the browser builds the DOM and fetches CSS and JavaScript; the page is laid out and painted; JavaScript runs and reacts to events, changing the DOM again.',
    props: {
      layout: 'grid',
      cols: 4,
      nodes: [
        { id: 'url', label: 'You type a URL', note: 'https://shop.example/cart', tone: 'acid' },
        { id: 'dns', label: 'DNS lookup', note: 'name → IP address' },
        { id: 'request', label: 'HTTP request', note: 'GET /cart', tone: 'cobalt' },
        { id: 'server', label: 'Server responds', note: '200 OK + HTML', tone: 'kraft' },
        { id: 'parse', label: 'Parse HTML → DOM', note: 'also fetch CSS & JS', tone: 'paper' },
        { id: 'render', label: 'Layout & paint', note: 'pixels on screen' },
        { id: 'js', label: 'JavaScript runs', note: 'listens for events', tone: 'red' },
      ],
      edges: [
        { from: 'url', to: 'dns' },
        { from: 'dns', to: 'request' },
        { from: 'request', to: 'server' },
        { from: 'server', to: 'parse' },
        { from: 'parse', to: 'render' },
        { from: 'parse', to: 'js' },
        { from: 'js', to: 'parse', label: 'changes the DOM', dashed: true },
      ],
      steps: [
        { focus: ['url'], text: 'You type `https://shop.example/cart`. The **URL** names the protocol (`https`), the server (`shop.example`) and the page you want (`/cart`).' },
        { focus: ['dns'], edges: ['url->dns'], text: 'Computers find each other by numeric **IP addresses**, not names. **DNS** is the internet\'s phone book: it turns `shop.example` into an address. Results are cached, so this is often instant.' },
        { focus: ['request'], edges: ['dns->request'], text: 'The browser opens a secure connection and sends an **HTTP request**: "GET /cart, please". HTTP is the language browsers and servers speak — you\'ll meet it properly in [HTTP, APIs & JSON](lesson:http-apis-json).' },
        { focus: ['server'], edges: ['request->server'], text: 'The server answers with a **response**: a status (`200 OK`), some headers and a body — here, an HTML document.' },
        { focus: ['parse'], edges: ['server->parse'], text: 'The browser reads the HTML top to bottom and builds the **DOM** — a tree of objects, one per element. When it meets `<link rel="stylesheet">` or `<script src>`, it requests those files too.' },
        { focus: ['render'], edges: ['parse->render'], text: 'Using the DOM and the CSS rules, the browser works out where every box goes (**layout**) and fills in the pixels (**paint**). Now you can see the page.' },
        { focus: ['js'], edges: ['parse->js', 'js->parse'], text: 'JavaScript runs and attaches **event listeners**. When you click, it changes the DOM, and the browser re-renders the affected part. A Vue app lives entirely in this loop.' },
      ],
    },
  },

  syntax: [
    `
#### HTML: elements and attributes

HTML is made of **elements**, written as tags. Most have an opening and a closing tag around their content. **Attributes** inside the opening tag add extra information.
`,
    {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My shop</title>
    <link rel="stylesheet" href="styles.css" />   <!-- load CSS -->
  </head>
  <body>
    <h1 class="title">Cart</h1>                  <!-- element with a class attribute -->
    <button id="buy" type="button">Buy now</button>
    <script type="module" src="main.js"></script> <!-- load JavaScript -->
  </body>
</html>`,
      lang: 'html',
      title: 'index.html',
    },
    `
- \`<head>\` holds information *about* the page (title, stylesheets); \`<body>\` holds what you see.
- \`class\` groups elements for styling and selecting (many elements can share a class). \`id\` names one unique element.

#### CSS: selectors and declarations

A CSS **rule** = a **selector** (which elements) + **declarations** (\`property: value;\`).
`,
    {
      code: `.title {            /* every element with class="title" */
  color: #1d4ed8;
  font-size: 2rem;
}

#buy:hover {         /* the element with id="buy", while hovered */
  background: gold;
}`,
      lang: 'css',
      title: 'styles.css',
    },
    `
#### JavaScript: find, listen, change

Almost all page behaviour follows the same three steps:
`,
    {
      code: `const button = document.getElementById('buy')   // 1. find an element
button.addEventListener('click', () => {          // 2. listen for an event
  button.textContent = 'Added!'                   // 3. change the page
})`,
      lang: 'js',
      title: 'main.js',
    },
    `
#### Where Vue fits

A Vue project created with Vite has an \`index.html\` that is almost empty on purpose:
`,
    {
      code: `<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>`,
      lang: 'html',
      title: 'index.html in a Vue + Vite project',
    },
    {
      code: `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')   // Vue builds the page inside <div id="app">`,
      lang: 'js',
      title: 'src/main.js',
    },
    {
      callout: 'note',
      title: 'The sandbox on this site',
      text: 'The playgrounds here have no `index.html` you can edit — they start with an empty `<div id="app">`, just like a Vue app. In plain-JavaScript examples we write the HTML into it from `main.js`. In real projects, static HTML lives in `index.html` and Vue fills `#app`.',
    },
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: cardMain,
    intro: 'A profile card built from all three languages. Follow the HTML, then the CSS import, then the JavaScript that makes the button work.',
    steps: [
      { lines: [1], text: '`import \'./styles.css\'` loads the stylesheet. In a hand-written site this would be a `<link rel="stylesheet">` tag in `index.html`; build tools like Vite let JavaScript import CSS directly.' },
      { lines: [5], text: '`document` is the browser\'s object for the whole page. `getElementById(\'app\')` finds the one element whose `id` is `app` — the same element a Vue app mounts into.' },
      { lines: [8, 15], text: 'Setting `innerHTML` hands the browser a string of HTML. It **parses** the string and creates real elements: an `<article>` containing a heading, two paragraphs and a button. The `class` attributes are hooks for CSS and JavaScript.' },
      { lines: [20, 22], text: 'Plain JavaScript state: a variable `likes`, plus references to the two elements we\'ll need. `querySelector(\'.like\')` finds the first element matching the CSS selector `.like`.' },
      { lines: [24, 27], text: 'The behaviour: every click adds one and **manually** rewrites the paragraph\'s text. Forget line 26 and the page would silently show the wrong number — the exact chore Vue automates.' },
    ],
  },

  playground: {
    title: 'A profile card in three languages',
    objective: 'Change the structure (HTML), the look (CSS) and the behaviour (JavaScript) of one small page, and notice which file each change belongs in.',
    files: { 'main.js': cardMain, 'styles.css': cardCss },
    expected: 'A cream-coloured card with **Ada Lovelace**, a short description, a **♡ Like** button and the text **0 likes**. Each click on the button adds one like.',
    experiments: [
      {
        id: 'your-name',
        task: 'Change the heading so the card shows **your own name** instead of Ada Lovelace.',
        hint: 'The heading is the `<h1 class="name">` inside the HTML string in `main.js`.',
        tests: [
          { name: 'the heading no longer says Ada Lovelace', code: `expect(text('.name')).not.toBe('Ada Lovelace')\nexpect(text('.name').length).toBeGreaterThan(0)` },
        ],
        explain: 'Content and structure are HTML\'s job. You changed the text between the tags; the CSS and JavaScript did not need to know.',
      },
      {
        id: 'add-bio',
        task: 'Add a paragraph with `class="bio"` **inside the card**, containing one sentence about the person.',
        hint: 'Add `<p class="bio">…</p>` between the role and the button, still inside `<article class="card">`.',
        tests: [
          { name: 'a .bio paragraph exists inside the card', code: `expect(exists('.card .bio')).toBe(true)\nexpect(text('.bio').length).toBeGreaterThan(0)` },
        ],
        explain: 'New elements appear in the DOM tree as children of whatever element contains them. Because the bio is inside `.card`, it also inherits the card\'s font.',
      },
      {
        id: 'liked-label',
        task: 'After a click, make the button itself read **♥ Liked** (as well as updating the count).',
        hint: 'Inside the click listener, also set `likeButton.textContent`.',
        tests: [
          { name: 'clicking changes the button to ♥ Liked', code: `await click('.like')\nexpect(text('.like')).toContain('Liked')\nexpect(text('.likes')).toContain('1')` },
        ],
        explain: 'One event, two DOM updates — and you had to write both by hand. In Vue you would change one piece of state and let the template show it in both places.',
      },
      {
        id: 'restyle',
        task: 'Open **styles.css** and change the card\'s `background` and `border-radius`. Then delete the `import \'./styles.css\'` line in `main.js` and run again.',
        hint: 'Without the stylesheet, the browser falls back to its default styles.',
        explain: 'Removing the CSS changed how everything *looks* but nothing about what exists or what the button *does*. That separation is the point: three languages, three jobs.',
      },
    ],
  },

  animation: {
    type: 'dom-tree',
    props: {
      html: `<article class="card">
  <h1 class="name">Ada Lovelace</h1>
  <p class="role">Often called the first computer programmer</p>
  <button class="like">♡ Like</button>
  <p class="likes">0 likes</p>
</article>`,
    },
    title: 'The tree behind the card',
    caption: 'Edit the HTML and watch the tree the browser builds from it. Every tag becomes a node; text inside tags becomes text nodes. This tree is the **DOM** — the next lesson is all about it.',
    alt: 'An editable HTML box next to a tree diagram. The article element is the root; its children are an h1, a paragraph, a button and another paragraph, each with a text node child.',
  },

  internals: {
    beginner: `
The browser never "shows HTML" directly. It reads the HTML text and builds a tree of objects in memory — the **DOM**. It then combines that tree with the CSS rules to decide what each box looks like and where it goes, and paints the result. When JavaScript changes the DOM, the browser updates the picture.
`,
    technical: [
      `
A simplified view of what the browser does with a response:

1. **Parse HTML → DOM.** The parser reads tags in order and creates element nodes. It is forgiving: missing closing tags are fixed up automatically.
2. **Parse CSS → CSSOM.** Stylesheets become a tree of rules.
3. **Render tree.** DOM + CSSOM = the visible elements with their computed styles (\`display: none\` elements are left out).
4. **Layout.** Calculate each box's size and position.
5. **Paint and composite.** Fill pixels, then combine layers on screen.

Changing the DOM later can re-run some of these steps for the affected parts.
`,
      `
**Scripts can pause parsing.** A classic \`<script src="app.js">\` in the \`<head>\` stops the parser until the file has downloaded and run — and because the body hasn't been parsed yet, \`document.getElementById('app')\` returns \`null\`. Two fixes:

- \`<script defer src="app.js">\` — download in parallel, run after parsing finishes;
- \`<script type="module" src="app.js">\` — module scripts are deferred **by default**. This is what Vite puts in your \`index.html\`.
`,
      {
        code: `<head>
  <script src="classic.js"></script>               <!-- blocks parsing; #app not there yet -->
  <script defer src="deferred.js"></script>        <!-- runs after the HTML is parsed -->
  <script type="module" src="/src/main.js"></script> <!-- deferred by default -->
</head>`,
        lang: 'html',
        title: 'three ways to load a script',
      },
    ],
    production: `
- A Vue single-page app (**SPA**) ships a nearly empty \`index.html\`; the content appears only after the JavaScript bundle downloads and runs. That's fine for apps behind a login, but it can delay first paint and matters for search engines and slow devices — see [CSR, SSR & SSG](lesson:rendering-strategies).
- \`vite build\` bundles and minifies your code into files with content hashes in their names (like \`index-a1b2c3.js\`) so browsers can cache them safely.
- Many "it works locally but not in production" bugs live in this pipeline: wrong base path for assets, a server that returns \`404\` for deep links in an SPA, or a script error that stops the app from mounting. The browser DevTools **Network** and **Console** tabs show each step.
- Everything sent to the browser can be read by the user. Never put secrets (API keys with real power, passwords) in frontend code — see [Secrets, CSP & dependency security](lesson:secrets-csp-dependencies).
`,
  },

  mistakes: [
    {
      title: 'Running a script before the HTML it needs exists',
      wrong: { code: `<head>\n  <script src="main.js"></script>  <!-- document.getElementById('app') → null -->\n</head>\n<body>\n  <div id="app"></div>\n</body>`, lang: 'html' },
      right: { code: `<head>\n  <script type="module" src="main.js"></script>  <!-- deferred: runs after parsing -->\n</head>\n<body>\n  <div id="app"></div>\n</body>`, lang: 'html' },
      explanation: 'The parser runs classic scripts the moment it meets them. At that point the body hasn\'t been read, so the element doesn\'t exist yet. Use `type="module"` or `defer`, or put the script at the end of `<body>`.',
    },
    {
      title: 'Putting looks in HTML or JavaScript instead of CSS',
      wrong: { code: `el.style.color = 'red'\nel.style.fontWeight = 'bold'\nel.style.border = '2px solid red'`, lang: 'js' },
      right: { code: `/* styles.css */\n.error { color: red; font-weight: bold; border: 2px solid red; }\n\n// main.js\nel.classList.add('error')`, lang: 'js' },
      explanation: 'Styles scattered through JavaScript are hard to find and override. Describe looks with CSS classes and let JavaScript only switch classes on and off. Vue\'s `:class` binding is built on exactly this habit.',
    },
    {
      title: 'Changing a variable and expecting the page to follow',
      wrong: { code: `let likes = 0\nbutton.addEventListener('click', () => {\n  likes++   // the page still says "0 likes"\n})`, lang: 'js' },
      right: { code: `let likes = 0\nbutton.addEventListener('click', () => {\n  likes++\n  likesText.textContent = likes + ' likes'\n})`, lang: 'js' },
      explanation: 'The page is built once from the HTML. A JavaScript variable has no connection to it unless you write that connection yourself. (This is the problem Vue\'s reactivity solves for you.)',
    },
  ],

  debugging: [
    {
      symptom: 'The console says `Cannot read properties of null (reading \'addEventListener\')`.',
      cause: 'The element wasn\'t found — either the selector is wrong (typo, missing `.` or `#`) or the script ran before the element existed.',
      fix: 'Check the selector against the HTML, then make sure the script is deferred (`type="module"` or `defer`) or runs after the element is created.',
    },
    {
      symptom: 'You edited the CSS but nothing changes.',
      cause: 'The stylesheet isn\'t loaded (wrong path), the selector doesn\'t match, or a more specific rule wins.',
      fix: 'In DevTools, select the element and open the **Styles** panel: it lists every rule that applies and crosses out overridden ones. The **Network** tab shows whether the CSS file loaded.',
    },
    {
      symptom: 'A deployed Vue app shows a blank white page.',
      cause: 'Usually the JavaScript bundle failed to load (404 because of a wrong base path) or threw an error before mounting.',
      fix: 'Open DevTools → **Console** for errors and **Network** for failed requests. Check that `index.html` has `<div id="app">` and that the asset paths match where the files are actually served.',
    },
  ],

  bestPractices: [
    'Keep the three jobs separate: structure in HTML, looks in CSS, behaviour in JavaScript.',
    'Use classes as the hooks between them — style `.like` in CSS and select `.like` in JavaScript.',
    'Load scripts with `type="module"` (or `defer`) so they run after the HTML is parsed.',
    'Keep the browser DevTools open while you work: Elements, Console and Network show every step of the pipeline.',
    'Assume everything sent to the browser is public — no secrets in frontend code.',
  ],

  useCases: [
    'Debugging a blank page or a missing stylesheet after deployment.',
    'Understanding why a Vue app\'s `index.html` contains only `<div id="app">`.',
    'Explaining to a teammate (or interviewer) what happens when a page loads.',
    'Deciding whether a project needs server rendering for search engines and first paint.',
  ],

  whenToUse: {
    use: [
      'Plain HTML + CSS for content that never changes: a simple landing page, documentation.',
      'A little plain JavaScript for small, isolated behaviours: a menu toggle, a copy button.',
      'A framework like Vue when many parts of the page must stay in sync with changing data.',
    ],
    avoid: [
      'Building layout with JavaScript when CSS can do it.',
      'Writing a large app with hand-written DOM updates — that is the bookkeeping Vue removes.',
      'Putting API secrets or business rules that must be trusted into frontend code.',
    ],
  },

  comparison: {
    title: 'The three languages of the web',
    headers: ['', 'HTML', 'CSS', 'JavaScript'],
    rows: [
      ['Job', 'structure and meaning', 'presentation and layout', 'behaviour and logic'],
      ['Answers', '"what is here?"', '"how does it look?"', '"what happens when…?"'],
      ['Example', '`<button class="like">`', '`.like { color: red }`', '`button.addEventListener(\'click\', …)`'],
      ['In a Vue SFC', '`<template>`', '`<style>`', '`<script setup>`'],
    ],
    note: 'A Vue single-file component keeps all three for one piece of UI in one file — see [Single-File Components](lesson:single-file-components).',
  },

  quiz: [
    {
      id: 'how-the-web-works-q1',
      type: 'mcq',
      prompt: 'You want every heading on your site to be dark blue. Which language should you change?',
      options: [
        { text: 'HTML', why: 'HTML describes what the content *is*. Colour is presentation.' },
        { text: 'CSS' },
        { text: 'JavaScript', why: 'JavaScript *can* set colours, but that mixes looks into behaviour. CSS exists for this.' },
        { text: 'HTTP', why: 'HTTP is how files travel between server and browser, not how they look.' },
      ],
      answer: 1,
      explanation: 'Looks belong in CSS: `h1, h2 { color: darkblue; }`. One rule styles every heading.',
    },
    {
      id: 'how-the-web-works-q2',
      type: 'output',
      prompt: 'The page starts with `<p class="likes">0 likes</p>`. What does the paragraph show after the button is clicked **three** times?',
      code: {
        lang: 'js',
        code: `let likes = 0
const button = document.querySelector('.like')

button.addEventListener('click', () => {
  likes = likes + 1
})`,
      },
      options: [
        { text: '3 likes', why: '`likes` is 3 in memory, but nothing writes it into the paragraph.' },
        { text: '0 likes' },
        { text: 'undefined likes', why: 'The paragraph is never touched, so it keeps its original text.' },
        { text: 'It throws an error', why: 'Incrementing a variable is fine; the code just never updates the DOM.' },
      ],
      answer: 1,
      explanation: 'A variable has no link to the page. Without `likesText.textContent = …` the paragraph still shows its original text. Vue\'s reactivity exists to make this link automatic.',
    },
    {
      id: 'how-the-web-works-q3',
      type: 'bug',
      prompt: 'Opening this page logs `TypeError: Cannot read properties of null`. Click the line where the error is thrown.',
      code: {
        lang: 'html',
        code: `<!DOCTYPE html>
<html>
  <head>
    <script>
      const button = document.querySelector('.buy')
      button.addEventListener('click', () => alert('Thanks!'))
    </script>
  </head>
  <body>
    <button class="buy">Buy</button>
  </body>
</html>`,
      },
      answerLine: 6,
      explanation: 'The classic script runs as soon as the parser reaches it — before `<body>` is read — so `querySelector` returns `null` on line 5, and line 6 throws when it calls `null.addEventListener`. Fix: `<script type="module">`, `defer` on an external script, or move the script to the end of `<body>`.',
    },
    {
      id: 'how-the-web-works-q4',
      type: 'fill',
      prompt: 'Fill the blanks: find the element with `id="app"`, then run a function when the button inside it is clicked.',
      code: { lang: 'js', code: `const app = document.___('app')\nconst button = app.querySelector('button')\n\nbutton.___('click', () => {\n  console.log('clicked!')\n})` },
      answer: [['getElementById'], ['addEventListener']],
      explanation: '`getElementById` finds one element by its `id`; `addEventListener(eventName, fn)` runs `fn` whenever that event happens.',
    },
    {
      id: 'how-the-web-works-q5',
      type: 'mcq',
      prompt: 'In a Vue project created with Vite, what does `index.html` mainly contain?',
      options: [
        { text: 'The full HTML of every page in the app', why: 'In a single-page app, Vue builds the page with JavaScript; `index.html` stays tiny.' },
        { text: 'An empty `<div id="app">` and a module script that loads `src/main.js`' },
        { text: 'Only CSS', why: 'CSS usually lives in components or imported files, not in `index.html`.' },
        { text: 'Nothing — Vue creates `index.html` in the browser', why: 'The browser needs an HTML document first; it is the starting point that loads your JavaScript.' },
      ],
      answer: 1,
      explanation: '`index.html` is the entry point. `main.js` calls `createApp(App).mount(\'#app\')`, and Vue renders everything inside that div.',
    },
    {
      id: 'how-the-web-works-q6',
      type: 'mcq',
      prompt: 'Select **all** the things the browser itself does after receiving an HTML response.',
      options: [
        { text: 'Parses the HTML into a DOM tree' },
        { text: 'Requests the CSS and JavaScript files the HTML links to' },
        { text: 'Compiles `.vue` files into JavaScript', why: 'Browsers don\'t understand `.vue` files. Build tools (Vite with the Vue plugin) compile them before the browser ever sees them.' },
        { text: 'Lays out and paints the page' },
        { text: 'Looks up the server\'s IP address for this response', why: 'The DNS lookup happened *before* the request was sent.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Parse → fetch sub-resources → layout and paint. `.vue` compilation happens at build time (or in a dev server), and DNS happens before the request.',
    },
    {
      id: 'how-the-web-works-q7',
      type: 'short',
      prompt: 'In three or four sentences, describe what happens between typing a URL and seeing the page.',
      answer: 'The browser looks up the server\'s IP address with DNS, connects to it and sends an HTTP request for the path in the URL. The server responds with a status code and an HTML document. The browser parses the HTML into the DOM, requests the linked CSS and JavaScript, then lays out and paints the page. JavaScript then runs and reacts to user events by changing the DOM.',
    },
  ],

  exercises: [
    {
      id: 'feature-page',
      title: 'Build a page structure',
      difficulty: 'beginner',
      prompt: `
Use HTML (written into \`#app\` from \`main.js\`) to build a small product page:

- an \`<h1 class="title">\` with the text **Vue/Zero**;
- a \`<ul class="features">\` with **exactly three** \`<li>\` items describing features (any text);
- a \`<footer class="footer">\` containing the text **Made with HTML, CSS & JS**.

The styles are already written in \`styles.css\`.
`,
      files: {
        'main.js': `import './styles.css'

const app = document.getElementById('app')

app.innerHTML = \`
  <h1 class="title">Vue/Zero</h1>
  <!-- TODO: a <ul class="features"> with three <li> items -->
  <!-- TODO: a <footer class="footer"> -->
\``,
        'styles.css': `body { font-family: system-ui, sans-serif; }
.title { color: #1d4ed8; }
.features li { margin: 4px 0; }
.footer { margin-top: 24px; color: #666; font-size: 0.9rem; }`,
      },
      hints: [
        'A list is a `<ul>` element whose children are `<li>` elements.',
        'Write the markup inside the backtick string, below the `<h1>`: `<ul class="features"><li>…</li>…</ul>`.',
        'The footer is just another element after the list: `<footer class="footer">Made with HTML, CSS & JS</footer>`.',
      ],
      solution: {
        explanation: 'The structure is pure HTML: elements nested inside each other. The `class` attributes connect each element to its CSS rules (and to the tests). No JavaScript behaviour was needed — the string is simply parsed into elements.',
        files: {
          'main.js': `import './styles.css'

const app = document.getElementById('app')

app.innerHTML = \`
  <h1 class="title">Vue/Zero</h1>
  <ul class="features">
    <li>Live code playgrounds</li>
    <li>Interactive visualizers</li>
    <li>Interview practice</li>
  </ul>
  <footer class="footer">Made with HTML, CSS & JS</footer>
\``,
          'styles.css': `body { font-family: system-ui, sans-serif; }
.title { color: #1d4ed8; }
.features li { margin: 4px 0; }
.footer { margin-top: 24px; color: #666; font-size: 0.9rem; }`,
        },
      },
      tests: [
        { name: 'the title says Vue/Zero', code: `expect(text('.title')).toBe('Vue/Zero')` },
        { name: 'the features list has exactly three items', code: `expect(findAll('.features li')).toHaveLength(3)\nfindAll('.features li').forEach((li) => expect(li.textContent.trim().length).toBeGreaterThan(0))` },
        { name: 'the footer mentions HTML, CSS & JS', code: `expect(text('.footer')).toContain('Made with HTML, CSS & JS')` },
      ],
    },
    {
      id: 'dark-mode',
      title: 'A dark-mode switch',
      difficulty: 'beginner',
      prompt: `
The page and its dark styles already exist. Add the **behaviour**:

- Clicking the button \`class="toggle"\` adds the class \`dark\` to the \`<main class="page">\` element; clicking again removes it.
- The button reads **Dark mode** while the page is light, and **Light mode** while it is dark.

Change only JavaScript — the CSS for \`.page.dark\` is ready in \`styles.css\`.
`,
      files: {
        'main.js': `import './styles.css'

const app = document.getElementById('app')

app.innerHTML = \`
  <main class="page">
    <h1>Reading mode</h1>
    <p>Long articles are easier on the eyes at night.</p>
    <button class="toggle" type="button">Dark mode</button>
  </main>
\`

// TODO: find the page and the button, then toggle the "dark" class on click
`,
        'styles.css': `.page { padding: 20px; background: white; color: #111; font-family: system-ui, sans-serif; }
.page.dark { background: #111; color: #f5f5f5; }`,
      },
      hints: [
        'Find both elements with `app.querySelector(\'.page\')` and `app.querySelector(\'.toggle\')`.',
        'Add a click listener on the button. `page.classList.toggle(\'dark\')` adds the class if missing and removes it if present.',
        '`classList.toggle` returns `true` when the class is now present — use it to pick the label: `button.textContent = isDark ? \'Light mode\' : \'Dark mode\'`.',
      ],
      solution: {
        explanation: 'JavaScript doesn\'t paint anything — it only switches a class, and CSS decides what "dark" looks like. That split keeps each language doing its own job, and it is exactly how Vue\'s `:class` bindings work.',
        files: {
          'main.js': `import './styles.css'

const app = document.getElementById('app')

app.innerHTML = \`
  <main class="page">
    <h1>Reading mode</h1>
    <p>Long articles are easier on the eyes at night.</p>
    <button class="toggle" type="button">Dark mode</button>
  </main>
\`

const page = app.querySelector('.page')
const button = app.querySelector('.toggle')

button.addEventListener('click', () => {
  const isDark = page.classList.toggle('dark')
  button.textContent = isDark ? 'Light mode' : 'Dark mode'
})
`,
          'styles.css': `.page { padding: 20px; background: white; color: #111; font-family: system-ui, sans-serif; }
.page.dark { background: #111; color: #f5f5f5; }`,
        },
      },
      tests: [
        { name: 'starts light with a "Dark mode" button', code: `expect(classes('.page')).not.toContain('dark')\nexpect(text('.toggle')).toBe('Dark mode')` },
        { name: 'one click turns the page dark', code: `await click('.toggle')\nexpect(classes('.page')).toContain('dark')\nexpect(text('.toggle')).toBe('Light mode')` },
        { name: 'a second click turns it light again', code: `await click('.toggle')\nawait click('.toggle')\nexpect(classes('.page')).not.toContain('dark')\nexpect(text('.toggle')).toBe('Dark mode')` },
      ],
    },
  ],

  interview: [
    {
      id: 'how-the-web-works-url-enter',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 4,
      question: 'What happens when you type a URL into the browser and press Enter?',
      answer: 'The browser resolves the domain to an IP address with DNS, opens a connection (with TLS for HTTPS) and sends an HTTP request. The server returns a response with a status code, headers and usually an HTML body. The browser parses the HTML into the DOM, fetches linked CSS, JavaScript and images, builds the render tree, lays out and paints the page, and runs JavaScript, which can attach event listeners and change the DOM later.',
      explanation: 'Interviewers want the big stages in order — find the server, ask, receive, build, draw, run — not every networking detail.',
      whyAsked: 'It is a classic open-ended question that shows how far your understanding goes beyond a framework, and how well you structure an explanation.',
      mistakes: [
        'Jumping straight to "React/Vue renders the page" and skipping the network and parsing steps.',
        'Listing steps out of order (painting before parsing).',
        'Going so deep into TCP packets that you never reach rendering.',
      ],
      followUps: [
        'Why can a script in the `<head>` fail to find an element?',
        'What changes for a Vue single-page app compared with a server-rendered page?',
        'What does caching change in this flow?',
      ],
      modelAnswer: 'First the browser turns the domain name into an IP address using DNS, often from a cache. It connects to that server — with a TLS handshake for HTTPS — and sends an HTTP GET request for the path. The server answers with a status like 200 and an HTML document. The browser parses that HTML into the DOM, requesting any CSS, scripts and images it references, combines the DOM with the CSS to lay out and paint the page, and runs the JavaScript. In a Vue SPA the HTML is nearly empty, so the visible content only appears once the bundle has loaded and Vue mounts into `#app` — which is why SSR exists for content sites.',
    },
    {
      id: 'how-the-web-works-three-layers',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What are the roles of HTML, CSS and JavaScript, and where does Vue fit in?',
      answer: 'HTML describes the structure and meaning of content, CSS describes presentation and layout, and JavaScript adds behaviour and logic. Vue is a JavaScript framework: it uses JavaScript to generate and update the HTML (the DOM) from your application state, while CSS still handles styling.',
      explanation: 'Vue doesn\'t replace the three languages — a single-file component simply groups a template (HTML), script (JavaScript) and style (CSS) for one piece of UI.',
      whyAsked: 'Checks that a candidate sees frameworks as a layer on top of the web platform, not a separate world.',
      mistakes: ['Calling Vue a "language".', 'Saying Vue replaces HTML or CSS.', 'Not mentioning that the browser only ever runs HTML, CSS and JavaScript.'],
      followUps: ['What does the browser actually receive from a `.vue` file?', 'Why is separating looks from behaviour useful?'],
      modelAnswer: 'HTML is the structure — what is on the page and what it means. CSS is the presentation — how it looks and where it sits. JavaScript is behaviour — what happens when the user interacts. Vue is a JavaScript framework on top of these: I describe the UI as a template that depends on state, and Vue creates and updates the real DOM when that state changes. A `.vue` file groups all three for one component, but the build step compiles it to plain JavaScript and CSS, because that is all the browser understands.',
    },
    {
      id: 'how-the-web-works-script-loading',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'Both scripts below are in the `<head>`, above `<body><div id="app"></div></body>`, and both run `document.getElementById(\'app\')`. Which one finds the element?',
      code: {
        lang: 'html',
        code: `<!-- A -->
<script src="a.js"></script>

<!-- B -->
<script type="module" src="b.js"></script>`,
      },
      options: ['Only A', 'Only B', 'Both', 'Neither'],
      correctOption: 1,
      answer: 'Only **B**. A classic script without `defer` or `async` runs immediately when the parser reaches it, before the body exists, so it gets `null`. Module scripts are deferred by default: they run after the document has been parsed.',
      explanation: 'This is why Vite\'s `index.html` can put `<script type="module" src="/src/main.js">` anywhere and `mount(\'#app\')` still works.',
      whyAsked: 'Script loading order causes real production bugs; the answer shows whether you know how parsing and scripts interact.',
      mistakes: ['Saying both work because "the file is downloaded fast".', 'Not knowing that `type="module"` implies deferred execution.', 'Confusing `defer` (keeps order, after parsing) with `async` (runs as soon as downloaded).'],
      followUps: ['What is the difference between `defer` and `async`?', 'Where does Vite put the script tag, and why does that work?'],
      modelAnswer: 'Only B. The parser executes a classic script the moment it reaches it, and at that point `<body>` hasn\'t been parsed, so `getElementById` returns null. Module scripts behave like `defer`: they download in parallel and run after parsing completes, so the element exists. The fixes for A are `defer`, `type="module"`, or moving the script to the end of the body. `async` would not be a reliable fix, because it runs as soon as the file arrives.',
    },
    {
      id: 'how-the-web-works-spa-vs-mpa',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare a traditional multi-page website with a single-page application (SPA) built with Vue.',
      answer: 'In a multi-page site, every navigation requests a new HTML document from the server, which renders it. In an SPA, the server sends one HTML shell and a JavaScript bundle; after that, navigation is handled in the browser (with a router) and data is fetched as JSON. SPAs give app-like transitions and keep state between pages, but the first visit needs the JavaScript before content appears, which affects first paint and can affect SEO unless you add server-side rendering or pre-rendering.',
      explanation: 'Neither is "better" — they move work between the server and the browser. Frameworks like Nuxt combine both: server-render the first page, then behave like an SPA.',
      whyAsked: 'Shows you understand the consequences of choosing Vue for a project, beyond "it is modern".',
      mistakes: ['Claiming SPAs are always faster.', 'Claiming SPAs cannot be indexed at all — modern crawlers can run JavaScript, but SSR/SSG is still the reliable choice for content-heavy pages.', 'Ignoring that an SPA server must return `index.html` for deep links.'],
      followUps: ['How does client-side routing change the URL without reloading?', 'When would you choose SSR or SSG?'],
      modelAnswer: 'A multi-page site asks the server for a full HTML page on every navigation. A Vue SPA loads one HTML shell plus a JavaScript bundle once; afterwards Vue Router swaps components in the browser and the app fetches data as JSON. That gives smooth navigation and persistent client state, but the first load depends on JavaScript, so content arrives later and SEO needs care. For dashboards behind a login an SPA is a great fit; for content and marketing pages I\'d consider SSR or static generation, for example with Nuxt.',
    },
    {
      id: 'how-the-web-works-blank-page',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your Vue app works locally, but after deployment the site is a blank white page. How do you investigate?',
      answer: 'Open DevTools. In the Console, look for errors that stopped the app before it mounted. In the Network tab, check whether `index.html`, the JS bundle and CSS loaded or returned 404 (a wrong asset base path is common when the app is served from a sub-folder). Check that `index.html` still contains `<div id="app">` and that `mount` targets it. Finally confirm production configuration (environment variables, API URLs) is correct.',
      explanation: 'Walk the page-load pipeline in order: did the HTML arrive, did the scripts arrive, did they run without errors, did Vue mount?',
      whyAsked: 'A practical scenario that shows debugging method rather than memorised facts.',
      mistakes: ['Guessing ("clear the cache?") instead of checking Console and Network.', 'Not considering the base path / sub-folder deployment.', 'Forgetting that an SPA server must serve `index.html` for unknown paths on deep links.'],
      followUps: ['Why do deep links like `/settings` sometimes return a 404 only in production?', 'How would you catch such errors in production automatically?'],
      modelAnswer: 'I\'d follow the load pipeline. First the Console: an exception during startup means Vue never mounted. Then the Network tab: if the JavaScript bundle 404s, the asset paths are wrong — typically the app is deployed under a sub-path and the build\'s base path doesn\'t match. I\'d also confirm `index.html` contains the mount element and that environment-specific config is present in the production build. Once fixed, I\'d add error monitoring so the next failure is reported instead of discovered by users.',
    },
    {
      id: 'how-the-web-works-render-links',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Without any framework, render a navigation bar into `#app` from the `links` array: a `<nav class="nav">` containing one `<a class="nav-link">` per link, with the right `href` and text.',
      starter: {
        files: {
          'main.js': `const links = [
  { text: 'Home', href: '/' },
  { text: 'Lessons', href: '/lessons' },
  { text: 'Interview prep', href: '/interview' },
]

const app = document.getElementById('app')

// TODO: render <nav class="nav"> with one <a class="nav-link"> per link
`,
        },
      },
      tests: [
        { name: 'renders one .nav-link per item', code: `expect(findAll('.nav .nav-link')).toHaveLength(3)` },
        { name: 'links have the right text and href', code: `const a = findAll('.nav-link')\nexpect(a[0].textContent.trim()).toBe('Home')\nexpect(a[1].getAttribute('href')).toBe('/lessons')\nexpect(a[2].textContent.trim()).toBe('Interview prep')` },
      ],
      hints: ['Create the `<nav>` with `document.createElement(\'nav\')` and give it `className = \'nav\'`.', 'Loop with `for (const link of links)`, create an `<a>`, set `href`, `textContent` and `className`, then `append` it to the nav.'],
      answer: 'Create a nav element, loop over the array, create one anchor per item with `href`, `textContent` and the class, append each to the nav, then append the nav to `#app`.',
      solution: {
        files: {
          'main.js': `const links = [
  { text: 'Home', href: '/' },
  { text: 'Lessons', href: '/lessons' },
  { text: 'Interview prep', href: '/interview' },
]

const app = document.getElementById('app')

const nav = document.createElement('nav')
nav.className = 'nav'

for (const link of links) {
  const a = document.createElement('a')
  a.className = 'nav-link'
  a.href = link.href
  a.textContent = link.text
  nav.append(a)
}

app.append(nav)
`,
        },
      },
      explanation: 'Using `createElement` and `textContent` (instead of concatenating HTML strings) means link text can never be interpreted as HTML — the same safety Vue\'s `{{ }}` interpolation gives you.',
      whyAsked: 'A warm-up that checks basic DOM fluency — the foundation that `v-for` automates.',
      mistakes: ['Building an HTML string with user-provided text (an XSS risk if the data is untrusted).', 'Appending to the document body instead of `#app`.', 'Forgetting to set the class names the spec asked for.'],
      followUps: ['How would `v-for` express this in a Vue template?', 'How would you highlight the link for the current page?'],
      modelAnswer: 'I\'d create the nav element once, then loop over `links`, creating an anchor for each with `href`, `textContent` and the `nav-link` class, append them, and finally append the nav to `#app`. I prefer `textContent` over string-building with innerHTML because it never parses data as HTML. In Vue this whole thing becomes `<a v-for="link in links" :key="link.href" :href="link.href" class="nav-link">{{ link.text }}</a>`.',
    },
    {
      id: 'how-the-web-works-why-framework',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'The browser can already do everything with HTML, CSS and JavaScript. Why do teams use a framework like Vue, and what does it cost them?',
      answer: 'Frameworks solve the problem of keeping the DOM in sync with changing state across a large UI. Vue lets you declare what the UI should look like for a given state, then updates the DOM efficiently when state changes; it also adds components for reuse, a consistent structure for teams, and an ecosystem (router, state management, tooling). The costs are a build step, extra JavaScript to download, an abstraction to learn and debug, and dependency upgrades to maintain.',
      explanation: 'Manual DOM code scales badly: every state change must update every place that shows it. Declarative rendering removes that bookkeeping.',
      whyAsked: 'Senior candidates are expected to justify tools with trade-offs, not enthusiasm.',
      mistakes: ['Saying "it is faster than plain JavaScript" — hand-written DOM code can be faster; the framework wins on maintainability.', 'Listing only benefits.', 'Ignoring that small, mostly static sites may not need a framework at all.'],
      followUps: ['When would you NOT use Vue?', 'What is declarative rendering?', 'How does Vue decide which DOM nodes to update?'],
      modelAnswer: 'The hard part of UIs isn\'t drawing them, it is keeping many parts consistent as data changes. In plain JavaScript every state change must manually update every element that shows it, and that bookkeeping grows with the app. Vue makes rendering declarative: the template is a function of state and reactivity re-renders what depends on what changed. Components give reuse and structure for a team. The price is a build step, bundle size, a learning curve and upgrades — so for a mostly static page I might ship plain HTML with a little JavaScript instead.',
    },
  ],

  takeaways: [
    'A web page is a client (browser) asking a server for files over HTTP, starting from a URL.',
    'HTML = structure, CSS = presentation, JavaScript = behaviour. Keep each in its lane and connect them with classes.',
    'The browser parses HTML into the DOM, applies CSS, lays out and paints, then runs JavaScript that reacts to events.',
    'Classic scripts in the `<head>` run before the body exists; `type="module"` and `defer` run after parsing.',
    'A Vue app starts from an almost empty `index.html` and builds the page inside `<div id="app">` — its main job is keeping the DOM in sync with your data.',
  ],
}
