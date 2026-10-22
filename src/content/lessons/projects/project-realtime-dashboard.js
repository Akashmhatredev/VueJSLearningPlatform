// Project 8: Real-Time Dashboard — a simulated WebSocket, live updates, connection states, reconnect, cleanup.

const socketJs = `// A pretend WebSocket — SIMPLIFIED, for the sandbox (there is no network).
// It copies the parts of the browser's WebSocket API this app uses:
//   readyState (CONNECTING/OPEN/CLOSING/CLOSED), send(), close(),
//   onopen / onmessage / onerror / onclose (or addEventListener),
//   and messages that arrive as JSON *strings* in event.data.
// Behind it sits a tiny fake server that pushes order metrics.

export const TIMING = {
  connectMs: 100, // handshake time
  tickMs: 250, // the server pushes an update this often once you subscribe
  lifetimeMs: 60000, // like servers during a deploy, it drops every connection after a while
}

let outageUntil = 0

// Deterministic pseudo-random numbers, so the demo behaves the same every run.
function seededRandom(seed) {
  let a = seed
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RESTAURANTS = ['Bao House', 'Pizza Forno', 'Green Bowl', 'Taco Norte', 'Sushi Kai', 'Curry Leaf']

function makeEvent(type, props) {
  // Simplified: real sockets dispatch MessageEvent / CloseEvent objects.
  const event = new Event(type)
  return Object.assign(event, props)
}

export class FakeSocket extends EventTarget {
  constructor(url) {
    super()
    this.url = url
    this.readyState = FakeSocket.CONNECTING
    this.onopen = null
    this.onmessage = null
    this.onerror = null
    this.onclose = null
    this._timers = []
    this._ticker = null
    this._seq = 0
    this._random = seededRandom(42)
    FakeSocket.instances.push(this)

    this._later(() => {
      if (Date.now() < outageUntil) {
        this._fail() // the network is down: the handshake fails
        return
      }
      this.readyState = FakeSocket.OPEN
      this._emit('open', makeEvent('open', {}))
      this._later(() => this._serverClose(1001, 'Server restarting'), TIMING.lifetimeMs)
    }, TIMING.connectMs)
  }

  send(data) {
    // Like the real API: sending before the connection is open throws.
    if (this.readyState === FakeSocket.CONNECTING) {
      throw new DOMException("Failed to execute 'send' on 'WebSocket': Still in CONNECTING state.", 'InvalidStateError')
    }
    if (this.readyState !== FakeSocket.OPEN) return // closing/closed: silently dropped
    const message = JSON.parse(data)
    if (message.type === 'subscribe' && !this._ticker) {
      this._ticker = setInterval(() => this._tick(), TIMING.tickMs)
    }
  }

  close(code = 1000, reason = '') {
    if (this.readyState === FakeSocket.CLOSING || this.readyState === FakeSocket.CLOSED) return
    this.readyState = FakeSocket.CLOSING
    setTimeout(() => this._finish(code, reason, true), 0) // closing is asynchronous
  }

  // ---- fake server internals
  _later(fn, ms) {
    this._timers.push(setTimeout(fn, ms))
  }

  _emit(type, event) {
    this.dispatchEvent(event)
    const handler = this['on' + type]
    if (typeof handler === 'function') handler.call(this, event)
  }

  _tick() {
    this._seq++
    FakeSocket.stats.ticks++
    const wave = Math.sin(this._seq / 4)
    const metrics = {
      type: 'metrics',
      seq: this._seq,
      at: Date.now(),
      ordersPerMinute: Math.round(42 + wave * 12 + this._random() * 6),
      activeCouriers: Math.round(18 + wave * 4 + this._random() * 2),
      avgDeliveryMin: Math.round((27 - wave * 3 + this._random() * 2) * 10) / 10,
    }
    this._emit('message', makeEvent('message', { data: JSON.stringify(metrics) }))
    if (this._seq % 2 === 0) {
      const order = {
        type: 'order',
        id: 'A-' + (1000 + this._seq),
        restaurant: RESTAURANTS[Math.floor(this._random() * RESTAURANTS.length)],
        totalCents: 1200 + Math.floor(this._random() * 3800),
      }
      this._emit('message', makeEvent('message', { data: JSON.stringify(order) }))
    }
  }

  _stopTimers() {
    this._timers.forEach(clearTimeout)
    this._timers = []
    clearInterval(this._ticker)
    this._ticker = null
  }

  _finish(code, reason, wasClean) {
    this._stopTimers()
    this.readyState = FakeSocket.CLOSED
    this._emit('close', makeEvent('close', { code, reason, wasClean }))
  }

  _fail() {
    this._stopTimers()
    this.readyState = FakeSocket.CLOSED
    this._emit('error', makeEvent('error', {}))
    this._emit('close', makeEvent('close', { code: 1006, reason: '', wasClean: false }))
  }

  _serverClose(code, reason) {
    if (this.readyState !== FakeSocket.OPEN) return
    this.readyState = FakeSocket.CLOSING
    this._finish(code, reason, code !== 1006)
  }
}

FakeSocket.CONNECTING = 0
FakeSocket.OPEN = 1
FakeSocket.CLOSING = 2
FakeSocket.CLOSED = 3

// ---- inspection and simulation helpers (for the demo panel and tests)
FakeSocket.instances = []
FakeSocket.stats = { ticks: 0 }
FakeSocket.openCount = () => FakeSocket.instances.filter((s) => s.readyState === FakeSocket.OPEN).length

// Drop every open connection (code 1006 = abnormal closure) and refuse
// new handshakes for ms milliseconds.
FakeSocket.simulateOutage = (ms) => {
  outageUntil = Date.now() + ms
  FakeSocket.instances.forEach((socket) => socket._serverClose(1006, 'Connection lost'))
}
FakeSocket.endOutage = () => {
  outageUntil = 0
}
`

const starterComposableJs = `import { ref, shallowRef } from 'vue'
import { FakeSocket } from './socket.js'

export function useLiveFeed(url, { historySize = 30, feedSize = 6, maxAttempts = 3, baseDelayMs = 100, maxDelayMs = 400 } = {}) {
  const status = ref('connecting') // 'connecting' | 'live' | 'reconnecting' | 'offline'
  const attempt = ref(0)
  const latest = shallowRef(null)
  const history = shallowRef([])
  const orders = shallowRef([])
  const paused = ref(false)
  const missed = ref(0)

  const socket = new FakeSocket(url)
  socket.onopen = () => {
    status.value = 'live'
    socket.send(JSON.stringify({ type: 'subscribe', channel: 'orders' }))
  }
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.type === 'metrics') {
      latest.value = message
      // TODO (step 4): keep only the last historySize points
      history.value = [...history.value, message.ordersPerMinute]
    } else if (message.type === 'order') {
      orders.value = [message, ...orders.value].slice(0, feedSize)
    }
  }

  // TODO (step 3): close the socket and clear timers when the owner goes away (onScopeDispose)
  // TODO (step 5): onclose → reconnect with exponential backoff; give up ('offline') after maxAttempts
  // TODO (step 6): pause() / resume() with a bounded buffer

  function pause() {}
  function resume() {}
  function retryNow() {}
  function stop() {}

  return { status, attempt, latest, history, orders, paused, missed, pause, resume, retryNow, stop }
}
`

const composableJs = `import { ref, shallowRef, onScopeDispose } from 'vue'
import { FakeSocket } from './socket.js'

// Owns one live connection: connect, receive, reconnect, pause, clean up.
export function useLiveFeed(url, { historySize = 30, feedSize = 6, maxAttempts = 3, baseDelayMs = 100, maxDelayMs = 400 } = {}) {
  const status = ref('connecting') // 'connecting' | 'live' | 'reconnecting' | 'offline'
  const attempt = ref(0) // failed attempts since the last successful connection
  const latest = shallowRef(null) // the newest metrics message
  const history = shallowRef([]) // last historySize values, replaced (not mutated) on each update
  const orders = shallowRef([]) // newest first, at most feedSize
  const paused = ref(false)
  const missed = ref(0)

  // Not reactive on purpose: a socket is a live object with its own internal
  // state. Nothing in the template needs to track it, so Vue never proxies it.
  let socket = null
  let retryTimer = null
  let stopped = false
  let buffer = []

  function connect() {
    status.value = attempt.value === 0 ? 'connecting' : 'reconnecting'
    socket = new FakeSocket(url)
    socket.onopen = () => {
      status.value = 'live'
      attempt.value = 0
      socket.send(JSON.stringify({ type: 'subscribe', channel: 'orders' }))
    }
    socket.onmessage = (event) => receive(JSON.parse(event.data))
    socket.onclose = () => {
      socket = null
      if (!stopped) scheduleReconnect()
    }
  }

  // Exponential backoff: 100 ms, 200 ms, 400 ms… capped, then give up.
  // SIMPLIFIED: production code adds random jitter, more attempts,
  // heartbeats to detect dead connections, and a resync after reconnecting.
  function scheduleReconnect() {
    attempt.value++
    if (attempt.value > maxAttempts) {
      status.value = 'offline'
      return
    }
    status.value = 'reconnecting'
    const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt.value - 1))
    retryTimer = setTimeout(connect, delay)
  }

  function receive(message) {
    if (paused.value) {
      missed.value++
      buffer.push(message)
      // Only the newest messages can still matter: keep the buffer bounded.
      if (buffer.length > historySize + feedSize) buffer.shift()
      return
    }
    apply(message)
  }

  function apply(message) {
    if (message.type === 'metrics') {
      latest.value = message
      history.value = [...history.value, message.ordersPerMinute].slice(-historySize)
    } else if (message.type === 'order') {
      orders.value = [message, ...orders.value].slice(0, feedSize)
    }
  }

  function pause() {
    paused.value = true
  }

  function resume() {
    paused.value = false
    buffer.forEach(apply)
    buffer = []
    missed.value = 0
  }

  function retryNow() {
    clearTimeout(retryTimer)
    attempt.value = 0
    connect()
  }

  function stop() {
    stopped = true
    clearTimeout(retryTimer)
    if (socket) socket.close(1000, 'Client left')
    socket = null
  }

  connect()
  // Runs when the owning component unmounts — or any effect scope stops.
  onScopeDispose(stop)

  return { status, attempt, latest, history, orders, paused, missed, pause, resume, retryNow, stop }
}
`

