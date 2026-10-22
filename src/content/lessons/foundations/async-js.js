// Lesson: Async JavaScript — promises, async/await & the event loop.

const asyncApi = `// A fake server. The sandbox has no network, so we simulate
// a slow request with setTimeout and a Promise.
const users = {
  1: { id: 1, name: 'Ada' },
  2: { id: 2, name: 'Grace' },
  3: { id: 3, name: 'Linus' },
}

export function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users[id]
      if (user) resolve(user)
      else reject(new Error('User ' + id + ' not found'))
    }, 300)
  })
}`

const asyncMain = `import { fetchUser } from './api.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <input class="user-id" type="number" value="1" min="1" />
  <button class="load">Load user</button>
  <p class="status">Pick an id and press Load.</p>
\`

const idInput = app.querySelector('.user-id')
const loadButton = app.querySelector('.load')
const status = app.querySelector('.status')

async function loadUser() {
  status.textContent = 'Loading…'
  try {
    const user = await fetchUser(Number(idInput.value)) // pause here; the page stays responsive
    status.textContent = 'Hello, ' + user.name + '!'
  } catch (error) {
    status.textContent = 'Something went wrong.'
  }
}

loadButton.addEventListener('click', loadUser)

// Predict the order of these four logs before opening the console!
console.log('A: synchronous')
setTimeout(() => console.log('B: timer'), 0)
Promise.resolve().then(() => console.log('C: promise callback'))
console.log('D: synchronous')`

