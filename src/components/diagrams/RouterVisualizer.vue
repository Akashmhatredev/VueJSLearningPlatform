<script setup>
// Router visualizer: a REAL Vue Router instance (memory history) — every step
// shown is recorded from the router's actual guards, matching and lazy loads.
import { computed, ref, shallowRef } from 'vue'
import { createMemoryHistory, createRouter, isNavigationFailure, NavigationFailureType } from 'vue-router'
import AnimationControls from './AnimationControls.vue'
import RichText from '../learning/RichText.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'

const props = defineProps({
  preset: { type: String, default: 'basics' },
})

const STAGES = [
  { id: 'url', label: 'URL change' },
  { id: 'match', label: 'Route matching' },
  { id: 'guards', label: 'Navigation guards' },
  { id: 'resolve', label: 'Resolve components' },
  { id: 'render', label: 'Render in RouterView' },
]

let events = []
const rec = (stage, text) => events.push({ stage, text })
const loggedIn = ref(false)
const C = (name, extra = {}) => ({ name, render: () => null, ...extra })
const lazy = (name, ms = 700) => () =>
  new Promise((resolve) => {
    rec('resolve', `Loading the JavaScript chunk for **${name}**… (lazy route, first visit only)`)
    setTimeout(() => {
      rec('resolve', `Chunk for **${name}** arrived. Vue Router caches it — the next visit is instant.`)
      resolve(C(name))
    }, ms)
  })

const PRESETS = {
  basics: {
    routes: [
      { path: '/', component: C('HomePage') },
      { path: '/about', component: C('AboutPage') },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: C('NotFound') },
    ],
    links: ['/', '/about', '/does-not-exist'],
  },
  dynamic: {
    routes: [
      { path: '/', component: C('HomePage') },
      { path: '/users/:id', component: C('UserProfile'), props: true },
      { path: '/posts/:slug?', component: C('PostList') },
      { path: '/search', component: C('SearchPage') },
    ],
    links: ['/users/42', '/users/7?tab=posts', '/posts', '/posts/hello-vue', '/search?q=vue&page=2'],
  },
  nested: {
    routes: [
      { path: '/', component: C('HomePage') },
      {
        path: '/settings',
        component: C('SettingsLayout'),
        children: [
          { path: '', component: C('SettingsOverview') },
          { path: 'profile', component: C('ProfileForm') },
          { path: 'billing', component: C('BillingPage') },
        ],
      },
    ],
    links: ['/', '/settings', '/settings/profile', '/settings/billing'],
  },
  guards: {
    routes: [
      { path: '/', component: C('HomePage') },
      { path: '/login', component: C('LoginPage') },
      {
        path: '/admin',
        component: C('AdminPage', {
          beforeRouteEnter() {
            rec('guards', '**beforeRouteEnter** (in-component guard on AdminPage) runs last and allows it.')
          },
        }),
        meta: { requiresAuth: true },
        beforeEnter: () => {
          rec('guards', '**beforeEnter** (per-route guard on /admin) runs and allows it.')
        },
      },
    ],
    links: ['/', '/admin', '/login'],
    install(router) {
      router.beforeEach((to) => {
        if (to.meta.requiresAuth && !loggedIn.value) {
          rec('guards', `**beforeEach** (global): ${to.path} needs auth and you're logged out → **redirect** to /login.`)
          return { path: '/login', query: { redirect: to.fullPath } }
        }
        rec('guards', `**beforeEach** (global): allowed${to.meta.requiresAuth ? ' — you are logged in' : ''}.`)
      })
    },
  },
  lazy: {
    routes: [
      { path: '/', component: C('HomePage') },
      { path: '/reports', component: lazy('ReportsPage') },
      { path: '/charts', component: lazy('ChartsPage', 900) },
    ],
    links: ['/', '/reports', '/charts'],
  },
}

const def = PRESETS[props.preset] ?? PRESETS.basics
const router = createRouter({ history: createMemoryHistory(), routes: def.routes })
def.install?.(router)
if (props.preset !== 'guards') router.beforeEach(() => rec('guards', '**beforeEach** (global guard): no rules here, so navigation continues.'))
router.beforeResolve(() => rec('guards', '**beforeResolve**: every guard passed and async components are loaded.'))