const badgeVue = `<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
  attempt: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 3 },
})

const label = computed(() => {
  if (props.status === 'live') return 'Live'
  if (props.status === 'connecting') return 'Connecting…'
  if (props.status === 'reconnecting') {
    return 'Reconnecting… (attempt ' + Math.min(props.attempt, props.maxAttempts) + ' of ' + props.maxAttempts + ')'
  }
  return 'Offline'
})
</script>

<template>
  <!-- role="status" is a polite live region: the CONNECTION state is announced,
       the numbers that change every 250 ms are not. -->
  <p class="connection-status" :class="'is-' + status" role="status">
    <span class="dot" aria-hidden="true"></span>{{ label }}
  </p>
</template>

<style scoped>
.connection-status { display: inline-flex; align-items: center; gap: 8px; margin: 0; padding: 4px 10px; border-radius: 99px; background: #eef0f4; font-weight: 600; font-size: 0.9rem; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #868e96; }
.is-live .dot { background: #2b8a3e; }
.is-connecting .dot,
.is-reconnecting .dot { background: #e67700; }
.is-offline { background: #fff0f0; color: #c92a2a; }
.is-offline .dot { background: #c92a2a; }
@media (prefers-reduced-motion: no-preference) {
  .is-live .dot { animation: pulse 1.6s ease-in-out infinite; }
}
@keyframes pulse { 50% { opacity: 0.35; } }
</style>`

const metricCardVue = `<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  unit: { type: String, default: '' },
})
</script>

<template>
  <article class="metric">
    <h3 class="metric-label">{{ label }}</h3>
    <p class="metric-value">{{ value }}<span v-if="unit" class="metric-unit"> {{ unit }}</span></p>
  </article>
</template>

<style scoped>
.metric { padding: 14px 16px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.metric-label { margin: 0; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
.metric-value { margin: 4px 0 0; font-size: 1.8rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.metric-unit { font-size: 1rem; font-weight: 600; color: var(--muted); }
</style>`

const sparklineVue = `<script setup>
import { computed } from 'vue'

// A sparkline: a tiny line chart without axes, drawn as one SVG <polyline>.
const props = defineProps({
  values: { type: Array, required: true },
  label: { type: String, required: true },
  width: { type: Number, default: 300 },
  height: { type: Number, default: 60 },
})

const PAD = 4

const range = computed(() => {
  if (props.values.length === 0) return null
  return { min: Math.min(...props.values), max: Math.max(...props.values) }
})

// "x1,y1 x2,y2 …" — x spreads the points evenly; y maps min..max to bottom..top.
const points = computed(() => {
  if (props.values.length < 2) return ''
  const { min, max } = range.value
  const span = max - min || 1 // a flat line must not divide by zero
  const step = (props.width - PAD * 2) / (props.values.length - 1)
  return props.values
    .map((value, i) => {
      const x = PAD + i * step
      const y = props.height - PAD - ((value - min) / span) * (props.height - PAD * 2)
      return x.toFixed(1) + ',' + y.toFixed(1)
    })
    .join(' ')
})

const summary = computed(() => {
  if (!range.value) return props.label + ': no data yet'
  const last = props.values[props.values.length - 1]
  return props.label + ': latest ' + last + ', between ' + range.value.min + ' and ' + range.value.max + ' over the last ' + props.values.length + ' updates'
})
</script>

<template>
  <figure class="sparkline-figure">
    <figcaption>{{ label }} <span class="muted">· last {{ values.length }} updates</span></figcaption>
    <svg class="sparkline" :viewBox="'0 0 ' + width + ' ' + height" preserveAspectRatio="none" role="img" :aria-label="summary">
      <polyline
        v-if="points"
        :points="points"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  </figure>
</template>

<style scoped>
.sparkline-figure { margin: 0; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; color: #3b5bdb; }
figcaption { color: var(--ink); font-weight: 700; margin-bottom: 6px; }
.muted { color: var(--muted); font-weight: 400; }
.sparkline { display: block; width: 100%; height: 60px; }
</style>`

const orderFeedVue = `<script setup>
defineProps({
  orders: { type: Array, required: true },
})

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
</script>

<template>
  <section class="feed" aria-labelledby="feed-title">
    <h3 id="feed-title">Latest orders</h3>
    <ol v-if="orders.length" class="order-feed">
      <li v-for="order in orders" :key="order.id" class="order">
        <span class="order-id">{{ order.id }}</span>
        <span class="order-restaurant">{{ order.restaurant }}</span>
        <span class="order-total">{{ money.format(order.totalCents / 100) }}</span>
      </li>
    </ol>
    <p v-else class="muted">No orders yet.</p>
  </section>
</template>

<style scoped>
.feed { padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; }
.feed h3 { margin: 0 0 8px; font-size: 1rem; }
.order-feed { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.order { display: grid; grid-template-columns: 70px 1fr auto; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--line); font-variant-numeric: tabular-nums; }
.order:last-child { border-bottom: 0; }
.order-id { color: var(--muted); }
.muted { color: var(--muted); margin: 0; }
</style>`

const dashboardStyles = `<style scoped>
.live-header { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 14px; }
.live-header h2 { margin: 0 auto 0 0; font-size: 1.3rem; }
.live-header button { padding: 6px 12px; border: 1px solid var(--ink); border-radius: 8px; background: #fff; cursor: pointer; }
.live-header button:disabled { opacity: 0.4; cursor: not-allowed; }
.missed { color: var(--muted); font-size: 0.9rem; }
.metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 12px; }
.panels { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 640px) { .panels { grid-template-columns: 1fr; } }
.skeleton { display: grid; gap: 12px; }
.skeleton-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.skeleton-block { height: 76px; border-radius: 12px; background: linear-gradient(90deg, #eceef2, #f6f7f9, #eceef2); background-size: 200% 100%; }
.skeleton-block.tall { height: 120px; }
@media (prefers-reduced-motion: no-preference) {
  .skeleton-block { animation: shimmer 1.2s linear infinite; }
}
@keyframes shimmer { to { background-position: -200% 0; } }
.simulator { margin-top: 16px; color: var(--muted); font-size: 0.9rem; }
.simulator button { margin-top: 8px; padding: 4px 10px; border: 1px solid var(--line); border-radius: 6px; background: #fff; cursor: pointer; }
</style>`

const starterDashboardVue = `<script setup>
import { useLiveFeed } from '../useLiveFeed.js'
import { FakeSocket } from '../socket.js'
import ConnectionBadge from './ConnectionBadge.vue'
import MetricCard from './MetricCard.vue'
import Sparkline from './Sparkline.vue'
import OrderFeed from './OrderFeed.vue'

const MAX_ATTEMPTS = 3
const { status, attempt, latest, history, orders, paused, missed, pause, resume, retryNow } = useLiveFeed(
  'wss://ops.example.test/live',
  { historySize: 30, maxAttempts: MAX_ATTEMPTS },
)

// TODO (step 6): a Pause / Resume button (.pause-toggle) and a .missed counter
// TODO (step 5): a .retry-now button when offline
// TODO (step 7): a skeleton (.skeleton) until the first message arrives
</script>

<template>
  <section class="live" aria-labelledby="live-title">
    <header class="live-header">
      <h2 id="live-title">Live orders</h2>
      <ConnectionBadge :status="status" :attempt="attempt" :max-attempts="MAX_ATTEMPTS" />
    </header>

    <template v-if="latest">
      <div class="metrics">
        <MetricCard class="metric-orders" label="Orders / min" :value="latest.ordersPerMinute" />
        <MetricCard class="metric-couriers" label="Active couriers" :value="latest.activeCouriers" />
        <MetricCard class="metric-delivery" label="Avg. delivery" :value="latest.avgDeliveryMin" unit="min" />
      </div>
      <div class="panels">
        <Sparkline :values="history" label="Orders per minute" />
        <OrderFeed :orders="orders" />
      </div>
    </template>

    <details class="simulator">
      <summary>Simulation controls</summary>
      <button type="button" class="simulate-outage" @click="FakeSocket.simulateOutage(800)">Simulate a network drop</button>
    </details>
  </section>
</template>

${dashboardStyles}`

