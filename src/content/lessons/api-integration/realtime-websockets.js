// Lesson: Real-time UIs with WebSockets.
// The sandbox has no network, so fakeSocket.js provides FakeSocket — a stand-in with the
// same shape as the browser's WebSocket — plus a `server` object the demo and tests control.

const fakeSocket = `// fakeSocket.js — a pretend WebSocket server so this sandbox works offline.
// FakeSocket copies the browser WebSocket's shape: readyState, send(), close(),
// and 'open' / 'message' / 'close' events (addEventListener or onmessage = …).
// Simplified: close() finishes instantly and there is no real network.

const CONNECTING = 0
const OPEN = 1
const CLOSED = 3

const sockets = new Set()
const ITEMS = ['Flat white', 'Chai latte', 'Espresso', 'Matcha', 'Mocha', 'Cortado']
const NAMES = ['Ada', 'Grace', 'Alan', 'Hedy', 'Linus', 'Radia']
let nextId = 100

// The "server side": the demo and the tests use it to push messages or drop connections.
export const server = {
  autoplay: true, // send demo orders automatically
  connections: 0, // sockets that reached OPEN
  closeLog: [], // { code, reason } for every socket that closed
  get openSockets() {
    let count = 0
    for (const s of sockets) if (s.readyState === OPEN) count++
    return count
  },
  broadcast(msg) {
    for (const s of sockets) s._receive(msg)
  },
  drop() {
    for (const s of [...sockets]) s._finish(1006, 'Connection lost') // 1006 = abnormal closure
  },
}

function demoMessage(socket) {
  if (!socket._ids.length || Math.random() < 0.5) {
    const order = {
      id: nextId++,
      item: ITEMS[Math.floor(Math.random() * ITEMS.length)],
      customer: NAMES[Math.floor(Math.random() * NAMES.length)],
      status: 'queued',
    }
    socket._ids.push(order.id)
    return { type: 'order:new', order }
  }
  const id = socket._ids[Math.floor(Math.random() * socket._ids.length)]
  return { type: 'order:update', id, status: Math.random() < 0.5 ? 'brewing' : 'ready' }
}

export class FakeSocket extends EventTarget {
  constructor(url) {
    super()
    this.url = url
    this.readyState = CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onclose = null
    this._ids = []
    this._ticks = 0
    sockets.add(this)
    console.log('⇄ connecting to', url)

    this._openTimer = setTimeout(() => {
      this.readyState = OPEN
      server.connections++
      this._emit(new Event('open'))
      this._demo = setInterval(() => {
        if (++this._ticks > 40) return clearInterval(this._demo) // sandbox safety net
        if (server.autoplay) this._receive(demoMessage(this))
      }, 600)
    }, 100)
  }

  send(data) {
    if (this.readyState === CONNECTING) {
      throw new DOMException('Still in CONNECTING state.', 'InvalidStateError')
    }
    if (this.readyState === OPEN) console.log('↑ sent', data)
  }

  close(code = 1000, reason = '') {
    this._finish(code, reason)
  }

  _receive(msg) {
    if (this.readyState !== OPEN) return
    this._emit(new MessageEvent('message', { data: JSON.stringify(msg) }))
  }

  _finish(code, reason) {
    if (this.readyState === CLOSED) return
    clearTimeout(this._openTimer)
    clearInterval(this._demo)
    this.readyState = CLOSED
    sockets.delete(this)
    server.closeLog.push({ code, reason })
    console.log('✕ closed', code, reason)
    this._emit(new CloseEvent('close', { code, reason, wasClean: code === 1000 }))
  }

  _emit(event) {
    this.dispatchEvent(event)
    const handler = this['on' + event.type]
    if (typeof handler === 'function') handler.call(this, event)
  }
}`

const playgroundComposable = `// useLiveOrders.js — owns one live connection for the component that uses it.
import { ref, onMounted, onUnmounted } from 'vue'
import { FakeSocket } from './fakeSocket.js'

export function useLiveOrders(url) {
  const orders = ref([])
  const status = ref('connecting') // 'connecting' | 'open' | 'closed'
  let socket = null

  function handleMessage(event) {
    const msg = JSON.parse(event.data) // messages arrive as text
    if (msg.type === 'order:new') {
      orders.value.unshift(msg.order) // newest first
    }
    // TODO: 'order:update' messages are ignored for now
  }

  onMounted(() => {
    socket = new FakeSocket(url) // a real app: new WebSocket(url)
    socket.addEventListener('open', () => (status.value = 'open'))
    socket.addEventListener('message', handleMessage)
    socket.addEventListener('close', (event) => {
      status.value = 'closed'
      console.log('close code', event.code, event.wasClean ? '(clean)' : '(dropped)')
    })
  })

  onUnmounted(() => {
    if (socket) socket.close(1000, 'Component unmounted')
  })

  return { orders, status }
}`

const finishedComposable = `// useLiveOrders.js — one live connection, messages applied by a pure function.
import { ref, onMounted, onUnmounted } from 'vue'
import { FakeSocket } from './fakeSocket.js'

const MAX_ORDERS = 5

// Pure: (current list, message) → next list. Easy to read and to unit test.
export function applyMessage(list, msg) {
  if (msg.type === 'order:new') {
    if (list.some((o) => o.id === msg.order.id)) return list // duplicate delivery
    return [msg.order, ...list].slice(0, MAX_ORDERS)
  }
  if (msg.type === 'order:update') {
    return list.map((o) => (o.id === msg.id ? { ...o, status: msg.status } : o))
  }
  return list // unknown message types are ignored, not fatal
}

export function useLiveOrders(url) {
  const orders = ref([])
  const status = ref('connecting')
  let socket = null

  function handleMessage(event) {
    let msg
    try {
      msg = JSON.parse(event.data)
    } catch {
      return console.warn('Ignoring a malformed message')
    }
    orders.value = applyMessage(orders.value, msg)
  }

  onMounted(() => {
    socket = new FakeSocket(url) // a real app: new WebSocket(url)
    socket.addEventListener('open', () => (status.value = 'open'))
    socket.addEventListener('message', handleMessage)
    socket.addEventListener('close', () => (status.value = 'closed'))
  })

  onUnmounted(() => {
    if (socket) socket.close(1000, 'Component unmounted')
  })

  return { orders, status }
}`

const boardApp = `<script setup>
import { useLiveOrders } from './useLiveOrders.js'
import { server } from './fakeSocket.js'

const { orders, status } = useLiveOrders('wss://cafe.example.com/orders')
</script>

<template>
  <header>
    <h2>Café order board</h2>
    <span class="conn" :class="status">
      {{ status === 'open' ? '● Live' : status === 'connecting' ? 'Connecting…' : '○ Offline' }}
    </span>
  </header>

  <div class="dev-tools">
    <button class="drop" @click="server.drop()">Simulate connection loss</button>
    <button class="pause" @click="server.autoplay = !server.autoplay">Pause / resume demo orders</button>
  </div>

  <ul class="orders">
    <li v-for="order in orders" :key="order.id" class="order" :data-id="order.id">
      <strong>#{{ order.id }}</strong> {{ order.item }} for {{ order.customer }}
      <span class="status">{{ order.status }}</span>
    </li>
  </ul>
  <p v-if="!orders.length" class="empty">Waiting for orders…</p>
</template>`

const toggleApp = `<script setup>
import { ref } from 'vue'
import LiveBoard from './LiveBoard.vue'

const visible = ref(true)
</script>

<template>
  <button class="toggle" @click="visible = !visible">{{ visible ? 'Hide' : 'Show' }} live board</button>
  <LiveBoard v-if="visible" />
</template>`

const liveBoard = `<script setup>
import { useLiveOrders } from './useLiveOrders.js'

const { orders, status } = useLiveOrders('wss://cafe.example.com/orders')
</script>

<template>
  <section class="board">
    <span class="conn">{{ status === 'open' ? 'Live' : status === 'reconnecting' ? 'Reconnecting…' : status === 'connecting' ? 'Connecting…' : 'Offline' }}</span>
    <ul>
      <li v-for="order in orders" :key="order.id" class="order">#{{ order.id }} {{ order.item }}</li>
    </ul>
  </section>
</template>`

