// Project 9: Production-Style Application — routing, Pinia, composables, reusable components,
// testing, accessibility, performance and deployment, combined in one feature-based app.

// ---------------------------------------------------------------- bootstrap

const mainJs = `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './app/router.js'
import { persistPlugin } from './app/persistPlugin.js'
import './styles.css'

const app = createApp(App)

// Last line of defence for errors no component handled.
// Production: send these to a monitoring service instead of the console.
app.config.errorHandler = (error, instance, info) => {
  console.error('[app] unhandled error:', error.message, '(' + info + ')')
}

const pinia = createPinia()
pinia.use(persistPlugin) // stores opt in with { persist: { … } }

app.use(pinia).use(router).mount('#app')
`

const appVue = `<script setup>
// The root only renders the layout. Keeping it this small means the app's
// structure lives in app/ and each feature lives in features/.
import AppLayout from './app/AppLayout.vue'
</script>

<template>
  <AppLayout />
</template>`

const stylesCss = `:root {
  --ink: #1f1d1a;
  --muted: #6b665e;
  --line: #e7e2d9;
  --paper: #fffdf8;
  --soft: #f6f2ea;
  --accent: #b5482a;
  --accent-ink: #ffffff;
  --ok: #2b8a3e;
  --danger: #c92a2a;
}
body { margin: 0; background: var(--soft); }
#app { font-family: system-ui, sans-serif; color: var(--ink); line-height: 1.45; }
#app button,
#app input { font: inherit; }
#app button { cursor: pointer; }
#app :focus-visible { outline: 3px solid #3b5bdb; outline-offset: 2px; }
#app a { color: inherit; }
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
.page-title { margin: 0 0 12px; font-size: 1.6rem; }
.btn { padding: 8px 14px; border: 1px solid var(--ink); border-radius: 8px; background: #fff; color: var(--ink); }
.btn-primary { border-color: var(--accent); background: var(--accent); color: var(--accent-ink); }
@media (prefers-reduced-motion: reduce) {
  #app * { transition: none !important; animation: none !important; }
}
`

// ---------------------------------------------------------------- router

const routerHeader = `import { createRouter, createMemoryHistory } from 'vue-router'
import RecipesPage from '../features/recipes/RecipesPage.vue'
`

const starterRouterJs = `${routerHeader}import RecipeDetailPage from '../features/recipes/RecipeDetailPage.vue'
import FavoritesPage from '../features/favorites/FavoritesPage.vue'
import ShoppingListPage from '../features/shopping/ShoppingListPage.vue'

// TODO (step 2):
//  - lazy-load every page except the landing page with () => import('…')
//  - add meta.title to each route (the layout announces it)
//  - add a catch-all 404 route (../NotFoundPage.vue)
//  - set document.title after each navigation
export const routes = [
  { path: '/', name: 'recipes', component: RecipesPage },
  { path: '/recipes/:slug', name: 'recipe', component: RecipeDetailPage, props: true },
  { path: '/favorites', name: 'favorites', component: FavoritesPage },
  { path: '/shopping-list', name: 'shopping', component: ShoppingListPage },
]

// The sandbox has no address bar; production uses createWebHistory(import.meta.env.BASE_URL).
const router = createRouter({ history: createMemoryHistory(), routes })

export default router
`

const routerJs = `${routerHeader}
// The landing page is imported eagerly (it is always needed first).
// Every other page is a lazy chunk, downloaded on first visit.
export const routes = [
  { path: '/', name: 'recipes', component: RecipesPage, meta: { title: 'Recipes' } },
  {
    path: '/recipes/:slug',
    name: 'recipe',
    component: () => import('../features/recipes/RecipeDetailPage.vue'),
    props: true,
    meta: { title: 'Recipe' },
  },
  { path: '/favorites', name: 'favorites', component: () => import('../features/favorites/FavoritesPage.vue'), meta: { title: 'Favorites' } },
  { path: '/shopping-list', name: 'shopping', component: () => import('../features/shopping/ShoppingListPage.vue'), meta: { title: 'Shopping list' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../NotFoundPage.vue'), meta: { title: 'Page not found' } },
]

// The sandbox has no address bar; production uses createWebHistory(import.meta.env.BASE_URL).
const router = createRouter({ history: createMemoryHistory(), routes })

router.afterEach((to) => {
  document.title = (to.meta.title ? to.meta.title + ' · ' : '') + 'Recipe Box'
})

export default router
`

// ---------------------------------------------------------------- Pinia persistence plugin

const starterPersistJs = `// A tiny Pinia plugin: stores opt in to persistence with a third argument
//   defineStore('favorites', setup, { persist: { key, pick, validate } })
// SIMPLIFIED version of what libraries like pinia-plugin-persistedstate do.
export function persistPlugin({ store, options }) {
  const config = options.persist
  if (!config) return
  // TODO (step 5):
  //  1. read config.key from localStorage, JSON.parse it (safely!), check
  //     config.validate(saved) if given, then store.$patch(only the picked keys)
  //  2. store.$subscribe(…) and save the picked keys on every change
}
`

const persistJs = `// A tiny Pinia plugin: stores opt in to persistence with a third argument
//   defineStore('favorites', setup, { persist: { key, pick, validate } })
// SIMPLIFIED version of what libraries like pinia-plugin-persistedstate do.
// (In this sandbox localStorage is in-memory and is cleared between runs.)

function pickKeys(source, keys) {
  const result = {}
  for (const key of keys) {
    if (key in source) result[key] = source[key]
  }
  return result
}

export function persistPlugin({ store, options }) {
  const config = options.persist
  if (!config) return

  // 1. Restore — treat saved data as untrusted input.
  try {
    const saved = JSON.parse(localStorage.getItem(config.key) ?? 'null')
    if (saved && typeof saved === 'object' && (!config.validate || config.validate(saved))) {
      store.$patch(pickKeys(saved, config.pick))
    }
  } catch (error) {
    console.warn('[persist] ignoring unreadable data for "' + config.key + '":', error.message)
  }

  // 2. Save after every change. detached: keep saving even if the component
  //    that first used the store unmounts.
  store.$subscribe(
    (mutation, state) => {
      try {
        localStorage.setItem(config.key, JSON.stringify(pickKeys(state, config.pick)))
      } catch (error) {
        console.warn('[persist] could not save "' + config.key + '":', error.message)
      }
    },
    { detached: true },
  )
}
`

// ---------------------------------------------------------------- layout

const layoutStyles = `<style scoped>
.skip-link { position: absolute; left: -999px; top: 8px; padding: 8px 12px; background: #fff; border: 2px solid #3b5bdb; z-index: 10; }
.skip-link:focus { left: 8px; }
.topbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 12px 20px; background: var(--paper); border-bottom: 1px solid var(--line); }
.brand { font-weight: 800; font-size: 1.1rem; text-decoration: none; }
.nav ul { display: flex; gap: 6px; list-style: none; margin: 0; padding: 0; }
.nav a { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 8px; text-decoration: none; color: var(--muted); }
.nav a[aria-current='page'] { background: var(--soft); color: var(--ink); font-weight: 600; }
.count { display: inline-grid; place-items: center; min-width: 1.5em; height: 1.5em; padding: 0 4px; border-radius: 99px; background: var(--accent); color: #fff; font-size: 0.75rem; font-variant-numeric: tabular-nums; }
.main { max-width: 960px; margin: 0 auto; padding: 20px; outline: none; }
</style>`

const layoutTemplate = `<template>
  <a href="#main" class="skip-link">Skip to content</a>
  <header class="topbar">
    <RouterLink to="/" class="brand">Recipe Box</RouterLink>
    <nav class="nav" aria-label="Main">
      <ul>
        <li><RouterLink :to="{ name: 'recipes' }" class="nav-recipes">Recipes</RouterLink></li>
        <li>
          <RouterLink :to="{ name: 'favorites' }" class="nav-favorites">
            Favorites <span class="count favorites-count" aria-label="saved recipes">{{ favoritesCount }}</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'shopping' }" class="nav-shopping">
            Shopping list <span class="count shopping-count" aria-label="items left">{{ shoppingRemaining }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </header>

  <!-- Screen readers hear the new page's name after client-side navigation -->
  <p class="route-announcer visually-hidden" aria-live="polite" aria-atomic="true">{{ announcement }}</p>

  <main id="main" ref="mainEl" class="main" tabindex="-1">
    <!-- keyed by path: navigating away from a crashed page resets the boundary -->
    <ErrorBoundary :key="route.path">
      <RouterView />
    </ErrorBoundary>
  </main>

  <ToastRegion />
</template>`

const starterLayoutVue = `<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import ErrorBoundary from '../shared/components/ErrorBoundary.vue'
import ToastRegion from '../shared/components/ToastRegion.vue'
import { useFavoritesStore } from '../features/favorites/favorites.js'
import { useShoppingStore } from '../features/shopping/shopping.js'

const route = useRoute()
const { count: favoritesCount } = storeToRefs(useFavoritesStore())
const { remaining: shoppingRemaining } = storeToRefs(useShoppingStore())

const mainEl = ref(null)
const announcement = ref('')
// TODO (step 6): when the PATH changes, announce "<meta.title> page" and
// move focus to <main> after the DOM has updated.
</script>

${layoutTemplate}

${layoutStyles}`

const layoutVue = `<script setup>
import { ref, watch, nextTick } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import ErrorBoundary from '../shared/components/ErrorBoundary.vue'
import ToastRegion from '../shared/components/ToastRegion.vue'
import { useFavoritesStore } from '../features/favorites/favorites.js'
import { useShoppingStore } from '../features/shopping/shopping.js'

const route = useRoute()
const { count: favoritesCount } = storeToRefs(useFavoritesStore())
const { remaining: shoppingRemaining } = storeToRefs(useShoppingStore())

const mainEl = ref(null)
const announcement = ref('')

// Client-side navigation doesn't load a new document, so assistive tech
// isn't told anything changed. Announce the page and move focus to it.
// Path only: typing in the search box changes the query, not the page.
watch(
  () => route.path,
  () => {
    announcement.value = (route.meta.title ?? 'New') + ' page'
    nextTick(() => mainEl.value?.focus())
  },
)
</script>

${layoutTemplate}

${layoutStyles}`

// ---------------------------------------------------------------- shared components

const starterErrorBoundaryVue = `<script setup>
// TODO (step 6): catch errors thrown by anything inside the slot with
// onErrorCaptured, show a friendly fallback (.error-boundary, role="alert")
// with a .error-retry button that re-mounts the content, and return false
// so the error does not propagate further.
</script>

<template>
  <slot />
</template>`

const errorBoundaryVue = `<script setup>
import { ref, onErrorCaptured } from 'vue'

const error = ref(null)
const resetKey = ref(0)

onErrorCaptured((err, instance, info) => {
  error.value = err
  // Production: report to monitoring with the component name and info.
  console.error('[ErrorBoundary]', err.message, '(' + info + ')')
  return false // handled here: don't propagate to app.config.errorHandler
})

function retry() {
  error.value = null
  resetKey.value++ // a new key re-mounts the content from scratch
}
</script>

<template>
  <div v-if="error" class="error-boundary" role="alert">
    <h2>Something went wrong on this page.</h2>
    <p>You can try again. If it keeps happening, go back to the recipes.</p>
    <button type="button" class="btn error-retry" @click="retry">Try again</button>
  </div>
  <div v-else :key="resetKey" class="error-boundary-content">
    <slot />
  </div>
</template>

<style scoped>
.error-boundary { padding: 20px; border: 1px solid var(--danger); border-radius: 12px; background: #fff5f5; }
.error-boundary h2 { margin-top: 0; font-size: 1.2rem; }
</style>`

const asyncStateVue = `<script setup>
// One component for the four states of any request.
defineProps({
  status: { type: String, required: true }, // 'idle' | 'loading' | 'success' | 'error'
  error: { type: Object, default: null },
  empty: { type: Boolean, default: false },
  loadingLabel: { type: String, default: 'Loading…' },
})
const emit = defineEmits(['retry'])
</script>

<template>
  <div class="async-state" :aria-busy="status === 'loading' ? 'true' : 'false'">
    <p v-if="status === 'loading' || status === 'idle'" class="async-loading" role="status">
      <slot name="loading">{{ loadingLabel }}</slot>
    </p>
    <div v-else-if="status === 'error'" class="async-error" role="alert">
      <p>{{ error?.message ?? 'Something went wrong.' }}</p>
      <button type="button" class="btn async-retry" @click="emit('retry')">Try again</button>
    </div>
    <div v-else-if="empty" class="async-empty">
      <slot name="empty">Nothing here yet.</slot>
    </div>
    <slot v-else />
  </div>
</template>

<style scoped>
.async-loading { color: var(--muted); }
.async-error { padding: 14px; border: 1px solid var(--danger); border-radius: 10px; background: #fff5f5; }
.async-error p { margin: 0 0 8px; color: var(--danger); }
.async-empty { padding: 24px; text-align: center; color: var(--muted); border: 1px dashed var(--line); border-radius: 12px; }
</style>`