const dashboardVue = `<script setup>
import { useLiveFeed } from '../useLiveFeed.js'
import { FakeSocket } from '../socket.js'
import ConnectionBadge from './ConnectionBadge.vue'
import MetricCard from './MetricCard.vue'
import Sparkline from './Sparkline.vue'
import OrderFeed from './OrderFeed.vue'

const MAX_ATTEMPTS = 3
const { status, attempt, latest, history, orders, paused, missed, pause, resume, retryNow } = useLiveFeed(
  'wss://ops.example.test/live',
  { historySize: 30, maxAttempts: MAX_ATTEMPTS },
)

function togglePause() {
  if (paused.value) resume()
  else pause()
}
</script>

<template>
  <section class="live" aria-labelledby="live-title">
    <header class="live-header">
      <h2 id="live-title">Live orders</h2>
      <ConnectionBadge :status="status" :attempt="attempt" :max-attempts="MAX_ATTEMPTS" />
      <button v-if="status === 'offline'" type="button" class="retry-now" @click="retryNow">Retry now</button>
      <button
        type="button"
        class="pause-toggle"
        :aria-pressed="paused ? 'true' : 'false'"
        :disabled="!latest"
        @click="togglePause"
      >
        {{ paused ? 'Resume' : 'Pause updates' }}
      </button>
      <span v-if="paused" class="missed">{{ missed }} updates waiting</span>
    </header>

    <!-- Same shape as the real content, so nothing jumps when data arrives -->
    <div v-if="!latest" class="skeleton" aria-hidden="true">
      <div class="skeleton-row">
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
      </div>
      <div class="skeleton-block tall"></div>
    </div>

    <template v-else>
      <div class="metrics">
        <MetricCard class="metric-orders" label="Orders / min" :value="latest.ordersPerMinute" />
        <MetricCard class="metric-couriers" label="Active couriers" :value="latest.activeCouriers" />
        <MetricCard class="metric-delivery" label="Avg. delivery" :value="latest.avgDeliveryMin" unit="min" />
      </div>
      <div class="panels">
        <Sparkline :values="history" label="Orders per minute" />
        <OrderFeed :orders="orders" />
      </div>
    </template>

    <details class="simulator">
      <summary>Simulation controls</summary>
      <button type="button" class="simulate-outage" @click="FakeSocket.simulateOutage(800)">Simulate a network drop</button>
    </details>
  </section>
</template>

${dashboardStyles}`

const helpVue = `<template>
  <section class="help">
    <h2>How the live board works</h2>
    <p>
      The board keeps one WebSocket-style connection open while it is on screen. The server pushes a
      metrics update every 250 ms and a new order every other update.
    </p>
    <p>
      Switching to this tab unmounted the board, which closed its connection and stopped its timers.
      Nothing keeps running in the background.
    </p>
  </section>
</template>

<style scoped>
.help { max-width: 560px; line-height: 1.5; }
</style>`

const appVue = `<script setup>
import { ref } from 'vue'
import LiveDashboard from './components/LiveDashboard.vue'
import HelpPanel from './components/HelpPanel.vue'

const tab = ref('live')
</script>

<template>
  <div class="ops">
    <header class="ops-header">
      <h1>Dispatch</h1>
      <nav class="tabs" aria-label="Sections">
        <button type="button" class="tab-live" :aria-pressed="tab === 'live' ? 'true' : 'false'" @click="tab = 'live'">Live board</button>
        <button type="button" class="tab-help" :aria-pressed="tab === 'help' ? 'true' : 'false'" @click="tab = 'help'">How it works</button>
      </nav>
    </header>
    <!-- v-if: leaving the tab UNMOUNTS the board — the real test of cleanup -->
    <LiveDashboard v-if="tab === 'live'" />
    <HelpPanel v-else />
  </div>
</template>

<style>
.ops {
  --ink: #1d1d1f;
  --muted: #5f5f6b;
  --line: #e2e2e9;
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
  color: var(--ink);
}
.ops button { font: inherit; }
.ops :focus-visible { outline: 3px solid #3b5bdb; outline-offset: 2px; }
.ops-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.ops-header h1 { margin: 0; font-size: 1.5rem; }
.tabs { display: flex; gap: 6px; }
.tabs button { padding: 6px 12px; border: 1px solid var(--line); border-radius: 99px; background: #fff; cursor: pointer; }
.tabs button[aria-pressed='true'] { background: var(--ink); border-color: var(--ink); color: #fff; }
</style>`

const sharedFiles = {
  'App.vue': appVue,
  'socket.js': socketJs,
  'components/ConnectionBadge.vue': badgeVue,
  'components/MetricCard.vue': metricCardVue,
  'components/Sparkline.vue': sparklineVue,
  'components/OrderFeed.vue': orderFeedVue,
  'components/HelpPanel.vue': helpVue,
}

// ---------------------------------------------------------------- interview coding question

const intervalStarter = `import { ref } from 'vue'

// Calls callback every ms milliseconds while active.
// Returns { isActive, pause, resume }. Must stop when its scope is disposed.
export function useInterval(callback, ms) {
  const isActive = ref(true)
  setInterval(callback, ms)

  function pause() {}
  function resume() {}

  return { isActive, pause, resume }
}
`

const intervalSolution = `import { ref, onScopeDispose } from 'vue'

// Calls callback every ms milliseconds while active.
// Returns { isActive, pause, resume }. Must stop when its scope is disposed.
export function useInterval(callback, ms) {
  const isActive = ref(false)
  let timer = null

  function resume() {
    if (timer !== null) return // never start two intervals
    timer = setInterval(callback, ms)
    isActive.value = true
  }

  function pause() {
    clearInterval(timer)
    timer = null
    isActive.value = false
  }

  resume()
  onScopeDispose(pause) // component unmount or effectScope.stop()

  return { isActive, pause, resume }
}
`

const intervalApp = `<script setup>
import { ref } from 'vue'
import { useInterval } from './useInterval.js'

const seconds = ref(0)
const { isActive, pause, resume } = useInterval(() => seconds.value++, 1000)
</script>

<template>
  <p>{{ seconds }} s</p>
  <button @click="isActive ? pause() : resume()">{{ isActive ? 'Pause' : 'Resume' }}</button>
</template>`

const scopeSetup = `const { effectScope } = requireModule('vue')
const { useInterval } = requireModule('useInterval.js')
let calls = 0
const scope = effectScope()
const timer = scope.run(() => useInterval(() => calls++, 40))`