const cleanupStarter = `// useLiveOrders.js
import { ref, onMounted } from 'vue'
import { FakeSocket } from './fakeSocket.js'

export function useLiveOrders(url) {
  const orders = ref([])
  const status = ref('connecting')
  let socket = null

  onMounted(() => {
    socket = new FakeSocket(url)
    socket.addEventListener('open', () => (status.value = 'open'))
    socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'order:new') orders.value = [msg.order, ...orders.value].slice(0, 5)
    })
    socket.addEventListener('close', () => (status.value = 'closed'))
  })

  // TODO: close the socket when the component goes away

  return { orders, status }
}`

const cleanupSolution = `// useLiveOrders.js
import { ref, onMounted, onUnmounted } from 'vue'
import { FakeSocket } from './fakeSocket.js'

export function useLiveOrders(url) {
  const orders = ref([])
  const status = ref('connecting')
  let socket = null

  onMounted(() => {
    socket = new FakeSocket(url)
    socket.addEventListener('open', () => (status.value = 'open'))
    socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'order:new') orders.value = [msg.order, ...orders.value].slice(0, 5)
    })
    socket.addEventListener('close', () => (status.value = 'closed'))
  })

  onUnmounted(() => {
    if (socket) socket.close(1000, 'Component unmounted') // 1000 = normal closure
  })

  return { orders, status }
}`

const reconnectSolution = `// useLiveOrders.js
import { ref, onMounted, onUnmounted } from 'vue'
import { FakeSocket } from './fakeSocket.js'

export function useLiveOrders(url) {
  const orders = ref([])
  const status = ref('connecting') // 'connecting' | 'open' | 'reconnecting' | 'closed'
  let socket = null
  let attempts = 0
  let retryTimer = null
  let stopped = false

  function connect() {
    socket = new FakeSocket(url)
    socket.addEventListener('open', () => {
      status.value = 'open'
      attempts = 0 // a healthy connection resets the backoff
    })
    socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'order:new') orders.value = [msg.order, ...orders.value].slice(0, 5)
    })
    socket.addEventListener('close', (event) => {
      if (stopped || event.code === 1000) {
        status.value = 'closed'
        return
      }
      status.value = 'reconnecting'
      const delay = Math.min(200 * 2 ** attempts, 5000) // real apps add jitter too
      attempts++
      retryTimer = setTimeout(connect, delay)
    })
  }

  onMounted(connect)

  onUnmounted(() => {
    stopped = true
    clearTimeout(retryTimer)
    if (socket) socket.close(1000, 'Component unmounted')
  })

  return { orders, status }
}`

const hubApp = `<script setup>
import { ref } from 'vue'
import { createHub } from './hub.js'

const hub = createHub('wss://cafe.example.com/orders')
const log = ref([])
let off = null

function start() {
  off = hub.subscribe('order:new', (msg) => log.value.push(msg.order.item))
}
function stop() {
  if (off) off()
}
</script>

<template>
  <button class="start" @click="start">Listen</button>
  <button class="stop" @click="stop">Stop</button>
  <ul><li v-for="(item, i) in log" :key="i">{{ item }}</li></ul>
</template>`