const toastRegionVue = `<script setup>
import { storeToRefs } from 'pinia'
import { useToastsStore } from '../stores/toasts.js'

const toastsStore = useToastsStore()
const { toasts } = storeToRefs(toastsStore)
</script>

<template>
  <!-- Always rendered, so screen readers already know the region when a toast arrives -->
  <div class="toast-region" role="status" aria-live="polite">
    <div v-for="toast in toasts" :key="toast.id" class="toast">
      <span class="toast-message">{{ toast.message }}</span>
      <button type="button" class="toast-dismiss" aria-label="Dismiss notification" @click="toastsStore.dismiss(toast.id)">✕</button>
    </div>
  </div>
</template>

<style scoped>
.toast-region { position: fixed; right: 16px; bottom: 16px; display: grid; gap: 8px; z-index: 20; }
.toast { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; background: var(--ink); color: #fff; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); }
.toast-dismiss { border: 0; background: none; color: inherit; }
</style>`

const toastsStoreJs = `import { defineStore } from 'pinia'
import { ref } from 'vue'

// App-wide notifications. Any feature can push one; ToastRegion renders them.
export const useToastsStore = defineStore('toasts', () => {
  const toasts = ref([])
  const timers = new Map()
  let nextId = 1

  function dismiss(id) {
    clearTimeout(timers.get(id))
    timers.delete(id)
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function push(message, { timeout = 5000 } = {}) {
    const id = nextId++
    toasts.value = [...toasts.value, { id, message }].slice(-3) // never a wall of toasts
    timers.set(id, setTimeout(() => dismiss(id), timeout))
    return id
  }

  return { toasts, push, dismiss }
})
`

// ---------------------------------------------------------------- shared composables

const useAsyncJs = `import { ref, shallowRef, onScopeDispose } from 'vue'

// Generic async state for any function shaped like fn(...args, { signal }).
// Latest call wins; older calls are aborted; disposal aborts too.
export function useAsync(fn) {
  const data = shallowRef(null)
  const error = shallowRef(null)
  const status = ref('idle') // 'idle' | 'loading' | 'success' | 'error'
  let controller = null
  let lastArgs = []

  async function execute(...args) {
    lastArgs = args
    controller?.abort()
    const current = new AbortController()
    controller = current
    status.value = 'loading'
    error.value = null
    try {
      const result = await fn(...args, { signal: current.signal })
      if (current !== controller) return // a newer call started
      data.value = result
      status.value = 'success'
    } catch (err) {
      if (current !== controller || err.name === 'AbortError') return
      error.value = err
      status.value = 'error'
    }
  }

  function retry() {
    return execute(...lastArgs)
  }

  onScopeDispose(() => controller?.abort())

  return { data, error, status, execute, retry }
}
`

const starterDebounceJs = `import { computed, toValue } from 'vue'

// Returns a read-only ref that follows source, but only after it has
// stopped changing for delay ms.
export function useDebouncedRef(source, delay = 250) {
  // TODO (step 4): this follows source immediately. Debounce it with a
  // watcher + setTimeout, and clear the timer in onScopeDispose.
  return computed(() => toValue(source))
}
`

const debounceJs = `import { ref, readonly, watch, toValue, onScopeDispose } from 'vue'

// Returns a read-only ref that follows source, but only after it has
// stopped changing for delay ms. source can be a ref or a getter.
export function useDebouncedRef(source, delay = 250) {
  const debounced = ref(toValue(source))
  let timer = null

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onScopeDispose(() => clearTimeout(timer))

  return readonly(debounced)
}
`

// ---------------------------------------------------------------- recipes feature

const recipesApiJs = `// features/recipes/api.js — a pretend REST API (SIMPLIFIED: setTimeout + Promises).
// Real version: fetch(import.meta.env.VITE_API_URL + '/recipes?…', { signal }).

const LATENCY = 150
export const simulate = { failNext: false }
export const stats = { list: 0, get: 0 }

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const RECIPES = [
  {
    slug: 'tomato-basil-pasta', title: 'Tomato & basil pasta', minutes: 20, servings: 2, tags: ['vegetarian', 'quick'],
    ingredients: [
      { name: 'spaghetti', qty: 200, unit: 'g' }, { name: 'cherry tomatoes', qty: 250, unit: 'g' },
      { name: 'garlic', qty: 2, unit: 'cloves' }, { name: 'olive oil', qty: 2, unit: 'tbsp' }, { name: 'basil', qty: 1, unit: 'bunch' },
    ],
    steps: ['Boil the pasta.', 'Soften garlic in olive oil, add the tomatoes until they burst.', 'Toss with the pasta and torn basil.'],
  },
  {
    slug: 'chickpea-curry', title: 'Chickpea & spinach curry', minutes: 35, servings: 4, tags: ['vegetarian'],
    ingredients: [
      { name: 'chickpeas', qty: 2, unit: 'cans' }, { name: 'coconut milk', qty: 1, unit: 'can' }, { name: 'onion', qty: 1, unit: '' },
      { name: 'curry paste', qty: 3, unit: 'tbsp' }, { name: 'spinach', qty: 100, unit: 'g' }, { name: 'rice', qty: 300, unit: 'g' },
    ],
    steps: ['Fry the onion with the curry paste.', 'Add chickpeas and coconut milk; simmer 15 minutes.', 'Stir in spinach. Serve with rice.'],
  },
  {
    slug: 'lemon-chicken-traybake', title: 'Lemon chicken traybake', minutes: 45, servings: 4, tags: [],
    ingredients: [
      { name: 'chicken thighs', qty: 8, unit: '' }, { name: 'potatoes', qty: 600, unit: 'g' }, { name: 'lemon', qty: 1, unit: '' },
      { name: 'garlic', qty: 4, unit: 'cloves' }, { name: 'olive oil', qty: 3, unit: 'tbsp' },
    ],
    steps: ['Toss everything with oil and lemon.', 'Roast for 40 minutes, turning once.'],
  },
  {
    slug: 'shakshuka', title: 'Shakshuka', minutes: 25, servings: 2, tags: ['vegetarian', 'quick'],
    ingredients: [
      { name: 'eggs', qty: 4, unit: '' }, { name: 'chopped tomatoes', qty: 400, unit: 'g' }, { name: 'onion', qty: 1, unit: '' },
      { name: 'red pepper', qty: 1, unit: '' }, { name: 'cumin', qty: 1, unit: 'tsp' },
    ],
    steps: ['Soften onion and pepper with cumin.', 'Add tomatoes and simmer.', 'Make wells, crack in the eggs, cover until set.'],
  },
  {
    slug: 'miso-salmon', title: 'Miso-glazed salmon', minutes: 20, servings: 2, tags: ['quick'],
    ingredients: [
      { name: 'salmon fillets', qty: 2, unit: '' }, { name: 'miso paste', qty: 2, unit: 'tbsp' }, { name: 'honey', qty: 1, unit: 'tbsp' },
      { name: 'rice', qty: 150, unit: 'g' }, { name: 'broccoli', qty: 200, unit: 'g' },
    ],
    steps: ['Brush salmon with miso and honey.', 'Grill for 8–10 minutes.', 'Serve with rice and steamed broccoli.'],
  },
  {
    slug: 'banana-bread', title: 'Banana bread', minutes: 70, servings: 8, tags: ['vegetarian', 'baking'],
    ingredients: [
      { name: 'ripe bananas', qty: 3, unit: '' }, { name: 'flour', qty: 250, unit: 'g' }, { name: 'butter', qty: 100, unit: 'g' },
      { name: 'sugar', qty: 120, unit: 'g' }, { name: 'eggs', qty: 2, unit: '' },
    ],
    steps: ['Mash bananas; beat in butter, sugar and eggs.', 'Fold in flour.', 'Bake about an hour, until a skewer comes out clean.'],
  },
  {
    slug: 'black-bean-tacos', title: 'Black bean tacos', minutes: 25, servings: 4, tags: ['vegetarian', 'quick'],
    ingredients: [
      { name: 'black beans', qty: 2, unit: 'cans' }, { name: 'tortillas', qty: 8, unit: '' }, { name: 'avocados', qty: 2, unit: '' },
      { name: 'lime', qty: 1, unit: '' }, { name: 'red onion', qty: 1, unit: '' },
    ],
    steps: ['Warm and season the beans.', 'Mash avocado with lime.', 'Fill warm tortillas.'],
  },
  {
    slug: 'mushroom-risotto', title: 'Mushroom risotto', minutes: 40, servings: 4, tags: ['vegetarian'],
    ingredients: [
      { name: 'arborio rice', qty: 300, unit: 'g' }, { name: 'mushrooms', qty: 400, unit: 'g' }, { name: 'vegetable stock', qty: 1000, unit: 'ml' },
      { name: 'parmesan', qty: 60, unit: 'g' }, { name: 'olive oil', qty: 2, unit: 'tbsp' }, { name: 'onion', qty: 1, unit: '' },
    ],
    steps: ['Fry onion and mushrooms in oil.', 'Toast the rice, then add hot stock a ladle at a time.', 'Stir in parmesan.'],
  },
]

const summary = ({ slug, title, minutes, servings, tags }) => ({ slug, title, minutes, servings, tags })
const copy = (value) => JSON.parse(JSON.stringify(value)) // the "network" hands out fresh objects

function respond(producer, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (simulate.failNext) {
        simulate.failNext = false
        reject(new ApiError(503, 'The recipe service is unavailable right now. Please try again.'))
        return
      }
      try {
        resolve(producer())
      } catch (error) {
        reject(error)
      }
    }, LATENCY)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Request cancelled', 'AbortError'))
    }, { once: true })
  })
}

// GET /recipes?q=&tag=
export function listRecipes({ q = '', tag = '' } = {}, { signal } = {}) {
  stats.list++
  return respond(() => {
    const needle = q.trim().toLowerCase()
    return RECIPES.filter((recipe) => !tag || recipe.tags.includes(tag))
      .filter((recipe) => !needle || recipe.title.toLowerCase().includes(needle) || recipe.ingredients.some((i) => i.name.includes(needle)))
      .map(summary)
  }, signal)
}

// GET /recipes/:slug
export function getRecipe(slug, { signal } = {}) {
  stats.get++
  return respond(() => {
    const recipe = RECIPES.find((r) => r.slug === slug)
    if (!recipe) throw new ApiError(404, "We couldn't find that recipe.")
    return copy(recipe)
  }, signal)
}
`

const formatJs = `// Shared formatting for quantities and ingredient lines.
export function roundQty(qty) {
  return Math.round(qty * 100) / 100
}

export function formatIngredient({ qty, unit, name }) {
  return [String(roundQty(qty)), unit, name].filter(Boolean).join(' ')
}
`

const recipeCardVue = `<script setup>
import { RouterLink } from 'vue-router'
import FavoriteButton from '../favorites/FavoriteButton.vue'

defineProps({
  recipe: { type: Object, required: true },
})
</script>

<template>
  <article class="recipe-card">
    <div class="card-top">
      <h2 class="recipe-title">
        <RouterLink class="recipe-link" :to="{ name: 'recipe', params: { slug: recipe.slug } }">{{ recipe.title }}</RouterLink>
      </h2>
      <FavoriteButton :slug="recipe.slug" :title="recipe.title" />
    </div>
    <p class="recipe-meta">{{ recipe.minutes }} min · serves {{ recipe.servings }}</p>
    <ul v-if="recipe.tags.length" class="tags" aria-label="Tags">
      <li v-for="tag in recipe.tags" :key="tag" class="tag">{{ tag }}</li>
    </ul>
  </article>
</template>

<style scoped>
.recipe-card { height: 100%; box-sizing: border-box; padding: 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper); }
.card-top { display: flex; justify-content: space-between; gap: 8px; }
.recipe-title { margin: 0; font-size: 1.05rem; }
.recipe-link { text-decoration: none; }
.recipe-link:hover { text-decoration: underline; }
.recipe-meta { margin: 6px 0; color: var(--muted); font-size: 0.9rem; }
.tags { display: flex; flex-wrap: wrap; gap: 4px; list-style: none; margin: 0; padding: 0; }
.tag { padding: 2px 8px; border-radius: 99px; background: var(--soft); font-size: 0.8rem; }
</style>`