export default {
  id: 'async-js',
  title: 'Async JavaScript: promises, async/await & the event loop',
  summary: 'Learn how JavaScript waits for slow things without freezing the page — callbacks, promises, async/await and the event loop that schedules them.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['js-essentials', 'array-methods'],
  related: ['http-apis-json', 'next-tick', 'fetching-data', 'async-ui-states', 'cancellation-race-conditions', 'watch'],
  tags: ['javascript', 'async', 'promises', 'async await', 'event loop', 'microtasks', 'setTimeout', 'Promise.all', 'error handling', 'nextTick'],
  apis: [
    { name: 'new Promise((resolve, reject) => …)', summary: 'Wraps a future result. Call `resolve(value)` on success or `reject(error)` on failure.' },
    { name: 'promise.then / catch / finally', summary: 'Run code when the promise fulfils, rejects, or either. Each returns a new promise, so calls chain.' },
    { name: 'async / await', summary: '`async` functions always return a promise; `await` pauses the function until a promise settles.' },
    { name: 'Promise.all([...])', summary: 'Waits for all promises in parallel; rejects as soon as one rejects.' },
    { name: 'Promise.allSettled([...])', summary: 'Waits for all promises and reports each one\'s outcome; never rejects.' },
    { name: 'setTimeout(fn, ms)', summary: 'Schedules `fn` as a task after at least `ms` milliseconds.' },
  ],
  docs: [
    { label: 'MDN — Using promises', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises' },
    { label: 'MDN — async function', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function' },
    { label: 'MDN — Using microtasks', url: 'https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide' },
    { label: 'Vue API — nextTick()', url: 'https://vuejs.org/api/general.html#nexttick' },
  ],

  intro: `
Some things take time: downloading data, waiting for a timer, reading a file. If JavaScript simply stopped and waited, the whole page would freeze — no scrolling, no clicking, no typing.

So JavaScript doesn't wait. It **starts** the slow thing, carries on with other work, and **comes back** when the result is ready. This lesson is about the tools for "come back later":

- **callbacks** — "call this function when you're done";
- **promises** — an object representing a result that will arrive later (or fail);
- **async/await** — syntax that lets you write promise code that reads top-to-bottom;
- the **event loop** — the scheduler that decides what runs next.

Every Vue app that loads data uses these, and Vue itself uses the event loop to batch screen updates (that's what \`nextTick()\` is about).
`,

  why: `
JavaScript in a browser tab runs your code on **one thread**: it can only do one thing at a time. The same thread also handles clicks and (between your tasks) lets the browser update the screen. A slow, blocking operation would lock all of that up.

Async APIs solve this by splitting work into "start now" and "finish later". But they come with new problems you need to understand to write correct apps:

- **Order:** code after an \`await\` runs *later* — sometimes after other code you'd expect to come second.
- **Errors:** a rejected promise that nobody catches doesn't crash where you expect; it surfaces as an "Unhandled promise rejection".
- **Concurrency:** two requests can come back in a different order than you sent them, so the screen can show stale data.

In Vue you'll write \`async\` functions in \`onMounted\`, watchers and event handlers, show loading and error states, and occasionally \`await nextTick()\`. All of it rests on this lesson.
`,

  eli15: `
Imagine ordering at a busy café.

You order a hot chocolate, and the barista hands you a **buzzer**. You don't stand frozen at the counter — you go find a seat, chat, read. When your drink is ready, the buzzer goes off and you go collect it. If they've run out of chocolate, the buzzer flashes red instead.

That buzzer is a **promise**: "I don't have your result yet, but I promise to tell you when I do — or tell you it failed."

\`await\` is you saying "I'll wait right here for *this* buzzer before doing the next step of *this* plan" — but the café (the rest of the page) keeps running.

And the **event loop** is the barista's to-do list: finish the current order, then handle all the quick "urgent" jobs (promise callbacks), then pick the next order from the queue (timers, clicks).
`,

  analogy: {
    title: 'A café with buzzers',
    body: `
One barista (the single JavaScript thread) serves everyone. Long jobs — steaming milk, baking — happen in the background machines (the browser's timers, network and so on). When a background job finishes, its ticket goes into a queue. The barista finishes what they're doing, clears the urgent "hand-over" tickets, then takes the next queued order.
`,
    mapping: [
      ['the one barista', 'the JavaScript thread (call stack)'],
      ['background machines', 'browser APIs: timers, network, file reading'],
      ['a buzzer', 'a promise: pending → fulfilled or rejected'],
      ['"wait for this buzzer, then continue my plan"', '`await` inside an `async` function'],
      ['urgent hand-over tickets', 'the microtask queue (promise callbacks)'],
      ['the queue of new orders', 'the task queue (timers, events)'],
    ],
  },

  visual: {
    type: 'event-loop',
    props: { preset: 'promises' },
    title: 'Call stack, microtasks and tasks',
    caption: 'Step through synchronous code, promise callbacks and timers to see why promise callbacks run before a `setTimeout(…, 0)` callback.',
    alt: 'An event loop stepper with three columns: the call stack, the microtask queue and the task queue. Synchronous logs run on the stack first; promise callbacks wait in the microtask queue; the timer callback waits in the task queue and runs last.',
  },

  syntax: [
    `
#### Callbacks: the original way
`,
    {
      code: `setTimeout(() => {
  console.log('one second later')
}, 1000)
console.log('this runs first')`,
      lang: 'js',
      title: 'callbacks',
    },
    `
Callbacks work, but chaining several steps nests deeper and deeper ("callback hell"), and every step needs its own error handling.

#### Promises
`,
    {
      code: `// creating one (you'll mostly *use* promises others create, like fetch)
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// using one
fetchUser(1)
  .then((user) => fetchPosts(user.id))   // return a promise → the chain waits for it
  .then((posts) => console.log(posts))
  .catch((error) => console.error(error)) // catches a failure from ANY step above
  .finally(() => console.log('done'))     // runs either way`,
      lang: 'js',
      title: 'promises',
    },
    `
A promise is in one of three **states**: *pending* (waiting), *fulfilled* (has a value) or *rejected* (has an error). Once settled, it never changes.

#### async / await
`,
    {
      code: `async function showPosts() {
  try {
    const user = await fetchUser(1)          // pause this function until fulfilled
    const posts = await fetchPosts(user.id)
    console.log(posts)
  } catch (error) {
    console.error('Could not load:', error.message)
  } finally {
    console.log('done')
  }
}

showPosts()          // returns a promise immediately
console.log('I run before the posts arrive')`,
      lang: 'js',
      title: 'async / await',
    },
    `
- An \`async\` function **always returns a promise** (a returned value becomes the fulfilled value; a thrown error becomes the rejection).
- \`await\` only pauses **that function** — the rest of the page keeps running.
- Use \`try/catch\` around \`await\` to handle rejections.

#### Several at once
`,
    {
      code: `// sequential: the second request waits for the first (≈ sum of both times)
const a = await fetchUser(1)
const b = await fetchUser(2)

// parallel: start both, then wait for both (≈ the slower of the two)
const [c, d] = await Promise.all([fetchUser(1), fetchUser(2)])

// one failure shouldn't hide the others
const results = await Promise.allSettled([fetchUser(1), fetchUser(99)])
// [{ status: 'fulfilled', value: … }, { status: 'rejected', reason: Error }]

Promise.race([request, timeout])   // first to settle wins
Promise.any([mirrorA, mirrorB])    // first to FULFIL wins`,
      lang: 'js',
      title: 'combinators',
    },
    `
#### In Vue
`,
    {
      code: `<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { fetchUser } from './api.js'

const user = ref(null)
const error = ref(null)
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    user.value = await fetchUser(1)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

async function rename(name) {
  user.value.name = name
  await nextTick()   // wait until Vue has updated the DOM
  // …now it's safe to measure or focus the updated elements
}
</script>`,
      lang: 'vue',
      title: 'loading data in a component',
    },
    {
      callout: 'version',
      title: 'Top-level await in components',
      text: 'You *can* write `await` directly at the top level of `<script setup>`, but that makes the component\'s setup async, and it must then be rendered inside `<Suspense>` — which is still **experimental** in Vue 3. Loading inside `onMounted` (or a composable) with explicit loading/error state is the usual approach.',
    },
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: asyncMain,
    intro: 'A user loader with a fake 300 ms server (`api.js`), plus four console logs at the bottom that show the event loop\'s order.',
    steps: [
      { lines: [1], text: '`fetchUser` returns a **promise**. Open `api.js`: it calls `resolve(user)` after 300 ms, or `reject(new Error(…))` for unknown ids.' },
      { lines: [14, 15], text: '`async function` lets us use `await` inside. The first line runs synchronously: the status says Loading… immediately.' },
      { lines: [16, 18], text: '`await fetchUser(…)` pauses **only this function** until the promise settles. Meanwhile the browser keeps handling clicks and repainting. When it fulfils, `user` holds the result and the next line runs.' },
      { lines: [19, 21], text: 'If the promise rejects, `await` throws, and `catch` handles it. Without `try/catch`, the error would become an unhandled rejection. (The message shown here is vague — experiment 1 fixes that.)' },
      { lines: [24], text: 'The click handler is the async function itself. Each click starts a new, independent run of `loadUser`.' },
      { lines: [26, 30], text: 'Event-loop demo: synchronous logs run first (A, D). Then **all microtasks** — promise callbacks (C). Only then the next **task** — the timer (B). Open the console to confirm: A, D, C, B.' },
    ],
  },

  playground: {
    title: 'User loader',
    objective: 'Improve an async loader — real error messages, a disabled button while loading, parallel requests — and verify the event loop\'s ordering.',
    files: { 'main.js': asyncMain, 'api.js': asyncApi },
    expected: 'A number input, a **Load user** button and a status line. Loading id 1 shows **Loading…** then **Hello, Ada!** after about 300 ms. Id 99 shows **Something went wrong.** The console shows A, D, C, B.',
    experiments: [
      {
        id: 'show-error',
        task: 'Make the error message useful: for an unknown id, the status should show the error\'s message, e.g. **User 99 not found**.',
        hint: 'Inside `catch (error)`, use `error.message`.',
        tests: [
          { name: 'shows the real error message', code: `await type('.user-id', '99')\nawait click('.load')\nawait wait(400)\nexpect(text('.status')).toContain('User 99 not found')` },
        ],
        explain: 'When a promise rejects with an `Error`, `await` throws that same object, so `catch` receives everything the API reported. Generic messages make bugs and user support much harder.',
      },
      {
        id: 'disable-while-loading',
        task: 'Disable the **Load user** button while a request is in flight, and enable it again afterwards — whether the request succeeded or failed.',
        hint: 'Set `loadButton.disabled = true` at the start of `loadUser`, and `false` in a `finally { … }` block after `catch`.',
        tests: [
          { name: 'disabled during the request, enabled after success', code: `await click('.load')\nexpect(find('.load').disabled).toBe(true)\nawait wait(400)\nexpect(find('.load').disabled).toBe(false)` },
          { name: 'enabled again after a failure', code: `await type('.user-id', '42')\nawait click('.load')\nawait wait(400)\nexpect(find('.load').disabled).toBe(false)` },
        ],
        explain: '`finally` runs after `try` *or* `catch`, so cleanup like "stop the spinner" or "re-enable the button" can\'t be forgotten on the error path. It also prevents double submissions.',
      },
      {
        id: 'load-team',
        task: 'Add a `<button class="load-team">` and a `<p class="team">`. Clicking the button loads users 1, 2 and 3 **in parallel** and shows **Ada, Grace, Linus** in `.team`. It should take about 300 ms in total, not 900.',
        hint: '`const team = await Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)])`, then `team.map((u) => u.name).join(\', \')`. Awaiting them one by one would be sequential.',
        tests: [
          { name: 'loads all three in roughly the time of one', code: `await click('.load-team')\nawait wait(450)\nexpect(text('.team')).toBe('Ada, Grace, Linus')` },
        ],
        explain: '`Promise.all` starts nothing by itself — the three `fetchUser` calls start immediately when you call them; `Promise.all` just waits for all of them. Three sequential `await`s would take three times as long. The test waits only 450 ms, so only the parallel version passes.',
      },
      {
        id: 'predict-order',
        task: 'Without looking at the console, predict the order of logs if you add `queueMicrotask(() => console.log(\'E: microtask\'))` right after line C, and `setTimeout(() => console.log(\'F: timer 2\'), 0)` right after line A. Then run and check.',
        hint: 'Synchronous first; then every microtask in the order queued; then tasks in the order queued.',
        explain: 'The order is A, D, C, E, F, B. Synchronous logs first (A, D); then every microtask in the order queued (C, E); then the tasks in the order queued — and F\'s `setTimeout` line runs before B\'s, so F comes first. Microtasks always drain completely before the next task.',
      },
    ],
  },

  animation: {
    type: 'event-loop',
    props: { preset: 'async-await' },
    title: 'What `await` really does',
    caption: 'Step through an async function: everything before `await` runs immediately; the rest is scheduled as a microtask once the awaited promise settles.',
    alt: 'An event loop stepper showing an async function on the call stack. At the await, the function is paused and leaves the stack; synchronous code after the call continues; when the promise settles, the rest of the function is queued as a microtask and resumes on the stack.',
  },

  internals: {
    beginner: `
JavaScript has one "worker" that runs your code one piece at a time. When you start something slow, the browser does it in the background and puts a note in a queue when it's done. Whenever the worker finishes the current piece of code, it checks the queues: first the urgent promise notes, then the next timer or click. \`await\` simply means "put the rest of this function in the queue for when the promise is done".
`,
    technical: [
      `
**The event loop (simplified):**

1. Run one **task** to completion on the call stack — the initial script, a timer callback, an event handler.
2. Run **all microtasks** in the microtask queue, including any queued while doing so: promise reactions (\`.then\`/\`catch\`/\`finally\` callbacks), \`await\` continuations, \`queueMicrotask\`.
3. The browser may **render** (style, layout, paint) — typically aligned with the display\'s refresh rate.
4. Take the next task and repeat.

Consequences: a promise callback always runs after the current synchronous code but before the next timer; and an endless chain of microtasks can starve rendering just like an endless loop.
`,
      {
        code: `// async/await is (roughly) promise chaining with nicer syntax
async function load() {
  const user = await fetchUser(1)
  return user.name
}

// ≈ (simplified)
function load() {
  return fetchUser(1).then((user) => user.name)
}`,
        lang: 'js',
        title: 'await desugared (simplified)',
      },
      `
**Errors:** inside \`.then\`, throwing an error rejects the promise returned by \`.then\`; the next \`.catch\` in the chain receives it. A rejection with no handler attached triggers an \`unhandledrejection\` event (logged as "Uncaught (in promise)").

**How Vue uses this.** When you change reactive state, Vue doesn\'t re-render immediately; it queues the component\'s update job and flushes the queue in a **microtask**. Several changes in one handler cause one render. \`nextTick()\` returns a promise that resolves after that flush — so \`await nextTick()\` means "wait until the DOM reflects my changes". See [Batched updates & nextTick()](lesson:next-tick).
`,
    ],
    production: `
- **Always handle rejections** — \`try/catch\` around \`await\`, or \`.catch\` at the end of a chain — and show the user a meaningful error state. Report unexpected errors to monitoring.
- **Show loading, error and empty states**; never leave the UI silently waiting. See [Loading, error & empty states](lesson:async-ui-states).
- **Guard against races.** If the user can trigger a request again before the first finishes (typing in search, switching tabs), the older response can arrive last and overwrite newer data. Cancel with \`AbortController\`, ignore stale responses, or use \`onWatcherCleanup()\` (Vue 3.5+) in watchers. See [Cancellation & race conditions](lesson:cancellation-race-conditions).
- **Parallelise independent requests** with \`Promise.all\`/\`allSettled\`; keep dependent ones sequential.
- **Clean up timers** (\`clearTimeout\`, \`clearInterval\`) when a component unmounts, or callbacks will run against a component that no longer exists.
- Don\'t do heavy CPU work on the main thread for long stretches — async doesn\'t make computation faster, it only avoids *waiting*. Long computations belong in a Web Worker or need to be split up.
`,
  },

  mistakes: [
    {
      title: 'Forgetting `await` (or `return`)',
      wrong: { code: `async function load() {\n  const user = fetchUser(1)   // a Promise, not a user!\n  console.log(user.name)      // undefined\n}`, lang: 'js' },
      right: { code: `async function load() {\n  const user = await fetchUser(1)\n  console.log(user.name)\n}`, lang: 'js' },
      explanation: 'Without `await` you hold the promise object itself. Inside a `.then`, forgetting to `return` an inner promise breaks the chain in the same way.',
    },
    {
      title: 'Using `forEach` with an async callback',
      wrong: { code: `items.forEach(async (item) => {\n  await save(item)\n})\nconsole.log('All saved!') // runs immediately`, lang: 'js' },
      right: { code: `for (const item of items) {\n  await save(item)            // one after another\n}\n// or in parallel:\nawait Promise.all(items.map((item) => save(item)))\nconsole.log('All saved!')`, lang: 'js' },
      explanation: '`forEach` ignores the promises its callback returns, so nothing waits for them. Use `for…of` for sequential work or `Promise.all` + `map` for parallel work.',
    },
    {
      title: 'Awaiting independent requests one by one',
      wrong: { code: `const user = await fetchUser(id)       // 300 ms\nconst settings = await fetchSettings() // + 300 ms`, lang: 'js' },
      right: { code: `const [user, settings] = await Promise.all([fetchUser(id), fetchSettings()]) // ≈ 300 ms`, lang: 'js' },
      explanation: 'If the second request doesn\'t need the first one\'s result, start both and wait together.',
    },
    {
      title: 'Not handling the rejection',
      wrong: { code: `button.addEventListener('click', async () => {\n  const data = await loadReport() // if this rejects: "Uncaught (in promise)"\n  render(data)\n})`, lang: 'js' },
      right: { code: `button.addEventListener('click', async () => {\n  try {\n    render(await loadReport())\n  } catch (error) {\n    showError(error.message)\n  }\n})`, lang: 'js' },
      explanation: 'An async function that throws returns a rejected promise; if nobody handles it, the user sees nothing and the console shows an unhandled rejection.',
    },
  ],

  debugging: [
    {
      symptom: 'You log a value and see `Promise {<pending>}`.',
      cause: 'You logged the promise instead of its result — a missing `await`.',
      fix: 'Add `await` (inside an `async` function) or use `.then((value) => …)`.',
    },
    {
      symptom: '"Uncaught (in promise) Error: …" in the console.',
      cause: 'A promise rejected and no `catch` handled it.',
      fix: 'Wrap the `await` in `try/catch`, or add `.catch()` to the end of the chain — and show an error state.',
    },
    {
      symptom: 'Code after a loop runs before the loop\'s async work finished.',
      cause: '`forEach`/`map` with an async callback doesn\'t wait.',
      fix: 'Use `for…of` with `await`, or `await Promise.all(items.map(…))`.',
    },
    {
      symptom: 'The screen sometimes shows results for an older search query.',
      cause: 'Responses arrived out of order; the slower, older one overwrote the newer one.',
      fix: 'Track the latest request (id or AbortController) and ignore or cancel stale ones.',
    },
    {
      symptom: 'After changing state, reading the DOM still shows the old content.',
      cause: 'Vue applies DOM updates asynchronously, in a batch.',
      fix: '`await nextTick()` before reading or measuring the DOM.',
    },
  ],

  bestPractices: [
    'Prefer `async/await` with `try/catch/finally` for readability; use `.then` chains when they\'re genuinely simpler.',
    'Always handle rejections and show the user what happened.',
    'Use `finally` for cleanup that must happen either way (spinners, disabled buttons).',
    'Start independent work in parallel with `Promise.all` / `allSettled`.',
    'Never put `await` inside `forEach`; use `for…of` or `Promise.all(map(…))`.',
    'Protect against stale responses when requests can overlap.',
    'Clear timers and cancel requests when the component that started them goes away.',
  ],

  useCases: [
    'Loading data when a component mounts or a route changes.',
    'Submitting forms with loading and error states.',
    'Loading several independent resources in parallel for a dashboard.',
    'Debouncing a search input with `setTimeout`.',
    'Waiting for the DOM after a state change with `await nextTick()` before focusing or measuring.',
    'Timeouts and retries around unreliable requests.',
  ],

  whenToUse: {
    use: [
      '`async/await` for any sequence of asynchronous steps.',
      '`Promise.all` when you need every result and any failure should fail the whole operation.',
      '`Promise.allSettled` when partial success is useful (a dashboard where one widget may fail).',
      '`nextTick()` only when you must read or manipulate the DOM after a state change.',
    ],
    avoid: [
      'Callback nesting for multi-step flows — wrap the callbacks in promises instead.',
      '`await` inside `forEach`.',
      'Top-level `await` in `<script setup>` unless you deliberately use (experimental) `<Suspense>`.',
      'Using `setTimeout(…, 0)` to "wait for Vue" — use `nextTick()`.',
    ],
  },

  comparison: {
    title: 'Promise combinators',
    headers: ['', '`Promise.all`', '`Promise.allSettled`', '`Promise.race`', '`Promise.any`'],
    rows: [
      ['Resolves when', 'all fulfil', 'all settle', 'the first settles', 'the first fulfils'],
      ['Rejects when', 'any one rejects (immediately)', 'never', 'the first settles by rejecting', 'all reject (`AggregateError`)'],
      ['Result', 'array of values', 'array of `{ status, value | reason }`', 'that one value', 'that one value'],
      ['Typical use', 'load everything a page needs', 'dashboard widgets that can fail independently', 'timeouts', 'fastest of several mirrors'],
    ],
    note: 'Next: [HTTP, APIs & JSON](lesson:http-apis-json) — where most of your promises will come from.',
  },

  quiz: [
    {
      id: 'async-js-q1',
      type: 'mcq',
      prompt: 'What does calling an `async` function return?',
      options: [
        { text: 'Whatever value the function returns', why: 'An async function wraps its return value in a promise.' },
        { text: 'A promise' },
        { text: '`undefined` until the work is done', why: 'It returns a promise immediately, even before any `await` finishes.' },
        { text: 'It blocks until the result is ready', why: '`await` pauses only inside the async function; the caller continues immediately.' },
      ],
      answer: 1,
      explanation: 'Async functions always return a promise: fulfilled with the returned value, or rejected with the thrown error.',
    },
    {
      id: 'async-js-q2',
      type: 'output',
      prompt: 'In what order are the letters logged?',
      code: { lang: 'js', code: `console.log('A')\nsetTimeout(() => console.log('B'), 0)\nPromise.resolve().then(() => console.log('C'))\nconsole.log('D')` },
      options: [
        { text: 'A B C D', why: 'Callbacks never interrupt synchronous code — B and C must wait until A and D have run.' },
        { text: 'A D B C', why: 'Promise callbacks (microtasks) run before the next task (the timer).' },
        { text: 'A D C B' },
        { text: 'A C D B', why: 'The `.then` callback runs only after the current synchronous code finishes.' },
      ],
      answer: 2,
      explanation: 'Synchronous code first (A, D), then all microtasks (C), then the next task — the timer (B).',
    },
    {
      id: 'async-js-q3',
      type: 'output',
      prompt: 'What is logged, in order?',
      code: { lang: 'js', code: `async function load() {\n  console.log('2')\n  await null\n  console.log('4')\n}\n\nconsole.log('1')\nload()\nconsole.log('3')` },
      options: [
        { text: '1 2 3 4' },
        { text: '1 2 4 3', why: '`await` always yields, even for a non-promise value — the rest of `load` runs as a microtask.' },
        { text: '1 3 2 4', why: 'The body of an async function runs synchronously up to the first `await`.' },
        { text: '2 4 1 3', why: '`load()` is only called after `1` is logged.' },
      ],
      answer: 0,
      explanation: 'An async function runs synchronously until its first `await`, then returns to the caller (3). The rest resumes later as a microtask (4).',
    },
    {
      id: 'async-js-q4',
      type: 'bug',
      prompt: '"All saved!" appears before any item is saved. Click the line that causes it.',
      code: { lang: 'js', code: `async function saveAll(items) {\n  items.forEach(async (item) => {\n    await save(item)\n  })\n  console.log('All saved!')\n}` },
      answerLine: 2,
      explanation: '`forEach` doesn\'t wait for the promises returned by its async callback. Use `for (const item of items) await save(item)` or `await Promise.all(items.map(save))`.',
    },
    {
      id: 'async-js-q5',
      type: 'fill',
      prompt: 'Load a user and their posts in parallel, and handle a failure.',
      code: { lang: 'js', code: `async function loadProfile(id) {\n  try {\n    const [user, posts] = await Promise.___([fetchUser(id), fetchPosts(id)])\n    render(user, posts)\n  } ___ (error) {\n    showError(error.message)\n  }\n}` },
      answer: [['all'], ['catch']],
      explanation: '`Promise.all` waits for both in parallel and rejects if either fails; `catch` receives that error.',
    },
    {
      id: 'async-js-q6',
      type: 'mcq',
      prompt: 'A dashboard loads three widgets. If one request fails, the other two should still display. Which combinator fits best?',
      options: [
        { text: '`Promise.all`', why: '`Promise.all` rejects as soon as one fails, and you lose the other results.' },
        { text: '`Promise.allSettled`' },
        { text: '`Promise.race`', why: '`race` gives you only the first to settle.' },
        { text: 'Three sequential `await`s', why: 'Slower, and a failure in the first would stop the rest unless each has its own try/catch.' },
      ],
      answer: 1,
      explanation: '`allSettled` waits for all three and reports each outcome, so you can show the successes and an error just for the failed widget.',
    },
    {
      id: 'async-js-q7',
      type: 'short',
      prompt: 'What is the difference between a microtask and a task, and why does a promise callback run before `setTimeout(fn, 0)`?',
      answer: 'Tasks are units like the initial script, timer callbacks and event handlers; the event loop runs one task at a time. Microtasks — promise reactions, await continuations, queueMicrotask — run right after the current task finishes, and the whole microtask queue is drained before the next task starts. A `setTimeout(fn, 0)` callback is a new task, so it has to wait until all pending microtasks, such as promise callbacks, have run.',
    },
  ],

  exercises: [
    {
      id: 'with-timeout',
      title: 'Give up after a timeout',
      difficulty: 'intermediate',
      prompt: `
In \`timeout.js\`, \`delay(ms)\` is already written. Implement \`withTimeout(promise, ms)\`:

- if \`promise\` fulfils within \`ms\`, resolve with its value;
- if \`promise\` rejects within \`ms\`, reject with its error;
- otherwise reject with \`new Error('Timed out')\`.

Bonus: clear your timer when the promise settles first. The page uses it to load a slow report and shows the outcome in \`.report\`.
`,
      files: {
        'timeout.js': `export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function withTimeout(promise, ms) {
  // TODO
  return promise
}`,
        'main.js': `import { delay, withTimeout } from './timeout.js'

const app = document.getElementById('app')
app.innerHTML = '<button class="go">Load report</button><p class="report"></p>'
const report = app.querySelector('.report')

function slowReport() {
  return delay(500).then(() => 'Report: 42 sales')
}

app.querySelector('.go').addEventListener('click', async () => {
  report.textContent = 'Loading…'
  try {
    report.textContent = await withTimeout(slowReport(), 150)
  } catch (error) {
    report.textContent = 'Error: ' + error.message
  }
})`,
      },
      hints: [
        'Build a second promise that rejects after `ms` milliseconds, and race it against the original.',
        '`Promise.race([promise, timeoutPromise])` settles like whichever settles first.',
        'To clean up, keep the timer id and `clearTimeout` it in a `.finally()` on the raced promise.',
      ],
      solution: {
        explanation: '`Promise.race` adopts the outcome of whichever promise settles first: the real work or the timer. Clearing the timer in `finally` avoids leaving a pending timeout behind when the work wins. Note this doesn\'t *stop* the original work — real cancellation of requests uses `AbortController`.',
        files: {
          'timeout.js': `export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timed out')), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}`,
          'main.js': `import { delay, withTimeout } from './timeout.js'

const app = document.getElementById('app')
app.innerHTML = '<button class="go">Load report</button><p class="report"></p>'
const report = app.querySelector('.report')

function slowReport() {
  return delay(500).then(() => 'Report: 42 sales')
}

app.querySelector('.go').addEventListener('click', async () => {
  report.textContent = 'Loading…'
  try {
    report.textContent = await withTimeout(slowReport(), 150)
  } catch (error) {
    report.textContent = 'Error: ' + error.message
  }
})`,
        },
      },
      tests: [
        { name: 'resolves with the value when fast enough', code: `const { delay, withTimeout } = requireModule('timeout.js')\nconst value = await withTimeout(delay(20).then(() => 'ok'), 200)\nexpect(value).toBe('ok')` },
        { name: 'rejects with "Timed out" when too slow', code: `const { delay, withTimeout } = requireModule('timeout.js')\nlet message = ''\ntry {\n  await withTimeout(delay(300), 50)\n} catch (e) {\n  message = e.message\n}\nexpect(message).toBe('Timed out')` },
        { name: 'passes through the original rejection', code: `const { withTimeout } = requireModule('timeout.js')\nlet message = ''\ntry {\n  await withTimeout(Promise.reject(new Error('boom')), 100)\n} catch (e) {\n  message = e.message\n}\nexpect(message).toBe('boom')` },
        { name: 'the page reports the timeout', code: `await click('.go')\nawait wait(250)\nexpect(text('.report')).toBe('Error: Timed out')` },
      ],
    },
    {
      id: 'async-states',
      title: 'Loading, success and error states',
      difficulty: 'intermediate',
      prompt: `
\`api.js\` exports \`fetchPosts({ fail })\`, which resolves with three posts after 300 ms, or rejects with \`Error('Server error (500)')\` when \`fail\` is true.

Make the page honest about what\'s happening:

- Clicking \`.load\` or \`.load-broken\` (which calls \`fetchPosts({ fail: true })\`) shows **Loading…** in \`.status\` immediately and **disables both buttons** until the request finishes.
- On success: render each post title in an \`<li class="post">\` inside \`ul.posts\`, and clear \`.status\` (empty text).
- On failure: show the error message in \`.error\`, clear \`.status\`, and render no posts.
`,
      files: {
        'api.js': `export function fetchPosts({ fail = false } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) reject(new Error('Server error (500)'))
      else resolve([
        { id: 1, title: 'Promises in plain words' },
        { id: 2, title: 'Why await pauses only one function' },
        { id: 3, title: 'Microtasks vs tasks' },
      ])
    }, 300)
  })
}`,
        'main.js': `import { fetchPosts } from './api.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <button class="load">Load posts</button>
  <button class="load-broken">Load (server down)</button>
  <p class="status"></p>
  <p class="error"></p>
  <ul class="posts"></ul>
\`

const loadButton = app.querySelector('.load')
const brokenButton = app.querySelector('.load-broken')
const status = app.querySelector('.status')
const errorBox = app.querySelector('.error')
const list = app.querySelector('.posts')

function renderPosts(posts) {
  list.replaceChildren(...posts.map((post) => {
    const li = document.createElement('li')
    li.className = 'post'
    li.textContent = post.title
    return li
  }))
}

// TODO: loading state, error state, disabled buttons, and the broken button
loadButton.addEventListener('click', async () => {
  const posts = await fetchPosts()
  renderPosts(posts)
})`,
      },
      hints: [
        'Write one `async function load(options)` and attach it to both buttons: `() => load()` and `() => load({ fail: true })`.',
        'Before awaiting: set the status text, clear the error, disable both buttons. Then `try { … } catch (error) { … } finally { … }`.',
        'In `catch`, set `errorBox.textContent = error.message` and `renderPosts([])`. In `finally`, clear the status and re-enable both buttons.',
      ],
      solution: {
        explanation: 'One function owns the whole request lifecycle: set "loading" up front, handle success in `try`, failure in `catch`, and always clean up in `finally`. This is the exact shape you\'ll put inside a Vue composable with `loading`, `error` and `data` refs.',
        files: {
          'api.js': `export function fetchPosts({ fail = false } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) reject(new Error('Server error (500)'))
      else resolve([
        { id: 1, title: 'Promises in plain words' },
        { id: 2, title: 'Why await pauses only one function' },
        { id: 3, title: 'Microtasks vs tasks' },
      ])
    }, 300)
  })
}`,
          'main.js': `import { fetchPosts } from './api.js'

const app = document.getElementById('app')
app.innerHTML = \`
  <button class="load">Load posts</button>
  <button class="load-broken">Load (server down)</button>
  <p class="status"></p>
  <p class="error"></p>
  <ul class="posts"></ul>
\`

const loadButton = app.querySelector('.load')
const brokenButton = app.querySelector('.load-broken')
const status = app.querySelector('.status')
const errorBox = app.querySelector('.error')
const list = app.querySelector('.posts')

function renderPosts(posts) {
  list.replaceChildren(...posts.map((post) => {
    const li = document.createElement('li')
    li.className = 'post'
    li.textContent = post.title
    return li
  }))
}

function setBusy(busy) {
  loadButton.disabled = busy
  brokenButton.disabled = busy
}

async function load(options) {
  status.textContent = 'Loading…'
  errorBox.textContent = ''
  setBusy(true)
  try {
    renderPosts(await fetchPosts(options))
  } catch (error) {
    renderPosts([])
    errorBox.textContent = error.message
  } finally {
    status.textContent = ''
    setBusy(false)
  }
}

loadButton.addEventListener('click', () => load())
brokenButton.addEventListener('click', () => load({ fail: true }))`,
        },
      },
      tests: [
        { name: 'shows Loading… immediately', code: `await click('.load')\nexpect(text('.status')).toBe('Loading…')\nawait wait(400)` },
        { name: 'renders three posts and clears the status', code: `await click('.load')\nawait wait(400)\nexpect(findAll('.post')).toHaveLength(3)\nexpect(text('.status')).toBe('')` },
        { name: 'shows the error message on failure', code: `await click('.load-broken')\nawait wait(400)\nexpect(text('.error')).toContain('Server error (500)')\nexpect(findAll('.post')).toHaveLength(0)\nexpect(text('.status')).toBe('')` },
        { name: 'buttons are disabled while loading', code: `await click('.load')\nexpect(find('.load').disabled).toBe(true)\nexpect(find('.load-broken').disabled).toBe(true)\nawait wait(400)\nexpect(find('.load').disabled).toBe(false)` },
      ],
    },
  ],

  interview: [
    {
      id: 'async-js-event-loop-order',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 4,
      question: 'What is the exact output order?',
      code: {
        lang: 'js',
        code: `console.log('start')
setTimeout(() => console.log('timeout'), 0)
Promise.resolve()
  .then(() => console.log('then 1'))
  .then(() => console.log('then 2'))
queueMicrotask(() => console.log('microtask'))
console.log('end')`,
      },
      options: [
        'start, end, then 1, then 2, microtask, timeout',
        'start, end, then 1, microtask, then 2, timeout',
        'start, then 1, then 2, microtask, end, timeout',
        'start, end, timeout, then 1, microtask, then 2',
      ],
      correctOption: 1,
      answer: '`start, end, then 1, microtask, then 2, timeout`. Synchronous code runs first. The microtask queue then holds `then 1` and `microtask` in that order. Running `then 1` resolves the next promise in the chain, which queues `then 2` *behind* `microtask`. The timer is a task, so it runs after the microtask queue is empty.',
      explanation: 'Chained `.then` callbacks are queued only when the previous step settles — they don\'t all enter the queue at once.',
      whyAsked: 'The classic event-loop question; this variant checks you understand that chained callbacks are queued lazily.',
      mistakes: ['Putting `then 2` straight after `then 1`.', 'Running `timeout` before promise callbacks.', 'Thinking `setTimeout(…, 0)` runs immediately.'],
      followUps: ['Where would `await` continuations go in this order?', 'Where does the browser get a chance to render?', 'How does Vue\'s nextTick fit in?'],
      modelAnswer: 'Start and end log first because synchronous code always finishes before any callback. At that point the microtask queue has the first then callback and the queueMicrotask callback. Running then 1 resolves the promise returned by the first `.then`, which only now queues then 2 — behind the already-queued microtask. Once the microtask queue is empty, the event loop takes the next task, the timer. So: start, end, then 1, microtask, then 2, timeout.',
    },
    {
      id: 'async-js-promise-states',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is a promise, and what states can it be in?',
      answer: 'A promise is an object representing the eventual result of an asynchronous operation. It starts *pending*, then settles exactly once into *fulfilled* (with a value) or *rejected* (with a reason, usually an Error). You react to it with `.then`/`.catch`/`.finally` or `await`. Once settled, its state and value never change.',
      explanation: 'A receipt for a result that isn\'t ready yet.',
      whyAsked: 'Foundation for all data loading code.',
      mistakes: ['Thinking a promise can resolve more than once.', 'Confusing "resolved" with "fulfilled" (a promise resolved with another pending promise is still pending).', 'Believing creating a promise is what starts the work, when it is the function you call that starts it.'],
      followUps: ['What happens if a promise rejects and nothing handles it?', 'What does `.then` return?'],
      modelAnswer: 'A promise is a placeholder object for a value that will exist later. It begins pending and settles once: fulfilled with a value or rejected with an error, and after that it is immutable. I consume it with `await` inside a try/catch, or with `.then` and `.catch`. Each `.then` returns a new promise, which is what makes chaining work, and an unhandled rejection surfaces as an "Uncaught (in promise)" error.',
    },
    {
      id: 'async-js-sequential-parallel',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'A page needs the current user, their notifications and the app settings. None depends on the others. How do you load them, and how does that change if notifications need the user\'s id?',
      answer: 'Independent requests should run in parallel: `const [user, notifications, settings] = await Promise.all([…])`, so total time is roughly the slowest request rather than the sum. If notifications need `user.id`, load the user first, then start notifications and settings — settings can still start immediately: e.g. start `settingsPromise = fetchSettings()` before awaiting the user. Use `allSettled` if the page can render with partial data.',
      explanation: 'Sequence only what truly depends on earlier results.',
      code: {
        lang: 'js',
        code: `const settingsPromise = fetchSettings()          // starts now
const user = await fetchUser()                   // needed for the next call
const [notifications, settings] = await Promise.all([
  fetchNotifications(user.id),
  settingsPromise,
])`,
      },
      whyAsked: 'Waterfalls of sequential awaits are a common, easily fixed performance problem.',
      mistakes: ['Awaiting everything sequentially by habit.', 'Using `Promise.all` and losing everything when one optional request fails.', 'Not realising a promise starts its work when the function is called, not when awaited.'],
      followUps: ['How would you show partial results as each request finishes?', 'How would you cancel all of them on navigation?'],
      modelAnswer: 'For independent data I start all three and await them together with `Promise.all`, so the wait is about as long as the slowest call. If notifications depend on the user id, I still kick off settings immediately, await the user, then await notifications together with the already-running settings promise. If some data is optional I use `allSettled` so one failure doesn\'t blank the page. The key insight is that calling the function starts the work; `await` only decides when I need the result.',
    },
    {
      id: 'async-js-foreach-await',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This upload function reports success and hides the spinner while uploads are still running, and a failed upload shows "Uncaught (in promise)". Why?',
      code: {
        lang: 'js',
        code: `async function uploadAll(files) {
  loading.value = true
  files.forEach(async (file) => {
    await upload(file)
  })
  loading.value = false
  toast('All files uploaded!')
}`,
      },
      answer: '`forEach` calls the async callback for each file but ignores the promises it returns, so `uploadAll` moves on immediately: the spinner hides and the toast shows before uploads finish. Errors inside the callbacks reject promises nobody awaits, hence unhandled rejections. Fix: `await Promise.all(files.map((file) => upload(file)))` (parallel) or a `for…of` loop with `await` (sequential), wrapped in try/catch/finally.',
      explanation: '`forEach` is synchronous and doesn\'t understand promises.',
      whyAsked: 'Extremely common bug that shows whether you understand what `await` actually waits for.',
      mistakes: ['Adding `await` before `files.forEach(...)` (it returns undefined; nothing to wait for).', 'Not addressing the error handling.', 'Not mentioning the parallel vs sequential choice.'],
      followUps: ['How would you limit uploads to three at a time?', 'How would you report which files failed?'],
      modelAnswer: 'forEach doesn\'t await anything — it fires off one async callback per file and returns immediately, so the spinner is turned off and the toast shown while uploads are still in flight. Any rejection happens inside a promise no one is holding, so it\'s unhandled. I\'d map the files to upload promises and await `Promise.all`, or `allSettled` to report individual failures, inside try/catch/finally so the spinner resets correctly. If the server can\'t handle many parallel uploads, I\'d use a for…of loop or a small concurrency limit.',
    },
    {
      id: 'async-js-stale-search',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A Vue search box fetches results in a `watch` on the query. Users report that results sometimes don\'t match what they typed. What\'s happening and how do you fix it?',
      answer: 'It\'s a race condition: each keystroke starts a request, and responses can arrive out of order. If the request for "vu" returns after the one for "vue", the older results overwrite the newer ones. Fixes: cancel the previous request with `AbortController` when the query changes (in Vue 3.5+ `onWatcherCleanup(() => controller.abort())`, or the `onCleanup` argument of the watch callback in earlier versions); or tag each request and ignore responses that aren\'t the latest. Debouncing reduces the number of requests but doesn\'t eliminate the race on its own.',
      explanation: 'Async results must be checked for relevance when they arrive, not just when they were requested.',
      code: {
        lang: 'js',
        code: `import { watch, onWatcherCleanup } from 'vue' // onWatcherCleanup: Vue 3.5+

watch(query, async (q) => {
  const controller = new AbortController()
  onWatcherCleanup(() => controller.abort()) // runs before the next run
  try {
    const res = await fetch('/api/search?q=' + encodeURIComponent(q), { signal: controller.signal })
    results.value = await res.json()
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e.message
  }
})`,
      },
      whyAsked: 'Race conditions are among the most common real-world async bugs; seniors are expected to recognise and prevent them.',
      mistakes: ['Saying debouncing alone fixes it.', 'Not treating `AbortError` separately (showing an error for an intentional cancel).', 'Not knowing about watcher cleanup.'],
      followUps: ['How would you combine debouncing with cancellation?', 'Does aborting the fetch stop the server work?', 'How would you test this?'],
      modelAnswer: 'The watcher fires per keystroke and requests resolve in whatever order the network delivers, so an older, slower response can land last and overwrite fresh results. I\'d cancel the in-flight request when the query changes — an AbortController aborted from watcher cleanup, `onWatcherCleanup` in Vue 3.5 or the `onCleanup` parameter before that — and ignore AbortError. Alternatively, keep a request counter and drop any response that isn\'t the latest. I\'d also debounce to reduce load, but debouncing on its own still leaves the race.',
    },
    {
      id: 'async-js-nexttick',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'How does Vue\'s `nextTick()` relate to the event loop, and when do you need it?',
      answer: 'Vue batches DOM updates: when reactive state changes, Vue queues the affected component updates and flushes the queue asynchronously in a microtask, so many changes in one tick produce one render. `nextTick()` returns a promise that resolves after the current flush. You need it when code must read or manipulate the DOM after a state change in the same tick — focusing a newly shown input, measuring an element, scrolling to a new list item.',
      explanation: 'State changes are synchronous; DOM updates are deferred to a microtask. `nextTick` waits for that microtask.',
      code: {
        lang: 'js',
        code: `async function startEditing() {
  editing.value = true      // the <input> doesn't exist in the DOM yet
  await nextTick()          // wait for Vue's flush
  inputRef.value.focus()    // now it does
}`,
      },
      whyAsked: 'Checks real understanding of Vue\'s update scheduling rather than cargo-cult `nextTick` usage.',
      mistakes: ['Using `setTimeout` instead.', 'Sprinkling `nextTick` to "fix" reactivity bugs that are really state bugs.', 'Thinking state itself updates asynchronously.'],
      followUps: ['Why does batching improve performance?', 'What is the `flush` option of `watch`?'],
      modelAnswer: 'When I mutate reactive state, the value changes immediately, but the DOM doesn\'t: Vue queues a re-render job and flushes the queue in a microtask, so ten changes in a handler give one render. nextTick returns a promise for "after that flush". I use it only when I need the updated DOM in the same function — focusing an input that just appeared, measuring a resized element, scrolling to a newly added row. If I find myself using it to make data show up correctly, the bug is usually elsewhere.',
    },
    {
      id: 'async-js-retry',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Implement `retry(fn, attempts)` in `retry.js`. `fn` returns a promise. Call it; if it rejects, try again, up to `attempts` calls in total. Resolve with the first success; if every attempt fails, reject with the **last** error.',
      starter: {
        files: {
          'retry.js': `export async function retry(fn, attempts) {
  // TODO
  return fn()
}`,
          'main.js': `import { retry } from './retry.js'

let calls = 0
function flakyRequest() {
  calls++
  return calls < 3 ? Promise.reject(new Error('Network glitch')) : Promise.resolve('Saved!')
}

const app = document.getElementById('app')
app.innerHTML = '<button class="save">Save</button><p class="result"></p>'
app.querySelector('.save').addEventListener('click', async () => {
  try {
    app.querySelector('.result').textContent = (await retry(flakyRequest, 3)) + ' after ' + calls + ' calls'
  } catch (e) {
    app.querySelector('.result').textContent = 'Failed: ' + e.message
  }
})`,
        },
      },
      tests: [
        { name: 'succeeds after transient failures', code: `const { retry } = requireModule('retry.js')\nlet n = 0\nconst flaky = () => { n++; return n < 3 ? Promise.reject(new Error('fail ' + n)) : Promise.resolve('ok') }\nexpect(await retry(flaky, 3)).toBe('ok')\nexpect(n).toBe(3)` },
        { name: 'gives up with the last error', code: `const { retry } = requireModule('retry.js')\nlet n = 0\nconst always = () => { n++; return Promise.reject(new Error('nope ' + n)) }\nlet message = ''\ntry { await retry(always, 2) } catch (e) { message = e.message }\nexpect(message).toBe('nope 2')\nexpect(n).toBe(2)` },
        { name: 'stops calling after the first success', code: `const { retry } = requireModule('retry.js')\nlet n = 0\nawait retry(() => { n++; return Promise.resolve(n) }, 5)\nexpect(n).toBe(1)` },
        { name: 'the page shows the result', code: `await click('.save')\nawait wait(50)\nexpect(text('.result')).toBe('Saved! after 3 calls')` },
      ],
      hints: ['Loop from 1 to `attempts`; inside, `try { return await fn() } catch (e) { lastError = e }`.', 'After the loop, `throw lastError`. Note `return await` inside `try` — without `await`, the rejection would escape the `catch`.'],
      answer: 'Loop up to `attempts` times; `return await fn()` inside try (so rejections are caught), remember the error in catch, and throw the last error after the loop.',
      solution: {
        files: {
          'retry.js': `export async function retry(fn, attempts) {
  let lastError
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError
}`,
          'main.js': `import { retry } from './retry.js'

let calls = 0
function flakyRequest() {
  calls++
  return calls < 3 ? Promise.reject(new Error('Network glitch')) : Promise.resolve('Saved!')
}

const app = document.getElementById('app')
app.innerHTML = '<button class="save">Save</button><p class="result"></p>'
app.querySelector('.save').addEventListener('click', async () => {
  try {
    app.querySelector('.result').textContent = (await retry(flakyRequest, 3)) + ' after ' + calls + ' calls'
  } catch (e) {
    app.querySelector('.result').textContent = 'Failed: ' + e.message
  }
})`,
        },
      },
      explanation: '`return await` inside `try` is the subtle part: `return fn()` would hand back the rejected promise without the `catch` ever seeing the error.',
      whyAsked: 'Combines async control flow, error handling and a real resilience pattern.',
      mistakes: ['`return fn()` instead of `return await fn()` inside try.', 'Retrying forever or one time too many.', 'Swallowing the error instead of rethrowing the last one.'],
      followUps: ['How would you add exponential backoff?', 'Which errors should NOT be retried (e.g. 400 vs 503)?', 'Why are retries risky for non-idempotent requests like POST?'],
      modelAnswer: 'I loop up to `attempts` times. Inside, `return await fn()` in a try block — the await matters, because otherwise a rejection escapes the catch. In the catch I remember the error, and after the loop I throw the last one. In production I\'d add backoff with a delay between attempts, only retry errors that are likely transient like network failures or 503s, and be careful retrying requests that aren\'t idempotent, such as payments.',
    },
  ],

  takeaways: [
    'JavaScript runs your code on one thread; async APIs start slow work and call you back later so the page never freezes.',
    'A promise is pending, then fulfilled or rejected — once. Consume it with `await` (inside `async`) or `.then/.catch/.finally`.',
    'Code before the first `await` runs synchronously; the rest resumes later as a microtask.',
    'The event loop runs a task, then drains all microtasks (promise callbacks), then the next task (timers, events).',
    'Handle every rejection, use `finally` for cleanup, run independent work in parallel with `Promise.all`/`allSettled`.',
    'Never `await` inside `forEach`. Guard against stale responses. In Vue, `await nextTick()` waits for the batched DOM update.',
  ],
}
