// Lesson: HTTP, APIs & JSON.

const fakeServer = `// A fake backend so the sandbox needs no network.
// fakeFetch(url, options) imitates the browser's fetch(): it resolves with a
// Response-like object EVEN for 404 or 500, and would only reject if the
// network itself failed. (Simplified: a real Response has many more features.)

const db = {
  books: [
    { id: 1, title: 'Eloquent JavaScript', author: 'Marijn Haverbeke' },
    { id: 2, title: 'Refactoring UI', author: 'Adam Wathan & Steve Schoger' },
    { id: 3, title: "Don't Make Me Think", author: 'Steve Krug' },
  ],
}
let nextId = 4

function respond(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { 'content-type': 'application/json' },
    json: async () => JSON.parse(JSON.stringify(body)), // the body travels as text
  }
}

export function fakeFetch(url, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase()
  const { pathname, searchParams } = new URL(url, 'https://books.example')

  return new Promise((resolve) => {
    setTimeout(() => {
      if (method === 'GET' && pathname === '/api/books') {
        const q = (searchParams.get('q') ?? '').toLowerCase()
        resolve(respond(200, db.books.filter((b) => b.title.toLowerCase().includes(q))))
      } else if (method === 'GET' && pathname.startsWith('/api/books/')) {
        const id = Number(pathname.split('/').pop())
        const book = db.books.find((b) => b.id === id)
        resolve(book ? respond(200, book) : respond(404, { error: 'Book not found' }))
      } else if (method === 'POST' && pathname === '/api/books') {
        let data
        try {
          data = JSON.parse(options.body)
        } catch {
          return resolve(respond(400, { error: 'Body must be JSON' }))
        }
        if (!data || !data.title) return resolve(respond(422, { error: 'Title is required' }))
        const book = { id: nextId++, title: data.title, author: data.author ?? 'Unknown' }
        db.books.push(book)
        resolve(respond(201, book))
      } else {
        resolve(respond(404, { error: 'No such endpoint' }))
      }
    }, 200)
  })
}`

const httpMain = `import { fakeFetch } from './server.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <form class="add-form">
    <input class="title" placeholder="Book title" />
    <button type="submit">Add book</button>
  </form>
  <button class="load-missing">Load book #99</button>
  <p class="status"></p>
  <p class="error"></p>
  <ul class="books"></ul>
\`

const form = app.querySelector('.add-form')
const titleInput = app.querySelector('.title')
const status = app.querySelector('.status')
const errorBox = app.querySelector('.error')
const list = app.querySelector('.books')

function renderBooks(books) {
  list.replaceChildren(...books.map((book) => {
    const li = document.createElement('li')
    li.className = 'book'
    li.textContent = book.title + ' — ' + book.author
    return li
  }))
}

async function loadBooks() {
  status.textContent = 'Loading…'
  try {
    const response = await fakeFetch('/api/books') // 1. send a GET request
    const books = await response.json()            // 2. parse the JSON body
    renderBooks(books)
  } catch (error) {
    errorBox.textContent = error.message           // only network failures land here
  } finally {
    status.textContent = ''
  }
}

app.querySelector('.load-missing').addEventListener('click', async () => {
  errorBox.textContent = ''
  const response = await fakeFetch('/api/books/99')
  const book = await response.json()
  renderBooks([book]) // ⚠ no response.ok check: a 404 body is shown as if it were a book
})

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  errorBox.textContent = ''
  const response = await fakeFetch('/api/books', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { title: titleInput.value }, // ⚠ an object, not JSON text
  })
  const data = await response.json()
  if (!response.ok) {
    errorBox.textContent = 'Error ' + response.status + ': ' + data.error
    return
  }
  titleInput.value = ''
  loadBooks()
})

loadBooks()`