const recipesPageStyles = `<style scoped>
.filters { display: grid; gap: 10px; margin-bottom: 14px; }
.filters label { font-weight: 600; }
.search-input { max-width: 420px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
.tag-filters { display: flex; flex-wrap: wrap; gap: 6px; }
.tag-filter { padding: 5px 12px; border: 1px solid var(--line); border-radius: 99px; background: #fff; text-decoration: none; text-transform: capitalize; }
.tag-filter.is-active { background: var(--ink); border-color: var(--ink); color: #fff; }
.result-count { margin: 0 0 8px; color: var(--muted); }
.recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; list-style: none; margin: 0; padding: 0; }
</style>`

const recipesPageTemplate = (tagControl) => `<template>
  <section aria-labelledby="recipes-title">
    <h1 id="recipes-title" class="page-title">Recipes</h1>

    <div class="filters" role="search">
      <label for="recipe-search">Search by name or ingredient</label>
      <input
        id="recipe-search"
        v-model="search"
        class="search-input"
        type="search"
        placeholder="Try “rice” or “pasta”"
        autocomplete="off"
      />
      <div class="tag-filters" role="group" aria-label="Filter by tag">
${tagControl}
      </div>
    </div>

    <p v-if="status === 'success'" class="result-count" aria-live="polite">
      {{ data.length === 1 ? '1 recipe' : data.length + ' recipes' }}
    </p>
    <AsyncState :status="status" :error="error" :empty="data !== null && data.length === 0" @retry="retry">
      <template #empty>No recipes match your search.</template>
      <ul class="recipe-grid">
        <li v-for="recipe in data" :key="recipe.slug"><RecipeCard :recipe="recipe" /></li>
      </ul>
    </AsyncState>
  </section>
</template>`

const starterRecipesPageVue = `<script setup>
import { ref, watch } from 'vue'
import AsyncState from '../../shared/components/AsyncState.vue'
import RecipeCard from './RecipeCard.vue'
import { useAsync } from '../../shared/composables/useAsync.js'
import { useDebouncedRef } from '../../shared/composables/useDebouncedRef.js'
import { listRecipes } from './api.js'

const TAGS = ['vegetarian', 'quick', 'baking']

// TODO (step 4): these filters live only in this component. Make the URL
// query (?q=…&tag=…) the source of truth: read it with useRoute(), write the
// debounced search with router.replace(), and turn the tag buttons into
// RouterLinks so filtered views can be shared.
const search = ref('')
const tag = ref('')
const debouncedSearch = useDebouncedRef(search, 250)

const { data, error, status, execute, retry } = useAsync(listRecipes)

watch([debouncedSearch, tag], ([q, t]) => execute({ q, tag: t }), { immediate: true })
</script>

${recipesPageTemplate(`        <button
          v-for="t in ['', ...TAGS]"
          :key="t || 'all'"
          type="button"
          :class="['tag-filter', 'tag-' + (t || 'all'), { 'is-active': tag === t }]"
          :aria-pressed="tag === t ? 'true' : 'false'"
          @click="tag = t"
        >
          {{ t || 'All' }}
        </button>`)}

${recipesPageStyles}`

const recipesPageVue = `<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AsyncState from '../../shared/components/AsyncState.vue'
import RecipeCard from './RecipeCard.vue'
import { useAsync } from '../../shared/composables/useAsync.js'
import { useDebouncedRef } from '../../shared/composables/useDebouncedRef.js'
import { listRecipes } from './api.js'

const TAGS = ['vegetarian', 'quick', 'baking']
const route = useRoute()
const router = useRouter()

// The URL is the source of truth: shareable, bookmarkable, back-button friendly.
const queryText = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const tag = computed(() => (TAGS.includes(route.query.tag) ? route.query.tag : ''))

function queryFor({ q = queryText.value, t = tag.value } = {}) {
  const query = {}
  if (q) query.q = q
  if (t) query.tag = t
  return query
}

// The input keeps its own text while typing; the URL follows after a pause.
const search = ref(queryText.value)
const debouncedSearch = useDebouncedRef(search, 250)
watch(debouncedSearch, (q) => {
  const trimmed = q.trim()
  if (trimmed !== queryText.value) router.replace({ query: queryFor({ q: trimmed }) })
})
// …and follows the URL when it changes from outside (back button, links).
watch(queryText, (q) => {
  if (q !== search.value.trim()) search.value = q
})

const { data, error, status, execute, retry } = useAsync(listRecipes)
watch([queryText, tag], ([q, t]) => execute({ q, tag: t }), { immediate: true })
</script>

${recipesPageTemplate(`        <RouterLink
          v-for="t in ['', ...TAGS]"
          :key="t || 'all'"
          :to="{ query: queryFor({ t }) }"
          :class="['tag-filter', 'tag-' + (t || 'all'), { 'is-active': tag === t }]"
          :aria-current="tag === t ? 'true' : undefined"
        >
          {{ t || 'All' }}
        </RouterLink>`)}

${recipesPageStyles}`

const recipeDetailVue = `<script setup>
import { ref, computed, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AsyncState from '../../shared/components/AsyncState.vue'
import FavoriteButton from '../favorites/FavoriteButton.vue'
import { useAsync } from '../../shared/composables/useAsync.js'
import { useShoppingStore } from '../shopping/shopping.js'
import { useToastsStore } from '../../shared/stores/toasts.js'
import { getRecipe } from './api.js'
import { roundQty, formatIngredient } from './format.js'

const props = defineProps({
  slug: { type: String, required: true },
})

const shopping = useShoppingStore()
const toasts = useToastsStore()
const { data: recipe, error, status, execute, retry } = useAsync(getRecipe)
watch(() => props.slug, (slug) => execute(slug), { immediate: true })

const servings = ref(1)
watch(recipe, (r) => {
  if (r) servings.value = r.servings
})

const factor = computed(() => (recipe.value ? servings.value / recipe.value.servings : 1))
const scaled = computed(() =>
  recipe.value ? recipe.value.ingredients.map((i) => ({ ...i, qty: roundQty(i.qty * factor.value) })) : [],
)

function addToList() {
  const added = shopping.addIngredients(recipe.value.ingredients, factor.value)
  toasts.push('Added ' + added + ' ingredients to your shopping list.')
}
</script>

<template>
  <section>
    <RouterLink :to="{ name: 'recipes' }" class="back-link">← All recipes</RouterLink>
    <AsyncState :status="status" :error="error" loading-label="Loading recipe…" @retry="retry">
      <article v-if="recipe" class="recipe-detail">
        <header class="detail-head">
          <h1 class="page-title">{{ recipe.title }}</h1>
          <FavoriteButton :slug="recipe.slug" :title="recipe.title" />
        </header>
        <p class="muted">{{ recipe.minutes }} minutes</p>

        <div class="servings" role="group" aria-labelledby="servings-label">
          <span id="servings-label">Servings</span>
          <button type="button" class="btn servings-dec" :disabled="servings <= 1" aria-label="Fewer servings" @click="servings--">−</button>
          <output class="servings-value" aria-live="polite">{{ servings }}</output>
          <button type="button" class="btn servings-inc" :disabled="servings >= 12" aria-label="More servings" @click="servings++">+</button>
        </div>

        <h2>Ingredients</h2>
        <ul class="ingredients">
          <li v-for="ingredient in scaled" :key="ingredient.name" class="ingredient">{{ formatIngredient(ingredient) }}</li>
        </ul>
        <button type="button" class="btn btn-primary add-to-list" @click="addToList">Add ingredients to shopping list</button>

        <h2>Method</h2>
        <ol class="steps">
          <li v-for="(step, index) in recipe.steps" :key="index">{{ step }}</li>
        </ol>
      </article>
    </AsyncState>
  </section>
</template>

<style scoped>
.back-link { display: inline-block; margin-bottom: 12px; text-decoration: none; color: var(--muted); }
.recipe-detail { max-width: 640px; }
.detail-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.muted { color: var(--muted); margin-top: 0; }
.servings { display: flex; align-items: center; gap: 8px; margin: 12px 0; }
.servings-value { min-width: 2ch; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
.ingredients { padding-left: 1.2em; }
.steps { padding-left: 1.2em; }
</style>`

// ---------------------------------------------------------------- favorites feature

const favoritesStoreJs = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFavoritesStore = defineStore(
  'favorites',
  () => {
    const ids = ref([]) // recipe slugs
    const count = computed(() => ids.value.length)

    function has(slug) {
      return ids.value.includes(slug)
    }

    // Returns true when the recipe is now a favorite.
    function toggle(slug) {
      ids.value = has(slug) ? ids.value.filter((s) => s !== slug) : [...ids.value, slug]
      return has(slug)
    }

    return { ids, count, has, toggle }
  },
  {
    // Read by app/persistPlugin.js — a custom store option.
    persist: {
      key: 'recipe-box.favorites.v1',
      pick: ['ids'],
      validate: (saved) => Array.isArray(saved.ids) && saved.ids.every((id) => typeof id === 'string'),
    },
  },
)
`

const favoriteButtonVue = `<script setup>
import { computed } from 'vue'
import { useFavoritesStore } from './favorites.js'
import { useToastsStore } from '../../shared/stores/toasts.js'

const props = defineProps({
  slug: { type: String, required: true },
  title: { type: String, required: true },
})

const favorites = useFavoritesStore()
const toasts = useToastsStore()
const active = computed(() => favorites.has(props.slug))

function toggle() {
  const saved = favorites.toggle(props.slug)
  toasts.push(saved ? 'Saved “' + props.title + '” to favorites.' : 'Removed “' + props.title + '” from favorites.')
}
</script>

<template>
  <!-- A toggle button: the label stays the same, aria-pressed carries the state -->
  <button
    type="button"
    class="favorite-btn"
    :aria-pressed="active ? 'true' : 'false'"
    :aria-label="'Favorite: ' + title"
    @click="toggle"
  >
    <span aria-hidden="true">{{ active ? '♥' : '♡' }}</span>
  </button>
</template>