export default {
  id: 'realtime-websockets',
  title: 'Real-time UIs with WebSockets',
  summary: 'Push updates from the server the moment they happen: open a WebSocket, turn messages into state, survive disconnects and clean up properly.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['resilient-requests', 'lifecycle-hooks', 'composables-intro'],
  related: ['cancellation-race-conditions', 'pinia-async-patterns', 'effect-scope', 'auth-security', 'project-realtime-dashboard', 'composable-design'],
  tags: ['websocket', 'real-time', 'server-sent events', 'EventSource', 'polling', 'reconnect', 'backoff', 'heartbeat', 'push', 'socket.io'],
  apis: [
    { name: 'new WebSocket(url)', summary: 'Browser API: opens a two-way connection (`wss://` for encrypted).' },
    { name: 'socket.send(data)', summary: 'Sends a string or binary message; throws if the socket is still CONNECTING.' },
    { name: 'message event', summary: '`event.data` holds the received text (or binary data).' },
    { name: 'close event', summary: '`event.code` (1000 = normal), `event.reason`, `event.wasClean`.' },
    { name: 'readyState', summary: '0 CONNECTING · 1 OPEN · 2 CLOSING · 3 CLOSED.' },
    { name: 'EventSource', summary: 'Browser API for Server-Sent Events: one-way server → client stream with automatic reconnection.' },
  ],
  docs: [
    { label: 'Vue Guide — Composables', url: 'https://vuejs.org/guide/reusability/composables.html' },
    { label: 'API — onUnmounted()', url: 'https://vuejs.org/api/composition-api-lifecycle.html#onunmounted' },
    { label: 'MDN — WebSocket', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSocket' },
    { label: 'MDN — CloseEvent codes', url: 'https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code' },
    { label: 'MDN — Using server-sent events', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events' },
  ],

  intro: `
Normal HTTP is a conversation where only the browser speaks first: it asks, the server answers, the line goes quiet. That's perfect for loading a page — and awkward for a chat, a live scoreboard or a café's order screen, where the **server** has news and needs to tell you *now*.

A **WebSocket** is a connection that stays open. After a one-time handshake, **either side can send a message at any moment**. The server pushes "new order #104", your app receives it within milliseconds, and Vue's reactivity updates the screen.

In Vue, the job is the same as with any outside source of events: open the connection when a component (or store) needs it, turn each message into a change of reactive state, and **close it** when nobody needs it anymore.
`,

  why: `
Before push connections, apps faked "live" by **polling** — asking "anything new?" every few seconds ([previous lesson](lesson:resilient-requests)). Polling is simple and often good enough, but for truly live features it has two problems: updates are only as fresh as your polling interval, and most polls come back with "nothing new", wasting requests.

WebSockets fix both: messages arrive when they happen, over one long-lived connection. But they bring new responsibilities that HTTP requests never had:

- connections **drop** (Wi-Fi changes, laptops sleep, servers restart) and must be **re-opened**, ideally without hammering the server;
- messages can arrive **twice** or out of order, so state updates must be safe to repeat;
- a socket opened by a component **keeps running** after the component is gone unless you close it;
- the browser's WebSocket API can't set an \`Authorization\` header, so authentication needs a plan.

This lesson builds a live café order board that handles all of that.
`,

  eli15: `
Regular HTTP is like sending letters: you write, wait for a reply, and if you want to know whether anything changed you have to write again.

A WebSocket is like a **phone call that stays connected**. Once it's open, the café can say "order 104 is ready!" the instant it happens, and you can say "cancel my muffin" without dialling again.

Phone calls drop sometimes. When that happens, you call back — but not 50 times a second; you wait a bit, then a bit longer. And when you're done, you **hang up**, otherwise the line stays busy for nothing.
`,

  analogy: {
    title: 'The kitchen ticket printer',
    body: `
Picture a restaurant. Waiters could walk into the kitchen every two minutes asking "is table 5's food ready?" — that's polling. Most trips are wasted, and food sits waiting until the next trip.

Instead, the kitchen has a **ticket printer at the front counter** wired straight to the cooks. The moment a dish is ready, a ticket prints. Nobody has to ask.

The printer has a cable (the open connection). If someone trips over it (the connection drops), you plug it back in — and check whether you missed any tickets. If a ticket accidentally prints twice, the staff recognise the order number and don't cook it twice. At closing time, you unplug the printer.
`,
    mapping: [
      ['waiters walking to the kitchen to ask', 'polling'],
      ['the ticket printer', 'a WebSocket receiving messages'],
      ['the cable', 'the open connection (`readyState === OPEN`)'],
      ['plugging it back in after a trip', 'reconnecting with backoff'],
      ['recognising a duplicate ticket number', 'deduplicating messages by id'],
      ['unplugging at closing time', '`socket.close(1000)` on unmount'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'A WebSocket\'s life',
    caption: 'Everything your code does maps to one of these states. Reconnecting is your code\'s job: the browser never re-opens a closed WebSocket by itself.',
    alt: 'A state diagram. new WebSocket(url) starts in CONNECTING. After the handshake it becomes OPEN, where messages flow both ways via send() and the message event. From OPEN it goes to CLOSED either cleanly (close code 1000, for example on unmount) or unexpectedly (code 1006 when the connection drops). An unexpected close leads to "wait with backoff", which creates a new socket in CONNECTING. A clean close stops there.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'new', label: 'new WebSocket(url)', note: 'your code', tone: 'paper', x: 90, y: 70 },
        { id: 'connecting', label: 'CONNECTING (0)', note: 'HTTP handshake → upgrade', tone: 'kraft', x: 290, y: 70 },
        { id: 'open', label: 'OPEN (1)', note: 'send() ⇄ message events', tone: 'acid', x: 500, y: 70 },
        { id: 'clean', label: 'CLOSED (3), code 1000', note: 'you hung up: stop', tone: 'ink', x: 680, y: 200 },
        { id: 'dropped', label: 'CLOSED (3), code 1006', note: 'connection lost', tone: 'red', x: 450, y: 250 },
        { id: 'backoff', label: 'wait with backoff', note: '200 ms, 400 ms, 800 ms…', tone: 'cobalt', x: 200, y: 250 },
      ],
      edges: [
        { from: 'new', to: 'connecting' },
        { from: 'connecting', to: 'open', label: 'open event' },
        { from: 'open', to: 'clean', label: 'close(1000)' },
        { from: 'open', to: 'dropped', label: 'network drop' },
        { from: 'dropped', to: 'backoff', label: 'close event' },
        { id: 'retry', from: 'backoff', to: 'connecting', label: 'new socket', dashed: true },
      ],
      steps: [
        { focus: ['new', 'connecting'], edges: ['new->connecting'], text: '`new WebSocket(\'wss://…\')` starts with an ordinary HTTP request asking to "upgrade" the connection. While that happens, `readyState` is CONNECTING and `send()` would throw.' },
        { focus: ['open'], edges: ['connecting->open'], text: 'The `open` event fires. Now both sides can send messages whenever they like — no request/response pairs.' },
        { focus: ['open'], text: 'Each incoming message fires a `message` event; `event.data` is usually a JSON string you parse and apply to reactive state.' },
        { focus: ['clean'], edges: ['open->clean'], text: 'When your component unmounts you call `socket.close(1000)`: a normal, intentional closure. No reconnect.' },
        { focus: ['dropped', 'backoff'], edges: ['open->dropped', 'dropped->backoff'], text: 'If the network drops, the `close` event reports an abnormal code such as 1006. Your code decides to try again — after a growing delay.' },
        { focus: ['backoff', 'connecting'], edges: ['retry'], text: 'A closed WebSocket can\'t be reopened; you create a **new** one. After reconnecting, fetch anything you may have missed.' },
      ],
    },
  },

  syntax: [
    `
#### The browser WebSocket API

This is the real API (static code — the sandbox has no network and uses \`FakeSocket\`, which has the same shape):
`,
    {
      code: `const socket = new WebSocket('wss://cafe.example.com/orders') // wss:// = encrypted

socket.addEventListener('open', () => {
  // only now is it safe to send
  socket.send(JSON.stringify({ type: 'subscribe', channel: 'orders' }))
})

socket.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data) // text frames arrive as strings
  console.log(msg.type, msg)
})

socket.addEventListener('close', (event) => {
  console.log(event.code, event.reason, event.wasClean) // 1000 = normal closure
})

socket.addEventListener('error', () => {
  // carries no useful details; a 'close' event follows
})

socket.close(1000, 'done') // hang up`,
      lang: 'js',
      title: 'WebSocket basics',
      static: true,
    },
    `
- \`readyState\`: \`0\` CONNECTING, \`1\` OPEN, \`2\` CLOSING, \`3\` CLOSED (also available as \`WebSocket.OPEN\` etc.).
- Messages are strings or binary (\`Blob\` / \`ArrayBuffer\`). JSON with a \`type\` field is the usual convention, so one connection can carry many kinds of event.
- \`send()\` throws an \`InvalidStateError\` while CONNECTING. Wait for \`open\` (or queue messages until then).
- Close codes: \`1000\` normal; \`1001\` going away (e.g. page navigating); \`1006\` abnormal — the connection dropped without a proper close (the browser reports it; it is never sent by a server).

#### In a Vue composable

Open on mount, apply messages to refs, close on unmount:
`,
    {
      code: `import { ref, onMounted, onUnmounted } from 'vue'

export function useLiveOrders(url) {
  const orders = ref([])
  const status = ref('connecting')
  let socket = null

  onMounted(() => {
    socket = new WebSocket(url)
    socket.addEventListener('open', () => (status.value = 'open'))
    socket.addEventListener('message', (event) => {
      orders.value = applyMessage(orders.value, JSON.parse(event.data))
    })
    socket.addEventListener('close', () => (status.value = 'closed'))
  })

  onUnmounted(() => socket?.close(1000))   // forgetting this leaks the connection

  return { orders, status }
}`,
      lang: 'js',
      title: 'useLiveOrders()',
    },
    `
\`onUnmounted\` works when the composable is called from a component's setup. If it might also run inside a standalone \`effectScope()\`, use \`onScopeDispose()\` (Vue 3.2+), which fires in both cases — see [effectScope](lesson:effect-scope).

#### Apply messages safely

Connections redeliver and reorder. Make every update **idempotent** (applying it twice is harmless) by working with ids:
`,
    {
      code: `function applyMessage(list, msg) {
  if (msg.type === 'order:new') {
    if (list.some((o) => o.id === msg.order.id)) return list     // seen it: ignore
    return [msg.order, ...list].slice(0, 50)                      // cap memory
  }
  if (msg.type === 'order:update') {
    return list.map((o) => (o.id === msg.id ? { ...o, status: msg.status } : o))
  }
  return list                                                      // unknown types: ignore
}`,
      lang: 'js',
      title: 'an idempotent message reducer',
    },
    `
#### Reconnect with backoff

The browser does **not** reconnect a WebSocket for you. On an *unexpected* close, wait — longer each time, with a cap and some jitter — then create a new socket. Reset the delay after a successful \`open\`. Don't reconnect after an intentional \`close(1000)\`.

After reconnecting, you may have missed messages. Common strategies: re-fetch a fresh snapshot over HTTP, or send the id of the last event you processed so the server can replay what you missed.

#### Alternatives

| | Polling | Long polling | Server-Sent Events | WebSocket |
|---|---|---|---|---|
| Direction | client asks | client asks, server holds the reply | server → client only | both ways |
| Latency | up to one interval | low | low | low |
| Reconnect | n/a | your code | built into \`EventSource\` | your code |
| Typical use | dashboards, job status | legacy real-time | notifications, feeds, progress | chat, collaboration, games |

Server-Sent Events use the browser's \`EventSource\` over plain HTTP: one-way, text-only, and it reconnects automatically (sending a \`Last-Event-ID\` header if the server assigned ids).
`,
    {
      callout: 'note',
      title: 'Socket.IO is not plain WebSocket',
      text: 'Socket.IO is a popular library with its own protocol on top of WebSocket (with an HTTP long-polling fallback, rooms, acknowledgements and automatic reconnection). A Socket.IO client can\'t talk to a plain WebSocket server, and vice versa. Pick it deliberately, as a matched client + server pair.',
    },
  ],

  walkthrough: {
    title: 'useLiveOrders.js — finished',
    lang: 'js',
    code: finishedComposable,
    intro: 'The playground composable after the experiments: the connection lives in one place and every message goes through a pure function.',
    steps: [
      { lines: [2, 3], text: 'A composable built on lifecycle hooks, so it must be called from a component\'s `setup`. `FakeSocket` stands in for the browser\'s `WebSocket`.' },
      { lines: [7, 17], text: '`applyMessage` is a plain function: current list + message → next list. Duplicates are ignored, the list is capped, updates touch only the matching order, unknown types are ignored. No Vue, no socket — trivial to unit test.' },
      { lines: [19, 22], text: 'Reactive state the component renders: the orders and a connection status for the "Live / Offline" badge.' },
      { lines: [24, 32], text: 'Messages are text. A malformed one shouldn\'t crash the app, so parsing is guarded. Assigning a **new array** to `orders.value` triggers the re-render.' },
      { lines: [34, 39], text: 'Open the connection once the component is mounted and wire up the events. (Mounting also means this never runs during server-side rendering.)' },
      { lines: [41, 43], text: 'Hang up when the component goes away, with code 1000 — "normal closure". Without this, the socket and its listeners outlive the component.' },
    ],
  },

  playground: {
    title: 'Café order board',
    objective: 'Turn live messages into correct state: handle status updates, ignore duplicate deliveries and cap the list.',
    files: { 'App.vue': boardApp, 'useLiveOrders.js': playgroundComposable, 'fakeSocket.js': fakeSocket },
    expected: 'After a moment the badge says **● Live** and orders start appearing at the top. Their status never changes from "queued" — `order:update` messages are ignored. The list grows forever. Try **Simulate connection loss**: the badge goes Offline and stays there (reconnecting is Exercise 2).',
    experiments: [
      {
        id: 'status-update',
        task: 'The server also sends `{ type: \'order:update\', id, status }` when a drink moves to "brewing" or "ready". Handle it in `handleMessage`: find the order with that `id` and change its `status`.',
        hint: '`else if (msg.type === \'order:update\') { const order = orders.value.find((o) => o.id === msg.id); if (order) order.status = msg.status }` — or build a new array with `map`.',
        tests: [
          {
            name: 'an order:update changes the status on screen',
            code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
await wait(150)
server.broadcast({ type: 'order:new', order: { id: 1, item: 'Mocha', customer: 'Ada', status: 'queued' } })
server.broadcast({ type: 'order:update', id: 1, status: 'ready' })
await flush()
expect(text('.order[data-id="1"] .status')).toBe('ready')`,
          },
        ],
        explain: 'A live UI is a stream of small changes applied to state. Updating by `id` means it doesn\'t matter where the order sits in the list — and an update for an unknown id simply does nothing.',
      },
      {
        id: 'dedupe',
        task: 'After reconnects, servers sometimes deliver the same message twice. Make `order:new` **ignore** an order whose `id` is already in the list.',
        hint: 'Before `unshift`: `if (orders.value.some((o) => o.id === msg.order.id)) return`.',
        tests: [
          {
            name: 'a duplicate order:new is ignored',
            code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
await wait(150)
const msg = { type: 'order:new', order: { id: 7, item: 'Espresso', customer: 'Alan', status: 'queued' } }
server.broadcast(msg)
server.broadcast(msg)
await flush()
expect(findAll('.order').length).toBe(1)`,
          },
        ],
        explain: 'Making message handling idempotent — safe to apply twice — is the standard answer to "at-least-once" delivery. Without it, a duplicate would also break Vue\'s `v-for` keys (two items with the same key).',
      },
      {
        id: 'cap',
        task: 'An order board that runs all day would keep thousands of orders in memory. Keep only the **5 newest** orders.',
        hint: 'After adding: `orders.value = [msg.order, ...orders.value].slice(0, 5)` (or `orders.value.length = 5` after `unshift` when longer).',
        tests: [
          {
            name: 'only the 5 newest orders are kept',
            code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
await wait(150)
for (let id = 1; id <= 8; id++) {
  server.broadcast({ type: 'order:new', order: { id, item: 'Tea', customer: 'Grace', status: 'queued' } })
}
await flush()
const ids = findAll('.order').map((li) => li.getAttribute('data-id'))
expect(ids).toEqual(['8', '7', '6', '5', '4'])`,
          },
        ],
        explain: 'Streams are unbounded; screens and memory are not. Capping (or windowing) live lists is essential for long-running dashboards — and keeps rendering fast.',
      },
      {
        id: 'watch-the-wire',
        task: 'Open the **Console**, click **Pause / resume demo orders** to stop new ones, then **Simulate connection loss**. Read the close code that gets logged. Now think: which close codes should trigger a reconnect, and which shouldn\'t?',
        hint: 'Compare the 1006 logged here with the 1000 the composable uses on unmount.',
        explain: '1006 means the connection died without a proper goodbye — reconnecting makes sense. 1000 means someone hung up on purpose — reconnecting would fight your own cleanup. Exercise 2 builds exactly this rule.',
      },
    ],
    variants: [
      { id: 'finished', label: 'Finished composable (update + dedupe + cap)', files: { 'App.vue': boardApp, 'useLiveOrders.js': finishedComposable, 'fakeSocket.js': fakeSocket } },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Polling vs push',
    caption: 'Both keep an order list up to date. One asks constantly; the other is told.',
    alt: 'Side-by-side code. Left: a setTimeout polling loop that requests /api/orders every 5 seconds and replaces the list. Right: a WebSocket that receives order messages and applies each one to the list, plus closing on unmount.',
    props: {
      left: {
        label: 'Polling',
        lang: 'js',
        code: `async function poll() {
  orders.value = await getOrders()     // full list every time
  if (!stopped) timer = setTimeout(poll, 5000)
}
onMounted(poll)
onUnmounted(() => {
  stopped = true
  clearTimeout(timer)
})`,
      },
      right: {
        label: 'WebSocket push',
        lang: 'js',
        code: `onMounted(() => {
  socket = new WebSocket(url)
  socket.addEventListener('message', (e) => {
    orders.value = applyMessage(orders.value, JSON.parse(e.data))
  })
  // + reconnect on unexpected close
})
onUnmounted(() => socket.close(1000))`,
      },
      points: [
        'Polling: updates are up to one interval late; most polls return "nothing new".',
        'Push: updates arrive when they happen, as small messages instead of full lists.',
        'Polling is stateless and simple; push needs reconnection, dedupe and resync logic.',
        'Both need cleanup on unmount.',
      ],
    },
  },

  internals: {
    beginner: `
A WebSocket starts life as a normal HTTP request that says "let's upgrade to the WebSocket protocol". If the server agrees, the same network connection stays open and both sides can send small **frames** whenever they want. Your JavaScript only sees events: \`open\`, \`message\`, \`close\`, \`error\`. Vue isn't involved in the networking at all — it just re-renders when your message handler changes a ref.
`,
    technical: [
      `
**The handshake.** The browser sends \`GET /orders\` with \`Upgrade: websocket\`, \`Connection: Upgrade\` and a random \`Sec-WebSocket-Key\`; the server answers \`101 Switching Protocols\`. From then on, the TCP connection carries WebSocket frames instead of HTTP. Because it starts as HTTP, cookies for that host are sent with the handshake, and the browser includes an \`Origin\` header the server should check.

**No custom headers.** The browser \`WebSocket\` constructor accepts only a URL and optional sub-protocols — you can't add \`Authorization\`. Common approaches: cookie-based sessions (the server must verify \`Origin\` to prevent cross-site WebSocket hijacking), sending a token in the **first message** after \`open\`, or a short-lived one-time ticket in the URL (full URLs can end up in logs, so never put long-lived tokens there). See [Authentication & token storage](lesson:auth-security).

**Keep-alives.** The protocol has ping/pong control frames, but browser JavaScript can't send them. Intermediaries (proxies, load balancers) may cut connections that look idle, so many apps send small application-level "ping" messages and treat a missing reply as a dead connection.

**Ordering and duplicates.** Within a single connection, messages arrive in the order they were sent. Across reconnects all bets are off: you might miss events or receive some twice. That's why messages carry ids (or sequence numbers) and handlers are idempotent.

**Where the state lives.** A composable gives each component its own connection — fine for one screen. When several components need the same live data, move the connection and state into a [Pinia store](lesson:pinia-async-patterns) or a shared service with reference-counted subscriptions, so the app keeps **one** socket.
`,
      {
        code: `// Simplified model of a reference-counted shared connection
let socket = null
const handlers = new Set()

export function subscribe(handler) {
  handlers.add(handler)
  if (!socket) {
    socket = new WebSocket(URL)
    socket.addEventListener('message', (e) => handlers.forEach((h) => h(JSON.parse(e.data))))
  }
  return () => {
    handlers.delete(handler)
    if (handlers.size === 0) { socket.close(1000); socket = null }
  }
}`,
        lang: 'js',
        title: 'one socket, many subscribers',
      },
    ],
    production: `
- **One connection per app** (or per domain of data), owned by a service or store; components subscribe and unsubscribe.
- **Reconnect** with exponential backoff, jitter and a cap; reset after a healthy connection; never after an intentional close. Show the connection state to users ("Reconnecting…").
- **Resync after reconnect**: fetch a snapshot or replay from the last event id — assume you missed something.
- **Idempotent handlers** keyed by id; validate message shapes; ignore unknown types so old clients survive new server features.
- **Bound everything**: cap lists, throttle UI updates for high-frequency streams (e.g. batch prices every animation frame), and clean up on unmount.
- **Authentication** without custom headers (cookies + Origin checks, first-message tokens, or short-lived tickets); the server authorises every subscription and message.
- **Choose the simplest tool**: polling for minute-level freshness, SSE for one-way feeds, WebSockets for two-way interaction. Managed real-time services and libraries exist when you need presence, rooms or massive fan-out.
`,
  },

  mistakes: [
    {
      title: 'Not closing the socket on unmount',
      wrong: { code: `onMounted(() => {\n  socket = new WebSocket(url)\n  socket.onmessage = (e) => (orders.value = JSON.parse(e.data))\n})`, lang: 'js' },
      right: { code: `onMounted(() => { /* … */ })\nonUnmounted(() => socket?.close(1000))`, lang: 'js' },
      explanation: 'The connection outlives the component. Every visit to the page adds another socket, the server keeps sending to all of them, and handlers keep updating state nobody displays.',
    },
    {
      title: 'Sending before the connection is open',
      wrong: { code: `const socket = new WebSocket(url)\nsocket.send(JSON.stringify({ type: 'subscribe' })) // InvalidStateError`, lang: 'js' },
      right: { code: `const socket = new WebSocket(url)\nsocket.addEventListener('open', () => {\n  socket.send(JSON.stringify({ type: 'subscribe' }))\n})`, lang: 'js' },
      explanation: 'A new socket is CONNECTING. `send()` throws until the `open` event fires; queue messages or wait for `open`.',
    },
    {
      title: 'Reconnecting instantly and forever',
      wrong: { code: `socket.onclose = () => connect() // tight loop when the server is down`, lang: 'js' },
      right: { code: `socket.onclose = (e) => {\n  if (stopped || e.code === 1000) return\n  setTimeout(connect, Math.min(200 * 2 ** attempts++, 10_000))\n}`, lang: 'js' },
      explanation: 'Instant reconnects hammer a server that is already struggling and burn battery. Back off, cap the delay, and don\'t reconnect after your own intentional close.',
    },
    {
      title: 'Applying messages without checking ids',
      wrong: { code: `if (msg.type === 'order:new') orders.value.push(msg.order) // duplicates after reconnect`, lang: 'js' },
      right: { code: `if (msg.type === 'order:new' && !orders.value.some((o) => o.id === msg.order.id)) {\n  orders.value.push(msg.order)\n}`, lang: 'js' },
      explanation: 'Real-time systems often deliver at least once. Handlers must tolerate repeats.',
    },
    {
      title: 'Putting a long-lived token in the socket URL',
      wrong: { code: `new WebSocket(\`wss://api.example.com/live?token=\${accessToken}\`)`, lang: 'js' },
      right: { code: `const socket = new WebSocket('wss://api.example.com/live')\nsocket.addEventListener('open', () => {\n  socket.send(JSON.stringify({ type: 'auth', token: accessToken }))\n})`, lang: 'js' },
      explanation: 'URLs end up in server and proxy logs. Prefer cookies (with Origin checks), a first-message token, or a short-lived single-use ticket from your API.',
    },
  ],

  debugging: [
    {
      symptom: 'Every message appears two, three, four times after navigating back and forth.',
      cause: 'Each mount opened a new socket (or added another listener) and nothing closed the old ones.',
      fix: 'Close in `onUnmounted`/`onScopeDispose`, or move the connection to a shared service/store with subscribe/unsubscribe.',
    },
    {
      symptom: '`InvalidStateError: Failed to execute \'send\' on \'WebSocket\': Still in CONNECTING state.`',
      cause: '`send()` was called before the `open` event.',
      fix: 'Send inside the `open` handler, or queue outgoing messages until open.',
    },
    {
      symptom: 'The badge says Live but no updates arrive after the laptop wakes from sleep.',
      cause: 'A half-dead connection: no close event has fired yet.',
      fix: 'Use application-level heartbeats (ping/pong messages with a timeout) and reconnect when replies stop.',
    },
    {
      symptom: 'After a reconnect, the list is missing orders that happened while offline.',
      cause: 'Events sent during the outage were never received.',
      fix: 'Resync on reconnect: refetch a snapshot, or ask the server to replay from the last event id.',
    },
    {
      symptom: 'The connection fails immediately in production but works locally.',
      cause: 'Wrong scheme (`ws://` from an `https://` page is blocked as mixed content), a proxy not forwarding upgrades, or authentication/Origin rejected.',
      fix: 'Use `wss://` on HTTPS pages, check the handshake in DevTools (Network → WS), and confirm the proxy/load balancer supports WebSocket upgrades.',
    },
  ],

  bestPractices: [
    'Open the connection when needed and close it with code 1000 when not (`onUnmounted` / `onScopeDispose`).',
    'Keep one connection per app or data domain; share it through a store or service.',
    'Use JSON messages with a `type` and ids; make handlers idempotent and ignore unknown types.',
    'Reconnect on unexpected closes with backoff, jitter and a cap; resync missed data afterwards.',
    'Show connection status in the UI and send heartbeats if idle connections are cut.',
    'Cap and throttle live data so long sessions stay fast.',
    'Authenticate without long-lived tokens in URLs, and authorise every subscription on the server.',
  ],

  useCases: [
    'Chat and support conversations.',
    'Live order boards, delivery tracking and kitchen displays.',
    'Collaborative editing and presence ("Ada is typing…").',
    'Live sports scores and trading prices.',
    'Multiplayer games and interactive classroom tools.',
  ],

  whenToUse: {
    use: [
      'WebSockets for two-way, low-latency interaction (chat, collaboration, games).',
      'Server-Sent Events for one-way server → client feeds (notifications, progress, logs).',
      'Polling when updates every few seconds or minutes are fine and simplicity matters.',
    ],
    avoid: [
      'WebSockets for data that changes rarely — polling or refetch-on-focus is simpler.',
      'One socket per component for shared data — centralise it.',
      'Relying on push alone without a resync strategy after disconnects.',
    ],
  },

  comparison: {
    title: 'Ways to get fresh data',
    headers: ['', 'Polling', 'Long polling', 'Server-Sent Events', 'WebSocket'],
    rows: [
      ['Who starts', 'client, on a timer', 'client; server replies when there is news', 'server, over one HTTP response', 'either side'],
      ['Direction', 'request/response', 'request/response', 'server → client', 'both ways'],
      ['Freshness', 'up to one interval late', 'near real-time', 'near real-time', 'near real-time'],
      ['Reconnect', 'not needed', 'your code', 'automatic (EventSource)', 'your code'],
      ['Data', 'anything HTTP', 'anything HTTP', 'UTF-8 text', 'text or binary'],
      ['Complexity', 'lowest', 'medium', 'low', 'highest'],
    ],
    note: 'Start with the simplest option that meets your freshness requirement.',
  },

  quiz: [
    {
      id: 'realtime-websockets-q1',
      type: 'mcq',
      prompt: 'Which feature benefits most from a WebSocket rather than polling?',
      options: [
        { text: 'A chat where messages should appear instantly and users also send messages.' },
        { text: 'A settings page that loads once when opened.', why: 'One request is enough; nothing needs to be pushed.' },
        { text: 'A monthly sales report.', why: 'Data that changes rarely doesn\'t need a live connection.' },
        { text: 'An "About us" page.', why: 'Static content needs no real-time channel at all.' },
      ],
      answer: 0,
      explanation: 'Two-way, low-latency interaction is exactly what WebSockets are for. For rarely changing data, a plain request (or occasional polling) is simpler.',
    },
    {
      id: 'realtime-websockets-q2',
      type: 'output',
      prompt: 'What is logged?',
      code: {
        lang: 'js',
        code: `const socket = new WebSocket('wss://cafe.example.com/orders')
console.log(socket.readyState)
socket.addEventListener('open', () => console.log(socket.readyState))`,
      },
      options: ['`1` then `1`', '`0` then `1`', '`0` then `3`', '`undefined` then `1`'],
      answer: 1,
      explanation: 'A new socket starts CONNECTING (0). When the handshake completes the `open` event fires and `readyState` is OPEN (1).',
    },
    {
      id: 'realtime-websockets-q3',
      type: 'bug',
      prompt: 'This throws `InvalidStateError` every time. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `onMounted(() => {
  socket = new WebSocket(url)
  socket.send(JSON.stringify({ type: 'subscribe', channel: 'orders' }))
  socket.addEventListener('message', handleMessage)
})
onUnmounted(() => socket.close(1000))`,
      },
      answerLine: 3,
      explanation: 'Right after construction the socket is still CONNECTING, and `send()` throws. Move the subscribe message into an `open` event listener.',
    },
    {
      id: 'realtime-websockets-q4',
      type: 'fill',
      prompt: 'Complete the handler that turns incoming messages into objects.',
      code: {
        lang: 'js',
        code: `socket.addEventListener('___', (event) => {
  const msg = JSON.parse(event.___)
  orders.value = applyMessage(orders.value, msg)
})`,
      },
      answer: [['message'], ['data']],
      explanation: 'Incoming frames fire `message` events; the payload is in `event.data` (a string for text frames).',
    },
    {
      id: 'realtime-websockets-q5',
      type: 'mcq',
      prompt: 'Your `close` handler receives `event.code`. When should the app automatically reconnect?',
      options: [
        { text: 'On 1006 (abnormal closure, e.g. the network dropped).' },
        { text: 'On 1000 after your own `socket.close(1000)` during unmount.', why: 'You closed it on purpose; reconnecting would undo your own cleanup and leak a socket.' },
        { text: 'Never — the browser reconnects WebSockets automatically.', why: 'It doesn\'t. (EventSource for Server-Sent Events does; WebSocket doesn\'t.)' },
        { text: 'Immediately, in a loop, until it works.', why: 'Without backoff this hammers a server that may be down and drains battery.' },
      ],
      answer: 0,
      explanation: 'Reconnect after unexpected closures, with backoff. Intentional closes end the connection for good.',
    },
    {
      id: 'realtime-websockets-q6',
      type: 'mcq',
      prompt: 'Select **all** true statements about Server-Sent Events (EventSource).',
      options: [
        { text: 'They carry data from the server to the client only.' },
        { text: 'EventSource reconnects automatically after a dropped connection.' },
        { text: 'They are a good fit for sending chat messages *from* the client.', why: 'SSE is one-way. The client would send messages with ordinary HTTP requests instead.' },
        { text: 'They require the Socket.IO library.', why: 'EventSource is a built-in browser API that works over plain HTTP.' },
      ],
      answer: [0, 1],
      explanation: 'SSE is a one-way stream over HTTP with built-in reconnection — great for notifications and progress feeds.',
    },
    {
      id: 'realtime-websockets-q7',
      type: 'short',
      prompt: 'Why should a WebSocket message handler be idempotent (safe to apply the same message twice)?',
      answer: 'Because real-time systems may deliver a message more than once — for example after a reconnect or a server retry — and messages from different connections can overlap. If applying a message twice changes the result (a duplicate order, a double-counted total), the UI drifts from the truth. Keying updates by id (upsert, ignore known ids) makes repeats harmless.',
    },
  ],

  exercises: [
    {
      id: 'socket-cleanup',
      title: 'Hang up when you leave',
      difficulty: 'intermediate',
      prompt: `
\`LiveBoard.vue\` uses \`useLiveOrders()\` to open a live connection. The \`button.toggle\` in App.vue hides and shows the board. Hide it, show it, hide it again… and the old connections stay open.

Fix **useLiveOrders.js** so that the socket is closed with code **1000** ("normal closure") when the component using it unmounts.

Tests toggle the board and check \`server.openSockets\` and \`server.closeLog\` from **fakeSocket.js**.
`,
      files: { 'App.vue': toggleApp, 'LiveBoard.vue': liveBoard, 'useLiveOrders.js': cleanupStarter, 'fakeSocket.js': fakeSocket },
      hints: [
        'Composables can register lifecycle hooks too — they attach to the component whose `setup` called the composable.',
        'Import `onUnmounted` from `\'vue\'`.',
        '`onUnmounted(() => { if (socket) socket.close(1000, \'Component unmounted\') })`.',
      ],
      solution: {
        explanation: 'Whatever a component opens, it must close. Because the hook is registered inside the composable, every component that uses `useLiveOrders()` gets the cleanup automatically. Code 1000 tells the server (and your own reconnect logic) that this was intentional.',
        files: { 'App.vue': toggleApp, 'LiveBoard.vue': liveBoard, 'useLiveOrders.js': cleanupSolution, 'fakeSocket.js': fakeSocket },
      },
      tests: [
        {
          name: 'hiding the board closes its socket',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
await wait(150)
expect(server.openSockets).toBe(1)
await click('.toggle')
await wait(50)
expect(server.openSockets).toBe(0)`,
        },
        {
          name: 'the socket is closed with code 1000',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
await wait(150)
await click('.toggle')
await wait(50)
expect(server.closeLog.length).toBe(1)
expect(server.closeLog[0].code).toBe(1000)`,
        },
        {
          name: 'hide + show leaves exactly one open socket',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
await wait(150)
await click('.toggle')
await click('.toggle')
await wait(200)
expect(server.openSockets).toBe(1)`,
        },
      ],
    },
    {
      id: 'reconnect',
      title: 'Reconnect with backoff',
      difficulty: 'advanced',
      prompt: `
When the connection drops, the board shows "Offline" forever. Make **useLiveOrders.js** reconnect:

- on a \`close\` event with a code **other than 1000**, set \`status\` to \`'reconnecting'\` and create a **new** socket after \`200 * 2 ** attempts\` ms (cap it at 5000), incrementing \`attempts\`;
- on \`open\`, set \`status\` to \`'open'\` and reset \`attempts\` to 0;
- messages must keep working on the new socket (attach the listeners to every socket you create);
- after the component **unmounts**, never reconnect: stop, clear any pending retry timer and close with 1000.

\`.conn\` in LiveBoard.vue already shows "Live", "Reconnecting…" and "Offline". Tests call \`server.drop()\` and toggle the board with \`.toggle\`.
`,
      files: { 'App.vue': toggleApp, 'LiveBoard.vue': liveBoard, 'useLiveOrders.js': cleanupSolution, 'fakeSocket.js': fakeSocket },
      hints: [
        'Move the socket setup into a `connect()` function so you can call it again; `onMounted(connect)`.',
        'In the close listener: `if (stopped || event.code === 1000) { status.value = \'closed\'; return }`, otherwise set `\'reconnecting\'` and `retryTimer = setTimeout(connect, Math.min(200 * 2 ** attempts, 5000)); attempts++`.',
        'In `onUnmounted`: `stopped = true; clearTimeout(retryTimer); socket?.close(1000)`. Reset `attempts = 0` in the open listener.',
      ],
      solution: {
        explanation: 'Wrapping setup in `connect()` makes reconnecting just "call it again". The close code separates "we hung up" (1000) from "we were cut off" (anything else), and the `stopped` flag plus clearing the timer guarantee that an unmounted component never resurrects its connection. Real code would add jitter and resync missed data after reconnecting.',
        files: { 'App.vue': toggleApp, 'LiveBoard.vue': liveBoard, 'useLiveOrders.js': reconnectSolution, 'fakeSocket.js': fakeSocket },
      },
      tests: [
        {
          name: 'a dropped connection shows Reconnecting… then Live again',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
await wait(150)
server.drop()
await flush()
expect(text('.conn')).toContain('Reconnecting')
await wait(600)
expect(text('.conn')).toContain('Live')
expect(server.connections).toBe(2)`,
        },
        {
          name: 'messages arrive on the new connection',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
await wait(150)
server.drop()
await wait(600)
server.broadcast({ type: 'order:new', order: { id: 1, item: 'Matcha', customer: 'Hedy', status: 'queued' } })
await flush()
expect(findAll('.order').length).toBe(1)`,
        },
        {
          name: 'no reconnect after the board is hidden',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
await wait(150)
await click('.toggle')
await wait(700)
expect(server.connections).toBe(1)
expect(server.openSockets).toBe(0)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'realtime-websockets-compare',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Compare polling, long polling, Server-Sent Events and WebSockets. How do you choose for a given feature?',
      answer: 'Polling asks on a timer: simplest, but up to one interval stale and wasteful when nothing changes. Long polling holds each request open until there is news: near real-time over plain HTTP, but you manage reconnect loops. SSE (EventSource) is a one-way server→client text stream over HTTP with automatic reconnection: ideal for notifications, feeds and progress. WebSockets are a persistent two-way channel for text or binary: best for chat, collaboration and games, at the cost of reconnection, resync and scaling complexity. Choose the simplest option that meets the freshness and direction requirements.',
      explanation: 'Direction (one-way vs two-way) and required freshness drive the choice.',
      whyAsked: 'Shows breadth and pragmatic judgement rather than defaulting to WebSockets for everything.',
      mistakes: ['Saying WebSockets are always better.', 'Not knowing SSE exists.', 'Forgetting that WebSockets need your own reconnect logic.'],
      followUps: ['How would you scale WebSockets to many servers?', 'How do proxies affect long-lived connections?', 'What does EventSource send on reconnect?'],
      modelAnswer: 'I start from two questions: how fresh must the data be, and does the client need to send as well as receive? For minute-level freshness, polling — maybe pausing in background tabs — is the simplest robust choice. For one-way live feeds like notifications or job progress, Server-Sent Events are great: plain HTTP, text, and EventSource reconnects automatically. When both sides talk constantly — chat, collaborative editing, games — I use WebSockets and accept the extra work: reconnect with backoff, resync after outages, heartbeats and server-side fan-out. Long polling is mostly a fallback today.',
    },
    {
      id: 'realtime-websockets-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Several components across a Vue app need live updates (notifications badge, chat panel, order list). How do you structure the WebSocket code?',
      answer: 'One connection owned by a service or Pinia store, not by components. It handles connect, auth, heartbeats, reconnect with backoff and resync. It exposes typed subscriptions (`subscribe(type, handler)` returning an unsubscribe function) or reactive state in stores; the connection opens with the first subscriber and closes with the last (reference counting). Components subscribe in setup and unsubscribe on unmount (`onUnmounted`/`onScopeDispose`). Message handling is done by pure, idempotent reducers per domain, which are unit tested; UI-level throttling protects rendering for high-frequency streams.',
      explanation: 'Centralise the transport, distribute the data.',
      whyAsked: 'Senior candidates are expected to design shared infrastructure that avoids leaks and duplicate connections.',
      mistakes: ['A socket per component.', 'No unsubscribe/cleanup story.', 'Mixing message parsing with rendering logic.'],
      followUps: ['How would you test this?', 'What happens to subscriptions during a reconnect?', 'How would you authenticate?'],
      modelAnswer: 'I\'d have one connection per app, owned by a small service — or a Pinia store when the live data is shared state. That layer owns the hard parts: authentication, heartbeats, reconnecting with backoff and jitter, and resyncing after an outage. It exposes subscriptions by message type that return an unsubscribe function, and it opens the socket on the first subscriber and closes it after the last. Components subscribe in setup and unsubscribe in onUnmounted, or simply read store state. Each domain applies messages with pure, idempotent reducers, which makes the logic easy to unit test with fake messages.',
    },
    {
      id: 'realtime-websockets-reconnect',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Users on trains complain the live board "freezes". Connections drop frequently. What\'s your reconnection strategy?',
      answer: 'Detect drops (close events, plus application-level heartbeats for half-dead connections), show the connection state ("Reconnecting…"), reconnect with exponential backoff + jitter and a cap, reset the backoff after a stable connection, never reconnect after an intentional close, and after reconnecting resync: fetch a snapshot or request events since the last processed id. Make handlers idempotent so replays don\'t duplicate data. Optionally reconnect immediately when the browser reports it\'s back online.',
      explanation: 'Reconnecting restores the pipe; resync restores the data.',
      whyAsked: 'Real-time features are judged by how they behave on bad networks.',
      mistakes: ['Reconnecting without resyncing.', 'Tight reconnect loops.', 'Hiding the connection state from users.'],
      followUps: ['How do heartbeats work if the browser can\'t send ping frames?', 'How would you test reconnect logic?', 'What if the server is down for an hour?'],
      modelAnswer: 'First I make drops visible: listen for close events and add an application-level ping with a timeout to catch connections that die silently. On an unexpected close I show "Reconnecting…" and retry with exponential backoff, jitter and a cap, resetting it once a connection has been healthy for a while. Intentional closes never reconnect. Crucially, after reconnecting I resync — either refetch the current snapshot over HTTP or ask the server for events after the last id I processed — and my handlers are idempotent so overlaps are harmless.',
    },
    {
      id: 'realtime-websockets-leak',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After visiting the dashboard, leaving and coming back a few times, each notification toast appears several times. What is the likely cause and fix?',
      code: {
        lang: 'js',
        code: `// NotificationsBell.vue
onMounted(() => {
  const socket = new WebSocket(url)
  socket.addEventListener('message', (e) => showToast(JSON.parse(e.data)))
})`,
      },
      answer: 'Each mount creates a new socket and listener, and nothing closes them on unmount, so old connections keep receiving and toasting. Keep a reference and close it in `onUnmounted` (code 1000) — better, move the connection into a shared service/store that components subscribe to and unsubscribe from.',
      explanation: 'Leaked connections multiply with every remount.',
      whyAsked: 'A very common real-world leak that tests lifecycle awareness.',
      mistakes: ['Deduplicating toasts instead of fixing the leak.', 'Blaming the server for sending duplicates.', 'Removing the listener but leaving the socket open.'],
      followUps: ['How would you detect this in DevTools?', 'Would `onScopeDispose` be better here?', 'How do you design the shared service?'],
      modelAnswer: 'Every time the component mounts it opens a new WebSocket, and nothing closes it on unmount, so after three visits there are three connections each firing the toast. In DevTools\' Network tab, filtered to WS, you\'d see them all open. The fix is to keep the socket in a variable and close it in onUnmounted with code 1000 — and for something app-wide like notifications, I\'d move the connection to a store or service so there\'s one socket and components just subscribe.',
    },
    {
      id: 'realtime-websockets-ordering',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'How do you keep client state correct when real-time messages can be duplicated, lost during disconnects, or arrive out of order relative to HTTP responses?',
      answer: 'Give every entity an id and every change a version or sequence number. Apply messages idempotently (upsert by id, ignore known events) and discard updates older than the version you have. Start from a snapshot (HTTP) and apply only events newer than the snapshot; after reconnecting, resync by refetching or replaying from the last processed sequence. Treat the server as the source of truth and reconcile periodically if needed.',
      explanation: 'Snapshot + ordered deltas + idempotency is the standard recipe.',
      whyAsked: 'Distinguishes engineers who\'ve built real-time features from those who\'ve only demoed them.',
      mistakes: ['Assuming at-most-once, in-order delivery forever.', 'Applying a delta older than the snapshot.', 'No resync after reconnect.'],
      followUps: ['What\'s the race between the initial HTTP load and the first socket messages?', 'How would CRDTs help in collaborative editing?', 'How do you test this?'],
      modelAnswer: 'Within one connection order is preserved, but across reconnects and between HTTP and the socket it isn\'t, and delivery may be at-least-once. So I make state updates idempotent — upsert by id, ignore events I\'ve seen — and attach versions or sequence numbers so I can drop anything older than what I have. On load I take a snapshot that includes its version, then only apply events after it. After a reconnect I either refetch the snapshot or ask for events since my last sequence number. The server stays the source of truth.',
    },
    {
      id: 'realtime-websockets-hub',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 12,
      question: 'Implement `createHub(url)` in **hub.js**: a shared connection with `subscribe(type, handler)`. All subscribers share **one** `FakeSocket`, opened on the **first** subscribe. Each handler only receives parsed messages whose `type` matches. `subscribe` returns an unsubscribe function; when the **last** subscriber leaves, close the socket with 1000. Subscribing again later opens a new socket.',
      starter: {
        files: {
          'App.vue': hubApp,
          'fakeSocket.js': fakeSocket,
          'hub.js': `// hub.js
import { FakeSocket } from './fakeSocket.js'

export function createHub(url) {
  function subscribe(type, handler) {
    const socket = new FakeSocket(url)
    socket.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === type) handler(msg)
    })
    return () => {}
  }
  return { subscribe }
}`,
        },
      },
      tests: [
        {
          name: 'two subscribers share one connection',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
const hub = requireModule('hub.js').createHub('wss://test')
hub.subscribe('order:new', () => {})
hub.subscribe('order:update', () => {})
await wait(150)
expect(server.connections).toBe(1)`,
        },
        {
          name: 'messages are routed by type',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
const hub = requireModule('hub.js').createHub('wss://test')
const got = []
hub.subscribe('order:new', (m) => got.push('new:' + m.order.id))
hub.subscribe('order:update', (m) => got.push('update:' + m.id))
await wait(150)
server.broadcast({ type: 'order:new', order: { id: 5 } })
server.broadcast({ type: 'order:update', id: 5, status: 'ready' })
expect(got).toEqual(['new:5', 'update:5'])`,
        },
        {
          name: 'the socket closes (1000) after the last unsubscribe',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
const hub = requireModule('hub.js').createHub('wss://test')
const off1 = hub.subscribe('order:new', () => {})
const off2 = hub.subscribe('order:new', () => {})
await wait(150)
off1()
expect(server.openSockets).toBe(1)
off2()
expect(server.openSockets).toBe(0)
expect(server.closeLog[0].code).toBe(1000)`,
        },
        {
          name: 'subscribing again opens a fresh connection',
          code: `const { server } = requireModule('fakeSocket.js')
server.autoplay = false
const hub = requireModule('hub.js').createHub('wss://test')
const off = hub.subscribe('order:new', () => {})
await wait(150)
off()
hub.subscribe('order:new', () => {})
await wait(150)
expect(server.connections).toBe(2)
expect(server.openSockets).toBe(1)`,
        },
      ],
      hints: [
        'Keep `let socket = null` and a `Set` of `{ type, handler }` subscriptions in the closure.',
        'On subscribe: add to the set; if `socket` is null, create it and add **one** message listener that loops over the set and calls matching handlers.',
        'The unsubscribe function deletes its entry; if the set is now empty, `socket.close(1000)` and set `socket = null`.',
      ],
      answer: 'Reference counting: a set of subscriptions plus one lazily created socket with a single message listener that fans out by type; the last unsubscribe closes it.',
      solution: {
        files: {
          'App.vue': hubApp,
          'fakeSocket.js': fakeSocket,
          'hub.js': `// hub.js
import { FakeSocket } from './fakeSocket.js'

export function createHub(url) {
  let socket = null
  const subscriptions = new Set()

  function dispatch(event) {
    const msg = JSON.parse(event.data)
    for (const sub of subscriptions) {
      if (sub.type === msg.type) sub.handler(msg)
    }
  }

  function subscribe(type, handler) {
    const sub = { type, handler }
    subscriptions.add(sub)
    if (!socket) {
      socket = new FakeSocket(url) // a real app: new WebSocket(url)
      socket.addEventListener('message', dispatch)
    }
    return function unsubscribe() {
      subscriptions.delete(sub)
      if (subscriptions.size === 0 && socket) {
        socket.close(1000, 'No subscribers')
        socket = null
      }
    }
  }

  return { subscribe }
}`,
        },
      },
      explanation: 'One socket, one listener, many subscribers. Storing each subscription as its own object means the same handler can subscribe twice and unsubscribe independently. Closing on the last unsubscribe makes component cleanup (`onUnmounted(off)`) automatically release the connection.',
      whyAsked: 'Tests closures, resource lifetimes and API design — the core of real-time infrastructure in SPAs.',
      mistakes: ['Opening a socket per subscriber.', 'Adding a new message listener per subscriber.', 'Never closing, or closing while subscribers remain.'],
      followUps: ['Add reconnect with backoff to the hub.', 'How would you send a server-side "subscribe" message per type?', 'How would a Vue composable wrap this?'],
      modelAnswer: 'The hub keeps a set of subscriptions and a single socket in a closure. The first subscribe creates the socket and attaches one message listener that parses each message and calls the handlers whose type matches. Each subscribe returns an unsubscribe function that removes its own entry and, if it was the last one, closes the socket with 1000 and clears the reference so a later subscribe opens a fresh connection. A composable would call subscribe in setup and pass the unsubscribe function to onUnmounted.',
    },
    {
      id: 'realtime-websockets-auth',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you authenticate a browser WebSocket connection, given that you can\'t set an `Authorization` header?',
      answer: 'Options: rely on the session cookie sent with the HTTP upgrade request — and have the server verify the `Origin` header to prevent cross-site WebSocket hijacking; send a token in the first message after `open` and have the server reject unauthenticated sockets; or fetch a short-lived, single-use ticket from your API and pass it in the URL (never a long-lived token, because URLs get logged). In all cases the server authorises every subscription and message, and handles token expiry (closing with an application close code so the client can refresh and reconnect).',
      explanation: 'The browser WebSocket constructor only accepts a URL and sub-protocols.',
      whyAsked: 'Security-aware real-time design is a common senior interview topic.',
      mistakes: ['Claiming you can pass headers in the constructor.', 'Putting long-lived access tokens in the query string.', 'Forgetting Origin checks with cookie auth.'],
      followUps: ['What is cross-site WebSocket hijacking?', 'How do you handle token expiry on a long-lived socket?', 'Which close codes can applications use? (4000–4999)'],
      modelAnswer: 'The browser API won\'t let me set an Authorization header, so I pick one of three patterns. With cookie sessions, the cookie travels with the upgrade request, but the server must check the Origin header, otherwise another site could open an authenticated socket on the user\'s behalf. Or I connect unauthenticated and send the token as the first message, with the server dropping sockets that don\'t authenticate quickly. Or I exchange my token for a short-lived one-time ticket and put that in the URL — never the real token, since URLs end up in logs. Either way, the server authorises every subscription, and token expiry is signalled with a custom close code so the client can refresh and reconnect.',
    },
  ],

  takeaways: [
    'A WebSocket is a long-lived, two-way connection: `open`, `message`, `close`, `error`; `send()` only once OPEN.',
    'In Vue, open on mount, turn messages into reactive state, and close with code 1000 on unmount (`onUnmounted` / `onScopeDispose`).',
    'Make message handling idempotent and capped: upsert by id, ignore duplicates and unknown types, limit list size.',
    'The browser never reconnects a WebSocket for you — reconnect on unexpected closes with backoff, then resync missed data.',
    'Share one connection across the app through a service or store with subscribe/unsubscribe.',
    'Pick the simplest channel that fits: polling, Server-Sent Events, or WebSockets.',
  ],
}