export default {
  id: 'project-realtime-dashboard',
  kind: 'project',
  title: 'Project 8: Real-Time Dashboard',
  summary: 'Build a live operations board fed by a simulated WebSocket — with connection states, a loading skeleton, a sparkline, reconnect with backoff, pause/resume and leak-free cleanup.',
  difficulty: 'advanced',
  minutes: 140,
  prerequisites: ['realtime-websockets', 'composables-intro', 'lifecycle-hooks', 'effect-scope', 'shallow-and-raw'],
  related: ['async-ui-states', 'resilient-requests', 'composable-design', 'runtime-performance', 'project-api-explorer', 'project-production-app'],
  tags: ['project', 'websocket', 'real-time', 'live updates', 'reconnect', 'backoff', 'cleanup', 'onScopeDispose', 'shallowRef', 'sparkline', 'composable'],
  apis: [
    { name: 'WebSocket (browser API)', summary: 'A two-way connection: readyState, send(), close(), and open/message/error/close events. Simulated here by FakeSocket.' },
    { name: 'onScopeDispose()', summary: 'Registers cleanup for the current effect scope — runs on component unmount or effectScope.stop().' },
    { name: 'effectScope()', summary: 'Groups reactive effects so they can be stopped together; also lets you run composables outside components.' },
    { name: 'shallowRef()', summary: 'Tracks only .value replacement — ideal for data you replace wholesale on every message.' },
  ],
  docs: [
    { label: 'Vue Guide — Composables (side effects & cleanup)', url: 'https://vuejs.org/guide/reusability/composables.html#side-effects' },
    { label: 'Vue API — effectScope() and onScopeDispose()', url: 'https://vuejs.org/api/reactivity-advanced.html#effectscope' },
    { label: 'Vue API — shallowRef()', url: 'https://vuejs.org/api/reactivity-advanced.html#shallowref' },
    { label: 'Vue Guide — Lifecycle Hooks', url: 'https://vuejs.org/guide/essentials/lifecycle.html' },
    { label: 'MDN — The WebSocket API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API' },
  ],

  intro: `
*Dispatch* is the live board a food-delivery team watches all day: **orders per minute**, **active couriers**, **average delivery time**, a **trend line**, and a feed of the **latest orders** — all updating several times a second without anyone pressing refresh.

The data arrives over a WebSocket-style connection. There is no network in the sandbox, so \`socket.js\` provides \`FakeSocket\`: it mimics the browser's \`WebSocket\` (ready states, \`send()\`, \`close()\`, events, JSON messages) with a little fake server behind it that pushes updates and can be made to drop the connection.

You will wrap the connection in a **composable** that handles everything a real live UI must:

- connection status (**connecting → live → reconnecting → offline**) and a skeleton until the first message,
- live updates with a **bounded history** for the sparkline,
- **reconnecting with backoff** when the network drops,
- **pause/resume** so people can actually read the numbers,
- and **cleanup**: when the board leaves the screen, the connection closes and no timer keeps running.
`,

  why: `
Request/response apps ask the server "anything new?". Live apps let the server **push** — which changes the problems you face:

- **Connections end.** Wi-Fi drops, laptops sleep, servers restart during deploys. A live UI that silently stops updating is worse than a static one, because people trust it.
- **Data never stops.** Keep every update and memory grows forever; re-render everything on each message and the page stutters.
- **Lifecycles matter.** Open a socket in a component, forget to close it on unmount, and every visit to the page adds another connection and another set of timers — the classic "it gets slower the longer I use it" bug.
- **Constant change is hostile to people.** Numbers that jump four times a second are hard to read, and a screen reader announcing each one is unusable.

This project solves each of these deliberately — the same patterns apply to chat, notifications, collaborative editing, stock tickers and multiplayer games.
`,

  eli15: `
Imagine listening to a live football match on the radio. You don't phone the stadium every minute to ask the score — the commentator **tells you** the moment something happens. That's a WebSocket: a line that stays open so the server can talk whenever it wants.

Now picture what can go wrong. The signal drops in a tunnel: a good radio says "searching…" and keeps trying, waiting a little longer each time instead of hammering the button (that's *reconnecting with backoff*). If it really can't find the station, it says "no signal" and offers a retry button (*offline*).

When you get out of the car, you **switch the radio off** — otherwise it keeps draining the battery in an empty car. In Vue, that's *cleanup*: when the dashboard leaves the screen, close the connection and stop every timer.

And if you want to read the league table without it changing under your nose, you hit **pause**; when you unpause, it catches up.
`,

  analogy: {
    title: 'The live radio commentary',
    body: `
A radio stays tuned to one station and the commentator pushes updates as they happen. When the signal drops, the radio retries patiently; when you leave, you switch it off. You only remember the last few minutes of commentary — not every word since kick-off.
`,
    mapping: [
      ['staying tuned to the station', 'an open WebSocket connection'],
      ['the commentator speaking whenever something happens', "the server pushing 'message' events"],
      ['"searching…" with longer waits each time', 'reconnect with exponential backoff'],
      ['"no signal — retry?"', 'the offline state with a Retry button'],
      ['switching the radio off when you leave the car', '`onScopeDispose(stop)`: close the socket, clear timers'],
      ['remembering only the last few minutes', 'a bounded history: `.slice(-historySize)`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'One connection, owned by one composable',
    caption: 'The composable owns the socket and its timers. Messages become state; state becomes UI; disposal closes everything.',
    alt: 'Diagram: LiveDashboard calls useLiveFeed, which creates a FakeSocket. The socket opens, the client sends a subscribe message, and the fake server pushes metrics and order messages as JSON strings. useLiveFeed parses them into status, latest, a bounded history and an orders list held in shallowRefs, which the dashboard renders as the connection badge, metric cards, a sparkline and the order feed. When the socket closes unexpectedly, useLiveFeed schedules a reconnect with exponential backoff and eventually goes offline. When the dashboard unmounts, onScopeDispose stops everything and closes the socket.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'dashboard', label: 'LiveDashboard', note: 'renders state · pause · retry', tone: 'paper' },
        { id: 'composable', label: 'useLiveFeed()', note: 'status · latest · history · orders', tone: 'acid' },
        { id: 'socket', label: 'FakeSocket', note: 'CONNECTING → OPEN → CLOSED', tone: 'cobalt' },
        { id: 'server', label: 'Fake server', note: 'pushes JSON every 250 ms', tone: 'ink' },
        { id: 'reconnect', label: 'Reconnect', note: '100 → 200 → 400 ms, then offline', tone: 'kraft' },
        { id: 'cleanup', label: 'onScopeDispose', note: 'close() · clearTimeout', tone: 'red' },
      ],
      edges: [
        { from: 'dashboard', to: 'composable', label: 'useLiveFeed(url)' },
        { from: 'composable', to: 'socket', label: 'new · send(subscribe)' },
        { from: 'server', to: 'socket', label: 'message events' },
        { from: 'socket', to: 'reconnect', label: 'unexpected close', dashed: true },
        { from: 'reconnect', to: 'socket', id: 'retry', label: 'connect again', dashed: true },
        { from: 'cleanup', to: 'socket', label: 'close(1000)' },
      ],
      steps: [
        { focus: ['dashboard', 'composable', 'socket'], edges: ['dashboard->composable', 'composable->socket'], text: 'The dashboard calls `useLiveFeed(url)`. The composable creates the socket, and on `open` sends `{ type: "subscribe" }` — `send()` before `open` would throw.' },
        { focus: ['server', 'socket', 'composable'], edges: ['server->socket'], text: 'The server pushes JSON strings. The composable parses them and *replaces* `latest`, `history` (last N points) and `orders` — shallowRefs, because each message replaces data wholesale.' },
        { focus: ['socket', 'reconnect'], edges: ['socket->reconnect', 'retry'], text: 'An unexpected close (code 1006, 1001…) schedules a reconnect: 100 ms, then 200, then 400. Too many failures → `offline` with a Retry button.' },
        { focus: ['cleanup', 'socket', 'dashboard'], edges: ['cleanup->socket'], text: 'When the dashboard unmounts (or any effect scope stops), `onScopeDispose` runs `stop()`: no reconnect, `close(1000)`, timers cleared. Nothing leaks.' },
      ],
    },
  },

  requirements: [
    'While connecting, `.connection-status` (`role="status"`) says **Connecting…** and a `.skeleton` placeholder is shown; after the first message it says **Live** and shows `.metric-orders`, `.metric-couriers`, `.metric-delivery` (each with a `.metric-value`), a `.sparkline` (`<polyline>`) and an `.order-feed`.',
    'The sparkline history is **bounded** to the last `historySize` values (30 on the board); the order feed keeps the newest 6.',
    'All connection logic lives in `useLiveFeed(url, options)` (`useLiveFeed.js`), which returns `status`, `attempt`, `latest`, `history`, `orders`, `paused`, `missed`, `pause`, `resume`, `retryNow`, `stop`.',
    'When the connection drops unexpectedly, status becomes **Reconnecting…** and the composable retries with exponential backoff (100, 200, 400 ms — `baseDelayMs`, `maxDelayMs`); a successful reconnect returns to **Live** and resets the attempt count.',
    'After `maxAttempts` (3) failed attempts in a row, status becomes **Offline** and a `.retry-now` button reconnects.',
    '`.pause-toggle` (with `aria-pressed`) freezes the view; `.missed` shows how many updates are waiting; resuming applies them.',
    '**Cleanup:** when the board unmounts (`.tab-help`) or the composable\'s effect scope stops, the socket is closed, no reconnect happens and the server stops sending (`FakeSocket.openCount()` drops, `FakeSocket.stats.ticks` stops growing).',
    'Only the connection status is announced to assistive technology — not every changing number.',
  ],

  objectives: [
    'Use the WebSocket API shape (ready states, events, `send`, `close`, JSON messages) and map it to a fake for testing.',
    'Encapsulate a long-lived connection in a composable with explicit status, and clean it up with `onScopeDispose`.',
    'Handle high-frequency updates with `shallowRef`, immutable replacement and bounded buffers.',
    'Implement reconnect with exponential backoff and an offline state — and explain what production adds (jitter, heartbeats, resync).',
    'Design live UIs for people: skeletons, pause/resume, and polite status announcements instead of noisy live regions.',
  ],

  playground: {
    title: 'Dispatch live board — starter',
    objective: 'The fake socket and display components are ready, and the starter composable shows data. Add cleanup, bounded history, reconnect with backoff, pause/resume and the skeleton.',
    files: {
      ...sharedFiles,
      'useLiveFeed.js': starterComposableJs,
      'components/LiveDashboard.vue': starterDashboardVue,
    },
    expected: 'The starter goes live and shows numbers, but its history grows forever, a network drop leaves it stuck, there is no pause, and switching to the "How it works" tab leaves the connection running in the background.',
    tests: [
      {
        name: 'shows Connecting and a skeleton, then goes Live with data',
        code: `expect(text('.connection-status')).toContain('Connecting')
expect(attr('.connection-status', 'role')).toBe('status')
expect(exists('.skeleton')).toBe(true)
await wait(450)
expect(text('.connection-status')).toBe('Live')
expect(exists('.skeleton')).toBe(false)
expect(text('.metric-orders .metric-value')).toMatch(/^\\d+$/)
expect(find('.metrics').getAttribute('aria-live')).toBeNull()`,
      },
      {
        name: 'updates keep arriving: the sparkline grows and orders appear',
        code: `await wait(700)
const before = attr('.sparkline polyline', 'points').split(' ').length
await wait(520)
const after = attr('.sparkline polyline', 'points').split(' ').length
expect(after).toBeGreaterThan(before)
expect(findAll('.order').length).toBeGreaterThan(0)`,
      },
      {
        name: 'history is bounded (any effect scope can own the feed)',
        code: `const { effectScope } = requireModule('vue')
const { useLiveFeed } = requireModule('useLiveFeed.js')
const scope = effectScope()
const feed = scope.run(() => useLiveFeed('wss://test.example/live', { historySize: 3 }))
await wait(1250)
expect(feed.history.value).toHaveLength(3)
scope.stop()`,
      },
      {
        name: 'stopping the scope closes the socket and stops reconnecting',
        code: `const { effectScope } = requireModule('vue')
const { useLiveFeed } = requireModule('useLiveFeed.js')
const { FakeSocket } = requireModule('socket.js')
const scope = effectScope()
scope.run(() => useLiveFeed('wss://test.example/live'))
const socket = FakeSocket.instances[FakeSocket.instances.length - 1]
await wait(200)
expect(socket.readyState).toBe(FakeSocket.OPEN)
scope.stop()
await wait(300)
expect(socket.readyState).toBe(FakeSocket.CLOSED)
expect(FakeSocket.instances[FakeSocket.instances.length - 1]).toBe(socket)`,
      },
      {
        name: 'leaving the board closes the connection; the server stops sending',
        code: `const { FakeSocket } = requireModule('socket.js')
await wait(450)
expect(FakeSocket.openCount()).toBe(1)
await click('.tab-help')
await wait(20)
expect(FakeSocket.openCount()).toBe(0)
const ticks = FakeSocket.stats.ticks
await wait(400)
expect(FakeSocket.stats.ticks).toBe(ticks)`,
      },
      {
        name: 'a dropped connection reconnects with backoff and goes Live again',
        code: `const { FakeSocket } = requireModule('socket.js')
await wait(450)
FakeSocket.simulateOutage(300)
await flush()
expect(text('.connection-status')).toContain('Reconnecting')
await wait(750)
expect(text('.connection-status')).toBe('Live')
expect(FakeSocket.openCount()).toBe(1)`,
      },
      {
        name: 'after 3 failed attempts it goes Offline; Retry reconnects',
        code: `const { FakeSocket } = requireModule('socket.js')
FakeSocket.simulateOutage(5000)
await wait(1300)
expect(text('.connection-status')).toBe('Offline')
expect(exists('.retry-now')).toBe(true)
FakeSocket.endOutage()
await click('.retry-now')
await wait(250)
expect(text('.connection-status')).toBe('Live')`,
      },
      {
        name: 'pause freezes the view; resume catches up',
        code: `await wait(700)
await click('.pause-toggle')
expect(attr('.pause-toggle', 'aria-pressed')).toBe('true')
const frozen = attr('.sparkline polyline', 'points')
await wait(550)
expect(attr('.sparkline polyline', 'points')).toBe(frozen)
expect(text('.missed')).toMatch(/^[1-9]\\d* updates waiting$/)
await click('.pause-toggle')
expect(attr('.sparkline polyline', 'points').split(' ').length).toBeGreaterThan(frozen.split(' ').length)
expect(exists('.missed')).toBe(false)`,
      },
      {
        name: 'FakeSocket behaves like the WebSocket API',
        code: `const { FakeSocket } = requireModule('socket.js')
const socket = new FakeSocket('wss://test.example/raw')
expect(socket.readyState).toBe(FakeSocket.CONNECTING)
expect(() => socket.send('{}')).toThrow()
const types = []
let closeCode = null
socket.onopen = () => socket.send(JSON.stringify({ type: 'subscribe' }))
socket.addEventListener('message', (event) => types.push(typeof event.data))
socket.onclose = (event) => { closeCode = event.code }
await wait(450)
expect(socket.readyState).toBe(FakeSocket.OPEN)
expect(types[0]).toBe('string')
socket.close(1000, 'done')
await wait(10)
expect(socket.readyState).toBe(FakeSocket.CLOSED)
expect(closeCode).toBe(1000)`,
      },
    ],
  },

  steps: [
    {
      title: 'Push instead of pull: the WebSocket API in two minutes',
      body: [
        `
With HTTP, the client asks and the server answers. A **WebSocket** is a long-lived, two-way connection: after an initial handshake, either side can send messages at any time ([real-time UIs](lesson:realtime-websockets)). The browser API is small:
`,
        {
          code: `const socket = new WebSocket('wss://ops.example.com/live') // wss:// = encrypted

socket.addEventListener('open', () => {
  // send() before 'open' throws an InvalidStateError
  socket.send(JSON.stringify({ type: 'subscribe', channel: 'orders' }))
})

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data) // text frames arrive as strings
})

socket.addEventListener('close', (event) => {
  // event.code: 1000 = normal, 1001 = going away, 1006 = abnormal (no close frame)
})

socket.readyState // 0 CONNECTING, 1 OPEN, 2 CLOSING, 3 CLOSED
socket.close(1000, 'bye')`,
          lang: 'js',
          title: 'the real browser API',
          static: true,
        },
        `
\`FakeSocket\` in \`socket.js\` copies exactly this surface — it even extends \`EventTarget\`, so both \`addEventListener\` and \`onmessage\` work — and behind it sits a fake server that starts pushing once you subscribe. It also offers demo helpers the real API doesn't have: \`FakeSocket.simulateOutage(ms)\`, \`FakeSocket.openCount()\` and \`FakeSocket.stats\`, which the tests use to check your cleanup.

To use a real server later, you would only replace \`new FakeSocket(url)\` with \`new WebSocket(url)\`.
`,
        {
          callout: 'note',
          title: 'Not the only option',
          text: 'For one-way server → client updates, Server-Sent Events (`EventSource`) are simpler and reconnect automatically. For data that changes every few minutes, polling is often enough. Choose WebSockets when you need frequent, low-latency, two-way messages.',
        },
      ],
    },
    {
      title: 'Own the connection in a composable — and clean up first',
      body: [
        `
A connection is a **side effect**: it lives outside Vue and keeps running until someone stops it. Put it in a composable that both *starts* and *stops* it ([composables](lesson:composables-intro)):
`,
        {
          code: `import { ref, shallowRef, onScopeDispose } from 'vue'
import { FakeSocket } from './socket.js'

export function useLiveFeed(url, options = {}) {
  const status = ref('connecting')
  let socket = null
  let retryTimer = null
  let stopped = false

  function stop() {
    stopped = true
    clearTimeout(retryTimer)
    if (socket) socket.close(1000, 'Client left')
    socket = null
  }

  connect()
  onScopeDispose(stop)
  // …
}`,
          lang: 'js',
          title: 'useLiveFeed.js',
        },
        `
Why write cleanup *before* features? Because the starter shows the bug: open the board, switch to **How it works**, and the connection keeps running — the server keeps pushing into a component nobody can see. Visit the tab five times and you have five connections. In real apps this shows up as duplicate updates, rising memory and "the page gets slower over time".

**\`onScopeDispose\` vs \`onUnmounted\`.** Inside a component, both run on unmount. But \`onScopeDispose\` belongs to the current *effect scope*, so the composable also cleans up when used inside \`effectScope()\` — in a store, a test, or a long-lived service ([effect scopes](lesson:effect-scope)). \`onUnmounted\` only works inside components.

Notice \`socket\` is a plain variable, not a ref. Nothing in the template needs to track it, so there is no reason to let Vue wrap a live object with its own internal state in a reactive proxy. If you *did* need it reactive (say, to show \`readyState\`), \`shallowRef\` or \`markRaw\` would keep Vue from proxying its internals ([shallowRef & markRaw](lesson:shallow-and-raw)).
`,
      ],
    },
    {
      title: 'Turn messages into state: shallowRef and bounded history',
      body: [
        `
Messages are JSON strings with a \`type\`. Parse once, dispatch on the type, and **replace** state instead of mutating it:
`,
        {
          code: `const latest = shallowRef(null)
const history = shallowRef([])
const orders = shallowRef([])

function apply(message) {
  if (message.type === 'metrics') {
    latest.value = message
    history.value = [...history.value, message.ordersPerMinute].slice(-historySize)
  } else if (message.type === 'order') {
    orders.value = [message, ...orders.value].slice(0, feedSize)
  }
}`,
          lang: 'js',
          title: 'useLiveFeed.js',
        },
        `
- **\`shallowRef\`** only tracks assignments to \`.value\`. Every message replaces the whole object or array, so deep reactivity would be wasted work — Vue would wrap every nested property of data it is about to throw away.
- **\`.slice(-historySize)\`** keeps only the newest N points. Without it, a board left open all day keeps every update in memory and the sparkline gets denser and slower forever.
- **New arrays, not \`push()\`**: with a shallowRef, \`history.value.push(x)\` would change the array without telling Vue. Replacing is what triggers the update.

\`Sparkline.vue\` (provided) turns the history into one \`<polyline>\`: x spreads points evenly across the width, y maps the min–max range onto the height (SVG's y axis points down, so higher values get *smaller* y). Its \`aria-label\` summarises the latest value and the range in words.
`,
      ],
    },
    {
      title: 'Connection states and reconnecting with backoff',
      body: [
        `
Model the connection explicitly — four states, each with a clear meaning for the user:

| status | meaning | UI |
|---|---|---|
| \`connecting\` | first handshake | "Connecting…" + skeleton |
| \`live\` | open and receiving | "Live" (pulsing dot) |
| \`reconnecting\` | dropped; retrying | "Reconnecting… (attempt 2 of 3)" |
| \`offline\` | gave up | "Offline" + Retry button |

When a close was not requested by us, schedule a reconnect. Waiting longer after each failure — **exponential backoff** — avoids hammering a server that is struggling (and, at scale, thousands of clients reconnecting at the same instant):
`,
        {
          code: `function connect() {
  status.value = attempt.value === 0 ? 'connecting' : 'reconnecting'
  socket = new FakeSocket(url)
  socket.onopen = () => {
    status.value = 'live'
    attempt.value = 0 // a successful connection resets the counter
    socket.send(JSON.stringify({ type: 'subscribe', channel: 'orders' }))
  }
  socket.onmessage = (event) => receive(JSON.parse(event.data))
  socket.onclose = () => {
    socket = null
    if (!stopped) scheduleReconnect() // closed by the network or server, not by us
  }
}

function scheduleReconnect() {
  attempt.value++
  if (attempt.value > maxAttempts) {
    status.value = 'offline'
    return
  }
  status.value = 'reconnecting'
  const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt.value - 1)) // 100, 200, 400…
  retryTimer = setTimeout(connect, delay)
}

function retryNow() {
  clearTimeout(retryTimer)
  attempt.value = 0
  connect()
}`,
          lang: 'js',
          title: 'useLiveFeed.js',
        },
        `
The \`stopped\` flag is what makes cleanup and reconnecting compatible: our own \`close()\` in \`stop()\` also fires \`close\`, and without the flag the composable would immediately reconnect after unmounting.

Try **Simulate a network drop** in the playground: you'll see two failed attempts and then a recovery.
`,
        {
          callout: 'warn',
          title: 'Simplified — what production adds',
          text: 'Random **jitter** on each delay (so clients don\'t retry in lockstep), more attempts with a higher cap, **heartbeats** (ping/pong) to detect connections that are dead but never closed, pausing retries while `navigator.onLine` is false, and a **resync** after reconnecting — the client missed messages while it was away, so it should fetch a fresh snapshot or resume from the last sequence number.',
        },
      ],
    },
    {
      title: 'Pause and resume',
      body: [
        `
Numbers that change four times a second are hard to read. A **pause** freezes the view while the connection keeps receiving; **resume** catches up:
`,
        {
          code: `let buffer = []

function receive(message) {
  if (paused.value) {
    missed.value++
    buffer.push(message)
    if (buffer.length > historySize + feedSize) buffer.shift() // keep it bounded
    return
  }
  apply(message)
}

function pause() {
  paused.value = true
}

function resume() {
  paused.value = false
  buffer.forEach(apply)
  buffer = []
  missed.value = 0
}`,
          lang: 'js',
          title: 'useLiveFeed.js',
        },
        `
The buffer is bounded too — only the newest messages can still affect what is shown, so there is no point keeping an hour of them. In the dashboard, a toggle button with \`aria-pressed\` and a "12 updates waiting" counter make the state obvious.
`,
      ],
    },
    {
      title: 'Design the screen for people: skeleton and polite announcements',
      body: [
        `
Before the first message there is nothing to show. A **skeleton** — grey blocks with the same shape as the real cards — tells people something is coming and prevents the layout from jumping when data arrives ([async UI states](lesson:async-ui-states)):
`,
        {
          code: `<div v-if="!latest" class="skeleton" aria-hidden="true">
  <div class="skeleton-row">
    <div class="skeleton-block"></div>
    <div class="skeleton-block"></div>
    <div class="skeleton-block"></div>
  </div>
  <div class="skeleton-block tall"></div>
</div>
<template v-else>
  <!-- metric cards, sparkline, order feed -->
</template>`,
          lang: 'vue',
          title: 'components/LiveDashboard.vue',
        },
        `
Accessibility choices for live data ([accessibility fundamentals](lesson:accessibility-fundamentals)):

- **Announce state, not data.** \`ConnectionBadge\` uses \`role="status"\` (a polite live region), so "Reconnecting…" or "Offline" is read out. The metric cards are deliberately *not* live regions — announcing a number four times a second would drown everything else.
- **The skeleton is \`aria-hidden\`** — it's decoration; the status already says "Connecting…".
- **Respect reduced motion.** The pulsing dot and the shimmer only animate inside \`@media (prefers-reduced-motion: no-preference)\`.
- **Pause is a real button** with \`aria-pressed\`, giving everyone control over moving content.
`,
      ],
    },
    {
      title: 'Prove there are no leaks',
      body: [
        `
Cleanup is easy to get wrong silently, so test it. The playground tests do three things you can also do in a real Vitest suite:

1. Run the composable in an **effect scope** — no component needed — and stop it:
`,
        {
          code: `import { effectScope } from 'vue'

const scope = effectScope()
const feed = scope.run(() => useLiveFeed('wss://test.example/live', { historySize: 3 }))
// …wait for some messages…
expect(feed.history.value).toHaveLength(3)
scope.stop() // runs onScopeDispose → stop() → socket.close()`,
          lang: 'js',
          title: 'testing a composable with effectScope',
          static: true,
        },
        `
2. Unmount the real component (switch tabs) and check \`FakeSocket.openCount()\` drops to zero.
3. Check that **nothing keeps happening** afterwards: the server's tick counter must stop growing.

With a real WebSocket you would use a mock server or a fake like this one in tests, and check the browser's devtools (Network → WS) for lingering connections during development ([testing composables](lesson:testing-logic)).
`,
      ],
    },
  ],

  solution: {
    files: {
      ...sharedFiles,
      'useLiveFeed.js': composableJs,
      'components/LiveDashboard.vue': dashboardVue,
    },
    explanation: `
**One owner for one connection.** \`useLiveFeed\` creates the socket, subscribes on \`open\`, turns messages into state, reconnects, pauses and — through \`onScopeDispose\` — stops everything when its owner goes away. Components only render.

**State that suits a stream.** \`latest\`, \`history\` and \`orders\` are \`shallowRef\`s replaced on every message; history and the pause buffer are bounded, so memory stays flat no matter how long the board is open.

**Honest connection status.** \`connecting → live → reconnecting → offline\`, with exponential backoff between attempts, a reset on success, a give-up point and a manual retry. The \`stopped\` flag keeps intentional closes from triggering reconnects.

**Built for people.** A skeleton until the first message, pause/resume for reading, only the connection status announced to screen readers, and animation only when the user hasn't asked for reduced motion.

**Simplified:** a production client adds jitter, heartbeats, offline detection, authentication of the connection, and a resync after reconnecting (missed messages are gone). The fake server is deterministic so the demo and tests behave identically every run.
`,
  },

  challenges: [
    'Add jitter to the backoff (`delay * (0.5 + Math.random())`) and a heartbeat: if no message arrives for 3 ticks, treat the connection as dead and reconnect.',
    'Resync after reconnecting: track the last `seq` you applied and show "You missed N updates" (or fetch a snapshot from a fake `api.js`).',
    'Share one connection between several components with a module-level, reference-counted composable (close when the last user unsubscribes).',
    'Throttle rendering: apply incoming messages at most once per animation frame with `requestAnimationFrame`.',
    'Highlight values that changed by more than 10% with a short CSS transition (respecting reduced motion).',
    'Pause automatically while the tab is hidden (`document.visibilityState`) and resync on return — remember to remove the listener on dispose.',
  ],

  mistakes: [
    {
      title: 'Opening a connection without closing it',
      wrong: { lang: 'js', code: `onMounted(() => {\n  const socket = new WebSocket(url)\n  socket.onmessage = (e) => (latest.value = JSON.parse(e.data))\n})\n// every visit adds another open socket`, static: true },
      right: { lang: 'js', code: `let socket\nonMounted(() => { socket = new WebSocket(url) /* … */ })\nonUnmounted(() => socket?.close(1000))\n// or, in a composable: onScopeDispose(stop)`, static: true },
      explanation: 'The connection is outside Vue; Vue cannot close it for you. Every side effect you start needs a matching cleanup, or it keeps running after the component is gone.',
    },
    {
      title: 'Reconnecting after your own close()',
      wrong: { lang: 'js', code: `socket.onclose = () => scheduleReconnect()\nonScopeDispose(() => socket.close()) // …which reconnects right after unmount` },
      right: { lang: 'js', code: `socket.onclose = () => {\n  if (!stopped) scheduleReconnect()\n}\nfunction stop() {\n  stopped = true\n  clearTimeout(retryTimer)\n  socket?.close(1000)\n}` },
      explanation: 'A close you requested fires the same `close` event as a network drop. Track intent (a `stopped` flag) and clear any pending retry timer, or the "cleaned up" component quietly comes back to life.',
    },
    {
      title: 'Letting history grow forever',
      wrong: { lang: 'js', code: `history.value = [...history.value, value] // unbounded` },
      right: { lang: 'js', code: `history.value = [...history.value, value].slice(-historySize)` },
      explanation: 'Streams never end. Without a bound, memory use and render cost grow for as long as the page is open.',
    },
    {
      title: 'Mutating a shallowRef in place',
      wrong: { lang: 'js', code: `const history = shallowRef([])\nhistory.value.push(value) // the screen does not update` },
      right: { lang: 'js', code: `history.value = [...history.value, value].slice(-historySize)` },
      explanation: '`shallowRef` only reacts to `.value` being replaced. Either replace the array (shown) or call `triggerRef(history)` after mutating.',
    },
    {
      title: 'Announcing every update to screen readers',
      wrong: { lang: 'vue', code: `<div class="metrics" aria-live="polite"> <!-- four announcements a second --> </div>` },
      right: { lang: 'vue', code: `<p class="connection-status" role="status">{{ label }}</p>\n<div class="metrics"> <!-- not a live region --> </div>` },
      explanation: 'Live regions are for changes people need to hear about. Constant data changes make a screen reader unusable; announce the connection state instead and let people read the numbers on demand.',
    },
  ],

  debugging: [
    {
      symptom: 'Each visit to the page makes updates arrive faster (or duplicated).',
      cause: 'Old connections were never closed; every mounted copy still receives and applies messages.',
      fix: 'Close the socket and clear timers in `onScopeDispose` / `onUnmounted`; check `openCount()` or the devtools WS tab.',
    },
    {
      symptom: 'After leaving the page, the console shows reconnect attempts.',
      cause: 'The close triggered by cleanup is treated like a network drop, or a pending retry timer wasn\'t cleared.',
      fix: 'Set a `stopped` flag before closing and `clearTimeout(retryTimer)` in `stop()`.',
    },
    {
      symptom: 'The sparkline never updates even though messages arrive.',
      cause: 'The history `shallowRef` is mutated with `push()`.',
      fix: 'Assign a new array to `.value` (or `triggerRef`).',
    },
    {
      symptom: '`InvalidStateError: Still in CONNECTING state`.',
      cause: '`send()` was called right after `new WebSocket(...)`, before `open`.',
      fix: 'Send subscriptions in the `open` handler (and re-send them after every reconnect).',
    },
  ],

  quiz: [
    {
      id: 'project-realtime-dashboard-q1',
      type: 'mcq',
      prompt: 'Why does `useLiveFeed` register its cleanup with `onScopeDispose` rather than `onUnmounted`?',
      options: [
        { text: '`onUnmounted` does not exist in Vue 3', why: 'It exists; it just only works inside component setup.' },
        { text: 'It also runs when the composable is used inside an `effectScope()` — in stores, tests or services — not only in components' },
        { text: 'It runs earlier, before the component is removed from the DOM', why: 'Ordering is not the point; within a component both run on unmount.' },
        { text: 'It closes WebSockets automatically', why: 'Vue does not know about your socket; your callback closes it.' },
      ],
      answer: 1,
      explanation: '`onScopeDispose` is tied to the active effect scope. A component\'s setup runs inside its scope, so it behaves like `onUnmounted` there — and it keeps working when the composable runs in any other scope.',
    },
    {
      id: 'project-realtime-dashboard-q2',
      type: 'output',
      prompt: 'With `baseDelayMs = 100` and `maxDelayMs = 400`, which delays are used for attempts 1 to 5?',
      code: { lang: 'js', code: `const delays = [1, 2, 3, 4, 5].map((attempt) =>\n  Math.min(400, 100 * 2 ** (attempt - 1)),\n)\nconsole.log(delays.join(', '))` },
      options: ['100, 200, 300, 400, 500', '100, 200, 400, 400, 400', '100, 200, 400, 800, 1600', '200, 400, 800, 400, 400'],
      answer: 1,
      explanation: 'The delay doubles each attempt (100, 200, 400, 800, 1600) but `Math.min` caps it at 400.',
    },
    {
      id: 'project-realtime-dashboard-q3',
      type: 'bug',
      prompt: 'Visiting this page several times makes the clock tick faster and faster. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, onMounted } from 'vue'

const seconds = ref(0)

onMounted(() => {
  setInterval(() => seconds.value++, 1000)
})
</script>

<template>
  <p>Open for {{ seconds }} s</p>
</template>`,
      },
      answerLine: 7,
      explanation: 'The interval is never cleared. Each mount starts another one that keeps running after unmount. Keep the id and `clearInterval` it in `onUnmounted` (or `onScopeDispose`).',
    },
    {
      id: 'project-realtime-dashboard-q4',
      type: 'fill',
      prompt: 'Complete the code: only send once the socket is open, and close it when the scope is disposed.',
      code: { lang: 'js', code: `if (socket.readyState === WebSocket.___) {\n  socket.send(JSON.stringify({ type: 'subscribe' }))\n}\n\nonScopeDispose(() => socket.___(1000))` },
      answer: [['OPEN'], ['close']],
      explanation: '`WebSocket.OPEN` (1) is the only state in which `send()` delivers data; `close(1000)` is a normal closure.',
    },
    {
      id: 'project-realtime-dashboard-q5',
      type: 'short',
      prompt: 'Why is the connection status a live region (`role="status"`) but the metric cards are not?',
      answer: 'Live regions make screen readers announce changes. The connection state changes rarely and matters (offline means the numbers are stale), so it should be announced. The metrics change several times a second; announcing each one would be a constant stream of noise that blocks everything else. People can read the cards when they choose to.',
    },
  ],

  interview: [
    {
      id: 'project-realtime-dashboard-transport-choice',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'For this dashboard, compare polling, Server-Sent Events and WebSockets. Which would you pick and why?',
      answer: 'Polling: simplest (plain HTTP, caching, works everywhere) but adds latency and wasted requests; fine for data that changes every few minutes. SSE (`EventSource`): one-way server → client over HTTP, text-based, with built-in reconnection; a good fit when the client only listens. WebSockets: two-way, low-latency, binary or text, but you handle reconnects, heartbeats and scaling of long-lived connections yourself. This board mostly listens, so SSE would be a strong choice; I used a WebSocket shape because clients also send subscriptions and the team may add two-way features.',
      explanation: 'Match the transport to the direction and frequency of updates.',
      whyAsked: 'Shows whether you choose technology by requirements rather than habit.',
      mistakes: ['Saying WebSockets are always better.', 'Not knowing SSE exists.', 'Ignoring infrastructure (proxies, load balancers, connection limits).'],
      followUps: ['What changes on the server side with long-lived connections?', 'How does SSE reconnect?'],
      modelAnswer: 'If the data only changes every few minutes, I would poll — it is plain HTTP and easy to cache. For a stream the client only listens to, Server-Sent Events are attractive: one-way, simple, and the browser reconnects for you. WebSockets give low-latency two-way messaging but I own reconnection, heartbeats and resync, and the infrastructure has to handle many long-lived connections. Here the board mainly listens, so SSE would be a reasonable choice; I used a WebSocket because the client sends subscription messages and the product might grow two-way features. Either way I would put it behind a composable so the transport can change.',
    },
    {
      id: 'project-realtime-dashboard-leak',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Support says: "After switching between pages for a while, the live board shows each new order two or three times and the laptop fan spins up." What is likely wrong and how do you confirm and fix it?',
      answer: 'Connections (and timers) are not cleaned up on unmount, so each visit adds another socket whose handlers still update state — duplicates and extra CPU. Confirm with the devtools Network → WS tab (several open connections) or a counter like `openCount()`. Fix: close the socket and clear timers in `onScopeDispose`/`onUnmounted`, make sure intentional closes do not trigger reconnects, and add a test that unmounts the component and checks nothing is still running.',
      explanation: 'Every side effect needs a matching cleanup.',
      whyAsked: 'Resource leaks in SPAs are common and hard to spot; interviewers want a systematic approach.',
      mistakes: ['Blaming the server for duplicates.', 'Deduplicating orders in the UI as the "fix".', 'Forgetting the reconnect timer.'],
      followUps: ['How would you write an automated test for this?', 'What else commonly leaks? (listeners, observers, intervals)'],
      modelAnswer: 'Duplicates plus rising CPU after navigation smells like leaked connections: each mount opens a socket and unmount never closes it, so old handlers keep applying messages. I would confirm in the devtools WebSocket list or by counting open sockets. The fix is to own the connection in a composable that closes the socket and clears its timers in onScopeDispose, with a stopped flag so our own close does not trigger a reconnect. Then I would add a test that mounts, unmounts and asserts the socket is closed and no more messages are processed.',
    },
    {
      id: 'project-realtime-dashboard-resync',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A dispatcher\'s laptop sleeps for 20 minutes. When it wakes, your board reconnects and shows "Live". What is wrong with that, and how would you design a correct recovery?',
      answer: 'Messages sent while the client was away are lost, so "Live" shows a state built from stale data plus new deltas. Recovery: on reconnect, resync — either fetch a fresh snapshot over HTTP and then apply new messages, or send the last processed sequence number so the server can replay missed events (if it supports it). Detect gaps with sequence numbers, show a "catching up" state until resynced, and use heartbeats so a half-dead connection is noticed even without a close event.',
      explanation: 'Reconnected is not the same as up to date.',
      whyAsked: 'Distinguishes demo-level real-time code from production-ready thinking.',
      mistakes: ['Assuming reconnect means consistency.', 'Replaying everything from the beginning.', 'Not considering that the socket may look open but be dead.'],
      followUps: ['What is a heartbeat and why does it matter after sleep?', 'How would the server support replay?'],
      modelAnswer: 'Reconnecting restores the pipe, not the data — anything pushed during those 20 minutes never reached the client, so totals and the feed are wrong while the badge says Live. I would include a sequence number in every message and remember the last one applied. After reconnecting, the client either asks the server to replay from that number or fetches a fresh snapshot over HTTP and then continues with new messages, showing "catching up" until done. Gaps in sequence numbers trigger the same resync. Heartbeats help too, because after sleep a socket can look open but be dead.',
    },
    {
      id: 'project-realtime-dashboard-sharing',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Three different widgets on different pages need the same live feed. How would you avoid opening three connections?',
      answer: 'Share one connection at module level: a composable or store that reference-counts subscribers — the first subscriber opens the socket, the last one to dispose closes it (each consumer calls `onScopeDispose` to unsubscribe). Live data can live in a Pinia store (state + actions for incoming messages) or in a module-level `effectScope` created on first use. Multiplex channels over the one socket with subscribe/unsubscribe messages. Keep the transport behind an interface so tests can inject a fake.',
      explanation: 'One connection per app (or per backend), many consumers.',
      whyAsked: 'Tests understanding of shared resources, lifecycles and app architecture.',
      mistakes: ['Creating the socket at module import time (opens even when nobody needs it, and in tests).', 'Never closing a shared connection.', 'Ignoring re-subscription after reconnect.'],
      followUps: ['Where would you store the data — Pinia or the composable?', 'How do you re-subscribe channels after a reconnect?'],
      modelAnswer: 'I would make the connection a shared, reference-counted resource. A module-level manager keeps one socket and a subscriber count: useLiveFeed registers interest, the first subscriber opens the connection, and each consumer\'s onScopeDispose unsubscribes, so the last one closes it. Channels are multiplexed with subscribe and unsubscribe messages, and the manager re-sends active subscriptions after every reconnect. The incoming data can live in a Pinia store so any widget reads the same state. I avoid opening anything at import time and keep the transport injectable for tests.',
    },
    {
      id: 'project-realtime-dashboard-performance',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'The feed rate goes up to dozens of messages per second and the board starts to stutter. What would you look at, in order?',
      answer: 'Measure first (Vue Devtools performance, the browser profiler) to see whether time goes to parsing, reactivity or rendering. Then: keep data in `shallowRef`s and replace immutably; batch updates — collect messages and apply at most once per animation frame; bound every buffer and list; render fewer things (only visible rows, coarser sparkline); avoid deep watchers on stream data; and ask whether the server can send aggregated snapshots instead of every event.',
      explanation: 'Humans can\'t read 50 updates a second anyway — render at a human rate, process at the stream\'s rate.',
      whyAsked: 'Probes practical performance skills under real-time load.',
      mistakes: ['Guessing without profiling.', 'Inventing thresholds.', 'Making everything deeply reactive.'],
      followUps: ['How would requestAnimationFrame batching work here?', 'What does shallowRef save compared to ref?'],
      modelAnswer: 'I would profile before changing anything. Usually the win is to decouple receiving from rendering: buffer incoming messages and apply them at most once per animation frame, since nobody can read faster than that anyway. Stream data stays in shallowRefs that I replace rather than mutate, so Vue does not deep-proxy short-lived objects, and every list and buffer is bounded. I would avoid deep watchers on the stream and render less — fewer feed rows, a coarser sparkline. Finally I would ask the backend for aggregated updates, because sending fewer messages beats processing them faster.',
    },
    {
      id: 'project-realtime-dashboard-coding-interval',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `useInterval(callback, ms)` in `useInterval.js`. It starts immediately and returns `{ isActive, pause, resume }`. `pause()` stops it, `resume()` restarts it (never running two intervals at once), and it must stop automatically when its effect scope is disposed (component unmount or `effectScope().stop()`).',
      starter: { files: { 'App.vue': intervalApp, 'useInterval.js': intervalStarter } },
      tests: [
        {
          name: 'starts immediately and calls the callback repeatedly',
          code: `${scopeSetup}
await wait(150)
expect(timer.isActive.value).toBe(true)
expect(calls).toBeGreaterThanOrEqual(2)
scope.stop()`,
        },
        {
          name: 'pause stops it; resume restarts it without doubling',
          code: `${scopeSetup}
timer.pause()
const atPause = calls
await wait(120)
expect(calls).toBe(atPause)
expect(timer.isActive.value).toBe(false)
timer.resume()
timer.resume()
await wait(130)
expect(calls - atPause).toBeLessThanOrEqual(4)
expect(calls - atPause).toBeGreaterThanOrEqual(2)
scope.stop()`,
        },
        {
          name: 'stops when the effect scope is disposed',
          code: `${scopeSetup}
await wait(90)
scope.stop()
const atStop = calls
await wait(150)
expect(calls).toBe(atStop)`,
        },
      ],
      hints: [
        'Keep the interval id in a variable; `null` means "not running".',
        'In `resume()`, return early if an interval is already running; in `pause()`, `clearInterval` and reset the id.',
        'Call `resume()` once at the start and register `onScopeDispose(pause)`.',
      ],
      answer: 'Store the interval id; `resume` starts one only if none is running and sets `isActive`; `pause` clears it; start immediately and register `onScopeDispose(pause)`.',
      solution: { files: { 'App.vue': intervalApp, 'useInterval.js': intervalSolution } },
      explanation: 'The same pattern as the live feed in miniature: a side effect, an explicit on/off state, idempotent start, and cleanup tied to the effect scope so it works in components and outside them.',
      whyAsked: 'A compact test of side-effect hygiene in composables.',
      mistakes: ['Forgetting to clear on dispose.', 'Starting a second interval on repeated resume.', 'Using onUnmounted, which breaks outside components.'],
      followUps: ['How would you make `ms` reactive?', 'Would you start immediately or wait for an explicit start?'],
      modelAnswer: 'I keep the interval id in a closure. Resume does nothing if an id exists, otherwise starts setInterval and sets isActive to true; pause clears the interval, nulls the id and sets isActive to false. The composable starts by calling resume and registers onScopeDispose(pause), so it cleans up on unmount or when any effect scope stops. To accept a reactive delay I would watch it and restart the interval when it changes.',
    },
  ],

  takeaways: [
    'A live connection is a side effect: own it in one composable that starts it, exposes explicit status, and stops it in `onScopeDispose`.',
    'Model the connection as `connecting → live → reconnecting → offline`; reconnect with capped exponential backoff, and ignore closes you caused yourself.',
    'Stream data belongs in `shallowRef`s replaced on each message, with every history and buffer bounded.',
    'Reconnected is not up to date — production clients resync, use heartbeats and add jitter.',
    'Design for people: skeletons, pause/resume, reduced motion, and announce connection state rather than every changing number.',
  ],
}