<style scoped>
.favorite-btn { flex: none; width: 36px; height: 36px; border: 1px solid var(--line); border-radius: 50%; background: #fff; color: var(--accent); font-size: 1.1rem; line-height: 1; }
.favorite-btn[aria-pressed='true'] { background: var(--accent); border-color: var(--accent); color: #fff; }
</style>`

const favoritesPageVue = `<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import AsyncState from '../../shared/components/AsyncState.vue'
import RecipeCard from '../recipes/RecipeCard.vue'
import { useAsync } from '../../shared/composables/useAsync.js'
import { listRecipes } from '../recipes/api.js'
import { useFavoritesStore } from './favorites.js'

const { ids } = storeToRefs(useFavoritesStore())
const { data, error, status, execute, retry } = useAsync(listRecipes)
execute({})

const favorites = computed(() => (data.value ?? []).filter((recipe) => ids.value.includes(recipe.slug)))
</script>

<template>
  <section aria-labelledby="favorites-title">
    <h1 id="favorites-title" class="page-title">Favorites</h1>
    <AsyncState :status="status" :error="error" :empty="favorites.length === 0" @retry="retry">
      <template #empty>
        <p class="favorites-empty">No favorites yet. Tap ♡ on a recipe to save it here.</p>
        <RouterLink :to="{ name: 'recipes' }">Browse recipes</RouterLink>
      </template>
      <ul class="recipe-grid">
        <li v-for="recipe in favorites" :key="recipe.slug"><RecipeCard :recipe="recipe" /></li>
      </ul>
    </AsyncState>
  </section>
</template>

<style scoped>
.recipe-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; list-style: none; margin: 0; padding: 0; }
.favorites-empty { margin-top: 0; }
</style>`

// ---------------------------------------------------------------- shopping feature

const shoppingStoreHeader = `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { roundQty } from '../recipes/format.js'
`

const shoppingStoreTail = `
  function toggle(key) {
    items.value = items.value.map((item) => (item.key === key ? { ...item, checked: !item.checked } : item))
  }

  function clearChecked() {
    items.value = items.value.filter((item) => !item.checked)
  }

  return { items, remaining, addIngredients, toggle, clearChecked }
},
{
  persist: {
    key: 'recipe-box.shopping.v1',
    pick: ['items'],
    validate: (saved) => Array.isArray(saved.items),
  },
},
)
`

const starterShoppingStoreJs = `${shoppingStoreHeader}
export const useShoppingStore = defineStore(
  'shopping',
  () => {
  // [{ key: 'olive oil|tbsp', name, qty, unit, checked }]
  const items = ref([])
  const remaining = computed(() => items.value.filter((item) => !item.checked).length)

  // Adds a recipe's ingredients, scaled by factor (servings chosen / recipe servings).
  // Returns how many ingredients were added.
  function addIngredients(ingredients, factor = 1) {
    // TODO (step 5): scale each quantity by factor, and MERGE ingredients that are
    // already on the list (same name + unit) by adding the quantities together
    // (and un-checking them). Replace items.value with a new array.
    for (const ingredient of ingredients) {
      items.value.push({ key: ingredient.name + '|' + ingredient.unit, ...ingredient, checked: false })
    }
    return ingredients.length
  }
${shoppingStoreTail}`

const shoppingStoreJs = `${shoppingStoreHeader}
export const useShoppingStore = defineStore(
  'shopping',
  () => {
  // [{ key: 'olive oil|tbsp', name, qty, unit, checked }]
  const items = ref([])
  const remaining = computed(() => items.value.filter((item) => !item.checked).length)

  // Adds a recipe's ingredients, scaled by factor (servings chosen / recipe servings).
  // Returns how many ingredients were added.
  function addIngredients(ingredients, factor = 1) {
    const next = items.value.map((item) => ({ ...item }))
    for (const ingredient of ingredients) {
      const key = ingredient.name.toLowerCase() + '|' + ingredient.unit
      const qty = roundQty(ingredient.qty * factor)
      const existing = next.find((item) => item.key === key)
      if (existing) {
        existing.qty = roundQty(existing.qty + qty)
        existing.checked = false
      } else {
        next.push({ key, name: ingredient.name, unit: ingredient.unit, qty, checked: false })
      }
    }
    items.value = next
    return ingredients.length
  }
${shoppingStoreTail}`

const shoppingPageVue = `<script setup>
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useShoppingStore } from './shopping.js'
import { formatIngredient } from '../recipes/format.js'

const shopping = useShoppingStore()
const { items, remaining } = storeToRefs(shopping)
</script>

<template>
  <section aria-labelledby="shopping-title">
    <h1 id="shopping-title" class="page-title">Shopping list</h1>
    <template v-if="items.length">
      <p class="muted">{{ remaining }} of {{ items.length }} left to buy</p>
      <ul class="shopping-list">
        <li v-for="item in items" :key="item.key" class="shopping-item" :class="{ 'is-checked': item.checked }">
          <label>
            <input type="checkbox" class="shopping-check" :checked="item.checked" @change="shopping.toggle(item.key)" />
            <span class="shopping-label">{{ formatIngredient(item) }}</span>
          </label>
        </li>
      </ul>
      <button type="button" class="btn clear-checked" :disabled="remaining === items.length" @click="shopping.clearChecked()">
        Remove ticked items
      </button>
    </template>
    <div v-else class="shopping-empty">
      <p>Your list is empty. Open a recipe and choose “Add ingredients to shopping list”.</p>
      <RouterLink :to="{ name: 'recipes' }">Browse recipes</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.muted { color: var(--muted); margin-top: 0; }
.shopping-list { list-style: none; margin: 0 0 12px; padding: 0; max-width: 480px; }
.shopping-item label { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--line); cursor: pointer; }
.shopping-check { width: 18px; height: 18px; accent-color: var(--accent); }
.is-checked .shopping-label { color: var(--muted); text-decoration: line-through; }
.shopping-empty { padding: 24px; border: 1px dashed var(--line); border-radius: 12px; color: var(--muted); }
</style>`

const notFoundVue = `<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found">
    <h1 class="page-title">Page not found</h1>
    <p>That page doesn't exist — maybe the link is old.</p>
    <RouterLink :to="{ name: 'recipes' }">Back to the recipes</RouterLink>
  </section>
</template>`

const sharedFiles = {
  'main.js': mainJs,
  'App.vue': appVue,
  'styles.css': stylesCss,
  'shared/components/AsyncState.vue': asyncStateVue,
  'shared/components/ToastRegion.vue': toastRegionVue,
  'shared/stores/toasts.js': toastsStoreJs,
  'shared/composables/useAsync.js': useAsyncJs,
  'features/recipes/api.js': recipesApiJs,
  'features/recipes/format.js': formatJs,
  'features/recipes/RecipeCard.vue': recipeCardVue,
  'features/recipes/RecipeDetailPage.vue': recipeDetailVue,
  'features/favorites/favorites.js': favoritesStoreJs,
  'features/favorites/FavoriteButton.vue': favoriteButtonVue,
  'features/favorites/FavoritesPage.vue': favoritesPageVue,
  'features/shopping/ShoppingListPage.vue': shoppingPageVue,
  'NotFoundPage.vue': notFoundVue,
}

// ---------------------------------------------------------------- interview coding question

const titleStarter = `import { watchEffect, toValue } from 'vue'

// Keeps document.title in sync with title (a ref, getter or string), with a
// " · Recipe Box" suffix, and restores the previous title when disposed.
export function usePageTitle(title) {
  watchEffect(() => {
    document.title = toValue(title)
  })
}
`

const titleSolution = `import { watchEffect, toValue, onScopeDispose } from 'vue'

// Keeps document.title in sync with title (a ref, getter or string), with a
// " · Recipe Box" suffix, and restores the previous title when disposed.
export function usePageTitle(title) {
  const previous = document.title

  watchEffect(() => {
    const text = toValue(title)
    document.title = text ? text + ' · Recipe Box' : 'Recipe Box'
  })

  onScopeDispose(() => {
    document.title = previous
  })
}
`

const titleApp = `<script setup>
import { ref } from 'vue'
import { usePageTitle } from './usePageTitle.js'

const recipe = ref('Shakshuka')
usePageTitle(() => recipe.value)
</script>

<template>
  <input v-model="recipe" aria-label="Recipe name" />
</template>`

const titleScope = `const { effectScope, ref, nextTick: tick } = requireModule('vue')
const { usePageTitle } = requireModule('usePageTitle.js')
document.title = 'Before'
const name = ref('Shakshuka')
const scope = effectScope()
scope.run(() => usePageTitle(() => name.value))`

const go = (path) => `await requireModule('app/router.js').default.push('${path}')
await wait(30)`

export default {
  id: 'project-production-app',
  kind: 'project',
  title: 'Project 9: Production-Style App',
  summary: 'Combine everything into a feature-based app — lazy routes, persisted Pinia stores, composables, reusable components, error boundaries, accessible navigation, tests, performance and a deployment setup.',
  difficulty: 'advanced',
  minutes: 180,
  prerequisites: ['project-structure', 'lazy-routes-scroll', 'pinia-production', 'composable-design', 'e2e-and-quality', 'production-readiness'],
  related: ['error-handling', 'service-layers', 'bundle-optimization', 'accessibility-fundamentals', 'testing-logic', 'api-production', 'project-admin-dashboard', 'project-realtime-dashboard'],
  tags: ['project', 'production', 'architecture', 'feature folders', 'lazy routes', 'pinia plugin', 'persistence', 'error boundary', 'onErrorCaptured', 'accessibility', 'testing', 'deployment', 'performance'],
  apis: [
    { name: 'pinia.use(plugin)', summary: 'Pinia: adds a plugin to every store; custom store options (like persist) are available to it.' },
    { name: 'onErrorCaptured()', summary: 'Vue: catches errors from descendant components; return false to stop propagation.' },
    { name: 'app.config.errorHandler', summary: 'Vue: global handler for errors no component handled.' },
    { name: 'component: () => import(…)', summary: 'Vue Router: a lazy route; the page becomes its own chunk, loaded on first visit.' },
    { name: 'toValue()', summary: 'Vue 3.3+: normalises a ref, getter or plain value — handy for flexible composable arguments.' },
  ],
  docs: [
    { label: 'Vue Guide — Production Deployment', url: 'https://vuejs.org/guide/best-practices/production-deployment.html' },
    { label: 'Vue Guide — Performance', url: 'https://vuejs.org/guide/best-practices/performance.html' },
    { label: 'Vue Guide — Accessibility', url: 'https://vuejs.org/guide/best-practices/accessibility.html' },
    { label: 'Vue Guide — Testing', url: 'https://vuejs.org/guide/scaling-up/testing.html' },
    { label: 'Vue API — onErrorCaptured()', url: 'https://vuejs.org/api/composition-api-lifecycle.html#onerrorcaptured' },
    { label: 'Pinia — Plugins', url: 'https://pinia.vuejs.org/core-concepts/plugins.html' },
    { label: 'Vue Router — Lazy Loading Routes', url: 'https://router.vuejs.org/guide/advanced/lazy-loading.html' },
    { label: 'Vite — Deploying a Static Site', url: 'https://vite.dev/guide/static-deploy.html' },
  ],

  intro: `
This is the capstone. *Recipe Box* is a small app — browse and search recipes, scale servings, save favorites, build a shopping list — built the way a professional team would build a large one:

- **feature folders** (\`features/recipes\`, \`features/favorites\`, \`features/shopping\`) plus a \`shared/\` layer,
- **Vue Router** with lazy-loaded pages, page titles and a 404,
- **Pinia** stores that persist themselves through a small **plugin**,
- **composables** for async data (with cancellation) and debouncing,
- **reusable components** for request states, toasts and error boundaries,
- **accessibility** for single-page navigation: route announcements, focus management, skip link,
- and the parts that only exist in real projects: **tests**, **performance** choices and a **deployment** setup.

None of the pieces is new — you have built each of them in earlier projects. The new skill is *combining* them so the codebase stays easy to change.
`,

  why: `
Small apps fail in small ways. Production apps fail in structural ways:

- Everything lives in \`components/\` and nobody knows which files belong to which feature.
- Every page fetches data differently, so loading and error states are inconsistent.
- One component throws and the **whole screen goes blank**.
- A keyboard or screen-reader user clicks a link and is never told the page changed.
- The first download includes every page, so the landing page is slow.
- It works on \`localhost\` and returns 404 on refresh after deployment.

This project addresses each of these with a pattern you can reuse — and it shows the scaffolding around the code (test runner, CI, build and hosting configuration) as static examples, because the sandbox can't run them.
`,

  eli15: `
Think of a restaurant kitchen. A food truck can have one cook doing everything. A real restaurant has **stations** — pastry, grill, salads — each with its own tools, and a shared pantry everyone uses. That's *feature folders* plus a *shared* folder.

The restaurant also has systems: a **pass** where every plate is checked before it goes out (*tests*), a **fire blanket** so one flaming pan doesn't burn the whole kitchen down (*error boundary*), a **menu that tells guests what they're looking at** (*page titles and announcements*), and ingredients that are only fetched from the cold room **when a dish is ordered** (*lazy-loaded pages*).

Finally, the restaurant has to actually **open its doors** in a real building with the right signs and a working entrance (*deployment*). A great kitchen that customers can't get into is no restaurant.
`,

  analogy: {
    title: 'From food truck to restaurant kitchen',
    body: `
The recipes don't change when a food truck becomes a restaurant — the organisation does. Stations own their work, the pantry is shared, there are checks before food leaves, safety equipment for when things go wrong, and procedures for opening every day.
`,
    mapping: [
      ['stations (pastry, grill…)', '`features/recipes`, `features/favorites`, `features/shopping`'],
      ['the shared pantry', '`shared/` composables, components and stores'],
      ['checking every plate at the pass', 'unit, component and end-to-end tests in CI'],
      ['a fire blanket at each station', '`<ErrorBoundary>` with `onErrorCaptured`'],
      ['fetching from the cold room only when ordered', 'lazy routes: `() => import(\'…\')`'],
      ['opening the doors every morning', 'build, hosting config with SPA fallback, CI/CD'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The architecture of Recipe Box',
    caption: 'Features own their pages, stores and API; shared code is generic; the app layer wires routing, plugins and the layout together.',
    alt: 'Diagram of the app layers. main.js creates the app, installs Pinia with the persistence plugin and the router, and sets a global error handler. The router lazy-loads feature pages into AppLayout, which provides the skip link, route announcer, focus management, an ErrorBoundary around the router view and the toast region. Feature folders (recipes, favorites, shopping) contain pages, components, stores and the recipes API. The shared layer provides useAsync, useDebouncedRef, AsyncState, ErrorBoundary and the toasts store. Stores marked with persist are saved to localStorage by the plugin.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'main', label: 'main.js', note: 'errorHandler · pinia + persistPlugin · router', tone: 'ink' },
        { id: 'router', label: 'app/router.js', note: 'lazy pages · meta.title · 404', tone: 'cobalt' },
        { id: 'layout', label: 'AppLayout', note: 'announcer · focus · ErrorBoundary · toasts', tone: 'acid' },
        { id: 'features', label: 'features/*', note: 'recipes · favorites · shopping', tone: 'paper' },
        { id: 'shared', label: 'shared/*', note: 'useAsync · useDebouncedRef · AsyncState', tone: 'kraft' },
        { id: 'storage', label: 'persistPlugin → localStorage', note: 'stores opt in with { persist }', tone: 'red' },
      ],
      edges: [
        { from: 'main', to: 'router', label: 'app.use' },
        { from: 'router', to: 'layout', label: '<RouterView>' },
        { from: 'layout', to: 'features', label: 'renders pages' },
        { from: 'features', to: 'shared', label: 'imports' },
        { from: 'main', to: 'storage', label: 'pinia.use', dashed: true },
        { from: 'features', to: 'storage', id: 'stores-persist', label: 'favorites · shopping', dashed: true },
      ],
      steps: [
        { focus: ['main', 'router', 'storage'], edges: ['main->router', 'main->storage'], text: '`main.js` assembles the app: a global error handler, Pinia with a persistence plugin, and the router. Nothing feature-specific lives here.' },
        { focus: ['router', 'layout'], edges: ['router->layout'], text: 'The router lazy-loads pages and labels each with `meta.title`. `AppLayout` announces the new page, moves focus to `<main>` and wraps the view in an error boundary.' },
        { focus: ['layout', 'features', 'shared'], edges: ['layout->features', 'features->shared'], text: 'Each feature folder owns its pages, components, store and API. Features depend on `shared/`, never the other way round.' },
        { focus: ['features', 'storage'], edges: ['stores-persist'], text: 'Stores opt into persistence with a `persist` option; one plugin handles reading, validating and saving for all of them.' },
      ],
    },
  },

  requirements: [
    'Structure: `main.js` and `App.vue` at the root, `app/` (router, layout, Pinia plugin), `features/recipes|favorites|shopping`, and `shared/` (components, composables, stores). `App.vue` only renders `AppLayout`.',
    'Routing (`app/router.js`, exports `routes` and the router): `/` (recipes, eager), `/recipes/:slug`, `/favorites`, `/shopping-list` and a catch-all 404 (`.not-found`) — all non-landing pages **lazy-loaded**, each route with `meta.title`; `document.title` is updated after navigation.',
    'Recipes page: `.search-input` filters by name or ingredient **after a 250 ms pause** and writes `?q=` to the URL; tag links (`.tag-vegetarian`, `.tag-quick`, …) set `?tag=` (`aria-current="true"` when active). Opening a URL with `?q=` / `?tag=` restores the filters. Results are `.recipe-card`s; request states use `AsyncState` (`.async-loading`, `.async-error` with `.async-retry`, `.async-empty`).',
    '`useDebouncedRef(source, delay)` in `shared/composables/useDebouncedRef.js` returns a ref that follows `source` only after `delay` ms without changes, and clears its timer when its scope is disposed.',
    'Favorites: `.favorite-btn` toggles (`aria-pressed`), updates `.favorites-count` in the header and shows a `.toast`. The Favorites page lists saved recipes.',
    'Recipe page: `.servings-dec` / `.servings-inc` / `.servings-value` scale the `.ingredient` list; `.add-to-list` adds the **scaled** ingredients to the shopping list, **merging** items with the same name and unit. Shopping list: `.shopping-item`s with `.shopping-check`, `.clear-checked`, header count `.shopping-count` (items left).',
    'Persistence: `app/persistPlugin.js` exports `persistPlugin`; stores opt in with `{ persist: { key, pick, validate } }` (favorites → `recipe-box.favorites.v1`, shopping → `recipe-box.shopping.v1`). Saved data is validated before use.',
    'Resilience & accessibility: `ErrorBoundary` catches errors from its content (`.error-boundary`, `role="alert"`, `.error-retry` re-mounts); after each **path** change the layout announces "<title> page" in `.route-announcer` and focuses `<main id="main">`; a skip link and toasts in a polite live region.',
  ],

  objectives: [
    'Organise a Vue app by feature, with an app layer for wiring and a shared layer for generic code.',
    'Combine lazy routes, route meta, global error handling and error boundaries into a resilient shell.',
    'Write reusable composables (`useAsync`, `useDebouncedRef`) and components (`AsyncState`, `ErrorBoundary`, toasts) with clean APIs and cleanup.',
    'Extend Pinia with a plugin and custom store options, and persist state safely.',
    'Make client-side navigation accessible: route announcements, focus management, skip links.',
    'Plan testing, performance and deployment: what to test where, what to lazy-load, and how to host a history-mode SPA.',
  ],

  playground: {
    title: 'Recipe Box — starter',
    objective: 'The shared building blocks and most features work. Finish the production concerns: lazy routes and a 404, URL-driven debounced search, the persistence plugin, the shopping-list merge, the error boundary and accessible navigation.',
    files: {
      ...sharedFiles,
      'app/router.js': starterRouterJs,
      'app/persistPlugin.js': starterPersistJs,
      'app/AppLayout.vue': starterLayoutVue,
      'shared/components/ErrorBoundary.vue': starterErrorBoundaryVue,
      'shared/composables/useDebouncedRef.js': starterDebounceJs,
      'features/recipes/RecipesPage.vue': starterRecipesPageVue,
      'features/shopping/shopping.js': starterShoppingStoreJs,
    },
    expected: 'The starter browses recipes, toggles favorites and builds a shopping list, but search fires a request per keystroke and isn\'t in the URL, every page is in the initial bundle, unknown URLs render nothing, favorites vanish on reload, the shopping list duplicates ingredients and ignores servings, an error in a page blanks the screen, and navigation is silent for screen readers.',
    tests: [
      {
        name: 'the landing page loads recipes through AsyncState',
        code: `expect(exists('.async-loading')).toBe(true)
await wait(250)
expect(findAll('.recipe-card')).toHaveLength(8)
expect(text('.result-count')).toBe('8 recipes')`,
      },
      {
        name: 'useDebouncedRef waits for a pause and cleans up',
        code: `const { effectScope, ref } = requireModule('vue')
const { useDebouncedRef } = requireModule('shared/composables/useDebouncedRef.js')
const source = ref('a')
const scope = effectScope()
const debounced = scope.run(() => useDebouncedRef(source, 80))
source.value = 'ab'
await nextTick()
source.value = 'abc'
await nextTick()
expect(debounced.value).toBe('a')
await wait(120)
expect(debounced.value).toBe('abc')
source.value = 'abcd'
await nextTick()
scope.stop()
await wait(120)
expect(debounced.value).toBe('abc')`,
      },
      {
        name: 'search is debounced, sent once, and written to the URL',
        code: `const api = requireModule('features/recipes/api.js')
const router = requireModule('app/router.js').default
await wait(250)
const before = api.stats.list
await type('.search-input', 'r')
await type('.search-input', 'ri')
await type('.search-input', 'rice')
await wait(100)
expect(api.stats.list).toBe(before)
await wait(450)
expect(router.currentRoute.value.query).toEqual({ q: 'rice' })
expect(api.stats.list).toBe(before + 1)
expect(findAll('.recipe-card')).toHaveLength(3)`,
      },
      {
        name: 'a shared URL restores the search and tag filters',
        code: `${go('/?q=rice&tag=vegetarian')}
await wait(250)
expect(find('.search-input').value).toBe('rice')
expect(attr('.tag-vegetarian', 'aria-current')).toBe('true')
expect(findAll('.recipe-card')).toHaveLength(2)
await click('.tag-quick')
await wait(250)
expect(requireModule('app/router.js').default.currentRoute.value.query).toEqual({ q: 'rice', tag: 'quick' })
expect(findAll('.recipe-card')).toHaveLength(1)`,
      },
      {
        name: 'a failed request shows an error with a working retry',
        code: `await wait(250)
requireModule('features/recipes/api.js').simulate.failNext = true
await click('.tag-baking')
await wait(250)
expect(exists('.async-error')).toBe(true)
expect(attr('.async-error', 'role')).toBe('alert')
await click('.async-retry')
await wait(250)
expect(findAll('.recipe-card')).toHaveLength(1)`,
      },
      {
        name: 'non-landing pages are lazy; unknown URLs show a 404',
        code: `const { routes } = requireModule('app/router.js')
for (const name of ['recipe', 'favorites', 'shopping']) {
  expect(typeof routes.find((r) => r.name === name).component).toBe('function')
}
${go('/this/does/not/exist')}
expect(exists('.not-found')).toBe(true)
expect(document.title).toContain('Page not found')`,
      },
      {
        name: 'navigation is announced and focus moves to the content',
        code: `await click('.nav-favorites')
await wait(50)
expect(text('.route-announcer')).toBe('Favorites page')
expect(document.activeElement && document.activeElement.id).toBe('main')`,
      },
      {
        name: 'favorites: toggle, header count, toast and favorites page',
        code: `await wait(250)
const button = find('.favorite-btn')
expect(attr('.favorite-btn', 'aria-pressed')).toBe('false')
await click(button)
expect(button.getAttribute('aria-pressed')).toBe('true')
expect(text('.favorites-count')).toBe('1')
expect(text('.toast')).toContain('Saved')
await click('.toast-dismiss')
expect(exists('.toast')).toBe(false)
await click('.nav-favorites')
await wait(250)
expect(findAll('.recipe-card')).toHaveLength(1)
expect(text('.recipe-card')).toContain('Tomato & basil pasta')`,
      },
      {
        name: 'favorites are saved by the plugin and restored in a fresh Pinia',
        code: `await wait(250)
await click('.favorite-btn')
await flush()
const saved = JSON.parse(localStorage.getItem('recipe-box.favorites.v1'))
expect(saved).toEqual({ ids: ['tomato-basil-pasta'] })
// Simulate a reload: a new app + Pinia with the plugin installed
const { createApp } = requireModule('vue')
const { createPinia } = requireModule('pinia')
const { persistPlugin } = requireModule('app/persistPlugin.js')
const pinia = createPinia()
pinia.use(persistPlugin)
createApp({ render: () => null }).use(pinia)
const favorites = requireModule('features/favorites/favorites.js').useFavoritesStore()
expect(favorites.has('tomato-basil-pasta')).toBe(true)`,
      },
      {
        name: 'invalid saved data is ignored',
        code: `localStorage.setItem('recipe-box.favorites.v1', JSON.stringify({ ids: 'not-a-list' }))
const { createApp } = requireModule('vue')
const { createPinia } = requireModule('pinia')
const { persistPlugin } = requireModule('app/persistPlugin.js')
const pinia = createPinia()
pinia.use(persistPlugin)
createApp({ render: () => null }).use(pinia)
const favorites = requireModule('features/favorites/favorites.js').useFavoritesStore()
expect(favorites.count).toBe(0)`,
      },
      {
        name: 'servings scale ingredients; the shopping list merges duplicates',
        code: `${go('/recipes/tomato-basil-pasta')}
await wait(250)
expect(text('.servings-value')).toBe('2')
await click('.servings-inc')
await click('.servings-inc')
expect(text('.ingredient')).toBe('400 g spaghetti')
await click('.add-to-list')
expect(text('.toast')).toContain('Added 5 ingredients')
${go('/recipes/mushroom-risotto')}
await wait(250)
await click('.add-to-list')
${go('/shopping-list')}
await wait(30)
const labels = findAll('.shopping-label').map((el) => el.textContent.trim())
expect(labels).toHaveLength(10)
expect(labels).toContain('6 tbsp olive oil')
expect(text('.shopping-count')).toBe('10')
await check('.shopping-check', true)
expect(text('.shopping-count')).toBe('9')
await click('.clear-checked')
expect(findAll('.shopping-item')).toHaveLength(9)`,
      },
      {
        name: 'ErrorBoundary contains a crash and can retry',
        code: `const { createApp, h } = requireModule('vue')
const ErrorBoundary = requireModule('shared/components/ErrorBoundary.vue').default
let broken = true
const Flaky = {
  setup() {
    return () => {
      if (broken) throw new Error('Recipe data was malformed')
      return h('p', { class: 'flaky-ok' }, 'Recovered')
    }
  },
}
const host = document.createElement('div')
document.getElementById('app').appendChild(host)
createApp({ render: () => h(ErrorBoundary, null, { default: () => h(Flaky) }) }).mount(host)
await flush()
expect(host.querySelector('.error-boundary')).toBeTruthy()
expect(host.querySelector('.error-boundary').getAttribute('role')).toBe('alert')
broken = false
await click(host.querySelector('.error-retry'))
expect(host.querySelector('.flaky-ok')).toBeTruthy()`,
      },
    ],
  },

  steps: [
    {
      title: 'Organise by feature, wire in the app layer',
      body: [
        `
Open the file tree. It is organised by **what the code is for**, not by what kind of file it is ([feature-based structure](lesson:project-structure)):

\`\`\`text
main.js                 creates the app, installs plugins
App.vue                 renders AppLayout — nothing else
app/                    wiring: router.js, AppLayout.vue, persistPlugin.js
features/
  recipes/              api.js, format.js, RecipesPage, RecipeDetailPage, RecipeCard
  favorites/            favorites.js (store), FavoriteButton, FavoritesPage
  shopping/             shopping.js (store), ShoppingListPage
shared/
  components/           AsyncState, ErrorBoundary, ToastRegion
  composables/          useAsync, useDebouncedRef
  stores/               toasts.js
\`\`\`

Rules that keep this healthy as the app grows:

- **Features own their code.** Deleting \`features/shopping\` should remove the shopping feature, not break unrelated screens.
- **Dependencies point one way:** \`features → shared\`, never \`shared → features\`. Shared code knows nothing about recipes.
- **Cross-feature use goes through public pieces** (a store, a component) — here, \`RecipeDetailPage\` uses the shopping store's \`addIngredients\` action rather than editing its state.
- **\`App.vue\` and \`main.js\` stay small.** They assemble; they don't implement.

\`main.js\` sets \`app.config.errorHandler\` — the last line of defence for errors no component caught ([error handling](lesson:error-handling)). In production that handler reports to a monitoring service.
`,
      ],
    },
    {
      title: 'Routing: lazy pages, titles and a 404',
      body: [
        `
Only the landing page is imported eagerly. Everything else becomes a **separate chunk**, downloaded the first time someone visits it — so the first load only contains what the first screen needs ([lazy routes](lesson:lazy-routes-scroll), [bundle optimisation](lesson:bundle-optimization)):
`,
        {
          code: `export const routes = [
  { path: '/', name: 'recipes', component: RecipesPage, meta: { title: 'Recipes' } },
  {
    path: '/recipes/:slug',
    name: 'recipe',
    component: () => import('../features/recipes/RecipeDetailPage.vue'),
    props: true,
    meta: { title: 'Recipe' },
  },
  { path: '/favorites', name: 'favorites', component: () => import('../features/favorites/FavoritesPage.vue'), meta: { title: 'Favorites' } },
  { path: '/shopping-list', name: 'shopping', component: () => import('../features/shopping/ShoppingListPage.vue'), meta: { title: 'Shopping list' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../NotFoundPage.vue'), meta: { title: 'Page not found' } },
]

router.afterEach((to) => {
  document.title = (to.meta.title ? to.meta.title + ' · Recipe Box' : 'Recipe Box')
})`,
          lang: 'js',
          title: 'app/router.js',
        },
        `
\`meta.title\` does triple duty: the browser tab title, the route announcement for screen readers (step 6), and a readable label in analytics.

In production, two things change — shown here as static code because the sandbox has no address bar:
`,
        {
          code: `import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  // BASE_URL comes from Vite's \`base\` option, so the app also works under a sub-path
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // Restore the scroll position on back/forward, otherwise start at the top
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})`,
          lang: 'js',
          title: 'app/router.js — production',
          static: true,
        },
      ],
    },
    {
      title: 'One way to fetch: useAsync + AsyncState',
      body: [
        `
Every page needs the same four request states. Instead of re-inventing them per page, the app has **one composable and one component** (the patterns from [Project 4](lesson:project-api-explorer), generalised):
`,
        {
          code: `export function useAsync(fn) {
  const data = shallowRef(null)
  const error = shallowRef(null)
  const status = ref('idle')
  let controller = null
  let lastArgs = []

  async function execute(...args) {
    lastArgs = args
    controller?.abort()                 // latest call wins
    const current = new AbortController()
    controller = current
    status.value = 'loading'
    error.value = null
    try {
      const result = await fn(...args, { signal: current.signal })
      if (current !== controller) return
      data.value = result
      status.value = 'success'
    } catch (err) {
      if (current !== controller || err.name === 'AbortError') return
      error.value = err
      status.value = 'error'
    }
  }

  onScopeDispose(() => controller?.abort()) // leaving the page cancels the request
  return { data, error, status, execute, retry: () => execute(...lastArgs) }
}`,
          lang: 'js',
          title: 'shared/composables/useAsync.js',
        },
        `
\`AsyncState\` renders the right thing for each status and emits \`retry\`; pages provide the success content (default slot) and an optional empty message:
`,
        {
          code: `<AsyncState :status="status" :error="error" :empty="data !== null && data.length === 0" @retry="retry">
  <template #empty>No recipes match your search.</template>
  <ul class="recipe-grid">…</ul>
</AsyncState>`,
          lang: 'vue',
        },
        `
Consistency is the point: every page has the same accessible loading (\`role="status"\`), error (\`role="alert"\` + retry) and empty behaviour, and fixing a bug in one place fixes it everywhere.
`,
      ],
    },
    {
      title: 'URL-driven, debounced search',
      body: [
        `
First the small, reusable piece — a debounced ref ([composable design](lesson:composable-design)):
`,
        {
          code: `import { ref, readonly, watch, toValue, onScopeDispose } from 'vue'

export function useDebouncedRef(source, delay = 250) {
  const debounced = ref(toValue(source))
  let timer = null

  watch(source, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  onScopeDispose(() => clearTimeout(timer))
  return readonly(debounced)
}`,
          lang: 'js',
          title: 'shared/composables/useDebouncedRef.js',
        },
        `
It accepts a ref *or* a getter thanks to \`toValue()\` (Vue 3.3+), returns a **read-only** ref (only the composable may write it), and clears its timer when the owning scope is disposed.

Then make the URL the source of truth for the filters (as in [Project 6](lesson:project-admin-dashboard)):
`,
        {
          code: `const queryText = computed(() => (typeof route.query.q === 'string' ? route.query.q : ''))
const tag = computed(() => (TAGS.includes(route.query.tag) ? route.query.tag : ''))

const search = ref(queryText.value)                 // what the user is typing
const debouncedSearch = useDebouncedRef(search, 250)
watch(debouncedSearch, (q) => {
  const trimmed = q.trim()
  if (trimmed !== queryText.value) router.replace({ query: queryFor({ q: trimmed }) })
})
watch(queryText, (q) => {                            // URL changed from outside
  if (q !== search.value.trim()) search.value = q
})

const { data, error, status, execute, retry } = useAsync(listRecipes)
watch([queryText, tag], ([q, t]) => execute({ q, tag: t }), { immediate: true })`,
          lang: 'js',
          title: 'features/recipes/RecipesPage.vue',
        },
        `
Data flows in one direction: **typing → (debounce) → URL → fetch**. Tag filters become \`<RouterLink :to="{ query: queryFor({ t }) }">\` with \`aria-current\` — real links, so they can be opened in a new tab and shared. Invalid tags in the URL are simply ignored.
`,
      ],
    },
    {
      title: 'Shared state that persists: a Pinia plugin',
      body: [
        `
Two stores need persistence, and more will. Instead of copying save/load code into each, write it once as a **Pinia plugin** and let stores opt in with a custom option ([Pinia in production](lesson:pinia-production)):
`,
        {
          code: `export const useFavoritesStore = defineStore(
  'favorites',
  () => { /* ids, count, has, toggle */ },
  {
    persist: {
      key: 'recipe-box.favorites.v1',
      pick: ['ids'],
      validate: (saved) => Array.isArray(saved.ids) && saved.ids.every((id) => typeof id === 'string'),
    },
  },
)`,
          lang: 'js',
          title: 'features/favorites/favorites.js',
        },
        {
          code: `export function persistPlugin({ store, options }) {
  const config = options.persist
  if (!config) return

  try {
    const saved = JSON.parse(localStorage.getItem(config.key) ?? 'null')
    if (saved && typeof saved === 'object' && (!config.validate || config.validate(saved))) {
      store.$patch(pickKeys(saved, config.pick))
    }
  } catch (error) {
    console.warn('[persist] ignoring unreadable data for "' + config.key + '":', error.message)
  }

  store.$subscribe(
    (mutation, state) => {
      try {
        localStorage.setItem(config.key, JSON.stringify(pickKeys(state, config.pick)))
      } catch (error) {
        console.warn('[persist] could not save "' + config.key + '":', error.message)
      }
    },
    { detached: true },
  )
}`,
          lang: 'js',
          title: 'app/persistPlugin.js',
        },
        `
- **Setup stores pass custom options as the third argument** of \`defineStore\`; the plugin reads them from \`options\`.
- **\`pick\`** saves only what's needed; **\`validate\`** treats saved data as untrusted input; the versioned key (\`.v1\`) leaves room for migrations.
- **\`{ detached: true }\`** keeps the subscription alive even if the component that first used the store unmounts.
- Plugins apply to stores created after \`pinia.use()\` — and only once the Pinia instance is installed in an app (\`app.use(pinia)\`).

Then fix the shopping store's \`addIngredients\`: scale each quantity by the servings factor and **merge** items with the same name and unit, building a new array:
`,
        {
          code: `function addIngredients(ingredients, factor = 1) {
  const next = items.value.map((item) => ({ ...item }))
  for (const ingredient of ingredients) {
    const key = ingredient.name.toLowerCase() + '|' + ingredient.unit
    const qty = roundQty(ingredient.qty * factor)
    const existing = next.find((item) => item.key === key)
    if (existing) {
      existing.qty = roundQty(existing.qty + qty)
      existing.checked = false
    } else {
      next.push({ key, name: ingredient.name, unit: ingredient.unit, qty, checked: false })
    }
  }
  items.value = next
  return ingredients.length
}`,
          lang: 'js',
          title: 'features/shopping/shopping.js',
        },
      ],
    },
    {
      title: 'Resilience and accessible navigation',
      body: [
        `
**Error boundaries.** Without one, an error thrown while rendering a page propagates up and Vue's global handler logs it — but the broken part of the screen can be left empty. An error boundary catches errors from its descendants and shows a fallback instead:
`,
        {
          code: `const error = ref(null)
const resetKey = ref(0)

onErrorCaptured((err, instance, info) => {
  error.value = err
  console.error('[ErrorBoundary]', err.message, '(' + info + ')')
  return false // handled: stop propagation
})

function retry() {
  error.value = null
  resetKey.value++ // re-mount the content from scratch
}`,
          lang: 'js',
          title: 'shared/components/ErrorBoundary.vue',
        },
        `
The layout wraps the router view in it, keyed by path — \`<ErrorBoundary :key="route.path">\` — so navigating away from a crashed page starts fresh. \`onErrorCaptured\` catches errors from descendants' render functions, lifecycle hooks, watchers and event handlers that Vue invokes; it does not catch errors in your own unawaited promises or \`setTimeout\` callbacks.

**Route announcements and focus.** In a single-page app, clicking a link swaps content without loading a new document, so screen readers may announce nothing and keyboard focus stays on the link. Fix both after each *path* change ([accessibility fundamentals](lesson:accessibility-fundamentals)):
`,
        {
          code: `watch(
  () => route.path,
  () => {
    announcement.value = (route.meta.title ?? 'New') + ' page'
    nextTick(() => mainEl.value?.focus())
  },
)`,
          lang: 'js',
          title: 'app/AppLayout.vue',
        },
        {
          code: `<a href="#main" class="skip-link">Skip to content</a>
<!-- … header … -->
<p class="route-announcer visually-hidden" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
<main id="main" ref="mainEl" class="main" tabindex="-1">
  <ErrorBoundary :key="route.path"><RouterView /></ErrorBoundary>
</main>
<ToastRegion />`,
          lang: 'vue',
        },
        `
**Toasts** live in a store any feature can call (\`toasts.push(message)\`) and render in a region that is *always* in the DOM with \`role="status"\` — live regions must exist before content is added, or screen readers may miss it. They are limited to three, auto-dismiss, and can be dismissed by keyboard.
`,
      ],
    },
    {
      title: 'Testing strategy',
      body: [
        `
The playground tests are this app's test suite, and they deliberately cover three levels ([testing fundamentals](lesson:testing-fundamentals), [E2E & quality](lesson:e2e-and-quality)):

| Level | Here | Real tools |
|---|---|---|
| **Unit** — pure logic and composables | \`useDebouncedRef\` in an \`effectScope\`; the persistence plugin with a fresh Pinia | Vitest |
| **Component** — one component in isolation | \`ErrorBoundary\` mounted with a crashing child | Vitest + Vue Test Utils |
| **Integration / E2E** — user flows | search → URL → results; servings → shopping list | Playwright or Cypress against the built app |

Test behaviour users and other code rely on (what's rendered, what's in the URL, what's saved), not implementation details. A real project's setup looks like this:
`,
        {
          code: `// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'], // e.g. clear localStorage between tests
  },
})`,
          lang: 'js',
          title: 'vite.config.js (Vitest config)',
          static: true,
        },
        {
          code: `import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { describe, expect, it } from 'vitest'
import FavoriteButton from '@/features/favorites/FavoriteButton.vue'

describe('FavoriteButton', () => {
  it('toggles and exposes its state with aria-pressed', async () => {
    const wrapper = mount(FavoriteButton, {
      props: { slug: 'shakshuka', title: 'Shakshuka' },
      global: { plugins: [createTestingPinia({ stubActions: false })] },
    })
    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('true')
  })
})`,
          lang: 'js',
          title: 'FavoriteButton.spec.js (component test)',
          static: true,
        },
        {
          code: `import { test, expect } from '@playwright/test'

test('a shared search link restores the results', async ({ page }) => {
  await page.goto('/?q=rice&tag=vegetarian')
  await expect(page.getByRole('searchbox', { name: /search/i })).toHaveValue('rice')
  await expect(page.getByRole('article')).toHaveCount(2)
})`,
          lang: 'js',
          title: 'e2e/search.spec.js (Playwright)',
          static: true,
        },
      ],
    },
    {
      title: 'Performance and deployment',
      body: [
        `
**Performance choices already in the app** ([performance](lesson:runtime-performance)):

- lazy-loaded routes keep the initial bundle to the landing page;
- debounced search sends one request per pause, and \`useAsync\` cancels stale ones;
- API data sits in \`shallowRef\`s (replaced wholesale, never deep-proxied);
- \`computed\` caches derived lists such as scaled ingredients and favorites.

Measure before optimising further: Vue Devtools' performance tab, the browser's Performance panel, Lighthouse and Web Vitals in production ([measuring performance](lesson:measuring-performance)). A bundle visualiser shows what each chunk contains.

**Deployment.** \`npm run build\` produces static files in \`dist/\`. Three things trip people up ([production readiness](lesson:production-readiness), [env & production errors](lesson:api-production)):
`,
        {
          code: `# .env.production — Vite exposes only VITE_* variables to client code.
# Everything here ends up in the public JavaScript bundle: NEVER put secrets here.
VITE_API_URL=https://api.recipebox.example`,
          lang: 'bash',
          title: '1. environment variables',
          static: true,
        },
        {
          code: `# History mode needs the server to return index.html for unknown paths,
# otherwise a refresh on /favorites is a 404 from the server.

# Netlify: public/_redirects
/*    /index.html   200

# nginx
location / {
  try_files $uri $uri/ /index.html;
}`,
          lang: 'bash',
          title: '2. SPA fallback for createWebHistory()',
          static: true,
        },
        {
          code: `# .github/workflows/ci.yml — every push is tested and built
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run test -- --run
      - run: npm run build`,
          lang: 'yaml',
          title: '3. continuous integration',
          static: true,
        },
        `
Also set long-lived cache headers for the hashed files in \`dist/assets/\` (their names change when their content changes) and a short or no-cache policy for \`index.html\`, so users always pick up the latest release. If the app lives under a sub-path, set Vite's \`base\` option and use \`createWebHistory(import.meta.env.BASE_URL)\`.
`,
        {
          callout: 'note',
          title: 'Sandbox vs real project',
          text: 'In this sandbox `import.meta.env` only provides `MODE`, `DEV`, `PROD`, `SSR` and `BASE_URL`, and there is no build step — the config files above are for your real project.',
        },
      ],
    },
  ],

  solution: {
    files: {
      ...sharedFiles,
      'app/router.js': routerJs,
      'app/persistPlugin.js': persistJs,
      'app/AppLayout.vue': layoutVue,
      'shared/components/ErrorBoundary.vue': errorBoundaryVue,
      'shared/composables/useDebouncedRef.js': debounceJs,
      'features/recipes/RecipesPage.vue': recipesPageVue,
      'features/shopping/shopping.js': shoppingStoreJs,
    },
    explanation: `
**Structure that scales.** \`main.js\` assembles (error handler, Pinia + plugin, router); \`app/\` wires routing and layout; each \`features/*\` folder owns its pages, components, store and API; \`shared/\` holds generic building blocks with no knowledge of recipes.

**A resilient shell.** Lazy routes with titles and a 404; a global \`errorHandler\` plus a keyed \`ErrorBoundary\` around the router view; toasts in an always-present live region.

**Consistent data handling.** \`useAsync\` (latest-wins, cancellation, retry) and \`AsyncState\` give every page the same loading, error and empty behaviour. Search is URL-driven and debounced by a small, reusable \`useDebouncedRef\`.

**Persistence as infrastructure.** One Pinia plugin reads, validates and saves any store that opts in via a \`persist\` option, so features only declare *what* to persist.

**Accessible navigation.** Skip link, route announcements, focus moved to \`<main>\` on page changes (not on query changes), real links for filters, toggle buttons with \`aria-pressed\`, and reduced-motion support.

**Beyond the sandbox:** the steps show the Vitest, Vue Test Utils and Playwright setup, environment variables, SPA fallback configuration and a CI workflow as static examples. The fake API would become \`fetch(import.meta.env.VITE_API_URL + …)\`, and the error handler would report to a monitoring service.
`,
  },

  challenges: [
    'Add a versioned migration to the persistence plugin (`version` + `migrate(saved, fromVersion)` options) and use it to add a `note` field to shopping items.',
    'Prefetch the recipe page chunk when a user hovers or focuses a recipe link (call the route\'s `component()` loader early).',
    'Use `usePageTitle` (the interview coding question) in the recipe page so the tab shows the recipe\'s name.',
    'Add an "Undo" action to the "Removed from favorites" toast.',
    'Write a Vitest unit test for `addIngredients` covering scaling, merging and rounding.',
    'Add an offline banner using the `online` / `offline` window events, cleaned up with `onScopeDispose`.',
    'Internationalise quantities and dates with `Intl.NumberFormat` and an `i18n` setup — see [internationalization](lesson:i18n).',
  ],

  mistakes: [
    {
      title: 'Organising only by file type',
      wrong: { lang: 'bash', code: `components/  (80 files from every feature)\nstores/      (12 stores)\nviews/       (25 pages)\n# "where does the shopping list live?" — everywhere`, static: true },
      right: { lang: 'bash', code: `features/shopping/  ShoppingListPage.vue  shopping.js\nfeatures/recipes/   RecipesPage.vue  RecipeCard.vue  api.js\nshared/             AsyncState.vue  useAsync.js`, static: true },
      explanation: 'Type-based folders scatter one feature across the tree, so changes touch many folders and ownership is unclear. Group by feature; keep truly generic code in `shared/`.',
    },
    {
      title: 'Importing every page eagerly',
      wrong: { lang: 'js', code: `import FavoritesPage from '../features/favorites/FavoritesPage.vue'\n{ path: '/favorites', component: FavoritesPage }` },
      right: { lang: 'js', code: `{ path: '/favorites', component: () => import('../features/favorites/FavoritesPage.vue') }` },
      explanation: 'Every eager import ends up in the initial bundle, which the landing page must download before it can render. Lazy-load pages that are not needed for the first screen.',
    },
    {
      title: 'Putting secrets in VITE_ variables',
      wrong: { lang: 'bash', code: `VITE_PAYMENT_SECRET_KEY=sk_live_…   # shipped to every browser`, static: true },
      right: { lang: 'bash', code: `VITE_API_URL=https://api.recipebox.example   # public by design\n# secrets live only on the server`, static: true },
      explanation: 'Vite replaces `import.meta.env.VITE_*` with the literal values at build time, so they are readable in the bundle. Client-side code cannot keep secrets.',
    },
    {
      title: 'Deploying history mode without a server fallback',
      wrong: { lang: 'js', code: `createRouter({ history: createWebHistory(), routes })\n// works when navigating inside the app; refresh on /favorites → server 404`, static: true },
      right: { lang: 'bash', code: `# serve index.html for unknown paths\n/*    /index.html   200`, static: true },
      explanation: 'On refresh, the browser asks the server for `/favorites`, which has no such file. The server must return `index.html` so the router can take over (and the app shows its own 404 for unknown routes).',
    },
    {
      title: 'Expecting onErrorCaptured to catch everything',
      wrong: { lang: 'js', code: `onMounted(() => {\n  setTimeout(() => { throw new Error('boom') }) // not caught by the boundary\n})` },
      right: { lang: 'js', code: `onMounted(async () => {\n  await loadData() // async hook errors ARE routed to onErrorCaptured\n})\n// for timers/listeners: try/catch inside them, or report explicitly` },
      explanation: 'Boundaries catch errors from code Vue runs for you (render, hooks, watchers, handlers — including rejected promises they return). Errors in callbacks Vue never sees, like a bare setTimeout, bypass them and reach `window.onerror`.',
    },
  ],

  debugging: [
    {
      symptom: 'Refreshing any page except "/" gives a 404 from the host.',
      cause: 'History mode without an SPA fallback on the server.',
      fix: 'Configure the host to serve `index.html` for unknown paths (or use hash history).',
    },
    {
      symptom: 'A persisted store is not restored, although localStorage contains data.',
      cause: 'The plugin was added after the store was created, the Pinia instance was never installed in an app, or `validate` rejects the saved shape.',
      fix: 'Call `pinia.use(plugin)` before `app.use(pinia)` and before any store is used; log validation failures during development.',
    },
    {
      symptom: 'The search box loses focus while typing.',
      cause: 'Focus management watches `route.fullPath`, which changes with every `?q=` update.',
      fix: 'Watch `route.path` for page changes only.',
    },
    {
      symptom: 'A crash on one page blanks the whole app until reload.',
      cause: 'No error boundary, or the boundary is not keyed, so it stays in its error state on every page.',
      fix: 'Wrap the router view in an `ErrorBoundary` keyed by `route.path`, and give it a retry.',
    },
  ],

  quiz: [
    {
      id: 'project-production-app-q1',
      type: 'mcq',
      prompt: 'Why is only the landing page imported eagerly in `app/router.js`?',
      options: [
        { text: 'Vue Router requires at least one eager route', why: 'All routes could be lazy; there is no such requirement.' },
        { text: 'So the initial bundle only contains what the first screen needs; other pages download on first visit' },
        { text: 'Lazy routes cannot have meta fields', why: 'Lazy routes support meta like any other route.' },
        { text: 'Eager routes are faster to navigate to every time', why: 'After the first visit, a lazy page\'s chunk is cached; the difference is mainly the initial load.' },
      ],
      answer: 1,
      explanation: 'Every eager import is part of the main bundle. Lazy routes split pages into chunks that are loaded on demand, which helps the first load.',
    },
    {
      id: 'project-production-app-q2',
      type: 'output',
      prompt: 'The favorites store state is `{ ids: [\'shakshuka\'], draft: \'x\' }`. With this config, what does the plugin save?',
      code: { lang: 'js', code: `persist: { key: 'recipe-box.favorites.v1', pick: ['ids'] }\n\n// in the plugin\nlocalStorage.setItem(config.key, JSON.stringify(pickKeys(state, config.pick)))` },
      options: ['{"ids":["shakshuka"],"draft":"x"}', '{"ids":["shakshuka"]}', '["shakshuka"]', 'Nothing — pick only affects restoring'],
      answer: 1,
      explanation: '`pickKeys` copies only the listed keys, so `draft` is never written. Persist only what you need.',
    },
    {
      id: 'project-production-app-q3',
      type: 'bug',
      prompt: 'Favorites stop being saved after the user leaves the page where the store was first used. Click the line responsible.',
      code: {
        lang: 'js',
        code: `// FavoritesPage.vue — setup
const favorites = useFavoritesStore()

favorites.$subscribe((mutation, state) => {
  localStorage.setItem('favorites', JSON.stringify(state.ids))
})`,
      },
      answerLine: 4,
      explanation: 'A `$subscribe` created inside a component is removed when that component unmounts. Pass `{ detached: true }` — or, better, move persistence into a plugin or the store so it does not depend on any component.',
    },
    {
      id: 'project-production-app-q4',
      type: 'fill',
      prompt: 'Complete the lazy route and the error boundary hook so the error stops propagating.',
      code: { lang: 'js', code: `{ path: '/favorites', component: () => ___('../features/favorites/FavoritesPage.vue') }\n\nonErrorCaptured((err) => {\n  error.value = err\n  return ___\n})` },
      answer: [['import'], ['false']],
      explanation: 'A function returning a dynamic `import()` makes the route lazy. Returning `false` from `onErrorCaptured` marks the error as handled.',
    },
    {
      id: 'project-production-app-q5',
      type: 'short',
      prompt: 'Why does the layout announce the page title and move focus to `<main>` after navigation?',
      answer: 'Client-side navigation swaps content without loading a new document, so screen readers are not told the page changed and keyboard focus stays on the clicked link. Announcing "<title> page" in a polite live region tells assistive-technology users where they are, and focusing <main> puts keyboard and screen-reader users at the start of the new content.',
    },
  ],

  interview: [
    {
      id: 'project-production-app-architecture',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 5,
      question: 'Walk me through the architecture of your Recipe Box app. Why feature folders, and what goes in `app/` and `shared/`?',
      answer: '`main.js` assembles the app (global error handler, Pinia with a persistence plugin, router). `app/` holds wiring: routes, the layout shell, the plugin. Each `features/*` folder owns its pages, components, store and API module. `shared/` has generic, domain-free building blocks (`useAsync`, `useDebouncedRef`, `AsyncState`, `ErrorBoundary`, toasts). Dependencies point from features to shared, never back. This keeps ownership clear, changes local, and features removable.',
      explanation: 'Group by reason to change; keep the generic layer generic.',
      whyAsked: 'Architecture questions reveal whether you can keep a codebase maintainable as it grows.',
      mistakes: ['Describing folders without explaining dependency rules.', 'Putting domain logic in shared/.', 'Over-engineering a small app with layers it does not need.'],
      followUps: ['How do features communicate?', 'When would you split this into multiple packages?'],
      modelAnswer: 'The root is tiny: main.js wires a global error handler, Pinia with a persistence plugin and the router, and App.vue renders the layout. The app folder holds application-level wiring. Each feature folder owns everything for that feature — pages, components, store and API — so a change to shopping stays inside shopping. Shared contains generic pieces like useAsync, AsyncState and the error boundary, with no knowledge of recipes, and dependencies only point from features to shared. Features talk through public surfaces such as store actions. For a much larger app I would enforce those boundaries with lint rules, and maybe split packages if teams need independent releases.',
    },
    {
      id: 'project-production-app-refresh-404',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After deploying, users can navigate the app fine, but refreshing on `/favorites` shows the host\'s "404 Not Found" page. What happened?',
      answer: 'The app uses `createWebHistory()`. Inside the app the router handles navigation, but a refresh asks the server for `/favorites`, and there is no such file in `dist/`. Configure an SPA fallback so the server returns `index.html` for unknown paths (Netlify `_redirects`, nginx `try_files`, etc.); the client router then renders the right page — or the app\'s own 404.',
      explanation: 'Client-side routes do not exist as files on the server.',
      whyAsked: 'A classic deployment issue that many developers hit once.',
      mistakes: ['Switching to hash mode without understanding the trade-off.', 'Blaming Vue Router.'],
      followUps: ['What are the trade-offs of hash history?', 'How do you handle real 404s then?'],
      modelAnswer: 'With web history, routes like /favorites only exist inside the JavaScript router. Navigation works because the router intercepts it, but a refresh is a real request for /favorites, and the static host has no such file. The fix is an SPA fallback on the server: return index.html for unknown paths so the router can boot and render the page. Unknown app routes then hit my catch-all route and show the app\'s own 404. Hash history avoids server config but gives uglier URLs.',
    },
    {
      id: 'project-production-app-bad-release',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A release changes the shape of saved shopping items. Some users now see a blank shopping page. How do you respond now, and what prevents this next time?',
      answer: 'Now: confirm via error monitoring which error and which users, roll back or ship a hotfix that tolerates old data, and make sure the error boundary shows a recoverable fallback rather than a blank page. Prevention: version persisted data (`.v1` keys or a `version` field) with migrations, validate on load (the plugin\'s `validate`), test migrations with real old payloads, monitor errors in production, and roll out gradually where possible.',
      explanation: 'Client storage is a database you do not control — treat it like one.',
      whyAsked: 'Tests production ownership: incident response plus systemic fixes.',
      mistakes: ['Telling users to clear their storage.', 'Fixing only the symptom.', 'No mention of monitoring.'],
      followUps: ['Where would the migration code live?', 'How would you test it?'],
      modelAnswer: 'First I would look at monitoring to confirm the error and its scope, then either roll back or ship a hotfix that validates saved items and falls back to an empty list instead of crashing, so nobody is stuck. The error boundary should already keep the rest of the app usable. To prevent it, persisted data gets an explicit version and the persistence layer runs migrations on load, with validation rejecting anything unexpected. I would keep fixtures of real old payloads and unit-test every migration, and roll out risky changes gradually.',
    },
    {
      id: 'project-production-app-test-levels',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'What would you unit-test, component-test and end-to-end test in this app, and why not just write E2E tests for everything?',
      answer: 'Unit: pure logic and composables — `addIngredients` scaling/merging, `useDebouncedRef`, the persistence plugin, URL parsing. Component: `ErrorBoundary`, `AsyncState`, `FavoriteButton` (states, events, ARIA). E2E: a few critical journeys — search via a shared URL, recipe → shopping list, favorites surviving reload. E2E tests are slower, more brittle and harder to debug, so they cover key flows; most edge cases are cheaper and more precise at lower levels.',
      explanation: 'Many fast focused tests, a few slow broad ones.',
      whyAsked: 'Shows judgement about test cost and coverage.',
      mistakes: ['Testing implementation details (private refs, CSS classes for styling).', 'Only E2E or only unit tests.', 'Mocking so much that tests prove nothing.'],
      followUps: ['How do you test a component that uses a Pinia store?', 'What makes a test flaky?'],
      modelAnswer: 'I put most tests where they are cheapest and most precise. Pure logic and composables get unit tests: the shopping merge and scaling, the debounced ref with fake time or an effect scope, the persistence plugin with a fresh Pinia. Reusable components get component tests through their public behaviour — rendered output, emitted events and ARIA state. Then a handful of end-to-end tests cover journeys that must never break, like a shared search link and recipe to shopping list. E2E for everything would be slow and flaky, and when one fails it tells you little about where.',
    },
    {
      id: 'project-production-app-performance',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'Product says the app "feels slow" on mobile. How do you approach it without guessing?',
      answer: 'Define slow (first load? navigation? typing?) and measure on a representative device and network: Lighthouse and the Performance panel locally, Web Vitals (LCP, INP, CLS) from real users in production. Then act on findings: bundle analysis and lazy loading for slow first loads; image sizing; preloading or prefetching likely next routes; for slow interactions, profile renders (Vue Devtools), reduce work per keystroke (debounce, computed caching, shallowRef) and virtualise long lists. Re-measure after each change.',
      explanation: 'Measure → change one thing → measure again.',
      whyAsked: 'Distinguishes methodical engineers from those who apply random optimisations.',
      mistakes: ['Quoting made-up numbers.', 'Optimising before measuring.', 'Only testing on a fast laptop.'],
      followUps: ['What does INP measure?', 'How would you set a performance budget?'],
      modelAnswer: 'I would first pin down which kind of slow — first load, navigation or interaction — and measure it on a mid-range phone with throttled network, plus real-user Web Vitals if we collect them. For a slow first load I look at the bundle analysis: lazy-load what is not needed immediately, trim dependencies and size images. For slow interactions I profile with Vue Devtools and the Performance panel and reduce work per update with debouncing, computed caching, shallow state or list virtualisation. I change one thing at a time and re-measure, and I would add a bundle-size budget to CI so it does not regress.',
    },
    {
      id: 'project-production-app-coding-page-title',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `usePageTitle(title)` in `usePageTitle.js`. `title` may be a ref, a getter or a string. Keep `document.title` in sync as **"<title> · Recipe Box"** (just "Recipe Box" when the title is empty), and restore the title that was there before when the owning scope is disposed.',
      starter: { files: { 'App.vue': titleApp, 'usePageTitle.js': titleStarter } },
      tests: [
        {
          name: 'sets the title with a suffix and follows changes',
          code: `${titleScope}
expect(document.title).toBe('Shakshuka · Recipe Box')
name.value = 'Banana bread'
await tick()
expect(document.title).toBe('Banana bread · Recipe Box')
scope.stop()`,
        },
        {
          name: 'an empty title falls back to the app name',
          code: `${titleScope}
name.value = ''
await tick()
expect(document.title).toBe('Recipe Box')
scope.stop()`,
        },
        {
          name: 'restores the previous title when disposed',
          code: `${titleScope}
scope.stop()
expect(document.title).toBe('Before')`,
        },
      ],
      hints: [
        'Remember `document.title` before you change anything.',
        'Use `watchEffect` with `toValue(title)` so refs, getters and strings all work.',
        'Register `onScopeDispose(() => { document.title = previous })`.',
      ],
      answer: 'Save the previous title, use `watchEffect` + `toValue` to write the suffixed title (or the bare app name), and restore the saved title in `onScopeDispose`.',
      solution: { files: { 'App.vue': titleApp, 'usePageTitle.js': titleSolution } },
      explanation: 'A side effect on a global (the document title) needs the same discipline as a socket or a timer: set it reactively, and undo it when the owner goes away. `toValue()` (Vue 3.3+) makes the API flexible.',
      whyAsked: 'Small composable, but it checks flexible inputs, reactivity and cleanup of global side effects.',
      mistakes: ['Only reading the value once (not reactive).', 'Forgetting to restore the previous title.', 'Requiring a ref instead of accepting getters and strings.'],
      followUps: ['What if two components set the title at once?', 'How does this interact with router.afterEach titles?'],
      modelAnswer: 'I capture the current document.title first. A watchEffect reads the title through toValue, so a ref, a getter or a plain string all work, and writes either "title · Recipe Box" or just "Recipe Box" when it is empty. onScopeDispose restores the captured title, so leaving the page undoes the change, and because it uses scope disposal it also works outside components. If several components could set the title, I would keep a stack of requested titles in a small store rather than letting them overwrite each other.',
    },
  ],

  takeaways: [
    'Organise by feature, keep `shared/` generic, keep `main.js` and `App.vue` small, and let dependencies point one way.',
    'A production shell combines lazy routes with titles and a 404, a global error handler, keyed error boundaries and toasts.',
    'Reusable composables and components (`useAsync`, `useDebouncedRef`, `AsyncState`) make every feature behave consistently — and each one cleans up after itself.',
    'Infrastructure belongs in plugins: one Pinia plugin persists any store that opts in, with picking, validation and versioned keys.',
    'Ship it properly: accessible navigation, tests at the right levels, measured performance, public-only env variables, an SPA fallback and CI.',
  ],
}