const path = ref('/')
const route = shallowRef(router.currentRoute.value)
const frames = shallowRef([])
const busy = ref(false)
const player = useStepPlayer(frames, { interval: 1600 })
const frame = player.frame

function tableFor(records, prefix = '') {
  return records.flatMap((r) => {
    const full = r.path.startsWith('/') ? r.path : `${prefix.replace(/\/$/, '')}/${r.path}`.replace(/\/$/, '') || '/'
    return [{ path: full, name: r.component?.name ?? '(lazy)', depth: prefix ? 1 : 0 }, ...(r.children ? tableFor(r.children, full).map((c) => ({ ...c, depth: 1 })) : [])]
  })
}
const table = tableFor(def.routes)

async function go(target) {
  if (busy.value) return
  busy.value = true
  events = []
  path.value = target
  rec('url', `\`router.push('${target}')\` — in a real app a <RouterLink> click does this. The address bar updates without a page reload.`)
  const resolved = router.resolve(target)
  const params = Object.keys(resolved.params).length ? ` · params ${JSON.stringify(resolved.params)}` : ''
  const query = Object.keys(resolved.query).length ? ` · query ${JSON.stringify(resolved.query)}` : ''
  rec(
    'match',
    resolved.matched.length
      ? `Matched **${resolved.matched.map((m) => m.path).join(' → ')}**${params}${query}.${resolved.matched.length > 1 ? ' Nested match: each level renders into its own <RouterView>.' : ''}`
      : 'No route matched.',
  )
  const failure = await router.push(target)
  if (isNavigationFailure(failure, NavigationFailureType.duplicated)) {
    rec('guards', 'Navigation failure: **duplicated** — you are already on this exact location, so nothing happens.')
  } else if (failure) {
    rec('guards', `Navigation was aborted (${failure.type}).`)
  } else {
    const cur = router.currentRoute.value
    if (cur.fullPath !== router.resolve(target).fullPath) rec('url', `The guard **redirected** — the URL is now \`${cur.fullPath}\`.`)
    rec('render', `RouterView renders: **${cur.matched.map((m) => m.components.default.name).join(' › ')}**${Object.keys(cur.params).length ? ` with params ${JSON.stringify(cur.params)}` : ''}.`)
  }
  route.value = router.currentRoute.value
  path.value = route.value.fullPath
  frames.value = events
  busy.value = false
  player.restart()
  if (player.canAutoplay.value) player.play()
}

const stageIndex = computed(() => STAGES.findIndex((s) => s.id === frame.value?.stage))
const matchedPaths = computed(() => new Set(route.value.matched.map((m) => m.path)))
const rendered = computed(() => route.value.matched.map((m) => m.components?.default?.name ?? '…'))

go('/')
</script>

<template>
  <div class="rtv">
    <form class="rtv__bar" @submit.prevent="go(path)">
      <span class="rtv__dots" aria-hidden="true"><span /><span /><span /></span>
      <label class="visually-hidden" for="rtv-url">URL path</label>
      <input id="rtv-url" v-model="path" class="rtv__url mono" spellcheck="false" autocomplete="off" />
      <button type="submit" class="btn btn--sm btn--acid" :disabled="busy">go</button>
    </form>
    <div class="rtv__links cluster">
      <span class="label">links:</span>
      <button v-for="l in def.links" :key="l" type="button" class="btn btn--sm mono rtv__link" :disabled="busy" @click="go(l)">{{ l }}</button>
      <label v-if="preset === 'guards'" class="checkbox rtv__auth"><input v-model="loggedIn" type="checkbox" /> logged in</label>
    </div>

    <ol class="rtv__stages" aria-label="Navigation pipeline">
      <li v-for="(s, i) in STAGES" :key="s.id" :class="{ 'is-active': i === stageIndex, 'is-past': i < stageIndex }">
        <span class="mono">{{ i + 1 }}</span> {{ s.label }}
      </li>
    </ol>

    <div class="rtv__grid">
      <div class="rtv__panel">
        <p class="label">route table</p>
        <ul class="rtv__table">
          <li v-for="(r, i) in table" :key="i" :class="{ 'is-match': matchedPaths.has(r.path), 'is-child': r.depth }">
            <span class="mono">{{ r.path }}</span> <span class="muted">→ {{ r.name }}</span>
          </li>
        </ul>
      </div>
      <div class="rtv__panel rtv__view">
        <p class="label">what renders</p>
        <div class="rtv__nest">
          <div class="rtv__box rtv__box--app">
            &lt;App&gt;
            <div class="rtv__box">
              &lt;RouterView&gt;
              <template v-if="rendered[0]">
                <div class="rtv__box rtv__box--comp">
                  {{ rendered[0] }}
                  <div v-if="rendered[1]" class="rtv__box">
                    &lt;RouterView&gt;
                    <div class="rtv__box rtv__box--comp">{{ rendered[1] }}</div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
        <p class="mono rtv__meta">
          path: {{ route.path }}<br />
          params: {{ JSON.stringify(route.params) }}<br />
          query: {{ JSON.stringify(route.query) }}
        </p>
      </div>
    </div>

    <div class="rtv__explain" aria-live="polite">
      <span class="label">{{ STAGES[stageIndex]?.label ?? 'ready' }}</span>
      <RichText :value="frame?.text ?? 'Click a link to navigate.'" />
    </div>
    <AnimationControls :player="player" label="Router" />
    <p class="muted rtv__note">Running a real Vue Router with <code>createMemoryHistory()</code>; your app would use <code>createWebHistory()</code>.</p>
  </div>