export default {
  id: 'http-apis-json',
  title: 'HTTP, APIs & JSON',
  summary: 'Understand how a frontend talks to a server: HTTP requests and responses, status codes, REST-style APIs, JSON, and the fetch() details that trip everyone up.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['async-js', 'how-the-web-works'],
  related: ['fetching-data', 'async-ui-states', 'api-production', 'service-layers', 'auth-security', 'cancellation-race-conditions'],
  tags: ['http', 'api', 'rest', 'json', 'fetch', 'status codes', 'GET', 'POST', 'headers', 'query string', 'URLSearchParams', 'CORS'],
  apis: [
    { name: 'fetch(url, options)', summary: 'Sends an HTTP request and returns a promise for a Response. It rejects only on network failure (or abort), not on 404/500.' },
    { name: 'response.ok / response.status', summary: '`ok` is true for status 200–299; `status` is the numeric code.' },
    { name: 'response.json()', summary: 'Reads the body and parses it as JSON — returns a promise.' },
    { name: 'JSON.stringify(value)', summary: 'Turns a JavaScript value into JSON text (drops functions and undefined; Dates become strings).' },
    { name: 'JSON.parse(text, reviver?)', summary: 'Turns JSON text back into JavaScript values; throws on invalid JSON.' },
    { name: 'URLSearchParams', summary: 'Builds and reads query strings with correct encoding: `new URLSearchParams({ q: \'vue 3\' })`.' },
  ],
  docs: [
    { label: 'MDN — An overview of HTTP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview' },
    { label: 'MDN — HTTP response status codes', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status' },
    { label: 'MDN — Using the Fetch API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' },
    { label: 'MDN — Working with JSON', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON' },
    { label: 'MDN — Cross-Origin Resource Sharing (CORS)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' },
    { label: 'Vue Guide — Composables (async state example)', url: 'https://vuejs.org/guide/reusability/composables.html#async-state-example' },
  ],

  intro: `
Your Vue app runs in the browser, but the data — products, users, messages — lives on a server. To get it (or change it), the app sends **HTTP requests** to an **API** and gets **responses** back, usually as **JSON**.

- **HTTP** is the language: a request says *what* you want (a **method** like \`GET\` or \`POST\`, a **URL**, some **headers**, maybe a **body**); a response says *how it went* (a **status code** like \`200\` or \`404\`) and carries data.
- An **API** (*Application Programming Interface*) is the set of URLs a server offers and the rules for using them — like a menu.
- **JSON** (*JavaScript Object Notation*) is the text format the data travels in.

In the browser you send requests with \`fetch()\`, which returns a promise — everything from the [async lesson](lesson:async-js) applies.
`,

  why: `
Almost every real Vue app is a friendly face on top of an API. Getting the plumbing right decides whether your UI tells the truth:

- \`fetch()\` **doesn't reject on 404 or 500**. If you don't check \`response.ok\`, an error page's body gets rendered as if it were data.
- A \`POST\` with a plain object as its body sends \`"[object Object]"\`. JSON must be **stringified**, and the server must be told with a \`Content-Type\` header.
- JSON can't represent dates, \`undefined\` or functions — a \`Date\` comes back as a **string**, and sorting by it silently breaks.
- Status codes tell you *what kind* of failure happened: "log in again" (401), "you're not allowed" (403), "fix your input" (422), "try again later" (503). Good UIs react differently to each.

Learn these once and you'll write API code that fails loudly and honestly instead of quietly showing nonsense.
`,

  eli15: `
Imagine sending letters to a library.

Your **request** is a letter. On the envelope: the library's address and the department (**URL**), what you want to do — "please *send* me", "please *add*", "please *remove*" (**method**) — and notes like "I can read English" (**headers**). Sometimes there's a page inside (the **body**), like the details of a book you want to donate.

The library writes back. At the top of the reply is a **status code**: \`200\` means "here you go", \`201\` "added it!", \`404\` "never heard of that book", \`500\` "sorry, our building is on fire".

Both letters are written in **JSON** — a strict, simple way of writing lists and labelled boxes that any computer can read: \`{"title": "Eloquent JavaScript", "pages": 472}\`.

One quirk: \`fetch()\` counts *any* reply as "the letter arrived" — even a reply saying "404, not found". It's your job to read the status at the top.
`,

  analogy: {
    title: 'Ordering by mail from a catalogue',
    body: `
A mail-order company publishes a catalogue of what you can order and how (the API). You fill in an order form in a standard format (JSON), put it in an envelope with the right department and instructions (URL, method, headers), and post it. The reply always comes with a slip at the top: delivered, out of stock, form filled in wrong, warehouse closed.
`,
    mapping: [
      ['the catalogue and its ordering rules', 'the API and its documentation'],
      ['the department address', 'the URL (endpoint), e.g. `/api/books/2`'],
      ['"send me" / "add" / "change" / "cancel"', 'methods: GET / POST / PUT or PATCH / DELETE'],
      ['instructions on the envelope', 'headers, e.g. `Content-Type: application/json`'],
      ['the filled-in order form', 'the JSON request body'],
      ['the slip at the top of the reply', 'the status code (200, 404, 500…)'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'One request, round trip',
    caption: 'Step through a GET request from a Vue component to the server and back, including where things can go wrong.',
    alt: 'A row of boxes: Vue component, fetch, HTTP request (GET /api/books/2 with headers), server and database, HTTP response (status 200 and JSON body), response.json, and reactive state updating the template. Steps follow the request to the server and the response back.',
    props: {
      layout: 'grid',
      cols: 4,
      nodes: [
        { id: 'comp', label: 'Component', note: 'needs book #2', tone: 'acid' },
        { id: 'fetch', label: 'fetch()', note: 'returns a promise', tone: 'paper' },
        { id: 'req', label: 'Request', note: 'GET /api/books/2', tone: 'cobalt' },
        { id: 'server', label: 'Server + DB', note: 'finds the book', tone: 'kraft' },
        { id: 'res', label: 'Response', note: '200 OK + JSON text', tone: 'cobalt' },
        { id: 'check', label: 'check ok, .json()', note: 'text → object', tone: 'red' },
        { id: 'state', label: 'book.value = data', note: 'template re-renders', tone: 'acid' },
      ],
      edges: [
        { from: 'comp', to: 'fetch' },
        { from: 'fetch', to: 'req' },
        { from: 'req', to: 'server' },
        { from: 'server', to: 'res' },
        { from: 'res', to: 'check' },
        { from: 'check', to: 'state' },
      ],
      steps: [
        { focus: ['comp', 'fetch'], edges: ['comp->fetch'], text: 'A component needs data and calls `fetch(\'/api/books/2\')` — typically through a small API module. `fetch` immediately returns a **promise**.' },
        { focus: ['req'], edges: ['fetch->req'], text: 'The browser sends an HTTP **request**: method `GET`, the URL, and headers such as `Accept: application/json` (and an `Authorization` header if the user is logged in).' },
        { focus: ['server'], edges: ['req->server'], text: 'The server routes `GET /api/books/:id`, checks the user is **allowed** to see it (authorization always happens here, never only in the frontend), and loads it from the database.' },
        { focus: ['res'], edges: ['server->res'], text: 'The **response** has a status line (`200 OK`), headers (`Content-Type: application/json`) and a body: JSON **text**. A missing book would be `404` with an error body — still a normal response.' },
        { focus: ['check'], edges: ['res->check'], text: 'The `fetch` promise fulfils with a Response **whatever the status**. Your code must check `response.ok`, then `await response.json()` to parse the text into an object.' },
        { focus: ['state'], edges: ['check->state'], text: 'Assigning the result to a ref (`book.value = data`) makes Vue re-render. Meanwhile your UI should have shown a loading state — and an error state if any step failed.' },
      ],
    },
  },

  syntax: [
    `
#### Anatomy of a request and a response
`,
    {
      code: `POST /api/books HTTP/1.1                ← method, path
Host: books.example
Content-Type: application/json          ← headers: "the body is JSON"
Accept: application/json                ←          "please answer in JSON"
Authorization: Bearer eyJhbGciOi…       ←          who is asking

{"title":"Clean Code","author":"Robert C. Martin"}   ← body

HTTP/1.1 201 Created                    ← status code + reason
Content-Type: application/json
Location: /api/books/4

{"id":4,"title":"Clean Code","author":"Robert C. Martin"}`,
      lang: 'text',
      title: 'what actually travels',
    },
    `
#### Methods (REST conventions)

| Method | Meaning | Example | Has a body? |
|---|---|---|---|
| \`GET\` | read | \`GET /api/books?q=vue\` | no |
| \`POST\` | create (or "do an action") | \`POST /api/books\` | yes |
| \`PUT\` | replace a whole resource | \`PUT /api/books/4\` | yes |
| \`PATCH\` | change part of a resource | \`PATCH /api/books/4\` | yes |
| \`DELETE\` | remove | \`DELETE /api/books/4\` | usually no |

\`GET\`, \`PUT\` and \`DELETE\` are meant to be **idempotent** — repeating the same request has the same effect as doing it once. \`POST\` usually isn't (two POSTs create two books).

#### Status codes

| Range | Meaning | Common codes |
|---|---|---|
| 2xx | success | 200 OK · 201 Created · 204 No Content |
| 3xx | redirection / cache | 301/302 redirect · 304 Not Modified |
| 4xx | the **request** has a problem | 400 Bad Request · 401 Unauthorized (not logged in) · 403 Forbidden · 404 Not Found · 409 Conflict · 422 Unprocessable Content · 429 Too Many Requests |
| 5xx | the **server** has a problem | 500 Internal Server Error · 502 Bad Gateway · 503 Service Unavailable |

#### JSON in one minute
`,
    {
      code: `{
  "id": 4,
  "title": "Clean Code",
  "tags": ["craft", "classic"],
  "inStock": true,
  "discount": null
}`,
      lang: 'json',
      title: 'valid JSON',
    },
    `
Keys and strings use **double quotes**; no trailing commas, no comments; values are strings, numbers, booleans, \`null\`, arrays and objects — **no** \`undefined\`, functions or \`Date\`s.
`,
    {
      code: `const book = { title: 'Clean Code', price: undefined, added: new Date(0), print() {} }

JSON.stringify(book)
// '{"title":"Clean Code","added":"1970-01-01T00:00:00.000Z"}'  ← undefined & function dropped, Date → string
JSON.stringify(book, null, 2)        // pretty-printed with 2-space indentation

const back = JSON.parse('{"title":"Clean Code","added":"1970-01-01T00:00:00.000Z"}')
typeof back.added                    // "string" — not a Date any more
JSON.parse("{'title': 'x'}")         // SyntaxError: single quotes aren't JSON`,
      lang: 'js',
      title: 'JSON.stringify and JSON.parse',
    },
    `
#### fetch(): the three things to remember
`,
    {
      code: `// GET
const response = await fetch('/api/books/2')
if (!response.ok) {                                   // 1. fetch doesn't reject on 404/500
  throw new Error('HTTP ' + response.status)
}
const book = await response.json()                    // 2. parsing is async too

// POST
const created = await fetch('/api/books', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Clean Code' }),      // 3. stringify the body
})

// Query strings: let URLSearchParams handle encoding
const params = new URLSearchParams({ q: 'vue & pinia', page: 2 })
await fetch('/api/books?' + params)                   // /api/books?q=vue+%26+pinia&page=2`,
      lang: 'js',
      title: 'fetch essentials',
    },
    {
      callout: 'note',
      title: 'fetch vs Axios',
      text: '`fetch` is built into browsers. **Axios** is a popular third-party library with a similar job: it rejects on non-2xx statuses, parses JSON automatically and has interceptors. Either is fine — see [Fetching data](lesson:fetching-data). The sandbox here only allows `vue`, `pinia` and `vue-router`, so examples use a simulated `fetch`.',
    },
    `
#### In Vue: keep HTTP in one place
`,
    {
      code: `// api/books.js — the only file that knows URLs and fetch details
export async function getBook(id) {
  const res = await fetch('/api/books/' + id)
  if (!res.ok) throw new Error('Could not load book (HTTP ' + res.status + ')')
  return res.json()
}

// BookPage.vue
<script setup>
import { ref, onMounted } from 'vue'
import { getBook } from './api/books.js'

const props = defineProps({ id: Number })
const book = ref(null)
const error = ref(null)

onMounted(async () => {
  try { book.value = await getBook(props.id) }
  catch (e) { error.value = e.message }
})
</script>`,
      lang: 'vue',
      title: 'an API module + a component',
      static: true,
    },
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: httpMain,
    intro: 'A book list talking to a fake server (`server.js`). Two of its three requests have classic bugs — read them, then fix them in the experiments.',
    steps: [
      { lines: [1], text: '`fakeFetch` behaves like `fetch`: it returns a promise for a Response-like object. Open `server.js` to see the routes: `GET /api/books`, `GET /api/books/:id`, `POST /api/books`.' },
      { lines: [30, 41], text: 'A correct GET: send, then `await response.json()` to parse the body. Note the comment on `catch`: with fetch, only *network* failures reject — HTTP errors arrive as normal responses.' },
      { lines: [43, 48], text: '**Bug 1.** Book #99 doesn\'t exist, so the server answers `404` with `{ error: \'Book not found\' }`. The code never checks `response.ok`, so it renders that error object as a book: "undefined — undefined".' },
      { lines: [50, 57], text: '**Bug 2.** A POST with a JSON `Content-Type`, but the body is a JavaScript object. HTTP bodies are text; the object becomes `"[object Object]"` and the server rejects it with `400`.' },
      { lines: [58, 64], text: 'This part is right: after parsing, check `response.ok` and show the server\'s error with its status code. On success, clear the input and reload the list.' },
    ],
  },

  playground: {
    title: 'Book list API client',
    objective: 'Fix the two classic fetch bugs (no status check, unstringified body) and add a query string — the three things almost every API client gets wrong at least once.',
    files: { 'main.js': httpMain, 'server.js': fakeServer },
    expected: 'After a moment, three books appear. **Load book #99** adds a nonsense "undefined — undefined" row. Adding a book shows **Error 400: Body must be JSON**.',
    experiments: [
      {
        id: 'check-ok',
        task: 'Fix **Load book #99**: when the response isn\'t OK, don\'t render it — show **Error 404: Book not found** in `.error` instead (use the status and the `error` field from the body).',
        hint: 'After `const book = await response.json()`, add `if (!response.ok) { errorBox.textContent = \'Error \' + response.status + \': \' + book.error; return }`.',
        tests: [
          { name: 'a 404 shows an error and renders no fake book', code: `await wait(250)\nawait click('.load-missing')\nawait wait(300)\nexpect(text('.error')).toContain('404')\nexpect(text('.error')).toContain('Book not found')\nexpect(text('.books')).not.toContain('undefined')` },
        ],
        explain: '`fetch` only rejects when it can\'t get *any* response (offline, DNS failure, CORS block, abort). A 404 or 500 is a perfectly good HTTP response, so the promise fulfils. Checking `response.ok` is your job — every time.',
      },
      {
        id: 'stringify-body',
        task: 'Fix the **Add book** form so the POST actually works: the new title should appear in the list.',
        hint: 'Change `body: { title: … }` to `body: JSON.stringify({ title: titleInput.value })`.',
        tests: [
          { name: 'adding "Clean Code" shows it in the list', code: `await wait(250)\nawait type('.title', 'Clean Code')\nawait submit('.add-form')\nawait wait(550)\nexpect(text('.books')).toContain('Clean Code')\nexpect(text('.error')).toBe('')` },
        ],
        explain: 'Request bodies are text (or binary). `JSON.stringify` turns the object into JSON text, and `Content-Type: application/json` tells the server how to read it. Forget either and most servers answer 400 or 415.',
      },
      {
        id: 'search',
        task: 'Add a search box: an `<input class="search">` that, on every input, requests `/api/books?q=<text>` and renders the results.',
        hint: 'Build the URL with `\'/api/books?\' + new URLSearchParams({ q: searchInput.value })`, then the same `response.ok` / `json()` / `renderBooks` steps.',
        tests: [
          { name: 'searching "refactoring" shows one book', code: `await wait(250)\nawait type('.search', 'refactoring')\nawait wait(300)\nexpect(findAll('.book')).toHaveLength(1)\nexpect(text('.books')).toContain('Refactoring UI')` },
        ],
        explain: 'Query strings carry options for GET requests. `URLSearchParams` encodes spaces, `&` and other special characters correctly — string concatenation like `\'?q=\' + text` breaks as soon as someone searches for "rock & roll". (Fast typing can also cause out-of-order responses — see [race conditions](lesson:cancellation-race-conditions).)',
      },
      {
        id: 'inspect-json',
        task: 'In `loadBooks`, add `console.log(JSON.stringify(books, null, 2))` after parsing. Then try `console.log(JSON.parse(\'{"a": 1,}\'))` and read the error.',
        hint: 'The second argument of `stringify` is a replacer (null = none); the third is the indentation.',
        explain: 'Pretty-printing is the quickest way to see an API\'s real shape. The parse error shows how strict JSON is: a trailing comma is enough to make it invalid. In real apps, open DevTools → **Network**, click a request, and look at its Headers, Payload and Response tabs.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'What survives a trip through JSON',
    caption: 'Follow one JavaScript object through `JSON.stringify`, the network and `JSON.parse`. What comes out is a new object — and not quite the same one.',
    alt: 'A row of four boxes: a JavaScript object with a string, a number, a Date, an undefined field and a function; JSON text produced by stringify; the network; and the parsed object, where the Date is now a string and the undefined field and function are gone.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'obj', label: 'JS object', note: 'title, price, added: Date, note: undefined, print()', tone: 'acid' },
        { id: 'text', label: 'JSON text', note: '{"title":…,"price":12,"added":"2026-…Z"}', tone: 'paper' },
        { id: 'net', label: 'HTTP body', note: 'just characters', tone: 'cobalt' },
        { id: 'parsed', label: 'Parsed object', note: 'added is a string!', tone: 'red' },
      ],
      edges: [
        { from: 'obj', to: 'text', label: 'JSON.stringify' },
        { from: 'text', to: 'net', label: 'send' },
        { from: 'net', to: 'parsed', label: 'JSON.parse' },
      ],
      steps: [
        { focus: ['obj'], text: 'Start with `{ title: \'Clean Code\', price: 12, added: new Date(), note: undefined, print() {} }`.' },
        { focus: ['text'], edges: ['obj->text'], text: '`JSON.stringify` keeps strings, numbers, booleans, null, arrays and plain objects. It **drops** `note` (undefined) and `print` (a function), and calls the Date\'s `toJSON()`, producing an ISO **string**.' },
        { focus: ['net'], edges: ['text->net'], text: 'Over HTTP it is only text. The server might be written in any language; JSON is the common ground.' },
        { focus: ['parsed'], edges: ['net->parsed'], text: '`JSON.parse` builds a brand-new object. `added` is now a string like `"2026-10-21T09:00:00.000Z"`. Comparing or sorting it as a date needs `new Date(added)` — or a *reviver* function passed to `JSON.parse`.' },
      ],
    },
  },

  internals: {
    beginner: `
HTTP is just text sent over a connection: a first line saying what you want, some \`Name: value\` header lines, a blank line, and an optional body. The server answers in the same shape with a status code first. JSON is a way to write data as text so the other side can rebuild it.
`,
    technical: [
      `
**What fetch does (simplified):** \`fetch(url, init)\` builds a Request, sends it, and fulfils its promise as soon as the response **headers** arrive — with a \`Response\` whose body is a stream that may still be downloading. That's why \`response.json()\` is async: it reads the rest of the stream and parses it. A body can only be read **once** (\`response.clone()\` if you need it twice).

**fetch rejects** (with a \`TypeError\`, or an \`AbortError\` when you abort) only when no HTTP response is obtained: the network is down, the hostname doesn't resolve, the browser blocks the response because of **CORS**, or the request is aborted via an \`AbortController\`. Everything else — including 4xx and 5xx — fulfils.
`,
      {
        code: `const controller = new AbortController()
const timer = setTimeout(() => controller.abort(), 5000)  // give up after 5 s

try {
  const res = await fetch('/api/report', { signal: controller.signal })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return await res.json()
} catch (e) {
  if (e.name === 'AbortError') throw new Error('The server took too long')
  throw e
} finally {
  clearTimeout(timer)
}`,
        lang: 'js',
        title: 'timeouts and cancellation with AbortController',
        static: true,
      },
      `
**CORS (Cross-Origin Resource Sharing).** An *origin* is scheme + host + port (\`https://app.example:443\`). By default, browser JavaScript may *send* requests to other origins but may only *read* the response if the server opts in with headers like \`Access-Control-Allow-Origin\`. For some requests (e.g. with \`Content-Type: application/json\` or custom headers) the browser first sends an \`OPTIONS\` **preflight** request to ask permission. CORS is enforced by the browser to protect users; it is configured on the **server**, and it is not an access-control mechanism for your API — tools like curl ignore it.

**JSON revivers.** \`JSON.parse(text, (key, value) => …)\` lets you transform values while parsing, for example turning ISO date strings back into \`Date\` objects.
`,
    ],
    production: `
- **Centralise HTTP** in an API/service module (base URL, headers, auth token, error normalisation), so components never build URLs or parse responses themselves. See [Service layers](lesson:service-layers).
- **Normalise errors**: turn non-2xx responses into \`Error\`s with a status and a user-friendly message; distinguish "you\'re offline", "please log in again" (401), "not allowed" (403), "fix the form" (400/422) and "try later" (5xx).
- **Never trust the frontend for security.** Hiding a Delete button is UX; the server must check authorization on every request. Anyone can send HTTP requests without your UI.
- **Don\'t put secrets in frontend code** — every API key in the bundle is public. Keep secret keys on a server you control. See [Secrets, CSP & dependency security](lesson:secrets-csp-dependencies).
- **CORS in development:** rather than loosening server CORS for \`localhost\`, Vite can proxy API calls: \`server: { proxy: { \'/api\': \'http://localhost:3000\' } }\` in \`vite.config.js\`. See [Env variables, CORS & production errors](lesson:api-production).
- Be careful when **retrying non-idempotent requests** (POST): a retry after a timeout can create duplicates unless the API supports idempotency keys.
- Validate the shape of important responses rather than assuming it — APIs change.
`,
  },

  mistakes: [
    {
      title: 'Not checking `response.ok`',
      wrong: { code: `const res = await fetch('/api/books/99')\nconst book = await res.json()   // { error: 'Book not found' }\nshowBook(book)                  // renders "undefined"`, lang: 'js' },
      right: { code: `const res = await fetch('/api/books/99')\nif (!res.ok) throw new Error('HTTP ' + res.status)\nconst book = await res.json()\nshowBook(book)`, lang: 'js' },
      explanation: 'fetch fulfils for every HTTP response, including errors. Check the status before trusting the body.',
    },
    {
      title: 'Sending an object as the body',
      wrong: { code: `fetch('/api/books', {\n  method: 'POST',\n  body: { title: 'Clean Code' },   // sent as "[object Object]"\n})`, lang: 'js' },
      right: { code: `fetch('/api/books', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({ title: 'Clean Code' }),\n})`, lang: 'js' },
      explanation: 'Bodies are text. Stringify the data and declare the format with `Content-Type`.',
    },
    {
      title: 'Building query strings by hand',
      wrong: { code: `fetch('/api/search?q=' + query)   // "rock & roll" → q=rock  &  roll=…`, lang: 'js' },
      right: { code: `fetch('/api/search?' + new URLSearchParams({ q: query }))\n// or: '/api/search?q=' + encodeURIComponent(query)`, lang: 'js' },
      explanation: 'Special characters (`&`, `?`, `#`, spaces) change the meaning of a URL. Let `URLSearchParams` or `encodeURIComponent` encode them.',
    },
    {
      title: 'Treating JSON dates as dates',
      wrong: { code: `const orders = await res.json()\norders.sort((a, b) => b.createdAt - a.createdAt) // strings: NaN comparisons`, lang: 'js' },
      right: { code: `const orders = (await res.json()).map((o) => ({ ...o, createdAt: new Date(o.createdAt) }))\norders.sort((a, b) => b.createdAt - a.createdAt)`, lang: 'js' },
      explanation: 'JSON has no date type, so dates arrive as strings. Convert them right after parsing, in one place.',
    },
  ],

  debugging: [
    {
      symptom: '"undefined" values appear in the UI after a failed request.',
      cause: 'The error response body was rendered because `response.ok` wasn\'t checked.',
      fix: 'Check `response.ok` (or `status`) and throw/handle errors before using the body.',
    },
    {
      symptom: '`SyntaxError: Unexpected token \'<\'` from `response.json()`.',
      cause: 'The server returned HTML (often an error page or the SPA\'s `index.html`), not JSON — wrong URL, missing proxy, or a server error.',
      fix: 'Open DevTools → Network, click the request and look at the Response tab. Fix the URL/proxy, and check `ok` before parsing.',
    },
    {
      symptom: 'The console shows "blocked by CORS policy" and fetch rejects with a `TypeError`.',
      cause: 'The API is on another origin and doesn\'t send the headers allowing your origin to read the response (or the preflight failed).',
      fix: 'Configure CORS on the server, or use Vite\'s dev proxy so the browser talks to the same origin. Don\'t try to "fix" CORS in frontend code.',
    },
    {
      symptom: 'The server answers 400 or 415 to your POST.',
      cause: 'The body isn\'t valid JSON (not stringified) or `Content-Type` is missing.',
      fix: 'Use `body: JSON.stringify(data)` with `headers: { \'Content-Type\': \'application/json\' }`. Inspect the request payload in the Network tab.',
    },
    {
      symptom: 'Logged-in features randomly fail with 401.',
      cause: 'The token expired or wasn\'t attached to the request.',
      fix: 'Attach the `Authorization` header in one central place and handle 401 globally (refresh the session or send the user to log in).',
    },
  ],

  bestPractices: [
    'Wrap fetch in one small helper that checks `ok`, parses JSON and throws meaningful errors.',
    'Always stringify JSON bodies and set `Content-Type: application/json`.',
    'Build query strings with `URLSearchParams` or `encodeURIComponent`.',
    'Convert dates (and other non-JSON types) right after parsing, in one place.',
    'Show loading, error and empty states for every request.',
    'Use the Network tab to see the real request and response before changing code.',
    'Treat frontend checks as UX only; the server must validate and authorize everything.',
  ],

  useCases: [
    'Loading lists and detail pages (`GET`) in Vue components or composables.',
    'Submitting forms (`POST`/`PUT`/`PATCH`) and showing server validation errors (400/422).',
    'Search and filters with query strings (`?q=…&page=2`).',
    'Deleting items (`DELETE`) with optimistic UI and rollback on failure.',
    'Handling expired sessions (401) and missing permissions (403) gracefully.',
    'Persisting app data as JSON in `localStorage` (`JSON.stringify` / `JSON.parse`).',
  ],

  whenToUse: {
    use: [
      '`GET` for reading — safe, cacheable, bookmarkable with query strings.',
      '`POST` for creating or for actions that aren\'t simple reads.',
      '`PATCH` for partial updates; `PUT` when replacing the whole resource.',
      'JSON for structured data between your app and APIs.',
    ],
    avoid: [
      'Changing data with `GET` requests (crawlers and prefetchers may trigger them).',
      'Putting secrets or passwords in query strings — URLs end up in logs and history.',
      'Relying on the frontend to enforce permissions.',
      'Assuming every response body is JSON (204 No Content has no body; error pages may be HTML).',
    ],
  },

  comparison: {
    title: 'How different failures reach your code with fetch',
    headers: ['Situation', 'fetch promise', '`response.ok`', 'What your UI should say'],
    rows: [
      ['200 with data', 'fulfils', '`true`', 'show the data'],
      ['404 Not Found', 'fulfils', '`false`', '"We couldn\'t find that"'],
      ['401 / 403', 'fulfils', '`false`', '"Please log in" / "You don\'t have access"'],
      ['422 validation error', 'fulfils', '`false`', 'show field errors from the body'],
      ['500 / 503', 'fulfils', '`false`', '"Something went wrong, try again"'],
      ['offline / DNS / CORS block', '**rejects** (TypeError)', '—', '"Check your connection"'],
      ['aborted by you', '**rejects** (AbortError)', '—', 'usually nothing (intentional)'],
    ],
    note: 'Next level: [Fetching data](lesson:fetching-data) and [Loading, error & empty states](lesson:async-ui-states) put this into Vue components.',
  },

  quiz: [
    {
      id: 'http-apis-json-q1',
      type: 'mcq',
      prompt: 'Which method should a "Create account" form use to send its data?',
      options: [
        { text: '`GET`', why: '`GET` is for reading; data would end up in the URL (and logs), and GETs should not change server state.' },
        { text: '`POST`' },
        { text: '`DELETE`', why: '`DELETE` removes a resource.' },
        { text: '`HEAD`', why: '`HEAD` is a GET without a body in the response — for checking headers.' },
      ],
      answer: 1,
      explanation: '`POST` creates a resource, with the data in the request body.',
    },
    {
      id: 'http-apis-json-q2',
      type: 'output',
      prompt: 'The server answers `/api/missing` with status 404. What is logged?',
      code: { lang: 'js', code: `try {\n  const res = await fetch('/api/missing')\n  console.log('A', res.ok, res.status)\n} catch (e) {\n  console.log('B', e.message)\n}` },
      options: [
        { text: 'A true 404', why: '`ok` is true only for statuses 200–299.' },
        { text: 'A false 404' },
        { text: 'B Not Found', why: 'fetch doesn\'t reject for HTTP error statuses — only for network failures.' },
        { text: 'Nothing — it hangs', why: 'The promise fulfils as soon as the response arrives.' },
      ],
      answer: 1,
      explanation: 'A 404 is a valid HTTP response, so the promise fulfils with `ok: false` and `status: 404`.',
    },
    {
      id: 'http-apis-json-q3',
      type: 'output',
      prompt: 'What does this print?',
      code: { lang: 'js', code: `const user = { name: 'Ada', age: undefined, greet() {}, joined: new Date(0) }\nconsole.log(JSON.stringify(user))` },
      options: [
        { text: '{"name":"Ada","age":undefined,"greet":{},"joined":{}}', why: '`undefined` and functions are not valid JSON values; they are dropped from objects.' },
        { text: '{"name":"Ada","joined":"1970-01-01T00:00:00.000Z"}' },
        { text: '{"name":"Ada","age":null,"joined":0}', why: 'Missing values aren\'t converted to null in objects, and Dates become ISO strings, not numbers.' },
        { text: 'TypeError', why: '`stringify` handles these types by skipping or converting them.' },
      ],
      answer: 1,
      explanation: 'Properties holding `undefined` or functions are omitted; a Date is converted with its `toJSON()` method into an ISO string.',
    },
    {
      id: 'http-apis-json-q4',
      type: 'bug',
      prompt: 'The server keeps answering **400 Bad Request: Body must be JSON**. Click the buggy line.',
      code: { lang: 'js', code: `async function addBook(title) {\n  const res = await fetch('/api/books', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: { title },\n  })\n  return res.json()\n}` },
      answerLine: 5,
      explanation: 'The body is a JavaScript object, which is sent as the text "[object Object]". It must be `JSON.stringify({ title })`.',
    },
    {
      id: 'http-apis-json-q5',
      type: 'fill',
      prompt: 'Complete a safe GET helper.',
      code: { lang: 'js', code: `async function getJSON(url) {\n  const response = await fetch(url)\n  if (!response.___) {\n    throw new Error('HTTP ' + response.status)\n  }\n  return response.___()\n}` },
      answer: [['ok'], ['json']],
      explanation: 'Check `response.ok` (true for 2xx), then parse the body with `response.json()`, which returns a promise.',
    },
    {
      id: 'http-apis-json-q6',
      type: 'mcq',
      prompt: 'Select **all** the status codes that mean "the problem is with the request" (client error).',
      options: [
        { text: '200', why: '2xx means success.' },
        { text: '401' },
        { text: '404' },
        { text: '422' },
        { text: '500', why: '5xx means the server failed.' },
        { text: '301', why: '3xx means redirection.' },
      ],
      answer: [1, 2, 3],
      explanation: '4xx codes are client errors: not authenticated (401), not found (404), invalid content (422).',
    },
    {
      id: 'http-apis-json-q7',
      type: 'short',
      prompt: 'Your app at `http://localhost:5173` calls an API at `https://api.example.com` and gets a CORS error. What is happening, and who needs to fix it?',
      answer: 'The browser enforces the same-origin policy: JavaScript from one origin may only read responses from another origin if that server allows it with CORS headers such as `Access-Control-Allow-Origin` (and answers the preflight OPTIONS request when needed). The API server isn\'t allowing the app\'s origin, so the browser blocks the response and fetch rejects. The fix is server configuration — or, in development, Vite\'s proxy so requests go to the same origin. Frontend code can\'t bypass it.',
    },
  ],

  exercises: [
    {
      id: 'get-json',
      title: 'A safe getJSON helper',
      difficulty: 'intermediate',
      prompt: `
Implement \`getJSON(url)\` in \`http.js\` using \`fakeFetch\` from \`server.js\`:

- On a 2xx response, resolve with the parsed JSON.
- On any other status, **reject** with an \`Error\` whose message is \`'HTTP <status>: <error>'\`, where \`<error>\` is the \`error\` field of the JSON body — e.g. \`'HTTP 404: Book not found'\`.

The page shows book #2 in \`.book\` and the result of loading book #99 in \`.error\`.
`,
      files: {
        'http.js': `import { fakeFetch } from './server.js'

export async function getJSON(url) {
  const response = await fakeFetch(url)
  return response.json()
}`,
        'server.js': fakeServer,
        'main.js': `import { getJSON } from './http.js'

const app = document.getElementById('app')
app.innerHTML = '<p class="book">Loading…</p><p class="error"></p>'

getJSON('/api/books/2')
  .then((book) => { app.querySelector('.book').textContent = book.title })
  .catch((e) => { app.querySelector('.book').textContent = e.message })

getJSON('/api/books/99')
  .then((book) => { app.querySelector('.error').textContent = 'Loaded: ' + book.title })
  .catch((e) => { app.querySelector('.error').textContent = e.message })`,
      },
      hints: [
        'Parse the body first (`const data = await response.json()`) — you need it in both cases.',
        'Then `if (!response.ok) throw new Error(\'HTTP \' + response.status + \': \' + data.error)`.',
        'Inside an `async` function, `throw` rejects the returned promise. Otherwise `return data`.',
      ],
      solution: {
        explanation: 'The helper turns "HTTP said no" into a rejected promise, so every caller can use one `try/catch` for both network and HTTP failures — and the error message carries the status and the server\'s reason. This is the core of every API layer.',
        files: {
          'http.js': `import { fakeFetch } from './server.js'

export async function getJSON(url) {
  const response = await fakeFetch(url)
  const data = await response.json()
  if (!response.ok) {
    throw new Error('HTTP ' + response.status + ': ' + data.error)
  }
  return data
}`,
          'server.js': fakeServer,
          'main.js': `import { getJSON } from './http.js'

const app = document.getElementById('app')
app.innerHTML = '<p class="book">Loading…</p><p class="error"></p>'

getJSON('/api/books/2')
  .then((book) => { app.querySelector('.book').textContent = book.title })
  .catch((e) => { app.querySelector('.book').textContent = e.message })

getJSON('/api/books/99')
  .then((book) => { app.querySelector('.error').textContent = 'Loaded: ' + book.title })
  .catch((e) => { app.querySelector('.error').textContent = e.message })`,
        },
      },
      tests: [
        { name: 'resolves with data on success', code: `const { getJSON } = requireModule('http.js')\nconst books = await getJSON('/api/books')\nexpect(books).toHaveLength(3)\nconst book = await getJSON('/api/books/2')\nexpect(book.title).toBe('Refactoring UI')` },
        { name: 'rejects with status and reason on 404', code: `const { getJSON } = requireModule('http.js')\nlet message = ''\ntry { await getJSON('/api/books/99') } catch (e) { message = e.message }\nexpect(message).toBe('HTTP 404: Book not found')` },
        { name: 'the page shows both outcomes', code: `await wait(300)\nexpect(text('.book')).toBe('Refactoring UI')\nexpect(text('.error')).toBe('HTTP 404: Book not found')` },
      ],
    },
    {
      id: 'json-dates',
      title: 'Round-trip a todo through JSON',
      difficulty: 'intermediate',
      prompt: `
Todos are saved as JSON (for an API or \`localStorage\`) and loaded back. Implement in \`todo-json.js\`:

- \`serializeTodo(todo)\` → a JSON **string**. A missing or \`undefined\` \`done\` must be saved as \`false\` (JSON would otherwise drop it).
- \`parseTodo(text)\` → an object where \`dueDate\` is a real \`Date\` again (or \`null\` if it was \`null\` or missing), and \`done\` is a boolean.

The page shows a parsed todo\'s due date in \`.due\` using \`toISOString()\`.
`,
      files: {
        'todo-json.js': `export function serializeTodo(todo) {
  return JSON.stringify(todo)
}

export function parseTodo(text) {
  return JSON.parse(text)
}`,
        'main.js': `import { serializeTodo, parseTodo } from './todo-json.js'

const todo = { id: 1, title: 'Pay rent', dueDate: new Date('2026-11-01T09:00:00.000Z') }
const saved = serializeTodo(todo)
const loaded = parseTodo(saved)

const app = document.getElementById('app')
app.innerHTML = '<pre class="saved"></pre><p class="due"></p><p class="done"></p>'
app.querySelector('.saved').textContent = saved
app.querySelector('.due').textContent = loaded.dueDate instanceof Date ? loaded.dueDate.toISOString() : 'not a Date: ' + loaded.dueDate
app.querySelector('.done').textContent = 'done: ' + loaded.done`,
      },
      hints: [
        'In `serializeTodo`, spread the todo and override `done`: `{ ...todo, done: todo.done ?? false }`. `JSON.stringify` turns the Date into an ISO string for you.',
        'In `parseTodo`, parse first, then return `{ ...data, dueDate: …, done: Boolean(data.done) }`.',
        'For the date: `data.dueDate ? new Date(data.dueDate) : null`.',
      ],
      solution: {
        explanation: 'JSON has no Date or undefined, so the boundary code fixes types in both directions: defaults are filled in before stringifying, and dates are rebuilt right after parsing. Doing this in one module means the rest of the app always gets real Dates and real booleans.',
        files: {
          'todo-json.js': `export function serializeTodo(todo) {
  return JSON.stringify({ ...todo, done: todo.done ?? false })
}

export function parseTodo(text) {
  const data = JSON.parse(text)
  return {
    ...data,
    done: Boolean(data.done),
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
  }
}`,
          'main.js': `import { serializeTodo, parseTodo } from './todo-json.js'

const todo = { id: 1, title: 'Pay rent', dueDate: new Date('2026-11-01T09:00:00.000Z') }
const saved = serializeTodo(todo)
const loaded = parseTodo(saved)

const app = document.getElementById('app')
app.innerHTML = '<pre class="saved"></pre><p class="due"></p><p class="done"></p>'
app.querySelector('.saved').textContent = saved
app.querySelector('.due').textContent = loaded.dueDate instanceof Date ? loaded.dueDate.toISOString() : 'not a Date: ' + loaded.dueDate
app.querySelector('.done').textContent = 'done: ' + loaded.done`,
        },
      },
      tests: [
        { name: 'dates survive the round trip as Date objects', code: `const { serializeTodo, parseTodo } = requireModule('todo-json.js')\nconst back = parseTodo(serializeTodo({ id: 1, title: 'Pay rent', dueDate: new Date('2026-11-01T09:00:00.000Z') }))\nexpect(back.dueDate instanceof Date).toBe(true)\nexpect(back.dueDate.toISOString()).toBe('2026-11-01T09:00:00.000Z')\nexpect(back.title).toBe('Pay rent')` },
        { name: 'missing or null dates become null', code: `const { parseTodo } = requireModule('todo-json.js')\nexpect(parseTodo('{"id":2,"title":"x","dueDate":null}').dueDate).toBeNull()\nexpect(parseTodo('{"id":3,"title":"y"}').dueDate).toBeNull()` },
        { name: 'done defaults to false', code: `const { serializeTodo, parseTodo } = requireModule('todo-json.js')\nconst text = serializeTodo({ id: 4, title: 'z', done: undefined })\nexpect(text).toContain('"done":false')\nexpect(parseTodo(text).done).toBe(false)` },
        { name: 'the page shows the due date', code: `expect(text('.due')).toBe('2026-11-01T09:00:00.000Z')\nexpect(text('.done')).toBe('done: false')` },
      ],
    },
  ],

  interview: [
    {
      id: 'http-apis-json-methods',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Explain the difference between GET, POST, PUT and PATCH. What does "idempotent" mean here?',
      answer: 'GET reads a resource and should not change server state; parameters go in the URL. POST creates a resource or triggers an action, with data in the body. PUT replaces a resource entirely at a known URL; PATCH applies a partial update. Idempotent means repeating the same request has the same effect as sending it once: GET, PUT and DELETE are defined as idempotent, POST generally is not (two POSTs may create two records), and PATCH may or may not be depending on the operation.',
      explanation: 'Methods express intent; that intent lets caches, browsers, proxies and retries behave safely.',
      whyAsked: 'Basic API literacy needed for designing and consuming endpoints correctly.',
      mistakes: ['Saying GET can\'t have query parameters or POST can\'t be used for reads ever.', 'Mixing up PUT (replace) and PATCH (partial).', 'Not knowing why idempotency matters for retries.'],
      followUps: ['Why is it dangerous to change data with a GET link?', 'How would you safely retry a POST that timed out?'],
      modelAnswer: 'GET is a read — safe, cacheable, parameters in the query string. POST creates something or performs an action, with a body. PUT replaces the whole resource at a URL, while PATCH changes only the fields you send. Idempotent means doing it twice has the same effect as once: GET, PUT and DELETE are, POST usually isn\'t. That matters for retries — I can retry a PUT after a timeout, but retrying a POST could create a duplicate order unless the API supports an idempotency key.',
    },
    {
      id: 'http-apis-json-fetch-errors',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'The API returns `500 Internal Server Error` with an HTML error page. Which line does this code reach?',
      code: {
        lang: 'js',
        code: `try {
  const res = await fetch('/api/orders')
  const orders = await res.json()       // line A
  render(orders)                        // line B
} catch (e) {
  showError(e.message)                  // line C
}`,
      },
      options: ['B — fetch succeeded, so orders render', 'C, because fetch rejects on 500', 'C, because res.json() throws a SyntaxError parsing the HTML', 'Neither — the promise never settles'],
      correctOption: 2,
      answer: 'It reaches C — but not because fetch rejected. fetch fulfils for a 500, then `res.json()` tries to parse the HTML page and throws a `SyntaxError` ("Unexpected token \'<\'"), which lands in `catch`. If the 500 had a JSON body, line B would render the error object as orders. Check `res.ok` before parsing.',
      explanation: 'The code "works" by accident here, with a confusing error message; it would silently misbehave with a JSON error body.',
      whyAsked: 'Shows whether you know fetch\'s error semantics precisely rather than by assumption.',
      mistakes: ['Saying fetch rejects on 500.', 'Not noticing the JSON parse error.', 'Not recommending a central helper.'],
      followUps: ['When does fetch actually reject?', 'How would you surface the server\'s error message to the user?'],
      modelAnswer: 'It ends up in the catch, but for the wrong reason. fetch fulfils for any HTTP response including 500; the failure comes from `res.json()` choking on the HTML error page, so the user sees "Unexpected token" instead of a useful message. With a JSON error body it would even render the error as data. I\'d check `res.ok` first and throw an error with the status — ideally in one shared helper.',
    },
    {
      id: 'http-apis-json-401-403',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What is the difference between 401 and 403, and how should a Vue app react to each?',
      answer: '401 Unauthorized actually means *unauthenticated*: the request has no valid credentials (not logged in, token expired). The app should try to refresh the session if it has a mechanism, otherwise send the user to log in and come back afterwards. 403 Forbidden means the server knows who you are but you\'re not allowed to do this; re-logging won\'t help, so show a "you don\'t have access" message and hide or disable the action in the UI. Either way, the server enforces the rule — the UI only reflects it.',
      explanation: '401 = "who are you?"; 403 = "I know who you are, and no."',
      whyAsked: 'Correct auth error handling is a common source of broken UX and security misunderstandings.',
      mistakes: ['Treating them as the same.', 'Redirecting to login on 403 (infinite loops for logged-in users).', 'Relying on hidden buttons as the security measure.'],
      followUps: ['Where would you handle 401 globally?', 'How do route guards relate to this?'],
      modelAnswer: '401 means the request isn\'t authenticated — no token or an expired one — so I\'d attempt a silent refresh if the app supports it, otherwise redirect to login and remember where the user was. 403 means authenticated but not permitted, so logging in again won\'t help; I show an access-denied state. I handle 401 centrally in the API layer so components don\'t each reinvent it. And I\'m explicit that hiding buttons or route guards are UX — the backend must reject unauthorized requests itself.',
    },
    {
      id: 'http-apis-json-cors',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'In development your Vue app (`localhost:5173`) can\'t call the backend (`localhost:3000`): the console says "blocked by CORS policy". A teammate suggests a browser extension that disables CORS. What do you actually do?',
      answer: 'Different ports are different origins, so the browser requires the backend to allow the app\'s origin via CORS headers (and to answer preflight `OPTIONS` requests for JSON or authenticated calls). Options: configure the backend\'s CORS settings for the allowed origins, or use Vite\'s dev proxy (`server.proxy: { \'/api\': \'http://localhost:3000\' }`) so the browser only ever talks to `localhost:5173`. Disabling CORS in your browser hides the problem locally and fixes nothing for users. In production, serving the API behind the same origin (reverse proxy) or configuring exact allowed origins on the server are the usual solutions.',
      explanation: 'CORS is a browser rule that protects users; the server decides who may read its responses.',
      whyAsked: 'Nearly every frontend developer hits CORS; the answer reveals whether they understand it or just work around it.',
      mistakes: ['Thinking CORS can be fixed with frontend headers.', 'Setting `Access-Control-Allow-Origin: *` together with credentials (not allowed).', 'Believing CORS protects the API from non-browser clients.'],
      followUps: ['What triggers a preflight request?', 'Why can\'t `*` be used with cookies?', 'Does CORS protect your API from attackers?'],
      modelAnswer: 'Ports count as part of the origin, so the browser blocks reading the response unless the backend sends CORS headers permitting `http://localhost:5173`, and handles the preflight for JSON or authenticated requests. In development I\'d use Vite\'s proxy so the frontend calls `/api` on its own origin and Vite forwards it. For production either the API sits behind the same domain, or the server lists the exact allowed origins. A CORS-disabling extension only changes my browser, so it would hide a real deployment problem. And CORS isn\'t API security — curl ignores it — so authentication and authorization still live on the server.',
    },
    {
      id: 'http-apis-json-date-sort',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Orders should be sorted newest first, but the order looks random. What\'s wrong?',
      code: {
        lang: 'js',
        code: `const res = await fetch('/api/orders')
const orders = await res.json()
// orders[0].createdAt === "2026-10-20T08:15:00.000Z"
orders.sort((a, b) => b.createdAt - a.createdAt)`,
      },
      answer: '`createdAt` is a string after JSON parsing — JSON has no Date type. Subtracting two strings gives `NaN`, and a comparator returning `NaN` produces an unreliable order. Convert to dates (or timestamps) first: `orders.map((o) => ({ ...o, createdAt: new Date(o.createdAt) }))`, or compare with `Date.parse(...)`. (ISO 8601 strings in the same timezone format also sort correctly with `localeCompare`, but converting is clearer.)',
      explanation: 'Everything that comes out of `JSON.parse` is a string, number, boolean, null, array or plain object.',
      whyAsked: 'Tests understanding of JSON\'s type limits — a frequent real bug.',
      mistakes: ['Blaming sort stability.', 'Fixing it in one component instead of at the API boundary.', 'Not knowing the comparator returns NaN.'],
      followUps: ['Where in the app would you convert API dates?', 'How would a JSON reviver help?'],
      modelAnswer: 'After `JSON.parse`, `createdAt` is a string, because JSON has no date type, so the comparator subtracts strings and returns NaN, which makes the sort order meaningless. I\'d convert dates once at the API boundary — mapping each order to have a real Date — so every component gets proper types. Then `b.createdAt - a.createdAt` works because Dates subtract as timestamps.',
    },
    {
      id: 'http-apis-json-api-layer',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How would you structure API calls in a medium-sized Vue app?',
      answer: 'Three layers. (1) A small HTTP client module: base URL from environment config, default headers, auth token injection, JSON parsing, `ok` checking, timeout/abort support and normalised errors (status, message, field errors). (2) Resource modules (`api/books.js`, `api/orders.js`) exposing domain functions like `getBook(id)` and converting response types (dates, money) at the boundary. (3) Consumers: composables (`useBook(id)`) or Pinia store actions that hold loading/error/data state, handle races and caching, and are used by components. Components never build URLs or call fetch directly. Global concerns — 401 handling, error reporting — live in the client.',
      explanation: 'Each layer has one reason to change: transport, endpoint shapes, or UI state.',
      whyAsked: 'A common architecture question; it reveals whether you can keep a growing codebase consistent and testable.',
      mistakes: ['Calling fetch directly in many components with copy-pasted error handling.', 'Putting UI state (loading flags) in the HTTP client.', 'Forgetting type conversion and error normalisation.'],
      followUps: ['Where does caching belong?', 'How would you test components without a real server?', 'When would you use a library like TanStack Query instead?'],
      modelAnswer: 'I separate transport, endpoints and state. A thin HTTP client wraps fetch with the base URL, auth header, JSON handling, `ok` checks, timeouts and a normalised error type. On top of that, resource modules expose functions like `getBook(id)` and convert things like dates at the boundary. Components consume those through composables or Pinia actions that own loading, error and data state and handle races or caching. That keeps components simple, lets me mock one layer in tests, and puts cross-cutting behaviour like 401 handling in exactly one place. For heavy caching needs I\'d consider a dedicated data-fetching library rather than hand-rolling it.',
    },
    {
      id: 'http-apis-json-build-url',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Implement `buildUrl(path, params)` in `url.js`: return `path` plus a correctly encoded query string from `params`. Skip parameters whose value is `null`, `undefined` or an empty string; for array values, repeat the key (`tag=a&tag=b`). If nothing remains, return `path` without a `?`.',
      starter: {
        files: {
          'url.js': `export function buildUrl(path, params = {}) {
  // TODO
  return path + '?' + Object.entries(params).map(([k, v]) => k + '=' + v).join('&')
}`,
          'main.js': `import { buildUrl } from './url.js'

const app = document.getElementById('app')
app.innerHTML = '<code class="url"></code>'
app.querySelector('.url').textContent = buildUrl('/api/books', { q: 'rock & roll', page: 2, author: '', tag: ['music', 'history'] })`,
        },
      },
      tests: [
        { name: 'encodes values and skips empty ones', code: `const { buildUrl } = requireModule('url.js')\nexpect(buildUrl('/api/books', { q: 'rock & roll', page: 2, author: '', sort: null, x: undefined })).toBe('/api/books?q=rock+%26+roll&page=2')` },
        { name: 'repeats keys for arrays', code: `const { buildUrl } = requireModule('url.js')\nexpect(buildUrl('/s', { tag: ['a', 'b'] })).toBe('/s?tag=a&tag=b')` },
        { name: 'no params → no question mark', code: `const { buildUrl } = requireModule('url.js')\nexpect(buildUrl('/s', {})).toBe('/s')\nexpect(buildUrl('/s', { q: '' })).toBe('/s')\nexpect(buildUrl('/s')).toBe('/s')` },
      ],
      hints: ['Create `const search = new URLSearchParams()` and loop over `Object.entries(params)`.', 'Skip `null`/`undefined`/`\'\'`; for arrays call `search.append(key, item)` per item; otherwise `search.append(key, value)`. Then `const qs = search.toString()` and return `qs ? path + \'?\' + qs : path`.'],
      answer: 'Loop over the entries, skip empty values, append each value (or each array item) to a `URLSearchParams`, and only add `?` when the resulting string is non-empty.',
      solution: {
        files: {
          'url.js': `export function buildUrl(path, params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item)
    } else {
      search.append(key, value)
    }
  }
  const query = search.toString()
  return query ? path + '?' + query : path
}`,
          'main.js': `import { buildUrl } from './url.js'

const app = document.getElementById('app')
app.innerHTML = '<code class="url"></code>'
app.querySelector('.url').textContent = buildUrl('/api/books', { q: 'rock & roll', page: 2, author: '', tag: ['music', 'history'] })`,
        },
      },
      explanation: '`URLSearchParams` handles encoding (space → `+`, `&` → `%26`) so values can\'t break the URL structure; the skip rule keeps URLs clean for optional filters.',
      whyAsked: 'Query strings for filters and pagination are everyday frontend work, and hand-built URLs are a classic bug source.',
      mistakes: ['Concatenating strings without encoding.', 'Dropping `0` or `false` by using a truthiness check.', 'Leaving a trailing `?` when no params remain.'],
      followUps: ['How would you sync these filters with the route query in Vue Router?', 'How would you parse a query string back into an object?'],
      modelAnswer: 'I build a URLSearchParams, iterate the entries, skip null, undefined and empty strings — explicitly, so 0 and false still count — append each array item under the same key, and append everything else. Then I only add the question mark if the serialized string isn\'t empty. URLSearchParams does the encoding, so a search for "rock & roll" can\'t inject an extra parameter.',
    },
  ],

  takeaways: [
    'A request has a method, URL, headers and optional body; a response has a status code, headers and a body.',
    'GET reads, POST creates, PUT replaces, PATCH updates, DELETE removes. 2xx success, 4xx client error, 5xx server error.',
    '`fetch` fulfils for every HTTP response — check `response.ok` — and rejects only on network failure, CORS blocks or abort.',
    'Send JSON with `JSON.stringify` + `Content-Type: application/json`; read it with `await response.json()`.',
    'JSON has no Date, undefined or functions — convert types at the API boundary.',
    'Keep HTTP code in one layer, show loading/error states, and remember: the server, not the UI, enforces security.',
  ],
}