</template>

<style scoped>
.rtv {
  display: grid;
  gap: var(--s-3);
}
.rtv__bar {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  padding: 6px;
  border: var(--border);
  background: var(--surface-2);
}
.rtv__dots {
  display: flex;
  gap: 4px;
  padding: 0 4px;
}
.rtv__dots span {
  width: 10px;
  height: 10px;
  border: 2px solid var(--line);
}
.rtv__url {
  flex: 1;
  min-width: 0;
  min-height: 34px;
  border: var(--border-thin);
  background: var(--surface);
  padding: 2px 10px;
}
.rtv__link {
  text-transform: none;
  letter-spacing: 0;
}
.rtv__auth {
  margin-left: var(--s-3);
  font-weight: 700;
}
.rtv__stages {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  border: var(--border);
}
.rtv__stages li {
  margin: 0;
  padding: 6px 8px;
  font-size: 0.78rem;
  font-weight: 700;
  border-right: var(--border-thin);
  background: var(--surface);
}
.rtv__stages li:last-child {
  border-right: 0;
}
.rtv__stages .mono {
  border: 1.5px solid currentColor;
  padding: 0 4px;
  margin-right: 3px;
}
.rtv__stages li.is-past {
  background: var(--surface-2);
  color: var(--muted);
}
.rtv__stages li.is-active {
  background: var(--acid);
  color: var(--acid-ink);
}
.rtv__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: var(--s-3);
}
.rtv__panel {
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface);
}
.rtv__panel > .label {
  margin: 0 0 var(--s-2);
  color: var(--muted);
}
.rtv__table {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.82rem;
}
.rtv__table li {
  padding: 3px 6px;
  margin: 0;
  border-left: 4px solid transparent;
}
.rtv__table li.is-child {
  padding-left: 22px;
}
.rtv__table li.is-match {
  background: var(--acid);
  color: var(--acid-ink);
  border-left-color: var(--line);
}
.rtv__table li.is-match .muted {
  color: #3d3d2c;
}
.rtv__box {
  border: 2px dashed var(--line);
  padding: 6px 8px;
  margin-top: 6px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}
.rtv__box--app {
  margin-top: 0;
  border-style: solid;
}
.rtv__box--comp {
  border-style: solid;
  background: var(--note-blue);
  font-weight: 800;
}
.rtv__meta {
  margin: var(--s-3) 0 0;
  font-size: 0.75rem;
  color: var(--muted);
}
.rtv__explain {
  display: grid;
  gap: 6px;
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
  min-height: 80px;
}
.rtv__explain .label {
  width: fit-content;
  background: var(--text);
  color: var(--bg);
  padding: 1px 6px;
}
.rtv__explain :deep(p) {
  margin: 0;
}
.rtv__note {
  margin: 0;
  font-size: 0.8rem;
}
@media (max-width: 800px) {
  .rtv__grid {
    grid-template-columns: 1fr;
  }
  .rtv__stages {
    grid-template-columns: repeat(2, 1fr);
  }
  .rtv__stages li {
    border-bottom: var(--border-thin);
  }
}
</style>
